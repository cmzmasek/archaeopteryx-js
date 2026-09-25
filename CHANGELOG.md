# Changelog

All notable changes to Archaeopteryx.js. This file accumulates entries as work
lands on `master`; a release collects the `Unreleased` section into its GitHub
Release body. The published npm package and the live demo site are decoupled —
`docs/` is served from `master`, so demos update on every push, while npm
consumers only see a change when a version is cut.

## Unreleased

### Added

- **A hover readout on every protein domain**, which the boxes never had: the
  domain's name, its E-value (small ones keep their exponent), the residues it spans
  with its own length and the protein's, the tree tip it belongs to, and its
  accession where the file carries one. **Clicking a domain looks it up** —
  the Pfam entry directly when there is an accession, an InterPro search by
  name when there is not. phyloXML's domain `id` is optional and most files
  carry names alone; InterPro resolves accessions but not Pfam identifiers
  (`/entry/pfam/NB-ARC/` is a 404 while the accession and the search are
  both 200), so the search is the honest fallback rather than a guessed URL.
  Only the domain boxes take the mouse, so the tree behind the track stays
  clickable.
- `forester.domainReference(domain)` and `forester.domainEvalueText(e)`: the
  link and the formatting, in the half of the codebase the test suite can
  reach. A wrong URL fails silently in someone else's browser, which is the
  worst place to find out.

### Changed

- **Auto-hide Labels now thins crowded branch data too.** Support values,
  branch-length values and support symbols claim the box they are about to
  occupy, and a mark overlapping one already claimed in that pass is left out
  — root first, so the mark nearer the root keeps its place, and the same tree
  drops the same marks every time. Numbers and symbols use separate maps;
  symbols are never shrunk. The toggle still turns it all off.

  Adopted from the desktop Archaeopteryx (`LabelOccupancy`, 0.11.161) as a
  joint rule. Measured here before taking it: with auto-hide already on, **240
  of 267 drawn support numbers overlapped another on `flu_h5.xml` (90%)**, 149
  of 262 on `Adenoviridae`, 13 of 119 on `bcl2` — our auto-hide decimated tip
  labels and had never touched branch data. After: **zero overlapping marks on
  all three.**
- `forester.labelOccupancy(cell)`: the map behind it, where the suite can
  reach the parts that must match the desktop.

## 3.14.0 — 2026-09-23

What is actually in this file? Nothing in the viewer answered that. Now the
ⓘ button does, with the facts the desktop Archaeopteryx lists and the
spreads — n, minimum, median, maximum, mean — in place of its histogram.

### Added

- **Tree properties.** An **ⓘ** button in the control panel's header, and
  ⌘I / Ctrl+I, open a read-only summary of the tree, modelled on the
  desktop's *View › Tree Properties* and carrying what it carries, minus the
  editable half and minus the histogram:
  what the tree says it is; its structure, including whether it is fully
  binary or how many polytomies it has, its depth, the longest tip label and
  how many internal nodes are named; **minimum, median, maximum and mean** for
  the branch lengths, with the total tree length, the height, any zero-length
  or negative branches and whether it is ultrametric; the same spread for
  **support, one section per kind**, since a bootstrap and a posterior are not
  on one scale and must not be pooled; what it carries as "n of m tips",
  including **every phyloXML property `ref` and the nodes carrying it**; and
  its dates. Nothing else in the viewer answered "what is actually in this
  file". Recomputed on every open rather than cached, so it follows a re-root,
  a tree switch or entering a subtree — 24 ms on the 13,246-tip demo.
- `forester.treeStatistics(tree)` and `forester.describeValues(numbers)`: the
  gatherer behind it, side-effect free and DOM-free, mirroring the split the
  desktop makes between `TreeFacts` and `TreePropertiesForm`.

### Fixed

- **The tree-properties button drew the wrong glyph.** It carried the theme
  switch's class for its styling, and `applyPanelTheme` repaints the innerHTML
  of everything with that class, so the sun/moon replaced the circled `i` as
  soon as a theme was applied. The two now share only a CSS selector.
- **Dialogs no longer put their text straight on top of the tree.** They take
  the same frosted-glass blur the node menu and the search suggestions have
  always had; the panel background is deliberately translucent, and without
  the blur a dialog over an alignment or a heat map was dense text on a
  rainbow. Affects About, Keyboard shortcuts, node data and the rest.

## 3.13.0 — 2026-09-23

A file is a promise between two programs. Most of this release is the desktop
Archaeopteryx and Archaeopteryx.js agreeing, byte for byte, about what a Nexus
file says — and about zero, which both of them had been reading as nothing.

### Added

- **Molecular sequences travel in Nexus, both ways, byte-identically with the
  desktop.** The desktop Archaeopteryx gained a Nexus `CHARACTERS` writer
  (`PhylogenyWriter.writeNexusCharactersBlock`), and the two programs have to
  write the same file: `DataType` is capitalised and read off the residues by
  the shared guesser, the `Format` line is `DataType=… Interleave=No Gap=-
  Missing=?`, and the matrix has **a row per taxon** — a tip with no sequence
  gets a row of `?`, so the matrix covers every taxon the Taxa block declares.
  Sequences of unequal length are not an alignment: nothing is written, and a
  bracketed Nexus comment says why instead of padding them. Verified by
  running both programs on the same trees — the files are identical byte for
  byte, and each reads the other's.
- **Two standing round-trip tests**, on Christian's request: phyloXML → Nexus →
  phyloXML, and Nexus → phyloXML → Nexus, over a purpose-built fixture (zero
  and negative branch lengths, quoted names, a tip without a sequence) and two
  real files. They compare the tree, its branch lengths, its support and its
  sequences, and the second compares the Nexus bytes themselves. Writing them
  is what turned up the two fixes below.

### Changed

- **One label chain for Newick and Nexus alike**: name, then taxonomy, then
  the sequence's name/symbol/gene name, then its **accession**, then a
  `node<N>` placeholder numbered by tip position — each step tried in turn
  rather than as an `else if`, and the placeholder for external nodes only.
  Until now the Nexus writer applied a chain and the Newick writer wrote
  `node.name` and nothing else, so the same tree saved in the two formats
  named its tips differently: a nameless tip with a taxonomy was `HUMAN` in
  one file and empty in the other. Tips that used to be written `node1` now
  carry a real identifier where they have one — an accession-only tip, or a
  tip whose taxonomy element is present but empty beside a sequence that could
  name it. A node name still wins over everything, and an accession never
  displaces its own sequence's name. **A Newick file with unlabeled tips no
  longer round-trips to itself**: `(,)` is now written `(node1,node2)`, as the
  desktop writes it. Agreed with the desktop and verified byte for byte
  against their build, in both formats.
- **A Newick or Nexus download carries support values by default, and a test
  now says so.** Nothing pinned it before, in either program: the desktop
  shipped with its support style defaulting to `NONE`, so the same tree saved
  by the two differed and its Save As Nexus dropped support silently. They
  changed theirs to match on 2026-09-23; this pins ours — the default, both
  download paths honouring it, the README agreeing, and the writer obeying it.
- `forester.toNexus` **no longer mutates the tree it is given.** It used to
  assign its computed label to a nameless tip's `name` so the Newick writer
  would agree with it, and undo that afterwards; both writers now ask the same
  function.
- **Residues read from a Nexus matrix are normalised the desktop's way**
  (Christian's decision, 2026-09-23): upper case, `.` read as a gap, and
  anything outside the declared alphabet read as the unspecified residue —
  `X` for protein, `N` for DNA/RNA. So the missing symbol `?` now arrives as
  `X` or `N` rather than as itself, and `A?GCTA` reads as `ANGCTA`.
  `BasicSequence.createAaSequence` / `createDnaSequence` / `createRnaSequence`
  ported in full, in their order, with the alphabets copied character for
  character; verified by running both readers on the same matrices. A phyloXML
  `<mol_seq>` is untouched, by both programs.

### Fixed

- **Two tips can no longer share a taxon label in a Nexus file.** A matrix is
  keyed on that label, so the reader took the repeated row for an interleaved
  continuation and handed *both* tips the two sequences joined together —
  corruption, not merely an invalid file. Two ways in, both closed: the
  `node<N>` placeholder now steps over labels the tree already uses (a tip
  literally called `node2` used to collide with a minted one), and a tree with
  genuinely duplicate tip names gets no matrix at all, with a bracketed
  comment saying why.
- **The sequence-type guess tests F, P and V as well.** It looked only for
  L/I/E/H/D/Q, six of the thirteen letters a nucleotide sequence cannot
  contain, so a protein built from nucleotide letters guessed DNA — and a
  matrix wrongly declared DNA is read back with every non-nucleotide residue
  replaced by `N` (`MKATSWNP` returned `MKATSWNN`). By UniProt residue
  frequencies the chance a protein carries none of the tested letters falls
  from 12.5% to 3.3% at length 5 and from 1.6% to 0.11% at length 10; a real
  alignment of a hundred columns was never at risk. Changed on both sides in
  the same move, and a test pins the alphabet letter for letter, because one
  program adding a letter alone would type the same file two ways.
- **The matrix `DataType` is decided by every sequence, not by the first one
  that guesses.** A matrix wrongly declared DNA is read back with every
  non-nucleotide residue replaced by `N`, so protein now wins any
  disagreement: calling a nucleotide alignment protein leaves the residues
  readable, the reverse destroys them.
- **What counts as missing data is what the block declares.** The residue scan
  assumed `?` and `-`, so an all-missing row of a `Missing=N` file read as real
  residues; it now reads the `Missing=` and `Gap=` symbols off the `Format`
  line. And **`*` is a residue**, the stop codon of a translated alignment, not
  absence.
- **Zero is drawn as a value, not as nothing.** Three display paths tested a
  number for truthiness and so read `0` as absent: the **Branch Lengths**
  label skipped every zero-length branch — the one branch whose length is
  worth pointing out — the **Confidence Values** label never drew a support of
  `0`, and the node data box omitted `Distance to parent: 0`. The MAD branch
  beside the confidence one had always tested the number properly.
- **A branch length of zero survives a phyloXML write.** The writer tested the
  number for truthiness, so every `0` was dropped and came back undefined —
  silently, and on real files: the repo's own `bunya_glyco.xml` has 33 of
  them, and a zero-length branch is ordinary wherever sequences are identical.
  Fixed in [phyloxml 1.1.1](https://github.com/cmzmasek/phyloxml-js/releases/tag/v1.1.1),
  which this release depends on; the two vendored copies (`test/lib`,
  `docs/lib`) and the dependency are now one file, and a test says so.
- **A branch carrying more than one confidence keeps its support.** Newick and
  Nexus have one support slot, and this wrote nothing at all unless there was
  exactly one confidence — so a node with a bootstrap *and* a posterior lost
  both. It now writes the first that is not a MAD value, which is what the
  desktop's `BranchData.getSupportConfidence` returns, verified by running it.
- **A matrix row of nothing but `?`, `-`, `.` or `*` is absence of data, not a
  sequence.** Without this, saving a tree where only some tips carry sequences
  and reopening it invented a sequence of question marks for every tip that
  never had one — reachable through our own writer, now that it emits those
  rows to keep the matrix rectangular.

### Changed

- **Search B is simply there.** The second search box used to sit behind a
  `+ Search B` link. That link was a second, weaker way of hiding things
  nested inside the section fold: it saved 45px, it was forgotten on every
  reload (the fold is remembered), nothing put B back once revealed, and
  revealing it grew a section that the fit rule had just measured without it,
  so the panel was left scrolling. Both boxes are now always in the Search
  section, and the fold is the only place where sections are hidden.

### Fixed

- **The panel refits when the window changes size**, not only when you open a
  section. An arrangement that fitted a moment ago used to be left scrolling
  after the window was dragged shorter. Growing the window back does not
  reopen what was folded — what is open is the user's choice, and only running
  out of room overrules it.
- **The fit rule keeps the last section open.** It folds the section opened
  longest ago until the panel fits, and it now stops at the final one rather
  than emptying the panel down to a stack of legends — which the comment
  describing it had claimed all along, and which a short enough window made
  reachable.

## 3.12.0 — 2026-09-22

An alignment beside a tree says what each sequence has; a logo says what the
sequences *agree on* — and next to a tree, which sequences those are is a
question the tree answers.

### Added

- **A sequence logo under the alignment.** The **Sequence Logo** checkbox
  replaces the conservation bar with the display the MEME Suite and WebLogo
  draw: every column a stack of letters, as tall as that column's information
  content in bits and shared out by residue frequency, most frequent on top. A
  conserved column is one tall letter; a variable one a short pile. The caption
  gives the scale — 0 to 2 bits for nucleotides, 0 to 4.3 for amino acids.
  - It summarises **the tips currently on screen**, so entering a clade gives
    that clade's motif rather than the file's, and the caption names how many
    tips that is.
  - Gaps are not a letter: frequencies are taken over the residues present and
    the stack is then scaled by the column's occupancy, so a column held up by
    two sequences out of fifty draws short rather than perfectly conserved.
  - No small-sample correction. Entering a three-tip clade is a normal thing to
    do, and Schneider's correction would subtract more than the maximum and
    leave the column blank exactly then; the caption names `n` instead.
  - `showMsaLogo` opens on it, and it rides in a shared view.
- **A demo for it**: 30 strains in three lineages carrying the same operator in
  the same frame, each lineage with its own reading of it. Over the whole file
  the logo shows the frame the three share and little else; switch to a lineage
  and its operator resolves into a crisp twelve-letter motif.

### Fixed

- **A shared link now carries the heat map and the logo.** `getViewState()`
  knew the heat map's four keys and the alignment logo; the URL-hash codec did
  not, so an embedder calling the handle got them while **Copy link to this
  view** silently dropped them — and the heat map's hand-arranged column order
  was documented as surviving a link. It does now, and a test reads
  `getViewState` and fails on any key the codec does not know, so the two
  halves cannot drift apart again in silence.

## 3.11.0 — 2026-09-22

A tree's tips often carry numbers as well as names — gene presence, evidence
scores, a pan-genome matrix. This release draws them as a **heat map** beside
the tree, clusters its columns, and lets you arrange them yourself.

### Added

- **A heat map beside the tree.** One row per tip, one column per numeric
  per-tip field, every column painted on **one shared scale** — a colour means
  the same number wherever it appears, which is what makes a block of related
  columns readable as a block rather than a row of independent stripes. Turn it
  on with the **Heat Map** checkbox under Display Data, or open on it with
  `showHeatmap: true`. Offered whenever the tree has two or more numeric fields;
  the columns are exactly what the **Color by** menu offers, so the two agree
  about what the tree holds. The scale spans the whole tree, so entering a
  subtree narrows the rows and leaves the colours where they were.
  - A cell **nobody filled in** is an outlined empty box, never the scale's low
    end: on a presence/absence matrix, reading a missing field as zero states
    the opposite of what the file says. A key beside the scale names it.
  - Hover any cell for its tip, the column, the value — or `not assessed` — and
    the scale it was coloured against. Column names stand turned under the
    matrix; more columns than will fit shows a window that says so
    (`Columns 1–240 of 400`) and scrolls to the wheel.
  - Data arrives with the tree as phyloXML `<property>` elements on the tips, or
    from a **metadata table** joined on the open page — a table's numeric columns
    become heat-map columns like any others.

- **Column clustering, drawn as a dendrogram above the matrix** — a clustergram.
  Complete-linkage hierarchical clustering, written to give the same answer as
  R's `hclust(dist(t(m)), method = "complete")`, pinned against R 4.5.3 output.
  Two senses of "alike":
  - **Clustered (co-occurrence)** — Euclidean distance, the default of R's
    `pheatmap`, `heatmap.2` and `ComplexHeatmap`.
  - **Clustered (ignoring shared absence)** — the **Bray–Curtis** dissimilarity
    (R `vegan`'s `vegdist` default), pinned against vegan 2.7-2. Euclidean
    distance has the *double-zero problem*: two genes both **absent** from the
    same strains count as agreeing there, so on a sparse pan-genome the rare
    genes cluster together merely for being rare. Bray–Curtis drops a tip where
    both columns are 0 instead of scoring it as agreement.
  - Which one a tree **opens on** is decided by its values: Bray–Curtis where
    the matrix has zeros to ignore and nothing negative, Euclidean otherwise. A
    zero is precisely the precondition for a double zero to exist, and
    Bray–Curtis is meant for values 0 or more. `heatmapColumnOrder` overrides,
    and an explicit choice is never re-derived.

- **Order columns**, with **Reorder columns…** for your own arrangement. *As in
  the input*, *Alphabetical*, *Frequency*, the two clustered orders, and a
  **Manual** order you drag (or move with the arrow keys) into place. Nothing
  re-sorts a manual order — a sorting mode that quietly undid your arrangement
  would make the arrangement pointless — and *Automatic* hands the order back to
  the data. A manual order rides in a shared view (`heatmapManualOrder`), so a
  link reproduces the figure exactly; a column the list does not name follows
  the ones it does.
  - phyloXML gives every node its own property list, so "the input's order" is
    not one thing. *As in the input* takes the order the tips agree on — a
    consensus over which column precedes which, not an average position — and
    its tooltip says whether that really is the input's order or only the order
    most tips agree on. Columns that appear together stay together.

- **The heat map in the circular layout**: each column a concentric **ring** past
  the tips and their labels, each cell an arc over that tip's own angular slice.
  Ring names run tangentially at the fan's seam — the one place a label can sit
  without covering a cell — and the scale becomes a corner card, because a ring
  has no "under" to hang a strip from. No dendrogram there: it would have to
  bend. The unrooted layout gets no heat map at all, since every tip ends at its
  own radius and a column has no ring to be.

- **A clustergram demo**: 50 synthetic strains and 18 accessory-genome genes,
  opening deliberately on the Euclidean answer so switching to *ignoring shared
  absence* shows the double-zero problem scatter.

### Fixed

- **The hover readout landed away from the cell it described.** The heat map and
  the alignment track placed it by guessing its width — a hard-coded 280 px
  shift against a readout 181 px wide — and since both tracks hug the right edge,
  every cell took that shift and every readout floated ~95 px clear of the
  pointer. It is now placed by its own measured size, flipping on either axis
  only where it would leave the window. The node tooltip, which never flipped at
  all and so ran off the right edge, goes through the same function.
- **Seams between the rings.** Adjacent sectors met at exactly the same
  coordinate, so two antialiased edges each covered about half the boundary
  pixel and the background showed through as a dotted line all round every ring.
  Neighbouring cells now overlap instead of abutting.
- **A property ref repeated on one node exported only its first value**, so a
  presence/absence matrix left the node-data table as if it were single-valued.
  Repeats now join with `; ` in document order, one column per ref.

### Changed

- The joint pan-genome contract with desktop Archaeopteryx is pinned on a real
  matrix — 100 strains × 40 genes, 40 distinct scores — rather than on synthetic
  trees where every score tied and "we agree" only meant we agreed on the
  alphabetical tiebreak.

## 3.10.0 — 2026-09-17

One tree can say two different things: where its nodes sit in **time**, and how
far its branches have **diverged**. Until now we drew whichever the file happened
to arrive with. Now, where a tree states both, you can switch.

### Added

- **A Time / Div switch, for trees that state both.**
  - A Nextstrain build carries a sampling date and a divergence measure for
    every node. The switch redraws the tree from either, and the calendar axis
    comes and goes with it — an axis of years against a tree measured in
    substitutions would be a confident lie, so it is shown only in the time
    view.
  - Reversible and lossless: the branch lengths the file arrived with are
    recorded before anything rewrites them, so switching back restores them
    exactly.
  - Offered only where the choice is real. The test is whether the two metrics
    actually draw a different picture — the largest shift in any tip's position,
    as a fraction of the tree's width — not whether the numbers differ. A BEAST
    time tree states time in both, and moves its tips by 0.9%; a Nextstrain
    build moves them by 24.8%. The control stays hidden on the first and appears
    on the second.
  - **Shift+X** drives it, and still works the time axis on trees without the
    switch.

### Fixed

- **A converted BEAST tree's dates could sit a few days off.** The tolerance
  that decides whether a tip AGREES about the date of height 0 was also being
  allowed to place that date. It decides agreement only; the date now comes from
  what the agreeing tips actually state. Measured by the desktop Archaeopteryx
  against trees whose true dates are known: worst case 4.15 days out before, and
  within half a day after. No tree shipped with 3.9.0 was affected — every
  anchor there is unchanged — but a tree with a wider spread of label precision
  could have been.

Try it on the demo site: https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=flavivirus

## 3.9.0 — 2026-09-17

Time. A BEAST tree says how far apart its nodes are in time but never when, and
we were guessing — a human influenza tree spanning twelve years was drawn on a
geologic axis, banded Miocene to Pleistocene, under tips labelled 1993 to 2005.
The guess is gone, and in its place the sampling dates in the tip labels are
used to place the tree in calendar time properly. Separately, a dated tree no
longer loses its dates when you save it. The rules here are shared with the
desktop Archaeopteryx (forester 0.11.151) and were checked against it tree for
tree, node for node.

### Changed

- **A BEAST tree opens on the calendar axis its tip labels imply.**
  - BEAST states a node's age as a bare `height` — time before the youngest
    tip, with no unit — so the file never says *when*. Where the tip labels
    carry sampling dates (`A_duck_Guangdong_12_2000`, `NewYork_705_1994.1`,
    `EBOV|KR817226|2014-06-10`) and they agree on the date of height 0, the
    tree is placed in calendar time and the axis, the age bars and Color by
    all follow.
  - The agreement is the evidence, and it has to be unanimous enough: a strict
    majority of tips must carry both a height and a label date, at least
    nineteen in twenty of those must agree, no rival date may be equally well
    supported, and the agreeing tips must have been sampled at different times.
    Tips all from one year agree with heights in any unit and so prove nothing.
  - Heights in months or substitutions, a strain number mistaken for a date, a
    tree whose dates already carry a unit, or a tree that is not time-scaled:
    all left exactly as they were. A converted tree records what happened in
    its description, including the date height 0 was placed at.
  - Dates are read from the labels the way the surrounding programs write them:
    ISO, month-name, numeric, year-month, decimal year and bare year, each read
    as the *span* it states — `2021` is all of 2021, `2021-03` all of March —
    which is what makes two programs' conventions comparable.
- **A time axis now comes from a unit, and nothing else.**
  - The old rule guessed geologic from magnitude alone: values above ten
    reaching down toward zero. Every tip-dated BEAST tree fits that, which is
    how twelve years of influenza became twelve million. A tree whose dates
    carry no unit gets no axis rather than a wrong one.
  - Measured over every tree shipped here before removing it: the guess decided
    three trees and got all three wrong, and nothing relied on the companion
    rule that read values between 1500 and 2200 as years.

### Fixed

- **A tree saved as phyloXML kept none of its dates.** The writer emitted only
  the phylogeny's own `<date>` and never a node's, so every value, unit and
  bound — fossil ranges, HPD intervals, sampling uncertainty — was dropped on
  save, silently. Fixed in `phyloxml` 1.1.0, which this release requires.
- **A date's bounds are only an interval when they differ.** TreeAnnotator
  writes an exactly dated tip's bounds as `{9.0, 9.000000000000004}` — one
  number printed twice through binary floating point. Read as a width, it drew
  a fossil-range bracket on 686 of `influenza.tree`'s 687 tips, and printed the
  pair as a range in the hover card. A bound pair now has to differ by more
  than floating-point noise before anything calls it a range.

Try it on the demo site: https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=flavivirus

## 3.8.0 — 2026-09-17

Three things. Every tree of a multi-tree file keeps its own view. The control
panel takes less room, for hosts that have little to give. And the
Newick/Nexus reader understands what the programs around it actually write —
TreeTime, Auspice's Nexus export, FigTree, BEAST, MrBayes — checked case for
case against the desktop Archaeopteryx (forester 0.11.150), which shipped the
same rules.

### Changed

- **Every tree of a multi-tree file keeps its own view.** A Nexus TREES
  block, a multi-tree Newick or a phyloXML holding several phylogenies now
  gives each tree its own workspace: leaving a tree remembers its layout,
  display type, labels, colours, sizes, tracks, both searches, the clade
  you switched to and the clades you collapsed, and coming back restores
  them. Every switch used to open the tree fresh.
  - A tree **not opened yet** inherits only the geometry — layout, display
    type, font, node and branch sizes, rotation — so stepping through the
    trees of one file keeps them all circular, while what each tree shows
    and colours by is still read from that tree's own content.
  - The tree **Create tree** makes from representative tips opens the same
    way, so it now follows the layout as well as the display type.
  - Zoom, pan, the legend's position and the node selection stay outside a
    view, as before; the views last for the life of the page, and the URL
    hash still carries the tree on screen.
- **A more compact control panel**, for hosts with little screen to spare.
  - **Sections that are adjustments arrive folded** — Zoom, Sizes and the
    domain controls — while the ones that describe the tree stay open, as
    does Search. On the 13-property demo that takes the panel from 766px of
    content to 621px, fitting a 700px window with nothing behind a scroll.
  - **What you open and close is remembered**, for the page and across
    reloads. It used to be thrown away on every tree switch.
  - **The panel keeps itself to one screen**: opening a section in a short
    window folds the section opened longest ago, and only while the panel
    would not otherwise fit. On a tall screen it never fires. The rule is
    bounded by pixels, not by a count of open sections — three open sections
    measure anywhere from 215px to 562px.
  - Jumping to the search box (⌘F / Ctrl+F), revealing Search B, opening a
    view that carries a search, and the representative-tips result all unfold
    the Search section, so what they produce is visible.
- **TreeTime output opens as the time tree it is.** TreeTime writes its dates
  as annotations only — `[&mutations=...,date=2003.84]` — and a `date=` there
  is a description, not a value, because in BEAST output the age lives in
  `height`. So its `timetree.nexus` showed no calendar axis and could be
  re-rooted. It cannot simply be promoted, because TreeTime writes the same
  comment on its `divergence_tree.nexus`, measured in substitutions. So the
  tree is asked: a numeric `date=` becomes the node's date only where the
  parent-to-child date differences actually reproduce the branch lengths.
  That needs no file sniffing and separates the two files exactly. TreeTime's
  `auspice_tree.json` opens too — it is a valid Auspice v2 dataset that simply
  never stamps `"version":"v2"`, and the only output with full-precision dates.
- **TreeTime annotations get a namespace of their own**, `treetime:`. They
  arrived through the BEAST path and landed as `beast:<key>` — right about the
  syntax, wrong about the producer. The producer is recognised on the tree: a
  TreeTime tree carries mutations and states no node age, where every BEAST or
  MrBayes run states one. Its mugration output, a bare user-named trait, keeps
  the generic namespace, since nothing can attribute it.
- **A sampled tip keeps its date uncertainty, and the time axis draws it.**
  The Auspice JSON reader used to drop a tip's date interval, for a display
  reason: the time axis drew every tip interval as a sepia fossil range with
  FAD/LAD end caps. But on a Nextstrain build that interval is real data — a
  sample dated only to its month or year. Counted on real builds: 2,347 of
  3,863 dengue tips carry one (median width 0.78 years), 1,390 of 2,985
  measles tips, 715 of 1,600 enterovirus D68 tips. Both readers now keep it,
  and the axis tells the two apart: on **calendar** time a tip's interval is a
  sampling-date uncertainty, drawn like an internal node's age bar, slimmer,
  and only when it has a width — a tip dated to the day draws nothing; on
  **geologic** time it is a fossil range, exactly as before.
- **A Nextstrain build saved as Nexus opens like the same build saved as
  JSON.** Auspice's "download Nexus" annotations now land where the Auspice
  JSON reader puts them: `num_date` is the node's date, in years, and also a
  `nextstrain:num_date` property; `num_date_CI={lo,hi}` is that date's
  interval; `div` is `nextstrain:div`. Checked on real builds saved both
  ways: measles, 5,388 of 5,388 nodes matched by name carry an identical
  date; dengue, 7,199 of 7,199. They used to arrive as opaque
  `beast:` numbers, so a time-tree export showed no dates, no calendar axis,
  and could be re-rooted. A `num_date` outranks a BEAST `height`, alone
  carries the unit, and never borrows the height's HPD interval; one that does
  not parse stays a plain `beast:` text property.
  - **Only on a tree that is actually time-scaled.** Auspice writes the same
    annotations on its divergence tree, whose branch lengths are
    substitutions, and dating that would hang a calendar axis on it. So a
    `num_date` stands unless the tree itself says otherwise: two comparable
    pairs or more, with no strict majority of parent-to-child year differences
    reproducing the branch lengths (the tolerances the TreeTime `date=` rule
    uses). Measured on real exports: measles 5388 of 5388 pairs, chikungunya
    2645 of 2645, the Lassa divergence tree 169 of 2295. Where it does not
    stand nothing is lost — the year and its interval stay as
    `nextstrain:num_date` and `nextstrain:num_date_CI`.
  - **Only pairs that can tell years from substitutions are counted.** The
    0.02 tolerance is larger than a densely sampled tree's substitution
    lengths, so on such a divergence tree a pair whose year difference and
    branch length both sit inside the tolerance "agrees" whatever the tree is
    measured in. A pair now counts only if one of the two exceeds it. Measured
    by rebuilding real time-tree exports as their divergence trees: H5N1 had
    3,620 of 9,205 pairs agreeing (39%) and now has 1 of 5,586; measles 17% →
    0; chikungunya 25% → 0; every time tree stays at 100%. No real file opens
    differently — 39% was still under the majority — but a denser build would
    have crossed it and been dated on substitutions. The same count serves
    the TreeTime `date=` rule. Found by a review on the desktop; the rule is
    shared by both programs.

- **An NHX tag is read the way the desktop reads it**, by its label rule.
  Quote characters are never part of a value — `[&&NHX:S='homo']` is the
  species `homo`, not `'homo'` with its apostrophes — and a tag written with
  stray whitespace in its `&&NHX:` is now recognised as one. **Unquoted
  whitespace is formatting noise**, so `S=Homo sapiens` reads as
  `Homosapiens`; **a quoted value keeps what is inside it**, so
  `S="Homo sapiens"` reads as `Homo sapiens` — the way to put a two-word
  species into an NHX tag — with a run of spaces read as one, and it may even
  hold the `:` that would otherwise end the tag. Checked case for case against
  the desktop's own measurements. A `[&key=value]` annotation is the opposite
  and is untouched: there, spaces and quotes are data.
- **FigTree's display directives are never numbers.** An annotation key that
  starts with `!` — `!color`, `!rotate`, `!collapse`, `!hilight`, `!name` — is
  an instruction to FigTree, not a measurement, so it is kept as text whatever
  it looks like. This matters for a colour we do not read: `!color=-8381639`
  (no `#`) used to become the numeric trait `beast:_color`, and Color-by
  offered FigTree's paint as a gradient. It is still kept, under the same
  name, as text — in the tree string and on a TAXLABELS taxon alike — and a
  trait of your own called `color` stays an ordinary trait. As on the desktop.
- **`mutations` and `mcc` annotations are always text**, as on the desktop. A
  mutation list that happens to hold one number, or a clade label that happens
  to be `3`, is not a measurement, and was being offered to Color-by as a
  gradient.

### Fixed

- **A value that looked like a hex literal was read as the number 0.** A
  number was "whatever both `parseFloat` and `Number` accept", and the two
  read different languages: `Number` understands `0x1A`, `0b101` and `0o17`,
  `parseFloat` stops at the letter and answers `0`. So such a trait was typed
  numeric, and a node height written that way dated its node at zero. A number
  is now a plain decimal with an optional exponent and nothing else — the
  desktop's grammar — for annotation values and for every property's datatype,
  the Auspice JSON reader's included.
- **FigTree's colours written as a signed integer were not read.** FigTree
  writes Java's signed colour value, `!color=#-8381639`, rather than hex
  whenever the colour came from its palette, and each one silently became a
  fake `beast:_color` trait instead of a branch colour. Both forms are read
  now; the alpha byte is dropped.
- **An apostrophe inside an annotation value broke the file.** Auspice writes
  values bare — `country=Côte d'Ivoire` — and the apostrophe was read as the
  start of a quoted string. With one such tip the file was refused over its
  "unbalanced parentheses" (they were balanced). With two it was worse: the
  apostrophes paired up across the tips, nothing was reported, the second tip
  vanished and the first one's country swallowed the Newick between them. A
  quote inside a `[&...]` annotation now opens a string only where a value can
  start, and closes it only where one can end; anywhere else it is a
  character like any other. Quoted values, quoted set elements and a value
  that merely begins with an apostrophe (`'s-Hertogenbosch`) all read
  correctly. Found on a real file, `nextstrain_chikv_global_timetree.nexus`;
  the desktop had the same bug.

### Added

- **FigTree's taxon colours are read, as label colours.** FigTree hangs a
  colour on a taxon in the Nexus TAXLABELS block —
  `'NewYork_454_1999.05'[&!color=#-8381639]` — and that is the colour of the
  tip's **label** (a `!color` in the tree string stays the **branch**
  colour). It lands as the desktop's `style:font_color` property, so Visual
  Styles draws it and phyloXML carries it, with nothing new downstream. The
  annotation used to be glued onto the label instead: invisible while a tree
  spelled its tips out, wrong as soon as it referred to them by number. The
  taxon is found by its exact name, else case-insensitively with `_` for a
  space, the way a matrix row already finds its tip.
- **`panelDensity`** config key. `'compact'` tightens the control panel's
  spacing and narrows it from 214 to 196px, with the tree's left margin
  following it. The same controls, nothing hidden. Default `'comfortable'`;
  a bad value is refused by name at the call.

## 3.7.0 — 2026-09-15

One new tool, ported from the desktop Archaeopteryx: representative tips,
which thins out a large tree to one tip per group of close tips and can cut
those tips out into a new tree.

### Added

- **Representative tips**, as the desktop's Tools → Select Representative
  Tips. A new tool-row button groups the tips into the largest clades whose
  tips are all within a distance cutoff, or into about a target number of
  groups, and keeps one tip of each: the most central (medoid) or the most
  divergent (longest branch), plus any selected or found tips. The tips kept
  show as search A's hits, and **Create tree** adds a tree of only those tips
  to the tree picker, named `<tree>_Nreps`, with how it was made in its
  description. The grouping matches the desktop's on all 5,666 settings of a
  fixture made by running the desktop's own code. One rule is new to both
  programs: the new tree's root keeps the original root's branch length, where
  the desktop's depended on node ids. forester.js gains
  `selectRepresentativeTips`, `hasUsableBranchLengths`, `copyTreeKeepingTips`,
  `representativeTreeName`, `representativeTreeDescription` and
  `stripShortExtension`.

## 3.6.1 — 2026-09-14

Two display fixes: PDF exports set the legend titles in the same sans-serif
as the rest of the figure, and a tree filling the whole window no longer
leaves a white band at the bottom.

### Fixed

- **PDF export: legend titles in a serif font.** The legend titles (and the
  label of a collapsed clade whose tips are all search hits) are semibold,
  a weight the PDF's built-in fonts do not have, so the PDF fell back to
  Times. They now come out in Helvetica Bold. The domain legend's title also
  came out as spaced-out garbage there, because the built-in fonts cannot
  show "≤"; the PDF spells it "<=".
- **A white band under the tree on a full-window page.** The tree's SVG was
  laid out inline, on a text baseline, so a container sized to the window
  came out a few pixels taller than the window, and the page could scroll
  (a trackpad flick slid the tree up over the page background; on systems
  with visible scrollbars one appeared). The SVG is now a block. The demo
  page also dropped an empty error box's 13px margin that did the same.

## 3.6.0 — 2026-09-14

Big trees, drawn a new way: branches, dots, shapes and the domain track
are a handful of SVG paths per style instead of several elements per node,
so a 50,000-node tree opens in a third of a second and pans at 60 frames a
second. The busy cards now appear only when a redraw is actually slow on
the computer at hand.

**For embedders:** the tree's SVG is structured differently. There is no
longer a `path.link` per branch or a `circle.nodeCircle` per node, and a
`g.node` exists only for a node that draws a label, a value or a collapsed
clade. Redraws triggered by the panel now run one frame later on trees of
every size; `viewer.ready` still says when the first draw has happened.

### Changed

- **Big trees open faster and pan smoothly.** Branches, node dots and node
  shapes are drawn as a handful of paths, one per style, instead of several
  SVG elements per node, and a node gets an element of its own only when it
  shows a label, a value or a collapsed clade. A 50,000-node tree went from
  250,374 SVG elements to about 450: it opens in 0.34 s instead of 1.6 s,
  dragging it runs at 60 frames a second instead of about 12, and the longest
  pause of a zoom step fell from 0.55 s to about 0.1 s (headless Chrome, M2 Pro).
- Hover and click find the node nearest the pointer, within the same radius
  the invisible hover circles had; clicking a label still picks its node.
- Animated redraws move branches, dots and labels together. In the circular
  layout nodes sweep along the circle instead of cutting across it.
- Where dots of different colours overlap, the rarer colour is drawn on top
  (it used to depend on tree order).
- Past 1,000 search hits the halos stop pulsing: thousands of pulses cost more
  to draw than the whole tree.
- **The "Redrawing" card appears only when a redraw is actually slow on
  your computer**: when the tree's previous redraw took 300 ms or more. A
  fast computer no longer flashes it on big trees, and a tree that is slow for
  what it carries (such as many domain architectures) gets it at any size.
- Redraws of trees of any size merge into one per frame: a mouse-wheel flick
  on a 3,000-node tree used to redraw once per notch, and on a slow computer
  (CPU slowed 6x) it now takes 0.24 s instead of 0.77 s.
- The "Drawing N nodes" card when a tree opens starts at 5,000 nodes (was
  3,000).
- **Domain architectures redraw about 3x faster.** Drop shadows, glows and
  backbones are drawn as a few paths instead of one element each: on a
  1,386-node influenza tree with 1,428 architectures the track went from
  32,346 SVG elements to about 7,900, a redraw from 257 ms to 114 ms and a
  wheel flick from 1.2 s to 0.57 s. Where boxes overlap -- rows packed
  tighter than a box is tall, or overlapping domains -- a box's shadow now
  lies under its neighbour instead of across it, so dense columns look a
  touch lighter.
- **Exports with domain architectures are smaller.** The same influenza
  tree's SVG went from 5.5 MB to 4.3 MB and its PDF from 3.8 MB to 2.9 MB;
  in the circular layout the PDF went from 4.0 MB to 2.8 MB.

## 3.5.1 — 2026-09-14

A fix to 3.5.0's MAD rooting: on trees with near-zero branches it could pick
a different, worse root each time it was run. The desktop ships the same fix.

### Fixed

- **MAD rooting no longer moves the root back and forth when run again.**
  On trees with tips a hair apart (FastTree writes a zero branch as 5e-9),
  those pairs' terms cancelled catastrophically in floating point and put
  every branch's score off by amounts that depended on the current root: 8
  of the 10 Flavivirus demo trees and the H5N1 tree rooted differently on a
  second run, onto a worse root every other time. Tip pairs closer than
  1/100,000 of the tree's diameter are now left out of the deviation sums,
  like identical tips already were. The desktop makes the same change.

## 3.5.0 — 2026-09-14

Rooting, made to match the desktop: MAD rooting beside midpoint rooting,
MAD values that never pass for support, trees that must not be re-rooted
(marked so by their file, or time trees) greyed with the reason, a warning
before a re-root changes the clades of internal nodes that carry data, and
"Tips around" for unrooted trees. The desktop shipped the same rules in
forester 0.11.146 and 0.11.147. Plus a multi-tree demo.

### Added

- **MAD rooting** (minimal ancestor deviation, Tria et al. 2017). The
  re-root button's menu offers **MAD re-root (Tria et al., 2017)** above
  Midpoint re-root, with the full citation on hover, for any tree with
  branch lengths and at least three tips. Ported from the desktop and
  checked against it on 254 trees; it runs in O(n²) time and O(n) memory
  (the 13,246-tip H5N1 demo tree roots in 0.4 s in Node). Pairs of tips at distance
  zero (identical sequences) are left out of every deviation sum. In code:
  `forester.madRoot(phy)` and `forester.removeMadConfidences(phy)`.
- **MAD values.** Every internal branch of a MAD-rooted tree carries its
  deviation as a confidence of type `MAD`, which a new **MAD Values**
  checkbox writes on the branches as `MAD/support`. They never count as
  support: the Confidence labels, Support Dots and the Confidence search
  field leave them out, and midpoint or manual re-rooting removes them. A
  shared view carries `root=mad` and `madValues`.
- **A warning before re-rooting a tree with data on internal nodes**, from
  the re-root button's menu or the node menu: when the re-root would change
  the clade of internal nodes carrying names, taxonomy, sequences, events,
  distributions, dates, references or node properties, it says how many of
  them, with Re-root and Cancel. It is worked out on a copy first
  (`forester.cladesChangedByRerooting`, `forester.nodeHasData`), and nothing
  is asked when no such clade changes. The desktop words it the same way.
- **Tips around**: in the unrooted layout of a tree its file declares
  unrooted, the hover card and Display Node Data show an internal node's
  tips on each side (`2 · 3 · 5`) instead of distance to parent, depth and
  tips below, a tip's distance to parent reads Branch length, and the
  root-measured search fields are not offered.
- **Flavivirus mature peptides demo**: ten trees in one phyloXML file, one
  per mature peptide of the flavivirus polyprotein (C, prM, E, NS1 … NS5) in
  genome order, stepped through with the multi-tree picker.

### Changed

- **Greyed re-root controls say why**: the re-root button's tooltip, and a
  greyed Reroot now shown in the node menu, read "This tree is marked as not
  re-rootable (rerootable="false")." or "Time trees can't be re-rooted:
  their branch lengths are times measured from this root."
- **A time tree can no longer be re-rooted**, by the re-root button, the
  node menu's Reroot or a shared view. A time tree is one where a majority,
  and at least two, of the internal nodes are dated (BEAST node heights,
  Nextstrain dates, phyloXML `<date>`s); `forester.isTimeTree(phy)`. phyloXML's `rerootable="false"` was
  already honoured by every way of re-rooting.
- **Newick and Nexus downloads never write a MAD value as support**, and a
  branch carrying both keeps its support value in the file. phyloXML keeps
  MAD values as `<confidence type="MAD">`.
- **`forester.reRoot(phy, node, 0)` puts the root at the node.** A position
  of 0 used to be read as no position at all, which puts the root in the
  middle of the branch.

## 3.4.1 — 2026-09-14

Collapsed clades made to fit the rest of the viewer — their shape, labels,
colours, search, selection, re-rooting and tree switching — plus a
Molecular Sequence search that finds sequences again and a node-data
download with a proper header.

### Changed

- **A collapsed clade's wedge** is drawn from its node to the clade's
  nearest tip along one edge and its farthest tip along the other, so the
  shape shows how uneven its branch lengths are. 3.4.0
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
