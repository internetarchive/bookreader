import { ModeCoordinateSpace } from "@/src/BookReader/ModeCoordinateSpace";

describe("worldUnitsToRenderedPixels", () => {
  test("0 case", () => {
    const mcs = new ModeCoordinateSpace({ scale: 1 });
    expect(mcs.worldUnitsToRenderedPixels(0)).toBe(0);
  });

  test("Misc cases", () => {
    const mcs = new ModeCoordinateSpace({ scale: 1 });
    mcs.screenDPI = 100;
    expect(mcs.worldUnitsToRenderedPixels(1)).toBe(100);
    mcs.screenDPI = 78;
    expect(mcs.worldUnitsToRenderedPixels(1)).toBe(78);
  });
});
