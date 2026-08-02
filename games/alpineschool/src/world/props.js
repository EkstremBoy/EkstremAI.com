/* =========================================================================
   Alpine School — obstacles sur la piste
   -------------------------------------------------------------------------
   Sapins et rochers qui comptent vraiment. Réservoir d'objets réutilisés : on
   n'instancie rien pendant la partie, on rend seulement visibles ceux dont on
   a besoin.

   Règle de franchissement : un rocher passe sous les skis si le joueur est
   assez haut, un sapin jamais. Le seuil du rocher est bien en dessous de
   l'apogée du saut (vérifié dans constants.js), donc un saut bien synchronisé
   sauve toujours.
   ========================================================================= */
(function (AS) {
  'use strict';

  var W = AS.WORLD;
  var P = AS.PHYSICS;
  var heightAt = AS.terrain.heightAt;

  var POOL = 32;

  function Props() {
    this.items = [];
    this.group = new THREE.Group();

    var pineGeos = [AS.models.buildPine(4242), AS.models.buildPine(9191)];
    var rockGeos = [AS.models.buildRock(11), AS.models.buildRock(29), AS.models.buildRock(53)];
    var logGeo = AS.models.buildLog();
    var bumpGeo = AS.models.buildBump();
    var hollowGeo = AS.models.buildHollowLog();
    var runnerGeo = AS.models.buildBunnyMesh();
    var boostGeo = AS.models.buildBoost();
    var mat = AS.models.decorMaterial();

    for (var i = 0; i < POOL; i++) {
      var pine = new THREE.Mesh(pineGeos[i % 2], mat);
      var rock = new THREE.Mesh(rockGeos[i % 3], mat);
      var log = new THREE.Mesh(logGeo, mat);
      var bump = new THREE.Mesh(bumpGeo, mat);
      var hollow = new THREE.Mesh(hollowGeo, mat);
      var runner = new THREE.Mesh(runnerGeo, mat);
      var boost = new THREE.Mesh(boostGeo, mat);
      pine.castShadow = rock.castShadow = log.castShadow = true;
      bump.castShadow = false;          // une bosse de neige sur la neige
      bump.receiveShadow = true;
      hollow.castShadow = runner.castShadow = true;
      hollow.frustumCulled = runner.frustumCulled = false;
      runner.visible = false;
      runner.scale.setScalar(1.6);
      /* Les chevrons sont peints sur la neige : ils ne projettent pas
         d'ombre, sinon ils auraient l'air posés dessus. */
      boost.castShadow = false;
      boost.receiveShadow = false;
      boost.visible = false;
      boost.frustumCulled = false;
      pine.visible = rock.visible = log.visible = bump.visible = hollow.visible = false;
      pine.frustumCulled = rock.frustumCulled = false;
      log.frustumCulled = bump.frustumCulled = false;
      this.group.add(pine, rock, log, bump, hollow, runner, boost);

      this.items.push({
        active: false,
        hit: false,
        type: 'tree',
        x: 0,
        z: 0,
        scale: 1,
        spanHalf: P.HALF,
        pine: pine,
        rock: rock,
        log: log,
        bump: bump,
        hollow: hollow,
        runner: runner,
        boost: boost
      });
    }
  }

  Props.prototype.meshFor = function (it) {
    if (it.type === 'rock') return it.rock;
    if (it.type === 'log') return it.log;
    if (it.type === 'bump') return it.bump;
    if (it.type === 'hollow') return it.hollow;
    if (it.type === 'runner') return it.runner;
    if (it.type === 'boost') return it.boost;
    return it.pine;
  };

  Props.prototype.reset = function () {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      it.active = false;
      it.hit = false;
      it.pine.visible = false;
      it.rock.visible = false;
      it.log.visible = false;
      it.bump.visible = false;
      it.hollow.visible = false;
      it.runner.visible = false;
      it.boost.visible = false;
    }
  };

  Props.prototype.free = function () {
    for (var i = 0; i < this.items.length; i++) {
      if (!this.items[i].active) return this.items[i];
    }
    return null;
  };

  /* rockChance : la part de rochers. En freestyle on en met peu (le saut est
     une respiration, pas la mécanique principale) ; dans les modes à
     questions les obstacles sont rares, autant qu'ils soient franchissables. */
  Props.prototype.spawn = function (z, rockChance, scaleMul, lowClear) {
    var it = this.free();
    if (!it) return null;
    var isRock = Math.random() < rockChance;
    it.active = true;
    it.hit = false;
    /* Un sapin ne se saute jamais — sauf quand il est minuscule. C'est le
       seul cas où la règle cède, et elle cède sur la taille, pas sur le
       principe. */
    it.lowClear = !!lowClear;
    it.type = isRock ? 'rock' : 'tree';
    it.x = (Math.random() * 2 - 1) * (P.HALF - 0.45);
    it.z = z;
    it.scale = (isRock ? (0.85 + Math.random() * 0.75) : (0.80 + Math.random() * 0.5))
      * (scaleMul || 1);
    it.pine.visible = !isRock;
    it.rock.visible = isRock;
    it.log.visible = false;
    it.bump.visible = false;
    it.hollow.visible = false;
    it.runner.visible = false;
    return it;
  };

  /* Billot couché en travers de la piste. Il se saute — sa hauteur de
     franchissement est celle d'un rocher.

     `spanHalf` est sa demi-largeur en unités monde. À HALF il barre tout et
     il FAUT sauter ; plus étroit, il laisse un passage sur le côté et le saut
     devient facultatif. C'est cette alternance qui empêche la folie « Billots »
     de se réduire à un métronome. */
  Props.prototype.spawnLog = function (z, spanHalf, centre) {
    var it = this.free();
    if (!it) return null;
    it.active = true;
    it.hit = false;
    it.type = 'log';
    it.spanHalf = spanHalf === undefined ? P.HALF : spanHalf;
    it.x = centre || 0;
    it.z = z;
    it.scale = 1;
    it.pine.visible = false;
    it.rock.visible = false;
    it.bump.visible = false;
    it.hollow.visible = false;
    it.runner.visible = false;
    it.log.visible = true;
    /* La géométrie est construite pleine largeur : on l'écrase en x pour
       obtenir la portée demandée. */
    it.log.scale.set(it.spanHalf / P.HALF, 1, 1);
    return it;
  };

  /* Bosse de neige. Elle ne coûte pas de vie : elle FREINE. En champ de
     bosses, en prendre quelques-unes est un choix — on perd de la vitesse,
     donc on tient plus longtemps. */
  Props.prototype.spawnBump = function (z) {
    var it = this.free();
    if (!it) return null;
    it.active = true;
    it.hit = false;
    it.type = 'bump';
    it.x = (Math.random() * 2 - 1) * (P.HALF - 0.7);
    it.z = z;
    it.scale = 0.85 + Math.random() * 0.7;
    it.pine.visible = false;
    it.rock.visible = false;
    it.log.visible = false;
    it.hollow.visible = false;
    it.runner.visible = false;
    it.bump.visible = true;
    return it;
  };

  /* Tronc creux du mode lapin : il barre toute la piste, mais son ouverture
     centrale se traverse. Viser le trou rapporte des points ; le rater
     revient à percuter un billot. */
  var HOLLOW_HOLE = 0.62;

  Props.prototype.spawnHollow = function (z) {
    var it = this.free();
    if (!it) return null;
    it.active = true;
    it.hit = false;
    it.type = 'hollow';
    it.spanHalf = P.HALF;
    it.x = 0;
    it.z = z;
    it.scale = 1;
    it.pine.visible = false;
    it.rock.visible = false;
    it.log.visible = false;
    it.bump.visible = false;
    it.runner.visible = false;
    it.hollow.visible = true;
    return it;
  };

  /* Renvoie true si le joueur passe DANS le trou. Séparé de collide() parce
     que c'est une récompense, pas un accident. */
  Props.prototype.throughHollow = function (playerX, height) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (!it.active || it.hit || it.type !== 'hollow') continue;
      if (it.z > P.HIT_Z_FAR || it.z < P.HIT_Z_NEAR) continue;
      if (Math.abs(playerX - it.x) >= HOLLOW_HOLE) continue;
      if (height >= 0.8) continue;      // par-dessus, ça ne compte pas
      it.hit = true;
      return it;
    }
    return null;
  };

  /* Lapin qui traverse la piste. Dangereux — il coûte une vie — mais facile
     à éviter : il part d'un bord, avance lentement, et on le voit venir de
     loin. C'est un obstacle mobile, donc lisible : on anticipe sa trajectoire
     au lieu de mémoriser une position. */
  Props.prototype.spawnRunner = function (z) {
    var it = this.free();
    if (!it) return null;
    var side = Math.random() < 0.5 ? -1 : 1;
    it.active = true;
    it.hit = false;
    it.type = 'runner';
    it.x = side * (P.HALF + 1.2);
    it.vx = -side * (1.5 + Math.random() * 1.1);
    it.z = z;
    it.scale = 1;
    it.hop = Math.random() * 6;
    it.pine.visible = false;
    it.rock.visible = false;
    it.log.visible = false;
    it.bump.visible = false;
    it.hollow.visible = false;
    it.runner.visible = true;
    return it;
  };

  /* Vide tout ce qui est devant le joueur. Appelé quand une folie change :
     les obstacles déjà en vol ont été posés selon l'ancienne règle, et sans
     ce nettoyage la nouvelle folie ne se verrait qu'au bout de cent mètres —
     soit une fois expirée. */
  /* Tremplin de vitesse du mode Course. Il ne blesse pas : on le vise. */
  Props.prototype.spawnBoost = function (z, x) {
    var it = this.free();
    if (!it) return null;
    it.active = true;
    it.hit = false;
    it.type = 'boost';
    it.x = x;
    it.z = z;
    it.scale = 1;
    it.pine.visible = false;
    it.rock.visible = false;
    it.log.visible = false;
    it.bump.visible = false;
    it.hollow.visible = false;
    it.runner.visible = false;
    it.boost.visible = true;
    return it;
  };

  /* Tremplin franchi ce tour-ci. Comme les bosses : hors du circuit des
     collisions, puisque c'est un gain et non une sanction. */
  Props.prototype.hitBoost = function (playerX, height) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (!it.active || it.hit || it.type !== 'boost') continue;
      if (it.z > P.HIT_Z_FAR || it.z < P.HIT_Z_NEAR) continue;
      if (Math.abs(it.x - playerX) >= 1.05) continue;
      /* En l'air on passe au-dessus : le tremplin se prend skis à terre. */
      if (height >= 0.5) continue;
      it.hit = true;
      it.boost.visible = false;
      it.active = false;
      return it;
    }
    return null;
  };

  Props.prototype.clearAhead = function (fromZ) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (!it.active || it.z < fromZ) continue;
      it.active = false;
      it.pine.visible = false;
      it.rock.visible = false;
      it.log.visible = false;
      it.bump.visible = false;
      it.hollow.visible = false;
      it.runner.visible = false;
    }
  };

  /* Y a-t-il déjà un obstacle dans cette tranche de profondeur ? */
  Props.prototype.occupied = function (lo, hi) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.active && it.z >= lo && it.z <= hi) return true;
    }
    return false;
  };

  /* Vide une tranche de tout obstacle. Appelé quand une porte apparaît : elle
     peut naître au milieu de sapins déjà posés, et on ne veut ni sapin ni
     rocher dans l'approche d'une question. */
  Props.prototype.clearZone = function (lo, hi) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (!it.active || it.z < lo || it.z > hi) continue;
      it.active = false;
      it.pine.visible = false;
      it.rock.visible = false;
      it.log.visible = false;
      it.bump.visible = false;
      it.hollow.visible = false;
      it.runner.visible = false;
    }
  };

  Props.prototype.update = function (scroll, travelled, dt) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (!it.active) continue;
      it.z -= travelled;

      if (it.type === 'runner') {
        it.x += it.vx * (dt || 0);
        it.hop += (dt || 0) * 11;
        /* Sorti de l'autre côté : il a traversé, il ne menace plus. */
        if (Math.abs(it.x) > P.HALF + 2.2) {
          it.active = false;
          it.runner.visible = false;
          continue;
        }
      }
      if (it.z < W.Z_CULL) {
        it.active = false;
        it.pine.visible = false;
        it.rock.visible = false;
        it.log.visible = false;
        it.bump.visible = false;
        it.hollow.visible = false;
        it.runner.visible = false;
        it.boost.visible = false;
        continue;
      }
      var mesh = this.meshFor(it);
      mesh.position.set(it.x, heightAt(it.x, it.z + scroll), -it.z);
      if (it.type === 'log') mesh.scale.set(it.spanHalf / P.HALF, 1, 1);
      else if (it.type === 'runner') {
        mesh.scale.setScalar(1.6);
        mesh.position.y += Math.abs(Math.sin(it.hop)) * 0.28;
        mesh.rotation.y = it.vx > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else mesh.scale.setScalar(it.scale);
    }
  };

  /* Renvoie l'obstacle touché, ou null. `height` est la hauteur du joueur
     au-dessus de la neige. */
  Props.prototype.collide = function (playerX, height) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (!it.active || it.hit) continue;
      if (it.type === 'bump' || it.type === 'boost') continue;
      if (it.z > P.HIT_Z_FAR || it.z < P.HIT_Z_NEAR) continue;
      /* Le billot occupe une largeur : dans son emprise il faut sauter, en
         dehors il n'existe pas. Les autres obstacles s'esquivent au mètre. */
      if (it.type === 'hollow') {
        /* Dans l'ouverture, il n'y a rien à percuter. */
        if (Math.abs(it.x - playerX) < HOLLOW_HOLE) continue;
        if (Math.abs(it.x - playerX) >= it.spanHalf) continue;
      } else {
        var reach = it.type === 'log' ? it.spanHalf
          : (it.type === 'runner' ? 0.46 : P.HIT_X);
        if (Math.abs(it.x - playerX) >= reach) continue;
      }
      var clear = (it.type === 'tree' && !it.lowClear) ? P.TREE_CLEAR : P.ROCK_CLEAR;
      if (height >= clear) continue;
      it.hit = true;
      return it;
    }
    return null;
  };

  /* Bosses touchées ce tour-ci. Séparé des collisions : ça ne coûte pas de
     vie, ça coûte de la vitesse. */
  Props.prototype.hitBump = function (playerX, height) {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (!it.active || it.hit || it.type !== 'bump') continue;
      if (it.z > P.HIT_Z_FAR || it.z < P.HIT_Z_NEAR) continue;
      if (Math.abs(it.x - playerX) >= 0.75) continue;
      if (height >= 0.42) continue;
      it.hit = true;
      return it;
    }
    return null;
  };

  AS.props = { Props: Props };
})((window.AlpineSchool = window.AlpineSchool || {}));
