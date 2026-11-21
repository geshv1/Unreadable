// "Least Interest" — 26.5 s, 795 frames. Scene order and frame ranges follow the brief.
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Overlay} from './components/Assets';
import {S00Hook} from './scenes/S00Hook';
import {S01Text} from './scenes/S01Text';
import {S02Deal} from './scenes/S02Deal';
import {S03Room} from './scenes/S03Room';
import {S04Habit} from './scenes/S04Habit';
import {S05Thesis} from './scenes/S05Thesis';
import {S06Cta} from './scenes/S06Cta';
import {Sfx} from './components/Sfx';
import {C} from './theme';

export const TIMELINE = [
  {from: 0, dur: 90, C: S00Hook},
  {from: 90, dur: 135, C: S01Text},
  {from: 225, dur: 135, C: S02Deal},
  {from: 360, dur: 135, C: S03Room},
  {from: 495, dur: 135, C: S04Habit},
  {from: 630, dur: 75, C: S05Thesis},
  {from: 705, dur: 90, C: S06Cta},
];
export const TOTAL = 795;
export const LeastInterest: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    {TIMELINE.map(({from, dur, C: Comp}, i) => <Sequence key={i} from={from} durationInFrames={dur}><Comp /></Sequence>)}
    {TIMELINE.slice(1).map(({from}) => <Sfx key={'w' + from} name="whoosh.wav" at={from - 3} volume={0.3} />)}
    <Overlay />
  </AbsoluteFill>
);
