(function(){
  'use strict';
  const G = window;

  function ensureState(s){
    if(!s) return;
    s.artifactPickups = s.artifactPickups || [];
    s.collectedArtifactPickups = s.collectedArtifactPickups || new Set();
  }

  function pickupIdForChest(ch, artifactId){ return `ap_${artifactId}_${ch.id}`; }

  G.CastleArtifactPickups = {
    spawnFromChest(s, ch, artifactId){
      ensureState(s);
      const id = pickupIdForChest(ch, artifactId);
      if(s.collectedArtifactPickups.has(id)) return null;
      if(s.artifactPickups.some(p => p.id === id && !p.collected)) return null;
      const p = {
        id,
        type:'artifact_pickup',
        artifactId,
        x: ch.x,
        y: ch.y - 18,
        bob: Math.random() * Math.PI * 2,
        collected:false
      };
      s.artifactPickups.push(p);
      return p;
    },
    update(s){
      ensureState(s);
      const pl = s.pl;
      for(const p of s.artifactPickups){
        if(p.collected) continue;
        p.bob += 0.05;
        const dx = pl.x - p.x, dy = pl.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 20){
          p.collected = true;
          s.collectedArtifactPickups.add(p.id);
          if(G.grantArtifact) G.grantArtifact(s, p.artifactId, 1);
          if(typeof G.updatePowerUI === 'function') G.updatePowerUI(s);
        }
      }
      const t = s.cam - 80, b = s.cam + G.H + 120;
      s.artifactPickups = s.artifactPickups.filter(p => !p.collected && p.y > t && p.y < b);
    },
    drawAll(ctx, s){
      ensureState(s);
      for(const p of s.artifactPickups){
        if(p.collected) continue;
        const sy = p.y - s.cam + Math.sin(p.bob) * 2;
        ctx.save();
        ctx.translate(p.x, sy);
        ctx.fillStyle = 'rgba(120,220,255,0.18)';
        ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#274f68'; ctx.fillRect(-7,-7,14,14);
        ctx.fillStyle = '#7ed9ff'; ctx.fillRect(-5,-5,10,10);
        ctx.fillStyle = '#dff8ff';
        ctx.fillRect(-1,-7,2,14); ctx.fillRect(-7,-1,14,2);
        ctx.restore();
      }
    }
  };
})();
