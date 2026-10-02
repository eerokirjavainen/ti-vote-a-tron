export interface Ballot {
  player: string;
  outcome: string;
  votes: number;
}

/** Return totals in the same order as the given outcomes. */
export function tally(outcomes: string[], ballots: Ballot[]): Map<string, number> {
  const totals = new Map(outcomes.map((outcome) => [outcome, 0]));
  for (const ballot of ballots) {
    const current = totals.get(ballot.outcome);
    if (current === undefined) {
      throw new Error(`Unknown outcome: ${ballot.outcome}`);
    }
    assertVoteCount(ballot.votes);
    totals.set(ballot.outcome, current + ballot.votes);
  }
  return totals;
}

/** Deduct a ballot from a player's agenda-phase vote budget. */
export function spendVotes(remaining: number, votes: number): number {
  assertVoteCount(votes);
  if (votes > remaining) {
    throw new Error("Votes exceed the player's remaining vote budget");
  }
  return remaining - votes;
}

function assertVoteCount(votes: number): void {
  if (!Number.isInteger(votes)) {
    throw new Error("Votes must be a whole number");
  }
  if (votes < 0) {
    throw new Error("Votes cannot be negative");
  }
}
