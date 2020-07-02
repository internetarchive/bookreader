/* global fixture */
import { runBaseTests } from './helpers/base';
import { runRightToLeftTests } from './helpers/rightToLeft';

import BookReader from './models/BookReader';

const { BASE_URL } = process.env;
const DEMO_PATH = 'demo-internetarchive.html?ocaid=';
const OCAIDS = [
  'gendaitankashu00meijuoft', // Right to Left book
];

OCAIDS.forEach(ocaid => {
  const url = `${BASE_URL}${DEMO_PATH}${ocaid}`;

  fixture `Base Tests for right to left book: ${ocaid}`.page `${url}`;
  runBaseTests(new BookReader());

  fixture `Specific Tests for right to left book: ${ocaid}`.page `${url}`;
  runRightToLeftTests(new BookReader());
});
