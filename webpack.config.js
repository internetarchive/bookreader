const path = require('path');

module.exports = buildJSFiles([
    'plugins/menu_toggle/plugin.menu_toggle.js',
    'plugins/plugin.archive_analytics.js',
    'plugins/plugin.autoplay.js',
    'plugins/plugin.chapters.js',
    'plugins/plugin.iframe.js',
    'plugins/tts/plugin.tts.js',
]);

/**
 * Applies bundling to the listed files.
 */
function buildJSFiles(files) {
    const nestedDirRegex = new RegExp('/(.*)/');
    return files.map((filePath) => {
        const flattenedFilePath = filePath.replace(nestedDirRegex, '/');
        return buildJsFromTo({
            from: filePath,
            to: `BookReader/${flattenedFilePath}`
        });
    });
}

/**
 * Applies webpack config to files that it is bundling.
 *
 * @param {Object} opts
 * @param {String} opts.from
 * @param {String} opts.to
 */
function buildJsFromTo({ from: srcEntryFile, to: outputFile }) {
    return {
        mode: 'production',
        entry: './' + path.join('src/js/', srcEntryFile),
        module: {
            rules: [
                { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
            ]
        },

        output: {
            filename: path.basename(outputFile),
            path: path.resolve(__dirname, path.parse(outputFile).dir)
        },

        // Accurate source maps at the expense of build time.
        // The source map is intentionally exposed
        // to users via sourceMapFilename for prod debugging.
        devtool: 'source-map'
    };
}
