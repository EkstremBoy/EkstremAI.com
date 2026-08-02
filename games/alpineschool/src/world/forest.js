/* =========================================================================
   Alpine School — forêt de décor
   -------------------------------------------------------------------------
   Les sapins qui bordent la piste ne sont jamais créés ni détruits : un
   nombre fixe d'instances tourne en boucle. Quand un sapin passe derrière le
   joueur, il est renvoyé au fond avec une nouvelle position. Deux appels de
   dessin pour deux cents arbres, et pas une allocation pendant la partie.

   Ces sapins-là sont hors piste et ne sont jamais des obstacles : les arbres
   qui blessent sont gérés par props.js.
   ========================================================================= */
(function (AS) {
  'use strict';

  var W = AS.WORLD;
  var HALF = AS.PHYSICS.HALF;
  var heightAt = AS.terrain.heightAt;

  var VARIANTS = 2;
  var PER_VARIANT = 104;

  function Forest() {
    this.meshes = [];
    this.trees = [];

    var dummy = new THREE.Object3D();
    this._dummy = dummy;

    for (var v = 0; v < VARIANTS; v++) {
      var geo = AS.models.buildPine(1000 + v * 37);
      var mesh = new THREE.InstancedMesh(geo, AS.models.decorMaterial(), PER_VARIANT);
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes.push(mesh);

      for (var i = 0; i < PER_VARIANT; i++) {
        var tree = { mesh: v, slot: i, x: 0, z: 0, scale: 1, spin: 0 };
        this.respawn(tree, true);
        this.trees.push(tree);
      }
    }
  }

  /* Répartition latérale : beaucoup de sapins juste au bord de la piste, de
     plus en plus clairsemés en montant sur les flancs. La puissance 1.7 fait
     ce dégradé sans qu'on ait à empiler des règles. */
  Forest.prototype.respawn = function (tree, initial) {
    var side = Math.random() < 0.5 ? -1 : 1;
    var out = Math.pow(Math.random(), 1.7);
    /* On laisse respirer une bande de neige vierge entre la piste et les
       premiers sapins : sans elle, le couloir se referme et on ne voit plus
       où l'on a le droit de skier. */
    tree.x = side * (HALF + 2.6 + out * 26);
    tree.z = initial
      ? (W.Z_CULL + Math.random() * (W.Z_FAR + 30 - W.Z_CULL))
      : (W.Z_FAR + 6 + Math.random() * 26);
    /* Les sapins loin du bord sont plus petits : c'est un raccourci de
       perspective qui creuse la vallée sans ajouter de géométrie. */
    tree.scale = (0.80 + Math.random() * 0.75) * (1 - out * 0.34);
    tree.spin = Math.random() * Math.PI * 2;
  };

  Forest.prototype.reset = function () {
    for (var i = 0; i < this.trees.length; i++) this.respawn(this.trees[i], true);
  };

  Forest.prototype.update = function (scroll, travelled) {
    var dummy = this._dummy;
    var dirty = [false, false];

    for (var i = 0; i < this.trees.length; i++) {
      var t = this.trees[i];
      t.z -= travelled;
      if (t.z < W.Z_CULL) this.respawn(t, false);

      dummy.position.set(t.x, heightAt(t.x, t.z + scroll) - 0.12, -t.z);
      dummy.rotation.set(0, t.spin, 0);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();
      this.meshes[t.mesh].setMatrixAt(t.slot, dummy.matrix);
      dirty[t.mesh] = true;
    }

    for (var m = 0; m < this.meshes.length; m++) {
      if (dirty[m]) this.meshes[m].instanceMatrix.needsUpdate = true;
    }
  };

  AS.forest = { Forest: Forest };
})((window.AlpineSchool = window.AlpineSchool || {}));
