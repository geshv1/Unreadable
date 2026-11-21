// Canvas set library for this episode — reuses the series' environments (office, ring, street, spotlights, doorway).
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,rng,W,H,CR,CRL,WARM,stage,ringBG,rain,splashes,dust,rays} from '../engine/lib.js';
import {envDawn} from '../environments.js';
const C=()=>getCtx();const FL=1420;
export function spotlights(t,lights){stage(t,lights)}
export function doorway(t,k){const c=C();S(()=>{c.globalCompositeOperation='screen';c.fillStyle=rg(860,1200,0,460,[[0,`rgba(255,240,215,${.5*k})`],[1,'rgba(255,240,215,0)']]);c.fillRect(380,700,700,800);c.globalCompositeOperation='source-over';
 c.fillStyle='#08070a';c.fillRect(788,960,148,460);c.fillStyle=`rgba(255,246,230,${.92*k})`;c.fillRect(800,972,124,448);c.strokeStyle='#2a262c';c.lineWidth=5;c.strokeRect(794,966,136,454)});if(k>0)rays(862,1180,-Math.PI/2,.8,600,.05*k,7,6)}
function officeHalf(x0,cool){const c=C();S(()=>{c.beginPath();c.rect(x0,690,538,1000);c.clip();
 c.fillStyle=lg(0,690,0,FL,[[0,cool?'#0c0f15':'#110e0c'],[1,cool?'#151a22':'#1c1714']]);c.fillRect(x0,690,538,FL-690);
 c.fillStyle='#07080b';c.fillRect(x0+120,760,300,230);const r=rng(x0+3);for(let i=0;i<10;i++){const bx=x0+124+i*30,bh=60+r()*140;c.fillStyle='#10131b';c.fillRect(bx,990-bh,26,bh);for(let k=0;k<6;k++)if(r()<.4){c.fillStyle='rgba(255,214,150,.55)';c.fillRect(bx+5+(k%2)*10,990-bh+8+Math.floor(k/2)*18,5,7)}}
 c.fillStyle='rgba(20,22,28,.7)';for(let y=766;y<990;y+=14)c.fillRect(x0+120,y,300,6);c.strokeStyle='#0a0a0c';c.lineWidth=8;c.strokeRect(x0+120,760,300,230);
 c.fillStyle=lg(0,FL,0,FL+500,[[0,cool?'#181b22':'#1d1915'],[1,'#060607']]);c.fillRect(x0,FL,538,500);
 // desk between the two figures
 c.fillStyle='#0a0a0c';c.fillRect(x0+150,1236,260,22);c.fillRect(x0+165,1258,14,FL-1258);c.fillRect(x0+381,1258,14,FL-1258);c.fillStyle='#3a2f28';c.fillRect(x0+152,1238,256,14);
 c.globalCompositeOperation='screen';c.fillStyle=rg(x0+280,1100,0,320,[[0,rgba(WARM,.16)],[1,rgba(WARM,0)]]);c.fillRect(x0,760,538,700)})}
export function offices(t){const c=C();c.fillStyle='#0A0A0C';c.fillRect(0,0,W,H);officeHalf(0,true);officeHalf(542,false);
 S(()=>{c.fillStyle='#050506';c.fillRect(534,690,12,1230);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(546,690,2,1230)})}
export function ring(t){globalThis.__REFX=-600;ringBG(t);globalThis.__REFX=540;const c=C();S(()=>{c.fillStyle='#050506';c.fillRect(0,1440,W,H-1440)})}
export function street(t){const c=C();envDawn(t,0);S(()=>{c.fillStyle='rgba(6,8,18,.62)';c.fillRect(0,0,W,H)});rain(t,.8,9,0,690,W,800,110,30);splashes(t,1430,1530,16,9,.7);
 S(()=>{c.globalCompositeOperation='screen';c.fillStyle=rg(540,1000,0,520,[[0,'rgba(229,56,59,.10)'],[1,'rgba(229,56,59,0)']]);c.fillRect(0,600,W,900)})}
export function splitDark(t){const c=C();c.fillStyle='#0A0A0C';c.fillRect(0,0,W,H);[[0,'#0c0f15','#141923'],[542,'#110e0c','#1b1612']].forEach(([x0,a,b])=>S(()=>{c.fillStyle=lg(0,690,0,FL,[[0,a],[1,b]]);c.fillRect(x0,690,538,FL-690);c.fillStyle=lg(0,FL,0,FL+500,[[0,'#17171c'],[1,'#060607']]);c.fillRect(x0,FL,538,500)}));
 S(()=>{c.fillStyle='#050506';c.fillRect(534,690,12,1230);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(546,690,2,1230)})}
// ---- new sets for the revised episode ----
import {envLounge,envGym} from '../environments.js';
import {car} from '../engine/lib.js';
export function splitTextSet(t){const c=C();c.fillStyle='#0A0A0C';c.fillRect(0,0,W,H);
 S(()=>{c.beginPath();c.rect(0,690,538,1230);c.clip();c.translate(-170,0);envLounge(t,{door:0})});
 S(()=>{c.beginPath();c.rect(542,690,538,1230);c.clip();c.translate(270,0);envGym(t)});
 S(()=>{c.fillStyle='#050506';c.fillRect(534,690,12,1230);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(546,690,2,1230)})}
export function carLot(t){const c=C();c.fillStyle=lg(0,0,0,H,[[0,'#040406'],[.45,'#101218'],[.75,'#0b0b0e'],[1,'#050506']]);c.fillRect(0,0,W,H);
 S(()=>{for(let i=0;i<14;i++){const x=40+i*78,y=760+Math.sin(i*.8)*14;c.strokeStyle='#0a0a0c';c.lineWidth=2;if(i){c.beginPath();c.moveTo(x-78,760+Math.sin((i-1)*.8)*14);c.quadraticCurveTo(x-39,790,x,y);c.stroke()}
  const on=.6+.4*Math.sin(t*3+i);c.fillStyle=i%3?`rgba(255,210,140,${on})`:`rgba(229,56,59,${on})`;c.shadowColor=i%3?WARM:CR;c.shadowBlur=16;c.beginPath();c.arc(x,y+8,6,0,7);c.fill();c.shadowBlur=0}
  c.fillStyle=lg(0,FL-40,0,H,[[0,'#1a1a1f'],[1,'#060607']]);c.fillRect(0,FL-40,W,H-FL+40);c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=4;[-260,0,260].forEach(dx=>{c.beginPath();c.moveTo(540+dx,FL-30);c.lineTo(540+dx*1.6,H);c.stroke()});
  c.globalCompositeOperation='screen';c.fillStyle=rg(540,1300,0,520,[[0,'rgba(255,230,200,.16)'],[1,'rgba(255,230,200,0)']]);c.fillRect(0,700,W,1000)});
 car(540,1330,.95)}
export function party(t){const c=C();envLounge(t,{door:.6});S(()=>{c.globalCompositeOperation='screen';[[200,'rgba(229,56,59,.18)'],[540,'rgba(120,140,255,.14)'],[880,'rgba(255,200,140,.16)']].forEach(([x,col],i)=>{const k=.6+.4*Math.sin(t*2.4+i*2);c.fillStyle=rg(x,820,0,420,[[0,col.replace(/[\d.]+\)$/,(m)=>(parseFloat(m)*k)+')')],[1,'rgba(0,0,0,0)']]);c.fillRect(x-420,700,840,800)})});dust(100,760,880,700,40,t,.35,7)}
export function nightStore(t){const c=C();c.fillStyle=lg(0,0,0,H,[[0,'#040406'],[.5,'#0e1016'],[1,'#050506']]);c.fillRect(0,0,W,H);
 S(()=>{c.fillStyle='#101218';c.fillRect(0,760,W,FL-760);c.fillStyle='#0a0a0c';c.fillRect(560,820,420,FL-820);c.fillStyle='rgba(255,246,225,.10)';c.fillRect(572,832,396,FL-832);c.strokeStyle='#1c1e26';c.lineWidth=6;c.strokeRect(572,832,396,FL-832);
  // vending machine
  c.fillStyle='#0a0a0c';rr(160,900,240,520,14);c.fill();c.fillStyle=lg(0,906,0,1414,[[0,'#2a1418'],[1,'#160a0d']]);rr(166,906,228,508,10);c.fill();
  c.fillStyle='rgba(255,240,240,.85)';c.shadowColor='#ffb0b0';c.shadowBlur=26;rr(184,926,150,330,8);c.fill();c.shadowBlur=0;
  const cols=['#E5383B','#2f6fe0','#e8c440','#2fb36a'];for(let r=0;r<5;r++)for(let k=0;k<4;k++){c.fillStyle='#0a0a0c';rr(194+k*34,940+r*62,26,46,5);c.fill();c.fillStyle=cols[(r+k)%4];rr(197+k*34,943+r*62,20,40,4);c.fill()}
  c.fillStyle='#0a0a0c';c.fillRect(344,940,36,120);c.fillStyle='#E5383B';c.fillRect(350,950,24,8);c.fillStyle='#08080a';rr(190,1300,140,60,6);c.fill();
  c.fillStyle=lg(0,FL,0,H,[[0,'#17171c'],[1,'#050506']]);c.fillRect(0,FL,W,H-FL);c.globalCompositeOperation='screen';c.fillStyle=rg(280,1150,0,420,[[0,'rgba(255,120,120,.18)'],[1,'rgba(255,120,120,0)']]);c.fillRect(0,700,800,900)});
 rain(t,.5,4,0,690,W,800,60,24)}
// ---- v3 set variants with frame-driven light events ----
export function hookSet(t){const f=t*30;const fl=f>=48&&f<60?[1,.35,.9,.5,1,.7,1,.85,1,.9,1,1][Math.floor(f-48)]:1;stage(t,[[360,fl,'#ff8a9c'],[720,1,'#ffffff']])}
export function carLotSheen(t){carLot(t);const f=t*30;const k=(f-56)/18;if(k>0&&k<1){const c=C();S(()=>{c.globalCompositeOperation='screen';const x=-200+k*1500;c.fillStyle=lg(x-120,0,x+120,0,[[0,'rgba(255,255,255,0)'],[.5,'rgba(255,250,240,.55)'],[1,'rgba(255,255,255,0)']]);c.fillRect(x-120,700,240,1000)})}}
export function nightStoreNeon(t){nightStore(t);const c=C();const f=Math.floor(t*30);const on=[1,1,1,.2,1,1,1,1,.3,1,1,1,1,1,.15,1][f%16];
 S(()=>{c.font='900 54px Black';c.textAlign='center';c.textBaseline='middle';c.shadowColor=CR;c.shadowBlur=30*on;c.fillStyle=`rgba(255,90,95,${.25+.75*on})`;c.fillText('OPEN 24/7',770,770);c.shadowBlur=0;
  c.globalCompositeOperation='screen';c.fillStyle=rg(770,780,0,300,[[0,`rgba(229,56,59,${.18*on})`],[1,'rgba(229,56,59,0)']]);c.fillRect(470,600,600,500)})}
