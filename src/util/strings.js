/**
 * @typedef {String} StringWithVars
 * A template string with {{foo}} style variables
 * Also supports filters, like {{bookPath|urlencode}} (See APPLY_FILTERS for the
 * supported list of filters)
 **/

/**
 * @param {StringWithVars|String} template
 * @param { {[varName: string]: { toString: () => string} } } vars
 * @param { {[varName: string]: { toString: () => string} } } [overrides]
 * @returns {StringWithVars|string}
 */
export function applyVariables(template, vars, overrides = {}, possibleFilters = APPLY_FILTERS) {
  return template?.replace(/\{\{([^}]*?)\}\}/g, ($0, $1) => {
    if (!$1) return $0;
    /** @type {string} */
    const expression = $1;
    const [varName, ...filterNames] = expression.split('|').map(x => x.trim());
    const defined = varName in overrides || varName in vars;

    // If it's not defined, don't expand it at all
    if (!defined) return $0;

    const value = varName in overrides ? overrides[varName]
      : varName in vars ? vars[varName] : null;
    const filters = filterNames.map(n => possibleFilters[n]);
    return filters.reduce((acc, cur) => cur(acc), value && value.toString());
  });
}

/** @type { {[filterName: String]:( string => string)} } */
export const APPLY_FILTERS = {
  urlencode: encodeURIComponent,
};
