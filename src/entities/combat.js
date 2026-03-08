(function(){
  'use strict';
  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};

  E.combat = {
    attack(state, deps){
      if(!state || !state.alive || deps.paused) return;
      if(state.pl.attackTimer > 0) return;
      const cd = deps.attackCooldownVal();
      state.pl.lastAttackCooldown = cd;
      state.pl.attackTimer        = cd;
      state.pl.swingId            = (state.pl.swingId + 1) | 0;
    },

    checkAttackHits(s, deps){
      const pl  = s.pl;
      const sid = pl.swingId;
      const attackRadius = deps.attackRadiusVal();
      const addFloat = deps.addFloat;

      for(const bt of s.bats){
        if(bt.state === 'dead') continue;
        if(bt.lastHitSwing === sid) continue;
        const dx = bt.x - pl.x, dy = bt.wy - pl.y;
        if(Math.sqrt(dx*dx + dy*dy) < attackRadius){
          bt.lastHitSwing = sid;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          bt.hp--;
          bt.hurtTimer = 55;
          if(bt.hp <= 0){
            bt.state  = 'dead';
            bt.deadVX = (dx/dist) * 3.5;
            bt.deadVY = -2.0;
            addFloat(bt.x, bt.wy - s.cam - 14, '💀 SLAIN!', '#ffdd44');
          } else {
            bt.state        = 'retreating';
            bt.retreatTimer = 130;
            bt.dvx          = (dx/dist) * 5.5;
            bt.dvy          = (dy/dist) * 5.5 - 1.5;
            addFloat(bt.x, bt.wy - s.cam - 12, '⚔ SLASH!', '#ffcc44');
          }
        }
      }

      for(const plant of s.plants){
        if(plant.severed) continue;
        if(plant.hurtCooldown > 0) continue;
        if(plant.lastHitSwing === sid) continue;
        const dx = plant.headX - pl.x, dy = plant.headY - pl.y;
        if(Math.sqrt(dx*dx + dy*dy) < attackRadius){
          plant.lastHitSwing = sid;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          plant.hp--;
          plant.hurtCooldown = 55;
          if(plant.hp <= 0){
            plant.severed  = true;
            plant.headVX   = (dx/dist) * 5 + (Math.random()-0.5)*2;
            plant.headVY   = (dy/dist) * 5 - 2.5;
            plant.headSpin = (Math.random()-0.5) * 0.22;
            addFloat(plant.headX, (plant.headY - s.cam) - 18, '💀 SEVERED!', '#aaffaa');
          } else {
            plant.state     = 'reopening';
            plant.snapTimer = 0;
            plant.mouthOpen = 0;
            plant.headVX   += (dx/dist) * 6;
            plant.headVY   += (dy/dist) * 6;
            const hpLabel = plant.hp === 2 ? '⚔ SLASH! ❤❤' : '⚔ SLASH! ❤';
            addFloat(plant.headX, (plant.headY - s.cam) - 14, hpLabel, '#aaffaa');
          }
        }
      }

      for(const m of s.mushrooms){
        if(m.dead) continue;
        if(m.lastHitSwing === sid) continue;
        const dx = m.x - pl.x, dy = m.y - pl.y;
        if(Math.sqrt(dx*dx + dy*dy) < attackRadius){
          m.lastHitSwing = sid;
          m.hp--;
          if(m.hp <= 0){
            m.dead       = true;
            m.cloud      = null;
            m.burstCloud = { timer: deps.BURST_CLOUD_DURATION, maxTimer: deps.BURST_CLOUD_DURATION };
            addFloat(m.x, m.y - s.cam - 22, '💥 BURST!', '#88ff44');
          }
        }
      }


      for(const ch of (s.chests || [])){
        if(ch.opened) continue;
        if(ch.lastHitSwing === sid) continue;
        const dx = ch.x - pl.x, dy = (ch.y - 4) - pl.y;
        if(Math.sqrt(dx*dx + dy*dy) < attackRadius + 4){
          ch.lastHitSwing = sid;
          ch.hp--;
          if(ch.hp <= 0){
            if(window.CastleChests) window.CastleChests.openChest(s, ch);
            addFloat(ch.x, ch.y - s.cam - 12, '🪙 CRACK!', '#ffdd66');
          } else {
            addFloat(ch.x, ch.y - s.cam - 12, '⚔ CRACK!', '#d6b15a');
          }
        }
      }

      const boss = s.activeBoss;
      if(boss && boss.active && !boss.dead){
        if(boss.lastHitSwing !== sid){
          const bossHitY = boss.y + 4;
          const dx = boss.x - pl.x, dy = bossHitY - pl.y;
          if(Math.sqrt(dx*dx + dy*dy) < attackRadius + 10){
            boss.lastHitSwing = sid;
            boss.hp = Math.max(0, boss.hp - 1);
            boss.hurtTimer = 10;
            boss.vx += (dx === 0 ? 0 : (dx/Math.abs(dx))) * 0.8;
            boss.vy -= 0.6;
            const label = boss.hp > 0 ? '⚔ CHIPPED!' : '🏆 CRACKED!';
            addFloat(boss.x, boss.y - s.cam - 18, label, '#ffbb66');
          }
        }
      }

      for(const sl of s.slimes){
        if(sl.dead) continue;
        if(sl.lastHitSwing === sid) continue;
        const dx = sl.x - pl.x, dy = (sl.y - 7) - pl.y;
        if(Math.sqrt(dx*dx + dy*dy) < attackRadius){
          sl.lastHitSwing = sid;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          sl.hp--;
          sl.hurtTimer = 50;
          if(sl.hp <= 0){
            sl.dead      = true;
            sl.deadTimer = 0;
            sl.vx = (dx/dist) * 3.5;
            sl.vy = -1.2;
            addFloat(sl.x, sl.y - 7 - s.cam - 14, '💀 SPLAT!', `hsl(${sl.hue},90%,65%)`);
          } else {
            sl.vx = (dx/dist) * 4.5;
            sl.vy = -2.8;
            sl.onGround = false;
            addFloat(sl.x, sl.y - 7 - s.cam - 12, '⚔ SLASH!', `hsl(${sl.hue},90%,70%)`);
          }
        }
      }
    }
  };
})();
