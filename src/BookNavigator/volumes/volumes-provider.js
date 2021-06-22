import { html } from 'lit-element';

import sortDescIcon from '../assets/icon_sort_desc.js';
import sortAscIcon from '../assets/icon_sort_asc.js';
import sortNeutralIcon from '../assets/icon_sort_neutral.js';
import volumesIcon from '../assets/icon_volumes.js';

import './volumes.js';

export default class VolumesProvider {

  constructor(baseHost, bookreader, optionChange) {
    this.optionChange = optionChange;
    this.component = document.createElement("viewable-files");

    const files = bookreader.options.multipleBooksList.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;

    this.component.subPrefix = bookreader.options.subPrefix || "";
    this.component.hostUrl = baseHost;
    this.component.viewableFiles = this.viewableFiles;

    this.id = "volumes";
    this.label = `Viewable files (${this.volumeCount})`;
    this.icon = html`${volumesIcon}`;

    this.sortOrderBy = "orig_sort";
    this.sortVolumes("orig_sort");
  }

  get sortButton() {
    const sortIcons = {
      orig_sort: html`
        <button class="sort-by neutral-icon" aria-label="Sort volumes in initial order" @click=${() => this.sortVolumes("title_asc")}>${sortNeutralIcon}</button>
      `,
      title_asc: html`
        <button class="sort-by asc-icon" aria-label="Sort volumes in ascending order" @click=${() => this.sortVolumes("title_desc")}>${sortAscIcon}</button>
      `,
      title_desc: html`
        <button class="sort-by desc-icon" aria-label="Sort volumes in descending order" @click=${() => this.sortVolumes("orig_sort")}>${sortDescIcon}</button>
      `,
    };

    return sortIcons[this.sortOrderBy];
  }

  /**
   * @param {'orig_sort' | 'title_asc' | 'title_desc'} sortByType
   */
  sortVolumes(sortByType) {
    let sortedFiles = [];

    const files = this.viewableFiles;
    sortedFiles = files.sort((a, b) => {
      if (sortByType === 'orig_sort') return a.orig_sort - b.orig_sort;
      else if (sortByType === 'title_asc') return a.title.localeCompare(b.title);
      else return b.title.localeCompare(a.title);
    });

    this.sortOrderBy = sortByType;
    this.component.viewableFiles  = [...sortedFiles];
    this.actionButton = this.sortButton;
    this.optionChange(this.bookreader);

    this.multipleFilesClicked(sortByType);
  }

  /**
   * @param {'orig_sort' | 'title_asc' | 'title_desc'} orderBy
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
