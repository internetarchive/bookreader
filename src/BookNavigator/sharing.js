import { html } from 'lit';
import { iauxShareIcon } from '@internetarchive/ia-item-navigator';
import '@internetarchive/ia-item-navigator';

export default class SharingProvider {
  constructor({
    item,
    baseHost,
    bookreader
  }) {
    const { identifier, creator, title } = item?.metadata;
    const creatorToUse = Array.isArray(creator) ? creator[0] : creator;
    const subPrefix = bookreader.options.subPrefix || '';
    const label = `Share this book`;
    this.icon = html`${iauxShareIcon}`;
    this.label = label;
    this.id = 'share';
    this.component = html`<iaux-sharing-options
      .identifier=${identifier}
      .type=${`book`}
      .creator=${creatorToUse}
      .description=${title}
      .baseHost=${baseHost}
      .fileSubPrefix=${subPrefix}
    ></iaux-sharing-options>`;
  }
}
