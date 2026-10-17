import {createInterface} from 'node:readline/promises';
import {join} from 'node:path';
import {loadConfig} from './config.mjs';
import {openDatabase} from './db.mjs';
import {Accounts,temporaryPassword} from './auth.mjs';
import {runBackup} from './backup.mjs';

const HELP=`Uso: npm run cli -- <comando> [argumentos]

  criar-conta <email> "<nome>"     cria conta e mostra senha provisória
  redefinir-senha <email>          gera nova senha provisória e encerra sessões
  bloquear <email> | liberar <email>
  desativar-2fa <email>            remove a verificação em duas etapas (perda do celular)
  contas                           lista as contas
  backup                           cria cópia imediata em SILSEC_BACKUP_DIR
  log [quantidade]                 últimos eventos de segurança (padrão 50)
`;

const config=loadConfig();
const db=openDatabase(join(config.dataDir,'silsec.sqlite'),config.migrationsDir);
const accounts=new Accounts(db,config);
const [command,...args]=process.argv.slice(2);
const need=n=>{if(args.length<n){console.error(HELP);process.exit(2);}};
try{
 switch(command){
  case 'criar-conta':{need(1);const password=temporaryPassword();await accounts.create({email:args[0],name:args[1]||args[0],password});console.log(`Conta criada: ${args[0]}\nSenha provisória (troque no primeiro acesso em /conta): ${password}`);
   if(config.ownerEmail&&args[0].toLowerCase()!==config.ownerEmail)console.log('Lembrete: cadastre este e-mail na equipe, como cliente ou fornecedor dentro do sistema para liberar o acesso aos estudos.');break;}
  case 'redefinir-senha':{need(1);const password=temporaryPassword();await accounts.setPassword(args[0],password);console.log(`Nova senha provisória: ${password}`);break;}
  case 'bloquear':need(1);accounts.setDisabled(args[0],true);console.log('Conta bloqueada e sessões encerradas.');break;
  case 'liberar':need(1);accounts.setDisabled(args[0],false);console.log('Conta liberada.');break;
  case 'desativar-2fa':need(1);accounts.setTotp(args[0],null);console.log('Verificação em duas etapas removida.');break;
  case 'contas':console.table(accounts.list());break;
  case 'backup':console.log('Backup criado em',await runBackup(db,config));break;
  case 'log':console.table(db.prepare('SELECT at,event,email,ip FROM local_security_log ORDER BY id DESC LIMIT ?').all(Number(args[0])||50));break;
  case 'senha':{need(1);const rl=createInterface({input:process.stdin,output:process.stdout});const p=await rl.question('Nova senha: ');rl.close();await accounts.setPassword(args[0],p);console.log('Senha alterada.');break;}
  default:console.log(HELP);
 }
}catch(error){console.error('Erro:',error.message);process.exitCode=1;}
finally{db.close();}
