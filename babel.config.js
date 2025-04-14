module.exports = {
  presets: [
    [
      "@babel/preset-env",
      process.env.BABEL_ENV === "esm" ? {
        targets: {
          esmodules: true
        },
        modules: false
      } :
        process.env.NODE_ENV == "test" ? { targets: { node: process.version } } :
          process.env.NODE_ENV == "development" ? { targets: "last 2 Chrome versions, last 2 Firefox versions, last 2 Safari versions, last 2 Edge versions" } : {
            targets: "> 2%, edge >= 14, samsung > 9, UCAndroid > 12, Safari >= 10",
            useBuiltIns: "usage",
            corejs: 3
          }
    ]
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", {
      version: "2018-09",
      decoratorsBeforeExport: true,
    }],
    ["@babel/plugin-proposal-class-properties"],
  ],
};
