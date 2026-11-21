// 04 · THE HABIT — a craving that pays itself back in a loop vs a man who needs nothing from the machine.
import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Zigzag, Stamina, useCount} from '../components/Ui';
import {Can, Bottle} from '../components/Props';
import {Spray, Vapor} from '../components/Fx';
import {Sfx} from '../components/Sfx';
import {P, POSE, keyPoses, loop, tween, walk, walkLift, run, runLift, turn, rig} from '../components/rig';
import {nightStoreNeon} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

export const HABIT_DUR = 138;
const Y = FLOOR + 10;
const Layer: React.FC = () => {
  const f = useCurrentFrame();
  // Reactive: pacing -> coin -> can -> drink -> relief -> craving creeps back
  const pacing = f < 26;
  const rx = tween(f, [0, 12, 26], [440, 530, 440], Easing.inOut(Easing.sin));
  const face = f < 12 ? turn(f, 0, -1, 1, 1) : turn(f, 12, 1, -1, 6);
  const shake = (f < 30 || f > 92) ? loop(f, 2.4, -0.07, 0.07) : 0;
  const pocket = P({lean: 0.05, hd: 0.2, aF: [-0.15, 0.9], aB: [0.1, 0.5]});
  const insert = P({lean: 0.1, hd: 0.05, aF: [1.45, 0.2], aB: [-0.1, 0.3]});
  const hold = P({lean: 0.04, hd: 0.15, aF: [0.75, 1.3], aB: [-0.1, 0.3]});
  const rPose = pacing ? walk(f * 0.48, 1.1) : keyPoses(f, [[26, pocket], [30, insert], [36, insert], [40, POSE.crouch], [48, POSE.crouch], [54, hold], [58, POSE.drink], [76, POSE.drink], [84, P({...POSE.slump, aF: [0.5, 1.2]})], [140, P({...POSE.slump, hd: 0.5, aF: [0.5, 1.2]})]]);
  const rPoseS = {...rPose, aF: [rPose.aF[0] + shake, rPose.aF[1]] as [number, number]};
  const rJ = rig({x: rx, y: Y, s: 1.1, f: f < 26 ? face : -1, pose: rPoseS});
  const hasCan = f >= 48;
  const coinK = tween(f, [30, 36], [0, 1], Easing.inOut(Easing.quad));
  const canFall = tween(f, [38, 42], [1190, 1330], Easing.in(Easing.quad));
  // Steady: jogs in from the street, stops, breathes, drinks water
  const sx = tween(f, [60, 94], [1160, 770], Easing.out(Easing.quad));
  const sRun = f >= 60 && f < 90;
  const sPose = sRun ? run(f * 0.62) : keyPoses(f, [[90, run(90 * 0.62)], [96, P({lean: 0.18, hd: 0.15, aF: [0.4, 0.9], aB: [0.3, 1.0]})], [104, P({lean: 0.05, hd: 0, aF: [0.5, 1.4], aB: [-0.1, 0.3]})], [108, POSE.drink], [116, POSE.drink], [122, P({lean: 0, aF: [0.5, 1.4], aB: [-0.1, 0.3]})]]);
  const sJ = rig({x: sx, y: Y, s: 1.1, f: -1, pose: sPose});
  return (<>
    {f >= 38 && f < 46 && <g transform={`translate(262 ${canFall})`}><rect x={-11} y={-19} width={22} height={38} rx={5} fill="#0a0a0c" /><rect x={-8} y={-16} width={16} height={32} rx={3} fill={C.red} /></g>}
    {coinK > 0 && coinK < 1 && <circle cx={interpolate(coinK, [0, 1], [rJ.handF[0], 362])} cy={interpolate(coinK, [0, 1], [rJ.handF[1], 1000]) - 60 * 4 * coinK * (1 - coinK)} r={7} fill="#e8c27a" stroke="#0a0a0c" strokeWidth={2} />}
    <Character id="hr" pal={PAL.reactive} x={rx} y={Y} s={1.1} f={f < 26 ? face : -1} pose={rPoseS} lift={pacing ? walkLift(f * 0.48, 1.1) : 0} blink={f > 60 && f < 80 ? 1 : 0} mood={f < 54 ? 'shock' : f < 84 ? 'calm' : 'sad'} look={f > 100 ? -1 : 0}>{(j) => hasCan ? <Can p={j.handF} rot={f > 58 && f < 80 ? -110 : 0} /> : null}</Character>
    <Spray f={f} at={54} x={rJ.handF[0]} y={rJ.handF[1] - 30} color="#ffd9d9" />
    <Character id="hs" pal={PAL.steady} x={sx} y={Y} s={1.1} f={-1} pose={sPose} lift={sRun ? runLift(f * 0.62, 1.1) : 0} mood="calm" glow={1}>{(j) => f >= 100 ? <Bottle p={j.handF} rot={f > 106 && f < 118 ? -120 : 0} /> : null}</Character>
    {f >= 92 && <Vapor f={f} x={sJ.head[0] - 30} y={sJ.head[1] + 10} dir={-1} />}
    <Zigzag x={rJ.head[0]} y={rJ.head[1]} on={tween(f, [0, 4, 50, 56, 96, 104], [0, 1, 1, 0, 0, 1])} />
  </>);
};
export const S04Habit: React.FC = () => {
  const f = useCurrentFrame();
  const need = tween(f, [0, 26, 54, 62, 78, 104, 138], [70, 96, 100, 62, 28, 72, 90]);
  const yearly = useCount(0, 3285, 66, 98);
  return (
    <Scene dur={HABIT_DUR} set={nightStoreNeon} Layer={Layer} cam={(fr) => ({z: tween(fr, [0, 56, 76, 96, 138], [1.0, 1.06, 1.09, 1.02, 1.03]), x: tween(fr, [0, 56, 76, 96], [40, 90, 90, -40])})}
      world={<>
        <Stamina x={380} y={760} value={need} red label="NEED" />
        <Tag x={330} y={1480} text="−€9 / DAY" red at={56} until={68} size={22} />
        <Tag x={330} y={1480} text={`−€${Math.round(yearly).toLocaleString('en-US')} / YEAR`} red at={68} size={22} />
        <Tag x={770} y={1480} text="NEEDS NOTHING" at={108} size={22} />
      </>}>
      <Eyebrow text="04 · THE HABIT" y={300} />
      <PopText parts={[['What you need '], ['owns', true], [' you.']]} at={110} y={370} size={64} />
      <Sfx name="store_bed.wav" at={0} volume={0.55} />
      <Sfx name="craving_whine.wav" at={0} volume={0.45} />
      {[2, 9, 16, 23].map((t) => <Sfx key={t} name="step_soft.wav" at={t} volume={0.4} />)}
      <Sfx name="coin_insert.wav" at={31} volume={0.5} />
      <Sfx name="can_drop.wav" at={40} volume={0.6} /><Sfx name="cloth.wav" at={41} volume={0.3} />
      <Sfx name="can_open.wav" at={53} volume={0.6} />
      {[61, 68, 75].map((t) => <Sfx key={t} name="gulp.wav" at={t} volume={0.45} />)}
      <Sfx name="relief_exhale.wav" at={78} volume={0.5} />
      <Sfx name="run_wet.wav" at={58} volume={0.5} /><Sfx name="breath_run.wav" at={92} volume={0.45} />
      <Sfx name="water_sip.wav" at={108} volume={0.4} />
      <Sfx name="craving_return.wav" at={94} volume={0.45} />
    </Scene>
  );
};
