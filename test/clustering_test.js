/**
 *  Copyright (C) 2026 Christian M. Zmasek
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

// The heat map's column ORDER: complete-linkage clustering on Euclidean and on
// Bray-Curtis distance, and the dendrogram behind it.
//
// The expectations are R's OWN output -- hclust(dist(t(m)), method = "complete")
// and vegan::vegdist(t(m), method = "bray") (R 4.5.3, vegan 2.7-2) -- carried
// over from the desktop Archaeopteryx's MatrixColumnOrderTest, which generated
// them. They are NOT this file restating the rule in its own words: a second
// implementation written by the same hand could agree with the first and guard
// nothing. Pinning to R pins the JS and the desktop to each other at the same
// time, which is the point: the two must cluster a matrix identically.
//
// The cases reach every branch: no ties, zero-distance ties (duplicate
// columns), a matrix where every pair ties, missing values (R's pairwise-
// deletion scaling), the double-zero matrix under both distances, and the
// three cases vegdist cannot answer.
//
// The trees are built here rather than read from a file: test_trees/ is
// excluded from git, so a test reading it passes on this machine and fails on
// every fresh checkout.

var forester = require('../forester').forester;

if (!forester) {
    throw new Error("no forester.js");
}

var EPS = 1.0e-6;
var _testFailures = 0;

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

// A tree of `rows.length` tips carrying `genes` as meta: properties.
// `rows[t][g]` is tip t's value for gene g; null is written as no property at
// all -- the cell nobody filled in.
function tree(genes, rows) {
    var names = rows.map(function (_, t) {
        return 't' + t + ':0.1';
    });
    var phy = forester.parseNewHampshire('(' + names.join(',') + ');', true, false);
    forester.getAllExternalNodes(phy).forEach(function (n, t) {
        n.properties = [];
        genes.forEach(function (g, i) {
            if (rows[t][i] === null || rows[t][i] === undefined) {
                return;
            }
            n.properties.push({ref: 'meta:' + g, value: String(rows[t][i]),
                datatype: 'xsd:integer', applies_to: 'node'});
        });
    });
    return phy;
}

// tips x genes from per-gene COLUMNS, as the fixtures read in R
function columns() {
    var cols = Array.prototype.slice.call(arguments);
    return cols[0].map(function (_, t) {
        return cols.map(function (c) {
            return c[t];
        });
    });
}

function cols(genes) {
    return genes.map(function (g) {
        return {ref: 'meta:' + g, label: g};
    });
}

function names(columnObjects) {
    return columnObjects.map(function (c) {
        return c.ref.replace(/^meta:/, '');
    }).join(',');
}

function values(genes, rows) {
    return forester.heatmapValueMatrix(tree(genes, rows), genes.map(function (g) {
        return 'meta:' + g;
    }));
}

// ---- the fixtures, as R read them ------------------------------------------

// R: cbind(g1=c(0,0,1,4,4,3), g2=c(0,1,1,4,3,3), g3=c(4,4,4,0,0,1),
//          g4=c(4,3,4,1,0,0), g5=c(2,2,2,2,2,2))
var NT_GENES = ['g1', 'g2', 'g3', 'g4', 'g5'];
var NT = columns([0, 0, 1, 4, 4, 3], [0, 1, 1, 4, 3, 3], [4, 4, 4, 0, 0, 1],
    [4, 3, 4, 1, 0, 0], [2, 2, 2, 2, 2, 2]);

// the 6x6 found by searching random matrices in R (seed 20260918) for one with
// NO tied distances on which complete, average, single and McQuitty linkage
// give four DIFFERENT orders -- so it isolates the linkage and nothing else.
// R: complete 6 3 5 4 1 2; average 6 1 4 2 3 5; single 1 6 4 2 3 5;
//    mcquitty 6 4 1 2 3 5.
var L6_GENES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
var L6 = columns([4, 4, 3, 3, 3, 2], [1, 1, 4, 3, 3, 0], [1, 3, 4, 1, 0, 0],
    [0, 4, 4, 1, 1, 4], [2, 0, 2, 0, 0, 1], [4, 1, 0, 0, 2, 4]);

// the double-zero matrix: h5 and h6 are each rare, share no tip they are both
// present in, and agree only by being absent
var DZ_GENES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
var DZ = columns([4, 4, 4, 4, 4, 4, 4, 4], [4, 4, 3, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 0, 0, 0, 0], [0, 0, 0, 0, 4, 4, 4, 4],
    [4, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 4]);

// ---- the dendrogram, field for field ---------------------------------------

function dendrogramIs(what, d, merge, height, order) {
    if (d.height.length !== merge.length) {
        console.log('    ' + what + ': ' + d.height.length + ' merges, R has ' + merge.length);
        return false;
    }
    for (var i = 0; i < merge.length; ++i) {
        if (d.left[i] !== merge[i][0] || d.right[i] !== merge[i][1]) {
            console.log('    ' + what + ': merge ' + (i + 1) + ' should be R\'s ('
                + merge[i][0] + ', ' + merge[i][1] + '), got (' + d.left[i] + ', ' + d.right[i] + ')');
            return false;
        }
        var h = height[i];
        if (isFinite(h) ? (Math.abs(d.height[i] - h) > EPS) : (d.height[i] !== h)) {
            console.log('    ' + what + ': height ' + (i + 1) + ' should be R\'s ' + h + ', got ' + d.height[i]);
            return false;
        }
    }
    if (d.order.join(',') !== order.join(',')) {
        console.log('    ' + what + ': order should be R\'s ' + order.join(',') + ', got ' + d.order.join(','));
        return false;
    }
    return true;
}

// The whole clustering, not just the order it reads out to: against R's hclust
// object field for field -- $merge, $height and $order. The merges and heights
// are what a DRAWN dendrogram is made of, so they are pinned before anything
// draws them.
function testDendrogramMatchesR() {
    if (!dendrogramIs('no-ties',
        forester.heatmapCompleteLinkage(forester.heatmapEuclideanDistances(values(NT_GENES, NT))),
        [[-1, -2], [-3, -4], [-5, 1], [2, 3]],
        [1.414213562, 1.732050808, 4.242640687, 8.774964387],
        [2, 3, 4, 0, 1])) {
        return false;
    }
    if (!dendrogramIs('6x6 linkage',
        forester.heatmapCompleteLinkage(forester.heatmapEuclideanDistances(values(L6_GENES, L6))),
        [[-3, -5], [-1, -2], [-4, 2], [1, 3], [-6, 4]],
        [4.0, 4.795831523, 5.830951895, 6.324555320, 7.141428429],
        [5, 2, 4, 3, 0, 1])) {
        return false;
    }
    if (!dendrogramIs('double-zero, euclidean',
        forester.heatmapCompleteLinkage(forester.heatmapEuclideanDistances(values(DZ_GENES, DZ))),
        [[-1, -2], [-5, -6], [-4, 1], [-3, 2], [3, 4]],
        [1.0, 5.656854249, 8.0, 8.944271910, 11.313708499],
        [3, 0, 1, 2, 4, 5])) {
        return false;
    }
    // the SAME leaves, grouped differently: vegdist(t(m), "bray") + hclust complete
    if (!dendrogramIs('double-zero, Bray-Curtis',
        forester.heatmapCompleteLinkage(forester.heatmapBrayCurtisDistances(values(DZ_GENES, DZ))),
        [[-1, -2], [-4, 1], [-3, -5], [-6, 2], [3, 4]],
        [0.015873016, 0.333333333, 0.6, 0.777777778, 1.0],
        [2, 4, 5, 3, 0, 1])) {
        return false;
    }
    // degenerate sizes: no merges to draw, and never a throw
    var none = forester.heatmapCompleteLinkage([]);
    var one = forester.heatmapCompleteLinkage([[0]]);
    if (none.height.length !== 0 || none.order.length !== 0
        || one.height.length !== 0 || one.order.length !== 1 || one.order[0] !== 0) {
        console.log('    0 and 1 columns must give a dendrogram with no merges');
        return false;
    }
    // a pair sharing no assessed tip has no distance, so its merge has no
    // finite height: whatever draws the dendrogram has to cope
    var gone = ['P', 'Q', 'Q2'];
    var inf = forester.heatmapCompleteLinkage(forester.heatmapEuclideanDistances(
        values(gone, columns([1, 1, null, null], [null, null, 2, 2], [null, null, 2, 3]))));
    if (inf.height[inf.height.length - 1] !== Infinity) {
        console.log('    the last merge of an unmeasurable pair must be +Infinity, got '
            + inf.height[inf.height.length - 1]);
        return false;
    }
    return true;
}

// R's dist() of the no-ties matrix, in R's own (column-major lower triangle) order.
function testEuclideanMatchesR() {
    var r = [1.414214, 8.774964, 8.246211, 4.242641, 7.937254, 7.483315, 3.464102, 1.732051, 4.582576, 4.242641];
    var d = forester.heatmapEuclideanDistances(values(NT_GENES, NT));
    var k = 0;
    for (var a = 0; a < 5; ++a) {
        for (var b = a + 1; b < 5; ++b) {
            if (Math.abs(d[a][b] - r[k]) > EPS) {
                console.log('    ' + NT_GENES[a] + '-' + NT_GENES[b] + ' should be R\'s ' + r[k] + ', got ' + d[a][b]);
                return false;
            }
            if (d[a][b] !== d[b][a]) {
                console.log('    the distance matrix must be symmetric');
                return false;
            }
            ++k;
        }
    }
    return true;
}

// Missing is not zero. X has BLANKS where Z has zeros. Pairwise deletion
// compares X and Z only where both were assessed (they agree: 0), and X with
// the all-zero Y only on those two tips, scaled up by 4/2 -- R gives 8.
// Filling the blanks with 0 would give 5.657, so this value can only come from
// the right rule.
function testMissingIsNotZero() {
    var genes = ['X', 'Z', 'Y'];
    var rows = columns([4, 4, null, null], [4, 4, 0, 0], [0, 0, 0, 0]);
    var d = forester.heatmapEuclideanDistances(values(genes, rows));
    if (Math.abs(d[0][1]) > EPS) {
        console.log('    X and Z agree wherever both were assessed: R gives 0, got ' + d[0][1]);
        return false;
    }
    if (Math.abs(d[0][2] - 8.0) > EPS) {
        console.log('    X-Y must be R\'s 8 (pairwise deletion, scaled 4/2); 5.657 would mean a blank read as 0; got '
            + d[0][2]);
        return false;
    }
    if (Math.abs(d[1][2] - 5.656854) > EPS) {
        console.log('    Z-Y (no blanks) must be R\'s 5.656854, got ' + d[1][2]);
        return false;
    }
    var o = forester.heatmapOrder(tree(genes, rows), cols(genes), 'clustered');
    if (names(o.columns) !== 'Y,X,Z') {
        console.log('    the missing-value case must cluster in R\'s order 3 1 2 (Y X Z), got ' + names(o.columns));
        return false;
    }
    return true;
}

// Every pair of the double-zero fixture, as vegdist(t(m), method = "bray") gives it.
function testBrayCurtisMatchesVegan() {
    var r = [
        [0.0, 0.015873015873, 0.333333333333, 0.333333333333, 0.777777777778, 0.777777777778],
        [0.015873015873, 0.0, 0.361702127660, 0.319148936170, 0.771428571429, 0.771428571429],
        [0.333333333333, 0.361702127660, 0.0, 1.0, 0.6, 1.0],
        [0.333333333333, 0.319148936170, 1.0, 0.0, 1.0, 0.6],
        [0.777777777778, 0.771428571429, 0.6, 1.0, 0.0, 1.0],
        [0.777777777778, 0.771428571429, 1.0, 0.6, 1.0, 0.0]];
    var d = forester.heatmapBrayCurtisDistances(values(DZ_GENES, DZ));
    for (var a = 0; a < 6; ++a) {
        for (var b = 0; b < 6; ++b) {
            if (Math.abs(d[a][b] - r[a][b]) > EPS) {
                console.log('    ' + DZ_GENES[a] + '-' + DZ_GENES[b] + ' should be vegdist\'s ' + r[a][b]
                    + ', got ' + d[a][b]);
                return false;
            }
        }
        if (d[a][a] !== 0.0) {
            console.log('    a column is at distance 0 from itself, got ' + d[a][a]);
            return false;
        }
    }
    return true;
}

// What the mode is FOR. On the same fixture the two distances disagree about
// the two rare genes, in opposite directions: Euclidean counts the six tips
// where both h5 and h6 are absent as agreement, so they become each other's
// NEAREST column; Bray-Curtis drops those tips, so they are each other's
// FARTHEST (1.0 -- never present together) and each one's nearest is the clade
// gene it actually occurs with (0.6).
function testDoubleZeroIsNotAgreement() {
    function nearest(d, g) {
        var best = -1;
        for (var k = 0; k < d.length; ++k) {
            if (k !== g && (best < 0 || d[g][k] < d[g][best])) {
                best = k;
            }
        }
        return best;
    }
    var v = values(DZ_GENES, DZ);
    var eu = forester.heatmapEuclideanDistances(v);
    if (nearest(eu, 4) !== 5) {
        console.log('    fixture: Euclidean must make the two rare genes each other\'s nearest (the double-zero'
            + ' problem this mode exists for); it does not, so the fixture stopped isolating the thing under test');
        return false;
    }
    var bc = forester.heatmapBrayCurtisDistances(v);
    if (nearest(bc, 4) !== 2 || nearest(bc, 5) !== 3) {
        console.log('    Bray-Curtis must put each rare gene nearest the clade gene it occurs with, got '
            + nearest(bc, 4) + ' and ' + nearest(bc, 5));
        return false;
    }
    if (bc[4][5] !== 1.0 || bc[3][2] !== 1.0) {
        console.log('    columns never present in the same tip are maximally distant (1.0), got ' + bc[4][5]);
        return false;
    }
    var phy = tree(DZ_GENES, DZ);
    var euclid = forester.heatmapOrder(phy, cols(DZ_GENES), 'clustered');
    if (names(euclid.columns) !== 'h4,h1,h2,h3,h5,h6') {
        console.log('    CLUSTERED must match R\'s Euclidean order 4 1 2 3 5 6, got ' + names(euclid.columns));
        return false;
    }
    var bray = forester.heatmapOrder(phy, cols(DZ_GENES), 'clustered-presence');
    if (names(bray.columns) !== 'h3,h5,h6,h4,h1,h2') {
        console.log('    CLUSTERED_PRESENCE must match R\'s Bray-Curtis order 3 5 6 4 1 2, got ' + names(bray.columns));
        return false;
    }
    return true;
}

// Missing cells are deleted pairwise (vegan's na.rm = TRUE), not read as 0 and
// not scaled up: being a ratio, Bray-Curtis needs no scaling. The neighbouring
// case is the SAME matrix with its blanks filled with 0, which R makes a
// different number on five of the six pairs -- so these values can only come
// from the right rule.
function testBrayCurtisPairwiseDeletion() {
    var genes = ['g1', 'g2', 'g3', 'g4'];
    var rows = columns([4, 4, 0, 2, null, 3], [4, null, 3, 0, 1, 2],
        [0, 0, null, 1, 4, 2], [2, 0, 4, null, 3, 1]);
    var d = forester.heatmapBrayCurtisDistances(values(genes, rows));
    var pairs = [[0, 1, 0.333333333333, 0.478260869565], [0, 2, 0.625, 0.7],
        [0, 3, 0.666666666667, 0.739130434783], [1, 2, 0.571428571429, 0.647058823529],
        [2, 3, 0.333333333333, 0.529411764706]];
    for (var i = 0; i < pairs.length; ++i) {
        var p = pairs[i];
        if (Math.abs(d[p[0]][p[1]] - p[2]) > EPS) {
            console.log('    pairwise deletion: ' + genes[p[0]] + '-' + genes[p[1]] + ' must be vegdist\'s ' + p[2]
                + ' (filling the blanks with 0 would give ' + p[3] + '), got ' + d[p[0]][p[1]]);
            return false;
        }
    }
    if (Math.abs(d[1][3] - 0.3) > EPS) {
        console.log('    g2-g4, the one pair zero-filling does NOT change, must still be 0.3, got ' + d[1][3]);
        return false;
    }
    return true;
}

// On 0/1 data Bray-Curtis IS the Sorensen-Dice dissimilarity -- the reason it
// is the right distance for presence/absence. Checked twice over: against
// vegdist's numbers (R 4.5.3, set.seed(7)) and against the Sorensen formula
// computed here from SET COUNTS, a different formula rather than a restatement
// of the one under test.
function testBrayCurtisIsSorensenOnBinary() {
    var genes = ['b1', 'b2', 'b3', 'b4', 'b5'];
    var bin = columns([1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1], [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0]);
    var d = forester.heatmapBrayCurtisDistances(values(genes, bin));
    var vegan = [0.75, 0.75, 1.0, 0.555555555556, 0.4, 0.454545454545, 0.636363636364, 0.272727272727,
        0.454545454545, 0.5];
    var k = 0;
    for (var a = 0; a < 5; ++a) {
        for (var b = a + 1; b < 5; ++b) {
            if (Math.abs(d[a][b] - vegan[k]) > EPS) {
                console.log('    binary ' + genes[a] + '-' + genes[b] + ' must be vegdist\'s ' + vegan[k]
                    + ', got ' + d[a][b]);
                return false;
            }
            var shared = 0;
            var inA = 0;
            var inB = 0;
            for (var t = 0; t < bin.length; ++t) {
                inA += bin[t][a];
                inB += bin[t][b];
                shared += (bin[t][a] === 1 && bin[t][b] === 1) ? 1 : 0;
            }
            var sorensen = 1.0 - ((2.0 * shared) / (inA + inB));
            if (Math.abs(d[a][b] - sorensen) > EPS) {
                console.log('    on 0/1 data Bray-Curtis must equal Sorensen-Dice ' + sorensen + ' for '
                    + genes[a] + '-' + genes[b] + ', got ' + d[a][b]);
                return false;
            }
            ++k;
        }
    }
    return true;
}

// The three cases vegdist cannot answer, each decided so clustering never sees
// a NaN: no jointly assessed tip at all (vegdist: NA) is +Infinity, so the pair
// joins last; two columns that are 0 at every tip they share (vegdist: NaN) are
// identical wherever they can be compared, so 0; and a pair whose signed values
// cancel to a non-positive total is +Infinity if the columns differ at all,
// never a negative distance or a NaN.
function testBrayCurtisEdges() {
    var genes = ['P', 'Q', 'Q2'];
    var rows = columns([1, 1, null, null], [null, null, 2, 2], [null, null, 2, 3]);
    var d = forester.heatmapBrayCurtisDistances(values(genes, rows));
    if (d[0][1] !== Infinity || d[0][2] !== Infinity) {
        console.log('    a pair with no jointly assessed tip must be +Infinity, got ' + d[0][1]);
        return false;
    }
    var o = forester.heatmapOrder(tree(genes, rows), cols(genes), 'clustered-presence');
    if (o.columns.length !== 3 || names(o.columns).split(',').sort().join(',') !== 'P,Q,Q2') {
        console.log('    an unmeasurable pair must still leave every column in the order, got ' + names(o.columns));
        return false;
    }
    var zero = ['z1', 'z2', 'z3'];
    var dz = forester.heatmapBrayCurtisDistances(values(zero, columns([0, 0, 0], [0, 0, 0], [0, 1, 0])));
    if (dz[0][1] !== 0.0) {
        console.log('    two columns 0 at every shared tip are identical there: 0, got ' + dz[0][1]);
        return false;
    }
    if (dz[0][2] !== 1.0) {
        console.log('    an all-zero column against one with a single 1 shares no presence: 1.0, got ' + dz[0][2]);
        return false;
    }
    var neg = ['n1', 'n2'];
    var dn = forester.heatmapBrayCurtisDistances(values(neg, columns([2, -2], [-2, 2])));
    if (dn[0][1] !== Infinity) {
        console.log('    a non-positive total with columns that differ must be +Infinity, got ' + dn[0][1]);
        return false;
    }
    return true;
}

// The order R's hclust reads out, on the cases that decide it: no ties,
// zero-distance ties (duplicate columns) and a matrix where EVERY pair ties --
// the last leaves the tie-break and the hcass2 leaf order deciding everything.
function testClusteredOrderMatchesR() {
    var nt = forester.heatmapOrder(tree(NT_GENES, NT), cols(NT_GENES), 'clustered');
    if (names(nt.columns) !== 'g3,g4,g5,g1,g2') {
        console.log('    no-ties case must match R\'s order 3 4 5 1 2, got ' + names(nt.columns));
        return false;
    }
    var dup = ['a', 'b', 'c', 'd'];
    var du = forester.heatmapOrder(tree(dup, columns([1, 2, 3], [1, 2, 3], [3, 2, 1], [1, 2, 3])),
        cols(dup), 'clustered');
    if (names(du.columns) !== 'c,d,a,b') {
        console.log('    zero-distance ties must break as R does (3 4 1 2), got ' + names(du.columns));
        return false;
    }
    var eq = ['e1', 'e2', 'e3', 'e4'];
    var ed = forester.heatmapOrder(tree(eq, columns([1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1])),
        cols(eq), 'clustered');
    if (names(ed.columns) !== 'e4,e3,e1,e2') {
        console.log('    an all-ties matrix must follow R\'s tie-break and hcass2 leaf order (4 3 1 2), got '
            + names(ed.columns));
        return false;
    }
    return true;
}

// The LINKAGE itself. On three to five columns the dendrograms of complete,
// average and single linkage coincide, so a wrong linkage passes every case
// above. This 6x6 gives four different orders for four linkages.
function testLinkageIsComplete() {
    var o = forester.heatmapOrder(tree(L6_GENES, L6), cols(L6_GENES), 'clustered');
    if (names(o.columns) !== 'h6,h3,h5,h4,h1,h2') {
        console.log('    complete linkage must give R\'s order 6 3 5 4 1 2 (average, single and McQuitty each'
            + ' differ on this matrix), got ' + names(o.columns));
        return false;
    }
    return true;
}

// A data-driven mode must not depend on the order the columns arrived in (the
// previous mode's). Fed alphabetically and reversed, the same clustering.
function testClusteredIgnoresIncomingOrder() {
    var phy = tree(L6_GENES, L6);
    var straight = names(forester.heatmapOrder(phy, cols(L6_GENES), 'clustered').columns);
    var shuffled = cols(L6_GENES).slice().reverse();
    var reversed = names(forester.heatmapOrder(phy, shuffled, 'clustered').columns);
    if (straight !== reversed) {
        console.log('    clustering must not depend on the incoming order: ' + straight + ' vs ' + reversed);
        return false;
    }
    return true;
}

// The dendrogram is offered only where there IS a clustering behind the order:
// not for a mode that did not cluster, and not for fewer than three columns,
// which are returned untouched.
function testDendrogramOnlyWhereItDescribesTheOrder() {
    var phy = tree(DZ_GENES, DZ);
    ['document', 'alphabetical', 'frequency'].forEach(function (m) {
        var o = forester.heatmapOrder(phy, cols(DZ_GENES), m);
        if (o.dendrogram !== null) {
            throw new Error('mode "' + m + '" did not cluster, so it must offer no dendrogram');
        }
    });
    ['clustered', 'clustered-presence'].forEach(function (m) {
        var o = forester.heatmapOrder(phy, cols(DZ_GENES), m);
        if (!o.dendrogram || o.dendrogram.order.length !== 6) {
            throw new Error('mode "' + m + '" must offer a dendrogram over all six columns');
        }
        // ... and its leaves ARE the order returned. The leaf indices count
        // into the columns in DOCUMENT order, which is what the clustering saw
        // -- not into the order they were passed in, and not into the order
        // that comes back.
        var normalised = forester.heatmapInDocumentOrder(phy, cols(DZ_GENES));
        var leaves = o.dendrogram.order.map(function (g) {
            return normalised[g].ref.replace(/^meta:/, '');
        }).join(',');
        if (leaves !== names(o.columns)) {
            throw new Error('the dendrogram\'s leaves must BE the column order: ' + leaves + ' vs ' + names(o.columns));
        }
    });
    var two = ['x', 'y'];
    var o2 = forester.heatmapOrder(tree(two, columns([1, 2], [2, 1])), cols(two), 'clustered');
    if (o2.dendrogram !== null || names(o2.columns) !== 'x,y') {
        console.log('    two columns have one order up to a flip: left alone, with no dendrogram');
        return false;
    }
    return true;
}

// Alphabetical is by the NAME the column header shows, ignoring case.
// Frequency is by the mean over the tips that HAVE a value, highest first, with
// a blank left out rather than averaged in as 0.
function testAlphabeticalAndFrequency() {
    var genes = ['Beta', 'alpha', 'Gamma'];
    var rows = columns([0, 0, null], [4, 4, 4], [1, 1, 1]);
    var phy = tree(genes, rows);
    var a = forester.heatmapOrder(phy, cols(genes), 'alphabetical');
    if (names(a.columns) !== 'alpha,Beta,Gamma') {
        console.log('    alphabetical ignores case, got ' + names(a.columns));
        return false;
    }
    var f = forester.heatmapOrder(phy, cols(genes), 'frequency');
    if (names(f.columns) !== 'alpha,Gamma,Beta') {
        console.log('    frequency is highest mean first, got ' + names(f.columns));
        return false;
    }
    // Beta is 0,0,blank: its mean is 0 over the two tips that HAVE a value.
    // Averaging the blank in as 0 would give the same 0 here, so the case that
    // tells them apart is a column whose only values are high and whose blanks
    // are many -- it must beat a column that is low everywhere.
    var g2 = ['sparse', 'dense'];
    var r2 = columns([4, null, null, null], [1, 1, 1, 1]);
    var f2 = forester.heatmapOrder(tree(g2, r2), cols(g2), 'frequency');
    if (names(f2.columns) !== 'sparse,dense') {
        console.log('    a blank must be left out of the mean, not averaged in as 0: got ' + names(f2.columns));
        return false;
    }
    return true;
}

console.log();
console.log("heat-map column order (pinned to R 4.5.3 / vegan 2.7-2)");
console.log();
runTest("dendrogram matches R's hclust  : ", testDendrogramMatchesR);
runTest("euclidean matches R's dist     : ", testEuclideanMatchesR);
runTest("missing is not zero            : ", testMissingIsNotZero);
runTest("Bray-Curtis matches vegdist    : ", testBrayCurtisMatchesVegan);
runTest("double zero is not agreement   : ", testDoubleZeroIsNotAgreement);
runTest("Bray-Curtis pairwise deletion  : ", testBrayCurtisPairwiseDeletion);
runTest("Bray-Curtis = Sorensen on 0/1  : ", testBrayCurtisIsSorensenOnBinary);
runTest("the cases vegdist cannot answer: ", testBrayCurtisEdges);
runTest("clustered order matches R      : ", testClusteredOrderMatchesR);
runTest("the linkage is complete linkage: ", testLinkageIsComplete);
runTest("order in, order out            : ", testClusteredIgnoresIncomingOrder);
runTest("a dendrogram only where it fits: ", testDendrogramOnlyWhereItDescribesTheOrder);
runTest("alphabetical and frequency     : ", testAlphabeticalAndFrequency);
console.log();

if (_testFailures > 0) {
    console.log("heat-map column order: " + _testFailures + " FAILED");
    process.exit(1);
}
console.log("All tests passed");
