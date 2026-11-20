// VIDEO A — "What Pressure Reveals"  (no narration · 3:4 · ~41.5 s)
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,eback,clamp,rng,W,H,CR,CRL,WARM,dust,droplets,zig,rain,splashes,stage,ringBG,person,Pz,lpz,walkP,runP,GUARD,JAB,WIND,HAY,SLIP,HIT,SIT,SLUMP,TALL,phone,rays} from '../engine/lib.js';
import {FIRST,SECOND,POSES} from '../characters.js';
import {envLounge,envDesk,envBedroom,envDawn} from '../environments.js';
import {FL,scoreboard,num,pop,say,notif,chat,phoneFrame,tag,title2,divider,endCard,makeTimeline,camPush} from '../kit/kit.js';
const C=()=>getCtx();
const R=(o)=>person({...FIRST,...o});const St=(o)=>person({...SECOND,...o});
const sitY=s=>1262+132*s;

function slab(x,y,w,h,glow=1){const c=C();S(()=>{c.fillStyle='#0a0a0c';rr(x-w/2-6,y-h/2-6,w+12,h+12,10);c.fill();c.fillStyle=lg(0,y-h/2,0,y+h/2,[[0,'#2a1015'],[1,'#12070a']]);rr(x-w/2,y-h/2,w,h,8);c.fill();
 c.strokeStyle=CRL;c.lineWidth=3;c.shadowColor=CR;c.shadowBlur=30*glow;rr(x-w/2,y-h/2,w,h,8);c.stroke();c.shadowBlur=0;txt('PRESSURE',x,y,`500 ${Math.round(h*.28)}px Lab`,'rgba(255,90,110,.9)',{ls:10})})}

// ---------- A1 HOOK ----------
function a1(u){const l=Math.min(1,seg(u,.05,.12)),r2=Math.min(1,seg(u,.25,.32));stage(u,[[330,l,'#ff8a9c'],[750,r2,'#ffffff']]);
 const sy=lerp(560,930,eio(seg(u,.5,1.6)))+Math.sin(u*3)*4;slab(540,sy,640,110,eo(seg(u,.5,1)));
 const look=seg(u,1.0,1.4);
 A(.3+.7*l,()=>R({x:330,y:FL,s:1.25,f:1,pose:lpz(TALL,Pz({hd:-.35,lean:-.05,aF:[.2,.4],aB:[-.1,.4]}),look),mood:look>.3?'shock':'neutral',t:u}));
 A(.3+.7*r2,()=>St({x:750,y:FL,s:1.25,f:-1,pose:lpz(TALL,Pz({hd:-.2}),look),mood:'calm',t:u,glow:r2}));
 tag(330,FL+70,'REACTIVE',CRL,eo(seg(u,.3,.6)));tag(750,FL+70,'STEADY','#fff',eo(seg(u,.4,.7)));
 title2(u,.1,'SAME PRESSURE.',null,520);title2(u,.85,'Different ','people.',632)}

// ---------- office half ----------
function office(x0,u,cool){const c=C();S(()=>{c.beginPath();c.rect(x0,690,538,1000);c.clip();
 c.fillStyle=lg(0,690,0,FL,[[0,cool?'#0c0f15':'#100e0c'],[1,cool?'#151a22':'#1b1714']]);c.fillRect(x0,690,538,FL-690);
 c.fillStyle='#07080b';c.fillRect(x0+60,770,300,250);const r=rng(x0+3);for(let i=0;i<10;i++){const bx=x0+64+i*30,bh=60+r()*150;c.fillStyle='#10131b';c.fillRect(bx,1020-bh,26,bh);for(let k=0;k<6;k++)if(r()<.4){c.fillStyle='rgba(255,214,150,.55)';c.fillRect(bx+5+(k%2)*10,1020-bh+8+Math.floor(k/2)*18,5,7)}}
 c.fillStyle='rgba(20,22,28,.7)';for(let y=776;y<1020;y+=14)c.fillRect(x0+60,y,300,6);c.strokeStyle='#0a0a0c';c.lineWidth=8;c.strokeRect(x0+60,770,300,250);
 c.fillStyle=lg(0,FL,0,FL+270,[[0,cool?'#181b22':'#1d1915'],[1,'#060607']]);c.fillRect(x0,FL,538,270);
 // desk
 c.fillStyle='#0a0a0c';c.fillRect(x0+190,1236,330,20);c.fillRect(x0+205,1256,14,FL-1256);c.fillRect(x0+495,1256,14,FL-1256);c.fillStyle='#2e2a26';c.fillRect(x0+192,1238,326,12);
 // plant
 c.fillStyle='#0a0a0c';c.fillRect(x0+470,1180,34,58);for(let i=0;i<5;i++){c.save();c.translate(x0+487,1182);c.rotate(-1+i*.5);c.fillStyle='#0a0a0c';c.beginPath();c.ellipse(0,-30,10,28,0,0,7);c.fill();c.fillStyle='#3c4739';c.beginPath();c.ellipse(0,-30,7,25,0,0,7);c.fill();c.restore()}
 // chair
 c.fillStyle='#0a0a0c';c.fillRect(x0+80,1290,110,16);c.fillRect(x0+128,1306,12,FL-1306);c.fillRect(x0+70,1150,14,150)})}
function monitor(x,u,text,red,shake=0){const c=C();S(()=>{c.translate(x+shake,0);c.fillStyle='#0a0a0c';c.fillRect(-8,1190,16,48);c.fillRect(-40,1232,80,8);rr(-110,1050,220,146,10);c.fill();
 c.fillStyle=lg(0,1056,0,1190,[[0,'#dfe6f2'],[1,'#b9c4d6']]);rr(-102,1058,204,130,6);c.fill();
 c.fillStyle='#2b3140';c.fillRect(-102,1058,204,20);txt('MAIL',-80,1068,'800 11px Disp','#fff',{align:'left'});
 if(text){c.fillStyle=red?'#ffd9df':'#fff';rr(-90,1088,180,86,6);c.fill();c.fillStyle=red?CR:'#2b3140';c.fillRect(-90,1088,4,86);txt('HR Department',-78,1102,'800 12px Disp','#111',{align:'left'});
  txt(text[0],-78,1126,'800 14px Disp',red?CR:'#111',{align:'left'});txt(text[1],-78,1146,'500 11px Disp','#333',{align:'left'});txt(text[2],-78,1162,'500 11px Disp','#333',{align:'left'})}
 c.globalCompositeOperation='screen';c.fillStyle=rg(0,1120,0,220,[[0,'rgba(170,195,255,.22)'],[1,'rgba(170,195,255,0)']]);c.fillRect(-240,900,480,450)})}
function papers(x,y,u,t0){const k=seg(u,t0,t0+1.6);if(k<=0||k>=1)return;const c=C();const r=rng(7);for(let i=0;i<9;i++){const vx=(r()-.3)*420,vy=-300-r()*380,rot=(r()-.5)*8;const t=k*1.6;const px=x+vx*t,py=y+vy*t+520*t*t;if(py>FL+40)continue;
 S(()=>{c.translate(px,py);c.rotate(rot*t);c.fillStyle='#0a0a0c';c.fillRect(-24,-31,48,62);c.fillStyle='#ecebe6';c.fillRect(-21,-28,42,56);c.fillStyle='rgba(0,0,0,.3)';for(let l=0;l<4;l++)c.fillRect(-15,-18+l*11,30-(l%2)*8,3)})}}
function planCard(u,t0,x,y){pop(u,t0,e=>S(()=>{const c=C();c.translate(x,y);c.scale(e,e);c.fillStyle='rgba(14,14,16,.94)';c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2.5;c.shadowColor='rgba(255,255,255,.3)';c.shadowBlur=14;rr(-150,-80,300,160,16);c.fill();c.stroke();c.shadowBlur=0;
 txt('PLAN B',-120,-52,'800 20px Disp','#fff',{align:'left',ls:3});['UPDATE CV','CALL 5 CONTACTS','TRAIN TONIGHT'].forEach((s,i)=>{const k=seg(u,t0+.5+i*.45,t0+.7+i*.45);txt(s,-90,-14+i*36,'700 20px Disp',k>0?'#fff':'rgba(255,255,255,.55)',{align:'left'});c.strokeStyle='#fff';c.lineWidth=2;c.strokeRect(-122,-24+i*36,18,18);
  if(k>0){c.strokeStyle=WARM;c.lineWidth=3.5;c.beginPath();c.moveTo(-119,-15+i*36);c.lineTo(-114,-10+i*36);c.lineTo(-105-0*k,-21+i*36);c.stroke()}})}))}
// ---------- A2 THE EMAIL ----------
function a2(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);office(0,u,true);office(542,u,false);
 const slam=seg(u,1.55,1.7),shk=slam>0&&slam<1?Math.sin(u*90)*8*(1-slam):(u>1.7&&u<2.0?Math.sin(u*90)*6*(1-seg(u,1.7,2)):0);
 const mail=u>.5?["WE'RE LETTING YOU GO.",'Effective immediately. Your','access ends today at 5PM.']:null;
 S(()=>{c.beginPath();c.rect(0,690,538,1000);c.clip();monitor(380,u,mail,true,shk);
  const up=eio(seg(u,2.1,2.6));let pose;
  if(u<1.45)pose=lpz(Pz({...SIT,lean:.12,hd:.05,aF:[1.0,.7],aB:[.9,.8]}),Pz({...SIT,lean:-.15,hd:-.1,aF:[.4,.5],aB:[.3,.5]}),seg(u,.55,.8));
  else if(u<2.1)pose=lpz(Pz({...SIT,lean:.25,hd:.2,aF:[1.9,.2],aB:[.4,.5]}),Pz({...SIT,lean:.3,hd:.25,aF:[1.0,.1],aB:[.4,.5]}),eo(slam));
  else pose=lpz(Pz({...SIT,lean:.1}),Pz({lean:.12,hd:-.1,aF:[2.6,.6],aB:[-.4,.8],lF:[.25,0],lB:[-.25,0]}),up);
  const x=lerp(150,170,up),y=lerp(sitY(1.05),FL,up);R({x:x+(u>2.6?Math.sin(u*3)*20:0),y,s:1.05,f:1,noShadow:up<.5,pose,mood:u<.55?'neutral':(u<1.2?'shock':'angry'),t:u,frontProp:J=>{if(u>2.6)phone(J,.6)}});
  if(u>1.6)papers(330,1230,u,1.6);if(u>1.3)zig(170,sitY(1.05)-300-(up*120),u,eo(seg(u,1.3,1.6)))});
 S(()=>{c.beginPath();c.rect(542,690,538,1000);c.clip();monitor(922,u,mail,true);
  const write=u>2.0;const pose=write?Pz({...SIT,lean:.18,hd:.25,aF:[1.0+Math.sin(u*14)*.06,.8],aB:[.9,.85]}):lpz(Pz({...SIT,lean:.12,aF:[1.0,.7],aB:[.9,.8]}),Pz({...SIT,lean:-.05,hd:-.05,aF:[.5,.6],aB:[.4,.6]}),seg(u,.6,.9)*(1-seg(u,1.7,2.0)));
  St({x:692,y:sitY(1.05),s:1.05,f:1,noShadow:true,pose,mood:u<.55?'neutral':(u<1.0?'shock':(u<1.8?'calm':'neutral')),t:u});
  if(u>1.0&&u<1.9)S(()=>{const k=seg(u,1.0,1.9);c.globalAlpha=(1-k)*.4;c.fillStyle='#e8edf6';c.beginPath();c.arc(760+k*40,1010-k*30,10+k*30,0,7);c.fill()});
  planCard(u,2.1,900,900)});
 divider();
 notif(u,.45,270,800,'HR Department',"We're letting you go.",{red:true,w:420,icon:'!'},.9);notif(u,.5,812,800,'HR Department',"We're letting you go.",{red:true,w:420,icon:'!'},.9);
 say(u,2.75,250,1020,'THIS IS SO UNFAIR!',{col:CRL,tx:-20},2.2);say(u,3.4,800,1080,'OKAY. NEXT MOVE.',{tx:-30,tdx:-6},2.4);
 scoreboard(u,'MONDAY · 9:14 AM','BLAME','PLAN')}

// ---------- A3 WEEK ONE ----------
function a3(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 S(()=>{c.beginPath();c.rect(0,690,538,1000);c.clip();c.translate(-170,0);envLounge(u,{door:0});
  R({x:470,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:-.25,hd:.45,aF:[.65,1.5],aB:[.2,.9]}),mood:'sad',t:u,frontProp:J=>phone(J,.9),backProp:J=>S(()=>{c.fillStyle='#0a0a0c';rr(J.handB[0]-10,J.handB[1]-30,20,34,4);c.fill();c.fillStyle='#8a1a2a';rr(J.handB[0]-7,J.handB[1]-27,14,28,3);c.fill()})});
  [[300,1440],[340,1452],[620,1446]].forEach(([x,y])=>S(()=>{c.translate(x,y);c.rotate(1.4);c.fillStyle='#0a0a0c';rr(-10,-16,20,32,4);c.fill();c.fillStyle='#7a1726';rr(-7,-13,14,26,3);c.fill()}))});
 S(()=>{c.beginPath();c.rect(542,690,538,1000);c.clip();c.translate(-60,0);envDesk(u);c.fillStyle='#0a0a0c';c.fillRect(640,1290,110,18);
  St({x:690,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.14,hd:.2,aF:[1.05+Math.sin(u*22)*.07,.75],aB:[.95-Math.sin(u*22)*.07,.85]}),mood:'neutral',t:u})});
 divider();
 const n=Math.round(12*eio(seg(u,.3,3.0)));S(()=>{c.fillStyle='rgba(10,10,12,.9)';rr(700,760,320,120,16);c.fill();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;rr(700,760,320,120,16);c.stroke()});
 txt('APPLICATIONS SENT',860,792,'500 16px Lab','rgba(255,255,255,.7)',{ls:4});txt(String(n),860,838,'900 50px Black','#fff',{glow:14});
 S(()=>{c.fillStyle='rgba(10,10,12,.9)';rr(60,760,320,120,16);c.fill();c.strokeStyle=rgba(CR,.7);c.lineWidth=2;rr(60,760,320,120,16);c.stroke()});
 txt('EPISODES WATCHED',220,792,'500 16px Lab','rgba(255,255,255,.7)',{ls:4});txt(String(Math.round(14*eio(seg(u,.3,3.0)))),220,838,'900 50px Black',CRL,{glow:14,gc:CR});
 scoreboard(u,'WEEK ONE',`${num(0,0,u,0,1)} APPS`,`${n} APPS`,{size:76})}

// ---------- A4 THE BREAKUP ----------
function a4(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 S(()=>{c.beginPath();c.rect(0,690,538,1000);c.clip();c.translate(-120,0);envBedroom(u,'11:48');
  const tap=Math.sin(u*28)*.06;R({x:400,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.3,hd:.5,aF:[.6+tap,1.6],aB:[.5-tap,1.6]}),mood:u<1.0?'shock':'sad',t:u,frontProp:J=>phone(J,1.2)})});
 S(()=>{c.beginPath();c.rect(0,690,538,1000);c.clip();phoneFrame(60,712,330,330,()=>{const x0=60,y0=712;c.fillStyle='#14161c';c.fillRect(x0,y0,330,60);txt('MAYA',x0+165,y0+40,'800 18px Disp','#fff',{ls:3});
   const sent=[[1.2,'why??'],[1.55,'can we talk'],[1.9,'ANSWER ME'],[2.25,'please'],[2.6,"i'll change"],[3.0,'hello??']];
   const shift=Math.max(0,sent.filter(s=>u>s[0]).length-2)*56;S(()=>{c.translate(0,-shift);chat(u,[[.2,'I think we need space.',false,null],...sent.map(([t,s],i)=>[t,s,true,i==sent.length-1?'Delivered':null])],x0+165,y0+80,300)})})});
 S(()=>{c.beginPath();c.rect(542,690,538,1000);c.clip();
  if(u<2.4){c.translate(420,0);envBedroom(u,'11:48');c.translate(-420,0);const down=eo(seg(u,1.1,1.6));
   St({x:840,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:lpz(Pz({...SIT,lean:.2,hd:.45,aF:[.6,1.6],aB:[.5,1.6]}),Pz({...SIT,lean:-.05,hd:.05,aF:[.2,.3],aB:[-.1,.3]}),down),mood:u<1.0?'shock':'calm',t:u,frontProp:J=>{if(down<.5)phone(J,1)}});
   if(down>.5)S(()=>{c.fillStyle='#0a0a0c';rr(940,1238,44,12,3);c.fill()})}
  else{const v=u-2.4;c.translate(260,0);envDawn(u,v*600);c.fillStyle='rgba(8,10,20,.55)';c.fillRect(0,0,W,H);c.translate(-260,0);rain(u,1,9,542,690,538,1000,90,30);splashes(u,1440,1600,18,9);
   St({x:810,y:FL,s:1.1,f:1,pose:runP(v*14),mood:'calm',t:u})}});
 divider();
 {const nt=Math.round(lerp(0,17,eio(seg(u,1.1,3.6))));scoreboard(u,'11:48 PM',`${nt} TEXT${nt==1?'':'S'}`,u>2.5?'1 RUN':'0 RUNS',{size:76})}}

// ---------- A5 THE COMMENT ----------
function pullup(x,u,char){const c=C();S(()=>{c.fillStyle='#0a0a0c';c.fillRect(x-130,860,260,12);c.fillRect(x-140,860,12,560);c.fillRect(x+128,860,12,560);c.fillStyle='#8d9099';c.fillRect(x-126,862,252,6)});
 const k=(Math.sin(u*4.2-Math.PI/2)+1)/2;const lift=k*120;char({x,y:FL-60-lift,s:1.0,f:1,noShadow:true,pose:Pz({hd:-.1,aF:[-2.75+.35*(1-k),-.5+.9*(1-k)*0],aB:[2.75-.35*(1-k),0],lF:[.15,.2],lB:[-.1,.25]}),mood:'calm',t:u})}
function a5(u){const c=C();c.fillStyle='#050506';c.fillRect(0,0,W,H);
 S(()=>{c.fillStyle=lg(0,690,0,FL,[[0,'#0d0d10'],[1,'#141418']]);c.fillRect(0,690,W,FL-690);c.fillStyle=lg(0,FL,0,FL+270,[[0,'#17171b'],[1,'#050506']]);c.fillRect(0,FL,W,270)});
 // comment card
 pop(u,.15,e=>S(()=>{c.translate(540,800);c.scale(e,e);c.fillStyle='rgba(20,21,26,.96)';c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=2;rr(-400,-70,800,140,24);c.fill();c.stroke();
  c.fillStyle='#3a3d47';c.beginPath();c.arc(-340,-14,28,0,7);c.fill();txt('@anon_99213',-296,-34,'800 22px Disp','rgba(255,255,255,.7)',{align:'left'});txt("you'll never make it lol",-296,4,'700 32px Disp','#fff',{align:'left'});
  txt('♥ 3   ·   Reply',-296,42,'500 18px Disp','rgba(255,255,255,.45)',{align:'left'})}));
 S(()=>{c.beginPath();c.rect(0,890,538,800);c.clip();
  R({x:250,y:sitY(1.05),s:1.05,f:1,noShadow:true,pose:Pz({...SIT,lean:.3,hd:.5,aF:[.6+Math.sin(u*30)*.07,1.6],aB:[.5-Math.sin(u*30)*.07,1.6]}),mood:'angry',t:u,frontProp:J=>phone(J,1.1)});
  S(()=>{c.fillStyle='#0a0a0c';c.fillRect(170,1290,150,16);c.fillRect(236,1306,12,FL-1306)});
  if(u>.9)zig(250,sitY(1.05)-300,u,eo(seg(u,.9,1.2)));
  const essay="Who do you think you are?? You don't know me. I've been grinding for YEARS and people like you";const n=Math.floor(clamp((u-.8)/2.8)*essay.length);
  S(()=>{c.fillStyle='rgba(20,8,12,.94)';c.strokeStyle=CRL;c.lineWidth=2;rr(40,915,460,150,18);c.fill();c.stroke();c.font='600 21px Disp';const words=essay.slice(0,n).split(' ');let line='',ly=948;words.forEach(w=>{if(c.measureText(line+w).width>420){txt(line,62,ly,'600 21px Disp','#fff',{align:'left'});line='';ly+=28}line+=w+' '});txt(line+(Math.floor(u*4)%2?'|':''),62,ly,'600 21px Disp','#fff',{align:'left'})})});
 S(()=>{c.beginPath();c.rect(542,890,538,800);c.clip();
  if(u<1.3){St({x:810,y:FL,s:1.05,f:1,pose:Pz({lean:.1,hd:.45,aF:[.55,1.55],aB:[.45,1.6]}),mood:u<.8?'neutral':'smirk',t:u,frontProp:J=>{if(u<1.1)phone(J,1)}})}
  else pullup(810,u-1.3,St)});
 S(()=>{c.fillStyle='#050506';c.fillRect(534,890,12,800);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(546,890,2,800)});
 scoreboard(u,'PUBLIC OPINION','REPLIED','TRAINED')}

// ---------- A6 CONCEPT ----------
function a6(u){stage(u,[[330,1,'#ff8a9c'],[750,1,'#ffffff']]);const c=C();const k=eio(seg(u,.2,1.0));
 const yL=lerp(700,1050,k),crush=eo(seg(u,.9,1.4));slab(330,yL+crush*90,280,80,1);
 R({x:330,y:FL,s:1.2,f:1,pose:lpz(Pz({aF:[-2.5,0],aB:[2.5,0]}),Pz({lean:.5,hd:.6,aF:[-1.5,.8],aB:[1.6,.8],lF:[1.0,-1.8],lB:[.2,.1]}),crush),mood:crush>.3?'sad':'shock',t:u});
 if(crush>0)S(()=>{c.strokeStyle=CRL;c.shadowColor=CR;c.shadowBlur=14;c.lineWidth=3;c.globalAlpha=crush;[[0,0,-30,40,-10,70],[0,0,40,30,60,80]].forEach(p=>{c.beginPath();c.moveTo(330+p[0],FL+4);c.lineTo(330+p[2],FL+4+p[3]*.4);c.lineTo(330+p[4],FL+4+p[5]*.5);c.stroke()})});
 const yR=lerp(700,1050,k);slab(750,yR,280,80,1);
 St({x:750,y:FL,s:1.2,f:-1,pose:Pz({lean:-.03,hd:-.25,aF:[-2.75,-.15],aB:[2.75,.15]}),mood:'calm',t:u,glow:1.4});
 tag(330,FL+70,'BREAKS',CRL,eo(seg(u,1.2,1.5)));tag(750,FL+70,'HOLDS','#fff',eo(seg(u,1.3,1.6)));
 title2(u,.1,"PRESSURE DOESN'T BUILD CHARACTER.",null,520);title2(u,.9,'It ','reveals it.',632)}

// ---------- A7 FIGHT NIGHT ----------
function a7(u){globalThis.__REFX=870;ringBG(u);globalThis.__REFX=540;const c=C();const FLR=1306;
 let pr=GUARD,ps=GUARD;const by=Math.sin(u*7)*5,by2=Math.sin(u*6+1.4)*4;
 // reactive flurry 1.0–2.2
 [[1.0,1.2],[1.35,1.55],[1.7,1.9]].forEach(([a,b],i)=>{if(u>a-.15&&u<b+.15){const k=seg(u,a-.15,a),k2=seg(u,a,b),k3=seg(u,b,b+.15);pr=k3>0?lpz(HAY,GUARD,eo(k3)):(k2>0?lpz(WIND,HAY,eo(k2)):lpz(GUARD,WIND,eo(k)))}});
 [[1.05],[1.4],[1.75]].forEach(([t0])=>{const k=seg(u,t0,t0+.15)*(1-seg(u,t0+.25,t0+.4));if(k>0)ps=lpz(GUARD,SLIP,eo(k))});
 const gas=eo(seg(u,2.4,3.0));if(gas>0&&u<3.8)pr=lpz(pr,Pz({lean:.28,hd:.35,aF:[.35,1.0],aB:[.25,1.1],lF:[.3,-.1],lB:[-.3,.1]}),gas);
 const hits=[3.9,4.2,4.6];hits.forEach(t0=>{const a=seg(u,t0,t0+.09),b=seg(u,t0+.13,t0+.28);if(u>t0&&u<t0+.28)ps=lpz(lpz(GUARD,JAB,eo(a)),GUARD,eo(b))});
 const hitk=hits.reduce((m,t0)=>Math.max(m,u>t0+.06?Math.exp(-(u-t0-.06)*6)*(u<t0+.7?1:0):0),0);
 const push=hits.reduce((m,t0)=>m+(u>t0?eo(seg(u,t0,t0+.4))*30:0),0);
 const knee=eo(seg(u,5.2,5.7));
 let rx=410-push-knee*20+Math.sin(u*2)*6,sx=640+Math.sin(u*2+1)*5;
 if(u>3.8)pr=lpz(Pz({lean:.28,hd:.35,aF:[.35,1.0],aB:[.25,1.1],lF:[.3,-.1],lB:[-.3,.1]}),HIT,hitk);
 if(knee>0)pr=lpz(pr,Pz({lean:.4,hd:.6,aF:[.6,.8],aB:[.1,.4],lF:[1.5,-1.6],lB:[.1,.1]}),knee);
 const ref=eo(seg(u,5.8,6.4));if(u>5.4)ps=lpz(ps,Pz({lean:-.05,hd:-.05,aF:[.3,.6],aB:[-.2,.5]}),eo(seg(u,5.4,5.9)));
 R({x:rx,y:FLR-24+(gas>0?Math.sin(u*9)*3:by)+knee*18,s:1.22,f:1,pose:pr,mood:u<2.4?'angry':(u<3.8?'sad':'shock'),t:u,outfit:'tee',top:'#4a4a52'});
 St({x:sx-ref*30,y:FLR-24+by2,s:1.22,f:-1,pose:ps,mood:'calm',t:u,outfit:'tee'});
 if(gas>0&&u<4)droplets(rx+20,FLR-300,u,2.6,10,4);hits.forEach((t0,i)=>droplets(rx+40,FLR-290,u,t0+.06,14,i+30));
 hits.forEach(t0=>{const k=seg(u,t0+.06,t0+.3);if(k>0&&k<1)S(()=>{const x=rx+50,y=FLR-290;c.strokeStyle='#fff';c.lineWidth=4;c.shadowColor='#fff';c.shadowBlur=20;c.globalAlpha=1-k;for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.beginPath();c.moveTo(x+Math.cos(a)*(10+k*20),y+Math.sin(a)*(10+k*20));c.lineTo(x+Math.cos(a)*(30+k*60),y+Math.sin(a)*(30+k*60));c.stroke()}})});
 [[1.15,1.4],[1.5,1.75],[1.85,2.05]].forEach(([a,b])=>{const k=seg(u,a,b);if(k>0&&k<1)S(()=>{c.strokeStyle=rgba(CR,.8*(1-k));c.lineWidth=6;c.lineCap='round';c.beginPath();c.arc(rx+30,FLR-300,120,-1.4,-1.4+k*1.9);c.stroke()})});
 if(u>2.6&&u<4)S(()=>{for(let i=0;i<3;i++){const k=((u*1.5+i/3)%1);c.globalAlpha=(1-k)*.3;c.fillStyle='#fff';c.beginPath();c.arc(rx+50+k*30,FLR-290-k*10,6+k*16,0,7);c.fill()}});
 say(u,6.2,sx-20,1000,'STAY DOWN.',{tx:-10,tdx:-6},2.4);
 // front ropes
 S(()=>{[[FLR-60,'#e9e9ee'],[FLR-140,CR]].forEach(([y,col])=>{c.strokeStyle='#0a0a0c';c.lineWidth=14;c.beginPath();c.moveTo(60,y+20);c.quadraticCurveTo(540,y+34,1020,y+20);c.stroke();c.strokeStyle=col==CR?'#b31d36':'#d9d9de';c.lineWidth=8;c.stroke()})});
 const bL=Math.round(156+22*eio(seg(u,1,3))+Math.sin(u*9)*3),bR=Math.round(124+6*eio(seg(u,1,3))+Math.sin(u*5)*1.5);
 scoreboard(u,'ROUND 3 · HEART RATE',`${bL} BPM`,`${bR} BPM`,{size:76});
 S(()=>{const k=seg(u,0,.6);if(k<1){c.fillStyle=`rgba(255,255,255,${(1-k)*.25})`;c.fillRect(0,0,W,H)}})}

// ---------- A8 OUTRO ----------
function a8(u){stage(u,[[320,.45,'#ff8a9c'],[760,1,'#ffffff']]);const c=C();
 S(()=>{c.fillStyle='#0a0a0c';c.fillRect(270,1300,110,16);c.fillRect(280,1316,10,104);c.fillRect(360,1316,10,104)});
 R({x:320,y:sitY(1.05)+40,s:1.05,f:1,noShadow:true,pose:Pz({...SIT,lean:.45,hd:.7,aF:[.5,.6],aB:[.4,.7]}),mood:'sad',t:u,
  backProp:J=>S(()=>{c.fillStyle='#d9d9de';c.beginPath();c.ellipse(J.neck[0]-6,J.neck[1]+6,46,18,-.2,0,7);c.fill()})});
 St({x:760,y:FL,s:1.25,f:-1,pose:TALL,mood:'calm',t:u,glow:1.2});
 title2(u,.1,"YOU DON'T RISE TO THE OCCASION.",null,520);title2(u,.8,'You fall to your ','training.',632)}

export const VIDEO_A=makeTimeline([
 {fn:a1,dur:3.0,cam:camPush(1,1.06)},
 {fn:a2,dur:6.0,cam:camPush(1.0,1.04),fadeIn:.12},
 {fn:a3,dur:3.4,cam:camPush(1.03,1.0)},
 {fn:a4,dur:5.0,cam:camPush(1,1.04)},
 {fn:a5,dur:4.5,cam:camPush(1.04,1.0)},
 {fn:a6,dur:3.2,cam:camPush(1,1.07),fadeIn:.15},
 {fn:a7,dur:8.6,cam:(k,u)=>{const sh=u>3.9&&u<4.9?Math.sin(u*80)*6*Math.exp(-(u-3.9)*2):0;return [lerp(1.0,1.09,k),sh,lerp(0,-20,k)]}},
 {fn:a8,dur:4.0,cam:camPush(1,1.05),fadeIn:.2},
 {fn:endCard,dur:3.6,cam:()=>[1,0,0],fadeIn:.2},
]);
