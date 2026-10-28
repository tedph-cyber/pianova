/** jsdom has no PointerEvent: a MouseEvent carrying the pointer fields the code reads. */
export function pointerEvent(
  type: string,
  target: Element,
  { id = 1, pointerType = 'touch', button = 0, x = 0, y = 0 } = {},
): PointerEvent {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, button, clientX: x, clientY: y });
  Object.defineProperty(e, 'pointerId', { value: id });
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  target.dispatchEvent(e);
  return e as unknown as PointerEvent;
}

/** Make `document.elementFromPoint` answer from a function, restoring it afterwards. */
export function stubElementFromPoint(fn: (x: number, y: number) => Element | null): () => void {
  const prev = (document as any).elementFromPoint;
  (document as any).elementFromPoint = fn;
  return () => { (document as any).elementFromPoint = prev; };
}

export function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}
