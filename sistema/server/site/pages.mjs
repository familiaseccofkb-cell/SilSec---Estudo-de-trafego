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

function header({session, minimal = false, active = ''}) {
  const area = session ? `<a class="button small ghost" href="/sistema">Acessar o sistema</a>` : `<a class="button small ghost" href="/entrar?volta=%2Fsistema">Acessar o sistema</a>`;
  const link = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<a class="skip" href="#conteudo">Ir para o conteúdo</a><header class="site-head"><div class="wrap">
<a class="logo" href="/" aria-label="${esc(BRAND.name)} · início"><img src="${BRAND.logo}" alt="${esc(BRAND.name)}" width="480" height="200"></a>
${minimal ? `<nav class="site-nav" aria-label="Principal">${session ? '<a href="/vistorias">Vistorias</a><a href="/assinatura">Assinatura</a><a href="/sair">Sair</a>' : ''}${area}</nav>` :
`<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
<nav class="site-nav" id="menu" aria-label="Principal">${link('/servicos', 'Serviços', 'servicos')}${link('/modulos', 'Módulos de software', 'modulos')}${link('/#sobre', 'Sobre', 'sobre')}${link('/orcamento', 'Contato', 'orcamento')}${area}<a class="button small teal" href="/orcamento">Solicite um orçamento</a></nav>`}
</div></header>`;
}

function footer() {
  return `<footer class="site-foot"><div class="wrap">
<div><strong>${esc(BRAND.name)}</strong>Consultoria, vistorias, projetos e software para transporte vertical.</div>
<div><small>Serviços</small><a href="/servicos#consultoria">Consultoria estratégica</a><br><a href="/servicos#novos-projetos">Novos projetos</a><br><a href="/servicos#vistorias">Vistorias e laudos</a><br><a href="/servicos#projetos">Projetos e adequações</a></div>
<div><small>Módulos de software</small><a href="/modulos">Sistema de estudo de tráfego</a><br><a href="/entrar?volta=%2Fsistema">Acessar o sistema</a><br><a href="/ativar">Ativar chave de acesso</a></div>
<div><small>Contato</small><a href="${BRAND.phoneHref}">${esc(BRAND.phone)}</a><br><a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a><br>São Paulo · SP</div>
<div class="foot-base">© ${new Date().getFullYear()} ${esc(BRAND.name)}${BRAND.credit ? ` · ${esc(BRAND.credit)}` : ''}</div>
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

const CTA = (label = 'Solicite um orçamento', cls = 'button teal') => `<a class="${cls}" href="/orcamento">${label}</a>`;
const icon = {
  consult: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>',
  survey: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  project: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg>',
  traffic: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 4h16v16H4zM4 9h16M9 9v11"/></svg>',
  blueprint: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20V4h9l3 3v13H4zM8 20V12h5v8M8 8h3M16 4v4h4"/><path d="M20 8v12h-4"/></svg>',
};
function ctaBand(title, text, label = 'Solicite um orçamento') {
  return `<section class="cta-band"><div class="wrap"><div><h2>${title}</h2><p>${text}</p></div>${CTA(label, 'button amber')}</div></section>`;
}
const planList = plans => Array.isArray(plans) ? plans : Object.values(plans || {});
function moduleCards(plans, {prices = false} = {}) {
  const list = planList(plans), basic = list.find(p => p.id === 'basic'), full = list.find(p => p.id === 'advanced');
  const price = p => prices ? `<div class="price"><strong>${brl(p.annualCents)}</strong><span>por ano</span></div>` : '';
  return `<div class="modules">
<article class="module"><span class="kicker">Módulo</span><h3>Sistema de estudo de tráfego Básico</h3><p>${esc(basic.summary)}</p>${price(basic)}<a class="button ghost" href="/modulos#comparar">Detalhes do módulo</a></article>
<article class="module featured"><span class="kicker">Módulo · mais completo</span><h3>Sistema de estudo de tráfego Completo</h3><p>${esc(full.summary)}</p>${price(full)}<a class="button amber" href="/modulos#comparar">Detalhes do módulo</a></article>
<article class="module soon"><span class="kicker">Em preparação</span><h3>Cursos e capacitação</h3><p>Aulas on-line sobre normas ABNT, legislação, análise de sistemas de elevadores, gestão de contratos e atualizações tecnológicas.</p><p class="muted">Turmas e datas serão anunciadas aqui.</p><a class="button ghost" href="/orcamento?assunto=cursos">Quero ser avisado</a></article>
</div>`;
}

export function homePage({plans, session, message}) {
  const msg = message ? `<p class="notice ${message.kind}" role="status">${esc(message.text)}</p>` : '';
  return `${head({title: `${BRAND.name} · engenharia de transporte vertical: consultoria, vistorias, projetos e estudo de tráfego`, description: 'Consultoria para compra, contrato de manutenção e modernização de elevadores, vistorias técnicas com laudo, projetos de adequação e o sistema de estudo de tráfego (NBR 5665 e ISO 8100-32).', index: true, canonical: BRAND.site + '/'})}
<body>${header({session})}
<main id="conteudo">${msg}
<section class="hero company"><div class="wrap">
<div class="hero-copy"><span class="kicker">Engenharia de transporte vertical</span>
<h1>Decisões sobre elevadores com base em engenharia, não em opinião.</h1>
<p class="lead">Consultoria para compra, contrato de manutenção e modernização de elevadores, vistorias técnicas com laudo e projetos de adequação — com o apoio dos nossos módulos de software de estudo de tráfego.</p>
<div class="hero-actions">${CTA('Solicite um orçamento', 'button amber')}<a class="button ghost light" href="/servicos">Conhecer os serviços</a></div>
<p class="hero-contact">Atendimento a condomínios, construtoras, escritórios de projeto e administradoras · São Paulo e região</p></div>
<aside class="hero-steps" aria-label="Como atuamos"><span class="kicker">Como atuamos</span>
<ol><li><strong>Diagnóstico</strong><span>Visita técnica, leitura dos contratos e do histórico de ocorrências.</span></li>
<li><strong>Análise de engenharia</strong><span>Estudo de tráfego, conformidade normativa e comparação de propostas.</span></li>
<li><strong>Recomendação e acompanhamento</strong><span>Parecer objetivo e apoio na negociação e na execução.</span></li></ol></aside>
</div></section>

<section class="section" id="servicos"><div class="wrap">
<div class="section-head split"><div><span class="kicker">Serviços</span><h2>O que a SilSec faz pelo seu edifício e seu projeto</h2></div><a class="more" href="/servicos">Ver todos os serviços →</a></div>
<div class="services five">
<article class="service"><span class="service-icon">${icon.consult}</span><h3>Consultoria estratégica</h3><p>Compra de elevadores, contrato de manutenção e modernização: o que especificar, o que exigir e quanto é razoável pagar.</p></article>
<article class="service"><span class="service-icon">${icon.blueprint}</span><h3>Consultoria para novos projetos</h3><p>Quantos elevadores, com que capacidade e velocidade, e que espaço reservar para caixa, poço e casa de máquinas — definido na prancheta, antes que custe caro mudar na obra.</p></article>
<article class="service"><span class="service-icon">${icon.survey}</span><h3>Vistorias técnicas e laudos</h3><p>Inspeção do equipamento e da casa de máquinas, registro fotográfico e laudo assinado por engenheiro com ART.</p></article>
<article class="service"><span class="service-icon">${icon.project}</span><h3>Projetos e adequações</h3><p>Projeto elétrico e adequações de obra para instalação ou troca de elevadores, com equipe parceira para as disciplinas mecânica e civil.</p></article>
<article class="service"><span class="service-icon">${icon.traffic}</span><h3>Estudo de tráfego</h3><p>Dimensionamento pela NBR 5665 e pela ISO 8100-32, entregue como serviço ou pelos nossos módulos de software.</p></article>
</div></div></section>

<section class="section alt" id="modulos"><div class="wrap">
<div class="section-head"><div><span class="kicker">Módulos de software</span><h2>Serviços adicionais que você usa quando quiser</h2></div><p>A mesma engenharia que aplicamos na consultoria, em forma de plataforma on-line. Contrate como módulo adicional, por assinatura anual, com 30 dias para testar. Planos e valores na página do sistema.</p></div>
${moduleCards(plans)}
</div></section>

<section class="section" id="para-quem"><div class="wrap about">
<div><span class="kicker">Para quem</span><h2>Quem decide sobre elevadores — e precisa decidir bem</h2></div>
<div class="audience">
<div><strong>Síndicos e administradoras</strong><span>Contratos de manutenção, modernização e laudos para assembleias.</span></div>
<div><strong>Construtoras e incorporadoras</strong><span>Especificação, estudo de tráfego e comparação de propostas de fornecedores.</span></div>
<div><strong>Escritórios de arquitetura e engenharia</strong><span>Dimensionamento normativo integrado ao projeto, com memória de cálculo.</span></div>
<div><strong>Estudantes e professores</strong><span>Módulos de software para turmas, com as premissas explicadas passo a passo. <a href="/modulos#ensino">Acesso educacional</a>.</span></div>
</div></div></section>

<section class="section alt" id="sobre"><div class="wrap about">
<div><span class="kicker">Sobre a SilSec</span><h2>Engenharia independente dos fabricantes</h2>
<p class="lead">A ${esc(BRAND.name)} nasceu para tornar o estudo de tráfego de elevadores acessível a quem projeta, especifica e compra elevadores. Hoje reúne consultoria, vistorias, projetos e a plataforma de estudos — sem vender equipamentos nem manutenção, para que o parecer seja só de engenharia.</p>
<p>Cada resultado vem com a memória de cálculo e as premissas usadas, para que você entenda e possa conferir a decisão.</p></div>
<div class="stats"><div><strong>NBR 5665</strong><span>Cálculo de tráfego brasileiro</span></div><div><strong>ISO 8100-32</strong><span>Edição 2020, com proveniência</span></div><div><strong>ART</strong><span>Responsabilidade técnica registrada</span></div></div>
</div></section>
${videosSection()}
${ctaBand('Conte o caso do seu edifício', 'Respondemos com o escopo recomendado e o orçamento do serviço. Vistorias e laudos são serviços à parte, com valor informado antes da visita.')}
</main>${footer()}${NAV_SCRIPT}</body></html>`;
}

export function servicesPage({session}) {
  return `${head({title: `Serviços de engenharia · ${BRAND.name}`, description: 'Consultoria estratégica para compra, contrato de manutenção e modernização de elevadores; consultoria de transporte vertical para novos projetos; vistorias técnicas com laudo e ART; projetos elétricos e adequações de obra.', index: true, canonical: BRAND.site + '/servicos'})}
<body>${header({session, active: 'servicos'})}
<main id="conteudo">
<section class="page-head"><div class="wrap"><span class="kicker">Serviços de engenharia</span><h1>Consultoria, vistorias e projetos para elevadores e escadas rolantes</h1><p class="lead">Atuamos do lado de quem contrata: condomínios, incorporadoras, construtoras e escritórios de arquitetura. Não vendemos equipamentos nem manutenção, e isso nos permite dizer o que o fabricante não diz.</p></div></section>

<section class="section alt"><div class="wrap stack-lg">
<article class="service-block" id="consultoria"><div><span class="kicker">01 · Consultoria estratégica</span><h2>Compra, contrato de manutenção e modernização</h2><p>Parecer de engenharia para as três decisões mais caras da vida de um elevador. Comparamos propostas, apontamos cláusulas de risco e indicamos o que é essencial e o que é supérfluo.</p>${CTA()}</div>
<div class="minis three"><div><strong>Compra de elevadores</strong><span>Especificação técnica, estudo de tráfego e equalização das propostas dos fabricantes.</span></div><div><strong>Contrato de manutenção</strong><span>Escopo, peças incluídas, prazos de atendimento e indicadores para cobrar da mantenedora.</span></div><div><strong>Modernização</strong><span>O que trocar, em que ordem e com que ganho real de desempenho, segurança e consumo.</span></div></div></article>

<article class="service-block" id="novos-projetos"><div><span class="kicker">02 · Consultoria para novos projetos</span><h2>Transporte vertical definido na prancheta, não na obra</h2><p>Para incorporadoras, construtoras e escritórios de arquitetura. Entramos no projeto desde o estudo preliminar para dimensionar o sistema de transporte vertical do edifício — quantidade, capacidade e velocidade dos elevadores, escadas rolantes quando houver — e para garantir que caixa, poço, casa de máquinas, halls e instalações elétricas estejam corretos antes da aprovação e da concretagem. Independentes de fabricante: a especificação sai neutra e as propostas chegam comparáveis.</p>${CTA()}</div>
<div class="minis three"><div><strong>Estudo de tráfego do empreendimento</strong><span>População por pavimento, intervalo e capacidade de transporte pela NBR 5665 e pela ISO 8100-32, com cenários para cada tipologia (residencial, corporativo, misto, hotel, hospital).</span></div><div><strong>Compatibilização com o projeto</strong><span>Dimensões de caixa e poço, altura da última parada, casa de máquinas ou sem casa, cargas na estrutura, hall de embarque e alimentação elétrica, para arquitetura, estrutura e instalações.</span></div><div><strong>Especificação e contratação</strong><span>Memorial descritivo neutro, equalização das propostas dos fabricantes, acompanhamento da instalação e aceite técnico na entrega.</span></div></div></article>

<article class="service-block" id="vistorias"><div><span class="kicker">03 · Vistorias técnicas e laudos</span><h2>Inspeção presencial com laudo assinado</h2><p>Visita ao equipamento, à casa de máquinas e ao poço; verificação de itens de segurança e conservação; registro fotográfico; laudo com responsabilidade técnica (ART). Serviço cobrado à parte, com valor informado antes da visita.</p>${CTA()}</div>
<div><strong class="kicker">Quando pedir uma vistoria</strong><ul class="two-col"><li>Antes de renovar ou trocar a mantenedora</li><li>Para decidir entre reparo e modernização</li><li>Após ocorrência com usuário preso ou acidente</li><li>Para assembleia aprovar investimento</li><li>Na entrega da obra ou no recebimento de elevador novo</li><li>Em disputa com fabricante ou mantenedora</li></ul></div></article>

<article class="service-block" id="projetos"><div><span class="kicker">04 · Projetos e adequações</span><h2>Projeto elétrico e adequações de obra</h2><p>Projeto e acompanhamento das instalações elétricas de elevadores e das adequações necessárias à instalação ou troca. Disciplinas mecânica e civil com engenheiros parceiros, cada um com a própria ART vinculada.</p>${CTA()}</div>
<div class="minis three"><div><strong>Instalações elétricas</strong><span>Alimentação, quadro, aterramento e iluminação de casa de máquinas e poço.</span></div><div><strong>Gestão da intervenção</strong><span>Cronograma, interface com a mantenedora e aceite técnico ao final.</span></div><div><strong>Estudo de tráfego</strong><span>NBR 5665 e ISO 8100-32, entregue como laudo ou pelo módulo de software.</span></div></div></article>
</div></section>

<section class="section"><div class="wrap about"><div><span class="kicker">Como contratar</span><h2>Três passos, sem surpresa no valor</h2></div>
<ol class="steps three"><li><strong>Você descreve o caso</strong><span>Pelo formulário, e-mail ou WhatsApp. Quanto mais contexto, melhor.</span></li><li><strong>Recebe escopo e orçamento</strong><span>Proposta por escrito, com o que está incluído e os prazos.</span></li><li><strong>Execução e entrega</strong><span>Visita, análise e documento final assinado pelo engenheiro responsável.</span></li></ol></div></section>
${ctaBand('Precisa de um parecer para a próxima assembleia?', 'Envie o caso e retornamos com escopo, prazo e valor.')}
</main>${footer()}${NAV_SCRIPT}</body></html>`;
}

export function modulesPage({plans, session}) {
  const list = planList(plans), basic = list.find(p => p.id === 'basic'), full = list.find(p => p.id === 'advanced');
  const plan = (p, featured) => `<article class="plan${featured ? ' featured' : ''}"><span class="kicker">Módulo ${featured ? 'Completo' : 'Básico'}</span><h3>Sistema de estudo de tráfego ${featured ? 'Completo · NBR + ISO' : 'Básico · NBR 5665'}</h3>
<div class="price"><strong>${brl(p.annualCents)}</strong><span>por ano</span></div><div class="per">Equivale a ${perMonth(p.annualCents)} por mês</div>
<ul>${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
<a class="button${featured ? ' amber' : ' ghost'}" href="/experimentar">Começar o teste de 30 dias</a></article>`;
  return `${head({title: `Módulos de software · sistema de estudo de tráfego · ${BRAND.name}`, description: 'Sistema de estudo de tráfego de elevadores pela NBR 5665 e ISO 8100-32, como módulo adicional aos serviços da SilSec: Básico e Completo, por assinatura anual, com 30 dias de teste.', index: true, canonical: BRAND.site + '/modulos'})}
<body>${header({session, active: 'modulos'})}
<main id="conteudo">
<section class="page-head split"><div class="wrap"><div><span class="kicker">Módulos de software · serviços adicionais</span><h1>A engenharia da SilSec, em forma de plataforma</h1><p class="lead">Estudo de tráfego de elevadores pela NBR 5665 e pela ISO 8100-32, no navegador e no celular, com memória de cálculo e relatório. Contrate como módulo adicional aos serviços ou use de forma independente, por assinatura anual.</p>
<div class="hero-actions"><a class="button teal" href="/experimentar">Testar 30 dias grátis</a><a class="button ghost" href="#comparar">Comparar os módulos</a></div></div>
<aside class="result-card" aria-label="Exemplo de resultado"><span class="kicker">Resultado de um estudo</span><div class="kpis"><div><small>Intervalo</small><strong>31 s</strong></div><div><small>Capacidade 5 min</small><strong>13,2 %</strong></div><div><small>Classificação</small><strong class="amber">Bom</strong></div></div><dl><div><dt>Grupo 1 · 4 elevadores</dt><dd>1.000 kg · 2,5 m/s</dd></div><div><dt>Paradas prováveis</dt><dd>8,46</dd></div><div><dt>Tempo total de viagem</dt><dd>124 s</dd></div></dl><small>Valores ilustrativos de um estudo-exemplo da plataforma.</small></aside></div></section>

<section class="section alt" id="comparar"><div class="wrap">
<div class="section-head"><div><span class="kicker">Planos</span><h2>Dois módulos, uma assinatura anual</h2></div><p>Os dois incluem 30 dias de teste. Equipes, empresas e turmas de faculdade têm condições próprias — fale com a SilSec.</p></div>
<div class="plans two">${plan(basic, false)}${plan(full, true)}</div>
</div></section>

<section class="section"><div class="wrap">
<div class="section-head"><span class="kicker">Como se encaixa nos serviços</span><h2>Do laudo à plataforma, ou da plataforma ao laudo</h2></div>
<div class="services three"><article class="service"><h3>Com a consultoria</h3><p>O estudo de tráfego da consultoria é entregue dentro da plataforma: você acompanha, altera premissas e reemite o relatório quando precisar.</p></article><article class="service"><h3>Para escritórios</h3><p>Dimensione sozinho no dia a dia e chame a SilSec só para a revisão assinada ou para os casos fora do comum.</p></article><article class="service"><h3>Para o ensino</h3><p>Turmas com acesso por período letivo, exemplos prontos e a explicação de cada cálculo passo a passo.</p></article></div>
</div></section>

<section class="section" id="ensino"><div class="wrap">
<div class="section-head"><div><span class="kicker">Estudantes e professores</span><h2>Acesso educacional ao sistema</h2></div><p>Aprenda estudo de tráfego fazendo: a plataforma mostra cada passo do cálculo, da população ao intervalo, com a memória de cálculo da NBR 5665 e da ISO 8100-32.</p></div>
<ol class="steps three"><li><strong>6 meses grátis</strong><span>Crie sua conta e envie o comprovante de matrícula em Assinatura → Acesso educacional. Renova enquanto você estiver matriculado.</span></li><li><strong>Para TCC e trabalhos</strong><span>Relatório com memória de cálculo, premissas e referências normativas, pronto para anexar ou apresentar em PowerPoint.</span></li><li><strong>Para professores</strong><span>Acessos para turmas inteiras, com chave de ativação por aluno. <a href="/orcamento?assunto=cursos">Fale com a SilSec</a>.</span></li></ol>
</div></section>

<section class="section alt"><div class="wrap"><div class="minis four"><div><strong>No computador e no celular</strong><span>Aplicativo instalável, funciona sem conexão e sincroniza ao voltar.</span></div><div><strong>Memória de cálculo</strong><span>Cada número com a fórmula, a premissa e a referência normativa.</span></div><div><strong>Compartilhamento</strong><span>Link de leitura para cliente ou fornecedor, sem precisar de conta.</span></div><div><strong>Manual e explicação dos cálculos</strong><span>Documentação completa dentro do sistema, em português.</span></div></div></div></section>
</main>${footer()}${NAV_SCRIPT}</body></html>`;
}

export function quotePage({session, message, preset = ''}) {
  const msg = message ? `<p class="notice ${message.kind}" role="status">${esc(message.text)}</p>` : '';
  const check = (value, label, on = false) => `<label class="check"><input type="checkbox" name="servicos" value="${value}"${on ? ' checked' : ''}> ${label}</label>`;
  return `${head({title: `Solicite um orçamento · ${BRAND.name}`, description: 'Descreva o edifício e o que precisa decidir. A SilSec retorna com o escopo recomendado, o prazo e o valor do serviço.', index: true, canonical: BRAND.site + '/orcamento'})}
<body>${header({session, active: 'orcamento'})}
<main id="conteudo">
<section class="section"><div class="wrap quote">
<div class="quote-side"><span class="kicker">Contato</span><h1>Solicite um orçamento</h1><p class="lead">Descreva o edifício e o que você precisa decidir. Retornamos em até dois dias úteis com o escopo recomendado, o prazo e o valor do serviço.</p>
<ul class="contact-list card"><li><small>WhatsApp e telefone</small><a href="${waLink('Olá! Vim pelo site da ' + BRAND.name + ' e quero um orçamento.')}">${esc(BRAND.phone)}</a></li><li><small>E-mail</small><a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a></li><li><small>Atendimento</small>São Paulo, ABC e região metropolitana; outras cidades sob consulta</li></ul>
<div class="dark-note"><strong>Como funciona o orçamento</strong><p>A proposta de consultoria é enviada por escrito, com escopo e prazo. Vistorias técnicas e laudos são serviços cobrados à parte, com o valor informado antes da visita.</p></div></div>
<div>${msg}<form class="stack card" method="post" action="/contato"><input type="hidden" name="origem" value="orcamento">
<div class="row2"><label class="field">Seu nome<input name="nome" required maxlength="200" autocomplete="name"></label><label class="field">Você é<select name="perfil"><option>Síndico ou conselheiro</option><option>Administradora de condomínios</option><option>Construtora ou incorporadora</option><option>Escritório de arquitetura ou engenharia</option><option>Estudante ou professor</option><option>Outro</option></select></label></div>
<div class="row2"><label class="field">E-mail<input name="email" type="email" required maxlength="254" autocomplete="email"></label><label class="field">Telefone ou WhatsApp<input name="telefone" maxlength="40" autocomplete="tel" inputmode="tel"></label></div>
<fieldset class="checks"><legend>O que você precisa</legend>${check('Consultoria para compra de elevadores', 'Consultoria para compra de elevadores')}${check('Consultoria para novo projeto (quantos elevadores, caixa, poço e casa de máquinas)', 'Consultoria para novo projeto (quantos elevadores, caixa, poço e casa de máquinas)')}${check('Contrato de manutenção', 'Contrato de manutenção')}${check('Modernização', 'Modernização')}${check('Vistoria técnica e laudo', 'Vistoria técnica e laudo')}${check('Projeto e adequações de obra', 'Projeto e adequações de obra')}${check('Módulos de software para equipe ou turma', 'Módulos de software para equipe ou turma', preset === 'cursos')}</fieldset>
<div class="row3"><label class="field">Cidade do edifício<input name="cidade" maxlength="120" placeholder="São Paulo" autocomplete="address-level2"></label><label class="field">Pavimentos<input name="pavimentos" type="number" min="1" max="200" inputmode="numeric"></label><label class="field">Elevadores<input name="elevadores" type="number" min="0" max="60" inputmode="numeric"></label></div>
<label class="field">Conte o caso<textarea name="mensagem" required maxlength="5000" rows="5" placeholder="Idade dos elevadores, fabricante, o que está acontecendo e qual decisão precisa ser tomada."></textarea></label>
<div class="hp" aria-hidden="true"><label>Não preencha<input name="site" tabindex="-1" autocomplete="off"></label></div>
<div class="row-end"><label class="check small"><input type="checkbox" name="lgpd" required> Autorizo o uso destes dados para responder à minha solicitação.</label><button class="button amber" type="submit">Solicite um orçamento</button></div>
</form></div>
</div></section>
</main>${footer()}${NAV_SCRIPT}</body></html>`;
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
