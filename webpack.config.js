const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/js/plugins/tts/plugin.tts.js',
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },
    output: {
        filename: 'plugin.tts.js',
        path: path.resolve(__dirname, 'BookReader/plugins')
    }
};