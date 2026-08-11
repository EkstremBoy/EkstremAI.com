/* =========================================================================
   Alpine School — démarrage et boucle
   ========================================================================= */
(function (AS) {
  'use strict';

  var canvas = document.getElementById('scene');
  var stage = document.getElementById('stage');

  /* --- Garde-fou WebGL --------------------------------------------------- */
  function webglAvailable() {
    try {
      var probe = document.createElement('canvas');
      return !!(window.WebGLRenderingContext
        && (probe.getContext('webgl2') || probe.getContext('webgl')));
    } catch (e) {
      return false;
    }
  }

  AS.i18n.detect();
  AS.i18n.apply();

  if (!webglAvailable() || typeof THREE === 'undefined') {
    document.getElementById('menu').classList.add('is-hidden');
    document.getElementById('fatal').classList.remove('is-hidden');
    document.getElementById('fatalMsg').textContent =
      AS.i18n.t(typeof THREE === 'undefined' ? 'fatal.nothree' : 'fatal.nowebgl');
    return;
  }

  var reducedMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var world = new AS.World(canvas, { reducedMotion: reducedMotion });
  var hud = new AS.Hud();

  var screenPos = { x: 0, y: 0 };

  var game = new AS.Game(world, {
    onGameOver: function (state) {
      AS.input.setEnabled(false);
      AS.audio.stopWind();
      AS.music.stop();
      if (state.mode === 'freestyle') noteFreestyleRun(state.dist);
      if (state.crazy) noteCrazyRun(state.dist);
      if (state.race) refreshRace();
      hud.showOver(state);
    },
    /* Tous les 500 m, quel que soit le mode : la distance est la seule chose
       que toutes les descentes ont en commun. */
    onMilestone: function (metres) {
      hud.showMilestone(metres);
      AS.audio.sfx.milestone();
    },
    /* La ligne est franchie : on coupe les commandes, la musique s'arrête et
       le skieur part en dérapage. Le résultat attend qu'il soit immobile. */
    onFinishLine: function (state) {
      AS.input.setEnabled(false);
      AS.audio.sfx.milestone();
      hud.showFlourish(
        AS.race.format(state.raceTime), AS.i18n.t('race.stat.time'),
        { compact: true, seconds: 2.6 }
      );
    },

    onRaceEnd: function (state) {
      AS.audio.stopWind();
      AS.music.stop();
      var etoiles = AS.race.stars(state.raceLength, state.raceTime, true);
      AS.race.noteStars(state.raceLength, etoiles);
      var place = AS.race.record(state.raceLength, state.raceTime);
      hud.showOver(state);
      if (place && place.rank === 1) hud.setOverNote(AS.i18n.t('race.record'));
      askName(place);
      refreshRace();
    },

    onBonus: function (points, combo, panel, gate) {
      /* La pancarte est juste sur nous au moment du franchissement : on vise
         un peu au-dessus de son bord haut pour que le chiffre ne recouvre pas
         le mot qu'on vient de lire. */
      var top = panel.group.position.y + panel.h * 0.5 + 0.55;
      world.toScreen(panel.x, top, -gate.z, screenPos);
      hud.showBonus(points, combo, screenPos.x, screenPos.y);
    },
    onHollow: function () {
      hud.showBonus(100, 1, window.innerWidth / 2, window.innerHeight * 0.44);
    },
    onChoice: function (mod, panel, gate) {
      var top = panel.group.position.y + panel.h * 0.5 + 0.55;
      world.toScreen(panel.x, top, -gate.z, screenPos);
      hud.showChoice(AS.modifierLabel(mod), mod.bonus, screenPos.x, screenPos.y);
    }
  });

  /* --- Choix du menu ------------------------------------------------------ */
  /* Rien n'est choisi d'avance : les deux décisions — le niveau des mots et le
     nombre de réponses — doivent être prises avant de partir. Une valeur par
     défaut invisible faisait qu'on descendait en « Moyen » sans l'avoir voulu. */
  var chosenDiff = null;
  var chosenLevel = null;
  var chosenMode = null;
  var screen = 'menu';       // 'menu' | 'play' | 'over'

  /* --- État de veille -----------------------------------------------------
     Le menu n'est pas posé sur un fond fixe : la montagne défile derrière.
     C'est le même moteur, avec un pilote imaginaire qui trace de longues
     courbes. */
  var idle = {
    mode: 'freestyle', x: 0, vx: 0, speed: 20, speed01: 0.28,
    dist: 0, scroll: 0, travelled: 0,
    height: 0, airborne: false, running: true, t: 0
  };

  function stepIdle(dt) {
    idle.t += dt;
    var target = Math.sin(idle.t * 0.42) * 2.2;
    var prevX = idle.x;
    idle.x += (target - idle.x) * Math.min(1, dt * 1.6);
    idle.vx = dt > 0 ? (idle.x - prevX) / dt : 0;
    idle.travelled = idle.speed * dt;
    idle.dist += idle.travelled;
    idle.scroll = idle.dist;
  }

  /* --- Boucle ------------------------------------------------------------- */
  var last = 0;
  var running = false;

  /* Suivi de charge : si la machine ne tient pas, on baisse la résolution
     interne plutôt que de laisser le jeu ramer. La densité de pixels reste
     plafonnée à 2, comme demandé. */
  var frameSamples = [];
  var dprScale = 1;

  function watchLoad(dt) {
    frameSamples.push(dt);
    if (frameSamples.length < 90) return;
    var sum = 0;
    for (var i = 0; i < frameSamples.length; i++) sum += frameSamples[i];
    var avg = sum / frameSamples.length;
    frameSamples.length = 0;

    if (avg > 0.0225 && dprScale > 0.62) {
      dprScale = Math.max(0.62, dprScale - 0.18);
      applyDpr();
    } else if (avg < 0.0136 && dprScale < 1) {
      dprScale = Math.min(1, dprScale + 0.12);
      applyDpr();
    }
  }

  function applyDpr() {
    var base = Math.min(window.devicePixelRatio || 1, 2);
    world.renderer.setPixelRatio(base * dprScale);
    world.renderer.setSize(window.innerWidth, window.innerHeight, false);
    world.post.setSize(world.renderer);
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);

    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (dt <= 0) return;

    if (paused || mobileFrozen) {
      /* Figé : on rend l'image telle quelle, sans avancer la simulation. */
      world.render();
      return;
    }

    if (screen === 'play' && game.state && game.state.running) {
      game.step(dt);
      world.update(game.state, dt);
      game.resolve();
      hud.update(game.state, world.gates);
      AS.audio.setWind(game.state.speed01);
      /* Le tempo suit la distance, pas la vitesse : la vitesse plafonne vite
         et se remet à zéro à chaque virage serré, ce qui ferait pomper la
         musique. La distance, elle, ne fait que monter — la descente
         s'emballe donc franchement, sans jamais reculer. */
      if (game.state.mode === 'freestyle') {
        AS.music.setIntensity(Math.min(game.state.dist / 2200, 1));
        /* Le déblocage se constate en cours de descente, pas seulement à la
           fin : atteindre 2000 m puis percuter un sapin ne doit pas annuler
           ce qu'on vient d'accomplir. */
        noteFreestyleRun(game.state.dist);
      } else if (game.state.crazy) {
        noteCrazyRun(game.state.dist);
      }
      watchLoad(dt);
    } else if (screen === 'menu') {
      stepIdle(dt);
      world.update(idle, dt);
    } else if (game.state) {
      /* Partie finie : la scène se fige, les particules finissent de
         retomber. */
      game.state.travelled = 0;
      world.update(game.state, dt);
    }

    world.render();
  }

  function loopOn() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function loopOff() {
    running = false;
  }

  /* --- Passage d'un écran à l'autre --------------------------------------- */
  function startGame(mode, level) {
    AS.audio.unlock();
    AS.audio.resume();
    var state = game.start(mode, level, chosenDiff || 3);
    screen = 'play';
    hud.showGame(state);
    refreshOrientation();
    AS.input.setEnabled(true);
    AS.audio.startWind();

    var nightBonus = applyNightBonus(mode);
    state.nocturne = nightBonus;

    AS.music.stop();
    if (musicAllowed()) {
      /* En Freestyle l'intensité monte avec la distance ; en Crazy elle est
         posée une fois pour toutes. L'intensité règle à la fois le tempo et
         la densité de l'arrangement : à mi-course elle donne un morceau
         complet qui ne s'emballe jamais. */
      /* En Course le tempo ne bouge pas non plus : on court après un chrono,
         pas après une montée en pression. */
      AS.music.setIntensity(mode === 'freestyle' ? 0 : (mode === 'race' ? 0.62 : 0.5));
      AS.music.start();
    }
    if (nightBonus) {
      hud.showFlourish(
        AS.i18n.t('bonus.night'), AS.i18n.t('bonus.night.sub'),
        { compact: true, seconds: 3.4 }
      );
    }
    /* Sur téléphone, chaque descente s'ouvre sur le mode d'emploi tactile :
       il n'y a pas de clavier, donc pas d'aide des touches au menu. */
    AS.mobile.runStarted();
    loopOn();
  }

  /* Musique en Freestyle et en Crazy. Dans les modes à questions elle
     entrerait en concurrence avec les sons de réponse, qui portent une
     information — savoir si on a eu juste doit s'entendre sans effort. */
  function musicAllowed() {
    return !!(game.state
      && (game.state.mode === 'freestyle' || game.state.crazy
        || game.state.race));
  }

  /* Le style choisi par le joueur, mis de côté le temps d'une descente de
     nuit : le nocturne ne doit pas devenir son réglage permanent. */
  var styleBeforeNight = null;

  /* Descente de nuit et rien d'autre : on troque la boucle rythmique contre
     un piano. C'est une récompense, donc elle ne s'annonce nulle part — on la
     trouve en ne cochant qu'une seule case. */
  function applyNightBonus(mode) {
    var solo = mode === 'crazy' && !AS.crazy.mystery
      ? AS.crazy.soloModifier()
      : null;
    var night = !!(solo && solo.id === 'night');

    /* Un joueur qui a coupé la musique l'a fait exprès : une récompense
       sonore imposée serait une contrariété, pas un cadeau. */
    if (AS.music.style() === 'off' && styleBeforeNight === null) night = false;

    if (night && AS.music.style() !== 'nocturne') {
      styleBeforeNight = AS.music.style();
      AS.music.setStyle('nocturne');
    } else if (!night && styleBeforeNight !== null) {
      AS.music.setStyle(styleBeforeNight);
      styleBeforeNight = null;
    }
    return night;
  }

  function backToMenu() {
    screen = 'menu';
    AS.input.setEnabled(false);
    AS.audio.stopWind();
    AS.music.stop();
    world.reset();
    idle.t = 0;
    hud.showMenu();
    if (AS.mobile) AS.mobile.refresh();
    closeCategories();
    refreshOrientation();
    loopOn();
  }

  /* --- Menu pause ----------------------------------------------------------
     Il gèle la simulation sans arrêter le rendu : la montagne reste à
     l'écran, figée, ce qui évite l'écran noir et rappelle qu'on est en pleine
     descente. */
  var paused = false;
  var mobileFrozen = false;

  var pause = new AS.Pause({
    canOpen: function () { return screen === 'play' && game.state && game.state.running; },
    state: function () { return game.state; },
    onOpen: function () {
      paused = true;
      AS.input.setEnabled(false);
      AS.audio.stopWind();
      AS.music.stop();
    },
    onClose: function () {
      paused = false;
      if (screen !== 'play') return;
      AS.input.setEnabled(true);
      AS.audio.startWind();
      if (musicAllowed()) AS.music.start();
    },
    onRestart: function () {
      startGame(game.state.mode, game.state.contentLevel);
    },
    onQuit: backToMenu
  });

  /* --- Déblocage du Crazy Mode --------------------------------------------
     Il s'ouvre après 2000 m en Freestyle. Rien n'est écrit sur le disque — le
     jeu ne conserve aucune donnée — donc le déblocage vaut pour la session en
     cours. Recharger la page referme la porte. */
  var CRAZY_UNLOCK = 2000;
  var bestFreestyle = 0;
  var crazyUnlocked = false;

  var crazyBtn = document.querySelector('[data-category="crazy"]');
  var crazyDesc = document.getElementById('crazyDesc');

  function refreshCrazyLock() {
    crazyBtn.classList.toggle('is-locked', !crazyUnlocked);
    crazyBtn.setAttribute('aria-disabled', crazyUnlocked ? 'false' : 'true');
    if (crazyUnlocked) {
      crazyDesc.setAttribute('data-i18n', 'mode.crazy.desc');
      crazyDesc.textContent = AS.i18n.t('mode.crazy.desc');
    } else {
      crazyDesc.removeAttribute('data-i18n');
      crazyDesc.textContent = bestFreestyle > 0
        ? AS.i18n.t('crazy.locked.body', { best: Math.round(bestFreestyle) })
        : AS.i18n.t('crazy.locked');
    }
  }

  /* --- Déblocage du mode surprise ---------------------------------------
     Il s'ouvre à 2000 m de Crazy Mode. Comme pour le Crazy Mode lui-même, on
     le constate en cours de descente : atteindre la barre puis s'écraser ne
     doit pas effacer ce qu'on vient de faire. */
  var RANDOM_UNLOCK = 2000;
  var bestCrazy = 0;
  var randomUnlocked = false;
  var mysteryStart = document.getElementById('mysteryStart');
  var mysteryLabel = document.getElementById('mysteryLabel');
  var mysteryHint = document.getElementById('mysteryHint');

  function refreshRandomLock() {
    mysteryStart.classList.toggle('is-locked', !randomUnlocked);
    mysteryStart.disabled = !randomUnlocked;
    mysteryLabel.textContent = AS.i18n.t('crazy.random');
    mysteryHint.classList.toggle('is-error', false);
    mysteryHint.textContent = randomUnlocked
      ? AS.i18n.t('crazy.random.hint')
      : (bestCrazy > 0
        ? AS.i18n.t('crazy.random.locked.body',
          { gap: Math.max(1, Math.round(RANDOM_UNLOCK - bestCrazy)) })
        : AS.i18n.t('crazy.random.locked'));
  }

  function noteCrazyRun(dist) {
    if (dist <= bestCrazy) return;
    bestCrazy = dist;
    if (!randomUnlocked && bestCrazy >= RANDOM_UNLOCK) randomUnlocked = true;
    refreshRandomLock();
  }

  function noteFreestyleRun(dist) {
    if (dist <= bestFreestyle) return;
    bestFreestyle = dist;
    if (!crazyUnlocked && bestFreestyle >= CRAZY_UNLOCK) crazyUnlocked = true;
    refreshCrazyLock();
  }

  /* --- Catalogue des folies ----------------------------------------------- */
  var catalogueEl = document.getElementById('catalogue');
  var catStatus = document.getElementById('catStatus');
  var crazyStart = document.getElementById('crazyStart');
  var catAll = document.getElementById('catAll');
  var catAllLabel = document.getElementById('catAllLabel');

  function buildCatalogue() {
    catalogueEl.textContent = '';
    AS.MODIFIERS.forEach(function (mod) {
      var row = document.createElement('label');
      row.className = 'cat-item' + (mod.bonus ? ' is-bonus' : '');

      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = AS.crazy.enabled[mod.id] !== false;
      box.addEventListener('change', function () {
        AS.crazy.setEnabled(mod.id, box.checked);
        refreshCatalogueState();
      });

      var text = document.createElement('span');
      text.className = 'cat-text';
      var name = document.createElement('span');
      name.className = 'cat-name';
      name.textContent = AS.modifierLabel(mod);
      var desc = document.createElement('span');
      desc.className = 'cat-desc';
      desc.textContent = AS.modifierDescription(mod);
      text.appendChild(name);
      text.appendChild(desc);

      row.appendChild(box);
      row.appendChild(text);
      catalogueEl.appendChild(row);
    });
    refreshCatalogueState();
  }

  /* Il faut de quoi remplir deux pancartes : en dessous, la porte n'offrirait
     plus de choix du tout. */
  function refreshCatalogueState() {
    /* Une seule folie cochée, c'est une DESCENTE SUR MESURE : elle tourne du
       début à la fin, sans aucune porte. Le bouton le dit, sinon on croit à
       un bug. */
    var solo = AS.crazy.soloModifier();
    var total = AS.crazy.totalEnabled();
    var ok = total >= 1;

    crazyStart.disabled = !ok;
    crazyStart.style.opacity = ok ? '' : '0.5';
    crazyStart.textContent = solo
      ? AS.i18n.t('crazy.custom') + ' — ' + AS.modifierLabel(solo)
      : AS.i18n.t('crazy.start');
    crazyStart.removeAttribute('data-i18n');

    /* Un seul message, qui décrit l'état où l'on est — pas un avertissement
       et un conseil qui se contredisent. */
    catStatus.classList.toggle('is-error', !ok);
    if (!ok) catStatus.textContent = AS.i18n.t('crazy.needOne');
    else if (solo) catStatus.textContent = AS.i18n.t('crazy.solo.hint');
    else catStatus.textContent = '';

    /* Le glissoir reflète l'état réel : coché si tout est coché. */
    refreshRandomLock();
    catAll.checked = total === AS.MODIFIERS.length;
    catAllLabel.textContent = AS.i18n.t(catAll.checked ? 'crazy.none' : 'crazy.all');
  }

  /* Tout cocher / tout décocher d'un geste. Le glissoir bascule vers l'état
     inverse de ce qu'on voit : s'il reste une case décochée, il coche tout. */
  catAll.addEventListener('change', function () {
    var on = AS.crazy.totalEnabled() !== AS.MODIFIERS.length;
    AS.MODIFIERS.forEach(function (mod) { AS.crazy.setEnabled(mod.id, on); });
    buildCatalogue();
  });

  /* --- Câblage du menu ----------------------------------------------------
     Une catégorie ouverte referme l'autre. Recliquer referme. Les
     sous-niveaux n'existent visuellement qu'une fois la catégorie ouverte. */
  var categories = document.querySelectorAll('[data-category]');
  var levelBlocks = document.querySelectorAll('.levels');

  function closeCategories() {
    chosenMode = null;
    if (descentPick) descentPick.hidden = true;
    for (var i = 0; i < categories.length; i++) {
      categories[i].classList.remove('is-open');
      categories[i].setAttribute('aria-expanded', 'false');
    }
    for (var j = 0; j < levelBlocks.length; j++) {
      levelBlocks[j].classList.remove('is-open');
    }
  }

  Array.prototype.forEach.call(categories, function (button) {
    button.addEventListener('click', function () {
      var name = button.getAttribute('data-category');
      if (name === 'crazy' && !crazyUnlocked) return;
      var block = document.querySelector('.levels[data-for="' + name + '"]');
      var wasOpen = block.classList.contains('is-open');
      closeCategories();
      if (!wasOpen) {
        block.classList.add('is-open');
        button.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');

        /* Le réglage de piste rejoint le panneau qu'on vient d'ouvrir, et
           seulement pour les modes qui ont des pancartes. On remet les deux
           choix à zéro : ouvrir un mode, c'est repartir de la question
           « quel niveau, quelle piste ? ». */
        if (name === 'race') refreshRace();
        if (name === 'words' || name === 'math') {
          chosenMode = name;
          chosenLevel = null;
          chosenDiff = null;
          block.appendChild(descentPick);
          descentPick.hidden = false;
          refreshQuizPick();
        }
      }
    });
  });

  /* Freestyle part directement : il n'a ni niveau ni pancarte à régler. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-start]'), function (button) {
    button.addEventListener('click', function () {
      startGame(button.getAttribute('data-start'),
        parseInt(button.getAttribute('data-level'), 10) || 1);
    });
  });

  /* --- Entrée au tableau des temps ---------------------------------------
     On ne demande le nom que si la course y entre vraiment : poser la
     question après chaque descente en ferait une corvée. */
  var nameEntry = document.getElementById('nameEntry');
  var nameInput = document.getElementById('nameInput');
  var pendingEntry = null;

  function askName(place) {
    pendingEntry = place ? place.entry : null;
    nameEntry.classList.toggle('is-off', !pendingEntry);
    if (!pendingEntry) return;
    nameInput.value = '';
    /* Le focus part sur le champ : on veut pouvoir taper son nom et valider
       à Entrée sans toucher la souris. */
    setTimeout(function () { nameInput.focus(); }, 60);
  }

  nameEntry.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!pendingEntry) return;
    var nom = nameInput.value.trim() || AS.i18n.t('race.name.default');
    AS.race.nameEntry(pendingEntry, nom);
    pendingEntry = null;
    nameEntry.classList.add('is-off');
    hud.setOverNote(AS.i18n.t('race.name.saved', { n: nom }));
    nameInput.blur();
    refreshRace();
  });

  /* --- Mode Course : cartes de distance et tableau des temps -------------- */
  var racePick = document.getElementById('racePick');
  var raceBoard = document.getElementById('raceBoard');
  var boardReset = document.getElementById('boardReset');

  function buildRacePick() {
    racePick.textContent = '';
    AS.race.COURSES.forEach(function (c) {
      var card = document.createElement('button');
      card.className = 'race-card';
      card.type = 'button';

      var titre = document.createElement('b');
      titre.textContent = c.metres + ' m';

      /* Les trois étoiles, allumées ou éteintes : c'est le seul endroit où
         l'on voit ce qu'il reste à décrocher. */
      var etoiles = document.createElement('span');
      etoiles.className = 'race-stars';
      var gagnees = AS.race.starsFor(c.id);
      for (var i = 0; i < 3; i++) {
        var st = document.createElement('i');
        st.className = i < gagnees ? 'is-on' : '';
        st.textContent = '★';
        etoiles.appendChild(st);
      }

      var record = document.createElement('span');
      record.className = 'race-best';
      var b = AS.race.best(c.id);
      record.textContent = b === null
        ? AS.i18n.t('race.nobest')
        : AS.i18n.t('race.best', { t: AS.race.format(b) });

      card.appendChild(titre);
      card.appendChild(etoiles);
      card.appendChild(record);
      card.addEventListener('click', function () { startGame('race', c.id); });
      racePick.appendChild(card);
    });
  }

  function buildBoard() {
    raceBoard.textContent = '';
    if (AS.race.isEmpty()) {
      var vide = document.createElement('p');
      vide.className = 'board-empty';
      vide.textContent = AS.i18n.t('race.board.empty');
      raceBoard.appendChild(vide);
      boardReset.disabled = true;
      boardReset.style.opacity = '0.45';
      return;
    }
    boardReset.disabled = false;
    boardReset.style.opacity = '';

    AS.race.COURSES.forEach(function (c) {
      AS.race.times(c.id).forEach(function (e, rang) {
        var row = document.createElement('div');
        row.className = 'board-row';
        var g = document.createElement('span');
        g.textContent = c.metres + ' m · nº' + (rang + 1)
          + (e.name ? ' · ' + e.name : '');
        var d = document.createElement('span');
        d.textContent = AS.race.format(e.t);
        row.appendChild(g);
        row.appendChild(d);
        raceBoard.appendChild(row);
      });
    });
  }

  function refreshRace() {
    buildRacePick();
    buildBoard();
  }

  boardReset.addEventListener('click', function () {
    if (boardReset.disabled) return;
    AS.race.clear();
    refreshRace();
  });

  /* --- Les deux choix des modes à questions ------------------------------- */
  var descentPick = document.getElementById('descentPick');
  var quizStart = document.getElementById('quizStart');
  var quizStatus = document.getElementById('quizStatus');
  var levelButtons = document.querySelectorAll('.level');
  var diffButtons = document.querySelectorAll('.diff');

  function paintGroup(buttons, isOn) {
    Array.prototype.forEach.call(buttons, function (b) {
      var on = isOn(b);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function refreshQuizPick() {
    paintGroup(levelButtons, function (b) {
      return b.getAttribute('data-mode') === chosenMode
        && parseInt(b.getAttribute('data-level'), 10) === chosenLevel;
    });
    paintGroup(diffButtons, function (b) {
      return parseInt(b.getAttribute('data-diff'), 10) === chosenDiff;
    });

    hud.setDiffHint(chosenDiff ? AS.i18n.t('answers.' + chosenDiff + '.hint') : '');

    var manque = !chosenLevel && !chosenDiff ? 'menu.need.both'
      : !chosenLevel ? 'menu.need.level'
        : !chosenDiff ? 'menu.need.diff' : null;
    quizStatus.textContent = manque ? AS.i18n.t(manque) : '';
    quizStatus.classList.toggle('is-error', !!manque);
    quizStart.disabled = !!manque;
    quizStart.style.opacity = manque ? '0.5' : '';
  }

  Array.prototype.forEach.call(levelButtons, function (button) {
    button.addEventListener('click', function () {
      chosenLevel = parseInt(button.getAttribute('data-level'), 10);
      refreshQuizPick();
    });
  });

  Array.prototype.forEach.call(diffButtons, function (button) {
    button.addEventListener('click', function () {
      chosenDiff = parseInt(button.getAttribute('data-diff'), 10);
      refreshQuizPick();
    });
  });

  quizStart.addEventListener('click', function () {
    if (quizStart.disabled || !chosenMode) return;
    startGame(chosenMode, chosenLevel);
  });

  crazyStart.addEventListener('click', function () {
    if (crazyStart.disabled) return;
    AS.crazy.setMystery(false);
    startGame('crazy', 1);
  });

  mysteryStart.addEventListener('click', function () {
    if (mysteryStart.disabled) return;
    AS.crazy.setMystery(true);
    startGame('crazy', 1);
  });

  /* --- Navigation clavier du menu principal --------------------------------
     Les flèches parcourent les boutons visibles, Entrée valide. Combiné au
     menu pause, ça permet de jouer une soirée entière sans jamais lâcher le
     clavier — c'est ce qui était demandé. */
  /* L'écran actif : le menu de départ, ou celui de fin de partie. Les deux
     se parcourent au clavier — après une descente on veut relancer sans
     chercher la souris. */
  /* Quand on tape son nom, le clavier appartient au champ. Sans cette garde,
     un « s » descendrait d'un bouton et un « m » couperait le son au lieu de
     s'écrire. */
  function isTyping(event) {
    var t = event.target;
    return !!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'
      || t.isContentEditable));
  }

  function activePanel() {
    if (pause.isOpen()) return null;
    var over = document.getElementById('over');
    if (!over.classList.contains('is-hidden')) return over;
    var menu = document.getElementById('menu');
    if (!menu.classList.contains('is-hidden')) return menu;
    return null;
  }

  function panelButtons(panel) {
    var all = panel.querySelectorAll('button');
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].offsetParent !== null && !all[i].disabled) out.push(all[i]);
    }
    return out;
  }

  document.addEventListener('keydown', function (event) {
    var panel = activePanel();
    if (!panel) return;

    if (isTyping(event)) return;

    var key = event.key.toLowerCase();
    var down = key === 'arrowdown' || key === 's';
    var up = key === 'arrowup' || key === 'w';
    /* Entrée et Espace activent le bouton sous le curseur. Le navigateur le
       fait déjà quand quelque chose a le focus ; ici on couvre le cas où
       rien n'en a encore. */
    if (!down && !up) {
      if ((key === 'enter' || key === ' ') && !document.activeElement.matches('button')) {
        var first = panelButtons(panel)[0];
        if (first) { first.click(); event.preventDefault(); }
      }
      return;
    }

    var buttons = panelButtons(panel);
    if (!buttons.length) return;
    var at = buttons.indexOf(document.activeElement);
    var step = down ? 1 : -1;
    /* Rien de focalisé : la flèche du bas prend le premier, celle du haut le
       dernier. */
    var next = at < 0
      ? (step > 0 ? 0 : buttons.length - 1)
      : (at + step + buttons.length) % buttons.length;
    buttons[next].focus();
    event.preventDefault();
  });

  /* --- Bascule de langue ---------------------------------------------------
     Elle change aussi le SENS de l'exercice : interface française = on
     pratique l'anglais, et réciproquement. On la refuse en pleine partie
     pour ne pas retourner la question sous les doigts du joueur. */
  /* On rend la main au jeu après le clic. Un bouton qui garde le focus est
     réactivé par la barre d'espace : on couperait le son à chaque saut. */
  document.getElementById('langBtn').addEventListener('click', function () {
    this.blur();
    AS.i18n.set(AS.i18n.get() === 'fr' ? 'en' : 'fr');
  });

  AS.i18n.onChange(function () {
    if (chosenMode) refreshQuizPick();
    hud.setMuted(AS.audio.isMuted());
    if (screen === 'play') hud.relabel(game.state);
    buildCatalogue();
    refreshCrazyLock();
    renderKeysHelp();
  });

  /* La phrase d'aide contient des touches, donc du balisage : on la compose
     ici plutôt que d'entasser du HTML dans le dictionnaire. Les substitutions
     laissent le traducteur placer les touches où sa langue les veut. */
  function renderKeysHelp() {
    var t = AS.i18n.t;
    var kbd = function (label) { return '<kbd>' + label + '</kbd>'; };
    document.getElementById('keysHelp').innerHTML =
      t('keys.line1', { left: kbd('←') + kbd('A'), right: kbd('→') + kbd('D') })
      + '<br>' + t('keys.line2', {
        jump: kbd(t('keys.space')) + kbd('↑') + kbd('W')
      })
      + '<br>' + t('keys.line3', { esc: kbd(t('keys.esc')) })
      + '<br>' + t('keys.line4', { f11: kbd('F11'), m: kbd('M') });
  }

  document.getElementById('againBtn').addEventListener('click', function () {
    startGame(game.state.mode, game.state.contentLevel);
  });

  document.getElementById('backBtn').addEventListener('click', backToMenu);

  /* Coupe TOUT : sons et musique. On arrête réellement le séquenceur au lieu
     de le laisser tourner à volume nul — c'est plus honnête, et ça rend la
     machine à ce qu'elle faisait. */
  function toggleMute() {
    AS.audio.unlock();
    var next = !AS.audio.isMuted();
    AS.audio.setMuted(next);
    hud.setMuted(next);

    if (next) {
      AS.music.stop();
      AS.audio.stopWind();
    } else if (screen === 'play' && game.state && game.state.running) {
      AS.audio.startWind();
      if (musicAllowed()) AS.music.start();
    }
  }

  document.getElementById('muteBtn').addEventListener('click', function () {
    this.blur();
    toggleMute();
  });

  /* Raccourci clavier : couper le son ne devrait jamais demander la souris. */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'm' || event.key === 'M') {
      if (pause.isOpen() || isTyping(event)) return;
      toggleMute();
      event.preventDefault();
    }
  });

  /* --- Plein écran et orientation -------------------------------------------
     Sur iPhone, Safari n'implémente PAS l'API plein écran : aucun script ne
     peut y masquer la barre d'adresse. Les seules choses qui marchent sont
     100dvh (récupérer la place quand la barre se rétracte) et l'ajout à
     l'écran d'accueil, que les balises `apple-mobile-web-app-*` rendent
     réellement plein écran. Ailleurs — Android, iPad, ordinateur — l'API
     existe et le bouton ⛶ fonctionne.

     Le passage en plein écran exige un geste de l'utilisateur : on ne peut
     donc pas le déclencher sur la rotation elle-même. On l'arme, et il part
     au premier contact qui suit. */
  var fsBtn = document.getElementById('fsBtn');
  var rotateHint = document.getElementById('rotateHint');
  var wantFullscreen = false;

  function fullscreenSupported() {
    var el = document.documentElement;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen);
  }

  function inFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function enterFullscreen() {
    var el = document.documentElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    try {
      var out = req.call(el);
      if (out && out.then) out.then(lockLandscape, function () {});
      else lockLandscape();
    } catch (e) { /* refusé : on n'insiste pas */ }
  }

  function lockLandscape() {
    /* Le verrouillage d'orientation n'existe qu'en plein écran, et seulement
       sur certains navigateurs. Un échec est sans conséquence. */
    /* `window.screen` explicitement : la variable locale `screen` du module
       (l'écran affiché) masque l'objet global du même nom. Sans le préfixe,
       on interrogerait la chaîne 'menu'. */
    var so = window.screen && window.screen.orientation;
    if (so && so.lock) so.lock('landscape').catch(function () {});
  }

  function toggleFullscreen() {
    if (inFullscreen()) {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    } else {
      enterFullscreen();
    }
  }

  /* Sur ordinateur, F11 fait déjà mieux que l'API — un vrai plein écran
     système, sans barre. Un bouton de plus n'y apporte rien : on affiche donc
     le raccourci dans l'aide et on garde le bouton pour le tactile, où F11
     n'existe pas. */
  var touchDevice = window.matchMedia
    && window.matchMedia('(pointer: coarse)').matches;

  if (fullscreenSupported() && touchDevice) {
    fsBtn.hidden = false;
    fsBtn.addEventListener('click', toggleFullscreen);
  } else if (fsBtn.parentNode) {
    /* Sur ordinateur on l'enlève du document. Le masquer par une classe
       laissait toute latitude à la feuille de style de le rendre quand
       même — c'est précisément ce qui s'était produit. */
    fsBtn.parentNode.removeChild(fsBtn);
  }

  function isPhone() {
    return Math.min(window.innerWidth, window.innerHeight) < 520;
  }

  function refreshOrientation() {
    /* Le petit conseil discret d'autrefois ne sert plus : sur téléphone, le
       portrait déclenche désormais un calque plein écran qui met la partie en
       pause (voir mobile.js). On le garde masqué. */
    rotateHint.classList.add('is-hidden');

    /* Passé à l'horizontale sur un téléphone hors mode application : on arme
       le plein écran pour le prochain contact. En mode application il n'y a
       rien à demander, on y est déjà. */
    if (!isPortraitNow() && isPhone() && !AS.mobile.isStandalone()
      && fullscreenSupported() && !inFullscreen()) {
      wantFullscreen = true;
    }
    AS.mobile.refresh();
  }

  function isPortraitNow() { return window.innerHeight > window.innerWidth; }

  window.addEventListener('pointerdown', function () {
    if (!wantFullscreen) return;
    wantFullscreen = false;
    enterFullscreen();
  }, true);

  /* --- Téléphone -----------------------------------------------------------
     Le module ne connaît du jeu que ces trois fonctions. Geler, c'est arrêter
     la simulation ET les commandes : reprendre une descente dont on a lâché
     l'écran depuis dix secondes n'aurait aucun sens. */
  /* L'aide des touches décrit un clavier qui n'existe pas sur un téléphone :
     WSAD, F11, M, Échap. Elle n'y apprend rien et occupe le bas de l'écran. */
  if (AS.mobile.isTouch()) {
    var aide = document.getElementById('keysHelp');
    if (aide && aide.parentNode) aide.parentNode.removeChild(aide);
  }

  AS.mobile.init({
    isPlaying: function () {
      return screen === 'play' && !!game.state && game.state.running;
    },
    setFrozen: function (on) {
      mobileFrozen = on;
      AS.input.setEnabled(!on && screen === 'play');
      if (on) {
        AS.audio.stopWind();
        AS.music.stop();
      } else if (screen === 'play' && game.state && game.state.running) {
        AS.audio.startWind();
        if (musicAllowed()) AS.music.start();
      }
    },
    atMenu: function () { return screen === 'menu'; },
    /* Renvoie true si le menu pause s'est bien ouvert. Il refuse hors
       partie — dans ce cas le module retombe sur son propre écran. */
    openPause: function () {
      if (pause.isOpen()) return true;
      if (!(screen === 'play' && game.state && game.state.running)) return false;
      pause.show(game.state);
      return true;
    },
    closePause: function () { if (pause.isOpen()) pause.close(); }
  });

  /* --- Entrées, fenêtre --------------------------------------------------- */
  AS.input.init(stage, function () {
    AS.audio.unlock();
  });

  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      world.resize();
      applyDpr();
      refreshOrientation();
    }, 60);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  /* Onglet caché : on arrête tout, y compris l'audio. Un jeu en arrière-plan
     ne doit ni consommer ni faire de bruit. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      loopOff();
      AS.music.stop();
      AS.audio.suspend();
    } else {
      AS.audio.resume();
      if (screen === 'play' && game.state && game.state.running) {
        AS.audio.startWind();
        if (musicAllowed()) AS.music.start();
      }
      loopOn();
    }
  });

  /* --- En route ----------------------------------------------------------- */
  hud.setMuted(false);
  buildCatalogue();
  refreshCrazyLock();
  renderKeysHelp();
  hud.showMenu();
  world.resize();
  refreshOrientation();
  loopOn();

  /* Crochet de mise au point : sert aux captures d'écran automatisées et à
     inspecter l'état depuis la console. Sans effet sur le jeu. */
  window.__alpine = {
    world: world,
    game: game,
    hud: hud,
    input: AS.input,
    start: startGame,
    menu: backToMenu,
    setAnswers: function (n) { chosenDiff = n; },
    state: function () { return game.state; },
    screenName: function () { return screen; }
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
