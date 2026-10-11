# Changelog

All notable changes to Archaeopteryx.js. Entries accumulate under `Unreleased`
as work lands on `master`; a release turns that section into its GitHub Release
body. The demo site (`docs/`, served from `master`) updates on every push; npm
users see a change only when a version is cut.

## Unreleased

### Fixed
- **A host page's stylesheet no longer restyles the viewer.** The viewer is
  drawn inside somebody else's page, and a rule of that page's won wherever
  the viewer's own stylesheet said nothing. On the BV-BRC website,
  `.Phylogeny svg { background: #FFFFFF }`, written when the tree was the only
  svg in that box, put a white square behind every icon of the control panel:
  over the two selected ones in the light theme (a white icon on white), over
  all of them in the dark theme; and `body.patric :focus { outline: 0 }` took
  the keyboard focus ring off every button. Measured on other pages after
  that: a page set in capitals, centred or in a serif face set the dialogs,
  the menus and the tooltip that way; under `* { box-sizing: border-box }`,
  which most pages have, the tooltip was 22 px narrower and every dialog 2 px;
  Bootstrap 3 made the panel's labels bold and clipped them; `svg { fill:
  currentColor }` turned three icons into blots; and a page whose only svgs
  were icons, with `svg { width: 24px; height: 24px }`, drew the tree 24 px
  square. The viewer's stylesheet now opens by saying what it left unsaid:
  everything the viewer puts on a page (panel, dialogs, menus, tooltip,
  "working" card, alignment bar) starts from the browser's own defaults,
  whatever the page says with element names alone and whichever stylesheet
  comes first; what a page hands down by inheritance stops there; the icons
  state their paint, and a rule for a bare `svg` inside a container of the
  page's no longer reaches them; the tree's svg states its size and its font
  inline; and the browser's focus ring is given back to every control that
  does not draw its own. In a page that says nothing, nothing changes: every
  state compared is pixel for pixel what 3.27.0 drew, with the one exception
  below. **Still not possible from inside the host's document:** a rule that
  names a class of the page's and an element (`.content button { ... }`)
  still reaches the viewer's buttons, labels and fields where the viewer does
  not state the same property itself (for a shape of the tree it takes two
  classes); where a shape is and how large is still in its attributes, so
  `rect { width: 100% }` still resizes the viewer's rectangles; and nothing
  outranks a rule scoped by an `id` or marked `!important`. See "The host
  page's stylesheet" in the README.
- **A page's rules for bare shapes no longer repaint the tree.** A chart's
  stylesheet written for a page with one chart on it, as the d3 examples have
  theirs (`path { fill: none; stroke: #000 }`, `circle { fill: steelblue }`,
  `text { font: 10px sans-serif; text-anchor: middle }`), repainted the
  viewer's branches, labels, legends and tracks: under such rules 89 of the
  197 elements of a small tree changed their paint. An svg *attribute* gives
  way to any rule of the page, and that is how the drawing code stated a
  shape's fill, stroke, opacity and a label's alignment in 173 places. They
  are inline styles now, and the viewer's stylesheet says of every shape of
  its svgs, for those properties, "as a page that says nothing has it": what
  a shape does not state it has from its parent, not from the page, whether
  the page's rule is for a bare `rect`, for `rect:hover`, or for `.chart
  rect`. A page-wide `* { transition: all .3s }` no longer makes the tree
  ease behind its own redraws. The same holds for the panel's icons, the
  About box's logo and the clock plot. On screen nothing
  changes (123 states of the 26 demo trees compared pixel for pixel: the
  rectangular, circular and unrooted layouts, every display option on, both
  themes, every dialog, a search, a selection, a collapsed clade); the PNG
  and PDF exports are the same files as before (32 of them compared). Drawing
  takes as long as it did in four of six cases measured; a heat map of 1,100
  cells takes 37 ms where it took 32, and an alignment of 18,000 shapes 247
  ms where it took 234.
- **A branch whose file gives it a width or a colour that is none** (phyloXML
  `<width>-1</width>`) is drawn as the tree's default, as it was: an inline
  style ignores such a value where an attribute fell back, and the paths that
  draw the branches are kept from one drawing to the next.
- **The alignment strip's ruler numbers and caption, and the heat map
  strip's scale numbers and caption, were drawn in the host page's font**, in
  boxes measured for the viewer's own: in a page with a serif default they
  came out in Times, the alignment caption's box too wide for it; and in an
  exported file they were drawn in whatever font the program opening it
  chose. The tree's svg states the tree's font now, in the page and in the
  file. (A full-size export of an alignment tree can be a pixel wider or
  narrower for it.)

### Changed
- The tree's svg carries the class `aptx-tree`, so that a page can style it
  without also reaching the panel's icons (`.my-page svg.aptx-tree { ... }`),
  and it is `box-sizing: border-box`: a border given to it fits inside its
  size. Exported files do not carry the class.
- **A page can no longer restyle a shape's colours and strokes by CSS.**
  Through 3.27.0 a rule such as `#tree path { stroke-width: 2px }` or
  `.my-page svg path { stroke: #333 }` did, because that paint was an
  attribute. It is an inline style now, which gives way to nothing but
  `!important`. Colours, widths and fonts are set through the configuration
  and the control panel; a page rule that must override them says
  `!important`. (The tree's svg itself can still be given a border or a
  shadow, and the panel and dialogs restyled, by naming their classes.)
- **An exported SVG file states all of its shapes' paint as attributes**
  (`fill="..."`, `stroke="..."`, `stroke-opacity="..."`, `text-anchor="..."`).
  Through 3.27.0 the file was a mix: more than half of its fill colours, and
  most opacities, were in `style` attributes, the rest in attributes of their
  own. On the page all of it is a style now (above); a file has no page to
  hold its ground against, and not every program reads a style as well as it
  reads an attribute, so the copy that becomes a file is written the plainest
  way. Fonts and `paint-order` stay in `style`, as they were, and a colour
  that was written `#909090` may now read `rgb(144, 144, 144)`. Sixteen
  exported trees were drawn with Inkscape, LibreOffice, librsvg and Quick
  Look from the files as they were and as they are: pixel for pixel the same.
  MuPDF, which reads an opacity from an attribute and not from a style, draws
  thirteen of the sixteen nearer to what the others draw. The file's svg also
  states the tree's `font-family`.

### Tests
- `test/browser/host_css.html`, eight cases: the viewer launched under the
  BV-BRC website's stylesheet (light and dark), Bootstrap 3, Bootstrap 5,
  Tailwind's reset and a sheet of single rules of kinds found on real pages,
  each added after the viewer's own (where it wins every tie), and compared
  with a launch in a clean page in thirteen states (the panel and the tree,
  two controls holding the focus, six dialogs, the colour picker, a menu, the
  search suggestions, the tooltip); and, for what only they put on a page, a
  dated tree (the clock plot) and a tree with an alignment (the alignment
  bar). Any difference in what an element computes to, or in where it sits,
  fails. The stylesheets are saved copies in `test/data/host_css/`. Not
  measured: the "working" card, which is on the page only while a large tree
  is drawn.
- `test/visualization_test.js` holds the drawing code to it: no shape's paint
  is set as an attribute (an attribute for one of those properties no longer
  paints anything, in any page). `host_css.html` asks the same of the page:
  with the stylesheet's "as a page that says nothing has it" rules taken out
  of a clean page, nothing may change; and under rules for every kind of
  shape, at the weight of `rect:hover`, setting every property the viewer
  takes charge of, nothing of the tree, the icons, the logo or the clock plot
  may either.
- `test/browser/branch_paint.html`: a branch's paint is a style, and a path
  kept between drawings wears nothing of the batch it drew before.
- `test/browser/exports.html` asks of the SVG file what `host_css.html` asks
  of the page, the other way round: no shape of the file states its paint in
  a style, each states as an attribute exactly what the window's shape states
  as a style (every shape of the svg, one for one), a gradient is named as an
  attribute names it, and the window is left as it was.
- The browser runner pins the page's colour scheme to light. It was the
  machine's, and a machine that changes its appearance at sunset ran the same
  case light in the afternoon and dark in the evening.

## 3.27.0 — 2026-10-09

### Added
- **Diagnostics: `archaeopteryx.doctor()`, and a dot on the program name when
  something is wrong.** The viewer checks its dependencies when they are used,
  never at load, so it runs half-equipped without a word: on a site it had no
  PDF or PNG export, a retired config key and an overruled
  `initialVisualization` for weeks, each said only in the console.
  `archaeopteryx.doctor()` returns the state of the program on the page: the
  seven libraries (with a version where the library states one), which
  functions that switches off and why, what the last `launch()` warned about,
  the config keys it was given, and all of it as plain text. It works before a
  launch, after one that threw, and in Node, and never throws. The About box
  has a **Diagnostics** row that opens the same report, with **Copy report**.
  While the report holds a *problem* — half of the jspdf / svg2pdf.js pair, a
  library under its 2.x-era global, a d3 that is not 7, `forester.js` from
  another release, a phyloxml older than 1.1.7 (one that drops something when
  saving, or writes a node's style as the earlier releases did), or any
  warning about the config — a small neutral dot follows the program name in
  the panel header. An optional library that is simply not loaded is stated
  ("PDF export: off"), never flagged; an export the browser refused and a
  phyloxml that merely lays its file out differently are notes. The warnings
  belong to the tree on view. README "Diagnostics"; typed in
  `archaeopteryx.d.ts` (`DoctorReport`).
- **`forester.VERSION`**: forester.js now states its release, so a page that
  pairs it with an `archaeopteryx.js` from another one can be told.

### Changed
- Warnings and errors are printed exactly as before (same console method, same
  words) and are now also kept for the diagnostics report.

## 3.26.0 — 2026-10-08

Two answers to BV-BRC users: the scale bar prints the tree's unit and can be
hidden with a "Scale" switch, and a file's own colours no longer mix with an
active Color visualization -- the desktop's precedence, for every node.

### Added
- **Scale switch.** Display Data > Options gains "Scale", the desktop's name for
  the same switch, on by default (the desktop's is off), so the bar at the
  bottom left of a phylogram can be hidden (config
  `showScaleBar`, view key `scaleBar`). It is disabled where there is nothing to
  switch: in a cladogram, and while the scale axis has taken the bar's place.
  A BV-BRC user asked (2026-10-08).

### Fixed
- **A file's style colours no longer mix with an active Color visualization.**
  A node without a value for the chosen field took the file's `style:` colour
  on its dot and outline, so a tree whose tips all carry a `style:font_color`
  (BV-BRC's, coloured by genus by its pipeline) showed two palettes under
  Color by Host, and the legend described neither. Now, as on the desktop, the
  style colours are not consulted for any node while a Color visualization is
  active, on the label, the dot, its outline, the hover glow and the clock
  plot's points: a node without a value draws no dot and takes the default
  label colour. Clearing the Color menu brings the file's colours back;
  shapes, font styles and branch colours are unaffected.

### Changed
- **The scale bar prints the tree's unit.** After its number, the unit the
  file states (`branch_length_unit`, e.g. `0.05 subs/site`), as the distance
  axis already did at its end; nothing when the file states none, so a tree
  that does not say what its lengths measure gets no guess.

## 3.25.0 — 2026-10-08

The first days of testing on BV-BRC: the colour picker placed where any page
can show it, a classic-script canvg build so a bundled page can export PNG,
a console warning when an embedder forces a visualization the viewer would
not have chosen, the retirement of `nodeLabels`, and the README's list of the
forester functions 3.0.0 removed.

### Added
- **A classic-script build of canvg, `docs/lib/canvg.global.js`.** canvg 4
  publishes ES modules only, so a page had to bridge it with a module script
  of its own before the viewer offered PNG export and Copy PNG, and a site that
  concatenates its scripts into one classic bundle could not carry it at all:
  BV-BRC's 3.x page offered neither. The new file is the module build wrapped
  for a plain `<script src>` or a bundle; it defines `window.Canvg` itself.
  The demo pages load it instead of a module bridge, and so does the exports
  harness, which saves and decodes a PNG through it. Generated by
  `test/make_canvg_global.js` (which refuses a module it cannot wrap and
  parses its output as a classic script), pinned byte for byte by a unit
  test. Load it before `launch()`: the Copy PNG button and the PNG-scale row
  are built with the panel.

### Changed
- **A forced `initialVisualization` is still honoured, but no longer in silence.**
  When the name is a field the automatic choice would not have opened with --
  more than 20 distinct values, or a value on fewer than two thirds of the tips
  -- the console warns and names the field the viewer would have chosen, with
  its value count. On BV-BRC a site-wide `Host` coloured family trees by 39 to
  168 hosts while Genus sat in the file, and nothing said so. A clean field
  that merely ranks below the automatic pick warns nothing.
- **README: the twelve `forester` exports removed in 3.0.0 are listed in the
  migration section with what to use instead.** The one an embedding is likely
  to have called is `collectPropertyRefs` (BV-BRC's 2.x pages built their label
  checkboxes from it); on 3.x the call throws inside the page's own parse step.

### Deprecated
- **`nodeLabels` is retired: accepted with a console warning, no effect; removed
  in a later release.** The custom label checkboxes it declared, a fixed list
  of metadata fields with one panel checkbox each, predate the Metadata
  checkbox and its "Metadata fields…" chooser, which offer exactly the fields
  the tree carries. On BV-BRC the list, written for influenza, put eight
  checkboxes on every virus tree, six of them for fields the tree did not
  have. `labelProperties` sets the starting fields where the automatic choice
  is not wanted. A view hash that still carries a `custom:<key>` flag is read
  without complaint and the flag ignored.

### Fixed
- **The colour picker opens beside the legend on any page.** A click on a
  legend swatch opens a modeless dialog, and a dialog appended to the page
  body sits at the end of the document until it is moved; the picker moved
  itself only when that spot overlapped the legend card. On the demo page the
  end of the body is the top of the window, so it looked placed; in a page
  that flows, such as BV-BRC's, it opened below everything, off the bottom of
  the window. It is now placed outright on opening, viewport-fixed, beside the
  card and inside the window, and moves afterwards only when the card grows
  under it.

## 3.24.0 — 2026-10-07

The clock plot's second kind of tree: the root-to-tip plot of a divergence
tree whose tips are dated, by the file or by their names, run before dating;
and the node popup no longer carries its 2.x class name, which let a host
page's old stylesheet restyle it.

### Added
- **Clock plot on a divergence tree with dated tips** — the root-to-tip plot
  of TempEst, run *before* dating. A tree whose branch lengths are its
  divergence and whose tips alone carry a date (a phyloXML `<date>`, a
  `num_date` annotation) is now offered the **Clock plot**: a tip's
  divergence is the sum of the branch lengths from the root, the plot has
  tips only (**Internal nodes** is not offered), **Root date, in the tree**
  says `none`, since the tree states no root date, and **Rate** is in the
  tree's own branch length unit, where it states one. Every tip must be dated
  — by the file, or by the date in its **name**, read as TempEst reads it:
  the rightmost date in the label, a year alone taken as mid-year — and
  every branch must state a length. The swine H1 demo (`?tree=swh1`), whose
  strain names carry their years, has the plot. `forester.clockPlotKind`
  answers `'root-to-tip'` for such a tree; `forester.clockPlotData` gains
  `divUnit` (the divergence's unit, or `null`), `calendar`, `fromNames` and
  `ambiguousNames`, and its `root.date` is `null` there.

### Changed
- **The node popup no longer carries the 2.x class name `node_mouseover_tooltip`.**
  A host page's old stylesheet could restyle the 3.x popup through it, since
  `div.node_mouseover_tooltip` outranks `.aptx-tip`: BV-BRC's page CSS,
  written for 2.x, centred every value of the popup and painted it grey. Rules
  written against that class no longer reach the popup; the viewer's own
  `.aptx-tip` styles are what a host page sees unless it targets them itself.
- Development dependencies: `brace-expansion` 1.1.21 (Dependabot alert 44;
  the published package carries none of it).

## 3.23.0 — 2026-10-02

The clock plot: on a tree that states both time and divergence, a panel
plots each tip's date against its divergence from the root with a regression
line through the tips, linked to the tree in both directions. The plot is
new; its design may still change as people use it.

### Added
- **Clock plot.** On a tree offered **Time | Div**, a **Clock plot** button
  beside the switch opens a panel plotting each tip's date against its
  divergence from the root (the internal nodes too, when **Internal nodes**
  is ticked), with a least-squares line through the tips. Under the plot:
  the **rate** (the slope, substitutions per site per year), the root date
  the line gives over the one the tree states, R² and the number of tips.
  The line is fitted to the tips only and is not forced through the root.
- **The panel is linked to the tree.** It is modeless and can be dragged by
  its title. A point wears its node's colour; pointing at a point lights its
  node, and pointing at a node rings its point; a click selects the node, a
  dragged box selects the tips in it; in a subtree view the plot and the
  line are the clade's own. Tips drawn on one spot (one date, one
  divergence) are one dot that answers for all of them: named, lit and
  selected together.
- **Where it is offered.** Where the line can be drawn: three tips or more,
  not all on one date. On a BEAST clock-model tree the panel says that the
  divergence is the model's (time × rate).
- `forester.clockPlotKind`, `forester.clockPlotData`,
  `forester.clockRegression`, `forester.calendarTickMonths`.

### Fixed
- **An open modeless dialog follows the light/dark switch.** The control-panel
  cheat sheet (and now the clock plot) kept the theme it was opened in.
- **README: a selection does announce itself.** "Node selection" said no
  event exists; `selected_nodes_changed_event` is dispatched on `document`
  at every change, and always was from the node menu.

## 3.22.0 — 2026-10-02

Genome regions: a tree whose tips are genomes draws each genome's genes as
arrows beside its tip, the rows lined up on one gene family so gene order
compares down the tree. The track is new and has so far been drawn on
synthetic data only; its defaults — the automatic anchor above all — may
change as people who work with genome displays report on it.

### Added
- **Genome regions: a gene track beside the tips.** A tree whose tips are
  genomes can carry (part of) each genome as phyloXML `<sequence>` elements,
  one per gene with a `<location>` (`contig:start-end(+)`) and its family in
  an `<annotation ref="pgfam:…">`, plus a `<sequence type="dna">` record per
  contig — nothing the schema has not got. The viewer draws an arrow per gene
  on a backbone per genome, pointing by strand, coloured by family (grey when
  unique to one genome), the rows **anchored** on one family so gene order
  compares across genomes, a mirrored row for a genome carrying the anchor on
  the other strand, two lanes for overlapping genes, a bar at a contig end, a
  kb bar under the rows. The **Genes** checkbox under Display Data and the
  **Genome regions** section (track width, Anchor, Family, Labels); hovering
  an arrow reads the gene out, clicking opens its BV-BRC or NCBI page; a
  families legend; the circular and unrooted layouts; the view link; config
  `showGenes`, `geneAnchor`, `geneFamily`, `geneLabels`. The node-data dialog
  lists a sequence's annotations and the tree statistics count the regions.
  A synthetic demo (twelve genomes, one row per rule). On such a tree the tips
  are labelled by node name, not by their first sequence.
- The TypeScript declarations now list the domain track's config keys
  (`showDomainArchitectures`, `domainLabels`, `domainGlow`,
  `domainEvalueExponent`), which they had left out.

## 3.21.0 — 2026-10-01

"Properties" is "Metadata" wherever a user sees it, in step with the desktop
Archaeopteryx, and the Metadata fields chooser works as its cursor promised.

### Changed
- **"Properties" is now "Metadata"** wherever a user sees it — the Labels
  checkbox, the **Metadata fields…** chooser, the node-data and
  tree-statistics headings, the download and Color-by tooltips, the README.
  "Properties" is phyloXML's word; "metadata" is what the tools these fields
  come from call them. Config, view and figure keys are unchanged
  (`showProperties`, `labelProperties`, `properties`, `labelprops`). The
  desktop Archaeopteryx renames at the same time.

### Fixed
- **The Metadata fields… chooser's rows showed a grab cursor but could not be
  dragged**; they drag now, as the heat map's Reorder columns rows do (one
  shared drag). **All** closed the dialog at once; it now ticks every field
  and stays open, and **None** unticks them.

## 3.20.0 — 2026-09-30

One phyloXML file can now carry a whole figure: the desktop Archaeopteryx's
figure setting opens the heat map and chooses the labels, and node properties
(a species, a host) can be shown in the labels at all. Heat-map cells get
borders. And saved phyloXML loses nothing it read and is laid out byte for byte
as the desktop's (phyloxml 1.1.3 to 1.1.7).

### Added
- **A phyloXML file can open straight into its heat map.** The desktop
  Archaeopteryx's figure setting — `<property ref="aptx:figure"
  applies_to="phylogeny">` directly under `<phylogeny>` — is read: its
  `MATRIX` columns open as the heat map, only those, in the file's order. So a
  pipeline can write one file that opens as tree plus matrix. An `aptx:figure`
  on a clade (where desktops 0.11.117 to 0.11.172 wrote it) is ignored and not
  saved; the phylogeny's own is saved back unchanged. Config settings win.
- **Node properties in the label**, as on the desktop: **Properties** under
  Display Data adds the nodes' property values (a species, a host…) to their
  labels, values only, joined by ` | ` (values often contain commas
  themselves); **Label fields…** chooses which, and in what order. Off by
  default; with nothing chosen, every property but the heat
  map's columns. A file's figure setting can choose for itself — `labelprops`,
  `show.SHOW_PROPERTIES`, `show.SHOW_NODE_NAMES` — so a BV-BRC tree named by
  accession can open labelled by species. Config `showProperties`,
  `labelProperties`; shared view `properties`, `labelFields`.
- **Heat-map cells have borders**: where a cell is at least 5 px on screen,
  each is outlined in its own hue, darker, 0.75 px at any zoom, so a block
  still reads as a block and each cell can be counted. Smaller cells, or a
  matrix of more than 60,000, stay merged into runs.

### Fixed
- **Faint lines came and went between heat-map cells with the zoom** — seams
  of background between cells at a fractional scale. Borders cover them, and
  merged runs are stroked in their own colour.
- **A heat-map column with one value on every tip was left out** — a
  single-copy core gene (1 in every genome) had no column. Colour-by still
  has nothing to show in such a field; the matrix now keeps it.
- **Saving as phyloXML dropped the properties of `<phylogeny>`** (the figure
  setting among them). phyloxml 1.1.3 writes them back after the clades, as
  the desktop does.
- **Saving as phyloXML dropped protein domain architectures** — and sequence
  annotations, cross-references and URIs, taxonomy URIs, distributions,
  references, and the phylogeny's id and confidence. phyloxml 1.1.5 writes
  every element it reads, as the desktop writes it.
- **Saved phyloXML is laid out as the desktop lays it out** (phyloxml 1.1.4):
  two spaces per level from `<phylogeny>` at the margin, and no newline after
  `</phyloxml>`. With 1.1.7, which writes a node's style as the desktop does
  (its colours lower-case `#rrggbb`, its properties after the clade's others in
  the desktop's order), all 22 demo files save byte for byte as the desktop's
  0.11.173 saves them, numbers aside.

## 3.19.0 — 2026-09-30

The desktop Archaeopteryx's Scale Axis and Scale Grid, on every phylogram,
as one switch pair with the time axis; and a shared view that remembers
whether the tree was shown in Time or Div.

### Added
- **Scale Axis and Scale Grid, on every phylogram** — the desktop's Scale
  Axis and Scale Grid Lines. The time axis's two checkboxes are now one pair
  for any tree with branch lengths: on a time tree they draw the time axis as
  before; on any other phylogram — or a time tree flipped to **Div** — a
  labelled distance ruler from 0 at the root to the deepest tip, in the tree's
  units, with its unit at the end, and grid lines at its ticks. Rectangular
  and circular (the ruler in the gap, the grid as rings); none in unrooted or
  a cladogram. Off by default unless the tree opens shown in time. The scale
  bar gives way while the axis is on.
- **A shared view carries the Time | Div choice** (`scale=time` or
  `scale=divergence` in the hash, and in `getViewState` / `applyViewState`),
  on a tree that has both layouts. A link to a tree shown in Div opened in
  Time.

### Changed
- **Config: `showTimeAxis` is now `showScaleAxis`, `timeAxisGrid` is now
  `showScaleGrid`**; the old names still work, with a console warning. In a
  shared view, `scaleAxis` / `scaleGrid` replace `timeAxis` / `timeGrid`,
  which older links still carry and are still read.

### Fixed
- **The time axis drew a second, faint line above its ruler** (the strip's
  top edge), and its numbers in the browser's serif font; both gone, on the
  new distance axis too.

## 3.18.0 — 2026-09-30

Time trees: the time axis in the circular layout, and the Time | Div switch
made one rule with the desktop Archaeopteryx — when it is offered, what Time
gives back, a span that runs backwards, a node deleted meanwhile, and what a
saved file says its lengths measure. Saved phyloXML is now byte for byte what
the desktop writes.

### Added
- **The time axis in the circular layout.** Node-age bars run along each
  node's spoke, and on through the centre where a range reaches back past
  the root's own age (as on the desktop); the ruler runs out from the root
  along the gap between the last tip and the first, turning with the tree;
  **Time Grid** draws rings; a geologic axis lays its intervals down as
  coloured rings.
- **Time | Div on BEAST clock-model trees.** Their branch lengths are time and
  each branch states its clock `rate`, so divergence is length × rate
  (substitutions per site), whether the node ages were placed in calendar
  time or are still heights. Switching back to Time restores the lengths the
  file stated, exactly. A rate is a plain decimal number: `0.01abc` is not one.

### Changed
The rules of the Time | Div switch, now shared with the desktop.
- **Offered whenever both layouts can state every branch and each has some
  depth.** Every node dated, every branch stating a length, and every node
  recording its divergence or every branch stating a rate. A stated zero or
  negative value is stated; where a value is missing the switch is not
  offered, rather than a branch drawn at length 0. A tree whose divergence is
  0 everywhere, or whose tips all carry the root's date, is not offered it.
- **No longer asked: whether the two pictures differ** (the 2% test). A
  strict-clock tree is offered the switch.
- **A tree with neither a recorded divergence nor clock rates is never
  offered the switch**; its branch lengths used to be taken for its
  divergence. None of 784 trees tested was offered it that way.
- **Back in Time a tree has the lengths it arrived with**, not lengths worked
  out again from its dates.
- **A time span that runs backwards keeps its sign.** A child dated before its
  parent is negative in Time (it was clamped to 0), in a Nextstrain build as it
  opens and after the switch; 42 branches in 4 of 11 real builds. It is drawn
  at length 0, as before, so no picture moves.
- **A Nextstrain build opens in the metric it states completely**: time when
  every node has a date, else divergence when every node records one, else
  as before.
- `forester.applyTimeBranchLengths` and `forester.applyDivergenceBranchLengths`
  answer `true` or `false`, and leave the tree as it was when their layout
  cannot state every branch. The time layout follows the direction the
  tree's dates run, so a tree dated in ages is laid out too.
- **A recorded divergence (`nextstrain:div`) is a plain decimal number**, as
  a clock rate is: `0.005d`, `0x10` and `1,5` are not one. A negative one is a
  value, and its branch draws at 0.
- **Saved phyloXML, byte for byte as the desktop writes it** (phyloxml 1.1.2):
  the attributes of `<phylogeny>` in the order `rooted`, `branch_length_unit`,
  `type`, `rerootable`, and a date without a unit written `<date>`, not
  `<date unit="">`. Nine files written by the two programs for three trees
  are now identical.
- Depends on `phyloxml ^1.1.2`.
- **The tree states what its branch lengths measure** (phyloXML's
  `branch_length_unit`): `subs/site` in Div; in Time the unit of its dates, or
  `time`. A Nextstrain build states `year`, or `subs/site` when it opens in
  divergence. Saved phyloXML carries it. As the desktop writes it.
- In the circular layout a node-age bar under a pixel long is drawn one pixel
  from its inner end outward, as in the rectangular layout and on the desktop
  (it was centred).
- The panel's **Zoom** section is **View & Tools**: it holds the zoom row and
  the tool row (ladderize, whole tree, up one level, uncollapse all, re-root,
  representative tips), and its name said only half.
- The Time and Div buttons say what they do.

### Fixed
- **Div and back is lossless on time trees that state negative lengths.** On
  Nextstrain `*_timetree.nexus` files the stated negative lengths came back as
  0 (37, 29, 7 and 3 of them on four real files).
- **A node deleted while the tree has two layouts.** The branch that takes
  the place of the removed node's now spans, in time, what both spanned, so
  every node that is left stays on its own date after switching to Div and
  back; it came back short by the removed node's length. Its divergence is
  the sum over its pieces, each at the rate its node stated (with the
  desktop). Deleting the one tip without a clock rate now makes the switch
  appear. Two branches of length 0 merge into one of length 0, not into a
  missing length, and a negative span keeps its sign through a merge.
- **A Nextstrain build that opens in divergence** (a node without a date,
  divergence on every node) no longer draws the calendar time axis over its
  substitution-scaled branches.
- **A subtree saved as phyloXML** carries the tree's own attributes, its
  `branch_length_unit` among them, so a part saved from Div opens again
  showing divergence.
- Pressing the switch inside a subtree view measures the clade on view, not
  the whole tree.
- **A BEAST clock-model tree saved from the Div view opens again showing
  divergence.** It came back labelled Time, its divergence taken for its time,
  and Div then drew rate × divergence. It is known by the unit it states.
- A node missing its recorded divergence (`nextstrain:div`) no longer borrows
  a number measured in years: a tree that records divergence states it that
  way and no other.

## 3.17.0 — 2026-09-28

Downloads, rebuilt: full-size graphics, a menu that says what each file keeps,
a TSV of every tip, Copy Newick and Copy PNG. Support dots and branch values
no longer float off their branch inside a subtree.

### Added
- **Full-size graphics.** The Download section's *Graphics* choice is **As
  shown** (the window) or **Full size** (the default): the whole tree,
  re-laid-out off-screen large enough that no tip name is hidden, cropped to
  the drawing, with every legend stacked beside the tree. The window is left
  as it was. Unrooted fans grow only while that still frees names.
- **A Download menu that says what each format keeps**, grouped as Graphics,
  Tree and Tip data (replacing the native select). The Nexus entry says in
  advance whether the alignment fits in the file, and why not when it doesn't.
- **PNG at 2× / 4× / 8×** (default 4×). A PNG larger than the browser can
  paint comes out at the largest scale it can, with a warning, instead of blank.
- **An editable file name**; each format adds its extension, and a typed one
  is not doubled.
- **Copy Newick** and **Copy PNG** (paste straight into Word or PowerPoint).
- **TSV of every tip**: the node menu's *Download Ext. Node Data* for the
  whole tree.
- **Subtree downloads say so** ("Tree: subtree, 19 of 50 tips"), and phyloXML
  and Nexus files keep the tree's name, marked "(subtree)". Whole-tree files
  are unchanged byte for byte.

### Changed
- **`pngExportScale` is narrowed to 2, 4 or 8**: any other value snaps to the
  nearest, with a console warning.
- Download is a section of its own, folded by default.
- A full-size PDF past the 200-inch page limit is scaled onto the largest page
  (jsPDF would silently cut it off).
- SVG files are typed `image/svg+xml`.

### Fixed
- **Support dots, confidence and branch-length values floated off their
  branch in a subtree**, worse in a subtree of a subtree (rectangular and
  circular). They are now placed from the branch actually drawn.
- The Download button's label ran into its right edge.

## 3.16.0 — 2026-09-28

Crowded radial trees become readable, and the panel gains a cheat sheet.

### Added
- **The circular layout hides tip labels that would overprint**, instead of
  the rectangular every-k-th rule; the **unrooted layout** now hides them too
  (it never did). Found tips are always drawn. As on the desktop.
- **A control-panel cheat sheet** (card button in the panel header): every
  control the panel shows, with its glyph and its tooltip. Modeless, beside
  the panel.
- **Browser tests in the repository, run in CI** (`npm run test:browser`).
- `forester.orientedOccupancy`: first-come space-keeping for rotated boxes.

### Changed
- Every panel control carries a description; menus and the title carry
  accessible names.
- Each radial layout greys out the display type it cannot show: circular
  greys the unaligned phylogram, unrooted the aligned one.
- `forester.labelOccupancy` gained `occupy` (record a box unconditionally).

### Fixed
- **Branch numbers no longer print through tip or clade names**: names reserve
  their space first, and a number in the way is the one left out.
- No domain architecture for a tip whose name the crowding rule hid.
- The Auto-hide Labels toggle lights up in the unrooted layout too.
- The panel header no longer overflows its edge.
- A rotated name reserves a run of short boxes, not one oversized box.

## 3.15.0 — 2026-09-25

### Added
- **Hover a protein domain** for its name, E-value, span and tip; **click** it
  for the Pfam entry (or an InterPro search when there is no accession).
- `forester.domainReference`, `forester.domainEvalueText`.

### Changed
- **Auto-hide Labels thins crowded branch data** — support values, branch
  lengths and support symbols — in all three layouts, root first, so the same
  tree drops the same marks. A joint rule with the desktop.
- A branch event no longer prints through a branch length.
- Auto-hide Labels is no longer greyed out in the unrooted view.
- New `forester.rotatedLabelBox`, `forester.labelOccupancy`,
  `forester.preorderOf`; standing checks tie the sequence logo to the
  conservation bar.

## 3.14.0 — 2026-09-23

### Added
- **Tree properties** (ⓘ button, ⌘I / Ctrl+I): what the tree is, its
  structure, branch-length and per-kind support spreads (n, min, median, max,
  mean), what it carries as "n of m tips" (including every property `ref`),
  and its dates. Follows re-roots, tree switches and subtrees.
- `forester.treeStatistics`, `forester.describeValues`.

### Fixed
- The tree-properties button showed the theme glyph.
- Dialogs get the frosted-glass blur, so text no longer sits straight on the tree.

## 3.13.0 — 2026-09-23

The Nexus contract with the desktop, byte for byte.

### Added
- **Molecular sequences travel in Nexus both ways**, byte-identical with the
  desktop: `DataType` from the residues, a row per taxon (`?` for a tip
  without a sequence), and a bracketed comment instead of a matrix when the
  sequences are of unequal length.
- Standing round-trip tests: phyloXML → Nexus → phyloXML and back.

### Changed
- **One label chain for Newick and Nexus**: name, taxonomy, sequence
  name/symbol/gene, accession, then `node<N>`. **Unlabelled tips are now
  written `node1`, `node2`, …**, as on the desktop.
- Newick and Nexus downloads carry support by default (now pinned by a test).
- `forester.toNexus` no longer mutates its tree.
- **Nexus residues are normalised the desktop's way**: upper case, `.` as a
  gap, unknown symbols as `X` (protein) or `N` (nucleotide).
- Search B is always shown; the section fold is the only hiding.

### Fixed
- Two tips sharing a label no longer get merged sequences in a Nexus file.
- The sequence-type guess tests F, P and V too; `DataType` is decided by every
  sequence, and protein wins a disagreement.
- `Missing=` and `Gap=` symbols are read from the block; `*` is a residue.
- **Zero is a value**: zero branch lengths and zero support are drawn and
  shown, and survive a phyloXML write (phyloxml 1.1.1).
- A branch with several confidences keeps its support in Newick/Nexus.
- An all-missing matrix row is absence of data, not a sequence.
- The panel refits when the window is resized, and the fit rule keeps the
  last section open.

## 3.12.0 — 2026-09-22

### Added
- **A sequence logo under the alignment** (Sequence Logo checkbox,
  `showMsaLogo`): information content in bits, scaled by occupancy, over the
  tips on screen. Rides in a shared view.
- An operator-motif demo.

### Fixed
- A shared link carries the heat map and the logo (a test ties the URL codec
  to `getViewState`).

## 3.11.0 — 2026-09-22

### Added
- **A heat map beside the tree** (Heat Map checkbox, `showHeatmap`): one
  column per numeric tip field, on one shared scale; unassessed cells are
  outlined, never read as zero; hover for the value. Data from phyloXML
  properties or a metadata table.
- **Column clustering** drawn as a dendrogram: complete linkage on Euclidean
  distance or Bray–Curtis ("ignoring shared absence"), matching R's `hclust`
  and `vegan`. The default is chosen from the values; `heatmapColumnOrder`
  overrides.
- **Order columns** (input, alphabetical, frequency, clustered, manual via
  **Reorder columns…**); a manual order rides in a shared view
  (`heatmapManualOrder`).
- The heat map as rings in the circular layout (none in unrooted).
- A clustergram demo.

### Fixed
- Hover readouts sit beside the pointer instead of ~95 px away.
- No seams between heat-map rings.
- A property ref repeated on a node exports all its values, joined with `; `.

## 3.10.0 — 2026-09-17

### Added
- **A Time / Div switch** for trees that state both dates and divergence
  (e.g. Nextstrain builds): redraws from either, losslessly, with the calendar
  axis only in the time view. Offered only where the two pictures differ;
  Shift+X.

### Fixed
- A converted BEAST tree's dates could sit a few days off.

## 3.9.0 — 2026-09-17

### Changed
- **A BEAST tree opens on the calendar axis its tip labels imply**, when a
  clear majority of tips carry dates that agree on the date of height 0.
  Otherwise nothing changes. A joint rule with the desktop.
- **A time axis comes from a unit only**; the magnitude-based geologic guess
  is gone.

### Fixed
- phyloXML saves keep every node date (phyloxml 1.1.0).
- Float-noise bound pairs are no longer drawn as ranges.

## 3.8.0 — 2026-09-17

### Added
- **`panelDensity: 'compact'`**: a tighter, narrower control panel.
- FigTree taxon colours (TAXLABELS `!color`) are read as label colours.

### Changed
- **Every tree of a multi-tree file keeps its own view**; a tree not opened
  yet inherits only the geometry.
- **A more compact panel**: adjustment sections arrive folded, open/closed is
  remembered across reloads, and the panel folds the oldest section to stay
  on one screen.
- **TreeTime output opens as a time tree** (`date=` becomes a date when the
  dates reproduce the branch lengths); `auspice_tree.json` opens; TreeTime
  annotations get the `treetime:` namespace.
- Tip date uncertainty is kept and drawn on calendar axes.
- **Auspice's Nexus export opens like its JSON** (`num_date`, `num_date_CI`,
  `div`), on trees that are actually time-scaled.
- NHX tags are read the desktop's way (quotes are not part of a value).
- FigTree `!` directives, `mutations` and `mcc` annotations are always text.

### Fixed
- Hex-looking values (`0x1A`) are no longer read as 0.
- FigTree colours written as signed integers are read.
- An apostrophe inside an annotation value no longer breaks the file.

## 3.7.0 — 2026-09-15

### Added
- **Representative tips** (the desktop's Tools → Select Representative Tips):
  one tip per group of close tips, by cutoff or target count; **Create tree**
  cuts them into a new tree. New `forester.selectRepresentativeTips`,
  `hasUsableBranchLengths`, `copyTreeKeepingTips`, `representativeTreeName`,
  `representativeTreeDescription`, `stripShortExtension`.

## 3.6.1 — 2026-09-14

### Fixed
- PDF legend titles set in Helvetica Bold, not Times; "≤" spelled "<=".
- No white band under a full-window tree.

## 3.6.0 — 2026-09-14

Big trees drawn as a handful of paths: a 50,000-node tree opens in a third of
a second and pans at 60 fps.

**For embedders:** the SVG is structured differently — no `path.link` per
branch or `circle.nodeCircle` per node, and a `g.node` only for nodes that
draw a label, value or collapsed clade. Panel redraws run one frame later on
every tree; `viewer.ready` still marks the first draw.

### Changed
- Branches, dots and shapes are batched paths; hover and click find the
  nearest node.
- The "Redrawing" card appears only when the last redraw took 300 ms or more;
  every redraw coalesces into one per frame; the opening card starts at 5,000
  nodes.
- Domain architectures redraw about 3× faster, and their exports are smaller.
- The rarer colour draws on top; halos stop pulsing past 1,000 hits.

## 3.5.1 — 2026-09-14

### Fixed
- MAD rooting no longer picks a different root on each run for trees with
  near-zero branches.

## 3.5.0 — 2026-09-14

### Added
- **MAD rooting** (Tria et al. 2017) beside midpoint; `forester.madRoot`,
  `forester.removeMadConfidences`.
- **MAD values** (MAD Values checkbox), never counted as support.
- A warning before a re-root changes clades whose internal nodes carry data.
- **Tips around** in the unrooted layout of an unrooted tree.
- A Flavivirus mature-peptides demo (ten trees).

### Changed
- Greyed re-root controls say why.
- **Time trees can no longer be re-rooted** (`forester.isTimeTree`);
  `rerootable="false"` is honoured everywhere.
- Newick/Nexus never write a MAD value as support.
- `forester.reRoot(phy, node, 0)` puts the root at the node.

## 3.4.1 — 2026-09-14

### Changed
- A collapsed clade's wedge shows its nearest and farthest tips.
- Search, the hit navigator, the overview and selection all account for hits
  inside collapsed clades.
- Switching trees clears collapsing.
- **Download Ext. Node Data writes a headed `.tsv`**, one row per tip, the
  desktop's column names; it reopens as a metadata table.

### Fixed
- Collapsed-clade labels line up with tip labels; circular scales to the
  farthest collapsed tip.
- Midpoint re-rooting no longer turns a collapsed clade inside out.
- Legends recount on collapse; a collapsed clade keeps its colour.
- Searching the Molecular Sequence field finds sequences again.

## 3.4.0 — 2026-09-13

### Added
- **Metadata tables** (TSV/CSV) joined onto the tips as properties
  (`forester.joinMetadataTable`).
- **A scale bar** for phylograms (`forester.scaleBarLength`).
- **Collapsing clades** (node menu, a tool-row button, Esc to open all).
- **Every tree of a multi-tree file**: `archaeopteryx.parseTrees()`,
  `getTreeCount()`, `getTreeIndex()`, `showTree(i)`;
  `forester.parseNewHampshireTrees()`, `forester.splitNewHampshire()`.
- **Shareable views**: `getViewState()` / `applyViewState()`,
  `encodeViewState()` / `decodeViewState()`, config `view` and
  `onViewChange`; demo pages keep the view in the URL hash.
- **Keyboard shortcuts** (⌘/Ctrl): fit, zoom, layout, display type, time
  axis, ladderize, uncollapse, search, hit navigation, tree switching, `/` for
  the list.
- A stub branch into the root; the Auto-hide Labels item lights up while
  hiding.

### Changed
- Search suggestions are an in-page list that follows the match mode and
  Match case.
- The unrooted layout draws no root branch; domain-track width works in
  radial layouts.
- `forester.parseNewHampshire` on several trees returns the first.

### Fixed
- The search box turns red while typing an invalid regex or number.
- Cladogram and subtree root spacing; the root's stray hollow circle.

## 3.3.0 — 2026-09-12

### Added
- **Protein domain architectures** beside the tips, with a Domain
  Architectures panel section (width, E-value threshold, labels, glow) and a
  legend. Config `showDomainArchitectures`, `domainLabels`, `domainGlow`,
  `domainEvalueExponent`.
- Domains in the node-data dialog.
- **Shared visualization-selection fixtures** with the desktop
  (`test/fixtures/vis-contract.tsv`, `vis-trees.tsv`).

### Changed
- **Color-by and Shape candidacy is defined here and followed by the
  desktop**: record-keeping fields never offered; In/Out-Group demoted;
  sparse fields last; numeric fields never refused as unique; a subtree
  never re-classifies; a tree opens on the first non-wide candidate.
- Double-click no longer zooms; the big-tree card starts at 3,000 nodes.
- Depends on `phyloxml ^1.0.2`.

### Fixed
- The overview miniature (built from the model now).
- A one-node Newick tree keeps its name; three demo trees are schema-valid.

### Removed
- Twelve unused `forester` exports and the `_children` collapse model.
- The 2.x search-field codes (`NN`, `TS`, `GN` …).

### Performance
- Redrawing the 18,512-node demo tree: about 4.2 s → 1.9 s.

## 3.2.1 — 2026-09-10

### Fixed
- The program reports its version correctly (3.2.0 said 3.1.0). `npm test`
  now checks that all four version strings agree.

## 3.2.0 — 2026-09-10

Tree I/O, designed and verified with the desktop.

### Fixed
- **Saving no longer damages tip names**: labels are quoted instead of
  having special characters replaced by `_`.
- A Nexus tree no longer comes back with duplicated tips (numeric tips are
  indices only when every tip is one).
- Doubled apostrophes in quoted labels are un-doubled; an unquoted apostrophe
  no longer swallows a TAXLABELS line.
- phyloXML files with foreign-namespace extensions open.

### Changed
- Label shortening strips a prefix shared by 95% of tips, not all of them.
- Written labels are quoted per the desktop's rule.
- `forester.toNewHampshire`'s `replaceChars` argument is retired (ignored).

### Maintenance
- All Dependabot alerts resolved (a stale lock file); the phyloXML fixtures
  are schema-valid.

## 3.1.0 — 2026-09-09

### Added
- **Floating (sticky) time axes and alignment strips**; exports anchor them
  to the tree.
- A dashed guide from each tip to its alignment row.
- **An alignment navigation bar**: page buttons, jump-to-column, readout.
- The hover glow takes the node's own colour.
- The geologic axis bands Series over Stage for narrow windows.
- **Click a legend colour to change it** (an in-page picker; `[reset colors]`).

### Changed
- The overview pane is about 20% larger.
- **`nhConfidenceValuesInBrackets` is retired** (still accepted, with a
  warning): bracketed values are always confidences.
- **Support values in Newick/Nexus are recognised automatically.**
  `nhConfidenceValuesAsInternalNames` is replaced by
  `internalNumericLabels`: `'auto'` (default), `'confidence'` or `'label'`.
  **`nhConfidenceValuesAsInternalNames: true` corresponds to `'confidence'`,
  not `'auto'`.** A numeric root label is kept as a name.

### Performance
- Zoom bursts and control changes coalesce into one redraw per frame.
- Big trees: `launch()` returns at once behind a "Drawing N nodes" card;
  `viewer.ready` and `archaeopteryx.busy()` are new.
- Optional per-node elements are created only when shown (−58% elements).

### Fixed
- Search A is visible in the dark theme.
- Node data shows a proper PROPERTIES section in one consistent order.
- Taxon identifiers are never offered as a visualization.
- Trees with branch lengths no longer open as cladograms.

### Demos
- A 150 × 30,000 genome alignment, a Late Cretaceous time tree, and the
  13,246-tip H5N1 tree.

### Also since 3.0.0
- `open.html` (visualize your own tree, with an Expert options panel); a
  draggable toolbar; phyloXML recognized by content; the dormant "Submit
  Selected" button removed.
