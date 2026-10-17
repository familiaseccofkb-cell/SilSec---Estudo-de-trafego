import {mkdir,readdir,rm,cp} from 'node:fs/promises';
import {join} from 'node:path';

// Cópia consistente com o servidor em funcionamento: VACUUM INTO grava um banco
// íntegro mesmo com escritas simultâneas. Os arquivos anexos são copiados ao lado.
export async function runBackup(sqlite,config){
 const stamp=new Date().toISOString().replace(/[:.]/g,'-'),dir=join(config.backupDir,'silsec-'+stamp);
 await mkdir(dir,{recursive:true,mode:0o700});
 sqlite.prepare('VACUUM INTO ?').run(join(dir,'silsec.sqlite'));
 await cp(join(config.dataDir,'arquivos'),join(dir,'arquivos'),{recursive:true,force:false,errorOnExist:false}).catch(e=>{if(e.code!=='ENOENT')throw e;});
 const all=(await readdir(config.backupDir)).filter(x=>x.startsWith('silsec-')).sort();
 for(const old of all.slice(0,Math.max(0,all.length-config.backupKeep)))await rm(join(config.backupDir,old),{recursive:true,force:true});
 return dir;
}
