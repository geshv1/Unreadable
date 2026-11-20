"""Sound design for 'Two Versions of You'.
Generates two stems synced to the narration timeline:
  assets/audio/music/score.wav            original synthesized score, ducked under the narration
  assets/audio/sound-effects/sfx.wav      all sound effects
Run:  python3 scripts/sound_design.py   (needs numpy + scipy)
"""
import json, wave, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
SR=48000
M=json.load(open('assets/audio/narration/manifest.json'))
END=4.0; T=M['total']+END; N=int(T*SR)
rng=np.random.default_rng(11)
st={s['id']:s['start'] for s in M['scenes']}; st['s14']=M['total']
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],btype='band',fs=SR,output='sos'),x)
def lpf(x,f,o=2): return sosfilt(butter(o,f,btype='low',fs=SR,output='sos'),x)
def hpf(x,f,o=2): return sosfilt(butter(o,f,btype='high',fs=SR,output='sos'),x)
def noise(d): return rng.standard_normal(int(d*SR))
def env(n,a=.005,r=.1):
    t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/r)
class Track:
    def __init__(s): s.L=np.zeros(N); s.R=np.zeros(N)
    def put(s,t,x,g,pan=0.):
        i=int(t*SR); n=min(len(x),N-i)
        if n<=0 or i<0: return
        s.L[i:i+n]+=x[:n]*g*np.sqrt((1-pan)/2); s.R[i:i+n]+=x[:n]*g*np.sqrt((1+pan)/2)
    def bed(s,t0,t1,x,g,pan=0,fade=.25):
        n=int((t1-t0)*SR); x=np.resize(x,n); e=np.ones(n); f=min(int(fade*SR),n//2)
        e[:f]=np.linspace(0,1,f); e[-f:]=np.linspace(1,0,f); s.put(t0,x*e,g,pan)
# ---------------- sound library ----------------
def clunk(): n=int(.6*SR);t=np.arange(n)/SR;x=noise(.6);return lpf(x,300)*env(n,.001,.05)*2+np.sin(2*np.pi*60*t)*env(n,.01,.3)*.3+bp(x,2000,5000)*env(n,.0005,.01)
def sub(d=1.6,f0=60,f1=30): n=int(d*SR);t=np.arange(n)/SR;return np.sin(2*np.pi*np.cumsum(f1+(f0-f1)*np.exp(-t*4))/SR)*np.exp(-t*2.2)
def whoosh(d=.5): n=int(d*SR);t=np.linspace(0,1,n);return bp(noise(d),400,2500)*np.sin(np.pi*t)**3
def riser(d): n=int(d*SR);t=np.linspace(0,1,n);x=noise(d);return (bp(x,300,1200)*(1-t)+bp(x,1500,6000)*t)*t**2
def bell(f=1568,d=1.2): n=int(d*SR);t=np.arange(n)/SR;return sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t*(3+k)) for k,a in [(1,1),(2.01,.4),(3.98,.2)])
def ping(f=1320): n=int(.5*SR);t=np.arange(n)/SR;return (np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*2.01*t))*np.exp(-t*8)*np.minimum(1,t/.002)
def beep(f=2600,d=.07): n=int(d*SR);t=np.arange(n)/SR;return lpf(np.sign(np.sin(2*np.pi*f*t)),6000)*np.minimum(1,t/.003)*np.minimum(1,(d-t)/.006)
def alarm(d):
    o=np.zeros(int(d*SR));p=0.
    while p<d-.4:
        for k in range(3):
            b=beep();i=int((p+k*.11)*SR);o[i:i+len(b)]+=b[:len(o)-i]
        p+=.6
    return o
def rustle(d=.4):
    n=int(d*SR);y=np.zeros(n)
    for _ in range(int(d*120)):
        i=rng.integers(0,max(1,n-600));y[i:i+500]+=bp(noise(500/SR),1500,9000)*env(500,.0003,.004)*rng.random()
    return y*np.sin(np.pi*np.linspace(0,1,n))*2.5
def paper_slap(): n=int(.12*SR);return bp(noise(.12),800,5000)*env(n,.0005,.02)*1.5+lpf(noise(.12),300)*env(n,.0005,.03)
def scratch(d=.2): x=bp(noise(d),2000,8000);t=np.linspace(0,1,len(x));return x*np.sin(np.pi*t)*(.6+.4*np.sin(2*np.pi*40*t*d))
def footstep(hard=True):
    n=int(.18*SR);t=np.arange(n)/SR;th=np.sin(2*np.pi*np.cumsum(70+60*np.exp(-t*40))/SR)*env(n,.002,.04)
    return th*.7+(bp(noise(.18),1800,6000)*env(n,.001,.012)*1.2 if hard else bp(noise(.18),300,1500)*env(n,.002,.03)*.8)
def breath(d,inh=False): x=bp(noise(d),250,2200);t=np.linspace(0,1,len(x));return x*np.sin(np.pi*t)**1.2*((t) if inh else (1-t*.6))
def clank():
    n=int(1.0*SR);t=np.arange(n)/SR;return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,a,d in [(310,1,6),(737,.6,9),(1290,.4,12),(2210,.25,16)])*.6+bp(noise(1.0),1000,6000)*env(n,.0005,.02)
def strain(d): t=np.arange(int(d*SR))/SR;return lpf(noise(d),400)*(t/d)**1.5*.8
def keyclick(): n=int(.03*SR);return bp(noise(.03),1500,7000)*env(n,.0005,.005)*1.3
def hum(d,f=100): t=np.arange(int(d*SR))/SR;return (np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*2*f*t))*.2+bp(noise(d),3000,8000)*.03
def buzz_flicker(d):
    t=np.arange(int(d*SR))/SR;x=hum(d,120)*2;g=(np.sin(2*np.pi*8*t)>-.3).astype(float);return x*lpf(g,40)
def tv(d): x=noise(d);t=np.arange(len(x))/SR;return bp(x,200,900)*(.5+.5*np.abs(np.sin(2*np.pi*2.3*t)*np.sin(2*np.pi*.7*t)))
def laugh(d=.9):
    x=bp(noise(d),500,1800,3);t=np.arange(len(x))/SR;m=np.clip(np.sin(2*np.pi*5.5*t),0,1)**2*np.exp(-t*1.8);return x*m*2
def clink(): n=int(.8*SR);t=np.arange(n)/SR;return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,a,d in [(3150,1,7),(4720,.6,9),(6280,.3,12)])*.5
def creak(): n=int(.5*SR);t=np.arange(n)/SR;return bp(np.sign(np.sin(2*np.pi*(90+40*t)*t))*np.exp(-t*4),200,1500)*.4+lpf(noise(.5),200)*env(n,.002,.08)
def door(): n=int(.9*SR);x=noise(.9);return bp(x,1500,6000)*env(n,.0005,.01)*1.5+lpf(x,600)*np.sin(np.pi*np.linspace(0,1,n))*.5
def wind(d): x=noise(d);t=np.arange(len(x))/SR;return bp(x,150,900)*(.6+.4*np.sin(2*np.pi*.3*t))
def tick(): n=int(.04*SR);return bp(noise(.04),2500,7000)*env(n,.0003,.004)*2
def crowd(d):
    x=noise(d);t=np.arange(len(x))/SR;return bp(x,250,1800,3)*(.55+.25*np.sin(2*np.pi*.4*t)+.2*np.sin(2*np.pi*1.7*t+1))
def punch():
    n=int(.35*SR);x=noise(.35);t=np.arange(n)/SR
    return bp(x,900,4500,3)*env(n,.0008,.018)*2.2+np.sin(2*np.pi*np.cumsum(55+90*np.exp(-t*35))/SR)*env(n,.002,.09)*1.1
def crack(): n=int(.4*SR);return hpf(noise(.4),1500)*env(n,.0005,.04)*1.2
def swish(d=.25): n=int(d*SR);t=np.linspace(0,1,n);return bp(noise(d),600,3500)*np.exp(-((t-.6)/.2)**2)*1.5

S=Track()
# S01
S.put(st['s01']+.05,clunk(),.30,-.4); S.put(st['s01']+.35,clunk(),.30,.4)
# S02
S.put(st['s02']+.1,rustle(1.2),.10); S.put(st['s02']+.4,riser(1.4),.06); S.put(3.86,bell(1046),.08,.4)
# S03
s=st['s03']; S.put(s,alarm(.95),.07,.5); S.put(s+.7,rustle(.35),.12,-.3)
for k in [1.6,1.75]: S.put(s+k,ping(1568),.05,-.2)
for i in range(10): S.put(s+3.3+i*.09,ping(1800+i*90),.025,-.2+i*.04)
# S04
s=st['s04']; S.bed(s,st['s05'],tv(st['s05']-s),.035,-.6)
for i in range(11):
    S.put(s+.4+i*.3,paper_slap(),.09,-.5+i*.1); S.put(s+.75+i*.3,scratch(.15),.05,-.5+i*.1)
# S05
s=st['s05']; S.put(s+.55,rustle(.6),.14); S.put(s+1.3,ping(880),.03); S.put(s+2.85,scratch(.3),.10)
for k in [3.05,3.35]: S.put(s+k,footstep(False),.10)
# S06
s=st['s06']
for k in np.arange(0,1.3,np.pi/14): S.put(s+k,footstep(True),.07)
S.put(s+.2,breath(.5),.06); S.put(s+.8,breath(.45),.06)
S.put(s+1.35,strain(.6),.10); S.put(s+1.95,clank(),.14)
for k in np.arange(2.45,4.0,.085): S.put(s+k+rng.random()*.03,keyclick(),.06,.3)
# S07
s=st['s07']; S.put(s+.03,sub(1.7,55,28),.45); S.bed(s,st['s08'],buzz_flicker(1.8),.05)
# S08-S10 lounge
s=st['s08']; S.bed(s,st['s11'],tv(st['s11']-s),.04,-.6)
for k in np.arange(.25,3.6,.43): S.put(s+k,footstep(True),.06,-.6+k*.35)
S.put(s+1.0,whoosh(2.0),.05)
for i in range(3): S.put(s+4.5+i*.12,scratch(.18),.07,-.3+i*.3)
s=st['s09']; S.put(s+.35,laugh(),.06,-.3); S.put(s+1.3,laugh(.7),.05,.1); S.put(s+2.3,clink(),.06,.3); S.put(s+2.3,riser(1.5)*.5,.05)
s=st['s10']; S.put(s+.65,creak(),.12,-.5); S.put(s+2.1,door(),.10,.6); S.bed(s+2.2,st['s11'],wind(1.6),.05,.6)
for k in np.arange(2.2,3.7,.43): S.put(s+k,footstep(True),.05,.7)
# S11
s=st['s11']; dt=.36;k=.2
while k<2.6: S.put(s+k,tick(),.07); k+=dt; dt=max(.12,dt*.86)
S.put(s+3.4,door(),.05,.6); S.bed(s+3.4,st['s12'],crowd(2.2)*.6,.035)
for j in range(4): S.put(s+3.4+.6+j*.1,ping(1175+j*120),.02,-.4+j*.25)
# S12
s=st['s12']; S.bed(s,st['s13'],crowd(4.4)*.5,.03)
for i,t0 in enumerate([.5,1.1,1.7,2.3,2.9,3.5,4.0]):
    S.put(s+t0-.25,swish(),.06,-.5); S.put(s+t0,punch(),.14 if i<6 else .22,.1); S.put(s+t0,crack(),.05 if i<6 else .12,.1)
S.put(s+4.0,sub(1.4,70,32),.25)
# S13
s=st['s13']
for i in range(7):
    S.put(s+.4+i*.28,tick(),.08,-.4); S.put(s+.45+i*.28,ping(1568),.012,.4)
# S14
s=st['s14']; S.put(s,whoosh(.7),.05); S.put(s+.35,bell(1318,1.5),.04); S.put(s+1.15,tick(),.10)
# transitions
for sid in ['s02','s03','s04','s05','s06','s08','s09','s10','s12','s13']: S.put(st[sid]-.12,whoosh(.25),.025)

# ---------------- music ----------------
Mu=Track(); t=np.arange(N)/SR
def hz(m): return 440*2**((m-69)/12)
def pad(f,d,amp):
    n=int(d*SR);tt=np.arange(n)/SR;x=sum(np.sin(2*np.pi*f*k*tt*(1+.002*j))/k for k in (1,2,3) for j in (-1,1))
    e=np.minimum(1,tt/.8)*np.minimum(1,(d-tt)/.8);return lpf(x,800)*e*amp
def pno(f,d=2.4): n=int(d*SR);tt=np.arange(n)/SR;return lpf(sum(np.sin(2*np.pi*f*k*tt)*np.exp(-tt*(2+k*1.5))/k**1.3 for k in range(1,6)),3000)*np.minimum(1,tt/.004)
def kick(): n=int(.5*SR);tt=np.arange(n)/SR;return np.sin(2*np.pi*np.cumsum(40+60*np.exp(-tt*25))/SR)*np.exp(-tt*7)
sections=[(0,23.0,[(0,[33,45,48,52]),(9.9,[29,45,48,53]),(14.4,[36,43,48,52]),(18.9,[31,43,47,50])],.55,True),
          (24.8,38.0,[(24.8,[26,38,41,45]),(30.1,[22,38,41,46]),(34.3,[28,40,43,47])],.45,True),
          (38.0,48.0,[(38.0,[36,48,52,55]),(40.5,[31,47,50,55]),(43.0,[33,48,52,57]),(45.5,[29,48,53,57])],.32,False),
          (52.7,T,[(52.7,[36,48,52,55,62])],.7,False)]
for a,b,chords,step,dark in sections:
    for i,(c0,ns) in enumerate(chords):
        c0=max(c0,a) if i==0 else c0; c1=chords[i+1][0] if i+1<len(chords) else b
        for m in ns: Mu.put(c0,pad(hz(m),c1-c0+.6,.06 if m<40 else .03),1)
        tp=c0+.05;k=0
        while tp<c1-.05:
            m=ns[1:][k%(len(ns)-1)]+12+(12 if (k//3)%2 and not dark else 0); Mu.put(tp,pno(hz(m)),.03 if dark else .035,(-.3 if k%2 else .3)); k+=1; tp+=step
for k in np.arange(0.,23.0,60/70): Mu.put(k,kick(),.10)
for k in np.arange(24.8,38.0,60/58): Mu.put(k,kick(),.07)
Mu.put(38.0,riser(9.6),.05)
Mu.put(48.0,pad(hz(33),4.9,.08),1); Mu.put(48.0,pno(hz(57),4.5),.04)
# duck under narration
W=[w for s in M['scenes'] for w in s['words']]
g=np.ones(N)
for w in W:
    i0=max(0,int((w['s']-.08)*SR)); i1=min(N,int((w['e']+.12)*SR)); g[i0:i1]=.42
g=lpf(g,6,1); Mu.L*=g; Mu.R*=g
# rooms: light reverb
def verb(tr,amt):
    n=int(1.3*SR);ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*4.5);ir=lpf(ir,4500);ir/=np.sqrt((ir**2).sum())
    tr.L=tr.L+fftconvolve(tr.L,ir)[:N]*amt; tr.R=tr.R+fftconvolve(tr.R,ir[::-1].copy()[::-1])[:N]*amt
verb(S,.15); verb(Mu,.25)
fo=int(.6*SR)
for tr in (S,Mu): tr.L[-fo:]*=np.linspace(1,0,fo); tr.R[-fo:]*=np.linspace(1,0,fo)
def save(tr,path,peak):
    x=np.stack([tr.L,tr.R],1); x=x/np.max(np.abs(x))*peak
    w=wave.open(path,'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes());w.close()
save(Mu,'assets/audio/music/score.wav',.5)
save(S,'assets/audio/sound-effects/sfx.wav',.6)
print('ok',T)
