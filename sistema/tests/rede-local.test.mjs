// Rede local (Opção A, fase 1): configuração do inicializador e origem das requisições sem proxy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {montarAmbiente, lerArquivoEnv, PORTA_PADRAO} from '../rede-local.mjs';
import {readConfig} from '../server/platform/config.mjs';
import {requestOrigin, clientIp} from '../server/platform/http.mjs';
import {writeFileSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const base = {DB_NAME: 'silsec', DB_USER: 'silsec', DB_PASSWORD: 'x'.repeat(24), ADMIN_EMAIL: 'Admin@Escritorio.test'};

test('rede local: ambiente montado com MariaDB local, porta 3980, cadastro fechado e só o administrador local como dono', () => {
  const {env, erros, porta} = montarAmbiente(base, {SMTP_PASSWORD: 's', AI_API_KEY: 'k', MP_ACCESS_TOKEN: 't', SILSEC_DESKTOP: '1', PATH: 'p'});
  assert.deepEqual(erros, []);
  assert.equal(porta, PORTA_PADRAO);
  assert.equal(env.PORT, '3980');
  assert.equal(env.SILSEC_REDE, '1');
  assert.equal(env.DB_DRIVER, 'mysql');
  assert.equal(env.DB_HOST, '127.0.0.1');
  assert.equal(env.SIGNUP_MODE, 'fechado');
  assert.equal(env.SITE_OWNER_EMAIL, 'admin@escritorio.test');
  assert.equal(env.SITE_OWNER_EMAILS, 'admin@escritorio.test');
  for (const k of ['SMTP_PASSWORD', 'AI_API_KEY', 'MP_ACCESS_TOKEN', 'SILSEC_DESKTOP']) assert.equal(env[k], undefined, k);
  assert.equal(env.PATH, 'p');
  const config = readConfig(env);
  assert.equal(config.lan, true);
  assert.equal(config.desktop, false);
  assert.equal(config.smtp, null);
  assert.equal(config.ai.apiKey, '');
  assert.deepEqual([...config.ownerEmails], ['admin@escritorio.test']);
});

test('rede local: recusa porta 3957, banco fora deste computador e configuração incompleta', () => {
  assert.match(montarAmbiente({...base, PORTA: '3957'}).erros.join(), /3957/);
  assert.match(montarAmbiente({...base, DB_HOST: '192.168.0.10'}).erros.join(), /DB_HOST/);
  assert.match(montarAmbiente({...base, PORTA: '80'}).erros.join(), /PORTA/);
  const sem = montarAmbiente({}).erros.join(' ');
  for (const k of ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'ADMIN_EMAIL']) assert.match(sem, new RegExp(k));
});

test('rede local: arquivo de configuração com BOM, aspas e comentários', () => {
  const dir = mkdtempSync(join(tmpdir(), 'silsec-rede-'));
  const f = join(dir, 'silsec-rede.env');
  writeFileSync(f, '﻿# comentário\r\nPORTA=3980\r\nDB_PASSWORD="a b=c"\r\nADMIN_EMAIL = adm@x.test \r\n');
  assert.deepEqual(lerArquivoEnv(f), {PORTA: '3980', DB_PASSWORD: 'a b=c', ADMIN_EMAIL: 'adm@x.test'});
});

test('rede local: origem é o endereço que o navegador usou (http), sem confiar em X-Forwarded-*; o site continua igual', () => {
  const req = (host, extra = {}) => ({headers: {host, ...extra}, socket: {encrypted: false, remoteAddress: '192.168.15.20'}});
  const lan = {lan: true, appUrl: 'http://SERVIDOR:3980'};
  assert.equal(requestOrigin(req('192.168.15.11:3980'), lan), 'http://192.168.15.11:3980');
  assert.equal(requestOrigin(req('servidor-silsec:3980', {'x-forwarded-host': 'evil.test', 'x-forwarded-proto': 'https'}), lan), 'http://servidor-silsec:3980');
  assert.equal(clientIp(req('x', {'x-forwarded-for': '10.9.9.9'}), !lan.lan), '192.168.15.20');
  // Hostinger (sem lan): mesmo comportamento de antes.
  const site = {appUrl: 'https://silsec-engenharia.com.br'};
  assert.equal(requestOrigin(req('silsec-engenharia.com.br'), site), 'https://silsec-engenharia.com.br');
  assert.equal(requestOrigin(req('www.silsec-engenharia.com.br'), site), 'https://www.silsec-engenharia.com.br');
  assert.equal(clientIp(req('x', {'x-forwarded-for': '10.9.9.9'}), true), '10.9.9.9');
});
