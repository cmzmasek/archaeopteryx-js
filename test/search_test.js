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

// Tests for the search engine in forester.js (forester.searchWithSpec and
// friends), which drives the search boxes in archaeopteryx.js. The edge cases
// mirror the desktop Archaeopteryx search tests (SearchMatchingTest et al.),
// which serve as the executable spec.

"use strict";

var forester = require('../forester').forester;

if (!forester) {
    throw new Error("no forester.js");
}

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

// --------------------------------------------------------------
// Fixture: a small annotated tree, built the way archaeopteryx.js
// uses the engine (the phylogeny object itself is passed as root).
//
//        +-- A  Homo sapiens / HUMAN / Apaf-1 sequence
//   +-AB-+
//   |    +-- B  Mus musculus / x:Year=2001 x:Count=5
// --+
//   |    +-- C  Felis catus / x:Count=12
//   +CDE-+-- D  (no annotations; polytomy member)
//        +-- E  seq name 'gamma kinase subunit'
// --------------------------------------------------------------
function makeTestTree() {
    var phy = forester.parseNewHampshire('((A:0.1,B:0.2)AB:0.3,(C:0.15,D:0.25,E:0.05)CDE:0.4)Root;');
    var byName = {};
    forester.preOrderTraversalAll(phy, function (n) {
        if (n.name) {
            byName[n.name] = n;
        }
    });
    byName.A.taxonomies = [{
        scientific_name: 'Homo sapiens', code: 'HUMAN', common_name: 'human',
        id: {value: '9606'}, synonyms: ['man']
    }];
    byName.A.sequences = [{
        name: 'Apaf-1', gene_name: 'APAF1', symbol: 'APAF', accession: {value: 'NM_001160'},
        mol_seq: 'MDAKAR',
        annotations: [{desc: 'apoptosis regulator', ref: 'GO:0006915'}]
    }];
    byName.B.taxonomies = [{scientific_name: 'Mus musculus', code: 'MOUSE'}];
    byName.B.properties = [
        {ref: 'x:Year', value: '2001', datatype: 'xsd:string', applies_to: 'node'},
        {ref: 'x:Count', value: '5', applies_to: 'node'}
    ];
    byName.C.taxonomies = [{scientific_name: 'Felis catus'}];
    byName.C.properties = [{ref: 'x:Count', value: '12', applies_to: 'node'}];
    byName.E.sequences = [{name: 'gamma kinase subunit'}];
    byName.AB.confidences = [{type: 'bootstrap', value: 95}];
    return {phy: phy, byName: byName};
}

function field(phy, key) {
    var fields = forester.availableSearchFields(phy);
    for (var i = 0; i < fields.length; ++i) {
        if (fields[i].key === key) {
            return fields[i];
        }
    }
    return null;
}

function spec(phy, key, mode, value, opts) {
    opts = opts || {};
    return {
        field: field(phy, key),
        mode: mode,
        value: value,
        value2: opts.value2,
        caseSensitive: opts.caseSensitive === true,
        inverse: opts.inverse === true
    };
}

// The names of the matched (named) nodes, sorted, joined -- for compact asserts.
function names(resultSet) {
    var out = [];
    resultSet.forEach(function (n) {
        out.push(n.name ? n.name : '?');
    });
    return out.sort().join(',');
}

runTest("parseFiniteDouble          : ", testParseFiniteDouble);
runTest("string modes               : ", testStringModes);
runTest("whole word boundaries      : ", testWholeWordBoundaries);
runTest("regex mode                 : ", testRegexMode);
runTest("available fields           : ", testAvailableFields);
runTest("available fields, bare tree: ", testAvailableFieldsBareTree);
runTest("property numeric typing    : ", testPropertyNumericTyping);
runTest("text search, specific field: ", testTextSearchSpecificField);
runTest("text search, any text      : ", testTextSearchAnyText);
runTest("OR / AND terms             : ", testOrAndTerms);
runTest("case sensitivity           : ", testCaseSensitivity);
runTest("numeric comparators        : ", testNumericComparators);
runTest("numeric range              : ", testNumericRange);
runTest("confidence field           : ", testConfidenceField);
runTest("property search            : ", testPropertySearch);
runTest("structure fields           : ", testStructureFields);
runTest("node type field            : ", testNodeTypeField);
runTest("inverse is field-scoped    : ", testInverseFieldScoped);
runTest("invalid input fails closed : ", testInvalidInputFailsClosed);
runTest("distinct values            : ", testDistinctValues);
runTest("phylogeny wrapper skipped  : ", testPhylogenyWrapperNotSearchable);
runTest("super-root not a tree node : ", testSuperRootNotCountedAsNode);

if (_testFailures > 0) {
    console.log("\n" + _testFailures + " test(s) FAILED");
    process.exit(1);
} else {
    console.log("\nAll tests passed");
}

function testParseFiniteDouble() {
    var p = forester.parseFiniteDouble;
    if (p('0.5') !== 0.5) return false;
    if (p('  7  ') !== 7) return false;
    if (p('-3') !== -3) return false;
    // comma as decimal separator, when unambiguous
    if (p('0,5') !== 0.5) return false;
    if (p('-2,25') !== -2.25) return false;
    if (p('1,2345') !== 1.2345) return false;
    // the US thousands pattern (comma + exactly 3 digits) is rejected
    if (p('12,500') !== null) return false;
    if (p('1,000') !== null) return false;
    // ambiguous / malformed
    if (p('1,5,5') !== null) return false;
    if (p('1.5,5') !== null) return false;
    if (p('') !== null) return false;
    if (p('   ') !== null) return false;
    if (p('abc') !== null) return false;
    if (p('Infinity') !== null) return false;
    if (p(null) !== null) return false;
    if (p(undefined) !== null) return false;
    return true;
}

function testStringModes() {
    var t = forester.makeSearchStringTest;
    if (t('homo', 'contains', false)('Homo sapiens') !== true) return false;
    if (t('homo', 'contains', false)('Mus musculus') !== false) return false;
    if (t('Homo', 'starts_with', false)('homo sapiens') !== true) return false;
    if (t('sapiens', 'starts_with', false)('Homo sapiens') !== false) return false;
    if (t('piens', 'ends_with', false)('Homo sapiens') !== true) return false;
    if (t('Homo', 'ends_with', false)('Homo sapiens') !== false) return false;
    // null / undefined values never match
    if (t('x', 'contains', false)(null) !== false) return false;
    if (t('x', 'contains', false)(undefined) !== false) return false;
    return true;
}

function testWholeWordBoundaries() {
    var t = forester.makeSearchStringTest;
    var w = t('Homo', 'whole_word', false);
    // boundary = string edge or any non-alphanumeric character
    if (w('Homo sapiens') !== true) return false;
    if (w('Homo_sapiens') !== true) return false;
    if (w('(Homo)') !== true) return false;
    if (w('Homology') !== false) return false;
    if (w('pseudoHomo') !== false) return false;
    var k = t('kinase', 'whole_word', false);
    if (k('Rot1-kinase') !== true) return false;
    if (k('kinase,') !== true) return false;
    if (k('kinases') !== false) return false;
    if (k('prokinase') !== false) return false;
    // unicode: a diacritic is part of the word
    var b = t('Bäcker', 'whole_word', false);
    if (b('der Bäcker kam') !== true) return false;
    if (b('Bäckerei') !== false) return false;
    var a = t('acker', 'whole_word', false);
    if (a('Bäcker') !== false) return false;
    return true;
}

function testRegexMode() {
    var t = forester.makeSearchStringTest;
    var re = t('^Homo.*ens$', 'regex', false);
    if (re('Homo sapiens') !== true) return false;
    if (re('a Homo sapiens b') !== false) return false;
    if (t('\\d{4}', 'regex', false)('year 2001') !== true) return false;
    // case flag honored
    if (t('HOMO', 'regex', false)('Homo sapiens') !== true) return false;
    if (t('HOMO', 'regex', true)('Homo sapiens') !== false) return false;
    // an invalid regex yields null (caller shows the red cue / never matches)
    if (t('\\d{', 'regex', false) !== null) return false;
    if (t('[', 'regex', false) !== null) return false;
    return true;
}

function testAvailableFields() {
    var f = makeTestTree();
    var keys = forester.availableSearchFields(f.phy).map(function (x) {
        return x.key;
    });
    var expected = ['ANY', 'NN', 'TS', 'TN', 'TC', 'TI', 'SY', 'SN', 'GN', 'SS', 'SA', 'AN', 'MS',
        'BL', 'CO', 'PROP:x:Count', 'PROP:x:Year', 'CS', 'NC', 'DE', 'DR', 'NT'];
    return keys.join('|') === expected.join('|');
}

function testAvailableFieldsBareTree() {
    // a tree with no branch lengths and no annotations offers only the
    // always-present fields plus the structure fields (minus Distance from
    // Root, which needs branch lengths)
    var phy = forester.parseNewHampshire('((A,B),C);');
    var keys = forester.availableSearchFields(phy).map(function (x) {
        return x.key;
    });
    return keys.join('|') === ['ANY', 'NN', 'CS', 'NC', 'DE', 'NT'].join('|');
}

function testPropertyNumericTyping() {
    var f = makeTestTree();
    // no datatype + every value parses as a number -> numeric
    if (field(f.phy, 'PROP:x:Count').numeric !== true) return false;
    // a declared non-numeric datatype (xsd:string) wins -> text, even though
    // the values ('2001') would parse
    if (field(f.phy, 'PROP:x:Year').numeric !== false) return false;
    return true;
}

function testTextSearchSpecificField() {
    var f = makeTestTree();
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'homo'))) !== 'A') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TC', 'contains', 'MOUSE'))) !== 'B') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'GN', 'contains', 'APAF1'))) !== 'A') return false;
    // a specific field does not leak into others: 'gamma' is a sequence name,
    // not a taxonomy
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'gamma'))) !== '') return false;
    return true;
}

function testTextSearchAnyText() {
    var f = makeTestTree();
    // Any Text spans node name, taxonomy, sequence, annotation, properties
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'contains', 'sapiens'))) !== 'A') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'contains', 'apoptosis'))) !== 'A') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'contains', '2001'))) !== 'B') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'contains', 'CDE'))) !== 'CDE') return false;
    // Any Text deliberately excludes the molecular sequence
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'contains', 'MDAKAR'))) !== '') return false;
    // ...but the explicit Molecular Sequence field finds it
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'MS', 'contains', 'MDAKAR'))) !== 'A') return false;
    return true;
}

function testOrAndTerms() {
    var f = makeTestTree();
    // ',' = OR
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'catus,musculus'))) !== 'B,C') return false;
    // '+' = AND within one field value
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'SN', 'contains', 'gamma+kinase'))) !== 'E') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'SN', 'contains', 'gamma+zzz'))) !== '') return false;
    // OR of an AND group and a plain term
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'contains', 'gamma+kinase,sapiens'))) !== 'A,E') return false;
    // a separator-only query matches nothing (even with inverse -- no select-all)
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'contains', ',', {inverse: true})).size !== 0) return false;
    return true;
}

function testCaseSensitivity() {
    var f = makeTestTree();
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'HOMO'))) !== 'A') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'HOMO', {caseSensitive: true}))) !== '') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'Homo', {caseSensitive: true}))) !== 'A') return false;
    return true;
}

function testNumericComparators() {
    var f = makeTestTree();
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'eq', '0.1'))) !== 'A') return false;
    // comma decimal separator works in the operand
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'eq', '0,1'))) !== 'A') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'gt', '0.2'))) !== 'AB,CDE,D') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'ge', '0.2'))) !== 'AB,B,CDE,D') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'lt', '0.1'))) !== 'E') return false;
    // ne selects every branch-length-carrying node except A
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'ne', '0.1'))) !== 'AB,B,C,CDE,D,E') return false;
    return true;
}

function testNumericRange() {
    var f = makeTestTree();
    // range is inclusive at both ends
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'range', '0.1', {value2: '0.2'}))) !== 'A,B,C') return false;
    // swapped bounds are tolerated
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'range', '0.2', {value2: '0.1'}))) !== 'A,B,C') return false;
    // a missing second bound resets (matches nothing)
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'range', '0.1')).size !== 0) return false;
    return true;
}

function testConfidenceField() {
    var f = makeTestTree();
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'CO', 'ge', '90'))) !== 'AB') return false;
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'CO', 'gt', '95')).size !== 0) return false;
    return true;
}

function testPropertySearch() {
    var f = makeTestTree();
    // numeric property, numeric comparison
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'PROP:x:Count', 'gt', '6'))) !== 'C') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'PROP:x:Count', 'le', '5'))) !== 'B') return false;
    // string-typed property, text matching
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'PROP:x:Year', 'contains', '2001'))) !== 'B') return false;
    // a property field is scoped to its ref
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'PROP:x:Year', 'contains', '12')).size !== 0) return false;
    return true;
}

function testStructureFields() {
    var f = makeTestTree();
    // every leaf has clade size 1
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'CS', 'eq', '1'))) !== 'A,B,C,D,E') return false;
    // NC > 2 finds the polytomy
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'NC', 'gt', '2'))) !== 'CDE') return false;
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'NC', 'eq', '2'))) !== 'AB,Root') return false;
    // distance from root sums branch lengths (A = 0.3 + 0.1, CDE = 0.4); this
    // also exercises the approximate eq (0.3 + 0.1 !== 0.4 in binary floats)
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'DR', 'eq', '0.4'))) !== 'A,CDE') return false;
    return true;
}

function testNodeTypeField() {
    var f = makeTestTree();
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'NT', 'contains', 'leaf'))) !== 'A,B,C,D,E') return false;
    // 'internal' = the named clades (not the leaves, not the tree root)
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'NT', 'contains', 'internal'))) !== 'AB,CDE,Root') return false;
    return true;
}

function testInverseFieldScoped() {
    var f = makeTestTree();
    // inverse of 'homo' on Taxonomy Scientific = the OTHER nodes that HAVE a
    // scientific name (B, C) -- not the taxonomy-less D / E / internals
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'homo', {inverse: true}))) !== 'B,C') return false;
    // inverse of a no-hit query selects every field-carrying node
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'contains', 'zzz', {inverse: true}))) !== 'A,B,C') return false;
    return true;
}

function testInvalidInputFailsClosed() {
    var f = makeTestTree();
    // an uncompilable regex matches nothing (never throws)
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'regex', '\\d{')).size !== 0) return false;
    // ...even with inverse on (reset, not select-all)
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'ANY', 'regex', '\\d{', {inverse: true})).size !== 0) return false;
    // a non-number on a numeric field matches nothing
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'eq', 'abc')).size !== 0) return false;
    if (forester.searchWithSpec(f.phy, spec(f.phy, 'BL', 'eq', 'abc', {inverse: true})).size !== 0) return false;
    // regex mode does not split on ',' / '+' (they are regex syntax)
    if (names(forester.searchWithSpec(f.phy, spec(f.phy, 'TS', 'regex', 'catus|musculus'))) !== 'B,C') return false;
    return true;
}

function testDistinctValues() {
    var f = makeTestTree();
    var vals = forester.distinctSearchValues(f.phy, field(f.phy, 'TS'));
    if (vals.join('|') !== 'Felis catus|Homo sapiens|Mus musculus') return false;
    // gating: nothing for Any Text, numeric fields, or the molecular sequence
    if (forester.distinctSearchValues(f.phy, field(f.phy, 'ANY')).length !== 0) return false;
    if (forester.distinctSearchValues(f.phy, field(f.phy, 'BL')).length !== 0) return false;
    if (forester.distinctSearchValues(f.phy, field(f.phy, 'MS')).length !== 0) return false;
    // the cap limits the list
    if (forester.distinctSearchValues(f.phy, field(f.phy, 'TS'), 2).length !== 2) return false;
    // node type is enumerable
    if (forester.distinctSearchValues(f.phy, field(f.phy, 'NT')).join('|') !== 'internal|leaf|root') return false;
    return true;
}

// The phyloXML parser hands back a wrapper object carrying the phylogeny's own
// name, with the real root as its single child. Searching used to match that
// wrapper, so a term occurring in the TREE's name lit up a phantom root.
function testPhylogenyWrapperNotSearchable() {
    // "Origin" deliberately carries no letter "a": the search is case
    // insensitive by default, so a root named "RealRoot" would match a search
    // for "A" through its lowercase one and confuse what is being tested.
    var inner = forester.parseNewHampshire('((A:0.1,B:0.2)AB:0.3,C:0.15)Origin;');
    var wrapper = {
        name: 'Influenza A virus phylogeny',   // the tree's name, not a node's
        description: 'a test tree',
        children: [inner]
    };
    inner.parent = wrapper;

    // "Influenza" appears only in the wrapper: nothing should match it
    if (forester.searchWithSpec(wrapper, spec(wrapper, 'NN', 'contains', 'Influenza')).size !== 0) return false;
    if (forester.searchWithSpec(wrapper, spec(wrapper, 'ANY', 'contains', 'Influenza')).size !== 0) return false;

    // the real nodes are still searchable, the real root included
    if (names(forester.searchWithSpec(wrapper, spec(wrapper, 'NN', 'contains', 'Origin'))) !== 'Origin') return false;
    if (names(forester.searchWithSpec(wrapper, spec(wrapper, 'NN', 'contains', 'A'))) !== 'A,AB') return false;

    // and the wrapper does not sneak in through an inverse search either
    if (names(forester.searchWithSpec(wrapper, spec(wrapper, 'NN', 'contains', 'A', {inverse: true}))) !== 'B,C,Origin') return false;
    return true;
}

// A parsed tree hangs off a synthetic super-root, which is not a node of the
// phylogeny: counting it added a node and a branch that do not exist, and from
// phyloXML it contributed the TREE's name as the longest node name.
function testSuperRootNotCountedAsNode() {
    // Newick: the super-root is unnamed, so only the counts are affected
    var nh = forester.parseNewHampshire('((a:1,b:1)AB:1,c:1)R;');
    var p = forester.collectBasicTreeProperties(nh);
    if (p.nodeCount !== 5) return false;                       // R, AB, a, b, c
    if (p.branchesWithPositiveLength !== 4) return false;       // every branch but R's
    if (p.nodeCount - 1 !== p.branchesWithPositiveLength) return false; // so the fraction is 1

    // phyloXML-shaped: the super-root also carries the tree's own name
    var inner = forester.parseNewHampshire('((a:1,b:1)AB:1,c:1)R;');
    var real = forester.getTreeRoot(inner);
    var wrapper = {name: 'A very long phylogeny name indeed', description: 'x', children: [real]};
    real.parent = wrapper;
    var q = forester.collectBasicTreeProperties(wrapper);
    if (q.nodeCount !== 5) return false;
    if (q.longestNodeName !== 2) return false;   // "AB", not the 33-character tree name
    return true;
}
