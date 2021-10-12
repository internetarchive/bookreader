import { html } from 'lit-element';

import sortDescIcon from '../assets/icon_sort_desc.js';
import sortAscIcon from '../assets/icon_sort_asc.js';
import sortNeutralIcon from '../assets/icon_sort_neutral.js';
import volumesIcon from '../assets/icon_volumes.js';

import './volumes.js';

const books = {
  "/details/SubBookTest": {
    "url_path": "/details/SubBookTest",
    "file_subprefix": "book1/GPORFP",
    "orig_sort": 1,
    "title": "book1/GPORFP.pdf",
    "file_source": "/book1/GPORFP_jp2.zip"
  },
  "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive": {
    "url_path": "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive",
    "file_subprefix": "subdir/book2/brewster_kahle_internet_archive",
    "orig_sort": 2,
    "title": "subdir/book2/brewster_kahle_internet_archive.pdf",
    "file_source": "/subdir/book2/brewster_kahle_internet_archive_jp2.zip"
  },
  "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume": {
    "url_path": "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
    "file_subprefix": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
    "orig_sort": 3,
    "title": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume.pdf",
    "file_source": "/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume_jp2.zip"
  }
};

const sortType = {
  title_asc: 'title_asc',
  title_desc: 'title_desc',
  default: 'default'
};

export default class VolumesProvider {

  /**
   * @param {import('../../BookReader').default} bookreader
   */
  constructor(baseHost, bookreader, optionChange) {
    this.optionChange = optionChange;
    this.component = document.createElement("viewable-files");

    const files = books;// bookreader.options.multipleBooksList.by_subprefix;
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

    // get sort state from query param
    this.bookreader.urlPlugin.pullFromAddressBar();
    const urlSortValue = this.bookreader.urlPlugin.getUrlParam('sort');
    console.log('urlSortValue: ', urlSortValue);
    if (urlSortValue === sortType.title_asc || urlSortValue === sortType.title_desc) {
      this.sortOrderBy = urlSortValue;
    } else {
      this.sortOrderBy = sortType.default;
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
      else if (sortByType === sortType.default) return a.orig_sort - b.orig_sort;
    });

    this.sortOrderBy = sortByType;
    this.component.viewableFiles  = [...sortedFiles];
    this.actionButton = this.sortButton;

    if (this.sortOrderBy !== sortType.default) {
      this.bookreader.urlPlugin.setUrlParam('sort', sortByType);
    } else {
      this.bookreader.urlPlugin.removeUrlParam('sort');
    }
    this.bookreader.urlPlugin.urlStateToUrlString();
    this.bookreader.urlPlugin.pushToAddressBar();

    this.optionChange(this.bookreader);

    this.multipleFilesClicked(sortByType);
  }

  /**
   * @param {'default' | 'title_asc' | 'title_desc'} orderBy
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
