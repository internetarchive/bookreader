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
      {
        test: /\.js$/,
        exclude: /node_modules[/\\](?!(lit-element|lit-html|lit|@lit)[/\\]).*/,
        loader: "babel-loader",
      }
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
      // Polyfill bundles
      'webcomponents-bundle.js': { import: '@webcomponents/webcomponentsjs/webcomponents-bundle.js' },

      // BookReader
      'BookReader.js': './src/BookReader.js',

      // Plugins (sorted!)
      'plugins/plugin.archive_analytics.js': { import: './src/plugins/plugin.archive_analytics.js', dependOn: 'BookReader.js' },
      'plugins/plugin.autoplay.js': { import: './src/plugins/plugin.autoplay.js', dependOn: 'BookReader.js' },
      'plugins/plugin.chapters.js': { import: './src/plugins/plugin.chapters.js', dependOn: 'BookReader.js' },
      'plugins/plugin.iframe.js': { import: './src/plugins/plugin.iframe.js', dependOn: 'BookReader.js' },
      'plugins/plugin.mobile_nav.js': { import: './src/plugins/plugin.mobile_nav.js', dependOn: 'BookReader.js' },
      'plugins/plugin.resume.js': { import: './src/plugins/plugin.resume.js', dependOn: 'BookReader.js' },
      'plugins/plugin.search.js': { import: './src/plugins/search/plugin.search.js', dependOn: 'BookReader.js' },
      'plugins/plugin.text_selection.js': { import: './src/plugins/plugin.text_selection.js', dependOn: 'BookReader.js' },
      'plugins/plugin.tts.js': { import: './src/plugins/tts/plugin.tts.js', dependOn: 'BookReader.js' },
      'plugins/plugin.url.js': { import: './src/plugins/url/plugin.url.js', dependOn: 'BookReader.js' },
      'plugins/plugin.vendor-fullscreen.js': { import: './src/plugins/plugin.vendor-fullscreen.js', dependOn: 'BookReader.js' },
      'ia-bookreader-bundle.js': { import: './src/ia-bookreader/ia-bookreader.js', dependOn: 'BookReader.js' }
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
      'jquery-3.js': { import: './src/jquery-wrapper.js' },
    },
  },
];
