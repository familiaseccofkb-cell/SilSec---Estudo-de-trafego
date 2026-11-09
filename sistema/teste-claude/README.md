# Janela de teste no Claude (servidor real no navegador)

Esta pasta contém o que a janela de teste publicada no Claude acrescenta ao aplicativo para rodar **o servidor real dentro do navegador**:

- `offline-boot.js` — intercepta as chamadas a `/api/...` do aplicativo e as entrega à API real (`server/api.mjs`), monta a barra de teste (seletor de usuário, botão Vistorias, Reiniciar banco) e o painel das vistorias.
- `offline-backend.mjs` — abre um SQLite em JavaScript (sql.js, `vendor/sql-asm.js`), aplica as migrações de `db/sqlite`, cria o cenário inicial (administrador, Empresa A com gestor e funcionário, Empresa B, analista interno, todos com o módulo Avançado) e expõe `api()` e `vistorias()`. O banco é guardado no `localStorage` do navegador.
- `shims/node-crypto.js` — substitui `node:crypto` (via import map em `index.html`).
- `index.html` — página da janela (sem `<!doctype>`: o Claude acrescenta o esqueleto ao publicar).
- `arquivos-do-servidor.json` — lista dos módulos do servidor e de `public/` que precisam ser publicados junto (os módulos do servidor importam `../public/...`, por isso há uma cópia de `public/` dentro da janela).

Para republicar: copiar para a pasta da janela os arquivos de `public/` na raiz, os de `arquivos-do-servidor.json` nos mesmos caminhos (`server/`, `public/`, `db/sqlite/`), estes quatro arquivos, e publicar. Nada aqui é usado em produção.
