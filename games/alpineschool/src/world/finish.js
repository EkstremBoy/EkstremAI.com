/* =========================================================================
   Alpine School — la ligne d'arrivée du mode Course
   -------------------------------------------------------------------------
   Trois objets qui n'existent que dans ce mode, et qu'on ne pose qu'une fois
   par descente : le portique à damier, le chalet posé à côté, et la fumée de
   sa cheminée.

   Ils ne passent pas par la réserve d'obstacles parce qu'ils ne se recyclent
   jamais : il y a exactement une arrivée par course. Leur position se calcule
   comme celle de tout le reste — `z` compte les mètres restants, et la scène
   les place à `-z`.
   ========================================================================= */
(function (AS) {
  'use strict';

  var P = AS.PHYSICS;
  var W = AS.WORLD;
  var heightAt = AS.terrain.heightAt;

  var PUFFS = 7;

  function Finish() {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.z = 0;
    this.armed = false;

    var mat = AS.models.decorMaterial();

    this.arch = new THREE.Mesh(AS.models.buildFinishArch(P.HALF), mat);
    this.arch.castShadow = true;
    this.arch.frustumCulled = false;

    this.chalet = new THREE.Mesh(AS.models.buildChalet(), mat);
    this.chalet.castShadow = true;
    this.chalet.frustumCulled = false;

    this.group.add(this.arch, this.chalet);

    /* La fumée : quelques boules qui montent, grossissent et s'effacent. Un
       matériau par bouffée — c'est le seul moyen d'avoir des opacités
       différentes, et sept matériaux ne coûtent rien. */
    var puffGeo = new THREE.IcosahedronGeometry(0.34, 0);
    this.puffs = [];
    for (var i = 0; i < PUFFS; i++) {
      var pm = new THREE.MeshBasicMaterial({
        color: 0xF2F6FA, transparent: true, opacity: 0, depthWrite: false
      });
      var puff = new THREE.Mesh(puffGeo, pm);
      puff.frustumCulled = false;
      this.group.add(puff);
      this.puffs.push({ mesh: puff, mat: pm, t: i / PUFFS });
    }
  }

  /* Pose l'arrivée à `z` mètres devant. Le chalet se met sur le côté droit,
     hors de la piste : il doit se voir grandir sans jamais être dans le
     chemin. */
  Finish.prototype.place = function (z) {
    this.z = z;
    this.armed = true;
    this.group.visible = true;
    this.arch.position.set(0, 0, 0);
    /* Bien au-delà de la ligne : le dérapage emporte encore une quarantaine
       de mètres, et c'est vers le chalet qu'on veut regarder en s'immobilisant.
       Placé plus près, il sortait du cadre au moment de l'arrêt. Sa façade est
       tournée vers la piste. */
    this.chalet.position.set(P.HALF + 6.2, 0, -52);
    this.chalet.rotation.y = -0.5;
  };

  Finish.prototype.reset = function () {
    this.armed = false;
    this.group.visible = false;
    this.z = 0;
    for (var i = 0; i < this.puffs.length; i++) {
      this.puffs[i].t = i / this.puffs.length;
      this.puffs[i].mat.opacity = 0;
    }
  };

  Finish.prototype.update = function (scroll, travelled, dt) {
    if (!this.armed) return;
    this.z -= travelled;

    /* On garde l'ensemble en scène longtemps après la ligne : le joueur
       dérape encore devant, le portique doit rester derrière lui et le chalet,
       qui est cinquante mètres plus bas, devant. */
    if (this.z < W.Z_CULL - 130) {
      this.reset();
      return;
    }

    var y = heightAt(0, this.z + scroll);
    this.group.position.set(0, y, -this.z);

    /* Le chalet suit le relief à son propre endroit, sinon il flotte ou
       s'enterre dès que la piste ondule. */
    var cx = this.chalet.position.x;
    this.chalet.position.y = heightAt(cx, this.z + scroll) - y + 0.1;

    /* La cheminée est à un coin du chalet, et le chalet est tourné : sans
       appliquer cette rotation, la fumée sortait à côté du toit. */
    var cos = Math.cos(this.chalet.rotation.y);
    var sin = Math.sin(this.chalet.rotation.y);
    var lx = -2.0;
    var lz = -1.3;
    var base = new THREE.Vector3(
      cx + lx * cos + lz * sin,
      this.chalet.position.y + 7.7,
      this.chalet.position.z - lx * sin + lz * cos
    );
    for (var i = 0; i < this.puffs.length; i++) {
      var p = this.puffs[i];
      p.t += (dt || 0) * 0.30;
      if (p.t > 1) p.t -= 1;

      var monte = p.t * 5.2;
      /* Elle part droit puis penche : c'est ce léger biais qui donne du vent
         à une scène par ailleurs immobile. */
      p.mesh.position.set(
        base.x + Math.sin(p.t * 3.1 + i) * 0.55 + p.t * 0.9,
        base.y + monte,
        base.z + Math.cos(p.t * 2.3 + i) * 0.35
      );
      p.mesh.scale.setScalar(0.55 + p.t * 1.9);
      /* Elle apparaît vite au sortir du conduit, puis s'efface longuement. */
      p.mat.opacity = 0.55 * Math.min(1, p.t * 6) * (1 - p.t) * (1 - p.t * 0.4);
    }
  };

  AS.finish = { Finish: Finish };
})((window.AlpineSchool = window.AlpineSchool || {}));
