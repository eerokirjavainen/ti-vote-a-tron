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

function vote(session: Session, outcome: string, votes: number, bonus = 0): Session {
  return castBallot(openBallot(session), outcome, votes, bonus);
}

describe("session", () => {
  it("validates vote totals at start", () => {
    expect(() => startSession(["Alice", "Bob"], [3, -1])).toThrow("at least 0");
    expect(() => startSession(["Alice", "Bob"], [3])).toThrow("Every player");
  });

  it("hands the device to each player in turn, then to the speaker", () => {
    let session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "for-against", riders: [] });
    expect(currentVoter(session)).toBe("Alice");
    session = vote(session, "For", 3);
    expect(currentVoter(session)).toBe("Bob");
    session = vote(session, "Against", 0);
    expect(session.phase).toEqual({ name: "speaker" });
    expect(session.ballots).toEqual([
      { player: "Alice", outcome: "For", votes: 3, bonus: 0 },
      { player: "Bob", outcome: "Against", votes: 0, bonus: 0 },
    ]);
  });

  it("carries the remaining budget into the second agenda and discards ballots", () => {
    let session = setAgenda(startSession(["Alice", "Bob"], [10, 4]), { title: "", type: "for-against", riders: [] });
    session = vote(vote(session, "For", 8), "For", 4);
    session = finishAgenda(revealResults(session));
    expect(session.agendaNumber).toBe(2);
    expect(session.ballots).toEqual([]);
    expect(session.remaining).toEqual({ Alice: 2, Bob: 0 });

    session = setAgenda(session, { title: "", type: "player", riders: [] });
    expect(() => vote(session, "Bob", 3)).toThrow("remaining vote budget");
  });

  it("ends after the last agenda", () => {
    let session = startSession(["Alice", "Bob"], [1, 1]);
    for (let agenda = 0; agenda < 2; agenda++) {
      session = setAgenda(session, { title: "", type: "for-against", riders: [] });
      session = vote(vote(session, "For", 0), "For", 0);
      session = finishAgenda(revealResults(session));
    }
    expect(session.phase).toEqual({ name: "done" });
  });

  it("normalizes planet ballots and rejects blank planets", () => {
    const session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "planet", riders: [] });
    expect(() => vote(session, " ?! ", 1)).toThrow("planet name");
    expect(vote(session, "Mecatol Rex", 1).ballots[0].outcome).toBe("mecatolrex");
  });

  it("rejects outcomes outside the agenda's options", () => {
    const session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "player", riders: [] });
    expect(() => vote(session, "Mallory", 1)).toThrow("Unknown outcome");
  });

  it("rejects transitions from the wrong phase", () => {
    const session = startSession(["Alice", "Bob"], [5, 5]);
    expect(() => castBallot(session, "For", 1)).toThrow("Expected phase ballot");
  });
});

describe("bonus votes", () => {
  it("records bonus votes without spending the budget", () => {
    let session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "for-against", riders: [] });
    session = vote(session, "For", 2, 3);
    expect(session.remaining.Alice).toBe(3);
    expect(session.ballots[0]).toEqual({ player: "Alice", outcome: "For", votes: 2, bonus: 3 });
  });

  it("rejects invalid bonus votes", () => {
    const session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), { title: "", type: "for-against", riders: [] });
    expect(() => vote(session, "For", 1, -1)).toThrow("Bonus votes cannot be negative");
    expect(() => vote(session, "For", 1, 0.5)).toThrow("Bonus votes must be a whole number");
  });
});

describe("riders", () => {
  const players = ["Alice", "Bob", "Cara"];

  it("skips rider players and keeps their budget", () => {
    let session = setAgenda(startSession(players, [5, 5, 5]), {
      title: "",
      type: "for-against",
      riders: [{ player: "Alice", prediction: "For" }],
    });
    expect(currentVoter(session)).toBe("Bob");
    session = vote(session, "For", 2);
    expect(currentVoter(session)).toBe("Cara");
    session = vote(session, "Against", 1);
    expect(session.phase).toEqual({ name: "speaker" });
    expect(session.ballots.map((ballot) => ballot.player)).toEqual(["Bob", "Cara"]);
    expect(session.remaining.Alice).toBe(5);
  });

  it("skips a rider player in the middle and at the end of the order", () => {
    let session = setAgenda(startSession(players, [5, 5, 5]), {
      title: "",
      type: "for-against",
      riders: [
        { player: "Bob", prediction: "For" },
        { player: "Cara", prediction: "Against" },
      ],
    });
    session = vote(session, "For", 1);
    expect(session.phase).toEqual({ name: "speaker" });
  });

  it("goes straight to the speaker when every player declares a rider", () => {
    const session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), {
      title: "",
      type: "for-against",
      riders: [
        { player: "Alice", prediction: "For" },
        { player: "Bob", prediction: "Against" },
      ],
    });
    expect(session.phase).toEqual({ name: "speaker" });
  });

  it("lets a player vote on the next agenda after a rider", () => {
    let session = setAgenda(startSession(["Alice", "Bob"], [5, 5]), {
      title: "",
      type: "for-against",
      riders: [{ player: "Alice", prediction: "For" }],
    });
    session = finishAgenda(revealResults(vote(session, "For", 1)));
    session = setAgenda(session, { title: "", type: "for-against", riders: [] });
    expect(currentVoter(session)).toBe("Alice");
    expect(session.agenda?.riders).toEqual([]);
  });

  it("normalizes planet predictions", () => {
    const session = setAgenda(startSession(players, [5, 5, 5]), {
      title: "",
      type: "planet",
      riders: [{ player: "Alice", prediction: " Mecatol Rex " }],
    });
    expect(session.agenda?.riders).toEqual([{ player: "Alice", prediction: "mecatolrex" }]);
  });

  it("validates riders", () => {
    const session = startSession(players, [5, 5, 5]);
    const agenda = (riders: { player: string; prediction: string }[]) =>
      setAgenda(session, { title: "", type: "player", riders });
    expect(() => agenda([{ player: "Mallory", prediction: "Bob" }])).toThrow("Unknown player");
    expect(() => agenda([{ player: "Alice", prediction: "Mallory" }])).toThrow("Unknown outcome");
    expect(() =>
      agenda([
        { player: "Alice", prediction: "Bob" },
        { player: "Alice", prediction: "Cara" },
      ]),
    ).toThrow("one rider per agenda");
  });
});
