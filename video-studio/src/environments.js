// Reusable environments. Coordinates use the 1080-wide design space (floor ≈ y 1420);
// the canvas component shifts the view so the action sits inside the 1080×1440 frame.
import {getCtx,S,A,rr,lg,rg,rgba,sh,rng,lerp,seg,eo,txt,dust,stage,bedroom,bed,clock3,ringBG,rain,WARM,CR,CRL,W,H} from './engine/lib.js';
const C=()=>getCtx();

export function envVoid(u,lights=[[330,1,'#ff8a9c'],[750,1,'#ffffff']]){stage(u,lights)}

export function envBedroom(u,time='6:00'){const ctx=C();ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);bedroom(0,W,true,u);bed(130,560);clock3(820,1250,u,time)}

export function envBathroom(u){const ctx=C();ctx.fillStyle='#050506';ctx.fillRect(0,0,W,H);
 [[0,'#0b0e14','#141a24','rgba(150,175,255,'],[542,'#15110d','#211a13','rgba(255,205,150,']].forEach(([x0,c1,c2,light],side)=>S(()=>{
  ctx.beginPath();ctx.rect(x0,700,538,980);ctx.clip();
  ctx.fillStyle=lg(0,700,0,1420,[[0,c1],[1,c2]]);ctx.fillRect(x0,700,538,720);
  ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=2;for(let y=720;y<1420;y+=56){ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+538,y);ctx.stroke()}for(let x=x0+20;x<x0+538;x+=56){ctx.beginPath();ctx.moveTo(x,700);ctx.lineTo(x,1420);ctx.stroke()}
  ctx.fillStyle=lg(0,1420,0,1680,[[0,side?'#241d16':'#161a22'],[1,'#060607']]);ctx.fillRect(x0,1420,538,260);
  const mx=x0+120,my=800,mw=300,mh=330;
  ctx.fillStyle='#0a0a0c';rr(mx-12,my-12,mw+24,mh+24,20);ctx.fill();ctx.fillStyle=lg(mx,my,mx+mw,my+mh,[[0,side?'#3a3128':'#232a36'],[.5,side?'#2a231c':'#1a1f29'],[1,side?'#4a3d30':'#2c3442']]);rr(mx,my,mw,mh,12);ctx.fill();
  ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba(255,255,255,.07)';ctx.beginPath();ctx.moveTo(mx+40,my);ctx.lineTo(mx+110,my);ctx.lineTo(mx+20,my+mh);ctx.lineTo(mx-50,my+mh);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#fff';ctx.shadowColor=side?WARM:'#bcd0ff';ctx.shadowBlur=30;rr(mx+40,my-50,mw-80,12,6);ctx.fill();ctx.shadowBlur=0;
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,my-40,0,1420,[[0,light+'.22)'],[1,light+'0)']]);ctx.beginPath();ctx.moveTo(mx+40,my-40);ctx.lineTo(mx+mw-40,my-40);ctx.lineTo(mx+mw+80,1420);ctx.lineTo(mx-80,1420);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#0a0a0c';ctx.fillRect(mx-40,1220,mw+80,26);ctx.fillStyle=side?'#cdbfa8':'#9aa3b5';ctx.fillRect(mx-36,1222,mw+72,14);ctx.fillStyle='#0a0a0c';ctx.fillRect(mx-20,1246,mw+40,170);ctx.fillStyle='#1b1a1e';ctx.fillRect(mx-14,1250,mw+28,160);
  ctx.strokeStyle='#0a0a0c';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(mx+mw/2,1222);ctx.lineTo(mx+mw/2,1190);ctx.lineTo(mx+mw/2+30,1190);ctx.stroke();ctx.strokeStyle='#c9ccd4';ctx.lineWidth=4;ctx.stroke()}));
 S(()=>{ctx.fillStyle='#050506';ctx.fillRect(534,700,12,980);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(546,700,2,980)})}

export function envLounge(u,o={}){const ctx=C();const FL=1420;ctx.fillStyle='#050506';ctx.fillRect(0,0,W,H);
 S(()=>{ctx.fillStyle=lg(0,700,0,FL,[[0,'#0f0d10'],[1,'#1a1619']]);ctx.fillRect(0,700,W,FL-700);
  ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=2;for(let x=40;x<W;x+=120){ctx.beginPath();ctx.moveTo(x,700);ctx.lineTo(x,FL);ctx.stroke()}
  // frames on wall
  [[300,860,120,90],[450,840,90,120],[580,870,140,80]].forEach(([x,y,w,h],i)=>{ctx.fillStyle='#0a0a0c';ctx.fillRect(x-6,y-6,w+12,h+12);ctx.fillStyle=['#2a2328','#232a2e','#2e2a24'][i];ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x+w*.4,y+h*.4);ctx.lineTo(x+w*.7,y+h*.7);ctx.lineTo(x+w,y+h*.3);ctx.lineTo(x+w,y+h);ctx.fill()});
  // doorway right
  const dl=o.door||0;ctx.fillStyle='#08070a';ctx.fillRect(900,880,150,FL-880);ctx.fillStyle=`rgba(255,246,230,${.92*dl})`;ctx.fillRect(912,894,126,FL-894);
  if(dl>0){ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(1040,0,500,0,[[0,`rgba(255,240,215,${.35*dl})`],[1,'rgba(255,240,215,0)']]);ctx.beginPath();ctx.moveTo(912,FL);ctx.lineTo(1038,FL);ctx.lineTo(1080,FL+200);ctx.lineTo(560,FL+200);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over'}
  ctx.strokeStyle='#2a262c';ctx.lineWidth=6;ctx.strokeRect(906,888,138,FL-888);
  // floor + rug
  ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#211b18'],[1,'#080706']]);ctx.fillRect(0,FL,W,260);ctx.fillStyle='#2a1a1f';ctx.beginPath();ctx.ellipse(540,FL+70,380,60,0,0,7);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(540,FL+70,350,50,0,0,7);ctx.stroke();
  // floor lamp (warm, right)
  ctx.fillStyle='#0a0a0c';ctx.fillRect(838,1000,8,FL-1000);ctx.beginPath();ctx.moveTo(806,960);ctx.lineTo(878,960);ctx.lineTo(864,1004);ctx.lineTo(820,1004);ctx.closePath();ctx.fill();ctx.fillStyle='#e8c99a';ctx.shadowColor=WARM;ctx.shadowBlur=30;ctx.beginPath();ctx.moveTo(812,964);ctx.lineTo(872,964);ctx.lineTo(860,1000);ctx.lineTo(824,1000);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(842,1040,0,360,[[0,rgba(WARM,.22)],[1,rgba(WARM,0)]]);ctx.fillRect(480,700,600,800);
  // TV glow left
  const fl=.6+.4*Math.sin(u*9)*Math.sin(u*3.7);ctx.fillStyle=rg(0,1100,0,560,[[0,`rgba(90,120,255,${.22*fl+.08})`],[1,'rgba(90,120,255,0)']]);ctx.fillRect(0,700,700,900);ctx.globalCompositeOperation='source-over';
  // couch
  ctx.fillStyle='#0a0a0c';rr(176,1150,560,210,34);ctx.fill();ctx.fillStyle=lg(0,1154,0,1356,[[0,'#3d3238'],[1,'#261f24']]);rr(180,1154,552,202,32);ctx.fill();
  ctx.fillStyle='#0a0a0c';rr(150,1250,612,126,26);ctx.fill();ctx.fillStyle=lg(0,1254,0,1372,[[0,'#4a3d44'],[1,'#2c2429']]);rr(154,1254,604,118,24);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.07)';[200,380,560].forEach(x=>{rr(x,1166,160,62,20);ctx.fill()});
  ctx.fillStyle='#0a0a0c';ctx.fillRect(180,1372,16,48);ctx.fillRect(716,1372,16,48);
  if(o.trap){ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(456,1300,0,360,[[0,`rgba(212,34,63,${.35*o.trap})`],[1,'rgba(212,34,63,0)']]);ctx.fillRect(100,1000,720,500);ctx.globalCompositeOperation='source-over'}
  // coffee table
  ctx.fillStyle='#0a0a0c';ctx.fillRect(330,1430,300,16);ctx.fillRect(344,1446,10,40);ctx.fillRect(606,1446,10,40);ctx.fillStyle='#3a2f28';ctx.fillRect(334,1432,292,10);
  [[370,'#3b5a3a'],[396,'#5a3a2a'],[560,'#2f3a52']].forEach(([x,c])=>{ctx.fillStyle='#0a0a0c';rr(x-9,1372,18,60,5);ctx.fill();ctx.fillStyle=c;rr(x-6,1376,12,54,4);ctx.fill()});
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.ellipse(480,1426,46,14,0,0,7);ctx.fill();ctx.fillStyle='#c9a35a';[466,480,494].forEach(x=>{ctx.beginPath();ctx.arc(x,1418,8,0,7);ctx.fill()})});
 dust(150,760,780,640,30,u,.25,6)}

export function envGym(u){const ctx=C();const FL=1420;ctx.fillStyle='#040405';ctx.fillRect(0,0,W,H);
 S(()=>{ctx.fillStyle=lg(0,700,0,FL,[[0,'#0e0f12'],[1,'#17181c']]);ctx.fillRect(0,700,W,FL-700);
  for(let x=0;x<W;x+=180){ctx.fillStyle=x%360?'#121317':'#15161a';ctx.fillRect(x,700,178,FL-700)}
  // mirror strip
  ctx.fillStyle='#0a0a0c';ctx.fillRect(60,860,960,360);ctx.fillStyle=lg(0,866,0,1214,[[0,'#1d2028'],[1,'#121419']]);ctx.fillRect(66,866,948,348);ctx.globalCompositeOperation='screen';[[150,70],[420,40],[760,90]].forEach(([x,w])=>{ctx.fillStyle='rgba(255,255,255,.05)';ctx.beginPath();ctx.moveTo(x,866);ctx.lineTo(x+w,866);ctx.lineTo(x+w-160,1214);ctx.lineTo(x-160,1214);ctx.closePath();ctx.fill()});ctx.globalCompositeOperation='source-over';
  // rack right
  ctx.fillStyle='#0a0a0c';[[800],[960]].forEach(([x])=>{ctx.fillRect(x,820,22,FL-820)});ctx.fillRect(800,820,182,18);ctx.fillStyle='#2a2b31';ctx.fillRect(805,826,8,FL-826);ctx.fillRect(965,826,8,FL-826);
  for(let i=0;i<4;i++){const y=1000+i*100;ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(900,y,40-i*4,0,7);ctx.fill();ctx.fillStyle='#24252b';ctx.beginPath();ctx.arc(900,y,34-i*4,0,7);ctx.fill();ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(900,y,6,0,7);ctx.fill()}
  // dumbbells left
  ctx.fillStyle='#0a0a0c';ctx.fillRect(80,1300,220,14);ctx.fillRect(90,1314,10,106);ctx.fillRect(280,1314,10,106);for(let i=0;i<5;i++){const x=104+i*40;ctx.fillRect(x,1272,30,28);ctx.fillStyle='#2b2c32';ctx.fillRect(x+3,1276,24,20);ctx.fillStyle='#0a0a0c'}
  // floor
  ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#1a1b1f'],[1,'#060607']]);ctx.fillRect(0,FL,W,260);ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=2;for(let x=-100;x<1200;x+=110){ctx.beginPath();ctx.moveTo(x,FL);ctx.lineTo(x+(x-540)*.4,FL+260);ctx.stroke()}ctx.beginPath();ctx.moveTo(0,FL+60);ctx.lineTo(W,FL+60);ctx.stroke();
  // pendant lights
  [300,780].forEach(x=>{ctx.strokeStyle='#0a0a0c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,700);ctx.lineTo(x,760);ctx.stroke();ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(x-40,800);ctx.lineTo(x+40,800);ctx.lineTo(x+16,760);ctx.lineTo(x-16,760);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=26;ctx.fillRect(x-30,798,60,4);ctx.shadowBlur=0;
   ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,800,0,FL,[[0,'rgba(255,255,255,.2)'],[1,'rgba(255,255,255,.03)']]);ctx.beginPath();ctx.moveTo(x-34,800);ctx.lineTo(x+34,800);ctx.lineTo(x+240,FL);ctx.lineTo(x-240,FL);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over'})});
 dust(150,780,800,640,50,u,.45,11)}

export function barbell(x,y,bend=0){const ctx=C();S(()=>{ctx.strokeStyle='#0a0a0c';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-300,y+bend*.4);ctx.quadraticCurveTo(x,y-bend,x+300,y+bend*.4);ctx.stroke();ctx.strokeStyle='#b9bcc5';ctx.lineWidth=6;ctx.stroke();
 [-1,1].forEach(sd=>{for(let i=0;i<3;i++){const px=x+sd*(232+i*22),py=y+bend*.35;ctx.fillStyle='#0a0a0c';rr(px-11,py-66+i*8,22,132-i*16,6);ctx.fill();ctx.fillStyle=i==0?'#3a1018':'#26272d';rr(px-7,py-62+i*8,14,124-i*16,4);ctx.fill()}})})}

export function envDawn(u,scroll=0){const ctx=C();const FL=1420;ctx.fillStyle=lg(0,0,0,H,[[0,'#040406'],[.38,'#0f121a'],[.56,'#2b3040'],[.66,'#5a4250'],[.7,'#1a1518'],[1,'#050506']]);ctx.fillRect(0,0,W,H);
 S(()=>{ctx.fillStyle='#d6cfd0';ctx.shadowColor='#c9a0a8';ctx.shadowBlur=50;ctx.beginPath();ctx.arc(700,1330,60,0,7);ctx.fill();ctx.shadowBlur=0;
  [[.2,'#14151c',300,31],[.5,'#0b0c10',200,32]].forEach(([sp,c,hh,seed])=>{const r=rng(seed);const off=(scroll*sp)%1600;ctx.fillStyle=c;for(let i=0;i<30;i++){const bw=60+r()*90,bh=hh*(.4+r()),bx=i*90-off;const X=((bx%1600)+1600)%1600-200;ctx.fillRect(X,1340-bh,bw,bh);if(sp>.3)for(let k=0;k<4;k++)if(r()<.3){ctx.fillStyle='rgba(255,214,150,.45)';ctx.fillRect(X+8+(k%2)*20,1340-bh+14+Math.floor(k/2)*24,6,9);ctx.fillStyle=c}}});
  ctx.fillStyle=lg(0,1340,0,H,[[0,'#17171c'],[1,'#050506']]);ctx.fillRect(0,1340,W,H-1340);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(0,1340,W,3);
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=4;for(let i=0;i<8;i++){const x=((i*180-scroll)%1440+1440)%1440-180;ctx.beginPath();ctx.moveTo(x,1490);ctx.lineTo(x+90,1490);ctx.stroke()}
  [200,760].forEach((x0,i)=>{const x=((x0-scroll*.9)%1300+1300)%1300-100;ctx.fillStyle='#0a0a0c';ctx.fillRect(x-5,900,10,FL-900);ctx.beginPath();ctx.moveTo(x,904);ctx.quadraticCurveTo(x,870,x+50,870);ctx.lineWidth=8;ctx.strokeStyle='#0a0a0c';ctx.stroke();ctx.fillStyle='#fff6e0';ctx.shadowColor=WARM;ctx.shadowBlur=24;ctx.beginPath();ctx.ellipse(x+56,878,20,6,0,0,7);ctx.fill();ctx.shadowBlur=0});
  ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(700,1330,0,700,[[0,'rgba(200,150,165,.2)'],[1,'rgba(200,150,165,0)']]);ctx.fillRect(0,700,W,1000)})}

export function envDesk(u){const ctx=C();const FL=1420;ctx.fillStyle='#040405';ctx.fillRect(0,0,W,H);
 S(()=>{ctx.fillStyle=lg(0,700,0,FL,[[0,'#0b0b0e'],[1,'#121216']]);ctx.fillRect(0,700,W,FL-700);
  // empty seats (tiers)
  for(let row=0;row<3;row++){const y=980+row*110,s=.75+row*.12;for(let i=0;i<7;i++){const x=70+i*84*s+row*-20;if(x>640)continue;ctx.fillStyle='#0a0a0c';rr(x,y,62*s,70*s,10);ctx.fill();ctx.fillStyle='#1d1c22';rr(x+4,y+4,54*s,46*s,8);ctx.fill();ctx.fillStyle='#16151a';ctx.fillRect(x+4,y+52*s,54*s,10*s)}}
  ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#16161a'],[1,'#050506']]);ctx.fillRect(0,FL,W,260);
  // desk + lamp + laptop
  ctx.fillStyle='#0a0a0c';ctx.fillRect(700,1236,330,22);ctx.fillRect(720,1256,16,FL-1256);ctx.fillRect(1000,1256,16,FL-1256);ctx.fillStyle='#4a3c2c';ctx.fillRect(702,1238,326,14);
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(800,1238);ctx.lineTo(950,1238);ctx.lineTo(966,1232);ctx.lineTo(796,1232);ctx.fill();ctx.save();ctx.translate(930,1232);ctx.rotate(-.18);ctx.fillStyle='#0a0a0c';rr(-6,-118,16,122,4);ctx.fill();ctx.fillStyle='#d8dde8';rr(-2,-112,8,106,2);ctx.fill();ctx.restore();
  ctx.strokeStyle='#0a0a0c';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(1010,1238);ctx.lineTo(1020,1120);ctx.lineTo(965,1085);ctx.stroke();ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(985,1066);ctx.lineTo(935,1104);ctx.lineTo(965,1116);ctx.closePath();ctx.fill();
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,1100,0,1300,[[0,rgba(WARM,.45)],[1,rgba(WARM,0)]]);ctx.beginPath();ctx.moveTo(950,1104);ctx.lineTo(966,1114);ctx.lineTo(1040,1262);ctx.lineTo(760,1262);ctx.closePath();ctx.fill();ctx.fillStyle=rg(880,1240,0,320,[[0,rgba(WARM,.22)],[1,rgba(WARM,0)]]);ctx.fillRect(560,960,520,520)});
 dust(600,1000,460,400,20,u,.3,13)}

export function envRing(u){ringBG(u)}
export {rain};
