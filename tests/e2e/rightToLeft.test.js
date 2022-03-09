import { runBaseTests } from './helpers/base';
import { runRightToLeftTests } from './helpers/rightToLeft';
import params from './helpers/params';

import BookReader from './models/BookReader';

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
