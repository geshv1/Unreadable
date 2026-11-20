"""Sound effects for Video E — Broke Habits vs Wealthy Habits."""
import sys; sys.path.insert(0,'scripts')
import numpy as np, sfxlib as L
from sfxlib import *
D=[3.0,4.0,4.0,5.0,3.2,4.5,3.5,5.5,4.0,3.6]; st=np.concatenate([[0],np.cumsum(D)]); L.set_length(float(st[-1]))
S=L.Track(); e1,e2,e3,e4,e5,e6,e7,e8,e9,e10=st[:10]
def coin(): n=int(.6*SR);t=np.arange(n)/SR;return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,a,d in [(2637,1,9),(3951,.6,12),(5274,.3,15)])*.5
def chaching(): return register() if hasattr(L,'register') else coin()
def nfc(): return np.concatenate([beep(1000,.12),np.zeros(int(.05*SR)),beep(1500,.16)])*.5
def steam(d=1.0): t=np.linspace(0,1,int(d*SR));return hpf(noise(d),2500)*np.sin(np.pi*t)**.5*.6
def pour(d=1.4): x=bp(noise(d),300,2500);t=np.arange(len(x))/SR;return x*(.6+.4*np.sin(2*np.pi*11*t))*np.sin(np.pi*np.linspace(0,1,len(x)))
def cup_down(): n=int(.25*SR);t=np.arange(n)/SR;return (np.sin(2*np.pi*880*t)*.4+bp(noise(.25),1000,5000))*np.exp(-t*30)
def doorbell(): return np.concatenate([bell(988,.6)[:int(.45*SR)],bell(784,1.2)])
def chain(): n=int(.4*SR);t=np.arange(n)/SR;return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,a,d in [(1900,1,18),(2870,.7,22),(4100,.4,28)])*.5+bp(noise(.4),3000,8000)*env(n,.0005,.01)
def toggle(): n=int(.05*SR);return bp(noise(.05),2000,7000)*env(n,.0003,.004)*1.6
def babble(d):
    x=bp(noise(d),300,2400,3);t=np.arange(len(x))/SR;m=np.clip(np.sin(2*np.pi*4.7*t+np.sin(2*np.pi*1.1*t)*2),0,1)**1.5;return x*m
S.put(e1+.05,clunk(),.25,-.4);S.put(e1+.25,clunk(),.25,.4);S.put(e1+.4,coin(),.05,-.4);S.put(e1+.55,coin(),.05,.4)
S.bed(e2,e3,babble(D[1])*.6,.04,-.5);S.put(e2+.5,steam(1.0),.05,-.5);S.put(e2+1.3,nfc(),.05,-.5);S.put(e2+2.0,cup_down(),.06,-.5)
S.put(e2+.8,pour(1.6),.06,.5);S.put(e2+2.5,cup_down(),.05,.5);S.bed(e2,e3,room(D[1],60,250),.03,.5)
for k in np.arange(.2,.85,.13): S.put(e3+k,tap(),.04,-.5)
S.put(e3+.95,ding(),.05,-.5);S.put(e3+1.9,doorbell(),.06,-.6);S.put(e3+2.05,door(),.06,-.6);S.put(e3+2.7,rustle(.4),.07,-.5)
S.put(e3+.3,toggle(),.06,.5)
for k in [1.0,1.8,2.7,3.4]: S.put(e3+k,cup_down()[:int(.12*SR)],.03,.5)
S.put(e4+.15,ping(1760),.05,-.5);S.put(e4+.3,ping(1760),.04,-.5)
for k in np.arange(.4,4.8,.5): S.put(e4+k,tick(),.025,-.5)
S.put(e4+1.85,toggle(),.08,-.5);S.put(e4+1.9,chaching(),.05,-.5)
S.put(e4+.9,send_swoosh(),.06,.5);S.put(e4+1.8,bell(1318,1.2),.04,.5)
S.put(e5,sub(3.0,42,28),.07)
for i in range(4): S.put(e5+.35+i*.35,chain(),.07,-.2+i*.15)
S.bed(e6,e7,babble(D[5]),.05,-.5);S.put(e6+1.1,clink() if hasattr(L,'clink') else coin(),.06,-.5);S.put(e6+1.2,laugh(.9),.05,-.4)
for k in [.6,1.8,3.0]: S.put(e6+k,rustle(.25),.05,.5)
for i in range(6): S.put(e7+.3+i*.32,ping(1500),.025,-.5);S.put(e7+.35+i*.32,coin()[:int(.25*SR)],.03,-.5)
for i in range(2): S.put(e7+1.4+i*.6,toggle(),.08,.5)
S.put(e8+.2,riser(2.8)*.6,.04)
for i in range(10): S.put(e8+.2+i*.28,tick(),.06)
S.put(e8+3.0,bell(1046,2.0),.05);S.put(e8+3.0,sub(1.6,50,30),.06)
S.put(e9,sub(2.0,50,30),.07);S.put(e9+.8,coin(),.04,-.4)
S.put(e10,whoosh(.7),.05);S.put(e10+.35,bell(1318,1.5),.04);S.put(e10+1.15,tick(),.10)
for x in st[1:-1]: S.put(x-.1,whoosh(.25),.03)
verb(S,.14);save(S,'assets/audio/sound-effects/e_money_sfx.wav',.6);print('ok',st[-1])
