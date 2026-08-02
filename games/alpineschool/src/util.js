/* =========================================================================
   Alpine School — petites fonctions partagées
   ========================================================================= */
(function (AS) {
  'use strict';

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* Lissage indépendant du pas de temps : approcher une cible de `rate` par
     seconde donne le même résultat à 30 ips qu'à 144. */
  function damp(current, target, rate, dt) {
    return lerp(current, target, 1 - Math.exp(-rate * dt));
  }

  function randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function randInt(lo, hi) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  /* Fisher-Yates, en place. */
  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  /* Générateur reproductible. Le mode Course en a besoin : pour qu'un
     tableau des temps veuille dire quelque chose, il faut que tout le monde
     descende exactement la même piste, avec les mêmes sapins aux mêmes
     endroits. Mulberry32 — court, rapide, et de qualité largement suffisante
     pour semer une forêt. */
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  AS.util = {
    seeded: seeded,
    clamp: clamp,
    lerp: lerp,
    damp: damp,
    randRange: randRange,
    randInt: randInt,
    shuffle: shuffle
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
