import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {database} from '../server/db.js';
import {createAdmin} from '../server/app.js';
import {importTrack,clearModules} from '../server/catalog.js';

const cidadania=JSON.parse(fs.readFileSync('server/catalog/cidadania.json','utf8'));
const rows=async(db,sql,...a)=>(await db.prepare(sql).bind(...a).all()).results;

test('track catalog: new installs, re-import keeps panel edits, clear removes everything',async t=>{
 const filesDir=fs.mkdtempSync(path.join(os.tmpdir(),'arrivo-cat-'));t.after(()=>fs.rmSync(filesDir,{recursive:true,force:true}));
 const db=database();
 await createAdmin(db,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});

 // Instalação nova: trilha da cidadania conforme o arquivo; as demais em rascunho, sem etapas
 const modules=await rows(db,"SELECT * FROM records WHERE kind='module' AND id LIKE 'cid-%'"),lessons=await rows(db,"SELECT * FROM records WHERE kind='lesson' AND id LIKE 'cid-%'");
 assert.equal(modules.length,13);assert.equal(lessons.length,88);
 assert.equal((await rows(db,"SELECT * FROM records WHERE kind='module' AND id LIKE 'mud-%'")).length,13);assert.equal((await rows(db,"SELECT * FROM records WHERE kind='lesson' AND id LIKE 'mud-%'")).length,108);
 const mudanca=JSON.parse((await rows(db,"SELECT body FROM records WHERE id='mudanca'"))[0].body);assert.equal(mudanca.groups.flatMap(g=>g[1]).length,13);
 assert.match(JSON.parse((await rows(db,"SELECT body FROM records WHERE id='mud-07-05'"))[0].body).title,/^7\.5 — CVI\/e-CVI/);
 assert(lessons.every(l=>l.status==='draft'));assert(modules.every(m=>m.status==='published'));
 const first=JSON.parse(lessons.find(l=>l.id==='cid-01-01').body);
 assert.equal(first.title,'1.1 — Como funciona esta trilha');assert.equal(first.duration,6);assert.equal(first.moduleId,'cid-01');
 assert.match(first.description,/^Percurso comum/);
 const m1=JSON.parse(modules.find(m=>m.id==='cid-01').body);assert.equal(m1.title,'Meu ponto de partida na cidadania');assert.match(m1.description,/^Identifique sua situação/);
 const track=JSON.parse((await rows(db,"SELECT body FROM records WHERE id='cidadania'"))[0].body);
 assert.deepEqual(track.groups.map(g=>g[0]),['Base comum','Documentação','Vias de reconhecimento','Família e casamento','Depois do reconhecimento']);
 assert.deepEqual(track.groups.flatMap(g=>g[1]),cidadania.modules.map(m=>m.id));
 assert.deepEqual((await rows(db,"SELECT id,status FROM records WHERE kind='track' ORDER BY id")).map(r=>[r.id,r.status]),[['cidadania','published'],['empreender','published'],['mudanca','published'],['vida','published']]);
 assert.equal((await rows(db,"SELECT * FROM records WHERE kind='module' AND id LIKE 'emp-%'")).length,15);assert.equal((await rows(db,"SELECT * FROM records WHERE kind='lesson' AND id LIKE 'emp-%'")).length,114);
 const emp=JSON.parse((await rows(db,"SELECT body FROM records WHERE id='empreender'"))[0].body);assert.equal(emp.order,3);assert.deepEqual(emp.groups.map(g=>g[1].length),[8,4,3]);
 assert.equal((await rows(db,"SELECT * FROM records WHERE kind='module' AND id LIKE 'vid-%'")).length,14);assert.equal((await rows(db,"SELECT * FROM records WHERE kind='lesson' AND id LIKE 'vid-%'")).length,113);
 assert.match(JSON.parse((await rows(db,"SELECT body FROM records WHERE id='vid-10-10'"))[0].body).title,/^10\.10 — Previdência/);
 const sum=cidadania.modules.reduce((a,m)=>a+m.lessons.reduce((s,l)=>s+l[2],0),0);assert(sum>1000,'durações importadas');

 // Painel publica a aula com vídeo; aluno tem progresso. Reimportar com título corrigido preserva tudo isso.
 const body={...first,videoUrl:'https://youtu.be/dQw4w9WgXcQ',video:{type:'iframe',url:'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'}};
 await db.prepare("UPDATE records SET body=?,status='published' WHERE id='cid-01-01'").bind(JSON.stringify(body)).run();
 await db.prepare("INSERT INTO learner(user_id,key,value,updated) VALUES('owner','complete:cid-01-01','true',1)").run();
 const edited=structuredClone(cidadania);edited.modules[0].lessons[0][0]='1.1 — Como funciona a trilha';edited.modules[12].lessons.pop();
 // Cenário real: uma aula de outra trilha (Empreender) foi movida no painel para um módulo da Cidadania e publicada com vídeo
 const foreign=(await rows(db,"SELECT * FROM records WHERE id='emp-01-01'"))[0];
 await db.prepare("UPDATE records SET body=?,status='published' WHERE id='emp-01-01'").bind(JSON.stringify({...JSON.parse(foreign.body),moduleId:'cid-02',videoUrl:'https://youtu.be/K2pCuLFMFpY'})).run();
 const r=await importTrack(db,edited,filesDir);assert.equal(r.lessons,87);assert.equal(r.archived,1,'só a aula que saiu do arquivo da Cidadania');
 const moved=(await rows(db,"SELECT * FROM records WHERE id='emp-01-01'"))[0];assert.equal(moved.status,'published');assert.equal(JSON.parse(moved.body).videoUrl,'https://youtu.be/K2pCuLFMFpY');
 const after=(await rows(db,"SELECT * FROM records WHERE id='cid-01-01'"))[0];
 assert.equal(after.status,'published');assert.equal(JSON.parse(after.body).title,'1.1 — Como funciona a trilha');assert.equal(JSON.parse(after.body).videoUrl,'https://youtu.be/dQw4w9WgXcQ');
 assert.equal((await rows(db,"SELECT * FROM learner WHERE key='complete:cid-01-01'")).length,1);
 // A aula retirada do arquivo fica arquivada (recuperável), não apagada; voltando ao arquivo, retorna como rascunho
 assert.equal((await rows(db,"SELECT status FROM records WHERE id='cid-13-07'"))[0].status,'archived');
 await importTrack(db,cidadania,filesDir);assert.equal((await rows(db,"SELECT status FROM records WHERE id='cid-13-07'"))[0].status,'draft');
 await importTrack(db,edited,filesDir);

 // Limpeza total: módulos, aulas, arquivos (banco e disco), dúvidas e progresso daquelas aulas
 fs.writeFileSync(path.join(filesDir,'f1'),'x');
 await db.prepare("INSERT INTO lesson_files(id,lesson_id,name,type,size,position,created) VALUES('f1','cid-01-01','a.pdf','application/pdf',1,0,1)").run();
 await db.prepare("INSERT INTO records(id,kind,body,status,revision,updated) VALUES('q1','question',?,'open',1,1)").bind(JSON.stringify({lessonId:'cid-01-01',text:'?'})).run();
 assert.equal(await clearModules(db,filesDir),13+88+13+108+14+113+15+114,'inclui a aula arquivada');
 assert.equal((await rows(db,"SELECT * FROM records WHERE kind IN ('module','lesson','question')")).length,0);
 assert.equal((await rows(db,'SELECT * FROM lesson_files')).length,0);assert(!fs.existsSync(path.join(filesDir,'f1')));
 assert.equal((await rows(db,"SELECT * FROM learner WHERE key='complete:cid-01-01'")).length,0);
 assert((await rows(db,"SELECT * FROM records WHERE kind='track'")).every(t=>t.status==='draft'&&JSON.parse(t.body).groups.length===0));
 db.raw.close();
});
