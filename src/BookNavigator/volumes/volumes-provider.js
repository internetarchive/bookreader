import { html } from 'lit';

import { viewableFilesIcon  } from '@internetarchive/ia-item-navigator';
import '@internetarchive/ia-item-navigator';

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
    /** @type {import('../../BookReader').default} */
    this.bookreader = bookreader;
    this.onProviderChange = onProviderChange;
    this.baseHost = baseHost;

    const files = bookreader.options.multipleBooksList.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;

    this.id = "volumes";
    this.label = `Viewable files (${this.volumeCount})`;
    this.icon = html`${viewableFilesIcon}`;
    this.sortOrderBy = sortType.default;

    this.component = document.createElement("iaux-viewable-files");
    this.component.addSortToUrl = true;
    this.component.subPrefix = bookreader.options.subPrefix || "";
    this.component.baseHost = baseHost;
    this.component.fileList = [...this.viewableFiles];

    this.sortFilesComponent = document.createElement("iaux-sort-viewable-files");
    this.sortFilesComponent.fileListRaw = this.viewableFiles;
    this.sortFilesComponent.addEventListener('fileListSorted', (e) => this.handleFileListSorted(e));
    this.actionButton = this.sortFilesComponent;

    // get sort state from query param
    if (this.bookreader.urlPlugin) {
      this.bookreader.urlPlugin.pullFromAddressBar();

      const urlSortValue = this.bookreader.urlPlugin.getUrlParam('sort');
      if (urlSortValue === sortType.title_asc || urlSortValue === sortType.title_desc) {
        this.sortOrderBy = urlSortValue;
      }
    }

    this.sortFilesComponent.sortVolumes(this.sortOrderBy);
  }

  /**
   * @param {'default' | 'title_asc' | 'title_desc'} sortByType
   */
  async handleFileListSorted(event) {
    const { sortType, sortedFiles } = event.detail;

    this.viewableFiles = sortedFiles;
    this.sortType = sortType;

    // update the component
    this.component.fileList = [...this.viewableFiles];
    await this.component.updateComplete;

    this.onProviderChange(this.bookreader);

    this.multipleFilesClicked(sortType);
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
