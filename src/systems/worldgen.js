(function(){
  'use strict';

  const G = window;

  const hashY = (...args) => G.hashY(...args);
  const hash2 = (...args) => G.hash2(...args);
  const platId = (...args) => G.platId(...args);
  const mushroomXForPlat = (...args) => G.mushroomXForPlat(...args);
  const plantXForPlat = (...args) => G.plantXForPlat(...args);
  const getPlatSpikes = (...args) => G.getPlatSpikes(...args);
  const addP = (...args) => G.addP(...args);
  const tryPlaceCoin = (...args) => G.tryPlaceCoin(...args);
  const tryPlaceHeart = (...args) => G.tryPlaceHeart(...args);
  const tryPlaceMushroom = (...args) => G.tryPlaceMushroom(...args);
  const tryPlacePlant = (...args) => G.tryPlacePlant(...args);
  const upgVal = (...args) => G.upgVal(...args);
  const heartSpawnRate = (...args) => G.heartSpawnRate(...args);
  const takeDamage = (...args) => G.takeDamage(...args);
  const mkBat = (...args) => G.mkBat(...args);
  const mkSlime = (...args) => G.mkSlime(...args);
  const tryPlaceChest = (...args) => G.CastleChests && G.CastleChests.tryPlaceChest && G.CastleChests.tryPlaceChest(...args);
  const W = G.W, H = G.H, WALL = G.WALL;
  const MUSH_START = G.MUSH_START, MUSH_FULL = G.MUSH_FULL, MUSH_MAX_DENSITY = G.MUSH_MAX_DENSITY;
  const PLANT_START = G.PLANT_START, PLANT_FULL = G.PLANT_FULL, PLANT_MAX_DENSITY = G.PLANT_MAX_DENSITY;
  const SLIME_START = G.SLIME_START, SLIME_MAX = G.SLIME_MAX, SLIME_DEAD_FRAMES = G.SLIME_DEAD_FRAMES;
  const SPIKE_START = G.SPIKE_START = 300;
  const SPIKE_FULL = G.SPIKE_FULL = 8000;
  const SPIKE_SLOT = G.SPIKE_SLOT = 13;
  const SPIKE_MAX_FILL = G.SPIKE_MAX_FILL = 0.88;

G.hashY = function(y){let h=Math.sin(y*127.1+311.7)*43758.5453;return h-Math.floor(h);}
G.hash2 = function(a,b){let h=Math.sin(a*127.1+b*311.7+92.3)*43758.5453;return h-Math.floor(h);}

G.platId = function(wy){return Math.round(wy/10);}

// ── Spike helpers ─────────────────────────────────────────────────────────────

G.mushroomXForPlat = function(p){
  if(p.safe || p.checkpoint) return null;
  const absScore = Math.abs(p.y) / 10;
  if(absScore < MUSH_START) return null;
  const biomeWeight = G.CastleBiomes ? G.CastleBiomes.getSpawnWeightForScore(absScore, 'mushrooms') : 1;
  if(biomeWeight <= 0) return null;
  const density = Math.min(1, (absScore - MUSH_START) / (MUSH_FULL - MUSH_START));
  if(hash2(p.id*53+7, 99) > density * MUSH_MAX_DENSITY * biomeWeight) return null;
  return p.x + 10 + hash2(p.id, 88) * (p.w - 20);
}

G.plantXForPlat = function(p){
  if(p.safe || p.checkpoint) return null;
  const absScore = Math.abs(p.y) / 10;
  if(absScore < PLANT_START) return null;
  if(p.w < 30) return null;
  const biomeWeight = G.CastleBiomes ? G.CastleBiomes.getSpawnWeightForScore(absScore, 'plants') : 1;
  if(biomeWeight <= 0) return null;
  const density = Math.min(1, (absScore - PLANT_START) / (PLANT_FULL - PLANT_START));
  if(hash2(p.id*71+3, 55) > density * PLANT_MAX_DENSITY * biomeWeight) return null;
  return p.x + 14 + hash2(p.id, 66) * (p.w - 28);
}

G.getPlatSpikes = function(p) {
  if (p.safe || p.checkpoint) return [];

  const absScore = Math.abs(p.y) / 10;
  if (absScore < SPIKE_START) return [];
  const density = Math.min(1, (absScore - SPIKE_START) / (SPIKE_FULL - SPIKE_START));
  const biomeSpikeWeight = G.CastleBiomes ? G.CastleBiomes.getSpikeWeightForScore(absScore) : 1;
  const fillChance = Math.min(1, density * SPIKE_MAX_FILL * biomeSpikeWeight);
  const slots = Math.floor((p.w - 4) / SPIKE_SLOT);
  if (slots === 0) return [];
  const spikes = [];
  for (let i = 0; i < slots; i++) {
    if (hash2(p.id * 97 + i, 77) < fillChance) {
      const sx = p.x + 2 + SPIKE_SLOT * 0.5 + i * SPIKE_SLOT;
      const torchX = p.torch ? (p.x + p.w/2) : null;
      const mushX  = mushroomXForPlat(p);
      const plantX = plantXForPlat(p);
      const nearTorch = (torchX !== null) && Math.abs(sx - torchX) < 10;
      const nearMush  = (mushX  !== null) && Math.abs(sx - mushX)  < 10;
      const nearPlant = (plantX !== null) && Math.abs(sx - plantX) < 12;
      if(!nearTorch && !nearMush && !nearPlant) spikes.push(sx);
    }
  }
  return spikes;
}

G.checkSpikeCollision = function(s) {
  const pl = s.pl;
  if (pl.hurtTimer > 0) return;
  const plB  = pl.y + pl.h / 2;
  const plL  = pl.x - pl.w / 2 + 3;
  const plR  = pl.x + pl.w / 2 - 3;
  const SPIKE_H = 9;
  for (const p of s.plats) {
    if (plB < p.y - SPIKE_H - 1 || plB > p.y + 3) continue;
    if (plR < p.x || plL > p.x + p.w) continue;
    const spikes = getPlatSpikes(p);
    for (const sx of spikes) {
      if (plR > sx - 4 && plL < sx + 4) {
        takeDamage(s, 1, '🩸 SPIKED!');
        pl.vy = Math.min(pl.vy, -2.6);
        const dir = (pl.x < sx) ? -1 : 1;
        pl.spikeDir = dir;
        pl.spikeKnock = 6;
        pl.vx = dir * Math.max(Math.abs(pl.vx), 1.4);
        pl.x += dir * 2;
        return;
      }
    }
  }
}

G.gen = function(s){
  const margin=H*0.75;
  const top=s.cam-margin, bot=s.cam+H+margin;
  let mn=Infinity,mx=-Infinity;
  for(const p of s.plats){if(p.y<mn)mn=p.y;if(p.y>mx)mx=p.y;}
  if(!s.plats.length){mn=s.pl.y;mx=s.pl.y;}
  let y=mx; while(y<bot){y+=65+Math.random()*85;if(y<bot)addP(s,y);}
  y=mn;     while(y>top){y-=65+Math.random()*85;if(y>top)addP(s,y);}
  const coinMargin=H*0.55;
  const ctop=s.cam-coinMargin, cbot=s.cam+H+coinMargin;
  const COIN_BAND=80, HEART_BAND=320;
  const cb0=Math.floor(ctop/COIN_BAND), cb1=Math.ceil(cbot/COIN_BAND);
  for(let b=cb0;b<=cb1;b++) tryPlaceCoin(s,b*COIN_BAND,b);
  const hb0=Math.floor(ctop/HEART_BAND), hb1=Math.ceil(cbot/HEART_BAND);
  for(let b=hb0;b<=hb1;b++) tryPlaceHeart(s,b*HEART_BAND,b);
  const idle=s.bats.filter(bt=>bt.state==='idle').length;
  const batTarget = G.CastleBiomes ? G.CastleBiomes.getBatTargetCount(s) : 8;
  if(!(s.spawnFreezeTimer > 0)){
    let add=batTarget-idle; while(add-->0) s.bats.push(mkBat(s.cam+(Math.random()-.5)*H*2,s.pl.y));
  }

  // Spawn slimes when in range and pool is low
  const absScoreNow = Math.abs(s.score);
  const slimeWeight = G.CastleBiomes ? G.CastleBiomes.getSpawnWeight(s, 'slimes') : 1;
  if(absScoreNow >= SLIME_START && slimeWeight > 0 && !(s.spawnFreezeTimer > 0)){
    // Ramp from 1 up to SLIME_MAX over the next 4000 score after SLIME_START
    const rampT   = Math.min(1, (absScoreNow - SLIME_START) / 4000);
    const biomeScale = G.CastleBiomes ? G.CastleBiomes.getSlimeCapScale(s) : 1;
    const capNow  = Math.max(1, Math.round(rampT * SLIME_MAX * biomeScale));
    const liveSlimes = s.slimes.filter(sl=>!sl.dead).length;
    let toSpawn = capNow - liveSlimes;
    while(toSpawn-- > 0){
      // Only use platforms just off-screen so slimes walk/hop into view naturally.
      // Allow a small band above AND below the viewport.
      const candidates = s.plats.filter(p => {
        if(p.safe || p.checkpoint) return false;
        if(p.w < 24) return false;
        const sy = p.y - s.cam;
        const offTop    = sy >= -(H * 0.55) && sy < -30;   // just above screen
        const offBottom = sy >  H + 30      && sy <= H * 1.55; // just below screen
        return offTop || offBottom;
      });
      if(!candidates.length) break;
      const p  = candidates[Math.floor(Math.random() * candidates.length)];
      const sx = p.x + 12 + Math.random() * (p.w - 24);
      s.slimes.push(mkSlime(sx, p.y));
    }
  }
}


G.platOverlap = function(s,wx,wy,r){
  for(const p of s.plats)
    if(wx+r>p.x&&wx-r<p.x+p.w&&wy+r>p.y-2&&wy-r<p.y+p.h+2) return true;
  return false;
}

G.tryPlaceCoin = function(s,wy,band){
  const spawnChance=Math.min(0.9,0.42+upgVal('coinrate')*0.18);
  if(hash2(band,42)>spawnChance) return;
  if(s.collectedCoins.has(band)) return;
  if(s.coins.some(c=>c.id===band)) return;
  const wx=WALL+14+hash2(band,40)*(W-WALL*2-28);
  let cy=wy+hash2(band,43)*30-15;
  for(let i=0;i<8;i++){if(!platOverlap(s,wx,cy,9))break;cy-=12;}
  s.coins.push({x:wx,y:cy,collected:false,bob:hash2(band,41)*Math.PI*2,id:band});
}

G.tryPlaceHeart = function(s,wy,band){
  const hid='ht'+band;
  if(s.collectedHearts.has(hid)) return;
  if(s.hearts.some(h=>h.id===hid)) return;
  if(hash2(band,50)>heartSpawnRate()) return;
  const wx=WALL+18+hash2(band,51)*(W-WALL*2-36);
  let cy=wy+hash2(band,53)*40-20;
  for(let i=0;i<8;i++){if(!platOverlap(s,wx,cy,11))break;cy-=14;}
  s.hearts.push({x:wx,y:cy,collected:false,bob:hash2(band,52)*Math.PI*2,id:hid});
}

G.tryPlaceMushroom = function(s, p){
  const api = G.CastleEntities && G.CastleEntities.mushrooms;
  if(api && api.createForPlatform){
    const m = api.createForPlatform(s, p);
    if(m) s.mushrooms.push(m);
    return;
  }
  if(p.safe || p.checkpoint) return;
}

// ── Carnivorous Plant placement ───────────────────────────────────────────────
G.tryPlacePlant = function(s, p){
  if(p.safe || p.checkpoint) return;

  const absScore = Math.abs(p.y) / 10;
  if(absScore < PLANT_START) return;
  if(s.mushrooms.some(m=>m.platId===p.id)) return;
  if(s.plants.some(pl=>pl.platId===p.id)) return;
  if(p.w < 30) return;
  const biomeWeight = G.CastleBiomes ? G.CastleBiomes.getSpawnWeightForScore(absScore, 'plants') : 1;
  if(biomeWeight <= 0) return;
  const density = Math.min(1, (absScore - PLANT_START) / (PLANT_FULL - PLANT_START));
  if(hash2(p.id*71+3, 55) > density * PLANT_MAX_DENSITY * biomeWeight) return;
  const px = p.x + 14 + hash2(p.id, 66) * (p.w - 28);
  const restY = p.y - 22;
  s.plants.push({
    x: px, y: p.y,
    platId: p.id,
    state: 'open',
    mouthOpen: 1.0,
    snapTimer: 0,
    bobAngle: hash2(p.id, 93) * Math.PI * 2,
    hurtCooldown: 0,
    absScore,
    headX: px,
    headY: restY,
    headVX: 0,
    headVY: 0,
    restY,
    hp: 3, severed: false, headAngle: 0, headSpin: 0,
  });
}

G.addP = function(s,wy){
  const id=platId(wy);
  if(s.plats.some(p=>p.id===id)) return;
  const avail=W-WALL*2;
  const rng1=hash2(id,1),rng2=hash2(id,2),rng3=hash2(id,3),rng4=hash2(id,4);
  const w=52+rng1*84, x=WALL+6+rng2*(avail-w-12);
  const icy=rng3<0.18, torch=!icy&&rng4<0.3;
  const biome = G.getBiomeForScore ? G.getBiomeForScore(Math.abs(wy) / 10) : null;
  const p={x,y:wy,w,h:14,icy,torch,id,biomeId: biome ? biome.id : null};
  s.plats.push(p);
  if(!(s.spawnFreezeTimer > 0)){
    tryPlaceMushroom(s, p);
    tryPlacePlant(s, p);
  }
  tryPlaceChest(s, p);
}

G.cull = function(s){
  const margin=H*0.75;
  const t=s.cam-margin, b=s.cam+H+margin;
  s.plats=s.plats.filter(p=>p.y>t&&p.y<b);
  s.coins=s.coins.filter(c=>!c.collected&&c.y>t&&c.y<b);
  s.hearts=s.hearts.filter(h=>!h.collected&&h.y>t&&h.y<b);
  s.bats=s.bats.filter(bt=>{
    if(bt.state==='dead') return bt.wy - s.cam < H + 250; // keep until fallen off
    return bt.wy>t-H*1.5&&bt.wy<b+H*1.5;
  });
  s.mushrooms=s.mushrooms.filter(m=>{
    if(m.dead) return m.burstCloud && m.burstCloud.timer > 0; // keep while burst active
    return m.y>t&&m.y<b;
  });
  s.plants=s.plants.filter(pl=>{
    if(pl.severed) return (pl.headY - s.cam) < H + 250; // keep until head falls off
    return pl.y>t&&pl.y<b;
  });
  s.slimes=s.slimes.filter(sl=>{
    if(sl.dead) return sl.deadTimer < SLIME_DEAD_FRAMES;
    return sl.y > t - 80 && sl.y < b + 300;
  });
  s.chests=(s.chests||[]).filter(ch=>!ch.opened && ch.y>t-40 && ch.y<b+40);
  s.lootDrops=(s.lootDrops||[]).filter(d=>!d.collected && d.y>t-80 && d.y<b+80);
  s.artifactPickups=(s.artifactPickups||[]).filter(p=>!p.collected && p.y>t-40 && p.y<b+40);
}
})();
