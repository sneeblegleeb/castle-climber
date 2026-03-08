(function(){
  'use strict';

  const G = window;

  G.S = null;
  G.drag = null;
  G.floats = [];
  G.paused = false;
  G.saveTimer = 0;

  G.mkBat = function(wy, plY){
    const minDist = G.batAgroRadius() + 50;
    if(plY !== undefined && Math.abs(wy - plY) < minDist){
      wy = wy < plY ? plY - minDist : plY + minDist;
    }
    return {
      x:G.WALL + 10 + Math.random() * (G.W - G.WALL * 2 - 20), wy,
      vx:(Math.random() - 0.5) * 1.0,
      flap:Math.random() * Math.PI * 2,
      state:'idle', agroTimer:0, retreatTimer:0,
      tx:0, ty:0, dvx:0, dvy:0, hurtTimer:0, hp:2, deadVX:0, deadVY:0
    };
  };

  G.mkSlime = function(wx, wy){
    const hue = G.SLIME_HUES[Math.floor(Math.random() * G.SLIME_HUES.length)];
    return {
      x:wx, y:wy,
      vx:0, vy:0,
      onGround:false,
      prevY:wy,
      hp:2,
      hurtTimer:0,
      dead:false,
      deadTimer:0,
      hue,
      bobAngle:Math.random() * Math.PI * 2,
      hopTimer:20 + Math.random() * 60,
      squish:0,
      squishTimer:0,
      dir:Math.random() < 0.5 ? -1 : 1,
    };
  };

  G.mkS = function(savedPos){
    const hp = G.maxHP();
    const sx = savedPos ? savedPos.x : G.W / 2;
    const sy = savedPos ? savedPos.y : 0;
    const shp = savedPos ? Math.min(savedPos.hp, hp) : hp;
    const s = {
      pl:{
        x:sx,y:sy,vx:0,vy:0,w:18,h:24,onG:false,coyote:0,
        hp:shp,maxHp:hp,hurtTimer:0,fallVy:0,damageFlash:0,
        airJumpsLeft:G.maxAirJumps(),sporeExposure:0,burstExposure:0,spikeKnock:0,spikeDir:0,vineNoClip:0,
        attackTimer:0,
        swingId:0,
        lastAttackCooldown:G.ATTACK_COOLDOWN_BASE,
        skinId:G.selectedSkinId || 'knight'
      },
      biomeId: G.getBiomeForScore ? G.getBiomeForScore(Math.floor(-sy / 10)).id : 'castle',
      cam:sy - G.H * 0.38,
      plats:[], coins:[], mushrooms:[], plants:[], slimes:[], chests:[], lootDrops:[], artifactPickups:[], relicPickups:[],
      collectedCoins:new Set(),
      collectedHearts:new Set(),
      collectedArtifactPickups:new Set(),
      collectedRelicPickups:new Set(),
      score:Math.floor(-sy / 10), session_coins:0,
      alive:true, tick:0,
      bats:[], hearts:[],
      activeBoss:null,
      bossFightActive:false,
      bossArenaTop:null,
      bossArenaBottom:null,
      bossSpawnedTriggers:{},
      bossIntroTimer:0,
      bossIntroText:'',
      renderPrevBiomeId: null,
      biomeTransitionTimer: 0,
      biomeTransitionMax: 90,
      artifacts:[],
      artifactCharges:{},
      activeRelics:{},
      relicShockwaves:[],
      pendingRelicAim:null,
      vinePull:null,
      freezeTimer:0,
      spawnFreezeTimer:0
    };
    if(typeof G.initRelicsForRun === 'function') G.initRelicsForRun(s);
    s.plats.push({x:sx-55, y:sy+12, w:110, h:14, icy:false, torch:false, id:0});
    for(let i = 0; i < 8; i++) s.bats.push(G.mkBat(sy + (Math.random() - 0.5) * G.H * 3, sy));
    G.gen(s);
    return s;
  };

  G.restart = function(){
    G.floats = [];
    G.drag = null;
    G.paused = false;
    G.saveTimer = 0;
    G.timeScale = 1.0;
    G.timeSlowTimer = 0;
    G.S = G.mkS(null);
    G.checkpointPhase = true;
    G.cpSelUp = 0;
    G.cpSelDown = 0;
    G.updateCheckpointUI();
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
    if(typeof G.applyUIIcons === 'function') G.applyUIIcons();
    document.getElementById('go').style.display = 'none';
    document.getElementById('pausemenu').style.display = 'none';
    document.getElementById('pausebtn').style.display = 'flex';
    if(typeof G.applyUIIcons === 'function') G.applyUIIcons(false); else document.getElementById('pausebtn').textContent = '⏸';
    document.getElementById('attackbtn').style.display = 'flex';
    if(typeof setMobilePowerVisible === 'function') setMobilePowerVisible(true);
    document.getElementById('hint').style.display = 'block';
    G.updateHeartsUI(G.S.pl);
    if(typeof refreshMobilePowerButtons === 'function') refreshMobilePowerButtons();
  };

  G.bootGame = function(){
    console.log('Castle Climber build: v0.37.5-devcode-bootfix');
    G.loadControlSettings();
    const save = G.loadSave();
    G.applyProgressionSave(save);
    if(window.CastleIcons && window.CastleIcons.setLabeledIconText){
      window.CastleIcons.setLabeledIconText(document.getElementById('coindisp'), 'coin', '⚜', G.totalCoins);
    } else {
      document.getElementById('coindisp').textContent = '⚜ ' + G.totalCoins;
    }
    document.getElementById('best').textContent = 'BEST: ' + G.best + ' / ' + G.lowest;
    G.S = G.mkS(save && save.pos ? save.pos : null);
    document.getElementById('attackbtn').style.display = 'flex';
    if(typeof setMobilePowerVisible === 'function') setMobilePowerVisible(true);
    G.updateCheckpointUI();
    G.updateHeartsUI(G.S.pl);
    if(typeof G.updatePowerUI === 'function') G.updatePowerUI(G.S);
    if(typeof G.applyUIIcons === 'function') G.applyUIIcons(false);
    G.syncSettingsUI();
    if(typeof refreshMobilePowerButtons === 'function') refreshMobilePowerButtons();
    G.frame();
  };

})();
