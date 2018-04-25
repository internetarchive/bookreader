QUnit.module('URL Plugin', function() {
  QUnit.test(
    'postMessage notification from parent updates hash',
    function(assert) {
      var done = assert.async();
      var iframe = document.querySelector('#BookReaderIframe');

      iframe.addEventListener('load', function postMessageAndVerify() {
        iframe.contentWindow.postMessage({
          'type': 'bookReaderPathChange',
          'path': 'page/n1/mode/2up',
        }, '*');

        setTimeout(function() {
          assert.equal(
            iframe.contentWindow.location.hash,
            '#page/n1/mode/2up',
            'Hash must update'
          );
          done();
        }, 500);
      });
    }
  );

  QUnit.test(
    'Flipping a page notifies parent via postMessage',
    function(assert) {
      var done = assert.async();
      var iframe = document.querySelector('#BookReaderIframe');

      iframe.addEventListener('load', function flipPageAndVerify() {
        window.addEventListener('message', function verifyMessage(event) {
          assert.equal(
            event.data.type,
            'bookReaderPathChange',
            'Type must be set to "bookReaderPathChange"'
          );

          assert.equal(
            event.data.path,
            'page/n1/mode/2up',
            'Path must match current page'
          );

          done();
        });
        iframe.contentWindow.br.next();
      });
    }
  );
});
