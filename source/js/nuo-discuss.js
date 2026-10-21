(function () {
  'use strict';
  if (window.__nuoDiscussBooted) return;
  window.__nuoDiscussBooted = true;
  let dispose;
  const labels = { chat: '随便聊聊', question: '问题交流', feedback: '网站反馈' };
  const states = { pending: '待审核', hidden: '已隐藏' };
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  // Construct a small Markdown subset as DOM nodes. User text never becomes HTML.
  function inline(node, text) {
    const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^\s)]+\))/g;
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      node.append(document.createTextNode(text.slice(last, match.index)));
      const value = match[0];
      if (value[0] === '`') node.append(el('code', value.slice(1, -1)));
      else if (value.startsWith('**')) node.append(el('strong', value.slice(2, -2)));
      else {
        const parts = /^\[([^\]]+)\]\((.+)\)$/.exec(value);
        let url;
        try { url = new URL(parts[2], location.origin); } catch { /* retain text */ }
        if (url && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) {
          const a = el('a', parts[1]); a.href = url.href; a.rel = 'nofollow ugc noopener noreferrer';
          if (url.origin !== location.origin) a.target = '_blank'; node.append(a);
        } else node.append(document.createTextNode(value));
      }
      last = match.index + value.length;
    }
    node.append(document.createTextNode(text.slice(last)));
  }
  function markdown(node, text) {
    node.replaceChildren();
    const lines = String(text).replace(/\r\n?/g, '\n').split('\n'); let paragraph = [], code = null, list = null;
    const flush = () => { if (paragraph.length) { const p = el('p'); inline(p, paragraph.join('\n')); node.append(p); paragraph = []; } list = null; };
    for (const line of lines) {
      if (/^```/.test(line)) { flush(); if (code) { node.append(el('pre')); node.lastChild.append(el('code', code.join('\n'))); code = null; } else code = []; continue; }
      if (code) { code.push(line); continue; }
      if (!line.trim()) { flush(); continue; }
      const heading = /^(#{1,3})\s+(.+)$/.exec(line), quote = /^>\s?(.*)$/.exec(line), bullet = /^[-*]\s+(.+)$/.exec(line);
      if (heading || quote) { flush(); const n = el(heading ? 'h' + (heading[1].length + 2) : 'blockquote'); inline(n, heading ? heading[2] : quote[1]); node.append(n); }
      else if (bullet) { if (!list) { flush(); list = el('ul'); node.append(list); } const li = el('li'); inline(li, bullet[1]); list.append(li); }
      else { if (list) flush(); paragraph.push(line); }
    }
    flush(); if (code) { const pre = el('pre'); pre.append(el('code', code.join('\n'))); node.append(pre); }
  }
  function avatar(author) {
    const n = el('span', (author.name || '读').slice(0, 1), 'nd-avatar'); n.setAttribute('aria-hidden', 'true');
    try {
      const url = new URL(author.avatar);
      if (url.protocol === 'https:' && ['img.clerk.com', 'images.clerk.dev'].includes(url.hostname)) {
        const img = el('img'); img.src = url.href; img.alt = ''; img.width = img.height = 38; img.referrerPolicy = 'no-referrer'; img.loading = 'lazy';
        img.onerror = () => img.replaceWith(document.createTextNode((author.name || '读').slice(0, 1))); n.replaceChildren(img);
      }
    } catch { /* initial avatar */ }
    return n;
  }
  function date(value) {
    const d = new Date(value * 1000), n = el('time', d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    n.dateTime = d.toISOString(); n.title = d.toLocaleString('zh-CN'); return n;
  }
  function boot() {
    dispose?.(); dispose = null;
    const host = document.querySelector('[data-nuo-discuss]'); if (!host) return;
    const cloud = window.NuoCloud, q = s => host.querySelector(s), controller = new AbortController(), signal = controller.signal;
    const content = q('[data-discuss-content]'), status = q('[data-discuss-status]'), editor = q('[data-discuss-editor]'), form = q('[data-discuss-form]');
    const title = form.elements.title, body = form.elements.body, category = form.elements.category, submit = q('[data-discuss-submit]'), formStatus = q('[data-discuss-form-status]');
    let user = null, me = null, scope = '', selected = '', next = null, current = null, editing = null, requestId = null, sequence = 0, unsubscribe, identityEpoch = 0, poll;
    let shownDraft = 'new', identityChanging = false;
    const draftKey = () => 'nuo:discuss:draft:v1:' + user?.id + ':' + shownDraft;
    function saveDraft() {
      if (!user || editor.hidden) return;
      try { localStorage.setItem(draftKey(), JSON.stringify({ title: title.value, body: body.value, category: category.value, requestId, version: editing?.version })); q('[data-discuss-draft]').textContent = '草稿已保存在此设备'; }
      catch { q('[data-discuss-draft]').textContent = '草稿未保存，请保持页面打开'; }
    }
    function preview(on) {
      body.hidden = on; q('[data-discuss-preview-body]').hidden = !on;
      q('[data-discuss-preview]').setAttribute('aria-pressed', String(on)); q('[data-discuss-write]').setAttribute('aria-pressed', String(!on));
      if (on) markdown(q('[data-discuss-preview-body]'), body.value || '写下正文后，在这里查看排版。');
    }
    async function openEditor(item) {
      if (identityChanging) { status.textContent = '正在切换账号，请稍候…'; return; }
      if (!user) { try { await cloud.login(); } catch (e) { status.textContent = e.message; } return; }
      saveDraft(); editing = item ? { ...item } : null; shownDraft = item?.id || 'new';
      let draft; try { draft = JSON.parse(localStorage.getItem(draftKey()) || 'null'); } catch { /* new draft */ }
      title.value = draft?.title ?? item?.title ?? ''; body.value = draft?.body ?? item?.body ?? ''; category.value = draft?.category || item?.category || selected || 'chat';
      if (editing && draft?.version) editing.version = draft.version;
      requestId = draft?.requestId || crypto.randomUUID();
      editor.hidden = false; q('#nd-editor-title').textContent = item ? '编辑讨论' : '发起讨论'; submit.textContent = item ? '保存修改' : '发布讨论';
      formStatus.textContent = ''; q('[data-discuss-count]').textContent = body.value.length + ' / 6000'; preview(false);
      editor.scrollIntoView({ behavior: 'auto', block: 'start' }); title.focus();
    }
    function navigate(id) {
      saveDraft(); editor.hidden = true; current = null;
      history.pushState(null, '', '/discuss/' + (id ? '?id=' + encodeURIComponent(id) : ''));
      load();
    }
    function link(text, id, cls) { const a = el('a', text, cls); a.href = '/discuss/' + (id ? '?id=' + encodeURIComponent(id) : ''); a.onclick = e => { if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); e.stopPropagation(); navigate(id); }; return a; }
    function button(text, fn, cls) { const b = el('button', text, cls); b.type = 'button'; b.onclick = async () => { b.disabled = true; try { await fn(); } catch (e) { if (!signal.aborted) status.textContent = e.message; } finally { if (!signal.aborted) b.disabled = false; } }; return b; }
    function badges(item, node) { if (item.pinned) node.append(el('span', '置顶', 'nd-badge')); if (states[item.state]) node.append(el('span', states[item.state], 'nd-badge')); if (item.locked) node.append(el('span', '已关闭回复', 'nd-badge')); }
    function row(item) {
      const article = el('article', undefined, 'nd-row'), main = el('div'), meta = el('div', undefined, 'nd-meta');
      article.dataset.discussionId = item.id; article.append(avatar(item.author), main);
      const excerpt = String(item.excerpt || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^[#>\-*]+\s*/gm, '').replace(/[*`]/g, '').replace(/\s+/g, ' ');
      main.append(link(item.title, item.id, 'nd-title'), el('p', excerpt, 'nd-excerpt'));
      meta.append(el('span', labels[item.category]), el('span', item.author.name), date(item.activeAt)); badges(item, meta); main.append(meta);
      const counts = el('div', undefined, 'nd-metrics');
      for (const [value, label, key] of [[item.likes || 0, '赞', 'likes'], [item.replies, '回复', 'replies']]) {
        const count = el('div', undefined, 'nd-replies'); count.dataset.metric = key; count.setAttribute('aria-label', value + ' 个' + label);
        count.append(el('strong', value), el('span', label)); counts.append(count);
      }
      article.append(counts); return article;
    }
    function detail(item) {
      const article = el('article', undefined, 'nd-detail'); article.dataset.discussionId = item.id;
      article.append(link('‹ 全部讨论', null, 'nd-back'));
      const meta = el('div', undefined, 'nd-meta'); meta.append(el('span', labels[item.category])); badges(item, meta); article.append(meta, el('h2', item.title, 'nd-post-title'));
      const author = el('div', undefined, 'nd-author'), info = el('div'), times = el('div', undefined, 'nd-meta');
      times.append(date(item.createdAt)); if (item.updatedAt > item.createdAt) times.append(el('span', '已编辑')); if (item.ipLocation) times.append(el('span', 'IP 属地：' + item.ipLocation));
      info.append(el('strong', item.author.name), times); author.append(avatar(item.author), info); article.append(author);
      const prose = el('div', undefined, 'nd-prose'); markdown(prose, item.body); article.append(prose);
      if (item.state !== 'published') article.append(el('div', item.state === 'pending' ? '正在审核，发布后大家就能看到这篇讨论。' : '这篇讨论已被隐藏，可以编辑后重新提交。', 'nd-review'));
      if (item.moderation && item.state === 'pending') article.append(el('div', item.moderation.reason || '等待审核结果', 'nd-review'));
      const actions = el('div', undefined, 'nd-post-actions');
      if (item.state === 'published') {
        const like = button('', async () => {
          if (!user) { await cloud.login(); return; }
          const owner = user.id;
          const result = await cloud.request('/v1/discussions/' + item.id + '/like', { method: item.liked ? 'DELETE' : 'POST' });
          if (signal.aborted || owner !== user?.id) return;
          item.likes = result.likes; item.liked = result.liked; updateLike();
        }, 'nd-like');
        like.dataset.postLike = '';
        const updateLike = () => { like.textContent = (item.liked ? '♥ 已赞 ' : '♡ 点赞 ') + (item.likes || 0); like.setAttribute('aria-pressed', String(!!item.liked)); };
        updateLike(); actions.append(like);
      }
      if (item.canEdit) actions.append(button('编辑', () => openEditor(item)));
      if (item.canDelete) actions.append(button('删除', async () => { if (!confirm('删除这篇讨论及其公开回复？')) return; await cloud.request('/v1/discussions/' + item.id, { method: 'DELETE' }); navigate(); }));
      if (me?.admin) {
        const change = async data => { await cloud.request('/v1/discussions/' + item.id, { method: 'PATCH', body: data }); await load(); };
        actions.append(button(item.pinned ? '取消置顶' : '置顶', () => change({ pinned: !item.pinned })), button(item.locked ? '开放回复' : '关闭回复', () => change({ locked: !item.locked })));
        actions.append(button(item.state === 'published' ? '隐藏' : '发布', () => change({ state: item.state === 'published' ? 'hidden' : 'published' })));
        if (item.state === 'pending') actions.append(button('AI 复审', async () => { await cloud.request('/v1/discussions/' + item.id + '/moderate', { method: 'POST' }); await load(); }));
      }
      article.append(actions);
      if (item.state === 'published') {
        const template = document.getElementById('nd-comments-template');
        const comments = template.content.cloneNode(true); comments.querySelector('[data-nuo-comments]').dataset.thread = '/discuss/' + item.id;
        if (item.locked) { article.classList.add('nd-locked'); article.append(el('p', '这篇讨论已关闭回复。', 'nd-review')); }
        article.append(comments);
      }
      return article;
    }
    async function load(append = false) {
      const ticket = ++sequence, id = new URLSearchParams(location.search).get('id'); clearTimeout(poll);
      q('[data-discuss-toolbar]').hidden = !!id; q('[data-discuss-admin-filters]').hidden = !!id || scope !== 'admin'; q('[data-discuss-more]').hidden = true;
      status.textContent = '正在加载讨论…';
      if (!append) { content.replaceChildren(); document.dispatchEvent(new Event('nuo:comments-mount')); }
      try {
        if (id && !/^[a-f0-9-]{36}$/.test(id)) throw new Error('讨论地址无效，点击“全部”回到列表。');
        const params = new URLSearchParams({ sort: q('[data-discuss-sort]').value });
        if (selected) params.set('category', selected);
        if (scope === 'mine') params.set('mine', '1');
        if (scope === 'admin') params.set('state', q('[data-discuss-state]').value);
        if (append && next !== null) params.set('offset', next);
        const data = await cloud.request(id ? '/v1/discussions/' + id : (scope === 'admin' ? '/v1/admin/discussions?' : '/v1/discussions?') + params);
        if (signal.aborted || ticket !== sequence) return;
        if (id) { current = data.item; content.append(detail(current)); document.dispatchEvent(new Event('nuo:comments-mount')); if (current.state === 'pending') poll = setTimeout(() => load(), 15000); }
        else {
          data.items.forEach(item => content.append(row(item))); next = data.next; q('[data-discuss-more]').hidden = next === null;
          if (!content.childNodes.length) { const empty = el('div', undefined, 'nd-empty'); empty.append(el('h2', scope === 'mine' ? '你的讨论，从这里开始' : scope === 'admin' ? '这里已经处理好了' : '第一句话，留给你'), el('p', scope === 'admin' ? '当前分类暂无帖子。' : '一个问题、一段近况，都可以成为话题。')); if (scope !== 'admin') empty.append(button('发起讨论', () => openEditor(), 'nd-primary')); content.append(empty); }
        }
        status.textContent = '';
      } catch (e) { if (!signal.aborted && ticket === sequence) { status.textContent = e.message; if (id) content.append(link('‹ 全部讨论', null, 'nd-back')); content.append(button('重新加载', () => load())); } }
    }
    async function identity() {
      const epoch = ++identityEpoch; me = null;
      try { if (user) me = await cloud.request('/v1/me'); }
      catch (e) { if (epoch === identityEpoch) status.textContent = e.message; }
      if (signal.aborted || epoch !== identityEpoch) return;
      q('[data-discuss-admin]').hidden = !me?.admin; await load();
    }
    q('[data-discuss-new]').onclick = () => openEditor();
    q('[data-discuss-close]').onclick = () => { saveDraft(); editor.hidden = true; };
    q('[data-discuss-preview]').onclick = () => preview(true); q('[data-discuss-write]').onclick = () => preview(false);
    form.addEventListener('input', () => { if (!editing) requestId = crypto.randomUUID(); q('[data-discuss-count]').textContent = body.value.length + ' / 6000'; saveDraft(); }, { signal });
    form.onsubmit = async e => {
      e.preventDefault(); if (!user || submit.disabled) return;
      const owner = user.id, epoch = identityEpoch, draft = draftKey(), item = editing, snapshot = { title: title.value.trim(), body: body.value.trim(), category: category.value, requestId, version: item?.version, name: user.name, avatar: user.avatar };
      saveDraft(); submit.disabled = true; [title, body, category].forEach(n => { n.disabled = true; }); formStatus.textContent = '正在提交…';
      try {
        const data = await cloud.request('/v1/discussions' + (item ? '/' + item.id : ''), { method: item ? 'PATCH' : 'POST', body: snapshot });
        if (signal.aborted || epoch !== identityEpoch || owner !== user?.id) return;
        try { localStorage.removeItem(draft); } catch { /* optional cache */ }
        editor.hidden = true; navigate(data.item.id); status.textContent = data.item.state === 'published' ? '讨论已发布。' : '已提交，正在审核。';
      } catch (error) { if (!signal.aborted && epoch === identityEpoch) formStatus.textContent = error.message + '，草稿已保留。'; }
      finally { if (!signal.aborted) { submit.disabled = false; [title, body, category].forEach(n => { n.disabled = false; }); } }
    };
    host.querySelectorAll('[data-category]').forEach(b => { b.onclick = () => { selected = b.dataset.category; host.querySelectorAll('[data-category]').forEach(n => n.setAttribute('aria-pressed', String(n === b))); load(); }; });
    q('[data-discuss-sort]').onchange = () => load(); q('[data-discuss-state]').onchange = () => load(); q('[data-discuss-more]').onclick = () => load(true);
    for (const [name, target] of [['mine', '[data-discuss-mine]'], ['admin', '[data-discuss-admin]']]) q(target).onclick = async () => {
      if (!user) { await openEditor(); return; }
      scope = scope === name ? '' : name;
      q('[data-discuss-mine]').setAttribute('aria-pressed', String(scope === 'mine')); q('[data-discuss-admin]').setAttribute('aria-pressed', String(scope === 'admin')); load();
    };
    window.addEventListener('popstate', () => { saveDraft(); editor.hidden = true; load(); }, { signal });
    window.addEventListener('pagehide', saveDraft, { signal });
    document.addEventListener('nuo:account-before-change', () => {
      saveDraft(); identityChanging = true; editor.hidden = true; user = me = null; sequence++; identityEpoch++;
      content.replaceChildren(); document.dispatchEvent(new Event('nuo:comments-mount')); q('[data-discuss-admin]').hidden = true;
      status.textContent = '正在切换账号…';
    }, { signal });
    dispose = () => { saveDraft(); controller.abort(); clearTimeout(poll); unsubscribe?.(); sequence++; identityEpoch++; };
    (async () => {
      await cloud.ready(); if (signal.aborted) return; user = cloud.state().user;
      unsubscribe = cloud.subscribe(state => {
        if (!identityChanging && (state.user?.id || null) === (user?.id || null)) { user = state.user; return; }
        identityChanging = false;
        saveDraft(); user = state.user; editor.hidden = true; title.value = body.value = ''; editing = null; scope = ''; sequence++;
        q('[data-discuss-mine]').setAttribute('aria-pressed', 'false'); q('[data-discuss-admin]').setAttribute('aria-pressed', 'false'); content.replaceChildren(); document.dispatchEvent(new Event('nuo:comments-mount')); identity();
      }); await identity();
    })().catch(e => { if (!signal.aborted) status.textContent = e.message; });
  }
  document.addEventListener('pjax:send', () => { dispose?.(); dispose = null; });
  document.addEventListener('pjax:complete', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
