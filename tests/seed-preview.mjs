import fs from 'node:fs';
import worker from '../dist/server/index.js';
import {database} from '../scripts/d1-local.mjs';
fs.mkdirSync('.local',{recursive:true});const DB=database('.local/partiu.sqlite');
const origin='https://partiu.local.test';
const response=await worker.fetch(new Request(origin+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'X-Partiu-Request':'1','oai-authenticated-user-email':'owner@partiu.test'},body:JSON.stringify({name:'Administrador de teste',password:'LocalPreview2026!'})}),{DB,OWNER_EMAIL:'owner@partiu.test'});
console.log('Local-only setup status:',response.status);DB.raw.close();
