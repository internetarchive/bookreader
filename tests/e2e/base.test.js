/* global fixture */
import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';

const { BASE_URL } = process.env;
const localPages = [
  'demo-ia-plato.html',
  'demo-ia-olivertwist.html',
];

localPages.forEach(function(page) {
  const url = `${BASE_URL}${page}`;
  fixture `Base Tests for: ${page}`.page `${url}`;
  runBaseTests(new BookReader());
});
