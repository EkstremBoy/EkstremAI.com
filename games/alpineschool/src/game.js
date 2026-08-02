/* =========================================================================
   Alpine School — règles et physique
   -------------------------------------------------------------------------
   Le pilotage est analogique : tenir une direction accumule de la vitesse
   latérale, la relâcher laisse la friction la dissiper. Une pression brève
   fait glisser un peu, une pression longue traverse toute la pente. Il n'y a
   ni voie ni déplacement par crans, et c'est le cœur du jeu.

   Toutes les valeurs viennent de constants.js. Elles ont été réglées à la
   main puis validées : ce fichier les applique, il n'en invente aucune.
   ========================================================================= */
(function (AS) {
  'use strict';

  var P = AS.PHYSICS;
  var W = AS.WORLD;
  var util = AS.util;

  /* Multiplicateurs neutres, utilisés hors Crazy Mode. Les avoir sous la main
     évite de semer des `if (crazy)` dans toute la physique. */
  var NEUTRAL_FX = {
    mirror: false, grip: 1, slide: 1, speed: 1, speedSmooth: 1, treeRate: 1,
    propScale: 1, rockChance: -1, fog: 1, mogul: 1, night: 0,
    logs: false, bumps: false, noJump: false, bunny: false
  };

  function Game(world, hooks) {
    this.world = world;
    this.hooks = hooks;         // onGameOver, onAnswer, onHit
    this.state = null;
  }

  Game.prototype.start = function (mode, level, answers) {
    var crazy = mode === 'crazy';
    var race = mode === 'race';
    var quiz = mode !== 'freestyle' && !crazy && !race;
    this.state = {
      mode: mode,
      contentLevel: level || 1,
      answers: answers || 3,

      x: 0,
      vx: 0,
      dir: 0,
      crazy: crazy,
      speed: quiz ? 19 : 23,
      speed01: 0,
      dist: 0,
      scroll: 0,
      travelled: 0,

      height: 0,
      airborne: false,
      airV: 0,
      jumpBuffer: 0,
      jumpHeld: false,
      sinking: 0,
      /* Vitesse au moment du choc, relevée AVANT la pénalité. C'est elle que
         l'écran de fin doit annoncer : arriver sur un sapin à 92 km/h et lire
         « 46 km/h final » n'a aucun sens — c'est la vitesse d'après
         l'accident, pas celle de la descente. */
      impactSpeed: 0,

      score: 0,
      combo: 1,
      bestCombo: 1,
      lives: (quiz || crazy || race) ? 3 : 1,
      right: 0,
      wrong: 0,
      level: 1,

      running: true,
      elapsed: 0,

      provider: quiz ? AS.quiz.makeProvider(mode, level) : null,
      nextObstacleDist: crazy ? 30 : (quiz ? 44 : 26),
      nextGateDist: 0,
      nextLogDist: 0,
      nextMilestone: W.MILESTONE,
      knockFrom: 0,

      /* --- Course --------------------------------------------------------- */
      race: race,
      quiz: quiz,
      raceLength: race ? (level || 1000) : 0,
      raceTime: 0,
      finished: false,
      driftT: 0,
      driftYaw: 0,
      boostFlash: 0,
      boostsTaken: 0,
      splitNext: 0,
      splitDelta: null
    };

    this.world.reset();
    if (race) {
      var c = AS.race.course(this.state.raceLength);
      this.state.raceLength = c.metres;
      /* Même graine pour tout le monde : sans cela deux temps ne seraient pas
         comparables, et un tableau des temps ne voudrait rien dire. */
      this.rng = AS.util.seeded(c.metres * 7919 + 13);
      this.boosts = [];
      for (var b = 0; b < c.boosts; b++) {
        /* Un turbo sur cinq est un turbo « à mériter » : il est collé contre
           un bord, et un mur de sapins barre la piste juste avant en ne
           laissant passer que de ce côté-là. Il faut avoir vu venir, et tenir
           sa ligne. Puisque le parcours est toujours le même, celui qui
           l'étudie gagne quelque chose. */
        var dur = (b % 5) === 3;
        var cote = ((b / 5) | 0) % 2 === 0 ? 1 : -1;
        this.boosts.push({
          at: c.metres * (b + 0.5) / c.boosts,
          x: dur ? cote * (P.HALF - 0.75) : (this.rng() * 2 - 1) * (P.HALF - 1.3),
          hard: dur,
          side: cote,
          done: false
        });
      }
      this.state.splitNext = 250;
      this.world.finish.place(c.metres);
    } else {
      this.rng = null;
      this.boosts = null;
    }
    if (crazy) {
      AS.crazy.reset();
      var solo = AS.crazy.mystery ? null : AS.crazy.soloModifier();
      this.state.mystery = !!AS.crazy.mystery;
      if (solo) {
        /* Une seule folie cochée : pas de porte du tout, elle tourne du début
           à la fin. C'est une descente thématique, pas une suite de choix. */
        AS.crazy.applySolo(solo);
        this.state.solo = true;
        this.repopulate();
      } else {
        var span = AS.crazySpan();
        this.state.crazyNext = span;
        /* La porte est posée à exactement une portée : elle arrive donc pile
           au bout de la première, et les suivantes s'enchaînent au même pas. */
        this.spawnChoiceGate(span);
      }
    } else if (quiz) {
      this.spawnGate(66);
    }
    return this.state;
  };

  /* Un freinage subi — bord de piste, bosse, collision — par opposition à la
     traînée d'un virage, qui fait partie du pilotage. On note la vitesse
     d'avant : en Crazy, c'est elle qu'il faudra reconstruire lentement.
     Le ralentissement d'un modificateur ne passe pas par ici, sinon en sortir
     prendrait quinze secondes. */
  Game.prototype.knock = function (loss) {
    var s = this.state;
    if (s.crazy && s.speed > s.knockFrom) s.knockFrom = s.speed;
    s.speed -= loss;
  };

  /* --- Course : chronomètre, tremplins, franchissement -------------------- */
  Game.prototype.raceStep = function (dt, target) {
    var s = this.state;
    if (s.boostFlash > 0) s.boostFlash = Math.max(0, s.boostFlash - dt * 2.2);

    if (s.finished) {
      /* Dérapage d'arrivée : plus d'accélération, le skieur se met en
         travers et la neige fait le reste. C'est ce moment-là qui donne à une
         course sa fin, plutôt qu'un écran qui tombe d'un coup. */
      s.driftT += dt;
      var u = Math.min(1, s.driftT / P.RACE_DRIFT);
      s.driftYaw = Math.sin(u * Math.PI * 0.5) * 1.28;
      s.speed *= Math.pow(0.06, dt);
      if (s.speed < 1.2) s.speed = 0;
      if (s.driftT >= P.RACE_DRIFT + 0.45) {
        s.running = false;
        if (this.hooks && this.hooks.onRaceEnd) this.hooks.onRaceEnd(s);
      }
      return;
    }

    s.raceTime += dt;

    /* Écart avec son meilleur temps, relevé tous les deux cent cinquante
       mètres. On ne l'affiche pas en continu : un chiffre qui tremble à
       chaque image ne se lit pas, et regarder le chrono coûte un sapin. */
    if (s.dist >= s.splitNext) {
      var ref = AS.race.best(s.raceLength);
      if (ref !== null) {
        s.splitDelta = s.raceTime - ref * (s.splitNext / s.raceLength);
      }
      s.splitNext += 250;
    }

    if (s.dist >= s.raceLength) {
      s.finished = true;
      s.driftT = 0;
      /* Le dérapage emporte encore une quarantaine de mètres : on balaie tout
         ce qui reste devant, y compris ce qui avait été semé avant que la
         ligne ne soit en vue. */
      this.world.props.clearAhead(-4);
      if (this.hooks && this.hooks.onFinishLine) this.hooks.onFinishLine(s);
      return;
    }

    /* Les tremplins arrivent à date fixe : on les pose quand ils entrent dans
       la portée d'affichage. */
    for (var i = 0; i < this.boosts.length; i++) {
      var b = this.boosts[i];

      /* Le mur se franchit AVANT le turbo qu'il garde : il est donc plus tôt
         sur le parcours, à une distance PLUS PETITE. Il lui faut son propre
         déclenchement — posé en même temps que le turbo, il dépassait la
         limite d'affichage et se retrouvait de l'autre côté. */
      var zMur = (b.at - WALL_AHEAD) - s.dist;
      if (b.hard && !b.wallDone && zMur <= W.Z_FAR && b.at - WALL_AHEAD < s.raceLength - 6) {
        b.wallDone = true;
        this.buildWall(b, zMur);
      }

      if (b.done || b.at - s.dist > W.Z_FAR) continue;
      b.done = true;
      /* On dégage AVANT de poser : clearZone vide la zone, et le turbo posé
         en premier partait avec les sapins qu'il devait remplacer. */
      this.world.props.clearZone(b.at - s.dist - 9, b.at - s.dist + 9);
      this.world.props.spawnBoost(b.at - s.dist, b.x);
    }

    var pris = this.world.props.hitBoost(s.x, s.height);
    if (pris) {
      s.speed = Math.min(s.speed + P.RACE_BOOST, target + P.RACE_BOOST_CAP);
      s.knockFrom = 0;
      s.boostsTaken++;
      s.boostFlash = 1;
      AS.audio.sfx.boost();
      if (this.hooks && this.hooks.onBoost) this.hooks.onBoost(s);
    }
  };

  /* Distance entre le mur et le turbo qu'il garde. Assez pour choisir son
     côté sans précipitation, trop peu pour corriger après coup. */
  var WALL_AHEAD = 34;

  /* Le mur de sapins qui garde un turbo difficile. Il barre toute la piste
     sauf un couloir du côté du turbo : on ne l'attrape qu'en s'étant décalé
     bien avant, donc en connaissant le parcours. */
  Game.prototype.buildWall = function (b, zMur) {
    this.world.props.clearZone(zMur - 7, zMur + 7);

    /* Le couloir laissé libre : la moitié de piste du côté du turbo. */
    var libre = b.side > 0 ? [0.9, P.HALF] : [-P.HALF, -0.9];
    for (var x = -P.HALF + 0.7; x <= P.HALF - 0.7; x += 1.35) {
      if (x >= libre[0] && x <= libre[1]) continue;
      var it = this.world.props.spawn(zMur + (this.rng() - 0.5) * 3, 0, 1);
      if (it) it.x = x;
    }
  };

  Game.prototype.spawnChoiceGate = function (z) {
    /* Mode surprise : une seule pancarte, toute la largeur, un point
       d'interrogation. Rien à choisir — on ne peut ni l'éviter ni savoir ce
       qu'elle cache avant de l'avoir franchie. */
    var choices = this.state.mystery
      ? [AS.CRAZY_MYSTERY]
      : AS.crazy.pickChoices();
    if (!choices.length) return;
    this.world.gates.spawnChoice(choices, AS.crazy.layout(choices.length), z);
    /* Sillage généreux : quand cette porte arrivera sur le joueur, la piste
       sera vide devant lui sur toute cette longueur. */
    this.world.props.clearZone(z - W.CRAZY_CLEAR_AFTER, z + W.GATE_SAFE_BEFORE);
  };

  Game.prototype.spawnGate = function (z) {
    var s = this.state;
    var question = s.provider.next();
    this.world.gates.spawn(question, s.answers, z);
    /* La porte naît peut-être au milieu d'obstacles déjà posés : on dégage
       son approche et sa sortie. */
    this.world.props.clearZone(z - W.GATE_SAFE_BEFORE, z + W.GATE_SAFE_AFTER);
    s.nextGateDist = s.dist + W.GATE_SPACING;
  };

  /* Un obstacle n'a le droit d'apparaître que hors de l'approche et de la
     sortie de toutes les portes en piste. Sinon on demande au joueur de lire
     une réponse et d'esquiver un sapin en même temps, et l'un des deux se
     fait forcément au détriment de l'autre. */
  Game.prototype.zoneIsClear = function (z) {
    var gates = this.world.gates.gates;
    for (var i = 0; i < gates.length; i++) {
      var gate = gates[i];
      if (!gate.active) continue;
      var after = gate.isChoice ? W.CRAZY_CLEAR_AFTER : W.GATE_SAFE_AFTER;
      if (z > gate.z - after && z < gate.z + W.GATE_SAFE_BEFORE) return false;
    }
    return true;
  };

  /* --- Une image de simulation ------------------------------------------ */
  Game.prototype.step = function (dt) {
    var s = this.state;
    if (!s || !s.running) return;
    s.elapsed += dt;

    var input = AS.input;
    /* Une fois la ligne franchie, le skieur ne s'appartient plus : il finit
       sa glissade tout seul. Reprendre la main pendant le dérapage aurait
       l'air d'un bug. */
    var dir = s.finished ? 0 : input.direction();

    /* Les folies du Crazy Mode n'agissent que par multiplicateurs. Hors de ce
       mode, ils valent tous 1 : la physique est alors rigoureusement celle
       qui a été validée. */
    var fx = s.crazy ? AS.crazy.effects : NEUTRAL_FX;
    if (fx.mirror) dir = -dir;

    /* Exposé pour l'animation : le buste doit réagir à l'appui, pas à la
       vitesse latérale qui n'arrive qu'ensuite. En commandes inversées c'est
       la direction RÉELLE qu'on montre, sinon le skieur se pencherait à
       l'opposé de là où il part. */
    s.dir = dir;
    var grip = s.airborne ? P.AIR_GRIP : 1;

    /* Accélération latérale progressive : plus on tient, plus on prend
       d'angle. En l'air on ne dirige presque plus. */
    s.vx += dir * P.LAT_ACCEL * fx.grip * grip * dt;

    /* Friction de carre : forte quand on relâche, faible quand on tient. */
    var friction = (dir === 0 ? P.FRICTION_IDLE : P.FRICTION_INPUT) * fx.slide;
    s.vx -= s.vx * friction * grip * dt;
    s.vx = util.clamp(s.vx, -P.VX_MAX, P.VX_MAX);
    s.x += s.vx * dt;

    /* Bords : la neige profonde repousse, coupe la carre et freine. */
    var edge = P.HALF - P.EDGE_MARGIN;
    if (s.x > edge) {
      s.x = edge + (s.x - edge) * P.EDGE_PUSH;
      s.vx *= P.EDGE_VX_KEEP;
      this.knock(P.EDGE_BRAKE * dt);
    } else if (s.x < -edge) {
      s.x = -edge + (s.x + edge) * P.EDGE_PUSH;
      s.vx *= P.EDGE_VX_KEEP;
      this.knock(P.EDGE_BRAKE * dt);
    }

    /* Saut : impulsion nette, gravité douce, et une petite mémoire tampon
       pour qu'appuyer un peu trop tôt fonctionne quand même. */
    /* « Interdit de sauter » : on avale l'appui pour qu'il ne reste pas en
       mémoire tampon et ne déclenche pas un saut à la fin de la folie. */
    var wantsJump = input.takeJump();
    if (fx.noJump) { wantsJump = false; s.jumpBuffer = 0; }
    if (wantsJump) s.jumpBuffer = P.JUMP_BUFFER;
    if (s.jumpBuffer > 0) s.jumpBuffer -= dt;
    if (s.jumpBuffer > 0 && !s.airborne) {
      s.jumpBuffer = 0;
      s.airborne = true;
      s.airV = P.JUMP_V;
      AS.audio.sfx.jump();
    }
    if (s.airborne) {
      s.airV -= P.GRAVITY * dt;
      s.height += s.airV * dt;
      if (s.height <= 0) {
        s.height = 0;
        s.airV = 0;
        s.airborne = false;
        AS.audio.sfx.land();
      }
    }

    /* Vitesse : elle monte avec la pente (ou le combo), et les virages
       serrés la mangent. */
    var target;
    if (s.crazy) {
      /* Montée plus douce qu'en Freestyle, mais sans plafond : la descente
         doit finir par devenir intenable, sinon rien ne pousse à s'arrêter. */
      target = P.SPEED_BASE_CRAZY
        + P.SPEED_RISE_CRAZY * (1 - Math.exp(-s.dist / P.SPEED_RISE_LEN))
        + s.dist * P.SPEED_CREEP_CRAZY;
    } else if (s.race) {
      /* Elle monte vite au début puis se stabilise : une course se joue sur
         la propreté de la trajectoire, pas sur l'endurance. */
      target = P.RACE_BASE
        + P.RACE_RISE * (1 - Math.exp(-s.dist / P.RACE_RISE_LEN));
    } else if (s.mode === 'freestyle') {
      /* Deux termes : une montée rapide qui sature vers 60 km/h de gagnés, et
         une dérive linéaire qui, elle, ne s'arrête jamais. On atteint donc
         vite une vitesse confortable, puis ça continue de grimper doucement —
         au bout d'un long moment la piste devient réellement intenable, ce
         qui est le but. L'ancien plafond dur coupait la progression net à
         3200 m et la descente ne bougeait plus. */
      target = P.SPEED_BASE_FREE
        + P.SPEED_RISE * (1 - Math.exp(-s.dist / P.SPEED_RISE_LEN))
        + s.dist * P.SPEED_CREEP;
    } else {
      target = Math.min(P.SPEED_BASE_QUIZ + s.combo * P.SPEED_GAIN_QUIZ, P.SPEED_CAP_QUIZ);
    }
    target *= fx.speed;

    var pull;
    if (s.race && target > s.speed) {
      /* Deux choses ici. D'abord on ne prend de la vitesse qu'en allant
         droit : un virage à fond confisque presque toute l'accélération.
         Ensuite le gain est CONSTANT et non proportionnel à l'écart — c'est
         ce qui rend une perte de vitesse réellement coûteuse, puisqu'on la
         reconstruit au même rythme qu'au départ de la course. */
      var droit = 1 - Math.min(1, Math.abs(s.vx) / P.VX_MAX) * P.RACE_TURN_COST;
      pull = Math.min(P.RACE_GAIN * droit * dt, target - s.speed);
    } else {
      pull = (target - s.speed) * P.SPEED_SMOOTH * fx.speedSmooth * dt;
    }
    /* En Crazy, la reprise est plafonnée. Le rappel exponentiel referme
       l'écart d'autant plus vite qu'il est grand : après une bosse on
       récupérait presque tout en une seconde, et perdre de la vitesse ne
       coûtait rien. Avec un gain maximal par seconde, un choc se paie en
       secondes de remontée — le freinage redevient une vraie sanction. Le
       ralentissement, lui, n'est pas bridé : on freine toujours d'un coup. */
    if (s.crazy && pull > 0 && s.knockFrom > 0) {
      var maxGain = P.CRAZY_REGAIN * fx.speedSmooth * dt;
      if (pull > maxGain) pull = maxGain;
    }
    s.speed += pull;

    /* Dette remboursée : on retrouve la vitesse d'avant l'accrochage, ou bien
       la cible a baissé entre-temps et l'attendre serait sans fin. */
    if (s.knockFrom > 0
      && (s.speed >= s.knockFrom || s.speed >= target * 0.98)) {
      s.knockFrom = 0;
    }
    s.speed -= Math.abs(s.vx) * P.CARVE_DRAG * dt;

    /* Enfoncement dans un banc de neige : le freinage s'étale au lieu de
       tomber d'un coup, ce qui se sent bien mieux à la manette. */
    if (s.sinking > 0) {
      s.sinking = Math.max(0, s.sinking - dt);
      this.knock(26 * dt);
    }
    if (s.speed < P.SPEED_FLOOR) s.speed = P.SPEED_FLOOR;

    s.travelled = s.speed * dt;
    s.dist += s.travelled;

    if (s.race) this.raceStep(dt, target);

    /* Jalon des 500 m. Une boucle plutôt qu'un simple `if` : à pleine vitesse
       une image couvre déjà deux mètres, et une image longue (onglet qui
       revient au premier plan) pourrait en couvrir mille — on n'a pas le
       droit d'en sauter un. */
    while (s.dist >= s.nextMilestone) {
      var reached = s.nextMilestone;
      s.nextMilestone += W.MILESTONE;
      /* Pas de jalon en Course : les distances tombent toutes sur un multiple
         de cinq cents, si bien que le dernier arrivait pile sur la ligne et
         recouvrait le temps final.

         Pas de jalon non plus en Vocabulaire ni en Multiplications : sur un
         téléphone, lire trois réponses avant de les atteindre est déjà juste,
         et un grand chiffre au centre de l'écran couvrait exactement la zone
         où elles apparaissent. L'encouragement y coûtait une bonne réponse. */
      if (s.race || s.quiz) continue;
      if (this.hooks && this.hooks.onMilestone) this.hooks.onMilestone(reached);
    }

    s.scroll = s.dist;
    s.level = 1 + Math.floor(s.dist / 450);

    var cap = s.mode === 'freestyle' ? P.SPEED_CAP_FREE : P.SPEED_CAP_QUIZ;
    s.speed01 = util.clamp((s.speed - P.SPEED_FLOOR) / (cap - P.SPEED_FLOOR), 0, 1);

    if (s.crazy && !s.solo) AS.crazy.update(s.dist);

    this.spawn();
  };

  /* --- Apparitions -------------------------------------------------------
     En freestyle les obstacles se resserrent avec la distance ; dans les
     modes à questions ils restent rares pour ne pas voler l'attention. */
  Game.prototype.spawn = function () {
    var s = this.state;
    var fx = s.crazy ? AS.crazy.effects : NEUTRAL_FX;

    /* Billots : espacés régulièrement, parce que c'est un exercice de rythme.
       36 m à vingt-cinq mètres par seconde laissent une seconde et demie
       entre deux sauts — exigeant mais tenable. */
    if (fx.logs) {
      if (s.dist > s.nextLogDist) {
        s.nextLogDist = s.dist + 34 + Math.random() * 8;
        var lz = W.Z_FAR - 4;
        if (this.zoneIsClear(lz)) {
          this.world.props.spawnLog(lz, this.pickLogSpan(), this.pickLogCentre());
        }
      }
    } else {
      s.nextLogDist = s.dist + 18;
    }

    if (fx.bunny && s.dist > s.nextObstacleDist) {
      s.nextObstacleDist = s.dist + 26 + Math.random() * 14;
      var yz = W.Z_FAR - Math.random() * 8;
      if (this.zoneIsClear(yz)) {
        var pick = Math.random();
        if (pick < 0.34) this.world.props.spawnHollow(yz);
        else if (pick < 0.68) this.world.props.spawnRunner(yz);
        else this.world.props.spawn(yz, 1, 0.9, true);
      }
    } else if (fx.bumps && s.dist > s.nextObstacleDist) {
      s.nextObstacleDist = s.dist + 11 + Math.random() * 9;
      var bz = W.Z_FAR - Math.random() * 10;
      if (this.zoneIsClear(bz)) this.world.props.spawnBump(bz);

      /* Des sapins pour de bon, et non un sur quatre. Sans eux la seule
         question posée par un champ de bosses est « est-ce que je les
         contourne ? », et la réponse est toujours oui : le mode n'avait aucun
         intérêt. Avec les arbres il faut choisir sa ligne, et une bosse prise
         de travers coûte la vitesse qu'il fallait pour le sapin d'après.
         Un peu moins dense qu'une descente ordinaire — il y a déjà les
         bosses à lire. */
      var arbres = Math.random() < 0.80 * fx.treeRate ? 1 : 0;
      if (arbres && Math.random() < 0.35) arbres = 2;
      for (var a = 0; a < arbres; a++) {
        var tz = W.Z_FAR - Math.random() * 16;
        if (this.zoneIsClear(tz)) this.world.props.spawn(tz, 0.1, 1);
      }
    } else if (s.race && s.dist > s.nextObstacleDist) {
      /* Semis reproductible : la même piste pour tout le monde, à chaque
         tentative. Sans cela, comparer deux temps n'aurait aucun sens — et
         apprendre le parcours, qui est le plaisir d'une course, serait
         impossible. */
      var r = this.rng;
      /* Densité resserrée : trois étoiles doivent se mériter, et une piste
         trop vide se descendait tout droit sans réfléchir. Deux obstacles à
         la fois de temps en temps, jamais côte à côte — on garde toujours un
         passage, mais il faut le choisir tôt. */
      s.nextObstacleDist = s.dist + 21 + r() * 13;
      /* Rien ne se sème au-delà de la ligne : après l'arrivée on dérape sur
         une piste vide, et un sapin qui défile encore pendant que le chrono
         est arrêté n'a aucun sens. */
      if (s.dist + W.Z_FAR >= s.raceLength - 6) return;
      var combien = r() < 0.30 ? 2 : 1;
      var precedent = null;
      for (var k = 0; k < combien; k++) {
        var rz = W.Z_FAR - r() * 12;
        if (!this.zoneIsClear(rz)) continue;
        var it = this.world.props.spawn(rz, 0.3, 1);
        if (!it) continue;
        /* On rejoue la position latérale avec la graine : spawn() tire la
           sienne au hasard, ce qui rendrait le parcours différent à chaque
           tentative. */
        var px = (r() * 2 - 1) * (P.HALF - 0.8);
        /* Deux obstacles au même endroit fermeraient la piste. */
        if (precedent !== null && Math.abs(px - precedent) < 2.6) px = -px;
        it.x = px;
        precedent = px;
      }
    } else if (!fx.bumps && fx.treeRate > 0 && s.dist > s.nextObstacleDist) {
      var freestyle = s.mode === 'freestyle' || s.crazy;
      var gap = freestyle ? (26 - Math.min(s.level * 2, 12)) : 40;
      s.nextObstacleDist = s.dist + (gap / fx.treeRate) * (0.6 + Math.random() * 0.8);
      var count = freestyle ? (1 + Math.floor(Math.random() * 2)) : 1;
      for (var i = 0; i < count; i++) {
        var z = W.Z_FAR - Math.random() * 14;
        if (this.zoneIsClear(z)) {
          this.world.props.spawn(z, this.rockChance(fx), fx.propScale, fx.propScale < 0.6);
        }
      }
    } else if (fx.treeRate === 0 && !fx.logs) {
      s.nextObstacleDist = s.dist + 14;
    }

    if (s.crazy) {
      if (s.solo) return;      // descente sur mesure : aucune porte
      if (!this.world.gates.hasPending()) {
        var span = AS.crazySpan();
        s.crazyNext += span;
        this.spawnChoiceGate(span);
      }
      return;
    }

    /* Le mode Course n'a pas de questions : pas de porte à poser, et surtout
       pas de fournisseur de questions à interroger. */
    if (s.mode !== 'freestyle' && !s.race
      && s.dist > s.nextGateDist - W.GATE_LEAD
      && !this.world.gates.hasPending()) {
      this.spawnGate(W.Z_FAR);
    }
  };

  /* --- Ce qui se joue après le déplacement du monde ---------------------- */
  Game.prototype.resolve = function () {
    var s = this.state;
    if (!s || !s.running) return;

    var gates = this.world.gates.gates;
    for (var i = 0; i < gates.length; i++) {
      var gate = gates[i];
      if (gate.active && !gate.resolved && gate.z <= 0.6) {
        gate.resolved = true;
        this.judge(gate);
        if (!s.running) return;
      }
    }

    var through = this.world.props.throughHollow(s.x, s.height);
    if (through) {
      s.score += 100;
      this.world.setFlash(AS.PALETTE.beanie, 0.9);
      AS.audio.sfx.good();
      if (this.hooks && this.hooks.onHollow) this.hooks.onHollow(through);
    }

    var bump = this.world.props.hitBump(s.x, s.height);
    if (bump) {
      /* On ne REBONDIT pas sur un banc de neige : on s'y enfonce. Les skis
         disparaissent sous la poudreuse et la vitesse tombe progressivement
         pendant qu'on laboure. Un rebond donnait l'impression d'un tremplin,
         alors que c'est un frein — et c'est ce frein qu'on vient chercher
         quand on décide d'en prendre une. */
      s.sinking = Math.max(s.sinking || 0, 0.55);
      this.world.kick(0.25);
      AS.audio.sfx.land();
    }

    var hit = this.world.props.collide(s.x, s.height);
    if (hit) this.crash(hit.type === 'runner');
  };

  /* Applique une folie SANS ATTENDRE.

     Le piège : un obstacle naît à cent vingt mètres devant et met donc tout
     ce temps à arriver. Sans nettoyage, ce qu'on croise pendant les cent
     mètres qui suivent un choix a été posé selon l'ANCIENNE règle — la folie
     ne se voit qu'une fois expirée. On balaie donc ce qui est en vol et on
     repeuple aussitôt selon la nouvelle. */
  Game.prototype.repopulate = function () {
    var s = this.state;
    var fx = AS.crazy.effects;
    var props = this.world.props;

    /* On ne balaie qu'à partir de CRAZY_CLEAR_AFTER. En deçà, la zone est
       déjà vide — la porte a dégagé son sillage en apparaissant — donc rien
       ne disparaît sous les yeux du joueur. C'est ce qui rendait le
       changement de folie si voyant : des sapins s'évanouissaient à dix
       mètres. */
    props.clearAhead(W.CRAZY_CLEAR_AFTER);
    s.nextObstacleDist = s.dist;
    s.nextLogDist = s.dist;

    var z = W.CRAZY_CLEAR_AFTER + 6;
    var guard = 0;
    while (z < W.Z_FAR && guard++ < 40) {
      if (!this.zoneIsClear(z)) { z += 8; continue; }

      if (fx.bunny) {
        /* Trois obstacles à thème, aucun sapin : un tronc creux à viser, un
           lapin qui traverse, un rocher bas qu'on saute. */
        var roll = Math.random();
        if (roll < 0.34) props.spawnHollow(z);
        else if (roll < 0.68) props.spawnRunner(z);
        else props.spawn(z, 1, 0.9, true);
        z += 26 + Math.random() * 14;
      } else if (fx.logs) {
        props.spawnLog(z, this.pickLogSpan(), this.pickLogCentre());
        z += 34 + Math.random() * 8;
      } else if (fx.bumps) {
        props.spawnBump(z);
        z += 11 + Math.random() * 9;
      } else if (fx.treeRate > 0) {
        props.spawn(z, this.rockChance(fx), fx.propScale, fx.propScale < 0.6);
        z += (22 / fx.treeRate) * (0.65 + Math.random() * 0.7);
      } else {
        z += 24;
      }
    }
  };

  /* Largeur d'un billot. Un tiers du temps il barre tout et il FAUT sauter ;
     sinon il laisse un passage, et sauter devient un choix. */
  Game.prototype.pickLogSpan = function () {
    var roll = Math.random();
    if (roll < 0.38) return P.HALF;              // pleine largeur
    if (roll < 0.72) return P.HALF * 0.66;
    return P.HALF * 0.36;
  };

  Game.prototype.pickLogCentre = function () {
    return (Math.random() < 0.5 ? -1 : 1) * Math.random() * P.HALF * 0.5;
  };

  Game.prototype.rockChance = function (fx) {
    if (fx.rockChance >= 0) return fx.rockChance;
    var s = this.state;
    return (s.mode === 'freestyle' || s.crazy) ? 0.18 : 0.34;
  };

  Game.prototype.judge = function (gate) {
    var s = this.state;
    var chosen = gate.pick(s.x);

    /* Crazy Mode : il n'y a ni bonne ni mauvaise pancarte. On applique ce
       qu'on a traversé, on félicite, et on passe à la suite. */
    if (gate.isChoice) {
      if (chosen && chosen.modifier) {
        /* La pancarte mystère ne porte aucune folie : on la tire ici, à
           l'instant du franchissement, et c'est l'annonce qui la révèle. */
        var mod = chosen.modifier.id === 'mystery'
          ? AS.crazy.pickMystery()
          : chosen.modifier;
        chosen.modifier = mod;
        AS.crazy.choose(mod, s.dist);
        this.repopulate();
        chosen.reveal(true, true);
        this.world.setFlash(
          mod.bonus ? AS.PALETTE.beanie : AS.PALETTE.good, 0.8
        );
        AS.audio.sfx.good();
        if (this.hooks && this.hooks.onChoice) {
          this.hooks.onChoice(mod, chosen, gate);
        }
      }
      return;
    }

    gate.reveal(chosen);

    if (chosen && chosen.correct) {
      s.right++;
      var points = 10 * s.combo;
      s.score += points;
      s.combo++;
      if (s.combo > s.bestCombo) s.bestCombo = s.combo;
      this.world.setFlash(AS.PALETTE.good, 1);
      AS.audio.sfx.good();
      /* Le bonus s'affiche là où était la pancarte, pas dans un coin : c'est
         le geste qu'on récompense, il faut le voir à l'endroit du geste. */
      if (this.hooks && this.hooks.onBonus) {
        this.hooks.onBonus(points, s.combo - 1, chosen, gate);
      }
      /* §15 : point d'entrée pour la prononciation enregistrée. Tant qu'il
         n'y a pas de fichier, on ne fait rien — mais le crochet existe. */
      if (this.hooks && this.hooks.onAnswer) {
        this.hooks.onAnswer(true, gate.answer, gate.audio);
      }
    } else {
      /* Pas de pancarte à portée : le joueur est passé dans un trou. C'est
         une erreur au même titre qu'une mauvaise réponse. */
      s.wrong++;
      s.impactSpeed = s.speed;    // idem : la vitesse d'avant la sanction
      s.combo = 1;
      s.speed *= P.PENALTY_WRONG;
      s.lives--;
      this.world.setFlash(AS.PALETTE.bad, 1);
      this.world.kick(0.9);
      AS.audio.sfx.bad();
      if (this.hooks && this.hooks.onAnswer) {
        this.hooks.onAnswer(false, gate.answer, gate.audio);
      }
      if (s.lives <= 0) this.gameOver();
    }
  };

  /* `soft` : une maladresse plutôt qu'un accident. On perd une vie tout
     pareil, mais la sanction se raconte autrement — gerbe de confettis, pas
     d'écran rouge, secousse minime. Percuter un lapin en mode lapin doit
     rester drôle. */
  Game.prototype.crash = function (soft) {
    var s = this.state;
    s.impactSpeed = s.speed;      // relevé avant toute pénalité
    if (s.crazy && s.speed > s.knockFrom) s.knockFrom = s.speed;
    /* En Course on ne meurt pas : tout le monde doit pouvoir franchir la
       ligne. La sanction est la vitesse perdue, et elle suffit largement —
       c'est le chronomètre qui juge, pas un compteur de vies. */
    if (!s.race) s.lives--;
    s.combo = 1;
    s.speed *= soft ? 0.72 : P.PENALTY_HIT;

    if (soft) {
      var ground = AS.terrain.heightAt(s.x, s.scroll);
      this.world.confetti.burst(s.x, ground + s.height, 0.4);
      this.world.setFlash(AS.PALETTE.beanie, 0.7);
      this.world.kick(0.5);
      AS.audio.sfx.bad();
    } else {
      this.world.setFlash(AS.PALETTE.bad, 1.2);
      this.world.kick(1.4);
      AS.audio.sfx.crash();
    }
    if (this.hooks && this.hooks.onHit) this.hooks.onHit();
    if (s.lives <= 0) this.gameOver();
  };

  Game.prototype.gameOver = function () {
    var s = this.state;
    if (!s.running) return;
    s.running = false;
    AS.audio.sfx.over();
    if (this.hooks && this.hooks.onGameOver) this.hooks.onGameOver(s);
  };

  AS.Game = Game;
})((window.AlpineSchool = window.AlpineSchool || {}));
