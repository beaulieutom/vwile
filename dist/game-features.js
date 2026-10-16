let openingSession=null;
let openingSequence=0;
let deckQuery='';
let deckType='Tous les types';

function boosterGlow(cards){
 const best=cards.reduce((a,b)=>(rank[b.rarity]||0)>(rank[a.rarity]||0)?b:a);
 return {rarity:best.rarity,color:RARITY_COLORS[best.rarity]||'#c8d4e3',rank:rank[best.rarity]||0};
}
function clearBoosterOpening(){
 if(typeof gameSound!=='undefined')gameSound.stop();
 if(openingSession)openingSession.timers.forEach(clearTimeout);
 openingSession=null;
}
function beginBoosterOpening(pack,cards){
 clearBoosterOpening();
 const session={id:++openingSequence,pack,results:structuredClone(cards).sort((a,b)=>(rank[a.rarity]||0)-(rank[b.rarity]||0)),glow:boosterGlow(cards),timers:[],phase:'sealed',revealed:false,index:0,glowVisible:false};
 openingSession=session;
 if(typeof gameSound!=='undefined')gameSound.play('pack');
 const glow=session.glow;
 const baseColor={origines:"#b298f4",elite:"#e8bf67",duel:"#74bedb"}[pack.id]||"#b298f4";
 showModal(`<section class="booster-opening" id="booster-opening" style="--pack-color:${baseColor};--opening-color:${baseColor}"><div class="eyebrow">${esc(pack.name).toUpperCase()} · OUVERTURE #${state.opened}</div><h2>La légende est à l’intérieur.</h2><p id="opening-status" role="status">Glisse sur le haut du booster pour le déchirer.</p><div class="opening-stage" id="opening-stage" data-phase="sealed"><div class="opening-halo"></div><div class="opening-ring"></div><div class="opening-particles" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--angle:${i*30}deg;--particle-delay:${i*.12}s"></i>`).join('')}</div><div class="opening-pack"><div class="opening-light"></div><div class="opening-mouth" aria-hidden="true"></div><div class="opening-pack-top"></div><svg class="foil-crack" viewBox="0 0 180 16" aria-hidden="true"><path d="M0 6 L9 10 18 3 28 11 38 5 48 12 59 4 70 10 81 3 92 11 102 5 113 12 124 4 135 11 146 5 157 12 169 4 180 8"/></svg><div class="foil-fragments" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="tear-track" id="tear-track" aria-label="Balayer horizontalement pour déchirer le booster"><span>↔ GLISSE POUR OUVRIR</span><i></i></div><div class="opening-pack-body"><b>VWILE</b><small>TRADING CARD GAME</small><span class="opening-sigil">${pack.icon}</span><strong>${esc(pack.name).toUpperCase()}</strong><small>ORIGINES · 5 CARTES</small></div><div class="opening-seam"></div></div><div class="opening-burst"></div></div><button class="text-link tear-alternative" data-action="tear-pack">Déchirer le booster →</button><button class="text-link skip-opening" data-action="reveal-pack">Passer l’animation →</button><small class="opening-save-note">Tes 5 cartes sont déjà sauvegardées dans ta collection.</small></section>`,'wide opening-dialog');
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced){revealBoosterOpening(session.id);return;}
 const track=$('#tear-track');let drag=null;
 track.addEventListener('pointerdown',e=>{if(session.phase!=='sealed'||e.isPrimary===false||e.button>0)return;drag={x:e.clientX,width:track.getBoundingClientRect().width,id:e.pointerId};track.setPointerCapture?.(e.pointerId);});
 track.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||session.phase!=='sealed')return;const progress=packTearProgress(drag.x,e.clientX,drag.width);track.style.setProperty('--tear-progress',progress);if(progress>=1){drag=null;startBoosterTear();}});
 const release=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;track.style.setProperty('--tear-progress',0);};
 track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);track.addEventListener('lostpointercapture',release);
}
function packTearProgress(start,current,width){return Math.min(1,Math.abs(current-start)/Math.max(50,width*.6));}
function startBoosterTear(){
 const session=openingSession;if(!session||session.phase!=='sealed'||session.revealed)return false;
 session.phase='tearing';$('#opening-stage').dataset.phase='tearing';$('#opening-status').textContent='Le haut du booster se déchire…';
 if(typeof gameSound!=='undefined')gameSound.play('tear');
 const schedule=(delay,fn)=>session.timers.push(setTimeout(()=>{if(openingSession?.id===session.id&&!session.revealed&&!$('#modal').hidden)fn();},delay));
 schedule(1800,()=>{session.phase='glowing';session.glowVisible=true;$('#booster-opening').style.setProperty('--opening-color',session.glow.color);$('#opening-stage').dataset.phase='glowing';$('#opening-status').textContent='Une lueur s’échappe du booster…';if(typeof gameSound!=='undefined')gameSound.play('glow');});
 schedule(6500,()=>{session.phase='burst';$('#opening-stage').dataset.phase='burst';$('#opening-status').textContent='À toi de découvrir les cartes.';});
 schedule(8000,()=>revealBoosterOpening(session.id));return true;
}

function revealBoosterOpening(id){
 const session=openingSession;
 if(!session||session.id!==id||session.revealed)return false;
 session.timers.forEach(clearTimeout);session.timers=[];session.revealed=true;session.phase='revealed';
 if(typeof gameSound!=='undefined')gameSound.stop();
 showBoosterCard();return true;
}
function showBoosterSummary(){
 const session=openingSession;if(!session?.revealed)return false;session.phase="summary";
 const {glow,pack,results}=session;
 showModal(`<section class="booster-results" style="--opening-color:${glow.color}"><div class="result-heading"><div><div class="eyebrow">${esc(pack.name).toUpperCase()} · 5 CARTES RÉVÉLÉES</div><h2>Le cercle s’agrandit.</h2></div><span class="best-rarity">✦ ${esc(glow.rarity)}</span></div><p>Voici tes nouvelles cartes. Les doublons rejoignent aussi ta collection.</p><div class="reveal-grid pack-results">${results.map((c,i)=>`<div class="reveal-item ${(rank[c.rarity]||0)===glow.rank?'top-find':''}" style="--reveal-delay:${i*.14}s">${card(c)}<div class="card-meta"><span>${esc(c.name)}</span><span class="rarity" style="color:${RARITY_COLORS[c.rarity]}">${esc(c.rarity)}</span></div></div>`).join('')}</div><div class="result-actions"><button class="button" data-action="see-collection">Voir ma collection →</button><button class="button secondary" data-action="see-deck">Préparer mon deck ▤</button><button class="text-link" data-action="open-again" data-id="${pack.id}" ${!hasCredits(pack.cost)?'disabled':''}>Ouvrir un autre · ◈ ${num(pack.cost)}</button></div></section>`,'wide booster-reveal-dialog');
 return true;
}

function isDeckLocked(){return !!battle&&!battle.over;}
function toggleDeckCard(id){
 if(isDeckLocked()){toast('Termine ou abandonne ton duel avant de modifier le deck.');return false;}
 const c=cardBy(id);
 if(!c||c.owned<1)return false;
 if(!isPlayable(c)){toast('Statistiques inconnues : cette carte reste dans la collection.');return false;}
 if(state.deck.includes(id))state.deck=state.deck.filter(x=>x!==id);
 else if(state.deck.length<6)state.deck.push(id);
 else{toast('Ton deck est complet. Retire une carte pour libérer un emplacement.');return false;}
 battle=null;save();render();return true;
}
function makeDeckLead(id){
 if(isDeckLocked()){toast('Termine ou abandonne ton duel avant de modifier le deck.');return false;}
 if(!state.deck.includes(id))return false;
 state.deck=[id,...state.deck.filter(x=>x!==id)];save();render();return true;
}
function deckBuilder(){
 const locked=isDeckLocked();
 const chosen=state.deck.map(cardBy).filter(Boolean);
 const types=[...new Set(chosen.map(c=>c.type))];
 const owned=state.cards.filter(c=>c.owned>0&&(deckType==='Tous les types'||c.type===deckType)&&`${c.name} ${c.title} ${c.type}`.toLowerCase().includes(deckQuery.toLowerCase()));
 owned.sort((a,b)=>Number(state.deck.includes(b.id))-Number(state.deck.includes(a.id))||(rank[b.rarity]||0)-(rank[a.rarity]||0));
 const slots=Array.from({length:6},(_,i)=>{
  const c=chosen[i];
  if(!c)return `<article class="deck-slot empty-slot"><span class="deck-slot-number">0${i+1}</span><button class="empty-slot-button" data-action="deck-choose"><span>+</span><b>Choisir une carte</b><small>Depuis ta collection ci-dessous</small></button></article>`;
  return `<article class="deck-slot"><div class="deck-slot-head"><span>0${i+1}</span><b>${i<3?'COMBAT · '+(i+1):'RÉSERVE · '+(i-2)}</b></div><button class="deck-card-preview" data-action="detail" data-id="${c.id}" aria-label="Voir la carte ${esc(c.name)}">${card(c)}</button><div class="deck-slot-actions"><button data-action="${i<3?'deck-reserve':'deck-lead'}" data-id="${c.id}" ${locked?'disabled':''}>${i<3?'Mettre en réserve ↓':'Déployer au départ ↑'}</button><button class="remove-deck" data-action="deck-toggle" data-id="${c.id}" ${locked?'disabled':''} aria-label="Retirer ${esc(c.name)} du deck">Retirer ×</button></div></article>`;
 }).join('');
 return head('TON ÉQUIPE','Compose ton équipe de six.','Les trois premières cartes commencent au combat. Les trois suivantes forment ta réserve.',`<span class="pill">▤ ${chosen.length} / 6 emplacements</span>`)+`${locked?'<div class="notice deck-lock">Un duel est en cours. <button class="text-link" data-view="arene">Retourner à l’arène →</button></div>':''}<div class="deck-layout"><section class="deck-slots" aria-label="Les six emplacements du deck">${slots}</section><aside class="deck-summary"><div class="eyebrow">TON PLAN DE JEU</div><h2>${chosen.length===6?'Prêt à entrer en scène.':'Une équipe à compléter.'}</h2><div class="deck-totals"><div><small>ATK CUMULÉE</small><strong>${num(chosen.reduce((n,c)=>n+c.atk,0))}</strong></div><div><small>DEF CUMULÉE</small><strong>${num(chosen.reduce((n,c)=>n+c.def,0))}</strong></div></div><small class="deck-summary-label">TES TYPES · ${types.length} / ${TYPES.length}</small><div class="deck-types">${types.map(t=>`<span style="--type-color:${COLORS[t]}">${TYPE_ICONS[t]} ${t}</span>`).join('')||'<span class="muted">Aucun type sélectionné</span>'}</div><p>Varie les types pour exploiter les faiblesses. Chaque carte garde ses deux capacités et son passif. Les soins et protections peuvent soutenir les alliés au combat.</p><button class="button" data-action="deck-duel" ${chosen.length!==6||locked?'disabled':''}>Lancer un duel ⚔</button><small class="deck-autosave">✓ Modifications sauvegardées automatiquement</small></aside></div><section id="deck-library"><div class="section-heading"><h2>Les cartes de ton cercle <span>${state.cards.filter(c=>c.owned>0).length} cartes possédées</span></h2><button class="text-link" data-view="boosters">Trouver de nouvelles cartes ↗</button></div><div class="filters"><input id="deck-search" type="search" value="${esc(deckQuery)}" placeholder="Rechercher une carte pour ton deck…" aria-label="Rechercher dans les cartes du deck"><select id="deck-type" aria-label="Filtrer les cartes du deck par type"><option>Tous les types</option>${TYPES.map(t=>`<option ${deckType===t?'selected':''}>${t}</option>`).join('')}<option ${deckType==='Inconnu'?'selected':''}>Inconnu</option></select></div><div class="card-grid collection-grid deck-library-grid">${owned.map(c=>{const selected=state.deck.includes(c.id),playable=isPlayable(c);return `<article class="deck-pick ${selected?'chosen':''} ${!playable?'unplayable':''}"><div class="deck-pick-status">${selected?'✓ DANS TON DECK':playable?`${c.owned} EXEMPLAIRE${c.owned>1?'S':''}`:'CARTE À COLLECTIONNER'}</div><button class="deck-card-preview" data-action="detail" data-id="${c.id}" aria-label="Voir la carte ${esc(c.name)}">${card(c)}</button><div class="card-meta"><span>${esc(c.name)}</span><span style="color:${RARITY_COLORS[c.rarity]||'#c8d4e3'}">${esc(c.rarity)}</span></div><button class="button ${selected?'secondary':''}" data-action="deck-toggle" data-id="${c.id}" ${!playable||locked?'disabled':''}>${!playable?'Statistiques inconnues':selected?'Retirer du deck −':'Ajouter au deck +'}</button></article>`;}).join('')||'<div class="empty">Aucune carte ne correspond à ta recherche.</div>'}</div></section>`;
}

function showBoosterCard(){
 const s=openingSession;if(!s?.revealed)return;
 const c=s.results[s.index];
 const finale=s.index===s.results.length-1;
 if(typeof gameSound!=='undefined')gameSound.play(finale?'finale':'reveal');
 const spectacle=finale?'<div class="finale-effects" aria-hidden="true"><div class="finale-nebula"></div><div class="finale-rays"></div><div class="finale-orbit"></div><div class="finale-particles">'+Array.from({length:40},(_,i)=>`<span style="--spark-angle:${i*137.508}deg;--spark-delay:-${(i*.37).toFixed(2)}s;--spark-duration:${3+(i%5)*.45}s;--spark-distance:${140+(i%7)*20}px;--spark-size:${i%4===0?9:3+(i%3)}px"><i></i></span>`).join('')+'</div></div>':'';
 showModal(`<section class="single-reveal ${finale?'finale-reveal':''}" style="--opening-color:${RARITY_COLORS[c.rarity]||'#c8d4e3'}">${spectacle}<div class="eyebrow">${esc(s.pack.name).toUpperCase()} · CARTE ${s.index+1} / ${s.results.length}</div><h2>${esc(c.name)}</h2><button class="reveal-card-button" data-action="next-pack-card" aria-label="${s.index===s.results.length-1?'Terminer l’ouverture':'Découvrir la carte suivante'}">${card(c)}</button><p class="revealed-rarity">✦ ${esc(c.rarity)}</p><button class="button" data-action="next-pack-card">${s.index===s.results.length-1?'Voir le récapitulatif →':'Carte suivante →'}</button><small>Clique sur la carte pour continuer.</small></section>`,finale?'booster-reveal-dialog finale-dialog':'booster-reveal-dialog');
}
function nextBoosterCard(){
 const s=openingSession;if(!s?.revealed||s.phase==='summary')return false;
 if(s.index<s.results.length-1){s.index++;showBoosterCard();}else showBoosterSummary();
 return true;
}

function sendDeckToReserve(id){if(isDeckLocked()){toast('Termine ou abandonne ton duel avant de modifier le deck.');return false;}if(!state.deck.includes(id))return false;state.deck=[...state.deck.filter(x=>x!==id),id];save();render();return true;}
