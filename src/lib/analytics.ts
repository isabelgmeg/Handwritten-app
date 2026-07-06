import { supabase } from "./supabase";

/**
 * First-party, anonymous product analytics.
 *
 * Session id lives in sessionStorage (not localStorage): it's a random token
 * used only to link events within one tab session, and it disappears when the
 * tab closes. No IP, device, or persistent identifier is ever stored — this is
 * a join key for funnels/session metrics, not a way to recognize return visitors.
 */
const SESSION_KEY = "hfc_session_id";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // sessionStorage can throw in locked-down contexts (e.g. some private-browsing
    // modes or storage-blocking extensions) — fall back to a per-call id rather
    // than letting analytics break the app.
    return crypto.randomUUID();
  }
}

export function track(eventName: string, props: Record<string, unknown> = {}): void {
  try {
    const session_id = getSessionId();
    supabase
      .from("events")
      .insert({ session_id, event_name: eventName, props })
      .then(({ error }) => {
        if (error) console.debug("[analytics] insert failed:", error.message);
      })
      .catch((err) => console.debug("[analytics] insert threw:", err));
  } catch (err) {
    // Analytics must never break app functionality — swallow anything synchronous too
    // (e.g. a misconfigured client), same guarantee the async path already gives.
    console.debug("[analytics] track() threw:", err);
  }
}

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * For continuous controls (sliders) that fire on every drag tick — collapses
 * rapid-fire changes into one event per ~800ms pause, keyed by event name.
 */
export function trackDebounced(
  eventName: string,
  props: Record<string, unknown> = {},
  delayMs = 800,
): void {
  const existing = debounceTimers.get(eventName);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    eventName,
    setTimeout(() => {
      debounceTimers.delete(eventName);
      track(eventName, props);
    }, delayMs),
  );
}
