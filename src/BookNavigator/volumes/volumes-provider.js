import { html } from 'lit-element';

import sortAscendingIcon from '../assets/icon_sort_ascending.js';
import sortDescendingIcon from '../assets/icon_sort_descending.js';
import sortNeutralIcon from '../assets/icon_sort_neutral.js';
import volumesIcon from '../assets/icon_volumes.js';

import './volumes.js';

export default class VolumesProvider {

  constructor(baseHost, bookreader, optionChange) {
    this.optionChange = optionChange;
    this.component = document.createElement('viewable-files');

    const files = bookreader.options.multipleBooksList?.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;

    this.component.subPrefix = bookreader.options.subPrefix || '';
    this.component.hostUrl = baseHost;
    this.component.viewableFiles = this.viewableFiles;

    this.id = 'volumes';
    this.label = `Viewable files (${this.volumeCount})`;
    this.icon = html`${volumesIcon}`;

    this.sortOrderBy = "";
    this.sortVolumes("initial");
  }

  get sortInitialIcon() {
    return html`<button class="sort-by neutral-icon" aria-label="Sort volumes in initial order" @click=${() => this.sortVolumes('asc')}>${sortNeutralIcon}</button>`;
  }

  get sortAscendingIcon() {
    return html`<button class="sort-by asc-icon" aria-label="Sort volumes in ascending order" @click=${() => this.sortVolumes('desc')}>${sortAscendingIcon}</button>`;
  }

  get sortDescendingIcon() {
    return html`<button class="sort-by desc-icon" aria-label="Sort volumes in descending order" @click=${() => this.sortVolumes('initial')}>${sortDescendingIcon}</button>`;
  }

  get headerIcon() {
    if (this.sortOrderBy === 'initial') return this.sortInitialIcon;
    else if (this.sortOrderBy === 'asc') return this.sortAscendingIcon;
    else return this.sortDescendingIcon;
  }

  /**
   * @param {string} sortType (initial, asc, desc)
   */
  sortVolumes(sortType) {
    let sortedFiles = [];

    sortedFiles = this.viewableFiles.sort((a, b) => {
      if (sortType === 'initial') return a.orig_sort - b.orig_sort;
      else if (sortType === 'asc') return a.title.localeCompare(b.title);
      else return b.title.localeCompare(a.title);
    });

    this.sortOrderBy = sortType;
    this.component.viewableFiles  = [...sortedFiles];
    this.actionButton = this.headerIcon;
    this.optionChange(this.bookreader);

    this.multipleFilesClicked(sortType);
  }

  /**
   * @param {string} orderBy (initial, asc, desc)
   */
  multipleFilesClicked(orderBy) {
    if (!window.archive_analytics) {
      return;
    }
    window.archive_analytics?.send_event_no_sampling(
      'BookReader',
      `VolumesSort|${orderBy}`,
      window.location.path,
    );
  }

}
