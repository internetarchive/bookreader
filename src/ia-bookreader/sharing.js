import { html } from 'lit';
import { shareIcon } from '@internetarchive/elements/ia-item-navigator/menus/share-icons';
import '@internetarchive/elements/ia-item-navigator/menus/ia-itemnav-share-panel';

export default class SharingProvider {
  constructor({
    item,
    baseHost,
    bookreader,
  }) {
    const { identifier, creator, title } = item?.metadata;
    const creatorToUse = Array.isArray(creator) ? creator[0] : creator;
    const subPrefix = bookreader.subPrefix || '';
    const label = `Share this book`;
    this.icon = html`${shareIcon}`;
    this.label = label;
    this.id = 'share';
    this.component = html`<ia-itemnav-share-panel
      .identifier=${identifier}
      .type=${`book`}
      .creator=${creatorToUse}
      .description=${title}
      .baseHost=${baseHost}
      .fileSubPrefix=${subPrefix}
    ></ia-itemnav-share-panel>`;
  }
}
