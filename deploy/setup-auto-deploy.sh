#!/usr/bin/env bash
# À lancer une seule fois depuis ton Mac : crée la clé SSH utilisée par GitHub Actions,
# l'autorise sur le VPS (limitée à l'écriture dans /var/www/vwile) et l'enregistre en secret GitHub.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=ubuntu@145.239.196.167
KEY=~/.ssh/id_ed25519_vps
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

ssh-keygen -q -t ed25519 -N "" -C "github-actions-vwile" -f "$TMP/deploy_key"

LINE="restrict,command=\"/usr/bin/rrsync -wo /var/www/vwile\" $(cat "$TMP/deploy_key.pub")"
ssh -i "$KEY" "$HOST" "cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.bak-vwile && echo '$LINE' >> ~/.ssh/authorized_keys"

gh secret set VPS_SSH_KEY --repo beaulieutom/vwile < "$TMP/deploy_key"

echo "OK : clé installée sur le VPS et secret VPS_SSH_KEY enregistré sur GitHub."
