import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { version as NEW_VERSION } from '../package.json';

async function main() {
    // Update the changelog
    const old_changelog = readFileSync('CHANGELOG.md').toString();
    const new_changelog = `# ${NEW_VERSION}\n<!-- Write here... -->\n\n` + old_changelog;
    writeFileSync('CHANGELOG.md', new_changelog);
    while (readFileSync('CHANGELOG.md').toString().includes('<!-- Write here... -->')) {
        console.log('Changelog contains dummy text. Update the changelog, and press ENTER continue.');
        await new Promise(res => process.stdin.once("data", res));
    }
    execSync('git add CHANGELOG.md');

    // npm install to make sure deps are correct
    execSync('npm install', { stdio: "inherit" });

    // build
    execSync('npm run build', { stdio: "inherit" });

    // Add build files
    execSync('git add ./BookReader');
}

main().then(() => process.exit());
