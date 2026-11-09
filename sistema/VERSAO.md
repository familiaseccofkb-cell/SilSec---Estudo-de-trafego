# SilSec · pacote de implantação de 2026-11-09 (9.5.2)

- Versão do aplicativo: 9.5.2 (fonte única em public/version.js; package.json e public/sw.js conferidos por tests/versao.test.mjs).
- Correções do relatório do Code sobre a 9.5.1:
  1. Nenhuma medida da tabela dimensional herda do grupo: cada elevador mostra só o que foi digitado para ele (`carSiteDimensionValues`); o grupo apenas espelha o elevador vinculado para a avaliação do produto. Estudos antigos (só levantamento do grupo) migram as medidas para o elevador vinculado ao carregar.
  2. Copiar coluna copia só os valores próprios do elevador de origem (nada herdado); valores dos outros elevadores não são apagados.
  3. Setores de destino: -1, 1000 e não inteiros são recusados na digitação, o campo volta ao valor anterior; texto de ajuda revisto.
  4. `teste-claude/arquivos-do-servidor.json` inclui `db/sqlite/0010_alteracoes_nome_cliente.sql`.
  5. `.env.example` com `u123456789_silsec`.
  6. `package-lock.json`: continua a cargo do Code (`npm install`), sem rede aqui.
  7. Testes de tela para os itens 1 e 2 (tests/flows.test.mjs) e de módulo (tests/car-dimensions.test.mjs); teste de tela para o item 3.
  - Melhoria atendida: aviso ao abrir estudo com medidas fora de faixa descartadas. O guia indica que `docs/` fica só no pacote completo.
- Pedidos do Fabio (09/11):
  - Botão de mostrar/ocultar senha ("lupa") em todos os campos de senha: entrar, criar/redefinir senha e minha conta (`server/platform/auth-pages.mjs`).
  - Contas da administração com acesso permanente (contagem infinita): contato@silsec-engenharia.com.br, fabio.secco@silsec-engenharia.com.br, fabiosecco@hotmail.com e fabiossecco@gmail.com — entram sempre como administradoras, ativas e sem vencimento; lista configurável em `SITE_OWNER_EMAILS` (padrão com os quatro). Teste em tests/contas-administracao.test.mjs.
  - Administrador de exemplo no guia e no `.env.example`: fabiosecco@hotmail.com. Janela de teste no Claude entra como "Fabio Secco".
- Pacotes: `silsec-producao-2026-11-09b.zip` (só o que vai para a Hostinger) e `silsec-completo-2026-11-09b.zip` (tudo).
- Testes: 558 com pptxgenjs/jszip (545 sem o módulo de apresentação; 544 aprovados na origem).
- Pendências: teste em MySQL real (só no Code, exige Node com npm na máquina dele); troca da senha do banco na Hostinger antes de publicar. Nada publicado; nada juntado à `main`.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
