import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Stamina, Zigzag, Flash} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {POSE, mixPose, ease, loop} from '../components/rig';
import {ring} from '../components/sets.js';
import {PAL} from '../theme';

const FLR = 1282;
const HOOKS = [20, 50, 80]; // wind-up start frames
export const S02Ring: React.FC = () => {
  const f = useCurrentFrame();
  let rp = POSE.guard, sp = POSE.guard;
  HOOKS.forEach((h) => {
    if (f >= h && f < h + 26) {const w = ease(f, h, h + 9), k = ease(f, h + 9, h + 15), back = ease(f, h + 15, h + 26);
      rp = back > 0 ? mixPose(POSE.hook, POSE.guard, back) : k > 0 ? mixPose(POSE.wind, POSE.hook, k) : mixPose(POSE.guard, POSE.wind, w);}
    const sl = ease(f, h + 8, h + 13) * (1 - ease(f, h + 17, h + 24)); if (sl > 0) sp = mixPose(POSE.guard, POSE.slip, sl);
  });
  const tired = ease(f, 100, 112); if (f >= 106) rp = mixPose(rp, POSE.gassed, tired);
  const jab = ease(f, 118, 124) * (1 - ease(f, 128, 138)); if (jab > 0) sp = mixPose(POSE.guard, POSE.jab, jab);
  const hitK = interpolate(f, [125, 130, 150], [0, 1, 0.3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}); if (f >= 125) rp = mixPose(POSE.gassed, POSE.hit, hitK);
  const push = ease(f, 125, 145, 0, 46, Easing.out(Easing.cubic));
  const rx = 410 - push, sx = 640;
  const stamina = interpolate(f, [20, 110], [100, 18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const bob = loop(f, 14, 0, -6), bob2 = loop(f, 18, 0, -4);
  const svg = (<>
    <Character id="r" pal={{...PAL.reactive, top: '#4a4a52', outfit: 'tee'}} x={rx} y={FLR + (f < 100 ? bob : 0)} s={1.22} f={1} pose={rp} mood={f < 100 ? 'angry' : f < 125 ? 'sad' : 'shock'} />
    <Character id="s" pal={PAL.steady} x={sx} y={FLR + bob2} s={1.22} f={-1} pose={sp} mood="calm" />
    {[0, 1].map((i) => <path key={i} d={`M60 ${FLR - 30 + i * 80} Q540 ${FLR - 16 + i * 80} 1020 ${FLR - 30 + i * 80}`} stroke="#0a0a0c" strokeWidth={14} fill="none" />)}
    <path d={`M60 ${FLR - 30} Q540 ${FLR - 16} 1020 ${FLR - 30}`} stroke="#b31d36" strokeWidth={8} fill="none" />
    <path d={`M60 ${FLR + 50} Q540 ${FLR + 64} 1020 ${FLR + 50}`} stroke="#d9d9de" strokeWidth={8} fill="none" />
    {HOOKS.map((h) => {const k = interpolate(f, [h + 9, h + 17], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}); return k > 0 && k < 1 ? <path key={h} d={`M${rx + 20} ${FLR - 380} A140 140 0 0 1 ${rx + 160} ${FLR - 250}`} stroke="#E5383B" strokeOpacity={1 - k} strokeWidth={6} fill="none" strokeLinecap="round" /> : null;})}
    {f >= 125 && f < 140 && <g>{Array.from({length: 10}).map((_, i) => {const a = (i / 10) * Math.PI * 2, k = interpolate(f, [125, 140], [0, 1]); return <line key={i} x1={rx + 60 + Math.cos(a) * (10 + k * 20)} y1={FLR - 300 + Math.sin(a) * (10 + k * 20)} x2={rx + 60 + Math.cos(a) * (36 + k * 70)} y2={FLR - 300 + Math.sin(a) * (36 + k * 70)} stroke="#fff" strokeOpacity={1 - k} strokeWidth={5} strokeLinecap="round" />;})}</g>}
  </>);
  return (
    <Scene dur={180} set={ring} svg={svg}>
      <Eyebrow text="02 · THE RING" y={300} />
      <Tag x={330} y={690} text="NEEDS TO WIN" red at={6} />
      <Tag x={720} y={690} text="NEEDS NOTHING" at={14} />
      <Stamina x={380} y={760} value={stamina} red={stamina < 50} />
      <Stamina x={690} y={760} value={85} />
      <Zigzag x={rx + 20} y={FLR - 330} on={ease(f, 88, 100)} />
      <PopText parts={[['DESPERATION IS '], ['readable.', true]]} at={134} y={370} size={64} />
      <Flash at={126} len={5} strength={0.16} />
      {HOOKS.map((h) => <Sfx key={h} name="glove_whoosh.wav" at={h + 9} volume={0.45} />)}
      <Sfx name="heavy_impact.wav" at={125} volume={0.7} />
    </Scene>
  );
};
