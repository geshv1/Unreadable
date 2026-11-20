import React from 'react';
import {Composition,Audio,staticFile,AbsoluteFill} from 'remotion';
import {CanvasScene} from './CanvasScene';
import {characterSheet,envPreview,ENVS} from './previews.js';
import {drawFrame,TOTAL} from './timeline.js';
import {VIDEO_A} from './videos/a_pressure.js';
import {VIDEO_B} from './videos/b_silence.js';
import {VIDEO_C} from './videos/c_detox.js';
import {VIDEO_D} from './videos/d_comfort.js';
import {VIDEO_E} from './videos/e_money.js';

const W=1080,H=1440,FPS=30;
const Sheet:React.FC=()=><CanvasScene draw={(t)=>characterSheet(t)}/>;
const Env:React.FC<{i:number}>=({i})=><CanvasScene draw={(t)=>envPreview(i,t)}/>;

const Main:React.FC=()=>(<AbsoluteFill><CanvasScene draw={(t)=>drawFrame(t)}/><Audio src={staticFile('audio/narration.wav')} volume={1}/><Audio src={staticFile('audio/sfx.wav')} volume={1.2}/></AbsoluteFill>);
const VIDEOS:Record<string,any>={A:VIDEO_A,B:VIDEO_B,C:VIDEO_C,D:VIDEO_D,E:VIDEO_E};
const Series:React.FC<{vid:string,sfx:string}>=({vid,sfx})=>(<AbsoluteFill><CanvasScene draw={(t)=>VIDEOS[vid].draw(t)}/>{sfx?<Audio src={staticFile(sfx)}/>:null}</AbsoluteFill>);
export const Root:React.FC=()=>(<>
  <Composition id="E-Money" component={Series} defaultProps={{vid:'E',sfx:'audio/e_sfx.wav'}} width={W} height={H} fps={FPS} durationInFrames={Math.ceil(VIDEO_E.TOTAL*FPS)}/>
  <Composition id="D-Comfort" component={Series} defaultProps={{vid:'D',sfx:'audio/d_sfx.wav'}} width={W} height={H} fps={FPS} durationInFrames={Math.ceil(VIDEO_D.TOTAL*FPS)}/>
  <Composition id="C-Detox" component={Series} defaultProps={{vid:'C',sfx:'audio/c_sfx.wav'}} width={W} height={H} fps={FPS} durationInFrames={Math.ceil(VIDEO_C.TOTAL*FPS)}/>
  <Composition id="B-Silence" component={Series} defaultProps={{vid:'B',sfx:'audio/b_sfx.wav'}} width={W} height={H} fps={FPS} durationInFrames={Math.ceil(VIDEO_B.TOTAL*FPS)}/>
  <Composition id="A-Pressure" component={Series} defaultProps={{vid:'A',sfx:'audio/a_sfx.wav'}} width={W} height={H} fps={FPS} durationInFrames={Math.ceil(VIDEO_A.TOTAL*FPS)}/>
  <Composition id="TwoVersions" component={Main} width={W} height={H} fps={FPS} durationInFrames={Math.ceil(TOTAL*FPS)}/>
  <Composition id="CharacterSheet" component={Sheet} width={W} height={H} fps={FPS} durationInFrames={90}/>
  {ENVS.map((_,i)=><Composition key={i} id={`Env${i+1}`} component={Env} defaultProps={{i}} width={W} height={H} fps={FPS} durationInFrames={60}/>)}
</>);
