// Reusable cast for "Two Versions of You". Every scene draws these exact definitions,
// so proportions, clothing and colors stay consistent across the whole video.
import {person,Pz,lpz,walkP,runP,SIT,SLUMP,TALL,GUARD,JAB,phone} from './engine/lib.js';

export const FIRST={skin:'#a3a3ab',top:'#3e3e46',bot:'#2c2c33',shoe:'#d9d9de',outfit:'hoodie',hair:'cap',hairCol:'#a3182f'};
export const SECOND={skin:'#f7f7f9',top:'#dfe0e6',bot:'#3a3b42',shoe:'#ffffff',outfit:'tee',hair:'short',hairCol:'#24242a',glow:1};
export const FRIENDS=[
  {skin:'#84848d',top:'#4b3f45',bot:'#26262c',shoe:'#bdbdc4',outfit:'tee',hair:'pony',hairCol:'#1d1d22'},
  {skin:'#8d8d95',top:'#334048',bot:'#2a2a30',shoe:'#c4c4cb',outfit:'hoodie',hair:'beanie',hairCol:'#5b2a33'},
  {skin:'#73737c',top:'#55505a',bot:'#222227',shoe:'#b5b5bc',outfit:'tee',hair:'long',hairCol:'#141418'},
];

// ---- pose library (angles in radians; see engine person()) ----
export const POSES={
  stand:TALL,
  slouch:Pz({lean:.16,hd:.35,aF:[.1,.25],aB:[-.05,.25],lF:[.05,0],lB:[-.05,0]}),
  sit:SIT,
  slump:SLUMP,
  guard:GUARD,
  jab:JAB,
  point:Pz({lean:.08,hd:.05,aF:[1.55,0],aB:[-.12,.2],lF:[.12,0],lB:[-.1,0]}),
  phoneLook:Pz({lean:.1,hd:.55,aF:[.55,1.55],aB:[.45,1.6],lF:[.05,0],lB:[-.08,.02]}),
  laugh:Pz({lean:-.18,hd:-.35,aF:[.6,1.9],aB:[-.3,.6],lF:[.1,0],lB:[-.1,0]}),
  deadliftDown:Pz({lean:.95,hd:-.6,aF:[.25,0],aB:[.2,0],lF:[1.05,-1.25],lB:[.95,-1.2]}),
  deadliftUp:Pz({lean:0,hd:-.05,aF:[.05,0],aB:[0,0],lF:[.03,0],lB:[-.03,0]}),
};
export function talkPose(t,amp=1){return Pz({lean:.05+Math.sin(t*4)*.03*amp,hd:Math.sin(t*5)*.08*amp,aF:[.5+Math.sin(t*6)*.5*amp,.9+Math.sin(t*7)*.4*amp],aB:[-.15,.4],lF:[.08,0],lB:[-.08,0]})}
export {walkP,runP,lpz,phone};

export const drawFirst=(o)=>person({...FIRST,...o});
export const drawSecond=(o)=>person({...SECOND,...o});
export const drawFriend=(i,o)=>person({...FRIENDS[i],...o});
