import numpy as np, json, sys, wave
SR=44100
def env(n,a=0.005,d=0.2):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*np.exp(-t/d); return e
def tone(f,dur,d=0.2,a=0.004,shape='sin'):
    n=int(SR*dur); t=np.arange(n)/SR
    f=np.broadcast_to(f,(n,)) if np.ndim(f) else np.full(n,f)
    ph=2*np.pi*np.cumsum(f)/SR
    w=np.sin(ph) if shape=='sin' else np.sign(np.sin(ph))*0.3
    return w*env(n,a,d)
def noise(dur,d,lp=0.0):
    n=int(SR*dur); x=np.random.default_rng(1).standard_normal(n)
    if lp: 
        y=np.zeros(n); a=lp
        for i in range(1,n): y[i]=y[i-1]+a*(x[i]-y[i-1])
        x=y/ (np.abs(y).max()+1e-9)
    return x*env(n,0.002,d)
def S(kind):
    if kind=='tap':   return 0.35*tone(np.linspace(260,140,int(SR*0.12)),0.12,0.04)+0.1*noise(0.05,0.01,0.3)[:int(SR*0.12)].tolist()[0] if False else 0.35*tone(np.linspace(260,140,int(SR*0.12)),0.12,0.04)
    if kind=='thump': 
        n=int(SR*0.5); b=0.9*tone(np.linspace(120,45,n),0.5,0.16,0.002); b[:len(noise(0.08,0.02,0.15))]+=0.5*noise(0.08,0.02,0.15); return b
    if kind=='pop':   return 0.5*tone(np.linspace(500,1100,int(SR*0.09)),0.09,0.03)
    if kind=='boing': n=int(SR*0.45); t=np.arange(n)/SR; return 0.45*tone(300+220*np.sin(2*np.pi*7*t)*np.exp(-t*4)+t*400,0.45,0.25)
    if kind=='pon':   return 0.55*tone(np.linspace(180,120,int(SR*0.18)),0.18,0.06)+0.0
    if kind=='clink': return 0.35*(tone(2200,0.4,0.12)+0.6*tone(3300,0.4,0.08)+0.4*tone(5200,0.4,0.05))
    if kind=='chime':
        a=0.4*(tone(659,0.9,0.5)+0.4*tone(1318,0.9,0.3)); b=0.4*(tone(523,1.2,0.6)+0.4*tone(1046,1.2,0.35))
        out=np.zeros(int(SR*1.6)); out[:len(a)]+=a; out[int(SR*0.4):int(SR*0.4)+len(b)]+=b; return out
    if kind=='click': return 0.4*noise(0.03,0.006,0.6)+0.0
    if kind=='whoosh': return 0.16*noise(0.5,0.25,0.05)*np.sin(np.linspace(0,np.pi,int(SR*0.5)))
    if kind=='swish': return 0.12*noise(0.35,0.2,0.12)*np.sin(np.linspace(0,np.pi,int(SR*0.35)))
    if kind=='blink': return 0.25*tone(1800,0.08,0.02)
    if kind=='twitch': return 0.3*tone(np.linspace(1400,2000,int(SR*0.06)),0.06,0.02)
    if kind=='flop':
        n=int(SR*0.4); b=0.8*tone(np.linspace(160,60,n),0.4,0.12,0.003); b[:int(SR*0.12)]+=0.35*noise(0.12,0.05,0.1); return b
    raise Exception(kind)
meta=json.load(open(sys.argv[1])); dur=meta['dur']; out=np.zeros(int(SR*(dur+0.2)))
rng=np.random.default_rng(7); out+=0.004*rng.standard_normal(len(out))  # かすかな部屋の空気
for s in meta['sfx']:
    x=np.asarray(S(s['type']),float); i=int(s['t']*SR); out[i:i+len(x)]+=x[:len(out)-i]
out=np.tanh(out*1.2)*0.85
with wave.open(sys.argv[2],'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())
print('ok',sys.argv[2])
