/**
 * Adds mobile navigation at responsive breakpoint
 * NOTE additional script and style tags must be included.
 *
 * <script src="../BookReader/mmenu/dist/js/jquery.mmenu.min.js"></script>
 * <script src="../BookReader/mmenu/dist/addons/navbars/jquery.mmenu.navbars.min.js"></script>
 * <link rel="stylesheet" href="../BookReader/mmenu/dist/css/jquery.mmenu.css" />
 * <link rel="stylesheet" href="../BookReader/mmenu/dist/addons/navbars/jquery.mmenu.navbars.css" />
 */

jQuery.extend(true, BookReader.defaultOptions, {
    enableMobileNav: true,
    mobileNavTitle: 'Internet Archive',
    mobileNavFullscreenOnly: false,
});

BookReader.prototype.setup = (function(super_) {
    return function (options) {
        super_.call(this, options);

        this.enableMobileNav = options.enableMobileNav;
        this.mobileNavTitle = options.mobileNavTitle;
        this.mobileNavFullscreenOnly = options.mobileNavFullscreenOnly;

        this.refs.$mmenu = null;
    };
})(BookReader.prototype.setup);


// Extend initToolbar
BookReader.prototype.initToolbar = (function (super_) {
    return function (mode, ui) {
        var self = this;

        if (this.enableMobileNav) {
            var $drawerEl = this.buildMobileDrawerElement();
            this.refs.$br.append($drawerEl);

            // Render info into mobile info before mmenu
            this.buildInfoDiv(this.$('.BRmobileInfo'));
            this.buildShareDiv(this.$('.BRmobileShare'));

            var $mmenuEl = $drawerEl;
            $mmenuEl.mmenu({
              navbars: [
                 { "position": "top" },
              ],
              navbar: {
                add: true,
                title: this.mobileNavTitle,
                titleLink: 'panel'
              },
              extensions: [ "panelshadow" ],
            }, {
              offCanvas: {
                wrapPageIfNeeded: false,
                zposition: 'next',
                pageSelector: this.el,
              }
            });

            var $BRpageviewField = $mmenuEl.find('.BRpageviewValue');
            $mmenuEl.data('mmenu').bind('opened', function() {
                // Update "Link to this page view" link
                if ($BRpageviewField.length)
                    $BRpageviewField.val(window.location.href);
            });

            // High contrast button
            $drawerEl.find('.high-contrast-button').click(function() {
                self.refs.$br.toggleClass('high-contrast');
            });

            // Bind mobile switch buttons
            $drawerEl.find('.DrawerLayoutButton.one_page_mode').click(function() {
                self.switchMode(self.constMode1up);
            });
            $drawerEl.find('.DrawerLayoutButton.two_page_mode').click(function() {
                self.switchMode(self.constMode2up);
            });
            $drawerEl.find('.DrawerLayoutButton.thumbnail_mode').click(function() {
                self.switchMode(self.constModeThumb);
            });

            if (this.mobileNavFullscreenOnly) {
                $(document.body).addClass('BRbodyMobileNavEnabledFullscreen');
            } else {
                $(document.body).addClass('BRbodyMobileNavEnabled');
            }

            this.refs.$mmenu = $mmenuEl;
        }

        // Call the parent method at the end, because it binds events to DOM
        super_.apply(this, arguments);


        if (this.enableMobileNav) {
            // Need to bind more, console after toolbar is initialized
            this.$('.BRmobileHamburger').click(function() {
                if ($mmenuEl.data('mmenu').getInstance().vars.opened) {
                    $mmenuEl.data('mmenu').close();
                } else {
                    $mmenuEl.data('mmenu').open();
                }
            })
        }
    };
})(BookReader.prototype.initToolbar);


BookReader.prototype.buildToolbarElement = (function (super_) {
    return function () {
        var $el = super_.call(this);
        if (this.enableMobileNav) {
            var escapedTitle = BookReader.util.escapeHTML(this.bookTitle);
            $el
            .addClass('responsive')
            .prepend($(
                   "<span class='BRmobileHamburgerWrapper'>"
                +     "<button class=\"BRmobileHamburger\"></button>"
                +     "<span class=\"BRtoolbarMobileTitle\" title=\""+escapedTitle+"\">" + this.bookTitle + "</span>"
                +   "</span>"
            ));
        }
        return $el;
    };
})(BookReader.prototype.buildToolbarElement);

/**
 * This method builds the html for the mobile drawer. It can be decorated to
 * extend the default drawer.
 * @return {jqueryElement}
 */
BookReader.prototype.buildMobileDrawerElement = function() {
    var experimentalHtml = '';
    if (this.enableExperimentalControls) {
      experimentalHtml += "<div class=\"DrawerSettingsTitle\">Experimental (may not work)</div>"
        +"        <button class='action high-contrast-button'>Toggle high contrast</button>";
    }

    var $el = $(
      "<nav id=\"BRmobileMenu\" class=\"BRmobileMenu\">"
      +"  <ul>"
      +"    <li>"
      +"      <span>"
      +"        <span class=\"DrawerIconWrapper \"><img class=\"DrawerIcon\" src=\""+this.imagesBaseURL+"icon_gear.svg\" alt=\"settings-icon\"/></span>"
      +"        Settings"
      +"      </span>"
      +"      <div class=\"DrawerSettingsWrapper\">"
      +"        <div class=\"DrawerSettingsTitle\">Page Layout</div>"
      +"        <div class=\"DrawerSettingsLayoutWrapper\">"
      +"          <button class=\"DrawerLayoutButton one_page_mode\"><img class=\"\" src=\""+this.imagesBaseURL+"icon_one_page.svg\" alt=\"Single Page\"/><br>One Page</button>"
      +"          <button class=\"DrawerLayoutButton two_page_mode TwoPagesButton\"><img class=\"\" src=\""+this.imagesBaseURL+"icon_two_pages.svg\" alt=\"Two Pages\"/><br>Two Pages</button>"
      +"          <button class=\"DrawerLayoutButton thumbnail_mode\"><img class=\"\" src=\""+this.imagesBaseURL+"icon_thumbnails.svg\" alt=\"Thumbnails\"/><br>Thumbnails</button>"
      +"        </div>"
      +"        <br>"
      +"        <div class=\"DrawerSettingsTitle\">Zoom</div>"
      +"        <button class='BRicon zoom_out'></button>"
      +"        <button class='BRicon zoom_in'></button>"
      +"        <br style='clear:both'><br><br>"
      +         experimentalHtml
      +"      </div>"
      +"    </li>"
      +"    <li class='BRmobileMenu__moreInfoRow'>"
      +"      <span>"
      +"        <span class=\"DrawerIconWrapper \"><img class=\"DrawerIcon\" src=\""+this.imagesBaseURL+"icon_info.svg\" alt=\"info-icon\"/></span>"
      +"        About This Book"
      +"      </span>"
      +"      <div class=\"BRmobileInfo\"></div>"
      +"    </li>"
      +"    <li>"
      +"      <span>"
      +"        <span class=\"DrawerIconWrapper \"><img class=\"DrawerIcon\" src=\""+this.imagesBaseURL+"icon_share.svg\" alt=\"info-share\"/></span>"
      +"        Share This Book"
      +"      </span>"
      +"      <div class=\"BRmobileShare\"></div>"
      +"    </li>"
      +"  </ul>"
      +"</nav>"
    );
    return $el;
};

/**
 * Mmenu moves itself out side of the root BookReader element, so we need to
 * include it in the scoped $ function.
 */
BookReader.prototype.$ = (function (super_) {
    return function (arg) {
        var $results = super_.call(this, arg);
        if (this.refs.$mmenu) {
            $results = $results.add(this.refs.$mmenu.find(arg));
        }
        return $results;
    };
})(BookReader.prototype.$);