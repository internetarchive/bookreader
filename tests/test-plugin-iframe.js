QUnit.config.reorder = false;

QUnit.module('iFrame and URL Plugins', function() {
    // This test should be run first — QUnit seems to break when it's run later.
    QUnit.test(
        'postMessage notification from parent updates hash',
        function(assert) {
            var done = assert.async();
            var iframe = document.querySelector('#BookReaderIframe');
            var fragment = 'page/n1/mode/2up';

            iframe.addEventListener('load', function postMessageAndVerify() {
                iframe.contentWindow.addEventListener(
                    'hashchange',
                    function verifyHash() {
                        assert.equal(
                            iframe.contentWindow.location.hash,
                            '#' + fragment,
                            'Hash must update'
                        );

                        done();
                    }
                );

                iframe.contentWindow.postMessage({
                    type: 'bookReaderFragmentChange',
                    fragment: fragment,
                }, '*');
            });
        }
    );

    QUnit.test(
        'Flipping a page notifies parent via postMessage',
        function(assert) {
            var done = assert.async();
            var iframe = document.querySelector('#BookReaderIframe');

            iframe.addEventListener('load', function flipPageAndVerify() {
                window.addEventListener(
                    'message',
                    function verifyMessage(event) {
                        assert.equal(
                            event.data.type,
                            'bookReaderFragmentChange',
                            'Type must be set to "bookReaderFragmentChange"'
                        );

                        assert.equal(
                            event.data.fragment,
                            'page/n1/mode/2up',
                            'Fragment must match current page'
                        );

                        done();
                    }
                );

                iframe.contentWindow.br.next();
            });
        }
    );
});
