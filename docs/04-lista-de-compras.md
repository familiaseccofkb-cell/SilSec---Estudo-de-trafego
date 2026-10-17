# 4. Equipamentos e programas: o que comprar

> Valores são **faixas de referência aproximadas** (out/2026) para orçamento inicial, não cotação. Preços variam com câmbio e loja; confirme antes de comprar.

## 4.1 Equipamentos (compra única)

| Item | Especificação recomendada | Por quê | Faixa (R$) |
|---|---|---|---|
| **Mini PC servidor** | Intel N100/N150 ou Ryzen 5 (série 5000+), **16 GB RAM**, **SSD NVMe 512 GB**, rede gigabit, **TPM 2.0**. Ex.: Beelink, GMKtec, Minisforum, Lenovo ThinkCentre Tiny, Dell OptiPlex Micro | Consumo de 6–15 W ligado 24 h, silencioso, sobra desempenho para dezenas de usuários. TPM permite criptografia de disco com religamento automático | 1.500 – 3.500 |
| Alternativa econômica | Raspberry Pi 5 8 GB + SSD NVMe (HAT M.2) + fonte oficial + case com ventilação | Funciona (ARM64 suportado), porém sem TPM e com menos folga | 900 – 1.400 |
| **Nobreak** | 600–1.200 VA, senoidal ou interativo, **com porta USB** de comunicação (compatível com NUT) | Evita corrupção do banco em queda de energia; desligamento automático seguro. Ligar servidor **e roteador/ONU** | 450 – 1.200 |
| **HD/SSD externo USB** (×2 ideal) | 1–2 TB, USB 3. Um fica conectado (backup diário), outro guardado fora do escritório e trocado mensalmente | Segunda mídia da regra 3-2-1; proteção contra ransomware com rodízio | 350 – 700 cada |
| Roteador (se o atual for fraco) | Com **reserva de DHCP**, **encaminhamento de portas**, DDNS e Wi-Fi 6. Ex.: TP-Link Archer/Deco, ASUS, MikroTik hAP ax | Necessário para acesso externo (modo A) e rede local estável | 300 – 900 |
| Cabo de rede Cat6 | Ligar o servidor ao roteador por cabo, não por Wi-Fi | Estabilidade | 20 – 50 |
| Monitor/teclado | Só na instalação (pode usar emprestado) | Instalar o Ubuntu e digitar a senha do disco | — |

**Total inicial típico:** R$ 2.700 a 6.500 (mini PC + nobreak + 2 HDs + cabo; roteador se necessário).

## 4.2 Serviços (custo recorrente)

| Serviço | Para quê | Necessário? | Faixa |
|---|---|---|---|
| **Domínio `.com.br`** (Registro.br) | Endereço fixo `silsec.seudominio.com.br` e certificado HTTPS | Recomendado | ~R$ 40/ano |
| DNS Cloudflare (plano gratuito) | Atualização automática do IP (DDNS) por token | Recomendado | Gratuito |
| DuckDNS / No-IP | Alternativa sem domínio próprio (`xxx.duckdns.org`) | Opcional | Gratuito |
| **IP público** da operadora | DDNS direto (modo A). Pergunte sobre CGNAT | Se escolher o modo A | 0 a ~R$ 50/mês (plano empresarial/fixo) |
| **VPS no Brasil** (1 vCPU, 1 GB) — ex.: Hostinger, Locaweb, Magalu Cloud, AWS Lightsail São Paulo, Oracle Cloud (camada gratuita) | Relé (modo B) para CGNAT e para acesso por navegador de qualquer lugar | Se houver CGNAT ou preferir não abrir portas | R$ 0 – 60/mês |
| **Backup em nuvem** — Backblaze B2, Wasabi, AWS S3, iDrive e2 | Cópia fora do escritório (criptografada pelo restic) | Recomendado | ~US$ 6/TB/mês (estudos ocupam poucos GB: centavos a poucos reais) |
| Gerenciador de senhas — Bitwarden (gratuito/família), 1Password | Guardar senhas do LUKS, restic, roteador, Cloudflare, VPS | Recomendado | 0 – R$ 25/mês |
| Normas ABNT (Catálogo ABNT / Target GEDWeb) | Licença de uso das normas usadas no sistema | Obrigatório para uso profissional | Conforme licença |

## 4.3 Programas a instalar (todos gratuitos e de código aberto)

| Programa | Função | Onde |
|---|---|---|
| Ubuntu Server 24.04 LTS | Sistema operacional, suporte de segurança até 2029 (2034 com Ubuntu Pro gratuito para até 5 máquinas) | Servidor |
| Node.js 22 LTS | Executa o servidor SilSec (inclui SQLite nativo) | Servidor |
| Caddy | HTTPS automático (Let's Encrypt) e proxy reverso | Servidor e VPS |
| WireGuard | VPN: túnel do relé e administração remota | Servidor, VPS, celular/notebook do administrador |
| ddclient | Atualização do DNS dinâmico | Servidor (modo A) |
| restic | Backup criptografado e deduplicado | Servidor |
| ufw + fail2ban | Firewall e bloqueio de força bruta no SSH | Servidor e VPS |
| unattended-upgrades | Atualizações de segurança automáticas | Servidor e VPS |
| NUT (Network UPS Tools) | Desligamento seguro pelo nobreak | Servidor |
| Google Authenticator / Microsoft Authenticator / Aegis / 2FAS | Código da verificação em duas etapas | Celular de cada usuário |
| Chrome, Edge ou Safari atualizados | Usar/instalar o aplicativo SilSec | Computadores e celulares |

Nada precisa ser programado além do que está neste repositório: os scripts de `infra/` configuram o servidor e `servidor-local/` já contém o programa.

## 4.4 O que programar/configurar no computador servidor (resumo)

1. Instalar Ubuntu com disco criptografado (LUKS) e SSH por chave.
2. `sudo bash infra/instalar-servidor-local.sh` (instala tudo da seção 4.3 e o serviço SilSec).
3. Editar `/etc/silsec/silsec.env` (e-mail do proprietário, endereços).
4. Criar a primeira conta (`sudo silsec-cli criar-conta …`) e ativar o 2FA.
5. Configurar DDNS (`/etc/ddclient.conf`) + portas 80/443 no roteador — **ou** o relé em nuvem.
6. Configurar o Caddy (domínio), o firewall, o nobreak (NUT) e o backup externo (`silsec-backup.timer`).
7. Testar a restauração de um backup.

Passo a passo completo: [03-servidor-local.md](03-servidor-local.md).
