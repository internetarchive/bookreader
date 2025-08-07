import {
  html,
  fixture,
  fixtureCleanup,
} from '@open-wc/testing-helpers';
import sinon from 'sinon';
import '@/src/BookNavigator/downloads/downloads.js';


const downloads = [
  {
    type: "PDF",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.pdf",
    note: "PDF files contain high quality images of pages.",
  },
  {
    type: "ePub",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.epub",
    note: "ePub files are smaller in size, but may contain errors.",
  },
];


const container = (downloads) => (
  html`
    <ia-book-downloads .downloads=${downloads}></ia-book-downloads>
  `
);

beforeEach(() => {
  const body = document.querySelector('body');
  const brHook = document.createElement('div');
  brHook.setAttribute('id', 'BookReader');
  body.appendChild(brHook);
});

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('<ia-book-downloads>', () => {
  test('sets default properties', async () => {
    const el = await fixture(container(downloads));
    await el.updateComplete;

    expect(el.downloads.length).toEqual(2);
    expect(el.shadowRoot.querySelector("ul").childElementCount).toEqual(2);
    expect(el.isBookProtected).toEqual(false);

    expect(el.shadowRoot.querySelector("ul li a").textContent).toContain("Get PDF");
  });
});
