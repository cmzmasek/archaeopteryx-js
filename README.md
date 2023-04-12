# Archaeopteryx.js
Archaeopteryx.js is a software tool for the visualization and analysis of highly annotated phylogenetic trees.


### Website
https://sites.google.com/view/archaeopteryxjs

### npm
https://www.npmjs.com/package/archaeopteryx

### GitHub
https://github.com/cmzmasek/archaeopteryx-js


### Examples

* [Bcl-2 gene family](http://www.phyloxml.org/archaeopteryx-js/bcl2_js.html)
* Eukaryotic tree of life:
  * [collapsed with initial depth = 5](http://www.phyloxml.org/archaeopteryx-js/euk_tol_collapsed_js.html)
  * [uncollapsed](http://www.phyloxml.org/archaeopteryx-js/euk_tol_js.html)
* [Influenza HA H3 collapsed by Country](http://www.phyloxml.org/archaeopteryx-js/influenza_collapsed.html)
* [Amphibian phylogeny](http://www.phyloxml.org/archaeopteryx-js/amphi_frost_js.html)
* Visualizations:
  * [Herpesviridae DNA polymerases](http://www.phyloxml.org/archaeopteryx-js/hg1001_js.html)
* RAxML examples:
  * [bipartitions](http://www.phyloxml.org/archaeopteryx-js/raxml_bipartitions_bcl2_js.html)
  * [bipartitionsBranchLabels](http://www.phyloxml.org/archaeopteryx-js/raxml_bipartitions_branchlabels_bcl2_js.html)
* MSA Residue Visualization:
  * [Bunyaviridae Glycoprotein](http://www.phyloxml.org/archaeopteryx-js/bunya_glycoprotein.html)
  * [Bcl-2 protein](http://www.phyloxml.org/archaeopteryx-js/bcl2_msa.html)
* Preset search fields:
  * [H3N2](http://www.phyloxml.org/archaeopteryx-js/h3n2_search_js.html)
* Grouping of species and years for visualization:
  * [Viral Strains](http://www.phyloxml.org/archaeopteryx-js/many_species_js.html)
* SARS-CoV-2 with mutations and PANGO lineages:
  * [SARS-CoV-2](http://www.phyloxml.org/archaeopteryx-js/sars_cov_3.html)


### Detailed developer documentation
https://docs.google.com/document/d/1COVe0iYbKtcBQxGTP4_zuimpk2FH9iusOVOgd5xCJ3A/edit

### Version History
https://github.com/cmzmasek/archaeopteryx-js/wiki/Archaeopteryx.js-Version-History

### Dependencies
Archaeopteryx.js has the following dependencies:
 * forester.js: https://www.npmjs.com/package/archaeopteryx
 * phyloxml.js: https://www.npmjs.com/package/phyloxml
 * d3.js (version 3): https://www.npmjs.com/package/d3/v/3.5.17
 * jQuery (1.12.4): https://www.npmjs.com/package/jquery/v/1.12.4
 * jQuery UI (1.12.1): https://www.npmjs.com/package/jquery-ui/v/1.12.1
 * sax.js (1.2.4): https://www.npmjs.com/package/sax/v/1.2.4
 
For file (Newick/New Hampshire, phyloXML) and graphics (PNG, SVG)
download/export, the following five libraries are required as well:
 * canvg: https://www.npmjs.com/package/canvg
 * rgbcolor: https://www.npmjs.com/package/rgbcolor
 * Blob.js: https://github.com/eligrey/Blob.js
 * canvas-toBlob.js (needed in some versions of Internet Explorer and Opera): https://github.com/eligrey/canvas-toBlob.js
 * FileSaver.js: https://github.com/eligrey/FileSaver.js
 
Additionally, Archaeopteryx.js also requires the following CSS:
 * jquery-ui.css: https://code.jquery.com/ui/1.12.0/themes/base/jquery-ui.css


## Basic Example of HTML for launching Archaeopteryx.js

Example of HTML page to launch a basic Archaeopteryx.js instance:
```
<!DOCTYPE html>
<meta charset="utf-8">
<head>
   <title>Archaeopteryx.js Basic Demo</title>

   <!-- For MS IE/Edge compatibility:-->
   <meta http-equiv="X-UA-Compatible" content="IE=100">

   <!-- D3.js, jQuery, and jQuery UI:-->
   <script src="http://d3js.org/d3.v3.min.js"></script>
   <script src="https://code.jquery.com/jquery-1.12.4.js"></script>
   <script src="https://code.jquery.com/ui/1.12.0/jquery-ui.js"></script>

   <!-- SAX XML parser:-->
   <script src="http://www.phyloxml.org/js/dependencies/sax.js"></script>

   <!-- Archaeopteryx.js requires forester.js and phyloxml.js:-->
   <script src="http://path/to/phyloxml.js"></script>
   <script src="http://path/to/forester.js"></script>
   <script src="http://path/to/archaeopteryx.js"></script>

   <!-- CSS for jQuery UI: -->
   <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.0/themes/base/jquery-ui.css">

   <script>
       function load() {
           var options = {};
           options.backgroundColorDefault = '#f0f0f0';
           var settings = {};
           var loc = 'https://raw.githubusercontent.com/cmzmasek/archaeopteryx-js/master/test/data/phyloxml_trees/apaf.xml';

           jQuery.get(loc,
                   function (data) {
                       var tree = null;
                       try {
                           tree = archaeopteryx.parseTree(loc, data, true, false);
                       }
                       catch (e) {
                           alert("error while parsing tree: " + e);
                       }
                       if (tree) {
                           try {
                               archaeopteryx.launch('#phylogram1', tree, options, settings);
                           }
                           catch (e) {
                               alert("error while launching archaeopteryx: " + e);
                           }
                       }
                   },
                   "text")
                   .fail(function () {
                               alert("error: failed to read tree(s) from \"" + loc + "\"");
                           }
                   );
       }
   </script>
</head>

<body onload="load()">
<div>
   <h2>Archaeopteryx.js Basic Demo</h2>
   <div id='phylogram1'></div>
   <div id='controls0' class='ui-widget-content'></div>
</div>
</body>
```




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






