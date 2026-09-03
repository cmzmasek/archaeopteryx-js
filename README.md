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

* [Influenza HA (annotated)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=influenza)
* [Apaf-1 gene family](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=apaf)
* [Bcl-2 family](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=bcl2)
* [Confidence values](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=confidences)
* [Branch events](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=branch_events)
* [Caliciviridae (97 strains)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=caliciviridae_100)
* [Caliciviridae (186 strains)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=caliciviridae_500)
* [Adenoviridae (321 strains)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=adenoviridae)
* [Influenza A H5Nx (354 strains)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=flu_h5)
* [Herpesviridae DNA polymerase (201 tips)](https://cmzmasek.github.io/archaeopteryx-js/demo.html?tree=herpes_dnapol)


### Detailed developer documentation
https://docs.google.com/document/d/1COVe0iYbKtcBQxGTP4_zuimpk2FH9iusOVOgd5xCJ3A/edit

### Dependencies
Archaeopteryx.js has the following dependencies:
 * forester.js: https://www.npmjs.com/package/archaeopteryx
 * phyloxml.js: https://www.npmjs.com/package/phyloxml
 * d3.js (version 7): https://www.npmjs.com/package/d3
 * sax.js (1.2.4): https://www.npmjs.com/package/sax/v/1.2.4
 
For graphics (PNG) export, the following two libraries are required as well:
 * canvg: https://www.npmjs.com/package/canvg
 * rgbcolor: https://www.npmjs.com/package/rgbcolor

File (Newick/New Hampshire, phyloXML, FASTA) and SVG download, as well as saving
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
// parse and launch in one step (what most callers want)
archaeopteryx.launchArchaeopteryx(id, location, data, config, null,
                                  nhConfidenceValuesInBrackets,
                                  nhConfidenceValuesAsInternalNames);

// or parse yourself, then launch
var tree = archaeopteryx.parseTree(location, data,
                                   nhConfidenceValuesInBrackets,
                                   nhConfidenceValuesAsInternalNames);
archaeopteryx.launch(id, tree, config, null, null, nodeLabels);
```

`config` is one object and is optional — `archaeopteryx.launch('#phylogram1',
tree)` works. The `null` after it is the deprecated second config object, kept
so older call sites still run; see **Configuration** below.

`location` is only used to pick a parser: a name ending in `xml` is read as
phyloXML, anything else as New Hampshire (Newick).

Both entry points **throw** on bad input — an undefined or empty tree, an
unparseable file, or a config key that no longer exists. Nothing is reported by
a popup any more, and nothing fails silently.

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

## Configuration

One object, passed as the third argument. It is optional, and the best
configuration is usually an empty one — almost everything that used to be
configured is now read off the tree (see **Intelligent pre-sets** above). The
eighteen keys below are the ones no tree can answer for you.

There used to be two objects, `options` and `settings`, split by whether the
user could also change the value from the control panel. That was a fact about
the internals, not something a caller could derive, and getting it wrong was
silent: the right name in the wrong object did nothing at all. There is now one
object. A fourth argument is still accepted and merged, so existing call sites
keep working; it logs a deprecation warning.

### Still used

| Key | Default | What it does |
| --- | --- | --- |
| `enableDynamicSizing` | `true` | Size the tree to its container, and follow window resizes. |
| `displayWidth` | `800` | Width — only when dynamic sizing is off. |
| `displayHeight` | `600` | Height — only when dynamic sizing is off. |
| `zoomToFitUponWindowResize` | `true` | Re-fit the tree after a window resize. |
| `rootOffset` | `254` | Distance from the left edge to the root. The default clears the control panel: its inset plus its width plus a margin. |
| `circularDisplay` | `false` | Circular layout instead of rectangular. |
| `ladderizeTree` | `true` | Ladderize the tree on load: at each node, the larger clade first. |
| `searchAinitialValue` | `null` | Prefill search box A. |
| `searchBinitialValue` | `null` | Prefill search box B. |
| `enableVisualizations` | `true` | Offer the Color / Shape visualizations (which fields they cover is decided from the tree). |
| `visualizationsLegendXpos` | `254` | Legend position, x. |
| `visualizationsLegendYpos` | `30` | Legend position, y. |
| `enableDownloads` | `true` | Offer the download buttons. |
| `pngExportScale` | `4` | PNG export resolution multiplier. |
| `nhExportWriteConfidences` | `true` | Write confidences into exported Newick. |
| `enableSubtreeDeletion` | `true` | Offer node / subtree deletion in the node menu. |
| `enableAccessToDatabases` | `true` | Offer the “Access DB” link in the node menu. |
| `enableManualNodeSelection` | `false` | Add the Select/Deselect entries to the node menu. |

### Anything else throws

An unrecognised key is an error, whether it was removed in this modernization
or simply mistyped:

```
ArchaeopteryxJS: ERROR: removed config key(s) passed to launch:
"circular" -- renamed to "circularDisplay"

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

All 114 of them, alphabetically:

| Key | Why, and what to do instead |
| --- | --- |
| `alignPhylogram` | Aligning the tips is a control, not a launch option. |
| `allowManualNodeSelection` | Renamed to `enableManualNodeSelection`. |
| `backgroundColorDefault` | The background is fixed. |
| `backgroundColorForPrintExportDefault` | The export background is fixed. |
| `border` | Style the tree's svg with CSS instead. |
| `branchColorDefault` | The default branch colour is fixed. |
| `branchDataFontSize` | All labels share one size now -- use `fontSize`. |
| `branchWidthDefault` | Branch width follows the size of the tree. |
| `circular` | Renamed to `circularDisplay`. |
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
| `externalNodeFontSize` | All labels share one size now -- use `fontSize`. |
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
| `internalNodeFontSize` | All labels share one size now -- use `fontSize`. |
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
| `textFieldHeight` | The text fields size themselves to their content. |
| `treeName` | The name comes from the tree file. |
| `useVisualStyles` | On by default; use the Visual Styles checkbox. |
| `valuesToIgnoreForNodeVisualization` | Every value is shown; choose what to show in the panel. |
| `visualizationsLegendOrientation` | The legend orientation is fixed; the legend has its own control. |
| `visualizationsLegendXposOrig` | Internal bookkeeping; set visualizationsLegendXpos. |
| `visualizationsLegendYposOrig` | Internal bookkeeping; set visualizationsLegendYpos. |

## Node visualizations

The **Color** and **Shape** menus are filled **from the tree alone**. There is
nothing to configure and nothing to pass in: `launch()`'s old
`nodeVisualizations` argument and the `dynamicallyAddNodeVisualizations`
setting are gone, and passing either throws. The decision of what is worth
offering lives in `forester.visualizationCandidates(tree)` and is under test
(`test/visualization_test.js` holds all ten demo trees as fixtures).

What gets offered, briefly:

* Candidates are taxonomy (code, scientific name, common name), sequence
  (name, symbol, gene name), and node properties. The `style:` namespace is
  never offered — the desktop reserves it for rendering instructions.
* A field must cover at least **⅔ of the external nodes** and have at least
  2 — and fewer than all — distinct values. Identifier-like fields
  (accessions, genome ids) are refused.
* Up to **20** distinct values → **Color** (one fixed, colour-vision-aware
  palette at every cardinality). Numeric fields come in three bands: up to
  **10** distinct values default to individual colours — numbers that few are
  usually codes, like HA/NA subtypes — **11–20** default to a viridis
  **colour ramp**, and both of those carry a `[colors]` / `[gradient]` switch
  in their legend; above 20 it is a ramp with no switch. Legends list numeric
  values in numeric order by default (words sort by count).
* Up to **7** distinct values → also **Shape** (the seven distinct d3 symbols).
* A node without a value keeps the default look, and the legend names the
  field so partial coverage is visible.

The menus are ordered **best first** — categorical fields ahead of numeric
ramps, then by coverage × balance (the normalized entropy of the value
distribution), so a field that reads "Nonhuman Mammal" on 92% of its nodes
sits below one that actually splits the tree. **The best candidate is applied
automatically on load**: a tree opens coloured by its most informative field
rather than grey with a menu to discover. Esc resets back to that state.

Colours are assigned from the **complete** tree, so a value keeps its colour
inside a subtree view even when the subtree does not contain it; the menus and
choices survive diving into and out of subtrees unchanged. Choosing a Color
also switches the Visualizations checkbox on, since one colour paints both the
label and the node.

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
