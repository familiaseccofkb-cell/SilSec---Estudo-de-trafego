// Vistorias guiadas (protótipo): o administrador define modelos de vistoria; o usuário preenche seção por seção,
// com conformidade, medições, opções e fotos tiradas no celular, e o sistema gera o relatório com as não conformidades.
import {randomUUID} from 'node:crypto';
import {consolePage, esc, notice, fmtDateTime} from '../site/pages.mjs';
// Contas da administração com acesso permanente (lista em config.ownerEmails).
const isOwnerEmail = (config, email) => { const e = String(email || '').trim().toLowerCase(); return !!e && (config.ownerEmails ? config.ownerEmails.has(e) : e === config.ownerEmail); };

export const INSPECTION_BASE = '/vistorias';
const TYPES = {texto: 'Texto', numero: 'Número', ok: 'Conforme / não conforme', opcoes: 'Opções', foto: 'Foto', data: 'Data'};
const MAX_PHOTO = 6 * 1024 * 1024, MAX_PHOTOS_PER_ITEM = 6;

export const DEFAULT_TEMPLATE = {name: 'Vistoria de elevador · laudo e auditoria de manutenção', description: 'Roteiro para inspeção técnica de elevadores de passageiros: casa de máquinas, cabina, portas, poço, desempenho e manutenção.', source: `## Identificação
- texto: Edifício e endereço
- texto: Identificação do elevador (nº, fabricante, modelo)
- numero[kg]: Carga nominal da placa
- numero[pessoas]: Lotação da placa
- numero[paradas]: Número de paradas
- data: Data da última manutenção registrada
- foto: Placa de identificação

## Casa de máquinas
- ok: Acesso livre, iluminado e trancado
- ok: Ventilação e temperatura adequadas
- ok: Quadro de comando sem sinais de aquecimento ou improvisos
- ok: Máquina de tração sem vazamento de óleo
- opcoes(Bom|Regular|Ruim): Estado dos cabos de tração
- ok: Limitador de velocidade lacrado e com teste em dia
- foto: Visão geral da casa de máquinas

## Cabina
- ok: Iluminação normal e de emergência funcionando
- ok: Interfone ou alarme funcionando
- ok: Botoeira completa e com sinalização em braile
- ok: Placa de capacidade visível
- opcoes(Bom|Regular|Ruim): Estado do revestimento e do piso
- foto: Interior da cabina

## Portas e pavimentos
- ok: Portas de pavimento fecham e travam em todos os andares
- ok: Dispositivo de reabertura (cortina de luz ou sensor) funcionando
- numero[s]: Tempo de abertura da porta
- numero[s]: Tempo de fechamento da porta
- ok: Botoeiras de pavimento e indicadores funcionando
- foto: Porta de pavimento com problema (se houver)

## Poço
- ok: Poço limpo, seco e iluminado
- ok: Para-choques em bom estado
- ok: Interruptor de parada do poço funcionando
- foto: Poço

## Desempenho
- numero[m/s]: Velocidade medida em subida
- numero[mm]: Maior desnível de parada (nivelamento)
- opcoes(Confortável|Aceitável|Desconfortável): Qualidade de viagem (partida, parada, ruído)
- ok: Sem ruídos ou vibrações anormais

## Manutenção
- ok: Livro ou registro de manutenção disponível e em dia
- ok: Visitas mensais compatíveis com o contrato
- opcoes(Preventiva em dia|Atrasada|Sem registro): Situação da manutenção preventiva
- texto: Reparos cobrados nos últimos 12 meses

## Conclusão
- opcoes(Apto|Apto com ressalvas|Não apto): Parecer
- texto: Recomendações priorizadas`};

// Linguagem do modelo: "## Seção" e "- tipo: Pergunta"; numero[unidade]; opcoes(A|B|C).
export function parseTemplate(source) {
  const sections = [], errors = [];
  String(source || '').split(/\r?\n/).forEach((raw, n) => {
    const line = raw.trim();
    if (!line || line.startsWith('#!')) return;
    if (line.startsWith('## ')) { sections.push({title: line.slice(3).trim().slice(0, 120), items: []}); return; }
    const m = line.match(/^-\s*(texto|numero|ok|opcoes|foto|data)(?:\[([^\]]{1,20})\])?(?:\(([^)]{1,400})\))?\s*:\s*(.{1,200})$/i);
    if (!m) { errors.push(`Linha ${n + 1}: use "- tipo: pergunta" (tipos: ${Object.keys(TYPES).join(', ')}).`); return; }
    if (!sections.length) sections.push({title: 'Geral', items: []});
    const type = m[1].toLowerCase(), options = type === 'opcoes' ? (m[3] || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 12) : null;
    if (type === 'opcoes' && (!options || options.length < 2)) { errors.push(`Linha ${n + 1}: informe as opções entre parênteses, separadas por |.`); return; }
    const s = sections[sections.length - 1];
    s.items.push({id: `s${sections.length}i${s.items.length + 1}`, type, label: m[4].trim(), unit: m[2] ? m[2].trim() : '', options});
  });
  if (!sections.some(s => s.items.length)) errors.push('O modelo precisa de pelo menos uma pergunta.');
  if (sections.length > 40 || sections.reduce((a, s) => a + s.items.length, 0) > 400) errors.push('Modelo grande demais (máximo de 40 seções e 400 perguntas).');
  return {sections: sections.filter(s => s.items.length), errors};
}

export function summarize(template, answers) {
  const items = template.sections.flatMap(s => s.items.map(i => ({...i, section: s.title})));
  const answered = items.filter(i => { const a = answers[i.id]; return a && (a.value !== undefined && a.value !== '' || (a.photos || []).length); });
  const nonConform = items.filter(i => i.type === 'ok' && answers[i.id]?.value === 'nao');
  return {total: items.length, answered: answered.length, nonConform};
}

export function createInspections({db, bucket, auth, config, log = console}) {
  const q = (sql, ...a) => db.prepare(sql).bind(...a);
  const now = () => new Date().toISOString();
  const html = (body, status = 200) => new Response(body, {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow'}});
  const redirect = location => new Response(null, {status: 303, headers: {Location: location, 'Cache-Control': 'no-store'}});
  const page = (session, title, body, message) => html(consolePage({title, session, body: notice(message) + body, wide: true}));

  async function isAdmin(session) {
    if (isOwnerEmail(config, session.email)) return true;
    const m = await q('SELECT role, active FROM members WHERE email = ?', session.email).first();
    return !!(m && m.active && m.role === 'admin');
  }
  async function ensureDefault(session) {
    const any = await q('SELECT id FROM inspection_templates LIMIT 1').first();
    if (any) return;
    const parsed = parseTemplate(DEFAULT_TEMPLATE.source);
    await q('INSERT INTO inspection_templates (id,name,description,source,schema_json,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?,?)', randomUUID(), DEFAULT_TEMPLATE.name, DEFAULT_TEMPLATE.description, DEFAULT_TEMPLATE.source, JSON.stringify({sections: parsed.sections}), session.id, now(), now()).run();
  }
  async function loadInspection(session, id, admin) {
    const row = await q('SELECT * FROM inspections WHERE id = ?', id).first();
    if (!row || (row.owner_id !== session.id && !admin)) return null;
    return {...row, template: JSON.parse(row.schema_json), answers: JSON.parse(row.answers_json || '{}')};
  }

  async function listPage(session, admin, message) {
    await ensureDefault(session);
    const templates = (await q('SELECT id,name,description FROM inspection_templates WHERE active = 1 ORDER BY name').all()).results;
    const rows = (await (admin ? q('SELECT id,title,building,status,template_name,updated_at,owner_email FROM inspections ORDER BY updated_at DESC LIMIT 200') : q('SELECT id,title,building,status,template_name,updated_at,owner_email FROM inspections WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 200', session.id)).all()).results;
    const body = `<h1>Vistorias</h1><p class="lead">Escolha um modelo e preencha a vistoria passo a passo, no computador ou no celular. As fotos podem ser tiradas na hora. No fim, o relatório sai com as não conformidades em destaque.</p>
<div class="panel"><h2>Nova vistoria</h2><form class="stack" method="post" action="${INSPECTION_BASE}/nova">
<label class="field">Modelo<select name="modelo" required>${templates.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label>
<div class="row2"><label class="field">Título<input name="titulo" required maxlength="160" placeholder="Ex.: Elevador social · vistoria anual"></label><label class="field">Edifício ou cliente<input name="edificio" maxlength="200"></label></div>
<div><button class="button teal" type="submit">Começar vistoria</button></div></form></div>
<div class="panel"><h2>Minhas vistorias</h2>${rows.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Vistoria</th><th>Modelo</th><th>Situação</th><th>Atualizada</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td><strong>${esc(r.title)}</strong><br><span class="muted">${esc(r.building)}${admin ? ' · ' + esc(r.owner_email) : ''}</span></td><td>${esc(r.template_name)}</td><td><span class="pill ${r.status === 'done' ? 'on' : 'wait'}">${r.status === 'done' ? 'concluída' : 'em andamento'}</span></td><td>${fmtDateTime(r.updated_at)}</td><td><a href="${INSPECTION_BASE}/${esc(r.id)}">${r.status === 'done' ? 'Abrir' : 'Continuar'}</a> · <a href="${INSPECTION_BASE}/${esc(r.id)}/relatorio">Relatório</a></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nenhuma vistoria ainda.</p>'}</div>
${admin ? `<div class="panel"><h2>Modelos de vistoria</h2><ul>${templates.map(t => `<li><a href="${INSPECTION_BASE}/modelos/${esc(t.id)}">${esc(t.name)}</a> <span class="muted">${esc(t.description)}</span></li>`).join('')}</ul><a class="button ghost small" href="${INSPECTION_BASE}/modelos/novo">Criar modelo</a></div>` : ''}`;
    return page(session, 'Vistorias', body, message);
  }

  function templateForm(t, errors = []) {
    return `<h1>${t.id ? 'Editar modelo' : 'Novo modelo de vistoria'}</h1>${errors.length ? `<div class="notice error" role="alert">${errors.map(esc).join('<br>')}</div>` : ''}
<div class="panel"><form class="stack" method="post" action="${INSPECTION_BASE}/modelos/${t.id ? esc(t.id) : 'novo'}">
<label class="field">Nome<input name="nome" required maxlength="160" value="${esc(t.name || '')}"></label>
<label class="field">Descrição<input name="descricao" maxlength="300" value="${esc(t.description || '')}"></label>
<label class="field">Roteiro<textarea name="roteiro" rows="24" style="font-family:ui-monospace,monospace">${esc(t.source || '')}</textarea></label>
<p class="muted">Uma seção por linha começando com <code>## </code>. Cada pergunta: <code>- tipo: pergunta</code>. Tipos: <code>ok</code> (conforme / não conforme / não se aplica), <code>texto</code>, <code>numero[unidade]</code>, <code>opcoes(A|B|C)</code>, <code>foto</code>, <code>data</code>.</p>
${t.id ? `<label class="check"><input type="checkbox" name="ativo" ${t.active ? 'checked' : ''}> Modelo ativo</label>` : ''}
<div><button class="button teal" type="submit">Salvar modelo</button> <a class="button ghost" href="${INSPECTION_BASE}">Voltar</a></div></form></div>`;
  }

  async function saveTemplate(request, session, id) {
    const f = await request.formData(), source = String(f.get('roteiro') || '').slice(0, 40000), name = String(f.get('nome') || '').trim().slice(0, 160);
    const parsed = parseTemplate(source), errors = [...parsed.errors];
    if (!name) errors.push('Informe o nome do modelo.');
    const t = {id: id === 'novo' ? null : id, name, description: String(f.get('descricao') || '').slice(0, 300), source, active: id === 'novo' || f.get('ativo') === 'on'};
    if (errors.length) return page(session, 'Modelo de vistoria', templateForm(t, errors));
    if (t.id) await q('UPDATE inspection_templates SET name=?,description=?,source=?,schema_json=?,active=?,updated_at=? WHERE id=?', t.name, t.description, source, JSON.stringify({sections: parsed.sections}), t.active ? 1 : 0, now(), t.id).run();
    else await q('INSERT INTO inspection_templates (id,name,description,source,schema_json,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?,?)', randomUUID(), t.name, t.description, source, JSON.stringify({sections: parsed.sections}), session.id, now(), now()).run();
    return redirect(INSPECTION_BASE + '?modelo=salvo');
  }

  function field(item, answer = {}) {
    const name = `a_${item.id}`, v = answer.value ?? '', obs = answer.note ?? '';
    const note = `<input name="${name}_obs" maxlength="500" placeholder="Observação (opcional)" value="${esc(obs)}" style="margin-top:6px">`;
    let control;
    if (item.type === 'ok') control = `<div class="choice-row">${[['sim', 'Conforme'], ['nao', 'Não conforme'], ['na', 'Não se aplica']].map(([k, l]) => `<label class="choice"><input type="radio" name="${name}" value="${k}" ${v === k ? 'checked' : ''}> ${l}</label>`).join('')}</div>${note}`;
    else if (item.type === 'opcoes') control = `<select name="${name}"><option value="">Selecione</option>${item.options.map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>${note}`;
    else if (item.type === 'numero') control = `<div style="display:flex;gap:8px;align-items:center"><input name="${name}" inputmode="decimal" value="${esc(v)}" style="max-width:200px"><span class="muted">${esc(item.unit)}</span></div>${note}`;
    else if (item.type === 'data') control = `<input type="date" name="${name}" value="${esc(v)}">`;
    else if (item.type === 'foto') control = `${(answer.photos || []).length ? `<div class="photo-row">${answer.photos.map((p, n) => `<img src="${INSPECTION_BASE}/foto?k=${encodeURIComponent(p)}" alt="Foto ${n + 1}" loading="lazy">`).join('')}</div>` : ''}<input type="file" name="${name}_foto" accept="image/*" capture="environment" multiple>${note}`;
    else control = `<textarea name="${name}" maxlength="3000" rows="3">${esc(v)}</textarea>`;
    return `<fieldset class="inspection-item"><legend>${esc(item.label)}</legend>${control}</fieldset>`;
  }

  function stepPage(session, ins, index, message) {
    const sections = ins.template.sections, i = Math.max(0, Math.min(index, sections.length - 1)), s = sections[i], sum = summarize(ins.template, ins.answers);
    const pct = sum.total ? Math.round(sum.answered / sum.total * 100) : 0;
    const body = `<p class="muted"><a href="${INSPECTION_BASE}">Vistorias</a> / ${esc(ins.title)}</p><h1>${esc(s.title)}</h1>
<p class="lead">Seção ${i + 1} de ${sections.length} · ${esc(ins.building || '')}</p>
<div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div><p class="muted">${sum.answered} de ${sum.total} itens respondidos · ${sum.nonConform.length} não conformidade(s)</p>
<form class="stack panel" method="post" action="${INSPECTION_BASE}/${esc(ins.id)}?secao=${i}" enctype="multipart/form-data">
${s.items.map(item => field(item, ins.answers[item.id])).join('')}
<div class="inline-actions">${i > 0 ? `<button class="button ghost" name="ir" value="${i - 1}">Voltar</button>` : ''}${i < sections.length - 1 ? `<button class="button teal" name="ir" value="${i + 1}">Salvar e continuar</button>` : `<button class="button teal" name="ir" value="fim">Salvar e concluir</button>`}<button class="button ghost" name="ir" value="${i}">Salvar</button></div>
</form>
<nav class="panel"><h2>Seções</h2><ol>${sections.map((x, n) => `<li>${n === i ? `<strong>${esc(x.title)}</strong>` : `<a href="${INSPECTION_BASE}/${esc(ins.id)}?secao=${n}">${esc(x.title)}</a>`}</li>`).join('')}</ol><a href="${INSPECTION_BASE}/${esc(ins.id)}/relatorio">Ver relatório</a></nav>
<style>.inspection-item{border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin:0}.inspection-item legend{font-weight:650;padding:0 6px}.choice-row{display:flex;flex-wrap:wrap;gap:8px}.choice{border:1px solid var(--line);border-radius:999px;padding:8px 14px;cursor:pointer}.photo-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}.photo-row img{width:120px;height:90px;object-fit:cover;border-radius:6px}.inspection-item input:not([type=radio]):not([type=file]),.inspection-item select,.inspection-item textarea{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:6px;font:inherit;background:var(--white)}.inspection-item input[type=file]{margin:6px 0}.progress-bar{height:8px;background:var(--line);border-radius:8px;overflow:hidden}.progress-bar span{display:block;height:100%;background:var(--teal)}</style>`;
    return page(session, ins.title, body, message);
  }

  async function saveStep(request, session, ins, index) {
    const f = await request.formData(), s = ins.template.sections[index];
    if (!s) return redirect(`${INSPECTION_BASE}/${ins.id}`);
    for (const item of s.items) {
      const name = `a_${item.id}`, prev = ins.answers[item.id] || {}, next = {...prev, note: String(f.get(name + '_obs') || '').slice(0, 500)};
      if (item.type === 'foto') {
        const files = f.getAll(name + '_foto').filter(x => x && typeof x === 'object' && x.size > 0);
        next.photos = [...(prev.photos || [])];
        for (const file of files) {
          if (next.photos.length >= MAX_PHOTOS_PER_ITEM) break;
          if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || file.size > MAX_PHOTO) continue;
          const key = `vistorias/${ins.id}/${item.id}-${randomUUID().slice(0, 8)}.${file.type.split('/')[1].replace('jpeg', 'jpg')}`;
          await bucket.put(key, new Uint8Array(await file.arrayBuffer()), {httpMetadata: {contentType: file.type}});
          next.photos.push(key);
        }
      } else {
        let v = String(f.get(name) ?? '').slice(0, 3000);
        if (item.type === 'ok' && !['', 'sim', 'nao', 'na'].includes(v)) v = '';
        if (item.type === 'opcoes' && v && !item.options.includes(v)) v = '';
        if (item.type === 'numero' && v) v = v.replace(',', '.').replace(/[^0-9.\-]/g, '').slice(0, 20);
        next.value = v;
      }
      ins.answers[item.id] = next;
    }
    const go = f.get('ir'), done = go === 'fim';
    await q('UPDATE inspections SET answers_json=?,status=?,updated_at=? WHERE id=?', JSON.stringify(ins.answers), done ? 'done' : ins.status === 'done' ? 'done' : 'draft', now(), ins.id).run();
    if (done) return redirect(`${INSPECTION_BASE}/${ins.id}/relatorio`);
    const n = Number(go);
    return redirect(`${INSPECTION_BASE}/${ins.id}?secao=${Number.isInteger(n) ? n : index}`);
  }

  function reportPage(session, ins) {
    const sum = summarize(ins.template, ins.answers), show = (item, a = {}) => {
      if (item.type === 'ok') return {sim: 'Conforme', nao: '<strong style="color:var(--danger)">Não conforme</strong>', na: 'Não se aplica'}[a.value] || '—';
      if (item.type === 'foto') return (a.photos || []).length ? `<div class="photo-row">${a.photos.map(p => `<img src="${INSPECTION_BASE}/foto?k=${encodeURIComponent(p)}" alt="">`).join('')}</div>` : '—';
      if (item.type === 'numero') return a.value ? `${esc(a.value.replace('.', ','))} ${esc(item.unit)}` : '—';
      return a.value ? esc(a.value).replace(/\n/g, '<br>') : '—';
    };
    const body = `<p class="muted"><a href="${INSPECTION_BASE}">Vistorias</a> / <a href="${INSPECTION_BASE}/${esc(ins.id)}">${esc(ins.title)}</a></p>
<h1>Relatório de vistoria</h1><p class="lead">${esc(ins.title)} · ${esc(ins.building || '')}</p>
<p class="muted">Modelo: ${esc(ins.template_name)} · Responsável: ${esc(ins.owner_name || ins.owner_email)} · Atualizado em ${fmtDateTime(ins.updated_at)} · ${ins.status === 'done' ? 'Concluída' : 'Em andamento'}</p>
<div class="panel"><h2>Resumo</h2><p>${sum.answered} de ${sum.total} itens respondidos. <strong>${sum.nonConform.length} não conformidade(s).</strong></p>${sum.nonConform.length ? `<ol>${sum.nonConform.map(i => `<li><strong>${esc(i.section)}</strong>: ${esc(i.label)}${ins.answers[i.id]?.note ? ' · ' + esc(ins.answers[i.id].note) : ''}</li>`).join('')}</ol>` : ''}</div>
${ins.template.sections.map(s => `<div class="panel"><h2>${esc(s.title)}</h2><table class="data"><tbody>${s.items.map(i => `<tr><th style="width:42%">${esc(i.label)}</th><td>${show(i, ins.answers[i.id])}${ins.answers[i.id]?.note ? `<br><span class="muted">${esc(ins.answers[i.id].note)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>`).join('')}
<div class="inline-actions no-print"><button class="button teal" onclick="print()">Imprimir / salvar PDF</button><a class="button ghost" href="${INSPECTION_BASE}/${esc(ins.id)}">Editar</a></div>
<style>.photo-row{display:flex;gap:8px;flex-wrap:wrap}.photo-row img{width:180px;height:135px;object-fit:cover;border-radius:6px}@media print{.site-head,.site-foot,.no-print{display:none}}</style>`;
    return page(session, 'Relatório de vistoria', body);
  }

  async function handle(request) {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    if (path !== INSPECTION_BASE && !path.startsWith(INSPECTION_BASE + '/')) return null;
    const session = await auth.sessionUser(request);
    if (!session) return redirect('/entrar?volta=' + encodeURIComponent(path + url.search));
    if (method === 'POST' && !auth.sameOrigin(request)) return html('Origem não autorizada.', 403);
    const admin = await isAdmin(session), rest = path.slice(INSPECTION_BASE.length);
    try {
      if (rest === '' || rest === '/') return listPage(session, admin, url.searchParams.get('modelo') === 'salvo' ? {kind: 'ok', text: 'Modelo salvo.'} : null);
      if (rest === '/foto') {
        const key = url.searchParams.get('k') || '', m = key.match(/^vistorias\/([0-9a-f-]{36})\//);
        if (!m || !await loadInspection(session, m[1], admin)) return new Response('Não encontrado', {status: 404});
        const obj = await bucket.get(key);
        if (!obj) return new Response('Não encontrado', {status: 404});
        return new Response(await obj.arrayBuffer(), {headers: {'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg', 'Cache-Control': 'private, max-age=3600'}});
      }
      if (rest === '/nova' && method === 'POST') {
        const f = await request.formData(), t = await q('SELECT * FROM inspection_templates WHERE id = ? AND active = 1', String(f.get('modelo') || '')).first();
        const title = String(f.get('titulo') || '').trim().slice(0, 160);
        if (!t || !title) return listPage(session, admin, {kind: 'error', text: 'Escolha o modelo e informe o título.'});
        const id = randomUUID();
        await q('INSERT INTO inspections (id,template_id,template_name,schema_json,title,building,status,answers_json,owner_id,owner_email,owner_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', id, t.id, t.name, t.schema_json, title, String(f.get('edificio') || '').slice(0, 200), 'draft', '{}', session.id, session.email, session.name || '', now(), now()).run();
        return redirect(`${INSPECTION_BASE}/${id}?secao=0`);
      }
      const tm = rest.match(/^\/modelos\/(novo|[0-9a-f-]{36})$/);
      if (tm) {
        if (!admin) return page(session, 'Modelos', '<h1>Modelos de vistoria</h1><p>Somente a administração edita modelos.</p>');
        if (method === 'POST') return saveTemplate(request, session, tm[1]);
        const t = tm[1] === 'novo' ? {source: DEFAULT_TEMPLATE.source.split('\n').slice(0, 4).join('\n')} : await q('SELECT * FROM inspection_templates WHERE id = ?', tm[1]).first();
        if (!t) return redirect(INSPECTION_BASE);
        return page(session, 'Modelo de vistoria', templateForm(t));
      }
      const im = rest.match(/^\/([0-9a-f-]{36})(\/relatorio)?$/);
      if (im) {
        const ins = await loadInspection(session, im[1], admin);
        if (!ins) return page(session, 'Vistoria', '<h1>Vistoria não encontrada</h1>');
        if (im[2]) return reportPage(session, ins);
        const index = Math.max(0, Number(url.searchParams.get('secao')) || 0);
        if (method === 'POST') return saveStep(request, session, ins, index);
        return stepPage(session, ins, index);
      }
      return redirect(INSPECTION_BASE);
    } catch (error) {
      log.error('[vistorias]', error);
      return page(session, 'Vistorias', '<h1>Não foi possível concluir</h1>', {kind: 'error', text: 'Erro ao processar a vistoria. Tente de novo.'});
    }
  }
  return {handle};
}
