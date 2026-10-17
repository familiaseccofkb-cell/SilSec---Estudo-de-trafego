# 3. Como montar o servidor local com DNS dinâmico

Tempo estimado: 3 a 5 horas na primeira vez. Pré-requisito: equipamentos da [lista de compras](04-lista-de-compras.md).

## 3.1 Antes de começar: sua internet tem IP público?

O DNS dinâmico (DDNS) só funciona se o roteador recebe um **IP público**. Muitas operadoras de fibra residencial usam **CGNAT** (IP compartilhado), que impede o acesso de fora.

Como verificar:
1. No painel do roteador, veja o "IP WAN".
2. Compare com o IP mostrado em <https://ipv4.icanhazip.com>.
3. Se forem **iguais** → IP público: use o **Modo A (DDNS direto)**.
4. Se forem **diferentes**, ou o IP WAN começar com `100.64`–`100.127`, `10.`, `172.16`–`172.31`, `192.168.` → CGNAT. Escolha uma opção:
   - pedir à operadora **IP público** (fixo ou dinâmico; muitas oferecem em plano empresarial ou mediante solicitação) e usar o Modo A; ou
   - usar o **Modo B (relé em nuvem)**, que funciona com CGNAT — ver [`servidor-nuvem/README.md`](../servidor-nuvem/README.md).

## 3.2 Preparar o computador servidor

1. Baixe o **Ubuntu Server 24.04 LTS** (<https://ubuntu.com/download/server>) e grave em um pendrive com o balenaEtcher ou Rufus.
2. Instale no mini PC:
   - marque **"Encrypt the LVM group with LUKS"** (criptografia do disco: protege os dados se o equipamento for furtado). Guarde a senha do disco no cofre de senhas;
   - instale o **OpenSSH server**;
   - crie seu usuário administrador (não use "admin"/"root").
3. No BIOS: "Restore on AC power loss" = **Power On** (religa sozinho depois de queda de energia).
4. No roteador: **reserva de DHCP** (IP fixo) para o servidor, ex.: `192.168.1.10`.
5. No seu computador: `ssh-copy-id seu_usuario@192.168.1.10` (acesso por chave; a senha do SSH será desligada).

> Sobre a criptografia do disco: depois de reiniciar, o Ubuntu pede a senha do LUKS na tela. Para religar sozinho após queda de energia sem digitar a senha, use o TPM do mini PC (`systemd-cryptenroll --tpm2-device=auto`), ou deixe o nobreak segurar a energia e desligar com segurança.

## 3.3 Instalar o SilSec

```bash
sudo apt-get install -y git
git clone https://github.com/familiaseccofkb-cell/SilSec---Estudo-de-trafego.git
cd SilSec---Estudo-de-trafego
sudo bash infra/instalar-servidor-local.sh
```

O script instala Node.js 22, Caddy, WireGuard, restic, ddclient, fail2ban, NUT, atualizações automáticas de segurança, cria o usuário de serviço `silsec`, copia o sistema para `/opt/silsec` e ativa o serviço.

Depois:

```bash
sudo nano /etc/silsec/silsec.env        # e-mail do proprietário, endereços de acesso
sudo systemctl restart silsec
sudo silsec-cli criar-conta seu-email@exemplo.com.br "Seu Nome"   # mostra a senha provisória
curl http://127.0.0.1:8080/saude                                   # {"ok":true}
```

Entre pelo navegador, vá em **Conta** (botão no canto inferior) → troque a senha → **ative a verificação em duas etapas**.

## 3.4 Domínio e DNS dinâmico (Modo A)

1. **Domínio**: registre `seudominio.com.br` no Registro.br (ou use um subdomínio gratuito DuckDNS/No-IP).
2. Recomendado: gerencie o DNS na **Cloudflare** (plano gratuito) — permite atualização automática por token.
3. Crie o registro `silsec.seudominio.com.br` (tipo A, proxy **desligado**/"DNS only").
4. Configure o ddclient:
   ```bash
   sudo cp /opt/silsec/infra/ddns/ddclient.conf.exemplo /etc/ddclient.conf
   sudo chmod 600 /etc/ddclient.conf && sudo nano /etc/ddclient.conf   # token e nome
   sudo systemctl enable --now ddclient
   sudo ddclient -query                                                # mostra o IP detectado
   ```
5. **No roteador**: encaminhe as portas **TCP 80 e 443** para `192.168.1.10`. Não encaminhe 22 (SSH) nem 8080.
6. Ajuste `/etc/caddy/Caddyfile` (domínio e e-mail) e `sudo systemctl reload caddy`. O certificado HTTPS é emitido automaticamente em segundos.
7. Teste no celular **fora do Wi-Fi** (4G): `https://silsec.seudominio.com.br`.

Alguns roteadores já têm cliente DDNS embutido (No-IP, DynDNS, DuckDNS). O ddclient no servidor é preferível porque não depende do modelo do roteador.

## 3.5 Rede local sem internet

Para o escritório continuar funcionando quando a internet cair:
- no DNS do roteador (ou no Pi-hole/AdGuard), aponte `silsec.lan` → `192.168.1.10`;
- o bloco `silsec.lan` do Caddyfile usa certificado interno; instale a raiz do Caddy uma vez em cada aparelho (`/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt`);
- inclua `https://silsec.lan` em `SILSEC_PUBLIC_ORIGINS`.

Alternativa mais simples: usar sempre o domínio público e configurar no roteador o **NAT loopback/hairpin** (ou DNS local apontando o domínio público para o IP interno).

## 3.6 Firewall, proteção contra força bruta e atualizações

```bash
sudo LAN=192.168.1.0/24 bash /opt/silsec/infra/firewall/ufw.sh
sudo systemctl restart ssh            # só depois de confirmar que o login por chave funciona
```

Atualizações de segurança do Ubuntu são aplicadas sozinhas (`unattended-upgrades`). Para atualizar o SilSec:

```bash
cd ~/SilSec---Estudo-de-trafego && git pull && sudo bash infra/instalar-servidor-local.sh
```

## 3.7 Nobreak com desligamento seguro

Conecte o cabo USB do nobreak ao servidor e configure o NUT (`/etc/nut/ups.conf` com `driver = usbhid-ups`, `nut.conf` com `MODE=standalone`). Assim o servidor desliga sozinho antes de a bateria acabar, evitando corromper o banco.

## 3.8 Backup externo (regra 3-2-1)

3 cópias, 2 mídias diferentes, 1 fora do escritório:

| Cópia | Onde | Frequência |
|---|---|---|
| 1 | Banco em uso (`/var/lib/silsec`) — disco criptografado | — |
| 2 | Cópia diária local (`/var/lib/silsec/backups`, últimas 14) + HD externo USB (restic, criptografado) | Diária |
| 3 | Nuvem (Backblaze B2 ou similar, restic criptografado — o provedor não lê os dados) | Diária |

```bash
sudo cp /opt/silsec/infra/backup/backup.env.exemplo /etc/silsec/backup.env && sudo chmod 600 /etc/silsec/backup.env
sudo sh -c 'openssl rand -base64 32 > /etc/silsec/restic.senha && chmod 600 /etc/silsec/restic.senha'
sudo nano /etc/silsec/backup.env
sudo bash -c 'source /etc/silsec/backup.env && restic -r "$REPO_USB" init && restic -r "$REPO_NUVEM" init'
sudo systemctl enable --now silsec-backup.timer
sudo systemctl start silsec-backup.service && journalctl -u silsec-backup -n 30
```

**Guarde a senha do restic fora do servidor.** Sem ela, nenhum backup pode ser restaurado.

### Restaurar (testar a cada 3 meses)

```bash
sudo systemctl stop silsec
sudo bash -c 'source /etc/silsec/backup.env && restic -r "$REPO_USB" snapshots'
sudo bash -c 'source /etc/silsec/backup.env && restic -r "$REPO_USB" restore latest --target /tmp/restauracao'
# Dentro de /tmp/restauracao/var/lib/silsec/backups/silsec-AAAA.../ estão silsec.sqlite e arquivos/
sudo cp /tmp/restauracao/.../silsec.sqlite /var/lib/silsec/silsec.sqlite
sudo rsync -a /tmp/restauracao/.../arquivos/ /var/lib/silsec/arquivos/
sudo rm -f /var/lib/silsec/silsec.sqlite-wal /var/lib/silsec/silsec.sqlite-shm
sudo chown -R silsec:silsec /var/lib/silsec && sudo systemctl start silsec
```

## 3.9 Instalar o aplicativo nos aparelhos

| Aparelho | Como instalar |
|---|---|
| Android (Chrome) | Abrir o endereço → menu ⋮ → **Instalar aplicativo** |
| iPhone/iPad (Safari) | Abrir o endereço → Compartilhar → **Adicionar à Tela de Início** |
| Windows/macOS/Linux (Chrome ou Edge) | Ícone de instalação na barra de endereço → **Instalar** |
| Computador sem permissão para instalar | Usar direto no navegador: funciona igual, sem instalar nada |

## 3.10 Administração do dia a dia

```bash
sudo silsec-cli contas                     # lista contas
sudo silsec-cli criar-conta email "Nome"   # nova conta (o e-mail também precisa estar na equipe/convite do sistema)
sudo silsec-cli redefinir-senha email      # senha provisória nova
sudo silsec-cli desativar-2fa email        # celular perdido
sudo silsec-cli bloquear email             # desligamento de colaborador
sudo silsec-cli log 100                    # tentativas de login, bloqueios, trocas de senha
journalctl -u silsec -f                    # registros do serviço
```

As mesmas operações de conta estão na página **Conta** para o proprietário.

## 3.11 Variáveis de configuração

Ver [`infra/silsec.env.exemplo`](../infra/silsec.env.exemplo). Para testes no próprio computador, sem Ubuntu:

```bash
cd servidor-local
SILSEC_OWNER_EMAIL=voce@exemplo.com SILSEC_PUBLIC_ORIGINS=http://localhost:8080 npm run cli -- criar-conta voce@exemplo.com "Você"
SILSEC_OWNER_EMAIL=voce@exemplo.com SILSEC_PUBLIC_ORIGINS=http://localhost:8080 npm start
# abrir http://localhost:8080
npm test
```
