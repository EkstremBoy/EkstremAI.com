# Marque Ekstrem AI

Fichiers de référence de l’identité visuelle. Les versions destinées à l’écran ont un fond **transparent** (canal alpha) : ne pas les poser sur un damier.

Les barres de navigation (`components/layout/Navbar.tsx` et `components/riseandreward/RnRNavbar.tsx`) chargent directement `/brand/logo-horizontal.png`.

| Fichier | Dimensions | Poids | Où l’utiliser |
| --- | --- | --- | --- |
| `logo-horizontal.png` | 711×128 | 67 Ko | **En-tête.** Icône + « EKSTREM AI » côte à côte. Hauteur d’affichage ~48px (`h-12`), ratio 711:128 (environ 267×48), sans déformation. |
| `logo-horizontal-full.png` | 1024×184 | 121 Ko | Même logo horizontal, plus haute résolution (documents, exports). Pas nécessaire dans la navbar. |
| `logo-full.png` | 1024×877 | 559 Ko | **Hero et à propos.** Logo rond complet. Ne pas le placer dans l’en-tête, ni sur une page tant qu’une section ne le demande pas. |
| `logo-mark.png` | 256×256 | 48 Ko | Symbole seul (cerveau + montagne, sans texte). Base des favicons et des icônes d’application. |
| `icon-512.png` | 512×512 | 146 Ko | Icône d’application. Copie servie par Next.js via `app/icon.png`. |
| `apple-touch-icon.png` | 180×180 | 16 Ko | Icône d’écran d’accueil Apple (fond opaque). Copie servie via `app/apple-icon.png`. |
| `favicon-32.png` | 32×32 | 2 Ko | Favicon. Source de `app/favicon.ico` (servi sur `/favicon.ico`). |
| `logo-source.png` | 2048×2048 | 5,2 Mo | Illustration source d’origine, **fond sombre**. Référence uniquement : ne pas l’afficher sur le site. |

Règle courte : en-tête = horizontal ; hero / à propos = logo rond ; favicon et icônes d’app = symbole seul.
