// @ts-check
const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'production',
  // Output file -> srcfile
  entry: {
    // Jquery/deps
    // Note the version in the filename is wrong, but kept for backwards compatibility. Won't matter
    // once the entire file is deleted/auto-generated in v5
    'jquery-1.10.1.js': { import: './src/js/jquery-wrapper.js' },
    'jquery-ui-1.12.0.min.js': { import: './src/js/jquery-ui-wrapper.js', dependOn: 'jquery-1.10.1.js' },
    'jquery.browser.min.js': { import: 'jquery.browser', dependOn: 'jquery-1.10.1.js' },
    'jquery.colorbox-min.js': { import: 'jquery-colorbox', dependOn: 'jquery-1.10.1.js' },
    'jquery.ui.touch-punch.min.js': { import: 'jquery-ui-touch-punch', dependOn: 'jquery-ui-1.12.0.min.js' },

    // BookReader
    'BookReader.js': './src/js/BookReader.js',

    // Plugins (sorted!)
    'plugins/plugin.archive_analytics.js': { import: './src/js/plugins/plugin.archive_analytics.js', dependOn: 'BookReader.js' },
    'plugins/plugin.autoplay.js': { import: './src/js/plugins/plugin.autoplay.js', dependOn: 'BookReader.js' },
    'plugins/plugin.chapters.js': { import: './src/js/plugins/plugin.chapters.js', dependOn: 'BookReader.js' },
    'plugins/plugin.iframe.js': { import: './src/js/plugins/plugin.iframe.js', dependOn: 'BookReader.js' },
    'plugins/plugin.menu_toggle.js': { import: './src/js/plugins/menu_toggle/plugin.menu_toggle.js', dependOn: 'BookReader.js' },
    'plugins/plugin.mobile_nav.js': { import: './src/js/plugins/plugin.mobile_nav.js', dependOn: 'BookReader.js' },
    'plugins/plugin.print.js': { import: './src/js/plugins/plugin.print.js', dependOn: 'BookReader.js' },
    'plugins/plugin.resume.js': { import: './src/js/plugins/plugin.resume.js', dependOn: 'BookReader.js' },
    'plugins/plugin.search.js': { import: './src/js/plugins/search/plugin.search.js', dependOn: 'BookReader.js' },
    'plugins/plugin.text_selection.js': { import: './src/js/plugins/plugin.text_selection.js', dependOn: 'BookReader.js' },
    'plugins/plugin.tts.js': { import: './src/js/plugins/tts/plugin.tts.js', dependOn: 'BookReader.js' },
    'plugins/plugin.url.js': { import: './src/js/plugins/plugin.url.js', dependOn: 'BookReader.js' },
    'plugins/plugin.vendor-fullscreen.js': { import: './src/js/plugins/plugin.vendor-fullscreen.js', dependOn: 'BookReader.js' }
  },

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },

  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'BookReader'),
  },

  target: ['web', 'es5'],

  // Accurate source maps at the expense of build time.
  // The source map is intentionally exposed
  // to users via sourceMapFilename for prod debugging.
  devtool: 'source-map'
};
