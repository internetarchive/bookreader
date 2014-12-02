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

        var qs = archive_analytics.format_bug(values);

        var error_img = new Image(100,25);
        error_img.src = archive_analytics.img_src + "?" + qs;
    }

    return false; // allow browser error handling so user sees there was a problem
}
window.onerror=logError;
