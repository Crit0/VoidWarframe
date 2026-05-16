export function startRefreshCycle({ intervalMs, onTick, onRefresh }) {
  let nextAt = Date.now() + intervalMs;

  const tick = () => {
    const remaining = Math.max(0, nextAt - Date.now());
    if (typeof onTick === "function") onTick(remaining);
    if (remaining <= 0) {
      nextAt = Date.now() + intervalMs;
      if (typeof onRefresh === "function") {
        try { onRefresh(); } catch (e) { console.error("[VW] refresh failed:", e); }
      }
    }
  };

  tick();
  return setInterval(tick, 1000);
}

export function formatRefreshRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
