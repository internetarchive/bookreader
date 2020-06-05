/* global fixture */
import { runBaseTests } from './helpers/base';
import { runRightToLeftTests } from './helpers/RtL';

import BookReader from './models/BookReader';

const localURL = 'https://archive.org/details/';
const books = [
  'gendaitankashu00meijuoft', // Right to Left book
];

books.forEach(function(page) {
  const url = `${localURL}${page}`;

  fixture `Base Tests for right to left book: ${page}`.page `${url}`;
  runBaseTests(new BookReader());

  fixture `Specific Tests for right to left book: ${page}`.page `${url}`;
  runRightToLeftTests(new BookReader());
});
