import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';
import { runDesktopSearchTests } from './helpers/desktopSearch';
// import { runMobileSearchTests } from './helpers/mobileSearch';
import params from './helpers/params';

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


  fixture `Desktop Search Tests for: ${ocaid}`
    .page `${url}`;
  runDesktopSearchTests(new BookReader());

  // Todo: deprecated, will remove once mmenu is removed.
  // fixture `Mobile Search Tests for: ${ocaid}`
  //   .page `${url}`
  // runMobileSearchTests(new BookReader());


});
