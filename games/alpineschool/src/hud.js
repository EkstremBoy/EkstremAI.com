/* =========================================================================
   Alpine School — interface : menu, HUD, écran de fin
   -------------------------------------------------------------------------
   Aucune logique de jeu ici. Ce module lit l'état et écrit dans le DOM, rien
   d'autre. Il n'écrit dans le DOM que ce qui a changé : réécrire quatre
   textContent à chaque image suffirait à faire tomber des images sur un
   téléphone modeste.
   ========================================================================= */
(function (AS) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function Hud() {
    this.el = {
      hud: $('hud'),
      banner: $('banner'),
      bannerEyebrow: $('bannerEyebrow'),
      bannerPrompt: $('bannerPrompt'),
      livesBox: $('lives'),
      lives: $('lives').querySelectorAll('i'),
      bonusLayer: $('bonusLayer'),
      raceBar: $('raceBar'),
      raceClock: $('raceClock'),
      raceLeft: $('raceLeft'),
      raceDelta: $('raceDelta'),
      overStars: $('overStars'),
      overCourse: $('overCourse'),
      milestone: $('milestone'),
      milestoneDist: $('milestoneDist'),
      milestoneWord: $('milestoneWord'),
      spells: $('spells'),
      dist: $('distValue'),
      scoreLabel: $('scoreLabel'),
      score: $('scoreValue'),
      menu: $('menu'),
      over: $('over'),
      overTitle: $('overTitle'),
      overSub: $('overSub'),
      overStats: $('overStats'),
      diffHint: $('diffHint'),
      mute: $('muteBtn')
    };

    this.last = {
      dist: -1, score: -1, lives: -1, prompt: null, eyebrow: null
    };
  }

  Hud.prototype.showMenu = function () {
    this.el.menu.classList.remove('is-hidden');
    this.el.over.classList.add('is-hidden');
    this.el.hud.classList.remove('is-live');
    this.el.hud.setAttribute('aria-hidden', 'true');
  };

  Hud.prototype.showGame = function (state) {
    this.el.menu.classList.add('is-hidden');
    this.el.over.classList.add('is-hidden');
    this.el.hud.classList.add('is-live');
    this.el.hud.setAttribute('aria-hidden', 'false');

    var t = AS.i18n.t;
    var crazy = state.mode === 'crazy';
    var race = !!state.race;
    var quiz = state.mode !== 'freestyle' && !crazy && !race;

    /* En Crazy Mode le bandeau du haut est occupé par les folies en cours ;
       en Course, par le chronomètre. La question, elle, est sur les
       pancartes ou n'existe pas. */
    this.el.banner.classList.toggle('is-off', !quiz);
    this.el.spells.classList.toggle('is-off', !crazy);
    this.el.raceBar.classList.toggle('is-off', !race);
    this.el.raceDelta.textContent = '';
    /* Ni en Freestyle ni en Course : dans le premier on n'a qu'une vie, dans
       la seconde on en a une infinité. Un compteur qui ne bouge jamais est du
       bruit. */
    this.el.livesBox.classList.toggle('is-off',
      state.mode === 'freestyle' || !!state.race);
    this.el.livesBox.classList.remove('is-carrots');
    this.el.scoreLabel.textContent = quiz ? t('hud.score') : t('hud.speed');
    this.el.bonusLayer.textContent = '';
    this.el.spells.textContent = '';
    this.hideMilestone();

    this.last = {
      dist: -1, score: -1, lives: -1, prompt: null, eyebrow: null,
      spells: null, clock: null, left: -1, delta: null
    };
  };

  /* Jalon des 500 m. Relancer une animation CSS déjà jouée demande de retirer
     la classe, de forcer un recalcul, puis de la remettre : sans la lecture de
     offsetWidth le navigateur regroupe les deux changements et ne voit aucune
     transition — le deuxième jalon ne s'afficherait pas. */
  /* Bandeau de course. On ne réécrit que ce qui a changé : le chrono bouge à
     chaque image, le reste presque jamais. */
  Hud.prototype.updateRace = function (state) {
    var el = this.el;
    var last = this.last;

    var chrono = state.raceTime.toFixed(2);
    if (chrono !== last.clock) {
      last.clock = chrono;
      el.raceClock.textContent = chrono;
    }

    var reste = Math.max(0, Math.round(state.raceLength - state.dist));
    if (reste !== last.left) {
      last.left = reste;
      el.raceLeft.textContent = reste + ' m';
    }

    if (state.splitDelta !== last.delta) {
      last.delta = state.splitDelta;
      if (state.splitDelta === null) {
        el.raceDelta.textContent = '';
        el.raceDelta.className = 'race-delta';
      } else {
        el.raceDelta.textContent = AS.race.delta(state.splitDelta);
        el.raceDelta.className = 'race-delta '
          + (state.splitDelta <= 0 ? 'is-ahead' : 'is-behind');
      }
    }
  };

  /* Les étoiles du résultat. Elles s'allument l'une après l'autre — un
     dénombrement instantané ne se savoure pas. */
  /* Une ligne d'honneur sous le sous-titre — le record battu, par exemple.
     Elle disparaît d'elle-même au prochain écran de fin. */
  Hud.prototype.setOverNote = function (text) {
    this.el.overSub.textContent += (text ? '  ·  ' + text : '');
  };

  Hud.prototype.showStars = function (n) {
    var box = this.el.overStars;
    box.textContent = '';
    box.classList.toggle('is-off', n === null);
    if (n === null) return;
    for (var i = 0; i < 3; i++) {
      var st = document.createElement('span');
      st.className = 'star' + (i < n ? ' is-on' : '');
      st.textContent = '★';
      st.style.animationDelay = (0.16 + i * 0.22) + 's';
      box.appendChild(st);
    }
  };

  Hud.prototype.showFlourish = function (big, small, opts) {
    var o = opts || {};
    var el = this.el.milestone;
    this.el.milestoneDist.textContent = big;
    this.el.milestoneWord.textContent = small;
    el.classList.toggle('is-compact', !!o.compact);
    /* Une seule variable pilote les quatre animations : sans elle il faudrait
       les retoucher une par une pour changer la durée d'un message. */
    el.style.setProperty('--flourish-dur', (o.seconds || 1.25) + 's');
    el.classList.remove('is-on');
    void el.offsetWidth;
    el.classList.add('is-on');

    /* On retire la classe dès la fin : `forwards` laisserait sinon un
       élément visible à opacité nulle en permanence au-dessus de la piste. */
    el.addEventListener('animationend', function done(event) {
      if (event.target !== el) return;
      el.removeEventListener('animationend', done);
      el.classList.remove('is-on');
    });
  };

  Hud.prototype.showMilestone = function (metres) {
    this.showFlourish(
      Math.round(metres) + ' m',
      AS.i18n.t('milestone.' + (Math.round(metres / AS.WORLD.MILESTONE) % 4)),
      null
    );
  };

  Hud.prototype.hideMilestone = function () {
    this.el.milestone.classList.remove('is-on');
  };

  /* Changement de langue en pleine descente : le bandeau a été rempli au
     départ et ne se relit pas tout seul. On refait les libellés qui en
     dépendent, et on force la reconstruction des pastilles de folies en
     invalidant la mémoire qui sert à éviter de les réécrire à chaque image. */
  Hud.prototype.relabel = function (state) {
    if (!state) return;
    var crazy = state.mode === 'crazy';
    var quiz = state.mode !== 'freestyle' && !crazy;
    this.el.scoreLabel.textContent = quiz
      ? AS.i18n.t('hud.score')
      : AS.i18n.t('hud.speed');
    this.last.spells = null;
  };

  /* Pastilles des folies actives. On ne réécrit que si la liste a changé —
     reconstruire ce bandeau à chaque image coûterait des images perdues. */
  Hud.prototype.updateSpells = function () {
    var labels = AS.crazy.activeLabels();
    var key = labels.join('|');
    if (key === this.last.spells) return;
    this.last.spells = key;

    this.el.spells.textContent = '';
    for (var i = 0; i < AS.crazy.active.length; i++) {
      var entry = AS.crazy.active[i];
      var pill = document.createElement('span');
      pill.className = 'spell' + (entry.mod.bonus ? ' is-bonus' : '');
      pill.textContent = AS.modifierLabel(entry.mod);
      this.el.spells.appendChild(pill);
    }
    this.el.livesBox.classList.toggle('is-carrots', AS.crazy.has('bunny'));
  };

  /* --- Bonus de série ----------------------------------------------------
     Affiché à l'endroit de la pancarte franchie, en gros, puis effacé. Le
     compteur discret en bas d'écran a disparu : une récompense qu'il faut
     chercher des yeux n'en est pas une. */
  Hud.prototype.showBonus = function (points, combo, screenX, screenY) {
    var el = document.createElement('div');
    el.className = 'bonus'
      + (combo >= 5 ? ' is-blazing' : (combo >= 3 ? ' is-hot' : ''));

    /* On garde le bonus dans l'écran : au moment du franchissement la
       pancarte peut être très excentrée, voire déjà sortie du cadre. */
    var margin = 90;
    var x = Math.min(Math.max(screenX, margin), window.innerWidth - margin);
    var y = Math.min(Math.max(screenY, 120), window.innerHeight - 160);
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    var pts = document.createElement('span');
    pts.className = 'bonus-points';
    pts.textContent = '+' + points;
    el.appendChild(pts);

    if (combo >= 2) {
      var streak = document.createElement('span');
      streak.className = 'bonus-streak';
      streak.textContent = AS.i18n.t('hud.streak', { n: combo });
      el.appendChild(streak);
    }

    this.el.bonusLayer.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1100);
  };

  Hud.prototype.update = function (state, gates) {
    var el = this.el;
    var last = this.last;

    var dist = Math.round(state.dist);
    if (dist !== last.dist) {
      last.dist = dist;
      el.dist.textContent = dist + ' m';
    }

    if (state.race) this.updateRace(state);

    if (state.mode === 'freestyle' || state.mode === 'crazy' || state.race) {
      var kmh = Math.round(state.speed * 3.6);
      if (kmh !== last.score) {
        last.score = kmh;
        el.score.textContent = kmh + ' km/h';
      }
      if (state.mode === 'crazy') {
        this.updateSpells();
        if (state.lives !== last.lives) {
          last.lives = state.lives;
          for (var v = 0; v < el.lives.length; v++) {
            el.lives[v].classList.toggle('is-spent', v >= state.lives);
          }
        }
      }
      return;
    }

    if (state.score !== last.score) {
      last.score = state.score;
      el.score.textContent = String(state.score);
    }

    if (state.lives !== last.lives) {
      last.lives = state.lives;
      for (var i = 0; i < el.lives.length; i++) {
        el.lives[i].classList.toggle('is-spent', i >= state.lives);
      }
    }

    /* Entre deux portes il n'y a rien à demander, mais vider le bandeau le
       ferait clignoter à chaque franchissement : on garde la question
       précédente affichée jusqu'à ce que la suivante arrive. */
    var pending = gates.pending();
    if (pending && pending.prompt !== last.prompt) {
      last.prompt = pending.prompt;
      el.bannerPrompt.textContent = pending.prompt;
    }
    var eyebrow = state.provider ? state.provider.eyebrow : '';
    if (eyebrow !== last.eyebrow) {
      last.eyebrow = eyebrow;
      el.bannerEyebrow.textContent = eyebrow;
    }
  };

  /* --- Écran de fin ------------------------------------------------------
     Ton : tutoiement, phrases courtes, un peu de malice, aucune félicitation
     creuse. On ne congratule pas une descente ratée. */
  Hud.prototype.showOver = function (state) {
    var el = this.el;
    var t = AS.i18n.t;
    var title, sub, stats;

    /* On annonce la vitesse qu'on avait EN ARRIVANT sur l'obstacle, pas celle
       qui reste après la pénalité. */
    var finalSpeed = Math.round((state.impactSpeed || state.speed) * 3.6);

    /* Le message se gradue sur la performance. On ne félicite jamais une
       descente ratée, et on ne se moque jamais d'une bonne. */
    var msg;
    if (state.race) {
      var etoiles = AS.race.stars(state.raceLength, state.raceTime, state.finished);
      var c = AS.race.course(state.raceLength);
      this.showStars(etoiles);
      /* Le parcours en tête, plutôt qu'un « 1000 / 1000 m » dans les chiffres :
         une course finie affiche toujours la distance complète, donc la
         donnée ne dit rien. Ce qu'on veut savoir, c'est quel niveau. */
      this.el.overCourse.classList.remove('is-off');
      this.el.overCourse.textContent = t('race.level', {
        n: AS.race.levelOf(state.raceLength), m: c.metres
      });
      msg = state.finished
        ? { title: t('race.done.' + etoiles), sub: t('race.done.sub.' + etoiles) }
        : { title: t('race.dnf'), sub: t('race.dnf.sub') };
      stats = [
        { value: state.finished ? AS.race.format(state.raceTime) : '—',
          label: t('race.stat.time') },
        { value: state.boostsTaken + ' / ' + c.boosts,
          label: t('race.stat.boosts') }
      ];
    } else if (state.mode === 'crazy') {
      this.showStars(null);
      this.el.overCourse.classList.add('is-off');
      msg = AS.i18n.graded('over.crazy', AS.crazy.choices, [5, 12]);
      stats = [
        { value: Math.round(state.dist) + ' m', label: t('over.stat.distance') },
        { value: AS.crazy.choices, label: t('over.stat.choices') },
        { value: finalSpeed, label: t('over.stat.finalSpeed') }
      ];
    } else if (state.mode === 'freestyle') {
      this.showStars(null);
      this.el.overCourse.classList.add('is-off');
      msg = AS.i18n.graded('over.free', state.dist, [300, 900, 1700, 2800]);
      stats = [
        { value: Math.round(state.dist) + ' m', label: t('over.stat.distance') },
        { value: finalSpeed, label: t('over.stat.finalSpeed') }
      ];
    } else {
      this.showStars(null);
      this.el.overCourse.classList.add('is-off');
      var total = state.right + state.wrong;
      var ratio = total > 0 ? state.right / total : 0;
      /* Le sans-faute ne se donne qu'à partir de cinq portes : réussir la
         première et s'écraser ensuite n'est pas un sans-faute. */
      var grade = (ratio >= 1 && state.right >= 5) ? 3
        : (ratio >= 0.8 ? 2 : (ratio >= 0.5 ? 1 : 0));
      msg = AS.i18n.graded('over.quiz', grade, [1, 2, 3]);
      stats = [
        { value: state.score, label: t('over.stat.score') },
        { value: '×' + state.bestCombo, label: t('over.stat.bestCombo') },
        { value: Math.round(state.dist) + ' m', label: t('over.stat.distance') }
      ];
    }

    title = msg.title;
    sub = msg.sub;

    /* En mode à questions, le décompte remplace le sous-titre : c'est le
       chiffre qu'on vient chercher. */
    if (state.mode === 'words' || state.mode === 'math') {
      var n = state.right;
      sub = t(n === 1 ? 'over.rightAnswer' : 'over.rightAnswers',
        { n: n, total: state.right + state.wrong });
    }

    el.overTitle.textContent = title;
    el.overSub.textContent = sub;

    el.overStats.textContent = '';
    for (var i = 0; i < stats.length; i++) {
      var box = document.createElement('div');
      var v = document.createElement('div');
      v.className = 'stat-value';
      v.textContent = String(stats[i].value);
      var l = document.createElement('div');
      l.className = 'stat-label';
      l.textContent = stats[i].label;
      box.appendChild(v);
      box.appendChild(l);
      el.overStats.appendChild(box);
    }

    el.hud.classList.remove('is-live');
    el.hud.setAttribute('aria-hidden', 'true');
    el.over.classList.remove('is-hidden');
    $('againBtn').focus();
  };

  /* Annonce de folie : même mécanique que le bonus de série, mais c'est le
     nom de la folie qu'on affiche — il faut savoir tout de suite dans quoi on
     vient de s'engager. */
  Hud.prototype.showChoice = function (name, isBonus, screenX, screenY) {
    var el = document.createElement('div');
    el.className = 'bonus' + (isBonus ? ' is-blazing' : ' is-hot');

    var margin = 110;
    el.style.left = Math.min(Math.max(screenX, margin), window.innerWidth - margin) + 'px';
    el.style.top = Math.min(Math.max(screenY, 120), window.innerHeight - 160) + 'px';

    var chip = document.createElement('span');
    chip.className = 'bonus-streak';
    chip.textContent = name;
    el.appendChild(chip);

    this.el.bonusLayer.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1100);
  };

  Hud.prototype.setDiffHint = function (text) {
    this.el.diffHint.textContent = text;
  };

  Hud.prototype.setMuted = function (muted) {
    var btn = this.el.mute;
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.setAttribute('data-i18n-aria', muted ? 'a11y.unmute' : 'a11y.mute');
    btn.setAttribute('aria-label', AS.i18n.t(muted ? 'a11y.unmute' : 'a11y.mute'));
    /* La note reste, barrée d'un trait rouge : « ✕ » ne disait pas si le son
       était coupé ou si le bouton allait fermer quelque chose. */
    btn.classList.toggle('is-muted', muted);
  };

  AS.Hud = Hud;
})((window.AlpineSchool = window.AlpineSchool || {}));
