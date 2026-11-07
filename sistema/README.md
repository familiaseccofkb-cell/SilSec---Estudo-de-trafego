# SilSec Engenharia · Estudos de tráfego (versão Hostinger)

Programa para estudos de tráfego de elevadores (NBR 5665 e ISO 8100-32), com escadas rolantes, propostas de fornecedores, relatórios e PowerPoint, publicado em `silsec-engenharia.com.br`. Esta versão roda em qualquer hospedagem Node.js e foi preparada para **Node.js Web Apps da Hostinger** com **MySQL**.

Para instalar, siga o guia **[INSTALACAO_HOSTINGER.md](INSTALACAO_HOSTINGER.md)**. Aplicativos (Windows, Android, iPhone) e console do desenvolvedor: **[docs/APLICATIVOS.md](docs/APLICATIVOS.md)**. A justificativa do preço da anuidade está em **[docs/PRECIFICACAO.md](docs/PRECIFICACAO.md)**.

## Endereços

| Caminho | Conteúdo |
|---|---|
| `/` | Site do sistema (plataforma, vídeos, como começar, planos, estudantes, contato) |
| `/experimentar` | Cadastro com 30 dias grátis do plano Completo, sem chave e sem cartão |
| `/ativar` | Ativação de chaves de cortesia (parcerias e turmas) |
| `/admin` | Console do desenvolvedor: usuários, acessos, pagamentos, manutenção, cópias e auditoria |
| `/sistema` | Programa de estudos de tráfego |
| `/assinatura` | Situação do acesso e pagamento da anuidade pelo Mercado Pago |
| `/vistorias` | Vistorias guiadas: modelos, preenchimento por seção com fotos e relatório |
| `/painel` | Administração: chaves, clientes, pagamentos e mensagens do site |
| `/webhooks/mercadopago` | Notificações de pagamento (conferidas na API do Mercado Pago antes de liberar) |

## O que mudou em relação à versão anterior

| Antes | Agora |
|---|---|
| Next.js/Vinext em Cloudflare Workers | Servidor Node.js próprio (`server.mjs`), sem framework |
| Banco Cloudflare D1 | MySQL/MariaDB da hospedagem (ou SQLite local) |
| Arquivos no Cloudflare R2 | Arquivos dentro do banco (tabela `stored_files`) ou numa pasta |
| Login "Entrar com ChatGPT" | Login próprio: cadastro por e-mail com criação de senha pelo link, recuperação de senha, bloqueio por tentativas |
| IA somente pela API da OpenAI | IA configurável: Hostinger AI Router (formato Anthropic/Claude ou OpenAI), Anthropic direta ou OpenAI |
| ~50 dependências npm (React, Next, Wrangler…) | 2 dependências: `mysql2` e `nodemailer` |

O motor de cálculo, as telas, os relatórios, as licenças, os convites e as permissões são os mesmos da versão 9.1. A API (`server/api.mjs` e módulos) foi mantida. Uma camada de compatibilidade entrega a ela o mesmo formato de banco e de arquivos que ela usava.

## Estrutura

```
server.mjs                  entrada do servidor (arquivo de entrada na Hostinger)
server/api.mjs …            API do SilSec (regras de negócio, sem alteração de comportamento)
server/ai-provider.mjs      provedor de IA configurável
server/platform/
  app.mjs                   roteamento: estáticos, páginas de acesso e API
  auth.mjs, auth-pages.mjs  login, sessões, confirmação e recuperação de senha
  database.mjs              banco MySQL/SQLite com interface D1 e migrações automáticas
  sql-mysql.mjs             tradução das construções SQLite usadas pela API para MySQL
  storage.mjs               arquivos no banco ou em pasta (interface R2)
  mailer.mjs                envio SMTP
  commerce.mjs              site, chaves de acesso, teste grátis, assinatura (Mercado Pago), painel e contato
  inspections.mjs           vistorias guiadas (modelos, preenchimento, fotos e relatório)
  plans.mjs                 planos e preços da anuidade
server/site/pages.mjs       páginas do site e da área do cliente (HTML gerado no servidor)
  config.mjs, http.mjs      variáveis de ambiente e ponte Node ↔ Request/Response
public/                     aplicação no navegador (HTML, JS, CSS, imagens)
db/mysql, db/sqlite         migrações de banco
scripts/criar-usuario.mjs   cria/redefine uma conta confirmada pelo terminal
tests/                      testes automatizados
docs/                       descritivo e histórico funcional das versões
```

## Rodar no computador

Requer Node.js 22.13 ou superior.

```bash
npm install
cp .env.example .env      # preencha SITE_OWNER_EMAIL; sem DB_HOST usa SQLite local
npm start                 # http://localhost:3000
```

Sem SMTP configurado, os links de confirmação aparecem no terminal. Também é possível criar a conta direto pelo terminal:

```bash
node scripts/criar-usuario.mjs voce@dominio.com "Seu Nome" "senha-com-10-caracteres"
```

## Testes

```bash
npm test                                                   # SQLite em memória
TEST_MYSQL_URL=mysql://usuario:senha@127.0.0.1:3306 npm test   # também contra MySQL/MariaDB
```

O teste de PowerPoint usa o pacote `pptxgenjs` (`npm install pptxgenjs --no-save`).

## Segurança

- Senhas guardadas com scrypt. Sessões em cookie `HttpOnly`/`SameSite=Lax` (`Secure` em HTTPS), com o token guardado no banco só como hash.
- A senha só é criada por quem abre o link enviado ao e-mail (cadastro e recuperação). Ninguém consegue reservar o e-mail de outra pessoa com uma senha própria, e a conta do proprietário e os convites são reconhecidos pelo e-mail.
- Cadastro restrito por padrão aos e-mails autorizados pela administração ou convidados (`SIGNUP_MODE=membros`).
- Os cabeçalhos internos de identidade são sempre descartados quando vêm do navegador e só são recriados a partir da sessão.
- Formulários e API recusam requisições de outras origens. O login tem limite de tentativas por IP e bloqueio temporário da conta.
- Manuais e documentos internos (`.html`/`.md`) exigem login. Scripts, estilos e imagens ficam abertos para que os links de consulta compartilhados funcionem.
- As chaves de IA ficam só no servidor.

## Identidade

Nome, telefone, e-mail e logomarca exibidos no programa, nas telas de acesso, nos e-mails e nos relatórios ficam em `public/brand.js` e `public/marca/silsec-engenharia.svg`. Depois de alterar, rode `npm run gerar-ajuda` para atualizar o manual.
