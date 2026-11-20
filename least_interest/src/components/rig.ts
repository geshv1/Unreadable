// Jointed stickman rig (same proportions as the series' canvas rig), pure math.
import {interpolate, Easing} from 'remotion';

export type Pose = {lean: number; hd: number; aF: [number, number]; aB: [number, number]; lF: [number, number]; lB: [number, number]};
export const P = (o: Partial<Pose>): Pose => ({lean: 0, hd: 0, aF: [0.12, 0.1], aB: [-0.12, 0.1], lF: [0.06, 0], lB: [-0.06, 0], ...o});
export const mixPose = (a: Pose, b: Pose, k: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * k;
  const l2 = (x: [number, number], y: [number, number]): [number, number] => [l(x[0], y[0]), l(x[1], y[1])];
  return {lean: l(a.lean, b.lean), hd: l(a.hd, b.hd), aF: l2(a.aF, b.aF), aB: l2(a.aB, b.aB), lF: l2(a.lF, b.lF), lB: l2(a.lB, b.lB)};
};
// interpolate-only helpers
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
export const loop = (f: number, period: number, a: number, b: number) => interpolate(f % period, [0, period / 2, period], [a, b, a]);

export const POSE = {
  stand: P({lean: -0.02, hd: -0.06, aF: [0.13, 0.08], aB: [-0.13, 0.08]}),
  slump: P({lean: 0.22, hd: 0.4, aF: [0.08, 0.3], aB: [-0.04, 0.3], lF: [0.04, 0.05], lB: [-0.05, 0.05]}),
  sit: P({lean: -0.12, hd: 0.1, aF: [0.7, 1.45], aB: [0.6, 1.55], lF: [1.45, -1.45], lB: [1.35, -1.35]}),
  guard: P({lean: 0.1, hd: 0.12, aF: [0.75, 2.25], aB: [0.55, 2.45], lF: [0.32, -0.12], lB: [-0.3, 0.08]}),
  jab: P({lean: 0.2, hd: 0.15, aF: [1.58, 0.02], aB: [0.55, 2.45], lF: [0.4, -0.1], lB: [-0.36, 0.1]}),
  wind: P({lean: -0.12, aF: [-1.1, 1.0], aB: [0.6, 1.9], lF: [0.3, -0.1], lB: [-0.34, 0.05]}),
  hook: P({lean: 0.38, hd: 0.2, aF: [2.0, 0.35], aB: [0.2, 1.4], lF: [0.5, -0.25], lB: [-0.45, 0.2]}),
  slip: P({lean: -0.4, hd: -0.2, aF: [0.7, 2.3], aB: [0.5, 2.5], lF: [0.2, -0.2], lB: [-0.38, 0.12]}),
  hit: P({lean: -0.35, hd: -0.45, aF: [0.3, 1.2], aB: [-0.4, 0.6], lF: [0.2, -0.1], lB: [-0.45, 0.15]}),
  gassed: P({lean: 0.3, hd: 0.35, aF: [0.35, 1.0], aB: [0.25, 1.1], lF: [0.3, -0.1], lB: [-0.3, 0.1]}),
  phone: P({lean: 0.1, hd: 0.5, aF: [0.55, 1.55], aB: [0.45, 1.6]}),
  phoneDown: P({lean: -0.02, hd: -0.05, aF: [0.35, 0.9], aB: [-0.1, 0.2]}),
  reach: P({lean: 0.12, hd: 0.15, aF: [1.25, 0.25], aB: [-0.1, 0.3]}),
  writeSit: P({lean: 0.15, hd: 0.25, aF: [1.0, 0.75], aB: [0.9, 0.85], lF: [1.5, -1.5], lB: [1.4, -1.4]}),
  armsCrossedSit: P({lean: -0.1, hd: -0.05, aF: [0.9, 2.0], aB: [0.8, 2.1], lF: [1.5, -1.5], lB: [1.4, -1.4]}),
  nod: P({lean: 0.08, hd: 0.35, aF: [-0.6, 0.4], aB: [0.6, 0.4]}),
  puppet: P({lean: 0.02, hd: 0.25, aF: [-1.2, 0.9], aB: [1.2, -0.9]}),
};
const TAU = Math.PI * 2;
const wave = (ph: number) => interpolate(((ph % TAU) + TAU) % TAU, [0, TAU / 4, TAU / 2, (3 * TAU) / 4, TAU], [0, 1, 0, -1, 0]);
export const walk = (ph: number, amp = 1): Pose => {
  const s = wave(ph), c = wave(ph + TAU / 4);
  return P({lean: 0.05, aF: [-0.4 * s * amp, 0.3], aB: [0.4 * s * amp, 0.3], lF: [0.42 * s * amp, -Math.max(0, c) * 0.75 * amp], lB: [-0.42 * s * amp, -Math.max(0, -c) * 0.75 * amp]});
};

export type RigInput = {x: number; y: number; s?: number; f?: 1 | -1; pose: Pose; lift?: number};
export type Joints = {hip: number[]; neck: number[]; shd: number[]; head: number[]; ha: number; LF: number[][]; LB: number[][]; AF: number[][]; AB: number[][]; handF: number[]; handB: number[]};
const vec = (a: number, L: number, f: number) => [Math.sin(a) * L * f, Math.cos(a) * L];
const add = (p: number[], v: number[]) => [p[0] + v[0], p[1] + v[1]];
export function rig({x, y, s = 1, f = 1, pose: p, lift = 0}: RigInput): Joints {
  const hip = [x, y - (62 + 60) * s - 10 * s - lift];
  const nv = [Math.sin(p.lean) * 102 * s * f, -Math.cos(p.lean) * 102 * s];
  const neck = add(hip, nv);
  const shd = [neck[0] + (hip[0] - neck[0]) * 0.1, neck[1] + (hip[1] - neck[1]) * 0.1];
  const ha = p.lean + p.hd;
  const head = add(neck, [Math.sin(ha) * 42 * s * f + 4 * s * f, -Math.cos(ha) * 42 * s]);
  const limb = (root: number[], a: [number, number], L1: number, L2: number) => {const m = add(root, vec(a[0], L1 * s, f)); const e = add(m, vec(a[0] + a[1], L2 * s, f)); return [root, m, e];};
  const LF = limb(hip, p.lF, 62, 60), LB = limb([hip[0] - 4 * s * f, hip[1]], p.lB, 62, 60);
  const AF = limb(shd, p.aF, 52, 50), AB = limb([shd[0] - 6 * s * f, shd[1]], p.aB, 52, 50);
  return {hip, neck, shd, head, ha, LF, LB, AF, AB, handF: AF[2], handB: AB[2]};
}
