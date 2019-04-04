const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        globalObject: 'this',
        library: 'mediary',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: 'mediary.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            'minify'
                        ]
                    }
                }
            }
        ]
    }
};
