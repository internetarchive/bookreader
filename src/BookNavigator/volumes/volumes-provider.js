import { html } from 'lit-element';
import sortAscendingIcon from '../assets/icon_sort_ascending.js';
import sortDescendingIcon from '../assets/icon_sort_descending.js';

import './volumes.js';


export default class VolumesProvider {

  constructor(optionChange, volumes, bookreader) {
    this.optionChange = optionChange
    this.component = document.createElement('viewable-files');

    const files = bookreader.options.multipleBooksList?.by_subprefix
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;
    this.isFirstLoad = true
    this.isSortAscending = false;

    this.component.subPrefix = bookreader.options === undefined ? 'theworksofplato01platiala' : bookreader.options.subPrefix;
    this.component.hostUrl = volumes.baseHost;
    this.component.viewableFiles = this.viewableFiles;

    this.id = 'multiple-books';
    this.label = `Viewable Files (${this.volumeCount})`
    this.icon = html`<ia-icon icon="volumes" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`;
    this.actionButton = this.headerIcon
    this.sortVolumes()
  }

  get sortAscendingIcon() {
    const iconStyle = 'background: transparent; border: none; position: absolute; right: 25px';
    return html`<button style=${iconStyle} class="sort-asc icon" aria-label="Sort volumes in ascending order" @click=${() => this.sortVolumes()}>${sortAscendingIcon}</button>`;
  }

  get sortDescendingIcon() {
    const iconStyle = 'background: transparent; border: none; position: absolute; right: 25px';
    return html`<button style=${iconStyle} class="sort-desc icon" aria-label="Sort volumes in descending order" @click=${() => this.sortVolumes()}>${sortDescendingIcon}</button>`;
  }

  get headerIcon() {
    return this.isSortAscending ? this.sortAscendingIcon : this.sortDescendingIcon;
  }

  sortVolumes() {
    this.isSortAscending = !this.isSortAscending;
    const sortedFiles = this.viewableFiles.sort((a, b) => {
      if (this.isSortAscending) return a.title.localeCompare(b.title);
      else return b.title.localeCompare(a.title);
    })

    this.component.viewableFiles  = [...sortedFiles]
    if (!this.isFirstLoad) {
      this.actionButton = this.headerIcon
      this.optionChange(this.bookreader)
    } else {
      this.isFirstLoad = false
    }
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
