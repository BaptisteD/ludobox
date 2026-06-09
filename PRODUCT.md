# Product

## Register

product

## Users

A single person: the owner of a personal board-game collection, using the app on their phone, for their own use. No account, no multi-user, data local to the device. The defining context is the moment *just after a game night ends*: someone winding down at home, often indoors in low evening light, wanting to log who played and who won before the memory fades, or pulling up a game to settle "wait, what's the record on this?" The job is twofold: capture a game session with zero friction, and read back the memory and stats of a given game at a glance.

## Product Purpose

Ludobox is a personal journal of board-game sessions, not a catalogue. A game is a *container for plays*, not a database entry. V1 ships offline, on-device, accountless, and answers the regular player's natural questions per game: how many times we've played it, who wins most, what the record is, the chronological history of nights played. Success is personal-use stickiness: the app gets opened every game night because logging isn't a chore, and the stats make you want to come back. The Fiche jeu (game detail screen) is the heart of the product, where logging and reading both happen.

## Brand Personality

Warm and playful, but grown-up. Three words: convivial, tactile, unfussy. The voice is friendly and human, the voice of a well-kept logbook of nights with friends, not a productivity tool and not a toy. Color is used with intent to celebrate the human moments (a win, a record, a long streak of plays) rather than to decorate. Wins should feel a little bit special; logging should feel effortless. Personality lives in small, earned touches, never in noise.

## Anti-references

- **Corporate SaaS dashboard.** No KPI-card grids, no gradient hero-metric blocks, no chart-heavy analytics density. Stats here are intimate, not a business report.
- **Dense BGG / catalogue UI.** No BoardGameGeek-style information overload, tiny type, or cramped tables. This is a journal, not a spreadsheet.
- **Generic Material / Bootstrap default.** No stock framework component look. If it reads as "default theme, AI made this," it has failed.
- **Childish gamification.** No cartoon mascots, confetti, or badge-spam. Grown-up warmth, even though the subject is games.

## Design Principles

- **The game is a container for memories.** Composition should foreground the lived history (plays, winners, the record) over metadata. The page is a logbook, not a profile card.
- **Logging is sacred; protect the no-friction path.** The "add a play" action is the single most-used affordance and must be unmistakable and reachable by thumb at all times.
- **Celebrate the human moment.** The record and its holder, the winner of a night, the count of plays: give these earned emphasis. Stats are emotional here, not clinical.
- **Calm density.** Show the full history without crowding. Generous rhythm, restrained surfaces, hierarchy through type and space rather than borders and boxes.
- **Stats are read, never stored.** Every number is computed at read time for integrity across edits and deletes. The UI must stay honest and instantly recomputed after any change.

## Accessibility & Inclusion

- Target WCAG 2.1 AA. Mobile-first with touch targets of at least 44px (already a hard product constraint).
- Body and stat text must stay legible in low evening light; maintain AA contrast against the warm-tinted light surfaces, and never rely on color alone to convey win/loss or success/failure (pair with text or shape).
- Respect `prefers-reduced-motion`: celebratory or transitional motion must degrade to instant, non-animated state changes.
- Archived players remain present in history and stats by name (no link); their representation must stay readable and never look like an error state.
