// webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpack = require("webpack");

const isProd = process.env.NODE_ENV === "production";

// Ustaw to w skryptach jako /NAZWA_REPO/ aby działało na GitHub Pages (subpath)
const PUBLIC_PATH = process.env.PUBLIC_PATH || "/";

module.exports = {
  mode: isProd ? "production" : "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isProd ? "assets/[name].[contenthash].js" : "assets/[name].js",
    publicPath: PUBLIC_PATH,
    clean: true
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: { loader: "babel-loader" }
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico)$/i,
        type: "asset/resource",
        generator: { filename: "assets/[name].[hash][ext][query]" }
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: { minimize: false }
      }
    ]
  },
  devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
  devServer: {
    static: { directory: path.join(__dirname, "public") },
    port: 5173,
    open: false,
    hot: true,
    historyApiFallback: true
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      favicon: "./public/favicon.ico",
      scriptLoading: "defer",
      publicPath: PUBLIC_PATH
    }),
    new webpack.DefinePlugin({
      "process.env.PUBLIC_PATH": JSON.stringify(PUBLIC_PATH)
    })
  ],
  optimization: {
    splitChunks: { chunks: "all" },
    runtimeChunk: "single"
  }
};