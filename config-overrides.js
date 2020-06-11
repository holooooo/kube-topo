const {
  override,
  fixBabelImports,
  addWebpackPlugin,
  useBabelRc,
} = require("customize-cra");
const fs = require("fs");
const YAML = require("yaml");
const { DefinePlugin } = require("webpack");

const rulesFile = fs.readFileSync("./src/core/rule.yaml", "utf8");
const rules = JSON.stringify(YAML.parse(rulesFile));

module.exports = override(
  fixBabelImports("import", {
    libraryName: "antd",
    libraryDirectory: "es",
    style: "css",
  }),
  addWebpackPlugin(
    new DefinePlugin({
      "process.env": { RULES: rules },
    })
  ),
  useBabelRc(),
);
