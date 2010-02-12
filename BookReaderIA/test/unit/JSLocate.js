// Tests for BookReaderJSLocate.php

module("JSLocate");

test("first test within module", function() {
  ok( true, "all pass" );
});

test("second test within module", function() {
  ok( true, "all pass" );
});

test("some other test", function() {
  expect(2);
  equals( true, true, "easy test" );
  equals( true, true, "passing test" );
});

