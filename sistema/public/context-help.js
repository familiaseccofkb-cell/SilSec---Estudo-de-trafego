// Ajuda orientativa ao lado de cada seção: botão "?" que abre um popup com o conteúdo do campo.
export const CONTEXT_HELP = {
  relatorioCampos: {title:'Relatório · como ler cada campo', html:`<p><strong>Objetivo:</strong> o relatório reúne o que sai impresso ou em PDF. Esta ajuda explica cada bloco e como interpretar os números.</p><h3>1. Identificação</h3><ul><li><strong>Contratante:</strong> empresa, endereço, telefone, email e contato de quem contratou o estudo.</li><li><strong>Projeto e local:</strong> nome do projeto, endereço e contato no local da edificação.</li><li><strong>Uso e população:</strong> tipo de uso do edifício e a população adotada no cálculo. O campo "Não informado" indica dado que ainda não foi preenchido.</li><li><strong>Data e motor:</strong> data do estudo e versão do motor de cálculo usado.</li></ul><h3>2. Resultados por conjunto</h3><p>Uma linha por conjunto de elevadores: elevadores, paradas prováveis, PPH (partidas por hora por elevador), capacidade de transporte por 5 minutos e intervalo de tráfego. A linha total indica se o edifício é atendido. Veja o botão de ajuda da seção para o significado de cada coluna.</p><h3>3. Comparativo · dados do fabricante e distribuição</h3><p>O comparativo mostra o tempo de ciclo e a capacidade informados pelo fabricante. A distribuição mostra quantas pessoas cada conjunto atende e se há sobra (+), falta (−) ou andar sem atendimento.</p><h3>4. Memória do cálculo e componentes do ciclo</h3><ul><li><strong>T1 · percurso total:</strong> tempo de deslocamento da cabina.</li><li><strong>T2 · aceleração e retardamento:</strong> tempo de acelerar e frear.</li><li><strong>T3 · portas:</strong> tempo de abertura e fechamento.</li><li><strong>T4 · passageiros:</strong> tempo de embarque e desembarque.</li><li><strong>Adicional 10%:</strong> 10% sobre T3 + T4, previsto pela NBR 5665.</li><li><strong>Total:</strong> soma dos componentes, que é o tempo de ciclo do elevador.</li></ul><h3>5. Partidas por hora</h3><p>Partidas necessárias por elevador, máximo pelo tempo e máximo adotado. Se a necessária estiver acima do máximo, o grupo não atende. Veja o botão da seção para cada coluna.</p><h3>6. Gráficos de atendimento e de viagem</h3><ul><li><strong>Atendimento · entrada, almoço e saída:</strong> pessoas por 5 minutos ao longo do período. A linha de capacidade deve ficar acima da demanda; quando a demanda passa da capacidade, há fila.</li><li><strong>Filas remanescentes:</strong> pessoas que ficam na fila ao fim de cada bloco de 5 minutos. Fila que cresce indica atendimento insuficiente.</li><li><strong>Tempo de viagem (extremos, andares consecutivos e percurso médio):</strong> velocidade da cabina em função do tempo; a linha "Nominal" mostra a velocidade de projeto.</li></ul><h3>7. Energia e potência</h3><p>Consumo elétrico anual estimado por tecnologia e potência nominal por elevador. Quanto menor o consumo, melhor; a potência é a do motor informado pelo fabricante.</p><h3>8. Recomendações e performance do fabricante</h3><p>Compara o resultado do estudo com os limites de referência (recomendado e neutro) e com a tabela de performance enviada pelo fabricante. "Conforme" indica valor igual à referência; "Diferente", valor divergente.</p><h3>9. Premissas utilizadas</h3><p>Critérios e dados usados no cálculo: normas, tempos adotados, população e exclusões. Leia as premissas antes de conferir os resultados.</p><h3>10. Comparativo para contratação</h3><p>Compara as propostas dos fornecedores: tráfego atendido, consumo anual e economia estimada, preço e pendências técnicas. É apoio à decisão; não aprova a contratação.</p><h3>11. Anexo A · formulário de cálculo (NBR 5665)</h3><p>Formulário com linhas numeradas, na ordem do modelo da norma:</p><ul><li><strong>1 a 8:</strong> dados do grupo (unidades, capacidade, paradas, percurso, velocidade, tipo de porta e abertura livre).</li><li><strong>9 e 10:</strong> aceleração e retardamento; abertura e fechamento de portas.</li><li><strong>11:</strong> tempo de entrada e saída por parada.</li><li><strong>12 a 15:</strong> T1 a T4, descritos no item 4 acima.</li><li><strong>16 · T:</strong> tempo total de viagem.</li><li><strong>17 · I:</strong> intervalo do grupo, em segundos.</li><li><strong>18 e 19:</strong> transporte do grupo (Ct) e capacidade de tráfego total (CT), em pessoas por 5 minutos.</li></ul><p>As colunas NBR e Fabricante mostram o cálculo com cada conjunto de valores.</p><h3>Como interpretar</h3><ul><li>Valores em vermelho ou marcados como "não atende" indicam o que precisa ser revisado.</li><li>"Não informado" ou "—" indicam dado ausente; o cálculo pode estar incompleto.</li><li>Quando houver dúvida sobre um número, abra a <strong>Memória do cálculo</strong> para ver de onde ele vem.</li></ul>`},
  partidasHora: {title:'Partidas por hora · dados do fabricante', html:`<p><strong>Objetivo:</strong> verificar se os elevadores conseguem realizar o número de partidas por hora que a população do pico exige, usando os tempos informados pelo fabricante.</p><p><strong>Partida</strong> é uma saída da cabina, incluindo o retorno ao acesso.</p><p><strong>Indicadores do topo:</strong></p><ul><li><strong>PSH · pico equivalente (pessoas/h):</strong> população que precisa ser transportada na hora de pico, equivalente ao pico de 5 minutos sustentado por uma hora.</li><li><strong>Partidas necessárias · todos os grupos (/h):</strong> partidas por hora que todos os grupos precisam fazer para atender o PSH.</li><li><strong>Máximo adotado · todos os grupos (/h):</strong> limite de partidas por hora que o estudo considera possível, o menor entre o tempo de ciclo e o limite do fabricante.</li></ul><p><strong>Colunas da tabela:</strong></p><ul><li><strong>Grupo / totais:</strong> grupo e número de elevadores; abaixo, as partidas necessárias e o máximo do grupo.</li><li><strong>Percurso médio por partida (m):</strong> distância média percorrida em cada partida.</li><li><strong>Necessárias por elevador / h:</strong> partidas por hora que cada elevador precisa fazer.</li><li><strong>Máximo pelo tempo por elevador / h:</strong> partidas por hora possíveis pelo tempo de ciclo (3.600 dividido pelo tempo médio entre partidas).</li><li><strong>Limite FAB por elevador / h:</strong> limite informado pelo fabricante; em branco, aparece como não informado.</li><li><strong>Máximo adotado por elevador / h:</strong> o menor valor entre o máximo pelo tempo e o limite do fabricante.</li><li><strong>Capacidade do elevador (pessoas / h):</strong> máximo adotado multiplicado pela capacidade efetiva do elevador.</li><li><strong>Déficit populacional (pessoas / h sem atendimento):</strong> população por hora que o grupo não consegue transportar; — quando não há cálculo.</li><li><strong>Utilização (%):</strong> partidas necessárias divididas pelo máximo adotado.</li><li><strong>Condição:</strong> <em>Atende</em> quando as partidas necessárias ficam dentro do máximo; <em>Não atende</em> quando ultrapassam; neutro quando falta o limite do fabricante.</li></ul><p><strong>Premissas:</strong> pico de 5 minutos sustentado por uma hora; cabina com lotação útil completa em cada ciclo; retorno vazio incluído nas partidas.</p>`},
  memoriaPartidas: {title:'Memória de partidas, distâncias e tempos médios', html:`<p><strong>Objetivo:</strong> mostrar como o número de partidas por hora de cada grupo foi calculado, para conferência técnica.</p><ul><li><strong>Altura média entre pavimentos (m):</strong> altura usada para estimar o percurso.</li><li><strong>Partidas prováveis por ciclo (N):</strong> número médio de partidas de um elevador em um ciclo completo, incluindo o retorno ao acesso.</li><li><strong>Percurso médio de uma partida:</strong> 2 × percurso ÷ N, em metros.</li><li><strong>Movimento no percurso médio:</strong> tempo de deslocamento, com aceleração e jerk limitados.</li><li><strong>Abertura + fechamento de portas (s):</strong> tempo de portas por partida.</li><li><strong>Entrada e saída / passageiros (s):</strong> tempo de embarque e desembarque por partida; por parada, quando o tempo é informado por parada.</li><li><strong>Adicional de 10% (portas e passageiros):</strong> acréscimo previsto pela NBR 5665 sobre portas e passageiros.</li><li><strong>Tempo adicional do ciclo ÷ N (s):</strong> tempo de partida informado, dividido pelas partidas do ciclo.</li><li><strong>Permanência adicional por parada (s):</strong> tempo extra que a cabina permanece parada, quando informado.</li><li><strong>Total médio entre partidas (s):</strong> soma dos componentes acima; é o tempo de ciclo usado no máximo pelo tempo.</li></ul><p><strong>Cálculos exibidos:</strong></p><ul><li><strong>Máximo pelos tempos:</strong> 3.600 ÷ total médio entre partidas.</li><li><strong>Referência pelo ciclo FAB original:</strong> 3.600 × N ÷ ciclo FAB, sem permanência adicional; serve para comparar com o cálculo com os tempos do fabricante.</li><li><strong>Demanda atribuída ao grupo:</strong> PSH × participação do grupo; os ciclos necessários são a demanda ÷ capacidade do grupo, e as partidas por elevador são ciclos × N ÷ número de elevadores.</li></ul><p>A velocidade e a aceleração máximas atingidas mostram se o percurso médio permite chegar à velocidade nominal.</p>`},
  recomendacoesPerformance: {title:'Recomendações de performance', html:`<p>Compara o resultado do estudo com limites de referência por tipo de edifício, para dois picos de tráfego e duas métricas de tempo.</p><ul><li><strong>Picos de subida:</strong> tráfego predominante de saída da lobby, com os passageiros subindo a partir do pavimento de acesso.</li><li><strong>Picos de subida e descida:</strong> tráfego misto, com passageiros subindo e descendo entre pavimentos.</li><li><strong>TME · Tempo médio de espera:</strong> tempo médio, em segundos, que o passageiro espera até o elevador atender o chamado.</li><li><strong>TMD · Tempo médio até o destino:</strong> tempo médio, em segundos, entre o registro do destino (ou o chamado) e a chegada ao andar de destino.</li><li><strong>Resultado do estudo:</strong> valor calculado pelo estudo para o pico e a métrica indicados.</li><li><strong>Limites (recomendado / neutro):</strong> o primeiro valor é o limite recomendado; o segundo, o limite neutro.</li><li><strong>Classificação:</strong> <em>Recomendado</em> quando o resultado é menor ou igual ao limite recomendado; <em>Neutro</em> quando fica entre os dois limites; <em>Não recomendado</em> quando ultrapassa o limite neutro.</li></ul><p>Os limites dependem do uso do estudo (escritórios, residencial etc.) e são referências de projeto, não exigências normativas. Confira a tabela de referência completa para ver todos os usos.</p>`},
  modelo: {
    title: 'Modelo de cálculo escolhido pelo cliente',
    html: `<p>Define o método de cálculo usado no estudo de tráfego de elevadores.</p>
<ul>
<li><strong>Método do estudo:</strong> escolha entre NBR 5665 (preferencial) e ISO 8100-32.</li>
<li>Cada método guarda seus próprios parâmetros.</li>
<li>Ao trocar o método, os resultados anteriores são retirados e o cálculo completo precisa ser refeito.</li>
</ul>
`
  },
  expediente: {
    title: 'Expediente e equipamento existente',
    html: `<p>Define os horários de funcionamento do prédio, que orientam os perfis de tráfego e a estimativa de consumo de energia.</p>
<ul>
<li><strong>Utilizar expediente nos perfis e no consumo:</strong> marcado, o estudo considera o horário de expediente; desmarcado, não considera.</li>
<li><strong>Início das atividades e fim do expediente:</strong> devem ser no mesmo dia.</li>
<li><strong>Início e fim do almoço:</strong> devem ficar dentro do expediente.</li>
<li>Use horários em múltiplos de 5 minutos.</li>
<li><strong>Utilização média do PPH de pico (%):</strong> percentual usado para projetar partidas durante o expediente. 100% mantém o pico durante todo o dia; valores altos aumentam a projeção de partidas e de consumo.</li>
<li><strong>Tecnologias:</strong> compare o consumo do equipamento atual com o da alternativa proposta, no mesmo horário.</li>
<li><strong>Base das partidas no consumo:</strong> use o PPH calculado pelo sistema ou informe as partidas diárias por elevador.</li>
</ul>`
  },
  formulario: {title:'Formulário de cálculo', html:`<p>Reproduz o formulário de cálculo do Anexo A da NBR 5665 (ou o formulário ISO, quando esse método está selecionado), com linhas numeradas e colunas NBR e Fabricante.</p><p>A impressão usa este mesmo layout.</p>`},
  edificio: {title:'Edifício e critérios', html:`<p>Reúne os dados do edifício e os critérios do estudo.</p><ul><li>Confira que os conjuntos de elevadores atendem as mesmas paradas, hall, acesso principal e uso.</li><li>O aviso não bloqueia o cálculo: destinos diferentes são organizados pela matriz de pavimentos e atendimento.</li></ul>`},
  dadosElevadores: {title:'Dados dos Elevadores do estudo', html:`<p>Campos de cada grupo de elevadores do estudo, como capacidade, velocidade, aceleração e jerk.</p><p>Esses valores alimentam os cálculos de paradas prováveis, tempo de viagem e capacidade de transporte.</p>`},
  premissas: {title:'Premissas utilizadas', html:`<p>Lista a metodologia e as premissas aplicadas ao estudo.</p><ul><li>Mostra os avisos gerados pelo cálculo.</li><li>Indica os itens normativos e as referências usados.</li></ul>`},
  validacao: {title:'Validação dos cálculos', html:`<p>Mostra as conferências automatizadas do sistema e quantas foram aprovadas.</p><p>São verificados componentes de ciclo, exemplos do anexo B, ocupação, descontos, população editada, dimensionamento mínimo, importação, cenários e controles da interface.</p>`},
  comoFunciona: {title:'Como o cálculo funciona', html:`<p>Explica o método de cálculo usado no estudo, a memória populacional e trechos das normas aplicadas.</p>`},
  comprovacao: {title:'Comprovação dos dados energéticos', html:`<p>Anexe um arquivo (PDF, texto ou imagem) que comprova os dados energéticos informados para a tecnologia escolhida.</p>`},
  resultados: {title:'Resultados', html:`<p>Mostra o resultado do cálculo do estudo.</p><p>Quando algum parâmetro é alterado, os resultados anteriores são retirados, para não comparar dados de momentos diferentes.</p><p>Use <strong>Calcular estudo completo</strong> para gerar os resultados novamente.</p>`},
  resultadosConjunto: {title:'Resultados por conjunto', html:`<p><strong>Objetivo:</strong> mostrar, para cada conjunto de elevadores, se a capacidade e a frequência de atendimento são suficientes para a população do estudo. Use para identificar o conjunto que limita o tráfego.</p><ul><li><strong>Conjunto:</strong> nome do grupo de elevadores. Abaixo, o número de unidades que o compõem.</li><li><strong>Elevadores:</strong> quantidade de unidades do conjunto.</li><li><strong>Paradas prováveis:</strong> número médio de paradas que um elevador faz por viagem, estimado pelo modelo de tráfego.</li><li><strong>PPH NBR (partidas/h por elevador):</strong> partidas por hora de cada elevador, calculadas pelo método NBR 5665 a partir do tempo de ciclo.</li><li><strong>PPH FAB (partidas/h por elevador):</strong> o mesmo cálculo, com os tempos informados pelo fabricante.</li><li><strong>PPH limite do fabricante:</strong> limite de partidas por hora informado pelo fabricante. Em branco, aparece como não informado.</li><li><strong>Capacidade NBR / 5 min:</strong> pessoas que o conjunto transporta em 5 minutos, pelo método NBR.</li><li><strong>Capacidade FAB / 5 min:</strong> o mesmo, com os tempos do fabricante.</li><li><strong>Intervalo de tráfego NBR (s):</strong> intervalo médio entre partidas do conjunto. Quanto menor, melhor o atendimento.</li><li><strong>Total / condição de atendimento:</strong> soma de elevadores e capacidades; as paradas e o PPH não são somados, porque dependem de cada conjunto.</li></ul><p><strong>Cores:</strong> vermelho indica PPH acima do limite ou capacidade insuficiente para o conjunto.</p><p>Para ver como cada número foi calculado, abra <strong>Memória do cálculo</strong>.</p>`},
  comparativoDadosFabricante: {title:'Comparativo · dados do fabricante', html:`<p><strong>Objetivo:</strong> mostrar a capacidade e o tempo de ciclo informados pelo fabricante, para comparar com o cálculo do estudo.</p><ul><li><strong>Conjunto:</strong> nome do grupo de elevadores.</li><li><strong>Tempo total do ciclo FAB · média por elevador (s):</strong> tempo médio, em segundos, que um elevador leva para completar um ciclo com os dados do fabricante (ida, paradas, portas e transferência).</li><li><strong>Capacidade de tráfego do conjunto (pessoas / 5 min):</strong> pessoas que o conjunto transporta em 5 minutos, com os tempos do fabricante.</li><li><strong>Total:</strong> soma da capacidade de todos os conjuntos; o tempo de ciclo não é somado, porque é uma média por elevador.</li><li><strong>Intervalo de tráfego total (s):</strong> intervalo médio entre partidas do edifício, considerando todos os conjuntos.</li></ul><p>Se o fabricante não informou os tempos, os valores aparecem como —.</p>`},
  distribuicaoPopulacao: {title:'Distribuição da população entre conjuntos', html:`<p><strong>Objetivo:</strong> mostrar quantas pessoas de cada andar cada conjunto de elevadores deve atender, e se algum conjunto fica sobrecarregado ou sem atendimento.</p><ul><li><strong>Conjunto:</strong> nome do grupo de elevadores.</li><li><strong>Capacidade / 5 min:</strong> pessoas que o conjunto transporta em 5 minutos.</li><li><strong>População atribuída:</strong> pessoas dos andares que o conjunto atende, depois da divisão pelos conjuntos que servem o mesmo andar.</li><li><strong>Sobra (+) / falta (−):</strong> capacidade menos população atribuída. Sobra indica folga; falta indica que o conjunto não dá conta do que lhe foi atribuído.</li><li><strong>Situação:</strong> <em>Atende</em> (capacidade suficiente), <em>Sobra</em> (folga) ou <em>Falta</em> (capacidade insuficiente).</li></ul><p><strong>Realocações:</strong> quando um conjunto falta e outro sobra no mesmo andar, parte da população é transferida; a lista mostra cada transferência.</p><p><strong>Sem conjunto que atenda:</strong> andares que nenhum conjunto serve. Corrija a composição de atendimento dos andares.</p><p><strong>Falta não coberta:</strong> capacidade que nenhum conjunto consegue absorver.</p>`},
  memoriaCalculo: {title:'Memória do cálculo', html:`<p><strong>Objetivo:</strong> mostrar como cada número do estudo foi obtido, para conferência técnica.</p><ul><li><strong>Grupo / base:</strong> conjunto de elevadores e o método (NBR ou fabricante) usado.</li><li><strong>T1 (s) · percurso total:</strong> tempo de deslocamento da cabina entre as paradas.</li><li><strong>T2 (s) · aceleração e retardamento:</strong> tempo gasto em acelerar e frear a cabina.</li><li><strong>T3 (s) · portas:</strong> tempo de abertura e fechamento das portas em cada parada.</li><li><strong>T4 (s) · passageiros:</strong> tempo de entrada e saída dos passageiros.</li><li><strong>10% (T3+T4) (s):</strong> adicional de 10% sobre a soma de T3 e T4, previsto pela NBR 5665.</li><li><strong>Partida (s):</strong> tempo adicional de partida, informado pelo fabricante ou pela norma.</li><li><strong>Total (s):</strong> soma de T1, T2, T3, T4, do adicional de 10% e da partida; é o tempo de ciclo do elevador.</li></ul><p>Os tempos com o sufixo FAB usam os valores informados pelo fabricante; os com NBR, os valores de referência da norma.</p>`},
  "operation.schedule.enabled": {title:"Expediente: marcar para o estudo considerar o horário de expediente", html:`<p>Marque para o estudo considerar o horário de expediente nos perfis de tráfego e no consumo de energia.</p><p>Desmarcado, o estudo não considera horário de expediente.</p><p><strong>Benefício:</strong> o cálculo de consumo fica ligado ao horário real de funcionamento do prédio.</p>`},
  "operation.schedule.start": {title:"Início das atividades", html:`<p>Hora em que começam as atividades do prédio. Preencha em múltiplos de 5 minutos e no mesmo dia do fim do expediente.</p><p>Usado para distribuir a chegada das pessoas ao longo do expediente nos perfis de tráfego e no cálculo de consumo.</p>`},
  "operation.schedule.end": {title:"Fim do expediente", html:`<p>Hora em que termina o expediente. Preencha em múltiplos de 5 minutos e no mesmo dia do início.</p><p>Usado para definir até quando as saídas são distribuídas. O consumo fora do expediente não entra no cálculo.</p>`},
  "operation.schedule.lunchStart": {title:"Início do almoço", html:`<p>Início do intervalo de almoço, dentro do expediente, em múltiplos de 5 minutos.</p><p>Usado para distribuir as saídas para o almoço nos perfis de tráfego.</p>`},
  "operation.schedule.lunchEnd": {title:"Fim do almoço", html:`<p>Fim do intervalo de almoço, dentro do expediente, em múltiplos de 5 minutos.</p><p>Usado para distribuir o retorno do almoço nos perfis de tráfego.</p>`},
  "operation.schedule.peakUtilizationPercent": {title:"Utilização média do PPH de pico (%)", html:`<p>Percentual usado para projetar partidas durante o expediente. Padrão de 20%, uma hipótese editável.</p><p>100% mantém o pico durante todo o dia. Valores altos aumentam a projeção de partidas e de consumo.</p>`},
  "energy.baseline": {title:"Tecnologia existente", html:`<p>Tecnologia de tração do equipamento atual do prédio.</p><p>Usada como referência na comparação de consumo de energia dos resultados e relatórios.</p>`},
  "energy.comparisonTechnology": {title:"Tecnologia proposta no cenário", html:`<p>Tecnologia da alternativa proposta no cenário.</p><p>Comparada com a tecnologia existente no mesmo horário de funcionamento.</p>`},
  "energy.startsSource": {title:"Base das partidas no consumo", html:`<p><strong>PPH calculado × expediente × utilização:</strong> o sistema calcula as partidas a partir do PPH e do expediente.</p><p><strong>Partidas diárias declaradas:</strong> você informa o número de partidas por dia de cada elevador.</p>`},
  "energy.dailyStarts": {title:"Número de partidas diárias por elevador", html:`<p>Partidas por dia de cada elevador, quando a base escolhida é 'Partidas diárias declaradas'.</p><p>Não são partidas por hora. Usado diretamente no cálculo de consumo.</p>`},
  "trafficModel": {title:"Método do estudo", html:`<p>Método de cálculo do estudo: NBR 5665 (preferencial) ou ISO 8100-32.</p><p>Cada opção guarda seus próprios parâmetros. Ao trocar, os resultados anteriores são retirados e o cálculo precisa ser refeito.</p>`},
  "client": {title:"Cliente · nome da empresa", html:`<p>Nome da empresa que contratou o estudo.</p><p>Fica registrado como empresa cliente do estudo e aparece na identificação do estudo.</p>`},
  "customer.contact": {title:"Contato da empresa cliente", html:`<p>Pessoa de contato na empresa cliente.</p><p>Serve para identificar quem recebe e confere o estudo.</p>`},
  "customer.address": {title:"Endereço da empresa cliente", html:`<p>Endereço da empresa cliente, usado na identificação do estudo.</p>`},
  "customer.phone": {title:"Telefone da empresa cliente", html:`<p>Telefone de contato da empresa cliente, usado na identificação do estudo.</p>`},
  "customer.email": {title:"Email da empresa cliente", html:`<p>E-mail de contato da empresa cliente, usado na identificação do estudo.</p>`},
  "name": {title:"Nome do estudo", html:`<p>Nome que identifica este estudo na lista de projetos.</p><p>Obrigatório, com até 120 caracteres.</p>`},
  "date": {title:"Data do estudo", html:`<p>Data de referência do estudo.</p><p>Aparece na identificação do estudo.</p>`},
  "building": {title:"Edifício · nome do projeto", html:`<p>Nome do edifício ou do projeto estudado.</p><p>Ao preencher, o nome também é usado como nome do projeto, se ele ainda não tiver sido alterado manualmente.</p>`},
  "address": {title:"Endereço do projeto", html:`<p>Endereço do edifício ou do projeto estudado.</p><p>Ao preencher, o endereço também é usado no cadastro do projeto, se ele ainda não tiver sido alterado manualmente.</p>`},
  "projectDetails.contact": {title:"Contato no endereço do projeto", html:`<p>Pessoa de contato no local do projeto.</p>`},
  "projectDetails.phone": {title:"Telefone no endereço do projeto", html:`<p>Telefone de contato no local do projeto.</p>`},
  "empresaCliente": {title:"Empresa cliente", html:`<p>Dados da empresa que contratou o estudo. Preencha aqui ou escolha um cliente já cadastrado.</p><p>O mesmo cliente pode ser usado em vários projetos. Cada projeto mantém seus próprios dados.</p>`},
  "clientePicker": {title:"Escolher cliente cadastrado", html:`<p>Escolha um cliente salvo no cadastro para preencher os campos automaticamente.</p><p>Escolha <strong>Preencher os dados de um cliente</strong> para digitar os dados manualmente.</p><p><strong>Onde alterar:</strong> tela Clientes, em 'Ver clientes cadastrados'.</p>`},
  "population": {title:"População adotada no estudo principal (pessoas)", html:`<p>Resultado automático: a população do estudo é calculada pela composição dos ambientes.</p><p>Não é editada aqui. Para declarar população, use o campo do ambiente na composição.</p><p><strong>Onde alterar:</strong> tela População, na composição dos ambientes.</p>`},
  "populationDefinition": {title:"Como a população foi definida?", html:`<p>Explique a origem das declarações e as decisões de ocupação.</p><p>O texto é preservado nos recálculos e incluído no relatório.</p>`},
  "annex.owner": {title:"Proprietário", html:`<p>Nome do proprietário, preenchido no campo de identificação do formulário do Anexo A da NBR 5665.</p>`},
  "annex.author": {title:"Autor do projeto", html:`<p>Autor do projeto, preenchido no campo de identificação do formulário do Anexo A da NBR 5665.</p>`},
  "annex.builder": {title:"Construtor", html:`<p>Construtora responsável pela obra, preenchida no campo de identificação do formulário do Anexo A da NBR 5665.</p>`},
  "annex.engineer": {title:"Engenheiro responsável", html:`<p>Engenheiro responsável pelo estudo, preenchido no campo de identificação do formulário do Anexo A da NBR 5665.</p>`},
  "annex.installer": {title:"Empresa responsável", html:`<p>Empresa responsável pela instalação, preenchida no campo de identificação do formulário do Anexo A da NBR 5665.</p>`},
  "annex.notes": {title:"Observações para o formulário", html:`<p>Observações livres que aparecem no formulário do Anexo A da NBR 5665.</p>`},
  "isoConfig.projectCnpj": {title:"CNPJ do empreendimento / proprietário", html:`<p>CNPJ do empreendimento ou do proprietário.</p><p>Aparece na identificação do estudo no modelo ISO 8100-32.</p>`},
  "isoConfig.approvalDate": {title:"Data de aprovação do projeto", html:`<p>Data em que o projeto foi aprovado.</p><p>Aparece na identificação do estudo no modelo ISO 8100-32.</p>`},
  studyContext: {title:"Novo estudo · nome e modelo", html:`<p>Mostra o nome do estudo atual, o modelo de cálculo escolhido e a etapa em que você está.</p><p><strong>Onde alterar o nome:</strong> campo Nome do estudo, na etapa 1 de 6 (Cliente e projeto).</p><p><strong>Onde alterar o modelo:</strong> campo Método do estudo, na seção Modelo de cálculo escolhido pelo cliente.</p>`},
  "operation.profile": {title:"Perfil registrado", html:`<p>Nível de tráfego do edifício: <strong>Leve</strong>, <strong>Moderado</strong> ou <strong>Pesado</strong>.</p><p>Escolha conforme as contagens do pavimento principal. Usado na performance de atendimento do estudo.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção de performance (desempenho de atendimento).</p>`},
  "operation.charter": {title:"Fretado (%)", html:`<p>Percentual de pessoas que usam o elevador de forma fretada, ou seja, não pública.</p><p>O restante é calculado como tráfego público. Usado na distribuição do tráfego do estudo.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção de performance (desempenho de atendimento).</p>`},
  "operation.lunch": {title:"Almoço (%)", html:`<p>Percentual de pessoas que saem para o almoço no período de expediente.</p><p>Usado na distribuição das saídas para almoço no cálculo de performance.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção de performance (desempenho de atendimento).</p>`},
  "operation.dwell": {title:"Permanência (s)", html:`<p>Tempo, em segundos, que a porta permanece aberta em cada parada.</p><p>O botão de 6 s é um valor de atalho. Usado no cálculo de desempenho de atendimento.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção de performance (desempenho de atendimento).</p>`},
  "responsabilidade": {title:"Responsabilidade técnica e autoria do relatório", html:`<p>Reúne os dados de responsabilidade técnica e autoria exibidos no relatório.</p><p>Para que apareçam aqui, preencha os campos <strong>Engenheiro responsável</strong> e <strong>Autor do projeto</strong>, que ficam no formulário do Anexo A.</p>`},
  "importar": {title:"Importar estudo ou carregar exemplo", html:`<p>Abre um estudo salvo em arquivo ou um exemplo pronto para testar o sistema.</p><ul><li><strong>Importar JSON:</strong> abre um estudo exportado antes.</li><li><strong>Novo estudo com campos vazios:</strong> começa do zero.</li><li><strong>Carregar exemplo:</strong> abre um estudo de exemplo.</li></ul>`},
  "relatorioPendente": {title:"Relatório pendente", html:`<p>Aparece quando o estudo ainda não foi calculado completamente.</p><p>Calcule o estudo completo para ver o relatório. As pendências de preenchimento aparecem no rodapé desta página.</p>`},
  "relatorioApresentacao": {title:"Relatório e apresentação", html:`<p>Ações do relatório:</p><ul><li><strong>Salvar cenário:</strong> guarda o estudo atual como cenário.</li><li><strong>Imprimir / Salvar PDF:</strong> imprime ou gera PDF.</li><li><strong>Baixar relatório HTML:</strong> baixa o relatório em HTML.</li><li><strong>Gerar PowerPoint editável:</strong> gera a apresentação em PowerPoint.</li></ul>`},
  "normativos": {title:"Itens normativos utilizados", html:`<p>Trechos das normas usadas no cálculo, com o item de referência de cada um.</p><p>Revise com o responsável técnico antes do uso profissional.</p>`},
  "referencias": {title:"Referências", html:`<p>Lista as fontes técnicas usadas pelo sistema, com a localização de cada uma.</p><p>Os dados vêm das edições fornecidas. O sistema não verifica a vigência das normas. Revise com o responsável técnico.</p>`},
  "chaveTemporaria": {title:"Chave temporária gerada", html:`<p>Chave de acesso temporário gerada para este usuário.</p><p>Fica válida até a data indicada e é exibida somente nesta sessão. Copie a chave antes de sair da tela.</p>`},
  "groups.capacity": {title:"Capacidade (pessoas)", html:`<p>Número máximo de pessoas que cabem na cabina do elevador.</p><p>Usado no cálculo de paradas prováveis, capacidade de transporte e perfis de tráfego. É a única entrada de lotação do elevador.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  "groups.stops": {title:"Paradas incluindo acesso", html:`<p>Número de paradas atendidas pelo elevador, contando o pavimento de acesso.</p><p>Usado no cálculo das paradas prováveis.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  "groups.width": {title:"Abertura livre da porta (mm)", html:`<p>Largura livre da abertura da porta da cabina, em milímetros.</p><p>Usada na verificação das dimensões da porta do elevador.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  "groups.open": {title:"Abertura da porta (s)", html:`<p>Tempo, em segundos, que a porta leva para abrir.</p><p>Usado no tempo de ciclo do elevador.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  "groups.close": {title:"Fechamento da porta (s)", html:`<p>Tempo, em segundos, que a porta leva para fechar.</p><p>Usado no tempo de ciclo do elevador.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  "groups.passenger": {title:"Entrada/saída por pessoa (s)", html:`<p>Tempo, em segundos, que cada pessoa leva para entrar ou sair da cabina.</p><p>Usado no tempo de ciclo do elevador.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  "groups.start": {title:"Partida adicional (s)", html:`<p>Tempo extra, em segundos, na partida do elevador, somado ao tempo de ciclo.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  "groups.preOpeningEnabled": {title:"Abertura antecipada de porta", html:`<p>Quando marcada, aplica a abertura antecipada da porta ao tempo de ciclo do grupo.</p><p>Desmarcada, a pré-abertura fica desligada.</p><p><strong>Onde alterar:</strong> tela Parâmetros, seção Dados dos Elevadores do estudo.</p>`},
  transporteEquipamentos: {
    title: "Equipamentos de transporte do edifício",
    html: "<p>Esta caixa responde se o prédio terá escadas rolantes e/ou esteiras rolantes (walkways).</p><ul><li><strong>Como preencher:</strong> escolha Sim, Não ou deixe em Confirmar utilização. Uma única resposta vale para o estudo inteiro.</li><li><strong>Onde é usado:</strong> Sim habilita a aba Escadas e esteiras rolantes e a coluna conjunta da tabela de pavimentos. Não retira esses cadastros da análise ativa, sem apagá-los.</li><li><strong>Benefício:</strong> o tráfego de escadas e esteiras entra no cálculo somente quando existe equipamento real, evitando capacidade fictícia.</li></ul><p><strong>Onde alterar:</strong> esta própria caixa. Os pavimentos atendidos são marcados em Parâmetros &gt; Pavimentos e atendimento por grupo.</p>"
  },
  'transporte.escadas': {
    title: "O prédio terá escadas e/ou esteiras rolantes?",
    html: "<p>Confirma se existe transporte vertical ou horizontal por escadas e esteiras no edifício.</p><ul><li><strong>Confirmar utilização:</strong> ainda não respondido. O cálculo não considera escadas nem esteiras.</li><li><strong>Sim:</strong> abre a configuração conjunta dos equipamentos nos pavimentos marcados.</li><li><strong>Não:</strong> conserva os cadastros já feitos, porém os retira da análise ativa.</li></ul><p><strong>Onde é usado:</strong> no resumo de transporte do relatório e na capacidade total do edifício.</p><p><strong>Onde alterar:</strong> este campo, e a marcação dos pavimentos em Pavimentos e atendimento por grupo.</p>"
  },
  'transporte.comoCalcula': {
    title: "Como o tráfego é calculado (escadas e esteiras)",
    html: "<p>Explica a relação usada para converter escadas e esteiras em capacidade de tráfego.</p><ul><li><strong>Como ler:</strong> a capacidade na janela de cálculo é a capacidade unitária (pessoas por hora) × quantidade em serviço × minutos da janela ÷ 60 × utilização.</li><li><strong>Onde é usado:</strong> no cálculo de atendimento e no relatório de escadas e esteiras.</li><li><strong>Benefício:</strong> permite conferir de onde vem o número de pessoas atendidas pelos equipamentos.</li></ul><p>Clicar aqui abre ou fecha o detalhamento; o botão \"?\" ao lado do título explica o campo.</p>"
  },
  pavimentosGrupo: {
    title: "Pavimentos e atendimento por grupo",
    html: "<p>Tabela em que cada linha é um pavimento físico e cada coluna de grupo indica quais andares cada elevador atende.</p><ul><li><strong>Como preencher:</strong> marque o andar, a distância até o pavimento imediatamente inferior e os grupos que o atendem. A linha superior é o pavimento mais alto.</li><li><strong>Acesso / Andar principal:</strong> escolha apenas um acesso; a escolha desmarca os outros e mantém os nomes de todos os andares.</li><li><strong>Onde é usado:</strong> define paradas, percurso e tráfego de cada grupo no cálculo.</li><li><strong>Benefício:</strong> evita tratar um andar como atendido por um grupo que não para nele.</li></ul><p><strong>Onde alterar:</strong> a própria tabela; o número de pavimentos vem de Configuração inicial dos grupos.</p>"
  },
  'floorTable.enabled': {
    title: "Utilizar tabela de pavimentos no cálculo",
    html: "<p>Liga ou desliga o uso da tabela de pavimentos para definir paradas e percurso dos elevadores.</p><ul><li><strong>Marcado:</strong> paradas e distâncias vêm da tabela, o cadastro por elevador passa a usá-la.</li><li><strong>Desmarcado:</strong> o cálculo usa somente a configuração inicial dos grupos.</li><li><strong>Restrição:</strong> não é possível desmarcar enquanto existir cadastro por elevador, pois ele depende da tabela.</li></ul><p><strong>Onde alterar:</strong> este próprio campo, em Parâmetros &gt; Pavimentos e atendimento por grupo.</p>"
  },
  configuracaoGrupos: {
    title: "Configuração inicial dos grupos",
    html: "<p>Define os valores iniciais de paradas, pavimentos e desnível usados para montar a tabela de pavimentos.</p><ul><li><strong>Como preencher:</strong> edite a coluna Valor. Os pavimentos são numerados de baixo para cima; o principal fica travado em 0.</li><li><strong>Seleção de células:</strong> clique, Shift+clique ou arraste com o botão direito e aplique um estado pela legenda.</li><li><strong>Onde é usado:</strong> base da tabela Pavimentos e atendimento por grupo, do percurso e da população por andar.</li><li><strong>Benefício:</strong> evita digitar a mesma informação em vários andares.</li></ul><p><strong>Onde alterar:</strong> esta tabela. Depois de mudar, confira a marcação em Pavimentos e atendimento por grupo.</p>"
  },
  'gs.groups': {
    title: "Qtde de Grupos",
    html: "<p>Quantidade de grupos (conjuntos) de elevadores do edifício. Cada grupo tem paradas e pavimentos próprios.</p><ul><li><strong>Onde é usado:</strong> Separa a análise por grupo e define as colunas da tabela de pavimentos. Permite estudar edifícios com elevadores de destinos diferentes.</li><li><strong>Onde alterar:</strong> Esta própria tela. Cada grupo é configurado depois em Dados dos Elevadores do estudo.</li></ul>"
  },
  'gs.stops': {
    title: "Numero de paradas totais",
    html: "<p>Quantidade de paradas do pavimento mais alto ao mais baixo, contando o acesso.</p><ul><li><strong>Onde é usado:</strong> Base da numeração dos pavimentos e do cálculo de paradas por grupo. Ao alterar, a tabela de Pavimentos e atendimento por grupo ganha ou perde linhas.</li><li><strong>Onde alterar:</strong> Esta tela. A tabela de pavimentos acompanha o número informado.</li></ul>"
  },
  'gs.main': {
    title: "Pavimento Principal (parada)",
    html: "<p>Número da parada que é o acesso principal do edifício. Ele fica travado como pavimento 0.</p><ul><li><strong>Onde é usado:</strong> Referência para distâncias, população do acesso e sentidos de subida e descida no cálculo.</li><li><strong>Onde alterar:</strong> Esta tela. Informe a posição, sendo 1 o pavimento mais baixo.</li></ul>"
  },
  'gs.travel': {
    title: "Percurso total (m)",
    html: "<p>Distância total entre o pavimento mais baixo e o mais alto, em metros. É a soma dos desníveis; ao informar, os desníveis ficam iguais.</p><ul><li><strong>Onde é usado:</strong> Tempo de percurso e demais cálculos de tráfego dos grupos.</li><li><strong>Onde alterar:</strong> Esta tela, ou os desníveis da coluna Desnível (m).</li></ul>"
  },
  'gs.estados': {
    title: "Estados de atendimento",
    html: "<p>Legenda para marcar, em cada célula, como um grupo atende um pavimento: Ativo (para e atende), Inativo (não para) e Expresso (passa direto).</p><ul><li><strong>Onde é usado:</strong> Define paradas e zonas de cada grupo no cálculo.</li><li><strong>Onde alterar:</strong> Esta tela: selecione as células e clique no estado desejado.</li></ul>"
  },
  'gs.selecao': {
    title: "Seleção de células",
    html: "<p>Maneira de selecionar várias células: clique, Shift+clique para um intervalo ou arraste com o botão direito.</p><ul><li><strong>Onde é usado:</strong> Aplica um mesmo estado a muitos pavimentos de uma vez. A seleção não fica salva no estudo.</li><li><strong>Onde alterar:</strong> A própria tabela.</li></ul>"
  },
  'gs.pendencias': {
    title: "Pendências",
    html: "<p>Lista o que impede o cálculo, como desníveis vazios ou paradas inconsistentes.</p><ul><li><strong>Onde é usado:</strong> Bloqueia o cálculo até todas as pendências serem resolvidas.</li><li><strong>Onde alterar:</strong> A tabela e os itens desta tela: corrija cada item listado.</li></ul>"
  },
  'gs.zonas': {
    title: "Zonas de atendimento",
    html: "<p>Agrupa os grupos que atendem as mesmas paradas. Cada zona tem paradas e percurso próprios.</p><ul><li><strong>Onde é usado:</strong> Mostra quando um grupo precisa de estudo separado. Usado na análise por zona e no relatório.</li><li><strong>Onde alterar:</strong> Os estados de atendimento da tabela desta tela.</li></ul>"
  },
  'groups.label': {
    title: "Nome do grupo",
    html: "<p>Nome que identifica o grupo no sistema, no relatório e na apresentação.</p><ul><li><strong>Onde é usado:</strong> Aparece como título do grupo nas tabelas e no relatório. Não altera o cálculo.</li><li><strong>Onde alterar:</strong> Este próprio campo.</li></ul>"
  },
  'groups.count': {
    title: "Elevadores neste conjunto",
    html: "<p>Quantidade de elevadores que atendem este grupo, de 1 a 30.</p><ul><li><strong>Onde é usado:</strong> Divide a demanda do grupo entre os elevadores; o intervalo e o tráfego são calculados por elevador.</li><li><strong>Onde alterar:</strong> Este campo. A quantidade de grupos fica na Configuração inicial dos grupos.</li></ul>"
  },
  'groups.use': {
    title: "Aplicação do edifício",
    html: "<p>Tipo de uso do edifício neste grupo, como escritórios ou residencial.</p><ul><li><strong>Onde é usado:</strong> Define os componentes de população e a demanda usados no cálculo deste grupo.</li><li><strong>Onde alterar:</strong> Este campo. Os componentes dos pavimentos atendidos ficam em Pavimentos e atendimento por grupo.</li></ul>"
  },
  'groups.travel': {
    title: "Percurso entre extremos (m)",
    html: "<p>Distância entre o pavimento mais baixo e o mais alto atendidos por este grupo.</p><ul><li><strong>Onde é usado:</strong> Tempo de viagem e tráfego do grupo. Com a tabela de pavimentos ativa, o valor vem dos desníveis cadastrados.</li><li><strong>Onde alterar:</strong> Os desníveis da Configuração inicial dos grupos ou a tabela de pavimentos.</li></ul>"
  },
  'groups.copy': {
    title: "Copiar dados do grupo",
    html: "<p>Copia as características deste grupo para outro grupo ou elevador.</p><ul><li><strong>Onde é usado:</strong> Evita digitar de novo tempos de porta e movimento iguais em grupos parecidos.</li><li><strong>Onde alterar:</strong> Este botão. O destino é escolhido na janela que abre.</li></ul>"
  },
  'populationCalc.escalators.enabled': {
    title: "Controlar atendimento por escadas rolantes",
    html: "<p>Liga o controle de atendimento por escadas rolantes na população do estudo.</p><ul><li><strong>Onde é usado:</strong> Quando marcado, a população atendida pelas escadas deixa o estudo dos elevadores e passa a ser calculada pela rede de escadas.</li><li><strong>Onde alterar:</strong> Este campo. A rede de escadas fica na aba Escadas e esteiras rolantes.</li></ul>"
  },
  'populationCalc.escalators.aboveCount': {
    title: "Pavimentos acima do acesso",
    html: "<p>Quantidade de pavimentos acima do acesso principal servidos pela rede de escadas.</p><ul><li><strong>Onde é usado:</strong> Define quantas ligações de subida entram no cálculo de capacidade.</li><li><strong>Onde alterar:</strong> Este campo; a contagem acompanha a tabela de pavimentos.</li></ul>"
  },
  'populationCalc.escalators.belowCount': {
    title: "Pavimentos abaixo do acesso",
    html: "<p>Quantidade de pavimentos abaixo do acesso principal servidos pela rede de escadas.</p><ul><li><strong>Onde é usado:</strong> Define quantas ligações de descida entram no cálculo de capacidade.</li><li><strong>Onde alterar:</strong> Este campo; a contagem acompanha a tabela de pavimentos.</li></ul>"
  },
  'populationCalc.escalators.capacityBasis': {
    title: "Base de capacidade das escadas",
    html: "<p>Escolhe a base usada para converter cada escada em pessoas por hora, conforme as opções do campo.</p><ul><li><strong>Onde é usado:</strong> Define a capacidade unitária que entra no cálculo de cada escada.</li><li><strong>Onde alterar:</strong> Este campo. Confira a base adotada no relatório.</li></ul>"
  },
  'populationCalc.escalators.demandPercent': {
    title: "População a transportar na janela (%)",
    html: "<p>Parte da população do edifício que deve usar as escadas dentro da janela de transporte.</p><ul><li><strong>Onde é usado:</strong> Multiplica a população considerada na demanda das escadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba de escadas e esteiras rolantes.</li></ul>"
  },
  'populationCalc.escalators.utilizationPercent': {
    title: "Utilização da capacidade (%)",
    html: "<p>Percentual da capacidade teórica da escada que se considera aproveitado na prática.</p><ul><li><strong>Onde é usado:</strong> Reduz a capacidade usada no cálculo; 100% considera a capacidade total.</li><li><strong>Onde alterar:</strong> Este campo, na aba de escadas e esteiras rolantes.</li></ul>"
  },
  'populationCalc.escalators.links.speedUp': {
    title: "Velocidade subida (m/s)",
    html: "<p>Velocidade da escada ou esteira no sentido de subida, em metros por segundo, de 0,01 a 2.</p><ul><li><strong>Onde é usado:</strong> Calcula o tempo de viagem e a capacidade do trecho na subida.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.speedDown': {
    title: "Velocidade descida (m/s)",
    html: "<p>Velocidade da escada ou esteira no sentido de descida, em metros por segundo, de 0,01 a 2.</p><ul><li><strong>Onde é usado:</strong> Calcula o tempo de viagem e a capacidade do trecho na descida.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'groups.speed': {
    title: "Velocidade nominal (m/s)",
    html: "<p>Velocidade nominal do elevador em metros por segundo. Pode ser escolhida na lista de valores comuns ou digitada.</p><ul><li><strong>Onde é usado:</strong> Define o tempo de viagem e, com aceleração e jerk, a duração de cada percurso no cálculo.</li><li><strong>Onde alterar:</strong> Este campo. A lista de velocidades comuns fica ao lado dele.</li></ul>"
  },
  'motion.acceleration': {
    title: "Aceleração (m/s²)",
    html: "<p>Aceleração do elevador na partida e na parada, em metros por segundo ao quadrado.</p><ul><li><strong>Onde é usado:</strong> Afeta o tempo de viagem. Acelerações acima de 1,00 m/s² podem causar desconforto, conforme a própria tela informa.</li><li><strong>Onde alterar:</strong> Este campo; os valores de referência ficam na seção de premissas de movimento.</li></ul>"
  },
  'motion.jerk': {
    title: "Jerk (m/s³)",
    html: "<p>Variação da aceleração ao longo do tempo, em metros por segundo ao cubo. Está ligado ao conforto na partida e na parada.</p><ul><li><strong>Onde é usado:</strong> Compõe o tempo de aceleração e de retardamento do percurso.</li><li><strong>Onde alterar:</strong> Este campo; os valores de referência ficam na seção de premissas de movimento.</li></ul>"
  },
  'populationCalc.escalators.links.capacityUpHourly': {
    title: "Capacidade subida (PSH)",
    html: "<p>Capacidade unitária da escada no sentido de subida, em pessoas por hora.</p><ul><li><strong>Onde é usado:</strong> Multiplicada pela quantidade em serviço e pela utilização, compõe a capacidade do trecho na subida.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.capacityDownHourly': {
    title: "Capacidade descida (PSH)",
    html: "<p>Capacidade unitária da escada no sentido de descida, em pessoas por hora.</p><ul><li><strong>Onde é usado:</strong> Compõe a capacidade do trecho na descida no cálculo de tráfego.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.incline': {
    title: "Inclinação (°)",
    html: "<p>Ângulo de inclinação da escada ou esteira, em graus.</p><ul><li><strong>Onde é usado:</strong> Usado para verificar o trecho e a distância percorrida pela escada.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.rise': {
    title: "Desnível (m)",
    html: "<p>Diferença de altura vencida pelo trecho da escada, em metros.</p><ul><li><strong>Onde é usado:</strong> Compõe a distância entre os pavimentos atendidos pela escada.</li><li><strong>Onde alterar:</strong> Este campo. O desnível também segue a tabela de pavimentos.</li></ul>"
  },
  'populationCalc.escalators.links.widthUp': {
    title: "Largura subida (mm)",
    html: "<p>Largura útil da escada ou esteira no sentido de subida, em milímetros.</p><ul><li><strong>Onde é usado:</strong> Define a capacidade do degrau na subida, conforme a tabela de referência.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.widthDown': {
    title: "Largura descida (mm)",
    html: "<p>Largura útil da escada ou esteira no sentido de descida, em milímetros.</p><ul><li><strong>Onde é usado:</strong> Define a capacidade do degrau na descida, conforme a tabela de referência.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.upPresent': {
    title: "Escada para subir",
    html: "<p>Marca se existe escada ou esteira no sentido de subida neste trecho.</p><ul><li><strong>Onde é usado:</strong> Quando marcado, a capacidade de subida entra no cálculo deste trecho.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.downPresent': {
    title: "Escada para descer",
    html: "<p>Marca se existe escada ou esteira no sentido de descida neste trecho.</p><ul><li><strong>Onde é usado:</strong> Quando marcado, a capacidade de descida entra no cálculo deste trecho.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'populationCalc.escalators.links.served': {
    title: "Trecho servido",
    html: "<p>Marca se este trecho de escadas está em serviço no cálculo.</p><ul><li><strong>Onde é usado:</strong> Trechos não marcados não contam capacidade nem população atendida.</li><li><strong>Onde alterar:</strong> Este campo, no trecho correspondente da rede de escadas.</li></ul>"
  },
  'car.capacity': {
    title: "Capacidade (pessoas)",
    html: "<p>Número máximo de pessoas que o elevador transporta por viagem.</p><ul><li><strong>Onde é usado:</strong> Base do tráfego: alimenta as paradas prováveis e a massa estimada.</li><li><strong>Onde alterar:</strong> Esta tabela, na linha Capacidade. Confira a carga nominal de placa do fabricante.</li></ul>"
  },
  'car.personMassKg': {
    title: "Massa adotada por pessoa (kg/pessoa)",
    html: "<p>Massa média considerada para cada pessoa, em quilogramas.</p><ul><li><strong>Onde é usado:</strong> Multiplica a capacidade para estimar a carga em kg e a potência dos equipamentos de energia.</li><li><strong>Onde alterar:</strong> Esta tabela, na linha de massa. Os valores sugeridos aparecem na lista do campo.</li></ul>"
  },
  'car.capacityKg': {
    title: "Capacidade estimada em kg",
    html: "<p>Carga estimada = capacidade × massa por pessoa. É um cálculo, não se edita.</p><ul><li><strong>Onde é usado:</strong> Referência de carga; não substitui a carga nominal de placa do fabricante.</li><li><strong>Onde alterar:</strong> Altere a capacidade ou a massa por pessoa, nas linhas acima.</li></ul>"
  },
  'car.speed': {
    title: "Velocidade (m/s)",
    html: "<p>Velocidade nominal do elevador, em metros por segundo.</p><ul><li><strong>Onde é usado:</strong> Define o tempo de viagem e a potência estimada do equipamento.</li><li><strong>Onde alterar:</strong> Esta tabela, na linha Velocidade. A lista mostra valores comuns.</li></ul>"
  },
  'car.speedMpm': {
    title: "Velocidade (m/min)",
    html: "<p>Mesma velocidade em metros por minuto. É um cálculo (m/s × 60).</p><ul><li><strong>Onde é usado:</strong> Facilita a conferência com catálogos que informam em m/min.</li><li><strong>Onde alterar:</strong> Altere a velocidade em m/s, na linha acima.</li></ul>"
  },
  'car.width': {
    title: "Abertura livre da porta (mm)",
    html: "<p>Largura livre da abertura da porta da cabina, em milímetros.</p><ul><li><strong>Onde é usado:</strong> Entra na capacidade de entrada e saída de passageiros do elevador.</li><li><strong>Onde alterar:</strong> Esta tabela, na linha Abertura livre da porta.</li></ul>"
  },
  'car.door': {
    title: "Tipo de porta",
    html: "<p>Tipo de porta da cabina: central, lateral ou vertical.</p><ul><li><strong>Onde é usado:</strong> Define o tempo padrão de abertura e fechamento usado no cálculo.</li><li><strong>Onde alterar:</strong> Esta tabela, na linha Tipo de porta.</li></ul>"
  },
  'car.probableStops': {
    title: "Paradas prováveis",
    html: "<p>Estimativa de quantas paradas o elevador faz numa viagem típica.</p><ul><li><strong>Onde é usado:</strong> Calculada a partir de capacidade e pavimentos atendidos; serve para conferir o cálculo.</li><li><strong>Onde alterar:</strong> Não se edita. Altere a capacidade ou os pavimentos atendidos.</li></ul>"
  },
  'car.doorTimes': {
    title: "Tempos de abertura e fechamento de portas",
    html: "<p>Tempo padrão de abertura e fechamento da porta, em segundos, conforme o tipo de porta.</p><ul><li><strong>Onde é usado:</strong> Soma ao tempo de viagem de cada parada no cálculo.</li><li><strong>Onde alterar:</strong> Não se edita. Altere o tipo de porta na linha correspondente.</li></ul>"
  },
  'car.accelerationTime': {
    title: "Tempo de aceleração e retardamento",
    html: "<p>Tempo estimado para acelerar e frear, em segundos, a partir da velocidade.</p><ul><li><strong>Onde é usado:</strong> Entra no tempo de viagem de cada parada.</li><li><strong>Onde alterar:</strong> Não se edita. Altere a velocidade na linha correspondente.</li></ul>"
  },
  'car.stops': {
    title: "Paradas (incluindo acesso)",
    html: "<p>Número de paradas que o elevador atende, contando o acesso.</p><ul><li><strong>Onde é usado:</strong> Vem dos pavimentos marcados para o elevador na tabela.</li><li><strong>Onde alterar:</strong> Esta tabela: marque os pavimentos atendidos na coluna do elevador.</li></ul>"
  },
  'populationCalc.escalators.periodMinutes': {
    title: "Janela de transporte (min)",
    html: "<p>Período, em minutos, em que a população atendida pelas escadas e esteiras precisa ser transportada.</p><ul><li><strong>Como preencher:</strong> informe a janela de pico que o estudo quer avaliar. O valor inicial do sistema é 5 minutos.</li><li><strong>Onde é usado:</strong> converte a população da janela em demanda por minuto, que é comparada com a capacidade das escadas e esteiras.</li><li><strong>Onde alterar:</strong> Este campo, na aba Escadas e esteiras rolantes (também usado pelas esteiras).</li></ul>"
  },
  'supplyCondition.type': {
    title: "Condição de fornecimento",
    html: "<p>Informa se a instalação é obra nova, retrofit ou substituição total.</p><ul><li><strong>Como preencher:</strong> escolha a condição real da obra. Obra nova exige as faixas mínima e máxima para a proposta; retrofit e substituição total exigem o levantamento das dimensões existentes.</li><li><strong>Onde é usado:</strong> define quais campos de dimensões aparecem na aba Parâmetros dimensionais e se o cálculo valida o levantamento existente.</li><li><strong>Onde alterar:</strong> Este campo, na página Parâmetros de cálculo, acima das abas.</li></ul>"
  },
  'groups.siteDimensions.shaftWidth': {
    title: "Frente da caixa (mm)",
    html: "<p>Medida da frente da caixa do poço, levantada no local.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Comparada com a faixa de frente mínima e máxima que o fornecedor declara para o produto (retrofit e substituição total). Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.shaftDepth': {
    title: "Lado / profundidade da caixa (mm)",
    html: "<p>Medida do lado (profundidade) da caixa do poço, levantada no local.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Comparada com a faixa de lado mínimo e máximo declarada pelo fornecedor (retrofit e substituição total). Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.headroom': {
    title: "Última altura disponível (mm)",
    html: "<p>Altura livre acima do último pavimento atendido até a laje ou obstáculo superior.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Comparada com a faixa de última altura mínima e máxima do fornecedor (retrofit e substituição total). Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.pit': {
    title: "Profundidade do poço (mm)",
    html: "<p>Profundidade do poço abaixo do último pavimento inferior. Pode ficar em 0 quando não há poço.</p><ul><li><strong>Como preencher:</strong> Use milímetros; 0 quando não houver poço.</li><li><strong>Onde é usado:</strong> Comparada com a faixa de poço mínimo e máximo do fornecedor (retrofit e substituição total). Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.cabinWidth': {
    title: "Frente interna da cabina existente (mm)",
    html: "<p>Medida interna da frente da cabina atual, levantada no local.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Usada no levantamento de campo para conferir a cabina existente. Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.cabinDepth': {
    title: "Lado interno da cabina existente (mm)",
    html: "<p>Medida interna do lado da cabina atual, levantada no local.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Usada no levantamento de campo para conferir a cabina existente. Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.cabinHeight': {
    title: "Altura interna da cabina existente (mm)",
    html: "<p>Altura interna da cabina atual, levantada no local.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Usada no levantamento de campo para conferir a cabina existente. Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.doorWidth': {
    title: "Abertura livre da porta existente (mm)",
    html: "<p>Largura livre da abertura da porta da cabina atual, levantada no local.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Usada no levantamento de campo para conferir a porta existente. Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.doorHeight': {
    title: "Altura livre da porta existente (mm)",
    html: "<p>Altura livre da abertura da porta da cabina atual, levantada no local.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Usada no levantamento de campo para conferir a porta existente. Diferenças acima de 0,5 mm em relação ao levantamento de campo do fornecedor são sinalizadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.doorType': {
    title: "Tipo de porta existente",
    html: "<p>Tipo da porta da cabina atual (por exemplo, automática ou manual, conforme as opções do campo).</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Campo obrigatório para validar o levantamento existente e para orientar a porta a ser fornecida.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  'groups.siteDimensions.doorCount': {
    title: "Quantidade de portas da cabina existente",
    html: "<p>Número de portas da cabina atual, de 1 a 4.</p><ul><li><strong>Como preencher:</strong> Use milímetros, com o valor medido no local.</li><li><strong>Onde é usado:</strong> Campo obrigatório para validar o levantamento existente e para conferir a porta informada.</li><li><strong>Onde alterar:</strong> Este campo, na aba Parâmetros dimensionais, no bloco do grupo e do elevador correspondente.</li></ul>"
  },
  "populationCalc.rows.heading": {
    title: "Composição (posição, andar e tipo de uso)",
    html: "<p>Resume a posição, o andar servido e o tipo de uso desta composição.</p><ul><li><strong>Como preencher:</strong> confira o valor com a composição real.</li><li><strong>Onde é usado:</strong> Mostra se a composição é de estudo separado ou de uso exclusivo, além da posição e do andar atendido. Ajuda a conferir a composição antes do cálculo.</li><li><strong>Onde alterar:</strong> A posição em \"Posição da composição no estudo\" e o andar atendido nos botões de andar da lista de composições.</li></ul>"
  },
  "populationCalc.rows.autoName": {
    title: "Nome da composição (automático)",
    html: "<p>Nome gerado pelo andar servido. Não é editável.</p><ul><li><strong>Como preencher:</strong> confira o valor com a composição real.</li><li><strong>Onde é usado:</strong> Identifica a composição no painel e nas listas. O ambiente informado em \"Indicação do ambiente\" aparece separado.</li><li><strong>Onde alterar:</strong> O andar servido, pelos botões de andar da lista de composições.</li></ul>"
  },
  "populationCalc.rows.label": {
    title: "Indicação do ambiente",
    html: "<p>Descreve o ambiente atendido por esta composição, por exemplo, \"Andar 2 · ambiente a preencher\".</p><ul><li><strong>Como preencher:</strong> confira o valor com a composição real.</li><li><strong>Onde é usado:</strong> Aparece no resumo do painel da composição, ao lado do valor calculado. Não altera o nome automático nem o andar servido.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "populationCalc.rows.floorMark": {
    title: "Posição da composição no estudo",
    html: "<p>Identifica a composição no estudo, com até 2 caracteres.</p><ul><li><strong>Como preencher:</strong> confira o valor com a composição real.</li><li><strong>Onde é usado:</strong> Define a ordem e a identificação da composição na lista (\"Composição N · posição X\").</li><li><strong>Onde alterar:</strong> Este campo. Ao alterar a posição, as posições seguintes são renumeradas; os andares atendidos não mudam.</li></ul>"
  },
  "populationCalc.rows.exclusion": {
    title: "Outras exclusões da população",
    html: "<p>Escolhe uma exclusão de população para esta composição, quando a regra do estudo permitir.</p><ul><li><strong>Como preencher:</strong> marque ou desmarque conforme a regra do estudo.</li><li><strong>Onde é usado:</strong> Remove a população desta composição do cálculo do andar. Para garagens e restaurantes de apoio, a exclusão vem da opção Uso exclusivo em Destinação da população.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "populationCalc.rows.notes": {
    title: "Observações e justificativas",
    html: "<p>Registra a justificativa das condições de descontos e exclusões desta composição.</p><ul><li><strong>Como preencher:</strong> confira o valor com a composição real.</li><li><strong>Onde é usado:</strong> Fica registrado junto da composição no estudo, para explicar a população adotada.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "populationCalc.rows.skipPopulation": {
    title: "Não calcular população para este pavimento",
    html: "<p>Marca o pavimento para não contar população no cálculo.</p><ul><li><strong>Como preencher:</strong> marque ou desmarque conforme a regra do estudo.</li><li><strong>Onde é usado:</strong> A população deste pavimento deixa de entrar no total do andar e do estudo. As coletas de dados deste pavimento são removidas; ao desmarcar, elas precisam ser informadas novamente.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "energy.enabled": {
    title: "Exibir comparação energética",
    html: "<p>Liga ou desliga a comparação de consumo de energia entre a tecnologia existente e a proposta.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Quando marcado como Sim, o relatório mostra a comparação energética. Não altera o cálculo de tráfego.</li><li><strong>Onde alterar:</strong> Este campo, na aba de análise energética.</li></ul>"
  },
  "energy.tariff": {
    title: "Tarifa elétrica (R$/kWh)",
    html: "<p>Valor cobrado por kWh no projeto, usado para estimar o custo mensal e anual de energia.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Multiplica o consumo estimado para calcular os custos. Com 0, os custos monetários não são calculados.</li><li><strong>Onde alterar:</strong> Este campo, na aba de análise energética.</li></ul>"
  },
  "energy.daysPerYear": {
    title: "Dias de operação por ano",
    html: "<p>Quantidade de dias por ano em que os elevadores operam.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Multiplica o consumo diário para estimar o consumo anual de energia.</li><li><strong>Onde alterar:</strong> Este campo, na aba de análise energética.</li></ul>"
  },
  "energy.hoursPowered": {
    title: "Horas energizadas por dia",
    html: "<p>Horas por dia em que os elevadores ficam energizados.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Define o período de consumo considerado. Consumo fora deste horário não entra no cálculo.</li><li><strong>Onde alterar:</strong> Este campo, na aba de análise energética.</li></ul>"
  },
  "energy.notes": {
    title: "Justificativa e fronteira energética",
    html: "<p>Registra o que está incluído e o que ficou fora do cálculo de energia.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Fica registrado no relatório junto da comparação energética, para explicar as premissas usadas.</li><li><strong>Onde alterar:</strong> Este campo, na aba de análise energética.</li></ul>"
  },
  "operation.profileVersion": {
    title: "Origem do perfil",
    html: "<p>Indica de onde vem o perfil de tráfego usado na operação.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Tabela enviada pelo proprietário usa os valores informados por ele. Perfil anterior preserva o estudo já calculado, sem recalcular os valores.</li><li><strong>Onde alterar:</strong> Este campo, na aba de operação do estudo.</li></ul>"
  },
  "operation.profileUnit": {
    title: "Unidade dos valores da tabela",
    html: "<p>Informa como os valores da tabela de contagem devem ser lidos.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Percentual da população por bloco trata cada valor como parte da população. Pessoas estimadas por bloco trata cada valor como quantidade de pessoas.</li><li><strong>Onde alterar:</strong> Este campo, na tabela de medição da operação.</li></ul>"
  },
  "operation.basis": {
    title: "Capacidade usada na operação",
    html: "<p>Escolhe a base de tempos usada para calcular a capacidade dos elevadores na operação.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Tempos do fabricante usam os tempos informados pelo fabricante. Tempos da NBR 5665 usam os tempos normativos.</li><li><strong>Onde alterar:</strong> Este campo, na aba de operação do estudo.</li></ul>"
  },
  "operation.entryStart": {
    title: "Início do período de entrada",
    html: "<p>Horário em que começa o período de entrada no prédio.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Organiza o período de entrada no perfil de tráfego do dia.</li><li><strong>Onde alterar:</strong> Este campo, na aba de operação do estudo.</li></ul>"
  },
  "operation.lunchStart": {
    title: "Início do período de almoço",
    html: "<p>Horário em que começa o período de almoço.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Organiza o período de almoço no perfil de tráfego do dia. Deve ficar dentro do expediente.</li><li><strong>Onde alterar:</strong> Este campo, na aba de operação do estudo e no expediente.</li></ul>"
  },
  "operation.exitStart": {
    title: "Início do período de saída",
    html: "<p>Horário em que começa o período de saída do prédio.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Organiza o período de saída no perfil de tráfego do dia.</li><li><strong>Onde alterar:</strong> Este campo, na aba de operação do estudo.</li></ul>"
  },
  "operation.measurementBlocks": {
    title: "Janela por período",
    html: "<p>Tamanho de cada bloco da contagem, em blocos de 5 minutos.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Define quantos blocos formam a tabela de medição. Por exemplo, 12 blocos equivalem a 1 hora.</li><li><strong>Onde alterar:</strong> Este campo, na tabela de medição da operação.</li></ul>"
  },
  "operation.measurementDate": {
    title: "Data da medição",
    html: "<p>Data em que a contagem de pessoas foi feita.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Fica registrada no relatório, para identificar a medição usada no perfil.</li><li><strong>Onde alterar:</strong> Este campo, na tabela de medição da operação.</li></ul>"
  },
  "operation.observer": {
    title: "Responsável pela contagem",
    html: "<p>Nome de quem fez a contagem de pessoas.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Fica registrado no relatório, para identificar quem fez a medição.</li><li><strong>Onde alterar:</strong> Este campo, na tabela de medição da operação.</li></ul>"
  },
  "operation.measurementNotes": {
    title: "Local, método e observações",
    html: "<p>Descreve onde, como e em que condições a contagem foi feita.</p><ul><li><strong>Como preencher:</strong> informe o valor real do projeto ou da medição.</li><li><strong>Onde é usado:</strong> Fica registrado no relatório junto da medição, para explicar os dados usados.</li><li><strong>Onde alterar:</strong> Este campo, na tabela de medição da operação.</li></ul>"
  },
  "populationCalc.rows.servedFloorMark": {
    title: "Andar servido pela composição",
    html: "<p>Andar da tabela de pavimentos onde fica o ambiente desta composição.</p><ul><li><strong>Como preencher:</strong> informe o valor real do ambiente, conforme o projeto.</li><li><strong>Onde é usado:</strong> Define o nível e a distância usados no cálculo. Ambientes do mesmo andar são somados.</li><li><strong>Onde alterar:</strong> Este campo; a lista de andares é definida na tabela de pavimentos.</li></ul>"
  },
  "populationCalc.rows.kind": {
    title: "Componente de população",
    html: "<p>Tipo de ambiente que define como a população é calculada.</p><ul><li><strong>Como preencher:</strong> informe o valor real do ambiente, conforme o projeto.</li><li><strong>Onde é usado:</strong> Escolhe a regra de ocupação aplicada à área ou à quantidade informada na composição.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "populationCalc.rows.amount": {
    title: "Área ou quantidade do ambiente",
    html: "<p>Medida usada pela regra de ocupação do componente escolhido: área em m² ou quantidade de unidades.</p><ul><li><strong>Como preencher:</strong> informe o valor real do ambiente, conforme o projeto.</li><li><strong>Onde é usado:</strong> Multiplicada pela taxa de ocupação do componente para estimar a população. Para salas, por exemplo, 1 pessoa a cada 7 m².</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "populationCalc.rows.repeat": {
    title: "Repetições no mesmo pavimento",
    html: "<p>Quantidade de ambientes iguais neste mesmo pavimento.</p><ul><li><strong>Como preencher:</strong> informe o valor real do ambiente, conforme o projeto.</li><li><strong>Onde é usado:</strong> Multiplica a população desta composição. Para outros pavimentos, adicione outra composição.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "populationCalc.rows.distance": {
    title: "Percurso até o pavimento de acesso (m)",
    html: "<p>Distância vertical entre este pavimento e o pavimento de acesso.</p><ul><li><strong>Como preencher:</strong> informe o valor real do ambiente, conforme o projeto.</li><li><strong>Onde é usado:</strong> Aplica o desconto de 50% da NBR 5665, item 5.1.2, quando o pavimento é o imediatamente acima ou abaixo do acesso, a até 3 m.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição; a distância vem da tabela de pavimentos.</li></ul>"
  },
  "populationCalc.rows.reduction15": {
    title: "Desconto populacional de 15%",
    html: "<p>Aplica o desconto de 15% sobre a população desta composição.</p><ul><li><strong>Como preencher:</strong> informe o valor real do ambiente, conforme o projeto.</li><li><strong>Onde é usado:</strong> Para sala corrida que ocupa todo o pavimento, ou sala com área de 200 m² ou mais. Para área menor que 200 m², marque somente se a sala ocupar o pavimento inteiro (NBR 5665, item 5.1.5).</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  "populationCalc.rows.declaredPopulation": {
    title: "População declarada do ambiente (pessoas)",
    html: "<p>População informada pelo responsável para este ambiente. Use 0 quando não houver declaração.</p><ul><li><strong>Como preencher:</strong> informe o valor real do ambiente, conforme o projeto.</li><li><strong>Onde é usado:</strong> Se preenchida, é comparada com a população calculada do ambiente. Se for maior, a declaração é adotada antes da verificação das escadas.</li><li><strong>Onde alterar:</strong> Este campo, dentro do painel da composição.</li></ul>"
  },
  performanceFabricante: {
    title: "Performance calculada pelo fabricante",
    html: "<p>Tabela em que o fabricante informa a performance que ele calculou para este projeto, por chamada convencional e com ADS-Antecipador de Destino.</p><ul><li><strong>Como preencher:</strong> informe, em cada coluna, a população atendida em 5 min, as paradas prováveis (mínima e máxima), o tempo estimado de espera e de chegada ao destino, em segundos, e o percentual da população atendida em cada limite de tempo (0 a 100). Deixe em branco o que não foi calculado.</li><li><strong>Onde é usado:</strong> o contratante compara estes valores com o cálculo do sistema SilSec. As diferenças aparecem destacadas na tabela \"Fabricante × cálculo do sistema SilSec\".</li><li><strong>Onde alterar:</strong> nesta tabela, dentro da proposta do fabricante. Depois de salva pelo fabricante, somente a empresa dele pode alterar. Salve a proposta para registrar.</li></ul>"
  },
  comparativoFabricante: {
    title: "Fabricante × cálculo do sistema SilSec",
    html: "<p>Compara a performance informada pelo fabricante com a calculada pelo sistema SilSec, por chamada convencional e com ADS-Antecipador de Destino. Há uma tabela para cada fabricante.</p><ul><li><strong>Como preencher:</strong> não há campo a preencher. A coluna Fabricante vem da proposta; a coluna Sistema SilSec é calculada com os dados de equipamento dessa proposta.</li><li><strong>Onde é usado:</strong> mostra onde os números do fabricante se afastam do cálculo. Amarelo (atenção): diferença acima de 5 até 10. Vermelho (divergência): diferença acima de 10. Nas linhas em %, a diferença é em pontos percentuais; nas demais, em % sobre o valor do sistema.</li><li><strong>Onde alterar:</strong> os valores do fabricante são alterados pelo próprio fabricante, na proposta dele. O cálculo do sistema muda com os dados da proposta e do estudo-base. Somente o responsável e o contratante veem esta tabela.</li></ul>"
  },
  "newCar.source": {
    title: "Copiar os dados do elevador",
    html: "<p>Unidade do mesmo grupo que serve de modelo para a nova unidade.</p><ul><li><strong>Como preencher:</strong> escolha o elevador de origem. O sistema já sugere a unidade ao lado da nova. Depois clique em \"Copiar a unidade selecionada\".</li><li><strong>Onde é usado:</strong> a nova unidade recebe as características (capacidade, massa por pessoa, velocidade e porta), os tempos e o movimento do fabricante, a referência dimensional e os pavimentos atendidos da unidade escolhida.</li><li><strong>Onde alterar:</strong> depois da cópia, cada dado pode ser alterado na coluna da nova unidade, em Parâmetros de cálculo. Para copiar de novo, use \"Copiar unidade\" no cabeçalho da coluna.</li></ul>"
  },
  comparativoAds: {
    title: "Comparativo de cálculo do sistema SilSec · chamada convencional × ADS-Antecipador de Destino",
    html: "<p>Compara, com a mesma população, o funcionamento por chamada convencional e com ADS-Antecipador de Destino, em um pico de subida de 5 min a partir do pavimento principal.</p><ul><li><strong>Como preencher:</strong> não há campo a preencher. A tabela é calculada depois de \"Calcular estudo completo\".</li><li><strong>Onde é usado:</strong> mostra a população a transportar, a capacidade dos elevadores, os passageiros transportados, as paradas prováveis e os tempos de espera e de chegada ao destino, nos dois sistemas.</li><li><strong>Onde alterar:</strong> a quantidade de setores vem de \"Setores de destino\", no painel Antecipação de destino. Os demais dados vêm de Parâmetros de cálculo (elevadores e pavimentos) e de Cálculo populacional.</li></ul><p><strong>O que cada linha mostra</strong></p><ul><li><strong>População a transportar em 5 min:</strong> demanda da norma no pico: população do estudo × percentual de tráfego em 5 min. É igual nos dois sistemas.</li><li><strong>População atendida em 5 min · capacidade dos elevadores:</strong> capacidade de transporte dos elevadores em 5 min (ciclo da NBR 5665 no convencional; ciclo estimado por setores no ADS). Não é limitada à população do prédio: pode ser maior que a população a transportar. Em vermelho com \"não atende\" quando a capacidade é menor que a população a transportar.</li><li><strong>População atendida por hora · capacidade dos elevadores:</strong> a linha anterior multiplicada por 12 (doze períodos de 5 min em uma hora).</li><li><strong>Folga da capacidade sobre a população de 5 min (%):</strong> quanto a capacidade passa da população a transportar. Valor negativo indica que falta capacidade.</li><li><strong>Chegada de passageiros · um a cada (s):</strong> a população não chega em bloco: chega diluída ao longo dos 5 min. Esta linha mostra o intervalo entre um passageiro e o seguinte.</li><li><strong>Viagens a partir do pavimento principal em 5 min:</strong> quantas partidas com passageiros os elevadores fizeram do pavimento principal dentro dos 5 min simulados.</li><li><strong>Passageiros por viagem · média:</strong> média de passageiros levados em cada uma dessas partidas.</li><li><strong>Passageiros transportados em 5 min:</strong> quantos passageiros embarcaram dentro dos 5 min na simulação. A simulação conta pessoas inteiras. Quem chega nos últimos segundos embarca na viagem seguinte.</li><li><strong>Transportados em 5 min (%):</strong> a linha anterior em percentual da população simulada.</li><li><strong>Paradas prováveis · mínima e máxima:</strong> número provável de paradas por viagem, pela fórmula do modelo do estudo. Com mais de um grupo de elevadores, mostra o menor e o maior valor entre os grupos. No ADS as paradas diminuem porque cada viagem atende um setor de andares.</li><li><strong>Tempo de espera no pavimento principal · Tempo estimado (s):</strong> tempo médio, por passageiro, entre chegar ao pavimento principal e embarcar. Não é o intervalo entre partidas.</li><li><strong>Tempo de espera · Em até 30, 60 e 90 s (%):</strong> percentual da população que embarcou em até cada limite de tempo. A linha de 90 s fica em vermelho quando está abaixo de 100%.</li><li><strong>Tempo de chegada ao destino · Tempo estimado (s):</strong> tempo médio, por passageiro, entre chegar ao pavimento principal e desembarcar no andar de destino (espera + viagem).</li><li><strong>Tempo de chegada · Em até 90, 120 e 180 s (%):</strong> percentual da população que chegou ao destino em até cada limite de tempo. A linha de 180 s fica em vermelho quando está abaixo de 100%.</li></ul><p>As quatro primeiras linhas vêm do cálculo do estudo (norma). As demais vêm de uma simulação do mesmo pico de 5 min. Comparativo de projeto: não substitui a simulação do fabricante.</p>"
  }
};

export function contextHelpButton(key) {
  key = String(key).replace(/\.\d+\./g, '.');
  const h = CONTEXT_HELP[key];
  return h ? `<button type="button" class="context-help" data-action="context-help" data-help="${key}" aria-label="Ajuda: ${h.title}" title="Ajuda">?</button>` : '';
}

export function contextHelpHeading(key, text) {
  return `<div class="context-heading"><h2>${text}</h2>${contextHelpButton(key)}</div>`;
}

export function openContextHelp(key) {
  const h = CONTEXT_HELP[key];
  if (!h) return;
  let dialog = document.getElementById('context-help-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'context-help-dialog';
    dialog.className = 'context-help-dialog';
    dialog.innerHTML = '<div class="context-help-body"></div><button type="button" class="btn context-help-close" data-context-help-close>Fechar</button>';
    dialog.addEventListener('click', e => { if (e.target === dialog || e.target.closest('[data-context-help-close]')) dialog.close(); });
    document.body.appendChild(dialog);
  }
  dialog.querySelector('.context-help-body').innerHTML = `<h3>${h.title}</h3>${h.html}`;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
}
