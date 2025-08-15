/**
 * Animate opalescent background blobs.
 */
const root = document.documentElement;

// Ranges for random positions and sizes
const xr = [12, 88]; // %
const yr = [18, 82]; // %
const rr = [52, 92]; // vmin

const rnd = (a, b) => Math.random() * (b - a) + a;

function setBlob(i, instant = false) {
  const x = rnd(...xr).toFixed(2);
  const y = rnd(...yr).toFixed(2);
  const r = rnd(...rr).toFixed(2) + 'vmin';
  if (instant) {
    const prev = getComputedStyle(document.body).transition;
    document.body.style.transition = 'none';
    root.style.setProperty(`--x${i}`, `${x}%`);
    root.style.setProperty(`--y${i}`, `${y}%`);
    root.style.setProperty(`--r${i}`, r);
    void document.body.offsetHeight;
    document.body.style.transition = prev;
  } else {
    root.style.setProperty(`--x${i}`, `${x}%`);
    root.style.setProperty(`--y${i}`, `${y}%`);
    root.style.setProperty(`--r${i}`, r);
  }
}

[1, 2, 3, 4].forEach((i) => setBlob(i, true));

const map = {
  '--x1': '--d1',
  '--y1': '--d1',
  '--r1': '--d1',
  '--x2': '--d2',
  '--y2': '--d2',
  '--r2': '--d2',
  '--x3': '--d3',
  '--y3': '--d3',
  '--r3': '--d3',
  '--x4': '--d4',
  '--y4': '--d4',
  '--r4': '--d4',
};

document.body.addEventListener('transitionend', (e) => {
  if (!map[e.propertyName]) return;
  const i = e.propertyName.match(/\d/)[0];
  setTimeout(() => setBlob(i), 20);
});

setTimeout(() => {
  [1, 2, 3, 4].forEach(setBlob);
}, 60);
