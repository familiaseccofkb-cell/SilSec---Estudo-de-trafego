#!/usr/bin/env bash
# Instalação do SilSec no servidor local — Ubuntu Server 24.04 LTS (x86-64 ou ARM64).
# Uso (como root, a partir da pasta do repositório):  sudo bash infra/instalar-servidor-local.sh
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Execute como root (sudo)."; exit 1; }
REPO="$(cd "$(dirname "$0")/.." && pwd)"

echo "== Atualizações e pacotes básicos"
apt-get update
apt-get -y full-upgrade
apt-get -y install curl ca-certificates gnupg ufw fail2ban unattended-upgrades restic ddclient wireguard nut sqlite3 rsync
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== Node.js 22 LTS (repositório oficial NodeSource)"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get -y install nodejs
fi
node --version

echo "== Caddy (HTTPS automático)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get -y install caddy
fi

echo "== Usuário de serviço e pastas"
id silsec >/dev/null 2>&1 || useradd --system --home /var/lib/silsec --shell /usr/sbin/nologin silsec
install -d -o silsec -g silsec -m 700 /var/lib/silsec /var/lib/silsec/backups
install -d -o root -g root -m 755 /opt/silsec
install -d -o root -g root -m 700 /etc/silsec
rsync -a --delete --exclude node_modules --exclude .git --exclude dados "$REPO"/ /opt/silsec/
chmod +x /opt/silsec/infra/backup/backup-externo.sh /opt/silsec/infra/firewall/ufw.sh
install -m 755 "$REPO/infra/silsec-cli" /usr/local/bin/silsec-cli
[ -f /etc/silsec/silsec.env ] || { install -m 600 "$REPO/infra/silsec.env.exemplo" /etc/silsec/silsec.env; echo ">> Edite /etc/silsec/silsec.env antes de continuar."; }

echo "== Serviços"
install -m 644 "$REPO/infra/systemd/silsec.service" /etc/systemd/system/silsec.service
install -m 644 "$REPO/infra/backup/silsec-backup.service" /etc/systemd/system/
install -m 644 "$REPO/infra/backup/silsec-backup.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now silsec.service
[ -f /etc/caddy/Caddyfile.original ] || cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.original
install -m 644 "$REPO/infra/caddy/Caddyfile" /etc/caddy/Caddyfile
install -d -o caddy -g caddy /var/log/caddy
echo ">> Edite /etc/caddy/Caddyfile (domínio e e-mail) e rode: systemctl reload caddy"

echo "== Proteções do sistema"
# SSH somente com chave (copie sua chave antes: ssh-copy-id usuario@servidor)
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/; s/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
echo ">> Confirme que sua chave SSH funciona e então: systemctl restart ssh"
systemctl enable --now fail2ban
echo ">> Revise LAN em infra/firewall/ufw.sh e rode: LAN=192.168.1.0/24 bash /opt/silsec/infra/firewall/ufw.sh"

echo
echo "Próximos passos (docs/03-servidor-local.md):"
echo " 1. sudo silsec-cli criar-conta SEU_EMAIL 'Seu Nome'   (mesmo e-mail de SILSEC_OWNER_EMAIL)"
echo " 2. Configurar DDNS (/etc/ddclient.conf) ou o relé em nuvem (servidor-nuvem/)."
echo " 3. Configurar backup externo (/etc/silsec/backup.env) e: systemctl enable --now silsec-backup.timer"
