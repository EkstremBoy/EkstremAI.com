/* =========================================================================
   Alpine School — bilingue français / anglais
   -------------------------------------------------------------------------
   Le jeu se retourne comme un gant. En français, on apprend l'anglais : le
   mot s'affiche en français, les pancartes portent des mots anglais. En
   anglais, c'est l'inverse — même liste de vocabulaire, lue à l'envers, sans
   une donnée de plus à saisir.

   POUR TRADUIRE : tout est dans TEXTS, une clé par texte. Un texte manquant
   en anglais retombe sur le français plutôt que d'afficher une clé nue à
   l'écran — mieux vaut une phrase dans la mauvaise langue qu'un `menu.title`
   en pleine interface.
   ========================================================================= */
(function (AS) {
  'use strict';

  var TEXTS = {
    fr: {
      'menu.lede': 'Choisis ce que tu veux pratiquer.',
      'menu.practice': 'Ce que tu pratiques',
      'mode.race': 'Course',
      'mode.race.desc': "Chrono, ligne d'arrivée et trois étoiles à décrocher.",
      'race.pick': 'Distance',
      'race.hint': "Même piste à chaque essai. Tout droit pour accélérer, les turbos donnent un coup de vitesse. Certains se cachent derrière un mur de sapins.",
      'race.board': 'Meilleurs temps',
      'race.reset': 'Effacer les temps',
      'race.board.empty': "Aucun temps pour l'instant. Descends une première fois.",
      'race.best': 'Record {t}',
      'race.nobest': 'Jamais couru',
      'race.stat.time': 'Temps',
      'race.stat.boosts': 'Turbos',
      'race.done.0': 'Arrivée',
      'race.done.1': 'Ligne franchie !',
      'race.done.2': 'Belle course !',
      'race.done.3': 'Course parfaite !',
      'race.done.sub.0': '—',
      'race.done.sub.1': "Tu es arrivé. Maintenant, gagne du temps : moins de virages, plus de turbos.",
      'race.done.sub.2': "Deux étoiles. La troisième se joue sur la ligne droite.",
      'race.done.sub.3': "Trois étoiles. Difficile de faire mieux.",
      'race.dnf': 'Course abandonnée',
      'race.dnf.sub': "Course interrompue.",
      /* --- Téléphone -------------------------------------------------- */
      'm.install.title': "Ajoute le jeu à ton écran d'accueil",
      'm.install.why': "Lancé depuis ton écran d'accueil, le jeu s'ouvre en vrai plein écran, sans barre d'adresse. C'est un tiers de piste en plus — assez pour voir arriver les mots et les sapins à temps. Dans le navigateur, la barre mange justement la partie de l'écran où ils apparaissent.",
      'm.install.go': "Installer maintenant",
      'm.install.ios.1': "Touche le bouton ci-dessous, ou celui de <b>Partage</b> de ton navigateur.",
      'm.install.ios.2': "Fais défiler et choisis <b>Sur l'écran d'accueil</b>.",
      'm.install.ios.3': "Ouvre <b>Alpine School</b> depuis ton écran d'accueil : plein écran, à l'horizontale.",
      'm.install.other.1': "Ouvre le menu de ton navigateur.",
      'm.install.other.2': "Choisis <b>Ajouter à l'écran d'accueil</b>, puis lance le jeu depuis là.",
      'm.how.safari.1': "En bas de l'écran, touche le <b>carré avec une flèche vers le haut</b> — le bouton Partager de Safari.",
      'm.how.safari.2': "Fais défiler la liste vers le bas jusqu'à <b>Sur l'écran d'accueil</b>.",
      'm.how.safari.3': "Touche <b>Ajouter</b>, puis lance Alpine School depuis ton écran d'accueil.",
      'm.how.chromeios.1': "En bas à droite, touche les <b>trois points</b> ⋯.",
      'm.how.chromeios.2': "Choisis <b>Partager…</b>, puis <b>Sur l'écran d'accueil</b> dans la liste.",
      'm.how.chromeios.3': "Touche <b>Ajouter</b>, puis lance le jeu depuis ton écran d'accueil.",
      'm.how.ddg.1': "En bas de l'écran, touche le <b>bouton Partager</b> (le carré avec une flèche).",
      'm.how.ddg.2': "Fais défiler et choisis <b>Sur l'écran d'accueil</b>.",
      'm.how.ddg.3': "Touche <b>Ajouter</b>, puis lance le jeu depuis ton écran d'accueil.",
      'm.how.firefoxios.1': "En bas à droite, touche les <b>trois traits</b> ☰.",
      'm.how.firefoxios.2': "Choisis <b>Partager</b>, puis <b>Sur l'écran d'accueil</b>.",
      'm.how.firefoxios.3': "Touche <b>Ajouter</b>, puis lance le jeu depuis ton écran d'accueil.",
      'm.how.edgeios.1': "En bas au centre, touche les <b>trois points</b> ⋯.",
      'm.how.edgeios.2': "Choisis <b>Partager</b>, puis <b>Sur l'écran d'accueil</b>.",
      'm.how.edgeios.3': "Touche <b>Ajouter</b>, puis lance le jeu depuis ton écran d'accueil.",
      'm.how.firefox.1': "Ouvre le menu <b>☰</b> de Firefox.",
      'm.how.firefox.2': "Choisis <b>Installer</b> ou <b>Ajouter à l'écran d'accueil</b>.",
      'm.how.firefox.3': "Lance ensuite le jeu depuis ton écran d'accueil.",
      'm.how.other.1': "Ouvre le <b>menu</b> de ton navigateur (souvent ⋯ ou ☰).",
      'm.how.other.2': "Cherche <b>Ajouter à l'écran d'accueil</b> ou <b>Installer</b>.",
      'm.how.other.3': "Si tu ne le trouves pas, ouvre cette page dans <b>Safari</b> : c'est le navigateur iPhone qui le propose le plus sûrement.",
      'm.share': 'Envoyer le lien à quelqu’un',
      'm.share.copied': "Lien copié. Colle-le dans <b>Safari</b>, puis utilise son bouton Partage — c'est le navigateur iPhone qui gère le mieux l'ajout à l'écran d'accueil.",
      'm.share.manual': "Si « Sur l'écran d'accueil » n'apparaît pas dans cette liste, utilise plutôt le bouton Partage de ton navigateur, en bas de l'écran.",
      'm.install.skip': "Jouer quand même dans le navigateur",
      'm.tuto.jump': 'Touche ici, en haut, pour SAUTER',
      'm.tuto.left': "Maintiens ce côté pour tourner à GAUCHE",
      'm.tuto.right': "Maintiens ce côté pour tourner à DROITE",
      'm.tuto.go': 'GO !',
      'm.tuto.foot': "Mets le téléphone à la verticale pour la pause et les réglages.",
      'm.portrait.title': "Tourne ton téléphone",
      'm.portrait.body': "Le jeu se joue à l'horizontale. La piste est large : en portrait, une pancarte n'apparaît qu'une seconde avant d'être franchie, et c'est trop court pour lire.",
      'm.portrait.paused': "Pause",
      'm.portrait.paused.body': "Remets ton téléphone à l'horizontale : la descente repart après un décompte.",
      'm.portrait.install': "Pourquoi installer le jeu ?",
      'race.record': 'Nouveau record !',
      'race.level': 'Niveau {n} — {m} m',
      'race.name.ask': 'Tu entres dans les trois meilleurs ! Ton nom :',
      'race.name.save': 'Enregistrer',
      'race.name.default': 'Anonyme',
      'race.name.saved': 'Inscrit au tableau : {n}',
      'menu.answers': 'Combien de réponses',
      'answers.2': '2 réponses',
      'answers.3': '3 réponses',
      'answers.2.hint': "Deux pancartes côte à côte, chacune sur la moitié de la piste. On lit, on choisit son côté.",
      'answers.3.hint': "Trois pancartes jointives, un tiers de piste chacune. Un choix de plus, et moins de temps pour hésiter.",
      'menu.need.diff': 'Choisis le nombre de réponses.',
      'menu.need.both': 'Choisis un niveau et le nombre de réponses.',
      'menu.level': 'Niveau des mots',
      'menu.level.math': 'Table à réviser',
      'menu.go': 'Descendre',
      'menu.need.level': 'Choisis un niveau.',

      'mode.freestyle': 'Freestyle',
      'mode.freestyle.desc': "Aucune question. Un arbre et c'est fini.",
      'mode.words': 'Vocabulaire',
      'mode.words.desc': 'Traverse la pancarte qui traduit bien le mot.',
      'mode.math': 'Multiplications',
      'mode.math.desc': 'Vise la bonne réponse en dévalant.',
      'mode.crazy': 'Crazy Mode',
      'mode.crazy.desc': 'Choisis ton chaos tous les cent mètres.',

      'words.1': 'Débutant', 'words.1.sample': 'chat, pomme, rouge',
      'words.2': 'Courant', 'words.2.sample': 'emprunter, réussir',
      'words.3': 'Littéraire', 'words.3.sample': 'crépuscule, orgueil',

      'math.1': 'Niveau 1', 'math.1.sample': "jusqu'à 6",
      'math.2': 'Niveau 2', 'math.2.sample': "jusqu'à 12",
      'math.3': 'Niveau 3', 'math.3.sample': "jusqu'à 20",


      'keys.line1': 'Tiens {left} ou {right} pour carver. Plus tu tiens, plus tu glisses loin.',
      'keys.line2': 'Appuie sur {jump} pour sauter.',
      'keys.line3': '{esc} met en pause et ouvre les réglages.',
      'keys.line4': '{f11} pour le plein écran, {m} pour couper le son.',
      /* Encouragements des jalons, en rotation. Courts : ils passent en une
         seconde et doivent se lire d'un coup d'œil. */
      'bonus.night': '🎵 Bonus caché',
      'bonus.night.sub': 'Enjoy that smooth ride',
      'milestone.0': 'Continue !',
      'milestone.1': 'Bravo !',
      'milestone.2': 'Superbe !',
      'milestone.3': 'Quelle descente !',
      'keys.space': 'Espace',
      /* Le nom de la touche change de langue comme le reste : « Échap » sur
         un clavier français, « Esc » sur un clavier anglais. */
      'keys.esc': 'Échap',

      'hud.distance': 'Distance',
      'hud.score': 'Score',
      'hud.speed': 'Vitesse',
      'hud.translate': 'TRADUIS',
      'hud.multiply': 'COMBIEN FONT',
      'hud.streak': 'SÉRIE ×{n}',

      /* --- Messages de fin, gradués ---------------------------------------
         La formule tient en une règle : on ne félicite jamais une descente
         ratée, et on ne se moque jamais d'une bonne. Entre les deux, on
         constate avec un peu de malice. */
      'over.free.1': 'Ça a été bref', 'over.free.1.sub': "Le sapin n'a même pas eu à viser.",
      'over.free.2': 'Sapin 1 — toi 0', 'over.free.2.sub': 'La montagne gagne toujours à la fin.',
      'over.free.3': 'Belle glisse', 'over.free.3.sub': 'Tu commençais à prendre le pli.',
      'over.free.4': 'Tu tenais quelque chose', 'over.free.4.sub': "Encore un peu et la montagne s'inquiétait.",
      'over.free.5': 'Descente de patron', 'over.free.5.sub': "À ce rythme, c'est toi qui gagnes.",

      'over.quiz.1': 'Fin de la descente', 'over.quiz.1.sub': 'La piste était plus rapide que les mots.',
      'over.quiz.2': 'Ça vient', 'over.quiz.2.sub': 'La moitié du chemin est faite.',
      'over.quiz.3': 'Belle descente !', 'over.quiz.3.sub': 'Tu lis vite et tu vises juste.',
      'over.quiz.4': 'Sans une faute', 'over.quiz.4.sub': 'Rien à redire. Refais-en une, pour voir.',

      'over.crazy.1': 'Le chaos a gagné', 'over.crazy.1.sub': 'Il gagne souvent, au début.',
      'over.crazy.2': 'Tu as tenu bon', 'over.crazy.2.sub': 'La montagne a dû insister.',
      'over.crazy.3': 'Dompteur de chaos', 'over.crazy.3.sub': 'À ce stade, tu choisis les folies exprès.',

      'over.rightAnswers': '{n} bonnes réponses sur {total}.',
      'over.rightAnswer': '{n} bonne réponse sur {total}.',
      'over.again': 'Redescendre',
      'over.back': 'Changer de mode',
      'over.stat.distance': 'distance',
      'over.stat.finalSpeed': 'km/h final',
      'over.stat.score': 'score',
      'over.stat.bestCombo': 'meilleur combo',
      'over.stat.choices': 'choix',

      'a11y.mute': 'Couper le son',
      'a11y.unmute': 'Activer le son',
      'a11y.lang': 'Switch to English',
      'a11y.scene': 'Descente à ski en 3D',
      'a11y.lives': 'Vies restantes',
      'a11y.fullscreen': 'Plein écran',
      'hint.rotate': "Tourne ton téléphone : la piste est bien plus lisible à l'horizontale.",

      /* --- Menu pause ------------------------------------------------------ */
      'pause.title': 'Pause',
      'pause.hint.rotate': "Remets ton téléphone à l'horizontale pour repartir — un décompte te laissera le temps de reprendre les commandes.",
      'pause.hint': 'Flèches pour naviguer, Entrée pour valider, Échap pour reprendre.',
      'pause.resume': 'Reprendre',
      'pause.restart': 'Recommencer',
      'pause.quit': 'Retour au menu',
      'pause.music': 'Musique',
      'pause.spacing': 'Portes tous les',
      'pause.lang': 'Langue',
      'pause.mode': 'Mode',
      'music.off': 'Aucune',
      'music.alpine': 'Alpine',
      'music.arcade': 'Arcade',
      'music.ska': 'Ska',

      'crazy.catalogue': 'Catalogue des folies',
      'crazy.catalogue.hint': 'Décoche ce que tu ne veux pas voir apparaître.',
      'crazy.all': 'Tout cocher',
      'crazy.none': 'Tout décocher',
      'crazy.solo.hint': "Descente sur mesure : cette folie tourne du début à la fin, et il n'y aura aucune porte.",
      'crazy.start': 'Lancer le Crazy Mode',
      'crazy.needOne': 'Coche au moins une folie.',
      'crazy.locked': 'Fais 2000 m en Freestyle pour ouvrir.',
      'crazy.random': 'Mode surprise',
      'crazy.random.hint': "Une pancarte « ? » sur toute la largeur, au même rythme que les portes. Ce qu'elle cache, tu le découvres en passant dessous.",
      'crazy.random.locked': 'Mode surprise — fais 2000 m en Crazy Mode pour ouvrir.',
      'crazy.random.locked.body': 'Mode surprise — encore {gap} m en Crazy Mode.',
      'crazy.locked.body': 'Le Crazy Mode s\'ouvre après 2000 m en Freestyle. Tu en es à {best} m.',
      'crazy.custom': 'Descente sur mesure',

      'fatal.title': 'La montagne est fermée',
      'fatal.nowebgl': "Ce navigateur ne sait pas afficher la 3D. Essaie une version plus récente, ou un autre navigateur.",
      'fatal.nothree': "La bibliothèque 3D n'a pas pu être chargée. Vérifie ta connexion, puis recharge la page."
    },

    en: {
      'menu.lede': 'Pick what you want to practise.',
      'menu.practice': 'What you practise',
      'mode.race': 'Race',
      'mode.race.desc': 'A clock, a finish line and three stars to earn.',
      'race.pick': 'Distance',
      'race.hint': 'Same course every time. Straight lines build speed; turbos give you a burst. Some hide behind a wall of pines.',
      'race.board': 'Best times',
      'race.reset': 'Clear the times',
      'race.board.empty': 'No times yet. Go and set one.',
      'race.best': 'Best {t}',
      'race.nobest': 'Never raced',
      'race.stat.time': 'Time',
      'race.stat.boosts': 'Turbos',
      'race.done.0': 'Finish',
      'race.done.1': 'You crossed the line!',
      'race.done.2': 'Good run!',
      'race.done.3': 'Perfect run!',
      'race.done.sub.0': '—',
      'race.done.sub.1': 'You made it. Now find some time: fewer turns, more turbos.',
      'race.done.sub.2': 'Two stars. The third one is won on the straights.',
      'race.done.sub.3': 'Three stars. Hard to do better than that.',
      'race.dnf': 'Race abandoned',
      'race.dnf.sub': 'The run was cut short.',
      'm.install.title': 'Add the game to your home screen',
      'm.install.why': 'Launched from your home screen, the game opens truly full screen, with no address bar. That is a third more slope — enough to see the words and the pines coming in time. In the browser, the bar covers exactly the part of the screen where they appear.',
      'm.install.go': 'Install now',
      'm.install.ios.1': "Tap the button below, or your browser's own <b>Share</b> button.",
      'm.install.ios.2': 'Scroll down and choose <b>Add to Home Screen</b>.',
      'm.install.ios.3': 'Open <b>Alpine School</b> from your home screen: full screen, landscape.',
      'm.install.other.1': 'Open your browser menu.',
      'm.install.other.2': 'Choose <b>Add to Home screen</b>, then launch the game from there.',
      'm.how.safari.1': 'At the bottom of the screen, tap the <b>square with an arrow</b> — Safari’s Share button.',
      'm.how.safari.2': 'Scroll down the list to <b>Add to Home Screen</b>.',
      'm.how.safari.3': 'Tap <b>Add</b>, then launch Alpine School from your home screen.',
      'm.how.chromeios.1': 'Bottom right, tap the <b>three dots</b> ⋯.',
      'm.how.chromeios.2': 'Choose <b>Share…</b>, then <b>Add to Home Screen</b>.',
      'm.how.chromeios.3': 'Tap <b>Add</b>, then launch the game from your home screen.',
      'm.how.ddg.1': 'At the bottom, tap the <b>Share button</b> (the square with an arrow).',
      'm.how.ddg.2': 'Scroll down and choose <b>Add to Home Screen</b>.',
      'm.how.ddg.3': 'Tap <b>Add</b>, then launch the game from your home screen.',
      'm.how.firefoxios.1': 'Bottom right, tap the <b>three lines</b> ☰.',
      'm.how.firefoxios.2': 'Choose <b>Share</b>, then <b>Add to Home Screen</b>.',
      'm.how.firefoxios.3': 'Tap <b>Add</b>, then launch the game from your home screen.',
      'm.how.edgeios.1': 'Bottom centre, tap the <b>three dots</b> ⋯.',
      'm.how.edgeios.2': 'Choose <b>Share</b>, then <b>Add to Home Screen</b>.',
      'm.how.edgeios.3': 'Tap <b>Add</b>, then launch the game from your home screen.',
      'm.how.firefox.1': 'Open Firefox’s <b>☰</b> menu.',
      'm.how.firefox.2': 'Choose <b>Install</b> or <b>Add to Home screen</b>.',
      'm.how.firefox.3': 'Then launch the game from your home screen.',
      'm.how.other.1': 'Open your browser’s <b>menu</b> (often ⋯ or ☰).',
      'm.how.other.2': 'Look for <b>Add to Home screen</b> or <b>Install</b>.',
      'm.how.other.3': 'If you cannot find it, open this page in <b>Safari</b> — it is the iPhone browser that offers it most reliably.',
      'm.share': 'Send the link to someone',
      'm.share.copied': 'Link copied. Paste it into <b>Safari</b>, then use its Share button — Safari handles Add to Home Screen best on iPhone.',
      'm.share.manual': "If \"Add to Home Screen\" is not in this list, use your browser's own Share button at the bottom of the screen instead.",
      'm.install.skip': 'Play in the browser anyway',
      'm.tuto.jump': 'Touche ici, en haut, pour SAUTER',
      'm.tuto.left': "Maintiens ce côté pour tourner à GAUCHE",
      'm.tuto.right': "Maintiens ce côté pour tourner à DROITE",
      'm.tuto.go': 'GO !',
      'm.tuto.foot': "Mets le téléphone à la verticale pour la pause et les réglages.",
      'm.tuto.jump': 'Tap up here to JUMP',
      'm.tuto.left': 'Hold this side to turn LEFT',
      'm.tuto.right': 'Hold this side to turn RIGHT',
      'm.tuto.go': 'GO!',
      'm.tuto.foot': 'Turn the phone upright for pause and settings.',
      'm.portrait.title': 'Turn your phone sideways',
      'm.portrait.body': 'The game is played in landscape. The slope is wide: in portrait a sign only appears a second before you reach it, which is too short to read.',
      'm.portrait.paused': 'Paused',
      'm.portrait.paused.body': 'Turn your phone back to landscape: the run restarts after a countdown.',
      'm.portrait.install': 'Why install the game?',
      'race.record': 'New best time!',
      'race.level': 'Level {n} — {m} m',
      'race.name.ask': 'You made the top three! Your name:',
      'race.name.save': 'Save',
      'race.name.default': 'Anonymous',
      'race.name.saved': 'Added to the board: {n}',
      'menu.answers': 'How many answers',
      'answers.2': '2 answers',
      'answers.3': '3 answers',
      'answers.2.hint': 'Two signs side by side, half the slope each. Read, then pick your side.',
      'answers.3.hint': 'Three signs, a third of the slope each. One more choice, less time to hesitate.',
      'menu.need.diff': 'Pick how many answers.',
      'menu.need.both': 'Pick a level and how many answers.',
      'menu.level': 'Word level',
      'menu.level.math': 'Table to practise',
      'menu.go': 'Set off',
      'menu.need.level': 'Pick a level.',

      'mode.freestyle': 'Freestyle',
      'mode.freestyle.desc': 'No questions. One tree and it is over.',
      'mode.words': 'Vocabulary',
      'mode.words.desc': 'Ski through the sign that translates the word.',
      'mode.math': 'Times tables',
      'mode.math.desc': 'Aim for the right answer on the way down.',
      'mode.crazy': 'Crazy Mode',
      'mode.crazy.desc': 'Pick your chaos every hundred metres.',

      'words.1': 'Beginner', 'words.1.sample': 'cat, apple, red',
      'words.2': 'Everyday', 'words.2.sample': 'borrow, succeed',
      'words.3': 'Literary', 'words.3.sample': 'dusk, pride',

      'math.1': 'Level 1', 'math.1.sample': 'up to 6',
      'math.2': 'Level 2', 'math.2.sample': 'up to 12',
      'math.3': 'Level 3', 'math.3.sample': 'up to 20',


      'keys.line1': 'Hold {left} or {right} to carve. The longer you hold, the further you slide.',
      'keys.line2': 'Press {jump} to jump.',
      'keys.line3': '{esc} pauses and opens the settings.',
      'keys.line4': '{f11} for full screen, {m} to mute.',
      'bonus.night': '🎵 Hidden bonus',
      'bonus.night.sub': 'Enjoy that smooth ride',
      'milestone.0': 'Keep going!',
      'milestone.1': 'Well done!',
      'milestone.2': 'Brilliant!',
      'milestone.3': 'What a run!',
      'keys.space': 'Space',
      'keys.esc': 'Esc',

      'hud.distance': 'Distance',
      'hud.score': 'Score',
      'hud.speed': 'Speed',
      'hud.translate': 'TRANSLATE',
      'hud.multiply': 'WHAT IS',
      'hud.streak': 'STREAK ×{n}',

      'over.free.1': 'That was short', 'over.free.1.sub': 'The tree barely had to aim.',
      'over.free.2': 'Tree 1 — you 0', 'over.free.2.sub': 'The mountain always wins in the end.',
      'over.free.3': 'Good sliding', 'over.free.3.sub': 'You were starting to get the hang of it.',
      'over.free.4': 'You were onto something', 'over.free.4.sub': 'A little more and the mountain would have worried.',
      'over.free.5': 'A masterclass', 'over.free.5.sub': 'At that rate, you are the one winning.',

      'over.quiz.1': 'End of the run', 'over.quiz.1.sub': 'The slope was faster than the words.',
      'over.quiz.2': 'Getting there', 'over.quiz.2.sub': 'Half the road is behind you.',
      'over.quiz.3': 'Fine run!', 'over.quiz.3.sub': 'You read fast and you aim true.',
      'over.quiz.4': 'Not one mistake', 'over.quiz.4.sub': 'Nothing to add. Go again, just to see.',

      'over.crazy.1': 'Chaos won', 'over.crazy.1.sub': 'It usually does, at first.',
      'over.crazy.2': 'You held on', 'over.crazy.2.sub': 'The mountain had to insist.',
      'over.crazy.3': 'Chaos tamer', 'over.crazy.3.sub': 'By now you pick the mad ones on purpose.',

      'over.rightAnswers': '{n} right answers out of {total}.',
      'over.rightAnswer': '{n} right answer out of {total}.',
      'over.again': 'Ski again',
      'over.back': 'Change mode',
      'over.stat.distance': 'distance',
      'over.stat.finalSpeed': 'km/h at the end',
      'over.stat.score': 'score',
      'over.stat.bestCombo': 'best streak',
      'over.stat.choices': 'choices',

      'a11y.mute': 'Mute',
      'a11y.unmute': 'Unmute',
      'a11y.lang': 'Passer en français',
      'a11y.scene': '3D downhill skiing',
      'a11y.lives': 'Lives left',
      'a11y.fullscreen': 'Full screen',
      'hint.rotate': 'Turn your phone sideways — the slope is far easier to read.',

      'pause.title': 'Paused',
      'pause.hint.rotate': "Remets ton téléphone à l'horizontale pour repartir — un décompte te laissera le temps de reprendre les commandes.",
      'pause.hint.rotate': 'Turn your phone back to landscape to carry on — a countdown will give you time to get your thumbs ready.',
      'pause.hint': 'Arrows to move, Enter to choose, Esc to carry on.',
      'pause.resume': 'Carry on',
      'pause.restart': 'Start over',
      'pause.quit': 'Back to menu',
      'pause.music': 'Music',
      'pause.spacing': 'Gates every',
      'pause.lang': 'Language',
      'pause.mode': 'Mode',
      'music.off': 'None',
      'music.alpine': 'Alpine',
      'music.arcade': 'Arcade',
      'music.ska': 'Ska',

      'crazy.catalogue': 'Catalogue of madness',
      'crazy.catalogue.hint': 'Untick anything you would rather not meet.',
      'crazy.all': 'Tick all',
      'crazy.none': 'Untick all',
      'crazy.solo.hint': 'Made to measure: this one runs from start to finish, and there will be no gates at all.',
      'crazy.start': 'Start Crazy Mode',
      'crazy.needOne': 'Tick at least one.',
      'crazy.locked': 'Ski 2000 m in Freestyle to unlock.',
      'crazy.random': 'Surprise mode',
      'crazy.random.hint': 'A "?" sign right across the piste, at the same spacing as the gates. What it hides, you find out as you ski under it.',
      'crazy.random.locked': 'Surprise mode — ski 2000 m in Crazy Mode to unlock.',
      'crazy.random.locked.body': 'Surprise mode — {gap} m to go in Crazy Mode.',
      'crazy.locked.body': 'Crazy Mode opens after 2000 m in Freestyle. You are at {best} m.',
      'crazy.custom': 'Made-to-measure run',

      'fatal.title': 'The mountain is closed',
      'fatal.nowebgl': 'This browser cannot show 3D. Try a newer one, or a different browser.',
      'fatal.nothree': 'The 3D library could not load. Check your connection, then reload the page.'
    }
  };

  var lang = 'fr';
  var listeners = [];

  function t(key, vars) {
    var table = TEXTS[lang] || TEXTS.fr;
    var value = table[key];
    if (value === undefined) value = TEXTS.fr[key];
    if (value === undefined) return key;
    if (vars) {
      for (var k in vars) value = value.split('{' + k + '}').join(vars[k]);
    }
    return value;
  }

  /* Choisit un message selon un score et une échelle de seuils. Renvoie le
     couple titre / sous-titre déjà traduit. */
  function graded(prefix, value, thresholds) {
    var index = 1;
    for (var i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) index = i + 2;
    }
    return { title: t(prefix + '.' + index), sub: t(prefix + '.' + index + '.sub') };
  }

  function apply(root) {
    var scope = root || document;
    var i, nodes;

    nodes = scope.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    nodes = scope.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = t(nodes[i].getAttribute('data-i18n-html'));
    }
    nodes = scope.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute('aria-label', t(nodes[i].getAttribute('data-i18n-aria')));
    }
    document.documentElement.setAttribute('lang', lang);
  }

  function set(next) {
    if (next !== 'fr' && next !== 'en') return;
    if (next === lang) return;
    lang = next;
    apply();
    for (var i = 0; i < listeners.length; i++) listeners[i](lang);
  }

  function onChange(fn) { listeners.push(fn); }

  function detect() {
    var nav = (navigator.language || 'fr').toLowerCase();
    lang = nav.indexOf('en') === 0 ? 'en' : 'fr';
    return lang;
  }

  AS.i18n = {
    t: t,
    graded: graded,
    apply: apply,
    set: set,
    onChange: onChange,
    detect: detect,
    get: function () { return lang; },
    targetLanguage: function () { return lang === 'fr' ? 'en' : 'fr'; },
    TEXTS: TEXTS
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
