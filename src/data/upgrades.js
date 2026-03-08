(function(){
  'use strict';

  const G = window;

  G.UPGRADES = [
    {id:'power',    name:'TREBUCHET ARM',    desc:'Mightier launch force',                    icon:'⚔', sprite:'trebuchet_arm', base:15,  inc:0.9,   baseCost:24,  costMult:1.65},
    {id:'preview',  name:'WIZARD SIGHT',     desc:'Longer trajectory preview arc',            icon:'🔮', sprite:'wizard_sight',base:2,   inc:1.5,   baseCost:16,  costMult:1.3},
    {id:'friction', name:'IRON SABATONS',    desc:'Better grip upon the stonework',           icon:'🛡', sprite:'iron_sabatons', base:0.82,inc:-0.04, baseCost:20,  costMult:1.35},
    {id:'gravity',  name:'FEATHERFALL RUNE', desc:'Enchantment lightens thy burden',          icon:'✨', sprite:'featherfall_rune',base:0.40,inc:-0.02, baseCost:32,  costMult:1.5,  maxLvl:15},
    {id:'bounce',   name:'RUNED GAUNTLETS',  desc:'Rebound harder off castle walls',          icon:'💎', sprite:'runed_gauntlets',base:0.6, inc:0.08,  baseCost:16,  costMult:1.45},
    {id:'coinmag',  name:'GILDED AURA',      desc:'Gold is drawn to thee from afar',          icon:'⚜', sprite:'gilded_aura', base:14,  inc:6,     baseCost:12,  costMult:1.4},
    {id:'coinrate', name:'FORTUNE BLESSING', desc:'More gold coins float through the castle', icon:'🪙', sprite:'fortune_blessing',base:1.0, inc:0.4,   baseCost:20,  costMult:1.55},
    {id:'timeslow', name:'HOURGLASS RUNE',   desc:'Time slows while aiming — more ranks = slower & longer',
                                                                                               icon:'⏳', sprite:'hourglass_rune', base:0,   inc:1,     baseCost:28,  costMult:1.45, maxLvl:10},
    {id:'airbrake', name:'CAPE OF CONTROL',  desc:'Thy cloak steadies thine arc',             icon:'🧣', sprite:'cape_of_control',base:1.0, inc:-0.03, baseCost:16,  costMult:1.4},
    {id:'coinval',  name:'ROYAL TITHE',      desc:"Each coin bears the king's bounty",        icon:'👑', sprite:'royal_tithe',base:1,   inc:1,     baseCost:40,  costMult:1.75},
    {id:'maxhp',    name:'VITALITY OATH',    desc:'Gain an extra heart of health',            icon:'❤️', sprite:'vitality_oath',base:4,   inc:1,     baseCost:32,  costMult:1.55},
    {id:'fallres',  name:'IRONFLESH WARD',   desc:'Reduces fall damage taken',                icon:'🪨', sprite:'ironflesh_ward',base:0,   inc:0.15,  baseCost:22,  costMult:1.35},
    {id:'airjumps', name:'WINGED BOOTS',     desc:'Extra mid-air launches per flight',        icon:'🦅', sprite:'winged_boots',base:0,   inc:1,     baseCost:48,  costMult:1.9,  maxLvl:5},
    {id:'batradius',name:'WARDING SIGIL',    desc:'Bats cannot agro within a wider radius',   icon:'🔯', sprite:'warding_sigil',base:80,  inc:25,    baseCost:18,  costMult:1.3},
    {id:'heartrate',name:'BLESSED GROUNDS',  desc:'Hearts of healing appear more often',      icon:'💖', sprite:'blessed_grounds',base:0.04,inc:0.025, baseCost:24,  costMult:1.4},
    {id:'sporeres', name:'SPORE WARD',       desc:'Thy armor filters the toxic miasma longer',icon:'🍄', sprite:'spore_ward',base:70,  inc:25,    baseCost:20,  costMult:1.4},
    {id:'atkradius',name:'KEEN EDGE',        desc:'Widens thy sword strike reach',            icon:'🗡', sprite:'keen_edge', base:22,  inc:9,     baseCost:22,  costMult:1.5,  maxLvl:8},
    {id:'atkspeed', name:'BATTLE CADENCE',   desc:'Reduces time between strikes',             icon:'⚡', sprite:'battle_cadence',base:42,  inc:-4,    baseCost:28,  costMult:1.55, maxLvl:6},
    {id:'cp_up',    name:'CHECKPOINT BANNER (UP)',   desc:'Unlock upward checkpoints (every 1000 floors)',   icon:'▶', sprite:'checkpoint_up', base:0, inc:1, baseCost:1000, costMult:1.0},
    {id:'cp_down',  name:'CHECKPOINT BANNER (DOWN)', desc:'Unlock downward checkpoints (every 1000 floors)', icon:'◀', sprite:'checkpoint_down', base:0, inc:1, baseCost:1000, costMult:1.0},
  ];

  G.upgLevels = {};
  G.UPGRADES.forEach(u => G.upgLevels[u.id] = 0);
  G.totalCoins = 0;
  G.best = 0;
  G.lowest = 0;

  function upgById(id){ return G.UPGRADES.find(x => x.id === id); }

  G.upgVal = function(id){ const u = upgById(id); return u.base + G.upgLevels[id] * u.inc; };
  G.attackRadiusVal = function(){ return G.calcFinalStat ? G.calcFinalStat('attackRadius', G.upgVal('atkradius')) : G.upgVal('atkradius'); };
  G.attackCooldownVal = function(){ return G.calcFinalStat ? G.calcFinalStat('attackCooldownFrames', G.upgVal('atkspeed')) : Math.max(16, G.upgVal('atkspeed') | 0); };
  G.upgCost = function(id){
    const u = upgById(id);
    if(id === 'cp_up' || id === 'cp_down') return 1000 * (G.upgLevels[id] + 1);
    return Math.ceil(u.baseCost * Math.pow(u.costMult, G.upgLevels[id]));
  };
  G.upgSellPrice = function(id){
    const lvl = G.upgLevels[id];
    if(lvl <= 0) return 0;
    const u = upgById(id);
    return Math.floor(Math.ceil(u.baseCost * Math.pow(u.costMult, lvl - 1)) / 2);
  };
  G.checkpointTierReq = function(id, tier){
    const floors = tier * 1000;
    if(id === 'cp_up')   return {ok: G.best >= floors, need: floors, dir: 'up'};
    if(id === 'cp_down') return {ok: G.lowest <= -floors, need: floors, dir: 'down'};
    return {ok:true, need:0, dir:''};
  };
  G.maxHP = function(){ return G.calcFinalStat ? G.calcFinalStat('maxHp', G.upgVal('maxhp'), { multiplierKey:'maxHpMult' }) : (G.upgVal('maxhp') | 0); };
  G.maxAirJumps = function(){ return G.calcFinalStat ? G.calcFinalStat('airJumps', G.upgVal('airjumps')) : (G.upgVal('airjumps') | 0); };
  G.frictionVal = function(){ return Math.max(0.05, G.upgVal('friction')); };
  G.airbrakeVal = function(){ return Math.max(0.05, G.upgVal('airbrake')); };
  G.bounceVal = function(){ return Math.min(0.92, G.upgVal('bounce')); };
  G.gravVal = function(){ return Math.max(0.04, G.upgVal('gravity')); };
  G.batDifficultyScale = function(score){ return 1 + Math.min(2.5, Math.abs(score) / 4000); };
  G.batAgroRadius = function(){ return Math.min(G.upgVal('batradius'), G.H * 0.45); };
  G.heartSpawnRate = function(){ return G.upgVal('heartrate'); };
  G.sporeToleranceVal = function(){ return G.upgVal('sporeres'); };
  G.timeSlowScale = function(){
    const lvl = G.upgLevels['timeslow'];
    if(lvl <= 0) return 1.0;
    const slowPct = 0.25 + (lvl - 1) * 0.05;
    return Math.max(0.30, 1.0 - slowPct);
  };
  G.timeSlowDuration = function(){
    const lvl = G.upgLevels['timeslow'];
    if(lvl <= 0) return 0;
    return 60 + (lvl - 1) * 30;
  };
})();
