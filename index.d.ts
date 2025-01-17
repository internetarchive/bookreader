export type BookreaderOptions = typeof import('./src/BookReader/options').DEFAULT_OPTIONS;

export declare class Bookreader {
  version: string;
  constMode1up: number;
  constMode2up: number;
  constModeThumb: number;
  constNavAnimationDuration: number;
  constResizeAnimationDuration: number;
  setup(options: BookreaderOptions): void;
  trigger(name: string, props: object): void;
  bind(name: string, callback: Function): void;
  unbind(name: string, callback: Function): void;
  resize(): void;
  setupKeyListeners(): void;
  drawLeafs(): void;
  bindGestures(): void;
  zoom(direction: number): void;
  resizeBRcontainer(animated: boolean): void;
  centerPageView(): void;
}
