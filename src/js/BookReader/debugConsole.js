/**
 * Displays a console on the document for debugging devices where remote
 * debugging is not feasible.
 */

if (location.toString().indexOf('_debugShowConsole=true') != -1) {
    $(function() {
      var logEl = document.createElement('div');
      logEl.id = '_debugLog';
      logEl.style.width = '100%';
      logEl.style.height = '300px';
      logEl.style.overflow = 'auto';
      $(document.body).prepend(logEl);
  
      var form = $('<form><input style="width:100%; font-family: monospace;" id="_debugLogInput"></form>');
      $(logEl).append(form);
      form.submit(function(ev) {
        ev.preventDefault();
        var result = eval(form.find('input').val());
        logToScreen([result]);
      });
  
      var currentRun = 0;
      function logToScreen(args) {
        var html = Array.from(args).map(JSON.stringify).join(',');
        if (logEl.lastChild && logEl.lastChild.lastChild.innerHTML == html) {
          logEl.lastChild.firstChild.innerHTML = '(' + (currentRun++) + ')';
        } else {
          currentRun = 1;
          var div = document.createElement('div');
          div.innerHTML = '<code></code> <code>' + html + '</code>';
          logEl.appendChild(div);
        }
      }
  
      // eslint-disable-next-line no-console
      var _realLog = console.log.bind(console);
      // eslint-disable-next-line no-console
      console.log = function() {
        var args = Array.prototype.slice.call(arguments);
        _realLog.apply(console, args);
        logToScreen(args);
      }
  
      window.onerror = function() {
        logToScreen(Array.prototype.slice.call(arguments));
      };
    });
}
