// Only player names are remembered between sessions. Ballots are never stored.
const PLAYERS_KEY = "ti-vote-a-tron.players";

export function loadPlayerNames(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(PLAYERS_KEY) ?? "null");
    if (Array.isArray(stored) && stored.every((name) => typeof name === "string")) {
      return stored;
    }
  } catch {
    // Storage may be unavailable or corrupt; fall back to defaults.
  }
  return [];
}

export function savePlayerNames(names: string[]): void {
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(names));
  } catch {
    // Remembering names is a convenience only.
  }
}
