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
        return c.id + ' ' + c.colorMode + (c.shape ? '+shape' : '');
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
    return expectExactly('Adenoviridae', [
        'prop:vipr:Genus category+shape',
        'prop:vipr:Year range'
    ]);
}

// Genus has 10 values here: colour yes, shape no (7 is the shape limit).
function testCaliciviridae100() {
    return expectExactly('Caliciviridae_100', [
        'prop:vipr:Genus category',
        'prop:vipr:Year range'
    ]);
}

// Same family at a different sample size must give the SAME menu -- the
// instability of the old distinct<=50 cliff is what this pair guards against.
function testCaliciviridae500() {
    return expectExactly('Caliciviridae_500', [
        'prop:vipr:Genus category',
        'prop:vipr:Year range'
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
        'prop:vipr:Year_Month category',
        'prop:vipr:Host category+shape',
        'prop:vipr:PANGO_Lineage_L0 category+shape',
        'prop:vipr:Year range+shape'
    ]);
}

// Seven of this tree's ten property fields are single-valued across all 42
// nodes (Country and Region among them: every strain is North American) --
// each would paint the whole tree one colour. The distinct >= 2 rule drops
// every one of them.
function testConfidences() {
    return expectExactly('confidences', [
        'prop:ird:FluSeason category+shape',
        'prop:ird:GlobalH1Clade category+shape',
        'prop:ird:Year range+shape'
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
    return expectExactly('herpes_dnapol', [
        'prop:BVBRC:geographic_group category+shape',
        'prop:BVBRC:isolation_country category',
        'prop:BVBRC:host_common_name category',
        'prop:BVBRC:host_group category+shape',
        'prop:BVBRC:collection_year range'
    ]);
}

// Six tips. FluSeason is on 2 of 6 (below 2/3). Year has 5 distinct values
// over 6 covered nodes: 5/6 = 0.83, inside the 0.9 identifier guard, so it
// stays a ramp -- on a tree this small, near-unique is not proof of an id.
function testInfluenza() {
    return expectExactly('influenza', [
        'prop:ird:Country category+shape',
        'prop:ird:Host category+shape',
        'prop:ird:Subtype category+shape',
        'prop:ird:Region category+shape',
        'prop:ird:H5Clade category+shape',
        'prop:ird:Year range+shape',
        'prop:ird:NA range+shape',
        'prop:ird:HA range+shape'
    ]);
}

// The refusals that matter most, named explicitly so the intent survives
// even if the exact-list tests above are ever loosened.
function testRefusals() {
    var herpes = summarize(forester.visualizationCandidates(loadTree('herpes_dnapol'))).join('\n');
    var flu = summarize(forester.visualizationCandidates(loadTree('flu_h5'))).join('\n');
    var refused = [
        [herpes, 'prop:BVBRC:product'],          // one value on every node
        [herpes, 'prop:BVBRC:state_province'],   // 9% coverage
        [herpes, 'prop:BVBRC:genome_id'],        // numeric identifier
        [herpes, 'prop:BVBRC:patric_id'],        // identifier
        [herpes, 'prop:BVBRC:accession'],        // identifier
        [flu, 'prop:BVBRC:species'],             // one value on every node
        [flu, 'prop:BVBRC:genome_name'],         // 346 distinct of 354
        [flu, 'prop:BVBRC:genome_id']            // numeric identifier
    ];
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
function testCoverageBoundary() {
    var atTwoThirds = starTree(['a', 'a', 'b', 'b', null, null]);
    var below = starTree(['a', 'a', 'b', null, null, null]);
    return only(atTwoThirds) !== null
        && forester.visualizationCandidates(below).length === 0;
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

// Numeric fields always get a ramp -- order is the point of numbers -- and
// their values come back sorted numerically, not lexicographically.
function testNumericIsAlwaysRange() {
    var c = only(starTree(['2', '10', '2', '10', '5', '5']));
    return c !== null && c.numeric === true && c.colorMode === 'range'
        && c.shape === true
        && c.values.join(',') === '2,5,10';
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
    if (cands.length !== 2) return false;
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
// The shared-prefix detector (forester.commonNamePrefix)
// --------------------------------------------------------------

// Every flu genome name starts "Influenza A virus" (four of them say
// "Virus" -- the comparison is case-insensitive); the herpes names share
// nothing. The prefix ends at a clean word boundary even though some names
// continue with "(" and others with " ".
function testPrefixFixtures() {
    var flu = loadTree('flu_h5');
    var herpes = loadTree('herpes_dnapol');
    return forester.commonNamePrefix(flu, 'BVBRC:genome_name') === 'Influenza A virus'
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
runTest("numeric is always a range  : ", testNumericIsAlwaysRange);
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
runTest("prefix, fixtures           : ", testPrefixFixtures);
runTest("prefix, word boundary      : ", testPrefixWordBoundary);
runTest("node value vs classifier   : ", testNodeValueAgreesWithClassifier);
runTest("node value, element slots  : ", testNodeValueElementSlots);
runTest("wrapper tolerated          : ", testWrapperTolerated);

if (_testFailures > 0) {
    console.log("\n" + _testFailures + " test(s) FAILED");
    process.exit(1);
} else {
    console.log("\nAll tests passed");
}
