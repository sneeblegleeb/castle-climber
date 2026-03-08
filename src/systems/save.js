(function(){
  'use strict';

  const G = window;

  G.saveGame = function(s){
    try{
      localStorage.setItem(G.SAVE_KEY, JSON.stringify({
        upgLevels: G.upgLevels,
        totalCoins: G.totalCoins,
        best: G.best,
        lowest: G.lowest,
        selectedSkinId: G.selectedSkinId,
        bossesDefeated: G.bossesDefeated || {},
        runeLevels: G.runeLevels || {},
        unlockedRelics: G.unlockedRelics || [],
        equippedRelicSlots: G.equippedRelicSlots || [null, null, null],
        relicLevels: G.relicLevels || {},
        artifactUpgradeLevels: G.artifactUpgradeLevels || {},
        pos: s ? { x:s.pl.x, y:s.pl.y, hp:s.pl.hp } : null
      }));
    }catch(e){}
  };

  G.loadSave = function(){
    try{
      const raw = localStorage.getItem(G.SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
  };

  G.applyProgressionSave = function(save){
    if(!save) return;
    if(save.upgLevels){
      G.upgLevels = save.upgLevels;
      G.UPGRADES.forEach(u => { if(G.upgLevels[u.id] == null) G.upgLevels[u.id] = 0; });
    }
    if(save.totalCoins != null) G.totalCoins = save.totalCoins;
    if(save.best != null) G.best = save.best;
    if(save.lowest != null) G.lowest = save.lowest;
    if(save.selectedSkinId && G.SKINS && G.SKINS[save.selectedSkinId]) G.selectedSkinId = save.selectedSkinId;
    if(save.bossesDefeated) G.bossesDefeated = save.bossesDefeated;
    if(save.runeLevels) G.runeLevels = save.runeLevels;
    if(save.unlockedRelics) G.unlockedRelics = save.unlockedRelics;
    if(save.equippedRelicSlots) G.equippedRelicSlots = Array.isArray(save.equippedRelicSlots) ? save.equippedRelicSlots.slice(0,3) : [null, null, null];
    if(save.relicLevels) G.relicLevels = save.relicLevels;
    if(save.artifactUpgradeLevels) G.artifactUpgradeLevels = save.artifactUpgradeLevels;
    if(typeof G.ensureRuneState === 'function') G.ensureRuneState();
  };

  G.wipeSave = function(){
    localStorage.removeItem(G.SAVE_KEY);
    G.upgLevels = {};
    G.UPGRADES.forEach(u => G.upgLevels[u.id] = 0);
    G.totalCoins = 0;
    G.best = 0;
    G.lowest = 0;
    G.selectedSkinId = 'knight';
    G.bossesDefeated = {};
    G.runeLevels = {};
    G.unlockedRelics = [];
    G.equippedRelicSlots = [null, null, null];
    G.relicLevels = {};
    G.artifactUpgradeLevels = {};
    if(typeof G.ensureRuneState === 'function') G.ensureRuneState();
  };

  G.confirmWipe = function(){
    if(confirm('Wipe all progress? This cannot be undone.')){
      G.wipeSave();
      G.restart();
    }
  };
})();
