const UNIT_HP=2000;
const MAX_ROUNDS=40;
function sideKey(ai=false){return ai?'enemy':'player';}
function combatUnit(c,ai=false){return battle?.units?.[sideKey(ai)]?.[typeof c==='string'?c:c.id];}
function currentHP(c,ai=false){return combatUnit(c,ai)?.hp||0;}
function frontIds(ai=false,snapshot=battle){return snapshot?.[ai?'enemyField':'playerField']||[];}
function livingFront(ai=false){return frontIds(ai).filter(id=>currentHP(id,ai)>0);}
function reserveIds(ai=false){return battle[ai?'enemyDeck':'playerDeck'].filter(id=>!frontIds(ai).includes(id)&&currentHP(id,ai)>0);}
function syncBattleTotals(){if(!battle?.units)return;for(const ai of [false,true])battle[ai?'ehp':'php']=Object.values(battle.units[sideKey(ai)]).reduce((n,u)=>n+u.hp,0);}
function combatSnapshot(){return {php:battle.php,ehp:battle.ehp,units:structuredClone(battle.units),playerField:[...battle.playerField],enemyField:[...battle.enemyField],playerDeck:[...battle.playerDeck],enemyDeck:[...battle.enemyDeck]};}
function weakestAlly(ai=false){return livingFront(ai).sort((a,b)=>currentHP(a,ai)-currentHP(b,ai))[0];}
function refillFormation(){
 for(const ai of [false,true]){
  const field=frontIds(ai);
  for(let i=0;i<field.length;i++)if(currentHP(field[i],ai)<=0){const incoming=reserveIds(ai)[0];if(incoming){const outgoing=field[i];passiveAction(cardBy(outgoing),'leave',ai);field[i]=incoming;battle.log.push(`${ai?'Le cercle':'Ton équipe'} · ${cardBy(outgoing).name} est K.O. ; ${cardBy(incoming).name} entre depuis la réserve.`);}}
 }
 if(!livingFront().includes(battle.player))battle.player=livingFront()[0]||battle.player;
 if(!livingFront(true).includes(battle.enemy))battle.enemy=livingFront(true)[0]||battle.enemy;
 if(!livingFront().includes(battle.allyTarget))battle.allyTarget=weakestAlly();
 syncBattleTotals();
}
function targetsFor(c,move,ai=false,targetId=null){
 if(move.damage)return [targetId||(ai?livingFront()[0]:battle.enemy)];
 if(move.target==='team')return livingFront(ai);
 if(move.target==='ally')return [targetId||(ai?weakestAlly(true):battle.allyTarget)||c.id];
 return [c.id];
}
function abilityPrediction(c,move,ai=false,targetId=null){
 const ids=targetsFor(c,move,ai,targetId),targetSide=move.damage?!ai:ai;
 const enemy=cardBy(ids[0]),target=combatUnit(ids[0],targetSide);
 if(!target||!enemy||target.hp<=0)return {raw:0,loss:0,heal:0,guard:0,targets:[],effects:[]};
 const own=passiveStats(c,ai);let extra=own.atk+(battle.boost[(ai?'ai:':'')+c.id]?.atk||0);
 if(c.id==='emilien-larp'&&passiveMemory(c,ai).role==='Gardien')extra+=200;
 const def=passiveStats(enemy,targetSide),memory=passiveMemory(enemy,targetSide);
 const defense=Math.max(0,enemy.def+def.def+(battle.boost[(targetSide?'ai:':'')+enemy.id]?.def||0));
 const raw=move.damage?Math.max(0,Math.round((move.damage+(c.atk-2000)*.25+extra)*modifier(c.type,enemy.type)-defense*.15)):0;
 const absorbed=move.damage?(enemy.id==='yanis-soldat'&&memory.hits<2?200:0)+memory.shield:0;
 const effects=ids.filter(id=>currentHP(id,targetSide)>0).map(id=>({id,heal:Math.min(move.heal||0,UNIT_HP-currentHP(id,targetSide)),guard:Math.max(passiveMemory(cardBy(id),targetSide).shield,move.guard||0)}));
 return {raw,loss:Math.min(target.hp,Math.max(0,raw-absorbed)),heal:effects.reduce((n,e)=>n+e.heal,0),guard:effects[0]?.guard||0,targets:ids,effects};
}
function applyAbility(index,ai=false,targetId=null,actorId=null){
 if(!battle||battle.over)return false;
 const c=cardBy(actorId||(ai?battle.enemyActor||livingFront(true)[0]:battle.player));
 if(!c||!livingFront(ai).includes(c.id))return false;
 const move=abilitiesFor(c)[index];if(!move||abilityReady(c,index,ai)>0)return false;
 const ids=targetsFor(c,move,ai,targetId),targetSide=move.damage?!ai:ai;
 if(!ids.length||ids.some(id=>!livingFront(targetSide).includes(id)))return false;
 const before=combatSnapshot();
 if(move.damage)passiveAction(c,'attack',ai);
 const preview=abilityPrediction(c,move,ai,targetId),m=passiveMemory(c,ai);let loss=0;
 battle.cooldowns[(ai?'ai:':'')+c.id+':'+index]=battle.turn+(move.cooldown||0)+1;
 const effects=[];
 if(move.damage){
  if(c.id==='yanis-vs-zg')m.charge=0;
  const enemy=cardBy(ids[0]);loss=takeBattleDamage(!ai,preview.raw,enemy.id);
  effects.push({id:enemy.id,ai:!ai,label:loss?`−${num(loss)} PV`:'ABSORBÉ'});
  battle.log.push(`${ai?'Le cercle':'Toi'} · ${c.name} → ${enemy.name} : ${move.name}, −${loss} PV (${c.type} ×${modifier(c.type,enemy.type)}).`);
  passiveAfterAttack(c,enemy,ai);
  if(move.guard)m.shield=Math.max(m.shield,move.guard);
 }else{
  passiveAction(c,move.prepare?'power':'defend',ai);
  if(move.charge)m.charge=Math.min(300,m.charge+move.charge);
  for(const id of ids){const ally=cardBy(id),um=passiveMemory(ally,ai),healed=passiveHeal(ally,move.heal||0,ai);if(move.guard)um.shield=Math.max(um.shield,move.guard);effects.push({id,ai,label:[move.heal?`+${num(healed)} PV`:'',move.guard?`BOUCLIER ${um.shield}`:''].filter(Boolean).join(' · ')});}
  battle.log.push(`${ai?'Le cercle':'Toi'} · ${c.name} utilise ${move.name} sur ${ids.map(id=>cardBy(id).name).join(', ')} : ${preview.heal?`+${preview.heal} PV soignés au total`:'préparation'}${move.guard?`, bouclier ${move.guard}`:''}.`);
 }
 syncBattleTotals();refillFormation();const after=combatSnapshot();
 queueCombatStrike({ai,kind:move.damage?'attack':'support',move:move.name,attacker:c.name,defender:ids.map(id=>cardBy(id).name).join(', '),type:c.type,sourceId:c.id,effects,before,after,loss});
 return true;
}
function enemyTurn(){
 const candidates=[];
 for(const id of livingFront(true)){
  const c=cardBy(id);
  abilitiesFor(c).forEach((move,index)=>{
   if(abilityReady(c,index,true))return;
   const targets=move.damage?livingFront():move.target==='ally'?livingFront(true):[move.target==='team'?null:id];
   for(const targetId of targets){const p=abilityPrediction(c,move,true,targetId);let score=move.damage?p.loss+(p.loss>=currentHP(targetId)?800:0):p.heal*.9+Math.max(0,p.guard-(targetId?passiveMemory(cardBy(targetId),true).shield:0))*.35;
    if(!move.damage&&p.effects.some(e=>currentHP(e.id,true)<650)&&p.heal)score+=550;
    if(move.prepare&&passiveMemory(c,true).produced<3)score+=180;
    if(id==='abde-yanis'&&!move.damage&&passiveMemory(c,true).time<2)score+=120;
    candidates.push({id,index,targetId,score:score+Math.random()*90});
   }
  });
 }
 candidates.sort((a,b)=>b.score-a.score);const best=candidates[0];
 if(best){battle.enemyActor=best.id;applyAbility(best.index,true,best.targetId,best.id);}
}
function startBattle(){
 clearCombatPresentation();if(state.deck.length!==6||new Set(state.deck).size!==6||!state.deck.every(id=>cardBy(id)?.owned>0&&isPlayable(cardBy(id))))return toast('Choisis six cartes jouables et différentes dans ton deck.');
 const playable=state.cards.filter(isPlayable),enemyDeck=[];
 for(const id of state.deck){const own=cardBy(id);const same=playable.filter(c=>c.rarity===own.rarity&&!enemyDeck.includes(c.id));const pool=same.length?same:playable.filter(c=>!enemyDeck.includes(c.id));enemyDeck.push(pool[Math.floor(Math.random()*pool.length)].id);}
 const makeUnits=deck=>Object.fromEntries(deck.map(id=>[id,{hp:UNIT_HP,maxHp:UNIT_HP}]));
 battle={playerDeck:[...state.deck],enemyDeck,playerField:state.deck.slice(0,3),enemyField:enemyDeck.slice(0,3),units:{player:makeUnits(state.deck),enemy:makeUnits(enemyDeck)},player:state.deck[0],enemy:enemyDeck[0],allyTarget:state.deck[0],turn:1,cooldowns:{},boost:{},over:false,log:['Six cartes par équipe, trois au combat. Choisis un combattant en bas et une cible en haut. Une capacité ou une relève consomme le tour de ton équipe.']};
 syncBattleTotals();render();window.scrollTo({top:0});startCombatIntro();
}
function finishCheck(){
 if(battle.over)return true;syncBattleTotals();
 if(battle.php===0||battle.ehp===0||battle.turn>MAX_ROUNDS){battle.over=true;const win=battle.php>battle.ehp;battle.result=battle.php===battle.ehp?'Égalité.':win?'Victoire ! +100 crédits':'Défaite. La revanche t’attend.';if(win){state.wins++;state.balance+=100;save();}battle.log.push(battle.result);return true;}return false;
}
function battleAction(action,id){
 if(!battle||battle.over||isCombatBusy())return false;
 if(action==='select-fighter'||action==='select-ally'){
  if(!livingFront().includes(id))return false;
  if(action==='select-fighter')battle.player=id;else battle.allyTarget=id;
  render();return true;
 }
 if(action==='select-enemy'){if(!livingFront(true).includes(id))return false;battle.enemy=id;render();return true;}
 if(action==='ability'){
  if(!/^[01]$/.test(String(id))||!applyAbility(Number(id)))return false;
 }else if(action==='switch'){
  if(!reserveIds().includes(id)||!livingFront().includes(battle.player))return false;
  const slot=battle.playerField.indexOf(battle.player),old=battle.player;passiveAction(cardBy(old),'leave');battle.playerField[slot]=id;battle.player=id;battle.allyTarget=weakestAlly();battle.log.push(`Toi · ${cardBy(old).name} rejoint la réserve ; ${cardBy(id).name} entre en jeu. La relève consomme ton tour.`);
 }else return false;
 if(finishCheck()){render();return true;}enemyTurn();battle.turn++;finishCheck();render();return true;
}
function formationSlots(ai=false,snapshot=battle){
 const side=sideKey(ai);
 return frontIds(ai,snapshot).map(id=>{
  const c=cardBy(id),unit=snapshot.units[side][id],ko=unit.hp<=0;
  return `<article class="formation-slot ${ko?'is-ko':''} ${!ai&&id===battle.player?'is-actor':''} ${ai&&id===battle.enemy?'is-target':''}"><button class="formation-choice" data-action="${ai?'select-enemy':'select-fighter'}" data-id="${id}" ${ko||battle.over?'disabled':''} aria-label="${ai?'Cibler':'Faire agir'} ${esc(c.name)}"><span class="formation-state">${ko?'K.O.':!ai&&id===battle.player?'✓ VA AGIR':ai&&id===battle.enemy?'◎ CIBLE':'CHOISIR'}</span>${combatFighter(c,ai)}<span class="unit-health"><b data-unit-health="${side}:${id}">${num(unit.hp)} / ${UNIT_HP} PV</b><i><em data-unit-bar="${side}:${id}" style="width:${unit.hp/UNIT_HP*100}%"></em></i></span></button><div class="unit-reserves">${esc(passiveStatus(c,ai))}</div></article>`;
 }).join('');
}
function syncFormationVisual(snapshot=battle){
 if(!battle)return;
 for(const ai of [false,true]){const row=document.querySelector(ai?'#enemy-formation':'#player-formation');if(row)row.innerHTML=formationSlots(ai,snapshot);}
 if(isCombatBusy())lockCombatControls(true);
}
function abilityControls(c){
 const support=abilitiesFor(c).some(m=>m.target==='ally');
 return `<section class="ability-panel formation-controls" style="--fighter-color:${COLORS[c.type]}"><div class="eyebrow">TOUR ${Math.min(battle.turn,MAX_ROUNDS)} · 1 ACTION D’ÉQUIPE</div><h2>${esc(c.name)} va agir</h2><p class="ability-target">Attaque → <b>${esc(cardBy(battle.enemy).name)}</b><br>Clique une carte adverse en haut pour changer de cible.</p>${support?`<div class="ally-target-picker"><small>CIBLE DU SOUTIEN · ALLIÉS AU COMBAT</small><div>${livingFront().map(id=>`<button data-action="select-ally" data-id="${id}" class="${id===battle.allyTarget?'chosen':''}" aria-pressed="${id===battle.allyTarget}">${esc(cardBy(id).name)}<span>${num(currentHP(id))} PV</span></button>`).join('')}</div></div>`:''}<div class="battle-controls ability-choices">${abilitiesFor(c).map((m,i)=>{
  const p=abilityPrediction(c,m),wait=abilityReady(c,i);const label=m.damage?`${num(p.loss)} DÉGÂTS`:[m.heal?`+${num(p.heal)} PV${m.target==='team'?' AU TOTAL':''}`:'',m.guard?`${num(p.guard)} BOUCLIER`:''].filter(Boolean).join(' · ');
  const target=m.damage?cardBy(battle.enemy).name:m.target==='team'?'les 3 alliés au combat':m.target==='ally'?cardBy(battle.allyTarget).name:c.name;
  return `<button class="ability-choice ${m.damage?'offensive':'support'}" data-action="ability" data-id="${i}" ${wait?'disabled':''}><span class="ability-topline"><strong>${esc(m.name)}</strong><b>${wait?`RECHARGE · ${wait} TOUR${wait>1?'S':''}`:label}</b></span><span class="ability-description">${esc(m.text)}</span><span class="ability-kind">${m.damage?TYPE_ICONS[c.type]+' ATTAQUE':'✚ SOUTIEN'} → ${esc(target)}${m.cooldown?` · recharge ${m.cooldown} tour(s)`:''}</span></button>`;
 }).join('')}</div><p class="ability-help">Les valeurs tiennent compte de la cible, de sa DEF et de ses protections. Une seule capacité pour ton équipe, puis l’adversaire joue. Chaque carte a ${UNIT_HP} PV.</p><div class="duel-passive-summary"><small>✦ ${esc(passiveFor(c)?.name||'PASSIF')}</small><p>${esc(passiveFor(c)?.short||'')}</p><b>${esc(passiveStatus(c))}</b></div></section>`;
}
function arena(){
 const heading=head('LE TERRAIN DES LÉGENDES','Trois au front. Six dans le cercle.','Adversaires en haut · ton équipe en bas · des soutiens pour tes alliés.',`<button class="button secondary" data-action="rules">Comment jouer ? ↗</button>`);
 if(!battle){const d=state.deck.map(cardBy).filter(Boolean);return heading+`<section class="arena formation-lobby"><div class="eyebrow">TON DECK · ${d.length}/6 CARTES</div><h2>Trois combattants et trois réserves.</h2><div class="lobby-formation"><section><h3>AU COMBAT DÈS LE DÉPART</h3><div>${d.slice(0,3).map(wrap).join('')}</div></section><section><h3>EN RÉSERVE</h3><div>${d.slice(3).map(wrap).join('')}</div></section></div><div class="duel-flow"><span>01 · Choisis qui agit</span><i>→</i><span>02 · Choisis la cible</span><i>→</i><span>03 · Utilise une capacité</span></div><div class="battle-controls"><button class="button" data-action="start-battle" ${d.length!==6?'disabled':''}>Entrer en combat ⚔</button><button class="button secondary" data-view="deck">Organiser mon deck</button></div><p class="duel-disclaimer">Contre le cercle · IA · ${UNIT_HP} PV par carte · 3 cartes au combat · 3 réserves</p></section>`;}
 const p=cardBy(battle.player);return heading+`<section class="arena formation-board"><div class="formation-score"><span>TON ÉQUIPE <b data-health-value="player">${num(battle.php)} / ${UNIT_HP*6} PV</b></span><strong>TOUR ${Math.min(battle.turn,MAX_ROUNDS)}</strong><span>LE CERCLE · IA <b data-health-value="enemy">${num(battle.ehp)} / ${UNIT_HP*6} PV</b></span></div><div id="combat-announcement" class="combat-announcement" role="status" aria-live="polite">${battle.over?esc(battle.result):'Choisis ton combattant en bas et ta cible en haut.'}</div><div class="formation-layout"><div class="formation-table"><div class="formation-row-heading"><b>ADVERSAIRES · CHOISIS TA CIBLE</b><small>${reserveIds(true).length} en réserve · ${battle.enemyDeck.filter(id=>currentHP(id,true)>0).length}/6 debout</small></div><div id="enemy-formation" class="formation-row enemy-row">${formationSlots(true)}</div><div class="formation-divider"><span>⚔</span><small>Une action par équipe et par tour</small></div><div class="formation-row-heading"><b>TON ÉQUIPE · CHOISIS QUI AGIT</b><small>${livingFront().length}/3 au combat</small></div><div id="player-formation" class="formation-row player-row">${formationSlots()}</div></div>${battle.over?`<section class="duel-result"><div class="eyebrow">DUEL TERMINÉ</div><h2>${esc(battle.result)}</h2><p>${num(battle.php)} PV restants contre ${num(battle.ehp)} PV.</p><button class="button" data-action="new-battle">Préparer un nouveau duel →</button></section>`:abilityControls(p)}</div>${!battle.over?`<section class="formation-bench"><div><strong>TES RÉSERVES</strong><small>Une relève remplace ${esc(p.name)} et consomme ton tour. Les PV sont conservés.</small></div><div class="deck-picker">${reserveIds().map(id=>`<button data-action="switch" data-id="${id}"><b>↑ ${esc(cardBy(id).name)}</b><small>${TYPE_ICONS[cardBy(id).type]} ${cardBy(id).type} · ${num(currentHP(id))}/${UNIT_HP} PV</small></button>`).join('')||'<p>Toutes tes cartes disponibles sont au combat.</p>'}</div><button class="text-link" data-action="forfeit">Abandonner</button></section>`:''}<details class="duel-passive-details"><summary>Passif du combattant sélectionné</summary>${passiveDetail(p)}</details><details class="duel-journal" open><summary>Dernières actions</summary><div class="battle-log" role="log">${battle.log.slice(-7).map(l=>`<div>${esc(l)}</div>`).join('')}</div></details></section>`;
}
function rules(){showModal(`<div class="eyebrow">LE COMBAT EN FORMATION</div><h2>Six cartes. Trois au combat.</h2><ol class="duel-rules"><li><b>Prépare six cartes différentes.</b> Les trois premières de ton deck commencent au combat ; les trois suivantes restent en réserve.</li><li><b>Chaque carte possède ${UNIT_HP} PV.</b> Les adversaires sont en haut, ton équipe en bas. Clique un allié pour le faire agir, puis un adversaire pour cibler ton attaque. Ces sélections ne consomment pas ton tour.</li><li><b>Une action par équipe.</b> Utilise une des deux capacités de ton combattant, ou fais une relève depuis les réserves. L’adversaire fait ensuite de même.</li><li><b>Soutiens tes alliés.</b> Tom U6 et Abdé–Yanis soignent un allié au combat ; choisis-le dans « Cible du soutien ». ZG soigne les trois cartes au combat. Emilien peut protéger un allié. Les réserves et les cartes K.O. ne peuvent pas être soignées.</li><li><b>Gère la relève.</b> Une carte mise K.O. est automatiquement remplacée par la première réserve disponible. Une relève volontaire conserve les PV et les recharges de chaque carte, et consomme ton tour. Aucun soin ne ressuscite une carte K.O.</li><li><b>La défense reste automatique.</b> La DEF réduit les dégâts ; le bouclier absorbe le prochain impact sur son porteur puis disparaît. Les boucliers ne s’additionnent pas.</li><li><b>Prévois les types et les recharges.</b> Avantage ×1,25, faiblesse ×0,80. Les dégâts à droite comprennent déjà le type, la DEF, le passif et les protections de ta cible. Une recharge de 1 tour impose un tour d’attente.</li><li><b>Remporte le duel.</b> Mets les six cartes adverses K.O. Après ${MAX_ROUNDS} tours, l’équipe avec le plus de PV restants gagne. Les soins sont plafonnés à ${UNIT_HP} PV par carte et toutes les réserves de passifs sont remises à zéro au duel suivant.</li></ol><p>Cette arène se joue contre le cercle contrôlé par l’ordinateur. +100 crédits fictifs par victoire.</p><button class="button" data-action="close">J’ai compris →</button>`,'wide');}
