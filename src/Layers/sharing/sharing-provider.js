import { html } from 'lit-element';

/* register subpanel */
import { IASharingOptions } from '@internetarchive/ia-sharing-options';
customElements.define('ia-sharing-options', IASharingOptions);

export default class {
  constructor(book = {}, baseHost, baseItemType) {
    this.itemType = baseItemType;
    const label = 'Share this book';
    this.icon = html`<ia-icon icon="share" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`;
    this.label = label;
    this.id = 'share';
    this.component = html`<ia-sharing-options
      identifier="${book.identifier}"
      type="book"
      creator="${book.creator}"
      description="${book.title}"
      baseHost="${baseHost}"
    ></ia-sharing-options>`;
  }
}
