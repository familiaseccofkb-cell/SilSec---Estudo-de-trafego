import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidCnpj, formatCnpj, formatPhone, cleanEmail, composeAddress, mapCnpjPayload, mapCepPayload,
  parseDocumentText, reviewSuggestion, applySuggestion, withCepAddress, emptySuggestion, assistantPanel
} from '../public/cadastro-assistente.js';
import {cadastroAssistenteApi} from '../server/cadastro-assistente.mjs';
import {emptyCustomer, validateCustomer} from '../public/records.js';

test('CNPJ: dígitos verificadores, formatação e rejeição de sequências', () => {
  assert.equal(isValidCnpj('11.222.333/0001-81'), true);
  assert.equal(isValidCnpj('11222333000181'), true);
  assert.equal(isValidCnpj('11.222.333/0001-82'), false);
  assert.equal(isValidCnpj('11111111111111'), false);
  assert.equal(isValidCnpj('123'), false);
  assert.equal(formatCnpj('11222333000181'), '11.222.333/0001-81');
});

test('telefone e e-mail: padrões brasileiros e placeholders descartados', () => {
  assert.equal(formatPhone('+55 (11) 98765-4321'), '(11) 98765-4321');
  assert.equal(formatPhone('1133334444'), '(11) 3333-4444');
  assert.equal(formatPhone('9999999999'), '');
  assert.equal(formatPhone('0112345'), '');
  assert.equal(cleanEmail('Contato@Empresa.com.br.'), 'contato@empresa.com.br');
  assert.equal(cleanEmail('sem@otis.com'), '');
  assert.equal(cleanEmail('xxx@xxx.com'), '');
  assert.equal(cleanEmail('nf@nf.com.br'), '');
});

test('endereço composto a partir de campos separados', () => {
  assert.equal(
    composeAddress({logradouro: 'Rua Augusta', numero: '1000', complemento: 'Sala 2', bairro: 'Consolação', municipio: 'São Paulo', uf: 'SP', cep: '01304001'}),
    'Rua Augusta, 1000 - Sala 2 - Consolação - São Paulo/SP - CEP 01304-001'
  );
});

test('texto colado: extrai cliente, CNPJ, contatos e obra; avisa o que falta', () => {
  const s = parseDocumentText([
    'Razão Social: Condomínio Edifício Vila Verde',
    'CNPJ 11.222.333/0001-81',
    'Responsável: Maria Souza',
    'E-mail: sindico@vilaverde.com.br',
    'Telefone: (11) 3456-7890',
    'Endereço: Rua das Flores, 45 - Jardins, São Paulo/SP, CEP 01425-000',
    'Obra: Elevador Torre B'
  ].join('\n'));
  assert.equal(s.client, 'Condomínio Edifício Vila Verde');
  assert.equal(s.customer.companyName, 'Condomínio Edifício Vila Verde');
  assert.equal(s.customer.cnpj, '11.222.333/0001-81');
  assert.equal(s.customer.contact, 'Maria Souza');
  assert.equal(s.customer.email, 'sindico@vilaverde.com.br');
  assert.equal(s.customer.phone, '(11) 3456-7890');
  assert.match(s.customer.address, /01425-000/);
  assert.equal(s.project.building, 'Elevador Torre B');
  assert.deepEqual(s.warnings, []);
});

test('texto colado: CNPJ com dígitos errados gera aviso e não é usado', () => {
  const s = parseDocumentText('Cliente: Empresa X\nCNPJ 11.222.333/0001-82');
  assert.equal(s.customer.cnpj, '');
  assert.ok(s.warnings.some(w => /dígitos verificadores/.test(w)));
});

test('texto sem dados reconhecíveis gera aviso claro', () => {
  const s = parseDocumentText('Bom dia, segue o arquivo em anexo.');
  assert.ok(s.warnings.some(w => /Nenhum dado reconhecido/.test(w)));
});

test('resposta da BrasilAPI é convertida em sugestão, com alerta de situação', () => {
  const s = mapCnpjPayload({
    cnpj: '11222333000181', razao_social: 'EMPRESA EXEMPLO LTDA', nome_fantasia: 'Exemplo',
    logradouro: 'RUA DOS TESTES', numero: '10', bairro: 'Centro', municipio: 'SAO PAULO', uf: 'SP', cep: '01000000',
    ddd_telefone_1: '1133334444', email: 'financeiro@exemplo.com.br', descricao_situacao_cadastral: 'BAIXADA',
    qsa: [{nome_socio: 'João Silva'}]
  });
  assert.equal(s.client, 'EMPRESA EXEMPLO LTDA');
  assert.equal(s.customer.cnpj, '11.222.333/0001-81');
  assert.equal(s.customer.phone, '(11) 3333-4444');
  assert.equal(s.customer.contact, 'João Silva');
  assert.match(s.customer.address, /CEP 01000-000/);
  assert.ok(s.warnings.some(w => /BAIXADA/.test(w)));
});

test('resposta do ViaCEP vira endereço para cliente ou obra', () => {
  const r = mapCepPayload({logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP', cep: '01310-100'});
  assert.equal(r.address, 'Avenida Paulista - Bela Vista - São Paulo/SP - CEP 01310-100');
  const cliente = withCepAddress(null, 'cliente', r.address);
  assert.equal(cliente.customer.address, r.address);
  const obra = withCepAddress(cliente, 'obra', 'Rua X, 5 - CEP 01310-100');
  assert.equal(obra.project.address, 'Rua X, 5 - CEP 01310-100');
  assert.equal(obra.customer.address, r.address);
});

test('aplicação: preenche só campos vazios por padrão e substitui com a opção marcada', () => {
  const draft = {client: 'Original', customer: {...emptyCustomer(), phone: '(11) 1111-1111'}, projectDetails: {}, building: '', address: ''};
  const sug = reviewSuggestion({...emptySuggestion(), client: 'Novo nome', customer: {...emptySuggestion().customer, phone: '(11) 2222-2222', email: 'a@b.com.br', cnpj: '11.222.333/0001-81'}, project: {...emptySuggestion().project, building: 'Obra 1'}});
  const kept = applySuggestion(draft, sug);
  assert.equal(kept.client, 'Original');
  assert.equal(kept.customer.phone, '(11) 1111-1111');
  assert.equal(kept.customer.email, 'a@b.com.br');
  assert.equal(kept.customer.cnpj, '11.222.333/0001-81');
  assert.equal(kept.building, 'Obra 1');
  assert.equal(draft.client, 'Original', 'o rascunho original não é alterado');
  const replaced = applySuggestion(draft, sug, {overwrite: true});
  assert.equal(replaced.client, 'Novo nome');
  assert.equal(replaced.customer.phone, '(11) 2222-2222');
});

test('cadastro do cliente aceita o campo CNPJ e preserva os demais', () => {
  const v = validateCustomer({companyName: 'Cliente', cnpj: '11.222.333/0001-81', phone: '123'});
  assert.equal(v.cnpj, '11.222.333/0001-81');
  assert.equal(v.phone, '123');
  assert.equal(emptyCustomer().cnpj, '');
});

test('painel do assistente escapa texto de terceiros e desabilita ações em modo de consulta', () => {
  const s = parseDocumentText('Cliente: <img src=x onerror=alert(1)>');
  const html = assistantPanel(s, {readOnly: true});
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img/);
  assert.match(html, /data-action="cadastro-buscar-cnpj" disabled/);
  assert.match(html, /somente administrador/);
});

// ---- rotas do servidor ----
const ctxFor = (user, input, fetcher) => {
  const calls = [];
  const f = async (url, opts) => { calls.push(url); return fetcher(url, opts); };
  return {
    calls,
    ctx: {
      user, parts: ['admin', 'cadastro', ...input.route], method: input.method || 'POST',
      request: {}, body: async () => input.body || {}, json: (data, status = 200) => ({data, status}),
      fetcher: f
    }
  };
};
const admin = {id: 'a1', role: 'admin'};
const notFound = async () => new Response('', {status: 404});
const ok = payload => async () => new Response(JSON.stringify(payload), {status: 200, headers: {'Content-Type': 'application/json'}});

test('rotas: não administrador é bloqueado antes de qualquer consulta externa', async () => {
  for (const role of ['analyst', 'client', 'supplier', 'director', 'manager', undefined]) {
    const {ctx, calls} = ctxFor({id: 'u', role}, {route: ['cnpj'], body: {cnpj: '11222333000181'}}, ok({}));
    await assert.rejects(cadastroAssistenteApi(ctx), e => e.status === 403);
    assert.equal(calls.length, 0, `perfil ${role} não deve chamar serviço externo`);
  }
  const {ctx, calls} = ctxFor({id: 'u', role: 'analyst'}, {route: ['texto'], body: {text: 'Cliente: X'}}, ok({}));
  await assert.rejects(cadastroAssistenteApi(ctx), e => e.status === 403);
  assert.equal(calls.length, 0);
});

test('rotas: administrador consulta CNPJ com dígitos válidos e recebe sugestão', async () => {
  const {ctx, calls} = ctxFor(admin, {route: ['cnpj'], body: {cnpj: '11.222.333/0001-81'}}, ok({
    cnpj: '11222333000181', razao_social: 'EMPRESA LTDA', descricao_situacao_cadastral: 'ATIVA', qsa: []
  }));
  const r = await cadastroAssistenteApi(ctx);
  assert.equal(r.status, 200);
  assert.equal(r.data.suggestion.client, 'EMPRESA LTDA');
  assert.equal(calls[0], 'https://brasilapi.com.br/api/cnpj/v1/11222333000181');
});

test('rotas: CNPJ inválido não chega ao serviço externo', async () => {
  const {ctx, calls} = ctxFor(admin, {route: ['cnpj'], body: {cnpj: '11.222.333/0001-82'}}, ok({}));
  await assert.rejects(cadastroAssistenteApi(ctx), e => e.status === 400);
  assert.equal(calls.length, 0);
});

test('rotas: CNPJ não encontrado, serviço fora do ar e CEP', async () => {
  const a = ctxFor(admin, {route: ['cnpj'], body: {cnpj: '11222333000181'}}, notFound);
  await assert.rejects(cadastroAssistenteApi(a.ctx), e => e.status === 404);
  const b = ctxFor(admin, {route: ['cnpj'], body: {cnpj: '11222333000181'}}, async () => { throw new Error('rede'); });
  await assert.rejects(cadastroAssistenteApi(b.ctx), e => e.status === 502);
  const c = ctxFor(admin, {route: ['cep'], body: {cep: '01310-100'}}, ok({logradouro: 'Avenida Paulista', localidade: 'São Paulo', uf: 'SP', cep: '01310100'}));
  const r = await cadastroAssistenteApi(c.ctx);
  assert.equal(r.data.address, 'Avenida Paulista - São Paulo/SP - CEP 01310-100');
  assert.equal(c.calls[0], 'https://viacep.com.br/ws/01310100/json/');
  const d = ctxFor(admin, {route: ['cep'], body: {cep: '01310100'}}, ok({erro: true}));
  await assert.rejects(cadastroAssistenteApi(d.ctx), e => e.status === 404);
});

test('rotas: texto colado é analisado sem chamada externa e texto longo é recusado', async () => {
  const {ctx, calls} = ctxFor(admin, {route: ['texto'], body: {text: 'Cliente: Condomínio Alfa\nTelefone: (11) 99999-1234'}}, ok({}));
  const r = await cadastroAssistenteApi(ctx);
  assert.equal(r.data.suggestion.client, 'Condomínio Alfa');
  assert.equal(calls.length, 0);
  const big = ctxFor(admin, {route: ['texto'], body: {text: 'x'.repeat(20001)}}, ok({}));
  await assert.rejects(cadastroAssistenteApi(big.ctx), e => e.status === 400);
});

test('rotas: operação desconhecida e método incorreto', async () => {
  const a = ctxFor(admin, {route: ['inexistente']}, ok({}));
  await assert.rejects(cadastroAssistenteApi(a.ctx), e => e.status === 404);
  const b = ctxFor(admin, {route: ['cnpj'], method: 'GET'}, ok({}));
  await assert.rejects(cadastroAssistenteApi(b.ctx), e => e.status === 405);
});
