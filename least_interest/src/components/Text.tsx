// Header bar, eyebrows, headlines (word-by-word reveal) and pop-up text — bold, high-contrast type.
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
const CL = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const Eyebrow: React.FC<{text: string; at?: number; y?: number}> = ({text, at = 0, y = 300}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [at, at + 14], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  return <div style={{position: 'absolute', top: y, left: 0, width: W, textAlign: 'center', opacity: k, fontFamily: FONT.bold, fontWeight: 700, fontSize: 26,
    letterSpacing: `${interpolate(k, [0, 1], [0.55, 0.3])}em`, color: '#b9b9c0'}}>— {text} —</div>;
};
// parts: [text, isKey][] — words reveal one after another; the key word slams in red with a hairline underline.
export const Headline: React.FC<{parts: [string, boolean?][]; at?: number; keyAt?: number; y?: number; size?: number; stagger?: number}> = ({parts, at = 0, keyAt, y = 350, size = 72, stagger = 3}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const words: {t: string; key: boolean}[] = [];
  parts.forEach(([t, key]) => t.split(' ').forEach((w, i, arr) => {if (w) words.push({t: w, key: !!key}); if (i < arr.length - 1) words.push({t: ' ', key: false});}));
  let n = 0;
  return (
    <div style={{position: 'absolute', top: y, left: 130, width: 820, textAlign: 'center', fontFamily: FONT.head, fontWeight: 900, fontSize: size, lineHeight: 1.1, color: C.white, textShadow: '0 4px 24px rgba(0,0,0,.85)'}}>
      {words.map((w, i) => {
        if (w.t === ' ') return <span key={i}> </span>;
        const start = w.key && keyAt != null ? keyAt : at + (n++) * stagger;
        const k = spring({frame: f - start, fps, config: w.key ? {damping: 10, mass: 0.55, stiffness: 170} : {damping: 200, mass: 0.45}});
        const op = interpolate(k, [0, 0.35], [0, 1], CL);
        const ul = interpolate(f, [start + 5, start + 16], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', opacity: op, color: w.key ? C.red : C.white, textShadow: w.key ? `0 0 26px ${C.redGlow}` : undefined,
            transform: w.key ? `scale(${interpolate(k, [0, 1], [1.7, 1])})` : `translateY(${interpolate(k, [0, 1], [28, 0])}px)`, filter: `blur(${interpolate(k, [0, 1], [8, 0], CL)}px)`}}>
            {w.t}
            {w.key && <span style={{position: 'absolute', left: '12%', right: '12%', bottom: -6, height: 4, borderRadius: 2, background: C.red, transform: `scaleX(${ul})`, boxShadow: `0 0 10px ${C.redGlow}`}} />}
          </span>);
      })}
    </div>
  );
};
export const PopText: React.FC<{parts: [string, boolean?][]; at: number; y?: number; size?: number; keyDelay?: number}> = ({parts, at, y = 560, size = 60, keyDelay = 7}) => {
  const f = useCurrentFrame(); if (f < at - 1) return null;
  const nWords = parts.filter(([, k]) => !k).reduce((a, [t]) => a + t.split(' ').filter(Boolean).length, 0);
  return <Headline parts={parts} at={at} keyAt={at + nWords * 3 + keyDelay} y={y} size={size} />;
};
