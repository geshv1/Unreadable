import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Bubble} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {POSE, P, mixPose, ease, loop, walk} from '../components/rig';
import {rig} from '../components/rig';
import {street} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

const TOP = 700;
export const S03Strings: React.FC = () => {
  const f = useCurrentFrame();
  const drop = ease(f, 30, 55, 0, 1, Easing.out(Easing.cubic));
  const pull = ease(f, 55, 70);
  const nodA = loop(f, 24, -0.35, 0.35) * pull;
  const rPose = mixPose({...POSE.stand, hd: 0.2, lean: 0.08}, P({lean: 0.06, hd: 0.3 + nodA * 0.5, aF: [-1.1 + nodA, 1.0], aB: [1.1 - nodA, -1.0]}), pull);
  const rJ = rig({x: 260, y: FLOOR, s: 1.12, f: 1, pose: rPose});
  const anchors = [rJ.handF, rJ.head, rJ.handB];
  const xs = [160, 260, 360];
  // Steady: strings fall toward him then snap
  const sDrop = ease(f, 35, 60, 0, 1, Easing.out(Easing.cubic)); const snapped = f >= 66; const fall = interpolate(f, [66, 96], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const walkK = ease(f, 108, 178, 0, 1, Easing.inOut(Easing.quad));
  const sx = interpolate(walkK, [0, 1], [820, 1240]);
  const sPose = f >= 108 ? walk(f * 0.42) : {...POSE.stand, hd: -0.05};
  const sTop = 1000; // where steady's strings stop
  const svg = (<>
    <Character id="m" pal={PAL.manip} x={540} y={FLOOR - 20} s={1.15} f={f < 90 ? -1 : 1} pose={P({lean: 0.05, hd: 0.05, aF: [0.9 + loop(f, 30, -0.1, 0.1), 0.6], aB: [-0.1, 0.3]})} mood="smirk" />
    <Character id="r" pal={PAL.reactive} x={260} y={FLOOR} s={1.12} f={1} pose={rPose} mood={pull > 0.5 ? 'sad' : 'neutral'} />
    {anchors.map((a, i) => {const y2 = interpolate(drop, [0, 1], [TOP, a[1]]); const x2 = interpolate(drop, [0, 1], [xs[i], a[0]]); return drop > 0 ? <line key={i} x1={xs[i]} y1={TOP} x2={x2} y2={y2} stroke={C.red} strokeWidth={2.6} style={{filter: `drop-shadow(0 0 5px ${C.red})`}} /> : null;})}
    {!snapped && sDrop > 0 && [760, 820, 880].map((x, i) => <line key={i} x1={x} y1={TOP} x2={x} y2={interpolate(sDrop, [0, 1], [TOP, sTop])} stroke={C.red} strokeWidth={2.6} />)}
    {snapped && fall < 1 && [760, 820, 880].map((x, i) => (<g key={i} opacity={1 - fall}>
      <line x1={x} y1={TOP} x2={x} y2={interpolate(fall, [0, 1], [sTop - 60, TOP])} stroke={C.red} strokeWidth={2.6} />
      <line x1={x + (i - 1) * 30 * fall} y1={sTop - 40 + fall * 420} x2={x + (i - 1) * 50 * fall} y2={sTop + 10 + fall * 460} stroke={C.red} strokeWidth={2.6} />
      {f < 76 && Array.from({length: 6}).map((_, k) => {const a = (k / 6) * Math.PI * 2, kk = interpolate(f, [66, 76], [0, 1]); return <line key={k} x1={x + Math.cos(a) * 6} y1={sTop - 50 + Math.sin(a) * 6} x2={x + Math.cos(a) * (8 + kk * 30)} y2={sTop - 50 + Math.sin(a) * (8 + kk * 30)} stroke={C.red} strokeWidth={3} opacity={1 - kk} />;})}
    </g>))}
    <Character id="s" pal={PAL.steady} x={sx} y={FLOOR} s={1.12} f={f >= 108 ? 1 : -1} pose={sPose} mood="calm" glow={1} />
  </>);
  return (
    <Scene dur={180} set={street} svg={svg}>
      <Eyebrow text="03 · THE STRINGS" y={300} />
      <Tag x={540} y={890} text="MANIPULATOR" red at={2} />
      <Bubble x={540} y={1010} text="DO THIS AND I'LL RESPECT YOU." red at={8} until={64} size={26} />
      <Tag x={260} y={1480} text="NEEDS APPROVAL" red at={70} />
      <Bubble x={780} y={1010} text="I don't need it." at={76} until={128} tail={30} size={30} />
      <PopText parts={[['What you need is where they '], ['pull.', true]]} at={120} y={370} size={60} />
      <Sfx name="string_creak.wav" at={42} volume={0.5} /><Sfx name="string_snap.wav" at={66} volume={0.6} />
    </Scene>
  );
};
