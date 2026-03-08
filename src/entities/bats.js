(function(){
  'use strict';
  const G = window;
  const E = G.CastleEntities = G.CastleEntities || {};

  const BAT_AGRO_RATE=0.025, BAT_AGRO_PERIOD=360, BAT_DIVE_SPEED=3.5, BAT_IDLE_SPEED=0.8;

  E.bats = {
    updateBats(s, deps){
      const pl=s.pl;
      const scale=deps.batDifficultyScale(s.score);
      const diveSpeed=BAT_DIVE_SPEED*scale;
      const agroRate=Math.min(0.18, BAT_AGRO_RATE*scale);
      const ts=deps.timeScale;
      const { takeDamage, batAgroRadius, paused, W, H, WALL } = deps;

      for(const bt of s.bats){
        bt.flap+=0.14;
        if(bt.hurtTimer>0) bt.hurtTimer--;

        if(bt.state==='dead'){
          bt.deadVY += 0.28 * ts;
          bt.x      += bt.deadVX * ts;
          bt.wy     += bt.deadVY * ts;
          if(bt.x < WALL+6){ bt.x = WALL+6; bt.deadVX = Math.abs(bt.deadVX)*0.4; }
          if(bt.x > W-WALL-6){ bt.x = W-WALL-6; bt.deadVX = -Math.abs(bt.deadVX)*0.4; }
          continue;
        }

        if(bt.state==='idle'){
          bt.x+=bt.vx*ts;
          bt.wy+=Math.sin(bt.flap*0.25)*0.3*ts;
          if(bt.x<WALL+8||bt.x>W-WALL-8) bt.vx*=-1;
          bt.vx=Math.max(-BAT_IDLE_SPEED,Math.min(BAT_IDLE_SPEED,bt.vx));
          const bsy=bt.wy-s.cam;
          const distToPlayer=Math.sqrt((bt.x-pl.x)**2+(bt.wy-pl.y)**2);
          if(bsy>-50&&bsy<H+50&&!paused&&distToPlayer>batAgroRadius()&&s.tick%BAT_AGRO_PERIOD===0&&Math.random()<agroRate){
            bt.state='agro';bt.agroTimer=90+Math.random()*60;
          }
        } else if(bt.state==='agro'){
          bt.flap+=0.18;
          if(Math.floor(bt.agroTimer)%6===0){
            bt.vx += (Math.random()-0.5)*3.2;
            bt.wy += (Math.random()-0.5)*2.4;
          }
          bt.vx *= 0.88;
          bt.x  += bt.vx*1.4*ts;
          bt.wy += (Math.random()-0.5)*0.6*ts;
          if(bt.x<WALL+10||bt.x>W-WALL-10) bt.vx*=-1;
          bt.x = Math.max(WALL+10, Math.min(W-WALL-10, bt.x));
          if(--bt.agroTimer<=0){
            bt.state='diving';
            const dx=pl.x-bt.x,dy=pl.y-bt.wy,d=Math.sqrt(dx*dx+dy*dy)||1;
            bt.dvx=dx/d*diveSpeed;bt.dvy=dy/d*diveSpeed;
          }
        } else if(bt.state==='diving'){
          bt.x+=bt.dvx*ts;bt.wy+=bt.dvy*ts;
          const dx=pl.x-bt.x,dy=pl.y-bt.wy;
          if(Math.sqrt(dx*dx+dy*dy)<20){
            takeDamage(s,1,'🦇 HIT!');
            bt.state='retreating';bt.retreatTimer=100;bt.dvx*=-0.7;bt.dvy=-3;bt.hurtTimer=45;
          }
          const bsy=bt.wy-s.cam;
          if(bsy<-H||bsy>H*2||bt.x<WALL||bt.x>W-WALL){
            bt.state='retreating';bt.retreatTimer=80;bt.dvx*=-0.5;bt.dvy=-2;
          }
        } else if(bt.state==='retreating'){
          bt.x+=bt.dvx*0.88*ts;bt.wy+=bt.dvy*ts;bt.dvx*=0.9;bt.dvy*=0.88;
          if(--bt.retreatTimer<=0){bt.state='idle';bt.vx=(Math.random()-.5)*BAT_IDLE_SPEED*2;}
        }
      }
    }
  };
})();
