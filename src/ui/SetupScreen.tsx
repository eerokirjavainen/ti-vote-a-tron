import { type FormEvent, useState } from "react";
import { type Session, startSession } from "../core/session";
import { loadPlayerNames, savePlayerNames } from "./storage";

interface Row {
  name: string;
  budget: string;
}

function initialRows(): Row[] {
  const names = loadPlayerNames();
  const padded = names.length >= 2 ? names : ["", ""];
  return padded.map((name) => ({ name, budget: "" }));
}

export function SetupScreen({ onStart }: { onStart: (session: Session) => void }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, change: Partial<Row>) {
    setRows(rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const budgets = rows.map((row) => (row.budget.trim() === "" ? NaN : Number(row.budget)));
      const session = startSession(
        rows.map((row) => row.name),
        budgets,
      );
      savePlayerNames(session.players);
      onStart(session);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Players</h2>
      <p className="muted">
        Enter each player's total voting power for the whole two-agenda phase. Votes spent on the first
        agenda are deducted from the second.
      </p>
      <div className="player-rows">
        {rows.map((row, index) => (
          <div className="player-row" key={index}>
            <input
              aria-label={`Player ${index + 1} name`}
              placeholder={`Player ${index + 1}`}
              value={row.name}
              onChange={(event) => update(index, { name: event.target.value })}
            />
            <input
              aria-label={`Player ${index + 1} votes`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="Votes"
              value={row.budget}
              onChange={(event) => update(index, { budget: event.target.value })}
            />
            <button
              type="button"
              className="icon"
              aria-label={`Remove player ${index + 1}`}
              disabled={rows.length <= 2}
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setRows([...rows, { name: "", budget: "" }])}>
        Add player
      </button>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">
        Start agenda phase
      </button>
    </form>
  );
}
