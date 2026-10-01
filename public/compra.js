// Retorno do Stripe: mostra a situação do pedido e, quando pago, o link para criar a senha.
(()=>{
 const box=document.querySelector('#status'),q=new URLSearchParams(location.search),order=q.get('pedido'),session=q.get('session_id');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const show=(icon,kind,title,text,action='')=>{box.innerHTML=`<div class="status-icon ${kind}" aria-hidden="true">${icon}</div><h1>${title}</h1><p>${text}</p>${action}`;};
 if(!order||!session){show('!','bad','Pedido não encontrado','Abra novamente o link recebido após o pagamento.','<a class="btn" href="/">Voltar ao início</a>');return;}
 let attempts=0;
 async function check(){
  attempts++;
  try{
   const r=await fetch(`/api/checkout/status?pedido=${encodeURIComponent(order)}&session=${encodeURIComponent(session)}`,{credentials:'same-origin'}),b=await r.json();
   if(!r.ok){show('!','bad','Pedido não encontrado',esc(b.error||'Confira o link e tente novamente.'),'<a class="btn" href="/">Voltar ao início</a>');return;}
   if(b.status==='paid'){
    if(b.activationUrl)show('✓','','Pagamento confirmado!',`Seu acesso está liberado. Agora crie sua senha para entrar com <strong>${esc(b.email)}</strong>.`,`<a class="btn" href="${esc(b.activationUrl)}">Criar minha senha</a><p class="secure">O link é pessoal e vale por 7 dias.</p>`);
    else show('✓','','Pagamento confirmado!','Seu acesso já está atualizado na plataforma.','<a class="btn" href="/app#inicio">Ir para a plataforma</a>');
    return;
   }
   if(b.status==='pending'){
    show('…','wait','Aguardando a confirmação','Se você pagou com Pix, a confirmação costuma levar poucos instantes. No boleto, pode levar até 3 dias úteis. Esta página se atualiza sozinha; você também pode voltar a ela depois pelo mesmo link.');
    if(attempts<60)setTimeout(check,attempts<12?5000:20000);
    return;
   }
   if(b.status==='refunded'){show('↺','bad','Pedido reembolsado','Este pedido foi reembolsado e o acesso correspondente foi encerrado.','<a class="btn" href="/">Voltar ao início</a>');return;}
   show('!','bad','Pagamento não concluído','O pagamento não foi aprovado ou expirou. Você pode tentar de novo quando quiser.','<a class="btn" href="/#comprar">Tentar novamente</a>');
  }catch{show('!','bad','Sem conexão','Não foi possível verificar agora. Atualize a página em instantes.');}
 }
 check();
})();
