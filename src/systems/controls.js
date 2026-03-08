(function(){
  'use strict';

  const G = window;

  G.GAMEPAD_DEADZONE = 0.28;
  G.GAMEPAD_MAX_PULL = 130;
  G.CONTROL_SETTINGS_KEY = 'castle_climber_control_settings_v1';
  G.gamepadAWasDown = false;
  G.gamepadBWasDown = false;
  G.gamepadXWasDown = false;
  G.gamepadYWasDown = false;
  G.gamepadAimActive = false;
  G.invertControllerControls = false;
  G.controllerSensitivity = 1.0;

  G.getPlayerScreenPos = function(){
    if(!G.S || !G.S.pl) return {x:G.W/2, y:G.H/2};
    return {x:G.S.pl.x, y:G.S.pl.y - G.S.cam};
  };

  G.isTextInputTarget = function(el){
    if(!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  G.saveControlSettings = function(){
    try{
      localStorage.setItem(G.CONTROL_SETTINGS_KEY, JSON.stringify({
        invertControllerControls: G.invertControllerControls,
        controllerSensitivity: G.controllerSensitivity
      }));
    }catch(e){}
  };

  G.loadControlSettings = function(){
    try{
      const raw = localStorage.getItem(G.CONTROL_SETTINGS_KEY);
      if(!raw) return;
      const data = JSON.parse(raw);
      G.invertControllerControls = !!data.invertControllerControls;
      const sens = Number(data.controllerSensitivity);
      if(Number.isFinite(sens)) G.controllerSensitivity = Math.max(0.4, Math.min(1.8, sens));
    }catch(e){}
  };
})();
