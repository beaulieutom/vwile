let combatPresentation={queue:[],timers:[],epoch:0,busy:false,intro:null};
function reducedCombatMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}
function isCombatBusy(){return combatPresentation.busy;}
function clearCombatPresentation(){if(typeof gameSound!=='undefined')gameSound.stop();combatPresentation.timers.forEach(clearTimeout);combatPresentation.intro?.remove();combatPresentation={queue:[],timers:[],epoch:combatPresentation.epoch+1,busy:false,intro:null};}
function combatTimer(fn,ms){const epoch=combatPresentation.epoch;combatPresentation.timers.push(setTimeout(()=>{if(combatPresentation.epoch===epoch)fn();},ms));}
function lockCombatControls(locked){
 const phase=document.querySelector('.ability-panel>.eyebrow');if(phase){if(locked){if(!phase.dataset.restingLabel)phase.dataset.restingLabel=phase.textContent;phase.textContent='RÉSOLUTION EN COURS…';}else if(phase.dataset.restingLabel){phase.textContent=phase.dataset.restingLabel;delete phase.dataset.restingLabel;}}
 document.querySelectorAll('.battle-controls [data-action],.formation-choice,[data-action="select-ally"],.deck-picker [data-action="switch"]').forEach(button=>{if(locked){if(!('wasDisabled' in button.dataset))button.dataset.wasDisabled=button.disabled?'1':'0';button.disabled=true;}else if('wasDisabled' in button.dataset){button.disabled=button.dataset.wasDisabled==='1';delete button.dataset.wasDisabled;}});
}
function startCombatIntro(){
 if(view!=='arene'||!battle||reducedCombatMotion())return;combatPresentation.busy=true;lockCombatControls(true);
 const intro=document.createElement('div');intro.className='combat-intro';intro.setAttribute('role','status');intro.innerHTML='<div class="combat-intro-lines"></div><div class="combat-intro-copy"><small>LE CERCLE · FORMATION</small><div class="intro-names"><strong>TON ÉQUIPE</strong><b>3 VS 3</b><strong>LE CERCLE</strong></div><p>Six cartes. Trois au combat. Chaque allié compte.</p></div>';document.body.appendChild(intro);combatPresentation.intro=intro;
 combatTimer(()=>{intro.remove();combatPresentation.intro=null;combatPresentation.busy=false;lockCombatControls(false);},1800);
}
function combatFighter(c,ai=false){return `<div class="combat-fighter" data-combat-side="${ai?'enemy':'player'}" data-combat-unit="${ai?'enemy':'player'}:${c.id}">${card(battleCard(c,ai))}<div class="combat-impact" aria-hidden="true"><span class="impact-ring"></span><b class="impact-symbol"></b>${Array.from({length:10},(_,i)=>`<i style="--impact-angle:${i*36}deg"></i>`).join('')}</div><span class="combat-damage" aria-hidden="true"></span></div>`;}
function queueCombatStrike(event){if(view!=='arene')return;if(!reducedCombatMotion())combatPresentation.queue.push(event);else if(typeof gameSound!=='undefined')gameSound.play(event.kind==='support'?'support':'impact',event.type);}
function playCombatEffects(){
 if(view!=='arene'||!battle||combatPresentation.busy||!combatPresentation.queue.length)return;combatPresentation.busy=true;lockCombatControls(true);
 const next=()=>{
  const event=combatPresentation.queue.shift();
  if(!event){combatPresentation.busy=false;syncFormationVisual();presentCombatHealth(battle);lockCombatControls(false);const banner=document.querySelector('#combat-announcement');if(banner)banner.textContent=battle.over?battle.result:`Tour ${battle.turn} · Choisis un combattant en bas et une cible en haut.`;return;}
  syncFormationVisual(event.before);presentCombatHealth(event.before);
  const source=document.querySelector(`[data-combat-unit="${event.ai?'enemy':'player'}:${event.sourceId}"]`);
  const targets=event.effects.map(e=>({effect:e,node:document.querySelector(`[data-combat-unit="${e.ai?'enemy':'player'}:${e.id}"]`)})).filter(x=>x.node);
  const banner=document.querySelector('#combat-announcement'),support=event.kind==='support',color=COLORS[event.type]||'#ddd1ef';
  if(!source||!targets.length){combatTimer(next,0);return;}
  source.style.setProperty('--impact-color',color);for(const t of targets)t.node.style.setProperty('--impact-color',color);
  if(banner){banner.style.setProperty('--impact-color',color);banner.textContent=`${event.ai?'LE CERCLE':'TOI'} · ${event.attacker} → ${event.defender} : ${event.move}`;banner.classList.add('announcing');}
  source.classList.add(support?'combat-supporting':'combat-attacking');
  if(typeof gameSound!=='undefined')gameSound.play(support?'support':'attack',event.type);
  combatTimer(()=>{if(!support&&typeof gameSound!=='undefined')gameSound.play('impact',event.type);presentCombatHealth(event.after);for(const t of targets){t.node.querySelector('.impact-symbol').textContent=support?'✚':TYPE_ICONS[event.type]||'✦';t.node.querySelector('.combat-damage').textContent=t.effect.label;t.node.classList.add(support?'combat-aided':'combat-hit');}},280);
  combatTimer(()=>{source.classList.remove('combat-attacking','combat-supporting');for(const t of targets)t.node.classList.remove('combat-hit','combat-aided');banner?.classList.remove('announcing');syncFormationVisual(event.after);combatTimer(next,130);},1100);
 };
 next();
}
function presentCombatHealth(snapshot){
 if(!snapshot?.units)return;
 for(const ai of [false,true]){const side=ai?'enemy':'player',total=document.querySelector(`[data-health-value="${side}"]`);if(total)total.textContent=num(snapshot[ai?'ehp':'php'])+' / '+num(UNIT_HP*6)+' PV';for(const [id,unit]of Object.entries(snapshot.units[side])){const label=document.querySelector(`[data-unit-health="${side}:${id}"]`),bar=document.querySelector(`[data-unit-bar="${side}:${id}"]`);if(label)label.textContent=num(unit.hp)+' / '+UNIT_HP+' PV';if(bar)bar.style.width=(unit.hp/UNIT_HP*100)+'%';}}
}
