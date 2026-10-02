import { useState } from "react";
import { AGENDA_COUNT, agendaOutcomes } from "../core/agenda";
import type { Session } from "../core/session";
import { tally } from "../core/tally";

export function ResultsScreen({ session, onContinue }: { session: Session; onContinue: () => void }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const outcomes = agendaOutcomes(session.agenda!, session.players, session.ballots);
  const totals = tally(outcomes, session.ballots);
  const lastAgenda = session.agendaNumber >= AGENDA_COUNT;

  return (
    <section className="card">
      <h2>Final totals</h2>
      {session.agenda!.title && <p className="agenda-title">{session.agenda!.title}</p>}
      <ul className="totals">
        {[...totals].map(([outcome, votes]) => (
          <li key={outcome}>
            <span>{outcome}</span>
            <strong>{votes}</strong>
          </li>
        ))}
      </ul>

      {showBreakdown ? (
        <>
          <h3>Ballot breakdown</h3>
          <ul className="breakdown">
            {outcomes.map((outcome) => {
              const voters = session.ballots.filter((ballot) => ballot.outcome === outcome);
              return (
                <li key={outcome}>
                  <span>{outcome}</span>
                  <span>{voters.length ? voters.map((b) => `${b.player} (${b.votes})`).join(", ") : "none"}</span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <button onClick={() => setShowBreakdown(true)}>Reveal who voted for each outcome</button>
      )}

      <button className="primary" onClick={onContinue}>
        {lastAgenda ? "Finish agenda phase" : "Set up the second agenda"}
      </button>
    </section>
  );
}
