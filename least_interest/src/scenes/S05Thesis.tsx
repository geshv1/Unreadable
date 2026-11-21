// THESIS — Reactive on the floor with the slack rope; Steady walks into the light. The light reaches Reactive last.
import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character, Reflection} from '../components/Character';
import {Eyebrow, Headline} from '../components/Text';
import {Sfx} from '../components/Sfx';
import {P, tween, walk, walkLift, keyPoses} from '../components/rig';
import {spotlights, doorway} from '../components/sets.js';
import {PAL, FLOOR} from '../theme';

export const THESIS_DUR = 84;
const set = (t: number) => {const f = t * 30; const door = tween(f, [0, 34], [0.15, 1]); spotlights(t, [[300, 0.55, '#ff8a9c'], [600, 0.5 + 0.5 * door, '#ffffff']]); doorway(t, door);};
const FLOORSIT = P({lean: -0.1, hd: 0.45, aF: [0.7, 0.6], aB: [0.5, 0.7], lF: [1.5, -0.05], lB: [1.4, 0.08]});
const Layer: React.FC = () => {
  const f = useCurrentFrame();
  const go = tween(f, [6, 68], [0, 1], Easing.inOut(Easing.quad));
  const sx = interpolate(go, [0, 1], [600, 862]);
  const fade = tween(f, [58, 72], [1, 0]);
  const rPose = keyPoses(f, [[0, FLOORSIT], [48, FLOORSIT], [58, {...FLOORSIT, hd: -0.15, lean: -0.15}], [84, {...FLOORSIT, hd: -0.1, lean: -0.12}]]);
  const light = tween(f, [40, 60], [0, 1]);
  const chars = (pre: string) => (<>
    <Character id={pre + 'tr'} pal={PAL.reactive} x={300} y={FLOOR - 18 + 132 * 1.15} s={1.15} f={1} pose={rPose} look={f > 52 ? 1 : 0} mood={f < 54 ? 'sad' : 'shock'} shadow={false} />
    <g opacity={fade}><Character id={pre + 'ts'} pal={PAL.steady} x={sx} y={FLOOR} s={1.15} f={1} pose={walk(f * 0.4, 0.9)} lift={walkLift(f * 0.4, 1.15, 0.9)} mood="calm" glow={pre ? 0 : 1.4} shadow={!pre} /></g>
  </>);
  return (<>
    <defs><linearGradient id="beam" x1="1" x2="0"><stop offset="0" stopColor="rgba(255,240,215,.38)" /><stop offset="1" stopColor="rgba(255,240,215,0)" /></linearGradient></defs>
    {light > 0 && <path d={`M800 ${FLOOR - 4} L940 ${FLOOR - 4} L${interpolate(light, [0, 1], [700, 120])} ${FLOOR + 160} L${interpolate(light, [0, 1], [780, 260])} ${FLOOR + 160} Z`} fill="url(#beam)" />}
    {chars('')}
    <path d={`M150 ${FLOOR - 2} q60 -16 110 0 q55 14 90 -6`} stroke="#c9a46a" strokeWidth={9} fill="none" strokeLinecap="round" />
    <Reflection floor={FLOOR}>{chars('m')}</Reflection>
  </>);
};
export const S05Thesis: React.FC = () => (
  <Scene dur={THESIS_DUR} set={set} Layer={Layer} cam={(f) => ({z: tween(f, [0, 84], [1.0, 1.07]), x: tween(f, [0, 84], [0, -50])})}>
    <Eyebrow text="SAME WORLD. SAME PRESSURE." y={300} />
    <Headline parts={[['Need less. Win '], ['more.', true]]} at={4} keyAt={30} y={350} size={80} />
    <Sfx name="thesis_drone.wav" at={0} volume={0.6} />
    <Sfx name="door_air.wav" at={2} volume={0.45} />
    {[10, 24, 38, 52].map((t) => <Sfx key={t} name="step_hall.wav" at={t} volume={0.4} />)}
    <Sfx name="final_hit.wav" at={30} volume={0.5} />
  </Scene>
);
