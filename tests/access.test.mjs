import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from '../server/db.js';
import worker,{createAdmin} from '../server/app.js';

// Datas no horário de Brasília, como o administrador as informa.
const day=offset=>new Date(Date.now()-3*3600000+offset*86400000).toISOString().slice(0,10);

test('course and add-on access is enforced on the server and managed by admins',async()=>{
 const DB=database(),env={DB},origin='https://arrivo.example.test';
 const call=async(path,{method='GET',body,cookie}={})=>{const headers=new Headers({'Content-Type':'application/json','x-arrivo-client-ip':'127.0.0.1','Origin':origin,'X-Arrivo-Request':'1'});if(cookie)headers.set('Cookie',cookie);const response=await worker.fetch(new Request(origin+'/api'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),env);return{status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};};
 const post=(path,body,cookie)=>call(path,{method:'POST',body,cookie}),put=(path,body,cookie)=>call(path,{method:'PUT',body,cookie});
 await createAdmin(DB,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});
 const admin=(await post('/auth/login',{email:'owner@example.test',password:'CorrectHorse2026!'})).cookie;
 const provider=await post('/admin/records',{kind:'provider',title:'Avvocato Rossi',specialty:'Cidadania',email:'rossi@example.it',phone:'+39 000',price:100,duration:60,status:'published'},admin);assert.equal(provider.status,200,JSON.stringify(provider.body));

 // Convite sem acesso: o aluno entra, mas só vê perfil; a API da área do aluno recusa.
 const invite=await post('/admin/invites',{email:'ana@example.test',role:'student'},admin);
 assert.equal((await post('/auth/activate',{token:invite.body.token,name:'Ana',password:'AnaPassword2026!'})).status,200);
 const login=await post('/auth/login',{email:'ana@example.test',password:'AnaPassword2026!'});assert.equal(login.status,200);
 assert.equal(login.body.access.course.active,false);const ana=login.cookie;
 const blocked=await call('/catalog',{cookie:ana});assert.equal(blocked.status,403);assert.equal(blocked.body.code,'access_course');
 assert.equal((await call('/learner',{cookie:ana})).status,403);
 assert.equal((await put('/profile',{name:'Ana Maria'},ana)).status,200);
 const anaId=(await call('/auth/me',{cookie:ana})).body.user.id;

 // Validações do administrador.
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:day(-1)},admin)).status,400);
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:'31/12/2027'},admin)).status,400);
 assert.equal((await put('/admin/access/owner',{courseExpires:day(30)},admin)).status,400);
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:day(30)},ana)).status,403);

 // Somente o curso: catálogo liberado, extras bloqueados e sem prestadores no catálogo.
 const granted=await put('/admin/access/'+anaId,{courseExpires:day(365)},admin);assert.equal(granted.status,200);assert.deepEqual(granted.body.changes,['course:'+day(365)]);
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:day(365)},admin)).body.changes.length,0);
 const catalog=await call('/catalog',{cookie:ana});assert.equal(catalog.status,200);assert(!catalog.body.records.some(r=>r.kind==='provider'));
 const planner=await call('/planner/attachments?track=x',{cookie:ana});assert.equal(planner.status,403);assert.equal(planner.body.code,'access_planner');
 assert.equal((await put('/learner',{key:'planner:x',value:{items:[]}},ana)).body.code,'access_planner');
 assert.equal((await call('/bookings',{cookie:ana})).body.code,'access_fornitore');

 // Com o Fornitore: prestadores aparecem, mas sem e-mail e telefone.
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:day(365),fornitore:true},admin)).status,200);
 const me=(await call('/auth/me',{cookie:ana})).body.access;assert.equal(me.fornitore.active,true);assert.equal(me.fornitore.expires,me.course.expires);assert.equal(me.planner.active,false);
 const listed=(await call('/catalog',{cookie:ana})).body.records.find(r=>r.kind==='provider');assert.equal(listed.title,'Avvocato Rossi');assert.equal(listed.email,undefined);assert.equal(listed.phone,undefined);
 assert.equal((await call('/bookings',{cookie:ana})).status,200);
 assert.equal((await call('/admin/records',{cookie:admin})).body.records.find(r=>r.kind==='provider').email,'rossi@example.it');

 // Alterar a validade do curso leva os extras junto; a lista e o histórico ficam disponíveis ao administrador.
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:day(90),fornitore:true,planner:true},admin)).body.changes.length,3);
 const users=(await call('/admin/users',{cookie:admin})).body.users;const row=users.find(x=>x.id===anaId);
 assert.equal(row.access.planner.expires,row.access.course.expires);assert.equal(users.find(x=>x.id==='owner').access.course.active,true);
 const history=(await call('/admin/entitlements?user='+anaId,{cookie:admin})).body.entitlements;
 assert.equal(history.filter(e=>e.status==='active').length,3);assert(history.some(e=>e.status==='revoked'));assert.equal(history[0].actorName,'Owner');
 assert((await call('/admin/audit',{cookie:admin})).body.entries.some(e=>e.action.startsWith('access:')));

 // Vencimento: com o curso vencido, os extras também deixam de valer.
 DB.raw.prepare("UPDATE entitlements SET expires=? WHERE user_id=? AND status='active'").run(Math.floor(Date.now()/1000)-60,anaId);
 const expired=(await call('/auth/me',{cookie:ana})).body.access;assert.equal(expired.course.active,false);assert(expired.course.expired);assert.equal(expired.planner.active,false);
 assert.equal((await call('/catalog',{cookie:ana})).status,403);

 // Remover o acesso.
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:day(10),planner:true},admin)).status,200);
 assert.equal((await put('/admin/access/'+anaId,{courseExpires:''},admin)).status,200);
 assert.equal((await call('/catalog',{cookie:ana})).status,403);

 // Convite com acesso: liberado automaticamente na ativação.
 const invited=await post('/admin/invites',{email:'bia@example.test',role:'student',access:{courseExpires:day(365),planner:true}},admin);assert.equal(invited.status,200);
 assert.equal((await post('/admin/invites',{email:'cris@example.test',role:'student',access:{courseExpires:day(1)}},admin)).status,400);
 await post('/auth/activate',{token:invited.body.token,name:'Bia',password:'BiaPassword2026!'});
 const bia=await post('/auth/login',{email:'bia@example.test',password:'BiaPassword2026!'});
 assert.equal(bia.body.access.course.active,true);assert.equal(bia.body.access.planner.active,true);assert.equal(bia.body.access.fornitore.active,false);
 DB.raw.close();
});
