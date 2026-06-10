# Brique 7 — Fiche partie (design)

> Implementation design for the play-entry/edit form. The **functional + visual
> spec is already fixed** in `dev-briefs/brique-7-fiche-partie.md`,
> `prd-fiche-partie-v1.md`, and `DESIGN.md` (§Fiche partie components). This
> document only records the **architecture** and the decisions taken during
> brainstorming. Date: 2026-06-10.

## Goal

The session form — create, edit, and delete a play (competitive and
cooperative) — with autocomplete + on-the-fly player creation, blocking
validation, the unsaved-changes guard, the delete/abandon sheets, and the
record-celebration toast on return. It is the real destination of the Fiche jeu
"Ajouter une partie" CTA and the target of the (currently inert) history rows on
both the Fiche jeu and the Fiche joueur. New code lives in
`src/features/play-form/`.

## Decisions taken (brainstorming)

1. **Toast = record-broken only.** The gold celebration toast fires *if and only
   if* a save makes the game's maximum entered score strictly exceed its previous
   maximum **and the save returns to the Fiche jeu** (`origin: 'game'` — i.e. a
   create from the CTA, or an edit reached from the game's own history; a
   correction that beats the record still celebrates). Headline is always
   `Nouveau record, <holder>`; subline `Partie enregistrée · N pts`. An edit
   reached from a *player's* history (`origin: 'player'`) returns to the Fiche
   joueur and never shows the toast — the celebration belongs to the Fiche jeu.
   - **Divergence from DESIGN.md (deliberate):** DESIGN.md describes a fallback
     headline `<nom> l'emporte` for a non-record win. That variant is **dropped
     in V1** — a plain competitive win that beats no record returns quietly.
   - Cooperative saves and non-record competitive saves return with no toast; the
     recomputed history/stats on the Fiche jeu are the confirmation.
2. **Exit guard reaches both the in-app Back and the hardware/browser back.** Both
   are funneled through one chokepoint (the navigation `popstate` handler), so a
   single guard covers both gestures.

These resolve the only genuinely open points; everything else follows the PRD.

## Layered architecture

### Domain (`src/domain/`, pure — Brique 1)

- **Reuse `validatePlay` unchanged.** It already enforces §8.1–8.3: ≥1
  participant, ≥1 winner for competitive, and no per-player score/winner on
  cooperative. The form projects its draft into a `PlayDraft` and calls it; no new
  validation rule is needed.
- **Add one pure selector to `stats.ts`:**
  ```ts
  export interface RecordCelebration { holderName: string; score: number; }
  export function recordCelebration(
    savedParticipants: { name: string; score: number | null }[],
    priorRecordScore: number | null,
  ): RecordCelebration | null;
  ```
  Let `thisMax` be the greatest non-null score among `savedParticipants`. Return
  `null` when `thisMax` is null or `thisMax <= priorRecordScore`; otherwise the
  participant holding `thisMax` (first by name on a tie) and that score. Because
  `priorRecordScore` already accounts for every *other* play of the game, a beaten
  record is always held by someone inside the just-saved play — so the holder is
  always resolvable. This is the "record battu ?" judgment the brief delegates to
  the domain.

### Persistence (`src/db/` — repos stay the write authority)

The on-the-fly player must persist **only inside the play's atomic write** (PRD
§8.6.3); player creation therefore happens in the *same* transaction as the play
and its participations. A draft participant is a discriminated union:

```ts
export type DraftParticipant =
  | { kind: 'existing'; playerId: string; score?: number | null; isWinner?: boolean }
  | { kind: 'new';      name: string;     score?: number | null; isWinner?: boolean };
```

- **Extend `playRepository.create`** to accept `DraftParticipant[]`. Inside its
  existing `rw` transaction (`plays` + `participations`, now also `players`): for
  each `new`, validate + check uniqueness among active players
  (`validatePlayerDraft` + `checkPlayerNameAvailable`, also against names created
  earlier in the same batch), create the player, resolve to its id; then validate
  the play (`validatePlay`) and write play + participations. Abandon ⇒ nothing
  written ⇒ no orphan player.
- **Add `playRepository.update(id, input)`** — atomic: load the play (404 →
  throw), validate, update the play row, **replace** its participations
  (delete-by-playId + bulk-add), creating any on-the-fly players in the same
  transaction. Replace-all is the simplest correct approach; no external row
  references a participation id. The immutable `createdAt` is preserved; `gameId`
  and the game's type never change (§4.2).

### Navigation + exit guard (`src/app/navigation/`)

The in-app Back already calls `pop()` → `history.back()` → `popstate`, the same
event the hardware/Android back fires. Guarding at that single `popstate`
boundary covers both gestures uniformly.

- **New back-guard registration** on the navigation API:
  `registerBackGuard({ shouldBlock, onBlocked }): () => void` (returns an
  unregister fn). In the provider's `popstate` handler, if a guard is registered
  and `shouldBlock()` is true, re-`pushState` to cancel the back and call
  `onBlocked()` instead of dispatching `POP`. The pure `navReducer` is **untouched**
  (the guard lives only in `NavigationProvider`, which already owns history).
- **New `Screen` kind** (`types.ts`):
  ```ts
  | { kind: 'play-form'; mode: 'create'; gameId: string; origin: PlayFormOrigin; id; depth }
  | { kind: 'play-form'; mode: 'edit';   playId: string; origin: PlayFormOrigin; id; depth }
  ```
  with `type PlayFormOrigin = 'game' | 'player'`. Edit derives gameId and type
  from the play itself, so player-history rows need no new field.
- **`AppShell`** gains a `play-form` case rendering `<PlayForm … />`.

### Celebration hand-off (`src/app/` — small app-level context)

When the form is pushed, `GameDetail` unmounts (AppShell renders only the
top-of-stack detail) and **remounts + reloads** on pop, so stats are already
fresh. For the toast, a small `PlayCelebrationContext` provided at the app root
exposes `publish(payload)` and `consume(gameId)`:

- `savePlay` publishes `{ gameId, holderName, score }` **only when
  `origin === 'game'`** and `recordCelebration` returned non-null.
- `GameDetail` consumes-and-clears it on mount when the gameId matches, then
  renders the `Toast`. Returning from a game-originated form always remounts that
  same `GameDetail`, so it is consumed immediately (no lingering).
- Edits opened from a player's history (`origin: 'player'`) **never publish** —
  the toast belongs to the Fiche jeu, not the Fiche joueur.

### Feature module (`src/features/play-form/`, flat `X.tsx`+`X.module.css`+`X.test.tsx`)

- **`playDraft.ts`** — pure draft model: state, reducer, `selectValidity(state)`
  (projects participants → `validatePlay`), and `isDirty(initial, current)`. This
  is the **"hook de form/validation extrait, testable sans UI"** DoD item, tested
  directly in Vitest like `navReducer`. Untouched form ⇒ not dirty ⇒ no abandon
  prompt (US9).
- **`usePlayForm.ts`** — thin `useReducer` wrapper over `playDraft`.
- **`playFormData.ts`** — injectable-deps (mirroring `gameData`/`playersData`):
  - `loadPlayForm(screen)` — *create*: game + active players → empty draft (date =
    today). *edit*: play + participations + game + all players → pre-filled draft
    (archived participants kept by name, editable, absent from the active
    autocomplete; §7).
  - `savePlay(draft, ctx)` — reads `priorRecordScore` (current
    `competitiveGameStats(...).record?.score ?? null`) **before** writing, calls
    `create`/`update`, and returns the `recordCelebration` (null for coop).
- **`PlayForm.tsx`** — the container, composing kit components:
  - Context block: overline (`Nouvelle partie` / `Modifier la partie`) + game
    title (Baloo 27px) + immutable type `Tag`.
  - Date: a native `<input type="date">` styled behind the `DateField` visual.
    (`DateField` is display-only and cannot edit; a native input gives the OS
    picker — best mobile UX + a11y, zero custom-picker code.)
  - Participants: `AddPlayerField` + `Autocomplete` over active players **minus
    those already added**; the create-row decision uses `normalizeName` so a name
    matching an active player selects that player instead of offering creation
    (§7, §8.6). Competitive rows = `Avatar` (coral/teal/ink) + name + score input
    (60×38, optional integer, negative allowed, blank = unset) + `WinnerToggle`
    (ex-aequo = multiple on) + remove `×`, with the teaching helper. Cooperative
    rows = avatar + name + remove, plus `SegmentedResult` (`Résultat collectif`,
    defaults Succès ⇒ coop is always valid at ≥1 participant).
  - `NoteField` (optional).
  - Save `Button` (dormant/active per `selectValidity`); `InlineValidityHint`
    above it when competitive with no winner. Edit mode adds a header `⋮` →
    delete sheet, and the Save label becomes `Enregistrer les modifications`.
  - `BottomSheet` ×2: delete (trash) and abandon (undo-arrow / `Abandonner` /
    `Continuer la saisie`).
- **`playFormMessages.ts`** maps `ValidationErrorCode` → French copy; **`index.ts`** barrel.

## Wiring of entry points

- `GameDetail`: the CTA's `addPlay()` pushes `{ kind:'play-form', mode:'create',
  gameId, origin:'game' }`; history rows get `onClick` → push `{ mode:'edit',
  playId, origin:'game' }`.
- `PlayerDetail`: history rows get `onClick` → push `{ mode:'edit', playId,
  origin:'player' }`.
- `main.tsx`: keep the dev-only `window.__ludobox` seam (still used to seed E2E
  fixtures for edit/delete scenarios); refresh its now-stale comment.

## Testing

- **Vitest:** `playDraft` reducer / validity / dirty; `recordCelebration`;
  `playRepository.update` + on-the-fly atomic create (extend the repo test);
  `playFormData` load/save on fake-indexeddb; `PlayForm` (RTL) — winner toggle
  enables Save, autocomplete create-on-the-fly, cooperative flow, abandon + delete
  sheets, ex-aequo, solo play.
- **Playwright** (`e2e/play-form.spec.ts`): the recette journey — open from a
  competitive fiche → add participants + scores → designate a winner → save →
  return to the fiche with the **toast** and updated history/stats; and an
  on-the-fly player then appears in the Joueurs space.

## Out of scope (per brief)

Team plays (V2). Any new stats logic — reuse Brique 1. No global "+" entry point;
the game is always known at open.

## Acceptance (recette) — mirrors the brief

- [ ] E2E key journey (above), with toast + recomputed history/stats.
- [ ] Save disabled with the inline hint while competitive has no winner; enabled
      as soon as a winner is designated.
- [ ] On-the-fly player creation from the autocomplete → player exists in Joueurs.
- [ ] Cooperative flow: no score, Succès/Échec segmented, Save active at ≥1
      participant.
- [ ] Edit: values pre-filled, modification persisted.
- [ ] Delete + abandon sheets functional; abandon never loses data by mistake.
- [ ] Ex-aequo (multiple winners) and solo (one participant) accepted.

## Definition of done (factorisation)

- [ ] Form/validation core (`playDraft`) extracted and unit-tested without the UI.
- [ ] Reuses `WinnerToggle`, `SegmentedResult`, `Autocomplete`, `Toast`, the
      sheets, `Avatar`, `DateField`, `NoteField` — no re-implementation.
- [ ] Validation and "record battu ?" delegated to the domain (Brique 1).
- [ ] `/code-review` then `/simplify`; tests green; commit.
