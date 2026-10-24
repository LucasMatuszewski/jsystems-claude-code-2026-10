/* Shared reference-page behavior. No HTML is constructed from search input. */
(function (root) {
  'use strict';
  function normalizeText(value) {
    return String(value || '').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  }
  function findMatches(text, query) {
    const needle = normalizeText(query);
    if (!needle) return [];
    let normalized = '', offset = 0;
    const positions = [];
    for (const character of text) {
      const part = normalizeText(character);
      for (let i = 0; i < part.length; i++) positions.push([offset, offset + character.length]);
      normalized += part;
      offset += character.length;
    }
    const matches = [];
    let from = 0, index;
    while ((index = normalized.indexOf(needle, from)) !== -1) {
      matches.push([positions[index][0], positions[index + needle.length - 1][1]]);
      from = index + needle.length;
    }
    return matches;
  }
  function matchTextParts(parts, query) {
    const matches = findMatches(parts.join(''), query);
    let offset = 0;
    return parts.map(part => {
      const start = offset;
      offset += part.length;
      return matches.filter(([from, to]) => from < offset && to > start)
        .map(([from, to]) => [Math.max(from, start) - start, Math.min(to, offset) - start])
        .filter(([from, to]) => from < to);
    });
  }
  function highlightTerm(term, query) {
    term.querySelectorAll('mark[data-search-match]').forEach(mark => mark.replaceWith(mark.ownerDocument.createTextNode(mark.textContent)));
    term.normalize();
    if (!query) return;
    const document = term.ownerDocument;
    const walker = document.createTreeWalker(term, 4); // SHOW_TEXT
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('script,style,button')) nodes.push(node);
    }
    const ranges = matchTextParts(nodes.map(node => node.data), query);
    nodes.forEach((node, index) => {
      const matches = ranges[index];
      if (!matches.length) return;
      const fragment = document.createDocumentFragment();
      let start = 0;
      matches.forEach(([from, to]) => {
        fragment.append(document.createTextNode(node.data.slice(start, from)));
        const mark = document.createElement('mark');
        mark.dataset.searchMatch = '';
        mark.textContent = node.data.slice(from, to);
        fragment.append(mark);
        start = to;
      });
      fragment.append(document.createTextNode(node.data.slice(start)));
      node.replaceWith(fragment);
    });
  }
  function checklistTab(hash, document) {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch (_) { return 'harness'; }
    const tab = id.replace(/^pane-/, '');
    if (['harness', 'greenfield', 'brownfield'].includes(tab)) return tab;
    return document.getElementById(id)?.closest('.tab-pane')?.dataset.tab || 'harness';
  }
  const api = {normalizeText, findMatches, matchTextParts, highlightTerm, checklistTab};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CourseReferenceTools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
