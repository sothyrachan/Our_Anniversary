// Question page: runaway "No" button, fading popups, and the "Yes" celebration

// ✏️ Popup messages. One is picked at random each time. Add more lines if you like!
const messages = [
  "I know you do not love thats why you are not clicking the No button yet HikHik",
];

const yesBtn   = document.getElementById("yesBtn");
const noBtn    = document.getElementById("noBtn");
const noSlot   = document.getElementById("noSlot");
const ask      = document.getElementById("ask");
const result   = document.getElementById("result");
const mascot   = document.getElementById("mascot");
const musicBtn = document.getElementById("musicToggle");

const TOAST_MS = 2800;       // how long a popup lives
const MAX_TOASTS = 4;        // never flood the screen
const DANGER_ZONE = 90;      // px: No runs when the pointer gets this close

let running = false;         // has No started running yet?
let dodges = 0;
let lastDodge = 0;
let lastToast = 0;
let finished = false;
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

const rand = (min, max) => min + Math.random() * (max - min);

/* ---------- Popups ---------- */
function showToast() {
  const now = performance.now();
  if (now - lastToast < 700) return;
  if (document.querySelectorAll(".toast").length >= MAX_TOASTS) return;
  lastToast = now;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("aria-hidden", "true");
  toast.textContent = messages[Math.floor(Math.random() * messages.length)];
  document.body.appendChild(toast);

  // Place it somewhere visible on screen
  const m = 10;
  const x = rand(m, Math.max(m, window.innerWidth - toast.offsetWidth - m));
  const y = rand(m, Math.max(m, window.innerHeight - toast.offsetHeight - m));
  toast.style.left = x + "px";
  toast.style.top = y + "px";

  setTimeout(() => toast.remove(), TOAST_MS + 100);
}

/* ---------- Runaway No button ---------- */
function startRunning() {
  const r = noBtn.getBoundingClientRect();
  noSlot.style.width = r.width + "px";     // hold its place in the layout
  noSlot.style.height = r.height + "px";
  noBtn.style.left = r.left + "px";
  noBtn.style.top = r.top + "px";
  noBtn.classList.add("running");
  noBtn.offsetWidth;                        // force a reflow so the move animates
  running = true;
}

function dodge() {
  if (finished) return;
  const now = performance.now();
  if (now - lastDodge < 180) return;
  lastDodge = now;

  if (!running) startRunning();

  const m = 12;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const w = noBtn.offsetWidth;
  const h = noBtn.offsetHeight;

  // Keep away from the Yes button and the music button
  const avoid = [yesBtn, musicBtn].map((el) => el.getBoundingClientRect());
  const pad = 24;

  let best = null;
  for (let i = 0; i < 50; i++) {
    const x = rand(m, Math.max(m, W - w - m));
    const y = rand(m, Math.max(m, H - h - m));

    const blocked = avoid.some((r) =>
      x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad
    );
    if (blocked) continue;

    const d = Math.hypot(x + w / 2 - pointer.x, y + h / 2 - pointer.y);
    if (d > 200) { best = { x, y }; break; }          // far enough, take it
    if (!best || d > best.d) best = { x, y, d };       // otherwise remember the farthest
  }
  if (!best) best = { x: m, y: m };

  noBtn.style.left = best.x + "px";
  noBtn.style.top = best.y + "px";

  // Yes gets a little bigger each time, up to 1.7x
  dodges++;
  yesBtn.style.setProperty("--yes-scale", Math.min(1 + dodges * 0.07, 1.7).toFixed(2));

  showToast();
}

// Mouse: run when the pointer gets close
document.addEventListener("pointermove", (e) => {
  pointer = { x: e.clientX, y: e.clientY };
  if (finished) return;
  const r = noBtn.getBoundingClientRect();
  const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  if (dist < DANGER_ZONE + r.width / 2) dodge();
});

// Touch: run the moment a finger lands on it
noBtn.addEventListener("pointerdown", (e) => {
  pointer = { x: e.clientX, y: e.clientY };
  e.preventDefault();
  dodge();
});
noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); dodge(); }, { passive: false });

// Keyboard / anything else that sneaks through
noBtn.addEventListener("focus", () => { noBtn.blur(); dodge(); });
noBtn.addEventListener("click", (e) => { e.preventDefault(); dodge(); });

// If the window changes size, make sure No is still on screen
window.addEventListener("resize", () => { if (running) dodge(); });

/* ---------- Yes! ---------- */
function celebrate() {
  for (let i = 0; i < 46; i++) {
    const heart = document.createElement("span");
    heart.className = "confetti";
    heart.style.setProperty("--s", rand(14, 34).toFixed(0) + "px");
    heart.style.setProperty("--dx", rand(-window.innerWidth * 0.5, window.innerWidth * 0.5).toFixed(0) + "px");
    heart.style.setProperty("--dy", rand(-window.innerHeight * 0.6, window.innerHeight * 0.25).toFixed(0) + "px");
    heart.style.setProperty("--rot", rand(-200, 200).toFixed(0) + "deg");
    heart.style.animationDelay = rand(0, 0.35).toFixed(2) + "s";
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2400);
  }
}

yesBtn.addEventListener("click", () => {
  finished = true;
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  noBtn.hidden = true;
  ask.hidden = true;
  result.hidden = false;
  mascot.src = "assets/images/mascot-happy.svg";
  celebrate();
});