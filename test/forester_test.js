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

runTest("single-node tree          : ", testSingleNodeTree);
runTest("basic tree properties     : ", testBasicTreeProperties);
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
runTest("one label chain, both forms: ", testOneLabelChainForBothWriters);
runTest("Nexus sequences, joint      : ", testNexusMolecularSequences);
runTest("Nexus missing rows          : ", testNexusMissingRows);
runTest("Nexus label collisions      : ", testNexusLabelCollisions);
runTest("Nexus matrix datatype       : ", testNexusMatrixDatatype);
runTest("describeValues              : ", testDescribeValues);
runTest("tree statistics             : ", testTreeStatistics);
runTest("label occupancy             : ", testLabelOccupancy);
runTest("preorder claim order        : ", testPreorderOf);
runTest("phyloXML -> Nexus -> phyloXML: ", testPhyloXmlNexusPhyloXmlRoundTrip);
runTest("Nexus -> phyloXML -> Nexus  : ", testNexusPhyloXmlNexusRoundTrip);
runTest("vendored phyloxml copies  : ", testVendoredPhyloXmlCopiesAgree);
runTest("BEAST/NHX annotations 2    : ", testBeastAnnotationsMore);
runTest("TreeTime output            : ", testTreeTimeOutput);
runTest("Auspice edge cases         : ", testAuspiceMore);
runTest("quotes inside a [&...] blob: ", testBlobQuotes);
runTest("Auspice Nexus vocabulary   : ", testAuspiceNexusVocabulary);
runTest("num_date, time-scaled only : ", testNumDateOnlyOnTimeScaledTrees);
runTest("uninformative date pairs   : ", testUninformativeDatePairs);
runTest("a number is a plain decimal: ", testNumberGrammar);
runTest("NHX tag: quotes/space noise: ", testNhxTagNoise);
runTest("TAXLABELS colour = label   : ", testTaxlabelColours);
runTest("Ladderize (n-ary)          : ", testLadderize);
runTest("Nexus quoted labels        : ", testNexusQuotedLabels);
runTest("Nexus numeric tips         : ", testNexusNumericTips);
runTest("Common name prefix         : ", testCommonNamePrefix);
runTest("Nexus un-doubling          : ", testNexusUnquoting);
runTest("phyloXML foreign namespace : ", testPhyloXmlForeignNamespace);
runTest("label quoting on write    : ", testLabelQuotingOnWrite);
runTest("scale bar length          : ", testScaleBarLength);
runTest("multi-tree New Hampshire  : ", testMultiTreeNewHampshire);
runTest("reRoot at a node          : ", testReRootAtNode);
runTest("MAD rooting exact cases   : ", testMadRootExactCases);
runTest("MAD branch values         : ", testMadBranchValues);
runTest("MAD vs brute force        : ", testMadBruteForce);
runTest("MAD desktop contract      : ", testMadDesktopContract);
runTest("MAD re-run stays put      : ", testMadStableOnRealTrees);
runTest("representative tips       : ", testRepresentativeDesktopUnitTests);
runTest("representatives contract  : ", testRepresentativeDesktopContract);
runTest("representatives extracted : ", testRepresentativeExtraction);
runTest("representatives texts     : ", testRepresentativeTexts);

// ---- representative tips ----------------------------------------------------

function repTree(nwk) {
    return forester.parseNewHampshire(nwk, true, false);
}

function repTip(phy, name) {
    return forester.getAllExternalNodes(forester.getTreeRoot(phy)).filter(function (t) {
        return t.name === name;
    })[0];
}

function repNames(nodes) {
    return nodes.map(function (n) { return n.name; }).sort().join(',');
}

function repFail(message) {
    console.log('    ' + message);
    return false;
}

// the patristic distance between two tips, the long way round
function repPairDistance(phy, a, b) {
    var parent = new Map();
    var stack = [forester.getTreeRoot(phy)];
    while (stack.length > 0) {
        var n = stack.pop();
        (n.children || []).forEach(function (c) {
            parent.set(c, n);
            stack.push(c);
        });
    }
    var edge = function (x) {
        return (typeof x.branch_length === 'number' && x.branch_length > 0) ? x.branch_length : 0;
    };
    var up = new Map();
    var d = 0;
    var x = a;
    up.set(x, 0);
    while (parent.has(x)) {
        d += edge(x);
        x = parent.get(x);
        up.set(x, d);
    }
    var e = 0;
    var y = b;
    while (!up.has(y)) {
        e += edge(y);
        y = parent.get(y);
    }
    return e + up.get(y);
}

// the tree as test/fixtures/RepContract.java writes it
function repWritten(n, isRoot) {
    var s = '';
    if (n.children && n.children.length > 0) {
        s += '(' + n.children.map(function (c) { return repWritten(c, false); }).join(',') + ')';
    }
    s += n.name || '';
    if (!isRoot) {
        s += ':' + ((typeof n.branch_length === 'number') ? n.branch_length.toFixed(9) : '-');
    }
    return s;
}

// Java's %.9f rounds from the shortest digits and toFixed from the exact
// value, so lengths are compared as numbers
function repSameWritten(a, b) {
    var re = /:(-|-?\d+\.\d+)/g;
    if (a.replace(re, ':#') !== b.replace(re, ':#')) {
        return false;
    }
    var na = (a.match(re) || []).map(function (m) { return m.slice(1); });
    var nb = (b.match(re) || []).map(function (m) { return m.slice(1); });
    return na.every(function (v, i) {
        return (v === '-' || nb[i] === '-') ? v === nb[i] : Math.abs(Number(v) - Number(nb[i])) <= 2e-9;
    });
}

// The desktop's RepresentativeTipSelectorTest, case for case.
function testRepresentativeDesktopUnitTests() {
    var sel = forester.selectRepresentativeTips;
    var LONG = forester.REPRESENTATIVE_LONGEST_BRANCH;
    var twoCherries = function () { return repTree('((A:0.01,B:0.01):0.4,(C:0.01,D:0.01):0.4)'); };
    // medoid totals A=1.4, B=1.1, C=1.0, D=1.1: C is the only minimum
    var caterpillar = function () { return repTree('(A:0.05,(B:0.1,(C:0.05,D:0.1):0.2):0.2)'); };
    // group counts {4, 3, 2, 1}
    var nested = function () { return repTree('(A:0.01,(B:0.01,(C:0.01,D:0.01):0.5):0.5)'); };
    var count = function (phy, target) { return sel(phy, {target: target}).groups.length; };
    var i;

    // cutoff clustering
    var r = sel(twoCherries(), {cutoff: 0.02});
    if (r.groups.length !== 2 || r.topological || r.tipCount !== 4 || r.keptCount !== 2
        || !r.groups.every(function (g) { return g.members.length === 2; })) {
        return repFail('cutoff 0.02 on two cherries: ' + r.summary);
    }
    if (sel(twoCherries(), {cutoff: 1}).groups.length !== 1 || sel(twoCherries(), {cutoff: 0}).groups.length !== 4) {
        return repFail('cutoff 1 should give one group, cutoff 0 four');
    }

    // the group count never grows with the cutoff
    var previous = Infinity;
    var cutoffs = [0, 0.01, 0.02, 0.3, 0.52, 0.9, 1.02, 5];
    for (i = 0; i < cutoffs.length; ++i) {
        var c = sel(nested(), {cutoff: cutoffs[i]}).groups.length;
        if (c > previous) {
            return repFail('the group count grew at cutoff ' + cutoffs[i]);
        }
        previous = c;
    }

    // complete linkage: no two tips of a group farther apart than the cutoff
    var phy = nested();
    r = sel(phy, {cutoff: 0.52});
    for (i = 0; i < r.groups.length; ++i) {
        var m = r.groups[i].members;
        for (var a = 0; a < m.length; ++a) {
            for (var b = a + 1; b < m.length; ++b) {
                if (repPairDistance(phy, m[a], m[b]) > 0.52 + 1e-9) {
                    return repFail('a group breaks the cutoff: ' + m[a].name + '-' + m[b].name);
                }
            }
        }
        if (m.indexOf(r.groups[i].kept[0]) < 0) {
            return repFail('a representative outside its group');
        }
    }

    // target counts
    if (count(nested(), 3) !== 3 || count(nested(), 2) !== 2 || count(nested(), 1) !== 1
        || count(nested(), 4) !== 4 || count(nested(), 9) !== 4) {
        return repFail('target counts on the nested tree');
    }
    // counts {4, 2, 1}: 3 is as close to 4 as to 2, and a tie keeps more
    if (count(twoCherries(), 3) !== 4) {
        return repFail('a tie should keep more representatives, got ' + count(twoCherries(), 3));
    }
    if (sel(twoCherries(), {target: 3}).summary.indexOf('requested 3') < 0) {
        return repFail('the summary should note the requested target');
    }

    // medoid: the brute-force minimum, and it is C
    phy = caterpillar();
    r = sel(phy, {cutoff: 10});
    var members = r.groups[0].members;
    var total = function (t) {
        return members.reduce(function (s, o) { return s + (o === t ? 0 : repPairDistance(phy, t, o)); }, 0);
    };
    var best = Math.min.apply(null, members.map(total));
    if (r.groups.length !== 1 || Math.abs(total(r.groups[0].kept[0]) - best) > 1e-9 || r.groups[0].kept[0].name !== 'C') {
        return repFail('the medoid should be C, got ' + r.groups[0].kept[0].name);
    }

    // longest branch: the longest terminal branch, the first of equals (B and D have 0.1)
    r = sel(caterpillar(), {cutoff: 10, pick: LONG});
    if (r.groups[0].kept[0].name !== 'B' || r.pick !== LONG) {
        return repFail('the longest branch should be B, got ' + r.groups[0].kept[0].name);
    }

    // no branch lengths: topological distance (a cherry spans 2 edges, the tree 4)
    phy = repTree('((A,B),(C,D))');
    r = sel(phy, {cutoff: 1});
    if (forester.hasUsableBranchLengths(phy) || !r.topological || r.groups.length !== 4
        || sel(phy, {cutoff: 2}).groups.length !== 2 || r.summary.indexOf('topological') < 0) {
        return repFail('topological fallback: ' + r.summary);
    }

    // the same representatives on a copy
    phy = nested();
    var tipOrder = function (t) {
        var names = [];
        var walk = function (n) {
            if (n.children && n.children.length > 0) {
                n.children.forEach(walk);
            } else {
                names.push(n.name);
            }
        };
        walk(forester.getTreeRoot(t));
        return names.join();
    };
    var copy = forester.copyTreeKeepingTips(phy, forester.getAllExternalNodes(forester.getTreeRoot(phy)));
    if (repNames(sel(phy, {cutoff: 0.52}).keptTips) !== repNames(sel(copy, {cutoff: 0.52}).keptTips)
        || tipOrder(copy) !== 'A,B,C,D') {
        return repFail('a copy chose differently, or reordered its tips');
    }

    // accessors, and the all-singletons target reporting cutoff 0, not -1
    r = sel(twoCherries(), {cutoff: 0.02});
    if (r.keptTips.length !== 2 || r.effectiveCutoff < 0 || !r.groups.every(function (g) {
        return g.clade && g.kept.length > 0 && g.kept.every(function (k) { return g.members.indexOf(k) >= 0; });
    })) {
        return repFail('accessors');
    }
    r = sel(twoCherries(), {target: 3});
    if (r.effectiveCutoff !== 0 || r.groups.length !== 4) {
        return repFail('the all-singletons target should report cutoff 0, got ' + r.effectiveCutoff);
    }
    if (sel(twoCherries(), {cutoff: 0}).summary.indexOf('within a distance of 0 of') < 0
        || sel(repTree('((A,B),(C,D))'), {cutoff: 2}).summary.indexOf('within a distance of 2 of') < 0
        || sel(twoCherries(), {cutoff: 0.05}).summary.indexOf('within a distance of 0.05 of') < 0) {
        return repFail('distances in the summary');
    }

    // protection
    phy = caterpillar();
    r = sel(phy, {cutoff: 10, protectedTips: [repTip(phy, 'A')]});
    if (r.groups.length !== 1 || r.keptCount !== 1 || r.protectedKeptCount !== 1 || repNames(r.keptTips) !== 'A'
        || r.summary.indexOf('Keeping 1 tip, including 1 selected tip protected') < 0) {
        return repFail('protection (1): ' + r.summary);
    }
    phy = caterpillar();
    r = sel(phy, {cutoff: 10, protectedTips: [repTip(phy, 'A'), repTip(phy, 'C')]});
    if (r.groups.length !== 1 || r.keptCount !== 2 || r.protectedKeptCount !== 2 || repNames(r.keptTips) !== 'A,C') {
        return repFail('protection (2): both protected tips should be kept');
    }
    phy = nested();
    r = sel(phy, {target: 1, protectedTips: [repTip(phy, 'A'), repTip(phy, 'B'), repTip(phy, 'C')]});
    if (r.groups.length !== 1 || r.keptCount !== 3 || r.protectedKeptCount !== 3) {
        return repFail('protection (3): protection should win over the target');
    }
    phy = twoCherries();
    r = sel(phy, {cutoff: 0.02, protectedTips: [repTip(phy, 'B')]});
    if (r.groups.length !== 2 || r.keptCount !== 2 || repNames(r.keptTips) !== 'B,C') {
        return repFail('protection (4): B should replace A, got ' + repNames(r.keptTips));
    }
    phy = nested();
    if (repNames(sel(phy, {cutoff: 0.52}).keptTips) !== repNames(sel(phy, {cutoff: 0.52, protectedTips: []}).keptTips)
        || sel(phy, {cutoff: 0.52, protectedTips: []}).protectedKeptCount !== 0) {
        return repFail('protection (5): nothing protected should change nothing');
    }

    // edge cases
    if (sel(repTree('solo;'), {cutoff: 0.5}).groups.length !== 1) {
        return repFail('a one-tip tree is one group');
    }
    phy = repTree('(A:0.1,B:0.1)');
    if (sel(phy, {cutoff: 0.1}).groups.length !== 2 || sel(phy, {cutoff: 0.2}).groups.length !== 1) {
        return repFail('a cherry splits below its diameter and joins at it');
    }
    var throws = function (fn) {
        try {
            fn();
            return false;
        } catch {
            return true;
        }
    };
    if (!throws(function () { sel(null, {cutoff: 0.1}); }) || !throws(function () { sel(phy, {cutoff: -1}); })
        || !throws(function () { sel(phy, {target: 0}); }) || !throws(function () { sel(phy, {target: 2.5}); })
        || !throws(function () { sel(phy, {}); }) || !throws(function () { sel(phy, {cutoff: 1, target: 2}); })
        || !throws(function () { sel(phy, {cutoff: 1, pick: 'random'}); })) {
        return repFail('bad arguments should throw');
    }
    return true;
}

// The joint contract: the desktop's own selector and extraction, run over
// every scenario of every fixture tree (test/fixtures/RepContract.java),
// against ours -- every column, the summary text included.
function testRepresentativeDesktopContract() {
    var fs = require('fs');
    var lines = fs.readFileSync(pth.join(__dirname, 'fixtures', 'rep-contract.tsv'), 'utf8').split('\n')
        .filter(function (l) { return l.length > 0 && l.charAt(0) !== '#'; });
    var trees = {};
    var rows = 0;
    var bad = [];
    lines.forEach(function (line) {
        var f = line.split('\t');
        if (f[0] === 'tree') {
            trees[f[1]] = f[2];
            return;
        }
        ++rows;
        var phy = repTree(trees[f[0]]);
        var opts = {pick: f[1] === 'MEDOID' ? forester.REPRESENTATIVE_MEDOID : forester.REPRESENTATIVE_LONGEST_BRANCH};
        var mode = f[2].split('=');
        if (mode[0] === 'cutoff') {
            opts.cutoff = Number(mode[1]);
        } else {
            opts.target = parseInt(mode[1], 10);
        }
        opts.protectedTips = f[3] === '-' ? [] : f[3].split(',').map(function (n) { return repTip(phy, n); });
        var r = forester.selectRepresentativeTips(phy, opts);
        var groups = r.groups.map(function (g) { return repNames(g.members) + '>' + repNames(g.kept); }).sort().join(' ');
        var extraction = r.keptCount === r.tipCount ? '='
            : repWritten(forester.getTreeRoot(forester.copyTreeKeepingTips(phy, r.keptTips)), true);
        var differs = [];
        if (String(r.groups.length) !== f[4]) differs.push('groups ' + r.groups.length + ' vs ' + f[4]);
        if (String(r.keptCount) !== f[5]) differs.push('kept ' + r.keptCount + ' vs ' + f[5]);
        if (String(r.protectedKeptCount) !== f[6]) differs.push('protected ' + r.protectedKeptCount + ' vs ' + f[6]);
        if (r.effectiveCutoff !== Number(f[7])) differs.push('cutoff ' + r.effectiveCutoff + ' vs ' + f[7]);
        if (String(r.topological) !== f[8]) differs.push('topological');
        if (groups !== f[9]) differs.push('members');
        if (r.summary.replace(/\n/g, '|') !== f[10]) differs.push('summary "' + r.summary + '"');
        if (extraction === '=' || f[11] === '=' ? extraction !== f[11] : !repSameWritten(extraction, f[11])) {
            differs.push('extraction ' + extraction + ' vs ' + f[11]);
        }
        if (differs.length > 0) {
            bad.push('tree ' + f[0] + ' ' + f[1] + ' ' + f[2] + ' protect ' + f[3] + ': ' + differs.join('; '));
        }
    });
    if (Object.keys(trees).length < 120 || rows < 5000) {
        return repFail('fixture looks truncated: ' + Object.keys(trees).length + ' trees, ' + rows + ' rows');
    }
    if (bad.length > 0) {
        return repFail(bad.length + ' of ' + rows + ' rows differ from the desktop, first: ' + bad.slice(0, 3).join(' | '));
    }
    return true;
}

// How a tree of representatives is cut out: the desktop's prune, except that
// the root keeps the original root's own length (Christian, 2026-09-15).
function testRepresentativeExtraction() {
    // a parsed tree links every node to its parent
    var snapshot = function (t) {
        return JSON.stringify(t, function (key, value) { return key === 'parent' ? undefined : value; });
    };
    var check = function (nwk, keep, expected) {
        var phy = repTree(nwk);
        var before = snapshot(phy);
        var copy = forester.copyTreeKeepingTips(phy, keep.map(function (n) { return repTip(phy, n); }));
        var got = repWritten(forester.getTreeRoot(copy), false);
        if (got !== expected || snapshot(phy) !== before || copy.children.length !== 1) {
            console.log('    ' + nwk + ' keeping ' + keep + ': ' + got + ', expected ' + expected
                + (snapshot(phy) !== before ? ' (and the original changed)' : ''));
            return false;
        }
        return true;
    };
    var f9 = function (x) { return x.toFixed(9); };
    // one tip left: the desktop's root length would be 0.05, 0.25 or 0.45, by node ids
    if (!check('(A:0.05,(B:0.1,(C:0.05,D:0.1):0.2):0.2)', ['C'], 'C:-')
        // merged branches add up; a missing length adds nothing
        || !check('((A:1,(B:2,C:3):4):5,(D,(E,F:6)):7)', ['A', 'C', 'D', 'F'],
            '((A:' + f9(1) + ',C:' + f9(7) + '):' + f9(5) + ',(D:-,F:' + f9(6) + '):' + f9(7) + '):-')
        // two missing lengths stay missing, zeros stay zero
        || !check('((A,B),(C,D))', ['A', 'C'], '(A:-,C:-):-')
        || !check('((A:0,B:0):0,C:1)', ['A', 'C'], '(A:' + f9(0) + ',C:' + f9(1) + '):-')
        // a polytomy only loses the tip
        || !check('(A:1,B:2,C:3)', ['A', 'C'], '(A:' + f9(1) + ',C:' + f9(3) + '):-')) {
        return false;
    }
    // a root with a length of its own keeps it, whichever node becomes the root
    var phy = repTree('((A:1,B:1):2,(C:1,D:3):2)');
    forester.getTreeRoot(phy).branch_length = 0.7;
    var root = forester.getTreeRoot(forester.copyTreeKeepingTips(phy, [repTip(phy, 'C'), repTip(phy, 'D')]));
    if (root.branch_length !== 0.7 || repWritten(root, true) !== '(C:' + f9(1) + ',D:' + f9(3) + ')') {
        return repFail('the root should keep its own 0.7, got ' + root.branch_length);
    }
    // node data is copied, never shared, and no parent links come along
    phy = repTree('((A:1,B:2)x:1[80],(C:3,D:4)y:1[90])');
    var x = forester.getTreeRoot(phy).children[0];
    if (!x.confidences || x.confidences.length !== 1) {
        return repFail('the test tree lost its support value: ' + JSON.stringify(x.confidences));
    }
    var copy = forester.copyTreeKeepingTips(phy, ['A', 'B', 'C'].map(function (n) { return repTip(phy, n); }));
    var cx = forester.getTreeRoot(copy).children[0];
    if (JSON.stringify(cx.confidences) !== JSON.stringify(x.confidences) || cx.confidences === x.confidences
        || cx.name !== 'x' || forester.getTreeRoot(copy).children[1].branch_length !== 4) {
        return repFail('copied node data: ' + JSON.stringify(cx));
    }
    var linked = false;
    forester.preOrderTraversal(copy, function (n) {
        linked = linked || Object.prototype.hasOwnProperty.call(n, 'parent');
    });
    if (linked) {
        return repFail('the copy carries parent links');
    }
    try {
        forester.copyTreeKeepingTips(phy, []);
        return repFail('keeping no tip should throw');
    } catch {
        return true;
    }
}

// The desktop's texts, which print numbers the Java way: its
// RepresentativeTipsToolTest cases, and Double.toString outputs read off the
// desktop's JVM (1.0E-4, 3.0E-5).
function testRepresentativeTexts() {
    var name = forester.representativeTreeName;
    var strip = forester.stripShortExtension;
    var desc = forester.representativeTreeDescription;
    var MED = forester.REPRESENTATIVE_MEDOID;
    var LONG = forester.REPRESENTATIVE_LONGEST_BRANCH;
    var summaryOf = function (nwk, cutoff) {
        return forester.selectRepresentativeTips(repTree(nwk), {cutoff: cutoff}).summary;
    };
    var cases = [
        [name('flaviviridae', 247), 'flaviviridae_247reps'],
        [name('flaviviridae', 1), 'flaviviridae_1rep'],
        [name('', 3), 'tree_3reps'],
        [name(null, 3), 'tree_3reps'],
        [name('mammals.xml', 233), 'mammals_233reps'],
        [strip('mammals.xml'), 'mammals'],
        [strip('mammals.nexus'), 'mammals'],
        [strip('mammals.h'), 'mammals'],
        [strip('tree.v2.xml'), 'tree.v2'],
        [strip('mammals'), 'mammals'],
        [strip('data.superlong'), 'data.superlong'],
        [strip(null), null],
        [desc(true, 0.05, 0, MED, 233, 'mammals', 1000), 'Used the distance-cutoff (maximum distance 0.05, medoid '
            + 'representative) algorithm to select 233 representative tips from tree named "mammals" with 1000 tips.'],
        [desc(false, 0, 50, LONG, 1, 'mammals', 1), 'Used the target-count (target 50, longest-branch representative) '
            + 'algorithm to select 1 representative tip from tree named "mammals" with 1 tip.'],
        [desc(true, 0.1, 0, MED, 5, null, 20).indexOf('from tree named "tree" with 20 tips.') > 0, true],
        [desc(true, 1, 0, MED, 2, 'x', 4).indexOf('(maximum distance 1.0, ') > 0, true],
        [desc(true, 1e-4, 0, MED, 2, 'x', 4).indexOf('(maximum distance 1.0E-4, ') > 0, true],
        // the summary rounds to five decimals first
        [summaryOf('(A:1.25e-5,B:1.25e-5)', 2.5e-5).indexOf('within a distance of 3.0E-5 of') > 0, true],
        [summaryOf('(A:1,B:1)', 9.99e-4).indexOf('within a distance of 0.001 of') > 0, true],
        [summaryOf('(A:1,B:1)', 100 / 3).indexOf('within a distance of 33.33333 of') > 0, true],
        [summaryOf('(A:1,B:1)', 1e7).indexOf('within a distance of 10000000 of') > 0, true]
    ];
    var bad = cases.filter(function (c) { return c[0] !== c[1]; });
    if (bad.length > 0) {
        return repFail(bad.length + ' texts differ, first: ' + JSON.stringify(bad[0][0]) + ' vs ' + JSON.stringify(bad[0][1]));
    }
    return true;
}

// Tips a hair apart (FastTree writes 5e-9 for a zero branch) made MAD's sums
// cancel catastrophically: re-running it on the Flavivirus prM tree moved the
// root back and forth, onto a worse root every other time. Pairs closer than
// 1e-5 of the diameter are left out now. Every Flavivirus tree roots the same
// on a second run, and prM matches the brute force both as read and after a
// MAD re-root.
function testMadStableOnRealTrees() {
    var file = pth.join(__dirname, '..', 'docs', 'data', 'flavivirus-mature-peptides.xml');
    var rootKey = function (phy) {
        return forester.getTreeRoot(phy).children.map(function (c) { return madTipNames(c).join(','); }).sort().join(' | ');
    };
    var trees = readPhyloXmlFromFile(file);
    var moved = trees.filter(function (t) {
        forester.addParents(t);
        forester.madRoot(t);
        var first = rootKey(t);
        forester.madRoot(t);
        return rootKey(t) !== first;
    }).map(function (t) { return t.name; });
    if (trees.length !== 10 || moved.length > 0) {
        console.log('    a second MAD run moved the root: ' + moved.join(', '));
        return false;
    }
    var prm = readPhyloXmlFromFile(file).filter(function (t) { return /prM/.test(t.name); })[0];
    forester.addParents(prm);
    var asRead = madValidate(prm);
    forester.madRoot(prm);
    var afterMad = madValidate(prm);
    if (asRead || afterMad) {
        console.log('    prM as read: ' + asRead + '; after a MAD re-root: ' + afterMad);
        return false;
    }
    // the cut is 1e-5 of the diameter, not merely "tiny": A and B are 4e-6
    // apart in a tree about 5.5 across, so they are left out, and their
    // lopsided pair (deviation -0.5) would otherwise add 0.25 to the scores
    var pinned = madValidate(forester.parseNewHampshire("((A:0.000001,B:0.000003):1,(C:1,D:2):1.5,E:3)", true, false));
    if (pinned) {
        console.log('    pair at 7e-7 of the diameter: ' + pinned);
        return false;
    }
    // ... and a pair 4e-4 apart, at 7e-5 of the diameter, still counts
    var counted = madValidate(forester.parseNewHampshire("((A:0.0001,B:0.0003):1,(C:1,D:2):1.5,E:3)", true, false));
    if (counted) {
        console.log('    pair at 7e-5 of the diameter: ' + counted);
        return false;
    }
    return true;
}

// madRoot on a copy of the tree against the brute force: the global minimum
// reached, and every internal branch given the brute force's value. Returns
// what is wrong, or null.
function madValidate(phy) {
    var all = madTipNames(forester.getTreeRoot(phy));
    var nPairs = all.length * (all.length - 1) / 2;
    var eps = madNearEps(phy);
    var brute = madBruteForce(phy, all);
    var bruteMin = Infinity;
    Object.keys(brute).forEach(function (k) { bruteMin = Math.min(bruteMin, brute[k]); });
    var work = madClone(phy);
    forester.madRoot(work);
    if (Math.abs(madScoreSsd(work, eps) - bruteMin) > 1e-6) {
        return 'reaches ' + madScoreSsd(work, eps) + ', the minimum is ' + bruteMin;
    }
    var off = forester.getAllNodes(work).filter(function (nd) {
        if (!nd.parent || !nd.parent.parent || !nd.children) {
            return false;
        }
        var v = madValue(nd);
        var expected = brute[madSideKey(all, nd)];
        return !isFinite(v) || expected === undefined || Math.abs(v * v * nPairs - expected) > 1e-6;
    });
    return off.length > 0 ? off.length + ' branch value(s) off the brute force' : null;
}
runTest("MAD values never support  : ", testMadValuesNeverSupport);
runTest("time tree detection       : ", testIsTimeTree);
runTest("re-root effect on clades  : ", testCladesChangedByRerooting);
runTest("phyloXML dates survive    : ", testPhyloXmlDateRoundTrip);
runTest("tip label date grammar    : ", testTipLabelDateGrammar);
runTest("heights -> dates (desktop): ", testHeightDateConversionAgainstDesktop);
runTest("heights -> dates refusals : ", testHeightDateRefusals);
runTest("time vs divergence scale : ", testTimeDivergenceScale);

// Which internal-node data a re-root can take the meaning from, and a
// prediction of what a re-root will do to it: computed on a copy, it leaves
// the tree alone and names exactly the nodes whose tips the real re-root
// then changes -- or removes, as it removes an old two-child root. Every
// fixture tree up to 18 tips, by MAD, midpoint and a node's branch.
function testCladesChangedByRerooting() {
    var probe = function (extra) {
        return forester.nodeHasData(Object.assign({children: [{}, {}]}, extra));
    };
    if (probe({}) || !probe({name: 'x'}) || !probe({taxonomies: [{code: 'X'}]}) || probe({taxonomies: [{}]})
        || probe({properties: [{ref: 'aptx:x', value: '1', applies_to: 'node'}]}) || !probe({date: {value: 1}})
        || !probe({events: {duplications: 1}}) || !probe({sequences: [{name: 's'}]})
        || !probe({properties: [{ref: 'meta:Host', value: 'bat', applies_to: 'node'}]})
        || probe({properties: [{ref: 'style:font_color', value: '#fff', applies_to: 'node'}]})
        || probe({properties: [{ref: 'meta:rate', value: '1', applies_to: 'parent_branch'}]})
        || probe({confidences: [{value: 90}], branch_length: 1, width: 2})) {
        console.log('    nodeHasData misjudged a node');
        return false;
    }
    var plain = forester.parseNewHampshire("((A:1,B:1):1,(C:1,D:1):1)", true, false);
    var none = forester.cladesChangedByRerooting(plain, 'midpoint');
    if (none.annotated.length !== 0 || none.changed.length !== 0) {
        return false;
    }
    var clades = function (phy) {
        var m = new Map();
        forester.getAllNodes(phy).forEach(function (n) {
            if (n.children && n.name) {
                m.set(n, madTipNames(n).join(','));
            }
        });
        return m;
    };
    var bad = null;
    var checked = 0;
    var withChanges = 0;
    var withoutChanges = 0;
    readMadFixture().forEach(function (row) {
        ['mad', 'midpoint', 'node'].forEach(function (method) {
            var phy = forester.parseNewHampshire(row.newick, true, false);
            if (bad || forester.getAllExternalNodes(phy).length > 18) {
                return;
            }
            var k = 0;
            forester.getAllNodes(phy).forEach(function (n) {
                if (n.children && n.parent) {
                    n.name = 'n' + (k++);
                }
            });
            var movable = forester.getAllNodes(phy).filter(function (n) { return n.parent && n.parent.parent; });
            var target = movable[Math.floor(movable.length * 2 / 3)];
            var written = forester.toNewHampshire(phy);
            var before = clades(phy);
            var predicted = forester.cladesChangedByRerooting(phy, method, target);
            if (forester.toNewHampshire(phy) !== written) {
                bad = '#' + row.index + ' ' + method + ': the prediction changed the tree';
                return;
            }
            if (method === 'mad') {
                forester.madRoot(phy);
            } else if (method === 'midpoint') {
                forester.midpointRoot(phy);
            } else {
                forester.reRoot(phy, target, -1);
            }
            var after = clades(phy);
            var actual = [];
            before.forEach(function (tips, n) {
                if (after.get(n) !== tips) {
                    actual.push(n.name);
                }
            });
            var said = predicted.changed.map(function (n) { return n.name; });
            if (predicted.annotated.length !== k || said.sort().join() !== actual.sort().join()) {
                bad = '#' + row.index + ' ' + method + ': predicted [' + said.join() + '] of ' + predicted.annotated.length
                    + ', the re-root changed [' + actual.join() + '] of ' + k;
                return;
            }
            ++checked;
            if (actual.length > 0) {
                ++withChanges;
            } else {
                ++withoutChanges;
            }
        });
    });
    if (bad || checked < 600 || withChanges < 100 || withoutChanges < 10) {
        console.log('    ' + (bad || ('checked ' + checked + ', with changes ' + withChanges + ', without ' + withoutChanges)));
        return false;
    }
    return true;
}

// A time tree has dated ancestors (BEAST heights, Nextstrain dates, phyloXML
// <date>s on internal nodes); tip dates alone are collection dates on a
// divergence tree. The viewer never re-roots a time tree.
function testIsTimeTree() {
    var nwk = "(((A:1,B:1):1,C:2):1,(D:1,E:1):2)";
    var dated = function (which) {
        var phy = forester.parseNewHampshire(nwk, true, false);
        forester.preOrderTraversalAll(forester.getTreeRoot(phy), function (n) {
            if (which(n)) {
                n.date = {value: 2000};
            }
        });
        return phy;
    };
    var minority = forester.parseNewHampshire(nwk, true, false);
    forester.getTreeRoot(minority).date = {value: 5};   // 1 of 4 internal nodes
    var half = forester.parseNewHampshire(nwk, true, false);
    forester.getTreeRoot(half).date = {value: 5};      // 2 of 4 internal nodes: not a majority
    forester.getTreeRoot(half).children[1].date = {value: 3};
    var single = forester.parseNewHampshire("(A:1,B:1)", true, false);
    forester.getTreeRoot(single).date = {value: 5};     // 1 of 1: a majority, but fewer than two
    var beastText = require('fs').readFileSync(pth.join(__dirname, '..', 'docs', 'data', 'beast-annotations.nex'), 'utf8');
    var results = {
        none: forester.isTimeTree(forester.parseNewHampshire(nwk, true, false)),
        tips: forester.isTimeTree(dated(function (n) { return !n.children; })),
        ancestors: forester.isTimeTree(dated(function (n) { return !!n.children; })),
        minority: forester.isTimeTree(minority),
        half: forester.isTimeTree(half),
        single: forester.isTimeTree(single),
        beast: forester.isTimeTree(forester.parseNexus(beastText, true, false)[0])
    };
    if (results.none || results.tips || !results.ancestors || results.minority || results.half || results.single || !results.beast) {
        console.log('    ' + JSON.stringify(results));
        return false;
    }
    return true;
}

// A MAD value rates a root position, not a clade: the Newick/Nexus support
// slot never holds one (and a branch with both keeps its support), and the
// tree properties and the Confidence search field leave them out.
function testMadValuesNeverSupport() {
    var bare = forester.parseNewHampshire("((A:1,B:2):1,(C:3,D:4):1)", true, false);
    forester.madRoot(bare);
    var nh = forester.toNewHampshire(bare, 9, false, true);
    if (nh !== "(D:3.638418079,(C:3,(A:1,B:2):2):0.361581921);") {
        console.log('    no support, Newick: ' + nh);
        return false;
    }
    if (forester.toNexus(bare, 9, true).indexOf("(D:3.638418079,(C:3,(A:1,B:2):2):0.361581921);") < 0) {
        console.log('    no support, Nexus: ' + forester.toNexus(bare, 9, true));
        return false;
    }
    var props = forester.collectBasicTreeProperties(bare);
    if (props.madValues !== true || props.confidences !== false || props.maxConfidence !== 0) {
        console.log('    properties: ' + JSON.stringify({mad: props.madValues, conf: props.confidences, max: props.maxConfidence}));
        return false;
    }
    if (forester.availableSearchFields(forester.getTreeRoot(bare)).indexOf(forester.searchFields.confidence) >= 0) {
        console.log('    Confidence search offered on MAD values alone');
        return false;
    }
    var boot = forester.parseNewHampshire("((A:1,B:2)x:1[80],(C:3,D:4)y:1[90])", true, false);
    forester.madRoot(boot);
    var x = forester.findByNodeName(boot, 'x')[0];
    var written = forester.toNewHampshire(boot, 9, false, true);
    if (written.indexOf("x:2[90]") < 0 || /\[0\./.test(written)) {
        console.log('    with support, Newick: ' + written);
        return false;
    }
    var p2 = forester.collectBasicTreeProperties(boot);
    return p2.madValues === true && p2.confidences === true && p2.maxConfidence === 90
        && forester.searchFields.confidence.extract(x).join() === '90';
}

// A position of 0 puts the root right at the node (MAD rooting can); no
// position still means the middle of the branch.
function testReRootAtNode() {
    var byName = function (phy, name) { return forester.findByNodeName(phy, name)[0]; };
    var deep = forester.parseNewHampshire("(((A:1,B:2):3,C:4):5,D:6)", true, false);
    forester.reRoot(deep, byName(deep, 'A'), 0);
    if (byName(deep, 'A').branch_length !== 0 || byName(deep, 'A').parent.children.length !== 2) {
        console.log('    deep: ' + forester.toNewHampshire(deep));
        return false;
    }
    var nearRoot = forester.parseNewHampshire("((A:1,B:2):3,C:4)", true, false);
    forester.reRoot(nearRoot, byName(nearRoot, 'C'), 0);
    if (byName(nearRoot, 'C').branch_length !== 0) {
        console.log('    near root: ' + forester.toNewHampshire(nearRoot));
        return false;
    }
    var middle = forester.parseNewHampshire("(((A:1,B:2):3,C:4):5,D:6)", true, false);
    forester.reRoot(middle, byName(middle, 'A'));
    return byName(middle, 'A').branch_length === 0.5;
}

function madDistToRoot(node) {
    var d = 0;
    while (node.parent && node.parent.parent) {
        d += node.branch_length > 0 ? node.branch_length : 0;
        node = node.parent;
    }
    return d;
}

// a branch's MAD value: NaN for none, Infinity for more than one (a bug)
function madValue(node) {
    var c = (node.confidences || []).filter(function (x) { return x.type === forester.MAD_CONFIDENCE_TYPE; });
    return c.length === 0 ? NaN : (c.length === 1 ? c[0].value : Infinity);
}

function madTipNames(node) {
    return forester.getAllExternalNodes(node).map(function (t) { return t.name; }).sort();
}

// the tips on the side of the branch above `node` without the alphabetically first tip
function madSideKey(allNames, node) {
    var under = madTipNames(node);
    var side = under.indexOf(allNames[0]) >= 0
        ? allNames.filter(function (x) { return under.indexOf(x) < 0; })
        : under;
    return side.join(',');
}

// The desktop's hand-verified cases and its no-op guards.
function testMadRootExactCases() {
    var near = function (a, b) { return Math.abs(a - b) < 1e-9; };
    var byName = function (phy, name) { return forester.findByNodeName(phy, name)[0]; };
    // a 3-tip star with one long branch: the clock root is 2.5 from every tip
    var t0 = forester.parseNewHampshire("(A:1,B:1,C:4)", true, false);
    if (forester.madRoot(t0) !== true || forester.getTreeRoot(t0).children.length !== 2
        || !near(byName(t0, 'C').branch_length, 2.5)
        || !['A', 'B', 'C'].every(function (n) { return near(madDistToRoot(byName(t0, n)), 2.5); })) {
        console.log('    t0: ' + forester.toNewHampshire(t0));
        return false;
    }
    // symmetric and balanced: the central branch's midpoint, every tip 2 from the root
    var t1 = forester.parseNewHampshire("((A:1,B:1):1,(C:1,D:1):1)", true, false);
    forester.madRoot(t1);
    if (!['A', 'B', 'C', 'D'].every(function (n) { return near(madDistToRoot(byName(t1, n)), 2); })) {
        console.log('    t1: ' + forester.toNewHampshire(t1));
        return false;
    }
    // no-ops: two tips, no branch lengths -- the tree untouched, no values added
    var two = forester.parseNewHampshire("(A:1,B:1)", true, false);
    var bare = forester.parseNewHampshire("((A,B),(C,D))", true, false);
    var before = forester.toNewHampshire(bare);
    if (forester.madRoot(two) !== false || forester.madRoot(bare) !== false
        || forester.toNewHampshire(bare) !== before
        || forester.getAllNodes(bare).some(function (n) { return !isNaN(madValue(n)); })) {
        return false;
    }
    // the same input roots the same way every time
    var input = "((((A:0.3,B:0.9):0.2,C:1.4):0.7,(D:0.5,E:0.6):0.1):0.4,(F:2.1,G:0.2):0.3,H:1.1)";
    var a = forester.parseNewHampshire(input, true, false);
    var b = forester.parseNewHampshire(input, true, false);
    forester.madRoot(a);
    forester.madRoot(b);
    return forester.toNewHampshire(a) === forester.toNewHampshire(b);
}

// Internal branches carry exactly one MAD value, pendant branches none; the
// root's branch has the smallest; a second run replaces rather than adds;
// removeMadConfidences keeps every other confidence.
function testMadBranchValues() {
    var t0 = forester.parseNewHampshire("(A:1,B:1,C:4)", true, false);
    forester.madRoot(t0);
    var min = Infinity;
    var bad = forester.getAllNodes(t0).filter(function (n) {
        if (!n.parent || !n.parent.parent) {
            return false;
        }
        var v = madValue(n);
        if (!n.children) {
            return !isNaN(v);
        }
        min = Math.min(min, v);
        return !isFinite(v);
    });
    if (bad.length > 0 || min > 1e-6) {
        console.log('    t0 values: ' + bad.length + ' bad, smallest ' + min);
        return false;
    }
    var t4 = forester.parseNewHampshire("((A:1,B:2)x:1[80],(C:3,D:4)y:1[90])", true, false);
    forester.madRoot(t4);
    forester.madRoot(t4);
    var nodes = forester.getAllNodes(t4);
    if (nodes.some(function (n) { return madValue(n) === Infinity; })) {
        console.log('    a second run added a second MAD value');
        return false;
    }
    var others = function () {
        return nodes.filter(function (n) {
            return (n.confidences || []).some(function (c) { return c.type !== forester.MAD_CONFIDENCE_TYPE; });
        }).length;
    };
    var otherCount = others();
    forester.removeMadConfidences(t4);
    if (otherCount === 0 || others() !== otherCount || nodes.some(function (n) { return !isNaN(madValue(n)); })) {
        return false;
    }
    // a branch left with nothing has no confidences at all, not an empty list
    return nodes.every(function (n) { return n.confidences === undefined || n.confidences.length > 0; });
}

// Every fixture tree up to 40 tips, against an independent O(n^3) brute
// force: for every branch the analytic best position from its cross pairs,
// a fresh copy re-rooted there and scored pair by pair through the common
// ancestors. madRoot must reach the global minimum and give every internal
// branch the brute force's value.
function testMadBruteForce() {
    var rows = readMadFixture();
    var checked = 0;
    for (var r = 0; r < rows.length; ++r) {
        var input = rows[r].newick;
        var original = forester.parseNewHampshire(input, true, false);
        var n = forester.getAllExternalNodes(original).length;
        if (n > 40) {
            continue;
        }
        var all = madTipNames(forester.getTreeRoot(original));
        var eps = madNearEps(original);
        var brute = madBruteForce(original, all);
        var bruteMin = Infinity;
        Object.keys(brute).forEach(function (k) { bruteMin = Math.min(bruteMin, brute[k]); });
        var work = forester.parseNewHampshire(input, true, false);
        forester.madRoot(work);
        var root = forester.getTreeRoot(work);
        if (Math.abs(madScoreSsd(work, eps) - bruteMin) > 1e-6 || forester.getAllExternalNodes(work).length !== n
            || root.children.length < 2) {
            console.log('    #' + rows[r].index + ' not at the minimum: ' + madScoreSsd(work, eps) + ' vs ' + bruteMin);
            return false;
        }
        var nPairs = n * (n - 1) / 2;
        var wrong = forester.getAllNodes(work).filter(function (nd) {
            if (nd === root || !nd.parent) {
                return false;
            }
            var v = madValue(nd);
            if (!nd.children) {
                return !isNaN(v);
            }
            var expected = brute[madSideKey(all, nd)];
            return !isFinite(v) || expected === undefined || Math.abs(v * v * nPairs - expected) > 1e-6;
        });
        if (wrong.length > 0) {
            console.log('    #' + rows[r].index + ' ' + wrong.length + ' branch value(s) off the brute force');
            return false;
        }
        ++checked;
    }
    if (checked < 240) {
        console.log('    only ' + checked + ' trees checked');
        return false;
    }
    return true;
}

// The distance at or below which madRoot leaves a tip pair out: 1e-5 of the
// tree's diameter, and never less than 1e-9.
function madNearEps(phy) {
    var tips = forester.getAllExternalNodes(forester.getTreeRoot(phy));
    var longest = 0;
    for (var a = 0; a < tips.length; ++a) {
        var ancestors = new Set();
        for (var p = tips[a]; p; p = p.parent) {
            ancestors.add(p);
        }
        for (var b = a + 1; b < tips.length; ++b) {
            var lca = tips[b];
            while (!ancestors.has(lca)) {
                lca = lca.parent;
            }
            var dl = madDistToRoot(lca);
            longest = Math.max(longest, madDistToRoot(tips[a]) - dl + madDistToRoot(tips[b]) - dl);
        }
    }
    return Math.max(1e-9, 1e-5 * longest);
}

// a copy of the shape, names and branch lengths
function madClone(phy) {
    var copyNode = function (n) {
        var c = {name: n.name, branch_length: n.branch_length};
        if (n.children) {
            c.children = n.children.map(function (k) {
                var kc = copyNode(k);
                kc.parent = c;
                return kc;
            });
        }
        return c;
    };
    var root = copyNode(forester.getTreeRoot(phy));
    var copy = {children: [root]};
    root.parent = copy;
    return copy;
}

// The tree's current rooting, scored: the sum of squared ancestor deviations
// over the pairs further apart than eps.
function madScoreSsd(phy, eps) {
    var tips = forester.getAllExternalNodes(forester.getTreeRoot(phy));
    var ssd = 0;
    for (var a = 0; a < tips.length; ++a) {
        var di = madDistToRoot(tips[a]);
        var ancestors = new Set();
        for (var p = tips[a]; p; p = p.parent) {
            ancestors.add(p);
        }
        for (var b = a + 1; b < tips.length; ++b) {
            var lca = tips[b];
            while (!ancestors.has(lca)) {
                lca = lca.parent;
            }
            var dl = madDistToRoot(lca);
            var dj = madDistToRoot(tips[b]);
            var dij = (di - dl) + (dj - dl);
            if (dij > eps) {
                var dev = (2 * (di - dl)) / dij - 1;
                ssd += dev * dev;
            }
        }
    }
    return ssd;
}

// branch (as its side key) -> the smallest total deviation with the root on it
function madBruteForce(original, all) {
    var eps = madNearEps(original);
    var tips = forester.getAllExternalNodes(forester.getTreeRoot(original));
    var result = {};
    forester.getAllNodes(original).forEach(function (c) {
        if (!c.parent || !c.parent.parent) {
            return;
        }
        var dc = madDistToRoot(c);
        var inside = new Set(forester.getAllExternalNodes(c));
        var sumInv = 0, sumInvSq = 0, sumA = 0;
        tips.forEach(function (j) {
            if (!inside.has(j)) {
                return;
            }
            var aj = madDistToRoot(j) - dc;
            tips.forEach(function (i) {
                if (inside.has(i)) {
                    return;
                }
                var ancestors = new Set();
                for (var p = i; p; p = p.parent) {
                    ancestors.add(p);
                }
                var lca = j;
                while (!ancestors.has(lca)) {
                    lca = lca.parent;
                }
                var dl = madDistToRoot(lca);
                var dij = (madDistToRoot(i) - dl) + (madDistToRoot(j) - dl);
                if (dij > eps) {
                    sumInv += 1 / dij;
                    sumInvSq += 1 / (dij * dij);
                    sumA += aj / (dij * dij);
                }
            });
        });
        var length = c.branch_length > 0 ? c.branch_length : 0;
        var x = sumInvSq > 1e-12 ? (sumInv - 2 * sumA) / (2 * sumInvSq) : 0;
        x = Math.min(Math.max(x, 0), length);
        var wanted = madTipNames(c).join(',');
        var copy = madClone(original);
        var cc = forester.getAllNodes(copy).filter(function (nd) {
            return nd.parent && nd.parent.parent && madTipNames(nd).join(',') === wanted;
        })[0];
        forester.reRoot(copy, cc, x);
        var ssd = madScoreSsd(copy, eps);
        var key = madSideKey(all, c);
        if (result[key] === undefined || ssd < result[key]) {
            result[key] = ssd;
        }
    });
    return result;
}

function readMadFixture() {
    var fs = require('fs');
    return fs.readFileSync(pth.join(__dirname, 'fixtures', 'mad-contract.tsv'), 'utf8').split('\n')
        .filter(function (l) { return l.length > 0 && l.charAt(0) !== '#'; })
        .map(function (l) {
            var f = l.split('\t');
            return {index: f[0], newick: f[1], root: f[2], mad: f[3] || ''};
        });
}

// The joint contract: the desktop's own madRoot, run on every fixture tree
// (test/fixtures/MadContract.java), against ours -- the same root split, the
// same positions, the same annotated branches with the same values. Values
// compare as the desktop's tests do, squared and scaled by the pair count:
// on a clock tree a value near 0 is the square root of round-off.
function testMadDesktopContract() {
    var rows = readMadFixture();
    if (rows.length < 250) {
        console.log('    fixture looks truncated: ' + rows.length + ' rows');
        return false;
    }
    var entries = function (s) {
        var m = {};
        s.split(' ').filter(Boolean).forEach(function (e) {
            var i = e.lastIndexOf('=');
            (m[e.slice(0, i)] = m[e.slice(0, i)] || []).push(Number(e.slice(i + 1)));
        });
        Object.keys(m).forEach(function (k) { m[k].sort(function (a, b) { return a - b; }); });
        return m;
    };
    var bad = [];
    rows.forEach(function (row) {
        var phy = forester.parseNewHampshire(row.newick, true, false);
        forester.madRoot(phy);
        var root = forester.getTreeRoot(phy);
        var all = madTipNames(root);
        var nPairs = all.length * (all.length - 1) / 2;
        var ours = entries(root.children.map(function (c) { return madTipNames(c).join(',') + '=' + c.branch_length; }).join(' '));
        var mads = [];
        forester.getAllNodes(phy).forEach(function (nd) {
            if (!isNaN(madValue(nd))) {
                mads.push(madSideKey(all, nd) + '=' + madValue(nd));
            }
        });
        var ourMad = entries(mads.join(' '));
        var theirs = entries(row.root);
        var theirMad = entries(row.mad);
        var same = function (a, b, close) {
            var ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
            return ka.join('|') === kb.join('|') && ka.every(function (k) {
                return a[k].length === b[k].length && a[k].every(function (v, i) { return close(v, b[k][i]); });
            });
        };
        if (!same(theirs, ours, function (a, b) { return Math.abs(a - b) <= 1e-9; })) {
            bad.push('#' + row.index + ' root: desktop ' + row.root + ' / ours ' + root.children.map(function (c) { return madTipNames(c).join(',') + '=' + c.branch_length; }).join(' '));
        } else if (!same(theirMad, ourMad, function (a, b) { return Math.abs(a * a - b * b) * nPairs <= 1e-6; })) {
            bad.push('#' + row.index + ' MAD values differ');
        }
    });
    if (bad.length > 0) {
        console.log('    ' + bad.length + ' of ' + rows.length + ' differ from the desktop; first: ' + bad[0]);
        return false;
    }
    // a 5,000-tip caterpillar nests too deep for recursion
    var cat = 'T0:1';
    for (var i = 1; i < 5000; ++i) {
        cat = '(' + cat + ',T' + i + ':' + (1 + (i % 7) / 10) + '):0.1';
    }
    var deep = forester.parseNewHampshire('(' + cat + ',X:2)', true, false);
    return forester.madRoot(deep) === true && forester.getAllExternalNodes(forester.getTreeRoot(deep)).length === 5001;
}

// The scale bar picks 1, 2 or 5 x 10^k so that it is about the target
// length: the rounding thresholds, the label spelling, the unusable scales.
// A New Hampshire text can hold several trees, one per ';'. They split at
// the ';' that ends a tree -- never at one inside a quoted label or a
// [&...] annotation -- and parseNewHampshireTrees reads them all, while
// parseNewHampshire reads the FIRST (it used to run them together and hand
// back the LAST, the others silently dropped).
function testMultiTreeNewHampshire() {
    var tips = function (phy) {
        return forester.getAllExternalNodes(phy).map(function (n) { return n.name; }).sort().join(',');
    };
    var two = "((a:1,b:2):3,c:4);\n\n((d,e),f)[&&NHX:C=x;y];\n";
    var parts = forester.splitNewHampshire(two);
    if (parts.length !== 2 || parts[0] !== "((a:1,b:2):3,c:4);" || parts[1] !== "((d,e),f)[&&NHX:C=x;y];") {
        console.log('    split: ' + JSON.stringify(parts));
        return false;
    }
    var quoted = forester.splitNewHampshire("('x;y',\"p;q\")r;('it''s;',b);(a,b)");
    if (quoted.length !== 3 || quoted[0] !== "('x;y',\"p;q\")r;" || quoted[1] !== "('it''s;',b);" || quoted[2] !== "(a,b)") {
        console.log('    quoted split: ' + JSON.stringify(quoted));
        return false;
    }
    if (forester.splitNewHampshire("(a,b)").length !== 1 || forester.splitNewHampshire("  \n").length !== 0) {
        return false;
    }
    var trees = forester.parseNewHampshireTrees(two, true, false);
    if (trees.length !== 2 || tips(trees[0]) !== 'a,b,c' || tips(trees[1]) !== 'd,e,f') {
        console.log('    trees: ' + trees.map(tips).join(' | '));
        return false;
    }
    if (tips(forester.parseNewHampshire(two, true, false)) !== 'a,b,c') {
        console.log('    parseNewHampshire on two trees: ' + tips(forester.parseNewHampshire(two, true, false)));
        return false;
    }
    // the annotation with the ';' inside reached its node intact
    var f = forester.getAllExternalNodes(trees[1]).filter(function (n) { return n.name === 'f'; })[0];
    var comment = (trees[1].children[0].properties || []).concat(f.properties || []).filter(function (p) { return p.ref === 'nh:comment'; })[0];
    if (!comment || comment.value !== 'x;y') {
        console.log('    NHX comment: ' + JSON.stringify(comment));
        return false;
    }
    // one tree is one tree, with or without its ';'
    return tips(forester.parseNewHampshire("((a,b),c)", true, false)) === 'a,b,c'
        && forester.parseNewHampshireTrees("((a,b),c);", true, false).length === 1;
}

function testScaleBarLength() {
    var s = forester.scaleBarLength;
    // 100 px target: 1000 px/unit -> 0.1 unit is 100 px
    var a = s(1000, 100);
    if (!a || a.length !== 0.1 || a.label !== '0.1' || Math.abs(a.px - 100) > 1e-9) { console.log('    a ' + JSON.stringify(a)); return false; }
    // 700 px/unit -> raw 0.143 -> 0.1 (base 1.43 < 1.5) -> 70 px
    var b = s(700, 100);
    if (!b || b.length !== 0.1 || Math.abs(b.px - 70) > 1e-9) { console.log('    b ' + JSON.stringify(b)); return false; }
    // 500 px/unit -> raw 0.2 -> 0.2 -> 100 px; 300 -> raw 0.333 -> 0.2 (base 3.33 < 3.5) -> 60 px
    var c = s(500, 100), d = s(300, 100);
    if (!c || c.length !== 0.2 || !d || d.length !== 0.2 || Math.abs(d.px - 60) > 1e-9) { return false; }
    // 150 px/unit -> raw 0.667 -> 0.5 (base 6.67 < 7.5) -> 75 px; 120 -> raw 0.833 -> 1 (base 8.33 -> 10 x 10^-1) -> 120 px
    var e = s(150, 100), f = s(120, 100);
    if (!e || e.length !== 0.5 || !f || f.length !== 1 || f.label !== '1' || Math.abs(f.px - 120) > 1e-9) { return false; }
    // whole units and tiny units keep a plain label
    var g = s(0.5, 100), h = s(2e6, 100);
    if (!g || g.length !== 200 || g.label !== '200' || !h || h.length !== 0.00005 || h.label !== '0.00005') { console.log('    g ' + JSON.stringify(g) + ' h ' + JSON.stringify(h)); return false; }
    // the default target is 100 px
    if (JSON.stringify(s(1000)) !== JSON.stringify(s(1000, 100))) { return false; }
    return s(0, 100) === null && s(-1, 100) === null && s(Infinity, 100) === null && s(NaN, 100) === null;
}

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
    // An unlabeled EXTERNAL node is written under a "node<N>" placeholder now,
    // N being its 1-based position in tip order -- the joint label chain
    // adopted on 2026-09-23 (Christian: "adopt the same chain and placeholder
    // in toNewHampshire"). An empty label names nothing and cannot be read
    // back out of a Nexus TaxLabels, so both programs fill it in. These
    // expectations are the DESKTOP's, taken by running theirs on the same
    // strings: "(,)" -> "(node1,node2);", "((()))" -> "(((node1)));",
    // "(((,),),)" -> "(((node1,node2),node3),node4);", "(a,)" -> "(a,node2);".
    // An unlabeled INTERNAL node stays unlabeled on both sides.
    var nh1 = "();";
    var nh1out = "(node1);";
    var nh2 = "(a);";
    var nh3 = "(a:0.000001);";
    var nh4 = "(,);";
    var nh4out = "(node1,node2);";
    var nh5 = "((a));";
    var nh6 = "(a,b);";
    var nh7 = "((a:0.001,b:0.000001),c:0.1);";
    var nh8 = "((a:0.001,b:0.000001,c:1)abc:0.1,d:0.1);";
    var nh9 = "(((a,b,c),(d,e)),f)r;";
    var nh10 = "((()));";
    var nh10out = "(((node1)));";
    var nh11 = "(((,),),);";
    var nh11out = "(((node1,node2),node3),node4);";
    // the case that separates "number the tips" from "number the placeholders":
    // one named tip, one nameless, and the nameless one is node2 because it is
    // the SECOND TIP, not the first placeholder. The desktop answers the same.
    var nh19 = "(a,);";
    var nh19out = "(a,node2);";
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
    var phy19 = forester.parseNewHampshire(nh19);
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
    if (forester.toNewHampshire(phy1) !== nh1out) {
        return false;
    }
    if (forester.toNewHampshire(phy2) !== nh2) {
        return false;
    }
    if (forester.toNewHampshire(phy3) !== nh3) {
        return false;
    }
    if (forester.toNewHampshire(phy4) !== nh4out) {
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
    if (forester.toNewHampshire(phy10) !== nh10out) {
        return false;
    }
    if (forester.toNewHampshire(phy11) !== nh11out) {
        return false;
    }
    if (forester.toNewHampshire(phy19) !== nh19out) {
        console.log('    ' + nh19 + ' -> ' + forester.toNewHampshire(phy19)
            + ', expected ' + nh19out);
        return false;
    }
    // read with double-quoted labels, written with single-quoted ones: the
    // shared rule reserves double quotes for a name holding an apostrophe
    if (forester.toNewHampshire(phy12) !== nh12.replace(/"/g, "'")) {
        return false;
    }
    if (forester.toNewHampshire(phy13) !== nh13) {
        return false;
    }
    if (forester.toNewHampshire(phy14) !== nh14) {
        return false;
    }
    // double-quoted on the way in, single-quoted on the way out: nh15 and
    // nh16 are the same three labels written the two ways, and the shared
    // rule always emits the nh16 form for a name with no apostrophe in it
    if (forester.toNewHampshire(phy15) !== nh16) {
        return false;
    }
    // the retired replaceChars argument no longer transliterates: both calls
    // go through the one shared rule and quote the space instead
    if (forester.toNewHampshire(phy16, 8, true, true) !== nh16) {
        return false;
    }
    if (forester.toNewHampshire(phy16) !== nh16) {
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
    // c[z] is quoted now rather than transliterated to c_z_
    var t22 = "((((((a,b)ab:3[2],'c[z]'):12[100],(d,e)de)abcde:13[2],f):14[0]):0[0]):0[0];";
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
    // replaceChars (the 4th argument) is retired: labels are quoted now
    // rather than transliterated to '_', which is what makes a
    // save-and-reopen keep the name. Both writers use the one rule.
    var nh00r = "('b][x');";
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
    // single quotes, not double: the desktop reserves double quotes for a
    // name that itself contains an apostrophe
    var nh2r = "(a,'b:,;()q');";
    var phy2 = forester.parseNewHampshire(nh2);
    if (forester.toNewHampshire(phy2) !== nh2r) {
        console.log(forester.toNewHampshire(phy2));
        return false;
    }

    var nh3 = '(A,x"y)z",e);';
    var nh3r = "(A,'xy)z',e);";
    var phy3 = forester.parseNewHampshire(nh3);
    if (forester.toNewHampshire(phy3) !== nh3r) {
        console.log(forester.toNewHampshire(phy3));
        return false;
    }

    var nh4 = '(a,"x)y"z,e);';
    var nh4r = "(a,'x)yz',e);";
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
    // whitespace runs collapse to one space AND the name is trimmed, per
    // the shared rule; the surrounding quotes are single for the same
    // reason as above
    var nh102r = "(aa,'b : , ; ( ) q');";
    var phy102 = forester.parseNewHampshire(nh102);
    if (forester.toNewHampshire(phy102) !== nh102r) {
        console.log(forester.toNewHampshire(phy102));
        return false;
    }

    var nh103 = '(A,x \'  y)z \', e) ;';
    var nh103r = "(A,'x y)z',e);";
    var phy103 = forester.parseNewHampshire(nh103);
    if (forester.toNewHampshire(phy103) !== nh103r) {
        console.log(forester.toNewHampshire(phy103));
        return false;
    }

    var nh104 = ' ( a , \'  x)y  \' z , e ) ; ';
    var nh104r = "(a,'x)y z',e);";
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
    var nh502r = "(a,b)'a : b'[78.01];";
    var phy502 = forester.parseNewHampshire(nh502);
    if (forester.toNewHampshire(phy502, 8, false, true) !== nh502r) {
        console.log(forester.toNewHampshire(phy502, 8, false, true));
        return false;
    }

    var nh501 = '((((("a" : 1,"b,\'":2)A\'a, :)b\'B:3[99.0] , (\'c[C C]\',"d")c":"d[12.0])"abc:d"[78.0] ,((e:2,f,g,"I would (be), illegal;")e\'\'fg[23.0],h)[12.0])"A:x":12[99.0],i),j\'(\')"r\'";';
    // double quotes ONLY where the name itself holds an apostrophe ("b,'"
    // and "r'"), single quotes everywhere else: the shared rule in one line
    var nh501r = '(((((a:1,"b,\'":2)\'Aa, :)bB\':3[99],(\'c[C C]\',d)\'c:d\'[12])\'abc:d\'[78],((e:2,f,g,\'I would (be), illegal;\')efg[23],h)[12])\'A:x\':12[99],i),\'j(\')"r\'";';
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
        "((Homo_sapiens:0.1,'Mus musculus':0.2):0.3,(Rattus:0.4,Gallus:0.5):0.6);") {
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
    // toNexus quotes labels rather than transliterating them, so the round
    // trip is LOSSLESS: 'Mus musculus' comes back with its space, not as
    // Mus_musculus. Both writers share one rule, so the two agree exactly.
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
        if (b[i].name !== a[i].name
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
    // a TIP keeps its point date AND its interval: on a Nextstrain build that
    // is the sampling-date uncertainty of a sample dated only to its month or
    // year. (It was dropped until 2026-09-17, for a display reason; the time
    // axis now tells a sampled tip from a fossil instead.)
    if (!a.date || a.date.value !== 2020.5 || a.date.minimum !== 2020.4 || a.date.maximum !== 2020.6) {
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
    // Inside an NHX tag whitespace is formatting noise, as on the desktop (its
    // Test.testNHXParsingQuotes pins "S=mo\tnkey !" -> monkey!): the tag is
    // written "S=Homo sapiens" and reads as Homosapiens. This pinned "Homo
    // sapiens" until Christian chose the desktop's behaviour (2026-09-16).
    if (!b.taxonomies || b.taxonomies[0].scientific_name !== "Homosapiens"
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
    // real FigTree writes Java's SIGNED Color.getRGB() int, not hex --
    // #-8381639 is the exact tag on all 17 coloured tips in the desktop's
    // own test_trees/influenza.tree, and must decode to no junk property
    var signed = forester.parseNewHampshire("(e[&!color=#-8381639]:1,f:1);");
    var e = forester.findByNodeName(signed, "e")[0];
    if (!e.color || e.color.red !== 128 || e.color.green !== 27 || e.color.blue !== 57
        || prop(e, "beast:_color") !== null) {
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
        // '?' is normalized to the unspecified nucleotide, as the desktop's
        // BasicSequence.createDnaSequence does -- Christian, 2026-09-23. Run
        // against their reader on this very matrix: it answers ANGCTA too.
        || gamma.sequences[0].mol_seq.value !== "ANGCTA") {
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
        || nex.indexOf("DataType=DNA") < 0) {  // ACGT-ACG; the type is read off the residues
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
    // The label chain, in full and in order: name, then taxonomy, then the
    // sequence's name/symbol/gene, then its ACCESSION, then a placeholder.
    // The expectation is the desktop's, taken by RUNNING their writer on this
    // very tree (2026-09-23): "TaxLabels P12345 recA node3 plain" and
    // "(P12345,recA,node3,plain)", byte for byte.
    var chain = forester.parseNewHampshire("(,,,);", true, false);
    var ct = forester.getAllExternalNodes(chain).reverse();
    // a tip whose ONLY identifier is an accession: it must not become "node1",
    // or the export loses the one thing that named it
    ct[0].sequences = [{accession: {value: "P12345", source: "UniProt"},
        mol_seq: {is_aligned: true, value: "MKAL"}}];
    // a taxonomy carrying nothing, beside a sequence that CAN name the tip:
    // the steps are tried in turn, so the empty taxonomy does not stop the
    // search the way an else-if chain did
    ct[1].taxonomies = [{}];
    // this one carries an accession TOO, which pins the order between the two:
    // the sequence's name wins and the accession stays a late fallback. Run
    // against the desktop with both present: it answers recA as well.
    ct[1].sequences = [{name: "recA", accession: {value: "Q00001", source: "UniProt"},
        mol_seq: {is_aligned: true, value: "MKIV"}}];
    // nothing identifying at all: the placeholder, by 1-based tip order
    ct[2].sequences = [{mol_seq: {is_aligned: true, value: "MKLL"}}];
    ct[3].name = "plain";
    ct[3].sequences = [{mol_seq: {is_aligned: true, value: "MKWW"}}];
    chain.rooted = false;
    var cnex = forester.toNexus(chain, 9, true);
    if (cnex.indexOf(" TaxLabels P12345 recA node3 plain;") < 0) {
        console.log("    label chain, TaxLabels: "
            + cnex.split("\n").filter(function (l) { return l.indexOf("TaxLabels") > -1; })[0]);
        return false;
    }
    if (cnex.indexOf("(P12345,recA,node3,plain)") < 0) {
        console.log("    label chain, trees block: "
            + cnex.split("Begin Trees;")[1]);
        return false;
    }
    // the matrix has to use the same tokens, or nothing joins back up
    if ((cnex.indexOf("  P12345  MKAL") < 0) || (cnex.indexOf("  recA    MKIV") < 0)
        || (cnex.indexOf("  node3   MKLL") < 0)) {
        console.log("    label chain, matrix rows:\n" + cnex);
        return false;
    }
    // and a NAME still beats an accession, which is the whole point of the
    // order: the accession is a late fallback, not a preference
    var named = forester.parseNewHampshire("(,);", true, false);
    var nt = forester.getAllExternalNodes(named).reverse();
    nt[0].name = "A";
    nt[0].sequences = [{accession: {value: "P99999", source: "UniProt"},
        mol_seq: {is_aligned: true, value: "MKAL"}}];
    nt[1].name = "B";
    nt[1].sequences = [{mol_seq: {is_aligned: true, value: "MKIV"}}];
    if (forester.toNexus(named, 9, true).indexOf("P99999") > -1) {
        console.log("    an accession displaced a node name");
        return false;
    }
    if (cnex.indexOf("Q00001") > -1) {
        console.log("    an accession displaced its own sequence's name");
        return false;
    }

    // protein residues judge as Protein. The capitalization is the desktop's
    // (PhylogenyWriter writes Protein / DNA / RNA / Standard) and the two
    // programs have to write the same bytes; the READER is case-insensitive,
    // which the lowercase fixtures above pin.
    var p2 = forester.parseNewHampshire("(x:1,y:1);");
    forester.getAllExternalNodes(p2).forEach(function (n) {
        n.sequences = [{mol_seq: {is_aligned: true, value: "MKVLEQW-"}}];
    });
    return forester.toNexus(p2).indexOf("DataType=Protein") > -1;
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
        || prop(c, "nh:comment") !== "anote"   // NHX whitespace is noise (see testNhxTagNoise)
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

// TreeTime output (real files from treetime 0.12.1, in test/data/treetime).
//
// TreeTime writes no BEAST height: the decimal year in "[&...,date=2003.84]"
// IS the node's place in time, so it has to reach node.date.value or the tree
// is not a time tree and no calendar axis appears. But it writes that SAME
// comment on timetree.nexus (branch lengths in YEARS) and on
// divergence_tree.nexus (branch lengths in SUBSTITUTIONS), so promoting on
// sight would hang a calendar axis -- which maps one length unit to one year
// -- on a divergence tree and disable its re-rooting. The promotion is
// therefore self-validating: it happens only where the parent-to-child date
// differences reproduce the branch lengths.
function testTreeTimeOutput() {
    var fs = require('fs');
    var pth = require('path');
    function data(name) {
        return fs.readFileSync(pth.join(__dirname, 'data', 'treetime', name), 'utf8');
    }

    // 1. timetree.nexus: dates promoted, and the desc kept alongside
    var tt = forester.parseNexus(data('timetree.nexus'), true, false)[0];
    var hawaii = forester.findByNodeName(tt, "Hawaii/02/2013")[0];
    if (!hawaii || !hawaii.date || hawaii.date.value !== 2013.41
        || hawaii.date.unit !== "year" || hawaii.date.desc !== "2013.41") {
        return false;
    }
    if (!forester.isTimeTree(tt)
        || forester.timeAxisInfo(forester.getTreeRoot(tt)).type !== "calendar") {
        return false;
    }
    // the mutations ride along under TreeTime's own namespace, not BEAST's,
    // and branch lengths are years
    var muts = (hawaii.properties || []).filter(function (p) {
        return p.ref === "treetime:mutations";
    });
    if (muts.length !== 1 || muts[0].value !== "A127G,G315A,G451R"
        || Math.abs(hawaii.branch_length - 4.3906837) > 1e-9) {
        return false;
    }

    // 2. divergence_tree.nexus: the SAME date= comments, substitution branch
    //    lengths -- so NO promotion, and emphatically not a time tree
    var dv = forester.parseNexus(data('divergence_tree.nexus'), true, false)[0];
    var promoted = 0;
    var descs = 0;
    forester.preOrderTraversal(dv, function (n) {
        if (n.date && typeof n.date.value === "number") {
            ++promoted;
        }
        if (n.date && typeof n.date.desc === "string") {
            ++descs;
        }
    });
    if (promoted !== 0 || descs < 6 || forester.isTimeTree(dv)) {
        return false;
    }
    // it is still TreeTime's, so the namespace follows the producer and not
    // the time-scaling -- both of its trees read the same way
    var dvMuts = 0;
    forester.preOrderTraversal(dv, function (n) {
        (n.properties || []).forEach(function (p) {
            if (p.ref === "treetime:mutations") {
                ++dvMuts;
            }
        });
    });
    if (dvMuts < 5) {
        return false;
    }

    // 3. auspice_tree.json: TreeTime never writes "version":"v2", and
    //    demanding the stamp rejected the one file with full-precision dates
    var au = forester.parseAuspiceJson(data('auspice_tree.json'));
    var dated = 0;
    forester.preOrderTraversal(au, function (n) {
        if (n.date && typeof n.date.value === "number") {
            ++dated;
        }
    });
    if (dated < 6 || !forester.isTimeTree(au)) {
        return false;
    }
    // ... while JSON that is not an Auspice dataset is still refused. The
    // last one carries the v2 stamp but no tree, which only the shape check
    // catches -- the implied-version branch never runs for it.
    // -- and refused with a clear message, not a crash further in.
    var refused = 0;
    ['{"x":1}', '{"tree":{"name":"a"}}', '{"meta":{},"tree":[]}',
        '{"version":"v2"}'].forEach(function (s) {
        try {
            forester.parseAuspiceJson(s);
        } catch (e) {
            if (e.message.indexOf('Auspice') >= 0) {
                ++refused;
            }
        }
    });
    if (refused !== 4) {
        return false;
    }

    // 4. a BEAST height still wins: date= stays a desc, the age is the height
    //    and the HPD is its interval (an age interval around a calendar year
    //    would draw nonsense node-age bars)
    var beast = forester.parseNewHampshire(
        '((a:1,b:1)[&height=1.2,height_95%_HPD={0.95,1.5},date=2003.84]:1,c:2);');
    var anc = forester.findByNodeName(beast, "a")[0].parent;
    if (anc.date.value !== 1.2 || anc.date.desc !== "2003.84"
        || anc.date.minimum !== 0.95 || anc.date.unit !== undefined) {
        return false;
    }
    // ... and a stated age keeps the tree in BEAST's namespace even when it
    // also carries mutations, so the shared contract cannot be renamed away
    var dual = forester.parseNewHampshire(
        '((a[&mutations="A1G"]:1,b:1)[&height=1.2,mutations="T2C"]:1,c:2);');
    var dualRefs = [];
    forester.preOrderTraversal(dual, function (n) {
        (n.properties || []).forEach(function (p) {
            dualRefs.push(p.ref);
        });
    });
    if (dualRefs.length !== 2
        || dualRefs.some(function (r) {
            return r !== "beast:mutations";
        })) {
        return false;
    }
    // ... and an annotation that names no producer at all stays generic:
    // this is TreeTime's mugration output, [&<trait>="value"] and nothing
    // else, which no rule could attribute without guessing at the trait name
    var mug = forester.parseNewHampshire(
        '((a[&region="east"]:1,b[&region="west"]:1):1,c:2);');
    var mugRefs = [];
    forester.preOrderTraversal(mug, function (n) {
        (n.properties || []).forEach(function (p) {
            mugRefs.push(p.ref);
        });
    });
    if (mugRefs.length !== 2
        || mugRefs.some(function (r) {
            return r !== "beast:region";
        })) {
        return false;
    }

    // 5. dates that do NOT reproduce the branch lengths are left as descs,
    //    whatever they look like -- this is the whole guard, in miniature
    var bogus = forester.parseNewHampshire(
        '((a[&date=2000.00]:1,b[&date=2001.00]:1)[&date=1990.00]:1,c[&date=2002.00]:1);');
    var bogusPromoted = 0;
    forester.preOrderTraversal(bogus, function (n) {
        if (n.date && typeof n.date.value === "number") {
            ++bogusPromoted;
        }
    });
    if (bogusPromoted !== 0) {
        return false;
    }

    // ... and the same shape WITH consistent lengths is promoted
    var good = forester.parseNewHampshire(
        '((a[&date=2000.00]:10,b[&date=2001.00]:11)[&date=1990.00]:1,c[&date=2002.00]:12);');
    var goodPromoted = 0;
    forester.preOrderTraversal(good, function (n) {
        if (n.date && typeof n.date.value === "number") {
            ++goodPromoted;
        }
    });
    return goodPromoted === 4;
}

// A quote character inside a [&...] blob is DATA unless it opens a quoted
// VALUE. Auspice writes values bare, so country=Côte d'Ivoire is one field with
// an apostrophe in it. Both failures this used to cause are pinned, because
// they are different bugs: ONE such tip and the quote never closed, so the
// file was refused; TWO and the apostrophes paired across the tips, with no
// error at all, the second tip gone and the first one's country swallowing the
// Newick between them. Real file: nextstrain_chikv_global_timetree.nexus.
function blobProps(nh) {
    var out = {};
    var phy = forester.parseNewHampshire(nh);
    forester.preOrderTraversalAll(phy, function (n) {
        if (!n.children && n.name) {
            out[n.name] = (n.properties || []).map(function (p) {
                return p.ref + "=" + p.value;
            }).join(" | ") + " :" + n.branch_length;
        }
    });
    return out;
}

function testBlobQuotes() {
    var cases = [
        // the odd count: used to throw
        ["(A:1[&country=Côte d'Ivoire,region=Africa],B:1);",
            {A: "beast:country=Côte d'Ivoire | beast:region=Africa :1", B: " :1"}],
        // the even count: used to read WRONG, silently, and lose tip B
        ["(A:1[&country=Côte d'Ivoire],B:2[&country=Côte d'Ivoire]);",
            {A: "beast:country=Côte d'Ivoire :1", B: "beast:country=Côte d'Ivoire :2"}],
        // a bare value that BEGINS with an apostrophe must not reach into
        // the next tip's blob for a partner
        ["(A:1[&division='s-Hertogenbosch,region=Europe],B:2[&division='s-Gravenhage]);",
            {A: "beast:division='s-Hertogenbosch | beast:region=Europe :1", B: "beast:division='s-Gravenhage :2"}],
        // The three halves of the rule mask one another on the cases above
        // (a sabotage run showed each could be removed alone and stay green),
        // so each gets a case where it is the only thing standing:
        //  - WHERE a quote may open: the second apostrophe here stands where a
        //    value can end, so only "not after '='" keeps these two fields apart
        ["(A:1[&a=rock'n,b=roll'],B:1);", {A: "beast:a=rock'n | beast:b=roll' :1", B: " :1"}],
        //  - WHERE a quote may close: the inner apostrophe is followed by a
        //    letter, so it is data and the comma after it still belongs to the value
        ["(A:1[&note='a'b,c',x=1],B:1);", {A: "beast:note=a'b,c | beast:x=1 :1", B: " :1"}],
        //    ... and the same through the EXTRACTION pass, which finds the
        //    blob's end from the runs: closing at the inner apostrophe would
        //    let that ']' end the blob (the desktop's case, run verbatim there)
        ["(A:1[&note='a'b]c',x=1],B:1);", {A: "beast:note=a'b]c | beast:x=1 :1", B: " :1"}],
        //  - the BOUND: this value opens legitimately and never closes, and the
        //    next tip's blob ends in an apostrophe that would make a fine partner
        ["(A:1[&division='s-Hertogenbosch],B:2[&k=v'],C:3);",
            {A: "beast:division='s-Hertogenbosch :1", B: "beast:k=v' :2", C: " :3"}],
        // quoted values still work, either quote, the other one inside
        ['(A:1[&country="Côte d\'Ivoire"],B:1);', {A: "beast:country=Côte d'Ivoire :1", B: " :1"}],
        ["(A:1[&country='Côte d'Ivoire',region=Africa],B:1);",
            {A: "beast:country=Côte d'Ivoire | beast:region=Africa :1", B: " :1"}],
        // ... and what a quoted value protects is still protected
        ['(A:1[&k="a,b",x=1],B:1);', {A: "beast:k=a,b | beast:x=1 :1", B: " :1"}],
        ['(A:1[&note="a]b",x=1],B:1);', {A: "beast:note=a]b | beast:x=1 :1", B: " :1"}],
        ['(A:1[&loc.set={"Hong Kong","Korea, Republic of"},x=1],B:1);',
            {A: 'beast:loc_set={"Hong Kong","Korea, Republic of"} | beast:x=1 :1', B: " :1"}]
    ];
    for (var i = 0; i < cases.length; ++i) {
        var got;
        try {
            got = blobProps(cases[i][0]);
        } catch (e) {
            console.log("    threw on " + cases[i][0] + ": " + (e.message || e));
            return false;
        }
        var sameTips = Object.keys(got).sort().join() === Object.keys(cases[i][1]).sort().join()
            && Object.keys(got).every(function (k) { return got[k] === cases[i][1][k]; });
        if (!sameTips) {
            console.log("    " + cases[i][0] + "\n      got      " + JSON.stringify(got)
                + "\n      expected " + JSON.stringify(cases[i][1]));
            return false;
        }
    }
    return true;
}

// Auspice's "download Nexus" vocabulary lands where parseAuspiceJson puts the
// same dataset (the desktop's Increment B, Christian 2026-09-16): num_date ->
// the date value with unit "year" + nextstrain:num_date; num_date_CI -> that
// date's min/max; div -> nextstrain:div. A num_date outranks every height*,
// alone carries the unit and never borrows the height's HPD; date= is still
// only a desc; what does not parse falls back to plain beast: text.
function tipA(nh) {
    return forester.findByNodeName(forester.parseNewHampshire(nh), "A")[0];
}

function refsOf(n) {
    return (n.properties || []).map(function (p) {
        return p.ref + "=" + p.value + "(" + p.datatype + ")";
    }).sort().join(" | ");
}

function testAuspiceNexusVocabulary() {
    var cases = [
        ["(A:1[&num_date=2001.5],B:1);", {value: 2001.5, unit: "year"},
            "nextstrain:num_date=2001.5(xsd:decimal)"],
        // the interval is kept on an internal node ...
        ["((X:1,Y:1)A:1[&num_date=2001.5,num_date_CI={2000.1,2002.9}],B:1);",
            {value: 2001.5, unit: "year", minimum: 2000.1, maximum: 2002.9},
            "nextstrain:num_date=2001.5(xsd:decimal)"],
        // ... and on a TIP, where it is the sampling-date uncertainty of a
        // sample dated only to its month or year (dropped until 2026-09-17,
        // when the display learnt to tell a sampled tip from a fossil)
        ["(A:1[&num_date=2001.5,num_date_CI={2000.1,2002.9}],B:1);",
            {value: 2001.5, unit: "year", minimum: 2000.1, maximum: 2002.9},
            "nextstrain:num_date=2001.5(xsd:decimal)"],
        // a tip dated to the day states {d,d}: kept as written
        ["(A:1[&num_date=2001.5,num_date_CI={2001.5,2001.5}],B:1);",
            {value: 2001.5, unit: "year", minimum: 2001.5, maximum: 2001.5},
            "nextstrain:num_date=2001.5(xsd:decimal)"],
        // an interval with no date to bracket is kept as text, and is no date
        ["(A:1[&num_date_CI={2000.1,2002.9}],B:1);", undefined,
            "nextstrain:num_date_CI={2000.1,2002.9}(xsd:string)"],
        ["(A:1[&div=0.0123],B:1);", undefined, "nextstrain:div=0.0123(xsd:decimal)"],
        // beside a height: num_date wins, keeps the unit to itself, leaves
        // the height's HPD alone -- and the height is kept, not dropped
        ["(A:1[&num_date=2001.5,height=12.3,height_95%_HPD={10,14}],B:1);",
            {value: 2001.5, unit: "year"},
            "beast:height=12.3(xsd:decimal) | beast:height_95_HPD={10,14}(xsd:string)"
            + " | nextstrain:num_date=2001.5(xsd:decimal)"],
        // no num_date: the height is the date, exactly as before
        ["(A:1[&height=12.3,height_95%_HPD={10,14}],B:1);",
            {value: 12.3, minimum: 10, maximum: 14}, ""],
        ["(A:1[&date=1995.33,height=12.3],B:1);", {value: 12.3, desc: "1995.33"}, ""],
        // unparseable: plain text, no date, the generic namespace
        ["(A:1[&num_date=abc,div=xyz],B:1);", undefined,
            "beast:div=xyz(xsd:string) | beast:num_date=abc(xsd:string)"],
        ["(A:1[&num_date=2001.5,num_date_CI=wide],B:1);", {value: 2001.5, unit: "year"},
            "beast:num_date_CI=wide(xsd:string) | nextstrain:num_date=2001.5(xsd:decimal)"]
    ];
    for (var i = 0; i < cases.length; ++i) {
        var a = tipA(cases[i][0]);
        if (JSON.stringify(a.date) !== JSON.stringify(cases[i][1]) || refsOf(a) !== cases[i][2]) {
            console.log("    " + cases[i][0] + "\n      date " + JSON.stringify(a.date)
                + " props " + refsOf(a));
            return false;
        }
        if (a._numDate !== undefined) {
            console.log("    the provisional marker leaked: " + cases[i][0]);
            return false;
        }
    }

    // THE POINT OF IT: one dataset, saved both ways, opens the same way.
    var json = forester.parseAuspiceJson({version: "v2", meta: {}, tree: {
        name: "root", node_attrs: {div: 0, num_date: {value: 2000, confidence: [1999.5, 2000.5]}},
        children: [
            {name: "A", node_attrs: {div: 0.01, num_date: {value: 2003.25, confidence: [2003, 2003.5]}}},
            {name: "B", node_attrs: {div: 0.02, num_date: {value: 2005.5}}}]}});
    var nex = forester.parseNewHampshire("(A:3.25[&num_date=2003.25,num_date_CI={2003,2003.5},div=0.01],"
        + "B:5.5[&num_date=2005.5,div=0.02])root[&num_date=2000,num_date_CI={1999.5,2000.5},div=0];");
    // Tips included: both readers keep a tip's interval. For a day this was a
    // named difference (JSON dropped it, Nexus kept it), then both dropped it,
    // and since 2026-09-17 both KEEP it -- A carries one in BOTH inputs, and it
    // must survive in both, so neither direction can come back silently.
    function dateOf(n) {
        return n.date;
    }
    var keptJ = forester.findByNodeName(json, "A")[0].date;
    var keptX = forester.findByNodeName(nex, "A")[0].date;
    if (keptJ.minimum !== 2003 || keptJ.maximum !== 2003.5 || keptX.minimum !== 2003 || keptX.maximum !== 2003.5) {
        console.log("    tip A's interval: json " + JSON.stringify(keptJ) + " nexus " + JSON.stringify(keptX));
        return false;
    }
    var names = ["A", "B", "root"];
    for (var k = 0; k < names.length; ++k) {
        var j = forester.findByNodeName(json, names[k])[0];
        var x = forester.findByNodeName(nex, names[k])[0];
        if (!j || !x || JSON.stringify(dateOf(j)) !== JSON.stringify(dateOf(x)) || refsOf(j) !== refsOf(x)) {
            console.log("    " + names[k] + ": json " + JSON.stringify(j && j.date) + " " + (j && refsOf(j))
                + "\n           nexus " + JSON.stringify(x && x.date) + " " + (x && refsOf(x)));
            return false;
        }
    }
    return forester.isTimeTree(nex) === forester.isTimeTree(json);
}

// Auspice offers the SAME annotations on its time tree and on its divergence
// tree, and a date value is what makes a tree a time tree here. So a num_date
// stands unless the tree itself says it is not time-scaled: two comparable
// pairs or more, and no strict majority of parent-to-child year differences
// reproducing the branch lengths (the tolerances promoteTimeScaledDates uses).
// Measured on real exports: measles timetree 5388/5388 pairs, chikv timetree
// 2645/2645, lassa_gpc divergence tree 169/2295 -- which, dated, got a
// calendar axis over substitutions and had its re-rooting refused.
function testNumDateOnlyOnTimeScaledTrees() {
    function tree(lengths) {
        return "((A:" + lengths[0] + "[&num_date=2003,num_date_CI={2002.5,2003.5}],B:" + lengths[1]
            + "[&num_date=2004.5])ab:" + lengths[2] + "[&num_date=2001,num_date_CI={2000.5,2001.5}],C:" + lengths[3]
            + "[&num_date=2006])root[&num_date=2000];";
    }
    function count(phy, fn) {
        var c = 0;
        forester.preOrderTraversalAll(phy, function (n) {
            if (fn(n)) {
                ++c;
            }
        });
        return c;
    }
    function hasValue(n) {
        return !!(n.date && typeof n.date.value === "number");
    }
    function hasRef(ref) {
        return function (n) {
            return (n.properties || []).some(function (p) { return p.ref === ref; });
        };
    }

    // 1. lengths in YEARS: every difference reproduces its branch -> dated
    var timed = forester.parseNewHampshire(tree([2, 3.5, 1, 6]));
    if (count(timed, hasValue) !== 5 || !forester.isTimeTree(timed)
        || forester.timeAxisInfo(forester.getTreeRoot(timed)).type !== "calendar") {
        console.log("    a time-scaled tree lost its dates: " + count(timed, hasValue) + " of 5");
        return false;
    }
    // the internal node keeps its interval, and so does the tip
    var a = forester.findByNodeName(timed, "A")[0];
    var ab = forester.findByNodeName(timed, "ab")[0];
    if (JSON.stringify(a.date) !== JSON.stringify({value: 2003, unit: "year", minimum: 2002.5, maximum: 2003.5})
        || ab.date.minimum !== 2000.5 || ab.date.maximum !== 2001.5 || ab.date.unit !== "year") {
        console.log("    A: " + JSON.stringify(a.date) + " ab: " + JSON.stringify(ab.date));
        return false;
    }

    // 2. the SAME annotations over lengths in SUBSTITUTIONS -> not dated, not a
    //    time tree, and nothing lost: the year and its interval stay as properties
    var div = forester.parseNewHampshire(tree([0.002, 0.0035, 0.001, 0.006]));
    if (count(div, hasValue) !== 0 || forester.isTimeTree(div)
        || forester.timeAxisInfo(forester.getTreeRoot(div)).type !== null) {
        console.log("    a divergence tree was dated: " + count(div, hasValue) + " values");
        return false;
    }
    // (every interval is kept there, the tip's too: with no date there is no
    // bar for it to draw, and it is just a property)
    if (count(div, hasRef("nextstrain:num_date")) !== 5 || count(div, hasRef("nextstrain:num_date_CI")) !== 2) {
        console.log("    the years were not kept: " + count(div, hasRef("nextstrain:num_date")) + " / "
            + count(div, hasRef("nextstrain:num_date_CI")));
        return false;
    }
    var da = forester.findByNodeName(div, "A")[0];
    if (da.date !== undefined || da._numDate !== undefined) {
        console.log("    A kept " + JSON.stringify(da.date));
        return false;
    }

    // 3. a STRICT majority decides, as for date=: 2 of 4 agreeing is not one
    var half = forester.parseNewHampshire(tree([2, 3.5, 0.001, 0.006]));
    if (count(half, hasValue) !== 0) {
        console.log("    2 of 4 pairs counted as a majority");
        return false;
    }
    var most = forester.parseNewHampshire(tree([2, 3.5, 1, 0.006]));
    if (count(most, hasValue) !== 5) {
        console.log("    3 of 4 pairs did not count as a majority");
        return false;
    }

    // 4. too small to say anything: a num_date is a date by its very name, so
    //    it stands (a date= would NOT be promoted here -- it needs evidence FOR)
    var tiny = forester.parseNewHampshire("(A:0.002[&num_date=2003],B:0.004[&num_date=2004])root[&num_date=2000];");
    if (count(tiny, hasValue) !== 0) {
        // two pairs, neither agreeing: evidence against
        console.log("    two disagreeing pairs were not evidence");
        return false;
    }
    var one = forester.parseNewHampshire("(A:0.002[&num_date=2003],B:0.004)root[&num_date=2000];");
    if (count(one, hasValue) !== 2) {
        console.log("    one pair was treated as evidence: " + count(one, hasValue));
        return false;
    }
    return true;
}

// A pair whose year difference AND branch length both sit inside the 0.02
// tolerance cannot tell years from substitutions: it "agrees" whatever the
// tree is measured in. On a densely sampled divergence tree such pairs pile up
// as agreement (a real H5N1 export rebuilt as its divergence tree: 3620 of 9205
// pairs, 39%), so they are left out of both counts. The desktop's own cases,
// verbatim (its testDenseTreesUninformativePairs): four uninformative pairs and
// two informative ones, and the same dates over two sets of lengths. A joint
// rule -- Christian, 2026-09-17, in both sessions.
function testUninformativeDatePairs() {
    var DIV = "((A[&D=2020.02]:0.00001,B[&D=2020.51]:0.0001)N1[&D=2020.01]:0.00002,"
        + "(C[&D=2020.52]:0.00011,D[&D=2020.02]:0.00003)N2[&D=2020.01]:0.00004)R[&D=2020.00];";
    var TIME = "((A[&D=2020.02]:0.01,B[&D=2020.51]:0.5)N1[&D=2020.01]:0.011,"
        + "(C[&D=2020.52]:0.51,D[&D=2020.02]:0.0105)N2[&D=2020.01]:0.0101)R[&D=2020.00];";
    var NONE = "((A[&D=2020.02]:0.00001,B[&D=2020.03]:0.00002)N1[&D=2020.01]:0.00003,C[&D=2020.015]:0.00004)R[&D=2020.00];";
    function values(nh) {
        var c = 0;
        forester.preOrderTraversalAll(forester.parseNewHampshire(nh), function (n) {
            if (n.date && typeof n.date.value === "number") {
                ++c;
            }
        });
        return c;
    }
    function asNumDate(nh) {
        return nh.replace(/&D=/g, "&num_date=");
    }
    function asDate(nh) {   // TreeTime's shape: a date= beside mutations, no height anywhere
        return nh.replace(/&D=/g, '&mutations="A1G",date=');
    }
    var cases = [
        // num_date: stands unless there is evidence AGAINST
        ["num_date, divergence lengths", asNumDate(DIV), 0],    // 2 informative pairs, 0 agree. The old rule
                                                                // counted 4 of 6 agreeing and DATED this tree.
        ["num_date, time lengths", asNumDate(TIME), 7],
        ["num_date, no informative pair", asNumDate(NONE), 5],  // no evidence against: stands
        // date=: promoted only on evidence FOR
        ["date=, divergence lengths", asDate(DIV), 0],
        ["date=, time lengths", asDate(TIME), 7],
        ["date=, no informative pair", asDate(NONE), 0]         // no evidence for: not promoted
    ];
    for (var i = 0; i < cases.length; ++i) {
        if (values(cases[i][1]) !== cases[i][2]) {
            console.log("    " + cases[i][0] + ": " + values(cases[i][1]) + " date values, expected " + cases[i][2]);
            return false;
        }
    }
    // the dense divergence tree is not a time tree and keeps its years as properties
    var div = forester.parseNewHampshire(asNumDate(DIV));
    var kept = 0;
    forester.preOrderTraversalAll(div, function (n) {
        if ((n.properties || []).some(function (p) { return p.ref === "nextstrain:num_date"; })) {
            ++kept;
        }
    });
    return !forester.isTimeTree(div) && kept === 7 && forester.isTimeTree(forester.parseNewHampshire(asNumDate(TIME)));
}

// A number is a plain decimal with an optional exponent -- the desktop's
// grammar. The old test was "parseFloat finite AND Number finite", and those
// two read different languages: Number() knows 0x1A / 0b101 / 0o17, parseFloat()
// stops at the letter and says 0. So a hex-looking trait was typed numeric and
// a hex-looking height dated its node at ZERO.
function testNumberGrammar() {
    function readAs(v) {
        var a = forester.findByNodeName(forester.parseNewHampshire("(A:1[&k=" + v + ",height=" + v + "],B:1);"), "A")[0];
        var p = (a.properties || []).filter(function (x) { return x.ref === "beast:k"; })[0];
        return (p ? p.datatype : "none") + "/" + (a.date ? a.date.value : "nodate");
    }
    var cases = [
        // the corner that was wrong: a literal prefix is not a number
        ["0x1A", "xsd:string/nodate"], ["0b101", "xsd:string/nodate"], ["0o17", "xsd:string/nodate"],
        // never were numbers, still are not (Java alone took 3f and 1d)
        ["3f", "xsd:string/nodate"], ["1d", "xsd:string/nodate"], ["12abc", "xsd:string/nodate"],
        ["1_000", "xsd:string/nodate"], ["Infinity", "xsd:string/nodate"], ["NaN", "xsd:string/nodate"],
        ["1e400", "xsd:string/nodate"],   // well-formed, and still not a number we can use
        // numbers, every ordinary spelling of one
        ["12", "xsd:decimal/12"], ["-2", "xsd:decimal/-2"], ["+2", "xsd:decimal/2"], [".5", "xsd:decimal/0.5"],
        ["5.", "xsd:decimal/5"], ["1e5", "xsd:decimal/100000"], ["1E-3", "xsd:decimal/0.001"],
        ["0", "xsd:decimal/0"], ["0.0", "xsd:decimal/0"]
    ];
    for (var i = 0; i < cases.length; ++i) {
        if (readAs(cases[i][0]) !== cases[i][1]) {
            console.log("    " + cases[i][0] + " read as " + readAs(cases[i][0]) + ", expected " + cases[i][1]);
            return false;
        }
    }
    // the same test types the Auspice JSON reader's scalars
    var j = forester.parseAuspiceJson({version: "v2", meta: {}, tree: {name: "r", node_attrs: {},
        children: [{name: "A", node_attrs: {batch: {value: "0x1A"}, n: {value: "12"}}}, {name: "B", node_attrs: {}}]}});
    var ja = forester.findByNodeName(j, "A")[0];
    var types = (ja.properties || []).map(function (p) { return p.ref + ":" + p.datatype; }).sort().join(" ");
    if (types !== "nextstrain:batch:xsd:string nextstrain:n:xsd:decimal") {
        console.log("    JSON scalars typed as " + types);
        return false;
    }

    // THE ZERO TRAP (the desktop lost two sabotages to it): every BEAST tip is
    // height=0, and 0 is a stated age. Read through a truthiness test it would
    // vanish, and this tree -- mutations present, "no age" -- would be renamed
    // TreeTime's. It is BEAST's, and its three tips are dated at 0.
    var z = forester.parseNewHampshire('((A:1[&mutations="A1G",height=0.0],B:1[&height=0.0]):1,C:1[&height=0.0]);');
    var za = forester.findByNodeName(z, "A")[0];
    var zeros = 0;
    forester.preOrderTraversalAll(z, function (n) {
        if (n.date && n.date.value === 0) {
            ++zeros;
        }
    });
    if (zeros !== 3 || (za.properties || []).map(function (p) { return p.ref; }).join() !== "beast:mutations") {
        console.log("    height=0: " + zeros + " tips dated at 0, A has "
            + (za.properties || []).map(function (p) { return p.ref; }).join());
        return false;
    }
    // ... and a YEAR of exactly 0 is a year: it counts as a pair and is dated
    var y = forester.parseNewHampshire("((A:2[&num_date=2],B:3[&num_date=3])ab:0[&num_date=0],C:5[&num_date=5])root[&num_date=0];");
    var dated = 0;
    forester.preOrderTraversalAll(y, function (n) {
        if (n.date && typeof n.date.value === "number") {
            ++dated;
        }
    });
    if (dated !== 5) {
        console.log("    years of 0: " + dated + " of 5 dated");
        return false;
    }

    // A key starting with '!' is a FigTree display DIRECTIVE, never a
    // measurement: kept, under the same ref, always as text. It matters for the
    // colour forms we refuse -- !color=-8381639 (no '#') used to become a numeric
    // trait and Color-by offered FigTree's paint as a gradient. The desktop's
    // own case, verbatim; a user's trait called "color" stays a trait.
    var d = forester.findByNodeName(forester.parseNewHampshire("(A:1[&!color=-8381639,!rotate=1,color=3],B:1);"), "A")[0];
    var dt = (d.properties || []).map(function (p) { return p.ref + "=" + p.value + ":" + p.datatype; }).sort().join(" ");
    if (dt !== "beast:_color=-8381639:xsd:string beast:_rotate=1:xsd:string beast:color=3:xsd:decimal" || d.color !== undefined) {
        console.log("    directives: " + dt + " colour " + JSON.stringify(d.color));
        return false;
    }
    // ... and a colour we DO read is the branch colour and leaves no property
    var ok = forester.findByNodeName(forester.parseNewHampshire("(A:1[&!color=#-8381639],B:1[&!color=80171b]);"), "A")[0];
    var nb = forester.findByNodeName(forester.parseNewHampshire("(A:1[&!color=#-8381639],B:1[&!color=80171b]);"), "B")[0];
    if (!ok.color || ok.color.red !== 128 || (ok.properties || []).length !== 0
        || nb.color !== undefined || nb.properties[0].ref !== "beast:_color" || nb.properties[0].datatype !== "xsd:string") {
        console.log("    accepted / refused: " + JSON.stringify(ok.color) + " " + JSON.stringify(ok.properties)
            + " | " + JSON.stringify(nb.color) + " " + JSON.stringify(nb.properties));
        return false;
    }

    // mutations and mcc are TEXT whatever they look like, as on the desktop: a
    // clade label that happens to be "3" is not a measurement
    var m = forester.findByNodeName(forester.parseNewHampshire('(A:1[&mutations="123",mcc=3,rate=3],B:1);'), "A")[0];
    var mt = (m.properties || []).map(function (p) { return p.ref + ":" + p.datatype; }).sort().join(" ");
    if (mt !== "treetime:mcc:xsd:string treetime:mutations:xsd:string treetime:rate:xsd:decimal") {
        console.log("    mutations / mcc typed as " + mt);
        return false;
    }
    return true;
}

// Inside a legacy [&&NHX:...] tag whitespace and both quote styles are
// formatting noise, as they always were on the desktop (Christian, 2026-09-16:
// "do what desktop does"). The opposite of a single-& blob, where both are
// DATA -- and the second half of this test is that the squeeze never reaches one.
function testNhxTagNoise() {
    function sci(nh) {
        var a = forester.findByNodeName(forester.parseNewHampshire(nh), "A")[0];
        return a.taxonomies ? a.taxonomies[0].scientific_name : undefined;
    }
    // The desktop's own measurements (2026-09-16), case for case. It reads an
    // NHX tag by its LABEL rule: unquoted whitespace is noise, a quoted run
    // keeps its content. My first version squeezed everything, from an
    // inference off the last case alone, and had homosapiens for the quoted
    // forms -- the one way to write a two-word species, lost.
    var cases = [
        ["(A:1[&&NHX:S='homo'],B:1);", "homo"],
        ['(A:1[&&NHX:S="homo"],B:1);', "homo"],
        ["(A:1[&&NHX:S=Homo sapiens],B:1);", "Homosapiens"],
        ['(A:1[&&NHX:S="homo sapiens"],B:1);', "homo sapiens"],
        ["(A:1[&&NHX:S='homo sapiens'],B:1);", "homo sapiens"],
        ['(A:1[&&NHX:S="homo  sapiens"],B:1);', "homo sapiens"],      // a run of spaces is one
        ["(A:1[&&NHX:S=Homo 'sapiens x' y],B:1);", "Homosapiens xy"],
        ['(A:1[ & & NHX : S = "homo sapiens" ],B:1);', "homo sapiens"],
        // the desktop's own pinned case: noise INSIDE the "&&NHX:" itself. We
        // used not to recognise this as an NHX tag at all.
        ["(A:1[\t&\t&\n N\tH\tX:S=mo\tnkey !],B:1);", "monkey!"]
    ];
    for (var i = 0; i < cases.length; ++i) {
        if (sci(cases[i][0]) !== cases[i][1]) {
            console.log("    " + JSON.stringify(cases[i][0]) + " -> " + sci(cases[i][0]));
            return false;
        }
    }
    // a quoted run may carry the ':' that would otherwise end the tag, and the
    // tag after it is still read
    var q = forester.findByNodeName(forester.parseNewHampshire('(A:1[&&NHX:S="a:b c":D=Y],B:1);'), "A")[0];
    if (!q.taxonomies || q.taxonomies[0].scientific_name !== "a:b c" || !q.events || q.events.duplications !== 1) {
        console.log("    a quoted ':' : " + JSON.stringify(q.taxonomies) + " " + JSON.stringify(q.events));
        return false;
    }
    var a = forester.findByNodeName(forester.parseNewHampshire(
        '(A:1[&country=Democratic Republic of the Congo,note="it\'s here"],B:1);'), "A")[0];
    var got = (a.properties || []).map(function (p) { return p.ref + "=" + p.value; }).join(" | ");
    if (got !== "beast:country=Democratic Republic of the Congo | beast:note=it's here") {
        console.log("    a single-& blob was squeezed: " + got);
        return false;
    }
    return true;
}

// A colour FigTree gives a TAXON -- 'name'[&!color=...] in the TAXLABELS block
// -- is the colour of that tip's LABEL (FigTree's own meaning, and the
// desktop's), where a !color in the tree string is the BRANCH's. It lands as
// the desktop's style:font_color property, which Visual Styles already draws.
// The annotation used to be glued onto the label instead, which was invisible
// while a tree spelled its tips out and wrong the moment it used numbers.
// Real file: the desktop's test_trees/influenza.tree, 17 tags, all #-8381639.
function testTaxlabelColours() {
    function fontColour(n) {
        var p = (n.properties || []).filter(function (x) { return x.ref === "style:font_color"; })[0];
        return p ? p.value + "/" + p.datatype + "/" + p.applies_to : null;
    }
    var head = "#NEXUS\nbegin taxa;\n\tdimensions ntax=3;\n\ttaxlabels\n"
        + "\t'New York'[&!color=#-8381639]\n\tParis[&!color=#16ce60]\n\t[a plain comment]Rome[!color=#ff0000]\n;\nend;\n";
    // (Rome's bracket has no '&': it is an ordinary Nexus comment, however much
    // it looks like a colour, and must neither colour Rome nor stay on its name)
    // 1. tips spelled out, one of them also carrying a BRANCH colour
    var named = forester.parseNexus(head + "begin trees;\n\ttree t = (('New York':1,Paris:1[&!color=#ff0000]):1,Rome:2);\nend;\n")[0];
    // 2. tips referred to by NUMBER: the labels must come out clean
    var numbered = forester.parseNexus(head + "begin trees;\n\ttree t = ((1:1,2:1):1,3:2);\nend;\n")[0];
    var trees = [named, numbered];
    for (var i = 0; i < trees.length; ++i) {
        var ny = forester.findByNodeName(trees[i], "New York")[0];
        var paris = forester.findByNodeName(trees[i], "Paris")[0];
        var rome = forester.findByNodeName(trees[i], "Rome")[0];
        if (!ny || !paris || !rome) {
            var names = [];
            forester.preOrderTraversalAll(trees[i], function (n) {
                if (!n.children && n.name) {
                    names.push(n.name);
                }
            });
            console.log("    tree " + (i + 1) + ": the labels are not clean: " + names.join(" | "));
            return false;
        }
        // -8381639 is 0xFF801B39: alpha dropped, the rest #801b39
        if (fontColour(ny) !== "#801b39/xsd:token/node" || fontColour(paris) !== "#16ce60/xsd:token/node"
            || fontColour(rome) !== null) {
            console.log("    tree " + (i + 1) + ": " + fontColour(ny) + " | " + fontColour(paris) + " | " + fontColour(rome));
            return false;
        }
        if (JSON.stringify(forester.nodeVisualStyle(ny)) !== JSON.stringify({fontColor: "#801b39"})) {
            console.log("    Visual Styles does not see it: " + JSON.stringify(forester.nodeVisualStyle(ny)));
            return false;
        }
    }
    // the taxon is found by its exact name, else by the Nexus join key
    // (case-insensitive, '_' for ' ') -- as a matrix row finds its tip
    var loose = forester.parseNexus("#NEXUS\nbegin taxa;\n\ttaxlabels\n\tNew_York[&!color=#16ce60]\n\tParis\n;\nend;\n"
        + "begin trees;\n\ttree t = ('new york':1,Paris:1);\nend;\n")[0];
    if (fontColour(forester.findByNodeName(loose, "new york")[0]) !== "#16ce60/xsd:token/node") {
        console.log("    join key: " + fontColour(forester.findByNodeName(loose, "new york")[0]));
        return false;
    }
    // a TAXLABELS colour we cannot read (no '#') colours nothing and is kept on
    // the tip as text, exactly as a refused one in the tree string is
    var refused = forester.parseNexus("#NEXUS\nbegin taxa;\n\ttaxlabels\n\tA[&!color=-8381639]\n\tB\n;\nend;\n"
        + "begin trees;\n\ttree t = (A:1,B:1);\nend;\n")[0];
    var ra = forester.findByNodeName(refused, "A")[0];
    var rp = (ra.properties || []).map(function (p) { return p.ref + "=" + p.value + ":" + p.datatype; }).join(" ");
    if (rp !== "beast:_color=-8381639:xsd:string" || fontColour(ra) !== null
        || (forester.findByNodeName(refused, "B")[0].properties || []).length !== 0) {
        console.log("    a refused TAXLABELS colour: " + rp);
        return false;
    }
    // ... but by the key ONLY when it names exactly one taxlabel. Two labels
    // that differ in case alone share a key: the unannotated one must not take
    // its neighbour's colour (it did), two annotated ones keep their own, and
    // a tip that matches both by key alone is ambiguous and gets none.
    function coloursOf(taxa, newick) {
        var tr = forester.parseNexus("#NEXUS\nbegin taxa;\n\ttaxlabels\n" + taxa + "\n;\nend;\nbegin trees;\n\ttree t = "
            + newick + ";\nend;\n")[0];
        var o = [];
        forester.preOrderTraversalAll(tr, function (n) {
            if (!n.children && n.name) {
                o.push(n.name + "=" + (fontColour(n) || "none").split("/")[0]);
            }
        });
        return o.sort().join(" ");
    }
    var collisions = [
        ["\tTaxon_A[&!color=#-65536]\n\ttaxon_a", "(Taxon_A:1,taxon_a:1)", "Taxon_A=#ff0000 taxon_a=none"],
        ["\tTaxon_A[&!color=#ff0000]\n\ttaxon_a[&!color=#0000ff]", "(Taxon_A:1,taxon_a:1)", "Taxon_A=#ff0000 taxon_a=#0000ff"],
        ["\tTaxon_A[&!color=#ff0000]\n\ttaxon_a[&!color=#0000ff]", "('Taxon a':1,X:1)", "Taxon a=none X=none"],
        // a quoted label holding a bracket, and an annotation holding spaces:
        // the taxa stay three, so numbered tips land on the right names
        ["\t'A'[&!color=#ff0000,note=\"x y  z\"] 'B[1' C", "((1:1,2:1):1,3:1)", "A=#ff0000 B[1=none C=none"]
    ];
    for (var ci = 0; ci < collisions.length; ++ci) {
        if (coloursOf(collisions[ci][0], collisions[ci][1]) !== collisions[ci][2]) {
            console.log("    " + collisions[ci][1] + " -> " + coloursOf(collisions[ci][0], collisions[ci][1])
                + ", expected " + collisions[ci][2]);
            return false;
        }
    }
    // ONE TREE, ONE NAMESPACE. The refused colour is hung on its tip after the
    // tree string has been parsed -- and renamed, if it is TreeTime's -- so it
    // used to stay beast: beside treetime:mutations. (The desktop found this on
    // its side, by running the question I had only assumed the answer to.)
    var tt = forester.parseNexus("#NEXUS\nbegin taxa;\n\ttaxlabels\n\tA[&!color=-8381639]\n\tB\n;\nend;\n"
        + 'begin trees;\n\ttree t = (A:1[&mutations="A1G"],B:1[&mutations="C2T"]);\nend;\n')[0];
    var ttRefs = [];
    forester.preOrderTraversalAll(tt, function (n) {
        (n.properties || []).forEach(function (p) { ttRefs.push(p.ref); });
    });
    if (ttRefs.sort().join(" ") !== "treetime:_color treetime:mutations treetime:mutations") {
        console.log("    a TreeTime tree with a refused taxlabel colour: " + ttRefs.join(" "));
        return false;
    }
    // ... and that is decided PER TREE: a BEAST tree sitting between two
    // TreeTime trees in one file keeps beast:, whatever its neighbours took
    // (the one place the desktop's review said this could go wrong: scope)
    var mixed = forester.parseNexus("#NEXUS\nbegin taxa;\n\ttaxlabels\n\tA[&!color=-8381639]\n\tB\n;\nend;\nbegin trees;\n"
        + '\ttree one = (A:1[&mutations="A1G"],B:1[&mutations="C2T"]);\n'
        + "\ttree two = (A:1[&rate=0.5,height=0.0],B:1[&height=0.0]);\n"
        + '\ttree three = (A:1[&mutations="G5T"],B:1);\nend;\n');
    var took = mixed.map(function (tr) {
        return (forester.findByNodeName(tr, "A")[0].properties || []).map(function (p) { return p.ref; }).join("+");
    }).join(" | ");
    if (took !== "treetime:mutations+treetime:_color | beast:rate+beast:_color | treetime:mutations+treetime:_color") {
        console.log("    per tree: " + took);
        return false;
    }
    // the two colours are different things and do not touch: Paris's BRANCH
    // is red from the tree string, its LABEL green from the TAXLABELS block
    var p1 = forester.findByNodeName(named, "Paris")[0];
    if (!p1.color || p1.color.red !== 255 || p1.color.green !== 0
        || forester.findByNodeName(named, "New York")[0].color !== undefined) {
        console.log("    branch colour: " + JSON.stringify(p1.color));
        return false;
    }
    return true;
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

// Quoted Nexus labels containing spaces (TaxLabels) and commas (Translate)
// are what quoting EXISTS for -- both used to be sheared apart silently,
// shifting every numeric tip onto the wrong name. A trailing comma before
// the Translate ';' is tolerated; an empty tree refuses to serialize.
function testNexusQuotedLabels() {
    var t = forester.parseNexus("#NEXUS\nBegin Taxa;\n TaxLabels 'Homo sapiens' \"Mus musculus\" Chicken;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,(2:1,3:1):1);\nEnd;\n")[0];
    var names = forester.getAllExternalNodes(t).map(function (n) { return n.name; }).sort();
    if (names.join('|') !== 'Chicken|Homo sapiens|Mus musculus') {
        console.log('    taxlabels: ' + names.join('|'));
        return false;
    }
    var u = forester.parseNexus("#NEXUS\nBegin Trees;\n Translate\n  1 'Korea, Republic of',\n  2 beta;\n"
        + " Tree t=(1:1,2:1);\nEnd;\n")[0];
    var un = forester.getAllExternalNodes(u).map(function (n) { return n.name; }).sort();
    if (un.join('|') !== 'Korea, Republic of|beta') {
        console.log('    translate: ' + un.join('|'));
        return false;
    }
    var v = forester.parseNexus("#NEXUS\nBegin Trees;\n Translate 1 alpha, 2 beta,;\n Tree t=(1:1,2:1);\nEnd;\n")[0];
    if (forester.getAllExternalNodes(v).length !== 2) {
        return false;
    }
    // A bare apostrophe inside an UNQUOTED label is just a character: it must
    // not open a quoted run and swallow the rest of the line, terminating ';'
    // included. That regression merged every remaining label into one and left
    // the other tips as bare numbers.
    var w = forester.parseNexus("#NEXUS\nBegin Taxa;\n TaxLabels O'Neil Homo Pan;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,(2:1,3:1):1);\nEnd;\n")[0];
    var wn = forester.getAllExternalNodes(w).map(function (n) { return n.name; }).sort();
    if (wn.join('|') !== 'Homo|ONeil|Pan') {
        console.log('    bare apostrophe: ' + wn.join('|'));
        return false;
    }
    // A DOUBLED quote does not end the run, so a quoted label keeps its space
    // and stays ONE label -- AND the escape un-doubles to one literal quote,
    // so the apostrophe survives. Keeping the label whole was N1; recovering
    // the character was J0, landed once the desktop and JS could do it
    // together (desktop 0.11.141).
    var x = forester.parseNexus("#NEXUS\nBegin Taxa;\n TaxLabels 'Seba''s bat' Homo;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,2:1);\nEnd;\n")[0];
    var xn = forester.getAllExternalNodes(x).map(function (n) { return n.name; }).sort();
    if (xn.join('|') !== "Homo|Seba's bat") {
        console.log('    doubled quote: ' + xn.join('|'));
        return false;
    }
    var threw = false;
    try { forester.toNexus({children: []}); } catch { threw = true; }
    return threw;
}

// A bare integer tip is a TAXLABELS index only when the WHOLE tree reads as
// index references. Deciding it per tip is silent and plausible-looking: a
// mixed tree came back with every tip DUPLICATED, and one out-of-range index
// left a half-renamed tree behind. Both are reachable through our own writer
// (save as Nexus, reopen), so this guards a data-integrity path, not a wart.
function testNexusNumericTips() {
    function tips(nexus) {
        return forester.getAllExternalNodes(forester.parseNexus(nexus)[0])
            .map(function (n) { return n.name; }).sort().join('|');
    }
    // The capability itself must survive: an all-in-range index tree resolves.
    var ok = tips("#NEXUS\nBegin Taxa;\n TaxLabels a b c;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,2:1,3:1);\nEnd;\n");
    if (ok !== 'a|b|c') {
        console.log('    index tree: ' + ok);
        return false;
    }
    // ONE out-of-range index disables the whole tree rather than renaming the
    // tips that happen to be in range.
    var oor = tips("#NEXUS\nBegin Taxa;\n TaxLabels a b c;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,2:1,99:1);\nEnd;\n");
    if (oor !== '1|2|99') {
        console.log('    out of range: ' + oor);
        return false;
    }
    // Nexus indices are 1-based, so 0 is not a valid one: it disables the
    // tree like any other out-of-range value rather than reaching behind the
    // start of the list.
    var zero = tips("#NEXUS\nBegin Taxa;\n TaxLabels a b c;\nEnd;\n"
        + "Begin Trees;\n Tree t=(0:1,1:1,2:1);\nEnd;\n");
    if (zero !== '0|1|2') {
        console.log('    zero index: ' + zero);
        return false;
    }
    // A tree that mixes real names with integers is not an index tree. This
    // used to return a|a|b|b|c|c -- three tips silently becoming copies of
    // three others.
    var mixed = tips("#NEXUS\nBegin Taxa;\n TaxLabels a b c d e f;\nEnd;\n"
        + "Begin Trees;\n Tree t=((a:1,b:1,c:1):1,(1:1,2:1,3:1):1);\nEnd;\n");
    if (mixed !== '1|2|3|a|b|c') {
        console.log('    mixed tree: ' + mixed);
        return false;
    }
    // The path a user actually reaches: save as Nexus, reopen. The tip names
    // must survive unchanged, with no duplicates introduced.
    var src = forester.parseNewHampshire("((a:1,b:1,c:1):1,(1:1,2:1,3:1):1);");
    var before = forester.getAllExternalNodes(src)
        .map(function (n) { return n.name; }).sort().join('|');
    var after = tips(forester.toNexus(src));
    if (before !== after) {
        console.log('    round trip: ' + before + ' -> ' + after);
        return false;
    }
    // A TRANSLATE entry is the explicit mechanism and still wins.
    var tr = tips("#NEXUS\nBegin Taxa;\n TaxLabels a b c;\nEnd;\n"
        + "Begin Trees;\n Translate 1 Alpha, 2 Beta, 3 Gamma;\n Tree t=(1:1,2:1,3:1);\nEnd;\n");
    return tr === 'Alpha|Beta|Gamma';
}

// The boilerplate prefix that Short Names strips. A strict longest-common
// prefix let a handful of oddly-named tips veto the strip for everyone, so
// the rule is now "shared by at least COMMON_PREFIX_QUANTILE of the tips".
// The two threshold cases below sit either side of that constant on purpose:
// 19 of 20 must fire and 18 of 20 must not, so changing the constant breaks
// one of them. It is byte-identical to the desktop's rule -- joint, not ours
// alone to retune.
function testCommonNamePrefix() {
    function prefixOf(names) {
        var nh = '(' + names.map(function (n) { return n + ':1'; }).join(',') + ');';
        return forester.commonNamePrefix(forester.parseNewHampshire(nh), null);
    }
    var i;
    // Every tip shares it: unchanged from the strict-LCP behaviour, and the
    // word-split trim still pulls back to the separator rather than cutting
    // "isolate" in half.
    var all = [];
    for (i = 0; i < 10; ++i) { all.push('Influenza_A_virus_isolate' + i); }
    if (prefixOf(all) !== 'Influenza_A_virus_') {
        console.log('    all share: ' + prefixOf(all));
        return false;
    }
    // 19 of 20 carry it -- exactly at the threshold, so it fires. This is the
    // reported BV-BRC shape: a large majority sharing long boilerplate that a
    // tiny minority used to veto outright.
    var majority = [];
    for (i = 0; i < 19; ++i) { majority.push('Alphainfluenzavirus|influenzae|A/x' + i); }
    majority.push('A/other');
    if (prefixOf(majority) !== 'Alphainfluenzavirus|influenzae|A/') {
        console.log('    majority: ' + prefixOf(majority));
        return false;
    }
    // 18 of 20 is below the threshold and must REFUSE. Stripping here would
    // leave two groups of tips that cannot be read against each other: 18
    // shortened, 2 at full length.
    var below = [];
    for (i = 0; i < 18; ++i) { below.push('SARS_CoV_2/human/USA/S' + i + '/2021'); }
    below.push('2019_nCoV/Japan/TY/WK1/2020');
    below.push('2019_nCoV/Japan/TY/WK2/2020');
    if (prefixOf(below) !== '') {
        console.log('    below threshold: ' + prefixOf(below));
        return false;
    }
    // The word-split trim consults only the tips that CARRY the prefix. One
    // unrelated longer tip must not get a vote on whether the prefix splits a
    // word -- letting it vote throws "ABCDEFG" away entirely.
    var carriers = [];
    for (i = 0; i < 10; ++i) { carriers.push('ABCDEFG_sample' + i); }
    for (i = 0; i < 9; ++i) { carriers.push('ABCDEFG-sample' + i); }
    carriers.push('ZZZZZZZZ_unrelated_and_longer');
    if (prefixOf(carriers) !== 'ABCDEFG') {
        console.log('    carriers only: ' + prefixOf(carriers));
        return false;
    }
    // Still only worth doing when the prefix is long enough to matter.
    var short = [];
    for (i = 0; i < 10; ++i) { short.push('ab_x' + i); }
    return prefixOf(short) === '';
}

// Nexus/Newick quoting escapes a literal quote by DOUBLING it, so reading a
// label back means removing one matching outer pair and un-doubling what is
// inside. Every one of these used to lose the apostrophe outright. Keeping the
// label in one piece was N1; recovering the character is J0, landed with the
// desktop (0.11.141) so the two readers agree.
function testNexusUnquoting() {
    function tips(nexus) {
        return forester.getAllExternalNodes(forester.parseNexus(nexus)[0])
            .map(function (n) { return n.name; }).sort().join('|');
    }
    var TAX = "#NEXUS\nBegin Taxa;\n TaxLabels 'Seba''s bat' Homo;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,2:1);\nEnd;\n";
    if (tips(TAX) !== "Homo|Seba's bat") {
        console.log('    taxlabels: ' + tips(TAX));
        return false;
    }
    var TRANS = "#NEXUS\nBegin Trees;\n Translate 1 'Seba''s bat', 2 Homo;\n"
        + " Tree t=(1:1,2:1);\nEnd;\n";
    if (tips(TRANS) !== "Homo|Seba's bat") {
        console.log('    translate: ' + tips(TRANS));
        return false;
    }
    var named = forester.parseNexus("#NEXUS\nBegin Trees;\n Tree 'O''Neil tree'=(a:1,b:1);\nEnd;\n")[0];
    if (named.name !== "O'Neil tree") {
        console.log('    tree name: ' + named.name);
        return false;
    }
    var nh = forester.getAllExternalNodes(forester.parseNewHampshire("('Seba''s bat':1,Homo:1);"))
        .map(function (n) { return n.name; }).sort().join('|');
    if (nh !== "Homo|Seba's bat") {
        console.log('    nh scanner: ' + nh);
        return false;
    }
    // Two escapes in a row un-double to TWO literal quotes. A pass that strips
    // quotes wholesale, or one that un-doubles only once, loses them.
    var TWO = "#NEXUS\nBegin Taxa;\n TaxLabels 'a''''b c' Homo;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,2:1);\nEnd;\n";
    if (tips(TWO) !== "Homo|a''b c") {
        console.log('    two escapes: ' + tips(TWO));
        return false;
    }
    // Double quotes escape the same way.
    var dq = forester.getAllExternalNodes(forester.parseNewHampshire('("Seba""s bat":1,Homo:1);'))
        .map(function (n) { return n.name; }).sort().join('|');
    if (dq !== 'Homo|Seba"s bat') {
        console.log('    double quotes: ' + dq);
        return false;
    }
    // A quote in the middle of an UNQUOTED token is not an escape -- an
    // unquoted token may not legally hold one -- and is still dropped. This is
    // SHARED with the desktop, so keeping it would be a new divergence.
    var BARE = "#NEXUS\nBegin Taxa;\n TaxLabels O'Neil Homo Pan;\nEnd;\n"
        + "Begin Trees;\n Tree t=(1:1,(2:1,3:1):1);\nEnd;\n";
    if (tips(BARE) !== 'Homo|ONeil|Pan') {
        console.log('    bare apostrophe: ' + tips(BARE));
        return false;
    }
    // Not well-formed -> stay lenient, drop stray quotes, never throw: a
    // viewer that refuses to open a file teaches the user nothing, and Nexus
    // in the wild is written by many programs. (An unterminated quote in
    // NEWICK is a different matter and still throws -- it swallows the
    // closing paren, so the failure is structural rather than a quoting
    // decision. That predates this change and is not altered by it.)
    var threw = false;
    try {
        tips("#NEXUS\nBegin Taxa;\n TaxLabels 'Seba Homo;\nEnd;\n"
            + "Begin Trees;\n Tree t=(1:1,2:1);\nEnd;\n");
        tips("#NEXUS\nBegin Trees;\n Translate 1 'Seba''s, 2 Homo;\n"
            + " Tree t=(1:1,2:1);\nEnd;\n");
    } catch {
        threw = true;
    }
    return threw === false;
}

// phyloXML lets a file carry elements from other namespaces (the schema's
// ##other wildcard) and puts them LAST, after the clade. This reader models
// none of them and must simply ignore them.
//
// It used to fail two different ways there. <flu_type> had a HARDCODED
// handler (removed 2026-09-10) that assumed the element appeared before the
// clade, where the schema does not allow it; at the position the schema does
// require, it fired with an empty object stack and killed the parse of a
// perfectly valid file. Separately, the text dispatcher itself reached into
// that empty stack, which is now guarded.
function testPhyloXmlForeignNamespace() {
    var px = require('./lib/phyloxml').phyloXml;
    var HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<phyloxml xmlns="http://www.phyloxml.org">\n <phylogeny rooted="true">\n'
        + '  <clade><clade><name>A</name></clade><clade><name>B</name></clade></clade>\n';
    var TAIL = ' </phylogeny>\n</phyloxml>\n';
    function parse(extra) {
        return px.parse(HEAD + extra + TAIL, {trim: true, normalize: true})[0];
    }
    function parseBefore(extra) {
        // BEFORE the clade -- the position those IRD files used to use, and
        // the only one where the old hardcoded handler could actually fire,
        // since after the clade the object stack is empty and the guard
        // short-circuits first.
        return px.parse(HEAD.replace('  <clade>', extra + '  <clade>') + TAIL,
            {trim: true, normalize: true})[0];
    }
    function tips(t) {
        return forester.getAllExternalNodes(t).map(function (n) { return n.name; }).sort().join('|');
    }
    // an extension subtree after the tree, in its own namespace: schema-valid,
    // and this reader has no use for it
    if (tips(parse('  <Stuff xmlns="urn:x-ext"><Thing>t</Thing></Stuff>\n')) !== 'A|B') {
        return false;
    }
    // the same written with a prefix rather than a default namespace
    if (tips(parse('  <e:Stuff xmlns:e="urn:x-ext"><e:Thing>t</e:Thing></e:Stuff>\n')) !== 'A|B') {
        return false;
    }
    // flu_type is now an element like any other this reader does not model:
    // ignored, and no longer resurrecting phylogeny.desc
    var f = parse('  <flu_type xmlns="urn:x-ext">A</flu_type>\n');
    if (f.desc !== undefined || tips(f) !== 'A|B') {
        return false;
    }
    // and bare, in the phyloXML namespace, where those files used to carry it
    var bare = parse('  <flu_type>A</flu_type>\n');
    if (bare.desc !== undefined || tips(bare) !== 'A|B') {
        return false;
    }
    // The position where the removed handler DID fire: before the clade, with
    // the phylogeny still on the stack. It must now be ignored there too,
    // rather than quietly setting phylogeny.desc.
    var early = parseBefore('  <flu_type>A</flu_type>\n');
    if (early.desc !== undefined || tips(early) !== 'A|B') {
        return false;
    }
    // A MALFORMED file must not crash the reader either. A stray <name> after
    // the clade is not schema-valid, but it is the case that reaches the text
    // dispatcher with nothing on the object stack -- without the guard this
    // throws rather than returning a tree.
    return tips(parse('  <name>stray</name>\n')) === 'A|B';
}

// How a label is WRITTEN. Both writers share one rule, ported from the
// desktop, and it quotes rather than transliterating: the old rule mapped
// every space, comma, paren and quote to '_', which no reader can undo, so a
// tip named "Cooper's Hawk" was saved as Cooper_s_Hawk and came back that way.
// 28 of the 49 real trees in this repo lost a tip name to that; none do now.
function testLabelQuotingOnWrite() {
    var SQ = String.fromCharCode(39);
    var DQ = String.fromCharCode(34);
    function withTip(name) {
        var t = forester.parseNewHampshire('(X:1,Homo:1);');
        forester.getAllExternalNodes(t).forEach(function (n) {
            if (n.name === 'X') { n.name = name; }
        });
        return t;
    }
    function roundTrip(name) {
        var back = forester.getAllExternalNodes(forester.parseNexus(forester.toNexus(withTip(name)))[0])
            .map(function (n) { return n.name; });
        return back.indexOf(name) > -1;
    }
    function written(name) {
        return forester.toNewHampshire(withTip(name));
    }
    // an apostrophe means DOUBLE quotes, and survives the round trip
    if (written('Seba' + SQ + 's bat') !== '("Seba' + SQ + 's bat":1,Homo:1);') {
        return false;
    }
    if (!roundTrip('Cooper' + SQ + 's Hawk')) {
        return false;
    }
    // a double quote means SINGLE quotes
    if (written('Seba' + DQ + 's bat') !== "('Seba" + DQ + "s bat':1,Homo:1);") {
        return false;
    }
    if (!roundTrip('Seba' + DQ + 's bat')) {
        return false;
    }
    // anything else needing quotes takes single ones; a plain name stays bare
    if (written('a b, c') !== "('a b, c':1,Homo:1);" || written('plain') !== '(plain:1,Homo:1);') {
        return false;
    }
    if (!roundTrip('Anas_platyrhynchos_(mallard)') || !roundTrip('Cote d' + SQ + 'Ivoire')) {
        return false;
    }
    // BOTH quote styles is the one case that still loses: there is no quote
    // character left to wrap it in, so apostrophes become backticks. The
    // desktop does the same, deliberately -- this is a JOINT open item and the
    // assertion pins our behaviour to theirs rather than blessing it.
    var both = 'Seba' + SQ + 's ' + DQ + 'big' + DQ + ' bat';
    if (written(both) !== "('Seba`s " + DQ + 'big' + DQ + " bat':1,Homo:1);") {
        return false;
    }
    if (roundTrip(both)) {
        return false; // if this ever starts round-tripping, the joint item moved
    }
    // whitespace runs collapse and the name is trimmed, per the same rule
    if (written('  a   b  ') !== "('a b':1,Homo:1);") {
        return false;
    }
    // the TaxLabels token and the tree's tip token must be byte-identical or
    // nothing can join the taxa block back to the tree
    var nex = forester.toNexus(withTip('Cooper' + SQ + 's Hawk'));
    var tax = nex.split('\n').filter(function (l) { return /TaxLabels/i.test(l); })[0];
    var tree = nex.split('\n').filter(function (l) { return /^\s*Tree /i.test(l); })[0];
    return tax.indexOf('"Cooper' + SQ + 's Hawk"') > -1
        && tree.indexOf('"Cooper' + SQ + 's Hawk"') > -1;
}

// collectBasicTreeProperties feeds decisions all over the viewer -- branch
// width, the small-tree defaults, whether the tree draws to scale -- and the
// suite asserted exactly one of its twenty fields. Inverting the guard that
// counts external nodes left every test passing, which is how this gap was
// found: by sabotage, during the removal of the collapse data model.
//
// The fixture has an explicit zero branch (c:0) because that is the case the
// counting comments care about: a zero is a real measurement, not a missing
// one, so branchesWithLength must include it.
function testBasicTreeProperties() {
    var phy = forester.parseNewHampshire('((a:1,b:2)I1:3,(c:0,d:4,e:5)I2:6)R:7;', true, false);
    var p = forester.collectBasicTreeProperties(phy);

    function eq(field, got, want) {
        if (got !== want) {
            console.log('    ' + field + ' = ' + got + ', expected ' + want);
            return false;
        }
        return true;
    }

    // five tips; nodeCount counts the eight real nodes, not the wrapper the
    // parser puts above the root
    if (!eq('externalNodesCount', p.externalNodesCount, 5)) { return false; }
    if (!eq('nodeCount', p.nodeCount, 8)) { return false; }

    // the root is excluded from the branch tallies -- a branch length belongs
    // to the branch ABOVE a node, and the root has none
    if (!eq('branchCount', p.branchCount, 7)) { return false; }
    if (!eq('branchesWithLength', p.branchesWithLength, 7)) { return false; }   // c:0 counted
    if (!eq('internalBranchCount', p.internalBranchCount, 2)) { return false; }
    if (!eq('internalBranchesWithLength', p.internalBranchesWithLength, 2)) { return false; }

    // averageBranchLength is the one tally taken over POSITIVE lengths and
    // INCLUDING the root: 1+2+3+4+5+6+7 = 28 over 7, with c:0 left out
    if (!eq('averageBranchLength', p.averageBranchLength, 4)) { return false; }

    if (!eq('branchLengths', p.branchLengths, true)) { return false; }
    if (!eq('nodeNames', p.nodeNames, true)) { return false; }
    if (!eq('internalNodeData', p.internalNodeData, true)) { return false; }
    if (!eq('longestNodeName', p.longestNodeName, 2)) { return false; }

    // the descendant sum had no assertion at all
    if (!eq('calcSumOfAllExternalDescendants',
            forester.calcSumOfAllExternalDescendants(phy), 5)) { return false; }
    return true;
}

// A one-node tree is valid Newick and was read as a nameless node: the parser
// takes a label from the token BEFORE it -- '(', ',' or ')' -- and at the very
// start of the string there is no previous token, so the name fell through.
// Silent, and destructive on the way out: "a;" wrote back as "" and "a:0.5;"
// as ":0.5;", which is not even well formed.
function testSingleNodeTree() {
    function tipsOf(nh) {
        var t = forester.parseNewHampshire(nh, true, false);
        return forester.getAllExternalNodes(t).map(function (n) {
            return n.name === undefined ? '<unnamed>' : n.name;
        });
    }
    function roundTrip(nh) {
        return forester.toNewHampshire(forester.parseNewHampshire(nh, true, false));
    }

    var bare = [['a;', 'a'], ['abc;', 'abc'], ['myTip;', 'myTip'], ['x', 'x']];
    for (var i = 0; i < bare.length; ++i) {
        var got = tipsOf(bare[i][0]);
        if (got.length !== 1 || got[0] !== bare[i][1]) {
            console.log('    ' + bare[i][0] + ' -> [' + got.join(',') + '], expected [' + bare[i][1] + ']');
            return false;
        }
    }

    // the branch length has to survive with it
    if (tipsOf('a:0.5;')[0] !== 'a') {
        console.log('    a:0.5; lost its name');
        return false;
    }
    if (roundTrip('a:0.5;') !== 'a:0.5;') {
        console.log('    a:0.5; round-tripped as ' + JSON.stringify(roundTrip('a:0.5;')));
        return false;
    }
    if (roundTrip('a;') !== 'a;') {
        console.log('    a; round-tripped as ' + JSON.stringify(roundTrip('a;')));
        return false;
    }

    // and the parenthesised forms, which always worked, still do
    if (tipsOf('(a);')[0] !== 'a' || tipsOf('((a));')[0] !== 'a') {
        console.log('    a parenthesised single tip regressed');
        return false;
    }
    if (tipsOf('(a,b);').sort().join(',') !== 'a,b') {
        console.log('    a two-tip tree regressed');
        return false;
    }
    return true;
}

// A dated phyloXML tree must survive a SAVE. Until 2026-09-17 our writer wrote
// only the phylogeny-level <date> and no clade-level one, so every node's date
// -- value, unit, and the minimum/maximum that carry fossil ranges, HPD bounds
// and sampling uncertainty -- was silently destroyed on write. Found by round
// trip on docs/data/ammonite-time-tree.xml (9 dated nodes in, 0 back out), on
// the desktop's prompt: they had been writing them correctly all along, so the
// same tree saved by the two programs disagreed. Fixed in phyloxml-js.
//
// This is a GUARD, not the fix: phyloxml.js is vendored here from that repo, in
// THREE copies (test/lib, docs/lib, and the npm dependency), and they have
// drifted before -- test/lib sat at 1.0.0 while the package was at 1.0.2, so
// the tests were exercising code the product does not ship. Audited by round
// trip rather than by grep, because grep cannot tell a writer from a reader.
function testPhyloXmlDateRoundTrip() {
    var px = require('./lib/phyloxml').phyloXml;
    var fs = require('fs');
    var path = require('path');
    var file = path.join(__dirname, '..', 'docs', 'data', 'ammonite-time-tree.xml');
    var phy = px.parse(fs.readFileSync(file, 'utf8'), {trim: true, normalize: true})[0];

    function dates(tree) {
        var acc = [];
        forester.preOrderTraversalAll(forester.getTreeRoot(tree), function (n) {
            if (!n.date) {
                return;
            }
            // an absent unit and unit="" mean the same thing, and the writer
            // always emits the attribute, as the desktop does
            var d = {};
            Object.keys(n.date).forEach(function (k) { d[k] = n.date[k]; });
            if (d.unit === undefined || d.unit === null) {
                d.unit = '';
            }
            acc.push((n.name || '(internal)') + ':' + JSON.stringify(d));
        });
        return acc;
    }

    var before = dates(phy);
    if (before.length !== 9) {
        console.log('    fixture problem: ' + before.length + ' dated nodes, expected 9');
        return false;
    }
    var out = px.toPhyloXML(phy, 6);
    var after = dates(px.parse(out, {trim: true, normalize: true})[0]);
    if (after.length !== before.length) {
        console.log('    ' + before.length + ' dated nodes in, ' + after.length + ' out');
        return false;
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) {
        console.log('    a date changed across the round trip:\n     in  '
            + before.join('\n     in  ') + '\n     out ' + after.join('\n     out '));
        return false;
    }
    // the bounds specifically: this fixture carries fossil ranges, and they are
    // the part a writer is most likely to drop
    if (!/<minimum>/.test(out) || !/<maximum>/.test(out)) {
        console.log('    fossil range bounds were not written');
        return false;
    }
    return true;
}

// ---- dates in tip labels, and unitless BEAST heights ----------------------
// Ported from the desktop's TipDateExtractor / HeightDateConverter (their
// 0.11.151, commit 6755ba12) on Christian's word, 2026-09-17. The numbers
// below are THEIRS, generated from that jar, and this is the acceptance test.

function testTipLabelDateGrammar() {
    var p = forester.parseTipLabelDate;
    // The decimal years were computed INDEPENDENTLY, from JS Date arithmetic
    // (day-of-year / year-length), not read off this implementation -- an
    // expectation copied from the output under test asserts nothing. A day is
    // its midpoint, a month its middle, a bare year .5, as BEAST and TreeTime
    // read them.
    var cases = [
        // [label, decimal year (6 dp), precision, format]
        ['EBOV|KR817226|2014-06-10', 2014.439726, 'day', 'ISO date (YYYY-MM-DD)'],
        ['NewYork_705_1994.1', 1994.1, 'day', 'decimal year'],
        ['A_duck_Guangdong_12_2000', 2000.5, 'year', 'year'],
        ['strain/15-Mar-2021', 2021.201370, 'day', 'month-name date'],
        ['sample_2021-03', 2021.204110, 'month', 'ISO year-month (YYYY-MM)'],
        ['sample_March-2021', 2021.204110, 'month', 'month-name year'],
        ['x_25/12/1999', 1999.982192, 'day', 'numeric date'],
        ['x_1999/12/25', 1999.982192, 'day', 'numeric date'],
        ['leap_2016-03-01', 2016.165300, 'day', 'ISO date (YYYY-MM-DD)']
    ];
    for (var i = 0; i < cases.length; ++i) {
        var m = p(cases[i][0]);
        if (!m) {
            console.log('    no date found in ' + cases[i][0]);
            return false;
        }
        if (Math.abs(m.decimalYear - cases[i][1]) > 0.000001) {
            console.log('    ' + cases[i][0] + ' -> ' + m.decimalYear + ', expected ' + cases[i][1]);
            return false;
        }
        if (m.precision !== cases[i][2] || m.formatLabel !== cases[i][3]) {
            console.log('    ' + cases[i][0] + ' -> ' + m.precision + '/' + m.formatLabel);
            return false;
        }
    }
    // the RANGE the label states, not just its midpoint: this is what makes two
    // programs' decimal-year conventions comparable
    var year = p('t_1997');
    if (year.rangeStart !== 1997 || year.rangeEnd !== 1998) {
        console.log('    a bare year is not the whole year: ' + year.rangeStart + '..' + year.rangeEnd);
        return false;
    }
    var dec = p('t_1993.1'); // one written digit -> +/- 0.05
    if (Math.abs(dec.rangeStart - 1993.05) > 1e-9 || Math.abs(dec.rangeEnd - 1993.15) > 1e-9) {
        console.log('    1993.1 range is ' + dec.rangeStart + '..' + dec.rangeEnd + ', expected 1993.05..1993.15');
        return false;
    }
    // A month name must match EXACTLY, or a place name becomes a date. The
    // separator matters: MONTH_PARTIAL wants a space or hyphen, so
    // "Marburg_virus_1987" never reaches the month test and proves nothing --
    // sabotage caught that hole. These do reach it.
    var places = ['Marburg 1987', 'Marburg-1987', 'Junin-2005', 'Decatur 2001'];
    for (var pl = 0; pl < places.length; ++pl) {
        var pm = p(places[pl]);
        if (pm === null || pm.formatLabel !== 'year') {
            console.log('    "' + places[pl] + '" was read as '
                + (pm ? pm.formatLabel : 'nothing') + ', expected a bare year');
            return false;
        }
    }
    if (p('Mar-2021') === null || p('Mar-2021').formatLabel !== 'month-name year') {
        console.log('    a real month abbreviation stopped being one');
        return false;
    }
    // most specific format first, and the RIGHTMOST match within a format
    if (Math.abs(p('h5n1_2003_isolate_2009-05-04').decimalYear - 2009.338356) > 0.000001) {
        console.log('    a full date did not beat a bare year');
        return false;
    }
    if (p('a_2001_b_2003').matchedText !== '2003') {
        console.log('    the rightmost year did not win: ' + p('a_2001_b_2003').matchedText);
        return false;
    }
    // impossible and implausible dates are not dates
    if (p('x_2021-02-30') !== null && p('x_2021-02-30').formatLabel === 'ISO date (YYYY-MM-DD)') {
        console.log('    Feb 30 was accepted');
        return false;
    }
    if (p('clone_1234') !== null || p('id_3001') !== null) {
        console.log('    a 4-digit number outside 1900-2100 was read as a year');
        return false;
    }
    if (p('') !== null || p(null) !== null || p('no digits here') !== null) {
        console.log('    a label with no date returned one');
        return false;
    }
    return true;
}

// The acceptance test against the desktop: their anchors, and for influenza.tree
// their per-node values. The bound SWAP is the point -- an anchor can match
// while every interval is mirrored about its node.
function testHeightDateConversionAgainstDesktop() {
    var fs = require('fs');
    var path = require('path');

    // The committed fixture: the desktop's own forester/demo/beast-tip-dates.nex
    // (their 0.11.151), 10 tips mixing day, month and bare-year labels, HPD
    // intervals on the internal nodes, and both height_median and height on
    // every node so the median preference is exercised too.
    //
    // This used to read test_trees/, which is excluded from the repository --
    // so it passed here and failed in CI on a fresh checkout, where the file
    // does not exist. A test whose fixture is not in the repository is not a
    // test. Caught by CI on the 3.9.0 push.
    var file = path.join(__dirname, 'data', 'beast', 'beast-tip-dates.nex');
    var phy = forester.parseNexus(fs.readFileSync(file, 'utf8'))[0];
    var a = forester.inferHeightDateAnchor(phy);
    if (a === null) {
        console.log('    the BEAST fixture was refused');
        return false;
    }
    // The tip at height 0 is A/Hong_Kong/4801/2014|2014-02-26, so height 0 IS
    // that label's date: 2014 + (57 - 0.5) / 365, computed independently.
    if (a.present !== 2014.15479 || a.agreeing !== 10 || a.compared !== 10) {
        console.log('    anchor ' + JSON.stringify(a) + ', expected 2014.15479 with 10/10');
        return false;
    }
    forester.convertHeightsToDates(phy, a.present);

    // The self-validating part, which needs no magic numbers: after conversion
    // every tip must sit inside the span its OWN label states. If the anchor or
    // the subtraction were wrong, the whole tree would slide off its labels.
    var bad = null;
    var tips = 0;
    var withBounds = 0;
    forester.preOrderTraversalAll(forester.getTreeRoot(phy), function (n) {
        if (n.children && n.children.length > 0) {
            if (typeof n.date.minimum === 'number') {
                ++withBounds;
                // the bounds SWAP: a larger height is further back, so the
                // interval must still read low-to-high as a date
                if (!(n.date.minimum < n.date.value && n.date.value < n.date.maximum)) {
                    bad = 'internal node ' + JSON.stringify(n.date) + ' is not an ascending date interval';
                }
            }
            return;
        }
        ++tips;
        var m = forester.parseTipLabelDate(n.name);
        if (m === null) {
            bad = 'no label date found in ' + n.name;
            return;
        }
        if (n.date.unit !== 'year') {
            bad = n.name + ' has unit ' + n.date.unit;
        }
        if ((n.date.value < (m.rangeStart - 0.01)) || (n.date.value > (m.rangeEnd + 0.01))) {
            bad = n.name + ' converted to ' + n.date.value + ', outside its own label span '
                + m.rangeStart + '..' + m.rangeEnd;
        }
    });
    if (bad !== null) {
        console.log('    ' + bad);
        return false;
    }
    if (tips !== 10 || withBounds < 5) {
        console.log('    fixture problem: ' + tips + ' tips, ' + withBounds + ' internal nodes with bounds');
        return false;
    }
    // the provenance sentence the desktop appends
    var sentence = forester.heightDateDescription(a, 'TREE1', 10);
    if (sentence.indexOf('10 of 10 tip labels put height 0 at 2014.15479') < 0
        || sentence.indexOf('each date is 2014.15479 minus the height') < 0) {
        console.log('    provenance sentence: ' + sentence);
        return false;
    }

    // The full acceptance against the desktop -- their anchors and their
    // per-node dump for influenza.tree -- needs test_trees/, which is local
    // only. Run it when it is there, and SAY SO when it is not: a check that
    // vanishes silently is worse than one that never existed.
    var big = path.join(__dirname, '..', 'test_trees');
    if (!fs.existsSync(big)) {
        console.log('    (test_trees/ absent: the large-tree comparison did not run)');
        return true;
    }
    var cases = [
        ['influenza.tree', 2005.25, 687, 687],
        ['HA_discrete_MCC.tre', 2005.5, 190, 190],
        ['HA_continuous_MCC.tre', 2005.5, 190, 190]
    ];
    var influenza = null;
    for (var i = 0; i < cases.length; ++i) {
        var f2 = path.join(big, cases[i][0]);
        if (!fs.existsSync(f2)) {
            console.log('    (' + cases[i][0] + ' absent: skipped)');
            continue;
        }
        var t2 = forester.parseNexus(fs.readFileSync(f2, 'utf8'))[0];
        var a2 = forester.inferHeightDateAnchor(t2);
        if (a2 === null || a2.present !== cases[i][1] || a2.agreeing !== cases[i][2]
            || a2.compared !== cases[i][3]) {
            console.log('    ' + cases[i][0] + ' -> ' + JSON.stringify(a2) + ', the desktop says '
                + cases[i][1] + ' with ' + cases[i][2] + '/' + cases[i][3]);
            return false;
        }
        if (cases[i][0] === 'influenza.tree') {
            influenza = {phy: t2, anchor: a2};
        }
    }
    if (influenza !== null) {
        forester.convertHeightsToDates(influenza.phy, influenza.anchor.present);
        var root = forester.getTreeRoot(influenza.phy);
        // their dump: height 12.918411201454514 [12.583368821409794, 13.355090926136427]
        if (root.date.value !== 1992.33159 || root.date.minimum !== 1991.89491
            || root.date.maximum !== 1992.66663) {
            console.log('    influenza root -> ' + JSON.stringify(root.date)
                + ', the desktop says 1992.33159 [1991.89491, 1992.66663]');
            return false;
        }
    }
    return true;
}

// The refusals matter more than the conversions: a tree we cannot place in
// calendar time must be left exactly as it was, not guessed at.
function testHeightDateRefusals() {
    function tree(tips, opts) {
        opts = opts || {};
        var root = {name: 'r', date: {value: opts.rootHeight === undefined ? 30 : opts.rootHeight}, children: []};
        var inner = {name: '', date: {value: 15}, children: []};
        tips.forEach(function (t, i) {
            var n = {name: t.name, date: {}};
            if (t.height !== undefined) {
                n.date.value = t.height;
            }
            if (t.unit) {
                n.date.unit = t.unit;
            }
            (i % 2 === 0 ? inner.children : root.children).push(n);
        });
        root.children.unshift(inner);
        if (opts.undateInternals) {
            delete root.date.value;
            delete inner.date.value;
        }
        if (opts.unitOn === 'root') {
            root.date.unit = 'year';
        }
        if (opts.unitOn === 'inner') {
            inner.date.unit = 'mya';
        }
        return {name: 'T', children: [root]};
    }
    function spread(scale) {
        var out = [];
        for (var y = 2000; y <= 2005; ++y) {
            out.push({name: 's_' + y, height: (2005 - y) * scale});
        }
        return out;
    }
    var cases = [
        ['CONTROL: years 2000-2005, heights in years', tree(spread(1)), true],
        ['a unit on the root', tree(spread(1), {unitOn: 'root'}), false],
        ['a unit on an inner node', tree(spread(1), {unitOn: 'inner'}), false],
        ['internal nodes undated: not a time tree', tree(spread(1), {undateInternals: true}), false],
        ['heights in MONTHS (x12)', tree(spread(12)), false],
        ['heights in SUBSTITUTIONS (x0.001)', tree(spread(0.001)), false],
        ['every tip sampled in one year proves nothing',
            tree([{name: 'a_2020', height: 0}, {name: 'b_2020', height: 0}, {name: 'c_2020', height: 0},
                {name: 'd_2020', height: 0}]), false],
        ['only 2 of 4 tips carry a label date',
            tree([{name: 'x_2000', height: 5}, {name: 'y_2005', height: 0}, {name: 'strain_A', height: 3},
                {name: 'strain_B', height: 1}]), false],
        ['3 of 4 is a strict majority',
            tree([{name: 'x_2000', height: 5}, {name: 'y_2005', height: 0}, {name: 'z_2002', height: 3},
                {name: 'strain_B', height: 1}]), true]
    ];
    // Two rival stretches, and the fixture has to be built exactly right or it
    // refuses for a different reason and pins nothing. 18 year-labelled tips
    // CYCLING through 1996-2005 -- so their label ranges differ in time and the
    // different-sampling-times rule passes -- each with a height placing its
    // ~1.02-year-wide allowed stretch over BOTH candidate dates. Then two tips
    // at height 0 with day labels that disagree: a file cannot have two
    // different youngest tips, and one tip-date wrong by months in an otherwise
    // year-labelled tree is an ordinary curation error.
    //
    // Coverage is 19 at each day and 18 between, so the two maxima stay
    // separate and the anchor is undecided. My first version put all 18 tips in
    // 2005, which made the sampling-times rule fire and MASK the tie -- the
    // mutation that removes this refusal then went uncaught, and I wrongly
    // concluded the rule was unreachable. The desktop caught that: coverage 18
    // in the gap is below the maximum of 19, so the gap joins neither stretch.
    var heights = [8.963, 7.963, 6.963, 5.963, 4.963, 3.963, 2.963, 1.963, 0.963, 0];
    var rival = [];
    for (var i = 0; i < 18; ++i) {
        rival.push({name: 'y' + i + '_' + (1996 + (i % 10)), height: heights[i % 10]});
    }
    rival.push({name: 'd1_2005-01-15', height: 0});
    rival.push({name: 'd2_2005-11-20', height: 0});
    cases.push(['two rival stretches, anchor undecided', tree(rival), false]);
    // The tie ISOLATED by construction, the desktop's idea and better than
    // mine: drop one of the two rival tips and the same tree must CONVERT. The
    // pair is then the only difference between converting and refusing, so this
    // cannot drift out of agreement with the code -- it is the code that
    // answers it. Asserting the other preconditions in the test's own words is
    // a second implementation of them, and theirs was subtly not the same rule.
    cases.push(['the same tree with ONE rival tip converts, so the pair is the cause',
        tree(rival.slice(0, 19)), true]);

    for (var c = 0; c < cases.length; ++c) {
        var got = forester.inferHeightDateAnchor(cases[c][1]) !== null;
        if (got !== cases[c][2]) {
            console.log('    ' + cases[c][0] + ' -> ' + (got ? 'converted' : 'refused')
                + ', expected ' + (cases[c][2] ? 'converted' : 'refused'));
            return false;
        }
    }
    // a refused tree is left EXACTLY as it was -- no dates rewritten, no
    // description appended
    var months = tree(spread(12));
    var before = JSON.stringify(months);
    if (forester.convertLoadedHeightsToDates([months]) !== 0 || JSON.stringify(months) !== before) {
        console.log('    a refused tree was modified anyway');
        return false;
    }
    // the tolerance: a tip off by more than 2 x 0.01 stops agreeing. Five
    // decimals make each label a point, so the tolerance alone decides.
    function offsetTree(miss) {
        var tips = [];
        for (var i = 0; i < 20; ++i) {
            var y = (1990 + i) + '.50000';
            tips.push({name: 't' + i + '_' + y, height: (2010.5 - (1990 + i + 0.5)) + (i === 19 ? miss : 0)});
        }
        return tree(tips, {rootHeight: 30});
    }
    if (forester.inferHeightDateAnchor(offsetTree(0.02)).agreeing !== 20) {
        console.log('    a tip off by exactly 2 x the tolerance should still agree');
        return false;
    }
    if (forester.inferHeightDateAnchor(offsetTree(0.0201)).agreeing !== 19) {
        console.log('    a tip off by more than 2 x the tolerance should not agree');
        return false;
    }
    // The 19-in-20 floor, which nothing above reached: 20 point-labelled tips,
    // outliers pushed to their own separate places so they form no rival
    // cluster. 19 agreeing converts, 18 does not.
    function withOutliers(n) {
        var tips = [];
        for (var i = 0; i < 20; ++i) {
            var y = (1990 + i) + '.50000';
            var h = 2010.5 - (1990 + i + 0.5);
            if (i >= (20 - n)) {
                h += 0.05 + (i * 0.013);
            }
            tips.push({name: 't' + i + '_' + y, height: h});
        }
        return tree(tips, {rootHeight: 40});
    }
    var one = forester.inferHeightDateAnchor(withOutliers(1));
    if (one === null || one.agreeing !== 19 || one.compared !== 20) {
        console.log('    19 of 20 agreeing should convert, got ' + JSON.stringify(one));
        return false;
    }
    if (forester.inferHeightDateAnchor(withOutliers(2)) !== null) {
        console.log('    18 of 20 agreeing should be refused');
        return false;
    }
    // The anchor comes from the MOST PRECISELY labelled tips only. Six precise
    // tips put height 0 at 2005.5 and seven bare-year tips at 2005.9; the year
    // labels are wide enough to agree, so without the precision filter they
    // outvote the precise ones and drag the anchor.
    var mixed = [];
    for (var m2 = 0; m2 < 6; ++m2) {
        mixed.push({name: 'p' + m2 + '_' + (1990 + m2) + '.50000', height: 2005.5 - (1990 + m2 + 0.5)});
    }
    for (var c2 = 0; c2 < 7; ++c2) {
        mixed.push({name: 'c' + c2 + '_' + (1996 + c2), height: 2005.9 - (1996 + c2 + 0.5)});
    }
    var mixedAnchor = forester.inferHeightDateAnchor(tree(mixed, {rootHeight: 40}));
    if (mixedAnchor === null || mixedAnchor.present !== 2005.5) {
        console.log('    the coarse labels dragged the anchor: ' + JSON.stringify(mixedAnchor));
        return false;
    }
    // The tolerance decides AGREEMENT -- how far a tip may miss and still
    // count -- and must not then PLACE the anchor. Clamping the median into
    // the tolerance-widened stretch let the answer drift by up to the
    // tolerance: the desktop measured three Nextstrain trees against ground
    // truth and every tip was out by about four days. The clamp is into what
    // the agreeing tips actually STATE, un-widened.
    //
    // Two month-labelled offers that overlap by 0.02 years, with the precise
    // median outside that overlap -- the only shape where the two rules differ.
    var mA = forester.parseTipLabelDate('a_2000-01');
    var mB = forester.parseTipLabelDate('b_2001-06');
    var hA = 10;
    var hB = ((mA.rangeEnd + hA) - 0.02) - mB.rangeStart;
    var overlapHi = Math.min(mA.rangeEnd + hA, mB.rangeEnd + hB);
    var clampAnchor = forester.inferHeightDateAnchor(tree([
        {name: 'a_2000-01', height: hA},
        {name: 'b_2001-06', height: hB},
        {name: 'c_2001-06', height: hB}
    ], {rootHeight: 40}));
    if (clampAnchor === null) {
        console.log('    the clamp fixture was refused');
        return false;
    }
    // the un-widened overlap ends here; the median sits 7.7 days past it
    if (Math.abs(clampAnchor.present - overlapHi) > 0.00001) {
        console.log('    anchor ' + clampAnchor.present + ', expected the edge of what the tips state, '
            + overlapHi.toFixed(5) + ' -- clamping into the tolerance-widened stretch instead?');
        return false;
    }

    // ... and where the agreeing tips overlap ONLY because of the tolerance and
    // state nothing in common, there is nothing to clamp into and the median
    // stands. Two day-labelled offers 0.008 apart -- disjoint, but inside twice
    // the tolerance, so they still agree.
    var dA = forester.parseTipLabelDate('a_2000-01-01');
    var dB = forester.parseTipLabelDate('b_2001-06-15');
    var gA = 10;
    var gB = ((dA.rangeEnd + gA) + 0.008) - dB.rangeStart;
    var wantMedian = (((dA.decimalYear + gA) + (dB.decimalYear + gB)) / 2);
    var emptyAnchor = forester.inferHeightDateAnchor(tree([
        {name: 'a_2000-01-01', height: gA},
        {name: 'b_2001-06-15', height: gB}
    ], {rootHeight: 40}));
    if (emptyAnchor === null) {
        console.log('    the empty-intersection fixture was refused');
        return false;
    }
    if (Math.abs(emptyAnchor.present - wantMedian) > 0.00001) {
        console.log('    anchor ' + emptyAnchor.present + ', expected the median ' + wantMedian.toFixed(5)
            + ' -- an empty intersection must not place the anchor');
        return false;
    }

    // The anchor is rounded to 5 decimals, HALF_UP. Two tips whose midpoint
    // runs past five decimals: the raw median is 2005.123458.
    var longd = [{name: 'p0_1990.5000000', height: 2005.1234561 - 1990.5},
        {name: 'p1_1991.5000000', height: 2005.1234599 - 1991.5}];
    var rounded = forester.inferHeightDateAnchor(tree(longd, {rootHeight: 40}));
    if (rounded === null || rounded.present !== 2005.12346) {
        console.log('    anchor ' + (rounded && rounded.present) + ', expected 2005.12346 (5 decimals, HALF_UP)');
        return false;
    }
    return true;
}


// The time <-> divergence switch. A tree can state two different things: where
// its nodes sit in TIME, and how far its branches have DIVERGED. The switch is
// only worth offering when the two draw different pictures, and it must be
// reversible -- the branch lengths a file arrived with have to come back
// exactly.
function testTimeDivergenceScale() {
    var fs = require('fs');
    var path = require('path');

    // A real Nextstrain build: divergence is a separate measurement, and it
    // moves the tips by about a quarter of the tree's width.
    var ncov = forester.parseAuspiceJson(
        fs.readFileSync(path.join(__dirname, '..', 'docs', 'data', 'nextstrain-ncov.json'), 'utf8'));
    if (Array.isArray(ncov)) {
        ncov = ncov[0];
    }
    forester.captureDivergence(ncov);
    if (!forester.hasTimeAndDivergence(ncov)) {
        console.log('    a Nextstrain build should offer the switch');
        return false;
    }
    // its parser leaves it in the time view
    if (forester.branchLengthScale(ncov) !== 'time') {
        console.log('    a Nextstrain build should arrive in the time view, got '
            + forester.branchLengthScale(ncov));
        return false;
    }
    forester.applyDivergenceBranchLengths(ncov);
    if (forester.branchLengthScale(ncov) !== 'divergence') {
        console.log('    the scale did not follow the switch to divergence');
        return false;
    }
    forester.applyTimeBranchLengths(ncov);
    if (forester.branchLengthScale(ncov) !== 'time') {
        console.log('    the scale did not follow the switch back to time');
        return false;
    }

    // A BEAST time tree states time TWICE -- its branch lengths already are
    // the gaps between its dates -- so there is nothing to switch between and
    // the control must stay hidden. Measured: influenza.tree's branch lengths
    // differ from the date gaps by a median 7% PER BRANCH, which looks like a
    // separate measure, but the differences cancel and every tip lands within
    // 0.3% of where the other metric puts it. Comparing branches pair by pair
    // is the wrong question; the layout shift is the right one.
    var beast = forester.parseNexus(
        fs.readFileSync(path.join(__dirname, 'data', 'beast', 'beast-tip-dates.nex'), 'utf8'))[0];
    var loaded = [];
    forester.captureDivergence(beast);
    forester.preOrderTraversalAll(forester.getTreeRoot(beast), function (n) {
        loaded.push(n.branch_length);
    });
    var anchor2 = forester.inferHeightDateAnchor(beast);
    forester.convertHeightsToDates(beast, anchor2.present);
    if (forester.hasTimeAndDivergence(beast)) {
        console.log('    a BEAST time tree should NOT offer the switch: its branches already are time');
        return false;
    }
    if (forester.branchLengthScale(beast) !== 'divergence') {
        console.log('    a BEAST tree arrives stating its own branch lengths');
        return false;
    }

    // Reversible and lossless: the branch lengths the file arrived with come
    // back exactly, because the divergence was recorded before the time view
    // overwrote them.
    forester.applyTimeBranchLengths(beast);
    forester.applyDivergenceBranchLengths(beast);
    var back = [];
    forester.preOrderTraversalAll(forester.getTreeRoot(beast), function (n) {
        back.push(n.branch_length);
    });
    for (var i = 1; i < loaded.length; ++i) {   // the root's length is not a branch
        if (typeof loaded[i] === 'number' && Math.abs(loaded[i] - back[i]) > 1e-9) {
            console.log('    a round trip changed branch ' + i + ': ' + loaded[i] + ' -> ' + back[i]);
            return false;
        }
    }

    // A tree still stating AGES (a height, largest at the root) must not offer
    // the switch: the time view takes child minus parent and clamps at 0, so
    // every branch would collapse to nothing.
    //
    // Two trees differing ONLY in which way time runs, so the direction is the
    // single cause -- the desktop's way of isolating a rule, and better than
    // restating the rule in the test's own words. The real BEAST fixture will
    // not do here: it refuses for a different reason (its two metrics barely
    // differ), which would let a broken direction check pass unnoticed.
    function directed(forward) {
        var tips = [];
        for (var k = 0; k < 8; ++k) {
            tips.push({
                name: 't' + k,
                date: {value: forward ? (2000 + k) : (8 - k)},
                branch_length: (k % 2 === 0) ? 0.1 : 3.0    // divergence, unlike the date gaps
            });
        }
        var inner = {name: '', date: {value: forward ? 1995 : 12}, branch_length: 1, children: tips.slice(0, 4)};
        return {name: 'T', children: [{name: '', date: {value: forward ? 1990 : 20},
            children: [inner].concat(tips.slice(4))}]};
    }
    var forward = directed(true);
    forester.captureDivergence(forward);
    if (!forester.hasTimeAndDivergence(forward)) {
        console.log('    the control tree runs the calendar way and should offer the switch');
        return false;
    }
    var backward = directed(false);
    forester.captureDivergence(backward);
    if (forester.hasTimeAndDivergence(backward)) {
        console.log('    a tree stating ages must not offer the switch');
        return false;
    }
    // and this is why: applied to it, the time view leaves nothing
    forester.applyTimeBranchLengths(backward);
    var flat = 0;
    var all = 0;
    forester.preOrderTraversalAll(forester.getTreeRoot(backward), function (n) {
        ++all;
        if (n.branch_length === 0) {
            ++flat;
        }
    });
    if (flat !== all) {
        console.log('    expected the age tree to collapse under the time view, got ' + flat + '/' + all);
        return false;
    }
    return true;
}


// The molecular-sequence half of a Nexus file, case for case against the
// desktop's NexusSequenceExportTest (PhylogenyWriter.writeNexusCharactersBlock,
// 2026-09-23). The two programs write the SAME BYTES for the same tree, so the
// expectations here are the desktop's own: capitalized DataType, the Format
// line's token order, a row per TAXON with '?' where a tip has no sequence,
// and no block at all when the sequences are not an alignment.
function testNexusMolecularSequences() {
    function tree(nh) {
        var p = forester.parseNewHampshire(nh, true, false);
        p.rooted = false;   // as the desktop's NH parser leaves a plain Newick
        return p;
    }
    function tips(p) {
        return forester.getAllExternalNodes(p).reverse();
    }
    function setSeq(p, i, mol, extra) {
        var n = tips(p)[i];
        var q = {mol_seq: {is_aligned: true, value: mol}};
        if (extra) {
            Object.keys(extra).forEach(function (k) { q[k] = extra[k]; });
        }
        n.sequences = [q];
    }
    function charactersBlock(nex) {
        var i = nex.indexOf("Begin Characters;");
        return i < 0 ? null : nex.substring(i, nex.indexOf("Begin Trees;"));
    }
    function fail(msg, detail) {
        console.log('    ' + msg + (detail === undefined ? '' : ': ' + detail));
        return false;
    }

    // (1) an alignment becomes a Characters block, in the desktop's exact shape
    var p1 = tree("((A,B),C)");
    setSeq(p1, 0, "MKAL-IV");
    setSeq(p1, 1, "MKAL-IW");
    setSeq(p1, 2, "MKAL-IY");
    var n1 = forester.toNexus(p1, 9, true);
    var expected1 = "Begin Characters;\n"
        + " Dimensions NChar=7;\n"
        + " Format DataType=Protein Interleave=No Gap=- Missing=?;\n"
        + " Matrix\n"
        + "  A  MKAL-IV\n"
        + "  B  MKAL-IW\n"
        + "  C  MKAL-IY\n"
        + " ;\n"
        + "End;\n";
    if (n1.indexOf(expected1) < 0) {
        return fail("the Characters block is not byte-identical to the desktop's", "\n" + n1);
    }
    // blocks in the order Taxa, Characters, Trees
    if (!(n1.indexOf("Begin Taxa;") < n1.indexOf("Begin Characters;")
        && n1.indexOf("Begin Characters;") < n1.indexOf("Begin Trees;"))) {
        return fail("the Nexus blocks are out of order");
    }
    // NTax is illegal in a Characters block without NEWTAXA
    if (/Characters;\n[^\n]*NTax/.test(n1)) {
        return fail("NTax must not appear in a Characters block");
    }

    // (2) no sequences, no block
    if (charactersBlock(forester.toNexus(tree("((A,B),C)"), 9, true)) !== null) {
        return fail("a tree without sequences must not get a Characters block");
    }

    // (3) sequences of unequal length are not a character matrix. Nothing is
    // written, and a bracketed Nexus comment says why -- a reader who opens
    // the file should not have to guess where the data went.
    var p3 = tree("((A,B),C)");
    setSeq(p3, 0, "MKAL");
    setSeq(p3, 1, "MKALIVGD");
    var n3 = forester.toNexus(p3, 9, true);
    if (charactersBlock(n3) !== null) {
        return fail("unequal-length sequences must not be written as a matrix", n3);
    }
    if (n3.indexOf("[ Molecular sequences were not written: they are of unequal length (4 vs 8),") < 0
        || n3.indexOf("]") < 0) {
        return fail("no bracketed comment explaining the drop", n3);
    }
    // and the file with that comment in it must still read back as a tree
    if (forester.getAllExternalNodes(forester.parseNexus(n3, true, false)[0]).length !== 3) {
        return fail("the explanatory comment broke the file");
    }

    // (4) a tip with no sequence gets a row of the missing symbol, so the
    // matrix covers every taxon the Taxa block declares
    var p4 = tree("((A,B),C)");
    setSeq(p4, 0, "MKAL");
    setSeq(p4, 2, "MKIV");
    var b4 = charactersBlock(forester.toNexus(p4, 9, true));
    if (b4 === null || b4.indexOf("  A  MKAL\n  B  ????\n  C  MKIV\n") < 0) {
        return fail("partial coverage should still give one row per taxon", b4);
    }

    // (5) the DataType is read off the residues, by the desktop's rule
    // (ForesterUtil.guessMolecularSequenceType): L/I/E/H/D/Q say protein
    // first, then T says DNA and U says RNA
    function typeOf(mol) {
        var p = tree("(x,y)");
        setSeq(p, 0, mol);
        setSeq(p, 1, mol);
        var m = / Format DataType=(\S+) /.exec(forester.toNexus(p, 9, true));
        return m ? m[1] : null;
    }
    if (typeOf("ACGTACGTACGTACGTACGT") !== "DNA") {
        return fail("nucleotides not typed DNA", typeOf("ACGTACGTACGTACGTACGT"));
    }
    if (typeOf("ACGUACGUACGUACGUACGU") !== "RNA") {
        return fail("RNA not typed RNA", typeOf("ACGUACGUACGUACGUACGU"));
    }
    if (typeOf("MKVLEQW-") !== "Protein") {
        return fail("protein not typed Protein", typeOf("MKVLEQW-"));
    }
    // The guesser's protein test looks for L/I/E/H/D/Q ONLY, so a protein made
    // of other residues and a T reads as DNA. Verified against the desktop by
    // running ForesterUtil.guessMolecularSequenceType on this very string
    // (-> DNA), not assumed: the point of pinning it is that the two programs
    // are wrong in the SAME way, so a file written by one is typed the same by
    // the other. Changing the rule is a joint decision, and this test is what
    // would notice one side doing it alone.
    if (typeOf("MKTTTTTT") !== "DNA") {
        return fail("the shared guesser's rule drifted", typeOf("MKTTTTTT"));
    }
    // nothing decisive (all gaps, or A/C/G alone) falls back to Protein
    if (typeOf("ACGACG--") !== "Protein") {
        return fail("an undecidable sequence should fall back to Protein", typeOf("ACGACG--"));
    }
    // and a DECLARED type does not override the residues -- the desktop reads
    // the letters and has no declared type to consult
    var pd = tree("(x,y)");
    setSeq(pd, 0, "ACGTACGT", {type: "protein"});
    setSeq(pd, 1, "ACGTACGT", {type: "protein"});
    if (forester.toNexus(pd, 9, true).indexOf("DataType=DNA") < 0) {
        return fail("a declared type must not override the residues");
    }

    // (6) a label needing quotes is the SAME token in TaxLabels, the matrix and
    // the tree -- a matrix row naming a taxon the file does not declare is
    // unreadable -- and it survives a round trip
    var p6 = tree("(X,Y)");
    tips(p6)[0].name = "Seba's bat";
    tips(p6)[1].name = "a b";
    setSeq(p6, 0, "MKAL");
    setSeq(p6, 1, "MKIV");
    var n6 = forester.toNexus(p6, 9, true);
    if (n6.indexOf(' TaxLabels "Seba\'s bat" \'a b\';') < 0
        || n6.indexOf('  "Seba\'s bat"  MKAL\n') < 0
        || n6.indexOf('  \'a b\'         MKIV\n') < 0) {
        return fail("the quoted label is not identical in both blocks", n6);
    }
    var back6 = forester.getAllExternalNodes(forester.parseNexus(n6, true, false)[0]).reverse();
    if (back6[0].name !== "Seba's bat" || back6[0].sequences[0].mol_seq.value !== "MKAL") {
        return fail("a quoted name lost its sequence on the way back",
            JSON.stringify(back6.map(function (n) { return n.name; })));
    }

    // (7) an internal node's sequence is not a taxon's and is never written
    var p8 = tree("((A,B)INNER,C)");
    setSeq(p8, 0, "MKAL");
    setSeq(p8, 1, "MKIV");
    setSeq(p8, 2, "MKLL");
    forester.preOrderTraversalAll(p8, function (n) {
        if (n.name === "INNER") {
            n.sequences = [{mol_seq: {is_aligned: true, value: "WWWW"}}];
        }
    });
    var b8 = charactersBlock(forester.toNexus(p8, 9, true));
    if (b8.indexOf("WWWW") > -1 || b8.indexOf("NChar=4") < 0) {
        return fail("an internal node reached the matrix", b8);
    }

    // (8) the whole point: the tree AND its alignment come back, marked aligned
    var back1 = forester.parseNexus(n1, true, false);
    if (back1.length !== 1) {
        return fail("wrong number of trees back", back1.length);
    }
    var got = forester.getAllExternalNodes(back1[0]).reverse();
    var want = {A: "MKAL-IV", B: "MKAL-IW", C: "MKAL-IY"};
    if (got.length !== 3) {
        return fail("wrong number of tips back", got.length);
    }
    for (var i = 0; i < got.length; ++i) {
        var q = got[i].sequences && got[i].sequences[0];
        if (!q || !q.mol_seq || q.mol_seq.value !== want[got[i].name]
            || q.mol_seq.is_aligned !== true) {
            return fail("a sequence did not survive the round trip",
                got[i].name + " -> " + JSON.stringify(q));
        }
    }

    // (9) an unaligned tree read from, say, phyloXML is written whenever its
    // sequences are of one length: the desktop has no is_aligned flag and
    // decides on the lengths, so neither may we, or the two disagree
    var p9 = tree("(A,B)");
    p9.rooted = false;
    tips(p9)[0].sequences = [{mol_seq: {is_aligned: false, value: "MKAL"}}];
    tips(p9)[1].sequences = [{mol_seq: {is_aligned: false, value: "MKIV"}}];
    if (charactersBlock(forester.toNexus(p9, 9, true)) === null) {
        return fail("equal-length sequences must be written whatever is_aligned says");
    }
    return true;
}

// A matrix row of nothing but the missing and gap symbols states that the
// taxon has NO data. It must not come back as a sequence -- our own writer
// emits such rows to keep the matrix rectangular, so reading them as data
// would invent a sequence of question marks for every tip that never had one.
function testNexusMissingRows() {
    function read(matrix, nchar) {
        var nex = "#NEXUS\nBegin Taxa;\n Dimensions NTax=2;\n TaxLabels A B;\nEnd;\n"
            + "Begin Characters;\n Dimensions NChar=" + nchar + ";\n"
            + " Format DataType=Protein Interleave=No Gap=- Missing=?;\n Matrix\n"
            + matrix + " ;\nEnd;\nBegin Trees;\n Tree tree1=[&R](A:1,B:1);\nEnd;\n";
        var out = {};
        forester.getAllExternalNodes(forester.parseNexus(nex, true, false)[0]).forEach(function (n) {
            var q = n.sequences && n.sequences[0];
            out[n.name] = (q && q.mol_seq && q.mol_seq.value) ? q.mol_seq.value : null;
        });
        return out;
    }
    function fail(msg, detail) {
        console.log('    ' + msg + (detail === undefined ? '' : ': ' + detail));
        return false;
    }
    // all '?' is absence of data ...
    var a = read("  A  MKAL\n  B  ????\n", 4);
    if (a.A !== "MKAL") {
        return fail("the real sequence was lost", JSON.stringify(a));
    }
    if (a.B !== null) {
        return fail("an all-missing row came back as a sequence", JSON.stringify(a));
    }
    // ... and so are all gaps, all dots and all asterisks, alone or mixed
    var b = read("  A  MKAL\n  B  ----\n", 4);
    if (b.B !== null) {
        return fail("an all-gap row came back as a sequence", JSON.stringify(b));
    }
    var c = read("  A  MKAL\n  B  ?-.\n", 3);
    if (c.B !== null) {
        return fail("a row of mixed non-residues came back as a sequence", JSON.stringify(c));
    }
    // '*' is NOT absence: it is a residue, the stop codon of a translated
    // alignment. A row carrying one is data, and so is a row of nothing else.
    // Their reader answers the same on both, asked directly.
    var star = read("  A  MKAL\n  B  ****\n", 4);
    if (star.B !== "****") {
        return fail("a row of stop codons is data, not absence", JSON.stringify(star));
    }
    var mixed = read("  A  MKAL\n  B  ?-.*\n", 4);
    if (mixed.B !== "X--*") {
        return fail("a row with one stop codon should survive, normalized", JSON.stringify(mixed));
    }
    // and what counts as absence is what the block DECLARES, not '?' and '-'
    // assumed: a "Missing=N" file's all-N row is an absent taxon
    var declared = "#NEXUS\nBegin Taxa;\n Dimensions NTax=2;\n TaxLabels A B;\nEnd;\n"
        + "Begin Characters;\n Dimensions NChar=4;\n"
        + " Format DataType=Protein Interleave=No Gap=~ Missing=N;\n Matrix\n"
        + "  A  MKAL\n  B  NNNN\n  ;\nEnd;\n"
        + "Begin Trees;\n Tree tree1=[&R](A:1,B:1);\nEnd;\n";
    var dec = {};
    forester.getAllExternalNodes(forester.parseNexus(declared, true, false)[0]).forEach(function (n) {
        var q = n.sequences && n.sequences[0];
        dec[n.name] = (q && q.mol_seq && q.mol_seq.value) ? q.mol_seq.value : null;
    });
    if (dec.B !== null) {
        return fail("a declared Missing= symbol was not honoured", JSON.stringify(dec));
    }
    if (dec.A !== "MKAL") {
        return fail("the real sequence was lost with a declared Missing=", JSON.stringify(dec));
    }
    // but ONE residue is data, and the row is kept whole, its missing
    // positions normalized to the unspecified residue rather than dropped:
    // '?' outside the alphabet becomes 'X' for protein, as the desktop's
    // BasicSequence.createAaSequence does. Measured against their reader on
    // this matrix, not assumed.
    var d = read("  A  MKAL\n  B  ???L\n", 4);
    if (d.B !== "XXXL") {
        return fail("a row with a residue must be kept, normalized", JSON.stringify(d));
    }
    // the rest of that same normalization, which '?' is only one case of:
    // lowercase is raised, '.' becomes the gap, and a letter outside the
    // alphabet becomes X. Their answers, run on this matrix: MK-L and MXZL.
    var e = read("  A  mk.l\n  B  MJZL\n", 4);
    if ((e.A !== "MK-L") || (e.B !== "MXZL")) {
        return fail("matrix residues are not normalized the desktop's way", JSON.stringify(e));
    }
    // and a row of dots under MatchChar=. is data: it resolves to the
    // reference row, so the test has to run on the RESOLVED residues
    var mc = "#NEXUS\nBegin Taxa;\n Dimensions NTax=2;\n TaxLabels A B;\nEnd;\n"
        + "Begin Characters;\n Dimensions NChar=4;\n"
        + " Format DataType=Protein Missing=? Gap=- MatchChar=.;\n Matrix\n"
        + "  A  MKAL\n  B  ....\n ;\nEnd;\nBegin Trees;\n Tree tree1=[&R](A:1,B:1);\nEnd;\n";
    var got = {};
    forester.getAllExternalNodes(forester.parseNexus(mc, true, false)[0]).forEach(function (n) {
        var q = n.sequences && n.sequences[0];
        got[n.name] = (q && q.mol_seq && q.mol_seq.value) ? q.mol_seq.value : null;
    });
    if (got.B !== "MKAL") {
        return fail("a MatchChar row must resolve to the reference, not vanish", JSON.stringify(got));
    }
    // A second CHARACTERS block replaces the first, so what the LAST one says
    // about a taxon is what holds -- including that it has no data. Both the
    // rows and the record of which ids carried residues are scoped to their
    // block; leaving the latter standing would let data in block one keep an
    // all-missing row in block two alive. Checked against the desktop reader
    // on this very file: it answers WWWW / no sequence too.
    var two = "#NEXUS\nBegin Taxa;\n Dimensions NTax=2;\n TaxLabels A B;\nEnd;\n"
        + "Begin Characters;\n Dimensions NChar=4;\n"
        + " Format DataType=Protein Interleave=No Gap=- Missing=?;\n Matrix\n"
        + "  A  MKAL\n  B  MKIV\n ;\nEnd;\n"
        + "Begin Characters;\n Dimensions NChar=4;\n"
        + " Format DataType=Protein Interleave=No Gap=- Missing=?;\n Matrix\n"
        + "  A  WWWW\n  B  ????\n ;\nEnd;\n"
        + "Begin Trees;\n Tree tree1=[&R](A:1,B:1);\nEnd;\n";
    var last = {};
    forester.getAllExternalNodes(forester.parseNexus(two, true, false)[0]).forEach(function (n) {
        var q = n.sequences && n.sequences[0];
        last[n.name] = (q && q.mol_seq && q.mol_seq.value) ? q.mol_seq.value : null;
    });
    if (last.A !== "WWWW") {
        return fail("the later block should replace the earlier one", JSON.stringify(last));
    }
    if (last.B !== null) {
        return fail("residues in an earlier block kept a later all-missing row alive",
            JSON.stringify(last));
    }
    return true;
}


// ==========================================================================
// The two format round trips, for trees carrying node names, branch lengths,
// support values and molecular sequences:
//
//   (1) read phyloXML -> write Nexus -> read Nexus -> write phyloXML
//   (2) read Nexus -> write phyloXML -> read phyloXML -> write Nexus
//
// Both must come back with the same tree and the same sequences. Christian
// asked for these as standing regression tests, 2026-09-23, and writing them
// found two real defects: the phyloXML writer dropped every branch length of
// ZERO (a truthiness test -- 33 of them in the repo's own bunya_glyco.xml),
// and a node carrying more than one confidence lost ALL of its support in
// Newick/Nexus where the desktop keeps the first.
//
// TWO LOSSES ARE THE FORMAT, not defects, and are pinned below so that a
// change to either is noticed rather than discovered:
//   - a support value's TYPE. Nexus writes "[95]" with nowhere to say
//     "bootstrap", so it comes back typed 'unknown'. The desktop is the same.
//   - the SECOND support on a node. One Newick slot, one value; the first
//     non-MAD confidence goes in it, as the desktop's
//     BranchData.getSupportConfidence does.
// ==========================================================================

// Everything the round trips are about, as one comparable string: topology,
// names, branch lengths, support, sequences. Numbers are normalized first,
// so 1 and 1.0 and 0.30000000000000004 compare as they should.
function rtDigest(phy) {
    function num(v) {
        return (v === undefined || v === null) ? null : Number(Number(v).toPrecision(12));
    }
    function walk(n) {
        var kids = (n.children || []).map(walk);
        kids.sort();
        var conf = (n.confidences || []).map(function (c) {
            return (c.type || '?') + '=' + num(c.value);
        }).sort().join(',');
        var seq = (n.sequences || []).map(function (q) {
            return q.mol_seq ? ((q.mol_seq.is_aligned ? 'A:' : 'U:') + q.mol_seq.value) : '';
        }).filter(Boolean).join('|');
        return '(' + kids.join(',') + ')' + (n.name || '') + ':' + num(n.branch_length)
            + (conf ? '[' + conf + ']' : '') + (seq ? '{' + seq + '}' : '');
    }
    return walk(forester.getTreeRoot(phy));
}

function rtFirstDiff(a, b) {
    var i = 0;
    while ((i < a.length) && (i < b.length) && (a[i] === b[i])) {
        ++i;
    }
    return '\n      in  ...' + a.substring(Math.max(0, i - 60), i + 80)
        + '\n      out ...' + b.substring(Math.max(0, i - 60), i + 80);
}

// The precision archaeopteryx.js asks its writers for (see the Nexus and
// phyloXML download paths). Passed to BOTH writers so the comparison is about
// the round trip and not about one of them rounding differently.
//
// A FUNCTION, not a `var`, and the reason matters: the runTest calls at the
// top of this file execute before any assignment further down. As a `var`
// this read as undefined at test time, both writers then took their
// no-rounding path, and the tests quietly measured something other than what
// the application does -- which is how a mutant that rounded branch lengths
// to three decimals walked straight past them. Function declarations hoist;
// assignments do not.
function rtDecimals() {
    return 9;
}

function testPhyloXmlNexusPhyloXmlRoundTrip() {
    var px = require('./lib/phyloxml').phyloXml;
    var fs = require('fs');
    var readPx = function (xml) { return px.parse(xml, {trim: true, normalize: true})[0]; };

    function chain(file) {
        var src = readPx(fs.readFileSync(pth.join(__dirname, file), 'utf8'));
        var viaNexus = forester.parseNexus(forester.toNexus(src, rtDecimals(), true), true, false)[0];
        var back = readPx(px.toPhyloXML(viaNexus, rtDecimals()));
        return {src: src, back: back};
    }

    // --- the purpose-built fixture ---------------------------------------
    var r = chain('./data/roundtrip_seqs.xml');
    // the fixture has to actually contain what it claims, or a pass means
    // nothing: zero-length branches, a negative one, support, sequences, and
    // one tip without a sequence
    var zeros = 0, negatives = 0, confs = 0, seqs = 0, tipsNoSeq = 0;
    forester.preOrderTraversalAll(forester.getTreeRoot(r.src), function (n) {
        if (n.branch_length === 0) { ++zeros; }
        if (n.branch_length < 0) { ++negatives; }
        if (n.confidences && n.confidences.length > 0) { ++confs; }
        var hasSeq = n.sequences && n.sequences[0] && n.sequences[0].mol_seq;
        if (hasSeq) { ++seqs; }
        if (!n.children && !hasSeq) { ++tipsNoSeq; }
    });
    if ((zeros !== 3) || (negatives !== 1) || (confs !== 2) || (seqs !== 4) || (tipsNoSeq !== 1)) {
        console.log('    fixture problem: ' + zeros + ' zero-length, ' + negatives + ' negative, '
            + confs + ' with support, ' + seqs + ' with a sequence, ' + tipsNoSeq + ' tips without one');
        return false;
    }
    // ... and the digest has to notice a change, or "SAME" means nothing
    var poked = readPx(fs.readFileSync(pth.join(__dirname, './data/roundtrip_seqs.xml'), 'utf8'));
    var carrier = forester.getAllExternalNodes(poked).filter(function (n) {
        return n.sequences && n.sequences[0] && n.sequences[0].mol_seq;
    })[0];
    carrier.sequences[0].mol_seq.value = 'MKAL-IVQY';
    if (rtDigest(poked) === rtDigest(r.src)) {
        console.log('    the digest does not notice a changed residue');
        return false;
    }
    poked = readPx(fs.readFileSync(pth.join(__dirname, './data/roundtrip_seqs.xml'), 'utf8'));
    forester.getAllExternalNodes(poked)[0].branch_length = 0.99;
    if (rtDigest(poked) === rtDigest(r.src)) {
        console.log('    the digest does not notice a changed branch length');
        return false;
    }
    // and specifically a branch length going to ZERO, which is the shape the
    // phyloXML writer used to lose: a digest blind to it would pass forever
    poked = readPx(fs.readFileSync(pth.join(__dirname, './data/roundtrip_seqs.xml'), 'utf8'));
    forester.getAllExternalNodes(poked).filter(function (n) {
        return n.branch_length !== 0;
    })[0].branch_length = 0;
    if (rtDigest(poked) === rtDigest(r.src)) {
        console.log('    the digest does not notice a branch length becoming zero');
        return false;
    }

    // the round trip itself, minus the two things Nexus cannot carry: the
    // fixture's support is typed 'bootstrap' and comes back 'unknown'
    var want = rtDigest(r.src).replace(/bootstrap=/g, 'unknown=');
    var got = rtDigest(r.back);
    if (want !== got) {
        console.log('    the fixture did not survive phyloXML -> Nexus -> phyloXML'
            + rtFirstDiff(want, got));
        return false;
    }

    // --- and a real file: 121 tips, 33 zero-length branches, one negative,
    // an aligned sequence on every tip. This is the one that caught the
    // phyloXML writer dropping zeros.
    var big = chain('./data/phyloxml_trees/bunya_glyco.xml');
    if (rtDigest(big.src) !== rtDigest(big.back)) {
        console.log('    bunya_glyco.xml did not survive the round trip'
            + rtFirstDiff(rtDigest(big.src), rtDigest(big.back)));
        return false;
    }
    var zerosBack = 0;
    forester.preOrderTraversalAll(forester.getTreeRoot(big.back), function (n) {
        if (n.branch_length === 0) { ++zerosBack; }
    });
    if (zerosBack !== 33) {
        console.log('    expected 33 zero-length branches back, got ' + zerosBack);
        return false;
    }

    // --- the two documented losses, stated explicitly --------------------
    var typed = readPx(fs.readFileSync(pth.join(__dirname, './data/roundtrip_seqs.xml'), 'utf8'));
    var viaNexus = forester.parseNexus(forester.toNexus(typed, rtDecimals(), true), true, false)[0];
    var types = [];
    forester.preOrderTraversalAll(forester.getTreeRoot(viaNexus), function (n) {
        (n.confidences || []).forEach(function (c) { types.push(c.type + '=' + c.value); });
    });
    types.sort();
    if (types.join(' ') !== 'unknown=80 unknown=95') {
        console.log('    support through Nexus is no longer untyped-but-intact: ' + types.join(' '));
        return false;
    }
    // a node with TWO confidences keeps the FIRST, as the desktop does
    var two = readPx(fs.readFileSync(pth.join(__dirname, './data/roundtrip_seqs.xml'), 'utf8'));
    forester.preOrderTraversalAll(forester.getTreeRoot(two), function (n) {
        if (n.name === 'mammals') {
            n.confidences = [{type: 'bootstrap', value: 95}, {type: 'posterior', value: 0.99}];
        }
    });
    var nexTwo = forester.toNexus(two, rtDecimals(), true);
    if (nexTwo.indexOf('mammals:0.123456789[95]') < 0) {
        console.log('    a node with two confidences should keep the first: '
            + nexTwo.split('Begin Trees;')[1]);
        return false;
    }
    return true;
}

function testNexusPhyloXmlNexusRoundTrip() {
    var px = require('./lib/phyloxml').phyloXml;
    var fs = require('fs');
    var readPx = function (xml) { return px.parse(xml, {trim: true, normalize: true})[0]; };

    // Starting FROM Nexus, the comparison can be the bytes themselves: write
    // the file, take it through phyloXML and back, and the two Nexus files
    // must be identical. Anything the middle format lost would show up as a
    // different line.
    function chain(nexus) {
        var first = forester.parseNexus(nexus, true, false)[0];
        var viaPx = readPx(px.toPhyloXML(first, rtDecimals()));
        return {first: first, second: forester.toNexus(viaPx, rtDecimals(), true)};
    }

    // the fixture's own Nexus form: quoted names, a missing-data row, support,
    // zero-length and negative branches
    var start = forester.toNexus(
        readPx(fs.readFileSync(pth.join(__dirname, './data/roundtrip_seqs.xml'), 'utf8')),
        rtDecimals(), true);
    // the starting file has to contain the awkward parts, or this proves little
    if ((start.indexOf('?????????') < 0) || (start.indexOf('"Seba\'s bat"') < 0)
        || (start.indexOf(':-0.001') < 0) || (start.indexOf('[95]') < 0)
        || (start.indexOf('Anas:0,') < 0)) {
        console.log('    the starting Nexus lost an awkward part before the test began:\n' + start);
        return false;
    }
    var r = chain(start);
    if (start !== r.second) {
        var la = start.split('\n');
        var lb = r.second.split('\n');
        for (var i = 0; i < Math.max(la.length, lb.length); ++i) {
            if (la[i] !== lb[i]) {
                console.log('    line ' + i + ' changed:\n      in  ' + la[i] + '\n      out ' + lb[i]);
            }
        }
        return false;
    }
    // the tree and its sequences, not just the bytes
    var again = forester.parseNexus(r.second, true, false)[0];
    if (rtDigest(r.first) !== rtDigest(again)) {
        console.log('    the tree changed although the bytes matched'
            + rtFirstDiff(rtDigest(r.first), rtDigest(again)));
        return false;
    }
    // and the sequences specifically: four tips carry one, the fifth does not
    // and must NOT have acquired a row of question marks as data
    var withSeq = forester.getAllExternalNodes(again).filter(function (n) {
        return n.sequences && n.sequences[0] && n.sequences[0].mol_seq
            && n.sequences[0].mol_seq.value;
    });
    if (withSeq.length !== 4) {
        console.log('    expected 4 sequences after the round trip, got ' + withSeq.length);
        return false;
    }
    if (!withSeq.every(function (n) { return n.sequences[0].mol_seq.value.length === 9; })) {
        console.log('    a sequence changed length across the round trip');
        return false;
    }

    // a real Nexus file with a real alignment, straight off the demo data
    var swh1 = fs.readFileSync(pth.join(__dirname, '../docs/data/swH1-HA1.nexus'), 'utf8');
    var startBig = forester.toNexus(forester.parseNexus(swh1, true, false)[0], rtDecimals(), true);
    var rBig = chain(startBig);
    if (startBig !== rBig.second) {
        console.log('    swH1-HA1.nexus did not survive Nexus -> phyloXML -> Nexus');
        var xa = startBig.split('\n');
        var xb = rBig.second.split('\n');
        for (var j = 0; j < Math.max(xa.length, xb.length); ++j) {
            if (xa[j] !== xb[j]) {
                console.log('      line ' + j + '\n      in  ' + String(xa[j]).substring(0, 160)
                    + '\n      out ' + String(xb[j]).substring(0, 160));
                break;
            }
        }
        return false;
    }
    return true;
}


// phyloxml.js is vendored here from phyloxml-js, in two copies inside the
// repo: test/lib (what the suite runs) and docs/lib (what the demo site and
// every browser loads). They have drifted before -- test/lib sat at 1.0.0
// while the package was at 1.0.2, and both sat at a 1.0.2 banner over 1.1.0
// code -- and when they do, the tests certify something the product does not
// ship. Nothing copies them automatically (npm run docs:sync handles only
// archaeopteryx.js and forester.js), so this is the only thing standing
// between a hand copy and a silent divergence.
function testVendoredPhyloXmlCopiesAgree() {
    var fs = require('fs');
    var a = pth.join(__dirname, 'lib', 'phyloxml.js');
    var b = pth.join(__dirname, '..', 'docs', 'lib', 'phyloxml.js');
    var sa = fs.readFileSync(a, 'utf8');
    var sb = fs.readFileSync(b, 'utf8');
    if (sa !== sb) {
        var la = sa.split('\n');
        var lb = sb.split('\n');
        for (var i = 0; i < Math.max(la.length, lb.length); ++i) {
            if (la[i] !== lb[i]) {
                console.log('    test/lib and docs/lib differ from line ' + (i + 1)
                    + ':\n      test/lib: ' + String(la[i]).substring(0, 120)
                    + '\n      docs/lib: ' + String(lb[i]).substring(0, 120));
                return false;
            }
        }
        console.log('    test/lib and docs/lib differ in length');
        return false;
    }
    // and the banner has to be a version, so a drift is legible when it happens
    var m = sa.match(/^\/\/ v (\d+\.\d+\.\d+)\s*$/m);
    if (!m) {
        console.log('    no "// v X.Y.Z" banner in the vendored phyloxml.js');
        return false;
    }
    // The third copy: the npm dependency, which is what a consumer of
    // archaeopteryx actually gets. It sat one release behind the vendored
    // copies while this repo's suite certified the fixed code -- exactly the
    // gap that lets a bug ship green.
    var dep = pth.join(__dirname, '..', 'node_modules', 'phyloxml', 'phyloxml.js');
    if (!fs.existsSync(dep)) {
        console.log('    node_modules/phyloxml is missing; run npm install');
        return false;
    }
    if (fs.readFileSync(dep, 'utf8') !== sa) {
        var dm = fs.readFileSync(dep, 'utf8').match(/^\/\/ v (\d+\.\d+\.\d+)\s*$/m);
        console.log('    the vendored copies (' + m[1] + ') and the npm dependency ('
            + (dm ? dm[1] : 'unknown') + ') are not the same file');
        return false;
    }
    // ... and the range in package.json has to admit that version, or the next
    // npm install quietly undoes this
    var range = JSON.parse(fs.readFileSync(pth.join(__dirname, '..', 'package.json'), 'utf8'))
        .dependencies.phyloxml;
    if (range.replace(/^[^0-9]*/, '') !== m[1]) {
        console.log('    package.json asks for phyloxml ' + range + ', vendored is ' + m[1]);
        return false;
    }
    return true;
}


// The SAME label chain in New Hampshire and in Nexus. Before 2026-09-23 the
// Nexus writer applied it and toNewHampshire wrote node.name and nothing
// else, so a tree saved in the two formats named its tips differently -- a
// nameless tip with a taxonomy came out HUMAN in the Nexus file and empty in
// the Newick one. Christian: "adopt the same chain and placeholder in
// toNewHampshire".
//
// The expected Newick is the DESKTOP's, taken by running their build on this
// tree: "((P12345,recA)HUMAN,(node3,plain));". Note what it says: the chain
// reaches INTERNAL nodes too (HUMAN), the placeholder does NOT (the second
// internal node and the root stay unlabeled), and the placeholder counts tip
// positions rather than placeholders (node3, not node1).
function testOneLabelChainForBothWriters() {
    var phy = forester.parseNewHampshire("((,),(,));", true, false);
    var t = forester.getAllExternalNodes(phy).reverse();
    t[0].sequences = [{accession: {value: "P12345", source: "UniProt"}}];
    t[1].taxonomies = [{}];
    t[1].sequences = [{name: "recA"}];
    t[3].name = "plain";
    forester.preOrderTraversalAll(forester.getTreeRoot(phy), function (n) {
        if (n.children && n.children.indexOf(t[0]) > -1) {
            n.taxonomies = [{code: "HUMAN"}];
        }
    });
    var nh = forester.toNewHampshire(phy, 9, true, false);
    if (nh !== "((P12345,recA)HUMAN,(node3,plain));") {
        console.log("    Newick: " + nh);
        return false;
    }
    // and the Nexus form has to name the same tips the same way, in all three
    // places, or the file cannot be joined back up
    phy.rooted = false;
    var nex = forester.toNexus(phy, 9, true);
    if (nex.indexOf(" TaxLabels P12345 recA node3 plain;") < 0
        || nex.indexOf("((P12345,recA)HUMAN,(node3,plain))") < 0) {
        console.log("    Nexus:\n" + nex);
        return false;
    }
    // writing must not mutate the caller's tree: toNexus used to rename
    // nameless tips in place and undo it afterwards, and an exception in
    // between would have left the caller holding a renamed tree
    if (t[0].name !== undefined || t[2].name !== undefined) {
        console.log("    toNexus renamed the caller's nodes: "
            + JSON.stringify([t[0].name, t[2].name]));
        return false;
    }
    return true;
}


// Two tips must not share a taxon label. A matrix is keyed on that label, so
// the reader takes the repeat for an interleaved continuation and hands BOTH
// tips the two sequences joined together -- corruption, not just an invalid
// file. Two ways in, found on the desktop side and confirmed here before
// touching anything:
//   - a tip literally named "node2" colliding with the placeholder we mint;
//   - genuinely duplicate tip names, which is nobody's bug and ours to refuse.
// Expectations taken by running their build on the same two trees, whose
// whole Nexus output is identical to ours byte for byte.
function testNexusLabelCollisions() {
    function tree(nh, a, b) {
        var p = forester.parseNewHampshire(nh, true, false);
        var t = forester.getAllExternalNodes(p).reverse();
        t[0].sequences = [{mol_seq: {is_aligned: true, value: a}}];
        t[1].sequences = [{mol_seq: {is_aligned: true, value: b}}];
        p.rooted = false;
        return p;
    }
    function fail(msg, detail) {
        console.log('    ' + msg + (detail === undefined ? '' : ':\n' + detail));
        return false;
    }
    // a real tip called "node2", and a nameless tip that would be minted one
    var nex = forester.toNexus(tree("(node2,);", "MKAL", "MKIV"), 9, true);
    if (nex.indexOf(" TaxLabels node2 node3;") < 0) {
        return fail("the placeholder collided with a real tip name", nex);
    }
    if (nex.indexOf("(node2,node3)") < 0) {
        return fail("the trees block disagrees with TaxLabels", nex);
    }
    // it must round trip with BOTH sequences intact, which is the point
    var back = forester.getAllExternalNodes(forester.parseNexus(nex, true, false)[0]).reverse();
    var got = back.map(function (n) {
        var q = n.sequences && n.sequences[0];
        return n.name + '=' + ((q && q.mol_seq) ? q.mol_seq.value : 'none');
    }).join(' ');
    if (got !== "node2=MKAL node3=MKIV") {
        return fail("sequences were mixed up across the collision", got);
    }
    // and genuinely duplicate names: no matrix at all, and a comment saying why
    var dup = forester.toNexus(tree("(dup,dup);", "MKAL", "MKIV"), 9, true);
    if (dup.indexOf("Begin Characters;") > -1) {
        return fail("a matrix was written for duplicate taxon labels", dup);
    }
    if (dup.indexOf("[ Molecular sequences were not written: two or more tips share the taxon"
        + " label dup,") < 0) {
        return fail("no comment explaining the refusal", dup);
    }
    // the file still has to be readable as a tree
    if (forester.getAllExternalNodes(forester.parseNexus(dup, true, false)[0]).length !== 2) {
        return fail("the refusal comment broke the file", dup);
    }
    return true;
}

// The matrix DataType is a property of the WHOLE matrix, so every sequence
// decides it -- not the first one that guesses non-null. A matrix wrongly
// declared DNA is read back with every non-nucleotide residue replaced by N,
// so protein wins any disagreement: calling a nucleotide alignment protein
// leaves the residues readable, the reverse destroys them.
//
// Every expectation below was taken by RUNNING the desktop writer on the same
// pair, including the last one, where both programs are wrong in the same way
// and deliberately so.
function testNexusMatrixDatatype() {
    function typeOf(a, b) {
        var p = forester.parseNewHampshire("(A,B);", true, false);
        var t = forester.getAllExternalNodes(p).reverse();
        t[0].sequences = [{mol_seq: {is_aligned: true, value: a}}];
        t[1].sequences = [{mol_seq: {is_aligned: true, value: b}}];
        p.rooted = false;
        var m = / Format DataType=(\S+) /.exec(forester.toNexus(p, 9, true));
        return m ? m[1] : null;
    }
    var cases = [
        ["ACGTACGT", "MKALIVQW", "Protein"],   // one protein anywhere wins ...
        ["MKALIVQW", "ACGTACGT", "Protein"],   // ... whichever side it is on
        ["ACGUACGU", "ACGUACGU", "RNA"],
        // Gaps and missing symbols are stripped before the guess, matching
        // the desktop. NOTE for anyone mutating that line: it cannot change
        // an answer, and no fixture will ever catch its removal. The guesser
        // tests membership of L/I/E/H/D/Q/T/U and the stripped characters are
        // -.?*, disjoint sets; a sequence that empties under the strip is made
        // only of those, and guesses null either way. Checked over a million
        // pairs as well as argued: zero differences. It stays because the
        // desktop has it and because the next guesser may test a character
        // that is not a letter -- but a survivor there is an EQUIVALENT
        // MUTANT, not a hole to plug.
        ["--------", "ACGTACGT", "DNA"],
        // The case that motivated adding F, P and V on 2026-09-23. Its only
        // protein-exclusive residue is P: before that MKATSWNP guessed DNA,
        // this pair agreed on DNA, and the matrix went out declared DNA --
        // which read back as MKATSWNN, every non-nucleotide residue replaced.
        ["ACGTACGT", "MKATSWNP", "Protein"]
    ];
    for (var i = 0; i < cases.length; ++i) {
        var got = typeOf(cases[i][0], cases[i][1]);
        if (got !== cases[i][2]) {
            console.log('    ' + cases[i][0] + ' + ' + cases[i][1] + ' -> ' + got
                + ', expected ' + cases[i][2]);
            return false;
        }
    }

    // The guesser's alphabet, letter for letter, so that NEITHER PROGRAM CAN
    // RETUNE IT ALONE. Both write the same DataType only because both test the
    // same six letters; a letter added on one side and not the other types the
    // same file two ways, which is worse than the shared blind spot below.
    //
    // "<letter>T" is what makes this discriminate: a letter the guesser calls
    // protein gives Protein, and one it does not falls through to the T and
    // gives DNA. Testing the bare letter cannot tell "read as protein" from
    // "no verdict, defaulted to Protein" — they both come out Protein.
    //
    // The expected string was produced by RUNNING the desktop writer over the
    // same 26 constructions; ours is identical letter for letter.
    //
    // Under forester's own alphabets the protein-exclusive letters are
    // BDEFHILOPQVXZ. DEHILQFPV are tested; B, O, X and Z are not, deliberately
    // — rare enough to buy almost nothing, and every letter added is one both
    // programs must add. F, P and V went in on 2026-09-23 on Christian's word,
    // on both sides in the same move; the string below was taken by running
    // the desktop's build after its change.
    var perLetter = [];
    for (var c = 65; c <= 90; ++c) {
        var letter = String.fromCharCode(c);
        perLetter.push(letter + '=' + typeOf(letter + 'T', letter + 'T'));
    }
    var expected = 'A=DNA B=DNA C=DNA D=Protein E=Protein F=Protein G=DNA H=Protein'
        + ' I=Protein J=DNA K=DNA L=Protein M=DNA N=DNA O=DNA P=Protein Q=Protein'
        + ' R=DNA S=DNA T=DNA U=DNA V=Protein W=DNA X=DNA Y=DNA Z=DNA';
    if (perLetter.join(' ') !== expected) {
        console.log('    the guesser\'s alphabet drifted from the desktop\'s:\n      got  '
            + perLetter.join(' ') + '\n      want ' + expected);
        return false;
    }
    return true;
}


// n / min / median / max / mean / sum. Every expectation below is worked out
// by hand, not read off the implementation.
function testDescribeValues() {
    function fail(msg, got) {
        console.log('    ' + msg + ': ' + JSON.stringify(got));
        return false;
    }
    if (forester.describeValues([]) !== null || forester.describeValues(null) !== null) {
        return fail('an empty list should describe as null', forester.describeValues([]));
    }
    // odd count: the median is the middle value of 1,2,3,4,10 -> 3
    var odd = forester.describeValues([3, 1, 10, 2, 4]);
    if (odd.n !== 5 || odd.min !== 1 || odd.max !== 10 || odd.median !== 3
        || odd.sum !== 20 || odd.mean !== 4) {
        return fail('odd-length', odd);
    }
    // even count: the mean of the two middle values of 1,2,4,10 -> 3
    var even = forester.describeValues([10, 1, 4, 2]);
    if (even.n !== 4 || even.median !== 3 || even.sum !== 17 || even.mean !== 17 / 4) {
        return fail('even-length', even);
    }
    // a single value is its own everything
    var one = forester.describeValues([7]);
    if (one.n !== 1 || one.min !== 7 || one.max !== 7 || one.median !== 7 || one.mean !== 7) {
        return fail('single value', one);
    }
    // negatives and zero take part
    var mixed = forester.describeValues([0, -2, 2]);
    if (mixed.min !== -2 || mixed.median !== 0 || mixed.max !== 2 || mixed.sum !== 0) {
        return fail('negatives and zero', mixed);
    }
    // and the caller's array is NOT reordered: it is sorted on a copy
    var given = [3, 1, 2];
    forester.describeValues(given);
    if (given.join(',') !== '3,1,2') {
        return fail('the input was sorted in place', given);
    }
    return true;
}

// The tree-level statistics behind the Tree Properties dialog. The tree is
// built by hand so every count can be checked by reading it:
//
//        root
//         +-- inner "A"  (bootstrap 90, posterior 0.95, MAD 0.4)
//         |     +-- t1   :1
//         |     +-- t2   :0
//         |     +-- t3   :-0.5       <- a polytomy of three, a zero, a negative
//         +-- t4         :2
//
// tips 4, internal 2 (root + A), nodes 6, branches 5 (every node but the root),
// one polytomy, depth 2.
function testTreeStatistics() {
    function fail(msg, got) {
        console.log('    ' + msg + ': ' + JSON.stringify(got));
        return false;
    }
    var t1 = {name: 't1', branch_length: 1,
        taxonomies: [{scientific_name: 'Homo sapiens', id: {value: '9606'}}],
        sequences: [{mol_seq: {is_aligned: true, value: 'MKAL'}}],
        properties: [{ref: 'x:a', value: '1'}, {ref: 'x:a', value: '2'}, {ref: 'x:b', value: '3'}]};
    var t2 = {name: 't2', branch_length: 0,
        taxonomies: [{scientific_name: 'Homo sapiens'}],
        distributions: [{desc: 'here'}],
        date: {value: 1999}};
    var t3 = {name: 't3', branch_length: -0.5, properties: [{ref: 'x:b', value: '4'}]};
    var inner = {name: 'A', branch_length: 0.5, children: [t1, t2, t3],
        confidences: [{type: 'bootstrap', value: 90}, {type: 'posterior', value: 0.95},
            {type: forester.MAD_CONFIDENCE_TYPE, value: 0.4}],
        events: {duplications: 1}};
    var t4 = {name: 't4', branch_length: 2};
    var root = {children: [inner, t4]};

    var st = forester.treeStatistics(root);
    if (st.tips !== 4 || st.internal !== 2 || st.nodes !== 6 || st.branches !== 5) {
        return fail('counts', {tips: st.tips, internal: st.internal, nodes: st.nodes, branches: st.branches});
    }
    // NOTE on mutating the depth logic: `maxDepth = depth + 1` and
    // `depth + 1 > maxDepth` are both EQUIVALENT MUTANTS here and in any tree.
    // Depth grows by one along the first path down, so the overshoot is always
    // corrected by the next comparison, and no fixture can separate them.
    // `maxDepth = depth - 1` IS caught, which is what shows depth is tested.
    if (st.polytomies !== 1 || st.maxChildren !== 3 || st.depth !== 2) {
        return fail('shape', {polytomies: st.polytomies, maxChildren: st.maxChildren, depth: st.depth});
    }
    // branch lengths: 0.5, 1, 0, -0.5, 2 -> sorted -0.5, 0, 0.5, 1, 2
    var bl = st.branchLengths;
    if (bl.n !== 5 || bl.min !== -0.5 || bl.max !== 2 || bl.median !== 0.5 || bl.sum !== 3) {
        return fail('branch lengths', bl);
    }
    if (bl.zero !== 1 || bl.negative !== 1) {
        return fail('zero / negative counts', bl);
    }
    // support: grouped BY TYPE, and the MAD value is not support
    if (st.support.length !== 2) {
        return fail('expected one group per support type', st.support);
    }
    var boot = st.support.filter(function (g) { return g.type === 'bootstrap'; })[0];
    var post = st.support.filter(function (g) { return g.type === 'posterior'; })[0];
    if (!boot || !post || boot.n !== 1 || boot.median !== 90 || post.median !== 0.95) {
        return fail('support by type', st.support);
    }
    if (st.support.some(function (g) { return g.type === forester.MAD_CONFIDENCE_TYPE; })) {
        return fail('a MAD value was counted as support', st.support);
    }
    // coverage
    if (st.tipsWithTaxonomy !== 2 || st.distinctTaxonomies !== 1 || st.tipsWithTaxonomyId !== 1) {
        return fail('taxonomy coverage', {t: st.tipsWithTaxonomy, d: st.distinctTaxonomies,
            id: st.tipsWithTaxonomyId});
    }
    if (st.tipsWithSequence !== 1 || st.tipsWithMolSeq !== 1 || st.tipsWithDomains !== 0) {
        return fail('sequence coverage', st);
    }
    if (st.nodesWithDate !== 1 || st.tipsWithDistribution !== 1) {
        return fail('dates / distributions', {d: st.nodesWithDate, dist: st.tipsWithDistribution});
    }
    if (st.namedInternal !== 1 || st.nodesWithEvents !== 1 || st.duplications !== 1) {
        return fail('internal nodes and events', {n: st.namedInternal, e: st.nodesWithEvents,
            d: st.duplications});
    }
    // properties: per ref, and a node carrying one ref TWICE counts once
    var refs = {};
    st.propertyRefs.forEach(function (r) { refs[r.ref] = r.nodes; });
    if (refs['x:a'] !== 1 || refs['x:b'] !== 2 || st.propertyRefs.length !== 2) {
        return fail('property refs', st.propertyRefs);
    }
    // ultrametric: this tree is not (tip distances 1.5, 0.5, 0, 2)
    if (st.ultrametric) {
        return fail('a ragged tree should not read as ultrametric', st.ultrametric);
    }
    if (st.height !== 2) {
        return fail('height is the farthest tip from the root', st.height);
    }
    // ... and one that IS: every tip two steps of 1 from the root
    var even = forester.treeStatistics(forester.getTreeRoot(
        forester.parseNewHampshire('((a:1,b:1):1,(c:1,d:1):1);', true, false)));
    if (!even.ultrametric || even.height !== 2) {
        return fail('a balanced tree should read as ultrametric', even);
    }
    // a tree with no lengths has none of this rather than zeros
    var bare = forester.treeStatistics(forester.getTreeRoot(
        forester.parseNewHampshire('((a,b),c);', true, false)));
    if (bare.branchLengths !== null || bare.ultrametric || bare.tips !== 3) {
        return fail('a tree without lengths', bare);
    }
    return true;
}


// The occupancy map behind "auto-hide crowded branch data", adopted from the
// desktop (LabelOccupancy, 0.11.161) as a JOINT rule on 2026-09-25. Every
// property below is one the two programs must share, or the same tree drops
// different marks in the two viewers. The COUNTS are not shared and cannot be
// -- the boxes come from each program's own font metrics.
function testLabelOccupancy() {
    function fail(msg, got) {
        console.log('    ' + msg + (got === undefined ? '' : ': ' + JSON.stringify(got)));
        return false;
    }
    var o = forester.labelOccupancy(16);
    // first claim wins
    if (!o.claim(0, 0, 10, 10)) {
        return fail('the first claim into an empty map must be granted');
    }
    if (o.claim(5, 5, 10, 10)) {
        return fail('an overlapping claim must be refused');
    }
    // a REFUSED claim records nothing, so it cannot block a later one. The
    // refused box above covered 5..15; if it had been recorded, this would be
    // refused too.
    if (!o.claim(11, 11, 4, 4)) {
        return fail('a refused claim must not have been recorded');
    }
    // boxes that merely TOUCH do not overlap: strict comparisons on all four
    // edges. 10..20 begins exactly where 0..10 ends.
    var t = forester.labelOccupancy(16);
    if (!t.claim(0, 0, 10, 10) || !t.claim(10, 0, 10, 10) || !t.claim(0, 10, 10, 10)) {
        return fail('touching edges must not count as overlapping');
    }
    // A zero-size box is granted and reserves nothing. NOTE for a sabotage
    // pass: removing that guard is an EQUIVALENT MUTANT and will survive.
    // Under the strict comparisons a zero-size box can never overlap anything,
    // so it would be granted either way; the guard only keeps entries out of
    // the map that could cost comparisons and never change a verdict. The
    // desktop's own comment says the same of theirs. The assertions below pin
    // the BEHAVIOUR, which is all either program promises.
    var z = forester.labelOccupancy(16);
    if (!z.claim(50, 50, 0, 5) || !z.claim(50, 50, 5, 0)) {
        return fail('a zero-size box must be granted');
    }
    if (!z.claim(50, 50, 5, 5)) {
        return fail('a zero-size box must not reserve space');
    }
    // overlap is tested on BOTH axes: same x, far apart in y, is free
    var ax = forester.labelOccupancy(16);
    if (!ax.claim(0, 0, 10, 10) || !ax.claim(0, 100, 10, 10)) {
        return fail('boxes far apart in y must not collide');
    }
    if (!ax.claim(100, 0, 10, 10)) {
        return fail('boxes far apart in x must not collide');
    }
    // a box WIDER THAN A CELL still blocks: this is the case a per-box linked
    // list gets wrong, and the desktop measured it as 12000 placed against
    // 12070 before they fixed it. Cell 4, box 100 wide, then a claim at the
    // far end of it.
    var wide = forester.labelOccupancy(4);
    if (!wide.claim(0, 0, 100, 4)) {
        return fail('the wide box should be granted');
    }
    if (wide.claim(96, 0, 4, 4)) {
        return fail('a box wider than one cell must block every cell it covers');
    }
    // the cell size is a performance knob, never a behavioural one: the same
    // claims must come out the same way whatever it is
    [1, 4, 16, 512].forEach(function (cell) {
        var m = forester.labelOccupancy(cell);
        m.claim(0, 0, 10, 10);
        if (m.claim(5, 5, 10, 10) || !m.claim(40, 40, 10, 10)) {
            throw new Error('cell size ' + cell + ' changed the verdict');
        }
    });
    // negative coordinates are ordinary: a tree group's origin is not its
    // top-left corner, and marks above or left of it are common
    var neg = forester.labelOccupancy(16);
    if (!neg.claim(-50, -50, 10, 10)) {
        return fail('a box at negative coordinates must be granted');
    }
    if (neg.claim(-45, -45, 10, 10)) {
        return fail('overlap must be detected at negative coordinates too');
    }
    return true;
}


// The claim ORDER for crowded branch data. This is the half of the joint rule
// that broke: the code took the layout's node list for preorder, but d3's
// descendants() is BREADTH-first and the viewer reverses it for drawing, so
// the root came LAST and the tie-break ran backwards -- the leaf-most mark
// winning where the desktop keeps the one nearer the root.
//
// It shipped and a review caught it, because the acceptance measurement
// ("zero overlapping marks") is order-INSENSITIVE by construction: whichever
// mark of a colliding pair you keep, the survivors still do not overlap. Only
// asking WHICH one survived can see it.
function testPreorderOf() {
    function fail(msg, got) {
        console.log('    ' + msg + (got === undefined ? '' : ': ' + got));
        return false;
    }
    function node(name, kids) {
        var n = {name: name, children: kids};
        (kids || []).forEach(function (k) { k.parent = n; });
        return n;
    }
    var a1 = node('a1'), a2 = node('a2'), b1 = node('b1');
    var a = node('a', [a1, a2]), b = node('b', [b1]);
    var r = node('r', [a, b]);
    var name = function (l) { return l.map(function (n) { return n.name; }).join(','); };

    // the order the viewer actually had: d3 descendants() reversed
    var asGiven = [b1, a2, a1, b, a, r];
    if (name(forester.preorderOf(asGiven)) !== 'r,a,a1,a2,b,b1') {
        return fail('preorder from the reversed breadth-first list',
            name(forester.preorderOf(asGiven)));
    }
    // and from any other order, including preorder itself
    if (name(forester.preorderOf([r, a, b, a1, a2, b1])) !== 'r,a,a1,a2,b,b1') {
        return fail('preorder from the breadth-first list',
            name(forester.preorderOf([r, a, b, a1, a2, b1])));
    }
    if (name(forester.preorderOf([r, a, a1, a2, b, b1])) !== 'r,a,a1,a2,b,b1') {
        return fail('preorder is stable when already in preorder');
    }
    // THE PROPERTY THAT MATTERS: a parent is always claimed before its child,
    // whatever order it arrives in. This is what makes the mark nearer the
    // root keep its place.
    var out = forester.preorderOf(asGiven);
    for (var i = 0; i < out.length; ++i) {
        var n = out[i];
        if (n.parent && out.indexOf(n.parent) > i) {
            return fail('a child was claimed before its parent', n.name);
        }
    }
    // a SUBTREE view: the nodes handed over do not include their parent, and
    // the walk has to root itself rather than drop them
    var sub = forester.preorderOf([a2, a1, a]);
    if (name(sub) !== 'a,a1,a2') {
        return fail('a subtree should root its own walk', name(sub));
    }
    // nothing is ever dropped, whatever the shape
    if (forester.preorderOf([b1, a1]).length !== 2 || forester.preorderOf([]).length !== 0) {
        return fail('detached nodes must still come out');
    }
    // a node listed twice comes out once
    if (forester.preorderOf([r, a, a, b, a1, a2, b1]).length !== 6) {
        return fail('a repeated node should appear once',
            forester.preorderOf([r, a, a, b, a1, a2, b1]).length);
    }
    return true;
}
