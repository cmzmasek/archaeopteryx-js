# Archaeopteryx.js
Archaeopteryx.js is a software tool for the visualization and analysis of highly annotated phylogenetic trees.


### Website
https://sites.google.com/view/archaeopteryxjs

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


### Detailed developer documentation
https://docs.google.com/document/d/1COVe0iYbKtcBQxGTP4_zuimpk2FH9iusOVOgd5xCJ3A/edit

### Version History
https://github.com/cmzmasek/archaeopteryx-js/wiki/Archaeopteryx.js-Version-History

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
           var options = {};
           var settings = {};
           var loc = 'http://path/to/apaf.xml';

           fetch(loc)
               .then(function (response) {
                   if (!response.ok) {
                       throw new Error('HTTP ' + response.status + ' loading ' + loc);
                   }
                   return response.text();
               })
               .then(function (data) {
                   archaeopteryx.launchArchaeopteryx('#phylogram1', loc, data, options, settings);
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
[For Developers](#for-developers) below for what goes into `options` and
`settings`.




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
archaeopteryx.launchArchaeopteryx(id, location, data, options, settings,
                                  nhConfidenceValuesInBrackets,
                                  nhConfidenceValuesAsInternalNames,
                                  nodeVisualizations);

// or parse yourself, then launch
var tree = archaeopteryx.parseTree(location, data,
                                   nhConfidenceValuesInBrackets,
                                   nhConfidenceValuesAsInternalNames);
archaeopteryx.launch(id, tree, options, settings, nodeVisualizations, nodeLabels);
```

`location` is only used to pick a parser: a name ending in `xml` is read as
phyloXML, anything else as New Hampshire (Newick).

Both entry points **throw** on bad input — an undefined or empty tree, an
unparseable file, or an option name that no longer exists. Nothing is reported
by a popup any more, and nothing fails silently.

## `options` versus `settings`

The split is not always obvious, so:

* **`options`** describe **the tree drawing**: what is labelled, what is
  coloured, how big things are. These are the things the control panel can
  change while the tree is on screen, so an option is really the *initial
  state* of a control.
* **`settings`** describe **what the surrounding application allows**: which
  `<div>`s to draw into, whether downloads and subtree deletion are offered,
  whether visualizations are enabled at all. The user cannot change these.

Both are optional; `archaeopteryx.launch('#phylogram1', tree, {}, {})` works.

## Intelligent pre-sets

Almost everything that used to be configured is now read off the tree: a tree
with taxonomies shows taxonomies and offers a Taxonomy control, a tree without
them shows neither; a tree whose branches mostly carry lengths is drawn to
scale, one whose branches mostly do not is drawn as a cladogram.

So **the best configuration is usually an empty one**. Six options remain, and
they are the ones no tree can answer for you: which layout, what to prefill the
search boxes with, where the legend sits, and how big a PNG to export.

Everything else is either derived, or a control the user can change once the
tree is on screen. Those controls still have defaults, and the defaults are
chosen per tree — they are simply no longer yours to set at launch.

## Removed names throw

Names that no longer exist are rejected by `launch()` with an error naming the
replacement, rather than being ignored:

```
ArchaeopteryxJS: ERROR: removed option(s) passed to launch:
"externalNodeFontSize" -- all labels share one size now -- use "fontSize"
```

This is deliberate: an ignored option looks like it worked. If you are
upgrading, run once and fix whatever it names.

## Options

Almost nothing is left here on purpose. What a tree should look like is now
read off the tree itself, so the six options below are the ones no tree can
answer for you.

### Still used

| Option | Default | What it does |
| --- | --- | --- |
| `circular` | `false` | Circular layout instead of rectangular. |
| `searchAinitialValue` | `null` | Prefill search box A. |
| `searchBinitialValue` | `null` | Prefill search box B. |
| `visualizationsLegendXpos` | `220` | Legend position, x. |
| `visualizationsLegendYpos` | `30` | Legend position, y. |
| `pngExportScale` | `4` | PNG export resolution multiplier. |

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

| Option | Why, and what to do instead |
| --- | --- |
| `showExternalNodes` | Node shapes now appear wherever a node visualization applies. |
| `showInternalNodes` | Node shapes now appear wherever a node visualization applies. |
| `searchIsPartial` | Each search box picks its own match mode (contains / starts with / ends with / whole word / regex). |
| `searchUsesRegex` | Choose the `regex` match mode in the search box instead. |
| `searchProperties` | Choose the property in the search box's field menu instead. |
| `externalNodeFontSize` | All labels share one size now -- use `fontSize`. |
| `internalNodeFontSize` | All labels share one size now -- use `fontSize`. |
| `branchDataFontSize` | All labels share one size now -- use `fontSize`. |
| `nameForNhDownload` | Download names follow `treeName`. |
| `nameForPhyloXmlDownload` | Download names follow `treeName`. |
| `nameForPngDownload` | Download names follow `treeName`. |
| `nameForSvgDownload` | Download names follow `treeName`. |
| `nameForFastaDownload` | Download names follow `treeName`. |
| `showTaxonomyCode` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyScientificName` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyCommonName` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyRank` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomySynonyms` | Taxonomy labelling follows what the tree contains. |
| `showSequenceName` | Sequence labelling follows what the tree contains. |
| `showSequenceGeneSymbol` | Sequence labelling follows what the tree contains. |
| `showSequenceSymbol` | Sequence labelling follows what the tree contains. |
| `showSequenceAccession` | Sequence labelling follows what the tree contains. |
| `found0ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `found1ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `found0and1ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `selectedColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `collapsedLabelLength` | The collapse feature was removed. |
| `initialCollapseDepth` | The collapse feature was removed. |
| `initialCollapseFeature` | The collapse feature was removed. |
| `searchNegateResult` | This is the state of the Inverse checkbox, not an input. |
| `visualizationsLegendXposOrig` | Internal bookkeeping; set visualizationsLegendXpos. |
| `visualizationsLegendYposOrig` | Internal bookkeeping; set visualizationsLegendYpos. |
| `phylogram` | The tree is drawn to scale when most of its branches have a length. |
| `alignPhylogram` | Aligning the tips is a control, not a launch option. |
| `treeName` | The name comes from the tree file. |
| `fontSize` | One default size for every label; the font-size slider changes it. |
| `defaultFont` | Labels use the sans-serif the reader's own system renders best. |
| `labelColorDefault` | The default label colour is fixed. |
| `branchColorDefault` | The default branch colour is fixed. |
| `branchWidthDefault` | Branch width follows the size of the tree. |
| `backgroundColorDefault` | The background is fixed. |
| `backgroundColorForPrintExportDefault` | The export background is fixed. |
| `nodeSizeDefault` | Node size is fixed; the Node size slider changes it. |
| `nodeLabelGap` | The label gap is fixed. |
| `showNodeName` | Shown when the tree has node names. |
| `showTaxonomy` | Shown when the tree has taxonomies. |
| `showSequence` | Shown when the tree has sequences. |
| `showConfidenceValues` | Shown when the tree has confidences. |
| `showNodeEvents` | Shown when the tree has node events. |
| `showBranchEvents` | Shown when the tree has branch events. |
| `showBranchLengthValues` | Off by default; use the Branch Length checkbox. |
| `showInternalLabels` | Off by default; use the Int. Labels checkbox. |
| `showExternalLabels` | On by default; use the Ext. Labels checkbox. |
| `showDistributions` | Off by default. |
| `showBranchColors` | On by default. |
| `shortenNodeNames` | On by default when the tree has long node names; use the Short Names checkbox. |
| `dynahide` | On by default; use the Auto-hide Labels checkbox. |
| `minConfidenceValueToShow` | No longer configurable. |
| `minBranchLengthValueToShow` | No longer configurable. |
| `showNodeVisualizations` | Off by default; use the Node Vis checkbox. |
| `showBranchVisualizations` | Off by default; use the Branch Vis checkbox. |
| `nodeVisualizationsOpacity` | No longer configurable. |
| `initialNodeFillColorVisualization` | Choose the visualization in the Visualizations panel. |
| `initialLabelColorVisualization` | Choose the visualization in the Visualizations panel. |
| `visualizationsLegendOrientation` | The legend orientation is fixed; the legend has its own control. |
| `decimalsForLinearRangeMeanValue` | No longer configurable. |
| `searchIsCaseSensitive` | Off by default; use the Match case checkbox. |

## Settings

### Still used

| Setting | Default | What it does |
| --- | --- | --- |
| `enableDynamicSizing` | `true` | Size the tree to the window and follow resizes. |
| `displayWidth` | `800` | Width — only when dynamic sizing is off. |
| `displayHeight` | `600` | Height — only when dynamic sizing is off. |
| `zoomToFitUponWindowResize` | `true` | Re-fit the tree after a window resize. |
| `rootOffset` | `254` | Distance from the left edge to the root. The default clears the control panel: its inset plus its width plus a margin. |
| `enableDownloads` | `true` | Offer the download buttons. |
| `nhExportWriteConfidences` | `true` | Write confidences into exported Newick. |
| `enableNodeVisualizations` | `false` | Offer node visualizations. |
| `enableBranchVisualizations` | `false` | Offer branch visualizations. |
| `dynamicallyAddNodeVisualizations` | `false` | Build visualizations from the tree's own properties. |
| `enableSubtreeDeletion` | `true` | Offer node / subtree deletion in the node menu. |
| `enableAccessToDatabases` | `true` | Offer the "Access DB" link in the node menu. |
| `allowManualNodeSelection` | `false` | Add the Select/Deselect entries to the node menu. |
| `ladderizeTree` | `true` | Ladderize the tree on load: at each node, the larger clade first. |

### Removed — passing these throws

| Setting | Why, and what to do instead |
| --- | --- |
| `showExternalNodesButton` | The Ext. Nodes switch no longer exists. |
| `showInternalNodesButton` | The Int. Nodes switch no longer exists. |
| `showSearchPropertiesButton` | Properties are searched by choosing them in a search box's field menu. |
| `searchFieldWidth` | The search boxes size themselves to the control panel. |
| `showNodeNameButton` | Shown automatically when the tree has node names. |
| `showTaxonomyButton` | Shown automatically when the tree has taxonomies. |
| `showSequenceButton` | Shown automatically when the tree has sequences. |
| `showBranchColorsButton` | Shown automatically when the tree has branch colours. |
| `showDynahideButton` | Shown automatically once the tree has enough tips to need it. |
| `showShortenNodeNamesButton` | Shown automatically when the tree has long node names. |
| `showExternalLabelsButton` | Always shown. |
| `showInternalLabelsButton` | Shown automatically when the tree has internal node data. |
| `collapseLabelWidth` | The collapse feature was removed. |
| `enableCollapseByBranchLenghts` | The collapse feature was removed. |
| `enableCollapseByFeature` | The collapse feature was removed. |
| `enableCollapseByTaxonomyRank` | The collapse feature was removed. |
| `controls1Width` | The control panel sizes itself. |
| `controls1` | The visualization menus moved into the main control panel. |
| `controls1Left` | The visualization menus moved into the main control panel. |
| `controls1Top` | The visualization menus moved into the main control panel. |
| `groupSpecies` | This setting was never read; it did nothing. |
| `groupYears` | This setting was never read; it did nothing. |
| `enableSpecialVisualizations2` | The special visualizations were removed. |
| `enableSpecialVisualizations3` | The special visualizations were removed. |
| `enableSpecialVisualizations4` | The special visualizations were removed. |
| `controlsFont` | The legend uses the same sans-serif as the rest of the interface. |
| `controlsFontSize` | The legend has one size. |
| `controlsFontColor` | This never had any effect; the legend follows the tree's label colour. |
| `textFieldHeight` | The text fields size themselves to their content. |
| `enableMsaResidueVisualizations` | Colouring by aligned residue was removed. |
| `border` | Style the tree's svg with CSS instead. |
| `controls0` | The control panel is created inside the tree's own container now. |
| `controls0Left` | The control panel is placed against the tree; drag it to move it. |
| `controls0Top` | The control panel is placed against the tree; drag it to move it. |
| `nhExportReplaceIllegalChars` | Always on; Newick cannot carry those characters. |
| `propertiesToIgnoreForNodeVisualization` | Every property the tree carries is offered; choose what to show in the panel. |
| `valuesToIgnoreForNodeVisualization` | Every value is shown; choose what to show in the panel. |
| `orderTree` | Renamed to `ladderizeTree`, to match the wording used everywhere else. |
| `controlsBackgroundColor` | The control panel follows the light / dark palette. |

## Node visualizations

`launch()`'s `nodeVisualizations` argument, and the
`dynamicallyAddNodeVisualizations` setting, register the entries offered in the
Visualizations panel. There are **two** kinds:

| Menu | Key | What it does |
| --- | --- | --- |
| **Color** | `colors` | Colours the node label **and** the node itself, in the same colour. |
| **Shape** | `shapes` | Gives the node a shape. Best for a property with only a few distinct values. |

There used to be four menus. Label Color and Node Fill Color were registered
from the same colour scale into two identical maps and then offered as two
separate menus that could be set to disagree with each other; they are now the
single **Color** menu, and choosing a colour switches node visualizations on so
that both halves of what it promises actually show. **Node Shape** is now just
**Shape**. Node Size, which varied the node's radius by a property, is gone.

So `sizes` now throws:

```
ArchaeopteryxJS: ERROR: node visualization "Year" asks to vary node size;
size visualizations were removed -- use "colors" or "shapes" instead
```

The **Node size** slider in the control panel is unrelated and still there: it
sets one size for every node.

Both menus live in the single control panel, above Display Data, which is where
the desktop puts them. There is no second panel any more.

### Moving the legends

The legends drawn over the tree are **dragged with the mouse** — grab one
anywhere and both move together, keeping their stacked order. The old Vis
Legend fieldset (Show / Dir / four arrows / R) is gone; so is the shift- or
alt-click placement it documented. `visualizationsLegendXpos` and
`visualizationsLegendYpos` still set where they start out.
