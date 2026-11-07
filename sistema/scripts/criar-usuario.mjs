// Cria (ou redefine a senha de) uma conta já confirmada, sem depender de e-mail.
// Uso: node scripts/criar-usuario.mjs email@dominio.com "Nome Completo" "senha-com-10+caracteres"
import {loadDotEnv, readConfig} from '../server/platform/config.mjs';
import {openDatabase, migrate} from '../server/platform/database.mjs';
import {upsertVerifiedUser} from '../server/platform/auth.mjs';

const [email, name, password] = process.argv.slice(2);
if (!email || !password) { console.error('Uso: node scripts/criar-usuario.mjs email "Nome" "senha"'); process.exit(1); }
loadDotEnv();
const config = readConfig();
const db = await openDatabase(config);
await migrate(db, m => console.log(m));
const r = await upsertVerifiedUser(db, {email, name, password});
console.log(r.created ? 'Conta criada e confirmada: ' + email : 'Senha redefinida: ' + email);
await db.close();
