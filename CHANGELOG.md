# Changelog

All notable changes to Archaeopteryx.js. This file accumulates entries as work
lands on `master`; a release collects the `Unreleased` section into its GitHub
Release body. The published npm package and the live demo site are decoupled —
`docs/` is served from `master`, so demos update on every push, while npm
consumers only see a change when a version is cut.

## 3.4.1 — 2026-09-14

Collapsed clades made to fit the rest of the viewer — their shape, labels,
colours, search, selection, re-rooting and tree switching — plus a
Molecular Sequence search that finds sequences again and a node-data
download with a proper header.

### Changed

- **A collapsed clade's wedge** is drawn from its node to the clade's
  nearest tip along one edge and its farthest tip along the other, so the
  shape shows how uneven its branch lengths are, as iTOL draws it. 3.4.0
  drew the desktop's symmetric triangle on a base at the average tip
  distance instead. The label clears the farthest tip. The circular-layout
  fix from 3.4.0, which keeps the wedge on its node, stays.
- **Search dims the rest of the tree when every hit is inside collapsed
  clades.** Those clades stay bright, outlined and counting their hits;
  before, dimming stayed off until a hit was drawn as a tip.
- **A collapsed clade holding search hits** is one stop for the hit
  navigator, centred on its node, and one dot in the overview, in its
  wedge's colour. It used to be skipped by both.
- **Selecting tips inside a collapsed clade shows on its wedge**: an outline
  in the selection colour, a fill and a bold label when all its tips are
  selected, as for search hits.
- **Switching trees in a multi-tree file clears collapsing**, on the tree
  left and the tree opened: each tree opens with nothing collapsed.
- **Download Ext. Node Data writes a table with a header.** One row per tip,
  one column per field, named as the desktop's node-data export names them
  (`name`, `taxonomy_scientific_name`, …, `branch_length`, then each
  property ref), empty where a tip has no value; columns no tip fills are
  left out. It used to write each tip's values one after another with no
  header, so a column held different fields on different rows. The file is
  now `.tsv`, and it opens again as a metadata table.

### Fixed

- A collapsed clade's label lines up with the tip labels: on the label
  column in the aligned phylogram and on the outer ring in the circular
  layout, rotated or upright, with the same faint guide line or dashed
  connector the tips get. It used to sit just past its wedge in every
  display. A circular tree also scales to a collapsed clade's farthest tip,
  so a wedge holding the deepest tip no longer crosses the label ring.
- A collapsed clade holding search hits (or selected tips) is no longer
  dimmed while hits elsewhere in the tree are shown; it was faded along
  with every non-matching node, found outline and all.
- Midpoint re-rooting no longer turns a collapsed clade inside out. When the
  new root fell inside a collapsed clade, the clade went on hiding every
  other tip of the tree; re-rooting now opens any collapsed clade whose tips
  it changes, and every other clade stays collapsed. The node menu's Reroot
  follows the same rule.
- The Color-by and Shape legends recount when a clade is collapsed or
  opened; their counts used to keep the tips a collapsed clade hides.
- A collapsed clade whose tips carry a Color-by value found nowhere else on
  screen keeps that value's colour. Its wedge used to be filled in another
  value's colour: the Bcl-2 demo's "Fruit fly" clade, green before
  collapsing, turned the blue of "African clawed frog". The legend still
  lists only the values on screen.
- **Searching the Molecular Sequence field finds sequences again.** It
  compared each query against the sequence object instead of its residues,
  so it never matched a tree read from phyloXML or Nexus. Residues are
  searched as written, gap characters included, as on the desktop.

## 3.4.0 — 2026-09-13

The field-review release: the five things every other browser tree viewer
did and this one did not — metadata tables beside the tree, a scale bar,
collapsing clades, every tree of a multi-tree file, and views you can share
as a link — plus keyboard shortcuts, a root stub, and a round of
search-panel refinements.

### Added

- **Metadata tables.** A TSV, CSV or semicolon-separated table with a
  header row and the tip name in its first column is joined onto the tips
  as node properties (`forester.joinMetadataTable(tree, text)`), and from
  there nothing is special: its columns are offered under Color-by and
  Shape by the usual rules, are search fields (numeric when every filled
  cell is a number), show in the node data and are written into phyloXML
  exports. A column's ref is `meta:` plus its header with whitespace as `_`
  (a header already reading `ns:name` is kept); the datatype is inferred
  (`xsd:integer`, `xsd:double`, else `xsd:string`). Tip names match
  exactly, then case-insensitively; empty cells add nothing; the table wins
  over a property the tip already carries. Quoted cells, `#` comments and
  Windows line ends are fine. The join returns a report of columns,
  matched and unmatched tips and unmatched rows. The desktop Archaeopteryx
  writes the same convention. The open page takes a table the same three
  ways as a tree: drop, choose or paste, before or after the tree.
- **A scale bar for phylograms**: a round number of branch-length units
  (1, 2 or 5 × 10ᵏ, about 100 px, `forester.scaleBarLength`), drawn in tree
  coordinates so it zooms and exports with the tree. Bottom left in the
  rectangular layout, below the fan in circular and unrooted; none in a
  cladogram or under a time axis.
- **Collapsing a clade.** The node menu's **Collapse/Uncollapse** folds an
  internal node's clade into a triangle and opens it again, **Uncollapse
  Subtree** opens everything below a node, and a tool-row button (the
  desktop's glyph, lit only while something is collapsed) or **Esc** opens
  the whole tree — the desktop's controls, exactly. The triangle stands on
  a vertical base at the clade's average tip distance, grows gently with
  its tip count, and is filled in the colour most of its tips wear. Its
  label is the node's name; else the Color-by value nearly all its tips
  share ("Bovine · 12 tips"); else the tips' common name prefix; always
  with the tip count, and `[found/total]` while a search hits inside. A
  fully found clade takes the found colour. Display state only: exports
  carry every tip, and the unrooted layout shows every clade open.
- **Every tree of a multi-tree file.** A Nexus TREES block, a Newick file
  with one tree per `;` and a phyloXML with several phylogenies open on
  the first tree, with a previous / picker / next row at the top of the
  control panel; each tree opens fresh under the same config. New
  `archaeopteryx.parseTrees()` returns them all, `launch()` accepts the
  array, and the handle gains `getTreeCount()`, `getTreeIndex()` and
  `showTree(i)`. `forester.parseNewHampshireTrees()` and
  `forester.splitNewHampshire()` do the Newick half.
- **Shareable views.** The layout, display type, labels, colour and shape
  fields, both searches, the subtree, the collapsed clades, the sizes, the
  rotation and the tracks form a view. The demo pages keep it in the URL
  hash and follow every change, so the address bar is always a link to
  what is on screen (**Copy link to this view** in the toolbar). For
  embedders: the handle's `getViewState()` / `applyViewState()`,
  `archaeopteryx.encodeViewState()` / `decodeViewState()` for the hash
  form, and two config keys, `view` (open straight into one) and
  `onViewChange(state, encoded)`. Nodes are named by their launch-time
  preorder index; zoom, pan, the legend's position and the selection are
  not part of a view.
- **Keyboard shortcuts**, ⌘ on macOS and Ctrl on Windows and Linux: fit
  (0), zoom (+ / −, Shift+arrows for one axis), expand to fit the labels
  (Shift+E), next layout (Shift+L), next display type (Shift+D), time axis
  (Shift+X), ladderize (Shift+O), uncollapse all (Shift+U), the search box
  (F), next / previous hit (G / Shift+G), previous / next tree
  (Shift+< / >), and the list itself (/), which opens a cheat sheet also
  linked from the About box. The letters follow the desktop where it has
  the action. The plain keys are unchanged. The README has the table for
  both platforms.
- **A stub branch into the root** in the rectangular layouts, 12 px, for a
  rooted tree and for every subtree view; a root that has a branch length
  in the file draws it to scale in a phylogram.
- The **Auto-hide Labels** item is boxed in the accent colour while labels
  are actually being hidden, with a tooltip saying how many show, as on
  the desktop.

### Changed

- **Search suggestions** are an in-page list in the panel's theme instead
  of the browser's `<datalist>`: they filter the way the chosen mode
  matches, bold the matched part, show ten rows and how many more, move
  with the arrow keys, pick with Enter, and respect **Match case** (a
  joint rule with the desktop).
- The unrooted layout draws no root branch of any kind; the fan starts at
  the tree's own root.
- The domain-track width buttons work in the circular and unrooted
  layouts, which keep a width of their own starting at a fifth of the
  radius.
- `forester.parseNewHampshire` on a text holding several trees returns the
  **first**; it used to run the statements together and return the last.
- `forester.visualizationSummary` also accepts an array of tips.

### Fixed

- An invalid regex or number turns the search box red while typing, not
  only after the focus leaves it.
- A cladogram no longer spends a depth unit on the invisible level above
  the root, and a phylogram subtree view no longer opens with a root branch
  as long as the clade's distance from the original root.
- The root no longer wears a hollow circle in some views and not others.
- Up on a freshly opened suggestion list starts at the last row, not the
  second to last.

## 3.3.0 — 2026-09-12

Protein domain architectures, a visualization-selection system settled with
the desktop Java Archaeopteryx and pinned by shared fixtures, a repaired
overview, and a viewer that redraws very large trees in half the time.

### Added

- **Protein domain architectures.** A tree whose tips carry
  `<domain_architecture>` draws them beside the tips: a grey backbone per
  protein with a rounded box per domain that passes the E-value threshold,
  coloured by name from the Tableau palette, the name on the box when it
  fits, on one scale for the whole tree so lengths compare across tips. In
  the rectangular layout the tracks form one aligned column past the labels;
  in circular and unrooted they ride each tip's spoke. A **Domain
  Architectures** section in the control panel holds the track width (hold
  to repeat), the threshold as `10⁻³` with step buttons from `10⁻²⁰` to
  `10³`, a label mode (on domains / legend / none) and a glow. The legend
  card lists `NAME (count)` in the order the names appear down the tree,
  lives bottom-right, drags, and double-clicks home. Everything is plain
  rectangles and one gradient per colour, so SVG, PDF and PNG exports match
  the screen. Ported from the desktop's display to its own spec and drawn to
  the numbers it computed on `apaf.xml` — `test/domain_test.js` pins them,
  including the placement decided jointly: residue `r` covers
  `[(r−1)·f, r·f]`. Config keys `showDomainArchitectures` (on automatically
  when a tree carries any), `domainLabels`, `domainGlow`,
  `domainEvalueExponent`.
- **Domain architectures in the node-data dialog**, in position order along
  the protein.
- **Shared visualization-selection fixtures.** `test/fixtures/vis-contract.tsv`
  (182 property names) and `vis-trees.tsv` with its 21 small phyloXML trees
  (39 rows) are the acceptance test both programs run: every row agrees, and
  so do the opening colour and the full Color-by menu on 122 real trees.

### Changed

- **Which properties are offered under Color-by and Shape, and which one
  opens a tree.** The rules are now defined here and the desktop follows
  them exactly:
  - record-keeping properties are never offered — authors, sets, data-use
    terms, ids, accessions, identifiers and "restricted until" in every
    spelling describe the record, not the organism;
  - In-Group / Out-Group are offered but demoted, and never open a tree;
  - a sparse field (under two thirds of the tips) is ranked last, not refused;
  - a numeric field is never refused for being unique and ranks right after
    the clean categoricals; "numeric" is a pinned decimal grammar (hex,
    `Infinity`, `NaN` and `1,5` are words) and spellings of one number fold
    (`1` and `1.0` are one value);
  - `applies_to="clade"` counts as node data, so repseq trees colour at all;
  - a barely repeating categorical (over 20 values, mostly unique) is
    offered at the very bottom; an all-distinct one is still refused;
  - a value that folds to nothing (`_`) is no value at all;
  - **a subtree view never re-classifies**: the menus and the chosen
    colouring stand and only the legend re-describes what is on screen —
    entering a clade used to drop the colouring in 61% of the corpus's
    clades; after a deletion a chosen field stays as long as it still has a
    value anywhere; and **a tree opens with the first candidate that is not
    wide**, so a wide field no longer blocks the In-Group beneath it.
- The big-tree threshold, above which redraws coalesce behind a "Drawing N
  nodes" card, rises from 2,000 to 3,000 nodes: the viewer got faster (see
  below), so the card was announcing waits that no longer happen.
- Double-clicking the canvas no longer zooms it — a stray click that missed
  a node scaled everything, fonts included.
- The busy card no longer asks for the system's progress cursor.
- The Apaf-1 demo moves up in the gallery, describes its domain tracks and
  cites the paper it comes from.
- Depends on `phyloxml ^1.0.2` (the open-ended range admitted versions that
  cannot be required in Node); the re-vendored `phyloxml.js` no longer
  writes an `xsi:schemaLocation` hint, since phyloxml.org has lapsed.

### Fixed

- **The overview miniature.** It drew the previous layout, or nothing, with
  its "you are here" rectangle placed against stale geometry. It is built
  from the model now, with one labels-inclusive extent, drawn as a single
  path, and the rectangle has a minimum size so it stays visible when the
  view is a sliver of a 13,000-tip tree.
- A one-node Newick tree (`a;`) reads its name; it used to come in unnamed
  and be written back empty.
- Three demo trees (`confidences`, `influenza`, the synthetic genome
  alignment) are schema-valid phyloXML again and open on the desktop.
- `forester.isNumber` checks for a number; `destroyViewer` clears a pending
  redraw.

### Performance

- Redrawing the 18,512-node demo tree went from about 4.2 s to about 1.9 s:
  the link-insert reference is resolved once instead of 18,512 times (28×
  on that step), node mouse events are delegated to the tree group (five
  listeners instead of 92,560), a transition is built only when something
  animates, the optional node children are collected with one query, node
  circle attributes are set in one pass, and the overview is one path.

### Removed

- Twelve `forester` exports that nothing called, and the collapse data
  model (`_children`) they served — tombstoned in `REMOVED_CONFIG`;
  `branchesWithPositiveLength`.
- The search fields' two-letter codes (`NN`, `TS`, `GN` …), the alphabet of
  the 2.x `GN:name` search syntax that the field menu replaced in 3.0.0. A
  typed prefix is literal text; a field is chosen from the menu.

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
