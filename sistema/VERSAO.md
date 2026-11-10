# SilSec · pacote de implantação de 2026-11-09 (9.5.4)

- Versão do aplicativo: 9.5.4 (fonte única em public/version.js; package.json e public/sw.js conferidos por tests/versao.test.mjs).
- Único item pendente do relatório do Code sobre a 9.5.3: **PowerPoint sem alerta de altura por elevador**. `public/presentation.js` agora monta o slide "existente" com as medidas de cada elevador (`carSiteDimensionValues`) e acrescenta um slide "alertas de altura" por grupo com `carHeightWarnings` ("Elevador 2 · Altura interna da cabina: 1500 mm, inferior à referência mínima de 2200 mm…"). Teste novo em tests/presentation.test.mjs gera o PPTX e procura o alerta no XML dos slides (roda com pptxgenjs; conferido aqui com um gerador simulado).
- MySQL real: verificado e aprovado pelo Code na 9.5.3 (MariaDB, banco vazio e banco com 0001–0007 à mão, controle de acessos, contas da administração).
- Pacotes: `silsec-producao-2026-11-09d.zip` e `silsec-completo-2026-11-09d.zip`.
- Testes: 562 com pptxgenjs/jszip (548 sem o módulo de apresentação; 547 aprovados na origem). `package-lock.json` gerado pelo Code — aguarda autorização do Fabio para o commit.
- Antes de publicar: autorização do Fabio; trocar a senha do banco na Hostinger; "Cópia de segurança antes do deploy" do guia. Nada publicado; nada juntado à `main`.

A lista completa de arquivos com SHA-256 está em LISTA-DE-ARQUIVOS.txt.
