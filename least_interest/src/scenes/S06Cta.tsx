import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {Scene} from '../components/Scene';
import {Eyebrow, Headline} from '../components/Text';
import {Sfx} from '../components/Sfx';
import {C, FONT, W} from '../theme';

const set = () => {};
export const S06Cta: React.FC = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const ck = spring({frame: f - 6, fps, config: {damping: 200}});
  const pk = spring({frame: f - 30, fps, config: {damping: 11, mass: 0.5}});
  const pulse = interpolate(f % 40, [0, 20, 40], [0.4, 1, 0.4]);
  const lines = [0, 1, 2].map((i) => interpolate(f, [4 + i * 3, 24 + i * 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}));
  return (
    <Scene dur={120} set={set}>
      <Eyebrow text="BUILD A MIND THAT NEEDS LESS." y={300} />
      <Headline parts={[['Become stable as a '], ['rock.', true]]} keyAt={12} y={350} size={74} />
      <div style={{position: 'absolute', left: W / 2, top: 930, transform: `translate(-50%,-50%) translateY(${(1 - ck) * 50}px) scale(${interpolate(ck, [0, 1], [0.9, 1])})`, opacity: ck}}>
        <Img src={staticFile('cover.png')} style={{width: 330, display: 'block', border: '2px solid rgba(255,255,255,.85)', boxShadow: `0 0 80px ${C.redGlow}, 0 20px 60px rgba(0,0,0,.8)`}} />
      </div>
      <div style={{position: 'absolute', left: W / 2, top: 1290, transform: `translate(-50%,-50%) scale(${pk})`, padding: '22px 46px', borderRadius: 999, background: '#fff', boxShadow: `0 0 ${20 + pulse * 18}px rgba(255,255,255,.8)`, fontFamily: FONT.head, fontWeight: 900, fontSize: 34, letterSpacing: '0.1em', color: '#000', whiteSpace: 'nowrap'}}>GET THE GUIDE →</div>
      <div style={{position: 'absolute', top: 1370, width: W, textAlign: 'center', fontFamily: FONT.bold, fontWeight: 700, fontSize: 26, letterSpacing: '0.35em', color: C.white, opacity: interpolate(f, [40, 52], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>LINK IN BIO</div>
      <svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}}>{lines.map((k, i) => <line key={i} x1={0} y1={1470 + i * 24} x2={W * k} y2={1470 + i * 24 + 14 * k} stroke={C.red} strokeOpacity={0.75} strokeWidth={2.5} />)}</svg>
      <Sfx name="cta_swell.wav" at={0} volume={0.45} />
    </Scene>
  );
};
