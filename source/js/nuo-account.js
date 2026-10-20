(function () {
  'use strict';
  if (window.__nuoAccountBooted) return;
  window.__nuoAccountBooted = true;

  let loading;
  let clerk;
  let mounted;
  let unsubscribe;
  let generation = 0;
  const scripts = new Map();

  function loadScript(src, key) {
    if (scripts.has(src)) return scripts.get(src);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      if (key) {
        script.crossOrigin = 'anonymous';
        script.setAttribute('data-clerk-publishable-key', key);
      }
      const timer = setTimeout(() => finish(new Error('Script timed out')), 20000);
      function finish(error) {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) {
          script.remove();
          scripts.delete(src);
          reject(error);
        } else resolve();
      }
      script.onload = () => finish();
      script.onerror = () => finish(new Error('Script unavailable'));
      document.head.appendChild(script);
    });
    scripts.set(src, promise);
    return promise;
  }

  async function initClerk() {
    if (!window.__NUO_CLERK__) await loadScript('/js/clerk-config.js');
    const key = window.__NUO_CLERK__ && window.__NUO_CLERK__.publishableKey;
    if (!key) return null;
    if (!/^pk_(test|live)_[A-Za-z0-9+/=-]+$/.test(key)) throw new Error('Invalid public config');
    const domain = atob(key.split('_')[2]).replace(/\$$/, '');
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/i.test(domain)) throw new Error('Invalid Clerk domain');
    await loadScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, key);
    clerk = window.Clerk;
    await clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor },
      signInUrl: '/account/',
      signInFallbackRedirectUrl: '/account/',
      signUpFallbackRedirectUrl: '/account/',
      // Clerk merges these common Chinese labels with its default translations.
      localization: {
        locale: 'zh-CN',
        formButtonPrimary: '继续',
        formFieldLabel__emailAddress: '邮箱地址',
        formFieldLabel__password: '密码',
        formFieldLabel__username: '用户名',
        dividerText: '或',
        socialButtonsBlockButton: '使用 {{provider|titleize}} 继续',
        signIn: { start: { title: '登录 1nuo', subtitle: '欢迎回来，继续逛逛数字花园', actionText: '还没有账号？', actionLink: '注册' } },
        signUp: { start: { title: '注册 1nuo', subtitle: '创建你的账号', actionText: '已有账号？', actionLink: '登录' } }
      },
      appearance: { variables: { colorPrimary: '#ae4778', borderRadius: '0.75rem' } }
    });
    return clerk;
  }

  function getClerk() {
    if (!loading) loading = initClerk().catch(error => { loading = null; throw error; });
    return loading;
  }

  function unmountWidget() {
    if (!mounted) return;
    const previous = mounted;
    mounted = null;
    if (previous.signedIn) clerk.unmountUserProfile(previous.node);
    else clerk.unmountSignIn(previous.node);
  }

  function cleanup() {
    generation++;
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    unmountWidget();
  }

  async function boot() {
    const page = document.querySelector('[data-nuo-account]');
    if (!page) return;
    cleanup();
    const current = generation;
    const status = page.querySelector('[data-account-status]');
    const retry = page.querySelector('[data-account-retry]');
    const signout = page.querySelector('[data-account-signout]');
    const widget = page.querySelector('[data-account-widget]');
    retry.hidden = true;
    retry.onclick = boot;
    status.textContent = '正在准备账号服务…';
    try {
      const instance = await getClerk();
      if (current !== generation || !page.isConnected) return;
      if (!instance) {
        status.textContent = '账号功能即将开放，暂时还不能注册或登录。欢迎先逛逛博客。';
        return;
      }
      function render() {
        if (current !== generation || !page.isConnected) return;
        const signedIn = !!instance.isSignedIn;
        if (mounted && mounted.node === widget && mounted.signedIn === signedIn) return;
        unmountWidget();
        status.textContent = signedIn ? '已登录 · 在下方管理个人资料和账号安全。' : '注册 / 登录';
        signout.hidden = !signedIn;
        if (signedIn) instance.mountUserProfile(widget, { routing: 'hash' });
        else instance.mountSignIn(widget, {
          routing: 'hash', withSignUp: true,
          forceRedirectUrl: '/account/', signUpForceRedirectUrl: '/account/'
        });
        mounted = { node: widget, signedIn };
      }
      render();
      unsubscribe = instance.addListener(render);
      signout.onclick = async () => {
        signout.disabled = true;
        try { await instance.signOut({ redirectUrl: '/account/' }); }
        catch { status.textContent = '退出失败，请重试。'; }
        finally { signout.disabled = false; }
      };
    } catch {
      if (current !== generation || !page.isConnected) return;
      status.textContent = '账号服务暂时连接不上，请检查网络后重试。';
      retry.hidden = false;
    }
  }

  document.addEventListener('pjax:send', cleanup);
  document.addEventListener('pjax:complete', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
