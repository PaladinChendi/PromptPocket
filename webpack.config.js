const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Function form so the config can read build flags from `env`.
//
// DEBUG: a compile-time log switch. `webpack --env debug` sets DEBUG to the
// literal `true`; otherwise `false`. Source code uses `DEBUG && console.log(...)`;
// when DEBUG is `false`, Terser folds `false && ...` to dead code and removes the
// call entirely, so the shipped build emits no console output.
module.exports = (env, argv) => ({
  entry: {
    background: './src/background/background.ts',
    contentScript: './src/content/contentScript.ts',
    popup: './src/popup/popup.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new webpack.DefinePlugin({
      DEBUG: JSON.stringify(!!env.debug)
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'static',
          to: '.'
        },
        {
          from: 'manifest.json',
          to: '.'
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].css'
    })
  ],
  optimization: {
    minimize: true
  }
});