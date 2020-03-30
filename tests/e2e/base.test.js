/* global fixture */
import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';
import { LOCAL_URL } from './constants';

const localPages = [
  'demo-ia-plato.html',
  // 'demo-ia-olivertwist.html'
];

localPages.forEach(function(page) {
  const url = `${LOCAL_URL}${page}`;
  fixture `Base Tests for: ${page}`.page `${url}`;
  runBaseTests(new BookReader());
});
