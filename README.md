# archaeopteryx-js
Archaeopteryx.js is a software tool for the visualization and analysis of highly annotated phylogenetic trees.


### Website
https://sites.google.com/site/cmzmasek/home/software/archaeopteryx-js

### npm
https://www.npmjs.com/package/archaeopteryx


### Examples

* http://www.phyloxml.org/archaeopteryx-js/euk_tol_collapsed_js.html

* http://www.phyloxml.org/archaeopteryx-js/bcl2_js.html

* http://www.phyloxml.org/archaeopteryx-js/influenza_ha_js.html


### Detailed developer documentation
https://docs.google.com/document/d/1COVe0iYbKtcBQxGTP4_zuimpk2FH9iusOVOgd5xCJ3A/edit


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



# forester
forester is a general suite for dealing with phylogenetic trees.

## forester Example

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






