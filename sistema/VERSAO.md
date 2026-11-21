# SilSec · rascunho de 2026-11-20 (9.5.7, pacote 19l)

- Inclui tudo do 19k (publicado em 20/11) e a troca do vídeo da página inicial pedida pelo Fabio:
  - "Veja em vídeo" passa a mostrar o vídeo y_fxuLWYFJk do canal SilSec Engenharia (youtube-nocookie.com, 16:9, sem autoplay);
  - sai o vídeo antigo 2NFZdsuN4_4 e a referência ao mp4 próprio (/site/estudo-de-trafego.mp4), que não existia no pacote.
- Teste novo: tests/site-video.test.mjs.

# SilSec · rascunho de 2026-11-20 (9.5.7, pacote 19k)

- Inclui tudo do 19j (publicado em 20/11) e duas correções do site pedidas pelo Fabio:
  - logo: o endereço passa a levar ?v=9.5.7, para navegador e CDN buscarem o logo novo em vez do antigo guardado em cache;
  - cartão "Resultado de um estudo" (página Módulos): a coluna da direita fica alinhada à direita, também quando quebra linha.
- Testes: 593 de 593 aprovados no Node 26.13.0.

# SilSec · rascunho de 2026-11-20 (9.5.7, pacote 19j)

- Inclui tudo do 19i e a paleta SilSec aprovada pelo Fabio no Canva (verde-escuro #1F2A22, verde #5DA246, âmbar #EDA10B, petróleo #087E79, azul-marinho #142C38, fundo #F3F6F5, menta #E8EFE9, cinza #8A978C):
  - sistema: menu lateral verde-escuro; tons fixos levados à paleta; configuração de grupos (Ativo, Não ativo, Zona expressa, linha do acesso, Última altura) com os tons aprovados, também na tabela por elevador;
  - site: blocos escuros em verde-escuro (--dark) e destaque âmbar (--signal);
  - vermelho só para erro e "não atende" (Remover, barras negativas, faixa de preço e "desativado" passaram à paleta);
  - apresentação: texto escuro sobre o verde e rótulos de valor fora das barras.
- Testes: 593 de 593 aprovados no Node 26.13.0.

# SilSec · rascunho de 2026-11-20 (9.5.7, pacote 19i)

- Inclui tudo do 19h e as decisões do Fabio de 19 e 20/11 (ver o aviso único ao chat de desenvolvimento):
  - D1, D2, D3 e D6 aprovadas; D4, D5, D7 e D8 recusadas (voltam à 9.5.6).
  - Transferência por pessoa pela NBR 5665, Tabela 4; partida 0 s sinalizada para confirmação com o fornecedor.
  - NBR com porta e vão do projeto; fabricante em campos próprios, com aviso de divergência.
  - Anexo A NBR só com termos da norma; Anexo A · Fabricante e resumo de divergência só com comparativo.
  - Rodapé de siglas em telas, relatório, anexos e manuais; apresentação no padrão do Canva, com rodapé único e página "Siglas utilizadas".
  - Comparativo do ADS só com a opção "Estimar sistema com antecipação de destino" marcada.
- Testes: 593 de 593 aprovados no Node 26.13.0.

# SilSec · rascunho de 2026-11-19 (9.5.7, pacote 19h)

- Inclui tudo do 19g, com a **regra do Fabio "nada ilustrativo"**:
  - retirado o rótulo "Exemplo · ";
  - o destaque da economia no gráfico de consumo só aparece quando a tecnologia e a referência têm dados do fabricante ou de medição. Com valores ilustrativos, não há destaque, rótulo nem marcador (`public/analysis-charts.js`).
- Mantidos: padrão estético dos gráficos (tela conforme o vídeo; pico impresso #946b11), correção B6, flows:212 aprovado.
- Pendentes com o Fabio: seção de energia e cartão do site com valores ilustrativos, D1–D8, cláusulas ISO, texto e método do antecipador da proposta. PowerPoint não alterado.
- Testes: 552 de 585 aprovados no Node 26.13.0; 33 falhas, todas dependentes das decisões D1 a D8.

# SilSec · rascunho de 2026-11-19 (9.5.7, pacote 19g)

- Inclui tudo do 19f e mais:
- **Destaque da economia (aprovado pelo Fabio):** quando a tecnologia de maior economia tem origem ilustrativa (`source = 'illustrative'`), o rótulo começa com "Exemplo · ". Com dados do fabricante ou de medição, não aparece. Arquivo: `public/analysis-charts.js`.
- **Correção B6 (`public/app.js`):** com população declarada, o relatório volta a mostrar a calculada, a declarada e a adotada ("adotada antes das escadas…"), como na 9.5.6.
- Pico impresso em #946b11 confirmado (aprovado). PowerPoint não alterado.
- Testes: 552 de 585 aprovados no Node 26.13.0; 33 falhas, todas dependentes das decisões D1 a D8.

# SilSec · rascunho de 2026-11-19 (9.5.7, pacote 19f)

- Inclui tudo do 19e e mais o **padrão visual dos gráficos** do vídeo "Guia SilSec de Tráfego" (só visual; dados e valores iguais):
  - na tela: fundo #1F2A22, título pequeno em maiúsculas (verde), barras #5DA246, maior barra e pico da demanda em âmbar #EDA10B, linha principal verde contínua, linhas de capacidade/referência cinza #8A978C tracejadas;
  - no relatório e na impressão: fundo claro com os tokens do tema (âmbar #EDA10B tem 2,16:1 no branco; usa-se var(--amber) #946b11, 4,81:1);
  - destaque da economia no gráfico de consumo: percentual grande em âmbar e kWh/ano, os mesmos valores da tabela "Redução";
  - arquivos: `public/analysis-charts.js` e `public/styles.css`; teste: `tests/graficos-padrao.test.mjs`. O PowerPoint não mudou.
- Testes: 549 de 584 aprovados no Node 26.13.0; 35 falhas, todas dependentes das decisões D1 a D8.

# SilSec · rascunho de 2026-11-19 (9.5.7, pacote 19e)

- Inclui tudo do 19d e mais os **ícones novos aprovados pelo Fabio em 19/11**, feitos com o desenho do prédio da logo (sem o texto): `public/favicon.svg`, `public/apple-touch-icon.png`, `public/icones/apple-touch-icon.png`, `public/icones/icone-192.png`, `public/icones/icone-512.png` e `public/icones/icone-maskable-512.png` (mesmos nomes e tamanhos de antes; o manifest não mudou).
- Testes: 546 de 581 aprovados no Node 26.13.0; 35 falhas, todas dependentes das decisões D1 a D8.

# SilSec · rascunho de 2026-11-19 (9.5.7, pacote 19d)

- Inclui tudo do 19c e mais:
- **Comparativo do ADS só com a opção marcada:** sem "Estimar sistema com antecipação de destino", o cartão mostra só a chamada convencional (sem coluna ADS, sem comparação, sem o texto do método). Com a opção, o comparativo aparece como antes. A caixa continua visível. O cálculo não mudou (números iguais antes e depois, com e sem a opção). Texto do método no estudo: ISO 8100-32, sem número de cláusula (`ADS_STUDY_METHOD_STATEMENT`). Ajuda nova "calculoConvencional". Arquivos: `ads-comparison.js`, `destination-view.js`, `destination-control.js`, `context-help.js`. Teste: `tests/ads-opcao.test.mjs`.
- **Correção B5 (`app.js`):** a tabela de população do relatório voltou a mostrar as exclusões "acesso à rua confirmado: população desconsiderada" e "uso exclusivo da edificação: população desconsiderada", como na 9.5.6.
- **Testes:** 546 de 581 aprovados no Node 26.13.0; 35 falhas, todas dependentes das decisões D1 a D8.

# SilSec · rascunho de 2026-11-19 (9.5.7, pacote 19c)

- Versão do aplicativo: 9.5.7 (a 9.5.7 nunca foi publicada; no ar na Hostinger: 9.5.6 revisão 10c). Sem commit, sem push, sem publicação.
- **Logo:** `public/marca/silsec-engenharia.svg` é a logo enviada pelo Fabio (480×200). Ícones novos (favicon, apple-touch-icon e ícones do manifest) feitos com o prédio da logo aguardam aprovação e **ainda não estão no pacote**.
- **Site:** removido só o cartão "Cursos e capacitação"; "Projetos e adequações" continua.
- **ADS pela ISO 8100-32** também nos estudos NBR, com o FC da ISO sem arredondar (`public/destination-iso.js`). Capacidade, intervalo e Anexo A seguem a NBR 5665 com a lotação nominal.
- **Tabelas do relatório na tela:** rolam para o lado em largura de celular (`.analysis-print .table-wrap{overflow-x:auto}`); na impressão continuam sem barra de rolagem. Teste: `tests/tabela-celular.test.mjs`.
- **/esqueci-senha:** mesma página e mesmo tempo de resposta (1,2 s) com ou sem cadastro; o envio do link corre em segundo plano (`server/platform/auth.mjs`). Teste em `tests/email.test.mjs`.
- **Orçamento:** assunto do e-mail com no máximo 80 caracteres, cortado no fim de uma palavra e com "…" (`shortSubject` em `server/platform/commerce.mjs`). Teste em `tests/email.test.mjs`.
- **Banco:** nenhuma migração nova na 9.5.7 (as 8 do MySQL já estão aplicadas na 9.5.6).
- **Testes:** 542 de 579 aprovados no Node 26.13.0; 37 falhas, todas classificadas (1 teste desatualizado, 1 possível regressão a confirmar, 35 dependem das decisões D1 a D8).

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
