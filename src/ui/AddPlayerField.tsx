/**
 * Add-player field — a text field led by a small coral `+` disc (a mini echo
 * of the CTA), with the coral focus accent. Thin specialization of TextField
 * (DESIGN.md §Fiche partie components).
 */
import { Plus } from './icons';
import { IconDisc } from './IconDisc';
import { TextField, type TextFieldProps } from './TextField';

export type AddPlayerFieldProps = Omit<
  TextFieldProps,
  'leading' | 'accent' | 'label'
> & {
  label?: string;
};

export function AddPlayerField({
  label = 'Ajouter un joueur',
  placeholder = 'Ajouter un joueur…',
  ...rest
}: AddPlayerFieldProps) {
  return (
    <TextField
      label={label}
      placeholder={placeholder}
      accent
      leading={
        <IconDisc size={24}>
          <Plus size={16} />
        </IconDisc>
      }
      {...rest}
    />
  );
}
