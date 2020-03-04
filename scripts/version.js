const fs = require('fs');
const { execSync } = require('child_process');
const { version: NEW_VERSION } = require('../package.json');

async function main() {
    // Update the changelog
    const old_changelog = fs.readFileSync('CHANGELOG.md').toString();
    const new_changelog = `# ${NEW_VERSION}\n<!-- Write here... -->\n\n` + old_changelog;
    fs.writeFileSync('CHANGELOG.md', new_changelog);
    while (fs.readFileSync('CHANGELOG.md').toString().includes('<!-- Write here... -->')) {
        console.log('Changelog contains dummy text. Update the changelog, and press ENTER continue.');
        await new Promise(res => process.stdin.once("data", res));
    }
    execSync('git add CHANGELOG.md');

    // build
    execSync('npm run build', { stdio: "inherit" });

    // Add build files
    execSync('git add ./BookReader');
}

main().then(() => process.exit());
