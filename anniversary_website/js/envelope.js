const hintTitle = document.getElementById("hint");
const envelope = document.getElementById("envelope");
const openBtn = document.getElementById("openBtn");
const nextBtn = document.getElementById("nextBtn");

const openEnvelope = function () {
    if (envelope.classList.contains("open")) return;

    envelope.classList.add("open");
    hintTitle.classList.add("sticky-top");
    envelope.setAttribute("aria-lable", "An open envelope with a card inside!");
    envelope.classList.add("gone");
    
    
    if (window.startMusic) window.startMusic();

    setTimeout(() => nextBtn.classList.add("show"), 500);
};

openBtn.addEventListener("click", openEnvelope);
nextBtn.addEventListener("click", openEnvelope);