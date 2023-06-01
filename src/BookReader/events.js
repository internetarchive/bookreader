/** @enum {string} */
export const EVENTS = {
  /** Indicates that the fragment (a serialization of the reader
   * state) has changed. */
  fragmentChange: 'fragmentChange',
  pageChanged: 'pageChanged',
  PostInit: 'PostInit',
  stop: 'stop',
  resize: 'resize',
  userAction: 'userAction', // event to know if user is actively reading
  // menu click events
  fullscreenToggled: 'fullscreenToggled',
  zoomOut: 'zoomOut',
  zoomIn: 'zoomIn',
  '1PageViewSelected': '1PageViewSelected',
  '2PageViewSelected': '2PageViewSelected',
  /* currently 3 represents thumbnail view */
  '3PageViewSelected': '3PageViewSelected',
  mobileNavOpen: 'mobileNavOpen',
};
