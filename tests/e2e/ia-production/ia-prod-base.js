/* global fixture */
import { runBaseTests } from '../helpers/base';
import BookReader from '../models/BookReader';

const localURL = 'https://archive.org/details/';
const books = [
  'birdbookillustra00reedrich', // publicDomain
  // 'pianoservicingtu00rebl_0', // borrowable,
  // 'adventuresoftoms00twaiiala', // has chapter markers
  // 'gendaitankashu00meijuoft', // Right to Left book
  // 'gov.uspto.patents.application.10074026', // multiple files
];

books.forEach(function(page) {
  const url = `${localURL}${page}`;
  fixture `Archive.org BR Base Tests for: ${page}`.page `${url}`;
  runBaseTests(new BookReader());
});
