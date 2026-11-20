// Phase 5 previews: character sheet + environment stills.
import {getCtx,S,A,txt,lg,rg,W,H,vignette,grain,lerp} from './engine/lib.js';
import {drawFirst,drawSecond,drawFriend,POSES,walkP,runP,talkPose,phone} from './characters.js';
import {envVoid,envBedroom,envBathroom,envLounge,envGym,barbell,envDawn,envDesk,envRing} from './environments.js';

export function characterSheet(t){const ctx=getCtx();ctx.fillStyle=lg(0,245,0,1685,[[0,'#08080a'],[1,'#0e0e11']]);ctx.fillRect(0,245,W,1440);
 txt('CHARACTER SHEET',540,320,'500 26px Lab','rgba(255,255,255,.6)',{ls:10});
 const cols=[110,270,430,600,770,940],names=['STAND','WALK','RUN','SIT','POINT','TALK'];
 const row=(y,label,col,fn)=>{txt(label,540,y-330,'500 24px Lab',col,{ls:9});S(()=>{ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(60,y+4);ctx.lineTo(1020,y+4);ctx.stroke()});
  cols.forEach((x,i)=>{txt(names[i],x,y+34,'500 16px Lab','rgba(255,255,255,.4)',{ls:5});fn(i,x,y)})};
 const pose=i=>[POSES.stand,walkP(t*7),runP(t*13),POSES.sit,POSES.point,talkPose(t)][i];
 const one=(draw)=>(i,x,y)=>{if(i==3){S(()=>{ctx.fillStyle='#1d1d22';ctx.fillRect(x-36,y-80,72,12);ctx.fillRect(x-30,y-68,8,68)});draw({x,y:y-80+132*.62,s:.62,f:1,pose:pose(i),noShadow:true})}else draw({x,y:y-(i==2?Math.abs(Math.sin(t*13))*8:0),s:.62,f:1,pose:pose(i)})};
 row(760,'THE FIRST ONE','#ff4d6a',one(o=>drawFirst(o)));
 row(1160,'THE SECOND ONE','#ffffff',one(o=>drawSecond(o)));
 txt('THE CIRCLE',540,1230,'500 24px Lab','rgba(255,255,255,.75)',{ls:9});
 [[230,0,POSES.laugh],[440,1,talkPose(t+1)],[650,2,POSES.point]].forEach(([x,i,p])=>drawFriend(i,{x,y:1560,s:.62,f:i==2?-1:1,pose:p}));
 S(()=>drawFirst({x:860,y:1560,s:.62,f:-1,pose:POSES.phoneLook,frontProp:J=>phone(J,1)}));txt('PHONE',860,1594,'500 16px Lab','rgba(255,255,255,.4)',{ls:5});
 vignette(.5);grain(.05,Math.floor(t*12))}

export const ENVS=[
 ['THE VOID',u=>{envVoid(u);drawFirst({x:330,y:1420,s:1.2,f:1,pose:POSES.slouch});drawSecond({x:750,y:1420,s:1.2,f:-1,pose:POSES.stand})}],
 ['MIRRORS',u=>{envBathroom(u);drawFirst({x:270,y:1440,s:1.05,f:1,pose:POSES.slouch});drawSecond({x:810,y:1440,s:1.05,f:1,pose:POSES.stand})}],
 ['BEDROOM · 6:00',u=>{envBedroom(u,'6:00');drawFirst({x:470,y:1262+132*1.15,s:1.15,f:1,pose:POSES.sit,noShadow:true,frontProp:J=>phone(J,1)})}],
 ['THE LOUNGE',u=>{envLounge(u,{door:.4});[[300,0],[456,1],[612,2]].forEach(([x,i])=>drawFriend(i,{x,y:1262+132*1.1,s:1.1,f:1,pose:POSES.sit,noShadow:true}))}],
 ['THE GYM',u=>{envGym(u);drawSecond({x:540,y:1420,s:1.2,f:1,pose:POSES.deadliftUp});barbell(540,1240,8)}],
 ['COLD DAWN',u=>{envDawn(u,u*500);drawSecond({x:520,y:1420,s:1.15,f:1,pose:runP(u*14)})}],
 ['QUIET WORK',u=>{envDesk(u);S(()=>{getCtx().fillStyle='#0a0a0c';getCtx().fillRect(640,1290,110,18)});drawSecond({x:690,y:1290+132*1.1,s:1.1,f:1,pose:POSES.sit,noShadow:true})}],
 ['THE RING',u=>{envRing(u);drawSecond({x:640,y:1306,s:1.22,f:-1,pose:POSES.guard})}],
];
export function envPreview(i,t){ENVS[i][1](t);vignette(.75);grain(.05,1);
 const ctx=getCtx();S(()=>{ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,245,W,120)});txt(String(i+1).padStart(2,'0')+'  ·  '+ENVS[i][0],540,310,'500 30px Lab','#fff',{ls:10})}
