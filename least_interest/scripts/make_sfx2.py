"""Placeholder SFX for the revised episode (replace any file with your own of the same name)."""
import sys; sys.path.insert(0,'scripts')
import numpy as np, wave
from sfxlib import *
def w(name,x,peak=.5):
    x=np.asarray(x,dtype=float);x=x/np.max(np.abs(x))*peak;st=np.stack([x,x],1)
    f=wave.open(f'public/sfx/{name}','wb');f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((st*32767).astype(np.int16).tobytes());f.close()
def pad(x,d): o=np.zeros(int(d*SR));o[:min(len(x),len(o))]+=x[:len(o)];return o
t=np.arange(int(1.4*SR))/SR;w('rope_strain.wav',bp(np.sign(np.sin(2*np.pi*(110+30*np.sin(2*np.pi*3*t))*t)),200,1500)*.4*np.minimum(1,t/.1)*np.minimum(1,(1.4-t)/.2)+bp(noise(1.4),300,1200)*.2,.35)
w('body_fall.wav',pad(thud(.6),.9)*1.3+pad(rustle(.5),.9)*.5+pad(np.concatenate([np.zeros(int(.12*SR)),thud(.4)*.5]),.9),.65)
w('send.wav',send_swoosh(),.4)
w('ding.wav',ding(),.4)
w('tick.wav',tick(),.4)
w('whoosh.wav',whoosh(.35),.35)
w('step.wav',footstep(True),.45)
w('cash.wav',register(),.35)
w('party.wav',crowd(4.5)*np.minimum(1,np.arange(int(4.5*SR))/SR/.3)*np.minimum(1,(4.5-np.arange(int(4.5*SR))/SR)/.4),.3)
w('laugh.wav',laugh(1.0),.4)
n=int(1.2*SR);tt=np.arange(n)/SR;w('whoom.wav',np.sin(2*np.pi*np.cumsum(90+120*tt)/SR)*np.sin(np.pi*tt/1.2)**2*.6+bp(noise(1.2),300,1500)*np.sin(np.pi*tt/1.2)*.3,.4)
w('clink.wav',clink(),.35)
w('heartbeat.wav',heartbeat(),.55)
n=int(.4*SR);tt=np.arange(n)/SR;w('coin.wav',(np.sin(2*np.pi*2637*tt)+.6*np.sin(2*np.pi*3951*tt))*np.exp(-tt*12)+pad(tick(),.4),.35)
w('can_drop.wav',pad(thud(.4),.6)+pad(np.concatenate([np.zeros(int(.1*SR)),thud(.3)*.6]),.6)+pad(bp(noise(.3),800,4000)*env(int(.3*SR),.001,.05),.6),.5)
n1=int(.08*SR);w('can_open.wav',np.concatenate([bp(noise(.08),1500,7000)*env(n1,.0003,.01)*2,hpf(noise(.8),3000)*np.exp(-np.arange(int(.8*SR))/SR*3)*.5]),.4)
print('ok')
