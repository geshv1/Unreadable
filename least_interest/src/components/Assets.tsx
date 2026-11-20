// Font loading + canvas layers (environments from the series' set library, grain/vignette).
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig, AbsoluteFill} from 'remotion';
import {setCtx, vignette, grain} from '../engine/lib.js';

let p: Promise<void> | null = null;
export function loadAssets() {
  if (p) return p;
  const fonts: [string, string, FontFaceDescriptors][] = [
    ['HeadBlack', 'fonts/InterDisplay-Black.otf', {weight: '900'}],
    ['HeadBold', 'fonts/InterDisplay-Bold.otf', {weight: '700'}],
    ['Disp', 'fonts/InterDisplay-Bold.otf', {weight: '700 800'}],
    ['Black', 'fonts/InterDisplay-Black.otf', {weight: '900'}],
    ['Lab', 'fonts/InterDisplay-Bold.otf', {weight: '100 900'}],
  ];
  p = Promise.all(fonts.map(([n, f, d]) => new FontFace(n, `url(${staticFile(f)})`, d).load().then((ff) => {(document.fonts as any).add(ff);}))).then(() => undefined);
  return p;
}
export const useAssets = () => {
  const [h] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {loadAssets().then(() => {setReady(true); continueRender(h);});}, [h]);
  return ready;
};
// Draw a canvas set (environment) for the current frame. `local` = frames since scene start.
export const CanvasLayer: React.FC<{draw: (t: number) => void; local?: boolean}> = ({draw}) => {
  const frame = useCurrentFrame(); const {fps, width, height} = useVideoConfig(); const ref = useRef<HTMLCanvasElement>(null); const ready = useAssets();
  useLayoutEffect(() => {
    if (!ready || !ref.current) return; const c = ref.current.getContext('2d')!; setCtx(c);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.clearRect(0, 0, width, height);
    draw(frame / fps);
  }, [frame, ready, draw, fps, width, height]);
  return <AbsoluteFill><canvas ref={ref} width={width} height={height} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  return <CanvasLayer draw={() => {vignette(0.7); grain(0.055, Math.floor(frame / 2.5));}} />;
};
