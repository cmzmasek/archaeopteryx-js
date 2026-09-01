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
   <div id='controls0'></div>
   <div id='controls1'></div>
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
archaeopteryx.launch(id, tree, options, settings,
                     nodeVisualizations, nodeLabels, specialVisualizations);
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

Most of what used to be configured is now read off the tree. Anything you do
not set explicitly is derived from what the loaded tree actually contains —
a tree with taxonomies shows taxonomies and offers a Taxonomy control, a tree
without them shows neither. An option you *do* set always wins.

This means **the shortest configuration is usually the best one**. Passing a
full dictionary copied from an older version will mostly restate what
Archaeopteryx.js would have worked out on its own, and risks overriding a
sensible per-tree choice with a fixed one.

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

### Still used

| Option | Default | What it does |
| --- | --- | --- |
| `phylogram` | `true` if the tree has branch lengths | Draw branch lengths to scale. Forced `false` for a tree without them. |
| `alignPhylogram` | `false` | Line the external nodes up at the right edge. |
| `circular` | `false` | Circular layout instead of rectangular. |
| `treeName` | the tree's own name | Used in the panel header and as the stem of every download filename. Non-word characters become `_`. |
| `fontSize` | `8` | One size for **every** label, as on the desktop. Clamped to a sane range. |
| `defaultFont` | `['Arial', 'Helvetica', 'Times']` | Label font stack. |
| `labelColorDefault` | `'#202020'` | Label colour. |
| `branchColorDefault` | `'#909090'` | Branch colour. |
| `branchWidthDefault` | `1` | Branch width. |
| `backgroundColorDefault` | `'#f0f0f0'` | Background behind the tree. |
| `backgroundColorForPrintExportDefault` | `'#ffffff'` | Background used for PNG/SVG export. |
| `nodeSizeDefault` | `3` | Node shape size. |
| `nodeLabelGap` | `10` | Gap between a node and its label. |
| `showNodeName` | `true` | Label with the node name. |
| `showTaxonomy` | tree has taxonomies | Label with taxonomy. *Which* taxonomy field is chosen from the tree. |
| `showSequence` | tree has sequences | Label with sequence data. *Which* field is chosen from the tree. |
| `showConfidenceValues` | tree has confidences | Show support values. |
| `showBranchLengthValues` | `false` | Show branch lengths as text. |
| `showInternalLabels` | `false` | Label internal nodes. |
| `showExternalLabels` | `true` | Label external nodes. |
| `showNodeEvents` | tree has node events | Duplication / speciation markers. |
| `showBranchEvents` | tree has branch events | Branch events, e.g. mutations. |
| `showDistributions` | `false` | Show distribution data. |
| `showBranchColors` | `true` | Honour branch colours stored in the tree. |
| `shortenNodeNames` | `false` | Truncate long node names. |
| `dynahide` | `true` | Auto-hide labels that would collide. |
| `minConfidenceValueToShow` | `null` | Hide support values below this. |
| `minBranchLengthValueToShow` | `null` | Hide branch lengths below this. |
| `showNodeVisualizations` | `false` | Start with node visualizations on. |
| `showBranchVisualizations` | `false` | Start with branch visualizations on. |
| `nodeVisualizationsOpacity` | `1` | Opacity of node visualizations. |
| `initialNodeFillColorVisualization` | none | Name of the node-fill visualization to start with. |
| `initialLabelColorVisualization` | none | Name of the label-colour visualization to start with. |
| `visualizationsLegendXpos` | `220` | Legend position, x. |
| `visualizationsLegendYpos` | `30` | Legend position, y. |
| `visualizationsLegendOrientation` | `vertical` | Legend orientation. |
| `decimalsForLinearRangeMeanValue` | `0` | Decimals shown for a linear-range mean. |
| `searchAinitialValue` | `null` | Prefill search box A. |
| `searchBinitialValue` | `null` | Prefill search box B. |
| `searchIsCaseSensitive` | `false` | Initial state of Match case. |
| `pngExportScale` | `4` | PNG export resolution multiplier. |

### Removed — passing these throws

| Option | Why, and what to do instead |
| --- | --- |
| `externalNodeFontSize` | All labels share one size now — use `fontSize`. |
| `internalNodeFontSize` | All labels share one size now — use `fontSize`. |
| `branchDataFontSize` | All labels share one size now — use `fontSize`. |
| `showExternalNodes` | Node shapes now appear wherever a node visualization applies. |
| `showInternalNodes` | Node shapes now appear wherever a node visualization applies. |
| `searchIsPartial` | Each search box picks its own match mode (contains / starts with / ends with / whole word / regex). |
| `searchUsesRegex` | Choose the "regex" match mode in the search box instead. |
| `searchProperties` | Choose the property in the search box's field menu instead. |
| `searchNegateResult` | This is the state of the Inverse checkbox, not an input. |
| `showTaxonomyCode` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyScientificName` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyCommonName` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomyRank` | Taxonomy labelling follows what the tree contains. |
| `showTaxonomySynonyms` | Taxonomy labelling follows what the tree contains. |
| `showSequenceName` | Sequence labelling follows what the tree contains. |
| `showSequenceGeneSymbol` | Sequence labelling follows what the tree contains. |
| `showSequenceSymbol` | Sequence labelling follows what the tree contains. |
| `showSequenceAccession` | Sequence labelling follows what the tree contains. |
| `nameForNhDownload` | Download names follow `treeName`. |
| `nameForPhyloXmlDownload` | Download names follow `treeName`. |
| `nameForPngDownload` | Download names follow `treeName`. |
| `nameForSvgDownload` | Download names follow `treeName`. |
| `nameForFastaDownload` | Download names follow `treeName`. |
| `found0ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `found1ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `found0and1ColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `selectedColorDefault` | The search / selection colours are fixed so they stay distinguishable. |
| `collapsedLabelLength` | The collapse feature was removed. |
| `initialCollapseDepth` | The collapse feature was removed. |
| `initialCollapseFeature` | The collapse feature was removed. |
| `visualizationsLegendXposOrig` | Internal bookkeeping — set `visualizationsLegendXpos`. |
| `visualizationsLegendYposOrig` | Internal bookkeeping — set `visualizationsLegendYpos`. |

## Settings

### Still used

| Setting | Default | What it does |
| --- | --- | --- |
| `controls0` | `'controls0'` | Id of the div for the main control panel. |
| `controls1` | `'controls1'` | Id of the div for the visualizations panel. |
| `controls0Left` | `20` | Position of the main panel. |
| `controls0Top` | `10` | Position of the main panel. |
| `controls1Left` | right edge of the display | Position of the visualizations panel. |
| `controls1Top` | `10` | Position of the visualizations panel. |
| `controlsFont` | `['Arial', 'Helvetica', 'Times']` | Control-panel font stack. |
| `controlsFontSize` | `8` | Control-panel font size. |
| `controlsFontColor` | `'#505050'` | Control-panel text colour. |
| `textFieldHeight` | `'10px'` | Height of the text input fields. |
| `border` | none | CSS border for the tree div. |
| `enableDynamicSizing` | `true` | Size the tree to the window and follow resizes. |
| `displayWidth` | `800` | Width — only when dynamic sizing is off. |
| `displayHeight` | `600` | Height — only when dynamic sizing is off. |
| `zoomToFitUponWindowResize` | `true` | Re-fit the tree after a window resize. |
| `rootOffset` | `220` | Distance from the left edge to the root. |
| `enableDownloads` | `false` | Offer the download buttons. |
| `nhExportWriteConfidences` | `false` | Write confidences into exported Newick. |
| `nhExportReplaceIllegalChars` | `true` | Replace illegal characters in exported Newick. |
| `enableNodeVisualizations` | `false` | Offer node visualizations. |
| `enableBranchVisualizations` | `false` | Offer branch visualizations. |
| `dynamicallyAddNodeVisualizations` | `false` | Build visualizations from the tree's own properties. |
| `propertiesToIgnoreForNodeVisualization` | `null` | Properties to skip when doing so. |
| `valuesToIgnoreForNodeVisualization` | `null` | Values to skip when doing so. |
| `enableMsaResidueVisualizations` | `false` | Colour by aligned residue. Only takes effect if the tree has aligned sequences. |
| `enableSpecialVisualizations2` | `false` | Enable special visualization 2 — used together with the `specialVisualizations` argument to `launch()`. |
| `enableSpecialVisualizations3` | `false` | Enable special visualization 3, likewise. |
| `enableSpecialVisualizations4` | `false` | Enable special visualization 4, likewise. |
| `enableSubtreeDeletion` | `true` | Offer node / subtree deletion in the node menu. |
| `enableAccessToDatabases` | `true` | Offer the "Access DB" link in the node menu. |
| `allowManualNodeSelection` | `false` | Add the Select/Deselect entries to the node menu. |
| `orderTree` | `false` | Order (ladderize) the tree on load. |

### Removed — passing these throws

| Setting | Why, and what to do instead |
| --- | --- |
| `showNodeNameButton` | Shown automatically when the tree has node names. |
| `showTaxonomyButton` | Shown automatically when the tree has taxonomies. |
| `showSequenceButton` | Shown automatically when the tree has sequences. |
| `showBranchColorsButton` | Shown automatically when the tree has branch colours. |
| `showDynahideButton` | Shown automatically once the tree has enough tips to need it. |
| `showShortenNodeNamesButton` | Shown automatically when the tree has long node names. |
| `showInternalLabelsButton` | Shown automatically when the tree has internal node data. |
| `showExternalLabelsButton` | Always shown. |
| `showExternalNodesButton` | The Ext. Nodes switch no longer exists. |
| `showInternalNodesButton` | The Int. Nodes switch no longer exists. |
| `showSearchPropertiesButton` | Properties are searched by choosing them in a search box's field menu. |
| `searchFieldWidth` | The search boxes size themselves to the control panel. |
| `controls1Width` | The control panel sizes itself. |
| `controlsBackgroundColor` | The control panel follows the light / dark palette. |
| `collapseLabelWidth` | The collapse feature was removed. |
| `enableCollapseByBranchLenghts` | The collapse feature was removed. |
| `enableCollapseByFeature` | The collapse feature was removed. |
| `enableCollapseByTaxonomyRank` | The collapse feature was removed. |
| `groupSpecies` | Never read — it did nothing, even before. |
| `groupYears` | Never read — it did nothing, even before. |
