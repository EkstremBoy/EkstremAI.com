/* =========================================================================
   Alpine School — constantes
   -------------------------------------------------------------------------
   Tout ce qui se retouche sans ouvrir le moteur vit ici : la palette (pour le
   rethéming quand la charte du site sera figée) et les valeurs de physique.

   Les valeurs de PHYSICS ont été réglées à la main sur le prototype 2D puis
   validées. Ne les change pas sans rejouer les trois modes.
   ========================================================================= */
(function (AS) {
  'use strict';

  /* --- Palette -----------------------------------------------------------
     Un seul endroit à modifier pour rethémer le jeu entier. Les valeurs
     dérivées (soleil, brouillard…) sont calculées plus bas à partir d'elles. */
  var PALETTE = {
    skyTop: 0x4fa9d6,
    skyHorizon: 0xdceffa,

    snow: 0xffffff,
    snowShadow: 0xdcebf6,
    snowDeep: 0xbfd9ea,

    peaksFar: 0xb9d5e6,
    peaksNear: 0x93bcd4,

    pineLight: 0x3e9268,
    pineMid: 0x2f7a5a,
    pineDark: 0x1e5340,

    rider: 0xf2643c,
    beanie: 0xffb020,

    good: 0x3fa96b,
    bad: 0xe2564a,

    rock: 0x8a98a6,
    ink: 0x123047
  };

  /* Teintes dérivées — jamais saisies à la main, pour que le rethéming
     n'oblige pas à retoucher douze valeurs cohérentes entre elles. */
  var DERIVED = {
    /* Le brouillard doit se fondre dans le bas du ciel, sinon l'horizon
       se voit comme une couture. */
    fog: 0xcfe4f4,
    /* Soleil à peine ambré : plus chaud que ça et la neige vire au sable —
       elle tient sa blancheur du contraste entre une lumière presque neutre
       et un ciel franchement bleu, pas d'un blanc pur mal éclairé. */
    sunLight: 0xfff4e6,
    sunDisc: 0xfff3d2,
    hemiSky: 0xa9c9ec,
    hemiGround: 0xe4eefa,
    trunk: 0x6b4a32,
    skin: 0xf6d2b0,
    post: 0x8fa8bc,
    forestBand: 0x2c6650
  };

  /* --- Physique — valeurs validées, ne pas réinventer -------------------- */
  var PHYSICS = {
    HALF: 3.4,               // demi-largeur de piste, en unités monde (= mètres)

    LAT_ACCEL: 7.2,          // accélération latérale, unités/s²
    FRICTION_IDLE: 4.2,      // friction quand on ne tient aucune direction, /s
    FRICTION_INPUT: 1.5,     // friction quand on carve, /s
    VX_MAX: 3.6,             // vitesse latérale maximale, unités/s
    AIR_GRIP: 0.45,          // on dirige beaucoup moins en l'air

    JUMP_V: 5.2,             // impulsion verticale
    GRAVITY: 8.2,            // /s²
    JUMP_BUFFER: 0.18,       // appuyer un peu trop tôt fonctionne quand même

    ROCK_CLEAR: 0.55,        // au-dessus, le rocher passe sous les skis
    /* Un sapin ne se franchit JAMAIS. Le prototype utilisait 1.35, mais
       l'apogée du saut vaut 1.65 : un saut parfaitement calé passait donc
       au-dessus d'un sapin, ce que le briefing exclut. Le seuil est mis
       hors d'atteinte plutôt que « très haut », pour que ça reste vrai même
       si on retouche l'impulsion. */
    TREE_CLEAR: Infinity,
    HIT_Z_NEAR: -0.6,        // fenêtre de collision en profondeur
    HIT_Z_FAR: 1.4,
    HIT_X: 0.42,             // demi-largeur de collision latérale

    SPEED_BASE_FREE: 24,
    /* La montée en Freestyle a deux temps : SPEED_RISE se gagne vite puis
       sature (on arrive rapidement à une vitesse agréable), et SPEED_CREEP
       continue de grimper indéfiniment (au bout d'un long moment, ça devient
       vraiment un défi). SPEED_CAP_FREE ne borne plus la vitesse — il ne sert
       plus qu'à normaliser l'effet de champ et le vent. */
    SPEED_RISE: 22,
    SPEED_RISE_LEN: 1400,
    SPEED_CREEP: 0.0034,
    SPEED_GAIN_FREE: 0.012,  // conservé : le mode Crazy s'en sert
    SPEED_CAP_FREE: 62,
    SPEED_BASE_QUIZ: 20,
    /* Crazy : même forme qu'en Freestyle — une montée qui sature vite puis
       une dérive qui ne s'arrête jamais — mais plus basse, parce que les
       folies s'empilent. L'ancien plafond dur à 40 figeait la descente à
       3000 m et rendait toute perte de vitesse indolore : on la regagnait
       aussitôt. */
    SPEED_BASE_CRAZY: 23,
    SPEED_RISE_CRAZY: 16,
    SPEED_CREEP_CRAZY: 0.0022,
    /* Reprise après un choc, en unités/s². C'est LA différence avec le
       Freestyle : là-bas on retrouve sa vitesse presque aussitôt, ici on l'a
       vraiment perdue et il faut la reconstruire. */
    CRAZY_REGAIN: 1.7,

    /* --- Mode Course -----------------------------------------------------
       La ligne droite est la ressource : on ne gagne de la vitesse qu'en
       skiant droit. RACE_TURN_COST est la part d'accélération qu'un virage à
       fond confisque — à 0.9, virer revient à ne plus accélérer du tout.
       Le ralentissement, lui, n'est jamais bridé. */
    RACE_BASE: 25,
    RACE_RISE: 21,
    RACE_RISE_LEN: 850,
    RACE_TURN_COST: 0.9,
    /* Gain de vitesse en unités/s², et non un rappel proportionnel à l'écart.
       C'est toute la différence : un rappel referme d'autant plus vite qu'on
       est loin, si bien qu'un sapin qui coupait la vitesse de moitié était
       remboursé en deux secondes. À taux constant, tomber de cent à cinquante
       veut dire remonter depuis cinquante, exactement comme au départ. */
    RACE_GAIN: 2.4,
    RACE_BOOST: 7.5,         // gain instantané d'un tremplin, unités/s
    RACE_BOOST_CAP: 12,      // au-delà de la cible : la marge que donne un tremplin
    RACE_DRIFT: 1.9,         // durée du dérapage d'arrivée, s

    SPEED_GAIN_QUIZ: 0.8,    // par point de combo
    /* Abaissé de 44 : le plafond décidait du temps de lecture, puisque celui-ci
       vaut « distance à laquelle la pancarte devient lisible » divisé par la
       vitesse. À 44 il ne restait qu'une seconde et demie pour lire trois mots
       sur un téléphone. */
    SPEED_CAP_QUIZ: 35,
    SPEED_SMOOTH: 0.6,       // lissage vers la vitesse cible, /s
    CARVE_DRAG: 1.6,         // perte de vitesse en virage × |vitesse latérale|
    /* Plancher relevé de 11 à 16 sur demande. À 11 (≈ 40 km/h) labourer un
       bord tombait à moins de la moitié de la vitesse de croisière : la
       descente s'arrêtait, on avait le temps de tout lire, et la sanction
       ressemblait à une punition. À 16 (≈ 58 km/h) on sent nettement le
       freinage sans que la partie se fige. C'est un écart assumé aux valeurs
       validées du prototype. */
    SPEED_FLOOR: 16,

    EDGE_MARGIN: 0.15,       // la neige profonde commence à HALF - marge
    EDGE_PUSH: 0.25,         // le joueur est repoussé vers la piste
    EDGE_VX_KEEP: 0.6,       // et sa vitesse latérale est coupée
    EDGE_BRAKE: 18,          // unités/s perdues tant qu'on laboure

    PENALTY_WRONG: 0.72,     // mauvaise réponse
    PENALTY_HIT: 0.5         // collision
  };

  /* Garde-fou : le piège n°1 du briefing. Si l'apogée du saut passe sous le
     seuil de franchissement, le saut ne peut mathématiquement pas sauver le
     joueur. On le vérifie au chargement plutôt que de le découvrir en jouant. */
  PHYSICS.JUMP_APEX = (PHYSICS.JUMP_V * PHYSICS.JUMP_V) / (2 * PHYSICS.GRAVITY);
  PHYSICS.JUMP_AIRTIME = (2 * PHYSICS.JUMP_V) / PHYSICS.GRAVITY;
  if (PHYSICS.JUMP_APEX <= PHYSICS.ROCK_CLEAR) {
    throw new Error(
      'Saut impossible : apogée ' + PHYSICS.JUMP_APEX.toFixed(2) +
      ' <= seuil rocher ' + PHYSICS.ROCK_CLEAR
    );
  }

  /* --- Difficulté de la descente ----------------------------------------
     Ne joue que sur la géométrie des pancartes : leur nombre et leur largeur,
     donc l'espace qui reste entre elles. Indépendant du niveau de contenu. */
  /* Le nombre de réponses proposées, et rien d'autre. Il n'y a plus de
     largeurs à régler : les pancartes sont TOUJOURS jointives et occupent
     toute la piste, donc deux réponses font 50 % chacune et trois en font 33 %.

     Le réglage précédent mélangeait deux difficultés — celle de la question et
     celle du geste — en rétrécissant les pancartes jusqu'à laisser des trous.
     Réviser du vocabulaire est un exercice d'apprentissage, pas d'adresse :
     rater une bonne réponse parce qu'on a mal visé n'apprend rien. Qui veut
     tester ses réflexes a le Freestyle et la Course pour ça. */
  var ANSWERS = {
    2: { panels: 2 },
    3: { panels: 3 }
  };

  /* Une pancarte s'élargit avec les mots longs, mais jamais au point de
     toucher sa voisine : il doit rester un trou visible en mode expert. */
  var PANEL = {
    GROW_PER_LETTER: 0.055,  // au-delà de six lettres
    GROW_FROM: 6,
    MAX_OF_SLOT: 0.94,       // plafond, fraction de la case
    PICK_RADIUS: 0.6,        // la réponse retenue est à moins de largeur × 0.6
    HEIGHT_RATIO: 0.5,       // hauteur = largeur × ratio, puis bornée
    /* Pancartes hautes et perchées : sur un téléphone tenu à la verticale,
       c'est la silhouette qui se repère en premier, bien avant que le texte
       ne devienne lisible. Plus tôt on voit qu'une porte arrive, plus on a de
       temps pour viser. */
    HEIGHT_MIN: 1.12,
    HEIGHT_MAX: 1.60,
    POST_HEIGHT: 1.30        // hauteur des poteaux sous la pancarte
  };

  /* --- Monde et caméra ---------------------------------------------------
     Réglés en comparant des captures au jeu de référence.

     CONVENTION D'AXES — la descente va vers -z, la caméra est derrière en +z.
     C'est l'orientation naturelle de Three.js, et c'est la seule qui place le
     +x du monde à droite de l'écran : avec une caméra en -z qui regarde vers
     +z, tout est en miroir et appuyer à droite fait partir à gauche.

     Le moteur de jeu, lui, raisonne en « mètres devant le joueur » : un objet
     a un z positif qui décroît jusqu'à 0 quand il arrive sur nous. C'est plus
     lisible pour les règles. La conversion se fait à un seul endroit, au
     moment de poser le maillage : position.z = -z. */
  var WORLD = {
    /* Récompense visuelle tous les 500 m. */
    MILESTONE: 500,
    Z_FAR: 122,              // les objets naissent à cette distance devant
    Z_CULL: -9,              // et sont recyclés une fois derrière
    FOG_DENSITY: 0.0112,     // exponentiel, raccordé à la couleur du ciel
    /* Brume allégée dans les modes à questions — et seulement là. La brume
       est la seconde moitié du problème de lecture : à 0,0112 une pancarte
       n'émerge qu'à soixante-quinze mètres. L'alléger la fait sortir du voile
       nettement plus tôt, sans toucher au Freestyle ni à la Course, qui
       tiennent leur atmosphère de cette brume. */
    FOG_DENSITY_QUIZ: 0.0082,
    GATE_SPACING: 62,        // un portique tous les N mètres
    GATE_LEAD: 44,           // on prépare le suivant à cette avance

    /* Dégagement autour d'une porte : aucun sapin ni rocher n'y apparaît.
       Repère d'échelle — une unité vaut un mètre, la piste fait 6,8 m de
       large et on descend à 20-25 m/s. 24 m devant, c'est donc environ une
       seconde de lecture sans avoir à esquiver ; 15 m derrière laissent le
       temps de se replacer après la porte. */
    GATE_SAFE_BEFORE: 24,
    GATE_SAFE_AFTER: 15,
    /* Crazy Mode : sillage derrière une porte de choix. C'est lui qui rend le
       changement de folie discret — on débouche sur une piste vierge, et on
       ne balaie que ce qui est assez loin pour ne pas se voir disparaître.

       26 m est un compromis mesuré : plus long, il ne restait plus de place
       pour les obstacles entre deux portes (le sillage de l'une touchait
       l'approche de la suivante) et la descente devenait vide. */
    CRAZY_CLEAR_AFTER: 26,

    TERRAIN_WIDTH: 74,       // largeur visible de la montagne, hors piste comprise
    TERRAIN_ROWS: 96,
    TERRAIN_COLS: 60,

    /* Relief : la piste ondule, elle n'est pas un plan. Amplitudes discrètes,
       le jeu doit rester lisible. */
    ROLL_AMP: 0.38,
    ROLL_LEN: 41,
    ROLL2_AMP: 0.17,
    ROLL2_LEN: 17.5,
    CROSS_AMP: 0.055,        // léger roulis latéral
    CROSS_LEN: 63,

    /* Bord de piste : un petit talus juste au-delà de la zone jouable, puis
       la montagne qui grimpe. C'est ce talus qui fait lire le couloir — sans
       lui la piste se dissout dans un champ de neige sans limite. */
    BERM_HEIGHT: 0.42,
    BERM_SPAN: 2.6,
    BANK_START: 3.0,         // distance au bord de piste où le flanc démarre
    BANK_HEIGHT: 6.0,        // hauteur atteinte au bout de BANK_SPAN
    BANK_SPAN: 21,           // plus les flancs montent vite, plus la vallée se
                             // referme et cache les sommets : réglage à l'œil
    GROOM_FREQ: 3.4          // stries de dameuse, lignes par unité
  };

  var CAMERA = {
    OFF_Y: 2.62,
    OFF_Z: 5.65,             // derrière le rider (la descente va vers -z)
    LOOK_AHEAD: 9.2,
    LOOK_Y: 1.15,
    FOLLOW_X: 0.72,          // la caméra ne suit qu'en partie le déport latéral
    STIFFNESS: 7.4,          // ressort : elle suit avec un léger retard
    ROLL: 0.115,             // et roule dans les virages, radians à pleine carre
    FOV_BASE: 57,
    FOV_MAX: 71,             // s'élargit à haute vitesse
    /* Le champ vertical est réglé pour un écran 16/9. Sur un téléphone tenu
       à la verticale, garder ce champ reviendrait à zoomer : on verrait le
       skieur en gros plan et plus rien de la piste. On repart donc du champ
       HORIZONTAL de référence pour recalculer le vertical, plafonné pour ne
       pas déformer les bords. */
    DESIGN_ASPECT: 16 / 9,
    /* Plafond baissé de 82 à 68 : ouvrir grand le champ sur un écran étroit
       rapetissait tout, et les pancartes devenaient illisibles jusqu'à ce
       qu'il soit trop tard pour réagir. Un champ plus serré agrandit la
       porte ; on voit moins large sur les côtés, mais sur un couloir de
       6,8 m de large il n'y a de toute façon rien à y voir. */
    FOV_PORTRAIT_MAX: 68,
    NEAR: 0.3,
    FAR: 460
  };

  var SUN = {
    AZIMUTH: 0.55,           // radians, sur la droite de la ligne de pente
    /* Le soleil doit tomber DANS le cadre, sinon ni disque ni rayons : avec
       une caméra piquée d'environ 6° et un demi-champ de 28°, le haut de
       l'image est vers 22° — au-delà, il n'y a plus rien à voir. */
    ELEVATION: 0.32,
    DIST: 88,
    INTENSITY: 2.6,
    HEMI: 0.70,              // le bleu du ciel remplit les ombres, sans les effacer
    SHADOW_MAP: 2048,
    SHADOW_HALF: 34,
    /* La tranche de profondeur de la carte d'ombre est serrée autour de la
       scène : trop large, la précision s'effondre et la neige se raye de
       bandes claires perpendiculaires au soleil. */
    SHADOW_NEAR: 34,
    SHADOW_FAR: 152,
    SHADOW_FOCUS_Z: 18   // le volume d'ombre est centré devant le joueur
  };

  AS.PALETTE = PALETTE;
  AS.DERIVED = DERIVED;
  AS.PHYSICS = PHYSICS;
  AS.ANSWERS = ANSWERS;
  AS.PANEL = PANEL;
  AS.WORLD = WORLD;
  AS.CAMERA = CAMERA;
  AS.SUN = SUN;
})((window.AlpineSchool = window.AlpineSchool || {}));
