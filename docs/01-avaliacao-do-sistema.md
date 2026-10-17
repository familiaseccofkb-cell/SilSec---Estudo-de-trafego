# 1. Avaliação do sistema SilSec (versão recebida em 17/10/2026)

Base avaliada: `SilSec_Codigo_Fonte_e_Descritivo.zip` (motor 10.0.0), importada sem alterações no primeiro commit deste repositório (`sistema-original/`).

## 1.1 Como foi verificado

| Verificação | Resultado |
|---|---|
| Suíte de testes original (`node --test tests/*.test.mjs`, Node 22) | 471 testes: **469 passaram, 2 falharam** antes das correções |
| Motor NBR 5665 contra o Anexo B da norma (exemplos 1 e 2) | **Confere**: N = 11,82 e 10,89; T = 155,86 s e 164,78 s; I = 31,17 s e 32,95 s; C<sub>T</sub> = 192,48 e 182,06 |
| Fórmulas 6.1 a 6.5 e tabelas 2 a 6 da NBR 5665 no código (`public/engine.js`) | Conferem (detalhes em 1.3) |
| Leitura da API do servidor (`server/*.mjs`) com foco em autenticação, permissões e armazenamento | Achados em 1.2 |
| Teste ponta a ponta no navegador (Chromium, telas de celular e computador) com o novo servidor local | Login, carregamento do app, instalação do service worker e uso sem conexão funcionando |

Depois das correções: **491 testes do sistema (com `pnpm install`) + 8 do servidor local passando**.

## 1.2 Erros e riscos encontrados

| # | Gravidade | Achado | Situação |
|---|---|---|---|
| E1 | **Alta (segurança)** | A API identifica o usuário só pelos cabeçalhos `oai-authenticated-user-id/email`, que a hospedagem original (OpenAI/Cloudflare) injeta. Em **qualquer outra hospedagem** (servidor local, VPS) quem enviar esses cabeçalhos se passa por qualquer pessoa, inclusive o proprietário. | **Corrigido no servidor local**: os cabeçalhos vindos do navegador são descartados e recriados só após login com senha (e 2FA). Teste automatizado cobre a tentativa de falsificação. |
| E2 | Média | Teste `portal: responsável registra convite…` falha de forma intermitente: espera fixa de 80 ms entre o clique e a consulta ao banco. Sob carga, a consulta lê o link anterior (escopo `all`) e o teste acusa erro. Não é falha do produto (o servidor grava o escopo `supplier` corretamente). | **Corrigido**: o teste aguarda a gravação do novo link antes de conferir. |
| E3 | Baixa | `tests/presentation.test.mjs` falha sem `pnpm install` (pacote `pptxgenjs` ausente). | Documentado; com dependências instaladas os 14 testes passam. |
| E4 | Média (dependência de fornecedor) | Banco D1, armazenamento R2 e login ChatGPT prendem o sistema à hospedagem original; não havia como rodar em servidor próprio. | **Resolvido**: adaptadores SQLite/disco e login próprio em `servidor-local/`, sem alterar a API. |
| E5 | Média (LGPD) | Leitura de notas fiscais/contratos por IA envia documentos a serviço externo (OpenAI). | No servidor local fica **desligado por padrão** (`SILSEC_ENABLE_EXTERNAL_AI=false`). |
| E6 | Média | Sem rotina de backup no sistema original. | **Resolvido**: cópia diária consistente (`VACUUM INTO`) + backup externo criptografado (restic) em HD e nuvem. |
| E7 | Média | Sem uso offline: sem conexão o app mostrava "Acesso privado" e não calculava. | **Resolvido**: PWA com service worker; o cálculo funciona no aparelho sem conexão, com aviso na tela. |
| E8 | Baixa | NBR 5665, Tabela 1, transcrita em `public/reference.js`: lotação 46 tem área máxima 6,48 m², maior que a de 47 (6,37) e 48 (6,46). A sequência das demais linhas (máx. ≈ mín. + 0,16) indica erro tipográfico da norma impressa (6,26 e 6,48). A tabela só é exibida, não entra no cálculo. | Recomendado: manter o valor da norma e acrescentar nota "valor fora da sequência; confirmar na edição vigente". |
| E9 | Baixa | Duas tabelas de área de cabina convivem: NBR 5665 Tabela 1 (referência) e a de `cabin-area.js` ("fornecida pelo usuário", compatível com a NBR 16858-1). Para 4 pessoas: 0,74–0,91 m² × 0,79–0,90 m². | Recomendado: rotular cada tabela com a norma de origem e usar a NBR 16858-1 para elevadores novos. |
| E10 | Baixa | `accelerationTime` no método padrão (`excel-v3`) usa o **degrau superior** da Tabela 2 (1,6 m/s → 4,0 s), enquanto a nota da norma permite interpolação (3,7 s no método `precision`). É conservador, mas deve aparecer no relatório como premissa. Abaixo de 0,63 m/s adota 2,5 s (extrapolação). | Já identificado como premissa na interface; manter visível no relatório. |
| E11 | Baixa (escala) | `visible()` em `server/api.mjs` lê **todos** os projetos e verifica permissão um a um a cada listagem. | Aceitável até alguns milhares de projetos; depois, filtrar por SQL. |
| E12 | Manutenção | `public/app.js` tem 236 KB em 515 linhas (linhas de vários KB, estilo minificado). Dificulta revisão, depuração e contribuição. ESLint 9.39.4 está fora de suporte. | Recomendado: formatar (Prettier), dividir em módulos por tela, atualizar ESLint. |
| E13 | Jurídico | `public/reference.js` reproduz tabelas da NBR 5665; os PDFs recebidos têm marca "uso exclusivo de ELEVADORES OTIS LTDA" / licença individual. | Os PDFs **não foram** incluídos no repositório. Avaliar com a ABNT o uso das tabelas no produto comercial. |
| E14 | Lacuna normativa | Sem verificação de acessibilidade (NBR 16858-3) e sem itens de incêndio, bombeiros, elevadores existentes e manutenção (NBR 16858-4, -6, -7 e NBR 16083). | **Parcialmente resolvido**: conferência de acessibilidade NBR 16858-3 (Tabela 3, 5.2.1, 5.3.2.1) adicionada. Demais normas no plano (1.4). |

## 1.3 Conferência do motor NBR 5665

| Item da norma | Código | Situação |
|---|---|---|
| 5.1.1 relações de população | `population.js` | Confere |
| 5.2.1 percentuais em 5 min (15/12/10/10/6/8/12/20/10/10 %) | `USES` em `engine.js` | Confere |
| 6.1 T = T1 + T2 + 1,1 (T3 + T4) | `calculateGroup` (`additional = 0,1·(T3+T4)`) | Confere |
| 6.2 N = p − (p−1)·((p−2)/(p−1))<sup>c</sup> | `calculateGroup` | Confere; paradas < 2 bloqueadas na validação |
| 6.3 C<sub>t</sub> = 300·L/T | `capacityPerCar` | Confere |
| 6.5 I = T/n | `interval` | Confere |
| Tabela 3 (3,9 / 5,5 / 6 s) | `DOORS` | Confere |
| Tabela 4 (2,4 s abaixo de 1,10 m; 2,0 s a partir de 1,10 m) | `g.width<1100?2.4:2` | Confere |
| Tabela 6 (80/60/50; 40 escritórios; 45 demais; apartamentos sem limite) | `maxInterval` | Confere |

## 1.4 Melhorias implementadas nesta entrega

1. **Servidor local** (`servidor-local/`): Node.js sem dependências externas, SQLite em modo WAL, arquivos em disco, a mesma API e o mesmo motor de cálculo do sistema original.
2. **Login próprio**: senhas com scrypt, verificação em duas etapas (aplicativo autenticador), bloqueio progressivo após 5 erros, limite por IP, sessões com expiração, registro de eventos de segurança, administração de contas pelo proprietário.
3. **Aplicativo instalável (PWA)** no celular (Android/iPhone) e no computador (Windows/macOS/Linux), com uso offline.
4. **Proteções HTTP**: CSP restritiva, HSTS, bloqueio de `iframe`, verificação de origem e de Host (contra DNS rebinding), arquivos servidos só da pasta pública.
5. **Acesso remoto** por DDNS (IP público) ou relé em nuvem com WireGuard (funciona com CGNAT), sem guardar dados fora do servidor local.
6. **Backups**: diário local + externo criptografado (HD USB e nuvem), com verificação de integridade.
7. **Acessibilidade NBR 16858-3**: classificação da cabina (tipos 1 a 5), abertura de porta, segundo corrimão e mínimo exigido por tipo de edifício/arranjo de portas, exibida junto à conferência de área da cabina.

## 1.5 Próximas melhorias recomendadas (por prioridade)

1. **Incêndio (NBR 16858-4)**: campo "pavimento designado" por grupo, tipo de dispositivo de retorno (manual/BMS/detecção) e lista de verificação da Tabela 2 no relatório.
2. **Elevador de bombeiros (NBR 16858-6)**: marcar grupo como "emergência para bombeiros" e conferir premissas do escopo (antecâmara, fonte secundária, controle de água) como pendências do projeto.
3. **Modernização (NBR 16858-7)**: módulo de auditoria de elevador existente com a lista de perigos da Tabela 1 e os níveis de prioridade da Seção 5 — útil nos estudos de *retrofit* que o sistema já trata.
4. **Manutenção (NBR 16083)**: anexo ao relatório com obrigações do proprietário (4.3.2) e itens de instrução de manutenção.
5. Fila de envio automático: guardar gravações feitas offline e enviar sozinho quando a conexão voltar (hoje o usuário salva de novo).
6. Formatação/modularização de `app.js` e testes de interface no navegador (Playwright) no CI.
