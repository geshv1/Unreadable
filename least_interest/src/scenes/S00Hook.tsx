import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character, Reflection} from '../components/Character';
import {Eyebrow, Headline} from '../components/Text';
import {Zigzag} from '../components/Ui';
import {Sfx} from '../components/Sfx';
import {P, POSE, mixPose, loop, ease, rig} from '../components/rig';
import {spotlights} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

const set = (t: number) => spotlights(t, [[360, 1, '#ff8a9c'], [720, 1, '#ffffff']]);
const PULL = P({lean: -0.38, hd: -0.12, aF: [1.45, 0.08], aB: [1.32, 0.16], lF: [0.5, -0.12], lB: [-0.28, 0.05]});
export const S00Hook: React.FC = () => {
  const f = useCurrentFrame();
  const drop = f >= 38; // Steady lets go
  const fall = ease(f, 40, 54, 0, 1, Easing.in(Easing.quad));
  const shake = drop ? 0 : loop(f, 3, -2, 2);
  const rp = {...PULL, hd: PULL.hd + loop(f, 5, -0.04, 0.04)};
  const sp = mixPose(P({lean: 0.02, hd: 0.05, aF: [1.25, 0.15], aB: [-0.12, 0.2]}), P({lean: -0.02, aF: [0.35, 0.3], aB: [-0.12, 0.2]}), ease(f, 38, 46));
  const rJ = rig({x: 360 + shake, y: FLOOR, s: 1.2, f: 1, pose: rp});
  const sJ = rig({x: 720, y: FLOOR, s: 1.2, f: -1, pose: sp});
  const rot = interpolate(fall, [0, 1], [0, -78]); const back = interpolate(fall, [0, 1], [0, -40]);
  // rope: taut, then slack and falling
  const ropeEnd = drop ? [interpolate(fall, [0, 1], [sJ.handF[0], rJ.handF[0] + 260]), interpolate(fall, [0, 1], [sJ.handF[1], FLOOR - 6])] : sJ.handF;
  const sag = drop ? interpolate(fall, [0, 1], [10, 60]) : 4 + loop(f, 3, -3, 3);
  const rope = (<path d={`M${rJ.handF[0]} ${rJ.handF[1]} Q${(rJ.handF[0] + ropeEnd[0]) / 2} ${(rJ.handF[1] + ropeEnd[1]) / 2 + sag} ${ropeEnd[0]} ${ropeEnd[1]}`} stroke="#c9a46a" strokeWidth={9} fill="none" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 2px #000)'}} />);
  const chars = (pre: string) => (<>
    <g transform={`rotate(${rot} ${360 + back} ${FLOOR}) translate(${back} 0)`}><Character id={pre + 'r'} pal={PAL.reactive} x={360 + shake} y={FLOOR} s={1.2} f={1} pose={rp} mood={fall > 0.2 ? 'shock' : 'angry'} shadow={!pre} /></g>
    <Character id={pre + 's'} pal={PAL.steady} x={720} y={FLOOR} s={1.2} f={-1} pose={sp} mood={drop ? 'smirk' : 'calm'} glow={pre ? 0 : 1} shadow={!pre} />
  </>);
  return (
    <Scene dur={90} set={set} flash={false} svg={<>{!drop && rope}{chars('')}{drop && fall < 1 && rope}{drop && fall >= 1 && rope}<Reflection floor={FLOOR}>{chars('m')}</Reflection></>}>
      <Eyebrow text="THE PRINCIPLE OF LEAST INTEREST." y={300} />
      <Headline parts={[['Whoever cares less, '], ['wins.', true]]} keyAt={54} y={350} size={78} />
      <Zigzag x={rJ.head[0]} y={rJ.head[1]} on={f < 38 ? ease(f, 4, 10) : 0} />
      <Sfx name="rope_strain.wav" at={0} volume={0.45} /><Sfx name="body_fall.wav" at={54} volume={0.7} /><Sfx name="boom.wav" at={54} volume={0.6} />
    </Scene>
  );
};
