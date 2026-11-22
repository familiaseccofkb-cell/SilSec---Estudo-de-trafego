// SilSec Engenharia · versão para rede local (Opção A, fase 1).
// Um computador da rede (o "servidor") roda este programa e o MariaDB local; os outros computadores
// abrem o endereço do servidor no navegador e entram com o próprio usuário. Nada sincroniza com o site.
//
// Uso (normalmente chamado pela tarefa "SilSec Servidor", criada pelo instalador):
//   node rede-local.mjs                          inicia o servidor
//   node rede-local.mjs verificar                confere configuração e banco, sem abrir a porta
//   node rede-local.mjs usuario <e-mail> "Nome"  cria uma conta (ou troca a senha); a senha é lida da entrada padrão
//
// Configuração: arquivo silsec-rede.env (protegido; só Administradores e o sistema leem), em
//   SILSEC_REDE_CONFIG, ou %ProgramData%\SilSec Rede Local\config\silsec-rede.env.
// Chaves: PORTA, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, ADMIN_EMAIL, PASTA_DADOS.
import {readFileSync, existsSync, mkdirSync} from 'node:fs';
import {hostname} from 'node:os';
import {join} from 'node:path';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`O SilSec precisa do Node.js 22.13 ou mais novo (encontrado ${process.versions.node}).`);
  process.exit(1);
}

export const PORTA_PADRAO = 3980;
export const PORTA_PROIBIDA = 3957;
export const PASTA_PADRAO = join(process.env.ProgramData || 'C:\\ProgramData', 'SilSec Rede Local');

export function arquivoConfig(env = process.env) {
  return env.SILSEC_REDE_CONFIG || join(PASTA_PADRAO, 'config', 'silsec-rede.env');
}

export function lerArquivoEnv(file) {
  const out = {};
  for (const line of readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

// Monta o ambiente do servidor a partir do arquivo de configuração. Devolve {env, erros}.
export function montarAmbiente(cfg, base = {}) {
  const erros = [];
  const porta = Number(cfg.PORTA || PORTA_PADRAO);
  if (!Number.isInteger(porta) || porta < 1024 || porta > 65535) erros.push(`PORTA inválida: ${cfg.PORTA}`);
  if (porta === PORTA_PROIBIDA) erros.push(`A porta ${PORTA_PROIBIDA} não pode ser usada.`);
  for (const k of ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'ADMIN_EMAIL']) if (!cfg[k]) erros.push(`Falta ${k} no arquivo de configuração.`);
  const dbHost = cfg.DB_HOST || '127.0.0.1';
  // O banco só pode estar neste computador: os outros computadores falam com o programa, nunca com o banco.
  if (!['127.0.0.1', 'localhost', '::1'].includes(dbHost)) erros.push(`DB_HOST deve ser 127.0.0.1 (encontrado ${dbHost}).`);
  const admin = String(cfg.ADMIN_EMAIL || '').trim().toLowerCase();
  if (admin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin)) erros.push(`ADMIN_EMAIL inválido: ${cfg.ADMIN_EMAIL}`);
  const pasta = cfg.PASTA_DADOS || PASTA_PADRAO;
  const env = {...base};
  // Nada de e-mail, IA, pagamento ou chaves do site na versão local (fase 1): remove o que vier do ambiente.
  for (const k of Object.keys(env)) if (/^(SMTP_|AI_|OPENAI_|MP_|DATABASE_URL$|SQLITE_FILE$|SILSEC_DESKTOP$)/.test(k)) delete env[k];
  Object.assign(env, {
    SILSEC_REDE: '1', NODE_ENV: 'production',
    // A versão offline é da TES (Traffic Estimator System); MARCA=silsec no arquivo de configuração volta à marca SilSec.
    SILSEC_MARCA: String(cfg.MARCA || 'tes').toLowerCase() === 'silsec' ? 'silsec' : 'tes',
    HOST: cfg.HOST || '0.0.0.0', PORT: String(porta),
    APP_URL: (cfg.ENDERECO || `http://${hostname()}:${porta}`).replace(/\/+$/, ''),
    DB_DRIVER: 'mysql', DB_HOST: dbHost, DB_PORT: String(cfg.DB_PORT || 3306),
    DB_NAME: cfg.DB_NAME || '', DB_USER: cfg.DB_USER || '', DB_PASSWORD: cfg.DB_PASSWORD || '',
    DB_CONNECTIONS: String(cfg.DB_CONNECTIONS || 10),
    DATA_DIR: pasta, STORAGE_DRIVER: 'db',
    // Só a conta do administrador local tem acesso de administração (substitui a lista padrão do site).
    SITE_OWNER_EMAIL: admin, SITE_OWNER_EMAILS: admin,
    // Sem cadastro aberto: o administrador cria as contas (node rede-local.mjs usuario ...).
    SIGNUP_MODE: 'fechado',
  });
  return {env, erros, porta, pasta};
}

async function lerSenhaDaEntrada() {
  if (process.env.SILSEC_NOVA_SENHA) return process.env.SILSEC_NOVA_SENHA;
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8').split(/\r?\n/)[0];
}

async function principal() {
  const [cmd, ...args] = process.argv.slice(2);
  const file = arquivoConfig();
  if (!existsSync(file)) {
    console.error(`Arquivo de configuração não encontrado: ${file}\nRode o instalador do SilSec Rede Local.`);
    process.exit(2);
  }
  const {env, erros, porta, pasta} = montarAmbiente(lerArquivoEnv(file), process.env);
  if (erros.length) { console.error('Configuração com problema:\n- ' + erros.join('\n- ')); process.exit(2); }
  for (const k of Object.keys(process.env)) if (!(k in env)) delete process.env[k];
  Object.assign(process.env, env);
  mkdirSync(pasta, {recursive: true});

  if (cmd === 'verificar' || cmd === 'usuario') {
    const {readConfig} = await import('./server/platform/config.mjs');
    const {openDatabase, migrate} = await import('./server/platform/database.mjs');
    const db = await openDatabase(readConfig());
    try {
      const aplicadas = await migrate(db, m => console.log(m));
      const versao = await db.prepare('SELECT VERSION() AS v').bind().first('v');
      if (cmd === 'verificar') {
        const total = await db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').bind().first('n');
        console.log(`OK · banco ${versao} · ${total} migrações (${aplicadas.length} novas) · porta ${porta} · dados em ${pasta}`);
      } else {
        const [email, nome] = args;
        if (!email) { console.error('Uso: node rede-local.mjs usuario <e-mail> "Nome"  (senha pela entrada padrão)'); process.exitCode = 1; return; }
        const senha = await lerSenhaDaEntrada();
        if (!senha || senha.length < 10) { console.error('A senha precisa ter pelo menos 10 caracteres.'); process.exitCode = 1; return; }
        const {upsertVerifiedUser} = await import('./server/platform/auth.mjs');
        const r = await upsertVerifiedUser(db, {email, name: nome || email, password: senha});
        console.log(r.created ? `Conta criada: ${email}` : `Senha trocada: ${email}`);
      }
    } finally { await db.close(); }
    return;
  }
  if (cmd) { console.error(`Comando desconhecido: ${cmd}`); process.exit(1); }

  console.log('SilSec Engenharia · versão para rede local');
  console.log(`Endereço na rede: ${env.APP_URL}  ·  dados em ${pasta}`);
  await import('./server.mjs');
}

const direto = process.argv[1] && import.meta.url.toLowerCase().endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop().toLowerCase());
if (direto) await principal();
