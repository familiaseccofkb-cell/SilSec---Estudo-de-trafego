#!/usr/bin/env bash
# Firewall do servidor local (Ubuntu). Executar como root.
# Política: nada entra, exceto HTTPS (Caddy) e a VPN WireGuard. SSH somente pela rede local/VPN.
set -euo pipefail
LAN="${LAN:-192.168.0.0/16}"     # ajuste para a faixa do seu roteador (ex.: 192.168.1.0/24)
VPN="${VPN:-10.66.0.0/24}"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp comment 'Caddy - certificado Lets Encrypt e redirecionamento'
ufw allow 443/tcp comment 'Caddy - HTTPS'
ufw allow 51820/udp comment 'WireGuard'
ufw allow from "$LAN" to any port 22 proto tcp comment 'SSH somente da rede local'
ufw allow from "$VPN" to any port 22 proto tcp comment 'SSH pela VPN'
# Modo B (relé): somente o VPS, pelo túnel, alcança o Node.
ufw allow in on wg0 from 10.66.0.1 to any port 8080 proto tcp comment 'Relé em nuvem'
ufw --force enable
ufw status verbose
