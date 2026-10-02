import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {database} from '../server/db.js';
import worker,{createAdmin} from '../server/app.js';

const day=n=>new Date(Date.now()-3*3600000+n*86400000).toISOString().slice(0,10);

test('sales page edited in the panel: draft, preview, publish, history, maintenance and images',async t=>{
 const FILES_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'arrivo-site-'));t.after(()=>fs.rmSync(FILES_DIR,{recursive:true,force:true}));
 const DB=database(),fetchStripe=async()=>Response.json({id:'cs_x',url:'https://checkout.stripe.test/x'}),env={DB,FILES_DIR,STRIPE_SECRET_KEY:'sk_test',fetch:fetchStripe},origin='https://arrivo.example.test';
 const raw=(p,{method='GET',body,cookie,headers={}}={})=>{const h=new Headers({'x-arrivo-client-ip':'10.0.0.9','Origin':origin,'X-Arrivo-Request':'1',...headers});if(cookie)h.set('Cookie',cookie);return worker.fetch(new Request(origin+p,{method,headers:h,body}),env);};
 const call=async(p,{method='GET',body,cookie}={})=>{const r=await raw('/api'+p,{method,cookie,body:body===undefined?undefined:JSON.stringify(body),headers:{'Content-Type':'application/json'}});return{status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const page=async(p,cookie)=>{const r=await raw(p,{cookie});return{status:r.status,html:await r.text(),headers:r.headers};};
 await createAdmin(DB,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});
 const admin=(await call('/auth/login',{method:'POST',body:{email:'owner@example.test',password:'CorrectHorse2026!'}})).cookie;

 // Sem nada publicado, a página usa o conteúdo padrão
 let home=await page('/');assert.equal(home.status,200);assert.match(home.html,/Sua vida na Itália começa com um <em>plano<\/em> bem feito\./);assert.match(home.html,/id="buy-form"/);
 assert.equal((await page('/termos')).status,200);assert.match((await page('/privacidade')).html,/Versão preliminar/);

 // Painel: leitura e validação
 assert.equal((await call('/admin/sales-page')).status,401);
 const panel=(await call('/admin/sales-page',{cookie:admin})).body;assert.equal(panel.mode,'published');assert.equal(panel.hasDraft,false);assert(panel.schema.fields.some(([k])=>k==='faq'));
 const content=structuredClone(panel.content);
 assert.equal((await call('/admin/sales-page/draft',{method:'PUT',cookie:admin,body:{content:{...content,hero:{...content.hero,title:''}}}})).status,400);
 const tooLong=await call('/admin/sales-page/draft',{method:'PUT',cookie:admin,body:{content:{...content,seo:{...content.seo,title:'x'.repeat(71)}}}});assert.equal(tooLong.status,400);assert.match(tooLong.body.error,/Google e compartilhamento › Título da aba do navegador: até 70 caracteres/);
 assert.equal((await call('/admin/sales-page/draft',{method:'PUT',cookie:admin,body:{content:{...content,hero:{...content.hero,highlight:'inexistente'}}}})).status,400);
 assert.equal((await call('/admin/sales-page/draft',{method:'PUT',cookie:admin,body:{content:{...content,footer:{...content.footer,contactEmail:'errado'}}}})).status,400);
 assert.equal((await call('/admin/sales-page/draft',{method:'PUT',cookie:admin,body:{content:{...content,hero:{...content.hero,image:'00000000-0000-0000-0000-000000000000'}}}})).status,400);
 assert.equal((await call('/admin/sales-page/publish',{method:'POST',cookie:admin,body:{}})).status,400);

 // Imagem enviada pelo painel
 const png=Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000','hex');
 assert.equal((await raw('/api/admin/site-assets',{method:'POST',cookie:admin,body:Buffer.from('<svg/>'),headers:{'Content-Type':'application/octet-stream'}})).status,400);
 const up=await raw('/api/admin/site-assets',{method:'POST',cookie:admin,body:png,headers:{'Content-Type':'application/octet-stream'}});assert.equal(up.status,200);const imageId=(await up.json()).id;
 assert.equal((await page('/media/site/'+imageId)).status,404,'imagem de rascunho não é pública');
 assert.equal((await page('/media/site/'+imageId,admin)).status,200);

 // Rascunho com texto perigoso, imagem e seção oculta
 const draft={...content,hero:{...content.hero,title:'Novo título <script>alert(1)</script> com plano',image:imageId},pains:{...content.pains,enabled:false},faq:{...content.faq,items:[{q:'Pergunta nova?',a:'Primeiro parágrafo.\n\nSegundo parágrafo.'}]}};
 const saved=await call('/admin/sales-page/draft',{method:'PUT',cookie:admin,body:{content:draft}});assert.equal(saved.status,200,JSON.stringify(saved.body));
 assert.doesNotMatch((await page('/')).html,/Novo título/,'visitante continua vendo a versão publicada');
 assert.doesNotMatch((await page('/?preview=rascunho')).html,/Novo título/,'prévia só para administrador');
 const preview=await page('/?preview=rascunho',admin);assert.match(preview.html,/Prévia do rascunho/);assert.match(preview.html,/Novo título &lt;script&gt;alert\(1\)&lt;\/script&gt; com <em>plano<\/em>/);assert.match(preview.html,/noindex/);
 assert.equal((await call('/admin/sales-page',{cookie:admin})).body.changed,true);

 // Publicar
 assert.equal((await call('/admin/sales-page/publish',{method:'POST',cookie:admin,body:{}})).status,200);
 home=await page('/');assert.match(home.html,/Novo título &lt;script&gt;/);assert.doesNotMatch(home.html,/<script>alert/);assert.doesNotMatch(home.html,/class="pains"/);
 assert.match(home.html,/<p>Primeiro parágrafo\.<\/p><p>Segundo parágrafo\.<\/p>/);assert.match(home.html,new RegExp('/media/site/'+imageId));
 const img=await page('/media/site/'+imageId);assert.equal(img.status,200);assert.match(img.headers.get('cache-control'),/public/);
 let state=(await call('/admin/sales-page',{cookie:admin})).body;assert.equal(state.hasDraft,false);assert(state.publishedAt);assert.equal(state.history.length,0);

 // Segunda publicação gera histórico; restaurar volta como rascunho
 await call('/admin/sales-page/draft',{method:'PUT',cookie:admin,body:{content:{...state.content,finalCta:{...state.content.finalCta,title:'Versão dois'}}}});
 await call('/admin/sales-page/publish',{method:'POST',cookie:admin,body:{}});
 state=(await call('/admin/sales-page',{cookie:admin})).body;assert.equal(state.history.length,1);assert.match((await page('/')).html,/Versão dois/);
 assert.equal((await call('/admin/sales-page/restore/'+state.history[0].id,{method:'POST',cookie:admin,body:{}})).status,200);
 state=(await call('/admin/sales-page',{cookie:admin})).body;assert.equal(state.hasDraft,true);assert.notEqual(state.content.finalCta.title,'Versão dois');
 assert.equal((await call('/admin/sales-page/discard',{method:'POST',cookie:admin,body:{}})).status,200);
 assert.equal((await call('/admin/sales-page',{cookie:admin})).body.content.finalCta.title,'Versão dois');

 // Manutenção: visitante vê a página de manutenção (503) e não compra; admin vê a página real; alunos seguem estudando
 const invite=await call('/admin/invites',{method:'POST',cookie:admin,body:{email:'ana@example.test',role:'student',access:{courseExpires:day(30)}}});
 await call('/auth/activate',{method:'POST',body:{token:invite.body.token,name:'Ana',password:'AnaPassword2026!'}});
 const ana=(await call('/auth/login',{method:'POST',body:{email:'ana@example.test',password:'AnaPassword2026!'}})).cookie;
 assert.equal((await call('/admin/sales-page/maintenance',{method:'PUT',cookie:admin,body:{content:{title:'',message:''}}})).status,400);
 assert.equal((await call('/admin/sales-page/maintenance',{method:'PUT',cookie:admin,body:{content:{title:'Voltamos já',message:'Ajustes em andamento.',returnText:'Previsão: amanhã às 10h',contactEmail:'contato@arrivoinitalia.com',whatsapp:'(11) 91234-5678'}}})).status,200);
 assert.equal((await call('/admin/sales-page/mode',{method:'PUT',cookie:ana,body:{mode:'maintenance'}})).status,403);
 assert.equal((await call('/admin/sales-page/mode',{method:'PUT',cookie:admin,body:{mode:'maintenance'}})).status,200);
 const closed=await page('/');assert.equal(closed.status,503);assert.equal(closed.headers.get('retry-after'),'3600');assert.match(closed.html,/Voltamos já/);assert.match(closed.html,/Previsão: amanhã às 10h/);assert.match(closed.html,/wa\.me\/5511912345678/);assert.match(closed.html,/Já sou aluno/);
 const adminView=await page('/',admin);assert.equal(adminView.status,200);assert.match(adminView.html,/Modo manutenção ativo/);
 assert.equal((await page('/termos')).status,200);
 const offer=(await call('/offer')).body;assert.equal(offer.paused,true);
 const blocked=await call('/checkout',{method:'POST',body:{name:'Bia',email:'bia@example.test',products:['course']}});assert.equal(blocked.status,503);assert.equal(blocked.body.code,'sales_paused');
 assert.equal((await call('/checkout/account',{method:'POST',cookie:ana,body:{products:['course']}})).body.code,'sales_paused');
 assert.equal((await call('/catalog',{cookie:ana})).status,200,'alunos continuam estudando');
 assert.match((await page('/?preview=manutencao',admin)).html,/Prévia da página de manutenção/);

 // Fim da manutenção
 await call('/admin/sales-page/mode',{method:'PUT',cookie:admin,body:{mode:'published'}});
 assert.equal((await page('/')).status,200);assert.equal((await call('/offer')).body.paused,false);
 assert.equal((await call('/checkout',{method:'POST',body:{name:'Bia',email:'bia@example.test',products:['course']}})).status,200);
 assert((await call('/admin/audit',{cookie:admin})).body.entries.some(e=>e.action==='site:mode:maintenance'));
 DB.raw.close();
});
