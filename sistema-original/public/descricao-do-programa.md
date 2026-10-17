# Descrição do programa para revisar e solicitar alterações

Versão 9.1.0 — estudo privado de tráfego em elevadores, com dois modelos independentes.

Quero um programa pela internet para cadastrar clientes e projetos, calcular a população de uma edificação, estudar o tráfego de elevadores, comparar cenários e produzir relatórios personalizados. A interface deve ser simples para quem não programa. A assinatura deve permanecer demonstrativa, sem cobrança real. Não publicar nem ampliar o público sem minha aprovação.

## Atualização 9.1 — texto para solicitar e avaliar esta versão

Quero atualizar o programa de estudo de tráfego mantendo a hospedagem privada e os dados existentes. Retirar o campo de seleção Critério de precisão, preservando a precisão integral de interpolação. A Aplicação do edifício deve ser definida por grupo de elevadores, tanto no Básico quanto no Avançado; os percentuais de demanda e critérios de intervalo devem corresponder à aplicação de cada grupo. Alterar a aplicação não deve apagar a composição populacional: o usuário deve conferir os tipos de ambientes e sua participação.

No Avançado, o número de Paradas (incluindo acesso) deve ser somente leitura, preenchido pelos pavimentos selecionados na matriz e no atendimento de cada unidade. O Básico mantém o campo manual de seu formulário, pois não possui a matriz detalhada do Avançado.

Cada elevador deve possuir seus próprios dados de portas, fabricante e movimento. Exibir Tempo de Abertura de porta (s), Tempo de Fechamento de porta (s), Tempo de entrada e saída de passageiros — Transferência (s/parada), Tempo adicional de partida (s), aceleração, jerk, pré-abertura e limite PPH. Os tempos devem variar de 0,01 em 0,01 s e aceitar digitação; aceleração e jerk mantêm 0,05. A soma abertura + fechamento superior à referência da porta deve destacar os dois campos em vermelho e informar o risco de redução de performance.

Criar um botão Copiar unidade e outro Copiar tempos e movimento. Cada botão abre os elevadores do mesmo grupo com flags de seleção; a unidade de origem fica desabilitada. A primeira opção copia características, tempos, referência dimensional e atendimento; a segunda copia somente tempos, movimento, base de transferência e PPH. Identificações dos destinos são preservadas. A cópia invalida resultados e exige recálculo.

Disponibilizar Preencher automaticamente por unidade, considerando velocidade e configuração da porta. Identificar os valores gerados como sugestões editáveis de projeto, informar a fórmula e solicitar sua conferência com o fabricante. Na NBR, dividir a referência de portas igualmente, sugerir transferência por parada pela capacidade e pelas paradas prováveis, aceleração min(1; max(0,30; 0,80 × velocidade)), jerk 1,20 até 2,50 m/s ou 1,60 acima e partida adicional zero. No modelo ISO, consultar as tabelas do documento disponível sem interpolar nós ausentes como se fossem normativos.

Preservar a separação entre transferência de passageiros e partida: a transferência FAB por parada compõe T4 como paradas prováveis × segundos por parada, enquanto a partida adicional soma uma vez por ciclo FAB. O cálculo NBR permanece com sua própria base por pessoa. No ISO personalizado, a transferência é (S+1) × segundos por parada e a partida adicional corresponde a tsd por parada. A opção ISO tabelada conserva sua formulação original. Dados legados por pessoa permanecem armazenados, com conversão equivalente visível até o usuário editar o campo. Não basta trocar o rótulo de um campo antigo mantendo escondida a multiplicação por pessoas.

Conferir a área interna da cabina existente: frente em mm/1.000 × lado em mm/1.000. Comparar, por elevador e capacidade, com a tabela enviada, considerando mínimo e máximo inclusivos. Destacar em vermelho valores inferiores ou superiores. Não interpolar capacidades ausentes. Informar no relatório e na apresentação a origem e a condição da conferência.

**Ponto pendente de correção da tabela:** foram fornecidas duas linhas para 44 passageiros, uma de 0,05866667 a 0,176 m² e outra de 5,89 a 6,28 m². Manter ambas registradas e indicar referência pendente, sem presumir qual linha está correta. Esta tabela é referência do usuário e não deve ser apresentada como certificação normativa.

Os relatórios, gráficos, partidas por hora e estimativas de consumo devem utilizar os dados individuais adotados e registrar as premissas. Manter os cálculos NBR e ISO independentes. Recalcular a população e o estudo completo antes de emitir novos documentos. Atualizar este texto e o manual a cada solicitação de alteração.

## Atualização 9.0: módulos Básico e Avançado, acesso e preservação de relatórios

Manter o sistema atual como Avançado e criar um Básico independente, com estrutura do Anexo A da NBR 5665 na tela, de uma a vinte colunas por grupo. No Básico, informar nome, cliente, edificação, responsáveis, população adotada por grupo e sua definição, quantidade, capacidade, paradas, percurso, velocidade, tipo de porta e abertura livre. Utilizar exclusivamente o núcleo NBR com precisão integral de interpolação. Não exigir dados de fabricante, energia, medições, escadas ou ISO nesse módulo. Calcular cada grupo separadamente, mostrando demanda, paradas prováveis, tempos, ciclo, intervalo, capacidade, mínimo estimado e conclusão. Paginar o relatório em até três colunas por tabela. Preservar no Avançado todos os recursos existentes e seus modelos NBR e ISO independentes.

Configurar Básico a R$15/mês e Avançado a R$25/mês; os anuais devem custar R$162 e R$270, respectivamente, com 10% de desconto. O Avançado inclui o Básico. Nesta etapa, manter solicitações e ativações demonstrativas, com revisão administrativa, sem checkout ou cobrança. Exigir CPF matematicamente válido na aquisição e impedir o mesmo CPF em contas diferentes, sem afirmar que isso comprova a identidade. Não armazenar o CPF completo em texto.

Permitir ao administrador conceder módulo por usuário, com prazo ou permanentemente, revogar concessão e gerar chave temporária individual, vinculada ao destinatário e utilizável uma vez. Papéis de equipe e autorização aos estudos continuam independentes da licença. Fornecedores e clientes convidados usam a licença ativa do responsável pelo projeto, preservando o isolamento entre fornecedores e sem precisar comprar licença somente para colaborar no projeto autorizado.

Na primeira aquisição do Básico, conceder 30 dias no Avançado, uma única vez por cadastro vinculado ao CPF. Mostrar o prazo em toda abertura do Avançado e oferecer continuidade nos últimos sete dias e depois do vencimento. Bloquear alterações, exportação editável, novas apresentações e compartilhamentos quando o acesso vencer. Preservar o último relatório formatado e calculado para abrir, imprimir/PDF e baixar, sem recalcular nem reformatar. Alterações posteriores em rascunho não substituem esse arquivo. Arquivar relatórios com revisão e auditoria após cálculo completo. Projetos antigos devem passar por um cálculo e salvamento com acesso ativo para criar seu primeiro arquivo formatado.

Criar acesso educacional com documento de matrícula em faculdade, data de emissão e análise do administrador. Liberar ambos os módulos por seis meses após aprovação. Renovar por mais seis meses somente com documento diferente e mais recente; contar do vencimento vigente, ou da aprovação se o acesso já venceu. Manter comprovantes restritos ao titular e ao administrador.

Revisar validações por condição: dados de medição só bloqueiam no perfil real e nos blocos ativos; parâmetros de perfis antigos só são exigidos quando usados; energia desativada não exige dados; partidas diárias manuais só são exigidas na base manual; escadas desativadas não impedem cálculo por parâmetros preservados. Na base de energia por PPH, não substituir silenciosamente demanda indisponível por partidas manuais. Mostrar a ausência de cálculo de energia e como corrigir, preservando resultados de tráfego válidos.

Testar cálculos, troca de módulo, campos pendentes, salvamento, CPF duplicado, chave expirada/reutilizada, concessões, 30 dias de experiência, renovação educacional e bloqueios por API. Preservar projetos e audiência privada. Atualizar manual, explicação e este texto a cada alteração.

### Melhorias recomendadas para a oferta comercial

- Integrar pagamento real somente em etapa autorizada, com confirmações assinadas do provedor, idempotência, renovação, cancelamento e conciliação.
- Acrescentar verificação de titularidade no processo de aquisição; CPF válido e único não elimina fraude de identidade.
- Criar revisão técnica de casos normativos de referência e ampliar a base de exemplos calculados com documentação de origem.
- Evoluir o painel administrativo com lembretes de vencimento e fila de renovação, mantendo revisão humana dos comprovantes.
- Manter testes visuais em navegador para tabelas com vinte grupos, telas pequenas e impressão; essa revisão visual não foi executada neste ambiente.

## Atualização 8.5.1: flags de escadas livres e preenchimento do caminho

Permitir editar os flags de escadas de todos os pavimentos cadastrados, inclusive o pavimento de acesso principal. Após confirmar a utilização de escadas, ao marcar um destino selecionar automaticamente todos os pavimentos entre o acesso e esse destino, incluindo ambos. Exemplo: acesso 0 e destino 3 selecionam 0, 1, 2 e 3. Usar a ordem física da tabela, inclusive abaixo do acesso e com marcações por letras ou subsolos; preservar nomenclatura e o outro ramo já configurado.

Permitir remover manualmente qualquer seleção depois. Desmarcar um flag não deve desmarcar nem remarcar automaticamente os demais. Alertar em vermelho quando existir lacuna. Ao desmarcar o acesso principal, não considerar a ligação contínua para abater população dos elevadores. Ao marcar novamente um destino, preencher o caminho até ele. Atualizar os trechos e as solicitações populacionais dos pavimentos envolvidos, preservando equipamentos e exigindo reconfirmação operacional e recálculo completo para emitir relatórios.

Preservar a interpretação dos projetos antigos cujo flag de acesso era bloqueado. Não reescrever históricos compartilhados nem ampliar acesso. A edição continua restrita aos usuários autorizados. Atualizar manual, explicação e testes de seleção acima/abaixo, remoção de acesso, continuidade e recálculo.

## Atualização 8.5: equipamentos nos parâmetros, dados por elevador e navegação das pendências

Em Parâmetros de cálculo, perguntar uma única vez se o edifício terá escadas e/ou esteiras rolantes, com opções Confirmar utilização, Sim e Não. Após Sim e a seleção dos pavimentos disponibilizar a aba conjunta Escadas e esteiras rolantes, junto às abas dos elevadores e de dimensões. Remover a configuração de escadas do Cálculo populacional. Desativar conserva o cadastro, mas retira sua análise ativa; reconhecer redes antigas já ativas sem perder seus dados.

Acrescentar Servido por escada rolante à tabela Pavimentos e atendimento por grupo. Usar a seleção e o acesso físico para gerar os trechos e derivar as quantidades acima/abaixo. Sinalizar em vermelho uma lacuna entre o principal e o último andar selecionado. Preservar capacidades e equipamentos vinculados à mesma ligação; pedir reconfirmação após mudanças. A população somente deixa de ser computada pelas condições de caminho e capacidade já definidas na atualização 8.4.

Em Dados dos Elevadores do estudo, abrir a tabela do grupo escolhido com uma coluna por elevador, conforme sua quantidade. Informar individualmente capacidade, velocidade, abertura livre da porta em mm, tipo de porta e pavimentos atendidos por flags. Derivar paradas e percurso de cada equipamento; manter os demais tempos e dimensões como dados comuns do grupo. Valores individuais prevalecem sobre referências comuns. Alimentar efetivamente os cálculos NBR/ISO, PPH, energia, gráficos, relatórios e apresentação. Identificar equipamentos ou conjuntos idênticos nas saídas. Preservar a análise por zonas e exigir distribuição específica quando destinos sobrepostos não tiverem demanda definida.

O flag de atendimento do grupo na matriz aplica a escolha a todos os seus elevadores; flags individuais permitem diferenças. Preservar o vínculo com o andar físico ao alterar marcações. Arquivar os dados de equipamentos retirados ao reduzir a quantidade. A tabela de pavimentos é necessária quando houver cadastro individual.

No fim de cada tela, mostrar somente suas pendências; no cálculo, reunir todas. Cada item deve ser um link que abre a tela, aba, grupo ou composição correta, expande os detalhes necessários, rola diretamente até o campo e dá foco. Campos continuam em laranja enquanto faltarem dados.

Escadas e esteiras usam uma relação comum de cálculo de tráfego, com capacidade, janela, demanda e utilização. Identificar o tipo por conjunto. Para esteiras locais/horizontais, preservar identificação/local, comprimento, velocidade, largura, quantidade, capacidade unitária e população opcional; documento antigo é conservado sem ser obrigatório. Incluir os dados no relatório e PowerPoint. Não deduzir automaticamente sua população do estudo de elevadores nem atribuir uma nova regra a norma sem validação.

Testar os controles condicionais, preservação ao desligar, lacunas de escadas acima/abaixo, edição por coluna, paradas e acesso de cada elevador, resultados e exportações, links de pendências, importação e acesso somente leitura. Invalidar resultados ao editar e exigir recálculo completo. Atualizar manual e explicação, manter URL privada e cobrança desativada.

## Atualização 8.4: população registrada, cópia seletiva e escadas com atendimento parcial

Calcular e mostrar a população de todos os ambientes, mesmo quando não participa do tráfego. Separar calculada antes das exclusões, declaração, total registrado por ambiente (maior valor), parcela não computada e destinada aos elevadores. Mostrar o motivo da exclusão na tela, relatório e apresentação. Descontos percentuais continuam identificados; exclusão por uso, acesso ou participação não apaga a calculada.

O nome da composição deve ser automático: “Andar ” mais a marcação do andar servido; usar Andar 01 a Andar 09, Andar 00, Andar -01 e preservar letras como Andar S1. Esse formato é apenas de exibição: não alterar a marcação física, a posição nem a indicação livre do ambiente. Ao mudar o andar servido, atualizar o nome em todas as saídas.

Em Copiar composição, oferecer flags dos dados a copiar: componente/destinação/participação; área/quantidade/repetições; população declarada; indicação/observações; parâmetros e grupos do estudo separado; descontos/exclusões; solicitação de atendimento por escadas. Os cinco primeiros vêm marcados. Descontos e solicitação de escadas são opcionais. Campos não escolhidos recebem valores iniciais e exigem conferência. Nunca copiar principal/acesso, identidade, confirmações locais ou configuração da rede de escadas. Aplicar a seleção tanto a destinos por flags quanto aos modos sequenciais e mesmo andar. Preservar ambientes preenchidos no destino.

Substituir Desconto por atendimento de escadas rolantes por População não computada no estudo quando atendida por escadas rolantes. Se as escadas atenderem toda a população solicitada, a parcela não entra nos elevadores. Se atenderem parte, computar a diferença em pessoas. Exemplo: 160 registradas e 100 atendidas deixam 60. Sem continuidade ao principal, confirmação operacional ou configuração válida, manter toda a população dependente nos elevadores.

Atendimento parcial é premissa do responsável, sem atribuir uma regra proporcional à NBR 5665, 5.1.6, ou ao documento ISO, 4.3.3.4. Capacidade equivalente = menor capacidade de subida/descida na janela dividida pela fração de demanda. Aplicar janela e utilização declaradas. Distribuir proporcionalmente entre os andares dependentes, respeitando a capacidade de cada trecho compartilhado e realocando capacidade liberada por gargalo local. Reservar a capacidade dos demais ambientes da mesma rede; somente solicitações ativas recebem abatimento. Arredondar o saldo final de cada estudo para cima. Exibir as premissas, parcelas e motivos em todas as saídas.

Recalcular população automaticamente quando houver dados válidos; retirar resultados anteriores e exigir cálculo completo para tráfego e emissão. Preservar projetos e links históricos. Testar exclusões, declarações, cópia seletiva, nomes, compartilhamento de capacidade, rupturas, arredondamento, relatório e PowerPoint. Manter hospedagem privada e sem cobrança real.

## Atualização 8.3: acesso principal sem renumerar os andares

Separar a identificação física do pavimento de acesso da marcação exibida do andar. Selecionar Acesso / Andar principal não deve modificar a marcação do próprio andar, nem a dos superiores ou inferiores. Permitir somente um principal. Exemplo: −2, −1, 0, 1 permanece igual ao escolher −1 como principal.

Vincular ao acesso físico selecionado a exclusão populacional no acesso, os níveis acima/abaixo, os descontos e suas distâncias, os caminhos das escadas, as zonas de atendimento e a origem do cenário de antecipador. O andar com a etiqueta 0 deve participar normalmente quando não for o acesso. Preservar distâncias, equipamentos e associação dos ambientes aos andares; pedir recálculo e revisão das confirmações após a troca. Não remover um principal selecionado ao reduzir a tabela sem escolher outro antes.

Avisar sobre a verificação de acessibilidade citando ABNT NBR 16858-3:2022, item 5.4.2.3.2 a): símbolos dos botões devem ser coerentes com a nomenclatura dos pavimentos; a sequência −2, −1, 0, 1, 2 etc. é preferencial. Não afirmar que o acesso no subsolo ou com marca diferente de 0 comprova, isoladamente, descumprimento. Alertar para conferir botões, indicações e nomenclatura, sem bloquear o cálculo ou renumerar automaticamente. Levar o aviso e o principal para o relatório e a apresentação.

Migrar cadastros anteriores mantendo o acesso no andar anteriormente identificado como 0. Preservar projetos e compartilhamentos históricos. Atualizar manual e descrição, validar os cálculos e manter o acesso privado.

## Atualização 8.2: população, cópias e controle de destino

Em edifícios comerciais de escritórios, permitir o desconto de 50% nos pavimentos imediatamente acima e imediatamente abaixo do acesso, até 5 m, limitado a dois pavimentos distintos. Ambientes do mesmo pavimento compartilham a condição. Recusar outros pavimentos; nos demais usos permanece o limite anterior de um andar.

Copiar composição deve permitir marcar, por flags, um ou vários pavimentos cadastrados ou Novo pavimento. A origem fica visível e desabilitada. Criar ambientes independentes preservando ambientes preenchidos nos destinos; substituir somente espaços vazios gerados automaticamente. Descontos, escadas e confirmações específicas precisam de nova conferência. Em novo pavimento, pedir distância e revisão do atendimento por grupo. Manter as alternativas sequenciais e mesmo andar como modos opcionais.

A frase “Os conjuntos atendem as mesmas paradas, hall, acesso principal e uso.” deve ser somente aviso, sem flag obrigatória para calcular. Manter a separação automática por zonas na matriz física.

Substituir Aplicar em todos por Copiar distância, abrindo flags dos pavimentos. Inibir origem e base inferior, preservar destinos não marcados e oferecer seleção de todos os destinos como opção dentro da caixa. Invalidar resultados após confirmar.

Na proposta do fornecedor, incluir Antecipador de destino por grupo. Ocupação média inicial de 80%, editável entre 1% e 100% em passos de 1% ou por digitação. Utilizar P = lotação nominal × ocupação/100 na capacidade, PPH e cenário energético da proposta. Preservar a referência convencional NBR/ISO de forma independente.

Oferecer método genérico de agrupamento por destinos com Monte Carlo e método de RTT/paradas/distância documentados pelo fabricante. Identificar sistema genérico, Schindler PORT, KONE Destination, Otis Compass 360, TK Elevator AGILE ou outro. Não inventar algoritmos ou multiplicadores específicos de marca. O documentado exige referência e confirmação das mesmas condições do estudo.

Calcular tempos por deslocamento, considerando velocidade, aceleração, jerk, portas, transferência e demais parâmetros declarados. Usar as probabilidades de destino da população adotada por andar, ou premissa uniforme explicitada. Registrar semente, lotes efetivos e erro amostral. Comparar graficamente com o convencional à mesma ocupação. Apresentar método, ocupação, paradas, RTT, capacidade, intervalo e PPH no sistema, relatório e PowerPoint editável.

Identificar a estimativa como pico de entrada por lotes: não é simulação normativa de despacho, não calcula filas/espera e não comprova ganhos em almoço e saída. Solicitar validação por simulação documentada do fabricante antes da decisão de contratação. Preservar a população, geometria, arquivos e acessos existentes; atualizar manual e descrição e manter hospedagem privada.

## Atualização 8.1: condição de fornecimento e cópia entre grupos

Usar “Obra nova, retrofit ou Substituição total” no campo de condição de fornecimento e “Substituição total” na opção anteriormente denominada instalação existente. Preservar os cadastros existentes e seus levantamentos dimensionais.

Em Dados dos Elevadores do estudo, disponibilizar Copiar dados do grupo. O usuário escolhe a origem e marca por flags um ou vários grupos de destino. Exibir todos os grupos, mantendo a origem desabilitada como destino. Ao mudar a origem, retirar sua seleção dos destinos. Permitir também criar um novo grupo dentro do limite de 20.

Antes de confirmar, explicar que os dados dos equipamentos, tempos, dimensões e atendimento por pavimento substituirão os destinos selecionados. Preservar nomes e identificações dos destinos e o conteúdo da origem. Não alterar grupos não selecionados. Após a cópia, invalidar resultados, relatórios e apresentações até o recálculo completo. Atualizar manual e descrição, mantendo o acesso privado.

## Atualização 8: cadastro sem valores presumidos e pendências

Substituir “Firma instaladora” por “Empresa responsável”, preservando os dados já armazenados. Usar “Dados dos Elevadores do estudo”. Permitir definir previamente de 1 a 20 grupos em Pavimentos e atendimento por grupo. Novos grupos devem apresentar campos vazios, com pendências em laranja. Preservar dados dos grupos existentes; manter registro dos grupos retirados ao reduzir a quantidade.

Disponibilizar Novo estudo com campos vazios. Não preencher capacidade, velocidade, quantidade ou tempos de um novo equipamento com valores do exemplo. Explicar em O que falta para calcular? as entradas faltantes por grupo e por etapa. Paradas prováveis dependem de lotação e paradas; ISO também de FC. A conferência parcial dessas paradas não deve aparentar um cálculo completo. Relatórios e apresentação exigem o cálculo completo atualizado. Salvar/reabrir rascunhos incompletos sem perder dados.

O resumo Tempos do fabricante e premissas de movimento deve acompanhar automaticamente os dados preenchidos no grupo ou selecionados do catálogo, identificando a origem. Não inventar tempos do fabricante a partir de velocidade/capacidade quando não houver configuração documentada. A alternativa ISO mantém a origem das tabelas/premissas do seu documento próprio.

## Pavimentos, andar principal e composições automáticas

Usar “Letras são preservadas; números acima são sequenciados.” Limitar marcações de andar a dois caracteres, incluindo o sinal. Preservar as linhas inferiores ao renumerar e manter letras sem consumir o contador numérico. Esse limite é do programa, sem afirmar que toda marcação com letras é proibida pela acessibilidade.

Inserir Acesso / Andar principal entre Posição física e Marcação do andar. Permitir somente um flag ativo. Ao escolher outro, desmarcar os demais e preservar exatamente as marcações de todos os andares. O principal pode estar num subsolo, inclusive −1 ou S1. Preservar a associação física dos ambientes e das ligações de escadas. Pedir preenchimento para ambientes que deixam de ser o acesso e passam a participar da população.

Em Distância desde o inferior, oferecer Copiar distância: abrir uma caixa de flags, com a origem e a base desabilitadas. Copiar somente para os destinos selecionados, com opção de selecionar todos os destinos. A tabela continua com colunas de atendimento por grupo; deriva paradas/percurso e impede remover um acesso ou ambiente preenchido sem realocação.

Ao iniciar o novo fluxo ou editar sua estrutura, gerar automaticamente uma composição por andar. Organizar as composições em abas de andar e deixar as entradas para o usuário. Não presumir uma área para pavimentos desconhecidos. Manter todas as composições existentes e seus dados.

Usar “Salas ou pavimento de escritórios ou consultórios”. Para componente fora do escopo convencional, exigir decisão explícita: incluir no estudo principal, criar estudo separado ou apenas registrar sem somar. Identificar inclusão em uso composto como premissa do gestor e conservar sua memória, evitando dupla contagem. Os critérios próprios dos usos e os descontos continuam identificados.

## Condição de fornecimento e parâmetros dimensionais

O gestor/administrador escolhe Obra nova, Retrofit / modernização ou Substituição total. Criar uma aba Parâmetros dimensionais, com medidas em milímetros. No retrofit/substituição total, exigir por grupo o levantamento do gestor: frente/lado de caixa, última altura, poço, frente/lado/altura interna de cabina, largura/altura/tipo de porta e quantidade de portas da cabina.

O fornecedor registra frente/lado/altura de cabina, largura/altura/tipo/quantidade de portas e disposição dos acessos. Informar faixas mínima e máxima de frente/lado de caixa, última altura e poço para instalação, especialmente em obra nova. Vincular a configuração a fabricante, modelo, documento, velocidade e capacidade.

No retrofit/substituição total, avisar para conferir em loco. Exigir levantamento independente do fornecedor, com as medidas de campo, data, responsável e confirmação. Informar o tipo de porta existente e a decisão de manter ou substituir. Mostrar diferenças em relação aos dados do gestor e incompatibilidades com as faixas declaradas. Registrar esses dados no relatório e na apresentação.

Tratar as influências entre velocidade, portas, cabina, poço e última altura por configurações documentadas do fornecedor. Não deduzir folgas ou mínimos normativos universais somente por velocidade ou dimensão de cabina. As verificações implementadas são de consistência e comparação com faixas declaradas, sem certificação automática.

## Banco e catálogo dimensional

Salvar configurações dimensionais de propostas completas no banco do catálogo, com empresa, modelo, revisão, autor e data. Administradores/diretoria podem consultar globalmente. Gestores consultam fornecedores autorizados em seus projetos. Fornecedores acessam seu próprio catálogo e não os concorrentes.

A tabela possui filtros por empresa, modelo, velocidade, lotação, tipo/abertura/altura de porta, frente/lado/altura de cabina e quantidade de portas. Mostrar faixas de caixa, poço e última altura. Distinguir variantes dimensionais do mesmo modelo/velocidade/capacidade.

Ao usar uma configuração, preencher produto e tempos preservando quantidade de elevadores, percurso, destinos e levantamento do gestor. Identificar a origem. A proposta pode receber o último cadastro por modelo, velocidade, lotação e porta, com indicação da variante para conferência. Nunca reaproveitar confirmação ou medições em loco de outro projeto.

Diferenças em configuração existente exigem confirmação de sobrescrita, mostrando o email do autor anterior. Conflitos simultâneos não podem apagar dados silenciosamente. Guardar dados de projetos e compartilhamentos anteriores sem reescrevê-los.

## Escadas em linhas, colunas e quantidades por sentido

Numerar os trechos acima e abaixo do andar principal automaticamente e usar as marcações da tabela de pavimentos. Pavimentos acima/abaixo não podem superar a quantidade cadastrada em cada ramo. Alterações devem remodelar trechos preservando os parâmetros vinculados à mesma ligação física. Manter fora do cálculo os trechos retirados, arquivando-os no estudo.

Em cada trecho, apresentar parâmetros em linhas e os sentidos Subida/Descida em colunas. Informar quantidade de escadas similares por sentido, degrau de 600/800/1.000 mm, velocidade, capacidade unitária quando fornecida e confirmação técnica. Permitir conjuntos adicionais com parâmetros diferentes e um botão de cópia dentro do trecho.

Oferecer inclinações 0°, 10°, 12°, 30° e 35°, além de digitação manual. Zero identifica ligação horizontal; não justifica transporte com desnível positivo. A seleção não representa certificação de segurança da configuração.

Capacidade por sentido é a soma da capacidade unitária multiplicada pela quantidade em serviço, convertida para a janela e utilização declaradas. Não somar subida e descida como uma única capacidade. Verificar o par de mesma largura e o atendimento da população acumulada em todos os trechos dependentes.

Se não houver sequenciamento até o andar principal, sinalizar o trecho em vermelho. Manter a população dependente no cálculo dos elevadores quando houver interrupção, gargalo ou confirmação faltante. Relatório e PowerPoint devem mostrar trechos, conjuntos, quantidades, degraus, velocidades, inclinações, capacidades, documentos e condições de atendimento.

## Estudo-base e propostas de fornecedores

O administrador ou responsável fornece e calcula o estudo-base. Cada fornecedor convidado registra os equipamentos de sua própria proposta, sem consultar os concorrentes e sem alterar população, destinos ou percurso do estudo-base. O contratante autorizado recebe visão completa das propostas desse projeto. O gestor pode preencher em nome de um fornecedor cadastrado, registrando sua própria autoria.

Cadastre acesso por projeto com empresa, nome, email e validade. Não enviar convites por email automaticamente nem ampliar a hospedagem. O proprietário continua sendo o único autorizado na hospedagem nesta fase.

## Cargos e autorizações

Usar Administrador, Diretor, Gerente, Analista de estudos, Cliente/contratante e Fornecedor. Analistas acessam seus estudos e delegações vigentes. Gerentes acessam a equipe definida pelo administrador. Diretores acessam todos os estudos e clientes. Somente administradores gerenciam cargos, desativação e aprovação de exportação. Clientes e fornecedores recebem acesso somente aos projetos concedidos. Exportação de dados JSON e comparações CSV exige aprovação do administrador para o funcionário.

## Equipamentos e catálogo por fornecedor

Cadastrar proposta por grupo com quantidade, capacidade, velocidade, portas, aceleração, jerk, partida, PPH limite, pré-abertura, tecnologia, suspensão, diâmetros, relações de suspensão/redutor, modelo, documentos, potência nominal, potência elétrica média, correntes e tensões de controle/sinalização e retorno energético.

Reutilizar o último cadastro por empresa do convite, modelo, velocidade e capacidade. Ao selecionar outra combinação, preencher dados encontrados automaticamente, permitindo edição. Quando o novo cadastro difere do anterior, mostrar a autoria anterior e exigir confirmação de sobrescrita. Revisões simultâneas não podem apagar alterações silenciosamente.

Potências ausentes recebem referência estimada identificada: massa nominal = capacidade × 75 kg; desequilíbrio = 50% da carga nominal; rendimento global = 75%. P mecânica = 0,5 × massa × 9,80665 × velocidade / 1000. P elétrica = P mecânica / 0,75. Correntes ausentes usam 0,25 A em cada circuito. São hipóteses de estudo, sem dimensionamento da máquina, inércia completa ou ensaio. Não apresentar P2 estimada como potência documentada pelo fornecedor. Registrar parâmetros efetivamente utilizados e exigir conferência técnica.

## Expediente e consumo

O administrador informa início/fim de atividades e almoço. Exemplo: 06:00–22:00, almoço 11:30–14:00. Horários no mesmo dia, múltiplos de cinco minutos. Perfis estimados são redistribuídos conservando pessoas; medições preservam contagens e horários reais. Não criar demanda medida fora da janela observada.

Usar PPH necessário calculado por elevador × horas de expediente × utilização média do pico declarada para projetar partidas diárias. A utilização inicial de 20% é hipótese editável, sem garantia de representar o edifício. Manter alternativa de partidas diárias declaradas. Com expediente ativo, energia fora dele não é incluída. Desativado, usar as horas energizadas declaradas e a utilização média do pico registrada, sem recorrer silenciosamente ao número manual de partidas quando a base escolhida for PPH. Controle e sinalização do produto são circuitos contínuos durante o expediente; a potência média de tração é um valor separado.

Mostrar equipamento existente e produto proposto. Retirar o gráfico separado de redução. No comparativo dos fornecedores, ordenar por pendências técnicas, atendimento de tráfego/PPH e menor consumo anual estimado. Mostrar preço informado separadamente. Qualidade, manutenção e preço não entram automaticamente na classificação; ela não aprova contratação. D/d inferior a 40 em cabos redondos gera pendência pelo critério padrão da NBR 16858-1 consultada, 5.5.2.1, ficando no fim. Cintas e outras soluções requerem comprovação aplicável, sem aplicar 40d automaticamente.

Permitir ao cliente anexar conta de energia e conferir kWh, custo variável de energia e total. Preparar extração por IA dependente de serviço configurado; nenhum valor é adotado sem conferência. Tarifa variável = custo variável/kWh. O responsável aplica a tarifa e recalcula. Economia anual estimada = diferença de kWh/ano × tarifa variável. Excluir custos fixos e consumo de outros usos do imóvel da economia atribuída aos elevadores. Informar que o resultado varia com funcionamento e premissas.

## Parâmetros e tela de cálculo

Usar “Elevadores do estudo”, “Tempo de Partida adicional por ciclo (s)” e “PPH Limite do fabricante (partidas/h por elevador)”. Copiar dados de um grupo de origem para um ou vários destinos marcados por flags, com a origem desabilitada na seleção de destinos; permitir também novo grupo, até vinte grupos.

Exibir aviso de aceleração somente acima dos limiares: amarelo acima de 1,00 m/s² com “Atenção, aceleração informada acima de 1,00 m/s²”; vermelho acima de 1,60 m/s² com “Atenção aceleração acima de 1,60 m/s².” Jerk acima da referência de conforto mostra aviso com o valor e faixa de velocidade. Incrementos de 0,05, com edição manual.

Quando abertura+fechamento supera a referência da tabela 3 NBR, mostrar valor e risco de perda de performance. Não tratar a tabela como limite universal de segurança. Pré-abertura ativada exibe tempo. No FAB/NBR, descontar a sobreposição em T3 e no adicional de portas, como premissa explícita do fabricante. No ISO, usar tpre no desempenho. Não alterar o cálculo normativo NBR.

PPH fabricante zero fica amarelo; inferior às partidas necessárias, vermelho e não atendimento. No quadro, PPH NBR/FAB = 3600 × partidas/paradas prováveis / ciclo. Mostrar intervalo de tráfego NBR e linha total por quantidade, sem somar intervalos. Separar PPH derivado do ciclo do máximo operacional por distância média.

Mover botões de relatório, apresentação, compartilhamento e importação/exportação para uma faixa no final da página, com quebra de linha. Mostrar Anexo A NBR para conferência na tela, além da versão final do relatório. Demanda em cinco minutos definida por norma deve informar percentual sobre população calculada/declarada.

## Links e auditoria

Qualquer perfil identificado autorizado ao projeto pode solicitar compartilhamento, dentro do próprio escopo. O administrador ou responsável aprova. Escolher consulta e impressão, ou edição para integrante previamente autorizado e identificado. Permitir ao fornecedor identificado editar somente sua própria proposta, conforme seu convite vigente. O link não concede alteração anônima nem privilégios superiores aos já autorizados.

Permitir todas as propostas do perfil ou um fornecedor específico, identificando a empresa no arquivo do relatório/apresentação. Registrar número único, gerador, aprovador, data, escopo, permissão, vencimento e revogação. Prazo: 24 horas, período definido ou ilimitado até revogação. Não publicar sem aprovação.

Todos os gráficos visíveis e propostas incluídas no escopo devem aparecer no relatório e PowerPoint editável. A apresentação deve mostrar contratante/projeto, parâmetros, premissas, comparativos, critérios da classificação, economia estimada, dados dos equipamentos e pendências para a reunião. Preservar estudos e versões anteriores.

## Organização das telas e navegação

Separar o programa em cinco telas independentes, mantendo o mesmo estudo e os dados durante a navegação:

1. **Cadastro:** cliente reutilizável, contatos, nome do estudo, edifício, endereço e contatos do projeto. Responsabilidade técnica recolhida em uma seção própria. Escolher um cliente já cadastrado ou salvar um novo cadastro na conta.
2. **Parâmetros de cálculo:** seleção NBR/ISO, aplicação do edifício, critérios e grupos de elevadores. Os grupos de estudos separados também são configurados nesta tela.
3. **Cálculo populacional:** composições recolhidas, com ambiente, andar e população no resumo. Abrir a composição a ser editada, verificar o total e configurar exclusões/escadas sem misturar os elevadores ou os gráficos.
4. **Gráficos de performance e economias:** painéis Atendimento, Energia e potência e Viagens. As configurações ficam em seções recolhidas. Edições retiram os gráficos calculados anteriores; a prévia de viagem, quando disponível, é identificada como tal.
5. **Cálculo de tráfego:** cálculo completo da população e de todos os estudos, indicadores, conclusões, resultados por grupo, memória, partidas, relatório, apresentação e link de consulta.

Usar menu numerado, botões Continuar/Voltar, identificação do estudo e indicação de cálculo pendente ou atualizado. Manter cadastros, projetos salvos, cenários, manuais, personalização e administração em Projetos e ferramentas. Não exibir todas as entradas e resultados na tela inicial.

Salvar clientes por conta e permitir escolher o mesmo cliente em quantos projetos forem necessários. A seleção copia os dados do cadastro para o projeto e registra seu vínculo, preservando a identidade e os contatos próprios do projeto. Criar a opção Novo projeto para este cliente. Salvar o rascunho atual antes de iniciar outro estudo quando houver acesso de edição. Atualizar o cadastro base não deve reescrever projetos ou relatórios compartilhados anteriores.

Os convidados podem navegar pelas cinco telas em consulta, com alterações bloqueadas. A reorganização não amplia permissões, não altera os motores normativos e não ativa cobrança.

## 1. Escolha do modelo pelo cliente

No início do estudo, oferecer **NBR 5665 — preferencial** e **ISO 8100 — alternativa baseada no documento informado**. Estudos anteriores sem seleção devem continuar na NBR 5665.

Cada modelo possui seus próprios parâmetros, composição populacional, grupos, motor de cálculo, memória e formato de relatório. Trocar de modelo guarda os parâmetros da opção anterior e recupera os da opção escolhida. Retirar os resultados anteriores e exigir Calcular estudo completo. Identificação do cliente e do projeto permanece comum. Não misturar fórmulas nem critérios dos modelos.

A opção ISO é baseada no documento de trabalho ABNT/CB-002/CE 002 138 018 N69, reunião de 21/05/2025, fornecido pelo proprietário e indicado por ele como base ISO8100. O documento está em elaboração e não é a edição publicada ISO 8100-32:2020. Essa condição deve aparecer na tela, memória, relatório e versão compartilhada; o resultado não é certificado de conformidade com a ISO publicada.

## 2. Ordem e composição do estudo

Começar pelo edifício, contratante e projeto. Depois calcular população e preencher os parâmetros dos elevadores. Cada composição possui indicação do ambiente, posição interna, andar servido, quantidade ou área, confirmações e populações calculada, declarada e adotada.

A posição da composição identifica a ordem e é independente da marcação do andar. Vários ambientes podem atender ao mesmo andar. O resumo soma suas parcelas e ordena os níveis físicos de baixo para cima.

Copiar deve solicitar a quantidade, preservando posições únicas de até dois caracteres e permitindo o mesmo andar ou andares seguintes. Subir/Descer organiza as composições. Alterar uma posição renumera só as posteriores. Confirmar um único pavimento de acesso à rua e desconsiderar todos os ambientes desse andar, preservando paradas e percurso. Orientar a preferência pela marcação numérica 0 no acesso, positivos acima e negativos abaixo, sem afirmar que toda letra é proibida pela norma de acessibilidade.

## 3. População calculada, declarada e adotada

Na parte inferior de cada composição, após as confirmações, apresentar lado a lado calculada e declarada, com a adotada identificada. A declaração cobre toda a composição, inclusive suas repetições.

Em cada ambiente, adotar o maior valor entre calculada líquida e declarada; depois somar os ambientes uma única vez por andar e estudo. Não somar calculada e declarada do mesmo ambiente.

Exemplos: 40 e 20 calculadas totalizam 60; declaração de 80 no primeiro resulta em 100; declaração de 50 resulta em 70; declaração de 30 mantém 60. Duas declarações de 80 em ambientes distintos totalizam 160.

Acesso, usos exclusivos e escadas confirmadas podem excluir parcelas, mantendo os valores brutos e os motivos na memória. Guardar a justificativa em Como a população foi definida? e apresentar no relatório.

Na NBR, manter os critérios existentes de população, descontos e arredondamento final por estudo. Na alternativa ISO do documento, usar área interna útil, utilização e densidade comercial por classe; tipologias e classes residenciais; hóspedes por quarto; saúde por leitos/consultórios ou área; vagas de carros e de motos/bicicletas. Arredondar para cima a soma por pavimento e estudo, após adotar os ambientes.

## 4. Critérios exclusivos da alternativa ISO

Oferecer classes comerciais Superior, Intermediário, Ambiente aberto e Alta densidade. A tabela 1 do documento define faixas de área por pessoa e utilização de 80%, 80%, 85% e 90%. A densidade deve ser escolhida na faixa da classe. Residenciais usam Superior, Intermediário ou Mínimo.

Para intervalos em faixas da tabela 3, permitir o menor limite (mais exigente), maior limite ou intervalo personalizado. Registrar a escolha. Como a célula de demanda do ambiente aberto está incompleta no documento, apresentar o percentual de projeto, inicialmente 12%, sem fingir que a tabela o fornece.

Registrar mínimo local de elevadores. Zero significa usar o critério do documento de dois elevadores para percurso acima de 24 m. Este parâmetro não representa consulta automática à legislação municipal.

O modelo parametrizado considera comando convencional e pico de subida. Controle de destino e múltiplos acessos principais exigem simulação específica e devem bloquear esta análise parametrizada. S e H assumem população e altura uniformes; diferenças na composição devem ser identificadas como aproximação. Grupos do mesmo serviço precisam dos mesmos destinos e percurso. Zonas têm estudos próprios dentro do projeto quando configuradas pela tabela de atendimento, com as limitações e verificações acima.

## 5. Parâmetros dos elevadores

Permitir até vinte grupos, com quantidade, lotação, paradas incluindo acesso, percurso, velocidade e dados de portas e movimento. A velocidade tem tabela de escolha e edição livre positiva. Aceleração e jerk têm digitação e ajuste de 0,05.

Alertar percurso inferior a (paradas − 1) × 2,80 m como critério de projeto. Aceleração acima de 1,00 até 1,60 m/s² deve aparecer em amarelo; acima de 1,60 em vermelho. Informar desconforto acima de 1,00. Jerk recebe aviso conforme premissa de conforto do estudo. Não usar o antigo limiar de 0,98.

Na NBR, manter Precisão integral de interpolação e comparar os tempos normativos com os do fabricante.

No ISO, registrar FC, Pcalc, atrasos inicial e de fechamento, pré-abertura e origem dos tempos. Oferecer tabelas do documento ou fabricante/premissas personalizadas. Os dados personalizados devem ser identificados como variação do método parametrizado, sem declaração automática de conformidade. Valores fora dos nós das tabelas exigem a base personalizada. Registrar opcionalmente carga nominal e área útil da cabina; não certificar sua relação sem verificação específica.

## 6. Motores de cálculo independentes

**NBR:** preservar o motor existente, as paradas prováveis, T1/T2/T3/T4, adicional de 10% sobre portas e transferência, tabelas/interpolação, capacidade em cinco minutos e intervalos. Manter a comparação NBR/FAB e o mínimo mantendo as proporções entre grupos.

**Alternativa ISO:** Pcalc = lotação nominal × FC. N = destinos sem o acesso, isto é, paradas totais − 1. S = N × [1 − (1 − 1/N)^Pcalc]. H = N − soma de (i/N)^Pcalc, de i=1 até N−1. df = percurso/N; tv = df/velocidade. O flight time considera a distância e os regimes de aceleração/jerk das fórmulas 17–19.

Calcular tperf = fechamento + atraso inicial + flight time − pré-abertura + abertura + atraso de fechamento. ts = tperf − tv. RTT = 2Htv + (S+1)ts + 2Pcalc × transferência por sentido.

Ch = 300Pcalc × quantidade/RTT. Intervalo = RTT/quantidade para grupo homogêneo. Percentual exibido = 100Ch/população. Não aplicar o adicional NBR de 10% nem o tempo de transferência NBR a esse motor.

Para RTT diferentes, identificar a consolidação por taxas como aproximação de projeto. Intervalo não é tempo médio de espera. O mínimo deve reavaliar o critério da quantidade, capacidade e intervalo, mantendo proporções. Exibir mínimo e advertências na tela e relatório.

Os exemplos do documento têm inconsistências de performance, utilização e ocupação. Validar as equações com entradas explícitas e exemplos independentes; não copiar os campos inconsistentes nem afirmar validação integral do documento.

## 7. Partidas por hora

Apresentar necessidade, máximo pelos tempos, limite do fabricante e máximo adotado, por elevador e grupo. Uma partida é cada saída, incluindo retorno; não confundir com ciclo completo.

Extrapolar a demanda de cinco minutos por 12 como hipótese de pico sustentado. Distribuir entre grupos de serviço comum pela capacidade do modelo. Usar lotação completa no indicador NBR existente e Pcalc no indicador ISO.

Na NBR, percurso médio por partida = 2 × percurso / partidas prováveis do ciclo. Manter o perfil cinemático e os tempos adicionais do indicador existente.

No ISO, partidas por ciclo = S+1; percurso médio = 2Hdf/(S+1); tempo entre partidas = RTT/(S+1); máximo = 3.600×(S+1)/RTT. Não reutilizar a aproximação de distância da NBR.

Zero no limite FAB significa não informado. Quando houver limite, adotar o menor entre ele e o máximo pelos tempos. Alertar quando a necessidade exceder o máximo. Incluir na comparação e no relatório. Não apresentar estimativa operacional como limite térmico certificado.

## 7.1. Curvas e tempos de viagem de cada grupo

Incluir, para cada grupo de elevadores, um conjunto semelhante à imagem fornecida: três painéis com tabela e curva: extremos, andares consecutivos e percurso médio baseado nas paradas prováveis, incluindo retorno ao acesso. A viagem entre extremos é direta, sem paradas intermediárias. Entre andares consecutivos, adotar a altura média percurso/(paradas−1) e informar que são duas paradas.

Mostrar paradas, percurso, velocidade nominal e atingida, aceleração informada e atingida, jerk, tempo de movimento, tempo com abertura e fechamento, transferência dos passageiros, atrasos, pré-abertura, adicional, permanência, tempo total, PPH teórico e PPH limitado pelo fabricante. Identificar a base utilizada e a quantidade de passageiros na hipótese.

Desenhar velocidade em função do tempo com fases de aceleração, velocidade constante quando possível, retardamento, portas e permanência. Calcular a distância acumulada por integração; não representá-la como se fosse uniforme no tempo. Nos percursos curtos, limitar a velocidade efetivamente atingida. Não inventar um trecho específico de nivelamento ou zona de porta sem os dados do fabricante.

Na NBR, o painel usa movimento e tempos do fabricante, transferência de lotação×tempo por pessoa, adicional operacional de 10% sobre portas/transferência, partida por ciclo rateada pelas paradas prováveis e permanência informada. Não alterar o ciclo normativo existente.

Na opção ISO, utilizar a base escolhida no estudo, Pcalc e transferência por sentido: fechamento + atraso inicial + movimento − pré-abertura + abertura + atraso de fechamento + 2Pcalc×tempo por pessoa. Não aplicar adicional de 10% nem permanência NBR. A pré-abertura representada deve caber no movimento e na abertura; indicar casos não representáveis sem modificar o RTT.

PPH teórico de cada percurso = 3.600/tempo total. O limite do fabricante restringe o PPH adotado quando informado. A hipótese repete a viagem e a transferência descritas; não confundir com o máximo pelo ciclo do estudo, com o intervalo entre elevadores ou com as partidas necessárias para atender a população.

Atualizar a prévia do grupo durante a edição, mantendo a exigência de cálculo completo antes de imprimir, baixar ou compartilhar. Após o cálculo, oferecer os três painéis de todos os grupos e estudos separados. Preservar os resultados de versões compartilhadas antigas, sem acrescentar uma nova curva calculada silenciosamente.

## 7.2. Atendimento por perfis e medições reais

Oferecer tráfego leve, moderado e modelo real com contagens no pavimento principal. Preservar os quatro fluxos da tabela enviada: entrada, almoço entrada, almoço saída e saída, por blocos de cinco minutos. Permitir declarar se os valores da imagem são percentuais da população ou pessoas estimadas; registrar que a imagem não informa unidade. Não normalizar os perfis novos para um percentual diferente. Estudos antigos mantêm seus perfis anteriores até o usuário escolher outra base.

No modo real, cadastrar horários, data, responsável, observações e contagens absolutas inteiras. Aceitar zero; campo vazio exige preenchimento. Permitir até 288 blocos e colar CSV com as quatro colunas. Reduzir a janela deve preservar os valores além da parte ativa. A medição não substitui a população calculada/declarada da edificação.

Mostrar gráficos de entrada, almoço, saída e filas. No almoço, os dois sentidos compartilham a mesma capacidade, sem dupla oferta. Usar os tempos do modelo escolhido e a permanência operacional, com memória da conservação das pessoas. Indicar picos acima da oferta mesmo quando o critério normativo atende. Essa análise por blocos não é despacho de cabinas, tempo médio real de espera ou simulação normativa de duas horas.

Medições do estudo principal não devem ser copiadas silenciosamente para demandas externas separadas. Essas recebem perfil estimado próprio na ausência de uma configuração específica.

## 7.3. Consumo elétrico e tecnologias

Disponibilizar VVVF não regenerativo, VVVF regenerativo, AC2, CC com motor-gerador e CC com conversor estático (Direct Drive), mostrando o existente e o proposto em cada cenário. Cadastrar potência média elétrica em movimento, potência em espera, recuperação, tempo específico, auxiliares e fonte por tecnologia. O comparativo começa com valores ilustrativos, claramente identificados; substituí-los por dados medidos ou de fabricante antes de uso comercial.

Potência média importada não é potência nominal do motor. Permitir recuperação nos sistemas CC compatíveis. Se a potência for já líquida de regeneração, exigir abatimento adicional zero. Registrar que conversor estático CC não significa necessariamente máquina sem engrenagens.

Definir expediente, utilização média do pico, base PPH ou partidas diárias declaradas, dias anuais e tarifa variável opcional. Contagens de pessoas no acesso não determinam sozinhas partidas ou energia diária; destinos, retorno e tráfego em outros horários são premissas adicionais. O tempo ideal no percurso médio pode ser substituído por tempo específico de cada tecnologia. Não aplicar o perfil ideal como ensaio medido de um AC2.

Calcular energia de movimento, retorno, espera e auxiliares; agregar por grupo físico do estudo. Não somar automaticamente consumo de estudos separados que possam representar o mesmo equipamento. Mostrar kWh/ano, reduções em kWh e %, custos quando informada tarifa, memória e benefícios/limitações. Redução negativa representa aumento; referência zero deixa percentual indefinido. Não prometer economia universal nem classificar/certificar pela ISO 25745.

### 7.3.1. Polia, suspensão e potência dos motores informadas pelo fornecedor

Cadastrar separadamente por grupo e por tecnologia: fornecedor, modelo da máquina e acionamento, documento e revisão, cabos de aço ou cintas, diâmetro primitivo real da polia, relação de suspensão r:1, relação de redução e potência nominal mecânica P2 do motor. Incluir 150 mm na lista de polias, sem adotar esse diâmetro como padrão universal para cintas. Aceitar qualquer outro valor válido informado pelo fornecedor.

Para cabos, permitir a escolha ou digitação do diâmetro em mm e exibir a referência 40d:

| Cabo | Diâmetro em mm | Referência 40d da polia em mm |
| --- | ---: | ---: |
| 4 mm | 4 | 160 |
| 6 mm | 6 | 240 |
| 3/8 pol. | 9,525 | 381 |
| 1/2 pol. | 12,700 | 508 |
| 5/8 pol. | 15,875 | 635 |

Citar ABNT NBR 16858-1:2021 consultada, 5.5.2.1, para D/d ≥ 40, e 5.5.1.2 a) para o diâmetro nominal padrão mínimo de 8 mm. Cintas e cabos alternativos dependem da comprovação de aplicação de 5.5.1.1. Registrar o documento do fornecedor para aplicações alternativas, sem disponibilizar a norma ou certificar conformidade. Confirmar a edição aplicável ao empreendimento.

Mostrar rotação da polia = 60×v×r/(πD), D em metros; rotação do motor = rotação da polia×redução. Torque nominal estimado = 60000×P2/(2π×rpm motor). Explicar que o diâmetro altera rotação e torque e, isoladamente, não determina redução de potência: P = F×v = T×ω. Esses indicadores não dimensionam a máquina nem simulam a inércia.

Ativar dados próprios somente nas tecnologias documentadas. Preferir potência média elétrica do fornecedor, substituindo a potência comum daquele grupo. Disponibilizar uma estimativa alternativa pela potência nominal: P elétrica = P2×fator mecânico médio/(rendimento motor×rendimento acionamento). Percentuais devem ser convertidos a frações. Exigir fator e rendimentos documentados; não confundir fator mecânico com ocupação da cabina. A estimativa usa base bruta e identifica sua limitação.

Permitir retorno percentual próprio do grupo ou herança do comum quando vazio, evitando dupla dedução de potência já líquida. Espera, auxiliares, calendário e tempos seguem as premissas comuns documentadas. Preservar resultados antigos e as opções NBR/ISO independentemente.

Ordenar o gráfico de potência nominal do maior para o menor valor P2 em kW, por elevador e por grupo. Mostrar somente dados do fornecedor; identificar tecnologias sem potência informada, sem preencher zero ou usar potência média no lugar da nominal. Manter a ordem original em empates. Ordenar o gráfico de consumo anual do maior para o menor kWh/ano, sem criar gráfico separado de redução. Sistema, relatório e PowerPoint devem utilizar os mesmos dados ordenados, preservando o valor e o rótulo de cada tecnologia.

Apresentar a diferença de potência nominal por elevador entre o sistema regenerativo e a tecnologia de referência, separada da comparação de kWh. Registrar polias, suspensão, potências realmente usadas, fonte e avisos no sistema, relatório e PowerPoint editável. Alterações invalidam o resultado e exigem recálculo completo.

## 7.4. Relatórios e PowerPoint editável

Todos os gráficos do estudo devem aparecer no relatório e na apresentação: três viagens por grupo, atendimento por períodos, filas e consumo do existente e dos produtos propostos, inclusive estudos separados. Reutilizar um catálogo dos mesmos dados, sem diferenças entre tela e saídas.

Inserir Gerar PowerPoint editável, disponível após cálculo completo. Gerar PPTX com textos, tabelas e gráficos nativos e planilhas incorporadas, identificação do cliente, projeto e logomarca. Explicar que alterações no PPTX não atualizam o projeto salvo no sistema. Preservar a verificação de acesso antes do download por links de consulta.

Qualquer alteração retira resultados anteriores e exige cálculo completo para gerar relatório ou apresentação. Versões históricas devem manter os indicadores disponíveis originalmente, sem cálculo silencioso de gráficos atuais.

Melhorias futuras para avaliação: medir partidas e energia durante o dia completo; cadastrar destinos e ocupação das cabinas; ampliar a análise de despacho e tráfego misto; calibrar os tempos de cada tecnologia; usar dados energéticos de fabricante ou ensaios com fronteira e calendário comparáveis.

## 8. Escadas rolantes e tabela fornecida

Oferecer duas bases: Tabela da imagem enviada e Dados documentados do fabricante. Para novos estudos, a tabela enviada é a base inicial. Preservar a base de fabricante nos estudos antigos que já utilizavam essa informação.

A tabela da imagem enviada possui capacidades teóricas em pessoas/h:

| Largura | 0,50 m/s | 0,65 m/s | 0,75 m/s |
| --- | ---: | ---: | ---: |
| 600 mm | 4.500 | 5.850 | 6.750 |
| 800 mm | 6.750 | 8.775 | 10.125 |
| 1.000 mm | 9.000 | 11.700 | 13.500 |

Identificar a tabela como referência fornecida pelo proprietário, sem atribuir estes valores à NBR 16734. Não interpolar nem extrapolar silenciosamente; fora dos nós, solicitar capacidade documentada do fabricante.

Controlar pavimento de acesso, trechos atendidos, par de subida/descida de mesma largura, velocidades, inclinação, desnível e confirmação técnica. Calcular capacidade na janela = capacidade horária × minutos/60 × utilização/100. Avaliar cada sentido separadamente, sem somar subida e descida.

A demanda do trecho acumula a população dos pavimentos dependentes. Continuidade, capacidade operacional e flag da composição são necessários para excluir a população. Ruptura mantém no estudo os pavimentos dependentes. Gargalo de capacidade deixa nos elevadores a parcela residual, conforme premissa de atendimento parcial da atualização 8.4. Preservar paradas e percurso. Citar NBR 5665, 5.1.6, na opção NBR, ou o documento informado, 4.3.3.4, na alternativa ISO.

## 9. Usos complementares e recálculo

Inserir garagem, restaurante e auditório em Componente de população. Auditório não deve aparecer na aplicação principal do edifício. Uso exclusivo de apoio não cria população adicional nas condições aplicáveis; demanda externa cria estudo separado com grupos próprios. Auditório usa assentos e critérios de projeto, com sua limitação de escopo identificada.

Recalcular automaticamente a população ao editar dados válidos e retirar os resultados anteriores de tráfego. Calcular estudo completo deve calcular primeiro a população, depois o principal e os separados, sempre no modelo selecionado. Bloquear relatório, compartilhamento e cenário calculado enquanto houver pendência.

## 10. Clientes, equipe e armazenamento

Manter clientes, projetos, contatos e logomarca. Atualizar cadastros no mesmo registro, preservando identidade e relatórios compartilhados. Cadastrar CNPJ e aprovação do projeto como dados opcionais do formulário ISO. A identificação do contratante e do projeto aparece na primeira página.

Projetos e clientes são salvos por conta; cenários ficam neste navegador. Permitir JSON para guardar e transferir os estudos, incluindo o modelo ativo e as configurações das duas opções. Comparações devem indicar o modelo de cada cenário.

Cada integrante acessa seus registros. Administrador acessa todos e pode delegar consulta ou edição com prazo ou até revogação. Não conceder permissões por atualização de contatos. Não reativar conta desativada pela edição do cadastro.

## 11. Relatórios, consulta e autoria

Manter marca e contatos da empresa no cabeçalho/rodapé e a logomarca no sistema. Gerar relatório HTML independente e impressão para PDF.

Na NBR, manter o formulário do Anexo A. No ISO do documento, usar o formulário parametrizado do Anexo D, com S, H, Pcalc, performance, RTT, capacidade, intervalo, critérios, conclusão nas premissas e autoria. Não emitir Anexo C nem afirmar que foi executada a simulação de duas horas.

Links de consulta guardam uma versão imutável com campos e resultados, sem edição pelo convidado. Devem permitir relatório, validade e revogação. As versões anteriores permanecem históricas; sua abertura não recalcula o conteúdo compartilhado com um motor novo. A hospedagem continua restrita ao proprietário até autorização para incluir terceiros.

## 12. Manual, entrega e próximos módulos

Atualizar Manual do usuário e Explicação dos cálculos para os dois modelos. Mostrar hipóteses, unidades, fontes, exemplos e limitações. Informar o que foi testado e se a revisão visual e a paginação permanecem pendentes.

A cada atualização, entregar esta descrição revisada para eu ler e propor alterações. Manter normas de manutenção e vistorias como referências para módulos futuros; não desenvolver esses módulos nesta etapa.

Possíveis ampliações futuras: validação do texto publicado da ISO, simulação real de duas horas com controle de destino e filas, tratamento específico de populações/alturas desiguais, zonas expressas e verificação da relação carga/área da cabina. Essas ampliações não estão sendo declaradas prontas.

## 13. Como pedir outra alteração

Quero alterar: [campo ou parte do programa].

No modelo: [NBR 5665 / ISO8100 do documento / ambos].

Hoje funciona assim: [comportamento atual].

Quero que passe a funcionar assim: [resultado esperado].

Exemplo de entradas: [valores]. Resultado esperado: [valor, aviso ou relatório].

Aplicar em: [tela, memória, relatório, comparação e exportação].

Preservar: [parâmetros dos modelos, cadastros, projetos e versões históricas].

Depois, entregar descrição revisada, testes realizados, limitações e URL privada.


## Atualização 8.6 — texto para solicitar e revisar

Reorganize os dados dos elevadores para que cada coluna seja a fonte única da capacidade em pessoas, velocidade em m/s, abertura livre e tipo de porta. Elimine a entrada duplicada “Lotação útil (passageiros)” e use a capacidade da coluna nas fórmulas de tráfego. Em cada coluna, permita escolher ou digitar a massa adotada por pessoa em kg/pessoa e apresente a capacidade estimada em kg como pessoas × kg/pessoa; mostre também a velocidade em m/min, calculada por m/s × 60. Diferencie a massa estimada da carga nominal de placa fornecida pelo fabricante. Preserve a capacidade em pessoas no cálculo de tráfego.

Permita editar o nome de cada grupo. Apresente um estudo separado para cada grupo, mantendo seus elevadores no mesmo contexto. Use a população dos pavimentos atendidos pelo grupo. Se houver pavimentos coincidentes entre grupos, informe que cada estudo avalia sua própria demanda, sem usar a soma das capacidades para declarar atendimento. Mantenha as verificações de destinos diferentes dentro de um grupo, sem inventar distribuição de demanda. Medições globais devem continuar visíveis como observação consolidada; perfis por grupo exigem medições segregadas ou identificação expressa de hipótese estimada.

Adote a redação: “Percurso de referência: (11 paradas − 1) × 2,80 m = 28,00 m. Premissa de projeto informada pelo usuário; confira as distâncias reais entre pavimentos.” O número de paradas e o resultado devem acompanhar os dados reais do estudo. Não atribua esta premissa a uma exigência normativa universal.

Reflita essas alterações no sistema, no relatório, no formulário de cálculo, na apresentação editável e no manual. Preserve os estudos existentes e suas versões compartilhadas, mantenha a oferta privada e sem cobrança real. Toda edição deve invalidar os resultados e exigir recálculo completo antes de emitir ou compartilhar documentos. Valide a capacidade individual, os valores derivados em kg e m/min, os nomes e a independência entre os grupos.


## Atualização 8.7 — referência de última altura e poço

Utilize a tabela dimensional fornecida pelo administrador como referência provisória de última altura e profundidade do poço. Remova somente linhas integralmente duplicadas após normalizar números e unidades, preservando configurações diferentes e suas origens. A base contém 2.741 registros originais, 35 duplicados removidos, 2.706 configurações distintas e oito configurações com alternativas dimensionais divergentes.

Consulte por capacidade em pessoas, velocidade em m/s, percurso máximo em m, altura de porta e cabina em mm, com/sem casa de máquinas e fabricação. Não interpole nem extrapole. Havendo alternativas divergentes, informe a condição e utilize provisoriamente o maior valor de cada dimensão entre as opções compatíveis. Não interprete essa referência como certificação do produto, máximo admissível ou mínimo normativo universal.

Dê prioridade aos dados reais declarados por cada fabricante, separadamente para última altura e poço. Cadastros devem manter empresa, modelo, configuração, autoria e revisão. Uma empresa não deve receber os valores privados de outra. Não substitua medidas existentes da edificação nem levantamentos em campo por valores estimados. Não invente máximos de instalação, pois a tabela não os fornece.

Identifique na tela, no relatório e na apresentação quais valores vêm da tabela e quais foram informados pelo fabricante. Preserve a referência utilizada na versão calculada do estudo. Alterações de parâmetros devem atualizar as sugestões e exigir recálculo antes da emissão dos documentos. Mantenha acesso privado e cobrança real desativada.


## Atualização 8.8 — caixa/cabina e configuração de escadas

Utilize a segunda tabela como referência provisória de frente e lado de caixa e cabina, complementando a tabela anterior de última altura e poço. Normalize números e textos e remova somente duplicatas integrais. Preserve alternativas diferentes e suas origens. A nova base tem 660 configurações únicas, sem duplicatas; 42 linhas inconsistentes ficam disponíveis para conferência, sem preenchimento automático. Não corrija silenciosamente mínimos maiores que máximos ou cabinas maiores que a caixa.

Consulte por capacidade, velocidade, percurso, casa de máquinas, tipo e abertura de porta, tipo de cabina, fabricação e entradas. Quando existir mais de uma variante compatível, permita selecionar uma linha completa por elevador. Não misture medidas de variantes diferentes nem extrapole a tabela. Para porta de eixo vertical ou entradas não cobertas, solicite dados ao fornecedor. Valores reais de cada fabricante prevalecem por campo e empresa, preservando autoria e revisão; medidas existentes da obra não são substituídas.

Libere o controle de atendimento e a aba Escadas rolantes somente quando existir algum flag de escadas selecionado em Pavimentos e atendimento por grupo. Ao desmarcar todos, oculte a aba e suspenda o abatimento populacional, preservando os dados. Remova as colunas Documento do fabricante e Confirmações e a obrigatoriedade das confirmações manuais das escadas. Mantenha a análise de continuidade, sentidos, quantidades, larguras e capacidade com base nos parâmetros informados. Documentos anteriores conservam sua versão histórica.

Atualize tela, relatório, apresentação editável e manual. Preserve a origem das referências na versão calculada, invalide documentos ao editar e mantenha hospedagem privada, sem cobrança real.


## Atualização 8.9 — confirmação e relação de tráfego conjuntas

Na caixa Equipamentos de transporte do edifício, exibir somente a confirmação “O prédio terá escadas e/ou esteiras rolantes?”, com Confirmar utilização, Sim e Não. Usar uma única aba “Escadas e esteiras rolantes”, mantendo os cadastros anteriores ao desativar ou reativar. Uma confirmação não obriga cadastrar os dois tipos. Na matriz, identificar atendimento por escada/esteira.

Cada conjunto deve identificar Escada rolante ou Esteira rolante, com a mesma configuração e relação de cálculo: capacidade na janela = capacidade unitária por hora × quantidade em serviço × minutos/60 × utilização/100; demanda = população × percentual de demanda/100. Os sentidos continuam analisados separadamente. Usar a tabela enviada como premissa do estudo ou a capacidade específica do fabricante; não declarar equivalência normativa a partir desta escolha. Continuidade ao acesso e geometria permanecem verificadas antes do abatimento populacional.

Para os trechos locais/horizontais cadastrados, aplicar a mesma relação de capacidade e os mesmos parâmetros de janela, demanda e utilização. Permitir declarar sua população para comparar a demanda, indicando quando ela ainda não foi informada. Não excluir população de outros andares por uma ligação horizontal isolada. Preservar os cadastros e documentos anteriores. Mostrar o tipo dos conjuntos, premissas e resultados no sistema, relatório e PowerPoint editável. Toda alteração invalida os documentos até o recálculo completo.
