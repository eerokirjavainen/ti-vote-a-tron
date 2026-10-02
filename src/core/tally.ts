export interface Ballot {
  player: string;
  outcome: string;
  votes: number;
  /** Extra votes added to the outcome without spending the player's budget. */
  bonus: number;
}

/** Return totals, including bonus votes, in the same order as the given outcomes. */
export function tally(outcomes: string[], ballots: Ballot[]): Map<string, number> {
  const totals = new Map(outcomes.map((outcome) => [outcome, 0]));
  for (const ballot of ballots) {
    const current = totals.get(ballot.outcome);
    if (current === undefined) {
      throw new Error(`Unknown outcome: ${ballot.outcome}`);
    }
    assertVoteCount(ballot.votes, "Votes");
    assertVoteCount(ballot.bonus, "Bonus votes");
    totals.set(ballot.outcome, current + ballot.votes + ballot.bonus);
  }
  return totals;
}

/** Return the outcomes sharing the highest total; more than one means a tie. */
export function leadingOutcomes(totals: Map<string, number>): string[] {
  const highest = Math.max(...totals.values());
  return [...totals].filter(([, votes]) => votes === highest).map(([outcome]) => outcome);
}

/** Deduct a ballot from a player's agenda-phase vote budget. */
export function spendVotes(remaining: number, votes: number): number {
  assertVoteCount(votes, "Votes");
  if (votes > remaining) {
    throw new Error("Votes exceed the player's remaining vote budget");
  }
  return remaining - votes;
}

export function assertVoteCount(votes: number, label: string): void {
  if (!Number.isInteger(votes)) {
    throw new Error(`${label} must be a whole number`);
  }
  if (votes < 0) {
    throw new Error(`${label} cannot be negative`);
  }
}
