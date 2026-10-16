#!/usr/bin/env bash
# Envoie dist/ sur le VPS (tcg.lustre-auto.fr). Usage : npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=ubuntu@145.239.196.167
KEY=~/.ssh/id_ed25519_vps

node check.mjs
rsync -az --delete -e "ssh -i $KEY" dist/ "$HOST:/var/www/vwile/"
echo "Déployé : https://tcg.lustre-auto.fr"
