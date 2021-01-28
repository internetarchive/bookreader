import { html } from 'lit-element';

/* register subpanel */
import { IABookDownloads } from '@internetarchive/ia-book-downloads';
customElements.define('ia-book-downloads', IABookDownloads);

let downloads = [];
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

export default class {
  constructor() {
    this.icon = html`<ia-icon icon="download" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`;
    this.label = 'Downloadable files';
    this.menuDetails = '';
    this.id = 'downloads';
    this.component = '';

    this.computeAvailableTypes = this.computeAvailableTypes.bind(this);
    this.update = this.update.bind(this);
  }


  update(downloadTypes) {
    this.computeAvailableTypes(downloadTypes);
    this.component = this.menu;

    const ending = downloads.length === 1 ? '' : 's';
    this.menuDetails = `(${downloads.length} format${ending})`;
  }

  /**
   * Generates Download Menu Info for available types
   * sets global `downloads`
   * @param  availableTypes
   */
  computeAvailableTypes(availableTypes = []) {
    const menuData = availableTypes.reduce((found, incoming = [], index) => {
      const [ type = '', link = '' ] = incoming;
      const formattedType = type.toLowerCase();
      const downloadOption = menuBase[formattedType] || null;
      if (downloadOption) {
        const menuInfo = Object.assign({}, downloadOption, { url: link });
        found.push(menuInfo);
      };
      return found;
    }, []);

    downloads = menuData;
  }


  get menu () {
    return html`<ia-book-downloads .downloads=${downloads}></ia-book-downloads>`;
  }
}
