import { html } from 'lit-element';
import '@internetarchive/icon-share/icon-share';
import '@internetarchive/ia-sharing-options';

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
    this.icon = html`<ia-icon-share style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-share>`;
    this.label = label;
    this.id = 'share';
    this.component = html`<ia-sharing-options
      .identifier=${identifier}
      .type=${`book`}
      .creator=${creatorToUse}
      .description=${title}
      .baseHost=${baseHost}
      .fileSubPrefix=${subPrefix}
    ></ia-sharing-options>`;
  }
}
