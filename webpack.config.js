// @ts-check
const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'production',
  // Output file -> srcfile
  entry: {
    'BookReader.js': './src/js/BookReader.js',

    // Plugins
    'plugins/plugin.menu_toggle.js': './src/js/plugins/menu_toggle/plugin.menu_toggle.js',
    'plugins/plugin.archive_analytics.js': './src/js/plugins/plugin.archive_analytics.js',
    'plugins/plugin.autoplay.js': './src/js/plugins/plugin.autoplay.js',
    'plugins/plugin.chapters.js': './src/js/plugins/plugin.chapters.js',
    'plugins/plugin.iframe.js': './src/js/plugins/plugin.iframe.js',
    'plugins/plugin.mobile_nav.js': './src/js/plugins/plugin.mobile_nav.js',
    'plugins/plugin.print.js': './src/js/plugins/plugin.print.js',
    'plugins/plugin.resume.js': './src/js/plugins/plugin.resume.js',
    'plugins/plugin.search.js': './src/js/plugins/plugin.search.js',
    'plugins/plugin.themes.js': './src/js/plugins/plugin.themes.js',
    'plugins/plugin.url.js': './src/js/plugins/plugin.url.js',
    'plugins/plugin.vendor-fullscreen.js': './src/js/plugins/plugin.vendor-fullscreen.js',
    'plugins/plugin.tts.js': './src/js/plugins/tts/plugin.tts.js',
  },

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },

  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'BookReader')
  },

  // Accurate source maps at the expense of build time.
  // The source map is intentionally exposed
  // to users via sourceMapFilename for prod debugging.
  devtool: 'source-map'
};
