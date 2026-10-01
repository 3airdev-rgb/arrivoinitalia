import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from '../server/db.js';
import worker,{createAdmin} from '../server/app.js';
import {signWebhook} from '../server/stripe.js';

// Stripe simulado: registra as sessões criadas e permite marcar uma como paga.
function fakeStripe(){
 const sessions=new Map(),created=[];let n=0;
 const fetch=async(url,init)=>{const path=new URL(url).pathname;
  if(init.method==='POST'&&path==='/v1/checkout/sessions'){const params=new URLSearchParams(init.body),id='cs_test_'+(++n);sessions.set(id,{id,payment_status:'unpaid',payment_intent:'pi_'+n});created.push(params);return Response.json({id,url:'https://checkout.stripe.test/'+id});}
  if(init.method==='GET'&&path.startsWith('/v1/checkout/sessions/'))return Response.json(sessions.get(decodeURIComponent(path.split('/').pop())));
  return Response.json({error:{message:'unexpected'}},{status:400});};
 return{fetch,sessions,created,pay:id=>{sessions.get(id).payment_status='paid';}};
}

test('sales page checkout, Stripe fulfillment, renewal discount, add-ons and refunds',async()=>{
 const DB=database(),stripe=fakeStripe(),secret='whsec_test',env={DB,fetch:stripe.fetch,STRIPE_SECRET_KEY:'sk_test_x',STRIPE_WEBHOOK_SECRET:secret},origin='https://arrivoinitalia.example';
 const call=async(path,{method='GET',body,cookie,headers={}}={})=>{const h=new Headers({'Content-Type':'application/json','x-arrivo-client-ip':'10.0.0.1','Origin':origin,'X-Arrivo-Request':'1',...headers});if(cookie)h.set('Cookie',cookie);const response=await worker.fetch(new Request(origin+'/api'+path,{method,headers:h,body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)}),env);return{status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};};
 const post=(p,b,c)=>call(p,{method:'POST',body:b,cookie:c});
 const webhook=async event=>{const raw=JSON.stringify(event);return call('/stripe/webhook',{method:'POST',body:raw,headers:{'Stripe-Signature':await signWebhook(secret,raw),'Origin':''}});};
 const statusOf=(order,session)=>call(`/checkout/status?pedido=${order}&session=${session}`);
 const sessionOf=url=>url.split('/').pop();
 const rows=async(sql,...a)=>(await DB.prepare(sql).bind(...a).all()).results;

 await createAdmin(DB,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});
 const admin=(await post('/auth/login',{email:'owner@example.test',password:'CorrectHorse2026!'})).cookie;

 // Oferta pública e validações do checkout.
 const offer=(await call('/offer')).body;assert.equal(offer.offer.prices.course,99700);assert.equal(offer.payments,true);assert.equal(offer.signedIn,false);
 assert.equal((await worker.fetch(new Request(origin+'/api/checkout',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'X-Arrivo-Request':'1'},body:JSON.stringify({name:'Ana',email:'ana@example.test',products:['course']})}),{DB})).status,503);
 assert.equal((await post('/checkout',{name:'Ana',email:'ana@example.test',products:['planner']})).status,400);
 assert.equal((await post('/checkout',{name:'Ana',email:'ana@example.test',products:['course','x']})).status,400);
 const existing=await post('/checkout',{name:'Owner',email:'OWNER@example.test',products:['course']});assert.equal(existing.status,409);assert.equal(existing.body.code,'account_exists');

 // Compra nova (curso + Planner) paga com cartão: confirmada na volta do Stripe, mesmo antes do webhook.
 const buy=await post('/checkout',{name:'Ana Souza',email:'Ana@Example.test',products:['planner','course']});assert.equal(buy.status,200,JSON.stringify(buy.body));
 const params=stripe.created[0];assert.equal(params.get('mode'),'payment');assert.equal(params.get('customer_email'),'ana@example.test');assert.equal(params.get('line_items[0][price_data][currency]'),'brl');
 assert.equal(params.get('line_items[0][price_data][unit_amount]'),'99700');assert.equal(params.get('line_items[1][price_data][unit_amount]'),'19700');assert.match(params.get('success_url'),/\/compra\?pedido=.+&session_id=\{CHECKOUT_SESSION_ID\}$/);
 const s1=sessionOf(buy.body.url);
 assert.equal((await statusOf(buy.body.order,'cs_wrong')).status,404);
 assert.equal((await statusOf(buy.body.order,s1)).body.status,'pending');
 stripe.pay(s1);const paid=(await statusOf(buy.body.order,s1)).body;assert.equal(paid.status,'paid');assert.match(paid.activationUrl,/\/app#ativar\?token=[a-f0-9]{64}$/);
 const ana=(await rows("SELECT * FROM users WHERE email='ana@example.test'"))[0];assert.equal(ana.password,null);assert.equal(ana.role,'student');
 const grants=await rows("SELECT * FROM entitlements WHERE user_id=? AND status='active'",ana.id);assert.deepEqual(grants.map(g=>g.product).sort(),['course','planner']);
 assert.equal(grants[0].expires,grants[1].expires);assert(Math.abs(grants[0].expires-grants[0].starts-365*86400)<5);
 // Webhook repetido não duplica o acesso.
 await webhook({type:'checkout.session.completed',data:{object:{id:s1,metadata:{order_id:buy.body.order},payment_status:'paid',payment_intent:'pi_1'}}});
 assert.equal((await rows("SELECT * FROM entitlements WHERE user_id=?",ana.id)).length,2);

 // Ativação pelo link de boas-vindas (o link antigo deixa de valer quando outro é gerado).
 const second=(await statusOf(buy.body.order,s1)).body.activationUrl;
 assert.equal((await post('/auth/activate',{token:paid.activationUrl.split('token=')[1],name:'Ana',password:'AnaSouza2026!!'})).status,400);
 assert.equal((await post('/auth/activate',{token:second.split('token=')[1],name:'Ana Souza',password:'AnaSouza2026!!'})).status,200);
 assert.equal((await statusOf(buy.body.order,s1)).body.activationUrl,null);
 const login=await post('/auth/login',{email:'ana@example.test',password:'AnaSouza2026!!'});const anaCookie=login.cookie;
 assert.equal(login.body.access.course.active,true);assert.equal(login.body.access.planner.active,true);assert.equal(login.body.access.fornitore.active,false);

 // Adicional dentro da plataforma: Fornitore pago por boleto (confirmação assíncrona via webhook).
 const mine=(await call('/offer',{cookie:anaCookie})).body.offer;assert.deepEqual(mine.available,['fornitore']);assert.deepEqual(mine.activeExtras,['planner']);
 assert.equal((await post('/checkout/account',{products:['planner']},anaCookie)).status,400);
 assert.equal((await post('/checkout/account',{products:['course']},anaCookie)).status,400);
 const addon=await post('/checkout/account',{products:['fornitore']},anaCookie);assert.equal(addon.status,200,JSON.stringify(addon.body));const s2=sessionOf(addon.body.url);
 assert.equal((await webhook({type:'checkout.session.completed',data:{object:{id:s2,metadata:{order_id:addon.body.order},payment_status:'unpaid',payment_intent:'pi_2'}}})).status,200);
 assert.equal((await call('/auth/me',{cookie:anaCookie})).body.access.fornitore.active,false);
 const bad=await call('/stripe/webhook',{method:'POST',body:'{}',headers:{'Stripe-Signature':'t=1,v1=00'}});assert.equal(bad.status,400);
 await webhook({type:'checkout.session.async_payment_succeeded',data:{object:{id:s2,metadata:{order_id:addon.body.order},payment_status:'paid',payment_intent:'pi_2'}}});
 const withAddon=(await call('/auth/me',{cookie:anaCookie})).body.access;assert.equal(withAddon.fornitore.active,true);assert.equal(withAddon.fornitore.expires,withAddon.course.expires);

 // Renovação com desconto nos 60 dias finais: o novo ano começa no fim do atual; os adicionais não renovam sozinhos.
 const soon=Math.floor(Date.now()/1000)+10*86400;DB.raw.prepare("UPDATE entitlements SET expires=? WHERE user_id=? AND status='active'").run(soon,ana.id);
 const renewalOffer=(await call('/offer',{cookie:anaCookie})).body.offer;assert.equal(renewalOffer.kind,'renewal');assert.equal(renewalOffer.discountPercent,20);assert.equal(renewalOffer.total.course,79760);
 const renew=await post('/checkout/account',{products:['course']},anaCookie);assert.equal(renew.status,200);const s3=sessionOf(renew.body.url);
 assert.equal(stripe.created.at(-1).get('line_items[0][price_data][unit_amount]'),'79760');
 await webhook({type:'checkout.session.completed',data:{object:{id:s3,metadata:{order_id:renew.body.order},payment_status:'paid',payment_intent:'pi_3'}}});
 const next=(await rows("SELECT * FROM entitlements WHERE user_id=? AND product='course' AND status='active' ORDER BY expires DESC",ana.id))[0];assert.equal(next.starts,soon);assert.equal(next.expires,soon+365*86400);
 const afterRenew=(await call('/auth/me',{cookie:anaCookie})).body.access;assert.equal(afterRenew.course.expires,soon);assert.equal(afterRenew.planner.expires,soon);

 // Fora do prazo do desconto, a renovação tem preço cheio.
 DB.raw.prepare("UPDATE entitlements SET expires=? WHERE user_id=? AND status='active'").run(Math.floor(Date.now()/1000)-61*86400,ana.id);
 assert.equal((await call('/offer',{cookie:anaCookie})).body.offer.discountPercent,0);

 // Reembolso total revoga o acesso daquele pedido.
 const bob=await post('/checkout',{name:'Bob',email:'bob@example.test',products:['course']});const s4=sessionOf(bob.body.url);
 await webhook({type:'checkout.session.completed',data:{object:{id:s4,metadata:{order_id:bob.body.order},payment_status:'paid',payment_intent:'pi_bob'}}});
 const bobUser=(await rows("SELECT * FROM users WHERE email='bob@example.test'"))[0];
 assert.equal((await rows("SELECT * FROM entitlements WHERE user_id=? AND status='active'",bobUser.id)).length,1);
 await webhook({type:'charge.refunded',data:{object:{payment_intent:'pi_bob',amount:99700,amount_refunded:99700}}});
 assert.equal((await rows("SELECT * FROM entitlements WHERE user_id=? AND status='active'",bobUser.id)).length,0);

 // Administração: preços, desconto, pedidos e link de acesso para quem ainda não criou senha.
 assert.equal((await call('/admin/sales',{cookie:anaCookie})).status,403);
 assert.equal((await call('/admin/sales/settings',{method:'PUT',body:{coursePrice:'0',plannerPrice:'197',fornitorePrice:'297',renewalDiscount:20,renewalWindowDays:60},cookie:admin})).status,400);
 const saved=await call('/admin/sales/settings',{method:'PUT',body:{coursePrice:'1.497,90',plannerPrice:'247',fornitorePrice:'347',renewalDiscount:15,renewalWindowDays:30},cookie:admin});assert.equal(saved.status,200,JSON.stringify(saved.body));assert.equal(saved.body.settings.coursePrice,149790);
 assert.equal((await call('/offer')).body.offer.prices.course,149790);
 const sales=(await call('/admin/sales',{cookie:admin})).body;assert.equal(sales.orders.length,4);assert.deepEqual(sales.stripe,{payments:true,webhook:true});
 const bobOrder=sales.orders.find(o=>o.email==='bob@example.test');assert.equal(bobOrder.status,'refunded');
 const carla=await post('/checkout',{name:'Carla',email:'carla@example.test',products:['course']});stripe.pay(sessionOf(carla.body.url));await statusOf(carla.body.order,sessionOf(carla.body.url));
 const link=await post(`/admin/orders/${carla.body.order}/activation`,{},admin);assert.equal(link.status,200);assert.match(link.body.link,/#ativar\?token=/);
 assert.equal((await post(`/admin/orders/${buy.body.order}/activation`,{},admin)).status,409);
 DB.raw.close();
});
