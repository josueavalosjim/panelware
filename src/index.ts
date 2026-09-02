/**
 * The kit's public surface.
 *
 * Named exports only, listed explicitly rather than re-exported with a star,
 * so this file is a readable answer to "what does this package give me".
 *
 * The CSS is not imported here. It ships as its own entry point, and that is
 * the architecture rather than an omission: the skin is the product, most of
 * the audience for a kit like this is not React-first, and importing the
 * stylesheet from the module would make the CSS unusable without React for
 * no gain. Consumers import both:
 *
 *   import "@josueavalosjim/panelware/css";
 *   import { Button } from "@josueavalosjim/panelware";
 */
export { Button } from './button.js';
export type { ButtonProps } from './button.js';

export { Toggle } from './toggle.js';

export { ToggleGroup, ToggleGroupItem } from './toggle-group.js';
export type { ToggleGroupProps, ToggleGroupItemProps } from './toggle-group.js';
export type { ToggleProps } from './toggle.js';

export { Tabs, TabList, Tab, TabPanel } from './tabs.js';
export type { TabsProps, TabListProps, TabProps, TabPanelProps } from './tabs.js';

export { Window } from './window.js';
export type { WindowProps } from './window.js';

export { Dialog, DialogTrigger, DialogPanel } from './dialog.js';
export type { DialogPanelProps } from './dialog.js';

export { Field, Checkbox, RadioGroup, Radio, Select, SelectItem } from './field.js';
export type {
  FieldProps, CheckboxProps, RadioGroupProps, RadioProps, SelectProps, SelectItemProps,
} from './field.js';

export { List } from './list.js';
export type { ListProps, ListRow } from './list.js';

export {
  Menubar, Menu, MenuTrigger, MenuContent, MenuItem, MenuCheckboxItem,
  MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuLabel, MenuSub,
} from './menubar.js';
export type {
  MenubarProps, MenuTriggerProps, MenuContentProps, MenuItemProps,
  MenuCheckboxItemProps, MenuRadioItemProps, MenuSeparatorProps,
  MenuLabelProps, MenuSubProps,
} from './menubar.js';

export { Equalizer } from './equalizer.js';
export type { EqualizerProps, EqualizerBand } from './equalizer.js';

export { Transport, TransportButton, Progress } from './transport.js';
export type { TransportProps, TransportButtonProps, ProgressProps } from './transport.js';

export { Slider } from './slider.js';
export type { SliderProps } from './slider.js';

export { Icon } from './icon.js';
export type { IconProps } from './icon.js';
export { ICON_NAMES } from './icons.js';
export type { IconName } from './icons.js';

export { Badge } from './badge.js';
export type { BadgeProps, BadgeStatus } from './badge.js';

export { Readout } from './readout.js';
export type { ReadoutProps } from './readout.js';

/* Exposed because a consumer building their own display on the same sheets
   needs the same mapping, and re-deriving it would be a second source of
   truth for something already checked against the font data. */
export { digitCell, glyphCell } from './charmap.js';
export type { Cell } from './charmap.js';

export { cx } from './classes.js';
