import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Bubble} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {P, POSE, loop, ease, walk} from '../components/rig';
import {party} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

export const S03Room: React.FC = () => {
  const f = useCurrentFrame();
  const hop = interpolate(f, [0, 18, 30, 48, 60], [160, 300, 300, 470, 470], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const pull = ease(f, 66, 118, 0, 1, Easing.inOut(Easing.cubic));
  const friends: [keyof typeof PAL, number, number][] = [['f1', 260, 650], ['f2', 400, 720], ['f3', 560, 690]];
  const laugh = P({lean: -0.18, hd: -0.35 + loop(f, 6, -0.08, 0.08), aF: [0.6, 1.9], aB: [-0.3, 0.6]});
  const svg = (<>
    {friends.map(([k, x0, x1], i) => {const x = interpolate(pull, [0, 1], [x0, x1]); const awayFrom = hop; const turned = f < 66 ? (awayFrom < x0 ? 1 : -1) : 1;
      return <Character key={k} id={k} pal={PAL[k] as any} x={x} y={FLOOR + 30 + i * 6} s={0.98} f={turned as 1 | -1} pose={f >= 66 && pull < 1 ? walk(f * 0.4) : P({lean: 0.02, aF: [0.5, 1.4], aB: [-0.1, 0.3]})} mood={f < 66 ? 'neutral' : 'smile'} />;})}
    <Character id="r" pal={PAL.reactive} x={f < 66 ? hop : interpolate(ease(f, 66, 100), [0, 1], [470, 230])} y={FLOOR + 40} s={1.05} f={f < 66 ? 1 : -1} pose={f < 62 ? laugh : P({lean: 0.18, hd: 0.45, aF: [0.1, 0.3], aB: [-0.05, 0.3]})} mood={f < 62 ? 'smile' : 'sad'} />
    <Character id="s" pal={PAL.steady} x={830} y={FLOOR + 20} s={1.08} f={-1} pose={P({lean: -0.06, hd: -0.05, aF: [0.9, 1.6], aB: [-0.15, 0.2]})} mood={f > 80 ? 'smile' : 'calm'} glow={1}>{(j) => <rect x={j.handF[0] - 10} y={j.handF[1] - 30} width={20} height={32} rx={4} fill="#0a0a0c" stroke="rgba(230,170,60,.9)" strokeWidth={3} />}</Character>
    {f >= 66 && [0, 1, 2].map((i) => {const k = interpolate(f, [66 + i * 4, 90 + i * 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}); return <path key={i} d={`M${830 - 40} ${1180 - i * 30} Q${640} ${1100 - i * 40} ${470 - i * 60} ${1180 - i * 20}`} stroke="#F2F2F2" strokeOpacity={0.5 * (1 - Math.abs(k - 0.5) * 2) + 0.15} strokeWidth={3} strokeDasharray="6 12" fill="none" strokeDashoffset={-f * 3} />;})}
  </>);
  return (
    <Scene dur={135} set={party} svg={svg}>
      <Eyebrow text="03 · THE ROOM" y={300} />
      <Bubble x={250} y={1000} text="HAHA! GUYS!" red at={4} until={44} size={28} />
      <Bubble x={430} y={990} text="WAIT, LISTEN—" red at={34} until={64} size={28} />
      <Tag x={250} y={1480} text="CHASES ATTENTION" red at={60} size={22} />
      <Tag x={760} y={1480} text="ATTRACTS IT" at={84} size={22} />
      <PopText parts={[['Chasing pushes. Calm '], ['pulls.', true]]} at={100} y={370} size={62} />
      <Sfx name="party.wav" at={0} volume={0.25} /><Sfx name="laugh.wav" at={6} volume={0.4} /><Sfx name="laugh.wav" at={36} volume={0.35} />
      <Sfx name="whoom.wav" at={66} volume={0.45} /><Sfx name="clink.wav" at={92} volume={0.4} />
    </Scene>
  );
};
