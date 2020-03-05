/**
 * Displays a console on the document for debugging devices where remote
 * debugging is not feasible.
 */

if (location.toString().indexOf('_debugShowConsole=true') != -1) {
  $(function() {
    const logEl = document.createElement('div');
    logEl.id = '_debugLog';
    logEl.style.width = '100%';
    logEl.style.height = '300px';
    logEl.style.overflow = 'auto';
    $(document.body).prepend(logEl);
  
    const form = $('<form><input style="width:100%; font-family: monospace;" id="_debugLogInput"></form>');
    $(logEl).append(form);
    form.submit(function(ev) {
      ev.preventDefault();
      const result = eval(form.find('input').val());
      logToScreen([result]);
    });
  
    let currentRun = 0;
    function logToScreen(args) {
      const html = Array.from(args).map(JSON.stringify).join(',');
      if (logEl.lastChild && logEl.lastChild.lastChild.innerHTML == html) {
        logEl.lastChild.firstChild.innerHTML = '(' + (currentRun++) + ')';
      } else {
        currentRun = 1;
        const div = document.createElement('div');
        div.innerHTML = '<code></code> <code>' + html + '</code>';
        logEl.appendChild(div);
      }
    }
  
    const _realLog = console.log.bind(console);
    console.log = function() {
      const args = Array.prototype.slice.call(arguments);
      _realLog.apply(console, args);
      logToScreen(args);
    }
  
    window.onerror = function() {
      logToScreen(Array.prototype.slice.call(arguments));
    };
  });
}
