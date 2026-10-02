import type { Ballot } from "./tally";

export const AGENDA_COUNT = 2;

export type AgendaType = "for-against" | "player" | "planet";

export const AGENDA_TYPE_LABELS: Record<AgendaType, string> = {
  "for-against": "For/Against",
  player: "Pick a player",
  planet: "Pick a planet",
};

export interface Agenda {
  title: string;
  type: AgendaType;
}

/**
 * Return the fixed outcomes for an agenda, or null for planet agendas whose
 * outcomes are only known once ballots are cast.
 */
export function fixedOutcomes(type: AgendaType, players: string[]): string[] | null {
  switch (type) {
    case "for-against":
      return ["For", "Against"];
    case "player":
      return [...players];
    case "planet":
      return null;
  }
}

/**
 * Canonicalize a planet name so capitalization, spacing, and punctuation do
 * not create separate outcomes. Returns "" if nothing usable remains.
 */
export function normalizePlanet(entered: string): string {
  return entered.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Return unique outcomes in the order they were first selected. */
export function planetOutcomes(ballots: Ballot[]): string[] {
  return [...new Set(ballots.map((ballot) => ballot.outcome))];
}

/** Outcomes to tally for an agenda once all ballots are in. */
export function agendaOutcomes(agenda: Agenda, players: string[], ballots: Ballot[]): string[] {
  return fixedOutcomes(agenda.type, players) ?? planetOutcomes(ballots);
}
