// Jointed stickman rig + motion helpers. Everything is driven by interpolate()/spring().
import {interpolate, Easing} from 'remotion';

export type Pose = {lean: number; hd: number; aF: [number, number]; aB: [number, number]; lF: [number, number]; lB: [number, number]};
export const P = (o: Partial<Pose>): Pose => ({lean: 0, hd: 0, aF: [0.12, 0.1], aB: [-0.12, 0.1], lF: [0.06, 0], lB: [-0.06, 0], ...o});
export const mixPose = (a: Pose, b: Pose, k: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * k;
  const l2 = (x: [number, number], y: [number, number]): [number, number] => [l(x[0], y[0]), l(x[1], y[1])];
  return {lean: l(a.lean, b.lean), hd: l(a.hd, b.hd), aF: l2(a.aF, b.aF), aB: l2(a.aB, b.aB), lF: l2(a.lF, b.lF), lB: l2(a.lB, b.lB)};
};
/** Chain of key poses: [[frame, pose, easing?], ...] -> pose at frame f (smooth eased blends). */
export const keyPoses = (f: number, keys: [number, Pose][], e = Easing.inOut(Easing.cubic)): Pose => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, pa] = keys[i], [b, pb] = keys[i + 1];
    if (f <= b) return mixPose(pa, pb, interpolate(f, [a, b], [0, 1], {easing: e}));
  }
  return keys[keys.length - 1][1];
};
const CL = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...CL, easing: e});
/** Multi-key tween with per-segment smoothing. */
export const tween = (f: number, input: number[], output: number[], e = Easing.inOut(Easing.cubic)) => interpolate(f, input, output, {...CL, easing: e});

const SIN = Easing.inOut(Easing.sin);
const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);
/** Exact cosine built from interpolate + sine easing (keeps the "interpolate only" rule, perfectly smooth). */
export const cosW = (ph: number) => {const p = frac(ph / TAU); return p < 0.5 ? interpolate(p, [0, 0.5], [1, -1], {easing: SIN}) : interpolate(p, [0.5, 1], [-1, 1], {easing: SIN});};
export const sinW = (ph: number) => cosW(ph - TAU / 4);
/** Smooth back-and-forth a→b→a with the given period in frames. */
export const loop = (f: number, period: number, a: number, b: number) => a + (b - a) * (0.5 - 0.5 * cosW((f / period) * TAU));
/** Organic drift: sum of two incommensurate smooth loops in [-1, 1]. */
export const drift = (f: number, seed = 0) => 0.6 * sinW(f / 37 + seed) + 0.4 * sinW(f / 23 + seed * 1.7);
/** Smooth facing change: returns a fractional facing (-1..1); the rig squashes horizontally through the turn. */
export const turn = (f: number, at: number, from: number, to: number, len = 7) => interpolate(f, [at, at + len], [from, to], {...CL, easing: Easing.inOut(Easing.quad)});

export const POSE = {
  stand: P({lean: -0.02, hd: -0.06, aF: [0.13, 0.08], aB: [-0.13, 0.08]}),
  slump: P({lean: 0.22, hd: 0.4, aF: [0.08, 0.3], aB: [-0.04, 0.3], lF: [0.04, 0.05], lB: [-0.05, 0.05]}),
  sit: P({lean: -0.12, hd: 0.1, aF: [0.7, 1.45], aB: [0.6, 1.55], lF: [1.45, -1.45], lB: [1.35, -1.35]}),
  phone: P({lean: 0.1, hd: 0.5, aF: [0.55, 1.55], aB: [0.45, 1.6]}),
  phoneDown: P({lean: -0.02, hd: -0.05, aF: [0.35, 0.9], aB: [-0.1, 0.2]}),
  reach: P({lean: 0.12, hd: 0.15, aF: [1.25, 0.25], aB: [-0.1, 0.3]}),
  handsOnHead: P({lean: 0.3, hd: 0.55, aF: [2.3, 1.6], aB: [2.1, 1.7]}),
  crouch: P({lean: 0.55, hd: 0.25, aF: [1.0, 0.4], aB: [0.6, 0.6], lF: [1.0, -1.4], lB: [0.7, -1.3]}),
  drink: P({lean: -0.12, hd: -0.55, aF: [2.45, 0.9], aB: [-0.1, 0.3]}),
  wave: P({lean: -0.04, hd: -0.12, aF: [2.6, 0.6], aB: [-0.25, 0.5]}),
  gesture: P({lean: 0.08, hd: 0.02, aF: [1.2, 0.7], aB: [0.9, 0.8]}),
};
export const walk = (ph: number, amp = 1): Pose => {
  const s = sinW(ph), c = cosW(ph);
  return P({lean: 0.05 * amp, hd: 0.03 * sinW(ph * 2), aF: [-0.42 * s * amp, 0.28 + 0.22 * Math.max(0, s) * amp], aB: [0.42 * s * amp, 0.28 + 0.22 * Math.max(0, -s) * amp],
    lF: [0.42 * s * amp, -Math.max(0, c) * 0.8 * amp], lB: [-0.42 * s * amp, -Math.max(0, -c) * 0.8 * amp]});
};
/** Hip rises when the legs pass each other, dips at full stride. */
export const walkLift = (ph: number, s = 1, amp = 1) => 5 * s * amp * (0.5 + 0.5 * cosW(ph * 2));
export const run = (ph: number): Pose => {
  const s = sinW(ph), c = cosW(ph);
  return P({lean: 0.22, hd: -0.08, aF: [-0.8 * s, 1.75], aB: [0.8 * s, 1.75], lF: [0.8 * s, -Math.max(0, c) * 1.5 - 0.2], lB: [-0.8 * s, -Math.max(0, -c) * 1.5 - 0.2]});
};
export const runLift = (ph: number, s = 1) => 12 * s * (0.5 + 0.5 * cosW(ph * 2));
export const rotPt = (p: number[], cx: number, cy: number, deg: number) => {
  const a = (deg * Math.PI) / 180, dx = p[0] - cx, dy = p[1] - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
};

export type RigInput = {x: number; y: number; s?: number; f?: number; pose: Pose; lift?: number; breath?: number};
export type Joints = {hip: number[]; neck: number[]; shd: number[]; head: number[]; ha: number; LF: number[][]; LB: number[][]; AF: number[][]; AB: number[][]; handF: number[]; handB: number[]};
const vec = (a: number, L: number, f: number) => [Math.sin(a) * L * f, Math.cos(a) * L];
const add = (p: number[], v: number[]) => [p[0] + v[0], p[1] + v[1]];
export function rig({x, y, s = 1, f = 1, pose: p, lift = 0, breath = 0}: RigInput): Joints {
  const hip = [x, y - (62 + 60) * s - 10 * s - lift];
  const tl = 102 * s * (1 + 0.02 * breath);
  const nv = [Math.sin(p.lean) * tl * f, -Math.cos(p.lean) * tl];
  const neck = add(hip, nv);
  const shd = [neck[0] + (hip[0] - neck[0]) * 0.1, neck[1] + (hip[1] - neck[1]) * 0.1];
  const ha = p.lean + p.hd;
  const head = add(neck, [Math.sin(ha) * 42 * s * f + 4 * s * f, -Math.cos(ha) * 42 * s]);
  const limb = (root: number[], a: [number, number], L1: number, L2: number) => {const m = add(root, vec(a[0], L1 * s, f)); const e = add(m, vec(a[0] + a[1], L2 * s, f)); return [root, m, e];};
  const LF = limb(hip, p.lF, 62, 60), LB = limb([hip[0] - 4 * s * f, hip[1]], p.lB, 62, 60);
  const AF = limb(shd, p.aF, 52, 50), AB = limb([shd[0] - 6 * s * f, shd[1]], p.aB, 52, 50);
  return {hip, neck, shd, head, ha, LF, LB, AF, AB, handF: AF[2], handB: AB[2]};
}
