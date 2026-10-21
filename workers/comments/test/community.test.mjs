import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createWorker} from '../src/index.mjs';
const keys=await generateKeyPair('RS256',{extractable:true}),jwk={...await exportJWK(keys.publicKey),kid:'community',alg:'RS256'},origin='https://www.1nuo.me',issuer='https://fixture.clerk.accounts.dev';
const token=user=>new SignJWT({sid:'session',azp:origin}).setProtectedHeader({alg:'RS256',kid:'community'}).setSubject(user).setIssuer(issuer).setIssuedAt().setExpirationTime('1h').sign(keys.privateKey);
function fixture() {
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
  const dir=new URL('../migrations/',import.meta.url);for(const file of readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL(file,dir),'utf8'));
  const DB={prepare(query){const s=sql.prepare(query);let a=[];return{bind(...v){a=v;return this;},async first(){return s.get(...a)||null;},async all(){return{results:s.all(...a)};},async run(){return{meta:{changes:Number(s.run(...a).changes)}};},step(){return{meta:{changes:Number(s.run(...a).changes)}};}};},async batch(stmts){sql.exec('BEGIN');try{const r=stmts.map(s=>s.step());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
  const catalog=[{path:'/article',title:'公开文章',kind:'article'},{path:'/notes/math',title:'概率笔记',kind:'note'},{path:'/explore/game',title:'小游戏',kind:'page'}];
  const worker=createWorker({jwksFetch:async()=>Response.json({keys:[jwk]}),sourceFetch:async url=>{assert.equal(url,'https://www.1nuo.me/community/catalog.json');return Response.json({items:catalog});}});
  const env={DB,CLERK_ISSUER:issuer,ALLOWED_ORIGINS:origin,ADMIN_USER_IDS:'user_admin'};
  return {sql,catalog,async request(path,user='user_alice',method='GET',body){const response=await worker.fetch(new Request('https://api.test'+path,{method,headers:{Origin:origin,...(user?{Authorization:'Bearer '+await token(user)}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);return{status:response.status,data:await response.json()};}};
}
function post(f,user='user_alice',state='published',title='我的讨论') {const id=crypto.randomUUID();f.sql.prepare('INSERT INTO discussions(id,author_id,author_name,title,body,category,state,request_id,created_at,updated_at,published_at) VALUES(?,?,?,?,?,\'chat\',?,?,1,1,?)').run(id,user,user,title,'正文',state,id,state==='published'?1:null);return id;}
function reply(f,user='user_alice',thread='/article',state='published',body='我的留言',parent=null,kind='human',replyTo=null) {return Number(f.sql.prepare('INSERT INTO comments(thread,author_id,author_name,body,state,created_at,updated_at,published_at,parent_id,author_kind,reply_to) VALUES(?,?,?,?,?,1,1,?,?,?,?)').run(thread,user,user,body,state,state==='published'?1:null,parent,kind,replyTo).lastInsertRowid);}
function bookmark(f,user,path='/article') {f.sql.prepare("INSERT OR REPLACE INTO account_library VALUES(?,'bookmark',?,?,1,'fixture')").run(user,path,JSON.stringify({title:'客户端伪造标题'}));}
const profile=(extra={})=>({name:'Alice',bio:'记录一点小发现。',avatar:'https://evil.test/track',enabled:false,shareBadges:true,selected:[],version:0,...extra});

test('community ownership uses JWT; public profile is opt-in and collections are individually selected from public bookmarks',async()=>{
  const f=fixture();assert.equal((await f.request('/v1/community/profile',null)).status,401);
  bookmark(f,'user_alice');bookmark(f,'user_alice','/private-diary');bookmark(f,'user_bob','/notes/math');
  const initial=await f.request('/v1/community/profile');assert.equal(initial.data.profile,null);assert.equal(initial.data.bookmarks.length,1);assert.equal(initial.data.bookmarks[0].title,'公开文章');
  const saved=await f.request('/v1/community/profile','user_alice','POST',profile({user_id:'user_bob',selected:['/article']}));assert.equal(saved.status,200);const id=saved.data.profile.id;assert.equal(saved.data.profile.avatar,'');
  assert.equal((await f.request('/v1/community/profiles/'+id,null)).status,404);assert.equal((await f.request('/v1/community/profile','user_bob')).data.profile,null);
  assert.equal((await f.request('/v1/community/profile','user_alice','POST',profile({version:1,selected:['/notes/math']}))).status,400);
  const enabled=await f.request('/v1/community/profile','user_alice','POST',profile({version:1,enabled:true,selected:['/article']}));assert.equal(enabled.status,200);
  const books=await f.request('/v1/community/profiles/'+id+'?kind=books',null);assert.equal(books.data.items[0].title,'公开文章');assert(!JSON.stringify(books.data).includes('user_alice'));assert(!JSON.stringify(books.data).includes('private-diary'));
  f.sql.prepare("UPDATE account_library SET value='null' WHERE user_id='user_alice' AND path='/article'").run();assert.deepEqual((await f.request('/v1/community/profiles/'+id+'?kind=books',null)).data.items,[]);bookmark(f,'user_alice');
  f.catalog.splice(0,1);assert.deepEqual((await f.request('/v1/community/profiles/'+id+'?kind=books',null)).data.items,[]);
});

test('my activity separates posts, comments, participation and AI conversations without exposing other accounts or hidden threads',async()=>{
  const f=fixture(),mine=post(f),pending=post(f,'user_alice','pending','自己的待审'),other=post(f,'user_bob'),hidden=post(f,'user_bob','hidden','隐藏标题');
  reply(f,'user_alice','/discuss/'+other);reply(f,'user_bob','/article','pending','别人的待审核秘密');reply(f,'user_alice','/article','pending','自己的待审留言');reply(f,'user_alice','/discuss/'+hidden,'published','隐藏帖留言');
  const minePosts=(await f.request('/v1/community/activity?kind=posts')).data.items;assert(minePosts.some(p=>p.id===mine));assert(minePosts.some(p=>p.id===pending));assert(!minePosts.some(p=>p.id===other));
  const comments=await f.request('/v1/community/activity?kind=comments');assert(JSON.stringify(comments).includes('自己的待审留言'));assert(!JSON.stringify(comments).includes('秘密'));assert(!JSON.stringify(comments).includes('隐藏标题'));
  const participation=(await f.request('/v1/community/activity?kind=participated')).data.items;assert(participation.some(p=>p.id===mine));assert(participation.some(p=>p.id===other));assert(!participation.some(p=>p.id===hidden));
  f.sql.prepare('INSERT INTO account_ai_threads VALUES(?,?,1)').run('user_alice','/article');const bot=reply(f,'bot:dafeiyu','/article','published','大肥鱼接着聊',null,'bot');f.sql.prepare("UPDATE comments SET bot_job_id='article:fixture' WHERE id=?").run(bot);
  const ai=(await f.request('/v1/community/activity?kind=ai')).data.items;assert.equal(ai.length,1);assert.equal(ai[0].kind,'ai');assert(ai[0].url.includes('#nuo-comment-'));assert.equal((await f.request('/v1/community/activity?kind=ai','user_bob')).data.items.length,0);
});

test('following tracks only newly published visible replies, preserves unseen newer replies and isolates accounts',async()=>{
  const f=fixture(),thread='/discuss/'+post(f,'user_bob');reply(f,'user_bob',thread);
  assert.equal((await f.request('/v1/community/follow',null,'POST',{thread})).status,401);
  assert.equal((await f.request('/v1/community/follow','user_alice','POST',{thread:'/explore/game'})).status,404);
  assert.equal((await f.request('/v1/community/follow','user_alice','POST',{thread:'//evil.test'})).status,400);
  assert.equal((await f.request('/v1/community/follow','user_alice','POST',{thread,title:'伪造标题'})).data.following,true);
  reply(f,'user_alice',thread);const waiting=reply(f,'user_bob',thread,'pending');reply(f,'user_bob',thread,'hidden');
  assert.equal((await f.request('/v1/community/follows')).data.items[0].unread,0);
  f.sql.prepare("UPDATE comments SET state='published',published_at=2 WHERE id=?").run(waiting);
  const unread=(await f.request('/v1/community/follows')).data.items[0];assert.equal(unread.unread,1);assert.equal(unread.latestFloor,3);assert(unread.url.endsWith('#nuo-comment-'+waiting));
  reply(f,'bot:dafeiyu',thread,'published','AI回复',null,'bot');
  await f.request('/v1/community/follows/read','user_alice','POST',{thread,throughFloor:3});assert.equal((await f.request('/v1/community/follows')).data.items[0].unread,1);
  await f.request('/v1/community/follows/read','user_alice','POST',{thread,throughFloor:99999});assert.equal((await f.request('/v1/community/follows')).data.items[0].unread,0);
  await f.request('/v1/community/follows/read','user_alice','POST',{thread,throughFloor:1});assert.equal((await f.request('/v1/community/follow?thread='+encodeURIComponent(thread))).data.seenFloor,4);
  assert.equal((await f.request('/v1/community/follows','user_bob')).data.items.length,0);
  f.sql.prepare("UPDATE discussions SET state='hidden' WHERE id=?").run(thread.split('/').pop());const hidden=(await f.request('/v1/community/follows')).data.items[0];assert.equal(hidden.available,false);assert.equal(hidden.unread,0);assert.equal(hidden.url,null);
  assert.equal((await f.request('/v1/community/follow','user_alice','DELETE',{thread})).data.following,false);
});

test('public profiles show only public activity, earned badges and explicitly shared books, and disappear when disabled',async()=>{
  const f=fixture(),id=post(f);post(f,'user_alice','pending','私密待审标题');reply(f);reply(f,'user_alice','/article','pending','私密待审正文');
  f.sql.prepare('INSERT INTO account_ai_threads VALUES(?,?,1)').run('user_alice','/article');
  const earned=reply(f,'bot:dafeiyu','/article','published','公开的AI总结',null,'bot');f.sql.prepare("UPDATE comments SET bot_job_id='article:earned' WHERE id=?").run(earned);
  for(let i=0;i<10;i++)f.sql.prepare("INSERT INTO account_library VALUES('user_alice','read',?,?,1,'read')").run('/read-private-'+i,JSON.stringify({title:'私人阅读明细',read:true}));
  f.sql.prepare("INSERT INTO account_scores(user_id,game,name,avatar,score,max_tile,achieved_at) VALUES('user_alice','2048','Alice','',8192,2048,1)").run();
  const saved=await f.request('/v1/community/profile','user_alice','POST',profile({enabled:true})),publicId=saved.data.profile.id;
  const page=await f.request('/v1/community/profiles/'+publicId,null);assert.equal(page.data.items.length,1);assert.equal(page.data.items[0].id,id);assert(page.data.badges.some(b=>b.id==='first-post'));assert(page.data.badges.some(b=>b.id==='fish-friend'));assert(page.data.badges.some(b=>b.id==='tile-2048'));assert(page.data.badges.some(b=>b.id==='reader-ten'));assert(!JSON.stringify(page.data).includes('read-private'));
  const comments=await f.request('/v1/community/profiles/'+publicId+'?kind=comments',null);assert.equal(comments.data.items.length,1);assert(!JSON.stringify(comments.data).includes('私密'));
  const list=await f.request('/v1/discussions',null);assert.equal(list.data.items[0].author.profileId,publicId);
  const read=await f.request('/v1/comments?thread=/article',null);assert.equal(read.data.items[0].author.profileId,publicId);
  await f.request('/v1/community/profile','user_alice','POST',profile({version:1,enabled:true,shareBadges:false}));assert.deepEqual((await f.request('/v1/community/profiles/'+publicId,null)).data.badges,[]);
  await f.request('/v1/community/profile','user_alice','POST',profile({version:2,enabled:false,shareBadges:false}));assert.equal((await f.request('/v1/community/profiles/'+publicId,null)).status,404);assert(!('profileId' in (await f.request('/v1/discussions',null)).data.items[0].author));
});

test('profile version conflicts cannot overwrite selections; block rules and pagination are enforced',async()=>{
  const f=fixture();bookmark(f,'user_alice');await f.request('/v1/community/profile','user_alice','POST',profile());
  const result=await Promise.all([f.request('/v1/community/profile','user_alice','POST',profile({version:1,selected:['/article']})),f.request('/v1/community/profile','user_alice','POST',profile({version:1,bio:'另一处修改'}))]);assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);
  const current=(await f.request('/v1/community/profile')).data;assert.deepEqual(current.selected,current.profile.bio==='另一处修改'?[]:['/article']);
  assert.equal((await f.request('/v1/community/profile','user_alice','POST',profile({version:current.profile.version,bio:'shc'}))).status,400);
  for(let i=0;i<25;i++)post(f,'user_alice','published','帖子'+i);
  const first=(await f.request('/v1/community/activity?kind=posts')).data;assert.equal(first.items.length,20);assert.equal(first.next,20);const second=(await f.request('/v1/community/activity?kind=posts&offset=20')).data;assert.equal(second.items.length,5);assert.equal(second.next,null);
  assert.equal((await f.request('/v1/community/activity?kind=unknown')).status,400);
});
