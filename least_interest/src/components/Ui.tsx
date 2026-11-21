// In-world UI: pill tags, speech bubbles, counters, stamina bars, stamps, stress zigzags, flashes.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';

const pop = (frame: number, at: number, fps: number) => spring({frame: frame - at, fps, config: {damping: 13, mass: 0.5}});
const fadeOut = (frame: number, until?: number) => (until == null ? 1 : interpolate(frame, [until - 6, until], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

export const Tag: React.FC<{x: number; y: number; text: string; red?: boolean; at?: number; until?: number; size?: number}> = ({x, y, text, red, at = 0, until, size = 24}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); if (frame < at) return null;
  const k = pop(frame, at, fps); const col = red ? C.red : C.white; const fl = interpolate((frame + x) % 90, [0, 45, 90], [-3, 3, -3], {easing: Easing.inOut(Easing.sin)});
  return (
    <div style={{position: 'absolute', left: x, top: y + fl, transform: `translate(-50%,-50%) scale(${interpolate(k, [0, 1], [0.6, 1])})`, opacity: Math.min(1, k * 2) * fadeOut(frame, until),
      display: 'flex', alignItems: 'center', gap: 12, padding: `${size * 0.42}px ${size * 0.9}px`, borderRadius: 999, background: 'rgba(14,14,17,.92)', border: `2.5px solid ${red ? C.red : 'rgba(242,242,242,.85)'}`,
      boxShadow: `0 0 18px ${red ? C.redGlow : 'rgba(255,255,255,.25)'}`, fontFamily: FONT.bold, fontWeight: 700, fontSize: size, letterSpacing: '0.12em', color: col, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>
      <span style={{width: size * 0.36, height: size * 0.36, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}`}} />{text}
    </div>);
};
export const Bubble: React.FC<{x: number; y: number; text: string; red?: boolean; at?: number; until?: number; tail?: number; thought?: boolean; size?: number}> = ({x, y, text, red, at = 0, until, tail = 0, thought, size = 32}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); if (frame < at) return null;
  const k = pop(frame, at, fps); const col = red ? C.red : C.white;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-100%) scale(${interpolate(k, [0, 1], [0.5, 1])})`, transformOrigin: '50% 100%', opacity: Math.min(1, k * 2) * fadeOut(frame, until)}}>
      <div style={{position: 'relative', padding: `${size * 0.45}px ${size * 0.8}px`, borderRadius: 20, background: 'rgba(12,12,14,.94)', border: `3.5px solid ${col}`, boxShadow: `0 0 20px ${red ? C.redGlow : 'rgba(255,255,255,.35)'}`,
        fontFamily: FONT.head, fontWeight: 900, fontSize: size, letterSpacing: '0.04em', color: col, whiteSpace: 'nowrap'}}>
        {text}
        {thought ? (<>
          <span style={{position: 'absolute', left: `calc(50% + ${tail}px)`, bottom: -26, width: 18, height: 18, borderRadius: '50%', background: 'rgba(12,12,14,.94)', border: `3px solid ${col}`}} />
          <span style={{position: 'absolute', left: `calc(50% + ${tail - 14}px)`, bottom: -48, width: 11, height: 11, borderRadius: '50%', background: 'rgba(12,12,14,.94)', border: `3px solid ${col}`}} />
        </>) : (
          <svg style={{position: 'absolute', left: `calc(50% + ${tail}px - 16px)`, bottom: -30}} width={32} height={32}><path d="M2 0 L16 28 L30 0" fill="rgba(12,12,14,.94)" stroke={col} strokeWidth={3.5} /><rect x={0} y={-3} width={32} height={5} fill="rgba(12,12,14,.94)" /></svg>
        )}
      </div>
    </div>);
};
// Tabular counter: eases out, holds the final value for the last 10 frames of its window.
export const useCount = (from: number, to: number, start: number, end: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, end - 10], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
};
export const Stamina: React.FC<{x: number; y: number; value: number; red?: boolean; label?: string}> = ({x, y, value, red, label = 'STAMINA'}) => {
  const col = red ? C.red : C.white; const w = 220;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, fontFamily: FONT.bold, fontWeight: 700}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 18, letterSpacing: '0.2em', color: 'rgba(242,242,242,.75)', marginBottom: 6, fontVariantNumeric: 'tabular-nums'}}><span>{label}</span><span style={{color: col}}>{Math.round(value)}%</span></div>
      <div style={{height: 18, borderRadius: 9, border: '2px solid rgba(242,242,242,.55)', padding: 2}}><div style={{height: '100%', width: `${Math.max(4, value)}%`, borderRadius: 7, background: col, boxShadow: `0 0 12px ${col}`}} /></div>
    </div>);
};
export const Stamp: React.FC<{x: number; y: number; text: string; at: number; rot?: number}> = ({x, y, text, at, rot = -12}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); if (frame < at) return null;
  const k = spring({frame: frame - at, fps, config: {damping: 9, mass: 0.6, stiffness: 220}});
  return <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${interpolate(k, [0, 1], [2.4, 1])})`, opacity: Math.min(1, k * 2),
    padding: '10px 22px', border: `5px solid ${C.red}`, borderRadius: 10, fontFamily: FONT.head, fontWeight: 900, fontSize: 38, letterSpacing: '0.08em', color: C.red, background: 'rgba(229,56,59,.08)', textShadow: `0 0 12px ${C.redGlow}`, whiteSpace: 'nowrap'}}>{text}</div>;
};
export const Zigzag: React.FC<{x: number; y: number; on: number}> = ({x, y, on}) => {
  const frame = useCurrentFrame(); if (on <= 0) return null;
  const j = interpolate(frame % 4, [0, 2, 4], [-2, 2, -2]);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {[-2.3, -1.65, -1.0].map((a, i) => {const pts = [0, 1, 2, 3, 4].map((k2) => {const r = 48 + k2 * 10, o = (k2 % 2 ? 1 : -1) * 8; return `${x + Math.cos(a) * r - Math.sin(a) * o + j},${y + Math.sin(a) * r + Math.cos(a) * o}`;}).join(' ');
        return <polyline key={i} points={pts} fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={on} style={{filter: `drop-shadow(0 0 6px ${C.red})`}} />;})}
    </svg>);
};
export const Flash: React.FC<{at?: number; len?: number; strength?: number}> = ({at = 0, len = 5, strength = 0.22}) => {
  const frame = useCurrentFrame(); const o = interpolate(frame, [at, at + len], [strength, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < at || o <= 0) return null; return <AbsoluteFill style={{background: '#fff', opacity: o}} />;
};
// Slow 1.00 → 1.04 push-in for every scene.
export const PushIn: React.FC<{dur: number; children: React.ReactNode; to?: number}> = ({dur, children, to = 1.04}) => {
  const frame = useCurrentFrame(); const z = interpolate(frame, [0, dur], [1, to], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 55%'}}>{children}</AbsoluteFill>;
};
