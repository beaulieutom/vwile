/* Original procedural effects: no downloads, music or microphone access. */
const gameSound=(()=>{
 let context=null,muted=false;const voices=new Set();
 try{muted=localStorage.getItem('vwile-sound-muted')==='1';}catch{}
 function unlock(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;context??=new Audio();if(context.state==='suspended')context.resume().catch(()=>{});return context;}catch{return null;}}
 function tone(ctx,at,freq,end,duration,volume,wave='sine'){
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=wave;osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+duration);osc.connect(gain).connect(ctx.destination);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+duration+.02);
 }
 function noise(ctx,at,duration,volume,freq){
  const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.65;gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(volume,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+duration);source.connect(filter).connect(gain).connect(ctx.destination);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);source.stop(at+duration+.01);
 }
 function stop(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
 function play(kind,type=''){
  if(muted)return;const ctx=unlock();if(!ctx||ctx.state!=='running')return;const t=ctx.currentTime+.01;
  const pitch={Feu:150,Nature:340,Sol:85,Foudre:620,Eau:260,Ombre:120,Temps:480,Lumière:740}[type]||220;
  if(kind==='attack'){noise(ctx,t,.19,.12,1500);tone(ctx,t,pitch*.65,pitch*1.7,.22,.045,'triangle');}
  if(kind==='impact'){noise(ctx,t,.32,.24,type==='Sol'?360:2200);tone(ctx,t,pitch,pitch*.25,.33,.12,'triangle');if(type==='Temps'||type==='Lumière')tone(ctx,t+.08,pitch*2,pitch*1.6,.4,.035);}
  if(kind==='support'){[1,1.25,1.5].forEach((n,i)=>tone(ctx,t+i*.09,440*n,460*n,.4,.045));}
  if(kind==='pack'){noise(ctx,t,.32,.10,2800);tone(ctx,t,180,330,.28,.04,'triangle');}
  if(kind==='tear'){for(let i=0;i<9;i++)noise(ctx,t+i*.085,.10,.13+i*.008,1700+i*340);noise(ctx,t+.76,.42,.18,3800);tone(ctx,t+.82,150,55,.26,.08,'triangle');}
  if(kind==='glow'){[220,330,440,660].forEach((n,i)=>tone(ctx,t+i*.12,n,n*1.06,1.2,.035));}
  if(kind==='reveal'){noise(ctx,t,.1,.07,4200);tone(ctx,t,660,900,.22,.045);}
  if(kind==='finale'){[262,330,392,524,784].forEach((n,i)=>tone(ctx,t+i*.09,n,n*1.015,1.1,.05));noise(ctx,t,.65,.06,5200);}
 }
 function update(){const button=document.querySelector('#sound-toggle');if(button){button.textContent=muted?'Son : coupé':'Son : activé';button.setAttribute('aria-pressed',String(!muted));button.title=muted?'Activer les bruitages':'Couper les bruitages';}}
 document.addEventListener('pointerdown',()=>{if(!muted)unlock();},{capture:true,passive:true});
 document.addEventListener('keydown',()=>{if(!muted)unlock();},{capture:true});
 document.addEventListener('click',event=>{if(!event.target.closest('#sound-toggle'))return;muted=!muted;if(muted)stop();else{unlock();play('reveal');}try{localStorage.setItem('vwile-sound-muted',muted?'1':'0');}catch{}update();});
 update();return {play,stop,unlock};
})();
