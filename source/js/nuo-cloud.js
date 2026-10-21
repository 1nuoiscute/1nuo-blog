(function () {
  'use strict';
  if (window.NuoCloud) return;
  try { if (window.parent !== window && window.parent.NuoCloud) { window.NuoCloud = window.parent.NuoCloud; return; } } catch { /* standalone in a foreign frame */ }
  const API = 'https://comments.1nuo.me';
  const BOOKMARKS = 'nuo:bookmarks:v1', READING = 'nuo:reading:v1';
  let clerk, user = null, cache = empty(), generation = 0, syncing = false, syncTimer, started = false;
  let status = 'loading', detail = '', settleReady, ownerReady = Promise.resolve();
  const ready = new Promise(resolve => { settleReady = resolve; });
  const subscribers = new Set();
  function empty() { return { records: {}, pending: {}, clock: 0 }; }
  function get(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } }
  function put(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* memory cache remains usable */ } }
  function keyFor(id) { return 'nuo:cloud:v1:' + id; }
  function recordKey(item) { return item.slot + '\t' + item.path; }
  function newer(a, b) { return !b || a.changedAt > b.changedAt || (a.changedAt === b.changedAt && a.changeId > b.changeId); }
  function persist() { if (user) put(keyFor(user.id), cache); }
  function hasLocal() { return Object.keys(get(BOOKMARKS, {})).length > 0 || Object.keys(get(READING, {})).length > 0; }
  function state() { return { user, status, detail, pending: Object.keys(cache.pending).length, importAvailable: !!user && hasLocal() }; }
  function emit(dataChanged) {
    renderControls(); subscribers.forEach(fn => fn(state()));
    if (dataChanged) document.dispatchEvent(new Event('nuo:library-change'));
  }
  async function request(path, options = {}) {
    const actorId = user?.id, epoch = generation;
    const headers = options.body ? { 'Content-Type': 'application/json' } : {};
    if (actorId) {
      if (clerk?.user?.id !== actorId) throw new Error('账号已切换，请重试');
      const token = await clerk.session.getToken();
      if (generation !== epoch || clerk?.user?.id !== actorId) throw new Error('账号已切换，请重试');
      if (!token) throw new Error('登录已失效，请重新登录');
      headers.Authorization = 'Bearer ' + token;
    }
    const response = await fetch(API + path, { method: options.method || 'GET', headers, credentials: 'omit',
      signal: AbortSignal.timeout(10000), ...(options.body ? { body: JSON.stringify(options.body) } : {}) });
    if (generation !== epoch) throw new Error('账号已切换，请重试');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '账号数据暂时连接不上');
    return data;
  }
  function valid(item) {
    return item && ['bookmark', 'progress', 'read'].includes(item.slot) && typeof item.path === 'string' &&
      item.path.startsWith('/') && !item.path.startsWith('//') && !/[?#\\]/.test(item.path) &&
      Number.isFinite(item.changedAt) && typeof item.changeId === 'string';
  }
  function merge(items) {
    let changed = false;
    for (const item of items || []) {
      if (!valid(item)) continue;
      cache.clock = Math.max(cache.clock, item.changedAt);
      const key = recordKey(item);
      if (newer(item, cache.records[key])) { cache.records[key] = item; changed = true; }
    }
    return changed;
  }
  function enqueue(slot, path, value, timestamp) {
    if (!user) return;
    try {
      const url = new URL(path, location.origin);
      if (url.origin !== location.origin || /[?#\\]/.test(path)) return;
      path = url.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
    } catch { return; }
    const item = { slot, path, value, changedAt: timestamp ?? Math.max(Date.now(), cache.clock + 1), changeId: crypto.randomUUID() };
    cache.clock = Math.max(cache.clock, item.changedAt);
    const key = recordKey(item); cache.records[key] = item; cache.pending[key] = item;
  }
  function schedule() { clearTimeout(syncTimer); if (user) syncTimer = setTimeout(sync, 6000); }
  async function sync() {
    if (!user || syncing) return;
    const epoch = generation;
    syncing = true; status = 'syncing'; detail = ''; emit(false);
    try {
      // Pull first: tombstones and individual read/progress fields survive stale devices.
      const remote = await request('/v1/library');
      if (epoch !== generation) return;
      merge(remote.items);
      for (let batch = 0; batch < 100 && Object.keys(cache.pending).length; batch++) {
        const sent = Object.values(cache.pending).slice(0, 5);
        const result = await request('/v1/library', { method: 'POST', body: { changes: sent } });
        if (epoch !== generation) return;
        for (const item of result.items || []) {
          if (!valid(item)) continue;
          const key = recordKey(item), pending = cache.pending[key];
          if (pending && sent.some(value => recordKey(value) === key && value.changeId === pending.changeId)) {
            delete cache.pending[key];
            // Use the server's canonical timestamp when it clamps an incorrect clock.
            cache.records[key] = item;
          } else if (newer(item, cache.records[key])) cache.records[key] = item;
        }
        persist();
      }
      status = Object.keys(cache.pending).length ? 'syncing' : 'synced';
      if (Object.keys(cache.pending).length) schedule();
    } catch (error) {
      if (epoch !== generation) return;
      status = 'offline'; detail = error.message || '同步失败，记录已保存在此设备';
    } finally {
      if (epoch === generation) { syncing = false; persist(); emit(true); }
    }
  }
  function materialize(key) {
    const result = {};
    for (const item of Object.values(cache.records)) {
      if (!valid(item) || !item.value || typeof item.value.title !== 'string') continue;
      const value = item.value, info = { path: item.path, url: location.origin + item.path, title: value.title, kind: value.kind || '页面' };
      if (key === BOOKMARKS && item.slot === 'bookmark') result[item.path] = { ...info, savedAt: item.changedAt };
      if (key === READING && ['progress', 'read'].includes(item.slot)) {
        const row = result[item.path] || info;
        if (item.slot === 'progress') row.progress = value.progress;
        else row.read = value.read;
        row.updatedAt = Math.max(row.updatedAt || 0, item.changedAt); result[item.path] = row;
      }
    }
    return result;
  }
  function read(key, fallback) { return user ? materialize(key) : get(key, fallback); }
  function write(key, value) {
    if (!user) { put(key, value); return; }
    const previous = materialize(key);
    for (const path of new Set([...Object.keys(previous), ...Object.keys(value)])) {
      const before = previous[path], after = value[path];
      if (key === BOOKMARKS) {
        if (!!before !== !!after || (after && before?.title !== after.title)) enqueue('bookmark', path, after ? metadata(after) : null);
      } else if (after) {
        if (typeof after.progress === 'number' && (!before || Math.abs((before.progress ?? -1) - after.progress) >= .005)) enqueue('progress', path, { ...metadata(after), progress: after.progress });
        if (typeof after.read === 'boolean' && before?.read !== after.read) enqueue('read', path, { ...metadata(after), read: after.read });
      }
    }
    persist(); schedule(); emit(false);
  }
  function metadata(value) { return { title: String(value.title || value.path || '未命名').slice(0, 200), kind: value.kind || '页面' }; }
  async function importLocal() {
    if (!user) return;
    const epoch = generation;
    await sync();
    if (epoch !== generation || status === 'offline') return;
    for (const [path, item] of Object.entries(get(BOOKMARKS, {}))) {
      if (!cache.records['bookmark\t' + path]) enqueue('bookmark', path, metadata(item), Number(item.savedAt) || 0);
    }
    for (const [path, item] of Object.entries(get(READING, {}))) {
      if (typeof item.progress === 'number' && !cache.records['progress\t' + path]) enqueue('progress', path, { ...metadata(item), progress: item.progress }, Number(item.updatedAt) || 0);
      if (typeof item.read === 'boolean' && !cache.records['read\t' + path]) enqueue('read', path, { ...metadata(item), read: item.read }, Number(item.updatedAt) || 0);
    }
    persist(); await sync();
  }
  function setUser(next) {
    if ((user?.id || null) === (next?.id || null)) {
      if (next && user && (user.name !== (next.fullName || next.username || '读者') || user.avatar !== (next.imageUrl || ''))) {
        user = { id: next.id, name: next.fullName || next.username || '读者', avatar: next.imageUrl || '' }; emit(false);
      }
      return ownerReady;
    }
    // Flush the old scope's pending reading position before swapping its cache.
    document.dispatchEvent(new Event('nuo:account-before-change'));
    generation++; clearTimeout(syncTimer); syncing = false;
    const epoch = generation;
    user = next ? { id: next.id, name: next.fullName || next.username || '读者', avatar: next.imageUrl || '' } : null;
    cache = user ? get(keyFor(user.id), empty()) : empty();
    if (!cache.records || !cache.pending) cache = empty();
    status = user ? 'syncing' : 'local'; detail = '';
    ownerReady = (async () => {
      if (user) await sync();
      if (epoch !== generation) return;
      emit(true); document.dispatchEvent(new Event('nuo:account-change'));
    })();
    return ownerReady;
  }
  async function start() {
    if (started) return ready;
    started = true;
    const fallback = setTimeout(() => { if (!user) { status = 'local'; detail = '账号连接较慢，暂用本地记录'; } settleReady(); emit(false); }, 8000);
    try {
      clerk = await window.NuoAuth.getClerk();
      if (clerk) {
        await setUser(clerk.user);
        clerk.addListener(() => { setUser(clerk.user); });
        await setUser(clerk.user);
      }
      if (!user) status = 'local';
    } catch { status = 'local'; detail = '账号服务暂时连接不上，暂用本地记录'; }
    finally { clearTimeout(fallback); settleReady(); emit(false); }
    return ready;
  }
  async function login() {
    clerk = await window.NuoAuth.getClerk();
    if (!clerk) throw new Error('账号服务尚未开放');
    return clerk.openSignIn({ withSignUp: true, forceRedirectUrl: location.origin + location.pathname, signUpForceRedirectUrl: location.origin + location.pathname });
  }
  function renderControls() {
    const text = !user ? (detail || '未登录，记录保存在此设备。登录后可跨设备同步。') :
      status === 'offline' ? detail + '；记录已保存在此设备，联网后重试。' : status === 'syncing' ? '正在同步 ' + user.name + ' 的书架…' : '已同步到 ' + user.name + ' 的账号';
    document.querySelectorAll('[data-cloud-status]').forEach(node => { node.textContent = text; });
    document.querySelectorAll('[data-cloud-login]').forEach(node => { node.hidden = !!user; });
    document.querySelectorAll('[data-cloud-sync]').forEach(node => { node.hidden = !user; node.disabled = syncing; });
    document.querySelectorAll('[data-cloud-import]').forEach(node => { node.hidden = !user || !hasLocal(); node.disabled = syncing; });
  }
  window.NuoCloud = { ready: () => { start(); return ready; }, state, request, login, sync, read, write,
    handles: key => key === BOOKMARKS || key === READING,
    storageKey: key => user ? key + ':' + user.id : key,
    subscribe(fn) { subscribers.add(fn); fn(state()); return () => subscribers.delete(fn); } };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-cloud-login], [data-cloud-sync], [data-cloud-import]');
    if (!button) return;
    const task = button.hasAttribute('data-cloud-login') ? login() : button.hasAttribute('data-cloud-import') ? importLocal() : sync();
    task.catch(error => { detail = error.message; status = 'offline'; emit(false); });
  });
  document.addEventListener('pjax:complete', renderControls);
  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', () => { if (user) sync(); });
  window.addEventListener('pagehide', () => { persist(); if (user) sync(); });
  window.addEventListener('pageshow', event => { if (event.persisted && user) sync(); });
  window.addEventListener('storage', event => {
    if (!user || event.key !== keyFor(user.id)) return;
    const other = get(event.key, empty()); merge(Object.values(other.records || {}));
    for (const item of Object.values(other.pending || {})) {
      if (!valid(item)) continue;
      const key = recordKey(item);
      if (newer(item, cache.pending[key])) cache.pending[key] = item;
    }
    emit(true); schedule();
  });
  setInterval(() => { if (!document.hidden && user) sync(); }, 60000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
