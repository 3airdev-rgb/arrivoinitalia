import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const migrations=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','drizzle');

// SQLite com a mesma interface de consultas usada pelo app (prepare/bind/first/all/run/batch).
export function database(file=':memory:'){
 if(file!==':memory:')fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
 const raw=new DatabaseSync(file);
 raw.exec('PRAGMA foreign_keys=ON');raw.exec('PRAGMA busy_timeout=5000');
 if(file!==':memory:')raw.exec('PRAGMA journal_mode=WAL');
 raw.exec('CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)');
 for(const name of fs.readdirSync(migrations).filter(n=>n.endsWith('.sql')).sort())if(!raw.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)){
  raw.exec('BEGIN');
  try{raw.exec(fs.readFileSync(path.join(migrations,name),'utf8'));raw.prepare('INSERT INTO local_migrations VALUES(?)').run(name);raw.exec('COMMIT');}
  catch(e){raw.exec('ROLLBACK');throw new Error(`Falha ao aplicar a migração ${name}: ${e.message}`);}
 }
 const prepare=(sql,args=[])=>({bind(...values){return prepare(sql,values);},async first(){return raw.prepare(sql).get(...args)||null;},async all(){return{results:raw.prepare(sql).all(...args)};},async run(){const r=raw.prepare(sql).run(...args);return{meta:{changes:Number(r.changes)},success:true};}});
 return{prepare,async batch(statements){raw.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());raw.exec('COMMIT');return result;}catch(e){raw.exec('ROLLBACK');throw e;}},raw};
}
