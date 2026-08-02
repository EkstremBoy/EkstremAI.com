/* =========================================================================
   Alpine School — post-traitement
   -------------------------------------------------------------------------
   Une seule passe plein écran, pas de chaîne d'effets : rayons crépusculaires
   depuis le soleil, aberration chromatique, filé radial à haute vitesse,
   vignette, grain et étalonnage. Tout tient dans un shader, donc une seule
   passe supplémentaire — c'est ce qui permet de garder ce rendu à 60 images
   par seconde sans carte graphique dédiée.

   ESPACE COLORIMÉTRIQUE — l'ordre compte, et se tromper donne une image
   délavée et beigeasse :
     — la cible intermédiaire est LINÉAIRE (demi-flottants), la scène y arrive
       tonemappée mais non encodée ;
     — tout ce qui additionne de la lumière (rayons, filé, aberration) se fait
       donc en linéaire, là où additionner a un sens physique ;
     — on encode en sRGB, et seulement après on étalonne, vignette et grène,
       parce que ces trois-là se raisonnent à l'œil, dans l'espace d'affichage.
   ========================================================================= */
(function (AS) {
  'use strict';

  var VERT = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = vec4(position.xy, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'uniform sampler2D tScene;',
    'uniform vec2 uResolution;',
    'uniform vec2 uSun;',       // position écran du soleil, 0..1
    'uniform float uSunAmount;',// 0 quand le soleil est hors champ
    'uniform float uSpeed;',    // 0..1
    'uniform float uTime;',
    'uniform float uMotion;',   // 0 si l'utilisateur préfère moins d'animation
    'uniform float uFlash;',
    'uniform vec3 uFlashColor;',
    'varying vec2 vUv;',
    '',
    'const int GOD_SAMPLES = 16;',
    '',
    'float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }',
    '',
    'vec3 toSRGB(vec3 c) {',
    '  c = clamp(c, 0.0, 1.0);',
    '  return mix(c * 12.92, 1.055 * pow(c, vec3(0.41666)) - 0.055, step(vec3(0.0031308), c));',
    '}',
    '',
    'void main() {',
    '  vec2 uv = vUv;',
    '  vec2 centred = uv - 0.5;',
    '  float r2 = dot(centred, centred);',
    '',
    /* Aberration chromatique : les canaux se décalent radialement, très peu au
       centre, davantage sur les bords. Elle monte avec la vitesse. */
    '  float ca = (0.0009 + uSpeed * 0.0026 * uMotion) * r2 * 4.0;',
    '  vec3 col;',
    '  col.r = texture2D(tScene, uv + centred * ca).r;',
    '  col.g = texture2D(tScene, uv).g;',
    '  col.b = texture2D(tScene, uv - centred * ca).b;',
    '',
    /* Filé radial : quelques échantillons vers l'extérieur, pondérés, pour
       étirer l'image quand ça va vite. */
    '  float streak = uSpeed * uSpeed * 0.55 * uMotion;',
    '  if (streak > 0.01) {',
    '    vec3 blur = vec3(0.0);',
    '    for (int i = 1; i <= 5; i++) {',
    '      float t = float(i) / 5.0;',
    '      blur += texture2D(tScene, uv + centred * t * 0.055 * streak).rgb;',
    '    }',
    '    blur /= 5.0;',
    '    col = mix(col, blur, clamp(streak * r2 * 3.4, 0.0, 0.62));',
    '  }',
    '',
    /* Rayons crépusculaires : on marche vers le soleil en accumulant ce qui
       est plus clair qu'un seuil. Le ciel passe, la neige et les sapins non,
       donc les rayons se découpent derrière les crêtes. */
    '  if (uSunAmount > 0.001) {',
    '    vec2 delta = (uSun - uv) * (0.62 / float(GOD_SAMPLES));',
    '    vec2 walk = uv;',
    '    float decay = 1.0;',
    '    vec3 rays = vec3(0.0);',
    '    for (int i = 0; i < GOD_SAMPLES; i++) {',
    '      walk += delta;',
    '      vec3 s = texture2D(tScene, walk).rgb;',
    /* Le seuil se lit en lumière linéaire, pas en valeur d'écran : un ciel
       qui paraît clair y pèse souvent moins de 0.6. Trop haut, plus aucun
       rayon ne sort. */
    '      float bright = max(0.0, luma(s) - 0.58) * 2.2;',
    '      rays += s * bright * decay;',
    '      decay *= 0.93;',
    '    }',
    '    rays /= float(GOD_SAMPLES);',
    '    col += rays * 0.55 * uSunAmount;',
    '  }',
    '',
    // Fin du travail en lumière. Tout ce qui suit se juge à l'œil.
    '  col = toSRGB(col);',
    '',
    /* Étalonnage : contraste léger, teinte froide dans les ombres, chaude
       dans les hautes lumières. La neige gagne un peu de relief sans virer
       au gris. */
    '  col = (col - 0.5) * 1.045 + 0.5;',
    '  col += vec3(-0.014, -0.003, 0.026) * (1.0 - luma(col));',
    '  col += vec3(0.006, 0.003, 0.000) * luma(col);',
    '',
    /* Vignette. */
    '  col *= 1.0 - smoothstep(0.24, 0.95, r2) * 0.28;',
    '',
    /* Flash de porte, vert ou rouge. */
    '  col = mix(col, uFlashColor, uFlash);',
    '',
    // Grain fin et animé. Il masque au passage les bandes que le dégradé du
    // ciel pourrait laisser voir sur un écran 8 bits.
    '  float n = fract(sin(dot(uv * uResolution + uTime, vec2(12.9898, 78.233))) * 43758.5453);',
    '  col += (n - 0.5) * 0.020;',
    '',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  function Post(renderer, samples) {
    var size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);

    /* L'antialiasing du canvas ne s'applique qu'au tampon par défaut : comme
       la scène part dans une cible intermédiaire, c'est elle qui doit être
       multiéchantillonnée, sinon toutes les arêtes du low-poly crénellent. */
    this.target = new THREE.WebGLRenderTarget(
      Math.max(1, size.x),
      Math.max(1, size.y),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: THREE.HalfFloatType,
        colorSpace: THREE.LinearSRGBColorSpace,
        depthBuffer: true,
        stencilBuffer: false,
        samples: samples === undefined ? 4 : samples
      }
    );

    this.uniforms = {
      tScene: { value: this.target.texture },
      uResolution: { value: new THREE.Vector2(size.x, size.y) },
      uSun: { value: new THREE.Vector2(0.5, 0.8) },
      uSunAmount: { value: 0 },
      uSpeed: { value: 0 },
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uFlash: { value: 0 },
      uFlashColor: { value: new THREE.Color(0xffffff) }
    };

    /* Un triangle qui déborde de l'écran plutôt qu'un quad : une primitive au
       lieu de deux, et pas de couture sur la diagonale. */
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(
      new Float32Array([0, 0, 2, 0, 0, 2]), 2));

    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false
    }));
    this.mesh.frustumCulled = false;

    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this._sunNdc = new THREE.Vector3();
  }

  Post.prototype.setSize = function (renderer) {
    var size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    this.target.setSize(Math.max(1, size.x), Math.max(1, size.y));
    this.uniforms.uResolution.value.set(size.x, size.y);
  };

  /* Le soleil est projeté à l'écran ; quand il sort du cadre les rayons
     s'éteignent progressivement plutôt que de disparaître d'un coup. */
  Post.prototype.setSun = function (sunWorldPos, camera) {
    this._sunNdc.copy(sunWorldPos).project(camera);
    var x = this._sunNdc.x * 0.5 + 0.5;
    var y = this._sunNdc.y * 0.5 + 0.5;
    this.uniforms.uSun.value.set(x, y);

    var behind = this._sunNdc.z > 1;
    var margin = 0.42;
    var fx = 1 - AS.util.clamp((Math.abs(x - 0.5) - 0.5) / margin, 0, 1);
    var fy = 1 - AS.util.clamp((Math.abs(y - 0.5) - 0.5) / margin, 0, 1);
    this.uniforms.uSunAmount.value = behind ? 0 : fx * fy;
  };

  Post.prototype.render = function (renderer, scene, camera) {
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  };

  AS.post = { Post: Post };
})((window.AlpineSchool = window.AlpineSchool || {}));
