// Handles displaying the correct simple BookReader given
// the query string of the URL
var params;

function displayBookReader() {
    params = getParams();

    if (params) {
        if (params.inline) {
            var newElement = document.createElement('h1');
            newElement.textContent = 'My page with a bookreader';

            document.body.insertBefore(newElement, document.body.childNodes[0]);
        }

        if (params.plugins) {
            importPlugins(params.plugins.split(','));
        }

        if (params.mmenu) {
            importMmenu();
        }

        if (params.style) {
            addStyling(params.style);
        }

        if (params.extraOpts) {
            instantiateBookReader('#BookReader', params.extraOpts);
        } else {
            instantiateBookReader('#BookReader');
        }
    } else {
        // Load default BookReader
        instantiateBookReader('#BookReader');
    }
}

function addStyling(style) {
    $('#css-overides').remove();

    var css;

    if (style === 'fullscreen') {
        var css = `html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
        #BookReader { width: 100%; height: 100%; }`;

    } else if (style === 'fullscreen_mobile') {
        var css = `html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: grey; }
        .BookReader { width: 100vw; height: 100vw; }`

    }

    var styleElement = document.createElement('style');

    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = css;
    } else {
        styleElement.appendChild(document.createTextNode(css));
    }

    document.head.appendChild(styleElement);
}

function importPlugins(plugins) {
    for (let i = 0; i < plugins.length; i++) {
        switch(plugins[i]) {
            case 'mobile_nav':
                var mobileNavScript = document.createElement('script');
                mobileNavScript.src = '../BookReader/plugins/plugin.mobile_nav.js';
                
                document.head.appendChild(mobileNavScript);
                break;

            case 'change_url':
                var changeURLScript = document.createElement('script');
                changeURLScript.src = '../BookReader/plugins/plugin.url.js';

                document.head.appendChild(changeURLScript);
                break;

            case 'vendor_fullscreen':
                var venderFullscreenScript = document.createElement('script');
                venderFullscreenScript.src = '../BookReader/plugins/plugin.vendor-fullscreen.js';

                document.head.appendChild(venderFullscreenScript);
                break;
        }
    }
}

function importMmenu() {
    var mmenuCSSLink = document.createElement('link');
    mmenuCSSLink.rel = 'stylesheet';
    mmenuCSSLink.href = '../BookReader/mmenu/dist/css/jquery.mmenu.css';
    
    var mmenuNavbarCSS = document.createElement('link');
    mmenuNavbarCSS.rel = 'stylesheet';
    mmenuNavbarCSS.href = '../BookReader/mmenu/dist/addons/navbars/jquery.mmenu.navbars.css';

    var mmenuScript = document.createElement('script');
    mmenuScript.src = '../BookReader/mmenu/dist/js/jquery.mmenu.min.js';

    var mmenuNavbarScript = document.createElement('script');
    mmenuNavbarScript.src = '../BookReader/mmenu/dist/addons/navbars/jquery.mmenu.navbars.min.js';

    $('#last-js-dependency').after(mmenuCSSLink, mmenuNavbarCSS, mmenuScript, mmenuNavbarScript);
}

// Decodes query string, if present, and returns an object literal
// representation of the parameters.
function getParams() {
    var queryString = decodeURI(window.location.search);

    var params;

    if(queryString) {
        params = Function('return {' + queryString.slice(1).replace(/=/g, ':').replace(/&/g, ',') + '}')();
    }

    return params;
}