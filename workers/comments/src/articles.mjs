export async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('');
}
export async function loadArticle(thread, articleFetch = fetch) {
  const response = await articleFetch('https://www.1nuo.me/ai/articles/' + await digest(thread) + '.json', {
    redirect: 'manual', signal: AbortSignal.timeout(6000), cf: { cacheTtl: 60 }
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error('article');
  const reader = response.body.getReader(); let size = 0; const chunks = [];
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 80000) { await reader.cancel(); throw Error('article'); } chunks.push(part.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (value.thread !== thread || typeof value.title !== 'string' || value.title.length > 200 || typeof value.body !== 'string' || !value.body.trim() || value.body.length > 12000) throw Error('article');
  return { ...value, hash: await digest(value.title + '\n' + value.body) };
}
export async function rememberArticle(env, article) {
  await env.DB.prepare('INSERT INTO article_contexts(thread,title,body,hash,updated_at) VALUES(?,?,?,?,unixepoch()) ON CONFLICT(thread) DO UPDATE SET title=excluded.title,body=excluded.body,hash=excluded.hash,updated_at=excluded.updated_at').bind(article.thread, article.title, article.body, article.hash).run();
}
