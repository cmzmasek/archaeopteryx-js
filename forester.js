/**
 *  Copyright (C) 2016 Christian M. Zmasek
 *  Copyright (C) 2016 J. Craig Venter Institute
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

// v 0_61

(function forester() {

    "use strict";

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
            throw "cannot get the child index for a root node";
        }
        var c = parentNode.children.length;
        for (var i = 0; i < c; ++i) {
            if (parentNode.children[i] === childNode) {
                return i;
            }
        }
        throw "unexpected exception: Could not determine the child index for a node";
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
        return array
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
     * @returns {{}}
     */
    forester.collectProperties = function (phy, appliesTo) {
        var props = {};
        forester.preOrderTraversalAll(phy, function (n) {
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
        });
        return props;
    };


    forester.collectBasicTreeProperties = function (tree) {
        var properties = {};
        properties.internalNodeData = false;
        properties.nodeNames = false;
        properties.branchLengths = false;
        properties.confidences = false;
        properties.sequences = false;
        properties.taxonomies = false;

        forester.preOrderTraversalAll(tree, function (n) {
            if (n.name && n.name.length > 0) {
                properties.nodeNames = true;
                if (n.children || n._children) {
                    properties.internalNodeData = true;
                }
            }
            if (n.branch_length && n.branch_length > 0) {
                properties.branchLengths = true;
            }
            if (n.confidences && n.confidences.length > 0) {
                properties.confidences = true;
            }
            if (n.sequences && n.sequences.length > 0) {
                properties.sequences = true;
                if (n.children || n._children) {
                    properties.internalNodeData = true;
                }
            }
            if (n.taxonomies && n.taxonomies.length > 0) {
                properties.taxonomies = true;
                if (n.children || n._children) {
                    properties.internalNodeData = true;
                }
            }
        });

        return properties;
    };


    forester.searchData = function (query,
                                    phy,
                                    caseSensitive,
                                    partial,
                                    regex) {
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
                    forester.preOrderTraversal(phy, matcher);
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
                var np = new RegExp("(\\b|_)" + escapeRegExp(my_query) + "(\\b|_)");
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
        (node.sequences && node.sequences.length > 0) );
    };


    forester.removeMaxBranchLength = function (node) {
        forester.preOrderTraversalAll(node, function (n) {
            if (n.max) {
                n.max = undefined;
            }
        });
    };


    forester.collapseToBranchLength = function (phy, root, branchLength) {
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

    forester.collapseToDepth = function (phy, root, depth) {
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
     * @returns {{}} - A phylogenetic tree object.
     */
    forester.parseNewHampshire = function (nhStr) {
        var ancs = [];
        var x = {};
        var ss = nhStr.split(/\s*(;|\(|\)|,|:)\s*/);
        var ssl = ss.length;
        for (var i = 0; i < ssl; ++i) {
            var element = ss[i];
            switch (element) {
                case '(':
                    var subtree1 = {};
                    x.children = [subtree1];
                    ancs.push(x);
                    x = subtree1;
                    break;
                case ',':
                    var subtree2 = {};
                    ancs[ancs.length - 1].children.push(subtree2);
                    x = subtree2;
                    break;
                case ')':
                    x = ancs.pop();
                    break;
                case ':':
                    break;
                default:
                    var e = ss[i - 1];
                    if (( e === ')' ) || ( e === '(' ) || ( e === ',')) {
                        if (element && element.length > 0) {
                            x.name = element;
                            if ((x.name.charAt(0) === "'" && x.name.charAt(x.name.length - 1) === "'" )
                                || (x.name.charAt(0) === '"' && x.name.charAt(x.name.length - 1) === '"' )) {
                                x.name = x.name.substring(1, x.name.length - 1);
                            }
                        }
                    }
                    else if (e === ':') {
                        x.branch_length = parseFloat(element);
                    }
            }
        }
        var phy = {};
        phy.children = [x];
        forester.addParents(phy);
        return phy;
    };

    /**
     * To convert a phylogentic tree object to a New Hampshire (Newick) formatted string.
     *
     * @param phy - A phylogentic tree object.
     * @param dec - maximal number of decimal points for branch lengths (optional)
     * @returns {*} - a New Hampshire (Newick) formatted string.
     */
    forester.toNewHamphshire = function (phy, dec) {
        var nh = "";
        if (phy.children && phy.children.length === 1) {
            toNewHamphshireHelper(phy.children[0], true, dec);
        }
        if (nh.length > 0) {
            return nh + ";";
        }
        return nh;

        function toNewHamphshireHelper(node, last, dec) {
            if (node.children) {
                var l = node.children.length;
                nh += "(";
                for (var i = 0; i < l; ++i) {
                    toNewHamphshireHelper(node.children[i], i === l - 1, dec);
                }
                nh += ")";
            }
            else if (node._children) {
                var ll = node._children.length;
                nh += "(";
                for (var ii = 0; ii < ll; ++ii) {
                    toNewHamphshireHelper(node._children[ii], ii === ll - 1, dec);
                }
                nh += ")";
            }
            if (node.name && node.name.length > 0) {
                if (node.name.indexOf(' ') >= 0) {
                    nh += "'" + node.name + "'";
                }
                else {
                    nh += node.name;
                }
            }
            if (node.branch_length) {
                if (dec && dec > 0) {
                    nh += ":" + forester.roundNumber(node.branch_length, dec);
                }
                else {
                    nh += ":" + node.branch_length;
                }
            }
            if (!last) {
                nh += ",";
            }
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
    