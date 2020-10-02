import { TouchGestures } from '../../src/js/BookReader/TouchGestures.js';
import sinon from 'sinon';

describe('quantizedZoom', () => {
  test('Zooms in as scale increases', () => {
    const fakeBr = { zoom: sinon.stub() };
    const tg = new TouchGestures(fakeBr);
    tg.ZOOM_FACTOR = 1.25;

    tg.quantizedZoom(1);
    expect(fakeBr.zoom.callCount).toBe(0);
    tg.quantizedZoom(1.25);
    expect(fakeBr.zoom.callCount).toBe(0);
    tg.quantizedZoom(1.26);
    expect(fakeBr.zoom.args).toEqual([[1]]);
  });

  test('Zooms out as scale decreases', () => {
    const fakeBr = { zoom: sinon.stub() };
    const tg = new TouchGestures(fakeBr);
    tg.ZOOM_FACTOR = 1.25;

    tg.quantizedZoom(1);
    expect(fakeBr.zoom.callCount).toBe(0);
    tg.quantizedZoom(0.8);
    expect(fakeBr.zoom.callCount).toBe(0);
    tg.quantizedZoom(0.79);
    expect(fakeBr.zoom.args).toEqual([[-1]]);
  });

  test('Zooms in/out multiple times during gesture', () => {
    const fakeBr = { zoom: sinon.stub() };
    const tg = new TouchGestures(fakeBr);
    tg.ZOOM_FACTOR = 1.25;

    tg.quantizedZoom(1);
    expect(fakeBr.zoom.callCount).toBe(0);
    tg.quantizedZoom(1.25);
    expect(fakeBr.zoom.callCount).toBe(0);
    tg.quantizedZoom(1.26);
    expect(fakeBr.zoom.args).toEqual([[1]]);
    tg.quantizedZoom(1.25);
    expect(fakeBr.zoom.args).toEqual([[1]]);
    tg.quantizedZoom(1.0);
    expect(fakeBr.zoom.args).toEqual([[1]]);
    tg.quantizedZoom(0.99);
    expect(fakeBr.zoom.args).toEqual([[1], [-1]]);
  });
});
