import { type AgendaType, fixedOutcomes } from "../core/agenda";

interface Props {
  label: string;
  type: AgendaType;
  players: string[];
  value: string;
  onChange: (value: string) => void;
}

/** A dropdown for fixed outcomes, or a free-text planet field. */
export function OutcomeInput({ label, type, players, value, onChange }: Props) {
  const outcomes = fixedOutcomes(type, players);

  if (!outcomes) {
    return (
      <label>
        {label}
        <input
          placeholder="Planet name"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
      </label>
    );
  }

  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
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
  );
}
