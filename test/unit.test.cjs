'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { wilson, percent, formFor, axisMax, checkShare, unknownAttrs } = require('../viz.js');

test('wilson: 3 из 27 округляется до 3,9 и 28,1', () => {
  const [lo, hi] = wilson(3, 27);
  assert.equal(percent(lo), '3,9%');
  assert.equal(percent(hi), '28,1%');
});

test('wilson: на краях ровно 0 и 1, а не почти', () => {
  assert.equal(wilson(0, 27)[0], 0);
  assert.equal(wilson(27, 27)[1], 1);
  assert.ok(wilson(0, 27)[1] > 0);
  assert.ok(wilson(27, 27)[0] < 1);
});

test('percent: запятая, одна цифра, без лишнего нуля', () => {
  assert.equal(percent(3 / 27), '11,1%');
  assert.equal(percent(0), '0%');
  assert.equal(percent(0.5), '50%');
  assert.equal(percent(1), '100%');
});

test('percent: ноль и сто только когда это правда', () => {
  assert.equal(percent(7 / 100000), '<0,1%');
  assert.equal(percent(99999 / 100000), '>99,9%');
  assert.equal(percent(1999 / 2000), '>99,9%');
  assert.equal(percent(3998 / 4000), '>99,9%');
});

test('unknownAttrs: чужие атрибуты видны, data-* не считаются', () => {
  assert.deepEqual(unknownAttrs(['label', 'k', 'n', 'data-v'], ['label', 'k', 'n']), []);
  assert.deepEqual(unknownAttrs(['heading', 'ромашка"', 'title'], ['heading', 'tag', 'tone']), ['ромашка"', 'title']);
});

test('formFor: границы 40 и 2000', () => {
  assert.equal(formFor(1), 'squares');
  assert.equal(formFor(40), 'squares');
  assert.equal(formFor(41), 'grid');
  assert.equal(formFor(2000), 'grid');
  assert.equal(formFor(2001), 'bar');
});

test('axisMax: шкала 25, 50 или 100 по верхней границе', () => {
  assert.equal(axisMax(0.2), 25);
  assert.equal(axisMax(0.25), 25);
  assert.equal(axisMax(0.281), 50);
  assert.equal(axisMax(0.5), 50);
  assert.equal(axisMax(0.9), 100);
});

test('checkShare: хорошие данные без ошибки', () => {
  assert.equal(checkShare(3, 27), null);
  assert.equal(checkShare('3', '27'), null);
  assert.equal(checkShare(0, 1), null);
  assert.equal(checkShare(27, 27), null);
});

test('checkShare: k больше n', () => {
  assert.equal(checkShare(30, 27), 'v-share: k больше n (k=30, n=27)');
});

test('checkShare: n = 0', () => {
  assert.match(checkShare(0, 0), /n должно быть не меньше 1/);
});

test('checkShare: k меньше нуля', () => {
  assert.match(checkShare(-1, 27), /k меньше 0/);
});

test('checkShare: не числа и пропуски', () => {
  assert.match(checkShare('много', 27), /целыми/);
  assert.match(checkShare(3, null), /целыми/);
  assert.match(checkShare('', 27), /целыми/);
});

test('checkShare: дробные', () => {
  assert.match(checkShare(1.5, 27), /целыми/);
  assert.match(checkShare('3', '27.5'), /целыми/);
});

test('order-last: те же блоки, что в галерее, скрипт после них', () => {
  const line = '<script src="../viz.js"></script>\n';
  const gallery = fs.readFileSync(path.join(__dirname, 'gallery.html'), 'utf8');
  const last = fs.readFileSync(path.join(__dirname, 'order-last.html'), 'utf8');
  assert.equal(last.replace(line, ''), gallery.replace(line, ''));
  assert.ok(last.indexOf(line) > last.lastIndexOf('class="case"'));
});
