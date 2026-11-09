# SilSec · pacote de implantação de 2026-11-09 (9.5.1)

- Versão do aplicativo: 9.5.1 (fonte única em public/version.js; package.json e public/sw.js conferidos por tests/versao.test.mjs).
- Correções deste pacote (relatório do Code sobre a 9.5.0 e os 10 pontos de 07/11):
  - Formulário de orçamento: o campo cidade tinha `name="empresa"`; agora `name="cidade"`.
  - Janela de teste no Claude: fotos de vistoria guardadas no IndexedDB, sobrevivem ao recarregamento.
  - Controle de acessos: rejeitar uma alteração restaura nome e cliente do projeto (`previous_name`, `previous_client_id` em `project_changes`; migrações `db/sqlite/0010` e `db/mysql/0008`) e mantém o projeto calculado. Teste em tests/controle-acessos.test.mjs.
  - Migrações repetíveis: `migrate()` ignora coluna/índice/tabela já existentes (ER_DUP_KEYNAME, ER_DUP_FIELDNAME, ER_TABLE_EXISTS_ERROR e equivalentes SQLite) e registra em `schema_migrations`. A 0007 MySQL pode ser reaplicada sem erro. Teste em tests/versao.test.mjs.
  - Pontos de 07/11: tabela dimensional por elevador (precedência valor próprio → largura da cabina → grupo; validação de faixa na digitação; cópia só de valores preenchidos; alertas de altura por elevador), pular população por pavimento com restauração, escadas rolantes com pavimentos do grafo v2, setores limitados às paradas, versão única no rodapé/sw/package.
- Guia INSTALACAO_HOSTINGER.md revisado: sem passo manual de SQL; cópia de segurança do banco e das variáveis antes do deploy; roteiro de volta; pacote de produção = conteúdo de `sistema/` com `server.mjs` na raiz, sem `tests/`, `teste-claude/` e `docs/`; exemplo genérico de nome de banco.
- Pacotes: `silsec-producao-2026-11-09.zip` (só o que vai para a Hostinger) e `silsec-completo-2026-11-09.zip` (tudo, inclusive testes, teste-claude e docs).
- Testes: 542 com pptxgenjs/jszip instalados (534 sem o módulo de apresentação). O `package-lock.json` deve ser gerado pelo Code com `npm install` (sem rede aqui).
- Pendências: teste em MySQL real (só no Code); troca da senha do banco na Hostinger antes de publicar. Nada publicado; nada juntado à `main`.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
