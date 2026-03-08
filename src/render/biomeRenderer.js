(function(){
  'use strict';

  const G = window;
  const DEFAULT_PALETTE = {
    skyLow: [8, 8, 22],
    skyHigh: [12, 11, 32],
    moonGlow: 'rgba(255,240,180,0.12)',
    moonMain: '#fffde0',
    moonShade: '#eeeac0',
    star: '255,245,200',
    wallBrickA: '#2a2520',
    wallBrickB: '#252018',
    wallBrickC: '#221e15',
    wallMortar: '#141210',
    sideWallA: '#3a3530',
    sideWallB: '#332f2a',
    sideWallTrim: '#555',
    platformBase: '#44403a',
    platformTop: '#6a6258',
    platformTop2: '#7a7268',
    platformDetail: '#50483e',
    platformCrack: '#33302a',
    platformShadow: 'rgba(0,0,0,0.25)',
    platformIcyBase: '#445566',
    platformIcyTop: '#7aaccc',
    platformIcyTop2: '#aaddee',
    platformIcySpark: '#cceeff',
    platformIcyShade: '#334455',
    torchMetal: '#555',
    torchMetalHi: '#888',
    torchWood: '#886633',
    torchGlowCore: 'rgba(255,160,0,0.25)',
    torchGlowEdge: 'rgba(255,80,0,0)',
    flameOuter: 'rgba(255,60,0,0.9)',
    flameMid: 'rgba(255,180,0,0.9)',
    flameInner: 'rgba(255,255,180,0.8)',
    ambientOverlay: null,
    fogColor: null,
    vignetteOuter: 'rgba(0,0,0,0.45)'
  };

  function lerp(a,b,t){ return a + (b-a) * t; }
  function mixColor(a,b,t){
    if(!a && !b) return null;
    if(!a) return b;
    if(!b) return a;
    const isHex = (v) => typeof v === 'string' && /^#([0-9a-f]{6})$/i.test(v);
    if(isHex(a) && isHex(b)){
      const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
      const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
      const pc = pa.map((v,i)=>Math.round(lerp(v,pb[i],t)).toString(16).padStart(2,'0')).join('');
      return '#' + pc;
    }
    return t < 0.5 ? a : b;
  }

  function getCurrentBiome(s){
    return G.CastleBiomes && G.CastleBiomes.getCurrentBiome ? G.CastleBiomes.getCurrentBiome(s) : null;
  }

  function getTransitionState(s){
    const current = getCurrentBiome(s) || { id:'castle' };
    const prevId = s && s.renderPrevBiomeId ? s.renderPrevBiomeId : current.id;
    const prev = (G.CastleBiomes && G.CastleBiomes.getBiomeById) ? G.CastleBiomes.getBiomeById(prevId) : current;
    let blend = 1;
    if(s && s.biomeTransitionTimer && s.biomeTransitionMax){
      blend = 1 - Math.max(0, Math.min(1, s.biomeTransitionTimer / Math.max(1, s.biomeTransitionMax)));
    }
    return { current, prev: prev || current, blend };
  }

  function getPaletteForBiome(biome){
    return Object.assign({}, DEFAULT_PALETTE, biome && biome.render ? biome.render : {});
  }

  function getPalette(s){
    const { current, prev, blend } = getTransitionState(s);
    const a = getPaletteForBiome(prev);
    const b = getPaletteForBiome(current);
    const out = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach((key) => {
      const av = a[key], bv = b[key];
      if(Array.isArray(av) && Array.isArray(bv)) out[key] = av.map((v,i)=>Math.round(lerp(v, bv[i], blend)));
      else out[key] = mixColor(av, bv, blend);
    });
    out.biomeId = current && current.id || 'castle';
    out.musicLayer = current && current.musicLayer || 'main';
    out.platformStyle = current && current.platformStyle || 'stone';
    return out;
  }

  function drawAmbientFx(ctx, s){
    const p = getPalette(s);
    if(p.ambientOverlay){
      ctx.fillStyle = p.ambientOverlay;
      ctx.fillRect(0,0,G.W,G.H);
    }
    if(p.fogColor){
      const bandOffset = ((s && s.tick ? s.tick : 0) * 0.35) % (G.H + 120);
      for(let i=0;i<3;i++){
        const y = ((bandOffset + i * 160) % (G.H + 120)) - 60;
        const grad = ctx.createLinearGradient(0, y, 0, y + 70);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, p.fogColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, G.W, 70);
      }
    }
  }

  G.CastleBiomeRender = {
    getPalette,
    getTransitionState,
    drawAmbientFx
  };
})();
