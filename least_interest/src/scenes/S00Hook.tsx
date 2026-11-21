// HOOK — tug-of-war. Reactive strains with everything; Steady simply opens his hand.
import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character, Reflection} from '../components/Character';
import {Eyebrow, Headline} from '../components/Text';
import {Zigzag} from '../components/Ui';
import {Puff, Sparks} from '../components/Fx';
import {Sfx} from '../components/Sfx';
import {P, POSE, keyPoses, loop, ease, tween, rig, rotPt} from '../components/rig';
import {hookSet} from '../components/sets.js';
import {PAL, FLOOR} from '../theme';

export const HOOK_DUR = 96;
const REL = 34, HIT = 47;
const PULL = P({lean: -0.4, hd: -0.12, aF: [1.45, 0.08], aB: [1.32, 0.16], lF: [0.52, -0.12], lB: [-0.3, 0.05]});
const FLAIL = P({lean: -0.25, hd: -0.45, aF: [-2.3, 0.7], aB: [-1.9, 0.9], lF: [0.7, -0.5], lB: [0.25, -0.7]});
const LIE = P({lean: -0.1, hd: -0.1, aF: [-1.6, 0.3], aB: [-1.2, 0.5], lF: [0.25, -0.2], lB: [0.05, -0.35]});
const S_HOLD = P({lean: 0.02, hd: 0.04, aF: [1.28, 0.12], aB: [-0.12, 0.2]});
const S_LEAN = P({lean: 0.06, hd: 0.12, aF: [1.36, 0.1], aB: [-0.14, 0.2]});
const S_OPEN = P({lean: -0.03, hd: 0.08, aF: [0.95, 0.55], aB: [-0.12, 0.2]});
const S_DOWN = P({lean: -0.02, hd: 0.32, aF: [0.25, 0.35], aB: [-0.12, 0.2]});

const Layer: React.FC = () => {
  const f = useCurrentFrame();
  const tremble = f < REL ? loop(f, 2.6, -2.2, 2.2) : 0;
  const rx = 360 + tremble, pivotX = 350;
  // fall: eased drop, impact at HIT, one small bounce, settle
  const rot = tween(f, [REL, HIT, HIT + 5, HIT + 10, HIT + 14], [0, -84, -76, -84, -82], Easing.inOut(Easing.quad));
  const slide = tween(f, [REL, HIT], [0, 40], Easing.in(Easing.quad));
  const rPose = f < REL ? {...PULL, hd: PULL.hd + loop(f, 5, -0.05, 0.05), aF: [PULL.aF[0] + loop(f, 3, -0.03, 0.03), PULL.aF[1]] as [number, number]}
    : keyPoses(f, [[REL, PULL], [REL + 6, FLAIL], [HIT + 6, LIE], [76, LIE], [86, {...LIE, hd: 0.3, aF: [-1.0, 0.6]}]]);
  const sPose = keyPoses(f, [[0, S_HOLD], [REL - 6, S_HOLD], [REL - 2, S_LEAN], [REL + 4, S_OPEN], [REL + 22, S_DOWN], [70, {...S_DOWN, aF: [0.55, 1.4], aB: [0.45, 1.5]}], [74, {...S_DOWN, aF: [0.75, 1.25], aB: [0.35, 1.6]}], [78, {...S_DOWN, aF: [0.55, 1.4], aB: [0.45, 1.5]}], [86, S_DOWN]]);
  const rJ0 = rig({x: rx + slide, y: FLOOR, s: 1.2, f: 1, pose: rPose});
  const rHand = rotPt(rJ0.handF, pivotX + slide, FLOOR, rot);
  const sJ = rig({x: 720, y: FLOOR, s: 1.2, f: -1, pose: sPose});
  // rope: taut & humming, then recoils as a decaying wave and drops to the floor
  const free = f >= REL;
  const endX = free ? tween(f, [REL, REL + 10, HIT + 8], [sJ.handF[0], rHand[0] + 250, rHand[0] + 230], Easing.out(Easing.quad)) : sJ.handF[0];
  const endY = free ? tween(f, [REL, REL + 8, HIT + 6], [sJ.handF[1], sJ.handF[1] - 70, FLOOR - 5], Easing.inOut(Easing.quad)) : sJ.handF[1];
  const wave = free ? loop(f, 4, -1, 1) * 55 * interpolate(f, [REL, HIT + 12], [1, 0], {extrapolateRight: 'clamp'}) : loop(f, 2.4, -3, 3);
  const midX = (rHand[0] + endX) / 2, midY = (rHand[1] + endY) / 2 + (free ? 30 : 6);
  const rope = <path d={`M${rHand[0]} ${rHand[1]} Q${midX - 40} ${midY + wave} ${midX} ${midY} T${endX} ${endY}`} stroke="#c9a46a" strokeWidth={9} fill="none" strokeLinecap="round" />;
  const ropeShade = <path d={`M${rHand[0]} ${rHand[1]} Q${midX - 40} ${midY + wave} ${midX} ${midY} T${endX} ${endY}`} stroke="#0a0a0c" strokeWidth={15} fill="none" strokeLinecap="round" />;
  const chars = (pre: string) => (<>
    <g transform={`rotate(${rot} ${pivotX + slide} ${FLOOR})`}><Character id={pre + 'hr'} pal={PAL.reactive} x={rx + slide} y={FLOOR} s={1.2} f={1} pose={rPose} mood={f < REL ? 'angry' : f < 70 ? 'shock' : 'sad'} shadow={!pre} blink={f > 80 ? 0.5 : 0} /></g>
    <Character id={pre + 'hs'} pal={PAL.steady} x={720} y={FLOOR} s={1.2} f={-1} pose={sPose} look={f > REL + 10 ? 1 : 0} mood={f < REL - 2 ? 'calm' : 'smirk'} glow={pre ? 0 : 1} shadow={!pre} />
  </>);
  return (<>
    {ropeShade}{rope}{chars('')}
    <Puff f={f} at={HIT} x={pivotX + slide - 110} y={FLOOR - 6} n={16} spread={180} />
    <Sparks f={f} at={REL} x={sJ.handF[0]} y={sJ.handF[1]} color="#e8d2a0" n={8} r0={6} r1={34} len={9} />
    <Reflection floor={FLOOR}>{chars('m')}</Reflection>
  </>);
};
export const S00Hook: React.FC = () => {
  const f = useCurrentFrame();
  const shake = f >= HIT ? loop(f, 2.2, -1, 1) * 16 * interpolate(f, [HIT, HIT + 16], [1, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}) : 0;
  return (
    <Scene dur={HOOK_DUR} set={hookSet} Layer={Layer}
      cam={(fr) => ({z: tween(fr, [0, 26, HIT, HIT + 4, HIT + 20], [1.22, 1.03, 1.0, 1.07, 1.02], Easing.inOut(Easing.cubic)), x: tween(fr, [0, 26], [-60, 0]) + shake, y: tween(fr, [0, 26], [120, 0]) + shake * 0.6})}
      world={<Zigzag x={rig({x: 360, y: FLOOR, s: 1.2, f: 1, pose: PULL}).head[0]} y={rig({x: 360, y: FLOOR, s: 1.2, f: 1, pose: PULL}).head[1]} on={f < REL ? 1 : 0} />}>
      <Eyebrow text="THE PRINCIPLE OF LEAST INTEREST." y={468} at={-14} />
      <Headline parts={[['Whoever cares less, '], ['wins.', true]]} at={-6} keyAt={HIT + 1} y={506} size={84} />
      <Sfx name="hook_strain.wav" at={0} volume={0.55} />
      <Sfx name="hook_release.wav" at={REL} volume={0.6} />
      <Sfx name="body_fall.wav" at={HIT - 5} volume={0.8} />
      <Sfx name="wins_hit.wav" at={HIT + 1} volume={0.7} />
    </Scene>
  );
};
