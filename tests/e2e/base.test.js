/* global fixture */
import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';
import { runDesktopSearchTests } from './helpers/desktopSearch';
import { runMobileSearchTests } from './helpers/mobileSearch';


const { BASE_URL } = process.env;
const idBooks = [
  'theworksofplato01platiala',
  // Removed because failing test 'Canonical URL with cookie shows paramters'
  // in tests/e2e/helpers/base.js
  // Cookie path should be:
  //   /BookReaderDemo/demo-ia-olivertwist.html
  // Cookie path is:
  // /BookReaderDemo/demo-ia-olivertwist.html/page/n13/mode/2up
  // 'demo-ia-olivertwist.html',
];
const genericDemo = 'demo-generic.html?getbookid='

idBooks.forEach(function(book) {
  const url = `${BASE_URL}${genericDemo}${book}`;

  fixture `Base Tests for: ${book}`.page `${url}`;
  runBaseTests(new BookReader());

  fixture `Desktop Search Tests for: ${book}`
    .page `${url}`
  runDesktopSearchTests(new BookReader());

  fixture `Mobile Search Tests for: ${book}`
    .page `${url}`
  runMobileSearchTests(new BookReader());


});
