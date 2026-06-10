/**
 * Picks a stable {@link AvatarColor} from a name, so a game or player keeps the
 * same game-piece hue across reads. Deterministic: the sum of char codes modulo
 * the palette. Shared by every list/identity that shows a placeholder avatar.
 */
import type { AvatarColor } from './Avatar';

const AVATAR_COLORS: AvatarColor[] = ['coral', 'teal', 'ink'];

export function avatarColorForName(name: string): AvatarColor {
  const sum = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
