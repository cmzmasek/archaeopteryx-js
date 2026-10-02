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

// Tests for the pure half of the gene track (genome regions) in forester.js:
// the location grammar, which sequences are genes and which the contig
// record, the anchor, the mapping of every row onto one shared coordinate
// (the flip, the lanes, the contig ends), the arrow outline, the families,
// the legend rows and the links.
//
// The fixture is test/data/genome_regions.xml, written by
// test/make_genome_regions_fixture.js: twelve synthetic genomes, one row per
// rule. Every number here was computed BY HAND from the layout described at
// the top of that script (gene k of the canonical order at 1001 + 1100 k,
// 1000 bp long; F the middle gene), not read off the code.

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

function fixtureText() {
    return fs.readFileSync(pth.join(__dirname, 'data', 'genome_regions.xml'), 'utf8');
}

function readFixture() {
    return px.parse(fixtureText(), {trim: true, normalize: true})[0];
}

function tipByName(tree, name) {
    var hit = null;
    forester.preOrderTraversalAll(tree, function (n) {
        if (!n.children && n.name === name) {
            hit = n;
        }
    });
    return hit;
}

function tips(tree) {
    var out = [];
    forester.preOrderTraversalAll(tree, function (n) {
        if (!n.children) {
            out.push(n);
        }
    });
    return out;
}

function regionsOf(tree) {
    return tips(tree).map(function (n) {
        return forester.geneRegionOf(n);
    });
}

function near(a, b, eps) {
    return Math.abs(a - b) <= (eps === undefined ? 1e-9 : eps);
}

function fail(what, got) {
    console.log('    ' + what + ': ' + JSON.stringify(got));
    return false;
}

function strain(tree, nn) {
    return tipByName(tree, 'Synthobacter sp. S' + nn);
}

// ---- the grammar --------------------------------------------------------

function testLocationGrammar() {
    var p = forester.parseSequenceLocation;
    var a = p('NC_003317.1:1055720-1057636(-)');
    if (!a || a.contig !== 'NC_003317.1' || a.start !== 1055720 || a.end !== 1057636 || a.strand !== '-') {
        return fail('a gene', a);
    }
    var r = p('  ctg01:1-50000 ');
    if (!r || r.contig !== 'ctg01' || r.start !== 1 || r.end !== 50000 || r.strand !== null) {
        return fail('a record (no strand), with whitespace', r);
    }
    var c = p('gi|123:456:10-20(+)');
    if (!c || c.contig !== 'gi|123:456' || c.start !== 10 || c.end !== 20) {
        return fail('split on the LAST colon', c);
    }
    var one = p('x:7-7(+)');
    if (!one || one.start !== 7 || one.end !== 7) {
        return fail('a one-base gene', one);
    }
    var bad = ['x:3-2(+)', 'x:0-5(+)', ':1-2(+)', '1-2', 'plasmid pX', 'x:1-2(*)', 'x:1-2(+', 'x:1..2(+)', 'x:a-b',
        'x: 1-2', '', null, undefined, 5];
    for (var i = 0; i < bad.length; ++i) {
        if (p(bad[i]) !== null) {
            return fail('should be refused', bad[i]);
        }
    }
    if (forester.annotationNamespace('pgfam:PGF_00019355') !== 'pgfam' || forester.annotationNamespace('nocolon') !== null
        || forester.annotationNamespace(':x') !== null || forester.annotationNamespace(null) !== null) {
        return fail('namespaces', null);
    }
    return true;
}

// ---- the fixture itself -------------------------------------------------

function testFixtureCopies() {
    var demo = fs.readFileSync(pth.join(__dirname, '..', 'docs', 'data', 'genome-regions-synthetic.xml'), 'utf8');
    return demo === fixtureText();
}

// S01: eleven genes in position order on ctg01, its record, span 1001..13000
function testRegionCanonical() {
    var t = readFixture();
    var r = forester.geneRegionOf(strain(t, '01'));
    if (!r || r.contig !== 'ctg01' || r.genes.length !== 11 || r.otherContigs !== 0 || r.contigs !== 1) {
        return fail('S01 region', r && {contig: r.contig, n: r.genes.length, other: r.otherContigs});
    }
    if (!r.record || r.record.start !== 1 || r.record.end !== 50000 || r.record.accession.value !== 'NZ_SYN01000001.1'
        || r.record.name !== 'Synthobacter sp. S01 chromosome') {
        return fail('S01 record', r.record);
    }
    if (r.span.start !== 1001 || r.span.end !== 13000) {
        return fail('S01 span', r.span);
    }
    var f = r.genes[5];
    if (f.symbol !== 'synF' || f.product !== 'Molecular chaperone' || f.start !== 6501 || f.end !== 7500 || f.strand !== '+'
        || f.length !== 1000 || f.accession.source !== 'BV-BRC' || f.accession.value !== 'fig|1000.1.peg.6'
        || f.refs.join(' ') !== 'fam:F006 plf:P005') {
        return fail('S01 gene F', f);
    }
    if (forester.geneFamilyOf(f, 'fam') !== 'fam:F006' || forester.geneFamilyOf(f, 'plf') !== 'plf:P005'
        || forester.geneFamilyOf(f, 'pgfam') !== null || forester.geneFamilyOf(f, null) !== null) {
        return fail('family lookup', null);
    }
    if (forester.geneLocationText(f) !== 'ctg01:6501-7500(+)') {
        return fail('location text', forester.geneLocationText(f));
    }
    // the record is NOT a gene, and a tip with no sequences has no region
    if (forester.geneRegionOf(strain(t, '04')) !== null) {
        return fail('S04 should have none', null);
    }
    return true;
}

// S06 lists its genes A..K, which lie in DECREASING position: sorted by start
// K comes first. S10 has two contigs: the one with more genes is drawn, the
// five on the other counted. S12 carries a location that is prose: ignored.
function testRegionRules() {
    var t = readFixture();
    var s06 = forester.geneRegionOf(strain(t, '06'));
    if (s06.genes[0].symbol !== 'synK' || s06.genes[10].symbol !== 'synA' || s06.genes[5].symbol !== 'synF'
        || s06.genes[5].start !== 6501 || s06.genes[5].strand !== '-') {
        return fail('S06 order', s06.genes.map(function (g) {
            return g.symbol;
        }));
    }
    var s10 = forester.geneRegionOf(strain(t, '10'));
    if (s10.contig !== 'ctg10a' || s10.genes.length !== 6 || s10.otherContigs !== 5 || s10.contigs !== 2
        || !s10.record || s10.record.end !== 50000) {
        return fail('S10', {contig: s10.contig, n: s10.genes.length, other: s10.otherContigs});
    }
    var s07 = forester.geneRegionOf(strain(t, '07'));
    if (s07.record !== null || s07.genes.length !== 10 || s07.span.start !== 1001 || s07.span.end !== 11900) {
        return fail('S07', {record: s07.record, n: s07.genes.length, span: s07.span});
    }
    var s12 = forester.geneRegionOf(strain(t, '12'));
    if (s12.genes.length !== 12 || s12.span.end !== 14100) {
        return fail('S12', {n: s12.genes.length, span: s12.span});
    }
    var s08 = forester.geneRegionOf(strain(t, '08'));
    var y = s08.genes[5];
    if (s08.genes.length !== 13 || y.product !== 'Hypothetical protein' || y.symbol !== '' || y.refs.length !== 0
        || y.strand !== '-' || forester.geneFamilyOf(y, 'fam') !== null) {
        return fail('S08 Y', y);
    }
    var st = forester.geneRegionStats(t);
    if (st.tips !== 11 || st.genes !== 116 || st.otherContigs !== 5 || st.maxSpan !== 13100 || st.ignored !== 1) {
        return fail('stats', st);
    }
    var bp = forester.collectBasicTreeProperties(t);
    if (bp.geneRegions !== true || bp.maxGeneRegionLength !== 13100) {
        return fail('tree properties', {g: bp.geneRegions, L: bp.maxGeneRegionLength});
    }
    var ts = forester.treeStatistics(t);
    if (ts.tipsWithGenes !== 11) {
        return fail('tree statistics', ts.tipsWithGenes);
    }
    // a tree without any: nothing is claimed
    var plain = px.parse('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade><clade><name>a</name>'
        + '<sequence><name>p</name></sequence></clade><clade><name>b</name></clade></clade></phylogeny></phyloxml>',
    {trim: true, normalize: true})[0];
    var bp2 = forester.collectBasicTreeProperties(plain);
    if (bp2.geneRegions !== false || bp2.maxGeneRegionLength !== 0 || forester.geneRegionStats(plain).tips !== 0) {
        return fail('a plain tree', bp2.geneRegions);
    }
    // a gene-family tree whose tips each locate their ONE gene carries no
    // genome regions (though each tip has a region of one, for the dialogs)
    var family = px.parse('<phyloxml xmlns="http://www.phyloxml.org"><phylogeny rooted="true"><clade>'
        + '<clade><name>a</name><sequence><name>p</name><location>chr1:10-20(+)</location></sequence></clade>'
        + '<clade><name>b</name><sequence><name>q</name><location>chr2:5-9(-)</location></sequence></clade>'
        + '</clade></phylogeny></phyloxml>', {trim: true, normalize: true})[0];
    var bp3 = forester.collectBasicTreeProperties(family);
    if (bp3.geneRegions !== false || forester.geneRegionStats(family).tips !== 2) {
        return fail('a gene-family tree', bp3.geneRegions);
    }
    return true;
}

// ---- families and the anchor -------------------------------------------

function testNamespacesAndAnchor() {
    var t = readFixture();
    var regions = regionsOf(t);
    var ns = forester.geneFamilyNamespaces(regions);
    // every drawn gene but Y carries fam (115); X and Y carry no plf (114)
    if (ns.length !== 2 || ns[0].ns !== 'fam' || ns[0].genes !== 115 || ns[1].ns !== 'plf' || ns[1].genes !== 114) {
        return fail('namespaces', ns);
    }
    var c = forester.geneAnchorCandidates(regions, 'fam');
    // F is single-copy in all eleven regions; every other core family misses
    // or doubles somewhere (A doubled in S12, B/C absent in S09, D deleted in
    // S07, E doubled in S11, G..K on the other contig in S10)
    if (c[0].family !== 'fam:F006' || c[0].single !== 11 || c[0].tips !== 11 || c[0].product !== 'Molecular chaperone'
        || c[0].symbol !== 'synF') {
        return fail('top candidate', c[0]);
    }
    var by = {};
    c.forEach(function (x) {
        by[x.family] = x;
    });
    // A: absent in S09 and doubled in S12 -> single in 9 of its 10 regions
    if (by['fam:F001'].single !== 9 || by['fam:F001'].tips !== 10 || by['fam:F005'].single !== 10 || by['fam:F005'].tips !== 11
        || by['fam:F004'].single !== 10 || by['fam:F004'].tips !== 10 || by['fam:F002'].single !== 10
        || by['fam:F007'].single !== 10 || by['fam:F007'].tips !== 10 || by['fam:F099'].single !== 1 || by['fam:F099'].tips !== 1) {
        return fail('candidate counts', by);
    }
    // the rest are tied at ten and sort by code unit; A (nine) and X (one) follow
    if (c[1].family !== 'fam:F002' || c[2].family !== 'fam:F003' || c[c.length - 2].family !== 'fam:F001'
        || c[c.length - 1].family !== 'fam:F099') {
        return fail('tie order', c.map(function (x) {
            return x.family;
        }));
    }
    if (forester.geneDefaultAnchor(regions, 'fam') !== 'fam:F006') {
        return fail('default anchor', forester.geneDefaultAnchor(regions, 'fam'));
    }
    // under plf, A and B share P001, so P005 (F) anchors
    if (forester.geneDefaultAnchor(regions, 'plf') !== 'plf:P005') {
        return fail('plf anchor', forester.geneDefaultAnchor(regions, 'plf'));
    }
    // no anchor when the best family is single-copy in under half the regions
    var few = regions.map(function (r) {
        return r && r.genes.some(function (g) {
            return g.symbol === 'intX';
        }) ? r : null;
    });
    if (forester.geneDefaultAnchor(few, 'fam') !== 'fam:F001') {   // one region: every family is single there
        return fail('one region anchors on its first family', forester.geneDefaultAnchor(few, 'fam'));
    }
    if (forester.geneDefaultAnchor([null, null], 'fam') !== null || forester.geneDefaultAnchor([], 'fam') !== null
        || forester.geneDefaultAnchor(regions, 'nothing') !== null) {
        return fail('nothing to anchor on', null);
    }
    return true;
}

// ---- the rows ------------------------------------------------------------

// Anchored on F: S01's midpoint 7000.5 goes to 0, its backbone (span padded
// by 2% = 240, inside the record) runs -6239.5 .. 6239.5; S06 is the same
// region on the minus strand and, flipped, lands on exactly S01's numbers.
function testRowsAnchored() {
    var t = readFixture();
    var all = tips(t);
    var regions = regionsOf(t);
    var res = forester.geneTrackRows(regions, 'fam:F006', 'fam');
    var idx = function (nn) {
        return all.findIndex(function (n) {
            return n.name === 'Synthobacter sp. S' + nn;
        });
    };
    // the parser hands the tips back last-first, so rows are found by name
    if (res.rows.length !== 12 || res.rows[idx('04')] !== null || res.rows[idx('01')] === null) {
        return fail('rows', res.rows.length);
    }
    var s01 = res.rows[idx('01')];
    if (!s01.anchored || s01.flip || s01.lanes !== 1 || s01.capLeft || s01.capRight
        || !near(s01.backbone.x0, -6239.5) || !near(s01.backbone.x1, 6239.5)) {
        return fail('S01 row', s01);
    }
    var a = s01.genes[0];
    var f = s01.genes[5];
    var k = s01.genes[10];
    if (a.gene.symbol !== 'synA' || !near(a.x0, -5999.5) || !near(a.x1, -5000.5) || a.dir !== 1 || a.lane !== 0
        || !near(f.x0, -499.5) || !near(f.x1, 499.5) || !near(k.x0, 5000.5) || !near(k.x1, 5999.5)) {
        return fail('S01 genes', [a, f, k]);
    }
    var s06 = res.rows[idx('06')];
    if (!s06.anchored || !s06.flip || !near(s06.backbone.x0, -6239.5) || !near(s06.backbone.x1, 6239.5)) {
        return fail('S06 row', s06);
    }
    for (var i = 0; i < 11; ++i) {
        var p = s01.genes[i];
        var q = s06.genes[i];
        if (p.gene.symbol !== q.gene.symbol || !near(p.x0, q.x0) || !near(p.x1, q.x1) || p.dir !== q.dir) {
            return fail('S06 flipped is S01: gene ' + i, [p, q]);
        }
    }
    // S03: B on the minus strand, the row itself not flipped
    var s03 = res.rows[idx('03')];
    if (s03.flip || s03.genes[1].dir !== -1 || s03.genes[0].dir !== 1) {
        return fail('S03 strands', s03.genes.map(function (g) {
            return g.dir;
        }));
    }
    // S05: the inverted block E D C between B and F, pointing left
    var s05 = res.rows[idx('05')];
    var order = s05.genes.map(function (g) {
        return g.gene.symbol + (g.dir > 0 ? '>' : '<');
    }).join(' ');
    if (order !== 'synA> synB> synE< synD< synC< synF> synG> synH> synI> synJ> synK>') {
        return fail('S05 order', order);
    }
    // S07: D deleted and no record -- padded by 2% of its own 10900 span
    var s07 = res.rows[idx('07')];
    if (!s07.anchored || s07.capLeft || s07.capRight || !near(s07.backbone.x0, -5117.5) || !near(s07.backbone.x1, 6217.5)) {
        return fail('S07 row', s07);
    }
    // S09: the record ends where the genes do: both caps, the backbone
    // clamped to 1 .. 8700 around F's midpoint 2700.5
    var s09 = res.rows[idx('09')];
    if (!s09.capLeft || !s09.capRight || !near(s09.backbone.x0, -2699.5) || !near(s09.backbone.x1, 5999.5)) {
        return fail('S09 row', s09);
    }
    // S11: the second E overlaps F and takes the second lane; G is back in the first
    var s11 = res.rows[idx('11')];
    var lanes = s11.genes.map(function (g) {
        return g.gene.symbol + g.lane;
    }).join(' ');
    if (s11.lanes !== 2 || lanes !== 'synA0 synB0 synC0 synD0 synE0 synF0 synE1 synG0 synH0 synI0 synJ0 synK0') {
        return fail('S11 lanes', lanes);
    }
    // the extent: S08's backbone reaches furthest left (its F sits late, at
    // 8100.5, after the two insertions), S12's furthest right
    if (!near(res.extent.min, -7361.5) || !near(res.extent.max, 7361.5)) {
        return fail('extent', res.extent);
    }
    var s08 = res.rows[idx('08')];
    if (!near(s08.backbone.x0, -7361.5) || !near(s08.backbone.x1, 6261.5)) {
        return fail('S08 row', s08.backbone);
    }
    var s12 = res.rows[idx('12')];
    if (!s12.anchored || !near(s12.backbone.x0, -6261.5) || !near(s12.backbone.x1, 7361.5)) {
        return fail('S12 row', s12.backbone);
    }
    return true;
}

// Anchored on A: S12 has two and S09 none, so both are left-aligned at the
// anchored rows' left edge; and with no anchor every row starts at 0.
function testRowsUnanchored() {
    var t = readFixture();
    var all = tips(t);
    var regions = regionsOf(t);
    var idx = function (nn) {
        return all.findIndex(function (n) {
            return n.name === 'Synthobacter sp. S' + nn;
        });
    };
    var res = forester.geneTrackRows(regions, 'fam:F001', 'fam');
    var s01 = res.rows[idx('01')];
    // A's midpoint 1500.5 at 0: the backbone 761 .. 13240 becomes -739.5 .. 11739.5
    if (!s01.anchored || !near(s01.backbone.x0, -739.5) || !near(s01.backbone.x1, 11739.5)) {
        return fail('S01 on A', s01.backbone);
    }
    var s12 = res.rows[idx('12')];
    var s09 = res.rows[idx('09')];
    if (s12.anchored || s09.anchored || s12.flip || s09.flip) {
        return fail('S12 / S09 should be unanchored', [s12.anchored, s09.anchored]);
    }
    // the left edge is the leftmost anchored backbone: S08's, whose span
    // (1001..14100, pad 262) starts at 739 -> 739 - 1500.5 = -761.5; S06
    // flipped lands on S01's -739.5
    if (!near(res.extent.min, -761.5) || !near(res.rows[idx('06')].backbone.x0, -739.5)) {
        return fail('extent left', res.extent);
    }
    if (!near(s12.backbone.x0, -761.5) || !near(s09.backbone.x0, -761.5)) {
        return fail('left-aligned rows', [s12.backbone, s09.backbone]);
    }
    // S09 is 1..8700 with both caps: -761.5 .. 7937.5
    if (!near(s09.backbone.x1, 7937.5) || !s09.capLeft || !s09.capRight) {
        return fail('S09 left-aligned', s09);
    }
    // S12's first A at 1001 sits its pad (262) past the edge: -761.5 + 262 = -499.5
    if (!near(s12.genes[0].x0, -499.5) || s12.genes[0].gene.symbol !== 'synA' || s12.genes[11].gene.symbol !== 'synA') {
        return fail('S12 genes', s12.genes[0]);
    }
    // no anchor at all: every backbone starts at 0
    var none = forester.geneTrackRows(regions, null, 'fam');
    var starts = none.rows.filter(Boolean).map(function (r) {
        return r.backbone.x0;
    });
    if (starts.length !== 11 || !starts.every(function (x) {
        return near(x, 0);
    }) || none.rows.some(function (r) {
        return r && (r.anchored || r.flip);
    })) {
        return fail('no anchor', starts);
    }
    if (!near(none.extent.min, 0) || !near(none.extent.max, 13623)) {   // S08 / S12: 739 .. 14362
        return fail('no-anchor extent', none.extent);
    }
    // an anchor the tree has not got behaves as none
    var gone = forester.geneTrackRows(regions, 'fam:F777', 'fam');
    if (gone.rows.filter(Boolean).some(function (r) {
        return r.anchored || !near(r.backbone.x0, 0);
    })) {
        return fail('unknown anchor', null);
    }
    // nothing in, nothing out
    var empty = forester.geneTrackRows([null, null], 'fam:F006', 'fam');
    if (empty.rows.length !== 2 || empty.rows[0] !== null || empty.extent !== null) {
        return fail('empty', empty);
    }
    return true;
}

// ---- pixels --------------------------------------------------------------

function testGeometryAndArrows() {
    var t = readFixture();
    var regions = regionsOf(t);
    var res = forester.geneTrackRows(regions, 'fam:F006', 'fam');
    var s01 = res.rows[tips(t).findIndex(function (n) {
        return n.name === 'Synthobacter sp. S01';
    })];
    // start 100, 0.01 px per bp, the extent's left edge -7361.5
    var g = forester.geneRowGeometry(s01, 100, 0.01, res.extent.min);
    if (!near(g.backbone.x, 111.22, 1e-6) || !near(g.backbone.w, 124.79, 1e-6) || g.capLeft || g.capRight) {
        return fail('S01 backbone px', g.backbone);
    }
    if (!near(g.genes[0].x, 113.62, 1e-6) || !near(g.genes[0].w, 9.99, 1e-6) || g.genes[0].dir !== 1
        || g.genes[0].gene.symbol !== 'synA' || g.genes[0].lane !== 0) {
        return fail('S01 gene A px', g.genes[0]);
    }
    var p = forester.geneArrowPath;
    if (p(0, 0, 10, 8, 1) !== 'M0,0h6l4,4l-4,4h-6Z') {
        return fail('arrow right', p(0, 0, 10, 8, 1));
    }
    if (p(0, 0, 10, 8, -1) !== 'M10,0h-6l-4,4l4,4h6Z') {
        return fail('arrow left', p(0, 0, 10, 8, -1));
    }
    // shorter than its head: a triangle
    if (p(0, 0, 2, 8, 1) !== 'M0,0l2,4l-2,4Z' || p(0, 0, 2, 8, -1) !== 'M2,0l-2,4l2,4Z') {
        return fail('triangles', [p(0, 0, 2, 8, 1), p(0, 0, 2, 8, -1)]);
    }
    if (p(1.234, 5.678, 10, 8, 1) !== 'M1.23,5.68h6l4,4l-4,4h-6Z') {
        return fail('hundredths', p(1.234, 5.678, 10, 8, 1));
    }
    if (p(0, 0, 0, 8, 1) !== '' || p(0, 0, 10, 0, 1) !== '' || p(NaN, 0, 10, 8, 1) !== '' || p(0, 0, Infinity, 8, 1) !== '') {
        return fail('degenerate', null);
    }
    var bar = forester.geneScaleBar(0.01, 80);
    if (!bar || bar.bp !== 10000 || !near(bar.px, 100) || bar.label !== '10 kb') {
        return fail('10 kb bar', bar);
    }
    var small = forester.geneScaleBar(0.5, 80);
    if (!small || small.bp !== 200 || !near(small.px, 100) || small.label !== '200 bp') {
        return fail('200 bp bar', small);
    }
    if (forester.geneScaleBar(0.0015, 80).label !== '50 kb' || forester.geneScaleBar(0, 80) !== null) {
        return fail('bars', forester.geneScaleBar(0.0015, 80));
    }
    return true;
}

// ---- families, legend, links -------------------------------------------

function testSummaryAndLinks() {
    var t = readFixture();
    var regions = regionsOf(t);
    var s = forester.geneFamilySummary(regions, 'fam');
    // the eleven core families are shared; X's F099 is in one region only, Y has none
    if (s.names.join(' ') !== 'fam:F001 fam:F002 fam:F003 fam:F004 fam:F005 fam:F006 fam:F007 fam:F008 fam:F009 fam:F010 fam:F011'
        || s.singletons !== 1 || s.unfamilied !== 1) {
        return fail('names', s);
    }
    if (s.legend.length !== 11 || s.legend[0].family !== 'fam:F001' || s.legend[0].tips !== 10 || s.legend[0].genes !== 11
        || s.legend[0].product !== 'Replication initiation protein' || s.legend[0].symbol !== 'synA'
        || s.legend[4].family !== 'fam:F005' || s.legend[4].genes !== 12 || s.legend[4].tips !== 11
        || s.legend[5].genes !== 11 || s.legend[3].tips !== 10 || s.legend[6].tips !== 10) {
        return fail('legend rows', s.legend);
    }
    // the rows follow the regions' order: over S12 first, A is still first;
    // over S06 alone (K first by position) K leads
    var s06 = regions.filter(function (r) {
        return r && r.genes[0].symbol === 'synK';
    });
    var only = forester.geneFamilySummary(s06.concat(s06), 'fam');   // twice, so the families are "shared"
    if (only.legend[0].family !== 'fam:F011' || only.names[0] !== 'fam:F001') {
        return fail('order', only.legend[0]);
    }
    // with the tree's shared set given, a view of ONE region keeps its
    // families coloured (all eleven shared), while X stays a singleton and
    // a family not in the set is one too
    var one = regions.filter(function (r) {
        return r && r.genes.some(function (g) {
            return g.symbol === 'intX';
        });
    });
    var view = forester.geneFamilySummary(one, 'fam', new Set(s.names.filter(function (n) {
        return n !== 'fam:F011';
    })));
    if (view.names.length !== 10 || view.legend.length !== 10 || view.singletons !== 2 || view.unfamilied !== 1
        || view.legend.some(function (r) {
            return r.tips !== 1;
        })) {
        return fail('view with the tree\'s shared set', view);
    }
    // plf: A and B share P001
    var pl = forester.geneFamilySummary(regions, 'plf');
    if (pl.names.length !== 10 || pl.legend[0].family !== 'plf:P001' || pl.legend[0].genes !== 21 || pl.unfamilied !== 2) {
        return fail('plf summary', pl.legend[0]);
    }
    var r = forester.geneRegionOf(tipByName(t, 'Synthobacter sp. S01'));
    var ref = forester.geneReference(r.genes[0]);
    if (!ref || ref.url !== 'https://www.bv-brc.org/view/Feature/fig|1000.1.peg.1' || ref.site !== 'BV-BRC') {
        return fail('BV-BRC link', ref);
    }
    var r2 = forester.geneRegionOf(tipByName(t, 'Synthobacter sp. S02'));
    var ref2 = forester.geneReference(r2.genes[0]);
    if (!ref2 || ref2.url !== 'https://www.ncbi.nlm.nih.gov/protein/WP_100002001.1' || ref2.site !== 'NCBI') {
        return fail('NCBI link', ref2);
    }
    if (forester.geneReference({accession: null}) !== null || forester.geneReference(null) !== null
        || forester.geneReference({accession: {source: 'mine', value: 'g1'}}) !== null
        || forester.geneReference({accession: {source: '', value: 'fig|1.2.peg.3'}}).site !== 'BV-BRC'
        || forester.geneReference({accession: {source: 'PATRIC', value: 'x y'}}).url !== 'https://www.bv-brc.org/view/Feature/x%20y') {
        return fail('other links', null);
    }
    return true;
}

// ---- the file round trip --------------------------------------------------

// The phyloXML writer already writes every field a gene uses (type,
// accession, symbol, name, location, annotations) -- so a file saved from
// the viewer carries its regions, and reading the saved file gives the same
// regions. Compared as regions, not as text: the desktop's layout rules
// (phyloxml 1.1.4+) are what the text follows.
function testRoundTrip() {
    var t = readFixture();
    var back = px.parse(px.toPhyloXML(t, 9), {trim: true, normalize: true})[0];
    var a = regionsOf(t);
    var b = regionsOf(back);
    if (a.length !== b.length) {
        return fail('tip count', [a.length, b.length]);
    }
    for (var i = 0; i < a.length; ++i) {
        if ((a[i] === null) !== (b[i] === null)) {
            return fail('region ' + i + ' lost or gained', null);
        }
        if (a[i] === null) {
            continue;
        }
        var strip = function (r) {
            return JSON.stringify({c: r.contig, rec: r.record, span: r.span, o: r.otherContigs, g: r.genes.map(function (g) {
                return [g.symbol, g.product, g.start, g.end, g.strand, g.refs, g.accession];
            })});
        };
        if (strip(a[i]) !== strip(b[i])) {
            return fail('region ' + i + ' differs', [strip(a[i]), strip(b[i])]);
        }
    }
    var sa = forester.geneRegionStats(t);
    var sb = forester.geneRegionStats(back);
    if (JSON.stringify(sa) !== JSON.stringify(sb)) {
        return fail('stats differ', [sa, sb]);
    }
    return true;
}

console.log('gene track (genome regions)');
runTest('the location grammar        : ', testLocationGrammar);
runTest('fixture and its demo copy   : ', testFixtureCopies);
runTest('the canonical region        : ', testRegionCanonical);
runTest('order, contigs, ignored     : ', testRegionRules);
runTest('namespaces and the anchor   : ', testNamespacesAndAnchor);
runTest('rows anchored on F          : ', testRowsAnchored);
runTest('rows unanchored and on A    : ', testRowsUnanchored);
runTest('pixels, arrows, the kb bar  : ', testGeometryAndArrows);
runTest('families, legend, links     : ', testSummaryAndLinks);
runTest('the file round trip         : ', testRoundTrip);

if (_testFailures > 0) {
    console.log('\n' + _testFailures + ' test(s) FAILED');
    process.exit(1);
} else {
    console.log('\nAll tests passed');
}
