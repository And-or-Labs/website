/**
 * RoutingCat conversions tracked in the browser.
 *
 * `book_call` is the site's objective: a click on any cal.com booking link
 * (top bar, bottom bar, listings). The booking itself completes on cal.com,
 * which never reaches our code, so the click is the closest event we own.
 *
 * One delegated listener on `document`: module scripts run once, and the
 * ClientRouter swaps the body without re-running them, so per-link listeners
 * would miss every page after the first.
 */
import { routingcat } from "routingcat/tracker";
import { BOOKING_URL } from "../data/site";

document.addEventListener(
  "click",
  (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement) || !link.href.startsWith(BOOKING_URL)) return;
    const placement = new URL(link.href).searchParams.get("utm_content") ?? "unknown";
    // Never throws and never blocks the navigation to cal.com.
    void routingcat.track("book_call", { properties: { placement } });
  },
  { capture: true },
);
