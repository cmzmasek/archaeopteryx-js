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

// Tests for forester.visualizationCandidates, the classifier that decides --
// from the tree alone -- which elements are offered as Color, Color-range,
// or Shape visualizations.
//
// The ten trees under docs/data are the executable spec: they are the live
// demos, and five of them are real ViPR / BV-BRC virus phylogenies whose
// patchy, identifier-ridden annotations are exactly what the rules were
// tuned against. If a rule changes, these expectations change with it --
// deliberately, and visibly.

"use strict";

var fs = require('fs');
var pth = require('path');

var forester = require('../forester').forester;
var px = require('./lib/phyloxml').phyloXml;

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

// Parses a docs/data tree exactly the way archaeopteryx.parsePhyloXML does
// (trim + normalize -- normalize matters: property values in the real files
// are line-wrapped, and without it "North\n America" and "North America"
// would count as different values).
function loadTree(basename) {
    var file = pth.join(__dirname, '..', 'docs', 'data', basename + '.xml');
    return px.parse(fs.readFileSync(file, 'utf8'), {trim: true, normalize: true})[0];
}

// One line per candidate: "id mode" or "id mode+shape", in the classifier's
// own order: best first (categorical ahead of ranges, then by score --
// coverage x balance -- then alphabetically). The first entry is what the
// viewer auto-applies on load.
function summarize(candidates) {
    return candidates.map(function (c) {
        return c.id + ' ' + c.colorMode + (c.shape ? '+shape' : '')
            + (c.switchable ? ' [switch]' : '') + (c.wide ? ' [wide]' : '');
    });
}

function expectExactly(basename, expected) {
    var got = summarize(forester.visualizationCandidates(loadTree(basename)));
    if (got.length === expected.length && got.every(function (g, i) { return g === expected[i]; })) {
        return true;
    }
    console.log('    expected: ' + JSON.stringify(expected));
    console.log('    got     : ' + JSON.stringify(got));
    return false;
}

// A star tree with one external node per entry of `values`; null means the
// node carries no property at all. Returns the (super-rooted) phylogeny.
function starTree(values, ref) {
    ref = ref || 'x:F';
    var names = values.map(function (_, i) { return 'T' + i; });
    var phy = forester.parseNewHampshire('(' + names.join(',') + ')R;');
    var i = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) {
            return;
        }
        var v = values[i++];
        if (v !== null) {
            n.properties = (Array.isArray(v) ? v : [v]).map(function (one) {
                return {ref: ref, value: one, datatype: 'xsd:string', applies_to: 'node'};
            });
        }
    });
    return phy;
}

function only(phy) {
    var cands = forester.visualizationCandidates(phy);
    return cands.length === 1 ? cands[0] : null;
}

// --------------------------------------------------------------
// The ten demo trees
// --------------------------------------------------------------

// vipr:Genus (307/321, 4 genera) survives 14 missing nodes; vipr:Year
// (219/321 = 68.2%) sits just above the 2/3 coverage line -- the reason
// that line is 2/3 and not 70%. Host (125 distinct), Species (234),
// Strain (228), Collection_Date (151), the sequence names (253) and the
// scientific names (234) are all beyond 20 categories.
function testAdenoviridae() {
    // Host: 125 hosts over 273 covered nodes (repeat ratio 0.46) -- wide,
    // offered last, never auto-applied.
    return expectExactly('Adenoviridae', [
        'prop:vipr:Genus category+shape',
        'prop:vipr:Year range',
        'prop:vipr:Host category [wide]'
    ]);
}

// Genus has 10 values here: colour yes, shape no (7 is the shape limit).
function testCaliciviridae100() {
    // Year at 29 distinct values: over the 20-colour line, so a range with
    // no switch to individual colours.
    // Host squeaks past the wide guard at 47/89 = 0.528 -- the reason the
    // repeat line is 0.6 and not 0.5.
    return expectExactly('Caliciviridae_100', [
        'prop:vipr:Genus category',
        'prop:vipr:Year range',
        'prop:vipr:Host category [wide]'
    ]);
}

// Same family at a different sample size must give the SAME menu -- the
// instability of the old distinct<=50 cliff is what this pair guards against.
function testCaliciviridae500() {
    // Scientific Name and Species carry the same 82 values (the file
    // duplicates its taxonomy into a property) -- both honestly admitted.
    return expectExactly('Caliciviridae_500', [
        'prop:vipr:Genus category',
        'prop:vipr:Year range',
        'tax:scientific_name category [wide]',
        'prop:vipr:Species category [wide]',
        'prop:vipr:Host category [wide]'
    ]);
}

// No properties at all: the taxonomy codes (17 distinct over 31 tips) are
// the tree's one natural colouring. 17 also pins the category limit of 20 --
// at 16 or lower this tree would have no visualization whatsoever.
function testApaf() {
    return expectExactly('apaf', [
        'tax:code category'
    ]);
}

// Taxonomy-rich, property-free. common_name is on 107 of 108 nodes -- under
// the old present-everywhere rule that one node would have killed it.
function testBcl2() {
    return expectExactly('bcl2', [
        'tax:common_name category',
        'tax:scientific_name category',
        'tax:code category'
    ]);
}

// vipr:Mutation is multi-valued (a node can carry several mutations) and is
// therefore not offered at all. Region is 7 distinct AFTER whitespace
// normalization (the raw file wraps values across lines) -- so it just
// fits the 7-shape limit. Year is numeric with two values: a two-point
// ramp, plus shapes, which for two years is genuinely readable.
// The ranking puts the 14 well-spread PANGO lineages first and the two
// heavily skewed 2-value fields (Host, L0) near the bottom -- balance, not
// just presence, decides the order.
function testBranchEvents() {
    return expectExactly('branch_events', [
        'prop:vipr:PANGO_Lineage category',
        'prop:vipr:Region category+shape',
        'prop:vipr:PANGO_Lineage_L1 category',
        'prop:vipr:Country category',
        'prop:vipr:Year category+shape [switch]',
        'prop:vipr:Year_Month category',
        'prop:vipr:Host category+shape',
        'prop:vipr:PANGO_Lineage_L0 category+shape'
    ]);
}

// Seven of this tree's ten property fields are single-valued across all 42
// nodes (Country and Region among them: every strain is North American) --
// each would paint the whole tree one colour. The distinct >= 2 rule drops
// every one of them.
function testConfidences() {
    return expectExactly('confidences', [
        'prop:ird:FluSeason category+shape',
        'prop:ird:Year category+shape [switch]',
        'prop:ird:GlobalH1Clade category+shape'
    ]);
}

// 354 strains, five fields: subtype (5 values) is the only candidate.
// species is single-valued, genome_id is 354 unique "numbers", genome_name
// and strain are 346 distinct -- identifiers, all correctly refused.
function testFluH5() {
    return expectExactly('flu_h5', [
        'prop:BVBRC:subtype category+shape'
    ]);
}

// The showcase: 13 BV-BRC fields, five candidates. host_group and
// host_common_name are on 149/201 nodes (74%) -- the fields the 2/3
// coverage line exists to keep. product (201 x one value), four identifier
// fields (201 unique each), state_province (9% coverage) and strain/
// genome_name (near-unique) are all refused.
function testHerpesDnapol() {
    // geographic_group first: 90% coverage over six well-spread continents.
    // host_group is LAST of the categoricals -- 92% of its nodes say
    // "Nonhuman Mammal", and the balance term knows it.
    // collection_year has 48 distinct values: a range with no switch.
    return expectExactly('herpes_dnapol', [
        'prop:BVBRC:geographic_group category+shape',
        'prop:BVBRC:isolation_country category',
        'prop:BVBRC:host_common_name category',
        'prop:BVBRC:host_group category+shape',
        'prop:BVBRC:collection_year range',
        // 9% coverage: offered since 2026-09-11, ranked last as sparse rather
        // than refused outright
        'prop:BVBRC:state_province category'
    ]);
}

// Six tips. FluSeason is on 2 of 6 (below 2/3), so it is SPARSE -- offered,
// ranked last, and never the tree's opening colour. Year has 5 distinct values
// over 6 covered nodes: 5/6 = 0.83, inside the 0.9 identifier guard, so it
// stays a ramp -- on a tree this small, near-unique is not proof of an id.
function testInfluenza() {
    // HA and NA are subtype CODES that happen to be digits: two distinct
    // numbers get two colours, not a two-point gradient. Country still edges
    // Year for the auto-choice on the alphabetical tiebreak at equal score.
    return expectExactly('influenza', [
        'prop:ird:Country category+shape',
        'prop:ird:Year category+shape [switch]',
        'prop:ird:Host category+shape',
        'prop:ird:Subtype category+shape',
        'prop:ird:NA category+shape [switch]',
        'prop:ird:Region category+shape',
        'prop:ird:H5Clade category+shape',
        'prop:ird:HA category+shape [switch]',
        // 2 of 6 tips: sparse, so it sorts below everything above it
        'prop:ird:FluSeason category+shape'
    ]);
}

// The refusals that matter most, named explicitly so the intent survives
// even if the exact-list tests above are ever loosened.
function testRefusals() {
    var herpes = summarize(forester.visualizationCandidates(loadTree('herpes_dnapol'))).join('\n');
    var flu = summarize(forester.visualizationCandidates(loadTree('flu_h5'))).join('\n');
    var refused = [
        [herpes, 'prop:BVBRC:product'],          // one value on every node
        [herpes, 'prop:BVBRC:genome_id'],        // numeric identifier
        [herpes, 'prop:BVBRC:patric_id'],        // identifier
        [herpes, 'prop:BVBRC:accession'],        // identifier
        [flu, 'prop:BVBRC:species'],             // one value on every node
        [flu, 'prop:BVBRC:genome_name'],         // 346 distinct of 354
        [flu, 'prop:BVBRC:genome_id'],           // numeric identifier
        [herpes, 'prop:BVBRC:strain'],           // wide guard: 183/199 barely repeat
        [flu, 'prop:BVBRC:strain']               // wide guard: 346/354
    ];
    // state_province used to be in that list at 9% coverage. It is now OFFERED
    // and flagged sparse -- so it is asserted here rather than dropped, which
    // keeps the case under test instead of quietly losing it.
    var hp = forester.visualizationCandidates(loadTree('herpes_dnapol'));
    var sp = hp.filter(function (c) { return c.ref === 'BVBRC:state_province'; })[0];
    if (!sp || !sp.sparse) {
        console.log('    state_province should be offered AND sparse, got '
            + (sp ? 'sparse=' + sp.sparse : 'not offered'));
        return false;
    }
    if (hp[hp.length - 1].ref !== 'BVBRC:state_province') {
        console.log('    state_province should sort last');
        return false;
    }

    return refused.every(function (r) {
        if (r[0].indexOf(r[1]) >= 0) {
            console.log('    should have been refused: ' + r[1]);
            return false;
        }
        return true;
    });
}

// Stats on the descriptor must be trustworthy -- the legend will print them.
function testDescriptorStats() {
    var cands = forester.visualizationCandidates(loadTree('herpes_dnapol'));
    var byId = {};
    cands.forEach(function (c) { byId[c.id] = c; });
    var hg = byId['prop:BVBRC:host_group'];
    if (!hg || hg.coverage !== 149 || hg.total !== 201 || hg.values.length !== 4) return false;
    if (hg.numeric !== false || hg.kind !== 'property' || hg.ref !== 'BVBRC:host_group') return false;
    if (hg.label !== 'Host Group') return false;
    // counts must sum to the coverage, and the score must be a sane fraction
    var sum = 0;
    hg.values.forEach(function (v) { sum += hg.counts[v]; });
    if (sum !== hg.coverage) return false;
    if (!(hg.score > 0 && hg.score < 1)) return false;
    var cy = byId['prop:BVBRC:collection_year'];
    if (!cy || cy.numeric !== true || cy.coverage !== 164 || cy.values.length !== 48) return false;
    // numeric values are sorted numerically
    var nums = cy.values.map(Number);
    for (var i = 1; i < nums.length; ++i) {
        if (nums[i - 1] >= nums[i]) return false;
    }
    return true;
}

// --------------------------------------------------------------
// Rule boundaries, on synthetic trees
// --------------------------------------------------------------

// style: is the desktop's reserved rendering namespace, never data.
function testStyleNamespaceExcluded() {
    var phy = starTree(['#ff0000', '#00ff00', '#ff0000'], 'style:font_color');
    return forester.visualizationCandidates(phy).length === 0;
}

// A ref carried twice by one node is not a candidate, even with a value
// balance that would otherwise be ideal.
function testMultiValuedExcluded() {
    var phy = starTree([['a', 'b'], 'a', 'b'], 'x:F');
    return forester.visualizationCandidates(phy).length === 0;
}

// distinct = 1 paints the whole tree alike; distinct = 2 is the minimum.
function testDistinctLowerBound() {
    if (forester.visualizationCandidates(starTree(['a', 'a', 'a'])).length !== 0) return false;
    var c = only(starTree(['a', 'a', 'b']));
    return c !== null && c.colorMode === 'category' && c.shape === true;
}

// All-unique categorical values are identifiers.
function testAllUniqueExcluded() {
    return forester.visualizationCandidates(starTree(['a', 'b', 'c'])).length === 0;
}

// Coverage: 4 of 6 is exactly 2/3 and passes; 3 of 6 does not.
// 2/3 coverage is no longer a REFUSAL -- it is the line between an ordinary
// candidate and a sparse one, which is offered but sorts last and so never
// opens a tree that has anything better. Changed 2026-09-11 to match the
// desktop, which has ranked rather than refused since 0.11.133; the hard
// refusal had been dropping Country and Region from the flagship BV-BRC tree,
// both at 61%.
function testCoverageBoundary() {
    var atTwoThirds = starTree(['a', 'a', 'b', 'b', null, null]);
    var below = starTree(['a', 'a', 'b', null, null, null]);

    var at = only(atTwoThirds);
    if (at === null || at.sparse) {
        return false;   // 4/6 is exactly the bar: a candidate, and NOT sparse
    }
    var under = forester.visualizationCandidates(below);
    if (under.length !== 1) {
        return false;   // 3/6 is still offered ...
    }
    return under[0].sparse === true;   // ... but flagged sparse
}

// 20 categories colour, 21 do not. (22 tips, one duplicated value keeps
// distinct below the node count.)
function testCategoryLimit() {
    function catTree(distinct) {
        var vals = [];
        for (var i = 0; i < distinct; ++i) vals.push('v' + i);
        vals.push('v0');
        vals.push('v0');
        return starTree(vals);
    }
    var atLimit = only(catTree(20));
    return atLimit !== null && atLimit.colorMode === 'category'
        && forester.visualizationCandidates(catTree(21)).length === 0;
}

// 7 distinct values get shapes, 8 do not (d3 v7 has 7 distinct fill symbols).
function testShapeLimit() {
    function catTree(distinct) {
        var vals = [];
        for (var i = 0; i < distinct; ++i) vals.push('v' + i);
        vals.push('v0');
        return starTree(vals);
    }
    var seven = only(catTree(7));
    var eight = only(catTree(8));
    return seven !== null && seven.shape === true
        && eight !== null && eight.shape === false;
}

// Numeric values come back sorted numerically, not lexicographically --
// whatever mode they default to.
function testNumericValuesSortNumerically() {
    var c = only(starTree(['2', '10', '2', '10', '5', '5']));
    return c !== null && c.numeric === true && c.colorMode === 'category'
        && c.switchable === true && c.shape === true
        && c.values.join(',') === '2,5,10';
}

// The three numeric bands: up to 10 distinct numbers default to colours
// (switchable), 11-20 default to a range (switchable), above 20 a range
// with no switch. Each tree repeats one value so the identifier guard and
// the distinct<total rule stay out of the way.
function testNumericBands() {
    function numTree(distinct) {
        var vals = [];
        for (var i = 1; i <= distinct; ++i) vals.push(String(i));
        vals.push('1');
        vals.push('1');
        vals.push('1');   // ratio distinct/(distinct+3) stays under 0.9 for 21
        return starTree(vals);
    }
    var ten = only(numTree(10));
    if (!ten || ten.colorMode !== 'category' || ten.switchable !== true) return false;
    var eleven = only(numTree(11));
    if (!eleven || eleven.colorMode !== 'range' || eleven.switchable !== true) return false;
    var twenty = only(numTree(20));
    if (!twenty || twenty.colorMode !== 'range' || twenty.switchable !== true) return false;
    var twentyone = only(numTree(21));
    if (!twentyone || twentyone.colorMode !== 'range' || twentyone.switchable !== false) return false;
    // string categories are never switchable
    var cat = only(starTree(['a', 'a', 'b']));
    return cat !== null && cat.switchable === false;
}

// The wide band: 21+ distinct categorical values are admitted when they
// repeat (distinct/covered <= 0.6), refused when they barely do -- and a
// wide field always ranks behind clean categoricals and ranges.
function testWideBand() {
    function wideTree(distinct, covered) {
        var vals = [];
        for (var i = 0; i < covered; ++i) vals.push('v' + (i % distinct));
        return starTree(vals);
    }
    var atLimit = only(wideTree(21, 35));         // 21/35 = 0.6 exactly
    if (!atLimit || atLimit.wide !== true || atLimit.colorMode !== 'category') return false;
    if (atLimit.switchable !== false || atLimit.shape !== false) return false;
    if (forester.visualizationCandidates(wideTree(21, 34)).length !== 0) return false;   // 0.617: out
    // tier: a low-scoring clean categorical still outranks a high-scoring wide
    var phy = wideTree(25, 60);
    var i = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        n.properties.push({ref: 'x:Clean', value: (i++ < 55) ? 'a' : 'b', datatype: 'xsd:string', applies_to: 'node'});
    });
    var cands = forester.visualizationCandidates(phy);
    return cands.length === 2 && cands[0].ref === 'x:Clean' && cands[1].wide === true
        && cands[1].score > cands[0].score;
}

// The identifier guard: 9 distinct numbers on 10 nodes (ratio 0.9) is still
// a measurement; 10 on 10 is an id column.
function testNumericIdentifierGuard() {
    var nine = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '9'];
    var ten = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    return only(starTree(nine)) !== null
        && forester.visualizationCandidates(starTree(ten)).length === 0;
}

// applies_to other than 'node' is not node data.
function testAppliesToFiltered() {
    var phy = starTree(['a', 'a', 'b']);
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.properties) {
            n.properties.forEach(function (p) { p.applies_to = 'parent_branch'; });
        }
    });
    return forester.visualizationCandidates(phy).length === 0;
}

// Taxonomy and sequence sub-elements are candidates in their own right.
function testTaxonomyAndSequenceSlots() {
    var phy = starTree([null, null, null, null]);
    var i = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        n.taxonomies = [{code: (i < 2) ? 'HUMAN' : 'MOUSE'}];
        n.sequences = [{gene_name: (i % 2 === 0) ? 'APAF1' : 'BCL2'}];
        i++;
    });
    var got = summarize(forester.visualizationCandidates(phy));
    return got.length === 2
        && got[0] === 'seq:gene_name category+shape'
        && got[1] === 'tax:code category+shape';
}

// Two namespaces with the same suffix cannot share a menu label: both fall
// back to their full ref.
function testLabelCollision() {
    var phy = starTree(['a', 'a', 'b', 'b'], 'vipr:Host');
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.properties) {
            n.properties.push({ref: 'BVBRC:Host', value: n.properties[0].value === 'a' ? 'x' : 'y', datatype: 'xsd:string', applies_to: 'node'});
        }
    });
    var labels = forester.visualizationCandidates(phy).map(function (c) { return c.label; });
    return labels.length === 2
        && labels.indexOf('BVBRC:Host') >= 0
        && labels.indexOf('vipr:Host') >= 0;
}

// Categorical candidates outrank numeric ranges even when the range scores
// higher: on the 97-strain Caliciviridae tree Year's score beats Genus's,
// and Genus still comes first.
function testCategoricalTierFirst() {
    var cands = forester.visualizationCandidates(loadTree('Caliciviridae_100'));
    if (cands.length !== 3) return false;   // Genus, Year, and wide Host
    var genus = cands[0], year = cands[1];
    return genus.id === 'prop:vipr:Genus' && year.id === 'prop:vipr:Year'
        && year.score > genus.score;
}

// Balance, not just coverage: full coverage with a 90/10 split ranks below
// full coverage with an even split.
function testBalanceRanksEvenFirst() {
    var skewed = [];
    for (var i = 0; i < 9; ++i) skewed.push('a');
    skewed.push('b');
    var phyS = starTree(skewed, 'x:Skewed');
    var even = ['a', 'a', 'a', 'a', 'a', 'b', 'b', 'b', 'b', 'b'];
    // merge the two fields onto ONE tree
    var i2 = 0;
    forester.preOrderTraversalAll(phyS, function (n) {
        if (n.children || n._children) return;
        n.properties.push({ref: 'x:Even', value: even[i2++], datatype: 'xsd:string', applies_to: 'node'});
    });
    var cands = forester.visualizationCandidates(phyS);
    return cands.length === 2
        && cands[0].ref === 'x:Even'
        && cands[1].ref === 'x:Skewed'
        && cands[0].score > cands[1].score;
}

// --------------------------------------------------------------
// The readable-name inference (forester.nodeLabelProperty)
// --------------------------------------------------------------

// Exactly the two BV-BRC trees whose tips are PATRIC / genome identifiers
// get their genome_name property as the display label; every other demo
// tree keeps its own names.
function testLabelPropertyFixtures() {
    var expected = {
        Adenoviridae: null, Caliciviridae_100: null, Caliciviridae_500: null,
        apaf: null, bcl2: null, branch_events: null, confidences: null,
        flu_h5: 'BVBRC:genome_name', herpes_dnapol: 'BVBRC:genome_name',
        influenza: null
    };
    return Object.keys(expected).every(function (k) {
        var got = forester.nodeLabelProperty(loadTree(k));
        if (got !== expected[k]) {
            console.log('    ' + k + ': expected ' + expected[k] + ', got ' + got);
            return false;
        }
        return true;
    });
}

// Readable node names are never overridden, however good the name property.
function testLabelReadableNamesStand() {
    var phy = starTree(['x', 'x', 'y'], 'x:genome_name');
    var i = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        n.name = 'Homo sapiens strain ' + (i++);   // wordy names
        n.properties = [{ref: 'x:genome_name', value: 'Readable name ' + i, datatype: 'xsd:string', applies_to: 'node'}];
    });
    return forester.nodeLabelProperty(phy) === null;
}

// A name-suffixed field of terse codes (strain-like) does not qualify: the
// values must be mostly wordy.
function testLabelWordyGate() {
    var phy = starTree(['KOS1', 'C27', 'F123'], 'x:genome_name');
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        n.name = 'PATRIC.' + Math.abs(n.name ? n.name.length : 1) + '.123';
    });
    return forester.nodeLabelProperty(phy) === null;
}

// Only fields that say they are names qualify -- a wordy Host field must not
// become the tip label.
function testLabelSuffixGate() {
    var phy = starTree(['Sea Mammal one', 'Sea Mammal two', 'Lab strain three'], 'x:Host');
    var i = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        n.name = 'ID.' + (i++) + '.456';
    });
    return forester.nodeLabelProperty(phy) === null;
}

// Menu labels are prettified from the property refs: underscores to
// spaces, camelCase split, lowercase words capitalized -- and words that
// already carry capitals (PANGO, HA, H5N1) left exactly as written.
function testPrettyLabels() {
    function labels(tree) {
        var out = {};
        forester.visualizationCandidates(loadTree(tree)).forEach(function (c) { out[c.id] = c.label; });
        return out;
    }
    var h = labels('herpes_dnapol');
    if (h['prop:BVBRC:geographic_group'] !== 'Geographic Group') return false;
    if (h['prop:BVBRC:collection_year'] !== 'Collection Year') return false;
    var b = labels('branch_events');
    if (b['prop:vipr:PANGO_Lineage_L0'] !== 'PANGO Lineage L0') return false;
    if (b['prop:vipr:Year_Month'] !== 'Year Month') return false;
    var c = labels('confidences');
    if (c['prop:ird:FluSeason'] !== 'Flu Season') return false;
    if (c['prop:ird:GlobalH1Clade'] !== 'Global H1 Clade') return false;
    var i = labels('influenza');
    if (i['prop:ird:H5Clade'] !== 'H5 Clade') return false;
    if (i['prop:ird:HA'] !== 'HA') return false;
    return true;
}

// --------------------------------------------------------------
// Display normalization (spelling fold, qualifier cut, dictionary)
// --------------------------------------------------------------

// The motivating case: Caliciviridae-97's Host drops from 47 raw spellings
// to 35 display groups, with the domestic-animal dictionary collecting the
// scattered cows (cow / bovine / calf / cattle / Bos taurus (cattle)) into
// one row, and every node's folded value landing inside the group list.
function testNormalizationFixture() {
    var phy = loadTree('Caliciviridae_100');
    var host = null;
    forester.visualizationCandidates(phy).forEach(function (c) {
        if (c.id === 'prop:vipr:Host') host = c;
    });
    if (!host || host.values.length !== 35) return false;
    if (host.counts['Human'] !== 22) return false;
    if (host.counts['Cow'] !== 13) return false;
    if (host.counts['Pig'] !== 8) return false;
    if (host.counts['Chicken'] !== 4) return false;
    var alien = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        var v = forester.visualizationNodeValue(n, host);
        if (v !== null && host.values.indexOf(v) < 0) alien++;
    });
    return alien === 0;
}

// Dictionary folds are WHOLE-VALUE only (after trying a trailing
// parenthetical stripped): a ferret badger is not a ferret, and a
// 42-day-old pig keeps its own row.
function testDictionaryRules() {
    var phy = starTree(['bovine', 'calf', 'cattle', 'Bos taurus (cattle)', 'cow',
        'ferret badger', 'ferret badger', '42-day-old pig', '42-day-old pig',
        'human', 'Homo sapiens', 'ferret badger'], 'x:Host');
    var c = only(phy);
    if (!c) return false;
    if (c.counts['Cow'] !== 5) return false;
    if (c.counts['Human'] !== 2) return false;
    if (c.counts['Ferret badger'] !== 3) return false;      // capitalized, unfolded
    if (c.counts['42-day-old pig'] !== 2) return false;
    if ('Ferret' in c.counts || 'Pig' in c.counts) return false;
    return c.values.length === 4;
}

// The host qualifier cut (';'), with the dangling-parenthesis fix; and the
// cut applies ONLY to refs literally named host / country -- host_group
// keeps its semicolons.
function testQualifierCut() {
    var phy = starTree([
        'Homo sapiens; sex: M; age: 4 months', 'human',
        'Saimiri boliviensis (squirrel monkey; voucher: SBB04)',
        'Saimiri boliviensis (squirrel monkey; voucher: SBB09)'
    ], 'vipr:Host');
    var c = only(phy);
    if (!c || c.counts['Human'] !== 2) return false;
    if (c.counts['Saimiri boliviensis'] !== 2) return false;
    var phy2 = starTree(['USA:CA', 'USA:IL', 'Mexico'], 'vipr:Country');
    var c2 = only(phy2);
    if (!c2 || c2.counts['USA'] !== 2 || c2.counts['Mexico'] !== 1) return false;
    var phy3 = starTree(['A; B', 'A; B', 'C; D'], 'x:host_group');
    var c3 = only(phy3);
    return c3 !== null && c3.counts['A; B'] === 2 && c3.counts['C; D'] === 1;
}

// Non-dictionary groups display their most frequent spelling, capitalized;
// taxonomy / sequence elements stay verbatim -- 'human' as a taxonomy
// common name is curated text and is NOT folded.
function testRepresentativeAndSlots() {
    var phy = starTree(['north field', 'North Field', 'north field', 'south field'], 'x:Site');
    var c = only(phy);
    if (!c || c.values.length !== 2 || c.counts['North field'] !== 3) return false;
    if (c.counts['South field'] !== 1) return false;
    var phy2 = starTree([null, null, null]);
    var i = 0;
    forester.preOrderTraversalAll(phy2, function (n) {
        if (n.children || n._children) return;
        n.taxonomies = [{common_name: (i++ < 2) ? 'human' : 'mouse'}];
    });
    var c2 = only(phy2);
    return c2 !== null && c2.counts['human'] === 2 && c2.counts['mouse'] === 1
        && !('Human' in c2.counts);
}

// --------------------------------------------------------------
// The style: reader (forester.nodeVisualStyle)
// --------------------------------------------------------------

// Every Adenoviridae tip carries a style:font_color from ViPR; reading them
// back must find exactly the externals, each with a colour value.
function testNodeStyleFixture() {
    var phy = loadTree('Adenoviridae');
    var styled = 0, bad = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        var s = forester.nodeVisualStyle(n);
        if (s) {
            styled++;
            if (!s.fontColor || s.fontColor.charAt(0) !== '#') bad++;
        }
    });
    return styled === 321 && bad === 0;
}

// The five honoured refs parse (rectangle becomes our square, size clamps),
// everything else in and out of the namespace is ignored.
function testNodeStyleParsing() {
    var n = {properties: [
        {ref: 'style:font_color', value: '#ce1616', applies_to: 'node'},
        {ref: 'style:node_color', value: '#1660ce', applies_to: 'node'},
        {ref: 'style:node_shape', value: 'rectangle', applies_to: 'node'},
        {ref: 'style:font_size', value: '200', applies_to: 'node'},
        {ref: 'style:font_style', value: 'bold_italic', applies_to: 'node'},
        {ref: 'style:node_transparency', value: '0.5', applies_to: 'node'},
        {ref: 'vipr:Host', value: 'Human', applies_to: 'node'}
    ]};
    var s = forester.nodeVisualStyle(n);
    if (!s) return false;
    if (s.fontColor !== '#ce1616' || s.nodeColor !== '#1660ce') return false;
    if (s.shape !== 'square') return false;
    if (s.fontSize !== 48) return false;               // clamped
    if (s.fontStyle !== 'bold_italic') return false;
    if ('node_transparency' in s || 'nodeTransparency' in s) return false;
    // wrong applies_to, and no style at all, both answer null
    if (forester.nodeVisualStyle({properties: [{ref: 'style:font_color', value: '#fff', applies_to: 'parent_branch'}]}) !== null) return false;
    if (forester.nodeVisualStyle({properties: [{ref: 'x:y', value: 'z', applies_to: 'node'}]}) !== null) return false;
    return true;
}

// --------------------------------------------------------------
// The shared-prefix detector (forester.commonNamePrefix)
// --------------------------------------------------------------

// Every flu genome name starts "Influenza A virus" (four of them say
// "Virus" -- the comparison is case-insensitive); the herpes names share
// nothing. The prefix ends at a clean word boundary even though some names
// continue with "(" and others with " ".
function testPrefixFixtures() {
    var flu = loadTree('flu_h5');
    var herpes = loadTree('herpes_dnapol');
    // The trailing space arrived with the majority-prefix rule (64ac6f3): at a
    // strict LCP one tip diverges immediately after "virus" and holds the
    // prefix back, and at 0.95 that tip no longer gets a veto. Nothing changes
    // on screen -- the shortener strips leading separators after cutting the
    // prefix -- but the returned string is one character longer.
    return forester.commonNamePrefix(flu, 'BVBRC:genome_name') === 'Influenza A virus '
        && forester.commonNamePrefix(herpes, 'BVBRC:genome_name') === ''
        && forester.commonNamePrefix(loadTree('bcl2'), null) === '';
}

// A prefix that would split a word is cut back to the last separator -- and
// if what is left is too short to matter, there is no prefix at all.
function testPrefixWordBoundary() {
    function namedTree(names) {
        var phy = starTree(names.map(function () { return null; }));
        var i = 0;
        forester.preOrderTraversalAll(phy, function (n) {
            if (n.children || n._children) return;
            n.name = names[i++];
        });
        return phy;
    }
    // "ABC_ho" splits house/horse; trimming leaves "ABC_" (4 chars): too short
    if (forester.commonNamePrefix(namedTree(['ABC_house', 'ABC_horse', 'ABC_hound']), null) !== '') return false;
    // clean boundary at a space survives
    if (forester.commonNamePrefix(namedTree(['Sample no 12', 'Sample no 47', 'Sample no 99']), null) !== 'Sample no ') return false;
    // case-insensitive, reported in first-seen casing
    if (forester.commonNamePrefix(namedTree(['Virus alpha X1', 'virus alpha Y2', 'Virus alpha Z3']), null) !== 'Virus alpha ') return false;
    // a single name is no evidence of anything shared
    if (forester.commonNamePrefix(namedTree(['Only one tip here']), null) !== '') return false;
    return true;
}

// The value accessor must agree with the classifier: every value the
// classifier counted must be readable back off its node, and a node
// without one answers null.
function testNodeValueAgreesWithClassifier() {
    var phy = loadTree('herpes_dnapol');
    var cands = forester.visualizationCandidates(phy);
    var hg = null;
    cands.forEach(function (c) { if (c.id === 'prop:BVBRC:host_group') hg = c; });
    if (!hg) return false;
    var seen = 0, missing = 0, alien = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        var v = forester.visualizationNodeValue(n, hg);
        if (v === null) { missing++; return; }
        seen++;
        if (hg.values.indexOf(v) < 0) alien++;
    });
    return seen === hg.coverage && missing === hg.total - hg.coverage && alien === 0;
}

// ... and for the taxonomy / sequence slots too.
function testNodeValueElementSlots() {
    var phy = loadTree('bcl2');
    var cands = forester.visualizationCandidates(phy);
    var code = null;
    cands.forEach(function (c) { if (c.id === 'tax:code') code = c; });
    if (!code) return false;
    var ok = true, seen = 0;
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.children || n._children) return;
        var v = forester.visualizationNodeValue(n, code);
        if (v !== null) {
            seen++;
            if (code.values.indexOf(v) < 0) ok = false;
        }
    });
    return ok && seen === code.coverage;
}

// The classifier accepts the phylogeny wrapper (super-root) or the real
// root alike, and answers identically.
function testWrapperTolerated() {
    var phy = starTree(['a', 'a', 'b']);
    var real = forester.getTreeRoot(phy);
    var again = {name: 'wrapper of a wrapper', children: [phy]};
    var a = summarize(forester.visualizationCandidates(phy)).join(';');
    var b = summarize(forester.visualizationCandidates(real)).join(';');
    var c = summarize(forester.visualizationCandidates(again)).join(';');
    return a.length > 0 && a === b && b === c;
}

// --------------------------------------------------------------

console.log("\nvisualization candidate classifier\n");

runTest("Adenoviridae               : ", testAdenoviridae);
runTest("Caliciviridae 97           : ", testCaliciviridae100);
runTest("Caliciviridae 186          : ", testCaliciviridae500);
runTest("apaf                       : ", testApaf);
runTest("bcl2                       : ", testBcl2);
runTest("branch events              : ", testBranchEvents);
runTest("confidences                : ", testConfidences);
runTest("influenza H5Nx             : ", testFluH5);
runTest("herpes DNA polymerase      : ", testHerpesDnapol);
runTest("influenza (small)          : ", testInfluenza);
runTest("named refusals             : ", testRefusals);
runTest("descriptor stats           : ", testDescriptorStats);
runTest("style: excluded            : ", testStyleNamespaceExcluded);
runTest("multi-valued excluded      : ", testMultiValuedExcluded);
runTest("distinct lower bound       : ", testDistinctLowerBound);
runTest("all-unique excluded        : ", testAllUniqueExcluded);
runTest("coverage boundary 2/3      : ", testCoverageBoundary);
runTest("category limit 20          : ", testCategoryLimit);
runTest("shape limit 7              : ", testShapeLimit);
runTest("numeric bands              : ", testNumericBands);
runTest("wide band + tier           : ", testWideBand);
runTest("numeric values sort as nums: ", testNumericValuesSortNumerically);
runTest("numeric identifier guard   : ", testNumericIdentifierGuard);
runTest("applies_to filtered        : ", testAppliesToFiltered);
runTest("taxonomy / sequence slots  : ", testTaxonomyAndSequenceSlots);
runTest("label collision            : ", testLabelCollision);
runTest("categorical tier first     : ", testCategoricalTierFirst);
runTest("balance ranks even first   : ", testBalanceRanksEvenFirst);
runTest("label property, fixtures   : ", testLabelPropertyFixtures);
runTest("label: readable names stand: ", testLabelReadableNamesStand);
runTest("label: wordy gate          : ", testLabelWordyGate);
runTest("label: suffix gate         : ", testLabelSuffixGate);
runTest("pretty menu labels         : ", testPrettyLabels);
runTest("normalization, fixture     : ", testNormalizationFixture);
runTest("dictionary rules           : ", testDictionaryRules);
runTest("qualifier cut              : ", testQualifierCut);
runTest("representative + slots     : ", testRepresentativeAndSlots);
runTest("style: fixture             : ", testNodeStyleFixture);
runTest("style: parsing             : ", testNodeStyleParsing);
runTest("prefix, fixtures           : ", testPrefixFixtures);
runTest("prefix, word boundary      : ", testPrefixWordBoundary);
runTest("node value vs classifier   : ", testNodeValueAgreesWithClassifier);
runTest("node value, element slots  : ", testNodeValueElementSlots);
runTest("wrapper tolerated          : ", testWrapperTolerated);

// --------------------------------------------------------------
// forester.suggestLabelFields: which of the three label checkboxes
// (node name, taxonomy, sequence) start checked for a loaded tree.
// --------------------------------------------------------------

function suggestLeafTree(leaves) {
    return {
        name: 'r',
        children: leaves.map(function (l) {
            var n = {name: l.name || null};
            if (l.tax) {
                n.taxonomies = [{scientific_name: l.tax}];
            }
            if (l.seq) {
                n.sequences = [{name: l.seq}];
            }
            return n;
        })
    };
}

function runSuggest(root) {
    return forester.suggestLabelFields(root, {
        name: function (n) {
            return n.name || null;
        },
        taxonomy: function (n) {
            return (n.taxonomies && n.taxonomies[0]) ? n.taxonomies[0].scientific_name : null;
        },
        sequence: function (n) {
            return (n.sequences && n.sequences[0]) ? n.sequences[0].name : null;
        }
    });
}

function suggestSig(r) {
    return (r.showNodeName ? 'N' : '') + (r.showTaxonomy ? 'T' : '') + (r.showSequence ? 'S' : '');
}

// Runs the suggestion on a docs/data fixture with the same taxonomy /
// sequence subfield cascade the viewer applies (one good identifier each).
function suggestForFixture(basename) {
    var root = forester.getTreeRoot(loadTree(basename));
    var fields = {};
    forester.getAllExternalNodes(root).forEach(function (n) {
        if (n.taxonomies && n.taxonomies[0]) {
            var t = n.taxonomies[0];
            if (t.code) { fields.TC = true; }
            if (t.scientific_name) { fields.TS = true; }
            if (t.common_name) { fields.TN = true; }
        }
        if (n.sequences && n.sequences[0]) {
            var q = n.sequences[0];
            if (q.symbol) { fields.SS = true; }
            if (q.name) { fields.SN = true; }
            if (q.gene_name) { fields.GN = true; }
            if (q.accession && q.accession.value) { fields.SA = true; }
        }
    });
    var showTC = !!fields.TC, showTS = !!fields.TS, showTN = fields.TN && !fields.TS;
    var showSN = !!fields.SN, showGN = fields.GN && !fields.SN;
    var showSS = fields.SS && !fields.SN && !fields.GN;
    var showSA = fields.SA && !fields.SN && !fields.GN && !fields.SS;
    var joinFrag = function (a, b) {
        return (b && String(b).length > 0) ? (a ? a + ' | ' + b : String(b)) : a;
    };
    return forester.suggestLabelFields(root, {
        name: function (n) {
            return n.name || null;
        },
        taxonomy: function (n) {
            if (!n.taxonomies || !n.taxonomies[0]) { return null; }
            var t = n.taxonomies[0];
            var l = '';
            if (showTC) { l = joinFrag(l, t.code); }
            if (showTS) { l = joinFrag(l, t.scientific_name); }
            if (showTN) { l = joinFrag(l, t.common_name); }
            return l || null;
        },
        sequence: function (n) {
            if (!n.sequences || !n.sequences[0]) { return null; }
            var q = n.sequences[0];
            var l = '';
            if (showSS) { l = joinFrag(l, q.symbol); }
            if (showSN) { l = joinFrag(l, q.name); }
            if (showGN) { l = joinFrag(l, q.gene_name); }
            if (showSA && q.accession) { l = joinFrag(l, q.accession.value); }
            return l || null;
        }
    });
}

function testSuggestKeepsAllWhenShortAndDistinct() {
    var r = runSuggest(suggestLeafTree([
        {name: 'n1', tax: 'Alpha', seq: 'q1'},
        {name: 'n2', tax: 'Beta', seq: 'q2'},
        {name: 'n3', tax: 'Gamma', seq: 'q3'}
    ]));
    return suggestSig(r) === 'NTS';
}

function testSuggestContainmentDropsRedundant() {
    // the taxonomy's text sits inside every name (underscore vs space must
    // not matter), so it adds nothing
    var r = runSuggest(suggestLeafTree([
        {name: 'Feline_calicivirus|A1', tax: 'Feline calicivirus'},
        {name: 'Feline_calicivirus|B2', tax: 'Feline calicivirus'},
        {name: 'Feline_calicivirus|C3', tax: 'Feline calicivirus'}
    ]));
    return suggestSig(r) === 'N';
}

function testSuggestMutualContainmentKeepsName() {
    var r = runSuggest(suggestLeafTree([
        {name: 'Alpha x', tax: 'Alpha x'},
        {name: 'Beta y', tax: 'Beta y'}
    ]));
    return suggestSig(r) === 'N';
}

function testSuggestBudgetKeepsMostIdentifying() {
    // identical names, unique long sequences: over the budget the sequence's
    // distinct ratio wins
    var mk = function (i) {
        return {name: 'isolate', seq: 'unique sequence identifier number ' + i + ' padded to be quite long indeed'};
    };
    var r = runSuggest(suggestLeafTree([mk(1), mk(2), mk(3), mk(4)]));
    return suggestSig(r) === 'S';
}

function testSuggestBudgetTieFavorsName() {
    // both unique and the sequence only slightly shorter: the name's
    // priority holds within the tie window
    var mk = function (i) {
        return {
            name: 'name number ' + i + ' is this long avec padding xxxxxxx',
            seq: 'sequence identifier ' + i + ' also long padding xx'
        };
    };
    var r = runSuggest(suggestLeafTree([mk(1), mk(2), mk(3)]));
    return suggestSig(r) === 'N';
}

function testSuggestBudgetEconomyDisplaces() {
    // equally identifying but the sequence is under 60% of the name's
    // length: economy displaces priority
    var mk = function (i) {
        return {
            name: 'an unbearably long node name identifier variant number ' + i + ' with plenty of padding',
            seq: 'seq-' + i
        };
    };
    var r = runSuggest(suggestLeafTree([mk(1), mk(2), mk(3)]));
    return suggestSig(r) === 'S';
}

function testSuggestAbsentFieldStaysOff() {
    var r = runSuggest(suggestLeafTree([
        {name: 'n1', tax: 'Alpha'},
        {name: 'n2', tax: 'Beta'}
    ]));
    return suggestSig(r) === 'NT';
}

function testSuggestContainmentNeedsTwoPairs() {
    // only one leaf carries both fields: too little evidence to call the
    // taxonomy redundant
    var r = runSuggest(suggestLeafTree([
        {name: 'Alpha virus|x1', tax: 'Alpha virus'},
        {name: 'n2'},
        {name: 'n3'}
    ]));
    return suggestSig(r) === 'NT';
}

function testSuggestCalici500() {
    return suggestSig(suggestForFixture('Caliciviridae_500')) === 'N';
}

function testSuggestCalici100() {
    return suggestSig(suggestForFixture('Caliciviridae_100')) === 'N';
}

function testSuggestApaf() {
    return suggestSig(suggestForFixture('apaf')) === 'N';
}

function testSuggestBcl2() {
    return suggestSig(suggestForFixture('bcl2')) === 'NT';
}

function testSuggestInfluenza() {
    return suggestSig(suggestForFixture('influenza')) === 'NS';
}

console.log("\nlabel-field suggestion\n");

runTest("labels: all kept           : ", testSuggestKeepsAllWhenShortAndDistinct);
runTest("labels: containment drop   : ", testSuggestContainmentDropsRedundant);
runTest("labels: mutual keeps name  : ", testSuggestMutualContainmentKeepsName);
runTest("labels: budget identifying : ", testSuggestBudgetKeepsMostIdentifying);
runTest("labels: budget tie -> name : ", testSuggestBudgetTieFavorsName);
runTest("labels: economy displaces  : ", testSuggestBudgetEconomyDisplaces);
runTest("labels: absent stays off   : ", testSuggestAbsentFieldStaysOff);
runTest("labels: one pair no verdict: ", testSuggestContainmentNeedsTwoPairs);
runTest("labels: Caliciviridae 186  : ", testSuggestCalici500);
runTest("labels: Caliciviridae 97   : ", testSuggestCalici100);
runTest("labels: apaf               : ", testSuggestApaf);
runTest("labels: bcl2               : ", testSuggestBcl2);
runTest("labels: influenza          : ", testSuggestInfluenza);

// --------------------------------------------------------------
// forester.equalAngleLayout: the unrooted (equal-angle) layout
// --------------------------------------------------------------

function testEqualAngleWedges() {
    // (a,(b,c)): a (1 tip) gets 1/3 of the circle, (b,c) gets 2/3, split
    // evenly between b and c; every node sits at its wedge's mid-angle.
    var A = {name: 'a'}, B = {name: 'b'}, C = {name: 'c'};
    var inner = {name: 'i', children: [B, C]};
    var root = {name: 'r', children: [A, inner]};
    var s0 = -Math.PI / 2;
    var r = forester.equalAngleLayout(root, s0, function () {
        return 10;
    });
    var eps = 1e-9;
    var ok = Math.abs(A.uangle - (s0 + (Math.PI / 3))) < eps;
    ok = ok && Math.abs(inner.uangle - (s0 + (4 * Math.PI / 3))) < eps;
    ok = ok && Math.abs(B.uangle - (s0 + Math.PI)) < eps;
    ok = ok && Math.abs(C.uangle - (s0 + (5 * Math.PI / 3))) < eps;
    ok = ok && root.ux === 0 && root.uy === 0;
    ok = ok && Math.abs(Math.hypot(A.ux, A.uy) - 10) < eps;
    ok = ok && Math.abs(Math.hypot(B.ux - inner.ux, B.uy - inner.uy) - 10) < eps;
    var expectedMax = Math.max(Math.hypot(B.ux, B.uy), Math.hypot(C.ux, C.uy), 10);
    ok = ok && Math.abs(r.maxRad - expectedMax) < eps;
    return ok;
}

function testEqualAngleLengths() {
    // two tips split the circle in half; each sits at its own spoke length
    var A = {name: 'a'}, B = {name: 'b'};
    var root = {name: 'r', children: [A, B]};
    var L = {a: 5, b: 20};
    forester.equalAngleLayout(root, 0, function (n) {
        return L[n.name];
    });
    var eps = 1e-9;
    // a's wedge [0, pi), mid pi/2 -> (0, +5); b's [pi, 2pi), mid 3pi/2 -> (0, -20)
    return Math.abs(A.ux) < eps && Math.abs(A.uy - 5) < eps
        && Math.abs(B.ux) < eps && Math.abs(B.uy + 20) < eps;
}

function testEqualAngleFixture() {
    // a real tree, checked against an INDEPENDENT recomputation of the
    // equal-angle rule (an earlier version of this test asserted only that
    // positions matched the angles the code itself chose -- which any layout
    // satisfies): each child's expected mid-angle is low + sum(prev tip
    // shares) + half its own share of the parent's wedge.
    var root = forester.getTreeRoot(loadTree('apaf'));
    var r = forester.equalAngleLayout(root, -Math.PI / 2, function () {
        return 7;
    });
    var eps = 1e-9;
    var tipsOf = function (n) {
        if (!n.children || n.children.length < 1) { return 1; }
        var c = 0;
        for (var i = 0; i < n.children.length; ++i) { c += tipsOf(n.children[i]); }
        return c;
    };
    var ok = r.maxRad > 0;
    var check = function (n, low, high) {
        if (!n.children || !ok) { return; }
        var total = tipsOf(n);
        var current = low;
        for (var i = 0; i < n.children.length; ++i) {
            var d = n.children[i];
            var arc = (tipsOf(d) / total) * (high - low);
            var expectedMid = current + (arc / 2);
            if (Math.abs(d.uangle - expectedMid) > eps) { ok = false; }
            var dx = d.ux - n.ux, dy = d.uy - n.uy;
            if (Math.abs(Math.hypot(dx, dy) - 7) > eps) { ok = false; }
            check(d, current, current + arc);
            current += arc;
        }
        if (Math.abs(current - high) > 1e-9) { ok = false; } // wedges tile exactly
    };
    check(root, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI));
    return ok;
}

console.log("\nunrooted (equal-angle) layout\n");

runTest("unrooted: wedge shares     : ", testEqualAngleWedges);
runTest("unrooted: spoke lengths    : ", testEqualAngleLengths);
runTest("unrooted: fixture geometry : ", testEqualAngleFixture);

// --------------------------------------------------------------
// MSA helpers (the alignment track's pure pieces)
// --------------------------------------------------------------

function testMsaColorsAndGaps() {
    var ok = forester.msaResidueRgb('-', false) === null;      // gap chars have no fill
    ok = ok && forester.msaResidueRgb('.', false) === null;
    ok = ok && forester.msaResidueRgb('~', true) === null;
    ok = ok && forester.msaResidueRgb('L', false).join(',') === '240,170,170';  // aliphatic
    ok = ok && forester.msaResidueRgb('k', false).join(',') === '120,130,240';  // case-blind
    ok = ok && forester.msaResidueRgb('X', false).join(',') === '205,205,205';  // ambiguity
    ok = ok && forester.msaResidueRgb('G', true).join(',') === '230,185,80';    // base G
    ok = ok && forester.msaResidueRgb('U', true).join(',') === forester.msaResidueRgb('T', true).join(',');
    ok = ok && forester.msaLetterInk([120, 130, 240]) === '#ffffff';  // dark bg -> white ink
    ok = ok && forester.msaLetterInk([240, 190, 90]) === '#000000';   // light bg -> black ink
    return ok;
}

function testMsaNucleotideGuess() {
    return forester.msaIsNucleotide('ACGT-ACGTNNAC') === true
        && forester.msaIsNucleotide('MKTAYIAKQR-QISFVKSHFSRQ') === false
        && forester.msaIsNucleotide('----') === false;
}

function testMsaConservationIdentity() {
    // column 0: A,A,A -> 1.0; column 1: A,C,C -> 2/3, consensus C;
    // column 2: A,A,- -> 2/3 (gaps stay in the denominator), consensus A;
    // column 3 exists only in row 0 (short rows read as gaps): 1/3
    var r = forester.msaConservation(['AAAA', 'ACA', 'AC-'], 4, 'identity', true);
    var eps = 1e-9;
    return Math.abs(r.scores[0] - 1) < eps && r.consensus[0] === 'A'
        && Math.abs(r.scores[1] - (2 / 3)) < eps && r.consensus[1] === 'C'
        && Math.abs(r.scores[2] - (2 / 3)) < eps && r.consensus[2] === 'A'
        && Math.abs(r.scores[3] - (1 / 3)) < eps && r.consensus[3] === 'A';
}

function testMsaConservationInformation() {
    // a fully conserved, fully occupied nucleotide column carries maximum
    // information (1.0); an even two-way split over 4 bases carries half
    var r = forester.msaConservation(['AA', 'AC', 'AG', 'AT'], 2, 'information', true);
    var eps = 1e-9;
    return Math.abs(r.scores[0] - 1) < eps && Math.abs(r.scores[1] - 0) < eps;
}

function testMsaUngappedPosition() {
    return forester.msaUngappedPosition('MK-TA', 0) === 1
        && forester.msaUngappedPosition('MK-TA', 2) === null   // the gap itself
        && forester.msaUngappedPosition('MK-TA', 3) === 3      // gap skipped
        && forester.msaUngappedPosition('MK-TA', 9) === null;
}

function testMsaResidueInfo() {
    var w = forester.msaResidueInfo('W', false);
    var a = forester.msaResidueInfo('a', true);
    return w.name === 'Tryptophan' && w.clazz === 'aromatic' && w.hydropathy === -0.9
        && a.name === 'Adenine' && forester.msaResidueInfo('-', false) === null;
}

console.log("\nMSA helpers\n");

runTest("msa: colors and gaps       : ", testMsaColorsAndGaps);
runTest("msa: nucleotide guess      : ", testMsaNucleotideGuess);
runTest("msa: identity conservation : ", testMsaConservationIdentity);
runTest("msa: information content   : ", testMsaConservationInformation);
runTest("msa: ungapped position     : ", testMsaUngappedPosition);
runTest("msa: residue info          : ", testMsaResidueInfo);

// --------------------------------------------------------------
// Geologic time scale + time-tree detection
// --------------------------------------------------------------

function testGeoBandRanks() {
    function ranks(y, o) { return forester.geoBandRanks(y, o).join('/'); }
    var cases = [
        // [young, old, expected]  -- the coarse ladder, unchanged for wide windows
        [0, 66, 'period/epoch'],        // seven Cenozoic series: too many for stages
        [0, 538.8, 'period/epoch'],     // epochs cover to 538.8
        [0, 1000, 'era/period'],
        [0, 3000, 'eon/era'],
        // the finer rung: one or two Series band Series over STAGE
        [66, 100, 'epoch/age'],         // Late Cretaceous only -> its six stages
        [66, 143.1, 'epoch/age'],       // Late + Early Cretaceous: two series
        [66, 145, 'period/epoch'],      // ... plus a sliver of Late Jurassic: three
        [0, 2.58, 'epoch/age'],         // Holocene + Pleistocene
        [419.62, 422.7, 'epoch/age'],   // exactly the Pridoli window
        [540, 600, 'era/period'],       // older than any epoch: the ladder, not stages
        [66, 66, 'epoch/age']           // a point query still finds its one series
    ];
    for (var i = 0; i < cases.length; ++i) {
        var got = ranks(cases[i][0], cases[i][1]);
        if (got !== cases[i][2]) {
            console.log('    [' + cases[i][0] + ', ' + cases[i][1] + '] -> ' + got + ' expected ' + cases[i][2]);
            return false;
        }
    }
    // the stage row itself: gapless, Phanerozoic, Pridoli standing in
    var ages = forester.geoIntervals('age');
    if (ages.length !== 102) {
        console.log('    ' + ages.length + ' stage rows, expected 102 (101 stages + Pridoli)');
        return false;
    }
    for (i = 1; i < ages.length; ++i) {
        if (ages[i].young !== ages[i - 1].old) {
            console.log('    gap in the stage row after ' + ages[i - 1].name);
            return false;
        }
    }
    var stages = forester.geoOverlapping('age', 66, 100.5).map(function (a) { return a.name; });
    if (stages.join(',') !== 'Maastrichtian,Campanian,Santonian,Coniacian,Turonian,Cenomanian') {
        console.log('    Late Cretaceous stages: ' + stages.join(','));
        return false;
    }
    return true;
}

function testGeoQueries() {
    var cret = forester.geoAt('period', 100);
    var atBoundary = forester.geoAt('period', 66); // young <= age < old -> Cretaceous
    var over = forester.geoOverlapping('era', 0, 70).map(function (iv) {
        return iv.name;
    }).join('/');
    return cret && cret.name === 'Cretaceous' && cret.color === '#7FC64E'
        && atBoundary && atBoundary.name === 'Cretaceous'
        && over === 'Cenozoic/Mesozoic'
        && forester.geoCoverage('epoch') === 538.8
        && forester.geoAt('epoch', 150).name === 'Late Jurassic';
}

function testTimeAxisDetection() {
    var mk = function (unit, vals) {
        return {name: 'r', date: {unit: unit, value: vals[0]}, children: vals.slice(1).map(function (v, i) {
            return {name: 't' + i, date: {unit: unit, value: v}};
        })};
    };
    var geo = forester.timeAxisInfo(mk('mya', [250, 0, 66, 100]));
    var cal = forester.timeAxisInfo(mk('year', [2019.9, 2021, 2022, 2020]));
    var magGeo = forester.timeAxisInfo(mk(null, [250, 1, 66, 3]));       // magnitude fallback
    var magCal = forester.timeAxisInfo(mk(null, [2019, 2021, 2022]));
    var none = forester.timeAxisInfo({name: 'r', children: [{name: 'a'}, {name: 'b'}]});
    return geo.type === 'geologic' && geo.rootAge === 250 && geo.dated === true
        && cal.type === 'calendar' && cal.presentDate === 2022
        && magGeo.type === 'geologic' && magCal.type === 'calendar'
        && none.type === null && none.dated === false;
}

function testTimeAxisTicks() {
    var ma = forester.maAxisTickValues(250).join(',');
    var yrs = forester.calendarTickYears(2019.4, 2022.6).join(',');
    return ma === '0,50,100,150,200,250'
        && yrs === '2020,2021,2022'
        && forester.niceAxisStep(0.03) === 0.05
        && forester.niceAxisStep(31.25) === 50;
}

console.log("\ngeologic time scale\n");

runTest("time: band rank pairs      : ", testGeoBandRanks);
runTest("time: interval queries     : ", testGeoQueries);
runTest("time: axis-type detection  : ", testTimeAxisDetection);
runTest("time: tick mathematics     : ", testTimeAxisTicks);

// --------------------------------------------------------------
// audit regressions (2026-09-03 code audit)
// --------------------------------------------------------------

function testAuditInfinityDates() {
    // 1e400 parses to Infinity; it must be ignored, and the tick generators
    // must never loop on a non-finite bound (this once hung the browser)
    var root = {name: 'r', date: {unit: 'mya', value: Infinity}, children: [
        {name: 'a', date: {unit: 'mya', value: 250}},
        {name: 'b', date: {unit: 'mya', value: 0}}
    ]};
    var info = forester.timeAxisInfo(root);
    return info.rootAge === 250
        && forester.maAxisTickValues(Infinity).length === 0
        && forester.calendarTickYears(2020, Infinity).length === 0
        && forester.niceAxisStep(31.25) === 50;
}

function testAuditSparseFieldNeverWins() {
    // a field carried by 2 of 100 tips must not win the label budget and
    // leave 98 tips unlabelled: identifying power is judged over ALL tips
    var leaves = [];
    for (var i = 0; i < 100; ++i) {
        var l = {name: 'a rather long node name that repeats every other tip number ' + (i % 50)};
        if (i < 2) {
            l.sequences = [{name: 'utterly unique sequence identifier number ' + i}];
        }
        leaves.push(l);
    }
    var r = forester.suggestLabelFields({name: 'r', children: leaves}, {
        name: function (n) { return n.name || null; },
        taxonomy: function () { return null; },
        sequence: function (n) {
            return (n.sequences && n.sequences[0]) ? n.sequences[0].name : null;
        }
    });
    return r.showNodeName === true && r.showSequence === false;
}

function testAuditMsaGuards() {
    var ink = forester.msaLetterInk(null) === '#404040';
    var neg = forester.msaUngappedPosition('MK-TA', -1) === null;
    var frozen = true;
    var rgb = forester.msaResidueRgb('L', false);
    try { rgb[0] = 0; } catch { /* frozen throws in strict mode */ }
    frozen = forester.msaResidueRgb('V', false)[0] === 240;
    return ink && neg && frozen;
}

function testAuditResidueInfoParity() {
    var u = forester.msaResidueInfo('U', false);
    var d = forester.msaResidueInfo('D', false);
    var c = forester.msaResidueInfo('C', false);
    var x = forester.msaResidueInfo('X', false);
    var g = forester.msaResidueInfo('g', true);
    var t = forester.msaResidueInfo('T', true);
    return u.name === 'Selenocysteine' && d.name === 'Aspartic acid'
        && c.clazz === 'cysteine (disulphide-forming)'
        && x.name === 'Any amino acid' && x.clazz === 'non-standard / ambiguity code'
        && g.clazz === 'purine' && t.clazz === 'pyrimidine';
}

function testAuditConservationDetails() {
    // alphabetical consensus tie-break, and the information measure's
    // gap-occupancy factor (half-empty conserved column carries half the bits)
    var tie = forester.msaConservation(['AC', 'CA'], 2, 'identity', true);
    var inf = forester.msaConservation(['AA', 'A-', 'AA', 'A-'], 2, 'information', true);
    var eps = 1e-9;
    return tie.consensus[0] === 'A' && tie.consensus[1] === 'A'
        && Math.abs(inf.scores[0] - 1) < eps
        && Math.abs(inf.scores[1] - 0.5) < eps;
}

function testAuditGeoWindows() {
    // a reversed window normalizes; a zero-width window is a point query
    var rev = forester.geoOverlapping('era', 70, 0).map(function (iv) { return iv.name; }).join('/');
    var pt = forester.geoOverlapping('period', 100, 100).map(function (iv) { return iv.name; }).join('/');
    return rev === 'Cenozoic/Mesozoic' && pt === 'Cretaceous';
}


// A value that is ALL underscores (e.g. "_") must fold to EMPTY and be
// dropped -- not to a lone space, which would (a) survive the caller's
// empty-string check as its own spurious group and (b) keep a leading or
// trailing underscore ("_alpha_") from folding all the way down to the same
// display form as "alpha", so the two never merge. Cross-session bug report
// (found while the desktop side was doing Color-by parity work against this
// exact fold): the underscore->space replacement ran AFTER the leading
// trim, so a leading/trailing underscore survived as a bare space.
function testAuditUnderscoreFold() {
    var phy = starTree(['alpha', '_alpha_', 'beta', 'beta', '_'], 'x:F');
    var c = only(phy);
    return !!c && c.values.length === 2
        && c.values.indexOf('Alpha') > -1 && c.values.indexOf('Beta') > -1
        && c.counts['Alpha'] === 2 && c.counts['Beta'] === 2;
}


// The old caller-supplied nodeVisualizations dictionaries -- with their
// per-visualization regex matching -- are gone FOR GOOD: the tree itself is
// the only source of visualizations. This test pins every route a caller
// could try to hand one back in (the launch argument, the config key, the
// related removed keys), so the mechanism cannot be resurrected by accident
// without a test failing. launch() validates its arguments before touching
// d3 or the DOM, which is what makes these rejections testable here in Node
// (with stub globals standing in for the browser).
function testNodeVisualizationsStayRemoved() {
    global.d3 = global.d3 || {};
    global.forester = global.forester || forester;
    global.phyloXml = global.phyloXml || px;
    var aptx = require('../archaeopteryx').archaeopteryx;
    var tree = {children: [{}]};
    var oldStyleDict = {
        Country: {label: 'Country', regex: /vipr:Country=(.+)$/, shapes: ['square'], colors: 'category50'}
    };
    function thrown(fn) {
        try { fn(); return null; } catch (e) { return e.message || String(e); }
    }
    var m1 = thrown(function () { aptx.launch('#x', tree, {}, null, oldStyleDict); });
    if (!m1 || m1.indexOf('nodeVisualizations') < 0 || m1.indexOf('removed') < 0) {
        console.log('    launch-arg rejection missing: ' + m1);
        return false;
    }
    var m2 = thrown(function () { aptx.launch('#x', tree, {nodeVisualizations: oldStyleDict}); });
    if (!m2 || m2.indexOf('nodeVisualizations') < 0 || m2.indexOf('removed') < 0) {
        console.log('    config-key rejection missing: ' + m2);
        return false;
    }
    var m3 = thrown(function () { aptx.launch('#x', tree, {}, null, null, null, {x: 1}); });
    if (!m3 || m3.indexOf('specialVisualizations') < 0 || m3.indexOf('removed') < 0) {
        console.log('    specialVisualizations rejection missing: ' + m3);
        return false;
    }
    var m4 = thrown(function () { aptx.launch('#x', tree, {dynamicallyAddNodeVisualizations: true}); });
    if (!m4 || m4.indexOf('dynamicallyAddNodeVisualizations') < 0) {
        console.log('    dynamicallyAddNodeVisualizations rejection missing: ' + m4);
        return false;
    }
    return true;
}


// The 3.0 launch surface: exactly (container, tree, config) -- any old
// trailing argument is rejected by COUNT with a message mapping where each
// one went; a missing/unusable dependency and an unresolvable container
// throw by NAME; and the module require()s cleanly in Node with no browser,
// where the parsers work with no d3 at all.
function testLaunchApiValidation() {
    global.d3 = global.d3 || {};
    global.forester = global.forester || forester;
    global.phyloXml = global.phyloXml || px;
    var aptx = require('../archaeopteryx').archaeopteryx;
    var tree = {children: [{}]};
    function thrown(fn) {
        try { fn(); return null; } catch (e) { return e.message || String(e); }
    }
    var m = thrown(function () { aptx.launch('#x', tree, {}, null); });
    if (!m || m.indexOf('takes exactly') < 0) {
        console.log('    arity(launch): ' + m);
        return false;
    }
    m = thrown(function () { aptx.launchArchaeopteryx('#x', 'a.nh', '(a,b);', {}, null); });
    if (!m || m.indexOf('takes exactly') < 0) {
        console.log('    arity(launchArchaeopteryx): ' + m);
        return false;
    }
    // an unusable d3 is named, never exploded on
    delete global.d3.zoom;
    delete global.d3.cluster;
    m = thrown(function () { aptx.launch('#x', tree, {}); });
    if (!m || m.indexOf('version 7') < 0) {
        console.log('    d3 guard: ' + m);
        return false;
    }
    // with a usable d3, an unresolvable container throws by name
    global.d3.zoom = function () {};
    global.d3.cluster = function () {};
    m = thrown(function () { aptx.launch('#x', tree, {}); });
    if (!m || m.indexOf('container not found') < 0) {
        console.log('    container: ' + m);
        return false;
    }
    // the new config keys route through readConfig (reaching the container
    // check means the keys were accepted)
    m = thrown(function () {
        aptx.launch('#x', tree, {nodeLabels: {}, nhConfidenceValuesInBrackets: false});
    });
    if (!m || m.indexOf('container not found') < 0) {
        console.log('    new config keys: ' + m);
        return false;
    }
    // no browser, no d3: the parsers still work
    var phy = aptx.parseNexus('#NEXUS\nBegin Trees;\n Tree t=(a:1,b:2);\nEnd;\n');
    return !!phy && forester.getAllExternalNodes(phy).length === 2;
}


// parseTree picks the parser from the filename's extension OR the content.
// The content alone must be enough for every format, because pasted trees
// have no filename: #NEXUS -> Nexus, { -> Auspice JSON, < -> phyloXML (this
// last one used to be extension-only, so pasted phyloXML fell through to the
// Newick parser), anything else -> New Hampshire.

// The phylogram-vs-cladogram default. Reported 2026-09-09: a BV-BRC influenza
// phyloXML with every internal branch measured opened as a CLADOGRAM, because
// the old rule counted every branch uniformly and the exporter had omitted
// branch_length on the tips where it would have been zero (0.40 of all
// branches, under the 0.5 threshold). Two things are asserted here: the
// counters exclude the ROOT (a branch length belongs to the branch above a
// node, and the root has none), and "measured" includes an explicit ZERO,
// which is a real measurement rather than a missing one.

// Bare numeric internal labels read as confidence values. The rule is SHARED
// with the desktop Java Archaeopteryx (agreed 2026-09-08) -- if one of these
// expectations changes, it changes on both sides or not at all.
// A taxon identifier is never a visualization, whatever its distribution.
// It repeats like a category and passes every statistical rule, but a colour
// can carry nothing the species name beside it does not, and "11320" in a
// legend tells the reader nothing. Learned on the 13,246-tip H5N1 tree.
// The node-data dialog names a property the way the Color-by menu does.
// nhConfidenceValuesInBrackets is retired: accepted, warned about, ignored.
// Bracketed values are always read as confidences, in every call shape.
function testBracketsFlagRetired() {
    global.d3 = global.d3 || {};
    global.forester = global.forester || forester;
    global.phyloXml = global.phyloXml || px;
    var aptx = require('../archaeopteryx').archaeopteryx;
    var nh = '((A:1,B:1)[95]:0.5,(C:1,D:1)[80]:0.5);';

    function confs(phy) {
        var root = forester.getTreeRoot(phy);
        return forester.getAllNodes(phy).filter(function (n) {
            return (n.children || n._children) && n !== root && n.confidences && n.confidences.length;
        }).map(function (n) { return n.confidences[0].value; }).sort(function (a, b) { return a - b; }).join(',');
    }
    // the new three-argument shape, and the retired four-argument one
    var cases = [
        aptx.parseTree('t.nwk', nh),
        aptx.parseTree('t.nwk', nh, 'auto'),
        aptx.parseTree('t.nwk', nh, true, 'auto'),    // retired flag in place
        aptx.parseTree('t.nwk', nh, false, 'auto'),   // ... even set false
        aptx.parseNewHampshire(nh),
        aptx.parseNewHampshire(nh, 'auto'),
        aptx.parseNewHampshire(nh, false, 'auto')
    ];
    for (var i = 0; i < cases.length; ++i) {
        if (confs(cases[i]) !== '80,95') {
            console.log('    call shape ' + i + ' gave confidences "' + confs(cases[i]) + '", expected "80,95"');
            return false;
        }
    }
    // the mode still arrives in both shapes
    var never = aptx.parseTree('t.nwk', '((A,B)100,(C,D)56);', 'label');
    var neverLegacy = aptx.parseTree('t.nwk', '((A,B)100,(C,D)56);', true, 'label');
    if (confs(never) !== '' || confs(neverLegacy) !== '') {
        console.log('    "never" not honoured in one of the call shapes');
        return false;
    }
    // as a config key it is accepted, warned about, and does not throw
    var warned = [];
    var realWarn = console.warn;
    console.warn = function (m) { warned.push(String(m)); };
    try {
        aptx.parseTree('t.nwk', nh);   // parse is unaffected either way
        var cfg = {nhConfidenceValuesInBrackets: false};
        var threw = false;
        try {
            aptx.launch('#no-such-container', forester.parseNewHampshire(nh, true, false), cfg);
        } catch (e) {
            // the container is what fails, not the retired key
            threw = /container/.test(e.message);
        }
        if (!threw) {
            console.log('    expected the container error, not a config error');
            return false;
        }
    } finally {
        console.warn = realWarn;
    }
    if (!warned.some(function (m) { return /nhConfidenceValuesInBrackets/.test(m) && /retired/.test(m); })) {
        console.log('    no retirement warning: ' + JSON.stringify(warned));
        return false;
    }
    return true;
}

function testPropertyDisplayName() {
    var cases = [
        ['BVBRC:host_group', 'Host Group'],
        ['vipr:NCBI_Taxon_Id', 'NCBI Taxon Id'],
        ['x:FluSeason', 'Flu Season'],
        ['PANGO_Lineage_L0', 'PANGO Lineage L0'],
        ['plain', 'Plain']
    ];
    for (var i = 0; i < cases.length; ++i) {
        var got = forester.propertyDisplayName(cases[i][0]);
        if (got !== cases[i][1]) {
            console.log('    ' + cases[i][0] + ' -> ' + JSON.stringify(got) + ' expected ' + JSON.stringify(cases[i][1]));
            return false;
        }
    }
    return true;
}

function testTaxonIdNeverOffered() {
    var phy = forester.parseNewHampshire('((a,b,c,d),(e,f,g,h));', true, false);
    var tips = forester.getAllExternalNodes(phy);
    tips.forEach(function (n, i) {
        var first = i < 4;
        n.properties = [
            {ref: 'vipr:NCBI_Taxon_Id', datatype: 'xsd:string', applies_to: 'node', value: first ? '11320' : '11520'},
            {ref: 'bvbrc:taxon_id',     datatype: 'xsd:string', applies_to: 'node', value: first ? '1' : '2'},
            {ref: 'x:taxonomy_id',      datatype: 'xsd:string', applies_to: 'node', value: first ? '1' : '2'},
            {ref: 'x:TaxId',            datatype: 'xsd:string', applies_to: 'node', value: first ? '1' : '2'},
            // controls: same distribution, must still be offered
            {ref: 'vipr:Species',       datatype: 'xsd:string', applies_to: 'node', value: first ? 'Influenza A' : 'Influenza B'},
            {ref: 'x:Host',             datatype: 'xsd:string', applies_to: 'node', value: (i % 2) ? 'Human' : 'Avian'}
        ];
    });
    var refs = forester.visualizationCandidates(phy).map(function (c) { return c.ref || c.id; });
    var leaked = refs.filter(function (r) { return /tax/i.test(r); });
    if (leaked.length) {
        console.log('    taxon id offered as a visualization: ' + leaked.join(', '));
        return false;
    }
    if (refs.indexOf('vipr:Species') < 0 || refs.indexOf('x:Host') < 0) {
        console.log('    controls lost: ' + refs.join(', '));
        return false;
    }
    return true;
}

// Record-keeping properties are never offered as a visualization: who
// deposited the record, which collection it belongs to, what may be done with
// it, and what a database calls it. They repeat like categories and so pass
// every statistical test, but a colour spent on one says nothing about the
// tree. The controls matter as much as the exclusions here -- the rule is
// separator-aware precisely so that "Authority" and "Dataset" survive it.
function testRecordKeepingNeverOffered() {
    var excluded = [
        'x:Author', 'x:Authors', 'x:Author(s)', 'x:Abbr Authors', 'x:abbr_authors',
        'x:Submitting-Author', 'x:AUTHOR',
        'x:Set', 'x:Region Set', 'x:region_set', 'x:Region-Set',
        'x:Data use', 'x:Data-Use Terms', 'x:data_use_terms', 'x:DATA USE',
        'x:Accession', 'x:Genbank Accession', 'x:genbank_accession', 'x:Accessions',
        'x:Identifier', 'x:Strain Identifier', 'x:strain-identifier', 'x:Identifiers',
        // camelCase reaches the user already split -- the ref dataUseTerms is
        // shown as "Data Use Terms" -- so the rule has to see it split too.
        // Matching the raw ref instead is exactly how "Data Use Terms" got
        // offered after the first version of this rule shipped.
        'x:dataUseTerms', 'x:DataUseTerms', 'x:DataUse',
        'x:AbbrAuthors', 'x:abbrAuthors', 'x:submittingAuthor',
        'x:RegionSet', 'x:regionSet',
        'x:GBAccession', 'x:gbAccession', 'x:strainIdentifier'
    ];
    var kept = [
        'x:Authority',      // contains "author", not as a word
        'x:Dataset',        // contains "set", not as a word
        'x:Subset',
        'x:Settings',
        'x:Data usage',     // not the phrase "data use"
        'x:Metadata',
        'x:Host', 'x:Country', 'x:Species'
    ];

    // Two values, evenly split: a distribution that is a perfectly good
    // candidate, so anything dropped is dropped by NAME and nothing else.
    function candidatesFor(refs) {
        var phy = forester.parseNewHampshire('((a,b,c,d),(e,f,g,h));', true, false);
        forester.getAllExternalNodes(phy).forEach(function (n, i) {
            n.properties = refs.map(function (r) {
                return {ref: r, datatype: 'xsd:string', applies_to: 'node',
                        value: (i < 4) ? 'Alpha' : 'Beta'};
            });
        });
        return forester.visualizationCandidates(phy).map(function (c) {
            return c.ref || c.id;
        });
    }

    var leaked = candidatesFor(excluded);
    if (leaked.length) {
        console.log('    offered but should not be: ' + leaked.join(', '));
        return false;
    }
    var offered = candidatesFor(kept);
    var lost = kept.filter(function (r) { return offered.indexOf(r) < 0; });
    if (lost.length) {
        console.log('    wrongly excluded: ' + lost.join(', '));
        return false;
    }

    // The rule reads the name the MENU shows, so these must agree. If
    // prettifyVisLabel ever stops splitting camelCase, the exclusions above
    // go quiet rather than wrong, and this line is what says so.
    if (forester.propertyDisplayName('x:dataUseTerms') !== 'Data Use Terms'
        || forester.propertyDisplayName('x:AbbrAuthors') !== 'Abbr Authors') {
        console.log('    display name no longer splits camelCase: '
            + forester.propertyDisplayName('x:dataUseTerms'));
        return false;
    }
    return true;
}

// "In-Group" is offered but never leads. The viewer applies candidates[0] on
// load (archaeopteryx.js: _vis.autoColorId = _vis.candidates[0].id, guarded
// only against a WIDE field), so "never first" and "never auto-applied" are
// the same statement about ordering -- which is why this tests the order.
function testInGroupOfferedButNotFirst() {
    function candidatesFor(refs) {
        var phy = forester.parseNewHampshire('((a,b,c,d),(e,f,g,h));', true, false);
        forester.getAllExternalNodes(phy).forEach(function (n, i) {
            n.properties = refs.map(function (r) {
                return {ref: r, datatype: 'xsd:string', applies_to: 'node',
                        value: (i < 4) ? 'Alpha' : 'Beta'};
            });
        });
        return forester.visualizationCandidates(phy);
    }

    var spellings = ['x:In-Group', 'x:InGroup', 'x:In Group', 'x:in_group',
                     'x:ingroup', 'x:Ingroup', 'x:IN-GROUP',
                     'x:Out-Group', 'x:OutGroup', 'x:Out Group', 'x:out_group',
                     'x:outgroup', 'x:Outgroup', 'x:OUT-GROUP',
                     'x:In-Groups', 'x:Outgroups'];

    for (var i = 0; i < spellings.length; ++i) {
        var ig = spellings[i];
        // Alongside an ordinary field of the SAME distribution: still offered,
        // but must not lead. The companion is "Zone" on purpose -- scores tie,
        // so the comparator falls through to the label, and "in group" sorts
        // BEFORE "zone". Only the tier can put Zone first, so this fails if the
        // tier is removed. (A first version paired it with "Host", which wins
        // the alphabetical tie-break on its own and passed with the tier gone.)
        var cands = candidatesFor([ig, 'x:Zone']);
        var refs = cands.map(function (c) { return c.ref; });
        if (refs.indexOf(ig) < 0) {
            console.log('    ' + ig + ' not offered at all');
            return false;
        }
        if (cands[0].ref !== 'x:Zone') {
            console.log('    ' + ig + ' led the list: ' + refs.join(', '));
            return false;
        }

        // alone, it is all there is -- so it leads, and must be applicable
        // (the viewer declines only a wide field)
        var only = candidatesFor([ig]);
        if (only.length !== 1 || only[0].ref !== ig) {
            console.log('    ' + ig + ' alone did not produce itself: ' + only.length);
            return false;
        }
        if (only[0].wide) {
            console.log('    ' + ig + ' alone reads as wide, so it would not be applied');
            return false;
        }
    }

    // controls: neither word alone is enough
    var ctl = candidatesFor(['x:Group', 'x:Host']);
    if (ctl[0].ref !== 'x:Group') {
        console.log('    plain "Group" was deprioritized: ' + ctl.map(function (c) { return c.ref; }).join(', '));
        return false;
    }
    // and neither half is enough on its own, nor a word that merely starts
    // with one of them
    // "Within Group" is the one that matters: it CONTAINS the substring
    // "in group", so it passes an unanchored rule and fails a word-anchored
    // one. Without it, dropping the anchors left this test green.
    var singles = ['x:In', 'x:Out', 'x:Outcome', 'x:Grouping', 'x:Output',
                   'x:Ingredient', 'x:Within Group', 'x:Within-Group'];
    for (var j = 0; j < singles.length; ++j) {
        var lead = candidatesFor([singles[j], 'x:Zone'])[0].ref;
        if (lead !== singles[j]) {
            console.log('    ' + singles[j] + ' was wrongly demoted');
            return false;
        }
    }
    return true;
}

function testInternalLabelsAsConfidence() {
    function promoted(nh, mode) {
        var phy = forester.parseNewHampshire(nh, true, false);
        var n = forester.promoteInternalLabelsToConfidence(phy, mode);
        return {n: n, phy: phy};
    }
    var cases = [
        // nh, mode, promoted
        ['((A,B)100,(C,D)56);',        'auto',   2],  // ordinary bootstrap
        ['((A,B)0.98,(C,D)0.72);',     'auto',   2],  // posteriors
        ['((A,B)1000,(C,D)870);',      'auto',   2],  // 0-1000 scale (MrBayes)
        ['((A,B)Clade_I,(C,D)100);',   'auto',   0],  // MIXED: all-or-nothing refuses
        ['((A,B)Clade_I,(C,D)100);',   'confidence', 1],  // ... but Always is per-node
        ['((A,B)Mammalia,(C,D)Aves);', 'auto',   0],  // real clade names
        ['((A,B)Mammalia,(C,D)Aves);', 'confidence', 0],  // Always is numeric-only: still safe
        ['((A,B)9606,(C,D)10090);',    'auto',   0],  // taxids: outside [0,1000]
        ['((A,B)9606,(C,D)10090);',    'confidence', 2],  // ... Always is unbounded, by design
        ['((A,B)1,((C,D)2,(E,F)3));',  'auto',   0],  // clade NUMBERING 1..N, not support
        ['((A,B)100,C);',              'auto',   0],  // a lone label is not enough
        ['((A,B)[100],(C,D)95);',      'auto',   1],  // ... unless corroborated by a real confidence
        ['((A,B)100,(C,D)56);',        'label',  0]
    ];
    for (var i = 0; i < cases.length; ++i) {
        var c = cases[i];
        var r = promoted(c[0], c[1]);
        if (r.n !== c[2]) {
            console.log('    ' + c[0] + ' [' + c[1] + '] promoted ' + r.n + ' expected ' + c[2]);
            return false;
        }
    }
    // The ROOT is never promoted: a confidence belongs to the branch above a
    // node and the root has none, so ")99;" is the tree's name, not support.
    var rooted = promoted('((A,B)100,(C,D)56)99;', 'auto');
    var root = forester.getTreeRoot(rooted.phy);
    if (rooted.n !== 2 || root.name !== '99' || (root.confidences && root.confidences.length)) {
        console.log('    root promoted: n=' + rooted.n + ' name=' + root.name);
        return false;
    }
    // Promotion MOVES -- the label is cleared, or the value draws twice.
    var inner = forester.getAllNodes(rooted.phy).filter(function (n) {
        return (n.children || n._children) && n !== root;
    });
    for (var j = 0; j < inner.length; ++j) {
        if (inner[j].name !== '' || !inner[j].confidences || inner[j].confidences.length !== 1) {
            console.log('    promotion did not move the label: ' + JSON.stringify(inner[j].name));
            return false;
        }
        if (inner[j].confidences[0].type !== '') {
            // unset on purpose: the value cannot tell bootstrap from posterior
            // from aLRT, and a wrong type in a published figure is worse.
            console.log('    confidence type should be unset, got ' + inner[j].confidences[0].type);
            return false;
        }
    }
    return true;
}

// The promotion has to sit where EVERY entry point passes through it --
// parseTree dispatches by calling parseNewHampshire / parseNexus by name, and
// docs/open.html calls parseTree directly rather than launchArchaeopteryx.
function testInternalLabelsWiring() {
    global.d3 = global.d3 || {};
    global.forester = global.forester || forester;
    global.phyloXml = global.phyloXml || px;
    var aptx = require('../archaeopteryx').archaeopteryx;

    function internalNames(phy) {
        var root = forester.getTreeRoot(phy);
        return forester.getAllNodes(phy).filter(function (n) {
            return (n.children || n._children) && n !== root;
        }).map(function (n) { return n.name; }).sort().join(',');
    }
    // Newick, through the wrapper: promoted by default.
    var phy = aptx.parseNewHampshire('((A,B)100,(C,D)56);');
    if (internalNames(phy) !== ',' || phy.confidencesFromInternalLabels !== 2) {
        console.log('    newick wrapper: names="' + internalNames(phy)
            + '" marker=' + phy.confidencesFromInternalLabels);
        return false;
    }
    // Nexus: its tree statement IS Newick, so it has always had the same bug.
    phy = aptx.parseTree('', '#NEXUS\nBegin Trees;\n Tree t=((A,B)100,(C,D)56);\nEnd;\n');
    if (phy.confidencesFromInternalLabels !== 2) {
        console.log('    nexus not promoted: ' + phy.confidencesFromInternalLabels);
        return false;
    }
    // 'label' turns it off through the same door.
    phy = aptx.parseTree('t.nwk', '((A,B)100,(C,D)56);', true, 'label');
    if (internalNames(phy) !== '100,56' || phy.confidencesFromInternalLabels !== undefined) {
        console.log('    never still promoted: ' + internalNames(phy));
        return false;
    }
    // The retired positional boolean maps to 'confidence', NOT to 'auto' -- a
    // caller who had true and silently landed on auto would lose promotions
    // on a mixed tree.
    phy = aptx.parseTree('t.nwk', '((A,B)Clade_I,(C,D)100);', true, true);
    if (phy.confidencesFromInternalLabels !== 1) {
        console.log('    legacy true did not map to always: ' + phy.confidencesFromInternalLabels);
        return false;
    }
    // phyloXML carries real confidences: promoting there would corrupt, not fix.
    phy = aptx.parseTree('', '<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true">'
        + '<clade><clade><name>7</name><clade><name>a</name></clade>'
        + '<clade><name>b</name></clade></clade></clade></phylogeny></phyloxml>');
    if (phy.confidencesFromInternalLabels !== undefined) {
        console.log('    phyloXML should not be promoted');
        return false;
    }
    // The two mutually-exclusive parse flags no longer throw (forester-Java
    // never had that guard, so it was never part of the shared contract).
    forester.parseNewHampshire('((A,B)100,(C,D)56);', true, true);
    return true;
}

function testPhylogramBranchCounts() {
    // Mirrors the decision in archaeopteryx.js (search PHYLOGRAM_MIN_BRANCH_FRACTION).
    // If that expression changes, change this with it -- deliberately.
    function decide(b) {
        var scaleBearing = b.internalBranchCount > 0;
        var measured = scaleBearing ? b.internalBranchesWithLength : b.branchesWithLength;
        var denom = scaleBearing ? b.internalBranchCount : b.branchCount;
        return b.branchLengths === true && denom > 0 && (measured / denom) > 0.5;
    }
    function props(nh) {
        return forester.collectBasicTreeProperties(forester.parseNewHampshire(nh, true, false));
    }
    var cases = [
        // nh, branchCount, withLength, internalCount, internalWithLength, phylogram
        ['((A:1,B:1)x:1,(C:1,D:1)y:1);', 6, 6, 2, 2, true],   // fully measured
        ['((A,B)x:1,(C,D)y:1);',         6, 2, 2, 2, true],   // THE REPORTED SHAPE: bare tips, measured internals
        ['((A:1,B:1)x,(C:1,D:1)y);',     6, 4, 2, 0, false],  // measured tips, bare internals -> no scale
        ['((A:1,B:1)x:0,(C:1,D:1)y:0);', 6, 6, 2, 2, true],   // explicit ZERO internals are measured
        ['((A,B)x,(C,D)y);',             6, 0, 2, 0, false],  // true cladogram
        ['(A:1,B:1,C:1);',               3, 3, 0, 0, true],   // star tree: no internals, judge the tips
        ['((A:1,B:1)x:1,(C:1,D:1)y:1):5;', 6, 6, 2, 2, true]  // a length ON THE ROOT is not counted
    ];
    for (var i = 0; i < cases.length; ++i) {
        var c = cases[i];
        var b = props(c[0]);
        var got = [b.branchCount, b.branchesWithLength, b.internalBranchCount, b.internalBranchesWithLength];
        var want = [c[1], c[2], c[3], c[4]];
        if (got.join(',') !== want.join(',')) {
            console.log('    ' + c[0] + ' counts ' + got.join(',') + ' expected ' + want.join(','));
            return false;
        }
        if (decide(b) !== c[5]) {
            console.log('    ' + c[0] + ' phylogram=' + decide(b) + ' expected ' + c[5]);
            return false;
        }
    }
    // An explicit zero is a MEASUREMENT, which is the distinction the old
    // numerator missed: it counted only positive lengths, so a tree writing its
    // polytomies as zero-length internal branches opened as a cladogram. The
    // table above covers the shape; this pins the decision itself, since that
    // is the behaviour anyone changing the counting would break.
    var z = props('((A:1,B:1)x:0,(C:1,D:1)y:0);');
    if (z.internalBranchesWithLength !== 2 || z.branchesWithLength !== 6) {
        console.log('    zero-length internals: internal measured=' + z.internalBranchesWithLength
            + ' all measured=' + z.branchesWithLength + ' (expected 2 / 6)');
        return false;
    }
    if (decide(z) !== true) {
        console.log('    a tree of zero-length internal branches is still a phylogram');
        return false;
    }
    return true;
}

function testParseTreeContentSniffing() {
    global.d3 = global.d3 || {};
    global.forester = global.forester || forester;
    global.phyloXml = global.phyloXml || px;
    var aptx = require('../archaeopteryx').archaeopteryx;
    var xml = '\n  <phyloxml xmlns="http://www.phyloxml.org">'
        + '<phylogeny rooted="true"><clade>'
        + '<clade><name>a</name></clade><clade><name>b</name></clade>'
        + '</clade></phylogeny></phyloxml>';
    var phy = aptx.parseTree('', xml);
    var ext = forester.getAllExternalNodes(phy);
    if (ext.length !== 2) {
        console.log('    pasted phyloXML: ' + ext.length + ' external nodes');
        return false;
    }
    var names = ext.map(function (n) { return n.name; }).sort().join(',');
    if (names !== 'a,b') {
        console.log('    pasted phyloXML names: ' + names);
        return false;
    }
    phy = aptx.parseTree('', '#NEXUS\nBegin Trees;\n Tree t=(a:1,b:2);\nEnd;\n');
    if (forester.getAllExternalNodes(phy).length !== 2) {
        console.log('    pasted Nexus misrouted');
        return false;
    }
    // routing proof for JSON: an invalid doc must fail in the AUSPICE parser
    var m;
    try { aptx.parseTree('', '{"x": 1}'); m = null; } catch (e) { m = e.message || String(e); }
    if (!m || m.indexOf('Auspice') < 0) {
        console.log('    pasted JSON routing: ' + m);
        return false;
    }
    phy = aptx.parseTree('', '(a,b);');
    return forester.getAllExternalNodes(phy).length === 2;
}


// Property VALUES named after Object.prototype members ("toString",
// "__proto__", "constructor") crashed visualizationCandidates -- and with it
// launch() -- through plain-object lookup maps returning inherited members.
// They are ordinary category values now (and "__proto__" folds to "Proto"
// via the underscore fold). Nothing may leak onto Object.prototype either.
function testAuditPrototypeValueNames() {
    var phy = starTree(['toString', 'toString', '__proto__', '__proto__', 'constructor', 'valueOf'], 'x:Host');
    var cands = forester.visualizationCandidates(phy);
    if (cands.length !== 1) {
        console.log('    candidates: ' + cands.length);
        return false;
    }
    var vals = cands[0].values.slice().sort().join(',');
    if (vals !== 'Constructor,Proto,ToString,ValueOf') {
        console.log('    values: ' + vals);
        return false;
    }
    return ({}).nodes === undefined && ({}).count === undefined && ({}).spellings === undefined;
}

console.log("\naudit regressions\n");

runTest("audit: Infinity dates      : ", testAuditInfinityDates);
runTest("audit: sparse field budget : ", testAuditSparseFieldNeverWins);
runTest("audit: msa guards + freeze : ", testAuditMsaGuards);
runTest("audit: residue info parity : ", testAuditResidueInfoParity);
runTest("audit: conservation detail : ", testAuditConservationDetails);
runTest("audit: geo window queries  : ", testAuditGeoWindows);
runTest("audit: underscore fold     : ", testAuditUnderscoreFold);
runTest("audit: nodeVis stays dead  : ", testNodeVisualizationsStayRemoved);
runTest("audit: launch API guards   : ", testLaunchApiValidation);
runTest("brackets flag retired   : ", testBracketsFlagRetired);
runTest("property display name    : ", testPropertyDisplayName);
runTest("taxon id never offered   : ", testTaxonIdNeverOffered);
runTest("record-keeping refs never offered: ", testRecordKeepingNeverOffered);
runTest("in-group offered, never first : ", testInGroupOfferedButNotFirst);
runTest("sparse ranked, not refused  : ", testSparseFieldsRankedNotRefused);
runTest("internal labels as conf : ", testInternalLabelsAsConfidence);
runTest("internal labels wiring  : ", testInternalLabelsWiring);
runTest("phylogram branch counts : ", testPhylogramBranchCounts);
runTest("parseTree content sniff    : ", testParseTreeContentSniffing);
runTest("audit: proto-named values  : ", testAuditPrototypeValueNames);
runTest("versions agree           : ", testVersionsAgree);

if (_testFailures > 0) {
    console.log("\n" + _testFailures + " test(s) FAILED");
    process.exit(1);
} else {
    console.log("\nAll tests passed");
}

// The version appears in FOUR places and they must agree: package.json, the
// VERSION constant the About box and the control-panel button display, and
// the header comment of each library file. 3.2.0 shipped to npm with VERSION
// still reading '3.1.0' because the release bumped the headers and missed the
// constant, and nothing failed. This is that check.
function testVersionsAgree() {
    var fs = require('fs');
    var pth = require('path');
    var root = pth.join(__dirname, '..');
    var expected = JSON.parse(fs.readFileSync(pth.join(root, 'package.json'), 'utf8')).version;

    var apx = fs.readFileSync(pth.join(root, 'archaeopteryx.js'), 'utf8');
    var m = apx.match(/const VERSION = '([^']+)'/);
    if (!m) {
        console.log('    no VERSION constant found in archaeopteryx.js');
        return false;
    }
    if (m[1] !== expected) {
        console.log('    archaeopteryx.js VERSION is ' + m[1] + ', package.json says ' + expected);
        return false;
    }
    var files = ['archaeopteryx.js', 'forester.js'];
    for (var i = 0; i < files.length; ++i) {
        var txt = fs.readFileSync(pth.join(root, files[i]), 'utf8');
        var h = txt.match(/^\/\/ v ([0-9][^\s]*)$/m);
        if (!h) {
            console.log('    no "// v X.Y.Z" header in ' + files[i]);
            return false;
        }
        if (h[1] !== expected) {
            console.log('    ' + files[i] + ' header is ' + h[1] + ', package.json says ' + expected);
            return false;
        }
    }
    return true;
}

// A field covering less than 2/3 of the tips used to be REFUSED outright. It
// is ranked last instead, matching the desktop, which has done it that way
// since 0.11.133 for the reason that turns out to be measurable: someone
// hand-annotates a subset precisely because it is worth marking.
//
// The refusal cost real data. On the 13,246-tip BV-BRC flu tree, Country
// (8,031 covered, 28 values) and Region (8,030, 13 values) both sit at 61%
// and were missing from the menu entirely -- the two fields a phylogeography
// user reaches for first, gone from our own flagship demo, invisibly.
function testSparseFieldsRankedNotRefused() {
    // 30 tips. "Dense" covers all of them but is 28/30 one value, so it scores
    // badly (~0.2); "Sparse" covers 18 (60%, under the bar) but splits evenly,
    // so it scores ~0.6. The sparse field therefore OUTSCORES the dense one,
    // and only the tier can put it last -- which is the point. A first version
    // of this fixture had the sparse field scoring lower, so it sorted last
    // whether or not the tier existed, and removing the tier left the test
    // green.
    function build() {
        var tips = [];
        for (var i = 0; i < 30; ++i) { tips.push('t' + i); }
        var phy = forester.parseNewHampshire('(' + tips.join(',') + ');', true, false);
        forester.getAllExternalNodes(phy).forEach(function (n, i) {
            n.properties = [{ref: 'x:Dense', datatype: 'xsd:string', applies_to: 'node',
                             value: (i < 28) ? 'A' : 'B'}];
            if (i < 18) {
                n.properties.push({ref: 'x:Sparse', datatype: 'xsd:string', applies_to: 'node',
                                   value: (i % 2) ? 'P' : 'Q'});
            }
        });
        return phy;
    }

    var cands = forester.visualizationCandidates(build());
    var refs = cands.map(function (c) { return c.ref; });

    if (refs.indexOf('x:Sparse') < 0) {
        console.log('    a 60%-covered field was refused: ' + refs.join(', '));
        return false;
    }
    if (cands[0].ref !== 'x:Dense') {
        console.log('    the sparse field led the list: ' + refs.join(', '));
        return false;
    }
    if (refs[refs.length - 1] !== 'x:Sparse') {
        console.log('    the sparse field did not sort last: ' + refs.join(', '));
        return false;
    }
    if (!cands[cands.length - 1].sparse) {
        console.log('    the sparse field is not flagged sparse');
        return false;
    }

    // alone, it is all there is -- offered AND applicable, since the legend
    // carries a "no value" row for the tips it does not cover
    var tips2 = [];
    for (var j = 0; j < 30; ++j) { tips2.push('u' + j); }
    var only = forester.parseNewHampshire('(' + tips2.join(',') + ');', true, false);
    forester.getAllExternalNodes(only).forEach(function (n, i) {
        n.properties = (i < 18)
            ? [{ref: 'x:Sparse', datatype: 'xsd:string', applies_to: 'node', value: (i % 2) ? 'P' : 'Q'}]
            : [];
    });
    var alone = forester.visualizationCandidates(only);
    if (alone.length !== 1 || alone[0].ref !== 'x:Sparse') {
        console.log('    alone, the sparse field produced ' + alone.length + ' candidates');
        return false;
    }
    if (alone[0].wide) {
        console.log('    alone, it reads as wide, so the viewer would decline to apply it');
        return false;
    }

    // and the bar itself is unchanged: 20/30 is not sparse, 19/30 is
    function sparseAt(k) {
        var t = [];
        for (var m = 0; m < 30; ++m) { t.push('v' + m); }
        var phy = forester.parseNewHampshire('(' + t.join(',') + ');', true, false);
        forester.getAllExternalNodes(phy).forEach(function (n, i) {
            n.properties = (i < k)
                ? [{ref: 'x:F', datatype: 'xsd:string', applies_to: 'node', value: (i % 2) ? 'A' : 'B'}]
                : [];
        });
        var c = forester.visualizationCandidates(phy)[0];
        return c ? !!c.sparse : null;
    }
    if (sparseAt(20) !== false || sparseAt(19) !== true) {
        console.log('    the 2/3 boundary moved: 20/30 sparse=' + sparseAt(20)
            + ', 19/30 sparse=' + sparseAt(19));
        return false;
    }
    return true;
}
