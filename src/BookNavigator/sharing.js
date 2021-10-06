import { html } from 'lit-element';
import '@internetarchive/icon-share/icon-share';
import { IASharingOptions } from '@internetarchive/ia-sharing-options';
customElements.define('ia-sharing-options', IASharingOptions);

export default class {
  constructor(metadata = {}, baseHost, baseItemType, subPrefix = '') {
    const { identifier, creator, title } = metadata;
    const encodedSubPrefix = encodeURIComponent(subPrefix);
    const urlIdentifier = subPrefix && (subPrefix !== identifier) ? `${identifier}/${encodedSubPrefix}` : identifier;
    this.idPath = urlIdentifier;
    this.itemType = baseItemType;
    const label = `Share this ${this.reconcileItemType}`;
    this.icon = html`<ia-icon-share style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-share>`;
    this.label = label;
    this.id = 'share';
    this.component = html`<ia-sharing-options
      identifier="${urlIdentifier}"
      type="book"
      creator="${creator}"
      description="${title}"
      baseHost="${baseHost}"
    ></ia-sharing-options>`;
  }

  get reconcileItemType() {
    if (this.itemType === 'bookreader') {
      return 'book';
    }
    return 'item';
  }
}
