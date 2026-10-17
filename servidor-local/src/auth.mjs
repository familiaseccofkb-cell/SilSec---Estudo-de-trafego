import {scrypt as scryptCb,randomBytes,randomInt,timingSafeEqual,createHash,randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
import {verifyTotp,newTotpSecret,otpauthUrl} from './totp.mjs';

const scrypt=promisify(scryptCb);
// scrypt N=2^15, r=8, p=1 (~32 MB de memória por tentativa): resistente a ataque com GPU.
const PARAMS={N:32768,r:8,p:1,maxmem:64*1024*1024},KEYLEN=64;
const now=()=>new Date().toISOString();
const sha256=value=>createHash('sha256').update(value).digest('hex');
export const normalizeEmail=v=>String(v||'').trim().toLowerCase();

export function validatePassword(password){
 const p=String(password||'');
 if(p.length<12)return 'A senha deve ter pelo menos 12 caracteres.';
 if(p.length>256)return 'A senha deve ter no máximo 256 caracteres.';
 if(new Set(p).size<6)return 'A senha repete poucos caracteres. Use uma frase ou combinação mais variada.';
 return null;
}
export async function hashPassword(password){
 const salt=randomBytes(16),key=await scrypt(String(password).normalize('NFKC'),salt,KEYLEN,PARAMS);
 return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}
export async function verifyPassword(password,stored){
 const [kind,N,r,p,salt,key]=String(stored||'').split('$');
 if(kind!=='scrypt')return false;
 const expected=Buffer.from(key,'base64'),actual=await scrypt(String(password).normalize('NFKC'),Buffer.from(salt,'base64'),expected.length,{N:+N,r:+r,p:+p,maxmem:64*1024*1024});
 return timingSafeEqual(expected,actual);
}
// Senha provisória de 16 caracteres sem símbolos ambíguos (0/O, 1/l/I).
const TEMP_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export function temporaryPassword(){for(;;){const p=Array.from({length:16},()=>TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]).join('');if(!validatePassword(p))return p;}}
// Hash fixo usado quando o e-mail não existe, para que o tempo de resposta não revele contas.
let dummyHash;const dummy=async()=>dummyHash??=await hashPassword(randomBytes(16).toString('hex'));

// Limite por endereço IP: janela deslizante simples em memória.
export class RateLimiter {
 constructor(limit,windowMs){this.limit=limit;this.windowMs=windowMs;this.hits=new Map();}
 take(key,at=Date.now()){
  const list=(this.hits.get(key)||[]).filter(t=>at-t<this.windowMs);
  if(list.length>=this.limit){this.hits.set(key,list);return false;}
  list.push(at);this.hits.set(key,list);
  if(this.hits.size>10000)for(const [k,v] of this.hits)if(!v.some(t=>at-t<this.windowMs))this.hits.delete(k);
  return true;
 }
}

export class Accounts {
 constructor(db,config){this.db=db;this.config=config;this.ipLimiter=new RateLimiter(20,15*60*1000);}
 log(event,{email=null,ip=null,detail=null}={}){this.db.prepare('INSERT INTO local_security_log (at,event,email,ip,detail) VALUES (?,?,?,?,?)').run(now(),event,email,ip,detail===null?null:JSON.stringify(detail));}
 byEmail(email){return this.db.prepare('SELECT * FROM local_accounts WHERE email = ?').get(normalizeEmail(email))||null;}
 async create({email,name,password}){
  email=normalizeEmail(email);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('E-mail inválido.');
  const problem=validatePassword(password);if(problem)throw new Error(problem);
  if(this.byEmail(email))throw new Error('Já existe uma conta com este e-mail.');
  const id=randomUUID(),at=now();
  this.db.prepare('INSERT INTO local_accounts (id,email,name,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(id,email,String(name||email).slice(0,120),await hashPassword(password),at,at);
  this.log('conta.criada',{email});
  return this.byEmail(email);
 }
 async setPassword(email,password){
  const account=this.byEmail(email);if(!account)throw new Error('Conta não encontrada.');
  const problem=validatePassword(password);if(problem)throw new Error(problem);
  this.db.prepare('UPDATE local_accounts SET password_hash = ?, failed_count = 0, locked_until = NULL, updated_at = ? WHERE id = ?').run(await hashPassword(password),now(),account.id);
  this.db.prepare('DELETE FROM local_sessions WHERE account_id = ?').run(account.id);
  this.log('senha.alterada',{email:account.email});
 }
 setTotp(email,secret){
  const account=this.byEmail(email);if(!account)throw new Error('Conta não encontrada.');
  this.db.prepare('UPDATE local_accounts SET totp_secret = ?, totp_enabled = ?, updated_at = ? WHERE id = ?').run(secret,secret?1:0,now(),account.id);
  this.log(secret?'2fa.ativado':'2fa.desativado',{email:account.email});
 }
 // Configuração em duas fases: o segredo só passa a valer depois de confirmado com um código.
 startTotp(email){
  const account=this.byEmail(email),secret=newTotpSecret();
  this.db.prepare('UPDATE local_accounts SET totp_secret = ?, totp_enabled = 0, updated_at = ? WHERE id = ? AND totp_enabled = 0').run(secret,now(),account.id);
  return {secret,url:otpauthUrl(secret,account.email)};
 }
 confirmTotp(email,code){
  const account=this.byEmail(email);
  if(account.totp_enabled)throw new Error('A verificação em duas etapas já está ativa.');
  if(!account.totp_secret||!verifyTotp(account.totp_secret,code))throw new Error('Código incorreto. Confira o horário do celular e tente novamente.');
  this.setTotp(email,account.totp_secret);
 }
 disableTotp(email,code){
  const account=this.byEmail(email);
  if(!account.totp_enabled)return;
  if(!verifyTotp(account.totp_secret,code))throw new Error('Código incorreto.');
  this.setTotp(email,null);
 }
 list(){return this.db.prepare('SELECT a.email,a.name,a.totp_enabled AS totpEnabled,a.disabled,a.locked_until AS lockedUntil,a.created_at AS createdAt,(SELECT max(last_seen) FROM local_sessions s WHERE s.account_id=a.id) AS lastSeen FROM local_accounts a ORDER BY a.name').all().map(r=>({...r,totpEnabled:!!r.totpEnabled,disabled:!!r.disabled}));}
 async createWithTemporaryPassword({email,name}){const password=temporaryPassword();await this.create({email,name,password});return password;}
 async resetTemporaryPassword(email){const password=temporaryPassword();await this.setPassword(email,password);return password;}
 setDisabled(email,disabled){
  const account=this.byEmail(email);if(!account)throw new Error('Conta não encontrada.');
  this.db.prepare('UPDATE local_accounts SET disabled = ?, updated_at = ? WHERE id = ?').run(disabled?1:0,now(),account.id);
  if(disabled)this.db.prepare('DELETE FROM local_sessions WHERE account_id = ?').run(account.id);
  this.log(disabled?'conta.bloqueada':'conta.liberada',{email:account.email});
 }
 // Retorna {account} ou {error,status,needTotp}.
 async login({email,password,totp},{ip,userAgent}){
  email=normalizeEmail(email);
  if(!this.ipLimiter.take(ip||'?')){this.log('login.limite',{email,ip});return {status:429,error:'Muitas tentativas. Aguarde 15 minutos.'};}
  const account=this.byEmail(email);
  if(!account){await verifyPassword(String(password||''),await dummy());this.log('login.falha',{email,ip});return {status:401,error:'E-mail ou senha incorretos.'};}
  if(account.locked_until&&account.locked_until>now()){this.log('login.bloqueado',{email,ip});return {status:429,error:'Conta temporariamente bloqueada por tentativas incorretas. Tente mais tarde.'};}
  const passwordOk=await verifyPassword(String(password||''),account.password_hash);
  if(!passwordOk||account.disabled){
   const failed=account.failed_count+1,lock=failed>=5?new Date(Date.now()+Math.min(60,2**(failed-5)*15)*60000).toISOString():null;
   this.db.prepare('UPDATE local_accounts SET failed_count = ?, locked_until = ? WHERE id = ?').run(failed,lock,account.id);
   this.log('login.falha',{email,ip,detail:{failed}});
   return {status:401,error:'E-mail ou senha incorretos.'};
  }
  if(account.totp_enabled){
   if(!totp)return {status:401,needTotp:true,error:'Informe o código do aplicativo autenticador.'};
   if(!verifyTotp(account.totp_secret,totp)){this.log('login.2fa_falha',{email,ip});return {status:401,needTotp:true,error:'Código do autenticador incorreto.'};}
  }
  this.db.prepare('UPDATE local_accounts SET failed_count = 0, locked_until = NULL WHERE id = ?').run(account.id);
  const token=randomBytes(32).toString('base64url'),at=now();
  this.db.prepare('INSERT INTO local_sessions (token_hash,account_id,created_at,expires_at,last_seen,user_agent,ip) VALUES (?,?,?,?,?,?,?)').run(sha256(token),account.id,at,new Date(Date.now()+this.config.sessionHours*3600000).toISOString(),at,String(userAgent||'').slice(0,300),ip||null);
  this.log('login.ok',{email,ip});
  return {account,token};
 }
 // Sessão deslizante: renova a cada uso até o limite absoluto de sessionMaxDays.
 session(token){
  if(!token||token.length>100)return null;
  const hash=sha256(token),row=this.db.prepare('SELECT s.*,a.email,a.name,a.disabled FROM local_sessions s JOIN local_accounts a ON a.id=s.account_id WHERE s.token_hash = ?').get(hash);
  if(!row)return null;
  const at=new Date(),absolute=new Date(Date.parse(row.created_at)+this.config.sessionMaxDays*86400000);
  if(row.disabled||row.expires_at<=at.toISOString()||absolute<=at){this.db.prepare('DELETE FROM local_sessions WHERE token_hash = ?').run(hash);return null;}
  const renewed=new Date(Math.min(at.getTime()+this.config.sessionHours*3600000,absolute.getTime())).toISOString();
  this.db.prepare('UPDATE local_sessions SET last_seen = ?, expires_at = ? WHERE token_hash = ?').run(at.toISOString(),renewed,hash);
  return {accountId:row.account_id,email:row.email,name:row.name};
 }
 logout(token){if(token)this.db.prepare('DELETE FROM local_sessions WHERE token_hash = ?').run(sha256(token));}
 purge(){this.db.prepare('DELETE FROM local_sessions WHERE expires_at <= ?').run(now());}
}
