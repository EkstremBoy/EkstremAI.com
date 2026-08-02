/* =========================================================================
   Alpine School — générateurs de questions
   -------------------------------------------------------------------------
   Le moteur ne sait rien du contenu. Il demande un « fournisseur » et appelle
   next() quand il a besoin d'une question. Ajouter une matière (conjugaison,
   additions…) ne demande donc qu'un nouveau fichier de données et un
   fournisseur ici — pas une ligne dans le moteur.

   Un fournisseur expose :
       eyebrow          la sur-étiquette du bandeau ('TRADUIS', 'COMBIEN FONT')
       next()           renvoie { prompt, answer, decoys[], audio? }

   `answer` et `decoys` sont des chaînes : ce sont elles qui iront sur les
   pancartes.
   ========================================================================= */
(function (AS) {
  'use strict';

  var shuffle = AS.util.shuffle;

  /* --- Vocabulaire -------------------------------------------------------
     Un mot ne réapparaît jamais avant que toute la liste soit passée : on
     mélange la liste, on la parcourt en entier, puis on remélange. */
  function WordProvider(level) {
    var list = AS.WORDS[level] || AS.WORDS[1];
    this.list = list;
    this.pool = shuffle(list.slice());
    this.index = 0;
    /* Sens d'apprentissage : 'en' quand l'interface est en français (on
       pratique l'anglais), 'fr' quand elle est en anglais. La même liste
       sert dans les deux sens, sans une donnée de plus. */
    this.target = AS.i18n ? AS.i18n.targetLanguage() : 'en';
  }

  Object.defineProperty(WordProvider.prototype, 'eyebrow', {
    get: function () {
      return AS.i18n ? AS.i18n.t('hud.translate') : 'TRADUIS';
    }
  });

  /* Vers le français, les leurres n'existent pas dans les données : on prend
     trois autres mots français de la même liste. Ils sont du même niveau,
     donc plausibles, et ça évite d'avoir à saisir deux jeux de leurres. */
  WordProvider.prototype.frenchDecoys = function (correct) {
    var pool = [];
    for (var i = 0; i < this.list.length; i++) {
      if (this.list[i].fr !== correct) pool.push(this.list[i].fr);
    }
    shuffle(pool);
    return pool.slice(0, 3);
  };

  /* À la charnière de deux séries, la fin de l'une et le début de l'autre se
     touchent : sans précaution, un mot vu en dernier peut revenir aussitôt.
     On repousse donc vers la fin du nouveau tirage les derniers mots de la
     série précédente. */
  var HINGE = 3;

  WordProvider.prototype.next = function () {
    if (this.index >= this.pool.length) {
      var tail = this.pool.slice(-HINGE);
      shuffle(this.pool);
      if (this.pool.length > HINGE * 2) {
        for (var i = 0; i < HINGE; i++) {
          if (tail.indexOf(this.pool[i]) >= 0) {
            var swap = this.pool.length - 1 - i;
            var tmp = this.pool[i];
            this.pool[i] = this.pool[swap];
            this.pool[swap] = tmp;
          }
        }
      }
      this.index = 0;
    }
    var word = this.pool[this.index++];

    if (this.target === 'fr') {
      return {
        prompt: word.en,
        answer: word.fr,
        decoys: this.frenchDecoys(word.fr),
        audio: word.audio || null
      };
    }

    return {
      prompt: word.fr,
      answer: word.en,
      decoys: word.decoys.slice(),
      audio: word.audio || null   // §15 : prononciation enregistrée, plus tard
    };
  };

  /* --- Multiplications ---------------------------------------------------
     Facteurs de 2 à MAX selon le niveau. Les deux facteurs sont ordonnés du
     plus grand au plus petit : 7 × 3 et 3 × 7 sont donc la même question, et
     la mémoire des six dernières les reconnaît comme telles.

     Cette mémoire est obligatoire (piège n°2 du briefing) : sans elle le
     générateur reproposait la même table trois fois de suite. */
  var MATH_MAX = { 1: 6, 2: 12, 3: 20 };
  var MEMORY = 6;

  function MathProvider(level) {
    this.max = MATH_MAX[level] || MATH_MAX[2];
    this.recent = [];
  }

  Object.defineProperty(MathProvider.prototype, 'eyebrow', {
    get: function () {
      return AS.i18n ? AS.i18n.t('hud.multiply') : 'COMBIEN FONT';
    }
  });

  MathProvider.prototype.next = function () {
    var a = 0, b = 0, key = '';
    /* Le nombre de couples distincts vaut au moins 15 au niveau 1, donc une
       mémoire de 6 laisse toujours de quoi tirer. La garde n'est là que pour
       interdire par principe toute boucle infinie. */
    for (var guard = 0; guard < 60; guard++) {
      a = 2 + Math.floor(Math.random() * (this.max - 1));
      b = 2 + Math.floor(Math.random() * (this.max - 1));
      if (a < b) { var t = a; a = b; b = t; }
      key = a + '×' + b;
      if (this.recent.indexOf(key) < 0) break;
    }
    this.recent.push(key);
    if (this.recent.length > MEMORY) this.recent.shift();

    var answer = a * b;
    return {
      prompt: a + ' × ' + b,
      answer: String(answer),
      decoys: makeDecoys(answer, a, b, this.max),
      key: key
    };
  };

  /* Leurres : environ un tiers à distance d'un facteur, un tiers à distance de
     l'autre, un tiers à distance aléatoire. Toujours strictement positifs,
     toujours distincts entre eux et de la bonne réponse — sinon deux pancartes
     porteraient le même nombre et la porte deviendrait illisible. */
  function makeDecoys(answer, a, b, max) {
    var seen = {};
    seen[answer] = true;
    var decoys = [];
    var spread = Math.max(4, Math.round(max / 2));

    for (var tries = 0; decoys.length < 3 && tries < 90; tries++) {
      var roll = Math.random();
      var sign = Math.random() < 0.5 ? 1 : -1;
      var value;
      if (roll < 0.34) value = answer + sign * a;
      else if (roll < 0.67) value = answer + sign * b;
      else value = answer + sign * (1 + Math.floor(Math.random() * spread));

      if (value > 0 && !seen[value]) {
        seen[value] = true;
        decoys.push(String(value));
      }
    }
    /* Filet de sécurité pour les toutes petites réponses (2 × 2 = 4), où les
       candidats positifs se raréfient. */
    for (var fill = 1; decoys.length < 3; fill++) {
      var v = answer + fill;
      if (!seen[v]) {
        seen[v] = true;
        decoys.push(String(v));
      }
    }
    return decoys;
  }

  var MATH_LEVELS = [
    { id: 1, label: 'Niveau 1', sample: "jusqu'à 6" },
    { id: 2, label: 'Niveau 2', sample: "jusqu'à 12" },
    { id: 3, label: 'Niveau 3', sample: "jusqu'à 20" }
  ];

  /* Le moteur ne connaît que cette fabrique. */
  function makeProvider(mode, level) {
    if (mode === 'math') return new MathProvider(level);
    return new WordProvider(level);
  }

  AS.quiz = {
    WordProvider: WordProvider,
    MathProvider: MathProvider,
    makeProvider: makeProvider,
    MATH_LEVELS: MATH_LEVELS,
    MATH_MAX: MATH_MAX
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
