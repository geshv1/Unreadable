// VIDEO B — "Move in Silence"  (no narration · 3:4 · ~40 s)
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,eback,clamp,rng,W,H,CR,CRL,WARM,dust,droplets,zig,stage,person,Pz,lpz,walkP,runP,GUARD,SIT,SLUMP,TALL,phone,eye,rays} from '../engine/lib.js';
import {FIRST,SECOND,FRIENDS,POSES} from '../characters.js';
import {envLounge,envGym,envDawn,envDesk} from '../environments.js';
import {FL,scoreboard,pop,say,phoneFrame,tag,title2,divider,endCard,makeTimeline,camPush} from '../kit/kit.js';
const C=()=>getCtx();
const R=(o)=>person({...FIRST,...o});const St=(o)=>person({...SECOND,...o});const Fr=(i,o)=>person({...FRIENDS[i],...o});
const sitY=s=>1262+132*s;
const heartIcon=(x,y,s,col)=>{const c=C();S(()=>{c.translate(x,y);c.scale(s,s);c.fillStyle=col;c.beginPath();c.moveTo(0,10);c.bezierCurveTo(-18,-2,-10,-17,0,-7);c.bezierCurveTo(10,-17,18,-2,0,10);c.fill()})};
function dumbbell(J,a=0){const c=C();S(()=>{const [x,y]=J.handF;c.translate(x,y);c.rotate(a);c.fillStyle='#0a0a0c';c.fillRect(-26,-4,52,8);rr(-34,-14,14,28,4);c.fill();rr(20,-14,14,28,4);c.fill();c.fillStyle='#3a3b42';rr(-31,-11,8,22,3);c.fill();rr(23,-11,8,22,3);c.fill()})}

// B1 HOOK
function b1(u){const l=Math.min(1,seg(u,.05,.12)),r2=Math.min(1,seg(u,.25,.32));stage(u,[[330,l,'#ff8a9c'],[750,r2,'#ffffff']]);const c=C();
 const talk=Math.sin(u*14);R({x:330,y:FL,s:1.25,f:1,pose:Pz({lean:-.05,hd:-.1+talk*.05,aF:[2.0+talk*.25,.4],aB:[-.4,.6]}),mood:'smile',t:u});
 for(let i=0;i<3;i++){const k=((u*1.2+i/3)%1);S(()=>{c.globalAlpha=(1-k)*.8;c.strokeStyle=CRL;c.lineWidth=3;c.shadowColor=CR;c.shadowBlur=10;c.beginPath();c.arc(400,FL-330,30+k*90,-.6,.6);c.stroke()})}
 const sh=eo(seg(u,.6,1.0));St({x:750,y:FL,s:1.25,f:-1,pose:lpz(TALL,Pz({hd:.02,aF:[2.45,1.55],aB:[-.1,.2]}),sh),mood:'calm',t:u,glow:r2});
 tag(330,FL+70,'REACTIVE',CRL,eo(seg(u,.3,.6)));tag(750,FL+70,'STEADY','#fff',eo(seg(u,.4,.7)));
 title2(u,.1,'TELL NO ONE.',null,520);title2(u,.85,'Let them ','wonder.',632)}

// B2 THE ANNOUNCEMENT
function postUI(u,x0,y0,w,h){const c=C();phoneFrame(x0,y0,w,h,()=>{c.fillStyle='#16181e';c.fillRect(x0,y0,w,h);
 c.fillStyle='#3a3d47';c.beginPath();c.arc(x0+42,y0+62,20,0,7);c.fill();txt('you',x0+72,y0+56,'800 18px Disp','#fff',{align:'left'});txt('Jan 1',x0+72,y0+76,'500 14px Disp','rgba(255,255,255,.5)',{align:'left'});
 c.fillStyle=lg(x0,y0+100,x0+w,y0+230,[[0,'#2a1a20'],[1,'#3a2228']]);c.fillRect(x0+16,y0+96,w-32,130);txt('NEW YEAR.',x0+w/2,y0+138,'900 30px Black','#fff');txt('NEW ME.',x0+w/2,y0+174,'900 30px Black',CRL);txt('GYM EVERY DAY',x0+w/2,y0+206,'700 15px Disp','rgba(255,255,255,.75)',{ls:3});
 const likes=Math.round(214*eio(seg(u,.4,3.2)));heartIcon(x0+32,y0+252,1,CRL);txt(String(likes),x0+52,y0+252,'800 18px Disp','#fff',{align:'left'});
 [[1.0,'LETS GOOO'],[1.6,'so proud of you'],[2.2,'beast mode']].forEach(([t0,s],i)=>{const k=eo(seg(u,t0,t0+.2));if(k>0)S(()=>{c.globalAlpha*=k;c.font='600 16px Disp';const tw=c.measureText(s).width+24;c.fillStyle='#262931';rr(x0+16,y0+276+i*38,tw,30,14);c.fill();txt(s,x0+28,y0+291+i*38,'600 16px Disp','#fff',{align:'left'})})})})
 for(let i=0;i<10;i++){const t0=.5+i*.28;const k=seg(u,t0,t0+.9);if(k<=0||k>=1)continue;S(()=>{c.globalAlpha=(1-k);heartIcon(x0+w-30+Math.sin(i*2+k*6)*14,y0+260-k*170,1+k*.5,CRL)})}}
function b2(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 S(()=>{c.beginPath();c.rect(0,690,538,1000);c.clip();c.translate(-170,0);envLounge(u,{door:0});
  R({x:470,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:-.2,hd:.4,aF:[.65,1.5],aB:[.2,.9]}),mood:'smile',t:u,frontProp:J=>phone(J,1.1)})});
 S(()=>{c.beginPath();c.rect(0,690,538,1000);c.clip();postUI(u,70,712,330,410)});
 S(()=>{c.beginPath();c.rect(542,690,538,1000);c.clip();c.translate(270,0);envGym(u);c.translate(-270,0);
  const k=(Math.sin(u*4.6-Math.PI/2)+1)/2;St({x:810,y:FL,s:1.15,f:1,pose:Pz({lean:-.02,hd:.1,aF:[.15+k*.05,.15+k*2.1],aB:[-.08,.15],lF:[.12,0],lB:[-.1,0]}),mood:'calm',t:u,frontProp:J=>dumbbell(J,k*1.2)});
  txt('6:02 AM',940,770,'800 18px Disp','rgba(255,255,255,.35)',{ls:3})});
 divider();
 scoreboard(u,'JANUARY 1',`${Math.round(214*eio(seg(u,.4,3.2)))} LIKES`,'0 POSTS',{size:76})}

// B3 PREMATURE REWARD
function bar(x,y,w,label,v,col){const c=C();txt(label,x,y-34,'500 20px Lab','rgba(255,255,255,.75)',{ls:6});S(()=>{c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2.5;rr(x-w/2,y-18,w,36,18);c.stroke();c.fillStyle=col;c.shadowColor=col;c.shadowBlur=16;rr(x-w/2+6,y-12,Math.max(24,(w-12)*v),24,12);c.fill()});txt(Math.round(v*100)+'%',x+w/2+50,y,'800 22px Disp',col)}
function b3(u){stage(u,[[540,1,'#ff8a9c']]);const c=C();
 R({x:540,y:FL,s:1.2,f:1,pose:Pz({lean:-.05,hd:-.15,aF:[.5,1.6],aB:[-.2,.4]}),mood:'smile',t:u,frontProp:J=>phone(J,1.2)});
 for(let i=0;i<14;i++){const t0=.2+i*.12;const k=seg(u,t0,t0+.8);if(k<=0||k>=1)continue;const r=rng(i+3);S(()=>{c.globalAlpha=1-k*.7;heartIcon(540+(r()-.5)*400*(1-k),900+r()*120+(1-k)*200-k*40,1.2,CRL)})}
 bar(540,860,460,'FEELS DONE',eio(seg(u,.3,1.8)),CRL);bar(540,960,460,'ACTUALLY DONE',0,'#ffffff');
 tag(540,FL+70,'REACTIVE',CRL);
 title2(u,.1,'PREMATURE REWARD',null,520);title2(u,.7,'Praise feels like ','progress.',632)}

// B4 FEBRUARY
function kitchen(x0,u){const c=C();S(()=>{c.fillStyle=lg(0,690,0,FL,[[0,'#13110f'],[1,'#1d1915']]);c.fillRect(x0,690,538,FL-690);
 c.fillStyle='#0a0a0c';c.fillRect(x0+40,780,200,150);c.fillStyle='#2a2520';c.fillRect(x0+46,786,188,138);c.fillStyle='rgba(255,220,170,.15)';c.fillRect(x0+46,786,188,20);
 c.fillStyle='#0a0a0c';c.fillRect(x0+380,760,140,FL-760);c.fillStyle='#cfd2d8';c.fillRect(x0+386,766,128,FL-772);c.fillStyle='#9aa0a8';c.fillRect(x0+386,1000,128,4);c.fillStyle='#0a0a0c';c.fillRect(x0+396,860,6,90);
 c.fillStyle='#0a0a0c';c.fillRect(x0+20,1220,360,22);c.fillStyle='#d9d1c4';c.fillRect(x0+22,1222,356,12);c.fillStyle='#2c2520';c.fillRect(x0+30,1242,340,FL-1242);
 c.fillStyle=lg(0,FL,0,FL+270,[[0,'#211c18'],[1,'#070606']]);c.fillRect(x0,FL,538,270);
 c.globalCompositeOperation='screen';c.fillStyle=rg(x0+200,800,0,400,[[0,rgba(WARM,.18)],[1,rgba(WARM,0)]]);c.fillRect(x0,690,538,800)})}
function b4(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 S(()=>{c.beginPath();c.rect(0,690,538,1000);c.clip();c.translate(-170,0);envLounge(u,{door:0});
  R({x:470,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:-.3,hd:.5,aF:[.65,1.5],aB:[.2,.9]}),mood:'neutral',t:u,frontProp:J=>phone(J,.9)});c.translate(170,0);
  S(()=>{c.fillStyle='#0a0a0c';rr(40,1390,120,60,16);c.fill();c.fillStyle='#2b2c33';rr(44,1394,112,52,14);c.fill();c.fillStyle='rgba(200,190,170,.25)';for(let i=0;i<20;i++)c.fillRect(48+((i*37)%104),1396+((i*13)%10),3,2);c.fillStyle=CR;c.fillRect(44,1410,112,4)});
  for(let i=0;i<4;i++){const k=((u*.4+i/4)%1);S(()=>{c.globalAlpha=(1-k)*.4;c.fillStyle='#bdb4a2';c.beginPath();c.arc(70+i*25+Math.sin(k*6)*6,1380-k*60,2,0,7);c.fill()})}
  tag(100,1475,'GYM BAG',CRL,.8)});
 S(()=>{c.beginPath();c.rect(542,690,538,1000);c.clip();kitchen(542,u);
  const chop=Math.abs(Math.sin(u*9));St({x:700,y:FL,s:1.12,f:1,pose:Pz({lean:.12,hd:.3,aF:[1.0+chop*.25,.6-chop*.3],aB:[.9,.75]}),mood:'calm',t:u});
  S(()=>{c.fillStyle='#0a0a0c';rr(780,1196,150,26,4);c.fill();c.fillStyle='#b98a5a';rr(784,1199,142,18,3);c.fill();[[820,'#4f7a3a'],[850,'#c8402c'],[880,'#e8d39a']].forEach(([x,col])=>{c.fillStyle=col;c.beginPath();c.arc(x,1194,9,0,7);c.fill()})});
  for(let i=0;i<4;i++){const k=eo(seg(u,.5+i*.6,.8+i*.6));if(k>0)S(()=>{c.globalAlpha=k;c.fillStyle='#0a0a0c';rr(560+i*0+i*0,1190-i*30,0,0,0);c.fill();c.fillStyle='#0a0a0c';rr(560,1200-i*32,110,30,6);c.fill();c.fillStyle='rgba(235,240,245,.85)';rr(564,1203-i*32,102,24,5);c.fill();c.fillStyle='#4f7a3a';c.fillRect(574,1208-i*32,30,12);c.fillStyle='#e8d39a';c.fillRect(610,1208-i*32,44,12)})}});
 divider();
 const n=Math.round(31*eio(seg(u,.3,3.4)));scoreboard(u,'FEBRUARY','0 WORKOUTS',`${n} WORKOUTS`,{size:66})}

// B5 THE CHANGE SHOWS
function b5(u){envLounge(u,{door:1});const c=C();
 const crowd=[[200,0],[330,2],[460,1]];
 crowd.forEach(([x,i],j)=>{const J=Fr(i,{x,y:FL+20,s:1.0,f:1,pose:Pz({hd:-.05,lean:-.05+(u>2?.06:0),aF:u>2?[.6,1.9]:[.1,.2],aB:u>2?[-.3,.6]:[-.1,.2]}),mood:u<1.2?'shock':'angry',t:u});eye(x,J.head[1]-80,.65,1,eo(seg(u,.6+j*.12,.8+j*.12))*(1-seg(u,2.0,2.3)))});
 const Jr=R({x:600,y:FL+20,s:1.05,f:1,pose:Pz({lean:-.04,hd:.05,aF:[1.2,2.2],aB:[1.0,2.3]}),mood:'angry',t:u});
 S(()=>{c.globalCompositeOperation='screen';c.globalAlpha=.25*eo(seg(u,1.5,2.5));c.fillStyle=rg(400,1200,0,380,[[0,'rgba(212,34,63,.7)'],[1,'rgba(212,34,63,0)']]);c.fillRect(0,800,900,700)});
 const wx=lerp(1010,850,eio(seg(u,0,1.3)));St({x:wx,y:FL+30,s:1.2,f:-1,pose:u<1.3?walkP(u*7):TALL,mood:'calm',t:u,glow:1.5});
 say(u,1.5,220,1010,'HE CHANGED.',{col:CRL,tx:-10},1.3);say(u,2.3,400,960,'WHO DOES HE THINK HE IS?',{col:CRL,tx:-20},1.4);say(u,3.1,300,1040,'PROBABLY STEROIDS.',{col:CRL,tx:10},1.6);
 tag(600,FL+90,'REACTIVE',CRL,eo(seg(u,.3,.6)));tag(850,FL+90,'STEADY','#fff',eo(seg(u,.8,1.1)));
 scoreboard(u,'MONTH SIX','JEALOUS','UNBOTHERED',{size:70})}

// B6 DARK TRUTH
function clapper(x,u,i,crossed){const sp=Math.sin(u*16+i);return Fr(i%3,{x,y:FL+10,s:.9,f:x<540?1:-1,pose:crossed?Pz({hd:.1,aF:[1.15,2.2],aB:[1.0,2.3]}):Pz({hd:-.1,aF:[1.0+sp*.25,1.4],aB:[.9-sp*.25,1.5]}),mood:crossed?'angry':'smile',t:u})}
function b6(u){stage(u,[[540,1,'#ffffff']]);const c=C();const rise=eio(seg(u,1.2,2.2));const cross=u>1.4;
 S(()=>{c.fillStyle='#0a0a0c';c.fillRect(440,FL-rise*130,200,rise*130+6);c.fillStyle='#1d1d22';c.fillRect(446,FL-rise*130+6,188,rise*130);c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=2;c.strokeRect(446,FL-rise*130+6,188,rise*130)});
 St({x:540,y:FL-rise*130,s:1.15,f:1,pose:TALL,mood:'calm',t:u,glow:1+rise});
 [130,250,370,710,830,950].forEach((x,i)=>{clapper(x,u,i,cross&&seg(u,1.4+i*.06,1.6+i*.06)>.5)});
 S(()=>{const g=eo(seg(u,1.6,2.6));c.globalAlpha=.4*g;c.fillStyle='rgba(212,34,63,.25)';c.fillRect(0,1200,W,400)});
 title2(u,.1,'DARK TRUTH',null,520);title2(u,.6,'They clap until you ','surpass them.',632)}

// B7 THE QUESTION
function b7(u){const c=C();envDawn(u,0);c.fillStyle='rgba(6,8,16,.55)';c.fillRect(0,0,W,H);
 S(()=>{c.fillStyle='#0a0a0c';c.fillRect(60,860,300,FL-860);c.fillStyle='#16151a';c.fillRect(66,866,288,FL-866);c.fillStyle='#fff3da';c.shadowColor=WARM;c.shadowBlur=30;c.fillRect(100,890,220,40);c.shadowBlur=0;txt('GYM',210,910,'900 26px Black','#0a0a0c',{ls:8});c.fillStyle='rgba(255,230,190,.25)';c.fillRect(110,980,200,FL-980);c.strokeStyle='#0a0a0c';c.lineWidth=6;c.strokeRect(110,980,200,FL-980)});
 R({x:430,y:FL,s:1.15,f:1,pose:u<2?Pz({lean:.05,hd:-.05,aF:[.9,.7],aB:[-.2,.4]}):Pz({hd:.1,aF:[.1,.2],aB:[-.1,.2]}),mood:u<2.2?'shock':'sad',t:u});
 const pt=eo(seg(u,2.3,2.7));St({x:690,y:FL,s:1.2,f:-1,pose:lpz(TALL,Pz({hd:-.05,aF:[2.2,1.6],aB:[-.1,.2]}),pt),mood:u<2.3?'calm':'smirk',t:u,backProp:J=>S(()=>{const [x,y]=J.handB;c.fillStyle='#0a0a0c';rr(x-34,y+4,68,38,12);c.fill();c.fillStyle='#2b2c33';rr(x-30,y+8,60,30,10);c.fill();c.fillStyle=CR;c.fillRect(x-30,y+18,60,4)})});
 say(u,.3,380,1000,"WHY DIDN'T YOU TELL ANYONE?",{col:'#fff',tx:20},1.9);say(u,2.4,720,980,'I DID. JUST NOT WITH WORDS.',{tx:-40,tdx:-8},2.1);
 scoreboard(u,'THE RESULT','TALKED','SHOWED')}

// B8 PROOF MONTAGE
function stat(u,label,val,x,y){txt(label,x,y-60,'500 22px Lab','rgba(255,255,255,.7)',{ls:8});txt(val,x,y,'900 92px Black','#fff',{glow:24,gc:'rgba(255,255,255,.4)'})}
function b8(u){const c=C();const seg4=Math.min(3,Math.floor(u/1.1)),v=u-seg4*1.1;
 if(seg4==0){envDesk(u);c.fillStyle='#0a0a0c';c.fillRect(640,1290,110,18);St({x:690,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.14,hd:.2,aF:[1.05,.75],aB:[.95,.85]}),mood:'calm',t:u});stat(u,'SAVED',`$${Math.round(8400*eio(seg(v,0,.9))).toLocaleString('en-US')}`,540,860)}
 else if(seg4==1){envGym(u);const lift=eio(seg(v,0,.6));St({x:540,y:FL,s:1.2,f:1,pose:lpz(POSES.deadliftDown,POSES.deadliftUp,lift),mood:'angry',t:u});
  S(()=>{c.strokeStyle='#0a0a0c';c.lineWidth=12;c.lineCap='round';const by=lerp(1390,1250,lift);c.beginPath();c.moveTo(240,by);c.lineTo(840,by);c.stroke();c.strokeStyle='#b9bcc5';c.lineWidth=6;c.stroke();[-1,1].forEach(sd=>{for(let i=0;i<3;i++){const px=540+sd*(232+i*22);c.fillStyle='#0a0a0c';rr(px-11,by-66+i*8,22,132-i*16,6);c.fill();c.fillStyle=i==0?'#3a1018':'#26272d';rr(px-7,by-62+i*8,14,124-i*16,4);c.fill()}})});stat(u,'DEADLIFT',`${Math.round(180*eio(seg(v,0,.9)))} KG`,540,860)}
 else if(seg4==2){stage(u,[[540,1,'#ffffff']]);St({x:540,y:FL,s:1.2,f:1,pose:Pz({...SIT,lean:.1,hd:.4,aF:[.9,1.3],aB:[.8,1.3]}),noShadow:true,mood:'calm',t:u,y:sitY(1.2)});S(()=>{c.fillStyle='#0a0a0c';c.fillRect(470,1305,140,16)});
  for(let i=0;i<14;i++){const k=eo(seg(v,i*.05,i*.05+.2));if(k>0)S(()=>{c.globalAlpha=k;c.fillStyle='#0a0a0c';c.fillRect(760,1410-i*22,150,20);c.fillStyle=['#5a4048','#3a4a5a','#6b5a3a','#2f2f37'][i%4];c.fillRect(764,1412-i*22,142,16)})}stat(u,'BOOKS READ','14',540,860)}
 else{const hi=Math.min(1,v/.3);envDawn(u,u*300);St({x:540,y:FL,s:1.2,f:1,pose:Pz({lean:-.05,hd:-.2,aF:[-2.6,.1],aB:[2.6,-.1]}),mood:'smile',t:u,glow:1.5});stat(u,'FIGHT RECORD','3–0',540,860)}
 S(()=>{const k=1-seg(v,0,.12);if(k>0){c.fillStyle=`rgba(255,255,255,${k*.35})`;c.fillRect(0,0,W,H)}})}

// B9 OUTRO
function b9(u){stage(u,[[330,.4,'#ff8a9c'],[750,1,'#ffffff']]);
 R({x:330,y:FL,s:1.2,f:1,pose:Pz({lean:.1,hd:.5,aF:[.55,1.55],aB:[.45,1.6]}),mood:'sad',t:u,frontProp:J=>phone(J,.8)});
 St({x:750,y:FL,s:1.25,f:-1,pose:TALL,mood:'calm',t:u,glow:1.3});
 tag(330,FL+70,'REACTIVE',CRL);tag(750,FL+70,'STEADY','#fff');
 title2(u,.1,'MOVE IN SILENCE.',null,520);title2(u,.8,'Let your results make the ','noise.',632)}

export const VIDEO_B=makeTimeline([
 {fn:b1,dur:3.0,cam:camPush(1,1.06)},
 {fn:b2,dur:5.5,cam:camPush(1.0,1.04),fadeIn:.12},
 {fn:b3,dur:3.2,cam:camPush(1,1.08)},
 {fn:b4,dur:4.0,cam:camPush(1.03,1.0)},
 {fn:b5,dur:5.0,cam:camPush(1,1.06,0,0,0,-15)},
 {fn:b6,dur:3.0,cam:camPush(1,1.05),fadeIn:.12},
 {fn:b7,dur:4.5,cam:camPush(1.02,1.07)},
 {fn:b8,dur:4.4,cam:camPush(1,1.04)},
 {fn:b9,dur:4.0,cam:camPush(1,1.05),fadeIn:.2},
 {fn:endCard,dur:3.6,cam:()=>[1,0,0],fadeIn:.2},
]);
