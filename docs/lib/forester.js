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


    forester.filterByNodeProperty = function (positive, phy, propertyMap) {
        if (!phy) {
            throw ("cannot delete null tree");
        }
        if (!propertyMap) {
            throw ("property list is null");
        }
        const toDelete = [];
        forester.preOrderTraversalAll(phy, function (n) {
            if (!n.children && !n._children) {
                if (n.properties && n.properties.length > 0) {
                    const propertiesLength = n.properties.length;
                    for (let i = 0; i < propertiesLength; ++i) {
                        const property = n.properties[i];
                        if (property.ref && property.value && property.applies_to === 'node') {
                            if (positive) {
                                if (property.ref in propertyMap && !propertyMap[property.ref].includes(property.value)) {
                                    toDelete.push(n);
                                }
                            } else {
                                if (property.ref in propertyMap && propertyMap[property.ref].includes(property.value)) {
                                    toDelete.push(n);
                                }
                            }
                        }
                    }
                }
            }
        });
        const l = toDelete.length;
        console.log(toDelete);
        for (let i = 0; i < l; ++i) {
            forester.deleteSubtree(phy, toDelete[i]);
        }
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

    forester.unCollapseAll = function (node) {
        forester.preOrderTraversal(node, function (d) {
            if (d._children) {
                d.children = d._children;
                d._children = null;
            }
        });
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

    forester.setToArray = function (set) {
        let array = [];
        if (set) {
            set.forEach(function (e) {
                array.push(e);
            });
        }
        return array;
    };

    forester.setToSortedArray = function (set) {
        let array = [];
        if (set) {
            set.forEach(function (e) {
                array.push(e);
            });
        }
        return array.sort();
    };

    forester.calcMinMaxInSet = function (set) {
        let array = [];
        let first = true;
        let min = 0;
        let max = 0;
        if (set) {
            set.forEach(function (e) {
                e = parseFloat(e);
                if (first) {
                    first = false;
                    min = e;
                    max = e;
                } else {
                    if (e < min) {
                        min = e;
                    }
                    if (e > max) {
                        max = e;
                    }
                }
            });
        }
        array[0] = min;
        array[1] = max;
        return array;
    };

    forester.calcMinMeanMaxInSet = function (set) {
        let array = [];
        let first = true;
        let min = 0;
        let max = 0;
        let mean = 0;
        let sum = 0;
        let n = 0;
        if (set) {
            set.forEach(function (e) {
                e = parseFloat(e);
                ++n;
                sum += e;
                if (first) {
                    first = false;
                    min = e;
                    max = e;
                } else {
                    if (e < min) {
                        min = e;
                    }
                    if (e > max) {
                        max = e;
                    }
                }
            });
        }
        if (n > 0) {
            mean = sum / n;
        }
        array[0] = min;
        array[1] = mean;
        array[2] = max;
        return array;
    };


    /**
     * This collects all properties in a tree
     * and returns them as dictionary of Sets mapping
     * keys to values.
     * It only collects properly formed properties
     * (as per phyloXML standard), which means
     * that 'applies_to' and 'datatype' have to be present.
     *
     *
     * @param phy - A phyloXML-based tree object or node.
     * @param appliesTo - 'phylogeny', 'clade', 'node', 'annotation', 'parent_branch', or 'other'.
     * @param externalOnly - To collect from external nodes only.
     * @returns {{}}
     */
    forester.collectProperties = function (phy, appliesTo, externalOnly) {
        let props = {};
        forester.preOrderTraversalAll(phy, function (n) {

            if (!externalOnly || externalOnly !== true || (!n.children && !n._children)) {
                if (n.properties && n.properties.length > 0) {
                    let propertiesLength = n.properties.length;
                    for (let i = 0; i < propertiesLength; ++i) {
                        let property = n.properties[i];
                        if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === appliesTo) {
                            let ref = property.ref;
                            if (!props[ref]) {
                                props[ref] = new Set();
                            }
                            props[ref].add(property.value);
                        }
                    }
                }
            }
        });
        return props;
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
    //   numeric     every value parses as a finite number -> Color-range
    //               (a ramp, never categorical colours: order is the one
    //               thing numbers have). Guard: distinct/covered <= 0.9,
    //               or "numeric" identifiers (genome ids) become ramps.
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
    const VIS_MAX_NUMERIC_UNIQUE_NUM = 9;    // distinct/covered <= 0.9,
    const VIS_MAX_NUMERIC_UNIQUE_DEN = 10;   // integer-exact as well
    const VIS_EXCLUDED_REF_PREFIX = 'style:';

    // Fixed candidate slots for the phyloXML elements (properties use their ref).
    const VIS_ELEMENT_SLOTS = [
        {id: 'tax:code', kind: 'taxonomy', label: 'Taxonomy Code', get: function (t) { return t.code; }},
        {id: 'tax:scientific_name', kind: 'taxonomy', label: 'Scientific Name', get: function (t) { return t.scientific_name; }},
        {id: 'tax:common_name', kind: 'taxonomy', label: 'Common Name', get: function (t) { return t.common_name; }},
        {id: 'seq:name', kind: 'sequence', label: 'Sequence Name', get: function (s) { return s.name; }},
        {id: 'seq:symbol', kind: 'sequence', label: 'Sequence Symbol', get: function (s) { return s.symbol; }},
        {id: 'seq:gene_name', kind: 'sequence', label: 'Gene Name', get: function (s) { return s.gene_name; }}
    ];

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
                    stats[id] = {kind: g.kind, ref: g.ref, label: g.label, nodes: 0, values: new Set(), multi: false};
                }
                let s = stats[id];
                s.nodes++;
                if (g.values.length > 1) {
                    s.multi = true;
                }
                for (let i = 0; i < g.values.length; ++i) {
                    s.values.add(g.values[i]);
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
            let distinct = s.values.size;
            if (covered * VIS_MIN_COVERAGE_DEN < total * VIS_MIN_COVERAGE_NUM) {
                return;
            }
            if (distinct < 2) {
                return;
            }
            let values = Array.from(s.values);
            let numeric = values.every(function (v) {
                return Number.isFinite(Number(v));
            });
            let colorMode;
            if (numeric) {
                if (distinct * VIS_MAX_NUMERIC_UNIQUE_DEN > covered * VIS_MAX_NUMERIC_UNIQUE_NUM) {
                    return;
                }
                colorMode = 'range';
                values.sort(function (a, b) {
                    return Number(a) - Number(b);
                });
            } else {
                if (distinct >= total || distinct > VIS_MAX_COLOR_CATEGORIES) {
                    return;
                }
                colorMode = 'category';
                values.sort();
            }
            candidates.push({
                id: id,
                kind: s.kind,
                ref: s.ref,
                // property labels drop the namespace prefix; a cross-namespace
                // collision is resolved below by restoring the full ref
                label: s.label || (s.ref.indexOf(':') >= 0 ? s.ref.substring(s.ref.indexOf(':') + 1) : s.ref),
                numeric: numeric,
                coverage: covered,
                total: total,
                values: values,
                colorMode: colorMode,
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

        candidates.sort(function (a, b) {
            let la = a.label.toLowerCase();
            let lb = b.label.toLowerCase();
            return la < lb ? -1 : (la > lb ? 1 : (a.id < b.id ? -1 : 1));
        });
        return candidates;
    };


    /**
     *
     * Special method for IRD database.
     * Returns true if at least one 'ird:Host' property with 'Avian' found
     *
     * @param phy
     * @param targetValue
     * @param fromRef
     * @param toRef
     * @returns {boolean}
     */
    forester.splitProperty = function (phy, targetValue, fromRef, toRef) {
        let found = false;
        let targetValue_ = targetValue + ' ';
        forester.preOrderTraversalAll(phy, function (n) {
            if (n.properties && n.properties.length > 0) {
                let propertiesLength = n.properties.length;
                for (let i = 0; i < propertiesLength; ++i) {
                    let property = n.properties[i];
                    if (property.ref === fromRef && property.value) {
                        let newValue = '';
                        if (property.value.startsWith(targetValue_)) {
                            newValue = targetValue;
                            found = true;
                        } else {
                            newValue = property.value;
                        }
                        let newproperty = {};
                        newproperty.ref = toRef;
                        newproperty.value = newValue;
                        newproperty.datatype = 'xsd:string';
                        newproperty.applies_to = 'node';
                        n.properties.push(newproperty);
                    }
                }
            }
        });
        return found;
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


    forester.shortenProperties = function (phy, appliesTo, externalOnly, sourceRef, targetRef) {
        forester.preOrderTraversalAll(phy, function (n) {
            if (!externalOnly || externalOnly !== true || (!n.children && !n._children)) {
                if (n.properties && n.properties.length > 0) {
                    let propertiesLength = n.properties.length;
                    for (let i = 0; i < propertiesLength; ++i) {
                        let property = n.properties[i];
                        if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === appliesTo) {
                            if (property.ref === sourceRef) {
                                let s = property.value.trim().split(/\s+/);
                                if (s && s.length > 1) {
                                    let newProp = {};
                                    newProp.ref = targetRef;
                                    if (s.length === 2) {
                                        newProp.value = s[0];
                                    } else {
                                        newProp.value = s[0] + ' ' + s[1];
                                    }
                                    newProp.datatype = property.datatype;
                                    newProp.applies_to = property.applies_to;
                                    n.properties.push(newProp);
                                }
                            }
                        }
                    }
                }
            }
        });
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

    /**
     * Returns true if at least one of the child nodes
     * of node is collapsed.
     *
     * @param node - A node.
     * @returns {boolean} - true if at least one of the child nodes is
     * collapsed
     */
    forester.isHasCollapsedNodes = function (node) {
        let collapsed = false;
        forester.preOrderTraversalAll(node, function (n) {
            if (n._children) {
                collapsed = true;

            }
        });
        return collapsed;
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


    forester.collapseToBranchLength = function (root, branchLength) {
        if (root.children && root.children.length === 1) {
            collapseToBranchLengthHelper(root.children[0], branchLength);
        }

        function collapseToBranchLengthHelper(n, branchLength) {
            if (!(n.children || n._children)) {
                return;
            }

            if (!n.max) {
                n.max = forester.calcMaxBranchLength(n);
            }
            let max = n.max;
            if (max < branchLength) {
                forester.collapse(n);
            } else {
                forester.unCollapse(n);
                for (let i = n.children.length - 1; i >= 0; i--) {
                    collapseToBranchLengthHelper(n.children[i], branchLength);
                }
            }
        }
    };

    forester.collapseToDepth = function (root, depth) {
        if (root.children && root.children.length === 1) {
            collapseToDepthHelper(root.children[0], 0, depth);
        }

        function collapseToDepthHelper(n, d, depth) {
            if (!n.children && !n._children) {
                return;
            }
            if (d >= depth) {
                forester.collapse(n);
            } else {
                forester.unCollapse(n);
                ++d;
                for (let i = n.children.length - 1; i >= 0; i--) {
                    collapseToDepthHelper(n.children[i], d, depth);
                }
            }
        }
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

    forester.getOneDistinctNodePropertyValue = function (node, propertyRef) {
        let propValue = null;
        let result = true;
        forester.preOrderTraversalAll(node, function (n) {
            if (n.properties && n.properties.length > 0) {
                let propertiesLength = n.properties.length;
                let gotIt = false;
                for (let i = 0; i < propertiesLength; ++i) {
                    let property = n.properties[i];
                    if (property.ref && property.value && (property.applies_to === 'node') && (property.ref === propertyRef) && (property.value.length > 0)) {
                        if (propValue === null) {
                            propValue = property.value;
                        } else if (propValue !== property.value) {
                            result = false;
                            return;
                        }
                        gotIt = true;
                    }
                }
                if (!gotIt && !n.children && !n._children) {
                    // If an external node lacks propertyRef, return false.
                    result = false;

                }
            }
        });
        if (propValue === null) {
            return null;
        }
        if (result === true) {
            return propValue;
        } else {
            return null;
        }
    };

    /**
     * To be deprecated!
     *
     * @param phy
     * @returns {{}}
     */
    forester.moveSimpleCharacteristicsToProperties = function (phy) {
        let apptype;
        if (phy.desc) {
            apptype = 'ird:'
        } else {
            apptype = 'vipr:'
        }

        let HOST = apptype + 'Host';
        let COUNTRY = apptype + 'Country';
        let YEAR = apptype + 'Year';
        let HA = apptype + 'HA';
        let NA = apptype + 'NA';
        let NODE = 'node';
        let STRING = 'xsd:string';
        let INT = 'xsd:integer';

        forester.preOrderTraversalAll(phy, function (n) {
            if (n.simple_characteristics) {
                let sc = n.simple_characteristics;
                let props;
                if (sc.country && sc.country.length > 0) {
                    props = {};
                    props.ref = COUNTRY;
                    props.datatype = STRING;
                    props.applies_to = NODE;
                    props.value = sc.country;
                    addProperties(n, props);
                }
                if (sc.host && sc.host.length > 0) {
                    props = {};
                    props.ref = HOST;
                    props.datatype = STRING;
                    props.applies_to = NODE;
                    props.value = sc.host;
                    addProperties(n, props);
                }
                if (sc.year && sc.year.length > 0) {
                    props = {};
                    props.ref = YEAR;
                    props.datatype = INT;
                    props.applies_to = NODE;
                    props.value = parseInt(sc.year);
                    addProperties(n, props);
                }
                if (sc.ha && sc.ha.length > 0) {
                    props = {};
                    props.ref = HA;
                    props.datatype = INT;
                    props.applies_to = NODE;
                    props.value = parseInt(sc.ha);
                    addProperties(n, props);
                }
                if (sc.na && sc.na.length > 0) {
                    props = {};
                    props.ref = NA;
                    props.datatype = INT;
                    props.applies_to = NODE;
                    props.value = parseInt(sc.na);
                    addProperties(n, props);
                }
                n.simple_characteristics = undefined;
            }
        });

        function addProperties(n, props) {
            if (props) {
                if (!n.properties) {
                    n.properties = [];
                }
                let alreadyHave = false;
                let l = n.properties.length;
                for (let i = 0; i < l; ++i) {
                    if (n.properties[i].ref === props.ref) {
                        alreadyHave = true;
                        break;
                    }
                }
                if (!alreadyHave) {
                    n.properties.push(props);
                }
            }
        }
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
    // For exporting
    // --------------------------------------------------------------
    if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser) module.exports.forester = forester; else if (typeof window !== "undefined") window.forester = forester; else this.forester = forester;
})();
    