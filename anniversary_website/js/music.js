// Shared background-music controller (include on every page)
(function () {
  const audio = document.getElementById("bgMusic");
  const toggle = document.getElementById("musicToggle");
  if (!audio) return;

  audio.volume = 0.5;

  // Resume where the last page left off
  const savedTime = parseFloat(sessionStorage.getItem("musicTime") || "0");
  const restore = () => { if (savedTime) audio.currentTime = savedTime; };
  if (audio.readyState > 0) restore();
  else audio.addEventListener("loadedmetadata", restore, { once: true });

  function updateIcon() {
    if (toggle) toggle.classList.toggle("off", audio.paused);
  }

  function play() {
    return audio.play().then(updateIcon).catch(() => {});
  }

  function pause() {
    audio.pause();
    sessionStorage.setItem("musicOn", "0");
    updateIcon();
  }

  // Other scripts can call window.startMusic() after a click
  window.startMusic = () => {
    sessionStorage.setItem("musicOn", "1");
    return play();
  };

  if (toggle) {
    toggle.addEventListener("click", () => (audio.paused ? window.startMusic() : pause()));
  }

  // Save position before leaving the page
  window.addEventListener("pagehide", () => {
    sessionStorage.setItem("musicTime", audio.currentTime);
  });

  // On later pages, try to continue playing; if the browser blocks it, start on first click
  if (sessionStorage.getItem("musicOn") === "1") {
    play();
    document.addEventListener("click", () => { if (audio.paused) play(); }, { once: true });
  }

  updateIcon();
})();