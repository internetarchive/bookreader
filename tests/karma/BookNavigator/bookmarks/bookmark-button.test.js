import {
  html,
  fixtureSync,
  expect,
  fixtureCleanup,
} from '@open-wc/testing';
import '../../../../src/BookNavigator/bookmarks/bookmark-button.js';
import sinon from 'sinon';

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('<bookmark-button>', () => {
  it('sets default properties', async () => {
    const el = fixtureSync(html`<bookmark-button></bookmark-button>`);

    expect(el.side).to.be.undefined;
    expect(el.state).to.equal('hollow');
  });
  it('Event: fires `@bookmarkButtonClicked on click', async () => {
    const el = fixtureSync(html`<bookmark-button></bookmark-button>`);
    let buttonClicked = false;
    el.addEventListener('bookmarkButtonClicked', () => { buttonClicked = true; });
    const eventStub = { preventDefault: sinon.fake()};
    el.handleClick(eventStub);
    await el.updateComplete;

    expect(buttonClicked).to.be.true;
    expect(eventStub.preventDefault.callCount).to.equal(1);
  });
  it('Title: Toggles title between `Add/Remove bookmark`', async () => {
    const el = fixtureSync(html`<bookmark-button></bookmark-button>`);
    expect(el.title).to.equal('Add bookmark');
    expect(el.state).to.equal('hollow');

    el.state = 'filled';
    await el.updateComplete;

    expect(el.title).to.equal('Remove bookmark');
    expect(el.state).to.not.equal('hollow');
  });
});
