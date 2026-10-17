import {createServer} from 'node:http';
import {loadConfig} from './config.mjs';
import {createApp} from './app.mjs';
import {runBackup} from './backup.mjs';

const config=loadConfig();
if(!config.ownerEmail)console.warn('Aviso: SILSEC_OWNER_EMAIL não definido. Nenhuma conta terá papel de administrador no sistema.');
if(!config.publicOrigins.length)console.warn('Aviso: SILSEC_PUBLIC_ORIGINS não definido. Defina os endereços de acesso para bloquear DNS rebinding.');
const app=await createApp(config);
// SILSEC_HOST aceita vários endereços separados por vírgula (ex.: 127.0.0.1,10.66.0.2 para o túnel do relé).
const servers=config.host.split(',').map(h=>h.trim()).filter(Boolean).map(host=>{
 const server=createServer({requestTimeout:60000,headersTimeout:20000},app.listener);
 server.listen(config.port,host,()=>console.log(`SilSec servidor local em http://${host}:${config.port} · dados em ${config.dataDir}`));
 return server;
});

// Cópia diária automática às 02h (horário do servidor), além do backup externo do sistema operacional.
let lastBackupDay='';
const timer=setInterval(()=>{const d=new Date(),day=d.toDateString();if(d.getHours()===2&&day!==lastBackupDay){lastBackupDay=day;runBackup(app.sqlite,config).then(f=>console.log('Backup criado:',f)).catch(e=>console.error('Falha no backup:',e));}},60000);
timer.unref();

const stop=()=>{console.log('Encerrando…');let open=servers.length;for(const server of servers)server.close(()=>{if(--open===0){app.close();process.exit(0);}});setTimeout(()=>process.exit(1),10000).unref();};
process.on('SIGTERM',stop);process.on('SIGINT',stop);
