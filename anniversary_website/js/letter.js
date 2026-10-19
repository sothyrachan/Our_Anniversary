// Letter page: types the letter out like a pen writing, then shows the button.
// Works for letters of any length.
const body    = document.getElementById("letterBody");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");

// ---- Typing speed ----
const BASE_SPEED   = 38;      // ms per character for a short letter
const MIN_SPEED    = 8;       // never type faster than this
const MAX_TOTAL_MS = 40000;   // long letters speed up so typing takes about 40 seconds at most
const START_DELAY  = 1100;    // wait for the paper to slide in first

const paragraphs   = Array.from(body.querySelectorAll("p"));
const originals    = paragraphs.map((p) => p.innerHTML);   // the real letter, kept safe
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cursor = document.createElement("span");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");

let skipped = false;
let follow  = true;   // scroll along with the pen until the reader scrolls on their own

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Split text into visible characters (keeps emoji like 💖 or 👩‍❤️‍👨 in one piece)
const segmenter = "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const toChars = (text) =>
  segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);

function textNodesOf(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

// Collect the text of every paragraph (formatting like <em>, <b>, <br> and &amp; stay intact)
function prepare() {
  return paragraphs.map((p) => {
    const nodes = textNodesOf(p);
    nodes.forEach((n) => { n.nodeValue = n.nodeValue.replace(/\s+/g, " "); });
    if (nodes.length) {
      nodes[0].nodeValue = nodes[0].nodeValue.replace(/^\s+/, "");
      const last = nodes[nodes.length - 1];
      last.nodeValue = last.nodeValue.replace(/\s+$/, "");
    }
    return nodes.map((node) => ({ node, chars: toChars(node.nodeValue) }));
  });
}

function finish() {
  paragraphs.forEach((p, i) => { p.innerHTML = originals[i]; });
  cursor.remove();
  body.style.minHeight = "";
  skipBtn.classList.add("gone");
  nextBtn.classList.add("show");
}

// Keep the pen on screen, but never fight the reader if they scroll by themselves
function followPen() {
  if (!follow) return;
  const bottom = cursor.getBoundingClientRect().bottom;
  const limit = window.innerHeight * 0.65;       // stay clear of the bottom buttons
  if (bottom > limit) window.scrollBy(0, bottom - limit);
}
const stopFollowing = () => { follow = false; };
window.addEventListener("wheel", stopFollowing, { passive: true });
window.addEventListener("touchmove", stopFollowing, { passive: true });
window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) stopFollowing();
});

async function type() {
  // Wait for the handwriting font, then reserve the finished height so nothing jumps
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  body.style.minHeight = body.offsetHeight + "px";

  const plan = prepare();
  const total = plan.reduce((sum, nodes) => sum + nodes.reduce((s, n) => s + n.chars.length, 0), 0);
  const speed = Math.max(MIN_SPEED, Math.min(BASE_SPEED, MAX_TOTAL_MS / Math.max(total * 1.3, 1)));

  plan.forEach((nodes) => nodes.forEach((n) => { n.node.nodeValue = ""; }));

  await sleep(START_DELAY);

  for (const nodes of plan) {
    for (const { node, chars } of nodes) {
      node.after(cursor);
      let shown = "";

      for (const ch of chars) {
        if (skipped || !body.isConnected) return;
        shown += ch;
        node.nodeValue = shown;
        followPen();

        const pause = /[.!?…]/.test(ch) ? speed * 9 : /[,;:]/.test(ch) ? speed * 4 : speed;
        await sleep(pause);
      }
    }
    await sleep(speed * 9);   // little breath between paragraphs
  }

  if (!skipped && body.isConnected) finish();
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
const modal    = document.getElementById("confirmModal");
const stayBtn  = document.getElementById("stayBtn");
const closeBtn = document.getElementById("closeBtn");

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
if (closeBtn) closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
// "Yes, take me back" is a normal link to index.html, so the music keeps playing.