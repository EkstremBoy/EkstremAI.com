# EkstremAI

## Stack
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- next-intl (i18n FR/EN)
- Framer Motion
- Supabase (auth + database)

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Variables d'environnement

Copier `.env.example` en `.env.local` et remplir les clés Supabase.

## Structure

```
app/[locale]/          ← Pages localisées (fr, en)
├── page.tsx           ← Accueil (vitrine publique)
├── (auth)/login/      ← Authentification
└── (dashboard)/       ← Espace SaaS protégé
components/            ← Composants réutilisables
i18n/                  ← Messages de traduction
lib/supabase/          ← Clients Supabase
middleware.ts          ← Protection des routes
```
