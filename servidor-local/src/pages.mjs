// Páginas do servidor local. Sem scripts inline: a CSP só permite arquivos do próprio servidor.
const head=title=>`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#142c38">
<title>${title}</title>
<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/favicon.svg"><link rel="apple-touch-icon" href="/icons/icon-192.png">
<link rel="stylesheet" href="/local.css">
</head>`;

export function loginPage(){
 return `${head('Entrar | SilSec')}
<body class="local-page">
<main class="local-card">
 <img src="/favicon.svg" alt="" width="48" height="48">
 <h1>SilSec · Estudos de tráfego</h1>
 <p class="local-muted">Servidor local. Os cálculos são feitos neste aparelho; o servidor guarda os estudos.</p>
 <form id="login" autocomplete="on">
  <label>E-mail<input id="email" type="email" autocomplete="username" required></label>
  <label>Senha<input id="password" type="password" autocomplete="current-password" required minlength="12"></label>
  <label id="totp-field" hidden>Código do autenticador<input id="totp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7"></label>
  <button type="submit">Entrar</button>
  <p id="message" role="status" aria-live="polite"></p>
 </form>
 <p class="local-muted small">Sem conta? Peça ao administrador do servidor.</p>
</main>
<script type="module" src="/entrar.js"></script>
</body>
</html>`;
}

export function accountPage(){
 return `${head('Minha conta | SilSec')}
<body class="local-page">
<main class="local-card wide">
 <p><a href="/">← Voltar aos estudos</a></p>
 <h1>Minha conta</h1>
 <p id="who" class="local-muted"></p>
 <section>
  <h2>Trocar senha</h2>
  <form id="password-form">
   <label>Senha atual<input id="current" type="password" autocomplete="current-password" required></label>
   <label>Nova senha (mínimo 12 caracteres)<input id="new-password" type="password" autocomplete="new-password" required minlength="12"></label>
   <label id="pw-totp-field" hidden>Código do autenticador<input id="pw-totp" inputmode="numeric" maxlength="7"></label>
   <button type="submit">Trocar senha</button>
  </form>
 </section>
 <section>
  <h2>Verificação em duas etapas</h2>
  <p id="totp-status" class="local-muted"></p>
  <button id="totp-start" type="button">Configurar aplicativo autenticador</button>
  <div id="totp-setup" hidden>
   <p>No aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Aegis, 2FAS), adicione uma conta pela chave abaixo e informe o código gerado.</p>
   <p><code id="totp-secret"></code></p>
   <p><a id="totp-link" href="#">Abrir no aplicativo autenticador deste aparelho</a></p>
   <form id="totp-confirm"><label>Código de 6 dígitos<input id="totp-code" inputmode="numeric" maxlength="7" required></label><button type="submit">Ativar</button></form>
  </div>
  <form id="totp-disable" hidden><label>Código atual para desativar<input id="totp-off-code" inputmode="numeric" maxlength="7" required></label><button type="submit" class="danger">Desativar</button></form>
 </section>
 <section id="admin" hidden>
  <h2>Contas de acesso (administrador)</h2>
  <p class="local-muted">Crie a conta com o mesmo e-mail cadastrado na equipe, convite de fornecedor ou cliente do sistema. A senha provisória aparece uma única vez.</p>
  <form id="create-form"><label>Nome<input id="new-name" required maxlength="120"></label><label>E-mail<input id="new-email" type="email" required></label><button type="submit">Criar conta</button></form>
  <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>2FA</th><th>Situação</th><th>Último acesso</th><th></th></tr></thead><tbody id="accounts"></tbody></table></div>
 </section>
 <section>
  <button id="logout" type="button" class="danger">Sair deste aparelho</button>
 </section>
 <p id="message" role="status" aria-live="polite"></p>
</main>
<script type="module" src="/conta.js"></script>
</body>
</html>`;
}

// Acrescenta manifesto, ícones e registro do service worker ao index.html original.
export function injectPwa(html){
 return html
  .replace('</head>','  <link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/favicon.svg"><link rel="apple-touch-icon" href="/icons/icon-192.png">\n  <link rel="stylesheet" href="/local.css">\n</head>')
  .replace('</body>','  <a class="local-account-link" href="/conta" title="Minha conta, senha e verificação em duas etapas">Conta</a>\n  <script type="module" src="/pwa-register.js"></script>\n</body>');
}
