// CTA — guide cover with a slow 3D settle, a light sheen, rising embers, pulsing button.
import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing, AbsoluteFill} from 'remotion';
import {Eyebrow, Headline} from '../components/Text';
import {Sfx} from '../components/Sfx';
import {loop} from '../components/rig';
import {C, FONT, W} from '../theme';

export const CTA_DUR = 96;
const CL = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const S06Cta: React.FC = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const ck = spring({frame: f - 4, fps, config: {damping: 200, mass: 0.8}});
  const pk = spring({frame: f - 34, fps, config: {damping: 11, mass: 0.5}});
  const pulse = loop(f, 40, 0.4, 1);
  const sheen = interpolate(f, [28, 50], [-160, 520], {...CL, easing: Easing.inOut(Easing.cubic)});
  const lines = [0, 1, 2].map((i) => interpolate(f, [4 + i * 3, 26 + i * 3], [0, 1], {...CL, easing: Easing.inOut(Easing.cubic)}));
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 22}).map((_, i) => {const x = 120 + ((i * 397) % 780), sp = 60 + (i * 37) % 70, ph = (f + i * 13) % sp; const y = interpolate(ph, [0, sp], [1520, 720]);
          return <circle key={i} cx={x + loop(f + i * 9, 50, -12, 12)} cy={y} r={1.5 + (i % 3)} fill={i % 4 ? '#ff6b6e' : '#ffd2a8'} opacity={interpolate(ph, [0, sp * 0.2, sp * 0.8, sp], [0, 0.55, 0.4, 0])} />;})}
        {lines.map((k, i) => <line key={i} x1={0} y1={1480 + i * 22} x2={W * k} y2={1480 + i * 22 + 14 * k} stroke={C.red} strokeOpacity={0.75} strokeWidth={2.5} />)}
      </svg>
      <Eyebrow text="BUILD A MIND THAT NEEDS LESS." y={468} />
      <Headline parts={[['Become stable as a '], ['rock.', true]]} at={0} keyAt={14} y={506} size={82} />
      <div style={{position: 'absolute', left: W / 2, top: 990, perspective: 900, transform: 'translate(-50%,-50%)'}}>
        <div style={{position: 'relative', overflow: 'hidden', transform: `translateY(${(1 - ck) * 60 + loop(f, 70, -5, 5)}px) rotateY(${interpolate(ck, [0, 1], [-22, 0]) + loop(f, 90, -3, 3)}deg) rotateX(${loop(f, 110, -2, 2)}deg) scale(${interpolate(ck, [0, 1], [0.88, 1])})`, opacity: ck,
          boxShadow: `0 0 90px ${C.redGlow}, 0 24px 60px rgba(0,0,0,.85)`, border: '2px solid rgba(255,255,255,.85)'}}>
          <Img src={staticFile('cover.png')} style={{width: 330, display: 'block'}} />
          <div style={{position: 'absolute', top: -40, bottom: -40, left: sheen, width: 90, transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: W / 2, top: 1330, transform: `translate(-50%,-50%) scale(${pk})`, padding: '22px 46px', borderRadius: 999, background: '#fff', boxShadow: `0 0 ${20 + pulse * 22}px rgba(255,255,255,.8)`, fontFamily: FONT.head, fontWeight: 900, fontSize: 34, letterSpacing: '0.1em', color: '#000', whiteSpace: 'nowrap'}}>
        GET THE GUIDE <span style={{display: 'inline-block', transform: `translateX(${loop(f, 24, 0, 8)}px)`}}>→</span></div>
      <div style={{position: 'absolute', top: 1405, width: W, textAlign: 'center', fontFamily: FONT.bold, fontWeight: 700, fontSize: 26, letterSpacing: '0.35em', color: C.white, opacity: interpolate(f, [44, 56], [0, 1], CL)}}>LINK IN BIO</div>
      <Sfx name="cta_swell.wav" at={0} volume={0.55} />
      <Sfx name="sheen.wav" at={28} volume={0.4} />
      <Sfx name="button_tick.wav" at={34} volume={0.5} />
    </AbsoluteFill>
  );
};
