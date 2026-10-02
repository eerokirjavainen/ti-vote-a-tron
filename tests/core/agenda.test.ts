import { describe, expect, it } from "vitest";
import {
  agendaResult,
  fixedOutcomes,
  needsSpeakerDecision,
  normalizePlanet,
  planetOutcomes,
  riderResult,
} from "../../src/core/agenda";
import { tally } from "../../src/core/tally";

describe("fixedOutcomes", () => {
  it("offers For and Against", () => {
    expect(fixedOutcomes("for-against", ["Alice", "Bob"])).toEqual(["For", "Against"]);
  });

  it("offers configured players for player agendas", () => {
    expect(fixedOutcomes("player", ["Alice", "Bob"])).toEqual(["Alice", "Bob"]);
  });

  it("has no fixed outcomes for planet agendas", () => {
    expect(fixedOutcomes("planet", ["Alice", "Bob"])).toBeNull();
  });
});

describe("planets", () => {
  it("normalizes planet names for comparison", () => {
    expect(normalizePlanet("  Mecatol Rex!  ")).toBe("mecatolrex");
  });

  it("ignores non-alphanumeric characters", () => {
    expect(normalizePlanet("Archon-Vail")).toBe(normalizePlanet(" archon vail "));
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(normalizePlanet(" -!- ")).toBe("");
  });

  it("lets identical planet selections share an outcome", () => {
    const ballots = [
      { player: "Alice", outcome: "mecatolrex", votes: 4, bonus: 0 },
      { player: "Bob", outcome: "mecatolrex", votes: 3, bonus: 0 },
      { player: "Cara", outcome: "primor", votes: 2, bonus: 0 },
    ];
    const outcomes = planetOutcomes(ballots);
    expect(outcomes).toEqual(["mecatolrex", "primor"]);
    expect(tally(outcomes, ballots)).toEqual(new Map([["mecatolrex", 7], ["primor", 2]]));
  });
});

describe("agendaResult", () => {
  const tied = new Map([["Alice", 4], ["Bob", 4], ["Cara", 1]]);

  it("picks the single leading outcome", () => {
    expect(agendaResult(new Map([["For", 5], ["Against", 3]]))).toEqual({ leaders: ["For"], winner: "For" });
  });

  it("ignores a speaker choice when there is no tie", () => {
    expect(agendaResult(new Map([["For", 5], ["Against", 3]]), "Against").winner).toBe("For");
  });

  it("waits for the speaker on a tie", () => {
    const result = agendaResult(tied);
    expect(result).toEqual({ leaders: ["Alice", "Bob"], winner: null });
    expect(needsSpeakerDecision(result)).toBe(true);
  });

  it("uses the speaker's choice among tied outcomes", () => {
    const result = agendaResult(tied, "Bob");
    expect(result.winner).toBe("Bob");
    expect(needsSpeakerDecision(result)).toBe(false);
  });

  it("ignores a speaker choice outside the tie", () => {
    expect(agendaResult(tied, "Cara").winner).toBeNull();
  });

  it("treats zero votes for every outcome as a tie", () => {
    expect(agendaResult(new Map([["For", 0], ["Against", 0]])).leaders).toEqual(["For", "Against"]);
  });

  it("has no winner and no decision when there are no outcomes", () => {
    const result = agendaResult(new Map());
    expect(result).toEqual({ leaders: [], winner: null });
    expect(needsSpeakerDecision(result)).toBe(false);
  });
});

describe("riderResult", () => {
  const tied = new Map([["Alice", 4], ["Bob", 4], ["Cara", 1]]);

  it("succeeds when the prediction wins", () => {
    expect(riderResult("For", agendaResult(new Map([["For", 5], ["Against", 3]])))).toBe("success");
  });

  it("fails when another outcome wins", () => {
    expect(riderResult("Against", agendaResult(new Map([["For", 5], ["Against", 3]])))).toBe("failure");
  });

  it("is pending until the speaker breaks a tie", () => {
    expect(riderResult("Bob", agendaResult(tied))).toBe("pending");
  });

  it("follows the speaker's tie-break", () => {
    expect(riderResult("Bob", agendaResult(tied, "Bob"))).toBe("success");
    expect(riderResult("Alice", agendaResult(tied, "Bob"))).toBe("failure");
  });

  it("fails when no outcome received votes", () => {
    expect(riderResult("mecatolrex", agendaResult(new Map()))).toBe("failure");
  });
});
