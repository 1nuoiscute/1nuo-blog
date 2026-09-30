(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var WIDTH = 1000;
  var HEIGHT = 680;
  var PADDING = 56;

  // Single source of truth for type colours: used for dots and legend swatches.
  // Mid-tone values keep >=3:1 contrast on both the light and dark surfaces.
  var KIND_COLOR = { '文章': '#cf5f91', '笔记': '#4f7fc4', '探索': '#2fa87a', '评测': '#e08a2e', '页面': '#8b7f96' };
  var KIND_ORDER = ['文章', '笔记', '探索', '评测', '页面'];

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function svgNode(name, attributes) {
    var element = document.createElementNS(NS, name);
    Object.keys(attributes || {}).forEach(function (key) { element.setAttribute(key, attributes[key]); });
    return element;
  }

  function icon(name) {
    var paths = {
      zoomIn: 'M11 8v6M8 11h6M20 11a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM21 21l-4.35-4.35',
      zoomOut: 'M8 11h6M20 11a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM21 21l-4.35-4.35',
      reset: 'M3 12a9 9 0 1 0 3-6.7M3 4v4h4',
      labels: 'M7 7h.01M20.6 12.6 12 21.2 3.4 12.6V3.4H12l8.6 8.6a.8.8 0 0 1 0 1.1Z'
    };
    return '<svg class="nuo-graph-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + paths[name] + '"/></svg>';
  }

  function seededRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function primaryTopic(node) {
    return node.tags[0] || node.categories[0] || '未分类';
  }

  // Rough text metrics are enough to stop labels from stacking on each other.
  function textWidth(text, fontSize) {
    var value = String(text || '');
    var width = 0;
    for (var i = 0; i < value.length; i++) {
      width += value.charCodeAt(i) > 255 ? fontSize : fontSize * 0.56;
    }
    return width;
  }

  function labelBox(text, x, y, fontSize) {
    var width = Math.min(textWidth(text, fontSize), 140);
    return { left: x - width / 2, right: x + width / 2, top: y - fontSize, bottom: y + fontSize * 0.35 };
  }

  function overlaps(a, b) {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  }

  // Force-directed layout: link springs, node repulsion, topic cohesion and mild
  // gravity. Deterministic, so the map looks the same on every visit.
  function computeLayout(nodes, edges) {
    var count = nodes.length;
    var index = {};
    nodes.forEach(function (node, position) { index[node.id] = position; });
    var random = seededRandom(count * 7919 + edges.length * 104729);
    var positions = new Float64Array(count * 2);
    var clusters = {};

    nodes.forEach(function (node, position) {
      var topic = primaryTopic(node);
      (clusters[topic] = clusters[topic] || []).push(position);
    });
    var topics = Object.keys(clusters).sort(function (a, b) { return clusters[b].length - clusters[a].length; });
    // Lay the topic groups out on a jittered grid sized to the canvas so the map
    // covers the whole frame instead of collapsing into a couple of blobs.
    var columns = Math.max(1, Math.ceil(Math.sqrt(topics.length)));
    var rows = Math.max(1, Math.ceil(topics.length / columns));
    topics.forEach(function (topic, order) {
      var column = order % columns;
      var row = Math.floor(order / columns);
      var cellWidth = (WIDTH - PADDING) / columns;
      var cellHeight = (HEIGHT - PADDING) / rows;
      var centerX = PADDING / 2 + cellWidth * (column + 0.5);
      var centerY = PADDING / 2 + cellHeight * (row + 0.5);
      // Bigger groups get a wider initial spread so they do not pile up.
      var spread = Math.min(cellWidth, cellHeight) * (0.34 + Math.min(clusters[topic].length, 12) * 0.035);
      clusters[topic].forEach(function (position) {
        positions[position * 2] = centerX + (random() - 0.5) * spread;
        positions[position * 2 + 1] = centerY + (random() - 0.5) * spread;
      });
    });

    var links = [];
    for (var e = 0; e < edges.length; e++) {
      var a = index[edges[e].source], b = index[edges[e].target];
      if (a === undefined || b === undefined) continue;
      links.push({ a: a, b: b, weight: Math.min(edges[e].weight, 5) });
    }

    var ideal = Math.sqrt((WIDTH * HEIGHT) / Math.max(count, 1)) * 0.82;
    var alpha = 1;
    for (var step = 0; step < 520; step++) {
      var dx, dy, distance, force, shiftX, shiftY, i, j, link;

      for (i = 0; i < count; i++) {
        for (j = i + 1; j < count; j++) {
          dx = positions[j * 2] - positions[i * 2];
          dy = positions[j * 2 + 1] - positions[i * 2 + 1];
          distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
          force = (ideal * ideal) / distance;
          shiftX = (dx / distance) * force * 0.0031 * alpha;
          shiftY = (dy / distance) * force * 0.0031 * alpha;
          positions[i * 2] -= shiftX; positions[i * 2 + 1] -= shiftY;
          positions[j * 2] += shiftX; positions[j * 2 + 1] += shiftY;
        }
      }

      for (i = 0; i < links.length; i++) {
        link = links[i];
        dx = positions[link.b * 2] - positions[link.a * 2];
        dy = positions[link.b * 2 + 1] - positions[link.a * 2 + 1];
        distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
        force = (distance - ideal * 0.8) * (0.03 + link.weight * 0.008) * alpha;
        shiftX = (dx / distance) * force;
        shiftY = (dy / distance) * force;
        positions[link.a * 2] += shiftX; positions[link.a * 2 + 1] += shiftY;
        positions[link.b * 2] -= shiftX; positions[link.b * 2 + 1] -= shiftY;
      }

      for (i = 0; i < topics.length; i++) {
        var members = clusters[topics[i]];
        if (members.length < 2) continue;
        var sumX = 0, sumY = 0, m;
        for (m = 0; m < members.length; m++) { sumX += positions[members[m] * 2]; sumY += positions[members[m] * 2 + 1]; }
        var centerX = sumX / members.length, centerY = sumY / members.length;
        for (m = 0; m < members.length; m++) {
          positions[members[m] * 2] += (centerX - positions[members[m] * 2]) * 0.012 * alpha;
          positions[members[m] * 2 + 1] += (centerY - positions[members[m] * 2 + 1]) * 0.012 * alpha;
        }
      }

      for (i = 0; i < count; i++) {
        positions[i * 2] += (WIDTH / 2 - positions[i * 2]) * 0.01 * alpha;
        positions[i * 2 + 1] += (HEIGHT / 2 - positions[i * 2 + 1]) * 0.01 * alpha;
      }
      alpha *= 0.9965;
    }

    // Anchor the topic groups on evenly spaced points before fitting, so the
    // composition reads as intentional instead of two blobs on a diagonal.
    var anchors = topics.filter(function (topic) { return clusters[topic].length >= 5; });
    anchors.forEach(function (topic, order) {
      var members = clusters[topic];
      var sumX = 0, sumY = 0, m;
      for (m = 0; m < members.length; m++) { sumX += positions[members[m] * 2]; sumY += positions[members[m] * 2 + 1]; }
      var centroidX = sumX / members.length, centroidY = sumY / members.length;
      var angle = -Math.PI / 2 + (order / Math.max(anchors.length, 1)) * Math.PI * 2;
      var targetX = WIDTH / 2 + Math.cos(angle) * (anchors.length === 1 ? 0 : WIDTH * 0.24);
      var targetY = HEIGHT / 2 + Math.sin(angle) * (anchors.length === 1 ? 0 : HEIGHT * 0.24);
      var shiftX = targetX - centroidX, shiftY = targetY - centroidY;
      for (m = 0; m < members.length; m++) {
        positions[members[m] * 2] += shiftX;
        positions[members[m] * 2 + 1] += shiftY;
      }
    });

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var k = 0; k < count; k++) {
      if (positions[k * 2] < minX) minX = positions[k * 2];
      if (positions[k * 2] > maxX) maxX = positions[k * 2];
      if (positions[k * 2 + 1] < minY) minY = positions[k * 2 + 1];
      if (positions[k * 2 + 1] > maxY) maxY = positions[k * 2 + 1];
    }
    var scale = Math.min(
      (WIDTH - PADDING * 2) / Math.max(maxX - minX, 1),
      (HEIGHT - PADDING * 2) / Math.max(maxY - minY, 1)
    );
    var offsetX = (WIDTH - (maxX - minX) * scale) / 2 - minX * scale;
    var offsetY = (HEIGHT - (maxY - minY) * scale) / 2 - minY * scale;

    var result = {};
    var placed = nodes.map(function (node, position) {
      return {
        id: node.id,
        x: positions[position * 2] * scale + offsetX,
        y: positions[position * 2 + 1] * scale + offsetY
      };
    });

    // Final relaxation: the force pass alone still leaves the biggest hubs
    // overlapping, which makes individual nodes hard to point at.
    var nodeDegree = {};
    links.forEach(function (link) {
      nodeDegree[link.a] = (nodeDegree[link.a] || 0) + 1;
      nodeDegree[link.b] = (nodeDegree[link.b] || 0) + 1;
    });
    var maxDegree = 1;
    for (var d = 0; d < count; d++) maxDegree = Math.max(maxDegree, nodeDegree[d] || 0);
    var radii = placed.map(function (item, position) {
      return 5.5 + ((nodeDegree[position] || 0) / maxDegree) * 13;
    });
    for (var pass = 0; pass < 80; pass++) {
      var moved = false;
      for (var x = 0; x < count; x++) {
        for (var y = x + 1; y < count; y++) {
          var ddx = placed[y].x - placed[x].x;
          var ddy = placed[y].y - placed[x].y;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01;
          var minimum = radii[x] + radii[y] + 7;
          if (dist >= minimum) continue;
          var push = (minimum - dist) / 2;
          var ux = ddx / dist, uy = ddy / dist;
          placed[x].x -= ux * push; placed[x].y -= uy * push;
          placed[y].x += ux * push; placed[y].y += uy * push;
          moved = true;
        }
      }
      placed.forEach(function (item, position) {
        var margin = Math.max(radii[position] + 6, PADDING / 2);
        item.x = Math.min(WIDTH - margin, Math.max(margin, item.x));
        item.y = Math.min(HEIGHT - margin, Math.max(margin, item.y));
      });
      if (!moved) break;
    }
    placed.forEach(function (item) { result[item.id] = { x: item.x, y: item.y }; });
    return result;
  }

  // One pass over the graph produces degrees, adjacency and shared topics, so
  // drawing never re-scans the edge list per node.
  function analyse(nodes, edges) {
    var degree = {}, adjacency = {}, topics = {};
    nodes.forEach(function (node) { degree[node.id] = 0; adjacency[node.id] = []; topics[node.id] = []; });
    edges.forEach(function (edge) {
      degree[edge.source] = (degree[edge.source] || 0) + 1;
      degree[edge.target] = (degree[edge.target] || 0) + 1;
      adjacency[edge.source].push(edge.target);
      adjacency[edge.target].push(edge.source);
      edge.shared.forEach(function (topic) {
        if (topics[edge.source].indexOf(topic) < 0) topics[edge.source].push(topic);
        if (topics[edge.target].indexOf(topic) < 0) topics[edge.target].push(topic);
      });
    });
    return { degree: degree, adjacency: adjacency, topics: topics };
  }

  function setStats(root, values) {
    var holder = root.querySelector('[data-graph-stats]');
    if (!holder) return;
    holder.innerHTML = values.map(function (value) {
      return '<div class="nuo-graph-stat"><strong>' + escapeHtml(value.value) + '</strong><span>' + escapeHtml(value.label) + '</span></div>';
    }).join('');
  }

  function renderLegend(root, graph) {
    var legend = root.querySelector('[data-graph-legend]');
    if (!legend) return;
    var counts = {};
    graph.nodes.forEach(function (node) { counts[node.kind] = (counts[node.kind] || 0) + 1; });
    legend.innerHTML = KIND_ORDER.filter(function (kind) { return counts[kind]; }).map(function (kind) {
      return '<span class="nuo-graph-legend-item"><i style="background:' + KIND_COLOR[kind] + '"></i>' +
        escapeHtml(kind) + ' ' + counts[kind] + '</span>';
    }).join('');
  }

  function renderTopicChips(root, graph, active, onPick) {
    var holder = root.querySelector('[data-graph-topics]');
    if (!holder) return;
    holder.innerHTML = '';
    var add = function (label, value) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'nuo-graph-topic' + (active === value ? ' is-active' : '');
      button.textContent = label;
      button.setAttribute('aria-pressed', active === value ? 'true' : 'false');
      button.addEventListener('click', function () { onPick(value); });
      holder.appendChild(button);
    };
    add('全部主题', '');
    graph.topics.slice(0, 16).forEach(function (topic) {
      add(topic.name + ' ' + topic.count, topic.name);
    });
  }

  function renderKindChips(root, graph, activeKinds, onToggle) {
    var holder = root.querySelector('[data-graph-kinds]');
    if (!holder) return;
    holder.innerHTML = '';
    var counts = {};
    graph.nodes.forEach(function (node) { counts[node.kind] = (counts[node.kind] || 0) + 1; });
    KIND_ORDER.filter(function (kind) { return counts[kind]; }).forEach(function (kind) {
      var button = document.createElement('button');
      button.type = 'button';
      var on = activeKinds.indexOf(kind) >= 0;
      button.className = 'nuo-graph-kind' + (on ? ' is-active' : '');
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.innerHTML = '<i style="background:' + KIND_COLOR[kind] + '"></i>' + escapeHtml(kind) + ' ' + counts[kind];
      button.addEventListener('click', function () { onToggle(kind); });
      holder.appendChild(button);
    });
  }

  function renderFallback(root, message) {
    var list = root.querySelector('[data-graph-fallback]');
    if (!list) return;
    list.innerHTML = message ? '<p class="nuo-graph-note">' + escapeHtml(message) + '</p>' : '';
    // search.json is generated on every build; it keeps the page useful even
    // if the relationship data itself is unavailable.
    fetch('/search.json', { credentials: 'same-origin' })
      .then(function (response) { return response.ok ? response.json() : []; })
      .then(function (data) {
        var posts = Array.isArray(data) ? data : (data.posts || data.data || []);
        if (!posts.length) return;
        list.insertAdjacentHTML('beforeend', '<div class="nuo-graph-cluster"><h3>全部内容</h3><ul>' +
          posts.map(function (post) {
            var url = String(post.url || post.path || '');
            if (!/^https?:/.test(url)) url = url.replace(/^\/+/, '/');
            return '<li><a href="' + escapeHtml(url) + '">' + escapeHtml(post.title || url) + '</a></li>';
          }).join('') + '</ul></div>');
      })
      .catch(function () { /* keep the plain message */ });
  }

  function showEmpty(root, state, onClear) {
    var empty = root.querySelector('[data-graph-empty]');
    if (!empty) return;
    empty.hidden = false;
    empty.innerHTML = '<p>当前筛选下没有可显示的内容。</p>';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'nuo-graph-btn';
    button.textContent = '清除筛选';
    button.addEventListener('click', onClear);
    empty.appendChild(button);
  }

  function draw(root, graph, state) {
    var canvas = root.querySelector('[data-graph-canvas]');
    if (!canvas) return;
    var empty = root.querySelector('[data-graph-empty]');
    if (empty) empty.hidden = true;

    var nodes = [];
    for (var i = 0; i < graph.nodes.length; i++) {
      var node = graph.nodes[i];
      if (state.kinds.length && state.kinds.indexOf(node.kind) < 0) continue;
      if (state.topic && node.tags.indexOf(state.topic) < 0 && node.categories.indexOf(state.topic) < 0) continue;
      nodes.push(node);
    }
    var visible = {};
    nodes.forEach(function (item) { visible[item.id] = true; });
    var edges = graph.edges.filter(function (edge) { return visible[edge.source] && visible[edge.target]; });

    if (!nodes.length) {
      canvas.innerHTML = '';
      setStats(root, [{ value: 0, label: '个节点' }]);
      showEmpty(root, state, function () {
        state.topic = '';
        state.kinds = [];
        state.refresh();
      });
      var status = root.querySelector('[data-graph-status]');
      if (status) status.textContent = '当前筛选下没有内容。';
      return;
    }

    var stats = analyse(nodes, edges);
    var positions = computeLayout(nodes, edges);
    canvas.innerHTML = '';

    var svg = svgNode('svg', { viewBox: '0 0 ' + WIDTH + ' ' + HEIGHT, role: 'group', 'aria-label': '内容关系图，可用 Tab 切换节点' });
    var viewport = svgNode('g', { class: 'nuo-graph-viewport' });
    var edgeLayer = svgNode('g', { class: 'nuo-graph-edges' });
    var nodeLayer = svgNode('g', { class: 'nuo-graph-nodes' });

    var edgeElements = edges.map(function (edge) {
      var a = positions[edge.source], b = positions[edge.target];
      if (!a || !b) return null;
      // Slight curve keeps parallel links readable and looks less mechanical.
      var midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      var dx = b.x - a.x, dy = b.y - a.y;
      var length = Math.sqrt(dx * dx + dy * dy) || 1;
      var bend = Math.min(26, length * 0.12);
      var path = svgNode('path', {
        class: 'nuo-graph-edge',
        d: 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) +
           'Q' + (midX - (dy / length) * bend).toFixed(1) + ' ' + (midY + (dx / length) * bend).toFixed(1) +
           ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1),
        'stroke-width': Math.min(0.9 + edge.weight * 0.55, 4.2)
      });
      path.dataset.source = edge.source;
      path.dataset.target = edge.target;
      path.style.opacity = String(Math.min(0.28 + edge.weight * 0.12, 0.75));
      edgeLayer.appendChild(path);
      return path;
    }).filter(Boolean);

    var maxDegree = 1;
    nodes.forEach(function (item) { if (stats.degree[item.id] > maxDegree) maxDegree = stats.degree[item.id]; });

    // Each topic gets one calm region label instead of dozens of colliding ones.
    var groups = {};
    nodes.forEach(function (item) {
      var topic = item.tags[0] || item.categories[0] || '未分类';
      var position = positions[item.id];
      if (!position) return;
      var group = groups[topic] || (groups[topic] = { x: 0, y: 0, count: 0 });
      group.x += position.x; group.y += position.y; group.count++;
    });
    var regionLabels = Object.keys(groups).filter(function (topic) { return groups[topic].count >= 3; })
      .map(function (topic) {
        return { topic: topic, x: groups[topic].x / groups[topic].count, y: groups[topic].y / groups[topic].count };
      });
    var occupied = regionLabels.map(function (region) { return labelBox(region.topic, region.x, region.y, 15); });

    // Only the strongest hubs stay labelled, and only when the label fits without
    // colliding; hover, focus or "显示全部标签" reveal the rest.
    var labelled = {};
    if (nodes.length <= 14) {
      nodes.forEach(function (item) { labelled[item.id] = true; });
    } else {
      nodes.slice().sort(function (a, b) {
        return (stats.degree[b.id] || 0) - (stats.degree[a.id] || 0) || a.title.localeCompare(b.title);
      }).slice(0, 12).forEach(function (item) {
        var position = positions[item.id];
        if (!position) return;
        var radius = 5.5 + ((stats.degree[item.id] || 0) / maxDegree) * 13;
        var anchorY = position.y < HEIGHT / 2 ? position.y + radius + 15 : position.y - radius - 8;
        var box = labelBox(item.title, position.x, anchorY, 12);
        var collides = occupied.some(function (other) { return overlaps(box, other); });
        if (collides) return;
        occupied.push(box);
        labelled[item.id] = true;
      });
    }

    var nodeElements = nodes.map(function (item) {
      var position = positions[item.id];
      if (!position) return null;
      var nodeDegree = stats.degree[item.id] || 0;
      var radius = 5.5 + (nodeDegree / maxDegree) * 13;
      var color = KIND_COLOR[item.kind] || '#8b7f96';
      var group = svgNode('g', {
        class: 'nuo-graph-node' + (state.allLabels || labelled[item.id] ? ' is-labeled' : ''),
        tabindex: '0',
        role: 'link',
        'aria-label': item.title + '，' + item.kind + (item.date ? '，' + item.date : '')
      });
      group.dataset.id = item.id;
      group.dataset.title = item.title;
      group.dataset.kind = item.kind;
      group.dataset.meta = [item.kind, item.date].filter(Boolean).join(' · ');
      group.dataset.topics = stats.topics[item.id].slice(0, 6).join('、');

      if (nodeDegree >= 3) {
        group.appendChild(svgNode('circle', { class: 'nuo-graph-halo', cx: position.x, cy: position.y, r: radius + 5, fill: color }));
      }
      group.appendChild(svgNode('circle', { class: 'nuo-graph-dot', cx: position.x, cy: position.y, r: radius, fill: color }));
      var label = svgNode('text', {
        class: 'nuo-graph-label',
        x: position.x,
        y: position.y < HEIGHT / 2 ? position.y + radius + 15 : position.y - radius - 8,
        'text-anchor': 'middle'
      });
      label.textContent = item.title.length > 13 ? item.title.slice(0, 13) + '…' : item.title;
      group.appendChild(label);

      function open() { location.href = item.url; }
      group.addEventListener('click', open);
      group.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
      group.addEventListener('mouseenter', function () { showCard(root, group, position); highlight(item.id); });
      group.addEventListener('mouseleave', function () { hideCard(root); highlight(null); });
      group.addEventListener('focus', function () { showCard(root, group, position); highlight(item.id); });
      group.addEventListener('blur', function () { hideCard(root); highlight(null); });
      nodeLayer.appendChild(group);
      return group;
    }).filter(Boolean);

    function highlight(id) {
      if (!id) {
        svg.classList.remove('has-focus');
        nodeElements.forEach(function (element) { element.classList.remove('is-dim'); });
        edgeElements.forEach(function (element) { element.classList.remove('is-dim'); });
        return;
      }
      var neighbours = stats.adjacency[id] || [];
      svg.classList.add('has-focus');
      nodeElements.forEach(function (element) {
        element.classList.toggle('is-dim', element.dataset.id !== id && neighbours.indexOf(element.dataset.id) < 0);
      });
      edgeElements.forEach(function (element) {
        element.classList.toggle('is-dim', element.dataset.source !== id && element.dataset.target !== id);
      });
    }

    // Each topic gets one calm region label instead of dozens of colliding ones.
    var labelLayer = svgNode('g', { class: 'nuo-graph-cluster-labels' });
    regionLabels.forEach(function (region) {
      var text = svgNode('text', {
        class: 'nuo-graph-cluster-label',
        x: region.x.toFixed(1),
        y: region.y.toFixed(1),
        'text-anchor': 'middle'
      });
      text.textContent = region.topic;
      labelLayer.appendChild(text);
    });

    viewport.appendChild(edgeLayer);
    viewport.appendChild(labelLayer);
    viewport.appendChild(nodeLayer);
    svg.appendChild(viewport);
    canvas.appendChild(svg);

    setStats(root, [
      { value: nodes.length, label: '个内容节点' },
      { value: edges.length, label: '条主题关联' },
      { value: Object.keys(stats.topics).reduce(function (total, id) { return total + stats.topics[id].length; }, 0), label: '次主题命中' }
    ]);

    var status = root.querySelector('[data-graph-status]');
    if (status) {
      var scope = state.topic ? '主题「' + state.topic + '」' : '全部内容';
      status.textContent = scope + '：' + nodes.length + ' 个节点，' + edges.length + ' 条关联。悬停查看关联，点击或回车打开页面。';
    }
    bindNavigation(root, svg, viewport);
  }

  function showCard(root, group, position) {
    var card = root.querySelector('[data-graph-card]');
    if (!card) return;
    card.innerHTML = '<strong title="' + escapeHtml(group.dataset.title) + '">' + escapeHtml(group.dataset.title) + '</strong>' +
      '<span class="nuo-graph-card-meta">' + escapeHtml(group.dataset.meta) + '</span>' +
      (group.dataset.topics ? '<span class="nuo-graph-card-topics">共同主题：' + escapeHtml(group.dataset.topics) + '</span>' : '');
    card.hidden = false;
    var rect = root.querySelector('[data-graph-canvas]').getBoundingClientRect();
    card.style.left = Math.min(Math.max(position.x / WIDTH * rect.width + 14, 8), Math.max(rect.width - 230, 8)) + 'px';
    card.style.top = Math.min(Math.max(position.y / HEIGHT * rect.height - 10, 8), Math.max(rect.height - 96, 8)) + 'px';
  }

  function hideCard(root) {
    var card = root.querySelector('[data-graph-card]');
    if (card) card.hidden = true;
  }

  // The pan/zoom view is shared across redraws: the controls are bound once, so
  // they must not capture a single (soon detached) SVG element.
  function graphView(root) {
    if (!root.__nuoGraphView) {
      root.__nuoGraphView = { svg: null, viewport: null, transform: { scale: 1, x: 0, y: 0 }, frame: null };
    }
    return root.__nuoGraphView;
  }

  function applyTransform(root) {
    var view = graphView(root);
    view.frame = null;
    if (!view.viewport) return;
    view.viewport.setAttribute('transform', 'translate(' + view.transform.x.toFixed(2) + ' ' +
      view.transform.y.toFixed(2) + ') scale(' + view.transform.scale.toFixed(3) + ')');
  }

  // High-frequency gestures are coalesced into one paint per frame.
  function scheduleTransform(root) {
    if (graphView(root).frame === null) graphView(root).frame = requestAnimationFrame(function () { applyTransform(root); });
  }

  function bindViewControls(root, state) {
    var controls = root.querySelector('.nuo-graph-controls');
    if (!controls || controls.dataset.bound === 'true') return;
    controls.dataset.bound = 'true';
    // Vector icons instead of text glyphs; labels remain for assistive tech.
    var icons = { in: 'zoomIn', out: 'zoomOut', reset: 'reset', labels: 'labels' };
    controls.querySelectorAll('[data-graph-action]').forEach(function (button) {
      var name = icons[button.dataset.graphAction];
      if (!name || button.querySelector('svg')) return;
      button.insertAdjacentHTML('afterbegin', icon(name));
      if (button.dataset.graphAction === 'in' || button.dataset.graphAction === 'out') {
        button.setAttribute('aria-label', button.dataset.graphAction === 'in' ? '放大' : '缩小');
      }
    });
    controls.addEventListener('click', function (event) {
      var button = event.target.closest('[data-graph-action]');
      if (!button) return;
      var view = graphView(root);
      var action = button.dataset.graphAction;
      if (action === 'in') zoomBy(root, 1.25);
      if (action === 'out') zoomBy(root, 0.8);
      if (action === 'reset') { view.transform = { scale: 1, x: 0, y: 0 }; applyTransform(root); }
      if (action === 'labels') {
        state.allLabels = !state.allLabels;
        button.setAttribute('aria-pressed', state.allLabels ? 'true' : 'false');
        if (view.svg) {
          view.svg.querySelectorAll('.nuo-graph-node').forEach(function (element) {
            element.classList.toggle('is-labeled', state.allLabels);
          });
        }
      }
    });
  }

  function zoomBy(root, factor, origin) {
    var view = graphView(root);
    var anchor = origin || { x: WIDTH / 2, y: HEIGHT / 2 };
    var next = Math.min(3.2, Math.max(0.5, view.transform.scale * factor));
    var applied = next / view.transform.scale;
    view.transform.x = anchor.x - (anchor.x - view.transform.x) * applied;
    view.transform.y = anchor.y - (anchor.y - view.transform.y) * applied;
    view.transform.scale = next;
    scheduleTransform(root);
  }

  function bindNavigation(root, svg, viewport) {
    var view = graphView(root);
    view.svg = svg;
    view.viewport = viewport;
    applyTransform(root);

    function pointFromEvent(event) {
      var rect = svg.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / rect.width * WIDTH, y: (event.clientY - rect.top) / rect.height * HEIGHT };
    }

    svg.addEventListener('wheel', function (event) {
      event.preventDefault();
      zoomBy(root, event.deltaY < 0 ? 1.12 : 0.89, pointFromEvent(event));
    }, { passive: false });

    var dragging = null;
    svg.addEventListener('pointerdown', function (event) {
      dragging = { x: event.clientX, y: event.clientY, startX: view.transform.x, startY: view.transform.y };
      svg.setPointerCapture(event.pointerId);
      svg.classList.add('is-dragging');
    });
    svg.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      var rect = svg.getBoundingClientRect();
      view.transform.x = dragging.startX + (event.clientX - dragging.x) / rect.width * WIDTH;
      view.transform.y = dragging.startY + (event.clientY - dragging.y) / rect.height * HEIGHT;
      scheduleTransform(root);
    });
    ['pointerup', 'pointercancel'].forEach(function (name) {
      svg.addEventListener(name, function () { dragging = null; svg.classList.remove('is-dragging'); });
    });
  }

  function boot() {
    var root = document.querySelector('[data-content-graph]');
    if (!root || root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';
    var status = root.querySelector('[data-graph-status]');
    var skeleton = root.querySelector('[data-graph-skeleton]');
    if (status) status.textContent = '正在加载内容关系…';

    fetch('/content-graph.json', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (graph) {
        if (!graph || !Array.isArray(graph.nodes) || !graph.nodes.length) throw new Error('empty graph');
        if (skeleton) skeleton.hidden = true;
        var state = { topic: '', kinds: [], allLabels: false };
        var toggleKind = function (kind) {
          var at = state.kinds.indexOf(kind);
          if (at >= 0) state.kinds.splice(at, 1); else state.kinds.push(kind);
          state.refresh();
        };
        state.refresh = function () {
          renderTopicChips(root, graph, state.topic, function (topic) { state.topic = topic; state.refresh(); });
          renderKindChips(root, graph, state.kinds, toggleKind);
          hideCard(root);
          draw(root, graph, state);
        };
        renderLegend(root, graph);
        bindViewControls(root, state);
        state.refresh();
      })
      .catch(function () {
        if (skeleton) skeleton.hidden = true;
        if (status) status.textContent = '关系数据暂时不可用，下面直接列出站内内容。';
        renderFallback(root, '关系图加载失败，可以直接从下面的列表进入内容。');
      });
  }

  window.NuoContentGraph = { boot: boot };
  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('pjax:complete', boot);
})();
