// Phone chat mock (in-world UI) with typing indicator.
import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {C, FONT} from '../theme';
import {loop} from './rig';
export type Msg = {at: number; text: string; sent?: boolean; status?: string};
const CL = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const ChatPhone: React.FC<{x: number; y: number; w: number; h: number; name: string; sub?: string; msgs: Msg[]; maxVisible?: number; typing?: [number, number]; at?: number}> = ({x, y, w, h, name, sub, msgs, maxVisible = 4, typing, at = 0}) => {
  const f = useCurrentFrame(); const shown = msgs.filter((m) => f >= m.at); const vis = shown.slice(-maxVisible);
  const inK = interpolate(f, [at, at + 10], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  const typ = typing ? interpolate(f, [typing[0], typing[0] + 5, typing[1] - 4, typing[1]], [0, 1, 1, 0], CL) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 38, background: '#0f1116', border: '3px solid rgba(242,242,242,.2)', boxShadow: '0 20px 50px rgba(0,0,0,.65)', overflow: 'hidden', fontFamily: FONT.bold, fontWeight: 700,
      opacity: inK, transform: `translateY(${(1 - inK) * 30}px)`}}>
      <div style={{height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#16181f', color: C.white}}>
        <div style={{fontSize: 22, letterSpacing: '0.2em'}}>{name}</div>
        {sub && <div style={{fontSize: 15, letterSpacing: '0.12em', color: 'rgba(242,242,242,.5)', fontVariantNumeric: 'tabular-nums'}}>{sub}</div>}
      </div>
      <div style={{padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10}}>
        {vis.map((m, i) => {const k = interpolate(f, [m.at, m.at + 6], [0, 1], {...CL, easing: Easing.out(Easing.back(1.6))});
          return (<div key={m.at + m.text} style={{alignSelf: m.sent ? 'flex-end' : 'flex-start', maxWidth: '86%', opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 14}px) scale(${interpolate(k, [0, 1], [0.85, 1])})`, transformOrigin: m.sent ? '100% 100%' : '0% 100%'}}>
            <div style={{padding: '10px 18px', borderRadius: 20, background: m.sent ? '#e9ecf3' : '#2a2d36', color: m.sent ? '#111' : '#fff', fontSize: 24}}>{m.text}</div>
            {m.status && i === vis.length - 1 && <div style={{textAlign: m.sent ? 'right' : 'left', fontSize: 15, marginTop: 4, color: m.status === 'Delivered' ? C.red : 'rgba(255,255,255,.5)', letterSpacing: '0.05em'}}>{m.status}</div>}
          </div>);})}
        {typ > 0 && <div style={{alignSelf: 'flex-start', padding: '14px 18px', borderRadius: 20, background: '#2a2d36', display: 'flex', gap: 7, opacity: typ, transform: `scale(${interpolate(typ, [0, 1], [0.7, 1])})`, transformOrigin: '0% 100%'}}>
          {[0, 1, 2].map((d) => <span key={d} style={{width: 11, height: 11, borderRadius: '50%', background: '#fff', opacity: loop(f + d * 4, 14, 0.3, 1), transform: `translateY(${loop(f + d * 4, 14, 0, -5)}px)`}} />)}
        </div>}
      </div>
    </div>);
};
