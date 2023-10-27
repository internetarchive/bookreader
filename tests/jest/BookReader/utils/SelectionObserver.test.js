// @ts-check
import sinon from "sinon";
import { SelectionObserver } from "@/src/BookReader/utils/SelectionObserver";

afterEach(() => {
  sinon.restore();
});

describe("SelectionObserver", () => {
  test("_onSelectionChange", () => {
    const handler = sinon.spy();
    const observer = new SelectionObserver(".text-layer", handler);
    const target = document.createElement("div");
    target.classList.add("text-layer");

    // stub window.getSelection
    const getSelectionStub = sinon.stub(window, "getSelection");
    getSelectionStub.returns({ toString: () => "test", anchorNode: target });
    observer._onSelectionChange();
    expect(handler.callCount).toBe(1);
    expect(handler.calledWith("started", target)).toBe(true);
    expect(observer.selecting).toBe(true);

    // Calling it again does not call the handler again
    observer._onSelectionChange();
    expect(handler.callCount).toBe(1);

    // Until the selection is cleared
    getSelectionStub.returns({ toString: () => "", anchorNode: null });
    expect(observer.selecting).toBe(true);
    expect(handler.callCount).toBe(1);

    observer._onSelectionChange();
    expect(handler.callCount).toBe(2);
    expect(handler.calledWith("cleared", target)).toBe(true);

    // Calling it again does not call the handler again
    sinon.restore();
    sinon.stub(window, "getSelection").returns({ toString: () => "" });
    observer._onSelectionChange();
    expect(handler.callCount).toBe(2);
  });

  test('Only fires when selection started in selector', () => {
    const handler = sinon.spy();
    const observer = new SelectionObserver(".text-layer", handler);
    const target = document.createElement("div");
    target.classList.add("text-layer");

    // stub window.getSelection
    const getSelectionStub = sinon.stub(window, "getSelection");
    getSelectionStub.returns({ toString: () => "test", anchorNode: document.body });
    observer._onSelectionChange();
    expect(handler.callCount).toBe(0);
    expect(observer.selecting).toBe(false);
  });
});
