(function(){
  'use strict';
  window.BIOMES = [
    {
      id: 'castle',
      name: 'Castle Heights',
      startScore: 0,
      endScore: 2499,
      platformStyle: 'stone',
      backgroundStyle: 'castle',
      musicLayer: 'main',
      enemyWeights: { bats: 1.0, mushrooms: 0.35, plants: 0.12, slimes: 0.0 },
      spikeWeight: 0.85,
      batTargetCount: 8,
      slimeCapScale: 0.0,
      render: {
        skyLow: [8, 8, 22],
        skyHigh: [12, 11, 32],
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
        ambientOverlay: null,
        fogColor: null,
        vignetteOuter: 'rgba(0,0,0,0.45)'
      }
    },
    {
      id: 'deep_keep',
      name: 'Deep Keep',
      startScore: 2500,
      endScore: 6499,
      platformStyle: 'stone',
      backgroundStyle: 'castle',
      musicLayer: 'keep_placeholder',
      enemyWeights: { bats: 0.95, mushrooms: 0.48, plants: 0.18, slimes: 0.55 },
      spikeWeight: 1.0,
      batTargetCount: 9,
      slimeCapScale: 0.8,
      render: {
        skyLow: [7, 9, 20],
        skyHigh: [11, 15, 30],
        wallBrickA: '#26231e',
        wallBrickB: '#22201c',
        wallBrickC: '#1e1b17',
        wallMortar: '#11100e',
        sideWallA: '#34322f',
        sideWallB: '#2d2a27',
        sideWallTrim: '#4c585f',
        platformBase: '#403f3d',
        platformTop: '#5e6768',
        platformTop2: '#6b7475',
        platformDetail: '#4a4b48',
        platformCrack: '#2a2c29',
        platformShadow: 'rgba(0,0,0,0.3)',
        ambientOverlay: 'rgba(40,60,70,0.05)',
        fogColor: 'rgba(90,120,130,0.06)',
        vignetteOuter: 'rgba(0,8,12,0.5)'
      }
    },
    {
      id: 'crypt',
      name: 'Crypt Depths',
      startScore: 6500,
      endScore: 999999,
      platformStyle: 'stone',
      backgroundStyle: 'castle',
      musicLayer: 'crypt_placeholder',
      enemyWeights: { bats: 0.75, mushrooms: 0.62, plants: 0.24, slimes: 1.0 },
      spikeWeight: 1.15,
      batTargetCount: 7,
      slimeCapScale: 1.0,
      render: {
        skyLow: [5, 8, 14],
        skyHigh: [8, 14, 22],
        wallBrickA: '#20221d',
        wallBrickB: '#1b1d19',
        wallBrickC: '#171915',
        wallMortar: '#0d0f0d',
        sideWallA: '#2a302d',
        sideWallB: '#232926',
        sideWallTrim: '#496058',
        platformBase: '#39403b',
        platformTop: '#5b6b60',
        platformTop2: '#66786b',
        platformDetail: '#424c45',
        platformCrack: '#253028',
        platformShadow: 'rgba(0,0,0,0.34)',
        ambientOverlay: 'rgba(28,70,46,0.07)',
        fogColor: 'rgba(80,150,100,0.09)',
        vignetteOuter: 'rgba(0,18,8,0.52)'
      }
    }
  ];
  window.getBiomeForScore = function(score){
    const absScore = Math.abs(score || 0);
    return window.BIOMES.find(b => absScore >= b.startScore && absScore <= b.endScore) || window.BIOMES[0];
  };
})();
