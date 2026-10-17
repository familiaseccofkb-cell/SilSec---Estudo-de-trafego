#!/usr/bin/env bash
# Backup externo criptografado (regra 3-2-1) com restic.
#  1) cópia consistente do banco (VACUUM INTO) pelo próprio SilSec;
#  2) envio criptografado para o HD externo USB e para a nuvem.
# Agendar com: systemctl enable --now silsec-backup.timer (ver docs/03-servidor-local.md)
set -euo pipefail
source /etc/silsec/backup.env   # RESTIC_PASSWORD_FILE, REPO_USB, REPO_NUVEM, B2_ACCOUNT_ID/KEY etc.

COPIA=$(/usr/local/bin/silsec-cli backup | awk '{print $NF}')
echo "Cópia local: $COPIA"

for REPO in "${REPO_USB:-}" "${REPO_NUVEM:-}"; do
  [ -z "$REPO" ] && continue
  if [[ "$REPO" == /* ]] && ! mountpoint -q "$(dirname "$REPO")"; then
    echo "AVISO: destino $REPO não montado; pulando." >&2; continue
  fi
  restic -r "$REPO" backup "$COPIA" --tag silsec --host silsec
  restic -r "$REPO" forget --tag silsec --keep-daily 14 --keep-weekly 8 --keep-monthly 24 --prune
  # Confere 5% dos dados a cada execução para detectar corrupção silenciosa.
  restic -r "$REPO" check --read-data-subset=5%
done
