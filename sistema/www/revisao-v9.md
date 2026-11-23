# Revisão 9.0 — módulos e acesso

## Resultado da revisão

| Condição | Comportamento revisado |
|---|---|
| Perfil leve/moderado com medições antigas incompletas | Dados conservados; validação das medições somente no modo real. |
| Janela real reduzida | Valida somente os blocos ativos, conservando os demais para uso posterior. |
| Percentuais do perfil legado | Exigidos somente quando o perfil os utiliza; removida validação duplicada conflitante. |
| Consumo desligado | Dados conservados, sem bloquear tráfego. |
| Base de consumo por PPH | Não exige partidas manuais. Se não houver distribuição de demanda, informa indisponibilidade de energia; não substitui a base automaticamente. |
| Escadas desligadas | Usa a configuração efetiva de ativação; parâmetros inativos não geram bloqueio operacional. |
| Grupo sem serviço comum declarado | Conserva cálculos numéricos; não afirma atendimento consolidado para demandas sem distribuição. |
| Básico | Usa o mesmo núcleo normativo NBR, uma coluna por grupo; não exige parâmetros exclusivos do Avançado. |
| Projeto calculado reaberto | Usa resultados salvos; não executa novo cálculo silenciosamente. |
| Vencimento do módulo | API bloqueia edição/compartilhamento/exportação editável; relatório formatado arquivado permanece acessível ao titular e a quem possui permissão de consulta, exceto fornecedores do relatório geral. |
| Rascunho posterior ao relatório | Mantém último arquivo calculado, sem trocar por versão incompleta. |
| Fornecedores e clientes convidados | Mantêm isolamento de projeto e colaboram sob licença vigente do responsável. |

## Verificação

441 testes automatizados passaram, cobrindo os testes anteriores e novos fluxos de módulos/licenças. O conjunto verifica exemplos de cálculo existentes, equivalência do Básico com o núcleo NBR, grupos independentes, invalidação da interface, salvamento/reabertura, CPF, concessões, chaves, experiência de 30 dias, educação, isolamento e arquivo de relatório após vencimento. Verificação visual em navegador não executada neste ambiente. Não foram incorporadas novas edições normativas nem revalidados seus textos oficiais nesta atualização.

Relatórios anteriores à versão 9.0 que ainda não possuam arquivo formatado precisam ser calculados e salvos com acesso ativo para criar esse arquivo. Acesso ao programa permanece privado. Nenhum usuário externo foi convidado e nenhuma cobrança foi ativada.

## Próximas melhorias sugeridas

1. Provedor de pagamentos com confirmação assinada, conciliação e prevenção de reprocessamento antes da cobrança real.
2. Verificação de titularidade adicional ao CPF, que sozinho não comprova identidade.
3. Casos normativos de referência adicionais, revisados pelo responsável técnico, com rastreabilidade de entradas e resultados.
4. Conferência visual em telas pequenas e impressão de estudos extensos; manter tabelas do Básico paginadas.
5. Fila administrativa de vencimentos e renovações, com políticas explícitas de conservação dos comprovantes.
