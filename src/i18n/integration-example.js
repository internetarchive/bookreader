/**
 * BookReader i18n Integration Example
 * 
 * This file demonstrates how to integrate the language switcher
 * into the BookReader interface.
 */

import { createLanguageSwitcher } from './LanguageSwitcher.js';

/**
 * Integrate language switcher into BookReader toolbar
 * @param {BookReader} br - BookReader instance
 */
export function integrateLanguageSwitcher(br) {
  // Wait for BookReader to be fully initialized
  br.bind('BookReader:PostInit', () => {
    // Find the toolbar right section
    const toolbarRight = br.$('.BRtoolbarRight');
    
    if (toolbarRight.length > 0) {
      // Create language switcher in toolbar
      const toolbarSwitcher = createLanguageSwitcher(toolbarRight[0], {
        position: 'toolbar',
        showNativeNames: true
      });
      
      // Store reference for later use
      br.languageSwitcher = toolbarSwitcher;
      
      console.log('Language switcher integrated into toolbar');
    }
  });
}

/**
 * Integrate language switcher into BookReader navbar
 * @param {BookReader} br - BookReader instance
 */
export function integrateLanguageSwitcherInNavbar(br) {
  // Wait for BookReader to be fully initialized
  br.bind('BookReader:PostInit', () => {
    // Find the navbar controls section
    const navbarControls = br.$('.BRcontrols');
    
    if (navbarControls.length > 0) {
      // Create language switcher in navbar
      const navbarSwitcher = createLanguageSwitcher(navbarControls[0], {
        position: 'navbar',
        showNativeNames: true
      });
      
      // Store reference for later use
      br.navbarLanguageSwitcher = navbarSwitcher;
      
      console.log('Language switcher integrated into navbar');
    }
  });
}

/**
 * Integrate language switcher into both toolbar and navbar
 * @param {BookReader} br - BookReader instance
 */
export function integrateLanguageSwitcherEverywhere(br) {
  integrateLanguageSwitcher(br);
  integrateLanguageSwitcherInNavbar(br);
}

/**
 * Example of how to use the i18n system in custom components
 * @param {BookReader} br - BookReader instance
 */
export function createCustomI18nComponent(br) {
  // Wait for BookReader to be fully initialized
  br.bind('BookReader:PostInit', () => {
    // Create a custom component that uses i18n
    const customComponent = document.createElement('div');
    customComponent.className = 'BRcustomComponent';
    customComponent.innerHTML = `
      <h3>${br.i18n.t('book.title')}</h3>
      <p>${br.i18n.t('book.author')}: ${br.bookTitle || 'Unknown'}</p>
      <button class="BRcustomButton">${br.i18n.t('action.save')}</button>
    `;
    
    // Add to BookReader
    br.refs.$br.append(customComponent);
    
    // Listen for language changes to update the component
    document.addEventListener('BookReader:LanguageChanged', () => {
      customComponent.innerHTML = `
        <h3>${br.i18n.t('book.title')}</h3>
        <p>${br.i18n.t('book.author')}: ${br.bookTitle || 'Unknown'}</p>
        <button class="BRcustomButton">${br.i18n.t('action.save')}</button>
      `;
    });
  });
}

/**
 * Example of how to create a settings panel with language options
 * @param {BookReader} br - BookReader instance
 */
export function createLanguageSettingsPanel(br) {
  // Wait for BookReader to be fully initialized
  br.bind('BookReader:PostInit', () => {
    // Create settings panel
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'BRsettingsPanel';
    settingsPanel.style.display = 'none';
    
    const currentLang = br.i18n.getLanguage();
    const availableLanguages = br.i18n.getAvailableLanguages();
    
    let languageOptions = '';
    Object.entries(availableLanguages).forEach(([code, lang]) => {
      const isSelected = code === currentLang ? 'selected' : '';
      languageOptions += `<option value="${code}" ${isSelected}>${lang.nativeName}</option>`;
    });
    
    settingsPanel.innerHTML = `
      <div class="BRsettingsContent">
        <h3>${br.i18n.t('settings.language')}</h3>
        <select id="languageSelect" class="BRlanguageSelect">
          ${languageOptions}
        </select>
        <button class="BRsettingsClose">${br.i18n.t('action.close')}</button>
      </div>
    `;
    
    // Add to BookReader
    br.refs.$br.append(settingsPanel);
    
    // Handle language selection
    const languageSelect = settingsPanel.querySelector('#languageSelect');
    languageSelect.addEventListener('change', (e) => {
      const newLanguage = e.target.value;
      br.i18n.setLanguage(newLanguage);
      
      // Update BookReader options
      br.options.interfaceLanguage = newLanguage;
      
      // Store preference
      try {
        localStorage.setItem('BookReader:language', newLanguage);
      } catch (e) {
        // Ignore localStorage errors
      }
    });
    
    // Handle close button
    const closeButton = settingsPanel.querySelector('.BRsettingsClose');
    closeButton.addEventListener('click', () => {
      settingsPanel.style.display = 'none';
    });
    
    // Store reference for later use
    br.languageSettingsPanel = settingsPanel;
    
    console.log('Language settings panel created');
  });
}

/**
 * Example of how to add a language switcher button to the toolbar
 * @param {BookReader} br - BookReader instance
 */
export function addLanguageSwitcherButton(br) {
  // Wait for BookReader to be fully initialized
  br.bind('BookReader:PostInit', () => {
    // Find the toolbar right section
    const toolbarRight = br.$('.BRtoolbarRight');
    
    if (toolbarRight.length > 0) {
      // Create language switcher button
      const languageButton = document.createElement('button');
      languageButton.className = 'BRpill language-switcher-btn';
      languageButton.innerHTML = '🌐';
      languageButton.title = br.i18n.t('settings.language');
      
      // Add to toolbar
      toolbarRight.prepend(languageButton);
      
      // Handle click to show settings panel
      languageButton.addEventListener('click', () => {
        if (br.languageSettingsPanel) {
          br.languageSettingsPanel.style.display = 'block';
        }
      });
      
      console.log('Language switcher button added to toolbar');
    }
  });
}

/**
 * Complete integration example
 * @param {BookReader} br - BookReader instance
 */
export function completeIntegration(br) {
  // Add language switcher to toolbar
  integrateLanguageSwitcher(br);
  
  // Create language settings panel
  createLanguageSettingsPanel(br);
  
  // Add language switcher button
  addLanguageSwitcherButton(br);
  
  // Create custom i18n component
  createCustomI18nComponent(br);
  
  console.log('Complete i18n integration completed');
}

// Export all functions for use in other modules
export {
  integrateLanguageSwitcher,
  integrateLanguageSwitcherInNavbar,
  integrateLanguageSwitcherEverywhere,
  createCustomI18nComponent,
  createLanguageSettingsPanel,
  addLanguageSwitcherButton,
  completeIntegration
};

