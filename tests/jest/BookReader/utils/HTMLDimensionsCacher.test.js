// @ts-check
import  sinon from 'sinon';
import { HTMLDimensionsCacher } from '@/src/BookReader/utils/HTMLDimensionsCacher.js';

describe('HTMLDimensionsCacher', () => {
  test('Does not read from element directly', () => {
    const element = document.createElement('div');
    const getBoundingClientRectStub = element.getBoundingClientRect = sinon.stub().returns({ top: 10, left: 20 });
    const clientWidthStub = sinon.stub().returns(300);
    const clientHeightStub = sinon.stub().returns(500);
    Object.defineProperty(element, 'clientWidth', { get: clientWidthStub });
    Object.defineProperty(element, 'clientHeight', { get: clientHeightStub });

    const hdc = new HTMLDimensionsCacher(element);
    hdc.clientHeight;
    expect(getBoundingClientRectStub.callCount).toBe(0);
    expect(clientWidthStub.callCount).toBe(0);
    expect(clientHeightStub.callCount).toBe(0);
  });

  test('Read from element when calling update', () => {
    const element = document.createElement('div');
    const getBoundingClientRectStub = element.getBoundingClientRect = sinon.stub().returns({ top: 10, left: 20 });
    const clientWidthStub = sinon.stub().returns(300);
    const clientHeightStub = sinon.stub().returns(500);
    Object.defineProperty(element, 'clientWidth', { get: clientWidthStub });
    Object.defineProperty(element, 'clientHeight', { get: clientHeightStub });

    const hdc = new HTMLDimensionsCacher(element);
    hdc.updateClientSizes();
    expect(getBoundingClientRectStub.callCount).toBe(1);
    expect(clientWidthStub.callCount).toBe(1);
    expect(clientHeightStub.callCount).toBe(1);

    expect(hdc.boundingClientRect).toEqual({ top: 10, left: 20 });
    expect(hdc.clientWidth).toBe(300);
    expect(hdc.clientHeight).toBe(500);
  });

  test('Does not listen for window resizes when not attached', () => {
    const element = document.createElement('div');
    const hdc = new HTMLDimensionsCacher(element);
    const dummyWindow = new EventTarget();
    const debouncedUpdateSpy = sinon.spy(hdc, 'debouncedUpdateClientSizes');

    dummyWindow.dispatchEvent(new Event('resize', {}));
    expect(debouncedUpdateSpy.callCount).toBe(0);

    hdc.attachResizeListener(dummyWindow);

    dummyWindow.dispatchEvent(new Event('resize', {}));
    expect(debouncedUpdateSpy.callCount).toBe(1);

    hdc.detachResizeListener(dummyWindow);

    dummyWindow.dispatchEvent(new Event('resize', {}));
    expect(debouncedUpdateSpy.callCount).toBe(1);
  });
});
