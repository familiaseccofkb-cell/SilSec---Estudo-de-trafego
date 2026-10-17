import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const list=v=>String(v||'').split(',').map(x=>x.trim().replace(/\/+$/,'')).filter(Boolean);
const int=(v,fallback)=>{const n=Number.parseInt(v,10);return Number.isFinite(n)&&n>0?n:fallback;};

// Toda a configuração vem de variáveis de ambiente (arquivo /etc/silsec/silsec.env em produção).
export function loadConfig(env=process.env){
 const appRoot=resolve(env.SILSEC_APP_DIR||resolve(here,'../../sistema-original'));
 return {
  host:env.SILSEC_HOST||'127.0.0.1',
  port:int(env.SILSEC_PORT,8080),
  dataDir:resolve(env.SILSEC_DATA_DIR||resolve(here,'../dados')),
  appRoot,
  publicDir:resolve(appRoot,'public'),
  migrationsDir:resolve(appRoot,'drizzle'),
  pwaDir:resolve(here,'../pwa'),
  // Endereços pelos quais o sistema é acessado (DDNS, domínio próprio, rede local).
  // Requisições com outro Host são recusadas (proteção contra DNS rebinding).
  publicOrigins:list(env.SILSEC_PUBLIC_ORIGINS),
  // Somente "true" quando atrás do Caddy local ou do relé em nuvem.
  trustProxy:env.SILSEC_TRUST_PROXY==='true',
  ownerEmail:String(env.SILSEC_OWNER_EMAIL||'').trim().toLowerCase(),
  sessionHours:int(env.SILSEC_SESSION_HOURS,12),
  sessionMaxDays:int(env.SILSEC_SESSION_MAX_DAYS,30),
  backupDir:resolve(env.SILSEC_BACKUP_DIR||resolve(env.SILSEC_DATA_DIR||resolve(here,'../dados'),'backups')),
  backupKeep:int(env.SILSEC_BACKUP_KEEP,14),
  // Recursos de IA enviam documentos a um serviço externo; ficam desligados salvo decisão explícita.
  openaiApiKey:env.SILSEC_ENABLE_EXTERNAL_AI==='true'?env.OPENAI_API_KEY||'':''
 };
}
