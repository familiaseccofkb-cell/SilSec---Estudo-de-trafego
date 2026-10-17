# SilSec · Estudos de tráfego

Protótipo privado com dados por usuário no servidor, acesso restrito ao proprietário via Sites. Sem cobrança real, cadastro público ou integrações de pagamentos. Não alterar a audiência sem autorização do proprietário.

## Uso

Use as cinco telas Cadastro, Parâmetros de cálculo, Cálculo populacional, Gráficos de performance e economias e Cálculo de tráfego. O estudo inicial usa 396 pessoas e três elevadores em dois grupos. O motor NBR é preferencial e o modelo ISO do documento fornecido é independente. Precisão integral de interpolação é o único critério de arredondamento intermediário.

### Versão 9.1

Aplicação por grupo nos dois módulos; precisão integral mantida sem seletor. Paradas no Avançado são somente leitura, derivadas da matriz. Tempos e movimento por elevador: cópia de unidade completa ou somente tempos para destinos selecionados, origem inibida, preenchimento automático com proveniência, edição em 0,01 s, pré-abertura e avisos de portas/PPH individuais.

`transferMode: per-stop` usa `transferPerStop` em segundos/parada: FAB NBR T4 = N × transferência; ISO personalizado usa (S+1) × transferência. Sem o marcador, mantém a base histórica por pessoa, convertida somente para exibição. Tempo adicional de partida permanece uma vez/ciclo FAB ou tsd/parada ISO. Tabelas normativas não são substituídas. O catálogo/estudo de proposta aplica seus próprios tempos, sem carregar overrides ocultos das unidades do estudo-base.

Área da cabina existente por frente × lado em metros, comparada à tabela do usuário. Limites inclusivos; capacidades não tabeladas sem interpolação. Duas faixas conflitantes para 44 pessoas preservadas e pendentes, sem conclusão de conformidade.

Verificação: 455 testes aprovados (motor, eventos da interface por adaptador DOM, API, relatórios, permissões e regressões da planilha). Sem revisão visual em navegador nesta entrega. Migração de banco não necessária; campos adicionais ficam nos documentos JSON existentes. Privacidade e cobrança permanecem iguais.

### Versão 9.0

Dois módulos: Básico com formulário NBR 5665 (1–20 grupos, população declarada e cálculo normativo por coluna); Avançado preserva a aplicação anterior. Preços demonstrativos R$15/R$25 mensais; R$162/R$270 anuais. Licenças por usuário em D1: concessões, chaves temporárias vinculadas, aquisição demonstrativa com CPF validado e único, teste Avançado de 30 dias na primeira aquisição Básica e educação por seis meses após revisão documental. Sem provedor de cobrança. Administradores têm módulos por perfil; convidados fornecedor/cliente colaboram sob a licença do responsável, com permissões de projeto preservadas.

Migração `0002` somente aditiva: tabelas de licenças/solicitações/identidade e colunas opcionais de snapshot/arquivo. Não altera registros reais por seed/backfill. Uma aquisição requer decisão explícita do administrador; nenhum pagamento é realizado. Educação exige documento em R2 e aprovação humana. Vencimento é conferido no servidor e não depende de tarefa agendada.

Resultados de cálculo salvos são congelados em `calculation_snapshot`. HTML completo, incluindo gráficos e estilo, é arquivado em R2 após salvar o cálculo; revisão e hash entram em auditoria. Após vencimento, o endpoint de projeto devolve somente estado bloqueado e disponibilidade do último relatório. O arquivo só é servido com autenticação e permissão, em documento isolado com CSP sem scripts/rede/formulários, inclusive no download. Fornecedor não acessa o arquivo geral. Rascunho posterior não apaga relatório anterior. Estudos anteriores sem arquivo precisam ser calculados/salvos uma vez com acesso ativo.

Validações: medição apenas no modo real e nos blocos ativos; percentuais legados só quando usados; consumo desativado e rede desativada preservam entradas sem bloquear; partidas manuais não são exigidas na base PPH. Energia por PPH sem distribuição de demanda informa indisponibilidade, sem usar manual silenciosamente. Fórmulas NBR/ISO preservadas.

A produção comercial ainda depende de pagamento, conciliação e verificação de identidade externa. Não há checkout público. Autorizações de equipe e audiência da hospedagem são controles distintos da licença.

### Versão 8.9

Confirmação única `transportEquipment.rolling` para escadas e/ou esteiras. Campos antigos são conservados para compatibilidade; a interpretação conjunta reconhece a presença de qualquer tipo sem alterar cadastros ao ler. A edição intencional da confirmação/matriz grava a escolha conjunta. Uma única aba identifica `kind` de cada conjunto (`escalator` ou `walkway`). O módulo `transport-capacity.js` fornece a relação comum de capacidade na janela; tipo não altera a relação. Tabela enviada aplicada às esteiras é premissa do usuário, não nova equivalência normativa.

Esteiras locais/horizontais conservam os registros anteriores e usam a mesma janela, demanda e utilização, com população opcional para comparar demanda e capacidade. Sem população, a conclusão de atendimento fica pendente. Uma ligação horizontal isolada não dá crédito populacional a andares. `rollingTransport` guarda seus resultados no cálculo completo; relatório e PPTX apresentam os tipos e resultados. Sem mudança de esquema D1, audiência ou dados reais.

### Versão 8.5.1

Verificação em 15/10/2026: 385 testes passaram. Sem revisão visual em navegador.

Seleção de escadas preenche o caminho físico inteiro do acesso ao destino; a remoção muda somente o flag solicitado. O acesso agora pode ser editado. `escalatorSelectionVersion: 2` distingue a escolha explícita do acesso dos projetos anteriores, em que o controle era desabilitado. O estado `accessSelected` chega ao alocador de capacidade; desmarcar o acesso impede crédito populacional, sem apagar os equipamentos. Recalcular e reconfirmar continuam necessários. Audiência inalterada.

### Versão 8.5

Verificação em 15/10/2026: 378 testes aprovados, incluindo eventos DOM, cálculos NBR/ISO, zonas, PPH/energia e pacotes PPTX. Sem revisão visual em navegador.

`transportEquipment` guarda a confirmação independente de escadas e esteiras. As abas condicionais ficam em Parâmetros; a matriz `escalatorServed` gera os trechos. Flags físicos por ID preservam a nomenclatura independente do acesso. Cadastros desativados são conservados.

`groups[].cars` guarda capacidade, velocidade, portas e IDs físicos atendidos por elevador. `projectFleet` cria conjuntos homogêneos para os motores existentes, com `result.calculationStudy` usado pelas saídas que dependem da ordem dos conjuntos. O rascunho mantém os grupos lógicos e as entradas individuais. Zoneamento e exigência de distribuição em sobreposição permanecem. Cópia/catálogo de grupo e proposta do fornecedor aplicam a configuração comum aos elevadores, preservando destinos por equipamento. Remoções arquivam dados. A tabela física não pode ser desativada com cadastro individual ativo.

Pendências possuem destinos estruturados; navegação abre aba/grupo/composição antes de rolar e focar o campo. Novos controles respeitam o modo somente leitura. Sem migração D1 ou mudança de audiência.

### Versão 8.4

Verificação em 15/10/2026: 364 testes passaram (eventos DOM, APIs, cálculos e pacotes PPTX), sem revisão visual em navegador ou nova renderização dos slides.

População calculada independente das exclusões: `calculatedNet` registra o cálculo após descontos percentuais; `recordedPopulation` considera a maior declaração por ambiente (e o arredondamento de piso ISO quando aplicável); `net` alimenta os elevadores. A memória preserva exclusões e atendimento parcial. O nome automático de exibição usa `compositionName`, sem sobrescrever `label` (indicação do ambiente) ou a marcação real.

Cópia populacional seleciona categorias de campos e destinos, nunca confirmação de acesso, condições locais ou rede de escadas. O alocador proporcional de capacidade por caminho limita cada trecho compartilhado; o atendimento parcial é premissa explícita do projeto, sem apresentá-lo como regra da NBR/ISO. Parcela residual é arredondada para cima por estudo. Relatório, PPT e ajuda foram atualizados. Recalcular projetos abertos para adotar o motor 8.4; versões compartilhadas preservam o resultado histórico. Nenhuma alteração de audiência ou migração D1.

### Versão 8.3

Acesso principal é identificado por `floorTable.accessRowId`, independente da etiqueta do andar. Selecionar acesso não renumera. Leitura de cadastros sem a propriedade usa o antigo andar 0. População, descontos, escadas, zonas e antecipador usam a origem física, não a etiqueta. O aviso cita NBR 16858-3:2022, 5.4.2.3.2 a), distinguindo correspondência obrigatória da nomenclatura e sequência preferencial. JSON existente armazena o campo, sem migração D1. Históricos não são regravados.

Escritórios permitem desconto de 50% nos dois adjacentes ao acesso (até 5 m). População e distâncias têm cópia por flags, sem sobrescrever ambientes preenchidos ou alterar destinos não selecionados. O aviso de serviço comum não exige confirmação. Fornecedor pode calcular cenário de antecipador por agrupamento Monte Carlo ou dados documentados, com ocupação padrão 80% editável. A comparação e o PPH usam esse cenário, com referência convencional independente e validação por simulação pendente. Novos gráficos/memórias entram no relatório e PPTX. Configuração persistida no JSON da proposta, sem migração de banco.

Condição de fornecimento usa Substituição total. Cópia de grupos permite escolher origem e múltiplos destinos por flags, inibe a origem como destino, preserva IDs/rótulos e invalida resultados. Inclui teste de cópia isolada, múltipla e limite de grupos.

Novos projetos possuem grupos vazios, indicação laranja de entradas faltantes e conferência parcial de paradas prováveis independente do ciclo completo. Quantidade de grupos é definida na tabela de pavimentos. O resumo de movimento reflete os dados do grupo ou uma configuração de catálogo documentada. Rascunhos incompletos são persistidos sem virar resultados válidos.

Pavimentos têm flag único de acesso, marcação com dois caracteres, cópia de distâncias por flags e composição gerada por andar no fluxo novo. Componentes complementares exigem decisão de inclusão, separação ou exclusão. Valores de versões anteriores e compartilhamentos históricos são preservados.

A aba dimensional diferencia obra nova, retrofit e substituição total. Levantamentos do gestor e do fornecedor são separados. Propostas registram faixas de instalação, cabina, portas e verificação em campo. O catálogo usa a tabela `supplier_catalog` existente, com JSON versionado, filtros e consulta global administrativa, sem nova migração D1. Reutilização remove medições/confirmações de outro projeto. Valores divergentes de configuração existente exigem confirmação e revisão.

Escadas v2 possuem múltiplos conjuntos por trecho e quantidades por sentido. Capacidades são somadas por sentido, sem duplicar subida e descida. Trechos seguem os pavimentos, remodelam por IDs físicos e ficam vermelhos sem ligação ao principal. Configurações antigas podem ser migradas pelo botão específico. Inclinações têm opções de seleção e edição manual, sem substituir comprovação do fabricante.

Relatório e PPTX incluem as novas dimensões e os conjuntos de escadas. Empresa responsável substitui Firma instaladora somente nos rótulos, preservando o campo de dados histórico.

Há até 20 grupos. Velocidade pode ser escolhida na lista de 0,15 a 15,00 m/s ou digitada livremente como um número positivo. Aceleração e jerk possuem passos de 0,05 e edição manual. Aceleração: amarelo quando 1,00 < a ≤ 1,60 m/s²; vermelho acima de 1,60 m/s². Jerk: amarelo acima de 1,20 m/s³ até 2,50 m/s, ou acima de 1,60 m/s³ para velocidades maiores. São critérios de alerta do estudo. Percurso abaixo de (paradas − 1) × 2,80 m fica vermelho.

## População e memória

O cálculo populacional usa composições identificadas por ambiente ou pavimento: áreas de salas de escritório, apartamentos por dormitórios, dormitórios de serviço, quartos de hotel, leitos, salões de refeições, salas de aula e administração, vagas e áreas de lojas. Cada composição pode ser repetida.

São tratados os critérios da NBR 5665, seção 5.1: salas pequenas; redução de área de escritório elegível em 15%; desconto de 50% nos pavimentos imediatamente acima e/ou abaixo do acesso, até 5 m; exclusões justificadas. Cada composição informa seu pavimento e suas repetições no mesmo pavimento. O acesso usa nível inteiro: térreo 0, primeiro andar 1, subsolo -1.

O desconto escolar é um campo separado, mostrado apenas para escolas. O percentual informado entra no cálculo, dentro de 12 m, nos pavimentos acima ou imediatamente abaixo do acesso. A referência normativa é 30%; valores diferentes são identificados na tela e no relatório como premissas personalizadas. Não acumular esse desconto com o desconto de 50% na mesma população.

## Escadas rolantes

Ative o controle de escadas rolantes e informe quantos pavimentos existem acima e abaixo do acesso; clique em **Atualizar tabela de pavimentos**. Cada trecho recebe seleção de atendimento, existência de subida e descida, larguras de degrau de 600/800/1000 mm, velocidades, inclinação, desnível e confirmação do par. Confirme também a capacidade operacional adotada antes de aplicar exclusões.

As referências atuais de segurança para escadas rolantes são ABNT NBR 16734-1:2022 (construção e instalação) e ABNT NBR 16734-2:2023 (melhoria de segurança de equipamentos existentes), identificadas como correntes no catálogo DIN Media em 13/10/2026. A norma antiga fornecida foi retirada da base ativa. Os itens numéricos das edições atuais não foram validados no texto oficial. Até essa validação, a capacidade horária é declarada e documentada pelo fabricante, separada por sentido: capacidade na janela = pessoas/h × minutos/60 × utilização/100. Não se somam subida e descida.

A carga do trecho inferior acumula a população dos pavimentos além dele com atendimento contínuo. Descontinuidade, gargalo, par não confirmado, larguras diferentes ou configuração técnica sem conferência impedem a exclusão do pavimento e dos que dependem desse caminho até o acesso. O texto orienta que o item 5.1.6 exige escadas rolantes ligadas ao acesso e capacidade para transportar a população; a verificação de continuidade começa no pavimento imediatamente acima ou abaixo do principal. O flag na composição solicita a exclusão; a população só é desconsiderada quando a rede e a capacidade declarada permitem. Os resultados aparecem por trecho na tela e no relatório. Este módulo avalia escadas rolantes; as larguras, velocidades, inclinações e desníveis precisam de confirmação técnica da configuração.

Após uma exclusão aplicada, alterar os dados envolvidos bloqueia o cálculo de tráfego até **Calcular estudo completo** novamente. Se todas as populações forem excluídas, aceita-se total zero, com mínimo de tráfego zero e indicação de que isso não dispensa as demais exigências de instalação ou acessibilidade. Paradas e percurso permanecem informados.

## Ambiente, posição e andar servido

Cada composição tem três identificadores distintos: **Indicação do ambiente**, **Posição da composição no estudo** e **Andar servido pela composição**. O ambiente é a descrição do espaço. A posição é uma sequência interna única, limitada a dois caracteres, usada por Copiar, Subir, Descer e renumeração. Alterar a posição não altera o andar real atendido. A marcação do andar pode repetir em vários ambientes; ambientes do mesmo andar compartilham o nível físico. Em marcações por letras, o nível é declarado para tornar explícita a posição real em relação ao acesso.

O resumo reúne as populações de todos os ambientes do mesmo nível físico em uma linha por andar, com andares superiores acima dos inferiores. Mostra população calculada líquida, declarada dos ambientes, adotada líquida e separação entre estudo principal e estudos separados. A memória detalhada mantém cada ambiente e posição para auditoria.

**População declarada do ambiente** aceita inteiros de zero a um milhão; zero significa sem declaração. Compara-se a população calculada líquida de cada ambiente com sua declaração e adota-se o maior valor. Para cada andar e estudo, somam-se uma única vez os valores adotados dos ambientes. Calculada e declarada do mesmo ambiente não são somadas entre si. Declarações de mesmo valor em ambientes distintos representam parcelas próprias e são somadas. A declaração corresponde ao total da composição, incluindo suas repetições, e não é multiplicada novamente. Estudos externos mantêm declaração e critérios próprios; suas populações não entram na demanda principal. A população adotada entra na verificação das escadas antes da exclusão por capacidade. O acesso confirmado e os usos exclusivos continuam desconsiderados.

Exemplo: Administração com 280 m² resulta em 40 pessoas; Recepção com 140 m² resulta em 20 pessoas. Ambas no andar 1 geram uma linha com 60 calculadas. Declarar 80 na Administração adota 80 nesse ambiente e 20 na Recepção, totalizando 100. Declarar 50 na Administração totaliza 70; declarar 30 mantém 60. Declarar 80 em cada um dos dois ambientes totaliza 160.

Copiar oferece flags de pavimentos ou novo, com origem desabilitada. Os modos de quantidade **Andares seguintes** e **Mesmo andar · novos ambientes** permanecem opcionais. As posições são sequenciais em ambos os casos. As cópias têm dados independentes e não herdam o flag de confirmação do acesso. Subir e Descer alteram a ordem interna sem mudar o andar servido. Somente uma composição confirma o andar de acesso à rua; todos os ambientes desse andar são excluídos da demanda, mantendo paradas e percurso.

A NBR 16858-3:2022, 5.4.2.3.2 a), permite caracteres consistentes com a nomenclatura e prefere −2, −1, 0, 1, 2 etc. O aviso refere-se ao **andar servido**, não à posição da composição. Os limites de duas posições e a adoção da maior população entre calculada e declarada por ambiente são critérios deste programa. A migração conserva andares reais e converte um total manual maior de versões anteriores em declaração, com registro da origem nas observações.

## Cálculo completo

Todos os botões usam **Calcular estudo completo**: população por ambiente, adoção do maior valor entre calculada e declarada, soma por andar, verificação de exclusões, estudo principal, estudos separados e relatório são atualizados na mesma operação. A população válida é atualizada automaticamente; falhas no cálculo de tráfego mantêm os resultados anteriores retirados e o relatório bloqueado. O total principal é automático; declarações são feitas nos componentes. Observações dos ambientes e o campo Como a população foi definida? entram no relatório; a justificativa livre é preservada a cada recálculo, junto da memória automática. Importação e abertura de cenários também recalculam os dados completos.

## Garagens, restaurantes e auditórios

Adicione uma composição em **Cálculo populacional** e escolha garagem, restaurante ou auditório em **Componente de população**. Auditório não aparece em Aplicação do edifício. A destinação diferencia a população principal, o uso exclusivo de apoio e a demanda externa com estudo separado. Garagens e restaurantes exclusivos são desconsiderados, sem remover paradas e percurso. O resumo apresenta todas as composições, a população principal, a soma dos estudos separados e o total dos estudos, sem dupla contagem. Os cadastros complementares de versões anteriores são migrados para as composições; importação e restauração preservam os grupos e vínculos.

Para demandas externas, preencha as vagas ou a área do salão e os grupos próprios de elevadores. Garagem: enquadramento com rampas e sem manobrista confirmado, 1,4 pessoa/vaga e 10% em cinco minutos. Restaurante: 1 pessoa/1,5 m² e 6% em cinco minutos. Cada uso recebe cálculo independente de capacidade, intervalo e mínimo de elevadores pela referência de ciclo e pelos tempos do fabricante.

Auditórios usam número de assentos, com 1 pessoa por assento como premissa de projeto. Demanda em cinco minutos e intervalo máximo são editáveis; os valores iniciais de 100% e 60 s são premissas do estudo, não valores atribuídos às normas fornecidas. O método de ciclo da NBR é utilizado com essa ressalva.

Demandas externas podem ser vinculadas à mesma rede de escadas rolantes, informando seu pavimento. Sua população participa da carga acumulada da rede. As exclusões são verificadas no estudo principal e nos estudos externos, sem somar suas populações na demanda de elevadores do uso principal. O relatório, JSON e cenários preservam todos os estudos, entradas e vínculos.

**Calcular estudo completo** substitui o total principal, registra o valor adotado de cada ambiente e sua soma por andar, e atualiza os estudos e o relatório juntos. O total principal é automático; declarações e justificativas ficam nos componentes. A memória aplicada é guardada separadamente dos campos em edição. Em caso de erro no tráfego, a população automática válida é preservada e o relatório permanece bloqueado. Os cenários, relatórios e exportações preservam a posição da composição, o ambiente, o andar e a declaração utilizados.

## Quantidade mínima de elevadores

O dimensionamento atende simultaneamente à capacidade em cinco minutos e ao intervalo aplicável. É feito em separado para referência normativa e fabricante. As características e a proporção entre grupos são mantidas: quantidades são reduzidas ao menor bloco inteiro proporcional e multiplicadas pelo menor número de blocos que atenda aos critérios. Não é uma otimização livre de combinações nem uma definição do número legal obrigatório para qualquer instalação. A tela e o relatório identificam a composição resultante e essa condição.

Para ciclos iguais, I = T/ne. Para ciclos diferentes, usa-se Σ(T × quantidade)/quantidade total² como aproximação por quantidade, com ressalva expressa. Para apartamentos exclusivos não há exigência de intervalo. Zonas independentes não recebem mínimo consolidado; com tabela de atendimento ativa, cada zona recebe população e mínimo próprios dentro do projeto.

## Referências no produto

A página **Verificação de conteúdo** reescreve o conteúdo técnico da NBR 5665:1983, com as erratas incorporadas de 1986 e 1987: itens 1 a 6, relações populacionais, seis tabelas e anexos A e B. A tabela de paradas prováveis é gerada pela expressão corrigida, com arredondamento apenas para leitura. O conteúdo informa a edição adotada e convida a adquirir ou contratar acesso à norma oficial em https://www.abntcatalogo.com.br/. O PDF não é distribuído pelo site.

Premissas e memória apresentam referências por norma e item; NBR 16858-3:2022 é citada apenas pelo item 5.2.2 relacionado à porta aberta. Os itens usados em descontos, exclusões e capacidade de escadas rolantes possuem transcrições com norma, edição e número do item em Premissas, Verificação de conteúdo e relatório. As referências vigentes de segurança de escadas são identificadas por edição; seus limites numéricos aguardam validação no texto oficial. O PDF de escadas rolantes não é distribuído. Arquivos de referência e planilhas não aparecem como cartões, downloads ou premissas no produto. A situação corrente das partes 1 e 2 da NBR 16734 foi identificada no catálogo DIN Media; as demais referências mantêm a edição adotada no projeto.

## Armazenamento, arquitetura e assinatura

Projetos e clientes são guardados por usuário no servidor; localStorage mantém o rascunho e os cenários de comparação neste dispositivo. JSON permite backup e importação; CSV compara cenários. O relatório abre a impressão para salvar PDF e pode ser baixado como HTML autônomo.

- `public/escalators.js`: capacidade documentada do fabricante, pares, continuidade, carga acumulada e exclusões da rede.
- `public/floors.js`: marcações, sequência, cópias, reordenação e acesso único.
- `public/population.js`: ocupação, composição e auditoria de população.
- `public/engine.js`: validação, ciclo, consolidação e dimensionamento mínimo.
- `public/state.js`: migração, estado e limites dos planos demonstrativos.
- `public/reference.js`: conteúdo normativo reescrito e tabela de cabinas.
- `public/app.js` e `public/styles.css`: interface, relatórios e consultas.
- `tests/`: regressões de cálculo e fluxos por adaptador DOM.

Para oferta comercial futura: liberar privadamente os usuários autorizados, confirmar os preços propostos e testar o provedor de pagamento antes de ativar cobrança mediante autorização. Contas, dados por usuário, autorizações e versões de consulta estão implementados. Os planos atuais são demonstrativos, com controle de módulos e vencimentos no servidor. Não há cobrança real; solicitações são ativadas pelo administrador para teste.

## Validação

`node --test tests/*.test.mjs`

246 verificações automatizadas: soma por andar dos maiores valores de cada ambiente, sem somar calculada e declarada, posição independente do andar e cálculo único, marcações de pavimentos, cópia com quantidade, reordenação, acesso único e exclusão populacional, composição unificada, migração de complementos, recálculo encadeado, isolamento de falhas, redes sem dupla contagem, referências numéricas históricas, exemplos do anexo B, nós/interpolação, ciclos, capacidade, intervalo, população por uso, salas pequenas, descontos, exclusões, auditoria de edição manual, mínimo por capacidade e intervalo, migração, vinte grupos, cenários, importação, exportação e controles reais da interface. Testes de eventos usam adaptador DOM mínimo, sem renderização visual em navegador. Essa conferência visual está indisponível nesta execução.

Fontes e testes são sincronizados com o repositório privado do Site. O artefato de distribuição contém o Worker, os ativos compilados e as migrações, sem as normas fornecidas em PDF.


## Atualização 2.0: cadastro e serviço privado

A interface existente foi preservada em `public/` e passou a ser servida pelo starter Vinext, com D1, R2 para logomarcas privadas e migração gerada por Drizzle. `server/api.mjs` autoriza cada operação por identidade fornecida pela hospedagem. O proprietário é reconhecido pelo email configurado no valor secreto `SITE_OWNER_EMAIL`, e os demais usuários precisam estar cadastrados pela administração. Não há senha paralela nem envio automático de convites.

Os dados persistidos incluem clientes, projetos, preferências de relatório, membros, delegações e versões de consulta. Projetos têm revisão e situação de rascunho ou calculado; edições concorrentes rejeitam revisões antigas. A migração e seus metadados são versionados em `drizzle/`.

A população é recalculada automaticamente ao editar; resultados de tráfego e relatório são retirados até o cálculo completo. A parte inferior de cada composição reúne calculada, declarada e adotada. Novas impressões e downloads de consultas conferem novamente a validade do acesso.

Links guardam uma versão imutável calculada, sem acesso a listas de outros clientes. Tokens aleatórios de 256 bits são guardados no servidor somente como hash. Delegações são de carteira por usuário, com consulta/edição e prazo opcional. Usuários desativados não acessam APIs privadas. Exportação de todos os clientes e estudos é exclusiva da administração.

A hospedagem permanece **somente para o proprietário**. O programa prepara os acessos da equipe e a consulta de versões, mas convidar outros usuários exige liberação privada específica na hospedagem, após autorização do proprietário; cadastrar membros não altera a política do Site. Cobrança continua desativada.

`public/report.js` reúne identificação da primeira página, marca da empresa e formulário equivalente ao anexo A. O formulário usa até dois grupos por página e páginas próprias para estudos separados. PDF é salvo pelo diálogo de impressão; o download direto entrega HTML autônomo. O CSS usa cabeçalho/rodapé de tabela para repetição na impressão. Paginação visual em navegador ainda precisa ser conferida.

A descrição em linguagem simples para revisão e novos pedidos está em `public/descricao-do-programa.md`. Toda atualização deve revisar esse texto e apresentar ao usuário as mudanças, exemplos e limites de validação.

Verificação: testes do motor e dos exemplos históricos, eventos da interface, SQLite com a migração real e adaptador D1, autorização, delegações, concorrência, compartilhamento, revogação, campos do formulário e relatórios. O teste de portal executa eventos reais da aplicação com a API e SQLite, sem renderização visual.


## Atualização 2.1: partidas por hora

`public/starts.js` calcula partidas necessárias e máximas por carro e grupo. N, do ciclo existente, inclui o acesso e corresponde à expectativa de saídas de um ciclo fechado. Distância média = 2D/N. O pico horário equivale a 12 vezes a demanda de cinco minutos, com cabinas cheias e distribuição por capacidade FAB. Sem serviço comum, necessidade e comparação ficam nulas.

O deslocamento médio usa perfil ideal simétrico limitado por v, a e j. A duração de aceleração até uma velocidade u é 2√(u/j) quando u≤a²/j, ou u/a+a/j nos demais casos. A distância de aceleração+retardamento é u vezes essa duração. Quando a velocidade nominal não é alcançável, resolve-se a velocidade de pico pela distância: perfil sem platô de aceleração para d≤2a³/j², ou solução positiva de u²/a+(a/j)u−d=0. O tempo de movimento é d/u+t_acel(u).

A integração independente de sete fases verifica distância final, tempo e retorno a velocidade/aceleração zero. O exemplo publicado por R. D. Peters de d=8 m, v=2,5 m/s, a=1 m/s² e j=2 m/s³ resulta em 6,2 s. Referência técnica: https://download.peters-research.com/library/Ideal_Lift_Kinematics.pdf, 3.3 e 4.2.

Tempo médio entre partidas = movimento + portas + c×passageiro/N + 10% de portas/passagens + adicional de ciclo/N + permanência adicional. Máximo = 3600/t_médio; máximo adotado limitado por `startsLimit`, quando positivo. Zero significa não informado. Os ciclos principais não são modificados; exibe-se também 3600N/T_FAB como referência. O perfil aplicado à distância média é uma aproximação, não uma simulação da distribuição real de viagens e tampouco um limite térmico certificado.

O campo adicional é persistido no JSON, sem mudança de esquema do banco. Importações preenchem ausência com zero; relatórios compartilhados antigos sem o indicador continuam funcionando e conservam a identificação do motor registrada nos resultados. A tela, memória, relatório, comparação e CSV incluem o novo indicador. Os alertas não são apresentados como uma conclusão de atendimento da população sem verificar capacidade e intervalo.

## Ajuda e atualização de cadastros · versão 2.2.0

Manual do usuário em `public/manual-do-usuario.html` e explicações em `public/explicacao-dos-calculos.html`, gerados de `public/help.js` por `scripts/generate-help.mjs` durante o build. As duas áreas também estão no menu. As explicações abrangem população, adoção por ambiente, demanda, N, componentes do ciclo, capacidade, intervalo, mínimo, partidas, operação e rede de escadas.

Clientes têm ação explícita Atualizar dados, preservando o ID e os estudos históricos. Minha empresa / meus dados permite atualizar nome e contatos pessoais; a identidade de login e o perfil não são alterados por essa operação. Contatos pessoais são guardados em `profiles.data_json.account` e não entram automaticamente no relatório. A atualização da marca preserva esses contatos e vice-versa. Administradores podem atualizar nome, contatos e perfil de integrantes; email de conta vinculada permanece estável, proprietário e administrador atual conservam sua administração. Atualizar integrante não reativa conta desativada.

Redes antigas sem capacidade documentada permanecem cadastradas, mas a população volta ao estudo até completar os novos campos. Versões imutáveis compartilhadas preservam os resultados originais e são identificadas como históricas quando usam motor anterior; seus dados não são recalculados no visualizador.

Referências de metadados verificadas: https://www.dinmedia.de/en/standard/abnt-nbr-16734-1/360299035 e https://www.dinmedia.de/en/standard/abnt-nbr-16734-2/365188961 . Aquisição oficial: https://www.abntcatalogo.com.br/ .

## Versão 3.0.0 · dois motores independentes

Seleção `trafficModel`: `nbr5665` padrão para estudos novos/legados; `iso8100` alternativa parametrizada do texto ABNT N69 recebido. `public/models.js` salva conjuntos de parâmetros por modelo em `modelDrafts`; campos cadastrais continuam comuns. Trocas invalidam resultados, preservam a configuração anterior e exigem recálculo. Importação/exportação preservam os dois conjuntos.

`public/iso-data.js` contém classes/densidades, critérios com escolhas explícitas nas faixas, tabelas de FC, portas, transferência e movimento do documento. `public/iso-engine.js` implementa S, H, flight, performance, RTT, Ch, intervalo, mínimo e partidas próprios. A alternativa não produz aliases `normative`/`manufacturer`; seu resultado tem `iso`. Não chama o motor NBR nem herda seu adicional de 10%. `public/iso-view.js` fornece formulário e relatório distintos; NBR mantém Anexo A e ISO do documento usa Anexo D.

Origem: ABNT/CB-002/CE 002 138 018 N69, texto em elaboração, reunião 21/05/2025; não é ISO 8100-32 publicada. O proprietário pediu que este documento fosse a base da opção ISO. Publicação ISO 8100-32:2020 foi identificada como corrente em https://committee.iso.org/standard/73084.html?browse=tc , mas seu texto integral não fundamenta este motor. Nenhum PDF é distribuído pelo produto.

Inconsistências tratadas: célula Open floor de demanda sem valor usa premissa explícita; intervalos em faixas requerem escolha; a população aplica FU; performance calculada pela fórmula corrige exemplos impressos; Pcalc nominal×FC não copia o 13,1 inconsistente com 16×80%. N é explicitamente destinos sem acesso. Perfis de fabricante/baixa velocidade são identificados como variações. Controle de destino ou múltiplos acessos exigem simulação não implementada e bloqueiam o método parametrizado. Intervalo não é WT médio.

População ISO: ceil por pavimento/estudo após adotar cada ambiente; NBR mantém regra anterior. Parâmetros de descontos específicos por modelo. Dados adicionais: CNPJ/aprovação do projeto, carga e área de cabina opcionais, sem certificação da relação.

Escadas: novos estudos iniciam pela tabela da imagem enviada em 13/10/2026. Nove nós exatos: 600mm4500/5850/6750, 800mm6750/8775/10125, 1000mm9000/11700/13500, velocidades0,50/0,65/0,75m/s. Não há interpolação; fora da tabela, população mantida e sugerida base fabricante. Tabela é referência do proprietário, não valor atribuído à NBR16734. Dados de fabricante de registros anteriores continuam nessa base. Confirmações, continuidade e demanda por sentido mantidas.

208 testes automatizados incluindo os 186 anteriores, casos numéricos das equações do Anexo D com entradas explícitas, regras por pavimento, troca/importação/comparação, dados externos ISO, permissões e links imutáveis no servidor. Revisão visual em navegador e paginação impressa indisponíveis nesta execução.

Extensões ainda não implementadas: simulação de duas horas com despacho real/controle de destino, modelo de alturas/populações desiguais sem aproximação uniforme, zonas expressas, auditoria de conformidade com o texto integral da ISO publicada e validação carga/área.

## Versão 3.1.0 · curvas de viagem por grupo

Dois painéis por grupo: extremos (viagem direta) e andares consecutivos (D/(p−1)). `travel-curves.js` integra sete fases de jerk para produzir perfil, distância acumulada, tempos e PPH. Usa o mesmo solucionador `meanFlight`; amostragem serve apenas para desenho, sem calcular resultados por pontos. Curvas salvas em `results.groups[].travelCurves` preservam snapshots compartilhados.

Na NBR, a hipótese operacional de cada viagem utiliza os dados FAB, transferência completa c×tp, portas, adicional de 10%, start/paradas prováveis e dwell. ISO utiliza os dados efetivos da tabela ou fabricante, Pcalc, dois sentidos de transferência, atrasos e pré-abertura; nenhum adicional NBR. PPH = 3600/tempo completo deste percurso, limitado por startsLimit se positivo; difere do indicador baseado no ciclo e não é limite térmico nem simulação de despacho.

`travel-curves-view.js` produz tabelas e SVG acessível com velocidade×tempo, metros acumulados e faixas de etapas. Formulários apresentam prévias atualizadas por evento; resultados e relatório exigem recálculo completo. Relatórios de todos os grupos e estudos separados recebem os painéis. Resultados históricos sem curvas não são silenciosamente recalculados. Pré-aberturas que excedem movimento/abertura mostram painel indisponível sem alterar o RTT do estudo. Nivelamento específico na zona de porta não foi modelado.

220 testes automatizados, incluindo conservação por solução analítica e quadratura independente, regimes de movimento, continuidade/simetria, limites físicos, tabelas/tempos por modelo, vinte grupos, estudos separados, isolamento por grupo e fluxos reais de edição/relatório via adaptador DOM. Revisão visual em navegador e paginação impressa continuam indisponíveis nesta execução.

## Versão 4.0.0 · medição de atendimento, consumo e apresentação

`performance.js` acrescenta perfis exatos da imagem enviada (quatro fluxos e 12 blocos), com unidade explicitamente selecionada, sem normalizar os novos perfis. Perfis anteriores recebem `profileVersion:1` na migração e continuam disponíveis. Modelo medido aceita contagens absolutas inteiras/zero, data, responsável e horários; vazio impede cálculo completo. Até 288 blocos, CSV validado e redução de janela sem eliminar contagens inativas. Almoço divide a oferta entre os dois sentidos pela demanda acumulada. É análise por blocos, não despacho real ou simulação normativa ISO de duas horas.

Resultados guardam `performance` e `energy` por estudo. Contagens reais do acesso principal não se tornam medições de estudos externos: na ausência de configuração própria, esses usam perfil estimado. Normativos e populacionais permanecem independentes; uma medição de pessoas não muda a população da composição. Edits invalidam relatório/apresentação. JSON/modelDrafts preservam medições e energia; snapshots históricos não ganham resultados novos silenciosamente.

`energy.js` compara VVVF, VVVF regenerativo, AC2, CC motor-gerador e CC estático com potências médias, espera, recuperação, tempo específico, auxiliares, partidas diárias, calendário e tarifa opcional. Defaults são exemplos ilustrativos, não dados típicos de fabricante. CC também pode regenerar. Potência já líquida exige abatimento adicional zero. Horários incompatíveis deixam energia indisponível sem esconder a mensagem. Referência zero resulta em percentual indefinido; aumento permanece como redução negativa. Não certifica ISO25745 nem adota percentuais universais de economia.

Terceira curva por grupo: NBR 2D/N; ISO 2Hdf/(S+1), retorno incluído. Transferência rateada pelas partidas/paradas prováveis. O perfil ideal na média ISO pode diferir de RTT/(S+1). `analysis-charts.js` é catálogo compartilhado pelos gráficos do sistema, relatório e PPTX; estudos separados possuem prefixos únicos e consumo não somado automaticamente ao principal.

`presentation.js` gera textos/tabelas/gráficos nativos editáveis com workbooks incorporados. Exportação local no navegador, biblioteca PptxGenJS4.0.1/JSZip servida pelo próprio site, sem CDN ou envio externo. Preparada em `scripts/prepare-export.mjs` durante build. Logo WebP é convertido para PNG no navegador, mantendo a imagem, para compatibilidade. Serialização remove somente overrides de Content_Types que apontam para masters inexistentes (problema observado no escritor4.0.1); não altera gráficos, workbooks ou XML existente. Exportação verifica acesso/revogação antes de gerar e permite consulta em modo somente leitura. Alterações no PPTX não atualizam o projeto.

237 testes automatizados, incluindo os 220 anteriores, medições/conservação, perfis/unidades, cálculo energético dimensional, recuperação líquida, média por paradas, catálogo/relatório, editabilidade e caches/workbooks PPTX, motor de navegador por VM e fluxos reais por adaptador DOM. PPTX demonstrativo renderizado por Artifact Tool e pacote inspecionado estruturalmente. Testes no navegador e no aplicativo Microsoft PowerPoint, assim como paginação impressa, não estão disponíveis nesta execução.


## Versão 4.1.0 · polia, suspensão e potência por conjunto

`traction-energy.js` registra `groups[].energyEquipment.technologies` por tecnologia, com ativação independente, fornecedor/documento, diâmetros, suspensão, redução, motor P2, método de potência, rendimentos e retorno próprio opcional. Migração preenche controles inativos, sem inventar potência do fornecedor nem alterar snapshots históricos. Grupos externos possuem os próprios registros. Troca de modelo preserva as configurações nos grupos do respectivo rascunho.

Geometria informa rpm da polia/motor e torque nominal aproximado; 40d exato para os cinco diâmetros, com advertências específicas de 4/6 mm, cintas e D/d inferior a40, conforme os itens da edição2021 fornecida. Não dimensiona motor/freio nem certifica suspensão. Polia150 mm é opção informada pelo usuário, não regra universal.

Consumo prefere potência elétrica média própria do fornecedor por grupo, ou estima pela potência mecânica nominal, fator médio e rendimentos declarados. Dados incompletos bloqueiam atualização. A estimativa pelo motor exige base bruta; potência líquida e recuperação não são deduzidas duas vezes. Diâmetro isolado não reduz automaticamente kW/kWh. Quadro separado compara P2 nominal regenerativo × referência. Memória, fonte, avisos e dados realmente usados acompanham HTML/relatório e slides editáveis do PPTX.

Validação adicional: conversões exatas, relação D/d, rotação/torque, invariância energética ao mudar somente diâmetro, adoção de potência própria e retorno, diferenças nominais, rendimentos/base líquida, preservação NBR/ISO/JSON e isolamento de estudos externos. Eventos reais por adaptador DOM verificam campos, invalidação e recálculo. A revisão visual no navegador e a paginação impressa continuam indisponíveis.

Verificação final da versão4.1: 244 testes aprovados. Pacote PPTX de34 slides e12 gráficos passou na inspeção estrutural, comzero ocorrências, e foi renderizado para revisão visual. Não aberto no aplicativo Microsoft PowerPoint.


## Versão4.1.1 · ordem decrescente dos gráficos

Catálogo compartilhado ordena consumo anual de forma decrescente, com a mesma sequência no gráfico de redução. Acrescenta gráficos P2 por grupo somente quando existe potência própria do fornecedor, com ordem decrescente independente do kWh. Dados ausentes são identificados, sem substituir por zero/potência média. Ordenação estável em empates, sobre cópias, preservando as entradas e resultados calculados. HTML, relatório e PPTX usam o mesmo catálogo.

Validação da alteração4.1.1: 67 testes direcionados aprovados, incluindo ordenação, preservação de dados e exportação PPTX. Os244 testes completos da versão4.1.0 permanecem como referência anterior, sem repetir os cálculos numéricos não alterados.


## Versão5.0.0 · cinco telas e clientes reutilizáveis

Menu principal: Cadastro, Parâmetros, População, Gráficos e Cálculo de tráfego. `workflow.js` mantém os nomes das etapas e a classificação dos campos. Navegação reutiliza o mesmo rascunho, com seções recolhidas, status e botões de avanço/retorno. Ferramentas secundárias ficam em menu recolhido. Graficos possuem abas de atendimento/energia/viagens; cálculo e emissão de relatórios ficam na tela de resultados. Configuração dos elevadores externos foi movida para Parâmetros. Relatório completo continua independente da tela/aba ativa.

Cadastro usa clientes persistidos da API existente. Seleção porID preenche somente o contratante do projeto aberto. Novo projeto para este cliente preserva o rascunho anterior antes de iniciar um estudo independente. Atualização de cliente mantém a identidade e não reescreve projetos/link anteriores. Sem migração de dados ou permissões e sem mudanças nas equações NBR/ISO.

Revisão de eventos cobre isolamento das telas, edição/cálculo/relatório, prévias, convidados e dois projetos para um cliente com mudança posterior do cadastro. Conferência visual em navegador e paginação impressa indisponíveis neste ambiente.

Verificação final da versão5.0: 246 testes aprovados, incluindo eventos reais em adaptadores DOM, API com SQLite/D1 e cálculos/PPTX. Build de produção verificado; conferência visual no navegador e paginação impressa pendentes.


## Versão 6.0.0 · propostas, cargos e auditoria

O estudo-base pertence à equipe responsável. Propostas em `offers` são separadas por fornecedor e acessadas somente por seu autor convidado, responsáveis do projeto ou contratantes autorizados. `project_access` registra convites por projeto, empresa, perfil, prazo e revogação. O administrador gerencia os cargos: Analista de estudos (compatível com `member` anterior), Gerente por equipe, Diretor com acesso global, Administrador com gestão de cargos, Cliente e Fornecedor por projeto. Exportação JSON/CSV exige aprovação de funcionário, validada no servidor. Nenhuma audiência da hospedagem foi ampliada, email enviado ou cobrança ativada.

`procurement.js` calcula propostas independentes, conserva geometria/população do estudo-base e classifica por pendência técnica, atendimento/PPH e consumo anual. D/d abaixo de40 para cabos gera pendência, sem certificar solução alternativa. Estudo-base com revisão nova deixa proposta pendente de confirmação. Informações de fabricantes de cenários alternativos são filtradas da consulta do fornecedor e dos links específicos. Cadastro de produtos por empresa/modelo/velocidade/capacidade usa revisões com confirmação de sobrescrita e autoria anterior. Alterações não salvas bloqueiam relatórios e troca de projeto até salvar ou descartar explicitamente.

Expediente, almoço e utilização média do pico orientam os gráficos e a projeção energética. PPH necessário por elevador × horas × fator declarado substitui partidas diárias fixas na base automática. Medições mantêm os blocos reais; perfis estimados redistribuem os totais. Dados ausentes de potência/correntes têm hipótese explícita, não aparecem como dados documentados de potência nominal. Controle/sinalização fornecidos são contínuos no expediente. O diâmetro da polia não produz economia automaticamente. Comparativo mostra existente×proposta, sem gráfico separado de redução. Todos os gráficos por fornecedor e suas premissas aparecem no relatório e nos gráficos/textos editáveis da apresentação.

Pré-abertura NBR é premissa FAB, sem alteração da tabela normativa; ISO utiliza tpre. Alertas condicionais de aceleração/jerk, portas e PPH; cópia de grupos; linha total e PPH do ciclo; AnexoA visível para conferência. Botões de saída foram movidos para uma faixa que quebra em linhas no final da tela.

Links registram número único, solicitante, aprovador, escopo, permissão e vencimento (24h, período, ilimitado), com revogação. Consulta preserva snapshot. Edição exige conta identificada e autorização prévia para o estudo ou própria proposta. Criação de contas no programa não altera a autorização privada da hospedagem. Migração0001 é apenas esquema: adiciona tabelas e campos com defaults constantes, preservando registros e links anteriores.

Conta de energia em R2 com dados conferidos em D1; custo variável separado do total, com tarifa proposta e aplicação pelo responsável seguida de recálculo. Leitura assistida em `invoice-ai.mjs` preparada para Responses API, sem execução/custo real nesta etapa: requer `OPENAI_API_KEY` e `OPENAI_INVOICE_MODEL` no servidor. Nenhuma chave fica em arquivos/bundle. Não há credencial configurada neste protótipo. O usuário pode preencher manualmente. Saída JSON estrita, `store:false`, anexo base64, máximo2 MB e dez tentativas por hora, exigindo confirmação humana antes de adotar valores. Referências: https://developers.openai.com/api/docs/guides/file-inputs e https://developers.openai.com/api/docs/guides/structured-outputs .

Limites de validação: testes de cálculo, API com SQLite/D1, isolamento, revisões, auditoria e eventos reais por adaptador DOM. Build de produção. Apresentação ilustrativa com56 slides/37 gráficos renderizada por Artifact Tool, revisão visual dos formatos alterados e pacote sem ocorrências estruturais. Não aberta no Microsoft PowerPoint. Navegador e paginação impressa indisponíveis neste ambiente. NBR5665 continua preferencial; alternativa ISO continua baseada no N69 de trabalho fornecido, sem certificação da edição ISO publicada. Manutenção/vistoria permanece fora deste módulo.

Validação da versão6.0: 259 testes aprovados, zero falhas, incluindo fluxos de cadastro/proposta/catálogo e controles de exportação no servidor.


## Versão 8.6.0

- Colunas individuais são a fonte única de capacidade (pessoas), velocidade, abertura livre e tipo de porta; os campos comuns são mantidos apenas para compatibilidade de estudos anteriores, sem entrada duplicada na interface.
- `personMassKg` por elevador: sugestões e edição livre, estimativa `capacity × personMassKg` e m/min derivados. Não confundir massa estimada com carga nominal de placa ou relação normativa carga/área.
- Recalcular no aplicativo ativa `groupCalculationVersion:1`: cada grupo lógico produz `groupStudies` com seus próprios elevadores e população servida. Somas e medições globais são informativas; sobreposições entre grupos não são uma distribuição automática da demanda. Zoneamento dentro do grupo continua validado.
- Relatório, anexos e PowerPoint incluem estudos e gráficos de cada grupo, massas e nomes personalizados. Snapshots antigos não são alterados.
- Verificação automatizada de domínio, eventos reais com adaptador DOM, API e arquivos PowerPoint. Revisão visual em navegador permanece pendente por indisponibilidade do controle de navegador neste ambiente.


## Versão 8.7.0 — referência dimensional provisória

- Base fornecida pelo administrador: 2.741 linhas, 35 duplicatas removidas por igualdade dos nove campos normalizados, 2.706 registros únicos, oito configurações com alternativas divergentes. `public/dimension-reference-data.js` guarda unidades, versão, SHA-256 da fonte, IDs estáveis e linhas de origem. Importação reproduzível com `node scripts/import-dimensional-reference.mjs entrada.tsv public/dimension-reference-data.js`.
- `dimension-reference.js` consulta capacidade, velocidade e alturas exatas, percurso dentro do máximo, casa de máquinas e fabricação. Sem interpolação/extrapolação. Conflitos exibem todas as alternativas e adotam um envelope conservador provisório, sem certificação normativa.
- Somente mínimos de produto vazios/provisórios recebem sugestões; valores reais, máximos e medições não são sobrescritos. `referenceOrigins` distingue campos provisórios; edição pelo fornecedor remove a marca daquele campo. O catálogo e sua consulta continuam restritos por empresa e passam a distinguir casa de máquinas, fabricação e alturas da variante.
- Resultado calculado guarda `dimensionReferences` para rastreabilidade das referências na versão emitida. Tela, relatório e PowerPoint incluem origem e valores. Nenhum novo serviço externo, mudança de audiência ou cobrança.


## Versão 8.8.0 — caixa/cabina e escadas sem confirmações obrigatórias

- `shaft-reference-data.js`: 660 configurações únicas, nenhuma duplicata integral após normalização, uma observação para eixo vertical. 42 registros inconsistentes preservados com `usable:false` e motivos; 618 utilizáveis. Importação reproduzível: `node scripts/import-shaft-reference.mjs entrada.tsv public/shaft-reference-data.js`.
- Consulta usa parâmetros exatos, percurso dentro do máximo e configuração frontal. Variantes completas escolhidas por elevador (`shaftRowId`); nenhuma combinação de medidas entre variantes. A escolha dimensional fica em metadados por elevador e não altera o agrupamento de tráfego, ciclo, capacidade ou mínimo estimado. Mesma prioridade por campo e `referenceOrigins` do módulo anterior; levantamentos existentes permanecem intocados.
- Escadas: aba/controle condicionados à seleção na matriz. A política ativa `parameters-only-v1` dispensa os campos de documento e confirmações manuais, conservando verificação de continuidade, sentidos, larguras e capacidade. A ausência de todas as marcações desativa o abatimento sem apagar o cadastro. Motores legados conservam a interpretação histórica quando a política não está presente; o aplicativo grava a nova política ao editar/recalcular.
- Relatório, PowerPoint e manual atualizados. Sem nova integração externa ou alteração de audiência. QA visual em navegador indisponível; fluxos e documentos verificados por testes automatizados.

## SilSec 10.0 — fornecedores e comparação comercial

Identidade da aplicação atualizada para SilSec, preservando IDs do projeto, dados existentes, versões históricas e leitura do cache legado. A migração 0003 é aditiva: organizações/CNPJ, vínculos de equipe, convites fiscais, aprovações, documentos e condições comerciais. A URL existente foi mantida para preservar os links.

- Vínculo da abertura dimensional à unidade selecionada, cópia dimensional seletiva e alertas de altura de cabina/porta conforme valores pedidos pelo proprietário.
- Novas propostas começam com campos do fabricante vazios. Envio incompleto permitido; consumo sem comprovação e parâmetros permanece pendente. NBR pode calcular sem tempos do fabricante; resultados FAB e complementares são suprimidos nessa condição.
- Organizações com gerente e funcionários delegados. Vínculo por CNPJ depende de aprovação, e CNPJ existente não é prova de titularidade. Catálogo compartilhado com clientes autorizados remove medições de outra obra. Documentos e propostas usam verificações de projeto e empresa no servidor.
- Pontuação por critério, limites e lacunas explícitas; concorrentes anônimos para fornecedores. Histórico de contratos fechados restrito aos projetos autorizados e aos últimos 12 meses, mesmas configurações/escopo e moeda BRL. Targets privados editáveis e texto de negociação sem envio automático.
- Contratos privados em R2. `OPENAI_API_KEY` + `OPENAI_CONTRACT_MODEL` habilitam a integração Responses de triagem contratual; não foi configurada nem chamada em produção nesta atualização. Testada com resposta simulada. Extração com fonte, confirmação humana e registro de auditoria; não é parecer jurídico.
- Ajuda contextual, manual atualizado, especificação de evolução, guia de comercialização e três propostas de logotipo (nenhuma escolha definitiva). Comparativos e condições comerciais seguem o escopo do usuário no relatório e PPTX editável.

Documentos do produto: `/silsec-especificacao.html`, `/silsec-comercializacao.html`, `/identidade-silsec.html`.

Para operação externa, revisar autenticação (a versão hospedada confia exclusivamente na identidade validada pelo Sites), isolamento, restauração de backup, custos/limites da IA, validação técnica/normativa e contratos do serviço. Não houve ativação de pagamento, envio de convites/mensagens ou ampliação de audiência. QA em navegador indisponível neste ambiente; testes de eventos via adaptador DOM não substituem verificação visual de layout e impressão.


## Identidade SilSec — opção 1 aprovada

Opção 1 aplicada às interfaces Básico/Avançado e às páginas de orientação. Arquivo original preservado em `public/silsec-brand/opcao-1.png`. A página de identidade registra a aprovação e conserva as demais opções como histórico. Logomarcas de clientes e personalização de relatórios permanecem próprias de cada empresa. Sem alteração de dados, cálculos ou audiência.


## Prévia de velocidade por elevador e remoção de ajuda contextual

Removidas as caixas “?” e seu módulo de injeção na interface. Manual e especificação atualizados. A prévia de viagem usava os valores legados do grupo; agora usa a mesma projeção por equipamento e a sincronização de pavimentos do cálculo completo, com identificação das unidades e curvas separadas quando os parâmetros diferem. Dados incompletos ficam pendentes, sem recorrer à velocidade antiga do grupo. As curvas mantêm a distinção entre velocidade nominal e atingida. Sem alteração das fórmulas normativas, dos dados persistidos ou da audiência.

Validação desta correção: 110 testes aprovados (fluxos reais de eventos via adaptador DOM, curvas, frota individual e prévia NBR/ISO), sintaxe e diferenças verificadas. Conferência visual em navegador indisponível neste ambiente.


## Área interna da cabina — fórmulas fornecidas em 17/10/2026

Removidas as duas linhas especiais de 44 passageiros. Tabela de 4 a 20 preservada; mínimo para C ≥ 21: (C − 20) × 0,115 + 3,13. Máximos de 21 a 33 avaliados pelas expressões fornecidas e, para C > 33, (C × 75 − 2.500) ÷ 100 × 0,16 + 5. Apenas capacidades inteiras são aceitas na conferência; 44 usa a regra geral (5,89–6,28 m²). Tela, relatório e PowerPoint compartilham a mesma conferência. Referência identificada como fornecida pelo usuário, sem alteração dos motores de tráfego NBR/ISO.

Validação: 46 testes aprovados para limites de área, unidades individuais, dimensões, relatório e PowerPoint; conferidos os valores de 21 a 33, as transições 20/21 e 33/34, 44 e 100 passageiros, extremos inclusivos e destaque fora da faixa. Sintaxe e diferenças verificadas. Conferência visual em navegador indisponível neste ambiente.


## Revisão de consistência e apresentação — 17/10/2026

A base passou em 477 testes existentes. A inspeção encontrou bloqueio reproduzível: `syncDimensionalDoor` criava cadastro individual sem ativar a tabela exigida por `fleetErrors`. O vínculo agora reutiliza `changeCar` e a cópia de unidade sincroniza a abertura dimensional. A soma visual de portas deixa de tratar ausência como zero; total depende de ambos os tempos. Alerta de PPH insuficiente também atualiza `aria-invalid`.

Removido o parágrafo sob a conferência de área; resultados dimensionais ocupam toda a largura, com mínimo/máximo separados, quatro casas decimais e estados textuais. Fórmulas preservadas no manual. Linha 11 do Anexo A sem sufixo s/pessoa, mantendo valores, base de cálculo e apresentação s/parada quando aplicável. A especificação inclui solicitação reescrita, achados e prioridades de evolução estrutural.

Conferência adicional no Anexo A: soma parcial FAB e pré-abertura deixam de transformar campos nulos em zero quando o cálculo está disponível apenas pela base NBR.

Validação final: suíte geral com 483 testes aprovados; após a correção adicional dos campos nulos no Anexo A, 9 testes direcionados de relatório/área aprovados, incluindo a nova regressão (484 casos no conjunto atual). Sintaxe e diferenças verificadas. Conferência visual em navegador indisponível; não foi realizado ensaio de layout real ou auditoria externa.
