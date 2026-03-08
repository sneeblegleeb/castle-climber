(function(){
  'use strict';
  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};

  E.slimes = {
    updateSlimes(s, deps){
      const pl = s.pl;
      const ts = deps.timeScale;
      const { WALL, W, takeDamage, SLIME_DEAD_FRAMES, SLIME_GRAV, SLIME_HOP_VX, SLIME_HOP_VY, SLIME_HOP_MIN, SLIME_HOP_MAX, SLIME_TOUCH_RAD } = deps;
      const hw = 8, hh = 7;

      for(const sl of s.slimes){
        sl.bobAngle += 0.06 * ts;

        if(sl.dead){
          sl.deadTimer += ts;
          sl.squish = Math.min(1, sl.deadTimer / SLIME_DEAD_FRAMES);
          continue;
        }

        if(sl.hurtTimer > 0) sl.hurtTimer--;

        sl.prevY = sl.y;
        sl.vy += SLIME_GRAV * ts;
        sl.x  += sl.vx * ts;
        sl.y  += sl.vy * ts;

        if(sl.onGround){
          sl.vx *= Math.pow(0.78, ts);
          if(Math.abs(sl.vx) < 0.05) sl.vx = 0;
        }

        if(sl.x - hw < WALL)       { sl.x = WALL + hw;       sl.vx =  Math.abs(sl.vx) * 0.5; }
        if(sl.x + hw > W - WALL)   { sl.x = W - WALL - hw;   sl.vx = -Math.abs(sl.vx) * 0.5; }

        sl.onGround = false;
        for(const p of s.plats){
          const pR = p.x + p.w, pB = p.y + p.h;
          const slL = sl.x - hw, slR = sl.x + hw;
          const slT = sl.y - hh * 2, slB = sl.y;

          if(slR <= p.x || slL >= pR || slB <= p.y || slT >= pB) continue;

          if(sl.prevY <= p.y && sl.vy >= 0){
            const fallVy = sl.vy;
            sl.y      = p.y;
            sl.vy     = 0;
            sl.onGround = true;
            const impact = Math.min(1, Math.abs(fallVy) / 8);
            if(impact > 0.15){
              sl.squish      = impact * 0.85;
              sl.squishTimer = 12;
            }
            if(sl.x < p.x + p.w * 0.3)      sl.dir =  1;
            else if(sl.x > p.x + p.w * 0.7) sl.dir = -1;
          }
          else if(sl.vx !== 0){
            if(slL < p.x && sl.vx < 0){ sl.x = p.x - hw; sl.vx *= -0.4; sl.dir = 1; }
            if(slR > pR  && sl.vx > 0){ sl.x = pR  + hw; sl.vx *= -0.4; sl.dir = -1; }
          }
          break;
        }

        if(sl.squishTimer > 0){
          sl.squishTimer -= ts;
        } else {
          sl.squish = Math.max(0, sl.squish - 0.06 * ts);
        }

        if(sl.onGround){
          sl.hopTimer -= ts;
          if(sl.hopTimer <= 0){
            const toPlayer = pl.x - sl.x;
            const biasRoll = Math.random();
            let hopDir;
            if(biasRoll < 0.35)      hopDir =  1;
            else if(biasRoll < 0.7)  hopDir = -1;
            else                     hopDir = toPlayer > 0 ? 1 : -1;

            sl.dir = hopDir;
            sl.vx  = hopDir * (0.6 + Math.random() * SLIME_HOP_VX);
            sl.vy  = SLIME_HOP_VY * (0.8 + Math.random() * 0.4);
            sl.onGround  = false;
            sl.hopTimer  = SLIME_HOP_MIN + Math.random() * (SLIME_HOP_MAX - SLIME_HOP_MIN);
            sl.squish    = 0;
          }
        }

        if(sl.hurtTimer <= 0){
          const dx = pl.x - sl.x, dy = (pl.y) - (sl.y - hh);
          if(Math.sqrt(dx*dx + dy*dy) < SLIME_TOUCH_RAD + 10){
            takeDamage(s, 1, '🟢 SLIMED!');
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            sl.vx = -(dx/dist) * 2.5;
            sl.vy = -2.0;
            sl.hurtTimer = 80;
          }
        }
      }
    }
  };
})();
