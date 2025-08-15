// @ts-check
/** @type {TestCafeConfigurationOptions} */
module.exports = {
  appCommand: "npm run serve",
  browsers: [
    "chrome:headless --disable-web-security --disable-features=VizDisplayCompositor --no-cache",
    "firefox:headless",
  ],
  src: ["tests/e2e/**/*test.js"]
};
