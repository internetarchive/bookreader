import { html } from 'lit-element';

/* register subpanel */
import { IABookDownloads } from './downloads';

customElements.define('ia-book-downloads', IABookDownloads);

const menuBase = {
  pdf: {
    type: 'Encrypted Adobe PDF',
    url: '#',
    note: 'PDF files contain high quality images of pages.',
  },
  epub: {
    type: 'Encrypted Adobe ePub',
    url: '#',
    note: 'ePub files are smaller in size, but may contain errors.',
  }
};

const publicMenuBase = {
  pdf: "PDF",
  epub: "ePub"
};

export default class DownloadsProvider {

  constructor(isBookProtected) {
    this.icon = html`<ia-icon icon="download" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`;
    this.label = 'Downloadable files';
    this.menuDetails = '';
    this.downloads = [];
    this.id = 'downloads';
    this.component = '';
    this.isBookProtected = isBookProtected;

    this.computeAvailableTypes = this.computeAvailableTypes.bind(this);
    this.update = this.update.bind(this);
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
