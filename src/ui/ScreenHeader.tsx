/**
 * The masthead of a first-level list screen: a big Baloo title with an optional
 * count subtitle under it (e.g. "7 jeux · 46 parties consignées"). Shared by
 * Collection and Joueurs so the two stay visually identical. The subtitle is
 * omitted (pass `undefined`) in empty/loading states.
 */
import styles from './ScreenHeader.module.css';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <header className={styles.head}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </header>
  );
}
