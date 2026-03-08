(function(){
  'use strict';

  const G = window;
  const BIOME_TRANSITION_TICKS = 90;

  function getBiomeById(id){
    return (G.BIOMES || []).find(b => b.id === id) || null;
  }

  function getCurrentBiome(s){
    if(!s) return (G.BIOMES && G.BIOMES[0]) || null;
    const byScore = G.getBiomeForScore ? G.getBiomeForScore(s.score) : null;
    if(byScore) return byScore;
    if(s.biomeId) return getBiomeById(s.biomeId);
    return (G.BIOMES && G.BIOMES[0]) || null;
  }

  function getSpawnWeightForScore(score, type){
    const biome = G.getBiomeForScore ? G.getBiomeForScore(score) : null;
    if(!biome || !biome.enemyWeights) return 1;
    const raw = biome.enemyWeights[type];
    return raw == null ? 1 : raw;
  }

  function getSpawnWeight(s, type){
    const biome = getCurrentBiome(s);
    if(!biome || !biome.enemyWeights) return 1;
    const raw = biome.enemyWeights[type];
    return raw == null ? 1 : raw;
  }

  function getBatTargetCount(s){
    const biome = getCurrentBiome(s);
    return biome && biome.batTargetCount != null ? biome.batTargetCount : 8;
  }

  function getSlimeCapScale(s){
    const biome = getCurrentBiome(s);
    return biome && biome.slimeCapScale != null ? biome.slimeCapScale : 1;
  }

  function getSpikeWeightForScore(score){
    const biome = G.getBiomeForScore ? G.getBiomeForScore(score) : null;
    return biome && biome.spikeWeight != null ? biome.spikeWeight : 1;
  }

  function update(s){
    if(!s) return;
    const prev = s.biomeId;
    const biome = getCurrentBiome(s);
    if(!biome) return;

    if(s.biomeTransitionTimer > 0) s.biomeTransitionTimer--;

    s.biomeId = biome.id;
    if(!s.lastBiomeId) s.lastBiomeId = biome.id;
    if(!s.renderPrevBiomeId) s.renderPrevBiomeId = biome.id;
    if(!s.biomeTransitionMax) s.biomeTransitionMax = BIOME_TRANSITION_TICKS;

    if(prev && prev !== biome.id){
      s.lastBiomeId = prev;
      s.renderPrevBiomeId = prev;
      s.biomeTransitionTimer = BIOME_TRANSITION_TICKS;
      s.biomeTransitionMax = BIOME_TRANSITION_TICKS;
      if(typeof G.addFloat === 'function'){
        G.addFloat(G.W * 0.5, G.H * 0.18, '✦ ' + biome.name.toUpperCase() + ' ✦', '#b8d6ff');
      }
    } else if(s.biomeTransitionTimer <= 0){
      s.renderPrevBiomeId = biome.id;
    }
  }

  G.CastleBiomes = {
    getBiomeById,
    getCurrentBiome,
    getSpawnWeight,
    getSpawnWeightForScore,
    getBatTargetCount,
    getSlimeCapScale,
    getSpikeWeightForScore,
    update
  };
})();
