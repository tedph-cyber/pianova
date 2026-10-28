const STYLE_ID = 'pianova-styles';

const CSS = `
.pianova-keyboard {
  display: flex;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  box-sizing: border-box;
  /* Set --pianova-height: auto and let a flex parent size it to fill the screen. */
  height: var(--pianova-height, 200px);
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}

.pianova-keyboard::-webkit-scrollbar {
  height: 6px;
}

.pianova-keyboard::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.15);
  border-radius: 3px;
}

.pianova-white-key {
  background: var(--pianova-white-bg, #ffffff);
  border: 1px solid var(--pianova-key-border, #c8c8c8);
  border-radius: 0 0 5px 5px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 6px;
  flex-shrink: 0;
  transition: background 0.06s;
  z-index: 1;
  position: relative;
  touch-action: none;
}

.pianova-white-key:hover {
  background: var(--pianova-white-hover, #f2f2f2);
}

.pianova-white-key.pianova-lit {
  background: var(--pianova-white-lit, #ffeab8);
  box-shadow: inset 0 0 0 3px var(--pianova-lit-outline, #e09a00);
}

.pianova-black-key.pianova-lit {
  background: var(--pianova-black-lit, #b9780a);
  box-shadow: inset 0 0 0 2px var(--pianova-lit-outline, #ffd27a);
}

/* A dot on lit keys, so the highlight does not rely on colour alone. */
.pianova-lit::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: var(--pianova-lit-dot, #c47f00);
  pointer-events: none;
}

.pianova-black-key.pianova-lit::after {
  background: var(--pianova-lit-dot-black, #ffd27a);
}

/* Colour set via setKeyState(); a pressed key still shows its active colour. */
.pianova-white-key.pianova-colored,
.pianova-black-key.pianova-colored {
  background: var(--pianova-key-color);
}

/* Pressed keys sink and show an inner shadow, so the state is not colour-only. */
.pianova-white-key.pianova-active {
  background: var(--pianova-white-active, #b0d0f0);
  transform: translateY(2px);
  box-shadow: inset 0 5px 6px rgba(0,0,0,.28);
}

.pianova-black-key {
  height: var(--pianova-black-height, 62%);
  background: var(--pianova-black-bg, #1a1a1a);
  border: 1px solid var(--pianova-black-border, #333);
  border-radius: 0 0 3px 3px;
  box-sizing: border-box;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.06s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 4px;
  touch-action: none;
}

.pianova-black-key:hover {
  background: var(--pianova-black-hover, #333);
}

.pianova-black-key.pianova-active {
  background: var(--pianova-black-active, #4a7ab5);
  transform: translateY(3px);
  box-shadow: inset 0 4px 5px rgba(0,0,0,.5);
}

.pianova-key-label {
  font-size: 10px;
  color: var(--pianova-label-color, #999);
  pointer-events: none;
  font-family: var(--pianova-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

.pianova-view-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.pianova-view-btn {
  font: inherit;
  font-size: 14px;
  min-width: 48px;
  min-height: 40px;
  border-radius: 6px;
  border: 1px solid var(--pianova-key-border, #c8c8c8);
  background: var(--pianova-view-btn-bg, #f2f2f2);
  color: var(--pianova-view-btn-color, #222);
  cursor: pointer;
  touch-action: manipulation;
}

.pianova-view-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.pianova-black-key .pianova-key-label {
  color: var(--pianova-black-label-color, #ddd);
}

.pianova-white-key.pianova-marked {
  box-shadow: inset 0 0 0 3px var(--pianova-mark-color, #1a1a1a);
}

.pianova-black-key.pianova-marked {
  box-shadow: 0 0 0 3px var(--pianova-mark-color, #1a1a1a), inset 0 0 0 2px var(--pianova-white-bg, #ffffff);
}

.pianova-key-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  margin-bottom: 6px;
  box-sizing: border-box;
  border-radius: 999px;
  border: 1.5px solid var(--pianova-badge-border, #1a1a1a);
  background: var(--pianova-badge-bg, #ffffff);
  color: var(--pianova-badge-color, #1a1a1a);
  font: 700 12px var(--pianova-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  pointer-events: none;
}
`;

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function removeStyles(): void {
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
}
