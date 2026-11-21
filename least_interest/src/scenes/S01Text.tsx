// 01 · THE TEXT — five unanswered texts vs one calm message.
import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Character} from '../components/Character';
import {Eyebrow, PopText} from '../components/Text';
import {Tag, Zigzag} from '../components/Ui';
import {ChatPhone} from '../components/Chat';
import {PhoneProp, Dumbbell, GlowDefs} from '../components/Props';
import {Sfx} from '../components/Sfx';
import {P, POSE, keyPoses, loop, tween, rig} from '../components/rig';
import {splitTextSet} from '../components/sets.js';
import {PAL, FLOOR, C} from '../theme';

export const TEXT_DUR = 138;
const SENDS = [8, 22, 36, 50, 64];
const DOTS: [number, number] = [76, 96];
const SIT = POSE.sit;
const rTyping = (f: number, n: number) => P({...SIT, lean: 0.22 + n * 0.035, hd: 0.5 + n * 0.02, aF: [0.6 + loop(f, 3.2, -0.08, 0.08), 1.6], aB: [0.5 + loop(f + 1.6, 3.2, -0.08, 0.08), 1.6]});
const Layer: React.FC = () => {
  const f = useCurrentFrame();
  const n = SENDS.filter((s) => f >= s).length;
  const rPose = f < 74 ? rTyping(f, n) : keyPoses(f, [[74, rTyping(f, 5)], [82, P({...SIT, lean: -0.08, hd: 0.25, aF: [0.75, 1.35], aB: [0.6, 1.45]})], [96, P({...SIT, lean: -0.08, hd: 0.3, aF: [0.75, 1.35], aB: [0.6, 1.45]})], [104, P({...SIT, lean: 0.3, hd: 0.55, aF: [0.5, 1.2], aB: [0.4, 1.3]})],
    [110, P({...SIT, lean: 0.1, hd: 0.2, aF: [2.1, 0.3], aB: [0.4, 1.3]})], [116, P({...SIT, lean: 0.2, hd: 0.3, aF: [0.9, 0.2], aB: [0.4, 1.3]})], [126, P({...SIT, lean: 0.38, hd: 0.6, aF: [2.25, 1.65], aB: [2.05, 1.75]})]]);
  const rMood = f < 76 ? 'neutral' : f < 96 ? 'smile' : f < 110 ? 'sad' : 'angry';
  const rJ = rig({x: 290, y: 1262 + 132 * 1.05, s: 1.05, f: 1, pose: rPose});
  // tossed phone
  const tk = interpolate(f, [110, 121], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tossP = [interpolate(tk, [0, 1], [rJ.handF[0], 120]), interpolate(tk, [0, 1], [rJ.handF[1], 1290]) - 560 * tk * (1 - tk)];
  // Steady: curls, grabs phone, sends, back to curls, glances at the reply
  const curlK = loop(f, 34, 0, 1);
  const curl = P({lean: -0.02, hd: 0.06, aF: [0.12, 0.15 + 2.15 * curlK], aB: [-0.1, 0.2]});
  const sPose = keyPoses(f, [[0, curl], [38, curl], [44, P({lean: 0.3, hd: 0.3, aF: [0.9, 0.45], aB: [-0.1, 0.3]})], [48, POSE.phone], [58, POSE.phone], [64, P({lean: 0.3, hd: 0.3, aF: [0.9, 0.45], aB: [-0.1, 0.3]})], [70, curl]]);
  const sP = f > 70 ? {...curl, hd: tween(f, [88, 94, 106, 112], [0.06, 0.35, 0.35, 0.06])} : sPose;
  const sJ = rig({x: 760, y: FLOOR, s: 1.05, f: -1, pose: sP});
  const holding = f >= 46 && f < 62;
  const lit = interpolate(f, [88, 92, 120, 130], [0, 1, 1, 0.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (<>
    <GlowDefs />
    <Character id="tr" pal={PAL.reactive} x={290} y={1262 + 132 * 1.05} s={1.05} f={1} shadow={false} pose={rPose} mood={rMood}>{(j) => tk === 0 ? <PhoneProp p={j.handF} glow={1} /> : null}</Character>
    {tk > 0 && <g transform={`translate(${tossP[0]},${tossP[1]}) rotate(${tk * 540})`}><rect x={-12} y={-21} width={24} height={42} rx={6} fill="#0a0a0c" /><rect x={-9} y={-18} width={18} height={36} rx={4} fill="#c9d6ff" opacity={0.6} /></g>}
    {/* bench + phone */}
    <rect x={858} y={1326} width={150} height={16} rx={4} fill="#0a0a0c" /><rect x={866} y={1342} width={10} height={78} fill="#0a0a0c" /><rect x={988} y={1342} width={10} height={78} fill="#0a0a0c" /><rect x={862} y={1328} width={142} height={8} fill="#3a3b42" />
    {!holding && <g>{lit > 0 && <ellipse cx={905} cy={1318} rx={70} ry={30} fill="url(#phoneGlow)" opacity={lit} />}<rect x={884} y={1312} width={42} height={12} rx={3} fill="#0a0a0c" stroke={lit > 0.1 ? '#c9d6ff' : '#333'} strokeWidth={2} /></g>}
    <Character id="ts" pal={PAL.steady} x={760} y={FLOOR} s={1.05} f={-1} pose={sP} look={f > 88 && f < 110 ? 1 : 0} mood={f > 92 ? 'smirk' : 'calm'}>{(j) => holding ? <PhoneProp p={j.handF} glow={0.8} rot={20} /> : <Dumbbell p={j.handF} rot={curlK * -40} />}</Character>
    <Zigzag x={rJ.head[0]} y={rJ.head[1]} on={f > 100 ? 1 : 0} />
  </>);
};
export const S01Text: React.FC = () => {
  const f = useCurrentFrame();
  const hours = Math.round(interpolate(f, [0, 74], [64, 132], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const clock = `${String(Math.floor((11 * 60 + hours) / 60) % 12 || 12)}:${String((11 * 60 + hours) % 60).padStart(2, '0')} ${11 * 60 + hours >= 720 ? 'AM' : 'PM'}`;
  return (
    <Scene dur={TEXT_DUR} set={splitTextSet} Layer={Layer} cam={(fr) => ({z: tween(fr, [70, 90, 112, 124], [1, 1.05, 1.05, 1.02]), x: tween(fr, [70, 90, 112, 124], [0, 40, 40, 0])})}
      world={<>
        <ChatPhone x={60} y={690} w={420} h={365} name="MAYA" sub={clock} maxVisible={4} typing={DOTS} at={-6}
          msgs={SENDS.map((at, i) => ({at, text: ['hey', 'hey??', 'u up', 'did i do something', 'hello??'][i], sent: true, status: 'Delivered'}))} />
        <ChatPhone x={600} y={700} w={340} h={300} name="MAYA" at={40} msgs={[{at: 56, text: 'Free Thursday?', sent: true}, {at: 88, text: 'yes :)', status: 'now'}]} />
        <Tag x={270} y={1480} text="5 TEXTS · 0 REPLIES" red at={100} size={22} />
        <Tag x={770} y={1480} text="1 TEXT · 1 YES" at={104} size={22} />
      </>}>
      <Eyebrow text="01 · THE TEXT" y={300} />
      <PopText parts={[['Eagerness kills '], ['attraction.', true]]} at={106} y={370} size={64} />
      <Sfx name="clock_tension.wav" at={0} volume={0.5} />
      <Sfx name="gym_bed.wav" at={0} volume={0.35} />
      {SENDS.map((at, i) => <React.Fragment key={at}><Sfx name="typing.wav" at={at - 9} volume={0.35} /><Sfx name={`send${i + 1}.wav`} at={at} volume={0.55} /></React.Fragment>)}
      <Sfx name="delivered.wav" at={70} volume={0.4} />
      <Sfx name="dots_in.wav" at={DOTS[0]} volume={0.45} /><Sfx name="dots_out.wav" at={DOTS[1] - 3} volume={0.55} />
      <Sfx name="phone_toss.wav" at={110} volume={0.6} />
      <Sfx name="typing.wav" at={47} volume={0.25} /><Sfx name="send_clean.wav" at={56} volume={0.45} />
      <Sfx name="reply_chime.wav" at={88} volume={0.5} />
    </Scene>
  );
};
