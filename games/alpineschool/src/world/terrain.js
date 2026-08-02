/* =========================================================================
   Alpine School — la neige
   -------------------------------------------------------------------------
   La piste n'est pas un plan : elle roule, elle s'incline légèrement, et de
   part et d'autre la montagne remonte en cuvette. Le relief est défini par
   une seule fonction de hauteur, écrite deux fois — en GLSL pour déplacer les
   sommets sans coûter un cycle processeur, et en JavaScript pour poser les
   sapins, les rochers et le skieur exactement sur le sol.

   LES DEUX VERSIONS DOIVENT RESTER IDENTIQUES. Si tu touches l'une, touche
   l'autre : sinon le skieur flotte ou s'enfonce.

   Le sol ne bouge jamais. C'est le relief qui défile à travers lui, via
   l'uniforme uScroll = distance parcourue.
   ========================================================================= */
(function (AS) {
  'use strict';

  var W = AS.WORLD;
  var P = AS.PHYSICS;

  var HALF = P.HALF;
  var TERRAIN_HALF = W.TERRAIN_WIDTH * 0.5;

  /* --- Fonction de hauteur, version JavaScript --------------------------- */
  function smoothstep01(t) {
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    return t * t * (3 - 2 * t);
  }

  /* Amplitude du relief, pilotée par le Crazy Mode (« champ de bosses »).
     Elle DOIT rester la même des deux côtés — le sol dessiné par le nuanceur
     et le sol calculé ici — sinon le skieur flotte ou s'enfonce. C'est
     pourquoi elle est un uniforme et non une constante compilée. */
  var mogul = 1;

  function heightAt(x, z) {
    var h = W.ROLL_AMP * mogul * Math.sin(z / W.ROLL_LEN)
          + W.ROLL2_AMP * mogul * Math.sin(z / W.ROLL2_LEN + 1.7)
          + W.CROSS_AMP * x * Math.sin(z / W.CROSS_LEN);

    var edge = Math.abs(x) - HALF;
    if (edge > 0) {
      /* Talus de bord : court et net, il borde la piste damée. */
      h += W.BERM_HEIGHT * smoothstep01(edge / W.BERM_SPAN);

      /* Flanc de montagne : il ne démarre qu'après le talus, puis grimpe. */
      var far = edge - W.BANK_START;
      if (far > 0) {
        var t = far / W.BANK_SPAN;
        h += W.BANK_HEIGHT * Math.pow(t, 1.75);
        h += t * (1.6 * Math.sin(z * 0.03448 + x * 0.06)
                + 1.0 * Math.sin(z * 0.07519 - x * 0.11));
      }
    }
    return h;
  }

  /* Normale par différences finies — le skieur s'en sert pour épouser la
     pente. Elle est rendue directement dans le repère d'affichage (z vers
     l'arrière), pas dans celui du jeu : c'est là qu'on s'en sert. */
  var EPS = 0.35;
  function normalAt(x, z, out) {
    var dx = (heightAt(x + EPS, z) - heightAt(x - EPS, z)) / (2 * EPS);
    var dz = (heightAt(x, z + EPS) - heightAt(x, z - EPS)) / (2 * EPS);
    var len = Math.sqrt(dx * dx + dz * dz + 1);
    out.set(-dx / len, 1 / len, dz / len);
    return out;
  }

  /* --- Même fonction, version GLSL -------------------------------------- */
  var GLSL_HEIGHT = [
    'uniform float uScroll;',
    'uniform float uMogul;',
    'varying float vGroomX;',
    'varying float vWorldZ;',
    'varying float vBank;',
    'varying float vAhead;',
    '',
    'float asHeight(float x, float z) {',
    '  float h = ' + f(W.ROLL_AMP) + ' * uMogul * sin(z / ' + f(W.ROLL_LEN) + ')',
    '          + ' + f(W.ROLL2_AMP) + ' * uMogul * sin(z / ' + f(W.ROLL2_LEN) + ' + 1.7)',
    '          + ' + f(W.CROSS_AMP) + ' * x * sin(z / ' + f(W.CROSS_LEN) + ');',
    '  float edge = max(0.0, abs(x) - ' + f(HALF) + ');',
    '  h += ' + f(W.BERM_HEIGHT) + ' * smoothstep(0.0, ' + f(W.BERM_SPAN) + ', edge);',
    '  float far = max(0.0, edge - ' + f(W.BANK_START) + ');',
    '  float t = far / ' + f(W.BANK_SPAN) + ';',
    '  h += ' + f(W.BANK_HEIGHT) + ' * pow(t, 1.75);',
    '  h += t * (1.6 * sin(z * 0.03448 + x * 0.06)',
    '          + 1.0 * sin(z * 0.07519 - x * 0.11));',
    '  return h;',
    '}',
    '',
    'vec3 asNormal(float x, float z) {',
    '  float e = ' + f(EPS) + ';',
    '  float dx = (asHeight(x + e, z) - asHeight(x - e, z)) / (2.0 * e);',
    '  float dz = (asHeight(x, z + e) - asHeight(x, z - e)) / (2.0 * e);',
    /* dz est une pente « vers l'avant du jeu », or l'avant du jeu est -z à
       l'écran : d'où le signe inversé sur la composante z de la normale. */
    '  return normalize(vec3(-dx, 1.0, dz));',
    '}'
  ].join('\n');

  function f(v) {
    var s = String(v);
    return s.indexOf('.') < 0 ? s + '.0' : s;
  }

  /* --- Géométrie ---------------------------------------------------------
     Grille non uniforme : resserrée près de la caméra où l'on voit le détail,
     étirée au loin où le brouillard mange tout. À nombre de sommets égal, le
     relief proche est bien plus propre qu'avec une grille régulière. */
  function buildGeometry() {
    var rows = W.TERRAIN_ROWS;
    var cols = W.TERRAIN_COLS;
    var zNear = W.Z_CULL - 3;
    var zSpan = W.Z_FAR + 26 - zNear;

    var positions = new Float32Array(rows * cols * 3);
    var index = [];
    var p = 0;

    for (var r = 0; r < rows; r++) {
      var rz = r / (rows - 1);
      var ahead = zNear + zSpan * Math.pow(rz, 1.35);
      for (var c = 0; c < cols; c++) {
        var cx = c / (cols - 1) * 2 - 1;             // -1 .. 1
        var x = Math.sign(cx) * TERRAIN_HALF * Math.pow(Math.abs(cx), 1.45);
        positions[p++] = x;
        positions[p++] = 0;
        positions[p++] = -ahead;   // la descente va vers -z
      }
    }

    /* Les rangées s'éloignent vers -z : l'ordre d'enroulement doit suivre,
       sinon toutes les faces regardent le sol et la piste disparaît. */
    for (var rr = 0; rr < rows - 1; rr++) {
      for (var cc = 0; cc < cols - 1; cc++) {
        var a = rr * cols + cc;
        var b = a + 1;
        var d = a + cols;
        var e = d + 1;
        index.push(a, b, d, b, e, d);
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(rows * cols * 3), 3));
    geo.setIndex(index);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -40), 260);
    return geo;
  }

  /* --- Matériau ----------------------------------------------------------
     MeshPhong plutôt que Standard : éclairage par fragment (indispensable
     pour que les stries de dameuse accrochent la lumière) sans le coût du
     PBR, et un léger spéculaire qui donne à la neige son grain satiné. */
  function buildMaterial() {
    var mat = new THREE.MeshPhongMaterial({
      color: AS.PALETTE.snow,
      specular: 0x9fc0dd,
      shininess: 6,
      flatShading: false
    });

    mat.userData.uniforms = {
      uScroll: { value: 0 },
      uMogul: { value: 1 }
    };

    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uScroll = mat.userData.uniforms.uScroll;
      shader.uniforms.uMogul = mat.userData.uniforms.uMogul;

      shader.vertexShader = shader.vertexShader
        .replace('void main() {', GLSL_HEIGHT + '\nvoid main() {')
        .replace(
          '#include <beginnormal_vertex>',
          [
            /* position.z est négatif vers l'avant ; wz est la coordonnée
               « devant » du jeu, celle que connaît heightAt(). */
            'float wz = uScroll - position.z;',
            'vec3 objectNormal = asNormal(position.x, wz);'
          ].join('\n')
        )
        .replace(
          '#include <begin_vertex>',
          [
            'vec3 transformed = vec3(position.x, asHeight(position.x, wz), position.z);',
            'vGroomX = position.x;',
            'vWorldZ = wz;',
            'vAhead = -position.z;',
            'vBank = clamp((abs(position.x) - ' + f(HALF) + ') / 3.0, 0.0, 1.0);'
          ].join('\n')
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          'void main() {',
          [
            'varying float vGroomX;',
            'varying float vWorldZ;',
            'varying float vBank;',
            'varying float vAhead;',
            'void main() {'
          ].join('\n')
        )
        .replace(
          '#include <color_fragment>',
          [
            '#include <color_fragment>',
            /* Stries de dameuse : des lignes parallèles à la pente, donc à x
               constant. Elles ne vont pas au-delà du bord damé. */
            'float groom = sin(vGroomX * ' + f(W.GROOM_FREQ) + ' * 6.28318);',
            'float groomed = 1.0 - smoothstep(0.0, 1.0, vBank);',
            /* Les stries s'effacent avec la distance : passé une trentaine de
               mètres elles tombent sous le pixel et se mettent à moirer. */
            'groomed *= 1.0 - smoothstep(26.0, 78.0, vAhead);',
            'diffuseColor.rgb *= 1.0 + groom * 0.075 * groomed;',
            /* Hors piste : neige profonde, plus bleue et mate. */
            'vec3 deep = vec3(' + rgb(AS.PALETTE.snowDeep) + ');',
            'diffuseColor.rgb = mix(diffuseColor.rgb, deep, vBank * 0.62);',
            /* Une trace continue marque le bord jouable : au-delà, ça freine.
               Sans ce repère on ne comprend pas pourquoi on ralentit. */
            'float rim = 1.0 - smoothstep(0.0, 0.30, abs(abs(vGroomX) - ' + f(HALF) + '));',
            'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(' + rgb(AS.PALETTE.snowShadow) + '), rim * 0.62);',
            /* Ondulation très lente de la teinte, juste pour que les grandes
               surfaces proches ne soient pas des aplats. La fréquence en z est
               volontairement basse : plus haut, elle se replie en bandes
               transversales dès qu'on regarde loin. */
            'float grain = sin(vGroomX * 0.21 + vWorldZ * 0.028) * sin(vWorldZ * 0.017 - vGroomX * 0.13);',
            'diffuseColor.rgb *= 1.0 + grain * 0.030;'
          ].join('\n')
        );
    };

    /* Deux matériaux compilés séparément ne partagent pas leur programme si
       leur clé diffère ; on force la même. */
    mat.customProgramCacheKey = function () { return 'as-snow'; };
    return mat;
  }

  function Terrain() {
    this.mesh = new THREE.Mesh(buildGeometry(), buildMaterial());
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 0;
  }

  Terrain.prototype.setScroll = function (scroll) {
    this.mesh.material.userData.uniforms.uScroll.value = scroll;
  };

  /* Change l'amplitude du relief des deux côtés d'un coup. Passer par ici est
     la seule façon de garantir que le sol vu et le sol calculé coïncident. */
  Terrain.prototype.setMogul = function (value) {
    mogul = value;
    this.mesh.material.userData.uniforms.uMogul.value = value;
  };

  function rgb(hex) {
    var c = new THREE.Color(hex);
    return c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4);
  }

  AS.terrain = {
    Terrain: Terrain,
    heightAt: heightAt,
    normalAt: normalAt,
    TERRAIN_HALF: TERRAIN_HALF
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
