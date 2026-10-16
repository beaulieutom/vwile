// Automatic, bounded passives. Active powers remain independent of these rules.
const PASSIVES={
 zg:{name:'Pacte du Fondateur',short:'La diversité du cercle renforce ZG.',text:'Tant que ZG est actif : +100 ATK et DEF par autre type présent dans son deck (maximum +200). Sa première capacité défensive du duel crée un bouclier de 200 PV, absorbé au prochain dégât subi par ZG.'},
 'zg-exile':{name:'Marche des dunes',short:'Les attaques successives nourrissent l’exil.',text:'Chaque attaque de ZG Exilé prépare +100 ATK pour les suivantes, jusqu’à +300. Quitter le terrain remet cette progression à zéro. À 1 500 PV ou moins, il gagne aussi +150 DEF.'},
 'yanis-vs-zg':{name:'La dette de l’armure',short:'Encaisse, charge l’armure, puis riposte.',text:'25 % des PV réellement perdus chargent l’armure (maximum 300). Sa prochaine attaque gagne autant d’ATK, puis vide la charge. Chaque attaque l’expose à −100 DEF, sans cumul, jusqu’à sa prochaine capacité défensive.'},
 'yanis-soldat':{name:'Hypervigilance',short:'Chaque impact devient une leçon de survie.',text:'Les deux premiers dégâts que subit Yanis sont réduits de 200 PV chacun. Chaque impact qui lui retire encore des PV lui donne +100 DEF pour le reste du duel, jusqu’à +300. Les impacts entièrement absorbés ne le renforcent pas.'},
 'abde-yanis':{name:'La salle hors du temps',short:'Défends pour stocker le temps. Attaque pour le libérer.',text:'Chaque capacité défensive stocke une charge de temps (maximum 2). Leur prochaine attaque consomme toutes les charges : +150 ATK et soin de 100 PV par charge. Les charges restent en réserve lors d’un changement de carte.'},
 'tom-samourai':{name:'Iaï des pétales rosés',short:'Une garde patiente prépare la lame.',text:'Défendre prépare un Iaï : +250 ATK pour la prochaine attaque, sans cumul. Si cette attaque possède l’avantage de type, Tom gagne ensuite un bouclier de 150 PV, absorbé au prochain dégât qu’il subit. Un nouveau bouclier remplace le précédent.'},
 'tom-u6':{name:'Protocole de peptidance',short:'Prépare tes doses, puis déclenche la réaction.',text:'Protocole U6 prépare 2 doses : seulement 3 doses peuvent être produites par duel. Chaque attaque consomme 1 dose pour +150 ATK et un soin de 100 PV. Les doses inutilisées restent en réserve lors d’un changement.'},
 'emilien-larp':{name:'Les mille rôles du Larp',short:'Assaut ou Gardien : incarne ton prochain rôle.',text:'Emilien commence en rôle Assaut : +200 ATK. Défendre le fait passer en Gardien : +250 DEF à la place. Attaquer le remet en Assaut. Une seule fois par duel, revenir en Assaut après Gardien lui donne un bouclier de 100 PV. Le rôle est conservé quand il quitte le terrain.'}
};
function passiveFor(c){return !c?.unknown?PASSIVES[c?.id]:null;}
function passiveMemory(c,ai=false){
 if(!battle)return {};
 battle.passives||={};const key=(ai?'ai:':'')+c.id;
 return battle.passives[key]||=( {chain:0,charge:0,exposed:false,hits:0,trauma:0,time:0,iai:false,doses:0,produced:0,role:'Assaut',roleShieldUsed:false,shield:0,founderGuard:false} );
}
function passiveLog(c,message,ai){battle.log.push(`✦ ${ai?'IA':'Toi'} · ${c.name} — ${message}`);}
function passiveStats(c,ai=false){
 const bonus={atk:0,def:0};if(!battle||!passiveFor(c))return bonus;
 const m=passiveMemory(c,ai);
 switch(c.id){
 case'zg':{const deck=ai?battle.enemyDeck:state.deck;const types=new Set(deck.map(cardBy).filter(Boolean).map(x=>x.type));types.delete(c.type);bonus.atk=bonus.def=Math.min(2,types.size)*100;break;}
 case'zg-exile':bonus.atk=m.chain*100;bonus.def=(ai?battle.ehp:battle.php)<=1500?150:0;break;
 case'yanis-vs-zg':bonus.atk=m.charge;bonus.def=m.exposed?-100:0;break;
 case'yanis-soldat':bonus.def=m.trauma*100;break;
 case'abde-yanis':bonus.atk=m.time*150;break;
 case'tom-samourai':bonus.atk=m.iai?250:0;break;
 case'tom-u6':bonus.atk=m.doses?150:0;break;
 case'emilien-larp':if(m.role==='Assaut')bonus.atk=200;else bonus.def=250;break;
 }
 return bonus;
}
function battleCard(c,ai=false){const p=passiveStats(c,ai),b=battle.boost[(ai?'ai:':'')+c.id]||{};return {...c,atk:c.atk+(b.atk||0)+p.atk,def:c.def+(b.def||0)+p.def};}
function passiveHeal(c,amount,ai){const hp=ai?'ehp':'php';if(battle[hp]<=0)return;const healed=Math.min(amount,4000-battle[hp]);battle[hp]+=healed;if(healed)passiveLog(c,`récupère ${healed} PV.`,ai);}
function prepareDoses(c,amount,ai){const m=passiveMemory(c,ai),gain=Math.min(amount,3-m.produced);if(gain>0){m.produced+=gain;m.doses+=gain;passiveLog(c,`prépare ${gain} dose(s), ${m.produced}/3 produites.`,ai);}}
function passiveAction(c,action,ai=false){
 if(!passiveFor(c))return;const m=passiveMemory(c,ai);
 if(action==='defend'){
  if(c.id==='zg'&&!m.founderGuard){m.founderGuard=true;m.shield=200;passiveLog(c,'le Pacte crée un bouclier de 200 PV.',ai);}
  if(c.id==='yanis-vs-zg'&&m.exposed){m.exposed=false;passiveLog(c,'l’armure referme sa brèche.',ai);}
  if(c.id==='abde-yanis'&&m.time<2){m.time++;passiveLog(c,`stocke le temps : ${m.time}/2 charges.`,ai);}
  if(c.id==='tom-samourai'&&!m.iai){m.iai=true;passiveLog(c,'prépare son Iaï : prochaine attaque +250 ATK.',ai);}
  if(c.id==='tom-u6')prepareDoses(c,1,ai);
  if(c.id==='emilien-larp'&&m.role!=='Gardien'){m.role='Gardien';passiveLog(c,'incarne le Gardien : +250 DEF.',ai);}
 }
 if(action==='attack'&&c.id==='emilien-larp'){if(m.role==='Gardien'&&!m.roleShieldUsed){m.shield=Math.max(m.shield,100);m.roleShieldUsed=true;passiveLog(c,'revient en Assaut et crée son bouclier unique de 100 PV.',ai);}m.role='Assaut';}
 if(action==='power'){
  if(c.id==='tom-u6')prepareDoses(c,2,ai);

 }
 if(action==='leave'&&c.id==='zg-exile')m.chain=0;
}
function passiveAfterAttack(c,defender,ai=false){
 if(!passiveFor(c))return;const m=passiveMemory(c,ai);
 switch(c.id){
 case'zg-exile':if(m.chain<3){m.chain++;passiveLog(c,`avance dans les dunes : +${m.chain*100} ATK pour ses prochaines attaques.`,ai);}break;
 case'yanis-vs-zg':m.exposed=true;passiveLog(c,'libère sa charge ; −100 DEF jusqu’à sa prochaine défense.',ai);break;
 case'abde-yanis':if(m.time){const n=m.time;m.time=0;passiveLog(c,`libère ${n} charge(s) de temps.`,ai);passiveHeal(c,n*100,ai);}break;
 case'tom-samourai':if(m.iai){m.iai=false;if(modifier(c.type,defender.type)>1){m.shield=150;passiveLog(c,'l’Iaï favorable crée un bouclier de 150 PV.',ai);}}break;
 case'tom-u6':if(m.doses){m.doses--;passiveLog(c,`consomme une dose ; ${m.doses} en réserve.`,ai);passiveHeal(c,100,ai);}break;
 }
}
function takeBattleDamage(ai,amount){
 const c=cardBy(ai?battle.enemy:battle.player),m=passiveMemory(c,ai),hp=ai?'ehp':'php';let loss=Math.max(0,Math.round(amount));if(!loss)return 0;
 if(c.id==='yanis-soldat'&&m.hits<2){const absorbed=Math.min(loss,200);loss-=absorbed;m.hits++;passiveLog(c,`Hypervigilance absorbe ${absorbed} PV (${m.hits}/2).`,ai);}
 if(m.shield){const absorbed=Math.min(loss,m.shield);loss-=absorbed;m.shield=0;passiveLog(c,`son bouclier absorbe ${absorbed} PV, puis disparaît.`,ai);}
 loss=Math.min(loss,battle[hp]);battle[hp]-=loss;
 if(loss>0&&c.id==='yanis-soldat'&&m.trauma<3){m.trauma++;passiveLog(c,`s’endurcit : +${m.trauma*100} DEF.`,ai);}
 if(loss>0&&c.id==='yanis-vs-zg'){m.charge=Math.min(300,m.charge+Math.floor(loss*.25));passiveLog(c,`l’armure emmagasine ${m.charge}/300 ATK.`,ai);}
 return loss;
}
function passiveDetail(c){const p=passiveFor(c);return p?`<section class="passive-detail"><div class="eyebrow">PASSIF · AUTOMATIQUE</div><h3>✦ ${esc(p.name)}</h3><p>${esc(p.text)}</p><small>Se déclenche pour la carte active, sans consommer d’action supplémentaire. Les bonus et réserves repartent à zéro à chaque nouveau duel.</small></section>`:'';}
function passiveStatus(c,ai=false){
 const m=passiveMemory(c,ai),p=passiveStats(c,ai);let labels=[];
 if(p.atk)labels.push(`${p.atk>0?'+':''}${p.atk} ATK`);if(p.def)labels.push(`${p.def>0?'+':''}${p.def} DEF`);
 if(m.shield)labels.push(`Bouclier ${m.shield} PV`);
 if(c.id==='abde-yanis')labels.push(`Temps ${m.time}/2`);
 if(c.id==='tom-u6')labels.push(`Doses ${m.doses} · produites ${m.produced}/3`);
 if(c.id==='yanis-soldat')labels.push(`Protections ${2-m.hits}/2`);
 if(c.id==='yanis-vs-zg')labels.push(`Armure ${m.charge}/300`);
 if(c.id==='emilien-larp')labels.push(`Rôle ${m.role}`);
 return labels.join(' · ')||'En attente de son déclencheur';
}
function passiveBattlePanel(c,ai=false){const p=passiveFor(c);if(!p)return '';return `<article class="combat-passive"><small>${ai?'LE CERCLE':'TON COMBATTANT'} · ${esc(c.name)}</small><h3>✦ ${esc(p.name)}</h3><strong>${esc(passiveStatus(c,ai))}</strong><p>${esc(p.text)}</p></article>`;}
