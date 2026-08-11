/* =========================================================================
   Alpine School — audio
   -------------------------------------------------------------------------
   Tout est synthétisé : aucun fichier, le jeu marche hors ligne.

   Deux règles tenues strictement :
     — le contexte audio n'est créé qu'au premier geste de l'utilisateur, donc
       aucun son ne part avant qu'on ait cliqué ;
     — il est suspendu dès qu'on ne joue plus, pour ne jamais monopoliser la
       sortie audio et ne rien interrompre dans un autre onglet.
   ========================================================================= */
(function (AS) {
  'use strict';

  var ctx = null;
  var master = null;
  var muted = false;
  var unlocked = false;

  var wind = null;      // souffle de vent, volume suivant la vitesse
  var windGain = null;

  function ensure() {
    if (ctx) return ctx;
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    return ctx;
  }

  /* Appelé au premier clic / première touche. Avant ça, tout est muet. */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    var c = ensure();
    if (c && c.state === 'suspended') c.resume();
  }

  function resume() {
    if (!unlocked) return;
    var c = ensure();
    if (c && c.state === 'suspended') c.resume();
  }

  function suspend() {
    stopWind();
    if (ctx && ctx.state === 'running' && ctx.suspend) ctx.suspend();
  }

  function tone(freq, dur, type, vol, delay) {
    if (!unlocked || muted) return;
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    try {
      var t = c.currentTime + (delay || 0);
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch (e) { /* une note perdue ne doit jamais casser une partie */ }
  }

  /* --- Souffle de vent ---------------------------------------------------
     Bruit blanc bouclé, passé dans un passe-bas. Son volume et sa couleur
     suivent la vitesse : on entend qu'on accélère. */
  function startWind() {
    if (!unlocked || muted || wind) return;
    var c = ensure();
    if (!c) return;
    try {
      var len = Math.floor(c.sampleRate * 2);
      var buffer = c.createBuffer(1, len, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      var src = c.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      var filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.6;

      windGain = c.createGain();
      windGain.gain.value = 0;

      src.connect(filter);
      filter.connect(windGain);
      windGain.connect(master);
      src.start();
      wind = { src: src, filter: filter };
    } catch (e) { wind = null; }
  }

  function stopWind() {
    if (!wind) return;
    try { wind.src.stop(); } catch (e) { /* déjà arrêtée */ }
    wind = null;
    windGain = null;
  }

  /* speed01 : 0 à l'arrêt, 1 à pleine vitesse. */
  function setWind(speed01) {
    if (!wind || !windGain || !ctx) return;
    var t = ctx.currentTime;
    var target = 0.015 + speed01 * 0.075;
    windGain.gain.setTargetAtTime(muted ? 0 : target, t, 0.25);
    wind.filter.frequency.setTargetAtTime(320 + speed01 * 900, t, 0.3);
  }

  /* --- Le "wiii" du saut ---------------------------------------------------
     tone() ne sait tenir qu'une hauteur fixe : il fallait un vrai glissé de
     fréquence pour une exclamation étirée sur près de deux secondes, pas un
     bip d'un dixième de seconde. Deux oscillateurs légèrement écartés (l'un
     à la quinte, détuné de quelques cents) donnent le battement organique
     d'une vraie voix plutôt qu'un synthé bien droit, et un vibrato discret
     fait vivre la tenue -- c'est ce qui transforme un glissando en un
     vrai "wiiiiii" plutôt qu'une sirène.
     La trajectoire suit le saut : montée franche au décollage, palier en
     haut pendant le vol, redescente douce à la retombée -- même si la fin
     du son déborde un peu après l'atterrissage, ce léger décalage se sent
     comme un cri qui traîne, pas comme un bug. */
  function wooshJump() {
    if (!unlocked || muted) return;
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    try {
      var t = c.currentTime;
      var dur = 1.9;
      /* Les deux essais precedents montaient vite puis TENAIENT une note --
         et une note qui reste plantee en haut, meme aigue, sonne comme une
         sirene ou un theremine, pas comme une voix qui s'exclame. Ce qui
         porte le "wheeeee", c'est le GESTE : une montee continue du debut
         presque jusqu'a la fin, comme quelqu'un dont le cri s'emballe avec
         la vitesse -- pas la hauteur ou elle culmine. */
      var riseUntil = dur * 0.86;
      var startFreq = 480;
      var peakFreq = 1360;
      var tailFreq = 1120;          // a bout de souffle, mais jamais grave

      var osc = c.createOscillator();
      osc.type = 'sawtooth';        // du grain, pas un ton pur et froid
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(peakFreq, t + riseUntil);
      osc.frequency.exponentialRampToValueAtTime(tailFreq, t + dur);

      /* Le filtre s'ouvre EN MEME TEMPS que la hauteur monte : le son
         s'eclaircit à mesure qu'il grimpe, comme une exclamation qui
         prend de l'ampleur -- une ouverture fixe sonnerait plat. */
      var filt = c.createBiquadFilter();
      filt.type = 'lowpass';
      filt.Q.value = 1.1;
      filt.frequency.setValueAtTime(1300, t);
      filt.frequency.exponentialRampToValueAtTime(4400, t + riseUntil);
      filt.frequency.exponentialRampToValueAtTime(3400, t + dur);

      /* Vibrato qui grandit avec le temps : presque droit au depart, un
         tremblement net à la fin -- l'excitation qui monte, pas un
         synthétiseur égal à lui-même du début à la fin. */
      var lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 7;
      var lfoGain = c.createGain();
      lfoGain.gain.setValueAtTime(4, t);
      lfoGain.gain.linearRampToValueAtTime(38, t + riseUntil);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      var gain = c.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.095, t + 0.05);
      gain.gain.setValueAtTime(0.095, t + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(master);

      osc.start(t); lfo.start(t);
      osc.stop(t + dur + 0.05);
      lfo.stop(t + dur + 0.05);
    } catch (e) { /* un wiii perdu ne doit jamais casser une partie */ }
  }

  /* Une syllabe de rire : une hauteur qui monte puis retombe très vite,
     comme un "ha !" -- trois de suite, légèrement décalées en hauteur,
     donnent un petit fou rire sans avoir besoin d'une voix enregistrée. */
  function laughSyllable(c, when, baseFreq) {
    var osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, when);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, when + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, when + 0.11);
    var gain = c.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.07, when + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.13);
    osc.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + 0.16);
  }

  /* --- Lapin percuté, confettis ---------------------------------------------
     Avant, cet impact reprenait le buzz grave de "mauvaise réponse" -- alors
     que visuellement c'est un accident joyeux, pas une faute : le monde
     projette des confettis, pas un carton rouge. Le son doit le dire aussi.
     Trois couches, à la manière d'une vraie piñata qu'on éclate : le
     craquement (bruit filtré, très bref), la pluie de confettis (une dizaine
     de tintements aigus, hauteur et instant légèrement randomisés pour que
     ça tombe plutôt que ça joue une mélodie), et un petit fou rire par-dessus. */
  function pinataConfetti() {
    if (!unlocked || muted) return;
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    try {
      var t = c.currentTime;

      var len = Math.floor(c.sampleRate * 0.09);
      var buf = c.createBuffer(1, len, c.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = c.createBufferSource();
      src.buffer = buf;
      var bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1400;
      bp.Q.value = 0.9;
      var whackGain = c.createGain();
      whackGain.gain.setValueAtTime(0.22, t);
      whackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      src.connect(bp);
      bp.connect(whackGain);
      whackGain.connect(master);
      src.start(t);

      tone(140, 0.10, 'square', 0.10, 0.005);   // le poids du coup, sous le craquement

      var notes = [1200, 1500, 1800, 1350, 1650, 2000, 1450, 1750, 1900, 1600];
      for (var n = 0; n < notes.length; n++) {
        var when = 0.06 + n * 0.045 + Math.random() * 0.02;
        tone(notes[n] * (0.94 + Math.random() * 0.12), 0.14, 'sine', 0.045, when);
      }

      var haStarts = [0.16, 0.28, 0.40];
      for (var h = 0; h < haStarts.length; h++) {
        laughSyllable(c, t + haStarts[h], 560 + h * 40);
      }
    } catch (e) { /* un accident manqué ne doit jamais casser une partie */ }
  }

  var sfx = {
    good: function () {
      tone(660, 0.12, 'triangle', 0.14, 0);
      tone(990, 0.16, 'triangle', 0.12, 0.09);
    },
    bad: function () {
      tone(180, 0.22, 'sawtooth', 0.10, 0);
    },
    /* Lapin percuté : un accident joyeux, pas une faute -- voir
       pinataConfetti() ci-dessus pour le détail des trois couches. */
    confetti: pinataConfetti,
    crash: function () {
      tone(120, 0.40, 'sawtooth', 0.13, 0);
      tone(70, 0.50, 'square', 0.08, 0.05);
    },
    jump: wooshJump,
    land: function () {
      tone(240, 0.07, 'sine', 0.07, 0);
    },
    /* Tremplin de vitesse : un souffle qui monte, court et net, pour qu'on
       sache qu'on l'a eu sans quitter la piste des yeux. */
    boost: function () {
      tone(430, 0.09, 'triangle', 0.10, 0);
      tone(645, 0.09, 'triangle', 0.09, 0.05);
      tone(860, 0.16, 'sine', 0.08, 0.10);
    },
    /* Jalon franchi : un arpège montant, plus haut et plus clair que le
       « bonne réponse » pour qu'on ne confonde pas les deux. */
    milestone: function () {
      tone(784, 0.10, 'triangle', 0.09, 0);
      tone(988, 0.10, 'triangle', 0.09, 0.07);
      tone(1319, 0.22, 'triangle', 0.08, 0.14);
    },
    /* Petit accord de fin de partie, pour ne pas terminer sur un silence. */
    over: function () {
      tone(392, 0.20, 'triangle', 0.09, 0);
      tone(294, 0.28, 'triangle', 0.08, 0.12);
    }
  };

  function setMuted(next) {
    muted = next;
    if (master && ctx) {
      master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
    }
  }

  function isMuted() { return muted; }

  /* Accès contrôlé pour le module de musique : il a besoin du contexte et du
     bus principal, mais ne doit surtout pas en créer un second — tout doit
     passer par le même volume, sinon le bouton « couper le son » ne couperait
     que la moitié. */
  function context() { return ensure(); }
  function bus() { ensure(); return master; }
  function isUnlocked() { return unlocked; }

  AS.audio = {
    unlock: unlock,
    resume: resume,
    suspend: suspend,
    context: context,
    bus: bus,
    isUnlocked: isUnlocked,
    sfx: sfx,
    startWind: startWind,
    stopWind: stopWind,
    setWind: setWind,
    setMuted: setMuted,
    isMuted: isMuted
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
