/**
 *  Copyright (C) 2025 Christian M. Zmasek
 *  Copyright (C) 2025 J. Craig Venter Institute
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

// v 2.3.0.a1
// 2025-06-30

"use strict";


var forester = require('../forester').forester;

if (!forester) {
    throw "no forester.js";
}

var pth = require('path');

var t0 = pth.join(__dirname, "./data/t0.xml");
var t1 = pth.join(__dirname, "./data/t1.xml");

var _testFailures = 0;

// Runs a single test function, catching thrown errors so one bad test cannot
// crash the whole suite, and records failures so the process can exit non-zero
// (needed for CI to detect regressions).
function runTest(label, fn) {
    var ok;
    try {
        ok = fn() === true;
    } catch (e) {
        ok = false;
        console.log(label + ": threw " + (e && e.stack ? e.stack : e));
    }
    if (!ok) {
        _testFailures++;
    }
    console.log(label + (ok ? "pass" : "FAIL"));
}

runTest("getTreeRoot                : ", testGetTreeRoot);
runTest("preOrderTraversal          : ", testPreOrderTraversal);
runTest("preOrderTraversalAll       : ", testPreOrderTraversalAll);
runTest("NewHampshire 1             : ", testNewHampshire);
runTest("NewHampshire 2             : ", testNewHampshire2);
runTest("NewHampshire 3             : ", testNewHampshire3);
runTest("reRoot 1                   : ", testReRoot1);
runTest("reRoot 2                   : ", testReRoot2);
runTest("reRoot 3                   : ", testReRoot3);
runTest("delete subtree             : ", testDeleteSubtree);
runTest("Nexus parse                : ", testNexusParse);
runTest("Nexus round trip           : ", testNexusRoundTrip);
runTest("Auspice JSON               : ", testAuspiceJson);
runTest("BEAST/NHX annotations      : ", testExtendedNewickAnnotations);
runTest("Nexus dialect variants     : ", testNexusParserVariants);
runTest("Nexus BEAST MCC file       : ", testNexusBeastMcc);
runTest("Nexus writer fallbacks     : ", testNexusWriterFallbacks);
runTest("BEAST/NHX annotations 2    : ", testBeastAnnotationsMore);
runTest("Auspice edge cases         : ", testAuspiceMore);
runTest("Ladderize (n-ary)          : ", testLadderize);

if (_testFailures > 0) {
    console.log("\n" + _testFailures + " test(s) FAILED");
    process.exit(1);
} else {
    console.log("\nAll tests passed");
}

function readPhyloXmlFromFile(fileName) {
    var fs = require('fs');
    var px = require('./lib/phyloxml').phyloXml;
    var text = fs.readFileSync(fileName, 'utf8');
    return px.parse(text, {trim: true, normalize: true});
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

function testReRoot1() {
    var nh = "(((a,b,c),(d,e)),f)r;";
    var phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a,((f,(d,e)),b,c));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "b");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(b,(a,(f,(d,e)),c));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "c");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(c,(a,b,(f,(d,e))));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "d");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(d,(((a,b,c),f),e));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "e");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(e,(d,((a,b,c),f)));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "f");
    rr = forester.toNewHampshire(phy);
    if (rr !== nh) {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "r");
    var rr = forester.toNewHampshire(phy);
    if (rr !== nh) {
        return false;
    }
    var nh3 = "(((a,b,c)abc,(d,e)de)abcde,f)r;";
    phy = forester.parseNewHampshire(nh3);
    forester.reRoot(phy, "abc");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((a,b,c)abc,(f,(d,e)de)abcde);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh3);
    forester.reRoot(phy, "abcde");
    rr = forester.toNewHampshire(phy);
    if (rr !== nh3) {
        return false;
    }
    phy = forester.parseNewHampshire(nh3);
    forester.reRoot(phy, "de");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((d,e)de,((a,b,c)abc,f)abcde);") {
        return false;
    }
    var nh4 = "(((a:0.1,b:0.2,c:0.3)abc:0.4,(d:0.5,e:0.6)de:0.7)abcde:0.8,f:0.9)r:1.0;";
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(a:0.05,((f:1.7,(d:0.5,e:0.6)de:0.7)abcde:0.4,b:0.2,c:0.3)abc:0.05);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "b");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(b:0.1,(a:0.1,(f:1.7,(d:0.5,e:0.6)de:0.7)abcde:0.4,c:0.3)abc:0.1);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "c");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(c:0.15,(a:0.1,b:0.2,(f:1.7,(d:0.5,e:0.6)de:0.7)abcde:0.4)abc:0.15);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "d");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(d:0.25,(((a:0.1,b:0.2,c:0.3)abc:0.4,f:1.7)abcde:0.7,e:0.6)de:0.25);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "e");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(e:0.3,(d:0.5,((a:0.1,b:0.2,c:0.3)abc:0.4,f:1.7)abcde:0.7)de:0.3);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "f");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(((a:0.1,b:0.2,c:0.3)abc:0.4,(d:0.5,e:0.6)de:0.7)abcde:0.8,f:0.9)r:1;") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "abc");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "((a:0.1,b:0.2,c:0.3)abc:0.2,(f:1.7,(d:0.5,e:0.6)de:0.7)abcde:0.2);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "de");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "((d:0.5,e:0.6)de:0.35,((a:0.1,b:0.2,c:0.3)abc:0.4,f:1.7)abcde:0.35);") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "abcde");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(((a:0.1,b:0.2,c:0.3)abc:0.4,(d:0.5,e:0.6)de:0.7)abcde:0.8,f:0.9)r:1;") {
        return false;
    }
    phy = forester.parseNewHampshire(nh4);
    forester.reRoot(phy, "r");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(((a:0.1,b:0.2,c:0.3)abc:0.4,(d:0.5,e:0.6)de:0.7)abcde:0.8,f:0.9)r:1;") {
        return false;
    }
    return true;
}

function testReRoot2() {

    var nh = "(((a,b,c)abc,(d,e)de)abcde,f)r;";
    var phy = forester.parseNewHampshire(nh);

    forester.reRoot(phy, "a");
    forester.reRoot(phy, "b");

    var rr = forester.toNewHampshire(phy);
    if (rr !== "(b,((f,(d,e)de)abcde,a,c)abc);") {
        return false;
    }

    nh = "(((a:0.1,b:0.2,c:0.3)abc:0.4,(d:0.5,e:0.6)de:0.7)abcde:0.8,f:0.9)r:1.0;";
    phy = forester.parseNewHampshire(nh);

    forester.reRoot(phy, "a");
    forester.reRoot(phy, "b");
    forester.reRoot(phy, "c");
    forester.reRoot(phy, "d");
    forester.reRoot(phy, "e");
    forester.reRoot(phy, "f");
    forester.reRoot(phy, "f");
    forester.reRoot(phy, "abc");
    forester.reRoot(phy, "de");
    forester.reRoot(phy, "abcde");
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(a:0.05,(c:0.3,((e:0.6,d:0.5)de:0.7,f:1.7)abcde:0.4,b:0.2)abc:0.05);") {
        return false;
    }
    forester.reRoot(phy, "f");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(f:0.85,((e:0.6,d:0.5)de:0.7,(c:0.3,a:0.1,b:0.2)abc:0.4)abcde:0.85);") {
        return false;
    }
    forester.reRoot(phy, "f");
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(f:0.85,((e:0.6,d:0.5)de:0.7,(c:0.3,a:0.1,b:0.2)abc:0.4)abcde:0.85);") {
        return false;
    }
    var nr = forester.findByNodeName(phy, "f")[0];
    forester.reRoot(phy, nr.parent, -1);
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(f:0.85,((e:0.6,d:0.5)de:0.7,(c:0.3,a:0.1,b:0.2)abc:0.4)abcde:0.85);") {
        return false;
    }
    nr = forester.findByNodeName(phy, "f")[0];
    forester.reRoot(phy, nr.parent.parent, -1);
    rr = forester.toNewHampshire(phy, 6);
    if (rr !== "(f:0.85,((e:0.6,d:0.5)de:0.7,(c:0.3,a:0.1,b:0.2)abc:0.4)abcde:0.85);") {
        return false;
    }
    return true;
}

function testReRoot3() {


    var nh = "((a1,a2,a3)a,(b1,b2,b3)b,(c1,c2,c3)c)r;";

    var phy = forester.parseNewHampshire(nh);

    forester.reRoot(phy, "b2");

    var rr = forester.toNewHampshire(phy);
    if (rr !== "(b2,(b1,((a1,a2,a3)a,(c1,c2,c3)c)r,b3)b);") {
        return false;
    }

    nh = "((a1,a2,a3)a,(b1,b2,b3)b,(c1,c2,c3)c,(d1,d2,d3)d);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((a1,a2,a3)a,((b1,b2,b3)b,(c1,c2,c3)c,(d1,d2,d3)d));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "b");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((b1,b2,b3)b,((a1,a2,a3)a,(c1,c2,c3)c,(d1,d2,d3)d));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "c");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((c1,c2,c3)c,((a1,a2,a3)a,(b1,b2,b3)b,(d1,d2,d3)d));") {
        return false;
    }
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "d");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((d1,d2,d3)d,((a1,a2,a3)a,(b1,b2,b3)b,(c1,c2,c3)c));") {
        return false;
    }
    nh = "(a,b,c);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a,(b,c));") {
        return false;
    }
    nh = "(a,b,c);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "b");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(b,(a,c));") {
        return false;
    }
    nh = "(a,b,c);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "c");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(c,(a,b));") {
        return false;
    }
    nh = "(a:0.1,b:0.2,c:0.3);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a:0.05,(b:0.2,c:0.3):0.05);") {
        return false;
    }
    nh = "(a:0.1,b:0.2,c:0.3);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "b");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(b:0.1,(a:0.1,c:0.3):0.1);") {
        return false;
    }
    nh = "(a:0.1,b:0.2,c:0.3);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "c");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(c:0.15,(a:0.1,b:0.2):0.15);") {
        return false;
    }
    nh = "((a1:0.01,a2:0.02)a:0.1,(b1:0.03,b2:0.04)b:0.2,(c1:0.05,c2:0.06)c:0.3)r;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a1");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a1:0.005,(((b1:0.03,b2:0.04)b:0.2,(c1:0.05,c2:0.06)c:0.3)r:0.1,a2:0.02)a:0.005);") {
        return false;
    }
    nh = "((a1:0.01,a2:0.02)a:0.1,(b1:0.03,b2:0.04)b:0.2,(c1:0.05,c2:0.06)c:0.3)r;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a2");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a2:0.01,(a1:0.01,((b1:0.03,b2:0.04)b:0.2,(c1:0.05,c2:0.06)c:0.3)r:0.1)a:0.01);") {
        return false;
    }
    nh = "((a1:0.01,a2:0.02)a:0.1,(b1:0.03,b2:0.04)b:0.2,(c1:0.05,c2:0.06)c:0.3)r;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((a1:0.01,a2:0.02)a:0.05,((b1:0.03,b2:0.04)b:0.2,(c1:0.05,c2:0.06)c:0.3)r:0.05);") {
        return false;
    }


    nh = "((a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a1");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a1:0.05,(((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.4,a2:0.2,a3:0.3)a:0.05);") {
        return false;
    }

    nh = "((a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((a1:0.1,a2:0.2,a3:0.3)a:0.2,((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.2);") {
        return false;
    }

    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a12");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a12:0.001,(a11:0.001,(((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.4,a2:0.2,a3:0.3)a:0.1,a13:0.002)a1:0.001);") {
        return false;
    }


    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a11");
    forester.reRoot(phy, "a12");
    forester.reRoot(phy, "a13");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a13:0.001,((((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.4,a2:0.2,a3:0.3)a:0.1,a11:0.001,a12:0.002)a1:0.001);") {
        return false;
    }

    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.2,((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.2);") {
        return false;
    }

    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a1");
    rr = forester.toNewHampshire(phy);
    if (rr !== "((a11:0.001,a12:0.002,a13:0.002)a1:0.05,(((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.4,a2:0.2,a3:0.3)a:0.05);") {
        return false;
    }


    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a3");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(a3:0.15,((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.4)a:0.15);") {
        return false;
    }

    nh = "(a3:0.15,((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,((b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.4)a:0.15);";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "b1");
    rr = forester.toNewHampshire(phy);
    if (rr !== "(b1:0.25,((((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.8,b2:0.6,b3:0.7)b:0.25);") {
        return false;
    }

    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);

    forester.reRoot(phy, "a3");
    forester.reRoot(phy, "b1");
    rr = forester.toNewHampshire(phy);

    if (rr !== "(b1:0.25,((((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.8,b2:0.6,b3:0.7)b:0.25);") {
        return false;
    }

    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a11");
    forester.reRoot(phy, "a12");
    forester.reRoot(phy, "a13");
    forester.reRoot(phy, "a1");
    forester.reRoot(phy, "a2");
    forester.reRoot(phy, "a3");
    forester.reRoot(phy, "a");
    forester.reRoot(phy, "b1");
    rr = forester.toNewHampshire(phy);

    if (rr !== "(b1:0.25,(((a3:0.3,(a13:0.002,a11:0.001,a12:0.002)a1:0.1,a2:0.2)a:0.4,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.8,b2:0.6,b3:0.7)b:0.25);") {
        return false;
    }

    nh = "(((a11:0.001,a12:0.002,a13:0.002)a1:0.1,a2:0.2,a3:0.3)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(c1:0.9,c2:1.01,c3:1.1)c:1.3,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:0.55;";
    phy = forester.parseNewHampshire(nh);
    forester.reRoot(phy, "a11");
    forester.reRoot(phy, "a12");
    forester.reRoot(phy, "a13");
    forester.reRoot(phy, "a1");
    forester.reRoot(phy, "a2");
    forester.reRoot(phy, "a3");
    forester.reRoot(phy, "a");
    forester.reRoot(phy, "b1");
    forester.reRoot(phy, "c2");
    forester.reRoot(phy, "c");
    rr = forester.toNewHampshire(phy);

    if (rr !== "(c2:0.505,(c1:0.9,((a3:0.3,(a13:0.002,a11:0.001,a12:0.002)a1:0.1,a2:0.2)a:0.4,(b1:0.5,b2:0.6,b3:0.7)b:0.8,(d1:0.11,d2:0.22,d3:0.33)d:0.44)r:1.3,c3:1.1)c:0.505);") {
        return false;
    }

    return true;
}

function testNewHampshire() {
    var nh0 = "";
    var nh1 = "();";
    var nh2 = "(a);";
    var nh3 = "(a:0.000001);";
    var nh4 = "(,);";
    var nh5 = "((a));";
    var nh6 = "(a,b);";
    var nh7 = "((a:0.001,b:0.000001),c:0.1);";
    var nh8 = "((a:0.001,b:0.000001,c:1)abc:0.1,d:0.1);";
    var nh9 = "(((a,b,c),(d,e)),f)r;";
    var nh10 = "((()));";
    var nh11 = "(((,),),);";
    var nh12 = "(((((((((22_MOUSE:0.05998,Apaf-1_HUMAN:0.01825)Euarchontoglires:0.09825,11_CHICK:0.15226):0.02309,16_XENLA:0.4409):0.06584,15_TETNG:0.37438)Euteleostomi:0.28901,((1_BRAFL:0.26131,18_NEMVE:0.38014):0.10709,23_STRPU:0.48179):0.01594):0.22058,(26_STRPU:0.36374,25_STRPU:0.33137)\"Strongylocentrotus purpuratus\":0.34475):0.26168,(CED4_CAEEL:0.13241,31_CAEBR:0.04777)Caenorhabditis:1.31498):0.07466,(((28_DROPS:0.1732,Dark_DROME:0.18863)Sophophora:0.76898,29_AEDAE:0.86398)Diptera:0.24915,30_TRICA:0.97698)Endopterygota:0.13172):0.18105,((((((34_BRAFL:0.093,35_BRAFL:0.08226):0.93134,8_BRAFL:0.58563)\"Branchiostoma floridae\":0.21648,(20_NEMVE:0.71946,21_NEMVE:0.9571)\"Nematostella vectensis\":0.28437):0.09305,9_BRAFL:1.09612):0.54836,((3_BRAFL:0.48766,2_BRAFL:0.65293)\"Branchiostoma floridae\":0.22189,19_NEMVE:0.57144):0.34914):0.15891,((37_BRAFL:0.21133,36_BRAFL:0.16225):0.92214,33_BRAFL:0.8363)\"Branchiostoma floridae\":0.43438):0.18105)Metazoa;";
    var nh13 = "(a,b,c);";
    var nh14 = "((1,2,3)a,(4,5,6)b,(7,8,9)c);";
    var nh15 = '("a a","b b","c c");';
    var nh16 = "('a a','b b','c c');";
    var nh17 = "(((a,b,c)[100],(d,e)[1])[30.000002],f)r[100];";
    var nh18 = "((a:0.001,b:0.000001,c:1)abc:0.1[3.39472],d:0.1):2[1];";
    var nh20 = "((((a,b)ab:3[2],c)[100],(d,e)de[1]):12[30.000002],f)r[100];";
    var nh21 = "((((((a,b)ab[2]:3,c)[100]:12,(d,e)de)abcde:13[2],f):14[0]):0[0])[0]:0;";
    var nh22 = ' ((( (((a[a] , b[12x])ab[2]:3, "c[z]")[+100]: 12,(d, "e")de)ab[]cde:13[2],[z]f):14[0]):0[0])[0]:0;';

    var phy0 = forester.parseNewHampshire(nh0);
    var phy1 = forester.parseNewHampshire(nh1);
    var phy2 = forester.parseNewHampshire(nh2);
    var phy3 = forester.parseNewHampshire(nh3);
    var phy4 = forester.parseNewHampshire(nh4);
    var phy5 = forester.parseNewHampshire(nh5);
    var phy6 = forester.parseNewHampshire(nh6);
    var phy7 = forester.parseNewHampshire(nh7);
    var phy8 = forester.parseNewHampshire(nh8);
    var phy9 = forester.parseNewHampshire(nh9);
    var phy10 = forester.parseNewHampshire(nh10);
    var phy11 = forester.parseNewHampshire(nh11);
    var phy12 = forester.parseNewHampshire(nh12);
    var phy13 = forester.parseNewHampshire(nh13);
    var phy14 = forester.parseNewHampshire(nh14);
    var phy15 = forester.parseNewHampshire(nh15);
    var phy16 = forester.parseNewHampshire(nh16);
    var phy17 = forester.parseNewHampshire(nh17);
    var phy18 = forester.parseNewHampshire(nh18);
    var phy20 = forester.parseNewHampshire(nh20);
    var phy21 = forester.parseNewHampshire(nh21);
    var phy22 = forester.parseNewHampshire(nh22);

    if (forester.toNewHampshire(phy0) !== nh0) {
        return false;
    }
    if (forester.toNewHampshire(phy1) !== nh1) {
        return false;
    }
    if (forester.toNewHampshire(phy2) !== nh2) {
        return false;
    }
    if (forester.toNewHampshire(phy3) !== nh3) {
        return false;
    }
    if (forester.toNewHampshire(phy4) !== nh4) {
        return false;
    }
    if (forester.toNewHampshire(phy5) !== nh5) {
        return false;
    }
    if (forester.toNewHampshire(phy6) !== nh6) {
        return false;
    }
    if (forester.toNewHampshire(phy7) !== nh7) {
        return false;
    }
    if (forester.toNewHampshire(phy8) !== nh8) {
        return false;
    }
    if (forester.toNewHampshire(phy9) !== nh9) {
        return false;
    }
    if (forester.toNewHampshire(phy10) !== nh10) {
        return false;
    }
    if (forester.toNewHampshire(phy11) !== nh11) {
        return false;
    }
    if (forester.toNewHampshire(phy12) !== nh12) {
        return false;
    }
    if (forester.toNewHampshire(phy13) !== nh13) {
        return false;
    }
    if (forester.toNewHampshire(phy14) !== nh14) {
        return false;
    }
    if (forester.toNewHampshire(phy15) !== nh15) {
        return false;
    }
    if (forester.toNewHampshire(phy16, 8, true, true) !== '(a_a,b_b,c_c);') {
        return false;
    }
    if (forester.toNewHampshire(phy16) !== '("a a","b b","c c");') {
        return false;
    }
    if (forester.toNewHampshire(phy17, 8, true, true) !== nh17) {
        return false;
    }
    if (forester.toNewHampshire(phy18, 8, true, true) !== nh18) {
        return false;
    }
    if (forester.toNewHampshire(phy20, 8, true, true) !== nh20) {
        return false;
    }
    var n1 = forester.findByNodeName(phy20, "ab")[0];
    if (n1.confidences[0].value !== 2) {
        return false;
    }
    if (n1.parent.confidences[0].value !== 100) {
        return false;
    }
    var n2 = forester.findByNodeName(phy20, "de")[0];
    if (n2.confidences[0].value !== 1) {
        return false;
    }
    if (n2.parent.confidences[0].value !== 30.000002) {
        return false;
    }
    n2 = forester.findByNodeName(phy20, "r")[0];
    if (n2.confidences[0].value !== 100) {
        return false;
    }
    if (forester.toNewHampshire(phy20, 8, true, true) !== '((((a,b)ab:3[2],c)[100],(d,e)de[1]):12[30.000002],f)r[100];') {
        return false;
    }
    var n4 = forester.findByNodeName(phy21, "ab")[0];
    if (n4.confidences[0].value !== 2) {
        return false;
    }
    if (n4.branch_length !== 3) {
        return false;
    }
    if (n4.parent.confidences[0].value !== 100) {
        return false;
    }
    if (n4.parent.branch_length !== 12) {
        return false;
    }
    var n5 = forester.findByNodeName(phy21, "abcde")[0];
    if (n5.confidences[0].value !== 2) {
        return false;
    }
    if (n5.branch_length !== 13) {
        return false;
    }
    if (n5.parent.confidences[0].value !== 0) {
        return false;
    }
    if (n5.parent.branch_length !== 14) {
        return false;
    }
    if (n5.parent.parent.confidences[0].value !== 0) {
        return false;
    }
    if (n5.parent.parent.branch_length !== 0) {
        return false;
    }
    if (n5.parent.parent.parent.confidences[0].value !== 0) {
        return false;
    }
    if (n5.parent.parent.parent.branch_length !== 0) {
        return false;
    }
    var t21 = '((((((a,b)ab:3[2],c):12[100],(d,e)de)abcde:13[2],f):14[0]):0[0]):0[0];';
    if (forester.toNewHampshire(phy21, 8, true, true) !== t21) {
        return false;
    }
    var t22 = '((((((a,b)ab:3[2],c_z_):12[100],(d,e)de)abcde:13[2],f):14[0]):0[0]):0[0];';
    if (forester.toNewHampshire(phy22, 8, true, true) !== t22) {
        return false;
    }

    var nh30 = "((((((a,b)ab:3[2],c):12[100],(d,e)de)abcde:13[2],f):14[0]):0[0]):0[0];";
    var phy30 = forester.parseNewHampshire(nh30, true);
    if (forester.toNewHampshire(phy30, 8, true, true) !== nh30) {
        return false;
    }

    var nh31 = "((((((aa,bb)ab:3[2],c):12[100],(d,e)de)abcde:13[2],f):14[0]):0[0]):0[0];";
    var phy31 = forester.parseNewHampshire(nh31, true, false);
    if (forester.toNewHampshire(phy31, 8, true, true) !== nh31) {
        return false;
    }

    var nh32 = "((((((aaa,bbb)ab:3[2],c):12[100],(d,e)de)abcde:13[2],f):14[0]):0[0]):0[0];";
    var phy32 = forester.parseNewHampshire(nh32);
    if (forester.toNewHampshire(phy32, 8, true, true) !== nh32) {
        return false;
    }

    var nh33 = "((((((a,b)ab[2]:3,c)[100]:12,(d,e)de)abcde:13[2],f):14[0]):0[0])[0]:0;";
    var phy33 = forester.parseNewHampshire(nh33, false);
    if (forester.toNewHampshire(phy33, 8, true, true) !== "((((((a,b)ab:3,c):12,(d,e)de)abcde:13,f):14):0):0;") {
        return false;
    }

    var nh34 = "((((((aa,bb)ab[2]:3,c)[100]:12,(d,e)de)abcde:13[2],f):14[0]):0[0])[0]:0;";
    var phy34 = forester.parseNewHampshire(nh34, false, true);
    if (forester.toNewHampshire(phy34, 8, true, true) !== "((((((aa,bb)ab:3,c):12,(d,e)de)abcde:13,f):14):0):0;") {
        return false;
    }

    var nh40 = "((((((aaa,bbb)2:3,c)100:12,(d,e)de)2:13,f)0:14)0:0)0.0:0;";
    var phy40 = forester.parseNewHampshire(nh40, false, true);
    if (forester.toNewHampshire(phy40, 8, true, true) !== "((((((aaa,bbb):3[2],c):12[100],(d,e)de):13[2],f):14[0]):0[0]):0[0];") {
        return false;
    }

    var nh41 = "((((((a_a,b_b)2.0:3.5,c)100:12,(d,2:2)de)2:13,f)0:14)0:0)0.0:0;";
    var phy41 = forester.parseNewHampshire(nh41, false, true);
    if (forester.toNewHampshire(phy41, 8, true, true) !== "((((((a_a,b_b):3.5[2],c):12[100],(d,2:2)de):13[2],f):14[0]):0[0]):0[0];") {
        return false;
    }

    var nh42 = "((((((a_a,b_b)2.0:3.5[2],c)100:12,(d[d],2:2)de)2:13,f)0:14)0:0)0.0:0;";
    var phy42 = forester.parseNewHampshire(nh42, false, false);
    if (forester.toNewHampshire(phy42, 8, true, true) !== "((((((a_a,b_b)2.0:3.5,c)100:12,(d,2:2)de)2:13,f)0:14)0:0)0.0:0;") {
        return false;
    }

    return true;
}

function testNewHampshire2() {

    var nh0 = "(\"b\");";
    var nh0r = "(b);";
    var phy0 = forester.parseNewHampshire(nh0);
    if (forester.toNewHampshire(phy0) !== nh0r) {
        console.log(forester.toNewHampshire(phy0));
        return false;
    }

    var nh00 = "(b    '' \"\" ][x);";
    var nh00r = "(b_x);";
    var phy00 = forester.parseNewHampshire(nh00);
    if (forester.toNewHampshire(phy00, 4, true, true) !== nh00r) {
        console.log(forester.toNewHampshire(phy00, 4, true, true));
        return false;
    }

    var nh1 = "(a,\"b\");";
    var nh1r = "(a,b);";
    var phy1 = forester.parseNewHampshire(nh1);
    if (forester.toNewHampshire(phy1) !== nh1r) {
        console.log(forester.toNewHampshire(phy1));
        return false;
    }

    var nh2 = "(a,\"b:,;()q\");";
    var nh2r = "(a,\"b:,;()q\");";
    var phy2 = forester.parseNewHampshire(nh2);
    if (forester.toNewHampshire(phy2) !== nh2r) {
        console.log(forester.toNewHampshire(phy2));
        return false;
    }

    var nh3 = '(A,x"y)z",e);';
    var nh3r = '(A,"xy)z",e);';
    var phy3 = forester.parseNewHampshire(nh3);
    if (forester.toNewHampshire(phy3) !== nh3r) {
        console.log(forester.toNewHampshire(phy3));
        return false;
    }

    var nh4 = '(a,"x)y"z,e);';
    var nh4r = '(a,"x)yz",e);';
    var phy4 = forester.parseNewHampshire(nh4);
    if (forester.toNewHampshire(phy4) !== nh4r) {
        console.log(forester.toNewHampshire(phy4));
        return false;
    }


    var nh100 = "('b');";
    var nh100r = "(b);";
    var phy100 = forester.parseNewHampshire(nh100);
    if (forester.toNewHampshire(phy100) !== nh100r) {
        console.log(forester.toNewHampshire(phy100));
        return false;
    }

    var nh101 = "(a a,'b');";
    var nh101r = "(aa,b);";
    var phy101 = forester.parseNewHampshire(nh101);
    if (forester.toNewHampshire(phy101) !== nh101r) {
        console.log(forester.toNewHampshire(phy101));
        return false;
    }

    var nh102 = " ( a     a     , '  b  :  , ; (   )           q          ');";
    var nh102r = "(aa,\" b : , ; ( ) q \");";
    var phy102 = forester.parseNewHampshire(nh102);
    if (forester.toNewHampshire(phy102) !== nh102r) {
        console.log(forester.toNewHampshire(phy102));
        return false;
    }

    var nh103 = '(A,x \'  y)z \', e) ;';
    var nh103r = '(A,"x y)z ",e);';
    var phy103 = forester.parseNewHampshire(nh103);
    if (forester.toNewHampshire(phy103) !== nh103r) {
        console.log(forester.toNewHampshire(phy103));
        return false;
    }

    var nh104 = ' ( a , \'  x)y  \' z , e ) ; ';
    var nh104r = '(a," x)y z",e);';
    var phy104 = forester.parseNewHampshire(nh104);
    if (forester.toNewHampshire(phy104) !== nh104r) {
        console.log(forester.toNewHampshire(phy104));
        return false;
    }

    var nh204 = '(a,\'x")y\'z,e);';
    var nh204r = '(a,\'x")yz\',e);';
    var phy204 = forester.parseNewHampshire(nh204);
    if (forester.toNewHampshire(phy204) !== nh204r) {
        console.log(forester.toNewHampshire(phy204));
        return false;
    }

    var nh205 = '(a,\'x")"y\'z,e);';
    var nh205r = '(a,\'x")"yz\',e);';
    var phy205 = forester.parseNewHampshire(nh205);
    if (forester.toNewHampshire(phy205) !== nh205r) {
        console.log(forester.toNewHampshire(phy205));
        return false;
    }

    var nh304 = '(a,"x\')y"z,e);';
    var nh304r = '(a,"x\')yz",e);';
    var phy304 = forester.parseNewHampshire(nh304);
    if (forester.toNewHampshire(phy304) !== nh304r) {
        console.log(forester.toNewHampshire(phy304));
        return false;
    }

    var nh305 = '(a,"x\')\'y"z,e);';
    var nh305r = '(a,"x\')\'yz",e);';
    var phy305 = forester.parseNewHampshire(nh305);
    if (forester.toNewHampshire(phy305) !== nh305r) {
        console.log(forester.toNewHampshire(phy305));
        return false;
    }

    var nh405 = '(a,Qq"x\')\'y"zZ,e);';
    var nh405r = '(a,"Qqx\')\'yzZ",e);';
    var phy405 = forester.parseNewHampshire(nh405);
    if (forester.toNewHampshire(phy405) !== nh405r) {
        console.log(forester.toNewHampshire(phy405));
        return false;
    }

    var nh406 = '(a,Qq"x\')\'y"zZ,1\'e\'2,1\'q"  "     "\'2,1"q\'  \'       \'"2);';
    var nh406r = '(a,"Qqx\')\'yzZ",1e2,\'1q" " "2\',"1q\' \' \'2");';
    var phy406 = forester.parseNewHampshire(nh406);
    if (forester.toNewHampshire(phy406) !== nh406r) {
        console.log(forester.toNewHampshire(phy406));
        return false;
    }


    var nh502 = '(a,b)" a : b " [ 78. 01 0 ];';
    var nh502r = '(a,b)" a : b "[78.01];';
    var phy502 = forester.parseNewHampshire(nh502);
    if (forester.toNewHampshire(phy502, 8, false, true) !== nh502r) {
        console.log(forester.toNewHampshire(phy502, 8, false, true));
        return false;
    }

    var nh501 = '((((("a" : 1,"b,\'":2)A\'a, :)b\'B:3[99.0] , (\'c[C C]\',"d")c":"d[12.0])"abc:d"[78.0] ,((e:2,f,g,"I would (be), illegal;")e\'\'fg[23.0],h)[12.0])"A:x":12[99.0],i),j\'(\')"r\'";';
    var nh501r = '(((((a:1,"b,\'":2)"Aa, :)bB":3[99],("c[C C]",d)"c:d"[12])"abc:d"[78],((e:2,f,g,"I would (be), illegal;")efg[23],h)[12])"A:x":12[99],i),"j(")"r\'";';
    var phy501 = forester.parseNewHampshire(nh501);
    var phy501nh = forester.toNewHampshire(phy501, 8, false, true);
    if (phy501nh !== nh501r) {
        console.log(phy501nh);
        console.log(nh501r);
        return false;
    }
    var phy501nhp = forester.parseNewHampshire(phy501nh);
    var phy501nhnh = forester.toNewHampshire(phy501nhp, 8, false, true);
    if (phy501nh !== phy501nhnh) {
        return false;
    }
    return true;
}

function testNewHampshire3() {

    var nh0 = "(a,b[&comment]);";
    var nh0r = "(a,b);";
    var phy0 = forester.parseNewHampshire(nh0);
    if (forester.toNewHampshire(phy0) !== nh0r) {
        console.log(forester.toNewHampshire(phy0));
        return false;
    }

    var nh1 = "((a:1,b:2[&comment]):4,c:3);";
    var nh1r = "((a:1,b:2):4,c:3);";
    var phy1 = forester.parseNewHampshire(nh1);
    if (forester.toNewHampshire(phy1) !== nh1r) {
        console.log(forester.toNewHampshire(phy1));
        return false;
    }

    var nh2 = "((a:1,b:2[&comment(,:]):4,c:3);";
    var nh2r = "((a:1,b:2):4,c:3);";
    var phy2 = forester.parseNewHampshire(nh2);
    if (forester.toNewHampshire(phy2) !== nh2r) {
        console.log(forester.toNewHampshire(phy2));
        return false;
    }

    var nh3 = "([ & comment(,:](a:1[&comment(,:]1,b:22 [    &comment(,: ] ):4[&comment(,:]4,c[&comment(,:]:3[&comment(,:]3);";
    var nh3r = "((a:11,b:22):44,c:33);";
    var phy3 = forester.parseNewHampshire(nh3);
    if (forester.toNewHampshire(phy3) !== nh3r) {
        console.log(forester.toNewHampshire(phy3));
        return false;
    }

    return true;
}

function testDeleteSubtree() {
    var p = forester.parseNewHampshire("((((a,b,c)abc,(c,d,e)cde),x,y,z),R)r");

    forester.deleteSubtree(p, forester.findByNodeName(p, "a")[0]);
    forester.deleteSubtree(p, forester.findByNodeName(p, "e")[0]);
    forester.deleteSubtree(p, forester.findByNodeName(p, "x")[0]);
    var x1 = forester.toNewHampshire(p, 8, false, true);
    if (x1 !== "((((b,c)abc,(c,d)cde),y,z),R)r;") {
        return false;
    }
    forester.deleteSubtree(p, forester.findByNodeName(p, "abc")[0]);
    forester.deleteSubtree(p, forester.findByNodeName(p, "d")[0]);
    forester.deleteSubtree(p, forester.findByNodeName(p, "c")[0]);
    forester.deleteSubtree(p, forester.findByNodeName(p, "y")[0]);
    var x2 = forester.toNewHampshire(p, 8, false, true);
    if (x2 !== "(z,R)r;") {
        return false;
    }

    var p2 = forester.parseNewHampshire("(((a:3.1,b:2.1):1.1,c),(d,e))");
    forester.deleteSubtree(p2, forester.findByNodeName(p2, "a")[0]);
    var x3 = forester.toNewHampshire(p2, 8, false, true);
    if (x3 !== "((b:3.2,c),(d,e));") {
        return false;
    }

    var p3 = forester.parseNewHampshire("(((a:3.1,b:2.1),c),(d,e))");
    forester.deleteSubtree(p3, forester.findByNodeName(p3, "a")[0]);
    var x4 = forester.toNewHampshire(p3, 8, false, true);
    if (x4 !== "((b:2.1,c),(d,e));") {
        return false;
    }

    return true;
}


// A Nexus file exercising the parser's whole surface: taxa block, an
// INTERLEAVED protein matrix with a MATCHCHAR, a quoted label with a space,
// a matrix id capitalized differently from its tree tip, a multi-line
// comment inside the matrix, a translate table, [&R] rootedness, a quoted
// tree name, and a second tree in the same block.
function makeTestNexus() {
    return [
        "#NEXUS",
        "Begin Taxa;",
        " Dimensions NTax=4;",
        " TaxLabels Homo_sapiens 'Mus musculus' Rattus Gallus;",
        "End;",
        "Begin Characters;",
        " Dimensions NTax=4 NChar=20;",
        " Format DataType=protein Missing=? Gap=- MatchChar=.;",
        " Matrix",
        "  [a comment",
        "   spanning lines]",
        "  Homo_sapiens    MKVL-AT-QW",
        "  'Mus musculus'  .R........",
        "  RATTUS          ..I.......",
        "  Gallus          M.--......",
        "  Homo_sapiens    ACDEFGHIKL",
        "  'Mus musculus'  ..........",
        "  RATTUS          .....W....",
        "  Gallus          ....Y.....",
        " ;",
        "End;",
        "Begin Trees;",
        " Translate",
        "  1 Homo_sapiens,",
        "  2 'Mus musculus',",
        "  3 Rattus,",
        "  4 Gallus;",
        " Tree 'my tree'=[&R]((1:0.1,2:0.2):0.3,(3:0.4,4:0.5):0.6);",
        " Tree second=[&U](1:1,(2:2,3:3):1);",
        "End;",
        ""
    ].join("\n");
}

function testNexusParse() {
    var trees = forester.parseNexus(makeTestNexus());
    if (trees.length !== 2) {
        return false;
    }
    var phy = trees[0];
    if (phy.name !== "my tree" || phy.rooted !== true) {
        return false;
    }
    if (trees[1].name !== "second" || trees[1].rooted !== false) {
        return false;
    }
    if (forester.toNewHampshire(phy) !==
        '((Homo_sapiens:0.1,"Mus musculus":0.2):0.3,(Rattus:0.4,Gallus:0.5):0.6);') {
        console.log(forester.toNewHampshire(phy));
        return false;
    }
    // the interleaved blocks concatenated, the '.' matchchars resolved
    // against the first (reference) row, and each row joined to its tip
    // through the canonical key ("RATTUS" -> "Rattus", quotes/underscores)
    var expected = {
        "Homo_sapiens": "MKVL-AT-QWACDEFGHIKL",
        "Mus musculus": "MRVL-AT-QWACDEFGHIKL",
        "Rattus": "MKIL-AT-QWACDEFWHIKL",
        "Gallus": "MK---AT-QWACDEYGHIKL"
    };
    var ext = forester.getAllExternalNodes(phy);
    if (ext.length !== 4) {
        return false;
    }
    for (var i = 0; i < ext.length; ++i) {
        var n = ext[i];
        if (!n.sequences || n.sequences.length !== 1) {
            return false;
        }
        var s = n.sequences[0];
        if (s.type !== "protein" || !s.mol_seq || s.mol_seq.is_aligned !== true
            || s.mol_seq.value !== expected[n.name]) {
            console.log(n.name + ": " + (s.mol_seq ? s.mol_seq.value : "no mol_seq"));
            return false;
        }
    }
    return true;
}

function testNexusRoundTrip() {
    var phy = forester.parseNexus(makeTestNexus())[0];
    var nex = forester.toNexus(phy);
    // the #NEXUS header must be the FIRST line: jebl happens to tolerate
    // its absence, but the standard mandates it and PAUP/MrBayes refuse
    // a file without it
    if (nex.indexOf("#NEXUS\n") !== 0) {
        return false;
    }
    // NChar only -- an NTax here makes strict readers (jebl, and so
    // AliView) reject the whole file
    if (nex.indexOf(" Dimensions NChar=20;") < 0 || /Characters;\n[^\n]*NTax/.test(nex)) {
        return false;
    }
    var back = forester.parseNexus(nex)[0];
    if (back.name !== phy.name || back.rooted !== true) {
        return false;
    }
    // toNexus writes safe-character labels ('Mus musculus' becomes
    // Mus_musculus) -- in Nexus '_' and ' ' are the same character, so the
    // round trip is compared through that same replacement
    if (forester.toNewHampshire(back) !== forester.toNewHampshire(phy, 0, true)) {
        console.log(forester.toNewHampshire(back));
        return false;
    }
    var a = forester.getAllExternalNodes(phy);
    var b = forester.getAllExternalNodes(back);
    if (a.length !== b.length) {
        return false;
    }
    for (var i = 0; i < a.length; ++i) {
        if (b[i].name !== a[i].name.replace(/ /g, "_")
            || !b[i].sequences || b[i].sequences.length !== 1
            || b[i].sequences[0].type !== "protein"
            || b[i].sequences[0].mol_seq.value !== a[i].sequences[0].mol_seq.value) {
            return false;
        }
    }
    // a tree without sequences must come back without a characters block
    var bare = forester.parseNewHampshire("((a:1,b:2):3,c:4);");
    var bareNex = forester.toNexus(bare);
    if (bareNex.indexOf("Characters") > -1) {
        return false;
    }
    if (forester.toNewHampshire(forester.parseNexus(bareNex)[0]) !== "((a:1,b:2):3,c:4);") {
        return false;
    }
    return true;
}

function testAuspiceJson() {
    var doc = {
        version: "v2",
        meta: {title: "Test Build"},
        tree: {
            name: "root",
            node_attrs: {
                div: 0,
                num_date: {value: 2020.0, confidence: [2019.8, 2020.1]},
                country: {value: "China", confidence: {"China": 0.8, "Korea, Republic of": 0.2}}
            },
            branch_attrs: {labels: {clade: "20A"}},
            children: [
                {
                    name: "tipA",
                    node_attrs: {
                        div: 0.001,
                        num_date: {value: 2020.5, confidence: [2020.4, 2020.6]},
                        country: {value: "China"},
                        accession: "AB123"
                    }
                },
                {
                    name: "tipB",
                    node_attrs: {div: 0.004, num_date: {value: 2021.0}, country: {value: "Japan"}}
                }
            ]
        }
    };
    var phy = forester.parseAuspiceJson(JSON.stringify(doc));
    if (phy.name !== "Test Build" || phy.rooted !== true) {
        return false;
    }
    var root = forester.getTreeRoot(phy);
    // internal node: date with the confidence interval; time branch lengths
    if (!root.date || root.date.value !== 2020.0 || root.date.minimum !== 2019.8
        || root.date.maximum !== 2020.1 || root.date.unit !== "year") {
        return false;
    }
    var a = forester.findByNodeName(phy, "tipA")[0];
    var b = forester.findByNodeName(phy, "tipB")[0];
    // a TIP keeps its point date but the interval is dropped
    if (!a.date || a.date.value !== 2020.5 || a.date.minimum !== undefined) {
        return false;
    }
    if (Math.abs(a.branch_length - 0.5) > 1e-9 || Math.abs(b.branch_length - 1.0) > 1e-9) {
        return false;
    }
    function prop(n, ref) {
        var hits = (n.properties || []).filter(function (p) {
            return p.ref === "nextstrain:" + ref;
        });
        return hits.length === 1 ? hits[0] : null;
    }
    if (!prop(a, "country") || prop(a, "country").value !== "China"
        || !prop(a, "accession") || prop(a, "accession").value !== "AB123"
        || prop(a, "div").value !== "0.001"
        || prop(a, "div").datatype !== "xsd:decimal"
        || prop(a, "country").datatype !== "xsd:string"
        || prop(root, "clade_label").value !== "20A") {
        return false;
    }
    // trait confidence -> quoted _set / _set_prob brace pair
    if (prop(root, "country_set").value !== '{"China","Korea, Republic of"}'
        || prop(root, "country_set_prob").value !== "{0.8,0.2}") {
        return false;
    }
    // the time<->divergence toggle: different lengths, fully reversible
    forester.applyDivergenceBranchLengths(phy);
    if (Math.abs(a.branch_length - 0.001) > 1e-12 || Math.abs(b.branch_length - 0.004) > 1e-12) {
        return false;
    }
    forester.applyTimeBranchLengths(phy);
    if (Math.abs(a.branch_length - 0.5) > 1e-9) {
        return false;
    }
    if (forester.hasTimeAndDivergence(phy) !== true) {
        return false;
    }
    // a divergence-only build (no num_date anywhere) falls back to div deltas
    var divOnly = forester.parseAuspiceJson(JSON.stringify({
        version: "v2",
        tree: {
            name: "r", node_attrs: {div: 0},
            children: [{name: "x", node_attrs: {div: 0.02}}, {name: "y", node_attrs: {div: 0.05}}]
        }
    }));
    var x = forester.findByNodeName(divOnly, "x")[0];
    if (Math.abs(x.branch_length - 0.02) > 1e-12 || forester.hasTimeAndDivergence(divOnly)) {
        return false;
    }
    // not-Auspice input throws
    var threw = false;
    try {
        forester.parseAuspiceJson('{"version":"v1"}');
    } catch {
        threw = true;
    }
    return threw;
}

// BEAST-style [&key=value] and NHX [&&NHX:...] annotations, always parsed:
// posterior/prob/bootstrap -> confidences, heights + HPD -> node dates,
// FigTree !color -> branch color, everything else -> beast:* properties;
// quoted values keep their commas, and a BEAST2 rate between the ':' and
// the branch length must not break length parsing.
function testExtendedNewickAnnotations() {
    var phy = forester.parseNewHampshire(
        '((a[&location="Hong Kong, China",rate=1.2E-3]:0.1,' +
        'b[&&NHX:S=Homo sapiens:B=95:D=Y]:[&rate=0.002]0.2)' +
        '[&posterior=0.99,height=1.2,height_95%_HPD={0.95,1.5}]:0.9,' +
        'c[&prob=0.97,prob_stddev=0.01]:0.3,' +
        'd[&!color=#ff8000]:0.4);');
    var a = forester.findByNodeName(phy, "a")[0];
    var b = forester.findByNodeName(phy, "b")[0];
    var c = forester.findByNodeName(phy, "c")[0];
    var d = forester.findByNodeName(phy, "d")[0];
    var anc = a.parent;
    function prop(n, ref) {
        var hits = (n.properties || []).filter(function (p) {
            return p.ref === ref;
        });
        return hits.length === 1 ? hits[0].value : null;
    }
    if (prop(a, "beast:location") !== "Hong Kong, China"
        || prop(a, "beast:rate") !== "1.2E-3" || a.branch_length !== 0.1) {
        return false;
    }
    if (!b.taxonomies || b.taxonomies[0].scientific_name !== "Homo sapiens"
        || !b.confidences || b.confidences[0].type !== "bootstrap"
        || b.confidences[0].value !== 95
        || !b.events || b.events.duplications !== 1
        || prop(b, "beast:rate") !== "0.002" || b.branch_length !== 0.2) {
        return false;
    }
    if (!anc.confidences || anc.confidences[0].type !== "posterior"
        || anc.confidences[0].value !== 0.99
        || !anc.date || anc.date.value !== 1.2
        || anc.date.minimum !== 0.95 || anc.date.maximum !== 1.5
        || anc.branch_length !== 0.9) {
        return false;
    }
    if (!c.confidences || c.confidences[0].type !== "posterior probability"
        || c.confidences[0].value !== 0.97 || c.confidences[0].stddev !== 0.01) {
        return false;
    }
    if (!d.color || d.color.red !== 255 || d.color.green !== 128 || d.color.blue !== 0) {
        return false;
    }
    // an annotation-free tree with [95] bracket confidences is untouched
    var plain = forester.parseNewHampshire("((a:1,b:2)[95]:3,c:4);");
    var pa = forester.findByNodeName(plain, "a")[0];
    if (pa.parent.confidences[0].value !== 95) {
        return false;
    }
    // height_median beats height; height_range is the HPD fallback
    var m = forester.parseNewHampshire(
        "(x[&height=9,height_median=2.5,height_range={2,3}]:1,y:1);");
    var xd = forester.findByNodeName(m, "x")[0].date;
    return xd.value === 2.5 && xd.minimum === 2 && xd.maximum === 3;
}

// Nexus dialect variants the parser must keep accepting: a DATA block (not
// CHARACTERS) with a sequential dna matrix, a CHARLABELS sub-command whose
// ';' must NOT end the block, numeric tips mapped through TAXLABELS (no
// translate table), a tree statement spanning lines, UTREE, ENDBLOCK, a
// block TITLE combined with the tree name, an rna matrix, and a second
// data block replacing (not contaminating) the first.
function testNexusParserVariants() {
    var trees = forester.parseNexus([
        "#NEXUS",
        "Begin Taxa;",
        " TaxLabels Alpha Beta Gamma;",
        "Endblock;",
        "Begin Data;",
        " Dimensions NTax=3 NChar=6;",
        " CharLabels one two three four five six;",
        " Format DataType=dna Gap=- Missing=?;",
        " Matrix",
        "  Alpha ACG-TA",
        "  Beta  ACGCTA",
        "  Gamma A?GCTA",
        " ;",
        "End;",
        "Begin Trees;",
        " Title My_Trees;",
        " Tree t1=(1:1,(2:1,",
        " 3:1):1);",
        " UTree t2=(Alpha:1,Beta:2);",
        "End;"
    ].join("\n"));
    if (trees.length !== 2) {
        return false;
    }
    var phy = trees[0];
    // numeric tips 1/2/3 resolved through TAXLABELS; block title + tree name
    if (phy.name !== "My Trees (t1)") {
        return false;
    }
    var alpha = forester.findByNodeName(phy, "Alpha")[0];
    var gamma = forester.findByNodeName(phy, "Gamma")[0];
    if (!alpha || !gamma
        || alpha.sequences[0].mol_seq.value !== "ACG-TA"
        || alpha.sequences[0].type !== "dna"
        || gamma.sequences[0].mol_seq.value !== "A?GCTA") {
        return false;
    }
    if (trees[1].name !== "My Trees (t2)") {
        return false;
    }
    // an rna DATA block; and with TWO data blocks, the second replaces the
    // first instead of cross-contaminating it
    var t2 = forester.parseNexus([
        "#NEXUS",
        "Begin Data;",
        " Format DataType=rna;",
        " Matrix x1 AAAA;",
        "End;",
        "Begin Data;",
        " Format DataType=rna;",
        " Matrix x1 ACGU;",
        "End;",
        "Begin Trees;",
        " Tree t=(x1:1,x2:1);",
        "End;"
    ].join("\n"))[0];
    var x1 = forester.findByNodeName(t2, "x1")[0];
    if (x1.sequences[0].mol_seq.value !== "ACGU" || x1.sequences[0].type !== "rna") {
        return false;
    }
    // input is LENIENT where output is strict: a HEADERLESS file still
    // parses (the desktop and jebl tolerate the same; only the writer is
    // required to emit #NEXUS)
    var headerless = forester.parseNexus("Begin Trees;\n Tree h=(p:1,q:2);\nEnd;\n");
    return headerless.length === 1
        && forester.getAllExternalNodes(headerless[0]).length === 2;
}

// A TreeAnnotator-style MCC file -- Nexus container, translate table, a
// BEAST blob on every node -- is THE phylodynamics input format and must
// never regress: tips renamed, rates as beast: properties, posteriors as
// confidences, heights + HPD as node dates, [&R] as rootedness.
function testNexusBeastMcc() {
    var phy = forester.parseNexus([
        "#NEXUS",
        "Begin Taxa;",
        " Dimensions NTax=3;",
        " TaxLabels virusA virusB virusC;",
        "End;",
        "Begin Trees;",
        " Translate",
        "  1 virusA,",
        "  2 virusB,",
        "  3 virusC;",
        " Tree TREE1 = [&R] ((1[&rate=0.001]:0.1,2[&rate=0.002]:0.15)" +
        "[&posterior=0.98,height=0.2,height_95%_HPD={0.15,0.3}]:0.05," +
        "3[&rate=0.0015]:0.25);",
        "End;"
    ].join("\n"))[0];
    if (phy.rooted !== true || phy.name !== "TREE1") {
        return false;
    }
    // the posterior scale is detectable: the largest confidence is <= 1
    if (forester.collectBasicTreeProperties(phy).maxConfidence !== 0.98) {
        return false;
    }
    var a = forester.findByNodeName(phy, "virusA")[0];
    var c = forester.findByNodeName(phy, "virusC")[0];
    if (!a || !c
        || a.properties[0].ref !== "beast:rate" || a.properties[0].value !== "0.001"
        || c.properties[0].value !== "0.0015"
        || a.branch_length !== 0.1) {
        return false;
    }
    var anc = a.parent;
    return anc.confidences[0].type === "posterior" && anc.confidences[0].value === 0.98
        && anc.date.value === 0.2 && anc.date.minimum === 0.15 && anc.date.maximum === 0.3
        && anc.branch_length === 0.05;
}

// The writer's fallbacks: a nameless tip labelled from its taxonomy, from
// its sequence, or as nodeN; the datatype judged from the residues when the
// sequences carry no declared type (dna vs protein); [&U] for an unrooted
// tree and "tree1" for a nameless one.
function testNexusWriterFallbacks() {
    var phy = forester.parseNewHampshire("(a:1,b:1,c:1);");
    var tips = forester.getAllExternalNodes(phy);
    tips.forEach(function (n) {
        var keep = n.name;
        delete n.name;
        if (keep === "a") {
            n.taxonomies = [{code: "HUMAN9"}];
        } else if (keep === "b") {
            n.sequences = [{name: "seqX9", mol_seq: {is_aligned: true, value: "ACGT-ACG"}}];
        }
    });
    phy.rooted = false;
    var nex = forester.toNexus(phy);
    if (nex.indexOf("HUMAN9") < 0 || nex.indexOf("seqX9") < 0 || !/node\d/.test(nex)
        || nex.indexOf("[&U]") < 0 || nex.indexOf(" Tree tree1=") < 0
        || nex.indexOf("DataType=dna") < 0) {  // ACGT-ACG, no declared type
        return false;
    }
    var back = forester.parseNexus(nex)[0];
    if (back.rooted !== false) {
        return false;
    }
    var bx = forester.findByNodeName(back, "seqX9")[0];
    if (!bx || bx.sequences[0].mol_seq.value !== "ACGT-ACG") {
        return false;
    }
    // protein residues without a declared type judge as protein
    var p2 = forester.parseNewHampshire("(x:1,y:1);");
    forester.getAllExternalNodes(p2).forEach(function (n) {
        n.sequences = [{mol_seq: {is_aligned: true, value: "MKVLEQW-"}}];
    });
    return forester.toNexus(p2).indexOf("DataType=protein") > -1;
}

// The rest of the annotation surface: bootstrap= and date= and height_range,
// a {}-set value kept whole with its key sanitized (rate_95%_HPD ->
// beast:rate_95_HPD), the remaining NHX tags (T=/GN=/AC=/C=/D=N/D=?), a
// root-node blob, and a blob inside a quoted label staying label text.
function testBeastAnnotationsMore() {
    var phy = forester.parseNewHampshire(
        '((a[&bootstrap=87]:1,b[&date=2021-03-04,height_range={1,2}]:1)' +
        '[&location.set={"HongKong","Beijing"},rate_95%_HPD={0.001,0.003}]:1,' +
        'c[&&NHX:T=9606:GN=HBB:AC=P68871:C=a note:D=N]:1,' +
        'd[&&NHX:D=?]:1)r[&posterior=0.5];');
    var a = forester.findByNodeName(phy, "a")[0];
    var b = forester.findByNodeName(phy, "b")[0];
    var c = forester.findByNodeName(phy, "c")[0];
    var d = forester.findByNodeName(phy, "d")[0];
    var r = forester.findByNodeName(phy, "r")[0];
    function prop(n, ref) {
        var hits = (n.properties || []).filter(function (p) {
            return p.ref === ref;
        });
        return hits.length === 1 ? hits[0].value : null;
    }
    if (!a.confidences || a.confidences[0].type !== "bootstrap" || a.confidences[0].value !== 87) {
        return false;
    }
    if (!b.date || b.date.desc !== "2021-03-04" || b.date.minimum !== 1 || b.date.maximum !== 2) {
        return false;
    }
    var anc = a.parent;
    if (prop(anc, "beast:location_set") !== '{"HongKong","Beijing"}'
        || prop(anc, "beast:rate_95_HPD") !== "{0.001,0.003}") {
        return false;
    }
    if (!c.taxonomies || !c.taxonomies[0].id || c.taxonomies[0].id.value !== "9606"
        || c.sequences[0].name !== "HBB"
        || c.sequences[0].accession.value !== "P68871"
        || prop(c, "nh:comment") !== "a note"
        || !c.events || c.events.speciations !== 1) {
        return false;
    }
    if (!d.events || d.events.type !== "speciation_or_duplication") {
        return false;
    }
    if (r.name !== "r" || !r.confidences || r.confidences[0].value !== 0.5) {
        return false;
    }
    // a bracket inside a QUOTED label is label text, never an annotation
    var q = forester.parseNewHampshire('("ab[&x=1]cd":1,e:2);');
    var qa = forester.getAllExternalNodes(q)[0];
    var qn = forester.findByNodeName(q, "ab[&x=1]cd")[0];
    return !!qn && !qn.properties && qa.branch_length !== undefined;
}

// Auspice edge cases: an already-parsed object as input, a tiny divergence
// rendered without scientific notation, a node missing num_date breaking
// the delta chain to 0 (never a stale length), and a negative delta
// clamping to 0.
function testAuspiceMore() {
    var phy = forester.parseAuspiceJson({
        version: "v2",
        tree: {
            name: "root",
            node_attrs: {num_date: {value: 2020.0}, div: 0},
            children: [
                {
                    name: "undated",
                    node_attrs: {div: 1e-7},
                    children: [
                        {name: "late", node_attrs: {num_date: {value: 2021.0}}}
                    ]
                },
                {name: "early", node_attrs: {num_date: {value: 2019.5}}}
            ]
        }
    });
    var undated = forester.findByNodeName(phy, "undated")[0];
    var late = forester.findByNodeName(phy, "late")[0];
    var early = forester.findByNodeName(phy, "early")[0];
    // no sci-notation in the property value
    var divProp = undated.properties.filter(function (p) {
        return p.ref === "nextstrain:div";
    })[0];
    if (divProp.value !== "0.0000001") {
        return false;
    }
    // undated node: its own length AND its child's fall back to 0 (the
    // parent metric is unknown), never to a stale or negative value
    if (undated.branch_length !== 0 || late.branch_length !== 0) {
        return false;
    }
    // a tip older than its parent clamps to 0, not -0.5
    return early.branch_length === 0;
}

// forester.ladderize: sorts a node's children by clade size at ANY child
// count, not just 2 -- a bifurcation and a polytomy (a phylodynamic tree's
// internal node commonly carries 3+ children, e.g. an Auspice build) must
// both come out correctly ordered. Ties keep their relative order (stable),
// so a node needing no change is left untouched; the return value reports
// whether anything actually changed, which is what the button's
// alternate-on-no-change behavior relies on.
function testLadderize() {
    // a 2-child node (the historical case) still swaps
    var pair = forester.parseNewHampshire("((a,b),(c,d,e));");
    var changed = forester.ladderize(forester.getTreeRoot(pair), true);
    if (!changed || forester.getTreeRoot(pair).children[0].children.length !== 3) {
        return false;
    }
    // a polytomy (3+ children) sorts by clade size too, not just skipped
    var poly = forester.parseNewHampshire("((a,b,c),(d,e),f,(g,h,i,j));");
    forester.ladderize(forester.getTreeRoot(poly), true);
    var sizes = forester.getTreeRoot(poly).children.map(function (c) {
        return forester.calcSumOfAllExternalDescendants(c);
    });
    if (sizes.join(",") !== "4,3,2,1") {
        return false;
    }
    // smallest-first is the mirror order
    var polyAsc = forester.parseNewHampshire("((a,b,c),(d,e),f,(g,h,i,j));");
    forester.ladderize(forester.getTreeRoot(polyAsc), false);
    var sizesAsc = forester.getTreeRoot(polyAsc).children.map(function (c) {
        return forester.calcSumOfAllExternalDescendants(c);
    });
    if (sizesAsc.join(",") !== "1,2,3,4") {
        return false;
    }
    // ties are STABLE: three same-size children keep their original order.
    // (Direct .children access, not getAllExternalNodes -- its underlying
    // preOrderTraversalAll walks children in REVERSE index order, an
    // unrelated forester.js quirk that would make this check read backwards.)
    function label(c) {
        return c.children ? c.children.map(label).join("") : c.name;
    }
    var tied = forester.parseNewHampshire("((x),(y),(z),(w,v));");
    forester.ladderize(forester.getTreeRoot(tied), true);
    var namesAfter = forester.getTreeRoot(tied).children.map(label);
    // the 2-tip clade moves to the front; x/y/z (all size 1) keep their order
    if (namesAfter.join(",") !== "wv,x,y,z") {
        return false;
    }
    // a node already correctly ordered reports no change
    var already = forester.parseNewHampshire("((a,b,c),(d,e));");
    forester.ladderize(forester.getTreeRoot(already), true);
    if (forester.ladderize(forester.getTreeRoot(already), true) !== false) {
        return false;
    }
    // a leaf and a node with one child are no-ops, not errors
    var leaf = forester.parseNewHampshire("(a,b);");
    return forester.ladderize(forester.findByNodeName(leaf, "a")[0], true) === false;
}
