/* =========================================================================
   Alpine School — fabrication des versions « un seul fichier »
   -------------------------------------------------------------------------
   Assemble index.html, styles.css, Three.js, les deux polices et les dix-huit
   modules en un unique .html sans aucune dépendance externe.

       node build-standalone.mjs

   Deux fichiers sont produits :

     alpine-school.html            page complète, à ouvrir par double-clic,
                                   à envoyer par courriel ou à déposer telle
                                   quelle sur n'importe quel hébergeur ;

     dist/artifact.html            même chose sans <html>/<head>/<body>, pour
                                   les hébergeurs qui fournissent eux-mêmes
                                   le squelette de la page.

   Le dossier `src/` reste la version de référence : ces fichiers n'en sont
   que des emballages, et se refabriquent d'une commande.

   Polices : Fredoka et Nunito, sous licence SIL Open Font, intégrées en
   base64. Les incorporer est expressément permis par cette licence, et c'est
   la seule façon de garder la typographie du jeu là où les feuilles de style
   externes sont bloquées.
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ORDER = [
  'src/constants.js',
  'src/util.js',
  'src/i18n.js',
  'src/data/words.js',
  'src/data/quiz.js',
  'src/data/modifiers.js',
  'src/data/sfx.js',
  'src/crazy.js',
  'src/race.js',
  'src/mobile.js',
  'src/audio.js',
  'src/music.js',
  'src/input.js',
  'src/world/terrain.js',
  'src/world/sky.js',
  'src/world/models.js',
  'src/world/forest.js',
  'src/world/props.js',
  'src/world/wildlife.js',
  'src/world/gates.js',
  'src/world/finish.js',
  'src/world/particles.js',
  'src/world/post.js',
  'src/world/scene.js',
  'src/game.js',
  'src/pause.js',
  'src/hud.js',
  'src/main.js',
];

const read = (p) => readFileSync(p, 'utf8');
const b64 = (p) => readFileSync(p).toString('base64');

/* Une chaîne « </script> » dans du JS inline refermerait la balise. */
const safe = (js) => js.replace(/<\/script>/gi, '<\\/script>');

const html = read('index.html');
const three = read('vendor/three.min.js');

/* --- Polices ------------------------------------------------------------
   Les deux sont variables : un seul fichier couvre toute la plage de graisse
   dont le jeu se sert. */
const FONT_FACES = `
@font-face {
  font-family: 'Fredoka';
  font-style: normal;
  font-weight: 400 600;
  font-display: block;
  src: url(data:font/woff2;base64,${b64('vendor/fonts/fredoka-latin.woff2')}) format('woff2');
}
@font-face {
  font-family: 'Nunito';
  font-style: normal;
  font-weight: 400 800;
  font-display: block;
  src: url(data:font/woff2;base64,${b64('vendor/fonts/nunito-latin.woff2')}) format('woff2');
}
`;

const css = FONT_FACES + '\n' + read('styles.css');

/* Le corps de la page est repris tel quel : c'est la même interface. */
const body = html
  .slice(html.indexOf('<div id="stage">'), html.indexOf('<script src="https://cdn.jsdelivr.net'))
  .trim();

/* Les <link> et <script> externes disparaissent : ces versions ne demandent
   rien au réseau. */
const head = html
  .slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
  .replace(/<link[^>]*>\s*/g, '')
  .replace(/<script[\s\S]*?<\/script>\s*/g, '')
  .trim();

const bundle = ORDER.map((p) => `/* ===== ${p} ===== */\n${safe(read(p))}`).join('\n');
const scripts = `<script>${safe(three)}</script>\n<script>\n${bundle}\n</script>`;

/* --- Page complète ------------------------------------------------------ */
const full = `<!DOCTYPE html>
<html lang="fr">
<head>
${head}
<style>
${css}
</style>
</head>
<body>
${body}
${scripts}
</body>
</html>
`;
writeFileSync('alpine-school.html', full);

/* Même page, nommée index.html dans son propre dossier : c'est ce qu'attend
   un hébergeur statique. Elle est RÉÉCRITE à chaque fabrication — une copie
   faite à la main resterait périmée sans prévenir. */
mkdirSync('dist/public', { recursive: true });
writeFileSync('dist/public/index.html', full);

/* --- Fragment, squelette fourni par l'hôte ------------------------------ */
const fragment = `<title>Alpine School</title>
<style>
${css}
</style>
${body}
${scripts}
`;
writeFileSync('dist/artifact.html', fragment);

const ko = (s) => (Buffer.byteLength(s) / 1024).toFixed(0);
console.log(`alpine-school.html       ${ko(full)} Ko  (double-clic)`);
console.log(`dist/public/index.html   ${ko(full)} Ko  (à déposer sur un hébergeur)`);
console.log(`dist/artifact.html       ${ko(fragment)} Ko  (hôte fournissant le squelette)`);
console.log(`${ORDER.length} modules, 2 polices intégrées, aucune dépendance externe`);
