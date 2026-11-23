// Cria (ou redefine a senha de) uma conta já confirmada, sem depender de e-mail.
// Uso: node scripts/criar-usuario.mjs email@dominio.com "Nome Completo" "senha-com-10+caracteres"
// Senha temporária (a pessoa é obrigada a criar uma senha nova no primeiro acesso; vale 72 horas):
//      node scripts/criar-usuario.mjs --temporaria email@dominio.com "Nome Completo" ["senha-temporária"]
//      Sem a senha, o sistema gera uma e a mostra uma única vez nesta tela (nada é enviado por e-mail).
import {loadDotEnv, readConfig} from '../server/platform/config.mjs';
import {openDatabase, migrate} from '../server/platform/database.mjs';
import {upsertVerifiedUser, setTemporaryPassword, generateTemporaryPassword, TEMP_HOURS} from '../server/platform/auth.mjs';

const args = process.argv.slice(2), temporaria = args[0] === '--temporaria';
const [email, name, informada] = temporaria ? args.slice(1) : args;
if (!email || (!temporaria && !informada)) {
  console.error('Uso: node scripts/criar-usuario.mjs email "Nome" "senha"\n     node scripts/criar-usuario.mjs --temporaria email "Nome" ["senha-temporária"]');
  process.exit(1);
}
loadDotEnv();
const config = readConfig();
const db = await openDatabase(config);
await migrate(db, m => console.log(m));
if (temporaria) {
  const senha = informada || generateTemporaryPassword();
  const r = await setTemporaryPassword(db, {email, name, password: senha});
  await db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').bind(r.id).run();
  console.log((r.created ? 'Conta criada com senha temporária: ' : 'Senha temporária gravada: ') + email);
  if (!informada) console.log('Senha temporária (aparece só agora): ' + senha);
  console.log(`Vale ${TEMP_HOURS} horas. No primeiro acesso a pessoa é obrigada a criar uma senha nova.`);
} else {
  const r = await upsertVerifiedUser(db, {email, name, password: informada});
  console.log(r.created ? 'Conta criada e confirmada: ' + email : 'Senha redefinida: ' + email);
}
await db.close();
