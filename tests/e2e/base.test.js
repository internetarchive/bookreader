/* global fixture */
// import { fixture } from 'testcafe';
import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';

const localURL = 'http://127.0.0.1:8000/BookReaderDemo/';
const localPages = [
  'demo-ia-plato.html',
  'demo-ia-olivertwist.html'
];

localPages.forEach(function(page) {
  const BR = new BookReader();
  const url = `${localURL}${page}`;
  const fixtureName = `Base Tests for: ${page}`;
  // loadTest(fixtureName, url, BR);
  fixture `${fixtureName}`.page `${url}`;
  runBaseTests(BR);
})
