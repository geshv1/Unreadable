// "Least Interest" — 35 s, 1050 frames. Scene order and frame ranges follow the brief.
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Overlay} from './components/Assets';
import {S00Hook} from './scenes/S00Hook';
import {S01Offer} from './scenes/S01Offer';
import {S02Ring} from './scenes/S02Ring';
import {S03Strings} from './scenes/S03Strings';
import {S04Dip} from './scenes/S04Dip';
import {S05Thesis} from './scenes/S05Thesis';
import {S06Cta} from './scenes/S06Cta';
import {C} from './theme';

export const TIMELINE = [
  {from: 0, dur: 120, C: S00Hook},
  {from: 120, dur: 180, C: S01Offer},
  {from: 300, dur: 180, C: S02Ring},
  {from: 480, dur: 180, C: S03Strings},
  {from: 660, dur: 150, C: S04Dip},
  {from: 810, dur: 120, C: S05Thesis},
  {from: 930, dur: 120, C: S06Cta},
];
export const LeastInterest: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    {TIMELINE.map(({from, dur, C: Comp}, i) => <Sequence key={i} from={from} durationInFrames={dur}><Comp /></Sequence>)}
    <Overlay />
  </AbsoluteFill>
);
