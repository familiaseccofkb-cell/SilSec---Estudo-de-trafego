# SilSec · pacote completo de 2026-11-07

- Versão do aplicativo: 9.4.1
- Diferença para a 9.4.0 (branch atualizacao-2026-11-06, commit beb79d0): correção dos 3 defeitos de tela do teste de 07/11 — (1) a tabela dimensional mostra a largura real da porta de cada elevador; (2) o alerta de altura por elevador não some mais ao digitar outro campo; (3) medida fora da faixa é recusada na digitação, com aviso (0–50000 mm; porta 300–4000 mm; 1–4 portas).
- Arquivos alterados: public/dimensions.js, public/app.js, tests/car-dimensions.test.mjs, package.json, VERSAO.md, LISTA-DE-ARQUIVOS.txt.
- Testes na origem: 525 testes, 524 aprovados; 1 reprovado por falta do pptxgenjs neste ambiente (instalar com npm install).
- Pendências conhecidas: teste em MySQL real; controle de acessos com servidor e MySQL; ISO 2020 e painel de despacho por destino sem teste de tela.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
