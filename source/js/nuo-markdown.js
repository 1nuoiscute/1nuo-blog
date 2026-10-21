(function () {
  'use strict';
  const el = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
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
      const heading = /^(#{1,3})\s+(.+)$/.exec(line), quote = /^>\s?(.*)$/.exec(line), bullet = /^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+)$/.exec(line);
      if (heading || quote) { flush(); const n = el(heading ? 'h' + (heading[1].length + 2) : 'blockquote'); inline(n, heading ? heading[2] : quote[1]); node.append(n); }
      else if (bullet) { const tag = /^\s*\d/.test(line) ? 'ol' : 'ul'; if (!list || list.localName !== tag) { flush(); list = el(tag); node.append(list); } const li = el('li'); inline(li, bullet[1]); list.append(li); }
      else { if (list) flush(); paragraph.push(line); }
    }
    flush(); if (code) { const pre = el('pre'); pre.append(el('code', code.join('\n'))); node.append(pre); }
  }
  window.NuoMarkdown = markdown;
})();
