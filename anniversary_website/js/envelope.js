// Envelope page: open the envelope, burst some hearts, reveal the Next button, start the music
const stage    = document.querySelector(".stage");
const wrap     = document.querySelector(".envelope-wrap");
const envelope = document.getElementById("envelope");
const openBtn  = document.getElementById("openBtn");
const nextBtn  = document.getElementById("nextBtn");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (min, max) => min + Math.random() * (max - min);

// A little fountain of hearts when the card pops out
function burstHearts() {
  if (reduceMotion) return;
  for (let i = 0; i < 16; i++) {
    const heart = document.createElement("span");
    heart.className = "pop-heart";
    heart.style.setProperty("--s", rand(12, 26).toFixed(0) + "px");
    heart.style.setProperty("--dx", rand(-150, 150).toFixed(0) + "px");
    heart.style.setProperty("--dy", rand(-260, -110).toFixed(0) + "px");
    heart.style.setProperty("--rot", rand(-45, 45).toFixed(0) + "deg");
    heart.style.setProperty("--delay", rand(0, 0.4).toFixed(2) + "s");
    wrap.appendChild(heart);
    setTimeout(() => heart.remove(), 2200);
  }
}

function openEnvelope() {
  if (envelope.classList.contains("open")) return;

  envelope.classList.add("open");
  stage.classList.add("is-open");           // fades the greeting out of the card's way
  envelope.setAttribute("aria-label", "An open envelope with a card inside");
  openBtn.classList.add("gone");

  // A click is allowed to start audio in every browser
  if (window.startMusic) window.startMusic();

  setTimeout(burstHearts, 650);                             // when the card starts rising
  setTimeout(() => nextBtn.classList.add("show"), 1500);    // once the card has settled
}

openBtn.addEventListener("click", openEnvelope);
envelope.addEventListener("click", openEnvelope);