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

// Tests for the clades-by-rank model in forester.js (the pure half of
// "Colorize subtrees" and "Annotate clades" by a taxonomic rank): the three
// sources of a tip's taxon and their precedence, the ranks offered, and the
// maximal clades with Christian's voting rule (a tip the file does not place
// does not vote). Every number below was worked out BY HAND from the tree
// drawn here, not read off the code.
//
//   root
//   ├── A   <taxonomy> genus Felis
//   │   ├── a1  <taxonomy> species "Felis catus"      genus: Felis, by the ANCESTOR A
//   │   ├── a2  property vipr:Genus = "felis"         genus: Felis, by the PROPERTY (spelled lower)
//   │   └── a3  nothing                               genus: Felis, by the ancestor A
//   ├── B   nothing
//   │   ├── b1  property repseq:genus = "Panthera"    genus: Panthera
//   │   ├── b2  nothing, no annotated ancestor        genus: UNPLACED -- does not vote
//   │   └── b3  property x:Genus = "  Panthera  "     genus: Panthera (trimmed)
//   ├── C   nothing
//   │   ├── c1  property vipr:Genus = "Felis"         genus: Felis -- a second Felis clade
//   │   └── c2  property vipr:Genus = "Lynx"
//   ├── D   <taxonomy> genus Canis
//   │   ├── d1  nothing                               genus: Canis, by the ancestor
//   │   └── d2  property foo:Host = "dog"             genus: Canis (Host is no rank)
//   └── E   <taxonomy> genus Vulpes
//       ├── e1  <taxonomy> genus Nyctereutes AND property vipr:Genus = "Vulpes"
//       │                                             genus: Nyctereutes (own taxonomy over property)
//       └── e2  property vipr:Genus = "Vulpes"; <taxonomy> rank other "x"
//                                                     genus: Vulpes (property over ancestor)
//
// Clades at genus: A is pure Felis (a1, a2, a3). B is pure Panthera (b1, b3;
// b2 swept in, unplaced). C is mixed, so c1 and c2 are clades of their own.
// D is pure Canis. E is mixed (e1 Nyctereutes, e2 Vulpes): e1 and e2 are
// clades of their own, and E's own "Vulpes" does not outvote them. The root
// is mixed. Seven clades: A, B, c1, c2, D, e1, e2. Taxa by placed tips:
// Felis 4 in 2 clades, Canis 2, Panthera 2, Lynx 1, Nyctereutes 1, Vulpes 1.
// Tips 12, placed 11, unplaced 1 (b2).
//
// At species only a1 is placed ("Felis catus"), and since no other tip
// votes, the WHOLE tree is one clade of it, rooted at root: the reach of the
// voting rule, shown on purpose.

"use strict";

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

function tax(rank, name) {
    return '<taxonomy><scientific_name>' + name + '</scientific_name><rank>' + rank + '</rank></taxonomy>';
}

function prop(ref, value) {
    return '<property ref="' + ref + '" datatype="xsd:string" applies_to="node">' + value + '</property>';
}

function clade(name, inner) {
    return '<clade><name>' + name + '</name>' + inner + '</clade>';
}

var TREE = '<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade><name>root</name>'
    + clade('A', tax('genus', 'Felis')
        + clade('a1', tax('species', 'Felis catus'))
        + clade('a2', prop('vipr:Genus', 'felis'))
        + clade('a3', ''))
    + clade('B', ''
        + clade('b1', prop('repseq:genus', 'Panthera'))
        + clade('b2', '')
        + clade('b3', prop('x:Genus', '  Panthera  ')))
    + clade('C', ''
        + clade('c1', prop('vipr:Genus', 'Felis'))
        + clade('c2', prop('vipr:Genus', 'Lynx')))
    + clade('D', tax('genus', 'Canis')
        + clade('d1', '')
        + clade('d2', prop('foo:Host', 'dog')))
    + clade('E', tax('genus', 'Vulpes')
        + clade('e1', tax('genus', 'Nyctereutes') + prop('vipr:Genus', 'Vulpes'))
        + clade('e2', prop('vipr:Genus', 'Vulpes') + tax('other', 'x')))
    + '</clade></phylogeny></phyloxml>';

function readTree(text) {
    var t = px.parse(text, {trim: true, normalize: true})[0];
    forester.addParents(t);
    return t;
}

function byName(tree, name) {
    return forester.findByNodeName(tree, name)[0];
}

function names(nodes) {
    return nodes.map(function (n) {
        return n.name;
    }).sort().join(' ');
}

var tree = readTree(TREE);

runTest("rank: a tip's own taxonomy at the rank ", function () {
    var t = forester.tipRankTaxon(byName(tree, 'e1'), 'genus');
    return t !== null && t.name === 'Nyctereutes' && t.source === 'taxonomy';
});

runTest("rank: a property named for the rank, any namespace, trimmed ", function () {
    var b3 = forester.tipRankTaxon(byName(tree, 'b3'), 'genus');
    var b1 = forester.tipRankTaxon(byName(tree, 'b1'), 'genus');
    var a2 = forester.tipRankTaxon(byName(tree, 'a2'), 'Genus');
    return b3 !== null && b3.name === 'Panthera' && b3.source === 'property'
        && b1 !== null && b1.name === 'Panthera' && b1.source === 'property'
        && a2 !== null && a2.name === 'felis' && a2.source === 'property';
});

runTest("rank: the nearest ancestor's own taxon, after the tip's own sources ", function () {
    var a1 = forester.tipRankTaxon(byName(tree, 'a1'), 'genus');
    var d2 = forester.tipRankTaxon(byName(tree, 'd2'), 'genus');
    var e2 = forester.tipRankTaxon(byName(tree, 'e2'), 'genus');
    return a1 !== null && a1.name === 'Felis' && a1.source === 'ancestor'
        && d2 !== null && d2.name === 'Canis' && d2.source === 'ancestor'
        && e2 !== null && e2.name === 'Vulpes' && e2.source === 'property';
});

runTest("rank: a tip with nothing and no annotated ancestor is unplaced ", function () {
    return forester.tipRankTaxon(byName(tree, 'b2'), 'genus') === null
        && forester.tipRankTaxon(byName(tree, 'b2'), 'species') === null
        && forester.tipRankTaxon(byName(tree, 'a1'), 'family') === null
        && forester.tipRankTaxon(null, 'genus') === null
        && forester.tipRankTaxon(byName(tree, 'a1'), '') === null;
});

runTest("rank: an internal node is read for its own taxon only ", function () {
    var A = forester.ownRankTaxon(byName(tree, 'A'), 'genus');
    var B = forester.ownRankTaxon(byName(tree, 'B'), 'genus');
    return A !== null && A.name === 'Felis' && A.source === 'taxonomy' && B === null;
});

runTest("rank: a rank of 'other' and a property that is no rank are not ranks ", function () {
    return forester.ownRankTaxon(byName(tree, 'e2'), 'other') === null
        && forester.ownRankTaxon(byName(tree, 'd2'), 'host') === null;
});

runTest("rank: the ranks offered, in canonical order, with their coverage ", function () {
    // genus places 11 of 12 tips over 6 taxa; species places a1 alone (one
    // taxon of one tip: nothing to colour, not offered); "other" is no rank
    var cov = forester.rankCoverage(tree);
    return cov.length === 1 && cov[0].rank === 'genus' && cov[0].placed === 11 && cov[0].tips === 12
        && cov[0].taxa === 6;
});

runTest("rank: canonical ranks first, in order, then the rest alphabetically ", function () {
    var sorted = ['subtype', 'zzz', 'species', 'aaa', 'domain', 'genus', 'h5clade', 'subclade'].sort(forester.compareRanks);
    var R = forester.TAXONOMIC_RANKS;
    // the comparator folds: the list's own "forma specialis" sorts in its
    // place, and names sort as their keys do
    var folded = ['variant', 'forma specialis', 'Sub-Species', 'varietas'].sort(forester.compareRanks);
    return sorted.join(' ') === 'domain genus species subtype subclade aaa h5clade zzz'
        && R.slice().sort(forester.compareRanks).join(',') === R.join(',')
        && folded.join(' ') === 'Sub-Species varietas forma specialis variant'
        && R.indexOf('other') < 0 && R.indexOf('unknown') < 0
        && R.indexOf('strain') < 0 && R.indexOf('substrain') < 0 && R.indexOf('isolate') < 0
        && R.indexOf('varietas') < 0
        && R.length === 67
        && R.indexOf('species') < R.indexOf('subspecies') && R.indexOf('subtype') < R.indexOf('clade')
        && R.indexOf('subgenus') < R.indexOf('section') && R.indexOf('subsection') < R.indexOf('species')
        && R.indexOf('variant') === R.length - 1;
});

runTest("rank: a rank's key folds case, spaces, hyphens, underscores, dots and a few abbreviations ", function () {
    return forester.rankKey('Sub-Species') === 'subspecies' && forester.rankKey('sub_species') === 'subspecies'
        && forester.rankKey(' ssp. ') === 'subspecies' && forester.rankKey('subsp') === 'subspecies'
        && forester.rankKey('Forma specialis') === 'formaspecialis' && forester.rankKey('f. sp.') === 'formaspecialis'
        && forester.rankKey('var.') === 'variety' && forester.rankKey('cv') === 'cultivar'
        && forester.rankKey('varietas') === 'variety' && forester.rankKey('Varietas') === 'variety'
        && forester.rankKey('Sub_Type') === 'subtype' && forester.rankKey('H5Clade') === 'h5clade'
        && forester.rankLabel('formaspecialis') === 'forma specialis' && forester.rankLabel('genus') === 'genus'
        && forester.rankLabel('h5clade') === null
        // no prototype in the tables: a rank named like an Object property is a string like any other
        && forester.rankKey('constructor') === 'constructor' && forester.rankLabel('constructor') === null
        && forester.rankKey('__proto__') === 'proto' && forester.rankKey('hasOwnProperty') === 'hasownproperty';
});

runTest("rank: strain, substrain and isolate are not ranks here (his word), nor other / unknown ", function () {
    // the strains repeat (two tips each), so the near-unique line would let
    // them through: refused by name, as properties and as taxonomy ranks
    var t = readTree('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade>'
        + clade('s1', prop('vipr:Strain', 'A') + prop('x:sub-strain', 'A1') + prop('y:Isolate', 'I1') + tax('strain', 'A'))
        + clade('s2', prop('vipr:Strain', 'A') + prop('x:sub_strain', 'A1') + prop('y:Isolate', 'I1') + tax('Sub_Strain', 'A1'))
        + clade('s3', prop('vipr:Strain', 'B') + prop('x:substrain', 'B1') + prop('y:Isolate', 'I2') + tax('isolate', 'I2'))
        + clade('s4', prop('vipr:Strain', 'B') + prop('x:substrain', 'B1') + prop('y:Isolate', 'I2') + tax('other', 'o'))
        + '</clade></phylogeny></phyloxml>');
    return forester.rankCoverage(t).length === 0
        && forester.rankKey('strain') === '' && forester.rankKey('Sub-Strain') === '' && forester.rankKey('isolate') === ''
        && forester.rankKey('other') === '' && forester.rankKey('unknown') === '' && forester.rankKey('') === ''
        && forester.rankKey(null) === '';
});

runTest("rank: a property is a rank by the list, or as a clade / lineage scheme a tip carries; a field is not ", function () {
    var tip = function (name) {
        return clade(name, prop('ird:H5Clade', '2.3.4.4') + prop('vipr:PANGO_Lineage', 'B.1.1') + prop('vipr:PANGO_Lineage_L1', 'B.1')
            + prop('ns:clade_membership', '20A') + prop('BVBRC:host_group', 'Human') + prop('x:genome_type', 'ssRNA')
            + prop('ird:Subtype', 'H5N1') + prop('q:Serotype', 'O1')
            + prop('x:clade_size', '12') + prop('x:lineage_count', '3') + prop('x:clade_color', 'red')
            + prop('x:clade_support', '0.9') + prop('x:cladeSupport', '0.9'));
    };
    // the branch label as the auspice reader stores Nextstrain's: a field by
    // name (it does not end in clade); and a scheme by name carried by an
    // internal node only (Nextstrain_clade here): not a rank of the tips
    var t = readTree('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade>'
        + clade('I', prop('nextstrain:clade_label', '20A') + prop('ns:Nextstrain_clade', '20A') + tip('t1') + tip('t2'))
        + '</clade></phylogeny></phyloxml>');
    var cov = forester.rankCoverage(t);
    var keys = cov.map(function (c) { return c.rank; }).join(' ');
    var labels = cov.map(function (c) { return c.label; }).join(' ');
    // the listed ones first in their order (serotype before subtype), then
    // the file's own alphabetically, under the file's spelling: a name
    // ending in clade / lineage (a level suffix allowed) or clade_membership;
    // clade_size, lineage_count, clade_color, clade_support and cladeSupport
    // merely carry the word and are fields, as host_group and genome_type are
    return keys === 'serotype subtype clademembership h5clade pangolineage pangolineagel1'
        && labels === 'serotype subtype clade_membership H5Clade PANGO_Lineage PANGO_Lineage_L1'
        && forester.tipRankTaxon(byName(t, 't1'), 'H5-Clade').name === '2.3.4.4'
        && forester.tipRankTaxon(byName(t, 't1'), 'host_group') === null
        && forester.tipRankTaxon(byName(t, 't1'), 'clade_size') === null
        && forester.tipRankTaxon(byName(t, 't1'), 'clade_label') === null
        && forester.tipRankTaxon(byName(t, 't1'), 'Nextstrain_clade').name === '20A';   // placed, yet not offered
});

runTest("rank: a scheme of the file's own counts once a tip carries it; a listed rank on internal nodes alone still counts ", function () {
    // the same scheme, on a tip too: offered; genus on the internal node
    // alone: offered (the tips take it from the ancestor)
    var t = readTree('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade>'
        + clade('I', prop('ns:Nextstrain_clade', '20A') + prop('x:genus', 'Felis')
            + clade('t1', prop('ns:Nextstrain_clade', '20A')) + clade('t2', ''))
        + '</clade></phylogeny></phyloxml>');
    var cov = forester.rankCoverage(t);
    return cov.map(function (c) { return c.rank; }).join(' ') === 'genus nextstrainclade'
        && cov[1].label === 'Nextstrain_clade' && cov[1].placed === 2;
});

runTest("rank: the Nextstrain demo offers clade_membership alone, with no contradiction ", function () {
    var fs = require('fs');
    var t = forester.parseAuspiceJson(JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'docs', 'data', 'nextstrain-ncov.json'), 'utf8')));
    forester.addParents(t);
    var cov = forester.rankCoverage(t);
    return cov.length === 1 && cov[0].rank === 'clademembership' && cov[0].label === 'clade_membership' && cov[0].taxa === 7
        && forester.rankClades(t, 'clade_membership').conflicts.length === 0;
});

runTest("rank: the default rank reaches below species: the finest listed naming 2..20 taxa ", function () {
    var cov = [{rank: 'species', taxa: 3}, {rank: 'subtype', taxa: 2}, {rank: 'subclade', taxa: 30}];
    return forester.defaultRank(cov, 20) === 'subtype';
});

runTest("rank: the default among a file's own schemes is the one naming the most taxa within the cap, not the alphabet ", function () {
    // PANGO_Lineage (14) over its L1 (11) and L0 (2); GlobalH1Clade (2) over H1Clade (1, no candidate);
    // a scheme beats a listed rank; a scheme over the cap leaves the listed one; the most taxa when none fits
    return forester.defaultRank([{rank: 'species', taxa: 3}, {rank: 'subtype', taxa: 8}, {rank: 'pangolineage', taxa: 14},
            {rank: 'pangolineagel0', taxa: 2}, {rank: 'pangolineagel1', taxa: 11}], 20) === 'pangolineage'
        && forester.defaultRank([{rank: 'subtype', taxa: 1}, {rank: 'globalh1clade', taxa: 2}, {rank: 'h1clade', taxa: 1}], 20) === 'globalh1clade'
        && forester.defaultRank([{rank: 'species', taxa: 3}, {rank: 'h5clade', taxa: 25}], 20) === 'species'
        && forester.defaultRank([{rank: 'species', taxa: 30}, {rank: 'h5clade', taxa: 25}], 20) === 'species'
        && forester.defaultRank([{rank: 'h5clade', taxa: 3}, {rank: 'nextstrainclade', taxa: 3}], 20) === 'h5clade';
});

var genus = forester.rankClades(tree, 'genus');

runTest("rank: the clades at genus: seven, maximal, disjoint ", function () {
    var roots = names(genus.clades.map(function (c) {
        return c.node;
    }));
    return genus.clades.length === 7 && roots === 'A B D c1 c2 e1 e2';
});

runTest("rank: each clade's taxon and tip counts ", function () {
    var by = {};
    genus.clades.forEach(function (c) {
        by[c.node.name] = c;
    });
    return by.A.taxon === 'Felis' && by.A.tips === 3 && by.A.placed === 3
        && by.B.taxon === 'Panthera' && by.B.tips === 3 && by.B.placed === 2
        && by.c1.taxon === 'Felis' && by.c1.tips === 1 && by.c1.placed === 1
        && by.c2.taxon === 'Lynx' && by.c2.tips === 1
        && by.D.taxon === 'Canis' && by.D.tips === 2 && by.D.placed === 2
        && by.e1.taxon === 'Nyctereutes' && by.e2.taxon === 'Vulpes';
});

runTest("rank: an unplaced tip is swept into its clade but names no taxon ", function () {
    var b2 = byName(tree, 'b2');
    return genus.cladeOf.get(b2) !== undefined && genus.cladeOf.get(b2).node.name === 'B'
        && !genus.tipTaxon.has(b2) && genus.tips === 12 && genus.placed === 11 && genus.unplaced === 1;
});

runTest("rank: every node under a clade root maps to that clade, the root included; a mixed node to none ", function () {
    var A = byName(tree, 'A');
    return genus.cladeOf.get(A).node === A && genus.cladeOf.get(byName(tree, 'a3')).node === A
        && genus.cladeOf.get(byName(tree, 'C')) === undefined
        && genus.cladeOf.get(byName(tree, 'E')) === undefined
        && genus.cladeOf.get(byName(tree, 'root')) === undefined
        && genus.cladeOf.size === 4 + 4 + 1 + 1 + 3 + 1 + 1;
});

runTest("rank: taxa grouped case-insensitively, the first spelling shown, by tips then name ", function () {
    var t = genus.taxa.map(function (x) {
        return x.name + ':' + x.tips + ':' + x.clades;
    }).join(' ');
    return t === 'Felis:4:2 Canis:2:1 Panthera:2:1 Lynx:1:1 Nyctereutes:1:1 Vulpes:1:1'
        && genus.tipTaxon.get(byName(tree, 'a2')) === 'Felis';
});

runTest("rank: a rank placing nothing gives an empty result ", function () {
    var r = forester.rankClades(tree, 'family');
    var none = forester.rankClades(tree, '');
    return r.clades.length === 0 && r.taxa.length === 0 && r.tips === 12 && r.placed === 0 && r.unplaced === 12
        && none.clades.length === 0 && none.tips === 0
        && forester.rankClades(null, 'genus').clades.length === 0;
});

runTest("rank: an internal annotation its tips contradict is reported, never corrected ", function () {
    // E says Vulpes, e1 says Nyctereutes itself: E is contradicted (and e1
    // still decides its own clade). A says Felis and a2's "felis" is the
    // same taxon spelled lower: no conflict. D's tips name nothing of their
    // own: no conflict. One conflict, E against e1.
    var m = forester.rankClades(tree, 'genus');
    return m.conflicts.length === 1
        && m.conflicts[0].node === byName(tree, 'E') && m.conflicts[0].taxon === 'Vulpes'
        && m.conflicts[0].tip === byName(tree, 'e1') && m.conflicts[0].tipTaxon === 'Nyctereutes'
        && m.clades.length === 7;
});

runTest("rank: no internal annotation at the rank, no conflict ", function () {
    // at species only a1 is annotated, and no internal node is
    return forester.rankClades(tree, 'species').conflicts.length === 0
        && forester.rankClades(tree, 'family').conflicts.length === 0;
});

runTest("rank: a nearer internal annotation contradicts a farther one through the tips it places ", function () {
    // F says Felis; its child G says Lynx; the tips name nothing of their
    // own, so they take G's Lynx -- F is contradicted (by tip g1, placed by
    // G), G is not
    var t = readTree('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade><name>root</name>'
        + clade('F', tax('genus', 'Felis') + clade('G', tax('genus', 'Lynx') + clade('g1', '') + clade('g2', '')))
        + clade('h1', prop('x:genus', 'Felis'))
        + '</clade></phylogeny></phyloxml>');
    var m = forester.rankClades(t, 'genus');
    return m.conflicts.length === 1 && m.conflicts[0].node === byName(t, 'F') && m.conflicts[0].taxon === 'Felis'
        && m.conflicts[0].tip === byName(t, 'g1') && m.conflicts[0].tipTaxon === 'Lynx';
});

runTest("rank: the tip a conflict names is the first DIFFERING placed tip, not the first placed tip ", function () {
    // X says Felis; x1 agrees (its own Felis), x2 says Lynx: the conflict
    // names x2
    var t = readTree('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade><name>root</name>'
        + clade('X', tax('genus', 'Felis') + clade('x1', prop('a:genus', 'Felis')) + clade('x2', prop('a:genus', 'Lynx')))
        + clade('y1', prop('a:genus', 'Felis'))
        + '</clade></phylogeny></phyloxml>');
    var m = forester.rankClades(t, 'genus');
    return m.conflicts.length === 1 && m.conflicts[0].node === byName(t, 'X')
        && m.conflicts[0].tip === byName(t, 'x2') && m.conflicts[0].tipTaxon === 'Lynx';
});

runTest("rank: species: the one placed tip makes the whole tree its clade (the voting rule's reach) ", function () {
    // a1 alone names a species; no other tip votes, so every subtree is
    // pure for it, up to the root
    var r = forester.rankClades(tree, 'species');
    return r.clades.length === 1 && r.clades[0].node.name === 'root' && r.clades[0].taxon === 'Felis catus'
        && r.clades[0].tips === 12 && r.clades[0].placed === 1
        && r.placed === 1 && r.unplaced === 11 && r.taxa[0].tips === 1;
});

runTest("rank: a tree pure for one taxon is one clade at the root ", function () {
    var t = readTree('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade><name>r</name>'
        + clade('x', prop('a:family', 'F')) + clade('y', '' + clade('y1', prop('b:Family', 'f')) + clade('y2', ''))
        + '</clade></phylogeny></phyloxml>');
    var r = forester.rankClades(t, 'family');
    return r.clades.length === 1 && r.clades[0].node.name === 'r' && r.clades[0].tips === 3 && r.clades[0].placed === 2
        && r.taxa.length === 1 && r.taxa[0].clades === 1
        && forester.rankCoverage(t).length === 1 && forester.rankCoverage(t)[0].taxa === 1;
});

runTest("rank: a taxonomy without a usable name places nothing ", function () {
    var t = readTree('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade><name>r</name>'
        + clade('x', '<taxonomy><rank>genus</rank></taxonomy>')
        + clade('y', '<taxonomy><code>CANFA</code><rank>genus</rank></taxonomy>')
        + clade('z', '<taxonomy><common_name>dog</common_name><rank>genus</rank></taxonomy>')
        + '</clade></phylogeny></phyloxml>');
    var y = forester.ownRankTaxon(byName(t, 'y'), 'genus');
    var z = forester.ownRankTaxon(byName(t, 'z'), 'genus');
    return forester.ownRankTaxon(byName(t, 'x'), 'genus') === null
        && y !== null && y.name === 'CANFA' && z !== null && z.name === 'dog';
});

runTest("rank: the default rank: the finest with 2..20 taxa, else the most taxa, else none ", function () {
    var cov = [{rank: 'family', taxa: 1}, {rank: 'genus', taxa: 4}, {rank: 'species', taxa: 234}];
    var flat = [{rank: 'class', taxa: 1}, {rank: 'family', taxa: 1}, {rank: 'species', taxa: 63}];
    var two = [{rank: 'family', taxa: 2}, {rank: 'genus', taxa: 10}, {rank: 'species', taxa: 66}];
    return forester.defaultRank(cov) === 'genus' && forester.defaultRank(flat) === 'species'
        && forester.defaultRank(two) === 'genus' && forester.defaultRank(two, 5) === 'family'
        && forester.defaultRank([]) === null && forester.defaultRank(null) === null
        && forester.defaultRank([{rank: 'strain', taxa: 1}]) === 'strain';
});

if (_testFailures > 0) {
    console.log("\n" + _testFailures + " rank test(s) FAILED");
    process.exit(1);
} else {
    console.log("\nAll rank tests passed");
}
