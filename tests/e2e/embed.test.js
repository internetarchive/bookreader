import { runBaseTests } from './helpers/base';
import BookReader from './models/BookReader';
import { runDesktopSearchTests } from './helpers/desktopSearch';
import { runMobileSearchTests } from './helpers/mobileSearch';


const { BASE_URL } = process.env;
const DEMO_PATH  = 'demo-embed.html'

  const url = `${BASE_URL}${DEMO_PATH }`;

  fixture `Base Tests for: demo-embed`.page `${url}`;
  runBaseTests(new BookReader());

  fixture `Desktop Search Tests for: embed`
    .page `${url}`
  runDesktopSearchTests(new BookReader());

  fixture `Mobile Search Tests for: demp-embed`
    .page `${url}`
  runMobileSearchTests(new BookReader());