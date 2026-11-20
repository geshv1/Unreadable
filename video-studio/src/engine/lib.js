// Legacy canvas animation library (ported from the previous videos)
// eslint-disable
// ===== core =====
const W=1080,H=1920;
let ctx=null;
export function setCtx(c){ctx=c}
export function getCtx(){return ctx}
const CR='#d4223f',CRL='#ff4d6a',WARM='#ffcf8a';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const lerp=(a,b,k)=>a+(b-a)*k;
const eo=k=>1-Math.pow(1-k,3);
const eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const eback=k=>{const c=1.70158;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)};
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hex(c){c=c.replace('#','');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]}
function sh(c,k){const [r,g,b]=hex(c);const f=v=>Math.round(clamp(k>1?v+(255-v)*(k-1):v*k,0,255));return `rgb(${f(r)},${f(g)},${f(b)})`}
function rgba(c,a){const [r,g,b]=hex(c);return `rgba(${r},${g},${b},${a})`}
function S(fn){ctx.save();fn();ctx.restore()}
function A(a,fn){if(a<=.001)return;ctx.save();ctx.globalAlpha*=a;fn();ctx.restore()}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function lg(x1,y1,x2,y2,stops){const g=ctx.createLinearGradient(x1,y1,x2,y2);stops.forEach(([o,c])=>g.addColorStop(o,c));return g}
function rg(x,y,r0,r1,stops,x0,y0){const g=ctx.createRadialGradient(x0??x,y0??y,r0,x,y,r1);stops.forEach(([o,c])=>g.addColorStop(o,c));return g}
function txt(s,x,y,font,col,opt={}){S(()=>{ctx.font=font;ctx.fillStyle=col;ctx.textAlign=opt.align||'center';ctx.textBaseline=opt.base||'middle';ctx.letterSpacing=(opt.ls||0)+'px';if(opt.glow){ctx.shadowColor=opt.gc||col;ctx.shadowBlur=opt.glow}ctx.fillText(s,x+(opt.align=='left'?0:(opt.ls||0)/2),y)})}

// ===== character =====
// pose: lean, hd (head tilt), aF/aB:[upper,lower], lF/lB:[thigh,shin] angles from down, + = facing dir
const POSE={
 stand:{lean:0,hd:0,aF:[.12,.1],aB:[-.12,.1],lF:[.06,0],lB:[-.06,0]},
};
function vec(a,L,f){return[Math.sin(a)*L*f,Math.cos(a)*L]}
function add(p,v){return[p[0]+v[0],p[1]+v[1]]}
function capsule(a,b,w,fill,s,o={}){
 S(()=>{ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=o.out||'#0a0a0c';ctx.lineWidth=w+7*s;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
  ctx.strokeStyle=fill;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
  if(o.hl!==false){ctx.globalAlpha*=.28;ctx.strokeStyle='#fff';ctx.lineWidth=w*.28;const dx=-o.lx*w*.22,dy=-w*.22;ctx.beginPath();ctx.moveTo(a[0]+dx,a[1]+dy);ctx.lineTo(b[0]+dx,b[1]+dy);ctx.stroke()}})}
function limb2(root,ang,L1,L2,s,f){const m=add(root,vec(ang[0],L1*s,f));const e=add(m,vec(ang[0]+ang[1],L2*s,f));return[root,m,e]}
// o: {x,y,s,f,pose,skin,top,bot,shoe,outfit:'hoodie'|'coat'|'tee'|'dress'|'suit',hair:'cap'|'short'|'pony'|'bun'|'long'|'none',hairCol,hands:'pockets'|..., glow, props(fn(J))}
function person(o){
 const s=o.s||1,f=o.f||1,p=o.pose||POSE.stand,lx=o.lx??-f;
 const skin=o.skin||'#d9d9de',top=o.top||'#6d6d76',bot=o.bot||'#3a3a42',shoe=o.shoe||'#efeff2';
 const legL=62,shinL=60,legW=37*s,armW=29*s;
 const hip=[o.x,o.y-(legL+shinL)*s-10*s-(o.lift||0)];
 const nv=[Math.sin(p.lean)*102*s*f,-Math.cos(p.lean)*102*s];
 const neck=add(hip,nv);const shd=[lerp(neck[0],hip[0],.1),lerp(neck[1],hip[1],.1)];
 const ha=p.lean+p.hd;const head=add(neck,[Math.sin(ha)*42*s*f+4*s*f,-Math.cos(ha)*42*s]);
 const LF=limb2(hip,p.lF,legL,shinL,s,f),LB=limb2([hip[0]-4*s*f,hip[1]],p.lB,legL,shinL,s,f);
 const AF=limb2(shd,p.aF,52,50,s,f),AB=limb2([shd[0]-6*s*f,shd[1]],p.aB,52,50,s,f);
 const J={hip,neck,head,handF:AF[2],handB:AB[2],elbowF:AF[1],footF:LF[2],footB:LB[2],s,f};
 const dk=c=>sh(c,.68);
 // shadow
 if(!o.noShadow)S(()=>{ctx.fillStyle=rg(o.x,o.y,0,80*s,[[0,'rgba(0,0,0,.6)'],[1,'rgba(0,0,0,0)']]);ctx.scale(1,.18);ctx.beginPath();ctx.arc(o.x,o.y/.18,80*s,0,7);ctx.fill()});
 if(o.glow)S(()=>{ctx.fillStyle=rg(head[0],hip[1],0,230*s,[[0,rgba('#ffffff',.10*o.glow)],[1,'rgba(255,255,255,0)']]);ctx.fillRect(head[0]-260*s,hip[1]-300*s,520*s,560*s)});
 const foot=(L,c)=>S(()=>{const e=L[2];ctx.translate(e[0]+8*s*f,e[1]+2*s);ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.ellipse(0,0,25*s,14*s,0,0,7);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,-1*s,21*s,10.5*s,0,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-4*s*f,-5*s,9*s,3*s,0,0,7);ctx.fill()});
 const legDraw=(L,c)=>{capsule(L[0],L[1],legW,c,s,{lx});capsule(L[1],L[2],legW*.92,c,s,{lx})};
 const armDraw=(A,c,sk,hide)=>{capsule(A[0],A[1],armW,c,s,{lx});capsule(A[1],A[2],armW*.9,c,s,{lx});if(!hide)S(()=>{ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(A[2][0],A[2][1],12.5*s,0,7);ctx.fill();ctx.fillStyle=sk;ctx.beginPath();ctx.arc(A[2][0],A[2][1],9*s,0,7);ctx.fill()})};
 const pockets=o.hands=='pockets';
 // back limbs
 legDraw(LB,dk(bot));foot(LB,dk(shoe));
 if(!pockets)armDraw(AB,dk(top),dk(skin),false);
 if(o.backProp)o.backProp(J);
 // coat tail behind legs? coat drawn after torso
 // torso
 const tw=60*s;
 capsule(hip,neck,tw,top,s,{lx});
 if(o.outfit=='coat'||o.outfit=='dress'){S(()=>{const len=o.outfit=='coat'?95:80;const a=p.lean;const perp=[Math.cos(a),Math.sin(a)*f];
  const sl=[neck[0]-perp[0]*24*s,neck[1]-perp[1]*24*s],sr=[neck[0]+perp[0]*24*s,neck[1]+perp[1]*24*s];
  const swing=(o.coatSwing||0);
  const bl=[hip[0]-34*s+swing*s*-f*10,hip[1]+len*s],br=[hip[0]+34*s+swing*s*f*6,hip[1]+len*s];
  ctx.beginPath();ctx.moveTo(sl[0],sl[1]+10*s);ctx.lineTo(bl[0],bl[1]);ctx.quadraticCurveTo(hip[0],hip[1]+len*s+10*s,br[0],br[1]);ctx.lineTo(sr[0],sr[1]+10*s);ctx.closePath();
  ctx.lineJoin='round';ctx.strokeStyle='#0a0a0c';ctx.lineWidth=7*s;ctx.stroke();ctx.fillStyle=lg(hip[0]-40*s,0,hip[0]+40*s,0,[[0,sh(top,1.15)],[1,sh(top,.8)]]);ctx.fill();
  if(o.outfit=='coat'){ctx.strokeStyle=sh(top,.6);ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(neck[0]+f*6*s,neck[1]+8*s);ctx.lineTo(hip[0]+f*8*s,hip[1]+len*s);ctx.stroke();
   ctx.fillStyle=sh(top,1.3);ctx.beginPath();ctx.moveTo(neck[0]-8*s,neck[1]+2*s);ctx.lineTo(neck[0]+f*10*s,neck[1]+40*s);ctx.lineTo(neck[0]+f*18*s,neck[1]+2*s);ctx.closePath();ctx.fill()}})}
 if(o.outfit=='hoodie')S(()=>{ // hood behind neck + pocket
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.ellipse(neck[0]-f*14*s,neck[1]+2*s,26*s,16*s,-.3*f,0,7);ctx.fill();ctx.fillStyle=sh(top,.85);ctx.beginPath();ctx.ellipse(neck[0]-f*14*s,neck[1]+2*s,22*s,12*s,-.3*f,0,7);ctx.fill();
  ctx.strokeStyle=sh(top,.6);ctx.lineWidth=3*s;ctx.lineCap='round';const mid=[lerp(hip[0],neck[0],.3),lerp(hip[1],neck[1],.3)];ctx.beginPath();ctx.moveTo(mid[0]-6*s,mid[1]);ctx.lineTo(mid[0]+f*16*s,mid[1]);ctx.stroke();
  ctx.strokeStyle='#ddd';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(neck[0]+f*8*s,neck[1]+6*s);ctx.lineTo(neck[0]+f*10*s,neck[1]+30*s);ctx.stroke()});
 if(o.outfit=='suit')S(()=>{ctx.fillStyle='#f4f4f6';ctx.beginPath();ctx.moveTo(neck[0]-2*s,neck[1]);ctx.lineTo(neck[0]+f*12*s,neck[1]+36*s);ctx.lineTo(neck[0]+f*20*s,neck[1]+2*s);ctx.closePath();ctx.fill();ctx.fillStyle=CR;ctx.beginPath();ctx.moveTo(neck[0]+f*9*s,neck[1]+6*s);ctx.lineTo(neck[0]+f*13*s,neck[1]+30*s);ctx.lineTo(neck[0]+f*16*s,neck[1]+6*s);ctx.fill()});
 // front leg
 if(o.outfit!='dress'){legDraw(LF,bot);foot(LF,shoe)}else{legDraw(LF,skin);foot(LF,shoe)}
 if(o.midProp)o.midProp(J);
 // head
 S(()=>{const r=34*s;ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(head[0],head[1],r+3.5*s,0,7);ctx.fill();
  ctx.fillStyle=rg(head[0],head[1],2*s,r,[[0,sh(skin,1.18)],[.7,skin],[1,sh(skin,.82)]],head[0]+lx*r*.35,head[1]-r*.4);ctx.beginPath();ctx.arc(head[0],head[1],r,0,7);ctx.fill();
  hair(o,head,r,s,f,ha);face(o,head,r,s,f,ha)});
 // front arm
 if(!pockets)armDraw(AF,top,skin,o.hideHandF);else{ // arm bent into pocket
  const sp=[shd[0],shd[1]],el=add(sp,vec(.08,50*s,f)),hd=add(el,vec(.65,34*s,f));capsule(sp,el,armW,top,s,{lx});capsule(el,hd,armW*.9,top,s,{lx})}
 if(o.frontProp)o.frontProp(J);
 return J}
// ---- facial expressions: o.mood = neutral|angry|sad|shock|calm|smile|smirk ; o.look (-1..1) ; o.blink (0..1) or auto via o.t ----
function face(o,c,r,s,f,ha){if(o.face===false)return;const mood=o.mood||'neutral';let bl=o.blink??0;
 if(o.t!=null){const seed=(o.x||0)*.013;const ph=((o.t*.37+seed)%1+1)%1;if(ph<.035)bl=Math.max(bl,Math.sin(ph/.035*Math.PI))}
 const dark=(o.skin||'#d9d9de');const lum=parseInt(dark.slice(1,3),16);const ink=lum<70?'rgba(255,255,255,.75)':'#121214';
 S(()=>{ctx.translate(c[0],c[1]);ctx.rotate(ha*f*.6);const lk=(o.look||0)*r*.08;
  const E=[[f*r*.1+lk,r*.04],[f*r*.5+lk,r*.02]];const xm=f*r*.3+lk;
  let ry=r*.15,rx=r*.105;if(mood=='shock'){ry*=1.35;rx*=1.25}if(mood=='calm')ry*=.45;if(mood=='angry')ry*=.8;ry*=Math.max(.08,1-bl);
  ctx.fillStyle=ink;E.forEach(([x,y],i)=>{ctx.beginPath();ctx.ellipse(x,y,rx*(i?1:.85),ry*(i?1:.9),0,0,7);ctx.fill()});
  if(bl<.5&&lum>=70){ctx.fillStyle='rgba(255,255,255,.85)';E.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x+rx*.35,y-ry*.4,rx*.28,0,7);ctx.fill()})}
  ctx.strokeStyle=ink;ctx.lineCap='round';ctx.lineWidth=Math.max(1.5,2.8*s);
  E.forEach(([x,y])=>{const inner=Math.sign(xm-x)||f;let yi=-r*.27,yo=-r*.27;
   if(mood=='angry'){yi+=r*.1;yo-=r*.04}else if(mood=='sad'){yi-=r*.09;yo+=r*.04}else if(mood=='shock'){yi-=r*.1;yo-=r*.1}else if(mood=='smirk'){yi-=r*.02;yo-=r*.06}
   ctx.beginPath();ctx.moveTo(x+inner*r*.13,y+yi);ctx.lineTo(x-inner*r*.13,y+yo);ctx.stroke()});
  const mx=f*r*.34+lk,my=r*.5,mw=r*.2;ctx.lineWidth=Math.max(1.4,2.4*s);
  if(mood=='smile'){ctx.beginPath();ctx.arc(mx,my-mw*.6,mw,.25*Math.PI,.75*Math.PI);ctx.stroke()}
  else if(mood=='smirk'){ctx.beginPath();ctx.moveTo(mx-mw*.8,my);ctx.quadraticCurveTo(mx+mw*.3,my+mw*.15,mx+mw*.9*f,my-mw*.45);ctx.stroke()}
  else if(mood=='sad'||mood=='angry'){ctx.beginPath();ctx.arc(mx,my+mw*.75,mw,1.2*Math.PI,1.8*Math.PI);ctx.stroke()}
  else if(mood=='shock'){ctx.fillStyle=ink;ctx.beginPath();ctx.ellipse(mx,my,mw*.35,mw*.5,0,0,7);ctx.fill()}
  else if(mood=='calm'){ctx.beginPath();ctx.moveTo(mx-mw*.6,my);ctx.lineTo(mx+mw*.6,my);ctx.stroke()}})}

function hair(o,c,r,s,f,ha){const hc=o.hairCol||'#1b1b20';
 S(()=>{ctx.translate(c[0],c[1]);ctx.rotate(ha*f*.6);ctx.fillStyle=hc;ctx.strokeStyle='#0a0a0c';ctx.lineWidth=3*s;
  if(o.hair=='cap'){ctx.beginPath();ctx.arc(0,-2*s,r+2*s,Math.PI*1.02,Math.PI*1.98);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(f*(r+6*s),-4*s,20*s,6*s,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(-f*6*s,-r*.62,12*s,4*s,0,0,7);ctx.fill()}
  else if(o.hair=='beanie'){ctx.beginPath();ctx.arc(0,-4*s,r+4*s,Math.PI*1.0,Math.PI*2.0);ctx.lineTo(r+4*s,-r*.15);ctx.lineTo(-r-4*s,-r*.15);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=sh(hc,1.25);ctx.fillRect(-r-5*s,-r*.32,2*r+10*s,r*.2);ctx.beginPath();ctx.arc(0,-r-8*s,7*s,0,7);ctx.fillStyle=hc;ctx.fill();ctx.stroke()}
  else if(o.hair!='none'&&o.hair){ctx.save();ctx.beginPath();ctx.arc(0,0,r+3*s,0,7);ctx.clip();ctx.beginPath();ctx.moveTo(-r*1.2,-r*.05);ctx.quadraticCurveTo(f*r*.2,-r*.55,f*r*1.2,-r*.25);ctx.lineTo(f*r*1.2,-r*1.3);ctx.lineTo(-f*r*1.2,-r*1.3);ctx.closePath();ctx.fill();
   ctx.fillRect(f>0?-r*1.2:r*.45,-r,r*.75,o.hair=='short'?r*1.15:r*1.6);ctx.restore();ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.ellipse(-f*r*.2,-r*.7,r*.35,r*.1,-.2*f,0,7);ctx.fill();ctx.fillStyle=hc;
   if(o.hair=='pony'){ctx.beginPath();ctx.moveTo(-f*r*.8,-r*.5);ctx.quadraticCurveTo(-f*r*1.8,-r*.2,-f*r*1.5,r*1.1);ctx.quadraticCurveTo(-f*r*1.1,r*.2,-f*r*.7,-r*.1);ctx.fill();ctx.stroke()}
   if(o.hair=='long'){ctx.beginPath();ctx.moveTo(-f*r*.95,-r*.2);ctx.quadraticCurveTo(-f*r*1.25,r*1.2,-f*r*.6,r*1.9);ctx.lineTo(-f*r*.1,r*1.1);ctx.lineTo(-f*r*.2,0);ctx.fill()}
   if(o.hair=='bun'){ctx.beginPath();ctx.arc(-f*r*.7,-r*.9,r*.42,0,7);ctx.fill();ctx.stroke()}}})}

// ===== shared fx =====
let GRAIN=null;
function grain(a=.07,seed=1){if(!GRAIN){GRAIN=document.createElement('canvas');GRAIN.width=540;GRAIN.height=960;const g=GRAIN.getContext('2d');const id=g.createImageData(540,960);const r=rng(9);for(let i=0;i<id.data.length;i+=4){const v=r()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}g.putImageData(id,0,0)}
 S(()=>{ctx.globalAlpha=a;ctx.globalCompositeOperation='overlay';const ox=(seed*137)%60,oy=(seed*71)%60;ctx.drawImage(GRAIN,-ox,-oy,W+120,H+120)})}
function vignette(a=.85){S(()=>{ctx.fillStyle=rg(540,1000,300,1150,[[0,'rgba(0,0,0,0)'],[1,`rgba(0,0,0,${a})`]]);ctx.fillRect(0,0,W,H)})}
function rays(x,y,ang,spread,len,a,n=5,seed=3){const r=rng(seed);S(()=>{ctx.globalCompositeOperation='screen';for(let i=0;i<n;i++){const a0=ang+(r()-.5)*spread,w=.03+r()*.06;ctx.fillStyle=lg(x,y,x+Math.sin(a0)*len,y+Math.cos(a0)*len,[[0,`rgba(255,255,255,${a*(.5+r()*.5)})`],[1,'rgba(255,255,255,0)']]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(a0-w)*len,y+Math.cos(a0-w)*len);ctx.lineTo(x+Math.sin(a0+w)*len,y+Math.cos(a0+w)*len);ctx.closePath();ctx.fill()}})}
function dust(x0,y0,w,h,n,t,a=.5,seed=5){const r=rng(seed);S(()=>{ctx.fillStyle='#fff';for(let i=0;i<n;i++){const x=x0+((r()*w+t*8*(r()-.3))%w+w)%w,y=y0+((r()*h-t*6*r())%h+h)%h,s=.8+r()*2;ctx.globalAlpha=a*(.3+.7*r())*(.6+.4*Math.sin(t*2+i));ctx.beginPath();ctx.arc(x,y,s,0,7);ctx.fill()}})}
function hud(title,items){ // items: [{label,value,col}]
 txt(title,540,488,'500 26px Lab','rgba(255,255,255,.55)',{ls:9});
 const n=items.length;items.forEach((it,i)=>{const x=n==1?540:lerp(290,790,i/(n-1));
  txt(it.value,x,575,'900 104px Black',it.col||'#fff',{glow:it.col==CR?30:22,gc:it.col==CR?rgba(CR,.8):'rgba(255,255,255,.45)'});
  txt(it.label,x,652,'700 30px Disp',it.dim?'rgba(255,255,255,.55)':'#fff',{ls:9})});
 if(n==2)S(()=>{ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(540,530);ctx.lineTo(540,660);ctx.stroke()})}
function bubble(x,y,str,o={}){ // speech card with tail
 S(()=>{ctx.font='800 34px Disp';ctx.letterSpacing='4px';const w=ctx.measureText(str).width+60,h=72;const bx=x-w/2,by=y-h;
  ctx.fillStyle=o.dark?'rgba(12,12,14,.92)':'rgba(12,12,14,.92)';ctx.strokeStyle=o.col||'#fff';ctx.lineWidth=4;ctx.shadowColor=o.col||'rgba(255,255,255,.6)';ctx.shadowBlur=18;
  ctx.beginPath();ctx.roundRect(bx,by,w,h,18);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  if(o.thought){[[0,26,9],[-14,48,6]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx+(o.tx||0),y+dy-10,r,0,7);ctx.fill();ctx.stroke()})}
  else{const tx=x+(o.tx||0);ctx.beginPath();ctx.moveTo(tx-14,y-2);ctx.lineTo(tx+(o.tdx||8),y+34);ctx.lineTo(tx+16,y-2);ctx.fill();ctx.beginPath();ctx.moveTo(tx-14,y);ctx.lineTo(tx+(o.tdx||8),y+34);ctx.lineTo(tx+16,y);ctx.stroke()}
  ctx.fillStyle=o.col||'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(str,x+2,by+h/2+2)})}

// ================= SCENE A: storefront at night =================
function bag(x,y,w,h,col,handle='#111',label){S(()=>{ctx.lineJoin='round';
 ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(x-w/2-4,y+4);ctx.lineTo(x-w/2*0.86-4,y-h-4);ctx.lineTo(x+w/2*0.86+4,y-h-4);ctx.lineTo(x+w/2+4,y+4);ctx.closePath();ctx.fill();
 ctx.fillStyle=lg(x-w/2,0,x+w/2,0,[[0,sh(col,1.1)],[.6,col],[1,sh(col,.7)]]);ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.lineTo(x-w/2*0.86,y-h);ctx.lineTo(x+w/2*0.86,y-h);ctx.lineTo(x+w/2,y);ctx.closePath();ctx.fill();
 ctx.strokeStyle=handle;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y-h,w*.24,Math.PI,0);ctx.stroke();
 ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-w/2*.86,y-h,w*.86*2,h*.12);
 if(label)txt(label,x,y-h*.45,`700 ${w*.16}px Disp`,'rgba(0,0,0,.55)',{ls:2})})}
function handbag(x,y,w,h,col){S(()=>{ctx.fillStyle='#0a0a0c';rr(x-w/2-4,y-h-4,w+8,h+8,16);ctx.fill();ctx.fillStyle=lg(0,y-h,0,y,[[0,sh(col,1.25)],[1,sh(col,.75)]]);rr(x-w/2,y-h,w,h,13);ctx.fill();
 ctx.strokeStyle='#0a0a0c';ctx.lineWidth=9;ctx.beginPath();ctx.arc(x,y-h,w*.3,Math.PI,0);ctx.stroke();ctx.strokeStyle=sh(col,1.2);ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y-h,w*.3,Math.PI,0);ctx.stroke();
 ctx.fillStyle=WARM;ctx.fillRect(x-7,y-h*.62,14,9);ctx.fillStyle='rgba(255,255,255,.25)';rr(x-w/2+6,y-h+6,w*.35,h*.25,8);ctx.fill()})}
function sneaker(x,y,s,col){S(()=>{ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(-44,4);ctx.lineTo(-44,-26);ctx.quadraticCurveTo(-30,-40,-12,-30);ctx.lineTo(20,-16);ctx.quadraticCurveTo(48,-12,48,4);ctx.closePath();ctx.fill();
 ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-40,0);ctx.lineTo(-40,-24);ctx.quadraticCurveTo(-28,-35,-12,-26);ctx.lineTo(20,-12);ctx.quadraticCurveTo(43,-9,43,0);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-40,-6,83,6);ctx.strokeStyle=CR;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-20,-14);ctx.quadraticCurveTo(0,-4,22,-12);ctx.stroke()})}
function watch(x,y){S(()=>{ctx.fillStyle='#0a0a0c';rr(x-34,y-12,68,24,8);ctx.fill();ctx.fillStyle='#2a2a2e';rr(x-30,y-9,60,18,6);ctx.fill();
 ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(x,y-28,26,0,7);ctx.fill();ctx.fillStyle=lg(x-20,y-50,x+20,y-6,[[0,'#fff1d6'],[1,'#b88a4a']]);ctx.beginPath();ctx.arc(x,y-28,22,0,7);ctx.fill();ctx.fillStyle='#141416';ctx.beginPath();ctx.arc(x,y-28,16,0,7);ctx.fill();
 ctx.strokeStyle=WARM;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y-28);ctx.lineTo(x,y-40);ctx.moveTo(x,y-28);ctx.lineTo(x+8,y-24);ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(x-8,y-38,6,3,-.6,0,7);ctx.fill()})}
function priceTag(x,y,str,rot=.12){S(()=>{ctx.translate(x,y);ctx.rotate(rot);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-20,-70);ctx.lineTo(-30,-18);ctx.stroke();
 ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(-52,-18);ctx.lineTo(40,-18);ctx.lineTo(54,0);ctx.lineTo(40,18);ctx.lineTo(-52,18);ctx.closePath();ctx.fill();ctx.fillStyle='#f4efe6';ctx.beginPath();ctx.moveTo(-49,-15);ctx.lineTo(38,-15);ctx.lineTo(50,0);ctx.lineTo(38,15);ctx.lineTo(-49,15);ctx.closePath();ctx.fill();
 ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(-38,0,4,0,7);ctx.fill();ctx.font='800 20px Disp';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(str,4,1)})}
function storeBG(t){
 // backdrop
 ctx.fillStyle=lg(0,0,0,H,[[0,'#050506'],[.55,'#121115'],[.7,'#0e0d10'],[1,'#060607']]);ctx.fillRect(0,0,W,H);
 const SW=1355; // sidewalk top
 // facade
 S(()=>{ctx.fillStyle=lg(0,300,0,SW,[[0,'#0b0b0d'],[1,'#17161a']]);ctx.fillRect(0,300,W,SW-300);
  ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=2;for(let y=330;y<SW;y+=46){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  for(let y=330,i=0;y<SW;y+=46,i++)for(let x=(i%2)*70;x<W;x+=140){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+46);ctx.stroke()}
  // pilasters
  for(const x of [60,800]){ctx.fillStyle=lg(x,0,x+70,0,[[0,'#1d1c21'],[.5,'#26252b'],[1,'#121115']]);ctx.fillRect(x,640,70,SW-640);ctx.fillStyle='#0a0a0c';ctx.fillRect(x-6,630,82,16)}});
 // sign
 S(()=>{ctx.fillStyle='#08080a';ctx.fillRect(110,680,700,78);ctx.strokeStyle='#2a292f';ctx.lineWidth=3;ctx.strokeRect(110,680,700,78);
  ctx.fillStyle=rg(460,760,0,340,[[0,rgba(WARM,.35)],[1,rgba(WARM,0)]]);ctx.fillRect(110,756,700,120);
  txt('M A I S O N   V E R R E',460,720,'italic 400 42px Ser','#f3e6d2',{glow:16,gc:rgba(WARM,.7),ls:1})});
 // window interior
 const wx=140,wy=780,ww=640,wh=560;
 S(()=>{ctx.beginPath();ctx.rect(wx,wy,ww,wh);ctx.clip();
  ctx.fillStyle=lg(0,wy,0,wy+wh,[[0,'#2b2118'],[.5,'#3b2c1d'],[1,'#1a140f']]);ctx.fillRect(wx,wy,ww,wh);
  // back wall panels
  ctx.strokeStyle='rgba(255,220,170,.08)';ctx.lineWidth=2;for(let x=wx+80;x<wx+ww;x+=120){ctx.beginPath();ctx.moveTo(x,wy);ctx.lineTo(x,wy+wh);ctx.stroke()}
  // spotlights
  for(const [x,y] of [[260,800],[460,800],[660,800]]){ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(x,y,x,y+400,[[0,rgba(WARM,.55)],[1,rgba(WARM,0)]]);ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x-110,y+420);ctx.lineTo(x+110,y+420);ctx.lineTo(x+12,y);ctx.closePath();ctx.fill();ctx.restore();ctx.fillStyle='#fff6e2';ctx.shadowColor=WARM;ctx.shadowBlur=20;ctx.beginPath();ctx.ellipse(x,y+4,16,6,0,0,7);ctx.fill();ctx.shadowBlur=0}
  // shelves
  for(const y of [1000,1170]){ctx.fillStyle='rgba(255,240,215,.35)';ctx.fillRect(wx+30,y,ww-60,6);ctx.fillStyle='rgba(255,240,215,.08)';ctx.fillRect(wx+30,y+6,ww-60,22);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(wx+30,y+28,ww-60,10)}
  handbag(240,1000,96,78,'#8f1428');handbag(370,1000,84,70,'#1c1c22');handbag(560,1000,100,82,'#c9b79c');handbag(690,1000,74,62,'#5b5b63');
  sneaker(250,1170,1.05,'#e9e9ee');sneaker(400,1170,1.05,'#2b2b31');watch(560,1170);sneaker(690,1170,1,'#9e1830');
  // pedestal
  ctx.fillStyle='#0a0a0c';ctx.fillRect(330,1255,260,90);ctx.fillStyle=lg(0,1258,0,1345,[[0,'#d9cbb3'],[1,'#7d6f5c']]);ctx.fillRect(334,1259,252,86);
  // neon sale sign
  txt('70% OFF',460,828,'900 76px Black',CRL,{glow:34,gc:CR,ls:4});
  S(()=>{ctx.fillStyle='rgba(10,10,12,.85)';rr(355,852,210,38,10);ctx.fill();ctx.strokeStyle=rgba(CR,.9);ctx.lineWidth=2;ctx.stroke()});
  txt('ENDS IN 00:59:'+String(Math.max(0,59-Math.floor(t*3))%60).padStart(2,'0'),460,872,'700 20px Disp','#fff',{ls:3,glow:8});
  priceTag(300,1050,'$1,290',.1);priceTag(640,1225,'$489',-.12);
  // glass reflection
  ctx.globalCompositeOperation='screen';for(const [x,w,a] of [[180,60,.08],[270,24,.06],[560,90,.06],[700,30,.05]]){ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.beginPath();ctx.moveTo(x,wy);ctx.lineTo(x+w,wy);ctx.lineTo(x+w-260,wy+wh);ctx.lineTo(x-260,wy+wh);ctx.closePath();ctx.fill()}
 });
 // window frame
 S(()=>{ctx.strokeStyle='#060607';ctx.lineWidth=16;ctx.strokeRect(wx,wy,ww,wh);ctx.strokeStyle='#2c2b31';ctx.lineWidth=3;ctx.strokeRect(wx+7,wy+7,ww-14,wh-14);ctx.fillStyle='#060607';ctx.fillRect(wx+ww/2-6,wy,12,wh)});
 // door on right
 S(()=>{ctx.fillStyle='#0c0c0e';ctx.fillRect(880,830,170,SW-830);ctx.strokeStyle='#2a292f';ctx.lineWidth=3;ctx.strokeRect(895,850,140,SW-850);ctx.fillStyle=rg(965,1100,0,140,[[0,rgba(WARM,.12)],[1,rgba(WARM,0)]]);ctx.fillRect(895,850,140,SW-850);ctx.fillStyle='#bfa77f';ctx.fillRect(905,1120,8,60)});
 // sidewalk
 S(()=>{ctx.fillStyle=lg(0,SW,0,H,[[0,'#1d1c20'],[.35,'#121114'],[1,'#060607']]);ctx.fillRect(0,SW,W,H-SW);
  ctx.fillStyle='#2c2b30';ctx.fillRect(0,SW,W,6);
  const vx=540,vy=900;ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=2;for(let i=-10;i<=10;i++){const x=540+i*170;ctx.beginPath();ctx.moveTo(lerp(vx,x,(SW-vy)/(H-vy)),SW);ctx.lineTo(x,H);ctx.stroke()}
  let y=SW+20,g=24;while(y<H){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();y+=g;g*=1.35}
  // curb
  ctx.fillStyle='#232227';ctx.fillRect(0,1640,W,18);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,1640,W,2);ctx.fillStyle='#08080a';ctx.fillRect(0,1658,W,H-1658);
  // warm spill
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,SW,0,1640,[[0,rgba(WARM,.22)],[1,rgba(WARM,0)]]);ctx.beginPath();ctx.moveTo(wx,SW);ctx.lineTo(wx+ww,SW);ctx.lineTo(wx+ww+170,1640);ctx.lineTo(wx-120,1640);ctx.closePath();ctx.fill();
  // wet street reflections
  ctx.filter='blur(22px)';for(const [x,c,a] of [[300,WARM,.18],[460,CR,.22],[620,WARM,.14],[960,'#ffffff',.12]]){ctx.fillStyle=lg(0,1660,0,1920,[[0,rgba(c,a)],[1,rgba(c,0)]]);ctx.fillRect(x-30,1660,60,260)}});
 // street lamp
 const lx=990,ly=600;
 S(()=>{ctx.fillStyle='#0a0a0c';ctx.fillRect(lx-9,ly,18,1660-ly);ctx.fillStyle='#1d1c21';ctx.fillRect(lx-5,ly,6,1660-ly);
  ctx.strokeStyle='#0a0a0c';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(lx,ly+10);ctx.quadraticCurveTo(lx,ly-40,lx-80,ly-40);ctx.stroke();
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(lx-120,ly-30);ctx.lineTo(lx-40,ly-30);ctx.lineTo(lx-55,ly-60);ctx.lineTo(lx-105,ly-60);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=40;ctx.beginPath();ctx.ellipse(lx-80,ly-28,34,7,0,0,7);ctx.fill();ctx.shadowBlur=0;
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,ly-28,0,1500,[[0,'rgba(220,230,255,.2)'],[1,'rgba(220,230,255,0)']]);ctx.beginPath();ctx.moveTo(lx-110,ly-28);ctx.lineTo(lx-50,ly-28);ctx.lineTo(lx+150,1500);ctx.lineTo(lx-330,1500);ctx.closePath();ctx.fill();
  ctx.fillStyle=rg(lx-80,1470,0,260,[[0,'rgba(220,230,255,.18)'],[1,'rgba(220,230,255,0)']]);ctx.save();ctx.scale(1,.25);ctx.beginPath();ctx.arc(lx-80,1470/.25,260,0,7);ctx.fill();ctx.restore()});
 dust(700,600,380,900,60,t,.55,4);
}
// ================= SCENE B: same paycheck, two rooms =================
function box(x,y,w,h,tilt=0){S(()=>{ctx.translate(x,y);ctx.rotate(tilt);ctx.fillStyle='#0a0a0c';rr(-w/2-4,-h-4,w+8,h+8,5);ctx.fill();ctx.fillStyle=lg(-w/2,0,w/2,0,[[0,'#7a6650'],[1,'#4f4232']]);rr(-w/2,-h,w,h,3);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-w/2,-h,w,h*.18);ctx.fillStyle='#c9b48f';ctx.fillRect(-6,-h,12,h);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(w*.15,-h*.55,w*.25,h*.18)})}
function roomsBG(t){
 const FL=1420;
 ctx.fillStyle="#050506";ctx.fillRect(0,0,W,H);
 // LEFT ROOM (cold, TV/phone light)
 S(()=>{ctx.beginPath();ctx.rect(0,700,538,FL-700+260);ctx.clip();
  ctx.fillStyle=lg(0,700,0,FL,[[0,'#0d0f14'],[1,'#151821']]);ctx.fillRect(0,700,540,FL-700);
  // window with city
  ctx.fillStyle='#07080b';ctx.fillRect(250,780,230,250);const r=rng(4);for(let i=0;i<9;i++){const bx=255+i*26,bh=60+r()*150;ctx.fillStyle='#10131a';ctx.fillRect(bx,1025-bh,22,bh);for(let k=0;k<6;k++)if(r()<.45){ctx.fillStyle=r()<.2?rgba(CR,.8):'rgba(255,214,150,.75)';ctx.fillRect(bx+4+(k%2)*9,1025-bh+8+Math.floor(k/2)*16,5,7)}}
  ctx.strokeStyle='#22252e';ctx.lineWidth=10;ctx.strokeRect(250,780,230,250);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(365,780);ctx.lineTo(365,1030);ctx.stroke();
  // floor
  ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#1b1d25'],[1,'#0a0b0e']]);ctx.fillRect(0,FL,540,260);ctx.strokeStyle='rgba(255,255,255,.05)';for(let x=-200;x<700;x+=70){ctx.beginPath();ctx.moveTo(x,FL);ctx.lineTo(x-120,FL+260);ctx.stroke()}
  // couch
  ctx.fillStyle='#0a0a0c';rr(56,1166,420,190,30);ctx.fill();ctx.fillStyle=lg(0,1170,0,1350,[[0,'#3a3f4d'],[1,'#252833']]);rr(60,1170,412,182,28);ctx.fill();
  ctx.fillStyle='#0a0a0c';rr(40,1250,456,120,24);ctx.fill();ctx.fillStyle=lg(0,1254,0,1366,[[0,'#454b5b'],[1,'#2a2e39']]);rr(44,1254,448,112,22);ctx.fill();
  ctx.fillStyle='#0a0a0c';ctx.fillRect(70,1366,16,54);ctx.fillRect(452,1366,16,54);
  ctx.fillStyle='rgba(255,255,255,.08)';rr(70,1180,180,60,20);ctx.fill();rr(270,1180,180,60,20);ctx.fill();
  // boxes
  box(80,FL+30,110,80,-.04);box(95,FL-50,80,60,.06);box(470,FL+40,90,70,.08);box(160,FL+70,70,50,-.1);
  // TV glow from left
  ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(0,1150,0,520,[[0,'rgba(90,120,255,.28)'],[1,'rgba(90,120,255,0)']]);ctx.fillRect(0,700,540,900);
 });
 // RIGHT ROOM (warm, desk lamp)
 S(()=>{ctx.beginPath();ctx.rect(542,700,538,FL-700+260);ctx.clip();
  ctx.fillStyle=lg(0,700,0,FL,[[0,'#141210'],[1,'#1d1a16']]);ctx.fillRect(540,700,540,FL-700);
  // shelf with books
  ctx.fillStyle='#0a0a0c';ctx.fillRect(600,900,300,14);ctx.fillStyle='#2e2924';ctx.fillRect(602,900,296,10);
  const r=rng(8);let bx=612;while(bx<880){const bw=14+r()*12,bh=60+r()*40,c=['#3d3833','#5a5048','#8a7a66','#2a2724','#6b2230'][Math.floor(r()*5)];ctx.fillStyle='#0a0a0c';ctx.fillRect(bx-2,900-bh-2,bw+4,bh+2);ctx.fillStyle=c;ctx.fillRect(bx,900-bh,bw,bh);bx+=bw+3}
  // frame on wall: chart
  ctx.fillStyle='#0a0a0c';ctx.fillRect(930,820,120,150);ctx.fillStyle='#e9e2d6';ctx.fillRect(938,828,104,134);ctx.strokeStyle='#2b2b2b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(948,945);ctx.lineTo(975,925);ctx.lineTo(995,932);ctx.lineTo(1030,860);ctx.stroke();
  // floor
  ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#26221d'],[1,'#0d0c0a']]);ctx.fillRect(540,FL,540,260);ctx.strokeStyle='rgba(255,255,255,.05)';for(let x=400;x<1300;x+=70){ctx.beginPath();ctx.moveTo(x,FL);ctx.lineTo(x+120,FL+260);ctx.stroke()}
  // desk
  ctx.fillStyle='#0a0a0c';ctx.fillRect(780,1236,290,22);ctx.fillRect(800,1256,16,FL-1256);ctx.fillRect(1040,1256,16,FL-1256);ctx.fillStyle=lg(0,1238,0,1256,[[0,'#7a644a'],[1,'#4a3c2c']]);ctx.fillRect(782,1238,286,16);
  // laptop
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(850,1238);ctx.lineTo(990,1238);ctx.lineTo(1010,1232);ctx.lineTo(845,1232);ctx.fill();ctx.save();ctx.translate(960,1232);ctx.rotate(-.22);ctx.fillStyle='#0a0a0c';rr(-6,-118,16,122,4);ctx.fill();ctx.restore();
  // lamp
  ctx.strokeStyle='#0a0a0c';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(1035,1238);ctx.lineTo(1050,1120);ctx.lineTo(990,1080);ctx.stroke();ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(1010,1060);ctx.lineTo(960,1100);ctx.lineTo(990,1112);ctx.closePath();ctx.fill();
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,1095,0,1300,[[0,rgba(WARM,.45)],[1,rgba(WARM,0)]]);ctx.beginPath();ctx.moveTo(975,1100);ctx.lineTo(990,1110);ctx.lineTo(1060,1260);ctx.lineTo(820,1260);ctx.closePath();ctx.fill();
  ctx.fillStyle=rg(930,1240,0,260,[[0,rgba(WARM,.25)],[1,rgba(WARM,0)]]);ctx.fillRect(660,1000,420,420);
  // plant
  ctx.globalCompositeOperation='source-over';ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(600,FL);ctx.lineTo(590,1350);ctx.lineTo(660,1350);ctx.lineTo(650,FL);ctx.fill();ctx.fillStyle='#3b3631';ctx.beginPath();ctx.moveTo(604,FL-4);ctx.lineTo(596,1354);ctx.lineTo(654,1354);ctx.lineTo(646,FL-4);ctx.fill();
  for(let i=0;i<7;i++){const a=-1.4+i*.45;ctx.save();ctx.translate(625,1352);ctx.rotate(a);ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.ellipse(0,-58,17,48,0,0,7);ctx.fill();ctx.fillStyle=i%2?'#4d5a4a':'#3c4739';ctx.beginPath();ctx.ellipse(0,-58,13,44,0,0,7);ctx.fill();ctx.restore()}
 });
 // chair + steady (woman, bun) sitting at desk
 S(()=>{ctx.fillStyle='#0a0a0c';ctx.fillRect(680,1290,120,18);ctx.fillRect(732,1306,14,FL-1306);ctx.fillRect(690,FL-6,100,8);ctx.fillRect(668,1150,16,150)});
}

// ================= characters =================
const REA={skin:'#a9a9b1',top:'#5d5d66',bot:'#34343c',shoe:'#e6e6ea',outfit:'hoodie',hair:'cap',hairCol:'#9a1830'};
const STE={skin:'#f7f7f9',top:'#d6d7dd',bot:'#8c8d96',shoe:'#ffffff',outfit:'tee',hair:'short',hairCol:'#2a2a30',glow:1};
const MAN={skin:'#8a8a93',top:'#141418',bot:'#141418',shoe:'#0f0f12',outfit:'suit',hair:'short',hairCol:'#060607'};
const Pz=(o)=>Object.assign({lean:0,hd:0,aF:[.12,.1],aB:[-.12,.1],lF:[.06,0],lB:[-.06,0]},o);
function lpz(a,b,k){const o={};for(const key in a){o[key]=Array.isArray(a[key])?a[key].map((v,i)=>lerp(v,b[key][i],k)):lerp(a[key],b[key],k)}return o}
function walkP(ph,amp=1){const s=Math.sin(ph),c=Math.cos(ph);return Pz({lean:.05,aF:[-.4*s*amp,.3],aB:[.4*s*amp,.3],lF:[.42*s*amp,-Math.max(0,c)*.75*amp],lB:[-.42*s*amp,-Math.max(0,-c)*.75*amp]})}
function runP(ph){const s=Math.sin(ph),c=Math.cos(ph);return Pz({lean:.2,hd:-.08,aF:[-.75*s,1.7],aB:[.75*s,1.7],lF:[.75*s,-Math.max(0,c)*1.4-.2],lB:[-.75*s,-Math.max(0,-c)*1.4-.2]})}
const GUARD=Pz({lean:.1,hd:.12,aF:[.75,2.25],aB:[.55,2.45],lF:[.32,-.12],lB:[-.3,.08]});
const JAB=Pz({lean:.2,hd:.15,aF:[1.58,.02],aB:[.55,2.45],lF:[.4,-.1],lB:[-.36,.1]});
const WIND=Pz({lean:-.12,hd:0,aF:[-1.1,1.0],aB:[.6,1.9],lF:[.3,-.1],lB:[-.34,.05]});
const HAY=Pz({lean:.38,hd:.2,aF:[2.0,.35],aB:[.2,1.4],lF:[.5,-.25],lB:[-.45,.2]});
const SLIP=Pz({lean:-.4,hd:-.2,aF:[.7,2.3],aB:[.5,2.5],lF:[.2,-.2],lB:[-.38,.12]});
const HIT=Pz({lean:-.35,hd:-.45,aF:[.3,1.2],aB:[-.4,.6],lF:[.2,-.1],lB:[-.45,.15]});
const SIT=Pz({lean:-.12,hd:.5,aF:[.7,1.45],aB:[.6,1.55],lF:[1.45,-1.45],lB:[1.35,-1.35]});
const DESK=Pz({lean:.12,hd:.25,aF:[.95,.75],aB:[.85,.9],lF:[1.5,-1.5],lB:[1.4,-1.4]});
const SHRUG=Pz({lean:-.03,hd:-.1,aF:[.5,-1.3],aB:[-.5,1.3],lF:[.06,0],lB:[-.06,0]});
const ANGRY=Pz({lean:.18,hd:.1,aF:[.35,.9],aB:[-.3,.9],lF:[.12,0],lB:[-.12,0]});
const CARD=Pz({lean:.15,hd:0,aF:[1.45,-.15],aB:[-.25,.4],lF:[.18,0],lB:[-.14,0]});
const SLUMP=Pz({lean:.32,hd:.55,aF:[.15,.6],aB:[.1,.6],lF:[.08,.08],lB:[-.08,.08]});
const TALL=Pz({lean:-.02,hd:-.06});
function phone(J,glow=1){S(()=>{const [x,y]=J.handF;ctx.translate(x+4*J.f,y-12);ctx.rotate(-.45*J.f);ctx.fillStyle='#0a0a0c';rr(-12,-21,24,42,6);ctx.fill();ctx.fillStyle=lg(0,-18,0,18,[[0,'#e9f1ff'],[1,'#9fb4ff']]);rr(-9,-18,18,36,4);ctx.fill()});
 S(()=>{ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(J.handF[0],J.handF[1]-30,0,130,[[0,`rgba(170,195,255,${.38*glow})`],[1,'rgba(170,195,255,0)']]);ctx.fillRect(J.handF[0]-140,J.handF[1]-170,280,280)})}
// ================= HUD (animated) =================
function HUD(u,title,vl,vr,o={}){const k=eo(seg(u,.15,.6));if(k<=0)return;
 S(()=>{ctx.fillStyle=lg(0,420,0,700,[[0,'rgba(0,0,0,.7)'],[1,'rgba(0,0,0,0)']]);ctx.fillRect(0,420,W,280)});
 [[290,'REACTIVE',CRL,.15],[790,'STEADY','#fff',.3]].forEach(([x,l,c,d])=>{const kk=eo(seg(u,d,d+.45));A(kk,()=>txt(l,x,575+(1-kk)*14,'700 36px Disp',c,{ls:11,glow:14,gc:c==CRL?rgba(CR,.7):'rgba(255,255,255,.4)'}))});
 A(k,()=>S(()=>{ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(540,575-34*k);ctx.lineTo(540,575+34*k);ctx.stroke()}))}
function pop(u,t0,fn,dur=99){const k=seg(u,t0,t0+.28);if(k<=0||u>t0+dur)return;const e=eback(k);const out=1-seg(u,t0+dur-.2,t0+dur);A(clamp(k*3)*out,()=>fn(e))}
function B(){}
function zig(x,y,u,a=1){A(a,()=>S(()=>{ctx.strokeStyle=CRL;ctx.shadowColor=CR;ctx.shadowBlur=14;ctx.lineWidth=5;ctx.lineCap='round';for(let i=0;i<3;i++){const an=-2.3+i*.65+Math.sin(u*20+i)*.05,r1=48,r2=86;ctx.beginPath();for(let k=0;k<=4;k++){const r=lerp(r1,r2,k/4),o=(k%2?1:-1)*8;const px=x+Math.cos(an)*r-Math.sin(an)*o,py=y+Math.sin(an)*r+Math.cos(an)*o;k?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke()}}))}
function bigText(u,t0,l1,em,y=470){const k=eo(seg(u,t0,t0+.5));if(k<=0)return;S(()=>{ctx.globalAlpha*=k;if(k<1)ctx.filter=`blur(${(1-k)*12}px)`;
 if(em==null){const yy=y+(1-k)*20;ctx.font='500 30px Lab';ctx.letterSpacing='10px';const w=ctx.measureText(l1).width;txt(l1,540,yy,'500 30px Lab','rgba(255,255,255,.78)',{ls:10,glow:6,gc:'rgba(255,255,255,.25)'});
  ctx.filter='none';const lk=eio(seg(u,t0+.2,t0+.7));ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1.5;[[-1],[1]].forEach(([d])=>{const x0=540+d*(w/2+26);ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x0+d*48*lk,yy);ctx.stroke()});return}
 let sz=94;for(;;){ctx.font=`italic 400 ${sz}px Ser`;if(ctx.measureText(l1+em).width<=940||sz<50)break;sz-=2}
 const a=ctx.measureText(l1).width,b=ctx.measureText(em).width;const x0=540-(a+b)/2;
 txt(l1,x0,y,`italic 400 ${sz}px Ser`,'#f4f1ec',{align:'left',glow:20,gc:'rgba(255,255,255,.35)'});txt(em,x0+a,y,`italic 400 ${sz}px Ser`,CRL,{align:'left',glow:22,gc:rgba(CR,.6)});
 const uk=eio(seg(u,t0+.35,t0+.8));ctx.filter='none';const hw=(a+b)*.18*uk;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(540-hw,y+sz*.55);ctx.lineTo(540+hw,y+sz*.55);ctx.stroke();
 ctx.fillStyle=CRL;ctx.globalAlpha*=uk;ctx.beginPath();ctx.arc(540,y+sz*.55,3,0,7);ctx.fill()})}
function counter(from,to,u,t0,t1){const v=Math.round(lerp(from,to,eio(seg(u,t0,t1))));return '$'+v.toLocaleString('en-US')}


// ================= detail fx =================
let SHK=0;
function rain(u,a=1,seed=1,x0=0,y0=380,w=W,h=1500,n=150,len=34){const r=rng(seed);S(()=>{ctx.strokeStyle='rgba(200,210,235,1)';ctx.lineWidth=1.6;ctx.lineCap='round';for(let i=0;i<n;i++){const sp=1500+r()*700,x=x0+((r()*w+u*-140)%w+w)%w,y=y0+((r()*h+u*sp)%h);ctx.globalAlpha=a*(.12+r()*.25);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.12,y+len);ctx.stroke()}})}
function splashes(u,y0,y1,n=26,seed=4,a=1){const r=rng(seed);S(()=>{ctx.strokeStyle='rgba(220,228,245,1)';ctx.lineWidth=1.5;for(let i=0;i<n;i++){const per=.35+r()*.4,ph=r(),x=r()*W,y=y0+r()*(y1-y0),k=((u/per+ph)%1);ctx.globalAlpha=a*(1-k)*.45;ctx.beginPath();ctx.ellipse(x,y,4+k*16,(4+k*16)*.28,0,0,7);ctx.stroke()}})}
function headlights(u,t0,dur,y,dir=1){const k=seg(u,t0,t0+dur);if(k<=0||k>=1)return;const x=dir>0?lerp(-500,1600,k):lerp(1600,-500,k);
 S(()=>{ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(x,y,0,520,[[0,'rgba(255,245,225,.35)'],[1,'rgba(255,245,225,0)']]);ctx.fillRect(x-560,y-560,1120,1120);ctx.fillStyle=`rgba(255,240,220,${.06*Math.sin(Math.PI*k)})`;ctx.fillRect(0,0,W,H)});
 S(()=>{ctx.translate(x-dir*220,y+70);ctx.scale(dir*.55,.55);ctx.fillStyle='#030304';ctx.beginPath();ctx.moveTo(-330,-30);ctx.quadraticCurveTo(-330,-80,-260,-92);ctx.lineTo(-140,-110);ctx.quadraticCurveTo(-60,-170,60,-168);ctx.quadraticCurveTo(170,-160,230,-110);ctx.lineTo(320,-96);ctx.quadraticCurveTo(352,-80,350,-30);ctx.lineTo(350,10);ctx.lineTo(-330,10);ctx.closePath();ctx.fill();ctx.fillStyle='#fff6e0';ctx.shadowColor='#fff';ctx.shadowBlur=40;rr(318,-70,30,14,5);ctx.fill();ctx.fillStyle=CRL;ctx.shadowColor=CR;rr(-332,-66,20,12,4);ctx.fill()})}
function birds(u,x0,x1,y,seed=2){const r=rng(seed);S(()=>{ctx.strokeStyle='#120e0c';ctx.lineWidth=3;ctx.lineCap='round';for(let i=0;i<4;i++){const sp=60+r()*50,x=x0+((r()*400+u*sp)%(x1-x0+80))-40,yy=y+r()*60+Math.sin(u*2+i)*6,f=Math.sin(u*14+i*2)*6;ctx.beginPath();ctx.moveTo(x-10,yy-f);ctx.quadraticCurveTo(x-4,yy-2,x,yy);ctx.quadraticCurveTo(x+4,yy-2,x+10,yy-f);ctx.stroke()}})}
function droplets(x,y,u,t0,n=10,seed=1,col='#ffffff'){const k=seg(u,t0,t0+.6);if(k<=0||k>=1)return;const r=rng(seed);S(()=>{ctx.fillStyle=col;for(let i=0;i<n;i++){const a=-Math.PI*(.15+r()*.7)*(r()<.5?1:-1)-Math.PI/2*0,v=120+r()*260,vx=Math.cos(a)*v*(r()<.5?-1:1),vy=-Math.abs(Math.sin(a))*v;const px=x+vx*k,py=y+vy*k+700*k*k;ctx.globalAlpha=(1-k)*.9;ctx.beginPath();ctx.ellipse(px,py,3,4.5,0,0,7);ctx.fill()}})}
function steam(x,y,u,a=1){S(()=>{ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;ctx.lineCap='round';for(let i=0;i<3;i++){const k=((u*.5+i/3)%1);ctx.globalAlpha=a*(1-k)*.7*Math.min(1,k*4);ctx.beginPath();for(let j=0;j<=10;j++){const yy=y-k*90-j*5,xx=x+(i-1)*9+Math.sin(j*.7+u*3+i)*6;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke()}})}
function mirror(axis,a,fn){S(()=>{ctx.globalAlpha*=a;ctx.translate(0,2*axis);ctx.scale(1,-1);fn()})}

// ================= stage (intro/outro) =================
function stage(u,lights){ctx.fillStyle=lg(0,0,0,H,[[0,'#040405'],[.6,'#0d0d10'],[1,'#050506']]);ctx.fillRect(0,0,W,H);
 const FY=1420;S(()=>{ctx.fillStyle=lg(0,FY,0,H,[[0,'#17171b'],[1,'#050506']]);ctx.fillRect(0,FY,W,H-FY);ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=2;for(let i=-8;i<=8;i++){ctx.beginPath();ctx.moveTo(540+i*60,FY);ctx.lineTo(540+i*260,H);ctx.stroke()}let y=FY+14,g=18;while(y<H){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();y+=g;g*=1.3}});
 lights.forEach(([x,a,col])=>{if(a<=0)return;S(()=>{ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,560,0,FY,[[0,rgba(col,.0)],[.2,rgba(col,.22*a)],[1,rgba(col,.1*a)]]);ctx.beginPath();ctx.moveTo(x-30,560);ctx.lineTo(x+30,560);ctx.lineTo(x+190,FY);ctx.lineTo(x-190,FY);ctx.closePath();ctx.fill();
  ctx.fillStyle=rg(x,FY,0,220,[[0,rgba(col,.35*a)],[1,rgba(col,0)]]);ctx.save();ctx.scale(1,.2);ctx.beginPath();ctx.arc(x,FY/.2,220,0,7);ctx.fill();ctx.restore()})});
 dust(150,700,780,700,50,u,.4,2)}
function flick(u,t0){if(u<t0)return 0;const d=u-t0;if(d>.45)return 1;return [1,0,1,0,.6,1][Math.floor(d/.075)]??1}
function sIntro(u){const a1=flick(u,.15),a2=flick(u,.55);stage(u,[[330,a1,'#ff8a9c'],[750,a2,'#ffffff']]);
 const step=eio(seg(u,.6,3.4));const rxI=lerp(320,380,step),sxI=lerp(760,700,step);
 const fe=Math.max(...[1.5,2.5].map(t0=>seg(u,t0,t0+.08)*(1-seg(u,t0+.12,t0+.26))));
 const prI=()=>lpz(Pz({...GUARD,hd:GUARD.hd+Math.sin(u*6.5)*.08,lean:GUARD.lean+Math.sin(u*9)*.04,aF:[GUARD.aF[0]-.15+Math.sin(u*7)*.12,GUARD.aF[1]-.2]}),JAB,fe*.7);
 const psI=()=>Pz({...GUARD,lean:GUARD.lean+Math.sin(u*4)*.015});
 const byR=-Math.abs(Math.sin(u*9))*10,byS=-Math.abs(Math.sin(u*5))*4;
 A(.25+.75*a1,()=>person({x:rxI,y:1420+byR,s:1.25,f:1,pose:prI(),...REA}));
 A(.25+.75*a2,()=>person({x:sxI,y:1420+byS,s:1.25,f:-1,pose:psI(),...STE,glow:a2}));
 mirror(1420,.13*a1,()=>person({x:rxI,y:1420+byR,s:1.25,f:1,noShadow:true,pose:prI(),...REA}));mirror(1420,.16*a2,()=>person({x:sxI,y:1420+byS,s:1.25,f:-1,noShadow:true,pose:psI(),...STE,glow:0}));
 A(a1,()=>txt('REACTIVE',330,1490,'700 30px Disp',CRL,{ls:9,glow:12,gc:CR}));A(a2,()=>txt('STEADY',750,1490,'700 30px Disp','#fff',{ls:9,glow:12}));
 bigText(u,.9,'SAME AGE. SAME CITY.',null,520);bigText(u,1.9,'Different ','mind.',640)}
function sOutro(u){const a=1-seg(u,.3,1.2)*.75;stage(u,[[300,a*.6,'#ff8a9c'],[760,1,'#ffffff']]);
 // light doorway
 S(()=>{const k=eo(seg(u,.2,1));ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(980,1280,0,420,[[0,`rgba(255,240,215,${.55*k})`],[1,'rgba(255,240,215,0)']]);ctx.fillRect(560,800,520,700);ctx.fillStyle=`rgba(255,246,230,${.9*k})`;ctx.fillRect(950,1040,110,380)});
 rays(1000,1230,-Math.PI/2+.05,.7,760,.07*eo(seg(u,.2,1)),8,6);dust(560,900,500,500,40,u,.6,9);
 A(.35+.65*a,()=>{const J=person({x:300,y:1420,s:1.2,f:1,pose:SLUMP,...REA,frontProp:J=>phone(J,.8)})});
 const wx=lerp(700,880,eio(seg(u,.8,4)));person({x:wx,y:1420,s:1.2,f:1,pose:walkP(u*7.5,1),...STE,outfit:'coat',top:'#e3e4ea',coatSwing:Math.sin(u*7.5)});
 bigText(u,.4,'SAME 24 HOURS.',null,520);bigText(u,1.5,'Different ','choices.',640)}

// ================= morning =================
function sMorning(u){ctx.fillStyle='#050506';ctx.fillRect(0,0,W,H);const FL=1420;
 // LEFT bedroom
 S(()=>{ctx.beginPath();ctx.rect(0,700,538,980);ctx.clip();ctx.fillStyle=lg(0,700,0,FL,[[0,'#0b0d13'],[1,'#121520']]);ctx.fillRect(0,700,540,FL-700);
  ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#191b23'],[1,'#08090c']]);ctx.fillRect(0,FL,540,260);
  // curtain window (dark)
  ctx.fillStyle='#07080b';ctx.fillRect(290,790,190,210);ctx.fillStyle='#1c2030';for(let i=0;i<6;i++){ctx.fillRect(290+i*32,790,22,210)}ctx.fillStyle='#0a0a0c';ctx.fillRect(280,780,210,12);
  // bed
  ctx.fillStyle='#0a0a0c';rr(60,1250,440,110,16);ctx.fill();ctx.fillStyle=lg(0,1254,0,1356,[[0,'#3b4152'],[1,'#252a37']]);rr(64,1254,432,102,14);ctx.fill();ctx.fillStyle='#0a0a0c';ctx.fillRect(56,1130,26,290);ctx.fillRect(480,1220,22,200);ctx.fillRect(80,1356,14,64);ctx.fillRect(468,1356,14,64);
  ctx.fillStyle='#0a0a0c';rr(86,1206,120,52,20);ctx.fill();ctx.fillStyle='#d9dbe3';rr(90,1210,112,44,18);ctx.fill();
  // nightstand + clock
  ctx.fillStyle='#0a0a0c';ctx.fillRect(-10,1250,60,170)});
 const ring=u<2.6;const shake=ring?Math.sin(u*70)*4:0;
 S(()=>{const cx=30+shake,cy=1222;ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(cx,cy,28,0,7);ctx.fill();ctx.fillStyle=ring&&Math.floor(u*6)%2?CRL:'#cfd2da';ctx.beginPath();ctx.arc(cx,cy,23,0,7);ctx.fill();ctx.fillStyle='#0a0a0c';ctx.fillRect(cx-1.5,cy-16,3,16);ctx.fillRect(cx,cy-1.5,11,3);
  if(ring){ctx.strokeStyle=CRL;ctx.lineWidth=3;ctx.shadowColor=CR;ctx.shadowBlur=10;for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(cx,cy,38+i*12+(u*40%12),-1.1,-.3);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,38+i*12+(u*40%12),-2.8,-2.0);ctx.stroke()}}});
 // lying person (head left)
 const reach=[[.5,1.0],[1.4,1.9]].some(([a,b])=>u>a&&u<b);const scroll=u>2.8;
 S(()=>{ctx.translate(460,1255);ctx.rotate(-Math.PI/2);
  const J=person({x:0,y:0,s:1.05,f:1,noShadow:true,pose:Pz({hd:0,aF:reach?[2.6,.1]:scroll?[1.2,1.6]:[.1,.1],aB:[-.05,.1],lF:[.03,0],lB:[-.03,0]}),...REA,hair:'none',
   frontProp:J=>{if(scroll)phone(J,1)}})});
 // blanket
 S(()=>{ctx.fillStyle='#0a0a0c';rr(200,1196,300,70,26);ctx.fill();ctx.fillStyle=lg(0,1200,0,1262,[[0,'#6c7387'],[1,'#3d4354']]);rr(204,1200,292,62,24);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(240,1214);ctx.quadraticCurveTo(330,1206,470,1216);ctx.stroke()});
 // zzz
 if(!scroll)A(.8,()=>{for(let i=0;i<3;i++){const k=((u*.8+i/3)%1);txt('z',170+k*60,1150-k*90,`700 ${22+k*20}px Disp`,'rgba(255,255,255,.8)',{glow:8});}});
 B(u,1.0,200,1080,'5 MORE MIN...',{col:CRL,thought:true,tx:-20},1.6);
 // RIGHT: dawn room + treadmill
 S(()=>{ctx.beginPath();ctx.rect(542,700,538,980);ctx.clip();ctx.fillStyle=lg(0,700,0,FL,[[0,'#171410'],[1,'#211c16']]);ctx.fillRect(540,700,540,FL-700);
  ctx.fillStyle='#0a0a0c';ctx.fillRect(610,780,300,250);ctx.fillStyle=lg(0,786,0,1024,[[0,'#2a2430'],[.55,'#a8644a'],[.8,'#f0b27a'],[1,'#ffd9a0']]);ctx.fillRect(618,788,284,236);
  ctx.fillStyle='#fff3da';ctx.shadowColor='#ffcf8a';ctx.shadowBlur=40;ctx.beginPath();ctx.arc(760,1024,46,Math.PI,0);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#1a1512';for(let i=0;i<7;i++){const bh=30+((i*37)%60);ctx.fillRect(620+i*42,1024-bh,36,bh)}
  ctx.fillStyle='#0a0a0c';ctx.fillRect(756,788,8,236);ctx.fillRect(618,900,284,8);
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,1024,0,FL,[[0,'rgba(255,200,140,.18)'],[1,'rgba(255,200,140,0)']]);ctx.beginPath();ctx.moveTo(618,1024);ctx.lineTo(902,1024);ctx.lineTo(1080,FL);ctx.lineTo(560,FL);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#2a241d'],[1,'#0d0b09']]);ctx.fillRect(540,FL,540,260);
  // wall clock
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(990,860,40,0,7);ctx.fill();ctx.fillStyle='#e9e2d6';ctx.beginPath();ctx.arc(990,860,34,0,7);ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(990,860);ctx.lineTo(990,834);ctx.moveTo(990,860);ctx.lineTo(990,880);ctx.stroke();
  // treadmill
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(600,1400);ctx.lineTo(960,1400);ctx.lineTo(975,1360);ctx.lineTo(610,1372);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2c2c33';ctx.beginPath();ctx.moveTo(612,1394);ctx.lineTo(956,1394);ctx.lineTo(968,1366);ctx.lineTo(618,1376);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=3;for(let i=0;i<9;i++){const x=620+((i*44-u*420)%396+396)%396;ctx.beginPath();ctx.moveTo(x,1388);ctx.lineTo(x+16,1388);ctx.stroke()}
  ctx.strokeStyle='#0a0a0c';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(950,1372);ctx.lineTo(990,1170);ctx.lineTo(950,1160);ctx.stroke();ctx.fillStyle='#0a0a0c';rr(948,1140,70,40,8);ctx.fill();ctx.fillStyle='#ffcf8a';ctx.shadowColor='#ffcf8a';ctx.shadowBlur=10;rr(955,1147,56,24,5);ctx.fill();ctx.shadowBlur=0;
  txt((5*eio(seg(u,.2,5.5))).toFixed(1),983,1160,'800 16px Disp','#0a0a0c')});
 S(()=>{ctx.beginPath();ctx.rect(618,788,284,236);ctx.clip();birds(u,600,920,850)});
 const ph=u*15;[.3,1.1,1.9,2.7,3.5,4.3,5.1].forEach((t0,i)=>droplets(800,1376-300,u,t0,6,i+3,'#cfe3ff'));person({x:780,y:1376+Math.abs(Math.sin(ph))*-6,s:1.08,f:1,pose:runP(ph),...STE});
 B(u,2.2,800,1080,'DAY 214.',{tx:-20,tdx:-4},2.6);
 S(()=>{ctx.fillStyle='#050506';ctx.fillRect(534,700,12,980);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(546,700,2,980);ctx.fillRect(0,690,W,14)});
 const sn=Math.min(4,1+Math.floor(u/1.1));HUD(u,'6:00 AM',`SNOOZE ×${sn}`,(5*eio(seg(u,.2,5.5))).toFixed(1)+' KM',{size:78});
 vignette(.8)}

// ================= ring =================
function sRing(u){ctx.fillStyle=lg(0,0,0,H,[[0,'#040405'],[.55,'#0e0e11'],[1,'#050506']]);ctx.fillRect(0,0,W,H);
 const FL=1330;
 // crowd back (dim)
 S(()=>{const r=rng(12);for(let row=0;row<2;row++)for(let i=0;i<14;i++){const x=20+i*78+(row?39:0)+r()*14,y=980+row*70+r()*12;ctx.fillStyle=row?'#121216':'#0d0d10';ctx.beginPath();ctx.arc(x,y,26,0,7);ctx.fill();ctx.fillRect(x-34,y+20,68,120)}
  for(let i=0;i<6;i++){const x=80+i*190+((u*30+i*50)%40);if((Math.floor(u*3+i)%5)==0){ctx.fillStyle='rgba(255,255,255,.9)';ctx.shadowColor='#fff';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(x,990,6,0,7);ctx.fill();ctx.shadowBlur=0}}});
 // overhead rig
 S(()=>{ctx.fillStyle='#0a0a0c';ctx.fillRect(140,760,800,18);for(let i=0;i<5;i++){const x=200+i*170;ctx.fillStyle='#0a0a0c';rr(x-26,776,52,30,6);ctx.fill();ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=24;ctx.fillRect(x-18,804,36,5);ctx.shadowBlur=0}
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,800,0,FL,[[0,'rgba(255,255,255,.2)'],[1,'rgba(255,255,255,.05)']]);ctx.beginPath();ctx.moveTo(170,806);ctx.lineTo(910,806);ctx.lineTo(1040,FL);ctx.lineTo(40,FL);ctx.closePath();ctx.fill()});
 dust(120,820,840,500,60,u,.5,8);
 // ring floor + apron
 S(()=>{ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(60,FL+10);ctx.lineTo(1020,FL+10);ctx.lineTo(1060,FL+110);ctx.lineTo(20,FL+110);ctx.closePath();ctx.fill();
  ctx.fillStyle=lg(0,FL-20,0,FL+12,[[0,'#d9d9de'],[1,'#a3a3aa']]);ctx.beginPath();ctx.moveTo(110,FL-30);ctx.lineTo(970,FL-30);ctx.lineTo(1010,FL+8);ctx.lineTo(70,FL+8);ctx.closePath();ctx.fill();
  ctx.fillStyle=lg(0,FL+12,0,FL+106,[[0,'#7a1426'],[1,'#3a0812']]);ctx.beginPath();ctx.moveTo(72,FL+14);ctx.lineTo(1008,FL+14);ctx.lineTo(1044,FL+104);ctx.lineTo(36,FL+104);ctx.closePath();ctx.fill();
  txt('S T E A D Y   G Y M',540,FL+60,'800 30px Disp','rgba(255,255,255,.75)',{ls:4})});
 // back ropes + posts
 const posts=[[110,FL-30],[970,FL-30]];
 S(()=>{for(const [x,y] of posts){ctx.fillStyle='#0a0a0c';ctx.fillRect(x-14,y-300,28,300);ctx.fillStyle='#2b2b31';ctx.fillRect(x-8,y-300,10,300);ctx.fillStyle=CR;rr(x-18,y-310,36,40,8);ctx.fill()}
  [[FL-110,'#e9e9ee'],[FL-190,CR],[FL-270,'#e9e9ee']].forEach(([y,c])=>{ctx.strokeStyle='#0a0a0c';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(110,y-30);ctx.quadraticCurveTo(540,y-18,970,y-30);ctx.stroke();ctx.strokeStyle=sh(c==CR?'#d4223f':'#e9e9ee',.7);ctx.lineWidth=6;ctx.stroke()})});
 person({x:(globalThis.__REFX??540)+Math.sin(u*1.3)*40,y:FL-70,s:.98,f:Math.sin(u*1.3)>0?-1:1,pose:Pz({lean:.12,hd:.1,aF:[.5,.6],aB:[-.2,.5],lF:[.15,0],lB:[-.15,0]}),skin:'#8e8e97',top:'#17171b',bot:'#17171b',shoe:'#0d0d10',outfit:'tee',hair:'short',hairCol:'#060607'});
 S(()=>{ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,FL-60)});
 // choreo
 const by=Math.sin(u*7)*5,by2=Math.sin(u*7+1.4)*5;
 let pr=GUARD,ps=GUARD,rx=380,sx=700;
 const k1=seg(u,1.0,1.35),k2=seg(u,1.35,1.6),k3=seg(u,1.6,1.9); // reactive haymaker #1
 if(u>1.0&&u<1.9)pr=k2>0?(k3>0?lpz(HAY,GUARD,eo(k3)):lpz(WIND,HAY,eo(k2))):lpz(GUARD,WIND,eo(k1));
 const sl=seg(u,1.3,1.5)*(1-seg(u,1.75,2.0));ps=lpz(GUARD,SLIP,eo(sl));
 // steady jab x2
 [[2.05],[3.65],[3.95]].forEach(([t0])=>{const a=seg(u,t0,t0+.09),b=seg(u,t0+.14,t0+.3);if(u>t0&&u<t0+.3)ps=lpz(lpz(GUARD,JAB,eo(a)),GUARD,eo(b))});
 const hitk=[2.12,3.72,4.02].reduce((m,t0)=>Math.max(m,u>t0?Math.exp(-(u-t0)*6)*(u<t0+.6?1:0):0),0);
 // reactive second wild swing
 const k4=seg(u,2.8,3.1),k5=seg(u,3.1,3.3),k6=seg(u,3.3,3.55);if(u>2.8&&u<3.55)pr=k5>0?(k6>0?lpz(HAY,GUARD,eo(k6)):lpz(WIND,HAY,eo(k5))):lpz(GUARD,WIND,eo(k4));
 const sl2=seg(u,3.05,3.2)*(1-seg(u,3.4,3.6));if(sl2>0)ps=lpz(GUARD,SLIP,eo(sl2));
 if(hitk>.02)pr=lpz(pr,HIT,hitk);
 const push=[2.12,3.72,4.02].reduce((m,t0)=>m+(u>t0?eo(seg(u,t0,t0+.4))*28:0),0);
 rx=405-push+Math.sin(u*2)*8;sx=640-Math.min(push*.4,30)+Math.sin(u*2+1)*6;
 const tired=seg(u,4.3,5);if(tired>0)pr=lpz(pr,Pz({lean:.2,hd:.3,aF:[.4,1.4],aB:[.3,1.5],lF:[.3,-.1],lB:[-.3,.1]}),tired);
 person({x:rx,y:FL-24+(tired?0:by),s:1.22,f:1,pose:pr,...REA,outfit:'tee',top:'#4a4a52',hair:'cap',hairCol:'#9a1830'});
 person({x:sx,y:FL-24+by2,s:1.22,f:-1,pose:ps,...STE,outfit:'tee'});
 // glove overlays on hands (red / white)
 // impact flash
 [2.12,3.72,4.02].forEach(t0=>{const k=seg(u,t0,t0+.25);if(k>0&&k<1)S(()=>{const x=rx+40,y=FL-24-260;ctx.globalCompositeOperation='screen';ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.shadowColor='#fff';ctx.shadowBlur=20;ctx.globalAlpha=1-k;for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(10+k*20),y+Math.sin(a)*(10+k*20));ctx.lineTo(x+Math.cos(a)*(30+k*60),y+Math.sin(a)*(30+k*60));ctx.stroke()}})});
 // swoosh on miss
 [[1.4,1.65],[3.12,3.35]].forEach(([a,b])=>{const k=seg(u,a,b);if(k>0&&k<1)S(()=>{ctx.strokeStyle=rgba(CR,.8*(1-k));ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.arc(rx+30,FL-300,120,-1.4,-1.4+k*1.9);ctx.stroke()})});
 [2.12,3.72,4.02].forEach((t0,i)=>droplets(rx+30,FL-24-280,u,t0,14,i+11));SHK=hitk*9;
 // front ropes
 S(()=>{[[FL-60,'#e9e9ee'],[FL-140,CR]].forEach(([y,c])=>{ctx.strokeStyle='#0a0a0c';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(60,y+20);ctx.quadraticCurveTo(540,y+34,1020,y+20);ctx.stroke();ctx.strokeStyle=c==CR?'#b31d36':'#d9d9de';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.stroke()})});
 if(tired>0)zig(rx+20,FL-24-280,u,tired);
 B(u,4.6,760,1000,'BREATHE.',{tx:-10,tdx:-6});
 HUD(u,'UNDER PRESSURE','PANIC','CALM');vignette(.82)}

// ================= dark psychology: showroom =================
function car(x,y,s){S(()=>{ctx.translate(x,y);ctx.scale(s,s);
 ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(-330,-30);ctx.quadraticCurveTo(-330,-80,-260,-92);ctx.lineTo(-140,-110);ctx.quadraticCurveTo(-60,-178,60,-176);ctx.quadraticCurveTo(170,-170,230,-112);ctx.lineTo(320,-96);ctx.quadraticCurveTo(352,-80,350,-30);ctx.lineTo(350,0);ctx.lineTo(-330,0);ctx.closePath();ctx.fill();
 ctx.fillStyle=lg(0,-176,0,0,[[0,'#3a3a42'],[.35,'#1c1c22'],[.5,'#8a8a96'],[.56,'#2a2a31'],[1,'#121216']]);ctx.beginPath();ctx.moveTo(-322,-32);ctx.quadraticCurveTo(-322,-76,-258,-86);ctx.lineTo(-136,-104);ctx.quadraticCurveTo(-58,-170,60,-168);ctx.quadraticCurveTo(166,-162,224,-106);ctx.lineTo(316,-90);ctx.quadraticCurveTo(342,-76,342,-32);ctx.lineTo(342,-8);ctx.lineTo(-322,-8);ctx.closePath();ctx.fill();
 ctx.fillStyle='#0b0b0e';ctx.beginPath();ctx.moveTo(-110,-106);ctx.quadraticCurveTo(-50,-158,50,-158);ctx.lineTo(60,-108);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(78,-108);ctx.lineTo(72,-157);ctx.quadraticCurveTo(160,-150,200,-108);ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.moveTo(-90,-112);ctx.quadraticCurveTo(-40,-150,10,-152);ctx.lineTo(-40,-112);ctx.closePath();ctx.fill();
 ctx.fillStyle=CRL;ctx.shadowColor=CR;ctx.shadowBlur=20;rr(318,-78,26,10,4);ctx.fill();ctx.fillStyle='#fff';ctx.shadowColor='#fff';rr(-326,-74,22,10,4);ctx.fill();ctx.shadowBlur=0;
 for(const wx of [-200,210]){ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(wx,0,56,0,7);ctx.fill();ctx.fillStyle='#26262c';ctx.beginPath();ctx.arc(wx,0,40,0,7);ctx.fill();ctx.strokeStyle='#8d8d97';ctx.lineWidth=4;for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.beginPath();ctx.moveTo(wx,0);ctx.lineTo(wx+Math.cos(a)*36,Math.sin(a)*36);ctx.stroke()}ctx.fillStyle=CR;ctx.beginPath();ctx.arc(wx,0,8,0,7);ctx.fill()}})}
function sShowroom(u){ctx.fillStyle=lg(0,0,0,H,[[0,'#040405'],[.55,'#0f0f13'],[1,'#050506']]);ctx.fillRect(0,0,W,H);const FL=1430;
 // glass wall w/ city
 S(()=>{ctx.fillStyle='#07080b';ctx.fillRect(0,740,W,560);const r=rng(21);for(let i=0;i<22;i++){const bx=i*52,bh=120+r()*300;ctx.fillStyle='#0d0f15';ctx.fillRect(bx,1300-bh,46,bh);for(let k=0;k<10;k++)if(r()<.35){ctx.fillStyle=r()<.15?rgba(CR,.7):'rgba(255,214,150,.55)';ctx.fillRect(bx+6+(k%3)*13,1300-bh+10+Math.floor(k/3)*22,6,9)}}
  ctx.fillStyle='rgba(10,10,14,.55)';ctx.fillRect(0,740,W,560);ctx.fillStyle='#050506';for(let x=0;x<W;x+=270)ctx.fillRect(x-5,740,10,560);ctx.fillRect(0,736,W,10);ctx.fillRect(0,1296,W,8)});
 // floor reflective
 S(()=>{ctx.fillStyle=lg(0,1300,0,H,[[0,'#1c1c21'],[.3,'#121215'],[1,'#050506']]);ctx.fillRect(0,1300,W,H-1300);ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=2;for(let i=-8;i<=8;i++){ctx.beginPath();ctx.moveTo(540+i*80,1300);ctx.lineTo(540+i*300,H);ctx.stroke()}});
 // turntable + spotlight
 S(()=>{ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,740,0,1380,[[0,'rgba(255,255,255,0)'],[.3,'rgba(255,255,255,.12)'],[1,'rgba(255,255,255,.06)']]);ctx.beginPath();ctx.moveTo(500,740);ctx.lineTo(580,740);ctx.lineTo(860,1380);ctx.lineTo(220,1380);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.ellipse(540,1350,360,46,0,0,7);ctx.fill();ctx.fillStyle=lg(0,1306,0,1396,[[0,'#2c2c33'],[1,'#141418']]);ctx.beginPath();ctx.ellipse(540,1346,352,40,0,0,7);ctx.fill();ctx.strokeStyle=rgba(CR,.8);ctx.shadowColor=CR;ctx.shadowBlur=18;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(540,1346,352,40,0,0,7);ctx.stroke()});
 mirror(1386,.16,()=>car(540,1330,.95));car(540,1330,.95);
 S(()=>{ctx.beginPath();ctx.rect(220,1160,640,180);ctx.clip();ctx.globalCompositeOperation='screen';const x=-200+((u*420)%1300);ctx.fillStyle=lg(x-90,0,x+90,0,[[0,'rgba(255,255,255,0)'],[.5,'rgba(255,255,255,.22)'],[1,'rgba(255,255,255,0)']]);ctx.transform(1,0,-.4,1,0,0);ctx.fillRect(x-90+540,1160,180,180)});
 // characters
 const turn=u>3.5;const angry=seg(u,1.4,1.7)*(1-seg(u,3.4,3.8));const card=seg(u,2.2,2.5);
 let pr=Pz({hd:.05});if(angry>0)pr=lpz(pr,ANGRY,angry);if(card>0&&u<3.6)pr=lpz(pr,CARD,eo(card));
 const JR=person({x:200,y:FL,s:1.15,f:1,pose:pr,...REA,col:'#fff',frontProp:J=>{if(card>0&&u<3.6)S(()=>{const [x,y]=J.handF;ctx.translate(x+10,y-6);ctx.rotate(-.2);ctx.shadowColor=CR;ctx.shadowBlur=24*card;ctx.fillStyle='#0a0a0c';rr(-26,-17,52,34,6);ctx.fill();ctx.fillStyle=lg(-24,0,24,0,[[0,'#2a2a30'],[1,'#55555e']]);rr(-23,-14,46,28,5);ctx.fill();ctx.fillStyle=WARM;ctx.fillRect(-16,-6,10,8);ctx.fillStyle=CRL;ctx.fillRect(-16,6,30,3)})}});
 if(angry>0)zig(JR.head[0],JR.head[1],u,angry);
 // manipulator
 const mf=turn?1:-1;const gest=Math.sin(u*3)*.1;
 const JM=person({x:560,y:FL-40,s:1.12,f:mf,pose:Pz({lean:.05,hd:.05,aF:[.9+gest,.6],aB:[-.1,.3]}),...MAN,frontProp:J=>S(()=>{const [x,y]=J.handF;ctx.fillStyle='#0a0a0c';rr(x-10,y-26,20,30,6);ctx.fill();ctx.fillStyle=CRL;ctx.shadowColor=CR;ctx.shadowBlur=10;rr(x-6,y-22,12,20,4);ctx.fill()})});
 A(eo(seg(u,.1,.5)),()=>{S(()=>{ctx.font='700 20px Disp';ctx.letterSpacing='5px';const w=ctx.measureText('MANIPULATOR').width+36;ctx.fillStyle='rgba(12,12,14,.9)';ctx.strokeStyle=rgba(CR,.9);ctx.lineWidth=2;rr(560-w/2,FL+12,w,38,19);ctx.fill();ctx.stroke()});txt('MANIPULATOR',560,FL+32,'700 20px Disp',CRL,{ls:5})});
 // steady
 const leave=seg(u,5.3,7);const sp=leave>0?walkP(u*7.5):(u>4.4&&u<5.3?lpz(TALL,SHRUG,eo(seg(u,4.4,4.65))*(1-seg(u,5.0,5.3))):TALL);
 person({x:880+leave*240,y:FL,s:1.15,f:leave>0?1:-1,pose:sp,...STE,outfit:'coat',top:'#e3e4ea',coatSwing:leave>0?Math.sin(u*7.5):0});
 B(u,.5,440,1000,"YOU CAN'T AFFORD THIS.",{col:'#fff',tx:100,tdx:30},1.75);
 B(u,2.3,230,1060,'WATCH ME.',{col:CRL,tx:-20},1.4);
 pop(u,3.0,e=>txt('-$38,000',230+0,960-e*40,'900 56px Black',CRL,{glow:24,gc:CR}),2);
 B(u,3.8,640,1000,'WHAT ABOUT YOU?',{tx:-60,tdx:-10},1.4);
 B(u,4.5,820,1080,'NO NEED.',{tx:20,tdx:6},1.6);
 HUD(u,"WHO'S IN CONTROL",'THEM','ME');vignette(.82)}

// ================= store (money) =================
function sStore(u){storeBG(u);const GY=1490;
 const bagsT=[1.2,2.0,2.8];
 const bagDefs=[[205,GY+6,74,92,'#e8e4dc','#0a0a0c','VERRE'],[250,GY+12,60,70,'#9a1830','#0a0a0c'],[165,GY+14,50,58,'#2b2b31','#888']];
 bagDefs.forEach((d,i)=>pop(u,bagsT[i],e=>S(()=>{ctx.translate(d[0],d[1]);ctx.scale(e,e);ctx.translate(-d[0],-d[1]);bag(...d)})));
 const tap=Math.sin(u*14)*.06*(u>.6&&u<3.2?1:0);
 const J=person({x:370,y:GY,s:1.18,f:1,pose:Pz({lean:.1,hd:.55,aF:[.55+tap,1.55],aB:[.45,1.6],lF:[.05,0],lB:[-.08,.02]}),...REA,frontProp:J=>phone(J,1)});
 bagsT.forEach(t0=>{const k=seg(u,t0,t0+.6);if(k>0&&k<1)txt('-$'+[1290,489,1384][bagsT.indexOf(t0)],J.handF[0]+30,J.handF[1]-60-k*80,'900 34px Black',rgba(CRL,1-k),{glow:16,gc:CR})});
 const wx=lerp(600,900,eio(seg(u,.2,5.8)));person({x:wx,y:GY+10,s:1.18,f:1,pose:walkP(u*7,1),...STE,outfit:'coat',top:'#e3e4ea',hands:'pockets',coatSwing:Math.sin(u*7)});
 B(u,.5,330,1060,'I DESERVE IT.',{col:CRL,thought:true,tx:30},2.4);
 B(u,3.2,wx+20,1080,'NOT TODAY.',{tx:-10,tdx:-6},2.4);
 let v=3200;bagsT.forEach((t0,i)=>{if(u>t0)v-=[1290,489,1384][i]});v=Math.max(37,v);
 headlights(u,2.4,1.4,1700,-1);rain(u,1,3);splashes(u,1520,1650);
 if(Math.floor(u*10)%23==0||(u>4.1&&u<4.2))S(()=>{ctx.fillStyle='rgba(20,12,10,.75)';ctx.fillRect(170,800,580,80)});
 HUD(u,'LEFT AFTER PAYDAY','$'+v.toLocaleString('en-US'),'$3,200');vignette(.8)}

// ================= night =================
function sNight(u){roomsBG(u);const FL=1420;
 S(()=>{ctx.beginPath();ctx.rect(250,780,230,250);ctx.clip();rain(u,1.2,7,250,780,230,250,40,22)});
 S(()=>{const fl=.5+.5*Math.sin(u*11)*Math.sin(u*4.3);ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(80,110,255,${.06+.07*fl})`;ctx.fillRect(0,700,538,980)});
 S(()=>{ctx.fillStyle='#0a0a0c';rr(1000,1196,36,42,6);ctx.fill();ctx.fillStyle='#e9e2d6';rr(1003,1199,30,36,5);ctx.fill();ctx.strokeStyle='#0a0a0c';ctx.lineWidth=5;ctx.beginPath();ctx.arc(1036,1216,10,-1.3,1.3);ctx.stroke()});steam(1018,1190,u);
 const JR=person({x:250,y:1268+132*1.1,s:1.1,f:1,pose:SIT,noShadow:true,...REA,frontProp:J=>phone(J,.8+.2*Math.sin(u*9))});
 [['ORDER CONFIRMED',300,945],['3 NEW MESSAGES',150,1035],['PAY LATER?',405,1040],['WHY IS HE DOING BETTER?',270,1115]].forEach(([s,x,y],i)=>pop(u,.5+i*.7,e=>S(()=>{ctx.translate(x,y);ctx.scale(e,e);ctx.font='700 21px Disp';ctx.letterSpacing='2px';const w=ctx.measureText(s).width+50;const red=i>=2;ctx.fillStyle='rgba(14,16,22,.92)';ctx.strokeStyle=red?CRL:'rgba(255,255,255,.7)';ctx.lineWidth=2.5;ctx.shadowColor=red?CR:'rgba(150,180,255,.6)';ctx.shadowBlur=14;rr(-w/2,-22,w,44,12);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=red?CRL:'#fff';ctx.beginPath();ctx.arc(-w/2+20,0,5,0,7);ctx.fill();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,8,1)})));
 const wr=Math.sin(u*10)*.08;
 person({x:735,y:1290+132*1.1,s:1.1,f:1,pose:Pz({...DESK,aF:[.95+wr,.75-wr]}),noShadow:true,...STE,
  frontProp:J=>S(()=>{ctx.fillStyle='#0a0a0c';rr(842,1222,96,18,3);ctx.fill();ctx.fillStyle='#f4efe6';rr(846,1224,88,12,2);ctx.fill();ctx.strokeStyle='#0a0a0c';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(J.handF[0]+4,J.handF[1]);ctx.lineTo(J.handF[0]+20,J.handF[1]+16);ctx.stroke()})});
 // phone face down on desk
 S(()=>{ctx.fillStyle='#0a0a0c';rr(990,1226,44,12,3);ctx.fill()});
 pop(u,1.4,e=>S(()=>{const x=860,y=1060;ctx.translate(x,y);ctx.scale(e,e);ctx.fillStyle='rgba(16,14,12,.92)';ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2.5;ctx.shadowColor=rgba(WARM,.6);ctx.shadowBlur=16;rr(-150,-62,300,124,14);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  txt('TOMORROW',-70,-38,'700 17px Disp','rgba(255,255,255,.6)',{ls:3});['TRAIN 6AM','DEEP WORK','READ 20 PAGES'].forEach((s2,i)=>{const k=seg(u,1.8+i*.45,2.1+i*.45);txt(s2,-110,-8+i*28,'700 22px Disp','#fff',{align:'left'});ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(-132,-17+i*28,16,16);if(k>0){ctx.strokeStyle=WARM;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-129,-9+i*28);ctx.lineTo(-125,-4+i*28);ctx.lineTo(-118-0*k,-14+i*28);ctx.stroke()}})}));
 S(()=>{ctx.fillStyle='#050506';ctx.fillRect(534,700,12,980);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(546,700,2,980);ctx.fillRect(0,690,W,14)});
 HUD(u,'11:00 PM','NOISE','PEACE');vignette(.8)}

// ================= CTA =================
let COVER=null;
export function setCover(img){COVER=img}
function sCTA(u){ctx.fillStyle='#050506';ctx.fillRect(0,0,W,H);
 for(let i=0;i<3;i++){const k=eio(seg(u,.1+i*.08,.7+i*.08));S(()=>{const y=1580+i*26;ctx.strokeStyle=CR;ctx.globalAlpha=.75;ctx.lineWidth=2.5;ctx.shadowColor=CR;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,y-8);ctx.lineTo(W*k,y-8+16*k);ctx.stroke()})}
 bigText(u,.1,'TESTED UNDER PRESSURE.',null,520);bigText(u,.45,'Become stable as a ','rock.',630);
 const ck=seg(u,.3,1.0),e=eo(ck);if(ck>0)S(()=>{const cw=330,ch=cw*COVER.height/COVER.width;ctx.globalAlpha=e;ctx.translate(540,1035+(1-e)*60+Math.sin(u*1.6)*4);ctx.scale(lerp(.88,1,e),lerp(.88,1,e));if(ck<1)ctx.filter=`blur(${(1-e)*14}px)`;
  ctx.shadowColor='rgba(212,34,63,.55)';ctx.shadowBlur=70;ctx.fillStyle='#111';ctx.fillRect(-cw/2,-ch/2,cw,ch);ctx.shadowBlur=0;ctx.drawImage(COVER,-cw/2,-ch/2,cw,ch);ctx.filter='none';ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.strokeRect(-cw/2,-ch/2,cw,ch)});
 const pk=seg(u,1.1,1.5);if(pk>0)S(()=>{const ee=eback(pk),pw=440,ph=88;ctx.translate(540,1410);ctx.scale(ee,ee);const pulse=.5+.5*Math.sin((u-1.5)*5);ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=18+pulse*16;rr(-pw/2,-ph/2,pw,ph,ph/2);ctx.fill();ctx.shadowBlur=0;
  txt('GET THE GUIDE',-26,2,'700 34px Disp','#000',{ls:4});ctx.strokeStyle='#000';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';const ax=162+Math.sin(u*6)*5;ctx.beginPath();ctx.moveTo(ax-14,0);ctx.lineTo(ax+12,0);ctx.moveTo(ax+2,-11);ctx.lineTo(ax+13,0);ctx.lineTo(ax+2,11);ctx.stroke()});
 A(seg(u,1.4,1.7),()=>txt('LINK IN BIO',540,1500,'500 24px Lab','#fff',{ls:10,glow:10}));vignette(.7)}


// ===================== SELF-DOUBT VIDEO =====================
const OVR=REA;
function capL(u,t0,t1,s){A(1-seg(u,t1-.2,t1),()=>bigText(u,t0,s,null,520))}
function capS(u,t0,t1,l1,em){A(1-seg(u,t1-.2,t1),()=>bigText(u,t0,l1,em,632))}
function tag(x,y,s,col,a=1){A(a,()=>txt(s,x,y,'500 26px Lab',col,{ls:8,glow:10,gc:col==CRL?rgba(CR,.7):'rgba(255,255,255,.35)'}))}
function topShade(){S(()=>{ctx.fillStyle=lg(0,400,0,720,[[0,'rgba(0,0,0,.75)'],[1,'rgba(0,0,0,0)']]);ctx.fillRect(0,400,W,320)})}
const HEADHANDS=Pz({lean:.4,hd:.5,aF:[1.95,1.25],aB:[1.8,1.35],lF:[1.45,-1.45],lB:[1.35,-1.35]});
const CURL=Pz({lean:.35,hd:.6,aF:[1.1,.5],aB:[1.0,.6],lF:[2.5,-2.7],lB:[2.4,-2.6]});
const FLOORSIT=Pz({lean:-.15,hd:.5,aF:[.8,1.5],aB:[.6,1.5],lF:[1.5,-.05],lB:[1.4,.05]});
function tangle(x,y,r,u,k,red=.6,seed=5){if(k<=0)return;const rn=rng(seed);S(()=>{ctx.translate(x,y);ctx.rotate(u*.4);ctx.lineCap='round';
 for(let i=0;i<7;i++){const pts=[];const n=7;for(let j=0;j<=n;j++){const a=j/n*Math.PI*2+rn()*.6,rr2=r*(.35+rn()*.75);pts.push([Math.cos(a)*rr2+Math.sin(u*3+i+j)*6,Math.sin(a)*rr2*.75+Math.cos(u*2.6+i)*6])}
  ctx.strokeStyle=i%3==0?CRL:'rgba(255,255,255,.85)';ctx.shadowColor=i%3==0?CR:'#fff';ctx.shadowBlur=10;ctx.lineWidth=2.4;ctx.globalAlpha=k*(i%3==0?red+.3:.7);
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let j=1;j<pts.length-1;j++){const mx=(pts[j][0]+pts[j+1][0])/2,my=(pts[j][1]+pts[j+1][1])/2;ctx.quadraticCurveTo(pts[j][0],pts[j][1],mx,my)}
  const len=r*14;ctx.setLineDash([len*k,len]);ctx.stroke()}})}
function eye(x,y,s,lookX,a,closed=0){A(a,()=>S(()=>{ctx.translate(x,y);ctx.scale(s,s);const h=18*(1-closed);ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(-34,0);ctx.quadraticCurveTo(0,-h-8,34,0);ctx.quadraticCurveTo(0,h+8,-34,0);ctx.fill();
 ctx.fillStyle='#f4f1ec';ctx.shadowColor='#fff';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(-28,0);ctx.quadraticCurveTo(0,-h,28,0);ctx.quadraticCurveTo(0,h,-28,0);ctx.fill();ctx.shadowBlur=0;
 if(closed<.9){ctx.save();ctx.clip();ctx.fillStyle=CR;ctx.beginPath();ctx.arc(lookX*12,0,10,0,7);ctx.fill();ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(lookX*12,0,5,0,7);ctx.fill();ctx.restore()}}))}
function thought(u,t0,x,y,s,dur=9){pop(u,t0,e=>S(()=>{const j=Math.sin(u*30+x)*1.5;ctx.translate(x+j,y-(u-t0)*8);ctx.scale(e,e);ctx.font='800 26px Disp';ctx.letterSpacing='4px';const w=ctx.measureText(s).width+40;
 ctx.fillStyle='rgba(18,6,10,.88)';ctx.strokeStyle=CRL;ctx.lineWidth=2;ctx.shadowColor=CR;ctx.shadowBlur=16;rr(-w/2,-24,w,48,24);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=CRL;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,2,1)}),dur)}


// ---------- scene-specific caption engine ----------
function line2(u,t0,t1,parts,style,o={}){const y=o.y||632;const out=1-seg(u,t1-.25,t1);if(u<t0-.01||out<=0)return;
 const full=parts.map(p=>p[0]).join('');let sz=o.size||100;for(;;){ctx.font=`italic 500 ${sz}px Ser`;if(ctx.measureText(full).width<=940||sz<46)break;sz-=2}
 ctx.font=`italic 500 ${sz}px Ser`;ctx.letterSpacing='0px';const tw=ctx.measureText(full).width,x0=540-tw/2;
 const ch=[];let idx=0,word=0;parts.forEach(([t,em])=>{for(const c of t){const x=x0+ctx.measureText(full.slice(0,idx)).width,w=ctx.measureText(c).width;ch.push({c,x,w,em,word});if(c==' ')word++;idx++}});
 const n=ch.length;let lastVis=-1;
 S(()=>{ctx.globalAlpha*=out;ctx.textBaseline='middle';ctx.textAlign='left';
 ch.forEach((q,i)=>{if(q.c==' ')return;const cx=q.x+q.w/2;let k=1,dx=0,dy=0,rot=0,sc=1,bl=0,extra=0,ghost=0;
  if(style=='type'){const ti=t0+i*(o.rate||.034);k=seg(u,ti,ti+.04);}
  else if(style=='flicker'){const r=rng(i*13+7);const ti=t0+r()*.55;k=u<ti?0:(u<ti+.3?((Math.floor((u-ti)*28+i)%3)?1:.15):1);dx=u<ti+.3?(r()-.5)*6:0}
  else if(style=='sweep'){const bx=lerp(x0-160,x0+tw+160,eio(seg(u,t0,t0+.9)));k=clamp((bx-cx)/110);extra=Math.exp(-Math.pow((bx-cx)/70,2))}
  else if(style=='push'){const sd=cx<540?-1:1;k=eo(seg(u,t0,t0+.65));dx=sd*(1-k)*140+Math.sin(u*40+i)*(1-k)*4;bl=(1-k)*8}
  else if(style=='roll'){const ti=t0+i*.018;k=eo(seg(u,ti,ti+.45));dy=(1-k)*sz*.8}
  else if(style=='spin'){const ti=t0+i*.012;k=eo(seg(u,ti,ti+.7));rot=(1-k)*-.9;sc=lerp(.5,1,k)}
  else if(style=='breathe'){k=eo(seg(u,t0+i*.012,t0+i*.012+.6));dx=(cx-540)*.07*(o.br||0)}
  else if(style=='speed'){const ti=t0+i*.012;k=eo(seg(u,ti,ti+.32));dx=(1-k)*420;ghost=1-k}
  else {const ti=t0+q.word*.13;k=eo(seg(u,ti,ti+.55));dy=(1-k)*16;bl=(1-k)*10}
  if(k<=0)return;lastVis=i;
  S(()=>{ctx.globalAlpha*=clamp(k);let px=q.x+dx,py=y+dy;
   if(rot){ctx.translate(540,y+300);ctx.rotate(rot);ctx.translate(-540,-(y+300))}
   if(style=='roll'){ctx.beginPath();ctx.rect(q.x-10,y-sz*.75,q.w+20,sz*1.3);ctx.clip()}
   if(sc!=1){ctx.translate(cx,y);ctx.scale(sc,sc);ctx.translate(-cx,-y)}
   if(bl>.4)ctx.filter=`blur(${bl.toFixed(1)}px)`;
   const col=q.em?CRL:'#f4f1ec';ctx.font=`italic 500 ${sz}px Ser`;
   if(ghost>.02){ctx.fillStyle=col;for(let g=1;g<=3;g++){ctx.globalAlpha*=.45;ctx.fillText(q.c,px+g*ghost*60,py)}ctx.globalAlpha=clamp(k)*out}
   ctx.fillStyle=col;ctx.shadowColor=q.em?rgba(CR,.7):'rgba(255,255,255,.35)';ctx.shadowBlur=20+extra*30;ctx.fillText(q.c,px,py);
   if(extra>.05){ctx.globalCompositeOperation='screen';ctx.globalAlpha*=extra;ctx.shadowColor='#fff';ctx.shadowBlur=40;ctx.fillText(q.c,px,py)}})});
 if(style=='type'&&lastVis<n-1+8&&Math.floor(u*3)%2==0){const q=ch[Math.max(0,lastVis)];ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(q.x+q.w+6,y-sz*.42,3,sz*.8)}
 const uk=eio(seg(u,t0+(style=='type'?n*(o.rate||.034):.45),t0+(style=='type'?n*(o.rate||.034):.45)+.45));const hw=tw*.18*uk;
 ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(540-hw,y+sz*.58);ctx.lineTo(540+hw,y+sz*.58);ctx.stroke();ctx.globalAlpha*=uk;ctx.fillStyle=CRL;ctx.beginPath();ctx.arc(540,y+sz*.58,3,0,7);ctx.fill()})}
function foot(u,t0,t1,s){const k=eo(seg(u,t0,t0+.5))*(1-seg(u,t1-.25,t1));if(k<=0)return;A(k,()=>txt(s,540,712+(1-k)*8,'italic 500 38px Ser','rgba(235,230,225,.72)',{glow:6,gc:'rgba(255,255,255,.2)'}))}

// ---------- bedroom ----------
function bedroom(x0=0,w=W,clockOn=true,u=0,warm=0){const FL=1420;S(()=>{ctx.beginPath();ctx.rect(x0,700,w,980);ctx.clip();
 ctx.fillStyle=lg(0,700,0,FL,[[0,'#0a0c12'],[1,'#121520']]);ctx.fillRect(x0,700,w,FL-700);
 ctx.fillStyle=lg(0,FL,0,FL+260,[[0,'#181a22'],[1,'#07080a']]);ctx.fillRect(x0,FL,w,260);ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=2;for(let x=x0-200;x<x0+w+200;x+=80){ctx.beginPath();ctx.moveTo(x,FL);ctx.lineTo(x+(x-(x0+w/2))*.5,FL+260);ctx.stroke()}
 // window + moon
 const wx=x0+w*.58,ww=Math.min(260,w*.42);ctx.fillStyle='#05060a';ctx.fillRect(wx,790,ww,260);ctx.fillStyle='#e9ecf5';ctx.shadowColor='#cfd8ff';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(wx+ww*.72,850,22,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#05060a';ctx.beginPath();ctx.arc(wx+ww*.72+9,844,20,0,7);ctx.fill();
 const r=rng(14);for(let i=0;i<Math.floor(ww/28);i++){const bx=wx+4+i*28,bh=50+r()*120;ctx.fillStyle='#0e1119';ctx.fillRect(bx,1050-bh,24,bh);for(let k=0;k<5;k++)if(r()<.35){ctx.fillStyle='rgba(255,214,150,.6)';ctx.fillRect(bx+4+(k%2)*10,1050-bh+8+Math.floor(k/2)*16,5,7)}}
 ctx.strokeStyle='#1d2130';ctx.lineWidth=10;ctx.strokeRect(wx,790,ww,260);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(wx+ww/2,790);ctx.lineTo(wx+ww/2,1050);ctx.stroke();
 ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,1050,0,FL,[[0,'rgba(150,170,255,.10)'],[1,'rgba(150,170,255,0)']]);ctx.beginPath();ctx.moveTo(wx,1050);ctx.lineTo(wx+ww,1050);ctx.lineTo(wx+ww+120,FL);ctx.lineTo(wx-160,FL);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
 if(warm>0){ctx.fillStyle=`rgba(255,190,120,${.12*warm})`;ctx.fillRect(x0,700,w,980)}})}
function bed(x,w,y=1250){S(()=>{ctx.fillStyle='#0a0a0c';rr(x,y,w,110,16);ctx.fill();ctx.fillStyle=lg(0,y+4,0,y+106,[[0,'#3b4152'],[1,'#252a37']]);rr(x+4,y+4,w-8,102,14);ctx.fill();ctx.fillStyle='#0a0a0c';ctx.fillRect(x-4,y-120,26,290);ctx.fillRect(x+20,y+106,14,64);ctx.fillRect(x+w-34,y+106,14,64)})}
function clock3(x,y,u,txt0="3:07"){S(()=>{ctx.fillStyle='#0a0a0c';ctx.fillRect(x-60,y,120,170);ctx.fillStyle='#16181f';ctx.fillRect(x-56,y+4,112,166);ctx.fillStyle='#0a0a0c';rr(x-44,y-42,88,44,8);ctx.fill();
 const on=Math.floor(u*2)%2==0;txt(on?txt0:txt0.replace(':',' '),x,y-19,'800 28px Disp',CRL,{glow:16,gc:CR})})}

// S1 HOOK
function d1(u){bedroom(0,W,true,u);bed(130,560);clock3(820,1250,u);
 const J=person({x:470,y:1262+132*1.15,s:1.15,f:1,pose:lpz(SIT,HEADHANDS,eo(seg(u,0,.5))),noShadow:true,...OVR});
 const k=eo(seg(u,.2,2.2));tangle(J.head[0],J.head[1]-170,40+110*k,u,k,.7);
 dust(100,760,880,700,30,u,.35,3);topShade();
 capL(u,.05,9,"03:07 — THE MIND WON'T SLEEP");line2(u,.45,9,[["You're not tired. You're ",0],["overthinking.",1]],'flicker');vignette(.85)}
// S2 CATASTROPHIZING
function d2(u){bedroom(0,538,true,u);bedroom(542,538,true,u);
 bed(40,470);bed(580,470);
 // left lying with phone
 S(()=>{ctx.translate(470,1255);ctx.rotate(-Math.PI/2);person({x:0,y:0,s:1.0,f:1,noShadow:true,pose:Pz({aF:[1.25,1.55],aB:[-.05,.1],lF:[.03,0],lB:[-.03,0]}),...OVR,hair:'none',frontProp:J=>phone(J,1.2)})});
 S(()=>{ctx.fillStyle='#0a0a0c';rr(200,1196,300,70,26);ctx.fill();ctx.fillStyle=lg(0,1200,0,1262,[[0,'#6c7387'],[1,'#3d4354']]);rr(204,1200,292,62,24);ctx.fill()});
 // right sleeping steady
 S(()=>{ctx.translate(1010,1255);ctx.rotate(-Math.PI/2);person({x:0,y:0,s:1.0,f:1,noShadow:true,pose:Pz({aF:[.05,.1],aB:[-.05,.1]}),...STE,glow:0,hair:'short'})});
 S(()=>{ctx.fillStyle='#0a0a0c';rr(740,1196,300,70,26);ctx.fill();ctx.fillStyle=lg(0,1200,0,1262,[[0,'#d6d7dd'],[1,'#9a9ba3']]);rr(744,1200,292,62,24);ctx.fill()});
 A(.8,()=>{for(let i=0;i<3;i++){const k=((u*.7+i/3)%1);txt('z',700+k*50,1150-k*80,`700 ${20+k*18}px Disp`,'rgba(255,255,255,.8)',{glow:8})}});
 // phone UI
 const pk=eo(seg(u,.05,.35));A(pk,()=>S(()=>{const x=110,y=760+(1-pk)*30,w=330,h=360;ctx.fillStyle='#0a0a0c';rr(x-8,y-8,w+16,h+16,34);ctx.fill();ctx.fillStyle='#101218';rr(x,y,w,h,28);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;rr(x,y,w,h,28);ctx.stroke();
  txt('ALEX',x+w/2,y+34,'700 18px Disp','rgba(255,255,255,.7)',{ls:4});ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x,y+58,w,1.5);
  ctx.font='600 21px Disp';const msg='hey, can we talk tomorrow?';const mw=ctx.measureText(msg).width+34;ctx.fillStyle='#2a2d36';rr(x+16,y+82,mw,48,20);ctx.fill();txt(msg,x+33,y+107,'600 21px Disp','#fff',{align:'left'});
  txt('Seen 3:09 AM',x+18,y+150,'500 15px Lab','rgba(255,255,255,.4)',{align:'left'});
  const full='sorry if i did something w';let typed='';if(u>.9&&u<2.0)typed=full.slice(0,Math.floor((u-.9)/1.1*full.length));else if(u>=2.0)typed=full.slice(0,Math.max(0,Math.floor(full.length*(1-(u-2.0)/.5))));
  ctx.fillStyle='#1b1e26';rr(x+14,y+h-64,w-28,46,23);ctx.fill();txt(typed+(Math.floor(u*4)%2?'|':''),x+30,y+h-41,'500 19px Lab','#fff',{align:'left'});
  if(u>.5&&u<.9||u>2.5){for(let i=0;i<3;i++){ctx.fillStyle=`rgba(255,255,255,${.4+.4*Math.sin(u*10-i)})`;ctx.beginPath();ctx.arc(x+40+i*16,y+200,5,0,7);ctx.fill()}}}));
 thought(u,1.35,330,1160,"THEY'RE MAD.");thought(u,1.9,180,1110,'WHAT DID I DO?');thought(u,2.5,350,1060,"IT'S OVER.");
 S(()=>{ctx.fillStyle='#050506';ctx.fillRect(534,700,12,980);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(546,700,2,980)});
 tag(270,1470,'OVERTHINKER',CRL,eo(seg(u,.2,.6)));tag(810,1470,'STEADY','#fff',eo(seg(u,.35,.75)));
 topShade();capL(u,.05,9,'DISTORTION Nº1 — CATASTROPHIZING');line2(u,.35,9,[['One text. The mind writes ',0],['ten endings.',1]],'type',{rate:.03});foot(u,1.9,9,'Silence gets filled with the worst story you know.');vignette(.85)}
// S3 SPOTLIGHT EFFECT
function d3(u){const FL=1420;ctx.fillStyle=lg(0,0,0,H,[[0,'#040404'],[.6,'#0c0a09'],[1,'#040404']]);ctx.fillRect(0,0,W,H);
 S(()=>{ctx.fillStyle=lg(0,700,0,FL,[[0,'#0d0b0a'],[1,'#14110f']]);ctx.fillRect(0,700,W,FL-700);for(let i=0;i<3;i++){ctx.fillStyle='#0a0a0c';ctx.fillRect(140+i*300,800,220,120);ctx.fillStyle='#211b15';ctx.fillRect(146+i*300,806,208,108);ctx.fillStyle='rgba(255,220,170,.3)';for(let l=0;l<4;l++)ctx.fillRect(166+i*300,826+l*22,120+((l*37)%60),5)}
  for(let i=0;i<4;i++){const x=180+i*240;ctx.fillStyle=rg(x,760,0,180,[[0,rgba(WARM,.09)],[1,rgba(WARM,0)]]);ctx.fillRect(x-180,700,360,400);ctx.fillStyle='#fff3da';ctx.shadowColor=WARM;ctx.shadowBlur=24;ctx.beginPath();ctx.arc(x,740,9,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#0a0a0c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,700);ctx.lineTo(x,731);ctx.stroke()}
  ctx.fillStyle=lg(0,FL,0,H,[[0,'#241e17'],[1,'#080706']]);ctx.fillRect(0,FL,W,H-FL)});
 const reveal=eo(seg(u,2.2,2.6));
 const crowd=[[120,1400,1,'#4a4a52'],[260,1380,1,'#3c3c44'],[400,1395,1,'#55555e'],[690,1395,-1,'#3f3f47'],[830,1380,-1,'#4d4d55'],[970,1400,-1,'#44444c']];
 const ox=lerp(-90,540,eio(seg(u,0,1.2)));const look=x=>Math.sign(ox-x);
 crowd.forEach(([x,y,f,c],i)=>{const J=person({x,y,s:.98,f:reveal>.5?f:look(x)||f,pose:lpz(Pz({hd:-.05}),Pz({hd:.55,lean:.08,aF:[.6,1.5],aB:[.5,1.5]}),reveal),skin:'#7d7d86',top:c,bot:'#26262c',shoe:'#bcbcc4',outfit:i%2?'hoodie':'tee',hair:['short','long','cap','bun','short','pony'][i],hairCol:i==2?'#3a3a42':'#141418',frontProp:J=>{if(reveal>0)A(reveal,()=>phone(J,.8))}});
  eye(x,J.head[1]-80,.9,look(x),eo(seg(u,.7+i*.08,.9+i*.08))*(1-reveal),0)});
 // spotlight
 const sp=eo(seg(u,.5,1.0))*(1-reveal*.85);S(()=>{ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,700,0,FL,[[0,'rgba(255,255,255,.05)'],[1,`rgba(255,255,255,${.3*sp})`]]);ctx.beginPath();ctx.moveTo(ox-20,700);ctx.lineTo(ox+20,700);ctx.lineTo(ox+190,FL);ctx.lineTo(ox-190,FL);ctx.closePath();ctx.globalAlpha=sp;ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=rg(ox,FL,0,220,[[0,`rgba(255,255,255,${.3*sp})`],[1,'rgba(255,255,255,0)']]);ctx.fillRect(ox-240,FL-60,480,120)});
 const stiff=seg(u,1.2,1.5)*(1-reveal*.7);
 person({x:ox,y:FL+10,s:1.15,f:1,pose:u<1.2?walkP(u*8,1):lpz(Pz({hd:.1}),Pz({lean:.12,hd:.35,aF:[.15,.4],aB:[-.1,.4]}),stiff),...OVR});
 tag(ox,FL+80,'OVERTHINKER',CRL,eo(seg(u,1.2,1.6)));
 topShade();capL(u,.1,9,'THE SPOTLIGHT EFFECT');line2(u,.45,2.15,[['You feel ',0],['watched.',1]],'sweep');line2(u,2.3,9,[["They're busy worrying about ",0],['themselves.',1]],'sweep');foot(u,2.9,9,'People notice you far less than you think.');vignette(.85)}
// S4 SOCIAL PRESSURE
function d4(u){const FL=1420;ctx.fillStyle='#040405';ctx.fillRect(0,0,W,H);
 S(()=>{ctx.fillStyle=rg(540,FL,0,600,[[0,'rgba(130,10,30,.35)'],[1,'rgba(130,10,30,0)']]);ctx.fillRect(0,900,W,800);ctx.fillStyle=lg(0,FL,0,H,[[0,'#120a0c'],[1,'#040405']]);ctx.fillRect(0,FL,W,H-FL)});
 const ringR=lerp(430,210,eio(seg(u,.2,3.4)));S(()=>{ctx.strokeStyle=rgba(CR,.8);ctx.shadowColor=CR;ctx.shadowBlur=18;ctx.lineWidth=3;ctx.setLineDash([10,12]);ctx.lineDashOffset=u*40;ctx.beginPath();ctx.ellipse(540,FL,ringR,ringR*.22,0,0,7);ctx.stroke()});
 const shrink=eio(seg(u,.2,3.4));const sx=540;
 const crowd=[[150,FL-30,1],[300,FL-90,1],[440,FL-130,1],[640,FL-130,-1],[780,FL-90,-1],[930,FL-30,-1]];
 const lines=["BE REALISTIC.","WHO DO YOU THINK YOU ARE?","GET A REAL JOB.","PLAY IT SAFE.","WHAT WILL PEOPLE SAY?","YOU'LL FAIL."];
 crowd.forEach(([x,y,f],i)=>{const lean=eo(seg(u,.2+i*.3,.6+i*.3));const J=person({x:lerp(x,lerp(x,sx,.18),shrink),y,s:1.08,f,pose:lpz(Pz({}),Pz({lean:.15,hd:.1,aF:[1.5,0],aB:[-.1,.3]}),lean),...MAN,top:'#121215',bot:'#121215',skin:'#3a3a40',hairCol:'#060607'});
  if(lean>.3)S(()=>{ctx.strokeStyle=rgba(CR,.5*lean);ctx.setLineDash([3,8]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(J.handF[0],J.handF[1]);ctx.lineTo(sx,FL-200);ctx.stroke()});
  const TP=[[220,1060],[330,935],[760,1010],[850,890],[540,815],[850,1120]];thought(u,.25+i*.3,TP[i][0],TP[i][1],lines[i])});
 person({x:sx,y:FL,s:lerp(1.2,.92,shrink),f:1,pose:lpz(Pz({}),SLUMP,shrink),...OVR});
 S(()=>{ctx.fillStyle=`rgba(120,0,20,${.12+.08*Math.sin(u*7)})`;ctx.globalCompositeOperation='multiply';ctx.fillRect(0,0,W,H)});
 topShade();capL(u,.05,9,'SOCIAL CONFORMITY');line2(u,.35,9,[['Their fear becomes ',0],['your ceiling.',1]],'push');foot(u,1.7,9,'People project their limits onto you.');vignette(.9)}
// S5 COMPARISON
function icon(type,x,y){S(()=>{ctx.translate(x,y);ctx.strokeStyle='#fff';ctx.fillStyle='#fff';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
 if(type=='car'){ctx.beginPath();ctx.moveTo(-40,8);ctx.lineTo(-36,-6);ctx.lineTo(-18,-12);ctx.lineTo(-6,-26);ctx.lineTo(22,-26);ctx.lineTo(34,-10);ctx.lineTo(42,-6);ctx.lineTo(42,8);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(-22,10,8,0,7);ctx.arc(26,10,8,0,7);ctx.fill()}
 if(type=='trophy'){ctx.beginPath();ctx.moveTo(-20,-26);ctx.lineTo(20,-26);ctx.lineTo(16,0);ctx.quadraticCurveTo(0,12,-16,0);ctx.closePath();ctx.fill();ctx.fillRect(-4,8,8,12);ctx.fillRect(-16,20,32,6)}
 if(type=='beach'){ctx.beginPath();ctx.arc(14,-14,12,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-40,20);ctx.quadraticCurveTo(0,6,40,20);ctx.stroke();ctx.beginPath();ctx.moveTo(-18,20);ctx.quadraticCurveTo(-22,-4,-14,-22);ctx.stroke();ctx.beginPath();ctx.moveTo(-14,-22);ctx.quadraticCurveTo(-30,-26,-38,-12);ctx.moveTo(-14,-22);ctx.quadraticCurveTo(2,-28,6,-14);ctx.stroke()}
 if(type=='chart'){ctx.beginPath();ctx.moveTo(-36,18);ctx.lineTo(-14,-2);ctx.lineTo(4,6);ctx.lineTo(34,-24);ctx.stroke();ctx.beginPath();ctx.moveTo(20,-24);ctx.lineTo(34,-24);ctx.lineTo(34,-10);ctx.stroke()}
 if(type=='heart'){ctx.beginPath();ctx.moveTo(0,20);ctx.bezierCurveTo(-36,-4,-20,-34,0,-14);ctx.bezierCurveTo(20,-34,36,-4,0,20);ctx.fill()}
 if(type=='gym'){ctx.fillRect(-30,-4,60,8);ctx.fillRect(-38,-16,10,32);ctx.fillRect(28,-16,10,32);ctx.fillRect(-46,-10,8,20);ctx.fillRect(38,-10,8,20)}
 if(type=='me'){ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(0,-10,12,0,7);ctx.fill();ctx.beginPath();ctx.arc(0,26,22,Math.PI,0);ctx.fill()}})}
function d5(u){bedroom(0,W,false,u);const FL=1420;
 const J=person({x:250,y:FL-12+132*1.05,s:1.05,f:1,pose:FLOORSIT,noShadow:true,...OVR,frontProp:J=>phone(J,1.1)});
 tag(250,FL+70,'OVERTHINKER',CRL,eo(seg(u,.2,.5)));
 // phone feed
 const x=540,y=740,w=420,h=640;S(()=>{ctx.fillStyle='#0a0a0c';rr(x-10,y-10,w+20,h+20,44);ctx.fill();ctx.fillStyle='#0e1016';rr(x,y,w,h,36);ctx.fill();ctx.save();rr(x,y,w,h,36);ctx.clip();
  const cards=[['car','NEW WHIP','12.4K'],['trophy','CHAMPION','8.1K'],['beach','BALI, AGAIN','22K'],['chart','+$10K MONTH','5.3K'],['heart','ENGAGED','31K'],['gym','SHREDDED','9.9K'],['me','YOU · 3:12 AM','0']];
  const stop=6*190-110;const off=Math.min(stop,eio(seg(u,0,2.6))*stop)+(u>2.6?Math.sin((u-2.6)*14)*4*Math.exp(-(u-2.6)*4):0);
  cards.forEach(([ic,t,l],i)=>{const cy=y+40+i*190-off;if(cy<y-200||cy>y+h)return;const me=ic=='me';
   ctx.fillStyle=me?'#1a0d11':'#1a1d25';ctx.strokeStyle=me?CRL:'rgba(255,255,255,.12)';ctx.lineWidth=me?3:1.5;if(me){ctx.shadowColor=CR;ctx.shadowBlur=16}rr(x+20,cy,w-40,160,22);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
   if(!me){ctx.fillStyle=lg(x+20,cy,x+150,cy+160,[[0,'#3a3f4d'],[1,'#22252e']]);rr(x+34,cy+14,120,132,16);ctx.fill()}else{ctx.fillStyle='#120a0c';rr(x+34,cy+14,120,132,16);ctx.fill()}
   icon(ic,x+94,cy+82);txt(t,x+176,cy+60,'800 24px Disp',me?CRL:'#fff',{align:'left',ls:2});
   ctx.fillStyle=me?'rgba(255,255,255,.35)':CRL;ctx.beginPath();ctx.moveTo(x+186,cy+108);ctx.bezierCurveTo(x+172,cy+96,x+178,cy+84,x+186,cy+92);ctx.bezierCurveTo(x+194,cy+84,x+200,cy+96,x+186,cy+108);ctx.fill();
   txt(l,x+208,cy+100,'700 22px Disp',me?'rgba(255,255,255,.4)':'rgba(255,255,255,.8)',{align:'left'})});
  ctx.restore();ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(x+w/2,y+h/2,0,500,[[0,'rgba(150,180,255,.12)'],[1,'rgba(150,180,255,0)']]);ctx.fillRect(x-200,y-200,w+400,h+400)});
 topShade();capL(u,.05,9,'SOCIAL COMPARISON');line2(u,.35,9,[['Their highlight reel. ',0],['Your 3 AM.',1]],'roll');foot(u,1.6,9,'You compare your inside to their outside.');vignette(.85)}
// S6/S7 SPIRAL + BREATHE
function vortex(u,a,spd=1){if(a<=0)return;S(()=>{ctx.translate(540,1110);ctx.globalAlpha*=a;
 for(let arm=0;arm<4;arm++){ctx.beginPath();for(let r=30;r<900;r+=8){const an=arm*Math.PI/2+r*.011+u*1.3*spd;const x=Math.cos(an)*r,y=Math.sin(an)*r*.8;r==30?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.strokeStyle=arm%2?rgba(CR,.55):'rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.stroke()}
 for(let i=0;i<16;i++){const r=110+i*44,an=i*1.9+r*.011+u*1.3*spd;const x=Math.cos(an)*r,y=Math.sin(an)*r*.8;S(()=>{ctx.translate(x,y);ctx.rotate(an+Math.PI/2);txt(i%4==3?'WHY ME?':'WHAT IF',0,0,`800 ${16+i*1.6}px Disp`,i%3==0?CRL:'rgba(255,255,255,.75)',{ls:3,glow:8,gc:i%3==0?CR:'#fff'})})}
 for(let i=0;i<3;i++){const an=i*2.1+u*.6*spd,r=330+i*60;const x=Math.cos(an)*r,y=Math.sin(an)*r*.8;S(()=>{ctx.translate(x,y);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,30,0,7);ctx.stroke();ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(u*9*spd)*20,Math.sin(u*9*spd)*20);ctx.moveTo(0,0);ctx.lineTo(Math.cos(u*2*spd)*13,Math.sin(u*2*spd)*13);ctx.stroke()})}})}
function d6(u){ctx.fillStyle='#030304';ctx.fillRect(0,0,W,H);
 S(()=>{ctx.translate(540,1110);ctx.rotate(Math.sin(u*1.2)*.05);ctx.translate(-540,-1110);vortex(u,1,1+u*.4)});
 const beat=Math.pow(Math.max(0,Math.sin(u*Math.PI*2*(1.3+u*.25))),12);
 person({x:540,y:1180+132*0,s:.9,f:1,pose:CURL,noShadow:true,...OVR,y:1240});
 S(()=>{ctx.fillStyle=rg(540,1100,250,1000,[[0,'rgba(0,0,0,0)'],[1,`rgba(150,0,25,${.25+.35*beat})`]]);ctx.fillRect(0,0,W,H)});
 topShade();capL(u,.05,9,'RUMINATION');line2(u,.3,1.85,[['Thinking feels like ',0],['progress.',1]],'spin');line2(u,1.95,9,[["It's just a ",0],['loop.',1]],'spin');vignette(.9)}
function d7(u){ctx.fillStyle='#030304';ctx.fillRect(0,0,W,H);
 const calm=eio(seg(u,0,2.6));vortex(u,1-calm,1-calm*.9);
 S(()=>{ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(540,1200,0,700,[[0,`rgba(255,215,170,${.16*calm})`],[1,'rgba(255,215,170,0)']]);ctx.fillRect(0,500,W,1200)});
 const br=u<1.7?eio(seg(u,.1,1.6)):1-eio(seg(u,1.8,3.4));const R=150+110*br;
 S(()=>{ctx.translate(540,1150);ctx.strokeStyle='rgba(255,255,255,.75)';ctx.shadowColor='#fff';ctx.shadowBlur=20;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,R,0,7);ctx.stroke();ctx.globalAlpha=.35;ctx.setLineDash([2,10]);ctx.beginPath();ctx.arc(0,0,R+30,0,7);ctx.stroke()});
 A(.8,()=>txt(u<1.7?'INHALE':'EXHALE',540,1150+R+48,'500 22px Lab','rgba(255,255,255,.8)',{ls:10}));
 const up=eio(seg(u,.4,2.4));person({x:540,y:1240,s:.9,f:1,pose:lpz(CURL,Pz({...CURL,lean:0,hd:-.05}),up),noShadow:true,...OVR});
 const sx=lerp(1200,820,eio(seg(u,.6,1.9)));person({x:sx,y:1280,s:1.1,f:-1,pose:u<1.9?walkP(u*7):lpz(TALL,Pz({aF:[1.2,.1]}),eo(seg(u,2.4,2.8))),...STE});
 tag(820,1350,'STEADY','#fff',eo(seg(u,1.9,2.3)));
 topShade();capL(u,.05,9,'THE PHYSIOLOGICAL SIGH');line2(u,.35,9,[['Slow the breath. The mind ',0],['follows.',1]],'breathe',{br});foot(u,1.6,9,'A long exhale tells your nervous system: safe.');vignette(.85)}
// S8 ACTION
function d8(u){const FL=1420;ctx.fillStyle=lg(0,0,0,H,[[0,'#040406'],[.35,'#0d0f16'],[.55,'#2a2d3a'],[.66,'#6b4a50'],[.7,'#1a1518'],[1,'#050506']]);ctx.fillRect(0,0,W,H);
 S(()=>{ctx.fillStyle='#d9c9c4';ctx.shadowColor='#c98a8a';ctx.shadowBlur=50;ctx.beginPath();ctx.arc(540,1330-eo(seg(u,0,3.6))*40,70,0,7);ctx.fill();ctx.shadowBlur=0;
  [[.2,'#14141a',260],[.5,'#0b0b0f',180]].forEach(([sp,c,hh],L)=>{const r=rng(30+L);const off=(u*220*sp)%1400;ctx.fillStyle=c;for(let i=0;i<30;i++){const bw=60+r()*80,bh=hh*(.4+r()),bx=i*90-off;ctx.fillRect(((bx%1600)+1600)%1600-200,1340-bh,bw,bh)}});
  ctx.fillStyle=lg(0,1330,0,H,[[0,'#16161b'],[1,'#050506']]);ctx.fillRect(0,1330,W,H-1330);ctx.strokeStyle='rgba(255,220,180,.25)';ctx.lineWidth=4;for(let i=0;i<8;i++){const x=((i*180-u*900)%1440+1440)%1440-180;ctx.beginPath();ctx.moveTo(x,1480);ctx.lineTo(x+90,1480);ctx.stroke()}
  ctx.globalCompositeOperation='screen';ctx.fillStyle=rg(540,1330,0,700,[[0,'rgba(200,140,150,.18)'],[1,'rgba(200,140,150,0)']]);ctx.fillRect(0,700,W,1100)});
 S(()=>{ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;const r=rng(2);for(let i=0;i<14;i++){const y=900+r()*500,x=((r()*W-u*1400)%W+W)%W;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+60+r()*80,y);ctx.stroke()}});
 const ph=u*15;
 const tk=1-eo(seg(u,.3,2.8));const tx=lerp(400,-150,eo(seg(u,.3,2.8)));tangle(tx,1000,60+60*tk,u,tk,.8);
 const J1=person({x:440,y:FL,s:1.1,f:1,pose:runP(ph+1),...OVR});const J2=person({x:660,y:FL+10,s:1.1,f:1,pose:runP(ph),...STE});
 [.4,1.2,2.0,2.8].forEach((t0,i)=>droplets(J1.head[0],J1.head[1],u,t0,6,i+20,'#ffe2c4'));
 tag(380,FL+75,'OVERTHINKER',CRL,eo(seg(u,.1,.4)));tag(720,FL+75,'STEADY','#fff',eo(seg(u,.2,.5)));
 topShade();capL(u,.05,9,'MOTION OVER EMOTION');line2(u,.3,9,[['Doubt ',0],['can\u2019t keep up.',1]],'speed');foot(u,1.4,9,'Action is the only thing that quiets the noise.');vignette(.75)}
// S9 PAYOFF
function d9(u){stage(u,[[360,1,'#ffffff'],[720,1,'#ffffff']]);
 const b1=-Math.abs(Math.sin(u*5))*4,b2=-Math.abs(Math.sin(u*5+1))*4;
 person({x:360,y:1420+b1,s:1.25,f:1,pose:Pz({...GUARD}),...OVR,glow:.8});person({x:720,y:1420+b2,s:1.25,f:-1,pose:Pz({...GUARD}),...STE});
 mirror(1420,.14,()=>{person({x:360,y:1420+b1,s:1.25,f:1,noShadow:true,pose:GUARD,...OVR});person({x:720,y:1420+b2,s:1.25,f:-1,noShadow:true,pose:GUARD,...STE})});
 const sk=eio(seg(u,1.0,1.4)),nk=eo(seg(u,1.5,1.9));
 S(()=>{ctx.globalAlpha=1-nk;txt('OVERTHINKER',360,1490,'500 31px Lab',CRL,{ls:9,glow:12,gc:CR});ctx.font='500 31px Lab';ctx.letterSpacing='9px';const w=ctx.measureText('OVERTHINKER').width;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(360-w/2,1490);ctx.lineTo(360-w/2+w*sk,1490);ctx.stroke()});
 A(nk,()=>txt('STEADY',360,1490-(1-nk)*14,'500 31px Lab','#fff',{ls:9,glow:12}));txt('STEADY',720,1490,'500 31px Lab','#fff',{ls:9,glow:12});
 capL(u,.05,9,'THE VOICE IN YOUR HEAD');line2(u,.45,9,[['isn\u2019t always ',0],['right.',1]],'calm');foot(u,1.9,9,'You are the one listening, not the voice.');vignette(.85)}


function ringBG(u){ctx.fillStyle=lg(0,0,0,H,[[0,'#040405'],[.55,'#0e0e11'],[1,'#050506']]);ctx.fillRect(0,0,W,H);
 const FL=1330;
 // crowd back (dim)
 S(()=>{const r=rng(12);for(let row=0;row<2;row++)for(let i=0;i<14;i++){const x=20+i*78+(row?39:0)+r()*14,y=980+row*70+r()*12;ctx.fillStyle=row?'#121216':'#0d0d10';ctx.beginPath();ctx.arc(x,y,26,0,7);ctx.fill();ctx.fillRect(x-34,y+20,68,120)}
  for(let i=0;i<6;i++){const x=80+i*190+((u*30+i*50)%40);if((Math.floor(u*3+i)%5)==0){ctx.fillStyle='rgba(255,255,255,.9)';ctx.shadowColor='#fff';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(x,990,6,0,7);ctx.fill();ctx.shadowBlur=0}}});
 // overhead rig
 S(()=>{ctx.fillStyle='#0a0a0c';ctx.fillRect(140,760,800,18);for(let i=0;i<5;i++){const x=200+i*170;ctx.fillStyle='#0a0a0c';rr(x-26,776,52,30,6);ctx.fill();ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=24;ctx.fillRect(x-18,804,36,5);ctx.shadowBlur=0}
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg(0,800,0,FL,[[0,'rgba(255,255,255,.2)'],[1,'rgba(255,255,255,.05)']]);ctx.beginPath();ctx.moveTo(170,806);ctx.lineTo(910,806);ctx.lineTo(1040,FL);ctx.lineTo(40,FL);ctx.closePath();ctx.fill()});
 dust(120,820,840,500,60,u,.5,8);
 // ring floor + apron
 S(()=>{ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.moveTo(60,FL+10);ctx.lineTo(1020,FL+10);ctx.lineTo(1060,FL+110);ctx.lineTo(20,FL+110);ctx.closePath();ctx.fill();
  ctx.fillStyle=lg(0,FL-20,0,FL+12,[[0,'#d9d9de'],[1,'#a3a3aa']]);ctx.beginPath();ctx.moveTo(110,FL-30);ctx.lineTo(970,FL-30);ctx.lineTo(1010,FL+8);ctx.lineTo(70,FL+8);ctx.closePath();ctx.fill();
  ctx.fillStyle=lg(0,FL+12,0,FL+106,[[0,'#7a1426'],[1,'#3a0812']]);ctx.beginPath();ctx.moveTo(72,FL+14);ctx.lineTo(1008,FL+14);ctx.lineTo(1044,FL+104);ctx.lineTo(36,FL+104);ctx.closePath();ctx.fill();
  txt('S T E A D Y   G Y M',540,FL+60,'800 30px Disp','rgba(255,255,255,.75)',{ls:4})});
 // back ropes + posts
 const posts=[[110,FL-30],[970,FL-30]];
 S(()=>{for(const [x,y] of posts){ctx.fillStyle='#0a0a0c';ctx.fillRect(x-14,y-300,28,300);ctx.fillStyle='#2b2b31';ctx.fillRect(x-8,y-300,10,300);ctx.fillStyle=CR;rr(x-18,y-310,36,40,8);ctx.fill()}
  [[FL-110,'#e9e9ee'],[FL-190,CR],[FL-270,'#e9e9ee']].forEach(([y,c])=>{ctx.strokeStyle='#0a0a0c';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(110,y-30);ctx.quadraticCurveTo(540,y-18,970,y-30);ctx.stroke();ctx.strokeStyle=sh(c==CR?'#d4223f':'#e9e9ee',.7);ctx.lineWidth=6;ctx.stroke()})});
 person({x:(globalThis.__REFX??540)+Math.sin(u*1.3)*40,y:FL-70,s:.98,f:Math.sin(u*1.3)>0?-1:1,pose:Pz({lean:.12,hd:.1,aF:[.5,.6],aB:[-.2,.5],lF:[.15,0],lB:[-.15,0]}),skin:'#8e8e97',top:'#17171b',bot:'#17171b',shoe:'#0d0d10',outfit:'tee',hair:'short',hairCol:'#060607'});
 S(()=>{ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,FL-60)});
}

export {face,H,CRL,WARM,ringBG,A,ANGRY,B,CARD,COVER,CR,CURL,DESK,FLOORSIT,GRAIN,GUARD,HAY,HEADHANDS,HIT,HUD,JAB,MAN,OVR,POSE,Pz,REA,S,SHK,SHRUG,SIT,SLIP,SLUMP,STE,TALL,W,WIND,add,bag,bed,bedroom,bigText,birds,box,bubble,capL,capS,capsule,car,clamp,clock3,counter,ctx,d1,d2,d3,d4,d5,d6,d7,d8,d9,droplets,dust,eback,eio,eo,eye,flick,foot,grain,hair,handbag,headlights,hex,hud,icon,lerp,lg,limb2,line2,lpz,mirror,person,phone,pop,priceTag,rain,rays,rg,rgba,rng,roomsBG,rr,runP,sCTA,sIntro,sMorning,sNight,sOutro,sRing,sShowroom,sStore,seg,sh,sneaker,splashes,stage,steam,storeBG,tag,tangle,thought,topShade,txt,vec,vignette,vortex,walkP,watch,zig};
