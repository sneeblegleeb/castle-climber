(function(){
  'use strict';

  const G = window;

  const maxHP = (...args) => G.maxHP(...args);
  const syncSettingsUI = (...args) => G.syncSettingsUI(...args);
  const saveGame = (...args) => G.saveGame(...args);
  const renderShop = (...args) => G.renderShop(...args);
  const showGO = (...args) => G.showGO(...args);
  const checkpointTierReq = (...args) => G.checkpointTierReq(...args);
  const upgCost = (...args) => G.upgCost(...args);
  const upgSellPrice = (...args) => G.upgSellPrice(...args);
  const maxAirJumps = (...args) => G.maxAirJumps(...args);
  const iconEl = (sprite, fallback) => G.CastleIcons && G.CastleIcons.makeIconElement ? G.CastleIcons.makeIconElement({ sprite, fallback }) : null;

G.updateHeartsUI = function(pl){
  const mhp = pl.maxHp || maxHP();
  const cur  = pl.hp;
  const wrap = document.getElementById('hpbar-segments');
  if(!wrap) return;

  // Rebuild segments if count changed
  if(wrap.children.length !== mhp){
    wrap.innerHTML = '';
    for(let i = 0; i < mhp; i++){
      const seg = document.createElement('div');
      seg.className = 'hp-seg';
      wrap.appendChild(seg);
    }
  }

  // Update each segment
  const segs = wrap.querySelectorAll('.hp-seg');
  segs.forEach((seg, i) => {
    const filled = i < cur;
    seg.classList.toggle('filled', filled);
    // Pulse the last filled segment when only 1 HP left
    seg.classList.toggle('danger', filled && cur === 1 && i === 0);
  });
}

G.applyUIIcons = function(pausedState){
  const isPaused = pausedState == null ? G.paused : pausedState;
  if(G.CastleIcons && G.CastleIcons.applyButtonIcon){
    G.CastleIcons.applyButtonIcon('pausebtn', isPaused ? 'resume_button' : 'pause_button', isPaused ? '▶' : '⏸');
    G.CastleIcons.applyButtonIcon('attackbtn', 'attack_button', '⚔');
    G.CastleIcons.applyButtonIcon('cpupbtn', 'checkpoint_up', '▲');
    G.CastleIcons.applyButtonIcon('cpdownbtn', 'checkpoint_down', '▼');
  } else {
    const pauseBtn = document.getElementById('pausebtn');
    if(pauseBtn) pauseBtn.textContent = isPaused ? '▶' : '⏸';
  }
  const hpLabel = document.getElementById('hpbar-label');
  if(hpLabel && G.CastleIcons && G.CastleIcons.setLabeledIconText){
    G.CastleIcons.setLabeledIconText(hpLabel, 'heart', '❤', 'HP');
  }
  const coinDisp = document.getElementById('coindisp');
  if(coinDisp && G.CastleIcons && G.CastleIcons.setLabeledIconText){
    G.CastleIcons.setLabeledIconText(coinDisp, 'coin', '⚜', String(G.totalCoins));
  }
  const pauseCoins = document.getElementById('pause-coins');
  if(pauseCoins && G.CastleIcons && G.CastleIcons.setLabeledIconText){
    G.CastleIcons.setLabeledIconText(pauseCoins, 'coin', '⚜', `${G.totalCoins} gold available`);
  }
}

G.toggleSettings = function(){
  const menu=document.getElementById('settingsmenu');
  const willOpen=menu.style.display!=='block';
  if(willOpen){
    paused=true;
    timeScale=1.0; timeSlowTimer=0; drag=null;
    document.getElementById('pausemenu').style.display='none';
  document.getElementById('settingsmenu').style.display='none';
    G.applyUIIcons(true);
    syncSettingsUI();
    menu.style.display='block';
  } else {
    menu.style.display='none';
    paused=false;
    if(S && S.alive) G.applyUIIcons(false);
  }
}

// ── Shop / Pause ──────────────────────────────────────────────────────────────
G.togglePause = function(){
  if(!S.alive) return;
  paused=!paused;
  const btn=document.getElementById('pausebtn');
  document.getElementById('settingsmenu').style.display='none';
  if(paused){
    timeScale=1.0;timeSlowTimer=0;
    G.applyUIIcons(true);saveGame(S);
    if(G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(document.getElementById('pause-coins'), 'coin', '⚜', totalCoins+' gold available'); else document.getElementById('pause-coins').textContent='⚜ '+totalCoins+' gold available';
    renderShop('pause');
    document.getElementById('pausemenu').style.display='block';
  } else {
    G.applyUIIcons(false);
    document.getElementById('pausemenu').style.display='none';
    drag=null;
  }
}
G.dieAndShowGO = function(){
  paused=false;document.getElementById('pausemenu').style.display='none';document.getElementById('settingsmenu').style.display='none';
  G.applyUIIcons(false);
  S.alive=false;saveGame(null);showGO(S);
}
G.showGO = function(s){
  document.getElementById('pausebtn').style.display='none';
  document.getElementById('attackbtn').style.display='none';
  if(typeof setMobilePowerVisible==='function') setMobilePowerVisible(false);
  document.getElementById('go-title').textContent=s.pl.hp<=0?'💀 FALLEN 💀':'⚔ SLAIN ⚔';
  document.getElementById('go-stats').textContent='FLOOR: '+s.score+'   ⚜ '+s.session_coins+'   BEST: '+best+' / '+lowest;
  renderShop('go'); if(typeof updatePowerUI==='function') updatePowerUI(S); document.getElementById('go').style.display='block';
}

function appendSectionTitle(el, title){
  const p=document.createElement('p');
  p.className='shop-title';
  p.textContent=title;
  el.appendChild(p);
}


function appendRelicSlotControls(el, relicId){
  if(!G.getEquippedRelicSlots || !G.equipRelicToSlot) return;
  const row = document.createElement('div');
  row.className = 'upg';
  row.style.marginTop = '-6px';
  row.style.paddingTop = '8px';
  const slots = G.getEquippedRelicSlots();
  const editable = !(G.S && G.S.alive);
  const btns = [0,1,2].map(i => {
    const active = slots[i] === relicId;
    return `<button class="upg-btn${active?'':' sell-btn'}${editable?'':' cant'}" onclick="${editable ? `equipRelicToSlot('` + relicId + `',` + i + `)` : 'void(0)'}">SLOT ${i+1}${active?' ✓':''}</button>`;
  }).join('');
  const equippedAnywhere = slots.includes(relicId);
  const unequipClass = equippedAnywhere && editable ? '' : ' cant';
  const unequipAction = editable ? `clearRelicFromSlots('` + relicId + `')` : 'void(0)';
  const desc = editable
    ? 'Bind relic slots to 1, 2, 3 or controller X, Y, B between runs.'
    : 'Relic loadouts can only be changed between runs.';
  row.innerHTML = `<div class="upg-info"><div class="upg-desc">${desc}</div></div><div class="upg-btn-group">${btns}<button class="upg-btn sell-btn${unequipClass}" onclick="${unequipAction}">UNEQUIP</button></div>`;
  el.appendChild(row);
}

function appendUpgradeRow(el, which, u, level, cost, sellPrice, canBuy, canSell, buyFn, sellFn, extraClass=''){
  const capped=u.maxLvl!=null&&level>=u.maxLvl;
  const div=document.createElement('div');
  div.className='upg '+extraClass;
  const buyLabel=capped?'MAX':(canBuy?'⚜ '+cost:'🔒 '+cost);
  const rankLabel=capped
      ?`RANK ${level} <span style="color:#ffaa44">(MAX)</span>`
      :`RANK ${level}${u.maxLvl!=null?' / '+u.maxLvl:''}`;
  const sellLabel=canSell?`SELL +${sellPrice}`:'SELL';
  div.innerHTML=`
    <div class="upg-info">
      <div class="upg-name"></div>
      <div class="upg-desc">${u.desc}</div>
      <div class="upg-lvl">${rankLabel}</div>
    </div>
    <div class="upg-btn-group">
      <button class="upg-btn${canBuy?'':' cant'}" onclick="${buyFn}('${u.id}','${which}')">${buyLabel}</button>
      <button class="upg-btn sell-btn${canSell?'':' cant'}" onclick="${sellFn}('${u.id}','${which}')">${sellLabel}</button>
    </div>`;
  const nameEl = div.querySelector('.upg-name');
  const ic = iconEl(u.sprite || u.id, u.icon || '?');
  if(ic) nameEl.appendChild(ic);
  nameEl.appendChild(document.createTextNode(' ' + u.name));
  el.appendChild(div);
}

G.renderShop = function(which){
  const el=document.getElementById(which==='pause'?'upg-list-pause':'upg-list-go');
  el.innerHTML='';
  appendSectionTitle(el, '⚜ ROYAL UPGRADES ⚜');
  UPGRADES.forEach(u=>{
    const cost=upgCost(u.id),lvl=upgLevels[u.id];
    const capped=u.maxLvl!=null&&lvl>=u.maxLvl;
    const req=checkpointTierReq(u.id, lvl+1);
    const canBuy=!capped&&totalCoins>=cost&&req.ok;
    const sellPrice=upgSellPrice(u.id);
    const canSell=lvl>0;
    const divClass=(u.id==='cp_up'||u.id==='cp_down')?'checkpoint-upg':'';
    appendUpgradeRow(el, which, u, lvl, req&&req.ok?cost:(req.need||cost), sellPrice, canBuy, canSell, 'buyUpg', 'sellUpg', divClass);
  });

  appendSectionTitle(el, '⏳ ARTIFACT FORGES ⏳');
  (ARTIFACT_SHOP_UPGRADES||[]).forEach(u=>{
    const lvl=G.getArtifactUpgradeLevel(u.id), cost=G.getArtifactUpgCost(u.id), sellPrice=G.getArtifactUpgSellPrice(u.id);
    const capped=u.maxLvl!=null&&lvl>=u.maxLvl;
    const canBuy=!capped&&totalCoins>=cost;
    const canSell=lvl>0;
    appendUpgradeRow(el, which, u, lvl, cost, sellPrice, canBuy, canSell, 'buyArtifactUpg', 'sellArtifactUpg');
  });

  appendSectionTitle(el, '🛡 RELIC ALTAR 🛡');
  (RELIC_SHOP_UPGRADES||[]).forEach(u=>{
    const unlocked=G.isRelicUnlocked && G.isRelicUnlocked(u.id);
    const lvl=G.getRelicLevel(u.id), cost=G.getRelicUpgCost(u.id), sellPrice=G.getRelicUpgSellPrice(u.id);
    const capped=u.maxLvl!=null&&lvl>=u.maxLvl;
    const canBuy=unlocked&&!capped&&totalCoins>=cost;
    const canSell=unlocked&&lvl>0;
    const row={...u, desc: unlocked ? u.desc : 'Defeat the related boss once to unlock this relic.'};
    appendUpgradeRow(el, which, row, lvl, cost, sellPrice, canBuy, canSell, 'buyRelicUpg', 'sellRelicUpg');
    if(unlocked) appendRelicSlotControls(el, u.id);
  });
}

G.buyUpg = function(id,which){
  const u=UPGRADES.find(x=>x.id===id);
  if(u.maxLvl!=null&&upgLevels[id]>=u.maxLvl) return;
  const cost=upgCost(id);
  const req=checkpointTierReq(id, upgLevels[id]+1);
  if(!req.ok) return;
  if(totalCoins<cost) return;
  totalCoins-=cost;upgLevels[id]++;
  if(id==='maxhp'&&S&&S.alive){S.pl.maxHp=maxHP();S.pl.hp=Math.min(S.pl.hp+1,S.pl.maxHp);updateHeartsUI(S.pl);}
  if(id==='airjumps'&&S&&S.alive) S.pl.airJumpsLeft=Math.min(S.pl.airJumpsLeft+1,maxAirJumps());
  if(G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(document.getElementById('coindisp'), 'coin', '⚜', String(totalCoins)); else document.getElementById('coindisp').textContent='⚜ '+totalCoins;
  if(which==='pause'){ if(G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(document.getElementById('pause-coins'), 'coin', '⚜', totalCoins+' gold available'); else document.getElementById('pause-coins').textContent='⚜ '+totalCoins+' gold available'; }
  renderShop(which); if(typeof updatePowerUI==='function') updatePowerUI(S); saveGame(S&&S.alive?S:null);
}

G.sellUpg = function(id,which){
  if(upgLevels[id]<=0) return;
  const refund=upgSellPrice(id);
  upgLevels[id]--;
  totalCoins+=refund;
  if(id==='maxhp'&&S&&S.alive){ S.pl.maxHp=maxHP(); S.pl.hp=Math.min(S.pl.hp,S.pl.maxHp); updateHeartsUI(S.pl); }
  if(id==='airjumps'&&S&&S.alive){ S.pl.airJumpsLeft=Math.min(S.pl.airJumpsLeft,maxAirJumps()); }
  if(id==='timeslow'&&upgLevels['timeslow']<=0){ timeScale=1.0;timeSlowTimer=0; }
  if(G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(document.getElementById('coindisp'), 'coin', '⚜', String(totalCoins)); else document.getElementById('coindisp').textContent='⚜ '+totalCoins;
  if(which==='pause'){ if(G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(document.getElementById('pause-coins'), 'coin', '⚜', totalCoins+' gold available'); else document.getElementById('pause-coins').textContent='⚜ '+totalCoins+' gold available'; }
  renderShop(which);
  if(typeof updatePowerUI==='function') updatePowerUI(S);
  saveGame(S&&S.alive?S:null);
}


G.clearRelicFromSlots = function(relicId){
  if(G.S && G.S.alive) return;
  if(!G.getEquippedRelicSlots || !G.clearRelicSlot) return;
  const slots = G.getEquippedRelicSlots();
  slots.forEach((id, i) => { if(id === relicId) G.clearRelicSlot(i); });
  if(typeof G.renderShop === 'function'){
    if(document.getElementById('pausemenu').style.display === 'block') G.renderShop('pause');
    else G.renderShop('go');
  }
}
})();
