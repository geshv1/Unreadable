// SVG character built on the shared jointed rig. Same look as the series' canvas characters.
import React from 'react';
import {rig, RigInput, Joints} from './rig';
import {C} from '../theme';

type Palette = {skin: string; top: string; bot: string; shoe: string; outfit: string; hair: string; hairCol: string};
export type Mood = 'neutral' | 'angry' | 'sad' | 'shock' | 'calm' | 'smile' | 'smirk';
export type CharProps = RigInput & {pal: Palette; mood?: Mood; blink?: number; look?: number; glow?: number; shadow?: boolean; id: string; children?: (j: Joints) => React.ReactNode; behind?: (j: Joints) => React.ReactNode};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.round(Math.max(0, Math.min(255, k > 1 ? v + (255 - v) * (k - 1) : v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
const Cap: React.FC<{a: number[]; b: number[]; w: number; fill: string; s: number; lx: number}> = ({a, b, w, fill, s, lx}) => (
  <g strokeLinecap="round">
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.ink} strokeWidth={w + 7 * s} />
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={fill} strokeWidth={w} />
    <line x1={a[0] - lx * w * 0.22} y1={a[1] - w * 0.22} x2={b[0] - lx * w * 0.22} y2={b[1] - w * 0.22} stroke="#fff" strokeOpacity={0.28} strokeWidth={w * 0.28} />
  </g>
);

export const Character: React.FC<CharProps> = (props) => {
  const {pal, s = 1, f = 1, mood = 'neutral', blink = 0, look = 0, glow = 0, shadow = true, id} = props;
  const J = rig(props);
  const lx = -f, legW = 37 * s, armW = 29 * s, tw = 60 * s, r = 34 * s;
  const dk = (c: string) => shade(c, 0.68);
  const foot = (L: number[][], col: string) => {const e = L[2]; return (
    <g transform={`translate(${e[0] + 8 * s * f},${e[1] + 2 * s})`}>
      <ellipse rx={25 * s} ry={14 * s} fill={C.ink} /><ellipse cy={-1 * s} rx={21 * s} ry={10.5 * s} fill={col} />
      <ellipse cx={-4 * s * f} cy={-5 * s} rx={9 * s} ry={3 * s} fill="#fff" fillOpacity={0.35} />
    </g>);};
  const hand = (p: number[], col: string) => (<g><circle cx={p[0]} cy={p[1]} r={12.5 * s} fill={C.ink} /><circle cx={p[0]} cy={p[1]} r={9 * s} fill={col} /></g>);
  const leg = (L: number[][], col: string) => (<g><Cap a={L[0]} b={L[1]} w={legW} fill={col} s={s} lx={lx} /><Cap a={L[1]} b={L[2]} w={legW * 0.92} fill={col} s={s} lx={lx} /></g>);
  const arm = (A: number[][], col: string) => (<g><Cap a={A[0]} b={A[1]} w={armW} fill={col} s={s} lx={lx} /><Cap a={A[1]} b={A[2]} w={armW * 0.9} fill={col} s={s} lx={lx} /></g>);
  const [hx, hy] = J.head; const rot = (J.ha * f * 0.6 * 180) / Math.PI;
  // face
  const ink = parseInt(pal.skin.slice(1, 3), 16) < 70 ? 'rgba(255,255,255,.75)' : '#121214';
  let ry = r * 0.15, rx = r * 0.105; if (mood === 'shock') {ry *= 1.35; rx *= 1.25;} if (mood === 'calm') ry *= 0.45; if (mood === 'angry') ry *= 0.8; ry *= Math.max(0.08, 1 - blink);
  const lk = look * r * 0.08; const E = [[f * r * 0.1 + lk, r * 0.04], [f * r * 0.5 + lk, r * 0.02]]; const xm = f * r * 0.3 + lk;
  const brow = (x: number, y: number) => {const inner = Math.sign(xm - x) || f; let yi = -r * 0.27, yo = -r * 0.27;
    if (mood === 'angry') {yi += r * 0.1; yo -= r * 0.04;} else if (mood === 'sad') {yi -= r * 0.09; yo += r * 0.04;} else if (mood === 'shock') {yi -= r * 0.1; yo -= r * 0.1;} else if (mood === 'smirk') {yi -= r * 0.02; yo -= r * 0.06;}
    return <line x1={x + inner * r * 0.13} y1={y + yi} x2={x - inner * r * 0.13} y2={y + yo} stroke={ink} strokeWidth={Math.max(1.5, 2.8 * s)} strokeLinecap="round" />;};
  const mx = f * r * 0.34 + lk, my = r * 0.5, mw = r * 0.2;
  const mouth = mood === 'smile' ? <path d={`M${mx - mw * 0.7} ${my - mw * 0.2} Q${mx} ${my + mw * 0.7} ${mx + mw * 0.7} ${my - mw * 0.2}`} stroke={ink} fill="none" strokeWidth={2.4 * s} strokeLinecap="round" />
    : mood === 'smirk' ? <path d={`M${mx - mw * 0.8} ${my} Q${mx + mw * 0.3} ${my + mw * 0.15} ${mx + mw * 0.9 * f} ${my - mw * 0.45}`} stroke={ink} fill="none" strokeWidth={2.4 * s} strokeLinecap="round" />
    : mood === 'sad' || mood === 'angry' ? <path d={`M${mx - mw * 0.7} ${my + mw * 0.3} Q${mx} ${my - mw * 0.5} ${mx + mw * 0.7} ${my + mw * 0.3}`} stroke={ink} fill="none" strokeWidth={2.4 * s} strokeLinecap="round" />
    : mood === 'shock' ? <ellipse cx={mx} cy={my} rx={mw * 0.35} ry={mw * 0.5} fill={ink} />
    : mood === 'calm' ? <line x1={mx - mw * 0.6} y1={my} x2={mx + mw * 0.6} y2={my} stroke={ink} strokeWidth={2.4 * s} strokeLinecap="round" /> : null;
  // hair
  const hc = pal.hairCol;
  const hair = pal.hair === 'cap' ? (
    <g><path d={`M${-r - 2 * s} ${-2 * s} A${r + 2 * s} ${r + 2 * s} 0 0 1 ${r + 2 * s} ${-2 * s} Z`} fill={hc} stroke={C.ink} strokeWidth={3 * s} />
      <ellipse cx={f * (r + 6 * s)} cy={-4 * s} rx={20 * s} ry={6 * s} fill={hc} stroke={C.ink} strokeWidth={3 * s} />
      <ellipse cx={-f * 6 * s} cy={-r * 0.62} rx={12 * s} ry={4 * s} fill="#fff" fillOpacity={0.18} /></g>
  ) : pal.hair === 'short' ? (
    <g clipPath={`url(#hc-${id})`}><path d={`M${-r * 1.2} ${-r * 0.05} Q${f * r * 0.2} ${-r * 0.55} ${f * r * 1.2} ${-r * 0.25} L${f * r * 1.2} ${-r * 1.3} L${-f * r * 1.2} ${-r * 1.3} Z`} fill={hc} />
      <rect x={f > 0 ? -r * 1.2 : r * 0.45} y={-r} width={r * 0.75} height={r * 1.15} fill={hc} /></g>
  ) : null;
  const shoes = pal.shoe, top = pal.top;
  return (
    <g>
      <defs>
        <clipPath id={`hc-${id}`}><circle cx={0} cy={0} r={r + 3 * s} /></clipPath>
        <radialGradient id={`hg-${id}`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor={shade(pal.skin, 1.18)} /><stop offset="0.7" stopColor={pal.skin} /><stop offset="1" stopColor={shade(pal.skin, 0.82)} /></radialGradient>
        <radialGradient id={`gl-${id}`}><stop offset="0" stopColor="#fff" stopOpacity={0.12 * glow} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></radialGradient>
        <radialGradient id={`sh-${id}`}><stop offset="0" stopColor="#000" stopOpacity={0.6} /><stop offset="1" stopColor="#000" stopOpacity={0} /></radialGradient>
      </defs>
      {shadow && <ellipse cx={props.x} cy={props.y} rx={80 * s} ry={14 * s} fill={`url(#sh-${id})`} />}
      {glow > 0 && <ellipse cx={hx} cy={J.hip[1]} rx={230 * s} ry={260 * s} fill={`url(#gl-${id})`} />}
      {leg(J.LB, dk(pal.bot))}{foot(J.LB, dk(shoes))}
      {arm(J.AB, dk(top))}{hand(J.handB, dk(pal.skin))}
      {props.behind?.(J)}
      <Cap a={J.hip} b={J.neck} w={tw} fill={top} s={s} lx={lx} />
      {pal.outfit === 'hoodie' && (<g>
        <ellipse cx={J.neck[0] - f * 14 * s} cy={J.neck[1] + 2 * s} rx={26 * s} ry={16 * s} fill={C.ink} transform={`rotate(${-17 * f} ${J.neck[0] - f * 14 * s} ${J.neck[1] + 2 * s})`} />
        <ellipse cx={J.neck[0] - f * 14 * s} cy={J.neck[1] + 2 * s} rx={22 * s} ry={12 * s} fill={shade(top, 0.85)} transform={`rotate(${-17 * f} ${J.neck[0] - f * 14 * s} ${J.neck[1] + 2 * s})`} />
        <line x1={J.neck[0] + f * 8 * s} y1={J.neck[1] + 6 * s} x2={J.neck[0] + f * 10 * s} y2={J.neck[1] + 30 * s} stroke="#ddd" strokeWidth={2 * s} />
      </g>)}
      {pal.outfit === 'suit' && (<g>
        <path d={`M${J.neck[0] - 2 * s} ${J.neck[1]} L${J.neck[0] + f * 12 * s} ${J.neck[1] + 36 * s} L${J.neck[0] + f * 20 * s} ${J.neck[1] + 2 * s} Z`} fill="#f4f4f6" />
        <path d={`M${J.neck[0] + f * 9 * s} ${J.neck[1] + 6 * s} L${J.neck[0] + f * 13 * s} ${J.neck[1] + 30 * s} L${J.neck[0] + f * 16 * s} ${J.neck[1] + 6 * s} Z`} fill={C.red} />
      </g>)}
      {leg(J.LF, pal.bot)}{foot(J.LF, shoes)}
      <g transform={`translate(${hx},${hy})`}>
        <circle r={r + 3.5 * s} fill={C.ink} /><circle r={r} fill={`url(#hg-${id})`} />
        <g transform={`rotate(${rot})`}>
          {hair}
          {E.map(([ex, ey], i) => <ellipse key={i} cx={ex} cy={ey} rx={rx * (i ? 1 : 0.85)} ry={ry * (i ? 1 : 0.9)} fill={ink} />)}
          {blink < 0.5 && ink === '#121214' && E.map(([ex, ey], i) => <circle key={'h' + i} cx={ex + rx * 0.35} cy={ey - ry * 0.4} r={rx * 0.28} fill="#fff" fillOpacity={0.85} />)}
          {E.map(([ex, ey], i) => <g key={'b' + i}>{brow(ex, ey)}</g>)}
          {mouth}
        </g>
      </g>
      {arm(J.AF, top)}{hand(J.handF, pal.skin)}
      {props.children?.(J)}
    </g>
  );
};

// Mirrored, faded copy for glossy floor reflections.
export const Reflection: React.FC<{floor: number; opacity?: number; children: React.ReactNode}> = ({floor, opacity = 0.15, children}) => (
  <g transform={`translate(0 ${2 * floor}) scale(1 -1)`} opacity={opacity}>{children}</g>
);
