/**
 * Language Switcher Component for BookReader
 * 
 * This component provides a dropdown menu for users to switch between
 * available languages in the BookReader interface.
 */

import { i18n, LANGUAGES } from './index.js';

export class LanguageSwitcher {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showNativeNames: true,
      showLanguageCodes: false,
      position: 'toolbar', // 'toolbar', 'navbar', 'settings'
      ...options
    };
    
    this.currentLanguage = i18n.getLanguage();
    this.availableLanguages = i18n.getAvailableLanguages();
    
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    const languageSelector = document.createElement('div');
    languageSelector.className = 'BRlanguageSwitcher';
    languageSelector.innerHTML = this.getLanguageSelectorHTML();
    
    this.container.appendChild(languageSelector);
    this.element = languageSelector;
  }

  getLanguageSelectorHTML() {
    const currentLang = this.availableLanguages[this.currentLanguage];
    const currentName = this.options.showNativeNames 
      ? currentLang.nativeName 
      : currentLang.name;

    let html = `
      <div class="BRlanguageSelector">
        <button class="BRlanguageButton" type="button" aria-label="${i18n.t('settings.language')}">
          <span class="BRlanguageIcon">🌐</span>
          <span class="BRlanguageText">${currentName}</span>
          <span class="BRlanguageArrow">▼</span>
        </button>
        <div class="BRlanguageDropdown" style="display: none;">
          <ul class="BRlanguageList">
    `;

    Object.entries(this.availableLanguages).forEach(([code, lang]) => {
      const isSelected = code === this.currentLanguage;
      const displayName = this.options.showNativeNames ? lang.nativeName : lang.name;
      const languageCode = this.options.showLanguageCodes ? ` (${code})` : '';
      
      html += `
        <li class="BRlanguageItem ${isSelected ? 'BRlanguageItem--selected' : ''}">
          <button class="BRlanguageOption" data-language="${code}" type="button">
            <span class="BRlanguageName">${displayName}${languageCode}</span>
            ${isSelected ? '<span class="BRlanguageCheck">✓</span>' : ''}
          </button>
        </li>
      `;
    });

    html += `
          </ul>
        </div>
      </div>
    `;

    return html;
  }

  bindEvents() {
    const button = this.element.querySelector('.BRlanguageButton');
    const dropdown = this.element.querySelector('.BRlanguageDropdown');
    const options = this.element.querySelectorAll('.BRlanguageOption');

    // Toggle dropdown
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Handle language selection
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const languageCode = e.currentTarget.dataset.language;
        this.changeLanguage(languageCode);
        this.closeDropdown();
      });
    });

    // Keyboard navigation
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleDropdown();
      } else if (e.key === 'Escape') {
        this.closeDropdown();
      }
    });

    // Handle dropdown keyboard navigation
    dropdown.addEventListener('keydown', (e) => {
      const items = Array.from(this.element.querySelectorAll('.BRlanguageOption'));
      const currentIndex = items.findIndex(item => item === document.activeElement);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          items[nextIndex].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          items[prevIndex].focus();
          break;
        case 'Escape':
          this.closeDropdown();
          button.focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          e.currentTarget.click();
          break;
      }
    });
  }

  toggleDropdown() {
    const dropdown = this.element.querySelector('.BRlanguageDropdown');
    const isVisible = dropdown.style.display !== 'none';
    
    if (isVisible) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    const dropdown = this.element.querySelector('.BRlanguageDropdown');
    const button = this.element.querySelector('.BRlanguageButton');
    
    dropdown.style.display = 'block';
    button.setAttribute('aria-expanded', 'true');
    
    // Focus first option
    const firstOption = dropdown.querySelector('.BRlanguageOption');
    if (firstOption) {
      firstOption.focus();
    }
  }

  closeDropdown() {
    const dropdown = this.element.querySelector('.BRlanguageDropdown');
    const button = this.element.querySelector('.BRlanguageButton');
    
    dropdown.style.display = 'none';
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  }

  changeLanguage(languageCode) {
    if (i18n.setLanguage(languageCode)) {
      this.currentLanguage = languageCode;
      
      // Update the UI
      this.updateLanguageDisplay();
      
      // Trigger a custom event for other components to listen to
      const event = new CustomEvent('BookReader:LanguageChanged', {
        detail: { language: languageCode }
      });
      document.dispatchEvent(event);
      
      // Store preference in localStorage
      try {
        localStorage.setItem('BookReader:language', languageCode);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  updateLanguageDisplay() {
    const currentLang = this.availableLanguages[this.currentLanguage];
    const currentName = this.options.showNativeNames 
      ? currentLang.nativeName 
      : currentLang.name;
    
    const languageText = this.element.querySelector('.BRlanguageText');
    if (languageText) {
      languageText.textContent = currentName;
    }
    
    // Update selected state in dropdown
    const options = this.element.querySelectorAll('.BRlanguageOption');
    options.forEach(option => {
      const isSelected = option.dataset.language === this.currentLanguage;
      const item = option.closest('.BRlanguageItem');
      const check = option.querySelector('.BRlanguageCheck');
      
      if (isSelected) {
        item.classList.add('BRlanguageItem--selected');
        if (!check) {
          option.innerHTML += '<span class="BRlanguageCheck">✓</span>';
        }
      } else {
        item.classList.remove('BRlanguageItem--selected');
        if (check) {
          check.remove();
        }
      }
    });
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return this.availableLanguages;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Factory function to create language switcher
export function createLanguageSwitcher(container, options = {}) {
  return new LanguageSwitcher(container, options);
}

// Auto-initialize language from localStorage or browser preference
export function initializeLanguage() {
  try {
    // Try to get saved language preference
    const savedLanguage = localStorage.getItem('BookReader:language');
    if (savedLanguage && i18n.isLanguageSupported(savedLanguage)) {
      i18n.setLanguage(savedLanguage);
      return;
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // Fall back to browser language detection
  const browserLanguage = navigator.language || navigator.userLanguage;
  if (browserLanguage) {
    const shortCode = browserLanguage.split('-')[0];
    if (i18n.isLanguageSupported(shortCode)) {
      i18n.setLanguage(shortCode);
      return;
    }
  }

  // Default to English
  i18n.setLanguage('en');
}

