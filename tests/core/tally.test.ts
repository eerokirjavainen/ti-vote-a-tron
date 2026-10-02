import { describe, expect, it } from "vitest";
import { spendVotes, tally } from "../../src/core/tally";

describe("tally", () => {
  it("totals votes for each outcome", () => {
    const ballots = [
      { player: "Alice", outcome: "For", votes: 7 },
      { player: "Bob", outcome: "Against", votes: 4 },
      { player: "Cara", outcome: "For", votes: 2 },
    ];
    expect(tally(["For", "Against"], ballots)).toEqual(new Map([["For", 9], ["Against", 4]]));
  });

  it("preserves zero-vote outcomes in configured order", () => {
    expect([...tally(["Player B", "Player A"], [])]).toEqual([["Player B", 0], ["Player A", 0]]);
  });

  it("rejects unknown outcomes", () => {
    expect(() => tally(["For", "Against"], [{ player: "Alice", outcome: "Maybe", votes: 1 }])).toThrow(
      "Unknown outcome",
    );
  });

  it("rejects negative votes", () => {
    expect(() => tally(["For", "Against"], [{ player: "Alice", outcome: "For", votes: -1 }])).toThrow(
      "negative",
    );
  });
});

describe("spendVotes", () => {
  it("spends votes across agendas", () => {
    const remaining = spendVotes(10, 8);
    expect(remaining).toBe(2);
    expect(spendVotes(remaining, 2)).toBe(0);
  });

  it("cannot spend more than remains", () => {
    expect(() => spendVotes(2, 3)).toThrow("remaining vote budget");
  });

  it("rejects fractional votes", () => {
    expect(() => spendVotes(5, 1.5)).toThrow("whole number");
  });
});
