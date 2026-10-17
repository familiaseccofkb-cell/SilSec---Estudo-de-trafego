// Registra o service worker (instalação no celular/computador e uso sem conexão).
if('serviceWorker' in navigator&&window.isSecureContext){
 navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(error=>console.warn('Service worker indisponível:',error));
}
// Mostra ao usuário quando o aparelho está sem conexão com o servidor.
const banner=document.createElement('div');
banner.className='local-offline';banner.setAttribute('role','status');banner.hidden=navigator.onLine;
banner.textContent='Sem conexão: os cálculos continuam funcionando neste aparelho. Salve no servidor quando a conexão voltar.';
document.body.append(banner);
addEventListener('online',()=>{banner.hidden=true;});
addEventListener('offline',()=>{banner.hidden=false;});
// O botão "sair" do aplicativo original leva a /signout-with-chatgpt; limpa a cópia offline antes.
document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[href^="/signout"]');
 if(link)navigator.serviceWorker?.controller?.postMessage('limpar-dados');
},true);
