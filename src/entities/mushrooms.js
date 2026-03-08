(function(){
  'use strict';
  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};
  const registry = E.registry;

  const api = {
    createForPlatform(s, p){
      if(p.safe || p.checkpoint) return null;
      const absScore = Math.abs(p.y) / 10;
      if(absScore < G.MUSH_START) return null;
      if(s.mushrooms.some(m=>m.platId===p.id)) return null;
      const biomeWeight = G.CastleBiomes ? G.CastleBiomes.getSpawnWeightForScore(absScore, 'mushrooms') : 1;
      if(biomeWeight <= 0) return null;
      const density = Math.min(1, (absScore - G.MUSH_START) / (G.MUSH_FULL - G.MUSH_START));
      if(G.hash2(p.id*53+7, 99) > density * G.MUSH_MAX_DENSITY * biomeWeight) return null;
      const mx = p.x + 10 + G.hash2(p.id, 88) * (p.w - 20);
      const initDelay = 80 + G.hash2(p.id, 91) * 220;
      return {
        x:mx, y:p.y,
        platId:p.id,
        puffTimer:initDelay,
        cloud:null,
        bob:G.hash2(p.id,92)*Math.PI*2,
        hp:1, dead:false, burstCloud:null,
      };
    },

    updateMushrooms(s, deps={}){
      const pl = s.pl;
      const tolerance = deps.sporeToleranceVal ? deps.sporeToleranceVal() : 50;
      let inCloud = false;
      let inBurst = false;
      for(const m of s.mushrooms){
        m.bob += 0.03;

        if(m.burstCloud){
          m.burstCloud.timer--;
          if(m.burstCloud.timer <= 0){ m.burstCloud = null; }
          else {
            const dx = pl.x - m.x, dy = pl.y - m.y;
            if(Math.sqrt(dx*dx + dy*dy) < deps.BURST_CLOUD_RADIUS + 10) inBurst = true;
          }
        }

        if(m.dead) continue;

        if(m.cloud){
          m.cloud.timer--;
          if(m.cloud.timer <= 0) m.cloud = null;
        } else {
          m.puffTimer--;
          if(m.puffTimer <= 0){
            m.cloud = {timer:deps.CLOUD_DURATION, maxTimer:deps.CLOUD_DURATION};
            m.puffTimer = deps.PUFF_MIN + Math.random()*deps.PUFF_RANGE;
          }
        }
        if(m.cloud){
          const dx = pl.x - m.x, dy = pl.y - m.y;
          if(Math.sqrt(dx*dx + dy*dy) < deps.CLOUD_RADIUS + 8) inCloud = true;
        }
      }

      if(inCloud){
        pl.sporeExposure++;
        if(pl.sporeExposure >= tolerance){
          deps.takeDamage(s, 1, '☠ SPORES!');
          pl.sporeExposure = 0;
        }
      } else {
        pl.sporeExposure = Math.max(0, pl.sporeExposure - 3);
      }

      if(inBurst){
        pl.burstExposure++;
        if(pl.burstExposure >= deps.BURST_TOLERANCE){
          deps.takeDamage(s, 1, '💥 SPORE BURST!');
          pl.burstExposure = 0;
        }
      } else {
        pl.burstExposure = Math.max(0, pl.burstExposure - 6);
      }
    }
  };

  E.mushrooms = api;
  if(registry && registry.registerEnemy) registry.registerEnemy('mushroom', api);
})();