QUnit.module('BookReader', function () {
  QUnit.module('switchMode() fragmentChange tests', function () {
    var triggerCalled = false;
    var br = new BookReader();
    br.trigger = function (message) {
      if (message === BookReader.eventNames.fragmentChange) {
        triggerCalled = true;
      }
    }

    // `updateFirstIndex()` also triggers the `fragmentChange` message so we want to stub that out
    br.updateFirstIndex = function () { }
    br.canSwitchToMode = function () { return true; }
    br.init()

    QUnit.test(
      'BookReader.switchMode() posts a bookReaderFragmentChange message',
      function (assert) {
        // first switch to 1up mode to make sure that we can change to 2up mode
        // if it's already in 2up mode, it won't change
        br.switchMode(BookReader.constMode1up);
        // reset our triggerCalled so we can make sure nothing else has set it unintentionally
        triggerCalled = false;
        br.switchMode(BookReader.constMode2up);
        assert.ok(triggerCalled)
      }
    );

    QUnit.test(
      'BookReader.switchMode() can suppress the bookReaderFragmentChange message',
      function (assert) {
        // we need to reset `triggerCalled` to false right before calling `switchMode` because there are
        // other calls that trigger `fragmentChange` before we get to this point in the test
        triggerCalled = false;
        br.switchMode(BookReader.constMode1up, { suppressFragmentChange: true });
        assert.notOk(triggerCalled);
      }
    );
  });

  QUnit.module('updateFirstIndex() fragmentChange tests', function () {
    var triggerCalled = false;
    var br = new BookReader();
    br.trigger = function (message) {
      if (message === BookReader.eventNames.fragmentChange) {
        triggerCalled = true;
      }
    }

    // `switchMode()` also triggers the `fragmentChange` message so we want to stub that out
    br.switchMode = function () { }
    br.currentIndex = function () { return 1; }
    br.init();

    QUnit.test(
      'BookReader.updateFirstIndex() posts a bookReaderFragmentChange message',
      function (assert) {
        // we need to reset `triggerCalled` to false right before calling `updateFirstIndex` because there are
        // other calls that trigger `fragmentChange` before we get to this point in the test
        triggerCalled = false;
        br.updateFirstIndex(1);
        assert.ok(triggerCalled)
      }
    );

    QUnit.test(
      'BookReader.updateFirstIndex() can suppress the bookReaderFragmentChange message',
      function (assert) {
        // we need to reset `triggerCalled` to false right before calling `updateFirstIndex` because there are
        // other calls that trigger `fragmentChange` before we get to this point in the test
        triggerCalled = false;
        br.updateFirstIndex(1, { suppressFragmentChange: true });
        assert.notOk(triggerCalled);
      }
    );
  });
})
