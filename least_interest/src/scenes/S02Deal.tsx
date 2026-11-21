import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Bubble, Flash, useCount} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {P, POSE, mixPose, loop, ease, walk} from '../components/rig';
import {carLot} from '../components/sets.js';
import {PAL, FLOOR, C, FONT, W} from '../theme';

const CUT = 62;
const eur = (v: number) => '€' + Math.round(v).toLocaleString('en-US');
export const S02Deal: React.FC = () => {
  const f = useCurrentFrame(); const second = f >= CUT;
  const up = useCount(18000, 19500, 22, 50);
  const down = useCount(18000, 16500, 98, 126);
  const price = second ? down : up;
  const walkOff = ease(f, 84, 130, 0, 1, Easing.inOut(Easing.quad));
  const run = ease(f, 90, 112, 0, 1, Easing.out(Easing.cubic));
  const salesX = second ? interpolate(run, [0, 1], [730, 470]) : 730;
  const svg = (<>
    {!second && <Character id="r" pal={PAL.reactive} x={330} y={FLOOR + 20} s={1.12} f={1} pose={P({lean: 0.12, hd: -0.1 + loop(f, 8, -0.05, 0.05), aF: [1.6 + loop(f, 10, -0.3, 0.3), 0.6], aB: [-0.4, 0.8]})} mood="smile" />}
    {second && <Character id="s" pal={PAL.steady} x={interpolate(walkOff, [0, 1], [330, 120])} y={FLOOR + 20} s={1.12} f={f >= 84 ? -1 : 1} pose={f >= 84 ? walk(f * 0.4) : POSE.stand} mood="calm" />}
    <Character id="sm" pal={PAL.sales} x={salesX} y={FLOOR + 20} s={1.1} f={-1} pose={second && f >= 90 && f < 112 ? walk(f * 0.7, 1.3) : P({lean: 0.05, aF: [0.9, 0.7], aB: [-0.1, 0.3]})} mood={second ? (f > 92 ? 'shock' : 'neutral') : 'smirk'} />
  </>);
  const red = !second;
  return (
    <Scene dur={135} set={carLot} svg={svg}>
      <Eyebrow text="02 · THE DEAL" y={300} />
      <div style={{position: 'absolute', left: W / 2, top: 880, transform: 'translate(-50%,-50%)', padding: '14px 34px', borderRadius: 16, background: 'rgba(12,12,14,.94)', border: `3px solid ${red ? C.red : '#F2F2F2'}`, boxShadow: `0 0 24px ${red ? C.redGlow : 'rgba(255,255,255,.35)'}`, fontFamily: FONT.head, fontWeight: 900, fontSize: 64, color: red ? C.red : C.white, fontVariantNumeric: 'tabular-nums'}}>{eur(price)}</div>
      <Bubble x={300} y={1010} text="I NEED IT TODAY!" red at={4} until={CUT} tail={20} size={30} />
      <Tag x={760} y={880} text="+€1,500" red at={46} until={CUT} />
      <Bubble x={330} y={1010} text="Not at that price." at={CUT + 4} until={96} size={30} />
      <Bubble x={560} y={1000} text="WAIT! €16,500!" at={96} until={135} tail={-30} size={30} />
      <Tag x={760} y={880} text="−€1,500" at={122} />
      <PopText parts={[['Walking away is '], ['leverage.', true]]} at={104} y={370} size={62} />
      <Flash at={CUT} len={5} strength={0.2} />
      {[22, 28, 34, 40, 46].map((t) => <Sfx key={t} name="tick.wav" at={t} volume={0.35} />)}
      {[98, 104, 110, 116, 122].map((t) => <Sfx key={t} name="tick.wav" at={t} volume={0.35} />)}
      <Sfx name="whoosh.wav" at={CUT - 2} volume={0.35} />
      {[86, 100, 114, 128].map((t) => <Sfx key={t} name="step.wav" at={t} volume={0.4} />)}
      <Sfx name="cash.wav" at={126} volume={0.4} />
    </Scene>
  );
};
