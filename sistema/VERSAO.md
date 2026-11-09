# SilSec · pacote de implantação de 2026-11-09 (9.5.3)

- Versão do aplicativo: 9.5.3 (fonte única em public/version.js; package.json e public/sw.js conferidos por tests/versao.test.mjs).
- Correções do relatório do Code sobre a 9.5.2:
  1. Alerta de altura de volta ao relatório (tela, impressão, HTML, PPTX): `projectFleet()` (public/fleet.js) agora leva `siteDimensions` de cada elevador para o estudo de cálculo. Teste de tela calcula e procura o alerta em `#print-report` (tests/flows.test.mjs); conferido também em navegador real na janela de teste.
  2. Aviso de medidas descartadas virou painel fixo no topo do estudo (não some com o aviso do módulo), fechado em "Entendi"; aparece ao abrir projeto e ao importar arquivo.
  3. O aviso mostra o valor descartado ("quantidade de portas: 9").
  4. Nota abaixo da tabela dimensional revista: nenhum campo herda do grupo.
  5. Endereços corretos no envio: /entrar, /redefinir-senha, /verificar e /conta.
  - Melhoria atendida: a contagem "N alerta(s) de altura" no título do grupo atualiza ao sair do campo.
- Mantido da 9.5.2: medidas por elevador sem herança, setores validados, lupa na senha, contas da administração permanentes (os quatro e-mails; grafia fabiossecco@gmail.com confirmada pelo Fabio).
- Pacotes: `silsec-producao-2026-11-09c.zip` e `silsec-completo-2026-11-09c.zip`.
- Testes: 561 com pptxgenjs/jszip (548 sem o módulo de apresentação; 547 aprovados na origem). `package-lock.json` gerado pelo Code (Node 26 / npm 11.20) — pedir para commitar na branch.
- Pendências: MySQL real (o Code tem o roteiro pronto; depende da senha root do MariaDB digitada pelo Fabio); troca da senha do banco na Hostinger antes de publicar. Nada publicado; nada juntado à `main`.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
