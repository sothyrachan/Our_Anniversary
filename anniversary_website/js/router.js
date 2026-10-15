// Smooth page changes that never interrupt the music.
//
// Instead of letting the browser load a whole new page (which kills the audio),
// this script fetches the next page, swaps the visible content, and leaves the
// <audio> element alone. Anything marked data-persist is never replaced.
(function () {
  // fetch() is blocked when a page is opened straight from disk (file://).
  // In that case normal links are used: run the site with Live Server instead.
  if (location.protocol === "file:") {
    console.warn(
      "router.js: use Live Server or a web host for seamless music (file:// can't do it).",
    );
    return;
  }

  const PERSIST = "[data-persist]";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let navigating = false;

  /* ---- Our own listeners (registered BEFORE we start tracking) ---- */
  document.addEventListener("click", (e) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    const a = e.target.closest("a[href]");
    if (!a) return;
    if (
      (a.target && a.target !== "_self") ||
      a.hasAttribute("download") ||
      a.hasAttribute("data-no-router")
    )
      return;

    const url = new URL(a.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;

    e.preventDefault();
    go(url.href, true);
  });

  window.addEventListener("popstate", () => go(location.href, false)); // back / forward buttons

  /* ---- Track listeners that page scripts add, so we can remove them on leave ---- */
  const tracked = [];
  [window, document].forEach((target) => {
    const original = target.addEventListener;
    target.addEventListener = function (type, fn, opts) {
      tracked.push({ target, type, fn, opts });
      return original.call(this, type, fn, opts);
    };
  });

  /* ---- Navigation ---- */
  async function go(url, push) {
    if (navigating) return;
    navigating = true;
    document.body.classList.add("page-leave");

    try {
      const [res] = await Promise.all([fetch(url), sleep(220)]); // fade-out time
      if (!res.ok) throw new Error("HTTP " + res.status);
      const doc = new DOMParser().parseFromString(
        await res.text(),
        "text/html",
      );

      const staleStyles = await addNewStyles(doc, url);

      // Remove old page listeners (document / window level)
      tracked
        .splice(0)
        .forEach((l) => l.target.removeEventListener(l.type, l.fn, l.opts));

      swapBody(doc);
      staleStyles.forEach((link) => link.remove());

      document.title = doc.title;
      if (push) history.pushState({}, "", url);
      window.scrollTo(0, 0);

      runPageScripts(doc, url);
    } catch (err) {
      console.error("router.js: falling back to a normal page load", err);
      location.href = url;
    } finally {
      navigating = false;
      document.body.classList.remove("page-leave");
    }
  }

  // Load the next page's CSS before showing it, so there's no flash of unstyled content
  async function addNewStyles(doc, baseUrl) {
    const wanted = Array.from(
      doc.querySelectorAll('link[rel="stylesheet"]'),
    ).map((l) => new URL(l.getAttribute("href"), baseUrl).href);
    const current = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    );
    const have = current.map((l) => l.href);

    await Promise.all(
      wanted
        .filter((href) => !have.includes(href))
        .map(
          (href) =>
            new Promise((resolve) => {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = href;
              link.onload = link.onerror = resolve;
              document.head.appendChild(link);
            }),
        ),
    );
    return current.filter((l) => !wanted.includes(l.href)); // old page CSS to remove
  }

  function swapBody(doc) {
    // Remove everything except the persistent bits (audio, music button, shared scripts)
    Array.from(document.body.children).forEach((el) => {
      if (!el.matches(PERSIST)) el.remove();
    });

    const anchor = document.querySelector(PERSIST); // new content goes before these
    Array.from(doc.body.children).forEach((el) => {
      if (el.matches(PERSIST) || el.tagName === "SCRIPT") return;
      const node = document.importNode(el, true);
      node.classList.add("page-enter");
      document.body.insertBefore(node, anchor);
    });
  }

  // Page scripts run as modules with a unique URL so they execute again every visit
  function runPageScripts(doc, baseUrl) {
    doc.querySelectorAll("script[src]").forEach((s) => {
      if (s.matches(PERSIST)) return;
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        new URL(s.getAttribute("src"), baseUrl).href + "?v=" + Date.now();
      document.body.appendChild(script);
    });
  }
})();
