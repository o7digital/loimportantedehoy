# Rédaction Directus

Backend dédié : https://revista-cms.92.222.23.247.sslip.io/admin/

Directus 11.17.4 et PostgreSQL 17 tournent sur VPS2, dans `/srv/loimportantedehoy`, avec des volumes persistants et un hôte HTTPS dédié. La base reste dans un réseau Docker privé ; le port applicatif local est `127.0.0.1:8140`. Le proxy existant conserve ses autres routes.

Les identifiants administrateur sont dans `~/.config/loimportantedehoy/directus-admin.env` sur le Mac et dans `/srv/loimportantedehoy/.env` sur le serveur. Ces fichiers sont privés, en mode 0600, et exclus de Git. Aucun secret n'est embarqué dans le navigateur.

Au premier accès, Directus propose un formulaire de propriétaire et de licence, à compléter par le responsable du projet. Le bouton « Remind Later » permet de poursuivre la rédaction. Aucun propriétaire ni consentement n'a été enregistré à sa place.

## Couleurs et mise en forme

Ouvrir **Identidad visual** dans Directus pour régler la revue entière : fond de page et des encadrés, texte principal et secondaire, titres, accents turquoise et séparateurs. Les sélecteurs proposent les couleurs du visuel client et acceptent aussi un code hexadécimal. Choisir ensuite les polices des titres et du texte, la taille de lecture (16 à 24 pixels) et l'effet de dégradé sur les titres et chiffres.

La charte initiale reprend le bleu nuit `#091A38`, l'or `#F3CC57`, l'ivoire `#F7F1DF` et le turquoise `#42E2C3` du visuel fourni. **Enregistrer** suffit : les changements s'appliquent au lecteur, sans déploiement, après renouvellement du cache (30 secondes).

Pour une palette propre à une journée, ouvrir l'édition puis **Estilo de esta edición · Opcional**. Les champs laissés vides héritent de la charte générale. Effacer une couleur rétablit cet héritage. Le champ **Ilustración de portada · PNG transparente** permet de placer le personnage sur le fond de la revue, tout en conservant les photos des pages intérieures.

L'illustration de Frida reprend le personnage du fichier client, détouré avec le skill imagegen. Le fichier de couverture est `public/editorial/frida-client-cutout.png` ; sa provenance et les instructions exactes sont dans le fichier `.txt` voisin. Le visuel original reste disponible dans l'édition.

Mise à jour du modèle d'une installation existante :

```sh
node --env-file="$HOME/.config/loimportantedehoy/directus-admin.env" cms/theme.mjs --upload-frida-cutout
```

Cette migration ajoute les champs manquants et la charte initiale, sans écraser des couleurs déjà enregistrées. Elle est également appelée par `bootstrap.mjs`.

## Publier une journée

1. Ouvrir **Ediciones del día** et créer une édition en brouillon.
2. Renseigner la date, le personnage ou thème, le titre de couverture, l'anniversaire et la photographie. Chaque date correspond à une édition.
3. Ajouter les **Páginas de la edición**, dans leur ordre de lecture. La première porte l'ancre `portada`. Les autres peuvent contenir un récit, une chronologie, des chiffres, une citation ou une chanson.
4. Séparer les paragraphes par une ligne vide. Ajouter les sources et les crédits photographiques. Pour la musique, renseigner le lien officiel YouTube ; le lecteur charge la vidéo à la demande.
5. Publier les pages, puis passer l'édition à **Publicado**. Une édition en brouillon et ses pages ne sont pas accessibles au public.

La revue s'affiche sur `/revista/AAAA-MM-JJ`. `/revista` ouvre la dernière édition publiée dont la date est arrivée au Mexique. Les anciennes adresses par personnage redirigent vers la journée correspondante. Les lectures passent par Directus côté serveur ; une publication n'exige aucun nouveau déploiement Vercel. Le cache public se renouvelle après 30 secondes.

Le modèle et l'import initial sont dans `bootstrap.mjs`. Les exemples locaux de `src/data/magazines.ts` servent à cet import et au développement sans CMS. La production exige `DIRECTUS_URL` et ne remplace jamais une panne du CMS par ces exemples.

```sh
node --env-file="$HOME/.config/loimportantedehoy/directus-admin.env" cms/bootstrap.mjs
```

Le script crée les collections et relations manquantes et importe les trois premières éditions sans écraser une édition existante. Les permissions publiques autorisent uniquement la lecture des éditions et pages publiées, ainsi que leurs médias. L'administration demande une authentification.

## Vérifier la publication

Avec le serveur local lancé, le test suivant crée une édition de vérification isolée, vérifie la confidentialité des brouillons et des dates futures, publie et modifie le texte, constate les changements dans le rendu serveur, puis supprime cette édition dans un bloc de nettoyage. Les éditions existantes sont conservées.

```sh
RUN_CMS_WRITE_TESTS=1 node --env-file=.env --env-file="$HOME/.config/loimportantedehoy/directus-admin.env" --test tests/cms.test.mjs
```

## Exploitation

```sh
cd /srv/loimportantedehoy
sudo docker compose ps
sudo /srv/loimportantedehoy/backup.sh
```

Une sauvegarde quotidienne de PostgreSQL et des médias est conservée 14 jours sous `backups/`. Le script vérifie le catalogue du dump et l'archive des médias. La première sauvegarde est aussi copiée dans le dossier privé de configuration du Mac. Il s'agit d'une copie initiale indépendante, pas d'une réplication continue du serveur vers le Mac.

## Studio éditorial : écrire, mettre en page et publier

Ouvrir **Studio editorial** dans Directus, ou directement :
https://revista-cms.92.222.23.247.sslip.io/admin/revista-studio

L’interface reprend le principe du Studio Nathalie : navigation par contenu, champs éditables en vert, images visibles, actions de sauvegarde claires et adaptation mobile. La revue conserve son identité bleu nuit, or, ivoire et turquoise.

1. Choisir une journée dans **Mis ediciones**, ou utiliser **Nueva edición**. Une nouvelle journée est créée en brouillon avec quatre pages (portada, histoire, citation, musique). Le choix reste dans l’URL, par exemple `?edition=1`.
2. Dans **Portada y edición**, modifier le titre, le sous-titre, la date, la catégorie, l’anniversaire, l’illustration transparente et la photo. Les crédits, sources et l’original de référence sont dans les détails dépliables.
3. Cliquer une page dans la navigation : éditer son texte, choisir sa composition (reportage, chiffres/détails, citation, musique), ajouter des chiffres et des faits, changer sa photographie. **Añadir página** ajoute une page ; les flèches changent l’ordre, en conservant la portada au début. Retirer une page l’archive : elle reste récupérable et son texte n’est jamais supprimé.
4. La bibliothèque permet de sélectionner un média ou d’importer une image JPG, PNG, WebP ou AVIF (jusqu’à 15 Mo). Les images choisies restent visibles dans l’éditeur.
5. **Colores y tipografía** règle la palette et la typographie de la journée, pour les trois formats. **Usar la identidad general** rétablit l’héritage. La charte globale reste accessible par le lien en bas du formulaire.
6. L’aperçu **Mobile**, **Desktop** ou **Instagram** se met à jour avec les changements non enregistrés. Cliquer un titre, paragraphe, chiffre ou image dans l’aperçu ouvre le champ correspondant. Le lecteur web utilise le composant React public avec toutes ses pages. Zoom et aperçu agrandi permettent de lire la composition.
7. **Guardar cambios** enregistre l’édition et ses pages ensemble. Une édition déjà publiée reçoit ces modifications sur le site après renouvellement du cache (environ 30 secondes). Pour une nouvelle journée, **Publicar** publie la journée et ses pages ; **Programar** utilise sa date future. Les champs saisis sont conservés en cas d’erreur, et un conflit de version refuse d’écraser une édition modifiée dans une autre fenêtre.
8. **Exportar vista / Exportar Instagram** télécharge la version affichée, même avec des modifications non enregistrées, sans publier ni enregistrer ces modifications. Instagram : **1080 × 1350** ; Desktop : **1440 × 1000** ; Mobile : **780 × 1688** (390 × 844 à 2×). Les exports web capturent la vue de la page sélectionnée ; le site conserve le lecteur complet.

**Versión Instagram** propose les textes courts facultatifs du cartel, qui héritent du contenu de la revue lorsqu’ils sont vides. Le poster compose le titre, l’illustration, la biographie, les chiffres, les détails, la citation, la chanson et les sources. Il n’utilise pas la couverture aplatie comme image finale. Un dépassement indique quel texte raccourcir.

Les documents, aperçus de travail, sauvegardes et exports demandent la session Directus. Les écritures passent par `ItemsService` avec les permissions de l’utilisateur. La sauvegarde est transactionnelle, vérifie une révision et lie chaque page à sa propre édition. Les PNG sont téléchargés directement et ne sont pas ajoutés à la médiathèque publique. Les ressources compilées sont publiques et ne contiennent ni textes privés ni identifiants.

Le rendu PNG utilise Firefox dans le service Docker privé `renderer`, sans port publié, avec la clé `STUDIO_RENDER_KEY` du `.env` serveur. Ses requêtes réseau sont limitées aux médias et ressources du CMS. Une seule génération tourne à la fois.

Construction de l’extension native (SDK 17.1.4, Directus 11.17.4) :

```sh
npm ci --prefix cms/extensions
npm run build --prefix cms/extensions
node --env-file="$HOME/.config/loimportantedehoy/directus-admin.env" cms/studio.mjs
```

Copier `cms/extensions/package.json` et `cms/extensions/dist/` dans `/srv/loimportantedehoy/extensions/directus-extension-revista-studio/`. Copier `cms/renderer/` et `cms/compose.yml` à côté. Configurer une clé aléatoire de 64 caractères, puis `sudo docker compose build renderer` et `sudo docker compose up -d`. Après une mise à jour des bundles de l’extension, redémarrer Directus. La migration conserve les entrées existantes de la barre de modules et les textes enregistrés.

Les tests d’écriture créent des journées de vérification isolées et les suppriment dans un bloc de nettoyage :

```sh
RUN_CMS_WRITE_TESTS=1 node --env-file=.env --env-file="$HOME/.config/loimportantedehoy/directus-admin.env" --test tests/editor-cms.test.mjs
node --env-file="$HOME/.config/loimportantedehoy/directus-admin.env" tests/studio-browser.mjs
RUN_CMS_WRITE_TESTS=1 node --env-file="$HOME/.config/loimportantedehoy/directus-admin.env" tests/studio-editor-write.mjs
```

Ils couvrent les changements non sauvegardés, la composition réelle des PNG, les identifiants de pages d’une autre édition, la sauvegarde atomique, les conflits entre fenêtres, ainsi que la création, les textes, les chiffres, l’ordre des pages, les images, la publication et le retrait depuis l’interface Firefox. Le studio demande confirmation avant de quitter un travail non enregistré.

La home et `/revista` suivent la dernière édition publiée à la date du Mexique. Sans nouvelle publication aujourd’hui, la home présente celle d’hier.
