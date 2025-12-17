# Composing a page and adding Prose

Start with `examples/standalone.html` to see the public entry alone.
`examples/project.html` builds a complete page from the same entry: a header and
wrapping navigation, an introduction, an intrinsic card grid, a longer note and
a footer. Its small `project.css` adds page presentation, rather than new library
components. Both examples work without JavaScript.

Use `cube-wrapper` for the outer width, `cube-flow` for a sequence of content,
`cube-cluster` for wrapping navigation/actions and `cube-grid` for collections.
Cards provide their own appearance and receive layout from the surrounding
composition. See the [CSS contract](css.md) for local overrides and semantics.

## Add an independent reading region

Obtain the standalone Prose library separately; it is not bundled inside this
library. Copy Cube's `css/` and `theme/` together into an asset directory, and
copy Prose's complete `css/` directory into a separate asset directory. Preserve
each library's relative imports, then transfer the optional theme to a
destination chosen by the host:

```sh
npm run sync:prose-theme -- /absolute/path/to/site/assets/desy-theme
```

Declare the top-level layer order before loading either library. These are
example host asset paths; retain the internal relative paths within each copied
library and theme directory.

```html
<style>@layer cube, prose, desy-theme;</style>
<link rel="stylesheet" href="assets/cube/css/cube.css">
<link rel="stylesheet" href="assets/prose/css/prose.css">
<link rel="stylesheet" href="assets/desy-theme/prose.css">

<main class="cube-wrapper">
  <article class="prose" data-paragraphs="space" lang="en">
    <h1>A longer thought</h1>
    <p>The reading stylesheet controls this text region.</p>
  </article>
</main>
```

Cube styles the document globally. The explicit layer order lets Prose control
its local typography even when the stylesheet links are reordered. Shared colors
and font families do not impose Cube's size or spacing scale on the reading
region. Your unlayered application rules remain in control.

The optional adapter requires Prose's theme fallback contract. Public
`--prose-*` properties take precedence; for example, set `--prose-measure: 38rem`
or `--prose-line-height: 1.8` on a host ancestor. Without the adapter, Prose keeps
its standalone defaults. See [theme transfer and ownership](theme.md).

Prose's `data-prose-ui` exclusion prevents its descendant selectors from styling
embedded controls. It does not undo ordinary CSS inheritance. Give embedded UI
its own font, line height, text color and spacing when it needs different values.

Ordinary use serves only the host's local files. It needs no source checkout,
framework, build step, font service or JavaScript runtime.
