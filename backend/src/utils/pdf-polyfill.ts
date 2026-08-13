/**
 * Minimal DOMMatrix / Path2D polyfills for pdfjs-dist in Node.js.
 * pdfjs-dist v6+ references these globals even in the "legacy" build.
 */

class DOMMatrixPolyfill {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(_init?: string | number[]) {}

  translateSelf(_tx: number, _ty: number) { return this; }
  scaleSelf(_sx: number, _sy?: number) { return this; }
  multiplySelf(_other: DOMMatrixPolyfill) { return this; }
  inverse() { return this; }
}

class Path2DPolyfill {
  constructor(_init?: string | Path2DPolyfill) {}
  moveTo(_x: number, _y: number) {}
  lineTo(_x: number, _y: number) {}
  closePath() {}
  arc(_x: number, _y: number, _r: number, _start: number, _end: number, _ccw?: boolean) {}
  rect(_x: number, _y: number, _w: number, _h: number) {}
  ellipse(_x: number, _y: number, _rx: number, _ry: number, _rot: number, _start: number, _end: number, _ccw?: boolean) {}
  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number) {}
  bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number) {}
  fill(_rule?: string) {}
  stroke() {}
  clip(_rule?: string) {}
  isPointInPath(_x: number, _y: number, _rule?: string) { return false; }
  isPointInStroke(_x: number, _y: number) { return false; }
}

if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  Object.defineProperty(globalThis, 'DOMMatrix', { value: DOMMatrixPolyfill, writable: true, configurable: true });
}

if (typeof (globalThis as any).Path2D === 'undefined') {
  Object.defineProperty(globalThis, 'Path2D', { value: Path2DPolyfill, writable: true, configurable: true });
}
