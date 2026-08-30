# Lo importante de hoy — Astro + React

Mockup premium de revue culturelle avec conversion par abonnement mensuel.

## Démarrage

```bash
npm install
npm run dev
```

Le composant React principal se trouve dans `src/components/EditorialExperience.tsx`. La page Astro, les métadonnées SEO et l’hydratation du composant se trouvent dans `src/pages/index.astro`.

## À connecter pour la production

- Paiement récurrent : Stripe Checkout + portail client.
- Espace membre : Supabase Auth, Clerk ou Auth.js.
- Contenus : WordPress headless, Directus ou Sanity.
- Emails : Brevo, Resend ou Mailchimp.

Le prix de 99 MXN est une hypothèse de maquette et peut être modifié dans le composant React.
