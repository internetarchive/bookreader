// @ts-check
/** @type {TestCafeConfigurationOptions} */
module.exports = {
  appCommand: "npm run serve",
  browsers: [
    "chrome:headless",
    "firefox:headless",
  ],
  src: ["tests/e2e/**/*test.js"]
};
