// Shared production kit for the REACTIVE vs STEADY series (no-narration format).
import {getCtx,S,A,txt,lg,rg,rgba,rr,lerp,seg,eo,eio,eback,clamp,rng,W,H,CR,CRL,WARM,vignette,grain,bubble,bigText,COVER} from '../engine/lib.js';
const C=()=>getCtx();
export const FL=1420;

// ---------- scoreboard (title + two values + REACTIVE / STEADY) ----------
export function scoreboard(u,title,vl,vr,o={}){const k=eo(seg(u,.1,.45));if(k<=0)return;const c=C();
 S(()=>{c.fillStyle=lg(0,330,0,740,[[0,'rgba(0,0,0,.92)'],[.75,'rgba(0,0,0,.6)'],[1,'rgba(0,0,0,0)']]);c.fillRect(0,245,W,495)});
 A(k,()=>txt(title,540,470+(1-k)*12,'500 26px Lab','rgba(255,255,255,.62)',{ls:9}));
 [[300,vl,o.ll||'REACTIVE',CRL,.18],[780,vr,o.lr||'STEADY','#fff',.3]].forEach(([x,v,l,col,d])=>{const kk=eback(seg(u,d,d+.4));if(kk<=0)return;
  const sz=o.size||88;S(()=>{c.globalAlpha=clamp(kk);c.translate(x,552);c.scale(lerp(.6,1,kk),lerp(.6,1,kk));txt(v,0,0,`900 ${sz}px Black`,col,{glow:col==CRL?28:20,gc:col==CRL?rgba(CR,.8):'rgba(255,255,255,.45)'})});
  A(clamp(kk),()=>txt(l,x,626,'500 28px Lab',col==CRL?'rgba(255,255,255,.6)':'#fff',{ls:9}))});
 A(k,()=>S(()=>{c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=2;c.beginPath();c.moveTo(540,505);c.lineTo(540,505+120*k);c.stroke()}))}
export const num=(a,b,u,t0,t1,fmt=v=>String(v))=>fmt(Math.round(lerp(a,b,eio(seg(u,t0,t1)))));

// ---------- popups ----------
export function pop(u,t0,fn,dur=99){const k=seg(u,t0,t0+.26);if(k<=0||u>t0+dur)return;const e=eback(k);const out=1-seg(u,t0+dur-.2,t0+dur);A(clamp(k*3)*out,()=>fn(e))}
export function say(u,t0,x,y,s,o={},dur){pop(u,t0,e=>S(()=>{const c=C();c.translate(x,y);c.scale(e,e);c.translate(-x,-y);bubble(x,y,s,o)}),dur)}
export function notif(u,t0,x,y,title,body,o={},dur){pop(u,t0,e=>S(()=>{const c=C();c.translate(x,y);c.scale(e,e);const w=o.w||420,h=96;
 c.fillStyle='rgba(18,19,24,.95)';c.strokeStyle=o.red?rgba(CR,.9):'rgba(255,255,255,.28)';c.lineWidth=2;c.shadowColor=o.red?CR:'rgba(0,0,0,.6)';c.shadowBlur=20;rr(-w/2,-h/2,w,h,22);c.fill();c.stroke();c.shadowBlur=0;
 c.fillStyle=o.red?CR:'#3a3d47';rr(-w/2+16,-26,52,52,13);c.fill();txt(o.icon||'✉',-w/2+42,1,'700 26px Disp','#fff');
 txt(title,-w/2+84,-16,'800 21px Disp','#fff',{align:'left'});txt(body,-w/2+84,14,'500 20px Disp','rgba(255,255,255,.75)',{align:'left'});txt(o.time||'now',w/2-18,-16,'500 16px Disp','rgba(255,255,255,.45)',{align:'right'})}),dur)}
// chat bubble stack (sent = right/blue-ish white, received = left gray)
export function chat(u,msgs,x,y,w=440){const c=C();let yy=y;msgs.forEach(([t0,text,sent,st])=>{const k=eo(seg(u,t0,t0+.2));if(k<=0)return;c.font='600 22px Disp';const tw=Math.min(w-60,c.measureText(text).width)+36;const bx=sent?x+w/2-tw:x-w/2;
 S(()=>{c.globalAlpha*=k;c.translate(0,(1-k)*16);c.fillStyle=sent?'#e9ecf3':'#2a2d36';rr(bx,yy,tw,46,20);c.fill();txt(text,bx+18,yy+24,'600 22px Disp',sent?'#111':'#fff',{align:'left'});if(st)txt(st,sent?x+w/2-4:bx+4,yy+58,'500 14px Disp',sent&&st.startsWith('Seen')?'rgba(255,255,255,.4)':CRL,{align:sent?'right':'left'})});yy+=st?74:56});return yy}
export function phoneFrame(x,y,w,h,fn){const c=C();S(()=>{c.fillStyle='#0a0a0c';rr(x-10,y-10,w+20,h+20,44);c.fill();c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=2;rr(x-10,y-10,w+20,h+20,44);c.stroke();c.fillStyle='#0f1116';rr(x,y,w,h,36);c.fill();c.save();rr(x,y,w,h,36);c.clip();fn();c.restore();c.fillStyle='#0a0a0c';rr(x+w/2-50,y+10,100,24,12);c.fill()})}

// ---------- labels / captions ----------
export function tag(x,y,s,col,a=1){A(a,()=>txt(s,x,y,'500 24px Lab',col,{ls:8,glow:10,gc:col==CRL?rgba(CR,.7):'rgba(255,255,255,.35)'}))}
export function title2(u,t0,l1,em,y=600){bigText(u,t0,l1,em,y)}
export function divider(){const c=C();S(()=>{c.fillStyle='#050506';c.fillRect(534,690,12,1000);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(546,690,2,1000)})}
export function splitClip(side,fn){const c=C();S(()=>{c.beginPath();c.rect(side?542:0,690,538,1000);c.clip();if(side){c.translate(542,0);c.translate(-270,0)}else c.translate(-270+0,0);fn()})}

// ---------- end card ----------
export function endCard(u){const c=C();c.fillStyle='#050506';c.fillRect(0,0,W,H);
 for(let i=0;i<3;i++){const k=eio(seg(u,.1+i*.08,.7+i*.08));S(()=>{const y=1560+i*26;c.strokeStyle=CR;c.globalAlpha=.75;c.lineWidth=2.5;c.shadowColor=CR;c.shadowBlur=12;c.beginPath();c.moveTo(0,y-8);c.lineTo(W*k,y-8+16*k);c.stroke()})}
 bigText(u,0,'TESTED UNDER PRESSURE.',null,520);bigText(u,.3,'Become stable as a ','rock.',630);
 const ck=seg(u,.3,1.0),e=eo(ck);if(ck>0&&COVER)S(()=>{const cw=330,ch=cw*COVER.height/COVER.width;c.globalAlpha=e;c.translate(540,1035+(1-e)*60+Math.sin(u*1.6)*4);c.scale(lerp(.88,1,e),lerp(.88,1,e));if(ck<1)c.filter=`blur(${(1-e)*14}px)`;
  c.shadowColor='rgba(212,34,63,.55)';c.shadowBlur=70;c.fillStyle='#111';c.fillRect(-cw/2,-ch/2,cw,ch);c.shadowBlur=0;c.drawImage(COVER,-cw/2,-ch/2,cw,ch);c.filter='none';c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;c.strokeRect(-cw/2,-ch/2,cw,ch)});
 const pk=seg(u,1.1,1.5);if(pk>0)S(()=>{const ee=eback(pk),pw=440,ph=88;c.translate(540,1410);c.scale(ee,ee);const pulse=.5+.5*Math.sin((u-1.5)*5);c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=18+pulse*16;rr(-pw/2,-ph/2,pw,ph,ph/2);c.fill();c.shadowBlur=0;
  txt('GET THE GUIDE',-26,2,'700 34px Disp','#000',{ls:4});c.strokeStyle='#000';c.lineWidth=5;c.lineCap='round';c.lineJoin='round';const ax=162+Math.sin(u*6)*5;c.beginPath();c.moveTo(ax-14,0);c.lineTo(ax+12,0);c.moveTo(ax+2,-11);c.lineTo(ax+13,0);c.lineTo(ax+2,11);c.stroke()});
 A(seg(u,1.4,1.7),()=>txt('LINK IN BIO',540,1500,'500 24px Lab','#fff',{ls:10,glow:10}))}

// ---------- generic timeline ----------
// scenes: [{fn,dur,cam:(k)=>[z,dx,dy],fadeIn,fadeOut}]
export function makeTimeline(scenes,opts={}){let a=0;const T=scenes.map(s=>{const r={...s,start:a,end:a+s.dur};a+=s.dur;return r});const TOTAL=a;
 const draw=(t)=>{const c=C();let i=T.findIndex(s=>t>=s.start&&t<s.end);if(i<0)i=T.length-1;const s=T[i];const u=t-s.start,d=s.dur;
  S(()=>{const [z,dx,dy]=(s.cam||(()=>[1,0,0]))(clamp(u/d),u);c.translate(540+dx,1060+dy);c.scale(z,z);c.translate(-540,-1060);s.fn(u,d)});
  vignette(opts.vig??.72);grain(.055,Math.floor(t*12));
  const fin=s.fadeIn?seg(u,0,s.fadeIn):1,fout=s.fadeOut?1-seg(u,d-s.fadeOut,d):1;const dark=1-Math.min(fin,fout);if(dark>0){c.fillStyle=`rgba(0,0,0,${dark})`;c.fillRect(0,0,W,H)}
  if(s.flash){const fk=1-seg(u,0,s.flash);if(fk>0){c.fillStyle=`rgba(255,255,255,${fk*.5})`;c.fillRect(0,0,W,H)}}
  if(t>TOTAL-.4){c.fillStyle=`rgba(0,0,0,${seg(t,TOTAL-.4,TOTAL)})`;c.fillRect(0,0,W,H)}};
 return {scenes:T,TOTAL,draw}}
export const camPush=(z0=1,z1=1.06,dx0=0,dx1=0,dy0=0,dy1=0)=>k=>[lerp(z0,z1,k),lerp(dx0,dx1,k),lerp(dy0,dy1,k)];
