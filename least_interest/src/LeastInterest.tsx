// "Least Interest" — scenes joined by whip-pan transitions. Header bar, grain and transition swells are global.
import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Overlay} from './components/Assets';
import {HeaderBar} from './components/Text';
import {whip} from './components/Whip';
import {Sfx} from './components/Sfx';
import {S00Hook, HOOK_DUR} from './scenes/S00Hook';
import {S01Text, TEXT_DUR} from './scenes/S01Text';
import {S02Deal, DEAL_DUR} from './scenes/S02Deal';
import {S03Room, ROOM_DUR} from './scenes/S03Room';
import {S04Habit, HABIT_DUR} from './scenes/S04Habit';
import {S05Thesis, THESIS_DUR} from './scenes/S05Thesis';
import {S06Cta, CTA_DUR} from './scenes/S06Cta';
import {C} from './theme';

const TR = 10;
const SCENES: [React.FC, number][] = [[S00Hook, HOOK_DUR], [S01Text, TEXT_DUR], [S02Deal, DEAL_DUR], [S03Room, ROOM_DUR], [S04Habit, HABIT_DUR], [S05Thesis, THESIS_DUR], [S06Cta, CTA_DUR]];
export const TOTAL = SCENES.reduce((a, [, d]) => a + d, 0) - TR * (SCENES.length - 1);
// absolute frame where each transition starts
const CUTS = SCENES.slice(0, -1).map((_, i) => SCENES.slice(0, i + 1).reduce((a, [, d]) => a + d, 0) - TR * (i + 1));
export const LeastInterest: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <TransitionSeries>
      {SCENES.map(([Comp, d], i) => (
        <React.Fragment key={i}>
          {i > 0 && <TransitionSeries.Transition presentation={whip(i % 2 ? 1 : -1)} timing={linearTiming({durationInFrames: TR, easing: Easing.inOut(Easing.cubic)})} />}
          <TransitionSeries.Sequence durationInFrames={d}><Comp /></TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
    <HeaderBar />
    {CUTS.map((c, i) => <Sfx key={c} name={i % 2 ? 'swell_b.wav' : 'swell_a.wav'} at={c - 13} volume={0.45} />)}
    <Overlay />
  </AbsoluteFill>
);
