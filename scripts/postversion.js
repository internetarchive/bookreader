const fs = require('fs');
const { version: NEW_VERSION } = require('../package.json');

const tag = `v${NEW_VERSION}`;
const releaseBody = fs.readFileSync('CHANGELOG.md').toString()
  .split(/\n# /)[0] // split at headings and get first heading
  .split('\n').slice(1).join('\n'); // remove heading line

const GITHUB_RELEASE_URL = `https://github.com/internetarchive/bookreader/releases/new?tag=${tag}&title=${tag}&body=${encodeURIComponent(releaseBody)}`;
console.log(`After you push/merge, use this link to release: ${GITHUB_RELEASE_URL}`);
