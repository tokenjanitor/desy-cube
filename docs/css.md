# CSS contract

## Entry and cascade

Load `css/cube.css`. It uses native imports and named nested layers in this order:
`cube.tokens`, `cube.reset`, `cube.base`, `cube.compositions`, `cube.blocks`.
Font-face declarations are separate from styling layers.
All CSS imports precede ordinary rules; no compilation is required.

Application rules outside named layers override ordinary library declarations.
The reset keeps HTML's `hidden` state effective even when a display rule is added.
Global element styles intentionally affect the document; this is not a scoped
component stylesheet. Host-page placement and vertical page padding are yours.

The target is current stable Chromium, Firefox and Safari/WebKit on desktop and
mobile. Native cascade layers and CSS math are part of this initial baseline.
Additional unsupported enhancements should leave useful content and interaction.
There is no JavaScript runtime.

## Public compositions

| Class | Behavior | Optional custom property |
| --- | --- | --- |
| `cube-wrapper` | Centers content within the available width and a maximum; leaves responsive side gutters | `--cube-wrapper-max`, default `70rem` |
| `cube-flow` | Adds a block-start margin only between direct children | `--cube-flow-space`, default `1.5rem` |
| `cube-cluster` | Arranges items in a wrapping row, aligned at the center | `--cube-cluster-gap`, default `1rem` |
| `cube-grid` | Fits as many equal-width columns as the container allows, then falls back to one column | `--cube-grid-min`, default `18rem`; `--cube-grid-gap`, default `1.5rem` |

Custom properties follow normal inheritance. Flow reads the interval on the
following child, matching CUBE's child-level exceptions. Setting the property on
a nested flow therefore also changes that flow's own outer gap. To vary only
its inner rhythm, target its direct children:

```css
.reading-section > * {
  --cube-flow-space: 0.75rem;
}
```

The nested flow itself keeps the surrounding interval. Flow does not require a
particular child element or rewrite display/layout behavior.

Cluster and grid introduce their own layout contexts. Their children can shrink
below intrinsic minimum widths, so long text wraps instead of widening the page.
The grid minimum is capped at the available width. A narrow nested container
therefore produces fewer columns even inside a wide viewport; no viewport
breakpoints are required. Gap replaces their children's block margins, including
ordinary list rhythm; markers and list semantics remain intact.

## Cards and actions

`cube-card` supplies a border, surface, text color, small corner radius and padding.
It sets no display mode, column count, height or outer spacing. Combine it with a
composition, such as `cube-flow` internally and `cube-grid` around a collection.
Override `--cube-card-padding` when needed; the default is `1.5rem`.
`data-variant="accent"` changes only the card border to the accent color.

`cube-button` styles a native button or a link. The default is a filled accent
action; `data-variant="outline"` offers the demonstrated alternative. Text wraps
and the action can shrink to fit its available width. Native disabled buttons
remain disabled and get a distinct appearance. Focus remains visible; hover
adds no motion. The class adds no application behavior or ARIA state.

Use a real button with an explicit type for an action and a real anchor with an
href for navigation. Put separate links inside ordinary card containers rather
than nesting interactive elements inside a clickable card. Disabling an action
uses a native disabled button; adding aria-disabled to a link does not disable it.

```html
<div class="cube-grid">
  <article class="cube-card cube-flow">
    <h2>Field notes</h2>
    <p>Observations from making useful pages.</p>
    <div class="cube-cluster">
      <a class="cube-button" href="notes.html">Read the notes</a>
      <a class="cube-button" data-variant="outline" href="index.html">All subjects</a>
    </div>
  </article>
</div>
```

## Shared theme values

| Custom property | Role |
| --- | --- |
| `--desy-color-background` | Warm offwhite page surface |
| `--desy-color-text` | Ink-blue foreground |
| `--desy-color-muted` | Secondary readable text |
| `--desy-color-accent` | Links and other accents |
| `--desy-color-focus` | Visible keyboard focus |
| `--desy-color-border` | Decorative separators |
| `--desy-color-code-background` | Surface for code |
| `--desy-font-sans` | UI and ordinary text |
| `--desy-font-serif` | Available reading family |
| `--desy-font-mono` | Code family |

Override these on the root for page-wide theming. Descendant color overrides work
where the property is consumed; font-family custom properties are set at their
consumer as usual. Check contrast again when changing colors. Decorative borders
are not intended as the sole indication of an interactive control.

Local `--cube-space-*`, `--cube-gutter` and `--cube-text-size` values are initial
library defaults, not a shared cross-library spacing or type-scale contract.
Reading measure, paragraph treatment and reading line height are outside this API.

## Local design values

Variable design defaults live in [css/tokens.css](../css/tokens.css). They are
local to Cube, inherit normally, and can be overridden on a host or element;
they are not added to the shared theme. Independent heading levels and block
roles can vary independently even when their initial values match.

| Properties | Role |
| --- | --- |
| `--cube-text-line-height`, `--cube-heading-weight`, `--cube-heading-line-height`, `--cube-strong-weight` | Text rhythm and weights |
| `--cube-definition-weight`, `--cube-summary-weight` | Definition terms and disclosure labels |
| `--cube-h1-size` through `--cube-h6-size`, `--cube-h1-tracking`, `--cube-h2-tracking` | Heading sizes and tracking |
| `--cube-link-underline-width`, `--cube-link-underline-hover-width`, `--cube-link-underline-offset` | Link decoration |
| `--cube-focus-width`, `--cube-focus-offset`, `--cube-scroll-offset` | Focus and anchor geometry |
| `--cube-list-indent`, `--cube-list-space` | List presentation |
| `--cube-code-size`, `--cube-code-padding`, `--cube-pre-padding`, `--cube-small-size` | Code and small text |
| `--cube-quote-padding`, `--cube-quote-rule-width`, `--cube-rule-width` | Quotes and separators |
| `--cube-card-radius`, `--cube-card-border-width`, `--cube-card-padding` | Card geometry |
| `--cube-button-gap`, `--cube-button-min-height`, `--cube-button-padding`, `--cube-button-radius`, `--cube-button-border-width`, `--cube-button-weight`, `--cube-button-line-height` | Action geometry and typography |
| `--cube-button-disabled-background` | Disabled action surface, independently of code surfaces |

Changing `--desy-color-code-background` affects code only, not disabled actions.
The two surfaces initially use the same color, not the same responsibility.
Structural resets and layout arithmetic remain literal; they do not encode
variable design choices.

## Global behavior

Element margins are reset, then flow provides sibling rhythm. Lists retain
markers. Headings, links, emphasis, code and native disclosure remain semantic.
Long text can wrap within its container; preformatted code scrolls internally.
Keyboard focus uses a visible outline. The library adds no motion and forces no
smooth scrolling. Native browser zoom and root font preferences remain effective.

## Current limits

This first version has only the documented compositions, card and action styles.
The [shared Prose theme](theme.md) is optional and transferred through an explicit
command. It is not automatically activated by loading the Cube stylesheet.
There is no dark theme yet.
The library does not provide application state, tracking or interactive widgets.
The laboratory needs its own presentation stylesheet; the standalone example
loads only the public entry.

