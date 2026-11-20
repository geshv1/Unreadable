// VIDEO E — "Broke Habits vs Wealthy Habits"  (no narration · 3:4 · ~40 s)
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,eback,clamp,rng,W,H,CR,CRL,WARM,dust,stage,person,Pz,lpz,walkP,SIT,TALL,phone,rays} from '../engine/lib.js';
import {FIRST,SECOND,FRIENDS,POSES} from '../characters.js';
import {envLounge,envDesk} from '../environments.js';
import {kitchen} from './b_silence.js';
import {FL,scoreboard,pop,say,phoneFrame,tag,title2,divider,endCard,makeTimeline,camPush} from '../kit/kit.js';
const C=()=>getCtx();
const R=(o)=>person({...FIRST,...o});const St=(o)=>person({...SECOND,...o});const Fr=(i,o)=>person({...FRIENDS[i],...o});
const sitY=s=>1262+132*s;
const $=v=>'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function half(side,fn){const c=C();S(()=>{c.beginPath();c.rect(side?542:0,690,538,1000);c.clip();fn()})}
function bal(u,from,to,t0,t1=t0+.6){return lerp(from,to,eio(seg(u,t0,t1)))}
function money(u,t0,x,y,s,col=CRL){const k=seg(u,t0,t0+1.1);if(k<=0||k>=1)return;txt(s,x,y-k*90,'900 40px Black',rgba(col==CRL?'#ff4d6a':'#ffffff',1-k*k),{glow:16,gc:col==CRL?CR:'#fff'})}
function cafe(x0,u){const c=C();S(()=>{c.fillStyle=lg(0,690,0,FL,[[0,'#15100c'],[1,'#21180f']]);c.fillRect(x0,690,538,FL-690);
 c.fillStyle='#0a0a0c';c.fillRect(x0+40,760,300,170);c.fillStyle='#1d1712';c.fillRect(x0+46,766,288,158);['LATTE  6.90','FLAT WHITE  6.40','MATCHA  7.40','CROISSANT  5.20'].forEach((s,i)=>txt(s,x0+66,800+i*32,'700 17px Disp','rgba(255,235,205,.8)',{align:'left',ls:2}));
 c.fillStyle='#0a0a0c';c.fillRect(x0+260,1200,278,24);c.fillStyle='#6b4a32';c.fillRect(x0+262,1202,276,14);c.fillStyle='#2a1d14';c.fillRect(x0+270,1224,268,FL-1224);
 c.fillStyle='#0a0a0c';rr(x0+380,1110,110,92,8);c.fill();c.fillStyle='#b9bcc5';rr(x0+386,1116,98,80,6);c.fill();c.fillStyle='#0a0a0c';c.fillRect(x0+410,1180,14,22);c.fillRect(x0+450,1180,14,22);
 c.fillStyle=lg(0,FL,0,FL+270,[[0,'#241a12'],[1,'#070605']]);c.fillRect(x0,FL,538,270);
 c.globalCompositeOperation='screen';[x0+120,x0+300,x0+460].forEach(x=>{c.fillStyle=rg(x,740,0,200,[[0,rgba(WARM,.2)],[1,rgba(WARM,0)]]);c.fillRect(x-200,690,400,500)})})}
function cardTap(J,u,t0){const c=C();const k=seg(u,t0-.2,t0+.6);if(k<=0||k>=1)return;S(()=>{const [x,y]=J.handF;c.translate(x+8,y-4);c.rotate(-.2);c.fillStyle='#0a0a0c';rr(-22,-14,44,28,4);c.fill();c.fillStyle=lg(-20,0,20,0,[[0,'#2a2a30'],[1,'#55555e']]);rr(-19,-11,38,22,3);c.fill();c.fillStyle=WARM;c.fillRect(-14,-5,8,6);
 if(u>t0){const p=seg(u,t0,t0+.5);c.strokeStyle=`rgba(150,255,170,${1-p})`;c.lineWidth=3;[0,1,2].forEach(i=>{c.beginPath();c.arc(26,0,8+i*8+p*10,-.6,.6);c.stroke()})}})}

// E1 HOOK
function e1(u){stage(u,[[330,1,'#ff8a9c'],[750,1,'#ffffff']]);const c=C();
 [[330,0],[750,1]].forEach(([x,sd])=>pop(u,.4+sd*.15,e=>S(()=>{c.translate(x,1000);c.scale(e,e);c.fillStyle='rgba(10,10,12,.9)';rr(-110,-36,220,72,16);c.fill();c.strokeStyle=sd?'rgba(255,255,255,.6)':rgba(CR,.8);c.lineWidth=2;rr(-110,-36,220,72,16);c.stroke();txt('$2,000',0,2,'900 40px Black',sd?'#fff':CRL,{glow:12,gc:sd?'#fff':CR})})));
 R({x:330,y:FL,s:1.2,f:1,pose:Pz({hd:-.1,aF:[.3,.6],aB:[-.2,.5]}),mood:'smile',t:u});St({x:750,y:FL,s:1.2,f:-1,pose:TALL,mood:'calm',t:u});
 tag(330,FL+70,'REACTIVE',CRL);tag(750,FL+70,'STEADY','#fff');
 title2(u,.1,'SAME SALARY.',null,520);title2(u,.8,'Different ','habits.',632)}
// E2 COFFEE
function e2(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{cafe(0,u);const J=R({x:180,y:FL,s:1.1,f:1,pose:Pz({lean:.06,hd:-.05,aF:[u>1.0&&u<1.8?1.4:.4,.3],aB:[-.1,.3]}),mood:'smile',t:u});cardTap(J,u,1.3);
  if(u>2.0)S(()=>{const [x,y]=J.handF;c.fillStyle='#0a0a0c';rr(x-12,y-34,26,38,4);c.fill();c.fillStyle='#e9e2d6';rr(x-9,y-31,20,32,3);c.fill();c.fillStyle='#5a3a2a';c.fillRect(x-9,y-20,20,6)});money(u,1.4,260,1000,'-$7.40')});
 half(1,()=>{kitchen(542,u);St({x:700,y:FL,s:1.1,f:1,pose:Pz({lean:.08,hd:.2,aF:[1.1,.6],aB:[.9,.7]}),mood:'calm',t:u});
  S(()=>{c.fillStyle='#0a0a0c';rr(800,1130,70,90,8);c.fill();c.fillStyle='#2b2c33';rr(806,1136,58,78,6);c.fill();const pour=seg(u,.8,2.4);if(pour>0&&pour<1){c.fillStyle='#4a2a1a';c.fillRect(832,1214,6,8)}c.fillStyle='#0a0a0c';rr(820,1200,36,24,4);c.fill();c.fillStyle='#e9e2d6';rr(823,1203,30,18,3);c.fill()});
  money(u,2.0,820,1000,'-$0.40','#fff')});
 divider();scoreboard(u,'7:40 AM · COFFEE',$(bal(u,2000,1992.6,1.4)),$(bal(u,2000,1999.6,2.0)),{size:66})}
// E3 LUNCH
function e3(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{c.translate(-170,0);envLounge(u,{door:eo(seg(u,2.0,2.4))*.8});c.translate(170,0);
  const go=eio(seg(u,1.9,2.8));R({x:lerp(286,580,go),y:go>0?lerp(sitY(1.1),FL+20,Math.min(1,go*3)):sitY(1.1),s:1.1,f:1,noShadow:go<.3,pose:go>0?walkP(u*7):Pz({...SIT,lean:.1,hd:.45,aF:[.6,1.6],aB:[.5,1.6]}),mood:'smile',t:u,frontProp:J=>{if(go<.1)phone(J,1.1)}});
  phoneFrame(70,720,300,330,()=>{const x0=70,y0=720;c.fillStyle='#d9381e';c.fillRect(x0,y0,300,64);txt('FOOD NOW',x0+150,y0+40,'900 20px Black','#fff',{ls:3});
   [['Burger combo','$18.90'],['Delivery fee','$4.99'],['Service fee','$2.10'],['Tip','$2.00']].forEach(([a,b],i)=>{txt(a,x0+20,y0+100+i*34,'600 18px Disp','#fff',{align:'left'});txt(b,x0+280,y0+100+i*34,'700 18px Disp','#fff',{align:'right'})});
   c.fillStyle='rgba(255,255,255,.2)';c.fillRect(x0+20,y0+232,260,2);txt('TOTAL',x0+20,y0+256,'800 20px Disp','#fff',{align:'left'});txt('$27.99',x0+280,y0+256,'900 22px Black',CRL,{align:'right'});
   const k=seg(u,.9,1.1);c.fillStyle=k>0?'#2e9d55':'#d9381e';rr(x0+20,y0+280,260,40,20);c.fill();txt(k>0?'ORDERED ✓':'ORDER NOW',x0+150,y0+301,'800 18px Disp','#fff',{ls:2})});
  money(u,1.0,300,1100,'-$27.99')});
 half(1,()=>{c.translate(-60,0);envDesk(u);c.translate(60,0);c.fillStyle='#0a0a0c';c.fillRect(640,1290,110,18);
  St({x:690,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.18,hd:.35,aF:[1.0+Math.sin(u*6)*.08,.9],aB:[.9,.85]}),mood:'calm',t:u});
  S(()=>{c.fillStyle='#0a0a0c';rr(790,1200,110,40,8);c.fill();c.fillStyle='rgba(235,240,245,.9)';rr(794,1204,102,32,6);c.fill();c.fillStyle='#4f7a3a';c.fillRect(804,1210,34,18);c.fillStyle='#e8d39a';c.fillRect(842,1210,46,18)});
  money(u,1.0,820,1000,'-$3.00','#fff')});
 divider();scoreboard(u,'12:30 PM · LUNCH',$(bal(u,1992.6,1964.61,1.0)),$(bal(u,1999.6,1996.6,1.0)),{size:66})}
// E4 THE SALE (dark pattern)
function e4(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{c.translate(-170,0);envLounge(u,{door:0,trap:.5});c.translate(170,0);R({x:286,y:sitY(1.1),s:1.1,f:1,noShadow:true,pose:Pz({...SIT,lean:.15,hd:.45,aF:[.6,1.6],aB:[.5,1.6]}),mood:u<1.4?'shock':'smile',t:u,frontProp:J=>phone(J,1.2)});
  phoneFrame(60,712,320,380,()=>{const x0=60,y0=712;c.fillStyle='#0f0f12';c.fillRect(x0,y0,320,380);c.fillStyle=CR;c.fillRect(x0,y0+40,320,56);txt('FLASH SALE -40%',x0+160,y0+68,'900 22px Black','#fff',{ls:1});
   const left=Math.max(0,47*3600+59*60+59-Math.floor(u*137));txt(`ENDS IN ${Math.floor(left/3600)}:${String(Math.floor(left%3600/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`,x0+160,y0+118,'800 16px Disp',CRL,{ls:2});
   S(()=>{c.translate(x0+160,y0+190);c.fillStyle='#e9e9ee';c.beginPath();c.moveTo(-70,20);c.lineTo(-70,-14);c.quadraticCurveTo(-50,-32,-20,-18);c.lineTo(30,0);c.quadraticCurveTo(70,4,70,20);c.closePath();c.fill();c.fillStyle='#fff';c.fillRect(-70,14,140,8);c.strokeStyle=CR;c.lineWidth=5;c.beginPath();c.moveTo(-40,-4);c.quadraticCurveTo(0,10,40,0);c.stroke()});
   txt('$300',x0+110,y0+258,'700 20px Disp','rgba(255,255,255,.4)');c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;c.beginPath();c.moveTo(x0+85,y0+258);c.lineTo(x0+135,y0+258);c.stroke();txt('$180',x0+200,y0+258,'900 30px Black','#fff');
   txt('ONLY 2 LEFT IN YOUR SIZE',x0+160,y0+292,'700 14px Disp',CRL,{ls:1});const k=seg(u,1.8,2.0);c.fillStyle=k>0?'#2e9d55':'#fff';rr(x0+20,y0+316,280,46,23);c.fill();txt(k>0?'PURCHASED ✓':'PAY IN 4 · $45 TODAY',x0+160,y0+340,'800 17px Disp',k>0?'#fff':'#111',{ls:1})});
  money(u,1.9,300,1150,'-$180.00')});
 half(1,()=>{c.translate(420,0);c.translate(-420,0);c.fillStyle=lg(0,690,0,FL,[[0,'#0c0f15'],[1,'#151a22']]);c.fillRect(542,690,538,FL-690);c.fillStyle=lg(0,FL,0,FL+270,[[0,'#181b22'],[1,'#060607']]);c.fillRect(542,FL,538,270);
  St({x:690,y:FL,s:1.1,f:1,pose:Pz({lean:.1,hd:.45,aF:[.55,1.55],aB:[.45,1.6]}),mood:u<1.2?'neutral':'smirk',t:u,frontProp:J=>phone(J,1)});
  phoneFrame(760,712,280,380,()=>{const x0=760,y0=712;c.fillStyle='#0f1116';c.fillRect(x0,y0,280,380);
   const sw=eio(seg(u,.9,1.3));S(()=>{c.translate(sw*320,0);c.globalAlpha=1-sw;c.fillStyle=CR;rr(x0+16,y0+50,248,70,14);c.fill();txt('FLASH SALE -40%',x0+140,y0+85,'900 18px Black','#fff')});
   if(u>1.4){c.fillStyle='#16241c';c.fillRect(x0,y0+140,280,240);txt('AUTO-INVEST',x0+140,y0+176,'800 18px Disp','#7be0a0',{ls:3});
    const k=eo(seg(u,1.8,2.4));txt('$50.00',x0+140,y0+230,'900 44px Black','#fff',{glow:10});c.strokeStyle='#7be0a0';c.lineWidth=3;c.beginPath();for(let i=0;i<=20*k;i++){const x=x0+30+i*11,y=y0+320-i*4-Math.sin(i*.9)*8;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
    txt('INDEX FUND · MONTHLY',x0+140,y0+350,'600 13px Disp','rgba(255,255,255,.6)',{ls:1})}});
  money(u,2.0,690,1100,'→ INVESTED','#fff')});
 divider();scoreboard(u,'3:15 PM · THE SALE',$(bal(u,1964.61,1784.61,1.9)),$(bal(u,1996.6,1946.6,2.0)),{size:66})}
// E5 DARK PATTERN
function e5(u){stage(u,[[540,1,'#ff8a9c']]);const c=C();
 const J=R({x:540,y:FL,s:1.2,f:1,pose:Pz({hd:.2,aF:[1.2,.4],aB:[-.2,.4]}),mood:'sad',t:u});
 for(let i=0;i<4;i++){const k=eo(seg(u,.3+i*.35,.6+i*.35));if(k<=0)continue;S(()=>{const x=J.handF[0]+40+i*70,y=J.handF[1]-10+Math.sin(i)*20;c.globalAlpha=k;c.translate(x,y);c.rotate(-.15+i*.1);c.fillStyle='#0a0a0c';rr(-44,-28,88,56,8);c.fill();c.fillStyle=lg(-40,0,40,0,[[0,'#3a1018'],[1,'#7a1726']]);rr(-40,-24,80,48,6);c.fill();txt(`${i+1}/4`,0,-6,'900 18px Black','#fff');txt('$45',0,14,'700 14px Disp','rgba(255,255,255,.75)')});
  if(i>0&&k>.5)S(()=>{c.strokeStyle=CRL;c.lineWidth=4;c.shadowColor=CR;c.shadowBlur=10;c.beginPath();c.moveTo(J.handF[0]+40+(i-1)*70+40,J.handF[1]-10);c.lineTo(J.handF[0]+40+i*70-40,J.handF[1]-10);c.stroke()})}
 title2(u,.1,'DARK PATTERN',null,520);title2(u,.6,'"Pay later" still means you ','pay.',632)}
// E6 8 PM
function e6(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 half(0,()=>{c.translate(-60,0);envLounge(u,{door:0});c.translate(60,0);[[150,0],[290,1]].forEach(([x,i])=>Fr(i,{x,y:FL+20,s:1.0,f:1,pose:Pz({lean:-.15,hd:-.3,aF:[1.9,.5],aB:[-.2,.4]}),mood:'smile',t:u}));
  const J=R({x:420,y:FL+20,s:1.05,f:-1,pose:Pz({lean:-.05,hd:-.2,aF:[2.3,.5],aB:[-.2,.4]}),mood:'smile',t:u});S(()=>{const [x,y]=J.handF;c.fillStyle='#0a0a0c';rr(x-10,y-34,22,36,4);c.fill();c.fillStyle='rgba(230,170,60,.9)';rr(x-7,y-24,16,24,3);c.fill()});
  money(u,1.1,300,1000,'-$64.00')});
 half(1,()=>{stage(u,[[810,1,'#ffffff']]);St({x:810,y:sitY(1.15),s:1.15,f:1,noShadow:true,pose:Pz({...SIT,lean:.05,hd:.35,aF:[1.15,1.2],aB:[1.0,1.3]}),mood:'calm',t:u,frontProp:J=>S(()=>{const [x,y]=J.handF;c.fillStyle='#0a0a0c';rr(x-4,y-36,64,46,4);c.fill();c.fillStyle='#e9e2d6';rr(x,y-32,28,38,2);c.fill();rr(x+30,y-32,26,38,2);c.fill()})});S(()=>{c.fillStyle='#0a0a0c';c.fillRect(740,1305,140,16)})});
 divider();say(u,.6,250,1020,'NEXT ROUND ON ME!',{col:CRL,tx:30},2.0);
 scoreboard(u,'8:00 PM',$(bal(u,1784.61,1720.61,1.1)),$(1946.6),{size:66})}
// E7 SUBSCRIPTIONS
function e7(u){const c=C();c.fillStyle='#000';c.fillRect(0,0,W,H);
 const list=[['STREAMING+','9.99'],['MUSIC PRO','10.99'],['CLOUD 2TB','9.99'],['GAME PASS','16.99'],['FITNESS APP','12.99'],['VPN','9.99']];
 half(0,()=>{c.fillStyle=lg(0,690,0,FL,[[0,'#0b0d13'],[1,'#121520']]);c.fillRect(0,690,538,1000);phoneFrame(70,720,400,500,()=>{const x0=70,y0=720;c.fillStyle='#14161c';c.fillRect(x0,y0,400,500);txt('RENEWED TONIGHT',x0+200,y0+50,'800 18px Disp','#fff',{ls:3});
  list.forEach(([n,p],i)=>{const k=eo(seg(u,.3+i*.32,.5+i*.32));if(k<=0)return;S(()=>{c.globalAlpha*=k;c.fillStyle='#1d2029';rr(x0+20,y0+80+i*62,360,52,12);c.fill();txt(n,x0+40,y0+106+i*62,'700 18px Disp','#fff',{align:'left'});txt('-$'+p,x0+360,y0+106+i*62,'800 18px Disp',CRL,{align:'right'})})})});
  money(u,2.3,270,1290,'-$71.94')});
 half(1,()=>{c.fillStyle=lg(0,690,0,FL,[[0,'#0c0f15'],[1,'#151a22']]);c.fillRect(542,690,538,1000);phoneFrame(612,720,400,500,()=>{const x0=612,y0=720;c.fillStyle='#14161c';c.fillRect(x0,y0,400,500);txt('SUBSCRIPTIONS',x0+200,y0+50,'800 18px Disp','#fff',{ls:3});
  [['STREAMING+','9.99',0],['GAME PASS','16.99',1],['VPN','9.99',1]].forEach(([n,p,cancel],i)=>{c.fillStyle='#1d2029';rr(x0+20,y0+80+i*62,360,52,12);c.fill();txt(n,x0+40,y0+106+i*62,'700 18px Disp','#fff',{align:'left'});
   if(cancel){const k=seg(u,.8+i*.6,1.0+i*.6);txt(k>0?'CANCELLED':'-$'+p,x0+360,y0+106+i*62,'800 16px Disp',k>0?'#7be0a0':'#fff',{align:'right'});if(k>0){c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=2;c.beginPath();c.moveTo(x0+40,y0+106+i*62);c.lineTo(x0+180,y0+106+i*62);c.stroke()}}
   else txt('KEEP',x0+360,y0+106+i*62,'800 16px Disp','#fff',{align:'right'})});
  txt('+$26.98 / MONTH',x0+200,y0+330,'900 30px Black','#7be0a0',{glow:10})})});
 divider();scoreboard(u,'11:00 PM · AUTO-RENEW',$(bal(u,1720.61,1648.67,2.3)),$(1946.6),{size:66})}
// E8 10 YEARS
function e8(u){const c=C();c.fillStyle='#030304';c.fillRect(0,0,W,H);const x0=150,x1=930,y0=1380,y1=760;
 S(()=>{c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=2.5;c.beginPath();c.moveTo(x0,y1-20);c.lineTo(x0,y0);c.lineTo(x1+20,y0);c.stroke();for(let i=0;i<=10;i++){c.beginPath();c.moveTo(x0+(x1-x0)*i/10,y0);c.lineTo(x0+(x1-x0)*i/10,y0+8);c.stroke()}});
 txt('YEARS',540,y0+40,'500 16px Lab','rgba(255,255,255,.6)',{ls:6});
 const k=eio(seg(u,.2,3.0));const N=120;const fv=m=>350*((Math.pow(1+.08/12,m)-1)/(.08/12));
 S(()=>{c.strokeStyle='#fff';c.lineWidth=5;c.shadowColor='#fff';c.shadowBlur=14;c.beginPath();for(let i=0;i<=N*k;i++){const x=lerp(x0,x1,i/N),y=y0-(y0-y1)*fv(i)/fv(120)*.95;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()});
 S(()=>{c.strokeStyle=CRL;c.lineWidth=5;c.shadowColor=CR;c.shadowBlur=14;c.beginPath();for(let i=0;i<=N*k;i++){const x=lerp(x0,x1,i/N),y=y0-2;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()});
 const inv=Math.round(fv(120*k)),sp=Math.round(350*120*k);
 txt('+$'+inv.toLocaleString('en-US'),x1-120,y1-10,'900 50px Black','#fff',{glow:18});txt('INVESTED · STEADY',x1-120,y1+30,'500 16px Lab','rgba(255,255,255,.7)',{ls:4});
 txt('-$'+sp.toLocaleString('en-US'),x1-120,y0-60,'900 40px Black',CRL,{glow:14,gc:CR});txt('SPENT · REACTIVE',x1-120,y0-28,'500 16px Lab','rgba(255,255,255,.6)',{ls:4});
 txt('$350/MONTH · 8%/YR AVG',540,y0+80,'500 14px Lab','rgba(255,255,255,.45)',{ls:4});
 title2(u,.1,'SAME $350 A MONTH. 10 YEARS.',null,520);title2(u,1.0,'Small leaks sink ','big ships.',632)}
// E9 OUTRO
function e9(u){stage(u,[[330,.5,'#ff8a9c'],[750,1,'#ffffff']]);const c=C();
 R({x:330,y:FL,s:1.2,f:1,pose:Pz({lean:.1,hd:.4,aF:[.8,1.4],aB:[.1,.3]}),mood:'sad',t:u,frontProp:J=>S(()=>{const [x,y]=J.handF;c.fillStyle='#0a0a0c';rr(x-20,y-12,44,30,5);c.fill();c.fillStyle='#3a2a20';rr(x-17,y-9,38,24,4);c.fill()}),backProp:J=>S(()=>{const [x,y]=J.handB;c.fillStyle='#0a0a0c';rr(x-26,y,52,60,4);c.fill();c.fillStyle='#e8e4dc';rr(x-23,y+3,46,54,3);c.fill()})});
 St({x:750,y:FL,s:1.25,f:-1,pose:TALL,mood:'calm',t:u,glow:1.3});tag(330,FL+70,'REACTIVE',CRL);tag(750,FL+70,'STEADY','#fff');
 title2(u,.1,"WEALTH ISN'T WHAT YOU EARN.",null,520);title2(u,.8,"It's what you ",'keep.',632)}

export const VIDEO_E=makeTimeline([
 {fn:e1,dur:3.0,cam:camPush(1,1.06)},
 {fn:e2,dur:4.0,cam:camPush(1.0,1.04),fadeIn:.12},
 {fn:e3,dur:4.0,cam:camPush(1.03,1.0)},
 {fn:e4,dur:5.0,cam:camPush(1,1.04)},
 {fn:e5,dur:3.2,cam:camPush(1,1.07),fadeIn:.12},
 {fn:e6,dur:4.5,cam:camPush(1.03,1.0)},
 {fn:e7,dur:3.5,cam:camPush(1,1.04)},
 {fn:e8,dur:5.5,cam:camPush(1,1.05),fadeIn:.12},
 {fn:e9,dur:4.0,cam:camPush(1,1.05),fadeIn:.15},
 {fn:endCard,dur:3.6,cam:()=>[1,0,0],fadeIn:.2},
]);
