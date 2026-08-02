/* =========================================================================
   Alpine School — portiques et pancartes
   -------------------------------------------------------------------------
   Une porte, c'est n pancartes, une par case de la piste. Leur largeur est le
   seul levier de la difficulté de descente : plus elles sont étroites, plus
   les trous entre elles sont grands, et passer dans un trou compte comme une
   erreur.

   Le texte est dessiné dans un canvas hors écran puis appliqué en texture. La
   taille de police est MESURÉE et réduite jusqu'à ce que le mot tienne :
   `neighbourhood` doit s'afficher en entier même sur une pancarte experte.
   C'est le piège n°3 du briefing, et la raison d'être de fitFont().
   ========================================================================= */
(function (AS) {
  'use strict';

  var P = AS.PHYSICS;
  var PANEL = AS.PANEL;
  var PAL = AS.PALETTE;
  var DER = AS.DERIVED;
  var W = AS.WORLD;
  var heightAt = AS.terrain.heightAt;

  var GATE_POOL = 3;
  var MAX_PANELS = 3;

  /* --- Texture de texte -------------------------------------------------- */
  var textureCache = new Map();
  var CACHE_MAX = 72;
  var fontReady = false;

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fontReady = true; });
  } else {
    fontReady = true;
  }

  function fontStack() {
    return (fontReady ? "'Fredoka', " : '') + "'Nunito', system-ui, sans-serif";
  }

  /* Cherche la plus grande police qui tienne dans la boîte. On part d'une
     estimation puis on descend d'un pixel à la fois : c'est quelques
     itérations au pire, et c'est la seule façon d'avoir une garantie plutôt
     qu'une espérance. */
  function fitFont(ctx, text, maxW, maxH) {
    var size = Math.floor(maxH);
    ctx.font = '600 ' + size + 'px ' + fontStack();
    var width = ctx.measureText(text).width;
    if (width > maxW) {
      size = Math.max(6, Math.floor(size * (maxW / width)));
    }
    for (var guard = 0; guard < 200; guard++) {
      ctx.font = '600 ' + size + 'px ' + fontStack();
      if (ctx.measureText(text).width <= maxW || size <= 6) break;
      size--;
    }
    return size;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeTexture(text, aspect) {
    var key = text + '@' + aspect.toFixed(2) + (fontReady ? '#f' : '#n');
    var cached = textureCache.get(key);
    if (cached) return cached;

    var cw = 512;
    var ch = Math.round(Math.max(140, Math.min(512, cw / aspect)));
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');

    /* Marges serrées : sur une pancarte experte, la largeur est la ressource
       rare — chaque pixel rendu au texte est de la lisibilité gagnée sur un
       mot comme `neighbourhood`. */
    var pad = Math.round(ch * 0.05);
    var radius = Math.round(ch * 0.14);

    /* Fond : blanc en haut, très légèrement bleuté en bas. Un aplat pur fait
       autocollant ; ce dégradé suffit à poser la pancarte dans la lumière. */
    var grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#eaf3fa');
    ctx.fillStyle = grad;
    roundRect(ctx, pad, pad, cw - pad * 2, ch - pad * 2, radius);
    ctx.fill();

    ctx.strokeStyle = '#1d4e6b';
    ctx.lineWidth = Math.max(3, Math.round(ch * 0.032));
    roundRect(ctx, pad, pad, cw - pad * 2, ch - pad * 2, radius);
    ctx.stroke();

    var maxW = cw - pad * 2 - ctx.lineWidth * 2 - ch * 0.06;
    var maxH = (ch - pad * 2) * 0.66;
    var size = fitFont(ctx, text, maxW, maxH);

    ctx.fillStyle = '#123047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 ' + size + 'px ' + fontStack();
    ctx.fillText(text, cw / 2, ch / 2 + size * 0.03);

    var tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;

    if (textureCache.size >= CACHE_MAX) {
      var oldestKey = textureCache.keys().next().value;
      var old = textureCache.get(oldestKey);
      if (old) old.dispose();
      textureCache.delete(oldestKey);
    }
    textureCache.set(key, tex);
    return tex;
  }

  /* --- Pancartes du Crazy Mode -------------------------------------------
     Pas de mot à lire mais un pictogramme, parce qu'on n'a qu'une poignée de
     secondes pour choisir et qu'un dessin se reconnaît plus vite qu'une
     phrase. Le nom reste écrit dessous, en petit, pour lever le doute la
     première fois qu'on croise une folie. */
  function drawIcon(ctx, kind, cx, cy, size, ink) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = Math.max(3, size * 0.085);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var u = size * 0.5;

    function tri(x, y, w, h) {
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x - w, y);
      ctx.closePath();
      ctx.fill();
    }
    function arrow(x, y, len, dir) {
      ctx.beginPath();
      ctx.moveTo(x - dir * len * 0.5, y);
      ctx.lineTo(x + dir * len * 0.5, y);
      ctx.moveTo(x + dir * len * 0.5, y);
      ctx.lineTo(x + dir * len * 0.2, y - len * 0.24);
      ctx.moveTo(x + dir * len * 0.5, y);
      ctx.lineTo(x + dir * len * 0.2, y + len * 0.24);
      ctx.stroke();
    }

    switch (kind) {
      case 'forest':
        tri(-u * 0.62, u * 0.55, u * 0.34, u * 0.95);
        tri(u * 0.62, u * 0.55, u * 0.34, u * 0.95);
        tri(0, u * 0.80, u * 0.46, u * 1.35);
        break;

      case 'mirror':
        arrow(0, -u * 0.34, u * 1.25, -1);
        arrow(0, u * 0.42, u * 1.25, 1);
        break;

      case 'logs':
        for (var i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(-u * 0.85, i * u * 0.62 - u * 0.14, u * 1.7, u * 0.28, u * 0.14)
            : ctx.rect(-u * 0.85, i * u * 0.62 - u * 0.14, u * 1.7, u * 0.28);
          ctx.fill();
        }
        break;

      case 'ice':
        for (var a = 0; a < 3; a++) {
          var ang = (a * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(-Math.cos(ang) * u, -Math.sin(ang) * u);
          ctx.lineTo(Math.cos(ang) * u, Math.sin(ang) * u);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, u * 0.22, 0, 6.2832);
        ctx.fill();
        break;

      case 'fog':
        for (var f = -1; f <= 1; f++) {
          ctx.beginPath();
          ctx.moveTo(-u * 0.95, f * u * 0.55);
          ctx.bezierCurveTo(-u * 0.3, f * u * 0.55 - u * 0.3,
            u * 0.3, f * u * 0.55 + u * 0.3, u * 0.95, f * u * 0.55);
          ctx.stroke();
        }
        break;

      case 'rush':
        for (var r = -1; r <= 1; r++) {
          ctx.beginPath();
          ctx.moveTo(r * u * 0.55 - u * 0.35, -u * 0.7);
          ctx.lineTo(r * u * 0.55 + u * 0.2, 0);
          ctx.lineTo(r * u * 0.55 - u * 0.35, u * 0.7);
          ctx.stroke();
        }
        break;

      case 'moguls':
        ctx.beginPath();
        ctx.moveTo(-u, u * 0.5);
        for (var m = 0; m <= 40; m++) {
          var t = m / 40;
          ctx.lineTo(-u + t * 2 * u, u * 0.5 - Math.abs(Math.sin(t * Math.PI * 2.4)) * u * 0.95);
        }
        ctx.stroke();
        break;

      case 'tiny':
        tri(-u * 0.45, u * 0.85, u * 0.52, u * 1.5);
        tri(u * 0.62, u * 0.85, u * 0.20, u * 0.55);
        break;

      case 'night':
        /* Croissant obtenu par remplissage pair-impair de deux disques, et
           non en effaçant par-dessus : l'effacement laissait un trou dans le
           fond dégradé de la pancarte, ce qui donnait ce rendu translucide
           désagréable. Ici le croissant est une forme pleine. */
        ctx.beginPath();
        ctx.arc(u * 0.16, u * 0.05, u * 0.80, 0, 6.2832);
        ctx.arc(u * 0.62, -u * 0.24, u * 0.76, 0, 6.2832);
        ctx.fill('evenodd');
        /* Trois étoiles, tailles décroissantes, pour lire « nuit » et pas
           « lune » tout court. */
        [[-0.72, -0.52, 0.13], [-0.38, -0.82, 0.085], [-0.86, 0.10, 0.07]]
          .forEach(function (st) {
            ctx.beginPath();
            for (var k = 0; k < 8; k++) {
              var ang = (k / 8) * 6.2832 - 1.5708;
              var rad = u * st[2] * (k % 2 ? 0.42 : 1);
              var px = u * st[0] + Math.cos(ang) * rad;
              var py = u * st[1] + Math.sin(ang) * rad;
              if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          });
        break;

      case 'nojump':
        /* Une flèche vers le haut, barrée. Deux règles en un dessin : on
           saute normalement, ici on ne peut pas. */
        ctx.lineWidth = Math.max(4, size * 0.11);
        ctx.beginPath();
        ctx.moveTo(0, u * 0.72);
        ctx.lineTo(0, -u * 0.55);
        ctx.moveTo(0, -u * 0.72);
        ctx.lineTo(-u * 0.40, -u * 0.24);
        ctx.moveTo(0, -u * 0.72);
        ctx.lineTo(u * 0.40, -u * 0.24);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, u * 0.94, 0, 6.2832);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-u * 0.70, u * 0.70);
        ctx.lineTo(u * 0.70, -u * 0.70);
        ctx.stroke();
        break;

      case 'mystery':
        /* Point d'interrogation tracé au trait : la courbe du haut, la hampe,
           et le point. Dessiné plutôt qu'écrit pour rester net à toutes les
           tailles et ne dépendre d'aucune police. */
        ctx.lineWidth = Math.max(5, size * 0.15);
        ctx.beginPath();
        ctx.arc(0, -u * 0.34, u * 0.46, Math.PI * 0.92, Math.PI * 0.30, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(u * 0.30, -u * 0.06);
        ctx.lineTo(0, u * 0.28);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, u * 0.28);
        ctx.lineTo(0, u * 0.44);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, u * 0.86, u * 0.13, 0, 6.2832);
        ctx.fill();
        break;

      case 'bunny':
        ctx.beginPath();
        ctx.ellipse(0, u * 0.38, u * 0.52, u * 0.44, 0, 0, 6.2832);
        ctx.fill();
        [-1, 1].forEach(function (s) {
          ctx.beginPath();
          ctx.ellipse(s * u * 0.26, -u * 0.42, u * 0.15, u * 0.52, s * 0.16, 0, 6.2832);
          ctx.fill();
        });
        break;
    }
    ctx.restore();
  }

  var iconCache = new Map();

  function makeIconTexture(mod, aspect) {
    var key = mod.id + '@' + aspect.toFixed(2) + '#' + (AS.i18n ? AS.i18n.get() : 'fr');
    var cached = iconCache.get(key);
    if (cached) return cached;

    var cw = 512;
    var ch = Math.round(Math.max(200, Math.min(640, cw / aspect)));
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');

    var pad = Math.round(ch * 0.05);
    var radius = Math.round(ch * 0.12);
    var accent = mod.bonus ? '#FFF4D6' : '#FFFFFF';

    var grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, mod.bonus ? '#FFE7A8' : '#e7f1fa');
    ctx.fillStyle = grad;
    roundRect(ctx, pad, pad, cw - pad * 2, ch - pad * 2, radius);
    ctx.fill();

    var ink = mod.bonus ? '#7A4A08' : '#1d4e6b';
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(4, Math.round(ch * 0.035));
    roundRect(ctx, pad, pad, cw - pad * 2, ch - pad * 2, radius);
    ctx.stroke();

    var iconSize = Math.min(cw * 0.42, ch * 0.52);
    drawIcon(ctx, mod.icon, cw / 2, ch * 0.44, iconSize, ink);

    var name = AS.modifierLabel(mod);
    var maxW = cw - pad * 2 - ch * 0.10;
    var size = fitFont(ctx, name, maxW, ch * 0.19);
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 ' + size + 'px ' + fontStack();
    ctx.fillText(name, cw / 2, ch * 0.83);

    var tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (iconCache.size >= 40) {
      var oldest = iconCache.keys().next().value;
      var old = iconCache.get(oldest);
      if (old) old.dispose();
      iconCache.delete(oldest);
    }
    iconCache.set(key, tex);
    return tex;
  }

  /* --- Géométrie partagée ------------------------------------------------ */
  /* Le plan de Three regarde déjà +z, et la caméra est en +z : la pancarte
     nous fait donc face sans rien retourner. */
  var signGeo = new THREE.PlaneGeometry(1, 1);
  var postGeo = new THREE.BoxGeometry(1, 1, 1);

  /* --- Une pancarte ------------------------------------------------------ */
  function Panel() {
    this.group = new THREE.Group();

    this.backing = new THREE.Mesh(
      signGeo,
      new THREE.MeshBasicMaterial({ color: PAL.good, transparent: true, opacity: 0 })
    );
    this.backing.position.z = -0.035;   // juste derrière la pancarte

    this.sign = new THREE.Mesh(
      signGeo,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
    );

    this.postL = new THREE.Mesh(postGeo, new THREE.MeshLambertMaterial({ color: DER.post }));
    this.postR = new THREE.Mesh(postGeo, new THREE.MeshLambertMaterial({ color: DER.post }));
    this.postL.castShadow = this.postR.castShadow = true;

    this.group.add(this.backing, this.sign, this.postL, this.postR);
    this.group.visible = false;

    this.x = 0;
    this.w = 1;
    this.h = 1;
    this.correct = false;
    this.text = '';
    this.modifier = null;   // renseigné en Crazy Mode
  }

  /* Pancarte de choix : même carcasse, mais une icône à la place du mot, et
     une hauteur plus généreuse — on la regarde de loin. */
  Panel.prototype.setIcon = function (mod, x, width) {
    this.text = mod.id;
    this.x = x;
    this.w = width;
    this.h = AS.util.clamp(width * 0.62, 1.25, 1.9);
    this.correct = false;

    this.sign.material.map = makeIconTexture(mod, this.w / this.h);
    this.sign.material.color.setHex(0xffffff);
    this.sign.material.needsUpdate = true;

    this.sign.scale.set(this.w * 0.97, this.h, 1);
    this.backing.scale.set(this.w * 0.97 + 0.1, this.h + 0.1, 1);
    this.backing.material.opacity = 0;

    var postW = Math.min(0.08, this.w * 0.07);
    var inset = this.w * 0.5 - postW * 2.2;
    this.postL.scale.set(postW, PANEL.POST_HEIGHT, postW);
    this.postR.scale.set(postW, PANEL.POST_HEIGHT, postW);
    this.postL.position.set(-inset, -this.h * 0.5 - PANEL.POST_HEIGHT * 0.5, 0);
    this.postR.position.set(inset, -this.h * 0.5 - PANEL.POST_HEIGHT * 0.5, 0);

    this.group.position.x = x;
    this.group.position.y = PANEL.POST_HEIGHT + this.h * 0.5;
    this.group.visible = true;
  };

  Panel.prototype.set = function (text, x, width, correct) {
    this.text = text;
    this.x = x;
    this.w = width;
    this.h = AS.util.clamp(width * PANEL.HEIGHT_RATIO, PANEL.HEIGHT_MIN, PANEL.HEIGHT_MAX);
    this.correct = correct;

    var tex = makeTexture(text, this.w / this.h);
    this.sign.material.map = tex;
    this.sign.material.color.setHex(0xffffff);
    this.sign.material.needsUpdate = true;

    this.sign.scale.set(this.w, this.h, 1);
    this.backing.scale.set(this.w + 0.13, this.h + 0.13, 1);
    this.backing.material.opacity = 0;

    var postW = Math.min(0.07, this.w * 0.09);
    var inset = this.w * 0.5 - postW * 1.7;
    this.postL.scale.set(postW, PANEL.POST_HEIGHT, postW);
    this.postR.scale.set(postW, PANEL.POST_HEIGHT, postW);
    this.postL.position.set(-inset, -this.h * 0.5 - PANEL.POST_HEIGHT * 0.5, 0);
    this.postR.position.set(inset, -this.h * 0.5 - PANEL.POST_HEIGHT * 0.5, 0);

    this.group.position.x = x;
    this.group.position.y = PANEL.POST_HEIGHT + this.h * 0.5;
    this.group.visible = true;
  };

  /* Après le franchissement : vert si c'était la bonne pancarte, rouge si
     c'est celle qu'on a choisie à tort. Le fond est teinté et un liseré
     coloré apparaît derrière — le texte reste sombre, donc lisible. */
  Panel.prototype.reveal = function (correct, chosen) {
    if (correct) {
      this.sign.material.color.setHex(0xb6ecc9);
      this.backing.material.color.setHex(PAL.good);
      this.backing.material.opacity = 0.95;
    } else if (chosen) {
      this.sign.material.color.setHex(0xffc4bd);
      this.backing.material.color.setHex(PAL.bad);
      this.backing.material.opacity = 0.95;
    }
  };

  /* --- Une porte --------------------------------------------------------- */
  function Gate() {
    this.group = new THREE.Group();
    this.panels = [];
    for (var i = 0; i < MAX_PANELS; i++) {
      var panel = new Panel();
      this.panels.push(panel);
      this.group.add(panel.group);
    }
    this.active = false;
    this.resolved = false;
    this.count = 0;
    this.z = 0;
    this.prompt = '';
    this.answer = '';
    this.group.visible = false;
  }

  /* Porte du Crazy Mode : des choix, pas des réponses. Les pancartes couvrent
     toute la largeur de la piste et se touchent — il n'y a rien entre elles,
     donc on choisit forcément. */
  Gate.prototype.buildChoice = function (choices, layout, z) {
    for (var i = 0; i < MAX_PANELS; i++) {
      if (i < choices.length) {
        var mod = choices[i];
        var slot = layout[i];
        var panel = this.panels[i];
        panel.setIcon(mod, slot.x, slot.w);
        panel.modifier = mod;
      } else {
        this.panels[i].group.visible = false;
        this.panels[i].modifier = null;
      }
    }
    this.count = choices.length;
    this.active = true;
    this.resolved = false;
    this.isChoice = true;
    this.z = z;
    this.prompt = '';
    this.answer = '';
    this.audio = null;
    this.group.visible = true;
  };

  Gate.prototype.build = function (question, answers, z) {
    this.isChoice = false;
    var cfg = AS.ANSWERS[answers] || AS.ANSWERS[3];
    var n = cfg.panels;
    var slotW = (P.HALF * 2) / n;

    var options = [question.answer];
    for (var d = 0; d < n - 1; d++) options.push(question.decoys[d]);
    AS.util.shuffle(options);

    for (var i = 0; i < MAX_PANELS; i++) {
      if (i < n) {
        var text = options[i];
        /* La pancarte occupe TOUTE sa case, quelle que soit la longueur du
           mot : plus d'interstice, donc plus moyen de passer entre deux
           réponses. On traverse forcément l'une d'elles, et c'est ce qu'on
           veut — la question est de savoir laquelle, pas de savoir viser. */
        this.panels[i].set(text, -P.HALF + slotW * (i + 0.5), slotW,
          text === question.answer);
      } else {
        this.panels[i].group.visible = false;
      }
    }

    this.count = n;
    this.active = true;
    this.resolved = false;
    this.z = z;
    this.prompt = question.prompt;
    this.answer = question.answer;
    this.audio = question.audio || null;
    this.group.visible = true;
  };

  /* La réponse retenue est la pancarte dont le centre est à moins de
     largeur × 0.6 du joueur. Si plusieurs se chevauchent (mode facile), c'est
     la plus proche qui gagne. Si aucune ne correspond, le joueur est passé
     dans un trou : c'est une erreur. */
  Gate.prototype.pick = function (playerX) {
    var best = null;
    var bestDist = Infinity;
    var i, panel, dist;

    /* Porte de choix : les pancartes se touchent, il n'y a pas de trou. On
       prend donc toujours la plus proche, sans seuil — c'est ce qui rend le
       choix inévitable. */
    if (this.isChoice) {
      for (i = 0; i < this.count; i++) {
        panel = this.panels[i];
        dist = Math.abs(playerX - panel.x);
        if (dist < bestDist) { bestDist = dist; best = panel; }
      }
      return best;
    }

    for (i = 0; i < this.count; i++) {
      panel = this.panels[i];
      dist = Math.abs(playerX - panel.x);
      if (dist < panel.w * PANEL.PICK_RADIUS && dist < bestDist) {
        bestDist = dist;
        best = panel;
      }
    }
    return best;
  };

  Gate.prototype.reveal = function (chosen) {
    for (var i = 0; i < this.count; i++) {
      var panel = this.panels[i];
      panel.reveal(panel.correct, panel === chosen);
    }
  };

  Gate.prototype.hide = function () {
    this.active = false;
    this.group.visible = false;
  };

  /* --- Le réservoir ------------------------------------------------------ */
  function Gates() {
    this.group = new THREE.Group();
    this.gates = [];
    for (var i = 0; i < GATE_POOL; i++) {
      var gate = new Gate();
      this.gates.push(gate);
      this.group.add(gate.group);
    }
  }

  Gates.prototype.reset = function () {
    for (var i = 0; i < this.gates.length; i++) this.gates[i].hide();
  };

  Gates.prototype.spawn = function (question, diff, z) {
    for (var i = 0; i < this.gates.length; i++) {
      if (!this.gates[i].active) {
        this.gates[i].build(question, diff, z);
        return this.gates[i];
      }
    }
    return null;
  };

  Gates.prototype.spawnChoice = function (choices, layout, z) {
    for (var i = 0; i < this.gates.length; i++) {
      if (!this.gates[i].active) {
        this.gates[i].buildChoice(choices, layout, z);
        return this.gates[i];
      }
    }
    return null;
  };

  /* La porte la plus proche encore à résoudre — c'est sa question qui
     s'affiche dans le bandeau. */
  Gates.prototype.pending = function () {
    var best = null;
    for (var i = 0; i < this.gates.length; i++) {
      var g = this.gates[i];
      if (g.active && !g.resolved && (!best || g.z < best.z)) best = g;
    }
    return best;
  };

  Gates.prototype.hasPending = function () {
    return this.pending() !== null;
  };

  Gates.prototype.update = function (scroll, travelled) {
    for (var i = 0; i < this.gates.length; i++) {
      var gate = this.gates[i];
      if (!gate.active) continue;
      gate.z -= travelled;
      if (gate.z < W.Z_CULL) { gate.hide(); continue; }
      gate.group.position.z = -gate.z;

      /* Chaque pancarte se pose sur le relief à l'endroit de son poteau :
         sur un devers, la porte suit la pente au lieu de flotter. */
      for (var p = 0; p < gate.count; p++) {
        var panel = gate.panels[p];
        panel.group.position.y = heightAt(panel.x, gate.z + scroll)
          + PANEL.POST_HEIGHT + panel.h * 0.5;
      }
    }
  };

  AS.gates = {
    Gates: Gates,
    makeTexture: makeTexture,
    fitFont: fitFont,
    isFontReady: function () { return fontReady; }
  };
})((window.AlpineSchool = window.AlpineSchool || {}));
