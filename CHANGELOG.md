# Changelog

All notable changes to Archaeopteryx.js. This file accumulates entries as work
lands on `master`; a release collects the `Unreleased` section into its GitHub
Release body. The published npm package and the live demo site are decoupled —
`docs/` is served from `master`, so demos update on every push, while npm
consumers only see a change when a version is cut.

## Unreleased

### Added

- **Click a legend colour to change it.** In a categorical colour legend, each
  swatch (and its label) is now a click target that opens the browser's colour
  picker, preset to the current colour. Picking one repaints that value
  everywhere at once — the swatch and every node carrying it — because both
  read the same scale. A `[reset colors]` chip appears once anything has been
  overridden and restores exactly the palette colours that were displaced,
  leaving values you never touched alone. Overrides survive switching Color-by
  away and back. Categorical legends only: a continuous/gradient legend has no
  discrete swatches to pick.

### Changed

- **Support values in Newick and Nexus files are now recognised
  automatically.** When every internal node label in a tree looks like a
  support value — bootstrap percentages, posterior probabilities, or a 0–1000
  scale — Archaeopteryx.js reads them as confidence values instead of node
  names, and shows them. A tree whose internal labels are real clade names is
  left untouched. The `nhConfidenceValuesAsInternalNames` config option is
  replaced by `internalLabelsAsConfidence`: `'auto'` (the new default),
  `'always'` (promote every numeric label, whatever its value) or `'never'`
  (keep them as names). **If you were passing
  `nhConfidenceValuesAsInternalNames: true`, the equivalent is `'always'` —
  not `'auto'`.** The old key still works, with a console warning naming its
  replacement. One deliberate difference: a numeric label on the ROOT is now
  kept as a name rather than converted, since on a rooted Newick that trailing
  label is usually the tree name. `nhConfidenceValuesInBrackets` is unchanged,
  and it is no longer an error to combine the two.

  This rule is shared with the desktop Java Archaeopteryx and was designed
  jointly with it; change it on both sides or neither.

### Fixed

- **Trees with branch lengths no longer open as cladograms.** The
  phylogram-vs-cladogram default counted every branch uniformly, so an
  exporter that omits `branch_length` on tips where it would be zero could
  drag a fully measured tree under the threshold. A 9256-tip BV-BRC influenza
  phyloXML with **all 5265 of its internal branches measured** opened as a
  cladogram on a ratio of 0.40. The default now judges the branches that
  actually carry the scale — internal, non-root — and treats an explicit
  zero-length branch as measured rather than missing. A missing tip length
  still draws correctly (the tip sits at its parent); a missing internal length
  is what destroys the scale. Trees with no internal branches (star trees) are
  judged on their tips. All 18 demo trees are unaffected.

### Unreleased since 3.0.0 (already on master)

- `open.html`: visualize your own tree entirely in the browser, plus an Expert
  options panel exercising every launch config key.
- The floating toolbar card is draggable on `demo.html` and `open.html`.
- `parseTree` recognizes phyloXML by content, not just by filename extension.
- Removed the dormant "Submit Selected" button; node selection is pull-only.
