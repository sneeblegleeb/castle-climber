(function(){
  'use strict';
  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};

  const SCALE = 2.4;
  const TRACK_RADIUS = 220;
  const ATTACK_RADIUS = 110;
  const MAX_REACH = 175;
  const TELL_CHOMP_FRAMES = 12;
  const LUNGE_SPEED = 7.0;
  const RECOVER_SNAP_DIST = 5;

  function clampHead(boss){
    const dx = boss.headX - boss.x;
    const dy = boss.headY - boss.restY;
    const d = Math.sqrt(dx*dx + dy*dy) || 1;
    if(d > MAX_REACH){
      const sc = MAX_REACH / d;
      boss.headX = boss.x + dx * sc;
      boss.headY = boss.restY + dy * sc;
      const nx = dx / d;
      const ny = dy / d;
      const dot = boss.headVX * nx + boss.headVY * ny;
      if(dot > 0){
        boss.headVX -= nx * dot;
        boss.headVY -= ny * dot;
      }
    }
    const floorY = boss.y - 8;
    if(boss.headY > floorY){
      boss.headY = floorY;
      if(boss.headVY > 0) boss.headVY = 0;
    }
  }

  const api = {
    id: 'boss_elder_plant',

    create(opts={}){
      const restY = (opts.y ?? -1000) - 52;
      return {
        id: opts.id || `elder_plant_${Date.now()}`,
        type: 'boss_elder_plant',
        defId: opts.defId || 'elder_plant',
        x: opts.x ?? 180,
        y: opts.y ?? -1000,
        restY,
        headX: opts.x ?? 180,
        headY: restY,
        headVX: 0,
        headVY: 0,
        hp: opts.hp ?? 7,
        maxHp: opts.hp ?? 7,
        phase: 'idle',
        timer: 0,
        active: true,
        name: opts.name || 'Elder Plant',
        dead: false,
        hurtTimer: 0,
        hurtCooldown: 0,
        bobAngle: Math.random() * Math.PI * 2,
        mouthOpen: 1,
        cooldown: 80,
        tellTimer: 0,
        lungeTimer: 0,
        recoverTimer: 0,
        lungeVX: 0,
        lungeVY: 0,
        introTimer: 40,
        platId: opts.platId,
        contactDamageRadius: 0,
        contactDamageText: '🌿 ELDER PLANT!'
      };
    },

    update(boss, game, deps={}){
      if(!boss || !boss.active) return;
      const ts = deps.timeScale || 1;
      const pl = game.pl;
      if(!pl) return;
      boss.timer += ts;
      boss.bobAngle += 0.03 * ts;
      if(boss.hurtTimer > 0) boss.hurtTimer -= ts;
      if(boss.hurtCooldown > 0) boss.hurtCooldown -= ts;
      if(boss.cooldown > 0) boss.cooldown -= ts;
      boss.contactDamageRadius = 0;

      let targetX = boss.x;
      let targetY = boss.restY;
      let springK = 0.055;
      let damping = 0.80;

      const bdx = pl.x - boss.x;
      const bdy = pl.y - boss.y;
      const baseDist = Math.sqrt(bdx*bdx + bdy*bdy);
      const hdx = pl.x - boss.headX;
      const hdy = pl.y - boss.headY;
      const headDist = Math.sqrt(hdx*hdx + hdy*hdy);
      const playerAboveBase = pl.y < boss.y + 12;

      if(boss.phase === 'idle'){
        boss.mouthOpen = 0.62 + 0.38 * Math.abs(Math.sin(boss.bobAngle * 0.32));
        if(baseDist < TRACK_RADIUS && playerAboveBase){
          targetX = pl.x;
          targetY = pl.y;
          springK = 0.045;
        } else {
          const sway = Math.sin(boss.bobAngle * 0.38) * 7;
          targetX = boss.x + sway;
          targetY = boss.restY + Math.sin(boss.bobAngle * 0.22) * 4;
        }
        if(boss.cooldown <= 0 && baseDist < ATTACK_RADIUS && playerAboveBase){
          boss.phase = 'tell';
          boss.tellTimer = 0;
        }
      } else if(boss.phase === 'tell'){
        boss.tellTimer += ts;
        const cycle = boss.tellTimer % TELL_CHOMP_FRAMES;
        const half = TELL_CHOMP_FRAMES * 0.5;
        const snapAmt = cycle < half ? (1 - cycle / half) : ((cycle - half) / half);
        boss.mouthOpen = Math.max(0.08, snapAmt);
        targetX = pl.x;
        targetY = pl.y;
        springK = 0.16;
        damping = 0.72;
        if(boss.tellTimer >= TELL_CHOMP_FRAMES * 2){
          boss.phase = 'lunging';
          boss.lungeTimer = 18;
          const dx = pl.x - boss.headX;
          const dy = pl.y - boss.headY;
          const d = Math.sqrt(dx*dx + dy*dy) || 1;
          boss.lungeVX = (dx / d) * LUNGE_SPEED;
          boss.lungeVY = (dy / d) * LUNGE_SPEED;
          boss.mouthOpen = 0.06;
        }
      } else if(boss.phase === 'lunging'){
        boss.headX += boss.lungeVX * ts;
        boss.headY += boss.lungeVY * ts;
        boss.lungeVX *= Math.pow(0.995, ts);
        boss.lungeVY *= Math.pow(0.995, ts);
        boss.lungeTimer -= ts;
        boss.contactDamageRadius = 28;
        boss.contactDamageText = '🌿 ELDER PLANT!';
        if(headDist < 28 && boss.hurtCooldown <= 0 && typeof deps.takeDamage === 'function'){
          deps.takeDamage(game, 1, '🌿 CHOMPED!');
          boss.hurtCooldown = 34;
        }
        clampHead(boss);
        if(boss.lungeTimer <= 0){
          boss.phase = 'recover';
          boss.timer = 0;
          boss.recoverTimer = 0;
        }
        return;
      } else if(boss.phase === 'recover'){
        boss.recoverTimer += ts;
        boss.mouthOpen = Math.min(1, boss.mouthOpen + 0.085 * ts);
        targetX = boss.x;
        targetY = boss.restY;
        springK = 0.16;
        damping = 0.74;
      }

      boss.headVX += (targetX - boss.headX) * springK * ts;
      boss.headVY += (targetY - boss.headY) * springK * ts;
      const damp = 1 - (1 - damping) * ts;
      boss.headVX *= damp;
      boss.headVY *= damp;
      boss.headX += boss.headVX * ts;
      boss.headY += boss.headVY * ts;
      clampHead(boss);

      if(boss.phase === 'recover'){
        const dxBack = boss.headX - boss.x;
        const dyBack = boss.headY - boss.restY;
        if(Math.sqrt(dxBack*dxBack + dyBack*dyBack) <= RECOVER_SNAP_DIST || boss.recoverTimer >= 28){
          boss.headX = boss.x;
          boss.headY = boss.restY;
          boss.headVX = 0;
          boss.headVY = 0;
          boss.phase = 'idle';
          boss.cooldown = 72;
          boss.mouthOpen = 1;
        }
      }
    },

    draw(ctx, boss, cam){
      if(!boss || !boss.active) return;
      const flash = boss.hurtTimer > 0 && Math.floor(boss.hurtTimer / 3) % 2 === 0;
      const bsx = boss.x;
      const bsy = boss.y - cam;
      const hsx = boss.headX;
      const hsy = boss.headY - cam;
      const open = boss.mouthOpen;

      ctx.save();
      ctx.scale(SCALE, SCALE);
      const bx = bsx / SCALE;
      const by = bsy / SCALE;
      const hx = hsx / SCALE;
      const hy = hsy / SCALE;

      const dx = hx - bx, dy = hy - by;
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      const perpX = -dy/len, perpY = dx/len;
      const bow = Math.abs(dx) * 0.28;
      const cpX = bx + dx*0.65 + perpX*bow;
      const cpY = by + dy*0.65 + perpY*bow;
      const stemSegs = 7;
      for(let i = 0; i <= stemSegs; i++){
        const t = i / stemSegs, mt = 1 - t;
        const sx = (mt*mt*bx + 2*mt*t*cpX + t*t*hx);
        const sy = (mt*mt*by + 2*mt*t*cpY + t*t*hy);
        const w = Math.max(3, (6 - t * 2));
        ctx.fillStyle = flash ? '#3a1208' : '#0c2008';
        ctx.fillRect(sx - (w/2+1), sy - 1, w + 2, 4);
      }
      for(let i = 0; i <= stemSegs; i++){
        const t = i / stemSegs, mt = 1 - t;
        const sx = (mt*mt*bx + 2*mt*t*cpX + t*t*hx);
        const sy = (mt*mt*by + 2*mt*t*cpY + t*t*hy);
        const w = Math.max(2, (5 - t * 1.5));
        ctx.fillStyle = flash ? '#8a2c1c' : '#1e5a10';
        ctx.fillRect(sx - (w/2), sy, w, 3);
      }
      for(let i = 0; i <= stemSegs; i++){
        const t = i / stemSegs, mt = 1 - t;
        const sx = (mt*mt*bx + 2*mt*t*cpX + t*t*hx);
        const sy = (mt*mt*by + 2*mt*t*cpY + t*t*hy);
        ctx.fillStyle = flash ? '#d45030' : '#3da020';
        ctx.fillRect(sx, sy, 2, 2);
      }

      const leafT = 0.42, leafMt = 1 - leafT;
      const leafX = (leafMt*leafMt*bx + 2*leafMt*leafT*cpX + leafT*leafT*hx);
      const leafY = (leafMt*leafMt*by + 2*leafMt*leafT*cpY + leafT*leafT*hy);
      const leafDir = dx > 0 ? -1 : 1;
      ctx.fillStyle = flash ? '#7a2410' : '#196010';
      ctx.fillRect(leafX + leafDir*1, leafY - 1, 8*leafDir, 3);
      ctx.fillRect(leafX + leafDir*2, leafY - 1, 10*leafDir, 1);
      ctx.fillStyle = flash ? '#b13e1f' : '#26801a';
      ctx.fillRect(leafX + leafDir*1, leafY - 1, 6*leafDir, 1);

      const jawGap = (open * 12);
      const loY = hy;
      const upY = loY - jawGap - 12;
      ctx.fillStyle = flash ? '#3f150c' : '#0d2a06';
      ctx.fillRect(hx - 10, loY - 1, 20, 9);
      ctx.fillStyle = flash ? '#7a2410' : '#1a5010';
      ctx.fillRect(hx - 9, loY, 18, 8);
      ctx.fillStyle = flash ? '#a93518' : '#236618';
      ctx.fillRect(hx - 8, loY + 1, 16, 6);
      if(open > 0.05){
        ctx.fillStyle = `rgba(170,28,18,${open * 0.92})`;
        ctx.fillRect(hx - 7, loY + 2, 14, 5);
      }
      ctx.fillStyle = '#dce8c0';
      for(let t = -6; t <= 6; t += 4) ctx.fillRect(hx + t - 1, loY - (1 + open * 3.5), 2, 3 + open * 3.5);

      ctx.fillStyle = flash ? '#3f150c' : '#0d2a06';
      ctx.fillRect(hx - 10, upY + 3, 20, 10);
      ctx.fillStyle = flash ? '#7a2410' : '#1a5010';
      ctx.fillRect(hx - 9, upY + 4, 18, 8);
      ctx.fillStyle = flash ? '#a93518' : '#236618';
      ctx.fillRect(hx - 8, upY + 5, 16, 6);
      ctx.fillStyle = flash ? '#5c1b10' : '#122808';
      ctx.fillRect(hx - 8, upY, 16, 6);
      if(open > 0.05){
        ctx.fillStyle = `rgba(150,22,12,${open * 0.85})`;
        ctx.fillRect(hx - 7, upY + 5, 14, 5);
      }
      ctx.fillStyle = '#dce8c0';
      for(let t = -6; t <= 6; t += 4) ctx.fillRect(hx + t - 1, upY + 9, 2, 3 + open * 3.5);

      const hunger = 1 - open;
      const eyePulse = 0.7 + 0.3 * Math.sin(boss.bobAngle * 0.9);
      const eyeA = (0.55 + hunger * 0.45) * eyePulse;
      ctx.fillStyle = `rgba(255,40,10,${eyeA})`;
      ctx.fillRect(hx - 7, upY + 1, 4, 4);
      ctx.fillRect(hx + 3, upY + 1, 4, 4);
      ctx.fillStyle = `rgba(255,180,80,${hunger * 0.6})`;
      ctx.fillRect(hx - 7, upY + 1, 1, 1);
      ctx.fillRect(hx + 3, upY + 1, 1, 1);

      for(let i=0;i<boss.hp;i++){
        ctx.fillStyle='rgba(80,220,60,0.95)';
        ctx.fillRect(hx - (boss.maxHp*2.5) + i*5, upY - 7, 3, 3);
      }

      ctx.restore();
    }
  };

  E.bossPlant = api;
  if(E.registry && E.registry.registerBoss) E.registry.registerBoss('boss_elder_plant', api);
})();
