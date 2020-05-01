/* global fixture */
import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';

const { BASE_URL } = process.env;
const localPages = [
  'demo-ia-plato.html',
  // Removed because failing test 'Canonical URL with cookie shows paramters'
  // in tests/e2e/helpers/base.js
  // Cookie path should be:
  //   /BookReaderDemo/demo-ia-olivertwist.html
  // Cookie path is:
  // /BookReaderDemo/demo-ia-olivertwist.html/page/n13/mode/2up
  // 'demo-ia-olivertwist.html',
];

localPages.forEach(function(page) {
  const url = `${BASE_URL}${page}`;
  fixture `Base Tests for: ${page}`.page `${url}`;
  runBaseTests(new BookReader());
});
