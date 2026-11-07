import test from 'node:test';
import assert from 'node:assert/strict';
import {D1,R2} from './helpers/sqlite-d1.mjs';
import {handleApi} from '../server/api.mjs';
import {defaultStudy} from '../public/engine.js';

async function setup(){
  const env={DB:new D1(),BUCKET:new R2(),SITE_OWNER_EMAIL:'owner@test.dev'};
  const admin={id:'adm',email:'owner@test.dev'};
  async function call(path,method='GET',data,user=admin){
    const h={'content-type':'application/json'};
    if(user){h['oai-authenticated-user-id']=user.id;h['oai-authenticated-user-email']=user.email;}
    const r=await handleApi(new Request('https://traffic.test/api/'+path,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data)}),env);
    return {status:r.status,data:await r.json()};
  }
  await call('session');
  async function member(email,role,team=''){
    const created=await call('team','POST',{email,name:email,role,team,exportApproved:true});
    assert.equal(created.status,200,JSON.stringify(created.data));
    await call('licenses/grant','POST',{memberId:created.data.id,module:'advanced',permanent:true});
    const user={id:email,email};
    await call('session','GET',undefined,user);
    return user;
  }
  return {env,call,admin,member};
}

test('administrador entra bloqueado, solicita, o proprietário aprova e aceita a alteração',async()=>{
  const {call,admin,member}=await setup();
  const a=await member('analista@test.dev','analyst','Norte');
  const created=await call('projects','PUT',{study:defaultStudy(),calculate:true},a);
  assert.equal(created.status,200);
  const pid=created.data.id;
  const path='projects/'+pid;

  let r=await call(path,'GET');
  assert.equal(r.data.canEdit,false);
  assert.equal(r.data.review.state,'locked');
  assert.equal((await call(path,'PUT',{study:defaultStudy(),revision:1,calculate:true})).status,403);

  assert.equal((await call(path+'/enter','POST')).status,200);
  r=await call(path+'/access-requests','POST');
  assert.equal(r.status,200);
  const rid=r.data.id;
  assert.equal((await call(path+'/access-requests','POST')).status,409);
  r=await call(path,'GET',undefined,a);
  assert.equal(r.data.review.requests.length,1);
  assert.equal((await call(path,'GET')).data.review.state,'awaiting_approval');

  r=await call(path+'/access-requests/'+rid+'/approve','POST',undefined,a);
  assert.equal(r.status,200);
  r=await call(path,'GET');
  assert.equal(r.data.review.state,'unlocked');
  assert.equal(r.data.canEdit,true);

  const changed={...defaultStudy(),name:'Alteração do administrador'};
  r=await call(path,'PUT',{study:changed,revision:1,calculate:true});
  assert.equal(r.status,200,JSON.stringify(r.data));
  assert.equal(r.data.revision,2);
  r=await call(path,'GET');
  assert.equal(r.data.review.state,'pending_acceptance');
  assert.equal(r.data.canEdit,false);
  assert.equal((await call(path,'PUT',{study:changed,revision:2,calculate:true})).status,403);

  r=await call(path,'PUT',{study:{...changed,name:'Outra'},revision:2,calculate:true},a);
  assert.equal(r.status,409);
  r=await call(path,'GET',undefined,a);
  const changeId=r.data.review.pendingChange.id;
  assert.equal(r.data.review.pendingChange.requesterEmail,admin.email);

  r=await call(path+'/changes/'+changeId+'/accept','POST',undefined,a);
  assert.equal(r.status,200);
  r=await call(path,'GET');
  assert.equal(r.data.review.state,'locked');

  const log=(await call(path+'/audit','GET',undefined,a)).data.events.map(e=>e.event);
  for(const ev of ['project.enter','access.request','access.approve','change.pending','change.accept'])
    assert.ok(log.includes(ev),'falta evento '+ev);
});

test('recusa de alteração restaura o estudo anterior e negar a solicitação mantém o bloqueio',async()=>{
  const {call,admin,member}=await setup();
  const a=await member('analista2@test.dev','analyst','Sul');
  const pid=(await call('projects','PUT',{study:defaultStudy(),calculate:true},a)).data.id;
  const path='projects/'+pid;
  const original=defaultStudy().name;

  const rid=(await call(path+'/access-requests','POST')).data.id;
  assert.equal((await call(path+'/access-requests/'+rid+'/deny','POST',undefined,a)).status,200);
  assert.equal((await call(path,'GET')).data.review.state,'locked');
  assert.equal((await call(path+'/access-requests','POST')).status,200);
  const rid2=(await call(path,'GET',undefined,a)).data.review.requests[0].id;
  await call(path+'/access-requests/'+rid2+'/approve','POST',undefined,a);
  assert.equal((await call(path,'PUT',{study:{...defaultStudy(),name:'Teste de recusa'},revision:1,calculate:true})).status,200);
  const cid=(await call(path,'GET',undefined,a)).data.review.pendingChange.id;
  assert.equal((await call(path+'/changes/'+cid+'/reject','POST',undefined,a)).status,200);
  const back=await call(path,'GET',undefined,a);
  assert.equal(back.data.study.name,original);
  assert.equal(back.data.revision,3);
});

test('gestor da empresa vê e altera projetos de todos os funcionários sem delegação',async()=>{
  const {env,call,member}=await setup();
  const gestor=await member('gestor@cliente.dev','client_manager');
  const func=await member('funcionario@cliente.dev','client_employee');
  const outro=await member('outro@cliente.dev','client_employee');
  const orgId='org-cliente-1';
  await env.DB.prepare("INSERT INTO silsec_organizations (id,cnpj,name,kind,fiscal_json,created_at) VALUES (?,?,?,?,?,?)").bind(orgId,'00000000000191','Cliente Um','client','{}','2026-11-04T00:00:00.000Z').run();
  const memb=async(email,level)=>{const r=await env.DB.prepare('SELECT id FROM members WHERE email=?').bind(email).first();await env.DB.prepare("INSERT INTO silsec_memberships (id,organization_id,member_id,level,permissions_json,active) VALUES (?,?,?,?,?,1)").bind('m-'+email,orgId,r.id,level,'{}').run();};
  await memb('gestor@cliente.dev','manager');
  await memb('funcionario@cliente.dev','employee');
  const pid=(await call('projects','PUT',{study:defaultStudy(),calculate:true},func)).data.id;
  const path='projects/'+pid;

  assert.equal((await call(path,'GET',undefined,gestor)).status,200);
  assert.equal((await call('workspace','GET',undefined,gestor)).data.projects.some(p=>p.id===pid),true);
  const r=await call(path,'PUT',{study:{...defaultStudy(),name:'Ajuste do gestor'},revision:1,calculate:true},gestor);
  assert.equal(r.status,200,JSON.stringify(r.data));
  assert.equal((await call(path,'GET',undefined,func)).data.study.name,'Ajuste do gestor');
  assert.equal((await call(path,'GET',undefined,outro)).status,404);
  const events=(await call(path+'/audit','GET',undefined,gestor)).data.events.map(e=>e.event);
  assert.ok(events.includes('project.update'));
  assert.ok(events.includes('project.view'));
});

test('gestor de empresa não altera projetos de outra empresa',async()=>{
  const {env,call,member}=await setup();
  const gestor=await member('gestor2@cliente.dev','client_manager');
  const outro=await member('dono@outra.dev','analyst');
  const pid=(await call('projects','PUT',{study:defaultStudy(),calculate:true},outro)).data.id;
  assert.equal((await call('projects/'+pid,'GET',undefined,gestor)).status,404);
});

test('gerente vê somente projetos da própria equipe e diretor sem acesso total',async()=>{
  const {call,member}=await setup();
  const ana=await member('ana@test.dev','analyst','Leste');
  const bruno=await member('bruno@test.dev','analyst','Oeste');
  const gerente=await member('ger@test.dev','manager','Leste');
  const diretor=await member('dir@test.dev','director');
  const pa=(await call('projects','PUT',{study:defaultStudy(),calculate:true},ana)).data.id;
  const pb=(await call('projects','PUT',{study:defaultStudy(),calculate:true},bruno)).data.id;
  assert.equal((await call('projects/'+pa,'GET',undefined,gerente)).status,200);
  assert.equal((await call('projects/'+pb,'GET',undefined,gerente)).status,404);
  assert.equal((await call('projects/'+pa,'GET',undefined,diretor)).status,404);
});
