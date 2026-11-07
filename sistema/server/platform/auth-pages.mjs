import {BRAND} from '../../public/brand.js';
// Páginas de acesso (HTML renderizado no servidor, sem JavaScript).
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

const css = `
.auth-wrap{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);background:var(--bg)}
.auth-side{background:var(--navy);color:#e8f1f2;padding:56px 52px;display:flex;flex-direction:column;justify-content:space-between}
.auth-logo{display:inline-block;background:#fff;border-radius:10px;padding:12px 18px}.auth-logo img{width:170px;height:auto;display:block}
.auth-side h2{font-size:30px;line-height:1.2;margin:40px 0 14px;font-weight:700;letter-spacing:-.01em;max-width:420px}
.auth-side p{color:#a9c0c6;font-size:14px;line-height:1.65;max-width:420px;margin:0}
.auth-contact{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#a9c0c6}.auth-contact strong{color:#e8f1f2;font-size:14px}.auth-contact a{color:#9fd8cc;text-decoration:none}.auth-contact a:hover{text-decoration:underline}
.auth-main{display:flex;align-items:center;justify-content:center;padding:40px 24px}
.auth-card{width:100%;max-width:400px}
.auth-card h1{font-size:24px;margin:0 0 6px;color:var(--ink)}
.auth-card .lead{color:var(--muted);font-size:13px;margin:0 0 26px;line-height:1.6}
.auth-card form{display:flex;flex-direction:column;gap:16px}
.auth-card .field input{font-size:14px;min-height:44px}
.auth-card .btn{min-height:44px;font-size:13px;width:100%}
.auth-links{display:flex;justify-content:space-between;gap:12px;margin-top:20px;font-size:12px;flex-wrap:wrap}
.auth-msg{border-radius:9px;padding:12px 14px;font-size:13px;line-height:1.55;margin:0 0 18px}
.auth-msg.erro{background:var(--red-bg);color:var(--red);border:1px solid #f1cdc9}
.auth-msg.ok{background:var(--teal-light);color:#176352;border:1px solid #d1e9df}
.auth-hint{font-size:11px;color:var(--muted);margin-top:-8px}
@media (max-width:820px){.auth-contact{display:none}.auth-foot-contact{display:block!important}.auth-wrap{grid-template-columns:1fr;grid-template-rows:auto 1fr}.auth-main{align-items:flex-start;padding-top:36px}.auth-side{padding:16px 20px}.auth-side h2,.auth-side p{display:none}.auth-side{flex-direction:row;align-items:center}.auth-logo img{width:120px}.auth-logo{padding:8px 12px}}
`;

export function page({title, heading, lead = '', body, message = null}) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#142c38">
<title>${esc(title)} · ${esc(BRAND.name)}</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/styles.css"><style>${css}</style></head>
<body><div class="auth-wrap">
<aside class="auth-side"><div><span class="auth-logo"><img src="${BRAND.logo}" alt="${esc(BRAND.name)}" width="480" height="200"></span>
<h2>Estudos de tráfego de elevadores, do cadastro ao relatório.</h2>
<p>Motores NBR e ISO independentes, escadas rolantes, propostas de fornecedores, relatórios e apresentações em um só lugar.</p></div>
<div class="auth-contact"><strong>${esc(BRAND.name)}</strong><a href="${BRAND.phoneHref}">${esc(BRAND.phone)}</a><a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a><small style="display:block;margin-top:10px;opacity:.8">${esc(BRAND.credit)} · ${esc(BRAND.creditPhone)}</small></div></aside>
<main class="auth-main" id="main"><div class="auth-card">
<h1>${esc(heading)}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}
${message ? `<p class="auth-msg ${message.kind === 'ok' ? 'ok' : 'erro'}" role="${message.kind === 'ok' ? 'status' : 'alert'}">${esc(message.text)}</p>` : ''}
${body}
<p class="auth-foot-contact" style="display:none;margin-top:28px;font-size:12px;color:var(--muted)">${esc(BRAND.name)} · <a href="${BRAND.phoneHref}">${esc(BRAND.phone)}</a> · <a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a></p>
</div></main></div></body></html>`;
}

const field = (label, name, type, attrs = '') => `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" ${attrs}></div>`;
const hidden = (name, value) => `<input type="hidden" name="${name}" value="${esc(value)}">`;

export const loginPage = ({email = '', next = '/', message, signup = true}) => page({
  title: 'Entrar', heading: 'Entrar', lead: 'Use o e-mail e a senha da sua conta.', message,
  body: `<form method="post" action="/entrar">${hidden('volta', next)}
${field('E-mail', 'email', 'email', `autocomplete="email" required maxlength="254" value="${esc(email)}"`)}
${field('Senha', 'senha', 'password', 'autocomplete="current-password" required maxlength="200"')}
<button class="btn primary" type="submit">Entrar</button></form>
<div class="auth-links"><a href="/esqueci-senha">Esqueci minha senha</a>${signup ? `<a href="/cadastrar?volta=${encodeURIComponent(next)}">Criar conta</a>` : ''}</div>`,
});

export const signupPage = ({email = '', name = '', next = '/', message}) => page({
  title: 'Criar conta', heading: 'Criar conta', message,
  lead: 'Use o mesmo e-mail que a administração cadastrou para você ou que recebeu no convite. Enviaremos um link para você confirmar o e-mail e criar sua senha.',
  body: `<form method="post" action="/cadastrar">${hidden('volta', next)}
${field('Nome', 'nome', 'text', `autocomplete="name" required maxlength="200" value="${esc(name)}"`)}
${field('E-mail', 'email', 'email', `autocomplete="email" required maxlength="254" value="${esc(email)}"`)}
<button class="btn primary" type="submit">Enviar link de confirmação</button></form>
<div class="auth-links"><a href="/entrar?volta=${encodeURIComponent(next)}">Já tenho conta</a></div>`,
});

export const forgotPage = ({email = '', message}) => page({
  title: 'Recuperar senha', heading: 'Recuperar senha', message,
  lead: 'Informe o e-mail da conta. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha.',
  body: `<form method="post" action="/esqueci-senha">
${field('E-mail', 'email', 'email', `autocomplete="email" required maxlength="254" value="${esc(email)}"`)}
<button class="btn primary" type="submit">Enviar link</button></form>
<div class="auth-links"><a href="/entrar">Voltar para entrar</a></div>`,
});

export const resetPage = ({token, message, action = '/redefinir-senha', next = '/', heading = 'Criar nova senha', email = '', button = action === '/verificar' ? 'Criar senha e entrar' : 'Salvar nova senha'}) => page({
  title: heading, heading, message, lead: email ? esc(email) : '',
  body: `<form method="post" action="${action}">${hidden('token', token)}${hidden('volta', next)}
${field('Nova senha', 'senha', 'password', 'autocomplete="new-password" required minlength="10" maxlength="200"')}
<p class="auth-hint">Mínimo de 10 caracteres.${action === '/verificar' ? '' : ' As sessões abertas em outros aparelhos serão encerradas.'}</p>
<button class="btn primary" type="submit">${button}</button></form>`,
});

export const accountPage = ({user, message}) => page({
  title: 'Minha conta', heading: 'Minha conta', message,
  lead: `${esc(user.name)} · ${esc(user.email)}`,
  body: `<form method="post" action="/conta">
${field('Senha atual', 'senha_atual', 'password', 'autocomplete="current-password" required maxlength="200"')}
${field('Nova senha', 'senha', 'password', 'autocomplete="new-password" required minlength="10" maxlength="200"')}
<button class="btn primary" type="submit">Alterar senha</button></form>
<div class="auth-links"><a href="/">Voltar ao programa</a><a href="/sair">Sair</a></div>`,
});

export const infoPage = ({title, heading, text, link = '/entrar', linkText = 'Ir para entrar', kind = 'ok'}) => page({
  title, heading, message: {kind, text},
  body: `<a class="btn" href="${esc(link)}">${esc(linkText)}</a>`,
});
