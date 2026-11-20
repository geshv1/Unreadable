// "Two Versions of You" — scene functions. Each receives local time u (seconds since the scene started).
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,eback,clamp,rng,W,H,CR,CRL,WARM,vignette,grain,dust,pop,bubble,eye,zig,droplets,rays,bigText,person} from './engine/lib.js';
import {FIRST,SECOND,FRIENDS,drawFirst,drawSecond,drawFriend,POSES,walkP,runP,lpz,talkPose,phone} from './characters.js';
import {envVoid,envBedroom,envBathroom,envLounge,envGym,barbell,envDawn,envDesk,envRing} from './environments.js';
const C=()=>getCtx();
const FL=1420;
function label(x,y,s,col,a=1){A(a,()=>txt(s,x,y,'500 26px Lab',col,{ls:8,glow:10,gc:col==CRL?rgba(CR,.7):'rgba(255,255,255,.35)'}))}
function topShade(){S(()=>{const c=C();c.fillStyle=lg(0,560,0,760,[[0,'rgba(0,0,0,1)'],[1,'rgba(0,0,0,0)']]);c.fillRect(0,245,W,515)})}
function lieDown(x,y,o,char=drawFirst){S(()=>{const c=C();c.translate(x,y);c.rotate(-Math.PI/2);char({x:0,y:0,s:1.0,f:1,noShadow:true,hair:o.hair,...o})})}
function blanket(x,w,col1,col2){S(()=>{const c=C();c.fillStyle='#0a0a0c';rr(x,1196,w,70,26);c.fill();c.fillStyle=lg(0,1200,0,1262,[[0,col1],[1,col2]]);rr(x+4,1200,w-8,62,24);c.fill()})}
function gymBag(J){S(()=>{const c=C();const [x,y]=J.handB;c.fillStyle='#0a0a0c';rr(x-34,y+4,68,38,12);c.fill();c.fillStyle='#2b2c33';rr(x-30,y+8,60,30,10);c.fill();c.fillStyle=CR;c.fillRect(x-30,y+18,60,4);c.strokeStyle='#0a0a0c';c.lineWidth=4;c.beginPath();c.moveTo(x-10,y+6);c.lineTo(x,y);c.lineTo(x+10,y+6);c.stroke()})}
function sitY(s){return 1262+132*s}

// 01 — Two men, same age.
export function s01(u){const a1=Math.min(1,seg(u,.05,.15)),a2=Math.min(1,seg(u,.35,.45));envVoid(u,[[330,a1,'#ff8a9c'],[750,a2,'#ffffff']]);
 A(.25+.75*a1,()=>drawFirst({x:330,y:FL,s:1.25,f:1,pose:POSES.stand}));A(.25+.75*a2,()=>drawSecond({x:750,y:FL,s:1.25,f:-1,pose:POSES.stand,glow:a2}));
 label(330,FL+70,'THE FIRST ONE',CRL,eo(seg(u,.5,.9)));label(750,FL+70,'THE SECOND ONE','#fff',eo(seg(u,.7,1.1)));topShade()}

// 02 — One year later, only one of them is proud of who he became.
export function s02(u){envBathroom(u);const proud=eo(seg(u,1.7,2.3));const c=C();
 [[0,drawFirst,-1],[542,drawSecond,1]].forEach(([x0,ch,good])=>{const mx=x0+120,my=800;S(()=>{c.beginPath();c.rect(mx,my,300,330);c.clip();c.globalAlpha=.55;
   ch({x:mx+150,y:my+520,s:1.0,f:good>0?1:(proud>.5?-1:1),noShadow:true,glow:good>0?proud*1.5:0,pose:good>0?lpz(POSES.slouch,POSES.stand,proud):lpz(POSES.stand,POSES.slump,proud)});
   if(good>0&&proud>0){c.globalAlpha=proud*.5;c.globalCompositeOperation='screen';c.fillStyle=rg(mx+150,my+180,0,200,[[0,'rgba(255,255,255,.5)'],[1,'rgba(255,255,255,0)']]);c.fillRect(mx,my,300,330)}})});
 drawFirst({x:270,y:1440,s:1.05,f:1,pose:lpz(POSES.stand,POSES.slouch,eo(seg(u,.2,1)))});drawSecond({x:810,y:1440,s:1.05,f:1,pose:POSES.stand});
 const k=eio(seg(u,.1,1.3));const day=Math.max(1,Math.round(365*k));
 S(()=>{c.translate(540,760);c.fillStyle='rgba(8,8,10,.92)';c.beginPath();c.arc(0,0,62,0,7);c.fill();c.strokeStyle='rgba(255,255,255,.15)';c.lineWidth=4;c.beginPath();c.arc(0,0,54,0,7);c.stroke();c.strokeStyle=CRL;c.shadowColor=CR;c.shadowBlur=12;c.beginPath();c.arc(0,0,54,-Math.PI/2,-Math.PI/2+k*Math.PI*2);c.stroke();c.shadowBlur=0});
 txt(String(day),540,752,'900 34px Black','#fff');txt('DAYS',540,782,'500 14px Lab','rgba(255,255,255,.6)',{ls:5});topShade()}

// 03 — The first one wakes up already tired, phone first, dopamine before daylight.
export function s03(u){envBedroom(u,'6:00');const c=C();const grab=eo(seg(u,.7,1.2));
 lieDown(470,1255,{hair:'none',pose:lpz(POSES.stand,{...POSES.stand,aF:[1.25,1.55]},grab),frontProp:J=>{if(grab>.5)phone(J,1.3)}});
 blanket(200,300,'#5d6475','#373c4b');
 if(u<.9)S(()=>{c.strokeStyle=CRL;c.lineWidth=3;c.shadowColor=CR;c.shadowBlur=10;for(let i=0;i<2;i++){c.beginPath();c.arc(820,1228,38+i*12+(u*40%12),-1.1,-.3);c.stroke()}});
 // dopamine sparks: phone -> head
 for(let i=0;i<14;i++){const t0=3.3+i*.08;const k=seg(u,t0,t0+.55);if(k<=0||k>=1)continue;const r=rng(i+5);const sx=300+r()*60,sy=1150,ex=230,ey=1180;const x=lerp(sx,ex,eio(k))+Math.sin(k*9+i)*30*(1-k),y=lerp(sy,ey,eio(k))-Math.sin(k*Math.PI)*120;
  S(()=>{c.globalAlpha=1-k*.6;c.fillStyle=i%3?CRL:'#fff';c.shadowColor=CR;c.shadowBlur=14;if(i%4==0){txt('+1',x,y,'800 24px Disp',CRL,{glow:10,gc:CR})}else{c.beginPath();c.arc(x,y,5,0,7);c.fill()}})}
 pop(u,1.6,e=>S(()=>{c.translate(300,980);c.scale(e,e);[['12 NEW',0],['FOR YOU',1]].forEach(([s,i])=>{c.font='700 20px Disp';const w=c.measureText(s).width+46;c.fillStyle='rgba(14,16,22,.92)';c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;rr(-w/2+i*60,i*54,w,40,12);c.fill();c.stroke();txt(s,i*60+8,i*54+21,'700 20px Disp','#fff',{ls:2})})}),2.2);
 label(330,FL+70,'THE FIRST ONE',CRL,eo(seg(u,.2,.6)));topShade()}

// 04 — He tells himself he'll start on Monday. He's been saying that for three years.
export function s04(u){envLounge(u,{door:0});const c=C();
 // wall calendar + sticky notes
 const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];const mi=Math.floor(Math.max(0,u-.3)*9)%12;
 S(()=>{c.fillStyle='#0a0a0c';c.fillRect(70,770,170,190);c.fillStyle='#e9e4da';c.fillRect(76,800,158,154);c.fillStyle=CR;c.fillRect(76,776,158,30);txt(months[mi],155,792,'800 22px Disp','#fff',{ls:4});
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1.5;for(let i=1;i<7;i++){c.beginPath();c.moveTo(76+i*22.5,806);c.lineTo(76+i*22.5,954);c.stroke()}for(let j=1;j<6;j++){c.beginPath();c.moveTo(76,806+j*25);c.lineTo(234,806+j*25);c.stroke()}});
 const r=rng(44);for(let i=0;i<11;i++){const t0=.4+i*.3;const x=280+r()*580,y=760+r()*180,rot=(r()-.5)*.3;pop(u,t0,e=>S(()=>{c.translate(x,y);c.rotate(rot);c.scale(e,e);c.fillStyle='#0a0a0c';c.fillRect(-52,-34,104,68);c.fillStyle='#e8d36a';c.fillRect(-48,-30,96,60);txt('START',0,-10,'800 17px Disp','#2a2412',{ls:1});txt('MONDAY',0,12,'800 17px Disp','#2a2412',{ls:1});
  const sk=seg(u,t0+.35,t0+.5);if(sk>0){c.strokeStyle=CR;c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-44,24);c.lineTo(-44+88*sk,24-48*sk);c.stroke()}}))}
 drawFirst({x:456,y:sitY(1.1),s:1.1,f:1,pose:POSES.sit,noShadow:true,frontProp:J=>phone(J,.9)});
 const n=Math.round(156*eio(seg(u,.3,3.9)));S(()=>{c.fillStyle='rgba(8,8,10,.85)';rr(760,1060,250,96,14);c.fill();c.strokeStyle=rgba(CR,.8);c.lineWidth=2;rr(760,1060,250,96,14);c.stroke()});
 txt('MONDAYS SKIPPED',885,1088,'500 15px Lab','rgba(255,255,255,.65)',{ls:4});txt(String(n),885,1128,'900 44px Black',CRL,{glow:16,gc:CR});
 label(456,FL+70,'THE FIRST ONE',CRL,eo(seg(u,.2,.6)));topShade()}

// 05 — The second one doesn't feel motivated either. He just stopped negotiating with himself.
export function s05(u){envBedroom(u,'5:42');const c=C();
 const up=eo(seg(u,.6,1.2)),stand=eio(seg(u,3.0,3.6));
 if(up<.05)lieDown(470,1255,{pose:POSES.stand},drawSecond);
 else{const y=lerp(sitY(1.15),FL,stand),x=lerp(470,560,stand);drawSecond({x,y,s:1.15,f:1,pose:lpz(lpz(POSES.slump,POSES.sit,0),POSES.stand,stand),noShadow:stand<.5,...(stand<.5?{pose:lpz(POSES.sit,POSES.stand,stand)}:{})})}
 if(up<1)blanket(200,300,'#d6d7dd','#9a9ba3');
 pop(u,1.3,e=>S(()=>{c.translate(470,1040);c.scale(e,e);c.translate(-470,-1040);bubble(470,1040,'5 MORE MIN?',{thought:true,tx:-30});const sk=eio(seg(u,2.85,3.15));if(sk>0){c.strokeStyle=CRL;c.lineWidth=6;c.lineCap='round';c.shadowColor=CR;c.shadowBlur=12;c.beginPath();c.moveTo(360,1003);c.lineTo(360+220*sk,1003);c.stroke()}}),2.3);
 label(560,FL+70,'THE SECOND ONE','#fff',eo(seg(u,.2,.6)));topShade()}

// 06 — Cold mornings, heavy weights, quiet work no one claps for.
export function s06(u){const c=C();
 if(u<1.3){envDawn(u,u*520);const ph=u*14;const J=drawSecond({x:520,y:FL,s:1.15,f:1,pose:runP(ph)});
  for(let i=0;i<4;i++){const k=((u*1.6+i/4)%1);S(()=>{c.globalAlpha=(1-k)*.35;c.fillStyle='#e8edf6';c.beginPath();c.arc(J.head[0]+40+k*70,J.head[1]+10-k*20,10+k*26,0,7);c.fill()})}
  label(540,560+190,'COLD','#fff',eo(seg(u,.4,.7)))}
 else if(u<2.35){const v=u-1.3;envGym(u);const lift=eio(seg(v,.1,.7));const by=lerp(1390,1250,lift);
  drawSecond({x:540,y:FL,s:1.2,f:1,pose:lpz(POSES.deadliftDown,POSES.deadliftUp,lift)});barbell(540,by,lerp(4,18,lift));
  label(540,750,'HEAVY','#fff',eo(seg(v,.1,.4)))}
 else{const v=u-2.35;envDesk(u);S(()=>{c.fillStyle='#0a0a0c';c.fillRect(640,1290,110,18);c.fillRect(686,1306,12,114)});
  const ty=Math.sin(v*22)*.08;drawSecond({x:690,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:{...POSES.sit,lean:.12,hd:.2,aF:[1.05+ty,.75],aB:[.95-ty,.85]}});
  label(540,750,'QUIET','#fff',eo(seg(v,.1,.4)))}
 topShade()}

// 07 — And here's the dark part.
export function s07(u){const c=C();const fl=[1,.3,1,1,.5,1][Math.floor(u*8)%6];c.fillStyle='#020203';c.fillRect(0,0,W,H);
 S(()=>{c.globalCompositeOperation='screen';c.fillStyle=lg(0,600,0,FL,[[0,'rgba(212,34,63,0)'],[.3,`rgba(212,34,63,${.35*fl})`],[1,`rgba(212,34,63,${.12*fl})`]]);c.beginPath();c.moveTo(510,600);c.lineTo(570,600);c.lineTo(760,FL);c.lineTo(320,FL);c.closePath();c.fill();c.fillStyle=rg(540,FL,0,260,[[0,`rgba(212,34,63,${.4*fl})`],[1,'rgba(212,34,63,0)']]);c.fillRect(260,FL-80,560,160)});
 person({...SECOND,skin:'#1a1416',top:'#140f11',bot:'#0e0b0c',shoe:'#1a1416',hairCol:'#060506',glow:0,x:540,y:FL,s:1.3,f:1,pose:POSES.stand});
 S(()=>{c.globalCompositeOperation='screen';c.globalAlpha=.6*fl;c.strokeStyle=CRL;c.lineWidth=3;c.shadowColor=CR;c.shadowBlur=18;c.beginPath();c.arc(540,FL-300,38,Math.PI*1.1,Math.PI*1.9);c.stroke()});
 dust(300,700,480,700,30,u,.4,21);topShade()}

// 08 — The people around you don't want you to change. Your growth reminds them of what they gave up.
const dreams=['guitar','dumbbell','book'];
function dreamIcon(type,x,y,k){const c=C();S(()=>{c.globalAlpha*=k*.85;c.translate(x,y);c.strokeStyle='rgba(255,255,255,.75)';c.fillStyle='rgba(255,255,255,.75)';c.lineWidth=4;c.lineCap='round';
 if(type=='guitar'){c.beginPath();c.ellipse(-8,12,16,20,0,0,7);c.stroke();c.beginPath();c.moveTo(4,-4);c.lineTo(28,-34);c.stroke()}
 if(type=='dumbbell'){c.fillRect(-22,-3,44,6);c.fillRect(-30,-12,8,24);c.fillRect(22,-12,8,24)}
 if(type=='book'){c.beginPath();c.moveTo(0,-18);c.lineTo(-26,-12);c.lineTo(-26,18);c.lineTo(0,12);c.lineTo(26,18);c.lineTo(26,-12);c.closePath();c.stroke();c.beginPath();c.moveTo(0,-18);c.lineTo(0,12);c.stroke()}
 const sk=eio(seg(k,.5,1));c.globalAlpha=1;c.strokeStyle=CRL;c.shadowColor=CR;c.shadowBlur=12;c.lineWidth=5;c.beginPath();c.moveTo(-34,30);c.lineTo(-34+68*sk,30-60*sk);c.stroke()})}
export function s08(u){envLounge(u,{door:.15});const c=C();
 const sx=lerp(120,860,eio(seg(u,.2,3.6)));
 // giant shadows on the wall
 const g=eio(seg(u,1.0,3.0));[[360,0],[500,1],[640,2]].forEach(([x,i])=>S(()=>{c.globalAlpha=.42*g;c.filter='blur(6px)';c.translate(x+(x-540)*.3*g,1350);c.scale(1+g*.9,1+g*.9);c.translate(-x,-1350);person({...FRIENDS[i],skin:'#050406',top:'#050406',bot:'#050406',shoe:'#050406',hairCol:'#050406',x,y:sitY(1.1)-40,s:1.1,f:1,pose:POSES.sit,noShadow:true})}));
 [[360,0],[500,1],[640,2]].forEach(([x,i])=>{const look=Math.sign(sx-x)||1;drawFriend(i,{x,y:sitY(1.1),s:1.1,f:look,noShadow:true,pose:{...POSES.sit,hd:-.1}});dreamIcon(dreams[i],x,980,eo(seg(u,4.3+i*.12,4.9+i*.12)))});
 if(sx<880)drawSecond({x:sx,y:FL+30,s:1.15,f:1,pose:walkP(u*7),backProp:J=>gymBag(J)});
 topShade()}

// 09 — So they joke. They doubt. They invite you back to the couch.
export function s09(u){const trap=eo(seg(u,2.3,3.0));envLounge(u,{door:.15,trap});const c=C();
 [[360,0],[500,1],[640,2]].forEach(([x,i])=>{const talking=[.35,1.3,2.3][i];const t=u>talking&&u<talking+1.2;drawFriend(i,{x,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:t?{...talkPose(u*1.6,1),lF:[1.45,-1.45],lB:[1.35,-1.35],lean:-.05}:{...POSES.sit,hd:-.05}})});
 drawFirst({x:190,y:FL+20,s:1.15,f:1,pose:lpz(POSES.stand,POSES.slouch,eo(seg(u,1,2)))});
 drawSecond({x:900,y:FL+30,s:1.15,f:-1,pose:POSES.stand,backProp:J=>gymBag(J)});
 [[.35,360,'GYM AGAIN? RELAX.'],[1.3,520,"YOU'LL QUIT IN A WEEK."],[2.3,660,'ONE DRINK. COME ON.']].forEach(([t0,x,s],i)=>pop(u,t0,e=>S(()=>{c.translate(x,1040-i*0);c.scale(e,e);c.translate(-x,-1040);bubble(x,1040,s,{tx:0,tdx:0,col:i==2?CRL:'#fff'})}),i<2?1.0:2));
 topShade()}

// 10 — The first one listens. The second one smiles and keeps going.
export function s10(u){const door=eo(seg(u,2.0,3.2));envLounge(u,{door:.15+.85*door});const c=C();
 [[360,0],[500,1],[640,2]].forEach(([x,i])=>drawFriend(i,{x,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:POSES.sit}));
 const sit=eio(seg(u,.2,.9));drawFirst({x:lerp(190,230,sit),y:lerp(FL+20,sitY(1.1),sit),s:lerp(1.15,1.1,sit),f:1,noShadow:sit>.5,pose:lpz(POSES.slouch,POSES.sit,sit),frontProp:J=>{if(sit>.8)phone(J,.8)}});
 const nod=Math.sin(seg(u,1.7,2.1)*Math.PI)*.25;const leave=seg(u,2.1,3.7);const sx=lerp(900,1010,eio(leave));
 const sp=leave>0?walkP(u*7):{...POSES.stand,hd:-nod};A(1-seg(u,3.2,3.6),()=>drawSecond({x:sx,y:FL+30,s:1.15,f:leave>0?1:-1,pose:sp,backProp:J=>gymBag(J),glow:1+door}));
 if(door>0)rays(1000,1150,-Math.PI/2,.7,700,.06*door,7,8);
 label(230,FL+80,'LISTENS',CRL,eo(seg(u,.5,.9)));label(860,FL+80,'KEEPS GOING','#fff',eo(seg(u,2.2,2.6)));topShade()}

// 11 — One percent a day doesn't look like much until one day it's the only thing anyone notices.
export function s11(u){const c=C();
 if(u<3.4){c.fillStyle='#030304';c.fillRect(0,0,W,H);const x0=170,x1=910,y0=1380,y1=760;
  S(()=>{c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=2;c.beginPath();c.moveTo(x0,y1-20);c.lineTo(x0,y0);c.lineTo(x1+20,y0);c.stroke();
   for(let i=0;i<=12;i++){c.beginPath();c.moveTo(x0+(x1-x0)*i/12,y0);c.lineTo(x0+(x1-x0)*i/12,y0+8);c.stroke()}});
  const k=eio(seg(u,.2,2.6));const N=120;const pt=(f,i)=>{const d=i/N*365;const v=Math.pow(f,d);const ny=f>1?(v-1)/(37.8-1):v;return [x0+(x1-x0)*i/N,f>1?y0-(y0-y1)*ny*.95:y0-(y0-y1)*.35*ny-0]};
  [[1.01,'#ffffff'],[0.99,CRL]].forEach(([f,col])=>S(()=>{c.strokeStyle=col;c.lineWidth=5;c.shadowColor=col==CRL?CR:'#fff';c.shadowBlur=16;c.beginPath();for(let i=0;i<=N*k;i++){const [x,y]=pt(f,i);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}));
  const [hx,hy]=pt(1.01,Math.floor(N*k));drawSecond({x:hx-10,y:hy+2,s:.55,f:1,pose:walkP(u*8)});
  A(seg(u,2.4,2.8),()=>{txt('1.01³⁶⁵ = 37.8',x1-60,y1-40,'900 40px Black','#fff',{glow:16});txt('0.99³⁶⁵ = 0.03',x1-60,y0-60,'900 34px Black',CRL,{glow:14,gc:CR})});
  label(540,y0+60,'365 DAYS','rgba(255,255,255,.6)',eo(seg(u,.2,.6)))}
 else{const v=u-3.4;envLounge(u,{door:1});
  const crowd=[[260,1],[420,0],[620,2],[760,1]];crowd.forEach(([x,i],j)=>{const J=drawFriend(i,{x,y:FL+20,s:1.0,f:x<880?1:-1,pose:{...POSES.stand,hd:-.05}});eye(x,J.head[1]-75,.7,1,eo(seg(v,.6+j*.1,.8+j*.1)))});
  const wx=lerp(1000,900,eio(seg(v,0,1)));drawSecond({x:wx,y:FL+30,s:1.2,f:-1,pose:v<1?walkP(u*7):POSES.stand,glow:1.6})}
 topShade()}

// 12 — Discipline isn't punishment. It's how you become someone pressure can't break.
export function s12(u){envRing(u);const c=C();const sx=600;
 const hits=[.5,1.1,1.7,2.3,2.9,3.5,4.0];let rec=0;hits.forEach(t0=>{if(u>t0)rec+=Math.exp(-(u-t0)*8)*(u<t0+.6?1:0)});
 const J=drawSecond({x:sx+rec*10,y:1306,s:1.25,f:-1,pose:lpz(POSES.guard,{...POSES.guard,lean:-.05},Math.min(1,rec))});
 hits.forEach((t0,i)=>{const k=seg(u,t0-.35,t0);const big=i==hits.length-1;
  if(k>0&&k<1)S(()=>{const x=lerp(80,J.head[0]-40,eio(k)),y=J.head[1]+40+Math.sin(i*2)*60*(1-k);c.translate(x,y);c.fillStyle=CRL;c.shadowColor=CR;c.shadowBlur=30;c.globalAlpha=.9;const R=big?46:24;c.beginPath();c.ellipse(0,0,R*1.6,R,0,0,7);c.fill();c.globalAlpha=.4;c.fillRect(-R*6,-R*.4,R*4.5,R*.8)});
  const p=seg(u,t0,t0+.5);if(p>0&&p<1)S(()=>{const x=J.head[0]-50,y=J.head[1]+40+Math.sin(i*2)*0;c.strokeStyle=CRL;c.shadowColor=CR;c.shadowBlur=16;c.lineWidth=big?5:3;c.globalAlpha=1-p;const n=big?16:8;for(let j=0;j<n;j++){const a=j/n*Math.PI*2;c.beginPath();c.moveTo(x+Math.cos(a)*(10+p*20),y+Math.sin(a)*(10+p*20));c.lineTo(x+Math.cos(a)*(30+p*(big?160:70)),y+Math.sin(a)*(30+p*(big?160:70)));c.stroke()}})});
 label(sx,800,'UNBREAKABLE','#fff',eo(seg(u,3.9,4.3)));topShade()}

// 13 — So the question isn't which one you want to be. It's which one you've been this week.
export function s13(u){const dim=eo(seg(u,3.6,4.4));envVoid(u,[[330,1,'#ff8a9c'],[750,1-dim*.6,'#ffffff']]);const c=C();
 drawFirst({x:330,y:FL,s:1.25,f:1,pose:POSES.slouch});A(1-dim*.5,()=>drawSecond({x:750,y:FL,s:1.25,f:-1,pose:POSES.stand}));
 const days=['M','T','W','T','F','S','S'];days.forEach((d,i)=>{const k=eo(seg(u,.4+i*.28,.6+i*.28));[[330,0],[750,1]].forEach(([cx,good])=>{const x=cx-150+i*50,y=FL+90;A(k*(good?1-dim*.5:1),()=>{txt(d,x,y,'500 18px Lab','rgba(255,255,255,.5)',{ls:2});txt(good?'✓':'✕',x,y+36,'800 30px Disp',good?'#fff':CRL,{glow:10,gc:good?'#fff':CR})})})});
 topShade()}

// 14 — end card (no narration)
export function s14(u){const c=C();c.fillStyle='#050506';c.fillRect(0,0,W,H);
 for(let i=0;i<3;i++){const k=eio(seg(u,.1+i*.08,.7+i*.08));S(()=>{const y=1560+i*26;c.strokeStyle=CR;c.globalAlpha=.75;c.lineWidth=2.5;c.shadowColor=CR;c.shadowBlur=12;c.beginPath();c.moveTo(0,y-8);c.lineTo(W*k,y-8+16*k);c.stroke()})}
 bigText(u,.1,'TESTED UNDER PRESSURE.',null,520);bigText(u,.45,'Become stable as a ','rock.',630);
 const ck=seg(u,.3,1.0),e=eo(ck);const img=getCover();if(ck>0&&img)S(()=>{const cw=330,ch=cw*img.height/img.width;c.globalAlpha=e;c.translate(540,1035+(1-e)*60+Math.sin(u*1.6)*4);c.scale(lerp(.88,1,e),lerp(.88,1,e));if(ck<1)c.filter=`blur(${(1-e)*14}px)`;
  c.shadowColor='rgba(212,34,63,.55)';c.shadowBlur=70;c.fillStyle='#111';c.fillRect(-cw/2,-ch/2,cw,ch);c.shadowBlur=0;c.drawImage(img,-cw/2,-ch/2,cw,ch);c.filter='none';c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;c.strokeRect(-cw/2,-ch/2,cw,ch)});
 const pk=seg(u,1.1,1.5);if(pk>0)S(()=>{const ee=eback(pk),pw=440,ph=88;c.translate(540,1410);c.scale(ee,ee);const pulse=.5+.5*Math.sin((u-1.5)*5);c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=18+pulse*16;rr(-pw/2,-ph/2,pw,ph,ph/2);c.fill();c.shadowBlur=0;
  txt('GET THE GUIDE',-26,2,'700 34px Disp','#000',{ls:4});c.strokeStyle='#000';c.lineWidth=5;c.lineCap='round';c.lineJoin='round';const ax=162+Math.sin(u*6)*5;c.beginPath();c.moveTo(ax-14,0);c.lineTo(ax+12,0);c.moveTo(ax+2,-11);c.lineTo(ax+13,0);c.lineTo(ax+2,11);c.stroke()});
 A(seg(u,1.4,1.7),()=>txt('LINK IN BIO',540,1500,'500 24px Lab','#fff',{ls:10,glow:10}))}
import {COVER} from './engine/lib.js';
function getCover(){return COVER}
