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
    expect(BookReader.util.notInArray(4, [4, "Pete", 8, "Shubham"])).toEqual(
      false
    );
    expect(BookReader.util.notInArray(10, ["8", "9", "10", 10 + ""])).toEqual(
      true
    );
  });

  test("escapeHTML function which replaces the string", () => {
    expect(BookReader.util.escapeHTML("Me & You")).toEqual("Me &amp; You");
    expect(BookReader.util.escapeHTML("Me > You")).toEqual("Me &gt; You");
    expect(BookReader.util.escapeHTML("Me < You")).toEqual("Me &lt; You");
    expect(BookReader.util.escapeHTML('Me " You')).toEqual("Me &quot; You");
  });

  test("Decodes a URI component and converts + to emptyStr", () => {
    expect(
      BookReader.util.decodeURIComponentPlus("https%3A%2F%2Farchive.org%2Fskr+")
    ).toEqual("https://archive.org/skr ");
    expect(BookReader.util.decodeURIComponentPlus("%3Fx%3D+test")).toEqual(
      "?x= test"
    );
  });

  test("Encodes a URI component and converts emptyStr to +", () => {
    expect(BookReader.util.encodeURIComponentPlus("?x=test ")).toEqual(
      "%3Fx%3Dtest+"
    );
    expect(BookReader.util.encodeURIComponentPlus("ABC abc 123")).toEqual(
      "ABC+abc+123"
    );
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

describe("Testing Throttle function", () => {
  let clock;
  clock = sinon.useFakeTimers();

  test("testing throttle", () => {
    const callMethod = jest.fn();
    const throttled = BookReader.util.throttle(() => callMethod(), 100);

    const t = setInterval(() => {
      throttled();
    }, 50);

    clock.tick(400);
    expect(callMethod).toHaveBeenCalledTimes(4);
    clearInterval(t);
  });
});

describe("Trigger function test", () => {
  beforeEach(() => {
    BookReader.prototype.trigger("SKR", "val");
  });
  test("testing trigger", () => {
    $(document).trigger("BookReader:" + "SKR", "val");
  });
});

describe("Testing extendParams", () => {
  var br = new BookReader();
  var obj1 = {
    prop1: "SK"
  };
  var obj2 = {
    prop2: 19
  };
  var result = {
    prop1: "SK",
    prop2: 19
  };
  br.extendParams(obj1, obj2);
  test("jquery.extend", () => {
    expect(obj1).toEqual(result);
  });
});

describe("Testing jquery bind", () => {
  function you() {
    alert("User clicked on 'you.'");
  }
  beforeEach(() => {
    BookReader.prototype.bind("SK", you);
  });
  test("jquery.bind", () => {
    $(document).bind("BookReader:" + "SK", you);
  });
});

describe("Testing unbind function", () => {
  function fox() {
    alert("The quick brown fox jumps over the lazy dog.");
  }
  beforeEach(() => {
    BookReader.prototype.unbind("SKR", fox);
  });
  test("jquery unbind", () => {
    $(document).bind("BookReader:" + "SKR", fox);
  });
});

describe("Testing setUpKeyListeners function", () => {
  var br = new BookReader();
  // Mocking Keys
  br.KEY_PGUP = jest.fn();
  br.KEY_UP = jest.fn();
  br.KEY_DOWN = jest.fn();
  br.KEY_PGDOWN = jest.fn();
  br.KEY_END = jest.fn();
  br.KEY_HOME = jest.fn();
  br.KEY_LEFT = jest.fn();
  br.KEY_RIGHT = jest.fn();
  // setup 'setupKeyListeners()'
  br.setupKeyListeners();
  // Calling Mock Functions
  br.KEY_PGUP();
  br.KEY_UP();
  br.KEY_DOWN();
  br.KEY_PGDOWN();
  br.KEY_END();
  br.KEY_HOME();
  br.KEY_LEFT();
  br.KEY_RIGHT();

  test("when pageUP is pressed", () => {
    var event = new KeyboardEvent("keydown", { keyCode: 33 });
    document.dispatchEvent(event);
    expect(br.KEY_PGUP).toHaveBeenCalledTimes(1);
  });
  test("when up is pressed", () => {
    var event = new KeyboardEvent("keydown", { keyCode: 38 });
    document.dispatchEvent(event);
    expect(br.KEY_UP).toHaveBeenCalledTimes(1);
  });
  test("when down is pressed", () => {
    var event = new KeyboardEvent("keydown", { keyCode: 40 });
    document.dispatchEvent(event);
    expect(br.KEY_DOWN).toHaveBeenCalledTimes(1);
  });
  test("when pageDown is pressed", () => {
    var event = new KeyboardEvent("keydown", { keyCode: 34 });
    document.dispatchEvent(event);
    expect(br.KEY_PGDOWN).toHaveBeenCalledTimes(1);
  });
  // test("when end is pressed", () => {
  //   var event = new KeyboardEvent("keydown", { keyCode: 35 });
  //   document.dispatchEvent(event);
  //   expect(br.KEY_END).toHaveBeenCalledTimes(1);
  // });
  // test("when home is pressed", () => {
  //   var event = new KeyboardEvent("keydown", { keyCode: 36 });
  //   document.dispatchEvent(event);
  //   expect(br.KEY_HOME).toHaveBeenCalledTimes(1);
  // });
  test("when left is pressed", () => {
    var event = new KeyboardEvent("keydown", { keyCode: 37 });
    document.dispatchEvent(event);
    expect(br.KEY_LEFT).toHaveBeenCalledTimes(1);
  });
  test("when right is pressed", () => {
    var event = new KeyboardEvent("keydown", { keyCode: 39 });
    document.dispatchEvent(event);
    expect(br.KEY_RIGHT).toHaveBeenCalledTimes(1);
  });
});
