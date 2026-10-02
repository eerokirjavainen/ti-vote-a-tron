import { describe, expect, it } from "vitest";
import { fixedOutcomes, normalizePlanet, planetOutcomes, riderResult } from "../../src/core/agenda";
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

describe("riderResult", () => {
  it("succeeds when the prediction is the single leading outcome", () => {
    expect(riderResult("For", new Map([["For", 5], ["Against", 3]]))).toBe("success");
  });

  it("fails when another outcome leads", () => {
    expect(riderResult("Against", new Map([["For", 5], ["Against", 3]]))).toBe("failure");
  });

  it("leaves a tie including the prediction to the speaker", () => {
    expect(riderResult("Bob", new Map([["Alice", 4], ["Bob", 4], ["Cara", 1]]))).toBe("tie");
  });

  it("fails when the prediction is outside a tie", () => {
    expect(riderResult("Cara", new Map([["Alice", 4], ["Bob", 4], ["Cara", 1]]))).toBe("failure");
  });

  it("fails when no outcome received votes", () => {
    expect(riderResult("mecatolrex", new Map())).toBe("failure");
  });
});
