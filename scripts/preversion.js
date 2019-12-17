const { version: OLD_VERSION } = require('../package.json');
const GITHUB_DIFF_URL = `https://github.com/internetarchive/bookreader/compare/v${OLD_VERSION}...master`

console.log(`Here's what's changed since the last version: ${GITHUB_DIFF_URL}`);
