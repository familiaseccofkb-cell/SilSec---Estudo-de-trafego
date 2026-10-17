const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const back=(()=>{const v=params.get('return_to')||'/';return v.startsWith('/')&&!v.startsWith('//')?v:'/';})();
if(params.has('saiu'))$('message').textContent='Você saiu da conta neste aparelho.';

async function clearOfflineData(){
 // Outra pessoa pode entrar neste aparelho: remove cópias de dados da conta anterior.
 try{await caches.delete('silsec-api');}catch{}
}

$('login').addEventListener('submit',async event=>{
 event.preventDefault();
 const button=event.submitter;button.disabled=true;$('message').textContent='Verificando…';
 try{
  const response=await fetch('/conta/entrar',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value,password:$('password').value,totp:$('totp').value||undefined})});
  const data=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}));
  if(response.ok){await clearOfflineData();location.assign(back);return;}
  if(data.needTotp){$('totp-field').hidden=false;$('totp').focus();}
  $('message').textContent=data.error||'Não foi possível entrar.';
 }catch{
  $('message').textContent='Servidor indisponível. Verifique a conexão com a internet ou com a rede local.';
 }finally{button.disabled=false;}
});
