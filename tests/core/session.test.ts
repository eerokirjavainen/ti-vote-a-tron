import { describe, expect, it } from "vitest";
import {
  castBallot,
  currentVoter,
  finishAgenda,
  openBallot,
  revealResults,
  type Session,
  setAgenda,
  startSession,
} from "../../src/core/session";

function vote(session: Session, outcome: string, votes: number): Session {
  return castBallot(openBallot(session), outcome, votes);
}

describe("session", () => {
  it("validates vote totals at start", () => {
    expect(() => startSession(["Alice", "Bob"], [3, -1])).toThrow("at least 0");
    expect(() => startSession(["Alice", "Bob"], [3])).toThrow("Every player");
  });

  it("hands the device to each player in turn, then to the speaker", () => {
    let session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "for-against" });
    expect(currentVoter(session)).toBe("Alice");
    session = vote(session, "For", 3);
    expect(currentVoter(session)).toBe("Bob");
    session = vote(session, "Against", 0);
    expect(session.phase).toEqual({ name: "speaker" });
    expect(session.ballots).toEqual([
      { player: "Alice", outcome: "For", votes: 3 },
      { player: "Bob", outcome: "Against", votes: 0 },
    ]);
  });

  it("carries the remaining budget into the second agenda and discards ballots", () => {
    let session = setAgenda(startSession(["Alice", "Bob"], [10, 4]), { title: "", type: "for-against" });
    session = vote(vote(session, "For", 8), "For", 4);
    session = finishAgenda(revealResults(session));
    expect(session.agendaNumber).toBe(2);
    expect(session.ballots).toEqual([]);
    expect(session.remaining).toEqual({ Alice: 2, Bob: 0 });

    session = setAgenda(session, { title: "", type: "player" });
    expect(() => vote(session, "Bob", 3)).toThrow("remaining vote budget");
  });

  it("ends after the last agenda", () => {
    let session = startSession(["Alice", "Bob"], [1, 1]);
    for (let agenda = 0; agenda < 2; agenda++) {
      session = setAgenda(session, { title: "", type: "for-against" });
      session = vote(vote(session, "For", 0), "For", 0);
      session = finishAgenda(revealResults(session));
    }
    expect(session.phase).toEqual({ name: "done" });
  });

  it("normalizes planet ballots and rejects blank planets", () => {
    const session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "planet" });
    expect(() => vote(session, " ?! ", 1)).toThrow("planet name");
    expect(vote(session, "Mecatol Rex", 1).ballots[0].outcome).toBe("mecatolrex");
  });

  it("rejects outcomes outside the agenda's options", () => {
    const session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "player" });
    expect(() => vote(session, "Mallory", 1)).toThrow("Unknown outcome");
  });

  it("rejects transitions from the wrong phase", () => {
    const session = startSession(["Alice", "Bob"], [5, 5]);
    expect(() => castBallot(session, "For", 1)).toThrow("Expected phase ballot");
  });
});
