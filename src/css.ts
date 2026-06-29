const STYLE_ID = 'pianova-styles';

const CSS = `
.pianova-keyboard {
  display: flex;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  box-sizing: border-box;
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
  touch-action: manipulation;
}

.pianova-white-key:hover {
  background: var(--pianova-white-hover, #f2f2f2);
}

.pianova-white-key.pianova-active {
  background: var(--pianova-white-active, #b0d0f0);
}

.pianova-black-key {
  background: var(--pianova-black-bg, #1a1a1a);
  border: 1px solid var(--pianova-black-border, #333);
  border-radius: 0 0 3px 3px;
  box-sizing: border-box;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.06s;
  touch-action: manipulation;
}

.pianova-black-key:hover {
  background: var(--pianova-black-hover, #333);
}

.pianova-black-key.pianova-active {
  background: var(--pianova-black-active, #4a7ab5);
}

.pianova-key-label {
  font-size: 10px;
  color: var(--pianova-label-color, #999);
  pointer-events: none;
  font-family: var(--pianova-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
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
