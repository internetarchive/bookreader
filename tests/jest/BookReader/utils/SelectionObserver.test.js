// @ts-check
import sinon from "sinon";
import { SelectionObserver } from "@/src/BookReader/utils/SelectionObserver.js";

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
    getSelectionStub.returns({ toString: () => "test", anchorNode: target, isCollapsed: false });
    observer._onSelectionChange();
    expect(handler.callCount).toBe(1);
    expect(handler.calledWith("started", target)).toBe(true);
    expect(observer.selecting).toBe(true);

    // Calling it again does not call the handler again
    observer._onSelectionChange();
    expect(handler.callCount).toBe(1);

    // Until the selection is cleared
    getSelectionStub.returns({ toString: () => "", anchorNode: null, isCollapsed: true });
    expect(observer.selecting).toBe(true);
    observer._onSelectionChange();
    expect(handler.callCount).toBe(2);
    expect(observer.selecting).toBe(false);
    expect(handler.calledWith("cleared", target)).toBe(true);

    // Calling it again does not call the handler again
    getSelectionStub.returns({ toString: () => "", isCollapsed: true });
    observer._onSelectionChange();
    expect(handler.callCount).toBe(2);
  });

  test('Fires changed event when focusNode changes with same selection text', () => {
    const handler = sinon.spy();
    const observer = new SelectionObserver(".text-layer", handler);
    const target = document.createElement("div");
    target.classList.add("text-layer");

    const focusNodeA = document.createElement("span");
    const focusNodeB = document.createElement("span");

    const getSelectionStub = sinon.stub(window, "getSelection");
    getSelectionStub.returns(/** @type {any} */({ toString: () => "hello", anchorNode: target, focusNode: focusNodeA, isCollapsed: false }));
    observer._onSelectionChange();
    expect(handler.callCount).toBe(1);
    expect(handler.calledWith("started", target)).toBe(true);

    // Same text, but focusNode has changed — should fire 'changed'
    getSelectionStub.returns(/** @type {any} */({ toString: () => "hello", anchorNode: target, focusNode: focusNodeB, isCollapsed: false }));
    observer._onSelectionChange();
    expect(handler.callCount).toBe(2);
    expect(handler.calledWith("changed", target)).toBe(true);

    // Calling again with the same focusNode should not fire again
    getSelectionStub.returns(/** @type {any} */({ toString: () => "hello", anchorNode: target, focusNode: focusNodeB, isCollapsed: false }));
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
