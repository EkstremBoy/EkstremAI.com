/* =========================================================================
   Alpine School — catalogue du Crazy Mode
   -------------------------------------------------------------------------
   Chaque folie dure une portée (réglable dans le menu pause), puis une
   nouvelle porte en propose deux autres. Le joueur ne peut ni les éviter ni
   passer entre : il choisit, c'est tout.

   POUR EN AJOUTER UNE : une entrée ici, et le code qui l'applique dans
   recompute() de crazy.js. Le menu et le catalogue se remplissent tout seuls.

     id        identifiant interne
     fr / en   nom court, tel qu'il apparaît sous l'icône
     descFr/En une phrase, pour le catalogue du menu
     icon      dessin de la pancarte — voir drawIcon() dans gates.js
     weight    fréquence relative de tirage. 1 = normale. En dessous, la
               folie devient rare ; c'est ainsi que le lapin et la tombée du
               jour restent des surprises plutôt que des habitudes.
     solo      true si la folie remplace tout ce qui tourne

   Elles sont toutes conçues pour rester JOUABLES. Une folie qui rend la
   descente impossible n'est pas drôle deux fois.
   ========================================================================= */
(function (AS) {
  'use strict';

  var MODIFIERS = [
    {
      id: 'forest',
      fr: 'Forêt dense', en: 'Thick forest',
      descFr: 'La piste se referme de sapins. Ils restent franchissables, mais il faut se faufiler.',
      descEn: 'The slope closes in with pines. Still passable, but you have to thread through.',
      icon: 'forest', weight: 1
    },
    {
      id: 'mirror',
      fr: 'Miroir', en: 'Mirror',
      descFr: 'Gauche te pousse à droite, droite te pousse à gauche.',
      descEn: 'Left pushes you right, right pushes you left.',
      icon: 'mirror', weight: 1
    },
    {
      id: 'logs',
      fr: 'Billots', en: 'Logs',
      descFr: "Des troncs en travers. Certains barrent tout et se sautent, d'autres laissent un passage sur le côté.",
      descEn: 'Trunks across the run. Some block everything and must be jumped, others leave a way round.',
      icon: 'logs', weight: 1, solo: true
    },
    {
      id: 'ice',
      fr: 'Sol glissant', en: 'Slick ground',
      descFr: 'Plus rien ne mord. On part en glissade et on met longtemps à se rattraper.',
      descEn: 'Nothing grips. You slide away and take an age to gather it back.',
      icon: 'ice', weight: 1
    },
    {
      id: 'fog',
      fr: 'Brouillard', en: 'Fog',
      descFr: 'La brume tombe. On ne voit plus venir grand-chose.',
      descEn: 'The mist drops. You will not see much coming.',
      icon: 'fog', weight: 1
    },
    {
      id: 'rush',
      fr: 'Survitesse', en: 'Overdrive',
      descFr: "Coup d'accélérateur brutal, puis tout file.",
      descEn: 'A brutal kick, then everything flies.',
      icon: 'rush', weight: 1
    },
    {
      id: 'moguls',
      fr: 'Champ de bosses', en: 'Mogul field',
      descFr: 'Peu de sapins, mais des bosses de neige. Les prendre ralentit — à toi de voir si tu veux durer.',
      descEn: 'Few pines, but snow mounds. Hitting one slows you — up to you whether you want to last.',
      icon: 'moguls', weight: 1, solo: true
    },
    {
      id: 'nojump',
      fr: 'Interdit de sauter', en: 'No jumping',
      descFr: "Les skis restent au sol et les rochers s'enchaînent. Slalom serré, aucune échappatoire par le haut.",
      descEn: 'Your skis stay down and the rocks keep coming. Tight slalom, no way out over the top.',
      icon: 'nojump', weight: 1, solo: true
    },
    {
      id: 'tiny',
      fr: 'Tout rétrécit', en: 'Everything shrinks',
      descFr: 'Sapins et rochers deviennent minuscules, et bien plus nombreux. Ils se sautent tous.',
      descEn: 'Pines and rocks turn tiny, and there are far more. You can jump every one.',
      icon: 'tiny', weight: 1
    },
    {
      id: 'night',
      fr: 'Tombée du jour', en: 'Nightfall',
      descFr: 'Le soleil descend, la montagne vire au bleu. Rien de plus dur, juste plus beau.',
      descEn: 'The sun drops and the mountain turns blue. No harder, just prettier.',
      icon: 'night', weight: 1
    },
    {
      id: 'bunny',
      fr: 'Mode lapin', en: 'Bunny mode',
      descFr: 'Tu deviens un lapin. Vies en carottes, obstacles à thème, et un tronc creux à traverser pour des points.',
      descEn: 'You turn into a rabbit. Carrot lives, themed obstacles, and a hollow log to shoot through for points.',
      icon: 'bunny', weight: 0.18, solo: true
    }
  ];

  var BY_ID = {};
  for (var i = 0; i < MODIFIERS.length; i++) BY_ID[MODIFIERS[i].id] = MODIFIERS[i];

  function label(mod) {
    return AS.i18n && AS.i18n.get() === 'en' ? mod.en : mod.fr;
  }
  function description(mod) {
    return AS.i18n && AS.i18n.get() === 'en' ? mod.descEn : mod.descFr;
  }

  AS.MODIFIERS = MODIFIERS;
  AS.modifierById = function (id) { return BY_ID[id]; };
  AS.modifierLabel = label;
  AS.modifierDescription = description;
})((window.AlpineSchool = window.AlpineSchool || {}));
