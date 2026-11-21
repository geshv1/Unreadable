import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag} from '../components/Ui';
import {ChatPhone} from '../components/Chat';
import {Sfx} from '../components/Sfx';
import {P, POSE, loop, ease} from '../components/rig';
import {splitTextSet} from '../components/sets.js';
import {PAL, FLOOR} from '../theme';

const SENT = [6, 18, 30, 42, 54];
export const S01Text: React.FC = () => {
  const f = useCurrentFrame();
  const tap = loop(f, 4, -0.07, 0.07);
  const svg = (<>
    <Character id="r" pal={PAL.reactive} x={290} y={1262 + 132 * 1.05} s={1.05} f={1} shadow={false} pose={P({...POSE.sit, lean: 0.25, hd: 0.5, aF: [0.6 + tap, 1.6], aB: [0.5 - tap, 1.6]})} mood={f < 60 ? 'neutral' : 'sad'}>{(j) => <rect x={j.handF[0] - 6} y={j.handF[1] - 34} width={24} height={40} rx={5} fill="#0a0a0c" stroke="#9fb4ff" strokeWidth={2} />}</Character>
    <Character id="s" pal={PAL.steady} x={800} y={FLOOR} s={1.05} f={-1} pose={f < 50 ? P({...POSE.stand, aF: [-1.9 + loop(f, 30, -0.5, 0.3), 0.8], hd: -0.1}) : POSE.phone} mood={f > 82 ? 'smirk' : 'calm'}>{(j) => f >= 50 ? <rect x={j.handF[0] - 18} y={j.handF[1] - 34} width={24} height={40} rx={5} fill="#0a0a0c" stroke="#9fb4ff" strokeWidth={2} /> : null}</Character>
  </>);
  return (
    <Scene dur={135} set={splitTextSet} svg={svg}>
      <Eyebrow text="01 · THE TEXT" y={300} />
      <ChatPhone x={70} y={710} w={400} h={380} name="MAYA" maxVisible={4} msgs={SENT.map((at, i) => ({at, text: ['hey', 'hey??', 'u there', 'did i do something', 'hello??'][i], sent: true, status: 'Delivered'}))} />
      <ChatPhone x={590} y={710} w={350} h={380} name="MAYA" msgs={[{at: 58, text: 'Free Thursday?', sent: true}, {at: 80, text: 'yes!! :)', status: 'now'}]} />
      <Tag x={270} y={1480} text="5 TEXTS · 0 REPLIES" red at={66} size={22} />
      <Tag x={770} y={1480} text="1 TEXT · 1 YES" at={88} size={22} />
      <PopText parts={[['Eagerness kills '], ['attraction.', true]]} at={98} y={370} size={60} />
      {SENT.map((at) => <Sfx key={at} name="send.wav" at={at} volume={0.45} />)}
      <Sfx name="send.wav" at={58} volume={0.45} /><Sfx name="ding.wav" at={80} volume={0.5} />
    </Scene>
  );
};
