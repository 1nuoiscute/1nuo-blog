import { discussionId, checkDiscussion } from './discussions.mjs';
import { checkContent } from './content-policy.mjs';
const PAGE = 20;
const parentVisible = "(c.parent_id IS NULL OR EXISTS(SELECT 1 FROM comments p WHERE p.id=c.parent_id AND (p.state='published' OR (p.state='deleted' AND p.published_at IS NOT NULL))))";
const threadVisible = "(c.thread NOT LIKE '/discuss/%' OR EXISTS(SELECT 1 FROM discussions d WHERE '/discuss/'||d.id=c.thread AND d.state='published'))";
const publicComment = "c.state='published' AND " + parentVisible + ' AND ' + threadVisible;
const target = (thread, id) => thread.startsWith('/discuss/') ? '/discuss/?id=' + thread.split('/').pop() + (id ? '#nuo-comment-' + id : '') : thread + (id ? '#nuo-comment-' + id : '');
const profileView = row => row && ({ id: row.public_id, name: row.name, avatar: row.avatar, bio: row.bio, enabled: !!row.enabled, shareBadges: !!row.share_badges, version: row.version });
export async function rememberAIThread(env, user, thread) {
  await env.DB.prepare('INSERT INTO account_ai_threads(user_id,thread,updated_at) VALUES(?,?,unixepoch()) ON CONFLICT(user_id,thread) DO UPDATE SET updated_at=excluded.updated_at').bind(user, thread).run();
}
async function catalog(fetchSource) {
  const response = await fetchSource('https://www.1nuo.me/community/catalog.json', { redirect: 'manual', signal: AbortSignal.timeout(6000), cf: { cacheTtl: 60 } });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error('catalog');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 1500000) { await reader.cancel(); throw Error('catalog'); } chunks.push(part.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(data.items) || data.items.length > 5000) throw Error('catalog');
  return new Map(data.items.filter(item => typeof item.path === 'string' && item.path.startsWith('/') && !item.path.startsWith('//') && !/[?#\\\x00-\x20]/.test(item.path) && typeof item.title === 'string' && item.title.length <= 200 && ['article','note','page'].includes(item.kind)).map(item => [item.path, item]));
}
async function rate(env, actor, group, max, reject) {
  const slot = Math.floor(Date.now()/60000);
  const row = await env.DB.prepare('INSERT INTO comment_limits(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind('community:'+group+':'+actor.id+':'+slot,(slot+1)*60).first();
  if(row.hits>max) reject(429,'操作太频繁，请稍后再试');
}
function meta(row, items) {
  if(row.thread.startsWith('/discuss/')) return row.post_title ? { title:row.post_title, kind:'discussion' } : null;
  return items.get(row.thread) || null;
}
function commentView(row, items) {
  const info=meta(row,items); return info && {id:row.id,thread:row.thread,title:info.title,kind:info.kind,body:row.body.slice(0,240),state:row.state,createdAt:row.created_at,floor:row.floor,url:target(row.thread,row.id)};
}
async function stats(env, user, items) {
  const posts=await env.DB.prepare("SELECT COUNT(*) n FROM discussions WHERE author_id=? AND state='published'").bind(user).first();
  const replies=await env.DB.prepare(`SELECT c.thread,COUNT(*) n,(SELECT title FROM discussions d WHERE '/discuss/'||d.id=c.thread AND d.state='published') post_title FROM comments c WHERE c.author_id=? AND ${publicComment} GROUP BY c.thread`).bind(user).all();
  const other=await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM account_library WHERE user_id=? AND slot='read' AND json_extract(value,'$.read')=1) read_count,(SELECT COUNT(*) FROM account_ai_threads a WHERE a.user_id=? AND EXISTS(SELECT 1 FROM comments c WHERE c.thread=a.thread AND c.author_kind='bot' AND ${publicComment} AND (EXISTS(SELECT 1 FROM bot_jobs j WHERE j.id=c.bot_job_id AND j.requester_id=a.user_id) OR (c.bot_job_id LIKE 'article:%' AND c.parent_id IS NULL)))) ai_count,(SELECT MAX(max_tile) FROM account_scores WHERE user_id=? AND game='2048') tile`).bind(user,user,user).first();
  const counts={posts:posts.n,comments:replies.results.filter(row=>meta(row,items)).reduce((sum,row)=>sum+row.n,0)};
  const badges=[['first-post','话题发起人','发布过一篇讨论',counts.posts>=1],['first-comment','来聊两句','留下过公开回复',counts.comments>=1],['fish-friend','大肥鱼的朋友','与大肥鱼聊过天',other.ai_count>=1],['reader-ten','十篇之后','标记读完十篇内容',other.read_count>=10],['tile-2048','合成 2048','在2048里合出2048方块',other.tile>=2048]].filter(item=>item[3]).map(([id,name,description])=>({id,name,description}));
  return {counts,badges};
}
async function libraryOptions(env,user,items) {
  const rows=await env.DB.prepare("SELECT path FROM account_library WHERE user_id=? AND slot='bookmark' AND value!='null' ORDER BY changed_at DESC LIMIT 5000").bind(user).all();
  return rows.results.filter(row=>items.has(row.path)).map(row=>items.get(row.path));
}
async function activities(env,user,kind,offset,items,publicOnly=false) {
  let rows;
  if(kind==='posts') {
    rows=await env.DB.prepare(`SELECT id,title,body,state,created_at FROM discussions WHERE author_id=? AND ${publicOnly?"state='published'":"state!='deleted'"} ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET ?`).bind(user,offset).all();
    return {items:rows.results.slice(0,PAGE).map(row=>({id:row.id,title:row.title,body:row.body.slice(0,240),state:row.state,createdAt:row.created_at,url:target('/discuss/'+row.id),kind:'discussion'})),next:rows.results.length>PAGE?offset+PAGE:null};
  }
  if(kind==='comments') {
    rows=await env.DB.prepare(`SELECT c.*,(SELECT title FROM discussions d WHERE '/discuss/'||d.id=c.thread AND d.state='published') post_title FROM comments c WHERE c.author_id=? AND ${publicOnly?publicComment:"c.state!='deleted' AND "+threadVisible+' AND ('+parentVisible+" OR EXISTS(SELECT 1 FROM comments p WHERE p.id=c.parent_id AND p.author_id=c.author_id AND p.state='pending'))"} ORDER BY c.id DESC LIMIT 21 OFFSET ?`).bind(user,offset).all();
    return {items:rows.results.slice(0,PAGE).map(row=>commentView(row,items)).filter(Boolean),next:rows.results.length>PAGE?offset+PAGE:null};
  }
  if(kind==='participated') {
    rows=await env.DB.prepare(`SELECT d.id,d.title,d.body,d.created_at,MAX(d.created_at,COALESCE((SELECT MAX(c.created_at) FROM comments c WHERE c.thread='/discuss/'||d.id AND c.state='published'),0)) active_at FROM discussions d WHERE d.state='published' AND (d.author_id=? OR EXISTS(SELECT 1 FROM comments c WHERE c.thread='/discuss/'||d.id AND c.author_id=? AND c.state IN ('published','pending'))) ORDER BY active_at DESC,d.id DESC LIMIT 21 OFFSET ?`).bind(user,user,offset).all();
    return {items:rows.results.slice(0,PAGE).map(row=>({id:row.id,title:row.title,body:row.body.slice(0,200),url:target('/discuss/'+row.id),createdAt:row.active_at,kind:'discussion'})),next:rows.results.length>PAGE?offset+PAGE:null};
  }
  rows=await env.DB.prepare(`SELECT a.*,(SELECT title FROM discussions d WHERE '/discuss/'||d.id=a.thread AND d.state='published') post_title,
    (SELECT id FROM comments c WHERE c.thread=a.thread AND c.author_kind='bot' AND ${publicComment} AND (EXISTS(SELECT 1 FROM bot_jobs j WHERE j.id=c.bot_job_id AND j.requester_id=a.user_id) OR (c.bot_job_id LIKE 'article:%' AND c.parent_id IS NULL)) ORDER BY c.id DESC LIMIT 1) comment_id,
    (SELECT body FROM comments c WHERE c.thread=a.thread AND c.author_kind='bot' AND ${publicComment} AND (EXISTS(SELECT 1 FROM bot_jobs j WHERE j.id=c.bot_job_id AND j.requester_id=a.user_id) OR (c.bot_job_id LIKE 'article:%' AND c.parent_id IS NULL)) ORDER BY c.id DESC LIMIT 1) body,
    (SELECT status FROM bot_jobs j WHERE j.thread=a.thread AND j.requester_id=a.user_id ORDER BY j.created_at DESC,j.id DESC LIMIT 1) job_status
    FROM account_ai_threads a WHERE a.user_id=? ORDER BY a.updated_at DESC,a.thread LIMIT 21 OFFSET ?`).bind(user,offset).all();
  return {items:rows.results.slice(0,PAGE).map(row=>{const info=meta(row,items);return info&&{thread:row.thread,title:info.title,body:(row.body||'等待大肥鱼接话').slice(0,240),state:row.job_status,url:target(row.thread,row.comment_id),createdAt:row.updated_at,kind:'ai'};}).filter(Boolean),next:rows.results.length>PAGE?offset+PAGE:null};
}
export async function community({request,url,env,actor,input,normalizePath,safeAvatar,reject,sourceFetch=fetch}) {
  const method=request.method,path=url.pathname;
  let items;
  try {items=await catalog(sourceFetch);} catch {reject(503,'暂时读不到内容目录，请稍后重试');}
  const offset=Number(url.searchParams.get('offset')||0); if(!Number.isSafeInteger(offset)||offset<0||offset>100000) reject(400,'分页参数无效');
  const publicRoute=/^\/v1\/community\/profiles\/([a-f0-9-]{36})$/.exec(path);
  if(publicRoute&&method==='GET') {
    const row=await env.DB.prepare('SELECT * FROM community_profiles WHERE public_id=? AND enabled=1').bind(publicRoute[1]).first(); if(!row) reject(404,'这个个人主页还没有公开');
    const kind=url.searchParams.get('kind')||'posts'; if(!['posts','comments','books'].includes(kind)) reject(400,'分类无效');
    const {counts,badges}=await stats(env,row.user_id,items);
    if(kind==='books') {
      const options=await libraryOptions(env,row.user_id,items), allowed=new Map(options.map(item=>[item.path,item]));
      const selected=await env.DB.prepare('SELECT path FROM profile_bookmarks WHERE user_id=? ORDER BY position').bind(row.user_id).all();
      return {profile:profileView(row),counts,badges:row.share_badges?badges:[],items:selected.results.filter(item=>allowed.has(item.path)).map(item=>({...allowed.get(item.path),url:item.path})),next:null};
    }
    return {profile:profileView(row),counts,badges:row.share_badges?badges:[],...await activities(env,row.user_id,kind,offset,items,true)};
  }
  if(!actor) reject(401,'请先登录');
  if(path==='/v1/community/profile'&&method==='GET') {
    const row=await env.DB.prepare('SELECT * FROM community_profiles WHERE user_id=?').bind(actor.id).first();
    const shared=await env.DB.prepare('SELECT path FROM profile_bookmarks WHERE user_id=? ORDER BY position').bind(actor.id).all();
    return {profile:profileView(row),selected:shared.results.map(item=>item.path),bookmarks:await libraryOptions(env,actor.id,items),...await stats(env,actor.id,items)};
  }
  if(path==='/v1/community/profile'&&method==='POST') {
    if(typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>40||typeof input.bio!=='string'||input.bio.length>280||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(input.name+input.bio)||typeof input.enabled!=='boolean'||typeof input.shareBadges!=='boolean'||!Array.isArray(input.selected)||input.selected.length>40||new Set(input.selected).size!==input.selected.length||!Number.isSafeInteger(input.version)||input.version<0) reject(400,'请填写昵称、简介和主页展示选项');
    checkContent(input.name+'\n'+input.bio,reject); await rate(env,actor,'profile',10,reject);
    const options=await libraryOptions(env,actor.id,items),allowed=new Set(options.map(item=>item.path)); if(input.selected.some(item=>!allowed.has(item))) reject(400,'只能展示自己收藏的公开内容');
    const old=await env.DB.prepare('SELECT * FROM community_profiles WHERE user_id=?').bind(actor.id).first(); if((old?.version||0)!==input.version) reject(409,'主页已更新，请重新加载后保存');
    const token=crypto.randomUUID(),now=Math.floor(Date.now()/1000),version=input.version+1;
    const writes=[env.DB.prepare(`INSERT INTO community_profiles(user_id,public_id,name,avatar,bio,enabled,share_badges,version,edit_token,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,avatar=excluded.avatar,bio=excluded.bio,enabled=excluded.enabled,share_badges=excluded.share_badges,version=excluded.version,edit_token=excluded.edit_token,updated_at=excluded.updated_at WHERE community_profiles.version=?`).bind(actor.id,old?.public_id||crypto.randomUUID(),input.name.trim(),safeAvatar(input.avatar),input.bio.trim(),Number(input.enabled),Number(input.shareBadges),version,token,old?.created_at||now,now,input.version),
      env.DB.prepare('DELETE FROM profile_bookmarks WHERE user_id=? AND EXISTS(SELECT 1 FROM community_profiles WHERE user_id=? AND edit_token=?)').bind(actor.id,actor.id,token),
      ...input.selected.map((path,index)=>env.DB.prepare('INSERT INTO profile_bookmarks(user_id,path,position) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM community_profiles WHERE user_id=? AND edit_token=?)').bind(actor.id,path,index,actor.id,token))];
    const saved=await env.DB.batch(writes); if(!saved[0].meta.changes) reject(409,'主页已更新，请重新加载后保存');
    return {profile:profileView(await env.DB.prepare('SELECT * FROM community_profiles WHERE user_id=?').bind(actor.id).first())};
  }
  if(path==='/v1/community/activity'&&method==='GET') {
    const kind=url.searchParams.get('kind')||'posts'; if(!['posts','comments','participated','ai'].includes(kind)) reject(400,'分类无效');
    return activities(env,actor.id,kind,offset,items);
  }
  if(path==='/v1/community/follows'&&method==='GET') {
    const rows=await env.DB.prepare(`SELECT f.*,(SELECT title FROM discussions d WHERE '/discuss/'||d.id=f.thread AND d.state='published') post_title,
      (SELECT COUNT(*) FROM comments c WHERE c.thread=f.thread AND ${publicComment} AND c.floor>f.seen_floor AND c.author_id!=f.user_id) unread,
      (SELECT MAX(c.floor) FROM comments c WHERE c.thread=f.thread AND ${publicComment}) latest_floor,
      (SELECT MIN(c.id) FROM comments c WHERE c.thread=f.thread AND ${publicComment} AND c.floor>f.seen_floor AND c.author_id!=f.user_id) first_unread,
      MAX(f.followed_at,COALESCE((SELECT MAX(c.created_at) FROM comments c WHERE c.thread=f.thread AND ${publicComment}),0)) active_at FROM thread_follows f WHERE f.user_id=? ORDER BY active_at DESC,f.thread LIMIT 21 OFFSET ?`).bind(actor.id,offset).all();
    return {items:rows.results.slice(0,PAGE).map(row=>{const info=meta(row,items);return {thread:row.thread,title:info?.title||'内容暂不可见',kind:row.kind,available:!!info,unread:info?row.unread:0,seenFloor:row.seen_floor,latestFloor:row.latest_floor||0,createdAt:row.active_at,url:info?target(row.thread,row.first_unread):null};}),next:rows.results.length>PAGE?offset+PAGE:null};
  }
  if(path==='/v1/community/follow'&&['GET','POST','DELETE'].includes(method)) {
    const thread=normalizePath(method==='GET'?url.searchParams.get('thread'):input.thread),id=discussionId(thread);
    let info=items.get(thread),available=!!info&&['article','note'].includes(info.kind);
    if(id) { const post=await env.DB.prepare("SELECT title FROM discussions WHERE id=? AND state='published'").bind(id).first(); info=post&&{title:post.title,kind:'discussion'}; available=!!post; }
    const old=await env.DB.prepare('SELECT seen_floor FROM thread_follows WHERE user_id=? AND thread=?').bind(actor.id,thread).first();
    if(method==='GET') return {following:!!old,available,seenFloor:old?.seen_floor||0};
    await rate(env,actor,'follow',60,reject);
    if(method==='DELETE') {await env.DB.prepare('DELETE FROM thread_follows WHERE user_id=? AND thread=?').bind(actor.id,thread).run();return {following:false};}
    if(!available) reject(404,'这篇内容暂时不能关注');
    const latest=await env.DB.prepare(`SELECT COALESCE(MAX(c.floor),0) floor FROM comments c WHERE c.thread=? AND ${publicComment}`).bind(thread).first();
    const saved=await env.DB.prepare(`INSERT INTO thread_follows(user_id,thread,title,kind,followed_at,seen_floor) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM thread_follows WHERE user_id=?)<200 ON CONFLICT(user_id,thread) DO UPDATE SET title=excluded.title`).bind(actor.id,thread,info.title,info.kind,Math.floor(Date.now()/1000),latest.floor,actor.id).run();
    if(!saved.meta.changes&&!old) reject(409,'最多可关注200篇内容，请先整理关注列表'); return {following:true,seenFloor:old?.seen_floor??latest.floor};
  }
  if(path==='/v1/community/follows/read'&&method==='POST') {
    const thread=normalizePath(input.thread); if(!Number.isSafeInteger(input.throughFloor)||input.throughFloor<0) reject(400,'已读位置无效');
    await rate(env,actor,'read',90,reject);
    await env.DB.prepare(`UPDATE thread_follows SET seen_floor=MAX(seen_floor,MIN(?,COALESCE((SELECT MAX(c.floor) FROM comments c WHERE c.thread=thread_follows.thread AND ${publicComment}),0))) WHERE user_id=? AND thread=?`).bind(input.throughFloor,actor.id,thread).run();return {ok:true};
  }
  reject(405,'请求方法无效');
}
