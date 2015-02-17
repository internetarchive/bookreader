// Error reporting - this helps us fix errors quickly
function logError(description,page,line) {
    if (typeof(archive_analytics) != 'undefined') {
        var values = {
            'bookreader': 'error',
            'description': description,
            'page': page,
            'line': line,
            'itemid': '{{id|escape('js')}}',
            'subPrefix': '{{subPrefix|escape('js')}}',
            'server': '{{server|escape('js')}}',
            'bookPath': '{{subItemPath|escape('js')}}'
        };

        // if no referrer set '-' as referrer
        if (document.referrer == '') {
            values['referrer'] = '-';
        } else {
            values['referrer'] = document.referrer;
        }

        if (typeof(br) != 'undefined') {
            values['itemid'] = br.bookId;
            values['subPrefix'] = br.subPrefix;
            values['server'] = br.server;
            values['bookPath'] = br.bookPath;
        }

        archive_analytics.send_ping(values);
    }

    return false; // allow browser error handling so user sees there was a problem
}
window.onerror=logError;
