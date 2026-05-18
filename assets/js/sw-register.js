/* Service Worker registration — fails silently on environments without SW
   (no HTTPS, private mode, old browsers). Never breaks the page. */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    try {
      const swUrl = new URL("../../sw.js", import.meta.url).href;
      const scope = new URL("../../", import.meta.url).href;
      navigator.serviceWorker.register(swUrl, { scope }).catch((err) => {
        console.warn("[VW] SW registration failed:", (err && err.message) || String(err));
      });
    } catch (err) {
      console.warn("[VW] SW URL build failed:", (err && err.message) || String(err));
    }
  });
}
