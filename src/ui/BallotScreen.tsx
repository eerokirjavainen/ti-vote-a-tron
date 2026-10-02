import { type FormEvent, useState } from "react";
import { type Session, castBallot, currentVoter } from "../core/session";
import { OutcomeInput } from "./OutcomeInput";

function parseCount(value: string, fallback: number): number {
  return value.trim() === "" ? fallback : Number(value);
}

export function BallotScreen({ session, onCast }: { session: Session; onCast: (session: Session) => void }) {
  const player = currentVoter(session)!;
  const available = session.remaining[player];
  const agenda = session.agenda!;
  const [outcome, setOutcome] = useState("");
  const [votes, setVotes] = useState("");
  const [bonus, setBonus] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (!outcome) {
        throw new Error("Choose an outcome");
      }
      const count = parseCount(votes, NaN);
      if (!Number.isInteger(count) || count < 0 || count > available) {
        throw new Error(`Enter a whole number of votes from 0 to ${available}`);
      }
      onCast(castBallot(session, outcome, count, parseCount(bonus, 0)));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    // autoComplete is off so the browser never suggests earlier players' entries.
    <form className="card" onSubmit={submit} autoComplete="off">
      <h2>Secret ballot for {player}</h2>
      {agenda.title && <p className="agenda-title">Voting on: {agenda.title}</p>}
      <p className="muted">{available} votes remaining for this agenda phase</p>

      <OutcomeInput label="Outcome" type={agenda.type} players={session.players} value={outcome} onChange={setOutcome} />

      <div className="vote-counts">
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
        <label>
          Bonus votes (+x)
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="0"
            value={bonus}
            onChange={(event) => setBonus(event.target.value)}
          />
        </label>
      </div>
      <p className="muted">Bonus votes are added to the outcome without using your remaining votes.</p>

      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">
        Cast secret ballot
      </button>
    </form>
  );
}
