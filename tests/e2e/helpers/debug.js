/**
 * Enables a debugging breakpoint in TestCafe tests
 *
 * Usage:
 * import debug from './helpers/debug';
 *
 * test(`does a thing`, async (t) => {
 *   await debug(t);
 * });
 */
export default async (t) => {
  await t.debug().setNativeDialogHandler(() => true);
};
