let combatPresentation={queue:[],timers:[],epoch:0,busy:false,intro:null};
function reducedCombatMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}
function isCombatBusy(){return combatPresentation.busy;}
function clearCombatPresentation(){
 combatPresentation.timers.forEach(clearTimeout);combatPresentation.intro?.remove();
 combatPresentation={queue:[],timers:[],epoch:combatPresentation.epoch+1,busy:false,intro:null};
}
function combatTimer(fn,ms){const epoch=combatPresentation.epoch;combatPresentation.timers.push(setTimeout(()=>{if(combatPresentation.epoch===epoch)fn();},ms));}
function lockCombatControls(locked){const phase=document.querySelector('.ability-panel>.eyebrow');if(phase){if(locked){phase.dataset.restingLabel=phase.textContent;phase.textContent='RÉSOLUTION EN COURS…';}else if(phase.dataset.restingLabel){phase.textContent=phase.dataset.restingLabel;delete phase.dataset.restingLabel;}}document.querySelectorAll('.battle-controls [data-action],.deck-picker [data-action="switch"]').forEach(button=>{if(locked){button.dataset.wasDisabled=button.disabled?'1':'0';button.disabled=true;}else{button.disabled=button.dataset.wasDisabled==='1';delete button.dataset.wasDisabled;}});}
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
  if(!event){combatPresentation.busy=false;lockCombatControls(false);if(battle)presentCombatHealth(battle);const banner=document.querySelector('#combat-announcement');if(banner)banner.textContent=battle?.over?battle.result:`Tour ${battle.turn} · À toi de jouer. Choisis une des deux capacités.`;return;}
  const source=document.querySelector(`[data-combat-side="${event.ai?'enemy':'player'}"]`);
  const defender=document.querySelector(`[data-combat-side="${event.ai?'player':'enemy'}"]`);
  const support=event.kind==='support';
  const target=support?source:event.diff<0?source:defender;
  if(event.before)presentCombatHealth(event.before);
  const banner=document.querySelector('#combat-announcement');
  if(!source||!defender||!target){combatPresentation.busy=false;combatPresentation.queue=[];lockCombatControls(false);return;}
  const color=COLORS[event.type]||'#e1d9ef';
  for(const node of [source,defender,target])node.style.setProperty('--impact-color',color);
  if(banner){banner.style.setProperty('--impact-color',color);banner.textContent=`${event.ai?'LE CERCLE':'TOI'} · ${event.attacker} utilise ${event.move||'son attaque'}${support?'':` sur ${event.defender}`} · ${TYPE_ICONS[event.type]||'✦'} ${event.type}`;banner.classList.add('announcing');}
  source.classList.add(support?'combat-supporting':'combat-attacking');
  combatTimer(()=>{
   target.querySelector('.impact-symbol').textContent=support?'▱':TYPE_ICONS[event.type]||'✦';
   if(event.after)presentCombatHealth(event.after);
   target.querySelector('.combat-damage').textContent=support?event.effectLabel:event.loss?`−${num(event.loss)} PV`:'ABSORBÉ';
   target.classList.add(support?'combat-aided':'combat-hit');
   if(event.diff<=0)defender.classList.add('combat-guarding');
  },280);
  combatTimer(()=>{
   source.classList.remove('combat-attacking','combat-supporting');target.classList.remove('combat-hit','combat-aided');defender.classList.remove('combat-guarding');
   banner?.classList.remove('announcing');
   combatTimer(next,130);
  },1100);
 };
 next();
}

function presentCombatHealth(hp){for(const [side,value] of [['player',hp.php],['enemy',hp.ehp]]){const label=document.querySelector(`[data-health-value="${side}"]`),bar=document.querySelector(`[data-health-bar="${side}"]`);if(label)label.textContent=num(value)+' / 4 000 PV';if(bar)bar.style.width=(value/40)+'%';}}
