// VIDEO C — "30-Day Dopamine Detox"  (no narration · 3:4 · ~40 s)
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,eback,clamp,rng,W,H,CR,CRL,WARM,dust,droplets,zig,stage,person,Pz,lpz,walkP,runP,SIT,SLUMP,TALL,phone,rays} from '../engine/lib.js';
import {FIRST,SECOND,POSES} from '../characters.js';
import {envBedroom,envDesk,envDawn,envLounge} from '../environments.js';
import {FL,scoreboard,pop,say,phoneFrame,tag,title2,divider,endCard,makeTimeline,camPush} from '../kit/kit.js';
const C=()=>getCtx();
const R=(o)=>person({...FIRST,...o});const St=(o)=>person({...SECOND,...o});
const sitY=s=>1262+132*s;
function half(side,fn){const c=C();S(()=>{c.beginPath();c.rect(side?542:0,690,538,1000);c.clip();fn()})}
function detoxBox(x,y,open=0,glow=0){const c=C();S(()=>{c.fillStyle='#0a0a0c';rr(x-60,y-50,120,54,6);c.fill();c.fillStyle='#3a2f28';rr(x-56,y-46,112,46,5);c.fill();txt('DETOX',x,y-23,'800 14px Disp','rgba(255,255,255,.6)',{ls:3});
 c.save();c.translate(x-60,y-50);c.rotate(-open*1.1);c.fillStyle='#0a0a0c';rr(0,-12,120,14,4);c.fill();c.fillStyle='#4a3d33';rr(3,-9,114,8,3);c.fill();c.restore();
 if(glow>0){c.globalCompositeOperation='screen';c.fillStyle=rg(x,y-50,0,120,[[0,`rgba(150,180,255,${.4*glow})`],[1,'rgba(150,180,255,0)']]);c.fillRect(x-130,y-180,260,200)}})}
function buzz(x,y,u,a=1){const c=C();A(a,()=>S(()=>{const j=Math.sin(u*60)*3;c.translate(x+j,y);c.strokeStyle=CRL;c.lineWidth=3;c.shadowColor=CR;c.shadowBlur=12;rr(-14,-24,28,48,6);c.stroke();[-1,1].forEach(sd=>{c.beginPath();c.moveTo(sd*24,-12);c.lineTo(sd*30,-4);c.lineTo(sd*24,4);c.lineTo(sd*30,12);c.stroke()})}))}
function meter(x,y,w,label,v,col){const c=C();txt(label,x,y-30,'500 18px Lab','rgba(255,255,255,.75)',{ls:5});S(()=>{c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=2;rr(x-w/2,y-14,w,28,14);c.stroke();c.fillStyle=col;c.shadowColor=col;c.shadowBlur=14;rr(x-w/2+5,y-9,Math.max(18,(w-10)*v),18,9);c.fill()})}

// C1 HOOK
function c1(u){const c=C();stage(u,[[330,1,'#ff8a9c'],[750,1,'#ffffff']]);
 const g=.6+.4*Math.sin(u*5);S(()=>{c.fillStyle='#0a0a0c';rr(400,760,280,480,40);c.fill();c.fillStyle=lg(0,780,0,1220,[[0,`rgba(150,170,255,${.5*g})`],[1,'rgba(212,34,63,.35)']]);rr(414,774,252,452,32);c.fill();
  ['♥','▶','✉','★'].forEach((s,i)=>{const k=((u*.6+i/4)%1);c.globalAlpha=1-k;txt(s,460+i*55,1180-k*380,'800 34px Disp','#fff',{glow:14})})});
 R({x:300,y:FL,s:1.15,f:1,pose:Pz({lean:.12,hd:-.1,aF:[1.3,.3],aB:[-.2,.4]}),mood:'smile',t:u});St({x:780,y:FL,s:1.15,f:-1,pose:TALL,mood:'calm',t:u});
 tag(300,FL+70,'REACTIVE',CRL);tag(780,FL+70,'STEADY','#fff');
 title2(u,.1,'30 DAYS. NO CHEAP DOPAMINE.',null,520);title2(u,.85,'Only one ','made it.',632)}
// C2 DAY 1
function c2(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 [[0,R,'neutral'],[1,St,'calm']].forEach(([sd,ch,mood])=>half(sd,()=>{c.translate(sd?420:-120,0);envBedroom(u,'7:00');c.translate(sd?-420:120,0);const bx=sd?840:300;
  S(()=>{c.fillStyle='#0a0a0c';c.fillRect(bx-80,1240,160,180);c.fillStyle='#1d1b20';c.fillRect(bx-74,1246,148,168)});
  const put=eio(seg(u,.4,1.4)),close=eo(seg(u,1.4,1.8));detoxBox(bx,1240,1-close,1-close);
  ch({x:bx-130,y:FL,s:1.08,f:1,pose:Pz({lean:.2*put*(1-close),hd:.3,aF:[lerp(.8,1.4,put)*(1-close)+.1*close,lerp(1.2,.2,put)],aB:[-.1,.3]}),mood:sd||u<2?mood:'shock',t:u,frontProp:J=>{if(put<.9)phone(J,.7)}});
  if(!sd&&u>2.0)[0,1].forEach(i=>buzz(bx-60+i*120,1100-i*30,u,eo(seg(u,2.0+i*.5,2.3+i*.5))*(1-seg(u,2.4+i*.5,2.7+i*.5))))}));
 divider();scoreboard(u,'DAY 1 · FOCUS','12%','12%')}
// C3 DAY 3 CRAVING
function c3(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{c.translate(-120,0);envBedroom(u,'2:13');c.translate(120,0);detoxBox(300,1240,0,.6+.4*Math.sin(u*6));S(()=>{c.fillStyle='#0a0a0c';c.fillRect(220,1240,160,180)});
  const reach=.5+.5*Math.sin(u*2.2);R({x:170,y:FL,s:1.08,f:1,pose:Pz({lean:.25+reach*.15,hd:.4,aF:[1.1+reach*.3,.3+Math.sin(u*40)*.06],aB:[-.2,.4]}),mood:'shock',t:u});
  [0,1,2].forEach(i=>buzz(140+i*130,960+(i%2)*60,u,(Math.sin(u*3+i*2)>.3)?1:0));meter(270,820,360,'CRAVING',eio(seg(u,.2,2.5))*.94,CRL)});
 half(1,()=>{const out=eio(seg(u,2.2,3.4));c.translate(420,0);envBedroom(u,'2:13');c.translate(-420,0);detoxBox(840,1240,0,.3);S(()=>{c.fillStyle='#0a0a0c';c.fillRect(760,1240,160,180)});
  S(()=>{c.fillStyle='#08070a';c.fillRect(980,920,100,500);c.fillStyle=`rgba(255,240,215,${.9*out})`;c.fillRect(990,930,90,490)});
  const x=lerp(710,1000,eio(seg(u,2.6,4.4)));St({x,y:FL,s:1.08,f:1,pose:u<1.4?Pz({lean:.18,hd:.3,aF:[1.1,.4],aB:[-.2,.4]}):(u<2.6?Pz({lean:-.08,hd:-.15,aF:[.1,.2],aB:[-.1,.2]}):walkP(u*7)),mood:u<1.4?'shock':'calm',t:u});
  meter(810,820,360,'CRAVING',eio(seg(u,.2,1.4))*.88*(1-seg(u,2.6,4.2)*.4),'#ffffff')});
 divider();tag(270,FL+80,'REACHES',CRL,eo(seg(u,1,1.3)));tag(810,FL+80,'WALKS IT OFF','#fff',eo(seg(u,2.8,3.1)));
 scoreboard(u,'DAY 3 · 2:13 AM','CRAVING','CRAVING')}
// C4 DAY 4 RELAPSE
function c4(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{c.translate(-170,0);envLounge(u,{door:0});c.translate(170,0);
  R({x:300,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:-.25,hd:.45,aF:[.65,1.5],aB:[.2,.9]}),mood:u<1.2?'smile':'sad',t:u,frontProp:J=>phone(J,1.2)});
  const sp=eio(seg(u,1.0,3.0));S(()=>{c.translate(270,880);c.fillStyle='rgba(10,10,12,.9)';c.beginPath();c.arc(0,0,70,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.arc(0,0,62,0,7);c.stroke();c.lineCap='round';
   const a=sp*Math.PI*2*44;c.beginPath();c.moveTo(0,0);c.lineTo(Math.sin(a)*48,-Math.cos(a)*48);c.stroke();c.strokeStyle=CRL;c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.sin(a/12)*32,-Math.cos(a/12)*32);c.stroke()});
  const mins=Math.round(lerp(5,221,sp));txt(`${Math.floor(mins/60)}H ${String(mins%60).padStart(2,'0')}M`,270,985,'900 34px Black',CRL,{glow:14,gc:CR});txt('SCREEN TIME',270,1015,'500 14px Lab','rgba(255,255,255,.6)',{ls:4})});
 half(1,()=>{c.translate(-90,0);envDesk(u);c.translate(90,0);S(()=>{c.fillStyle='#0a0a0c';c.fillRect(670,1290,120,18);c.fillRect(722,1306,12,FL-1306)});
  St({x:730,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.05,hd:.35,aF:[1.15,1.2],aB:[1.0,1.3]}),mood:'calm',t:u,frontProp:J=>S(()=>{const [x,y]=J.handF;c.fillStyle='#0a0a0c';rr(x-4,y-36,64,46,4);c.fill();c.fillStyle='#e9e2d6';rr(x,y-32,28,38,2);c.fill();rr(x+30,y-32,26,38,2);c.fill()})});
  const pages=Math.round(lerp(0,64,eio(seg(u,.3,3.6))));txt(`${pages} PAGES`,810,890,'900 34px Black','#fff',{glow:12});txt('READ',810,920,'500 14px Lab','rgba(255,255,255,.6)',{ls:4})});
 divider();say(u,.4,250,1100,'JUST 5 MINUTES.',{col:CRL,tx:20},1.4);
 scoreboard(u,'DAY 4','RELAPSED','READING',{size:76})}
// C5 TOLERANCE
function c5(u){const c=C();c.fillStyle='#030304';c.fillRect(0,0,W,H);const x0=150,x1=930,yb=1150;
 S(()=>{c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=2;c.setLineDash([8,8]);c.beginPath();c.moveTo(x0,yb);c.lineTo(x1,yb);c.stroke();c.setLineDash([])});txt('BASELINE',x0+70,yb+26,'500 16px Lab','rgba(255,255,255,.5)',{ls:5});
 const k=eio(seg(u,.1,2.6));const N=220;
 S(()=>{c.strokeStyle=CRL;c.lineWidth=4;c.shadowColor=CR;c.shadowBlur=14;c.beginPath();for(let i=0;i<=N*k;i++){const p=i/N,x=lerp(x0,x1,p);let y=yb+p*170;const spk=[.1,.25,.4,.55,.7,.85].reduce((m,s)=>m+Math.exp(-Math.pow((p-s)/.018,2))*(260-p*80),0);y-=spk;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()});
 S(()=>{c.strokeStyle='#fff';c.lineWidth=4;c.shadowColor='#fff';c.shadowBlur=12;c.beginPath();for(let i=0;i<=N*k;i++){const p=i/N,x=lerp(x0,x1,p),y=yb-30-p*120+Math.sin(p*20)*6;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()});
 A(seg(u,2.2,2.6),()=>{txt('CHEAP HIGHS',x1-60,yb+190,'800 22px Disp',CRL,{glow:10,gc:CR});txt('REAL LIFE',x1-60,yb-175,'800 22px Disp','#fff',{glow:10})});
 title2(u,.1,'DOPAMINE TOLERANCE',null,520);title2(u,.6,'Cheap highs make normal life ','boring.',632)}
// C6 DAY 14 FOCUS
function c6(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{c.translate(-90,0);envDesk(u);c.translate(90,0);S(()=>{c.fillStyle='#0a0a0c';c.fillRect(150,1290,120,18);c.fillRect(202,1306,12,FL-1306)});
  const slump=eo(seg(u,2.8,3.4));R({x:210,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:lpz(Pz({...SIT,lean:.1,hd:Math.sin(u*5)*.3,aF:[1.0,.8],aB:[.9,.9]}),Pz({...SIT,lean:.9,hd:.6,aF:[1.4,.9],aB:[1.3,1.0]}),slump),mood:slump>.5?'sad':'neutral',t:u});
  S(()=>{c.fillStyle='#0a0a0c';rr(310,1080,210,150,8);c.fill();c.fillStyle='#1d212b';rr(316,1086,198,138,4);c.fill();const tabs=Math.min(37,Math.round(lerp(3,37,eio(seg(u,.2,2.6)))));
   for(let i=0;i<Math.min(9,tabs);i++){c.fillStyle=i==tabs%9?'#dfe4ee':'#3a3f4d';c.fillRect(318+i*22,1088,20,12)}txt(`${tabs} TABS OPEN`,415,1150,'800 18px Disp',CRL,{glow:8,gc:CR})});
  [0,1,2].forEach(i=>buzz(120+i*120,960,u,(Math.sin(u*4+i*2.1)>.5)?1:0))});
 half(1,()=>{c.translate(-60,0);envDesk(u);c.translate(60,0);S(()=>{c.fillStyle='#0a0a0c';c.fillRect(640,1290,110,18);c.fillRect(690,1306,12,FL-1306)});
  St({x:690,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.14,hd:.2,aF:[1.05+Math.sin(u*20)*.06,.75],aB:[.95-Math.sin(u*20)*.06,.85]}),mood:'calm',t:u});
  const sec=Math.floor(lerp(4980,7200,eio(seg(u,0,4.6))));const hh=Math.floor(sec/3600),mm=Math.floor(sec%3600/60),ss=sec%60;S(()=>{c.fillStyle='rgba(10,10,12,.92)';rr(660,840,300,110,14);c.fill();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;rr(660,840,300,110,14);c.stroke()});
  txt(`${hh}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`,810,900,'900 48px Black','#fff',{glow:12});txt('DEEP WORK',810,870,'500 15px Lab','rgba(255,255,255,.6)',{ls:5})});
 divider();scoreboard(u,'DAY 14 · FOCUS',`${Math.round(lerp(12,9,seg(u,0,3)))}%`,`${Math.round(lerp(12,71,eio(seg(u,.2,3.5))))}%`)}
// C7 DAY 21 SLEEP
function c7(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{c.translate(-120,0);envBedroom(u,'3:47');c.translate(120,0);S(()=>{c.translate(470,1255);c.rotate(-Math.PI/2);R({x:0,y:0,s:1.0,f:1,noShadow:true,hair:'none',pose:Pz({aF:[1.25,1.55],aB:[-.05,.1]}),mood:'sad',t:u,frontProp:J=>phone(J,1.3)})});
  S(()=>{c.fillStyle='#0a0a0c';rr(200,1196,300,70,26);c.fill();c.fillStyle=lg(0,1200,0,1262,[[0,'#5d6475'],[1,'#373c4b']]);rr(204,1200,292,62,24);c.fill()})});
 half(1,()=>{c.translate(420,0);envBedroom(u,'10:30');c.translate(-420,0);S(()=>{c.translate(1010,1255);c.rotate(-Math.PI/2);St({x:0,y:0,s:1.0,f:1,noShadow:true,glow:0,pose:Pz({aF:[.05,.1],aB:[-.05,.1]}),mood:'calm',blink:1})});
  S(()=>{c.fillStyle='#0a0a0c';rr(740,1196,300,70,26);c.fill();c.fillStyle=lg(0,1200,0,1262,[[0,'#d6d7dd'],[1,'#9a9ba3']]);rr(744,1200,292,62,24);c.fill()});
  A(.8,()=>{for(let i=0;i<3;i++){const k=((u*.7+i/3)%1);txt('z',700+k*50,1150-k*80,`700 ${20+k*18}px Disp`,'rgba(255,255,255,.8)',{glow:8})}});
  S(()=>{c.fillStyle='#0a0a0c';rr(930,1236,44,12,3);c.fill()})});
 divider();scoreboard(u,'DAY 21 · SLEEP','4H 12M','8H 05M',{size:76})}
// C8 DAY 30
function c8(u){const c=C();stage(u,[[330,.4,'#ff8a9c'],[750,1,'#ffffff']]);const day=Math.min(30,Math.round(lerp(21,30,eio(seg(u,.1,1.4)))));
 S(()=>{c.fillStyle='#0a0a0c';rr(440,760,200,150,16);c.fill();c.fillStyle='#16161a';rr(446,766,188,138,12);c.fill();c.fillStyle='rgba(255,255,255,.06)';c.fillRect(446,834,188,2)});
 txt(String(day).padStart(2,'0'),540,840,'900 96px Black','#fff',{glow:20});txt('DAY',540,738,'500 18px Lab','rgba(255,255,255,.7)',{ls:8});
 R({x:330,y:FL,s:1.2,f:1,pose:Pz({lean:.15,hd:.5,aF:[.55,1.55],aB:[.45,1.6]}),mood:'sad',t:u,frontProp:J=>phone(J,.8)});
 const glow=eo(seg(u,1.4,2.2));St({x:750,y:FL,s:1.25,f:-1,pose:TALL,mood:'smile',t:u,glow:1+glow*1.2});
 if(glow>0)rays(750,FL-300,0,6.28,380,.05*glow,10,4);
 tag(330,FL+70,'REACTIVE',CRL);tag(750,FL+70,'STEADY','#fff');
 title2(u,1.5,'BOREDOM WAS THE DOORWAY.',null,520);title2(u,2.2,'Focus was on the ','other side.',632)}
// C9 OUTRO
function c9(u){stage(u,[[540,1,'#ffffff']]);St({x:540,y:FL,s:1.25,f:1,pose:Pz({hd:-.1,aF:[.4,1.4],aB:[-.3,1.6]}),mood:'calm',t:u,frontProp:J=>S(()=>{const c=C();const [x,y]=J.handF;c.fillStyle='#0a0a0c';rr(x-8,y-30,26,46,6);c.fill();c.fillStyle='#1a1b20';rr(x-4,y-26,18,38,4);c.fill()})});
 title2(u,.1,'YOUR ATTENTION IS THE PRODUCT.',null,520);title2(u,.8,'Take it ','back.',632)}

export const VIDEO_C=makeTimeline([
 {fn:c1,dur:3.0,cam:camPush(1,1.06)},
 {fn:c2,dur:4.0,cam:camPush(1.0,1.04),fadeIn:.12},
 {fn:c3,dur:4.5,cam:camPush(1,1.05)},
 {fn:c4,dur:4.0,cam:camPush(1.03,1.0)},
 {fn:c5,dur:3.2,cam:camPush(1,1.06),fadeIn:.12},
 {fn:c6,dur:5.0,cam:camPush(1,1.05)},
 {fn:c7,dur:4.0,cam:camPush(1.04,1.0)},
 {fn:c8,dur:5.5,cam:camPush(1,1.07),fadeIn:.15},
 {fn:c9,dur:3.5,cam:camPush(1,1.05),fadeIn:.15},
 {fn:endCard,dur:3.6,cam:()=>[1,0,0],fadeIn:.2},
]);
