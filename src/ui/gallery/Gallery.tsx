/**
 * Living reference for the Brique 2 UI kit — every component in all its
 * variants/states. Mounted at `#/ui-gallery` (no router until Brique 3). Dev
 * reference only; not part of the product navigation.
 */
import { useState, type ReactNode } from 'react';
import {
  AddPlayerField,
  Autocomplete,
  Avatar,
  BottomSheet,
  Button,
  Check,
  DateField,
  DiceMotif,
  HistoryRow,
  InlineValidityHint,
  LeaderboardRow,
  NoteField,
  OverflowMenu,
  Pencil,
  Plus,
  RankBadge,
  RecordCard,
  ResultChip,
  SegmentedResult,
  StatSummary,
  SuccessRateCard,
  Tag,
  TextField,
  Toast,
  Trash,
  WinnerToggle,
  type CoopResult,
} from '@/ui';
import styles from './Gallery.module.css';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.row}>{children}</div>
    </section>
  );
}

const PLAYERS = [
  { id: '1', name: 'Camille', color: 'coral' as const },
  { id: '2', name: 'Théo', color: 'teal' as const },
  { id: '3', name: 'Inès', color: 'blue' as const },
];

export function Gallery() {
  const [won, setWon] = useState(true);
  const [coop, setCoop] = useState<CoopResult>('succes');
  const [query, setQuery] = useState('Cam');
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <h1 className={styles.title}>Ludobox · UI kit</h1>
        <p className={styles.sub}>
          Brique 2 — design system, all variants & states.
        </p>
      </header>

      <Section title="01 · Avatar">
        <Avatar name="Camille" color="coral" />
        <Avatar name="Théo" color="teal" size={56} />
        <Avatar name="Inès" color="blue" size={40} />
      </Section>

      <Section title="02 · Tag / ResultChip / RankBadge">
        <Tag type="competitif" />
        <Tag type="cooperatif" />
        <ResultChip result="victoire" />
        <ResultChip result="defaite" />
        <ResultChip result="succes" />
        <ResultChip result="echec" />
        <RankBadge rank={1} />
        <RankBadge rank={2} />
        <RankBadge rank={3} />
      </Section>

      <Section title="03 · CTA — enabled / disabled">
        <Button label="Ajouter une partie" icon={<Plus size={22} />} />
        <Button
          label="Enregistrer la partie"
          icon={<Check size={22} />}
          disabled
        />
      </Section>

      <Section title="04 · WinnerToggle / SegmentedResult">
        <WinnerToggle on={won} onChange={setWon} label="Camille a gagné" />
        <span className={styles.note}>{won ? 'on' : 'off'}</span>
        <div className={styles.grow}>
          <SegmentedResult value={coop} onChange={setCoop} />
        </div>
      </Section>

      <Section title="05 · Fields">
        <div className={styles.stack}>
          <DateField label="Date" value="samedi 7 juin 2025" />
          <TextField label="Texte" placeholder="Texte…" />
          <AddPlayerField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <NoteField label="Note" placeholder="Une note sur la partie…" />
        </div>
      </Section>

      <Section title="06 · Autocomplete">
        <div className={styles.stack}>
          <Autocomplete
            query={query}
            players={PLAYERS}
            onSelect={() => {}}
            onCreate={() => {}}
          />
        </div>
      </Section>

      <Section title="07 · Feature cards">
        <div className={styles.stack}>
          <RecordCard score={142} holder="Camille" holderColor="coral" />
          <SuccessRateCard wins={7} losses={3} />
        </div>
      </Section>

      <Section title="08 · Leaderboard / History">
        <div className={styles.stack}>
          <LeaderboardRow rank={1} name="Camille" wins={12} trophy highlight />
          <LeaderboardRow rank={2} name="Théo" wins={9} />
          <LeaderboardRow rank={3} name="Inès" wins={5} />
          <HistoryRow
            day={7}
            month="JUIN"
            title="Camille"
            meta="Compétitif · 4 joueurs"
            trophy
            score={142}
          />
          <HistoryRow
            day={2}
            month="MAI"
            title="Catan"
            meta="Coopératif"
            result="succes"
          />
          <HistoryRow
            day={18}
            month="AVR"
            title="7 Wonders"
            meta="Compétitif"
            score="unset"
          />
        </div>
      </Section>

      <Section title="09 · StatSummary">
        <div className={styles.stack}>
          <StatSummary played={42} wins={17} />
        </div>
      </Section>

      <Section title="10 · Empty state · DiceMotif">
        <DiceMotif />
      </Section>

      <Section title="11 · OverflowMenu / InlineValidityHint">
        <OverflowMenu
          items={[
            {
              label: 'Renommer',
              icon: <Pencil size={20} />,
              onSelect: () => {},
            },
            {
              label: 'Supprimer le joueur',
              icon: <Trash size={20} />,
              onSelect: () => {},
              tone: 'destructive',
            },
          ]}
        />
        <div className={styles.grow}>
          <InlineValidityHint />
        </div>
      </Section>

      <Section title="12 · Toast">
        <div className={styles.stack}>
          <Toast
            name="Camille"
            headline="Nouveau record, Camille"
            subline="Partie enregistrée · 142 pts"
            duration={2147483647}
          />
        </div>
      </Section>

      <Section title="13 · BottomSheet">
        <Button label="Ouvrir la feuille" onClick={() => setSheetOpen(true)} />
        <BottomSheet
          open={sheetOpen}
          icon={<Trash size={28} />}
          title="Supprimer le jeu ?"
          body="Cette action est définitive. Les parties enregistrées seront perdues."
          actionLabel="Supprimer le jeu"
          onAction={() => setSheetOpen(false)}
          onCancel={() => setSheetOpen(false)}
        />
      </Section>
    </div>
  );
}
