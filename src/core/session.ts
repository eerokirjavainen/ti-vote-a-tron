import { AGENDA_COUNT, type Agenda, resolveOutcome } from "./agenda";
import { parsePlayerNames } from "./players";
import { type Ballot, assertVoteCount, spendVotes } from "./tally";

/**
 * Hot-seat flow for one agenda phase. Players who declared a rider for the
 * current agenda are skipped when handing the device around. Every transition is a pure
 * function that returns a new state or throws an Error describing invalid input. Ballots
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
  const riders = agenda.riders.map((rider) => ({
    player: rider.player,
    prediction: resolveOutcome(agenda.type, session.players, rider.prediction),
  }));
  const riderPlayers = new Set<string>();
  for (const { player } of riders) {
    if (!session.players.includes(player)) {
      throw new Error(`Unknown player: ${player}`);
    }
    if (riderPlayers.has(player)) {
      throw new Error(`${player} can only declare one rider per agenda`);
    }
    riderPlayers.add(player);
  }
  const started: Session = {
    ...session,
    agenda: { title: agenda.title.trim(), type: agenda.type, riders },
    ballots: [],
  };
  return { ...started, phase: nextVoterPhase(started, 0) };
}

export function openBallot(session: Session): Session {
  const phase = expectPhase(session, "handoff");
  return { ...session, phase: { name: "ballot", voter: phase.voter } };
}

export function castBallot(session: Session, outcome: string, votes: number, bonus = 0): Session {
  const phase = expectPhase(session, "ballot");
  const agenda = requireAgenda(session);
  const player = session.players[phase.voter];
  const resolved = resolveOutcome(agenda.type, session.players, outcome);
  const remaining = spendVotes(session.remaining[player], votes);
  assertVoteCount(bonus, "Bonus votes");
  const cast: Session = {
    ...session,
    remaining: { ...session.remaining, [player]: remaining },
    ballots: [...session.ballots, { player, outcome: resolved, votes, bonus }],
  };
  return { ...cast, phase: nextVoterPhase(cast, phase.voter + 1) };
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

/** Hand the device to the next player at or after `from` who has no rider. */
function nextVoterPhase(session: Session, from: number): Phase {
  const riders = new Set(requireAgenda(session).riders.map((rider) => rider.player));
  for (let voter = from; voter < session.players.length; voter++) {
    if (!riders.has(session.players[voter])) {
      return { name: "handoff", voter };
    }
  }
  return { name: "speaker" };
}

function requireAgenda(session: Session): Agenda {
  if (!session.agenda) {
    throw new Error("No agenda is being voted on");
  }
  return session.agenda;
}

function expectPhase<N extends Phase["name"]>(session: Session, name: N): Extract<Phase, { name: N }> {
  if (session.phase.name !== name) {
    throw new Error(`Expected phase ${name}, got ${session.phase.name}`);
  }
  return session.phase as Extract<Phase, { name: N }>;
}
