import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Zigzag, Stamina, useCount} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {P, POSE, loop, ease, walk} from '../components/rig';
import {nightStore} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

export const S04Habit: React.FC = () => {
  const f = useCurrentFrame();
  const pat = loop(f, 6, -0.3, 0.3);
  const drink = ease(f, 52, 62) * (1 - ease(f, 84, 92));
  const rPose = f < 28 ? P({lean: 0.12, hd: 0.25 + loop(f, 5, -0.06, 0.06), aF: [0.3 + pat, 0.9], aB: [0.25 - pat, 0.9]}) : f < 50 ? P({lean: 0.2, hd: 0.1, aF: [1.5, 0.1], aB: [-0.1, 0.3]}) : P({lean: -0.1 * drink, hd: -0.5 * drink, aF: [0.6 + 1.9 * drink, 1.9 - 1.0 * drink], aB: [-0.1, 0.3]});
  const yearly = useCount(0, 3285, 64, 96);
  const jog = ease(f, 56, 104, 0, 1, Easing.out(Easing.quad));
  const sx = interpolate(jog, [0, 1], [1150, 760]);
  const sDrink = ease(f, 108, 116);
  const need = interpolate(f, [0, 28, 62, 100], [92, 100, 40, 95], {extrapolateRight: 'clamp'});
  const svg = (<>
    <Character id="r" pal={PAL.reactive} x={420} y={FLOOR + 10} s={1.1} f={-1} pose={rPose} mood={f < 50 ? 'shock' : f < 92 ? 'calm' : 'sad'}>{(j) => f >= 44 ? <rect x={j.handF[0] - 10} y={j.handF[1] - 30} width={22} height={36} rx={5} fill="#0a0a0c" stroke={C.red} strokeWidth={3} /> : null}</Character>
    <Character id="s" pal={PAL.steady} x={sx} y={FLOOR + 10} s={1.1} f={-1} pose={jog < 1 ? walk(f * 0.75, 1.4) : P({lean: -0.05 * sDrink, hd: -0.4 * sDrink, aF: [0.5 + 1.8 * sDrink, 1.6 - 0.8 * sDrink], aB: [-0.1, 0.3]})} mood="calm" glow={1}>{(j) => <rect x={j.handF[0] - 9} y={j.handF[1] - 34} width={18} height={40} rx={5} fill="rgba(200,225,255,.35)" stroke="#e8f1ff" strokeWidth={3} />}</Character>
  </>);
  return (
    <Scene dur={135} set={nightStore} svg={svg}>
      <Eyebrow text="04 · THE HABIT" y={300} />
      <Stamina x={420} y={760} value={need} red label="NEED" />
      <Zigzag x={430} y={1080} on={f < 30 ? 1 : ease(f, 92, 100)} />
      <Tag x={330} y={1480} text="−€9 / DAY" red at={52} until={66} size={22} />
      <Tag x={330} y={1480} text={`−€${Math.round(yearly).toLocaleString('en-US')} / YEAR`} red at={66} size={22} />
      <Tag x={760} y={1480} text="NEEDS NOTHING" at={104} size={22} />
      <PopText parts={[['What you need '], ['owns', true], [' you.']]} at={108} y={370} size={64} />
      <Sfx name="heartbeat.wav" at={0} volume={0.4} /><Sfx name="heartbeat.wav" at={16} volume={0.4} />
      <Sfx name="coin.wav" at={30} volume={0.4} /><Sfx name="can_drop.wav" at={40} volume={0.5} /><Sfx name="can_open.wav" at={50} volume={0.45} />
      {[60, 70, 80, 90, 100].map((t) => <Sfx key={t} name="step.wav" at={t} volume={0.35} />)}
    </Scene>
  );
};
