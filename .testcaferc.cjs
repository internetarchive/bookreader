// @ts-check
/** @type {TestCafeConfigurationOptions} */
module.exports = {
  appCommand: "npm run serve",
  browsers: [
    "chrome:headless --disable-features=LocalNetworkAccessChecks",
    // "firefox:headless",
  ],
  src: ["tests/e2e/**/*test.js"]
};
