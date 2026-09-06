const devCerts = require("office-addin-dev-certs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  return {
    entry: "./src/taskpane/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "taskpane.js"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                ["@babel/preset-react", { runtime: "automatic" }],
                "@babel/preset-typescript"
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/taskpane/taskpane.html",
        filename: "taskpane.html"
      })
    ],
    devServer: {
      port: 3001,
      server: {
        type: 'https',
        options: await getHttpsOptions()
      },
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      static: [
        { directory: path.join(__dirname, "dist") },
        { directory: path.join(__dirname, "assets"), publicPath: "/assets" }
      ]
    }
  };
};
