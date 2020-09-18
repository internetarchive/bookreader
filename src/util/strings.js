/** @typedef {String} StringWithVars A template string with {{foo}} style variables */

/**
 * @param {StringWithVars|String} template
 * @param { {[varName: string]: any } } vars
 * @param { {[varName: string]: any } } [overrides]
 */
export function applyVariables(template, vars, overrides={}) {
  return template?.replace(/\{\{([^}]*?)\}\}/g, ($0, $1) => {
    return $1 in overrides ? overrides[$1]
      : $1 in vars ? vars[$1]
      // If it's not defined, don't expand it at all
      : $0;
  });
}
