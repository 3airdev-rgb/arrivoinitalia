import http from 'node:http';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import {database} from './d1-local.mjs';
fs.mkdirSync('.local',{recursive:true});const DB=database('.local/partiu.sqlite');
const env={DB,OWNER_EMAIL:'owner@partiu.test'};
http.createServer(async(req,res)=>{try{const headers=new Headers();for(const [name,value]of Object.entries(req.headers)){if(name.startsWith('oai-')||name==='cf-connecting-ip')continue;if(value)headers.set(name,Array.isArray(value)?value.join(','):value);}
 // Local-only identity for initial setup; this is not part of the deployed Worker.
 headers.set('oai-authenticated-user-email','owner@partiu.test');headers.set('cf-connecting-ip','127.0.0.1');
 const chunks=[];for await(const chunk of req)chunks.push(chunk);const request=new Request('http://127.0.0.1:4173'+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
 const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end('Local preview error');}}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173 — local isolated database'));
