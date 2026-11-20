"""Sound effects for Video D — He Wasn't Tired, He Was Comfortable."""
import sys; sys.path.insert(0,'scripts')
import numpy as np, sfxlib as L
from sfxlib import *
D=[3.0,5.0,4.5,3.2,4.5,3.8,5.0,5.0,4.0,3.6]; st=np.concatenate([[0],np.cumsum(D)]); L.set_length(float(st[-1]))
S=L.Track(); d1,d2,d3,d4,d5,d6,d7,d8,d9,d10=st[:10]
def cushion(): n=int(.6*SR);return lpf(noise(.6),250)*env(n,.01,.15)*1.5+bp(noise(.6),300,1200)*env(n,.02,.1)*.3
def crinkle(d=.3): return rustle(d)*1.2
def swipe(): n=int(.12*SR);t=np.linspace(0,1,n);return bp(noise(.12),1500,6000)*np.sin(np.pi*t)
def drip(): n=int(.25*SR);t=np.arange(n)/SR;return np.sin(2*np.pi*np.cumsum(1400-900*t/.25)/SR)*np.exp(-t*25)*.6
# d1
S.bed(d1,d2,tv(D[0]),.04,-.5);S.put(d1+.4,cushion(),.18);S.put(d1+1.2,cushion(),.10);S.put(d1+.5,sub(2.4,40,28),.06)
# d2
S.bed(d2,d3,tv(D[1]),.03,-.6)
for i in range(7):
    t0=d2+i*.68;S.put(t0,whoosh(.2),.03);S.put(t0+.05,tick(),.06)
    k=i%4
    if k==0: S.put(t0+.2,clank()[:int(.4*SR)],.06,.5)
    elif k==1: [S.put(t0+j*.21,footstep(True),.05,.5) for j in range(3)]
    elif k==2: [S.put(t0+j*.09,keyclick(),.04,.5) for j in range(6)]
    else: S.put(t0+.1,rustle(.25),.05,.5)
    if i in (0,3,5): S.put(t0+.3,crinkle(),.06,-.5)
# d3
S.bed(d3,d4,tv(D[2]),.03,-.5);S.bed(d3,d4,room(D[2],40,160),.05)
for i in range(5): S.put(d3+.4+i*.7,crinkle(.25),.06,-.4+i*.2)
S.put(d3+.2,riser(4.0)*.5,.04);S.put(d3+3.8,heartbeat(),.08)
# d4
S.put(d4,sub(3.0,45,28),.08);S.put(d4+.2,whoosh(2.4)*.6,.04)
for k in np.arange(0,3.2,.43): S.put(d4+k,footstep(True),.04,.6)
# d5 mirror
S.bed(d5,d6,room(D[4],60,300),.05)
for k in [.6,1.9,3.3]: S.put(d5+k,drip(),.06,-.3)
S.put(d5+1.2,bell(784,2.5),.03);S.put(d5+2.6,breath(1.0),.06);S.put(d5+2.8,heartbeat(),.10)
# d6 invite
S.bed(d6,d7,tv(D[5])*.6,.02,-.5);S.put(d6+.2,vibrate(.4),.07,.5);S.put(d6+.25,ping(1318),.04,.5);S.put(d6+.5,ping(1318),.03,.5)
for k in np.arange(2.4,3.3,.14): S.put(d6+k,tap(),.05,.4)
S.put(d6+3.4,send_swoosh(),.06,.5)
# d7 6am run
S.bed(d7,d8,wind(D[6]),.05);S.bed(d7,d8,birds(D[6]),.012,.5)
for k in np.arange(0,1.6,np.pi/9): S.put(d7+k,footstep(True),.07,-.2)
for k in np.arange(0,1.8,np.pi/12): S.put(d7+k,footstep(True),.05,.4)
S.put(d7+1.6,heavy_breath(1.9),.08,-.2)
for k in np.arange(1.8,3.2,.43): S.put(d7+k,footstep(True),.05,0)
for k in np.arange(3.4,5.0,np.pi/9): S.put(d7+k,footstep(True),.06,-.1);S.put(d7+k+.1,footstep(True),.05,.2)
# d8 weeks
for i in range(5):
    t0=d8+i;S.put(t0,whoosh(.25),.05);S.put(t0+.02,thud(.35),.08)
    if i%2==0: [S.put(t0+j*.24,footstep(True),.05,(-1)**j*.2) for j in range(4)]
    else: S.put(t0+.35,clank(),.08);S.put(t0+.4,breath(.4),.05)
# d9
S.put(d9,sub(2.0,50,30),.08);S.put(d9+1.0,bp(noise(.35),2000,8000)*np.hanning(int(.35*SR)),.05,-.3);S.put(d9+1.5,bell(1046,1.8),.04,-.3)
S.put(d10,whoosh(.7),.05);S.put(d10+.35,bell(1318,1.5),.04);S.put(d10+1.15,tick(),.10)
for x in st[1:-1]: S.put(x-.1,whoosh(.25),.03)
verb(S,.14);save(S,'assets/audio/sound-effects/d_comfort_sfx.wav',.6);print('ok',st[-1])
