/* =========================================================================
   Alpine School — menu pause
   -------------------------------------------------------------------------
   Il s'ouvre à Échap et se pilote ENTIÈREMENT au clavier : haut et bas pour
   changer de rangée, gauche et droite pour changer une valeur, Entrée pour
   valider, Échap pour reprendre. C'est délibéré — on y arrive les mains sur
   les flèches, en pleine descente ; devoir lâcher pour attraper la souris
   casserait la partie.

   Deux sortes de rangées :
     action   un bouton (reprendre, recommencer, retour au menu)
     choice   un réglage à valeurs, qu'on fait défiler à gauche / droite

   Les rangées sont décrites en données. Ajouter un réglage, c'est ajouter une
   entrée à build(), rien d'autre.
   ========================================================================= */
(function (AS) {
  'use strict';

  function Pause(hooks) {
    this.hooks = hooks;
    this.layer = document.getElementById('pause');
    this.list = document.getElementById('pauseRows');
    this.hint = document.querySelector('#pause [data-i18n="pause.hint"]');
    this.rows = [];
    this.index = 0;
    this.open = false;

    var self = this;
    window.addEventListener('keydown', function (e) { self.onKey(e); }, true);
  }

  Pause.prototype.isOpen = function () { return this.open; };

  Pause.prototype.paintHint = function () {
    if (!this.hint) return;
    this.hint.textContent = this.deniedHint
      ? AS.i18n.t('pause.controls.denied')
      : this.normalHint;
  };

  /* --- Construction ------------------------------------------------------ */

  Pause.prototype.build = function (state) {
    var t = AS.i18n.t;
    var self = this;
    var rows = [];

    /* Téléphone tenu à la verticale : c'est la rotation qui a ouvert ce menu,
       et c'est la rotation qui le refermera. Proposer « Reprendre » serait un
       bouton qui ne peut pas tenir sa promesse — on le retire et on explique
       le geste à la place. */
    var parRotation = !!(AS.mobile && AS.mobile.isPortraitPause());

    /* Texte normal du bas de carte, et un drapeau distinct pour le message
       de refus de permission -- lui doit pouvoir remplacer ce texte APRES
       coup, une fois que le systeme a repondu a la demande d'inclinaison,
       sans attendre une reconstruction complete du menu. */
    this.normalHint = t(parRotation ? 'pause.hint.rotate' : 'pause.hint');
    this.deniedHint = false;
    this.paintHint();

    if (!parRotation) rows.push({
      kind: 'action', key: 'resume', primary: true,
      label: t('pause.resume'),
      run: function () { self.close(); }
    });

    /* Le réglage n'apparaît que là où il y a de la musique — sinon on
       croirait qu'il est cassé. Pendant une descente de nuit au nocturne on
       le retire aussi : ce morceau-là ne se choisit pas dans une liste, et
       en sortir serait sans retour. */
    if (state && (state.mode === 'freestyle' || state.crazy || state.race)
      && !state.nocturne) {
      var styles = ['off'].concat(AS.music.STYLE_IDS);
      rows.push({
        kind: 'choice', key: 'music',
        label: t('pause.music'),
        values: styles,
        valueLabel: function (v) { return t('music.' + v); },
        get: function () { return AS.music.style(); },
        set: function (v) {
          AS.music.setStyle(v);
          if (v !== 'off' && !AS.music.isPlaying()) AS.music.start();
        }
      });
    }

    /* L'écart entre portes n'a de sens que s'il y a des portes : en descente
       sur mesure il n'y en a aucune, et proposer le réglage laisserait croire
       qu'il est cassé. Le mode surprise, lui, en a. */
    if (state && state.mode === 'crazy' && !state.solo) {
      rows.push({
        kind: 'choice', key: 'spacing',
        label: t('pause.spacing'),
        values: AS.CRAZY_SPACINGS,
        valueLabel: function (v) { return v + ' m'; },
        get: function () { return AS.crazySpan(); },
        set: function (v) { AS.crazy.setSpan(v); }
      });
    }

    /* Choix des commandes : incliner le telephone plutot que d'appuyer sur
       l'ecran. Seulement sur telephone, et seulement si les capteurs
       existent -- proposer un mode qui ne peut jamais s'activer serait pire
       qu'aucun bouton. La permission iOS est demandee exactement ici, dans
       le gestionnaire du clic : c'est le seul endroit ou le systeme
       l'accepte, jamais apres une attente. */
    if (AS.mobile && AS.mobile.isPhone() && AS.input.tiltAvailable()) {
      var controlsRow = {
        kind: 'choice', key: 'controls',
        label: t('pause.controls'),
        values: ['touch', 'tilt'],
        valueLabel: function (v) { return t('pause.controls.' + v); },
        get: function () { return AS.input.getMode(); },
        set: function (v) {
          AS.input.setMode(v).then(function (applied) {
            /* setMode() est asynchrone : la permission iOS se repond apres
               le clic. Sans ce repeint differe, le libelle resterait sur
               l'ancien mode jusqu'au prochain geste, ce qui a l'air d'un
               bouton mort -- et sans message, un refus ressemble a un bug
               plutot qu'a une decision du joueur. */
            self.deniedHint = (applied !== v);
            self.paintHint();
            if (controlsRow.valueEl && controlsRow.el && controlsRow.el.parentNode) {
              controlsRow.valueEl.textContent = controlsRow.valueLabel(applied);
            }
          });
        }
      };
      rows.push(controlsRow);
    }

    rows.push({
      kind: 'choice', key: 'lang',
      label: t('pause.lang'),
      values: ['fr', 'en'],
      valueLabel: function (v) { return v === 'fr' ? 'Français' : 'English'; },
      get: function () { return AS.i18n.get(); },
      set: function (v) {
        AS.i18n.set(v);
        /* Les libellés du menu viennent de changer de langue : on le
           reconstruit sans perdre la ligne où l'on était. */
        var keep = self.index;
        self.build(self.state);
        self.index = Math.min(keep, self.rows.length - 1);
        self.paint();
      }
    });

    rows.push({
      kind: 'action', key: 'restart',
      label: t('pause.restart'),
      run: function () { self.close(); self.hooks.onRestart(); }
    });

    rows.push({
      kind: 'action', key: 'quit',
      label: t('pause.quit'),
      run: function () { self.close(); self.hooks.onQuit(); }
    });

    this.state = state;
    this.rows = rows;
    this.render();
  };

  Pause.prototype.render = function () {
    var self = this;
    this.list.textContent = '';

    this.rows.forEach(function (row, i) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'row'
        + (row.kind === 'action' ? ' row--action' : '')
        + (row.primary ? ' row--primary' : '');
      el.setAttribute('role', 'menuitem');

      var label = document.createElement('span');
      label.textContent = row.label;
      el.appendChild(label);

      if (row.kind === 'choice') {
        var box = document.createElement('span');
        box.className = 'row-value';
        var left = document.createElement('span');
        left.className = 'row-arrow row-arrow--back';
        left.textContent = '◀';
        var val = document.createElement('span');
        val.textContent = row.valueLabel(row.get());
        var right = document.createElement('span');
        right.className = 'row-arrow';
        right.textContent = '▶';
        box.appendChild(left);
        box.appendChild(val);
        box.appendChild(right);
        el.appendChild(box);
        row.valueEl = val;
      }

      /* La souris reste possible. Une rangée de réglage avance d'un cran —
         SAUF si l'on a cliqué la flèche gauche, qui doit reculer. Les flèches
         ne peuvent pas être de vrais boutons (on ne les imbrique pas dans un
         bouton), donc on regarde où le clic est tombé. */
      el.addEventListener('click', function (event) {
        self.index = i;
        self.paint();
        if (row.kind === 'action') { row.run(); return; }
        var back = event.target && event.target.closest
          && event.target.closest('.row-arrow--back');
        self.cycle(back ? -1 : 1);
      });
      el.addEventListener('mouseenter', function () {
        self.index = i;
        self.paint();
      });

      row.el = el;
      self.list.appendChild(el);
    });

    this.paint();
  };

  Pause.prototype.paint = function () {
    for (var i = 0; i < this.rows.length; i++) {
      this.rows[i].el.classList.toggle('is-active', i === this.index);
    }
    var active = this.rows[this.index];
    if (active && active.el) active.el.focus({ preventScroll: true });
  };

  /* --- Valeurs ------------------------------------------------------------ */

  Pause.prototype.cycle = function (dir) {
    var row = this.rows[this.index];
    if (!row || row.kind !== 'choice') return;
    var values = row.values;
    var at = values.indexOf(row.get());
    if (at < 0) at = 0;
    var next = values[(at + dir + values.length) % values.length];
    row.set(next);
    /* set() peut avoir reconstruit le menu (changement de langue) : dans ce
       cas la rangée n'existe plus, on ne touche à rien. */
    if (row.valueEl && row.el.parentNode) {
      row.valueEl.textContent = row.valueLabel(row.get());
    }
  };

  /* --- Ouverture, fermeture, clavier -------------------------------------- */

  Pause.prototype.show = function (state) {
    if (this.open) return;
    this.open = true;
    this.index = 0;
    this.build(state);
    this.layer.classList.remove('is-hidden');
    this.paint();
    this.hooks.onOpen();
  };

  Pause.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.layer.classList.add('is-hidden');
    this.hooks.onClose();
  };

  Pause.prototype.onKey = function (event) {
    /* Un champ de saisie ouvert a la priorité sur le menu. */
    var cible = event.target;
    if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA')) return;

    var key = event.key;

    /* Les mêmes touches que dans les autres menus : W/S doublent les flèches
       verticales, A/D les horizontales. On garde une main sur le clavier de
       jeu sans avoir à en changer pour naviguer. */
    var bas = key === 'ArrowDown' || key === 's' || key === 'S';
    var haut = key === 'ArrowUp' || key === 'w' || key === 'W'
      || key === 'z' || key === 'Z';
    var droite = key === 'ArrowRight' || key === 'd' || key === 'D';
    var gauche = key === 'ArrowLeft' || key === 'a' || key === 'A'
      || key === 'q' || key === 'Q';

    /* Échap ouvre et referme. On le capte même hors pause, c'est la porte
       d'entrée du menu. */
    if (key === 'Escape') {
      if (this.open) this.close();
      else if (this.hooks.canOpen()) this.show(this.hooks.state());
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!this.open) return;

    if (bas || haut) {
      var step = bas ? 1 : -1;
      this.index = (this.index + step + this.rows.length) % this.rows.length;
      this.paint();
    } else if (droite) {
      this.cycle(1);
    } else if (gauche) {
      this.cycle(-1);
    } else if (key === 'Enter' || key === ' ') {
      var row = this.rows[this.index];
      if (row && row.kind === 'action') row.run();
      else this.cycle(1);
    } else {
      return;
    }

    /* Les flèches pilotent aussi le skieur : tant que le menu est ouvert, on
       les lui confisque. */
    event.preventDefault();
    event.stopPropagation();
  };

  AS.Pause = Pause;
})((window.AlpineSchool = window.AlpineSchool || {}));
