/**
 * Plugin for two-way communication between a BookReader in an IFrame and the
 * parent web page
 */

const MESSAGE_TYPE_FRAGMENT_CHANGE = 'bookReaderFragmentChange';

BookReader.prototype.init = (function(super_) {
    return function() {
        super_.call(this);
        attachEventListeners(this);
    };
})(BookReader.prototype.init);

/**
 * @private
 * Using window.postMessage() and event listeners, the plugin notifies the
 * parent window when pages change, and the parent window can also
 * explicitly request a page change by sending its own message.
 *
 * @param {BookReader} br
 */
function attachEventListeners(br) {
    // Not embedded, abort
    if (!window.parent) {
        return;
    }

    br.bind(BookReader.eventNames.fragmentChange, () => {
        const fragment = br.fragmentFromParams(br.paramsFromCurrent());

        window.parent.postMessage(
            { type: MESSAGE_TYPE_FRAGMENT_CHANGE, fragment },
            '*'
        );
    });

    window.addEventListener('message', event => {
        // Not a recognized message type, abort
        if (
            !event.data ||
            event.data.type !== MESSAGE_TYPE_FRAGMENT_CHANGE
        ) {
            return;
        }

        br.updateFromParams(br.paramsFromFragment(event.data.fragment));
    });
}
