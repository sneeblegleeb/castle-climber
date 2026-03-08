(function(){
  'use strict';

  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};

  E.registry = {
    enemies: {},
    bosses: {},

    registerEnemy(id, api){
      this.enemies[id] = api;
      return api;
    },

    registerBoss(id, api){
      this.bosses[id] = api;
      return api;
    },

    getEnemy(id){ return this.enemies[id] || null; },
    getBoss(id){ return this.bosses[id] || null; },

    updateBossInstance(boss, game, deps){
      if(!boss || !boss.type) return;
      const api = this.bosses[boss.type];
      if(api && api.update) api.update(boss, game, deps);
    },

    drawBossInstance(ctx, boss, cam){
      if(!boss || !boss.type) return;
      const api = this.bosses[boss.type];
      if(api && api.draw) api.draw(ctx, boss, cam);
    }
  };
})();