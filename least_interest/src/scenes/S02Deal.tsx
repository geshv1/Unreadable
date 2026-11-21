// 02 · THE DEAL — "I need it today" raises the price; walking away lowers it. A light-sweep wipe swaps the buyer.
import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Bubble, useCount} from '../components/Ui';
import {Keys} from '../components/Props';
import {Sfx} from '../components/Sfx';
import {P, POSE, keyPoses, loop, tween, walk, walkLift, run, runLift, turn} from '../components/rig';
import {carLotSheen} from '../components/sets.js';
import {PAL, FLOOR, C, FONT, W} from '../theme';

export const DEAL_DUR = 138;
const WIPE: [number, number] = [56, 72];
const eur = (v: number) => '€' + Math.round(v).toLocaleString('en-US');
const Y = FLOOR + 20;
const Layer: React.FC = () => {
  const f = useCurrentFrame();
  const wx = tween(f, WIPE, [-120, 1200], Easing.inOut(Easing.cubic));
  // ---- A: Reactive ----
  const rx = tween(f, [0, 16], [110, 290], Easing.out(Easing.quad));
  const excited = P({...POSE.gesture, aF: [1.5 + loop(f, 9, -0.35, 0.35), 0.6], aB: [1.1 + loop(f + 4, 9, -0.3, 0.3), 0.8], hd: -0.1 + loop(f, 9, -0.05, 0.05)});
  const rPose = f < 16 ? walk(f * 0.45) : keyPoses(f, [[16, walk(16 * 0.45)], [20, POSE.reach], [26, excited], [60, excited]]);
  const rLift = f < 16 ? walkLift(f * 0.45, 1.12) : loop(f, 9, 0, 8);
  // ---- salesman (both halves) ----
  const rub = P({lean: 0.06, hd: 0.05, aF: [1.1 + loop(f, 6, -0.12, 0.12), 1.3], aB: [0.9 + loop(f + 3, 6, -0.12, 0.12), 1.4]});
  const pointUp = P({lean: 0.04, hd: -0.05, aF: [2.6, 0.3], aB: [-0.1, 0.3]});
  const runK = tween(f, [100, 120], [0, 1], Easing.inOut(Easing.quad));
  const smx = f < 100 ? 760 : interpolate(runK, [0, 1], [760, 440]);
  const smPoseA = keyPoses(f, [[0, rub], [28, rub], [32, pointUp], [44, pointUp], [50, rub]]);
  const smPoseB = f < 100 ? keyPoses(f, [[60, rub], [74, P({lean: 0.02, aF: [0.9, 0.7], aB: [-0.1, 0.3]})], [96, P({lean: 0.02, aF: [0.9, 0.7], aB: [-0.1, 0.3]})], [100, run(100 * 0.6)]])
    : f < 120 ? run(f * 0.6) : keyPoses(f, [[120, run(120 * 0.6)], [126, P({lean: 0.15, hd: 0.1, aF: [1.6, 0.4], aB: [1.2, 0.6]})]]);
  const smLift = f >= 100 && f < 120 ? runLift(f * 0.6, 1.1) : 0;
  // ---- B: Steady ----
  const crouchK = tween(f, [70, 78, 84, 90], [0, 1, 1, 0]);
  const tf = turn(f, 92, 1, -1, 8);
  const sx = tween(f, [96, 124], [300, 150], Easing.inOut(Easing.quad));
  const walking = f >= 96 && f < 124;
  const sPose = walking ? walk(f * 0.4, 0.9) : f < 92 ? keyPoses(f, [[66, POSE.stand], [70, POSE.stand], [78, POSE.crouch], [84, POSE.crouch], [90, POSE.stand]]) : POSE.stand;
  const sLift = walking ? walkLift(f * 0.4, 1.12, 0.9) : 0;
  const A = (<g clipPath="url(#dealA)">
    <Character id="dr" pal={PAL.reactive} x={rx} y={Y} s={1.12} f={1} pose={rPose} lift={rLift} mood={f < 16 ? 'smile' : 'shock'} />
    <Character id="dsA" pal={PAL.sales} x={760} y={Y} s={1.1} f={-1} pose={smPoseA} mood="smirk">{(j) => <Keys p={j.handF} swing={loop(f, 8, -25, 25)} />}</Character>
  </g>);
  const B = (<g clipPath="url(#dealB)">
    <Character id="ds" pal={PAL.steady} x={f < 96 ? 300 : sx} y={Y} s={1.12} f={tf} pose={crouchK > 0 && f < 92 ? sPose : sPose} lift={sLift} look={f > 124 ? -1 : 0} mood={f > 124 ? 'smirk' : 'calm'} glow={1} />
    <Character id="dsB" pal={PAL.sales} x={smx} y={Y} s={1.1} f={-1} pose={smPoseB} lift={smLift} mood={f < 96 ? 'smirk' : 'shock'} />
  </g>);
  return (<>
    <defs><clipPath id="dealA"><rect x={wx} y={0} width={3000} height={3000} /></clipPath><clipPath id="dealB"><rect x={-3000} y={0} width={3000 + wx} height={3000} /></clipPath></defs>
    {f < WIPE[1] && A}{f > WIPE[0] && B}
  </>);
};
export const S02Deal: React.FC = () => {
  const f = useCurrentFrame(); const second = f >= 64;
  const up = useCount(18000, 19500, 28, 54), down = useCount(18000, 16500, 108, 132);
  const price = second ? down : up; const red = !second;
  const pk = interpolate(f, [28, 54], [1, 1.08], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Scene dur={DEAL_DUR} set={carLotSheen} Layer={Layer} cam={(fr) => ({x: tween(fr, [98, 120, 138], [0, 50, 40]), z: tween(fr, [20, 54, 64, 80], [1, 1.04, 1.0, 1.02])})}
      world={<>
        <div style={{position: 'absolute', left: W / 2, top: 880, transform: `translate(-50%,-50%) scale(${second ? 1 : pk})`, padding: '14px 34px', borderRadius: 16, background: 'rgba(12,12,14,.94)', border: `3px solid ${red ? C.red : '#F2F2F2'}`,
          boxShadow: `0 0 24px ${red ? C.redGlow : 'rgba(255,255,255,.35)'}`, fontFamily: FONT.head, fontWeight: 900, fontSize: 64, color: red ? C.red : C.white, fontVariantNumeric: 'tabular-nums'}}>{eur(price)}</div>
        <Bubble x={300} y={1010} text="I NEED IT TODAY!" red at={18} until={WIPE[0]} tail={20} size={30} />
        <Tag x={770} y={880} text="+€1,500" red at={50} until={WIPE[0]} />
        <Bubble x={740} y={1010} text="€18,000. Final." at={74} until={98} tail={20} size={28} />
        <Bubble x={320} y={1010} text="Not at that price." at={86} until={112} size={28} />
        <Bubble x={520} y={1000} text="WAIT! €16,500!" at={110} until={138} tail={-40} size={30} />
        <Tag x={770} y={880} text="−€1,500" at={128} />
      </>}>
      <Eyebrow text="02 · THE DEAL" y={468} />
      <PopText parts={[['Walking away is '], ['leverage.', true]]} at={112} y={506} size={68} />
      <Sfx name="lot_bed.wav" at={0} volume={0.5} />
      {[2, 8, 14].map((t) => <Sfx key={t} name="step_quick.wav" at={t} volume={0.45} />)}
      <Sfx name="key_jingle.wav" at={24} volume={0.5} /><Sfx name="key_jingle.wav" at={42} volume={0.4} />
      <Sfx name="counter_up.wav" at={28} volume={0.5} />
      <Sfx name="wipe_shimmer.wav" at={54} volume={0.45} />
      <Sfx name="cloth.wav" at={70} volume={0.45} /><Sfx name="cloth.wav" at={88} volume={0.35} />
      {[98, 108, 118].map((t) => <Sfx key={t} name="step_calm.wav" at={t} volume={0.5} />)}
      <Sfx name="steps_hurry.wav" at={100} volume={0.5} />
      <Sfx name="counter_down.wav" at={108} volume={0.55} />
    </Scene>
  );
};
