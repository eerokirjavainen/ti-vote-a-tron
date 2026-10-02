import { type CSSProperties, useState } from "react";
import {
  AGENDA_COUNT,
  type RiderResult,
  agendaOutcomes,
  agendaResult,
  needsSpeakerDecision,
  riderResult,
} from "../core/agenda";
import type { Session } from "../core/session";
import { type Ballot, tally } from "../core/tally";

const RIDER_RESULT_LABELS: Record<RiderResult, string> = {
  success: "Success",
  failure: "Failure",
  pending: "Awaiting speaker",
};

function describeBallot(ballot: Ballot): string {
  const votes = ballot.bonus ? `${ballot.votes} + ${ballot.bonus} bonus` : `${ballot.votes}`;
  return `${ballot.player} (${votes})`;
}

export function ResultsScreen({ session, onContinue }: { session: Session; onContinue: () => void }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [speakerChoice, setSpeakerChoice] = useState<string | null>(null);
  const agenda = session.agenda!;
  const outcomes = agendaOutcomes(agenda, session.players, session.ballots);
  const totals = tally(outcomes, session.ballots);
  const result = agendaResult(totals, speakerChoice);
  const tied = result.leaders.length > 1;
  const lastAgenda = session.agendaNumber >= AGENDA_COUNT;
  const mostVotes = Math.max(0, ...totals.values());

  return (
    <section className="card">
      <h2>Final totals</h2>
      {agenda.title && <p className="agenda-title">{agenda.title}</p>}
      {outcomes.length ? (
        <ul className="totals">
          {[...totals].map(([outcome, votes]) => (
            <li
              key={outcome}
              className={votes > 0 && votes === mostVotes ? "leading" : undefined}
              style={{ "--share": mostVotes ? votes / mostVotes : 0 } as CSSProperties}
            >
              <span>{outcome}</span>
              <strong>{votes}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No ballots were cast.</p>
      )}

      {tied && (
        <fieldset className="tie-break">
          <legend>Tie — the speaker decides the outcome</legend>
          {result.leaders.map((outcome) => (
            <label className="choice" key={outcome}>
              <input
                type="radio"
                name="tie-break"
                checked={speakerChoice === outcome}
                onChange={() => setSpeakerChoice(outcome)}
              />
              {outcome}
            </label>
          ))}
        </fieldset>
      )}

      {result.winner !== null && (
        <p className="winner">
          Outcome: <strong>{result.winner}</strong>
          {tied && <span className="muted"> (speaker's decision)</span>}
        </p>
      )}

      {agenda.riders.length > 0 && (
        <>
          <h3>Riders</h3>
          <ul className="breakdown">
            {agenda.riders.map((rider) => {
              const status = riderResult(rider.prediction, result);
              return (
                <li key={rider.player}>
                  <span>
                    {rider.player} → {rider.prediction}
                  </span>
                  <span className={`rider-result ${status}`}>{RIDER_RESULT_LABELS[status]}</span>
                </li>
              );
            })}
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

      {needsSpeakerDecision(result) && <p className="muted">Choose the outcome of the tie to continue.</p>}
      <button className="primary" disabled={needsSpeakerDecision(result)} onClick={onContinue}>
        {lastAgenda ? "Finish agenda phase" : "Set up the second agenda"}
      </button>
    </section>
  );
}
