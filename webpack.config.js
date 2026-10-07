// @ts-check
import path from 'path';
import webpack from 'webpack';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The ESM build needs ES modules and import() (for chunks) anyway.
const ESM_TARGETS = 'supports es6-module-dynamic-import';

const { dependencies } = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

/** @type {webpack.Configuration} */
const shared = {
  mode: 'production',

  watchOptions: {
    ignored: ['BookReader/**', 'esm/**', 'node_modules/**', 'tests/**'],
  },

  target: ['web', 'es5'],

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules[/\\](?!(lit-element|lit-html|lit|@lit)[/\\]).*/,
        loader: "babel-loader",
      },
      {
        // Allow importing scss as plain strings. Only used for text selection plugin,
        // since it needs to performantly load the CSS in an iframe to determine word
        // sizings
        test: /\.scss$/,
        use: [
          { loader: 'css-loader', options: { exportType: 'string' } },
          'sass-loader',
        ],
      },
    ],
  },

  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'BookReader'),
  },
};

/** Output file -> srcfile, for the classic and ESM builds */
const bookreaderEntries = {
  // BookReader
  'BookReader.js': './src/BookReader.js',

  // Plugins (sorted!)
  'plugins/plugin.archive_analytics.js': { import: './src/plugins/plugin.archive_analytics.js', dependOn: 'BookReader.js' },
  'plugins/plugin.autoplay.js': { import: './src/plugins/plugin.autoplay.js', dependOn: 'BookReader.js' },
  'plugins/plugin.chapters.js': { import: './src/plugins/plugin.chapters.js', dependOn: 'BookReader.js' },
  'plugins/plugin.experiments.js': { import: './src/plugins/plugin.experiments.js', dependOn: 'BookReader.js' },
  'plugins/plugin.iframe.js': { import: './src/plugins/plugin.iframe.js', dependOn: 'BookReader.js' },
  'plugins/plugin.iiif.js': { import: './src/plugins/plugin.iiif.js', dependOn: 'BookReader.js' },
  'plugins/plugin.resume.js': { import: './src/plugins/plugin.resume.js', dependOn: 'BookReader.js' },
  'plugins/plugin.search.js': { import: './src/plugins/search/plugin.search.js', dependOn: 'BookReader.js' },
  'plugins/plugin.text_selection.js': { import: './src/plugins/plugin.text_selection.js', dependOn: 'BookReader.js' },
  'plugins/plugin.translate.js': { import: './src/plugins/translate/plugin.translate.js', dependOn: 'BookReader.js' },
  'plugins/plugin.tts.js': { import: './src/plugins/tts/plugin.tts.js', dependOn: 'BookReader.js' },
  'plugins/plugin.url.js': { import: './src/plugins/url/plugin.url.js', dependOn: 'BookReader.js' },
  'plugins/plugin.vendor-fullscreen.js': { import: './src/plugins/plugin.vendor-fullscreen.js', dependOn: 'BookReader.js' },
  'ia-bookreader-bundle.js': { import: './src/ia-bookreader/ia-bookreader.js', dependOn: 'BookReader.js' },
};

/** @type {webpack.Configuration[]} */
export default [
  {
    ...shared,

    // Output file -> srcfile
    entry: {
      // Polyfill bundles
      'webcomponents-bundle.js': { import: '@webcomponents/webcomponentsjs/webcomponents-bundle.js' },

      ...bookreaderEntries,
      'plugins/translator-worker.js': { import: '@internetarchive/bergamot-translator/worker/translator-worker.js' },
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
      }),
    ],

    output: {
      filename: '[name]',
      chunkFilename: '[id].js',
      path: path.resolve(__dirname, 'BookReader'),
    },

    // Accurate source maps at the expense of build time.
    // The source map is intentionally exposed
    // to users via sourceMapFilename for prod debugging.
    devtool: 'source-map',
  },

  // ESM build of the same entries, for consumers that bundle BookReader
  // themselves (e.g. with Vite) rather than loading it via <script> tags.
  {
    ...shared,
    name: 'esm',

    target: `browserslist:${ESM_TARGETS}`,

    module: {
      rules: [
        {
          ...shared.module.rules[0],
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: ESM_TARGETS,
                useBuiltIns: 'usage',
                corejs: 3,
              }],
            ],
          },
        },
        shared.module.rules[1],
      ],
    },

    entry: bookreaderEntries,

    // Dependencies stay bare imports so the consumer can dedupe them; e.g. a
    // second copy of a web component throws re-registering its element name.
    externals: [
      { jquery: 'var jQuery' },
      ({ request }, callback) => {
        const pkg = request?.match(/^(@[^/]+\/)?[^/.][^/]*/)?.[0];
        // lit is bundled: our 2018-09 decorators need lit 2's decorators, and
        // the consumer may be on lit 3.
        if (pkg && pkg in dependencies && pkg !== 'lit') {
          return callback(null, `module ${request}`);
        }
        callback();
      },
    ],
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      }),
    ],

    experiments: {
      outputModule: true,
    },

    output: {
      module: true,
      library: { type: 'module' },
      chunkFormat: 'module',
      chunkLoading: 'import',
      filename: '[name]',
      chunkFilename: 'chunks/[id].js',
      path: path.resolve(__dirname, 'esm'),
    },

    devtool: 'source-map',
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
