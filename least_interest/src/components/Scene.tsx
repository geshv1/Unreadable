// Scene shell: canvas set + push-in + SVG layer + header bar + cut flash.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CanvasLayer} from './Assets';
import {HeaderBar} from './Text';
import {PushIn, Flash} from './Ui';
import {W, H, C} from '../theme';

export const Scene: React.FC<{dur: number; set: (t: number) => void; svg?: React.ReactNode; flash?: boolean; children?: React.ReactNode}> = ({dur, set, svg, flash = true, children}) => (
  <AbsoluteFill style={{background: C.bg}}>
    <PushIn dur={dur}>
      <CanvasLayer draw={set} />
      {svg && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>{svg}</svg>}
      {children}
    </PushIn>
    <HeaderBar />
    {flash && <Flash />}
  </AbsoluteFill>
);
