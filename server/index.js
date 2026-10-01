import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import app from './app.js';
import {database} from './db.js';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicDir=path.join(root,'public');
const production=process.env.NODE_ENV==='production';
const port=Number(process.env.PORT)||4173;
const host=process.env.HOST||'127.0.0.1';
const trustProxy=process.env.TRUST_PROXY==='1';
const publicUrl=process.env.PUBLIC_URL?new URL(process.env.PUBLIC_URL).origin:null;
const maxBody=4*1024*1024;

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
function loadAssets(){const assets={};for(const name of fs.readdirSync(publicDir)){const type=types[path.extname(name).toLowerCase()];if(type)assets['/'+name]={body:fs.readFileSync(path.join(publicDir,name)),type};}return assets;}
// Em produção os arquivos ficam em memória; em desenvolvimento são relidos a cada requisição.
const cached=production?loadAssets():null;
const asset=p=>(cached||loadAssets())[p];

const DB=database(process.env.ARRIVO_DB_PATH||path.join(root,'data','arrivo.sqlite'));
const env={DB,asset};

function clientIp(req){const forwarded=trustProxy?String(req.headers['x-forwarded-for']||'').split(',').map(s=>s.trim()).filter(Boolean):[];return forwarded.at(-1)||req.socket.remoteAddress||'unknown';}

const server=http.createServer(async(req,res)=>{
 try{
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>maxBody){res.writeHead(413,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Conteúdo muito grande.'}));req.destroy();return;}chunks.push(chunk);}
  const headers=new Headers();
  for(const [name,value]of Object.entries(req.headers))if(value&&name!=='x-arrivo-client-ip')headers.set(name,Array.isArray(value)?value.join(','):value);
  headers.set('x-arrivo-client-ip',clientIp(req));
  const origin=publicUrl||`http://${req.headers.host||host+':'+port}`;
  const request=new Request(origin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
  const response=await app.fetch(request,env);
  const out={};response.headers.forEach((value,name)=>{if(name!=='set-cookie')out[name]=value;});
  const cookies=response.headers.getSetCookie();if(cookies.length)out['set-cookie']=cookies;
  res.writeHead(response.status,out);res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error('Request failed',req.url,e);if(!res.headersSent)res.writeHead(500);res.end();}
});
server.listen(port,host,()=>console.log(`Arrivo In Itália em http://${host}:${port}${publicUrl?' (público: '+publicUrl+')':''}`));

function shutdown(){server.close(()=>{DB.raw.close();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
