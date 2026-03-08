(function(){
  'use strict';
  const G = window;

  G.ARTIFACTS = {
    chronos_seal: {
      id:'chronos_seal',
      name:'Chronos Seal',
      icon:'⏳', sprite:'chronos_seal',
      desc:'Freezes enemies and halts new spawns for a short time.',
      baseCharges:1,
      baseDuration:180
    }
  };

  G.ARTIFACT_SHOP_UPGRADES = [
    {
      id:'chronos_seal',
      name:'CHRONOS SEAL',
      desc:'Longer freeze and better starting charges',
      icon:'⏳',
      baseCost:1500,
      costMult:1.85,
      maxLvl:8
    }
  ];
})();
