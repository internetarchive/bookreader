/**
 * Plugin which adds an autoplay feature. Useful for kiosk situations.
 */

jQuery.extend(BookReader.defaultOptions, {
  enableAutoPlayPlugin: true,
});

BookReader.prototype.setup = (function(super_) {
  return function (options) {
    super_.call(this, options);

    this.auto      = false;
    this.autoTimer = null;
  };
})(BookReader.prototype.setup);


BookReader.prototype.init = (function(super_) {
  return function (options) {
    super_.call(this, options);

    if (!this.options.enableAutoPlayPlugin) return;

    this.bind(BookReader.eventNames.stop, function(e, br) {
      br.autoStop();
    });
  };
})(BookReader.prototype.init);


BookReader.prototype.bindNavigationHandlers = (function(super_) {
  return function() {
    super_.call(this);

    if (!this.options.enableAutoPlayPlugin) return;

    var self = this;

    // Note the mobile plugin attaches itself to body, so we need to select outside
    var jIcons = this.$('.BRicon').add('.BRmobileMenu .BRicon');

    jIcons.filter('.play').click(function(e) {
      self.autoToggle();
      return false;
    });

    jIcons.filter('.pause').click(function(e) {
      self.autoToggle();
      return false;
    });
  };
})(BookReader.prototype.bindNavigationHandlers);

/**
 * Starts autoplay mode
 * TODO move to a plugin
 */
BookReader.prototype.autoToggle = function() {
  if (!this.options.enableAutoPlayPlugin) return;

  this.trigger(BookReader.eventNames.stop);

  var bComingFrom1up = false;
  if (this.constMode2up != this.mode) {
    bComingFrom1up = true;
    this.switchMode(this.constMode2up);
  }

  // Change to autofit if book is too large
  if (this.reduce < this.twoPageGetAutofitReduce()) {
    this.zoom2up('auto');
  }

  var self = this;
  if (null == this.autoTimer) {
    this.flipSpeed = 2000;

    // $$$ Draw events currently cause layout problems when they occur during animation.
    //     There is a specific problem when changing from 1-up immediately to autoplay in RTL so
    //     we workaround for now by not triggering immediate animation in that case.
    //     See https://bugs.launchpad.net/gnubook/+bug/328327
    if (('rl' == this.pageProgression) && bComingFrom1up) {
      // don't flip immediately -- wait until timer fires
    } else {
      // flip immediately
      this.flipFwdToIndex();
    }

    this.$('.play').hide();
    this.$('.pause').show();
    this.autoTimer = setInterval(function(){
      if (self.animating) return;

      if (Math.max(self.twoPage.currentIndexL, self.twoPage.currentIndexR) >= self.lastDisplayableIndex()) {
        self.flipBackToIndex(1); // $$$ really what we want?
      } else {
        self.flipFwdToIndex();
      }
    }, 5000);
  } else {
    this.autoStop();
  }
};

/**
* Stop autoplay mode, allowing animations to finish
*/
BookReader.prototype.autoStop = function() {
  if (!this.options.enableAutoPlayPlugin) return;

  if (null != this.autoTimer) {
    clearInterval(this.autoTimer);
    this.flipSpeed = 'fast';
    this.$('.pause').hide();
    this.$('.play').show();
    this.autoTimer = null;
  }
};