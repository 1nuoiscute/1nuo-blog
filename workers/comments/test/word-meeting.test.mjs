import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createWorker} from '../src/index.mjs';
import {normalizeWord} from '../src/word-meeting.mjs';
const origin='https://www.1nuo.me',a='a'.repeat(64),b='b'.repeat(64),c='c'.repeat(64);
function fixture(){
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
  const dir=new URL('../migrations/',import.meta.url);for(const f of readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL(f,dir),'utf8'));
  const DB={prepare(query){const s=sql.prepare(query);let args=[];return{bind(...values){args=values;return this;},async first(){return s.get(...args)||null;},async all(){return{results:s.all(...args)};},async run(){return{meta:{changes:Number(s.run(...args).changes)}};},step(){return{meta:{changes:Number(s.run(...args).changes)}};}};},async batch(statements){sql.exec('BEGIN');try{const result=statements.map(s=>s.step());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
  const worker=createWorker(),env={DB,ALLOWED_ORIGINS:origin};
  async function request(path='',method='GET',body,token,from=origin){const response=await worker.fetch(new Request('https://api.test/v1/word-meeting/rooms'+path,{method,headers:{Origin:from,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);return{status:response.status,data:await response.json()};}
  return{sql,request,async room(){const created=await request('','POST',{name:'甲',token:a});assert.equal(created.status,200);const code=created.data.code;assert.equal((await request('/'+code+'/join','POST',{name:'乙',token:b})).status,200);return code;}};
}
test('anonymous rooms use private membership secrets; wrong origins and third players cannot read or join',async()=>{
 const f=fixture(),code=await f.room();assert.equal(code.length,8);
 assert.equal((await f.request('/'+code)).status,401);assert.equal((await f.request('/'+code,'GET',undefined,c)).status,403);
 assert.equal((await f.request('/'+code,'GET',undefined,a,'https://evil.test')).status,403);
 assert.equal((await f.request('/'+code+'/join','POST',{name:'第三人',token:c})).status,409);
 const s=await f.request('/'+code,'GET',undefined,a);assert.equal(s.data.you,'a');assert.equal(s.data.phase,'thinking');assert(!JSON.stringify(s.data).includes(a));assert(!JSON.stringify(s.data).includes('token'));
 const stored=f.sql.prepare('SELECT a_token,b_token FROM word_meeting_rooms').get();assert.notEqual(stored.a_token,a);assert.notEqual(stored.b_token,b);
});
test('first submission remains secret on both devices and retry cannot change a locked word',async()=>{
 const f=fixture(),code=await f.room();
 const one=await f.request('/'+code+'/submit','POST',{round:1,word:'海浪'},a);assert.equal(one.status,200);assert.equal(one.data.words,null);assert.deepEqual(one.data.history,[]);assert(!JSON.stringify(one.data).includes('海浪'));
 const other=await f.request('/'+code,'GET',undefined,b);assert.equal(other.data.words,null);assert(other.data.submitted.a);assert(!JSON.stringify(other.data).includes('海浪'));
 assert.equal((await f.request('/'+code+'/submit','POST',{round:1,word:'海浪'},a)).status,200);
 assert.equal((await f.request('/'+code+'/submit','POST',{round:1,word:'大海'},a)).status,409);
 const two=await f.request('/'+code+'/submit','POST',{round:1,word:'夏天'},b);assert.equal(two.status,200);assert.equal(two.data.phase,'revealed');assert.deepEqual(two.data.words,{a:'海浪',b:'夏天'});assert.equal(two.data.history.length,1);
});
test('both players must prepare; parallel requests advance exactly once and stale rounds cannot overwrite',async()=>{
 const f=fixture(),code=await f.room();
 await Promise.all([f.request('/'+code+'/submit','POST',{round:1,word:'海浪'},a),f.request('/'+code+'/submit','POST',{round:1,word:'夏天'},b)]);
 const next=await f.request('/'+code+'/next','POST',{round:1},a);assert.equal(next.data.round,1);assert(next.data.ready.a);
 await Promise.all([f.request('/'+code+'/next','POST',{round:1},a),f.request('/'+code+'/next','POST',{round:1},b)]);
 const s=(await f.request('/'+code,'GET',undefined,a)).data;assert.equal(s.round,2);assert.equal(s.phase,'thinking');assert.equal(s.words,null);assert.equal(s.history.length,1);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM word_meeting_rounds').get().n,2);
 assert.equal((await f.request('/'+code+'/submit','POST',{round:1,word:'旧词'},a)).status,409);
});
test('matching uses NFKC, case and whitespace normalization; matched rooms cannot advance',async()=>{
 assert.equal(normalizeWord(' Ａ b C '),'abc');assert.equal(normalizeWord(' 词　语 '),'词语');
 const f=fixture(),code=await f.room();await f.request('/'+code+'/submit','POST',{round:1,word:' Ａ b C '},a);
 const done=await f.request('/'+code+'/submit','POST',{round:1,word:'abc'},b);assert.equal(done.data.phase,'matched');assert(done.data.history[0].matched);
 assert.equal((await f.request('/'+code+'/next','POST',{round:1},a)).status,409);
});
test('join retries preserve identity, closed and expired rooms stop accepting words',async()=>{
 const f=fixture(),code=await f.room();const rejoin=await f.request('/'+code+'/join','POST',{name:'乙',token:b});assert.equal(rejoin.status,200);assert.equal(rejoin.data.you,'b');
 assert.equal((await f.request('/'+code+'/leave','POST',{},a)).data.phase,'closed');assert.equal((await f.request('/'+code,'GET',undefined,b)).data.phase,'closed');
 assert.equal((await f.request('/'+code+'/submit','POST',{round:1,word:'词'},b)).status,409);
 f.sql.prepare('UPDATE word_meeting_rooms SET expires_at=1 WHERE code=?').run(code);
 assert.equal((await f.request('/'+code,'GET',undefined,a)).status,404);assert.equal((await f.request('/'+code+'/join','POST',{token:c})).status,404);
 await f.request('','POST',{token:c});assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM word_meeting_rounds WHERE room=?').get(code).n,0);
});
test('input validation, early-next attempts and request limits protect the game',async()=>{
 const f=fixture(),code=await f.room();for(const word of ['', 'a'.repeat(33),'bad\u200bword'])assert.equal((await f.request('/'+code+'/submit','POST',{round:1,word},a)).status,400);
 assert.equal((await f.request('/'+code+'/submit','POST',{round:'1',word:'词'},a)).status,400);
 await f.request('/'+code+'/next','POST',{round:1},a);await f.request('/'+code+'/next','POST',{round:1},b);assert.equal((await f.request('/'+code,'GET',undefined,a)).data.round,1);
 assert.equal((await f.request('','POST',{token:'weak'})).status,400);
 for(let i=0;i<5;i++)assert.equal((await f.request('','POST',{token:c})).status,200);
 assert.equal((await f.request('','POST',{token:c})).status,429);
});
