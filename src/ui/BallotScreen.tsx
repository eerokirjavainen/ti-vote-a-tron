import { type FormEvent, useState } from "react";
import { fixedOutcomes } from "../core/agenda";
import { type Session, castBallot, currentVoter } from "../core/session";

export function BallotScreen({ session, onCast }: { session: Session; onCast: (session: Session) => void }) {
  const player = currentVoter(session)!;
  const available = session.remaining[player];
  const outcomes = fixedOutcomes(session.agenda!.type, session.players);
  const [outcome, setOutcome] = useState("");
  const [votes, setVotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (!outcome) {
        throw new Error("Choose an outcome");
      }
      const count = votes.trim() === "" ? NaN : Number(votes);
      if (!Number.isInteger(count) || count < 0 || count > available) {
        throw new Error(`Enter a whole number of votes from 0 to ${available}`);
      }
      onCast(castBallot(session, outcome, count));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    // autoComplete is off so the browser never suggests earlier players' entries.
    <form className="card" onSubmit={submit} autoComplete="off">
      <h2>Secret ballot for {player}</h2>
      {session.agenda!.title && <p className="agenda-title">Voting on: {session.agenda!.title}</p>}
      <p className="muted">{available} votes remaining for this agenda phase</p>

      {outcomes ? (
        <label>
          Outcome
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)}>
            <option value="" disabled>
              Choose…
            </option>
            {outcomes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label>
          Planet
          <input value={outcome} onChange={(event) => setOutcome(event.target.value)} autoComplete="off" />
        </label>
      )}

      <label>
        Votes (0–{available})
        <input
          type="number"
          min={0}
          max={available}
          step={1}
          inputMode="numeric"
          value={votes}
          onChange={(event) => setVotes(event.target.value)}
        />
      </label>

      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">
        Cast secret ballot
      </button>
    </form>
  );
}
