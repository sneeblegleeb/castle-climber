(function(){
  'use strict';
  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};

  E.plants = {
    updatePlants(s, deps){
      const pl = s.pl;
      const ts = deps.timeScale;
      const {
        takeDamage,
        PLANT_TRACK_RADIUS,
        PLANT_AGRO,
        SNAP_FRAMES,
        CLOSED_HOLD,
        OPEN_FRAMES,
        PLANT_MAX_REACH,
      } = deps;

      for(const plant of s.plants){
        plant.bobAngle += 0.03;

        if(plant.severed){
          plant.headVY += 0.30 * ts;
          plant.headVX *= (1 - 0.012 * ts);
          plant.headX  += plant.headVX * ts;
          plant.headY  += plant.headVY * ts;
          plant.headAngle += plant.headSpin * ts;
          continue;
        }

        if(plant.hurtCooldown > 0) plant.hurtCooldown--;

        const bdx = pl.x - plant.x;
        const bdy = pl.y - plant.y;
        const baseDist = Math.sqrt(bdx*bdx + bdy*bdy);

        const hdx = pl.x - plant.headX;
        const hdy = pl.y - plant.headY;
        const headDist = Math.sqrt(hdx*hdx + hdy*hdy);

        let targetX = plant.x;
        let targetY = plant.restY;
        let springK = 0.055;
        let damping = 0.78;

        const playerAboveBase = pl.y < plant.y + 10;

        if(plant.state === 'open'){
          plant.mouthOpen = 0.6 + 0.4 * Math.abs(Math.sin(plant.bobAngle * 0.32));

          if(baseDist < PLANT_TRACK_RADIUS && playerAboveBase){
            targetX = pl.x;
            targetY = pl.y;
            springK = 0.045;
          } else {
            const sway = Math.sin(plant.bobAngle * 0.38) * 3.5;
            targetX = plant.x + sway;
            targetY = plant.restY + Math.sin(plant.bobAngle * 0.22) * 2;
          }

          if(headDist < PLANT_AGRO && playerAboveBase){
            plant.state     = 'snapping';
            plant.snapTimer = 0;
          }

        } else if(plant.state === 'snapping'){
          plant.snapTimer++;
          plant.mouthOpen = Math.max(0, 1.0 - plant.snapTimer / SNAP_FRAMES);
          targetX = pl.x;
          targetY = pl.y;
          springK = 0.32;
          damping = 0.65;

          if(plant.snapTimer >= SNAP_FRAMES){
            plant.state     = 'closed';
            plant.snapTimer = 0;
            plant.mouthOpen = 0;
            if(headDist < PLANT_AGRO && plant.hurtCooldown <= 0){
              takeDamage(s, 1, '🌿 CHOMPED!');
              plant.hurtCooldown = 110;
            }
          }

        } else if(plant.state === 'closed'){
          plant.mouthOpen = 0;
          plant.snapTimer++;
          targetX = plant.x + (plant.headX - plant.x) * 0.4;
          targetY = plant.restY + (plant.headY - plant.restY) * 0.4;
          springK = 0.06;
          if(plant.snapTimer >= CLOSED_HOLD){
            plant.state     = 'reopening';
            plant.snapTimer = 0;
          }

        } else if(plant.state === 'reopening'){
          plant.snapTimer++;
          plant.mouthOpen = Math.min(1.0, plant.snapTimer / OPEN_FRAMES);
          targetX = plant.x;
          targetY = plant.restY;
          springK = 0.07;
          if(plant.snapTimer >= OPEN_FRAMES){
            plant.state     = 'open';
            plant.snapTimer = 0;
          }
        }

        plant.headVX += (targetX - plant.headX) * springK * ts;
        plant.headVY += (targetY - plant.headY) * springK * ts;
        const damp = 1 - (1 - damping) * ts;
        plant.headVX *= damp;
        plant.headVY *= damp;
        plant.headX  += plant.headVX * ts;
        plant.headY  += plant.headVY * ts;

        const rdx  = plant.headX - plant.x;
        const rdy  = plant.headY - plant.y;
        const rDist = Math.sqrt(rdx*rdx + rdy*rdy);
        if(rDist > PLANT_MAX_REACH){
          const scale = PLANT_MAX_REACH / rDist;
          plant.headX = plant.x + rdx * scale;
          plant.headY = plant.y + rdy * scale;
          const dot = plant.headVX*(rdx/rDist) + plant.headVY*(rdy/rDist);
          if(dot > 0){
            plant.headVX -= (rdx/rDist) * dot;
            plant.headVY -= (rdy/rDist) * dot;
          }
        }
        if(plant.headY > plant.y - 4){
          plant.headY = plant.y - 4;
          if(plant.headVY > 0) plant.headVY = 0;
        }
      }
    }
  };
})();
