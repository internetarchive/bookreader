import { html } from 'lit';

import sortDescIcon from '../assets/icon_sort_desc.js';
import sortAscIcon from '../assets/icon_sort_asc.js';
import sortNeutralIcon from '../assets/icon_sort_neutral.js';
import volumesIcon from '../assets/icon_volumes.js';

import './volumes.js';

const sortType = {
  title_asc: 'title_asc',
  title_desc: 'title_desc',
  default: 'default'
};
export default class VolumesProvider {
  /**
   * @param {import('../../BookReader').default} bookreader
   */
  constructor({ baseHost, bookreader, onProviderChange }) {
    this.onProviderChange = onProviderChange;
    this.component = document.createElement("viewable-files");

    const files = bookreader.options.multipleBooksList.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;

    /** @type {import('../../BookReader').default} */
    this.bookreader = bookreader;

    this.component.subPrefix = bookreader.options.subPrefix || "";
    this.component.hostUrl = baseHost;
    this.component.viewableFiles = this.viewableFiles;

    this.id = "volumes";
    this.label = `Viewable files (${this.volumeCount})`;
    this.icon = html`${volumesIcon}`;

    this.sortOrderBy = sortType.default;

    // get sort state from query param
    if (this.bookreader.urlPlugin) {
      this.bookreader.urlPlugin.pullFromAddressBar();

      const urlSortValue = this.bookreader.urlPlugin.getUrlParam('sort');
      if (urlSortValue === sortType.title_asc || urlSortValue === sortType.title_desc) {
        this.sortOrderBy = urlSortValue;
      }
    }
    this.sortVolumes(this.sortOrderBy);
  }

  get sortButton() {
    const sortIcons = {
      default: html`
        <button class="sort-by neutral-icon" aria-label="Sort volumes in initial order" @click=${() => this.sortVolumes("title_asc")}>${sortNeutralIcon}</button>
      `,
      title_asc: html`
        <button class="sort-by asc-icon" aria-label="Sort volumes in ascending order" @click=${() => this.sortVolumes("title_desc")}>${sortAscIcon}</button>
      `,
      title_desc: html`
        <button class="sort-by desc-icon" aria-label="Sort volumes in descending order" @click=${() => this.sortVolumes("default")}>${sortDescIcon}</button>
      `,
    };

    return sortIcons[this.sortOrderBy];
  }

  /**
   * @param {'default' | 'title_asc' | 'title_desc'} sortByType
   */
  sortVolumes(sortByType) {
    let sortedFiles = [];

    const files = this.viewableFiles;
    sortedFiles = files.sort((a, b) => {
      if (sortByType === sortType.title_asc) return a.title.localeCompare(b.title);
      else if (sortByType === sortType.title_desc) return b.title.localeCompare(a.title);
      else return a.orig_sort - b.orig_sort;
    });

    this.sortOrderBy = sortByType;
    this.component.sortOrderBy = sortByType;
    this.component.viewableFiles  = [...sortedFiles];
    this.actionButton = this.sortButton;

    if (this.bookreader.urlPlugin) {
      this.bookreader.urlPlugin.pullFromAddressBar();
      if (this.sortOrderBy !== sortType.default) {
        this.bookreader.urlPlugin.setUrlParam('sort', sortByType);
      } else {
        this.bookreader.urlPlugin.removeUrlParam('sort');
      }
    }

    this.onProviderChange(this.bookreader);

    this.multipleFilesClicked(sortByType);
  }

  /**
   * @param {'default' | 'title_asc' | 'title_desc'} orderBy
   */
  multipleFilesClicked(orderBy) {
    window.archive_analytics?.send_event(
      'BookReader',
      `VolumesSort|${orderBy}`,
      window.location.path,
    );
  }

}
