import { html } from 'lit';
import '@internetarchive/icon-dl/icon-dl';
import './downloads';

export default class DownloadsProvider {

  constructor({ bookreader }) {
    this.icon = html`<ia-icon-dl style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-dl>`;
    this.label = 'Read offline';
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
   * Restructures available download type data for the renderer
   * Sets global `downloads`
   * @param  availableTypes
   */
  computeAvailableTypes(availableTypes = []) {
    const menuData = availableTypes.reduce((found, incoming = []) => {
      const [ type = '', link = '' ] = incoming;
      if (!type) return found;
      let formattedType = type.toLowerCase();
      if ((formattedType === 'pdf' || formattedType === 'epub') && this.isbookProtected) {
        formattedType = `adobe${formattedType}`;
      }
      found[formattedType] = link;
      return found;
    }, {});

    this.downloads = menuData;
  }

  get menu () {
    return html`<ia-book-downloads .downloads=${this.downloads}></ia-book-downloads>`;
  }
}
