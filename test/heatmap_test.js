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

// Tests for the heat-map model in forester.js: which per-tip numeric property
// refs become columns, the order they are drawn in, the one scale they share,
// and what a cell holds when nobody filled it in.
//
// The trees are built here rather than read from a file: test_trees/ is
// excluded from git, so a test reading it passes on this machine and fails on
// every fresh checkout.

var forester = require('../forester').forester;

if (!forester) {
    throw new Error("no forester.js");
}

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

// A five-tip tree whose tips carry the columns named in `perTip`: an object of
// tipName -> array of [ref, value] pairs, IN THE ORDER the file would list them.
// A pair whose value is null is written as no property at all -- the cell
// nobody filled in.
function treeWith(perTip) {
    var phy = forester.parseNewHampshire('((a:0.1,b:0.1):0.2,(c:0.3,d:0.3):0.1,e:0.4);', true, false);
    forester.getAllExternalNodes(phy).forEach(function (n) {
        var cells = perTip[n.name] || [];
        n.properties = [];
        cells.forEach(function (c) {
            if (c[1] === null) {
                return;
            }
            n.properties.push({
                ref: c[0],
                value: String(c[1]),
                datatype: 'xsd:integer',
                applies_to: 'node'
            });
        });
    });
    return phy;
}

function labels(model) {
    return model.refs.map(function (r) {
        return r.ref;
    }).join(',');
}

// Three numeric columns on every tip: the columns are exactly those refs, in
// the order the tips list them, on one scale spanning every column's values.
function testColumnsAndScale() {
    var phy = treeWith({
        a: [['meta:x', 0], ['meta:y', 4], ['meta:z', 1]],
        b: [['meta:x', 1], ['meta:y', 3], ['meta:z', 2]],
        c: [['meta:x', 2], ['meta:y', 2], ['meta:z', 0]],
        d: [['meta:x', 3], ['meta:y', 1], ['meta:z', 7]],
        e: [['meta:x', 4], ['meta:y', 0], ['meta:z', 1]]
    });
    var m = forester.heatmapColumns(phy);
    if (labels(m) !== 'meta:x,meta:y,meta:z') {
        console.log('    columns: ' + labels(m));
        return false;
    }
    // ONE scale over every column: z's 7 lifts the whole matrix's max, it does
    // not give z a scale of its own
    if (m.min !== 0 || m.max !== 7) {
        console.log('    scale: ' + m.min + '..' + m.max);
        return false;
    }
    return true;
}

// THE GAP CASE. A tip missing a middle column must not move that column: the
// producer's grouping is the reason document order is used at all. Measured on
// the pan-genome demo, where 7 of 100 tips carry no dnaK and the first tip is
// one of them -- first-appearance ordering put that core gene at column 40 of 40.
//
// The gap has to sit on the tip the traversal reaches FIRST, or first-appearance
// gives the right answer by luck and this proves nothing. It is not the tip the
// Newick lists first: preOrderTraversalAll reaches them e, d, c, b, a here. So
// the fixture finds that tip itself and ASSERTS the gap landed on it.
function testAGapDoesNotMoveAColumn() {
    function build(withGap) {
        var phy = treeWith({
            a: [['meta:first', 1], ['meta:middle', 0], ['meta:last', 3]],
            b: [['meta:first', 2], ['meta:middle', 1], ['meta:last', 4]],
            c: [['meta:first', 3], ['meta:middle', 2], ['meta:last', 0]],
            d: [['meta:first', 4], ['meta:middle', 3], ['meta:last', 1]],
            e: [['meta:first', 0], ['meta:middle', 4], ['meta:last', 2]]
        });
        if (withGap) {
            var first = null;
            forester.preOrderTraversalAll(phy, function (n) {
                if (!first && !(n.children && n.children.length > 0)) {
                    first = n;
                }
            });
            first.properties = first.properties.filter(function (p) {
                return p.ref !== 'meta:middle';
            });
            phy._gapTip = first;
        }
        return phy;
    }
    var gapped = build(true);
    // the precondition, asserted rather than assumed
    if (!gapped._gapTip || gapped._gapTip.properties.some(function (p) {
        return p.ref === 'meta:middle';
    })) {
        console.log('    fixture: the gap is not on the first tip reached');
        return false;
    }
    var withGap = forester.heatmapColumns(gapped);
    if (labels(withGap) !== 'meta:first,meta:middle,meta:last') {
        console.log('    with a gap on the first tip reached: ' + labels(withGap));
        return false;
    }
    // the neighbouring case, differing by exactly the gap: the same order
    var whole = forester.heatmapColumns(build(false));
    if (labels(whole) !== labels(withGap)) {
        console.log('    filling the gap changed the order: ' + labels(whole) + ' vs ' + labels(withGap));
        return false;
    }
    return true;
}

// A cell nobody filled in is NULL, and never 0: on a presence/absence matrix
// reading a missing property as 0 states the opposite of what the file says.
// A blank and a non-numeric value are the same case. A missing cell is also
// left out of the scale.
function testMissingIsNotZero() {
    var phy = treeWith({
        a: [['meta:x', 5], ['meta:y', 9]],
        b: [['meta:x', 6], ['meta:y', 8]],
        c: [['meta:x', 7], ['meta:y', null]],
        d: [['meta:x', 8], ['meta:y', 7]],
        e: [['meta:x', 9], ['meta:y', 6]]
    });
    var tips = forester.getAllExternalNodes(phy);
    var c = tips.filter(function (n) {
        return n.name === 'c';
    })[0];
    if (forester.heatmapValue(c, 'meta:y') !== null) {
        console.log('    a missing property: ' + forester.heatmapValue(c, 'meta:y'));
        return false;
    }
    if (forester.heatmapValue(c, 'meta:x') !== 7) {
        console.log('    a present property: ' + forester.heatmapValue(c, 'meta:x'));
        return false;
    }
    // the scale spans 5..9; nothing in it came from the missing cell being read as 0
    var m = forester.heatmapColumns(phy);
    if (m.min !== 5 || m.max !== 9) {
        console.log('    scale: ' + m.min + '..' + m.max + ' (a missing cell was counted as a value)');
        return false;
    }
    // a blank string and a non-numeric value read the same as missing
    c.properties.push({ref: 'meta:blank', value: '   ', datatype: 'xsd:string', applies_to: 'node'});
    c.properties.push({ref: 'meta:word', value: 'absent', datatype: 'xsd:string', applies_to: 'node'});
    if (forester.heatmapValue(c, 'meta:blank') !== null || forester.heatmapValue(c, 'meta:word') !== null) {
        return false;
    }
    if (forester.heatmapValue(c, 'meta:nosuchref') !== null) {
        return false;
    }
    // a ref carried TWICE by one node: there is one cell, so the first value is
    // what it shows. Such refs are refused upstream as candidates, so this is a
    // backstop -- but it is a stated behaviour, so it is pinned rather than assumed.
    c.properties.push({ref: 'meta:twice', value: '11', datatype: 'xsd:integer', applies_to: 'node'});
    c.properties.push({ref: 'meta:twice', value: '22', datatype: 'xsd:integer', applies_to: 'node'});
    if (forester.heatmapValue(c, 'meta:twice') !== 11) {
        console.log('    a repeated ref: ' + forester.heatmapValue(c, 'meta:twice'));
        return false;
    }
    return true;
}

// Only NUMERIC per-tip properties are columns. A categorical field is not one,
// and neither is a property that only internal nodes carry -- there is no row
// to draw it on.
function testOnlyNumericTipProperties() {
    var phy = treeWith({
        a: [['meta:x', 0]],
        b: [['meta:x', 1]],
        c: [['meta:x', 2]],
        d: [['meta:x', 3]],
        e: [['meta:x', 4]]
    });
    forester.getAllExternalNodes(phy).forEach(function (n, i) {
        n.properties.push({ref: 'meta:host', value: (i % 2) ? 'cat' : 'dog', datatype: 'xsd:string', applies_to: 'node'});
    });
    // an internal node carrying BOTH a ref of its own and one the tips make a
    // candidate. The ref of its own must not become a column -- there is no row
    // to draw it on -- and its wild value must not reach the scale either. An
    // internal-only ref alone would not prove the second half: it is not a
    // candidate anyway, so the tip-only guard would look redundant.
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children && n.children.length > 0) {
            n.properties = [
                {ref: 'meta:inner', value: '3', datatype: 'xsd:integer', applies_to: 'node'},
                {ref: 'meta:x', value: '999', datatype: 'xsd:integer', applies_to: 'node'}
            ];
        }
    });
    var m = forester.heatmapColumns(phy);
    if (labels(m) !== 'meta:x') {
        console.log('    columns: ' + labels(m) + ' (a categorical or internal-only ref became a column)');
        return false;
    }
    if (m.min !== 0 || m.max !== 4) {
        console.log('    scale: ' + m.min + '..' + m.max + " (an internal node's value reached the scale)");
        return false;
    }
    return true;
}

// A tree with nothing to draw says so, rather than throwing or inventing a scale.
function testNothingToDraw() {
    var bare = forester.parseNewHampshire('((a:0.1,b:0.1):0.2,c:0.4);', true, false);
    var m = forester.heatmapColumns(bare);
    if (m.refs.length !== 0 || m.min !== null || m.max !== null) {
        console.log('    bare tree: ' + JSON.stringify(m));
        return false;
    }
    return true;
}

// A tree of `perTip` (name -> list of gene names, in that tip's OWN order),
// shaped so that ladderizing really does rearrange it.
function nested(perTip) {
    var names = Object.keys(perTip);
    var left = names.slice(0, 2).map(function (n) { return n + ':1'; }).join(',');
    var right = names.slice(2).map(function (n) { return n + ':1'; }).join(',');
    var phy = forester.parseNewHampshire('((' + left + '):1,(' + right + '):1);', true, false);
    forester.getAllExternalNodes(phy).forEach(function (n, i) {
        n.properties = (perTip[n.name] || []).map(function (g, j) {
            return {ref: 'meta:' + g, value: String((i * 3 + j * 7) % 5),
                datatype: 'xsd:integer', applies_to: 'node'};
        });
    });
    return phy;
}

function tipsReached(phy) {
    var out = [];
    forester.preOrderTraversalAll(phy, function (n) {
        if (!(n.children && n.children.length > 0)) {
            out.push(n.name);
        }
    });
    return out.join(',');
}

function columnOrder(phy) {
    return forester.heatmapColumns(phy).refs.map(function (r) {
        return r.label;
    }).join(' ');
}

// THE COLUMN ORDER IS A FACT ABOUT THE VALUES, not about how the tree is
// arranged for display. The traversal follows the tree's current child order,
// which ladderizing rewrites -- so a tie-break on "first seen" made the same
// file give "B A" ladderized and "A B" not. The fixture is built so half the
// tips say A,B and half say B,A: a genuine tie, which is the only case where
// a tie-break can be seen at all.
function testOrderDoesNotMoveWithTheTree() {
    var perTip = {a: ['A', 'B'], b: ['A', 'B'], c: ['B', 'A'], d: ['B', 'A'], e: []};
    var plain = nested(perTip);
    var laddered = nested(perTip);
    forester.ladderize(laddered, true);
    // the precondition, asserted: if ladderizing did not rearrange the tips,
    // this proves nothing at all
    if (tipsReached(plain) === tipsReached(laddered)) {
        console.log('    fixture: ladderizing did not rearrange this tree, so the claim is untested');
        return false;
    }
    if (columnOrder(plain) !== columnOrder(laddered)) {
        console.log('    ladderizing changed the column order: ' + columnOrder(plain)
            + ' vs ' + columnOrder(laddered));
        return false;
    }
    // ... and the same the other way round: reversing every tip's own list
    // must not move the answer either
    var mirrored = {a: ['B', 'A'], b: ['B', 'A'], c: ['A', 'B'], d: ['A', 'B'], e: []};
    if (columnOrder(nested(mirrored)) !== columnOrder(plain)) {
        console.log('    swapping which tips dissent changed the order: '
            + columnOrder(nested(mirrored)) + ' vs ' + columnOrder(plain));
        return false;
    }
    return true;
}

// How far the input agrees with itself about the order -- what the "As in the
// input" control reports, because a reader cannot tell by looking.
function testInputOrderAgreement() {
    function agree(perTip) {
        var phy = nested(perTip);
        return forester.heatmapInputOrderAgreement(phy, forester.heatmapColumns(phy).refs);
    }
    var same = agree({a: ['A', 'B', 'C'], b: ['A', 'B', 'C'], c: ['A', 'B', 'C'], d: ['A', 'B', 'C']});
    if (same.tips !== 4 || same.conflicting !== 0) {
        console.log('    a well-formed input: ' + JSON.stringify(same));
        return false;
    }
    // a GAP is not a disagreement: that tip simply has no value for B
    var gapped = agree({a: ['A', 'C'], b: ['A', 'B', 'C'], c: ['A', 'B', 'C'], d: ['A', 'B', 'C']});
    if (gapped.tips !== 4 || gapped.conflicting !== 0) {
        console.log('    a gap must not count as a disagreement: ' + JSON.stringify(gapped));
        return false;
    }
    // one tip genuinely out of order
    var odd = agree({a: ['A', 'B', 'C'], b: ['A', 'B', 'C'], c: ['C', 'A', 'B'], d: ['A', 'B', 'C']});
    if (odd.tips !== 4 || odd.conflicting !== 1) {
        console.log('    one dissenting tip: ' + JSON.stringify(odd));
        return false;
    }
    // a tip carrying nothing is not counted either way
    var empty = agree({a: ['A', 'B'], b: ['A', 'B'], c: ['A', 'B'], d: []});
    if (empty.tips !== 3 || empty.conflicting !== 0) {
        console.log('    a tip with no columns must not be counted: ' + JSON.stringify(empty));
        return false;
    }
    return true;
}

console.log();
console.log("heat-map model");
console.log();
runTest("columns and the shared scale : ", testColumnsAndScale);
runTest("a gap does not move a column : ", testAGapDoesNotMoveAColumn);
runTest("missing is not zero          : ", testMissingIsNotZero);
runTest("numeric per-tip refs only    : ", testOnlyNumericTipProperties);
runTest("nothing to draw              : ", testNothingToDraw);
runTest("the order is the data's, not the tree's: ", testOrderDoesNotMoveWithTheTree);
runTest("how far the input agrees with itself   : ", testInputOrderAgreement);
console.log();

if (_testFailures > 0) {
    console.log("heat-map model: " + _testFailures + " FAILED");
    process.exit(1);
}
console.log("All tests passed");
