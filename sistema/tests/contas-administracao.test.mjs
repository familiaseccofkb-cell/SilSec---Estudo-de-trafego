import test from 'node:test';
import assert from 'node:assert/strict';
import {D1,R2} from './helpers/sqlite-d1.mjs';
import {handleApi,ownerEmail} from '../server/api.mjs';
import {ownerEmailList,isOwnerEmail,DEFAULT_OWNER_EMAILS} from '../server/platform/config.mjs';
import {loginPage,accountPage,resetPage} from '../server/platform/auth-pages.mjs';

const OWNERS='contato@silsec-engenharia.com.br,fabio.secco@silsec-engenharia.com.br,fabiosecco@hotmail.com,fabiossecco@gmail.com';

function api(env){
  return async(path,method='GET',data,user)=>{
    const h={'content-type':'application/json'};
    if(user){h['oai-authenticated-user-id']=user.id;h['oai-authenticated-user-email']=user.email;}
    const r=await handleApi(new Request('https://traffic.test/api/'+path,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data)}),env);
    return {status:r.status,data:await r.json()};
  };
}

test('lista de contas da administração: padrão com os quatro e-mails, mais SITE_OWNER_EMAIL, sem repetição',()=>{
  const list=ownerEmailList({SITE_OWNER_EMAIL:'Fabiosecco@hotmail.com'});
  assert.deepEqual([...list].sort(),DEFAULT_OWNER_EMAILS.slice().sort());
  const custom=ownerEmailList({SITE_OWNER_EMAIL:'x@y.z',SITE_OWNER_EMAILS:'a@b.c'});
  assert.deepEqual([...custom].sort(),['a@b.c','x@y.z']);
  assert.ok(isOwnerEmail({ownerEmails:list},'FABIOSSECCO@gmail.com'));
  assert.ok(!isOwnerEmail({ownerEmails:list},'outro@gmail.com'));
  assert.ok(ownerEmail({SITE_OWNER_EMAIL:'x@y.z',SITE_OWNER_EMAILS:OWNERS},'fabio.secco@silsec-engenharia.com.br'));
});

test('os quatro e-mails entram como administradores com acesso permanente (contagem infinita)',async()=>{
  const env={DB:new D1(),BUCKET:new R2(),SITE_OWNER_EMAIL:'contato@silsec-engenharia.com.br',SITE_OWNER_EMAILS:OWNERS};
  const call=api(env);
  for(const email of OWNERS.split(',')){
    const r=await call('session','GET',undefined,{id:'id-'+email,email});
    assert.equal(r.status,200,email);
    assert.equal(r.data.user.role,'admin',email);
    assert.equal(r.data.entitlements.advanced.active,true,email);
    assert.equal(r.data.entitlements.advanced.permanent,true,email);
    assert.equal(r.data.entitlements.advanced.endsAt??null,null,email);
  }
  // Um e-mail fora da lista não ganha acesso sozinho.
  const other=await call('session','GET',undefined,{id:'id-outro',email:'outro@exemplo.com'});
  assert.equal(other.status,403);
});

test('conta da administração cadastrada antes com papel menor é promovida e fica ativa',async()=>{
  const env={DB:new D1(),BUCKET:new R2(),SITE_OWNER_EMAIL:'contato@silsec-engenharia.com.br',SITE_OWNER_EMAILS:OWNERS};
  const call=api(env);
  const admin={id:'adm',email:'contato@silsec-engenharia.com.br'};
  await call('session','GET',undefined,admin);
  const created=await call('team','POST',{email:'fabiossecco@gmail.com',name:'Fabio',role:'analyst',team:'',exportApproved:true},admin);
  assert.equal(created.status,200);
  const r=await call('session','GET',undefined,{id:'g1','email':'fabiossecco@gmail.com'});
  assert.equal(r.data.user.role,'admin');
  assert.equal(r.data.entitlements.advanced.permanent,true);
});

test('campos de senha têm o botão de mostrar/ocultar (lupa) nas telas de entrada, senha nova e minha conta',()=>{
  for(const html of [loginPage({}),resetPage({token:'t'}),accountPage({user:{name:'F',email:'f@x.y'}})]){
    const inputs=(html.match(/type="password"/g)||[]).length;
    assert.ok(inputs>=1);
    assert.equal((html.match(/class="pw-eye"/g)||[]).length,inputs,'um botão por campo de senha');
    assert.match(html,/Mostrar o que estou digitando/);
    assert.match(html,/i\.type=show\?'text':'password'/);
  }
});
