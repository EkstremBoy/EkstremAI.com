/* =========================================================================
   Alpine School — l'expérience sur téléphone
   -------------------------------------------------------------------------
   Trois problèmes distincts, trois réponses.

   1. LA BARRE D'ADRESSE. Sur iPhone, Safari refuse le plein écran demandé en
      JavaScript : ce n'est pas un oubli, l'API n'existe pas. Le seul vrai
      plein écran s'obtient en ajoutant la page à l'écran d'accueil, grâce à
      la balise `apple-mobile-web-app-capable`. On l'explique donc au joueur
      au lieu de subir une barre qui mange un tiers de la piste. Sur Android,
      Chrome propose un vrai bouton d'installation : là, c'est un seul geste.

   2. LE PORTRAIT. La piste est large, les mots sont larges : en portrait, une
      pancarte n'entre dans le champ qu'une seconde avant d'être franchie, ce
      qui est trop court pour lire. Plutôt que de rétrécir le jeu, on assume :
      le jeu se joue à l'horizontale, et le portrait met en pause.

   3. LA REPRISE. Retourner le téléphone remet la partie en marche, mais pas
      instantanément — on n'a pas encore les pouces en place. Un décompte de
      trois secondes rend la main au bon moment.

   Ce module ne connaît du jeu que quatre fonctions, passées à `init`. Il
   n'importe rien et ne décide rien du gameplay.
   ========================================================================= */
(function (AS) {
  'use strict';

  var hooks = null;
  var el = {};
  var deferredPrompt = null;      // Android : l'invite d'installation captée
  var dismissed = false;          // « jouer quand même dans le navigateur »
  var frozen = false;             // figé parce qu'on est en portrait
  var tuto = false;               // le mode d'emploi tactile est affiche
  var tutoPending = false;        // une descente vient de commencer

  /* Le choix des commandes se pose UNE fois par visite, avant meme le menu
     du jeu -- pas au hasard d'un tour dans le menu pause en pleine descente,
     ce qui laissait la moitie des joueurs ignorer que ce mode existe. */
  var controlsAsked = false;
  var counting = 0;               // décompte en cours, en secondes
  var countTimer = null;

  /* --- Ce qu'on est --------------------------------------------------------
     `standalone` : lancé depuis l'écran d'accueil, donc déjà en plein écran.
     C'est la seule chose qui compte vraiment ; le reste sert à choisir les
     bons mots dans l'invitation. */
  function isStandalone() {
    return !!(window.navigator.standalone
      || (window.matchMedia
        && window.matchMedia('(display-mode: standalone)').matches)
      || (window.matchMedia
        && window.matchMedia('(display-mode: fullscreen)').matches));
  }

  function isTouch() {
    return !!(window.matchMedia
      && window.matchMedia('(pointer: coarse)').matches);
  }

  function isPhone() {
    return isTouch() && Math.min(window.innerWidth, window.innerHeight) < 560;
  }

  function isIOS() {
    var ua = navigator.userAgent || '';
    /* iPadOS se déclare « Macintosh » depuis iOS 13 : on le rattrape par la
       présence d'un écran tactile. */
    return /iPad|iPhone|iPod/.test(ua)
      || (/Macintosh/.test(ua) && isTouch());
  }

  /* Quel navigateur, précisément. Sur iOS ils partagent tous le moteur de
     Safari, mais chacun range « Sur l'écran d'accueil » à un endroit
     différent — et c'est justement l'endroit qu'il faut savoir indiquer. */
  function browserId() {
    var ua = navigator.userAgent || '';
    if (/CriOS|Chrome/.test(ua) && isIOS()) return 'chromeios';
    if (/DuckDuckGo/i.test(ua)) return 'ddg';
    if (/FxiOS/.test(ua)) return 'firefoxios';
    if (/EdgiOS/.test(ua)) return 'edgeios';
    if (isIOS()) return 'safari';
    if (/Firefox/.test(ua)) return 'firefox';
    return 'other';
  }

  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  /* --- L'invitation à installer -------------------------------------------
     Elle ne s'adresse qu'aux téléphones et tablettes qui ne sont PAS déjà en
     mode application. Sur ordinateur elle n'a aucun sens. */
  function shouldInvite() {
    /* Jamais par-dessus une descente ni par-dessus un résultat : l'invitation
       appartient au menu, là où le joueur n'est occupé à rien. Elle
       recouvrait la piste en pleine course. */
    return isTouch() && !isStandalone() && !dismissed && hooks.atMenu();
  }

  function paintInvite() {
    var t = AS.i18n.t;
    var android = !!deferredPrompt;

    el.inviteWhy.textContent = t('m.install.why');
    el.inviteTitle.textContent = t('m.install.title');

    /* Android : un bouton, un geste. iOS : on montre le chemin, parce qu'on
       ne peut pas le parcourir à la place du joueur. */
    el.inviteGo.classList.toggle('is-off', !android);
    el.inviteGo.textContent = t('m.install.go');

    el.inviteSteps.classList.toggle('is-off', android);
    el.inviteSteps.textContent = '';
    if (!android) {
      /* Trois étapes taillées pour LE navigateur en cours. Un mode d'emploi
         générique envoyait chercher un bouton qui n'est pas au même endroit,
         voire pas au même nom. */
      var nav = browserId();
      var etapes = [
        'm.how.' + nav + '.1', 'm.how.' + nav + '.2', 'm.how.' + nav + '.3'
      ];
      etapes.forEach(function (cle, i) {
        var li = document.createElement('li');
        var n = document.createElement('span');
        n.className = 'step-n';
        n.textContent = String(i + 1);
        var txt = document.createElement('span');
        txt.innerHTML = t(cle);
        li.appendChild(n);
        li.appendChild(txt);
        el.inviteSteps.appendChild(li);
      });
    }

    el.inviteSkip.textContent = t('m.install.skip');
    el.shareLabel.textContent = t('m.share');
    /* Ce bouton n'installe RIEN, et ne le prétend plus : navigator.share()
       ouvre la feuille de partage du système, où « Sur l'écran d'accueil »
       ne figure jamais — cette entrée appartient au menu propre du
       navigateur. On le garde parce qu'envoyer le lien à quelqu'un est utile
       en soi, mais l'installation passe par les étapes ci-dessus. */
    el.share.classList.toggle('is-off', !navigator.share);
    el.shareNote.classList.add('is-off');
  }

  function showInvite() {
    if (!shouldInvite()) return;
    paintInvite();
    el.invite.classList.remove('is-off');
  }

  function hideInvite() {
    el.invite.classList.add('is-off');
  }

  /* --- Le verrou paysage --------------------------------------------------- */
  function paintPortrait() {
    var t = AS.i18n.t;
    var enJeu = hooks.isPlaying();
    el.portraitTitle.textContent = t(enJeu ? 'm.portrait.paused' : 'm.portrait.title');
    el.portraitBody.textContent = t(enJeu ? 'm.portrait.paused.body' : 'm.portrait.body');
    /* En mode navigateur, le portrait est aussi le bon moment pour reparler
       de l'installation : on a l'attention et la place. */
    el.portraitInstall.classList.toggle('is-off', !shouldInvite());
    el.portraitInstall.textContent = t('m.portrait.install');
  }

  /* Trois choses peuvent figer la partie : le portrait, le mode d'emploi, le
     décompte. Une seule fonction en décide, sinon deux d'entre elles se
     dégèleraient mutuellement. */
  function applyFreeze() {
    hooks.setFrozen(frozen || tuto || counting > 0);
  }

  function shouldAskControls() {
    return isPhone() && AS.input.tiltAvailable() && !controlsAsked;
  }

  function paintFirstControls() {
    var t = AS.i18n.t;
    el.firstTitle.textContent = t('m.first.title');
    el.firstTouchTitle.textContent = t('pause.controls.touch');
    el.firstTouchBody.textContent = t('m.first.touch.body');
    el.firstTiltTitle.textContent = t('pause.controls.tilt');
    el.firstTiltBody.textContent = t('m.first.tilt.body');
    el.firstTiltNote.textContent = t('m.first.tilt.note');
    el.firstFoot.textContent = t('m.first.foot');
  }

  function showFirstControls() {
    paintFirstControls();
    el.firstControls.classList.remove('is-off');
  }

  function hideFirstControls() {
    el.firstControls.classList.add('is-off');
  }

  /* La pastille du menu principal : le second endroit, avec la pause, ou
     changer de commandes -- promis dans le texte de l'ecran de premier
     choix, donc elle doit vraiment exister. */
  function paintControlsBtn() {
    if (!el.controlsBtn) return;
    var show = isPhone() && AS.input.tiltAvailable() && hooks.atMenu();
    el.controlsBtn.hidden = !show;
    if (!show) return;
    var mode = AS.input.getMode();
    el.controlsBtn.querySelector('span').textContent = mode === 'tilt' ? '📱' : '👆';
    el.controlsBtn.setAttribute('aria-label', AS.i18n.t('pause.controls.' + mode));
  }

  function showTutorial() {
    if (tuto) return;
    tuto = true;
    var t = AS.i18n.t;

    /* Le mode d'emploi doit decrire le pilotage REELLEMENT actif. En mode
       inclinaison, montrer des zones a toucher enseignerait un geste qui ne
       repond plus : les cadres sont donc masques et le texte change. */
    var tilt = AS.input.getMode() === 'tilt';
    el.tuto.classList.toggle('is-tilt', tilt);

    el.tutoJump.textContent = t(tilt ? 'm.tuto.tilt.jump' : 'm.tuto.jump');
    el.tutoLeft.textContent = t(tilt ? 'm.tuto.tilt.left' : 'm.tuto.left');
    el.tutoRight.textContent = t(tilt ? 'm.tuto.tilt.right' : 'm.tuto.right');
    el.tutoGo.textContent = t('m.tuto.go');
    el.tutoFoot.textContent = t('m.tuto.foot');
    el.tuto.classList.remove('is-off');
    applyFreeze();
  }

  function hideTutorial() {
    if (!tuto) return;
    tuto = false;
    el.tuto.classList.add('is-off');
    /* Le zero de l'inclinaison se prend ICI, au moment exact ou le joueur
       reprend la main -- pas quand il a choisi le mode dans le menu, souvent
       le telephone pose a plat. Sinon cette position-la deviendrait le
       « tout droit » de toute la descente. */
    AS.input.recalibrateTilt();
    applyFreeze();
  }

  /* Appelable à chaque rafraîchissement : elle recalcule l'affichage au lieu
     de sortir tout de suite si le gel est déjà posé. Avec la garde d'avant, un
     détour par l'invitation d'installation laissait l'écran de rotation caché
     au retour — on se retrouvait devant un écran vide et figé. */
  function freeze() {
    frozen = true;
    applyFreeze();

    /* En pleine descente, tourner le téléphone ouvre le VRAI menu pause. Sur
       mobile il n'y a pas de touche Échap : la rotation était donc le seul
       geste disponible, et elle ne menait qu'à un écran sans issue. Musique,
       langue, recommencer, quitter — tout devient enfin atteignable au doigt.
       Hors partie, il n'y a rien à mettre en pause : on garde le simple
       conseil de tourner l'appareil. */
    hideTutorial();
    if (hooks.isPlaying() && hooks.openPause()) {
      el.portrait.classList.add('is-off');
      return;
    }
    paintPortrait();
    el.portrait.classList.remove('is-off');
  }

  function thaw() {
    if (!frozen) return;
    frozen = false;
    el.portrait.classList.add('is-off');
    hooks.closePause();
    /* Hors partie, rien à décompter : on rend la main tout de suite. */
    if (!hooks.isPlaying()) {
      applyFreeze();
      return;
    }
    startCountdown();
  }

  /* --- Le décompte de reprise ---------------------------------------------
     Le jeu reste figé pendant tout le décompte : reprendre la simulation à
     « 3 » reviendrait à jouer trois secondes sans les mains. */
  function startCountdown() {
    counting = 3;
    el.count.classList.remove('is-off');
    tickCountdown();
  }

  function tickCountdown() {
    if (countTimer) clearTimeout(countTimer);
    if (counting <= 0) {
      el.count.classList.add('is-off');
      /* On vient de tourner le telephone : l'inclinaison de reference n'a plus
         rien a voir avec celle d'avant la pause. */
      AS.input.recalibrateTilt();
      applyFreeze();
      return;
    }
    el.countNum.textContent = String(counting);
    /* On relance l'animation d'un chiffre à l'autre. */
    el.countNum.classList.remove('is-tick');
    void el.countNum.offsetWidth;
    el.countNum.classList.add('is-tick');
    AS.audio.sfx.tick();
    counting--;
    countTimer = setTimeout(tickCountdown, 700);
  }

  function cancelCountdown() {
    if (countTimer) clearTimeout(countTimer);
    countTimer = null;
    counting = 0;
    el.count.classList.add('is-off');
  }

  /* --- Le chef d'orchestre -------------------------------------------------
     Une seule fonction décide de tout, appelée à chaque événement qui peut
     changer la donne. C'est ce qui évite les états contradictoires. */
  function refresh() {
    if (!isPhone()) {
      /* Sur tablette et sur ordinateur, ni verrou paysage ni mode d'emploi
         tactile : il y a un clavier, et l'aide des touches est déjà au menu. */
      tutoPending = false;
      hideTutorial();
      if (frozen) { frozen = false; el.portrait.classList.add('is-off'); applyFreeze(); }
      if (shouldInvite() && isTouch()) showInvite(); else hideInvite();
      return;
    }

    if (isPortrait()) {
      cancelCountdown();
      hideInvite();
      hideFirstControls();
      freeze();
    } else {
      /* Le choix des commandes passe avant TOUT le reste, y compris
         l'invitation a installer : c'est la toute premiere decision du
         joueur, avant meme de savoir quel jeu il va lancer. */
      if (shouldAskControls()) {
        cancelCountdown();
        hideTutorial();
        hideInvite();
        /* Meme geste que la reprise apres rotation, en plus simple : on
           efface juste l'ecran de rotation s'il etait affiche, sans passer
           par thaw() et son decompte -- il n'y a encore aucune partie a
           reprendre. */
        frozen = false;
        el.portrait.classList.add('is-off');
        showFirstControls();
        paintControlsBtn();
        return;
      }
      hideFirstControls();

      /* Une descente vient de commencer : le mode d'emploi passe avant le
         décompte, et remplace la reprise après une rotation. */
      if (tutoPending && hooks.isPlaying()) {
        cancelCountdown();
        frozen = false;
        el.portrait.classList.add('is-off');
        hideInvite();
        showTutorial();
        paintControlsBtn();
        return;
      }
      thaw();
      if (shouldInvite()) showInvite(); else hideInvite();
    }

    paintControlsBtn();
  }

  /* Appelé par le jeu au départ de chaque descente. */
  function runStarted() {
    tutoPending = isPhone();
    refresh();
  }

  function init(h) {
    hooks = h;

    el.invite = document.getElementById('mInvite');
    el.inviteTitle = document.getElementById('mInviteTitle');
    el.inviteWhy = document.getElementById('mInviteWhy');
    el.inviteSteps = document.getElementById('mInviteSteps');
    el.inviteGo = document.getElementById('mInviteGo');
    el.inviteSkip = document.getElementById('mInviteSkip');
    el.share = document.getElementById('mShare');
    el.shareLabel = document.getElementById('mShareLabel');
    el.shareNote = document.getElementById('mShareNote');
    el.portrait = document.getElementById('mPortrait');
    el.portraitTitle = document.getElementById('mPortraitTitle');
    el.portraitBody = document.getElementById('mPortraitBody');
    el.portraitInstall = document.getElementById('mPortraitInstall');
    el.tuto = document.getElementById('mTuto');
    el.tutoJump = document.getElementById('mTutoJump');
    el.tutoLeft = document.getElementById('mTutoLeft');
    el.tutoRight = document.getElementById('mTutoRight');
    el.tutoGo = document.getElementById('mTutoGo');
    el.tutoFoot = document.getElementById('mTutoFoot');
    el.count = document.getElementById('mCount');
    el.countNum = document.getElementById('mCountNum');

    el.firstControls = document.getElementById('mFirstControls');
    el.firstTitle = document.getElementById('mFirstTitle');
    el.firstTouch = document.getElementById('mFirstTouch');
    el.firstTouchTitle = document.getElementById('mFirstTouchTitle');
    el.firstTouchBody = document.getElementById('mFirstTouchBody');
    el.firstTilt = document.getElementById('mFirstTilt');
    el.firstTiltTitle = document.getElementById('mFirstTiltTitle');
    el.firstTiltBody = document.getElementById('mFirstTiltBody');
    el.firstTiltNote = document.getElementById('mFirstTiltNote');
    el.firstFoot = document.getElementById('mFirstFoot');
    el.controlsBtn = document.getElementById('controlsBtn');

    /* Android/Chrome : le navigateur nous confie son invite. On la garde pour
       la déclencher sur un vrai geste du joueur, ce qu'il exige. */
    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
      if (!el.invite.classList.contains('is-off')) paintInvite();
    });

    el.inviteGo.addEventListener('click', function () {
      if (!deferredPrompt) return;
      var invite = deferredPrompt;
      deferredPrompt = null;
      invite.prompt();
      invite.userChoice.then(function (res) {
        if (res && res.outcome === 'accepted') { dismissed = true; hideInvite(); }
        else paintInvite();
      });
    });

    /* Ouvre la feuille de partage du système. Le pictogramme d'avant ne
       faisait rien : il désignait le bouton du navigateur sans pouvoir
       l'actionner, et on cliquait dessus pour rien.

       Réserve honnête : rien ne garantit qu'« Sur l'écran d'accueil » figure
       dans cette feuille — cette entrée appartient au navigateur, pas à nous.
       D'où la note affichée juste après, qui indique le repli. */
    el.share.addEventListener('click', function () {
      var note = function (cle) {
        el.shareNote.innerHTML = AS.i18n.t(cle);
        el.shareNote.classList.remove('is-off');
      };

      if (navigator.share) {
        navigator.share({ title: 'Alpine School', url: location.href })
          .catch(function () {});
        return;
      }

      /* Pas de partage natif : on copie l'adresse pour qu'elle puisse être
         collée dans Safari, seul navigateur iPhone à gérer proprement
         l'ajout à l'écran d'accueil. */
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href)
          .then(function () { note('m.share.copied'); })
          .catch(function () { note('m.share.manual'); });
      } else {
        note('m.share.manual');
      }
    });

    el.inviteSkip.addEventListener('click', function () {
      dismissed = true;
      hideInvite();
      /* Revenu du détour : on rend la main à l'état réel, qui remontrera
         l'écran de rotation si le téléphone est toujours à la verticale. */
      refresh();
    });

    el.tutoGo.addEventListener('click', function () {
      tutoPending = false;
      hideTutorial();
    });

    /* Choix des commandes, avant meme le menu du jeu. Le tactile n'exige
       rien -- on avance tout de suite. L'inclinaison, elle, passe par la
       demande de permission iOS : l'appel part ICI, dans ce gestionnaire de
       clic, synchrone, comme l'exige le systeme. Que le joueur accepte ou
       refuse, on considere la question posee -- il pourra toujours changer
       d'avis depuis la pastille du menu ou la pause. */
    el.firstTouch.addEventListener('click', function () {
      AS.input.setMode('touch');
      controlsAsked = true;
      refresh();
    });

    el.firstTilt.addEventListener('click', function () {
      AS.input.setMode('tilt').then(function () {
        controlsAsked = true;
        refresh();
      });
    });

    /* La pastille du menu : le second endroit promis dans le texte
       ci-dessus. Un tap bascule directement, meme permission demandee au
       meme instant synchrone. */
    if (el.controlsBtn) {
      el.controlsBtn.addEventListener('click', function () {
        var next = AS.input.getMode() === 'tilt' ? 'touch' : 'tilt';
        AS.input.setMode(next).then(function () { paintControlsBtn(); });
      });
    }

    el.portraitInstall.addEventListener('click', function () {
      /* Les deux calques ont le même plan : sans masquer celui-ci, l'invitation
         s'ouvrait DERRIÈRE l'écran de rotation et le lien semblait mort. */
      el.portrait.classList.add('is-off');
      dismissed = false;
      showInvite();
    });

    /* Le menu pause affiche un rappel « remets à l'horizontale », mais
       seulement sur mobile et seulement quand c'est la rotation qui l'a
       ouvert. */
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', function () {
      /* La taille de fenêtre n'est pas encore à jour au moment où l'événement
         part : on laisse passer une image. */
      setTimeout(refresh, 120);
      setTimeout(refresh, 420);
    });
    AS.i18n.onChange(function () {
      if (!el.invite.classList.contains('is-off')) paintInvite();
      if (!el.portrait.classList.contains('is-off')) paintPortrait();
    });

    refresh();
  }

  AS.mobile = {
    init: init,
    runStarted: runStarted,
    /* Le menu pause interroge ceci pour savoir s'il doit afficher le rappel de
       rotation à la place de la ligne « Reprendre » — sur un téléphone en
       portrait, reprendre ne se fait pas en cliquant. */
    isPortraitPause: function () { return frozen && isPhone(); },
    refresh: refresh,
    isPhone: isPhone,
    isTouch: isTouch,
    isStandalone: isStandalone,
    isFrozen: function () { return frozen || tuto || counting > 0; }
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
