import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const assets={};for(const name of await fs.readdir('public')){const ext=path.extname(name);if(types[ext])assets['/'+name]={body:await fs.readFile('public/'+name,'utf8'),type:types[ext]};}
await fs.writeFile('server/assets.generated.js','export default '+JSON.stringify(assets)+';');
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await build({entryPoints:['server/worker.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',plugins:[{name:'worker-webcrypto',setup(b){b.onResolve({filter:/^crypto$/},()=>({path:'webcrypto-only',namespace:'worker'}));b.onLoad({filter:/.*/,namespace:'worker'},()=>({contents:'export default {};',loader:'js'}));}}],minify:false});
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await fs.cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Worker, assets and migrations built.');
