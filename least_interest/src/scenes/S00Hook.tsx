import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene} from '../components/Scene';
import {Character, Reflection} from '../components/Character';
import {Eyebrow, Headline} from '../components/Text';
import {Sfx} from '../components/Sfx';
import {POSE, mixPose, loop, ease} from '../components/rig';
import {spotlights} from '../components/sets.js';
import {PAL, FLOOR} from '../theme';

const set = (t: number) => spotlights(t, [[330, 1, '#ff8a9c'], [750, 1, '#ffffff']]);
export const S00Hook: React.FC = () => {
  const f = useCurrentFrame();
  const rPose = {...mixPose(POSE.stand, POSE.slump, 0.6), hd: 0.25 + loop(f, 7, -0.06, 0.06), lean: 0.14 + loop(f, 11, -0.025, 0.025)};
  const sPose = {...POSE.stand, lean: loop(f, 90, -0.012, 0.012)};
  const shock = ease(f, 22, 30);
  const chars = (pre: string) => (<>
    <Character id={pre + 'r'} pal={PAL.reactive} x={330} y={FLOOR} s={1.25} f={1} pose={rPose} mood={shock > 0.5 ? 'shock' : 'neutral'} shadow={!pre} />
    <Character id={pre + 's'} pal={PAL.steady} x={750} y={FLOOR} s={1.25} f={-1} pose={sPose} lift={loop(f, 90, 0, 2)} mood="calm" glow={pre ? 0 : 1} shadow={!pre} />
  </>);
  return (
    <Scene dur={120} set={set} flash={false} svg={<>{chars('')}<Reflection floor={FLOOR}>{chars('m')}</Reflection></>}>
      <Eyebrow text="THE PRINCIPLE OF LEAST INTEREST." y={300} />
      <Headline parts={[['Whoever needs it less, '], ['wins.', true]]} keyAt={22} y={350} size={76} />
      <Sfx name="boom.wav" at={22} volume={0.7} />
    </Scene>
  );
};
