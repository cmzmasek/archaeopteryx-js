# Archaeopteryx.js
Archaeopteryx.js is a software tool for the visualization and analysis of highly annotated phylogenetic trees.


### npm
https://www.npmjs.com/package/archaeopteryx

### GitHub
https://github.com/cmzmasek/archaeopteryx-js


### Live demos

Self-contained demos, served from this repository (no external dependencies) —
they run entirely in your browser:

**https://cmzmasek.github.io/archaeopteryx-js/**

* [Auspice / Nextstrain JSON](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=auspice)
* [Swine H1 HA1 + alignment (Nexus)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=swh1)
* [BEAST annotations (Nexus)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=beast)
* [SARS-CoV-2 time tree (calendar)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=sarscov2)
* [Herpesviridae DNA polymerase (201 tips)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=herpes_dnapol)
* [Caliciviridae (186 strains)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=caliciviridae_500)
* [Adenoviridae (321 strains)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=adenoviridae)
* [Nucleotide alignment (600 columns)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=alignment_nt)
* [Sequence alignment](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=alignment)
* [Influenza HA (annotated)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=influenza)
* [Dinosaur time tree](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=dinosaur)
* [Ammonite time tree (fossil ranges)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=ammonite)
* [Apaf-1 gene family](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=apaf)
* [Bcl-2 family](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=bcl2)
* [Confidence values](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=confidences)
* [Branch events](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=branch_events)
* [Influenza A H5Nx (354 strains)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=flu_h5)
* [Start circular](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=circular)
* [Woese tree of life (start unrooted)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=woese)
* [Start with collapsed controls](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=collapsed)


### Detailed developer documentation
https://docs.google.com/document/d/1COVe0iYbKtcBQxGTP4_zuimpk2FH9iusOVOgd5xCJ3A/edit

### Dependencies
Archaeopteryx.js has the following dependencies:
 * forester.js: https://www.npmjs.com/package/archaeopteryx
 * phyloxml.js: https://www.npmjs.com/package/phyloxml
 * d3.js (version 7): https://www.npmjs.com/package/d3
 * sax.js (1.6.1): https://www.npmjs.com/package/sax/v/1.6.1
 
For **raster PNG export** (optional — the PNG entry appears in the Download
menu only when `window.Canvg` is present):
 * canvg (4.x): https://www.npmjs.com/package/canvg — publishes ES modules
   only (no classic-script global build), so bridge it yourself:
   ```html
   <script type="module">
       import {Canvg} from 'http://path/to/canvg.js'; // a self-contained build; see below
       window.Canvg = Canvg;
   </script>
   ```
   A module script is deferred regardless of where it sits in the page, and
   PNG export only runs later from a Download click, so this can go anywhere
   before the click — it does not need to precede archaeopteryx.js's own
   `<script>` tag. `docs/lib/canvg.js` in this repository is one such
   self-contained build (npm's `canvg@4.0.3` bundled into one file, e.g. via
   `esm.sh/canvg@4?bundle`, with its one unnecessary Node-environment shim
   import removed — see the file's own header comment).

For **vector PDF export** (optional — the PDF entry appears in the Download
menu only when both are loaded before archaeopteryx.js):
 * jspdf (4.x): https://www.npmjs.com/package/jspdf
 * svg2pdf.js (2.8.x): https://www.npmjs.com/package/svg2pdf.js

File (Newick/New Hampshire, Nexus, phyloXML, FASTA) and SVG download, as well as saving
the exported PNG, use native browser APIs (`Blob`, `canvas.toBlob()`, and an
`<a download>` link), so Blob.js, canvas-toBlob.js and FileSaver.js are no longer
required.

The user interface (control panel, sliders, dialogs) is built with native DOM
elements, so **jQuery and jQuery UI are no longer required** — neither their
JavaScript nor jQuery UI's CSS.


## Basic Example of HTML for launching Archaeopteryx.js

Example of HTML page to launch a basic Archaeopteryx.js instance:
```html
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8">
   <title>Archaeopteryx.js Basic Demo</title>

   <!-- D3.js (version 7):-->
   <script src="https://d3js.org/d3.v7.min.js"></script>

   <!-- SAX XML parser (needed by phyloxml.js):-->
   <script src="http://path/to/sax.js"></script>

   <!-- Archaeopteryx.js requires forester.js and phyloxml.js:-->
   <script src="http://path/to/phyloxml.js"></script>
   <script src="http://path/to/forester.js"></script>
   <script src="http://path/to/archaeopteryx.js"></script>

   <script>
       function load() {
           var config = {};
           var loc = 'http://path/to/apaf.xml';

           fetch(loc)
               .then(function (response) {
                   if (!response.ok) {
                       throw new Error('HTTP ' + response.status + ' loading ' + loc);
                   }
                   return response.text();
               })
               .then(function (data) {
                   archaeopteryx.launchArchaeopteryx('#phylogram1', loc, data, config);
               })
               .catch(function (e) {
                   document.getElementById('phylogram1').textContent = 'Error: ' + e.message;
               });
       }
   </script>
</head>

<body onload="load()">
<div>
   <h2>Archaeopteryx.js Basic Demo</h2>
   <div id='phylogram1'></div>
</div>
</body>
</html>
```

Archaeopteryx.js reports problems by **throwing**, so wrap the call (or use the
promise's `.catch`, as above) if you want to show the message yourself. See
[For Developers](#for-developers) below for what goes into `config`.




## Using the visualizations

A tree opens **already coloured** by its most informative field — the viewer
inspects what the tree carries (taxonomy, sequence fields, custom properties)
and decides by itself what is worth showing. There is nothing to configure.

* The **Color** and **Shape** menus (top of the control panel) list every
  field worth visualizing, best first. Colouring paints the node label and
  the node itself; shapes draw a symbol per value. Fields with many values
  (hosts, species) sit at the end of the Color list — they are offered, but
  never chosen for you.
* Numeric fields with few values are treated as **codes** (H5N1 vs H5N2)
  and get individual colours; with many values they become a **gradient**
  (years). The legend's `[colors]` / `[gradient]` chip switches between the
  two where both make sense.
* The **legend** is a card you can **drag anywhere**. It shows a colour and
  a **count** per value, `[by count]` / `[A-Z]` toggles the order, a dashed
  **no value** row counts the nodes the field does not cover, and very long
  legends show the top 20 with a `[+N more]` chip. Legends are part of PNG,
  PDF
  and SVG exports (exports always come out light).
* **Switch into a subtree** (or delete part of the tree) and the menus,
  counts and legends are re-derived for what is on screen — a field with too
  many values on the full tree may become available inside a clade. Colours
  never change when you do this: a value keeps its colour for the whole
  session.
* The **Visualizations** checkbox hides the chosen colours/shapes; the
  **Visual Styles** checkbox controls colours embedded in the tree file
  itself (and phyloXML branch colours). Search hits and selections always
  outrank visualization colours. **Esc** returns to the opening state.

## Layouts

Three layouts, switched with the second row of buttons at the top of the
panel: **rectangular** (root at left), **circular**, and **unrooted** — the
desktop's equal-angle fan, where each subtree opens a wedge proportional to
how many tips it holds.

In the two radial layouts the zoom row changes meaning, exactly as on the
desktop: **Y+ / Y− become the plain + / − zoom** (a circle has one diameter;
the mouse wheel zooms too, and never rotates), **X− / X+ become rotate** (a
32nd of a turn per press), and the fit-width slot becomes the **node label
direction** flip — labels riding their spokes or standing upright — while
vertical expansion greys out. **Fit** centres and scales the fan; **Esc**
also resets rotation and label direction. Unrooted
additionally greys out the aligned-phylogram option and Auto-hide Labels
(there is no common label edge, and no even row spacing to hide against).

## Searching

Two search boxes (A and B), each with its own **field** menu (built from what
the tree actually carries — names, taxonomy and sequence fields, every custom
property, branch lengths, confidences, structural values) and **match mode**
(contains / starts with / ends with / whole word / regex for text;
`= != < <= > >= range` for numbers). Inside one box, `,` means OR and `+` means AND (plain-text
modes only); **Combine A & B** intersects or unites the two. **Match case**
and **Inverse** apply to both.

Hits are hard to miss: their labels take the search colour **in bold**, a
translucent **pulsing halo** breathes behind each hit, and everything that is
*not* a hit fades — the desktop's "dim non-matches", engaged only while at
least one hit is actually visible, so a fruitless search never washes the
tree out. The **overview** miniature marks every hit as a dot in the same
colour, and a **◀ k / N ▶** navigator appears under the search boxes: each
press centres the previous / next hit in the viewport, wrapping around.

## Keyboard

Deliberately minimal: **Esc** or **Home** resets the view, **O** cycles the
overview between corners, **PageUp / PageDown** change the font size — and
the **mouse wheel** zooms (Shift: vertical only; Shift+Alt: horizontal;
Ctrl+Shift: font size). Everything else is a button; the old Alt+letter
combos are gone (macOS labels that key Option and types glyphs with it).
Nothing fires while the cursor is in a text box.

## Sequence alignments

A tree whose tips carry `<mol_seq is_aligned="true">` shows the alignment as
a residue track beside the tree (rectangular layout only — an alignment is
inherently horizontal). Amino acids use a physico-chemical colour scheme,
nucleotides one colour per base — decided from the residues themselves — with
gaps drawn as faint dashes that join into lines, so indel blocks read at a
glance.

A long alignment shows a scrollable **window** (at most ~60% of the display):
drag the slider at the window bottom, or roll the mouse wheel over the track;
the tree itself never moves. Under the rows sit a **conservation** bar per
column with the consensus residue beneath it (scored over the tips currently
displayed), and a 1-based **column ruler**. **Hover any residue** for its
alignment column, its position within that sequence's own ungapped residues,
its full name, class, and Kyte-Doolittle hydropathy. The **Alignment**
checkbox under Display Data toggles the whole track.

Alignments arrive with the tree: as phyloXML `<mol_seq is_aligned="true">`
elements, or in a **Nexus** file whose characters matrix accompanies its tree.
The **Nexus** entry in the Download menu writes the current tree *and* its
alignment back into one Nexus file (Taxa, Characters and Trees blocks).

## Time trees

A tree whose nodes carry phyloXML `<date>` elements is drawn against time.
Ages (`unit="mya"` and friends, or values that look like ages) get the
**geologic axis**: two rows of ICS intervals in their official colours —
Period over Epoch for most trees, coarser pairs for Precambrian-deep ones —
plus a "Ma before present" ruler. Years (`unit="year"`, or values that look
like calendar years) get a labelled **calendar axis** instead. The tree's
layout itself never changes: time is an overlay calibrated by the dates, so
it also works for a fossil-only tree, where the axis simply stops at the
youngest tip and labels that age (the ammonite demo ends at the K-Pg, 66).

Nodes with a date **range** (`minimum`/`maximum` — minimum is the younger
bound) draw uncertainty bars: translucent blue **HPD age bars** on internal
nodes, sepia **fossil-range (FAD/LAD) bars with end caps** on tips. Node
tooltips show the date. The **Time Axis** checkbox under Display Data toggles
everything; the axis needs a phylogram (branch lengths carry the time) and
the rectangular layout. **Time Grid** (off by default, like the desktop's
"Time axis grid lines") adds faint vertical lines behind the tree at the
fine geologic-interval boundaries or the calendar year ticks, so a node's
position can be read against the axis.

# forester.js
forester.js is a general suite for dealing with phylogenetic trees.

## forester.js Example

This basic example shows how to parse a New Hampshire formatted String
into to a object representing a phylogenetic tree.
Followed by pre- and post-order traversal,
and writing back to a New Hampshire formatted String.

Change './forester' to 'forester' if you use this code outside of this package

```
var forester = require('./forester').forester;

var newHampshireFormattedString = "(((a:1,b:1,c:1)N:2,(d:1,e:1)M:4)O:4,f:1)R:1;";
var phylogeneticTree = forester.parseNewHampshire(newHampshireFormattedString);

console.log('Pre-order traversal:');
forester.preOrderTraversalAll(forester.getTreeRoot(phylogeneticTree), function (n) {
    console.log(n.name + ':' + n.branch_length);
});

console.log('Post-order traversal:');
forester.postOrderTraversalAll(forester.getTreeRoot(phylogeneticTree), function (n) {
    console.log(n.name + ':' + n.branch_length);
});

console.log('In New Hampshire format:');
var nh = forester.toNewHampshire(phylogeneticTree);
console.log(nh);
```

Expected output:

```
Pre-order traversal:
R:1
f:1
O:4
M:4
e:1
d:1
N:2
c:1
b:1
a:1
Post-order traversal:
a:1
b:1
c:1
N:2
d:1
e:1
M:4
O:4
f:1
R:1
In New Hampshire format:
(((a:1,b:1,c:1)N:2,(d:1,e:1)M:4)O:4,f:1)R:1;
```







# For Developers

This section describes the two configuration objects Archaeopteryx.js accepts.
It is generated against the current source; if something here disagrees with
the code, the code is right and this is a bug.

## The entry points

```js
// parse and launch in one step (what most callers want); fetch the file
// content yourself -- the library does no networking
const viewer = archaeopteryx.launchArchaeopteryx(container, fileName, data, config);

// or parse yourself, then launch
const tree = archaeopteryx.parseTree(fileName, data);
const viewer = archaeopteryx.launch(container, tree, config);

// later, e.g. when an SPA removes the view:
viewer.destroy();
```

Both entry points take **exactly** the arguments shown — a call with the old
trailing arguments (the separate settings bag, `nodeVisualizations`,
`nodeLabels`, `specialVisualizations`, or the positional Newick parse
options) **throws** with a message saying where each one went: everything now
lives in the **one config object** (`nodeLabels`,
`nhConfidenceValuesInBrackets`, `nhConfidenceValuesAsInternalNames` are
config keys). `config` itself is optional — `archaeopteryx.launch('#phylogram1',
tree)` works.

`container` is a **CSS selector or the DOM element itself** (frameworks hand
you elements). A container that cannot be resolved **throws** — it used to
render nothing and say nothing. Both entry points return a **viewer handle**:

```js
viewer.getSelectedNodes(); // the node-menu selections (enableManualNodeSelection)
viewer.destroy();          // unmount COMPLETELY: the container DOM, the node
                           // menu / dialogs / alignment scroller, the window
                           // resize listener and every page-level key/wheel
                           // handler; a later launch() works normally
```

One viewer per page: the library keeps its display state in one place, so a
second launch — into any container — replaces the first. Launching into the
same container is the supported way to switch trees (the demo pages do
exactly that).

### Loading the library

One file, loadable every way an embedder might want it:

* **`<script>` tags** (the classic path): load `d3` (v7), `sax`, `phyloxml`,
  `forester`, then `archaeopteryx`; use `window.archaeopteryx`.
* **AMD** (Dojo, RequireJS): `require(['archaeopteryx'], ...)` — the module
  reads its dependencies off the page's globals when first required (so load
  the dependency scripts first), and also still sets `window.archaeopteryx`.
* **CommonJS / bundlers / Node**: `const {archaeopteryx} =
  require('archaeopteryx')` — with **TypeScript definitions** included
  (`archaeopteryx.d.ts` types the whole config object and the handle). In
  plain Node, with no d3 at all, every **parser** works
  (`archaeopteryx.parseNexus(...)` etc.); only `launch()` needs a browser
  and d3, and says so by name. `forester` is importable as the extensionless
  subpath `require('archaeopteryx/forester')` (the package's exports map
  defines exactly that path).

Dependencies are checked when used, never at load time, and every failure
names exactly what is missing (including "the loaded d3 is not usable as d3
version 7"). The optional export libraries stay page-level globals in every
loading style: `window.Canvg` (PNG), `window.jspdf` + svg2pdf.js (PDF).

The parser is picked from the data and the `location`: content starting with
`#NEXUS` (or a name ending in `.nex`/`.nexus`) is read as Nexus, JSON content
(or a name ending in `.json`) as an **Auspice/Nextstrain v2** `dataset.json`,
a name ending in `xml` as phyloXML, anything else as New Hampshire (Newick).
A Nexus file shows its **first** tree; a protein/DNA/RNA characters matrix in
the file (sequential or interleaved) lands on the tips as an aligned
`mol_seq`, so the alignment track appears just as it does for phyloXML.

An Auspice dataset opens on the **time view** (branch lengths from `num_date`
differences; a divergence-only build falls back to `div` differences): the
calendar time axis and node-age bars come from `num_date` and its confidence
interval, and every trait (country, host, clade, ...) becomes a
`nextstrain:<trait>` node property — so Color-by, search and the node dialog
pick them up. Both metrics are retained, and
`forester.applyTimeBranchLengths(phy)` /
`forester.applyDivergenceBranchLengths(phy)` /
`forester.hasTimeAndDivergence(phy)` are the plumbing for a future
time↔divergence display toggle.

**BEAST-style and NHX annotations** in Newick/Nexus input are always parsed
(they used to be discarded): in a `[&key=value,...]` blob — as written by
BEAST, BEAST 2, TreeAnnotator, FigTree and MrBayes — `posterior`, `prob`
(+`prob_stddev`) and `bootstrap` become confidences, node `height`
(median/mean) with its `95%_HPD` (or range) becomes the node date the age
bars draw, FigTree's `!color` becomes the branch colour, and every other
field (`rate`, traits, ...) becomes a `beast:<key>` node property for
Color-by and search. Classic `[&&NHX:...]` tags map to their phyloXML
equivalents (`S=` taxonomy, `T=` taxonomy id, `B=` support, `D=`
duplication/speciation event, `GN=`/`AC=` sequence name/accession). Plain
`[number]` brackets keep their old meaning (confidence values).

Both entry points **throw** on bad input — an undefined or empty tree, an
unparseable file, or a config key that no longer exists. Nothing is reported by
a popup any more, and nothing fails silently.

## Supported file formats

| Format | I/O | What Archaeopteryx.js does with it | Ref. |
|---|---|---|---|
| **Newick** / New Hampshire (`.nwk`, `.nh`, `.tre`) | in / out | The base tree: topology, names, branch lengths, and bracketed confidence values. | [1] |
| **NHX** — New Hampshire eXtended | in | `[&&NHX:...]` tags riding on Newick: taxonomy (`S=`, `T=`), sequence (`GN=`, `AC=`), support (`B=`), duplication/speciation events (`D=`). | [2] |
| **Nexus** (`.nex`, `.nexus`) | in / out | One file for the tree(s) and, in a `CHARACTERS`/`DATA` block, an aligned protein/DNA/RNA matrix (sequential or interleaved) — the tree and its alignment together. | [3] |
| **phyloXML** (`.xml`) | in / out | The richest native format: taxonomy, sequences and alignments, dates, confidences, branch colours and arbitrary custom properties. | [4] |
| **Auspice / Nextstrain** `dataset.json` (v2) | in | Phylodynamic builds: sampling dates and their confidence, cumulative divergence, and discrete traits (country, clade, host, ...) with their posterior distributions. | [5] |
| **BEAST** / BEAST 2 / TreeAnnotator annotations | in (embedded in Newick/Nexus) | `[&posterior=...,height_95%_HPD={lo,hi},rate=...]`-style blobs: posterior clade support, node-age confidence intervals, per-branch rates and other traits. FigTree's `!color` is read the same way. | [6, 7] |
| **MrBayes** annotations | in (embedded in Newick/Nexus) | `prob=`/`prob.stddev=` blobs: posterior-probability clade support. | [8] |
| **FASTA** | out | The molecular sequence(s) of the selected tip(s), or every sequence the tree carries. Offered in the Download menu only when the tree actually carries molecular sequences (aligned or not). | [9] |
| SVG · PNG · vector PDF | out | A snapshot of the drawn tree for publication or further editing — vector (SVG, PDF) or raster (PNG). General-purpose graphics formats, not phylogenetic data, so no literature reference applies. | — |

The parser for a given input is auto-detected (see **The entry points**
above); the Download menu offers whichever output formats the current tree
can carry.

### References

1. Felsenstein, J. *PHYLIP (Phylogeny Inference Package)*. Department of
   Genome Sciences, University of Washington, Seattle. The Newick tree
   format itself has no single peer-reviewed citation — it was agreed at a
   1986 meeting of phylogenetics software authors at Newick's Lobster
   House, Dover, New Hampshire, and has since been documented in the
   PHYLIP distribution and in most subsequent tree-software manuals.
2. Zmasek, C.M., Eddy, S.R. (2001). ATV: display and manipulation of
   annotated phylogenetic trees. *Bioinformatics*, 17(4), 383–384.
3. Maddison, D.R., Swofford, D.L., Maddison, W.P. (1997). NEXUS: an
   extensible file format for systematic information. *Systematic
   Biology*, 46(4), 590–621.
4. Han, M.V., Zmasek, C.M. (2009). phyloXML: XML for evolutionary biology
   and comparative genomics. *BMC Bioinformatics*, 10, 356.
5. Hadfield, J., Megill, C., Bell, S.M., Huddleston, J., Potter, B.,
   Callender, C., Sagulenko, P., Bedford, T., Neher, R.A. (2018).
   Nextstrain: real-time tracking of pathogen evolution. *Bioinformatics*,
   34(23), 4121–4123.
6. Drummond, A.J., Rambaut, A. (2007). BEAST: Bayesian evolutionary
   analysis by sampling trees. *BMC Evolutionary Biology*, 7, 214.
7. Bouckaert, R., Vaughan, T.G., Barido-Sottani, J., Duchêne, S., Fourment,
   M., Gavryushkina, A., Heled, J., Jones, G., Kühnert, D., De Maio, N.,
   Matschiner, M., Mendes, F.K., Müller, N.F., Ogilvie, H.A., du Plessis,
   L., Popinga, A., Rambaut, A., Rasmussen, D., Siveroni, I., Suchard,
   M.A., Wu, C.-H., Xie, D., Zhang, C., Stadler, T., Drummond, A.J. (2019).
   BEAST 2.5: an advanced software platform for Bayesian evolutionary
   analysis. *PLoS Computational Biology*, 15(4), e1006650.
8. Ronquist, F., Teslenko, M., van der Mark, P., Ayres, D.L., Darling, A.,
   Höhna, S., Larget, B., Liu, L., Suchard, M.A., Huelsenbeck, J.P. (2012).
   MrBayes 3.2: efficient Bayesian phylogenetic inference and model choice
   across a large model space. *Systematic Biology*, 61(3), 539–542.
9. Pearson, W.R., Lipman, D.J. (1988). Improved tools for biological
   sequence comparison. *Proceedings of the National Academy of Sciences
   USA*, 85(8), 2444–2448.

## Intelligent pre-sets

Almost everything that used to be configured is now read off the tree: a tree
with taxonomies shows taxonomies and offers a Taxonomy control, a tree without
them shows neither; a tree whose branches mostly carry lengths is drawn to
scale, one whose branches mostly do not is drawn as a cladogram.

So **the best configuration is usually an empty one**. What is left is the
handful of things no tree can answer for you: which layout, how the viewer is
sized, what the surrounding application allows, and what to prefill the search
boxes with.

Everything else is either derived, or a control the user can change once the
tree is on screen. Those controls still have defaults, and the defaults are
chosen per tree — they are simply no longer yours to set at launch.

That includes **which label checkboxes start checked**: instead of blindly
showing every field the tree carries, the viewer measures the actual label
text and unchecks fields that only repeat another field or that would make
the combined labels uselessly long (see *Initial label fields* in the
developer spec below). The checkboxes are still there to override it.

The same data-driven rule applies to the two big overlays: a tree whose tips
carry an aligned `mol_seq` opens with its **sequence alignment** showing, and
a tree with phyloXML `<date>` elements opens with its **time axis** drawn —
each with a checkbox under Display Data to turn it off.

Support and branch-length values draw **2 px smaller than the label font**
(never below 6 px), as on the desktop, so they annotate without competing.
And besides the numeric display there are **Support Dots**: a filled dot at
the midpoint of every branch whose support is at least 95% (`supportDotMinimum`;
posterior- and bootstrap-scaled trees are told apart automatically). The dot
is always a fixed amount wider than the branch itself, so it tracks the
Branch Width slider instead of sitting at one fixed size. A branch drawn
shorter than the dot itself stays clean.

## Configuration

One object, passed as the third argument. It is optional, and the best
configuration is usually an empty one — almost everything that used to be
configured is now read off the tree (see **Intelligent pre-sets** above). The
twenty-eight keys below are the ones no tree can answer for you.

There used to be two objects, `options` and `settings`, split by whether the
user could also change the value from the control panel. That was a fact about
the internals, not something a caller could derive, and getting it wrong was
silent: the right name in the wrong object did nothing at all. There is now one
object. A fourth argument is still accepted and merged, so existing call sites
keep working; it logs a deprecation warning.

### Still used

| Key | Default | What it does |
| --- | --- | --- |
| `collapseControlPanel` | `false` | Open with the control panel collapsed to just its header bar — the same state its own hide/show button toggles. |
| `enableDynamicSizing` | `true` | Size the tree to its container, and follow window resizes. |
| `displayWidth` | `800` | Width — only when dynamic sizing is off. |
| `displayHeight` | `600` | Height — only when dynamic sizing is off. |
| `zoomToFitUponWindowResize` | `true` | Re-fit the tree after a window resize. |
| `rootOffset` | `254` | Distance from the left edge to the root. The default clears the control panel: its inset plus its width plus a margin. |
| `layout` | `'rectangular'` | The starting layout: `'rectangular'`, `'circular'`, or `'unrooted'`. |
| `ladderizeTree` | `true` | Ladderize the tree on load: at each node, the larger clade first (any number of children, so a polytomy sorts too). |
| `showMsa` | tree-derived | Open with the alignment track shown. Default: on when the tree carries an aligned `mol_seq`, off otherwise — an explicit `true`/`false` overrides that. |
| `showTimeAxis` | tree-derived | Open with the time axis shown. Default: on when the tree carries `<date>` elements, off otherwise — an explicit `true`/`false` overrides that. |
| `timeAxisGrid` | `false` | Open with the Time Grid vertical lines on (only meaningful — and only offered as a checkbox — while the time axis itself is shown). |
| `showSupportDots` | `false` | Open with the Support Dots marks on (the checkbox appears whenever the tree has confidences). |
| `supportDotMinimum` | `95` | Support Dots threshold, as a percentage. On a tree whose confidences top out at 1 (posterior probabilities) it is read on the 0–1 scale, so the default means ≥ 0.95 there and ≥ 95 on a bootstrap tree. |
| `searchAinitialValue` | `null` | Prefill search box A. |
| `searchBinitialValue` | `null` | Prefill search box B. |
| `enableVisualizations` | `true` | Offer the Color / Shape visualizations (which fields they cover is decided from the tree). |
| `initialVisualization` | `null` | The visualization to open with, by its Color-menu name (e.g. `'Host'`; case-insensitive). A name the tree cannot honour logs a console warning and falls back to the automatic choice, so a site-wide value is safe on trees without that field. Default: Archaeopteryx.js picks the most informative field itself. |
| `visualizationsLegendXpos` | `254` | Legend position, x. |
| `visualizationsLegendYpos` | `30` | Legend position, y. |
| `enableDownloads` | `true` | Offer the download buttons. |
| `pngExportScale` | `4` | PNG export resolution multiplier. |
| `nhExportWriteConfidences` | `true` | Write confidences into exported Newick. |
| `nhConfidenceValuesInBrackets` | `true` | Newick parsing: read `[90]`-style bracketed values as confidences. |
| `nhConfidenceValuesAsInternalNames` | `false` | Newick parsing: read internal node names as confidence values. |
| `nodeLabels` | `null` | Custom label-field checkboxes: `{key: {label, description, propertyRef, showButton, selected}}` — each adds a panel checkbox labelling nodes with the named property's value. (Was `launch()`'s sixth positional argument.) |
| `enableSubtreeDeletion` | `true` | Offer node / subtree deletion in the node menu. |
| `enableAccessToDatabases` | `true` | Offer the “Access DB” link in the node menu. |
| `enableManualNodeSelection` | `false` | Add the Select/Deselect entries to the node menu. |

### Anything else throws

An unrecognised key is an error, whether it was removed in this modernization
or simply mistyped:

```
ArchaeopteryxJS: ERROR: removed config key(s) passed to launch:
"circular" -- renamed to "layout": use layout: "circular"

ArchaeopteryxJS: ERROR: unknown config key(s) passed to launch: "enableDownlods"
```

An ignored key looks like it worked. If you are upgrading, run once and fix
whatever it names.

### What replaced the rest

A few of these are worth spelling out, because they are decisions rather than
constants:

* **Phylogram or cladogram** — the tree is drawn to scale when **more than half
  its branches carry a positive length**. A tree where a handful of branches
  have a length and the rest do not is not a phylogram with gaps; it is a
  cladogram, and is now drawn as one.
* **Branch width** — `2` for a tree of 50 tips or fewer, `1` above that.
  Hairlines suit a crowded tree; on a dozen branches they just look faint.
* **Labels** — node names, taxonomy, sequences, confidences and events are each
  shown when the tree actually contains them.
* **Short names** — on from the start when the tree has names longer than 18
  characters, off otherwise. The checkbox is always there either way.
* **Font** — one size (11) for every label, in whichever sans-serif the
  reader's own system renders best.

### Removed — passing these throws

All 118 of them, alphabetically:

| Key | Why, and what to do instead |
| --- | --- |
| `alignPhylogram` | Aligning the tips is a control, not a launch option. |
| `allowManualNodeSelection` | Renamed to `enableManualNodeSelection`. |
| `backgroundColorDefault` | The background is fixed. |
| `backgroundColorForPrintExportDefault` | The export background is fixed. |
| `border` | Style the tree's svg with CSS instead. |
| `branchColorDefault` | The default branch colour is fixed. |
| `branchDataFontSize` | Font size is fixed at launch (derived: 2px smaller than labels, floor 6px) and changed only via the in-panel Font slider — not a launch config key. |
| `branchWidthDefault` | Branch width follows the size of the tree. |
| `circular` | Renamed to `layout` (use `layout: 'circular'`). |
| `circularDisplay` | Replaced by `layout`: `'rectangular'` \| `'circular'` \| `'unrooted'`. |
| `collapsedLabelLength` | The collapse feature was removed. |
| `collapseLabelWidth` | The collapse feature was removed. |
| `controls0` | The control panel is created inside the tree's own container now. |
| `controls0Left` | The control panel is placed against the tree; drag it to move it. |
| `controls0Top` | The control panel is placed against the tree; drag it to move it. |
| `controls1` | The visualization menus moved into the main control panel. |
| `controls1Left` | The visualization menus moved into the main control panel. |
| `controls1Top` | The visualization menus moved into the main control panel. |
| `controls1Width` | The control panel sizes itself. |
| `controlsBackgroundColor` | The control panel follows the light / dark palette. |
| `controlsFont` | The legend uses the same sans-serif as the rest of the interface. |
| `controlsFontColor` | This never had any effect; the legend follows the tree's label colour. |
| `controlsFontSize` | The legend has one size. |
| `decimalsForLinearRangeMeanValue` | No longer configurable. |
| `defaultFont` | Labels use the sans-serif the reader's own system renders best. |
| `dynahide` | On by default; use the Auto-hide Labels checkbox. |
| `dynamicallyAddNodeVisualizations` | Visualizations are always derived automatically from the tree now. |
| `enableBranchVisualizations` | Merged into `enableVisualizations`. |
| `enableCollapseByBranchLenghts` | The collapse feature was removed. |
| `enableCollapseByFeature` | The collapse feature was removed. |
| `enableCollapseByTaxonomyRank` | The collapse feature was removed. |
| `enableMsaResidueVisualizations` | Colouring by aligned residue was removed. |
| `enableNodeVisualizations` | Merged into `enableVisualizations`. |
| `enableSpecialVisualizations2` | The special visualizations were removed. |
| `enableSpecialVisualizations3` | The special visualizations were removed. |
| `enableSpecialVisualizations4` | The special visualizations were removed. |
| `externalNodeFontSize` | Font size is fixed at launch (11px) and changed only via the in-panel Font slider — not a launch config key. |
| `filterValues` | Reshape the tree's properties yourself before calling launch. |
| `fontSize` | One default size for every label; the font-size slider changes it. |
| `found0and1ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `found0ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `found1ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `groupSpecies` | This setting was never read; it did nothing. |
| `groupYears` | This setting was never read; it did nothing. |
| `initialCollapseDepth` | The collapse feature was removed. |
| `initialCollapseFeature` | The collapse feature was removed. |
| `initialLabelColorVisualization` | Choose the visualization in the Visualizations panel. |
| `initialNodeFillColorVisualization` | Choose the visualization in the Visualizations panel. |
| `internalNodeFontSize` | Font size is fixed at launch (11px) and changed only via the in-panel Font slider — not a launch config key. |
| `labelColorDefault` | The default label colour is fixed. |
| `minBranchLengthValueToShow` | No longer configurable. |
| `minConfidenceValueToShow` | No longer configurable. |
| `nameForFastaDownload` | Download names follow `treeName`. |
| `nameForNhDownload` | Download names follow `treeName`. |
| `nameForPhyloXmlDownload` | Download names follow `treeName`. |
| `nameForPngDownload` | Download names follow `treeName`. |
| `nameForSvgDownload` | Download names follow `treeName`. |
| `nhExportReplaceIllegalChars` | Always on; Newick cannot carry those characters. |
| `nodeLabelGap` | The label gap is fixed. |
| `nodeSizeDefault` | Node size is fixed; the Node size slider changes it. |
| `nodeVisualizations` | The visualization-dictionary mechanism (with its per-visualization regex matching) was removed for good; visualizations are derived automatically from the tree itself. Throws as a config key — and any old positional argument after `config` is rejected by count. |
| `nodeVisualizationsOpacity` | No longer configurable. |
| `orderTree` | Renamed to `ladderizeTree`, to match the wording used everywhere else. |
| `phylogram` | The tree is drawn to scale when most of its branches have a length. |
| `propertiesToIgnoreForNodeVisualization` | Every property the tree carries is offered; choose what to show in the panel. |
| `searchFieldWidth` | The search boxes size themselves to the control panel. |
| `searchIsCaseSensitive` | Off by default; use the Match case checkbox. |
| `searchIsPartial` | Each search box picks its own match mode (contains / starts with / ends with / whole word / regex). |
| `searchNegateResult` | This is the state of the Inverse checkbox, not an input. |
| `searchProperties` | Choose the property in the search box's field menu instead. |
| `searchUsesRegex` | Choose the `regex` match mode in the search box instead. |
| `selectedColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `shortenNodeNames` | On by default when the tree has long node names; use the Short Names checkbox. |
| `showBranchColors` | Merged into the Visual Styles checkbox, like the desktop's `Visual Styles/Branch Colors`. |
| `showBranchColorsButton` | The Visual Styles checkbox appears when the tree has branch colours or style properties. |
| `showBranchEvents` | Shown when the tree has branch events. |
| `showBranchLengthValues` | Off by default; use the Branch Length checkbox. |
| `showBranchVisualizations` | Node and branch visualizations are one switch now; use the Visualizations checkbox. |
| `showConfidenceValues` | Shown when the tree has confidences. |
| `showDistributions` | Off by default. |
| `showDynahideButton` | Shown automatically once the tree has enough tips to need it. |
| `showExternalLabels` | On by default; use the Ext. Labels checkbox. |
| `showExternalLabelsButton` | Always shown. |
| `showExternalNodes` | Node shapes now appear wherever a node visualization applies. |
| `showExternalNodesButton` | The Ext. Nodes switch no longer exists. |
| `showInternalLabels` | Off by default; use the Int. Labels checkbox. |
| `showInternalLabelsButton` | Shown automatically when the tree has internal node data. |
| `showInternalNodes` | Node shapes now appear wherever a node visualization applies. |
| `showInternalNodesButton` | The Int. Nodes switch no longer exists. |
| `showNodeEvents` | Shown when the tree has node events. |
| `showNodeName` | Shown when the tree has node names. |
| `showNodeNameButton` | Shown automatically when the tree has node names. |
| `showNodeVisualizations` | Node and branch visualizations are one switch now; use the Visualizations checkbox. |
| `showSearchPropertiesButton` | Properties are searched by choosing them in a search box's field menu. |
| `showSequence` | Shown when the tree has sequences. |
| `showSequenceAccession` | Sequence labelling follows what the tree contains. |
| `showSequenceButton` | Shown automatically when the tree has sequences. |
| `showSequenceGeneSymbol` | Sequence labelling follows what the tree contains. |
| `showSequenceName` | Sequence labelling follows what the tree contains. |
| `showSequenceSymbol` | Sequence labelling follows what the tree contains. |
| `showShortenNodeNamesButton` | Shown automatically when the tree has long node names. |
| `showTaxonomy` | Shown when the tree has taxonomies. |
| `showTaxonomyButton` | Shown automatically when the tree has taxonomies. |
| `showTaxonomyCode` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyCommonName` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyRank` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyScientificName` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomySynonyms` | Taxonomy labelling follows what the tree contains. |
| `showVisualizations` | Off by default; use the Visualizations checkbox. |
| `specialVisualizations` | Removed along with the enableSpecialVisualizations2/3/4 settings. Throws as a config key — and any old positional argument after `config` is rejected by count. |
| `textFieldHeight` | The text fields size themselves to their content. |
| `treeName` | The name comes from the tree file. |
| `unrootedDisplay` | Replaced by `layout`; use `layout: 'unrooted'`. |
| `useVisualStyles` | On by default; use the Visual Styles checkbox. |
| `valuesToIgnoreForNodeVisualization` | Every value is shown; choose what to show in the panel. |
| `visualizationsLegendOrientation` | The legend orientation is fixed; the legend has its own control. |
| `visualizationsLegendXposOrig` | Internal bookkeeping; set visualizationsLegendXpos. |
| `visualizationsLegendYposOrig` | Internal bookkeeping; set visualizationsLegendYpos. |

## The automatic visualization system (developer spec)

This section, together with **Value grouping** below, is written to be
sufficient for a skilled developer (or another Claude) to rebuild the
system. The division of labour is strict:

* **forester.js decides** — pure, DOM-free, Node-testable functions:
  `visualizationCandidates(tree)` (what to offer and how),
  `visualizationNodeValue(node, candidate)` (a node's folded value),
  `nodeLabelProperty(tree)` (readable tip names),
  `commonNamePrefix(tree, ref)` (shared-prefix for shortening),
  `nodeVisualStyle(node)` (the `style:` namespace), and the `VIS_SYNONYMS`
  dictionary.
* **archaeopteryx.js renders** — builds d3 scales from the descriptors,
  owns one state object (`_vis`), the menus, the legends, and the
  precedence chains below. It contains no classification logic.

The **Color** and **Shape** menus are filled **from the tree alone**. There is
nothing to configure and nothing to pass in: `launch()`'s old
`nodeVisualizations` argument and the `dynamicallyAddNodeVisualizations`
setting are gone, and passing either throws. What is worth offering is
decided by `forester.visualizationCandidates(tree)` and is under test
(`test/visualization_test.js`, 45 tests; the ten demo trees under
`docs/data/` are the fixtures and the executable spec — five of them real
ViPR / BV-BRC virus trees whose messy annotations the rules were tuned
against).

What gets offered, briefly:

* Candidates are taxonomy (code, scientific name, common name), sequence
  (name, symbol, gene name), and node properties. The `style:` namespace is
  never offered — the desktop reserves it for rendering instructions.
* A field must cover at least **⅔ of the external nodes** and have at least
  2 — and fewer than all — distinct values. Identifier-like fields
  (accessions, genome ids) are refused.
* Up to **20** distinct values → **Color** (one fixed, colour-vision-aware
  palette at every cardinality). Fields with **21+ values** (hosts, species)
  are still offered — every value coloured, desktop-style, by extending the
  palette with lightened / darkened cycles — provided their values genuinely
  repeat (distinct ≤ 60% of covered nodes; near-unique fields like strains
  stay out). Their legends show the 20 most frequent values with a
  `[+N more]` chip to expand, and they are listed last and never
  auto-applied. Numeric fields come in three bands: up to
  **10** distinct values default to individual colours — numbers that few are
  usually codes, like HA/NA subtypes — **11–20** default to a viridis
  **colour ramp**, and both of those carry a `[colors]` / `[gradient]` switch
  in their legend; above 20 it is a ramp with no switch. Legends list numeric
  values in numeric order by default (words sort by count).
* Up to **7** distinct values → also **Shape** (the seven distinct d3 symbols).
* A node without a value keeps the default look, and the legend names the
  field so partial coverage is visible.
* Property values are **grouped for colouring after normalization** —
  spelling variants, host/country qualifiers, and a common-animal synonym
  dictionary. The exact algorithm is specified under **Value grouping**
  below; raw values remain untouched everywhere else — exports, search,
  and the node-data dialog.

The menus are ordered **best first** — categorical fields ahead of numeric
ramps, then by coverage × balance (the normalized entropy of the value
distribution), so a field that reads "Nonhuman Mammal" on 92% of its nodes
sits below one that actually splits the tree. **The best candidate is applied
automatically on load**: a tree opens coloured by its most informative field
rather than grey with a menu to discover. Esc resets back to that state.

**Local candidacy, stable identity.** Candidates, bands, counts, menus and
legends always describe the **displayed** tree: switch into a subtree (or
delete part of the tree) and everything is re-derived, so a field that was
refused on the full tree — Species at 66 values, say — is offered inside a
clade where it has six. A value's **colour and shape, by contrast, are
identities**: assigned once per launch and remembered, so nothing recolours
when you dive in and out, and deleting a clade never shifts the colours of
what survives. Numeric ramps are the exception by design — a ramp's colour is
position in the view's range, so a six-year subtree gets a full-width
gradient. Your Color/Shape choice survives a view change when its field is
still a candidate there; otherwise the menu returns to default (and the tree
falls back to `style:` colours where the file carries them). Auto-apply
happens only at launch, and view changes never touch any checkbox. Choosing a
Color also switches the Visualizations checkbox on, since one colour paints
both the label and the node.

### Candidate descriptors

`visualizationCandidates` returns an ordered array of plain objects:

```js
{ id: 'prop:vipr:Genus',        // 'prop:'+ref | 'tax:code' | 'seq:name' | ...
  kind: 'property',             // 'property' | 'taxonomy' | 'sequence'
  ref: 'vipr:Genus',            // property ref; null for element slots
  label: 'Genus',               // prettified for menus and legend titles
  numeric: false,
  coverage: 307, total: 321,    // nodes with a value / external nodes
  values: ['Aviadenovirus', …], // one entry per GROUP (sorted; numeric fields numerically)
  counts: {Aviadenovirus: 12, …},
  canon: {aviadenovirus: 'Aviadenovirus', …},  // group key → display (property fields)
  cut: null,                    // ';' | ':' | null (host/country qualifier)
  score: 0.704,                 // coverage/total × normalized entropy
  colorMode: 'category',        // 'category' | 'range' (the DEFAULT mode)
  switchable: false,            // numeric ≤20 distinct: legend chip may flip the mode
  wide: false,                  // categorical 21+ distinct (legend caps at 20)
  shape: true }                 // ≤7 distinct: also offered in the Shape menu
```

Labels are prettified from refs (underscores → spaces, camelCase split,
lowercase words capitalized, words with capitals kept: `PANGO_Lineage_L0` →
"PANGO Lineage L0"); a cross-namespace label collision falls back to the
verbatim refs.

### Ranking and auto-apply

`score = (coverage / total) × (H / ln distinct)` where
`H = −Σ p·ln p` over the groups, `p = groupCount / coverage` — coverage
times the normalized entropy of the value distribution, so a field that
reads one value on 92% of nodes ranks low even at full coverage. Candidates
sort by **tier** (clean categorical → range → wide), then score descending,
ties by label case-insensitively then id. At launch the viewer applies
`candidates[0]` automatically — unless it is wide — and turns the
Visualizations checkbox on. Auto-apply happens **only** at launch.

### Palettes, scales and shapes

* **Categorical**: `VIS_COLOR_PALETTE`, exactly 20 entries — Observable10
  (`#4269d0 #efb118 #ff725c #6cc5b0 #3ca951 #ff8ab7 #a463f2 #97bbf5
  #9c6b4e #9498a0`) followed by each darkened (× 0.7^0.9 per RGB channel).
  Past 20 (wide fields), `extendedPaletteColor(i)` continues it: cycle
  `k = ⌊i/20⌋` re-uses entry `i mod 20` blended `min(0.55, 0.2·k)` toward
  white (odd cycles) or black (even), via d3.interpolateRgb.
* **Ranges**: 3-stop viridis `#440154 #21908C #FDE725` on a linear scale
  with domain `[min, mean, max]` of the view's **distinct** numeric values
  (mean of distinct values, not of nodes).
* **Shapes**: `['circle','square','diamond','triangle','cross','star','wye']`
  — the 7 genuinely distinct d3 v7 fill symbols.

### Views: local candidacy, stable identity

Candidates, bands, counts, menus and legends always describe the
**displayed** tree. On every view change — switch to subtree, return (whole
or by one), subtree deletion, Esc — `refreshVisualizations()` re-runs the
classifier on `displayedRoot()` (`_in_subtree ? _root : _treeData`). A field
refused on the full tree is offered inside a clade that earns it.

Colour and shape are **identities**, held in launch-lifetime memory maps
(`_vis.colorMemory` / `shapeMemory`, keyed `fieldId → normalizedValue →
colour`; values lowercased for property fields, verbatim for element slots).
First assignment wins forever; new values met in smaller views take the next
free palette slot (`colorNext`/`shapeNext` counters). The launch view
assigns its sorted domain 0,1,2,…, so first-view behaviour equals a plain
indexed palette. **Numeric ramps are the deliberate exception**: their
domain is recomputed per view (a ramp's colour is position in the view's
range, and a six-year subtree deserves a full-width gradient).

A selection survives a view change when its field is still a candidate;
otherwise the menu returns to `default` and the tree falls back down the
precedence chain (often to `style:` colours). View changes move no
checkbox. Esc re-applies the launch auto-choice only if its field still
exists, and clears the per-legend chip states.

### Rendering precedence

Highest first, at each paint:

* **Label colour**: search/selection highlight → active Color visualization
  → `style:font_color` → phyloXML branch colour → theme ink.
* **Node fill**: highlight → duplication/speciation event colour → active
  Color visualization → `style:node_color` (else `style:font_color`) →
  background.
* **Node outline**: darkened highlight → event colour → visualization fill
  → style colour → branch colour → branch default.
* **Node shape path**: suppressed for highlighted/event nodes; chosen Shape
  visualization → `style:node_shape`. A node earns its default dot when a
  Color visualization is active (and no shape was drawn), or when it
  carries `style:node_color` — `font_color` alone paints only the label.

### Legend anatomy

One draggable SVG card per active visualization (colour, then shape,
stacked; both move together, positions from
`visualizationsLegendXpos/Ypos`). Card: background `backgroundColorDefault`
at 0.92 opacity, border `branchColorDefault` at 0.5, radius 5 — all theme
colours, so the always-light export rewrite handles them. Title row: the
candidate's label plus chips laid right-to-left, each shown only when
meaningful: sort (`[by count]` ⇄ `[A-Z]`/`[by value]`; numeric legends
default to value order, word legends to count order), mode
(`[colors]` ⇄ `[gradient]`, switchable numeric fields), expand
(`[+N more]` ⇄ `[fewer]`, wide fields; the cap keeps the 20 most frequent
under either sort order). Rows: 9px rounded swatch (or stroked shape
glyph), value text (ellipsized past 28 chars), count right-aligned at 0.55
opacity; a dashed **no value** row (total − coverage) pinned last. Gradient
legends: a 10px bar filled by an SVG linearGradient whose middle stop sits
at the mean's true position in `[min,max]`, min/max labels beneath, no
sort/expand chips. Text measured with a canvas 2D context in the legend's
font: the tree's font size floored at 11. Chip clicks stopPropagation on
mousedown so they do not start a drag; per-legend chip state lives in
`_vis.legendSortById / colorModeById / legendExpandedById` (keyed by field
id, surviving view changes, cleared by Esc).

### State and code map

All viewer state is one object, `_vis`, reset per launch:
`candidates`, `byId`, `colorId`, `shapeId` (current choices),
`autoColorId`, `labelRef`, `labelPrefix`, `hasStyles` (launch-frozen),
`legendSortById`, `colorModeById`, `legendExpandedById` (per-legend chips),
`colorMemory`, `colorNext`, `shapeMemory`, `shapeNext` (identity maps).
Key viewer functions: `initializeVisualizations` (launch),
`computeVisualizationCandidates(viewRoot)` (descriptors → scales),
`refreshVisualizations` (view change), `visualizationColorFor` /
`makeNodeVisShape` (per-node paint), `displayNodeName` (readable names),
`drawLegendCard` / `addLegends`, `populateVisualizationMenus`.

### Value grouping (normalization + synonym dictionary)

Applies to **node property values only**, and only for colouring/legends:
taxonomy and sequence elements are used verbatim, and node names, exports,
search, autocomplete and the node-data dialog always see the raw values.
Grouping runs **before** classification, so distinct-value counts, the
category/range/wide bands, and the entropy score are all computed on groups.

Each raw value maps to its **display form** by these steps, in order:

1. **Qualifier cut** — only when the ref's local name (the part after the
   last `:` in the ref, compared case-insensitively) is exactly `host` or
   exactly `country`. For `host`, cut at the first `;`; for `country`, at
   the first `:`. No other refs are cut (`host_group`,
   `isolation_country` etc. keep their full values).
2. **Parenthesis repair** — if a cut left an unclosed `(`, truncate at the
   first unmatched `(`. (`Saimiri boliviensis (squirrel monkey; voucher:
   SBB04)` → cut at `;` → repair → `Saimiri boliviensis`.)
3. **Spelling fold** — trim; replace every `_` with a space; collapse each
   whitespace run to a single space; trim again (a leading/trailing `_`
   survives the underscore replacement as a bare space, so the fold is not
   done until this second trim). A value that becomes empty is dropped.
4. **Dictionary lookup** — lowercase the whole folded value and look it up
   in the synonym table below (each canonical name matches itself too). If
   there is no hit and the value ends in a parenthetical, retry once with
   one trailing `(...)` removed (`Bos taurus (cattle)` → `bos taurus`). On
   a hit, the display form is the canonical name. Matching is **whole-value
   only, never substring** — `ferret badger` and `42-day-old pig` keep
   their own groups.

The **group key** is the display form lowercased; values sharing a key are
one group (one legend row, one colour, counts summed). The legend shows the
group's **representative**: the canonical name for dictionary hits;
otherwise the group's most frequent display spelling (ties broken by
code-point order, ascending) with its first character uppercased.

The dictionary (`VIS_SYNONYMS` in forester.js — one constant, extend it
there). Synonyms are matched lowercase. **Cross-implementation contract:**
this dictionary, the element-slot ids (`tax:code`, `seq:name`, ...), and the
verbatim-for-elements rule above are carried identically on the desktop —
extend either side and the other, never just one.

| canonical | synonyms |
| --- | --- |
| Human | humans, homo sapiens, h. sapiens |
| Cow | bovine, calf, cattle, bull, heifer, bos taurus, b. taurus |
| Chicken | broiler chicken, broiler, hen, rooster, gallus gallus, g. gallus, gallus gallus domesticus |
| Mouse | house mouse, murine, mus musculus, m. musculus |
| Rat | brown rat, norway rat, black rat, rattus norvegicus, r. norvegicus, rattus rattus |
| Ferret | domestic ferret, mustela putorius furo, mustela furo, m. putorius furo |
| Guinea pig | cavy, domestic guinea pig, cavia porcellus, c. porcellus |
| Rhesus monkey | rhesus macaque, macaca mulatta, m. mulatta |
| Rabbit | european rabbit, oryctolagus cuniculus, o. cuniculus |
| Dog | canine, canis familiaris, canis lupus familiaris, c. familiaris |
| Cat | feline, domestic cat, felis catus, f. catus, felis silvestris catus |
| Duck | mallard, mallard duck, domestic duck, anas platyrhynchos, a. platyrhynchos |
| Pig | swine, porcine, hog, piglet, sus scrofa, s. scrofa, sus scrofa domesticus |
| Horse | equine, mare, stallion, equus caballus, e. caballus |
| Sheep | ovine, lamb, ewe, ovis aries, o. aries |
| Goat | caprine, capra hircus, c. hircus |
| Camel | dromedary, bactrian camel, camelus dromedarius, camelus bactrianus, c. dromedarius |

This is deliberately **display grouping, not data cleaning**: spelling and
a short list of unambiguous synonyms, nothing semantic beyond it. It goes
one step further than the desktop (which folds spellings and
`human → Homo sapiens` only) — the dictionary, the parenthesis repair, and
folding to capitalized common names (`Human`, not `Homo sapiens`) are this
viewer's own choices.

### Readable tip names

Database exports often name their tips with identifiers
(`PATRIC.10334.249.FJ478159…`, `11320.305060`) while carrying the readable
name in a property such as `BVBRC:genome_name`. When at least 80% of the tip
names look like identifiers and a `…name` property is well-covered, mostly
distinct and mostly wordy, that property is **displayed as the tip label**
instead (`forester.nodeLabelProperty` makes the call, under test). Readable
names are never overridden, exports and the node-data dialog keep the real
name, and searching Node Name still searches the real name.

Shortened names drop the boring part first: when every tip shares a long
prefix ("Influenza A virus …"), Short Names strips it before truncating, so
what survives is the part that tells the tips apart ("A/duck/V..668/2017"
rather than 300 identical "Influenz.." labels).

Both menus live in the single control panel, above Display Data, which is where
the desktop puts them.

### Initial label fields

Which of the three label checkboxes — Node Name, Taxonomy, Sequence — start
checked is decided per tree by `forester.suggestLabelFields(root, extractors)`
(pure, under test). The viewer hands it, per external node, exactly the text
each field would print with the subfield cascade already applied (one good
taxonomy identifier, one good sequence identifier, and the **displayed** node
name — when the readable-tip-name substitution applies, the substituted name
is what gets judged; only Short Names shortening is a later display nicety).
Two rules, in order:

1. **Redundancy.** For each ordered pair of fields (priority: name >
   taxonomy > sequence), if one field's text is *contained* in the other's —
   compared lowercased with spaces and underscores stripped — on **≥ 90%** of
   the nodes carrying both (and at least 2 such nodes), the contained field
   starts unchecked; on mutual containment the higher-priority field is kept.
   This is what removes ` | Feline calicivirus` from tips already named
   `Feline_calicivirus|CH-JL2|…`, and ` | MOUSE` from `22_MOUSE`.
2. **Length budget.** If the median length of the combined remaining label
   (fragments joined with `" | "`) still exceeds **50 characters**, only the
   single most *identifying* field stays: highest ratio of distinct
   (normalized) values to **all external nodes** — judged over every tip, not
   just the labelled ones, so a field carried by a handful of tips cannot win
   and leave the rest unlabelled. The top ratio is found first; every field
   within **0.05** of it then competes by the priority order, with one
   override: a lower-priority contender whose median length is under **60%**
   of the current pick's (substantially more economical) takes it.

A field with no printable values is never checked (apaf's sequences carry
only domain architectures, so its Sequence box starts unchecked). The choice
is logged to the console at launch, and the user can recheck anything — the
rules only set the initial state.

### Visual styles (the desktop's `style:` namespace)

phyloXML written by the desktop, ViPR or BV-BRC can carry per-node rendering
instructions as properties in the reserved `style:` namespace. Five are
honoured: `style:font_color`, `style:node_color`, `style:node_shape`
(circle / rectangle / diamond), `style:font_size` and `style:font_style`
(italic / bold / bold_italic). The rest of the vocabulary (font name,
`node_size`, `node_transparency`, `node_fill_type`) is not, yet.

The **Visual Styles** checkbox — the desktop's "Visual Styles/Branch Colors",
shown when the tree carries either, on by default — turns them off and on,
and gates phyloXML `<color>` branch colours too, exactly as on the desktop.
An active Color visualization outranks `style:font_color`, also as on the
desktop: set the Color menu to default to see the tree as its file styled it.
`style:` never appears in the Color / Shape menus — it is rendering, not data.

### Moving the legends

The legends drawn over the tree are **dragged with the mouse** — grab one
anywhere and both move together, keeping their stacked order. The old Vis
Legend fieldset (Show / Dir / four arrows / R) is gone; so is the shift- or
alt-click placement it documented. `visualizationsLegendXpos` and
`visualizationsLegendYpos` still set where they start out.

## The layouts, alignment track and time axes (developer spec)

The 2026 additions beyond the visualization system, specified tightly enough
to rebuild. All pure logic lives in forester.js under `npm test`; the viewer
draws.

### The unrooted layout

`forester.equalAngleLayout(root, startAngle, lengthOf)` — Meacham's
equal-angle rule, one pass, no daylight iterations. The root sits at (0,0)
and owns `[startAngle, startAngle + 2π)`; each child receives a wedge of its
parent's proportional to the external nodes it encloses, sits at its wedge's
**mid-angle** at distance `lengthOf(child)`, and recurses into its own wedge.
Angles are absolute screen radians (y down), inherited and subdivided — never
re-referenced to the incoming branch, whose direction is implicitly the wedge
midpoint. Writes `ux, uy, uangle` onto every node; returns `{maxRad}`.
`startAngle` is `-π/2` (first wedge opens upward) plus the shared rotation
offset. Spoke lengths: phylogram — `distToRoot` differences × a factor
fitting the deepest tip into `0.42 × min(displayWidth, displayHeight)`;
cladogram — one constant step per level (the desktop's integer-division bug
here was fixed, not ported). Straight branch lines.

Circular and unrooted form the **radial family** (`radialDisplay()`): they
share rotation, the label-direction flip, single-axis zoom, and the label
mathematics — `spokeAngle(d)` is `uangle` in unrooted and the cluster angle
minus π/2 in circular; `labelAngleDeg` rotates a label along its spoke and
`labelFlip` adds 180° on the left half (`spokeAngle mod 2π ∈ (π/2, 3π/2)`).
`layoutPointXY(d)` resolves a node's position in any layout for every
consumer (overview dots, hit navigator, node transforms). Unrooted disables
aligned phylograms and label auto-hiding, as the desktop does.

### The alignment track

Data model: per-tip `sequences[0].mol_seq = {is_aligned, value}` (the gapped
row); alignment length = the **max** row length (never assume rectangular —
a short row's tail reads as gaps). Gate: `showMsa` state (auto-on when
`alignedMolSeqs && maxMolSeqLength > 0`) AND rectangular layout.

Geometry: the track reserves `MSA_TRACK_GAP(8) + band` from `_w`, where
`band = clamp(viewportWidth × 0.6, 120 px, whatever leaves the tree ≥ 220
px)` — budgeted from the **viewport**, not the zoomed layout width. Its right
edge lands exactly on the canvas edge (the fit translates the layout by
`rootOffset`, so the track anchors at `displayWidth − rootOffset − band`).
Rows tile the cluster height: each shared boundary is derived **once** as the
midpoint between adjacent tip rows (per-row `y ± half` rounds a pixel apart
and paints a seam); a cell's width is the *next* cell's rounded left edge
minus its own, so cells abut at fractional widths. Column width is fixed
(7 px); letters draw when rows are ≥ 8 px tall, in monospace with black or
white ink by luminance (< 140 → white); when letters are off, same-colour
runs merge into single rects and gap runs into single lines — that is what
keeps big trees drawable. Only a true alignment edge gets a boundary line, so
a scroll cutoff is distinguishable from the end.

Palettes (forester, frozen, byte-matched against the desktop): seven
Zappo-style amino-acid classes, one colour per base (T ≡ U), grey ambiguity;
amino-vs-nucleotide judged from the residues of the first non-empty row
(> 90% ACGTUN of non-gaps → nucleotide). Gap characters: `- . ~ space`.
Conservation (`forester.msaConservation`, scored over the **visible window**
only): identity = most-common-residue count / rows (gaps stay in the
denominator); information = `(log₂K − H)/log₂K × nonGapFraction`, K = 4 or
20; consensus = most common non-gap residue, ties alphabetical. The hover
readout (`forester.msaResidueInfo`, `msaUngappedPosition`) names the residue
(desktop vocabulary, selenocysteine and pyrrolysine included), its class
(purine/pyrimidine for bases) and Kyte-Doolittle hydropathy. Scrolling: a
lazily-created fixed HTML range input plus wheel-over-track, both moving
`_msaColOffset`; the tree never moves.

### The time axes

Data model: per-node `date = {unit, desc, value, minimum, maximum}` —
**minimum is the younger bound, maximum the older**, everywhere. Detection
(`forester.timeAxisInfo`): unit sets decide (`mya ma myr(s) my ga gya bya
kya million/billion years` → geologic; `year(s) yr(s) cal ce ad calendar…` →
calendar); unitless values fall back to magnitude — a strict majority in
[1500, 2200] reads as years, `max > 10 && min ≤ 5% of max` as ages.
Non-finite values are ignored (a `1e400` in a file once hung the tick
loops). Calibration: the **largest** date value is the root age (geologic)
or the present (calendar) — no unit conversion is done, so a Ga-valued tree
is misbanded exactly as on the desktop.

Rendering (phylogram + rectangular only; the layout never changes): age→x is
`anchorX + (anchorAge − age) × corr` with `corr` the branch-length scale's
slope, anchored at the **deepest dated tip** rather than the root — the root
and its direct children carry a synthetic half-average branch length, which
would shift every band. The geologic axis draws
`forester.geoBandRanks(rootAge)` — the finest of Period/Epoch, Era/Period,
Eon/Era that still covers the range — as two 13 px rows of ICS intervals
(official colours; ink by the same luminance rule), clipped to
`[youngestTipAge, rootAge]`, then a ruler with ~8 ticks at 1/2/5 × 10ᵏ steps;
a fossil-only tree's youngest age is labelled even when it is not a round
tick. The calendar axis is a whole-year ruler over
`[present − maxDistToRoot, present]`. Uncertainty bars use
`x ± (bound − value) × s` where `s` is `+corr` for ages and `−corr` for
years (so the earlier bound always lands left): internal → 7 px translucent
blue `rgba(70,130,220,.35)`; tips → 5 px sepia `rgba(150,100,55,.86)` with
±4 px end caps. The MSA footer and the time axis occupy the same bottom
strip side by side (track right, axis left), so their reserves take
`max(56, 52 or 26)`, not the sum. The ICS table (`forester.geoIntervals`
etc., 69 intervals, frozen) is byte-identical to the desktop's; reference:
Cohen, K.M., Harper, D.A.T., Gibbard, P.L. & Car, N. (2025, updated),
Episodes 48: 105-115; www.stratigraphy.org.

## Node selection

With `enableManualNodeSelection` on, the node menu gains **Select/Deselect Node**
and **Select/Deselect All Ext Nodes**, and the selection is readable from outside
the viewer:

```js
var selected = archaeopteryx.getSelectedNodes();   // array of node objects
```

Selected nodes are drawn in the selection colour, which is fixed so that it
stays distinguishable from the two search colours.

### The "Submit Selected" button is dormant

There is also a **Submit Selected** button in the source, which would dispatch a
`submit_selected_nodes_event` on `document` for the surrounding application to
listen for. **It is not wired up**: the call that would add the button to the
control panel is commented out, so the button never appears and the event is
never fired. Poll `getSelectedNodes()` instead.

This is left as it is on purpose, rather than either finished or deleted, until
there is a reason to decide one way or the other. If you are looking for the
event because something upstream expects it, that is the reason — say so.
