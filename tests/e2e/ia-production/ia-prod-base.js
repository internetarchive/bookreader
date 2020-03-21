/* global fixture */
// import { fixture } from 'testcafe';
import { runBaseTests } from '../helpers/base';
import BookReader from '../models/BookReader';

const localURL = 'https://archive.org/details/';
const books = [
  'birdbookillustra00reedrich', // publicDomain
  // 'pianoservicingtu00rebl_0', // borrowable,
  // 'adventuresoftoms00twaiiala' // has chapter markers
];

books.forEach(function(page) {
  const BR = new BookReader();
  const url = `${localURL}${page}`;
  const fixtureName = `Archive.org BR Base Tests for: ${page}`;
  // loadTest(fixtureName, url, BR);
  fixture `${fixtureName}`.page `${url}`;
  runBaseTests(BR);
})
