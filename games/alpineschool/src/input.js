/* =========================================================================
   Alpine School — entrées
   -------------------------------------------------------------------------
   Le pilotage est analogique : ce module ne produit donc pas d'événements
   « va à gauche » mais un état maintenu, exactement comme une touche.

   Au doigt, garder le pouce sur le tiers gauche ou droit doit se comporter
   comme garder la touche enfoncée — pas comme une série de taps. Un doigt qui
   glisse d'une zone à l'autre change de direction sans qu'on le relève.
   ========================================================================= */
(function (AS) {
  'use strict';

  var state = {
    left: false,
    right: false,
    jump: false,     // maintenu
    jumpEdge: false  // vient d'être pressé, consommé par le moteur
  };

  var enabled = false;
  var onFirstGesture = null;

  /* pointerId -> 'left' | 'right' | null */
  var pointers = {};

  var SIDE_ZONE = 0.38;   // fraction de largeur, à gauche comme à droite
  var JUMP_ZONE = 0.22;   // fraction de hauteur, en haut

  /* --- Inclinaison et secousse --------------------------------------------
     Un second mode de pilotage, choisi dans le menu pause : incliner le
     téléphone pour tourner, le secouer pour sauter, sans jamais toucher
     l'écran. direction() en devient la seule porte de sortie -- le moteur de
     jeu ne sait pas d'où vient la valeur qu'il lit, tactile ou capteur. */
  var mode = 'touch';           // 'touch' | 'tilt'
  var tiltDir = 0;              // -1..1, continu -- contrairement au tactile
  var tiltZero = null;          // lecture prise comme référence « tout droit »
  var motionBound = false;      // les écouteurs ne s'attachent qu'une fois

  /* Un seul chiffre à retourner si le sens est inversé sur un vrai appareil --
     ce que je ne peux pas vérifier depuis ici, faute de capteurs à simuler.
     Passer à -1 suffit si tourner à droite fait aller à gauche. */
  var TILT_SIGN = 1;
  var TILT_DEAD = 2;    // degrés ignorés autour du zéro -- tremblement de main
  var TILT_RANGE = 20;  // degrés pour atteindre l'inclinaison maximale

  var SHAKE_THRESHOLD = 24;  // m/s² d'écart avec la gravité au repos (9,81)
  var SHAKE_COOLDOWN = 450;  // ms avant qu'une nouvelle secousse compte
  var lastShake = 0;

  /* Peut-on offrir ce mode ? Absent sur ordinateur et sur les navigateurs qui
     ne portent pas ces capteurs -- pas la peine de proposer un bouton mort. */
  function tiltAvailable() {
    return typeof window.DeviceOrientationEvent !== 'undefined';
  }

  /* L'axe qui bouge quand on incline « à gauche/à droite » dépend de
     l'orientation PHYSIQUE de l'appareil, pas de l'écran : en paysage, gamma
     et beta échangent leur rôle selon le côté vers lequel on a tourné. Le jeu
     étant verrouillé en paysage sur mobile, seuls les deux cas ±90° comptent
     en pratique ; le cas portrait reste en repli si jamais l'API ne rapporte
     rien d'autre. */
  function rawTilt(event) {
    var angle = (window.screen && window.screen.orientation
      && typeof window.screen.orientation.angle === 'number')
      ? window.screen.orientation.angle
      : (typeof window.orientation === 'number' ? window.orientation : 0);
    var g = event.gamma || 0;
    var b = event.beta || 0;
    /* En paysage, le haut de l'appareil pointe vers un cote de l'ecran : faire
       piquer ce haut vers le bas est exactement le geste « tourner de ce
       cote-la », et c'est beta qui le mesure. Le signe s'inverse entre les
       deux paysages, puisque le haut pointe a gauche dans l'un et a droite
       dans l'autre.

       Sens deduit par raisonnement, pas mesure : je n'ai pas de capteurs a
       simuler. Si tourner a droite envoie a gauche sur un vrai telephone,
       basculer TILT_SIGN a -1 suffit a tout corriger. */
    if (angle === 90) return b;
    if (angle === -90 || angle === 270) return -b;
    return g;
  }

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function onOrientation(event) {
    if (mode !== 'tilt') return;
    var raw = rawTilt(event);
    if (tiltZero === null) tiltZero = raw;   // premier relevé = position neutre
    var delta = (raw - tiltZero) * TILT_SIGN;
    var sign = delta > 0 ? 1 : -1;
    var mag = (Math.abs(delta) - TILT_DEAD) / (TILT_RANGE - TILT_DEAD);
    tiltDir = Math.abs(delta) < TILT_DEAD ? 0 : sign * clamp01(mag);
  }

  function onMotion(event) {
    if (mode !== 'tilt' || !enabled) return;
    var a = event.accelerationIncludingGravity;
    if (!a) return;
    var mag = Math.sqrt(
      (a.x || 0) * (a.x || 0) + (a.y || 0) * (a.y || 0) + (a.z || 0) * (a.z || 0)
    );
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    if (Math.abs(mag - 9.81) > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN) {
      lastShake = now;
      pressJump();
    }
  }

  /* iOS 13+ exige une autorisation explicite, demandée depuis un vrai geste --
     c'est pour ça que l'appel part de la ligne du menu pause au moment du
     clic, jamais après une attente. Ailleurs (Android, tablette) l'API
     n'existe pas sous cette forme : rien à demander, on branche directement. */
  function requestTiltAccess() {
    var DM = window.DeviceMotionEvent;
    var DO = window.DeviceOrientationEvent;
    var gated = DM && typeof DM.requestPermission === 'function';
    if (!gated) return Promise.resolve(true);

    return DM.requestPermission().then(function (motionRes) {
      var orientAsk = (DO && typeof DO.requestPermission === 'function')
        ? DO.requestPermission() : Promise.resolve('granted');
      return orientAsk.then(function (orientRes) {
        return motionRes === 'granted' && orientRes === 'granted';
      });
    }).catch(function () { return false; });
  }

  function bindMotionOnce() {
    if (motionBound) return;
    motionBound = true;
    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('devicemotion', onMotion);
  }

  /* Reprend le zéro à l'instant où l'on rend la main au joueur -- au départ de
     chaque descente, et à la fin de chaque décompte de reprise. Sans ça, la
     position tenue au moment du réglage du mode, souvent avant même d'avoir
     commencé à jouer, resterait le « tout droit » de toute la partie. */
  function recalibrateTilt() {
    tiltZero = null;
    tiltDir = 0;
  }

  function fireFirstGesture() {
    if (onFirstGesture) {
      var fn = onFirstGesture;
      onFirstGesture = null;
      fn();
    }
  }

  function pressJump() {
    if (!state.jump) state.jumpEdge = true;
    state.jump = true;
  }

  /* --- Clavier ----------------------------------------------------------- */
  function keyOf(event) {
    var k = event.key ? event.key.toLowerCase() : '';
    if (k === 'arrowleft' || k === 'a' || k === 'q') return 'left';
    if (k === 'arrowright' || k === 'd') return 'right';
    /* Trois façons de sauter : la barre d'espace, la flèche du haut et W.
       W et la flèche tombent naturellement sous la main gauche posée sur
       A/D — on saute sans lâcher la direction. `z` est la même touche
       physique que W sur un clavier AZERTY, comme `q` l'est pour A. */
    if (k === ' ' || k === 'spacebar' || k === 'space') return 'jump';
    if (k === 'arrowup' || k === 'w' || k === 'z') return 'jump';
    return null;
  }

  function onKeyDown(event) {
    fireFirstGesture();
    var which = keyOf(event);
    if (!which || !enabled) return;
    event.preventDefault();
    if (event.repeat) return;
    if (which === 'jump') pressJump();
    else state[which] = true;
  }

  function onKeyUp(event) {
    var which = keyOf(event);
    if (!which) return;
    if (enabled) event.preventDefault();
    if (which === 'jump') state.jump = false;
    else state[which] = false;
  }

  /* --- Tactile / souris --------------------------------------------------
     Une seule surface écoute tous les doigts : on peut donc garder un pouce
     à gauche pour carver et taper en haut de l'autre main pour sauter. */
  function zoneFor(surface, clientX, clientY) {
    var rect = surface.getBoundingClientRect();
    var x = (clientX - rect.left) / rect.width;
    var y = (clientY - rect.top) / rect.height;
    if (y < JUMP_ZONE) return 'jump';
    if (x < SIDE_ZONE) return 'left';
    if (x > 1 - SIDE_ZONE) return 'right';
    return null;
  }

  function recompute() {
    var left = false;
    var right = false;
    for (var id in pointers) {
      if (pointers[id] === 'left') left = true;
      if (pointers[id] === 'right') right = true;
    }
    state.left = left;
    state.right = right;
  }

  function bindSurface(surface) {
    surface.addEventListener('pointerdown', function (event) {
      fireFirstGesture();
      if (!enabled) return;
      /* La surface de jeu couvre tout l'écran, boutons du coin compris. Sans
         cette sortie, le preventDefault() ci-dessous supprimerait le clic qui
         aurait suivi : les boutons langue et son étaient visibles pendant la
         descente mais impossibles à actionner. On laisse donc passer tout
         appui né sur un contrôle. */
      if (event.target && event.target.closest
        && event.target.closest('button, a, input, label')) return;
      /* En mode inclinaison, on ne lit plus l'écran du tout : un pouce posé
         par mégarde ne doit ni tourner ni faire sauter. */
      if (mode === 'tilt') return;
      event.preventDefault();
      var zone = zoneFor(surface, event.clientX, event.clientY);
      if (zone === 'jump') {
        pressJump();
        /* Le saut est une impulsion, pas un maintien : on le relâche au tour
           suivant pour que la mémoire tampon fonctionne comme au clavier. */
        pointers[event.pointerId] = 'jumped';
      } else {
        pointers[event.pointerId] = zone;
        recompute();
      }
      if (surface.setPointerCapture) {
        try { surface.setPointerCapture(event.pointerId); } catch (e) { /* ignoré */ }
      }
    });

    surface.addEventListener('pointermove', function (event) {
      if (!enabled || mode === 'tilt') return;
      if (!(event.pointerId in pointers)) return;
      if (pointers[event.pointerId] === 'jumped') return;
      var zone = zoneFor(surface, event.clientX, event.clientY);
      pointers[event.pointerId] = zone === 'jump' ? null : zone;
      recompute();
    });

    function release(event) {
      if (pointers[event.pointerId] === 'jumped') state.jump = false;
      delete pointers[event.pointerId];
      recompute();
    }
    surface.addEventListener('pointerup', release);
    surface.addEventListener('pointercancel', release);
    surface.addEventListener('lostpointercapture', release);
  }

  /* Une fenêtre qui perd le focus ne doit pas laisser une direction collée. */
  function releaseAll() {
    pointers = {};
    state.left = false;
    state.right = false;
    state.jump = false;
    state.jumpEdge = false;
  }

  function init(surface, firstGestureCallback) {
    onFirstGesture = firstGestureCallback || null;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    window.addEventListener('pointerdown', fireFirstGesture, { once: false });
    bindSurface(surface);
  }

  /* Le moteur consomme le front montant du saut une seule fois. */
  function takeJump() {
    var pressed = state.jumpEdge;
    state.jumpEdge = false;
    return pressed;
  }

  AS.input = {
    init: init,
    state: state,
    takeJump: takeJump,
    releaseAll: releaseAll,
    setEnabled: function (value) {
      enabled = value;
      if (!value) releaseAll();
    },
    /* -1..1 -- la direction tenue. Au tactile et au clavier c'est toujours
       -1, 0 ou 1 ; en inclinaison c'est un vrai continu, ce qui donne un
       pilotage plus fin qu'aucun des deux autres modes. */
    direction: function () {
      if (mode === 'tilt') return tiltDir;
      return (state.right ? 1 : 0) - (state.left ? 1 : 0);
    },

    /* --- Choix du mode, depuis le menu pause -------------------------------
       Renvoie une promesse du mode réellement appliqué : sur refus de
       permission, on retombe sur le tactile plutôt que d'afficher un mode
       inerte. */
    tiltAvailable: tiltAvailable,
    getMode: function () { return mode; },
    setMode: function (next) {
      if (next === mode) return Promise.resolve(mode);
      if (next !== 'tilt') {
        mode = 'touch';
        releaseAll();
        return Promise.resolve(mode);
      }
      if (!tiltAvailable()) return Promise.resolve(mode);
      return requestTiltAccess().then(function (granted) {
        if (!granted) return mode;
        bindMotionOnce();
        mode = 'tilt';
        releaseAll();
        recalibrateTilt();
        return mode;
      });
    },
    recalibrateTilt: recalibrateTilt
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
