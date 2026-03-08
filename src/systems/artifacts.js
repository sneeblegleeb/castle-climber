(function(){
  'use strict';
  const G = window;

  function ensureProgress(){
    G.artifactUpgradeLevels = G.artifactUpgradeLevels || {};
    (G.ARTIFACT_SHOP_UPGRADES || []).forEach(u => {
      if(G.artifactUpgradeLevels[u.id] == null) G.artifactUpgradeLevels[u.id] = 0;
    });
  }

  function ensureRunState(s){
    if(!s) return;
    s.artifacts = s.artifacts || [];
    s.artifactCharges = s.artifactCharges || {};
    if(s.freezeTimer == null) s.freezeTimer = 0;
    if(s.spawnFreezeTimer == null) s.spawnFreezeTimer = 0;
  }

  G.getArtifactUpgradeLevel = function(id){ ensureProgress(); return G.artifactUpgradeLevels[id] || 0; };
  G.getArtifactUpgCost = function(id){
    ensureProgress();
    const u = (G.ARTIFACT_SHOP_UPGRADES || []).find(x=>x.id===id);
    if(!u) return 999999;
    return Math.ceil(u.baseCost * Math.pow(u.costMult, G.artifactUpgradeLevels[id] || 0));
  };
  G.getArtifactUpgSellPrice = function(id){
    const lvl = G.getArtifactUpgradeLevel(id);
    if(lvl <= 0) return 0;
    const u = (G.ARTIFACT_SHOP_UPGRADES || []).find(x=>x.id===id);
    return Math.floor(Math.ceil(u.baseCost * Math.pow(u.costMult, lvl - 1)) / 2);
  };
  G.getChronosDuration = function(){
    const lvl = G.getArtifactUpgradeLevel('chronos_seal');
    const base = (G.ARTIFACTS && G.ARTIFACTS.chronos_seal ? G.ARTIFACTS.chronos_seal.baseDuration : 180);
    return base + lvl * 30;
  };
  G.getChronosStartingCharges = function(){
    const lvl = G.getArtifactUpgradeLevel('chronos_seal');
    const base = (G.ARTIFACTS && G.ARTIFACTS.chronos_seal ? G.ARTIFACTS.chronos_seal.baseCharges : 1);
    return base + Math.floor(lvl / 3);
  };
  G.getHeldArtifactId = function(s){ ensureRunState(s); return s && s.artifacts && s.artifacts[0] || null; };
  G.grantArtifact = function(s, id, charges){
    ensureProgress(); ensureRunState(s);
    const def = G.ARTIFACTS && G.ARTIFACTS[id];
    if(!def) return false;
    const gain = charges != null ? charges : (id === 'chronos_seal' ? G.getChronosStartingCharges() : (def.baseCharges || 1));
    const prev = G.getHeldArtifactId(s);
    s.artifacts = [id];
    s.artifactCharges = { [id]: gain };
    if(typeof G.addFloat === 'function' && s.pl){
      const replaced = prev && prev !== id ? ` (REPLACED ${((G.ARTIFACTS||{})[prev]||{}).name || prev})` : '';
      G.addFloat(s.pl.x, s.pl.y - s.cam - 16, `${def.icon || '?'} ${def.name.toUpperCase()}${replaced}`, '#99ddff');
    }
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
    return true;
  };
  G.useArtifact = function(s, id){
    ensureRunState(s);
    if(!s || !s.alive) return false;
    if(!id) id = G.getHeldArtifactId(s);
    if(!id) return false;
    if((s.artifactCharges[id] || 0) <= 0) return false;
    if(id === 'chronos_seal'){
      const dur = G.getChronosDuration();
      s.freezeTimer = Math.max(s.freezeTimer || 0, dur);
      s.spawnFreezeTimer = Math.max(s.spawnFreezeTimer || 0, dur);
      s.artifactCharges[id]--;
      if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 26, '⏳ CHRONOS!', '#99ddff');
      if(s.artifactCharges[id] <= 0){
        s.artifactCharges = {};
        s.artifacts = [];
      }
      if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
      return true;
    }
    return false;
  };
  G.updateArtifacts = function(s){
    ensureRunState(s);
    if(s.freezeTimer > 0) s.freezeTimer--;
    if(s.spawnFreezeTimer > 0) s.spawnFreezeTimer--;
  };
  G.buyArtifactUpg = function(id, which){
    ensureProgress();
    const u = (G.ARTIFACT_SHOP_UPGRADES || []).find(x=>x.id===id);
    if(!u) return;
    const lvl = G.artifactUpgradeLevels[id] || 0;
    if(u.maxLvl != null && lvl >= u.maxLvl) return;
    const cost = G.getArtifactUpgCost(id);
    if(G.totalCoins < cost) return;
    G.totalCoins -= cost;
    G.artifactUpgradeLevels[id] = lvl + 1;
    const coinDisp = document.getElementById('coindisp');
    if(coinDisp && G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(coinDisp, 'coin', '⚜', String(G.totalCoins));
    else if(coinDisp) coinDisp.textContent = '⚜ ' + G.totalCoins;
    if(which && typeof G.renderShop === 'function') G.renderShop(which);
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
    G.saveGame(G.S && G.S.alive ? G.S : null);
  };
  G.sellArtifactUpg = function(id, which){
    ensureProgress();
    const lvl = G.artifactUpgradeLevels[id] || 0;
    if(lvl <= 0) return;
    const refund = G.getArtifactUpgSellPrice(id);
    G.artifactUpgradeLevels[id] = lvl - 1;
    G.totalCoins += refund;
    const coinDisp = document.getElementById('coindisp');
    if(coinDisp && G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(coinDisp, 'coin', '⚜', String(G.totalCoins));
    else if(coinDisp) coinDisp.textContent = '⚜ ' + G.totalCoins;
    if(which && typeof G.renderShop === 'function') G.renderShop(which);
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
    G.saveGame(G.S && G.S.alive ? G.S : null);
  };
  G.getArtifactHudText = function(s){
    ensureRunState(s);
    const id = G.getHeldArtifactId(s);
    if(!id) return 'ARTIFACT [Q]: —';
    const def = G.ARTIFACTS[id];
    return `ARTIFACT [Q]: ${def ? def.icon : '?'} ${def ? def.name.toUpperCase() : id} x${s.artifactCharges[id] || 0}`;
  };
  ensureProgress();
})();
