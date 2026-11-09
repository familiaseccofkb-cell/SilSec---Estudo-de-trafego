# SilSec · pacote completo de 2026-11-08

- Versão do aplicativo: 9.4.2 (fonte única em public/version.js; package.json e sw.js conferidos por tests/versao.test.mjs)
- Diferença para a 9.4.1 (commit b782565):
  1. Escadas rolantes (editor v2): a rede andar a andar pela tabela de pavimentos calculava só quando todo andar tinha composição; agora os níveis do editor são aceitos (public/population.js). Teste: tests/escadas-tabela-pavimentos.test.mjs.
  2. Tela de Assinatura/Licenças tolera resposta parcial do servidor (public/license-ui.js) — na versão de teste offline quebrava com "reading 'map'".
  3. Rejeição de alteração do administrador restaura o projeto como calculado, sem exigir recálculo nem bloquear o link de compartilhamento (server/review.mjs). Teste em tests/controle-acessos.test.mjs.
  4. Versão única e service worker: rodapé mostra "versão 9.4.2 · motor 10.0.0"; sw.js subiu de silsec-v9.3.0 para a versão atual (cache antigo era risco de módulos misturados após publicar).
- Validações desta rodada: 529 testes (528 aprovados; presentation exige pptxgenjs); crawler de interface em todas as telas sem erro de JavaScript; servidor real com SQLite: 44 verificações de API (login, empresas, licenças, dupla confirmação, auditoria, compartilhamento sem login, relatório) e navegador logado (salvar, reabrir, compartilhar) sem falhas; ISO 2020 com relatório; despacho por destino; escadas rolantes; largura de celular sem rolagem horizontal.
- Pendências: teste em MySQL real (migrações revisadas por padrão de sintaxe, sem construções exclusivas do SQLite).

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
