// Shared background-music controller (a looping playlist).
// Songs play one after another, and when the last one ends the first starts again.
(function () {
  const audio = document.getElementById("bgMusic");
  const toggle = document.getElementById("musicToggle");
  if (!audio) return;

  // ✏️ YOUR SONGS: add as many as you like, in the order they should play.
  const playlist = ["assets/audio/bg-music.mp3", "assets/audio/bg-music-2.mp3"];

  audio.volume = 0.5;
  audio.loop = playlist.length === 1; // a single song just repeats itself

  // Pick up where the last page left off (matters after a refresh or a full page load)
  let index =
    (parseInt(sessionStorage.getItem("musicIndex"), 10) || 0) % playlist.length;
  let resumeAt = parseFloat(sessionStorage.getItem("musicTime")) || 0;
  let failures = 0; // how many songs in a row failed to load

  function load(i) {
    index = i % playlist.length;
    audio.src = playlist[index];
    audio.load();
  }

  load(index);
  audio.addEventListener("loadedmetadata", () => {
    if (resumeAt) {
      audio.currentTime = resumeAt;
      resumeAt = 0;
    }
  });

  function updateIcon() {
    if (toggle) toggle.classList.toggle("off", audio.paused);
  }

  function play() {
    return audio
      .play()
      .then(() => {
        failures = 0;
        updateIcon();
      })
      .catch(() => {});
  }

  function pause() {
    audio.pause();
    sessionStorage.setItem("musicOn", "0");
    updateIcon();
  }

  function next() {
    load(index + 1);
    if (sessionStorage.getItem("musicOn") === "1") play();
  }

  // Song finished: go to the next one (the last song wraps around to the first)
  audio.addEventListener("ended", next);

  // A missing or broken file: skip it, but give up if every song fails
  audio.addEventListener("error", () => {
    failures++;
    if (failures < playlist.length) next();
  });

  // Other scripts call window.startMusic() after a click
  window.startMusic = () => {
    sessionStorage.setItem("musicOn", "1");
    return play();
  };

  if (toggle) {
    toggle.addEventListener("click", () =>
      audio.paused ? window.startMusic() : pause(),
    );
  }

  // Remember the song and position before leaving
  window.addEventListener("pagehide", () => {
    sessionStorage.setItem("musicIndex", index);
    sessionStorage.setItem("musicTime", audio.currentTime);
  });

  // On a fresh page load, try to keep playing; if the browser blocks it, start on first click
  if (sessionStorage.getItem("musicOn") === "1") {
    play();
    document.addEventListener(
      "click",
      () => {
        if (audio.paused) play();
      },
      { once: true },
    );
  }

  updateIcon();
})();
