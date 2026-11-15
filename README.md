# Lo importante de hoy — Astro + React

Mockup premium de revue culturelle avec conversion par abonnement mensuel.

## Démarrage

```bash
npm install
npm run dev
```

Le composant React principal se trouve dans `src/components/EditorialExperience.tsx`. La page Astro, les métadonnées SEO et l’hydratation du composant se trouvent dans `src/pages/index.astro`.

## Revue à feuilleter

`/revista` ouvre la dernière revue. Chaque édition possède aussi son adresse permanente : `/revista/frida`, `/revista/leon-russell` et `/revista/abbey-road`.

Le lecteur `src/components/MagazineReader.tsx` propose un défilement horizontal tactile, des flèches, un sommaire, un choix d’édition et des liens directs vers les rubriques (`#historia`, `#musica`, etc.). Chaque page peut défiler verticalement pour garder le texte lisible sur les petits écrans. Les flèches du clavier fonctionnent également et les préférences de mouvement réduit sont respectées.

Pour ajouter une revue, placer son visuel original dans `public/revistas/` et ajouter son contenu structuré au début de `src/data/magazines.ts`, avec une date, un slug unique et ses rubriques. La première entrée devient la revue du jour. Le sélecteur, les routes, le lien de la landing et le sitemap utilisent ces données. Les textes sont adaptés des visuels originaux, qui restent consultables en grand.

Vérifications : `npm run build` et `npx tsc --noEmit`.

## À connecter pour la production

- Paiement récurrent : Stripe Checkout + portail client.
- Espace membre : Supabase Auth, Clerk ou Auth.js.
- Contenus : WordPress headless, Directus ou Sanity.
- Emails : Brevo, Resend ou Mailchimp.

Le prix de 99 MXN est une hypothèse de maquette et peut être modifié dans le composant React.
