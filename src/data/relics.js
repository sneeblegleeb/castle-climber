(function(){
  'use strict';
  const G = window;

  G.RELICS = {
    divine_shield: {
      id:'divine_shield',
      name:'Divine Shield',
      icon:'🛡', sprite:'divine_shield',
      desc:'Absorbs hits and slowly restores its wards.',
      unlockSource:'gargoyle_first_kill',
      baseCharges:3,
      baseRegenFrames:480
    },
    hallowed_resonator: {
      id:'hallowed_resonator',
      name:'Hallowed Resonator',
      icon:'📯', sprite:'hallowed_resonator',
      desc:'Aim the next click or stick tilt to send a holy shockwave.',
      unlockSource:'elder_bat_first_kill',
      baseCooldownFrames:600,
      baseWidth:18,
      baseSpeed:9.5,
      baseRange:320
    },
    eldritch_vine: {
      id:'eldritch_vine',
      name:'Eldritch Vine',
      icon:'🌿', sprite:'eldritch_vine',
      desc:'Slows time, then fires a vine grapple that drags you to the chosen point through platforms.',
      unlockSource:'elder_plant_first_kill',
      baseCooldownFrames:720,
      baseSlowFrames:180,
      baseSlowScale:0.25,
      basePullSpeed:14
    }
  };

  G.RELIC_SHOP_UPGRADES = [
    {
      id:'divine_shield',
      name:'DIVINE SHIELD',
      desc:'More wards and faster restoration',
      icon:'🛡', sprite:'divine_shield',
      baseCost:2200,
      costMult:1.9,
      maxLvl:10
    },
    {
      id:'hallowed_resonator',
      name:'HALLOWED RESONATOR',
      desc:'Faster recharge and wider, longer shockwaves',
      icon:'📯', sprite:'hallowed_resonator',
      baseCost:2600,
      costMult:1.95,
      maxLvl:10
    },
    {
      id:'eldritch_vine',
      name:'ELDRITCH VINE',
      desc:'Faster recharge, longer time slow, stronger pull',
      icon:'🌿', sprite:'eldritch_vine',
      baseCost:3000,
      costMult:2.0,
      maxLvl:10
    }
  ];
})();
