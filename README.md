# TI Vote-a-tron

A local browser app for Twilight Imperium's hidden agenda voting variant. One
device is passed around the table: each player casts a secret ballot, then the
speaker reveals only the totals. Everything stays in browser memory; ballots are
never saved. Player names are remembered in the browser for convenience.

Requires Node.js 20 or newer.

```sh
npm install
npm run dev        # open the printed local URL
```

At the start of every agenda phase, enter each player's total voting power for
both agendas. Votes spent on the first agenda are deducted from the amount
available on the second; for example, spending 8 of 10 leaves 2. For every
agenda, choose whether its outcome is For/Against, a player, or a planet. Planet
names are converted to lowercase and stripped of non-alphanumeric characters for
tallying, so differences in capitalization, spacing, or punctuation do not create
separate outcomes.

When setting up each agenda, the speaker marks any players who publicly declared
a rider and records each rider's predicted outcome. Rider players skip voting on
that agenda and spend 0 votes; they can vote normally on the next agenda.

Hand the device to each remaining player when prompted. On their ballot, a
player chooses an outcome and their votes. In the rare case a player has bonus
votes, they tick "Add bonus votes" to enter them. Bonus votes are added to the
outcome's total but do not use the player's remaining votes. After everyone
votes, return it to the speaker to reveal totals. If outcomes tie for the most
votes, the speaker chooses the winning outcome among them before continuing. The
results then show whether each rider succeeded. Use the optional ballot
breakdown only when resolving an outcome requires it.

Other commands:

```sh
npm test           # run the test suite
npm run typecheck  # type-check without building
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Planned features are listed in `FEATURES.md`.
