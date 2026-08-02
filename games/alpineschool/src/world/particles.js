/* =========================================================================
   Alpine School — neige projetée, flocons et trace de carre
   -------------------------------------------------------------------------
   Trois effets, trois réservoirs de taille fixe. Rien n'est alloué pendant la
   partie : les particules mortes sont réutilisées, la trace est un tampon
   circulaire. C'est ce qui évite les à-coups du ramasse-miettes.
   ========================================================================= */
(function (AS) {
  'use strict';

  var clamp = AS.util.clamp;
  var BR = String.fromCharCode(10);   // séparateur de lignes GLSL

  /* Un point rond et doux, dessiné dans le fragment shader : pas de texture
     à charger, et ça reste net à toutes les tailles. */
  var POINT_VERT = [
    'attribute float aSize;',
    'attribute float aAlpha;',
    'uniform float uNearFade;',
    'varying float vAlpha;',
    'void main() {',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  float dist = max(-mv.z, 0.1);',
    /* Une particule qui frôle l'objectif couvre l'écran d'une tache : on la
       fait disparaître avant, et on plafonne la taille en pixels. */
    '  vAlpha = aAlpha * smoothstep(uNearFade, uNearFade * 3.0, dist);',
    '  gl_PointSize = min(aSize * (300.0 / dist), 42.0);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var POINT_FRAG = [
    'uniform vec3 uColor;',
    'varying float vAlpha;',
    'void main() {',
    '  vec2 d = gl_PointCoord - 0.5;',
    '  float r = dot(d, d) * 4.0;',
    '  float a = (1.0 - smoothstep(0.35, 1.0, r)) * vAlpha;',
    '  if (a < 0.01) discard;',
    '  gl_FragColor = vec4(uColor, a);',
    '}'
  ].join('\n');

  function pointsMaterial(color, nearFade) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uNearFade: { value: nearFade }
      },
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
  }

  function makePoints(count, color, nearFade) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 20), 200);
    var pts = new THREE.Points(geo, pointsMaterial(color, nearFade));
    pts.frustumCulled = false;
    return pts;
  }

  /* --- Gerbe de neige ----------------------------------------------------
     Émise sous les skis quand on carve fort. Part à l'opposé du virage, monte
     un peu, retombe. C'est le retour visuel principal du pilotage : sans
     elle, on ne sent pas qu'on mord la neige. */
  var SPRAY_MAX = 460;

  function Spray() {
    this.points = makePoints(SPRAY_MAX, 0xffffff, 1.1);
    this.pool = [];
    for (var i = 0; i < SPRAY_MAX; i++) {
      this.pool.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1 });
    }
    this.cursor = 0;
    this.emitAccum = 0;
  }

  Spray.prototype.reset = function () {
    for (var i = 0; i < this.pool.length; i++) this.pool[i].life = 0;
  };

  /* strength : 0 quand on glisse droit, 1 à pleine carre. */
  Spray.prototype.emit = function (x, y, dir, strength, speed, dt) {
    this.emitAccum += strength * (60 + speed * 3.4) * dt;
    var n = Math.floor(this.emitAccum);
    this.emitAccum -= n;

    for (var i = 0; i < n; i++) {
      var p = this.pool[this.cursor];
      this.cursor = (this.cursor + 1) % SPRAY_MAX;
      p.max = 0.34 + Math.random() * 0.34;
      p.life = p.max;
      p.x = x - dir * 0.16 + (Math.random() - 0.5) * 0.24;
      p.y = y + 0.03 + Math.random() * 0.09;
      p.z = 0.12 + (Math.random() - 0.5) * 0.42;
      p.vx = -dir * (1.5 + Math.random() * 2.9) * (0.5 + strength);
      p.vy = 1.5 + Math.random() * 2.5;
      p.vz = -1.4 - Math.random() * 3.2;
      p.size = 2.4 + Math.random() * 4.4;
    }
  };

  Spray.prototype.update = function (dt, travelled) {
    var pos = this.points.geometry.getAttribute('position');
    var size = this.points.geometry.getAttribute('aSize');
    var alpha = this.points.geometry.getAttribute('aAlpha');

    for (var i = 0; i < SPRAY_MAX; i++) {
      var p = this.pool[i];
      if (p.life <= 0) {
        alpha.array[i] = 0;
        continue;
      }
      p.life -= dt;
      p.vy -= 7.4 * dt;
      p.vx *= 1 - 2.2 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt - travelled;

      var t = clamp(p.life / p.max, 0, 1);
      pos.array[i * 3] = p.x;
      pos.array[i * 3 + 1] = p.y;
      pos.array[i * 3 + 2] = -p.z;      // p.z compte les mètres devant
      size.array[i] = p.size * (0.5 + t * 0.8);
      alpha.array[i] = t * t * 0.85;
    }
    pos.needsUpdate = true;
    size.needsUpdate = true;
    alpha.needsUpdate = true;
  };

  /* --- Flocons ----------------------------------------------------------
     Un volume de flocons accroché à la caméra. Ils ne tombent pas vraiment du
     ciel : ils tournent dans une boîte qui suit le joueur, ce qui donne
     l'illusion à un centième du coût. */
  var FLAKE_COUNT = 520;
  var FLAKE_BOX = { x: 44, y: 19, z: 96 };

  function Flakes() {
    /* Fondu proche généreux : les flocons doivent meubler la profondeur, pas
       s'écraser sur l'objectif. */
    this.points = makePoints(FLAKE_COUNT, 0xffffff, 5.5);
    this.data = [];
    var pos = this.points.geometry.getAttribute('position');
    var size = this.points.geometry.getAttribute('aSize');
    var alpha = this.points.geometry.getAttribute('aAlpha');

    for (var i = 0; i < FLAKE_COUNT; i++) {
      var d = {
        x: (Math.random() - 0.5) * FLAKE_BOX.x,
        y: Math.random() * FLAKE_BOX.y,
        /* La boîte est décalée vers l'avant : rien ne naît dans le dos de la
           caméra, tout tombe dans le champ. */
        z: 14 + (Math.random() - 0.5) * FLAKE_BOX.z,
        fall: 0.5 + Math.random() * 1.3,
        drift: (Math.random() - 0.5) * 0.8,
        phase: Math.random() * 6.28
      };
      this.data.push(d);
      pos.array[i * 3] = d.x;
      pos.array[i * 3 + 1] = d.y;
      pos.array[i * 3 + 2] = -d.z;
      size.array[i] = 0.26 + Math.random() * 0.62;
      alpha.array[i] = 0.22 + Math.random() * 0.34;
    }
    size.needsUpdate = true;
    alpha.needsUpdate = true;
    this.time = 0;
  }

  Flakes.prototype.update = function (dt, travelled, centre) {
    this.time += dt;
    var pos = this.points.geometry.getAttribute('position');
    for (var i = 0; i < FLAKE_COUNT; i++) {
      var d = this.data[i];
      d.y -= d.fall * dt;
      d.x += (d.drift + Math.sin(this.time * 0.7 + d.phase) * 0.35) * dt;
      d.z -= travelled;

      if (d.y < -2) { d.y += FLAKE_BOX.y; }
      if (d.z < 14 - FLAKE_BOX.z * 0.5) { d.z += FLAKE_BOX.z; }
      if (d.x < -FLAKE_BOX.x * 0.5) d.x += FLAKE_BOX.x;
      if (d.x > FLAKE_BOX.x * 0.5) d.x -= FLAKE_BOX.x;

      pos.array[i * 3] = d.x + centre;
      pos.array[i * 3 + 1] = d.y;
      pos.array[i * 3 + 2] = -d.z;
    }
    pos.needsUpdate = true;
  };

  /* --- Trace de carre ----------------------------------------------------
     Un ruban posé sur la neige derrière le skieur. On ajoute un échantillon
     tous les demi-mètres et on jette le plus vieux : la longueur visible est
     donc constante quelle que soit la vitesse. */
  var TRAIL_SAMPLES = 78;
  var SAMPLE_STEP = 0.55;

  function Trail() {
    this.samples = [];
    this.sinceLast = 0;

    var verts = TRAIL_SAMPLES * 2;
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(verts), 1));

    var index = [];
    for (var s = 0; s < TRAIL_SAMPLES - 1; s++) {
      var a = s * 2, b = a + 1, c = a + 2, d = a + 3;
      index.push(a, c, b, b, c, d);
    }
    geo.setIndex(index);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 120);

    var mat = new THREE.ShaderMaterial({
      /* La trace est un creux dans la neige, donc une ombre : bleue et
         franchement plus sombre que la piste, jamais blanche. */
      uniforms: { uColor: { value: new THREE.Color(0x7ba0c4) } },
      vertexShader: [
        'attribute float aAlpha;',
        'varying float vAlpha;',
        'void main() {',
        '  vAlpha = aAlpha;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'varying float vAlpha;',
        'void main() {',
        '  if (vAlpha < 0.004) discard;',
        '  gl_FragColor = vec4(uColor, vAlpha);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
  }

  Trail.prototype.reset = function () {
    this.samples.length = 0;
    this.sinceLast = 0;
    var alpha = this.mesh.geometry.getAttribute('aAlpha');
    alpha.array.fill(0);
    alpha.needsUpdate = true;
  };

  Trail.prototype.update = function (dt, travelled, riderX, groundY, edgeVx, airborne) {
    var i;
    for (i = 0; i < this.samples.length; i++) this.samples[i].z -= travelled;

    this.sinceLast += travelled;
    if (this.sinceLast >= SAMPLE_STEP) {
      this.sinceLast = 0;
      this.samples.push({
        x: riderX,
        y: groundY + 0.035,
        z: 0.1,
        /* Une trace large quand on carve à plat, presque rien en l'air. */
        w: airborne ? 0 : (0.14 + Math.abs(edgeVx) * 0.055),
        a: airborne ? 0 : 0.5
      });
      if (this.samples.length > TRAIL_SAMPLES) this.samples.shift();
    }

    var pos = this.mesh.geometry.getAttribute('position');
    var alpha = this.mesh.geometry.getAttribute('aAlpha');
    var count = this.samples.length;

    for (i = 0; i < TRAIL_SAMPLES; i++) {
      var idx = i * 2;
      if (i >= count) {
        alpha.array[idx] = 0;
        alpha.array[idx + 1] = 0;
        continue;
      }
      var s = this.samples[i];
      /* Les échantillons les plus vieux (index bas) s'effacent : la trace
         part en fondu au lieu de se couper net. */
      var age = i / Math.max(1, count - 1);
      var fade = Math.min(1, age * 2.6) * s.a;
      pos.array[idx * 3] = s.x - s.w;
      pos.array[idx * 3 + 1] = s.y;
      pos.array[idx * 3 + 2] = -s.z;
      pos.array[(idx + 1) * 3] = s.x + s.w;
      pos.array[(idx + 1) * 3 + 1] = s.y;
      pos.array[(idx + 1) * 3 + 2] = -s.z;
      alpha.array[idx] = fade;
      alpha.array[idx + 1] = fade;
    }
    pos.needsUpdate = true;
    alpha.needsUpdate = true;
  };

  /* --- Confettis ---------------------------------------------------------
     Pour percuter un lapin. Ce n'est pas un accident grave : c'est une
     maladresse. Une gerbe de papier coloré le dit mieux qu'un écran rouge et
     une secousse — on comprend qu'on a perdu une vie sans se sentir puni. */
  var CONFETTI_MAX = 180;
  var CONFETTI_COLORS = [
    0xff5f6d, 0xffc93d, 0x4fd8ff, 0x7ee081, 0xc48bff, 0xffffff
  ];

  function Confetti() {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CONFETTI_MAX * 3), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(CONFETTI_MAX), 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(CONFETTI_MAX), 1));
    geo.setAttribute('aTint', new THREE.BufferAttribute(new Float32Array(CONFETTI_MAX * 3), 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60);

    var mat = new THREE.ShaderMaterial({
      uniforms: { uNearFade: { value: 0.6 } },
      vertexShader: [
        'attribute float aSize;',
        'attribute float aAlpha;',
        'attribute vec3 aTint;',
        'uniform float uNearFade;',
        'varying float vAlpha;',
        'varying vec3 vTint;',
        'void main() {',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  float dist = max(-mv.z, 0.1);',
        '  vAlpha = aAlpha * smoothstep(uNearFade, uNearFade * 3.0, dist);',
        '  vTint = aTint;',
        '  gl_PointSize = min(aSize * (300.0 / dist), 40.0);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join(BR),
      fragmentShader: [
        'varying float vAlpha;',
        'varying vec3 vTint;',
        'void main() {',
        /* Carré plutôt que rond : un confetti est un bout de papier. */
        '  vec2 d = abs(gl_PointCoord - 0.5);',
        '  if (max(d.x, d.y) > 0.5 || vAlpha < 0.01) discard;',
        '  gl_FragColor = vec4(vTint, vAlpha);',
        '}'
      ].join(BR),
      transparent: true,
      depthWrite: false
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.pool = [];
    for (var i = 0; i < CONFETTI_MAX; i++) {
      this.pool.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1 });
    }
    this.cursor = 0;
  }

  Confetti.prototype.reset = function () {
    for (var i = 0; i < this.pool.length; i++) this.pool[i].life = 0;
  };

  Confetti.prototype.burst = function (x, y, z) {
    var tint = this.points.geometry.getAttribute('aTint');
    for (var i = 0; i < 70; i++) {
      var p = this.pool[this.cursor];
      var col = new THREE.Color(
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      );
      tint.array[this.cursor * 3] = col.r;
      tint.array[this.cursor * 3 + 1] = col.g;
      tint.array[this.cursor * 3 + 2] = col.b;
      this.cursor = (this.cursor + 1) % CONFETTI_MAX;

      p.max = 0.9 + Math.random() * 0.7;
      p.life = p.max;
      p.x = x + (Math.random() - 0.5) * 0.3;
      p.y = y + 0.5 + Math.random() * 0.4;
      p.z = z + (Math.random() - 0.5) * 0.3;
      var ang = Math.random() * 6.2832;
      var spread = 1.5 + Math.random() * 3.4;
      p.vx = Math.cos(ang) * spread;
      p.vz = Math.sin(ang) * spread * 0.6;
      p.vy = 2.6 + Math.random() * 3.4;
      p.size = 3 + Math.random() * 4;
    }
    tint.needsUpdate = true;
  };

  Confetti.prototype.update = function (dt, travelled) {
    var pos = this.points.geometry.getAttribute('position');
    var size = this.points.geometry.getAttribute('aSize');
    var alpha = this.points.geometry.getAttribute('aAlpha');

    for (var i = 0; i < CONFETTI_MAX; i++) {
      var p = this.pool[i];
      if (p.life <= 0) { alpha.array[i] = 0; continue; }
      p.life -= dt;
      p.vy -= 6.2 * dt;
      p.vx *= 1 - 1.4 * dt;
      p.vz *= 1 - 1.4 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt - travelled;

      var t = clamp(p.life / p.max, 0, 1);
      pos.array[i * 3] = p.x;
      pos.array[i * 3 + 1] = p.y;
      pos.array[i * 3 + 2] = -p.z;
      /* La taille bat : un confetti tourne sur lui-même et disparaît de
         profil. C'est un scintillement gratuit et très efficace. */
      size.array[i] = p.size * (0.35 + Math.abs(Math.sin(p.life * 14)) * 0.9);
      alpha.array[i] = Math.min(1, t * 2.2);
    }
    pos.needsUpdate = true;
    size.needsUpdate = true;
    alpha.needsUpdate = true;
  };

  AS.particles = {
    Confetti: Confetti,
    Spray: Spray,
    Flakes: Flakes,
    Trail: Trail
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
