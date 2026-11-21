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
import {C, BOX, FRAME} from './theme';

const TR = 10;
const SCENES: [React.FC, number][] = [[S00Hook, HOOK_DUR], [S01Text, TEXT_DUR], [S02Deal, DEAL_DUR], [S03Room, ROOM_DUR], [S04Habit, HABIT_DUR], [S05Thesis, THESIS_DUR], [S06Cta, CTA_DUR]];
export const TOTAL = SCENES.reduce((a, [, d]) => a + d, 0) - TR * (SCENES.length - 1);
// absolute frame where each transition starts
const CUTS = SCENES.slice(0, -1).map((_, i) => SCENES.slice(0, i + 1).reduce((a, [, d]) => a + d, 0) - TR * (i + 1));
export const LeastInterest: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    {/* Everything is drawn in 1080×1920 design space, then shrunk into TikTok's always-visible region. */}
    <AbsoluteFill style={{transform: `translate(${FRAME.x}px, ${FRAME.y}px) scale(${FRAME.s})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: BOX.x0, top: BOX.y0, width: BOX.x1 - BOX.x0, height: BOX.y1 - BOX.y0, overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 3%, #000 97%, transparent 100%)'}}>
        <div style={{position: 'absolute', inset: 0, WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 3%, #000 95%, transparent 100%)'}}>
          <div style={{position: 'absolute', left: -BOX.x0, top: -BOX.y0, width: 1080, height: 1920}}>
            <TransitionSeries>
              {SCENES.map(([Comp, d], i) => (
                <React.Fragment key={i}>
                  {i > 0 && <TransitionSeries.Transition presentation={whip(i % 2 ? 1 : -1)} timing={linearTiming({durationInFrames: TR, easing: Easing.inOut(Easing.cubic)})} />}
                  <TransitionSeries.Sequence durationInFrames={d}><Comp /></TransitionSeries.Sequence>
                </React.Fragment>
              ))}
            </TransitionSeries>
            <HeaderBar />
            <Overlay />
          </div>
        </div>
      </div>
    </AbsoluteFill>
    {CUTS.map((c, i) => <Sfx key={c} name={i % 2 ? 'swell_b.wav' : 'swell_a.wav'} at={c - 13} volume={0.45} />)}
  </AbsoluteFill>
);
