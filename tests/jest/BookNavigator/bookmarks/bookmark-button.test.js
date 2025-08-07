import {
  html,
  fixtureSync,
  fixtureCleanup,
} from '@open-wc/testing-helpers';
import '@/src/BookNavigator/bookmarks/bookmark-button.js';
import sinon from 'sinon';

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('<bookmark-button>', () => {
  test('sets default properties', async () => {
    const el = fixtureSync(html`<bookmark-button></bookmark-button>`);

    expect(el.side).toBeUndefined();
    expect(el.state).toEqual('hollow');
  });
  test('Event: fires `@bookmarkButtonClicked on click', async () => {
    const el = fixtureSync(html`<bookmark-button></bookmark-button>`);
    let buttonClicked = false;
    el.addEventListener('bookmarkButtonClicked', () => { buttonClicked = true; });
    const eventStub = { preventDefault: sinon.fake()};
    el.handleClick(eventStub);
    await el.updateComplete;

    expect(buttonClicked).toBeTruthy();
    expect(eventStub.preventDefault.callCount).toEqual(1);
  });
  test('Title: Toggles title between `Add/Remove bookmark`', async () => {
    const el = fixtureSync(html`<bookmark-button></bookmark-button>`);
    expect(el.title).toEqual('Add bookmark');
    expect(el.state).toEqual('hollow');

    el.state = 'filled';
    await el.updateComplete;

    expect(el.title).toEqual('Remove bookmark');
    expect(el.state).not.toEqual('hollow');
  });
});
