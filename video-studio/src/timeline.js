// Master timeline for "Two Versions of You": scenes, camera, captions, grade.
import {getCtx,S,A,lerp,seg,eo,eio,clamp,W,H,CR,CRL,rgba,vignette,grain,txt} from './engine/lib.js';
import * as SC from './scenes.js';
import M from './manifest.json';

const END_CARD=4.0;
export const SCENES=M.scenes.map((s,i)=>({id:s.id,start:s.start,end:s.end,fn:SC[`s${String(i+1).padStart(2,'0')}`]}));
SCENES.push({id:'s14',start:M.total,end:M.total+END_CARD,fn:SC.s14});
export const TOTAL=M.total+END_CARD;

// camera per scene: k = progress 0..1 -> [zoom, dx, dy]
const CAM={s01:k=>[lerp(1,1.06,k),0,0],s02:k=>[1.02,lerp(-10,10,k),0],s03:k=>[lerp(1,1.12,k),lerp(0,40,k),lerp(0,-30,k)],s04:k=>[1.04,lerp(30,-30,k),0],
 s05:k=>[lerp(1.08,1,k),0,0],s06:k=>[lerp(1,1.05,k),0,0],s07:k=>[lerp(1,1.1,k),0,0],s08:k=>[lerp(1.02,1.07,k),0,lerp(0,-20,k)],s09:k=>[lerp(1.04,1.1,k),lerp(20,0,k),0],
 s10:k=>[1.03,lerp(-20,20,k),0],s11:k=>[lerp(1,1.04,k),0,0],s12:k=>[lerp(1.02,1.1,k),0,lerp(0,-20,k)],s13:k=>[lerp(1,1.1,k),lerp(0,90*eio(seg(k,.75,1)),k),0],s14:k=>[1,0,0]};

// ---- narration captions (word-synced) ----
const KEY=new Set(['proud','tired','dopamine','monday','years','motivated','negotiating','cold','heavy','quiet','dark','change','gave','joke','doubt','couch','listens','going','percent','notices','discipline','punishment','pressure','break','question','week','same','age']);
const words=M.scenes.flatMap(s=>s.words);
const chunks=[];{let cur=[];words.forEach((w,i)=>{cur.push(w);const end=/[.,?!]$/.test(w.w)||cur.length>=4||i==words.length-1;if(end){chunks.push(cur);cur=[]}})}
chunks.forEach((c,i)=>{c.s=c[0].s-.05;c.e=i<chunks.length-1?chunks[i+1][0].s-.04:M.total+.3});
function captions(t){const ch=chunks.find(c=>t>=c.s&&t<c.e);if(!ch)return;const c=getCtx();const y=560;
 const out=1-seg(t,ch.e-.1,ch.e);let sz=78;c.font=`italic 500 ${sz}px Ser`;const sp=sz*.24;
 const ws=ch.map(w=>({...w,txt:w.w,key:KEY.has(w.w.toLowerCase().replace(/[^a-z']/g,''))}));
 let total=ws.reduce((a,w,i)=>a+c.measureText(w.txt).width+(i?sp:0),0);if(total>960){sz=sz*960/total;c.font=`italic 500 ${sz}px Ser`;total=960}
 let x=540-total/2;
 ws.forEach((w,i)=>{const ww=c.measureText(w.txt).width;const k=eo(seg(t,w.s-.06,w.s+.16));if(k>0)S(()=>{c.globalAlpha=k*out;if(k<1)c.filter=`blur(${(1-k)*8}px)`;
   txt(w.txt,x,y+(1-k)*14,`italic 500 ${sz}px Ser`,w.key?CRL:'#f4f1ec',{align:'left',glow:w.key?22:16,gc:w.key?rgba(CR,.65):'rgba(255,255,255,.35)'})});x+=ww+sp});}

let lastScene=-1;
export function drawFrame(t){const c=getCtx();let i=SCENES.findIndex(s=>t>=s.start&&t<s.end);if(i<0)i=SCENES.length-1;const s=SCENES[i];const u=t-s.start,d=s.end-s.start;
 S(()=>{const [z,dx,dy]=CAM[s.id](clamp(u/d));c.translate(540+dx,1060+dy);c.scale(z,z);c.translate(-540,-1060);s.fn(u)});
 if(s.id!=='s14')captions(t);
 vignette(.7);grain(.06,Math.floor(t*12));
 const fin=s.id==='s14'?seg(u,0,.4):(['s07','s11'].includes(s.id)?seg(u,0,.12):1);const fout=['s06','s10'].includes(s.id)?1-seg(u,d-.12,d):1;const dark=1-Math.min(fin,fout);
 if(dark>0){c.fillStyle=`rgba(0,0,0,${dark})`;c.fillRect(0,0,W,H)}
 if(t>TOTAL-.5){c.fillStyle=`rgba(0,0,0,${seg(t,TOTAL-.5,TOTAL)})`;c.fillRect(0,0,W,H)}}
