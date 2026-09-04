/**
 *  Copyright (C) 2026 Christian M. Zmasek
 *  Copyright (C) 2026 Yun Zhang
 *  Copyright (C) 2026 J. Craig Venter Institute
 *  All rights reserved
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2.1 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA
 *
 */

// v 2.3.2
// 2026-04-22
//
// forester.js is a general suite for dealing with phylogenetic trees.
// 
// forester.js is used by Archaeopteryx.js:
//   https://github.com/cmzmasek/archaeopteryx-js
//   https://www.npmjs.com/package/archaeopteryx
//
// Availability:
//   https://github.com/cmzmasek/archaeopteryx-js
//   https://www.npmjs.com/package/archaeopteryx
//
// Dependencies: none
//
//
// In the following is a basic example shows how to parse a New Hampshire formatted String
// into to a object representing a phylogenetic tree.
// Followed by pre- and post-order traversal,
// and writing back to a New Hampshire formatted String.
//
// Change './forester' to 'forester' if you use this code outside of this package
//
// let forester = require('./forester').forester;
//
// let newHampshireFormattedString = "(((a:1,b:1,c:1)N:2,(d:1,e:1)M:4)O:4,f:1)R:1;";
// let phylogeneticTree = forester.parseNewHampshire(newHampshireFormattedString);
//
// console.log('Pre-order traversal:');
// forester.preOrderTraversalAll(forester.getTreeRoot(phylogeneticTree), function (n) {
//     console.log(n.name + ':' + n.branch_length);
// });
//
// console.log('Post-order traversal:');
// forester.postOrderTraversalAll(forester.getTreeRoot(phylogeneticTree), function (n) {
//     console.log(n.name + ':' + n.branch_length);
// });
//
// console.log('In New Hampshire format:');
// let nh = forester.toNewHampshire(phylogeneticTree);
// console.log(nh);


(function forester() {

    "use strict";

    const BRANCH_EVENT_REF = 'aptx:branch_event';
    const BRANCH_EVENT_DATATYPE = 'xsd:string';
    const BRANCH_EVENT_APPLIES_TO = 'parent_branch';
    const NH_FORMAT_ERR = 'New Hampshire (Newick) format error: ';

    const NUMBERS_ONLY_PATTERN = /^[-+]?[0-9\\.]+$/;



    /**
     * Sets links to parent nodes for all nodes in a
     * phyloXML-based tree object
     *
     * @param phy - A phyloXML-based tree object.
     */
    forester.addParents = function (phy) {
        if (phy.children) {
            for (let i = phy.children.length - 1; i >= 0; --i) {
                let c = phy.children[i];
                c.parent = phy;
                forester.addParents(c);
            }
        }
    };

    /**
     * Returns the real root node of a
     * phyloXML-based tree object.
     * Precondition: needs to have parents set.
     *
     * @param phy - A phyloXML-based tree object or node.
     * @returns {*} - The real tree root node.
     */
    forester.getTreeRoot = function (phy) {
        let root = phy;
        if (!root.parent && root.children && root.children.length === 1) {
            root = root.children[0];
        }
        while (root.parent && root.parent.parent) {
            root = root.parent;
        }
        return root;
    };

    /**
     * Visits all non-collapsed child nodes of a node
     * while applying a function in pre-order.
     *
     * @param node - The root of the subtree to traverse.
     * @param fn - The function to apply.
     */
    forester.preOrderTraversal = function (node, fn) {
        fn(node);
        if (node.children) {
            for (let i = node.children.length - 1; i >= 0; --i) {
                forester.preOrderTraversal(node.children[i], fn);
            }
        }
    };

    /**
     * Visits all child nodes of a node
     * while applying a function in pre-order.
     *
     * @param node - The root of the subtree to traverse.
     * @param fn - The function to apply.
     */
    forester.preOrderTraversalAll = function (node, fn) {
        fn(node);
        if (node.children) {
            for (let i = node.children.length - 1; i >= 0; --i) {
                forester.preOrderTraversalAll(node.children[i], fn);
            }
        } else if (node._children) {
            for (let ii = node._children.length - 1; ii >= 0; --ii) {
                forester.preOrderTraversalAll(node._children[ii], fn);
            }
        }
    };

    forester.postOrderTraversalAll = function (node, fn) {
        if (node.children) {
            let l = node.children.length;
            for (let i = 0; i < l; ++i) {
                forester.postOrderTraversalAll(node.children[i], fn);
            }
        } else if (node._children) {
            let ll = node._children.length;
            for (let ii = 0; ii < ll; ++ii) {
                forester.postOrderTraversalAll(node._children[ii], fn);
            }
        }
        fn(node);
    };


    forester.findByNodeName = function (node, name) {
        let found = [];
        forester.preOrderTraversalAll(node, function (n) {
            if (n.name === name) {
                found.push(n);
            }
        });
        return found;
    };

    forester.findByTaxonomyCode = function (node, code) {
        let found = [];
        forester.preOrderTraversalAll(node, function (n) {
            if (n.taxonomies && n.taxonomies.length > 0 && n.taxonomies[0].code === code) {
                found.push(n);
            }
        });
        return found;
    };

    forester.findByTaxonomyScientificName = function (node, scientificName) {
        let found = [];
        forester.preOrderTraversalAll(node, function (n) {
            if (n.taxonomies && n.taxonomies.length > 0 && n.taxonomies[0].scientific_name === scientificName) {
                found.push(n);
            }
        });
        return found;
    };


    /**
     * To delete a sub-tree or external node.
     *
     * @param phy
     * @param nodeToDelete
     */
    forester.deleteSubtree = function (phy, nodeToDelete) {
        if (!phy) {
            throw ("cannot delete null tree");
        }
        if (!nodeToDelete) {
            throw ("cannot delete null node");
        }
        if (!nodeToDelete.parent || !nodeToDelete.parent.parent) {
            throw ("cannot delete root");
        }
        if (!nodeToDelete.parent.parent.parent) {
            throw ("cannot delete direct child of root");
        }

        let p = nodeToDelete.parent;

        if ((p.children) && (p.children.length > 1)) {
            let i = p.children.indexOf(nodeToDelete);
            if (i !== -1) {
                p.children.splice(i, 1);
            }
        }
        if ((p._children) && (p._children.length > 1)) {
            let ii = p._children.indexOf(nodeToDelete);
            if (ii !== -1) {
                p._children.splice(ii, 1);
            }
        }

        if (p.children.length === 1) {
            let pp = p.parent;
            let cni = forester.getChildNodeIndex(pp, p);
            if ((cni < 0) || (cni > (pp.children.length - 1))) {
                throw ("this should never have happened, child node index = " + cni);
            }
            let x = p.children[0];
            let nbl = undefined;
            if (x.branch_length || p.branch_length) {
                nbl = (x.branch_length > 0 ? x.branch_length : 0) + (p.branch_length > 0 ? p.branch_length : 0);
            }
            x.parent = pp;
            pp.children[cni] = x;
            x.branch_length = nbl;
        }

    };


    /**
     * To re-root a tree object.
     *
     * @param phy - The tree to be re-rooted.
     * @param node - The node on where to place the new root (on its parent branch).
     * @param branchLength - The branch length to use if new root is not placed in the middle (if
     * non-negative).
     */
    forester.reRoot = function (phy, node, branchLength) {
        if (!phy) {
            throw ("cannot re-root null tree");
        }
        if (!node) {
            throw ("cannot re-root on null node");
        }
        if (!branchLength) {
            branchLength = -1;
        }
        if (forester.isString(node)) {
            let nodes = forester.findByNodeName(phy, node);
            if (nodes.length > 1) {
                throw ("node name '" + node + "' is not unique");
            } else if (nodes.length < 1) {
                throw ("node name '" + node + "' is not found");
            }
            node = nodes[0];
        }

        phy.rooted = true;
        let root = forester.getTreeRoot(phy);

        if (!node.parent || !node.parent.parent) {
            //do noting
        } else if (!node.parent.parent.parent) {
            if ((node.parent.children.length === 2) && (branchLength >= 0)) {
                let d = node.parent.children[0].branch_length + node.parent.children[1].branch_length;
                let other;
                if (node.parent.children[0] === node) {
                    other = node.parent.children[1];
                } else {
                    other = node.parent.children[0];
                }
                node.branch_length = branchLength;
                let dm = d - branchLength;
                if (dm >= 0) {
                    other.branch_length = dm;
                } else {
                    other.branch_length = 0;
                }
            }
            if (node.parent.children.length > 2) {
                let index = forester.getChildNodeIndex(node.parent, node);
                let dn = node.branch_length;
                let prev_root = root;
                prev_root.children.splice(index, 1);
                let nr = {};
                nr.children = [];
                forester.setChildNode(nr, 0, node);
                forester.setChildNode(nr, 1, prev_root);

                forester.copyBranchData(node, prev_root);

                phy.children[0] = nr;
                nr.parent = phy;
                if (branchLength >= 0) {
                    node.branch_length = branchLength;
                    let dnmp = dn - branchLength;
                    if (dnmp >= 0) {
                        prev_root.branch_length = dnmp;
                    } else {
                        prev_root.branch_length = 0;
                    }
                } else {
                    if (dn >= 0) {
                        let dn2 = dn / 2.0;
                        node.branch_length = dn2;
                        prev_root.branch_length = dn2;
                    }
                }
            }
        } else {
            let a = node;
            let new_root = {};
            let distance1;
            let distance2 = 0.0;
            let branch_data_1;
            let branch_data_2 = null;
            let b = a.parent;
            let c = b.parent;

            new_root.children = [];
            forester.setChildNode(new_root, 0, a);
            forester.setChildNode(new_root, 1, b);

            distance1 = c.branch_length;

            branch_data_1 = forester.getBranchData(c);

            c.branch_length = b.branch_length;

            forester.copyBranchData(b, c);
            forester.copyBranchData(a, b);

            // New root is always placed in the middle of the branch:
            if (!a.branch_length) {
                b.branch_length = undefined;
            } else {
                if (branchLength >= 0.0) {
                    let diff = a.branch_length - branchLength;
                    a.branch_length = branchLength;
                    b.branch_length = (diff >= 0.0 ? diff : 0.0);
                } else {
                    let d2 = a.branch_length / 2.0;
                    a.branch_length = d2;
                    b.branch_length = d2;
                }
            }
            setChildNodeOnly(b, forester.getChildNodeIndex(b, a), c);
            // moving to the old root, swapping references:
            while (c.parent.parent) {
                a = b;
                b = c;
                c = c.parent;
                setChildNodeOnly(b, forester.getChildNodeIndex(b, a), c);
                b.parent = a;
                distance2 = c.branch_length;
                branch_data_2 = forester.getBranchData(c);
                c.branch_length = distance1;
                forester.setBranchData(c, branch_data_1);
                distance1 = distance2;
                branch_data_1 = branch_data_2;
            }
            // removing the old root:
            if (c.children.length === 2) {
                let node2 = c.children[1 - forester.getChildNodeIndex(c, b)];
                node2.parent = b;
                if ((!c.branch_length) && (!node2.branch_length)) {
                    node2.branch_length = undefined;
                } else {
                    node2.branch_length = (c.branch_length >= 0.0 ? c.branch_length : 0.0) + (node2.branch_length >= 0.0 ? node2.branch_length : 0.0);
                }
                let cbd = forester.getBranchData(c);
                if (cbd) {
                    forester.setBranchData(node2, cbd);
                }
                let l = b.children.length;
                for (let i = 0; i < l; ++i) {
                    if (b.children[i] === c) {
                        setChildNodeOnly(b, i, node2);
                        break;
                    }
                }
            } else {
                c.parent = b;
                forester.removeChildNode(c, forester.getChildNodeIndex(c, b));
            }
            phy.children[0] = new_root;
            new_root.parent = phy;
            forester.addParents(phy);
        }

        function setChildNodeOnly(parentNode, i, node) {
            if (parentNode.children.length <= i) {
                parentNode.children.push(node);
            } else {
                parentNode.children[i] = node;
            }
        }
    };

    forester.midpointRoot = function (phy) {
        let root = forester.getTreeRoot(phy);
        let extNodes = forester.getAllExternalNodes(root);
        if ((extNodes.length < 2) || (forester.calcMaxBranchLength(root) <= 0)) {
            return;
        }
        let counter = 0;
        let totalNodes = forester.getAllNodes(phy).length;
        while (true) {
            if (++counter > (totalNodes + 1)) {
                throw('this should not have happened: midpoint rooting does not converge');
            }
            let a = null;
            let da = 0;
            let db = 0;
            let cl = forester.getTreeRoot(phy).children.length;
            for (let i = 0; i < cl; ++i) {
                let f = forester.getFurthestDescendant(forester.getTreeRoot(phy).children[i]);
                let df = forester.getDistance(f, forester.getTreeRoot(phy));
                if (df > 0) {
                    if (df > da) {
                        db = da;
                        da = df;
                        a = f;
                    } else if (df > db) {
                        db = df;
                    }
                }
            }
            let diff = da - db;
            if (diff < 0.0001) {
                break;
            }
            let x = da - (diff / 2.0);
            while ((x > a.branch_length) && a.parent) {
                x -= (a.branch_length > 0 ? a.branch_length : 0);
                a = a.parent;
            }
            forester.reRoot(phy, a, x);
        }
    };

    forester.getFurthestDescendant = function (node) {
        let children = forester.getAllExternalNodes(node);
        let farthest = null;
        let longest = -1000000;
        let l = children.length;
        for (let i = 0; i < l; ++i) {
            let dist = forester.getDistance(children[i], node);
            if (dist > longest) {
                farthest = children[i];
                longest = dist;
            }
        }
        return farthest;
    };

    /**
     * Calculates the distance between PhylogenyNodes n1 and n2.
     * PRECONDITION: n1 is a descendant of n2.
     *
     * @param n1 a descendant of n2
     * @param n2
     * @returns {number} distance between n1 and n2
     */
    forester.getDistance = function (n1, n2) {
        let d = 0.0;
        while (n1 !== n2) {
            if (n1.branch_length > 0.0) {
                d += n1.branch_length;
            }
            n1 = n1.parent;
        }
        return d;
    };

    forester.removeChildNode = function (parentNode, i) {
        if (!parentNode.children) {
            throw ("cannot remove the child node for a external node");
        }
        if ((i >= parentNode.children.length) || (i < 0)) {
            throw ("attempt to get child node " + i + " of a node with " + parentNode.children.length + " child nodes.");
        }
        parentNode.children[i].parent = undefined;
        parentNode.children.splice(i, 1);
    };


    /**
     * Inserts node node at the specified position i into the list of
     * child nodes of parentNode. This does not allow null slots in the list of child nodes:
     * If i is larger than the number of child nodes, node is just added to the
     * list, not placed at index i.
     */
    forester.setChildNode = function (parentNode, i, node) {
        node.parent = parentNode;
        if (parentNode.children.length <= i) {
            parentNode.children.push(node);
        } else {
            parentNode.children[i] = node;
        }
    };


    forester.getBranchData = function (node) {
        let branchData = null;
        if (node.width || node.color || node.confidences) {
            branchData = {};
            branchData.width = node.width;
            branchData.color = node.color;
            branchData.confidences = node.confidences;
        }
        return branchData;
    };


    forester.setBranchData = function (node, branchData) {
        if (branchData) {
            node.width = branchData.width;
            node.color = branchData.color;
            node.confidences = branchData.confidences;
        }
    };

    forester.copyBranchData = function (nodeFrom, nodeTo) {
        nodeTo.width = nodeFrom.width;
        nodeTo.color = nodeFrom.color;
        nodeTo.confidences = nodeFrom.confidences;
    };


    forester.getChildNodeIndex = function (parentNode, childNode) {
        if (!parentNode) {
            throw ("cannot get the child index for a root node");
        }
        let c = parentNode.children.length;
        for (let i = 0; i < c; ++i) {
            if (parentNode.children[i] === childNode) {
                return i;
            }
        }
        throw ("unexpected exception: Could not determine the child index for a node");
    };


    forester.getChildren = function (node) {
        return node._children ? node._children : (node.children ? node.children : []);
    };


    forester.calcAverageTreeHeight = function (node, externalDescendants) {
        let c = externalDescendants ? externalDescendants : forester.getAllExternalNodes(node);
        let l = c.length;
        let s = 0;
        for (let i = 0; i < l; ++i) {
            let cc = c[i];
            while (cc !== node) {
                if (cc.branch_length > 0) {
                    s += cc.branch_length;
                }
                cc = cc.parent;
            }
        }
        return s / l;
    };


    // ------------------------------------------------------------------
    // Automatic visualization candidates
    // ------------------------------------------------------------------
    //
    // Decides, from the tree alone, which of its elements are worth offering
    // as a Color, Color-range, or Shape visualization. This replaces the old
    // caller-supplied "nodeVisualizations" configuration: the tree is the
    // only input.
    //
    // Only external nodes are considered; the domains always come from the
    // COMPLETE tree, so a value keeps its colour inside a subtree view even
    // when the subtree does not contain it.
    //
    // Candidates: taxonomy code / scientific name / common name, sequence
    // name / symbol / gene name, and node properties (applies_to "node").
    // The "style:" namespace is never a candidate -- the desktop reserves it
    // for per-node rendering instructions (font_color, node_shape, ...), so
    // treating it as data would mean colouring by a colour.
    //
    // The rules, tuned against the real ViPR / BV-BRC trees in docs/data
    // (which test/visualization_test.js holds as executable fixtures):
    //
    //   coverage    present on >= 2/3 of the external nodes. Database
    //               exports are always patchy -- demanding 100% would
    //               reject nearly every field of the BV-BRC trees while a
    //               field on 9% of nodes (state_province) says nothing.
    //               Nodes without a value simply keep the default look.
    //   repetition  at least 2 distinct values (1 paints the whole tree
    //               alike), and fewer distinct values than external nodes
    //               (all-unique means identifiers).
    //   categorical <= 20 distinct values -> Color. Above ~12 the reader
    //               leans on the legend, but the real trees cluster at
    //               15-17 (host names, countries, taxonomy codes).
    //   wide        21+ distinct values are still offered -- as the desktop
    //               does, every value gets a colour and the LEGEND caps the
    //               display -- but only when values genuinely repeat:
    //               distinct/covered <= 0.6, or near-unique fields (strains,
    //               species names, dates) would flood the menus. Wide fields
    //               rank after everything else and are never auto-applied.
    //   numeric     every value parses as a finite number. Up to 10 distinct
    //               values default to individual colours -- numbers that few
    //               are usually codes (HA/NA subtypes), and ten is what the
    //               palette's strong first half holds -- 11 to 20 default to
    //               a Color-range, and both of those may be switched in the
    //               legend; above 20 it is a range with no switch. Guard:
    //               distinct/covered <= 0.9, or "numeric" identifiers
    //               (genome ids) would become ramps.
    //   shape       <= 7 distinct values (d3 v7 has exactly 7 distinct
    //               fill symbols), numeric or not -- two years as two
    //               shapes is genuinely useful.
    //   multi-value a ref carried more than once by any external node is
    //               not a candidate: a node cannot be two colours, and
    //               picking one silently is worse than not offering it.
    //
    const VIS_MIN_COVERAGE_NUM = 2;    // coverage >= 2/3, held as a
    const VIS_MIN_COVERAGE_DEN = 3;    // fraction so the test is integer-exact
    const VIS_MAX_COLOR_CATEGORIES = 20;
    const VIS_MAX_SHAPE_CATEGORIES = 7;
    const VIS_NUMERIC_CATEGORY_MAX = 10;   // <= this many distinct numbers -> colours by default
    const VIS_WIDE_REPEAT_NUM = 3;         // wide categorical: distinct/covered <= 0.6,
    const VIS_WIDE_REPEAT_DEN = 5;         // held integer-exact
    const VIS_MAX_NUMERIC_UNIQUE_NUM = 9;    // distinct/covered <= 0.9,
    const VIS_MAX_NUMERIC_UNIQUE_DEN = 10;   // integer-exact as well
    const VIS_EXCLUDED_REF_PREFIX = 'style:';

    // ---- display normalization --------------------------------------------
    //
    // Property values are grouped for colouring after a normalization pass,
    // following the desktop's PropertyColorScheme with two deliberate
    // extensions. The desktop's part: values are trimmed, underscores read as
    // spaces, whitespace runs collapse, grouping is case-insensitive, and for
    // refs literally named "host" / "country" a trailing qualifier is cut
    // (everything from the first ';' / ':' -- "USA:CA" groups as "USA",
    // "Homo sapiens; sex: M" as "Homo sapiens"). Our extensions, chosen for a
    // VISUALIZATION tool that should look good on the data it is given: a
    // small dictionary of common-animal synonyms folds scientific names and
    // spelling variants into one capitalized common name ("bovine", "calf",
    // "cattle" and "Bos taurus" are all Cow -- including "Human", where the
    // desktop folds the other way); and a qualifier cut that would leave an
    // unclosed "(" behind is trimmed back to before it, so
    // "Saimiri boliviensis (squirrel monkey; voucher: X)" reads as
    // "Saimiri boliviensis" rather than dangling.
    //
    // Matching is WHOLE-VALUE only (after a trailing parenthetical is tried
    // stripped: "Bos taurus (cattle)" looks up "bos taurus") -- never by
    // substring, so "ferret badger" (a Melogale, not a ferret) and
    // "42-day-old pig" keep their own rows. The dictionary applies to
    // property fields only; taxonomy and sequence elements are curated text
    // and stay verbatim. Node names, exports, search, and the node-data
    // dialog always show the raw values -- this is display grouping, nothing
    // more.
    const VIS_SYNONYMS = {
        'Human': ['humans', 'homo sapiens', 'h. sapiens'],
        'Cow': ['bovine', 'calf', 'cattle', 'bull', 'heifer', 'bos taurus', 'b. taurus'],
        'Chicken': ['broiler chicken', 'broiler', 'hen', 'rooster', 'gallus gallus', 'g. gallus', 'gallus gallus domesticus'],
        'Mouse': ['house mouse', 'murine', 'mus musculus', 'm. musculus'],
        'Rat': ['brown rat', 'norway rat', 'black rat', 'rattus norvegicus', 'r. norvegicus', 'rattus rattus'],
        'Ferret': ['domestic ferret', 'mustela putorius furo', 'mustela furo', 'm. putorius furo'],
        'Guinea pig': ['cavy', 'domestic guinea pig', 'cavia porcellus', 'c. porcellus'],
        'Rhesus monkey': ['rhesus macaque', 'macaca mulatta', 'm. mulatta'],
        'Rabbit': ['european rabbit', 'oryctolagus cuniculus', 'o. cuniculus'],
        'Dog': ['canine', 'canis familiaris', 'canis lupus familiaris', 'c. familiaris'],
        'Cat': ['feline', 'domestic cat', 'felis catus', 'f. catus', 'felis silvestris catus'],
        'Duck': ['mallard', 'mallard duck', 'domestic duck', 'anas platyrhynchos', 'a. platyrhynchos'],
        'Pig': ['swine', 'porcine', 'hog', 'piglet', 'sus scrofa', 's. scrofa', 'sus scrofa domesticus'],
        'Horse': ['equine', 'mare', 'stallion', 'equus caballus', 'e. caballus'],
        'Sheep': ['ovine', 'lamb', 'ewe', 'ovis aries', 'o. aries'],
        'Goat': ['caprine', 'capra hircus', 'c. hircus'],
        'Camel': ['dromedary', 'bactrian camel', 'camelus dromedarius', 'camelus bactrianus', 'c. dromedarius']
    };
    const VIS_SYNONYM_LOOKUP = {};
    Object.keys(VIS_SYNONYMS).forEach(function (canon) {
        VIS_SYNONYM_LOOKUP[canon.toLowerCase()] = canon;
        VIS_SYNONYMS[canon].forEach(function (syn) {
            VIS_SYNONYM_LOOKUP[syn] = canon;
        });
    });

    // ';' for host fields, ':' for country fields, null otherwise -- matched
    // on the ref's local name EXACTLY, so host_group and isolation_country
    // keep their full values.
    function visQualifierCut(ref) {
        let i = ref.lastIndexOf(':');
        let local = (i >= 0 ? ref.substring(i + 1) : ref).toLowerCase();
        if (local === 'country') {
            return ':';
        }
        if (local === 'host') {
            return ';';
        }
        return null;
    }

    // The display form a raw property value is grouped under (case is
    // preserved here; grouping lowercases it).
    function visDisplayLabel(value, cut) {
        let s = value;
        if (cut) {
            let at = s.indexOf(cut);
            if (at >= 0) {
                s = s.substring(0, at);
                // the cut may land inside a parenthetical; trim back to
                // before the first unclosed '('
                let open = [];
                for (let i = 0; i < s.length; ++i) {
                    if (s.charAt(i) === '(') {
                        open.push(i);
                    } else if (s.charAt(i) === ')') {
                        open.pop();
                    }
                }
                if (open.length > 0) {
                    s = s.substring(0, open[0]);
                }
            }
        }
        s = s.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
        let hit = VIS_SYNONYM_LOOKUP[s.toLowerCase()];
        if (!hit) {
            let stripped = s.replace(/\s*\([^()]*\)\s*$/, '');
            if (stripped !== s && stripped.length > 0) {
                hit = VIS_SYNONYM_LOOKUP[stripped.toLowerCase()];
            }
        }
        return hit || s;
    }

    // Fixed candidate slots for the phyloXML elements (properties use their ref).
    const VIS_ELEMENT_SLOTS = [
        {id: 'tax:code', kind: 'taxonomy', label: 'Taxonomy Code', get: function (t) { return t.code; }},
        {id: 'tax:scientific_name', kind: 'taxonomy', label: 'Scientific Name', get: function (t) { return t.scientific_name; }},
        {id: 'tax:common_name', kind: 'taxonomy', label: 'Common Name', get: function (t) { return t.common_name; }},
        {id: 'seq:name', kind: 'sequence', label: 'Sequence Name', get: function (s) { return s.name; }},
        {id: 'seq:symbol', kind: 'sequence', label: 'Sequence Symbol', get: function (s) { return s.symbol; }},
        {id: 'seq:gene_name', kind: 'sequence', label: 'Gene Name', get: function (s) { return s.gene_name; }}
    ];

    // "geographic_group" reads like a database column; a menu should say
    // "Geographic Group". Underscores become spaces, camelCase is split
    // (FluSeason -> Flu Season, GlobalH1Clade -> Global H1 Clade), and
    // all-lowercase words are capitalized. Words that already carry capitals
    // (PANGO, HA, H5N1) are left exactly as written.
    function prettifyVisLabel(name) {
        return name
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([0-9])([A-Z][a-z])/g, '$1 $2')
            .split(' ')
            .map(function (w) {
                return /^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.substring(1) : w;
            })
            .join(' ');
    }

    forester.visualizationCandidates = function (tree) {
        let total = 0;
        let stats = {};   // id -> {kind, ref, label, nodes, values:Set, multi}

        forester.preOrderTraversalAll(tree, function (n) {
            if (n.children || n._children) {
                return;
            }
            total++;
            // gather this node's values per candidate id first, so carrying
            // the same ref twice is visible as such
            let perNode = {};
            function add(id, kind, ref, label, value) {
                if (value === undefined || value === null) {
                    return;
                }
                let v = String(value).trim();
                if (v.length === 0) {
                    return;
                }
                if (!perNode[id]) {
                    perNode[id] = {kind: kind, ref: ref, label: label, values: []};
                }
                perNode[id].values.push(v);
            }
            VIS_ELEMENT_SLOTS.forEach(function (slot) {
                let list = slot.kind === 'taxonomy' ? n.taxonomies : n.sequences;
                if (list) {
                    for (let i = 0; i < list.length; ++i) {
                        add(slot.id, slot.kind, null, slot.label, slot.get(list[i]));
                    }
                }
            });
            if (n.properties) {
                for (let i = 0; i < n.properties.length; ++i) {
                    let p = n.properties[i];
                    if (p.ref && p.applies_to === 'node'
                        && p.ref.indexOf(VIS_EXCLUDED_REF_PREFIX) !== 0) {
                        add('prop:' + p.ref, 'property', p.ref, null, p.value);
                    }
                }
            }
            Object.keys(perNode).forEach(function (id) {
                let g = perNode[id];
                if (!stats[id]) {
                    stats[id] = {kind: g.kind, ref: g.ref, label: g.label,
                        cut: g.kind === 'property' ? visQualifierCut(g.ref) : null,
                        nodes: 0, keys: {}, multi: false};
                }
                let s = stats[id];
                s.nodes++;
                if (g.values.length > 1) {
                    s.multi = true;
                }
                for (let i = 0; i < g.values.length; ++i) {
                    // properties group under their normalized display form;
                    // taxonomy / sequence elements are curated text, verbatim
                    let display = g.kind === 'property' ? visDisplayLabel(g.values[i], s.cut) : g.values[i];
                    if (display.length === 0) {
                        continue;
                    }
                    let key = g.kind === 'property' ? display.toLowerCase() : display;
                    if (!s.keys[key]) {
                        s.keys[key] = {count: 0, spellings: {}};
                    }
                    s.keys[key].count++;
                    s.keys[key].spellings[display] = (s.keys[key].spellings[display] || 0) + 1;
                }
            });
        });

        let candidates = [];
        Object.keys(stats).forEach(function (id) {
            let s = stats[id];
            if (s.multi) {
                return;
            }
            let covered = s.nodes;
            // one legend row per group: the dictionary canonical where one
            // applied (it is then the only recorded spelling), otherwise the
            // most frequent raw spelling (ties alphabetically), capitalized
            let canon = {};
            let counts = {};
            Object.keys(s.keys).forEach(function (key) {
                let group = s.keys[key];
                let rep = null;
                let best = -1;
                Object.keys(group.spellings).forEach(function (spelling) {
                    let n = group.spellings[spelling];
                    if (n > best || (n === best && spelling < rep)) {
                        rep = spelling;
                        best = n;
                    }
                });
                if (s.kind === 'property') {
                    rep = rep.charAt(0).toUpperCase() + rep.substring(1);
                }
                canon[key] = rep;
                counts[rep] = group.count;
            });
            let distinct = Object.keys(canon).length;
            if (covered * VIS_MIN_COVERAGE_DEN < total * VIS_MIN_COVERAGE_NUM) {
                return;
            }
            if (distinct < 2) {
                return;
            }
            let values = Object.keys(counts);
            let numeric = values.every(function (v) {
                return Number.isFinite(Number(v));
            });
            let colorMode;
            let switchable = false;
            let wide = false;
            if (numeric) {
                if (distinct * VIS_MAX_NUMERIC_UNIQUE_DEN > covered * VIS_MAX_NUMERIC_UNIQUE_NUM) {
                    return;
                }
                colorMode = distinct <= VIS_NUMERIC_CATEGORY_MAX ? 'category' : 'range';
                switchable = distinct <= VIS_MAX_COLOR_CATEGORIES;
                values.sort(function (a, b) {
                    return Number(a) - Number(b);
                });
            } else {
                if (distinct >= total) {
                    return;
                }
                if (distinct > VIS_MAX_COLOR_CATEGORIES) {
                    if (distinct * VIS_WIDE_REPEAT_DEN > covered * VIS_WIDE_REPEAT_NUM) {
                        return;
                    }
                    wide = true;
                }
                colorMode = 'category';
                values.sort();
            }
            // Rank by how much a visualization would actually show: coverage
            // times balance, where balance is the normalized entropy of the
            // value distribution. A field that is one value on 92% of nodes
            // scores low even with full coverage; an even 4-way split on 90%
            // of nodes scores high.
            let entropy = 0;
            values.forEach(function (v) {
                let p = counts[v] / covered;
                entropy -= p * Math.log(p);
            });
            let balance = entropy / Math.log(distinct);
            candidates.push({
                id: id,
                kind: s.kind,
                ref: s.ref,
                // property labels drop the namespace prefix and are prettified;
                // a cross-namespace collision is resolved below by restoring
                // the full ref verbatim
                label: s.label || prettifyVisLabel(s.ref.indexOf(':') >= 0 ? s.ref.substring(s.ref.indexOf(':') + 1) : s.ref),
                numeric: numeric,
                coverage: covered,
                total: total,
                values: values,
                counts: counts,
                canon: s.kind === 'property' ? canon : null,
                cut: s.cut,
                score: (covered / total) * balance,
                colorMode: colorMode,
                switchable: switchable,
                wide: wide,
                shape: distinct <= VIS_MAX_SHAPE_CATEGORIES
            });
        });

        let labelCount = {};
        candidates.forEach(function (c) {
            labelCount[c.label] = (labelCount[c.label] || 0) + 1;
        });
        candidates.forEach(function (c) {
            if (labelCount[c.label] > 1 && c.ref) {
                c.label = c.ref;
            }
        });

        // Best first: clean categorical fields, then numeric ranges, then the
        // wide categoricals (offered, never leading) -- within each tier by
        // score, ties alphabetically. The first entry is what the viewer
        // applies on load.
        function tierOf(c) {
            if (c.colorMode === 'category') {
                return c.wide ? 2 : 0;
            }
            return 1;
        }
        candidates.sort(function (a, b) {
            let ta = tierOf(a);
            let tb = tierOf(b);
            if (ta !== tb) {
                return ta - tb;
            }
            if (a.score !== b.score) {
                return b.score - a.score;
            }
            let la = a.label.toLowerCase();
            let lb = b.label.toLowerCase();
            return la < lb ? -1 : (la > lb ? 1 : (a.id < b.id ? -1 : 1));
        });
        return candidates;
    };

    // Decides whether a property should REPLACE the node names as the
    // displayed tip label, and which one. Database exports often name their
    // tips with identifiers (PATRIC.10334.249.FJ478159..., 11320.305060)
    // while carrying the readable name in a property such as
    // BVBRC:genome_name. All of the following must hold, or the answer is
    // null and the names stand:
    //
    //   - at least 80% of the named external nodes have identifier-like
    //     names (no spaces, at least one digit) -- readable names are never
    //     overridden;
    //   - the property's local name ends in "name" (genome_name,
    //     sample_name, ...): only fields that say they are names qualify;
    //   - it covers at least 90% of the external nodes, is mostly distinct
    //     (>= 50%), and is mostly wordy (>= 50% of values contain a space)
    //     -- which is what separates genome_name from strain codes.
    //
    // Of several qualifiers, the best-covered wins, ties alphabetically.
    forester.nodeLabelProperty = function (tree) {
        let total = 0;
        let named = 0;
        let idLike = 0;
        let refs = {};   // ref -> {covered, values:Set, wordy}
        forester.preOrderTraversalAll(tree, function (n) {
            if (n.children || n._children) {
                return;
            }
            total++;
            if (n.name && String(n.name).trim().length > 0) {
                named++;
                let name = String(n.name).trim();
                if (!/\s/.test(name) && /\d/.test(name)) {
                    idLike++;
                }
            }
            if (n.properties) {
                let seen = {};
                for (let i = 0; i < n.properties.length; ++i) {
                    let p = n.properties[i];
                    if (!p.ref || p.applies_to !== 'node' || seen[p.ref]
                        || p.ref.indexOf(VIS_EXCLUDED_REF_PREFIX) === 0) {
                        continue;
                    }
                    let local = p.ref.indexOf(':') >= 0 ? p.ref.substring(p.ref.indexOf(':') + 1) : p.ref;
                    if (!/name$/i.test(local)) {
                        continue;
                    }
                    let v = (p.value === undefined || p.value === null) ? '' : String(p.value).trim();
                    if (v.length === 0) {
                        continue;
                    }
                    seen[p.ref] = true;
                    if (!refs[p.ref]) {
                        refs[p.ref] = {covered: 0, values: new Set(), wordy: 0};
                    }
                    refs[p.ref].covered++;
                    refs[p.ref].values.add(v);
                    if (v.indexOf(' ') >= 0) {
                        refs[p.ref].wordy++;
                    }
                }
            }
        });
        if (named === 0 || idLike * 10 < named * 8) {
            return null;
        }
        let best = null;
        Object.keys(refs).sort().forEach(function (ref) {
            let r = refs[ref];
            if (r.covered * 10 < total * 9) {
                return;
            }
            if (r.values.size * 2 < r.covered) {
                return;
            }
            if (r.wordy * 2 < r.covered) {
                return;
            }
            if (!best || r.covered > refs[best].covered) {
                best = ref;
            }
        });
        return best;
    };

    // The desktop's reserved "style:" namespace, read back as the rendering
    // instruction it is (NodeVisualData on the desktop): per-node font colour,
    // node colour, node shape, font size and font style. The rest of the
    // vocabulary (font name, node_size, node_transparency, node_fill_type) is
    // not honoured by this viewer yet. Returns null when the node carries
    // none of the five.
    forester.nodeVisualStyle = function (node) {
        if (!node.properties) {
            return null;
        }
        let style = null;
        function put(key, value) {
            if (style === null) {
                style = {};
            }
            style[key] = value;
        }
        for (let i = 0; i < node.properties.length; ++i) {
            let p = node.properties[i];
            if (!p.ref || p.applies_to !== 'node' || p.value === undefined || p.value === null) {
                continue;
            }
            let v = String(p.value).trim();
            if (v.length === 0) {
                continue;
            }
            if (p.ref === 'style:font_color') {
                put('fontColor', v);
            } else if (p.ref === 'style:node_color') {
                put('nodeColor', v);
            } else if (p.ref === 'style:node_shape') {
                // the desktop's shape names; rectangle renders as our square
                if (v === 'rectangle') {
                    put('shape', 'square');
                } else if (v === 'circle' || v === 'diamond') {
                    put('shape', v);
                }
            } else if (p.ref === 'style:font_size') {
                let n = Number(v);
                if (Number.isFinite(n) && n > 0) {
                    put('fontSize', Math.min(48, Math.max(4, n)));
                }
            } else if (p.ref === 'style:font_style') {
                if (v === 'italic' || v === 'bold' || v === 'bold_italic' || v === 'plain') {
                    put('fontStyle', v);
                }
            }
        }
        return style;
    };

    // The boring part of every tip name. When the displayed names all share
    // a long prefix ("Influenza A virus ..."), a shortener that keeps the
    // first characters keeps exactly the characters that carry no
    // information. This returns the longest common prefix of the displayed
    // external names -- the label property's value where one is in effect,
    // the node name otherwise -- cut back to the last separator so no word
    // is split, and only when it is long enough to matter (>= 6 characters).
    // The Short Names rendering strips it before truncating, so what
    // survives is the part that tells the tips apart. The comparison is
    // case-insensitive -- "Influenza A virus" and "Influenza A Virus" are
    // the same boring prefix -- so callers must strip by LENGTH, comparing
    // case-insensitively, not by exact match.
    forester.commonNamePrefix = function (tree, labelProperty) {
        let names = [];
        let slot = labelProperty ? {kind: 'property', ref: labelProperty} : null;
        forester.preOrderTraversalAll(tree, function (n) {
            if (n.children || n._children) {
                return;
            }
            let name = slot ? forester.visualizationNodeValue(n, slot) : null;
            if (name === null && n.name !== undefined && n.name !== null) {
                let s = String(n.name).trim();
                if (s.length > 0) {
                    name = s;
                }
            }
            if (name !== null) {
                names.push(name);
            }
        });
        if (names.length < 2) {
            return '';
        }
        let prefix = names[0];
        for (let k = 1; k < names.length && prefix.length > 0; ++k) {
            let a = prefix.toLowerCase();
            let b = names[k].toLowerCase();
            let max = Math.min(a.length, b.length);
            let i = 0;
            while (i < max && a.charCodeAt(i) === b.charCodeAt(i)) {
                ++i;
            }
            if (i < prefix.length) {
                prefix = prefix.substring(0, i);
            }
        }
        if (prefix.length === 0) {
            return '';
        }
        // Trim back to the last separator ONLY when the prefix actually
        // splits a word -- "ABC_ho" against "ABC_house"/"ABC_horse" does,
        // "Influenza A virus" against "...virus A/x" and "...virus(A/y)"
        // does not, whatever character each name continues with.
        let alnum = /[A-Za-z0-9]/;
        let splitsWord = alnum.test(prefix.charAt(prefix.length - 1))
            && names.some(function (name) {
                return name.length > prefix.length && alnum.test(name.charAt(prefix.length));
            });
        if (splitsWord) {
            let cut = -1;
            for (let i = prefix.length - 1; i >= 0; --i) {
                if (' /|_.-:'.indexOf(prefix.charAt(i)) >= 0) {
                    cut = i;
                    break;
                }
            }
            prefix = cut >= 0 ? prefix.substring(0, cut + 1) : '';
        }
        return prefix.length >= 6 ? prefix : '';
    };

    // Reads a node's value for one candidate, exactly as the classifier read
    // it when it built the candidate -- the two must never drift, or a node
    // could carry a value that maps to no colour. Returns the trimmed value,
    // or null when the node has none (the node then keeps the default look).
    // Multi-valued refs never become candidates, so "the first value" is
    // "the only value".
    forester.visualizationNodeValue = function (node, candidate) {
        function clean(v) {
            if (v === undefined || v === null) {
                return null;
            }
            let s = String(v).trim();
            return s.length > 0 ? s : null;
        }
        if (candidate.kind === 'property') {
            if (node.properties) {
                for (let i = 0; i < node.properties.length; ++i) {
                    let p = node.properties[i];
                    if (p.ref === candidate.ref && p.applies_to === 'node') {
                        let v = clean(p.value);
                        if (v !== null) {
                            // a classifier-built candidate folds the value the
                            // same way its groups were built; a bare
                            // {kind, ref} probe (labels, prefixes) reads raw
                            if (candidate.canon) {
                                let display = visDisplayLabel(v, candidate.cut || null);
                                return candidate.canon[display.toLowerCase()] || display;
                            }
                            return v;
                        }
                    }
                }
            }
            return null;
        }
        let list = candidate.kind === 'taxonomy' ? node.taxonomies : node.sequences;
        if (!list) {
            return null;
        }
        for (let i = 0; i < VIS_ELEMENT_SLOTS.length; ++i) {
            if (VIS_ELEMENT_SLOTS[i].id === candidate.id) {
                for (let j = 0; j < list.length; ++j) {
                    let v = clean(VIS_ELEMENT_SLOTS[i].get(list[j]));
                    if (v !== null) {
                        return v;
                    }
                }
                return null;
            }
        }
        return null;
    };

    forester.collectPropertyRefs = function (phy, appliesTo, externalOnly) {
        let propertyRefs = new Set();
        forester.preOrderTraversalAll(phy, function (n) {

            if (!externalOnly || externalOnly !== true || (!n.children && !n._children)) {
                if (n.properties && n.properties.length > 0) {
                    let propertiesLength = n.properties.length;
                    for (let i = 0; i < propertiesLength; ++i) {
                        let property = n.properties[i];
                        if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === appliesTo) {
                            propertyRefs.add(property.ref);
                        }
                    }
                }
            }
        });
        return propertyRefs;
    };

    forester.collectBasicTreeProperties = function (tree) {
        let properties = {};
        properties.internalNodeData = false;
        properties.nodeNames = false;
        properties.longestNodeName = 0;
        properties.branchLengths = false;
        properties.confidences = false;
        properties.nodeEvents = false;
        properties.branchColors = false;
        properties.sequences = false;
        properties.taxonomies = false;
        properties.alignedMolSeqs = true;
        properties.maxMolSeqLength = 0;
        properties.externalNodesCount = 0;
        properties.nodeCount = 0;
        // How many of the tree's branches actually carry a positive length.
        // Whether a tree is worth drawing to scale is a question about the
        // majority of its branches, not about whether any branch has a length.
        properties.branchesWithPositiveLength = 0;
        properties.averageBranchLength = 0;
        let bl_counter = 0;
        let bl_sum = 0;
        // Counting the super-root would add a node and a branch that do not
        // exist -- skewing the branch-length fraction the viewer uses to choose
        // between a phylogram and a cladogram -- and from phyloXML would take
        // the tree's own name for the longest node name.
        forester.preOrderTraversalAll(realRootOf(tree), function (n) {
            properties.nodeCount += 1;
            if (n.name && n.name.length > 0) {
                properties.nodeNames = true;
                if (n.name.length > properties.longestNodeName) {
                    properties.longestNodeName = n.name.length;
                }
                if ((n.children || n._children) && (n.parent)) {
                    properties.internalNodeData = true;
                }
            }
            if (!(n.children || n._children)) {
                properties.externalNodesCount += 1;
            }
            if (n.branch_length && n.branch_length > 0) {
                properties.branchLengths = true;
                bl_sum += n.branch_length;
                bl_counter += 1;
            }
            if (n.events) {
                properties.nodeEvents = true;
            }
            if (n.color) {
                properties.branchColors = true;
            }
            if (n.sequences && n.sequences.length > 0) {
                properties.sequences = true;

                if (n.children || n._children) {
                    properties.internalNodeData = true;
                } else {
                    let s = n.sequences[0];
                    if (s.mol_seq && s.mol_seq.value) {
                        if (s.mol_seq.value.length > properties.maxMolSeqLength) {
                            properties.maxMolSeqLength = s.mol_seq.value.length;
                        }
                        if (!s.mol_seq.is_aligned) {
                            properties.alignedMolSeqs = false;
                        }
                    }
                }
            }
            if (n.taxonomies && n.taxonomies.length > 0) {
                properties.taxonomies = true;
                if (n.children || n._children) {
                    properties.internalNodeData = true;
                }
            }
            if (n.confidences && n.confidences.length > 0) {
                properties.confidences = true;
            }
            if (n.properties && n.properties.length > 0) {
                let l = n.properties.length;
                for (let p = 0; p < l; ++p) {
                    if (n.properties[p].ref === BRANCH_EVENT_REF && n.properties[p].datatype === BRANCH_EVENT_DATATYPE && n.properties[p].applies_to === BRANCH_EVENT_APPLIES_TO) {
                        properties.branchEvents = true;
                    }
                }
            }

        });

        properties.branchesWithPositiveLength = bl_counter;

        if (bl_counter > 0) {
            properties.averageBranchLength = bl_sum / bl_counter;
        }


        return properties;
    };

    /**
     * This calculates the sum of the external
     * descendants of a node. It does not count descendants
     * of collapsed nodes.
     *
     * @param node - A node.
     * @returns {number} - The sum of external descendants.
     */
    forester.calcSumOfExternalDescendants = function (node) {
        let nodes = 0;
        forester.preOrderTraversal(node, function (n) {
            if (!n.children) {
                ++nodes;
            }
        });
        return nodes;
    };

    /**
     * This calculates the sum of all the external
     * descendants of a node. It does count descendants
     * of collapsed nodes.
     *
     * @param node - A node.
     * @returns {number} - The sum of all external descendants.
     */
    forester.calcSumOfAllExternalDescendants = function (node) {
        let nodes = 0;
        forester.preOrderTraversalAll(node, function (n) {
            if (!(n.children || n._children)) {
                ++nodes;
            }
        });
        return nodes;
    };

    forester.getAllExternalNodes = function (node) {
        let nodes = [];
        forester.preOrderTraversalAll(node, function (n) {
            if (!n.children && !n._children) {
                nodes.push(n);
            }
        });
        return nodes;
    };

    forester.getAllNodes = function (phy) {
        let nodes = [];
        forester.preOrderTraversalAll(forester.getTreeRoot(phy), function (n) {
            nodes.push(n);
        });
        return nodes;
    };

    forester.calcMaxDepth = function (node) {
        let max = 0;
        forester.preOrderTraversalAll(node, function (n) {
            if (!n.children && !n._children) {
                let steps = forester.calcDepth(n);
                if (steps > max) {
                    max = steps;
                }
            }
        });
        return max;
    };

    forester.calcDepth = function (node) {

        let steps = 0;
        while (node.parent && node.parent.parent) {
            steps++;
            node = node.parent;
        }
        return steps;
    };


    forester.calcBranchLengthSimpleStatistics = function (node) {
        let stats = {};
        stats.mean = 0;
        stats.min = Number.MAX_VALUE;
        stats.max = 0;
        stats.n = 0;
        let sum = 0;
        forester.preOrderTraversalAll(node, function (n) {
            if (n !== node && n.branch_length && n.branch_length >= 0) {
                ++stats.n;
                sum += n.branch_length;
                if (n.branch_length < stats.min) {
                    stats.min = n.branch_length;
                }
                if (n.branch_length > stats.max) {
                    stats.max = n.branch_length;
                }
            }
        });
        if (stats.n > 0) {
            stats.mean = sum / stats.n;
        }
        return stats;
    };

    forester.calcMaxBranchLength = function (node) {
        let max = 0;
        forester.preOrderTraversalAll(node, function (n) {
            if (n !== node && n.branch_length && (n.branch_length > max)) {
                max = n.branch_length;
            }
        });
        return max;
    };


    forester.isHasNodeData = function (node) {
        return ((node.name && node.name.length > 0) || (node.taxonomies && node.taxonomies.length > 0) || (node.sequences && node.sequences.length > 0) || (node.properties && node.properties.length > 0));
    };


    forester.removeMaxBranchLength = function (node) {
        forester.preOrderTraversalAll(node, function (n) {
            if (n.max) {
                n.max = undefined;
            }
        });
    };

    forester.collapse = function (node) {
        if (node.children) {
            node._children = node.children;
            node.children = null;
        }
    };

    forester.unCollapse = function (node) {
        if (node._children) {
            node.children = node._children;
            node._children = null;
        }
    };

    /**
     * To parse a New Hampshire (Newick) formatted tree.
     *
     * @param nhStr - A New Hampshire (Newick) formatted string.
     * @param confidenceValuesInBrackets - Set to true if confidence values are in brackets (default: true)
     *                                     Format is: name:distance[confidence]
     *                                     Example: "bcl2:0.000393[95]"
     * @param confidenceValuesAsInternalNames - Set to true if confidence values are represented by internal names (default: false).
     * @returns {{}} - A phylogenetic tree object.
     */
    forester.parseNewHampshire = function (nhStr, confidenceValuesInBrackets, confidenceValuesAsInternalNames) {

        let NH_FORMAT_ERR_OPEN_PARENS = NH_FORMAT_ERR + 'likely cause: number of open parentheses is larger than number of close parentheses';
        let NH_FORMAT_ERR_CLOSE_PARENS = NH_FORMAT_ERR + 'likely cause: number of close parentheses is larger than number of open parentheses';

        if (confidenceValuesInBrackets === undefined) {
            confidenceValuesInBrackets = true;
        }
        if (confidenceValuesAsInternalNames === undefined) {
            confidenceValuesAsInternalNames = false;
        }
        if ((confidenceValuesInBrackets === true) && (confidenceValuesAsInternalNames === true)) {
            throw ("confidence values cannot be both in brackets and as internal node names");
        }

        let ancs = [];
        let x = {};

        let sss = nhStr.replace(/\[\s*&.+?\]/g, '');

        let ss = sss.split(/(;|\(|\)|,|:|"|')/);
        let ssl = ss.length;
        let in_double_q = false;
        let in_single_q = false;
        let buffer = '';
        for (let i = 0; i < ssl; ++i) {
            let element = ss[i].replace(/\s+/g, '');

            if (element === '"' && !in_single_q) {
                if (!in_double_q) {
                    in_double_q = true;
                } else {
                    in_double_q = false;
                    if (x.name && x.name.length > 0) {
                        x.name = x.name + buffer;
                    } else {
                        x.name = buffer;
                    }
                    buffer = '';
                }
            } else if (element === "'" && !in_double_q) {
                if (!in_single_q) {
                    in_single_q = true;
                } else {
                    in_single_q = false;
                    if (x.name && x.name.length > 0) {
                        x.name = x.name + buffer;
                    } else {
                        x.name = buffer;
                    }
                    buffer = '';
                }
            } else {
                if (in_double_q || in_single_q) {
                    buffer += ss[i].replace(/\s+/g, ' ');
                } else {
                    if (element === '(') {
                        if (!x) {
                            throw (NH_FORMAT_ERR_CLOSE_PARENS);
                        }
                        let subtree1 = {};
                        x.children = [subtree1];
                        ancs.push(x);
                        x = subtree1;
                    } else if (element === ',') {
                        if (ancs.length === 0) {
                            throw (NH_FORMAT_ERR_CLOSE_PARENS);
                        }
                        let subtree2 = {};
                        ancs[ancs.length - 1].children.push(subtree2);
                        x = subtree2;
                    } else if (element === ')') {
                        x = ancs.pop();
                    } else if (element === ':') {
                        // the separator before a branch length: the length itself
                        // is read by the branch below, so there is nothing to do here
                    } else {
                        let e = ss[i - 1];
                        if (e) {
                            e = e.trim();
                            if ((e === ')') || (e === '(') || (e === ',')) {
                                if (element && element.length > 0) {
                                    if (element.charAt(element.length - 1) === "]") {
                                        let o = element.indexOf('[');
                                        if (o > -1) {
                                            if (confidenceValuesInBrackets === true) {
                                                addConfidence(x, element);
                                            }
                                            x.name = element.substring(0, o);
                                        } else {
                                            x.name = element;
                                        }
                                    } else {
                                        x.name = element;
                                        let op = x.name.indexOf('[');
                                        if (op > -1) {
                                            let cl = x.name.indexOf(']');
                                            if (cl > op) {
                                                x.name = x.name.substring(0, op) + x.name.substring(cl + 1, x.name.length);
                                            }
                                        }
                                    }
                                }
                            } else if (e === ':') {
                                if (element && element.length > 0) {
                                    if (element.charAt(element.length - 1) === ']') {
                                        let o1 = element.indexOf('[');
                                        if (o1 > -1) {
                                            if (confidenceValuesInBrackets === true) {
                                                addConfidence(x, element);
                                            }
                                            let bl = parseFloat(element.substring(0, o1));
                                            if (forester.isNumber(bl)) {
                                                x.branch_length = bl;
                                            }
                                        }
                                    } else {
                                        let b = parseFloat(element);
                                        if (forester.isNumber(b)) {
                                            x.branch_length = b;
                                        } else {
                                            throw (NH_FORMAT_ERR + 'could not parse branch-length from "' + element + '"');
                                        }
                                    }
                                }
                            } else if (e === '"' || e === "'") {
                                if ((element && element.length > 0) && (x.name && x.name.length > 0)) {
                                    if (element.charAt(element.length - 1) === "]") {
                                        let opp = element.indexOf('[');
                                        if (opp > -1) {
                                            if (confidenceValuesInBrackets === true) {
                                                addConfidence(x, element);
                                            }
                                            x.name = x.name + element.substring(0, opp);
                                        } else {
                                            x.name = x.name + element;
                                        }
                                    } else {
                                        x.name = x.name + element;
                                    }
                                }
                            }
                        }

                    }
                }
            }
        }
        if (ancs.length !== 0) {
            throw (NH_FORMAT_ERR_OPEN_PARENS);
        }
        if (!x) {
            throw (NH_FORMAT_ERR_CLOSE_PARENS);
        }

        let phy = {};
        phy.children = [x];

        forester.addParents(phy);

        if (confidenceValuesAsInternalNames === true) {
            moveInternalNodeNamesToConfidenceValues(phy);
        }

        return phy;

        function addConfidence(x, element) {
            let confValue = parseConfidence(element);
            if (confValue != null) {
                x.confidences = [];
                let conf = {};
                conf.value = confValue;
                conf.type = 'unknown';
                x.confidences.push(conf);
            }
        }

        function parseConfidence(element) {
            let o = element.indexOf('[');
            if (o > -1) {
                let s = element.substring(o + 1, element.length - 1);
                if (NUMBERS_ONLY_PATTERN.test(s)) {
                    let confValue = parseFloat(s);
                    if (forester.isNumber(confValue)) {
                        return confValue;
                    } else {
                        throw (NH_FORMAT_ERR + 'could not parse confidence value from "' + element + '"');
                    }
                }
            }
            return null;
        }

        function moveInternalNodeNamesToConfidenceValues(node) {
            forester.preOrderTraversalAll(node, function (n) {
                if (n.children || n._children) {
                    if (n.name) {
                        let s = n.name;
                        if (NUMBERS_ONLY_PATTERN.test(s)) {
                            let confValue = parseFloat(s);
                            if ((confValue != null) && (forester.isNumber(confValue))) {
                                n.confidences = [];
                                let conf1 = {};
                                conf1.value = confValue;
                                conf1.type = 'unknown';
                                n.confidences.push(conf1);
                                n.name = undefined;
                            }
                        }
                    }
                }
            });
        }
    };

    // Parses a Nexus-formatted string and returns an ARRAY of tree objects,
    // each in the same shape parseNewHampshire produces (a Nexus file can
    // hold any number of trees). Ported from the desktop's
    // NexusPhylogeniesParser: reads TAXLABELS, the TREES block (TRANSLATE
    // tables, TREE/UTREE statements, [&R]/[&U] rootedness, tree names and
    // titles) and CHARACTERS/DATA blocks -- a protein/dna/rna MATRIX
    // (sequential or interleaved, MATCHCHAR resolved, quoted labels,
    // comments stripped) becomes per-tip aligned molecular sequences in the
    // phyloXML shape (sequences[i].mol_seq.{is_aligned,value}), so a tree
    // read from Nexus shows its alignment track exactly like one read from
    // phyloXML. The two confidence options are handed through to
    // parseNewHampshire for each tree statement.
    forester.parseNexus = function (nexStr, confidenceValuesInBrackets, confidenceValuesAsInternalNames) {
        const NEXUS_FORMAT_ERR = 'Nexus format error: ';
        const TITLE_RE = /^title.?\s+([^;]+)/i;
        const TREE_NAME_RE = /^\s*.?tree\s+(.+?)\s*=/i;
        const ROOTEDNESS_RE = /=\s*\[&([RU])\]/i;
        const TRANSLATE_PAIR_RE = /([0-9A-Za-z]+)\s+(.+)/;
        const RESIDUES_RE = /^[A-Za-z\-_*?.]+$/;
        const DATATYPE_RE = /datatype\s*=\s*([a-z]+)/;
        const MATCHCHAR_RE = /matchchar\s*=\s*['"]?(\S)/;

        let trees = [];
        let taxlabels = [];
        // null-prototype maps: a taxon named "__proto__" must stay data
        let translateMap = Object.create(null);
        let seqs = Object.create(null);
        let translateBuf = '';
        let nh = '';
        let name = '';
        let title = '';
        let inTreesBlock = false;
        let inTaxalabels = false;
        let inTranslate = false;
        let inTree = false;
        let inDataBlock = false;
        let inMatrix = false;
        let inDataComment = false;
        let datatype = null;
        let rootedInfoPresent = false;
        let isRooted = false;
        let matchchar = null;
        let matrixReferenceId = null;

        // Nexus treats '_' and ' ' as equivalent, labels may be quoted, and a
        // matrix often capitalizes taxon names differently from the tree -- so
        // a matrix row joins its tree tip through this canonical key.
        function joinKey(s) {
            return s.replace(/_/g, ' ').replace(/['"]+/g, '').trim().toLowerCase();
        }

        // Strip Nexus [ ... ] comments, tracking an OPEN comment across lines
        // so a multi-line comment inside the matrix cannot leak prose as a
        // spurious taxon row. Called only inside the data block -- the trees
        // block keeps [&R]/[&...], which are semantic there.
        function stripDataComments(s) {
            if (!inDataComment && s.indexOf('[') < 0) {
                return s;
            }
            let out = '';
            for (let i = 0; i < s.length; ++i) {
                let c = s.charAt(i);
                if (inDataComment) {
                    if (c === ']') {
                        inDataComment = false;
                    }
                } else if (c === '[') {
                    inDataComment = true;
                } else {
                    out += c;
                }
            }
            return out.trim();
        }

        function setTranslatePairs(buf) {
            let s = buf.trim();
            if (s.endsWith(';')) {
                s = s.slice(0, -1).trim();
            }
            s.split(',').forEach(function (pair) {
                let ti = pair.toLowerCase().indexOf('translate');
                if (ti > -1) {
                    pair = pair.substring(ti + 9);
                }
                let m = TRANSLATE_PAIR_RE.exec(pair);
                if (!m) {
                    throw new Error(NEXUS_FORMAT_ERR + 'ill-formatted translate values: ' + pair);
                }
                let value = m[2].replace(/['"]+/g, '').trim();
                if (value.endsWith(';')) {
                    value = value.slice(0, -1);
                }
                translateMap[m[1]] = value;
            });
        }

        // One MATRIX row ("taxon residues..."): the id is the first token (a
        // quoted label may contain spaces), the residues are the rest with all
        // internal whitespace removed. Only protein/dna/rna matrices become
        // sequences. In an interleaved matrix each id reappears in a later
        // block, so a repeated id is CONCATENATED onto its row. MATCHCHAR
        // (e.g. '.') means "same as the first taxon at this position" and is
        // resolved against that reference row at the same absolute positions.
        function addMatrixRow(row) {
            if (datatype !== 'protein' && datatype !== 'dna' && datatype !== 'rna') {
                return;
            }
            let id;
            let rest;
            let c0 = row.charAt(0);
            if (c0 === "'" || c0 === '"') {
                let close = row.indexOf(c0, 1);
                if (close < 1) {
                    return;
                }
                id = row.substring(0, close + 1);
                rest = row.substring(close + 1);
            } else {
                let sp = row.indexOf(' ');
                if (sp < 1) {
                    return;
                }
                id = row.substring(0, sp);
                rest = row.substring(sp + 1);
            }
            let block = rest.replace(/\s+/g, '');
            if (block.length === 0 || !RESIDUES_RE.test(block)) {
                return;
            }
            if (matchchar && (matrixReferenceId !== null) && (id !== matrixReferenceId)
                && seqs[matrixReferenceId]) {
                let ref = seqs[matrixReferenceId].value;
                let offset = seqs[id] ? seqs[id].value.length : 0;
                let resolved = '';
                for (let j = 0; j < block.length; ++j) {
                    let c = block.charAt(j);
                    resolved += (c === matchchar && (offset + j) < ref.length)
                        ? ref.charAt(offset + j) : c;
                }
                block = resolved;
            }
            seqs[id] = {
                value: seqs[id] ? (seqs[id].value + block) : block,
                type: datatype
            };
            if (matrixReferenceId === null) {
                matrixReferenceId = id;
            }
        }

        // A complete tree statement has accumulated in nh: parse it and carry
        // over the block's translate table / taxlabels / matrix sequences.
        function finishTree() {
            if (nh.length === 0) {
                return;
            }
            let phy = forester.parseNewHampshire(nh, confidenceValuesInBrackets, confidenceValuesAsInternalNames);
            let myname = '';
            if (title && name) {
                myname = title.replace(/_/g, ' ').trim() + ' (' + name.trim() + ')';
            } else if (title) {
                myname = title.replace(/_/g, ' ').trim();
            } else if (name) {
                myname = name.trim();
            }
            if (myname) {
                phy.name = myname;
            }
            if (rootedInfoPresent) {
                phy.rooted = isRooted;
            }
            let seqsByKey = Object.create(null);
            for (let id in seqs) {
                seqsByKey[joinKey(id)] = seqs[id];
            }
            forester.getAllExternalNodes(phy).forEach(function (node) {
                if (node.name && translateMap[node.name] !== undefined) {
                    node.name = translateMap[node.name];
                } else if (taxlabels.length > 0 && node.name && /^\d+$/.test(node.name)) {
                    let i = parseInt(node.name, 10);
                    if (i > 0 && i <= taxlabels.length) {
                        node.name = taxlabels[i - 1].replace(/['"]+/g, '');
                    }
                }
                if (node.name) {
                    let s = seqsByKey[joinKey(node.name)];
                    if (s) {
                        if (!node.sequences) {
                            node.sequences = [];
                        }
                        node.sequences.push({
                            type: s.type,
                            mol_seq: {is_aligned: true, value: s.value}
                        });
                    }
                }
            });
            trees.push(phy);
            nh = '';
            name = '';
            rootedInfoPresent = false;
            isRooted = false;
        }

        let lines = String(nexStr).split(/\r\n|\r|\n/);
        for (let k = 0; k < lines.length; ++k) {
            let line = lines[k].trim();
            if (line.length === 0 || line.charAt(0) === '#' || line.charAt(0) === '>') {
                continue;
            }
            line = line.replace(/\s+/g, ' ').replace(/\s+;/g, ';');
            let lc = line.toLowerCase();
            if (/^begin\s+trees\b/.test(lc)) {
                inTreesBlock = true;
                inTaxalabels = false;
                inTranslate = false;
                inDataBlock = false;
                datatype = null;
                title = '';
            } else if (lc.startsWith('taxlabels')) {
                inTreesBlock = false;
                inTaxalabels = true;
                inTranslate = false;
                inDataBlock = false;
                datatype = null;
            } else if (lc.startsWith('translate')) {
                translateBuf = '';
                inTaxalabels = false;
                inTranslate = true;
                inDataBlock = false;
                datatype = null;
            } else if (/^begin\s+(characters|data)\b/.test(lc)) {
                inTaxalabels = false;
                inTreesBlock = false;
                inTranslate = false;
                inDataBlock = true;
                inMatrix = false;
                inDataComment = false;
                datatype = null;
                matchchar = null;
                matrixReferenceId = null;
                // scope the rows to THIS matrix block, so a later block
                // cannot cross-contaminate an earlier one
                seqs = Object.create(null);
            } else if (inTreesBlock) {
                if (lc.startsWith('title')) {
                    let tm = TITLE_RE.exec(line);
                    if (tm) {
                        title = tm[1];
                    }
                } else if (lc.startsWith('link')) {
                    // a LINK sub-command (e.g. "LINK TAXA=...") -- ignored
                } else if (lc.startsWith('end;') || lc.startsWith('endblock')) {
                    inTreesBlock = false;
                    inTree = false;
                    finishTree();
                } else if (lc.startsWith('tree ') || lc.startsWith('utree ')) {
                    finishTree(); // a previous statement still pending
                    inTree = true;
                    let nm = TREE_NAME_RE.exec(line);
                    if (nm) {
                        name = nm[1].replace(/['"]+/g, '');
                    }
                    let rm = ROOTEDNESS_RE.exec(line);
                    if (rm) {
                        rootedInfoPresent = true;
                        isRooted = rm[1].toUpperCase() === 'R';
                    }
                    // parseNewHampshire strips the remaining [&...] hot
                    // comments (BEAST-style annotations, [&R]/[&U]) itself
                    nh = line.substring(line.indexOf('=') + 1).trim();
                    if (lc.endsWith(';')) {
                        inTree = false;
                        finishTree();
                    }
                } else if (inTree) {
                    nh += line;
                    if (lc.endsWith(';')) {
                        inTree = false;
                        finishTree();
                    }
                }
            }
            if (inTaxalabels) {
                if (lc.startsWith('end;') || lc.startsWith('endblock')) {
                    inTaxalabels = false;
                } else {
                    line.split(' ').forEach(function (label) {
                        if (label.endsWith(';')) {
                            inTaxalabels = false;
                            label = label.slice(0, -1);
                        }
                        if (label.length > 0 && label.toLowerCase() !== 'taxlabels') {
                            taxlabels.push(label);
                        }
                    });
                }
            }
            if (inTranslate) {
                if (lc.startsWith('end;') || lc.startsWith('endblock')) {
                    inTranslate = false;
                } else {
                    translateBuf += ' ' + line;
                    if (line.endsWith(';')) {
                        inTranslate = false;
                        setTranslatePairs(translateBuf);
                    }
                }
            }
            if (inDataBlock) {
                line = stripDataComments(line);
                let dlc = line.toLowerCase();
                if (line.length === 0) {
                    // comment-only (or now-empty) line
                } else if (dlc.startsWith('end;') || dlc.startsWith('endblock')) {
                    inDataBlock = false;
                    inMatrix = false;
                    datatype = null;
                } else if (dlc.startsWith('link ')) {
                    // ignored; the trailing space keeps a taxon row whose
                    // name starts with "link" out of this branch
                } else if (!inMatrix) {
                    // block header: DIMENSIONS / FORMAT / CHARLABELS / ... --
                    // read DATATYPE and MATCHCHAR off FORMAT, enter the matrix
                    // on the MATRIX keyword, ignore the rest (a sub-command
                    // ending in ';' must NOT be mistaken for the block's end)
                    let dm = DATATYPE_RE.exec(dlc);
                    if (dm) {
                        datatype = dm[1];
                    }
                    let mm = MATCHCHAR_RE.exec(dlc);
                    if (mm) {
                        matchchar = mm[1];
                    }
                    if (dlc === 'matrix' || dlc.startsWith('matrix ')) {
                        inMatrix = true;
                        let after = line.substring(6).trim();
                        let matrixEnds = false;
                        if (after.endsWith(';')) {
                            matrixEnds = true;
                            after = after.slice(0, -1).trim();
                        }
                        if (after.length > 0) {
                            addMatrixRow(after);
                        }
                        if (matrixEnds) {
                            inMatrix = false;
                            inDataBlock = false;
                            datatype = null;
                        }
                    }
                } else {
                    // inside the MATRIX: one taxon row per line until ';'
                    let matrixEnds = false;
                    if (line.endsWith(';')) {
                        matrixEnds = true;
                        line = line.slice(0, -1).trim();
                    }
                    if (line.length > 0) {
                        addMatrixRow(line);
                    }
                    if (matrixEnds) {
                        inMatrix = false;
                        inDataBlock = false;
                        datatype = null;
                    }
                }
            }
        }
        finishTree(); // EOF with a tree still pending (no closing "End;")
        return trees;
    };

    // ---------------------------------------------------------------
    // Auspice / Nextstrain
    // ---------------------------------------------------------------

    // Namespace for the node properties the Auspice parser writes, so
    // Nextstrain traits are colour-able/searchable and clearly distinguished
    // from BEAST's "beast:" namespace. Same prefix as the desktop.
    const NEXTSTRAIN_PREFIX = 'nextstrain:';

    // A compact string for a JSON number: a whole value drops the ".0" (a
    // clean categorical/integer property), otherwise the plain decimal
    // WITHOUT scientific notation (a small divergence like 1e-4 must read
    // as "0.0001" in the node-data dialog / as a searchable value).
    function plainNumberString(d) {
        if (Number.isInteger(d) && Math.abs(d) < 1e15) {
            return String(d);
        }
        let s = String(d);
        if (s.indexOf('e') < 0 && s.indexOf('E') < 0) {
            return s;
        }
        return d.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
    }

    function addNodeProperty(node, ref, value) {
        if (value === undefined || value === null || String(value).length === 0) {
            return;
        }
        if (!node.properties) {
            node.properties = [];
        }
        let v = String(value);
        node.properties.push({
            ref: ref,
            value: v,
            datatype: isFinite(parseFloat(v)) && isFinite(Number(v)) ? 'xsd:decimal' : 'xsd:string',
            applies_to: 'node'
        });
    }

    // Parses an Auspice / Nextstrain v2 dataset.json (string or already-parsed
    // object) into ONE tree object, mapping its per-node data onto the native
    // phyloXML shape so the existing overlays light it up -- ported from the
    // desktop's AuspiceJsonParser:
    //  - node_attrs.num_date.value -> node.date value (decimal year) -> the
    //    calendar time axis; its .confidence [lo,hi] -> date minimum/maximum
    //    -> the node-age (HPD) bars;
    //  - node_attrs.div -> a nextstrain:div property (the divergence measure,
    //    kept for a future time<->divergence view);
    //  - every discrete trait (country, clade_membership, host, ...) -> a
    //    nextstrain:<key> node property (Color-by / search / node dialog);
    //    its .confidence {state:prob} -> nextstrain:<key>_set + _set_prob
    //    brace-list pair (the desktop's ancestral-state-pie encoding);
    //  - branch_attrs.labels.clade -> a nextstrain:clade_label property.
    // Branch lengths default to TIME (successive num_date differences); a
    // divergence-only build falls back to div differences. Deliberately NOT
    // ingested: the map, entropy and frequencies panels.
    forester.parseAuspiceJson = function (data) {
        let doc = forester.isString(data) ? JSON.parse(data) : data;
        if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
            throw new Error('not an Auspice dataset (the JSON root is not an object)');
        }
        if (doc.version !== 'v2' || !doc.tree || typeof doc.tree !== 'object'
            || Array.isArray(doc.tree)) {
            throw new Error('not an Auspice v2 dataset (expected "version":"v2" and a "tree" object)');
        }

        function isScalar(v) {
            return (typeof v === 'string') || (typeof v === 'number') || (typeof v === 'boolean');
        }

        function scalarToString(v) {
            return (typeof v === 'number') ? plainNumberString(v) : String(v);
        }

        // a discrete trait's posterior distribution as the _set/_set_prob
        // brace-list pair; state names quoted so a comma/space in one (e.g.
        // "Korea, Republic of") cannot corrupt the list
        function applyTraitConfidence(node, trait, conf) {
            let states = [];
            let probs = [];
            Object.keys(conf).forEach(function (state) {
                let p = conf[state];
                if (typeof p !== 'number' || !isFinite(p) || state.length === 0) {
                    return;
                }
                states.push('"' + state.replace(/"/g, '') + '"');
                probs.push(plainNumberString(p));
            });
            if (states.length > 0) {
                addNodeProperty(node, NEXTSTRAIN_PREFIX + trait + '_set', '{' + states.join(',') + '}');
                addNodeProperty(node, NEXTSTRAIN_PREFIX + trait + '_set_prob', '{' + probs.join(',') + '}');
            }
        }

        function applyNodeAttrs(node, attrs) {
            Object.keys(attrs).forEach(function (key) {
                let val = attrs[key];
                if (key === 'num_date') {
                    if (val && typeof val === 'object' && typeof val.value === 'number') {
                        let date = {value: val.value, unit: 'year'};
                        if (Array.isArray(val.confidence) && val.confidence.length === 2
                            && typeof val.confidence[0] === 'number'
                            && typeof val.confidence[1] === 'number') {
                            date.minimum = val.confidence[0];
                            date.maximum = val.confidence[1];
                        }
                        node.date = date;
                        // the point date doubles as a numeric property, so the
                        // sampling date can drive Color-by (the classic
                        // Nextstrain colour-by-date view) and search
                        addNodeProperty(node, NEXTSTRAIN_PREFIX + 'num_date', plainNumberString(val.value));
                    }
                } else if (key === 'div') {
                    if (typeof val === 'number' && isFinite(val)) {
                        addNodeProperty(node, NEXTSTRAIN_PREFIX + 'div', plainNumberString(val));
                    }
                } else if (val && typeof val === 'object' && !Array.isArray(val)) {
                    // a discrete trait: {value, confidence{state:prob}, entropy}
                    if (isScalar(val.value)) {
                        addNodeProperty(node, NEXTSTRAIN_PREFIX + key, scalarToString(val.value));
                    }
                    if (val.confidence && typeof val.confidence === 'object'
                        && !Array.isArray(val.confidence)) {
                        applyTraitConfidence(node, key, val.confidence);
                    }
                } else if (isScalar(val)) {
                    addNodeProperty(node, NEXTSTRAIN_PREFIX + key, scalarToString(val)); // bare attr (accession, url, ...)
                }
            });
        }

        function buildNode(jn) {
            let node = {};
            if (typeof jn.name === 'string' && jn.name.length > 0) {
                node.name = jn.name;
            }
            if (jn.node_attrs && typeof jn.node_attrs === 'object') {
                applyNodeAttrs(node, jn.node_attrs);
            }
            let labels = jn.branch_attrs && jn.branch_attrs.labels;
            if (labels && typeof labels.clade === 'string' && labels.clade.length > 0) {
                addNodeProperty(node, NEXTSTRAIN_PREFIX + 'clade_label', labels.clade);
            }
            if (Array.isArray(jn.children) && jn.children.length > 0) {
                node.children = [];
                jn.children.forEach(function (c) {
                    if (c && typeof c === 'object') {
                        node.children.push(buildNode(c));
                    }
                });
                if (node.children.length === 0) {
                    delete node.children;
                }
            }
            return node;
        }

        let root = buildNode(doc.tree);
        let phy = {rooted: true, children: [root]};
        let title = doc.meta && doc.meta.title;
        if (typeof title === 'string' && title.trim().length > 0) {
            phy.name = title.trim();
        }
        if (auspiceHasAnyDate(root)) {
            setDeltaBranchLengths(root, null, auspiceNodeDate); // default view = time
        } else {
            // a divergence-only build carries no num_date anywhere; div deltas
            // keep the layout meaningful instead of a cladogram
            setDeltaBranchLengths(root, null, auspiceNodeDiv);
        }
        // A TIP is a dated sample: keep its point date (the calendar axis)
        // but drop the date INTERVAL -- the divergence-time uncertainty (the
        // node-age bars) belongs to the INTERNAL nodes, and a tip interval
        // would read as a fossil-style observed range on a viral tree.
        forester.preOrderTraversalAll(root, function (n) {
            if (!n.children && n.date
                && (n.date.minimum !== undefined || n.date.maximum !== undefined)) {
                n.date = {value: n.date.value, unit: n.date.unit};
            }
        });
        forester.addParents(phy);
        return phy;
    };

    function auspiceNodeDate(node) {
        return (node.date && typeof node.date.value === 'number' && isFinite(node.date.value))
            ? node.date.value : null;
    }

    function auspiceNodeDiv(node) {
        if (node.properties) {
            for (let i = 0; i < node.properties.length; ++i) {
                if (node.properties[i].ref === NEXTSTRAIN_PREFIX + 'div') {
                    let d = parseFloat(node.properties[i].value);
                    return isFinite(d) ? d : null;
                }
            }
        }
        return null;
    }

    function auspiceHasAnyDate(node) {
        let found = false;
        forester.preOrderTraversalAll(node, function (n) {
            if (auspiceNodeDate(n) !== null) {
                found = true;
            }
        });
        return found;
    }

    function auspiceHasAnyDiv(node) {
        let found = false;
        forester.preOrderTraversalAll(node, function (n) {
            if (auspiceNodeDiv(n) !== null) {
                found = true;
            }
        });
        return found;
    }

    // Branch lengths = successive differences of a cumulative per-node metric
    // (num_date -> the time view; nextstrain:div -> the divergence view).
    // The root's length is 0, and a node missing the metric (or whose parent
    // misses it) gets 0 -- so a time<->divergence toggle can never leave a
    // stale cross-scale length behind. A (spurious) negative delta clamps to 0.
    function setDeltaBranchLengths(node, parentValue, metricOf) {
        let v = metricOf(node);
        node.branch_length = (parentValue !== null && v !== null)
            ? Math.max(0, v - parentValue) : 0;
        let children = node.children || node._children;
        if (children) {
            for (let i = 0; i < children.length; ++i) {
                setDeltaBranchLengths(children[i], v, metricOf);
            }
        }
    }

    // The time<->divergence plumbing: both metrics are RETAINED on a parsed
    // Auspice tree (the date values + the nextstrain:div properties), so a
    // future display toggle can rewrite the branch lengths from EITHER at any
    // time -- lossless and reversible, and reusing the exact recompute the
    // parser itself used, so the toggle can never drift from the loaded view.

    forester.applyTimeBranchLengths = function (phy) {
        setDeltaBranchLengths(forester.getTreeRoot(phy), null, auspiceNodeDate);
    };

    forester.applyDivergenceBranchLengths = function (phy) {
        setDeltaBranchLengths(forester.getTreeRoot(phy), null, auspiceNodeDiv);
    };

    // True when the tree carries BOTH a time signal (a dated node) AND a
    // divergence signal (a nextstrain:div property), so the toggle is
    // meaningful at all.
    forester.hasTimeAndDivergence = function (phy) {
        let root = forester.getTreeRoot(phy);
        return auspiceHasAnyDate(root) && auspiceHasAnyDiv(root);
    };

    forester.isNumber = function (v) {
        if (v === undefined || v === null) {
            return false;
        }
        if (v != v) {
            // This can only be true if the v is NaN
            return false;
        }
        return true;
    };

    forester.getOneDistinctTaxonomy = function (node) {
        let id = null;
        let code = null;
        let sn = null;
        let cn = null;
        let result = true;
        let sawTax = false;
        forester.preOrderTraversalAll(node, function (n) {
            if (n.taxonomies && n.taxonomies.length === 1) {
                let tax = n.taxonomies[0];
                if (tax.code && tax.code.length > 0) {
                    sawTax = true;
                    if (code === null) {
                        code = tax.code;
                    } else if (code !== tax.code) {
                        result = false;
                        return;
                    }
                }
                if (tax.scientific_name && tax.scientific_name.length > 0) {
                    sawTax = true;
                    if (sn === null) {
                        sn = tax.scientific_name;
                    } else if (sn !== tax.scientific_name) {
                        result = false;
                        return;
                    }
                }
                if (tax.common_name && tax.common_name.length > 0) {
                    sawTax = true;
                    if (cn === null) {
                        cn = tax.common_name;
                    } else if (cn !== tax.common_name) {
                        result = false;
                        return;
                    }
                }
                if (tax.id && tax.id.value && tax.id.value.length > 0) {
                    sawTax = true;
                    let myid;
                    if (tax.id.provider && tax.id.provider.length > 0) {
                        myid = tax.id.provider + ':' + tax.id.value;
                    } else {
                        myid = tax.id.value;
                    }
                    if (id === null) {
                        id = myid;
                    } else if (id !== myid) {
                        result = false;

                    }
                }
            } else if (!n.children && !n._children) {
                // If an external node lacks taxonomy, return false.
                result = false;
            }
        });
        if (!sawTax) {
            return null;
        }
        if (result === true) {

            if (sn) {
                return sn;
            } else if (code) {
                return code;
            } else if (cn) {
                return cn;
            } else if (id) {
                return id;
            }
        }
        return null;
    };


    /**
     * To convert a phylogentic tree object to a New Hampshire (Newick) formatted string.
     *
     * @param phy - A phylogentic tree object.
     * @param decPointsMax - Maximal number of decimal points for branch lengths (optional)
     * @param replaceChars - To replace illegal characters (),:;"' instead of surrounding with quotation marks
     * @param writeConfidences - to write confidence values in brackets
     * @returns {*} - a New Hampshire (Newick) formatted string.
     */
    forester.toNewHampshire = function (phy, decPointsMax, replaceChars, writeConfidences) {
        let nh = "";
        if (phy.children && phy.children.length === 1) {
            toNewHampshireHelper(phy.children[0], true);
        }
        if (nh.length > 0) {
            return nh + ";";
        }
        return nh;

        function toNewHampshireHelper(node, last) {
            if (node.children) {
                let l = node.children.length;
                nh += "(";
                for (let i = 0; i < l; ++i) {
                    toNewHampshireHelper(node.children[i], i === l - 1);
                }
                nh += ")";
            } else if (node._children) {
                let ll = node._children.length;
                nh += "(";
                for (let ii = 0; ii < ll; ++ii) {
                    toNewHampshireHelper(node._children[ii], ii === ll - 1);
                }
                nh += ")";
            }
            if (node.name && node.name.length > 0) {
                if (replaceChars === true) {
                    nh += replaceUnsafeChars(node.name);
                } else {
                    let myName = node.name.replace(/\s+/g, ' ');
                    if (/[\s,():;'"[\]]/.test(myName)) {
                        if ((myName.indexOf('"') > -1) && (myName.indexOf("'") > -1)) {
                            nh += '"' + myName.replace(/"/g, "'") + '"';
                        } else if (myName.indexOf('"') > -1) {
                            nh += "'" + myName + "'";
                        } else {
                            nh += '"' + myName + '"';
                        }
                    } else {
                        nh += myName;
                    }
                }
            }
            if (node.branch_length !== undefined && node.branch_length !== null) {
                if (decPointsMax && decPointsMax > 0) {
                    nh += ":" + forester.roundNumber(node.branch_length, decPointsMax);
                } else {
                    nh += ":" + node.branch_length;
                }
            }
            if (writeConfidences && node.confidences && node.confidences.length === 1 && node.confidences[0].value !== undefined && node.confidences[0].value !== null) {
                if (decPointsMax && decPointsMax > 0) {
                    nh += "[" + forester.roundNumber(node.confidences[0].value, decPointsMax) + "]";
                } else {
                    nh += "[" + node.confidences[0].value + "]";
                }
            }
            if (!last) {
                nh += ",";
            }
        }

        function replaceUnsafeChars(str) {
            return str.replace(/[\s,():;'"[\]]+/g, '_');
        }
    };

    // Writes a phylogeny as a Nexus-formatted string, ported from the
    // desktop's PhylogenyWriter: a TAXA block (Dimensions, TaxLabels) and a
    // TREES block (the tree under its name, [&R]/[&U] rootedness, the same
    // safe-character Newick toNewHampshire writes). Beyond the desktop
    // template, tips carrying ALIGNED molecular sequences also get a
    // CHARACTERS block (Dimensions, Format with the datatype, Matrix) --
    // carrying the tree and its alignment in one file is the point of Nexus,
    // and parseNexus reads the alignment back onto the tips.
    forester.toNexus = function (phy, decPointsMax, writeConfidences) {
        // the same replacement toNewHampshire applies, so the TaxLabels and
        // Matrix labels match the tree's tip tokens exactly
        function safeLabel(s) {
            return s.replace(/[\s,():;'"[\]]+/g, '_');
        }

        // label preference as on the desktop: name, then taxonomy
        // (code/scientific/common), then sequence (name/symbol/gene)
        function nexusLabel(node, i) {
            let s = '';
            if (node.name) {
                s = node.name;
            } else if (node.taxonomies && node.taxonomies.length > 0) {
                let t = node.taxonomies[0];
                s = t.code || t.scientific_name || t.common_name || '';
            } else if (node.sequences && node.sequences.length > 0) {
                let q = node.sequences[0];
                s = q.name || q.symbol || q.gene_name || '';
            }
            if (!s) {
                s = 'node' + (i + 1); // an empty TaxLabels token would not parse back
            }
            return safeLabel(s);
        }

        let ext = forester.getAllExternalNodes(phy).reverse();
        let s = '#NEXUS\n';
        s += 'Begin Taxa;\n';
        s += ' Dimensions NTax=' + ext.length + ';\n';
        s += ' TaxLabels';
        ext.forEach(function (node, i) {
            s += ' ' + nexusLabel(node, i);
        });
        s += ';\n';
        s += 'End;\n';

        let rows = [];
        let nchar = 0;
        let datatype = null;
        ext.forEach(function (node, i) {
            if (!node.sequences) {
                return;
            }
            for (let j = 0; j < node.sequences.length; ++j) {
                let q = node.sequences[j];
                if (q.mol_seq && q.mol_seq.is_aligned && q.mol_seq.value) {
                    rows.push({label: nexusLabel(node, i), value: q.mol_seq.value});
                    nchar = Math.max(nchar, q.mol_seq.value.length);
                    if (!datatype && (q.type === 'protein' || q.type === 'dna' || q.type === 'rna')) {
                        datatype = q.type;
                    }
                    return;
                }
            }
        });
        if (rows.length > 0) {
            if (!datatype) {
                // no declared type (e.g. the tree came from Newick plus a
                // fasta): judge on the residues themselves
                datatype = forester.msaIsNucleotide(rows[0].value) ? 'dna' : 'protein';
            }
            let width = 0;
            rows.forEach(function (r) {
                width = Math.max(width, r.label.length);
            });
            s += 'Begin Characters;\n';
            // NChar ONLY: the Nexus standard allows NTax in a CHARACTERS
            // block's DIMENSIONS solely alongside NEWTAXA (the taxa are the
            // TAXA block's), and strict readers -- jebl, and so AliView --
            // reject the file over it
            s += ' Dimensions NChar=' + nchar + ';\n';
            s += ' Format DataType=' + datatype + ' Missing=? Gap=-;\n';
            s += ' Matrix\n';
            rows.forEach(function (r) {
                s += '  ' + r.label + ' '.repeat(width - r.label.length + 1) + r.value + '\n';
            });
            s += ' ;\n';
            s += 'End;\n';
        }

        s += 'Begin Trees;\n';
        let treeName = phy.name ? String(phy.name).replace(/['"]+/g, '').trim() : '';
        s += ' Tree ' + (treeName ? ("'" + treeName + "'") : 'tree1') + '=';
        s += (phy.rooted === false) ? '[&U]' : '[&R]';
        s += forester.toNewHampshire(phy, decPointsMax, true, writeConfidences) + '\n';
        s += 'End;\n';
        return s;
    };

    forester.getMolecularSequencesAsFasta = function (node, sep) {
        let fasta_all = '';
        let ext_nodes = forester.getAllExternalNodes(node).reverse();
        for (let j = 0, l = ext_nodes.length; j < l; ++j) {
            let n = ext_nodes[j];
            if (n.sequences) {
                for (let i = 0; i < n.sequences.length; ++i) {
                    let s = n.sequences[i];
                    if (s.mol_seq && s.mol_seq.value && s.mol_seq.value.length > 0) {
                        let seq = s.mol_seq.value;
                        let seqname = j;
                        if (s.name && s.name.length > 0) {
                            seqname = s.name
                        } else if (n.name && n.name.length > 0) {
                            seqname = n.name
                        }
                        let split_seq_ary = seq.match(/.{1,80}/g);
                        let split_seq = '';
                        for (let ii = 0; ii < split_seq_ary.length; ++ii) {
                            split_seq += split_seq_ary[ii] + sep;
                        }

                        let fasta = '>' + seqname + sep + split_seq;
                        fasta_all += fasta;
                    }
                }
            }
        }
        return fasta_all;
    }

    forester.roundNumber = function (num, dec) {
        return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    };

    forester.isString = function (s) {
        return (typeof s === 'string' || s instanceof String);
    };


    // --------------------------------------------------------------
    // Search engine
    // --------------------------------------------------------------
    // Field-and-mode search over a phylogeny (mirrors the desktop Archaeopteryx
    // redesign). A search is described by a spec:
    //   { field, mode, value, value2, caseSensitive, inverse }
    // where field comes from forester.availableSearchFields(root), mode is one of
    // the string modes ('contains', 'starts_with', 'ends_with', 'whole_word',
    // 'regex') or numeric modes ('eq', 'ne', 'lt', 'le', 'gt', 'ge', 'range'),
    // and ',' = OR / '+' = AND inside a text value. Used by archaeopteryx.js;
    // pure tree logic, no DOM -- tested by test/search_test.js.

    const SEARCH_FIELD_LABELS = {
        NN: 'Node Name',
        TS: 'Taxonomy Scientific', TN: 'Taxonomy Common', TC: 'Taxonomy Code',
        TI: 'Taxonomy Identifier', SY: 'Taxonomy Synonym', LN: 'Taxonomy Lineage',
        SN: 'Seq Name', GN: 'Gene Name', SS: 'Gene Symbol', SA: 'Seq Accession',
        MS: 'Molecular Sequence', DO: 'Domain', AN: 'Annotation', XR: 'Cross-Reference'
    };
    const SEARCH_TEXT_ORDER = ['TS', 'TN', 'TC', 'TI', 'SY', 'LN', 'SN', 'GN', 'SS', 'SA', 'DO', 'AN', 'XR', 'MS'];
    // Fields folded into the "Any Text" umbrella (desktop omits MS + DO there).
    const SEARCH_ANY_TEXT_KEYS = ['NN', 'TS', 'TN', 'TC', 'TI', 'SY', 'LN', 'SN', 'GN', 'SS', 'SA', 'AN', 'XR'];
    const SEARCH_NUMERIC_DATATYPES = new Set(['decimal', 'double', 'float', 'integer', 'int', 'long', 'short',
        'byte', 'unsignedint', 'unsignedlong', 'unsignedshort', 'unsignedbyte', 'nonnegativeinteger',
        'nonpositiveinteger', 'negativeinteger', 'positiveinteger']);

    function searchTaxa(n) { return (n.taxonomies && n.taxonomies.length) ? n.taxonomies : []; }
    function searchSeqs(n) { return (n.sequences && n.sequences.length) ? n.sequences : []; }

    const SEARCH_TEXT_EXTRACTORS = {
        NN: n => (n.name ? [n.name] : []),
        TS: n => searchTaxa(n).map(t => t.scientific_name).filter(Boolean),
        TN: n => searchTaxa(n).map(t => t.common_name).filter(Boolean),
        TC: n => searchTaxa(n).map(t => t.code).filter(Boolean),
        TI: n => searchTaxa(n).map(t => t.id && t.id.value).filter(Boolean),
        SY: n => searchTaxa(n).reduce((a, t) => a.concat(t.synonyms || []), []).filter(Boolean),
        LN: n => searchTaxa(n).reduce((a, t) => a.concat(t.lineage || []), []).filter(Boolean),
        SN: n => searchSeqs(n).map(s => s.name).filter(Boolean),
        GN: n => searchSeqs(n).map(s => s.gene_name).filter(Boolean),
        SS: n => searchSeqs(n).map(s => s.symbol).filter(Boolean),
        SA: n => searchSeqs(n).map(s => s.accession && s.accession.value).filter(Boolean),
        MS: n => searchSeqs(n).map(s => s.mol_seq).filter(Boolean),
        DO: n => searchSeqs(n).reduce((a, s) => a.concat((s.domain_architecture && s.domain_architecture.domains) ? s.domain_architecture.domains.map(d => d.name) : []), []).filter(Boolean),
        AN: n => searchSeqs(n).reduce((a, s) => a.concat((s.annotations || []).reduce((b, an) => b.concat([an.desc, an.ref]), [])), []).filter(Boolean),
        XR: n => searchSeqs(n).reduce((a, s) => a.concat((s.cross_references || []).reduce((b, x) => b.concat([x.value, x.source, x.comment]), [])), []).filter(Boolean)
    };

    function isInternalPropRef(ref) { return !ref || ref.indexOf('aptx:') === 0; }

    function datatypeIsNumeric(dt) {
        if (!dt) return false;
        let local = String(dt).toLowerCase();
        let c = local.lastIndexOf(':');
        if (c >= 0) local = local.substring(c + 1);
        return SEARCH_NUMERIC_DATATYPES.has(local);
    }

    function escapeSearchRegExp(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Accept comma as decimal separator when unambiguous (one comma, no period,
    // and not the US thousands pattern comma+exactly-3-digits). Returns null if
    // not a finite number.
    forester.parseFiniteDouble = function (s) {
        if (s === null || s === undefined) return null;
        s = String(s).trim();
        if (s.length === 0) return null;
        if (s.indexOf('.') < 0 && (s.split(',').length - 1) === 1 && !/,\d{3}$/.test(s)) {
            s = s.replace(',', '.');
        }
        let n = Number(s);
        return isFinite(n) ? n : null;
    };

    // Build a predicate value -> bool for one text term. Returns null for an
    // invalid regex (caller treats that as "never matches").
    forester.makeSearchStringTest = function (term, mode, caseSensitive) {
        if (mode === 'regex' || mode === 'whole_word') {
            let src = (mode === 'whole_word')
                ? ('(?<![\\p{L}\\p{N}])' + escapeSearchRegExp(term) + '(?![\\p{L}\\p{N}])')
                : term;
            let re;
            try { re = new RegExp(src, caseSensitive ? 'u' : 'iu'); }
            catch { return null; }
            return s => (s !== null && s !== undefined && re.test(String(s)));
        }
        let t = caseSensitive ? term : term.toLowerCase();
        return function (s) {
            if (s === null || s === undefined) return false;
            let str = caseSensitive ? String(s) : String(s).toLowerCase();
            if (mode === 'starts_with') return str.indexOf(t) === 0;
            if (mode === 'ends_with') return str.length >= t.length && str.lastIndexOf(t) === str.length - t.length;
            return str.indexOf(t) >= 0; // contains
        };
    };

    function numMatches(x, mode, a, lo, hi) {
        switch (mode) {
            case 'eq': return Math.abs(x - a) <= 1e-9 * Math.max(1, Math.abs(a));
            case 'ne': return Math.abs(x - a) > 1e-9 * Math.max(1, Math.abs(a));
            case 'lt': return x < a;
            case 'le': return x <= a;
            case 'gt': return x > a;
            case 'ge': return x >= a;
            case 'range': return x >= lo && x <= hi;
            default: return false;
        }
    }

    // The list of fields the given tree actually offers (drives the Field
    // dropdowns). Always exposes Any Text + Node Name; adds the text, numeric
    // and custom-property fields that are present, then structure fields.
    forester.availableSearchFields = function (root) {
        let fields = [];
        fields.push({ key: 'ANY', label: 'Any Text', numeric: false });
        fields.push({ key: 'NN', label: SEARCH_FIELD_LABELS.NN, numeric: false });
        if (!root) return fields;

        let present = {};
        let hasBL = false, hasConf = false;
        let propRefs = {}; // ref -> { num, tot, dtNum, dtStr }
        forester.preOrderTraversalAll(root, function (n) {
            for (let k = 0; k < SEARCH_TEXT_ORDER.length; ++k) {
                let key = SEARCH_TEXT_ORDER[k];
                if (!present[key] && SEARCH_TEXT_EXTRACTORS[key](n).length > 0) present[key] = true;
            }
            if (!hasBL && typeof n.branch_length === 'number' && n.branch_length >= 0) hasBL = true;
            if (!hasConf && n.confidences) {
                for (let i = 0; i < n.confidences.length; ++i) {
                    if (typeof n.confidences[i].value === 'number') { hasConf = true; break; }
                }
            }
            if (n.properties) {
                for (let i = 0; i < n.properties.length; ++i) {
                    let p = n.properties[i];
                    if (isInternalPropRef(p.ref)) continue;
                    let r = propRefs[p.ref] || (propRefs[p.ref] = { num: 0, tot: 0, dtNum: false, dtStr: false });
                    r.tot++;
                    if (forester.parseFiniteDouble(p.value) !== null) r.num++;
                    if (p.datatype) { if (datatypeIsNumeric(p.datatype)) r.dtNum = true; else r.dtStr = true; }
                }
            }
        });

        for (let k = 0; k < SEARCH_TEXT_ORDER.length; ++k) {
            let key = SEARCH_TEXT_ORDER[k];
            if (present[key]) fields.push({ key: key, label: SEARCH_FIELD_LABELS[key], numeric: false });
        }
        if (hasBL) fields.push({ key: 'BL', label: 'Branch Length', numeric: true });
        if (hasConf) fields.push({ key: 'CO', label: 'Confidence', numeric: true });
        let refs = Object.keys(propRefs).sort();
        for (let i = 0; i < refs.length; ++i) {
            let r = propRefs[refs[i]];
            let numeric = r.dtStr ? false : (r.dtNum ? true : (r.tot > 0 && r.num === r.tot));
            fields.push({ key: 'PROP:' + refs[i], label: refs[i], numeric: numeric, propRef: refs[i] });
        }
        fields.push({ key: 'CS', label: 'Clade Size (tips)', numeric: true });
        fields.push({ key: 'NC', label: 'Number of Children', numeric: true });
        fields.push({ key: 'DE', label: 'Depth from Root', numeric: true });
        if (hasBL) fields.push({ key: 'DR', label: 'Distance from Root', numeric: true });
        fields.push({ key: 'NT', label: 'Node Type', numeric: false });
        return fields;
    };

    // Per-node depth / distance-to-root / clade size, computed on demand for the
    // structure search fields (cheap O(n), avoids staleness after tree edits).
    function computeSearchMetrics(root) {
        (function pre(n, depth, dist) {
            n._srchDepth = depth;
            let d = dist + (typeof n.branch_length === 'number' && n.branch_length > 0 ? n.branch_length : 0);
            n._srchDist = d;
            let kids = n.children || n._children;
            if (kids) for (let i = 0; i < kids.length; ++i) pre(kids[i], depth + 1, d);
        })(root, 0, 0);
        forester.postOrderTraversalAll(root, function (n) {
            let kids = n.children || n._children;
            if (!kids || kids.length === 0) { n._srchClade = 1; return; }
            let s = 0;
            for (let i = 0; i < kids.length; ++i) s += kids[i]._srchClade;
            n._srchClade = s;
        });
    }

    // Extract the value(s) of a field from a node (strings for text fields,
    // numbers for the numeric ones). A field is multi-valued; any value matching
    // is a match. root is needed only for the Node Type field.
    forester.extractSearchValues = function (node, field, root) {
        let key = field.key;
        if (key === 'ANY') {
            let out = [];
            for (let i = 0; i < SEARCH_ANY_TEXT_KEYS.length; ++i) {
                out = out.concat(SEARCH_TEXT_EXTRACTORS[SEARCH_ANY_TEXT_KEYS[i]](node));
            }
            if (node.properties) {
                for (let i = 0; i < node.properties.length; ++i) {
                    let p = node.properties[i];
                    if (!isInternalPropRef(p.ref) && p.value !== null && p.value !== undefined && p.value !== '') out.push(p.value);
                }
            }
            return out;
        }
        if (key === 'NT') {
            let kids = node.children || node._children;
            let isLeaf = !kids || kids.length === 0;
            return [isLeaf ? 'leaf' : (node === root ? 'root' : 'internal')];
        }
        if (key.indexOf('PROP:') === 0) {
            let out = [];
            if (node.properties) {
                for (let i = 0; i < node.properties.length; ++i) {
                    let p = node.properties[i];
                    if (p.ref === field.propRef && p.value !== null && p.value !== undefined && p.value !== '') out.push(p.value);
                }
            }
            return out;
        }
        if (SEARCH_TEXT_EXTRACTORS[key]) return SEARCH_TEXT_EXTRACTORS[key](node);
        switch (key) {
            case 'BL': return (typeof node.branch_length === 'number') ? [node.branch_length] : [];
            case 'CO': return node.confidences ? node.confidences.map(c => c.value).filter(v => typeof v === 'number') : [];
            case 'CS': return [node._srchClade];
            case 'NC': { let kids = node.children || node._children; return [kids ? kids.length : 0]; }
            case 'DE': return [node._srchDepth];
            case 'DR': return [node._srchDist];
            default: return [];
        }
    };

    // Run one search spec { field, mode, value, value2, caseSensitive, inverse }
    // over the tree and return the Set of matching nodes.
    // A parsed tree is anchored on a SUPER-ROOT: a synthetic node whose single
    // child is the tree's actual root. It is not a node of the phylogeny -- it
    // exists to give the root a parent slot, which is what lets reRoot() move
    // the root around and what toNewHampshire() writes from. Both formats have
    // one; from phyloXML it also carries the <phylogeny> element's own name and
    // description, so it looks like a node with the TREE's name on it.
    //
    // Anything that reasons about the phylogeny's own nodes has to step over it.
    // This is the test getTreeRoot uses, minus that function's walk UP the tree,
    // which would escape a subtree a caller had deliberately scoped to.
    function realRootOf(root) {
        if (!root.parent && root.children && root.children.length === 1) {
            return root.children[0];
        }
        return root;
    }

    forester.searchWithSpec = function (root, spec) {
        let result = new Set();
        if (!root || !spec || !spec.field) return result;
        // Metrics stay relative to what the caller passed, so depth and distance
        // values are unchanged; only the set of nodes considered is narrowed.
        let nodes = realRootOf(root);
        let field = spec.field;
        if (field.key === 'CS' || field.key === 'DE' || field.key === 'DR' || field.key === 'NC') computeSearchMetrics(root);

        let v = (spec.value === null || spec.value === undefined) ? '' : String(spec.value);
        v = v.replace(/\s+/g, ' ').trim();

        let test = null;
        if (field.numeric) {
            let a = forester.parseFiniteDouble(v);
            let b = (spec.mode === 'range') ? forester.parseFiniteDouble(spec.value2) : null;
            if (a === null || (spec.mode === 'range' && b === null)) return result; // invalid -> reset
            let lo = (b !== null) ? Math.min(a, b) : a;
            let hi = (b !== null) ? Math.max(a, b) : a;
            test = function (n) {
                let vals = forester.extractSearchValues(n, field, root);
                for (let i = 0; i < vals.length; ++i) {
                    let x = (typeof vals[i] === 'number') ? vals[i] : forester.parseFiniteDouble(vals[i]);
                    if (x !== null && numMatches(x, spec.mode, a, lo, hi)) return true;
                }
                return false;
            };
        } else {
            if (v.length < 1) return result;
            let splittable = spec.mode !== 'regex';
            let orTerms = (splittable && v.indexOf(',') >= 0) ? v.split(/,+/) : [v];
            let compiled = [];
            for (let oi = 0; oi < orTerms.length; ++oi) {
                let ot = orTerms[oi].trim();
                if (!ot) continue;
                let ands = (splittable && ot.indexOf('+') > 0) ? ot.split(/\++/) : [ot];
                let tests = [];
                let bad = false;
                for (let ai = 0; ai < ands.length; ++ai) {
                    let term = ands[ai].trim();
                    if (!term) continue;
                    let t = forester.makeSearchStringTest(term, spec.mode, spec.caseSensitive);
                    if (t === null) { bad = true; break; } // invalid regex
                    tests.push(t);
                }
                if (!bad && tests.length) compiled.push(tests);
            }
            if (!compiled.length) return result;
            test = function (n) {
                let vals = forester.extractSearchValues(n, field, root);
                for (let oi = 0; oi < compiled.length; ++oi) {
                    let ands = compiled[oi], ok = true;
                    for (let ai = 0; ai < ands.length; ++ai) {
                        let hit = false;
                        for (let vi = 0; vi < vals.length; ++vi) { if (ands[ai](vals[vi])) { hit = true; break; } }
                        if (!hit) { ok = false; break; }
                    }
                    if (ok) return true;
                }
                return false;
            };
        }

        forester.preOrderTraversalAll(nodes, function (n) { if (test(n)) result.add(n); });

        if (spec.inverse) {
            // Complement, scoped to nodes that actually carry this field.
            let inv = new Set();
            forester.preOrderTraversalAll(nodes, function (n) {
                if (!result.has(n) && forester.extractSearchValues(n, field, root).length > 0) inv.add(n);
            });
            return inv;
        }
        return result;
    };

    // Distinct, trimmed, sorted values of a specific text field across the tree,
    // for the value-box autocomplete. Empty for numeric, Any Text, or Molecular
    // Sequence (near-unique / huge). cap limits the list length (optional).
    forester.distinctSearchValues = function (root, field, cap) {
        if (!root || !field || field.numeric || field.key === 'ANY' || field.key === 'MS') return [];
        let set = new Set();
        forester.preOrderTraversalAll(root, function (n) {
            let vals = forester.extractSearchValues(n, field, root);
            for (let i = 0; i < vals.length; ++i) {
                if (vals[i] !== null && vals[i] !== undefined) {
                    let v = String(vals[i]).trim();
                    if (v.length > 0) set.add(v);
                }
            }
        });
        let arr = Array.from(set).sort(function (a, b) { return a.localeCompare(b); });
        if (cap && arr.length > cap) arr = arr.slice(0, cap);
        return arr;
    };


    // --------------------------------------------------------------
    // Geologic time scale + time-tree detection (the desktop's time axes)
    // --------------------------------------------------------------
    // The ICS International Chronostratigraphic Chart as the desktop embeds
    // it (GeologicTimeScale.java): {name, young, old, color}, ages in Ma,
    // colours the official ICS ones (kept even in monochrome exports -- the
    // timescale IS a colour key). Reference: Cohen, K.M., Harper, D.A.T.,
    // Gibbard, P.L. & Car, N. (2025, updated), The ICS International
    // Chronostratigraphic Chart this decade, Episodes 48: 105-115;
    // International Commission on Stratigraphy, www.stratigraphy.org.

    const GEO_SCALE = {
        eon: [
            {name: 'Phanerozoic', young: 0, old: 538.8, color: '#9AD9DD'},
            {name: 'Proterozoic', young: 538.8, old: 2500, color: '#FF70B8'},
            {name: 'Archean', young: 2500, old: 4031, color: '#FF3399'}
        ],
        era: [
            {name: 'Cenozoic', young: 0, old: 66, color: '#F2F91D'},
            {name: 'Mesozoic', young: 66, old: 251.902, color: '#67C5CA'},
            {name: 'Paleozoic', young: 251.902, old: 538.8, color: '#99C08D'},
            {name: 'Neoproterozoic', young: 538.8, old: 1000, color: '#FF9BCD'},
            {name: 'Mesoproterozoic', young: 1000, old: 1600, color: '#FF7EBF'},
            {name: 'Paleoproterozoic', young: 1600, old: 2500, color: '#E665A6'},
            {name: 'Neoarchean', young: 2500, old: 2800, color: '#FF5CAD'},
            {name: 'Mesoarchean', young: 2800, old: 3200, color: '#E62E8A'},
            {name: 'Paleoarchean', young: 3200, old: 3600, color: '#CC297A'},
            {name: 'Eoarchean', young: 3600, old: 4031, color: '#B2246B'}
        ],
        period: [
            {name: 'Quaternary', young: 0, old: 2.58, color: '#F9F97F'},
            {name: 'Neogene', young: 2.58, old: 23.04, color: '#FFE619'},
            {name: 'Paleogene', young: 23.04, old: 66, color: '#FD9A52'},
            {name: 'Cretaceous', young: 66, old: 143.1, color: '#7FC64E'},
            {name: 'Jurassic', young: 143.1, old: 201.4, color: '#34B2C9'},
            {name: 'Triassic', young: 201.4, old: 251.902, color: '#812B92'},
            {name: 'Permian', young: 251.902, old: 298.9, color: '#F04028'},
            {name: 'Carboniferous', young: 298.9, old: 358.86, color: '#67A599'},
            {name: 'Devonian', young: 358.86, old: 419.62, color: '#CB8C37'},
            {name: 'Silurian', young: 419.62, old: 443.1, color: '#B3E1B6'},
            {name: 'Ordovician', young: 443.1, old: 486.85, color: '#009270'},
            {name: 'Cambrian', young: 486.85, old: 538.8, color: '#7FA056'},
            {name: 'Ediacaran', young: 538.8, old: 635, color: '#FFC3E1'},
            {name: 'Cryogenian', young: 635, old: 720, color: '#FFAFD7'},
            {name: 'Tonian', young: 720, old: 1000, color: '#FFA5D2'},
            {name: 'Stenian', young: 1000, old: 1200, color: '#FFA5D2'},
            {name: 'Ectasian', young: 1200, old: 1400, color: '#FF98CC'},
            {name: 'Calymmian', young: 1400, old: 1600, color: '#FF8BC5'},
            {name: 'Statherian', young: 1600, old: 1800, color: '#EE93C1'},
            {name: 'Orosirian', young: 1800, old: 2050, color: '#E874AF'},
            {name: 'Rhyacian', young: 2050, old: 2300, color: '#EB84B8'},
            {name: 'Siderian', young: 2300, old: 2500, color: '#E874AF'}
        ],
        epoch: [
            {name: 'Holocene', young: 0, old: 0.0117, color: '#FEF2E0'},
            {name: 'Pleistocene', young: 0.0117, old: 2.58, color: '#FFF2AE'},
            {name: 'Pliocene', young: 2.58, old: 5.333, color: '#FFFF99'},
            {name: 'Miocene', young: 5.333, old: 23.04, color: '#FFFF00'},
            {name: 'Oligocene', young: 23.04, old: 33.9, color: '#FDC07A'},
            {name: 'Eocene', young: 33.9, old: 56, color: '#FDB46C'},
            {name: 'Paleocene', young: 56, old: 66, color: '#FDA75F'},
            {name: 'Late Cretaceous', young: 66, old: 100.5, color: '#A6D84A'},
            {name: 'Early Cretaceous', young: 100.5, old: 143.1, color: '#8CCD57'},
            {name: 'Late Jurassic', young: 143.1, old: 161.5, color: '#B3E3EE'},
            {name: 'Middle Jurassic', young: 161.5, old: 174.7, color: '#80CFD8'},
            {name: 'Early Jurassic', young: 174.7, old: 201.4, color: '#42AED0'},
            {name: 'Late Triassic', young: 201.4, old: 237, color: '#BD8CC3'},
            {name: 'Middle Triassic', young: 237, old: 246.7, color: '#B168B1'},
            {name: 'Early Triassic', young: 246.7, old: 251.902, color: '#983999'},
            {name: 'Lopingian', young: 251.902, old: 259.51, color: '#FBA794'},
            {name: 'Guadalupian', young: 259.51, old: 274.4, color: '#FB745C'},
            {name: 'Cisuralian', young: 274.4, old: 298.9, color: '#EF5845'},
            {name: 'Pennsylvanian', young: 298.9, old: 323.4, color: '#99C2B5'},
            {name: 'Mississippian', young: 323.4, old: 358.86, color: '#678F66'},
            {name: 'Late Devonian', young: 358.86, old: 382.31, color: '#F1E19D'},
            {name: 'Middle Devonian', young: 382.31, old: 393.47, color: '#F1C868'},
            {name: 'Early Devonian', young: 393.47, old: 419.62, color: '#E5AC4D'},
            {name: 'Pridoli', young: 419.62, old: 422.7, color: '#E6F5E1'},
            {name: 'Ludlow', young: 422.7, old: 426.7, color: '#BFE6CF'},
            {name: 'Wenlock', young: 426.7, old: 432.9, color: '#B3E1C2'},
            {name: 'Llandovery', young: 432.9, old: 443.1, color: '#99D7B3'},
            {name: 'Late Ordovician', young: 443.1, old: 458.2, color: '#7FCA93'},
            {name: 'Middle Ordovician', young: 458.2, old: 471.3, color: '#4DB47E'},
            {name: 'Early Ordovician', young: 471.3, old: 486.85, color: '#1A9D6F'},
            {name: 'Furongian', young: 486.85, old: 497, color: '#B3E095'},
            {name: 'Miaolingian', young: 497, old: 506.5, color: '#A6CF86'},
            {name: 'Series 2', young: 506.5, old: 521, color: '#99C078'},
            {name: 'Terreneuvian', young: 521, old: 538.8, color: '#8CB06C'}
        ]
    };

    forester.geoIntervals = function (rank) {
        return GEO_SCALE[rank] || [];
    };

    // How far back a rank's intervals reach (its oldest boundary, Ma).
    forester.geoCoverage = function (rank) {
        let ivs = forester.geoIntervals(rank);
        return ivs.length > 0 ? ivs[ivs.length - 1].old : 0;
    };

    // The [coarse, fine] rank pair for a tree reaching back oldMa: always the
    // finest pair that still fully covers the range, so a deep tree never
    // shows blank band segments.
    forester.geoBandRanks = function (oldMa) {
        if (oldMa <= forester.geoCoverage('epoch')) {
            return ['period', 'epoch'];
        }
        if (oldMa <= forester.geoCoverage('period')) {
            return ['era', 'period'];
        }
        return ['eon', 'era'];
    };

    // The rank's intervals overlapping [youngMa, oldMa] (a zero-width window
    // becomes a point query).
    forester.geoOverlapping = function (rank, youngMa, oldMa) {
        let lo = Math.min(youngMa, oldMa);
        let hi = Math.max(youngMa, oldMa);
        return forester.geoIntervals(rank).filter(function (iv) {
            if (hi === lo) {
                return iv.young <= lo && lo < iv.old;
            }
            return iv.old > lo && iv.young < hi;
        });
    };

    // The rank's interval containing ageMa (young <= age < old), or null.
    forester.geoAt = function (rank, ageMa) {
        let ivs = forester.geoIntervals(rank);
        for (let i = 0; i < ivs.length; ++i) {
            if (ivs[i].young <= ageMa && ageMa < ivs[i].old) {
                return ivs[i];
            }
        }
        return null;
    };

    // ---- time-tree detection -------------------------------------------
    // Two date conventions: GEOLOGIC ages (Ma before present, decreasing
    // toward the tips) and CALENDAR years (increasing toward the tips).
    // Decided from the <date> unit attributes, with a magnitude fallback for
    // unitless dates: values mostly in [1500, 2200] read as years; values
    // spanning from large down toward ~0 read as ages.
    const GEO_DATE_UNITS = {
        mya: 1, ma: 1, myr: 1, myrs: 1, my: 1, ga: 1, gya: 1, bya: 1, kya: 1,
        'million years': 1, 'billion years': 1
    };
    const CAL_DATE_UNITS = {
        year: 1, years: 1, yr: 1, yrs: 1, cal: 1, ce: 1, ad: 1, calendar: 1,
        'calendar year': 1, 'calendar years': 1
    };

    // Everything the viewer needs to decide about and draw a time axis:
    // {type: 'geologic'|'calendar'|null, rootAge, presentDate, dated,
    //  hasInternalIntervals, hasExternalIntervals}. rootAge (geologic) and
    // presentDate (calendar) are both the LARGEST date value -- the oldest
    // node for ages, the most recent tip for years.
    forester.timeAxisInfo = function (root) {
        let values = [];
        let maxVal = -Infinity; // running, not Math.max.apply: 150k dated tips overflow the call stack
        let minVal = Infinity;
        let geoUnits = 0;
        let calUnits = 0;
        let internal = 0;
        let external = 0;
        let datedInternal = 0;
        let datedExternal = 0;
        let hasInternalIntervals = false;
        let hasExternalIntervals = false;
        forester.preOrderTraversalAll(root, function (n) {
            let isExt = !n.children && !n._children;
            if (isExt) {
                ++external;
            } else {
                ++internal;
            }
            let d = n.date;
            if (!d) {
                return;
            }
            let interval = (typeof d.minimum === 'number') && (typeof d.maximum === 'number');
            if (interval) {
                if (isExt) {
                    hasExternalIntervals = true;
                } else {
                    hasInternalIntervals = true;
                }
            }
            if (typeof d.value !== 'number' || !isFinite(d.value)) {
                return; // 1e400 parses to Infinity and must never reach the tick loops
            }
            values.push(d.value);
            if (d.value > maxVal) {
                maxVal = d.value;
            }
            if (d.value < minVal) {
                minVal = d.value;
            }
            if (isExt) {
                ++datedExternal;
            } else {
                ++datedInternal;
            }
            if (d.unit) {
                let u = String(d.unit).trim().toLowerCase();
                if (GEO_DATE_UNITS[u]) {
                    ++geoUnits;
                } else if (CAL_DATE_UNITS[u]) {
                    ++calUnits;
                }
            }
        });
        let type = null;
        if (values.length > 0) {
            if (geoUnits > 0 && geoUnits >= calUnits) {
                type = 'geologic';
            } else if (calUnits > 0) {
                type = 'calendar';
            } else {
                let calendarish = values.filter(function (v) {
                    return v >= 1500 && v <= 2200;
                }).length;
                if (calendarish * 2 > values.length) {
                    type = 'calendar';
                } else if (maxVal > 10 && minVal <= maxVal * 0.05) {
                    type = 'geologic';
                }
            }
        }
        let dated = (datedInternal >= 2 && (datedInternal * 2) > internal)
            || (datedExternal >= 2 && (datedExternal * 2) > external);
        let maxValue = values.length > 0 ? maxVal : 0;
        return {
            type: type,
            rootAge: type === 'geologic' ? maxValue : 0,
            presentDate: type === 'calendar' ? maxValue : 0,
            dated: dated,
            hasInternalIntervals: hasInternalIntervals,
            hasExternalIntervals: hasExternalIntervals
        };
    };

    // ---- axis tick mathematics -----------------------------------------
    // The smallest 1/2/5 x 10^k (k may be negative) step >= target.
    forester.niceAxisStep = function (target) {
        if (!(target > 0) || !isFinite(target)) {
            return 1;
        }
        let mag = Math.pow(10, Math.floor(Math.log(target) / Math.LN10));
        let candidates = [1, 2, 5, 10];
        for (let i = 0; i < candidates.length; ++i) {
            let s = candidates[i] * mag;
            if (s >= target - 1e-12) {
                return s;
            }
        }
        return 10 * mag;
    };

    // Tick ages for a "Ma before present" ruler: ~8 nice steps from 0 back
    // to the root age.
    forester.maAxisTickValues = function (rootAge) {
        if (!(rootAge > 0) || !isFinite(rootAge)) {
            return [];
        }
        let step = forester.niceAxisStep(rootAge / 8);
        let vals = [];
        for (let v = 0; v <= rootAge + 1e-9; v += step) {
            vals.push(Math.round(v * 1e6) / 1e6);
        }
        return vals;
    };

    // Whole-year calendar ticks over [from, to]: nice 1/2/5 x 10^k integer
    // steps, ~7 ticks.
    forester.calendarTickYears = function (from, to) {
        let span = to - from;
        if (!(span > 0) || !isFinite(span) || !isFinite(from)) {
            return [];
        }
        let step = Math.max(1, Math.round(forester.niceAxisStep(span / 7)));
        let vals = [];
        for (let y = Math.ceil(from / step) * step; y <= to + 1e-9; y += step) {
            vals.push(y);
        }
        return vals;
    };


    // --------------------------------------------------------------
    // Multiple sequence alignment (the desktop's alignment track)
    // --------------------------------------------------------------
    // Residue palettes, gap handling, conservation scoring and the hover
    // readout data -- all pure, shared by the viewer's alignment track.
    // Palettes are the desktop's (MsaColors.java): a Zappo-style 7-class
    // physico-chemical scheme for amino acids, one colour per base for
    // nucleotides, muted grey for ambiguity codes, and NO fill for a gap.

    const MSA_GAP_CHARS = {'-': true, '.': true, ' ': true, '~': true};

    // [r, g, b] triples so the letter-ink contrast rule can read them.
    const MSA_AA_CLASSES = [
        {residues: 'ILVAM', clazz: 'aliphatic (hydrophobic)', rgb: [240, 170, 170]},
        {residues: 'FWY', clazz: 'aromatic', rgb: [240, 190, 90]},
        {residues: 'KRH', clazz: 'positively charged', rgb: [120, 130, 240]},
        {residues: 'DE', clazz: 'negatively charged', rgb: [230, 100, 100]},
        {residues: 'STNQ', clazz: 'polar (hydrophilic)', rgb: [120, 200, 120]},
        {residues: 'PG', clazz: 'conformationally special', rgb: [220, 130, 220]},
        {residues: 'C', clazz: 'cysteine', rgb: [235, 220, 110]}
    ];
    const MSA_NT_RGB = {
        A: [120, 200, 120],
        C: [120, 130, 240],
        G: [230, 185, 80],
        T: [230, 110, 110],
        U: [230, 110, 110]
    };
    const MSA_UNKNOWN_RGB = [205, 205, 205];

    const MSA_AA_RGB = {};
    const MSA_AA_CLASS = {};
    MSA_AA_CLASSES.forEach(function (c) {
        for (let i = 0; i < c.residues.length; ++i) {
            MSA_AA_RGB[c.residues.charAt(i)] = c.rgb;
            MSA_AA_CLASS[c.residues.charAt(i)] = c.clazz;
        }
    });
    // The palette triples and the geologic table are handed out by reference;
    // freezing them keeps one careless caller mutation from permanently
    // recolouring a whole residue class (or renaming the Cretaceous).
    MSA_AA_CLASSES.forEach(function (c) {
        Object.freeze(c.rgb);
    });
    Object.keys(MSA_NT_RGB).forEach(function (k) {
        Object.freeze(MSA_NT_RGB[k]);
    });
    Object.freeze(MSA_UNKNOWN_RGB);
    Object.keys(GEO_SCALE).forEach(function (rank) {
        GEO_SCALE[rank].forEach(Object.freeze);
        Object.freeze(GEO_SCALE[rank]);
    });

    // Kyte-Doolittle hydropathy and full residue names, for the hover readout.
    const MSA_HYDROPATHY = {
        I: 4.5, V: 4.2, L: 3.8, F: 2.8, C: 2.5, M: 1.9, A: 1.8, G: -0.4,
        T: -0.7, S: -0.8, W: -0.9, Y: -1.3, P: -1.6, H: -3.2, E: -3.5,
        Q: -3.5, D: -3.5, N: -3.5, K: -3.9, R: -4.5
    };
    const MSA_AA_NAMES = {
        A: 'Alanine', R: 'Arginine', N: 'Asparagine', D: 'Aspartic acid',
        C: 'Cysteine', E: 'Glutamic acid', Q: 'Glutamine', G: 'Glycine',
        H: 'Histidine', I: 'Isoleucine', L: 'Leucine', K: 'Lysine',
        M: 'Methionine', F: 'Phenylalanine', P: 'Proline', S: 'Serine',
        T: 'Threonine', W: 'Tryptophan', Y: 'Tyrosine', V: 'Valine',
        U: 'Selenocysteine', O: 'Pyrrolysine',
        B: 'Asparagine or aspartic acid', Z: 'Glutamine or glutamic acid',
        X: 'Any amino acid', '*': 'stop'
    };
    const MSA_NT_NAMES = {
        A: 'Adenine', C: 'Cytosine', G: 'Guanine', T: 'Thymine',
        U: 'Uracil', N: 'any base'
    };
    const MSA_NT_CLASS = {
        A: 'purine', G: 'purine', C: 'pyrimidine', T: 'pyrimidine', U: 'pyrimidine'
    };

    forester.isMsaGap = function (ch) {
        return MSA_GAP_CHARS[ch] === true;
    };

    // The residue's fill as an [r,g,b] triple, or null for a gap (drawn as a
    // faint dash, not a filled cell).
    forester.msaResidueRgb = function (ch, nucleotide) {
        if (ch === undefined || ch === null || forester.isMsaGap(ch)) {
            return null;
        }
        let u = ch.toUpperCase();
        let rgb = nucleotide ? MSA_NT_RGB[u] : MSA_AA_RGB[u];
        return rgb ? rgb : MSA_UNKNOWN_RGB;
    };

    // Black or white letter ink over the given cell colour, by luminance --
    // the same rule the desktop uses.
    forester.msaLetterInk = function (rgb) {
        if (!rgb) {
            return '#404040'; // over a gap / unfilled cell, as on the desktop
        }
        let luminance = (0.299 * rgb[0]) + (0.587 * rgb[1]) + (0.114 * rgb[2]);
        return luminance < 140 ? '#ffffff' : '#000000';
    };

    // Amino acid or nucleotide? Judged on the actual residues, never on any
    // declared type: the fraction of non-gap characters that are plausible
    // bases (ACGTUN) decides.
    forester.msaIsNucleotide = function (seq) {
        if (!seq) {
            return false;
        }
        let bases = 0;
        let residues = 0;
        for (let i = 0; i < seq.length; ++i) {
            let ch = seq.charAt(i);
            if (forester.isMsaGap(ch)) {
                continue;
            }
            ++residues;
            if ('ACGTUNacgtun'.indexOf(ch) >= 0) {
                ++bases;
            }
        }
        return residues > 0 && (bases / residues) > 0.9;
    };

    // Per-column conservation over the given rows (gapped strings; a short
    // row's missing tail counts as gaps). Two measures, both in [0,1]:
    // 'identity' -- the fraction of ROWS carrying the column's most common
    // residue (gaps stay in the denominator); 'information' -- the Schneider
    // & Stephens sequence-logo information content, normalized by log2(K)
    // (K = 4 or 20) and scaled by the column's non-gap fraction. Consensus is
    // the most common NON-gap residue, ties broken alphabetically so figures
    // are reproducible.
    forester.msaConservation = function (rows, length, measure, nucleotide) {
        if (!(length >= 0) || !isFinite(length)) {
            return {scores: [], consensus: []};
        }
        length = Math.floor(length);
        let n = rows.length;
        let scores = new Array(length);
        let consensus = new Array(length);
        let K = nucleotide ? 4 : 20;
        let log2K = Math.log(K) / Math.LN2;
        for (let c = 0; c < length; ++c) {
            let counts = {};
            let nonGap = 0;
            for (let r = 0; r < n; ++r) {
                let row = rows[r];
                let ch = (row && c < row.length) ? row.charAt(c) : '-';
                if (forester.isMsaGap(ch)) {
                    continue;
                }
                ch = ch.toUpperCase();
                ++nonGap;
                counts[ch] = (counts[ch] || 0) + 1;
            }
            let best = null;
            let bestCount = 0;
            Object.keys(counts).sort().forEach(function (ch) {
                if (counts[ch] > bestCount) {
                    bestCount = counts[ch];
                    best = ch;
                }
            });
            consensus[c] = best;
            if (n < 1 || nonGap < 1) {
                scores[c] = 0;
            } else if (measure === 'information') {
                let H = 0;
                Object.keys(counts).forEach(function (ch) {
                    let p = counts[ch] / nonGap;
                    H -= p * (Math.log(p) / Math.LN2);
                });
                let info = (log2K - H) / log2K;
                scores[c] = Math.max(0, info) * (nonGap / n);
            } else {
                scores[c] = bestCount / n;
            }
        }
        return {scores: scores, consensus: consensus};
    };

    // The hover readout's description of one residue: full name, class (amino
    // acids), Kyte-Doolittle hydropathy. Returns null for a gap.
    forester.msaResidueInfo = function (ch, nucleotide) {
        if (ch === undefined || ch === null || forester.isMsaGap(ch)) {
            return null;
        }
        let u = ch.toUpperCase();
        if (nucleotide) {
            return {
                name: MSA_NT_NAMES[u] || 'ambiguity code',
                clazz: MSA_NT_CLASS[u] || null,
                hydropathy: null
            };
        }
        let clazz = MSA_AA_CLASS[u] || 'non-standard / ambiguity code';
        if (u === 'C') {
            clazz = 'cysteine (disulphide-forming)';
        }
        return {
            name: MSA_AA_NAMES[u] || 'ambiguity code',
            clazz: clazz,
            hydropathy: (MSA_HYDROPATHY[u] !== undefined) ? MSA_HYDROPATHY[u] : null
        };
    };

    // The residue's 1-based position within its own UNGAPPED sequence -- the
    // coordinate that maps back onto the real molecule -- or null on a gap.
    forester.msaUngappedPosition = function (row, col) {
        if (!row || col < 0 || col >= row.length || forester.isMsaGap(row.charAt(col))) {
            return null;
        }
        let pos = 0;
        for (let i = 0; i <= col; ++i) {
            if (!forester.isMsaGap(row.charAt(i))) {
                ++pos;
            }
        }
        return pos;
    };


    // --------------------------------------------------------------
    // Unrooted (equal-angle) layout
    // --------------------------------------------------------------
    // The desktop's unrooted display: Meacham's equal-angle algorithm, one
    // pass, no daylight iterations. The root sits at (0,0) and owns the full
    // circle [startAngle, startAngle + 2*pi); each child receives a wedge of
    // its parent's proportional to the external nodes it encloses and sits at
    // its wedge's mid-angle, at the distance lengthOf(child) gives (branch
    // length times the caller's scale factor, or a constant for a cladogram).
    // Angles are ABSOLUTE screen angles (radians, y down), inherited and
    // subdivided -- never re-referenced to the incoming branch, whose
    // direction is implicitly each wedge's midpoint.
    //
    // Writes ux, uy (position) and uangle (the incoming spoke's screen angle)
    // onto every node; returns {maxRad}, the largest distance from the root.
    forester.equalAngleLayout = function (root, startAngle, lengthOf) {
        let counts = new Map();
        let countExt = function (n) {
            let c;
            if (!n.children || n.children.length < 1) {
                c = 1;
            } else {
                c = 0;
                for (let i = 0; i < n.children.length; ++i) {
                    c += countExt(n.children[i]);
                }
            }
            counts.set(n, c);
            return c;
        };
        countExt(root);
        let maxRad = 0;
        root.ux = 0;
        root.uy = 0;
        root.uangle = startAngle;
        let recurse = function (n, low, high) {
            if (!n.children || n.children.length < 1) {
                return;
            }
            let total = counts.get(n);
            let current = low;
            for (let i = 0; i < n.children.length; ++i) {
                let desc = n.children[i];
                let arc = (counts.get(desc) / total) * (high - low);
                let mid = current + (arc / 2);
                let len = lengthOf(desc);
                desc.ux = n.ux + (Math.cos(mid) * len);
                desc.uy = n.uy + (Math.sin(mid) * len);
                desc.uangle = mid;
                let r = Math.sqrt((desc.ux * desc.ux) + (desc.uy * desc.uy));
                if (r > maxRad) {
                    maxRad = r;
                }
                recurse(desc, current, current + arc);
                current += arc;
            }
        };
        recurse(root, startAngle, startAngle + (2 * Math.PI));
        return {maxRad: maxRad};
    };


    // --------------------------------------------------------------
    // Label-field suggestion
    // --------------------------------------------------------------
    // Decides which of the three label groups (node name, taxonomy, sequence)
    // should START checked when a tree is loaded. Two rules, judged on the
    // external nodes' actual label text (supplied by the caller's extractors,
    // so the decision is made on exactly what would be printed):
    //
    // 1. Redundancy: a field whose text is CONTAINED in another checked
    //    field's text (case-insensitively, ignoring spaces and underscores)
    //    for at least 90% of the nodes carrying both adds nothing and starts
    //    unchecked. On mutual containment the earlier field in the priority
    //    order name > taxonomy > sequence is kept.
    //
    // 2. Length budget: if the median combined label of the remaining fields
    //    still exceeds 50 characters, only the single most IDENTIFYING field
    //    stays: the one with the highest ratio of distinct values to ALL
    //    external nodes (a label's job is telling nodes apart -- and a field
    //    carried by only a few tips cannot identify the rest, however unique
    //    its few values are). Within a tie (0.05) the priority order wins,
    //    unless a later field is SUBSTANTIALLY more economical (median length
    //    under 60% of the leader's).
    //
    // A field with no values at all is never checked. This only decides the
    // INITIAL state; the caller's UI stays free to override.
    //
    // extractors: {name, taxonomy, sequence}, each a function(externalNode)
    // returning the text that field would contribute to the node's label, or
    // null / '' when it contributes nothing.
    forester.suggestLabelFields = function (root, extractors) {
        const FIELDS = ['name', 'taxonomy', 'sequence'];
        const CONTAINMENT_MIN = 0.9;
        const BUDGET_CHARS = 50;
        const MIN_PAIRS = 2;
        const TIE_EPSILON = 0.05;
        const LENGTH_ADVANTAGE = 0.6;
        let ext = forester.getAllExternalNodes(root);
        let norm = function (s) {
            return s.toLowerCase().replace(/[\s_]+/g, '');
        };
        let median = function (arr) {
            if (arr.length < 1) {
                return 0;
            }
            let a = arr.slice().sort(function (x, y) {
                return x - y;
            });
            let m = a.length >> 1;
            return (a.length % 2) ? a[m] : (a[m - 1] + a[m]) / 2;
        };
        let vals = {};
        FIELDS.forEach(function (f) {
            let get = extractors ? extractors[f] : null;
            vals[f] = ext.map(function (n) {
                let v = get ? get(n) : null;
                v = (v === undefined || v === null) ? '' : String(v).trim();
                return v.length > 0 ? v : null;
            });
        });
        let stats = {};
        FIELDS.forEach(function (f) {
            let present = vals[f].filter(Boolean);
            stats[f] = {
                count: present.length,
                medianLength: median(present.map(function (s) {
                    return s.length;
                })),
                distinctRatio: (present.length > 0 && ext.length > 0)
                    ? (new Set(present.map(norm)).size / ext.length) : 0
            };
        });
        let checked = {};
        FIELDS.forEach(function (f) {
            checked[f] = stats[f].count > 0;
        });

        let containedFrac = function (inner, outer) {
            let both = 0;
            let contained = 0;
            for (let i = 0; i < ext.length; ++i) {
                let a = vals[outer][i];
                let b = vals[inner][i];
                if (a && b) {
                    ++both;
                    if (norm(a).indexOf(norm(b)) >= 0) {
                        ++contained;
                    }
                }
            }
            return both >= MIN_PAIRS ? contained / both : 0;
        };
        for (let i = 0; i < FIELDS.length; ++i) {
            for (let j = i + 1; j < FIELDS.length; ++j) {
                let a = FIELDS[i];
                let b = FIELDS[j];
                if (!checked[a] || !checked[b]) {
                    continue;
                }
                // on mutual containment this still drops b: a is earlier in
                // the keep-priority order
                if (containedFrac(b, a) >= CONTAINMENT_MIN) {
                    checked[b] = false;
                } else if (containedFrac(a, b) >= CONTAINMENT_MIN) {
                    checked[a] = false;
                }
            }
        }

        let combined = [];
        for (let i = 0; i < ext.length; ++i) {
            let parts = [];
            FIELDS.forEach(function (f) {
                if (checked[f] && vals[f][i]) {
                    parts.push(vals[f][i]);
                }
            });
            if (parts.length > 0) {
                combined.push(parts.join(' | ').length);
            }
        }
        let medianCombined = median(combined);
        let kept = FIELDS.filter(function (f) {
            return checked[f];
        });
        if (medianCombined > BUDGET_CHARS && kept.length > 1) {
            // top distinct-ratio first (a greedy pairwise chain is not
            // transitive within the tie window); everything within the tie
            // window then competes by priority order, with the economy rule
            // as the only override
            let maxDr = 0;
            kept.forEach(function (f) {
                if (stats[f].distinctRatio > maxDr) {
                    maxDr = stats[f].distinctRatio;
                }
            });
            let contenders = kept.filter(function (f) {
                return stats[f].distinctRatio >= maxDr - TIE_EPSILON;
            });
            let best = contenders[0];
            for (let k = 1; k < contenders.length; ++k) {
                if (stats[contenders[k]].medianLength < LENGTH_ADVANTAGE * stats[best].medianLength) {
                    best = contenders[k];
                }
            }
            FIELDS.forEach(function (f) {
                checked[f] = (f === best);
            });
        }
        return {
            showNodeName: checked.name,
            showTaxonomy: checked.taxonomy,
            showSequence: checked.sequence,
            stats: {fields: stats, medianCombinedLength: medianCombined}
        };
    };


    // --------------------------------------------------------------
    // For exporting
    // --------------------------------------------------------------
    if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser) module.exports.forester = forester; else if (typeof window !== "undefined") window.forester = forester; else this.forester = forester;
})();
    