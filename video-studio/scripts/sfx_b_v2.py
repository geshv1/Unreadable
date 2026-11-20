"""Sound effects for Video B — Move in Silence."""
import sys; sys.path.insert(0,'scripts')
import numpy as np, sfxlib as L
from sfxlib import *
D=[3.0,5.5,3.2,4.0,5.0,3.0,4.5,4.4,4.0,3.6]; st=np.concatenate([[0],np.cumsum(D)]); L.set_length(float(st[-1]))
L.set_length(31.1300); L.MAP=L.make_map([(0, 2.0, 0, 1.0), (3.0, 8.5, 2.0, 1.28), (8.5, 11.7, 6.296875, 1.28), (11.7, 15.7, 8.796875, 1.28), (15.7, 20.7, 11.921875, 1.28), (20.7, 23.7, 15.828125, 1.28), (23.7, 28.2, 18.171875, 1.28), (28.2, 32.6, 21.6875, 1.28), (32.6, 36.6, 25.125, 1.28), (36.6, 40.2, 28.25, 1.25)]); L.SPARSE=True

S=L.Track(); b1,b2,b3,b4,b5,b6,b7,b8,b9,b10=st[:10]
def babble(d):
    x=bp(noise(d),300,2400,3);t=np.arange(len(x))/SR;m=np.clip(np.sin(2*np.pi*4.7*t+np.sin(2*np.pi*1.1*t)*2),0,1)**1.5;return x*m
def shh(d=.9): n=int(d*SR);t=np.linspace(0,1,n);return bp(noise(d),3000,9000)*np.sin(np.pi*t)**.8
def pop_s(): n=int(.06*SR);t=np.arange(n)/SR;return np.sin(2*np.pi*np.cumsum(900-500*t/(.06))/SR)*np.exp(-t*60)
def chop(): n=int(.12*SR);t=np.arange(n)/SR;return thud(.12)*.6+bp(noise(.12),1500,6000)*env(n,.0005,.01)*1.2
def lid(): n=int(.1*SR);return bp(noise(.1),2000,8000)*env(n,.0003,.008)*1.5+ping(2400)[:n]*.2
def applause(d):
    y=np.zeros(int(d*SR))
    for _ in range(int(d*260)):
        i=rng.integers(0,len(y)-2000);y[i:i+1200]+=bp(noise(1200/SR),900,5000)*env(1200,.0003,.006)*(.4+rng.random())
    return y
def page(): return rustle(.25)
S.put(b1+.05,clunk(),.3,-.4);S.put(b1+.25,clunk(),.3,.4);S.bed(b1+.1,b2,babble(2.9),.06,-.5);S.put(b1+.65,shh(),.06,.5)
S.bed(b2,b3,room(D[1],80,300),.03,.5)
for k in np.arange(0,.4,.07): S.put(b2+k,tap(),.04,-.5)
S.put(b2+.4,send_swoosh(),.06,-.5)
for i in range(10): S.put(b2+.5+i*.28,pop_s(),.05,-.5);S.put(b2+.5+i*.28,ping(1600+i*60),.012,-.5)
for t0 in [1.0,1.6,2.2]: S.put(b2+t0,ping(1318),.03,-.5)
per=2*np.pi/4.6
for k in np.arange(.3,5.5,per): S.put(b2+k,clank()[:int(.3*SR)],.05,.5);S.put(b2+k+.3,breath(.45),.04,.5)
for i in range(14): S.put(b3+.2+i*.12,ping(1400+i*70),.02,np.sin(i))
S.put(b3+.3,riser(1.5),.04);S.put(b3+1.8,tick(),.08)
S.bed(b4,b5,tv(D[3]),.035,-.6)
for k in np.arange(0,4,np.pi/9): S.put(b4+k,chop(),.08,.5)
for i in range(4): S.put(b4+.5+i*.6,lid(),.06,.5)
S.bed(b5,b6,babble(D[4])*.7,.05);S.put(b5,door(),.06,.6)
for k in np.arange(0,1.3,.43): S.put(b5+k,footstep(True),.07,.6-k*.3)
for t0 in [1.5,2.3,3.1]: S.put(b5+t0,whisper(1.0) if hasattr(L,'whisper') else bp(noise(1.0),1800,7000)*np.hanning(int(SR)),.06,-.4)
S.put(b6+.05,applause(1.5),.10);S.put(b6+1.2,hum(1.0,80)*np.hanning(int(SR)),.06);S.put(b6+1.6,sub(1.3,50,30),.10)
S.bed(b7,b8,wind(D[6]),.05);S.put(b7+.6,carpass(1.8) if hasattr(L,'carpass') else whoosh(1.8),.04,.6)
for i,t0 in enumerate([0,1.1,2.2,3.3]):
    S.put(b8+t0,whoosh(.3),.05);S.put(b8+t0+.02,thud(.4),.12)
    for k in np.arange(.05,.9,.07): S.put(b8+t0+k,tick(),.025)
S.put(b8+1.1+.55,clank(),.12);S.put(b8+2.2+.1,page(),.08);S.put(b8+3.3+.1,crowd_roar(1.4),.08)
S.put(b9+.05,sub(1.8,50,30),.08);S.put(b9+1.2,ping(1318),.02,-.4)
S.put(b10,whoosh(.7),.05);S.put(b10+.35,bell(1318,1.5),.04);S.put(b10+1.15,tick(),.10)
for x in st[1:-1]: S.put(x-.1,whoosh(.25),.03)
verb(S,.12);save(S,'assets/audio/sound-effects/b_silence_sfx_v2.wav',.6);print('ok',st[-1])
