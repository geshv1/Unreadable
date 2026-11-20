// Header bar, eyebrows, headlines and pop-up text — bold, high-contrast type.
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {C, FONT, W, SAFE} from '../theme';

export const HeaderBar: React.FC = () => (
  <div style={{position: 'absolute', top: SAFE.header - 22, left: 0, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34, fontFamily: FONT.bold, fontWeight: 700, fontSize: 30, letterSpacing: '0.3em'}}>
    <span style={{color: C.red, textShadow: `0 0 14px ${C.redGlow}`, width: 330, textAlign: 'right'}}>REACTIVE</span>
    <span style={{width: 2, height: 34, background: 'rgba(242,242,242,.35)'}} />
    <span style={{color: C.white, width: 330, textShadow: '0 0 12px rgba(255,255,255,.35)'}}>STEADY</span>
  </div>
);

const appear = (frame: number, at: number, fps: number) => spring({frame: frame - at, fps, config: {damping: 200, mass: 0.6}});
export const Eyebrow: React.FC<{text: string; at?: number; y?: number}> = ({text, at = 0, y = 300}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const k = at <= 0 ? 1 : appear(frame, at, fps);
  return <div style={{position: 'absolute', top: y, left: 0, width: W, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 12}px)`, fontFamily: FONT.bold, fontWeight: 700, fontSize: 26, letterSpacing: '0.3em', color: '#b9b9c0'}}>— {text} —</div>;
};
// parts: [text, isKey][] — the key word is red with a short hairline underline.
export const Headline: React.FC<{parts: [string, boolean?][]; at?: number; keyAt?: number; y?: number; size?: number}> = ({parts, at = 0, keyAt, y = 350, size = 72}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const k = at <= 0 ? 1 : appear(frame, at, fps);
  return (
    <div style={{position: 'absolute', top: y, left: 130, width: 820, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 18}px)`, fontFamily: FONT.head, fontWeight: 900, fontSize: size, lineHeight: 1.08, color: C.white, textShadow: '0 4px 24px rgba(0,0,0,.8)'}}>
      {parts.map(([t, key], i) => {
        if (!key) return <span key={i}>{t}</span>;
        const kk = keyAt == null ? 1 : spring({frame: frame - keyAt, fps, config: {damping: 12, mass: 0.5}});
        const ul = keyAt == null ? 1 : interpolate(frame, [keyAt + 4, keyAt + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        return (<span key={i} style={{position: 'relative', display: 'inline-block', color: C.red, textShadow: `0 0 26px ${C.redGlow}`, transform: `scale(${interpolate(kk, [0, 1], [1.4, 1])})`, opacity: Math.min(1, kk * 1.5)}}>
          {t}<span style={{position: 'absolute', left: '15%', right: '15%', bottom: -6, height: 4, borderRadius: 2, background: C.red, transform: `scaleX(${ul})`, boxShadow: `0 0 10px ${C.redGlow}`}} /></span>);
      })}
    </div>
  );
};
export const PopText: React.FC<{parts: [string, boolean?][]; at: number; y?: number; size?: number}> = ({parts, at, y = 560, size = 60}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); if (frame < at) return null;
  const k = spring({frame: frame - at, fps, config: {damping: 14, mass: 0.6}});
  return <div style={{position: 'absolute', top: y, left: 0, width: W, transform: `scale(${interpolate(k, [0, 1], [0.85, 1])})`, opacity: Math.min(1, k * 1.4)}}><Headline parts={parts} y={0} size={size} /></div>;
};
