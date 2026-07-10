// ============================================================
// Table Tennis Ball Physics Engine
// Euler integration, dt = 0.001s
// Forces: Gravity, Aerodynamic Drag, Magnus Effect
// ============================================================

import type {
  Vec3,
  BallState,
  SimulationParams,
  TrajectoryPoint,
  BounceEvent,
  SimulationResult,
  AdviceData,
} from '../types/physics';

// ─── Physical Constants ────────────────────────────────────
const MASS = 0.0027;          // kg
const DIAMETER = 0.04;        // m
const RADIUS = DIAMETER / 2;
const RHO = 1.29;             // kg/m³ - air density
const G = 9.81;               // m/s² - gravity
const CD = 0.47;              // aerodynamic drag coefficient
const CM = 0.00041;           // Magnus coefficient (empirical)

// Cross-sectional area of ball
const AREA = Math.PI * RADIUS * RADIUS;

// ─── Table Constants ───────────────────────────────────────
const TABLE_LENGTH = 2.74;    // m (2 × 1.37)
const TABLE_WIDTH = 1.525;    // m (2 × 0.7625)
const TABLE_HEIGHT = 0.76;    // m (standard table height)
const NET_HEIGHT = 0.1525;    // m
const BOUNCE_RESTITUTION = 0.90; // coefficient of restitution (vertical)
const FRICTION_COEFF = 0.25;  // friction at bounce (spin → velocity transfer)
const MAX_SIM_TIME = 5.0;     // seconds max simulation
const DT = 0.001;             // integration time step

// ─── Vector Math Helpers ───────────────────────────────────
function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vec3Magnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

// ─── RPM → rad/s conversion ────────────────────────────────
function rpmToRadS(rpm: number): number {
  return rpm * (2 * Math.PI) / 60;
}

// ─── Compute forces at a given state ───────────────────────
function computeAcceleration(state: BallState): Vec3 {
  const { velocity: v, spin: omega } = state;
  const vMag = vec3Magnitude(v);

  // 1. Gravity
  const fg: Vec3 = { x: 0, y: 0, z: -G };

  // 2. Aerodynamic drag: F_d = -0.5 * Cd * rho * A * |v| * v / m
  let fd: Vec3 = { x: 0, y: 0, z: 0 };
  if (vMag > 0.0001) {
    const dragFactor = -0.5 * CD * RHO * AREA * vMag / MASS;
    fd = vec3Scale(v, dragFactor);
  }

  // 3. Magnus effect: F_m = Cm * rho * D^3 * (omega × v) / m
  const omegaCrossV = vec3Cross(omega, v);
  const magnusFactor = CM * RHO * DIAMETER * DIAMETER * DIAMETER / MASS;
  const fm = vec3Scale(omegaCrossV, magnusFactor);

  return {
    x: fg.x + fd.x + fm.x,
    y: fg.y + fd.y + fm.y,
    z: fg.z + fd.z + fm.z,
  };
}

// ─── Main Simulation Function ─────────────────────────────
export function simulate(params: SimulationParams): SimulationResult {
  const { speed, verticalAngle, horizontalAngle, topSpin, sideSpin } = params;

  // Convert angles to radians
  const vAngleRad = (verticalAngle * Math.PI) / 180;
  const hAngleRad = (horizontalAngle * Math.PI) / 180;

  // Initial velocity vector
  // Ball starts at one end of the table (x = -1.37m = -TABLE_LENGTH/2)
  const vx0 = speed * Math.cos(vAngleRad) * Math.cos(hAngleRad);
  const vy0 = speed * Math.cos(vAngleRad) * Math.sin(hAngleRad);
  const vz0 = speed * Math.sin(vAngleRad);

  // Spin vector (omega in rad/s)
  // topSpin: positive = topspin (omega around y-axis, positive → ball curves down)
  // sideSpin: positive = sidespin to the right (omega around z-axis)
  const omegaX = 0; // No forward roll spin component by default
  const omegaY = rpmToRadS(sideSpin);  // sidespin around vertical axis
  const omegaZ = -rpmToRadS(topSpin); // topspin/backspin around lateral axis

  // Initial state — ball starts at left end of table, 30cm above
  const initialState: BallState = {
    position: { x: -TABLE_LENGTH / 2, y: 0, z: 0.30 },
    velocity: { x: vx0, y: vy0, z: vz0 },
    spin: { x: omegaX, y: omegaY, z: omegaZ },
  };

  const trajectory: TrajectoryPoint[] = [];
  const bounces: BounceEvent[] = [];

  let state: BallState = { ...initialState };
  let time = 0;
  let outcome: SimulationResult['outcome'] = 'miss';
  let landingPoint: Vec3 | null = null;
  let bounceCount = 0;

  // Store initial point
  trajectory.push({
    position: { ...state.position },
    speed: vec3Magnitude(state.velocity),
    magnusForce: vec3Magnitude(vec3Scale(vec3Cross(state.spin, state.velocity), CM * RHO * DIAMETER ** 3 / MASS)),
    time,
  });

  // ─── Euler Integration Loop ──────────────────────────────
  while (time < MAX_SIM_TIME) {
    // Compute acceleration
    const accel = computeAcceleration(state);

    // Update velocity (Euler)
    const newVel: Vec3 = {
      x: state.velocity.x + accel.x * DT,
      y: state.velocity.y + accel.y * DT,
      z: state.velocity.z + accel.z * DT,
    };

    // Update position (Euler)
    const newPos: Vec3 = {
      x: state.position.x + state.velocity.x * DT,
      y: state.position.y + state.velocity.y * DT,
      z: state.position.z + state.velocity.z * DT,
    };

    time += DT;

    // ─── Boundary Checks ─────────────────────────────────

    // Check net crossing: ball crosses x=0 (net position)
    if (state.position.x < 0 && newPos.x >= 0) {
      // Interpolate z at x=0
      const t_net = -state.position.x / (newPos.x - state.position.x);
      const z_at_net = state.position.z + t_net * (newPos.z - state.position.z);
      const y_at_net = state.position.y + t_net * (newPos.y - state.position.y);

      if (z_at_net <= NET_HEIGHT && Math.abs(y_at_net) <= TABLE_WIDTH / 2) {
        // Hit net
        outcome = 'net';
        landingPoint = { x: 0, y: y_at_net, z: z_at_net };
        trajectory.push({
          position: landingPoint,
          speed: vec3Magnitude(newVel),
          magnusForce: 0,
          time,
        });
        break;
      }
    }

    // Check bounce: ball hits table surface (z <= TABLE_HEIGHT = 0 in simulation)
    if (newPos.z <= 0 && newVel.z < 0) {
      // Only if within table bounds
      const withinTable =
        Math.abs(newPos.x) <= TABLE_LENGTH / 2 &&
        Math.abs(newPos.y) <= TABLE_WIDTH / 2;

      if (withinTable) {
        bounceCount++;

        // Record bounce
        const bouncePos: Vec3 = { ...newPos, z: 0 };
        bounces.push({
          position: bouncePos,
          time,
          index: trajectory.length,
        });

        // If landing on opponent's side (x > 0) — potential "hit"
        if (newPos.x > 0 && landingPoint === null) {
          landingPoint = bouncePos;
          outcome = 'hit';
        }

        // Bounce physics:
        // Vertical: reverse with restitution
        newVel.z = -newVel.z * BOUNCE_RESTITUTION;

        // Horizontal: spin → velocity conversion (friction)
        // topspin (omega.z negative) adds forward velocity on bounce
        // backspin (omega.z positive) subtracts
        const spinEffect = -state.spin.z * RADIUS * FRICTION_COEFF;
        newVel.x += spinEffect;

        // Sidespin effect
        const sideEffect = state.spin.y * RADIUS * FRICTION_COEFF;
        newVel.y += sideEffect;

        // Spin damping on bounce
        state = {
          ...state,
          spin: vec3Scale(state.spin, 0.7),
        };

        newPos.z = Math.abs(newPos.z) * 0.01; // prevent clipping

        // Stop after 3 bounces
        if (bounceCount >= 3) {
          break;
        }
      } else {
        // Ball hit the floor / went out
        if (newPos.x > TABLE_LENGTH / 2) {
          outcome = 'out_long';
        } else if (Math.abs(newPos.y) > TABLE_WIDTH / 2) {
          outcome = 'out_side';
        }

        if (landingPoint === null) {
          landingPoint = { ...newPos, z: 0 };
        }
        break;
      }
    }

    // Ball flew past table end
    if (newPos.x > TABLE_LENGTH / 2 + 0.5) {
      if (outcome === 'miss') outcome = 'out_long';
      break;
    }

    // Update state
    state = {
      position: newPos,
      velocity: newVel,
      spin: state.spin,
    };

    // Record every 5th point to reduce array size
    if (trajectory.length % 5 === 0 || time < 0.05) {
      const magnusMag = vec3Magnitude(
        vec3Scale(vec3Cross(state.spin, state.velocity), CM * RHO * DIAMETER ** 3 / MASS)
      );
      trajectory.push({
        position: { ...state.position },
        speed: vec3Magnitude(state.velocity),
        magnusForce: magnusMag,
        time,
      });
    }
  }

  // ─── Generate Advice ─────────────────────────────────────
  const advice = generateAdvice(params, outcome, landingPoint);

  return {
    trajectory,
    bounces,
    outcome,
    landingPoint,
    advice,
  };
}

// ─── Advice Generation ────────────────────────────────────
function generateAdvice(
  params: SimulationParams,
  outcome: SimulationResult['outcome'],
  landingPoint: Vec3 | null
): AdviceData {
  const { topSpin, sideSpin } = params;
  const absTopSpin = Math.abs(topSpin);
  const absSideSpin = Math.abs(sideSpin);

  // Determine spin type
  let spinType: AdviceData['spinType'] = 'neutral';
  if (topSpin > 3000) spinType = 'heavy-topspin';
  else if (topSpin > 800) spinType = 'topspin';
  else if (topSpin < -3000) spinType = 'heavy-backspin';
  else if (topSpin < -800) spinType = 'backspin';

  // Determine sidespin direction
  let sideSpinType: AdviceData['sideSpinType'] = 'none';
  if (absSideSpin > 500) {
    sideSpinType = sideSpin > 0 ? 'right' : 'left';
  }

  let message = '';
  let receiveMethod = '';
  let difficulty: AdviceData['difficulty'] = 'medium';
  let color = '#10b981'; // emerald

  if (outcome === 'net') {
    message = '⛔ Мяч попал в сетку';
    receiveMethod = 'Скорректируйте угол вылета или уменьшите подрезку';
    difficulty = 'easy';
    color = '#ef4444';
  } else if (outcome === 'out_long') {
    message = '📤 Аут! Мяч улетел за стол';
    receiveMethod = 'Уменьшите начальную скорость или вертикальный угол';
    difficulty = 'easy';
    color = '#f97316';
  } else if (outcome === 'out_side') {
    message = '↔️ Аут! Мяч вылетел в сторону';
    receiveMethod = 'Скорректируйте горизонтальный угол';
    difficulty = 'easy';
    color = '#f97316';
  } else {
    // Ball lands on table
    switch (spinType) {
      case 'heavy-topspin':
        message = '🌀 Сильный топ-спин!';
        receiveMethod =
          'Мяч резко уйдёт ВНИЗ от вашей ракетки. Закройте лопасть ракетки (наклоните вперёд) и выполните амортизирующее движение, гася скорость мяча.';
        difficulty = 'hard';
        color = '#ef4444';
        break;
      case 'topspin':
        message = '↗️ Топ-спин';
        receiveMethod =
          'Мяч пойдёт вверх от вашей ракетки. Слегка закройте ракетку и сделайте движение сверху-вниз для контроля.';
        difficulty = 'medium';
        color = '#f59e0b';
        break;
      case 'heavy-backspin':
        message = '🌀 Сильная подрезка!';
        receiveMethod =
          'Мяч упадёт в сетку! Откройте ракетку (наклоните назад), подтолкните мяч вперёд-вверх под углом. Движение снизу-вверх обязательно.';
        difficulty = 'hard';
        color = '#8b5cf6';
        break;
      case 'backspin':
        message = '↙️ Подрезка';
        receiveMethod =
          'Мяч свалится в сетку. Откройте ракетку и толкните мяч вперёд-вверх.';
        difficulty = 'medium';
        color = '#6366f1';
        break;
      default:
        message = '✅ Нейтральный мяч';
        receiveMethod = 'Стандартный приём. Ракетка вертикально, контролируемый удар.';
        difficulty = 'easy';
        color = '#10b981';
    }

    // Add sidespin advice
    if (sideSpinType !== 'none') {
      const direction = sideSpinType === 'right' ? 'вправо' : 'влево';
      receiveMethod += ` Боковой спин: мяч отклонится ${direction} — компенсируйте направление удара.`;
    }
  }

  // Landing point info
  if (landingPoint && outcome === 'hit') {
    const zone = landingPoint.x > 0.5 ? 'глубокая зона' : 'средняя зона';
    const side = Math.abs(landingPoint.y) < 0.3 ? 'центр' :
      landingPoint.y > 0 ? 'правый фланг' : 'левый фланг';
    message += ` · Приземление: ${zone}, ${side}`;
  }

  return {
    spinType,
    sideSpinType,
    message,
    receiveMethod,
    difficulty,
    color,
  };
}

// ─── Utility exports ──────────────────────────────────────
export { TABLE_LENGTH, TABLE_WIDTH, TABLE_HEIGHT, NET_HEIGHT };
