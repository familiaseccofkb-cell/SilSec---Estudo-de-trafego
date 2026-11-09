# SilSec · pacote de implantação de 2026-11-09

- Versão do aplicativo: 9.5.0 (fonte única em public/version.js; package.json e sw.js conferidos por tests/versao.test.mjs)
- Novidade principal: **site institucional redefinido para a SilSec Engenharia como empresa**, com o sistema de estudo de tráfego apresentado como módulos de serviço adicionais.
  - Páginas: `/` (Início), `/servicos` (Consultoria estratégica, Vistorias técnicas e laudos, Projetos e adequações), `/modulos` (Sistema de estudo de tráfego Básico e Completo, com preços e acesso educacional), `/orcamento` (formulário "Solicite um orçamento").
  - Preços só em `/modulos`; a chamada em todo o site é "Solicite um orçamento"; o formulário grava em `contact_messages` e envia e-mail como o contato anterior (`POST /contato`, campo `origem=orcamento`).
  - `robots.txt` e `sitemap.xml` incluem as páginas novas. Arquivos: server/site/pages.mjs, server/platform/commerce.mjs, public/site.css.
- Janela de teste no Claude: agora roda o **servidor real no navegador** (pasta `teste-claude/`): mesma API, mesmas migrações e o módulo de vistorias, com seletor de usuário (administrador, gestor e funcionário da Empresa A, gestor da Empresa B, analista interno).
- Testes: 529 (528 aprovados na origem; presentation exige pptxgenjs). Páginas do site renderizadas em servidor real sem erros nem rolagem horizontal (1366 e 400 px).
- Implantação na Hostinger: substituir o conteúdo do site pela pasta deste pacote conforme INSTALACAO_HOSTINGER.md; rodar as migrações MySQL pendentes (0006 e 0007); não há migração nova nesta versão. Variáveis de ambiente inalteradas.
- Pendências: teste em MySQL real; troca da senha do banco na Hostinger antes de publicar.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
