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
    await loadScript('/js/clerk-zh-cn.js?v=4.23.0');
    await loadScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, key);
    clerk = window.Clerk;
    await clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor },
      signInUrl: '/account/',
      signInFallbackRedirectUrl: '/account/',
      signUpFallbackRedirectUrl: '/account/',
      localization: {
        ...window.__NUO_CLERK_ZH_CN__,
        signIn: {
          ...window.__NUO_CLERK_ZH_CN__.signIn,
          start: {
            ...window.__NUO_CLERK_ZH_CN__.signIn.start,
            title: '登录 1nuo', titleCombined: '登录或注册',
            subtitle: '使用邮箱或关联账号继续'
          }
        }
      },
      appearance: {
        variables: {
          colorPrimary: 'var(--account-accent)', colorPrimaryForeground: 'var(--account-surface)',
          colorForeground: 'var(--account-ink)', colorMutedForeground: 'var(--account-muted)',
          colorBackground: 'var(--account-surface)', colorInput: 'var(--account-surface)',
          colorInputForeground: 'var(--account-ink)', colorMuted: 'var(--account-tint)',
          colorBorder: 'var(--account-line)', colorRing: 'var(--account-accent)',
          fontFamily: 'inherit', fontFamilyButtons: 'inherit', fontSize: '14px', borderRadius: '0.5625rem'
        },
        elements: {
          rootBox: 'nuo-clerk-root', cardBox: 'nuo-clerk-box', card: 'nuo-clerk-card',
          headerTitle: 'nuo-clerk-title', headerSubtitle: 'nuo-clerk-subtitle',
          navbar: 'nuo-clerk-nav', navbarButton: 'nuo-clerk-nav-button',
          pageScrollBox: 'nuo-clerk-main', footer: 'nuo-clerk-footer',
          formFieldInput: 'nuo-clerk-input', formButtonPrimary: 'nuo-clerk-primary',
          socialButtonsBlockButton: 'nuo-clerk-social'
        }
      }
    });
    return clerk;
  }

  function getClerk() {
    if (!loading) loading = initClerk().catch(error => { loading = null; throw error; });
    return loading;
  }

  // Other first-party features reuse this instance and its verified session.
  // Loading remains demand-driven: ordinary reading never starts Clerk here.
  window.NuoAuth = { getClerk };

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
    page.dataset.accountView = 'loading';
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
        page.dataset.accountView = signedIn ? 'profile' : 'signin';
        status.textContent = '';
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
