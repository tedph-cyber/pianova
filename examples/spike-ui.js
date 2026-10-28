// Small helpers shared by the 0.2 examples.

/** Hide the start screen on the first tap. Also makes the later key presses a user gesture for audio. */
export function wireStart() {
  const overlay = document.getElementById('start');
  document.getElementById('start-btn').onclick = () => { overlay.hidden = true; };
}

/** Bar buttons that move a `fit` keyboard down or up an octave (touch cannot pan it). */
export function wireSteps(piano) {
  const down = document.getElementById('oct-down');
  const up = document.getElementById('oct-up');
  const sync = () => {
    const { low, high } = piano.visibleRange;
    down.disabled = low < 12;
    up.disabled = high + 12 > 127;
  };
  // pointerup, not click: Chrome can drop the click of a tap that follows multi-touch.
  down.onpointerup = () => piano.shiftView(-1);
  up.onpointerup = () => piano.shiftView(1);
  piano.on('rangeChange', sync);
  sync();
}

/** Replay the small pop animation on an element. */
export function pop(el) {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

const ROTATE_ART = `<svg class="rotate-art" viewBox="0 0 120 80" aria-hidden="true">
  <rect x="10" y="18" width="34" height="56" rx="6"/><rect x="62" y="34" width="52" height="32" rx="6"/>
  <path d="M40 10c14-6 30-2 38 12m0 0l1-9m-1 9l-9-2"/></svg>`;

/** Add the start screen and the "turn your phone sideways" screen, then wire the start button. */
export function mountOverlays({ title, text }) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay" id="start"><div class="start-card">
      <h1>${title}</h1><p>${text}</p><button type="button" class="start-btn" id="start-btn">Start</button>
    </div></div>
    <div class="overlay rotate" aria-live="polite"><div class="start-card">
      ${ROTATE_ART}<h1>Turn your phone sideways</h1><p>The piano needs the whole screen.</p>
    </div></div>`);
  wireStart();
}
