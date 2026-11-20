"""Sound effects for Video A — What Pressure Reveals. Output: assets/audio/sound-effects/a_pressure_sfx.wav"""
import sys; sys.path.insert(0,'scripts')
import numpy as np, sfxlib as L
from sfxlib import *
D=[3.0,6.0,3.4,5.0,4.5,3.2,8.6,4.0,3.6]; st=np.concatenate([[0],np.cumsum(D)]); L.set_length(float(st[-1]))
S=L.Track(); a1,a2,a3,a4,a5,a6,a7,a8,a9=st[:9]
# A1 hook
S.put(a1+.05,clunk(),.3,-.4);S.put(a1+.25,clunk(),.3,.4);S.put(a1+.5,rumble(1.1),.10);S.put(a1+1.6,thud(.8),.30);S.put(a1+1.6,sub(1.4,55,30),.18)
# A2 the email
S.bed(a2,a3,room(D[1],60,300),.05)
for k in np.arange(0,.45,.08): S.put(a2+k,keyclick(),.05,-.4);S.put(a2+k+.03,keyclick(),.05,.4)
S.put(a2+.45,ding(),.07,-.5);S.put(a2+.5,ding(),.07,.5);S.put(a2+1.0,breath(.7),.07,.5)
S.put(a2+1.55,slam(),.30,-.5);S.put(a2+1.6,rustle(1.2),.12,-.4);S.put(a2+2.15,chair_scrape(),.10,-.5)
S.put(a2+2.1,scribble(3.2) if hasattr(L,'scribble') else bp(noise(3.2),2500,7000)*.5,.04,.5)
for i in range(3): S.put(a2+2.6+i*.45,tick(),.10,.5)
# A3 week one
S.bed(a3,a4,tv(D[2]),.04,-.6);S.put(a3+.3,can_open(),.08,-.5)
for k in np.arange(0,3.4,.09): S.put(a3+k+rng.random()*.02,keyclick(),.035,.5)
for i in range(12): S.put(a3+.3+i*.22,send_swoosh(),.035,.5)
# A4 breakup
S.put(a4+.15,vibrate(),.07,-.5);S.put(a4+.2,ping(1318),.04,-.5);S.put(a4+.25,vibrate(),.05,.5);S.put(a4+.3,ping(1318),.03,.5)
for t0 in [1.2,1.55,1.9,2.25,2.6,3.0]:
    for k in np.arange(t0-.3,t0,.06): S.put(a4+k,tap() if hasattr(L,'tap') else keyclick(),.035,-.5)
    S.put(a4+t0,send_swoosh(),.06,-.5)
for k in [.6,1.4,2.2,3.0,3.8]: S.put(a4+k,heartbeat() if hasattr(L,'heartbeat') else thud(.4),.08,-.4)
S.put(a4+1.4,phone_down(),.10,.5)
S.bed(a4+2.4,a5,rain_bed(D[3]-2.4),.07,.5);S.put(a4+2.8,thunder(),.10,.3)
for k in np.arange(2.45,5.0,np.pi/14): S.put(a4+k,wet_step(),.07,.5)
# A5 comment
S.put(a5+.15,ping(1568),.05);S.bed(a5,a6,room(D[4],60,250),.04)
for k in np.arange(.8,3.6,.07): S.put(a5+k+rng.random()*.02,keyclick(),.05,-.5)
for i in range(3): t0=a5+1.3+i*1.5; S.put(t0,grip_creak(),.08,.5);S.put(t0+.4,breath(.5),.06,.5)
# A6 concept
S.put(a6,sub(2.5,45,28),.12);S.put(a6+.2,whoosh(.9),.06,-.3);S.put(a6+.2,whoosh(.9),.06,.3)
S.put(a6+1.0,slam(),.30,-.5);S.put(a6+1.05,debris(),.14,-.5);S.put(a6+1.05,crack(),.12,-.5);S.put(a6+1.0,thud(.6),.15,.5)
# A7 fight night
S.bed(a7,a8,arena(D[6]),.07);S.put(a7+.05,boxing_bell(),.10)
for k in np.arange(.2,8,.4): S.put(a7+k+rng.random()*.1,footstep(False)*.6,.04,rng.uniform(-.4,.4))
for t0 in [1.05,1.4,1.75]: S.put(a7+t0,swish(.28),.12,-.3)
S.put(a7+2.4,heavy_breath(1.6),.07,-.4)
for t0 in [3.96,4.26,4.66]: S.put(a7+t0,punch(),.22,-.1);S.put(a7+t0,swish(.15),.05,.2)
S.put(a7+4.0,crowd_ooh(),.08);S.put(a7+5.5,thud(.5),.18,-.3);S.put(a7+5.6,crowd_roar(2.6),.10)
# A8 outro
S.bed(a8,a9,arena(D[7])*.5,.04);S.put(a8+.05,sub(1.8,50,30),.10);S.put(a8+.6,breath(.9),.05,-.4)
# end card
S.put(a9,whoosh(.7),.05);S.put(a9+.35,bell(1318,1.5),.04);S.put(a9+1.15,tick(),.10)
for x in st[1:-1]: S.put(x-.1,whoosh(.25),.03)
verb(S,.14)
save(S,'assets/audio/sound-effects/a_pressure_sfx.wav',.6)
print('ok',st[-1])
