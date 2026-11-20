import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow} from '../components/Text';
import {Tag, Zigzag, useCount} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {POSE, mixPose, ease} from '../components/rig';
import {splitDark} from '../components/sets.js';
import {PAL, FLOOR, C, FONT} from '../theme';

const eur = (v: number) => '€' + Math.round(v).toLocaleString('en-US');
// chart path: flat start, crash, then (optionally) recovery
const chartPts = (k: number, recover: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const p = i / 40; let v = 1 + Math.sin(p * 18) * 0.02;
    if (p > 0.55) v = interpolate(p, [0.55, 0.7, 1], [1, 0.7, 0.72]);
    if (recover > 0 && p > 0.7) v = interpolate(p, [0.7, 1], [0.72, interpolate(recover, [0, 1], [0.72, 1.12])]);
    if (p <= k) pts.push([p, v]);
  }
  return pts;
};
const Phone: React.FC<{x: number; red?: boolean; value: number; k: number; recover?: number; sold?: number; closed?: number; label?: string}> = ({x, red, value, k, recover = 0, sold = 0, closed = 0, label}) => {
  const w = 360, h = 360, y = 720; const pts = chartPts(k, recover);
  const path = pts.map(([p, v], i) => `${i ? 'L' : 'M'}${30 + p * (w - 60)} ${300 - (v - 0.6) * 340}`).join(' ');
  const crash = value < 9999;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, height: h, borderRadius: 34, background: '#0f1116', border: '3px solid rgba(242,242,242,.18)', boxShadow: '0 20px 50px rgba(0,0,0,.6)', overflow: 'hidden', opacity: 1 - closed, fontFamily: FONT.bold, fontWeight: 700}}>
      <div style={{padding: '22px 26px 0', fontSize: 18, letterSpacing: '0.25em', color: 'rgba(242,242,242,.6)'}}>{label ?? 'PORTFOLIO'}</div>
      <div style={{padding: '4px 26px', display: 'flex', alignItems: 'baseline', gap: 14, fontFamily: FONT.head, fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>
        <span style={{fontSize: 50, color: crash && !recover ? C.red : C.white, textShadow: crash && !recover ? `0 0 14px ${C.redGlow}` : 'none'}}>{eur(value)}</span>
        {crash && !recover && <span style={{fontSize: 30, color: C.red}}>−30%</span>}
      </div>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}><path d={path} stroke={recover > 0 ? C.white : crash ? C.red : C.white} strokeWidth={5} fill="none" strokeLinejoin="round" />
        <line x1={30} x2={w - 30} y1={300 - 0.4 * 340} y2={300 - 0.4 * 340} stroke="rgba(242,242,242,.25)" strokeDasharray="6 8" strokeWidth={2} /></svg>
      {sold > 0 && <div style={{position: 'absolute', left: 20, right: 20, bottom: 22, padding: '14px 0', borderRadius: 16, background: C.red, color: '#fff', textAlign: 'center', fontFamily: FONT.head, fontWeight: 900, fontSize: 22, lineHeight: 1.15, letterSpacing: '0.05em', opacity: sold, transform: `scale(${interpolate(sold, [0, 1], [0.8, 1])})`}}>SOLD · LOSS LOCKED<br /><span style={{fontSize: 30, fontVariantNumeric: 'tabular-nums'}}>−€3,000</span></div>}
    </div>);
};
export const S04Dip: React.FC = () => {
  const f = useCurrentFrame();
  const k = ease(f, 0, 30, 0.3, 1, Easing.out(Easing.cubic));
  const val = useCount(10000, 7000, 12, 42);
  const sold = ease(f, 78, 86);
  const closed = ease(f, 78, 90) * (1 - ease(f, 100, 108));
  const recover = ease(f, 104, 146, 0, 1, Easing.out(Easing.cubic));
  const recVal = useCount(7000, 11200, 104, 150);
  const panic = ease(f, 60, 72);
  const down = ease(f, 80, 92);
  const svg = (<>
    <Character id="r" pal={PAL.reactive} x={270} y={FLOOR} s={1.0} f={1} pose={{...POSE.phone, lean: 0.1 + panic * 0.15, hd: 0.5 - panic * 0.4}} mood={f < 20 ? 'neutral' : f < 60 ? 'shock' : 'angry'}>{(j) => <rect x={j.handF[0] - 6} y={j.handF[1] - 34} width={24} height={40} rx={5} fill="#0a0a0c" stroke="#9fb4ff" strokeWidth={2} />}</Character>
    <Character id="s" pal={PAL.steady} x={780} y={FLOOR} s={1.0} f={-1} pose={mixPose(POSE.phone, POSE.phoneDown, down)} mood={f < 20 ? 'neutral' : 'calm'}>{(j) => down < 0.5 ? <rect x={j.handF[0] - 18} y={j.handF[1] - 34} width={24} height={40} rx={5} fill="#0a0a0c" stroke="#9fb4ff" strokeWidth={2} /> : null}</Character>
    <g><rect x={840} y={1236} width={110} height={16} fill="#0a0a0c" /><rect x={850} y={1252} width={10} height={168} fill="#0a0a0c" /><rect x={930} y={1252} width={10} height={168} fill="#0a0a0c" /><rect x={843} y={1238} width={104} height={8} fill="#3a2f28" /></g>
    {down >= 0.5 && <g><rect x={870} y={1224} width={46} height={12} rx={3} fill="#0a0a0c" stroke="#444" strokeWidth={2} /></g>}
  </>);
  return (
    <Scene dur={150} set={splitDark} svg={svg}>
      <Eyebrow text="04 · THE DIP" y={300} />
      <Phone x={270} value={val} k={k} sold={sold} />
      {f < 104 ? <Phone x={760} value={val} k={k} closed={closed} /> : <Phone x={760} value={recVal} k={1} recover={recover} label="12 MONTHS LATER" />}
      <Tag x={270} y={1480} text="RENT DUE · NO SAVINGS" red at={40} size={22} />
      <Tag x={780} y={1480} text="EMERGENCY FUND ✓" at={44} size={22} />
      <Zigzag x={285} y={1150} on={ease(f, 60, 70)} />
      <Sfx name="phone_alert.wav" at={14} volume={0.55} />
    </Scene>
  );
};
