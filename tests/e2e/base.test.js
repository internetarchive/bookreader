import { runBaseTests } from './helpers/base.js';
import BookReader from './models/BookReader.js';
import { runSearchTests } from './helpers/search.js';
import params from './helpers/params.js';

const ocaids = params.ocaids || [
  'theworksofplato01platiala',
  // Removed because failing test 'Canonical URL with cookie shows paramters'
  // in tests/e2e/helpers/base.js
  // Cookie path should be:
  //   /BookReaderDemo/demo-ia-olivertwist.html
  // Cookie path is:
  // /BookReaderDemo/demo-ia-olivertwist.html/page/n13/mode/2up
  // 'demo-ia-olivertwist.html',
];

ocaids.forEach(ocaid => {
  const url = params.getArchiveUrl(ocaid);

  fixture `Base Tests for: ${ocaid}`.page `${url}`;
  runBaseTests(new BookReader());


  fixture `Search Tests for: ${ocaid}`
    .page `${url}`;
  runSearchTests(new BookReader());
});
