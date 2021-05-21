import { html } from 'lit-element';
import sortAscendingIcon from '../assets/icon_sort_ascending.js';
import sortDescendingIcon from '../assets/icon_sort_descending.js';

import './volumes.js';

const stub = {
  "success": true,
  "value": {
    "identifier": "SubBookTest",
    "mediatype": "texts",
    "files": {
      "by_subprefix": {
        "/details/SubBookTest": {
          "url_path": "/details/SubBookTest",
          "file_subprefix": "book1/GPORFP",
          "title": "book1/GPORFP.pdf",
          "file_source": "/book1/GPORFP_jp2.zip"
        },
        "theworksofplato01platiala": {
          "url_path": "/details/theworksofplato01platiala",
          "file_subprefix": "theworksofplato01platiala",
          "title": "theworksofplato01platiala.pdf",
          "file_source": "theworksofplato01platiala_jp2.zip"
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
      },
      "main_dir": "/2/items/SubBookTest"
    }
  }
};


export default class VolumesProvider {

  constructor(volumes, bookreader) {
    this.component = document.createElement('viewable-files');

    const files = stub.value.files.by_subprefix
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.sortAscending = false
    this.volumeCount = Object.keys(files).length;

    this.component.subPrefix = bookreader.options.subPrefix
    this.component.hostUrl = volumes.baseHost;
    this.component.viewableFiles = [];

    this.sortVolumes()
    this.setupMenu()
  }

  get sortAscendingIcon() {
    return html`<span>${sortAscendingIcon}</span>`;
  }

  get sortDescendingIcon() {
    return html`<span>${sortDescendingIcon}</span>`;
  }

  setupMenu() {
    this.label = 'Viewable files';
    this.id = 'multiple-books';
    this.icon = html`<ia-icon icon="volumes" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`;

    this.menuDetails = `(${this.volumeCount})`
    this.actionButton = html`
      <button @click=${() => this.sortVolumes()}>${this.menuIcon}</button>
    `;
  }

  sortVolumes() {
    this.sortAscending = !this.sortAscending;
    const sortedFiles = this.viewableFiles.sort((a, b) => {
      if (this.sortAscending) return a.title.localeCompare(b.title);
      else return b.title.localeCompare(a.title);
    })

    this.component.viewableFiles  = [...sortedFiles]
    this.updateActionButton()
  }

  updateActionButton() {
    console.log('isSortAscending: ', this.sortAscending)
    this.menuIcon = this.sortAscending ? this.sortAscendingIcon : this.sortDescendingIcon
    console.log("menuIcon: ", this.menuIcon)
    this.actionButton = html`
      <button @click=${() => this.sortVolumes()}>${this.menuIcon}</button>
    `;
  }

  bindEvents() {
    this.component.addEventListener('click', this.multiplefilesClicked.bind(this));
  }

  multiplefilesClicked({ detail }) {
    // maybe some analytics?
    if (window.archive_analytics) {
      window.archive_analytics?.send_event_no_sampling(
        'BookReader',
        `VolumesSort`,
        window.location.path,
      );
    }
  }

}
