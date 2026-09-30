'use strict';

const { isPublicMetadata } = require('./metadata-policy');

// Posts and notes barely share tags, so automatic keyword matching produces
// nonsense. Notes get real value from their own course structure, and posts
// link to a course deliberately: by front-matter keyword or by topic rule.
const TOPIC_RULES = [
  { match: /电气|电路|电工|电力|强电/, dirs: ['notes/circuit-analysis/'] },
  { match: /NCRE|计算机二级|二级|C语言|C 语言|备考|考级/, dirs: ['notes/NCRE2/', 'notes/c-programming-review'] },
  { match: /线性代数|矩阵|行列式/, dirs: ['notes/linear-algebra/'] },
  { match: /程序设计|编程|代码/, dirs: ['notes/c-programming-review', 'notes/NCRE2/C-SPECIAL/'] }
];

function toArray(collection) {
  if (!collection) return [];
  if (typeof collection.toArray === 'function') return collection.toArray();
  return Array.from(collection);
}

// Helpers receive the Hexo instance, generators receive locals; support both.
function collection(site, name) {
  if (site && site[name]) return site[name];
  if (site && site.locals && typeof site.locals.get === 'function') return site.locals.get(name);
  return [];
}

// Posts carry tag objects, pages carry plain strings.
function names(collection) {
  return toArray(collection).map(item => {
    if (typeof item === 'string') return item;
    return (item && (item.name || item.title)) || '';
  }).filter(Boolean);
}

function normalize(path) {
  return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function courseIndex(path) {
  return normalize(path).split('/')[0] === 'notes' ? normalize(path).split('/')[1] || '' : '';
}

// Course landing pages ("第X章" indexes) are navigation, not lessons.
function isLesson(page) {
  return !/\/index\.html$/.test(normalize(page.path)) && !/\/$/.test(normalize(page.path));
}

function buildNoteIndex(site) {
  const notes = toArray(collection(site, 'pages')).filter(page => isPublicMetadata(page) && courseIndex(page.path));
  return notes.map(page => ({
    page: page,
    path: normalize(page.path),
    course: courseIndex(page.path),
    title: page.title || normalize(page.path)
  }));
}

// Lessons are named l1, l2, ... l23 inside ch1..ch7; plain string sorting would
// put l10 before l2, so order by the numbers in the path.
function naturalKey(path) {
  const chapter = /\/ch(\d+)(?:\/|$)/.exec(path);
  const lesson = /\/(?:l|L)(\d+)(?:-|\.|$)/.exec(path);
  return [
    /index\.html$/.test(path) ? 0 : 1,
    chapter ? Number(chapter[1]) : 0,
    lesson ? Number(lesson[1]) : 0,
    path
  ];
}

function compareNotes(a, b) {
  const left = naturalKey(a.path);
  const right = naturalKey(b.path);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return String(left[3]).localeCompare(String(right[3]));
}

function relatedByCourse(entry, index) {
  const course = index.filter(item => item.course === entry.course).sort(compareNotes);
  const lessons = course.filter(item => isLesson(item.page));
  const position = lessons.findIndex(item => item.path === entry.path);
  const siblings = course.filter(item => item.path !== entry.path);

  // Previous / next lesson in reading order, the course index, then the rest.
  const neighbours = position >= 0
    ? [lessons[position - 1], lessons[position + 1]].filter(Boolean)
    : [];
  const directory = siblings.filter(item => !isLesson(item.page));
  const others = siblings.filter(item => isLesson(item.page));

  return { index: directory, neighbours: neighbours, ordered: others };
}

function relatedByTopic(page, index) {
  const haystack = [page.title, (page.description || ''), names(page.tags).join(' '), names(page.categories).join(' ')].join(' ');
  const explicit = String(page.related_notes || '').split(/[\s,]+/).filter(Boolean);
  const picked = [];
  const seen = {};

  const push = entry => {
    if (!entry || seen[entry.path] || picked.length >= 4) return;
    seen[entry.path] = true;
    picked.push(entry);
  };

  explicit.forEach(prefix => {
    const clean = normalize(prefix);
    index.filter(item => item.path.startsWith(clean)).slice(0, 2).forEach(push);
  });
  TOPIC_RULES.forEach(rule => {
    if (!rule.match.test(haystack)) return;
    rule.dirs.forEach(dir => {
      index.filter(item => item.path.startsWith(normalize(dir))).slice(0, 2).forEach(push);
    });
  });
  return picked;
}

function register(site) {
  site.extend.helper.register('nuo_related_notes', function (page) {
    if (!page || page.layout !== 'post') return '';
    const index = buildNoteIndex(site);
    const picked = relatedByTopic(page, index);
    if (!picked.length) return '';
    const base = root(site);
    return picked.map(item =>
      '<a class="nuo-related-item" href="' + base + item.path + '">' +
      '<span class="nuo-related-kind">笔记</span>' +
      '<span class="nuo-related-title">' + item.title + '</span>' +
      '</a>'
    ).join('');
  });

  site.extend.helper.register('nuo_note_neighbours', function (page) {
    if (!page || page.layout === 'post') return '';
    const entry = { path: normalize(page.path), course: courseIndex(page.path), title: page.title };
    if (!entry.course) return '';
    const grouped = relatedByCourse(entry, buildNoteIndex(site));
    const root = this.config.root || '/';
    const items = grouped.neighbours.concat(grouped.index).slice(0, 4);
    if (!items.length) return '';
    return items.map(item =>
      '<a class="nuo-related-item" href="' + root + item.path + '">' +
      '<span class="nuo-related-kind">' + (/index\.html$|\/$/.test(item.path) ? '目录' : '同课') + '</span>' +
      '<span class="nuo-related-title">' + item.title + '</span>' +
      '</a>'
    ).join('');
  });

  // The course tag doubles as a link back to that course's landing page.
  site.extend.helper.register('nuo_note_course', function (page) {
    if (!page || page.layout === 'post') return '';
    const tag = names(page.tags)[0];
    const course = courseIndex(page.path);
    if (!tag || !course) return '';
    return '<a class="nuo-course-tag" href="' + root(site) + 'notes/' + course + '/">' + tag + '</a>';
  });
}

function root(site) {
  return (site.config && site.config.root) || '/';
}

if (typeof hexo !== 'undefined') register(hexo);
module.exports = { register, relatedByTopic, relatedByCourse, buildNoteIndex, TOPIC_RULES };
