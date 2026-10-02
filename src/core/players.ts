/** Validate and trim configured player names. */
export function parsePlayerNames(players: unknown): string[] {
  if (!Array.isArray(players) || players.length < 2) {
    throw new Error("At least two players are required");
  }

  const names: string[] = [];
  const usedNames = new Set<string>();
  for (const player of players) {
    if (typeof player !== "string" || !player.trim()) {
      throw new Error("Player names must be non-empty");
    }
    const name = player.trim();
    const key = name.toLocaleLowerCase();
    if (usedNames.has(key)) {
      throw new Error("Player names must be unique");
    }
    usedNames.add(key);
    names.push(name);
  }
  return names;
}
