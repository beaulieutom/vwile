#!/usr/bin/env bash
# Commit + récupère les changements des autres + push (ce qui déclenche le déploiement).
# Usage : npm run ship -- "ce qui a changé"
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-Mise à jour}"

git add -A
git diff --cached --quiet || git commit -m "$MSG"
git pull --rebase
git push
echo "Envoyé — en ligne sur https://tcg.lustre-auto.fr d'ici ~30 s"
