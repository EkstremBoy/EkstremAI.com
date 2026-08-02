/* =========================================================================
   Alpine School — musique du mode Freestyle
   -------------------------------------------------------------------------
   Entièrement synthétisée : pas un octet de fichier audio. Un séquenceur
   programme les notes à l'avance dans l'horloge de la carte son, ce qui est
   la seule façon d'avoir un tempo régulier — un séquenceur calé sur les
   images du jeu tremble dès que la carte graphique souffle.

   TROIS STYLES, choisis dans le menu pause. Ils ne diffèrent pas seulement
   par la couleur : chacun a sa marche d'harmonie, son échelle, sa batterie
   et sa plage de tempo. Ce qu'ils partagent, c'est l'ACCÉLÉRATION — tous
   suivent la distance parcourue, parce que c'est le sujet du jeu.

   POUR EN AJOUTER UN : une entrée dans STYLES, et rien d'autre. Le menu se
   remplit à partir de cette liste.
   ========================================================================= */
(function (AS) {
  'use strict';

  var LOOKAHEAD = 0.20;
  var TICK_MS = 40;
  var STEPS = 16;               // doubles-croches par mesure

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  /* --- Les trois styles ---------------------------------------------------
     `lead` donne les notes de la mélodie sur les pas listés dans `leadSteps`.
     Tout est pentatonique : on peut empiler les couches sans jamais sonner
     faux, et donc entrer et sortir librement au fil de la descente. */
  var STYLES = {
    /* Lumineux et roulant. Ré majeur, basse en croches qui pousse. C'est le
       style « carte postale » : large, optimiste, jamais pressé. */
    alpine: {
      bpm: [100, 168],
      chords: [
        { root: 38, lead: [62, 66, 69, 66] },
        { root: 33, lead: [69, 71, 69, 66] },
        { root: 35, lead: [71, 69, 66, 62] },
        { root: 31, lead: [62, 64, 66, 69] }
      ],
      leadSteps: [0, 3, 6, 10, 12],
      kick: [0, 8], kickExtra: [6, 14], snare: [4, 12],
      bassType: 'triangle', leadType: 'triangle',
      bassGain: 0.20, leadGain: 0.115,
      hatGain: 0.075, snareCut: 1400,
      padFrom: 0.5
    },

    /* Chiptune nerveux. La mineure pentatonique, ondes carrées, caisse claire
       sèche et charleston serré. Le style « borne d'arcade » : il pousse
       dans le dos et ne laisse pas respirer. */
    arcade: {
      bpm: [118, 196],
      chords: [
        { root: 33, lead: [69, 72, 74, 72] },
        { root: 36, lead: [72, 74, 76, 74] },
        { root: 31, lead: [67, 69, 72, 69] },
        { root: 33, lead: [69, 76, 74, 72] }
      ],
      leadSteps: [0, 2, 4, 6, 8, 11, 14],
      kick: [0, 6, 8, 14], kickExtra: [3, 11], snare: [4, 12],
      bassType: 'square', leadType: 'square',
      /* Une onde carrée a toute son énergie dans les harmoniques impairs, et
         l'oreille les entend deux à cinq fois plus fort qu'un fondamental de
         même amplitude. À gains égaux avec l'alpine, l'arcade sonnait 3 dB
         au-dessus — d'où des niveaux nettement plus bas ici, et une batterie
         adoucie puisqu'elle frappe déjà deux fois plus souvent. */
      bassGain: 0.115, leadGain: 0.052,
      hatGain: 0.032, snareCut: 2000,
      kickGain: 0.32, snareGain: 0.105,
      trim: 0.86,               /* alignement final : -1,3 dB mesurés */
      padFrom: 2,                 // jamais de nappe : ça encombrerait
      bright: true
    },

    /* Ska. Ce qui fait le ska, ce n'est pas le tempo mais le CONTRETEMPS :
       la basse marche sur les temps, et les accords viennent se poser
       exactement entre eux, très courts, très secs. C'est ce décalage qui
       donne l'élan — et il va bien à une descente. Caisse claire sur le
       deuxième et le quatrième temps, cuivres pour la mélodie. */
    ska: {
      bpm: [132, 198],
      chords: [
        { root: 36, stab: [60, 64, 67], lead: [72, 76, 79, 76] },
        { root: 31, stab: [55, 59, 62], lead: [67, 71, 74, 71] },
        { root: 33, stab: [57, 60, 64], lead: [69, 72, 76, 72] },
        { root: 38, stab: [62, 65, 69], lead: [74, 77, 81, 77] }
      ],
      leadSteps: [0, 3, 8, 11, 14],
      /* Les accords tombent sur les contretemps de croche, jamais sur le
         temps : c'est toute la signature du genre. */
      stabSteps: [2, 6, 10, 14],
      kick: [0, 8], kickExtra: [6], snare: [4, 12],
      bassType: 'triangle', leadType: 'sawtooth',
      bassGain: 0.21, leadGain: 0.062,
      hatGain: 0.040, snareCut: 1700,
      padFrom: 2,
      walkingBass: true,
      trim: 1.15                /* le ska sortait 1,8 dB sous les autres */
    },

    /* NOCTURNE — la récompense cachée de la descente de nuit. Rien à voir
       avec les trois autres : pas de batterie, pas de pulsation, un piano
       seul. Main gauche en arpèges lents, main droite très espacée, et une
       nappe qui tient la mesure. En la majeur, avec des septièmes partout :
       c'est la couleur qui rend une balade nocturne paisible plutôt que
       triste. Huit mesures avant de boucler, assez pour qu'on n'entende pas
       la répétition. */
    nocturne: {
      bpm: [56, 56],            // fixe : rien ne doit presser
      piano: true,
      chords: [
        { bass: 45, arp: [52, 57, 61, 64], lead: [76, null, 73, 69] },
        { bass: 42, arp: [49, 54, 57, 61], lead: [71, null, 69, 73] },
        { bass: 38, arp: [45, 50, 54, 57], lead: [69, null, 66, 62] },
        { bass: 40, arp: [47, 52, 56, 59], lead: [64, null, 66, 68] },
        { bass: 45, arp: [52, 57, 61, 64], lead: [69, null, 73, 76] },
        { bass: 43, arp: [50, 55, 59, 62], lead: [78, null, 76, 73] },
        { bass: 38, arp: [45, 50, 54, 57], lead: [74, null, 71, 69] },
        { bass: 40, arp: [47, 52, 56, 59], lead: [68, null, 66, 64] }
      ],
      bpmFixed: true
    }
  };

  /* Les seuls pas où la main droite parle. Le silence entre deux phrases fait
     autant que les notes : c'est ce qui rend la descente paisible. */
  var NOCTURNE_LEAD = [0, 5, 8, 13];

  /* Le sélecteur du menu pause n'en montre que trois. Le nocturne ne
     s'obtient pas en le choisissant — il se découvre. */
  var STYLE_IDS = ['alpine', 'arcade', 'ska'];

  var ctx = null;
  var out = null;
  var playing = false;
  var timer = null;
  var step = 0;
  var bar = 0;
  var nextTime = 0;
  var intensity = 0;
  var styleId = 'alpine';

  function style() { return STYLES[styleId] || STYLES.alpine; }

  function ensure() {
    if (out) return true;
    ctx = AS.audio.context();
    if (!ctx) return false;
    out = ctx.createGain();
    out.gain.value = 0;
    out.connect(AS.audio.bus());
    return true;
  }

  /* --- Voix ------------------------------------------------------------- */

  function tone(t, freq, dur, type, peak, detune) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (detune) osc.detune.setValueAtTime(detune, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    gain.gain.setValueAtTime(peak, t + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.06);
  }

  /* Piano. Ce qui fait qu'on entend un piano et pas une nappe, c'est
     l'enveloppe : une attaque immédiate puis une décroissance continue, sans
     jamais de plateau. On empile trois partiels et on coupe l'aigu au filtre,
     ce qui suffit à donner du bois plutôt qu'un bip. */
  function piano(t, note, dur, peak) {
    var freq = midi(note);

    var body = ctx.createGain();
    body.gain.setValueAtTime(0.0001, t);
    body.gain.exponentialRampToValueAtTime(peak, t + 0.014);
    body.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    body.connect(out);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(7000, freq * 8), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 2.2), t + dur);
    lp.Q.value = 0.3;
    lp.connect(body);

    var partials = [[1, 1, 'triangle'], [2, 0.30, 'sine'], [3, 0.10, 'sine']];
    for (var i = 0; i < partials.length; i++) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = partials[i][2];
      osc.frequency.setValueAtTime(freq * partials[i][0], t);
      /* Deux cents de désaccord sur le fondamental : c'est ce battement très
         lent qui empêche la note de sonner électronique. */
      if (i === 0) osc.detune.setValueAtTime(-2, t);
      g.gain.value = partials[i][1];
      osc.connect(g);
      g.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.08);
    }
  }

  function nocturneStep(index, barIndex, t) {
    var st = style();
    var chord = st.chords[barIndex % st.chords.length];

    /* Main gauche : la basse tenue au début de la mesure, puis l'arpège en
       croches qui monte et redescend dans l'accord. */
    if (index === 0) piano(t, chord.bass, 3.6, 0.110);
    if (index % 2 === 0) {
      piano(t, chord.arp[(index / 2) % chord.arp.length], 1.7, 0.048);
    }

    var slot = NOCTURNE_LEAD.indexOf(index);
    if (slot >= 0) {
      var note = chord.lead[slot % chord.lead.length];
      if (note) {
        piano(t, note, 2.4, 0.082);
        /* Un écho à l'octave, presque inaudible : il donne la profondeur
           d'une pièce sans qu'on entende une réverbération. */
        piano(t + 0.42, note + 12, 1.2, 0.014);
      }
    }

    if (index === 0) {
      tone(t, midi(chord.bass + 12), 3.8, 'sine', 0.018);
      tone(t, midi(chord.bass + 19), 3.8, 'sine', 0.012);
    }
  }

  function kick(t, peak) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(style().bright ? 158 : 132, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.09);
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  var noiseBuffer = null;
  function noise() {
    if (noiseBuffer) return noiseBuffer;
    var len = Math.floor(ctx.sampleRate * 0.4);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = noiseBuffer.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noiseBuffer;
  }

  function hit(t, cutoff, dur, peak) {
    var src = ctx.createBufferSource();
    src.buffer = noise();
    src.playbackRate.value = 1 + Math.random() * 0.2;
    var filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = cutoff;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /* --- Séquence ---------------------------------------------------------- */

  function playStep(index, barIndex, t) {
    var st = style();
    if (st.piano) { nocturneStep(index, barIndex, t); return; }
    var chord = st.chords[barIndex % st.chords.length];
    var i = intensity;

    var kickGain = st.kickGain || 0.42;
    if (st.kick.indexOf(index) >= 0) kick(t, kickGain);
    else if (i > 0.45 && st.kickExtra.indexOf(index) >= 0) kick(t, kickGain * 0.48);

    if (st.snare.indexOf(index) >= 0) {
      hit(t, st.snareCut, 0.13, st.snareGain || 0.16);
    }

    var hatEvery = i > 0.55 ? 1 : 2;
    if (st.hatGain > 0.005 && index % hatEvery === 0) {
      hit(t, st.bright ? 8000 : 7200, 0.035,
        index % 4 === 0 ? st.hatGain : st.hatGain * 0.6);
    }

    /* La basse. En ska elle MARCHE : une note par temps, qui monte et
       redescend dans l'accord — c'est elle qui tire tout le morceau. Ailleurs
       elle bat la croche avec un saut d'octave sur les contretemps. */
    if (st.walkingBass) {
      if (index % 4 === 0) {
        var walk = [0, 7, 12, 7][(index / 4) % 4];
        tone(t, midi(chord.root + walk), 0.19, st.bassType, st.bassGain);
      }
    } else if (index % 2 === 0) {
      var oct = (index % 4 === 2) ? 12 : 0;
      tone(t, midi(chord.root + oct), 0.20, st.bassType, st.bassGain);
      if (i > 0.3) tone(t, midi(chord.root + oct), 0.20, 'sawtooth', 0.045);
    }

    /* Le « skank » : trois notes plaquées, très brèves, sur le contretemps. */
    if (st.stabSteps && st.stabSteps.indexOf(index) >= 0) {
      for (var n = 0; n < chord.stab.length; n++) {
        tone(t, midi(chord.stab[n]), 0.085, 'square', 0.048);
      }
    }

    var slot = st.leadSteps.indexOf(index);
    if (slot >= 0) {
      var note = chord.lead[slot % chord.lead.length];
      var dur = 0.26;
      tone(t, midi(note), dur, st.leadType, st.leadGain);
      tone(t, midi(note), dur, st.leadType, st.leadGain * 0.42, 7);
      if (i > 0.7) tone(t, midi(note + 12), dur * 0.7, 'sine', st.leadGain * 0.45);
    }

    if (i > st.padFrom && index === 0) {
      var amount = Math.min(1, (i - st.padFrom) * 2);
      tone(t, midi(chord.root + 24), 1.6, 'sine', 0.035 * amount);
      tone(t, midi(chord.root + 28), 1.6, 'sine', 0.028 * amount);
    }
  }

  function stepDuration() {
    var st = style();
    var range = st.bpm;
    var bpm = st.bpmFixed
      ? range[0]
      : range[0] + (range[1] - range[0]) * intensity;
    return (60 / bpm) / 4;
  }

  function schedule() {
    if (!playing || !ctx) return;
    var horizon = ctx.currentTime + LOOKAHEAD;
    /* Si l'onglet a été gelé, nextTime peut être loin derrière : on se recale
       plutôt que de déverser cent notes d'un coup. */
    if (nextTime < ctx.currentTime - 0.5) nextTime = ctx.currentTime + 0.05;

    while (nextTime < horizon) {
      playStep(step, bar, nextTime);
      nextTime += stepDuration();
      step++;
      if (step >= STEPS) { step = 0; bar++; }
    }
  }

  /* --- Interface --------------------------------------------------------- */

  function start() {
    if (playing || styleId === 'off' || !AS.audio.isUnlocked()) return;
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    step = 0;
    bar = 0;
    nextTime = ctx.currentTime + 0.12;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    /* Chaque style a son propre niveau perçu : à réglages de voix égaux,
       trois timbres différents ne sonnent pas au même volume. Ce coefficient
       les aligne, mesuré en pondération A et non au crête-mètre. */
    out.gain.exponentialRampToValueAtTime(
      0.5 * (style().trim || 1), ctx.currentTime + 1.1
    );
    timer = setInterval(schedule, TICK_MS);
    schedule();
  }

  function stop() {
    if (!playing) return;
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (out && ctx) {
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), ctx.currentTime);
      out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    }
  }

  /* Changer de style en pleine descente : on coupe et on relance sur la
     mesure suivante, sinon les deux se superposeraient une seconde. */
  function setStyle(id) {
    if (id !== 'off' && !STYLES[id]) return;
    if (id === styleId) return;
    var wasPlaying = playing;
    stop();
    styleId = id;
    if (wasPlaying && id !== 'off') setTimeout(start, 380);
  }

  function setIntensity(value) {
    intensity = value < 0 ? 0 : (value > 1 ? 1 : value);
  }

  AS.music = {
    start: start,
    stop: stop,
    setStyle: setStyle,
    setIntensity: setIntensity,
    isPlaying: function () { return playing; },
    style: function () { return styleId; },
    STYLE_IDS: STYLE_IDS,
    bpm: function () {
      if (styleId === 'off') return 0;
      var r = style().bpm;
      return r[0] + (r[1] - r[0]) * intensity;
    }
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
