# Alpine School

Un jeu de descente à ski en 3D pour le site de Miss Mélanie. On dévale une
piste, on traverse la pancarte qui porte la bonne réponse. Trois modes :
freestyle sans question, vocabulaire anglais, tables de multiplication.

Trois fichiers JavaScript, aucune image, aucun son enregistré, aucun modèle 3D.
Toute la montagne est construite en code et tous les sons sont synthétisés :
une fois la page chargée, le jeu fonctionne hors ligne.

---

## Lancer le jeu

**Le plus simple** — ouvre `index.html` en double-cliquant dessus. Ça marche :
le jeu est écrit pour tourner en `file://`, sans serveur.

**Avec un serveur local**, si tu préfères (recommandé pour tester le rendu
exact du déploiement) :

```bash
python -m http.server 8000
```

puis va sur `http://localhost:8000`.

**Déploiement** — c'est un site statique sans étape de compilation. Sur Vercel,
il suffit de pointer le projet sur ce dossier : pas de build command, pas de
output directory à régler.

```bash
npx vercel --prod
```

---

## Version « un seul fichier »

Pour montrer le jeu vite — par courriel, sur une clé USB, ou sur un hébergeur
qui n'accepte qu'un fichier :

```bash
node build-standalone.mjs
```

Ça produit :

| Fichier | À quoi ça sert |
|---|---|
| `alpine-school.html` | La page entière en un fichier. Double-clic et ça joue. |
| `dist/public/index.html` | Le même, nommé pour être déposé tel quel sur un hébergeur statique. |
| `dist/artifact.html` | Le même sans `<html>`/`<head>`/`<body>`, pour les hôtes qui fournissent le squelette. |

Three.js, les deux polices et les dix-huit modules y sont intégrés : **zéro
requête réseau**, le jeu tourne entièrement hors ligne.

Ces fichiers sont des *sorties de fabrication*. Ne les modifie jamais à la
main : corrige `src/`, puis relance la commande.

---

## Ajouter du vocabulaire

**Tout se passe dans `src/data/words.js`.** Il n'y a rien à toucher ailleurs.

Une entrée ressemble à ceci :

```js
{ fr: 'le chat', en: 'cat', decoys: ['dog', 'bird', 'horse'] },
```

- `fr` — le mot affiché en haut de l'écran.
- `en` — la bonne traduction, celle qui ira sur la bonne pancarte.
- `decoys` — trois leurres. Le mode Facile n'en utilise qu'un, Moyen et Expert
  en utilisent deux. **Mets toujours les trois** : ça permet de changer la
  difficulté de la descente sans retoucher les listes.

Les trois listes (`1` débutant, `2` courant, `3` littéraire) n'ont pas besoin
d'avoir la même longueur. Ajoute autant de mots que tu veux : ils sont tirés
dans un ordre mélangé, et un mot ne revient jamais avant que toute la liste
soit passée.

Un conseil sur les leurres : ils fonctionnent mieux quand ils sont *plausibles*.
Pour un francophone, `borrow` / `lend` est un bien meilleur piège que
`borrow` / `elephant`.

### Prononciation enregistrée (prévu, pas encore actif)

Chaque entrée accepte déjà un champ optionnel `audio` :

```js
{ fr: 'le chat', en: 'cat', decoys: [...], audio: 'audio/cat.mp3' },
```

Le moteur transporte ce champ jusqu'au franchissement de la porte mais ne le
joue pas encore. Tu peux commencer à le renseigner : rien ne cassera.

---

## Régler autre chose

Toutes les valeurs vivent dans **`src/constants.js`**, en haut du fichier :

| Ce que tu veux changer | Où |
|---|---|
| Les couleurs (rethéming du site) | `PALETTE` |
| La sensation de glisse | `PHYSICS` — voir l'avertissement ci-dessous |
| Largeur des pancartes par difficulté | `DIFFICULTY` |
| Distance de vue, brouillard, relief | `WORLD` |
| Position et retard de la caméra | `CAMERA` |
| Hauteur du soleil, ombres | `SUN` |

> **Attention à `PHYSICS`.** Ces valeurs ont été réglées à la main jusqu'à ce
> que la glisse soit satisfaisante, puis validées. Elles se tiennent entre
> elles : l'impulsion de saut et la gravité déterminent l'apogée, qui doit
> rester au-dessus du seuil de franchissement des rochers. Le fichier vérifie
> cette condition au chargement et refuse de démarrer si elle est violée.

Les tables de multiplication se règlent dans `src/data/quiz.js` (`MATH_MAX`).

---

## Ajouter une matière

Le moteur ne sait rien du contenu : il demande un « fournisseur » et appelle
`next()` quand il lui faut une question. Pour ajouter, disons, la conjugaison :

1. Crée `src/data/verbs.js` sur le modèle de `words.js`.
2. Dans `src/data/quiz.js`, ajoute un fournisseur qui expose `eyebrow` (la
   sur-étiquette du bandeau) et `next()` renvoyant
   `{ prompt, answer, decoys }`.
3. Déclare-le dans `makeProvider()`.
4. Ajoute le bouton et ses sous-niveaux dans `index.html`.

Aucune ligne à écrire dans `game.js` ni dans le rendu.

---

## Structure

```
index.html            page, menu, HUD
styles.css            interface
vendor/three.min.js   copie locale de Three.js (filet si le CDN est injoignable)
src/
  constants.js        palette + valeurs de physique
  util.js
  i18n.js             LES TEXTES — bilingue français / anglais
  audio.js            sons synthétisés (Web Audio, aucun fichier)
  music.js            musique du Freestyle, séquencée en direct
  crazy.js            moteur du Crazy Mode
  input.js            clavier et tactile, pilotage analogique
  game.js             règles et physique
  hud.js              menu, HUD, écran de fin
  main.js             démarrage et boucle
  data/
    words.js          LES LISTES DE VOCABULAIRE — c'est ici
    quiz.js           générateurs de questions
    modifiers.js      LE CATALOGUE DES FOLIES du Crazy Mode
  world/
    scene.js          rendu, caméra, lumière
    terrain.js        la neige et son relief
    sky.js            ciel, soleil, sommets
    models.js         sapins, rochers, skieur, construits en code
    forest.js         forêt de décor (instanciée)
    props.js          obstacles de la piste
    wildlife.js       lapin, oiseau, foule du mode lapin
    gates.js          portiques et pancartes
    particles.js      gerbe de neige, flocons, trace de carre
    post.js           post-traitement
```

---

## Commandes

- `←` `→` ou `A` `D` — carver. **Plus tu tiens, plus tu glisses loin** : c'est
  un pilotage analogique, pas un déplacement de case en case.
- `Espace` — sauter. Franchit un rocher, jamais un sapin.
- Sur mobile — garde le doigt sur le tiers gauche ou droit de l'écran ; touche
  le haut pour sauter.
- Le bouton en haut à droite coupe le son, et se prend au clavier.

---

## Bilingue

Une bascule **FR / EN** en haut à droite. Elle ne traduit pas seulement
l'interface : elle **retourne l'exercice**. Interface en français, on pratique
l'anglais ; interface en anglais, on pratique le français, avec la même liste
de vocabulaire lue à l'envers.

Vers le français, les leurres n'existent pas dans les données — on prend trois
autres mots français de la même liste. Ils sont du même niveau, donc
plausibles, et ça évite d'avoir à saisir deux jeux de leurres.

Pour traduire : tout est dans `src/i18n.js`, une clé par texte. Un texte
manquant en anglais retombe sur le français plutôt que d'afficher une clé nue.
Dans le HTML, `data-i18n` remplace le texte, `data-i18n-html` le contenu
(phrases avec des touches), `data-i18n-aria` l'étiquette d'accessibilité.

## Crazy Mode

Déverrouillé après une descente de **2000 m en Freestyle**. Le jeu ne conserve
rien sur le disque, donc le déblocage vaut pour la session en cours.

Une porte tous les **100 m**, deux choix, aucune échappatoire : les pancartes
couvrent toute la piste et il n'y a pas de trou entre elles. La folie choisie
dure cent mètres, puis s'efface.

Le **lapin** arrive à 500 m, en remplaçant l'une des deux pancartes. Ensuite,
tous les 500 m, il revient en **troisième pancarte plus étroite** (1,70 m
contre 2,55 m pour les deux autres) — le total fait toujours 6,80 m, soit la
largeur exacte de la piste.

Dix folies, cochables une par une dans le **catalogue** du menu :

| | |
|---|---|
| Forêt dense | beaucoup plus de sapins |
| Commandes inversées | gauche pousse à droite |
| Billots | plus d'obstacles, mais des troncs à sauter tous les 36 m |
| Verglas | la carre ne mord plus |
| Purée de pois | le brouillard tombe |
| Survitesse | tout va 42 % plus vite |
| Champ de bosses | le relief triple d'amplitude |
| Tout rétrécit | obstacles minuscules et bien plus nombreux |
| Tombée du jour | le soleil descend, la montagne bleuit |
| Mode lapin | tu deviens un lapin, les vies sont des œufs |

Pour en ajouter une : une entrée dans `src/data/modifiers.js`, et le code qui
l'applique dans `recompute()` de `src/crazy.js`. Le menu et le catalogue se
remplissent tout seuls. Les folies n'agissent que par **multiplicateurs** —
hors Crazy Mode ils valent tous 1, donc la physique validée est intacte.

## La musique

En **Freestyle uniquement**, et entièrement synthétisée : pas un octet de
fichier audio. Un séquenceur programme les notes à l'avance dans l'horloge de
la carte son — un séquenceur calé sur les images du jeu tremblerait dès que la
carte graphique souffle.

Le tempo suit la **distance parcourue**, de 100 à 168 pulsations par minute sur
les deux premiers kilomètres. Il suit la distance et non la vitesse parce que
la vitesse plafonne vite et retombe à chaque virage serré : la musique se
mettrait à pomper. Des couches s'ajoutent en chemin (contretemps, doublure
d'octave, nappe), pour qu'on entende qu'on va plus loin et pas seulement plus
vite.

Pas de musique dans les modes à questions : elle entrerait en concurrence avec
les sons de réponse, qui portent une information. Savoir si on a eu juste doit
s'entendre sans effort.

Pour retoucher — `src/music.js` : `BPM_SLOW`, `BPM_FAST`, la marche
d'harmonie dans `CHORDS`, et les motifs rythmiques (`KICK_STEPS`,
`LEAD_STEPS`…). L'échelle est pentatonique, donc toute note ajoutée dans
`CHORDS` restera consonante.

## Notes techniques

- **Three.js r159** en script classique, chargé depuis un CDN avec une copie
  locale de secours. C'est la dernière version livrant une build UMD ; c'est ce
  qui permet au jeu de tourner en `file://`, ce que les modules ES interdisent.
- **Aucune requête réseau après le chargement**, hors les polices Google.
- La densité de pixels est plafonnée à 2 et **s'abaisse toute seule** si la
  machine ne tient pas la cadence, plutôt que de laisser le jeu ramer.
- `prefers-reduced-motion` supprime la secousse de caméra et les flashs plein
  écran ; le jeu reste entièrement jouable.
- Aucune donnée n'est conservée : ni score, ni progression, ni `localStorage`.
