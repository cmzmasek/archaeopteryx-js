# Changelog

All notable changes to Archaeopteryx.js. This file accumulates entries as work
lands on `master`; a release collects the `Unreleased` section into its GitHub
Release body. The published npm package and the live demo site are decoupled —
`docs/` is served from `master`, so demos update on every push, while npm
consumers only see a change when a version is cut.

## 3.2.1 — 2026-09-10

### Fixed

- **The program reports its own version correctly again.** 3.2.0 shipped with
  the `VERSION` constant still reading `3.1.0`: the release bumped
  `package.json` and both file headers and missed the constant, which is the
  one a user actually sees — in the About dialog and on the control-panel
  button. No behaviour was affected, but 3.2.0 installed from npm names itself
  3.1.0, and npm versions cannot be corrected in place. This release exists to
  fix that. `npm test` now asserts that `package.json`, the `VERSION` constant
  and both `// v X.Y.Z` headers agree, so it cannot happen again.

## 3.2.0 — 2026-09-10

A tree I/O release. Saving a tree and opening it again used to lose tip
names, sometimes silently and sometimes destructively; it no longer does.
Every change here was designed and verified jointly with the desktop Java
Archaeopteryx (0.11.141 / 0.11.142), so the two programs now read and write
the same tokens for the same names.

### Fixed

- **Saving a tree no longer damages its tip names.** Both writers mapped
  every space, comma, parenthesis, bracket, colon, semicolon and quote in a
  label to `_`, and no reader can undo that: a tip named `Cooper's Hawk` was
  written `Cooper_s_Hawk` and came back that way. Labels are quoted now
  instead. Round-tripping every tree in the project's own corpus through
  Nexus and back, **28 of 49 trees lost at least one tip name before this
  release; none do now.** Real cases fixed include `Cote d'Ivoire`,
  `Anas_platyrhynchos_(mallard)` and `Aves (modern birds)`.

- **A Nexus tree could come back with duplicated tips.** A bare integer tip
  name was treated as an index into `TAXLABELS` whenever that one number
  happened to be in range, decided tip by tip. Against six labels,
  `((a,b,c),(1,2,3))` returned a tree whose every tip was a duplicate of
  another — and it still parsed and still rendered, so nothing announced it.
  A numeric tip is now an index only when the WHOLE tree reads as index
  references: every tip a bare integer and every one of them in range. One
  out-of-range index leaves the tree alone instead of half-renaming it.

- **Apostrophes survive a quoted label.** Nexus and Newick escape a literal
  quote inside a quoted token by doubling it. Every reader stripped the
  quotes instead of un-doubling them, so `'Seba''s bat'` came back as
  `Sebas bat` rather than `Seba's bat`. Fixed in all four places a label is
  read: `TAXLABELS`, `TRANSLATE`, the tree name, and the Newick scanner.

- **An unquoted apostrophe no longer swallows the rest of the line.** In a
  `TAXLABELS` block, a bare `O'Neil` opened a quoted run that ran past the
  terminating `;`, merging every remaining label into one and leaving the
  other tips as bare numbers. A quote now opens a run only at a token
  boundary.

- **A phyloXML file carrying extension elements from another namespace no
  longer fails to open.** phyloXML permits them and puts them last; the
  reader had a hardcoded handler for one such element that assumed a
  position the schema does not allow, and threw at the position it requires.

### Changed

- **Label shortening now strips a prefix shared by most tips, not all of
  them.** The old rule took the longest prefix common to every tip, so a
  handful of oddly-named tips vetoed shortening for the rest: on a 13,246-tip
  influenza tree, 13,096 tips share a 51-character prefix, but 0.8% of them
  held it back and nothing was stripped at all. The threshold is 95%, chosen
  jointly with the desktop and identical in both programs. On the project's
  corpus the prefix step now fires on 20 of 48 trees where it fired on 5.
  Tips that do not carry the prefix keep their full names, as before.

- **Written labels are quoted rather than transliterated.** A name holding an
  apostrophe is written in double quotes; one holding a double quote, or any
  of `( ) , ; : [ ]` or whitespace, in single quotes; anything else bare.
  This is the desktop's rule, shared by the Nexus and Newick writers here as
  it is there, so the two formats cannot drift apart. A name carrying BOTH
  quote styles is still lossy — its apostrophes become backticks, because no
  quote character is left to wrap it in — and the desktop does the same.

- **`forester.toNewHampshire`'s `replaceChars` argument is retired** and now
  ignored. Its only effect was the lossy `_` substitution described above.
  It remains in the signature so positional callers keep working.

### Maintenance

- **All Dependabot alerts resolved: 32 to 0.** Every one was a ghost of the
  pre-3.0.0 dependency set — `package.json` had been correct since the
  modernization but `package-lock.json` was never regenerated, and still
  described version 2.3.2 with canvg 1.5.3 (which pulled jsdom, request,
  form-data, tough-cookie, qs, uuid and xmldom), jQuery, jQuery UI, and d3
  pinned at v3. npm consumers were never exposed: the package ships five
  files with no bundled dependencies, and the published tarball is unchanged.

- **The project's phyloXML test fixtures are now schema-valid.** Four of the
  26 were rejected outright by a validating parser, so they could not be used
  as shared evidence with the desktop. Four kinds of defect across 127
  places; the non-phyloXML extension elements they carry were kept, moved
  into their own namespace rather than deleted.

## 3.1.0 — 2026-09-09

### Added

- **The horizontal axes float.** The geologic and calendar time axes and
  the alignment's conservation / consensus / column-ruler strip used to be
  part of the tree drawing: zoom in, pan up, and they left with it. They now
  live on a layer of their own and are *sticky* — they sit at the tree's
  bottom edge as before, and when that edge would leave the viewport they
  hold at the bottom of the view instead, still x-aligned with the tree as
  it pans. Each strip has an opaque backdrop with a top rule, so tips panned
  under it do not show through. Exports re-anchor the strips to the tree, so
  a figure never carries an artefact of where you were scrolled. (The
  desktop pins its axes to the viewport bottom always; sticky is a chosen
  difference.) Groundwork for the transform-based zoom to come.

- **A guide line from each tip to its alignment row.** With the alignment
  track on, a faint dashed line now runs from the end of each tip's label —
  or from the node, when labels are hidden — across to that tip's row, so a
  row reads back to its sequence without counting. Dashed, so it cannot be
  taken for a branch; it follows the theme like the branches do.

- **A navigation bar for long alignments.** The alignment track scrolled
  with a bare slider and a three-column wheel step — on a 30,000-column
  alignment that is ~115 columns per pixel of slider and ten thousand notches
  end to end: nothing could be found, only scrolled past. The slider now sits
  in a bar with first / page back / page forward / last buttons (a page is
  one screenful of columns), a **jump-to-column** box — type a column, press
  Enter — and a live readout of the columns on screen ("column 15000 –
  15,123 of 30,000"). The wheel moves a tenth of a screen per notch. Themed
  like the rest of the viewer.

- **The hover glow takes the node's own colour.** The three translucent
  discs that mark the node under the pointer were always the UI's blue; they
  now take the hue of the node they mark — its Color-by value, else its
  visual style, else its event colour, else a colourised clade's branch
  colour — and fall back to the blue for a node with no colour of its own.
  Never the search colour: a focus ring must not look like a selection. The
  hue is kept and its saturation and brightness floored, so a dark or pale
  colour still shows through the wash. As on the desktop.

- **The geologic time axis bands Series over Stage for narrow windows.** A
  tree spanning one or two Series — a 66–100 Ma dinosaur clade, say — used
  to read only "Cretaceous / Late Cretaceous"; it now shows the Series over
  its ICS stages (Cenomanian … Maastrichtian), each in its chart colour, with
  a label only where it fits. The axis also bands on the span the tree
  actually occupies, youngest tip to root, rather than from the present, so a
  fossil-only clade gets the right resolution. Wider windows keep the
  Period/Epoch → Era/Period → Eon/Era ladder. The 101 ratified Phanerozoic
  stages (plus the Pridoli standing in for its own span) come from the same
  Macrostrat ICS table as every other rank; the rule and the data are shared
  with the desktop Archaeopteryx, byte for byte.

- **Click a legend colour to change it.** In a categorical colour legend, each
  swatch (and its label) is now a click target that opens the browser's colour
  picker, preset to the current colour. Picking one repaints that value
  everywhere at once — the swatch and every node carrying it — because both
  read the same scale. A `[reset colors]` chip appears once anything has been
  overridden and restores exactly the palette colours that were displaced,
  leaving values you never touched alone. Overrides survive switching Color-by
  away and back. Categorical legends only: a continuous/gradient legend has no
  discrete swatches to pick.

  The picker is an in-page panel, not the browser's native colour input: it
  follows the control panel's light/dark choice, carries its own close button
  (Escape and a click outside also dismiss it), and **the tree repaints as you
  pick** rather than only when you dismiss it. It offers a
  saturation/brightness field, a hue strip, a hex box, and the tree's own
  twenty-colour palette for one-click choices.

### Changed

- **The overview pane is about 20% larger** — 142 × 111 rather than 118 × 92,
  keeping its proportions. The miniature is what it is useful for, and it was
  small for a big tree.

- **`nhConfidenceValuesInBrackets` is retired.** It gated whether `[95]`
  after a node is read as a confidence — but setting it `false` never
  reinterpreted the bracket, it *discarded* it, so the option's only power
  was to throw support values away. A bracket that is not a number is a
  Newick comment and was ignored either way, and NHX / BEAST annotation
  blobs go through a different path entirely. Its one real purpose was
  historical: it used to be mutually exclusive with the internal-labels
  option, and that restriction is gone. Bracketed values are now always read
  as confidences. The key is still accepted, with a console warning saying
  it has no effect, so no embed breaks.

- **Support values in Newick and Nexus files are now recognised
  automatically.** When every internal node label in a tree looks like a
  support value — bootstrap percentages, posterior probabilities, or a 0–1000
  scale — Archaeopteryx.js reads them as confidence values instead of node
  names, and shows them. A tree whose internal labels are real clade names is
  left untouched. The `nhConfidenceValuesAsInternalNames` config option is
  replaced by `internalNumericLabels`: `'auto'` (the new default),
  `'confidence'` (read every numeric label as one, whatever its value) or
  `'label'` (keep them as names). **If you were passing
  `nhConfidenceValuesAsInternalNames: true`, the equivalent is
  `'confidence'` — not `'auto'`.** The old key still works, with a console
  warning naming its replacement. One deliberate difference: a numeric label
  on the ROOT is now kept as a name rather than converted, since on a rooted
  Newick that trailing label is usually the tree name.

  The rule itself is shared with the desktop Java Archaeopteryx and was
  designed jointly with it; change it on both sides or neither. Only the
  naming differs: the desktop calls the three states Auto / Always / Never
  in its Settings, where the row already supplies the verb.

### Performance

- **Zooming a big tree is no longer a slide show.** Zoom in Archaeopteryx is
  a re-layout rather than a transform — the tree grows while the labels keep
  their size — so every wheel notch was a full redraw, and a plain wheel
  notch was two (one per axis). A flick sending ten notches was twenty
  synchronous redraws. Zoom now goes through the same coalescing as every
  other redraw: a burst of notches returns in milliseconds, shows the
  "Redrawing" card once, redraws once, and re-centres the viewport on the
  point that was under it — mapping the first notch's "before" to the last
  notch's "after", which is what a single re-centring needs. The zoom
  buttons use the same path. Small trees are unchanged.
- **Launching no longer redraws four times.** `initialize()` ended by
  running both searches, each of which ends in a redraw — two extra full
  passes on every launch that drew nothing new. A redraw scheduled while the
  initial draw is in progress is now dropped, since that draw renders the
  same state; an initial search value still shows its hits.
- **Redraws on a big tree are coalesced and no longer freeze the page.** A
  checkbox, slider or search now shows a "Redrawing" card and redraws on the
  next frame, and every redraw requested in the same tick collapses into one.
  That matters more than it sounds: several controls redrew two, three or four
  times per click — the Visualizations toggle twice back to back, Auto-hide
  four times, nine others three times via the search hooks — and a slider
  drag redrew once per input event. On the 18,512-node tree a burst of twelve
  slider events plus a checkbox now returns in 3 ms and runs one redraw where
  it ran thirteen. Controls that read the fresh layout straight after
  redrawing (zoom-to-fit, the layout switches) are unchanged and synchronous.
  Small trees are untouched.
- **A big tree no longer looks frozen while it loads.** Above 2,000 nodes,
  `launch()` validates, builds the control panel, shows a "Drawing N nodes"
  card over the tree area and returns; the draw runs one frame later so the
  card actually paints. Every error still throws synchronously — only the
  draw is deferred — and the new `viewer.ready` promise resolves when it has
  run (at once for a small tree, which stays fully synchronous). On the
  18,512-node BV-BRC tree, `launch()` now returns in about 30 milliseconds
  instead of ~16 seconds — the label analysis, visualization candidates and
  control panel moved behind the card too — with the card on screen for the
  rest. The one thing the
  library cannot defer is your own parse of a big file: `archaeopteryx.busy()`
  shows the same card for that, yields a frame, runs your work, and removes
  it — open.html uses it, so a 38 MB file now shows "Reading … 37.9 MB" the
  instant you click, then "Drawing 18,512 nodes", then the tree.

- **Big trees draw about twice as fast.** Every node used to get nine SVG
  elements whether or not they would ever show anything. On a 18,512-node
  BV-BRC influenza tree that was 222,197 elements, **half of them inert** —
  74,052 of 74,064 `<text>` elements empty, 43,413 circles at radius zero — and
  every redraw walked them all. The optional per-node parts (the four text
  labels, the search halo, the support dot) are now created only when they will
  show something, and removed when they will not.

      SVG elements   222,197  ->  92,608   (-58%)
      first draw      29.6 s  ->  ~10-14 s
      a later redraw   ~4.8 s  ->   ~2.5 s

  Turning a branch-data label on now costs a little more, since those elements
  are built at that moment rather than up front — which is the trade: you pay
  for what you ask for instead of paying for everything on every tree.

  Three further redundancies went with it: branch geometry was computed twice
  per link on every redraw (once against pre-join data, then overwritten);
  collapsing the shape on internal nodes built a separate d3 selection and
  transition for each one, thousands per redraw, instead of one filtered
  selection; and the branch-length, confidence and branch-event label passes
  walked every node even when their checkbox was off.

### Fixed

- **Search A hits are easier to see in the dark theme.** Their blue was
  right on white and sank into a dark background; in the dark theme Search
  A now uses the same palette's sky blue, which keeps the hue and stays
  distinct from Search B's vermillion and the A-and-B yellow. The panel's
  reset button follows, with black or white text by luminance.

- **Properties in "Display Node Data" and in the hover tooltip are a proper
  section now.** They used to appear as upper-case, faint lines — the
  dialog's row detector took each `BVBRC:host_group: Cow` for a heading,
  because the ref's own namespace colon is exactly what a heading looks
  like. Both now show a PROPERTIES heading like TAXONOMY and SEQUENCE, with
  name/value rows named the way the Color-by menu and legends name them:
  "Host Group", not `BVBRC:host_group` or `Host_Group`. Units follow the
  value. "Sum of Subtree Tips" is now "Tips below" in both places. The
  desktop's `style:` properties — how a node is drawn, not what it is — are
  no longer listed.
- **Node data reads in one order, with no stray lines.** The tooltip and the
  dialog now share one builder. The node's own facts come first — Name,
  Distance to parent, Date, Distribution, Depth, Tips below — then its
  confidences, then the TAXONOMY / SEQUENCE / EVENTS / PROPERTIES sections,
  so nothing reads as a tail of the section above it. A date is one line
  with its range, unit and description folded in ("6.5 [5 - 8] mya
  (split)"); a dated node without a description used to get a second, empty
  "Date:" line, and a distribution without a description an empty
  "Distribution:" line. Both are gone.

- **A taxon identifier is never offered as a visualization.** On the H5N1
  tree "NCBI Taxon Id" ranked fourth in Color-by: 13,042 tips at 11320 plus
  55 one-off strain ids, which passed every statistical rule because the
  values repeat — yet a colour can carry nothing the species name beside it
  does not, and a legend of numeric ids tells the reader nothing. Refs whose
  local name ends in taxon id / tax id / taxonomy id, in any spelling, are
  excluded; the property still shows in the tooltip and node data.

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

### Demos

- **A genome-scale alignment: 150 sequences × 30,000 columns.** Synthetic,
  and says so — evolved along a random tree with clade-wide deletions, so
  related genomes are alike and gap blocks follow clades. It is the demo for
  the alignment track at length and for the navigation bar under it.

- **A Late Cretaceous time tree.** Thirteen well-known dinosaurs, Cenomanian
  to Maastrichtian, all inside one geologic Series — so it is the demo that
  shows the axis banding Series over Stage, which the wider Dinosaur and
  Ammonite trees never reach. Schematic, like its siblings.

- **A 13,246-tip demo tree.** Influenza A H5N1 segment 3 (PA) from BV-BRC,
  18,512 nodes with 16 properties, most of it the 2024–2025 North American
  outbreak in dairy cattle and birds. It is the tree the performance work was
  measured on, and it shows the working card, the deferred draw and the
  coalesced redraws in action. The demo page now parses a big file behind the
  card too, as open.html does.

### Also since 3.0.0

- `open.html`: visualize your own tree entirely in the browser, plus an Expert
  options panel exercising every launch config key.
- The floating toolbar card is draggable on `demo.html` and `open.html`.
- `parseTree` recognizes phyloXML by content, not just by filename extension.
- Removed the dormant "Submit Selected" button; node selection is pull-only.
