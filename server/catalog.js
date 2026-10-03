// Catálogo de trilhas em arquivo (server/catalog/<trilha>.json): importação e limpeza de módulos e aulas.
// Usado na criação do banco (catálogo inicial) e pelo terminal (node server/cli.js import-track / clear-modules).
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const catalogDir=path.join(path.dirname(fileURLToPath(import.meta.url)),'catalog');
const now=()=>Math.floor(Date.now()/1000);
const q=(db,sql,...args)=>db.prepare(sql).bind(...args);

// Remove módulos/aulas e o que depende deles: arquivos das aulas (banco e disco), dúvidas e registros de estudo.
async function removeRecords(db,ids,filesDir){
 if(!ids.length)return;
 const marks=ids.map(()=>'?').join(',');
 const files=(await q(db,`SELECT id FROM lesson_files WHERE lesson_id IN (${marks})`,...ids).all()).results;
 const learner=(await q(db,"SELECT user_id,key FROM learner").all()).results.filter(r=>ids.includes(r.key.split(':')[1]));
 await db.batch([
  q(db,`DELETE FROM lesson_files WHERE lesson_id IN (${marks})`,...ids),
  q(db,`DELETE FROM records WHERE kind='question' AND json_extract(body,'$.lessonId') IN (${marks})`,...ids),
  ...learner.map(r=>q(db,'DELETE FROM learner WHERE user_id=? AND key=?',r.user_id,r.key)),
  q(db,`DELETE FROM records WHERE id IN (${marks}) AND kind IN ('module','lesson')`,...ids)
 ]);
 for(const f of files)await fs.rm(path.join(filesDir,f.id),{force:true});
}
// Categorias (vitrine da página inicial): localiza pelo nome, sem diferenciar maiúsculas, ou cria no fim da sequência.
async function categoryFor(db,name){
 const title=String(name||'Geral').trim().slice(0,160)||'Geral';
 const rows=(await q(db,"SELECT id,body FROM records WHERE kind='category' AND status<>'archived'").all()).results.map(r=>({id:r.id,...JSON.parse(r.body)}));
 const found=rows.find(c=>c.title.toLocaleLowerCase('pt-BR')===title.toLocaleLowerCase('pt-BR'));if(found)return found;
 const order=rows.reduce((m,c)=>Math.max(m,Number(c.order)||0),-1)+1,id=crypto.randomUUID(),cat={title,description:'',order,showOnHome:true};
 await q(db,'INSERT INTO records(id,kind,body,status,revision,updated) VALUES(?,?,?,?,1,?)',id,'category',JSON.stringify(cat),'published',now()).run();
 return{id,...cat};
}
// Módulos sem categoria cadastrada (texto livre de versões anteriores) passam a apontar para uma categoria. Idempotente.
export async function migrateCategories(db){
 const valid=new Set((await q(db,"SELECT id FROM records WHERE kind='category'").all()).results.map(r=>r.id));
 const modules=(await q(db,"SELECT id,body FROM records WHERE kind='module'").all()).results.map(r=>({id:r.id,body:JSON.parse(r.body)})).filter(m=>!valid.has(m.body.categoryId));
 for(const m of modules){const cat=await categoryFor(db,m.body.category);await q(db,'UPDATE records SET body=?,revision=revision+1,updated=? WHERE id=?',JSON.stringify({...m.body,categoryId:cat.id,category:cat.title}),now(),m.id).run();}
 return modules.length;
}
const trackRows=async db=>(await q(db,"SELECT * FROM records WHERE kind='track'").all()).results.map(r=>({...r,body:JSON.parse(r.body)}));
const lessonsOf=async(db,moduleIds)=>moduleIds.length?(await q(db,`SELECT id FROM records WHERE kind='lesson' AND json_extract(body,'$.moduleId') IN (${moduleIds.map(()=>'?').join(',')})`,...moduleIds).all()).results.map(r=>r.id):[];

// Apaga todos os módulos e aulas; as trilhas ficam sem etapas e em rascunho até receberem conteúdo.
export async function clearModules(db,filesDir){
 const ids=(await q(db,"SELECT id FROM records WHERE kind IN ('module','lesson')").all()).results.map(r=>r.id);
 await removeRecords(db,ids,filesDir);
 const t=now();
 await db.batch((await trackRows(db)).map(r=>q(db,"UPDATE records SET body=?,status='draft',revision=revision+1,updated=? WHERE id=?",JSON.stringify({...r.body,groups:[]}),t,r.id)));
 return ids.length;
}

// Substitui os módulos e aulas de uma trilha pelo conteúdo do arquivo. Módulos usados por outra trilha são preservados.
// options.syncCategories: aplica a categoria do arquivo também a módulos que já existem (reorganização planejada).
export async function importTrack(db,catalog,filesDir,options={}){
 const {track,modules}=catalog,t=now();
 if(!track?.id||!Array.isArray(modules))throw new Error('Arquivo de trilha inválido.');
 const tracks=await trackRows(db),current=tracks.find(r=>r.id===track.id);
 const usedElsewhere=new Set(tracks.filter(r=>r.id!==track.id).flatMap(r=>(r.body.groups||[]).flatMap(g=>g[1])));
 const oldModules=(current?.body.groups||[]).flatMap(g=>g[1]).filter(id=>!usedElsewhere.has(id));
 const newModules=modules.map(m=>m.id),newLessons=modules.flatMap(m=>m.lessons.map((_,i)=>`${m.id}-${String(i+1).padStart(2,'0')}`)),keep=new Set([...newModules,...newLessons]);
 // O que saiu do arquivo é ARQUIVADO (nunca apagado): some para os alunos, mas vídeo, materiais e progresso continuam
 // recuperáveis. Itens que pertencem ao arquivo de outra trilha não são tocados aqui (a importação daquela trilha cuida deles).
 const otherIds=new Set();
 for(const file of await catalogFiles()){try{const c=JSON.parse(await fs.readFile(file,'utf8'));if(c.track?.id!==track.id)for(const m of c.modules||[]){otherIds.add(m.id);m.lessons.forEach((_,i)=>otherIds.add(`${m.id}-${String(i+1).padStart(2,'0')}`));}}catch{}}
 const remove=[...new Set([...oldModules,...newModules,...await lessonsOf(db,[...oldModules,...newModules])])].filter(id=>!keep.has(id)&&!otherIds.has(id));
 if(remove.length)await db.batch(remove.map(id=>q(db,"UPDATE records SET status='archived',revision=revision+1,updated=? WHERE id=? AND kind IN ('module','lesson') AND status<>'archived'",t,id)));
 const existing=new Map((await q(db,`SELECT * FROM records WHERE id IN (${[...keep].map(()=>'?').join(',')})`,...keep).all()).results.map(r=>[r.id,{...r,body:JSON.parse(r.body)}]));
 // Item que voltou ao arquivo depois de arquivado retorna como rascunho, com o que tinha antes.
 const upsert=(id,kind,fields,defaults,status)=>{const old=existing.get(id);return old&&old.kind===kind?q(db,"UPDATE records SET body=?,status=CASE WHEN status='archived' THEN 'draft' ELSE status END,revision=revision+1,updated=? WHERE id=?",JSON.stringify({...old.body,...fields}),t,id):q(db,'INSERT INTO records(id,kind,body,status,revision,updated) VALUES(?,?,?,?,1,?)',id,kind,JSON.stringify({...defaults,...fields}),status,t);};
 if([...existing.values()].some(r=>!['module','lesson'].includes(r.kind)))throw new Error('Um identificador do arquivo já é usado por outro tipo de conteúdo.');
 const statements=[],validCategories=new Set((await q(db,"SELECT id FROM records WHERE kind='category' AND status<>'archived'").all()).results.map(r=>r.id));
 for(const [mi,m] of modules.entries()){
  // A categoria escolhida no painel prevalece; o arquivo só define a de módulos novos ou sem categoria válida.
  const old=existing.get(m.id),cat=old&&validCategories.has(old.body.categoryId)&&!options.syncCategories?null:await categoryFor(db,m.category);
  statements.push(upsert(m.id,'module',{title:m.title,description:m.description||'',order:mi,...(cat?{categoryId:cat.id,category:cat.title}:{})},{symbol:m.symbol||'◇',cardStyle:'symbol',cardImage:''},'published'));
  // A duração do arquivo é a estimativa de produção; a duração real informada no painel prevalece.
  m.lessons.forEach(([title,description,duration],li)=>{const id=`${m.id}-${String(li+1).padStart(2,'0')}`,real=existing.get(id)?.body.durationSource==='panel';statements.push(upsert(id,'lesson',{title,description:description||'',order:li,moduleId:m.id,...(real?{}:{duration:Number(duration)||0,durationSeconds:(Number(duration)||0)*60})},{videoUrl:'',video:null,tasks:[],links:[],plannerTasks:[]},'draft'));});
 }
 const body={...(current?.body||{}),id:track.id,title:track.title,name:track.title,tag:track.tag||'SUA JORNADA',description:track.description||'',order:current?.body.order??track.order??0,groups:track.groups};
 statements.push(current?q(db,"UPDATE records SET body=?,status='published',revision=revision+1,updated=? WHERE id=?",JSON.stringify(body),t,track.id):q(db,'INSERT INTO records(id,kind,body,status,revision,updated) VALUES(?,?,?,?,1,?)',track.id,'track',JSON.stringify(body),'published',t));
 await db.batch(statements);
 return{modules:modules.length,lessons:newLessons.length,archived:remove.length,updated:existing.size};
}

// Arquivos de trilha na sequência das trilhas (campo track.order), para que as categorias nasçam nessa mesma ordem.
export async function catalogFiles(){
 let names;try{names=(await fs.readdir(catalogDir)).filter(n=>n.endsWith('.json'));}catch{return [];}
 const seedOrder={cidadania:0,mudanca:1,vida:2},withOrder=[];
 for(const n of names){const file=path.join(catalogDir,n);let order=99;try{const t=JSON.parse(await fs.readFile(file,'utf8')).track;order=t.order??seedOrder[t.id]??99;}catch{}withOrder.push({file,order,n});}
 return withOrder.sort((a,b)=>a.order-b.order||a.n.localeCompare(b.n)).map(x=>x.file);
}
