(function(){
  'use strict';
  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};

  const DIVE_SPEED = 4.6;
  const IDLE_SPEED = 0.95;

  const api = {
    id: 'boss_elder_bat',

    create(opts={}){
      return {
        id: opts.id || `elder_bat_${Date.now()}`,
        type: 'boss_elder_bat',
        x: opts.x ?? 180,
        y: opts.y ?? -5000,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0,
        dvx: 0,
        dvy: 0,
        hp: opts.hp ?? 5,
        maxHp: opts.hp ?? 5,
        phase: 'intro',
        timer: 0,
        active: true,
        arenaTop: opts.arenaTop ?? ((opts.y ?? -5000) - 260),
        arenaBottom: opts.arenaBottom ?? ((opts.y ?? -5000) + 180),
        cooldown: 0,
        flap: Math.random() * Math.PI * 2,
        name: opts.name || 'Elder Bat',
        dead: false,
        agroTimer: 0,
        retreatTimer: 0,
        hurtTimer: 0,
      };
    },

    update(boss, game, deps={}){
      if(!boss || !boss.active) return;
      const ts = deps.timeScale || 1;
      boss.timer += ts;
      boss.flap += 0.22 * ts;
      if(boss.cooldown > 0) boss.cooldown -= ts;
      if(boss.hurtTimer > 0) boss.hurtTimer -= ts;

      const pl = game.pl;
      if(!pl) return;

      const minX = G.WALL + 18;
      const maxX = G.W - G.WALL - 18;
      const minY = boss.arenaTop + 26;
      const maxY = boss.arenaBottom - 26;

      const clampX = ()=>{
        boss.x = Math.max(minX, Math.min(maxX, boss.x));
      };

      const clampArena = ()=>{
        clampX();
        boss.y = Math.max(minY, Math.min(maxY, boss.y));
      };

      if(boss.phase === 'intro'){
        const targetX = Math.max(minX, Math.min(maxX, pl.x + (pl.x < G.W * 0.5 ? 80 : -80)));
        const targetY = Math.max(minY, Math.min(maxY, pl.y - 90));
        boss.vx += (targetX - boss.x) * 0.014 * ts;
        boss.vy += (targetY - boss.y) * 0.010 * ts;
        boss.vx *= 0.90;
        boss.vy *= 0.90;
        boss.x += boss.vx * ts;
        boss.y += boss.vy * ts;
        clampArena();
        if(boss.timer > 45){
          boss.phase = 'idle';
          boss.timer = 0;
          boss.vx = (Math.random() - 0.5) * IDLE_SPEED * 2;
          boss.vy = 0;
        }
        return;
      }

      if(boss.phase === 'idle'){
        boss.x += boss.vx * ts;
        boss.y += Math.sin(boss.flap * 0.25) * 0.35 * ts;

        if(boss.x < minX || boss.x > maxX){
          boss.x = Math.max(minX, Math.min(maxX, boss.x));
          boss.vx *= -1;
        }
        boss.vx = Math.max(-IDLE_SPEED, Math.min(IDLE_SPEED, boss.vx));

        const hoverTargetY = Math.max(minY, Math.min(maxY, pl.y - 85));
        boss.y += (hoverTargetY - boss.y) * 0.018 * ts;
        clampArena();

        if(boss.timer > 22){
          boss.phase = 'agro';
          boss.agroTimer = 40;
          boss.timer = 0;
        }
        return;
      }

      if(boss.phase === 'agro'){
        boss.flap += 0.16 * ts;
        if(Math.floor(boss.agroTimer) % 6 === 0){
          boss.vx += (Math.random() - 0.5) * 3.0;
          boss.y  += (Math.random() - 0.5) * 2.6;
        }
        boss.vx *= 0.88;
        boss.x  += boss.vx * 1.5 * ts;
        boss.y  += (Math.random() - 0.5) * 0.7 * ts;

        if(boss.x < minX || boss.x > maxX){
          boss.x = Math.max(minX, Math.min(maxX, boss.x));
          boss.vx *= -1;
        }
        clampArena();

        boss.agroTimer -= ts;
        if(boss.agroTimer <= 0){
          boss.phase = 'diving';
          const dx = pl.x - boss.x;
          const dy = pl.y - boss.y;
          const d = Math.sqrt(dx*dx + dy*dy) || 1;
          boss.dvx = (dx / d) * DIVE_SPEED;
          boss.dvy = (dy / d) * DIVE_SPEED;
        }
        return;
      }

      if(boss.phase === 'diving'){
        boss.x += boss.dvx * ts;
        boss.y += boss.dvy * ts;

        const dx = pl.x - boss.x;
        const dy = pl.y - boss.y;
        if(Math.sqrt(dx*dx + dy*dy) < 24){
          if(typeof deps.takeDamage === 'function') deps.takeDamage(game, 1, '🦇 ELDER BAT!');
          boss.phase = 'retreating';
          boss.retreatTimer = 28;
          boss.dvx *= -0.7;
          boss.dvy = -3.4;
          boss.hurtTimer = Math.max(boss.hurtTimer || 0, 14);
          return;
        }

        if(boss.x < minX || boss.x > maxX || boss.y < boss.arenaTop - 120 || boss.y > boss.arenaBottom + 120){
          boss.phase = 'retreating';
          boss.retreatTimer = 24;
          boss.dvx *= -0.55;
          boss.dvy = -2.4;
          clampX();
        }
        return;
      }

      if(boss.phase === 'retreating'){
        boss.x += boss.dvx * 0.88 * ts;
        boss.y += boss.dvy * ts;
        boss.dvx *= 0.90;
        boss.dvy *= 0.88;
        clampX();

        boss.retreatTimer -= ts;
        if(boss.retreatTimer <= 0){
          boss.phase = 'agro';
          boss.agroTimer = 24;
          boss.vx = (Math.random() - 0.5) * 1.8;
          boss.vy = 0;
        }
      }
    },

    draw(ctx, boss, cam){
      if(!boss || !boss.active) return;
      const sx = boss.x;
      const sy = boss.y - cam;
      const S = 4;
      const flash = boss.hurtTimer > 0 && Math.floor(boss.hurtTimer / 3) % 2 === 0;
      const wing = Math.round(Math.sin(boss.flap) * 2) * S;
      const isAgro = boss.phase === 'agro';
      const isDiving = boss.phase === 'diving';
      const isRetreating = boss.phase === 'retreating';
      const redFlash = flash || isAgro || isDiving || isRetreating;

      const bodyDark = redFlash ? (isDiving ? '#3d0c0c' : '#3a0e0e') : '#2a2040';
      const bodyMid  = redFlash ? (isDiving ? '#661010' : '#5c1a1a') : '#3d3060';
      const eyeColor = isDiving ? '#ff6600' : redFlash ? '#ff1111' : '#cc0000';

      ctx.save();
      ctx.translate(Math.round(sx), Math.round(sy));

      ctx.fillStyle = bodyDark;
      ctx.fillRect(-3*S, -2*S, 6*S, 5*S);
      ctx.fillRect(-12*S, -2*S + wing, 9*S, 4*S);
      ctx.fillRect(  3*S, -2*S + wing, 9*S, 4*S);
      ctx.fillRect(-14*S,  1*S + wing, 3*S, 2*S);
      ctx.fillRect( 11*S,  1*S + wing, 3*S, 2*S);

      ctx.fillStyle = bodyMid;
      ctx.fillRect(-11*S, -1*S + wing, 7*S, 2*S);
      ctx.fillRect(  4*S, -1*S + wing, 7*S, 2*S);

      ctx.fillStyle = bodyDark;
      ctx.fillRect(-2*S, 3*S, 1*S, 3*S);
      ctx.fillRect( 1*S, 3*S, 1*S, 3*S);

      ctx.fillStyle = eyeColor;
      ctx.fillRect(-2*S, -1*S, 1*S, 1*S);
      ctx.fillRect( 1*S, -1*S, 1*S, 1*S);

      if(redFlash){
        ctx.fillStyle = '#ff9999';
        ctx.fillRect(-2*S + 1, -1*S + 1, Math.max(1, S - 2), Math.max(1, S - 2));
        ctx.fillRect( 1*S + 1, -1*S + 1, Math.max(1, S - 2), Math.max(1, S - 2));
      }

      ctx.restore();
    }
  };

  E.bossGargoyle = api;
  if(E.registry && E.registry.registerBoss) E.registry.registerBoss('boss_elder_bat', api);
})();
