const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
    ...defaultConfig,
    entry: {
        ...defaultConfig.entry,
        index: './src/index.js',
        frontend: './src/frontend.js',
        'block-editor': './src/block/index.js',
    },
};
