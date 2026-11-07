// Configuração lida das variáveis de ambiente (painel da Hostinger) ou de um arquivo .env local.
import {readFileSync, existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';
import {BRAND} from '../../public/brand.js';
import {salePlans} from './plans.mjs';

export function loadDotEnv(file = resolve(process.cwd(), '.env')) {
  if (!existsSync(file)) return false;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1); else v = v.replace(/\s+#.*$/, '');
    process.env[m[1]] = v;
  }
  return true;
}

const DEFAULT_MAIL = BRAND.email;
const bool = (v, d) => v === undefined || v === '' ? d : /^(1|true|sim|yes|on)$/i.test(v);
const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };

export function readConfig(env = process.env) {
  const driver = (env.DB_DRIVER || (env.DB_HOST || env.DB_NAME ? 'mysql' : 'sqlite')).toLowerCase();
  const dataDir = env.DATA_DIR || join(homedir(), 'silsec-dados');
  const smtpPort = int(env.SMTP_PORT, 465);
  const aiKey = env.AI_API_KEY || env.OPENAI_API_KEY || '';
  return {
    port: env.PORT || 3000,
    host: env.HOST || undefined,
    appUrl: (env.APP_URL || '').replace(/\/+$/, ''),
    android: {packageName: (env.ANDROID_PACKAGE_NAME || '').trim(), fingerprints: (env.ANDROID_SHA256_FINGERPRINTS || '').split(',').map(s => s.trim().toUpperCase()).filter(f => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f))},
    ownerEmail: (env.SITE_OWNER_EMAIL || '').trim().toLowerCase(),
    production: env.NODE_ENV === 'production',
    // Modo computador: um único usuário local, sem login, servidor só em 127.0.0.1 (SILSEC_DESKTOP=1).
    desktop: env.SILSEC_DESKTOP === '1',
    db: driver === 'mysql'
      ? {driver, host: env.DB_HOST || 'localhost', port: int(env.DB_PORT, 3306), user: env.DB_USER, password: env.DB_PASSWORD || '', database: env.DB_NAME, socketPath: env.DB_SOCKET || '', connectionLimit: int(env.DB_CONNECTIONS, 5)}
      : {driver: 'sqlite', file: env.SQLITE_FILE || join(dataDir, 'silsec.sqlite')},
    storage: {driver: (env.STORAGE_DRIVER || 'db').toLowerCase(), dir: env.STORAGE_DIR || join(dataDir, 'arquivos')},
    auth: {
      signup: (env.SIGNUP_MODE || 'membros').toLowerCase(), // membros | aberto | fechado (só o proprietário)
      sessionDays: int(env.SESSION_DAYS, 30),
    },
    // E-mail de envio: por padrão contato@silsec-engenharia.com.br na Hostinger; basta informar SMTP_PASSWORD.
    smtp: (env.SMTP_HOST || env.SMTP_PASSWORD) ? {
      host: env.SMTP_HOST || 'smtp.hostinger.com', port: smtpPort, secure: bool(env.SMTP_SECURE, smtpPort === 465),
      user: env.SMTP_USER || DEFAULT_MAIL, password: env.SMTP_PASSWORD || '',
      from: env.SMTP_FROM || `${BRAND.name} <${env.SMTP_USER || DEFAULT_MAIL}>`,
      replyTo: env.SMTP_REPLY_TO || env.SMTP_USER || DEFAULT_MAIL,
    } : null,
    plans: salePlans(env),
    // Mercado Pago (Checkout Pro). Token de produção em Suas integrações → Credenciais.
    mercadoPago: {
      accessToken: env.MP_ACCESS_TOKEN || '',
      webhookSecret: env.MP_WEBHOOK_SECRET || '',
      sandbox: bool(env.MP_SANDBOX, false),
      maxInstallments: Math.min(12, Math.max(1, int(env.MP_PARCELAS, 1))),
      statementDescriptor: env.MP_DESCRICAO_FATURA || 'SILSEC',
    },
    ai: {
      apiKey: aiKey,
      format: (env.AI_FORMAT || (!env.AI_API_KEY && env.OPENAI_API_KEY ? 'openai-responses' : 'anthropic')).toLowerCase(),
      baseUrl: (env.AI_BASE_URL || (env.AI_API_KEY ? '' : env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : '')).replace(/\/+$/, ''),
      endpoint: env.AI_ENDPOINT || '',
      authHeader: (env.AI_AUTH_HEADER || (!env.AI_API_KEY && env.OPENAI_API_KEY ? 'bearer' : 'auto')).toLowerCase(),
      invoiceModel: env.AI_INVOICE_MODEL || env.AI_MODEL || env.OPENAI_INVOICE_MODEL || '',
      contractModel: env.AI_CONTRACT_MODEL || env.AI_MODEL || env.OPENAI_CONTRACT_MODEL || '',
    },
  };
}

// Ambiente entregue à API (mesmos nomes usados pelo código original).
export function apiEnv(config, db, bucket) {
  return {
    DB: db, BUCKET: bucket, SITE_OWNER_EMAIL: config.ownerEmail,
    AI: config.ai,
  };
}
