import PACKAGE_JSON from '../package.json' assert { type: 'json' };

const OLD_VERSION = PACKAGE_JSON.version;
const OLD_RELEASE_URL = `https://api.github.com/repos/internetarchive/bookreader/releases/tags/v${OLD_VERSION}`;

async function main() {
    const {created_at} = await fetch(OLD_RELEASE_URL).then(r => r.json());
    const today = new Date().toISOString().slice(0, -5);
    const searchUrl = 'https://github.com/internetarchive/bookreader/pulls?' + new URLSearchParams({
        q: `is:pr is:merged merged:${created_at}..${today}Z sort:updated-asc`
    }).toString();
    console.log(`Here are all the PRs that were merged since the last version: ${searchUrl}`);
}

main();
