# TestCafe End to End (e2e) Testing

## Running

To run all tests in all browsers currently specified, run

`npm run test:e2e`

The list of browsers TestCafe will attempt to use are stored in
`.testcaferc.json`.

The test runner will pick up any file within the tests/e2e directory or
subdirectories that ends in `test.js`. If you would like to abstract some code
and place it alongside the test fixtures, as long as the file name does not
end in this suffix, the test runner won't pick it up and attempt to set up a
test fixture.

### Testing a specific browser

To run all tests in one or more specified browsers, supply the names of the
application executables after the command above. For example, if you only want
to run tests in Chrome, run `npm run test:e2e chrome`. To run
in both Chrome and Safari, run `npm run test:e2e chrome,safari`.

### Testing in Chrome using device emulation

You can specify device presets or specify custom parameters for Chrome's
device emulation when starting tests. For example:

`npm run test:e2e "chrome:emulation:width=414;height=736;mobile=true;orientation=vertical;touch=true"`

### Testing on remote devices

If you need to run tests on other devices like a phone, tablet, or other
computer, you can specify the number of browsers on the remote devices you'd
like to connect to the test runner. For example, to test Chrome on both a
phone and tablet, you'd specify '2' remote browsers. If you're only testing
on a phone, but are testing in Chrome and Safari, you'd also specify '2'.

`npm test:e2e remote:2`

This will provide you with a URL that you then visit in each browser. The URL
will look something like `http://127.0.0.1:52902/browser/connect`.

### Running a specific fixture

To run a particular fixture, add the path to the file at the end of your arguments list.

`npm run test:e2e chrome tests/e2e/example.test.js`

## Pending (skip) tests

You can skip any tests by calling the method `.skip` on the test object rather
than call the test function directly. If you have a test definition like:

```
test('Subnav opened when primary nav category clicked', async (t) => {
  const textsTophat = Selector('.row.texts');
  await t.expect(await textsTophat.visible).notOk();
  await t.click('[data-top-kind=texts]');
  await t.expect(await textsTophat.visible).ok();
});
```

You would skip it by changing the `test` call to `test.skip`.

## Running only one test

Similarly, you can use the `.only` method to skip all other tests and only run
the one specified.

```
test.only('Subnav opened when primary nav category clicked', async (t) => {
```

