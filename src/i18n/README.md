# BookReader Internationalization (i18n) System

This directory contains the internationalization system for the BookReader component, providing multi-language support for all user-facing text in the interface.

## Overview

The i18n system allows BookReader to display its interface in multiple languages, automatically detecting the user's preferred language and providing a seamless multilingual experience. It follows the pattern established in the TTS plugin and extends it to cover all UI text throughout the component.

## Features

- **Multi-language Support**: Currently supports English (en) and German (de)
- **Automatic Language Detection**: Detects browser language and falls back to English
- **Persistent Preferences**: Remembers user's language choice in localStorage
- **Fallback Support**: Shows English text if translation is missing
- **Variable Interpolation**: Supports dynamic content in translations
- **Easy Extension**: Simple to add new languages
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Adapts to user's color scheme preference

## Architecture

### Core Components

1. **`index.js`** - Main i18n system with the `I18n` class
2. **`languages/`** - Language dictionaries (en.js, de.js)
3. **`LanguageSwitcher.js`** - UI component for language switching
4. **`language-switcher.css`** - Styles for the language switcher

### Key Classes

#### I18n Class

The main class that handles all translation operations:

```javascript
import { i18n } from './i18n/index.js';

// Get a translation
const text = i18n.t('nav.flipLeft');

// Get a translation with variables
const text = i18n.t('search.resultsPosition', { current: 5, total: 20 });

// Change language
i18n.setLanguage('de');

// Get available languages
const languages = i18n.getAvailableLanguages();
```

#### LanguageSwitcher Class

A UI component that provides a dropdown for language selection:

```javascript
import { createLanguageSwitcher } from './i18n/LanguageSwitcher.js';

const switcher = createLanguageSwitcher(container, {
  showNativeNames: true,
  position: 'toolbar'
});
```

## Usage

### Basic Translation

```javascript
import { i18n } from './i18n/index.js';

// Simple translation
const buttonText = i18n.t('nav.flipLeft');
// Returns: "Flip left" (English) or "Nach links blättern" (German)
```

### Translation with Variables

```javascript
// Translation with interpolation
const message = i18n.t('search.resultsCount', { count: 5 });
// Returns: "5 results" (English) or "5 Ergebnisse" (German)
```

### Language Switching

```javascript
// Change the interface language
i18n.setLanguage('de');

// Get current language
const currentLang = i18n.getLanguage(); // Returns 'de'

// Check if a language is supported
const isSupported = i18n.isLanguageSupported('fr'); // Returns false
```

### Integration with BookReader

```javascript
// In BookReader options
const options = {
  enableI18n: true,
  interfaceLanguage: 'de', // or 'en'
  // ... other options
};

const br = new BookReader(options);
```

## Language Dictionaries

### Structure

Each language dictionary is organized by functionality:

```javascript
export const en = {
  // Navigation controls
  'nav.flipLeft': 'Flip left',
  'nav.flipRight': 'Flip right',
  
  // Toolbar
  'toolbar.info': 'Info',
  'toolbar.share': 'Share',
  
  // Search functionality
  'search.results': 'Results',
  'search.previousResult': 'Previous result',
  
  // ... more categories
};
```

### Adding New Languages

To add a new language (e.g., French):

1. Create `src/i18n/languages/fr.js`:

```javascript
export const fr = {
  'nav.flipLeft': 'Tourner à gauche',
  'nav.flipRight': 'Tourner à droite',
  'toolbar.info': 'Info',
  'toolbar.share': 'Partager',
  // ... add all translations
};
```

2. Import and register in `src/i18n/index.js`:

```javascript
import { fr } from './languages/fr.js';

export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', dict: en },
  de: { name: 'German', nativeName: 'Deutsch', dict: de },
  fr: { name: 'French', nativeName: 'Français', dict: fr }, // Add this line
};
```

## Language Switcher Component

The `LanguageSwitcher` component provides a user-friendly way to switch between languages:

### Features

- Dropdown menu with all available languages
- Shows language names in native language
- Keyboard navigation support
- Accessible with proper ARIA labels
- Responsive design
- Integrates with BookReader toolbar/navbar

### Usage

```javascript
import { createLanguageSwitcher } from './i18n/LanguageSwitcher.js';

// Create in toolbar
const toolbarSwitcher = createLanguageSwitcher(
  document.querySelector('.BRtoolbarRight'),
  { position: 'toolbar' }
);

// Create in navbar
const navbarSwitcher = createLanguageSwitcher(
  document.querySelector('.BRnav'),
  { position: 'navbar' }
);
```

### Options

- `showNativeNames`: Show language names in their native language (default: true)
- `showLanguageCodes`: Show language codes alongside names (default: false)
- `position`: Position context for styling ('toolbar', 'navbar', 'settings')

## Styling

The language switcher comes with comprehensive CSS that:

- Integrates seamlessly with BookReader's design
- Supports light/dark modes
- Provides responsive design
- Includes accessibility features
- Supports high contrast mode
- Respects reduced motion preferences

## Event System

The i18n system fires events when language changes:

```javascript
// Listen for language changes
document.addEventListener('BookReader:LanguageChanged', (event) => {
  const { language } = event.detail;
  console.log(`Language changed to: ${language}`);
  
  // Update your UI components here
  updateComponentTexts();
});
```

## Browser Compatibility

The i18n system is designed to work with:

- Modern browsers (ES6+ support)
- Fallback to English for unsupported features
- Graceful degradation for older browsers

## Performance Considerations

- Language dictionaries are loaded once at initialization
- Translations are cached for fast access
- Minimal memory footprint
- Efficient variable interpolation

## Testing

To test the i18n system:

1. Open the demo file: `src/i18n/demo.html`
2. Use the language switcher to change between English and German
3. Verify that all text updates correctly
4. Test with different browser language settings

## Contributing

When adding new translations:

1. Follow the existing naming conventions
2. Use consistent terminology within each language
3. Test with native speakers when possible
4. Maintain the same structure across all language files
5. Update this README with new language information

## Future Enhancements

Potential improvements for the i18n system:

- **Pluralization Support**: Handle different plural forms across languages
- **Context-Aware Translations**: Provide context-specific translations
- **RTL Language Support**: Support right-to-left languages like Arabic and Hebrew
- **Translation Management**: Tools for managing and updating translations
- **Community Translations**: Allow community contributions for new languages

## Support

For questions or issues with the i18n system:

1. Check this README for common usage patterns
2. Review the demo file for examples
3. Examine the existing language files for reference
4. Open an issue in the BookReader repository

## License

The i18n system follows the same license as the main BookReader component (AGPL-3.0).

