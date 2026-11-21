// Phone chat mock (in-world UI).
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
export type Msg = {at: number; text: string; sent?: boolean; status?: string};
export const ChatPhone: React.FC<{x: number; y: number; w: number; h: number; name: string; msgs: Msg[]; maxVisible?: number}> = ({x, y, w, h, name, msgs, maxVisible = 4}) => {
  const f = useCurrentFrame(); const shown = msgs.filter((m) => f >= m.at); const vis = shown.slice(-maxVisible);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 38, background: '#0f1116', border: '3px solid rgba(242,242,242,.2)', boxShadow: '0 20px 50px rgba(0,0,0,.65)', overflow: 'hidden', fontFamily: FONT.bold, fontWeight: 700}}>
      <div style={{height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#16181f', color: C.white, fontSize: 22, letterSpacing: '0.2em'}}>{name}</div>
      <div style={{padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10}}>
        {vis.map((m, i) => {const k = interpolate(f, [m.at, m.at + 6], [0, 1], {extrapolateRight: 'clamp'});
          return (<div key={m.at + m.text} style={{alignSelf: m.sent ? 'flex-end' : 'flex-start', maxWidth: '86%', opacity: k, transform: `translateY(${(1 - k) * 14}px) scale(${interpolate(k, [0, 1], [0.9, 1])})`}}>
            <div style={{padding: '10px 18px', borderRadius: 20, background: m.sent ? '#e9ecf3' : '#2a2d36', color: m.sent ? '#111' : '#fff', fontSize: 24}}>{m.text}</div>
            {m.status && i === vis.length - 1 && <div style={{textAlign: m.sent ? 'right' : 'left', fontSize: 15, marginTop: 4, color: m.status === 'Delivered' ? C.red : 'rgba(255,255,255,.5)', letterSpacing: '0.05em'}}>{m.status}</div>}
          </div>);})}
      </div>
    </div>);
};
