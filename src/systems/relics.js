(function(){
  'use strict';
  const G = window;

  function normalizeSlots(slots){
    const out = Array.isArray(slots) ? slots.slice(0, 3) : [];
    while(out.length < 3) out.push(null);
    return out.map(id => (id && G.RELICS && G.RELICS[id]) ? id : null);
  }

  function ensureProgress(){
    G.unlockedRelics = G.unlockedRelics || [];
    G.equippedRelicSlots = normalizeSlots(G.equippedRelicSlots || [null, null, null]);
    G.relicLevels = G.relicLevels || {};
    (G.RELIC_SHOP_UPGRADES || []).forEach(u => {
      if(G.relicLevels[u.id] == null) G.relicLevels[u.id] = 0;
    });
  }

  function ensureRunState(s){
    if(!s) return;
    s.activeRelics = s.activeRelics || {};
    s.relicShockwaves = s.relicShockwaves || [];
    if(!s.pendingRelicAim) s.pendingRelicAim = null;
    if(!s.vinePull) s.vinePull = null;
  }

  function getEquippedRelicIds(){
    ensureProgress();
    return [...new Set((G.equippedRelicSlots || []).filter(Boolean))];
  }

  function refreshRunRelicState(s){
    ensureProgress(); ensureRunState(s);
    const wanted = new Set(getEquippedRelicIds());
    Object.keys(s.activeRelics).forEach(id => { if(!wanted.has(id)) delete s.activeRelics[id]; });

    if(wanted.has('divine_shield')){
      const max = G.getDivineShieldMaxCharges();
      const cur = s.activeRelics.divine_shield;
      s.activeRelics.divine_shield = cur ? {
        charges: Math.min(cur.charges, max),
        maxCharges: max,
        regenTimer: cur.regenTimer || 0
      } : {
        charges: max,
        maxCharges: max,
        regenTimer: 0
      };
    }

    if(wanted.has('hallowed_resonator')){
      const cur = s.activeRelics.hallowed_resonator || {};
      s.activeRelics.hallowed_resonator = {
        cooldown: Math.max(0, cur.cooldown || 0),
        readyPulse: cur.readyPulse || 0
      };
    }

    if(wanted.has('eldritch_vine')){
      const cur = s.activeRelics.eldritch_vine || {};
      s.activeRelics.eldritch_vine = {
        cooldown: Math.max(0, cur.cooldown || 0),
        readyPulse: cur.readyPulse || 0
      };
    }
  }

  function makeShockwave(s, dx, dy){
    const d = Math.hypot(dx, dy) || 1;
    return {
      x: s.pl.x,
      y: s.pl.y,
      dx: dx / d,
      dy: dy / d,
      dist: 0,
      speed: G.getResonatorSpeed(),
      maxDist: G.getResonatorRange(),
      width: G.getResonatorWidth(),
      hitIds: {}
    };
  }

  function startTimeSlow(scale, frames){
    const curScale = (typeof G.timeScale === 'number' && isFinite(G.timeScale)) ? G.timeScale : 1;
    G.timeScale = Math.min(curScale, scale);
    G.timeSlowTimer = Math.max(G.timeSlowTimer || 0, Math.ceil(frames || 0));
  }

  function clearPendingAim(s){
    if(!s) return;
    s.pendingRelicAim = null;
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
  }

  function damageTargetsAlongWave(s, wave){
    const head = wave.dist;
    const halfW = wave.width;
    const addFloat = G.addFloat || function(){};

    function canHit(id){ return !wave.hitIds[id]; }
    function markHit(id){ wave.hitIds[id] = 1; }
    function testPoint(id, x, y, onHit){
      if(!canHit(id)) return;
      const rx = x - wave.x, ry = y - wave.y;
      const proj = rx * wave.dx + ry * wave.dy;
      if(proj < 0 || proj > head) return;
      const perp = Math.abs(rx * wave.dy - ry * wave.dx);
      if(perp > halfW) return;
      markHit(id);
      onHit && onHit();
    }

    (s.bats || []).forEach((bt, i) => {
      if(!bt || bt.state === 'dead') return;
      testPoint('bat_' + i, bt.x, bt.wy, () => {
        bt.hp = Math.max(0, (bt.hp || 1) - 1);
        bt.hurtTimer = 40;
        const ddx = bt.x - s.pl.x, ddy = bt.wy - s.pl.y;
        const dist = Math.hypot(ddx, ddy) || 1;
        if(bt.hp <= 0){
          bt.state = 'dead';
          bt.deadVX = (ddx / dist) * 4.0;
          bt.deadVY = -2.2;
          addFloat(bt.x, bt.wy - s.cam - 16, '📯 PURGED!', '#d8d1ff');
        } else {
          bt.state = 'retreating';
          bt.retreatTimer = 90;
          bt.dvx = (ddx / dist) * 4.5;
          bt.dvy = -2.0;
          addFloat(bt.x, bt.wy - s.cam - 12, '✦ 1', '#d8d1ff');
        }
      });
    });

    (s.plants || []).forEach((plant, i) => {
      if(!plant || plant.severed) return;
      testPoint('plant_' + i, plant.headX, plant.headY, () => {
        const ddx = plant.headX - s.pl.x, ddy = plant.headY - s.pl.y;
        const dist = Math.hypot(ddx, ddy) || 1;
        plant.hp = Math.max(0, (plant.hp || 1) - 1);
        plant.hurtCooldown = 55;
        if(plant.hp <= 0){
          plant.severed = true;
          plant.headVX = (ddx / dist) * 5;
          plant.headVY = (ddy / dist) * 5 - 2.5;
          plant.headSpin = (Math.random()-0.5) * 0.22;
          addFloat(plant.headX, plant.headY - s.cam - 16, '📯 SEVERED!', '#b6ffb6');
        } else {
          plant.headVX += (ddx / dist) * 6;
          plant.headVY += (ddy / dist) * 6;
          addFloat(plant.headX, plant.headY - s.cam - 12, '✦ 1', '#b6ffb6');
        }
      });
    });

    (s.mushrooms || []).forEach((m, i) => {
      if(!m || m.dead) return;
      testPoint('mush_' + i, m.x, m.y, () => {
        m.hp = Math.max(0, (m.hp || 1) - 1);
        if(m.hp <= 0){
          m.dead = true;
          m.cloud = null;
          const burstDur = (typeof G.BURST_CLOUD_DURATION === 'number' && isFinite(G.BURST_CLOUD_DURATION)) ? G.BURST_CLOUD_DURATION : 400;
          m.burstCloud = { timer: burstDur, maxTimer: burstDur };
          addFloat(m.x, m.y - s.cam - 18, '📯 BURST!', '#88ff44');
        } else {
          addFloat(m.x, m.y - s.cam - 12, '✦ 1', '#d9ffd0');
        }
      });
    });

    (s.slimes || []).forEach((sl, i) => {
      if(!sl || sl.dead) return;
      testPoint('slime_' + i, sl.x, sl.y - 7, () => {
        const ddx = sl.x - s.pl.x, ddy = (sl.y - 7) - s.pl.y;
        const dist = Math.hypot(ddx, ddy) || 1;
        sl.hp = Math.max(0, (sl.hp || 1) - 1);
        sl.hurtTimer = 45;
        if(sl.hp <= 0){
          sl.dead = true;
          sl.deadTimer = 0;
          sl.vx = (ddx / dist) * 3.5;
          sl.vy = -1.2;
          addFloat(sl.x, sl.y - 7 - s.cam - 14, '📯 SPLAT!', `hsl(${sl.hue},90%,72%)`);
        } else {
          sl.vx = (ddx / dist) * 4.0;
          sl.vy = -2.0;
          sl.onGround = false;
          addFloat(sl.x, sl.y - 7 - s.cam - 12, '✦ 1', `hsl(${sl.hue},90%,78%)`);
        }
      });
    });

    const boss = s.activeBoss;
    if(boss && boss.active && !boss.dead){
      testPoint('boss_' + boss.id, boss.x, boss.y + 4, () => {
        boss.hp = Math.max(0, boss.hp - 1);
        boss.hurtTimer = 10;
        boss.vx += wave.dx * 0.7;
        boss.vy += wave.dy * 0.4;
        addFloat(boss.x, boss.y - s.cam - 18, boss.hp > 0 ? '📯 SONIC HIT!' : '📯 BOSS BROKEN!', '#ffccff');
      });
    }
  }

  G.getRelicLevel = function(id){ ensureProgress(); return G.relicLevels[id] || 0; };
  G.getRelicUpgCost = function(id){
    ensureProgress();
    const u = (G.RELIC_SHOP_UPGRADES || []).find(x=>x.id===id);
    if(!u) return 999999;
    return Math.ceil(u.baseCost * Math.pow(u.costMult, G.relicLevels[id] || 0));
  };
  G.getRelicUpgSellPrice = function(id){
    const lvl = G.getRelicLevel(id);
    if(lvl <= 0) return 0;
    const u = (G.RELIC_SHOP_UPGRADES || []).find(x=>x.id===id);
    return Math.floor(Math.ceil(u.baseCost * Math.pow(u.costMult, lvl - 1)) / 2);
  };
  G.isRelicUnlocked = function(id){ ensureProgress(); return G.unlockedRelics.includes(id); };
  G.unlockRelic = function(id, opts){
    ensureProgress();
    if(!G.RELICS || !G.RELICS[id]) return false;
    if(!G.unlockedRelics.includes(id)) G.unlockedRelics.push(id);
    if(opts && opts.grantLevelOne && (G.relicLevels[id] || 0) < 1) G.relicLevels[id] = 1;
    if(!(G.equippedRelicSlots || []).includes(id)){
      const empty = G.equippedRelicSlots.findIndex(v => !v);
      if(empty >= 0){
        G.equippedRelicSlots = normalizeSlots(G.equippedRelicSlots);
        G.equippedRelicSlots[empty] = id;
        if(G.S && G.S.alive) refreshRunRelicState(G.S);
        if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
        if(typeof G.saveGame === 'function') G.saveGame(G.S && G.S.alive ? G.S : null);
      }
    }
    return true;
  };
  G.equipRelicToSlot = function(id, slotIndex){
    ensureProgress();
    if(G.S && G.S.alive) return false;
    slotIndex = Math.max(0, Math.min(2, slotIndex|0));
    if(id && !G.isRelicUnlocked(id)) return false;
    G.equippedRelicSlots = normalizeSlots(G.equippedRelicSlots);
    G.equippedRelicSlots[slotIndex] = id || null;
    if(G.S && G.S.alive) refreshRunRelicState(G.S);
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
    G.saveGame(G.S && G.S.alive ? G.S : null);
    return true;
  };
  G.clearRelicSlot = function(slotIndex){ return G.equipRelicToSlot(null, slotIndex); };
  G.getEquippedRelicInSlot = function(slotIndex){ ensureProgress(); return normalizeSlots(G.equippedRelicSlots)[slotIndex|0] || null; };
  G.getEquippedRelicSlots = function(){ ensureProgress(); return normalizeSlots(G.equippedRelicSlots); };

  G.getDivineShieldMaxCharges = function(){
    const lvl = G.getRelicLevel('divine_shield');
    const base = (G.RELICS && G.RELICS.divine_shield ? G.RELICS.divine_shield.baseCharges : 3);
    return base + Math.floor(lvl / 3);
  };
  G.getDivineShieldRegenFrames = function(){
    const lvl = G.getRelicLevel('divine_shield');
    const base = (G.RELICS && G.RELICS.divine_shield ? G.RELICS.divine_shield.baseRegenFrames : 480);
    return Math.max(120, base - lvl * 18);
  };

  G.getResonatorCooldownFrames = function(){
    const lvl = G.getRelicLevel('hallowed_resonator');
    const base = (G.RELICS && G.RELICS.hallowed_resonator ? G.RELICS.hallowed_resonator.baseCooldownFrames : 600);
    return Math.max(180, base - lvl * 18);
  };
  G.getResonatorWidth = function(){
    const lvl = G.getRelicLevel('hallowed_resonator');
    const base = (G.RELICS && G.RELICS.hallowed_resonator ? G.RELICS.hallowed_resonator.baseWidth : 18);
    return base + lvl * 1.5;
  };
  G.getResonatorRange = function(){
    const lvl = G.getRelicLevel('hallowed_resonator');
    const base = (G.RELICS && G.RELICS.hallowed_resonator ? G.RELICS.hallowed_resonator.baseRange : 320);
    return base + lvl * 10;
  };
  G.getResonatorSpeed = function(){
    const lvl = G.getRelicLevel('hallowed_resonator');
    const base = (G.RELICS && G.RELICS.hallowed_resonator ? G.RELICS.hallowed_resonator.baseSpeed : 9.5);
    return base + lvl * 0.15;
  };

  G.getEldritchVineCooldownFrames = function(){
    const lvl = G.getRelicLevel('eldritch_vine');
    const base = (G.RELICS && G.RELICS.eldritch_vine ? G.RELICS.eldritch_vine.baseCooldownFrames : 720);
    return Math.max(240, base - lvl * 24);
  };
  G.getEldritchVineSlowFrames = function(){
    const lvl = G.getRelicLevel('eldritch_vine');
    const base = (G.RELICS && G.RELICS.eldritch_vine ? G.RELICS.eldritch_vine.baseSlowFrames : 180);
    return base + lvl * 6;
  };
  G.getEldritchVineSlowScale = function(){
    const lvl = G.getRelicLevel('eldritch_vine');
    const base = (G.RELICS && G.RELICS.eldritch_vine ? G.RELICS.eldritch_vine.baseSlowScale : 0.25);
    return Math.max(0.15, base - lvl * 0.005);
  };
  G.getEldritchVinePullSpeed = function(){
    const lvl = G.getRelicLevel('eldritch_vine');
    const base = (G.RELICS && G.RELICS.eldritch_vine ? G.RELICS.eldritch_vine.basePullSpeed : 14);
    return base + lvl * 0.7;
  };

  G.initRelicsForRun = function(s){ refreshRunRelicState(s); };

  G.updateRelics = function(s){
    refreshRunRelicState(s);

    const sh = s.activeRelics.divine_shield;
    if(sh){
      sh.maxCharges = G.getDivineShieldMaxCharges();
      if(sh.charges < sh.maxCharges){
        sh.regenTimer++;
        if(sh.regenTimer >= G.getDivineShieldRegenFrames()){
          sh.regenTimer = 0;
          sh.charges = Math.min(sh.maxCharges, sh.charges + 1);
          if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 34, '🛡 REFORMED', '#99ccff');
        }
      } else {
        sh.regenTimer = 0;
      }
    }

    const hr = s.activeRelics.hallowed_resonator;
    if(hr){
      if(hr.cooldown > 0) hr.cooldown--;
      else hr.readyPulse = (hr.readyPulse + 1) % 60;
    }

    const vine = s.activeRelics.eldritch_vine;
    if(vine){
      if(vine.cooldown > 0) vine.cooldown--;
      else vine.readyPulse = (vine.readyPulse + 1) % 60;
    }

    if(s.pendingRelicAim && s.pendingRelicAim.timer != null){
      s.pendingRelicAim.timer--;
      if(s.pendingRelicAim.timer <= 0){
        const relicId = s.pendingRelicAim.relicId;
        clearPendingAim(s);
        if(typeof G.addFloat === 'function' && relicId === 'eldritch_vine'){
          G.addFloat(s.pl.x, s.pl.y - s.cam - 28, '🌿 VINE FIZZLED', '#9fe38d');
        }
      }
    }

    s.relicShockwaves = (s.relicShockwaves || []).filter(w => {
      w.dist += w.speed;
      damageTargetsAlongWave(s, w);
      return w.dist <= w.maxDist;
    });
  };

  G.applyRelicPlayerMotion = function(s, ts){
    ensureRunState(s);
    const pull = s.vinePull;
    const pl = s && s.pl;
    if(!pull || !pl) return false;

    const dx = pull.targetX - pl.x;
    const dy = pull.targetY - pl.y;
    const dist = Math.hypot(dx, dy) || 0;
    const step = Math.max(6, pull.speed) * (ts || 1);

    pull.linePulse = (pull.linePulse || 0) + 0.2 * (ts || 1);
    pl.vx = 0;
    pl.vy = 0;
    pl.onG = false;
    pl.coyote = 0;
    pl.vineNoClip = 1;

    if(dist <= step || dist <= 10){
      pl.x = pull.targetX;
      pl.y = pull.targetY;
      pl.vx = 0;
      pl.vy = 0;
      pl.vineNoClip = 0;
      s.vinePull = null;
      return true;
    }

    pl.x += (dx / dist) * step;
    pl.y += (dy / dist) * step;
    pl.x = Math.max(G.WALL + pl.w * 0.5, Math.min(G.W - G.WALL - pl.w * 0.5, pl.x));
    return true;
  };

  G.fireHallowedResonator = function(s, dx, dy){
    ensureRunState(s);
    const hr = s.activeRelics.hallowed_resonator;
    if(!hr || hr.cooldown > 0) return false;
    if(Math.hypot(dx, dy) < 0.25) return false;
    s.relicShockwaves.push(makeShockwave(s, dx, dy));
    clearPendingAim(s);
    hr.cooldown = G.getResonatorCooldownFrames();
    hr.readyPulse = 0;
    if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 28, '📯 RESONATE!', '#d8d1ff');
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
    return true;
  };

  G.fireEldritchVine = function(s, screenX, screenY){
    ensureRunState(s);
    const vine = s.activeRelics.eldritch_vine;
    if(!vine || vine.cooldown > 0) return false;
    const worldX = Math.max(G.WALL + 10, Math.min(G.W - G.WALL - 10, screenX));
    const worldY = screenY + s.cam;
    const dx = worldX - s.pl.x;
    const dy = worldY - s.pl.y;
    if(Math.hypot(dx, dy) < 14) return false;

    s.vinePull = {
      targetX: worldX,
      targetY: worldY,
      speed: G.getEldritchVinePullSpeed(),
      linePulse: 0
    };
    s.pl.vx = 0;
    s.pl.vy = 0;
    s.pl.onG = false;
    s.pl.coyote = 0;
    s.pl.vineNoClip = 1;
    clearPendingAim(s);
    vine.cooldown = G.getEldritchVineCooldownFrames();
    vine.readyPulse = 0;
    if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 28, '🌿 VINE LASH!', '#9fe38d');
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
    return true;
  };

  G.armRelicAim = function(s, slotIndex, relicId){
    ensureRunState(s);
    const id = relicId || 'hallowed_resonator';
    const aim = { slotIndex: slotIndex|0, relicId: id };
    if(id === 'eldritch_vine') aim.timer = G.getEldritchVineSlowFrames();
    s.pendingRelicAim = aim;
    if(id === 'eldritch_vine'){
      startTimeSlow(G.getEldritchVineSlowScale(), G.getEldritchVineSlowFrames());
      if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 28, '🌿 CLICK TO GRAPPLE', '#9fe38d');
    } else if(typeof G.addFloat === 'function') {
      G.addFloat(s.pl.x, s.pl.y - s.cam - 28, '📯 CHOOSE A DIRECTION', '#d8d1ff');
    }
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
    return true;
  };

  G.tryRelicPointerFire = function(s, x, y){
    ensureRunState(s);
    if(!s.pendingRelicAim) return false;
    if(s.pendingRelicAim.relicId === 'hallowed_resonator'){
      const screenPos = (typeof G.getPlayerScreenPos === 'function') ? G.getPlayerScreenPos() : { x: s.pl.x, y: s.pl.y - s.cam };
      return G.fireHallowedResonator(s, x - screenPos.x, y - screenPos.y);
    }
    if(s.pendingRelicAim.relicId === 'eldritch_vine'){
      return G.fireEldritchVine(s, x, y);
    }
    return false;
  };

  G.tryRelicDirectionalFire = function(s, dx, dy){
    ensureRunState(s);
    if(!s.pendingRelicAim || Math.hypot(dx, dy) < 0.25) return false;
    if(s.pendingRelicAim.relicId === 'hallowed_resonator') return G.fireHallowedResonator(s, dx, dy);
    if(s.pendingRelicAim.relicId === 'eldritch_vine'){
      const d = Math.hypot(dx, dy) || 1;
      const start = (typeof G.getPlayerScreenPos === 'function') ? G.getPlayerScreenPos() : { x: s.pl.x, y: s.pl.y - s.cam };
      const pullDist = 220;
      return G.fireEldritchVine(s, start.x + (dx / d) * pullDist, start.y + (dy / d) * pullDist);
    }
    return false;
  };

  G.useRelicSlot = function(s, slotIndex){
    ensureProgress(); ensureRunState(s);
    const id = G.getEquippedRelicInSlot(slotIndex|0);
    if(!id) return false;
    const def = G.RELICS && G.RELICS[id];

    if(id === 'hallowed_resonator'){
      const hr = s.activeRelics.hallowed_resonator;
      if(!hr) return false;
      if(hr.cooldown > 0){
        if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 28, `📯 ${Math.ceil(hr.cooldown / 60)}s`, '#d8d1ff');
        return false;
      }
      return G.armRelicAim(s, slotIndex|0, 'hallowed_resonator');
    }

    if(id === 'eldritch_vine'){
      const vine = s.activeRelics.eldritch_vine;
      if(!vine) return false;
      if(vine.cooldown > 0){
        if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 28, `🌿 ${Math.ceil(vine.cooldown / 60)}s`, '#9fe38d');
        return false;
      }
      return G.armRelicAim(s, slotIndex|0, 'eldritch_vine');
    }

    if(def && typeof def.onUse === 'function') return !!def.onUse(s, slotIndex|0);
    if(typeof G.addFloat === 'function' && s && s.pl){
      G.addFloat(s.pl.x, s.pl.y - s.cam - 28, `${def ? def.icon : '✦'} ${def ? def.name.toUpperCase() : id} PASSIVE`, '#c7d9ff');
    }
    return false;
  };

  G.tryRelicAbsorbHit = function(s, label){
    ensureRunState(s);
    const sh = s.activeRelics.divine_shield;
    if(sh && sh.charges > 0){
      sh.charges--;
      sh.regenTimer = 0;
      if(typeof G.addFloat === 'function') G.addFloat(s.pl.x, s.pl.y - s.cam - 20, label || '🛡 BLOCK!', '#99ccff');
      if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
      return true;
    }
    return false;
  };

  G.buyRelicUpg = function(id, which){
    ensureProgress();
    if(!G.isRelicUnlocked(id)) return;
    const u = (G.RELIC_SHOP_UPGRADES || []).find(x=>x.id===id);
    if(!u) return;
    const lvl = G.relicLevels[id] || 0;
    if(u.maxLvl != null && lvl >= u.maxLvl) return;
    const cost = G.getRelicUpgCost(id);
    if(G.totalCoins < cost) return;
    G.totalCoins -= cost;
    G.relicLevels[id] = lvl + 1;
    const coinDisp = document.getElementById('coindisp');
    if(coinDisp && G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(coinDisp, 'coin', '⚜', String(G.totalCoins));
    else if(coinDisp) coinDisp.textContent = '⚜ ' + G.totalCoins;
    if(G.S && G.S.alive) refreshRunRelicState(G.S);
    if(which && typeof G.renderShop === 'function') G.renderShop(which);
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
    G.saveGame(G.S && G.S.alive ? G.S : null);
  };

  G.sellRelicUpg = function(id, which){
    ensureProgress();
    const lvl = G.relicLevels[id] || 0;
    if(lvl <= 0) return;
    const refund = G.getRelicUpgSellPrice(id);
    G.relicLevels[id] = lvl - 1;
    G.totalCoins += refund;
    const coinDisp = document.getElementById('coindisp');
    if(coinDisp && G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(coinDisp, 'coin', '⚜', String(G.totalCoins));
    else if(coinDisp) coinDisp.textContent = '⚜ ' + G.totalCoins;
    if(G.S && G.S.alive) refreshRunRelicState(G.S);
    if(which && typeof G.renderShop === 'function') G.renderShop(which);
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
    G.saveGame(G.S && G.S.alive ? G.S : null);
  };

  G.drawRelicFx = function(ctx, s){
    ensureRunState(s);

    (s.relicShockwaves || []).forEach(w => {
      const px = w.x, py = w.y - s.cam;
      const steps = Math.max(6, Math.floor(w.dist / 14));
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(220,205,255,0.75)';
      for(let i = 1; i <= steps; i++){
        const t = i / steps;
        const cx = px + w.dx * w.dist * t;
        const cy = py + w.dy * w.dist * t;
        const rad = 3 + t * (w.width * 0.6);
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    if(s.vinePull && s.pl){
      const pull = s.vinePull;
      const sx = s.pl.x, sy = s.pl.y - s.cam;
      const tx = pull.targetX, ty = pull.targetY - s.cam;
      ctx.save();
      ctx.strokeStyle = 'rgba(130,255,120,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(220,255,200,0.95)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(180,255,150,0.9)';
      ctx.beginPath();
      ctx.arc(tx, ty, 8 + Math.sin(pull.linePulse || 0) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if(s.pendingRelicAim && s.pl){
      const isVine = s.pendingRelicAim.relicId === 'eldritch_vine';
      ctx.save();
      ctx.strokeStyle = isVine ? 'rgba(170,255,140,0.82)' : 'rgba(220,205,255,0.75)';
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      ctx.arc(s.pl.x, s.pl.y - s.cam, 24 + (s.tick % 30), 0, Math.PI * 2);
      ctx.stroke();
      if(isVine){
        ctx.beginPath();
        ctx.arc(s.pl.x, s.pl.y - s.cam, 56, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  G.getRelicHudText = function(s){
    ensureProgress(); ensureRunState(s);
    const slots = G.getEquippedRelicSlots();
    const parts = slots.map((id, i) => {
      const def = id && G.RELICS && G.RELICS[id];
      if(!id || !def) return `[${i+1}] —`;
      if(id === 'divine_shield'){
        const sh = s && s.activeRelics && s.activeRelics.divine_shield;
        return `[${i+1}] ${def.icon} ${sh ? sh.charges + '/' + sh.maxCharges : '—'}`;
      }
      if(id === 'hallowed_resonator'){
        const hr = s && s.activeRelics && s.activeRelics.hallowed_resonator;
        const aimingThis = !!(s.pendingRelicAim && s.pendingRelicAim.relicId === 'hallowed_resonator');
        const label = hr && hr.cooldown > 0 ? Math.ceil(hr.cooldown / 60) + 's' : (aimingThis ? 'AIM' : 'RDY');
        return `[${i+1}] ${def.icon} ${label}`;
      }
      if(id === 'eldritch_vine'){
        const vine = s && s.activeRelics && s.activeRelics.eldritch_vine;
        const aimingThis = !!(s.pendingRelicAim && s.pendingRelicAim.relicId === 'eldritch_vine');
        const label = vine && vine.cooldown > 0 ? Math.ceil(vine.cooldown / 60) + 's' : (aimingThis ? 'AIM' : (s.vinePull ? 'PULL' : 'RDY'));
        return `[${i+1}] ${def.icon} ${label}`;
      }
      return `[${i+1}] ${def.icon}`;
    });
    return `RELICS: ${parts.join(' ')}`;
  };

  G.updatePowerUI = function(s){
    const p = document.getElementById('powerdisp');
    if(p) p.textContent = `${G.getArtifactHudText ? G.getArtifactHudText(s) : 'ARTIFACT: —'} · ${G.getRelicHudText ? G.getRelicHudText(s) : 'RELICS: —'}`;
    if(typeof G.updateRuneUI === 'function') G.updateRuneUI();
  };

  ensureProgress();
})();
