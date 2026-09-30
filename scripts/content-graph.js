'use strict';

const { isPublicMetadata } = require('./metadata-policy');

// Taxonomy and utility pages are navigation, not content nodes.
const EXCLUDED_PAGE = /^(?:categories|tags|archives|page|graph|404)(?:\/|$)/;
const MAX_EDGES_PER_NODE = 5;

function toArray(collection) {
  if (!collection) return [];
  if (typeof collection.toArray === 'function') return collection.toArray();
  return Array.from(collection);
}

function names(collection) {
  return toArray(collection).map(item => (item && (item.name || item.title)) || '').filter(Boolean);
}

function kindOf(path) {
  if (/^notes(?:\/|$)/.test(path)) return '笔记';
  if (/^explore(?:\/|$)/.test(path)) return '探索';
  if (/^rate(?:\/|$)/.test(path)) return '评测';
  return '页面';
}

function normalizeUrl(path, root) {
  const clean = String(path || '').replace(/^\/+/, '');
  if (!clean) return root;
  return root + clean;
}

function buildGraph(locals, root = '/') {
  const nodes = new Map();

  for (const post of toArray(locals.posts).filter(isPublicMetadata)) {
    const path = String(post.path || '').replace(/^\/+/, '');
    if (!path) continue;
    nodes.set(path, {
      id: path,
      title: post.title || path,
      url: normalizeUrl(path, root),
      kind: '文章',
      date: post.date ? post.date.toISOString().slice(0, 10) : '',
      tags: names(post.tags),
      categories: names(post.categories)
    });
  }

  for (const page of toArray(locals.pages).filter(isPublicMetadata)) {
    const path = String(page.path || '').replace(/^\/+/, '');
    if (!path || path === 'index.html' || EXCLUDED_PAGE.test(path)) continue;
    if (nodes.has(path)) continue;
    nodes.set(path, {
      id: path,
      title: page.title || path,
      url: normalizeUrl(path, root),
      kind: kindOf(path),
      date: page.date ? page.date.toISOString().slice(0, 10) : '',
      tags: names(page.tags),
      categories: names(page.categories)
    });
  }

  const list = [...nodes.values()];
  const topics = new Map();
  for (const node of list) {
    for (const topic of new Set([...node.tags, ...node.categories])) {
      if (!topics.has(topic)) topics.set(topic, []);
      topics.get(topic).push(node.id);
    }
  }

  const weight = new Map();
  for (const [topic, ids] of topics) {
    // A topic shared by everything is not a useful signal.
    if (ids.length < 2 || ids.length > Math.max(12, list.length * 0.5)) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = ids[i] < ids[j] ? ids[i] + '\u0000' + ids[j] : ids[j] + '\u0000' + ids[i];
        const entry = weight.get(key) || { source: ids[i] < ids[j] ? ids[i] : ids[j], target: ids[i] < ids[j] ? ids[j] : ids[i], shared: [] };
        entry.shared.push(topic);
        weight.set(key, entry);
      }
    }
  }

  // Keep the graph readable: strong links first, then a per-node cap.
  const perNode = new Map();
  const edges = [];
  for (const edge of [...weight.values()].sort((a, b) => b.shared.length - a.shared.length)) {
    const a = perNode.get(edge.source) || 0;
    const b = perNode.get(edge.target) || 0;
    if (a >= MAX_EDGES_PER_NODE || b >= MAX_EDGES_PER_NODE) continue;
    perNode.set(edge.source, a + 1);
    perNode.set(edge.target, b + 1);
    edges.push({ source: edge.source, target: edge.target, weight: edge.shared.length, shared: edge.shared.slice(0, 3) });
  }

  return {
    nodes: list,
    edges,
    topics: [...topics.entries()].map(([name, ids]) => ({ name, count: ids.length }))
      .filter(topic => topic.count > 1)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  };
}

function register(site) {
  site.extend.generator.register('content-graph', function (locals) {
    const graph = buildGraph(locals, site.config.root || '/');
    return [{ path: 'content-graph.json', data: JSON.stringify(graph) }];
  });
}

if (typeof hexo !== 'undefined') register(hexo);
module.exports = { buildGraph };
