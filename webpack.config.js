const path = require('path');

module.exports = [
    buildJsFromTo({from: 'plugins/tts/plugin.tts.js', to: 'BookReader/plugins/plugin.tts.js'})
];

/**
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
