const RECONNECT_DELAY_MS = 2000;

// The ASGI app's WebSocket routes live at the host root, not under /api —
// same split as the public frontend's config.js. VITE_APP_API_URL is either
// an absolute URL (dev: http://127.0.0.1:8000/api) or a same-origin relative
// path (prod behind a reverse proxy: "/api"), so both need handling here.
function resolveWsBaseUrl() {
  const apiUrl = import.meta.env.VITE_APP_API_URL || "";
  if (/^https?:\/\//.test(apiUrl)) {
    const url = new URL(apiUrl);
    return `${url.protocol === "https:" ? "wss" : "ws"}://${url.host}`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
  }
  return "";
}

const WS_BASE_URL = resolveWsBaseUrl();

function subscribe(path, onUpdate) {
  let socket = null;
  let reconnectTimer = null;
  let closedByCaller = false;

  function connect() {
    socket = new WebSocket(`${WS_BASE_URL}${path}`);
    socket.onmessage = (event) => {
      onUpdate(event.data ? JSON.parse(event.data) : {});
    };
    socket.onclose = () => {
      if (!closedByCaller) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }

  connect();

  return function unsubscribe() {
    closedByCaller = true;
    clearTimeout(reconnectTimer);
    socket.close();
  };
}

// Private, staff-only feed — fires whenever a bet is placed or a market
// settles, telling the Bets Dashboard to refetch its summary numbers rather
// than pushing the computed totals over the wire (see
// AdminBetsSummaryConsumer on the backend for why: a single source of truth
// for the aggregation, no risk of a pushed number drifting from a fresh GET).
export function subscribeToAdminBetsSummary(onUpdate) {
  return subscribe("/ws/admin/bets-summary/", onUpdate);
}
