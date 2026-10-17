# 7. Como testar o sistema na nuvem

Três caminhos, do mais rápido ao mais completo.

## 7.1 Teste em 5 minutos (sem domínio e sem VPS) — túnel temporário da Cloudflare

Servidor no seu computador + endereço HTTPS público temporário, que funciona no celular pelo 4G.

1. Instale o Node.js 22 (nodejs.org) e o `cloudflared` (página de downloads da Cloudflare).
2. Na pasta `servidor-local`:
   ```bash
   export SILSEC_OWNER_EMAIL=seu@email.com SILSEC_TRUST_PROXY=true
   npm run cli -- criar-conta seu@email.com "Seu Nome"   # anote a senha provisória
   npm start
   ```
   No Windows (PowerShell): `$env:SILSEC_OWNER_EMAIL="seu@email.com"; $env:SILSEC_TRUST_PROXY="true"`.
3. Em outro terminal: `cloudflared tunnel --url http://localhost:8080` → abra o endereço `https://….trycloudflare.com` mostrado.

`SILSEC_PUBLIC_ORIGINS` fica vazio de propósito (o endereço muda a cada execução); o servidor mostra um aviso. Não use assim com dados reais. O endereço some ao fechar o terminal.

## 7.2 Sistema inteiro num VPS (sem comprar domínio)

VPS Ubuntu 24.04 (Oracle Cloud gratuito ou qualquer VPS de R$ 25–50/mês). HTTPS sem domínio com sslip.io: IP `203.0.113.7` → endereço `silsec.203-0-113-7.sslip.io`.

```bash
sudo apt-get install -y unzip
unzip SilSec-servidor-local.zip -d SilSec && cd SilSec
sudo bash infra/instalar-servidor-local.sh
sudo nano /etc/silsec/silsec.env
#   SILSEC_OWNER_EMAIL=seu@email.com
#   SILSEC_PUBLIC_ORIGINS=https://silsec.203-0-113-7.sslip.io
sudo nano /etc/caddy/Caddyfile
#   troque "silsec.seudominio.com.br" por "silsec.203-0-113-7.sslip.io" e apague o bloco "silsec.lan"
sudo systemctl restart silsec && sudo systemctl reload caddy
sudo silsec-cli criar-conta seu@email.com "Seu Nome"
```

Cuidados num VPS:
- **Não rode** `infra/firewall/ufw.sh` como está (libera SSH só para a rede local e você ficaria trancado fora). Use:
  `sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw --force enable`
- O instalador desliga o login SSH por senha: confirme antes que você entra por chave.
- Libere as portas 80 e 443 também no painel do provedor (na Oracle: "Security List").

Esta opção guarda os dados no VPS: serve para testar; o uso definitivo é com o servidor no escritório.

## 7.3 Arquitetura definitiva: relé em nuvem + servidor no escritório

Siga [`servidor-nuvem/README.md`](../servidor-nuvem/README.md). Validação do túnel, no VPS: `curl http://10.66.0.2:8080/saude` → `{"ok":true}`.

## 7.4 Roteiro de testes

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Abrir o endereço | Tela **Entrar**, com cadeado HTTPS |
| 2 | Entrar → **Conta** → trocar a senha → ativar a verificação em duas etapas | Na próxima entrada, pede o código do autenticador |
| 3 | No computador: criar estudo, calcular e **Salvar projeto** | Projeto na lista |
| 4 | No celular pelo 4G: entrar e abrir o mesmo projeto | Mesmos dados |
| 5 | Instalar o app (Android: menu ⋮ → Instalar; iPhone: Compartilhar → Tela de Início) | Ícone SilSec na tela inicial |
| 6 | Modo avião → abrir o app → alterar população → calcular | Faixa "Sem conexão" e cálculo funcionando |
| 7 | Salvar em modo avião; religar a conexão e salvar de novo | Aviso de offline; depois grava normalmente |
| 8 | Editar o mesmo projeto em dois aparelhos e salvar nos dois | O segundo é recusado por conflito, sem sobrescrever |
| 9 | Errar a senha 5 vezes | Conta bloqueada temporariamente |
| 10 | `curl -H "oai-authenticated-user-email: seu@email.com" https://SEU-ENDERECO/api/session` | `401` |
| 11 | `sudo silsec-cli backup` e `sudo silsec-cli log` (no 7.1: `npm run cli -- backup` e `npm run cli -- log`) | Backup criado e tentativas de login registradas |
| 12 | Conta → **Sair deste aparelho** | Volta à tela Entrar |

Em caso de erro, guarde a mensagem e a saída de `journalctl -u silsec -n 50` (7.2 e 7.3).
