import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from '../server/db.js';
import worker,{createAdmin} from '../server/app.js';

test('module card shows a symbol or an image served separately from the catalog',async()=>{
 const DB=database(),env={DB},origin='https://arrivo.example.test';
 const call=async(path,{method='GET',body,cookie}={})=>{const headers=new Headers({'Content-Type':'application/json','x-arrivo-client-ip':'127.0.0.1','Origin':origin,'X-Arrivo-Request':'1'});if(cookie)headers.set('Cookie',cookie);return worker.fetch(new Request(origin+'/api'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),env);};
 const json=async(...a)=>{const r=await call(...a);return{status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 await createAdmin(DB,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});
 const admin=(await json('/auth/login',{method:'POST',body:{email:'owner@example.test',password:'CorrectHorse2026!'}})).cookie;
 const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=';
 const categoryId=(await json('/admin/records',{method:'POST',body:{kind:'category',title:'Teste',status:'published'},cookie:admin})).body.id;
 const base={kind:'module',title:'Cartão com foto',categoryId,status:'published',order:0};

 assert.equal((await json('/admin/records',{method:'POST',body:{...base,cardStyle:'image'},cookie:admin})).status,400);
 assert.equal((await json('/admin/records',{method:'POST',body:{...base,cardStyle:'image',cardImage:'data:image/svg+xml;base64,PHN2Zz4='},cookie:admin})).status,400);
 const symbolOnly=await json('/admin/records',{method:'POST',body:{...base,title:'Cartão com símbolo',symbol:'✈'},cookie:admin});assert.equal(symbolOnly.status,200);
 const created=await json('/admin/records',{method:'POST',body:{...base,cardStyle:'image',cardImage:image,symbol:'✦'},cookie:admin});assert.equal(created.status,200,JSON.stringify(created.body));

 const modules=(await json('/catalog',{cookie:admin})).body.records.filter(r=>r.kind==='module');
 const withImage=modules.find(m=>m.id===created.body.id),withSymbol=modules.find(m=>m.id===symbolOnly.body.id);
 assert.equal(withImage.cardStyle,'image');assert.equal(withImage.cardImage,`/api/media/${created.body.id}?v=1`);
 assert.equal(withSymbol.cardStyle,'symbol');assert.equal(withSymbol.symbol,'✈');assert.equal(withSymbol.cardImage,'');

 const media=await call(withImage.cardImage.replace('/api',''),{cookie:admin});assert.equal(media.status,200);assert.equal(media.headers.get('content-type'),'image/png');
 assert.deepEqual([...new Uint8Array(await media.arrayBuffer()).slice(0,4)],[0x89,0x50,0x4e,0x47]);
 assert.equal((await call(`/media/${created.body.id}`)).status,401);
 assert.equal((await call(`/media/${symbolOnly.body.id}`,{cookie:admin})).status,404);

 // Voltar para símbolo mantém a imagem guardada, mas o cartão deixa de usá-la.
 const edit=await json('/admin/records/'+created.body.id,{method:'PUT',body:{...base,cardStyle:'symbol',cardImage:image,symbol:'✦',revision:1},cookie:admin});assert.equal(edit.status,200);
 assert.equal((await json('/catalog',{cookie:admin})).body.records.find(m=>m.id===created.body.id).cardStyle,'symbol');
 DB.raw.close();
});
