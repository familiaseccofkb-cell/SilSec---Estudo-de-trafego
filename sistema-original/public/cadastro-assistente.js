// Assistente de cadastro (somente administrador).
// Funções puras: usadas no servidor (rotas /api/admin/cadastro/*) e na interface.
// Nada aqui salva dados; as sugestões só são gravadas quando o administrador
// as aplica ao formulário e salva o cadastro.

const W_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export const onlyDigits = value => String(value ?? '').replace(/\D/g, '');

const norm = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim();

const escHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export function isValidCnpj(value) {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const dv = (weights, length) => {
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(W_CNPJ_1, 12) === Number(d[12]) && dv(W_CNPJ_2, 13) === Number(d[13]);
}

export function formatCnpj(value) {
  const d = onlyDigits(value);
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : '';
}

export function formatCep(value) {
  const d = onlyDigits(value);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : '';
}

const PLACEHOLDER_EMAIL = /^(sem|xxx|nf|naoinform|nao_inform|atualizar|sememail|clientesem)/;

export function cleanEmail(value) {
  const e = String(value ?? '').trim().toLowerCase().replace(/\.+$/, '');
  if (!/^[a-z0-9._%+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$/.test(e)) return '';
  const local = e.split('@')[0];
  if (PLACEHOLDER_EMAIL.test(local) || /^[xn.\-_0-9]{1,3}$/.test(local)) return '';
  return e;
}

// Telefone brasileiro: DDD (11 a 99) + 8 ou 9 dígitos. Aceita prefixo 55.
export function formatPhone(value) {
  let d = onlyDigits(value);
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (new Set(d).size === 1) return '';
  if (d.length === 11 && Number(d.slice(0, 2)) >= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10 && Number(d.slice(0, 2)) >= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return '';
}

export function composeAddress({ logradouro, numero, complemento, bairro, municipio, uf, cep } = {}) {
  const street = [logradouro, numero].filter(Boolean).join(', ');
  const city = [municipio, uf].filter(Boolean).join('/');
  return [street, complemento, bairro, city, formatCep(cep) ? `CEP ${formatCep(cep)}` : '']
    .map(s => String(s ?? '').trim()).filter(Boolean).join(' - ');
}

export const emptySuggestion = () => ({
  source: '',
  client: '',
  customer: { companyName: '', cnpj: '', address: '', phone: '', email: '', contact: '' },
  project: { building: '', address: '', contact: '', phone: '' },
  situation: '',
  warnings: []
});

// Resposta da BrasilAPI (dados públicos do cadastro da Receita Federal).
export function mapCnpjPayload(payload = {}) {
  const s = emptySuggestion();
  s.source = 'BrasilAPI (cadastro público da Receita Federal)';
  s.client = String(payload.razao_social || payload.nome_fantasia || '').trim(); // nome jurídico, como nos contratos
  s.customer.companyName = s.client;
  s.customer.cnpj = formatCnpj(payload.cnpj);
  s.customer.address = composeAddress(payload);
  s.customer.phone = formatPhone(payload.ddd_telefone_1) || '';
  s.customer.email = cleanEmail(payload.email);
  const socio = Array.isArray(payload.qsa) ? payload.qsa.find(x => x?.nome_socio) : null;
  s.customer.contact = socio ? String(socio.nome_socio).trim() : '';
  s.situation = String(payload.descricao_situacao_cadastral || '').trim();
  if (s.situation && norm(s.situation) !== 'ativa') s.warnings.push(`Situação cadastral na Receita: ${s.situation}. Confirme antes de usar.`);
  return reviewSuggestion(s);
}

// Resposta do ViaCEP.
export function mapCepPayload(payload = {}) {
  const address = composeAddress({
    logradouro: payload.logradouro, complemento: payload.complemento, bairro: payload.bairro,
    municipio: payload.localidade, uf: payload.uf, cep: payload.cep
  });
  return { address, cep: formatCep(payload.cep), street: payload.logradouro || '', city: payload.localidade || '', uf: payload.uf || '' };
}

// Aplica o endereço do CEP ao cliente ou à obra, sem apagar o restante da sugestão.
export function withCepAddress(suggestion, target, address) {
  const s = { ...emptySuggestion(), ...(suggestion || {}), customer: { ...emptySuggestion().customer, ...(suggestion?.customer || {}) }, project: { ...emptySuggestion().project, ...(suggestion?.project || {}) } };
  if (target === 'obra') s.project.address = address;
  else s.customer.address = address;
  s.warnings = s.warnings.filter(w => !/CEP/.test(w));
  return s;
}

const LABELS = {
  company: ['razao social', 'nome empresarial', 'empresa', 'cliente', 'contratante', 'nome do cliente', 'razao social da empresa'],
  fantasy: ['nome fantasia'],
  contact: ['contato', 'responsavel', 'a/c', 'aos cuidados de', 'atencao', 'contato na empresa'],
  customerAddress: ['endereco', 'endereco da empresa', 'endereco do cliente', 'endereco do contratante', 'logradouro'],
  projectAddress: ['endereco da obra', 'local da obra', 'endereco do projeto', 'endereco do empreendimento', 'local da instalacao'],
  building: ['obra', 'nome da obra', 'edificio', 'empreendimento', 'nome do projeto', 'projeto', 'condominio'],
  phone: ['telefone', 'fone', 'celular', 'tel', 'whatsapp'],
  email: ['email', 'e-mail', 'e mail'],
  cep: ['cep']
};

function labelled(lines) {
  const map = new Map();
  for (const line of lines) {
    const m = line.match(/^([^:]{2,60}):\s*(.+)$/);
    if (m && !map.has(norm(m[1]))) map.set(norm(m[1]), m[2].trim().replace(/[;,.\s]+$/, ''));
  }
  return key => {
    for (const k of LABELS[key]) if (map.has(k)) return map.get(k);
    return '';
  };
}

// Extrai sugestões de texto colado (proposta, e-mail, cartão CNPJ, cabeçalho de contrato).
export function parseDocumentText(text) {
  const s = emptySuggestion();
  s.source = 'Texto colado';
  const raw = String(text ?? '').slice(0, 20000);
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const get = labelled(lines);

  const cnpjMatch = [...raw.matchAll(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g)].map(m => m[0]).find(isValidCnpj);
  const cnpjInvalid = !cnpjMatch && /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/.test(raw);
  if (cnpjMatch) s.customer.cnpj = formatCnpj(cnpjMatch);
  if (cnpjInvalid) s.warnings.push('Há um número com formato de CNPJ, mas os dígitos verificadores não conferem.');

  s.client = get('company') || get('fantasy');
  s.customer.companyName = s.client;
  s.customer.contact = get('contact');
  s.customer.address = get('customerAddress');
  s.project.address = get('projectAddress');
  s.project.building = get('building');

  const phoneLabel = get('phone');
  const phones = [...(phoneLabel ? [phoneLabel] : []), ...lines, raw]
    .flatMap(t => [...String(t).matchAll(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g)].map(m => m[0]));
  s.customer.phone = phones.map(formatPhone).find(Boolean) || '';

  const emailLabel = get('email');
  const emails = [...(emailLabel ? [emailLabel] : []), raw]
    .flatMap(t => [...String(t).matchAll(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+/g)].map(m => m[0]));
  s.customer.email = emails.map(cleanEmail).find(Boolean) || '';

  const cepLabel = get('cep');
  const cepMatch = (cepLabel.match(/\d{5}-?\d{3}/) || raw.match(/\bCEP[:\s]*(\d{5}-?\d{3})\b/i) || [])[0] || '';
  if (cepMatch && s.customer.address && !/\d{5}-?\d{3}/.test(s.customer.address)) {
    s.customer.address = `${s.customer.address} - CEP ${formatCep(cepMatch) || cepMatch}`;
  }
  if (cepMatch && s.project.address && !/\d{5}-?\d{3}/.test(s.project.address)) {
    s.project.address = `${s.project.address} - CEP ${formatCep(cepMatch) || cepMatch}`;
  }

  return reviewSuggestion(s);
}

// Avisos para o administrador conferir antes de aplicar.
export function reviewSuggestion(s) {
  const out = { ...emptySuggestion(), ...s, customer: { ...emptySuggestion().customer, ...(s.customer || {}) }, project: { ...emptySuggestion().project, ...(s.project || {}) } };
  const warnings = [...(s.warnings || [])];
  const filled = [out.client, out.customer.cnpj, out.customer.address, out.customer.phone, out.customer.email, out.customer.contact, out.project.building, out.project.address].some(Boolean);
  if (!filled) warnings.push('Nenhum dado reconhecido. Confira o texto ou o documento.');
  if (out.client && !out.customer.companyName) out.customer.companyName = out.client;
  if (out.customer.address && !/\d{5}-?\d{3}/.test(out.customer.address)) warnings.push('Endereço do cliente sem CEP. Use a busca por CEP para completar.');
  if (out.project.address && !/\d{5}-?\d{3}/.test(out.project.address)) warnings.push('Endereço da obra sem CEP. Use a busca por CEP para completar.');
  if (out.customer.email === '' && out.customer.phone === '' && out.customer.contact === '') warnings.push('Nenhum contato (telefone, e-mail ou responsável) encontrado.');
  return { ...out, warnings: [...new Set(warnings)] };
}

// Preenche campos do estudo (rascunho). Por padrão só preenche campos vazios.
export function applySuggestion(draft, suggestion, { overwrite = false } = {}) {
  const out = structuredClone(draft);
  const s = reviewSuggestion(suggestion);
  const setIf = (obj, key, value) => {
    if (!value) return;
    if (overwrite || !obj[key]) obj[key] = value;
  };
  out.customer = { cnpj: '', companyName: '', address: '', phone: '', email: '', contact: '', ...(out.customer || {}) };
  out.projectDetails = { name: '', address: '', contact: '', phone: '', ...(out.projectDetails || {}) };
  setIf(out, 'client', s.client);
  setIf(out.customer, 'companyName', s.client);
  setIf(out.customer, 'cnpj', s.customer.cnpj);
  setIf(out.customer, 'address', s.customer.address);
  setIf(out.customer, 'phone', s.customer.phone);
  setIf(out.customer, 'email', s.customer.email);
  setIf(out.customer, 'contact', s.customer.contact);
  setIf(out, 'building', s.project.building);
  setIf(out, 'address', s.project.address);
  setIf(out.projectDetails, 'contact', s.project.contact);
  setIf(out.projectDetails, 'phone', s.project.phone);
  return out;
}

// Painel exibido somente para o administrador, dentro do cadastro do estudo.
export function assistantPanel(suggestion, { readOnly = false } = {}) {
  const preview = suggestion ? (() => {
    const rows = [
      ['Cliente', suggestion.client],
      ['CNPJ', suggestion.customer.cnpj],
      ['Endereço do cliente', suggestion.customer.address],
      ['Telefone do cliente', suggestion.customer.phone],
      ['E-mail do cliente', suggestion.customer.email],
      ['Contato do cliente', suggestion.customer.contact],
      ['Obra', suggestion.project.building],
      ['Endereço da obra', suggestion.project.address]
    ].filter(([, v]) => v);
    return `<div class="assistant-preview"><p class="small-copy">Origem: ${escHtml(suggestion.source || 'consulta')}</p>
      ${rows.length ? `<dl class="assistant-list">${rows.map(([k, v]) => `<dt>${escHtml(k)}</dt><dd>${escHtml(v)}</dd>`).join('')}</dl>` : '<p>Nenhum campo sugerido.</p>'}
      ${suggestion.warnings.length ? `<ul class="assistant-warnings">${suggestion.warnings.map(w => `<li>${escHtml(w)}</li>`).join('')}</ul>` : ''}
      <label class="check"><input type="checkbox" id="cad-sobrescrever"><span>Substituir campos já preenchidos</span></label>
      <div class="buttons"><button type="button" class="btn primary" data-action="cadastro-aplicar" ${readOnly ? 'disabled' : ''}>Aplicar sugestões ao formulário</button>
      <button type="button" class="btn" data-action="cadastro-limpar">Descartar</button></div></div>`;
  })() : '';
  return `<details class="details-box assistant-box" open><summary>Assistente de cadastro · somente administrador</summary>
    <p class="small-copy">Sugestões para conferência. Nada é salvo até você aplicar e depois salvar o cadastro. As consultas de CNPJ e CEP usam os serviços públicos BrasilAPI e ViaCEP.</p>
    <div class="fields">
      <div class="field"><label for="cad-cnpj">CNPJ do cliente</label><input id="cad-cnpj" type="text" inputmode="numeric" maxlength="18" placeholder="00.000.000/0000-00"></div>
      <div class="field"><label>&nbsp;</label><button type="button" class="btn" data-action="cadastro-buscar-cnpj" ${readOnly ? 'disabled' : ''}>Buscar CNPJ</button></div>
      <div class="field"><label for="cad-cep">CEP</label><input id="cad-cep" type="text" inputmode="numeric" maxlength="9" placeholder="00000-000"></div>
      <div class="field"><label for="cad-cep-destino">Usar o CEP para</label><select id="cad-cep-destino"><option value="cliente">Endereço do cliente</option><option value="obra">Endereço da obra</option></select></div>
      <div class="field"><label>&nbsp;</label><button type="button" class="btn" data-action="cadastro-buscar-cep" ${readOnly ? 'disabled' : ''}>Buscar CEP</button></div>
      <div class="field wide"><label for="cad-texto">Colar texto de proposta, contrato ou cartão CNPJ</label><textarea id="cad-texto" rows="5" maxlength="20000" placeholder="Ex.: Cliente: Empresa X Ltda · CNPJ 00.000.000/0001-91 · Telefone (11) 4000-0000 · contato@empresa.com.br"></textarea></div>
      <div class="field"><label>&nbsp;</label><button type="button" class="btn" data-action="cadastro-analisar-texto" ${readOnly ? 'disabled' : ''}>Analisar texto</button></div>
    </div>
    ${preview}
  </details>`;
}
