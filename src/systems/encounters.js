(function(){
  'use strict';

  const G = window;
  const CHECKPOINT_JUMP_THRESHOLD = 600;

  function getBossHudEls(){
    return {
      wrap: document.getElementById('bossbar-wrap'),
      name: document.getElementById('bossbar-name'),
      fill: document.getElementById('bossbar-fill'),
      hp: document.getElementById('bossbar-hp')
    };
  }

  function syncBossHud(s){
    const els = getBossHudEls();
    if(!els.wrap || !els.name || !els.fill || !els.hp) return;
    const boss = s && s.activeBoss;
    if(!boss || !boss.active || boss.dead){
      els.wrap.style.display = 'none';
      return;
    }
    const pct = boss.maxHp > 0 ? Math.max(0, boss.hp / boss.maxHp) : 0;
    els.wrap.style.display = 'block';
    els.name.textContent = boss.name || 'BOSS';
    els.fill.style.width = Math.round(pct * 100) + '%';
    els.hp.textContent = boss.hp + ' / ' + boss.maxHp;
  }

  function ensureBossState(s){
    if(!s) return;
    s.bossSpawnedTriggers = s.bossSpawnedTriggers || {};
    s.bossTriggerArmed = s.bossTriggerArmed || {};
    if(s.bossIntroTimer == null) s.bossIntroTimer = 0;
    if(typeof s.bossIntroText !== 'string') s.bossIntroText = '';
    if(typeof s.lastBossCheckScore !== 'number') s.lastBossCheckScore = typeof s.score === 'number' ? s.score : 0;
    if(typeof s.bossCameraLocked !== 'boolean') s.bossCameraLocked = false;
  }

  function scoreTriggerSatisfied(score, trigger){
    return trigger >= 0 ? score >= trigger : score <= trigger;
  }

  function getBossList(){
    const defs = (G.getBossDefs && G.getBossDefs()) || {};
    return Object.keys(defs).map(k => defs[k]).sort((a,b)=>{
      const at = Array.isArray(a.triggerScores) ? Math.min(...a.triggerScores.map(v=>Math.abs(v))) : Math.abs(a.triggerScore || 0);
      const bt = Array.isArray(b.triggerScores) ? Math.min(...b.triggerScores.map(v=>Math.abs(v))) : Math.abs(b.triggerScore || 0);
      return at - bt;
    });
  }

  function ensurePlantBossPlatform(s, triggerScore){
    const px = Math.round((s.pl && s.pl.x) || (G.W * 0.5));
    const py = (s.pl && typeof s.pl.y === 'number') ? s.pl.y : (-triggerScore * 10);
    const desiredY = py - 220;

    let p = null;
    const candidates = (s.plats || []).filter(pp => {
      if(!pp) return false;
      const dy = pp.y - py;
      return dy <= -110 && dy >= -320;
    });
    if(candidates.length){
      candidates.sort((a,b)=>{
        const aCenter = (a.x || 0) + (a.w || 0) * 0.5;
        const bCenter = (b.x || 0) + (b.w || 0) * 0.5;
        const aScore = Math.abs(a.y - desiredY) + Math.abs(aCenter - px) * 0.45 - (a.w || 0) * 0.08;
        const bScore = Math.abs(b.y - desiredY) + Math.abs(bCenter - px) * 0.45 - (b.w || 0) * 0.08;
        return aScore - bScore;
      });
      p = candidates[0];
    }

    if(!p){
      const platY = desiredY;
      const id = G.platId ? G.platId(platY) : Math.round(platY / 80);
      const spawnX = Math.max(G.WALL + 6, Math.min(G.W - G.WALL - 186, px - 90));
      p = { x:spawnX, y:platY, w:180, h:14, icy:false, torch:false, id, checkpoint:false, safe:true };
      s.plats.push(p);
    } else {
      p.w = Math.max(p.w || 0, 180);
      p.h = 14;
      p.icy = false;
      p.torch = false;
      p.safe = true;
    }

    const id = p.id;
    if(Array.isArray(s.mushrooms)) s.mushrooms = s.mushrooms.filter(m => m.platId !== id);
    if(Array.isArray(s.plants)) s.plants = s.plants.filter(pl => pl.platId !== id);
    return p;
  }

  function spawnBossFromTrigger(s, def, triggerScore){
    const entityType = def.entityType || ('boss_' + def.id);
    const bossApi = G.CastleEntities && G.CastleEntities.registry && G.CastleEntities.registry.getBoss(entityType);
    if(!bossApi || !bossApi.create) return false;

    let boss = null;
    if(def.id === 'elder_plant'){
      const plat = ensurePlantBossPlatform(s, triggerScore);
      boss = bossApi.create({
        id: `${def.id}_${triggerScore}`,
        x: plat.x + plat.w * 0.5,
        y: plat.y,
        hp: def.hp,
        name: def.name,
        triggerScore,
        defId: def.id,
        platId: plat.id
      });
    } else {
      const arenaBottom = s.pl.y - 80;
      const arenaTop = arenaBottom - (def.arenaHeight || 320);
      const spawnY = arenaTop - 120;
      const spawnX = Math.max(G.WALL + 40, Math.min(G.W - G.WALL - 40, s.pl.x + (s.pl.x < G.W * 0.5 ? 78 : -78)));
      boss = bossApi.create({
        id: `${def.id}_${triggerScore}`,
        x: spawnX,
        y: spawnY,
        hp: def.hp,
        arenaTop,
        arenaBottom,
        name: def.name,
        defId: def.id,
        triggerScore
      });
      s.bossArenaTop = arenaTop;
      s.bossArenaBottom = arenaBottom;
    }

    if(!boss) return false;
    s.activeBoss = boss;
    s.bossFightActive = true;
    s.bossCameraLocked = (boss.type !== 'boss_elder_plant');
    s.bossIntroTimer = 150;
    s.bossIntroText = def.name || 'BOSS';
    s.bossSpawnedTriggers[`${def.id}:${triggerScore}`] = true;
    if(typeof G.addFloat === 'function'){
      G.addFloat(G.W/2, G.H*0.22, `⚠ ${(def.name || 'BOSS').toUpperCase()} APPROACHES!`, '#ff8866');
    }
    return true;
  }

  function disarmSatisfiedTriggersAtScore(s, score){
    for(const def of getBossList()){
      const triggers = Array.isArray(def.triggerScores) ? def.triggerScores : (def.triggerScore != null ? [def.triggerScore] : []);
      for(const triggerScore of triggers){
        const key = `${def.id}:${triggerScore}`;
        if(s.bossSpawnedTriggers[key]) continue;
        const satisfied = scoreTriggerSatisfied(score, triggerScore);
        s.bossTriggerArmed[key] = !satisfied;
      }
    }
  }

  function maybeSpawnBoss(s){
    ensureBossState(s);
    if(!s || s.activeBoss || s.bossFightActive) return;

    const curScore = typeof s.score === 'number' ? s.score : 0;
    if(Math.abs(curScore - s.lastBossCheckScore) >= CHECKPOINT_JUMP_THRESHOLD){
      disarmSatisfiedTriggersAtScore(s, curScore);
      s.lastBossCheckScore = curScore;
      return;
    }

    for(const def of getBossList()){
      if(def.biome && s.biomeId !== def.biome) continue;
      const triggers = Array.isArray(def.triggerScores) ? def.triggerScores : (def.triggerScore != null ? [def.triggerScore] : []);
      for(const triggerScore of triggers){
        const key = `${def.id}:${triggerScore}`;
        if(s.bossSpawnedTriggers[key]) continue;

        const satisfied = scoreTriggerSatisfied(curScore, triggerScore);
        if(!(key in s.bossTriggerArmed)){
          s.bossTriggerArmed[key] = !satisfied;
        }

        if(!satisfied){
          s.bossTriggerArmed[key] = true;
          continue;
        }

        if(s.bossTriggerArmed[key]){
          s.bossTriggerArmed[key] = false;
          s.lastBossCheckScore = curScore;
          spawnBossFromTrigger(s, def, triggerScore);
          return;
        }
      }
    }
    s.lastBossCheckScore = curScore;
  }

  function updateBoss(s){
    const boss = s && s.activeBoss;
    if(!boss || !boss.active || boss.dead) return;
    if(s.freezeTimer > 0) return;
    const registry = G.CastleEntities && G.CastleEntities.registry;
    if(registry && registry.updateBossInstance){
      registry.updateBossInstance(boss, s, {
        timeScale: G.timeScale,
        takeDamage: G.takeDamage,
        addFloat: G.addFloat,
        W: G.W,
        H: G.H
      });
    }

    const pl = s.pl;
    const dx = pl.x - boss.x;
    const dy = pl.y - (boss.y + 4);
    const hurtRadius = boss.contactDamageRadius || ((boss.phase === 'slam') ? 30 : 0);
    if(hurtRadius > 0 && Math.sqrt(dx*dx + dy*dy) < hurtRadius){
      G.takeDamage(s, 1, boss.contactDamageText || 'BOSS HIT!');
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      pl.vx += (dx/dist) * (boss.contactKnockbackX || 2.0);
      pl.vy -= (boss.contactKnockbackY || 1.4);
      boss.contactDamageRadius = 0;
    }
  }

  function updateBossCameraLock(s){
    const boss = s && s.activeBoss;
    if(!boss || !boss.active || boss.dead) return;
    if(boss.type === 'boss_elder_plant' && !s.bossCameraLocked){
      const screenY = boss.y - s.cam;
      const centerDist = Math.abs(screenY - (G.H * 0.5));
      if(centerDist <= 96) s.bossCameraLocked = true;
      else return;
    }
    let target;
    if(boss.type === 'boss_elder_plant'){
      target = (boss.y - 120) - (G.H * 0.5);
    } else {
      target = ((boss.arenaTop + boss.arenaBottom) * 0.5) - (G.H * 0.5);
    }
    s.cam += (target - s.cam) * 0.14 * (G.timeScale || 1);
  }

  function finishBossIfNeeded(s){
    const boss = s && s.activeBoss;
    if(!boss || !boss.active) return;
    if(boss.hp > 0) return;
    boss.hp = 0;
    boss.dead = true;
    boss.active = false;
    s.bossFightActive = false;
    s.bossCameraLocked = false;
    s.bossArenaTop = null;
    s.bossArenaBottom = null;
    const def = G.getBossDef && G.getBossDef(boss.defId || 'elder_bat');
    if(def){
      G.totalCoins += def.rewardCoins || 0;
      const coinDisp = document.getElementById('coindisp');
      if(coinDisp && G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(coinDisp, 'coin', '⚜', String(G.totalCoins));
      else if(coinDisp) coinDisp.textContent = '⚜ ' + G.totalCoins;
      if(typeof G.addFloat === 'function'){
        G.addFloat(boss.x, boss.y - s.cam - 20, '🏆 BOSS SLAIN! +' + (def.rewardCoins || 0) + ' ⚜', '#ffdd66');
      }
      const relicId = def.unlockRelic || null;
      G.bossesDefeated = G.bossesDefeated || {};
      const firstKill = !G.bossesDefeated[def.id];
      const relicMissing = relicId && G.isRelicUnlocked ? !G.isRelicUnlocked(relicId) : false;
      G.bossesDefeated[def.id] = true;
      if((firstKill || relicMissing) && relicId && window.CastleRelicPickups){
        window.CastleRelicPickups.spawn(s, relicId, boss.x, boss.y - 18, def.id);
        if(typeof G.addFloat === 'function') G.addFloat(boss.x, boss.y - s.cam - 38, '📯 RELIC DROPPED!', '#d8d1ff');
      }
      if(window.CastleChests && window.CastleChests.spawnLooseLoot){
        window.CastleChests.spawnLooseLoot(s, 'max_heart', boss.x + 18, boss.y - 6);
        if(typeof G.addFloat === 'function') G.addFloat(boss.x + 18, boss.y - s.cam - 20, '❤️ GREAT HEART!', '#ff6688');
      }
    }
    s.activeBoss = null;
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
    G.saveGame(s);
  }

  function updateIntroTimer(s){
    ensureBossState(s);
    if(s.bossIntroTimer > 0) s.bossIntroTimer -= (G.timeScale || 1);
  }

  function drawIntroBanner(ctx, s){
    if(!s || !s.bossIntroTimer || s.bossIntroTimer <= 0) return;
    const alpha = Math.min(1, s.bossIntroTimer / 20, (150 - s.bossIntroTimer) / 20);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha * 0.96);
    const y = 116;
    ctx.fillStyle = 'rgba(20,8,12,0.82)';
    ctx.fillRect(34, y - 24, G.W - 68, 52);
    ctx.strokeStyle = '#a44834';
    ctx.lineWidth = 3;
    ctx.strokeRect(34, y - 24, G.W - 68, 52);
    ctx.fillStyle = '#ffcf9d';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS ENCOUNTER', G.W * 0.5, y - 4);
    ctx.fillStyle = '#ffe7cf';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(s.bossIntroText || 'BOSS', G.W * 0.5, y + 16);
    ctx.restore();
  }

  G.CastleEncounters = {
    update(s){
      maybeSpawnBoss(s);
      updateBoss(s);
      updateBossCameraLock(s);
      finishBossIfNeeded(s);
      updateIntroTimer(s);
      syncBossHud(s);
    },
    draw(ctx, s){
      const boss = s && s.activeBoss;
      if(boss && boss.active && !boss.dead){
        const registry = G.CastleEntities && G.CastleEntities.registry;
        if(registry && registry.drawBossInstance){
          registry.drawBossInstance(ctx, boss, s.cam);
        }
      }
      drawIntroBanner(ctx, s);
    },
    syncHud: syncBossHud
  };
})();
