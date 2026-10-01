// Cliente mínimo da API do Stripe (REST + form-encoding) e verificação de assinatura de webhooks.
// env.STRIPE_SECRET_KEY e env.STRIPE_WEBHOOK_SECRET vêm do ambiente; env.fetch permite simular a API nos testes.

function encode(params,prefix='',out=new URLSearchParams()){
 for(const [key,value]of Object.entries(params)){
  if(value===undefined||value===null)continue;
  const name=prefix?`${prefix}[${key}]`:key;
  if(typeof value==='object')encode(value,name,out);else out.append(name,String(value));
 }
 return out;
}

export async function stripeRequest(env,method,path,params){
 if(!env.STRIPE_SECRET_KEY)throw Object.assign(new Error('Pagamentos ainda não configurados.'),{status:503});
 const doFetch=env.fetch||fetch;
 // STRIPE_API_BASE serve apenas para apontar a um simulador local em testes de ponta a ponta.
 const res=await doFetch((env.STRIPE_API_BASE||'https://api.stripe.com/v1')+path,{method,headers:{'Authorization':'Bearer '+env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded'},body:method==='GET'?undefined:encode(params||{}).toString()});
 const data=await res.json();
 if(!res.ok){console.error('Stripe error',path,data.error?.type,data.error?.message);throw Object.assign(new Error('Não foi possível iniciar o pagamento. Tente novamente em instantes.'),{status:502});}
 return data;
}

const hex=buf=>Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');
function safeEqual(a,b){if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0;}

// Valida o cabeçalho Stripe-Signature (t=...,v1=...) contra o corpo bruto; tolerância de 5 minutos.
export async function verifyWebhook(env,raw,header,tolerance=300){
 if(!env.STRIPE_WEBHOOK_SECRET||!header)return false;
 const pairs=header.split(',').map(p=>p.trim().split('='));
 const t=Number(pairs.find(([k])=>k==='t')?.[1]),signatures=pairs.filter(([k,v])=>k==='v1'&&v).map(([,v])=>v);
 if(!Number.isFinite(t)||!signatures.length||Math.abs(Date.now()/1000-t)>tolerance)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const expected=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${t}.${raw}`)));
 return signatures.some(s=>safeEqual(s,expected));
}

export async function signWebhook(secret,raw,t=Math.floor(Date.now()/1000)){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return `t=${t},v1=${hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${t}.${raw}`)))}`;
}
