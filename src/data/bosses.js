(function(){
  'use strict';

  const G = window;

  G.BOSSES = {
    elder_bat: {
      id: 'elder_bat',
      entityType: 'boss_elder_bat',
      name: 'Elder Bat',
      triggerScores: [1500, -1500],
      arenaHeight: 320,
      hp: 5,
      rewardCoins: 160,
      unlockRelic: 'hallowed_resonator'
    },
    elder_plant: {
      id: 'elder_plant',
      entityType: 'boss_elder_plant',
      name: 'Elder Plant',
      triggerScores: [2500],
      hp: 7,
      rewardCoins: 220,
      unlockRelic: 'eldritch_vine'
    }
  };

  G.bossesDefeated = G.bossesDefeated || {};
  G.getBossDef = function(id){
    return (G.BOSSES && G.BOSSES[id]) || null;
  };
  G.getBossDefs = function(){
    return G.BOSSES || {};
  };
})();
