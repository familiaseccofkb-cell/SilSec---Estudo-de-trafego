# SilSec · Estudos de tráfego — celular, computador e servidor local

Sistema de estudo de tráfego de elevadores (ABNT NBR 5665 e ISO 8100-32) que funciona **no celular e no computador**, faz **todos os cálculos no próprio aparelho** e guarda os dados em um **servidor local seu**, acessível pela internet via DNS dinâmico ou por um relé em nuvem para quem não pode instalar nada.

## Documentação

| # | Documento | Conteúdo |
|---|---|---|
| 1 | [Avaliação do sistema](docs/01-avaliacao-do-sistema.md) | Erros encontrados, conferência do motor com a NBR 5665, melhorias feitas e próximas |
| 2 | [Arquitetura](docs/02-arquitetura.md) | Como celular, computador, servidor local e nuvem se comunicam |
| 3 | [Servidor local e DNS dinâmico](docs/03-servidor-local.md) | Passo a passo: Ubuntu, instalação, domínio/DDNS, roteador, HTTPS, firewall, nobreak, backup |
| 4 | [Lista de compras](docs/04-lista-de-compras.md) | Equipamentos, serviços e programas (com faixas de custo) |
| 5 | [Proteção de dados](docs/05-protecao-de-dados.md) | Camadas de segurança, LGPD, rotina e plano de incidente |
| 6 | [Normas](docs/06-normas.md) | NBR 5665, 16858-3/-4/-6/-7, 16083 e demais referências do projeto |
| — | [Relé em nuvem](servidor-nuvem/README.md) | Acesso pelo navegador de qualquer lugar, inclusive com CGNAT |

## Estrutura

```
sistema-original/   código SilSec recebido (interface, motor de cálculo, API, testes)
servidor-local/     servidor Node.js sem dependências: login/2FA, SQLite, arquivos, backup, PWA
servidor-nuvem/     relé opcional (Caddy + WireGuard) — não armazena dados
infra/              instalação Ubuntu, systemd, Caddy, DDNS, firewall, WireGuard, backup externo
docs/               documentação (e, em docs/original/, o descritivo recebido)
```

## Teste rápido no seu computador

Requer Node.js 22.13 ou mais recente.

```bash
cd servidor-local
export SILSEC_OWNER_EMAIL=voce@exemplo.com SILSEC_PUBLIC_ORIGINS=http://localhost:8080
npm run cli -- criar-conta voce@exemplo.com "Seu Nome"   # mostra a senha provisória
npm start                                                 # abra http://localhost:8080
```

## Testes

```bash
cd servidor-local && npm test                              # servidor local (8 testes)
cd sistema-original && pnpm install && pnpm test           # sistema (491 testes)
```
