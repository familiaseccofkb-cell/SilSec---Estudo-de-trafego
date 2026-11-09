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
