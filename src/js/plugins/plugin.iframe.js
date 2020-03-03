/**
 * Plugin for two-way communication between a BookReader in an IFrame and the
 * parent web page
 */
(function setUpIframePlugin() {
    var constMessageTypeFragmentChange = 'bookReaderFragmentChange';

    BookReader.prototype.init = (function(super_) {
        return function() {
            super_.call(this);
            attachEventListeners(this);
        };
    })(BookReader.prototype.init);

    /**
     * Using window.postMessage() and event listeners, the plugin notifies the
     * parent window when pages change, and the parent window can also
     * explicitly request a page change by sending its own message.
     *
     * @param {BookReader} br
     * @private
     */
    function attachEventListeners(br) {
        // Not embedded, abort
        if (!window.parent) {
            return;
        }

        br.bind(BookReader.eventNames.fragmentChange, function() {
            var fragment = br.fragmentFromParams(br.paramsFromCurrent());

            window.parent.postMessage(
                createWindowMessage(constMessageTypeFragmentChange, {
                    fragment: fragment
                }),
                '*'
            );
        });

        window.addEventListener('message', function updatePath(event) {
            // Not a recognized message type, abort
            if (
                !event.data ||
                event.data.type !== constMessageTypeFragmentChange
            ) {
                return;
            }

            br.updateFromParams(br.paramsFromFragment(event.data.fragment));
        });
    }

    /**
     * Create a message that can be sent to the parent window via
     * window.postMessage()
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
     *
     * @param {String} type
     * @param {Object} props
     * @returns {Object}
     * @private
     */
    function createWindowMessage(type, props) {
        const message = { type };

        Object.keys(props).forEach(function(prop) {
            message[prop] = props[prop]
        });

        return message;
    }
})();
