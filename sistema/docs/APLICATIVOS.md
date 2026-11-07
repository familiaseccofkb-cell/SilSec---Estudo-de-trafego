# SilSec · aplicativos para computador, Android e iPhone

Todos os aplicativos usam o **mesmo banco de dados do site `silsec-engenharia.com.br`**. Um estudo salvo no celular aparece no computador e vice-versa; acessos, planos e bloqueios definidos no console do desenvolvedor valem em todos os aparelhos ao mesmo tempo.

| Aparelho | Como o cliente instala | Arquivo ou passo |
|---|---|---|
| Windows | **`Instalar SilSec.exe`**: instalador que cria atalhos em janela própria (Edge ou Chrome) e registra em Configurações → Aplicativos | pacote `SilSec_Instaladores_Windows.zip` (alternativa por script: `SilSec_App_Windows.zip`) |
| Windows sem internet | **`Instalar SilSec Offline.exe`**: programa completo no computador, estudos só naquele computador | mesmo pacote (alternativa por script: `SilSec_Windows.zip`) |
| Windows, macOS, Linux (sem instalador) | Abrir o site no Edge ou Chrome e clicar em **Instalar aplicativo** na barra de endereço | — |
| Android | Chrome → menu ⋮ → **Instalar aplicativo** (ou pela Play Store, depois de publicado) | — |
| iPhone e iPad | Safari → Compartilhar → **Adicionar à Tela de Início** (ou pela App Store, depois de publicado) | — |

O aplicativo abre em tela cheia, com ícone próprio, e mostra um aviso amigável quando o aparelho está sem internet. Atualizações no servidor chegam automaticamente a todos os aparelhos.

## Publicar nas lojas (opcional)

O site já está preparado como aplicativo instalável (manifesto, ícones, service worker e vínculo Android). Para aparecer na Play Store e na App Store é preciso empacotar com as **suas** contas de desenvolvedor:

| Loja | Conta | Custo |
|---|---|---|
| Google Play | Google Play Console | US$ 25, pagamento único |
| Apple App Store | Apple Developer Program | US$ 99 por ano |

### Android (Play Store)

1. Com o site no ar, abra **https://www.pwabuilder.com**, informe `https://silsec-engenharia.com.br` e escolha **Android → Generate Package**.
2. Use o nome do pacote `br.com.silsecengenharia.app` (ou outro de sua escolha) e baixe o pacote. Guarde o arquivo de chave (`signing.keystore`) e as senhas em lugar seguro: sem eles não é possível atualizar o app.
3. O PWABuilder mostra a **impressão digital SHA-256** da chave. No hPanel, nas variáveis do Node.js Web App, cadastre:
   - `ANDROID_PACKAGE_NAME=br.com.silsecengenharia.app`
   - `ANDROID_SHA256_FINGERPRINTS=` a impressão digital (se a Play Store reassinar o app, acrescente também a impressão da "chave de assinatura do app" do Play Console, separadas por vírgula).
4. Reinicie o app e confira `https://silsec-engenharia.com.br/.well-known/assetlinks.json`. Sem esse vínculo o Android mostra uma barra de endereço no topo do app.
5. No Play Console, crie o app, envie o arquivo `.aab`, preencha a ficha (descrição, capturas de tela, política de privacidade) e publique.

### iPhone e iPad (App Store)

1. No PWABuilder, escolha **iOS → Generate Package**. Ele gera um projeto do Xcode.
2. É preciso um Mac com Xcode e a conta Apple Developer para compilar e enviar ao App Store Connect.
3. A Apple costuma recusar apps que são apenas um site. Destaque na ficha o que o app faz no aparelho (vistorias com fotos da câmera, uso em tela cheia). Se preferir evitar a análise da Apple, oriente os clientes a usar **Adicionar à Tela de Início** no Safari, que funciona igual.

## Console do desenvolvedor (`/admin`)

Programa de gerenciamento de todos os dados, acessível no navegador ou pelo atalho **SilSec Console** (instalador `Instalar SilSec (desenvolvedor).exe`). Só entra quem tem papel **Administrador** ativo (o dono, definido em `SITE_OWNER_EMAIL`, sempre entra).

| Tela | O que permite |
|---|---|
| Visão geral | Quantidade de usuários, acessos ativos, testes, recebimentos em 30 dias, projetos, vistorias, pendências, situação de banco, e-mail, Mercado Pago e IA, e a lista de **renovações a tratar** (acessos que vencem em 30 dias e testes que terminam em 7 dias) |
| Usuários e acessos | Buscar; baixar CSV para o Excel; cadastrar usuário e enviar link de senha; mudar papel; conceder ou revogar acesso Básico/Completo por N dias ou permanente; desbloquear conta; confirmar e-mail; enviar link de nova senha; encerrar sessões em todos os aparelhos; desativar/reativar; ver projetos, pagamentos e sessões |
| Pagamentos | Aprovar manualmente um pagamento pendente; registrar pagamento recebido por Pix, transferência ou boleto, liberando 12 meses |
| Projetos | Buscar qualquer projeto e baixar o JSON |
| Sistema e manutenção | Ligar/desligar o **modo de manutenção** (bloqueia site, API e aplicativos para quem não é administrador, com mensagem); aviso para todos os usuários; **cópia de segurança** completa em JSON; migrações aplicadas |
| Auditoria | Todas as ações do console e do sistema, com autor e data |

### Intervenção humana em caso de problema

- **Pagamento caiu e o Mercado Pago não confirmou:** Pagamentos → Aprovar manualmente, ou Registrar pagamento recebido.
- **Cliente não recebe e-mail:** Usuários → Confirmar e-mail manualmente → Enviar link de nova senha (o link também aparece nos logs do servidor se o e-mail estiver desligado).
- **Conta bloqueada por senha errada:** Usuários → Desbloquear conta.
- **Aparelho perdido ou acesso indevido:** Usuários → Encerrar sessões em todos os aparelhos e, se preciso, Desativar membro.
- **Atualização ou falha no sistema:** Sistema → Ligar manutenção; os clientes veem a mensagem e você continua usando para conferir. Desligue ao terminar.
- **Antes de mudanças grandes:** Sistema → Baixar cópia de segurança (a Hostinger também guarda cópias completas do banco em Backups).
