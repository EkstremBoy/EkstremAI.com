/* =========================================================================
   Alpine School — montage de la scène et caméra
   -------------------------------------------------------------------------
   Le monde ne se déplace pas : le skieur reste à z = 0 et c'est le relief qui
   défile sous lui. Tout ce qui a besoin d'une position absolue utilise
   `scroll`, la distance parcourue depuis le départ.

   La caméra ne colle pas au skieur. Elle le suit avec un ressort, ne reprend
   qu'une partie de son déport latéral, roule dans les virages et ouvre son
   champ avec la vitesse. C'est ce retard qui donne la sensation de poids.
   ========================================================================= */
(function (AS) {
  'use strict';

  var CAM = AS.CAMERA;
  var SUN = AS.SUN;
  var W = AS.WORLD;
  var DER = AS.DERIVED;
  var util = AS.util;
  var heightAt = AS.terrain.heightAt;

  function World(canvas, options) {
    options = options || {};
    this.reducedMotion = !!options.reducedMotion;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,           // l'antialiasing se fait sur la cible du post-traitement
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    /* Exposition volontairement haute : la neige au soleil doit friser le
       blanc, c'est là que sa dominante disparaît. */
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(DER.fog, W.FOG_DENSITY);

    this.camera = new THREE.PerspectiveCamera(CAM.FOV_BASE, 1, CAM.NEAR, CAM.FAR);
    this.camera.position.set(0, CAM.OFF_Y, CAM.OFF_Z);

    /* --- Lumière -------------------------------------------------------- */
    /* Direction du soleil vue depuis la scène. Le -z est l'avant de la
       descente : le soleil est donc devant-droite, un peu haut, ce qui jette
       les ombres des sapins en travers de la piste et vers nous. */
    this.sunDir = new THREE.Vector3(
      Math.sin(SUN.AZIMUTH) * Math.cos(SUN.ELEVATION),
      Math.sin(SUN.ELEVATION),
      -Math.cos(SUN.AZIMUTH) * Math.cos(SUN.ELEVATION)
    ).normalize();

    this.sunLight = new THREE.DirectionalLight(DER.sunLight, SUN.INTENSITY);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(SUN.SHADOW_MAP, SUN.SHADOW_MAP);
    this.sunLight.shadow.camera.near = SUN.SHADOW_NEAR;
    this.sunLight.shadow.camera.far = SUN.SHADOW_FAR;
    this.sunLight.shadow.camera.left = -SUN.SHADOW_HALF;
    this.sunLight.shadow.camera.right = SUN.SHADOW_HALF;
    this.sunLight.shadow.camera.top = SUN.SHADOW_HALF;
    this.sunLight.shadow.camera.bottom = -SUN.SHADOW_HALF;
    /* Sans ce biais, la neige se couvre d'acné d'ombre : la surface est très
       inclinée par rapport au soleil rasant. */
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.06;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.hemi = new THREE.HemisphereLight(DER.hemiSky, DER.hemiGround, SUN.HEMI);
    this.scene.add(this.hemi);

    /* --- Décor ---------------------------------------------------------- */
    this.backdrop = new AS.sky.Backdrop();
    this.scene.add(this.backdrop.dome, this.backdrop.group, this.backdrop.sun);

    this.terrain = new AS.terrain.Terrain();
    this.scene.add(this.terrain.mesh);

    this.forest = new AS.forest.Forest();
    for (var i = 0; i < this.forest.meshes.length; i++) {
      this.scene.add(this.forest.meshes[i]);
    }

    this.props = new AS.props.Props();
    this.scene.add(this.props.group);

    this.gates = new AS.gates.Gates();
    this.scene.add(this.gates.group);

    this.finish = new AS.finish.Finish();
    this.scene.add(this.finish.group);

    this.rider = AS.models.buildRider();
    this.scene.add(this.rider.group);

    this.wildlife = new AS.wildlife.Wildlife();
    this.bird = new AS.wildlife.Bird();
    this.crowd = new AS.wildlife.BunnyCrowd();
    this.scene.add(this.wildlife.group, this.bird.group, this.crowd.mesh);

    /* Le skieur transformé en lapin. Il existe dès le départ mais reste
       caché : le faire naître en pleine partie provoquerait une compilation
       de nuanceur, donc un à-coup, pile au moment du choix. */
    this.bunnyRider = new THREE.Mesh(
      AS.models.buildBunnyMesh(), AS.models.decorMaterial()
    );
    this.bunnyRider.castShadow = true;
    this.bunnyRider.visible = false;
    this.bunnyRider.scale.setScalar(2.4);
    this.scene.add(this.bunnyRider);

    this.confetti = new AS.particles.Confetti();
    this.scene.add(this.confetti.points);

    this.spray = new AS.particles.Spray();
    this.flakes = new AS.particles.Flakes();
    this.trail = new AS.particles.Trail();
    this.scene.add(this.spray.points, this.flakes.points, this.trail.mesh);

    this.post = new AS.post.Post(this.renderer);
    this.post.uniforms.uMotion.value = this.reducedMotion ? 0 : 1;

    /* --- État de caméra -------------------------------------------------- */
    this.camPos = new THREE.Vector3(0, CAM.OFF_Y, CAM.OFF_Z);
    this.camLook = new THREE.Vector3(0, 1, -CAM.LOOK_AHEAD);
    this.camRoll = 0;
    this.shake = 0;
    this.flash = 0;
    this.flashColor = new THREE.Color(0xffffff);
    this.time = 0;

    this._normal = new THREE.Vector3();
    this._sunPos = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this._project = new THREE.Vector3();
    this.minFov = CAM.FOV_BASE;

    /* Trois inclinaisons distinctes, du plus vif au plus lent : c'est leur
       décalage qui fait le geste de skieur. Voir updateRider(). */
    this.upperLean = 0;
    this.bankLean = 0;
    this.skiLean = 0;

    this.resize();
  }

  World.prototype.resize = function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.minFov = this.computeMinFov(this.camera.aspect);
    if (this.camera.fov < this.minFov) this.camera.fov = this.minFov;
    this.camera.updateProjectionMatrix();
    this.post.setSize(this.renderer);
  };

  World.prototype.reset = function () {
    this.forest.reset();
    this.props.reset();
    this.gates.reset();
    this.finish.reset();
    this.wildlife.reset();
    this.bird.reset();
    this.crowd.setActive(false);
    this.setEffects(null);
    this.spray.reset();
    this.confetti.reset();
    this.trail.reset();
    this.camPos.set(0, CAM.OFF_Y, CAM.OFF_Z);
    this.camRoll = 0;
    this.shake = 0;
    this.flash = 0;
    this.time = 0;
    this.upperLean = 0;
    this.bankLean = 0;
    this.skiLean = 0;
  };

  World.prototype.kick = function (amount) {
    if (this.reducedMotion) return;
    this.shake = Math.max(this.shake, amount);
  };

  World.prototype.setFlash = function (colorHex, amount) {
    if (this.reducedMotion) return;
    this.flashColor.setHex(colorHex);
    this.flash = amount;
  };

  /* --- Effets du Crazy Mode ----------------------------------------------
     Tout ce que les folies changent dans le décor passe par ici. Les valeurs
     visées sont posées d'un coup ; c'est updateEffects() qui y amène la scène
     en douceur, image après image — un brouillard qui tombe d'un seul coup
     ressemble à un bug d'affichage. */
  World.prototype.setEffects = function (fx) {
    this.fxTarget = fx || {
      fog: 1, mogul: 1, night: 0, bunny: false
    };
    if (!this.fxNow) {
      this.fxNow = { fog: 1, mogul: 1, night: 0 };
    }
  };

  World.prototype.updateEffects = function (dt) {
    var target = this.fxTarget;
    var now = this.fxNow;

    now.fog = util.damp(now.fog, target.fog, 2.2, dt);
    now.mogul = util.damp(now.mogul, target.mogul, 2.6, dt);
    now.night = util.damp(now.night, target.night, 1.6, dt);

    var base = this.quizFog ? W.FOG_DENSITY_QUIZ : W.FOG_DENSITY;
    this.scene.fog.density = base * now.fog;
    this.terrain.setMogul(now.mogul);

    /* Tombée du jour : la lumière faiblit et bleuit, le ciel s'assombrit.
       On interpole entre deux ambiances plutôt que d'en recalculer une. */
    var n = now.night;
    if (Math.abs(n - (this._lastNight === undefined ? -1 : this._lastNight)) > 0.004) {
      this._lastNight = n;
      this.sunLight.intensity = SUN.INTENSITY * (1 - n * 0.62);
      this.sunLight.color.setHex(DER.sunLight).lerp(new THREE.Color(0xffc48a), n);
      this.hemi.intensity = SUN.HEMI * (1 - n * 0.35);
      this.hemi.color.setHex(DER.hemiSky).lerp(new THREE.Color(0x4d6d9e), n);
      var duskFog = new THREE.Color(DER.fog).lerp(new THREE.Color(0x6b7fa6), n);
      this.scene.fog.color.copy(duskFog);
      this.backdrop.dome.material.uniforms.uTop.value
        .setHex(AS.PALETTE.skyTop).lerp(new THREE.Color(0x1d3566), n);
      this.backdrop.dome.material.uniforms.uHorizon.value.copy(duskFog);
      this.renderer.toneMappingExposure = 1.08 * (1 - n * 0.18);
    }

    var bunny = !!target.bunny;
    this.crowd.setActive(bunny);
    this.bunnyRider.visible = bunny;
    this.rider.group.visible = !bunny;
  };

  /* --- Skieur ------------------------------------------------------------
     Il s'incline dans ses virages, se pose sur la pente et se recroqueville
     un peu à l'atterrissage. */
  World.prototype.updateRider = function (state, dt) {
    var group = this.rider.group;
    var ground = heightAt(state.x, state.scroll);
    var carve = util.clamp(state.vx / AS.PHYSICS.VX_MAX, -1, 1);
    var dir = state.dir || 0;

    group.position.set(state.x, ground + state.height, 0);

    AS.terrain.normalAt(state.x, state.scroll, this._normal);
    /* Le skieur épouse la pente au sol, mais reste à plat en l'air. */
    var conform = state.airborne ? 0 : 1;
    group.rotation.x = util.damp(group.rotation.x, Math.atan(this._normal.z / this._normal.y) * conform, 9, dt);

    /* --- L'ordre du virage -----------------------------------------------
       Un skieur amorce par le haut du corps : les épaules et le regard
       partent dans le virage, le bassin suit, les skis viennent en dernier.
       On modélise ça avec trois inclinaisons aux constantes de temps
       décroissantes, et surtout deux SIGNAUX différents :

         — le buste suit la TOUCHE (dir), donc il bouge dès l'appui ;
         — le bassin et les skis suivent la VITESSE LATÉRALE, qui met un
           moment à s'établir.

       C'est ce décalage qui rend le geste naturel. L'inverse — skis d'abord,
       épaules ensuite — donne l'impression de déraper. */
    var air = state.airborne ? 0.45 : 1;
    this.upperLean = util.damp(this.upperLean, dir * air, 14, dt);
    this.bankLean = util.damp(this.bankLean, carve, 5.5, dt);
    this.skiLean = util.damp(this.skiLean, carve, 3.4, dt);

    /* Inclinaison d'ensemble : le skieur se couche VERS L'INTÉRIEUR du virage,
       comme un cycliste. D'où le signe négatif — un z positif ferait pencher
       la tête du mauvais côté, ce qui se lit immédiatement comme faux. */
    group.rotation.z = -this.bankLean * 0.34;
    /* Dérapage d'arrivée : le skieur se met franchement en travers. On
       l'ajoute au léger pivot du carving plutôt que de le remplacer, sinon la
       mise en travers partirait d'un coup au lieu de s'enchaîner au dernier
       virage. */
    group.rotation.y = -this.bankLean * 0.10 + (state.driftYaw || 0);

    /* Le buste, lui, ne suit pas la vitesse latérale mais la TOUCHE : il part
       à l'instant de l'appui, avant que le ski n'ait mordu. Les épaules
       ouvrent vers l'intérieur du virage et le regard va chercher la sortie. */
    var upper = this.rider.upper;
    upper.rotation.y = -this.upperLean * 0.46;
    upper.rotation.z = -this.upperLean * 0.22;
    upper.rotation.x = util.damp(
      upper.rotation.x,
      state.airborne ? -0.20 : 0.16 + state.speed01 * 0.22,
      7, dt
    );

    /* Les bras accompagnent le buste, donc ils partent avec lui. */
    this.rider.armL.rotation.z = 0.34 + this.upperLean * 0.30;
    this.rider.armR.rotation.z = -0.34 + this.upperLean * 0.30;

    /* Les jambes relaient, les skis ferment la marche. Aucun terme rapide ne
       les touche : c'est la condition pour qu'ils ne partent jamais les
       premiers. */
    this.rider.legs.rotation.y = -this.skiLean * 0.16;
    this.rider.skis.rotation.y = -this.skiLean * 0.30;

    /* Enfoncé dans un banc de neige : SEULS les skis et le bas des bottes
       passent sous la surface, où le sol les masque naturellement. Le skieur,
       lui, ne descend pas — une bosse est un relief, pas un trou, et le voir
       plonger tout entier donnait exactement l'impression inverse. Ce sont
       les jambes qui absorbent, comme un genou qui plie. */
    var sink = state.sinking ? Math.min(1, state.sinking / 0.55) : 0;
    this.rider.skis.position.y = -sink * 0.34;
    this.rider.legs.position.y = -sink * 0.09;

    /* Mode lapin : le skieur laisse place à un lapin qui dévale en bonds. Il
       n'a pas de squelette articulé — le rebond et l'inclinaison suffisent
       largement à le rendre vivant. */
    if (this.bunnyRider.visible) {
      this.bunnyHop = (this.bunnyHop || 0) + dt * (7 + state.speed01 * 5);
      var bounce = Math.abs(Math.sin(this.bunnyHop)) * 0.34;
      this.bunnyRider.position.set(state.x, ground + state.height + bounce, 0);
      this.bunnyRider.rotation.z = -this.bankLean * 0.30;
      this.bunnyRider.rotation.y = -this.upperLean * 0.40;
      this.bunnyRider.rotation.x = Math.sin(this.bunnyHop) * 0.16 + group.rotation.x;
    }

    return ground;
  };

  /* --- Caméra ------------------------------------------------------------ */
  World.prototype.updateCamera = function (state, dt) {
    var followX = state.x * CAM.FOLLOW_X;
    var ground = heightAt(followX, state.scroll);

    var targetY = ground + CAM.OFF_Y + state.height * 0.55;
    this._tmp.set(followX, targetY, CAM.OFF_Z);

    /* Ressort : la caméra rejoint sa cible sans jamais l'atteindre tout à
       fait, donc elle traîne dans les changements de direction. */
    this.camPos.x = util.damp(this.camPos.x, this._tmp.x, CAM.STIFFNESS, dt);
    this.camPos.y = util.damp(this.camPos.y, this._tmp.y, CAM.STIFFNESS * 1.5, dt);
    this.camPos.z = this._tmp.z;

    var aheadZ = CAM.LOOK_AHEAD;
    var aheadY = heightAt(state.x * 0.5, state.scroll + aheadZ) + CAM.LOOK_Y;
    this.camLook.x = util.damp(this.camLook.x, state.x * 0.42, CAM.STIFFNESS * 0.8, dt);
    this.camLook.y = util.damp(this.camLook.y, aheadY + state.height * 0.35, 6, dt);
    this.camLook.z = -aheadZ;

    this.camera.position.copy(this.camPos);

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.6);
      var s = this.shake * this.shake * 0.34;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s * 0.8;
    }

    this.camera.lookAt(this.camLook);

    var rollTarget = -util.clamp(state.vx / AS.PHYSICS.VX_MAX, -1, 1) * CAM.ROLL;
    this.camRoll = util.damp(this.camRoll, rollTarget, 5.5, dt);
    this.camera.rotateZ(this.camRoll);

    var fov = util.lerp(CAM.FOV_BASE, CAM.FOV_MAX, state.speed01 * state.speed01);
    fov = Math.max(fov, this.minFov);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = util.damp(this.camera.fov, fov, 3.2, dt);
      this.camera.updateProjectionMatrix();
    }
  };

  /* Champ vertical minimal permettant de conserver, sur l'écran courant, à
     peu près l'ouverture horizontale prévue pour un 16/9. Sur un écran plus
     large que prévu il ne change rien ; sur un portrait il ouvre en grand. */
  World.prototype.computeMinFov = function (aspect) {
    var designHalfV = THREE.MathUtils.degToRad(CAM.FOV_BASE) * 0.5;
    var halfH = Math.atan(Math.tan(designHalfV) * CAM.DESIGN_ASPECT);
    var needed = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfH) / aspect));
    return util.clamp(needed, CAM.FOV_BASE, CAM.FOV_PORTRAIT_MAX);
  };

  /* --- Une image --------------------------------------------------------- */
  World.prototype.update = function (state, dt) {
    this.time += dt;
    this.quizFog = !!state.quiz;
    var travelled = state.travelled;

    this.setEffects(state.crazy ? AS.crazy.effects : null);
    this.updateEffects(dt);

    var ground = this.updateRider(state, dt);
    this.updateCamera(state, dt);

    this.terrain.setScroll(state.scroll);
    this.forest.update(state.scroll, travelled);
    this.props.update(state.scroll, travelled, dt);
    this.gates.update(state.scroll, travelled);
    this.finish.update(state.scroll, travelled, dt);
    /* Ni lapin ni oiseau dans les modes à questions : le mouvement d'un
       animal attire l'œil, or c'est précisément l'œil dont on a besoin pour
       lire les pancartes. */
    var quiz = state.mode === 'words' || state.mode === 'math';
    if (!quiz) {
      this.wildlife.update(dt, state.scroll, travelled);
      this.bird.update(dt, state.scroll, travelled);
    } else {
      this.wildlife.group.visible = false;
      this.bird.group.visible = false;
    }
    this.crowd.update(state.scroll, travelled);

    /* Gerbe de neige : elle ne part que si on mord vraiment, et jamais en
       l'air — il n'y a rien à projeter. */
    var carve = Math.abs(state.vx) / AS.PHYSICS.VX_MAX;
    if (!state.airborne && carve > 0.38 && state.running) {
      this.spray.emit(state.x, ground, Math.sign(state.vx), (carve - 0.38) / 0.62, state.speed, dt);
    } else if (state.finished && state.speed > 2) {
      /* Le dérapage d'arrivée projette bien plus qu'un virage : c'est toute
         la carre qui racle. Le côté suit le sens de la mise en travers. */
      this.spray.emit(state.x, ground, state.driftYaw > 0 ? 1 : -1, 1, state.speed * 1.5, dt);
    }
    this.spray.update(dt, travelled);
    this.confetti.update(dt, travelled);
    this.flakes.update(dt, travelled, this.camPos.x);
    this.trail.update(dt, travelled, state.x, ground, state.vx, state.airborne);

    this.backdrop.update(this.camera, state.x);

    /* Le soleil et son volume d'ombre suivent le joueur : la carte d'ombre
       reste ainsi concentrée là où on regarde. */
    this._sunPos.copy(this.camera.position).addScaledVector(this.sunDir, SUN.DIST);
    this.sunLight.position.copy(this._sunPos);
    this.sunLight.target.position.set(state.x * 0.4, ground, -SUN.SHADOW_FOCUS_Z);
    this.sunLight.target.updateMatrixWorld();
    this.backdrop.placeSun(this.camera, this.sunDir);

    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3.4);

    this.post.uniforms.uTime.value = this.time;
    this.post.uniforms.uSpeed.value = state.speed01;
    /* Le flash doit se voir du coin de l'œil, pas noyer la piste : c'est un
       jeu pour enfants, et on y enchaîne les portes. */
    this.post.uniforms.uFlash.value = Math.min(this.flash, 1) * 0.26;
    this.post.uniforms.uFlashColor.value.copy(this.flashColor);
    this.post.setSun(this.backdrop.sun.position, this.camera);
  };

  World.prototype.render = function () {
    this.post.render(this.renderer, this.scene, this.camera);
  };

  /* Position à l'écran, en pixels CSS, d'un point du monde. Sert à poser les
     bonus juste au-dessus de la pancarte qu'on vient de franchir. */
  World.prototype.toScreen = function (x, y, z, out) {
    this._project.set(x, y, z).project(this.camera);
    out.x = (this._project.x * 0.5 + 0.5) * window.innerWidth;
    out.y = (1 - (this._project.y * 0.5 + 0.5)) * window.innerHeight;
    return out;
  };

  AS.World = World;
})((window.AlpineSchool = window.AlpineSchool || {}));
