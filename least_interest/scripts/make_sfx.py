"""Synthesizes placeholder SFX into public/sfx (replace with your own files of the same names any time)."""
import sys; sys.path.insert(0,'scripts')
import numpy as np, wave, sfxlib as L
from sfxlib import *
def w(name,x,peak=.5):
    x=np.asarray(x,dtype=float);x=x/np.max(np.abs(x))*peak;st=np.stack([x,x],1)
    f=wave.open(f'public/sfx/{name}','wb');f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((st*32767).astype(np.int16).tobytes());f.close()
b=sub(2.2,58,26);b[:int(.6*SR)]+=thud(.6);w('boom.wav',b,.6)
n=int(.08*SR);w('pen_click.wav',bp(noise(.08),2000,8000)*env(n,.0003,.006)*2+np.pad(bp(noise(.03),1500,6000)*env(int(.03*SR),.0003,.004),(int(.03*SR),int(.02*SR))),.4)
w('clock_tick.wav',tick(),.45)
st=thud(.5)*1.2;st[:int(.3*SR)]+=bp(noise(.3),400,3000)*env(int(.3*SR),.0005,.03);w('stamp.wav',st,.6)
w('glove_whoosh.wav',swish(.3),.45)
w('heavy_impact.wav',punch()+np.pad(thud(.3),(0,int(.05*SR))),.65)
w('string_creak.wav',grip_creak(),.35)
w('string_snap.wav',np.concatenate([hpf(noise(.06),2500)*env(int(.06*SR),.0003,.01)*2,np.zeros(int(.2*SR))])+np.pad(ping(1900)[:int(.26*SR)]*.3,(0,0)),.5)
a=np.zeros(int(1.0*SR));tt=np.arange(int(.12*SR))/SR;b=np.sin(2*np.pi*1400*tt)*np.minimum(1,tt/.004)*np.minimum(1,(.12-tt)/.01);[a.__setitem__(slice(int(t*SR),int(t*SR)+len(b)),a[int(t*SR):int(t*SR)+len(b)]+b) for t in (0,.18,.36)];w('phone_alert.wav',a,.45)
t=np.arange(int(4.0*SR))/SR;dr=lpf(np.sin(2*np.pi*48*t)+.6*np.sin(2*np.pi*72.3*t)+.3*np.sin(2*np.pi*96.5*t),300)*np.minimum(1,t/.8)*np.minimum(1,(4-t)/1.0);w('low_drone.wav',dr,.4)
t=np.arange(int(3.5*SR))/SR;sw=sum(np.sin(2*np.pi*f*t)*a for f,a in [(261.6,1),(329.6,.6),(392,.5),(523.3,.3)]);sw=lpf(sw,1800)*np.minimum(1,t/1.2)*np.minimum(1,(3.5-t)/1.2);w('cta_swell.wav',sw,.35)
print('ok')
