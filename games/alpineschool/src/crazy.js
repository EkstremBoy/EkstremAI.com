/* =========================================================================
   Alpine School — moteur du Crazy Mode
   -------------------------------------------------------------------------
   Une porte tous les cent mètres, deux choix, aucune échappatoire : les
   pancartes couvrent toute la piste et il n'y a pas de trou entre elles. Ce
   qu'on choisit s'applique pendant cent mètres, puis s'efface pour laisser la
   place au choix suivant.

   Ce module ne touche à rien tout seul. Il tient l'état des folies actives et
   expose des MULTIPLICATEURS que la physique, le décor et le rendu vont lire.
   C'est ce qui permet d'ajouter une folie sans aller trafiquer le moteur :
   il suffit qu'un multiplicateur existe déjà, ou d'en ajouter un ici.

   LES FOLIES RARES
   Le mode lapin et la tombée du jour ne se disputent pas les deux pancartes
   ordinaires : elles s'invitent de loin en loin en TROISIÈME pancarte, plus
   étroite, au milieu, les deux autres se resserrant pour lui faire place. On
   la voit venir, et on décide de la prendre ou de l'éviter. Leur rareté tient
   à leur poids dans le catalogue, pas à un calendrier.
   ========================================================================= */
(function (AS) {
  'use strict';

  /* Distance entre deux portes, donc durée d'une folie. Réglable dans le menu
     pause : certains veulent enchaîner, d'autres veulent le temps de sentir
     chaque folie avant la suivante. */
  var SPACINGS = [100, 150, 200, 250];
  var span = 100;

  /* Valeurs neutres. Toute folie non active laisse ces valeurs telles
     quelles, donc le mode « aucune folie » est exactement le jeu normal. */
  var NEUTRAL = {
    mirror: false,
    grip: 1,          // multiplie l'accélération latérale
    slide: 1,         // multiplie la friction (en dessous de 1, ça glisse)
    speed: 1,         // multiplie la vitesse cible
    speedSmooth: 1,   // vivacité de la montée en vitesse
    treeRate: 1,      // densité d'obstacles
    propScale: 1,     // taille des obstacles
    rockChance: -1,   // -1 = laisser le mode décider
    fog: 1,           // densité de brouillard
    mogul: 1,         // amplitude du relief
    night: 0,         // 0 plein jour, 1 crépuscule
    logs: false,
    bumps: false,
    noJump: false,
    bunny: false
  };

  function Crazy() {
    this.enabled = {};                     // catalogue coché par le joueur
    for (var i = 0; i < AS.MODIFIERS.length; i++) {
      this.enabled[AS.MODIFIERS[i].id] = true;
    }
    this.reset();
  }

  Crazy.prototype.reset = function () {
    this.active = [];        // { mod, until }
    this.choices = 0;        // portes franchies
    this.nextGateDist = span;
    this.effects = Object.assign({}, NEUTRAL);
  };

  Crazy.prototype.setEnabled = function (id, on) {
    this.enabled[id] = !!on;
  };

  /* En dessous de ce poids, une folie est considérée comme RARE : elle ne se
     dispute pas les deux pancartes ordinaires, elle apparaît de temps à autre
     en troisième pancarte plus étroite, au milieu. On la voit venir, et on
     décide de la prendre ou de l'éviter. */
  var RARE = 0.25;

  /* Pancarte du mode surprise. Ce n'est pas une folie du catalogue : c'est un
     point d'interrogation qui en cache une, tirée au moment du franchissement.
     Elle n'apparaît donc jamais dans la liste à cocher. */
  var MYSTERY = {
    id: 'mystery',
    fr: 'Surprise', en: 'Surprise',
    descFr: '', descEn: '',
    icon: 'mystery', weight: 0
  };

  Crazy.prototype.pool = function () {
    var list = [];
    for (var i = 0; i < AS.MODIFIERS.length; i++) {
      var mod = AS.MODIFIERS[i];
      if (this.enabled[mod.id] && mod.weight >= RARE) list.push(mod);
    }
    return list;
  };

  Crazy.prototype.rarePool = function () {
    var list = [];
    for (var i = 0; i < AS.MODIFIERS.length; i++) {
      var mod = AS.MODIFIERS[i];
      if (this.enabled[mod.id] && mod.weight < RARE) list.push(mod);
    }
    return list;
  };

  Crazy.prototype.enabledCount = function () {
    return this.pool().length;
  };

  /* Nombre total de folies cochées, rares comprises. Sert au mode sur mesure :
     une seule cochée, elle tourne du début à la fin. */
  Crazy.prototype.totalEnabled = function () {
    return this.pool().length + this.rarePool().length;
  };

  Crazy.prototype.soloModifier = function () {
    if (this.totalEnabled() !== 1) return null;
    var all = this.pool().concat(this.rarePool());
    return all[0] || null;
  };

  /* Compose les choix d'une porte. Renvoie 2 folies, parfois 3 quand une rare
     se présente ; c'est l'appelant qui en déduit les largeurs. */
  Crazy.prototype.pickChoices = function () {
    var pool = this.pool();
    AS.util.shuffle(pool);

    /* Tirage au poids. Si le catalogue est maigre, on autorise la répétition
       plutôt que de bloquer la partie. */
    var picks = [];
    var i;
    for (i = 0; i < pool.length && picks.length < 2; i++) {
      if (Math.random() < Math.min(1, pool[i].weight)) picks.push(pool[i]);
    }
    for (i = 0; picks.length < 2 && i < pool.length; i++) {
      if (picks.indexOf(pool[i]) < 0) picks.push(pool[i]);
    }
    while (picks.length < 2 && pool.length) picks.push(pool[0]);

    /* Une folie rare s'invite parfois. Le facteur écrase encore son poids :
       à 0.18, le lapin sort environ une porte sur seize. */
    var rare = this.rarePool();
    AS.util.shuffle(rare);
    for (i = 0; i < rare.length; i++) {
      if (Math.random() < rare[i].weight * 0.35) {
        picks.splice(1, 0, rare[i]);
        break;
      }
    }
    return picks;
  };

  /* Largeurs des pancartes, en unités monde. Elles couvrent TOUJOURS toute la
     piste : pas de trou, donc pas d'échappatoire. */
  Crazy.prototype.layout = function (count) {
    var full = AS.PHYSICS.HALF * 2;
    /* Une seule pancarte : elle occupe toute la piste. Il n'y a rien à
       choisir, seulement à passer dessous. */
    if (count < 2) return [{ x: 0, w: full }];
    if (count < 3) {
      var w = full / 2;
      return [
        { x: -full / 4, w: w },
        { x: full / 4, w: w }
      ];
    }
    /* Trois pancartes : celle du milieu — le lapin — est plus étroite, et les
       deux autres se resserrent d'autant. */
    var mid = full * 0.25;
    var side = (full - mid) / 2;
    return [
      { x: -full / 2 + side / 2, w: side },
      { x: 0, w: mid },
      { x: full / 2 - side / 2, w: side }
    ];
  };

  /* Descente sur mesure : la folie s'installe pour toujours et il n'y aura
     aucune porte. Choisir « Tombée du jour » seul, c'est descendre à l'infini
     dans la nuit ; choisir « Survitesse » seul, c'est une descente lancée. */
  /* Mode surprise : une folie au hasard parmi TOUTES celles qui existent,
     catalogue ou pas. C'est le principe — on ne choisit rien, pas même ce
     qu'on accepte de croiser. */
  /* Le mode surprise est un état de la partie, pas une folie : il survit à
     reset(), qui ne vide que les effets en cours. */
  Crazy.prototype.setMystery = function (on) { this.mystery = !!on; };

  Crazy.prototype.pickMystery = function () {
    var all = AS.MODIFIERS;
    return all[Math.floor(Math.random() * all.length)];
  };

  Crazy.prototype.applySolo = function (mod) {
    this.active = [{ mod: mod, until: Infinity }];
    this.recompute();
  };

  Crazy.prototype.choose = function (mod, dist) {
    if (!mod) return;
    this.choices++;

    /* Certaines folies changent trop de choses pour cohabiter : elles
       remplacent tout ce qui tourne. */
    if (mod.solo) this.active.length = 0;
    else {
      for (var i = this.active.length - 1; i >= 0; i--) {
        if (this.active[i].mod.solo) this.active.splice(i, 1);
      }
    }

    /* Rechoisir la même folie prolonge simplement son effet. */
    for (var k = 0; k < this.active.length; k++) {
      if (this.active[k].mod.id === mod.id) {
        this.active[k].until = dist + span;
        this.recompute();
        return;
      }
    }

    this.active.push({ mod: mod, until: dist + span });
    this.recompute();
  };

  Crazy.prototype.update = function (dist) {
    var changed = false;
    for (var i = this.active.length - 1; i >= 0; i--) {
      if (dist >= this.active[i].until) {
        this.active.splice(i, 1);
        changed = true;
      }
    }
    if (changed) this.recompute();
  };

  Crazy.prototype.has = function (id) {
    for (var i = 0; i < this.active.length; i++) {
      if (this.active[i].mod.id === id) return true;
    }
    return false;
  };

  /* Traduit la liste des folies actives en multiplicateurs. Tout le reste du
     jeu ne lit que cet objet. */
  Crazy.prototype.recompute = function () {
    var e = Object.assign({}, NEUTRAL);

    for (var i = 0; i < this.active.length; i++) {
      switch (this.active[i].mod.id) {
        case 'forest':
          e.treeRate = 3.6;
          e.rockChance = 0.06;   // presque que des sapins : c'est une forêt
          break;
        case 'mirror':
          e.mirror = true;
          break;
        case 'logs':
          e.logs = true;
          e.treeRate = 0;
          break;
        case 'ice':
          /* Très peu de friction : on part en glissade et on met longtemps à
             se rattraper. Le grip tombe aussi, sinon on corrige trop vite et
             la glace ne se sent pas du tout. */
          e.slide = 0.10;
          e.grip = 0.62;
          e.fog = 1.35;          // un fond de brume : c'est une météo
          break;
        case 'fog':
          e.fog = 4.4;
          break;
        case 'rush':
          e.speed = 1.42;
          e.speedSmooth = 4.5;   // le coup d'accélérateur est franc
          break;
        case 'moguls':
          /* Un champ de bosses au milieu des sapins. Sans arbres, il n'y
             avait rien à éviter et les bosses n'étaient qu'un ralentisseur
             gratuit : la seule question devenait « est-ce que je passe à
             côté ? », et la réponse était toujours oui. Avec les sapins, il
             faut choisir sa ligne, et une bosse prise de travers coûte la
             vitesse dont on avait besoin pour le sapin suivant. */
          e.bumps = true;
          e.treeRate = 1;
          e.mogul = 1.7;
          break;
        case 'nojump':
          e.noJump = true;
          /* Densité calée en comptant les rochers qui franchissent réellement
             le joueur sur 1200 m : 1.5 en donne 4.7 pour cent mètres (trop
             facile, c'était le réglage d'avant), 3.0 en donne 8.8 (étouffant),
             2.2 en donne 7 — le slalom demande de l'attention sans jamais
             devenir injuste. */
          e.treeRate = 2.2;
          e.rockChance = 1;      // que des rochers, et on ne peut pas sauter
          break;
        case 'tiny':
          e.propScale = 0.40;
          e.treeRate = 3.2;
          break;
        case 'night':
          e.night = 1;
          break;
        case 'bunny':
          /* Récompense : obstacles à thème seulement, et une bonne accroche. */
          e.bunny = true;
          e.treeRate = 1;      // remplacés par des obstacles à thème
          e.grip = 1.15;
          e.speed = 0.9;
          break;
      }
    }

    this.effects = e;
  };

  /* Résumé lisible des folies en cours, pour le bandeau du HUD. */
  Crazy.prototype.activeLabels = function () {
    var out = [];
    for (var i = 0; i < this.active.length; i++) {
      out.push(AS.modifierLabel(this.active[i].mod));
    }
    return out;
  };

  Crazy.prototype.remaining = function (dist) {
    var soonest = Infinity;
    for (var i = 0; i < this.active.length; i++) {
      if (this.active[i].until < soonest) soonest = this.active[i].until;
    }
    return soonest === Infinity ? 0 : Math.max(0, soonest - dist);
  };

  /* Portée courante, en mètres. Changer d'écartement en pleine descente est
     permis : la folie en cours garde son échéance, les suivantes prennent la
     nouvelle. */
  Crazy.prototype.span = function () { return span; };

  Crazy.prototype.setSpan = function (value) {
    if (SPACINGS.indexOf(value) < 0) return;
    span = value;
  };

  AS.Crazy = Crazy;
  AS.crazy = new Crazy();
  AS.CRAZY_MYSTERY = MYSTERY;
  AS.CRAZY_SPACINGS = SPACINGS;
  AS.crazySpan = function () { return span; };
})((window.AlpineSchool = window.AlpineSchool || {}));
