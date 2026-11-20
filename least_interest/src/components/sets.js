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
