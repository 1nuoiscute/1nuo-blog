import { createRemoteJWKSet, customFetch, jwtVerify } from 'jose';
import { moderateComment, moderationSettings, probeProvider } from './moderation.mjs';
import { ipLocation } from './location.mjs';
import { accountData } from './account-data.mjs';
import { discussions, checkDiscussion, discussionId } from './discussions.mjs';
import { likeContent } from './likes.mjs';
import { BOT, botJobs, processBotJobs } from './bot.mjs';
import { checkContent } from './content-policy.mjs';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const reject = (status, message) => { throw new HttpError(status, message); };
const split = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);

export function threadPath(value) {
  if (typeof value !== 'string' || value.length > 500 || !value.startsWith('/') ||
      value.startsWith('//') || /[?#\\\x00-\x20]/.test(value)) reject(400, '文章地址无效');
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { reject(400, '文章地址无效'); }
  if (/[\\\x00-\x1f]/.test(decoded) || decoded.startsWith('//') || decoded.split('/').some(part => part === '.' || part === '..')) reject(400, '文章地址无效');
  const normalized = new URL(value, 'https://www.1nuo.me').pathname.replace(/\/index\.html$/, '/');
  return normalized === '/' ? '/' : normalized.replace(/\/$/, '');
}

async function jsonBody(request, maximum = 10000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) reject(415, '请提交 JSON');
  if (Number(request.headers.get('content-length')) > maximum) reject(413, '内容过长');
  const reader = request.body?.getReader();
  if (!reader) reject(400, '请求内容为空');
  const chunks = []; let length = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    length += next.value.byteLength;
    if (length > maximum) { await reader.cancel(); reject(413, '内容过长'); }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) reject(400, '请求内容无效');
    return value;
  } catch { reject(400, '请求内容无效'); }
}

function safeAvatar(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['img.clerk.com', 'images.clerk.dev'].includes(url.hostname) &&
      value.length <= 1500 && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
function publicComment(row, actor) {
  return {
    id: row.id, thread: row.thread, parentId: row.parent_id,
    author: row.author_kind === 'bot' ? { name: BOT.name, avatar: BOT.avatar, bot: true } : { name: row.author_name, avatar: row.avatar_url, bot: false },
    replyTo: row.reply_to ?? null,
    body: row.state === 'deleted' ? '' : row.body,
    state: row.state, createdAt: row.created_at,
    floor: row.floor ?? null, parentFloor: row.parent_floor ?? null,
    likes: row.state === 'published' ? Number(row.likes || 0) : 0, liked: row.state === 'published' && !!row.liked,
    ipLocation: row.state === 'deleted' ? '' : row.ip_location || '',
    canDelete: !!actor && row.state !== 'deleted' && (actor.id === row.author_id || actor.admin),
    ...(actor?.admin ? { moderation: { status: row.ai_status, reason: row.ai_reason, model: row.ai_model, checkedAt: row.ai_checked_at, confidence: row.ai_confidence ?? null } } : {})
  };
}

export function createWorker({ jwksFetch = fetch, moderationFetch = fetch, botFetch = fetch } = {}) {
  const keysets = new Map();
  async function authenticate(request, env, required = true) {
    const authorization = request.headers.get('authorization');
    if (!authorization && !required) return null;
    if (!authorization?.startsWith('Bearer ')) reject(401, '请先登录');
    const issuer = env.CLERK_ISSUER;
    if (!issuer || !/^https:\/\/[a-z0-9.-]+$/i.test(issuer)) reject(503, '账号验证尚未配置');
    if (!keysets.has(issuer)) keysets.set(issuer, createRemoteJWKSet(new URL(issuer + '/.well-known/jwks.json'), { [customFetch]: jwksFetch, timeoutDuration: 5000 }));
    let payload;
    try {
      ({ payload } = await jwtVerify(authorization.slice(7), keysets.get(issuer), {
        issuer, algorithms: ['RS256'], requiredClaims: ['sub', 'exp', 'iat', 'sid', 'azp']
      }));
    } catch { reject(401, '登录已失效，请重新登录'); }
    if (!/^user_[A-Za-z0-9]+$/.test(payload.sub) || typeof payload.sid !== 'string' ||
        payload.sts === 'pending' || !split(env.ALLOWED_ORIGINS).includes(payload.azp)) reject(401, '登录状态无效');
    return { id: payload.sub, admin: split(env.ADMIN_USER_IDS).includes(payload.sub) };
  }
  async function limit(env, userId, now) {
    for (const [seconds, maximum] of [[60, 3], [86400, 40]]) {
      const slot = Math.floor(now / seconds);
      const bucket = `${seconds}:${slot}:${userId}`;
      const row = await env.DB.prepare('INSERT INTO comment_limits(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits')
        .bind(bucket, (slot + 1) * seconds).first();
      if (row.hits > maximum) reject(429, '发送太频繁，请稍后再试');
    }
  }

  return {
    async scheduled(event, env, ctx) {
      ctx.waitUntil(processBotJobs(env, botFetch, moderationFetch, 3));
    },
    async fetch(request, env, ctx) {
      const wake = job => processBotJobs(env, botFetch, moderationFetch, 1, job ?? null);
      const wakeLater = async job => { const task = wake(job); if (ctx?.waitUntil) ctx.waitUntil(task); else await task; };
      const origin = request.headers.get('origin');
      const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin' });
      if (split(env.ALLOWED_ORIGINS).includes(origin)) headers.set('Access-Control-Allow-Origin', origin);
      function reply(value, status = 200) { return new Response(JSON.stringify(value), { status, headers }); }
      try {
        if (origin && !split(env.ALLOWED_ORIGINS).includes(origin)) reject(403, '不允许的来源');
        if (request.method === 'OPTIONS') {
          headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
          headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          headers.set('Access-Control-Max-Age', '600');
          return new Response(null, { status: 204, headers });
        }
        const url = new URL(request.url);
        const retryRoute = /^\/v1\/bot-jobs\/(post:[a-f0-9-]{36}|comment:[1-9][0-9]*)\/retry$/.exec(url.pathname);
        if (retryRoute && request.method === 'POST') {
          const actor = await authenticate(request, env), id = retryRoute[1];
          const job = await env.DB.prepare('SELECT * FROM bot_jobs WHERE id=?').bind(id).first();
          if (!job) reject(404, '回复任务不存在');
          if (!actor.admin && actor.id !== job.requester_id) reject(403, '只能重试自己的对话');
          await checkDiscussion(env, '/discuss/' + job.discussion_id, actor, reject, true);
          const retrySlot = Math.floor(Date.now() / 60000);
          const retryRate = await env.DB.prepare('INSERT INTO comment_limits(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind('bot-retry:' + actor.id + ':' + retrySlot, (retrySlot + 1) * 60).first();
          if (retryRate.hits > 3) reject(429, '重试太频繁，请稍后再试');
          const row = await env.DB.prepare("UPDATE bot_jobs SET status='queued',available_at=?,last_error='' WHERE id=? AND status IN ('error','limited') AND attempts<3 RETURNING id").bind(Math.floor(Date.now() / 1000), id).first();
          if (!row) reject(409, '任务已处理或正在回复，请刷新查看');
          await wakeLater(id); return reply({ ok: true });
        }
        const likeRoute = /^\/v1\/(discussions|comments)\/([a-f0-9-]+)\/like$/.exec(url.pathname);
        if (likeRoute) {
          const actor = await authenticate(request, env);
          const id = likeRoute[1] === 'comments' ? Number(likeRoute[2]) : likeRoute[2];
          if (likeRoute[1] === 'comments' && (!Number.isSafeInteger(id) || id < 1)) reject(400, '回复编号无效');
          return reply(await likeContent({ request, env, actor, kind: likeRoute[1], id, reject }));
        }
        if (/^\/v1\/(?:discussions(?:\/|$)|admin\/discussions$)/.test(url.pathname)) {
          const actor = await authenticate(request, env, request.method !== 'GET');
          const input = ['POST', 'PATCH'].includes(request.method) && !url.pathname.endsWith('/moderate') ? await jsonBody(request, 24000) : null;
          const data = await discussions({ request, url, env, actor, input, ctx, moderationFetch, safeAvatar, limit, reject, afterWrite: () => wake() });
          if (request.method !== 'GET') await wakeLater(data.item?.id ? 'post:' + data.item.id : null);
          return reply(data);
        }
        if (['/v1/library', '/v1/leaderboard/2048'].includes(url.pathname)) {
          const actor = await authenticate(request, env, !(url.pathname === '/v1/leaderboard/2048' && request.method === 'GET'));
          const input = request.method === 'POST' ? await jsonBody(request) : null;
          return reply(await accountData({ request, url, env, actor, input, normalizePath: threadPath, safeAvatar, reject }));
        }
        if (request.method === 'GET' && url.pathname === '/health') {
          await env.DB.prepare('SELECT id FROM comments LIMIT 1').all();
          return reply({ ok: true, service: '1nuo-comments', authConfigured: !!env.CLERK_ISSUER,
            autoModerationConfigured: moderationSettings(env).configured });
        }
        if (request.method === 'GET' && url.pathname === '/v1/me') {
          const actor = await authenticate(request, env);
          return reply({ id: actor.id, admin: actor.admin, ...(actor.admin ? { moderation: moderationSettings(env) } : {}) });
        }
        if (request.method === 'GET' && url.pathname === '/v1/comments') {
          const thread = threadPath(url.searchParams.get('thread'));
          const actor = await authenticate(request, env, false);
          await checkDiscussion(env, thread, actor, reject);
          const forum = !!discussionId(thread), cursor = url.searchParams.get('after') || (forum ? '0:0' : '0');
          const parts = cursor.split(':').map(Number), after = parts[0];
          if (!parts.every(value => Number.isSafeInteger(value) && value >= 0) || parts.length !== (forum ? 2 : 1)) reject(400, '分页参数无效');
          const paging = forum ? '(COALESCE(c.floor,2147483647)>? OR (COALESCE(c.floor,2147483647)=? AND c.id>?))' : 'c.id>?';
          const pagingArgs = forum ? [after, after, parts[1]] : [after];
          const rows = await env.DB.prepare(`SELECT c.*,
            (SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id=c.id) AS likes,
            EXISTS(SELECT 1 FROM comment_likes l WHERE l.comment_id=c.id AND l.user_id=?) AS liked,
            (SELECT floor FROM comments p WHERE p.id=COALESCE(c.reply_to,c.parent_id)) AS parent_floor FROM comments c WHERE c.thread=? AND ${paging}
            AND (c.state='published' OR (c.state='deleted' AND c.published_at IS NOT NULL) OR (c.author_id=? AND c.state='pending'))
            AND (c.parent_id IS NULL OR EXISTS(SELECT 1 FROM comments p WHERE p.id=c.parent_id
              AND (p.state='published' OR (p.state='deleted' AND p.published_at IS NOT NULL) OR (p.author_id=? AND p.state='pending'))))
            ORDER BY ${forum ? 'COALESCE(c.floor,2147483647),' : ''}c.id ASC LIMIT 31`).bind(actor?.id || '', thread, ...pagingArgs, actor?.id || '', actor?.id || '').all();
          const items = rows.results.slice(0, 30);
          const last = items.at(-1);
          return reply({ items: items.map(row => publicComment(row, actor)), next: rows.results.length > 30 ? (forum ? (last.floor ?? 2147483647) + ':' + last.id : last.id) : null,
            ...(forum ? { bot: await botJobs(env, discussionId(thread), actor) } : {}) });
        }
        if (request.method === 'POST' && url.pathname === '/v1/comments') {
          const actor = await authenticate(request, env);
          const input = await jsonBody(request);
          const thread = threadPath(input.thread);
          await checkDiscussion(env, thread, actor, reject, true);
          const body = typeof input.body === 'string' ? input.body.trim() : '';
          if (!body || body.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(body)) reject(400, '评论请填写 1–2000 个字符');
          checkContent(body, reject);
          let parentId = input.parentId ?? null, replyTo = null, botRequested = false;
          if (discussionId(thread) && input.replyTo !== undefined && input.replyTo !== null) {
            if (!Number.isSafeInteger(input.replyTo) || input.replyTo < 1) reject(400, '回复对象无效');
            const target = await env.DB.prepare("SELECT * FROM comments WHERE id=? AND thread=? AND state='published'").bind(input.replyTo, thread).first();
            if (!target) reject(400, '回复对象不存在或尚未发布');
            replyTo = target.id; parentId = target.parent_id || target.id; botRequested = target.author_kind === 'bot';
          }
          botRequested = !!discussionId(thread) && (botRequested || /@(DeepSeek|大肥鱼)(?=$|\s|[，。！？,.!?：:])/i.test(body));
          if (parentId !== null) {
            if (!Number.isSafeInteger(parentId) || parentId < 1) reject(400, '回复对象无效');
            const parent = await env.DB.prepare('SELECT * FROM comments WHERE id=? AND thread=? AND parent_id IS NULL').bind(parentId, thread).first();
            if (!parent || parent.state !== 'published') reject(400, '只能回复已发布的主评论');
          }
          // Labels are user-chosen display text, never identity or permission.
          // Only the verified JWT sub determines ownership and administrator status.
          const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : '';
          const now = Math.floor(Date.now() / 1000);
          await limit(env, actor.id, now);
          const run = !actor.admin && moderationSettings(env).configured ? crypto.randomUUID() : null;
          const row = await env.DB.prepare(`INSERT INTO comments(thread,parent_id,author_id,author_name,avatar_url,body,state,created_at,updated_at,published_at,ai_status,ai_run,ai_checked_at,ip_location,reply_to,bot_requested)
            SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE ? IS NULL OR EXISTS(SELECT 1 FROM discussions WHERE id=? AND state='published' AND locked=0) RETURNING *`).bind(thread, parentId, actor.id, name || '读者 ' + actor.id.slice(-6),
              safeAvatar(input.avatar), body, actor.admin ? 'published' : 'pending', now, now, actor.admin ? now : null,
              actor.admin ? 'skipped' : run ? 'queued' : 'disabled', run, run ? now : null, ipLocation(request.cf), replyTo, Number(botRequested), discussionId(thread), discussionId(thread)).first();
          if (!row) reject(409, '这篇讨论已关闭回复，请刷新页面');
          if (run) {
            const task = moderateComment(env, row.id, run, moderationFetch).then(() => wake('comment:' + row.id));
            if (ctx?.waitUntil) ctx.waitUntil(task); else await task;
          }
          if (!run) await wakeLater('comment:' + row.id);
          if (ctx?.waitUntil) ctx.waitUntil(env.DB.prepare('DELETE FROM comment_limits WHERE bucket IN (SELECT bucket FROM comment_limits WHERE expires_at<? LIMIT 100)').bind(now - 86400).run());
          const saved = row.state === 'published' ? await env.DB.prepare('SELECT * FROM comments WHERE id=?').bind(row.id).first() : row;
          return reply({ item: publicComment(saved, actor) }, 201);
        }
        const moderateRoute = /^\/v1\/comments\/([1-9][0-9]*)\/moderate$/.exec(url.pathname);
        if (moderateRoute && request.method === 'POST') {
          const actor = await authenticate(request, env);
          if (!actor.admin) reject(403, '没有审核权限');
          if (!moderationSettings(env).configured) reject(503, '请先配置 DeepSeek 密钥');
          const id = Number(moderateRoute[1]);
          if (!Number.isSafeInteger(id)) reject(400, '评论编号无效');
          const run = crypto.randomUUID(), now = Math.floor(Date.now() / 1000);
          const row = await env.DB.prepare(`UPDATE comments SET ai_run=?,ai_status='queued',ai_reason='',ai_checked_at=?
            WHERE id=? AND state='pending' AND (ai_run IS NULL OR ai_checked_at<?) RETURNING id`)
            .bind(run, now, id, now - 60).first();
          if (!row) reject(409, '评论已处理或正在审核，请刷新列表');
          const task = moderateComment(env, id, run, moderationFetch).then(() => wake('comment:' + id));
          if (ctx?.waitUntil) ctx.waitUntil(task); else await task;
          return reply({ ok: true }, 202);
        }
        const itemRoute = /^\/v1\/comments\/([1-9][0-9]*)$/.exec(url.pathname);
        if (itemRoute && ['DELETE', 'PATCH'].includes(request.method)) {
          const actor = await authenticate(request, env);
          const id = Number(itemRoute[1]);
          if (!Number.isSafeInteger(id)) reject(400, '评论编号无效');
          const row = await env.DB.prepare('SELECT * FROM comments WHERE id=?').bind(id).first();
          if (!row) reject(404, '评论不存在');
          if (request.method === 'DELETE') {
            if (!actor.admin && row.author_id !== actor.id) reject(403, '没有删除权限');
            await env.DB.prepare("UPDATE comments SET state='deleted', body='', ip_location='',ai_run=NULL,ai_status='skipped',ai_reason='',ai_model='',ai_confidence=NULL,updated_at=? WHERE id=?").bind(Math.floor(Date.now() / 1000), id).run();
          } else {
            if (!actor.admin) reject(403, '没有审核权限');
            const input = await jsonBody(request);
            if (!['published', 'hidden'].includes(input.state) || row.state === 'deleted') reject(400, '审核状态无效');
            if (input.state === 'published') checkContent(row.body, reject);
            const now = Math.floor(Date.now() / 1000);
            await env.DB.prepare("UPDATE comments SET state=?,updated_at=?,ai_run=NULL,ai_reason=CASE WHEN ai_status='queued' THEN '管理员已处理' ELSE ai_reason END,ai_status=CASE WHEN ai_status='queued' THEN 'manual' ELSE ai_status END,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END WHERE id=? AND state!='deleted'")
              .bind(input.state, now, input.state, now, id).run();
          }
          await wakeLater('comment:' + id);
          return reply({ ok: true });
        }
        if (request.method === 'POST' && url.pathname === '/v1/admin/diagnostics') {
          const actor = await authenticate(request, env);
          if (!actor.admin) reject(403, '没有审核权限');
          const input = await jsonBody(request);
          return reply(await probeProvider(env, moderationFetch, { chat: input.chat === true }));
        }
        if (request.method === 'GET' && url.pathname === '/v1/admin/comments') {
          const actor = await authenticate(request, env);
          if (!actor.admin) reject(403, '没有审核权限');
          const state = url.searchParams.get('state') || 'pending';
          if (!['pending', 'published', 'hidden'].includes(state)) reject(400, '审核状态无效');
          const rows = await env.DB.prepare('SELECT * FROM comments WHERE state=? ORDER BY id DESC LIMIT 100').bind(state).all();
          return reply({ items: rows.results.map(row => publicComment(row, actor)) });
        }
        reject(404, '接口不存在');
      } catch (error) {
        if (!(error instanceof HttpError)) console.error('Comments request failed', error?.name || 'Error');
        return reply({ error: error instanceof HttpError ? error.message : '评论服务暂时不可用' }, error instanceof HttpError ? error.status : 500);
      }
    }
  };
}
export default createWorker();
