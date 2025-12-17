# Desy Cube

A small native CSS foundation based on [CUBE CSS](https://cube.fyi/).
Global element styles, wrapping groups, an intrinsic grid, cards and actions
provide a readable starting point. Source Sans 3, Source Serif 4, and Source Code Pro are served
locally, with system-font fallbacks.

## Explore

Use Node.js LTS Krypton (`lts/krypton` in `.node-version`) for the checked development preview:

```sh
fnm install
fnm use
npm ci
npm run dev
```

All demonstration pages live in `examples/`:

- [CSS laboratory](http://127.0.0.1:4322/examples/): type, colors, nested compositions and long content.
- [Minimal standalone page](http://127.0.0.1:4322/examples/standalone.html): only the public stylesheet.
- [Cards and actions](http://127.0.0.1:4322/examples/cards.html): composed library primitives.
- [Complete project page](http://127.0.0.1:4322/examples/project.html): navigation, introduction, cards, a longer note and footer.

The library itself needs no build, framework or application JavaScript. Its CSS,
fonts and static examples can be served by any static host. The development
commands install type-checking tools and run the strict check before serving.

## Use

Copy `css/` and `theme/` together, keeping their relative positions.
Load the public stylesheet:

```html
<link rel="stylesheet" href="css/cube.css">
<main class="cube-wrapper cube-flow">
  <h1>A clear starting point</h1>
  <p>The content sets the pace.</p>
</main>
```

The stylesheet styles the whole document. Your unlayered application rules take
precedence over its named layers. Read [the CSS contract](docs/css.md) for public
classes, custom properties, the cascade, and current boundaries.

The laboratory's own stylesheet is presentation for the laboratory, not part of
the library. Its serif specimen compares the reading family; it does not define
a separate reading-typography API. The complete page uses `examples/project.css`
for host-page presentation, alongside the public library. See
[composing a page and adding Prose](docs/integration.md).

## Repository layout

```text
css/             Public stylesheet and library rules
theme/           Shared colors, font families, fonts and optional Prose adapter
examples/        All demonstration pages and their presentation styles
docs/            Consumer contracts and font provenance
scripts/         Explicit shared-theme transfer
tests/browser/   Browser verification
tests/cli/       Transfer-command verification
```

## Fonts

Fonts are unmodified official variable WOFF2 files. Roman and true italic faces
cover the supported weight range with one file per style. See
[font provenance](docs/fonts.md), [exact source hashes](theme/font-sources.json),
and the bundled [license files](theme/licenses/).

## Verify

Development uses Node LTS Krypton (24.12 or newer within Node 24), TypeScript
5.9.3 and Node 24 declarations. With `lts/krypton` selected:

```sh
npm ci
npx playwright install chromium firefox webkit
npm test
```

Every test command starts with `npm run typecheck`: strict TypeScript,
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, with no emitted
script files. Node executes the checked `.ts` scripts directly. The runner
starts and stops the local Node server automatically. Tests cover the
public entry, local font loading and failure, keyboard navigation, JavaScript-free
use, narrow/wide layouts, long text, nested flow, enlarged root text, consumer
overrides and color contrast in Chromium, Firefox and WebKit.
Composition checks add container-based reflow, long card/button content, larger
root text, native form reset, keyboard link navigation, disabled actions and
button contrast in resting and hover states.
Command-level tests verify the shared-theme transfer, repeated updates and
preservation of unrelated destination content.
Browser tests complement visual inspection of actual text and font rendering.

On macOS the Firefox test process uses isolated application data under the ignored
cache directory, in addition to Playwright's temporary test profile. This avoids
interference with the installed browser's protected application data; it changes
no system permissions.
The keyboard test uses Option-Tab for macOS WebKit link navigation, matching
[Safari's documented behavior](https://support.apple.com/guide/safari/cpsh003/mac).

## Optional shared theme

Use `npm run sync:prose-theme -- <destination-theme-directory>` to copy the shared
colors, font families, local WOFF2 assets, licenses and optional adapter into a
Prose checkout. See [theme integration](docs/theme.md) for activation and ownership.
Prose retains its defaults when the optional theme is not loaded, and explicit
public Prose overrides remain in control.

## Scope

The current foundation contains global styles, wrapper, flow, cluster, grid,
cards and buttons. Additional blocks and shared-theme integrations can be added
as the system grows. Colors and font-family roles are the shared theme values;
size and spacing choices belong to this library.

