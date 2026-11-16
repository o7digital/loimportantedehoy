# Lo importante de hoy — Astro + React

Revue éditoriale quotidienne, lecteur à feuilleter et rédaction Directus.

## Démarrage

```bash
npm install
npm run dev
```

Le composant React principal se trouve dans `src/components/EditorialExperience.tsx`. La page Astro, les métadonnées SEO et l’hydratation du composant se trouvent dans `src/pages/index.astro`.

## Revue à feuilleter

`/revista` ouvre la dernière journée publiée. Chaque édition possède son adresse permanente, par exemple `/revista/2026-11-15`. Les anciens liens par personnage redirigent vers la date correspondante.

Le lecteur `src/components/MagazineReader.tsx` propose un défilement horizontal tactile, des flèches, un sommaire, un choix d’édition et des liens directs vers les rubriques (`#historia`, `#musica`, etc.). Chaque page peut défiler verticalement pour garder le texte lisible sur les petits écrans. Les flèches du clavier fonctionnent également et les préférences de mouvement réduit sont respectées.

Les contenus, photographies, rubriques, citations et chansons sont gérés dans Directus. Copier `.env.example` en `.env` pour configurer `DIRECTUS_URL` en développement. En production, cette variable est configurée dans Vercel ; les pages sont rendues côté serveur et les publications apparaissent sans redéploiement. Les données locales de `src/data/magazines.ts` servent uniquement au développement sans CMS et à l'import initial.

Le [guide de rédaction et d'exploitation](cms/README.md) décrit les collections, la publication, les accès et les sauvegardes.

Vérifications : `npm run build`, `npx tsc --noEmit`, `npm test` et `npm run test:reader` (serveur local sur le port 4321, Firefox Playwright installé). Le test complet de publication est décrit dans le guide CMS.

## À connecter pour la production

- Paiement récurrent : Stripe Checkout + portail client.
- Espace membre : Supabase Auth, Clerk ou Auth.js.
- Contenus : Directus, connecté.
- Emails : Brevo, Resend ou Mailchimp.

Le prix de 99 MXN est une hypothèse de maquette et peut être modifié dans le composant React.
