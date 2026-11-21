// Small SVG effects: dust puffs, sparks, spray, breath vapor, light sheens. All interpolate-driven.
import React from 'react';
import {interpolate, Easing} from 'remotion';
const CL = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const R = (i: number, k: number) => {const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x);};
export const Puff: React.FC<{f: number; at: number; x: number; y: number; n?: number; spread?: number; color?: string; len?: number}> = ({f, at, x, y, n = 14, spread = 140, color = '#b9b4ab', len = 26}) => {
  const k = interpolate(f, [at, at + len], [0, 1], {...CL, easing: Easing.out(Easing.cubic)}); if (f < at || k >= 1) return null;
  return <g>{Array.from({length: n}).map((_, i) => {const a = -Math.PI * (0.05 + 0.9 * R(i, 1)), d = spread * (0.4 + 0.6 * R(i, 2)) * k; const r = (6 + 18 * R(i, 3)) * (0.6 + k);
    return <circle key={i} cx={x + Math.cos(a) * d * (R(i, 4) > 0.5 ? 1 : -1)} cy={y + Math.sin(a) * d * 0.45} r={r} fill={color} opacity={(1 - k) * 0.28} />;})}</g>;
};
export const Spray: React.FC<{f: number; at: number; x: number; y: number; n?: number; color?: string}> = ({f, at, x, y, n = 18, color = '#e9f1ff'}) => {
  const t = (f - at) / 30; if (f < at || t > 0.8) return null;
  return <g>{Array.from({length: n}).map((_, i) => {const vx = (R(i, 5) - 0.5) * 260, vy = -220 - R(i, 6) * 260; const px = x + vx * t, py = y + vy * t + 900 * t * t;
    return <circle key={i} cx={px} cy={py} r={2 + 2 * R(i, 7)} fill={color} opacity={interpolate(t, [0, 0.8], [0.9, 0])} />;})}</g>;
};
export const Vapor: React.FC<{f: number; x: number; y: number; period?: number; dir?: number}> = ({f, x, y, period = 26, dir = 1}) => {
  const k = (f % period) / period;
  return <g>{[0, 1].map((i) => {const kk = (k + i * 0.5) % 1; return <circle key={i} cx={x + dir * (10 + kk * 60)} cy={y - kk * 22} r={8 + kk * 26} fill="#e8edf6" opacity={(1 - kk) * 0.22 * interpolate(kk, [0, 0.15], [0, 1], CL)} />;})}</g>;
};
export const Sparks: React.FC<{f: number; at: number; x: number; y: number; color?: string; n?: number; len?: number; r0?: number; r1?: number}> = ({f, at, x, y, color = '#fff', n = 10, len = 12, r0 = 10, r1 = 70}) => {
  const k = interpolate(f, [at, at + len], [0, 1], {...CL, easing: Easing.out(Easing.cubic)}); if (f < at || k >= 1) return null;
  return <g>{Array.from({length: n}).map((_, i) => {const a = (i / n) * Math.PI * 2 + R(i, 8) * 0.4; return <line key={i} x1={x + Math.cos(a) * (r0 + k * 20)} y1={y + Math.sin(a) * (r0 + k * 20)} x2={x + Math.cos(a) * (r0 + 10 + k * r1)} y2={y + Math.sin(a) * (r0 + 10 + k * r1)} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={1 - k} />;})}</g>;
};
