import { type FormEvent, useState } from "react";
import { AGENDA_TYPE_LABELS, type AgendaType } from "../core/agenda";
import { type Session, setAgenda } from "../core/session";

export function AgendaSetupScreen({ session, onReady }: { session: Session; onReady: (session: Session) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AgendaType>("for-against");

  function submit(event: FormEvent) {
    event.preventDefault();
    onReady(setAgenda(session, { title, type }));
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Set up agenda {session.agendaNumber}</h2>
      <label>
        Agenda name (optional)
        <input value={title} onChange={(event) => setTitle(event.target.value)} autoComplete="off" />
      </label>
      <fieldset>
        <legend>Outcome type</legend>
        {(Object.keys(AGENDA_TYPE_LABELS) as AgendaType[]).map((option) => (
          <label className="choice" key={option}>
            <input type="radio" name="agenda-type" checked={type === option} onChange={() => setType(option)} />
            {AGENDA_TYPE_LABELS[option]}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="primary">
        Start voting
      </button>
    </form>
  );
}
