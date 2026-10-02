import { describe, expect, it } from "vitest";
import { parsePlayerNames } from "../../src/core/players";

describe("parsePlayerNames", () => {
  it("trims player names", () => {
    expect(parsePlayerNames([" Alice ", "Bob"])).toEqual(["Alice", "Bob"]);
  });

  it("rejects duplicate names case-insensitively", () => {
    expect(() => parsePlayerNames(["Alice", "alice"])).toThrow("unique");
  });

  it("rejects fewer than two players", () => {
    expect(() => parsePlayerNames(["Alice"])).toThrow("At least two");
  });

  it("rejects blank names", () => {
    expect(() => parsePlayerNames(["Alice", "  "])).toThrow("non-empty");
  });
});
