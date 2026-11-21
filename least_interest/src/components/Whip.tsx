// Custom whip-pan transition: both shots slide with directional blur; a light flare peaks at the cut.
import React from 'react';
import {AbsoluteFill, interpolate, Easing} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {W} from '../theme';

type P = {dir: 1 | -1};
const Whip: React.FC<TransitionPresentationComponentProps<P>> = ({children, presentationDirection, presentationProgress, passedProps}) => {
  const p = presentationProgress, d = passedProps.dir;
  const entering = presentationDirection === 'entering';
  const x = entering ? interpolate(p, [0, 1], [W * 0.55 * d, 0], {easing: Easing.out(Easing.cubic)}) : interpolate(p, [0, 1], [0, -W * 0.55 * d], {easing: Easing.in(Easing.cubic)});
  const blur = entering ? interpolate(p, [0, 1], [22, 0], {easing: Easing.out(Easing.quad)}) : interpolate(p, [0, 1], [0, 22], {easing: Easing.in(Easing.quad)});
  const op = entering ? interpolate(p, [0, 0.45], [0, 1], {extrapolateRight: 'clamp'}) : interpolate(p, [0.55, 1], [1, 0], {extrapolateLeft: 'clamp'});
  const flare = entering ? interpolate(p, [0, 0.35, 1], [0.35, 0.18, 0], {extrapolateRight: 'clamp'}) : 0;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <AbsoluteFill style={{transform: `translateX(${x}px) scaleX(${1 + blur / 400})`, filter: `blur(${blur}px)`}}>{children}</AbsoluteFill>
      {flare > 0 && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(255,235,220,.9), rgba(229,56,59,.15) 45%, rgba(0,0,0,0) 70%)', opacity: flare, mixBlendMode: 'screen'}} />}
    </AbsoluteFill>
  );
};
export const whip = (dir: 1 | -1 = 1): TransitionPresentation<P> => ({component: Whip, props: {dir}});
