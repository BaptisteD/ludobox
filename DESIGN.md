# Design

Visual system for Ludobox, extracted from the **Paper** file (`app.paper.design/file/01KSWB2SPJ31W6QEHT0XTP80GK`), style direction **"Tabletop pop."** Mobile-first, single column, 390px baseline. (Note: the root `Ludobox.pen` Pencil file is currently empty; the live design lives in Paper.)

The Paper file has three pages: **Page 1** (the 16 product screens, see "Screens in the file" below — the 8 read screens plus the 8-screen Fiche partie form flow, which now includes the validity and saved-confirmation states), **Archive** (page 2), and **Système de design** (page 3) — a 1680px poster that visually documents this whole system (colours, type, the signature, spacing, and live specimens of every component cloned from the real screens). That board is the canonical visual reference; this document is its written companion. Keep the two in sync.

The look is playful neo-brutalism in a board-game key: warm cream paper ground, a few saturated "game piece" colors, thick dark outlines, hard offset shadows, and a couple of deliberate tilts. Display type is round and chunky; supporting type is a clean grotesk. Color is coded by meaning (game type, win/loss, rank), never sprinkled for decoration.

> Tension to flag: PRODUCT.md lists "childish gamification" as an anti-reference and asks for "grown-up" warmth. This direction leans harder into playful (bright pieces, tilts, dice motifs) than that wording implies. It reads as confident toy-box craft rather than condescending, but if it ever tips into childish, that's the line to watch. Documented here as-built.

## Theme

Light, always, warm. The ground is `#FDF3E3` cream, like a well-thumbed rulebook under a lamp after game night. No dark mode. Surfaces are distinguished by outline and shadow, not by elevation gradients.

Color strategy: **full palette**, four named game-piece roles (coral, gold, teal, ink) each used for a specific job, anchored by coral as the single primary action color. Never pure black; pure white is reserved for a few crisp surfaces — date chips, the overflow menu, and the rename input.

## Color

Hex as authored in the file.

### Ground & ink
| Token | Hex | Role |
|---|---|---|
| `bg/cream` | `#FDF3E3` | App canvas, the paper ground |
| `bg/cream-raised` | `#FBE7C0` | Highlighted row (rank 1 leaderboard), soft callouts |
| `surface/white` | `#FFFFFF` | Date chips, overflow-menu surface, rename input field |
| `on-dark/cream` | `#FFF6E9` | Text/icons on coral, teal, ink |
| `ink/primary` | `#2A2018` | Titles, body, all outlines and shadows |
| `ink/muted` | `#7A6A56` | Meta, section labels, secondary text |
| `ink/faint` | `#C7B493` | Disclosure chevrons, lowest emphasis |

### Game-piece colors
| Token | Hex | Role |
|---|---|---|
| `coral` | `#E14B6A` | Primary CTA (Add a play), "Compétitif" tag, failure, rank-3 badge, destructive |
| `gold` | `#F4B53C` | Record card surface, rank-1 badge |
| `gold/ink` | `#C98A1E` | Score numbers in history (on cream) |
| `gold/trophy` | `#E1A11F` | Trophy icon in history rows |
| `gold/on-gold` | `#7A4F1A` | Muted text on the gold record card ("pts", subline) |
| `teal` | `#1FA091` | "Coopératif" tag, success, rank-2 badge, win portion of bars |

### Semantic
- **Win** = `teal` chip with check icon + label (`Victoire` in competitive history, `Succès` in cooperative). **Loss** = `coral` chip with cross icon + label (`Défaite` competitive, `Échec` cooperative). Always icon + text, never color alone (PRODUCT.md a11y constraint).
- **Game type** is color-coded: Compétitif = coral, Coopératif = teal. Always paired with the text label.
- **Rank badges** cycle gold (1) / teal (2) / coral (3), each with the rank number inside, so order never relies on color.

## Borders & shadows (the signature)

This is what makes it "pop." Apply consistently or the style breaks.

- **Outline:** solid `ink/primary` (`#2A2018`). Weights: `2px` (chips, badges, date tiles), `2.5px` (CTA, record card), `3px` (dice motif).
- **Hard offset shadow:** `#2A2018`, zero blur, zero spread. CTA and pieces: `4px 5px 0`. Record card: `5px 6px 0`. Shadows are solid color, never soft/gray.
- **Tilt:** sparing, earned. Record card `rotate(-1.4deg)`; empty-state dice `-8deg` / `+7deg`. Rows and text never tilt.
- No glassmorphism, no gradients, no soft drop shadows anywhere.

## Typography

Two families, strict division of labor.

- **Display: Baloo 2** (rounded, friendly, heavy). Game titles, big numbers (record, win counts, dates), button labels, player names, empty-state headline. Weights: Bold (700), ExtraBold (800).
- **Text: Hanken Grotesk** (clean grotesk). Meta lines, tags, section labels, the small "vict." / "pts" units, body copy. Weights: Medium (500), Bold (700), ExtraBold (800).
- **Section labels:** Hanken Grotesk ExtraBold, UPPERCASE, `letter-spacing 0.14em`, 12px, `ink/muted`. (Date chip "MAI/AVR": 9px, tracking 0.08em.)
- Status bar uses system sans.

### Scale (px)
| Use | Family / weight | Size · line-height |
|---|---|---|
| Record / hero number (and success-rate %) | Baloo 2 ExtraBold | 60 · 90%, tracking -0.02em |
| Stat counter (parties · victoires) | Baloo 2 ExtraBold | 44 · 90%, tracking -0.02em |
| Hero play count (Fiche jeu) | Baloo 2 ExtraBold | 28 · 90%, tracking -0.01em |
| Game title | Baloo 2 ExtraBold | 36 · 102%, tracking -0.01em |
| Player name (Fiche joueur header) | Baloo 2 ExtraBold | 34 · 104%, tracking -0.01em |
| Empty-state headline | Baloo 2 ExtraBold | 25 · 110% |
| Date number (chip) | Baloo 2 Bold | 19 · 100% |
| Player name (leaderboard) | Baloo 2 SemiBold | 17 · 1.4 |
| Win count, list name | Baloo 2 Bold/SemiBold | 16–20 |
| Body / meta | Hanken Grotesk Medium | 13–15 |
| Section label | Hanken Grotesk ExtraBold | 12, tracking 0.14em |
| Date month | Hanken Grotesk Bold | 9, tracking 0.08em |

Hierarchy comes from the Baloo/Hanken contrast plus the big scale jumps, not from boxes.

**Numerals.** All figures are **tabular** (`font-variant-numeric: tabular-nums`, set once on each artboard root and inherited) — both faces support it, so counts, scores, dates, and percentages keep a uniform digit advance and never jitter as they cross single→double→triple digits. The large display numerals (record 60px, success-rate %, counters 44px) also carry slight negative tracking (-0.02em; the 28px hero count -0.01em) so the round Baloo digits knit into one unit. In the **Collection** and **Joueurs** list rows, the count sits in a fixed-width right-aligned slot (count frame 72px, numeral slot 26px) so every number shares a right edge and the `parties`/`partie` unit left-aligns down the column — the single vs. double-digit jog is gone.

## Spacing & radius

- Screen horizontal padding: `20px` (px-5). Section gaps: `24–26px`. Within-row gaps: `12–13px`.
- 4-based rhythm.
- **Radius:** date chip `14px`; rename input `14px`; CTA `16px` (rounded-2xl); leaderboard highlight row `16px`; overflow menu `16px`; record card `22px`; dice `18px`; tags / rank badges / status pills / player avatars fully round.

## Layout

- Single column, 390px, thumb-driven. **Fiche jeu** structure top to bottom: **Header** (status bar + back/overflow nav) → **Hero** (title, then a row pairing the type tag + players·duration on the left with the play-count stat right-aligned) → **Content** (CTA, the stat feature, ranking, history). The play count lives in the hero (both types) so the regular player's first question — how many times we've played this — is answered at first glance, and the CTA → record/rate adjacency in Content stays uninterrupted.
- **Fiche joueur** structure: **Header** (back/overflow nav) → **Identity** (avatar + name) → **Counters** (parties jouées · victoires, two-up with a vertical divider) → **History** (one row per play: game name + result chip + score). No CTA and no feature card here — the page reads, it doesn't log.
- Hierarchy through outline, color, and the one feature card, not nested boxes. History and leaderboard rows sit directly on cream, divided by spacing; only the rank-1 row and the stat feature get a surface.
- **No cards-in-cards.**

## Components (as built)

- **CTA "Ajouter une partie":** coral pill-rect, 56px tall, white plus icon + Baloo label, 2.5px ink outline, `4px 5px 0` shadow. The single most important affordance; appears on Fiche jeu variants only (competitive, cooperative, and empty state) — not on the Fiche joueur (which has no add-play CTA per PRD fiche joueur 4.2) nor on the list screens (which have their own creation CTAs). Full-width near the bottom of the fold. ≥44px target.
- **Hero play count:** the Fiche jeu masthead stat (both types), right-aligned opposite the type tag + meta. A small outlined die glyph (rounded square, 2px ink outline, three ink pips) + the count in Baloo 2 ExtraBold 28px `ink/primary`, over a right-aligned Hanken Medium 14px `ink/muted` "parties jouées" caption. Card-less and number-forward, optically centred against the tag/meta pair; reads as an identity stat, never a KPI card. Satisfies the PRD "nombre de parties" for both types (cooperative also restates the total inside the rate card as the success denominator, "sur N parties").
- **Stat feature card:** the one tilted gold (competitive: RECORD + big number + holder avatar — derived from the player's initial, never an uploaded image; no avatar upload in V1) or success-rate (cooperative: % + win/loss bar + succès/échec counts) card. 22px radius, 2.5px outline, `5px 6px 0` shadow, `-1.4deg` tilt. This is the celebrated "human moment."
- **Leaderboard rows:** rank badge (gold/teal/coral, numbered) + optional trophy + name (Baloo) + count + "vict." (Hanken). Rank 1 sits on `bg/cream-raised`; others on bare cream.
- **History rows:** white date tile (number + month) + result (trophy & score for competitive, or Succès/Échec chip for cooperative) + meta line + faint chevron. Divided by space, not borders.
- **Tags:** fully-round, colored by game type, Hanken Bold cream text.
- **Empty state:** tilted dice pair (coral + gold), Baloo headline, Hanken subcopy, then the CTA. Warm and inviting, not blank.
- **Destructive (delete) sheet:** bottom sheet on a dimmed cream scrim, coral circular trash icon (outlined), Baloo title naming the game, Hanken warning copy, coral "Supprimer le jeu" button, plain "Annuler" text button.

### Fiche joueur components

- **Player avatar:** circular, 72px, filled with a game-piece color (coral or teal), the player's initial in `on-dark/cream` Baloo, 2.5px ink outline + `4px 5px 0` shadow. Same outline+shadow signature as the pieces.
- **Player header (Identity):** avatar + name in Baloo 2 ExtraBold 34px. The page's masthead.
- **Stat summary (Counters):** two-up read of *parties jouées* and *victoires* — big Baloo 44px number over a Hanken ExtraBold uppercase label, split by a 2px ink vertical divider. *Victoires* carries a small gold crown and uses `gold/ink` for the number. This is the intimate, card-less stat treatment (distinct from the gold feature card); it is read-only, never boxed.
- **Player history rows:** white date tile + game name (Baloo) + result chip + score, with a faint chevron. Result variants: `Victoire`/`Défaite` (competitive, teal/coral) and `Succès`/`Échec` (cooperative); competitive rows show points in `gold/ink`. **"Score non renseigné"** is an explicit state, rendered in italic `ink/muted` where the score would be — never a blank or an error.
- **Overflow menu:** white rounded popover (16px radius), 2.5px ink outline + `5px 6px 0` shadow, two rows split by a hairline divider — *Renommer* (pencil icon, `ink/primary`) and the destructive *Supprimer le joueur* (trash icon, `coral`). Opens from the header "⋮".
- **Rename field (inline):** avatar + white text input (2.5px ink outline, ink caret) + circular `teal` confirm button with a check, plus a Hanken `ink/muted` helper line ("Le nouveau nom s'affiche partout. L'identité du joueur ne change pas."). Inline edit in place, no modal.

### Fiche partie components

The Fiche partie is the corpus's **first form**, so it introduces the input vocabulary. The governing rule: **inputs carry the 2px ink outline only (flat); the hard offset shadow stays reserved for the primary CTA and the celebrated pieces.** This keeps the form calm and gives the one action that matters its weight. New components, all on the cream ground:

- **Context block (form masthead):** Hanken ExtraBold uppercase overline (`Nouvelle partie` / `Modifier la partie`) → game title in Baloo 2 ExtraBold **27px** (deliberately smaller than the 36px read-screen hero, because here the game is context, not the subject) → immutable game-type tag. Tells you what you're logging without competing with the fields.
- **Section labels:** the same Hanken ExtraBold uppercase 12px / 0.14em `ink/muted` label used everywhere, here heading `Date`, `Joueurs`, `Résultat collectif`, `Note`. `Note` pairs with a plain-case `facultatif` in `ink/faint`.
- **Text field (date / note / add-player):** `surface/white`, 2px `ink/primary` outline, 14px radius, no shadow. Date field = calendar icon + full readable date (Baloo SemiBold 17px) + faint chevron. Note field = multi-line, top-aligned, filled or muted-placeholder.
- **Add-player field:** white field led by a small **coral `+` disc** (a mini echo of the CTA) + `Ajouter un joueur…` placeholder. On focus it switches to a **coral 2px outline** with typed text + a coral caret.
- **Participant row (competitive):** game-piece **avatar (38px, coral/teal/ink only** — gold is held back for the win/record meaning) with 2px ink outline + small `2px 2px 0` shadow, name (Baloo SemiBold 17px), then two fixed right-hand lanes — a **score input** (60×38 white field, 2px ink outline, integer, optional) and a **winner toggle** — plus a quiet `ink/faint` remove `×`. Lanes stay aligned across rows.
- **Winner toggle:** a 40px crown control. **On** = `gold` fill + ink crown + `2px 2px 0` shadow; **off** = transparent + `ink/faint` outlined crown. State reads from fill/shadow/icon weight, never color alone. Ex-aequo = multiple toggles on. A one-line plain-language helper ("Touche le trophée pour désigner le gagnant. Le score est facultatif.") teaches it in place of a column header.
- **Participant row (cooperative):** avatar + name + remove only — no score, no winner.
- **Résultat collectif (segmented):** white track, 2px ink outline, two equal segments. Selected segment fills its semantic color with cream label + icon (`Succès` = teal + check, `Échec` = coral + cross); the other stays transparent with `ink/muted` label + icon. Same win/loss semantics as the history chips. Cooperative screens only.
- **Player autocomplete (dropdown):** white popover, 2px ink outline + `4px 5px 0` shadow, hairline `#F0E2C8` dividers. Matching active players (avatar + name) on top; the **create-on-the-fly** row sits on `bg/cream-raised` with a coral `+` disc, `Créer « <nom> »` (Baloo) + `Nouveau joueur` subline.
- **Save CTA + minimum validity:** the coral CTA component, label swapped to `Enregistrer la partie` (create) / `Enregistrer les modifications` (edit), with a check icon instead of the plus. It carries two states. **Enabled** = the full signature (coral fill, 2.5px ink outline, `4px 5px 0` shadow). **Disabled** = the same shape gone dormant: flat `#EFE1C6` putty fill, **no shadow** (the hard shadow is what reads as "alive/pressable," so dropping it is the disabled signal), 2px `ink/faint` outline, `ink/muted` label + check. Minimum validity that flips it on: **≥1 participant** in both modes, **and additionally ≥1 winner designated** in competitive (ex-aequo counts). Cooperative needs only a participant (the `Résultat collectif` defaults to `Succès`). A disabled Save never appears without the inline hint below explaining what's missing.
- **Inline validity hint (competitive, no winner):** a quiet single line directly above the Save CTA, not a clinical error box — a coral **outlined** crown glyph (echoing the off-state winner toggle, the empty crown waiting to be filled) + `ink/primary` Hanken Medium 14px: `Désigne le gagnant pour enregistrer la partie.` It names the one blocker, so a dormant Save is always self-explaining. (The Joueurs-section teaching helper stays; this is validation, not instruction.)
- **Saved confirmation / win celebration (toast):** the *single* earned acknowledgement a logged win gets — and it doubles as the save confirmation. A small gold toast lands at the bottom of the **Fiche jeu** the save returns you to (not over the form): gold `#F4B53C` fill, 2.5px ink outline, `5px 6px 0` shadow, the record family's `-1.4°` tilt. Left: the winner's game-piece avatar with a small cream **crown badge**. Right: Baloo ExtraBold 19px `ink` headline celebrating the strongest available moment (`Nouveau record, Camille` when the play sets a record, else `Camille l'emporte`), over a Hanken 13px `gold/on-gold` line with an ink check — `Partie enregistrée · 142 pts` — the "saved" half of the doubling. Restrained, never confetti. Degrades to an instant appearance under `prefers-reduced-motion`.
- **Confirm sheets (delete / discard):** same bottom-sheet shell as the delete-game sheet (dimmed warm scrim, grabber, 64px coral icon disc, Baloo title, Hanken copy, coral action button, quiet text cancel). **Delete** = trash icon + `Supprimer la partie`. **Discard unsaved edits** = undo-arrow icon + `Abandonner` / `Continuer la saisie`.

## Motion

- Calm, ease-out only. No bounce, no elastic. Don't animate layout properties.
- A logged win earns one small, restrained acknowledgement, nothing more.
- All celebratory/transitional motion degrades to instant state change under `prefers-reduced-motion`.

## Screens in the file (Page 1, all 390px wide)

**Fiche jeu (game detail):**

1. **Compétitif** (`OT-0`, 390×945) — the Fiche jeu heart: record card + win ranking + history.
2. **Coopératif** (`SA-0`, 390×850) — Fiche jeu for co-op games: success-rate card + succès/échec history.
3. **État vide** (`VL-0`, 390×850) — game with no plays yet: dice motif + empty copy + CTA.
4. **Suppression** (`WX-0`, 390×844) — delete-game confirmation bottom sheet.

**Fiche joueur (player detail):**

5. **Fiche joueur** (`2I6-0`, 390×850) — player masthead (avatar + name) + stat summary + cross-game history.
6. **Menu overflow** (`2Z6-0`, 390×850) — the "⋮" popover: Renommer / Supprimer le joueur.
7. **Renommage** (`2UY-0`, 390×850) — inline rename field with teal confirm + helper.
8. **État vide** (`2M0-0`, 390×850) — player with no plays yet: stat summary at 0 + dice motif + empty copy.

**Fiche partie (the session form, always editable, one screen):**

9. **Compétitif** (`46P-0`, 390×fit) — the form in use: context block, date, participant rows with score input + winner toggle, filled note, `Enregistrer la partie`.
10. **Coopératif** (`49J-0`, 390×fit) — no per-row scoring; `Résultat collectif` segmented (Succès/Échec) instead.
11. **Édition** (`4CM-0`, 390×fit) — pre-filled, header `⋮` for delete access, overline `Modifier la partie`, `Enregistrer les modifications`.
12. **Suppression** (`4FK-0`, 390×850) — delete-partie confirmation sheet (trash icon).
13. **Ajout joueur** (`4IU-0`, 390×fit) — add-field focused, autocomplete open with active matches + create-on-the-fly row.
14. **Abandon** (`4M7-0`, 390×850) — discard-unsaved-changes sheet (undo-arrow icon).
15. **Gagnant manquant** (`5RD-0`, 390×fit) — the competitive form in its invalid state: all winner crowns off, the inline validity hint above a **disabled** Save. Demonstrates both minimum-validity and the no-winner hint.
16. **Enregistré (célébration)** (`5U8-0`, 390×945) — the moment after `Enregistrer`: lands back on the Fiche jeu Compétitif with the gold saved-confirmation toast celebrating Camille's new 142 record.

A seventeenth surface, the **Système de design** poster, lives on its own page (page 3) and documents the whole system. It carries a **section 08 · Composants · Fiche partie**: the Compétitif screen shown in context plus live specimens cloned from the real screens — date/saisie field, participant row, winner toggle (on/off), Résultat collectif segmented, autocomplete with create-on-the-fly, the delete/discard confirmation discs, and (Row 4, added during hardening) the **Enregistrer · état** pair (active vs. dormant Save with its no-winner indice) and the **Confirmation enregistrée** toast.

## Accessibility

- WCAG 2.1 AA. Touch targets ≥44px (hard constraint).
- Never color alone for win/loss, game type, or rank: always paired with icon, number, or label (already true in the file).
- Verify contrast for cream-on-color (`#FFF6E9` on coral/teal) and muted ink (`#7A6A56`, `#C7B493`) against cream; the faint chevron and 9px month label are the riskiest, check both at AA.
- Respect `prefers-reduced-motion`.
- Archived players stay present by name in history/stats (the "archivé" tag); render readable, never as an error state.
