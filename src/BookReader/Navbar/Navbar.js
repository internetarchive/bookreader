// @ts-check
/** @typedef {import("../../BookReader.js").default} BookReader */

import 'jquery-ui/ui/widget.js';
import 'jquery-ui/ui/widgets/mouse.js';
import 'jquery-ui/ui/widgets/slider.js';
import { EVENTS } from '../events.js';
import { throttle } from '../utils.js';

export class Navbar {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    this.br = br;

    /** @type {JQuery} */
    this.$root = null;
    /** @type {JQuery} */
    this.$nav = null;
    /** @type {number} */
    this.maxPageNum = null;

    /** @type {Object} controls will be switch over "this.maximumControls" */
    this.minimumControls = [
      'toggle_slider', 'viewmode',
    ];
    /** @type {Object} controls will be switch over "this.minimumControls" */
    this.maximumControls = [
      'BRnavpos', 'book_left', 'book_right', 'zoom_in', 'zoom_out', 'onepg', 'twopg', 'thumb',
    ];

    this.updateNavIndexThrottled = throttle(this.updateNavIndex.bind(this), 250, false);
  }

  /**
   * Enable dictionary mode
   */
  enableDictionaryMode() {
    console.log('Dictionary mode enabled');
    
    // Add visual indicator
    this.br.refs.$brContainer.addClass('dictionary-mode-active');
    
    // Show helper message
    this.showDictionaryModeMessage();
    
    // Enable text selection on all text layers
    this.enableTextLayers();
    
    // Bind double-click handler to text elements
    this.br.refs.$brContainer.on('dblclick.dictionary', '.BRwordElement, .BRlineElement', (event) => {
      event.stopPropagation();
      this.handleWordSelection(event);
    });
    
    // Also handle regular click for single word selection
    this.br.refs.$brContainer.on('click.dictionary', '.BRwordElement', (event) => {
      const word = $(event.target).text().trim();
      if (word && word.length > 0) {
        // Show definition on single click too
        this.showDefinition(word, event.pageX, event.pageY);
      }
    });
  }

  /**
   * Disable dictionary mode
   */
  disableDictionaryMode() {
    console.log('Dictionary mode disabled');
    this.br.refs.$brContainer.removeClass('dictionary-mode-active');
    this.br.refs.$brContainer.off('dblclick.dictionary click.dictionary');
    this.closeDictionaryModeMessage();
    this.closeDefinitionPopup();
    this.disableTextLayers();
  }

  /**
   * Enable text layers for selection
   */
  enableTextLayers() {
    // Enable pointer events on all text layers
    $('.BRtextLayer').css({
      'pointer-events': 'auto',
      'user-select': 'text',
      '-webkit-user-select': 'text',
      '-moz-user-select': 'text',
      'z-index': '10'
    });
    
    // Make words clickable
    $('.BRwordElement, .BRlineElement').css({
      'cursor': 'pointer',
      'user-select': 'text',
      '-webkit-user-select': 'text'
    });
    
    // Disable pointer events on page images
    $('.BRpageimage').css('pointer-events', 'none');
    
    console.log('Text layers enabled:', $('.BRtextLayer').length);
  }

  /**
   * Disable text layers
   */
  disableTextLayers() {
    $('.BRtextLayer').css({
      'pointer-events': 'none',
      'user-select': 'none',
      'z-index': '2'
    });
    
    $('.BRpageimage').css('pointer-events', 'auto');
  }

  /**
   * Show dictionary mode helper message
   */
  showDictionaryModeMessage() {
    const message = $(`
      <div class="dictionary-mode-overlay">
        <div class="dictionary-mode-message">
          <strong>Dictionary Mode Active</strong>
          <div class="dictionary-mode-hint">Click any word to see its definition</div>
        </div>
      </div>
    `);
    
    this.br.refs.$brContainer.append(message);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      message.fadeOut(300, function() { $(this).remove(); });
    }, 3000);
  }

  /**
   * Close dictionary mode message
   */
  closeDictionaryModeMessage() {
    $('.dictionary-mode-overlay').remove();
  }

  /**
   * Handle word selection
   */
  handleWordSelection(event) {
    // Get the clicked element
    const $target = $(event.target);
    let word = '';
    
    // Try to get word from the clicked element
    if ($target.hasClass('BRwordElement')) {
      word = $target.text().trim();
    } else if ($target.hasClass('BRlineElement')) {
      // If clicking on line, try to get selected text
      const selection = window.getSelection();
      word = selection.toString().trim();
      
      // If no selection, get the whole line's first word
      if (!word) {
        word = $target.find('.BRwordElement').first().text().trim();
      }
    } else {
      // Fallback: try to get any selection
      const selection = window.getSelection();
      word = selection.toString().trim();
    }
    
    // Validate word (single word only)
    if (word && word.split(' ').length === 1) {
      console.log('Looking up word:', word);
      this.showDefinition(word, event.pageX, event.pageY);
    } else if (word) {
      console.log('Multi-word selection detected, showing first word');
      const firstWord = word.split(' ')[0];
      this.showDefinition(firstWord, event.pageX, event.pageY);
    }
  }

  /**
   * Show definition for a word
   */
  async showDefinition(word, x, y) {
    console.log('Fetching definition for:', word);
    
    // Show loading indicator
    this.showLoadingPopup(word, x, y);
    
    try {
      // Detect language
      const language = await this.detectLanguage(word);
      console.log('Detected language:', language);
      
      // Get definition
      const definition = await this.getDefinition(word, language);
      
      // Close loading and show definition
      this.closeDefinitionPopup();
      this.displayDefinitionPopup(word, definition, language, x, y);
    } catch (error) {
      console.error('Error getting definition:', error);
      this.closeDefinitionPopup();
      this.showErrorPopup(word, x, y);
    }
  }

  /**
   * Show loading popup
   */
  showLoadingPopup(word, x, y) {
    const popup = $(`
      <div class="dictionary-popup" style="left: ${x}px; top: ${y}px;">
        <div class="dictionary-popup-header">
          <strong>${word}</strong>
          <button class="close-popup">×</button>
        </div>
        <div class="dictionary-popup-body">
          <div class="definition">Loading definition...</div>
        </div>
      </div>
    `);
    
    $('body').append(popup);
    popup.find('.close-popup').on('click', () => this.closeDefinitionPopup());
  }

  /**
   * Show error popup
   */
  showErrorPopup(word, x, y) {
    const popup = $(`
      <div class="dictionary-popup" style="left: ${x}px; top: ${y}px;">
        <div class="dictionary-popup-header">
          <strong>${word}</strong>
          <button class="close-popup">×</button>
        </div>
        <div class="dictionary-popup-body">
          <div class="definition">Could not find definition. Please try another word.</div>
        </div>
      </div>
    `);
    
    $('body').append(popup);
    popup.find('.close-popup').on('click', () => this.closeDefinitionPopup());
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text) {
    // Check for non-ASCII characters to detect non-English text
    const hasNonEnglish = /[^\x00-\x7F]+/.test(text);
    
    // Check for specific language patterns
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi/Devanagari
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'; // Japanese
    
    return 'en'; // Default to English
  }

  /**
   * Get definition from dictionary API
   */
  async getDefinition(word, language) {
    try {
      console.log(`Fetching definition for "${word}" in language "${language}"`);
      
      // Use Free Dictionary API for English
      if (language === 'en') {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        
        if (!response.ok) {
          throw new Error('Word not found');
        }
        
        const data = await response.json();
        
        if (data && data[0]) {
          const entry = data[0];
          const meaning = entry.meanings[0];
          
          return {
            word: entry.word,
            phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
            partOfSpeech: meaning.partOfSpeech,
            definition: meaning.definitions[0].definition,
            example: meaning.definitions[0].example || '',
            synonyms: meaning.synonyms?.slice(0, 3) || []
          };
        }
      }
      
      // For other languages, return a simple response
      return {
        word: word,
        phonetic: '',
        partOfSpeech: 'word',
        definition: `Translation service for ${language} coming soon. This is the word: ${word}`,
        example: '',
        synonyms: []
      };
      
    } catch (error) {
      console.error('Dictionary API error:', error);
      throw error;
    }
  }

  /**
   * Display definition popup
   */
  displayDefinitionPopup(word, definition, language, x, y) {
    // Remove existing popup
    this.closeDefinitionPopup();
    
    if (!definition) {
      this.showErrorPopup(word, x, y);
      return;
    }
    
    // Adjust position to keep popup on screen
    const popupWidth = 350;
    const popupHeight = 300;
    
    if (x + popupWidth > window.innerWidth) {
      x = window.innerWidth - popupWidth - 20;
    }
    if (y + popupHeight > window.innerHeight) {
      y = window.innerHeight - popupHeight - 20;
    }
    
    const popup = $(`
      <div class="dictionary-popup" style="left: ${x}px; top: ${y}px;">
        <div class="dictionary-popup-header">
          <strong>${definition.word}</strong>
          ${definition.phonetic ? `<span class="phonetic">${definition.phonetic}</span>` : ''}
          <button class="close-popup">×</button>
        </div>
        <div class="dictionary-popup-body">
          <div class="part-of-speech">${definition.partOfSpeech}</div>
          <div class="definition">${definition.definition}</div>
          ${definition.example ? `<div class="example"><em>"${definition.example}"</em></div>` : ''}
          ${definition.synonyms.length ? `<div class="synonyms">Synonyms: ${definition.synonyms.join(', ')}</div>` : ''}
        </div>
        <div class="dictionary-popup-footer">
          <button class="speak-btn">🔊 Pronounce</button>
          ${language !== 'en' ? '<button class="translate-btn">Translate</button>' : ''}
        </div>
      </div>
    `);
    
    $('body').append(popup);
    
    // Event handlers
    popup.find('.close-popup').on('click', () => this.closeDefinitionPopup());
    popup.find('.speak-btn').on('click', () => this.speakWord(word, language));
    
    if (language !== 'en') {
      popup.find('.translate-btn').on('click', () => this.translateWord(word, language));
    }
    
    // Close on outside click
    $(document).on('click.dictionary-popup', (e) => {
      if (!$(e.target).closest('.dictionary-popup').length && 
          !$(e.target).closest('.BRwordElement').length &&
          !$(e.target).closest('.BRlineElement').length) {
        this.closeDefinitionPopup();
      }
    });
  }

  /**
   * Close definition popup
   */
  closeDefinitionPopup() {
    $('.dictionary-popup').remove();
    $(document).off('click.dictionary-popup');
  }

  /**
   * Speak word using Web Speech API
   */
  speakWord(word, language) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = language === 'en' ? 'en-US' : language;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      console.log('Speaking word:', word, 'in language:', utterance.lang);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  }

  /**
   * Translate word
   */
  async translateWord(word, sourceLang) {
    try {
      const targetLang = 'en'; // Translate to English
      
      // Show loading in popup
      const $translateBtn = $('.translate-btn');
      $translateBtn.text('Translating...').prop('disabled', true);
      
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await response.json();
      
      if (data.responseData && data.responseData.translatedText) {
        // Add translation to popup
        const translationDiv = $(`
          <div class="translation">
            <strong>Translation:</strong> ${data.responseData.translatedText}
          </div>
        `);
        $('.dictionary-popup-body').append(translationDiv);
        $translateBtn.text('✓ Translated').css('background', '#4CAF50');
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      $('.translate-btn').text('Translation failed').prop('disabled', false);
    }
  }

  /**
   * @param {string} controlName
   * @param {Object} optionOverrides
   */
  controlFor(controlName, optionOverrides = null) {
    const brOption = this.br.options.controls[controlName];
    const option = Object.assign({},brOption, optionOverrides);
    if (!option.visible) { return ''; }
    if (option.template) {
      return `<li>${option.template(this.br)}</li>`;
    }
    return `<li>
      <button class="BRicon ${option.className}" title="${option.label}">
        <div class="icon icon-${option.iconClassName}"></div>
        <span class="BRtooltip">${option.label}</span>
      </button>
    </li>`;
  }

  /** @private */
  _renderControls() {
    return [
      'toggleSlider',
      'bookLeft',
      'bookRight',
      'onePage',
      'twoPage',
      'thumbnail',
      'viewmode',
      'zoomOut',
      'zoomIn',
      'fullScreen',
    ].map((mode) => (
      this.controlFor(mode)
    )).join('');
  }

  /** @private */
  _bindViewModeButton() {
    const { br } = this;
    const viewModeOptions = br.options.controls.viewmode;
    const viewModes = [{
      mode: br.constMode1up,
      className: 'onepg',
      title: 'One-page view',
    }, {
      mode: br.constMode2up,
      className: 'twopg',
      title: 'Two-page view',
    }, {
      mode: br.constModeThumb,
      className: 'thumb',
      title: 'Thumbnail view',
    }].filter((mode) => (
      !viewModeOptions.excludedModes.includes(mode.mode)
    ));
    const viewModeOrder = viewModes.map((m) => m.mode);

    if (viewModeOptions.excludedModes.includes(br.mode)) {
      br.switchMode(viewModeOrder[0]);
    }

    // Reorder the viewModeOrder so the current view mode is at the end
    const currentModeIndex = viewModeOrder.indexOf(br.mode);
    for (let i = 0; i <= currentModeIndex; i++) {
      viewModeOrder.push(viewModeOrder.shift());
    }

    if (viewModes.length < 2) {
      this.$nav.find(`.${viewModeOptions.className}`).remove();
    }

    this.br.bind(EVENTS.PostInit, () => {
      const $button = this.$nav.find(`.${viewModeOptions.className}`)
        .off('.bindNavigationHandlers')
        .on('click', (e) => {
          const nextModeID = viewModeOrder.shift();
          const newViewMode = viewModes.find((m) => m.mode === nextModeID);
          const nextViewMode = viewModes.find((m) => m.mode === viewModeOrder[0]);

          viewModeOrder.push(nextModeID);
          br.viewModeOrder = viewModeOrder;
          this.updateViewModeButton($(e.currentTarget), nextViewMode.className, nextViewMode.title);
          br.switchMode(newViewMode.mode);
        });
      const currentViewModeButton = viewModes.find((m) => m.mode === viewModeOrder[0]);
      this.updateViewModeButton(
        $button,
        currentViewModeButton.className,
        currentViewModeButton.title,
      );
    });
  }

  bindControlClickHandlers() {
    const jIcons = this.$nav.find('.BRicon');

    // Map of jIcon class -> click handler
    const navigationControls = {
      toggle_slider: () => {
        this.br.toggleSlider();
      },
      book_left: () => {
        this.br.trigger(EVENTS.stop);
        this.br.left();
      },
      book_right: () => {
        this.br.trigger(EVENTS.stop);
        this.br.right();
      },
      book_top: this.br.first.bind(this.br),
      book_bottom: this.br.last.bind(this.br),
      book_leftmost: this.br.leftmost.bind(this.br),
      book_rightmost: this.br.rightmost.bind(this.br),
      onepg: () => {
        this.br.switchMode('1up');
      },
      thumb: () => {
        this.br.switchMode('thumb');
      },
      twopg: () => {
        this.br.switchMode('2up');
      },
      zoom_in: () => {
        this.br.trigger(EVENTS.stop);
        this.br.zoom(1);
        this.br.trigger(EVENTS.zoomIn);
      },
      zoom_out: () => {
        this.br.trigger(EVENTS.stop);
        this.br.zoom(-1);
        this.br.trigger(EVENTS.zoomOut);
      },
      full: () => {
        if (this.br.ui == 'embed') {
          const url = this.br.$('.BRembedreturn a').attr('href');
          window.open(url);
        } else {
          this.br.toggleFullscreen();
        }
      },
    };

    // custom event for auto-loan-renew in ia-book-actions
    // - to know if user is actively reading
    this.$nav.find('nav.BRcontrols li button').on('click', () => {
      this.br.trigger(EVENTS.userAction);
    });

    for (const control in navigationControls) {
      jIcons.filter(`.${control}`).on('click.bindNavigationHandlers', () => {
        navigationControls[control]();
        return false;
      });
    }
  }

  /**
   * Toggle viewmode button to change page view
   */
  updateViewModeButton($button, iconClass, tooltipText) {
    $button
      .attr('title', tooltipText)
      .find('.icon')
      .removeClass()
      .addClass(`icon icon-${iconClass}`)
      .end()
      .find('.BRtooltip')
      .text(tooltipText);
  }

  /**
   * Switch navbar controls on mobile and desktop
   */
  switchNavbarControls() {
    // we don't want navbar controls switching with liner-notes
    if (this.br.options.bookType !== 'linerNotes') {
      if (this.br.refs.$brContainer.prop('clientWidth') < 640) {
        this.showMobileControls();
      } else {
        this.showDesktopControls();
      }
    }
  }

  /**
   * Switch Book controls to mobile mode
   * NOTE: `this.minimumControls`, `this.maximumControls`, and .BRnavMobile switch on resize
   */
  showMobileControls() {
    this.minimumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.maximumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.add('hide');
    });
    const mobileNav = document.querySelector(`.BRnavMobile`);
    if (mobileNav) mobileNav.classList.remove('hide');
  }

  /**
   * Switch Book controls to desktop mode
   * NOTE: `this.minimumControls`, `this.maximumControls`, and .BRnavMobile switch on resize
   */
  showDesktopControls() {
    this.maximumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.minimumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.add('hide');
    });
    const mobileNav = document.querySelector(`.BRnavMobile`);
    if (mobileNav) mobileNav.classList.add('hide');
  }

  /**
   * Initialize the navigation bar (bottom)
   * @return {JQuery}
   */
  init() {
    const { br } = this;
    const { navbarTitle: title } = br.options;
    const isRTL = br.pageProgression === 'rl';
    const bookFlipLeft = isRTL ? 'book_flip_next' : 'book_flip_prev';
    const bookFlipRight = isRTL ? 'book_flip_prev' : 'book_flip_next';

    this.br.options.controls['bookLeft'].className = `book_left ${bookFlipLeft}`;
    this.br.options.controls['bookRight'].className = `book_right ${bookFlipRight}`;

    br.refs.$BRfooter = this.$root = $(`<div class="BRfooter"></div>`);
    br.refs.$BRnav = this.$nav = $(
      `<div class="BRnav BRnavMobile docked">
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <nav class="BRcontrols">
            <ul class="controls">
              <li class="scrubber">
                <div class="BRnavpos">
                  <div class="BRpager"></div>
                  <div class="BRnavline"></div>
                </div>
              </li>
              ${this.controlFor('bookLeft', {visible: true})}
              ${this.controlFor('bookRight', {visible: true})}
            </ul>
          </nav>
        </div>
        <div class="BRnav BRnavMain">
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <nav class="BRcontrols">
            <ul class="controls">
              <li class="dictionary-button">
                <label>
                  <input type="checkbox" class="dictionary-checkbox" />
                  <span>Dictionary Mode</span>
                </label>
              </li>
              <li class="scrubber">
                <p>
                  <span class="BRcurrentpage"></span>
                </p>
                <div class="BRnavpos hide">
                  <div class="BRpager"></div>
                  <div class="BRnavline"></div>
                </div>
              </li>
              ${this._renderControls()}
            </ul>
          </nav>
        </div>`);

    this.$root.append(this.$nav);
    br.refs.$br.append(this.$root);

    // IMPORTANT: Bind checkbox handler AFTER the element is added to DOM
    // Wait for next tick to ensure DOM is ready
    setTimeout(() => {
      const $checkbox = this.$root.find('.dictionary-checkbox');
      console.log('Dictionary checkbox found:', $checkbox.length > 0);
      
      $checkbox.on('change', (e) => {
        const isChecked = $(e.currentTarget).is(':checked');
        console.log('Dictionary mode checkbox changed:', isChecked);
        
        if (isChecked) {
          this.enableDictionaryMode();
        } else {
          this.disableDictionaryMode();
        }
      });
      
      // Also log when text layers are rendered
      br.on('textLayerRendered', (e, data) => {
        console.log('Text layer rendered for page:', data.pageIndex);
        
        // If dictionary mode is active, enable this new text layer
        if (this.$root.find('.dictionary-checkbox').is(':checked')) {
          setTimeout(() => {
            this.enableTextLayers();
          }, 100);
        }
      });
    }, 100);

    /** @type {JQuery} sliders */
    const $sliders = this.$root.find('.BRpager').slider({
      animate: true,
      min: 0,
      max: br.book.getNumLeafs() - 1,
      value: br.currentIndex(),
      range: "min",
    });

    $sliders.on('slide', (event, ui) => {
      this.updateNavPageNum(ui.value);
      return true;
    });

    $sliders.on('slidechange', (event, ui) => {
      this.updateNavPageNum(ui.value);
      // recursion prevention for jumpToIndex
      if ($(event.currentTarget).data('swallowchange')) {
        $(event.currentTarget).data('swallowchange', false);
      } else {
        br.jumpToIndex(ui.value);
      }
      return true;
    });

    br.options.controls.viewmode.visible && this._bindViewModeButton();
    this.updateNavPageNum(br.currentIndex());

    return this.$nav;
  }

  /**
  * Returns the textual representation of the current page for the navbar
  * @param {number} index
  * @return {string}
  */
  getNavPageNumString(index) {
    const { br } = this;
    // Accessible index starts at 0 (alas) so we add 1 to make human
    const pageNum = br.book.getPageNum(index);
    const pageType = br.book.getPageProp(index, 'pageType');
    const numLeafs = br.book.getNumLeafs();

    if (!this.maxPageNum) {
      // Calculate Max page num (used for pagination display)
      let maxPageNum = 0;
      let pageNumVal;
      for (let i = 0; i < numLeafs; i++) {
        pageNumVal = parseFloat(br.book.getPageNum(i));
        if (!isNaN(pageNumVal) && pageNumVal > maxPageNum) {
          maxPageNum = pageNumVal;
        }
      }
      this.maxPageNum = maxPageNum;
    }

    return getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.maxPageNum);
  }

  /**
   * Renders the navbar string to the DOM
   * @param {number} index
   */
  updateNavPageNum(index) {
    this.$root.find('.BRcurrentpage').html(this.getNavPageNumString(index, true));
  }

  /**
   * Update the nav bar display - does not cause navigation.
   * @param {number} index
   */
  updateNavIndex(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.br.currentIndex();
    this.$root.find('.BRpager').data('swallowchange', true).slider('value', index);
  }
}

/**
 * Renders the html for the page string
 * @param {number} index
 * @param {number} numLeafs
 * @param {number|string} pageNum
 * @param {*} pageType - Deprecated
 * @param {number} maxPageNum
 * @return {string}
 */
export function getNavPageNumHtml(index, numLeafs, pageNum, pageType, maxPageNum) {
  let pageString = '';

  // If page number is not numeric, show leaf index
  if (isNaN(pageNum)) {
    pageString = `Page ${index + 1} of ${numLeafs}`;
  } else {
    pageString = `Page ${pageNum} of ${maxPageNum}`;
  }

  return `
    <span class="BRcurrentpage-text">
      ${pageString}
    </span>
  `;
}
