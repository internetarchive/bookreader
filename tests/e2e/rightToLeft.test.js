import { runBaseTests } from './helpers/base.js';
import { runRightToLeftTests } from './helpers/rightToLeft.js';
import params from './helpers/params.js';

import BookReader from './models/BookReader.js';

const ocaids = params.ocaids || [
  'gendaitankashu00meijuoft', // Right to Left book
];

ocaids.forEach(ocaid => {
  const url = `${params.getArchiveUrl(ocaid)}`;

  fixture `Base Tests for right to left book: ${ocaid}`.page `${url}`;
  runBaseTests(new BookReader({ pageProgression: 'rl' }));

  fixture `Specific Tests for right to left book: ${ocaid}`.page `${url}`;
  runRightToLeftTests(new BookReader());
});
