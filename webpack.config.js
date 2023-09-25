const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  target: "web",
  entry: {
    // extension entrypoints
    background: "./src/entrypoints/background.ts",
    chesscom: "./src/entrypoints/chesscom.ts",
    lichess: "./src/entrypoints/lichess.ts",

    // ui scripts
    chesscom_daily_limit_page: "./src/ui/chesscom_daily_limit_page.ts",
    lichess_daily_limit_page: "./src/ui/lichess_daily_limit_page.ts",
    options: "./src/ui/options.ts",
    popup: "./src/ui/popup.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist", "scripts"),
    filename: "[name].js",
    // library: {
    //     type: "umd",
    // }
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: {
            properties: {
              regex: /_$/,
            },
          },
          compress: {
            passes: 3,
          },
        },
      }),
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "../manifest.json" },
        { from: "static/", to: "../static" },
      ],
    }),
  ],
  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
