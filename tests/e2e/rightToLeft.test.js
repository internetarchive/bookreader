import { runBaseTests } from './helpers/base';
import { runRightToLeftTests } from './helpers/rightToLeft';
import { DEMOS_BASE_URL } from './helpers/params';

import BookReader from './models/BookReader';

const OCAIDS = [
  'gendaitankashu00meijuoft', // Right to Left book
];

OCAIDS.forEach(ocaid => {
  const url = `${DEMOS_BASE_URL}/BookReaderDemo/demo-internetarchive.html?ocaid=${ocaid}`;

  fixture `Base Tests for right to left book: ${ocaid}`.page `${url}`;
  runBaseTests(new BookReader({ pageProgression: 'rl' }));

  fixture `Specific Tests for right to left book: ${ocaid}`.page `${url}`;
  runRightToLeftTests(new BookReader());
});
