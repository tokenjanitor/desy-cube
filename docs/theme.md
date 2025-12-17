# Optional Prose theme transfer

The master shared theme lives in `theme/`. It contains only common colors,
font-family roles, local font declarations/assets, licenses/provenance and the
optional Prose adapter. Library-specific sizes and spacing stay separate.

## Transfer

With Node LTS Krypton selected and development dependencies installed,
choose the destination explicitly:

```sh
npm run sync:prose-theme -- /absolute/path/to/prose/theme
```

The command type-checks first. The TypeScript transfer script itself uses only
Node built-ins; the compiler is a development dependency. It copies the current
theme files and replaces matching
managed files on subsequent runs. Unrelated destination files are retained.
It checks managed path conflicts before replacing files and rejects symlinks at
managed paths. Source and destination must not overlap.

Do not edit a managed copy as the master: change the source theme and transfer it
again. Final token governance is intentionally deferred.

## Prose usage

The receiving Prose stylesheet must support the optional theme fallback contract.
The transfer copies the theme only, not the reading library itself.

```html
<link rel="stylesheet" href="css/prose.css">
<link rel="stylesheet" href="theme/prose.css">
<article class="prose" lang="en">...</article>
```

The two stylesheet links may appear in either order. The adapter supplies internal
defaults; explicit public `--prose-*` properties remain first in Prose's fallback
chain, whether set on the root, a host ancestor or the reading region itself.
Without the optional entry, Prose uses its original defaults even if a host
already defines the shared `--desy-*` tokens.

The adapter chooses Source Serif 4 for reading, Source Code Pro for code, and maps
shared text, link, focus, muted, border and code-surface colors. Headings retain
Prose's own color inheritance. The host chooses its page background and may use
`--desy-color-background` itself. Source Sans 3 is available for host UI.

The `--_desy-prose-*` properties are internal integration defaults. They are not
another public override API. Measure, paragraph modes, font size, line height and
spacing remain local to Prose. Keep font assets, licenses and provenance together
with the copied CSS; normal use needs no source checkout or font service.

## Verify

`npm run test:transfer` exercises the command against temporary destinations,
including byte-for-byte copies, repeated updates, preservation of unrelated
content, explicit destinations and conflicting managed paths.
`npm test` runs these checks followed by the browser suite.
