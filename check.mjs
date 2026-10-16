import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const nodes=new Map(),scheduled=new Map();let nextTimer=0,lastSaved=null;
const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},dataset:{},classList:{add(){},remove(){}},addEventListener(){},querySelector(){return {focus(){}}},focus(){}});return nodes.get(selector)};
const ctx=vm.createContext({console,structuredClone,crypto:webcrypto,setInterval(){},setTimeout(fn){const id=++nextTimer;scheduled.set(id,fn);return id;},clearTimeout(id){scheduled.delete(id);},localStorage:{getItem(){return null},setItem(k,v){lastSaved=v;}},document:{querySelector:node,querySelectorAll(){return []},addEventListener(){},body:{style:{}}},window:{scrollTo(){}}});
vm.runInContext(await readFile('dist/game-features.js','utf8'),ctx);
vm.runInContext(await readFile('dist/passives.js','utf8'),ctx);
vm.runInContext(await readFile('dist/combat-animation.js','utf8'),ctx);
vm.runInContext(await readFile('dist/duel.js','utf8'),ctx);
vm.runInContext(await readFile('dist/formation.js','utf8'),ctx);
vm.runInContext((await readFile('dist/app.js','utf8')).replace('unlimitedCredits:true','unlimitedCredits:false'),ctx);
const run=s=>vm.runInContext(s,ctx);
const realIds=['zg','zg-exile','yanis-vs-zg','yanis-soldat','abde-yanis','tom-samourai','tom-u6','le-maire','emilien-larp','ayman'];
assert.deepEqual([...run('state.cards.map(c=>c.id)')],realIds);
assert.equal(run('state.auctions.length'),0);
assert.equal(run('state.cards.every(c=>SPECIAL_ART[c.id]&&(c.unknown||(c.atk+c.def===BUDGETS[c.rarity])))'),true);
assert.equal(run('state.deck.every(id=>cardBy(id)?.owned>0)&&state.deck.length===6'),true);
assert.doesNotThrow(()=>run('home();collection();boosters();auctions();arena();friends();'));
assert.equal(run('collection().includes(\'data-action="type-wheel"\')'),true);
assert.equal(run('collection().includes("Roue des types")'),true);
assert.equal(run('collection().includes("Roue d’équipe")'),false);
assert.equal(run('RARITY_COLORS.Mythique===RARITY_COLORS.Mystique'),true);
assert.equal(run('new Set([RARITY_COLORS.Mythique,RARITY_COLORS.Légendaire,RARITY_COLORS.Héroïque]).size'),3);
assert.equal(run('rank.Mythique===rank.Mystique&&rank.Mythique>rank.Légendaire&&rank.Légendaire>rank.Héroïque'),true);
assert.equal(run('collection().includes(\'id="type-guide-title"\')'),false);
assert.equal(run('typeWheel().match(/data-action="select-type"/g).length'),8);
assert.equal(run('TYPES.every(t=>TYPES.filter(d=>modifier(t,d)===1.25).length===1&&TYPES.filter(d=>modifier(t,d)===0.8).length===1&&TYPES.filter(d=>modifier(t,d)===1).length===6)'),true);
assert.equal(run('TYPES.every(t=>modifier(t,typeMatchup(t).strong)===1.25&&modifier(t,typeMatchup(t).weak)===0.8)'),true);
assert.equal(run('new Set(Object.values(COLORS)).size'),8);
assert.equal(run('modifier("Sol","Foudre")'),1.25);
assert.equal(run('modifier("Temps","Ombre")'),0.8);
assert.equal(run('PACKS.every(p=>p.weights.length===RARITIES.length&&p.weights.reduce((a,b)=>a+b,0)===100)'),true);
run('let draws=[];const originalRandomCard=randomCard;randomCard=(...args)=>{const c=originalRandomCard(...args);draws.push(c);return c;};');
for(const id of ['origines','elite','duel'])for(let i=0;i<50;i++){
 run(`state=fresh();draws=[];openPack('${id}');`);
 assert.equal(run('draws.length'),5);
 assert.equal(run('state.cards.reduce((n,c)=>n+c.owned,0)'),run('BASE.reduce((n,c)=>n+c.owned,0)+5'));
 assert.equal(run('draws.every(c=>BASE.some(b=>b.id===c.id))'),true);
 assert.equal(run('state.balance'),2450-run(`PACKS.find(p=>p.id==='${id}').cost`));
 const last=run('draws.at(-1)');
 if(id==='origines')assert(['Légendaire','Mythique','Mystique'].includes(last.rarity));
 if(id==='elite')assert(['Mythique','Mystique'].includes(last.rarity));
 if(id==='duel')assert(['Sol','Temps'].includes(last.type));
 run('closeModal();');
}
run(`state=fresh();state.catalogVersion=2;state.balance=1000;state.opened=9;state.wins=4;cardBy('zg').owned=7;state.cards.push({id:'alex',name:'Ancien exemple',owned:4},{...structuredClone(BASE[0]),id:'friend-personal',name:'Ami personnalisé'});state.deck=['alex','zg'];state.auctions=[{id:'old',card:'alex',mine:true,settled:false,price:425},{id:'settled',card:'luna',mine:true,settled:true,price:300},{id:'real',card:'zg',self:true,mine:false,price:100}];migrateCards(state);migrateCards(state);`);
assert.equal(run('state.cards.some(c=>DEMO_IDS.has(c.id))'),false);
assert.equal(run('state.cards.length'),run('BASE.length+1'));
assert.equal(run('cardBy("friend-personal").name'),'Ami personnalisé');
assert.equal(run('cardBy("zg").owned'),7);
assert.equal(run('state.balance'),1425);
assert.equal(run('state.opened'),9);
assert.equal(run('state.wins'),4);
assert.equal(run('state.auctions.length'),1);
assert.equal(run('state.auctions[0].id'),'real');
assert.equal(run('state.deck.length'),6);
assert.equal(run('state.deck.every(id=>cardBy(id)?.owned>0)'),true);
run('state.deck=["zg"];migrateCards(state);');
assert.equal(run('state.deck.length'),1);
run('state=fresh();cardBy("zg").owned=0;state.auctions.push({id:"real-bid",card:"zg",price:100,ends:Date.now()+100000,mine:false,bids:0});confirmBid("real-bid");');
assert.equal(run('state.balance'),2325);
run('state.auctions[0].ends=Date.now()-1;settleAuctions();settleAuctions();');
assert.equal(run('cardBy("zg").owned'),1);
assert.equal(run('state.balance'),2325);
console.log('Verified: ten real cards only, 150 booster openings and guarantees, demo cleanup with exactly-once refund, custom cards/progress preserved, repaired deck, auctions, 64 type matchups, wheel hidden behind collection button.');

assert.equal(run('cardBy("tom-samourai").rarity'),'Légendaire');
assert.equal(run('cardBy("tom-samourai").type'),'Nature');
assert.equal(run('cardBy("yanis-soldat").rarity'),'Héroïque');
assert.equal(run('state.cards.filter(c=>c.rarity==="Mystique").every(c=>c.id==="tom-u6")'),true);
run('state=fresh();state.catalogVersion=3;state.cards=state.cards.filter(c=>c.id!=="tom-samourai");Object.assign(cardBy("yanis-soldat"),{rarity:"Mystique",atk:1800,def:2400,effect:"Une fois par duel : +500 DEF, −500 ATK.",level:8,owned:4});state.balance=1620;state.deck=["yanis-soldat","zg","abde-yanis"];migrateCards(state);migrateCards(state);');
assert.equal(run('state.cards.length'),run('BASE.length'));
assert.equal(run('cardBy("tom-samourai").owned'),1);
assert.equal(run('cardBy("yanis-soldat").owned'),4);
assert.equal(run('cardBy("yanis-soldat").rarity'),'Héroïque');
assert.equal(run('cardBy("yanis-soldat").atk+cardBy("yanis-soldat").def'),4000);
assert.equal(run('cardBy("yanis-soldat").type'),'Sol');
assert.equal(run('state.balance'),1620);
assert.equal(run('state.deck[0]'),'yanis-soldat');
assert.equal(run('PACKS.every(p=>p.weights.every((w,i)=>!w||BASE.some(c=>c.rarity===RARITIES[i])))'),true);
console.log('Verified: Tom legendary Full Art, heroic Yanis migration preserving duplicates/deck/credits, no booster weight for absent rarities.');

assert.equal(run('cardBy("tom-u6").name'),'Tom U6');
assert.equal(run('cardBy("tom-u6").title'),'La peptidance');
assert.equal(run('cardBy("tom-u6").rarity'),'Mystique');
assert.equal(run('cardBy("tom-u6").type'),'Eau');
run('state=fresh();state.cards=state.cards.filter(c=>c.id!=="tom-u6");state.balance=1370;cardBy("tom-samourai").owned=3;migrateCards(state);migrateCards(state);');
assert.equal(run('state.cards.length'),run('BASE.length'));
assert.equal(run('cardBy("tom-u6").owned'),1);
assert.equal(run('state.balance'),1370);
assert.equal(run('cardBy("tom-samourai").owned'),3);
assert.equal(run('cardBy("le-maire").name'),'Le Maire');
assert.equal(run('cardBy("le-maire").title'),'');
assert.equal(run('cardBy("le-maire").type'),'Inconnu');
assert.equal(run('cardBy("le-maire").atk'),null);
assert.equal(run('cardBy("le-maire").def'),null);
assert.equal(run('card(cardBy("le-maire")).includes("★")'),false);
assert.equal(run('state.cards.every(c=>!card(c).includes("★"))'),true);
assert.equal(run('card(cardBy("le-maire")).includes("null")'),false);
assert.equal(run('isPlayable(cardBy("le-maire"))'),false);
run('state=fresh();state.deck=["le-maire","zg","abde-yanis"];battle=null;startBattle();');
assert.equal(run('battle'),null);
run('migrateCards(state);');
assert.equal(run('state.deck.includes("le-maire")'),false);
assert.equal(run('Array.from({length:100},()=>randomCard()).every(c=>!c.unknown)'),true);
run('state=fresh();state.cards=state.cards.filter(c=>c.id!=="le-maire");state.balance=910;migrateCards(state);migrateCards(state);');
assert.equal(run('state.cards.length'),run('BASE.length'));
assert.equal(run('cardBy("le-maire").owned'),1);
assert.equal(run('state.balance'),910);
console.log('Verified: Le Maire has null combat stats, no stars, no subtitle or invented values, cannot enter combat or normal booster pools, and is added once to existing saves.');
run('state=fresh();state.catalogVersion=4;cardBy("tom-samourai").name="Tom";cardBy("tom-samourai").owned=4;state.balance=1700;state.deck=["tom-samourai","zg","abde-yanis"];migrateCards(state);migrateCards(state);');
assert.equal(run('cardBy("tom-samourai").name'),'Tom U7');
assert.equal(run('cardBy("tom-samourai").owned'),4);
assert.equal(run('state.balance'),1700);
assert.equal(run('state.deck[0]'),'tom-samourai');

run('closeModal();state=fresh();battle=null;');
assert.equal(run('NAV.some(n=>n[0]==="deck")'),true);
assert.equal(run('deckBuilder().includes("Carte à collectionner")||deckBuilder().includes("CARTE À COLLECTIONNER")'),true);
assert.equal(run('toggleDeckCard("emilien-larp")'),false);
assert.equal(run('state.deck.length'),6);
assert.equal(run('toggleDeckCard("yanis-soldat")'),true);
assert.equal(run('toggleDeckCard("emilien-larp")'),true);
assert.equal(run('makeDeckLead("emilien-larp")'),true);
assert.equal(JSON.parse(lastSaved).deck[0],'emilien-larp');
assert.equal(run('state.deck.length===6&&new Set(state.deck).size===6'),true);
assert.equal(run('toggleDeckCard("le-maire")'),false);
run('startBattle();');
assert.equal(run('battle.player'),'emilien-larp');
assert.equal(run('toggleDeckCard("zg")'),false);
assert.equal(run('makeDeckLead("zg")'),false);
run('battle=null;state=fresh();');
assert.equal(run('boosterGlow([cardBy("yanis-soldat"),cardBy("zg")]).color'),run('RARITY_COLORS.Légendaire'));
assert.equal(run('boosterGlow([cardBy("zg"),cardBy("tom-u6")]).color'),run('RARITY_COLORS.Mystique'));
assert.equal(run('boosterGlow([cardBy("emilien-larp"),cardBy("yanis-soldat")]).color'),run('RARITY_COLORS.Héroïque'));
scheduled.clear();
run('openPack("elite");');
assert.equal(run('openingSession.glow.color'),run('RARITY_COLORS.Mythique'));
assert.equal(run('openingSession.revealed'),false);
assert.equal(run('state.balance'),1850);
run('openPack("elite");');
assert.equal(run('state.balance'),1850);
assert.equal(run('state.opened'),1);
assert.equal(run('state.cards.reduce((n,c)=>n+c.owned,0)'),run('BASE.reduce((n,c)=>n+c.owned,0)+5'));
assert.equal(run('revealBoosterOpening(openingSession.id)'),true);
assert.equal(run('revealBoosterOpening(openingSession.id)'),false);
assert.equal(run('state.balance'),1850);
run('closeModal();state=fresh();openPack("origines");');
const staleCallbacks=[...scheduled.values()];
run('closeModal();');
for(const callback of staleCallbacks)callback();
assert.equal(run('openingSession'),null);
assert.equal(node('#modal').hidden,true);
assert.equal(run('state.opened'),1);
assert.equal(run('state.cards.reduce((n,c)=>n+c.owned,0)'),run('BASE.reduce((n,c)=>n+c.owned,0)+5'));
scheduled.clear();
run('state=fresh();openPack("origines");startBoosterTear();');
for(const callback of [...scheduled.values()])callback();
assert.equal(run('openingSession.phase'),'revealed');
assert.equal(run('openingSession.revealed'),true);
run('closeModal();state=fresh();');
ctx.matchMedia=()=>({matches:true});
run('openPack("origines");');
assert.equal(run('openingSession.revealed'),true);
run('closeModal();');delete ctx.matchMedia;
console.log('Verified: deck limit, uniqueness, ownership rules, first-card order, persistence and duel lock; real highest-rarity glow; one purchase despite repeated clicks; skip, timer completion, cancellation and reduced-motion opening.');

run('state=fresh();state.unlimitedCredits=true;state.balance=0;openPack("elite");');
assert.equal(run('state.opened'),1);
assert.equal(run('state.balance'),0);
assert.equal(run('creditLabel()'),'∞');
assert.equal(run('openingSession.phase'),'sealed');
assert.equal(run('openingSession.glowVisible'),false);
assert(!node('#modal').innerHTML.includes('Lueur Mystique'));
assert(!node('#modal').innerHTML.includes('--opening-color:#ff5c69'));
assert.equal(run('openingSession.timers.length'),0);
assert.equal(run('startBoosterTear()'),true);assert.equal(run('startBoosterTear()'),false);
assert.equal(run('openingSession.phase'),'tearing');assert.equal(run('openingSession.glowVisible'),false);
const stages=run('openingSession.timers').map(id=>scheduled.get(id));
stages[0]();assert.equal(run('openingSession.phase'),'glowing');assert.equal(run('openingSession.glowVisible'),true);
stages[1]();stages[2]();
assert.equal(run('openingSession.index'),0);
assert.equal((node('#modal').innerHTML.match(/class="tcg-card/g)||[]).length,1);
for(let i=1;i<5;i++){run('nextBoosterCard();');assert.equal(run('openingSession.index'),i);assert(node('#modal').innerHTML.includes('CARTE '+(i+1)+' / 5'));}
run('nextBoosterCard();');assert.equal(run('openingSession.phase'),'summary');
assert.equal(run('nextBoosterCard()'),false);
assert.equal(run('state.opened'),1);
run('closeModal();');
console.log('Verified: unlimited credits survive a zero balance, sealed booster hides rarity, tearing precedes the glow, five cards advance one by one before the summary.');

assert.equal(run('packTearProgress(0,120,200)'),1);
assert.equal(run('packTearProgress(200,80,200)'),1);
assert.equal(run('packTearProgress(0,20,200)'),1/6);
run('beginBoosterOpening(PACKS[0],[cardBy("tom-u6"),cardBy("zg"),cardBy("emilien-larp"),cardBy("zg-exile"),cardBy("yanis-soldat")]);');
assert.equal(run('openingSession.results.at(-1).rarity'),'Mythique');
assert.equal(run('openingSession.results.every((c,i,a)=>i===0||rank[a[i-1].rarity]<=rank[c.rarity])'),true);
assert.equal(run('openingSession.results.length'),5);
assert.equal(run('openingSession.results[0].id'),'emilien-larp');
run('closeModal();');
console.log('Verified: stable rarity order with highest rarity last, no automatic tear, one tear trigger, bidirectional swipe threshold.');
// Six-card formations, independent HP, real ally support and reserves.
const allFighters=realIds.filter(id=>id!=='le-maire');
function setupFormation(front=['zg','yanis-soldat','abde-yanis']){
 const deck=[...new Set([...front,...allFighters])].slice(0,6);
 run(`view='accueil';clearCombatPresentation();state=fresh();state.deck=${JSON.stringify(deck)};battle=null;startBattle();`);
}
setupFormation();
assert.equal(run('state.deck.length'),6);assert.equal(run('battle.playerField.length'),3);assert.equal(run('reserveIds().length'),3);
assert.equal(run('Object.keys(battle.units.player).length'),6);assert.equal(run('battle.php'),12000);
assert.equal(run('new Set(battle.enemyDeck).size'),6);
run('state=fresh();state.catalogVersion=5;state.deck=["emilien-larp","zg","abde-yanis"];cardBy("ayman").owned=0;migrateCards(state);migrateCards(state);');
assert.equal(run('state.deck.length'),6);
assert.deepEqual([...run('state.deck.slice(0,3)')],['emilien-larp','zg','abde-yanis']);
assert.equal(run('state.deck.includes("ayman")'),false);
run('state.deck=["zg"];migrateCards(state);');assert.equal(run('state.deck.length'),1);

setupFormation();
const firstTarget=run('battle.enemyField[1]');run(`battle.enemy='${firstTarget}';`);
const predictedLoss=run('abilityPrediction(cardBy(battle.player),abilitiesFor(cardBy(battle.player))[0]).loss');
const enemyBefore={...run('Object.fromEntries(Object.entries(battle.units.enemy).map(([id,u])=>[id,u.hp]))')};
run('applyAbility(0);');
for(const [id,hp]of Object.entries(enemyBefore))assert.equal(run(`currentHP('${id}',true)`),hp-(id===firstTarget?predictedLoss:0));
assert.equal(run('battle.php'),12000);
assert.equal(run('applyAbility(0)'),false);

setupFormation(['tom-u6','yanis-soldat','zg']);
run('combatUnit("yanis-soldat").hp=500;syncBattleTotals();battle.allyTarget="yanis-soldat";');
const reserveBefore=run('reserveIds()[0]');const teamEnemy=run('battle.ehp');
assert.equal(run('abilityPrediction(cardBy("tom-u6"),abilitiesFor(cardBy("tom-u6"))[1]).heal'),360);
run('applyAbility(1);');
assert.equal(run('currentHP("yanis-soldat")'),860);
assert.equal(run('currentHP("tom-u6")'),2000);
assert.equal(run(`currentHP('${reserveBefore}')`),2000);
assert.equal(run('battle.ehp'),teamEnemy);
assert.equal(run('passiveMemory(cardBy("tom-u6")).doses'),2);
run('battle.turn+=3;');assert.equal(run(`applyAbility(1,false,'${reserveBefore}')`),false);
run('combatUnit("yanis-soldat").hp=0;');assert.equal(run('applyAbility(1,false,"yanis-soldat")'),false);
assert.equal(run('currentHP("yanis-soldat")'),0);

setupFormation(['zg','yanis-soldat','abde-yanis']);
run('combatUnit("zg").hp=1000;combatUnit("yanis-soldat").hp=1900;combatUnit("abde-yanis").hp=800;syncBattleTotals();');
assert.equal(run('abilityPrediction(cardBy("zg"),abilitiesFor(cardBy("zg"))[1]).heal'),460);
run('applyAbility(1);');
assert.equal(run('currentHP("zg")'),1180);assert.equal(run('currentHP("yanis-soldat")'),2000);assert.equal(run('currentHP("abde-yanis")'),980);
assert.equal(run('reserveIds().every(id=>currentHP(id)===2000)'),true);

setupFormation(['emilien-larp','yanis-soldat','abde-yanis']);
run('battle.allyTarget="yanis-soldat";applyAbility(1);');
assert.equal(run('passiveMemory(cardBy("yanis-soldat")).shield'),300);
assert.equal(run('passiveMemory(cardBy("emilien-larp")).shield'),0);
assert.equal(run('passiveStats(cardBy("emilien-larp")).def'),250);
assert.equal(run('takeBattleDamage(false,600,"yanis-soldat")'),100); // 200 Hypervigilance + 300 ally shield.
assert.equal(run('currentHP("yanis-soldat")'),1900);
assert.equal(run('passiveMemory(cardBy("yanis-soldat")).shield'),0);

setupFormation(['abde-yanis','yanis-soldat','zg']);
run('combatUnit("yanis-soldat").hp=800;battle.allyTarget="yanis-soldat";applyAbility(1);');
assert.equal(run('currentHP("yanis-soldat")'),1040);assert.equal(run('passiveMemory(cardBy("abde-yanis")).time'),1);
run('battle.turn++;applyAbility(0);');assert.equal(run('passiveMemory(cardBy("abde-yanis")).time'),0);

setupFormation();
const deadEnemy=run('battle.enemyField[0]'),nextEnemy=run('reserveIds(true)[0]');
run(`combatUnit('${deadEnemy}',true).hp=1;`);
run('applyAbility(0);');
assert.equal(run(`currentHP('${deadEnemy}',true)`),0);
assert.equal(run('battle.enemyField[0]'),nextEnemy);
assert.equal(run('reserveIds(true).length'),2);
assert.equal(run('battle.log.some(l=>l.includes("K.O."))'),true);

setupFormation(['zg-exile','zg','abde-yanis']);
const relief=run('reserveIds()[0]');
run('combatUnit("zg-exile").hp=900;passiveMemory(cardBy("zg-exile")).chain=3;battle.cooldowns["zg-exile:1"]=10;syncBattleTotals();');
assert.equal(run(`battleAction('switch','${relief}')`),true);
assert.equal(run('currentHP("zg-exile")'),900);assert.equal(run('passiveMemory(cardBy("zg-exile")).chain'),0);
assert.equal(run('battle.cooldowns["zg-exile:1"]'),10);assert.equal(run('battle.turn'),2);
assert.equal(run('reserveIds().includes("zg-exile")'),true);
assert.equal(run(`battle.playerField.includes('${relief}')`),true);

setupFormation();
const turnBefore=run('battle.turn'),caster=run('battle.playerField[1]'),target=run('battle.enemyField[2]');
assert.equal(run(`battleAction('select-fighter','${caster}')`),true);
assert.equal(run(`battleAction('select-enemy','${target}')`),true);
assert.equal(run('battle.turn'),turnBefore);
assert.equal(run('battleAction("select-fighter",reserveIds()[0])'),false);
assert.equal(run('arena().match(/data-action="select-fighter"/g).length'),3);
assert.equal(run('arena().match(/data-action="select-enemy"/g).length'),3);
assert.equal(run('arena().match(/data-action="ability"/g).length'),2);
assert.equal(run('deckBuilder().match(/class="deck-slot"/g).length'),6);
console.log('Verified: six-card migration preserving starting order, 3+3 deployment, individual targeting/HP, ally and team healing, ally shields, KO replacement, persistent reserves and free target selections.');

// Every unit and both sides obey damage previews; each camp retains six independent identities.
for(const actor of allFighters){
 setupFormation([actor,...allFighters.filter(id=>id!==actor).slice(0,2)]);
 for(const targetId of run('battle.enemyField')){
  run(`battle.enemy='${targetId}';battle.cooldowns={};`);
  const prediction=run('abilityPrediction(cardBy(battle.player),abilitiesFor(cardBy(battle.player))[0]).loss');
  const before=run(`currentHP('${targetId}',true)`);
  assert.equal(run('applyAbility(0)'),true);
  assert.equal(run(`currentHP('${targetId}',true)`),before-prediction);
 }
}
for(let trial=0;trial<36;trial++){
 const shuffled=[...allFighters].sort(()=>Math.random()-.5).slice(0,6);
 run(`view='accueil';state=fresh();state.deck=${JSON.stringify(shuffled)};battle=null;startBattle();`);
 let rounds=0;
 while(!run('battle.over')&&rounds++<42){
  run('battle.player=livingFront().sort((a,b)=>currentHP(b)-currentHP(a))[0];battle.enemy=weakestAlly(true);battle.allyTarget=weakestAlly();');
  const useSupport=rounds%4===0&&run('abilityReady(cardBy(battle.player),1)===0');
  assert.equal(run(`battleAction('ability','${useSupport?1:0}')`),true);
  assert.equal(run('Object.values(battle.units).every(side=>Object.values(side).every(u=>Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=UNIT_HP))'),true);
  assert.equal(run('livingFront().length<=3&&livingFront(true).length<=3&&new Set(battle.playerField).size===3&&new Set(battle.enemyField).size===3'),true);
 }
 assert.equal(run('battle.over'),true);
 const wins=run('state.wins');assert.equal(run('battleAction("ability","0")'),false);assert.equal(run('state.wins'),wins);
}
console.log('Verified: actual damage previews for all fighters, 36 full six-card battles with support and replacements, bounded individual HP, no duplicate deployment and exactly-once rewards.');

// Replaying a queued KO must preserve the old target for its impact, then show its replacement.
setupFormation(['zg','tom-u6','abde-yanis']);scheduled.clear();
run('view="arene";combatUnit(battle.enemy,true).hp=1;syncBattleTotals();applyAbility(0);');
assert.equal(run('combatPresentation.queue.length'),1);
assert.equal(run('combatPresentation.queue[0].before.enemyField[0]!==combatPresentation.queue[0].after.enemyField[0]'),true);
run('playCombatEffects();');assert.equal(run('isCombatBusy()'),true);
const roundLocked=run('battle.turn');assert.equal(run('battleAction("ability","0")'),false);assert.equal(run('battle.turn'),roundLocked);
const delivered=new Set();for(let i=0;i<15;i++){const pending=[...scheduled.entries()].filter(([id])=>!delivered.has(id));if(!pending.length)break;for(const [id,fn]of pending){delivered.add(id);fn();}}
assert.equal(run('isCombatBusy()'),false);
assert.equal(run('combatPresentation.queue.length'),0);
assert.equal(node('[data-health-value="enemy"]').textContent,run('num(battle.ehp)+" / "+num(UNIT_HP*6)+" PV"'));
run('clearCombatPresentation();view="accueil";');
console.log('Verified: unit-specific animated impacts, KO snapshots and deployment transitions, live individual/total HP, and double-action lock.');

// Exercise procedural audio scheduling, cancellation and persisted mute.
{
 const audioEvents=[],listeners={};let storedMute=null;
 const soundButton={textContent:'',setAttribute(k,v){this[k]=v;}};
 const param=()=>({value:0,setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));audioEvents.push(['param',v]);},linearRampToValueAtTime(v,t){assert.ok(v>=0&&Number.isFinite(t));},exponentialRampToValueAtTime(v,t){assert.ok(v>0&&Number.isFinite(t));}});
 const voice=()=>({frequency:param(),gain:param(),Q:{value:0},connect(){return this;},disconnect(){},start(t){audioEvents.push(['start',t]);},stop(t){audioEvents.push(['stop',t]);}});
 class AudioMock{state='running';currentTime=0;sampleRate=8000;destination={};createOscillator(){return voice();}createGain(){return voice();}createBiquadFilter(){return voice();}createBufferSource(){return voice();}createBuffer(ch,n){assert.ok(n>0);return {getChannelData(){return new Float32Array(n);}};}}
 const audioCtx=vm.createContext({console,window:{AudioContext:AudioMock},localStorage:{getItem(){return null;},setItem(k,v){storedMute=v;}},document:{querySelector(){return soundButton;},addEventListener(k,fn){listeners[k]=fn;}}});
 vm.runInContext(await readFile('dist/sound.js','utf8'),audioCtx);
 for(const kind of ['pack','tear','glow','reveal','finale','support']){const before=audioEvents.length;vm.runInContext(`gameSound.play('${kind}')`,audioCtx);assert.ok(audioEvents.length>before);}
 for(const type of ['Feu','Nature','Sol','Foudre','Eau','Ombre','Temps','Lumière'])vm.runInContext(`gameSound.play('attack','${type}');gameSound.play('impact','${type}')`,audioCtx);
 vm.runInContext('gameSound.stop()',audioCtx);
 listeners.click({target:{closest(){return true;}}});assert.equal(storedMute,'1');assert.equal(soundButton['aria-pressed'],'false');const mutedCount=audioEvents.length;vm.runInContext("gameSound.play('tear')",audioCtx);assert.equal(audioEvents.length,mutedCount);
 listeners.click({target:{closest(){return true;}}});assert.equal(storedMute,'0');assert.ok(audioEvents.length>mutedCount);
 const silent=vm.createContext({window:{},localStorage:{getItem(){throw Error();}},document:{querySelector(){return null;},addEventListener(){}}});vm.runInContext(await readFile('dist/sound.js','utf8'),silent);vm.runInContext("gameSound.play('impact');gameSound.stop()",silent);
 console.log('Verified: audio for eight attack types and booster phases, finite envelopes, cancellation, persistent mute and unsupported-audio fallback.');
}
