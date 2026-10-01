import path from 'node:path';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';
import {database} from './db.js';
import {createAdmin,resetPassword} from './app.js';

const usage=`Uso:
  node server/cli.js create-admin <email> <nome completo>
  node server/cli.js reset-password <email>

A senha é pedida no terminal (ou lida de ARRIVO_ADMIN_PASSWORD).`;

function askPassword(question){return new Promise(resolve=>{const rl=readline.createInterface({input:process.stdin,output:process.stdout,terminal:true});let muted=false;rl._writeToOutput=s=>{if(!muted)rl.output.write(s);};rl.question(question,answer=>{rl.output.write('\n');rl.close();resolve(answer);});muted=true;});}

const [command,mail,...nameParts]=process.argv.slice(2);
if(!['create-admin','reset-password'].includes(command)||!mail||(command==='create-admin'&&!nameParts.length)){console.error(usage);process.exit(1);}

let password=process.env.ARRIVO_ADMIN_PASSWORD;
if(!password){password=await askPassword('Senha (mínimo 12 caracteres): ');if(password!==await askPassword('Repita a senha: ')){console.error('As senhas não conferem.');process.exit(1);}}

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const db=database(process.env.ARRIVO_DB_PATH||path.join(root,'data','arrivo.sqlite'));
try{
 if(command==='create-admin'){const user=await createAdmin(db,{email:mail,name:nameParts.join(' '),password});console.log(`Conta administradora criada: ${user.email}. Catálogo inicial importado.`);}
 else{await resetPassword(db,mail,password);console.log(`Senha redefinida para ${mail.toLowerCase()}. Sessões anteriores encerradas.`);}
}catch(e){console.error(e.message);process.exitCode=1;}
finally{db.raw.close();}
