# panelware class reference

**Generated from `css/panelware.css` by `scripts/build-class-reference.mjs`.**
Do not edit by hand. `test/classes.test.mjs` fails if this file has drifted,
if a shipped class is missing a description, or if a description names a class
that no longer ships.

Every class the stylesheet carries a rule for, what it is, and the element it
goes on. The React components emit all of this for you and you do not need
this page to use them. It is here for the other entry point: the stylesheet
works with no React at all, and until this file the README named one class out
of 84.

Two things a consumer on that path inherits, both of which the components
otherwise handle:

- **The ARIA and the state attributes.** The CSS is driven by `data-state`,
  which Radix writes. Writing the markup yourself means writing `role`,
  `aria-*` and `data-state` and keeping them in step.
- **Sprite coordinates for icons.** See the icon section.

The package ships `demo/states.html`, which renders every component in every
state an attribute can reach with no JavaScript at all. It is the working
version of this page: open it from `node_modules/@josueavalosjim/panelware/`
and read the markup that is actually painting.

Skin, theme and density are attributes on any element, not just the root:
`data-skin`, `data-theme`, `data-density`.

## Utility

Two documented escape hatches for surfaces you build yourself, and one helper.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-raised` | any | Puts the skin's raised elevation on an element of your own. Nothing internal uses it; components assign --pw-elev instead. |
| `.pw-sunken` | any | The same for a sunken one, which is what a well or a field is made of. |
| `.pw-sr-only` | `<span>` | Text for a screen reader where the visible thing is a picture of text. Not display:none, which would remove it from the accessibility tree along with the screen. |

```html
<div class="pw-raised">a surface of your own</div>
<div class="pw-sunken">a well of your own</div>
```

## Button

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-button` | `<button>` | A button. data-variant="primary" for the accent one, data-gloss to opt into the Web 2.0 highlight. |

```html
<button class="pw-button">Cancel</button>
<button class="pw-button" data-variant="primary" data-gloss>Save</button>
```

## Toggle

A button that stays pressed. On is sunken and heavier, so the state is carried by depth rather than by colour.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-toggle` | `<button>` | The toggle itself. data-state is "on" or "off" and the CSS reads that, alongside aria-pressed. |
| `.pw-toggle-group` | `<div>` | A row of toggles behaving as one control. Segments join, and the outer corners are the only rounded ones. |

```html
<button class="pw-toggle" type="button" aria-pressed="true" data-state="on">Shuffle</button>

<div class="pw-toggle-group" role="group">
  <button class="pw-toggle" type="button" aria-pressed="true" data-state="on">L</button>
  <button class="pw-toggle" type="button" aria-pressed="false" data-state="off">R</button>
</div>
```

## Tabs

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-tabs` | `<div>` | The wrapper holding a tab list and its panels. |
| `.pw-tab-list` | `<div>` | The row of tabs. role="tablist". |
| `.pw-tab` | `<button>` | One tab. The selected one is raised into the panel and loses its bottom edge, which is the period drawing. |
| `.pw-tab-panel` | `<div>` | The panel a tab reveals. role="tabpanel", and it needs aria-labelledby pointing at its tab. |

```html
<div class="pw-tabs">
  <div class="pw-tab-list" role="tablist" aria-label="Sections">
    <button class="pw-tab" role="tab" id="t-1" aria-controls="p-1"
            aria-selected="true" data-state="active">Server</button>
    <button class="pw-tab" role="tab" id="t-2" aria-controls="p-2"
            aria-selected="false" data-state="inactive">Account</button>
  </div>
  <div class="pw-tab-panel" role="tabpanel" id="p-1" aria-labelledby="t-1">…</div>
</div>
```

## Window chrome

A window is a region or it is nothing: a <section> with no accessible name is dropped to role="generic" by the browser, and axe cannot report that because there is no landmark left to fault. Name it.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-window` | `<section>` | The window. Give it aria-labelledby pointing at its own title. |
| `.pw-title-bar` | `<div>` | The bar across the top. Takes data-gloss. |
| `.pw-title` | `<h2>` | The title text inside the bar, and the id the window is labelled by. Renders at level 2 unless titleLevel says otherwise: a component that can be placed anywhere cannot know the level, so it takes one and keeps 2 as the common case. |
| `.pw-title-controls` | `<div>` | The group holding the minimise, maximise and close buttons. |
| `.pw-title-button` | `<button>` | One of those buttons. Each needs an aria-label, because the glyph is a sprite and says nothing. |
| `.pw-window-body` | `<div>` | The window's content area. |

```html
<section class="pw-window" aria-labelledby="w-title">
  <div class="pw-title-bar" data-gloss>
    <h2 class="pw-title" id="w-title">Playlist</h2>
    <div class="pw-title-controls">
      <button class="pw-title-button" type="button" aria-label="Close">
        <span class="pw-icon" data-icon="close" aria-hidden="true"></span>
      </button>
    </div>
  </div>
  <div class="pw-window-body">…</div>
</section>
```

## Dialog

The panel and the overlay only exist while the dialog is open.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-overlay` | `<div>` | The scrim behind an open dialog. Takes data-glass to opt into the one blur the kit allows. *(only exists while open)* |
| `.pw-panel` | `<div>` | The dialog itself. It reuses the window chrome classes for its title bar. *(only exists while open)* |
| `.pw-panel-body` | `<div>` | The dialog's content area. It takes a tabindex only when it actually scrolls, because Chrome does not make scroll containers focusable and a dead tab stop on every short dialog is worse. *(only exists while open)* |

```html
<div class="pw-overlay"></div>
<div class="pw-panel" role="dialog" aria-labelledby="d-title">
  <div class="pw-title-bar" data-gloss>
    <h2 class="pw-title" id="d-title">Preferences</h2>
  </div>
  <div class="pw-panel-body">…</div>
</div>
```

## Menu bar

Everything below the trigger exists only while a menu is open.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-menubar` | `<div>` | The bar. role="menubar", and it is deliberately flat rather than bevelled. |
| `.pw-menubar-trigger` | `<button>` | One top-level name on the bar. |
| `.pw-menu` | `<div>` | The open popup. *(only exists while open)* |
| `.pw-menu-item` | `<div>` | One row in it. *(only exists while open)* |
| `.pw-menu-indicator` | `<span>` | The tick or bullet on a checked or selected row. It sits in the gutter, which is why every row is indented whether or not it has one. *(only exists while open)* |
| `.pw-menu-label` | `<div>` | A non-interactive heading inside a menu. *(only exists while open)* |
| `.pw-menu-separator` | `<div>` | A groove between two rows, engraved from the bevel pair rather than drawn in --pw-color-divider: inside a bevelled popup that is the period drawing. The flat rule is .pw-separator. *(only exists while open)* |
| `.pw-menu-shortcut` | `<span>` | The key hint on the right of a row. *(only exists while open)* |

```html
<div class="pw-menubar" role="menubar">
  <button class="pw-menubar-trigger" type="button" role="menuitem">File</button>
</div>

<div class="pw-menu" role="menu">
  <div class="pw-menu-label">Recent</div>
  <div class="pw-menu-item" role="menuitem">Open<span class="pw-menu-shortcut">Ctrl O</span></div>
  <div class="pw-menu-separator" role="separator"></div>
</div>
```

## Form controls

Field wraps the pair in a real <label>, so the words operate the control. That is native behaviour a hand-rolled checkbox routinely loses.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-field` | `<label>` | The row a control and its words sit in. |
| `.pw-label` | `<span>` | The words. Clicking them operates the control. |
| `.pw-input` | `<input>` | A single-line text field. Any type. aria-invalid="true" draws a ring thicker than the resting edge. |
| `.pw-textarea` | `<textarea>` | The same field with more than one line. Resizes vertically only. |
| `.pw-checkbox` | `<button>` | A checkbox. Needs role="checkbox", aria-checked and a matching data-state, which is what the CSS reads. |
| `.pw-radio` | `<button>` | A radio. The one round thing in the kit, because the shape is what says choose-one. |
| `.pw-radio-group` | `<div>` | The stack a set of radios lives in. role="radiogroup". |
| `.pw-box-indicator` | `<span>` | The mark inside a checked box. A checkbox renders both a tick and a dash and the CSS shows one, keyed off data-state, so an indeterminate box gets a dash rather than a faded tick. |
| `.pw-select` | `<button>` | The closed combo box: a sunken field with a raised drop button on its edge. role="combobox". |
| `.pw-select-value` | `<span>` | The current value, in its own element so it can truncate. |
| `.pw-select-button` | `<span>` | The raised drop button. Not a real button: the whole field is the control. |
| `.pw-select-list` | `<div>` | The open listbox. It reuses the menu surface, because it is one. *(only exists while open)* |
| `.pw-select-item` | `<div>` | One option in it. *(only exists while open)* |
| `.pw-select-indicator` | `<span>` | The tick on the selected option. *(only exists while open)* |

```html
<label class="pw-field">
  <span class="pw-label">Server</span>
  <input class="pw-input" type="text" value="panel.example.net">
</label>

<label class="pw-field">
  <span class="pw-label">Notes</span>
  <textarea class="pw-textarea" rows="3"></textarea>
</label>

<label class="pw-field">
  <button class="pw-checkbox" type="button" role="checkbox"
          aria-checked="true" data-state="checked">
    <span class="pw-box-indicator" data-state="checked">
      <span class="pw-icon" data-mark="check" data-icon="check" aria-hidden="true"></span>
    </span>
  </button>
  <span class="pw-label">Always on top</span>
</label>
```

## Switch

Not a toggle. A toggle is a button that stays pressed and answers "is this mode on"; a switch is a thing you throw, with its label beside it, and the state is where the thumb is. aria-pressed against aria-checked, and a screen reader says "pressed" for one and "on" for the other. If it belongs in a toolbar it is a toggle; if it belongs in a settings list it is a switch.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-switch` | `<button>` | The track. role="switch" with aria-checked and a matching data-state. Its hit area is a centred pseudo-element, so it is on the corner-clip opt-out list with the checkbox and the slider grip. |
| `.pw-switch-thumb` | `<span>` | The part that moves. Its travel is the track's width minus its height, which is one expression at any padding, and the position is what carries the state: the tint on the track is a second signal, because the cyber skin resolves its accents to one ink and a tint can end up saying nothing. |

```html
<label class="pw-field">
  <button class="pw-switch" type="button" role="switch"
          aria-checked="true" data-state="checked">
    <span class="pw-switch-thumb" data-state="checked"></span>
  </button>
  <span class="pw-label">Reconnect automatically</span>
</label>
```

## Collapsible

A disclosure row and the thing it discloses. The height is deliberately not animated: height is a layout property and animating it reflows the document every frame, so the chevron turns instead, which is the affordance anyone actually reads and costs one composited property.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-collapsible` | `<div>` | The wrapper. |
| `.pw-collapsible-trigger` | `<button>` | The row you press. Flat rather than bevelled, like the menu bar's trigger, and it needs aria-expanded plus aria-controls pointing at the content's id. The chevron inside it turns a quarter when open. |
| `.pw-collapsible-content` | `<div>` | What opens. Its id is what the trigger controls. |

```html
<div class="pw-collapsible" data-state="open">
  <button class="pw-collapsible-trigger" type="button"
          aria-expanded="true" aria-controls="adv" data-state="open">
    <span class="pw-icon" data-icon="chevron-right" aria-hidden="true"></span>Advanced
  </button>
  <div class="pw-collapsible-content" id="adv" data-state="open">…</div>
</div>
```

## Toolbar

One tab stop with the arrow keys moving inside it, which is the whole reason to reach for this rather than a row of buttons: eleven buttons in a plain row is eleven tab stops. Flat, like the menu bar, because the controls inside are already bevelled and a tray under them would be a frame around a frame. The transport is this primitive with a fixed set of buttons in it.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-toolbar` | `<div>` | The tray. role="toolbar", and it needs a name. Its buttons wear .pw-button: a button in a toolbar is a button, and a second class would be a second set of rules to keep in step for no visual difference. |

```html
<div class="pw-toolbar" role="toolbar" aria-label="Formatting">
  <button class="pw-button" type="button">Bold</button>
  <div class="pw-separator" role="separator" data-orientation="vertical"></div>
  <button class="pw-button" type="button">Align</button>
</div>
```

## Separator

The only thing that reads --pw-color-divider, which is that token's reason for existing: it was declared in every palette from the start and read by nothing. Its contrast tier is 2:1 rather than 3:1, because removing a grouping line identifies nothing and changes no state, so 1.4.11 does not reach it. The menu's own separator stays engraved from the bevel pair, which is a different job: a groove between two rows of a bevelled popup is the period drawing.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-separator` | `<div>` | A rule. data-orientation is "horizontal" or "vertical". role="separator", and it should be decorative unless the line carries meaning the words do not, because announcing "separator" between every pair of sections is noise. |

```html
<div class="pw-separator" role="none" data-orientation="horizontal"></div>
<div class="pw-separator" role="none" data-orientation="vertical"></div>
```

## Tooltip

A tooltip is not a label. A control whose only name is its tooltip has no name to a touch user, who cannot hover, and no name to anyone else until focus reaches it. Every icon-only control in this kit carries an aria-label for that reason, and a tooltip on top of one is a convenience. No arrow: an arrow is an SVG and every edge in this kit is an inset box-shadow, so a skinned arrow would be a hand-drawn second description of the frame that no token controls.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-tooltip` | `<div>` | The box. Raised, like the menu, because it is the same kind of thing: something above the page rather than part of it. *(only exists while open)* |

```html
<div class="pw-tooltip" role="tooltip">Stops after this track</div>
```

## Slider

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-slider` | `<span>` | The slider. role is on the thumb, not here. |
| `.pw-slider-track` | `<span>` | The groove. |
| `.pw-slider-range` | `<span>` | The filled part of the groove. |
| `.pw-slider-thumb` | `<span>` | The grip. role="slider", and it carries aria-valuenow. Give it aria-valuetext for anything that is not a bare number, because a screen reader reading "70" for decibels has said nothing. |

```html
<span class="pw-slider">
  <span class="pw-slider-track"><span class="pw-slider-range"></span></span>
  <span class="pw-slider-thumb" role="slider" tabindex="0" aria-label="Volume"
        aria-valuemin="0" aria-valuemax="100" aria-valuenow="70"></span>
</span>
```

## Equaliser

Not a multi-thumb slider. Each band is an independent single-thumb slider sharing a scale, because a multi-thumb slider re-sorts its values and 3kHz has to stay 3kHz.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-eq` | `<div>` | The frame. role="group", and it needs a name: ten bands that belong to each other. |
| `.pw-eq-well` | `<div>` | The sunken area the bands sit in. |
| `.pw-eq-band` | `<div>` | One band: a vertical slider and its label. |
| `.pw-eq-fill` | `<span>` | The band's fill, drawn from the zero line rather than from the floor. |
| `.pw-eq-label` | `<span>` | The frequency under a band. |

## Transport and seek

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-transport` | `<div>` | The row of playback buttons. role="toolbar", so it is one tab stop with arrow keys inside. |
| `.pw-transport-button` | `<button>` | One of them. Each needs an aria-label. |
| `.pw-progress` | `<div>` | A seek or progress bar. role="progressbar" when it only reports. |
| `.pw-progress-fill` | `<span>` | The filled part of it. |

```html
<div class="pw-transport" role="toolbar" aria-label="Playback">
  <button class="pw-transport-button" type="button" aria-label="Play">
    <span class="pw-icon" data-icon="play" aria-hidden="true"></span>
  </button>
</div>

<div class="pw-progress" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
  <span class="pw-progress-fill" style="width: 40%"></span>
</div>
```

## List

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-list` | `<ul>` | A selectable list. role="listbox", and it needs a name: a listbox with no name is an unnamed choice. |
| `.pw-list-item` | `<li>` | One row. role="option" with aria-selected. |
| `.pw-list-marker` | `<span>` | The mark on the row that is playing, which is not the same row as the selected one. Selection has no class of its own: it is aria-selected plus whatever the skin puts in --pw-selected-bg, --pw-selected-content and --pw-selected-mark. |
| `.pw-list-primary` | `<span>` | The row's main text. |
| `.pw-list-secondary` | `<span>` | The quieter second line, if there is one. |

```html
<ul class="pw-list" role="listbox" aria-label="Playlist" tabindex="0">
  <li class="pw-list-item" role="option" aria-selected="true" data-current>
    <span class="pw-list-marker">
      <span class="pw-icon" data-icon="play" aria-hidden="true"></span>
    </span>
    <span class="pw-list-primary">Intro</span>
    <span class="pw-list-secondary">2:14</span>
  </li>
  <li class="pw-list-item" role="option" aria-selected="false">
    <span class="pw-list-primary">Verse</span>
  </li>
</ul>
```

## Status badge

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-badge` | `<span>` | A status chip. data-status is "success", "warning" or "error", and the glyph inside is what carries the meaning for anyone who cannot separate the hues. Under the cyber skin all three resolve to one ink on purpose, so the glyph is the whole difference. |

```html
<span class="pw-badge" data-status="success">
  <span class="pw-icon" data-icon="check" aria-hidden="true"></span>Connected
</span>
```

## Metadata

Every entry takes a label. That is the component declining to draw what the reference screens are full of: an unlabelled string that looks like data and says nothing.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-meta` | `<dl>` | A block of label and value pairs. data-inline lays it out as a footer strip. |
| `.pw-meta-item` | `<div>` | One pair. |
| `.pw-meta-label` | `<dt>` | The label half, stepped back. |
| `.pw-meta-value` | `<dd>` | The value half. |

## Icon and spinner

Both draw from one sprite sheet. Name the glyph with data-icon and the cell comes from a generated rule, so hand-written markup does not carry sprite coordinates: the same index the Icon component reads is emitted as CSS. ICON_NAMES lists the thirty-two names, and the demo's icon gallery shows every one of them.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-icon` | `<span>` | One glyph. data-icon names it. The four knobs behind that are --pw-icon-x and --pw-icon-y for the cell and --pw-icon-ink-l and --pw-icon-ink-r for the empty columns either side, which a component subtracts to get an even optical gap beside a word; set them yourself only for a glyph that is not on the sheet. Always aria-hidden, or give the thing around it a name. |
| `.pw-spinner` | `<span>` | An eight-frame spinner. role="status", and it stops under prefers-reduced-motion. |

```html
<span class="pw-icon" data-icon="check" aria-hidden="true"></span>

<!-- An icon that carries the whole meaning needs a name of its own -->
<span class="pw-icon" data-icon="exclamation" role="img" aria-label="Warning"></span>
```

## Visualiser

A spectrum analyser. It listens to nothing: no Web Audio, no requestAnimationFrame, just an array of levels. The gradient is sized to the full column and anchored to its floor, so a bar shows the slice of the ramp its level reaches rather than the whole ramp squashed into its height. That one declaration is the difference between an analyser and a stacked bar chart, and it is what Winamp did: it coloured rows, not bars.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-visualiser` | `<div>` | The display, set into the chassis as a well. role="img" with a label, for the reason the readout gives: it is a picture, the bands are not facts anybody wants read out, and there is no ARIA pattern for a spectrum. |
| `.pw-visualiser-band` | `<span>` | One column. The peak floats in here rather than in the bar, because it has to position against the full height. |
| `.pw-visualiser-bar` | `<span>` | The level. --pw-vis-level is its height as a fraction of the column. |
| `.pw-visualiser-peak` | `<span>` | The held maximum. --pw-vis-hold is where it sits, on the same scale. |

```html
<div class="pw-visualiser" role="img" aria-label="Spectrum analyser">
  <span class="pw-visualiser-band" aria-hidden="true">
    <span class="pw-visualiser-bar" style="--pw-vis-level: 0.62"></span>
    <span class="pw-visualiser-peak" style="--pw-vis-hold: 0.80"></span>
  </span>
</div>
```

## Segment readout

A sprite font, not per-segment rendering, which is what Winamp actually did: numbers.bmp used 9x13px digit cells. The window is role="img" with a label, and that prunes everything inside it, which is why the pause button lives outside it.

| Class | Element | What it is |
| --- | --- | --- |
| `.pw-lcd` | `<span>` | The readout. Add pw-lcd-marquee alongside it for a scrolling one. |
| `.pw-lcd-marquee` | any | Set with pw-lcd, not instead of it. Turns the readout into a scrolling title. |
| `.pw-lcd-window` | `<span>` | The clipping window a marquee scrolls inside. role="img" with the text as its label. |
| `.pw-lcd-render` | `<span>` | The row of cells. aria-hidden, because the label on the window is what gets read. |
| `.pw-lcd-cell` | `<span>` | One glyph cell. |
| `.pw-lcd-pause` | `<button>` | The marquee's pause control. WCAG 2.2.2 asks for a mechanism to stop anything moving for more than five seconds, and pausing on hover is not one: a keyboard, switch or touch user cannot trigger it. |

