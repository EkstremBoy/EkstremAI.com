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
      if (!enabled) return;
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
    /* -1, 0 ou 1 — la direction tenue. */
    direction: function () {
      return (state.right ? 1 : 0) - (state.left ? 1 : 0);
    }
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
