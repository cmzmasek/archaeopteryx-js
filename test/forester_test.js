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

"use strict";

var fs = require('fs');
var pp = require('./lib/phyloxml_parser').phyloXmlParser;
var forester = require('../forester').forester;

if (!forester) {
    throw "no forester.js";
}

var t0 = require('path').join(__dirname, "./data/t0.xml");
var t1 = require('path').join(__dirname, "./data/t1.xml");

console.log("getTreeRoot                : " + ( testGetTreeRoot() === true ? "pass" : "FAIL" ));
console.log("preOrderTraversal          : " + ( testPreOrderTraversal() === true ? "pass" : "FAIL" ));
console.log("preOrderTraversalAll       : " + ( testPreOrderTraversalAll() === true ? "pass" : "FAIL" ));
console.log("reRoot                     : " + ( testReRoot() === true ? "pass" : "FAIL" ));
console.log("coll                       : " + ( testColl() === true ? "pass" : "FAIL" ));


function readPhyloXmlFromFile(fileName) {
    var text = fs.readFileSync(fileName, 'utf8');
    return pp.parse(text, {trim: true, normalize: true});
}


function testGetTreeRoot() {
    var phy0 = readPhyloXmlFromFile(t0)[0];
    var phy = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy0);
    forester.addParents(phy);

    var root0 = forester.getTreeRoot(phy0);

    if (root0.children) {
        return false;
    }
    if (root0.name !== 'node0') {
        return false;
    }

    var root1 = forester.getTreeRoot(phy);
    if (root1.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root1.children.length !== 2) {
        return false;
    }

    var root2 = forester.getTreeRoot(root1);
    if (root2.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root2.children.length !== 2) {
        return false;
    }

    var root3 = forester.getTreeRoot(root2.children[0]);
    if (root3.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root3.children.length !== 2) {
        return false;
    }

    var root4 = forester.getTreeRoot(forester.findByNodeName(phy, "22_MOUSE")[0]);
    if (root4.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root4.children.length !== 2) {
        return false;
    }

    var root5 = forester.getTreeRoot(forester.findByNodeName(phy, "3_BRAFL")[0]);
    if (root5.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root5.children.length !== 2) {
        return false;
    }

    return true;
}


function testPreOrderTraversal() {
    var phy0 = readPhyloXmlFromFile(t0)[0];
    var phy = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy);
    forester.addParents(phy0);
    var c = 0;
    forester.preOrderTraversal(phy, function () {
        ++c;
    });
    if (c !== 56) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(forester.getTreeRoot(phy), function () {
        ++c;
    });
    if (c !== 55) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(forester.findByNodeName(phy, "3_BRAFL")[0], function () {
        ++c;
    });
    if (c !== 1) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(forester.findByNodeName(phy, "my name!")[0], function () {
        ++c;
    });
    if (c !== 3) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(phy0, function () {
        ++c;
    });

    if (c !== 2) {
        return false;
    }

    return true;
}

function testPreOrderTraversalAll() {
    var phy = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy);
    var c = 0;
    forester.preOrderTraversalAll(phy, function () {
        ++c;
    });
    if (c !== 56) {
        return false;
    }

    c = 0;
    forester.preOrderTraversalAll(forester.getTreeRoot(phy), function () {
        ++c;
    });
    if (c !== 55) {
        return false;
    }

    c = 0;
    forester.preOrderTraversalAll(forester.findByNodeName(phy, "3_BRAFL")[0], function () {
        ++c;
    });
    if (c !== 1) {
        return false;
    }

    c = 0;
    forester.preOrderTraversalAll(forester.findByNodeName(phy, "my name!")[0], function () {
        ++c;
    });
    if (c !== 3) {
        return false;
    }

    return true;
}

function testReRoot() {
    var phy1 = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy1);

    var root1 = forester.getTreeRoot(phy1);
    var newRoot = forester.findByTaxonomyCode(phy1, "TRICA")[0];
    //console.log(newRoot);
    forester.reRoot(phy1, root1, newRoot, -1);

    var root5 = forester.getTreeRoot(phy1);
    //console.log(root5);
    if (root5.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    //console.log(phy1);

    forester.preOrderTraversalAll(phy1, function (n) {
        //console.log(n.name);
    });


    return true;
}

function testColl() {
    var phy1 = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy1);

    forester.collapseToFn(phy1, forester.getTreeRoot(phy1).parent, forester.collapseFnBranchLengthMax);


    return true;
}


