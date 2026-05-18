/* Legacy shim — delegates to assets/js/api/poll.js. */
import { startPolling, stopPolling } from "./api/poll.js";

export function startWorldstatePolling() { startPolling(["worldstate"]); }
export function stopWorldstatePolling()  { stopPolling(); }
