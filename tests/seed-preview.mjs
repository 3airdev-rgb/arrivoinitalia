import fs from 'node:fs';
import path from 'node:path';
import worker from '../dist/server/index.js';
import {database} from '../scripts/d1-local.mjs';
const dbPath=process.env.ARRIVO_DB_PATH||'arrivo.sqlite';
fs.mkdirSync(path.dirname(dbPath),{recursive:true});const DB=database(dbPath);
const origin='https://arrivo.local.test';
const response=await worker.fetch(new Request(origin+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'X-Arrivo-Request':'1','oai-authenticated-user-email':'owner@arrivo.test'},body:JSON.stringify({name:'Administrador de teste',password:'LocalPreview2026!'})}),{DB,OWNER_EMAIL:'owner@arrivo.test'});
console.log('Local-only setup status:',response.status);DB.raw.close();
