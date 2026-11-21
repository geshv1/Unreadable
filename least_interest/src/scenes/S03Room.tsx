// 03 · THE ROOM — chasing attention vs calmly attracting it. The room literally turns its back.
import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Bubble, Zigzag} from '../components/Ui';
import {Glass} from '../components/Props';
import {Sfx} from '../components/Sfx';
import {P, POSE, keyPoses, loop, tween, walk, walkLift, turn, rig} from '../components/rig';
import {party} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

export const ROOM_DUR = 138;
const Y = FLOOR + 36;
const DANCERS = [[150, 0], [300, 1], [640, 2], [760, 3]];
const Layer: React.FC = () => {
  const f = useCurrentFrame();
  // background silhouettes (depth), swaying on their own rhythm
  const bg = DANCERS.map(([x, i]) => (<g key={i} opacity={0.42}><Character id={`rbg${i}`} pal={{...PAL.f1, skin: '#2a2a30', top: '#1a1a1f', bot: '#151519', shoe: '#2a2a30', hairCol: '#0c0c0e'}} x={x} y={FLOOR - 70} s={0.72} f={i % 2 ? -1 : 1} shadow={false} still
    pose={P({lean: loop(f + i * 9, 30, -0.08, 0.08), hd: loop(f + i * 5, 15, -0.1, 0.1), aF: [loop(f + i * 7, 30, 0.4, 2.6), 0.5], aB: [loop(f + i * 7 + 15, 30, 0.3, 2.2), 0.6]})} /></g>));
  // Reactive
  const rx = tween(f, [0, 18, 50, 56], [100, 320, 370, 370], Easing.inOut(Easing.quad));
  const wide = P({lean: -0.06, hd: -0.12 + loop(f, 8, -0.06, 0.06), aF: [2.2 + loop(f, 8, -0.4, 0.4), 0.4], aB: [1.9 + loop(f + 4, 8, -0.4, 0.4), 0.5]});
  const rPose = f < 18 ? walk(f * 0.45) : keyPoses(f, [[18, wide], [50, wide], [62, POSE.slump], [140, P({...POSE.slump, hd: 0.5})]]);
  const rJ = rig({x: rx, y: Y, s: 1.05, f: 1, pose: rPose});
  // friends: start in a circle, turn their backs one by one, then drift to Steady
  const fr: {k: 'f1' | 'f2' | 'f3'; x0: number; x1: number; f0: number; t: number; w: number}[] = [
    {k: 'f1', x0: 470, x1: 610, f0: 1, t: 42, w: 62}, {k: 'f2', x0: 570, x1: 700, f0: -1, t: 26, w: 58}, {k: 'f3', x0: 670, x1: 790, f0: -1, t: 34, w: 66}];
  const friends = fr.map(({k, x0, x1, f0, t, w}, i) => {
    const x = tween(f, [w, w + 34], [x0, x1], Easing.inOut(Easing.quad)); const walking = f >= w && f < w + 34;
    const face = f0 === 1 ? 1 : turn(f, t, -1, 1, 8);
    const talk = P({lean: 0.02, hd: loop(f + i * 6, 20, -0.06, 0.06), aF: [0.6 + loop(f + i * 5, 22, -0.2, 0.3), 1.2], aB: [-0.1, 0.3]});
    const laugh = P({lean: -0.2, hd: -0.35 + loop(f + i * 3, 7, -0.07, 0.07), aF: [0.7, 1.8], aB: [-0.3, 0.6]});
    const pose = walking ? walk(f * 0.42, 0.9) : f >= w + 34 ? keyPoses(f, [[w + 34, talk], [100, talk], [104, laugh]]) : talk;
    return <Character key={k} id={`r${k}`} pal={PAL[k]} x={x} y={Y + i * 4} s={0.98} f={face} pose={pose} lift={walking ? walkLift(f * 0.42, 0.98, 0.9) : 0} mood={f < t ? 'neutral' : f > 100 ? 'smile' : 'calm'} />;
  });
  // Steady by the door
  const toast = tween(f, [94, 100, 108, 116], [0, 1, 1, 0]);
  const sPose = P({lean: -0.07, hd: -0.04 + loop(f, 60, -0.03, 0.03), aF: [0.9 + 1.2 * toast, 1.55 - 0.9 * toast], aB: [-0.15, 0.25]});
  const lines = f >= 60 && f < 104 ? [0, 1, 2].map((i) => {const k = interpolate(f, [60 + i * 5, 96 + i * 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <path key={i} d={`M${860 - 30} ${1150 - i * 26} Q${700} ${1080 - i * 30} ${520 + i * 60} ${1170 - i * 14}`} stroke="#F2F2F2" strokeOpacity={0.55 * Math.min(k * 3, 1, (1 - k) * 3)} strokeWidth={3} strokeDasharray="6 14" strokeDashoffset={-f * 3} fill="none" />;}) : null;
  // isolation: darkness closes in around Reactive
  const iso = tween(f, [50, 62, 80, 96], [0, 1, 1, 0]);
  return (<>
    <defs><radialGradient id="iso"><stop offset="0.25" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.8} /></radialGradient></defs>
    {bg}{lines}{friends}
    <Character id="rr" pal={PAL.reactive} x={rx} y={Y} s={1.05} f={1} pose={rPose} lift={f < 18 ? walkLift(f * 0.45, 1.05) : 0} look={f > 64 ? 1 : 0} mood={f < 48 ? 'smile' : 'sad'} />
    <Character id="rs" pal={PAL.steady} x={860} y={FLOOR + 20} s={1.06} f={-1} pose={sPose} mood={f > 90 ? 'smile' : 'calm'} glow={1}>{(j) => <Glass p={j.handF} />}</Character>
    {iso > 0 && <rect x={0} y={600} width={1080} height={1100} fill="url(#iso)" opacity={iso} transform={`translate(${rJ.head[0] - 540} 0)`} />}
    <Zigzag x={rJ.head[0]} y={rJ.head[1]} on={tween(f, [54, 60, 90, 98], [0, 1, 1, 0])} />
  </>);
};
export const S03Room: React.FC = () => (
  <Scene dur={ROOM_DUR} set={party} Layer={Layer}
    cam={(f) => ({z: tween(f, [0, 50, 62, 76, 104], [1.03, 1.03, 1.1, 1.1, 1.03]), x: tween(f, [0, 50, 62, 76, 104], [60, 60, 120, 120, -40])})}
    world={<>
      <Bubble x={260} y={1000} text="HAHA! GUYS!" red at={16} until={40} size={28} />
      <Bubble x={380} y={990} text="WAIT, LISTEN—" red at={38} until={62} size={28} />
      <Tag x={300} y={1480} text="CHASES ATTENTION" red at={72} size={22} />
      <Tag x={760} y={1480} text="ATTRACTS IT" at={98} size={22} />
    </>}>
    <Eyebrow text="03 · THE ROOM" y={300} />
    <PopText parts={[['Chasing pushes. Calm '], ['pulls.', true]]} at={104} y={370} size={64} />
    <Sfx name="room_bed.wav" at={0} volume={0.6} />
    {[26, 34, 42].map((t) => <Sfx key={t} name="cloth.wav" at={t} volume={0.4} />)}
    <Sfx name="glass_clink.wav" at={100} volume={0.5} />
  </Scene>
);
