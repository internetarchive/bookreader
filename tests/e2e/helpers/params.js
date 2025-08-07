// @ts-check
class TestParams {
  baseUrl = process.env.BASE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:8000'
  ocaids = process.env.OCAIDS?.split(',') ?? null;
  /** Whether the url we're testing is a prod (or near prod) IA url, or a demos url */
  isIA = new URL(this.baseUrl).hostname.endsWith('archive.org');

  /** @param {string} ocaid */
  getArchiveUrl(ocaid) {
    return this.isIA ? `${this.baseUrl}/details/${ocaid}`
      // Otherwise it's a demo page
      : `${this.baseUrl}/BookReaderDemo/demo-internetarchive.html?ocaid=${ocaid}`;
  }
}

const params = new TestParams();
export default params;
