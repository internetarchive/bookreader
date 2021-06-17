import { html } from 'lit-element';

import sortAscendingIcon from '../assets/icon_sort_ascending.js';
import sortDescendingIcon from '../assets/icon_sort_descending.js';
import volumesIcon from '../assets/icon_volumes.js';

import './volumes.js';

// added for debugging
const brOptions = {
  "options": {
    "enableMultipleBooks": true,
    "multipleBooksList": {
      "by_subprefix": {
        "/details/SubBookTest": {
          "url_path": "/details/SubBookTest",
          "file_subprefix": "book1/GPORFP",
          "title": "book1/GPORFP.pdf",
          "file_source": "/book1/GPORFP_jp2.zip"
        },
        "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive": {
          "url_path": "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive",
          "file_subprefix": "subdir/book2/brewster_kahle_internet_archive",
          "title": "subdir/book2/brewster_kahle_internet_archive.pdf",
          "file_source": "/subdir/book2/brewster_kahle_internet_archive_jp2.zip"
        },
        "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume": {
          "url_path": "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "file_subprefix": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "title": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume.pdf",
          "file_source": "/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume_jp2.zip"
        }
      }
    }
  }
};

export default class VolumesProvider {

  constructor(baseHost, bookreader, optionChange) {
    this.optionChange = optionChange;
    this.component = document.createElement('viewable-files');

    const files = brOptions.options.multipleBooksList.by_subprefix;// bookreader.options.multipleBooksList?.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;
    this.isSortAscending = false;

    this.component.subPrefix = bookreader.options.subPrefix || '';
    this.component.hostUrl = baseHost;
    this.component.viewableFiles = this.viewableFiles;

    this.id = 'volumes';
    this.label = `Viewable files (${this.volumeCount})`;
    this.icon = html`${volumesIcon}`;
    this.actionButton = this.headerIcon;
    this.sortVolumes(true);
  }

  get sortAscendingIcon() {
    return html`<button class="sort-by asc-icon" aria-label="Sort volumes in ascending order" @click=${() => this.sortVolumes()}>${sortAscendingIcon}</button>`;
  }

  get sortDescendingIcon() {
    return html`<button class="sort-by desc-icon" aria-label="Sort volumes in descending order" @click=${() => this.sortVolumes()}>${sortDescendingIcon}</button>`;
  }

  get headerIcon() {
    console.log("isSortAscending: ", this.isSortAscending);
    return this.isSortAscending ? this.sortAscendingIcon : this.sortDescendingIcon;
  }

  sortVolumes(initialSort = false) {
    this.isSortAscending = !this.isSortAscending;
    const volumesOrderBy = this.isSortAscending ? 'asc' : 'desc';
    console.log("sortBy: ", volumesOrderBy);

    let sortedFiles = [];
    if (!initialSort) {
      sortedFiles = this.viewableFiles.sort((a, b) => {
        if (this.isSortAscending) return a.file_subprefix.localeCompare(b.file_subprefix);
        else return b.file_subprefix.localeCompare(a.file_subprefix);
      });
    } else {
      sortedFiles = this.viewableFiles.sort((a, b) => {
        if (this.isSortAscending) return a.title.localeCompare(b.title);
        else return b.title.localeCompare(a.title);
      });
    }

    this.component.viewableFiles  = [...sortedFiles];
    this.actionButton = this.headerIcon;
    this.optionChange(this.bookreader);

    if (!initialSort) {
      this.multipleFilesClicked(volumesOrderBy);
    }
  }

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
