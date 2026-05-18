if ("serviceWorker" in navigator) {
  const swUrl = new URL("../../sw.js", import.meta.url).href;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl, { scope: "./" }).catch((err) => {
      console.warn("[VW] SW registration failed:", (err && err.message) || String(err));
    });
  });
}
