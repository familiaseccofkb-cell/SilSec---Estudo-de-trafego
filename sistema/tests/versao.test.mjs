import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {APP_VERSION} from '../public/version.js';

test('versão única: package.json, version.js e service worker batem',()=>{
  const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  const sw=fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
  assert.equal(pkg.version,APP_VERSION,'package.json difere de version.js');
  assert.match(sw,new RegExp("const VERSAO = 'silsec-v"+APP_VERSION.replace(/\./g,'\\.')+"'"),'sw.js não foi atualizado para a versão '+APP_VERSION);
});

test('migrações repetíveis: índice/coluna/tabela já existentes são ignorados; migrar duas vezes não falha',async()=>{
  const {openSqlite,migrate,alreadyApplied}=await import('../server/platform/database.mjs');
  assert.equal(alreadyApplied({code:'ER_DUP_KEYNAME',errno:1061,message:"Duplicate key name 'idx_par_project_status'"}),true);
  assert.equal(alreadyApplied({code:'ER_DUP_FIELDNAME',errno:1060,message:"Duplicate column name 'previous_name'"}),true);
  assert.equal(alreadyApplied(new Error('index idx_par_project_status already exists')),true);
  assert.equal(alreadyApplied(new Error('no such table: projects')),false);
  const db=await openSqlite(':memory:');
  await migrate(db);
  await migrate(db);
  const idx=await db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_par_project_status'").bind().first();
  assert.ok(idx,'índice da 0009 criado');
  const col=await db.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('project_changes') WHERE name='previous_name'").bind().first();
  assert.equal(col.n,1,'coluna da 0010 criada');
});
