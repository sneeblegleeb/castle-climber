(function(){
  'use strict';

  const G = window;

  G.checkpointPhase = true;
  G.cpSelUp = 0;
  G.cpSelDown = 0;

  function ownedCPTiers(dir){return dir>0?(G.upgLevels['cp_up']|0):(G.upgLevels['cp_down']|0);}
  G.ownedCPTiers = ownedCPTiers;

  G.updateCheckpointUI = function(){
    const upBtn=document.getElementById('cpupbtn');
    const dnBtn=document.getElementById('cpdownbtn');
    const upOwned=ownedCPTiers(1);
    const dnOwned=ownedCPTiers(-1);
    const show=G.checkpointPhase && G.S && G.S.alive;
    if(upBtn){ upBtn.style.display=(show&&upOwned>0)?'flex':'none'; upBtn.textContent='▲'; }
    if(dnBtn){ dnBtn.style.display=(show&&dnOwned>0)?'flex':'none'; dnBtn.textContent='▼'; }
  };

  G.cycleCheckpoint = function(dir){
    if(!G.checkpointPhase || !G.S || !G.S.alive) return;

    const maxUp   = ownedCPTiers(1);
    const maxDown = ownedCPTiers(-1);

    if(dir > 0){
      if(G.cpSelDown > 0){
        G.cpSelDown--;
        if(G.cpSelDown === 0){
          G.teleportToCheckpoint(0,0);
          G.updateCheckpointUI();
          return;
        }
        G.teleportToCheckpoint(-1, G.cpSelDown);
        G.updateCheckpointUI();
        return;
      }
      if(maxUp <= 0) return;
      G.cpSelUp++;
      if(G.cpSelUp > maxUp) G.cpSelUp = 1;
      G.teleportToCheckpoint(1, G.cpSelUp);
    } else {
      if(G.cpSelUp > 0){
        G.cpSelUp--;
        if(G.cpSelUp === 0){
          G.teleportToCheckpoint(0,0);
          G.updateCheckpointUI();
          return;
        }
        G.teleportToCheckpoint(1, G.cpSelUp);
        G.updateCheckpointUI();
        return;
      }
      if(maxDown <= 0) return;
      G.cpSelDown++;
      if(G.cpSelDown > maxDown) G.cpSelDown = 1;
      G.teleportToCheckpoint(-1, G.cpSelDown);
    }

    G.updateCheckpointUI();
  };

  G.teleportToCheckpoint = function(dir,tier){
    let targetScore=0;
    if(dir!==0) targetScore=dir*tier*1000;
    const targetY=-targetScore*10;
    const px=G.W/2;
    const platY=targetY+12;
    const id=G.platId(platY);

    let p=G.S.plats.find(pp=>pp.id===id);
    if(!p){
      p={x:px-55,y:platY,w:110,h:14,icy:false,torch:false,id,checkpoint:true,safe:true};
      G.S.plats.push(p);
    } else {
      p.x = px-55; p.y = platY; p.w = 110; p.h = 14;
      p.icy = false; p.torch = false; p.checkpoint = true; p.safe = true;
    }

    G.S.mushrooms = G.S.mushrooms.filter(m => m.platId !== id);
    G.S.plants    = G.S.plants.filter(pl => pl.platId !== id);

    G.S.pl.x=px; G.S.pl.y=targetY-20; G.S.pl.vx=0; G.S.pl.vy=0;
    G.S.pl.onG=false; G.S.pl.coyote=0; G.S.pl.fallVy=0;
    G.S.cam=G.S.pl.y-G.H*0.38;
    G.gen(G.S); G.cull(G.S); G.gen(G.S); G.cull(G.S);
    G.floats=[]; G.drag=null;
  };
})();
