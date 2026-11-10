# SilSec · pacote de 2026-11-10 (9.5.6)

- Versão do aplicativo: 9.5.6. No ar na Hostinger: 9.5.5 (publicada pelo Code em 10/11 com autorização do Fabio).
- **Site — consultoria para novos projetos** (pedido do Fabio): título da seção "O que a SilSec faz pelo seu edifício e seu projeto"; quinta coluna "Consultoria para novos projetos" na Início (`services five`, 5 → 3 → 2 → 1 colunas conforme a largura); bloco "02 · Consultoria para novos projetos" em /servicos com três frentes (estudo de tráfego do empreendimento, compatibilização com o projeto, especificação e contratação); vistorias e projetos renumerados 03 e 04; link "Novos projetos" no rodapé; opção "Consultoria para novo projeto (quantos elevadores, caixa, poço e casa de máquinas)" no formulário de orçamento; descrição da página /servicos e público ("incorporadoras, construtoras e escritórios de arquitetura") atualizados. Arquivos: `server/site/pages.mjs`, `public/site.css`. Teste em tests/commerce.test.mjs.
- **Ressalva de segurança do Code (9.5.5) corrigida:** telas públicas não revelam mais quem tem conta nem a configuração do servidor quando o e-mail falha. `/esqueci-senha` responde 200 com "Não foi possível enviar o e-mail agora. Tente novamente mais tarde ou fale com contato@…" tanto para e-mail cadastrado quanto não cadastrado (critério: falha de envio nos últimos 15 minutos sem sucesso depois — `mailer.recentFailure()`); `/cadastrar` idem (200), inclusive para e-mail não autorizado ou já com conta; chave de acesso e teste grátis mostram a mesma frase genérica. O motivo técnico (EAUTH 535 etc.) fica só em /admin/sistema e no log. Teste: mesma resposta para os dois casos, sem "SMTP", "EAUTH" ou "hPanel" no HTML público.
- Melhoria do Code: painel mostra "sem SSL (STARTTLS se o servidor oferecer)" quando SMTP_SECURE é falso.
- Pacotes: `silsec-producao-2026-11-10b.zip` e `silsec-completo-2026-11-10b.zip`.
- Testes: 567 com pptxgenjs/jszip (553 sem; 552 aprovados na origem).
- Publicar só após aprovação do Code e autorização do Fabio. Nada juntado à `main`.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
