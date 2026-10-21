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
    const diagnose = query('[data-comments-diagnose]');
    const diagnosis = query('[data-comments-diagnosis]');
    let clerk, me, next = null, parentId = null, unsubscribe, observer, started = false;
    let fetchVersion = 0, identityVersion = 0;
    const timers = new Set();
    const thread = host.dataset.thread || location.pathname;

    async function request(path, options = {}) {
      const owner = clerk?.user?.id || null;
      const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}) };
      if (clerk?.isSignedIn) {
        const token = await clerk.session.getToken();
        if ((clerk?.user?.id || null) !== owner) throw new Error('账号已切换，请重试');
        if (token) headers.Authorization = 'Bearer ' + token;
      }
      const response = await fetch(api + path, {
        method: options.method || 'GET', headers, signal, credentials: 'omit',
        ...(options.body ? { body: JSON.stringify(options.body) } : {})
      });
      const data = await response.json().catch(() => ({ error: '评论服务暂时不可用，请稍后重试。' }));
      if ((clerk?.user?.id || null) !== owner) throw new Error('账号已切换，请重试');
      if (!response.ok) throw new Error(data.error || '评论服务暂时不可用');
      return data;
    }
    function message(error) {
      if (!signal.aborted) status.textContent = error?.message || '评论暂时加载失败，请刷新重试。';
    }
    function avatar(name, url) {
      const node = element('span', (name || '访').slice(0, 1), 'nuo-comment-avatar');
      node.setAttribute('aria-hidden', 'true');
      if (url) {
        const image = element('img'); image.src = url; image.alt = '';
        image.width = image.height = 36; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
        image.onerror = () => image.replaceWith(document.createTextNode((name || '访').slice(0, 1)));
        node.replaceChildren(image);
      }
      return node;
    }
    function counter() {
      const node = query('[data-comments-counter]');
      if (node) node.textContent = input.value.length + ' / 2000';
    }
    function cancelPolling() { timers.forEach(clearTimeout); timers.clear(); }
    function pollReview() {
      cancelPolling();
      [3000, 10000, 25000].forEach(delay => {
        const timer = setTimeout(() => { timers.delete(timer); if (!signal.aborted) load(); }, delay);
        timers.add(timer);
      });
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
      if (item.parentId) card.dataset.parentId = item.parentId;
      const header = element('div', undefined, 'nuo-comment-header');
      header.append(avatar(item.author.name, item.author.avatar));
      header.append(element('strong', item.author.name));
      const date = element('time', new Date(item.createdAt * 1000).toLocaleString('zh-CN'));
      date.dateTime = new Date(item.createdAt * 1000).toISOString(); header.append(date);
      if (host.dataset.thread && item.floor) header.append(element('span', item.floor + ' 楼', 'nuo-comment-floor'));
      if (item.state === 'pending') header.append(element('span', '待审核', 'nuo-comment-badge'));
      if (adminPage) {
        const threadLink = element('a', item.thread, 'nuo-comment-thread');
        threadLink.href = /^\/discuss\/[a-f0-9-]{36}$/.test(item.thread) ? '/discuss/?id=' + item.thread.split('/').pop() : item.thread;
        header.append(threadLink);
      }
      card.append(header);
      if (item.parentId) card.append(element('small', item.parentFloor ? '回复 ' + item.parentFloor + ' 楼' : '回复 #' + item.parentId));
      card.append(element('p', item.state === 'deleted' ? '这条评论已删除。' : item.body, 'nuo-comment-body'));
      if (adminPage && item.moderation) {
        const labels = { queued: 'AI 审核中', approved: 'AI 已放行', review: '需人工判断', error: 'AI 暂不可用', limited: '今日额度已用完', disabled: '人工审核', skipped: '免审核', manual: '已人工处理' };
        const review = element('div', undefined, 'nuo-comment-ai');
        review.dataset.aiStatus = item.moderation.status;
        review.append(element('strong', labels[item.moderation.status] || '人工审核'));
        review.append(element('span', item.moderation.reason || (item.moderation.status === 'queued' ? '稍后刷新查看结果' : '由管理员处理')));
        if (typeof item.moderation.confidence === 'number') {
          review.append(element('span', '置信度 ' + Math.round(item.moderation.confidence * 100) + '%', 'nuo-comment-confidence'));
        }
        card.append(review);
      }
      const actions = element('div', undefined, 'nuo-comment-actions');
      if (!adminPage && host.dataset.thread && item.state === 'published') {
        const like = action('', async () => {
          if (!clerk?.isSignedIn) { await login.onclick(); return; }
          if (!me || me.id !== clerk.user.id) throw new Error('正在切换账号，请稍后再试');
          const result = await request('/v1/comments/' + item.id + '/like', { method: item.liked ? 'DELETE' : 'POST' });
          if (signal.aborted) return;
          item.likes = result.likes; item.liked = result.liked; updateLike();
        });
        const updateLike = () => { like.textContent = (item.liked ? '♥ 已赞 ' : '♡ 赞 ') + (item.likes || 0); like.setAttribute('aria-pressed', String(!!item.liked)); };
        like.dataset.commentLike = item.id; updateLike(); actions.append(like);
      }
      if (!adminPage && clerk?.isSignedIn && !item.parentId && item.state === 'published') {
        actions.append(action('回复', () => {
          parentId = item.id;
          const notice = query('[data-comments-reply]');
          query('[data-comments-reply-box]').hidden = false;
          notice.textContent = '正在回复 ' + (host.dataset.thread && item.floor ? item.floor + ' 楼的 ' : '') + item.author.name;
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
        if (item.state === 'pending' && me.moderation?.configured) actions.append(action('AI 复审', async () => {
          await request('/v1/comments/' + item.id + '/moderate', { method: 'POST' });
          await load(); pollReview();
        }));
      }
      if (item.canDelete) actions.append(action('删除', async () => {
        if (!confirm('确定删除这条评论？')) return;
        await request('/v1/comments/' + item.id, { method: 'DELETE' });
        await load();
      }));
      if (item.ipLocation && item.state !== 'deleted') {
        const location = element('span', 'IP 属地：' + item.ipLocation, 'nuo-comment-location');
        location.title = '发布这条评论时的网络属地';
        actions.append(location);
      }
      if (actions.childNodes.length) card.append(actions);
      return card;
    }
    // The queue now states why a call failed; this button repeats the same call on
    // demand so the Worker side of the chain can be checked without posting a comment.
    function diagnosisText(result) {
      if (!result.configured) return 'Worker 没有绑定 DEEPSEEK_API_KEY，自动审核不会运行。';
      const models = result.models || {};
      const lines = ['模型：' + result.model];
      if (result.keyHasWhitespace) lines.push('密钥含空白字符，请求头会非法，请在 Cloudflare 重新保存。');
      lines.push(models.error
        ? '密钥检查失败：' + models.error
        : '密钥可用（HTTP ' + models.status + '，' + models.ms + ' ms），可用模型：' + (models.models.length ? models.models.join('、') : '暂无可用模型'));
      if (!models.error && !models.hasModel) lines.push('当前模型 ' + result.model + ' 不在可用列表中。');
      if (result.chat) lines.push(result.chat.ok
        ? '完整调用成功（' + result.chat.ms + ' ms，判定 ' + result.chat.decision + '）。'
        : '完整调用失败：' + result.chat.error);
      return lines.join('\n');
    }
    async function runDiagnosis() {
      if (!me?.admin) { message(new Error('请先用管理员账号登录。')); return; }
      if (!diagnose || !diagnosis) return;
      diagnose.disabled = true;
      diagnosis.hidden = false;
      diagnosis.textContent = '正在检查 DeepSeek 调用链路，会消耗一次调用…';
      try {
        diagnosis.textContent = diagnosisText(await request('/v1/admin/diagnostics', { method: 'POST', body: { chat: true } }));
      } catch (error) {
        diagnosis.textContent = error?.message || '检查失败，请稍后重试。';
      } finally { if (!signal.aborted) diagnose.disabled = false; }
    }
    function cancelReply() {
      parentId = null;
      query('[data-comments-reply-box]').hidden = true;
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
        const count = query('[data-comments-count]');
        if (count) { count.textContent = list.childNodes.length + (next ? '+' : ''); count.setAttribute('aria-label', '已加载 ' + list.childNodes.length + ' 条评论'); }
        status.textContent = list.childNodes.length ? '' : (adminPage ? '这个分类暂无评论。' : host.dataset.thread ? '还没有回复，来接着聊聊吧。' : '还没有评论，来聊聊吧。');
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
        const name = me ? (clerk.user.fullName || clerk.user.username || '读者') : '访客';
        if (identityLabel) identityLabel.textContent = me ? name : '登录后加入讨论';
        const identityHint = query('[data-comments-identity-hint]');
        if (identityHint) identityHint.textContent = me ? '以这个身份参与讨论' : '用你的账号，留下一点想法。';
        const face = query('[data-comments-avatar]');
        if (face) { const node = avatar(name, me ? clerk.user.imageUrl : ''); node.setAttribute('data-comments-avatar', ''); face.replaceWith(node); }
        const service = query('[data-comments-service]');
        if (service) service.textContent = me?.admin
          ? (me.moderation?.configured ? 'DeepSeek 辅助审核已启用 · 每日最多 ' + me.moderation.dailyLimit + ' 次，不确定的评论保留在此。' : 'DeepSeek 尚未配置，当前使用人工审核。')
          : '仅管理员可查看审核队列。';
        const adminLink = query('[data-comments-admin-link]');
        if (diagnose) diagnose.hidden = !me?.admin;
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
            if (input) { input.value = ''; counter(); }
            cancelPolling();
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
        await clerk.openSignIn({ withSignUp: true, forceRedirectUrl: location.origin + location.pathname + location.search,
          signUpForceRedirectUrl: location.origin + location.pathname + location.search });
      } catch (error) { message(error); }
      finally { login.disabled = false; }
    };
    if (form) {
      input.addEventListener('input', counter, { signal });
      query('[data-comments-cancel]').onclick = cancelReply;
      more.onclick = () => load(true);
      form.onsubmit = async event => {
        event.preventDefault();
        const body = input.value.trim();
        if (!me || !body || submit.disabled) return;
        const authorId = me.id;
        submit.disabled = true;
        try {
          await request('/v1/comments', { method: 'POST', body: {
            thread, parentId, body, name: clerk.user.fullName || clerk.user.username || '读者', avatar: clerk.user.imageUrl || ''
          } });
          if (signal.aborted || me?.id !== authorId) return;
          if (input.value.trim() === body) { input.value = ''; counter(); }
          cancelReply();
          await load();
          status.textContent = me.admin ? '评论已发布。' : '已提交，正在审核。通过后会自动显示。';
          if (!me.admin) pollReview();
        } catch (error) { message(error); }
        finally { if (!signal.aborted) submit.disabled = !me; }
      };
    }
    if (filter) {
      filter.onchange = () => {
        host.querySelectorAll('[data-comments-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.commentsTab === filter.value)));
        load();
      };
      host.querySelectorAll('[data-comments-tab]').forEach(button => {
        button.onclick = () => { filter.value = button.dataset.commentsTab; filter.onchange(); };
      });
      query('[data-comments-refresh]').onclick = () => load();
    }
    if (diagnose) diagnose.onclick = () => { runDiagnosis(); };
    if (adminPage || !('IntersectionObserver' in window)) start();
    else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start(); }
      }, { rootMargin: '200px' });
      observer.observe(host);
    }
    dispose = () => { controller.abort(); observer?.disconnect(); unsubscribe?.(); cancelPolling(); };
  }
  document.addEventListener('pjax:send', () => { if (dispose) dispose(); dispose = null; });
  document.addEventListener('pjax:complete', boot);
  document.addEventListener('nuo:comments-mount', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
