import React from 'react';
import {interpolate, useCurrentFrame, spring, useVideoConfig, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow} from '../components/Text';
import {Tag, Bubble, Stamp} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {POSE, P, mixPose, ease, loop} from '../components/rig';
import {offices} from '../components/sets.js';
import {PAL, FLOOR, C, FONT} from '../theme';

const Paper: React.FC<{x: number; y: number; text: string; hi?: number}> = ({x, y, text, hi = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%) rotate(-3deg)', width: 230, padding: '14px 16px', background: '#ecebe6', border: '3px solid #0a0a0c', borderRadius: 6, boxShadow: `0 10px 30px rgba(0,0,0,.6), 0 0 ${24 * hi}px rgba(255,255,255,${0.6 * hi})`, fontFamily: FONT.head, fontWeight: 900, color: '#111', textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>
    <div style={{fontSize: 16, letterSpacing: '0.25em', color: '#555'}}>OFFER</div>
    <div style={{fontSize: 34, lineHeight: 1.1}}>{text}</div>
    <div style={{height: 3, background: '#bbb', margin: '8px 10px 0'}} />
  </div>
);
const Desk: React.FC<{x0: number}> = ({x0}) => (<g><rect x={x0 + 150} y={1236} width={300} height={22} fill="#0a0a0c" /><rect x={x0 + 153} y={1239} width={294} height={13} fill="#3a2f28" /><rect x={x0 + 160} y={1258} width={14} height={162} fill="#0a0a0c" /><rect x={x0 + 426} y={1258} width={14} height={162} fill="#0a0a0c" /><rect x={x0 + 180} y={1258} width={240} height={110} fill="#1a1512" /></g>);
const Pen: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = -30}) => (<g transform={`translate(${x},${y}) rotate(${rot})`}><rect x={-4} y={-30} width={8} height={44} rx={3} fill="#0a0a0c" /><rect x={-2} y={-28} width={4} height={34} fill={C.red} /></g>);
const Clock: React.FC<{x: number; y: number; n: number; on: number}> = ({x, y, n, on}) => {
  const a = (n / 12) * Math.PI * 2;
  return (<g opacity={on}><circle cx={x} cy={y} r={42} fill="rgba(10,10,12,.92)" stroke="#F2F2F2" strokeWidth={3} /><line x1={x} y1={y} x2={x + Math.sin(a) * 30} y2={y - Math.cos(a) * 30} stroke={C.red} strokeWidth={5} strokeLinecap="round" />
    <text x={x + 62} y={y + 14} fill="#F2F2F2" fontFamily={FONT.head} fontWeight={900} fontSize={44} style={{fontVariantNumeric: 'tabular-nums'}}>{n}</text></g>);
};
export const S01Offer: React.FC = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const slide = ease(f, 2, 20, 0, 1, Easing.out(Easing.cubic));
  const grab = ease(f, 20, 28);
  const rPose = mixPose({...POSE.stand, hd: 0.15, lean: 0.06}, P({lean: 0.2, hd: 0.3, aF: [1.35, 0.25], aB: [-0.1, 0.3]}), grab);
  const sDown = ease(f, 20, 30) * (1 - ease(f, 30, 40));
  const sPose = mixPose({...POSE.stand, hd: 0.1}, P({lean: 0.1, hd: 0.2, aF: [1.2, 0.3], aB: [-0.1, 0.3]}), sDown);
  const tick = f < 40 ? 0 : f < 70 ? 1 : f < 100 ? 2 : 3;
  const clockOn = ease(f, 36, 42) * (1 - ease(f, 104, 112));
  const rewrite = f >= 130;
  const bossR = mixPose(POSE.stand, P({lean: 0.12, hd: 0.2, aF: [1.1, 0.4], aB: [-0.1, 0.3]}), ease(f, 124, 132) * (1 - ease(f, 140, 148)));
  const svg = (<>
    <Character id="b1" pal={PAL.boss} x={330} y={FLOOR} s={1.0} f={-1} pose={{...POSE.stand, hd: 0.08}} mood="smirk" />
    <Character id="b2" pal={PAL.boss} x={872} y={FLOOR} s={1.0} f={-1} pose={bossR} mood={f > 110 && f < 130 ? 'shock' : 'neutral'} />
    <Desk x0={0} /><Desk x0={542} />
    <Character id="r" pal={PAL.reactive} x={110} y={FLOOR + 20} s={1.08} f={1} pose={{...rPose, hd: rPose.hd + loop(f, 7, -0.04, 0.04)}} mood="smile">{(j) => grab > 0.5 ? <Pen x={j.handF[0] + 6} y={j.handF[1] - 10} /> : null}</Character>
    {grab <= 0.5 && <Pen x={250} y={1226} rot={80} />}
    <Character id="s" pal={PAL.steady} x={652} y={FLOOR + 20} s={1.08} f={1} pose={sPose} lift={loop(f, 90, 0, 2)} mood="calm" />
    <Pen x={792} y={1226} rot={80} />
    <Clock x={660} y={1000} n={tick} on={clockOn} />
  </>);
  const px = (x0: number) => interpolate(slide, [0, 1], [x0 + 330, x0 + 230]);
  const hi = rewrite ? interpolate(f, [130, 140, 160], [0, 1, 0.3], {extrapolateRight: 'clamp'}) : 0;
  return (
    <Scene dur={180} set={offices} svg={svg}>
      <Eyebrow text="01 · THE OFFER" y={300} />
      <Paper x={px(0)} y={1160} text="€2,000/mo" />
      <Paper x={px(542)} y={1160} text={rewrite ? '€2,300/mo' : '€2,000/mo'} hi={hi} />
      <Bubble x={190} y={960} text="YES! THANK YOU!" at={28} until={118} tail={-30} size={28} />
      <Stamp x={270} y={1290} text="ACCEPTED €2,000" at={60} rot={-8} />
      <Bubble x={760} y={960} text="I'll think about it." at={110} until={178} tail={-40} size={28} />
      <Tag x={760} y={1480} text="+€3,600 / YEAR" at={150} />
      <Sfx name="pen_click.wav" at={26} /><Sfx name="clock_tick.wav" at={40} /><Sfx name="clock_tick.wav" at={70} /><Sfx name="clock_tick.wav" at={100} /><Sfx name="stamp.wav" at={60} />
    </Scene>
  );
};
