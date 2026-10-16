let combatPresentation={queue:[],timers:[],epoch:0,busy:false,intro:null};
function reducedCombatMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}
function isCombatBusy(){return combatPresentation.busy;}
function clearCombatPresentation(){
 combatPresentation.timers.forEach(clearTimeout);combatPresentation.intro?.remove();
 combatPresentation={queue:[],timers:[],epoch:combatPresentation.epoch+1,busy:false,intro:null};
}
function combatTimer(fn,ms){const epoch=combatPresentation.epoch;combatPresentation.timers.push(setTimeout(()=>{if(combatPresentation.epoch===epoch)fn();},ms));}
function lockCombatControls(locked){document.querySelectorAll('.battle-controls [data-action],.deck-picker [data-action="switch"]').forEach(button=>{if(locked){button.dataset.wasDisabled=button.disabled?'1':'0';button.disabled=true;}else{button.disabled=button.dataset.wasDisabled==='1';delete button.dataset.wasDisabled;}});}
function startCombatIntro(){
 if(view!=='arene'||!battle||reducedCombatMotion())return;
 combatPresentation.busy=true;lockCombatControls(true);
 const intro=document.createElement('div');intro.className='combat-intro';intro.setAttribute('role','status');
 intro.innerHTML=`<div class="combat-intro-lines"></div><div class="combat-intro-copy"><small>LE CERCLE · DUEL</small><div class="intro-names"><strong>${esc(cardBy(battle.player).name)}</strong><b>VS</b><strong>LE CERCLE</strong></div><p>Trois cartes. Un duel. À toi de jouer.</p></div>`;
 document.body.appendChild(intro);combatPresentation.intro=intro;
 combatTimer(()=>{intro.remove();combatPresentation.intro=null;combatPresentation.busy=false;lockCombatControls(false);},1800);
}
function combatFighter(c,ai=false){return `<div class="combat-fighter" data-combat-side="${ai?'enemy':'player'}">${card(battleCard(c,ai))}<div class="combat-impact" aria-hidden="true"><span class="impact-ring"></span><b class="impact-symbol"></b>${Array.from({length:10},(_,i)=>`<i style="--impact-angle:${i*36}deg"></i>`).join('')}</div><span class="combat-damage" aria-hidden="true"></span><span class="combat-block" aria-hidden="true">GARDE</span></div>`;}
function queueCombatStrike(event){
 if(view!=='arene'||reducedCombatMotion())return;
 combatPresentation.queue.push(event);
}
function playCombatEffects(){
 if(view!=='arene'||!battle||combatPresentation.busy||!combatPresentation.queue.length)return;
 combatPresentation.busy=true;lockCombatControls(true);
 const next=()=>{
  const event=combatPresentation.queue.shift();
  if(!event){combatPresentation.busy=false;lockCombatControls(false);return;}
  const source=document.querySelector(`[data-combat-side="${event.ai?'enemy':'player'}"]`);
  const defender=document.querySelector(`[data-combat-side="${event.ai?'player':'enemy'}"]`);
  const target=event.diff<0?source:defender;
  const banner=document.querySelector('#combat-announcement');
  if(!source||!defender||!target){combatPresentation.busy=false;combatPresentation.queue=[];lockCombatControls(false);return;}
  const color=COLORS[event.type]||'#e1d9ef';
  for(const node of [source,defender,target])node.style.setProperty('--impact-color',color);
  if(banner){banner.style.setProperty('--impact-color',color);banner.textContent=`${event.ai?'LE CERCLE':'TOI'} · ${event.attacker} attaque ${event.defender} · ${TYPE_ICONS[event.type]||'✦'} ${event.type}`;banner.classList.add('announcing');}
  source.classList.add('combat-attacking');
  combatTimer(()=>{
   target.querySelector('.impact-symbol').textContent=TYPE_ICONS[event.type]||'✦';
   target.querySelector('.combat-damage').textContent=event.loss?`−${num(event.loss)} PV`:event.diff===0?'PARADE':'ABSORBÉ';
   target.classList.add('combat-hit');
   if(event.diff<=0)defender.classList.add('combat-guarding');
  },280);
  combatTimer(()=>{
   source.classList.remove('combat-attacking');target.classList.remove('combat-hit');defender.classList.remove('combat-guarding');
   banner?.classList.remove('announcing');
   combatTimer(next,130);
  },1100);
 };
 next();
}
