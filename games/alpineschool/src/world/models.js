/* =========================================================================
   Alpine School — géométries construites en code
   -------------------------------------------------------------------------
   Aucun modèle importé : tout sort de primitives assemblées puis fusionnées.
   Chaque objet finit en une seule géométrie à couleurs par sommet, ce qui
   permet de le rendre en instancié avec un seul appel de dessin — c'est ce
   qui tient les 60 images par seconde avec une forêt de deux cents sapins.
   ========================================================================= */
(function (AS) {
  'use strict';

  var PAL = AS.PALETTE;
  var DER = AS.DERIVED;

  /* --- Fusion de géométries ---------------------------------------------
     BufferGeometryUtils vit dans les add-ons, qu'on ne charge pas. Cette
     version suffit : position, normale, couleur, tout non indexé. */
  function merge(parts) {
    var total = 0;
    var i;
    var prepared = [];

    for (i = 0; i < parts.length; i++) {
      var geo = parts[i].geo;
      if (geo.index !== null) geo = geo.toNonIndexed();
      geo.computeVertexNormals();
      if (parts[i].matrix) geo.applyMatrix4(parts[i].matrix);
      var count = geo.getAttribute('position').count;
      prepared.push({ geo: geo, count: count, color: new THREE.Color(parts[i].color) });
      total += count;
    }

    var positions = new Float32Array(total * 3);
    var normals = new Float32Array(total * 3);
    var colors = new Float32Array(total * 3);
    var offset = 0;

    for (i = 0; i < prepared.length; i++) {
      var p = prepared[i];
      positions.set(p.geo.getAttribute('position').array, offset * 3);
      normals.set(p.geo.getAttribute('normal').array, offset * 3);
      for (var v = 0; v < p.count; v++) {
        colors[(offset + v) * 3] = p.color.r;
        colors[(offset + v) * 3 + 1] = p.color.g;
        colors[(offset + v) * 3 + 2] = p.color.b;
      }
      offset += p.count;
      p.geo.dispose();
    }

    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    out.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return out;
  }

  function at(x, y, z, rotY, scale) {
    var m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY || 0, 0)),
      new THREE.Vector3(scale || 1, scale || 1, scale || 1)
    );
    return m;
  }

  /* --- Sapin -------------------------------------------------------------
     Trois étages de cônes, du plus sombre en bas au plus clair en haut, un
     tronc, et une pointe de neige posée sur chaque étage. Sept segments par
     cône : assez pour ne pas faire polygone, assez peu pour rester facetté. */
  function buildPine(seed) {
    var rand = AS.sky.seeded(seed || 7);
    var parts = [];
    var lean = (rand() - 0.5) * 0.06;

    parts.push({
      geo: new THREE.CylinderGeometry(0.075, 0.11, 0.7, 6),
      matrix: at(0, 0.35, 0),
      color: DER.trunk
    });

    var tiers = [
      { r: 0.86, h: 1.62, y: 0.42, color: PAL.pineDark },
      { r: 0.69, h: 1.44, y: 1.36, color: PAL.pineMid },
      { r: 0.50, h: 1.22, y: 2.22, color: PAL.pineLight }
    ];

    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var spin = rand() * Math.PI * 2;
      parts.push({
        geo: new THREE.ConeGeometry(t.r, t.h, 7),
        matrix: at(lean * i, t.y + t.h * 0.5, lean * i * 0.5, spin),
        color: t.color
      });
      /* La neige n'est pas un cône complet : juste le haut de l'étage, un peu
         plus large que la pointe pour qu'on la voie de loin. */
      parts.push({
        geo: new THREE.ConeGeometry(t.r * 0.52, t.h * 0.40, 7),
        matrix: at(lean * i, t.y + t.h * 0.80, lean * i * 0.5, spin),
        color: 0xffffff
      });
    }

    return merge(parts);
  }

  /* --- Rocher ------------------------------------------------------------
     Icosaèdre dont chaque sommet est tiré au hasard : polyèdre irrégulier,
     facettes franches. Les faces tournées vers le ciel prennent la neige. */
  function buildRock(seed) {
    var rand = AS.sky.seeded(seed || 3);
    /* PolyhedronGeometry naît déjà non indexée : la reconvertir ne ferait
       qu'imprimer un avertissement dans la console. */
    var geo = new THREE.IcosahedronGeometry(0.62, 0);
    if (geo.index !== null) geo = geo.toNonIndexed();
    var pos = geo.getAttribute('position');

    /* On déforme par sommet partagé (arrondi au centième) pour que les
       facettes voisines restent jointives. */
    var jitter = {};
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var key = x.toFixed(2) + '|' + y.toFixed(2) + '|' + z.toFixed(2);
      if (!jitter[key]) {
        jitter[key] = {
          sx: 0.72 + rand() * 0.62,
          sy: 0.50 + rand() * 0.48,
          sz: 0.72 + rand() * 0.62
        };
      }
      var j = jitter[key];
      pos.setXYZ(i, x * j.sx, y * j.sy + 0.30, z * j.sz);
    }
    geo.computeVertexNormals();

    /* Couleur par face : neige si la normale regarde le ciel. */
    var normal = geo.getAttribute('normal');
    var colors = new Float32Array(pos.count * 3);
    var rockCol = new THREE.Color(PAL.rock);
    var snowCol = new THREE.Color(0xffffff);
    for (var f = 0; f < pos.count; f += 3) {
      var ny = (normal.getY(f) + normal.getY(f + 1) + normal.getY(f + 2)) / 3;
      var c = ny > 0.42 ? snowCol : rockCol;
      for (var k = 0; k < 3; k++) {
        colors[(f + k) * 3] = c.r;
        colors[(f + k) * 3 + 1] = c.g;
        colors[(f + k) * 3 + 2] = c.b;
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  /* --- Billot ------------------------------------------------------------
     Un tronc couché en travers de la piste, calé sur deux souches. Il barre
     toute la largeur : c'est un obstacle de rythme, pas d'esquive. */
  function buildLog() {
    var parts = [];
    var trunk = new THREE.CylinderGeometry(0.30, 0.30, AS.PHYSICS.HALF * 2.15, 9);
    var m = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
    m.setPosition(0, 0.32, 0);
    parts.push({ geo: trunk, matrix: m, color: DER.trunk });

    /* Deux rondelles claires aux extrémités : le bois coupé se voit de loin
       et donne l'échelle. */
    [-1, 1].forEach(function (s) {
      var cap = new THREE.CylinderGeometry(0.30, 0.30, 0.07, 9);
      var cm = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
      cm.setPosition(s * (AS.PHYSICS.HALF * 1.075), 0.32, 0);
      parts.push({ geo: cap, matrix: cm, color: 0xc9a97e });
      var stump = new THREE.CylinderGeometry(0.13, 0.16, 0.34, 7);
      parts.push({
        geo: stump,
        matrix: at(s * (AS.PHYSICS.HALF * 0.55), 0.17, 0),
        color: DER.trunk
      });
    });

    /* Une bande de neige sur le dessus, pour qu'il ne se confonde pas avec
       l'ombre d'un sapin. */
    var snow = new THREE.BoxGeometry(AS.PHYSICS.HALF * 2.1, 0.06, 0.30);
    parts.push({ geo: snow, matrix: at(0, 0.60, 0), color: 0xffffff });

    return merge(parts);
  }

  /* --- Tronc creux -------------------------------------------------------
     Un billot percé en son milieu. Le lapin peut le traverser par le trou —
     et c'est là tout l'intérêt : au lieu d'un obstacle à éviter, on a une
     cible à viser. On voit à travers, donc on sait que c'est possible. */
  function buildHollowLog() {
    var HALF = AS.PHYSICS.HALF;
    var HOLE = 0.62;                       // demi-largeur de l'ouverture
    var parts = [];

    /* Deux tronçons pleins de part et d'autre du trou. */
    [-1, 1].forEach(function (sd) {
      var len = HALF * 1.08 - HOLE;
      var seg = new THREE.CylinderGeometry(0.44, 0.44, len, 10);
      var m = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
      m.setPosition(sd * (HOLE + len / 2), 0.46, 0);
      parts.push({ geo: seg, matrix: m, color: DER.trunk });

      /* Couronne claire autour de l'ouverture : c'est elle qui signale le
         passage de loin. */
      var ring = new THREE.CylinderGeometry(0.44, 0.44, 0.10, 10);
      var rm = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
      rm.setPosition(sd * HOLE, 0.46, 0);
      parts.push({ geo: ring, matrix: rm, color: 0xd8b478 });
    });

    var snow = new THREE.BoxGeometry(HALF * 2.16, 0.07, 0.42);
    parts.push({ geo: snow, matrix: at(0, 0.88, 0), color: 0xffffff });

    return merge(parts);
  }

  /* --- Bosse de neige ----------------------------------------------------
     Une calotte aplatie, blanche à peine bleutée. Elle doit se voir sur la
     neige sans ressembler à un rocher : c'est la LUMIÈRE qui la dessine, pas
     la couleur. */
  function buildBump() {
    var dome = new THREE.SphereGeometry(0.85, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.5);
    dome.scale(1, 0.42, 1.25);
    var parts = [{ geo: dome, matrix: at(0, 0, 0), color: 0xf4f8ff }];
    /* Une crête plus claire sur le dessus, pour qu'elle attrape l'œil de
       loin même à contre-jour. */
    var crest = new THREE.SphereGeometry(0.42, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
    crest.scale(1, 0.30, 1.1);
    parts.push({ geo: crest, matrix: at(0, 0.30, 0), color: 0xffffff });
    return merge(parts);
  }

  /* --- Lapin fusionné ----------------------------------------------------
     Version en une seule géométrie du lapin de wildlife.js, pour la foule du
     mode lapin (instanciée) et pour le skieur transformé. Elle ne s'anime
     pas : c'est le prix d'un seul appel de dessin pour trente lapins. */
  function buildBunnyMesh() {
    var FUR = 0xd8c6ae;
    var BELLY = 0xfff7ec;
    var EAR_IN = 0xe2a49c;
    var parts = [];

    var body = new THREE.SphereGeometry(0.19, 8, 6);
    body.scale(1, 0.92, 1.25);
    parts.push({ geo: body, matrix: at(0, 0.17, 0), color: FUR });
    parts.push({ geo: new THREE.SphereGeometry(0.085, 7, 5), matrix: at(0, 0.12, -0.14), color: BELLY });

    var skull = new THREE.SphereGeometry(0.115, 8, 6);
    skull.scale(1, 1, 1.15);
    parts.push({ geo: skull, matrix: at(0, 0.30, -0.15), color: FUR });
    parts.push({ geo: new THREE.SphereGeometry(0.045, 6, 5), matrix: at(0, 0.26, -0.25), color: BELLY });
    parts.push({ geo: new THREE.SphereGeometry(0.062, 7, 5), matrix: at(0, 0.20, 0.20), color: BELLY });

    [-1, 1].forEach(function (s) {
      parts.push({
        geo: new THREE.BoxGeometry(0.055, 0.24, 0.032),
        matrix: at(s * 0.055, 0.50, -0.14),
        color: FUR
      });
      parts.push({
        geo: new THREE.BoxGeometry(0.03, 0.17, 0.018),
        matrix: at(s * 0.055, 0.49, -0.16),
        color: EAR_IN
      });
      parts.push({
        geo: new THREE.BoxGeometry(0.07, 0.05, 0.17),
        matrix: at(s * 0.10, 0.03, 0.04),
        color: FUR
      });
    });

    return merge(parts);
  }

  /* Matériau commun aux décors : couleurs par sommet, facettes franches,
     éclairage diffus simple. Lambert suffit, ces objets n'ont pas de brillant. */
  function decorMaterial() {
    return new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true
    });
  }

  /* --- Skieur ------------------------------------------------------------
     Assemblé en primitives, orienté vers -z (le sens de la descente). Les
     membres sont des groupes séparés : ils s'animent, donc ils ne peuvent pas
     être fusionnés avec le reste. */
  function buildRider() {
    var group = new THREE.Group();

    /* Le squelette est découpé là où le corps se vrille réellement.

       Un skieur ne pivote pas d'un bloc : les skis tiennent la carre, les
       jambes les suivent, et le buste part le premier en ouvrant les épaules
       vers l'intérieur du virage. Pour que ça se voie, il faut trois pièces
       articulées séparément — et surtout que le buste tourne AUTOUR DES
       HANCHES, pas autour des pieds. Un seul groupe « corps » contenant les
       jambes, comme c'était le cas au départ, ne peut produire qu'un
       personnage rigide qui bascule en entier. */
    var HIP = 0.60;

    var legs = new THREE.Group();
    var upper = new THREE.Group();
    upper.position.y = HIP;
    group.add(legs, upper);

    var suit = new THREE.MeshLambertMaterial({ color: PAL.rider, flatShading: true });
    var pants = new THREE.MeshLambertMaterial({ color: 0x1d4e6b, flatShading: true });
    var skin = new THREE.MeshLambertMaterial({ color: DER.skin, flatShading: true });
    var hat = new THREE.MeshLambertMaterial({ color: PAL.beanie, flatShading: true });
    var gear = new THREE.MeshLambertMaterial({ color: PAL.ink, flatShading: true });

    function add(parent, geo, mat, x, y, z) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    }

    /* Skis — deux lames plates, relevées à l'avant. L'écartement est plus
       large que les jambes : vu de dos, c'est la seule façon qu'ils soient
       visibles, et sans eux le personnage n'a plus l'air de skier. */
    var STANCE = 0.23;
    var skis = new THREE.Group();
    group.add(skis);
    var skiGeo = new THREE.BoxGeometry(0.115, 0.038, 1.5);
    var tipGeo = new THREE.BoxGeometry(0.115, 0.038, 0.26);
    [-STANCE, STANCE].forEach(function (sx) {
      add(skis, skiGeo, gear, sx, 0.03, 0);
      var tip = add(skis, tipGeo, gear, sx, 0.085, -0.82);
      tip.rotation.x = 0.46;
    });

    /* Jambes fléchies, sous les hanches. Elles restent solidaires des skis :
       le jour passe entre elles et on lit la position de ski. */
    var thighGeo = new THREE.BoxGeometry(0.155, 0.34, 0.21);
    var shinGeo = new THREE.BoxGeometry(0.135, 0.30, 0.19);
    [-1, 1].forEach(function (side) {
      var thigh = add(legs, thighGeo, pants, side * 0.115, 0.46, 0.02);
      thigh.rotation.x = -0.30;
      var shin = add(legs, shinGeo, pants, side * STANCE * 0.62, 0.18, -0.03);
      shin.rotation.x = 0.22;
      add(legs, new THREE.BoxGeometry(0.14, 0.11, 0.24), gear, side * STANCE, 0.07, 0);
    });

    /* Tout ce qui suit appartient au buste, et ses coordonnées sont donc
       relatives aux hanches. */
    add(upper, new THREE.BoxGeometry(0.42, 0.50, 0.30), suit, 0, 0.80 - HIP, 0);

    var armGeo = new THREE.BoxGeometry(0.12, 0.40, 0.14);
    var armL = new THREE.Group();
    var armR = new THREE.Group();
    armL.position.set(-0.26, 0.97 - HIP, 0);
    armR.position.set(0.26, 0.97 - HIP, 0);
    upper.add(armL, armR);
    add(armL, armGeo, suit, 0, -0.18, 0);
    add(armR, armGeo, suit, 0, -0.18, 0);

    /* Bâtons, tenus vers l'arrière. */
    var poleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.92, 5);
    var poleL = add(armL, poleGeo, gear, 0, -0.30, 0.22);
    var poleR = add(armR, poleGeo, gear, 0, -0.30, 0.22);
    poleL.rotation.x = -0.55;
    poleR.rotation.x = -0.55;

    /* Tête, tuque et pompon — également relatifs aux hanches. */
    add(upper, new THREE.SphereGeometry(0.155, 10, 8), skin, 0, 1.18 - HIP, 0);
    var cap = add(upper, new THREE.SphereGeometry(0.175, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hat, 0, 1.21 - HIP, 0);
    cap.scale.set(1, 1.05, 1);
    add(upper, new THREE.CylinderGeometry(0.178, 0.178, 0.075, 10), hat, 0, 1.18 - HIP, 0);
    add(upper, new THREE.SphereGeometry(0.062, 8, 6), hat, 0, 1.37 - HIP, 0);

    /* Lunettes : une bande sombre, lisible même à petite taille. */
    var goggles = add(upper, new THREE.BoxGeometry(0.30, 0.085, 0.045), gear, 0, 1.21 - HIP, -0.13);
    goggles.rotation.x = -0.06;

    group.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    group.scale.setScalar(1.14);

    return {
      group: group,
      upper: upper,   // torse, bras, tête — pivote aux hanches
      legs: legs,     // cuisses, tibias, chaussures
      skis: skis,
      armL: armL,
      armR: armR
    };
  }

  /* --- Chalet d'arrivée ---------------------------------------------------
     Le repère qu'on voit grandir pendant les derniers cent mètres. Socle de
     pierre, murs de bois, larges baies vitrées éclairées de l'intérieur, gros
     toit à deux pentes enneigé et une cheminée. Tout en boîtes et en prismes :
     c'est un décor, il doit se lire en un coup d'œil à cent mètres et ne
     jamais coûter plus d'un appel de dessin. */
  function buildChalet() {
    var parts = [];
    var box = function (w, h, d) { return new THREE.BoxGeometry(w, h, d); };

    var BOIS = 0x6E4A32;
    var BOIS_CLAIR = 0x8C6244;
    var PIERRE = 0x7C7F86;
    var VITRE = 0xFFD98A;      // la lumière du dedans, vue du dehors
    var CADRE = 0x4A3325;

    /* Socle de pierre, un peu plus large que les murs : c'est ce débord qui
       fait qu'un chalet a l'air posé et non planté. */
    parts.push({ geo: box(7.4, 1.1, 5.6), color: PIERRE, matrix: at(0, 0.55, 0) });

    /* Corps en bois. */
    parts.push({ geo: box(6.8, 2.9, 5.0), color: BOIS, matrix: at(0, 2.55, 0) });

    /* Bandeau clair à mi-hauteur — sans lui les murs font bloc. */
    parts.push({ geo: box(6.9, 0.22, 5.1), color: BOIS_CLAIR, matrix: at(0, 3.3, 0) });

    /* Baies vitrées de la façade, encadrées. Trois grandes en bas, deux
       petites sous le pignon. */
    var vitres = [
      [-2.05, 2.30, 1.9, 1.5], [0, 2.30, 1.9, 1.5], [2.05, 2.30, 1.9, 1.5],
      [-1.15, 4.35, 1.1, 0.95], [1.15, 4.35, 1.1, 0.95]
    ];
    for (var v = 0; v < vitres.length; v++) {
      var g = vitres[v];
      parts.push({
        geo: box(g[2] + 0.22, g[3] + 0.22, 0.1), color: CADRE,
        matrix: at(g[0], g[1], 2.52)
      });
      parts.push({
        geo: box(g[2], g[3], 0.08), color: VITRE, matrix: at(g[0], g[1], 2.58)
      });
      /* Croisillon : deux barres suffisent à faire une fenêtre de montagne. */
      parts.push({ geo: box(0.07, g[3], 0.1), color: CADRE, matrix: at(g[0], g[1], 2.62) });
      parts.push({ geo: box(g[2], 0.07, 0.1), color: CADRE, matrix: at(g[0], g[1], 2.62) });
    }

    /* Pignon et toiture, derives d'UNE SEULE pente.

       L'ancienne version batissait le pignon sur un triangle equilateral :
       il faisait donc 4,24 de large pour un corps de 6,8 -- des trous aux
       deux extremites du mur -- et sa pente valait 60 deg quand le toit
       tombait a 35, ce qui ouvrait un coin vide entre les deux. Ici la pente
       du pignon EST celle des pans, et le pignon deborde du corps : plus
       aucun jour possible. Les nombres viennent d'un calcul, pas du reglage
       a l'oeil. */
    var PENTE = 0.6320;             // rad -- pignon et pans, la meme
    var FAITE = 6.426;             // hauteur du faite

    /* Prisme triangulaire : un cylindre a trois faces, aplati verticalement
       pour que ses aretes tombent pile sur PENTE.

       Le sommet d'un cylindre a 3 faces ainsi tourne pointe vers la GAUCHE,
       pas vers le haut -- c'etait le vrai trou du toit : la moitie du pignon
       manquait purement et simplement, quelle que soit la pente choisie.
       Cette derniere rotation redresse le triangle, sommet au faite, base
       horizontale en bas. Verifie sommet par sommet : la base tombe pile sur
       [-3,45, 3,45] et le sommet a Y=6,426, au dixieme de millimetre pres. */
    var pignon = new THREE.CylinderGeometry(3.9837, 3.9837, 5.0, 3, 1);
    pignon.rotateX(Math.PI / 2);
    pignon.rotateZ(Math.PI / 6);
    pignon.rotateZ(-Math.PI / 2);
    pignon.scale(1, 0.4227, 1);
    parts.push({ geo: pignon, color: BOIS, matrix: at(0, 4.742, 0) });

    /* Les deux pans, poses le long de cette pente : ils se croisent au faite
       et debordent largement du mur. La neige repose dessus, decalee le long
       de la normale au pan et non a la verticale -- sinon elle glisserait
       hors du toit du cote de la pente. */
    for (var c = -1; c <= 1; c += 2) {
      var mp = new THREE.Matrix4();
      mp.compose(
        new THREE.Vector3(c * 1.939, 5.006, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -c * PENTE)),
        new THREE.Vector3(1, 1, 1)
      );
      parts.push({ geo: box(5.046, 0.28, 6.4), color: CADRE, matrix: mp });

      var mn = new THREE.Matrix4();
      mn.compose(
        new THREE.Vector3(c * 2.092, 5.216, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -c * PENTE)),
        new THREE.Vector3(1, 1, 1)
      );
      parts.push({ geo: box(5.146, 0.24, 6.5), color: PAL.snow, matrix: mn });
    }

    /* Cheminée, et sa couronne de neige. */
    /* Cheminee : sa base est calculee SOUS la surface du toit a son abscisse,
       pour qu'elle le traverse au lieu de sembler pose dessus. */
    parts.push({ geo: box(0.85, 2.738, 0.85), color: PIERRE, matrix: at(-2.0, 6.131, -1.3) });
    parts.push({ geo: box(1.0, 0.2, 1.0), color: PAL.snow, matrix: at(-2.0, 7.600, -1.3) });

    /* Balcon : une simple avancée et sa rambarde. */
    parts.push({ geo: box(7.0, 0.16, 1.3), color: BOIS_CLAIR, matrix: at(0, 3.42, 3.0) });
    parts.push({ geo: box(7.0, 0.5, 0.12), color: BOIS_CLAIR, matrix: at(0, 3.75, 3.6) });

    return merge(parts);
  }

  /* --- Portique d'arrivée -------------------------------------------------
     Deux poteaux et une bannière à damier. Le damier est fait de vraies
     boîtes alternées plutôt que d'une texture : c'est le même nombre de
     triangles qu'un plan texturé une fois fusionné, et ça reste net de près
     comme de loin. */
  function buildFinishArch(spanHalf) {
    var parts = [];
    var box = function (w, h, d) { return new THREE.BoxGeometry(w, h, d); };
    var demi = spanHalf + 0.9;
    var haut = 4.6;

    for (var c = -1; c <= 1; c += 2) {
      parts.push({ geo: box(0.3, haut, 0.3), color: 0x2A3138, matrix: at(c * demi, haut / 2, 0) });
      parts.push({ geo: box(0.5, 0.28, 0.5), color: 0x1A1F24, matrix: at(c * demi, 0.14, 0) });
    }

    /* La bannière : deux rangées de carreaux alternés. */
    var cases = Math.max(8, Math.round(demi * 2 / 0.52));
    var pas = (demi * 2) / cases;
    for (var i = 0; i < cases; i++) {
      for (var r = 0; r < 2; r++) {
        var blanc = (i + r) % 2 === 0;
        parts.push({
          geo: box(pas, 0.42, 0.12),
          color: blanc ? 0xF7FAFC : 0x1A1F24,
          matrix: at(-demi + pas * (i + 0.5), haut - 0.24 - r * 0.42, 0)
        });
      }
    }
    parts.push({ geo: box(demi * 2 + 0.3, 0.14, 0.2), color: 0x2A3138, matrix: at(0, haut + 0.04, 0) });
    return merge(parts);
  }

  /* --- Tremplin de vitesse ------------------------------------------------
     Trois chevrons posés à plat sur la neige. Orientés vers l'aval, ils se
     lisent comme « passe ici » sans qu'aucun mot soit nécessaire. */
  function buildBoost() {
    var parts = [];
    for (var i = 0; i < 3; i++) {
      var chevron = new THREE.CylinderGeometry(0.62, 0.62, 0.09, 3, 1);
      var m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(0, 0.05, -i * 0.62 + 0.62),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),
        new THREE.Vector3(1.5, 1, 0.85)
      );
      parts.push({
        geo: chevron,
        color: i === 0 ? 0xFFE066 : (i === 1 ? 0xFFC93C : 0xFF9F1C),
        matrix: m
      });
    }
    return merge(parts);
  }

  AS.models = {
    merge: merge,
    at: at,
    buildPine: buildPine,
    buildRock: buildRock,
    buildLog: buildLog,
    buildBump: buildBump,
    buildHollowLog: buildHollowLog,
    buildBunnyMesh: buildBunnyMesh,
    buildRider: buildRider,
    buildChalet: buildChalet,
    buildFinishArch: buildFinishArch,
    buildBoost: buildBoost,
    decorMaterial: decorMaterial
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
