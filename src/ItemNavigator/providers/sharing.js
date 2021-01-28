import { html } from "lit-element";

/* register subpanel */
import { IASharingOptions } from "@internetarchive/ia-sharing-options";
customElements.define("ia-sharing-options", IASharingOptions);

export default class {
  constructor(metadata, baseHost, baseItemType) {
    this.itemType = baseItemType;
    const label = `Share this ${this.reconcileItemType}`;
    this.icon = html`<ia-icon
      icon="share"
      style="width: var(--iconWidth); height: var(--iconHeight);"
    ></ia-icon>`;
    this.label = label;
    this.id = "share";
    this.component = html`<ia-sharing-options
      identifier="${metadata.identifier}"
      type="book"
      creator="${metadata.creator}"
      description="${metadata.title}"
      baseHost="${baseHost}"
    ></ia-sharing-options>`;
  }

  get reconcileItemType() {
    if (this.itemType === "bookreader") {
      return "book";
    }
    return "item";
  }
}
