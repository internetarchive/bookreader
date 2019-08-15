const { br } = require("../BookReader/BookReader.js");
const $ = require("jquery");
const _ = require("lodash");
const sinon = require("sinon");

describe("Testing BookReader.util", () => {
  test("clamp function returns Math.min(Math.max(value, min), max)", () => {
    expect(BookReader.util.clamp(2, 1, 3)).toEqual(2);
  });

  test("calculate a percentage suitable for CSS", () => {
    expect(BookReader.util.cssPercentage(2, 1)).toEqual(200 + "%");
  });

  test("notInArray function which return false if value present", () => {
    expect(BookReader.util.notInArray(4, [4, "Pete", 8, "Shubham"])).toEqual(false);
    expect(BookReader.util.notInArray(10, ["8", "9", "10", 10 + ""])).toEqual(true);
  });

  test("escapeHTML function which replaces the string", () => {
    expect(BookReader.util.escapeHTML("Me & You")).toEqual("Me &amp; You");
    expect(BookReader.util.escapeHTML("Me > You")).toEqual("Me &gt; You");
    expect(BookReader.util.escapeHTML("Me < You")).toEqual("Me &lt; You");
    expect(BookReader.util.escapeHTML('Me " You')).toEqual("Me &quot; You");
  });

  test("Decodes a URI component and converts + to emptyStr", () => {
    expect(BookReader.util.decodeURIComponentPlus("https%3A%2F%2Farchive.org%2Fskr+")).toEqual("https://archive.org/skr ");
    expect(BookReader.util.decodeURIComponentPlus("%3Fx%3D+test")).toEqual("?x= test");
  });

  test("Encodes a URI component and converts emptyStr to +", () => {
    expect(BookReader.util.encodeURIComponentPlus("?x=test ")).toEqual("%3Fx%3Dtest+");
    expect(BookReader.util.encodeURIComponentPlus("ABC abc 123")).toEqual("ABC+abc+123");
  });
});

describe("Testing debounce function", () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  test("testing debounce", () => {
    const func = jest.fn();
    const debouncedFunc = BookReader.util.debounce(func, 1000);
    // Call it immediately
    debouncedFunc();
    expect(func).toHaveBeenCalledTimes(0); // func not called

    // Call it several times with 500ms between each call
    for (let i = 0; i < 10; i++) {
      clock.tick(500);
      debouncedFunc();
    }
    expect(func).toHaveBeenCalledTimes(0); // func not called

    // wait 1000ms
    clock.tick(1000);
    expect(func).toHaveBeenCalledTimes(1); // func called
  });
});

describe('Testing Throttle function', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    clock.restore();
  });

  test('testing throttle', () => {
    const callMethod = jest.fn();
    const throttled = BookReader.util.throttle(() => callMethod(), 100);

    const t = setInterval(() => {
       throttled()
    }, 50);

    clock.tick(400);
    expect(callMethod).toHaveBeenCalledTimes(4);
    clearInterval(t);
  });
});

describe("Trigger function test", () => {
  beforeEach(() => {
    BookReader.prototype.trigger('SKR', 'val');
  });
  test("testing trigger", () => {
    $(document).trigger('BookReader:' + 'SKR', 'val');
  });
});

describe("Testing extendParams", () => {
  const obj1 = {
    prop1: "SK",
    prop2: 20
  };
  const obj2 = {
    prop2: 19,
    prop3: "SKR"
  };
  var modifiedNewParams = $.extend({}, obj2);
  beforeEach(() => {
    BookReader.prototype.extendParams(obj1, obj2);
  });
  test("jquery.extend", () => {
    $.extend(obj1, modifiedNewParams);
  });
});

describe("Testing jquery bind", () => {
  function you() {
    alert( "User clicked on 'you.'" );
  };
  beforeEach(() => {
    BookReader.prototype.bind('SK', you);
  });
  test("jquery.bind", () => {
    $(document).bind('BookReader:' + 'SK', you);
  });
});

describe("Testing unbind function", () => {
  function fox() {
    alert( "The quick brown fox jumps over the lazy dog." );
  };
  beforeEach(() => {
    BookReader.prototype.unbind('SKR', fox);
  });
  test("jquery unbind", () => {
    $(document).bind('BookReader:' + 'SKR', fox);
  });
});

describe("Testing setUpKeyListeners function", () => {
  function key() {
    alert( "Handler for .keydown() called." );
  };
  beforeEach(() => {
    BookReader.prototype.setupKeyListeners();
  });
  test("jquery keydown", () => {
    $(document).keydown(key);
  });
});
