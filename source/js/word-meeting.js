(function () {
  'use strict';
  const root = document.querySelector('[data-word-meeting]');
  if (!root) return;
  const $ = selector => root.querySelector(selector), show = (node, value) => { node.hidden = !value; };
  const fields = $('[data-lobby-form]'), input = $('#wm-word'), api = root.dataset.api;
  const normalize = word => word.normalize('NFKC').replace(/\s/gu, '').toLowerCase();
  const storage = { get(key) { try { return sessionStorage.getItem('words:' + key); } catch { return null; } }, set(key, value) { try { sessionStorage.setItem('words:' + key, value); } catch { /* Game still works for this page. */ } }, remove(key) { try { sessionStorage.removeItem('words:' + key); } catch { /* No persistent state. */ } } };
  const codePattern = /^[A-HJ-NP-Z2-9]{8}$/;
  let mode = 'online', state = null, token = null, busy = false, timer, pollBusy = false, generation = 0, handoff = false, lastRound = null, signature = '', stopped = false;
  const controllers = new Set();
  function message(text, error) { $('[data-message]').textContent = text || ''; $('[data-message]').dataset.error = String(!!error); }
  function newToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join(''); }
  function saveLocal() { storage.set('local', JSON.stringify({ state, handoff })); storage.set('resume', 'local'); }
  function chooseMode(next) {
    mode = next;
    root.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    show($('[data-online-fields]'), mode === 'online'); show($('[data-local-name]'), mode === 'local'); show($('[data-local-start]'), mode === 'local');
  }
  async function request(path, body, memberToken) {
    const controller = new AbortController(); controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(api + '/v1/word-meeting/rooms' + path, {
        method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(memberToken ? { Authorization: 'Bearer ' + memberToken } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal, cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok) { const error = new Error(data.error || '暂时连接不上，请重试'); error.status = response.status; throw error; }
      return data;
    } catch (error) {
      if (!error.status) throw new Error('暂时连接不上，输入已保留。请检查网络后重试。');
      throw error;
    } finally { clearTimeout(timeout); controllers.delete(controller); }
  }
  function stopPolling() { clearTimeout(timer); }
  function schedule() {
    stopPolling();
    if (!stopped && mode === 'online' && state && !['matched', 'closed'].includes(state.phase) && !document.hidden) timer = setTimeout(refresh, 2500);
  }
  function apply(next, expected) {
    if (expected !== generation || stopped) return;
    if (state && next.code === state.code && next.version < state.version) return;
    const nextSignature = JSON.stringify(next);
    if (nextSignature !== signature) { signature = nextSignature; state = next; render(); }
    schedule();
  }
  async function refresh() {
    if (pollBusy || busy || !state || mode !== 'online' || document.hidden || stopped) { schedule(); return; }
    pollBusy = true; const expected = generation, code = state.code, secret = token;
    try { const next = await request('/' + code, null, secret); apply(next, expected); if (expected === generation) message(''); }
    catch (error) { if (expected === generation && !stopped) { message(error.message + (error.status ? '' : ' 正在自动重连。'), true); if ([401, 403, 404].includes(error.status)) { stopPolling(); state.phase = 'closed'; storage.remove('resume'); render(); } } }
    finally { pollBusy = false; if (expected === generation) schedule(); }
  }
  async function perform(action) {
    if (busy) return;
    busy = true; stopPolling(); message('');
    root.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try { await action(); }
    catch (error) { message(error.message || '操作没有完成，请重试', true); if (error.status === 409 && state && mode === 'online') { try { apply(await request('/' + state.code, null, token), generation); } catch { /* Keep the action error and user's draft. */ } } }
    finally { busy = false; root.querySelectorAll('button').forEach(button => { button.disabled = false; }); if (state) render(); schedule(); }
  }
  function localView() {
    const revealed = !!state.secretWords.a && !!state.secretWords.b;
    return { ...state, words: revealed ? state.secretWords : null, submitted: { a: !!state.secretWords.a, b: !!state.secretWords.b }, ready: { a: false, b: false } };
  }
  function render() {
    show($('[data-lobby]'), !state); show($('[data-game]'), !!state);
    if (!state) return;
    const view = mode === 'local' ? localView() : state, phase = view.phase, you = view.you, other = you === 'a' ? 'b' : 'a';
    $('[data-game]').dataset.matched = String(phase === 'matched');
    $('[data-room-label]').textContent = mode === 'local' ? '同屏轮流玩' : '房间 ' + view.code;
    show($('[data-invite]'), phase === 'waiting'); $('[data-room-code]').textContent = view.code || '';
    show($('[data-round-view]'), phase !== 'waiting' && !handoff);
    show($('[data-handoff]'), handoff); $('[data-handoff-title]').textContent = '请把设备交给 ' + view.players.b;
    show($('[data-history-wrap]'), !!view.history.length && !handoff);
    $('[data-round]').textContent = '第 ' + view.round + ' 轮';
    const title = phase === 'matched' ? '你们的词，成功相遇了。' : phase === 'closed' ? '这局已结束' : phase === 'revealed' ? '还差一点，再靠近一些。' : '这一次，你会想到什么？';
    $('[data-headline]').textContent = title;
    const instructions = phase === 'matched' ? '在第 ' + view.round + ' 轮，你们想到了同一个词。' : phase === 'closed' ? '可以保存已经揭晓的记录，或再来一局。' : phase === 'revealed' ? '记住这两个词，下一轮找它们之间的联系。' : view.round === 1 ? '随意想一个词，先别让对方知道。' : '想一个与上一轮两个词都有联系的新词。';
    $('[data-instruction]').textContent = instructions;
    for (const player of ['a', 'b']) {
      $('[data-player-' + player + ']').textContent = view.players[player] + (mode === 'online' && player === you ? ' · 你' : '');
      $('[data-word-' + player + ']').textContent = view.words ? view.words[player] : '···';
      $('[data-status-' + player + ']').textContent = view.words ? (phase === 'matched' ? '想到一起' : '已揭晓') : view.submitted[player] ? '已锁定，等待揭晓' : '正在想词';
    }
    const previous = view.history.find(row => row.round === view.round - 1);
    show($('[data-reference]'), !!previous && phase === 'thinking');
    $('[data-reference-words]').textContent = previous ? previous.a + ' / ' + previous.b : '';
    const canInput = phase === 'thinking' && !view.submitted[you] && !handoff;
    show($('[data-word-form]'), canInput);
    $('[data-word-label]').textContent = mode === 'local' ? view.players[you] + '，写下你的联想' : '你的联想';
    if (lastRound !== view.round) { input.value = ''; lastRound = view.round; }
    show($('[data-next]'), phase === 'revealed' && !view.ready[you]);
    $('[data-next]').textContent = mode === 'local' ? '继续下一轮' : '准备好，继续联想';
    show($('[data-waiting]'), (phase === 'thinking' && view.submitted[you]) || (phase === 'revealed' && view.ready[you]));
    $('[data-waiting]').textContent = phase === 'revealed' ? '你已准备好，等 ' + view.players[other] + ' 一起继续。' : '你的词已锁定，等 ' + view.players[other] + ' 提交后一起揭晓。';
    show($('[data-result-actions]'), phase === 'matched' || phase === 'closed');
    $('[data-replay]').textContent = mode === 'local' ? '再来一局' : '再建一间房';
    $('[data-save]').disabled = !view.history.length;
    $('[data-history-count]').textContent = view.history.length + ' 轮已揭晓';
    const list = $('[data-history]'); list.replaceChildren();
    view.history.forEach(row => { const li = document.createElement('li'); li.dataset.match = String(row.matched); [ '第' + row.round + '轮', row.a, row.b, row.matched ? '相遇' : '未遇' ].forEach(text => { const span = document.createElement('span'); span.textContent = text; li.append(span); }); list.append(li); });
  }
  function enter(next, secret) {
    generation++; stopped = false; token = secret; state = next; handoff = false; signature = ''; lastRound = null; input.value = '';
    storage.set('token:' + state.code, token); storage.set('resume', state.code);
    const url = new URL(location.href); url.searchParams.set('room', state.code); history.replaceState(null, '', url);
    render(); schedule();
  }
  function startLocal() {
    generation++; stopPolling(); handoff = false; lastRound = null; input.value = '';
    state = { code: '', phase: 'thinking', round: 1, you: 'a', players: { a: fields.elements.name.value.trim() || '玩家1', b: fields.elements.partner.value.trim() || '玩家2' }, secretWords: { a: '', b: '' }, history: [], version: 1 };
    const url = new URL(location.href); url.searchParams.delete('room'); history.replaceState(null, '', url); saveLocal(); render();
  }
  root.querySelectorAll('[data-mode]').forEach(button => { button.onclick = () => { chooseMode(button.dataset.mode); message(''); }; });
  fields.addEventListener('submit', event => {
    event.preventDefault(); const action = event.submitter?.value || (mode === 'local' ? 'local' : fields.elements.code.value.trim() ? 'join' : 'create');
    perform(async () => {
      if (action === 'local') { chooseMode('local'); startLocal(); return; }
      const code = fields.elements.code.value.trim().toUpperCase(), name = fields.elements.name.value.trim();
      if (action === 'join' && !codePattern.test(code)) throw new Error('请输入完整的8位房间码');
      // Save join credentials before sending, so a lost response can be retried with the same identity.
      const secret = action === 'join' ? storage.get('token:' + code) || newToken() : newToken();
      if (action === 'join') storage.set('token:' + code, secret);
      const next = await request(action === 'join' ? '/' + code + '/join' : '', { name, token: secret }); enter(next, secret);
    });
  });
  $('[data-word-form]').addEventListener('submit', event => {
    event.preventDefault(); if (event.isComposing) return;
    perform(async () => {
      const word = input.value.trim();
      if (!word || Array.from(word).length > 32 || /[\p{Cc}\p{Cf}]/u.test(word)) throw new Error('请填写1至32个字的词语');
      if (mode === 'online') { const expected = generation; const next = await request('/' + state.code + '/submit', { round: state.round, word }, token); apply(next, expected); input.value = ''; }
      else {
        state.secretWords[state.you] = word; input.value = '';
        if (state.you === 'a') handoff = true;
        else { const matched = normalize(state.secretWords.a) === normalize(state.secretWords.b); state.phase = matched ? 'matched' : 'revealed'; state.history.push({ round: state.round, ...state.secretWords, matched }); }
        state.version++; saveLocal(); render();
      }
    });
  });
  $('[data-handoff-continue]').onclick = () => { state.you = 'b'; handoff = false; saveLocal(); render(); input.focus(); };
  $('[data-next]').onclick = () => perform(async () => {
    if (mode === 'online') apply(await request('/' + state.code + '/next', { round: state.round }, token), generation);
    else { state.round++; state.phase = 'thinking'; state.you = 'a'; state.secretWords = { a: '', b: '' }; state.version++; saveLocal(); render(); input.focus(); }
  });
  $('[data-copy]').onclick = async () => {
    const url = new URL(location.pathname, location.origin); url.searchParams.set('room', state.code);
    try { await navigator.clipboard.writeText(url.href); message('邀请链接已复制，发给朋友就能加入。'); }
    catch { message('复制不可用，请把房间码 ' + state.code + ' 发给朋友。'); }
  };
  $('[data-exit]').onclick = () => {
    if (state.phase !== 'matched' && state.phase !== 'closed' && !confirm('结束这局？对方也会看到本局已结束。')) return;
    perform(async () => {
      if (mode === 'online' && !['closed', 'matched'].includes(state.phase)) await request('/' + state.code + '/leave', {}, token);
      generation++; stopPolling(); storage.remove('resume'); storage.remove('local'); state = null; handoff = false; signature = ''; token = null;
      const url = new URL(location.href); url.searchParams.delete('room'); history.replaceState(null, '', url); show($('[data-game]'), false); show($('[data-lobby]'), true); message('');
    });
  };
  $('[data-replay]').onclick = () => perform(async () => {
    if (mode === 'local') startLocal();
    else { const secret = newToken(), next = await request('', { name: state.players[state.you], token: secret }); enter(next, secret); }
  });
  $('[data-save]').onclick = () => {
    const lines = ['词意同遇', state.players.a + ' / ' + state.players.b, '', ...state.history.map(row => '第' + row.round + '轮：' + row.a + ' / ' + row.b + (row.matched ? ' · 相遇' : '')), '', state.phase === 'matched' ? '在第' + state.round + '轮，我们想到了同一个词。' : '本局已揭晓的联想记录'];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' })), link = document.createElement('a'); link.href = url; link.download = '词意同遇-' + new Date().toISOString().slice(0, 10) + '.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPolling(); else refresh(); });
  window.addEventListener('pagehide', () => { stopped = true; generation++; stopPolling(); controllers.forEach(controller => controller.abort()); });
  window.addEventListener('pageshow', event => { if (event.persisted) { stopped = false; refresh(); } });
  const queryCode = new URLSearchParams(location.search).get('room'), resume = queryCode || storage.get('resume');
  if (resume === 'local' && !queryCode) {
    try { const local = JSON.parse(storage.get('local')); if (local?.state?.history && local.state.players) { chooseMode('local'); state = local.state; fields.elements.name.value = state.players.a; fields.elements.partner.value = state.players.b; handoff = !!local.handoff; render(); } } catch { storage.remove('local'); }
  } else if (resume && codePattern.test(resume.toUpperCase())) {
    fields.elements.code.value = resume.toUpperCase(); token = storage.get('token:' + fields.elements.code.value);
    if (token) perform(async () => { const code = fields.elements.code.value; enter(await request('/' + code, null, token), token); });
    else message('朋友邀请你来联想。填一个称呼，再点“加入房间”。');
  } else if (queryCode) message('邀请链接中的房间码不完整，请向朋友确认。', true);
})();
