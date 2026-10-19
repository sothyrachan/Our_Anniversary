// Gallery page: builds the floating polaroids and the click-to-enlarge view

// ✏️ EDIT THIS LIST: add your own photos and captions.
// Put image files in assets/images/couple/ (jpg, png, webp or svg all work).
const photos = [
  { src: "assets/images/couple/couple_pics/picture1.JPG", caption: "Best trip ever" },
  { src: "assets/images/couple/couple_pics/picture2.JPG", caption: "That exciting day" },
  { src: "assets/images/couple/couple_pics/picture3.JPG", caption: "Our favorite place" },
  { src: "assets/images/couple/couple_pics/picture4.JPG", caption: "Forever to go" },
  { src: "assets/images/couple/couple_pics/picture5.JPG", caption: "My handsome man" },
  { src: "assets/images/couple/couple_pics/picture6.JPG", caption: "Your pretty gf" },
  { src: "assets/images/couple/couple_pics/picture7.JPG", caption: "Us being us" },
  { src: "assets/images/couple/couple_pics/picture8.JPG", caption: "Crazy, Cozy night" },
];

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

// Same "random" numbers every time, so photos don't jump around on resize
function seeded(n) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x); // 0..1
}
const between = (n, min, max) => min + seeded(n) * (max - min);

let lastCols = 0;

function layout() {
  const width = gallery.clientWidth;
  const cols = width < 520 ? 2 : width < 800 ? 3 : 4;
  if (cols === lastCols) return; // nothing to redo
  lastCols = cols;

  const rows = Math.ceil(photos.length / cols);
  const cellW = width / cols;
  const photoW = Math.min(cellW * 0.78, 190);
  const cellH = photoW * 1.3 + 40;

  gallery.style.height = rows * cellH + 20 + "px";
  gallery.innerHTML = "";

  photos.forEach((photo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const item = document.createElement("figure");
    item.className = "polaroid";
    item.style.width = photoW + "px";
    item.style.left = col * cellW + (cellW - photoW) / 2 + between(i + 1, -cellW * 0.07, cellW * 0.07) + "px";
    item.style.top = row * cellH + between(i + 20, 0, 30) + "px";
    item.style.setProperty("--rot", between(i + 40, -9, 9).toFixed(1) + "deg");
    item.style.setProperty("--dx", between(i + 60, -14, 14).toFixed(0) + "px");
    item.style.setProperty("--dy", between(i + 80, -22, 22).toFixed(0) + "px");
    item.style.setProperty("--dur", between(i + 100, 4, 7).toFixed(1) + "s");
    item.style.setProperty("--delay", "-" + between(i + 120, 0, 4).toFixed(1) + "s");
    item.style.setProperty("--i", i);

    const btn = document.createElement("button");
    btn.className = "frame";
    btn.type = "button";
    btn.setAttribute("aria-label", "Open photo: " + photo.caption);

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.caption;
    img.loading = "lazy";

    const cap = document.createElement("span");
    cap.className = "caption";
    cap.textContent = photo.caption;

    btn.append(img, cap);
    btn.addEventListener("click", () => openLightbox(photo));
    item.appendChild(btn);
    gallery.appendChild(item);
  });
}

function openLightbox(photo) {
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption;
  lightboxCaption.textContent = photo.caption;
  lightbox.hidden = false;
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layout, 150);
});

layout();