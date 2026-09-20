import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function database(file=':memory:'){
 const raw=new DatabaseSync(file);raw.exec('PRAGMA foreign_keys=ON');
 raw.exec('CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)');
 for(const name of fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())if(!raw.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)){raw.exec(fs.readFileSync('drizzle/'+name,'utf8'));raw.prepare('INSERT INTO local_migrations VALUES(?)').run(name);}
 const prepare=(sql,args=[])=>({bind(...values){return prepare(sql,values);},async first(){return raw.prepare(sql).get(...args)||null;},async all(){return{results:raw.prepare(sql).all(...args)};},async run(){const r=raw.prepare(sql).run(...args);return{meta:{changes:Number(r.changes)},success:true};}});
 return{prepare,async batch(statements){raw.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());raw.exec('COMMIT');return result;}catch(e){raw.exec('ROLLBACK');throw e;}},raw};
}
