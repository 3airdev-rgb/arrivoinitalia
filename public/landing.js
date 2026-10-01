// Página de vendas: preços vindos do servidor, total ao vivo e início do checkout no Stripe.
(()=>{
 // Links antigos da plataforma (/#ativar, /#entrar…) seguem para /app.
 if(/^#(ativar|entrar|inicio|trilha|modulo|aula|admin|perfil|planner|fornitore|agenda|suporte|historico|favoritos)\b/.test(location.hash)){location.replace('/app'+location.hash);return;}
 const money=c=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100);
 const form=document.querySelector('#buy-form'),button=document.querySelector('#buy-button'),message=document.querySelector('#buy-message'),totalEl=document.querySelector('#total');
 let offer=null;
 const total=()=>{if(!offer)return;let sum=offer.total.course;for(const p of ['planner','fornitore'])if(form.elements[p].checked)sum+=offer.total[p];totalEl.textContent=money(sum);};
 const say=(html)=>{message.innerHTML=html;};
 fetch('/api/offer',{credentials:'same-origin'}).then(r=>r.json()).then(data=>{
  offer=data.offer;
  document.querySelectorAll('[data-price]').forEach(el=>{const p=el.dataset.price,v=offer.prices[p];el.textContent=el.classList.contains('addon-price')?'+ '+money(v):p==='course'?money(v):'+ '+money(v);});
  total();
  if(!data.payments){button.disabled=true;say('As vendas abrem em breve. Volte em alguns dias.');}
  if(data.signedIn){button.disabled=true;say('Você já está conectado. <a href="/app#perfil">Renove ou inclua adicionais na sua área</a>.');}
 }).catch(()=>say('Não foi possível carregar os preços. Atualize a página.'));
 form.addEventListener('change',total);
 form.addEventListener('submit',async e=>{
  e.preventDefault();say('');
  if(!form.reportValidity())return;
  button.disabled=true;const label=button.textContent;button.textContent='Abrindo o pagamento…';
  try{
   const products=['course',...['planner','fornitore'].filter(p=>form.elements[p].checked)];
   const r=await fetch('/api/checkout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Arrivo-Request':'1'},body:JSON.stringify({name:form.elements.name.value,email:form.elements.email.value,products})});
   const b=await r.json();
   if(r.ok&&b.url){location.href=b.url;return;}
   say(b.code==='account_exists'?'Já existe uma conta com este e-mail. <a href="/app#entrar">Entre na plataforma</a> para renovar ou incluir adicionais.':(b.error||'Não foi possível iniciar o pagamento.').replace(/[<>&]/g,''));
  }catch{say('Não foi possível conectar. Verifique sua internet e tente novamente.');}
  button.disabled=false;button.textContent=label;
 });
})();
