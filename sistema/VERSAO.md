# SilSec · pacote de 2026-11-10 (9.5.5)

- Versão do aplicativo: 9.5.5 (fonte única em public/version.js; package.json e public/sw.js conferidos por tests/versao.test.mjs).
- No ar na Hostinger desde 09/11: 9.5.4 (publicada pelo Code com autorização permanente do Fabio).
- Pedidos do Code para a 9.5.5 (vulnerabilidades do nodemailer e e-mail):
  1. `nodemailer` ^10.4.0 em package.json. O código de envio (`server/platform/mailer.mjs`) usa só `createTransport({host, port, secure, auth, timeouts})` e `sendMail`, que não mudaram entre a 7 e a 10; a importação aceita o módulo em ESM ou CommonJS. **Não há nodemailer instalado aqui**: o Code precisa rodar `npm install`, `npm audit --omit=dev` (esperado 0) e um envio real de teste.
  2. Teste automático com transporte de teste injetado (`createMailer(smtp, log, {createTransport})`), em tests/email.test.mjs: cadastro (link de verificação), recuperação de senha (link /redefinir-senha), orçamento (e-mail para a SilSec com reply-to), falha EAUTH 535 e painel do administrador.
  3. Aviso na tela quando o envio falha: `/cadastrar` e `/esqueci-senha` respondem 502 com "Não foi possível enviar o e-mail agora: <motivo em português>"; chave de acesso e teste grátis mostram o motivo em vez de "Enviamos…"; contato/orçamento redirecionam com `contato=registrado` ("registrada, mas o aviso por e-mail não pôde ser enviado"). Sem SMTP configurado, continua como antes (link no log).
  4. Botão **Testar envio de e-mail** em `/admin/sistema` (painel "Envio de e-mail"): mostra servidor, porta, modo, usuário e remetente (nunca a senha), a última falha com data e motivo, e o resultado do teste (sucesso com tempo, ou erro do SMTP traduzido: EAUTH, ECONNECTION, ETIMEDOUT, EENVELOPE…). Registrado na auditoria (`mail-test`).
  5. `package-lock.json`: gerar aí depois do `npm install` com o nodemailer 10 e commitar na branch (com autorização do Fabio).
  6. `image-size` (2 avisos altos, via pptxgenjs/devDependency): `"overrides": {"image-size": "^2.1.0"}` em package.json. O Code confere se o teste do PPTX continua passando com a 2.x e se `npm audit` (com e sem `--omit=dev`) zera.
- Pacotes: `silsec-producao-2026-11-10.zip` e `silsec-completo-2026-11-10.zip`.
- Testes: 566 com pptxgenjs/jszip (552 sem o módulo de apresentação; 551 aprovados na origem).
- Antes de publicar: aprovação do Code (incluindo envio real com a SMTP_PASSWORD correta) e autorização do Fabio. Nada juntado à `main`.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
