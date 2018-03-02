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
    onePageMinBreakpoint: 800,
});

BookReader.prototype.setup = (function(super_) {
    return function (options) {
        super_.call(this, options);

        this.enableMobileNav = options.enableMobileNav;
        this.mobileNavTitle = options.mobileNavTitle;
        this.onePageMinBreakpoint = options.onePageMinBreakpoint;

        this.mmenu = null;
    };
})(BookReader.prototype.setup);


// Extend initToolbar
BookReader.prototype.initToolbar = (function (super_) {
    return function (mode, ui) {
        if (ui == 'embed') {
            return;
        }
        var self = this;

        if (this.enableMobileNav) {
            var $drawerEl = this.buildMobileDrawerElement();
            $('body').append($drawerEl);

            // Render info into mobile info before mmenu
            this.buildInfoDiv($('#mobileInfo'));
            this.buildShareDiv($('#mobileShare'));

            var $mmenuEl = $('nav#BRmobileMenu');
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
            this.mmenu = $mmenuEl;

            // High contrast button
            $drawerEl.find('.high-contrast-button').click(function() {
                $('body').toggleClass('high-contrast');
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
        }

        // Call the parent method at the end, because it binds events to DOM
        super_.apply(this, arguments);
    };
})(BookReader.prototype.initToolbar);


BookReader.prototype.buildToolbarElement = (function (super_) {
    return function () {
        var $el = super_.call(this);
        if (this.enableMobileNav) {
            var escapedTitle = BookReader.util.escapeHTML(this.bookTitle);
            $el.addClass('responsive');
            $el.prepend($(
                   "<span class='BRmobileHamburgerWrapper'>"
                +     "<span class=\"hamburger\"><a href=\"#BRmobileMenu\"></a></span>"
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

    return $(
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
      +"      <div id=\"mobileInfo\"></div>"
      +"    </li>"
      +"    <li>"
      +"      <span>"
      +"        <span class=\"DrawerIconWrapper \"><img class=\"DrawerIcon\" src=\""+this.imagesBaseURL+"icon_share.svg\" alt=\"info-share\"/></span>"
      +"        Share This Book"
      +"      </span>"
      +"      <div id=\"mobileShare\"></div>"
      +"    </li>"
      +"  </ul>"
      +"</nav>"
    );
};
