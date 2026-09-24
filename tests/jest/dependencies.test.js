// @ts-check
import pkg from '../../package.json';
import renovate from '../../renovate.json';

const packageJsonDeps = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
];

/** @type {{ groupName?: string, matchPackageNames?: string[], matchPackagePatterns?: string[] }[]} */
const groupRules = renovate.packageRules.filter(r => r.groupName);
const groupedRenovateDeps = groupRules.flatMap(r => r.matchPackageNames ?? []);
const groupedRenovatePatterns = groupRules.flatMap(r => (r.matchPackagePatterns ?? []).map(p => new RegExp(p)));

/** Strip the version specifier from an `npm install` argument, handling scoped packages.
 * @param {string} arg e.g. "eslint@7", "@babel/core@latest", "@scope/pkg"
 * @returns {string} e.g. "eslint", "@babel/core", "@scope/pkg"
 */
const depNameFromNpmArg = (arg) => {
  const start = arg.startsWith('@') ? 1 : 0;
  const i = arg.indexOf('@', start);
  return i === -1 ? arg : arg.slice(0, i);
};

// Collect all packages listed in update:* scripts (excludes update:*:test variants)
const updateScriptDeps = new Set(
  Object.entries(pkg.scripts)
    .filter(([key]) => /^update:[^:]+$/.test(key))
    .flatMap(([, script]) => script.split(/\s+/).slice(2).map(depNameFromNpmArg)),
);

describe('renovate.json', () => {
  test('all package.json dependencies belong to a renovate group', () => {
    const ungrouped = packageJsonDeps.filter(dep => (
      !groupedRenovateDeps.includes(dep) && !groupedRenovatePatterns.some(re => re.test(dep))
    ));
    expect(ungrouped).toEqual([]);
  });
});

describe('package.json update:* scripts', () => {
  test('all package.json dependencies appear in an update:* script', () => {
    const missing = packageJsonDeps.filter(dep => !updateScriptDeps.has(dep));
    expect(missing).toEqual([]);
  });

  test('explicit renovate groups match their corresponding update:* script', () => {
    const scripts = /** @type {Record<string, string>} */ (pkg.scripts);
    for (const rule of groupRules) {
      const { groupName, matchPackageNames } = rule;
      if (!groupName || !matchPackageNames) continue;
      const scriptKey = `update:${groupName.replace(/ /g, '-')}`;
      const script = scripts[scriptKey];
      if (!script) continue;

      const scriptPackages = new Set(script.split(/\s+/).slice(2).map(depNameFromNpmArg));
      const groupPackages = new Set(matchPackageNames);
      expect({ group: rule.groupName, packages: [...scriptPackages].sort() })
        .toEqual({ group: rule.groupName, packages: [...groupPackages].sort() });
    }
  });
});
