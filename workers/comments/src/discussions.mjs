import { moderateComment, moderationSettings } from './moderation.mjs';
import { ipLocation } from './location.mjs';

const ID = '[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}';
const categories = ['chat', 'question', 'feedback'];
export function discussionId(thread) {
  if (!thread.startsWith('/discuss/')) return null;
  return new RegExp('^/discuss/(' + ID + ')$').exec(thread)?.[1] || false;
}
export async function checkDiscussion(env, thread, actor, reject, writing = false) {
  const id = discussionId(thread);
  if (id === null) return;
  if (!id) reject(404, '讨论不存在');
  const row = await env.DB.prepare('SELECT author_id,state,locked FROM discussions WHERE id=?').bind(id).first();
  if (!row || row.state === 'deleted' || (row.state !== 'published' && !actor?.admin && row.author_id !== actor?.id)) reject(404, '讨论不存在');
  if (writing && (row.state !== 'published' || row.locked)) reject(409, row.locked ? '这篇讨论已关闭回复' : '帖子发布后可以回复');
}
const detailRoute = new RegExp('^/v1/discussions/(' + ID + ')(/moderate)?$');
const visibleReply = "c.state='published' AND (c.parent_id IS NULL OR EXISTS(SELECT 1 FROM comments p WHERE p.id=c.parent_id AND (p.state='published' OR (p.state='deleted' AND p.published_at IS NOT NULL))))";
const summary = `SELECT d.*, (SELECT COUNT(*) FROM comments c WHERE c.thread='/discuss/'||d.id AND ${visibleReply}) AS replies,
  (SELECT COUNT(*) FROM discussion_likes l WHERE l.discussion_id=d.id) AS likes,
  EXISTS(SELECT 1 FROM discussion_likes l WHERE l.discussion_id=d.id AND l.user_id=?) AS liked,
  MAX(COALESCE(d.published_at,d.created_at),COALESCE((SELECT MAX(c.created_at) FROM comments c WHERE c.thread='/discuss/'||d.id AND ${visibleReply}),0)) AS active_at FROM discussions d`;
function view(row, actor, full = false) {
  return { id: row.id, title: row.title, category: row.category, state: row.state,
    author: { name: row.author_name, avatar: row.avatar_url }, createdAt: row.created_at, updatedAt: row.updated_at,
    pinned: !!row.pinned, locked: !!row.locked, version: row.version, replies: Number(row.replies || 0), likes: Number(row.likes || 0), liked: !!row.liked, activeAt: row.active_at || row.created_at,
    canEdit: actor?.id === row.author_id, canDelete: !!actor && (actor.admin || actor.id === row.author_id),
    ...(full ? { body: row.body, ipLocation: row.ip_location } : { excerpt: row.body.slice(0, 150) }),
    ...(actor?.admin ? { moderation: { status: row.ai_status, reason: row.ai_reason, confidence: row.ai_confidence } } : {}) };
}
function content(input, reject) {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!title || title.length > 100 || /[\x00-\x1f]/.test(title)) reject(400, '标题请填写 1–100 个字符');
  if (!body || body.length > 6000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(body)) reject(400, '正文请填写 1–6000 个字符');
  if (!categories.includes(input.category)) reject(400, '请选择讨论分类');
  return { title, body, category: input.category };
}

export async function discussions({ request, url, env, actor, input, ctx, moderationFetch, safeAvatar, limit, reject }) {
  const now = Math.floor(Date.now() / 1000), method = request.method;
  const schedule = (id, run) => {
    if (!run) return;
    const task = moderateComment(env, id, run, moderationFetch, 'discussions');
    if (ctx?.waitUntil) ctx.waitUntil(task);
    return task;
  };
  const select = async id => env.DB.prepare(summary + ' WHERE d.id=?').bind(actor?.id || '', id).first();
  const adminList = url.pathname === '/v1/admin/discussions';
  if ((url.pathname === '/v1/discussions' || adminList) && method === 'GET') {
    const mine = url.searchParams.get('mine') === '1';
    if ((mine || adminList) && !actor) reject(401, '请先登录');
    if (adminList && !actor.admin) reject(403, '没有管理权限');
    const state = url.searchParams.get('state') || 'pending', category = url.searchParams.get('category');
    if (adminList && !['pending', 'published', 'hidden'].includes(state)) reject(400, '审核状态无效');
    if (category && !categories.includes(category)) reject(400, '分类无效');
    const where = [adminList ? 'd.state=?' : mine ? "d.author_id=? AND d.state!='deleted'" : "d.state='published'"];
    const args = adminList ? [state] : mine ? [actor.id] : [];
    if (category) { where.push('d.category=?'); args.push(category); }
    const sort = url.searchParams.get('sort') || 'active';
    if (!['active', 'new'].includes(sort)) reject(400, '排序方式无效');
    const offset = Number(url.searchParams.get('offset') || 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000) reject(400, '分页参数无效');
    const rows = await env.DB.prepare(summary + ' WHERE ' + where.join(' AND ') +
      ' ORDER BY d.pinned DESC,' + (sort === 'new' ? 'd.created_at' : 'active_at') + ' DESC,d.id DESC LIMIT 21 OFFSET ?').bind(actor?.id || '', ...args, offset).all();
    return { items: rows.results.slice(0, 20).map(row => view(row, actor)), next: rows.results.length > 20 ? offset + 20 : null };
  }
  if (url.pathname === '/v1/discussions' && method === 'POST') {
    const data = content(input, reject);
    if (typeof input.requestId !== 'string' || !new RegExp('^' + ID + '$').test(input.requestId)) reject(400, '发布编号无效，请刷新后重试');
    const existing = await env.DB.prepare('SELECT id,state,title,body,category FROM discussions WHERE author_id=? AND request_id=?').bind(actor.id, input.requestId).first();
    if (existing) {
      if (existing.state === 'deleted') reject(409, '该帖子已删除，请新建讨论');
      if (existing.title !== data.title || existing.body !== data.body || existing.category !== data.category) reject(409, '这次发布已提交，请刷新后查看');
      return { item: view(await select(existing.id), actor, true) };
    }
    await limit(env, actor.id, now);
    const id = crypto.randomUUID(), run = !actor.admin && moderationSettings(env).configured ? crypto.randomUUID() : null;
    await env.DB.prepare(`INSERT INTO discussions(id,author_id,author_name,avatar_url,title,body,category,state,request_id,created_at,updated_at,published_at,ip_location,ai_status,ai_run,ai_checked_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(author_id,request_id) DO NOTHING`).bind(id, actor.id,
      typeof input.name === 'string' ? input.name.trim().slice(0, 40) || '读者' : '读者', safeAvatar(input.avatar), data.title, data.body, data.category,
      actor.admin ? 'published' : 'pending', input.requestId, now, now, actor.admin ? now : null, ipLocation(request.cf), actor.admin ? 'skipped' : run ? 'queued' : 'disabled', run, run ? now : null).run();
    const saved = await env.DB.prepare('SELECT id FROM discussions WHERE author_id=? AND request_id=?').bind(actor.id, input.requestId).first();
    if (saved.id === id) { const task = schedule(id, run); if (!ctx?.waitUntil) await task; }
    return { item: view(await select(saved.id), actor, true) };
  }
  const match = detailRoute.exec(url.pathname);
  if (!match) reject(404, '接口不存在');
  const id = match[1], row = await select(id);
  if (!row || row.state === 'deleted' || (row.state !== 'published' && !actor?.admin && row.author_id !== actor?.id)) reject(404, '讨论不存在');
  if (method === 'GET' && !match[2]) return { item: view(row, actor, true), admin: !!actor?.admin };
  if (match[2] && method === 'POST') {
    if (!actor.admin) reject(403, '没有审核权限');
    if (!moderationSettings(env).configured) reject(503, '请先配置 DeepSeek 密钥');
    const run = crypto.randomUUID();
    const queued = await env.DB.prepare("UPDATE discussions SET ai_run=?,ai_status='queued',ai_reason='',ai_checked_at=? WHERE id=? AND state='pending' AND (ai_run IS NULL OR ai_checked_at<?) RETURNING id").bind(run, now, id, now - 60).first();
    if (!queued) reject(409, '帖子已处理或正在审核');
    const task = schedule(id, run); if (!ctx?.waitUntil) await task;
    return { ok: true };
  }
  if (method === 'DELETE' && !match[2]) {
    if (!actor.admin && actor.id !== row.author_id) reject(403, '没有删除权限');
    await env.DB.prepare("UPDATE discussions SET state='deleted',title='已删除的讨论',body='',ip_location='',ai_run=NULL,ai_status='skipped',ai_reason='',version=version+1,updated_at=? WHERE id=?").bind(now, id).run();
    return { ok: true };
  }
  if (method === 'PATCH' && !match[2]) {
    if (Object.keys(input).some(key => ['state', 'pinned', 'locked'].includes(key))) {
      if (!actor.admin) reject(403, '没有管理权限');
      if (Object.keys(input).some(key => !['state', 'pinned', 'locked'].includes(key)) ||
          (input.state !== undefined && !['published', 'hidden'].includes(input.state)) ||
          ['pinned', 'locked'].some(key => input[key] !== undefined && typeof input[key] !== 'boolean')) reject(400, '管理操作无效');
      const fields = [], args = [];
      for (const key of ['state', 'pinned', 'locked']) if (input[key] !== undefined) { fields.push(key + '=?'); args.push(key === 'state' ? input[key] : Number(input[key])); }
      if (input.state) { fields.push("ai_run=NULL,ai_status='manual',ai_reason='管理员已处理',published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END"); args.push(input.state, now); }
      await env.DB.prepare('UPDATE discussions SET ' + fields.join(',') + ',version=version+1,updated_at=? WHERE id=? AND state!=\'deleted\'').bind(...args, now, id).run();
    } else {
      if (actor.id !== row.author_id) reject(403, '只能编辑自己的帖子');
      const data = content(input, reject);
      if (!Number.isSafeInteger(input.version) || input.version !== row.version) reject(409, '帖子已更新，请刷新后再编辑');
      await limit(env, actor.id, now);
      const run = !actor.admin && moderationSettings(env).configured ? crypto.randomUUID() : null;
      const updated = await env.DB.prepare(`UPDATE discussions SET title=?,body=?,category=?,state=?,version=version+1,updated_at=?,ai_run=?,ai_status=?,ai_reason='',ai_confidence=NULL,ai_checked_at=?
        WHERE id=? AND version=? AND state!='deleted' RETURNING id`).bind(data.title, data.body, data.category, actor.admin ? 'published' : 'pending', now, run,
          actor.admin ? 'skipped' : run ? 'queued' : 'disabled', run ? now : null, id, input.version).first();
      if (!updated) reject(409, '帖子已更新，请刷新后再编辑');
      const task = schedule(id, run); if (!ctx?.waitUntil) await task;
    }
    return { item: view(await select(id), actor, true) };
  }
  reject(405, '请求方法无效');
}
