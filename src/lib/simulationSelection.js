// Hands the Players page's selection to the Simulate bets page — either
// { ids: [...] } or { all: true, filters }, plus how many players that is.
// Kept in sessionStorage so a refresh on the simulate page doesn't lose it.
const KEY = "naipol:simulation-selection";

export function setSimulationSelection(selection, count) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ selection, count }));
  } catch {
    // storage unavailable — the simulate page will ask to reselect
  }
}

export function getSimulationSelection() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}
