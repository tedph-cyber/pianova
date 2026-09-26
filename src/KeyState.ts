import type { KeyElement, KeyState } from './types';
import { setKeyLabel } from './Keyboard';

const COLORED_CLASS = 'pianova-colored';
const MARKED_CLASS = 'pianova-marked';
const BADGE_CLASS = 'pianova-key-badge';
const COLOR_VAR = '--pianova-key-color';

function setBadge(el: HTMLElement, badge: KeyState['badge']): void {
  el.querySelector(`.${BADGE_CLASS}`)?.remove();
  if (badge === undefined || badge === '') return;
  const span = document.createElement('span');
  span.className = BADGE_CLASS;
  span.textContent = String(badge);
  // Badge sits above the label.
  el.insertBefore(span, el.querySelector('.pianova-key-label'));
}

/** Applies a key's full visual state, replacing any previous one. `null` clears it. */
export function applyKeyState(key: KeyElement, state: KeyState | null): void {
  const el = key.element;
  const color = state?.color;

  el.classList.toggle(COLORED_CLASS, Boolean(color));
  if (color) el.style.setProperty(COLOR_VAR, color);
  else el.style.removeProperty(COLOR_VAR);

  el.classList.toggle(MARKED_CLASS, Boolean(state?.mark));
  setKeyLabel(el, state?.label ?? key.defaultLabel);
  setBadge(el, state?.badge);
}
