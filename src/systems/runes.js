(function(){
  'use strict';
  const G = window;

  function ensureRuneState(){
    G.runeLevels = G.runeLevels || {};
    Object.keys(G.RUNES || {}).forEach(id => {
      if(G.runeLevels[id] == null) G.runeLevels[id] = 0;
    });
  }

  function sumForKey(key){
    ensureRuneState();
    let total = 0;
    for(const [id, def] of Object.entries(G.RUNES || {})){
      const lvl = G.runeLevels[id] || 0;
      if(!lvl || !def.affects || def.affects[key] == null) continue;
      total += def.affects[key] * lvl;
    }
    return total;
  }

  function finalize(kind, value){
    if(kind === 'maxHp' || kind === 'heal' || kind === 'gold' || kind === 'airJumps') return Math.max(0, Math.round(value));
    if(kind === 'attackCooldownFrames') return Math.max(16, Math.round(value));
    if(kind === 'attackRadius') return Math.max(8, Math.round(value));
    if(kind === 'negateChance') return Math.max(0, Math.min(0.75, value));
    if(kind === 'damageReduction') return Math.max(0, Math.min(0.8, value));
    return value;
  }

  function calcFinalStat(kind, baseValue, opts){
    opts = opts || {};
    let value = baseValue;
    if(opts.multiplierKey) value *= 1 + sumForKey(opts.multiplierKey);
    if(opts.bonusKey) value += sumForKey(opts.bonusKey);
    if(typeof opts.transform === 'function') value = opts.transform(value);
    return finalize(kind, value);
  }

  G.ensureRuneState = ensureRuneState;
  G.getRuneLevel = function(id){ ensureRuneState(); return G.runeLevels[id] || 0; };
  G.getRuneBonus = function(key){ return sumForKey(key); };
  G.getRuneMultiplier = function(key){ return 1 + sumForKey(key); };
  G.getTotalRuneLevels = function(){ ensureRuneState(); return Object.values(G.runeLevels).reduce((a,b)=>a+(b||0),0); };
  G.finalizeCoreStat = finalize;
  G.calcFinalStat = calcFinalStat;

  G.maxHP = function(){
    const base = G.upgVal ? G.upgVal('maxhp') : 4;
    return calcFinalStat('maxHp', base, { multiplierKey:'maxHpMult' });
  };
  G.goldValue = function(base){
    const start = base == null ? ((G.upgVal ? G.upgVal('coinval') : 1) | 0) : base;
    return calcFinalStat('gold', start, { multiplierKey:'goldGainMult' });
  };
  G.healAmount = function(base){
    return calcFinalStat('heal', base == null ? 1 : base, { multiplierKey:'healAmountMult' });
  };
  G.getDamageReduction = function(){ return calcFinalStat('damageReduction', 0, { bonusKey:'damageReductionMult' }); };
  G.getDamageNegateChance = function(){ return calcFinalStat('negateChance', 0, { bonusKey:'negateChanceFlat' }); };
  G.grantRuneLevel = G.grantRune = function(id, amount){
    ensureRuneState();
    if(!G.RUNES || !G.RUNES[id]) return false;
    const def = G.RUNES[id];
    const cur = G.runeLevels[id] || 0;
    G.runeLevels[id] = Math.min(def.maxLevel || 999, cur + (amount || 1));
    if(typeof G.updateRuneUI === 'function') G.updateRuneUI();
    return true;
  };

  G.getRandomRuneId = function(){
    const ids = Object.keys(G.RUNES || {});
    if(!ids.length) return null;
    return ids[Math.floor(Math.random() * ids.length)];
  };
  G.grantRandomRune = function(){
    const id = G.getRandomRuneId();
    if(!id) return null;
    G.grantRune(id, 1);
    return id;
  };
  G.updateRuneUI = function(){
    const el = document.getElementById('runedisp');
    if(!el) return;
    const total = G.getTotalRuneLevels();
    el.textContent = 'RUNES: ' + total;
  };
  ensureRuneState();
})();
