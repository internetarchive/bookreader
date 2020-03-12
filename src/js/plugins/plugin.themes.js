/**
 * Deprecated theming functionality
 */

jQuery.extend(BookReader.defaultOptions, {
    enableThemesPlugin: true,
});

BookReader.prototype.setup = (function(super_) {
    return function (options) {
        super_.call(this, options);

        this.enableThemesPlugin = options.enableThemesPlugin;

        // Themes
        this.themes = { ol: null };
        this.default_theme = 'ol';
        this.theme = 'ol';
    };
})(BookReader.prototype.setup);


// updateTheme
//______________________________________________________________________________
BookReader.prototype.updateTheme = function(theme) {
    if (!(theme in this.themes)) return;
    var main_style = $('#BRCSS');
    if (main_style.length == 0) return;
    if (theme == this.theme) return;
    this.theme = theme;

    if (theme == this.default_theme) {
        $('#BRCSSTheme').attr('disabled', true);
        return;
    }

    var stylesheet = $('#BRCSSTheme');
    if (stylesheet.length == 0) {
        stylesheet = $('<link rel="stylesheet" type="text/css">').attr('id', 'BRCSSTheme');
        $('head').append(stylesheet);
    }

    var main_href = $('#BRCSS').attr('href');
    var index = main_href.indexOf('BookReader.css');
    var css_prefix = main_href.substr(0, index);
    var theme_href = css_prefix + this.themes[theme];

    stylesheet.attr({disabled: false, href: theme_href});
};
