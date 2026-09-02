/**
 * TABS.
 *
 * Everything the APG asks for here is Radix's: roving tabindex so Tab enters
 * the strip once rather than stepping through every trigger, Left/Right/Home/
 * End to move selection, aria-controls and aria-labelledby wired both ways,
 * and tabIndex on the panel so a panel with no focusable content is still
 * reachable. None of that is CSS's job and none of it is re-implemented here.
 *
 * What this owns is the fuse: the active trigger drops a pixel and overlaps
 * the panel, so its own bottom edge lands underneath the panel's top edge
 * instead of beside it. That is the only thing separating a tab strip from a
 * row of pressed buttons.
 */
import { Tabs as RadixTabs } from 'radix-ui';
import type { ComponentPropsWithoutRef } from 'react';

import { cx } from './classes.js';

export type TabsProps = ComponentPropsWithoutRef<typeof RadixTabs.Root>;
export type TabListProps = ComponentPropsWithoutRef<typeof RadixTabs.List>;
export type TabProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger>;
export type TabPanelProps = ComponentPropsWithoutRef<typeof RadixTabs.Content>;

export function Tabs({ className, ...rest }: TabsProps) {
  return <RadixTabs.Root {...rest} className={cx('pw-tabs', className)} />;
}

export function TabList({ className, ...rest }: TabListProps) {
  return <RadixTabs.List {...rest} className={cx('pw-tab-list', className)} />;
}

export function Tab({ className, ...rest }: TabProps) {
  return <RadixTabs.Trigger {...rest} className={cx('pw-tab', className)} />;
}

export function TabPanel({ className, ...rest }: TabPanelProps) {
  return <RadixTabs.Content {...rest} className={cx('pw-tab-panel', className)} />;
}
