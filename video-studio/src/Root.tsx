import React from 'react';
import {Composition} from 'remotion';
import {CanvasScene} from './CanvasScene';
import {characterSheet,envPreview,ENVS} from './previews.js';

const W=1080,H=1440,FPS=30;
const Sheet:React.FC=()=><CanvasScene draw={(t)=>characterSheet(t)}/>;
const Env:React.FC<{i:number}>=({i})=><CanvasScene draw={(t)=>envPreview(i,t)}/>;

export const Root:React.FC=()=>(<>
  <Composition id="CharacterSheet" component={Sheet} width={W} height={H} fps={FPS} durationInFrames={90}/>
  {ENVS.map((_,i)=><Composition key={i} id={`Env${i+1}`} component={Env} defaultProps={{i}} width={W} height={H} fps={FPS} durationInFrames={60}/>)}
</>);
