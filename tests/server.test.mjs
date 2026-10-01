import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {database} from '../server/db.js';
import {createAdmin} from '../server/app.js';

test('node server serves assets, health and API with origin checks',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'arrivo-')),dbPath=path.join(dir,'test.sqlite'),port=4199,base=`http://127.0.0.1:${port}`;
 const db=database(dbPath);await createAdmin(db,{email:'owner@example.test',name:'Owner',password:'CorrectHorse2026!'});db.raw.close();
 const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:String(port),HOST:'127.0.0.1',ARRIVO_DB_PATH:dbPath,NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
 t.after(()=>{child.kill();try{fs.rmSync(dir,{recursive:true,force:true});}catch{}});
 await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(String(d).includes('http://'))resolve();});child.on('exit',code=>reject(new Error('server exited '+code)));});

 const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(page.headers.get('content-type'),/text\/html/);
 assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.match(await page.text(),/Arrivo In Itália/);
 assert.equal((await fetch(base+'/app.js')).status,200);
 assert.match(await (await fetch(base+'/app')).text(),/<script src="app.js"/);
 for(const page of ['/termos','/privacidade','/compra'])assert.equal((await fetch(base+page)).status,200,page);
 assert.equal((await fetch(base+'/nao-existe')).status,404);
 assert.equal((await fetch(base+'/favicon.jpg')).headers.get('content-type'),'image/jpeg');
 assert.equal((await fetch(base+'/../package.json')).status,404);
 assert.equal((await fetch(base+'/api/health')).status,200);

 const login=body=>fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Origin':base,'X-Arrivo-Request':'1'},body:JSON.stringify(body)});
 const ok=await login({email:'owner@example.test',password:'CorrectHorse2026!'});assert.equal(ok.status,200);
 assert.match(ok.headers.get('set-cookie'),/^__Host-arrivo=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Strict/);
 const cookie=ok.headers.get('set-cookie').split(';')[0];
 assert.equal((await fetch(base+'/api/auth/me',{headers:{Cookie:cookie}})).status,200);
 const foreign=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://evil.example','X-Arrivo-Request':'1'},body:'{}'});assert.equal(foreign.status,403);
 const big=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Origin':base,'X-Arrivo-Request':'1'},body:'x'.repeat(5*1024*1024)}).catch(()=>({status:413}));assert.equal(big.status,413);
});
