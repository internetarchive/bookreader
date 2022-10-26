/* global BookReader */
/**
 * Adds mobile navigation at responsive breakpoint
 */

import { debounce, escapeHTML } from '../BookReader/utils.js';
import 'jquery.mmenu/dist/js/jquery.mmenu.min.js';
import 'jquery.mmenu/dist/addons/navbars/jquery.mmenu.navbars.min.js';

//contains all filters and labels for checkboxs
const FILTERLIST = [
  {
    filter: "grayscale(100%)",
    label: "Grayscale"
  },
  {
    filter: "brightness(120%)",
    label: "High brightness"
  },
  {
    filter: "invert(100%)",
    label: "Inverted (dark mode)"
  },
  {
    filter: "contrast(120%)",
    label: "High contrast"
  },
];

jQuery.extend(BookReader.defaultOptions, {
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
    let $mmenuEl;
    if (this.enableMobileNav) {
      const $drawerEl = this.buildMobileDrawerElement();
      this.refs.$br.append($drawerEl);

      // Render info into mobile info before mmenu
      this.buildInfoDiv(this.$('.BRmobileInfo'));
      this.buildShareDiv(this.$('.BRmobileShare'));

      $mmenuEl = $drawerEl;
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

      const $BRpageviewField = $mmenuEl.find('.BRpageviewValue');
      $mmenuEl.data('mmenu').bind('opened', () => {
        // Update "Link to this page view" link
        if ($BRpageviewField.length) {
          $BRpageviewField.val(window.location.href);
        }
      });

      //apply filters when checkboxs clicked
      $drawerEl.find('.BRcheckbox-filters')
        .on("click", () => applyFilters($drawerEl, this));

      // Bind mobile switch buttons
      $drawerEl.find('.DrawerLayoutButton.one_page_mode')
        .on("click", () => this.switchMode(this.constMode1up));
      $drawerEl.find('.DrawerLayoutButton.two_page_mode')
        .on("click", () => this.switchMode(this.constMode2up));
      $drawerEl.find('.DrawerLayoutButton.thumbnail_mode')
        .on("click", () => this.switchMode(this.constModeThumb));

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
      this.$('.BRmobileHamburger').click(() => {
        if ($mmenuEl.data('mmenu').getInstance().vars.opened) {
          $mmenuEl.data('mmenu').close();
        } else {
          $mmenuEl.data('mmenu').open();
          this.trigger("mobileNavOpen");
        }
      });


      const closeMobileMenu = (e) => {
        // Need to close the mobile menu to reset DOM & Style
        // driven by menu plugin
        const width = $( window ).width();
        const mobileMenuIsOpen = $mmenuEl.data('mmenu').getInstance().vars.opened;
        // $brBreakPointMobile: 800px;
        if (mobileMenuIsOpen && (width >= 800)) {
          $mmenuEl.data('mmenu').close ();
        }
      };

      window.addEventListener('resize', debounce(closeMobileMenu, 900));
    }
  };
})(BookReader.prototype.initToolbar);


BookReader.prototype.buildToolbarElement = (function (super_) {
  return function () {
    const $el = super_.call(this);
    if (this.enableMobileNav) {
      const escapedTitle = escapeHTML(this.bookTitle);
      const toolbar = `
        <span class="BRmobileHamburgerWrapper">
          <button class="BRmobileHamburger"></button>
          <span class="BRtoolbarMobileTitle" title="${escapedTitle}">${escapedTitle}</span>
        </span>
      `;
      $el
        .addClass('responsive')
        .prepend($(toolbar));
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
  let experimentalHtml = '';
  //builds filters checkbox html
  if (this.enableExperimentalControls) {
    experimentalHtml = `
        <p class="DrawerSettingsTitle">Visual Adjustment</p>
        <div class="BRcheckbox-group-filters">
        `;
    FILTERLIST.forEach( (el, i) => {
      const checkboxHtml = `
          <input type="checkbox" class="BRcheckbox-filters" id="filter${i}">
          <label for="filter${i}" class="BRcheckbox-label-filters">${el.label}</label><br>
        
      `;
      experimentalHtml = experimentalHtml.concat(checkboxHtml);
    });
    experimentalHtml = experimentalHtml.concat("</div>");
  }


  const settingsSection = `
    <span>
        <span class="DrawerIconWrapper">
          <img class="DrawerIcon" src="${`${this.imagesBaseURL}icon_gear.svg`}" alt="settings-icon"/>
        </span>
        Settings
    </span>
    <div class=DrawerSettingsWrapper>
        <div class="DrawerSettingsLayoutWrapper">
          <button class="DrawerLayoutButton one_page_mode">
            <img src="${this.imagesBaseURL}icon_one_page.svg" alt="Single Page"/>
            <br>
            One Page
          </button>
          <button class="DrawerLayoutButton two_page_mode TwoPagesButton">
            <img src="${this.imagesBaseURL}icon_two_pages.svg" alt="Two Pages"/>
            <br>
            Two Pages
          </button>
          <button class="DrawerLayoutButton thumbnail_mode">
            <img src="${this.imagesBaseURL}icon_thumbnails.svg" alt="Thumbnails"/>
            <br>
            Thumbnails
          </button>
        </div>
        <br>
        <div class="DrawerSettingsTitle">Zoom</div>
        <button class='BRicon zoom_out'></button>
        <button class='BRicon zoom_in'></button>
        <br style="clear:both"><br><br>
        ${experimentalHtml}
    </div>
  `;
  const moreInfo = `
    <span>
        <span class="DrawerIconWrapper ">
            <img class="DrawerIcon" src="${this.imagesBaseURL}icon_info.svg" alt="info-icon"/>
        </span>
        About This Book
    </span>
    <div class="BRmobileInfo"></div>
  `;
  const share = `
    <span>
      <span class="DrawerIconWrapper">
        <img class="DrawerIcon" src="${this.imagesBaseURL}icon_share.svg" alt="info-share"/>
      </span>
      Share This Book
    </span>
    <div class="BRmobileShare"></div>
  `;
  const navMenu = `
    <nav id="BRmobileMenu" class="BRmobileMenu">
      <ul>
        <li class="BRmobileMenu__settings">${settingsSection}</li>
        <li class="BRmobileMenu__moreInfoRow">${moreInfo}</li>
        <li class="BRmobileMenu__share">${share}</li>
      </ul>
    </nav>
  `;

  const $el = $(navMenu);
  return $el;
};

/**
 * Mmenu moves itself out side of the root BookReader element, so we need to
 * include it in the scoped $ function.
 */
BookReader.prototype.$ = (function (super_) {
  return function (arg) {
    let $results = super_.call(this, arg);
    if (this.refs.$mmenu) {
      $results = $results.add(this.refs.$mmenu.find(arg));
    }
    return $results;
  };
})(BookReader.prototype.$);

/**
* Dynamically creates styles combining different filters for BookReaders imgs
* based on filters checkbox
*/
const applyFilters = (drawerEl, br) => {
  let filterStr = "";

  $('.BRcheckbox-filters').each(
    (i, el) => {
      br.refs.$br.removeClass("filter-applied");
      if ($(el).is(':checked')) {
        br.refs.$br.addClass($(el).attr("filter-applied"));
        filterStr = filterStr + FILTERLIST[i].filter;
      }
    }
  );
  const filtersSheet = $("#filtersStyle")[0] || document.createElement('style');
  filtersSheet.id = "filtersStyle";
  filtersSheet.innerHTML = `.BRpagecontainer  img {
            filter: ${filterStr};
            -webkit-filter: ${filterStr};}`;
  document.body.appendChild(filtersSheet);
};
