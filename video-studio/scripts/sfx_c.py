"""Sound effects for Video C — 30-Day Dopamine Detox."""
import sys; sys.path.insert(0,'scripts')
import numpy as np, sfxlib as L
from sfxlib import *
D=[3.0,4.0,4.5,4.0,3.2,5.0,4.0,5.5,3.5,3.6]; st=np.concatenate([[0],np.cumsum(D)]); L.set_length(float(st[-1]))
S=L.Track(); c1,c2,c3,c4,c5,c6,c7,c8,c9,c10=st[:10]
def lid_close():
    t=thud(.3)*.8;n=int(.2*SR);t[:n]+=bp(noise(.2),600,3000)*env(n,.0005,.02);return t
def wood_creak(): n=int(.5*SR);t=np.arange(n)/SR;return bp(np.sign(np.sin(2*np.pi*(120+80*t)*t)),300,2000)*np.exp(-t*5)*.35
def page(): return rustle(.25)
def zap(up=True): n=int(.35*SR);t=np.arange(n)/SR;f=600+1400*(t/.35 if up else 1-t/.35);return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*6)*.5
def snore_breath(d=1.8): x=bp(noise(d),150,900);t=np.linspace(0,1,len(x));return x*np.sin(np.pi*t)**2
def swipe(): n=int(.12*SR);t=np.linspace(0,1,n);return bp(noise(.12),1500,6000)*np.sin(np.pi*t)
# c1
S.put(c1+.05,clunk(),.25,-.4);S.put(c1+.25,clunk(),.25,.4)
for i in range(9): S.put(c1+.4+i*.27,ping(1200+((i*370)%900)),.03,np.sin(i*1.7))
S.put(c1,hum(3.0,100),.03)
# c2
S.bed(c2,c3,birds(D[1]) if hasattr(L,'birds') else room(D[1]),.015);S.bed(c2,c3,room(D[1],60,250),.04)
S.put(c2+1.6,lid_close(),.12,-.5);S.put(c2+1.6,lid_close(),.12,.5)
for t0 in [2.0,2.5]: S.put(c2+t0,vibrate(.35),.06,-.5)
# c3
S.bed(c3,c4,room(D[2],50,200),.05)
for k in np.arange(0,4.5,1.0): S.put(c3+k,tick(),.06)
for k in np.arange(.3,4.5,.8): S.put(c3+k,heartbeat(),.10,-.5)
for k in [.5,1.4,2.3,3.4]: S.put(c3+k,vibrate(.25),.05,-.5)
S.put(c3+2.5,door(),.08,.6);S.bed(c3+2.6,c4,wind(1.9),.04,.6)
for k in np.arange(2.6,4.4,.43): S.put(c3+k,footstep(True),.06,.6)
# c4
S.put(c4+.1,wood_creak(),.10,-.5);S.put(c4+.35,tick(),.08,-.5)
for k in np.arange(1.0,3.0,.05): S.put(c4+k,tick(),.02,-.5)
for k in np.arange(1.0,3.0,.25): S.put(c4+k,swipe(),.03,-.5)
for k in [.6,1.6,2.6,3.5]: S.put(c4+k,page(),.06,.5)
# c5
S.put(c5,sub(3.0,40,30),.06)
for i,p in enumerate([.1,.25,.4,.55,.7,.85]): t0=c5+.1+p*2.5; S.put(t0,zap(True),.05,-.3);S.put(t0+.2,zap(False),.04,-.3)
# c6
for k in np.arange(.2,5,.42): S.put(c6+k+rng.random()*.1,ping(1318+rng.integers(0,6)*90),.022,-.5)
for k in np.arange(0,5,.33): S.put(c6+k,tap(),.04,-.5)
for k in np.arange(0,5,.09): S.put(c6+k+rng.random()*.02,keyclick(),.035,.5)
for k in np.arange(0,5,1.0): S.put(c6+k,tick(),.03,.5)
# c7
for k in np.arange(.1,4,.55): S.put(c7+k,swipe(),.04,-.5)
S.put(c7+1.8,breath(.9),.05,-.5);S.put(c7+.2,snore_breath(),.04,.5);S.put(c7+2.1,snore_breath(),.04,.5)
for k in np.arange(0,4,1.0): S.put(c7+k,tick(),.03)
# c8
for i in range(9): S.put(c8+.1+i*.14,tick(),.08)
S.put(c8+1.45,thud(.4),.10);S.put(c8+1.5,bell(1046,2.0),.05,.4);S.put(c8+1.4,sub(1.6,50,30),.08)
# c9
S.put(c9,hum(3.5,80),.03);S.put(c9+.6,phone_down(),.06)
S.put(c10,whoosh(.7),.05);S.put(c10+.35,bell(1318,1.5),.04);S.put(c10+1.15,tick(),.10)
for x in st[1:-1]: S.put(x-.1,whoosh(.25),.03)
verb(S,.14);save(S,'assets/audio/sound-effects/c_detox_sfx.wav',.6);print('ok',st[-1])
