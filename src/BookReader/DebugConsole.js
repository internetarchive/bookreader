/**
 * Displays a console on the document for debugging devices where remote
 * debugging is not feasible, and forwards all console.log's to be displayed
 * on screen.
 */
export class DebugConsole {
  constructor() {
    /** How many times we've seen the same line in a row */
    this.currentRun = 0;
  }

  init() {
    this.$log = $(`<div id="_debugLog" style="width: 100%; height: 300px; overflow: auto" />`);
    $(document.body).prepend(this.$log);

    this.$form = $(`
    <form>
      <input style="width:100%; font-family: monospace;" id="_debugLogInput">
    </form>`);
    this.$log.append(this.$form);

    this.$form.submit(ev => {
      ev.preventDefault();
      const result = eval(this.$form.find('input').val());
      this.logToScreen([result]);
    });

    const _realLog = console.log.bind(console);
    console.log = (...args) => {
      _realLog(...args);
      this.logToScreen(args);
    }

    window.onerror = (...args) => this.logToScreen(args);
  }

  /**
   * Log the provided array onto the on screen console
   * @param {Array} args
   */
  logToScreen(args) {
    const html = args.map(JSON.stringify).join(',');
    const $lastEntry = this.$log.children('.log-entry:last-child')
    if ($lastEntry.find('.entry-code').html() == html) {
      $lastEntry.find('.count').text(`(${++this.currentRun})`);
    } else {
      this.currentRun = 1;
      this.$log.append($(`
        <div class="log-entry">
          <code class="count"></code> <code class="entry-code">${html}</code>
        </div>`));
    }
  }
}
