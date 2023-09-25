import { html } from 'lit';

import { viewableFilesIcon  } from '@internetarchive/ia-item-navigator/dist/src/menus/viewable-files';
import '@internetarchive/ia-item-navigator/dist/src/menus/viewable-files';

/**
 * * @typedef { 'title_asc' | 'title_desc' | 'default'} SortTypesT
 */
const sortTypes = {
  title_asc: 'title_asc',
  title_desc: 'title_desc',
  default: 'default'
};
export default class ViewableFilesProvider {
  /**
   * @param {import('../BookReader').default} bookreader
   */
  constructor({ baseHost, bookreader, onProviderChange }) {
    /** @type {import('../BookReader').default} */
    this.bookreader = bookreader;
    this.onProviderChange = onProviderChange;
    this.baseHost = baseHost;

    const files = bookreader.options.multipleBooksList.by_subprefix;
    this.viewableFiles = Object.keys(files).map(item => files[item]);
    this.volumeCount = Object.keys(files).length;

    this.id = "volumes";
    this.label = `Viewable files (${this.volumeCount})`;
    this.icon = html`${viewableFilesIcon}`;
    this.sortOrderBy = sortTypes.default;

    this.component = document.createElement("iaux-in-viewable-files-panel");
    this.component.addSortToUrl = true;
    this.component.subPrefix = bookreader.options.subPrefix || "";
    this.component.baseHost = baseHost;
    this.component.fileList = [...this.viewableFiles];

    this.sortFilesComponent = document.createElement("iaux-in-sort-files-button");
    this.sortFilesComponent.fileListRaw = this.viewableFiles;
    this.sortFilesComponent.addEventListener('fileListSorted', (e) => this.handleFileListSorted(e));
    this.actionButton = this.sortFilesComponent;

    // get sort state from query param
    if (this.bookreader.urlPlugin) {
      this.bookreader.urlPlugin.pullFromAddressBar();

      const urlSortValue = this.bookreader.urlPlugin.getUrlParam('sort');
      if (urlSortValue === sortTypes.title_asc || urlSortValue === sortTypes.title_desc) {
        this.sortOrderBy = urlSortValue;
      }
    }

    this.sortFilesComponent.sortVolumes(this.sortOrderBy);

    this.onProviderChange(this.bookreader);
  }

  /** @param { SortTypesT } sortType */
  async handleFileListSorted(event) {
    const { sortType, sortedFiles } = event.detail;

    this.viewableFiles = sortedFiles;
    this.sortOrderBy = sortType;

    // update the component
    this.component.fileList = [...this.viewableFiles];
    await this.component.updateComplete;

    if (this.bookreader.urlPlugin) {
      this.bookreader.urlPlugin.pullFromAddressBar();
      if (this.sortOrderBy !== sortTypes.default) {
        this.bookreader.urlPlugin.setUrlParam('sort', this.sortOrderBy);
      } else {
        this.bookreader.urlPlugin.removeUrlParam('sort');
      }
    }

    this.onProviderChange(this.bookreader);

    this.multipleFilesClicked(this.sortOrderBy);
  }

  /**
   * @param { SortTypesT } orderBy
   */
  multipleFilesClicked(orderBy) {
    window.archive_analytics?.send_event(
      'BookReader',
      `VolumesSort|${orderBy}`,
      window.location.path,
    );
  }

}
