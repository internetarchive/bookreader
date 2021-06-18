import { html } from 'lit-element';

import sortAscendingIcon from '../assets/icon_sort_ascending.js';
import sortDescendingIcon from '../assets/icon_sort_descending.js';
import volumesIcon from '../assets/icon_volumes.js';

import './volumes.js';

// added for debugging
// const brOptions = {
//   "options": {
//     "enableMultipleBooks": true,
//     "multipleBooksList": {
//       "by_subprefix": {
//         "abc":{
//           "file_source": "/abc_jp2.zip",
//           "file_subprefix": "abc",
//           "title": "3 abc",
//           "url_path": "/details/test20210616"
//         },
//         "def": {
//           "file_source": "/def_jp2.zip",
//           "file_subprefix": "def",
//           "title": "2 def",
//           "url_path": "/details/test20210616/def"
//         },
//         "ghi": {
//           "file_source": "/ghi_jp2.zip",
//           "file_subprefix": "ghi",
//           "title": "1 ghi",
//           "url_path": "/details/test20210616/ghi"
//         }
//       },
//     }
//   }
// };

export default class VolumesProvider {

  constructor(baseHost, bookreader, optionChange) {
    this.optionChange = optionChange;
    this.component = document.createElement('viewable-files');

    const files = bookreader.options.multipleBooksList?.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => {
      return {...files[item], file_name: item };
    });
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
    return this.isSortAscending ? this.sortAscendingIcon : this.sortDescendingIcon;
  }

  sortVolumes(initialSort = false) {
    this.isSortAscending = !this.isSortAscending;
    const volumesOrderBy = this.isSortAscending ? 'asc' : 'desc';
    console.log("sortBy: ", volumesOrderBy, " initialSort: ", initialSort);

    let sortedFiles = [];
    if (initialSort) {
      sortedFiles = this.viewableFiles.sort((a, b) => a.file_name.localeCompare(b.file_name));
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
