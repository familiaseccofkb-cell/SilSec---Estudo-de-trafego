// Site institucional da SilSec Engenharia e páginas de ativação, assinatura e painel.
import {BRAND} from '../../public/brand.js';
import {brl, perMonth} from '../platform/plans.mjs';

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap">';
const waLink = text => `${BRAND.whatsappHref}?text=${encodeURIComponent(text)}`;

function head({title, description, index = false, canonical = ''}) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="robots" content="${index ? 'index,follow' : 'noindex,nofollow'}"><meta name="theme-color" content="#142c38">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg"><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="SilSec"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><script src="/pwa.js" defer></script>${FONTS}<link rel="stylesheet" href="/site.css"></head>`;
}

function header({session, minimal = false}) {
  const area = session ? `<a class="button small teal" href="/sistema">Abrir o programa</a>` : `<a href="/entrar?volta=%2Fsistema">Entrar</a><a class="button small teal" href="/experimentar">Testar grátis</a>`;
  return `<a class="skip" href="#conteudo">Ir para o conteúdo</a><header class="site-head"><div class="wrap">
<a class="logo" href="/" aria-label="${esc(BRAND.name)} · início"><img src="${BRAND.logo}" alt="${esc(BRAND.name)}" width="480" height="200"></a>
${minimal ? `<nav class="site-nav" aria-label="Principal">${session ? '<a href="/vistorias">Vistorias</a><a href="/assinatura">Assinatura</a><a href="/sair">Sair</a>' : ''}${area}</nav>` :
`<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
<nav class="site-nav" id="menu" aria-label="Principal"><a href="/#plataforma">Plataforma</a>${BRAND.videos.length ? '<a href="/#videos">Vídeos</a>' : ''}<a href="/#planos">Planos</a><a href="/#estudantes">Estudantes</a><a href="/#contato">Contato</a>${area}</nav>`}
</div></header>`;
}

function footer() {
  return `<footer class="site-foot"><div class="wrap">
<div><strong>${esc(BRAND.name)}</strong>Plataforma on-line de estudos de tráfego de elevadores.</div>
<div><a href="${BRAND.phoneHref}">${esc(BRAND.phone)}</a><br><a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a></div>
<div><a href="/experimentar">Testar 30 dias grátis</a><br><a href="/entrar?volta=%2Fsistema">Entrar</a><br><a href="/ativar">Ativar chave de acesso</a></div>
<div>© ${new Date().getFullYear()} ${esc(BRAND.name)}</div>
${BRAND.credit ? `<p class="credit">${esc(BRAND.credit)}</p>` : ''}
</div></footer>`;
}

const NAV_SCRIPT = `<script>(()=>{const b=document.querySelector('.nav-toggle'),n=document.getElementById('menu');if(b&&n){b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);});n.addEventListener('click',e=>{if(e.target.tagName==='A'){n.classList.remove('open');b.setAttribute('aria-expanded','false');}});}})();</script>`;

// Indicador de andar: um único movimento, ao abrir a página (desligado para quem pede menos movimento).
const HERO_SCRIPT = `<script>(()=>{const car=document.querySelector('.car'),out=document.querySelector('.indicator output'),arrow=document.querySelector('.indicator .arrow');if(!car||!out)return;const target=9,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduce){car.style.setProperty('--floor',target);out.value=target;arrow.textContent='';return;}requestAnimationFrame(()=>setTimeout(()=>{car.style.setProperty('--floor',target);const t0=performance.now(),d=2600;const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;const tick=t=>{const p=Math.min(1,(t-t0)/d);out.value=Math.round(ease(p)*target)||'T';if(p<1)requestAnimationFrame(tick);else arrow.textContent='';};requestAnimationFrame(tick);},400));})();</script>`;

function shaftDiagram() {
  const floors = 12;
  const labels = Array.from({length: floors}, (_, i) => `<li>${i === 0 ? 'T' : i}</li>`).join('');
  const slabs = Array.from({length: floors}, () => '<div></div>').join('');
  return `<figure class="shaft" aria-label="Corte de um edifício com o elevador subindo do térreo ao 9º andar">
<div class="indicator"><span>Andar</span><div style="display:flex;align-items:center"><output>T</output><span class="arrow" aria-hidden="true">▲</span></div></div>
<div class="building" aria-hidden="true"><ol class="floors">${labels}</ol><div class="slab">${slabs}</div><div class="well"><div class="car"></div></div><div class="slab">${slabs}</div></div>
<figcaption class="building-caption">Cada estudo começa pela população de cada andar e termina no intervalo e no tempo de espera que o edifício vai oferecer.</figcaption>
</figure>`;
}



const YT_ID = /^[A-Za-z0-9_-]{11}$/;
function videosSection() {
  const list = BRAND.videos.filter(v => YT_ID.test(v.id));
  if (!list.length) return '';
  const [main, ...rest] = list;
  return `<section class="section" id="videos"><div class="wrap">
<div class="section-head"><h2>Veja em vídeo</h2><p class="lead">Por que o estudo de tráfego importa e como a plataforma ajuda a decidir quantos elevadores, de que capacidade e velocidade.</p></div>
<div class="video-main"><iframe src="https://www.youtube-nocookie.com/embed/${main.id}?rel=0" title="${esc(main.title)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
${rest.length ? `<ul class="video-list">${rest.map(v => `<li><a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy"><span>${esc(v.title)}</span></a></li>`).join('')}</ul>` : ''}
</div></section>`;
}

export function homePage({plans, session, message}) {
  const plan = p => `<article class="plan${p.id === 'advanced' ? ' featured' : ''}"><h3>${esc(p.name)}${p.id === 'advanced' ? '<span class="tag">Mais escolhido</span>' : ''}</h3>
<div class="price"><strong>${brl(p.annualCents)}</strong><span>por ano</span></div><div class="per">Equivale a ${perMonth(p.annualCents)} por mês</div>
<p>${esc(p.summary)}</p><ul>${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
<a class="button${p.id === 'advanced' ? ' teal' : ' ghost'}" href="/experimentar">Começar teste grátis</a></article>`;
  const msg = message ? `<p class="notice ${message.kind}" role="status">${esc(message.text)}</p>` : '';
  return `${head({title: `${BRAND.name} · estudo de tráfego de elevadores on-line (NBR 5665 e ISO 8100-32)`, description: 'Plataforma on-line de estudo de tráfego de elevadores: população, intervalo e capacidade pela NBR 5665 e ISO 8100-32, relatório e PowerPoint. Teste 30 dias grátis.', index: true})}
<body>${header({session})}
<main id="conteudo">
<section class="hero"><div class="wrap">
<div><h1>Estudo de tráfego de elevadores em minutos, não em dias.</h1>
<p class="lead">Plataforma on-line para calcular população, intervalo e capacidade de transporte pela NBR 5665 e pela ISO 8100-32, com memória de cálculo, relatório em PDF e apresentação em PowerPoint. Para engenheiros, arquitetos, construtoras e estudantes.</p>
<div class="hero-actions"><a class="button teal" href="/experimentar">Testar 30 dias grátis</a><a class="button ghost" href="#plataforma">Ver o que a plataforma faz</a></div>
<p class="hero-contact">Ou ligue: <a href="${BRAND.phoneHref}">${esc(BRAND.phone)}</a> · <a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a></p></div>
${shaftDiagram()}
</div></section>

<section class="section platform" id="plataforma"><div class="wrap">
<div class="section-head"><h2>A plataforma de estudo de tráfego</h2><p>Você mesmo faz o estudo: cadastra o edifício, calcula a população andar por andar, testa quantidade, capacidade e velocidade dos elevadores e compara cenários e propostas de fabricantes com os mesmos critérios técnicos.</p></div>
<div class="platform-grid">
<div class="screen"><div class="bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="/site/plataforma.png" alt="Tela da plataforma com as etapas do estudo: cadastro, parâmetros, cálculo populacional, gráficos e cálculo de tráfego" width="1366" height="860" loading="lazy"></div>
<ul class="features">
<li><strong>Cálculo pela NBR 5665 e pela ISO 8100-32</strong><span>Os dois métodos rodam de forma independente, com a memória de cálculo de cada um.</span></li>
<li><strong>População por andar e ambiente</strong><span>Escritórios, apartamentos, hotéis, hospitais, escolas, lojas e garagens, com os descontos da norma.</span></li>
<li><strong>Propostas de fornecedores</strong><span>Fornecedores convidados preenchem a proposta, e a comparação técnica e comercial sai pronta.</span></li>
<li><strong>Relatório e apresentação</strong><span>Relatório para imprimir ou salvar em PDF e apresentação editável em PowerPoint.</span></li>
</ul></div>
</div></section>

${videosSection()}
<section class="section" id="acesso"><div class="wrap">
<div class="section-head"><h2>Como começar</h2><p class="lead">Você faz o cadastro, testa e só paga se quiser continuar. Sem contrato e sem fidelidade.</p></div>
<ol class="steps">
<li><h3>Crie sua conta</h3><p>Em <a href="/experimentar">Testar grátis</a>, informe nome e e-mail. Você recebe um link para criar a senha. Não pedimos cartão.</p></li>
<li><h3>Use 30 dias o plano Completo</h3><p>NBR 5665, ISO 8100-32, população por andar, gráficos, propostas de fornecedores, relatório e PowerPoint.</p></li>
<li><h3>Continue com a anuidade</h3><p>Se quiser continuar, pague a anuidade pelo Mercado Pago, com Pix ou cartão. A liberação é automática.</p></li>
</ol>
</div></section>

<section class="section" id="planos"><div class="wrap">
<div class="section-head"><h2>Planos</h2><p class="lead">Um pagamento por ano, sem fidelidade. Se a anuidade vencer, seus estudos continuam guardados e o último relatório pode ser baixado.</p></div>
<div class="plans">${plan(plans.basic)}${plan(plans.advanced)}</div>
<p class="plans-note">Pagamento com Pix ou cartão de crédito pelo Mercado Pago. Precisa de acessos para a sua equipe, empresa ou turma de faculdade? <a href="#contato">Fale com a gente</a>.</p>
</div></section>

<section class="section" id="estudantes"><div class="wrap">
<div class="section-head"><h2>Para estudantes de engenharia e arquitetura</h2><p class="lead">Aprenda estudo de tráfego fazendo: a plataforma mostra cada passo do cálculo, da população ao intervalo, com a memória de cálculo da NBR 5665 e da ISO 8100-32.</p></div>
<ol class="steps">
<li><h3>6 meses grátis</h3><p>Crie sua conta e envie o comprovante de matrícula em Assinatura → Acesso educacional. Renova enquanto você estiver matriculado.</p></li>
<li><h3>Para TCC e trabalhos</h3><p>Relatório com memória de cálculo, premissas e referências normativas, pronto para anexar ou apresentar em PowerPoint.</p></li>
<li><h3>Para professores</h3><p>Acessos para turmas inteiras, com chave de ativação por aluno. <a href="#contato">Fale com a gente</a>.</p></li>
</ol>
</div></section>

<section class="section" id="aplicativo"><div class="wrap about">
<h2>No computador e no celular</h2>
<div><p class="lead">O SilSec funciona como aplicativo no Windows, no Android e no iPhone, sempre com os mesmos dados: comece o estudo no escritório e faça a vistoria no celular.</p>
<ul><li><strong>Computador:</strong> no Edge ou Chrome, clique em <em>Instalar aplicativo</em> na barra de endereço.</li><li><strong>Android:</strong> no Chrome, menu ⋮ → <em>Instalar aplicativo</em>.</li><li><strong>iPhone e iPad:</strong> no Safari, Compartilhar → <em>Adicionar à Tela de Início</em>.</li></ul></div>
</div></section>

<section class="section" id="sobre"><div class="wrap about">
<h2>Sobre a SilSec</h2>
<div><p class="lead">A ${esc(BRAND.name)} foi criada para tornar o estudo de tráfego de elevadores acessível a quem projeta, especifica e compra elevadores: engenheiros, arquitetos, construtoras e estudantes.</p>
<p>Cada resultado vem com a memória de cálculo e as premissas usadas, para que você entenda e possa conferir a decisão.</p></div>
</div></section>

<section class="section" id="contato"><div class="wrap contact">
<div><h2>Fale com a SilSec</h2><p class="lead">Dúvidas sobre a plataforma, planos para equipes e empresas, turmas de faculdade ou parcerias. Respondemos pelo e-mail ou telefone informado.</p>
<ul class="contact-list">
<li><small>WhatsApp e telefone</small><a href="${waLink('Olá! Vim pelo site da ' + BRAND.name + '.')}">${esc(BRAND.phone)}</a></li>
<li><small>E-mail</small><a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a></li>
</ul></div>
<div>${msg}<form class="stack" method="post" action="/contato">
<div class="row2"><label class="field">Nome<input name="nome" required maxlength="200" autocomplete="name"></label><label class="field">Empresa ou instituição<input name="empresa" maxlength="200" autocomplete="organization"></label></div>
<div class="row2"><label class="field">E-mail<input name="email" type="email" required maxlength="254" autocomplete="email"></label><label class="field">Telefone<input name="telefone" maxlength="40" autocomplete="tel" inputmode="tel"></label></div>
<label class="field">Assunto<select name="assunto"><option>Dúvida sobre a plataforma</option><option>Plano para equipe ou empresa</option><option>Turma de faculdade</option><option>Pagamento e assinatura</option><option>Parceria</option><option>Outro</option></select></label>
<label class="field">Mensagem<textarea name="mensagem" required maxlength="5000"></textarea></label>
<div class="hp" aria-hidden="true"><label>Não preencha<input name="site" tabindex="-1" autocomplete="off"></label></div>
<div><button class="button teal" type="submit">Enviar mensagem</button></div>
</form></div>
</div></section>
</main>${footer()}${NAV_SCRIPT}${HERO_SCRIPT}</body></html>`;
}

// Layout das páginas da área do cliente (ativação, assinatura e painel).
export function consolePage({title, session, body, wide = false}) {
  return `${head({title: `${title} · ${BRAND.name}`, description: title})}<body>${header({session, minimal: true})}
<main id="conteudo" class="console"><div class="wrap"${wide ? '' : ' style="max-width:920px"'}>${body}</div></main>${footer()}</body></html>`;
}

export const notice = message => message ? `<p class="notice ${message.kind === 'ok' ? 'ok' : 'error'}" role="${message.kind === 'ok' ? 'status' : 'alert'}">${esc(message.text)}</p>` : '';
export const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) : '—';
export const fmtDateTime = iso => iso ? new Date(iso).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short'}) : '—';
export {brl, perMonth};
