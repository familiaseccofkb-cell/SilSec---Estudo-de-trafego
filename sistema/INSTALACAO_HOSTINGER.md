# SilSec Engenharia na Hostinger · guia de instalação

O SilSec é publicado em `silsec-engenharia.com.br` como **Node.js Web App** (este pacote): site do sistema, teste grátis, planos, programa, assinatura, painel e console do desenvolvedor. Endereços:

| Endereço | O que é |
|---|---|
| `silsec-engenharia.com.br` | Site do sistema: o que faz, vídeos, planos, estudantes e contato |
| `/experimentar` | Cadastro com **30 dias grátis** do plano Completo (sem cartão; um teste por e-mail) |
| `/sistema` | O programa de estudos de tráfego |
| `/assinatura` | Situação do acesso, pagamento da anuidade (Mercado Pago) e acesso educacional |
| `/ativar` | Ativação de chaves de cortesia (parcerias e turmas de faculdade) |
| `/vistorias` | Vistorias guiadas: modelos (você edita), preenchimento no celular com fotos e relatório |
| `/painel` | Seu painel: chaves, clientes, pagamentos e mensagens do site |
| `/admin` | Console do desenvolvedor: usuários, acessos, pagamentos manuais, manutenção e cópias de segurança (ver `docs/APLICATIVOS.md` no pacote completo; a pasta `docs/` não vai para a hospedagem) |

## Antes de começar

- **Plano:** é preciso um plano que aceite Node.js Web Apps: o **Unlimited** (antigo Business) ou qualquer plano **Cloud**. Single e Premium não rodam Node.js. 
- **Domínio novo:** registre `silsec-engenharia.com.br` no Registro.br (na consulta feita em 18/10/2026 ele aparecia livre; confirme na hora de registrar). No Registro.br, troque os servidores DNS para `ns1.dns-parking.com` e `ns2.dns-parking.com`. A propagação pode levar algumas horas.
- **Arquivo:** o pacote de produção é um `.zip` com o **conteúdo da pasta `sistema/`**, com `server.mjs` na raiz do zip (não dentro de uma subpasta). O pacote **não** leva as pastas `tests/`, `teste-claude/` e `docs/`, que servem só ao desenvolvimento. O zip que acompanha este guia (`silsec-producao-<data>.zip`) já vem assim; se for montar à mão, selecione os arquivos dentro de `sistema/`, exclua essas três pastas e compacte.

## 1. Criar o banco de dados

1. No hPanel, abra **Websites → (seu site) → Bancos de dados → Gerenciamento**.
2. Crie um banco MySQL e anote três dados: **nome do banco**, **usuário** e **senha** (a Hostinger acrescenta um prefixo como `u123456789_`).
3. O servidor do banco normalmente é `localhost`. Se o app não conectar, use o endereço indicado como "Host MySQL" na mesma tela.

Você não precisa criar tabelas nem rodar scripts SQL. Ao iniciar, o programa aplica sozinho as migrações de `db/mysql/` que ainda não foram aplicadas e registra cada uma na tabela `schema_migrations`. Uma migração que já tenha sido aplicada à mão (coluna, índice ou tabela já existentes) é reconhecida e pulada sem erro, portanto não há passo manual de banco em nenhuma instalação ou atualização.

## 2. Criar a caixa de e-mail que envia as mensagens

O sistema envia os links para criar senha, as chaves de acesso, as confirmações de pagamento e as mensagens do formulário de contato.

1. No hPanel, abra **E-mails** e crie a caixa **`contato@silsec-engenharia.com.br`**. O programa já vem configurado para enviar por ela; os destinatários veem o remetente "SilSec Engenharia <contato@silsec-engenharia.com.br>" e as respostas chegam nessa mesma caixa.
2. Os dados de envio da Hostinger são: servidor `smtp.hostinger.com`, porta `465` (SSL), com o e-mail completo como usuário e a senha da caixa.

Se o e-mail ainda não estiver configurado, o programa funciona mesmo assim: os links de confirmação aparecem em **Logs** do app no hPanel, e você pode copiá-los de lá.

## 3. (Opcional) Ativar a IA pelo Hostinger AI Router

A IA lê contas de energia e faz a triagem de contratos de fornecedores. Sem ela, o programa funciona normalmente e esses campos são preenchidos à mão.

1. No hPanel, abra **AI Router**, compre créditos e gere uma **chave de API**.
2. Anote o **endereço da API (base URL)** e o **nome exato do modelo** que aparecem no painel. Para usar Claude, escolha um modelo Claude e use o formato Anthropic.
3. Você vai colocar esses dados nas variáveis `AI_API_KEY`, `AI_BASE_URL` e `AI_MODEL` (passo 4).

## 4. Ligar o pagamento pelo Mercado Pago

Sem esta etapa o site funciona, mas o cliente vê "Pagar pelo WhatsApp" em vez do botão de pagamento.

1. Entre em **mercadopago.com.br/developers**, abra **Suas integrações** e crie uma aplicação do tipo **Pagamentos on-line → Checkout Pro**.
2. Em **Credenciais de produção**, copie o **Access Token** (começa com `APP_USR-`). Ele vai na variável `MP_ACCESS_TOKEN`.
3. Na mesma aplicação, abra **Webhooks → Configurar notificações**:
   - URL de produção: `https://silsec-engenharia.com.br/webhooks/mercadopago`
   - Evento: **Pagamentos**
   - Salve e copie a **assinatura secreta**. Ela vai na variável `MP_WEBHOOK_SECRET`.
4. Para testar antes de cobrar de verdade, use as **credenciais de teste** e `MP_SANDBOX=true`. Depois troque pelas de produção e apague `MP_SANDBOX`.

Quando o pagamento é aprovado, o sistema confere o valor direto no Mercado Pago, libera 12 meses (contados a partir do fim do acesso atual, inclusive do teste de 30 dias) e envia confirmação para o cliente e para você.

## 5. Publicar o programa

1. No hPanel: **Websites → Adicionar site → Node.js Web App → Enviar seus arquivos**. Se o domínio já tem um site na Hostinger, remova o site antigo antes.
   - **Não** use "Migrar site", "Enviar site" nem o Gerenciador de Arquivos/`public_html`: esses caminhos são para sites PHP/HTML e mostram o erro "Não foi possível reconhecer seu site".
   - Se a opção **Node.js Web App** não aparecer, o plano contratado não roda Node.js (Single e Premium não rodam). É preciso o Business/Unlimited ou um plano Cloud.
2. Envie o `.zip` de produção (conteúdo de `sistema/`, com `server.mjs` na raiz; ver "Antes de começar").
3. Confira as configurações:

| Campo | Valor |
|---|---|
| Framework | **Express** (deve ser detectado sozinho; se não for, escolha Express ou Other) |
| Versão do Node.js | **22** |
| Comando de build | `npm run build` |
| Arquivo de entrada | `server.mjs` |
| Diretório de saída | deixe em branco |

4. Em **Variáveis de ambiente**, cadastre:

| Variável | Exemplo | Para que serve |
|---|---|---|
| `NODE_ENV` | `production` | modo de produção |
| `SITE_OWNER_EMAIL` | `fabiosecco@hotmail.com` (e-mail do administrador do sistema; não precisa ser a caixa de envio) | quem cria conta com este e-mail vira administrador |
| `APP_URL` | `https://silsec-engenharia.com.br` | endereço usado nos links dos e-mails |
| `DB_HOST` | `localhost` | servidor do banco |
| `DB_NAME` | `u123456789_silsec` (o nome criado no passo 1, com o prefixo da Hostinger) | nome do banco |
| `DB_USER` | `u123456789_silsec` (o usuário criado no passo 1) | usuário do banco |
| `DB_PASSWORD` | (senha do banco) | senha do banco |
| `SMTP_PASSWORD` | (senha da caixa contato@silsec-engenharia.com.br) | ativa o envio de e-mails (servidor, porta e remetente já vêm configurados) |
| `MP_ACCESS_TOKEN` | `APP_USR-…` | liga o pagamento da anuidade pelo Mercado Pago |
| `MP_WEBHOOK_SECRET` | (assinatura secreta do webhook) | confere as notificações do Mercado Pago |
| `PRECO_COMPLETO_ANUAL` | `797` | opcional: preço do plano Completo, em reais |
| `PRECO_BASICO_ANUAL` | `397` | opcional: preço do plano Básico, em reais |
| `MP_PARCELAS` | `1` | opcional: parcelas máximas no cartão (padrão 1) |
| `AI_FORMAT` | `anthropic` | opcional: formato da IA (`anthropic` para Claude, `openai` para o formato OpenAI) |
| `AI_API_KEY` | (chave do AI Router) | opcional |
| `AI_BASE_URL` | (endereço do AI Router) | opcional |
| `AI_MODEL` | (nome do modelo) | opcional |

5. Clique em **Deploy**. Ao terminar, abra `https://silsec-engenharia.com.br/saude`. A resposta deve conter `"ok":true` e `"banco":"mysql"`.

## 6. Primeiro acesso

1. Abra `silsec-engenharia.com.br/cadastrar` e informe seu nome e **o mesmo e-mail de `SITE_OWNER_EMAIL`**.
2. Abra o link que chegar por e-mail e crie sua senha. Você entra como **administrador**.
3. Em **Projetos e ferramentas → Equipe e acessos**, cadastre os e-mails da sua equipe. Cada pessoa abre o site, clica em **Criar conta** com o e-mail cadastrado e cria a própria senha pelo link recebido.
4. Fornecedores convidados para um projeto criam a conta pelo próprio link do convite.

## 7. Como os clientes entram

**Teste grátis (caminho principal).** Qualquer pessoa abre `silsec-engenharia.com.br`, clica em **Testar grátis**, informa nome e e-mail, cria a senha pelo link e usa o plano Completo por 30 dias. Cada e-mail tem direito a um teste. Perto do fim, o programa avisa por e-mail; o cliente paga a anuidade em **Assinatura** e a liberação é automática.

**Estudantes.** Depois de criar a conta, o estudante envia o comprovante de matrícula em **Assinatura → Acesso educacional**. Você aprova no programa (**Assinatura → Administração de licenças**) e ele ganha 6 meses.

**Chaves de cortesia.** Para parcerias, turmas de faculdade ou clientes especiais:

1. Abra **`silsec-engenharia.com.br/painel`** (ou o link **Painel** no topo do programa).
2. Em **Nova chave de acesso**, preencha nome, e-mail, empresa ou instituição e uma referência (ex.: nome da turma). Escolha o plano e os dias grátis e clique em **Criar chave**.
3. A pessoa recebe a chave (`FSC-XXXX-XXXX-XXXX`) e o link de ativação, cria a senha e ganha o acesso.
4. No Painel você acompanha chaves, clientes com acesso, pagamentos e mensagens do site. Se o e-mail não chegar, use **Gerar nova e reenviar**: a chave antiga deixa de valer.

A tela **Criar conta** comum (`/cadastrar`) continua restrita aos e-mails cadastrados por você, aos convidados de projetos e a quem fez o teste grátis. Para mudar isso, use a variável `SIGNUP_MODE` (`membros`, `aberto` ou `fechado`).

## Projetos da versão anterior

Os estudos salvos na hospedagem antiga não são transferidos automaticamente. Na versão antiga, exporte cada estudo em JSON e, na nova, use a importação de arquivo do próprio programa.

## Atualizar o programa

Antes de cada atualização, faça a **cópia de segurança** descrita abaixo. Depois:

1. Envie o novo `.zip` de produção pelo mesmo painel (**Websites → (seu site) → Deploy**) e clique em **Deploy**.
2. Ao iniciar, o programa aplica sozinho as migrações novas e registra-as em `schema_migrations`. Não rode SQL à mão.
3. Abra `/saude` e confirme `"ok":true` e `"banco":"mysql"`; entre no programa e confira a versão no rodapé.

Os dados ficam no MySQL e não se perdem. Os anexos (logomarcas, contas, contratos, fotos de vistoria e relatórios arquivados) também ficam guardados no banco.

## Cópia de segurança antes do deploy

Faça sempre, em qualquer instalação ou atualização, antes de clicar em **Deploy**:

1. **Banco:** no hPanel, **Bancos de dados → phpMyAdmin**, selecione o banco e use **Exportar → Rápido → SQL**. Guarde o arquivo com a data no nome (ex.: `silsec-2026-11-09.sql`). Alternativa: hPanel → **Backups** → gerar um backup novo do banco.
2. **Variáveis de ambiente:** em **Websites → (seu site) → Variáveis de ambiente**, copie nome e valor de todas as variáveis para um arquivo de texto guardado fora da hospedagem (elas não vão no zip e não aparecem no backup do banco).
3. **Pacote atual:** guarde o `.zip` da versão que está no ar, para poder voltar a ela.

## Roteiro de volta (rollback)

Se, depois do deploy, o programa não abrir, `/saude` falhar ou algo essencial parar de funcionar:

1. Em **Deploy**, envie o `.zip` da versão anterior (guardado no item 3 acima) e faça **Deploy** de novo. Se as variáveis de ambiente foram alteradas na atualização, restaure os valores copiados no item 2.
2. Se a versão nova tiver aplicado migrações novas, a versão anterior em geral continua funcionando com elas, porque as migrações só acrescentam colunas, índices e tabelas. Se mesmo assim houver erro de banco, restaure o `.sql` do item 1 pelo **phpMyAdmin → Importar** (apague antes as tabelas atuais ou importe em um banco vazio e aponte `DB_NAME`/`DB_USER`/`DB_PASSWORD` para ele).
3. Confira `/saude`, entre no programa e abra um estudo salvo.
4. Anote a mensagem de erro de **Logs** do app para enviar ao desenvolvimento.

## Cópias de segurança periódicas

- A Hostinger faz backups automáticos do banco (hPanel → **Backups**). Você também pode baixar uma cópia do banco pelo **phpMyAdmin**.
- Dentro do programa, a administração tem a exportação geral de dados.

## Se algo der errado

| Sintoma | O que verificar |
|---|---|
| `/saude` não abre ou o deploy falha | Em **Logs** do app, procure a mensagem de erro. Confira se o arquivo de entrada é `server.mjs` e o Node é 22. |
| "Configuração incompleta" no log | Falta `DB_NAME`, `DB_USER` ou `DB_PASSWORD`. |
| Erro de conexão com o banco | Troque `DB_HOST` de `localhost` para o host MySQL mostrado no hPanel, ou o contrário. |
| O e-mail com o link não chega | Veja a caixa de spam. Confira `SMTP_PASSWORD` (a senha da caixa de envio). O link também aparece em **Logs**. |
| "Sua conta ainda não tem acesso autorizado à equipe" | O e-mail ainda não foi cadastrado em **Equipe e acessos**. |
| A IA responde "indisponível" | Confira a chave, o endereço e o nome do modelo no AI Router, e se há créditos. O motivo aparece em **Logs**. Se o roteador exigir outro cabeçalho, defina `AI_AUTH_HEADER=bearer`. |
| Esqueci a senha do administrador | Use **Esqueci minha senha** na tela de entrada. |
| O cliente pagou, mas o acesso não foi liberado | Confira no Painel → Pagamentos. "Aguardando" indica que o Mercado Pago ainda não aprovou. "Valor divergente" indica que o valor pago não bate com o preço do plano. Confira também `MP_ACCESS_TOKEN` e a URL do webhook. |
| A chave "não foi encontrada" | A chave foi digitada errada, cancelada ou substituída por uma nova. Gere outra no Painel. |
