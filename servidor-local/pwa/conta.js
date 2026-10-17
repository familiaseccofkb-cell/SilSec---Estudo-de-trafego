const $=id=>document.getElementById(id);
const say=text=>{$('message').textContent=text;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function post(path,body){
 const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});
 const data=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}));
 if(!response.ok){const error=new Error(data.error||'Falha na operação.');error.data=data;throw error;}
 return data;
}
const date=v=>v?new Date(v).toLocaleString('pt-BR'):'—';

async function load(){
 const response=await fetch('/conta/eu',{credentials:'same-origin'});
 if(!response.ok){location.assign('/entrar?return_to=%2Fconta');return;}
 const me=await response.json();
 $('who').textContent=`${me.name} · ${me.email}${me.owner?' · administrador do servidor':''}`;
 $('totp-status').textContent=me.totpEnabled?'Ativa: o código do aplicativo é pedido a cada entrada.':'Inativa. Recomendada para todas as contas, obrigatória para o administrador.';
 $('totp-start').hidden=me.totpEnabled;$('totp-disable').hidden=!me.totpEnabled;$('pw-totp-field').hidden=!me.totpEnabled;
 $('admin').hidden=!me.owner;
 if(me.owner)$('accounts').innerHTML=me.accounts.map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(a.email)}</td><td>${a.totpEnabled?'sim':'não'}</td><td>${a.disabled?'bloqueada':a.lockedUntil&&a.lockedUntil>new Date().toISOString()?'bloqueio temporário':'ativa'}</td><td>${esc(date(a.lastSeen))}</td><td><button type="button" data-reset="${esc(a.email)}">Nova senha</button>${a.email===me.email?'':`<button type="button" data-block="${esc(a.email)}" data-disabled="${a.disabled?'0':'1'}">${a.disabled?'Liberar':'Bloquear'}</button>`}</td></tr>`).join('');
}

$('password-form').addEventListener('submit',async event=>{
 event.preventDefault();
 try{await post('/conta/senha',{current:$('current').value,password:$('new-password').value,totp:$('pw-totp').value||undefined});say('Senha alterada. Entre novamente com a nova senha.');setTimeout(()=>location.assign('/entrar'),1500);}
 catch(error){say(error.message);}
});
$('totp-start').addEventListener('click',async()=>{
 try{const data=await post('/conta/2fa/iniciar');$('totp-secret').textContent=data.secret.replace(/(.{4})/g,'$1 ').trim();$('totp-link').href=data.url;$('totp-setup').hidden=false;$('totp-code').focus();}
 catch(error){say(error.message);}
});
$('totp-confirm').addEventListener('submit',async event=>{
 event.preventDefault();
 try{await post('/conta/2fa/confirmar',{code:$('totp-code').value});$('totp-setup').hidden=true;say('Verificação em duas etapas ativada.');await load();}
 catch(error){say(error.message);}
});
$('totp-disable').addEventListener('submit',async event=>{
 event.preventDefault();
 try{await post('/conta/2fa/desativar',{code:$('totp-off-code').value});say('Verificação em duas etapas desativada.');await load();}
 catch(error){say(error.message);}
});
$('create-form').addEventListener('submit',async event=>{
 event.preventDefault();
 try{const data=await post('/conta/admin/criar',{name:$('new-name').value,email:$('new-email').value});say(`Conta criada. Senha provisória (aparece só agora): ${data.password}`);event.target.reset();await load();}
 catch(error){say(error.message);}
});
$('accounts').addEventListener('click',async event=>{
 const reset=event.target.dataset.reset,block=event.target.dataset.block;
 try{
  if(reset&&confirm(`Gerar nova senha para ${reset}? As sessões abertas serão encerradas.`)){const data=await post('/conta/admin/redefinir',{email:reset});say(`Nova senha provisória de ${reset}: ${data.password}`);}
  if(block){await post('/conta/admin/bloquear',{email:block,disabled:event.target.dataset.disabled==='1'});say('Situação da conta atualizada.');}
  await load();
 }catch(error){say(error.message);}
});
$('logout').addEventListener('click',async()=>{
 try{navigator.serviceWorker?.controller?.postMessage('limpar-dados');await caches.delete('silsec-api');}catch{}
 await post('/conta/sair').catch(()=>{});location.assign('/entrar?saiu=1');
});
load();
