/* global fixture */
import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';

const localURL = 'http://127.0.0.1:8000/BookReaderDemo/';
const localPages = [
  'demo-ia-plato.html',
  // 'demo-ia-olivertwist.html'
];

localPages.forEach(function(page) {
  const url = `${localURL}${page}`;
  fixture `Base Tests for: ${page}`.page `${url}`;
  runBaseTests(new BookReader());
});
