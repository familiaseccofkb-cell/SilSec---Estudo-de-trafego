# SilSec · pacote de 2026-11-18 (9.5.7)

- Versão do aplicativo: 9.5.7. No ar na Hostinger: 9.5.6. Branch `release/9.5.7` criada a partir de `43b58ee` (9.5.6), com as alterações aprovadas na janela de teste do Claude (pacote de 18/11).
- **Lotação nominal na NBR:** NBR 5665 convencional e FAB calculam com a lotação nominal (pessoas); ADS (antecipação de destino) e ISO 8100-32 mantêm o fator de ocupação (`public/cabin-occupancy.js`: `effectiveCapacity` = ocupação, `nominalCapacity` = lotação). Anexo A sem as linhas de fator de ocupação; textos de ajuda revistos; sugestão "Adotar fator de ocupação de 100%" só na ISO.
- **Ajuda contextual** do Relatório e das seções de resultados, comparativo, distribuição, memória, recomendações e partidas por hora (`public/context-help.js`).
- **Renomear projeto** na lista "Projetos salvos" (somente equipe, com controle de revisão): `PATCH /api/projects/:id/name`.
- **Tabela de performance de referência** nos relatórios NBR e ISO.
- Ajustes de população e das tabelas de comparação; gráficos de atendimento com janela de 1 hora e almoço completo; fornecedor isolado (não vê outros fornecedores nem o comparativo); "Adotar estes tempos" ao lado de abertura e fechamento; tempos de porta por tipo e vão; bloco duplicado de porta removido.
- Inclui a correção de layout da revisão 10c (resumo do Cálculo populacional dentro da coluna principal) e o teste `tests/populacao-layout.test.mjs`.
- Janela de teste: `teste-claude/arquivos-do-servidor.json` com `cabin-occupancy.js`, `context-help.js` e `display-number.js`.
- **Situação dos testes automáticos: 454 de 569 aprovados (115 falhas).** Ver o relatório do Code. Não publicar enquanto as falhas não forem resolvidas ou explicadas.
- Publicar só após aprovação do Code e autorização do Fabio. Nada juntado à `main`.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
