export default async (t) => {
  await t.debug().setNativeDialogHandler(() => true);
}
