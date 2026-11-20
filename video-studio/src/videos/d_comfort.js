// VIDEO D — "He Wasn't Tired. He Was Comfortable."  (no narration · 3:4 · ~41.6 s)
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,eback,clamp,rng,W,H,CR,CRL,WARM,dust,droplets,stage,person,Pz,lpz,walkP,runP,SIT,SLUMP,TALL,phone,rays} from '../engine/lib.js';
import {FIRST,SECOND,POSES} from '../characters.js';
import {envLounge,envBathroom,envDawn,envGym,envDesk} from '../environments.js';
import {FL,scoreboard,pop,say,phoneFrame,tag,title2,divider,endCard,makeTimeline,camPush} from '../kit/kit.js';
const C=()=>getCtx();
const R=(o)=>person({...FIRST,...o});const St=(o)=>person({...SECOND,...o});
const sitY=s=>1262+132*s;
function half(side,fn){const c=C();S(()=>{c.beginPath();c.rect(side?542:0,690,538,1000);c.clip();fn()})}
const COUCH=Pz({...SIT,lean:-.35,hd:.4,aF:[.65,1.5],aB:[.25,.8]});
function takeout(x,y){const c=C();S(()=>{c.fillStyle='#0a0a0c';c.beginPath();c.moveTo(x-30,y);c.lineTo(x+30,y);c.lineTo(x+24,y-44);c.lineTo(x-24,y-44);c.closePath();c.fill();c.fillStyle='#d9d1c4';c.beginPath();c.moveTo(x-26,y-3);c.lineTo(x+26,y-3);c.lineTo(x+21,y-41);c.lineTo(x-21,y-41);c.closePath();c.fill();c.fillStyle=CR;c.fillRect(x-14,y-28,28,8)})}

// D1 HOOK
function d1(u){envLounge(u,{door:0,trap:.5+.4*eo(seg(u,0,1.2))});const c=C();const sink=eio(seg(u,0,1.6));
 R({x:456,y:sitY(1.15)+sink*26,s:1.15,f:1,noShadow:true,pose:lpz(Pz({...SIT,lean:-.1,hd:.2}),Pz({...COUCH,lean:-.5,hd:.55}),sink),mood:'calm',t:u,blink:sink>.7?.6:0,frontProp:J=>phone(J,.9)});
 tag(456,FL+80,'REACTIVE',CRL,eo(seg(u,.3,.6)));
 title2(u,-1,"HE WASN'T TIRED.",null,520);title2(u,.25,'He was ','comfortable.',632)}
// D2 SAME WEEK
const DAYS=['MON','TUE','WED','THU','FRI','SAT','SUN'];
function d2(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);const di=Math.min(6,Math.floor(u/.68)),v=u-di*.68;
 half(0,()=>{c.translate(-170,0);envLounge(u,{door:0});c.translate(170,0);R({x:286,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:COUCH,mood:'neutral',t:u,frontProp:J=>phone(J,.9)});takeout(120,1440);if(di>2)takeout(170,1450);if(di>4)takeout(80,1458)});
 half(1,()=>{const k=di%4;if(k==0){c.translate(270,0);envGym(u);c.translate(-270,0);const lift=(Math.sin(v*9)+1)/2;St({x:810,y:FL,s:1.1,f:1,pose:lpz(POSES.deadliftDown,POSES.deadliftUp,lift),mood:'angry',t:u})}
  else if(k==1){c.translate(260,0);envDawn(u,v*600);c.translate(-260,0);St({x:810,y:FL,s:1.1,f:1,pose:runP(v*14),mood:'calm',t:u})}
  else if(k==2){c.translate(-60,0);envDesk(u);c.translate(60,0);c.fillStyle='#0a0a0c';c.fillRect(640,1290,110,18);St({x:690,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.14,hd:.2,aF:[1.05+Math.sin(u*20)*.06,.75],aB:[.95,.85]}),mood:'calm',t:u})}
  else{stage(u,[[810,1,'#ffffff']]);St({x:810,y:sitY(1.15),s:1.15,f:1,noShadow:true,pose:Pz({...SIT,lean:.05,hd:.35,aF:[1.15,1.2],aB:[1.0,1.3]}),mood:'calm',t:u});S(()=>{c.fillStyle='#0a0a0c';c.fillRect(740,1305,140,16)})}
  S(()=>{const f=1-seg(v,0,.1);if(f>0){c.fillStyle=`rgba(255,255,255,${f*.3})`;c.fillRect(542,690,538,1000)}})});
 divider();
 [0,1].forEach(sd=>S(()=>{const x=sd?810:270;c.fillStyle='rgba(10,10,12,.88)';rr(x-70,750,140,56,12);c.fill();c.strokeStyle=sd?'rgba(255,255,255,.5)':rgba(CR,.7);c.lineWidth=2;rr(x-70,750,140,56,12);c.stroke();txt(DAYS[di],x,779,'900 30px Black',sd?'#fff':CRL,{ls:3})}));
 scoreboard(u,'SAME WEEK','1 DAY ×7','7 DAYS',{size:76})}
// D3 SLOW DECLINE
function d3(u){envLounge(u,{door:0});const c=C();const k=eio(seg(u,.2,4.0));
 S(()=>{c.fillStyle=`rgba(0,0,0,${.45*k})`;c.fillRect(0,0,W,H)});
 R({x:456,y:sitY(1.15)+k*12,s:1.15,f:1,noShadow:true,pose:lpz(COUCH,Pz({...COUCH,lean:-.55,hd:.7}),k),mood:k>.5?'sad':'neutral',t:u,frontProp:J=>phone(J,.8)});
 [[0,'ENERGY',.8],[1,'MONEY',.7],[2,'CONFIDENCE',.85],[3,'HEALTH',.75]].forEach(([i,l,d])=>{const v=lerp(.9,.9-d,k);const x=90+i*240,y=800;
  txt(l,x+90,y-14,'500 15px Lab','rgba(255,255,255,.7)',{ls:4});S(()=>{c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;rr(x,y,180,20,10);c.stroke();c.fillStyle=v<.4?CRL:'#fff';c.shadowColor=v<.4?CR:'#fff';c.shadowBlur=10;rr(x+4,y+4,Math.max(10,172*v),12,6);c.fill()})});
 for(let i=0;i<5;i++){const t0=.4+i*.7;pop(u,t0,e=>S(()=>{const x=[130,270,620,760,410][i],y=1500-((i*37)%40);c.translate(x,y);c.scale(e,e);takeout(0,0)}))}
 S(()=>{const g=k;c.globalAlpha=g;c.strokeStyle=CRL;c.shadowColor=CR;c.shadowBlur=20;c.lineWidth=4;c.setLineDash([12,10]);c.lineDashOffset=u*30;c.beginPath();c.ellipse(456,1300,lerp(520,300,g),lerp(300,170,g),0,0,7);c.stroke()});
 tag(456,1610,'COMFORT ZONE',CRL,k);
 scoreboard(u,'6 MONTHS LATER','DECLINING','BUILDING',{size:72})}
// D4 CONCEPT: SHRINKING ZONE
function d4(u){stage(u,[[400,1,'#ff8a9c'],[800,1,'#ffffff']]);const c=C();const k=eio(seg(u,.2,2.6));
 S(()=>{c.strokeStyle=CRL;c.shadowColor=CR;c.shadowBlur=20;c.lineWidth=4;c.beginPath();c.ellipse(400,FL,lerp(330,110,k),lerp(70,24,k),0,0,7);c.stroke();c.globalAlpha=.15;c.fillStyle=CR;c.fill()});
 R({x:400,y:FL,s:1.15,f:1,pose:lpz(TALL,Pz({lean:.2,hd:.4,aF:[.6,1.2],aB:[.5,1.2],lF:[.03,0],lB:[-.03,0]}),k),mood:k>.5?'sad':'neutral',t:u});
 const sx=lerp(700,900,k);St({x:sx,y:FL,s:1.1,f:1,pose:walkP(u*6,.8),mood:'calm',t:u});
 S(()=>{c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;c.setLineDash([6,8]);c.beginPath();c.ellipse(sx,FL,lerp(120,360,k),lerp(26,80,k),0,0,7);c.stroke()});
 title2(u,.1,'THE COMFORT ZONE',null,520);title2(u,.6,"It doesn't stay the same. It ",'shrinks.',632)}
// D5 THE MIRROR
function d5(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);S(()=>{c.translate(270,0);envBathroom(u);c.translate(-270,0)});
 S(()=>{c.fillStyle='#050506';c.fillRect(0,690,280,1000);c.fillRect(800,690,280,1000)});
 const mx=662-270+270-0,my=800;const ref=eo(seg(u,1.2,2.2))*(1-seg(u,3.2,4.0));
 S(()=>{const x0=390,c2=c;c2.beginPath();c2.rect(x0,my,300,330);c2.clip();c2.globalAlpha=.6;
  R({x:x0+150,y:my+520,s:1.0,f:1,noShadow:true,pose:Pz({...COUCH,lean:.2,hd:.45,lF:[.05,0],lB:[-.05,0]}),mood:'sad',t:u});
  c2.globalAlpha=.75*ref;person({...FIRST,skin:'#d9d9de',top:'#4a4a52',x:x0+150,y:my+520,s:1.0,f:1,noShadow:true,pose:TALL,mood:'smile',t:u,glow:ref*1.2});
  if(ref>0){c2.globalCompositeOperation='screen';c2.globalAlpha=ref*.4;c2.fillStyle=rg(x0+150,my+180,0,200,[[0,'rgba(255,255,255,.6)'],[1,'rgba(255,255,255,0)']]);c2.fillRect(x0,my,300,330)}});
 txt(ref>.3?'2 YEARS AGO':'',540,my+30,'500 16px Lab','rgba(255,255,255,.7)',{ls:5});
 R({x:540,y:1440,s:1.05,f:1,pose:Pz({lean:.18,hd:-.05,aF:[.1,.3],aB:[-.05,.3]}),mood:u<1.2?'neutral':(u<3?'shock':'sad'),t:u});
 say(u,2.8,770,1160,'WHEN DID I STOP?',{thought:true,col:CRL,tx:30},1.8);title2(u,.1,'2 YEARS AGO HE HAD PLANS.',null,520);title2(u,.6,'The mirror ',"doesn't lie.",632)}
// D6 THE INVITE
function d6(u){envLounge(u,{door:0});const c=C();
 R({x:456,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.1,hd:.45,aF:[.6,1.6],aB:[.5,1.6]}),mood:u<2.2?'neutral':'calm',t:u,frontProp:J=>phone(J,1.2)});
 phoneFrame(640,740,330,420,()=>{const x0=640,y0=740;c.fillStyle='#14161c';c.fillRect(x0,y0,330,60);txt('STEADY',x0+165,y0+40,'800 18px Disp','#fff',{ls:3});
  const ty=Math.floor(clamp((u-2.4)/1.0)*4);const typed=['','.','..','...','...ok.'][Math.min(4,ty)]||'';
  [[.2,'run tomorrow?',0],[.5,'6am. i\'ll wait for you.',0]].forEach(([t0,s],i)=>{const k=eo(seg(u,t0,t0+.2));if(k>0)S(()=>{c.globalAlpha*=k;c.font='600 20px Disp';const tw=c.measureText(s).width+34;c.fillStyle='#2a2d36';rr(x0+16,y0+80+i*56,tw,44,20);c.fill();txt(s,x0+33,y0+102+i*56,'600 20px Disp','#fff',{align:'left'})})});
  if(u>3.4){const s='...ok.';c.font='600 20px Disp';const tw=c.measureText(s).width+34;c.fillStyle='#e9ecf3';rr(x0+314-tw,y0+200,tw,44,20);c.fill();txt(s,x0+314-tw+17,y0+222,'600 20px Disp','#111',{align:'left'})}
  c.fillStyle='#1b1e26';rr(x0+14,y0+356,302,46,23);c.fill();txt(u<3.4?typed:'',x0+30,y0+379,'500 19px Lab','#fff',{align:'left'})});
 say(u,1.0,330,1060,'TOO TIRED...',{thought:true,col:CRL,tx:-20},1.3);
 tag(456,FL+80,'REACTIVE',CRL);scoreboard(u,'11:02 PM · THE INVITE','HESITATES','WAITS',{size:76})}
// D7 6 AM
function d7(u){const c=C();envDawn(u,u*260);const k=seg(u,.8,2.4);
 const rx=lerp(420,360,k);const hk=u>1.6&&u<3.6;R({x:rx,y:FL,s:1.15,f:1,pose:hk?Pz({lean:.75,hd:-.3,aF:[.85,.2],aB:[.75,.25],lF:[.15,-.2],lB:[-.12,-.15]}):runP(u*9),mood:hk?'sad':'angry',t:u});
 if(hk)S(()=>{for(let i=0;i<4;i++){const k2=((u*1.6+i/4)%1);c.globalAlpha=(1-k2)*.35;c.fillStyle='#e8edf6';c.beginPath();c.arc(rx+80+k2*60,FL-230-k2*20,10+k2*24,0,7);c.fill()}});
 [1.8,2.4,3.0].forEach((t0,i)=>droplets(rx+40,FL-250,u,t0,8,i+40,'#cfe3ff'));
 const back=eio(seg(u,1.8,3.0));const sx=u<1.8?lerp(640,820,seg(u,0,1.8)):lerp(820,rx+170,back);
 St({x:sx,y:FL,s:1.15,f:u<1.8?1:(u<3.2?-1:1),pose:u<3.2&&u>1.8?walkP(u*7):(u>=3.2?runP(u*9):runP(u*12)),mood:'calm',t:u});
 if(u>3.4)R({x:rx+lerp(0,40,seg(u,3.4,5)),y:FL,s:1.15,f:1,pose:runP(u*9+1),mood:'angry',t:u,face:true});
 say(u,2.9,sx,1010,"I'M NOT LEAVING YOU.",{tx:-20,tdx:-6},1.9);
 scoreboard(u,'6:00 AM · DAY 1',u<1.6?'0.4 KM':'0.8 KM','WAITED',{size:76})}
// D8 WEEKS LATER
function d8(u){const c=C();const wk=[1,3,6,9,12];const i=Math.min(4,Math.floor(u/1.0)),v=u-i*1.0;const k=i/4;
 if(i%2==0){envDawn(u,u*500);R({x:420,y:FL,s:1.15,f:1,pose:runP(v*13),mood:'calm',t:u});St({x:640,y:FL,s:1.15,f:1,pose:runP(v*13+.6),mood:'smile',t:u})}
 else{envGym(u);const rep=(Math.sin(v*9)+1)/2;R({x:420,y:FL,s:1.15,f:1,pose:lpz(POSES.deadliftDown,POSES.deadliftUp,rep),mood:'angry',t:u});St({x:700,y:FL,s:1.1,f:-1,pose:Pz({lean:-.05,hd:.05,aF:[.6,1.9],aB:[-.3,.6]}),mood:'smile',t:u})}
 S(()=>{const f=1-seg(v,0,.12);if(f>0){c.fillStyle=`rgba(255,255,255,${f*.16})`;c.fillRect(0,0,W,H)}});
 const km=[0.8,2.5,5,7.5,10][i];
 scoreboard(u,`WEEK ${wk[i]}`,`${km} KM`,'10 KM',{size:76})}
// D9 OUTRO
function d9(u){stage(u,[[400,1,'#ffffff'],[700,1,'#ffffff']]);const c=C();
 R({x:400,y:FL,s:1.22,f:1,pose:TALL,mood:'calm',t:u,glow:eo(seg(u,.8,1.6))});St({x:700,y:FL,s:1.22,f:-1,pose:TALL,mood:'smile',t:u});
 const sk=eio(seg(u,1.0,1.4)),nk=eo(seg(u,1.5,1.9));
 S(()=>{c.globalAlpha=1-nk;txt('REACTIVE',400,FL+70,'500 26px Lab',CRL,{ls:8,glow:10,gc:CR});c.font='500 26px Lab';c.letterSpacing='8px';const w=c.measureText('REACTIVE').width;c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(400-w/2,FL+70);c.lineTo(400-w/2+w*sk,FL+70);c.stroke()});
 A(nk,()=>txt('REBUILT',400,FL+70-(1-nk)*12,'500 26px Lab','#fff',{ls:8,glow:10}));tag(700,FL+70,'STEADY','#fff');
 title2(u,.1,'COMFORT IS A SLOW EXIT.',null,520);title2(u,.8,'Discomfort is the ','way back.',632)}

export const VIDEO_D=makeTimeline([
 {fn:d1,dur:2.0,speed:1,cam:camPush(1.04,1.12)},
 {fn:d2,dur:5.0,cam:camPush(1.0,1.03),fadeIn:.12},
 {fn:d3,dur:4.5,cam:camPush(1,1.1,0,0,0,-20)},
 {fn:d4,dur:3.2,cam:camPush(1,1.06),fadeIn:.12},
 {fn:d5,dur:4.5,cam:camPush(1,1.08)},
 {fn:d6,dur:3.8,cam:camPush(1.03,1.0)},
 {fn:d7,dur:5.0,cam:camPush(1,1.05)},
 {fn:d8,dur:5.0,cam:camPush(1,1.04)},
 {fn:d9,dur:4.0,cam:camPush(1,1.05),fadeIn:.15},
 {fn:endCard,dur:3.6,speed:1.25,cam:()=>[1,0,0],fadeIn:.15},
],{speed:1.28});
