/* =========================================================================
   Alpine School — ciel, soleil et chaîne de sommets
   -------------------------------------------------------------------------
   Le brouillard exponentiel est réglé pour la piste : à 120 unités il a tout
   mangé. Les sommets, eux, sont censés rester visibles bien au-delà. Plutôt
   que de bricoler deux brouillards, on les sort du brouillard et on pré-mêle
   leur couleur vers celle du ciel, couche par couche. C'est la manière dont
   un décor stylisé gère la perspective aérienne : on la peint au lieu de la
   calculer, et on garde la main dessus.
   ========================================================================= */
(function (AS) {
  'use strict';

  var PAL = AS.PALETTE;
  var DER = AS.DERIVED;

  /* Générateur pseudo-aléatoire à graine : la montagne est la même à chaque
     partie, ce qui évite qu'une descente tombe sur un horizon raté. */
  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function mixColor(hex, towardHex, amount) {
    var c = new THREE.Color(hex);
    return c.lerp(new THREE.Color(towardHex), amount);
  }

  /* --- Dôme de ciel ------------------------------------------------------
     Dégradé vertical peint dans le vertex shader. Sa couleur à l'horizon est
     exactement celle du brouillard : la couture entre le sol lointain et le
     ciel disparaît. */
  function buildSkyDome() {
    var geo = new THREE.SphereGeometry(400, 32, 20);
    var mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(PAL.skyTop) },
        uHorizon: { value: new THREE.Color(DER.fog) },
        uLow: { value: new THREE.Color(PAL.skyHorizon) }
      },
      vertexShader: [
        'varying float vH;',
        'void main() {',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vH = normalize(wp.xyz).y;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uTop;',
        'uniform vec3 uHorizon;',
        'uniform vec3 uLow;',
        'varying float vH;',
        'void main() {',
        '  float h = vH;',
        /* Au-dessus de l'horizon : bleu qui se sature en montant.
           En dessous : on reste clair, on ne verra de toute façon que la
           frange juste sous la ligne d'horizon. */
        /* Exposant bas : le bleu franc arrive vite au-dessus de l'horizon.
           Avec une caméra qui regarde légèrement vers le bas, on ne voit que
           la frange basse du ciel — si le dégradé est lent, il n'y a jamais
           de bleu à l'écran. */
        '  vec3 col = mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.38));',
        '  col = mix(col, uLow, clamp(-h * 3.0, 0.0, 1.0));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -100;
    return mesh;
  }

  /* --- Disque solaire ----------------------------------------------------
     Un simple dégradé radial additif. Il sert autant de source lumineuse
     visible que d'ancre aux rayons crépusculaires du post-traitement. */
  function buildSun() {
    var geo = new THREE.PlaneGeometry(1, 1);
    var mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(DER.sunDisc) } },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'varying vec2 vUv;',
        'void main() {',
        '  float d = length(vUv - 0.5) * 2.0;',
        '  float core = 1.0 - smoothstep(0.0, 0.30, d);',
        '  float halo = pow(1.0 - clamp(d, 0.0, 1.0), 3.0);',
        '  float a = clamp(core + halo * 0.55, 0.0, 1.0);',
        '  gl_FragColor = vec4(uColor, a * 0.9);',
        '}'
      ].join('\n')
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(30);
    mesh.renderOrder = -90;
    mesh.frustumCulled = false;
    return mesh;
  }

  /* --- Une crête ---------------------------------------------------------
     Profil en dents de scie irrégulières, rempli jusqu'en bas. Les pointes
     les plus hautes reçoivent une calotte de neige, dessinée en clair par
     un second polygone. */
  function buildRidge(opts) {
    var rand = seeded(opts.seed);
    var group = new THREE.Group();

    var count = opts.count;
    var step = opts.width / count;
    var pts = [];
    for (var i = 0; i <= count; i++) {
      var x = -opts.width * 0.5 + step * i;
      /* Deux échelles superposées : de grands massifs, et des dents plus
         fines dessus. Sans la seconde, la silhouette fait carton découpé. */
      var big = Math.sin(i * 0.7 + opts.phase) * 0.5 + 0.5;
      var fine = rand();
      var h = opts.base + opts.height * (big * 0.62 + fine * 0.38);
      pts.push(new THREE.Vector2(x, h));
    }

    var shape = new THREE.Shape();
    shape.moveTo(-opts.width * 0.5, -opts.drop);
    for (var p = 0; p < pts.length; p++) shape.lineTo(pts[p].x, pts[p].y);
    shape.lineTo(opts.width * 0.5, -opts.drop);
    shape.closePath();

    var body = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      /* DoubleSide obligatoire : ShapeGeometry naît dans le plan XY tournée
         vers +z, or la caméra regarde vers +z — on en voit donc la face
         arrière, et une crête à face unique serait purement invisible. */
      new THREE.MeshBasicMaterial({ color: opts.color, fog: false, side: THREE.DoubleSide })
    );
    group.add(body);

    /* Calottes de neige : un petit triangle blanc sous chaque pointe qui
       dépasse le seuil. */
    if (opts.snow) {
      var caps = [];
      for (var k = 1; k < pts.length - 1; k++) {
        var prev = pts[k - 1], cur = pts[k], next = pts[k + 1];
        if (cur.y <= prev.y || cur.y <= next.y) continue;
        if (cur.y < opts.base + opts.height * 0.52) continue;
        var dropTo = cur.y - opts.height * 0.19;
        var lx = THREE.MathUtils.lerp(cur.x, prev.x, 0.55);
        var rx = THREE.MathUtils.lerp(cur.x, next.x, 0.55);
        caps.push([lx, rx, cur.x, cur.y, dropTo]);
      }
      if (caps.length) {
        var geos = [];
        for (var q = 0; q < caps.length; q++) {
          var c = caps[q];
          var s = new THREE.Shape();
          s.moveTo(c[2], c[3]);
          s.lineTo(c[1], c[4]);
          s.lineTo(c[0], c[4]);
          s.closePath();
          geos.push(new THREE.ShapeGeometry(s));
        }
        var merged = mergeShapeGeometries(geos);
        var capMesh = new THREE.Mesh(
          merged,
          new THREE.MeshBasicMaterial({ color: opts.snow, fog: false, side: THREE.DoubleSide })
        );
        capMesh.position.z = 0.5;
        group.add(capMesh);
      }
    }

    group.position.set(0, opts.y, opts.z);
    group.renderOrder = opts.order;
    return group;
  }

  /* Fusion maison : BufferGeometryUtils n'est pas dans le build principal de
     Three, et on ne charge pas d'add-on pour trois triangles. */
  function mergeShapeGeometries(geos) {
    var total = 0;
    var i;
    for (i = 0; i < geos.length; i++) {
      total += geos[i].getAttribute('position').count;
    }
    var pos = new Float32Array(total * 3);
    var offset = 0;
    for (i = 0; i < geos.length; i++) {
      var g = geos[i].index ? geos[i].toNonIndexed() : geos[i];
      var a = g.getAttribute('position');
      pos.set(a.array.subarray(0, a.count * 3), offset);
      offset += a.count * 3;
    }
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, offset), 3));
    return out;
  }

  /* --- Assemblage --------------------------------------------------------
     Trois plans : sommets lointains presque noyés dans le ciel, bande de
     forêt sombre à mi-distance (c'est elle qui donne l'échelle), sommets
     proches plus contrastés. */
  function Backdrop() {
    this.group = new THREE.Group();

    /* Le dosage du mélange vers la couleur du brouillard est ce qui creuse la
       profondeur. Trop mêlé, une crête disparaît purement et simplement dans
       le ciel — c'est un réglage à faire à l'œil, pas au calcul. */
    /* Hauteurs calées sur le champ de vision : une crête plus haute que le
       cadre ne montre que son flanc, et le flanc est caché par les bords de
       la vallée. Il faut que les pointes tombent DANS l'image. */
    this.far = buildRidge({
      seed: 20260728, count: 30, width: 1100, height: 44, base: 10, drop: 70,
      color: mixColor(PAL.peaksFar, DER.fog, 0.16),
      snow: mixColor(0xffffff, DER.fog, 0.12),
      y: -9, z: -330, order: -60, phase: 0.4
    });

    this.near = buildRidge({
      seed: 771133, count: 22, width: 760, height: 27, base: 6, drop: 70,
      color: PAL.peaksNear,
      snow: 0xffffff,
      y: -9, z: -250, order: -55, phase: 2.1
    });

    this.forest = buildRidge({
      seed: 5150, count: 40, width: 520, height: 10, base: 2, drop: 50,
      color: mixColor(DER.forestBand, DER.fog, 0.20),
      snow: null,
      y: -7, z: -186, order: -50, phase: 1.2
    });

    this.group.add(this.far, this.near, this.forest);

    this.sun = buildSun();
    this.dome = buildSkyDome();
  }

  /* Les crêtes suivent la caméra en profondeur (elles ne doivent jamais être
     rattrapées) mais réagissent au déport latéral avec un facteur réduit :
     c'est ce décalage qui donne la parallaxe et fait sentir la distance. */
  Backdrop.prototype.update = function (camera, playerX) {
    this.group.position.z = camera.position.z;
    this.far.position.x = -playerX * 0.06;
    this.near.position.x = -playerX * 0.13;
    this.forest.position.x = -playerX * 0.24;

    this.dome.position.copy(camera.position);
  };

  Backdrop.prototype.placeSun = function (camera, sunDir) {
    /* Le disque est plaqué loin dans la direction du soleil et regarde
       toujours la caméra. */
    this.sun.position.copy(camera.position).addScaledVector(sunDir, 330);
    this.sun.quaternion.copy(camera.quaternion);
  };

  AS.sky = {
    Backdrop: Backdrop,
    seeded: seeded,
    mixColor: mixColor
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
