(function(){
  'use strict';
  window.SKINS = {
    knight: {
      id: 'knight',
      name: 'Knight',
      spriteSet: 'default_knight',
      attackFx: 'gold_arc',
      trailStyle: 'default',
      unlock: { type: 'default' }
    },
    blackKnight: {
      id: 'blackKnight',
      name: 'Black Knight',
      spriteSet: 'black_knight',
      attackFx: 'ember_arc',
      trailStyle: 'ash',
      unlock: { type: 'coins', amount: 1200 }
    }
  };
  window.selectedSkinId = 'knight';
})();
