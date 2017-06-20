var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['stage-3', 'latest']
                }
            }
        ]
    },
    target: 'node',
    stats: {
        colors: true
    },
    plugins: [
        new CopyWebpackPlugin([{
            from: './src/templates',
            to: 'templates'
        }])
    ]
};