# Precificação da anuidade da plataforma

Estimativa feita em 18/10/2026. Os valores de terceiros (Hostinger, Mercado Pago, impostos, câmbio) mudam com frequência: confira nos painéis antes de fechar o preço. As premissas de horas são suas e podem ser ajustadas.

## Preço recomendado

| Plano | Preço anual | Equivale por mês | Para quem |
|---|---|---|---|
| **Completo** | **R$ 797,00** | R$ 66,42 | Construtoras, incorporadoras, projetistas e administradoras que comparam cenários e propostas |
| **Básico** | **R$ 397,00** | R$ 33,08 | Síndicos e clientes que só precisam do cálculo NBR 5665 e do relatório |

Os dois já estão configurados no programa. Para mudar sem alterar o código, use as variáveis `PRECO_COMPLETO_ANUAL` e `PRECO_BASICO_ANUAL` no painel da Hostinger (em reais, por exemplo `797` ou `997,00`).

## Custos

### Fixos por ano (a plataforma inteira)

| Item | Valor/ano | Observação |
|---|---|---|
| Hospedagem Hostinger Unlimited | R$ 167,88 (promoção) a R$ 779,88 (renovação) | R$ 13,99/mês no contrato de 48 meses; renovação a R$ 64,99/mês |
| Domínio .com.br (Registro.br) | R$ 40,00 | |
| Caixa de e-mail | R$ 0 no 1º ano; estimado R$ 120 depois | Incluída grátis por 1 ano no plano |
| Manutenção do sistema (sua hora) | R$ 3.600,00 | Premissa: 2 h/mês × R$ 150/h |
| **Total** | **R$ 3.807,88 (com promoção) a R$ 4.539,88 (após renovação)** | |

Sem contar o seu tempo, a infraestrutura custa entre **R$ 208 e R$ 940 por ano**.

### Variáveis por cliente

| Item | Valor | Observação |
|---|---|---|
| Suporte e acompanhamento | R$ 150,00/ano | Premissa: 1 h por cliente por ano |
| IA (leitura de contas e contratos) | ~R$ 20,00/ano | Opcional, créditos do Hostinger AI Router, pago por uso |
| Mercado Pago | 0,99% (Pix) a 4,98% (cartão com recebimento na hora) | Cartão com recebimento em 30 dias: ~3,99% |
| Imposto (Simples Nacional) | 6% (Anexo III) a 15,5% (Anexo V) | Depende do CNAE e do Fator R. Confirme com o seu contador |

## Quanto sobra por cliente e quantos clientes pagam a conta

Simples a 6%:

| Preço/ano | Sobra por cliente (Pix) | Sobra por cliente (cartão) | Clientes para cobrir os custos fixos |
|---|---|---|---|
| R$ 397 | R$ 199 | R$ 183 | 19 a 25 |
| R$ 497 | R$ 292 | R$ 272 | 13 a 17 |
| R$ 697 | R$ 478 | R$ 450 | 8 a 10 |
| **R$ 797** | **R$ 571** | **R$ 539** | **7 a 8** |
| R$ 997 | R$ 757 | R$ 718 | 5 a 6 |
| R$ 1.497 | R$ 1.222 | R$ 1.163 | 3 a 4 |

Com Simples a 15,5%, o plano Completo a R$ 797 deixa R$ 464 a R$ 496 por cliente, e o ponto de equilíbrio sobe para 8 a 10 clientes.

## Por que R$ 797 no plano Completo

- **Referência de mercado:** o Elevate Express, da Peters Research, custa £ 430 com 1 ano de suporte (cerca de **R$ 2.900** a R$ 6,74 por libra). É um programa de computador, em inglês, que precisa ser instalado. O plano Completo custa menos de um terço disso e roda no navegador.
- **Produto independente, venda em volume:** a plataforma é vendida por conta própria (teste de 30 dias, depois anuidade). Um preço baixo facilita a adesão de profissionais autônomos e pequenos escritórios e a renovação.
- **Fica abaixo do limite de decisão de quem compra:** cerca de R$ 66 por mês tende a ser aprovado pelo próprio gestor, sem passar por assembleia ou concorrência.
- **Cobre os custos com poucos clientes:** com 8 clientes pagantes, a plataforma se paga, incluindo as suas horas de manutenção. A partir daí, cada cliente acrescenta cerca de R$ 540 por ano.
- **Deixa espaço para reajustar:** se a procura for alta, R$ 997 ainda fica bem abaixo da referência internacional.

## Sugestões comerciais

- **Estudantes:** acesso educacional de 6 meses grátis com comprovante de matrícula. Não gera receita direta, mas forma os futuros compradores e divulga a marca nas faculdades.
- **Equipes:** para mais de um usuário na mesma empresa, ofereça acessos adicionais com desconto (por exemplo, R$ 397 por usuário extra no Completo) e libere pelo Painel.
- **Pix:** a taxa é menor (0,99% contra 4,98% no cartão). Se quiser incentivar o Pix, use `MP_PARCELAS=1` (sem parcelamento), que já é o padrão.
