# Rédaction Directus

Backend dédié : https://revista-cms.92.222.23.247.sslip.io/admin/

Directus 11.17.4 et PostgreSQL 17 tournent sur VPS2, dans `/srv/loimportantedehoy`, avec des volumes persistants et un hôte HTTPS dédié. La base reste dans un réseau Docker privé ; le port applicatif local est `127.0.0.1:8140`. Le proxy existant conserve ses autres routes.

Les identifiants administrateur sont dans `~/.config/loimportantedehoy/directus-admin.env` sur le Mac et dans `/srv/loimportantedehoy/.env` sur le serveur. Ces fichiers sont privés, en mode 0600, et exclus de Git. Aucun secret n'est embarqué dans le navigateur.

Au premier accès, Directus propose un formulaire de propriétaire et de licence, à compléter par le responsable du projet. Le bouton « Remind Later » permet de poursuivre la rédaction. Aucun propriétaire ni consentement n'a été enregistré à sa place.

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
