#!/bin/sh
set -eu
umask 077
cd /srv/loimportantedehoy
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T database pg_dump -U revista -d revista -Fc > "backups/revista-${stamp}.dump"
docker compose exec -T directus tar -czf - -C /directus/uploads . > "backups/revista-${stamp}-uploads.tar.gz"
docker compose exec -T database pg_restore --list < "backups/revista-${stamp}.dump" > /dev/null
tar -tzf "backups/revista-${stamp}-uploads.tar.gz" > /dev/null
find backups -maxdepth 1 -type f -name 'revista-*' -mtime +14 -delete
echo "Verified backup: revista-${stamp}"
