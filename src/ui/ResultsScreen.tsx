import { useState } from "react";
import { AGENDA_COUNT, agendaOutcomes } from "../core/agenda";
import type { Session } from "../core/session";
import { type Ballot, leadingOutcomes, tally } from "../core/tally";

function describeBallot(ballot: Ballot): string {
  const votes = ballot.bonus ? `${ballot.votes} + ${ballot.bonus} bonus` : `${ballot.votes}`;
  return `${ballot.player} (${votes})`;
}

export function ResultsScreen({ session, onContinue }: { session: Session; onContinue: () => void }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const agenda = session.agenda!;
  const outcomes = agendaOutcomes(agenda, session.players, session.ballots);
  const totals = tally(outcomes, session.ballots);
  const leaders = outcomes.length ? leadingOutcomes(totals) : [];
  const lastAgenda = session.agendaNumber >= AGENDA_COUNT;

  function riderStatus(prediction: string): string {
    if (!leaders.includes(prediction)) {
      return "not leading";
    }
    return leaders.length === 1 ? "leading" : "tied — speaker decides";
  }

  return (
    <section className="card">
      <h2>Final totals</h2>
      {agenda.title && <p className="agenda-title">{agenda.title}</p>}
      {outcomes.length ? (
        <ul className="totals">
          {[...totals].map(([outcome, votes]) => (
            <li key={outcome}>
              <span>{outcome}</span>
              <strong>{votes}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No ballots were cast.</p>
      )}

      {agenda.riders.length > 0 && (
        <>
          <h3>Riders</h3>
          <ul className="breakdown">
            {agenda.riders.map((rider) => (
              <li key={rider.player}>
                <span>
                  {rider.player} → {rider.prediction}
                </span>
                <span className="muted">{riderStatus(rider.prediction)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {outcomes.length > 0 &&
        (showBreakdown ? (
          <>
            <h3>Ballot breakdown</h3>
            <ul className="breakdown">
              {outcomes.map((outcome) => {
                const voters = session.ballots.filter((ballot) => ballot.outcome === outcome);
                return (
                  <li key={outcome}>
                    <span>{outcome}</span>
                    <span>{voters.length ? voters.map(describeBallot).join(", ") : "none"}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <button onClick={() => setShowBreakdown(true)}>Reveal who voted for each outcome</button>
        ))}

      <button className="primary" onClick={onContinue}>
        {lastAgenda ? "Finish agenda phase" : "Set up the second agenda"}
      </button>
    </section>
  );
}
