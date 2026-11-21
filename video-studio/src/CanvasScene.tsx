import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {setCtx,setCover} from './engine/lib.js';

// Design space is 1080×1920 (legacy rig); the 3:4 frame shows y ≈ 245…1685 of it.
export const VIEW_OFFSET_Y=245;
// TikTok safe area: shrink the whole picture and keep it clear of the right-side buttons and bottom caption.
export const SAFE={scale:.86,x:28,y:46};
// 9:16 (1080×1920): picture block sits inside TikTok's safe zone — clear of the top tabs,
// the right-side like/comment/share column and the bottom caption area.
export const SAFE_916={scale:.6806,x:110,y:320}; // measured TikTok clear area: x 110–845, y 245–1375
let assetsPromise:Promise<void>|null=null;
function loadAssets(){
  if(assetsPromise)return assetsPromise;
  const fonts:[string,string,FontFaceDescriptors][]=[
    ['Disp','fonts/InterDisplay-Bold.otf',{weight:'700 800'}],
    ['Black','fonts/InterDisplay-Black.otf',{weight:'900'}],
    // Captions: bold, high-legibility Inter Display (replaces the thin serif/Tenor caption fonts).
    ['Lab','fonts/InterDisplay-Bold.otf',{weight:'100 900'}],
    ['Ser','fonts/InterDisplay-Black.otf',{style:'italic',weight:'100 900'}],
  ];
  assetsPromise=Promise.all([
    ...fonts.map(([n,f,d])=>new FontFace(n,`url(${staticFile(f)})`,d).load().then(ff=>{(document.fonts as any).add(ff)})),
    new Promise<void>((res,rej)=>{const img=new Image();img.onload=()=>{setCover(img);res()};img.onerror=rej;img.src=staticFile('img/cover.jpg')}),
  ]).then(()=>undefined);
  return assetsPromise;
}

export const CanvasScene:React.FC<{draw:(t:number,frame:number)=>void}>=({draw})=>{
  const frame=useCurrentFrame();const {fps,width,height}=useVideoConfig();
  const ref=useRef<HTMLCanvasElement>(null);
  const [handle]=useState(()=>delayRender('assets'));const [ready,setReady]=useState(false);
  useEffect(()=>{loadAssets().then(()=>{setReady(true);continueRender(handle)})},[handle]);
  useLayoutEffect(()=>{
    if(!ready||!ref.current)return;const c=ref.current.getContext('2d')!;setCtx(c);
    c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.fillStyle='#000';c.fillRect(0,0,width,height);
    const sf=height>=1900?SAFE_916:SAFE;c.save();c.translate(sf.x,sf.y);c.beginPath();c.rect(0,0,1080*sf.scale,1440*sf.scale);c.clip();c.scale(sf.scale,sf.scale);c.translate(0,-VIEW_OFFSET_Y);draw(frame/fps,frame);c.restore();
  },[frame,ready,draw,fps,width,height]);
  return <canvas ref={ref} width={width} height={height} style={{width:'100%',height:'100%'}}/>;
};
