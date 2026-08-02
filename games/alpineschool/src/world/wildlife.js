/* =========================================================================
   Alpine School — le lapin
   -------------------------------------------------------------------------
   Un lapin des neiges apparaît de loin en loin sur le bord de la piste. Il
   grignote, dresse les oreilles quand le skieur approche, puis détale vers le
   haut du talus avant qu'on arrive. On ne le rattrape jamais : c'est un
   détail de vie, pas un obstacle, et il n'entre dans aucun calcul de
   collision.

   Un seul lapin existe, réutilisé indéfiniment. Il est rare par construction
   — plusieurs centaines de mètres entre deux apparitions — parce qu'un lapin
   à chaque virage cesserait d'être une surprise.
   ========================================================================= */
(function (AS) {
  'use strict';

  var W = AS.WORLD;
  var HALF = AS.PHYSICS.HALF;
  var util = AS.util;
  var heightAt = AS.terrain.heightAt;

  /* Distance entre deux apparitions. Large, et volontairement irrégulière. */
  var GAP_MIN = 200;
  var GAP_MAX = 400;

  var ALERT_Z = 34;    // il redresse les oreilles
  /* Il détale à 19 m, soit près d'une seconde avant qu'on arrive à sa
     hauteur. Le déclencher plus tôt le ferait disparaître avant qu'on ait eu
     le temps de le voir ; plus tard, on aurait l'impression de lui rouler
     dessus. */
  var FLEE_Z = 19;

  var FUR = 0xd8c6ae;
  var BELLY = 0xfff7ec;
  var EAR_IN = 0xe2a49c;
  var EYE = 0x123047;

  function build() {
    var group = new THREE.Group();

    var fur = new THREE.MeshLambertMaterial({ color: FUR, flatShading: true });
    var belly = new THREE.MeshLambertMaterial({ color: BELLY, flatShading: true });
    var earIn = new THREE.MeshLambertMaterial({ color: EAR_IN, flatShading: true });
    var eye = new THREE.MeshLambertMaterial({ color: EYE });

    function add(parent, geo, mat, x, y, z) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    }

    /* Corps : une sphère écrasée, assise sur les pattes arrière. */
    var body = add(group, new THREE.SphereGeometry(0.19, 8, 6), fur, 0, 0.17, 0);
    body.scale.set(1, 0.92, 1.25);

    add(group, new THREE.SphereGeometry(0.085, 7, 5), belly, 0, 0.12, -0.14);

    /* Pattes arrière, posées à plat — c'est ce qui donne la posture assise. */
    [-1, 1].forEach(function (s) {
      var foot = add(group, new THREE.BoxGeometry(0.07, 0.05, 0.17), fur, s * 0.10, 0.03, 0.04);
      foot.rotation.y = s * 0.08;
    });

    /* Tête : groupe séparé, elle tourne pour regarder autour. */
    var head = new THREE.Group();
    head.position.set(0, 0.30, -0.15);
    group.add(head);

    var skull = add(head, new THREE.SphereGeometry(0.115, 8, 6), fur, 0, 0, 0);
    skull.scale.set(1, 1, 1.15);
    add(head, new THREE.SphereGeometry(0.045, 6, 5), belly, 0, -0.04, -0.10);
    add(head, new THREE.SphereGeometry(0.022, 6, 5), eye, -0.07, 0.02, -0.07);
    add(head, new THREE.SphereGeometry(0.022, 6, 5), eye, 0.07, 0.02, -0.07);

    /* Oreilles : deux groupes pivotant à leur base, pour qu'elles se
       redressent d'un coup quand il repère le skieur. */
    var ears = [];
    [-1, 1].forEach(function (s) {
      var pivot = new THREE.Group();
      pivot.position.set(s * 0.055, 0.09, 0.01);
      head.add(pivot);
      var shell = add(pivot, new THREE.BoxGeometry(0.055, 0.22, 0.032), fur, 0, 0.11, 0);
      shell.scale.set(1, 1, 1);
      add(pivot, new THREE.BoxGeometry(0.03, 0.16, 0.018), earIn, 0, 0.10, -0.019);
      pivot.userData.side = s;
      ears.push(pivot);
    });

    /* Queue en pompon. */
    add(group, new THREE.SphereGeometry(0.062, 7, 5), belly, 0, 0.20, 0.20);

    group.visible = false;
    /* Nettement plus gros que nature — un lièvre variable plutôt qu'un lapin
       de garenne. À la distance où on le croise vraiment, entre trente et
       vingt mètres, un animal à l'échelle exacte ne ferait qu'une dizaine de
       pixels et personne ne le remarquerait. */
    group.scale.setScalar(1.75);
    return { group: group, head: head, ears: ears };
  }

  function Wildlife() {
    var built = build();
    this.group = built.group;
    this.head = built.head;
    this.ears = built.ears;

    this.active = false;
    this.state = 'idle';
    this.x = 0;
    this.z = 0;
    this.side = 1;
    this.t = 0;
    this.hop = 0;
    this.lookTimer = 0;
    this.lookTarget = 0;
    this.look = 0;
    this.nextSpawn = util.randRange(120, 260);
    this.travelled = 0;
  }

  Wildlife.prototype.reset = function () {
    this.active = false;
    this.group.visible = false;
    this.travelled = 0;
    this.nextSpawn = util.randRange(120, 260);
  };

  Wildlife.prototype.spawn = function () {
    this.side = Math.random() < 0.5 ? -1 : 1;
    /* Juste au-delà du bord damé : assez près pour qu'on le voie, assez loin
       pour qu'on ne puisse jamais le percuter. */
    this.x = this.side * (HALF + util.randRange(1.1, 3.2));
    this.z = W.Z_FAR - util.randRange(0, 12);
    this.state = 'idle';
    this.t = 0;
    this.hop = 0;
    this.look = 0;
    this.lookTimer = util.randRange(0.4, 1.2);
    this.lookTarget = 0;
    this.active = true;
    this.group.visible = true;
  };

  Wildlife.prototype.update = function (dt, scroll, travelled) {
    if (!this.active) {
      this.travelled += travelled;
      if (this.travelled >= this.nextSpawn) {
        this.travelled = 0;
        this.nextSpawn = util.randRange(GAP_MIN, GAP_MAX);
        this.spawn();
      }
      return;
    }

    this.t += dt;
    this.z -= travelled;

    if (this.z < W.Z_CULL - 6) {
      this.active = false;
      this.group.visible = false;
      return;
    }

    if (this.state === 'idle' && this.z < ALERT_Z) this.state = 'alert';
    if (this.state !== 'flee' && this.z < FLEE_Z) {
      this.state = 'flee';
      this.hop = 0;
    }

    var earTarget = 0.55;   // au repos, les oreilles retombent en arrière
    var lift = 0;

    if (this.state === 'idle') {
      /* Il broute, relève la tête, regarde ailleurs. Le hasard est borné :
         un mouvement toutes les demi-secondes au plus. */
      this.lookTimer -= dt;
      if (this.lookTimer <= 0) {
        this.lookTimer = util.randRange(0.5, 1.6);
        this.lookTarget = util.randRange(-0.7, 0.7);
      }
      earTarget = 0.5 + Math.sin(this.t * 2.1) * 0.08;
      lift = Math.abs(Math.sin(this.t * 1.6)) * 0.012;   // respiration
    } else if (this.state === 'alert') {
      /* Il s'immobilise, oreilles droites. Le corps regarde déjà la piste :
         la tête n'a plus qu'à suivre le skieur du regard, très légèrement. */
      this.lookTarget = 0.18;
      earTarget = 0.02;
      lift = 0.05;
    } else {
      /* Fuite : bonds vers le haut du talus, dos tourné à la piste. */
      this.hop += dt;
      /* Départ vif puis allure de croisière : un bond franc se lit mieux
         qu'une glissade régulière. */
      var speed = 7.2 - Math.min(this.hop, 0.6) * 2.5;
      this.x += this.side * speed * dt;
      this.z += 2.2 * dt;
      /* En fuite il jette un œil derrière lui — mais le corps, lui, file
         bien dans le sens de la course. */
      this.lookTarget = -0.45;
      earTarget = 0.30;
      lift = Math.abs(Math.sin(this.hop * 10.5)) * 0.34;
    }

    this.look = util.damp(this.look, this.lookTarget, this.state === 'alert' ? 14 : 5, dt);
    this.head.rotation.y = this.look;

    for (var i = 0; i < this.ears.length; i++) {
      var ear = this.ears[i];
      ear.rotation.x = util.damp(ear.rotation.x, earTarget, 12, dt);
      ear.rotation.z = ear.userData.side * (0.10 + earTarget * 0.30);
    }

    var ground = heightAt(this.x, this.z + scroll);
    this.group.position.set(this.x, ground + lift, -this.z);

    /* ORIENTATION — le modèle a la tête vers -z. Une rotation θ autour de y
       envoie cette tête sur (-sinθ, 0, -cosθ).

       Au repos, il regarde la piste, donc vers -side :
         -sinθ = -side  →  θ = +side · π/2
       En fuite, il court vers l'extérieur, donc vers +side :
         -sinθ = +side  →  θ = -side · π/2

       Les deux sont exactement opposés : c'est le demi-tour qu'il fait en
       détalant. L'ancien code avait les deux signes inversés, si bien qu'il
       nous tournait le dos en nous observant puis fuyait à reculons. */
    var facing = this.state === 'flee'
      ? -this.side * Math.PI * 0.5
      : this.side * Math.PI * 0.5;
    this.group.rotation.y = util.damp(this.group.rotation.y, facing, 6, dt);
  };

  /* =======================================================================
     L'OISEAU
     -----------------------------------------------------------------------
     Perché sur un sapin du bord de piste. Il attend, remue la tête, puis
     s'envole quand on approche — de deux façons différentes, tirées au sort :

       'cross'  il traverse la piste en diagonale, devant le skieur ;
       'away'   il file vers l'extérieur, en s'élevant le long du flanc.

     Deux trajectoires suffisent à faire croire à un comportement : on ne sait
     jamais laquelle on va avoir, donc on regarde.
     ======================================================================= */

  var BIRD_GAP_MIN = 240;
  var BIRD_GAP_MAX = 470;
  /* Il décolle de loin : on doit avoir le temps de suivre toute la
     trajectoire, pas d'apercevoir un départ au ras de l'écran. */
  var BIRD_FLY_Z = 46;

  var BIRD_BODY = 0x3f5d7a;
  var BIRD_BELLY = 0xf2e3cf;
  var BIRD_BEAK = 0xe8a33c;

  function buildBird() {
    var group = new THREE.Group();
    var body = new THREE.MeshLambertMaterial({ color: BIRD_BODY, flatShading: true });
    var belly = new THREE.MeshLambertMaterial({ color: BIRD_BELLY, flatShading: true });
    var beak = new THREE.MeshLambertMaterial({ color: BIRD_BEAK, flatShading: true });
    var eye = new THREE.MeshLambertMaterial({ color: 0x101c28 });

    function add(parent, geo, mat, x, y, z) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    }

    var torso = add(group, new THREE.SphereGeometry(0.13, 8, 6), body, 0, 0, 0);
    torso.scale.set(1, 0.95, 1.35);
    add(group, new THREE.SphereGeometry(0.075, 7, 5), belly, 0, -0.04, -0.05);

    var head = add(group, new THREE.SphereGeometry(0.082, 7, 6), body, 0, 0.10, -0.13);
    add(group, new THREE.ConeGeometry(0.030, 0.10, 5), beak, 0, 0.09, -0.23).rotation.x = -Math.PI / 2;
    add(group, new THREE.SphereGeometry(0.017, 5, 4), eye, -0.05, 0.13, -0.17);
    add(group, new THREE.SphereGeometry(0.017, 5, 4), eye, 0.05, 0.13, -0.17);

    /* Queue en éventail. */
    var tail = add(group, new THREE.BoxGeometry(0.10, 0.022, 0.20), body, 0, 0.01, 0.19);
    tail.rotation.x = -0.28;

    /* Ailes : deux groupes pivotant à l'épaule, pour le battement. */
    var wings = [];
    [-1, 1].forEach(function (s) {
      var pivot = new THREE.Group();
      pivot.position.set(s * 0.09, 0.03, 0);
      group.add(pivot);
      var w = add(pivot, new THREE.BoxGeometry(0.24, 0.022, 0.15), body, s * 0.13, 0, 0);
      w.rotation.z = s * 0.05;
      pivot.userData.side = s;
      wings.push(pivot);
    });

    group.visible = false;
    /* Même arbitrage que pour le lapin : à l'échelle d'un vrai oiseau, on
       n'aurait qu'un point sombre de quelques pixels. Un grand corbeau se
       repère, et c'est le mouvement qui compte, pas l'exactitude. */
    group.scale.setScalar(3.1);
    return { group: group, head: head, wings: wings };
  }

  function Bird() {
    var built = buildBird();
    this.group = built.group;
    this.head = built.head;
    this.wings = built.wings;

    this.active = false;
    this.state = 'perched';
    this.style = 'away';
    this.side = 1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.t = 0;
    this.flap = 0;
    this.lookTimer = 0;
    this.look = 0;
    this.lookTarget = 0;
    this.travelled = 0;
    this.nextSpawn = util.randRange(150, 300);
  }

  Bird.prototype.reset = function () {
    this.active = false;
    this.group.visible = false;
    this.travelled = 0;
    this.nextSpawn = util.randRange(150, 300);
  };

  Bird.prototype.spawn = function () {
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.style = Math.random() < 0.5 ? 'cross' : 'away';
    /* Posé au sommet d'un sapin de bordure : assez haut pour se détacher sur
       le ciel, assez près pour qu'on le distingue. */
    this.x = this.side * util.randRange(HALF + 2.8, HALF + 6.5);
    this.z = W.Z_FAR - util.randRange(0, 10);
    this.y = 2.9 + Math.random() * 0.7;
    this.vx = this.vy = this.vz = 0;
    this.state = 'perched';
    this.t = 0;
    this.flap = 0;
    this.burst = 0;
    this.look = 0;
    this.lookTarget = 0;
    this.lookTimer = util.randRange(0.3, 1.0);
    this.active = true;
    this.group.visible = true;
  };

  Bird.prototype.update = function (dt, scroll, travelled) {
    if (!this.active) {
      this.travelled += travelled;
      if (this.travelled >= this.nextSpawn) {
        this.travelled = 0;
        this.nextSpawn = util.randRange(BIRD_GAP_MIN, BIRD_GAP_MAX);
        this.spawn();
      }
      return;
    }

    this.t += dt;
    this.z -= travelled;

    if (this.z < W.Z_CULL - 14 || this.y > 34 || Math.abs(this.x) > 60) {
      this.active = false;
      this.group.visible = false;
      return;
    }

    if (this.state === 'perched' && this.z < BIRD_FLY_Z) {
      this.state = 'flying';
      this.flap = 0;
      if (this.style === 'cross') {
        /* Il coupe devant, vite. Le `vz` positif le fait FUIR vers l'amont
           pendant que la piste défile : à l'écran il file loin devant le
           skieur au lieu de lui passer sous le nez, ce qui est autrement plus
           crédible pour un oiseau qui décampe. */
        this.vx = -this.side * util.randRange(9, 13);
        this.vy = util.randRange(2.6, 3.8);
        this.vz = util.randRange(7, 12);
      } else {
        this.vx = this.side * util.randRange(10, 15);
        this.vy = util.randRange(3.6, 5.0);
        this.vz = util.randRange(4, 9);
      }
      /* Deux ou trois battements secs au décollage : c'est le coup d'aile
         initial qui fait « oiseau » plutôt que « objet qui glisse ». */
      this.burst = 0.55;
    }

    var flapSpeed;
    if (this.state === 'perched') {
      this.lookTimer -= dt;
      if (this.lookTimer <= 0) {
        this.lookTimer = util.randRange(0.4, 1.3);
        this.lookTarget = util.randRange(-0.9, 0.9);
      }
      flapSpeed = 0;
      this.group.position.set(this.x, this.y + Math.sin(this.t * 2.4) * 0.012, -this.z);
      this.group.rotation.z = 0;
    } else {
      this.flap += dt;
      if (this.burst > 0) {
        /* Poussée de départ : il s'arrache, puis se laisse porter. */
        this.burst -= dt;
        this.vy += 5.5 * dt;
        this.vx *= 1 + 0.9 * dt;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.z += this.vz * dt;
      this.vy += 0.55 * dt;                 // il continue de monter
      this.lookTarget = 0;
      flapSpeed = this.burst > 0 ? 26 : 15;
      this.group.position.set(this.x, this.y, -this.z);
      /* Il s'incline dans sa trajectoire, comme un vrai oiseau qui vire. */
      this.group.rotation.z = util.damp(this.group.rotation.z, -Math.sign(this.vx) * 0.42, 6, dt);
    }

    this.look = util.damp(this.look, this.lookTarget, 7, dt);
    this.head.rotation.y = this.look;

    /* Le battement : les deux ailes montent et descendent en opposition au
       corps. À l'arrêt, elles se replient. */
    var beat = flapSpeed ? Math.sin(this.flap * flapSpeed) * 0.85 : -0.12;
    for (var i = 0; i < this.wings.length; i++) {
      this.wings[i].rotation.z = this.wings[i].userData.side * beat;
    }

    /* Orientation : il regarde là où il va.

       Le modèle a le bec vers -z. Une rotation de θ autour de y envoie ce
       -z sur (-sinθ, 0, -cosθ).

       Attention au double changement de repère : `vz` compte les mètres
       DEVANT, alors que la position à l'écran vaut -z. La vitesse à l'écran
       est donc (vx, -vz), et l'alignement demande sinθ = -vx, cosθ = vz,
       soit atan2(-vx, vz). Oublier l'un des deux signes fait voler l'oiseau
       à reculons, la queue la première. */
    var facing = this.state === 'perched'
      ? this.side * Math.PI * 0.5 + this.look * 0.3
      : Math.atan2(-this.vx, this.vz);
    this.group.rotation.y = util.damp(this.group.rotation.y, facing, 7, dt);
  };

  /* =======================================================================
     LA FOULE DU MODE LAPIN
     -----------------------------------------------------------------------
     Pendant les cent mètres du mode lapin, les bas-côtés se couvrent de
     lapins assis qui regardent passer. Ils sont instanciés et immobiles : un
     seul appel de dessin pour la trentaine, et l'effet tient au nombre, pas à
     l'animation.
     ======================================================================= */

  var CROWD = 30;

  function BunnyCrowd() {
    this.mesh = new THREE.InstancedMesh(
      AS.models.buildBunnyMesh(),
      AS.models.decorMaterial(),
      CROWD
    );
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.visible = false;

    this.items = [];
    this._dummy = new THREE.Object3D();
    for (var i = 0; i < CROWD; i++) {
      this.items.push({ x: 0, z: 0, spin: 0, scale: 1 });
      this.place(this.items[i], true);
    }
    this.on = false;
  }

  BunnyCrowd.prototype.place = function (it, initial) {
    var side = Math.random() < 0.5 ? -1 : 1;
    it.x = side * (HALF + util.randRange(0.9, 7));
    it.z = initial
      ? util.randRange(W.Z_CULL, W.Z_FAR)
      : W.Z_FAR + util.randRange(2, 18);
    /* Même règle que pour le lapin isolé : la tête vers la piste. */
    it.spin = side * Math.PI / 2 + util.randRange(-0.5, 0.5);
    it.scale = util.randRange(1.2, 1.9);
  };

  BunnyCrowd.prototype.setActive = function (on) {
    if (on === this.on) return;
    this.on = on;
    this.mesh.visible = on;
    if (on) {
      for (var i = 0; i < this.items.length; i++) this.place(this.items[i], true);
    }
  };

  BunnyCrowd.prototype.update = function (scroll, travelled) {
    if (!this.on) return;
    var d = this._dummy;
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      it.z -= travelled;
      if (it.z < W.Z_CULL) this.place(it, false);
      d.position.set(it.x, heightAt(it.x, it.z + scroll), -it.z);
      d.rotation.set(0, it.spin, 0);
      d.scale.setScalar(it.scale);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  };

  AS.wildlife = { Wildlife: Wildlife, Bird: Bird, BunnyCrowd: BunnyCrowd };
})((window.AlpineSchool = window.AlpineSchool || {}));
