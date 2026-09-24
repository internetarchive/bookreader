// @ts-check
import { EVENTS } from '../BookReader/events.js';
import { BookReaderPlugin } from '../BookReaderPlugin.js';

const MESSAGE_TYPE_FRAGMENT_CHANGE = 'bookReaderFragmentChange';

/**
 * Plugin for two-way communication between a BookReader in an IFrame and the
 * parent web page. Using window.postMessage() and event listeners, the
 * plugin notifies the parent window when pages change, and the parent
 * window can also explicitly request a page change by sending its own
 * message.
 */
export class IframePlugin extends BookReaderPlugin {
  options = {
    enabled: true,
  }

  /** @override */
  init() {
    // Not enabled, or not embedded, abort
    if (!this.options.enabled || !window.parent) {
      return;
    }

    this.br.bind(EVENTS.fragmentChange, () => {
      const fragment = this.br.fragmentFromParams(this.br.paramsFromCurrent());

      window.parent.postMessage(
        { type: MESSAGE_TYPE_FRAGMENT_CHANGE, fragment },
        '*',
      );
    });

    window.addEventListener('message', event => {
      // Not a recognized message type, abort
      if (!event.data || event.data.type !== MESSAGE_TYPE_FRAGMENT_CHANGE) {
        return;
      }

      this.br.updateFromParams(this.br.paramsFromFragment(event.data.fragment));
    });
  }
}

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);
BookReader?.registerPlugin('iframe', IframePlugin);
