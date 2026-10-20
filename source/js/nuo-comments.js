(function () {
  'use strict';
  if (window.__nuoCommentsBooted) return;
  window.__nuoCommentsBooted = true;
  let dispose;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function boot() {
    if (dispose) dispose();
    dispose = null;
    const host = document.querySelector('[data-nuo-comments], [data-nuo-comments-admin]');
    if (!host) return;
    const adminPage = host.hasAttribute('data-nuo-comments-admin');
    const api = host.dataset.api.replace(/\/$/, '');
    const controller = new AbortController();
    const signal = controller.signal;
    const query = selector => host.querySelector(selector);
    const status = query('[data-comments-status]');
    const list = query('[data-comments-list]');
    const login = query('[data-comments-login]');
    const form = query('[data-comments-form]');
    const input = query('[data-comments-body]');
    const submit = query('[data-comments-submit]');
    const more = query('[data-comments-more]');
    const filter = query('[data-comments-filter]');
    let clerk, me, next = null, parentId = null, unsubscribe, observer, started = false;
    let fetchVersion = 0, identityVersion = 0;
    const thread = location.pathname;

    async function request(path, options = {}) {
      const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}) };
      if (clerk?.isSignedIn) {
        const token = await clerk.session.getToken();
        if (token) headers.Authorization = 'Bearer ' + token;
      }
      const response = await fetch(api + path, {
        method: options.method || 'GET', headers, signal, credentials: 'omit',
        ...(options.body ? { body: JSON.stringify(options.body) } : {})
      });
      const data = await response.json().catch(() => ({ error: '评论服务暂时不可用，请稍后重试。' }));
      if (!response.ok) throw new Error(data.error || '评论服务暂时不可用');
      return data;
    }
    function message(error) {
      if (!signal.aborted) status.textContent = error?.message || '评论暂时加载失败，请刷新重试。';
    }
    function action(label, run) {
      const button = element('button', label);
      button.type = 'button';
      button.onclick = async () => {
        button.disabled = true;
        try { await run(); } catch (error) { message(error); }
        finally { if (!signal.aborted) button.disabled = false; }
      };
      return button;
    }
    function draw(item) {
      const card = element('article', undefined, 'nuo-comment');
      card.dataset.commentId = item.id;
      const header = element('div', undefined, 'nuo-comment-header');
      if (item.author.avatar) {
        const image = element('img'); image.src = item.author.avatar;
        image.alt = ''; image.width = image.height = 32; image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer'; header.append(image);
      }
      header.append(element('strong', item.author.name));
      const date = element('time', new Date(item.createdAt * 1000).toLocaleString('zh-CN'));
      date.dateTime = new Date(item.createdAt * 1000).toISOString(); header.append(date);
      if (item.state === 'pending') header.append(element('span', '待审核', 'nuo-comment-badge'));
      if (adminPage) header.append(element('span', item.thread, 'nuo-comment-thread'));
      card.append(header);
      if (item.parentId) card.append(element('small', '回复 #' + item.parentId));
      card.append(element('p', item.state === 'deleted' ? '这条评论已删除。' : item.body, 'nuo-comment-body'));
      const actions = element('div', undefined, 'nuo-comment-actions');
      if (!adminPage && clerk?.isSignedIn && !item.parentId && item.state === 'published') {
        actions.append(action('回复', () => {
          parentId = item.id;
          const notice = query('[data-comments-reply]'); notice.hidden = false;
          notice.textContent = '正在回复 ' + item.author.name;
          query('[data-comments-cancel]').hidden = false;
          input.focus();
        }));
      }
      if (adminPage && me?.admin) {
        if (item.state !== 'published') actions.append(action('发布', async () => {
          await request('/v1/comments/' + item.id, { method: 'PATCH', body: { state: 'published' } });
          await load();
        }));
        if (item.state !== 'hidden') actions.append(action('隐藏', async () => {
          await request('/v1/comments/' + item.id, { method: 'PATCH', body: { state: 'hidden' } });
          await load();
        }));
      }
      if (item.canDelete) actions.append(action('删除', async () => {
        if (!confirm('确定删除这条评论？')) return;
        await request('/v1/comments/' + item.id, { method: 'DELETE' });
        await load();
      }));
      if (actions.childNodes.length) card.append(actions);
      return card;
    }
    function cancelReply() {
      parentId = null;
      query('[data-comments-reply]').hidden = true;
      query('[data-comments-cancel]').hidden = true;
    }
    async function load(append = false) {
      const version = ++fetchVersion;
      try {
        if (adminPage && !me?.admin) return;
        const endpoint = adminPage
          ? '/v1/admin/comments?state=' + encodeURIComponent(filter.value)
          : '/v1/comments?thread=' + encodeURIComponent(thread) + (append && next ? '&after=' + next : '');
        const data = await request(endpoint);
        if (signal.aborted || version !== fetchVersion) return;
        if (!append) list.replaceChildren();
        data.items.forEach(item => list.append(draw(item)));
        next = data.next;
        if (more) more.hidden = !next;
        status.textContent = list.childNodes.length ? '' : (adminPage ? '这个分类暂无评论。' : '还没有评论，来聊聊吧。');
      } catch (error) { message(error); }
    }
    async function refreshIdentity() {
      const version = ++identityVersion;
      try {
        if (signal.aborted) return;
        const identity = clerk?.isSignedIn ? await request('/v1/me') : null;
        if (signal.aborted || version !== identityVersion) return;
        me = identity;
        login.hidden = !!me;
        if (submit) submit.disabled = !me;
        if (input) input.disabled = !me;
        const identityLabel = query('[data-comments-identity]');
        if (identityLabel) identityLabel.textContent = me ? '已登录：' + (clerk.user.fullName || clerk.user.username || '读者') : '登录后可发表评论。';
        const adminLink = query('[data-comments-admin-link]');
        if (adminLink) adminLink.hidden = !me?.admin;
        if (adminPage && !me?.admin) {
          list.replaceChildren();
          status.textContent = me ? '当前账号没有评论管理权限。' : '请先登录管理员账号。';
          return;
        }
        await load();
      } catch (error) { message(error); }
    }
    async function start() {
      if (started) return;
      started = true;
      if (!adminPage) await load();
      try {
        clerk = await window.NuoAuth.getClerk();
        if (signal.aborted) return;
        if (clerk) {
          let previousId = clerk.user?.id || null;
          unsubscribe = clerk.addListener(() => {
            const currentId = clerk.user?.id || null;
            if (currentId === previousId) return;
            previousId = currentId;
            if (form) cancelReply();
            // Never carry a draft from one signed-in account to another.
            if (input) input.value = '';
            refreshIdentity();
          });
        }
        await refreshIdentity();
      } catch (error) { message(error); }
    }
    login.onclick = async () => {
      login.disabled = true;
      try {
        clerk = await window.NuoAuth.getClerk();
        if (!clerk) throw new Error('账号服务尚未开放');
        await clerk.openSignIn({ withSignUp: true, forceRedirectUrl: location.origin + location.pathname,
          signUpForceRedirectUrl: location.origin + location.pathname });
      } catch (error) { message(error); }
      finally { login.disabled = false; }
    };
    if (form) {
      query('[data-comments-cancel]').onclick = cancelReply;
      more.onclick = () => load(true);
      form.onsubmit = async event => {
        event.preventDefault();
        const body = input.value.trim();
        if (!me || !body || submit.disabled) return;
        submit.disabled = true;
        try {
          await request('/v1/comments', { method: 'POST', body: {
            thread, parentId, body, name: clerk.user.fullName || clerk.user.username || '读者', avatar: clerk.user.imageUrl || ''
          } });
          if (signal.aborted) return;
          if (input.value.trim() === body) input.value = '';
          cancelReply();
          await load();
          status.textContent = me.admin ? '评论已发布。' : '已提交，审核通过后公开展示。';
        } catch (error) { message(error); }
        finally { if (!signal.aborted) submit.disabled = !me; }
      };
    }
    if (filter) filter.onchange = () => load();
    if (adminPage || !('IntersectionObserver' in window)) start();
    else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start(); }
      }, { rootMargin: '200px' });
      observer.observe(host);
    }
    dispose = () => { controller.abort(); observer?.disconnect(); unsubscribe?.(); };
  }
  document.addEventListener('pjax:send', () => { if (dispose) dispose(); dispose = null; });
  document.addEventListener('pjax:complete', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
