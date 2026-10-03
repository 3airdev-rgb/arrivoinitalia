import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {database} from '../server/db.js';
import worker,{createAdmin} from '../server/app.js';

const day=n=>new Date(Date.now()-3*3600000+n*86400000).toISOString().slice(0,10);

test('lesson files, links and planner tasks, and planner templates accept their own tasks',async t=>{
 const FILES_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'arrivo-files-'));t.after(()=>fs.rmSync(FILES_DIR,{recursive:true,force:true}));
 const DB=database(),env={DB,FILES_DIR},origin='https://arrivo.example.test';
 const raw=async(p,{method='GET',body,cookie,headers={}}={})=>{const h=new Headers({'x-arrivo-client-ip':'127.0.0.1','Origin':origin,'X-Arrivo-Request':'1',...headers});if(cookie)h.set('Cookie',cookie);return worker.fetch(new Request(origin+'/api'+p,{method,headers:h,body}),env);};
 const call=async(p,{method='GET',body,cookie}={})=>{const r=await raw(p,{method,cookie,body:body===undefined?undefined:JSON.stringify(body),headers:{'Content-Type':'application/json'}});return{status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const upload=(lesson,name,bytes,cookie,type='application/octet-stream')=>raw(`/admin/lessons/${lesson}/files`,{method:'POST',cookie,body:bytes,headers:{'Content-Type':type,'X-File-Name':encodeURIComponent(name)}});
 await createAdmin(DB,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});
 const admin=(await call('/auth/login',{method:'POST',body:{email:'owner@example.test',password:'CorrectHorse2026!'}})).cookie;

 const categoryId=(await call('/admin/records',{method:'POST',cookie:admin,body:{kind:'category',title:'Documentos',status:'published'}})).body.id;
 const mod=(await call('/admin/records',{method:'POST',cookie:admin,body:{kind:'module',title:'Documentos',categoryId,status:'published'}})).body.id;
 const track=(await call('/admin/records',{method:'POST',cookie:admin,body:{kind:'track',title:'Trilha teste',status:'published',groups:[['Etapa 1',[mod]]]}})).body.id;
 const lessonBody={kind:'lesson',title:'Certidões',moduleId:mod,status:'published',videoUrl:'https://youtu.be/dQw4w9WgXcQ',order:0};

 // Links e tarefas: validação
 assert.equal((await call('/admin/records',{method:'POST',cookie:admin,body:{...lessonBody,links:[{title:'X',url:'javascript:alert(1)'}]}})).status,400);
 assert.equal((await call('/admin/records',{method:'POST',cookie:admin,body:{...lessonBody,plannerTasks:[{trackId:track,itemId:'nao-existe'}]}})).status,400);
 const created=await call('/admin/records',{method:'POST',cookie:admin,body:{...lessonBody,links:[{title:'Consulado',url:'https://www.conssanpaolo.esteri.it/'},{title:'Comune (http)',url:'http://www.comune.example.it/anagrafe'},{title:'',url:''}],plannerTasks:[{trackId:track,itemId:mod},{trackId:track,itemId:mod}]}});
 assert.equal(created.status,200,JSON.stringify(created.body));const lesson=created.body.id;
 const saved=(await call('/admin/records',{cookie:admin})).body.records.find(r=>r.id===lesson);
 assert.equal(saved.links.length,2);assert.deepEqual(saved.plannerTasks,[{trackId:track,itemId:mod}]);

 // Arquivos: envio, validação de tipo e conteúdo, limites de acesso
 const pdf=Buffer.from('%PDF-1.4\n%fake\n'),docx=Buffer.concat([Buffer.from([0x50,0x4b,0x03,0x04]),Buffer.alloc(40)]);
 assert.equal((await upload(lesson,'Guia.pdf',pdf,admin,'application/json')).status,415);
 assert.equal((await upload(lesson,'programa.exe',Buffer.from('MZ'),admin)).status,400);
 assert.equal((await upload(lesson,'falso.pdf',Buffer.from('<script>'),admin)).status,400);
 assert.equal((await upload('nao-existe','Guia.pdf',pdf,admin)).status,404);
 const up1=await upload(lesson,'Guia de certidões.pdf',pdf,admin);assert.equal(up1.status,200);const pdfFile=(await up1.json()).file;
 const up2=await upload(lesson,'Modelo de procuração.docx',docx,admin);assert.equal(up2.status,200);const docFile=(await up2.json()).file;
 assert.equal(pdfFile.type,'application/pdf');assert(fs.existsSync(path.join(FILES_DIR,pdfFile.id)));
 assert.equal((await call(`/admin/lessons/${lesson}/files`,{cookie:admin})).body.files.length,2);

 // Aluno só com o curso: vê arquivos e links, mas não as tarefas do planner
 const invite=await call('/admin/invites',{method:'POST',cookie:admin,body:{email:'ana@example.test',role:'student',access:{courseExpires:day(365)}}});
 await call('/auth/activate',{method:'POST',body:{token:invite.body.token,name:'Ana',password:'AnaPassword2026!'}});
 const ana=(await call('/auth/login',{method:'POST',body:{email:'ana@example.test',password:'AnaPassword2026!'}})).cookie;
 assert.equal((await upload(lesson,'x.pdf',pdf,ana)).status,403);
 let seen=(await call('/catalog',{cookie:ana})).body.records.find(r=>r.id===lesson);
 assert.equal(seen.files.length,2);assert.equal(seen.links.length,2);assert.deepEqual(seen.plannerTasks,[]);
 const inline=await raw('/files/'+pdfFile.id,{cookie:ana});assert.equal(inline.status,200);assert.equal(inline.headers.get('content-type'),'application/pdf');
 assert.match(inline.headers.get('content-disposition'),/^inline; .*filename\*=UTF-8''Guia%20de%20certid%C3%B5es\.pdf/);assert.equal(inline.headers.get('content-security-policy'),null);
 assert.equal(Buffer.from(await inline.arrayBuffer()).toString(),pdf.toString());
 const doc=await raw('/files/'+docFile.id,{cookie:ana});assert.match(doc.headers.get('content-disposition'),/^attachment/);assert.match(doc.headers.get('content-security-policy'),/sandbox/);
 assert.equal((await raw('/files/'+pdfFile.id)).status,401);

 // Com o Planner: tarefas aparecem
 const anaId=(await call('/auth/me',{cookie:ana})).body.user.id;
 await call('/admin/access/'+anaId,{method:'PUT',cookie:admin,body:{courseExpires:day(365),planner:true}});
 seen=(await call('/catalog',{cookie:ana})).body.records.find(r=>r.id===lesson);assert.deepEqual(seen.plannerTasks,[{trackId:track,itemId:mod}]);

 // Aula em rascunho: arquivo deixa de ser entregue ao aluno, mas o administrador ainda vê
 await call('/admin/records/'+lesson,{method:'PUT',cookie:admin,body:{...lessonBody,status:'draft',revision:1,links:saved.links,plannerTasks:saved.plannerTasks}});
 assert.equal((await raw('/files/'+pdfFile.id,{cookie:ana})).status,404);
 assert.equal((await raw('/files/'+pdfFile.id,{cookie:admin})).status,200);

 // Remoção apaga o registro e o arquivo em disco
 assert.equal((await call('/admin/lesson-files/'+pdfFile.id,{method:'DELETE',cookie:admin,body:{}})).status,200);
 assert(!fs.existsSync(path.join(FILES_DIR,pdfFile.id)));assert.equal((await call(`/admin/lessons/${lesson}/files`,{cookie:admin})).body.files.length,1);

 // Correção: com modelo publicado no planner, o aluno salva as tarefas do modelo (antes dava "Etapa indisponível")
 const tpl=await call('/admin/records',{method:'POST',cookie:admin,body:{kind:'planner',trackId:track,title:'Modelo',status:'published',items:[{id:'pedir-certidao',title:'Pedir certidão',phase:'Documentos',estimatedCost:'',dueDays:''}]}});assert.equal(tpl.status,200);
 assert.equal((await call('/learner',{method:'PUT',cookie:ana,body:{key:'planner:'+track,value:{items:[{id:'pedir-certidao',status:'done'}]}}})).status,200);
 assert.equal((await call('/learner',{method:'PUT',cookie:ana,body:{key:'planner:'+track,value:{items:[{id:mod,status:'done'}]}}})).status,400);
 DB.raw.close();
});
