// Rotas do assistente de cadastro. Exclusivas do administrador do sistema.
// POST /api/admin/cadastro/cnpj   { cnpj }   -> dados públicos do CNPJ (BrasilAPI)
// POST /api/admin/cadastro/cep    { cep }    -> endereço pelo CEP (ViaCEP)
// POST /api/admin/cadastro/texto  { text }   -> sugestões a partir de texto colado (sem serviço externo)
import {
  isValidCnpj, onlyDigits, mapCnpjPayload, mapCepPayload, parseDocumentText, reviewSuggestion, formatCep
} from '../public/cadastro-assistente.js';

const fail = (status, message) => { const e = Error(message); e.status = status; throw e; };
const TIMEOUT = 8000;

async function fetchJson(fetcher, url, unavailable) {
  let response;
  try {
    response = await fetcher(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT) });
  } catch {
    fail(502, unavailable);
  }
  if (response.status === 404) return null;
  if (!response.ok) fail(502, unavailable);
  try {
    return await response.json();
  } catch {
    fail(502, unavailable);
  }
}

export async function cadastroAssistenteApi(ctx) {
  const { user, parts, method, body, json, fetcher = fetch } = ctx;
  if (parts[0] !== 'admin' || parts[1] !== 'cadastro') return null;
  // A verificação de perfil vem antes de qualquer consulta externa.
  if (user?.role !== 'admin') fail(403, 'Esta ação é exclusiva do administrador do sistema.');
  if (method !== 'POST') fail(405, 'Método não permitido.');
  const input = await body(ctx.request);
  const fetchedAt = new Date().toISOString();

  if (parts[2] === 'cnpj') {
    const digits = onlyDigits(input.cnpj);
    if (!isValidCnpj(digits)) fail(400, 'CNPJ inválido. Confira os 14 dígitos informados.');
    const payload = await fetchJson(fetcher, `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      'Consulta de CNPJ indisponível no momento. Preencha os dados manualmente.');
    if (!payload) fail(404, 'CNPJ não encontrado na base pública. Confira o número ou preencha manualmente.');
    return json({ suggestion: mapCnpjPayload(payload), source: 'BrasilAPI', fetchedAt });
  }

  if (parts[2] === 'cep') {
    const digits = onlyDigits(input.cep);
    if (digits.length !== 8) fail(400, 'CEP inválido. Informe os 8 dígitos.');
    const payload = await fetchJson(fetcher, `https://viacep.com.br/ws/${digits}/json/`,
      'Consulta de CEP indisponível no momento. Preencha o endereço manualmente.');
    if (!payload || payload.erro) fail(404, 'CEP não encontrado. Confira o número ou preencha manualmente.');
    return json({ ...mapCepPayload(payload), cep: formatCep(digits), source: 'ViaCEP', fetchedAt });
  }

  if (parts[2] === 'texto') {
    const text = typeof input.text === 'string' ? input.text : '';
    if (text.length > 20000) fail(400, 'O texto excede 20.000 caracteres. Cole apenas o cabeçalho ou os dados de contato.');
    return json({ suggestion: reviewSuggestion(parseDocumentText(text)), source: 'texto colado', fetchedAt });
  }

  fail(404, 'Operação não encontrada.');
}
