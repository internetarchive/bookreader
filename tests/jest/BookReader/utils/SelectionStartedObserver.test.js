// @ts-check
import sinon from "sinon";
import { SelectionStartedObserver } from "@/src/BookReader/utils/SelectionStartedObserver";

afterEach(() => {
  sinon.restore();
});

describe("SelectionStartedObserver", () => {
  describe("_onSelectStart", () => {
    test("sets matches selector correctly", () => {
      const observer = new SelectionStartedObserver(".text-layer", () => {});
      const ev = new Event("selectstart", {});
      const target = document.createElement("div");
      Object.defineProperty(ev, "target", { get: () => target });
      observer._onSelectStart(ev);
      expect(observer.startedInSelector).toBe(false);
      target.classList.add("text-layer");
      observer._onSelectStart(ev);
      expect(observer.startedInSelector).toBe(true);
      expect(observer.loggedForSelection).toBe(false);
    });

    test("resets loggedForSelction", () => {
      const observer = new SelectionStartedObserver(".text-layer", () => {});
      const ev = new Event("selectstart", {});
      const target = document.createElement("div");
      Object.defineProperty(ev, "target", { get: () => target });
      target.classList.add("text-layer");
      observer._onSelectStart(ev);
      expect(observer.loggedForSelection).toBe(false);
      observer.loggedForSelection = true;
      observer._onSelectStart(ev);
      expect(observer.loggedForSelection).toBe(false);
    });
  });

  test("_onSelectionChange", () => {
    const handler = sinon.spy();
    const observer = new SelectionStartedObserver(".text-layer", handler);
    const ev = new Event("selectstart", {});
    const target = document.createElement("div");
    target.classList.add("text-layer");
    Object.defineProperty(ev, "target", { get: () => target });
    observer._onSelectStart(ev);

    // stub window.getSelection
    sinon.stub(window, "getSelection").returns({ toString: () => "test" });
    observer._onSelectionChange();
    expect(handler.callCount).toBe(1);
    expect(observer.loggedForSelection).toBe(true);

    // Calling it again does not call the handler again
    observer._onSelectionChange();
    expect(handler.callCount).toBe(1);

    // Until the selection is cleared
    observer._onSelectStart(ev);
    expect(observer.loggedForSelection).toBe(false);
    expect(handler.callCount).toBe(1);

    observer._onSelectionChange();
    expect(handler.callCount).toBe(2);

    observer._onSelectStart(ev);

    // Calling it again does not call the handler again
    sinon.restore();
    sinon.stub(window, "getSelection").returns({ toString: () => "" });
    observer._onSelectionChange();
    expect(handler.callCount).toBe(2);
  });
});
