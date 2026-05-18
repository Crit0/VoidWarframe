/* Single event bus for data updates. Consumers subscribe to "<kind>:updated"
   with detail { lang, source, ageMs }, plus "<kind>:failed" with { lang, err }. */

export const ApiEvents = new EventTarget();

export function emitUpdated(kind, lang, source, ageMs) {
  ApiEvents.dispatchEvent(new CustomEvent(`${kind}:updated`,
    { detail: { lang, source, ageMs } }));
}

export function emitFailed(kind, lang, err) {
  ApiEvents.dispatchEvent(new CustomEvent(`${kind}:failed`,
    { detail: { lang, err: (err && err.message) || String(err) } }));
}
