import { checkDiscussion, discussionId } from './discussions.mjs';

export async function likeContent({ request, env, actor, kind, id, reject }) {
  if (!['POST', 'DELETE'].includes(request.method)) reject(405, '请求方法无效');
  const post = kind === 'discussions', table = post ? 'discussion_likes' : 'comment_likes', column = post ? 'discussion_id' : 'comment_id';
  const row = await env.DB.prepare(post ? 'SELECT state FROM discussions WHERE id=?' : 'SELECT state,thread,parent_id FROM comments WHERE id=?').bind(id).first();
  if (!row || row.state !== 'published') reject(404, '内容不存在');
  if (!post) {
    if (!discussionId(row.thread)) reject(404, '回复不存在');
    await checkDiscussion(env, row.thread, null, reject);
    if (row.parent_id) {
      const parent = await env.DB.prepare('SELECT state,published_at FROM comments WHERE id=?').bind(row.parent_id).first();
      if (!parent || (parent.state !== 'published' && !(parent.state === 'deleted' && parent.published_at !== null))) reject(404, '回复不存在');
    }
  }
  const now = Math.floor(Date.now() / 1000), slot = Math.floor(now / 60);
  const limit = await env.DB.prepare('INSERT INTO comment_limits(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind('likes:' + slot + ':' + actor.id, (slot + 1) * 60).first();
  if (limit.hits > 90) reject(429, '操作太频繁，请稍后再试');
  if (request.method === 'DELETE') await env.DB.prepare(`DELETE FROM ${table} WHERE ${column}=? AND user_id=?`).bind(id, actor.id).run();
  else {
    const visible = post ? "EXISTS(SELECT 1 FROM discussions WHERE id=? AND state='published')" :
      "EXISTS(SELECT 1 FROM comments c JOIN discussions d ON c.thread='/discuss/'||d.id WHERE c.id=? AND c.state='published' AND d.state='published' AND (c.parent_id IS NULL OR EXISTS(SELECT 1 FROM comments p WHERE p.id=c.parent_id AND (p.state='published' OR (p.state='deleted' AND p.published_at IS NOT NULL)))))";
    await env.DB.prepare(`INSERT INTO ${table}(${column},user_id,created_at) SELECT ?,?,? WHERE ${visible} ON CONFLICT DO NOTHING`).bind(id, actor.id, now, id).run();
  }
  const result = await env.DB.prepare(`SELECT COUNT(*) AS likes,COALESCE(MAX(user_id=?),0) AS liked FROM ${table} WHERE ${column}=?`).bind(actor.id, id).first();
  return { likes: Number(result.likes), liked: !!result.liked };
}
