/* viz-kit: блоки для вставок в чате. Вставка = этот скрипт + теги с данными. */
(function () {
  'use strict';

  var Z = 1.959964; // 95%
  var SQUARES_MAX = 40;
  var GRID_MAX = 2000;
  var GRID_COLS = 91;
  var INTERVAL_BELOW = 200;
  var PHOTOS_MAX = 2;

  // Интервал Wilson: где может быть настоящая доля при k из n. Числа от 0 до 1.
  function wilson(k, n) {
    var p = k / n;
    var den = 1 + Z * Z / n;
    var mid = (p + Z * Z / (2 * n)) / den;
    var half = Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n)) / den;
    return [k === 0 ? 0 : Math.max(0, mid - half), k === n ? 1 : Math.min(1, mid + half)];
  }

  // Доля по-русски: 11,1%. Ноль и сто только когда это правда.
  function percent(x) {
    if (x > 0 && x < 0.0005) return '<0,1%';
    if (x < 1 && x > 0.9995) return '>99,9%';
    return (x * 100).toFixed(1).replace(/\.0$/, '').replace('.', ',') + '%';
  }

  function formFor(n) {
    return n <= SQUARES_MAX ? 'squares' : n <= GRID_MAX ? 'grid' : 'bar';
  }

  function axisMax(hi) {
    return hi <= 0.25 ? 25 : hi <= 0.5 ? 50 : 100;
  }

  function toInt(v) {
    var s = String(v).trim();
    return /^-?\d+$/.test(s) && Number.isSafeInteger(+s) ? +s : NaN;
  }

  // Текст ошибки или null, если данные годятся.
  function checkShare(k, n) {
    var K = toInt(k), N = toInt(n);
    if (isNaN(K) || isNaN(N)) return 'v-share: k и n должны быть целыми числами (k=' + k + ', n=' + n + ')';
    if (N < 1) return 'v-share: n должно быть не меньше 1 (n=' + n + ')';
    if (K < 0) return 'v-share: k меньше 0 (k=' + k + ')';
    if (K > N) return 'v-share: k больше n (k=' + k + ', n=' + n + ')';
    return null;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { wilson: wilson, percent: percent, formFor: formFor, axisMax: axisMax, checkShare: checkShare };
  }
  if (typeof customElements === 'undefined' || customElements.get('v-share')) return;

  var FONTS = 'https://fonts.googleapis.com/css2?family=Onest:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap';
  var MONO = '"JetBrains Mono",var(--font-mono,monospace)';
  var CSS = [
    'v-panel,v-photos,v-share,v-item,v-photo{--v1:var(--text-primary,#8a8a8a);--v2:var(--text-secondary,#8a8a8a);--v3:var(--text-muted,#8a8a8a);--vb:var(--border,#8a8a8a40);--vs:var(--border-strong,#8a8a8a66);--vc:var(--surface-1,transparent);--va:var(--text-tint-aqua,#1f9e93);font-family:Onest,var(--font-sans,system-ui,sans-serif);overflow-wrap:anywhere}',
    'v-panel{display:block;container-type:inline-size;border:.5px solid var(--vs);border-radius:14px;padding:2px 18px;background:var(--vc)}',
    'v-share,v-item{display:grid;grid-template-columns:168px minmax(0,1fr);gap:20px;padding:16px 0;border-bottom:.5px solid var(--vb)}',
    'v-share:last-child,v-item:last-child{border-bottom:0}',
    '.v-h{font-size:15px;font-weight:500;color:var(--v1);margin:0}',
    '.v-h+.v-c{margin-top:4px}',
    '.v-pill{display:inline-flex;gap:5px;align-items:center;font-size:12px;line-height:1.2;padding:4px 9px 4px 7px;border-radius:999px;max-width:100%;box-sizing:border-box}',
    '.v-pill svg{width:13px;height:13px;flex:none}',
    '.v-good{color:var(--text-tint-green,#2e9e5b);background:var(--bg-tint-green-opaque,#2e9e5b1f)}',
    '.v-info{color:var(--text-tint-blue,#3b82c4);background:var(--bg-tint-blue-opaque,#3b82c41f)}',
    '.v-calm{color:var(--text-tint-violet,#8b6fc9);background:var(--bg-tint-violet-opaque,#8b6fc91f)}',
    '.v-bad{color:var(--text-tint-red,#c0392b);background:var(--bg-tint-red-opaque,#c0392b1f)}',
    'v-panel+v-photos{margin-top:8px}',
    'v-photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:8px}',
    'v-photo{display:grid;grid-template-columns:132px minmax(0,1fr);gap:14px;padding:10px;border:.5px solid var(--vs);border-radius:14px;background:var(--vc)}',
    'v-photo img{display:block;width:132px;height:176px;object-fit:cover;border-radius:8px}',
    'v-photo .v-h{margin-top:4px}',
    'v-photo .v-h+.v-c{margin-top:6px}',
    'v-photo .v-pill{margin-top:10px}',
    '.v-l{font-size:12px;line-height:1.4;color:var(--v2)}',
    '.v-n{font-family:' + MONO + ';font-size:32px;line-height:1.15;margin-top:6px;letter-spacing:-.02em;color:var(--v1)}',
    '.v-n span{display:inline-block;font-size:16px;color:var(--v2);margin-left:2px}',
    '.v-c{font-size:13px;line-height:1.5;color:var(--v2);margin:8px 0 0}',
    '.v-u{display:flex;flex-wrap:wrap;align-items:center;gap:4px}',
    '.v-u i{width:12px;height:12px;border-radius:3px;background:var(--vs);display:block}',
    '.v-u i.on{background:var(--va)}',
    '.v-g{display:block;width:100%}',
    '.v-g .on{fill:var(--va)}',
    '.v-g .off{fill:var(--vs)}',
    '.v-bar{height:8px;border-radius:4px;background:var(--vs);overflow:hidden}',
    '.v-bar span{display:block;height:100%;background:var(--va)}',
    '.v-ci{position:relative;height:6px;margin-top:12px;background:var(--vb);border-radius:3px}',
    '.v-ci span{position:absolute;top:0;bottom:0;background:color-mix(in srgb,var(--va) 40%,transparent);border-radius:3px}',
    '.v-ci em{position:absolute;top:-3px;width:2px;height:12px;background:var(--va)}',
    '.v-cl{display:flex;justify-content:space-between;font-family:' + MONO + ';font-size:11px;color:var(--v3);margin-top:4px}',
    '.v-err{grid-column:1/-1;font-family:' + MONO + ';font-size:12px;line-height:1.4;color:var(--text-tint-red,#c0392b);background:var(--bg-tint-red-opaque,#c0392b1f);border-radius:8px;padding:8px 10px}',
    '@container (max-width:484px){v-share,v-item{grid-template-columns:minmax(0,1fr);gap:10px}}'
  ].join('');

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONTS;
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(link, style);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Большие числа с пробелом: 100 000.
  function group(x) {
    return x < 10000 ? String(x) : String(x).replace(/\B(?=(\d{3})+$)/g, ' ');
  }

  function labelled(node, k, n) {
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', k + ' из ' + n);
    return node;
  }

  // Один квадрат = одна единица, k штук горят.
  var FORMS = {
    squares: function (k, n) {
      var box = labelled(el('div', 'v-u'), k, n);
      for (var i = 0; i < n; i++) box.appendChild(el('i', i < k ? 'on' : ''));
      return box;
    },
    grid: function (k, n) {
      var NS = 'http://www.w3.org/2000/svg';
      var rows = Math.ceil(n / GRID_COLS);
      var svg = labelled(document.createElementNS(NS, 'svg'), k, n);
      svg.setAttribute('class', 'v-g');
      svg.setAttribute('viewBox', '0 0 ' + (GRID_COLS * 5 - 2) + ' ' + (rows * 5 - 2));
      [['on', 0, k], ['off', k, n]].forEach(function (part) {
        var d = '';
        for (var i = part[1]; i < part[2]; i++) d += 'M' + (i % GRID_COLS) * 5 + ' ' + Math.floor(i / GRID_COLS) * 5 + 'h3v3h-3z';
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('class', part[0]);
        path.setAttribute('d', d);
        svg.appendChild(path);
      });
      return svg;
    },
    bar: function (k, n) {
      var bar = labelled(el('div', 'v-bar'), k, n);
      var fill = el('span');
      fill.style.width = k / n * 100 + '%';
      if (k > 0) fill.style.minWidth = '2px';
      bar.appendChild(fill);
      return bar;
    }
  };

  // Полоса интервала: шкала 25, 50 или 100%, метка на самой доле.
  function interval(k, n, lo, hi) {
    var max = axisMax(hi);
    var box = el('div');
    var ci = el('div', 'v-ci');
    var band = el('span');
    band.style.left = lo / max * 10000 + '%';
    band.style.width = (hi - lo) / max * 10000 + '%';
    var mark = el('em');
    mark.style.left = 'min(' + k / n / max * 10000 + '%,calc(100% - 2px))';
    ci.append(band, mark);
    var axis = el('div', 'v-cl');
    axis.append(el('span', '', '0'), el('span', '', percent(max / 200)), el('span', '', max + '%'));
    box.append(ci, axis);
    return box;
  }

  // Рисует, когда дети уже разобраны: скрипт может стоять и до тегов, и после.
  class Block extends HTMLElement {
    connectedCallback() {
      if (this.hasAttribute('data-v')) return;
      this.setAttribute('data-v', '');
      var self = this;
      var go = function () { self.fill(); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
      else queueMicrotask(go);
    }
    fail(message) {
      this.textContent = '';
      this.appendChild(el('div', 'v-err', message));
    }
  }

  class VShare extends Block {
    fill() {
      var k = this.getAttribute('k'), n = this.getAttribute('n');
      var bad = checkShare(k, n);
      if (bad) return this.fail(bad);
      k = +k;
      n = +n;
      var text = this.textContent.trim();
      var left = el('div');
      var number = el('div', 'v-n', group(k));
      number.appendChild(el('span', '', '/' + group(n)));
      left.append(el('div', 'v-l', this.getAttribute('label') || ''), number);
      var right = el('div');
      right.appendChild(FORMS[formFor(n)](k, n));
      var line = percent(k / n);
      if (n < INTERVAL_BELOW) {
        var bounds = wilson(k, n);
        right.appendChild(interval(k, n, bounds[0], bounds[1]));
        line += ', реальная доля где-то между ' + percent(bounds[0]).replace('%', '') + ' и ' + percent(bounds[1]) + '.';
      } else {
        line += '.';
      }
      right.appendChild(el('p', 'v-c', text ? line + ' ' + text : line));
      this.textContent = '';
      this.append(left, right);
    }
  }

  // Цвет и иконка пилюли: tone значит смысл, а не украшение.
  var TONES = {
    good: 'M5 12l5 5l10 -10',
    info: 'M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0M12 9h.01M11 12h1v4h1',
    calm: 'M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0M12 7v5l3 3',
    bad: 'M18 6l-12 12M6 6l12 12'
  };

  function checkCard(name, heading, tone) {
    if (!heading) return name + ': нет heading';
    if (!Object.prototype.hasOwnProperty.call(TONES, tone)) return name + ': неизвестный tone (' + tone + '), можно good, info, calm, bad';
    return null;
  }

  function pill(tag, tone) {
    var NS = 'http://www.w3.org/2000/svg';
    var box = el('span', 'v-pill v-' + tone);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', TONES[tone]);
    svg.appendChild(path);
    box.append(svg, tag);
    return box;
  }

  class VItem extends Block {
    fill() {
      var heading = this.getAttribute('heading'), tag = this.getAttribute('tag'), tone = this.getAttribute('tone') || 'calm';
      var bad = checkCard('v-item', heading, tone);
      if (bad) return this.fail(bad);
      var text = this.textContent.trim();
      var left = el('div');
      if (tag) left.appendChild(pill(tag, tone));
      var right = el('div');
      right.appendChild(el('h3', 'v-h', heading));
      if (text) right.appendChild(el('p', 'v-c', text));
      this.textContent = '';
      this.append(left, right);
    }
  }

  class VPhoto extends Block {
    fill() {
      var siblings = this.parentElement ? this.parentElement.querySelectorAll(':scope > v-photo') : [];
      if (Array.prototype.indexOf.call(siblings, this) >= PHOTOS_MAX) return this.fail('v-photos: максимум ' + PHOTOS_MAX + ' фото, это лишнее');
      var src = this.getAttribute('src'), heading = this.getAttribute('heading'), tag = this.getAttribute('tag'), tone = this.getAttribute('tone') || 'calm';
      if (!/^data:image\//.test(src || '')) return this.fail('v-photo: src должен начинаться с data:image/');
      var bad = checkCard('v-photo', heading, tone);
      if (bad) return this.fail(bad);
      var text = this.textContent.trim();
      var img = el('img');
      img.src = src;
      img.alt = heading;
      var side = el('div');
      side.appendChild(el('h3', 'v-h', heading));
      if (text) side.appendChild(el('p', 'v-c', text));
      if (tag) side.appendChild(pill(tag, tone));
      this.textContent = '';
      this.append(img, side);
    }
  }

  customElements.define('v-share', VShare);
  customElements.define('v-item', VItem);
  customElements.define('v-photo', VPhoto);
})();
