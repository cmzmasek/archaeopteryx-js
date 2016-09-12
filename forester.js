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

// v 0_48

(function forester() {

    "use strict";


    forester.preOrderTraversal = function (n, fn) {
        fn(n);
        if (n.children) {
            for (var i = n.children.length - 1; i >= 0; i--) {
                forester.preOrderTraversal(n.children[i], fn)
            }
        }
    };


    forester.preOrderTraversalX = function (n, fn) {
        fn(n);
        if (n.children) {
            for (var i = n.children.length - 1; i >= 0; i--) {
                forester.preOrderTraversalX(n.children[i], fn)
            }
        }
        else if (n._children) {
            for (var ii = n._children.length - 1; ii >= 0; ii--) {
                forester.preOrderTraversalX(n._children[ii], fn)
            }
        }
    };


    forester.reRoot = function (tree, root, n, distance_n_to_parent) {
        console.log("re-rooting");
        console.log("tree: " + tree);
        console.log("n: " + n);
        console.log("distance_n_to_parent: " + distance_n_to_parent);
        console.log("root: " + root);

        tree.rooted = true;
        if (!n.parent || !n.parent.parent) {
            console.log("NOTHING TO DO");
        }
        else if (!n.parent.parent.parent) {
            console.log("PARENT IS ROOT");
            if (( n.parent.children.length === 2 ) && ( distance_n_to_parent >= 0 )) {
                var d = n.parent.children[0].branch_length
                    + n.parent.children[1].branch_length;
                var other;
                if (n.parent.children[0] === n) {
                    other = n.parent.children[1];
                }
                else {
                    other = n.parent.children[0];
                }
                n.branch_length = distance_n_to_parent;
                var dm = d - distance_n_to_parent;
                if (dm >= 0) {
                    other.branch_length = dm;
                }
                else {
                    other.branch_length = 0;
                }
            }
            if (n.parent.children.length > 2) {
                var index = getChildNodeIndex(n.parent, n);

                var dn = n.branch_length;
                var prev_root = _root.children[0];
                prev_root.children.splice(index, 1);
                var nr = {};
                nr.children = [];

                setChildNode(nr, 0, n);
                setChildNode(nr, 1, prev_root);

                copyBranchData(n, prev_root);

                _root.children[0] = nr;
                if (distance_n_to_parent >= 0) {
                    n.branch_length = distance_n_to_parent;
                    var dnmp = dn - distance_n_to_parent;
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
                        n.branch_length = dn2;
                        prev_root.branch_length = dn2;
                    }
                }
            }
        }
        else {
            var a = n;
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
                if (distance_n_to_parent >= 0.0) {
                    var diff = a.branch_length - distance_n_to_parent;
                    a.branch_length = distance_n_to_parent;
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
                var node = c.children[1 - forester.getChildNodeIndex(c, b)];
                node.parent = b;
                if (( !c.branch_length  )
                    && ( !node.branch_length  )) {
                    node.branch_length = undefined;
                }
                else {
                    node.branch_length = ( c.branch_length >= 0.0 ? c.branch_length : 0.0 )
                        + ( node.branch_length >= 0.0 ? node.branch_length : 0.0 );
                }
                var cbd = forester.getBranchData(c);
                if (cbd) {
                    forester.setBranchData(node, cbd);
                }
                var l = b.children.length;
                for (var i = 0; i < l; ++i) {
                    if (b.children[i] === c) {
                        setChildNodeOnly(b, i, node);
                        break;
                    }
                }
            }
            else {
                c.parent = b;
                forester.removeChildNode(c, forester.getChildNodeIndex(c, b));
            }
            root.children[0] = new_root;
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


    forester.calcExternalNodes = function (node) {
        if (!node.children) {
            return 1;
        }
        var c = node.children;
        var l = c.length;
        var cc = 0;
        for (var i = 0; i < l; ++i) {
            cc += forester.calcExternalNodes(c[i]);
        }
        return cc;
    };


    forester.getChildren = function (node) {
        return node._children ? node._children : (node.children ? node.children : []);
    };


    forester.getAllExternalDescendants = function (node) {
        var c = forester.getChildren(node);
        if (!c || c.length < 1) {
            return [node];
        }
        var l = c.length;
        var cc = [];
        for (var i = 0; i < l; ++i) {
            cc = cc.concat(forester.getAllExternalDescendants(c[i]));
        }
        return cc;
    };


    forester.calcAverageTreeHeight = function (node, externalDescendants) {
        var c = externalDescendants ? externalDescendants : forester.getAllExternalDescendants(node);
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


    forester.collectTreeProperties = function (tree) {
        var properties = {};
        properties.internalNodeData = false;
        properties.nodeNames = false;
        properties.branchLengths = false;
        properties.confidences = false;
        properties.sequences = false;
        properties.taxonomies = false;

        forester.preOrderTraversalX(tree, function (n) {
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
    