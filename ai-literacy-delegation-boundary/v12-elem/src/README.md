# AI Literacy Source Layout

This directory is the editable source for the single-file `../index.html` build.

## Build

```sh
python3 ../build.py
```

The build keeps deployment simple by concatenating distributed source files into one standalone HTML file.

## Files

- `index.shell.html`: static HTML shell with CSS and JS injection placeholders.
- `styles/*.css`: visual styling, loaded in filename order.
- `js/*.js`: runtime code, loaded in filename order.
- `js/01-data.generated.js`: placeholder for YAML data injection. Do not replace it with hand-authored data.
- `../data/*.yaml`: scenario, cut image, and UI/report text data.

## Current Boundary

This split is intentionally behavior-preserving. The generated `index.html` should match the legacy template build byte-for-byte before deeper refactors.

Client-only deployment cannot hide scenario rules, scores, or answer paths from a determined user. Use minification/obfuscation only as friction, not as real source security. Anything that must be authoritative needs a server-side check.
