import { AGENDA_COUNT, type Agenda, fixedOutcomes, normalizePlanet } from "./agenda";
import { parsePlayerNames } from "./players";
import { type Ballot, spendVotes } from "./tally";

/**
 * Hot-seat flow for one agenda phase. Every transition is a pure function that
 * returns a new state or throws an Error describing invalid input. Ballots
 * live only in memory and are discarded when the next agenda starts.
 */
export type Phase =
  | { name: "agenda-setup" }
  | { name: "handoff"; voter: number }
  | { name: "ballot"; voter: number }
  | { name: "speaker" }
  | { name: "results" }
  | { name: "done" };

export interface Session {
  players: string[];
  remaining: Record<string, number>;
  agendaNumber: number;
  agenda: Agenda | null;
  ballots: Ballot[];
  phase: Phase;
}

export function startSession(players: string[], budgets: number[]): Session {
  const names = parsePlayerNames(players);
  if (budgets.length !== names.length) {
    throw new Error("Every player needs a vote total");
  }
  const remaining: Record<string, number> = {};
  names.forEach((name, index) => {
    const budget = budgets[index];
    if (!Number.isInteger(budget) || budget < 0) {
      throw new Error(`${name}'s vote total must be a whole number of at least 0`);
    }
    remaining[name] = budget;
  });
  return {
    players: names,
    remaining,
    agendaNumber: 1,
    agenda: null,
    ballots: [],
    phase: { name: "agenda-setup" },
  };
}

export function setAgenda(session: Session, agenda: Agenda): Session {
  expectPhase(session, "agenda-setup");
  return {
    ...session,
    agenda: { title: agenda.title.trim(), type: agenda.type },
    ballots: [],
    phase: { name: "handoff", voter: 0 },
  };
}

export function openBallot(session: Session): Session {
  const phase = expectPhase(session, "handoff");
  return { ...session, phase: { name: "ballot", voter: phase.voter } };
}

export function castBallot(session: Session, outcome: string, votes: number): Session {
  const phase = expectPhase(session, "ballot");
  const player = session.players[phase.voter];
  const resolved = resolveOutcome(session, outcome);
  const remaining = spendVotes(session.remaining[player], votes);
  const next = phase.voter + 1;
  return {
    ...session,
    remaining: { ...session.remaining, [player]: remaining },
    ballots: [...session.ballots, { player, outcome: resolved, votes }],
    phase: next < session.players.length ? { name: "handoff", voter: next } : { name: "speaker" },
  };
}

export function revealResults(session: Session): Session {
  expectPhase(session, "speaker");
  return { ...session, phase: { name: "results" } };
}

export function finishAgenda(session: Session): Session {
  expectPhase(session, "results");
  if (session.agendaNumber >= AGENDA_COUNT) {
    return { ...session, ballots: [], phase: { name: "done" } };
  }
  return {
    ...session,
    agendaNumber: session.agendaNumber + 1,
    agenda: null,
    ballots: [],
    phase: { name: "agenda-setup" },
  };
}

export function currentVoter(session: Session): string | null {
  const { phase } = session;
  return phase.name === "handoff" || phase.name === "ballot" ? session.players[phase.voter] : null;
}

function resolveOutcome(session: Session, outcome: string): string {
  if (!session.agenda) {
    throw new Error("No agenda is being voted on");
  }
  const fixed = fixedOutcomes(session.agenda.type, session.players);
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

function expectPhase<N extends Phase["name"]>(session: Session, name: N): Extract<Phase, { name: N }> {
  if (session.phase.name !== name) {
    throw new Error(`Expected phase ${name}, got ${session.phase.name}`);
  }
  return session.phase as Extract<Phase, { name: N }>;
}
