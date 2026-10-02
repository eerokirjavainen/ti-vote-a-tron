import { describe, expect, it } from "vitest";
import { leadingOutcomes, spendVotes, tally } from "../../src/core/tally";

describe("tally", () => {
  it("totals votes for each outcome", () => {
    const ballots = [
      { player: "Alice", outcome: "For", votes: 7, bonus: 0 },
      { player: "Bob", outcome: "Against", votes: 4, bonus: 0 },
      { player: "Cara", outcome: "For", votes: 2, bonus: 0 },
    ];
    expect(tally(["For", "Against"], ballots)).toEqual(new Map([["For", 9], ["Against", 4]]));
  });

  it("preserves zero-vote outcomes in configured order", () => {
    expect([...tally(["Player B", "Player A"], [])]).toEqual([["Player B", 0], ["Player A", 0]]);
  });

  it("rejects unknown outcomes", () => {
    expect(() => tally(["For", "Against"], [{ player: "Alice", outcome: "Maybe", votes: 1, bonus: 0 }])).toThrow(
      "Unknown outcome",
    );
  });

  it("rejects negative votes", () => {
    expect(() => tally(["For", "Against"], [{ player: "Alice", outcome: "For", votes: -1, bonus: 0 }])).toThrow(
      "negative",
    );
  });
});

describe("bonus votes", () => {
  it("adds bonus votes to the outcome total", () => {
    const ballots = [
      { player: "Alice", outcome: "For", votes: 3, bonus: 2 },
      { player: "Bob", outcome: "Against", votes: 0, bonus: 1 },
    ];
    expect(tally(["For", "Against"], ballots)).toEqual(new Map([["For", 5], ["Against", 1]]));
  });

  it("rejects negative bonus votes", () => {
    expect(() => tally(["For"], [{ player: "Alice", outcome: "For", votes: 1, bonus: -1 }])).toThrow(
      "Bonus votes cannot be negative",
    );
  });
});

describe("leadingOutcomes", () => {
  it("returns the single winner", () => {
    expect(leadingOutcomes(new Map([["For", 5], ["Against", 3]]))).toEqual(["For"]);
  });

  it("returns every tied outcome", () => {
    expect(leadingOutcomes(new Map([["Alice", 4], ["Bob", 4], ["Cara", 1]]))).toEqual(["Alice", "Bob"]);
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
