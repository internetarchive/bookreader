import { html } from 'lit-element';

import sortDescIcon from '../assets/icon_sort_desc.js';
import sortAscIcon from '../assets/icon_sort_asc.js';
import sortNeutralIcon from '../assets/icon_sort_neutral.js';
import volumesIcon from '../assets/icon_volumes.js';

import { EVENTS } from '../../BookReader/events.js';

import './volumes.js';

const sortType = {
  asc: 'asc',
  desc: 'desc',
  default: ''
};
export default class VolumesProvider {

  constructor(baseHost, bookreader, optionChange) {
    this.optionChange = optionChange;
    this.component = document.createElement("viewable-files");

    this.bookreader = bookreader;

    const files = bookreader.options.multipleBooksList.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;

    this.component.subPrefix = bookreader.options.subPrefix || "";
    this.component.hostUrl = baseHost;
    this.component.viewableFiles = this.viewableFiles;

    this.id = "volumes";
    this.label = `Viewable files (${this.volumeCount})`;
    this.icon = html`${volumesIcon}`;

    this.sortOrderBy = sortType.default;
    // get sort state from query param
    const urlParams = new URLSearchParams(bookreader.readQueryString());
    const urlSortValue = urlParams.get("sort");
    if (urlSortValue === sortType.asc || urlSortValue === sortType.desc) {
      this.sortOrderBy = urlSortValue;
    }
    this.sortVolumes(this.sortOrderBy);
  }

  get sortButton() {
    const sortIcons = {
      '': html`
        <button class="sort-by neutral-icon" aria-label="Sort volumes in initial order" @click=${() => this.sortVolumes("asc")}>${sortNeutralIcon}</button>
      `,
      asc: html`
        <button class="sort-by asc-icon" aria-label="Sort volumes in ascending order" @click=${() => this.sortVolumes("desc")}>${sortAscIcon}</button>
      `,
      desc: html`
        <button class="sort-by desc-icon" aria-label="Sort volumes in descending order" @click=${() => this.sortVolumes("")}>${sortDescIcon}</button>
      `,
    };

    return sortIcons[this.sortOrderBy];
  }

  /**
   * @param {'asc' | 'desc'} sortByType
   */
  sortVolumes(sortByType) {
    let sortedFiles = [];

    const files = this.viewableFiles;
    sortedFiles = files.sort((a, b) => {
      if (sortByType === sortType.asc) return a.title.localeCompare(b.title);
      else if (sortByType === sortType.desc) return b.title.localeCompare(a.title);
      else return a.orig_sort - b.orig_sort;
    });

    this.sortOrderBy = sortByType;
    this.component.viewableFiles  = [...sortedFiles];
    this.component.sortBy = sortByType;
    this.actionButton = this.sortButton;
    this.bookreader.volumesSortOrder = sortByType;
    this.optionChange(this.bookreader);

    this.bookreader.options.volumesSortBy = sortByType ;
    this.bookreader.trigger(EVENTS.fragmentChange);

    this.multipleFilesClicked(sortByType);
  }

  /**
   * @param {'asc' | 'desc'} orderBy
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
