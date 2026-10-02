import { type Ballot, leadingOutcomes } from "./tally";

export const AGENDA_COUNT = 2;

export type AgendaType = "for-against" | "player" | "planet";

export const AGENDA_TYPE_LABELS: Record<AgendaType, string> = {
  "for-against": "For/Against",
  player: "Pick a player",
  planet: "Pick a planet",
};

/**
 * A rider is declared publicly before voting. The player predicts an outcome
 * and does not vote on this agenda, spending 0 votes.
 */
export interface Rider {
  player: string;
  prediction: string;
}

export interface Agenda {
  title: string;
  type: AgendaType;
  riders: Rider[];
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

/**
 * Validate an outcome chosen for an agenda and return it in canonical form.
 * Planet names are normalized; fixed outcomes must match exactly.
 */
export function resolveOutcome(type: AgendaType, players: string[], outcome: string): string {
  const fixed = fixedOutcomes(type, players);
  if (fixed === null) {
    const planet = normalizePlanet(outcome);
    if (!planet) {
      throw new Error("Enter a planet name containing at least one letter or number");
    }
    return planet;
  }
  if (!fixed.includes(outcome)) {
    throw new Error(`Unknown outcome: ${outcome}`);
  }
  return outcome;
}

/** Return unique outcomes in the order they were first selected. */
export function planetOutcomes(ballots: Ballot[]): string[] {
  return [...new Set(ballots.map((ballot) => ballot.outcome))];
}

/** Outcomes to tally for an agenda once all ballots are in. */
export function agendaOutcomes(agenda: Agenda, players: string[], ballots: Ballot[]): string[] {
  return fixedOutcomes(agenda.type, players) ?? planetOutcomes(ballots);
}

export type RiderResult = "success" | "failure" | "tie";

/**
 * Compare a rider's prediction with the vote totals. A tie for the lead that
 * includes the prediction is left to the speaker to break.
 */
export function riderResult(prediction: string, totals: Map<string, number>): RiderResult {
  const leaders = totals.size ? leadingOutcomes(totals) : [];
  if (!leaders.includes(prediction)) {
    return "failure";
  }
  return leaders.length === 1 ? "success" : "tie";
}
