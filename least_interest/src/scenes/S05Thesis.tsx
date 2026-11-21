import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character, Reflection} from '../components/Character';
import {Eyebrow, Headline} from '../components/Text';
import {Sfx} from '../components/Sfx';
import {P, POSE, ease, walk} from '../components/rig';
import {spotlights, doorway} from '../components/sets.js';
import {PAL, FLOOR} from '../theme';

export const S05Thesis: React.FC = () => {
  const f = useCurrentFrame();
  const door = ease(f, 0, 30); const go = ease(f, 10, 74, 0, 1, Easing.inOut(Easing.quad));
  const sx = interpolate(go, [0, 1], [640, 862]);
  const set = (t: number) => {spotlights(t, [[330, 0.6, '#ff8a9c'], [640, 0.6 + 0.4 * door, '#ffffff']]); doorway(t, door);};
  const sit = P({lean: -0.1, hd: 0.45, aF: [0.7, 0.6], aB: [0.5, 0.7], lF: [1.5, -0.05], lB: [1.4, 0.08]});
  const chars = (pre: string) => (<>
    <Character id={pre + 'r'} pal={PAL.reactive} x={330} y={FLOOR - 25 + 132 * 1.15} s={1.15} f={1} pose={sit} mood="sad" shadow={false} />
    <g opacity={1 - ease(f, 62, 74)}><Character id={pre + 's'} pal={PAL.steady} x={sx} y={FLOOR} s={1.15} f={1} pose={walk(f * 0.4, 0.9)} mood="calm" glow={pre ? 0 : 1.5} shadow={!pre} /></g>
  </>);
  return (
    <Scene dur={75} set={set} svg={<>{chars('')}<path d={`M150 ${FLOOR - 4} q60 -18 120 0 q60 18 110 -4`} stroke="#c9a46a" strokeWidth={9} fill="none" strokeLinecap="round" /><Reflection floor={FLOOR}>{chars('m')}</Reflection></>}>
      <Eyebrow text="SAME WORLD. SAME PRESSURE." y={300} />
      <Headline parts={[['Need less. Win '], ['more.', true]]} keyAt={18} y={350} size={78} />
      <Sfx name="low_drone.wav" at={0} volume={0.45} /><Sfx name="boom.wav" at={18} volume={0.4} />
    </Scene>
  );
};
