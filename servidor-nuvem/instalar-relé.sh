#!/usr/bin/env bash
# Prepara um VPS Ubuntu 24.04 como relé do SilSec (sem armazenamento de dados).
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Execute como root."; exit 1; }
apt-get update && apt-get -y full-upgrade
apt-get -y install wireguard ufw fail2ban unattended-upgrades curl gnupg
dpkg-reconfigure -f noninteractive unattended-upgrades
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get -y install caddy
fi
install -d -o caddy -g caddy /var/log/caddy
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 51820/udp
ufw --force enable
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/; s/^#\?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl enable --now fail2ban
echo "Agora: preencha /etc/wireguard/wg0.conf (vps-wg0.conf.exemplo), systemctl enable --now wg-quick@wg0,"
echo "copie o Caddyfile para /etc/caddy/Caddyfile e rode systemctl reload caddy."
