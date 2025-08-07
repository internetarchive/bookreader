import { html } from 'lit';
import '@internetarchive/icon-dl/icon-dl.js';
import './downloads.js';

const menuBase = {
  pdf: {
    type: 'Encrypted Adobe PDF',
    url: '#',
    note: 'PDF files contain high quality images of pages.',
  },
  lcppdf: {
    type: 'Get LCP PDF',
    url: '#',
    note: 'PDF files contain high quality images of pages.',
  },
  lcpepub: {
    type: 'Get LCP ePub',
    url: '#',
    note: 'ePub files are smaller in size, but may contain errors.',
  },
  epub: {
    type: 'Encrypted Adobe ePub',
    url: '#',
    note: 'ePub files are smaller in size, but may contain errors.',
  },
};

const publicMenuBase = {
  pdf: "PDF",
  epub: "ePub",
  lcppdf: "LCP PDF",
  lcpepub: "LCP ePub",
};

export default class DownloadsProvider {

  constructor({ bookreader }) {
    this.icon = html`<ia-icon-dl style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-dl>`;
    this.label = 'Downloadable files';
    this.menuDetails = '';
    this.downloads = [];
    this.id = 'downloads';
    this.component = '';
    this.isBookProtected = bookreader?.options?.isProtected || false;
  }

  update(downloadTypes) {
    this.computeAvailableTypes(downloadTypes);
    this.component = this.menu;
    this.component.isBookProtected = this.isBookProtected;

    const ending = this.downloads.length === 1 ? '' : 's';
    this.menuDetails = `(${this.downloads.length} format${ending})`;
  }

  /**
   * Generates Download Menu Info for available types
   * sets global `downloads`
   * @param  availableTypes
   */
  computeAvailableTypes(availableTypes = []) {
    const menuData = availableTypes.reduce((found, incoming = []) => {
      const [ type = '', link = '' ] = incoming;
      const formattedType = type.toLowerCase();
      const downloadOption = menuBase[formattedType] || null;

      if (downloadOption) {
        const menuButtonText = this.isBookProtected ? menuBase[formattedType].type : publicMenuBase[formattedType];
        const menuInfo = Object.assign({}, downloadOption, { url: link,  type: menuButtonText});
        found.push(menuInfo);
      }
      return found;
    }, []);

    this.downloads = menuData;
  }

  get menu () {
    return html`<ia-book-downloads .downloads=${this.downloads}></ia-book-downloads>`;
  }
}
