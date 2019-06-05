QUnit.module('Autoplay plugin', function() {
  var br = new BookReader();
  var defaults = {
    flipSpeed: 'fast',
    flipDelay: 5000
  };
  var overrides = {
    flipSpeed: 1000,
    flipDelay: 2000
  };
  br.init();

  QUnit.test('autoToggle updates instance properties flipSpeed and flipDelay', function(assert) {
    var compareProps = function(obj) {
      Object.keys(defaults).forEach(function(prop) {
        assert.equal(br[prop], obj[prop], prop + ' was not updated in autoplay plugin');
      });
    };

    compareProps(defaults);
    br.autoToggle(overrides);
    compareProps(overrides);
  });
});
