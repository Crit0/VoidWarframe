/* Legacy CacheBus shim — maps to new ApiEvents.
   Old events: "<kind>-updated" with detail { lang, source }
   New events: "<kind>:updated" with detail { lang, source, ageMs }
   We bridge in both directions so existing subscribers keep working. */

import { ApiEvents } from "./api/index.js";

class Bridge extends EventTarget {
  constructor() {
    super();
    for (const k of ["worldstate", "mods", "arcanes", "items"]) {
      ApiEvents.addEventListener(`${k}:updated`, (e) => {
        this.dispatchEvent(new CustomEvent(`${k}-updated`, { detail: e.detail }));
      });
      ApiEvents.addEventListener(`${k}:failed`, (e) => {
        this.dispatchEvent(new CustomEvent(`${k}-failed`, { detail: e.detail }));
      });
    }
    // Worldstate-failed legacy alias (singular event).
    ApiEvents.addEventListener("worldstate:failed", (e) => {
      this.dispatchEvent(new CustomEvent("worldstate-failed", { detail: e.detail }));
    });
  }
  // forward dispatchEvent → ApiEvents for old emitters
  dispatchEvent(ev) {
    return super.dispatchEvent(ev);
  }
}

export const CacheBus = new Bridge();
