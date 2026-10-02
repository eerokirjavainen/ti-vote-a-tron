import { describe, expect, it } from "vitest";
import { fixedOutcomes, normalizePlanet, planetOutcomes } from "../../src/core/agenda";
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
      { player: "Alice", outcome: "mecatolrex", votes: 4 },
      { player: "Bob", outcome: "mecatolrex", votes: 3 },
      { player: "Cara", outcome: "primor", votes: 2 },
    ];
    const outcomes = planetOutcomes(ballots);
    expect(outcomes).toEqual(["mecatolrex", "primor"]);
    expect(tally(outcomes, ballots)).toEqual(new Map([["mecatolrex", 7], ["primor", 2]]));
  });
});
