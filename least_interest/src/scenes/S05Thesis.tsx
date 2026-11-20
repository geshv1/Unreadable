import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character, Reflection} from '../components/Character';
import {Eyebrow, Headline} from '../components/Text';
import {Sfx} from '../components/Sfx';
import {POSE, P, ease, loop, walk, rig} from '../components/rig';
import {spotlights, doorway} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

export const S05Thesis: React.FC = () => {
  const f = useCurrentFrame();
  const bright = ease(f, 10, 40);
  const door = ease(f, 10, 50);
  const go = ease(f, 40, 118, 0, 1, Easing.inOut(Easing.quad));
  const sx = interpolate(go, [0, 1], [690, 862]);
  const sAlpha = 1 - ease(f, 100, 118);
  const set = (t: number) => {spotlights(t, [[330, 0.8, '#ff8a9c'], [700, 0.6 + 0.4 * bright, '#ffffff']]); doorway(t, door);};
  const rPose = P({lean: 0.1, hd: 0.35 + loop(f, 30, -0.05, 0.05), aF: [-1.1, 1.0], aB: [1.1, -1.0]});
  const J = rig({x: 330, y: FLOOR, s: 1.2, f: 1, pose: rPose});
  const sway = loop(f, 50, -8, 8);
  const strings = [J.handF, J.head, J.handB].map((a, i) => <line key={i} x1={[230, 330, 430][i] + sway} y1={700} x2={a[0]} y2={a[1]} stroke={C.red} strokeWidth={2.6} style={{filter: `drop-shadow(0 0 5px ${C.red})`}} />);
  const chars = (pre: string) => (<>
    <Character id={pre + 'r'} pal={PAL.reactive} x={330} y={FLOOR} s={1.2} f={1} pose={rPose} mood="sad" shadow={!pre} />
    <g opacity={sAlpha}><Character id={pre + 's'} pal={PAL.steady} x={sx} y={FLOOR} s={1.2} f={1} pose={f >= 40 ? walk(f * 0.4, 0.9) : POSE.stand} mood="calm" glow={pre ? 0 : 1 + bright} shadow={!pre} /></g>
  </>);
  return (
    <Scene dur={120} set={set} svg={<>{chars('')}{strings}<Reflection floor={FLOOR}>{chars('m')}</Reflection></>}>
      <Eyebrow text="SAME PRESSURE." y={300} />
      <Headline parts={[['Need less. Become '], ['untouchable.', true]]} keyAt={26} y={350} size={74} />
      <Sfx name="low_drone.wav" at={0} volume={0.5} />
    </Scene>
  );
};
