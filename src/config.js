(function(){
  'use strict';

  const G = window;

  G.SAVE_KEY = 'castle_climber_save_v2';

  G.ATTACK_DURATION      = 16;
  G.ATTACK_RADIUS_BASE   = 22;
  G.ATTACK_COOLDOWN_BASE = 42;

  G.MUSH_START = 150;
  G.MUSH_FULL  = 4500;
  G.MUSH_MAX_DENSITY = 0.38;

  G.PLANT_START        = 500;
  G.PLANT_FULL         = 5000;
  G.PLANT_MAX_DENSITY  = 0.22;
  G.PLANT_AGRO         = 16;
  G.PLANT_TRACK_RADIUS = 120;
  G.PLANT_MAX_REACH    = 44;
  G.SNAP_FRAMES        = 7;
  G.CLOSED_HOLD        = 50;
  G.OPEN_FRAMES        = 22;

  G.SLIME_START      = 3000;
  G.SLIME_MAX        = 7;
  G.SLIME_HOP_VY     = -5.8;
  G.SLIME_HOP_VX     = 2.4;
  G.SLIME_HOP_MIN    = 55;
  G.SLIME_HOP_MAX    = 190;
  G.SLIME_GRAV       = 0.38;
  G.SLIME_TOUCH_RAD  = 14;
  G.SLIME_HUES       = [162, 195, 288, 322, 34, 88, 12, 258, 48, 338];
  G.SLIME_DEAD_FRAMES = 40;

  G.timeScale = 1.0;
  G.timeSlowTimer = 0;
})();
