import { useState } from "react";
import { AGENDA_COUNT } from "../core/agenda";
import { type Session, currentVoter, finishAgenda, openBallot, revealResults } from "../core/session";
import { AgendaSetupScreen } from "./AgendaSetupScreen";
import { BallotScreen } from "./BallotScreen";
import { Cosmos } from "./Cosmos";
import { ResultsScreen } from "./ResultsScreen";
import { SetupScreen } from "./SetupScreen";

export function App() {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <main className="app">
      <Cosmos />
      <header className={session ? "app-header compact" : "app-header"}>
        <h1 className="title">
          <span className="title-game">Twilight Imperium</span>
          <span className="title-name">Vote-a-tron</span>
        </h1>
        {!session && <p className="tagline">Secret ballots for the Galactic Council, passed around one device.</p>}
        {session && session.phase.name !== "done" && (
          <span className="agenda-counter">
            Agenda {session.agendaNumber} of {AGENDA_COUNT}
          </span>
        )}
      </header>
      {renderScreen(session, setSession)}
    </main>
  );
}

function renderScreen(session: Session | null, setSession: (session: Session | null) => void) {
  if (!session) {
    return <SetupScreen onStart={setSession} />;
  }

  switch (session.phase.name) {
    case "agenda-setup":
      return <AgendaSetupScreen session={session} onReady={setSession} />;
    case "handoff":
      return (
        <section className="card handoff">
          {session.phase.voter > 0 && <p className="muted">Ballot recorded.</p>}
          <h2>
            Pass the device to <span className="voter-name">{currentVoter(session)}</span>
          </h2>
          <p>Do not discuss the agenda while voting.</p>
          <button className="primary" onClick={() => setSession(openBallot(session))}>
            I am {currentVoter(session)} — show my ballot
          </button>
        </section>
      );
    case "ballot":
      return <BallotScreen key={session.phase.voter} session={session} onCast={setSession} />;
    case "speaker":
      return (
        <section className="card handoff">
          <p className="muted">All ballots are recorded.</p>
          <h2>Pass the device to the speaker</h2>
          <button className="primary" onClick={() => setSession(revealResults(session))}>
            Reveal totals
          </button>
        </section>
      );
    case "results":
      return <ResultsScreen session={session} onContinue={() => setSession(finishAgenda(session))} />;
    case "done":
      return (
        <section className="card handoff">
          <h2>Agenda phase complete</h2>
          <p>Ballots were not saved.</p>
          <button className="primary" onClick={() => setSession(null)}>
            Start a new agenda phase
          </button>
        </section>
      );
  }
}
