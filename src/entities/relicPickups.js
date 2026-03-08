(function(){
  'use strict';
  const G = window;

  function ensureState(s){
    if(!s) return;
    s.relicPickups = s.relicPickups || [];
    s.collectedRelicPickups = s.collectedRelicPickups || new Set();
  }

  G.CastleRelicPickups = {
    spawn(s, relicId, x, y, sourceId){
      ensureState(s);
      const id = `rp_${relicId}_${sourceId || Math.floor(x)+'_'+Math.floor(y)}`;
      if(s.collectedRelicPickups.has(id)) return null;
      if(s.relicPickups.some(p => p.id === id && !p.collected)) return null;
      const p = {
        id, type:'relic_pickup', relicId, x, y, bob: Math.random()*Math.PI*2, collected:false
      };
      s.relicPickups.push(p);
      return p;
    },
    update(s){
      ensureState(s);
      const pl = s.pl;
      for(const p of s.relicPickups){
        if(p.collected) continue;
        p.bob += 0.05;
        const dx = pl.x - p.x, dy = pl.y - p.y;
        if(Math.sqrt(dx*dx + dy*dy) < 22){
          p.collected = true;
          s.collectedRelicPickups.add(p.id);
          let firstUnlock = false;
          if(G.isRelicUnlocked) firstUnlock = !G.isRelicUnlocked(p.relicId);
          if(G.unlockRelic) G.unlockRelic(p.relicId, { grantLevelOne:true });
          if(typeof G.addFloat === 'function'){
            const def = G.RELICS && G.RELICS[p.relicId];
            const icon = def && def.icon ? def.icon : '✦';
            const name = def && def.name ? def.name.toUpperCase() : 'RELIC';
            const msg = firstUnlock ? `${icon} ${name} OBTAINED!` : `${icon} RELIC ECHO!`;
            G.addFloat(p.x, p.y - s.cam - 16, msg, '#d8d1ff');
          }
          if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
          if(typeof G.saveGame === 'function') G.saveGame(s);
        }
      }
      s.relicPickups = s.relicPickups.filter(p => !p.collected);
    },
    drawAll(ctx, s){
      ensureState(s);
      for(const p of s.relicPickups){
        if(p.collected) continue;
        const sy = p.y - s.cam + Math.sin(p.bob) * 2;
        ctx.save();
        ctx.translate(p.x, sy);
        ctx.fillStyle = 'rgba(216,209,255,0.18)';
        ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#4f3f74'; ctx.fillRect(-7,-7,14,14);
        ctx.fillStyle = '#d8d1ff';
        ctx.beginPath();
        ctx.moveTo(0,-8); ctx.lineTo(6,-2); ctx.lineTo(2,-2); ctx.lineTo(2,8); ctx.lineTo(-2,8); ctx.lineTo(-2,-2); ctx.lineTo(-6,-2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  };
})();
