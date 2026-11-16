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

Sur mobile, le lecteur `src/components/MagazineReader.tsx` se feuillette au doigt : la page pivote autour de son bord et découvre la suivante. Un coin replié peut aussi être touché pour avancer. Le geste et le zoom restent natifs ; chaque article défile verticalement et conserve sa position de lecture. Le sommaire, les liens directs (`#historia`, `#musica`, etc.), les commandes au clavier et les flèches restent disponibles. Le mouvement réduit désactive l'effet de papier.

`src/lib/use-page-turn.ts` anime les feuilles à partir du défilement natif. Des repères de défilement distincts des feuilles transformées assurent l'arrêt sur chaque page. Ce lecteur est aussi utilisé dans l'aperçu Directus ; reconstruire et déployer `cms/extensions` lors de ses modifications.

Les contenus, photographies, rubriques, citations et chansons sont gérés dans Directus. Copier `.env.example` en `.env` pour configurer `DIRECTUS_URL` en développement. En production, cette variable est configurée dans Vercel ; les pages sont rendues côté serveur et les publications apparaissent sans redéploiement. Les données locales de `src/data/magazines.ts` servent uniquement au développement sans CMS et à l'import initial.

Le [guide de rédaction et d'exploitation](cms/README.md) décrit les collections, la publication, les accès et les sauvegardes.

Vérifications : `npm run build`, `npx tsc --noEmit`, `npm test` et `npm run test:reader` (serveur local sur le port 4321, Firefox Playwright installé). Le test complet de publication est décrit dans le guide CMS.

`npm run test:page-turn` vérifie le feuilletage sur Firefox, Chromium et WebKit (`npx playwright install firefox chromium webkit`). Chromium teste les véritables événements tactiles ; WebKit mobile vérifie le rendu, le défilement et les contrôles tactiles, Playwright ne permettant pas d'y injecter un balayage. `BASE_URL` permet de tester la production ; `READER_BROWSERS=webkit` permet de limiter les moteurs.

## À connecter pour la production

- Paiement récurrent : Stripe Checkout + portail client.
- Espace membre : Supabase Auth, Clerk ou Auth.js.
- Contenus : Directus, connecté.
- Emails : Brevo, Resend ou Mailchimp.

Le prix de 99 MXN est une hypothèse de maquette et peut être modifié dans le composant React.
