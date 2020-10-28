// @ts-check
const path = require('path');
const webpack = require('webpack');

/** @type {webpack.Configuration} */
const shared = {
  mode: 'production',

  watchOptions: {
    ignored: ['BookReader/**', 'node_modules/**', 'tests/**']
  },

  target: ['web', 'es5'],

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },

  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'BookReader'),
  },
};

/** @type {webpack.Configuration[]} */
module.exports = [
  {
    ...shared,

    // Output file -> srcfile
    entry: {
      // BookReader
      'BookReader.js': './src/js/BookReader.js',

      // Plugins (sorted!)
      'plugins/plugin.archive_analytics.js': { import: './src/js/plugins/plugin.archive_analytics.js', dependOn: 'BookReader.js' },
      'plugins/plugin.autoplay.js': { import: './src/js/plugins/plugin.autoplay.js', dependOn: 'BookReader.js' },
      'plugins/plugin.chapters.js': { import: './src/js/plugins/plugin.chapters.js', dependOn: 'BookReader.js' },
      'plugins/plugin.iframe.js': { import: './src/js/plugins/plugin.iframe.js', dependOn: 'BookReader.js' },
      'plugins/plugin.menu_toggle.js': { import: './src/js/plugins/menu_toggle/plugin.menu_toggle.js', dependOn: 'BookReader.js' },
      'plugins/plugin.mobile_nav.js': { import: './src/js/plugins/plugin.mobile_nav.js', dependOn: 'BookReader.js' },
      'plugins/plugin.resume.js': { import: './src/js/plugins/plugin.resume.js', dependOn: 'BookReader.js' },
      'plugins/plugin.search.js': { import: './src/js/plugins/search/plugin.search.js', dependOn: 'BookReader.js' },
      'plugins/plugin.text_selection.js': { import: './src/js/plugins/plugin.text_selection.js', dependOn: 'BookReader.js' },
      'plugins/plugin.tts.js': { import: './src/js/plugins/tts/plugin.tts.js', dependOn: 'BookReader.js' },
      'plugins/plugin.url.js': { import: './src/js/plugins/plugin.url.js', dependOn: 'BookReader.js' },
      'plugins/plugin.vendor-fullscreen.js': { import: './src/js/plugins/plugin.vendor-fullscreen.js', dependOn: 'BookReader.js' }
    },

    externals: {
      // Anytime 'jquery' is imported, use the at runtime globally defined jQuery
      // instead of bundling a copy of jquery at compile-time.
      jquery: 'jQuery',
    },
    plugins: [
      new webpack.ProvidePlugin({
        // Make $ and jQuery available without importing
        $: 'jquery',
        jQuery: 'jquery',
      })
    ],

    output: {
      filename: '[name]',
      path: path.resolve(__dirname, 'BookReader'),
    },

    // Accurate source maps at the expense of build time.
    // The source map is intentionally exposed
    // to users via sourceMapFilename for prod debugging.
    devtool: 'source-map'
  },

  // jQuery gets its own build, so that it can be used as an "external" in
  // everything else.
  {
    ...shared,

    entry: {
      'jquery-1.10.1.js': { import: './src/js/jquery-wrapper.js' },
    },
  },

  // jQuery plugins/extensions
  // All of these will be replaced with just imports in v5
  {
    ...shared,

    // Output file -> srcfile
    entry: {
      'jquery-ui-1.12.0.min.js': { import: './src/js/jquery-ui-wrapper.js' },
      'jquery.browser.min.js': { import: 'jquery.browser' },
      'jquery.colorbox-min.js': { import: 'jquery-colorbox' },
      'jquery.ui.touch-punch.min.js': { import: 'jquery-ui-touch-punch' },
      'dragscrollable-br.js': { import: './src/js/dragscrollable-br.js' },
    },

    externals: {
      // Anytime 'jquery' is imported, use the runtime-global jQuery
      // instead of bundling a copy of jquery at compile-time.
      jquery: 'jQuery',
    },
    plugins: [
      new webpack.ProvidePlugin({
        // Make $ and jQuery available without importing
        $: 'jquery',
        jQuery: 'jquery',
      })
    ],
  },
];
