/* =========================================================================
   Alpine School — listes de vocabulaire
   -------------------------------------------------------------------------
   POUR AJOUTER DU VOCABULAIRE : il n'y a que ce fichier à toucher.

   Une entrée ressemble à ceci :

       { fr: 'chat',                en: 'cat', decoys: ['dog', 'bird', 'horse'] }

     fr      le mot affiché en haut de l'écran (français)
     en      la bonne traduction — c'est elle qui sera sur la bonne pancarte
     decoys  trois leurres. Le mode Facile n'en utilise qu'un, Moyen et Expert
             en utilisent deux. Mets toujours les trois : ça permet de changer
             de difficulté sans retoucher les listes.
     audio   OPTIONNEL, pas encore lu par le jeu. Prévu pour la prononciation
             enregistrée par la tutrice : 'audio/cat.mp3'. Tu peux déjà le
             renseigner, le moteur l'ignorera proprement en attendant.

   Un mot ne réapparaît jamais avant que toute la liste soit passée : les
   listes sont mélangées puis parcourues en entier avant d'être remélangées.
   Tu peux donc en ajouter autant que tu veux, l'ordre reste imprévisible.

   Les trois listes n'ont pas besoin d'avoir la même longueur.
   ========================================================================= */
(function (AS) {
  'use strict';

  var WORDS = {
    /* --- Niveau 1 — débutant --------------------------------------------
       Mots concrets du quotidien. Leurres de la même famille, faciles à
       écarter quand on connaît le mot. */
    1: [
      { fr: 'chat',                en: 'cat',      decoys: ['dog', 'bird', 'horse'] },
      { fr: 'chien',               en: 'dog',      decoys: ['cat', 'fish', 'cow'] },
      { fr: 'pomme',               en: 'apple',    decoys: ['banana', 'bread', 'grape'] },
      { fr: 'soleil',              en: 'sun',      decoys: ['moon', 'star', 'sky'] },
      { fr: 'maison',              en: 'house',    decoys: ['car', 'tree', 'road'] },
      { fr: 'eau',                 en: 'water',    decoys: ['fire', 'milk', 'juice'] },
      { fr: 'livre',               en: 'book',     decoys: ['pen', 'desk', 'door'] },
      { fr: 'rouge',               en: 'red',      decoys: ['blue', 'green', 'black'] },
      { fr: 'grand',               en: 'big',      decoys: ['small', 'fast', 'slow'] },
      { fr: 'courir',              en: 'run',      decoys: ['walk', 'jump', 'swim'] },
      { fr: 'heureux',             en: 'happy',    decoys: ['sad', 'angry', 'tired'] },
      { fr: 'oiseau',              en: 'bird',     decoys: ['fish', 'cat', 'bear'] },
      { fr: 'neige',               en: 'snow',     decoys: ['rain', 'wind', 'cloud'] },
      { fr: 'école',               en: 'school',   decoys: ['shop', 'park', 'farm'] },
      { fr: 'main',                en: 'hand',     decoys: ['foot', 'head', 'arm'] },
      { fr: 'manger',              en: 'eat',      decoys: ['drink', 'sleep', 'read'] },
      { fr: 'frère',               en: 'brother',  decoys: ['sister', 'uncle', 'cousin'] },
      { fr: 'froid',               en: 'cold',     decoys: ['hot', 'warm', 'wet'] },
      { fr: 'montagne',            en: 'mountain', decoys: ['river', 'beach', 'forest'] },
      { fr: 'matin',               en: 'morning',  decoys: ['night', 'evening', 'week'] }
    ],

    /* --- Niveau 2 — courant ---------------------------------------------
       Leurres choisis pour piéger un francophone : faux amis, paires que
       l'on confond (borrow/lend, spend/earn), nuances d'usage. */
    2: [
      { fr: 'emprunter',           en: 'borrow',        decoys: ['lend', 'keep', 'buy'] },
      { fr: 'prêter',              en: 'lend',          decoys: ['borrow', 'owe', 'spend'] },
      { fr: "s'inquiéter",         en: 'worry',         decoys: ['hope', 'wonder', 'agree'] },
      { fr: 'améliorer',           en: 'improve',       decoys: ['repeat', 'prevent', 'replace'] },
      { fr: 'réunion',             en: 'meeting',       decoys: ['holiday', 'journey', 'hobby'] },
      { fr: 'quartier',            en: 'neighbourhood', decoys: ['basement', 'hallway', 'countryside'] },
      { fr: 'en retard',           en: 'late',          decoys: ['early', 'quick', 'soon'] },
      { fr: 'conseil',             en: 'advice',        decoys: ['warning', 'promise', 'request'] },
      { fr: 'réussir',             en: 'succeed',       decoys: ['fail', 'attend', 'expect'] },
      { fr: 'se souvenir',         en: 'remember',      decoys: ['forget', 'remind', 'realise'] },
      { fr: 'dépenser',            en: 'spend',         decoys: ['earn', 'save', 'owe'] },
      { fr: 'lourd',               en: 'heavy',         decoys: ['loud', 'empty', 'smooth'] },
      { fr: 'malade',              en: 'sick',          decoys: ['tired', 'bored', 'upset'] },
      { fr: 'commander',           en: 'order',         decoys: ['deliver', 'borrow', 'choose'] },
      { fr: 'gérer',               en: 'manage',        decoys: ['waste', 'avoid', 'refuse'] },
      { fr: 'grève',               en: 'strike',        decoys: ['shift', 'wage', 'break'] },
      { fr: 'bruyant',             en: 'noisy',         decoys: ['crowded', 'messy', 'rude'] },
      { fr: 'but',                 en: 'goal',          decoys: ['rule', 'chance', 'habit'] },
      { fr: 'presque',             en: 'almost',        decoys: ['always', 'rather', 'hardly'] },
      { fr: 'utile',               en: 'useful',        decoys: ['useless', 'busy', 'ready'] }
    ],

    /* --- Niveau 3 — littéraire ------------------------------------------
       Registre soutenu. Les leurres sont souvent l'antonyme exact, pour que
       reconnaître vaguement le champ lexical ne suffise pas. */
    3: [
      { fr: 'chagrin',             en: 'sorrow',   decoys: ['delight', 'boredom', 'envy'] },
      { fr: 'éphémère',            en: 'fleeting', decoys: ['endless', 'solemn', 'humble'] },
      { fr: 'murmurer',            en: 'whisper',  decoys: ['shout', 'sigh', 'gasp'] },
      { fr: 'crépuscule',          en: 'dusk',     decoys: ['dawn', 'noon', 'mist'] },
      { fr: 'orgueil',             en: 'pride',    decoys: ['shame', 'mercy', 'grief'] },
      { fr: "s'épanouir",          en: 'flourish', decoys: ['wither', 'linger', 'falter'] },
      { fr: 'insouciant',          en: 'carefree', decoys: ['cautious', 'restless', 'solemn'] },
      { fr: 'errer',               en: 'wander',   decoys: ['dwell', 'seize', 'cling'] },
      { fr: 'ténèbres',            en: 'darkness', decoys: ['radiance', 'stillness', 'thunder'] },
      { fr: 'frisson',             en: 'shiver',   decoys: ['glimpse', 'breeze', 'murmur'] },
      { fr: 'vaniteux',            en: 'vain',     decoys: ['modest', 'gentle', 'loyal'] },
      { fr: 'loyauté',             en: 'loyalty',  decoys: ['betrayal', 'courage', 'longing'] },
      { fr: 'hanté',               en: 'haunted',  decoys: ['blessed', 'gilded', 'barren'] },
      { fr: 'aube',                en: 'dawn',     decoys: ['dusk', 'midnight', 'twilight'] },
      { fr: 'soupir',              en: 'sigh',     decoys: ['glance', 'tear', 'frown'] },
      { fr: 'impitoyable',         en: 'ruthless', decoys: ['merciful', 'weary', 'humble'] },
      { fr: 'deuil',               en: 'mourning', decoys: ['healing', 'wandering', 'silence'] },
      { fr: 'amer',                en: 'bitter',   decoys: ['tender', 'hollow', 'weary'] },
      { fr: 'sort',                en: 'fate',     decoys: ['fault', 'truce', 'dread'] },
      { fr: 'apaiser',             en: 'soothe',   decoys: ['stir', 'scorn', 'haunt'] }
    ]
  };

  /* Étiquettes du menu. Si tu ajoutes une quatrième liste, ajoute son
     étiquette ici et une entrée dans le menu de index.html. */
  var WORD_LEVELS = [
    { id: 1, label: 'Débutant',   sample: 'chat, pomme, rouge' },
    { id: 2, label: 'Courant',    sample: 'emprunter, réussir' },
    { id: 3, label: 'Littéraire', sample: 'crépuscule, orgueil' }
  ];

  AS.WORDS = WORDS;
  AS.WORD_LEVELS = WORD_LEVELS;
})((window.AlpineSchool = window.AlpineSchool || {}));
