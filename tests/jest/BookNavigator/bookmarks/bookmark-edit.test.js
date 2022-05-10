import {
  html,
  fixture,
  oneEvent,
} from '@open-wc/testing-helpers';
import '@/src/BookNavigator/bookmarks/bookmark-edit.js';

const bookmarkColors = [{
  id: 0,
  className: '',
}, {
  id: 1,
  className: 'blue',
}, {
  id: 2,
  className: 'red',
}, {
  id: 3,
  className: 'green',
}, {
  id: 4,
  className: 'yellow',
}];

const container = (bookmark = {}) => (
  html`<ia-bookmark-edit .bookmark=${bookmark} .bookmarkColors=${bookmarkColors}></ia-bookmark-edit>`
);

const bookmark = {
  id: 2,
  thumbnail: '//placehold.it/37x46/06c/fff',
  page: 9,
  note: 'This is a long comment I left about this bookmark in order to test out the display in the panel on the side of the bookreader.',
  color: 0,
};

describe('<ia-bookmark-edit>', () => {
  test('sets default properties', async () => {
    const el = await fixture(container(bookmark));

    expect(el.bookmark).toEqual(bookmark);
    expect(el.renderHeader).toBeFalsy();
  });

  test('renders bookmark thumb and page number', async () => {
    const el = await fixture(container(bookmark));

    expect(el.shadowRoot.querySelector('img').getAttribute('src')).toEqual(bookmark.thumbnail);
    expect(el.shadowRoot.querySelector('h4').textContent).toEqual(`Page ${bookmark.page}`);
  });

  test('renders an optional header section', async () => {
    const el = await fixture(container(bookmark));
    el.renderHeader = true;

    await el.updateComplete;

    expect(el.shadowRoot.querySelector('header')).toBeDefined();
  });

  test('toggles rendering of the bookmark thumbnail and page number', async () => {
    const el = await fixture(container(bookmark));
    expect(el.shadowRoot.querySelector('img')).toBeDefined();
    expect(el.shadowRoot.querySelector('h4')).toBeDefined();

    el.showBookmark = false;
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('h4')).toBe(null);
  });

  test('emits a custom event when the bookmark color is changed', async () => {
    const el = await fixture(container(bookmark));

    setTimeout(() => (
      el.shadowRoot.querySelector('li input').dispatchEvent(new Event('change'))
    ));
    const response = await oneEvent(el, 'bookmarkColorChanged');

    expect(response).toBeDefined();
  });

  test('emits a custom event when the edit form is submitted', async () => {
    const el = await fixture(container(bookmark));

    setTimeout(() => (
      el.shadowRoot.querySelector('form').dispatchEvent(new Event('submit'))
    ));
    const response = await oneEvent(el, 'saveBookmark');

    expect(response).toBeDefined();
  });

  test('emits a custom event when the delete button is clicked', async () => {
    const el = await fixture(container(bookmark));

    setTimeout(() => (
      el.shadowRoot.querySelector('button').click()
    ));
    const response = await oneEvent(el, 'deleteBookmark');

    expect(response).toBeDefined();
  });

  test('updates bookmark color when a color input changed', async () => {
    const el = await fixture(container(bookmark));

    setTimeout(() => (
      el.shadowRoot.querySelector('input#color_2').dispatchEvent(new Event('change'))
    ));
    await oneEvent(el, 'bookmarkColorChanged');

    expect(el.bookmark.color).toEqual(2);
  });

  test('updates bookmark note when the note textarea changed', async () => {
    const el = await fixture(container(bookmark));
    const textarea = el.shadowRoot.querySelector('textarea');
    const updatedNote = 'New note';

    textarea.value = updatedNote;

    setTimeout(() => (
      textarea.dispatchEvent(new Event('change'))
    ));

    await oneEvent(textarea, 'change');

    expect(el.bookmark.note).toContain(updatedNote);
  });
});
