// Letter page: types the letter out like a pen writing, then shows "Next"
const body = document.getElementById("letterBody");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");

const SPEED = 38; // milliseconds per character (lower = faster)
const START_DELAY = 1100; // wait for the paper to slide in first

const paragraphs = Array.from(body.querySelectorAll("p"));
const html = paragraphs.map((p) => p.innerHTML); // keeps <br> line breaks
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const cursor = document.createElement("span");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");

let skipped = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function finish() {
  paragraphs.forEach((p, i) => {
    p.innerHTML = html[i];
  });
  cursor.remove();
  skipBtn.classList.add("gone");
  nextBtn.classList.add("show");
}

// Split into characters, treating a <br> as a single "character"
function tokens(markup) {
  return markup
    .split(/(<br\s*\/?>)/i)
    .flatMap((part) => (/^<br/i.test(part) ? [part] : Array.from(part)));
}

async function type() {
  // Reserve the final height first so the page doesn't jump while typing
  body.style.minHeight = body.offsetHeight + "px";
  paragraphs.forEach((p) => {
    p.innerHTML = "";
  });

  await sleep(START_DELAY);

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    let shown = "";

    for (const t of tokens(html[i])) {
      if (skipped) return;
      shown += t;
      p.innerHTML = shown;
      p.append(cursor);

      // Keep the pen in view as the letter gets longer
      cursor.scrollIntoView({ block: "nearest", behavior: "auto" });

      const pause = /[.!?]/.test(t)
        ? SPEED * 9
        : /[,;:]/.test(t)
          ? SPEED * 4
          : SPEED;
      await sleep(pause);
    }
    await sleep(350); // little breath between paragraphs
  }
  finish();
}

skipBtn.addEventListener("click", () => {
  skipped = true;
  finish();
});

if (reduceMotion) {
  finish();
} else {
  type();
}

/* ---------- "Back to the start" confirmation popup ---------- */
const modal = document.getElementById("confirmModal");
const stayBtn = document.getElementById("stayBtn");

function openModal() {
  modal.hidden = false;
  stayBtn.focus();
}

function closeModal() {
  modal.hidden = true;
  nextBtn.focus();
}

nextBtn.addEventListener("click", openModal);
stayBtn.addEventListener("click", closeModal);
document.getElementById("closeBtn").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});
// "Yes, take me back" is a normal link to index.html, so the music keeps playing.