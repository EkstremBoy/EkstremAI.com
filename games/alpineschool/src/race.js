/* =========================================================================
   Alpine School — mode Course
   -------------------------------------------------------------------------
   Trois distances, trois étoiles chacune :

     ★     franchir la ligne avec au moins une vie
     ★★    la franchir sous un temps confortable
     ★★★   la franchir sous un temps qui ne pardonne presque rien

   Les temps ne sont pas devinés : ils sortent de descentes jouées par un
   pilote automatique dans le moteur réel. Le détail des mesures est sur
   COURSES, plus bas.

   Le tableau des temps ne survit pas à la fermeture de la page : rien n'est
   écrit sur la machine du joueur. C'est une contrainte du projet, pas un
   oubli.
   ========================================================================= */
(function (AS) {
  'use strict';

  /* gold / silver : secondes à ne pas dépasser. `boosts` : nombre de turbos
     semés — un pour deux cents mètres, donc cinq sur mille, puis le double et
     le triple. Un turbo sur cinq est gardé par un mur de sapins.

     Deux mesures faites dans le moteur réel, sur la piste dense :

       plancher — ligne droite absolue, tous les turbos, aucun obstacle.
                  Personne ne fera mieux : 28,91 / 51,38 / 72,37 s.
       correct  — un pilote qui évite proprement mais ne cherche pas les
                  turbos : 32,51 / 58,27 / 92,62 s, 0 à 3 chocs.

     L'or est calé juste SOUS la descente correcte : bien skier ne suffit
     plus, il faut aussi aller chercher les turbos, dont ceux qui se méritent.
     Le pilote « correct » décroche deux étoiles, pas trois — c'est le
     réglage voulu. L'argent reste accessible à qui finit sans catastrophe. */
  var COURSES = [
    { id: 1000, metres: 1000, boosts: 5, gold: 30.5, silver: 34.5 },
    { id: 2000, metres: 2000, boosts: 10, gold: 58.0, silver: 68.0 },
    { id: 3000, metres: 3000, boosts: 15, gold: 84.0, silver: 99.0 }
  ];

  function course(id) {
    for (var i = 0; i < COURSES.length; i++) {
      if (COURSES[i].id === id) return COURSES[i];
    }
    return COURSES[0];
  }

  /* Une course finie donne au moins une étoile — arriver est déjà l'épreuve.
     Abandonner en route n'en donne aucune. */
  function stars(id, seconds, finished) {
    if (!finished) return 0;
    var c = course(id);
    if (seconds <= c.gold) return 3;
    if (seconds <= c.silver) return 2;
    return 1;
  }

  /* --- Tableau des temps --------------------------------------------------
     En mémoire seulement : il vit le temps de la session. Trois meilleurs
     temps par distance, du plus rapide au plus lent. */
  var board = { 1000: [], 2000: [], 3000: [] };
  var KEEP = 3;

  /* Chaque entrée est { t, name }. On renvoie l'entrée elle-même quand elle
     entre dans le tableau : l'appelant s'en sert pour y inscrire un nom une
     fois que le joueur l'a saisi, sans avoir à la retrouver. */
  function record(id, seconds) {
    var list = board[id];
    if (!list) return null;
    var entree = { t: seconds, name: '' };
    list.push(entree);
    list.sort(function (a, b) { return a.t - b.t; });
    var rang = list.indexOf(entree) + 1;
    if (list.length > KEEP) list.length = KEEP;
    return rang <= KEEP ? { rank: rang, entry: entree } : null;
  }

  function nameEntry(entree, nom) {
    if (entree) entree.name = String(nom || '').slice(0, 12);
  }

  function best(id) {
    var list = board[id];
    return list && list.length ? list[0].t : null;
  }

  function times(id) { return (board[id] || []).slice(); }

  /* 1000 m → niveau 1, et ainsi de suite. C'est le repère qu'on met en tête
     du résultat, à la place d'un « 1000 / 1000 m » qui ne dit rien. */
  function levelOf(id) {
    for (var i = 0; i < COURSES.length; i++) {
      if (COURSES[i].id === id) return i + 1;
    }
    return 1;
  }

  function isEmpty() {
    return !board[1000].length && !board[2000].length && !board[3000].length;
  }

  function clear() {
    board = { 1000: [], 2000: [], 3000: [] };
    bestStars = { 1000: 0, 2000: 0, 3000: 0 };
  }

  /* Les étoiles obtenues, elles, ne redescendent jamais dans une session : on
     garde le meilleur résultat de chaque distance pour l'afficher au menu. */
  var bestStars = { 1000: 0, 2000: 0, 3000: 0 };

  function noteStars(id, n) {
    if (n > bestStars[id]) bestStars[id] = n;
  }

  function starsFor(id) { return bestStars[id] || 0; }

  /* mm:ss,c — les centièmes comptent sur une course de trente secondes. */
  function format(seconds) {
    if (seconds === null || seconds === undefined) return '—';
    var m = Math.floor(seconds / 60);
    var s = seconds - m * 60;
    var deux = (s < 10 ? '0' : '') + s.toFixed(2);
    return m > 0 ? m + ':' + deux : deux + ' s';
  }

  /* Écart signé, pour la comparaison en course avec son meilleur temps. */
  function delta(seconds) {
    var signe = seconds >= 0 ? '+' : '−';
    return signe + Math.abs(seconds).toFixed(1) + ' s';
  }

  AS.race = {
    COURSES: COURSES,
    course: course,
    stars: stars,
    record: record,
    nameEntry: nameEntry,
    levelOf: levelOf,
    best: best,
    times: times,
    isEmpty: isEmpty,
    clear: clear,
    noteStars: noteStars,
    starsFor: starsFor,
    format: format,
    delta: delta
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
