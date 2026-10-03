import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {database} from '../server/db.js';
import worker,{createAdmin} from '../server/app.js';
import {importTrack,migrateCategories} from '../server/catalog.js';

const day=n=>new Date(Date.now()-3*3600000+n*86400000).toISOString().slice(0,10);

test('categories: registry, home sequence, ordering, migration and re-import',async()=>{
 const DB=database(),env={DB},origin='https://arrivo.example.test';
 const call=async(p,{method='GET',body,cookie}={})=>{const h=new Headers({'Content-Type':'application/json','x-arrivo-client-ip':'1','Origin':origin,'X-Arrivo-Request':'1'});if(cookie)h.set('Cookie',cookie);const r=await worker.fetch(new Request(origin+'/api'+p,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)}),env);return{status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 await createAdmin(DB,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});
 const admin=(await call('/auth/login',{method:'POST',body:{email:'owner@example.test',password:'CorrectHorse2026!'}})).cookie;
 const records=async()=> (await call('/admin/records',{cookie:admin})).body.records;

 // Instalação nova: categorias criadas a partir dos arquivos das trilhas, na ordem em que aparecem
 let all=await records(),cats=all.filter(r=>r.kind==='category').sort((a,b)=>a.order-b.order);
 const expected=[...new Set(['cidadania','mudanca','vida','empreender'].flatMap(f=>JSON.parse(fs.readFileSync(`server/catalog/${f}.json`,'utf8')).modules.map(m=>m.category)))];
 assert.deepEqual(cats.map(c=>c.title),expected);assert.equal(cats.length,26);
 assert(all.filter(r=>r.kind==='module').every(m=>cats.some(c=>c.id===m.categoryId)));

 // Aluno recebe as categorias publicadas no catálogo
 const invite=await call('/admin/invites',{method:'POST',cookie:admin,body:{email:'ana@example.test',role:'student',access:{courseExpires:day(30)}}});
 await call('/auth/activate',{method:'POST',body:{token:invite.body.token,name:'Ana',password:'AnaPassword2026!'}});
 const ana=(await call('/auth/login',{method:'POST',body:{email:'ana@example.test',password:'AnaPassword2026!'}})).cookie;
 assert.equal((await call('/catalog',{cookie:ana})).body.records.filter(r=>r.kind==='category').length,26);

 // Reordenar: só administrador, todos os ids válidos e sem repetição
 const ids=cats.map(c=>c.id),reversed=[...ids].reverse();
 assert.equal((await call('/admin/categories/order',{method:'PUT',cookie:ana,body:{ids:reversed}})).status,403);
 assert.equal((await call('/admin/categories/order',{method:'PUT',cookie:admin,body:{ids:[ids[0],ids[0]]}})).status,400);
 assert.equal((await call('/admin/categories/order',{method:'PUT',cookie:admin,body:{ids:['nao-existe']}})).status,400);
 assert.equal((await call('/admin/categories/order',{method:'PUT',cookie:admin,body:{ids:reversed}})).status,200);
 cats=(await records()).filter(r=>r.kind==='category').sort((a,b)=>a.order-b.order);assert.deepEqual(cats.map(c=>c.id),reversed);

 // Nova categoria entra no fim; editar não muda a posição; oculta da página inicial quando desmarcada
 const created=await call('/admin/records',{method:'POST',cookie:admin,body:{kind:'category',title:'Destaques',description:'Seleção da equipe',status:'published',order:0,showOnHome:false}});assert.equal(created.status,200);
 let mine=(await records()).find(r=>r.id===created.body.id);assert.equal(mine.order,26);assert.equal(mine.showOnHome,false);
 assert.equal((await call('/admin/records/'+mine.id,{method:'PUT',cookie:admin,body:{kind:'category',title:'Destaques da equipe',status:'published',order:0,showOnHome:true,revision:mine.revision}})).status,200);
 mine=(await records()).find(r=>r.id===created.body.id);assert.equal(mine.order,26);assert.equal(mine.showOnHome,true);assert.equal(mine.title,'Destaques da equipe');

 // Módulo precisa de categoria ativa; categoria arquivada não aceita novos módulos
 const archived=await call('/admin/records',{method:'POST',cookie:admin,body:{kind:'category',title:'Antiga',status:'draft'}});
 const arc=(await records()).find(r=>r.id===archived.body.id);await call('/admin/records/'+arc.id,{method:'PUT',cookie:admin,body:{kind:'category',title:'Antiga',status:'archived',revision:arc.revision}});
 assert.equal((await call('/admin/records',{method:'POST',cookie:admin,body:{kind:'module',title:'X',categoryId:arc.id,status:'published'}})).status,400);

 // Migração: módulo antigo com categoria em texto passa a usar o cadastro (reaproveita pelo nome, sem diferenciar maiúsculas)
 await DB.prepare("INSERT INTO records(id,kind,body,status,revision,updated) VALUES('legado','module',?,'published',1,1)").bind(JSON.stringify({title:'Legado',category:'SAÚDE',order:0})).run();
 await DB.prepare("INSERT INTO records(id,kind,body,status,revision,updated) VALUES('legado2','module',?,'published',1,1)").bind(JSON.stringify({title:'Legado 2',category:'Categoria nova',order:0})).run();
 assert.equal(await migrateCategories(DB),2);assert.equal(await migrateCategories(DB),0);
 all=await records();const saude=all.find(r=>r.kind==='category'&&r.title==='Saúde');
 assert.equal(all.find(r=>r.id==='legado').categoryId,saude.id);assert(all.some(r=>r.kind==='category'&&r.title==='Categoria nova'));

 // Reimportar a trilha não desfaz a categoria escolhida no painel
 const mod=all.find(r=>r.id==='cid-01');
 assert.equal((await call('/admin/records/cid-01',{method:'PUT',cookie:admin,body:{...mod,kind:'module',categoryId:mine.id,revision:mod.revision}})).status,200);
 await importTrack(DB,JSON.parse(fs.readFileSync('server/catalog/cidadania.json','utf8')),'.');
 assert.equal((await records()).find(r=>r.id==='cid-01').categoryId,mine.id);
 // …a não ser que a reorganização peça explicitamente para sincronizar as categorias pelo arquivo
 await importTrack(DB,JSON.parse(fs.readFileSync('server/catalog/cidadania.json','utf8')),'.',{syncCategories:true});
 all=await records();assert.equal(all.find(r=>r.id==='cid-01').categoryId,all.find(r=>r.kind==='category'&&r.title==='Ponto de partida').id);
 // "Ponto de partida" é compartilhada entre Cidadania e Mudança, conforme a composição das trilhas
 assert.equal(all.find(r=>r.id==='mud-01').categoryId,all.find(r=>r.id==='cid-01').categoryId);
 DB.raw.close();
});
