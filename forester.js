/**
 *  Copyright (C) 2019 Christian M. Zmasek
 *  Copyright (C) 2019 Yun Zhang
 *  Copyright (C) 2019 J. Craig Venter Institute
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

// v 1.8.4a5
// 2021-03-08
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
// var forester = require('./forester').forester;
//
// var newHampshireFormattedString = "(((a:1,b:1,c:1)N:2,(d:1,e:1)M:4)O:4,f:1)R:1;";
// var phylogeneticTree = forester.parseNewHampshire(newHampshireFormattedString);
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
// var nh = forester.toNewHampshire(phylogeneticTree);
// console.log(nh);

(function forester() {

    "use strict";

    const BRANCH_EVENT_REF = 'aptx:branch_event';
    const BRANCH_EVENT_DATATYPE = 'xsd:string';
    const BRANCH_EVENT_APPLIES_TO = 'parent_branch';
    const NH_FORMAT_ERR = 'New Hampshire (Newick) format error: ';

    const NUMBERS_ONLY_PATTERN = /^[-+]?[0-9\\.]+$/;

    const MSA_RESIDUE_SORT_MAP = new Map();
    MSA_RESIDUE_SORT_MAP.set('A', 0);
    MSA_RESIDUE_SORT_MAP.set('C', 1);
    MSA_RESIDUE_SORT_MAP.set('D', 2);
    MSA_RESIDUE_SORT_MAP.set('E', 3);
    MSA_RESIDUE_SORT_MAP.set('F', 4);
    MSA_RESIDUE_SORT_MAP.set('G', 5);
    MSA_RESIDUE_SORT_MAP.set('H', 6);
    MSA_RESIDUE_SORT_MAP.set('I', 7);
    MSA_RESIDUE_SORT_MAP.set('K', 8);
    MSA_RESIDUE_SORT_MAP.set('L', 9);
    MSA_RESIDUE_SORT_MAP.set('M', 10);
    MSA_RESIDUE_SORT_MAP.set('N', 11);
    MSA_RESIDUE_SORT_MAP.set('P', 12);
    MSA_RESIDUE_SORT_MAP.set('Q', 13);
    MSA_RESIDUE_SORT_MAP.set('R', 14);
    MSA_RESIDUE_SORT_MAP.set('S', 15);
    MSA_RESIDUE_SORT_MAP.set('T', 16);
    MSA_RESIDUE_SORT_MAP.set('U', 17);// Uracil
    MSA_RESIDUE_SORT_MAP.set('V', 18);
    MSA_RESIDUE_SORT_MAP.set('W', 19);
    MSA_RESIDUE_SORT_MAP.set('Y', 20);
    MSA_RESIDUE_SORT_MAP.set('B', 21);// Asparagine or aspartic acid
    MSA_RESIDUE_SORT_MAP.set('Z', 22);// Glutamine or glutamic acid
    MSA_RESIDUE_SORT_MAP.set('X', 23);
    MSA_RESIDUE_SORT_MAP.set('?', 24);
    MSA_RESIDUE_SORT_MAP.set('-', 25);
    MSA_RESIDUE_SORT_MAP.set('.', 26);


    /**
     * Sets links to parent nodes for all nodes in a
     * phyloXML-based tree object
     *
     * @param phy - A phyloXML-based tree object.
     */
    forester.addParents = function (phy) {
        if (phy.children) {
            for (var i = phy.children.length - 1; i >= 0; --i) {
                var c = phy.children[i];
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
        var root = phy;
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
            for (var i = node.children.length - 1; i >= 0; --i) {
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
            for (var i = node.children.length - 1; i >= 0; --i) {
                forester.preOrderTraversalAll(node.children[i], fn);
            }
        }
        else if (node._children) {
            for (var ii = node._children.length - 1; ii >= 0; --ii) {
                forester.preOrderTraversalAll(node._children[ii], fn);
            }
        }
    };

    forester.postOrderTraversalAll = function (node, fn) {
        if (node.children) {
            var l = node.children.length;
            for (var i = 0; i < l; ++i) {
                forester.postOrderTraversalAll(node.children[i], fn);
            }
        }
        else if (node._children) {
            var ll = node._children.length;
            for (var ii = 0; ii < ll; ++ii) {
                forester.postOrderTraversalAll(node._children[ii], fn);
            }
        }
        fn(node);
    };


    forester.findByNodeName = function (node, name) {
        var found = [];
        forester.preOrderTraversalAll(node, function (n) {
            if (n.name === name) {
                found.push(n);
            }
        });
        return found;
    };

    forester.findByTaxonomyCode = function (node, code) {
        var found = [];
        forester.preOrderTraversalAll(node, function (n) {
            if (n.taxonomies && n.taxonomies.length > 0 && n.taxonomies[0].code === code) {
                found.push(n);
            }
        });
        return found;
    };

    forester.findByTaxonomyScientificName = function (node, scientificName) {
        var found = [];
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
            throw ( "cannot delete null tree" );
        }
        if (!nodeToDelete) {
            throw ( "cannot delete null node" );
        }
        if (!nodeToDelete.parent || !nodeToDelete.parent.parent) {
            throw ( "cannot delete root" );
        }
        if (!nodeToDelete.parent.parent.parent) {
            throw ( "cannot delete direct child of root" );
        }

        var p = nodeToDelete.parent;

        if ((p.children) && (p.children.length > 1)) {
            var i = p.children.indexOf(nodeToDelete);
            if (i !== -1) {
                p.children.splice(i, 1);
            }
        }
        if ((p._children) && (p._children.length > 1)) {
            var ii = p._children.indexOf(nodeToDelete);
            if (ii !== -1) {
                p._children.splice(ii, 1);
            }
        }

        if (p.children.length === 1) {
            var pp = p.parent;
            var cni = forester.getChildNodeIndex(pp, p);
            if ((cni < 0) || (cni > ( pp.children.length - 1 ) )) {
                throw ( "this should never have happened, child node index = " + cni );
            }
            var x = p.children[0];
            var nbl = undefined;
            if (x.branch_length || p.branch_length) {
                nbl = ( x.branch_length > 0 ? x.branch_length : 0 ) + ( p.branch_length > 0 ? p.branch_length : 0  );
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
            throw ( "cannot re-root null tree" );
        }
        if (!node) {
            throw ( "cannot re-root on null node" );
        }
        if (!branchLength) {
            branchLength = -1;
        }
        if (forester.isString(node)) {
            var nodes = forester.findByNodeName(phy, node);
            if (nodes.length > 1) {
                throw ("node name '" + node + "' is not unique");
            }
            else if (nodes.length < 1) {
                throw ("node name '" + node + "' is not found");
            }
            node = nodes[0];
        }

        phy.rooted = true;
        var root = forester.getTreeRoot(phy);

        if (!node.parent || !node.parent.parent) {
            //do noting
        }
        else if (!node.parent.parent.parent) {
            if (( node.parent.children.length === 2 ) && ( branchLength >= 0 )) {
                var d = node.parent.children[0].branch_length
                    + node.parent.children[1].branch_length;
                var other;
                if (node.parent.children[0] === node) {
                    other = node.parent.children[1];
                }
                else {
                    other = node.parent.children[0];
                }
                node.branch_length = branchLength;
                var dm = d - branchLength;
                if (dm >= 0) {
                    other.branch_length = dm;
                }
                else {
                    other.branch_length = 0;
                }
            }
            if (node.parent.children.length > 2) {
                var index = forester.getChildNodeIndex(node.parent, node);
                var dn = node.branch_length;
                var prev_root = root;
                prev_root.children.splice(index, 1);
                var nr = {};
                nr.children = [];
                forester.setChildNode(nr, 0, node);
                forester.setChildNode(nr, 1, prev_root);

                forester.copyBranchData(node, prev_root);

                phy.children[0] = nr;
                nr.parent = phy;
                if (branchLength >= 0) {
                    node.branch_length = branchLength;
                    var dnmp = dn - branchLength;
                    if (dnmp >= 0) {
                        prev_root.branch_length = dnmp;
                    }
                    else {
                        prev_root.branch_length = 0;
                    }
                }
                else {
                    if (dn >= 0) {
                        var dn2 = dn / 2.0;
                        node.branch_length = dn2;
                        prev_root.branch_length = dn2;
                    }
                }
            }
        }
        else {
            var a = node;
            var new_root = {};
            var distance1;
            var distance2 = 0.0;
            var branch_data_1;
            var branch_data_2 = null;
            var b = a.parent;
            var c = b.parent;

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
            }
            else {
                if (branchLength >= 0.0) {
                    var diff = a.branch_length - branchLength;
                    a.branch_length = branchLength;
                    b.branch_length = ( diff >= 0.0 ? diff : 0.0 );
                }
                else {
                    var d2 = a.branch_length / 2.0;
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
            if (c.children.length == 2) {
                var node2 = c.children[1 - forester.getChildNodeIndex(c, b)];
                node2.parent = b;
                if (( !c.branch_length  )
                    && ( !node2.branch_length  )) {
                    node2.branch_length = undefined;
                }
                else {
                    node2.branch_length = ( c.branch_length >= 0.0 ? c.branch_length : 0.0 )
                        + ( node2.branch_length >= 0.0 ? node2.branch_length : 0.0 );
                }
                var cbd = forester.getBranchData(c);
                if (cbd) {
                    forester.setBranchData(node2, cbd);
                }
                var l = b.children.length;
                for (var i = 0; i < l; ++i) {
                    if (b.children[i] === c) {
                        setChildNodeOnly(b, i, node2);
                        break;
                    }
                }
            }
            else {
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
            }
            else {
                parentNode.children[i] = node;
            }
        }
    };

    forester.midpointRoot = function (phy) {
        var root = forester.getTreeRoot(phy);
        var extNodes = forester.getAllExternalNodes(root);
        if (( extNodes.length < 2 ) || ( forester.calcMaxBranchLength(root) <= 0 )) {
            return;
        }
        var counter = 0;
        var totalNodes = forester.getAllNodes(phy).length;
        while (true) {
            if (++counter > (totalNodes + 1)) {
                throw( 'this should not have happened: midpoint rooting does not converge' );
            }
            var a = null;
            var da = 0;
            var db = 0;
            var cl = forester.getTreeRoot(phy).children.length;
            for (var i = 0; i < cl; ++i) {
                var f = forester.getFurthestDescendant(forester.getTreeRoot(phy).children[i]);
                var df = forester.getDistance(f, forester.getTreeRoot(phy));
                if (df > 0) {
                    if (df > da) {
                        db = da;
                        da = df;
                        a = f;
                    }
                    else if (df > db) {
                        db = df;
                    }
                }
            }
            var diff = da - db;
            if (diff < 0.0001) {
                break;
            }
            var x = da - ( diff / 2.0 );
            while (( x > a.branch_length ) && a.parent) {
                x -= ( a.branch_length > 0 ? a.branch_length : 0 );
                a = a.parent;
            }
            forester.reRoot(phy, a, x);
        }
    };

    forester.getFurthestDescendant = function (node) {
        var children = forester.getAllExternalNodes(node);
        var farthest = null;
        var longest = -1000000;
        var l = children.length;
        for (var i = 0; i < l; ++i) {
            var dist = forester.getDistance(children[i], node);
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
        var d = 0.0;
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
            throw ( "cannot remove the child node for a external node" );
        }
        if (( i >= parentNode.children.length ) || ( i < 0 )) {
            throw ( "attempt to get child node " + i + " of a node with "
            + parentNode.children.length + " child nodes." );
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
        }
        else {
            parentNode.children[i] = node;
        }
    };


    forester.getBranchData = function (node) {
        var branchData = null;
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
            throw ( "cannot get the child index for a root node" );
        }
        var c = parentNode.children.length;
        for (var i = 0; i < c; ++i) {
            if (parentNode.children[i] === childNode) {
                return i;
            }
        }
        throw ( "unexpected exception: Could not determine the child index for a node" );
    };


    forester.getChildren = function (node) {
        return node._children ? node._children : (node.children ? node.children : []);
    };


    forester.calcAverageTreeHeight = function (node, externalDescendants) {
        var c = externalDescendants ? externalDescendants : forester.getAllExternalNodes(node);
        var l = c.length;
        var s = 0;
        for (var i = 0; i < l; ++i) {
            var cc = c[i];
            while (cc != node) {
                if (cc.branch_length > 0) {
                    s += cc.branch_length;
                }
                cc = cc.parent;
            }
        }
        return s / l;
    };

    forester.setToArray = function (set) {
        var array = [];
        if (set) {
            set.forEach(function (e) {
                array.push(e);
            });
        }
        return array;
    };

    forester.setToSortedArray = function (set) {
        var array = [];
        if (set) {
            set.forEach(function (e) {
                array.push(e);
            });
        }
        return array.sort();
    };

    forester.calcMinMaxInSet = function (set) {
        var array = [];
        var first = true;
        var min = 0;
        var max = 0;
        if (set) {
            set.forEach(function (e) {
                e = parseFloat(e);
                if (first) {
                    first = false;
                    min = e;
                    max = e;
                }
                else {
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
        var array = [];
        var first = true;
        var min = 0;
        var max = 0;
        var mean = 0;
        var sum = 0;
        var n = 0;
        if (set) {
            set.forEach(function (e) {
                e = parseFloat(e);
                ++n;
                sum += e;
                if (first) {
                    first = false;
                    min = e;
                    max = e;
                }
                else {
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
        var props = {};
        forester.preOrderTraversalAll(phy, function (n) {

            if (!externalOnly || externalOnly !== true || (!n.children && !n._children)) {
                if (n.properties && n.properties.length > 0) {
                    var propertiesLength = n.properties.length;
                    for (var i = 0; i < propertiesLength; ++i) {
                        var property = n.properties[i];
                        if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === appliesTo) {
                            var ref = property.ref;
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
        var found = false;
        var targetValue_ = targetValue + ' ';
        forester.preOrderTraversalAll(phy, function (n) {
            if (n.properties && n.properties.length > 0) {
                var propertiesLength = n.properties.length;
                for (var i = 0; i < propertiesLength; ++i) {
                    var property = n.properties[i];
                    if (property.ref === fromRef && property.value) {
                        var newValue = '';
                        if (property.value.startsWith(targetValue_)) {
                            newValue = targetValue;
                            found = true;
                        }
                        else {
                            newValue = property.value;
                        }
                        var newproperty = {};
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
        var propertyRefs = new Set();
        forester.preOrderTraversalAll(phy, function (n) {

            if (!externalOnly || externalOnly !== true || (!n.children && !n._children)) {
                if (n.properties && n.properties.length > 0) {
                    var propertiesLength = n.properties.length;
                    for (var i = 0; i < propertiesLength; ++i) {
                        var property = n.properties[i];
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
                    var propertiesLength = n.properties.length;
                    for (var i = 0; i < propertiesLength; ++i) {
                        var property = n.properties[i];
                        if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === appliesTo) {
                            if (property.ref === sourceRef) {
                                var s = property.value.trim().split(/\s+/);
                                if (s && s.length > 1) {
                                    var newProp = {};
                                    newProp.ref = targetRef;
                                    if (s.length == 2) {
                                        newProp.value = s[0];
                                    }
                                    else {
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
        var properties = {};
        properties.internalNodeData = false;
        properties.nodeNames = false;
        properties.longestNodeName = 0;
        properties.branchLengths = false;
        properties.confidences = false;
        properties.nodeEvents = false;
        properties.sequences = false;
        properties.taxonomies = false;
        properties.alignedMolSeqs = true;
        properties.maxMolSeqLength = 0;
        properties.externalNodesCount = 0;
        properties.molSeqResiduesPerPosition = null;
        properties.averageBranchLength = 0;
        var bl_counter = 0;
        var bl_sum = 0;
        var molSeqs = [];
        forester.preOrderTraversalAll(tree, function (n) {
            if (n.name && n.name.length > 0) {
                properties.nodeNames = true;
                if (n.name.length > properties.longestNodeName) {
                    properties.longestNodeName = n.name.length;
                }
                if ((n.children || n._children) && ( n.parent )) {
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
            if (n.sequences && n.sequences.length > 0) {
                properties.sequences = true;

                if (n.children || n._children) {
                    properties.internalNodeData = true;
                }
                else {
                    var s = n.sequences[0];
                    if (s.mol_seq && s.mol_seq.value) {
                        if (s.mol_seq.value.length > properties.maxMolSeqLength) {
                            properties.maxMolSeqLength = s.mol_seq.value.length;
                        }
                        if (!s.mol_seq.is_aligned) {
                            properties.alignedMolSeqs = false;
                        }
                        else {
                            molSeqs.push(s.mol_seq.value);
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
                var l = n.properties.length;
                for (var p = 0; p < l; ++p) {
                    if (n.properties[p].ref === BRANCH_EVENT_REF
                        && n.properties[p].datatype === BRANCH_EVENT_DATATYPE
                        && n.properties[p].applies_to === BRANCH_EVENT_APPLIES_TO) {
                        properties.branchEvents = true;
                    }
                }
            }

        });

        if (properties.alignedMolSeqs) {
            properties.molSeqResiduesPerPosition = [];
            for (var p = 0, maxLen = properties.maxMolSeqLength; p < maxLen; ++p) {
                var mySet = new Set();
                for (var i = 0, seqsLen = molSeqs.length; i < seqsLen; ++i) {
                    var molSeq = molSeqs[i];
                    var c = molSeq[p];
                    if (c) {
                        c = c.toUpperCase();
                        mySet.add(c);
                        if (!MSA_RESIDUE_SORT_MAP.has(c)) {
                            throw ( "Unknown MSA residue '" + c + "'" );
                        }
                    }

                }
                var myArray = forester.setToArray(mySet);
                myArray.sort(function (a, b) {
                    return MSA_RESIDUE_SORT_MAP.get(a) - MSA_RESIDUE_SORT_MAP.get(b);
                });
                properties.molSeqResiduesPerPosition.push(myArray);
            }
        }

        if (bl_counter > 0) {
            properties.averageBranchLength = bl_sum / bl_counter;
        }


        return properties;
    };


    forester.searchData = function (query,
                                    phy,
                                    caseSensitive,
                                    partial,
                                    regex,
                                    searchProperties) {
        var nodes = new Set();
        if (!phy || !query || query.length < 1) {
            return nodes;
        }
        var my_query = query.trim();
        if (my_query.length < 1) {
            return nodes;
        }
        my_query = my_query.replace(/\s\s+/g, ' ');

        if (!regex) {
            my_query = my_query.replace(/\+\++/g, '+');
        }

        var queries = [];

        if (!regex && ( my_query.indexOf(",") >= 0 )) {
            queries = my_query.split(",");
        }
        else {
            queries.push(my_query);
        }
        var queriesLength = queries.length;

        for (var i = 0; i < queriesLength; ++i) {
            var q = queries[i];
            if (q) {
                q = q.trim();
                if (q.length > 0) {
                    forester.preOrderTraversalAll(phy, matcher);
                }
            }
        }

        return nodes;


        function matcher(node) {
            var mqueries = [];
            if (!regex && ( q.indexOf("+") >= 0 )) {
                mqueries = q.split("+");
            }
            else {
                mqueries.push(q);
            }
            var mqueriesLength = mqueries.length;
            var match = true;
            for (var i = 0; i < mqueriesLength; ++i) {
                var mq = mqueries[i];
                if (mq) {
                    mq = mq.trim();
                    if (mq.length > 0) {
                        var ndf = null;
                        if (( mq.length > 3 ) && ( mq.indexOf(":") === 2 )) {
                            ndf = makeNDF(mq);
                            if (ndf) {
                                mq = mq.substring(3);
                            }
                        }
                        var lmatch = false;
                        if (( ( ndf === null ) || ( ndf === "NN" ) )
                            && matchme(node.name, mq, caseSensitive, partial, regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "TC" ) ) && node.taxonomies
                            && node.taxonomies.length > 0
                            && matchme(node.taxonomies[0].code,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "TS" ) ) && node.taxonomies
                            && node.taxonomies.length > 0
                            && matchme(node.taxonomies[0].scientific_name,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "TN" ) ) && node.taxonomies
                            && node.taxonomies.length > 0
                            && matchme(node.taxonomies[0].common_name,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "SY" ) ) && node.taxonomies
                            && node.taxonomies.length > 0
                            && matchme(node.taxonomies[0].synonym,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "TI" ) ) && node.taxonomies
                            && node.taxonomies.length > 0 && node.taxonomies[0].id
                            && matchme(node.taxonomies[0].id.value,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "SN" ) ) && node.sequences
                            && node.sequences.length > 0
                            && matchme(node.sequences[0].name,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "GN" ) ) && node.sequences
                            && node.sequences.length > 0
                            && matchme(node.sequences[0].gene_name,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "SS" ) ) && node.sequences
                            && node.sequences.length > 0
                            && matchme(node.sequences[0].symbol,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) || ( ndf === "SA" ) ) && node.sequences
                            && node.sequences.length > 0 && node.sequences[0].accession
                            && matchme(node.sequences[0].accession.value,
                                mq,
                                caseSensitive,
                                partial,
                                regex)) {
                            lmatch = true;
                        }
                        else if (( ( ndf === null ) && ( searchProperties === true ) ) && node.properties
                            && node.properties.length > 0) {

                            var propertiesLength = node.properties.length;
                            for (var i = 0; i < propertiesLength; ++i) {
                                var p = node.properties[i];
                                if (p.value && matchme(p.value,
                                        mq,
                                        caseSensitive,
                                        partial,
                                        regex)) {
                                    lmatch = true;
                                    break;
                                }
                            }
                        }

                        if (!lmatch) {
                            match = false;
                            break;
                        }

                    } // if (mq.length > 0)
                    else {
                        match = false;
                    }
                } // if (mq)
                else {
                    match = false;
                }
            } //  for (var i = 0; i < mqueriesLength; ++i)
            if (match) {
                nodes.add(node);
            }
        }

        function matchme(s,
                         query,
                         caseSensitive,
                         partial,
                         regex) {
            if (!s || !query) {
                return false;
            }
            var my_s = s.trim();
            var my_query = query.trim();
            if (!caseSensitive && !regex) {
                my_s = my_s.toLowerCase();
                my_query = my_query.toLowerCase();
            }
            if (regex) {
                var re = null;
                try {
                    if (caseSensitive) {
                        re = new RegExp(my_query);
                    }
                    else {
                        re = new RegExp(my_query, 'i');
                    }
                }
                catch (err) {
                    return false;
                }
                if (re) {
                    return ( my_s.search(re) > -1 );
                }
                else {
                    return false;
                }
            }
            else if (partial) {
                return ( my_s.indexOf(my_query) > -1 );
            }
            else {
                var np = new RegExp("(^|\\s)" + escapeRegExp(my_query) + "($|\\s)");
                if (np) {
                    return ( my_s.search(np) > -1 );
                }
                else {
                    return false;
                }
            }
        }

        function escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
        }

        function makeNDF(query) {
            var str = query.substring(0, 2);
            if (str === "NN"
                || str === "TC"
                || str === "TN"
                || str === "TS"
                || str === "TI"
                || str === "SY"
                || str === "SN"
                || str === "GN"
                || str === "SS"
                || str === "SA"
                || str === "AN"
                || str === "XR"
                || str === "MS") {
                return str;
            }
            else {
                return null;
            }
        }
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
        var nodes = 0;
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
        var nodes = 0;
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
        var collapsed = false;
        forester.preOrderTraversalAll(node, function (n) {
            if (n._children) {
                collapsed = true;

            }
        });
        return collapsed;
    };

    forester.getAllExternalNodes = function (node) {
        var nodes = [];
        forester.preOrderTraversalAll(node, function (n) {
            if (!n.children && !n._children) {
                nodes.push(n);
            }
        });
        return nodes;
    };

    forester.getAllNodes = function (phy) {
        var nodes = [];
        forester.preOrderTraversalAll(forester.getTreeRoot(phy), function (n) {
            nodes.push(n);
        });
        return nodes;
    };

    forester.calcMaxDepth = function (node) {
        var max = 0;
        forester.preOrderTraversalAll(node, function (n) {
            if (!n.children && !n._children) {
                var steps = forester.calcDepth(n);
                if (steps > max) {
                    max = steps;
                }
            }
        });
        return max;
    };

    forester.calcDepth = function (node) {

        var steps = 0;
        while (node.parent && node.parent.parent) {
            steps++;
            node = node.parent;
        }
        return steps;
    };


    forester.calcBranchLengthSimpleStatistics = function (node) {
        var stats = {};
        stats.mean = 0;
        stats.min = Number.MAX_VALUE;
        stats.max = 0;
        stats.n = 0;
        var sum = 0;
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
        var max = 0;
        forester.preOrderTraversalAll(node, function (n) {
            if (n !== node && n.branch_length && (n.branch_length > max)) {
                max = n.branch_length;
            }
        });
        return max;
    };


    forester.isHasNodeData = function (node) {
        return ( (node.name && node.name.length > 0 ) ||
        (node.taxonomies && node.taxonomies.length > 0) ||
        (node.sequences && node.sequences.length > 0) ||
        (node.properties && node.properties.length > 0) );
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
            var max = n.max;
            if (max < branchLength) {
                forester.collapse(n);
            }
            else {
                forester.unCollapse(n);
                for (var i = n.children.length - 1; i >= 0; i--) {
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
            }
            else {
                forester.unCollapse(n);
                ++d;
                for (var i = n.children.length - 1; i >= 0; i--) {
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

        var NH_FORMAT_ERR_OPEN_PARENS = NH_FORMAT_ERR + 'likely cause: number of open parentheses is larger than number of close parentheses';
        var NH_FORMAT_ERR_CLOSE_PARENS = NH_FORMAT_ERR + 'likely cause: number of close parentheses is larger than number of open parentheses';

        if (confidenceValuesInBrackets == undefined) {
            confidenceValuesInBrackets = true;
        }
        if (confidenceValuesAsInternalNames == undefined) {
            confidenceValuesAsInternalNames = false;
        }
        if ((confidenceValuesInBrackets === true ) && (confidenceValuesAsInternalNames === true)) {
            throw ( "confidence values cannot be both in brackets and as internal node names" );
        }

        var ancs = [];
        var x = {};
        var ss = nhStr.split(/(;|\(|\)|,|:|"|')/);
        var ssl = ss.length;
        var in_double_q = false;
        var in_single_q = false;
        var buffer = '';
        for (var i = 0; i < ssl; ++i) {
            var element = ss[i].replace(/\s+/g, '');

            if (element === '"' && !in_single_q) {
                if (!in_double_q) {
                    in_double_q = true;
                }
                else {
                    in_double_q = false;
                    if (x.name && x.name.length > 0) {
                        x.name = x.name + buffer;
                    }
                    else {
                        x.name = buffer;
                    }
                    buffer = '';
                }
            }
            else if (element === "'" && !in_double_q) {
                if (!in_single_q) {
                    in_single_q = true;
                }
                else {
                    in_single_q = false;
                    if (x.name && x.name.length > 0) {
                        x.name = x.name + buffer;
                    }
                    else {
                        x.name = buffer;
                    }
                    buffer = '';
                }
            }
            else {
                if (in_double_q || in_single_q) {
                    buffer += ss[i].replace(/\s+/g, ' ');
                }
                else {
                    if (element === '(') {
                        if (!x) {
                            throw ( NH_FORMAT_ERR_CLOSE_PARENS );
                        }
                        var subtree1 = {};
                        x.children = [subtree1];
                        ancs.push(x);
                        x = subtree1;
                    }
                    else if (element === ',') {
                        if (ancs.length === 0) {
                            throw (NH_FORMAT_ERR_CLOSE_PARENS);
                        }
                        var subtree2 = {};
                        ancs[ancs.length - 1].children.push(subtree2);
                        x = subtree2;
                    }
                    else if (element === ')') {
                        x = ancs.pop();
                    }
                    else if (element === ':') {
                    }
                    else {
                        var e = ss[i - 1];
                        if (e) {
                            e = e.trim();
                            if (( e === ')' ) || ( e === '(' ) || ( e === ',')) {
                                if (element && element.length > 0) {
                                    if (element.charAt(element.length - 1) === "]") {
                                        var o = element.indexOf('[');
                                        if (o > -1) {
                                            if (confidenceValuesInBrackets === true) {
                                                addConfidence(x, element);
                                            }
                                            x.name = element.substring(0, o);
                                        }
                                        else {
                                            x.name = element;
                                        }
                                    }
                                    else {
                                        x.name = element;
                                        var op = x.name.indexOf('[');
                                        if (op > -1) {
                                            var cl = x.name.indexOf(']');
                                            if (cl > op) {
                                                x.name = x.name.substring(0, op) + x.name.substring(cl + 1, x.name.length);
                                            }
                                        }
                                    }
                                }
                            }
                            else if (e === ':') {
                                if (element && element.length > 0) {
                                    if (element.charAt(element.length - 1) === ']') {
                                        var o1 = element.indexOf('[');
                                        if (o1 > -1) {
                                            if (confidenceValuesInBrackets === true) {
                                                addConfidence(x, element);
                                            }
                                            var bl = parseFloat(element.substring(0, o1));
                                            if (forester.isNumber(bl)) {
                                                x.branch_length = bl;
                                            }
                                        }
                                    }
                                    else {
                                        var b = parseFloat(parseFloat(element));
                                        if (forester.isNumber(b)) {
                                            x.branch_length = b;
                                        }
                                        else {
                                            throw ( NH_FORMAT_ERR + 'could not parse branch-length from "' + element + '"' );
                                        }
                                    }
                                }
                            }
                            else if (e === '"' || e === "'") {
                                if ((element && element.length > 0) && (x.name && x.name.length > 0 )) {
                                    if (element.charAt(element.length - 1) === "]") {
                                        var opp = element.indexOf('[');
                                        if (opp > -1) {
                                            if (confidenceValuesInBrackets === true) {
                                                addConfidence(x, element);
                                            }
                                            x.name = x.name + element.substring(0, opp);
                                        }
                                        else {
                                            x.name = x.name + element;
                                        }
                                    }
                                    else {
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
            throw ( NH_FORMAT_ERR_OPEN_PARENS );
        }
        if (!x) {
            throw ( NH_FORMAT_ERR_CLOSE_PARENS );
        }

        var phy = {};
        phy.children = [x];

        forester.addParents(phy);

        if (confidenceValuesAsInternalNames === true) {
            moveInternalNodeNamesToConfidenceValues(phy);
        }

        return phy;

        function addConfidence(x, element) {
            var confValue = parseConfidence(element);
            if (confValue != null) {
                x.confidences = [];
                var conf = {};
                conf.value = confValue;
                conf.type = 'unknown';
                x.confidences.push(conf);
            }
        }

        function parseConfidence(str) {
            var o = str.indexOf('[');
            if (o > -1) {
                var s = str.substring(o + 1, element.length - 1);
                if (NUMBERS_ONLY_PATTERN.test(s)) {
                    var confValue = parseFloat(s);
                    if (forester.isNumber(confValue)) {
                        return confValue;
                    }
                    else {
                        throw ( NH_FORMAT_ERR + 'could not parse confidence value from "' + str + '"' );
                    }
                }
            }
            return null;
        }

        function moveInternalNodeNamesToConfidenceValues(node) {
            forester.preOrderTraversalAll(node, function (n) {
                if (n.children || n._children) {
                    if (n.name) {
                        var s = n.name;
                        if (NUMBERS_ONLY_PATTERN.test(s)) {
                            var confValue = parseFloat(s);
                            if ((confValue != null) && (forester.isNumber(confValue))) {
                                n.confidences = [];
                                var conf1 = {};
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
        if (v !== v) {
            // This can only be true if the v is NaN
            return false;
        }
        return true;
    };

    forester.getOneDistinctTaxonomy = function (node) {
        var id = null;
        var code = null;
        var sn = null;
        var cn = null;
        var result = true;
        var sawTax = false;
        forester.preOrderTraversalAll(node, function (n) {
            if (n.taxonomies && n.taxonomies.length === 1) {
                var tax = n.taxonomies[0];
                if (tax.code && tax.code.length > 0) {
                    sawTax = true;
                    if (code === null) {
                        code = tax.code;
                    }
                    else if (code != tax.code) {
                        result = false;
                        return;
                    }
                }
                if (tax.scientific_name && tax.scientific_name.length > 0) {
                    sawTax = true;
                    if (sn === null) {
                        sn = tax.scientific_name;
                    }
                    else if (sn != tax.scientific_name) {
                        result = false;
                        return;
                    }
                }
                if (tax.common_name && tax.common_name.length > 0) {
                    sawTax = true;
                    if (cn === null) {
                        cn = tax.common_name;
                    }
                    else if (cn != tax.common_name) {
                        result = false;
                        return;
                    }
                }
                if (tax.id && tax.id.value && tax.id.value.length > 0) {
                    sawTax = true;
                    var myid;
                    if (tax.id.provider && tax.id.provider.length > 0) {
                        myid = tax.id.provider + ':' + tax.id.value;
                    }
                    else {
                        myid = tax.id.value;
                    }
                    if (id === null) {
                        id = myid;
                    }
                    else if (id != myid) {
                        result = false;

                    }
                }
            }
            else if (!n.children && !n._children) {
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
            }
            else if (code) {
                return code;
            }
            else if (cn) {
                return cn;
            }
            else if (id) {
                return id;
            }
        }
        return null;
    };

    forester.getOneDistinctNodePropertyValue = function (node, propertyRef) {
        var propValue = null;
        var result = true;
        forester.preOrderTraversalAll(node, function (n) {
            if (n.properties && n.properties.length > 0) {
                var propertiesLength = n.properties.length;
                var gotIt = false;
                for (var i = 0; i < propertiesLength; ++i) {
                    var property = n.properties[i];
                    if (property.ref && property.value && (property.applies_to === 'node') && ( property.ref === propertyRef) && ( property.value.length > 0)) {
                        if (propValue === null) {
                            propValue = property.value;
                        }
                        else if (propValue != property.value) {
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
        }
        else {
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
        var apptype;
        if (phy.desc) {
            apptype = 'ird:'
        }
        else {
            apptype = 'vipr:'
        }

        var HOST = apptype + 'Host';
        var COUNTRY = apptype + 'Country';
        var YEAR = apptype + 'Year';
        var HA = apptype + 'HA';
        var NA = apptype + 'NA';
        var NODE = 'node';
        var STRING = 'xsd:string';
        var INT = 'xsd:integer';

        forester.preOrderTraversalAll(phy, function (n) {
            if (n.simple_characteristics) {
                var sc = n.simple_characteristics;
                var props;
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
                var alreadyHave = false;
                var l = n.properties.length;
                for (var i = 0; i < l; ++i) {
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
        var nh = "";
        if (phy.children && phy.children.length === 1) {
            toNewHampshireHelper(phy.children[0], true);
        }
        if (nh.length > 0) {
            return nh + ";";
        }
        return nh;

        function toNewHampshireHelper(node, last) {
            if (node.children) {
                var l = node.children.length;
                nh += "(";
                for (var i = 0; i < l; ++i) {
                    toNewHampshireHelper(node.children[i], i === l - 1);
                }
                nh += ")";
            }
            else if (node._children) {
                var ll = node._children.length;
                nh += "(";
                for (var ii = 0; ii < ll; ++ii) {
                    toNewHampshireHelper(node._children[ii], ii === ll - 1);
                }
                nh += ")";
            }
            if (node.name && node.name.length > 0) {
                if (replaceChars === true) {
                    nh += replaceUnsafeChars(node.name);
                }
                else {
                    var myName = node.name.replace(/\s+/g, ' ');
                    if (/[\s,():;'"\[\]]/.test(myName)) {
                        if ((myName.indexOf('"') > -1) && (myName.indexOf("'") > -1 )) {
                            nh += '"' + myName.replace(/"/g, "'") + '"';
                        }
                        else if (myName.indexOf('"') > -1) {
                            nh += "'" + myName + "'";
                        }
                        else {
                            nh += '"' + myName + '"';
                        }
                    }
                    else {
                        nh += myName;
                    }
                }
            }
            if (node.branch_length !== undefined && node.branch_length !== null) {
                if (decPointsMax && decPointsMax > 0) {
                    nh += ":" + forester.roundNumber(node.branch_length, decPointsMax);
                }
                else {
                    nh += ":" + node.branch_length;
                }
            }
            if (writeConfidences && node.confidences && node.confidences.length === 1 && node.confidences[0].value !== undefined && node.confidences[0].value !== null) {
                if (decPointsMax && decPointsMax > 0) {
                    nh += "[" + forester.roundNumber(node.confidences[0].value, decPointsMax) + "]";
                }
                else {
                    nh += "[" + node.confidences[0].value + "]";
                }
            }
            if (!last) {
                nh += ",";
            }
        }

        function replaceUnsafeChars(str) {
            return str.replace(/[\s,():;'"\[\]]+/g, '_');
        }
    };

    forester.roundNumber = function (num, dec) {
        return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    };

    forester.isString = function (s) {
        return (typeof s === 'string' || s instanceof String);
    };


    // --------------------------------------------------------------
    // For exporting
    // --------------------------------------------------------------
    if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser)
        module.exports.forester = forester;
    else if (typeof window !== "undefined")
        window.forester = forester;
    else
        this.forester = forester;
})();
    