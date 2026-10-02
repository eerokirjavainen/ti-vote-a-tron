import { type FormEvent, useState } from "react";
import { AGENDA_TYPE_LABELS, type AgendaType } from "../core/agenda";
import { type Session, setAgenda } from "../core/session";
import { OutcomeInput } from "./OutcomeInput";

export function AgendaSetupScreen({ session, onReady }: { session: Session; onReady: (session: Session) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AgendaType>("for-against");
  // Players who declared a rider, mapped to their predicted outcome.
  const [riders, setRiders] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function changeType(next: AgendaType) {
    setType(next);
    // Predictions from another outcome type no longer apply.
    setRiders(Object.fromEntries(Object.keys(riders).map((player) => [player, ""])));
  }

  function toggleRider(player: string, declared: boolean) {
    const next = { ...riders };
    if (declared) {
      next[player] = "";
    } else {
      delete next[player];
    }
    setRiders(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const declared = session.players
        .filter((player) => player in riders)
        .map((player) => {
          if (!riders[player].trim()) {
            throw new Error(`Choose ${player}'s rider prediction`);
          }
          return { player, prediction: riders[player] };
        });
      onReady(setAgenda(session, { title, type, riders: declared }));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <form className="card" onSubmit={submit} autoComplete="off">
      <h2>Set up agenda {session.agendaNumber}</h2>
      <label>
        Agenda name (optional)
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <fieldset>
        <legend>Outcome type</legend>
        {(Object.keys(AGENDA_TYPE_LABELS) as AgendaType[]).map((option) => (
          <label className="choice" key={option}>
            <input type="radio" name="agenda-type" checked={type === option} onChange={() => changeType(option)} />
            {AGENDA_TYPE_LABELS[option]}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Riders</legend>
        <p className="muted">Mark players who publicly declared a rider. They skip voting on this agenda.</p>
        {session.players.map((player) => (
          <div className="rider" key={player}>
            <label className="choice">
              <input
                type="checkbox"
                checked={player in riders}
                onChange={(event) => toggleRider(player, event.target.checked)}
              />
              {player}
            </label>
            {player in riders && (
              <OutcomeInput
                label="Prediction"
                type={type}
                players={session.players}
                value={riders[player]}
                onChange={(prediction) => setRiders({ ...riders, [player]: prediction })}
              />
            )}
          </div>
        ))}
      </fieldset>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">
        Start voting
      </button>
    </form>
  );
}
