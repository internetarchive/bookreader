// @ts-check
/** @type {TestCafeConfigurationOptions} */
module.exports = {
  appCommand: "npm run serve",
  browsers: [
    "chrome:headless",
    "firefox:headless",
    // "browserstack:firefox@52.0:Windows XP",
  ],
  src: ["tests/e2e/**/*test.js"]
};
