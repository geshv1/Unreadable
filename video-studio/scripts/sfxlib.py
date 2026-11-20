"""Shared synthesized sound library (was: sound design for 'Two Versions of You'.
Generates two stems synced to the narration timeline:
  assets/audio/music/score.wav            original synthesized score, ducked under the narration
  assets/audio/sound-effects/sfx.wav      all sound effects
Run:  python3 scripts/sound_design.py   (needs numpy + scipy)
"""
import json, wave, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
SR=48000
T=60.0; N=int(T*SR)
def set_length(sec):
    global T,N
    T=sec; N=int(T*SR)
rng=np.random.default_rng(11)
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],btype='band',fs=SR,output='sos'),x)
def lpf(x,f,o=2): return sosfilt(butter(o,f,btype='low',fs=SR,output='sos'),x)
def hpf(x,f,o=2): return sosfilt(butter(o,f,btype='high',fs=SR,output='sos'),x)
def noise(d): return rng.standard_normal(int(d*SR))
def env(n,a=.005,r=.1):
    t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/r)
class Track:
    def __init__(s): s.N=N; s.L=np.zeros(N); s.R=np.zeros(N)
    def put(s,t,x,g,pan=0.):
        i=int(t*SR); n=min(len(x),s.N-i)
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


# ---- extra realistic sounds for the series ----
def bell_ring(): n=int(2.2*SR);t=np.arange(n)/SR;return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,a,d in [(1046,1,1.6),(2610,.5,2.4),(3720,.3,3),(5180,.15,4)])
def boxing_bell(): b=bell_ring();o=np.zeros(len(b)+int(.35*SR));o[:len(b)]+=b;o[int(.35*SR):]+=b*.9;return o
def ding(): return ping(1760)*.7+np.concatenate([np.zeros(int(.12*SR)),ping(2349)])[:int(.5*SR)]
def thud(d=.5): n=int(d*SR);t=np.arange(n)/SR;return np.sin(2*np.pi*np.cumsum(50+80*np.exp(-t*30))/SR)*np.exp(-t*9)+lpf(noise(d),300)*env(n,.001,.04)
def slam(): return thud(.6)*1.2+np.concatenate([bp(noise(.3),400,3000)*env(int(.3*SR),.0005,.03),np.zeros(int(.3*SR))])
def chair_scrape(d=.45): x=bp(noise(d),300,2500);t=np.linspace(0,1,len(x));return x*np.sin(np.pi*t)*(1+.6*np.sin(2*np.pi*35*t*d))
def can_open(): n1=int(.08*SR);c=bp(noise(.08),1500,7000)*env(n1,.0003,.01)*2;f=hpf(noise(.9),3000)*np.exp(-np.arange(int(.9*SR))/SR*3)*.4;return np.concatenate([c,f])
def send_swoosh(): n=int(.25*SR);t=np.linspace(0,1,n);return bp(noise(.25),800,5000)*np.sin(np.pi*t)**2*(t**.5)
def vibrate(d=.5): n=int(d*SR);t=np.arange(n)/SR;return lpf(np.sign(np.sin(2*np.pi*170*t)),900)*(np.sin(2*np.pi*12*t)>-.2)*np.minimum(1,(d-t)/.03)*.5
def phone_down(): n=int(.15*SR);return bp(noise(.15),800,4000)*env(n,.0005,.02)+thud(.15)*.4
def rain_bed(d,bright=1.):
    x=noise(d);y=bp(x,800,7000)*.35+lpf(x,500)*.25;n=len(x)
    for _ in range(int(d*120)):
        i=rng.integers(0,n-800);y[i:i+300]+=hpf(noise(300/SR),2500)*env(300,.0005,.002)*rng.random()*1.2*bright
    return y
def thunder(d=2.5): n=int(d*SR);t=np.arange(n)/SR;x=lpf(noise(d),180,3)*np.exp(-t*1.4)*(1+np.sin(2*np.pi*3*t)*.4);return x*3
def wet_step(): n=int(.18*SR);return footstep(False)*.8+bp(noise(.18),2000,7000)*env(n,.002,.05)*.6
def grip_creak(): n=int(.3*SR);t=np.arange(n)/SR;return bp(np.sign(np.sin(2*np.pi*(180+60*t)*t)),300,2500)*np.exp(-t*8)*.3
def arena(d):
    x=noise(d);t=np.arange(len(x))/SR;return bp(x,200,2500,3)*(.6+.2*np.sin(2*np.pi*.25*t)+.2*np.sin(2*np.pi*1.1*t))
def crowd_ooh(d=1.4): n=int(d*SR);t=np.linspace(0,1,n);x=sum(bp(noise(d),f,f*1.6) for f in (300,420,560));return x*np.sin(np.pi*t)**1.5
def crowd_roar(d=2.2): n=int(d*SR);t=np.linspace(0,1,n);return bp(noise(d),250,4000,3)*np.minimum(1,t*6)*np.exp(-t*1.6)*1.6
def heavy_breath(d):
    o=np.zeros(int(d*SR));p=0.
    while p<d-.5:
        b=np.concatenate([breath(.32,True)*.8,breath(.38)]);i=int(p*SR);o[i:i+len(b)]+=b[:len(o)-i];p+=.62
    return o
def rumble(d): n=int(d*SR);t=np.linspace(0,1,n);return lpf(noise(d),120,3)*t**1.5*3
def debris():
    y=np.zeros(int(1.0*SR))
    for _ in range(26):
        i=rng.integers(0,len(y)-2000);y[i:i+1500]+=bp(noise(1500/SR),1500,8000)*env(1500,.0003,.006)*rng.random()
    return y*1.5

def verb(tr,amt,secs=1.3,decay=4.5):
    n=int(secs*SR);ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*decay);ir=lpf(ir,4500);ir/=np.sqrt((ir**2).sum())
    tr.L=tr.L+fftconvolve(tr.L,ir)[:tr.N]*amt; tr.R=tr.R+fftconvolve(tr.R,ir)[:tr.N]*amt
def save(tr,path,peak=.6,fade=.5):
    fo=int(fade*SR);tr.L[-fo:]*=np.linspace(1,0,fo);tr.R[-fo:]*=np.linspace(1,0,fo)
    x=np.stack([tr.L,tr.R],1); x=x/np.max(np.abs(x))*peak
    w=wave.open(path,'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes());w.close()
def room(d,lo=60,hi=400): return bp(noise(d),lo,hi)*.5
def heartbeat():
    n=int(.5*SR);tt=np.arange(n)/SR;b=lambda o,a:np.sin(2*np.pi*48*(tt-o))*np.exp(-np.maximum(0,tt-o)*18)*(tt>o)*a;return lpf(b(0,1)+b(.16,.7),200)
def tap(): n=int(.035*SR);return bp(noise(.035),1500,6000)*env(n,.0005,.006)*1.4+lpf(noise(.035),400)*env(n,.0005,.01)*.6
def scribble(d):
    x=bp(noise(d),2500,7000);t=np.arange(len(x))/SR;m=np.clip(np.sin(2*np.pi*9*t)*.5+.5+.3*np.sin(2*np.pi*3.1*t),0,1)**2;return x*m
def whisper(d):
    x=bp(noise(d),1800,7000);t=np.arange(len(x))/SR;m=np.clip(np.sin(2*np.pi*5.5*t+np.sin(2*np.pi*1.3*t)*2),0,1)**1.5;return x*m*np.hanning(len(x))
def carpass(d=1.6):
    n=int(d*SR);t=np.linspace(0,1,n);x=noise(d);return (lpf(x,900)*1.2+bp(x,1000,3000)*.25+bp(noise(d),2000,6000)*.25)*np.exp(-((t-.5)/.22)**2)
def birds(d):
    y=np.zeros(int(d*SR))
    for _ in range(int(d*1.5)):
        i=rng.integers(0,len(y)-SR//4);n=int(.12*SR);t=np.arange(n)/SR;f=3200+1400*np.sin(2*np.pi*14*t);y[i:i+n]+=np.sin(2*np.pi*np.cumsum(f)/SR)*np.hanning(n)*.4
    return y
def register():
    n=int(.9*SR);t=np.arange(n)/SR;b=sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,a,d in [(2093,1,5),(2637,.6,6),(3520,.4,8),(4699,.25,9)]);return b*.5+bp(noise(.9),1500,6000)*env(n,.001,.03)
