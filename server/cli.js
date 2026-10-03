import path from 'node:path';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';
import {database} from './db.js';
import {createAdmin,resetPassword} from './app.js';
import {importTrack,clearModules} from './catalog.js';
import fs from 'node:fs';

const usage=`Uso:
  node server/cli.js create-admin <email> <nome completo>
  node server/cli.js reset-password <email>
  node server/cli.js import-track <arquivo.json> [--sync-categories]
      (ex.: server/catalog/cidadania.json; --sync-categories aplica a categoria do arquivo
       também aos módulos existentes, substituindo a escolhida no painel)
  node server/cli.js clear-modules --confirm          (apaga TODOS os módulos e aulas)

A senha é pedida no terminal (ou lida de ARRIVO_ADMIN_PASSWORD).
Pare o servidor antes de usar import-track ou clear-modules fora do container.`;

function askPassword(question){return new Promise(resolve=>{const rl=readline.createInterface({input:process.stdin,output:process.stdout,terminal:true});let muted=false;rl._writeToOutput=s=>{if(!muted)rl.output.write(s);};rl.question(question,answer=>{rl.output.write('\n');rl.close();resolve(answer);});muted=true;});}

const [command,mail,...nameParts]=process.argv.slice(2);
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const dbPath=process.env.ARRIVO_DB_PATH||path.join(root,'data','arrivo.sqlite'),filesDir=process.env.ARRIVO_FILES_DIR||path.join(path.dirname(path.resolve(dbPath)),'files');
if(command==='import-track'||command==='clear-modules'){
 if(command==='clear-modules'&&mail!=='--confirm'){console.error('Este comando apaga todos os módulos e aulas. Para confirmar: node server/cli.js clear-modules --confirm');process.exit(1);}
 if(command==='import-track'&&!mail){console.error(usage);process.exit(1);}
 const db=database(dbPath);
 try{
  if(command==='clear-modules')console.log(`${await clearModules(db,filesDir)} módulos e aulas apagados. As trilhas ficaram sem etapas e em rascunho.`);
  else{const r=await importTrack(db,JSON.parse(fs.readFileSync(mail,'utf8')),filesDir,{syncCategories:nameParts.includes('--sync-categories')});console.log(`Trilha importada: ${r.modules} módulos e ${r.lessons} aulas (${r.updated} já existiam e foram atualizados; ${r.archived} arquivados por não constarem mais no arquivo).`);}
 }catch(e){console.error(e.message);process.exitCode=1;}finally{db.raw.close();}
 process.exit();
}
if(!['create-admin','reset-password'].includes(command)||!mail||(command==='create-admin'&&!nameParts.length)){console.error(usage);process.exit(1);}

let password=process.env.ARRIVO_ADMIN_PASSWORD;
if(!password){password=await askPassword('Senha (mínimo 12 caracteres): ');if(password!==await askPassword('Repita a senha: ')){console.error('As senhas não conferem.');process.exit(1);}}

const db=database(dbPath);
try{
 if(command==='create-admin'){const user=await createAdmin(db,{email:mail,name:nameParts.join(' '),password});console.log(`Conta administradora criada: ${user.email}. Catálogo inicial importado.`);}
 else{await resetPassword(db,mail,password);console.log(`Senha redefinida para ${mail.toLowerCase()}. Sessões anteriores encerradas.`);}
}catch(e){console.error(e.message);process.exitCode=1;}
finally{db.raw.close();}
