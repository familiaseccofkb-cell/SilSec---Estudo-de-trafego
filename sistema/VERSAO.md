# SilSec · pacote completo de 2026-11-06

- Versão do aplicativo: 9.4.0
- Origem: ambiente de desenvolvimento do Claude (sessão SilSec), que substitui integralmente o commit 1dadcb7 do GitHub (17/10, pasta sistema-original).
- Node exigido: >= 20 (testado em 22; teste do PPTX ajustado para Node 24).
- Testes na origem: 524 testes, 523 aprovados; 1 reprovado por falta do pacote pptxgenjs neste ambiente (instalar com npm install).
- Conteúdo: public/, server/, db/, tests/, scripts/, docs/, instaladores/, server.mjs, desktop.mjs, package.json, README.md, INSTALACAO_HOSTINGER.md.
- Migrações: MySQL 0001-0007 e SQLite 0000-0009 (0007/0009 novas: índices do controle de acessos).

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
