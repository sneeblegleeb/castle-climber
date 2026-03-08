(function(){
  'use strict';
  const G = window;

  function chestIdForPlat(p){ return 'ch_' + p.id; }

  function ensureState(s){
    if(!s) return;
    s.chests = s.chests || [];
    s.lootDrops = s.lootDrops || [];
  }

  function findPlatById(s, platId){
    if(!s || !s.plats) return null;
    return s.plats.find(p => p && p.id === platId) || null;
  }

  function hasSupportingPlatform(s, x, y, pad){
    if(!s || !s.plats) return false;
    const supportPad = pad == null ? 10 : pad;
    return s.plats.some(p => (
      Math.abs((p.y - 10) - y) <= 1.5 &&
      x - supportPad >= p.x &&
      x + supportPad <= p.x + p.w
    ));
  }

  function syncChestToPlatform(s, ch){
    const p = findPlatById(s, ch.platId);
    if(!p) return false;
    ch.x = p.x + p.w * 0.5;
    ch.y = p.y - 10;
    return true;
  }

  function createForPlatform(s, p){
    if(!p || p.safe || p.checkpoint || p.w < 34) return null;
    const roll = G.hash2(p.id * 149 + 17, 707);
    if(roll > 0.038) return null;
    const tier = roll < 0.009 ? 'ornate' : (roll < 0.02 ? 'iron' : 'wood');
    const x = p.x + p.w * 0.5;
    const y = p.y - 10;
    if(!hasSupportingPlatform(s, x, y, 10)) return null;
    return {
      id: chestIdForPlat(p),
      platId: p.id,
      type:'chest',
      x,
      y,
      tier,
      hp: tier === 'ornate' ? 3 : 2,
      maxHp: tier === 'ornate' ? 3 : 2,
      opened:false
    };
  }

  function addLootFloat(s, x, y, text, color){
    if(typeof G.addFloat === 'function') G.addFloat(x, y - s.cam, text, color);
  }

  function spawnLootDrop(s, kind, x, y, extra){
    ensureState(s);
    const drop = Object.assign({
      id: `ld_${kind}_${Math.round(x)}_${Math.round(y)}_${Math.floor(Math.random()*1e9)}`,
      kind, x, y,
      vx: (Math.random() - 0.5) * 1.8,
      vy: -1.8 - Math.random() * 1.2,
      gravity: 0.1,
      collected:false,
      settleY: y,
      bob: Math.random() * Math.PI * 2,
      age: 0
    }, extra || {});
    s.lootDrops.push(drop);
    return drop;
  }

  function spawnChestLoot(s, ch){
    const goldBase = ch.tier === 'ornate' ? 24 : (ch.tier === 'iron' ? 16 : 10);
    const gold = G.goldValue ? G.goldValue(goldBase) : goldBase;
    spawnLootDrop(s, 'coins', ch.x - 8, ch.y - 4, { amount: gold });

    const healRoll = Math.random();
    if(healRoll < (ch.tier === 'ornate' ? 0.65 : 0.35)){
      const heal = G.healAmount ? G.healAmount(1) : 1;
      spawnLootDrop(s, 'heart', ch.x + 8, ch.y - 8, { amount: heal });
    }

    const runeChance = ch.tier === 'ornate' ? 0.18 : (ch.tier === 'iron' ? 0.08 : 0.025);
    const artifactChance = ch.tier === 'ornate' ? 0.3 : (ch.tier === 'iron' ? 0.16 : 0.05);
    if(Math.random() < runeChance && G.getRandomRuneId){
      const runeId = G.getRandomRuneId();
      if(runeId) spawnLootDrop(s, 'rune', ch.x, ch.y - 14, { runeId });
    }
    if(Math.random() < artifactChance && window.CastleArtifactPickups){
      window.CastleArtifactPickups.spawnFromChest(s, ch, 'chronos_seal');
      addLootFloat(s, ch.x, ch.y - 42, '⏳ ARTIFACT DROPPED', '#99ddff');
    }
  }

  function collectLootDrop(s, drop){
    const pl = s.pl;
    drop.collected = true;
    if(drop.kind === 'coins'){
      const amt = Math.max(1, drop.amount | 0);
      G.totalCoins += amt;
      s.session_coins += amt;
      addLootFloat(s, drop.x, drop.y - 6, `+${amt} ⚜`, '#ffcc44');
      const coinDisp = document.getElementById('coindisp');
      if(coinDisp && G.CastleIcons && G.CastleIcons.setLabeledIconText) G.CastleIcons.setLabeledIconText(coinDisp, 'coin', '⚜', String(G.totalCoins));
      else if(coinDisp) coinDisp.textContent = '⚜ ' + G.totalCoins;
    } else if(drop.kind === 'heart'){
      const heal = Math.max(1, drop.amount | 0);
      if(pl.hp < pl.maxHp){
        pl.hp = Math.min(pl.maxHp, pl.hp + heal);
        addLootFloat(s, drop.x, drop.y - 6, `❤️ +${heal}`, '#ff88aa');
        if(typeof G.updateHeartsUI === 'function') G.updateHeartsUI(pl);
      } else {
        addLootFloat(s, drop.x, drop.y - 6, 'FULL', '#ff88aa');
      }
    } else if(drop.kind === 'max_heart'){
      pl.hp = pl.maxHp;
      addLootFloat(s, drop.x, drop.y - 8, '❤️ MAX!', '#ff6688');
      if(typeof G.updateHeartsUI === 'function') G.updateHeartsUI(pl);
    } else if(drop.kind === 'rune'){
      let runeId = drop.runeId;
      if(!runeId && G.getRandomRuneId) runeId = G.getRandomRuneId();
      if(runeId && G.grantRuneLevel){
        G.grantRuneLevel(runeId, 1);
        const def = G.RUNES && G.RUNES[runeId];
        if(def) addLootFloat(s, drop.x, drop.y - 6, `${def.icon} ${def.name.toUpperCase()} +1`, '#c3b2ff');
      }
    }
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
  }

  function drawPixelHeart(ctx, x, y, scale, plusHighlight){
    const s = scale || 1;
    const px = (ox, oy, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 6*s + ox*s, y - 5*s + oy*s, w*s, h*s);
    };

    const grd = ctx.createRadialGradient(x, y, 0, x, y, 16 * s);
    grd.addColorStop(0, 'rgba(255,100,140,0.35)');
    grd.addColorStop(1, 'rgba(255,50,80,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, 16 * s, 0, Math.PI * 2); ctx.fill();

    px(1,0,3,2,'#cc2244'); px(5,0,3,2,'#cc2244');
    px(0,1,4,2,'#cc2244'); px(4,1,4,2,'#cc2244');
    px(0,2,9,3,'#cc2244');
    px(1,5,7,2,'#cc2244');
    px(2,7,5,2,'#cc2244');
    px(3,9,3,1,'#cc2244');
    px(4,10,1,1,'#cc2244');
    px(1,1,2,1,'#ff6688'); px(5,1,2,1,'#ff6688');
    px(1,2,1,1,'#ff99aa');

    if(plusHighlight){
      const unit = Math.max(1, Math.round(s));
      ctx.fillStyle = '#fff4aa';
      ctx.fillRect(Math.round(x - unit), Math.round(y - 6 * s), 2 * unit, 7 * unit);
      ctx.fillRect(Math.round(x - 3.5 * s), Math.round(y - 3 * s), 7 * unit, 2 * unit);
    }
  }

  G.CastleChests = {
    tryPlaceChest(s, p){
      ensureState(s);
      const id = chestIdForPlat(p);
      if(s.chests.some(ch => ch.id === id)) return;
      const ch = createForPlatform(s, p);
      if(ch) s.chests.push(ch);
    },
    spawnLooseLoot(s, kind, x, y, extra){
      return spawnLootDrop(s, kind, x, y, extra);
    },
    openChest(s, ch){
      if(!ch || ch.opened) return;
      ch.opened = true;
      spawnChestLoot(s, ch);
      addLootFloat(s, ch.x, ch.y - 12, '🪙 BURST!', '#ffdd66');
    },
    update(s){
      ensureState(s);
      s.chests = s.chests.filter(ch => syncChestToPlatform(s, ch));
      const pl = s.pl;
      for(const d of s.lootDrops){
        if(d.collected) continue;
        d.age += 1;
        if(d.age < 20){
          d.x += d.vx;
          d.y += d.vy;
          d.vy += d.gravity;
          if(d.y > d.settleY){ d.y = d.settleY; d.vx *= 0.25; d.vy = 0; }
        } else {
          d.bob += 0.05;
        }
        const dx = pl.x - d.x, dy = pl.y - d.y;
        if(Math.sqrt(dx*dx + dy*dy) < 18){ collectLootDrop(s, d); }
      }
      s.lootDrops = s.lootDrops.filter(d => !d.collected);
    },
    drawAll(ctx, s){
      ensureState(s);
      for(const ch of s.chests){
        if(ch.opened) continue;
        const sy = ch.y - s.cam;
        ctx.save();
        ctx.translate(ch.x, sy);
        ctx.fillStyle = ch.tier === 'ornate' ? '#9a6f1f' : (ch.tier === 'iron' ? '#6b5b47' : '#6a3b18');
        ctx.strokeStyle = '#1d1209';
        ctx.lineWidth = 2;
        ctx.fillRect(-10, -8, 20, 16);
        ctx.strokeRect(-10, -8, 20, 16);
        ctx.fillStyle = '#d6b15a';
        ctx.fillRect(-10, -3, 20, 4);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-2, -1, 4, 6);
        ctx.restore();
      }
      for(const d of s.lootDrops){
        if(d.collected) continue;
        const sy = d.y - s.cam + (d.age >= 20 ? Math.sin(d.bob) * 1.5 : 0);
        ctx.save();
        ctx.translate(d.x, sy);
        if(d.kind === 'coins'){
          ctx.fillStyle = '#ffdd44'; ctx.fillRect(-6,-6,12,12);
          ctx.strokeStyle = '#8a6a10'; ctx.strokeRect(-6,-6,12,12);
          ctx.fillStyle = '#8a6a10'; ctx.fillRect(-1,-4,2,8); ctx.fillRect(-4,-1,8,2);
        } else if(d.kind === 'heart' || d.kind === 'max_heart'){
          drawPixelHeart(ctx, 0, 0, d.kind === 'max_heart' ? 1.8 : 1, d.kind === 'max_heart');
        } else if(d.kind === 'rune'){
          ctx.fillStyle = '#8b5cf6';
          ctx.beginPath();
          ctx.moveTo(0,-9); ctx.lineTo(8,0); ctx.lineTo(0,9); ctx.lineTo(-8,0); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#e9ddff'; ctx.fillRect(-1,-5,2,10); ctx.fillRect(-4,-1,8,2);
        }
        ctx.restore();
      }
    }
  };
})();
