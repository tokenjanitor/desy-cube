# Font provenance

The fonts are obtained directly from Adobe's official repositories, pinned to
the source commits recorded in [the manifest](../theme/font-sources.json).
The manifest records each original URL, byte size and SHA-256 digest.
Files are unmodified variable WOFF2; no subsetting or font build is required.

| Family | Role | Files |
| --- | --- | --- |
| Source Sans 3 | UI and ordinary text | Roman and italic |
| Source Serif 4 | Available reading family | Roman and italic |
| Source Code Pro | Code | Roman and italic |

Each face declares the supported weight range 200–900 and uses `font-display:
swap`. Fonts are requested when used, rather than all being preloaded.
The font-family stacks include system sans, Georgia/serif and system monospace
fallbacks. These fallbacks are not metrically adjusted; loading may change text
metrics, so layouts must accommodate it.

The SIL Open Font License files and copyright notices are included per family
under [theme/licenses](../theme/licenses/). Keep these files with redistributed
font assets. The exact upstream files remain identified by the manifest.

Sources:

- [Source Sans](https://github.com/adobe-fonts/source-sans)
- [Source Serif](https://github.com/adobe-fonts/source-serif)
- [Source Code Pro](https://github.com/adobe-fonts/source-code-pro)

The serif specimen in the laboratory uses native optical sizing. Verify the
chosen profiles with real reading text, emphasis, numerals and language-specific
glyphs before treating the appearance as final.

