// ============================================================
// TypeScript Types for Table Tennis Physics Simulator
// ============================================================

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BallState {
  position: Vec3;
  velocity: Vec3;
  spin: Vec3; // rad/s
}

export interface SimulationParams {
  speed: number;          // m/s
  verticalAngle: number;  // degrees
  horizontalAngle: number; // degrees
  topSpin: number;        // RPM (positive = top, negative = back)
  sideSpin: number;       // RPM (positive = right sidespin)
  racketAngle: number;    // degrees (opponent's racket angle)
}

export interface TrajectoryPoint {
  position: Vec3;
  speed: number;
  magnusForce: number;   // magnitude of Magnus force
  time: number;
}

export interface BounceEvent {
  position: Vec3;
  time: number;
  index: number;
}

export type SimulationResult = {
  trajectory: TrajectoryPoint[];
  bounces: BounceEvent[];
  outcome: 'hit' | 'net' | 'out_long' | 'out_side' | 'miss';
  landingPoint: Vec3 | null;
  advice: AdviceData;
};

export interface AdviceData {
  spinType: 'heavy-topspin' | 'topspin' | 'neutral' | 'backspin' | 'heavy-backspin';
  sideSpinType: 'left' | 'right' | 'none';
  message: string;
  receiveMethod: string;
  difficulty: 'easy' | 'medium' | 'hard';
  color: string;
}
