import { html } from 'lit-element';
// import sortAscendingIcon from '../assets/icon_sort_ascending.js';
// import sortDescendingIcon from '../assets/icon_sort_descending.js';

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
    console.log('volumesProvider constructor')
    this.component = document.createElement('viewable-files');

    const files = stub.value.files.by_subprefix
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.isSortAscending = false
    this.volumeCount = Object.keys(files).length;

    this.component.subPrefix = bookreader.options === undefined ? '' : bookreader.options.subPrefix
    this.component.hostUrl = volumes.baseHost;
    this.component.viewableFiles = this.viewableFiles;

    this.id = 'multiple-books';
    this.label = `Viewable Files (${this.volumeCount})`
    this.icon = html`<ia-icon icon="volumes" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`;
  }

  setupMenu() {
    this.label = 'Viewable files';
    this.menuDetails = `(${this.volumeCount})`
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
