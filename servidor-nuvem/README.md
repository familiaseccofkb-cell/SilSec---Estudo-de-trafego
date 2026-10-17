# Servidor em nuvem (relé) — acesso sem instalar nada

Use quando:

- o celular ou computador **não permite instalar** o aplicativo (computador do cliente, máquina corporativa bloqueada): basta abrir `https://silsec.seudominio.com.br` no navegador;
- a operadora **não fornece IP público** (CGNAT, muito comum em fibra residencial no Brasil), o que impede o DDNS de funcionar.

## Como funciona

```
Navegador (qualquer aparelho)
   │  HTTPS (certificado Let's Encrypt)
   ▼
VPS na nuvem ── Caddy ── túnel WireGuard criptografado ──► Servidor local (10.66.0.2:8080)
  (não guarda dados)                                         SQLite + arquivos + backup
```

- O VPS **não armazena** estudos, contas ou arquivos: apenas repassa o tráfego. Desligar o VPS não perde nada.
- O túnel é aberto **pelo servidor local** em direção ao VPS, então funciona mesmo atrás de CGNAT e sem abrir portas no roteador.
- Os cálculos continuam sendo feitos no navegador de quem usa (computador ou celular).

## Requisitos

- VPS Linux pequeno (1 vCPU, 1 GB RAM, Ubuntu 24.04), em data center no Brasil para menor latência. Ver `docs/04-lista-de-compras.md`.
- Domínio próprio com registro A apontando para o IP do VPS (`silsec.seudominio.com.br`).

## Instalação

1. No VPS (como root): `bash instalar-relé.sh` (ou siga os comandos do script manualmente).
2. Gere as chaves WireGuard nos dois lados (`wg genkey | tee privada | wg pubkey > publica`) e preencha:
   - VPS: `/etc/wireguard/wg0.conf` a partir de `vps-wg0.conf.exemplo`;
   - servidor local: `/etc/wireguard/wg0.conf` a partir de `../infra/wireguard/servidor-local-wg0.conf.exemplo`.
3. Nos dois: `systemctl enable --now wg-quick@wg0`. Teste do VPS: `curl http://10.66.0.2:8080/saude` → `{"ok":true}`.
4. No servidor local, em `/etc/silsec/silsec.env`: `SILSEC_HOST=127.0.0.1,10.66.0.2` e inclua o domínio do VPS em `SILSEC_PUBLIC_ORIGINS`. Reinicie: `systemctl restart silsec`.
5. No VPS, copie `Caddyfile` para `/etc/caddy/Caddyfile`, troque domínio/e-mail e `systemctl reload caddy`.

## Alternativa sem VPS: Cloudflare Tunnel

Gratuito, também atravessa CGNAT: `cloudflared tunnel create silsec` no servidor local e rota `silsec.seudominio.com.br → http://127.0.0.1:8080`. Contrapartida: o HTTPS termina na Cloudflare, que passa a enxergar o tráfego em texto claro. Com o VPS próprio, só você controla as chaves.
