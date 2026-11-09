// Janela de teste no Claude: liga o aplicativo ao servidor que roda dentro do navegador (offline-backend.mjs).
(function () {
  if (!globalThis.process) globalThis.process = {env: {}};
  const ready = import('./offline-backend.mjs').then(m => m.backend().then(b => ({m, b})));
  ready.catch(e => showFatal(e));

  // Toda chamada do aplicativo a /api/... vai para a API real, executada aqui mesmo.
  const realFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const raw = typeof input === 'string' ? input : input.url;
    const url = new URL(raw, location.href);
    if (url.pathname.includes('/api/')) {
      const {b} = await ready;
      const i = url.pathname.indexOf('/api/');
      return b.api(url.pathname.slice(i) + url.search, init || {});
    }
    return realFetch(input, init);
  };

  // Links para /vistorias abrem o módulo de vistorias em um painel sobre o aplicativo.
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('/vistorias')) { e.preventDefault(); openVistorias(href); }
  }, true);

  function showFatal(e) {
    const bar = document.getElementById('offline-status');
    if (bar) { bar.textContent = 'Falha ao iniciar o servidor de teste: ' + (e && e.message || e); bar.style.background = '#fbecea'; bar.style.color = '#7a1f1a'; }
    console.error(e);
  }

  // ---------- Barra de teste ----------
  async function mountBar() {
    const {m, b} = await ready;
    const bar = document.getElementById('offline-bar');
    if (!bar) return;
    const cur = m.currentUser();
    bar.innerHTML = '<span id="offline-status">Versão de teste · servidor real rodando neste navegador (SQLite). Nada é enviado à Hostinger.</span>'
      + '<label>Entrar como <select id="offline-user">' + m.USERS.map(u => '<option value="' + u.key + '"' + (u.key === cur.key ? ' selected' : '') + '>' + u.label + '</option>').join('') + '</select></label>'
      + '<button type="button" id="offline-vistorias">Vistorias</button>'
      + '<button type="button" id="offline-reset">Reiniciar banco</button>';
    bar.querySelector('#offline-user').addEventListener('change', e => { m.setUser(e.target.value); location.reload(); });
    bar.querySelector('#offline-vistorias').addEventListener('click', () => openVistorias('/vistorias'));
    bar.querySelector('#offline-reset').addEventListener('click', () => { if (confirm('Apagar todos os dados de teste deste navegador e recriar o cenário inicial?')) b.reset(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBar); else mountBar();

  // ---------- Painel das vistorias (páginas geradas pelo servidor, renderizadas aqui) ----------
  let panel = null, frame = null;
  const base = new URL('.', document.baseURI).href;
  function ensurePanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'offline-vistorias-panel';
    panel.innerHTML = '<div class="ov-head"><strong>Vistorias · módulo do servidor</strong><span class="ov-note">Páginas reais do sistema de vistoria, executadas neste navegador.</span><button type="button" class="ov-close" aria-label="Fechar">Fechar</button></div><iframe title="Vistorias" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>';
    document.body.appendChild(panel);
    frame = panel.querySelector('iframe');
    panel.querySelector('.ov-close').addEventListener('click', () => { panel.hidden = true; });
  }
  async function openVistorias(path) {
    ensurePanel(); panel.hidden = false;
    await navigate(path);
  }
  async function navigate(path, init) {
    const {b} = await ready;
    let response = await b.vistorias(path, init);
    let hops = 0;
    while (response.status >= 300 && response.status < 400 && hops++ < 5) {
      const loc = response.headers.get('location') || '/vistorias';
      const target = new URL(loc, 'https://teste.silsec.local');
      if (!target.pathname.startsWith('/vistorias')) { panel.hidden = true; if (target.pathname.startsWith('/entrar')) alert('Selecione um usuário na barra de teste.'); return; }
      response = await b.vistorias(target.pathname + target.search);
    }
    const html = (await response.text()).replace(/(href|src|action)="\/(?!\/)/g, '$1="' + base);
    render(html);
  }
  function render(html) {
    frame.srcdoc = html;
    frame.addEventListener('load', wire, {once: true});
  }
  async function wire() {
    const doc = frame.contentDocument; if (!doc) return;
    doc.addEventListener('click', e => {
      const a = e.target.closest('a[href]'); if (!a) return;
      const url = new URL(a.getAttribute('href'), base);
      if (url.href.startsWith(base) && url.pathname.slice(new URL(base).pathname.length - 1).startsWith('/vistorias')) { e.preventDefault(); navigate(url.pathname.slice(new URL(base).pathname.length - 1) + url.search); }
      else if (url.href.startsWith(base)) { e.preventDefault(); panel.hidden = true; }
    });
    doc.addEventListener('submit', async e => {
      const form = e.target; e.preventDefault();
      const url = new URL(form.getAttribute('action') || frame.contentWindow.location.href, base);
      const path = url.pathname.slice(new URL(base).pathname.length - 1) + url.search;
      const method = (form.getAttribute('method') || 'GET').toUpperCase();
      if (method === 'GET') { const q = new URLSearchParams(new FormData(form)); return navigate(path.split('?')[0] + '?' + q.toString()); }
      const fd = new FormData(form);
      if (e.submitter && e.submitter.name) fd.append(e.submitter.name, e.submitter.value || '');
      await navigate(path, {method: 'POST', body: fd});
    });
    // Fotos guardadas no servidor de teste
    for (const img of doc.querySelectorAll('img[src*="/vistorias/foto"]')) {
      const url = new URL(img.getAttribute('src'), base);
      const path = url.pathname.slice(new URL(base).pathname.length - 1) + url.search;
      const {b} = await ready;
      const r = await b.vistorias(path);
      if (r.ok) img.src = URL.createObjectURL(await r.blob());
    }
  }
})();
