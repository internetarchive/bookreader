module.exports = {
  presets: [
    [
      "@babel/preset-env",
      process.env.NODE_ENV == "test" ? { targets: { node: process.version } } :
        process.env.NODE_ENV == "development" ? { targets: "last 2 Chrome versions, last 2 Firefox versions, last 2 Safari versions, last 2 Edge versions" } : {
          targets: "> 2%, ie 11, edge 14, samsung > 9, OperaMini all, UCAndroid > 12, Safari >= 9",
          useBuiltIns: "usage",
          corejs: 3,
        },
    ],
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", {
      version: "2018-09",
      decoratorsBeforeExport: true,
    }],
    ["@babel/plugin-proposal-class-properties"],
  ],
};
