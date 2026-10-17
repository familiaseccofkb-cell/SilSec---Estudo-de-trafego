# 6. Normas inseridas no projeto

Descrição feita a partir das normas enviadas (NBR 5665, NBR 16083, NBR 16858-3, -4, -6 e -7) e das referências já citadas no código. Os textos foram **resumidos com palavras próprias**; os documentos da ABNT são protegidos por direitos autorais e os PDFs recebidos (licença individual) **não foram incluídos no repositório**. Consulte sempre a edição oficial vigente.

## 6.1 Quadro geral

| Norma | Assunto | Uso no SilSec | Situação |
|---|---|---|---|
| **ABNT NBR 5665:1983** (erratas 1986/1987) | Cálculo do tráfego nos elevadores | Motor principal: população, capacidade em 5 min, tempo de viagem, intervalo, relatório no formato do Anexo A | Implementada e conferida (cap. 1.3) |
| ISO 8100-32 | Planejamento e seleção de elevadores (tráfego) | Segundo motor independente ("ISO") com critérios próprios | Implementada no sistema original |
| ABNT NBR 16858-1:2021 | Segurança de elevadores de passageiros (novos) | Área útil × lotação da cabina (conferência de área) | Implementada (tabela `cabin-area.js`) |
| **ABNT NBR 16858-3:2022** | Acessibilidade, inclusive pessoas com deficiência | Classificação da cabina tipos 1–5, abertura de porta, corrimão, identificação de botões e tempo de porta aberta | **Classificação adicionada nesta entrega**; 5.2.2 e 5.4.2.3.2 já citados |
| **ABNT NBR 16858-4:2024** | Comportamento dos elevadores em caso de incêndio | Pavimento designado e retorno (*recall*) por grupo | Planejada (cap. 1.5) |
| **ABNT NBR 16858-6:2024** | Elevadores de emergência para uso dos bombeiros | Identificação do grupo de bombeiros e premissas do edifício | Planejada |
| **ABNT NBR 16858-7:2022** | Melhoria da segurança de elevadores existentes | Auditoria de risco nos estudos de *retrofit* | Planejada |
| **ABNT NBR 16083:2012** | Instruções de manutenção (elevadores, escadas e esteiras) | Anexo de manutenção no relatório | Planejada |
| ABNT NBR 16734-1/-2 | Escadas e esteiras rolantes (segurança; existentes) | Capacidade das escadas no cálculo populacional (5.1.6 da NBR 5665) | Referenciada no sistema |
| ISO 25745 | Desempenho energético de elevadores | Gráficos de consumo e economia | Referenciada no sistema |
| Lei 13.709/2018 (LGPD) | Proteção de dados pessoais | Servidor local, contas, backup | Ver [05-protecao-de-dados.md](05-protecao-de-dados.md) |

## 6.2 ABNT NBR 5665:1983 — Cálculo do tráfego nos elevadores

**Objetivo (1):** condições mínimas para o cálculo de tráfego de elevadores de passageiros em edifícios. Aplica-se a todos os elevadores destinados à população do edifício.

**População (5.1):**
- relações por uso: escritório de entidade única e escritórios em geral, 1 pessoa/7 m² de sala; apartamentos, 2 pessoas por dormitório social (até 6 para 4 ou mais dormitórios) + 1 por dormitório de serviço; hotéis 2 por dormitório; hospitais 2,5 por leito; restaurantes 1 por 1,5 m² de salão; escolas 1 por 2 m² de sala de aula e 1 por 7 m² de administração; garagens com rampa sem manobrista 1,4 por vaga; lojas 1 por 4 m²;
- desconto de 50 % dos pavimentos imediatamente acima/abaixo do acesso, até 5 m de distância (escolas: 30 % até 12 m);
- escritórios: computam-se todas as áreas utilizáveis como trabalho; salas corridas que ocupam o pavimento inteiro ou ≥ 200 m² podem ter redução de 15 %;
- pavimentos servidos por escadas rolantes ligadas ao acesso, com capacidade suficiente, podem deixar de ser computados;
- restaurantes de uso exclusivo, depósitos e garagens não entram na população, mas entram nas paradas prováveis e no percurso.

**Capacidade de tráfego (5.2):** porcentagem mínima da população transportada em 5 minutos, em subida: entidade única 15 %; escritórios em geral 12 %; apartamentos 10 %; hotéis 10 %; restaurantes 6 %; hospitais 8 % (com tubos de queda e monta-cargas) ou 12 %; escolas 20 %; garagens 10 %; lojas 10 %. Uso misto: cada parte com seu percentual. Elevadores em grupo devem ter as mesmas paradas, o mesmo *hall*, um único pavimento principal de acesso e a mesma destinação.

**Lotação × área útil (4.3 e Tabela 1):** de 3 a 50 passageiros, com carga (N e kgf) e área mínima, média e máxima.

**Cálculos (6):**
- tempo total de viagem: **T = T1 + T2 + 1,1·(T3 + T4)**, com T1 percurso ida e volta sem paradas, T2 aceleração/retardamento (Tabela 2, metade do tempo × paradas prováveis), T3 portas (Tabela 3: 3,9 s central, 5,5 s lateral, 6 s eixo vertical, por parada provável) e T4 entrada/saída (Tabela 4: 2,4 s por passageiro com abertura < 1,10 m; 2,0 s a partir de 1,10 m);
- Tabela 2: 2,5 s (0,63 e 0,75 m/s) a 6,0 s (acima de 2,5 m/s), com interpolação permitida;
- paradas prováveis: **N = p − (p − 1)·((p − 2)/(p − 1))<sup>c</sup>** (Tabela 5 tabulada para p até 48 e c até 47);
- capacidade de transporte por elevador: **C<sub>t</sub> = 300·L/T**; capacidade do grupo: soma;
- intervalo: **I = T/n**, máximo pela Tabela 6 (1 elevador 80 s; 2 elevadores 60 s; 3 elevadores 50 s; 4 ou mais: 40 s escritórios, 45 s demais usos; sem exigência para apartamentos);
- zoneamento: cada zona atende sozinha a todas as exigências; elevador de uma zona não atende outra, exceto no pavimento de interseção.

**Anexos:** A — formulário de cálculo (itens 1 a 19, reproduzido no relatório do SilSec); B — dois exemplos (zona baixa e zona alta de escritórios), usados como validação do motor.

## 6.3 ABNT NBR 16858-3:2022 — Acessibilidade em elevadores

Baseada na EN 81-70:2018; norma tipo C (ABNT NBR ISO 12100). Aplica-se a elevadores **novos** de passageiros e de passageiros e cargas conforme a NBR 16858-1. Substituiu a NBR NM 313 após prazo de 30 meses.

- **Contraste (5.1.2):** diferença mínima de reflectância (LRV) de 30 pontos entre botões, placa face, símbolos e superfícies vizinhas (60 recomendado em alguns itens).
- **Sinal sonoro/voz (5.1.3):** ajustável entre 35 e pelo menos 65 dB(A); até 80 dB(A) em locais ruidosos.
- **Portas (5.2.1):** corrediças horizontais automáticas; abertura livre ≥ 800 mm (tipo 1), ≥ 900 mm (tipo 2; 800 mm se a passagem tiver no máximo 400 mm de extensão ou em edifício existente), ≥ 900 mm (tipo 4), ≥ 1 100 mm (tipos 3 e 5).
- **Tempo de porta aberta (5.2.2):** ajustável de 2 s a 20 s; pelo menos 6 s recomendado para mobilidade reduzida.
- **Dimensões da cabina (5.3.1, Tabela 3):**

  | Tipo | Largura × profundidade mínimas | Uso |
  |---|---|---|
  | 1 | 900 × 1 300 mm | só edifícios existentes com restrição; cadeira sem acompanhante |
  | 2 | 1 100 × 1 400 mm | **mínimo para edifícios novos**; cadeira + acompanhante |
  | 3 | 1 200 × 2 200 mm | áreas públicas, cadeira classe C, maca |
  | 4 | 1 600 × 1 400 ou 1 400 × 1 600 mm | giro da cadeira; **mínimo quando há portas adjacentes** |
  | 5 | 2 000 × 1 400 ou 1 400 × 2 000 mm | giro da cadeira e vários passageiros |

  Medidas entre paredes estruturais a 1 m do piso; acabamentos podem reduzir até 15 mm por parede.
- **Corrimão (5.3.2.1):** seção de 30–45 mm, altura 900 ± 25 mm, afastamento de 40 mm da parede; segundo corrimão quando largura e profundidade forem ≥ 1 400 mm.
- **Dispositivos de controle (5.4):** requisitos para controle coletivo e controle de destino (antecipado), botões extragrandes (Anexo B) e telas sensíveis ao toque (Anexo C); identificação dos pavimentos preferencialmente −2, −1, 0, 1, 2…
- **No SilSec:** `public/accessibility.js` classifica a cabina existente/projetada, indica o mínimo exigido (tipo 2 em obra nova, tipo 4 com portas adjacentes, tipo 1 aceito em edifício existente), a condição da porta de 800 mm e o segundo corrimão. Os demais itens (contraste, botões, sinais) dependem do produto e ficam como verificação do fornecedor.

## 6.4 ABNT NBR 16858-4:2024 — Comportamento em caso de incêndio

Baseada na EN 81-73:2020. Define o retorno automático (*recall*) do elevador a um **pavimento designado** e sua retirada de serviço, a partir de sinal de dispositivos de retorno. Não se aplica a elevadores que permanecem em uso no incêndio (bombeiros, NBR 16858-6) nem a elevadores de evacuação. Prazo de 18 meses para exigência.

- **Dispositivos de retorno (5.1.3):** manual (chave/interruptor biestável, protegido e identificado com o símbolo ISO 7010 P020 "não utilizar o elevador em caso de incêndio", ≥ 50 mm) ou automático (BMS, sistema de detecção de incêndio).
- **Sinal e interface (5.1.2, 5.2):** um sinal por pavimento designado; vale o primeiro sinal recebido; **interrupção da conexão deve ativar o retorno** (falha segura).
- **Comportamento (5.3):** cancela chamadas; mantém operantes abrir porta e alarme; elevador parado fecha portas e segue sem paradas; o que vai em sentido contrário para no pavimento mais próximo sem abrir e retorna; não neutraliza dispositivos de segurança, inspeção, operação de emergência nem modo sísmico; falha de um elevador do grupo não impede o retorno dos outros.
- **Chegada (5.3.5/5.3.6):** abre portas com aviso sonoro (35–65 dB(A), inicial 55) e visual/voz (obrigatórios em elevadores acessíveis); depois fecha em até 20 s e sai de serviço, ou fica aberto quando há antecâmara e a regulamentação local permite.
- **Placa (5.1.6):** símbolo P020 em todos os pavimentos, próximo ao elevador.
- **Aplicação no SilSec (planejada):** registrar por grupo o pavimento designado e o tipo de dispositivo; incluir no relatório que o pavimento designado deve ser servido por todos os elevadores do grupo.

## 6.5 ABNT NBR 16858-6:2024 — Elevadores de emergência para uso dos bombeiros

Baseada na EN 81-72:2020. Requisitos adicionais à NBR 16858-1 para elevadores usados no combate a incêndio, resgate e evacuação **sob controle dos bombeiros**. Prazo de 24 meses para exigência.

- **Condições de aplicação (1):** ambiente do elevador protegido contra fogo, calor e fumaça; controle de entrada de água na caixa; elevador não é rota de fuga; caixa e cabos de alimentação com a mesma resistência ao fogo; fonte de energia segura; plano de manutenção.
- **Não define:** quantidade de elevadores de bombeiros, pavimentos atendidos, tamanho das antecâmaras (decisão do projeto e do Corpo de Bombeiros).
- **Conteúdo principal:** requisitos do edifício (5.1); elevador (5.2); proteção elétrica contra água (5.3, Anexo D, código IP); resgate de bombeiros presos — alçapão, escadas, resgate externo e autorresgate (5.4, Anexo H); portas, máquina, **operação de emergência em fases** com interruptor no pavimento de acesso e chave na cabina (5.8); **fonte secundária de energia** com capacidade e autonomia (5.9, Anexo C); controles e comunicação (5.11, 5.12); sinalização (Anexo G); interface com o edifício (Anexo I).
- **Aplicação no SilSec (planejada):** marcar o grupo como "emergência para bombeiros", excluí-lo da capacidade de tráfego normal quando for dedicado e listar as premissas do edifício como pendências do projeto.

## 6.6 ABNT NBR 16858-7:2022 — Melhoria da segurança de elevadores existentes

Baseada na EN 81-80:2019; substitui a NBR 15597:2010. Metodologia para elevar elevadores **existentes** (tração ou hidráulicos, guias até 15°, velocidade > 0,15 m/s) a um nível de segurança próximo ao de um elevador novo (NBR 16858-1 e -2).

- **Lista de perigos (Tabela 1, 11 grupos):** 1 disposições gerais (acessibilidade, vandalismo, bombeiros, incêndio, sismo, materiais prejudiciais); 2 caixa e poço (travamento de portas de inspeção, espaços de refúgio, iluminação, *stop* no poço, folgas de soleira); 3 espaços de máquinas e casa de polias; 4 **portas de pavimento e de cabina** (cortina de luz, força de 150 N, travamento, vidros, chave triângulo, resistência ao fogo, portas pantográficas); 5 **cabina, contrapeso e balanceamento** (área × carga × lotação, avental, iluminação de emergência, controle de carga, alarme); 6 suspensão, queda livre, sobrevelocidade, movimento não intencional com portas abertas; 7 guias, para-choques e limitadores de percurso; 8 máquina e sistema hidráulico (freio sem redundância, operação de emergência); 9 instalações elétricas; 10 proteções elétricas, nivelamento e botoeiras de inspeção; 11 avisos e instruções.
- **Não trata (4.2):** incêndio na caixa, inundação, compatibilidade eletromagnética, arestas vivas, contaminação biológica.
- **Método (5):** identificar as situações perigosas com a lista do Anexo A; avaliar o risco por **severidade (1 alta a 4 desprezível) × probabilidade (A altamente provável a F altamente improvável)**, conforme a ISO 14798 (perfil da Tabela 2); reavaliar considerando o que normas anteriores já exigiam; classificar em prioridade **Extrema (imediato), Alta (curto prazo), Média (médio prazo ou junto com modernização ampla) ou Baixa (longo prazo ou junto com a modernização do componente)** — Tabelas 3 e 4; prazos dependem de regulamentação local. Após modificações, inspeções e ensaios conforme NBR 16858-1/-2 abrangendo também os componentes afetados (6). Anexo B: visor na porta e indicador "carro aqui".
- **Aplicação no SilSec (planejada):** nos estudos de *retrofit/substituição*, um módulo de auditoria com a lista do Anexo A, nível de prioridade e inclusão no relatório; a conferência de área × lotação (item 5.1 da Tabela 1) já existe.

## 6.7 ABNT NBR 16083:2012 — Instruções de manutenção

Baseada na EN 13015:2001+A1:2008. Define o conteúdo das **instruções de manutenção** que o instalador entrega ao proprietário de **instalações novas** de elevadores, monta-cargas, escadas e esteiras rolantes (não trata de instalação/desmontagem, inspeções legais nem instalações existentes, mas serve de referência para elas). O material recebido é uma compilação de capturas com cortes (ex.: item 4.3.3.16); confirmar trechos no exemplar original.

- **Definições (3):** manutenção, empresa de manutenção, profissional competente, fabricante, instalador, proprietário, operações de resgate, monitoramento remoto.
- **Manutenção inclui (4.1):** lubrificação e limpeza, verificações de funcionamento, resgate de passageiros, ajustes e reparos/substituição por desgaste; **não inclui** modernização, substituição total, resgate pelos bombeiros, remoção de água do poço etc.
- **Obrigações do proprietário (4.3.2):** manter a instalação segura; contratar empresa de manutenção antes de colocar em serviço; mesma empresa para instalações com caixa/casa de máquinas comum; interfone ligado 24 h ao serviço de resgate; avisar falhas; retirar de operação em situação anormal.
- **Empresa de manutenção (4.3.3), avaliação de riscos (5), resgate de pessoas presas (6), sinais e avisos (7), formato do manual (8)**; Anexo A com verificações típicas por tipo de equipamento e Anexo B com elementos de avaliação de risco.
- **Aplicação no SilSec (planejada):** anexo do relatório com as obrigações do proprietário e a periodicidade de manutenção declarada pelo fornecedor na proposta.

## 6.8 Normas citadas no código e não enviadas

- **ISO 8100-32:** planejamento de tráfego por simulação/critérios de desempenho (intervalo, tempo de espera, capacidade de manuseio). O SilSec tem motor separado; os critérios devem ser conferidos na norma oficial.
- **ABNT NBR 16858-1:2021:** requisitos de segurança de elevadores novos, incluindo a relação carga × área útil × passageiros utilizada na conferência de área da cabina.
- **ABNT NBR 16734-1 e -2:** segurança de escadas/esteiras rolantes novas e existentes; o sistema usa capacidade informada pelo fabricante.
- **ISO 25745:** medição e classificação energética de elevadores (consumo em viagem e em espera).
