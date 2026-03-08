(function(){
  'use strict';
  const G = window;

  G.RUNES = {
    gold_rune: {
      id:'gold_rune', name:'Gold Rune', icon:'⚜', sprite:'gold_rune', maxLevel:999,
      affects:{ goldGainMult:0.01 }
    },
    vitality_rune: {
      id:'vitality_rune', name:'Vitality Rune', icon:'❤', sprite:'vitality_rune', maxLevel:999,
      affects:{ maxHpMult:0.01, healAmountMult:0.01 }
    },
    defense_rune: {
      id:'defense_rune', name:'Defense Rune', icon:'🛡', sprite:'defense_rune', maxLevel:999,
      affects:{ damageReductionMult:0.01, negateChanceFlat:0.01 }
    }
  };
})();
