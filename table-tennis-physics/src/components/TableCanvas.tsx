import React, { useRef, useEffect, useMemo } from 'react';
import type { SimulationResult } from '../types/physics';
import { TABLE_LENGTH, TABLE_WIDTH, NET_HEIGHT } from '../physics/BallPhysics';

interface TableCanvasProps {
  result: SimulationResult;
}

// ─── Color Helpers ─────────────────────────────────────────
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function magnusColor(magnusForce: number, maxMagnus: number): string {
  const t = clamp(magnusForce / (maxMagnus * 0.7 + 0.001), 0, 1);
  // Green (stable) → Yellow → Red (heavy Magnus)
  if (t < 0.5) {
    const r = Math.round(lerp(52, 251, t * 2));
    const g = Math.round(lerp(211, 191, t * 2));
    const b = Math.round(lerp(153, 36, t * 2));
    return `rgb(${r},${g},${b})`;
  } else {
    const r = Math.round(lerp(251, 239, (t - 0.5) * 2));
    const g = Math.round(lerp(191, 68, (t - 0.5) * 2));
    const b = Math.round(lerp(36, 68, (t - 0.5) * 2));
    return `rgb(${r},${g},${b})`;
  }
}

// ─── Side View (XZ plane) ─────────────────────────────────
function drawSideView(
  ctx: CanvasRenderingContext2D,
  result: SimulationResult,
  x: number,
  y: number,
  w: number,
  h: number,
  maxMagnus: number
) {
  const PAD = 40;
  const viewW = w - PAD * 2;
  const viewH = h - PAD * 2;

  // Table extents in world space
  const worldXMin = -TABLE_LENGTH / 2 - 0.3;
  const worldXMax = TABLE_LENGTH / 2 + 0.5;
  const worldZMin = -0.1;
  const worldZMax = 0.85;

  const toCanvasX = (wx: number) =>
    x + PAD + ((wx - worldXMin) / (worldXMax - worldXMin)) * viewW;
  const toCanvasY = (wz: number) =>
    y + PAD + h - PAD - ((wz - worldZMin) / (worldZMax - worldZMin)) * viewH;

  // Draw label
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.fillText('ВИД СБОКУ (боковая плоскость XZ)', x + PAD, y + 18);

  // ─── Table surface ────────────────────────────────────
  const tableY = toCanvasY(0);
  const tableLeft = toCanvasX(-TABLE_LENGTH / 2);
  const tableRight = toCanvasX(TABLE_LENGTH / 2);

  // Table body
  const tableGrad = ctx.createLinearGradient(0, tableY, 0, tableY + 12);
  tableGrad.addColorStop(0, '#1a5276');
  tableGrad.addColorStop(1, '#0d2d47');
  ctx.fillStyle = tableGrad;
  ctx.fillRect(tableLeft, tableY, tableRight - tableLeft, 12);

  // Table surface highlight
  ctx.fillStyle = '#2471a3';
  ctx.fillRect(tableLeft, tableY, tableRight - tableLeft, 3);

  // White line on table
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tableLeft, tableY + 6);
  ctx.lineTo(tableRight, tableY + 6);
  ctx.stroke();

  // Center line (where net is)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), tableY - 20);
  ctx.lineTo(toCanvasX(0), tableY + 12);
  ctx.stroke();
  ctx.setLineDash([]);

  // ─── Net ─────────────────────────────────────────────
  const netX = toCanvasX(0);
  const netTop = toCanvasY(NET_HEIGHT);
  const netBot = tableY;

  const netGrad = ctx.createLinearGradient(netX, netTop, netX, netBot);
  netGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
  netGrad.addColorStop(1, 'rgba(180,180,180,0.5)');
  ctx.strokeStyle = netGrad;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(netX, netBot);
  ctx.lineTo(netX, netTop);
  ctx.stroke();

  // Net cap
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(netX, netTop, 4, 0, Math.PI * 2);
  ctx.fill();

  // Net mesh lines
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 0.5;
  const netH = netBot - netTop;
  for (let i = 1; i < 5; i++) {
    const ly = netTop + (netH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(netX - 8, ly);
    ctx.lineTo(netX + 8, ly);
    ctx.stroke();
  }

  // ─── Trajectory ───────────────────────────────────────
  const points = result.trajectory;
  if (points.length < 2) return;

  // Draw glow shadow
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx1 = toCanvasX(prev.position.x);
    const cy1 = toCanvasY(prev.position.z);
    const cx2 = toCanvasX(curr.position.x);
    const cy2 = toCanvasY(curr.position.z);

    ctx.strokeStyle = 'rgba(99, 202, 255, 0.08)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.stroke();
  }

  // Draw colored trajectory
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx1 = toCanvasX(prev.position.x);
    const cy1 = toCanvasY(prev.position.z);
    const cx2 = toCanvasX(curr.position.x);
    const cy2 = toCanvasY(curr.position.z);

    const color = magnusColor(curr.magnusForce, maxMagnus);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.stroke();
  }

  // ─── Draw moving ball dot at last position ────────────
  const lastPt = points[points.length - 1];
  const ballX = toCanvasX(lastPt.position.x);
  const ballY = toCanvasY(lastPt.position.z);

  const ballGlow = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, 10);
  ballGlow.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
  ballGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
  ctx.fillStyle = ballGlow;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef9c3';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ─── Draw bounces ─────────────────────────────────────
  for (const bounce of result.bounces) {
    const bx = toCanvasX(bounce.position.x);
    const by = toCanvasY(0);

    // Cross marker
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx - 7, by - 7);
    ctx.lineTo(bx + 7, by + 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 7, by - 7);
    ctx.lineTo(bx - 7, by + 7);
    ctx.stroke();

    // Circle
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ─── Axis labels ──────────────────────────────────────
  ctx.fillStyle = 'rgba(150,180,220,0.7)';
  ctx.font = '10px Inter, sans-serif';
  // X axis labels
  for (let wx = -1.0; wx <= 1.5; wx += 0.5) {
    const cx = toCanvasX(wx);
    ctx.fillText(`${wx.toFixed(1)}м`, cx - 10, tableY + 24);
  }

  // Height labels
  ctx.fillStyle = 'rgba(150,180,220,0.6)';
  for (let wz = 0; wz <= 0.6; wz += 0.2) {
    const cy = toCanvasY(wz);
    ctx.fillText(`${(wz * 100).toFixed(0)}cm`, x + PAD - 35, cy + 4);
  }
}

// ─── Top View (XY plane) ─────────────────────────────────
function drawTopView(
  ctx: CanvasRenderingContext2D,
  result: SimulationResult,
  x: number,
  y: number,
  w: number,
  h: number,
  maxMagnus: number
) {
  const PAD = 40;
  const viewW = w - PAD * 2;
  const viewH = h - PAD * 2;

  const worldXMin = -TABLE_LENGTH / 2 - 0.2;
  const worldXMax = TABLE_LENGTH / 2 + 0.3;
  const worldYMin = -TABLE_WIDTH / 2 - 0.3;
  const worldYMax = TABLE_WIDTH / 2 + 0.3;

  const toCanvasX = (wx: number) =>
    x + PAD + ((wx - worldXMin) / (worldXMax - worldXMin)) * viewW;
  const toCanvasY = (wy: number) =>
    y + PAD + viewH - ((wy - worldYMin) / (worldYMax - worldYMin)) * viewH;

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.fillText('ВИД СВЕРХУ (горизонтальная плоскость XY)', x + PAD, y + 18);

  // ─── Table ─────────────────────────────────────────────
  const tlx = toCanvasX(-TABLE_LENGTH / 2);
  const tly = toCanvasY(TABLE_WIDTH / 2);
  const trw = toCanvasX(TABLE_LENGTH / 2) - tlx;
  const trh = toCanvasY(-TABLE_WIDTH / 2) - tly;

  // Table background
  const tableGrad = ctx.createLinearGradient(tlx, tly, tlx + trw, tly);
  tableGrad.addColorStop(0, '#1a5276');
  tableGrad.addColorStop(0.5, '#2471a3');
  tableGrad.addColorStop(1, '#1a5276');
  ctx.fillStyle = tableGrad;
  ctx.fillRect(tlx, tly, trw, trh);

  // Table border
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(tlx, tly, trw, trh);

  // Center line (net)
  const netX = toCanvasX(0);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(netX, tly);
  ctx.lineTo(netX, tly + trh);
  ctx.stroke();

  // Side lines
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  const midY = toCanvasY(0);
  ctx.beginPath();
  ctx.moveTo(tlx, midY);
  ctx.lineTo(tlx + trw, midY);
  ctx.stroke();

  // ─── Trajectory (projected on XY) ────────────────────
  const points = result.trajectory;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx1 = toCanvasX(prev.position.x);
    const cy1 = toCanvasY(prev.position.y);
    const cx2 = toCanvasX(curr.position.x);
    const cy2 = toCanvasY(curr.position.y);

    const color = magnusColor(curr.magnusForce, maxMagnus);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.stroke();
  }

  // Ball marker
  const lastPt = points[points.length - 1];
  const ballX = toCanvasX(lastPt.position.x);
  const ballY = toCanvasY(lastPt.position.y);
  ctx.fillStyle = '#fef9c3';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bounces in top view
  for (const bounce of result.bounces) {
    const bx = toCanvasX(bounce.position.x);
    const by = toCanvasY(bounce.position.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - 6);
    ctx.lineTo(bx + 6, by + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 6, by - 6);
    ctx.lineTo(bx - 6, by + 6);
    ctx.stroke();
  }
}

// ─── Outcome Overlay ──────────────────────────────────────
function drawOutcome(
  ctx: CanvasRenderingContext2D,
  result: SimulationResult,
  canvasW: number,
  canvasH: number
) {
  const { outcome } = result;

  let text = '';
  let bgColor = '';
  let textColor = '#fff';

  switch (outcome) {
    case 'hit':
      text = '✅ ПОПАДАНИЕ!';
      bgColor = 'rgba(16, 185, 129, 0.9)';
      break;
    case 'net':
      text = '⛔ СЕТКА';
      bgColor = 'rgba(239, 68, 68, 0.9)';
      break;
    case 'out_long':
      text = '📤 АУТ ЗА СТОЛОМ';
      bgColor = 'rgba(249, 115, 22, 0.9)';
      break;
    case 'out_side':
      text = '↔️ АУТ В СТОРОНУ';
      bgColor = 'rgba(249, 115, 22, 0.9)';
      break;
    default:
      return;
  }

  const boxW = 220;
  const boxH = 44;
  const bx = canvasW - boxW - 16;
  const by = 16;

  // Shadow
  ctx.shadowBlur = 20;
  ctx.shadowColor = bgColor;

  // Rounded rect
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = textColor;
  ctx.font = '700 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, bx + boxW / 2, by + 28);
  ctx.textAlign = 'left';
}

// ─── Legend ───────────────────────────────────────────────
function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  const items = [
    { color: '#34d399', label: 'Стабильный полёт' },
    { color: '#f59e0b', label: 'Средний Magnus' },
    { color: '#ef4444', label: 'Сильный Magnus' },
    { color: '#f59e0b', label: '✕ Отскок' },
  ];

  ctx.font = '11px Inter, sans-serif';
  items.forEach((item, i) => {
    const lx = x + i * 160;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(lx + 8, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,220,255,0.8)';
    ctx.fillText(item.label, lx + 18, y + 4);
  });
}

// ─── Main Component ───────────────────────────────────────
const TableCanvas: React.FC<TableCanvasProps> = ({ result }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const maxMagnus = useMemo(() => {
    return result.trajectory.reduce((max, pt) => Math.max(max, pt.magnusForce), 0.001);
  }, [result.trajectory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // ─── Background ──────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0a0f1e');
    bg.addColorStop(1, '#0d1b35');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    const halfH = h / 2 - 8;

    // ─── Divider ─────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, halfH);
    ctx.lineTo(w, halfH);
    ctx.stroke();
    ctx.setLineDash([]);

    // ─── Side View (top half) ─────────────────────────────
    drawSideView(ctx, result, 0, 0, w, halfH, maxMagnus);

    // ─── Top View (bottom half) ───────────────────────────
    drawTopView(ctx, result, 0, halfH, w, h - halfH, maxMagnus);

    // ─── Outcome overlay ─────────────────────────────────
    drawOutcome(ctx, result, w, h);

    // ─── Legend ───────────────────────────────────────────
    drawLegend(ctx, 20, h - 16);
  }, [result, maxMagnus]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl"
      style={{ display: 'block' }}
    />
  );
};

export default TableCanvas;
