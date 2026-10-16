const ABILITIES={
 zg:[{name:'Décret du Fondateur',damage:780,text:'Frappe renforcée par la diversité de ton cercle.'},{name:'Ralliement du cercle',heal:200,guard:250,cooldown:2,text:'Restaure les PV de l’équipe et protège ZG au prochain impact.'}],
 'zg-exile':[{name:'Lame des dunes',damage:850,text:'Une frappe qui fait progresser la Marche des dunes.'},{name:'Tempête de l’exil',damage:620,guard:150,cooldown:1,text:'Attaque puis gagne un bouclier de 150 PV.'}],
 'yanis-vs-zg':[{name:'Entaille maudite',damage:760,text:'Libère la charge de l’armure. Expose ensuite sa défense.'},{name:'Serment de fer',guard:300,charge:100,cooldown:1,text:'Referme la brèche, protège et charge l’armure de 100 ATK.'}],
 'yanis-soldat':[{name:'Tir de couverture',damage:650,guard:80,text:'Un tir prudent suivi d’un bouclier de 80 PV.'},{name:'Repli tactique',heal:180,guard:250,cooldown:2,text:'Se soigne et se met à couvert pour le prochain impact.'}],
 'abde-yanis':[{name:'Fracture temporelle',damage:700,text:'Libère les charges de temps : attaque renforcée et soin passif.'},{name:'Pause hors du temps',heal:100,guard:200,cooldown:1,text:'Se protège, se soigne et stocke une charge de temps (maximum 2).'}],
 'tom-samourai':[{name:'Coupe rosée',damage:780,text:'Consomme le Iaï préparé. Un type favorable déclenche son bouclier.'},{name:'Garde du sakura',guard:250,cooldown:1,text:'Protège Tom et prépare +250 ATK pour sa prochaine frappe.'}],
 'tom-u6':[{name:'Injection fulgurante',damage:720,text:'Consomme une dose disponible : +150 ATK et 100 PV soignés.'},{name:'Protocole U6',heal:300,guard:100,cooldown:2,prepare:true,text:'Se soigne, se protège et prépare 2 doses, dans la limite de 3 produites par duel.'}],
 'emilien-larp':[{name:'Charge du Larp',damage:720,text:'Incarne le rôle Assaut (+200 ATK) et passe à l’action.'},{name:'Rempart de Carthage',heal:100,guard:300,cooldown:1,text:'Incarne le Gardien (+250 DEF), se protège et reprend son souffle.'}]
};
function abilitiesFor(c){if(!isPlayable(c))return [];return ABILITIES[c.id]||[{name:c.skill||('Frappe '+c.type.toLowerCase()),damage:650,text:'Une attaque du type de cette carte.'},{name:'Garde du cercle',guard:250,cooldown:1,text:'Un bouclier contre le prochain impact.'}];}
function abilityReady(c,index,ai=false){return Math.max(0,(battle?.cooldowns?.[(ai?'ai:':'')+c.id+':'+index]||0)-(battle?.turn||1));}
function abilityPrediction(c,move,ai=false){
 const enemy=cardBy(ai?battle.player:battle.enemy),hp=ai?'ehp':'php',targetHp=ai?'php':'ehp';
 const own=passiveStats(c,ai),def=passiveStats(enemy,!ai),target=passiveMemory(enemy,!ai);
 let extra=own.atk+(battle.boost[(ai?'ai:':'')+c.id]?.atk||0);
 if(c.id==='emilien-larp'&&passiveMemory(c,ai).role==='Gardien')extra+=200;
 const defense=Math.max(0,enemy.def+def.def+(battle.boost[(ai?'':'ai:')+enemy.id]?.def||0));
 const raw=move.damage?Math.max(0,Math.round((move.damage+(c.atk-2000)*.25+extra)*modifier(c.type,enemy.type)-defense*.15)):0;
 const absorbed=move.damage?(enemy.id==='yanis-soldat'&&target.hits<2?200:0)+target.shield:0;
 return {raw,loss:Math.min(battle[targetHp],Math.max(0,raw-absorbed)),heal:Math.min(move.heal||0,4000-battle[hp]),guard:Math.max(passiveMemory(c,ai).shield,move.guard||0,c.id==='zg'&&!passiveMemory(c,ai).founderGuard&&!move.damage?200:0)};
}
function applyAbility(index,ai=false){
 if(!battle||battle.over||battle.php<=0||battle.ehp<=0)return false;
 const c=cardBy(ai?battle.enemy:battle.player),enemy=cardBy(ai?battle.player:battle.enemy),move=abilitiesFor(c)[index];
 if(!move||abilityReady(c,index,ai)>0)return false;
 const before={php:battle.php,ehp:battle.ehp};
 const key=(ai?'ai:':'')+c.id+':'+index;battle.cooldowns||={};battle.cooldowns[key]=battle.turn+(move.cooldown||0)+1;
 if(move.damage)passiveAction(c,'attack',ai);
 const preview=abilityPrediction(c,move,ai),m=passiveMemory(c,ai);let loss=0;
 if(move.damage){
  if(c.id==='yanis-vs-zg')m.charge=0;
  loss=takeBattleDamage(!ai,preview.raw);
  battle.log.push(`${ai?'Le cercle':'Toi'} · ${c.name} utilise ${move.name} sur ${enemy.name} : −${loss} PV (type ${c.type} ×${modifier(c.type,enemy.type)}).`);
  passiveAfterAttack(c,enemy,ai);
 }else{
  passiveAction(c,move.prepare?'power':'defend',ai);
  if(move.charge)m.charge=Math.min(300,m.charge+move.charge);
  if(move.heal)passiveHeal(c,move.heal,ai);
  battle.log.push(`${ai?'Le cercle':'Toi'} · ${c.name} utilise ${move.name} : ${move.heal?`+${preview.heal} PV, `:''}bouclier ${preview.guard} PV${move.charge?', +100 de charge':''}.`);
 }
 if(move.guard)m.shield=Math.max(m.shield,move.guard);
 const after={php:battle.php,ehp:battle.ehp};
 const selfLabel=[move.heal?`+${preview.heal} PV`:'',move.guard?`BOUCLIER ${preview.guard}`:''].filter(Boolean).join(' · ');
 queueCombatStrike({ai,kind:move.damage?'attack':'support',move:move.name,attacker:c.name,defender:enemy.name,type:c.type,diff:1,loss,before,after,effectLabel:selfLabel});
 return true;
}
function enemyAbility(){
 const c=cardBy(battle.enemy),moves=abilitiesFor(c),choices=moves.map((m,i)=>({m,i,p:abilityPrediction(c,m,true)})).filter(x=>!abilityReady(c,x.i,true));
 const lethal=choices.find(x=>x.m.damage&&x.p.loss>=battle.php);if(lethal)return lethal.i;
 const support=choices.find(x=>!x.m.damage),attack=choices.find(x=>x.m.damage);
 if(support&&(support.p.heal>=150||battle.ehp<1400||Math.random()<.25))return support.i;
 if(c.id==='zg-exile'&&choices.length>1&&battle.ehp<2200)return 1;
 return attack?.i??choices[0]?.i??0;
}
function startBattle(){
 clearCombatPresentation();if(state.deck.length!==3||!state.deck.every(id=>isPlayable(cardBy(id))))return toast('Choisis trois cartes jouables dans ton deck.');
 const playable=state.cards.filter(isPlayable),enemyDeck=[];
 for(const id of state.deck){const own=cardBy(id),pool=playable.filter(c=>c.rarity===own.rarity&&!enemyDeck.includes(c.id));const pick=pool[Math.floor(Math.random()*pool.length)]||playable.find(c=>!enemyDeck.includes(c.id));enemyDeck.push(pick.id);}
 battle={php:4000,ehp:4000,player:state.deck[0],enemy:enemyDeck[0],enemyDeck,turn:1,cooldowns:{},boost:{},over:false,log:['Le duel commence : choisis une des deux capacités. Une capacité ou une relève consomme ton tour.']};render();window.scrollTo({top:0});startCombatIntro();
}
function finishCheck(){
 if(battle.over)return true;
 if(battle.php===0||battle.ehp===0||battle.turn>30){battle.over=true;const win=battle.php>battle.ehp;
 battle.result=battle.php===battle.ehp?'Égalité.':win?'Victoire ! +100 crédits':'Défaite. La revanche t’attend.';
 if(win){state.wins++;state.balance+=100;save();}battle.log.push(battle.result);return true;}return false;
}
function battleAction(action,id){
 if(!battle||battle.over||isCombatBusy())return false;
 if(action==='ability'){
  const index=Number(id);if(!Number.isInteger(index)||index<0||index>1||!applyAbility(index))return false;
 }else if(action==='switch'){
  if(!state.deck.includes(id)||id===battle.player)return false;
  passiveAction(cardBy(battle.player),'leave');battle.player=id;battle.log.push(`Toi · Relève : ${cardBy(id).name} entre en jeu. Ce changement consomme ton tour.`);
 }else return false;
 if(finishCheck()){render();return true;}
 const best=battle.enemyDeck.find(id=>modifier(cardBy(id).type,cardBy(battle.player).type)>modifier(cardBy(battle.enemy).type,cardBy(battle.player).type));
 if(best&&Math.random()<.18){passiveAction(cardBy(battle.enemy),'leave',true);battle.enemy=best;battle.log.push(`Le cercle · Relève : ${cardBy(best).name} entre en jeu.`);}else applyAbility(enemyAbility(),true);
 battle.turn++;finishCheck();render();return true;
}
function abilityBadge(move,p){return move.damage?`${num(p.loss)} DÉGÂTS`:[move.heal?`+${num(p.heal)} PV`:'',move.guard?`${num(p.guard)} BOUCLIER`:''].filter(Boolean).join(' · ');}
function abilityControls(c){
 const target=cardBy(battle.enemy);
 return `<section class="ability-panel" style="--fighter-color:${COLORS[c.type]}"><div class="eyebrow">TOUR ${battle.turn} · À TOI DE CHOISIR</div><h2>${esc(c.name)}</h2><p class="ability-target">Cible : <b>${esc(target.name)}</b> · ${TYPE_ICONS[target.type]} ${target.type}</p><div class="battle-controls ability-choices">${abilitiesFor(c).map((move,i)=>{const p=abilityPrediction(c,move),wait=abilityReady(c,i);return `<button class="ability-choice ${move.damage?'offensive':'support'}" data-action="ability" data-id="${i}" ${wait?'disabled':''}><span class="ability-topline"><strong>${esc(move.name)}</strong><b>${wait?`RECHARGE · ${wait} TOUR${wait>1?'S':''}`:abilityBadge(move,p)}</b></span><span class="ability-description">${esc(move.text)}</span><span class="ability-kind">${move.damage?`${TYPE_ICONS[c.type]} ATTAQUE · ${c.type}`:'▱ SOUTIEN · aucun dégât'}${move.cooldown?` · recharge ${move.cooldown} tour${move.cooldown>1?'s':''}`:' · disponible chaque tour'}</span></button>`;}).join('')}</div><p class="ability-help">Les dégâts à droite sont les PV réellement retirés à la cible actuelle, après type, DEF, passif et bouclier. Une capacité = ton tour, puis l’adversaire joue.</p><div class="duel-passive-summary"><small>✦ PASSIF AUTOMATIQUE</small><strong>${esc(passiveFor(c)?.name||'Aucun')}</strong><p>${esc(passiveFor(c)?.short||'Cette carte n’a pas de passif particulier.')}</p><b>${esc(passiveStatus(c))}</b></div></section>`;
}
function moveDetails(c){const moves=abilitiesFor(c);if(!moves.length)return '';return `<section class="moves-detail"><div class="eyebrow">2 CAPACITÉS · 1 CHOIX PAR TOUR</div>${moves.map(m=>`<div><span><b>${esc(m.name)}</b><small>${esc(m.text)}${m.cooldown?` Recharge : ${m.cooldown} tour(s).`:''}</small></span><strong>${m.damage?`${m.damage} base`:[m.heal?`+${m.heal} PV`:'',m.guard?`▱ ${m.guard}`:''].filter(Boolean).join(' · ')}</strong></div>`).join('')}<small>En duel, les dégâts sont ajustés à la cible et à ses protections.</small></section>`;}
function rules(){showModal(`<div class="eyebrow">LES DUELS DU CERCLE</div><h2>Un tour. Une décision.</h2><ol class="duel-rules"><li><b>Deux capacités par carte.</b> Choisis une attaque ou un soutien. Le nom est à gauche ; les dégâts ou le soin et le bouclier sont à droite.</li><li><b>Des dégâts directs.</b> Une attaque retire des PV à l’équipe adverse. La DEF et les protections réduisent les dégâts ; une attaque faible ne blesse jamais son lanceur.</li><li><b>Un vrai tour de jeu.</b> Une capacité ou une relève consomme ton tour. L’adversaire effectue ensuite une seule action.</li><li><b>Des soutiens temporisés.</b> Un bouclier absorbe le prochain impact sur cette carte, puis disparaît. Les boucliers ne se cumulent pas. Les soins ne dépassent pas 4 000 PV. Une recharge de 1 tour impose un tour d’attente avant réutilisation.</li><li><b>Les passifs sont automatiques.</b> Charges, rôles et protections sont indiqués sur le terrain. Les réserves sont propres à chaque carte et à chaque camp, et repartent à zéro au duel suivant.</li><li><b>La relève est stratégique.</b> Changer de carte consomme ton tour ; les réserves persistent sauf indication contraire, comme la Marche des dunes.</li><li><b>Les types comptent.</b> Feu → Nature → Sol → Foudre → Eau → Ombre → Temps → Lumière → Feu. Avantage ×1,25 ; faiblesse ×0,80 ; les autres sont neutres. Les valeurs à droite incluent déjà ces effets.</li><li><b>Victoire.</b> Deux équipes à 4 000 PV. À zéro PV, tu perds ; après 30 tours, le plus de PV gagne. +100 crédits fictifs par victoire.</li></ol><p>Les dégâts de base sont ajustés par l’ATK, le passif offensif et le type, puis par 15 % de la DEF adverse et ses protections.</p><p>Cette arène joue contre le cercle contrôlé par l’ordinateur. La collection est sauvegardée dans ton navigateur.</p><button class="button" data-action="close">C’est parti →</button>`,'wide');}
function arena(){
 const d=state.deck.map(cardBy).filter(Boolean);const heading=head('LE TERRAIN DES LÉGENDES','Le duel du cercle.','Deux capacités par carte. Un choix à chaque tour.',`<button class="button secondary" data-action="rules">Comment jouer ? ↗</button>`);
 if(!battle)return heading+`<section class="arena duel-lobby"><div class="eyebrow">TON TRIO · ${d.length}/3 CARTES</div><h2>Choisis ton style. Entre dans le cercle.</h2><div class="card-grid lobby-cards">${d.map(wrap).join('')}</div><div class="duel-flow"><span><b>01</b> Choisis une capacité</span><i>→</i><span><b>02</b> L’adversaire répond</span><i>→</i><span><b>03</b> Nouveau tour</span></div><div class="battle-controls"><button class="button" data-action="start-battle" ${d.length!==3?'disabled':''}>Entrer en combat ⚔</button><button class="button secondary" data-view="deck">Modifier mon trio</button></div><p class="duel-disclaimer">Contre le cercle · IA · 4 000 PV par équipe · +100 crédits par victoire</p></section>`;
 const p=cardBy(battle.player),e=cardBy(battle.enemy),ratio=modifier(p.type,e.type);
 return heading+`<section class="arena duel-board"><div class="arena-top"><div class="health"><b>TON ÉQUIPE</b><span data-health-value="player">${num(battle.php)} / 4 000 PV</span><div class="health-bar"><i data-health-bar="player" style="width:${battle.php/40}%"></i></div></div><div class="health"><b>LE CERCLE · IA</b><span data-health-value="enemy">${num(battle.ehp)} / 4 000 PV</span><div class="health-bar"><i data-health-bar="enemy" style="width:${battle.ehp/40}%"></i></div></div></div><div id="combat-announcement" class="combat-announcement" role="status" aria-live="polite">${battle.over?esc(battle.result):`Tour ${battle.turn} · À toi de jouer. Choisis une des deux capacités.`}</div><div class="duel-layout"><div class="duel-stage"><div class="fighter-labels"><span>TA CARTE ACTIVE</span><span>CIBLE ADVERSE</span></div><div class="battle-field">${combatFighter(p)}<span class="vs">VS</span>${combatFighter(e,true)}</div><div class="matchup-hint" style="color:${ratio>1?'#8bdfac':ratio<1?'#f0ae83':'#c5b2d9'}">${TYPE_ICONS[p.type]} ${p.type} → ${TYPE_ICONS[e.type]} ${e.type} · ${ratio>1?'Avantage de type':ratio<1?'Faiblesse de type':'Affrontement neutre'} ×${ratio.toLocaleString('fr-FR')}</div><div class="fighter-reserves"><span>${esc(passiveStatus(p))}</span><span>${esc(passiveStatus(e,true))}</span></div></div>${battle.over?`<section class="duel-result"><div class="eyebrow">DUEL TERMINÉ</div><h2>${esc(battle.result)}</h2><p>${num(battle.php)} PV contre ${num(battle.ehp)} PV</p><button class="button" data-action="new-battle">Préparer un nouveau duel →</button></section>`:abilityControls(p)}</div>${!battle.over?`<div class="duel-bench"><div><strong>Effectuer une relève</strong><small>Changer de carte consomme ton tour.</small></div><div class="deck-picker">${d.map(c=>`<button class="${c.id===p.id?'active':''}" data-action="switch" data-id="${c.id}" ${c.id===p.id?'disabled':''}>${esc(c.name)} <small>${TYPE_ICONS[c.type]} ${c.type}${c.id===p.id?' · active':''}</small></button>`).join('')}</div><button class="text-link" data-action="forfeit">Abandonner</button></div>`:''}<details class="duel-passive-details"><summary>Comprendre les passifs des deux combattants</summary><div class="combat-passives">${passiveBattlePanel(p)}${passiveBattlePanel(e,true)}</div></details><details class="duel-journal" open><summary>Dernières actions · tour ${Math.min(battle.turn,30)}</summary><div class="battle-log" role="log">${battle.log.slice(-6).map(line=>`<div>${esc(line)}</div>`).join('')}</div></details></section>`;
}
