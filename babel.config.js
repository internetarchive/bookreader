module.exports = {
  presets: [
    [
      "@babel/preset-env",
      process.env.NODE_ENV == 'test' ? { targets: {node: process.version} } : {
        targets: "> 2%, ie 11, edge 14, samsung > 9, OperaMini all, UCAndroid > 12, Safari >= 9",
        useBuiltIns: "usage",
        corejs: 3
      }
    ]
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
    ["@babel/plugin-proposal-class-properties", {loose: true}],
    ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
    ["@babel/plugin-proposal-private-methods", { loose: true }],
  ]
};
