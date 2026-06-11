/**
 * Public surface of the Ludobox UI kit (Brique 2). Purely presentational
 * components — props in, pixels out. No data fetching, domain logic, or
 * navigation here (small view-text helpers like plural/formatHistoryDate aside).
 */
export * from './icons';

export { Avatar, type AvatarColor, type AvatarProps } from './Avatar';
export { avatarColorForName } from './avatarColor';
export { Tag, type GameType, type TagProps } from './Tag';
export {
  ResultChip,
  type ResultKind,
  type ResultChipProps,
} from './ResultChip';
export { RankBadge, type RankBadgeProps } from './RankBadge';
export { IconDisc, type DiscColor, type IconDiscProps } from './IconDisc';

export { Button, type ButtonProps } from './Button';
export { CancelLink, type CancelLinkProps } from './CancelLink';
export { WinnerToggle, type WinnerToggleProps } from './WinnerToggle';
export {
  SegmentedResult,
  type CoopResult,
  type SegmentedResultProps,
} from './SegmentedResult';
export { TextField, type TextFieldProps } from './TextField';
export { DateField, type DateFieldProps } from './DateField';
export { NoteField, type NoteFieldProps } from './NoteField';
export { AddPlayerField, type AddPlayerFieldProps } from './AddPlayerField';
export {
  Autocomplete,
  type AutocompletePlayer,
  type AutocompleteProps,
} from './Autocomplete';

export { RecordCard, type RecordCardProps } from './RecordCard';
export { SuccessRateCard, type SuccessRateCardProps } from './SuccessRateCard';
export { LeaderboardRow, type LeaderboardRowProps } from './LeaderboardRow';
export { HistoryRow, type HistoryRowProps } from './HistoryRow';
export { formatHistoryDate } from './formatHistoryDate';
export { plural } from './plural';
export { StatSummary, type StatSummaryProps } from './StatSummary';
export { ScreenHeader, type ScreenHeaderProps } from './ScreenHeader';

export { DiceMotif, type DiceMotifProps } from './DiceMotif';
export { BottomSheet, type BottomSheetProps } from './BottomSheet';
export {
  OverflowMenu,
  type OverflowMenuItem,
  type OverflowMenuProps,
} from './OverflowMenu';
export {
  InlineValidityHint,
  type InlineValidityHintProps,
} from './InlineValidityHint';
export { Toast, type ToastProps } from './Toast';
