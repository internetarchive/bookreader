import {
  html,
  fixture,
  expect,
  fixtureCleanup,
} from '@open-wc/testing';
import sinon from 'sinon';
import '../../../../src/BookNavigator/downloads/downloads';


const downloads = [
  {
    type: "PDF",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.pdf",
    note: "PDF files contain high quality images of pages."
  },
  {
    type: "ePub",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.epub",
    note: "ePub files are smaller in size, but may contain errors."
  }
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
  it('sets default properties', async () => {
    const el = await fixture(container(downloads));
    await el.updateComplete;

    expect(el.downloads.length).to.equal(2);
    expect(el.shadowRoot.querySelector("ul").childElementCount).to.equal(2);
    expect(el.isBookProtected).to.equal(false);

    expect(el.shadowRoot.querySelector("ul li a").innerHTML).to.include("Get PDF");
  });
});
