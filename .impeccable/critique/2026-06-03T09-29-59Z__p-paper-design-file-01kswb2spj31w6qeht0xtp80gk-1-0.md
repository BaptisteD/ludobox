---
target: current Paper file (Ludobox, Tabletop pop)
total_score: 27
p0_count: 0
p1_count: 3
timestamp: 2026-06-03T09-29-59Z
slug: p-paper-design-file-01kswb2spj31w6qeht0xtp80gk-1-0
---
# Critique — Ludobox Paper file ("Tabletop pop"), Page 1

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No save-in-progress, no validation feedback, no recompute confirmation designed |
| 2 | Match System / Real World | 3 | Strong metaphors (record, crown, dice), but tu/vous voice split |
| 3 | User Control and Freedom | 3 | Annuler / discard / delete all confirm; solid |
| 4 | Consistency and Standards | 3 | Visual system airtight; voice + an orphan Fraunces font break it |
| 5 | Error Prevention | 2 | Destructive flows confirm, but no form validation (save with no winner / no score?) |
| 6 | Recognition Rather Than Recall | 3 | Autocomplete, labels, helpers; crown toggle leans on a text hint |
| 7 | Flexibility and Efficiency | 2 | Fine for solo mobile; no accelerators, but largely n/a |
| 8 | Aesthetic and Minimalist Design | 4 | Card-less, restrained, genuine point of view |
| 9 | Error Recovery | 2 | No error states designed; destructive recovery is good |
| 10 | Help and Documentation | 3 | Inline helpers + teaching empty states |
| **Total** | | **27/40** | **Acceptable (upper end) — visually excellent, state coverage incomplete** |

The aesthetic score (4) is doing a lot of work; the total is pulled down by undesigned system-status / validation / error categories. For a Paper exploration that's expected, but it's the honest gap.

## Anti-Patterns Verdict

**Does this look AI-generated? No.** This is the rare case that passes the slop test cleanly. The "Tabletop pop" signature — ink outlines, hard zero-blur offset shadows, four game-piece colors used by meaning, one earned tilt on the record card — is a committed point of view, not assembled-from-a-library. No gradient text, no glassmorphism, no eyebrow-on-every-section, no hero-metric template, no identical card grid. Color is coded (coral/teal game type, gold record, numbered rank badges) and never decorative.

**Deterministic scan: N/A.** The target is a Paper canvas (URL), not markup — `detect.mjs` scans HTML/JSX files and there is no injectable page, so the CLI scanner and browser overlay don't apply. Assessment B was conducted via Paper's native rendering across 12 artboards (the equivalent evidence channel). No user-visible overlay exists for this run.

## Overall Impression

This is confident, on-brief work. The read screens (Fiche jeu, Fiche joueur) nail the "logbook, not a profile card" intent — history lives directly on cream, the record/win-count get earned emphasis, stats are intimate rather than a business report. The biggest opportunity is not visual; it's that the **single most-used action ("Ajouter une partie") scrolls away** on the read screens, which quietly violates the product's own "logging is sacred, reachable by thumb at all times" principle.

## What's Working

1. **The emotional peaks land.** The tilted gold record card and the card-less two-up counters (parties jouées · victoires with the gold crown) give the human moments real weight without gamification noise. This is exactly the "celebrate, don't decorate" brief, executed.
2. **Accessibility-by-construction on semantics.** Win/loss is always icon + label + color (Victoire/Défaite, Succès/Échec), rank is always a number inside the badge, game type is always tag + color. Nothing relies on color alone — the hard a11y constraint is met at the structural level.
3. **The form is calm and correctly hierarchised.** Inputs carry the flat 2px outline; the offset shadow is reserved for the one CTA and the celebrated pieces. Score lanes and the crown toggle hold their vertical lanes across rows. Autocomplete with the "Créer « Sam »" create-on-the-fly row on raised cream is a genuinely good pattern.

## Priority Issues

### [P1] The primary CTA scrolls off the read screens
On Fiche jeu Compétitif, "Ajouter une partie" sits directly under the hero, above the record card. As the ranking and "Dernières parties" history grow (this game has 14 plays), the add button scrolls out of view — and on a real collection many games will have long histories. The product brief makes this the sacred, always-thumb-reachable affordance; a button that disappears under the fold contradicts that.
- **Why it matters**: Logging is the core loop and the post-game-night moment is impatient/one-handed (persona Casey). Hunting back up the page for the add button is friction on the exact action that must have none.
- **Fix**: Pin the add affordance to the bottom thumb zone — a sticky bottom bar or a FAB that stays present while history scrolls. Keep the full-width inline CTA on the empty state where there's nothing to scroll past.
- **Suggested command**: `/impeccable adapt`

### [P1] tu / vous voice is inconsistent across the corpus
The read screens address the user formally — empty state: "**Consignez votre** première soirée." The form and sheets switch to informal — helper: "**Touche** le trophée…", discard sheet: "**Tes** changements… ne seront pas enregistrés." Same person, same session, two registers.
- **Why it matters**: This is a one-person, intimate journal. The split reads as two writers and undercuts the "well-kept logbook" voice. Match-real-world and consistency heuristics both.
- **Fix**: Commit to one. For a warm, solo, personal-use journal, informal **tu** is the more on-brand intimacy ("Consigne ta première soirée"). Sweep all strings.
- **Suggested command**: `/impeccable clarify`

### [P1] Muted-on-cream contrast needs verification at AA
Several text roles ride the edge against the `#FDF3E3` ground: `ink/muted` (#7A6A56) meta lines ("Léa 118 · Tom 96 · note"), the `gold/on-gold` subline on the record/success card ("sur 9 parties"), the italic "Score non renseigné", and especially the `ink/faint` (#C7B493) chevrons and 9px month labels. DESIGN.md itself flags these as the riskiest. The brief demands AA legibility "in low evening light" — the exact condition where these fail first.
- **Why it matters**: This is a stated hard constraint (WCAG 2.1 AA), and the meta lines carry real content (opponents, scores), not just decoration. `#C7B493` on cream is well under 4.5:1.
- **Fix**: Measure each pair. Bump `ink/muted` toward ink for body-carrying meta; reserve `ink/faint` for non-text-bearing chrome only (and even there confirm the chevron reads). The 9px month label is below the readable floor regardless of contrast — consider 10–11px.
- **Suggested command**: `/impeccable audit`

### [P2] No system-status, validation, or error states are designed
The form saves data, but there's no save-in-progress state, no validation, and no error path. What happens on "Enregistrer" with no winner toggled in a competitive game? With a non-integer score? With zero players? The crown helper teaches the control but nothing prevents or recovers from an incomplete entry.
- **Why it matters**: Error prevention and status visibility are real product surfaces, not edge polish. The "stats are computed at read time, must stay honest" principle depends on clean input.
- **Fix**: Design the missing states: a disabled/enabled Save based on minimum validity, an inline hint when a competitive game has no winner, and a brief saved confirmation (the "one small restrained acknowledgement" the brief already allows for a logged win).
- **Suggested command**: `/impeccable harden`

### [P2] An undocumented Fraunces font is loaded in the document
`get_basic_info` reports four families — System Sans, Hanken Grotesk, Baloo 2, and **Fraunces** — but DESIGN.md commits to a strict two-family system (Baloo 2 + Hanken). Fraunces (a serif) doesn't appear in any Page 1 screen I captured.
- **Why it matters**: Either it's an orphan from an earlier exploration (font bloat, a tell waiting to happen) or a third family slipped in undocumented, which would break the typographic discipline that's otherwise airtight.
- **Fix**: Find where Fraunces is used (likely an old node or the design-system poster). Remove it if orphaned; document and justify it if intentional.
- **Suggested command**: `/impeccable audit`

## Persona Red Flags

**Casey (Distracted Mobile User)**: The add-a-play button isn't in the thumb zone on the read screens once you scroll — it's mid-page and scrolls away. For the one-handed, post-game-night, "log it before I forget" moment this app is built around, that's the headline failure. The form's Save CTA *is* well-placed at the bottom; the read screens should match.

**Jordan (Confused First-Timer)**: The winner crown toggle is taught only by a one-line helper ("Touche le trophée…"). An empty/outlined crown next to a filled gold one is learnable, but a first-timer may not register that the crown is the tappable winner control versus a decorative rank icon. Otherwise discoverability is good — labels everywhere, no icon-only nav.

**Sam (Accessibility-Dependent)**: Semantics are excellent (never color-alone), but the muted/faint text contrast (see P1) and the 9px month label are where Sam struggles in low light. The crown toggle's on/off must also expose state to a screen reader as text, not just fill — confirm in build.

**The Solo Journaler (project persona — winding down after game night, low evening light, wants zero friction)**: Served beautifully on the read side; the history-as-memory framing is spot on. Failed only by the scroll-away CTA and the low-light contrast risk — both directly on this persona's defining context.

## Minor Observations

- Empty-state Compétitif (VL-0) leaves a large blank gap below the CTA — switch the artboard to fit-content or rebalance the vertical centering so the dice/headline/CTA group sits more intentionally.
- The "Joueurs 3" / "Joueurs 2" count in the form section header is very faint top-right; easy to miss as live feedback when adding/removing players.
- "Annuler" as a low-contrast plain text button under the loud CTA is correct hierarchy, but verify it still clears the 44px touch target and AA contrast.
- Date field uses a real chevron/affordance (good) — make sure tapping it opens a native-feeling date control, not a free-text trap.

## Questions to Consider

- If logging is sacred, should the add action ever be more than a tap away — i.e. does it belong as a persistent bottom bar across every read screen, the way the Save CTA anchors the form?
- The brief warns about the line between "confident toy-box" and "childish." The dice motif + tilts + bright pieces are charming now — at what point of repetition (every empty state, every sheet) does it start to read as decoration rather than earned personality?
- Stats are "read, never stored." Is there a moment — right after a save — where the user sees a number *change* (a new record, a win-count tick) that would make the celebration land harder than a static screen?
