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

// Tests for the pure half of the protein domain architecture display in
// forester.js: which domains a threshold admits, the palette and its
// assignment, the legend rows, and where each box sits along the backbone.
//
// The numbers are the desktop's: section 10 of the rendering spec (repo
// TODO.md, section D1) was computed by RUNNING desktop Archaeopteryx's own
// classes on apaf.xml, and the 22_MOUSE geometry was re-issued from its
// 416c705b after the joint decision to place a domain at (from - 1) f. So a
// failure here is a divergence between the two programs, not a typo.

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

function readTree(name) {
    var text = fs.readFileSync(pth.join(__dirname, 'data', 'phyloxml_trees', name), 'utf8');
    return px.parse(text, {trim: true, normalize: true})[0];
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

function near(a, b, eps) {
    return Math.abs(a - b) <= eps;
}

// apaf.xml: 31 tips, every one with an architecture; Lmax = 2080 on 3_BRAFL;
// 202 domains, none malformed. The docs/data copy is byte-identical.
function testApafFacts() {
    var t = readTree('apaf.xml');
    var s = forester.domainArchitectureStats(t);
    if (s.tips !== 31 || s.maxLength !== 2080 || s.domains !== 202 || s.ignored !== 0) {
        console.log('    stats: ' + JSON.stringify(s));
        return false;
    }
    var p = forester.collectBasicTreeProperties(t);
    if (p.domainArchitectures !== true || p.maxDomainArchitectureLength !== 2080) {
        console.log('    tree properties: ' + p.domainArchitectures + ' / ' + p.maxDomainArchitectureLength);
        return false;
    }
    var longest = tipByName(t, '3_BRAFL');
    if (!longest || Number(forester.domainArchitectureOf(longest).length) !== 2080) {
        return false;
    }
    var docsCopy = fs.readFileSync(pth.join(__dirname, '..', 'docs', 'data', 'apaf.xml'));
    var testCopy = fs.readFileSync(pth.join(__dirname, 'data', 'phyloxml_trees', 'apaf.xml'));
    return docsCopy.equals(testCopy);
}

// Threshold exponent -> distinct names drawn / boxes drawn (spec section 10)
function testThresholdTable() {
    var t = readTree('apaf.xml');
    var table = {
        '-10': [6, 56], '-9': [6, 69], '-8': [6, 81], '-7': [6, 105], '-6': [6, 118], '-5': [6, 138],
        '-4': [7, 150], '-3': [9, 166], '-2': [10, 177], '-1': [10, 181], '0': [13, 193],
        '1': [17, 202], '2': [17, 202], '3': [17, 202]
    };
    var bad = [];
    Object.keys(table).forEach(function (k) {
        var s = forester.domainSummary(t, Number(k));
        if (s.names.length !== table[k][0] || s.boxes !== table[k][1]) {
            bad.push('exp ' + k + ': ' + s.names.length + ' names / ' + s.boxes + ' boxes, want ' + table[k].join(' / '));
        }
    });
    if (bad.length) {
        bad.forEach(function (b) { console.log('    ' + b); });
        return false;
    }
    if (forester.DOMAIN_EVALUE_EXPONENT_DEFAULT !== -3 || forester.DOMAIN_EVALUE_EXPONENT_MIN !== -20
        || forester.DOMAIN_EVALUE_EXPONENT_MAX !== 3) {
        return false;
    }
    return true;
}

// The palette at the default threshold: the drawn names sorted by code unit
// (DED before Death) take Tableau 10 in order.
function testPaletteAtDefault() {
    var t = readTree('apaf.xml');
    var s = forester.domainSummary(t, forester.DOMAIN_EVALUE_EXPONENT_DEFAULT);
    var want = [['CARD', '#4e79a7'], ['Collagen', '#f28e2b'], ['DED', '#e15759'], ['Death', '#76b7b2'],
        ['NB-ARC', '#59a14f'], ['RVT_1', '#edc948'], ['TPR_1', '#b07aa1'], ['TPR_2', '#ff9da7'], ['WD40', '#9c755f']];
    if (s.names.length !== want.length) {
        console.log('    names: ' + s.names.join(', '));
        return false;
    }
    for (var i = 0; i < want.length; ++i) {
        var c = forester.domainQualitativeColor(i).toLowerCase();
        if (s.names[i] !== want[i][0] || c !== want[i][1]) {
            console.log('    ' + i + ': ' + s.names[i] + ' ' + c + ', want ' + want[i].join(' '));
            return false;
        }
    }
    return true;
}

// The legend at the default threshold: rows in first-appearance order over
// the tips AS DISPLAYED, domains in from order, each counting its drawn
// boxes. The viewer shows the largest-first ladderized tree top to bottom,
// which is the reverse of its preorder (the parser stores children
// last-first); in that order the rows come out exactly as the desktop's,
// 22_MOUSE leading. Walked in data order they would not, so the summary
// takes the tips in the order the caller shows them.
function testLegendRows() {
    var t = readTree('apaf.xml');
    forester.ladderize(t, true);
    var displayed = forester.getAllExternalNodes(t).reverse();
    if (displayed[0].name !== '22_MOUSE' || displayed[1].name !== 'Apaf-1_HUMAN') {
        console.log('    display order starts ' + displayed[0].name + ', ' + displayed[1].name);
        return false;
    }
    var s = forester.domainSummary(displayed, -3);
    var want = 'CARD (16), NB-ARC (28), WD40 (110), Death (5), DED (2), TPR_2 (2), RVT_1 (1), TPR_1 (1), Collagen (1)';
    var got = s.legend.map(function (r) { return r.name + ' (' + r.count + ')'; }).join(', ');
    if (got !== want) {
        console.log('    ' + got);
        return false;
    }
    // walked in data order instead, the same rows in another order --
    // first appearance is first appearance in whatever order is given
    var raw = forester.domainSummary(t, -3);
    var rawNames = raw.legend.map(function (r) { return r.name; });
    var seen = [];
    forester.preOrderTraversalAll(t, function (n) {
        if (n.children) { return; }
        n.sequences[0].domain_architecture.domains.slice().sort(function (a, b) { return a.from - b.from; }).forEach(function (d) {
            if (d.confidence <= 0.001 && d.name && seen.indexOf(d.name) < 0) { seen.push(d.name); }
        });
    });
    if (rawNames.join() !== seen.join() || rawNames.slice().sort().join() !== s.names.join()) {
        console.log('    data order ' + rawNames.join() + ' vs walk ' + seen.join());
        return false;
    }
    return s.unnamed === 0 && raw.boxes === s.boxes;
}

// 22_MOUSE at a 1200 px viewport: W = 300, f = 300 / 2080 x 0.9. The
// offsets are the desktop's re-issued numbers at 416c705b, placement at
// (from - 1) f; the WD40 at E 0.3 is not drawn at 1e-3 but is at 1e0.
function testGeometry22Mouse() {
    var t = readTree('apaf.xml');
    var da = forester.domainArchitectureOf(tipByName(t, '22_MOUSE'));
    var f = (300 / 2080) * 0.9;
    if (!near(f, 0.129808, 0.000001) || Number(da.length) !== 1249) {
        return false;
    }
    var geo = forester.domainBoxes(da, 0, f, -3);
    if (!near(geo.backbone.w, 162.13, 0.01) || geo.backbone.x !== 0) {
        console.log('    backbone ' + geo.backbone.w);
        return false;
    }
    var want = [['CARD', 0.65, 11.03], ['NB-ARC', 14.02, 39.72], ['WD40', 78.40, 5.06], ['WD40', 83.86, 5.06],
        ['WD40', 89.31, 5.32], ['WD40', 95.02, 5.06], ['WD40', 113.06, 5.06], ['WD40', 128.77, 5.06],
        ['WD40', 139.41, 5.06], ['WD40', 144.87, 5.06]];
    if (geo.boxes.length !== want.length) {
        console.log('    ' + geo.boxes.length + ' boxes drawn, want ' + want.length);
        return false;
    }
    for (var i = 0; i < want.length; ++i) {
        var b = geo.boxes[i];
        if (b.name !== want[i][0] || !near(b.x, want[i][1], 0.006) || !near(b.w, want[i][2], 0.006)) {
            console.log('    ' + i + ': ' + b.name + ' ' + b.x.toFixed(3) + ' / ' + b.w.toFixed(3) + ', want ' + want[i].join(' / '));
            return false;
        }
    }
    var all = forester.domainArchitectureDomains(da).domains;
    if (all.length !== 11 || all[10].from !== 1168 || all[10].to !== 1204 || all[10].evalue !== 0.3) {
        return false;
    }
    return forester.domainBoxes(da, 0, f, 0).boxes.length === 11;
}

// Residue r covers [(r-1) f, r f]: a domain 1..L is exactly the backbone,
// residues 1-2 are [start, start + 2f], adjacent domains meet, a domain
// ending at L ends where the backbone ends. Decided with the desktop
// 2026-09-12. (A one-residue domain, to = from, is malformed by the spec's
// to <= from rule and never drawn.)
function testResidueCoverage() {
    var da = {length: 100, domains: [
        {name: 'A', from: 1, to: 100, confidence: 1e-5}, {name: 'B', from: 1, to: 2, confidence: 1e-5},
        {name: 'C', from: 50, to: 60, confidence: 1e-5}, {name: 'D', from: 61, to: 100, confidence: 1e-5},
        {name: 'one', from: 7, to: 7, confidence: 1e-5}
    ]};
    var geo = forester.domainBoxes(da, 100, 2, -3);
    if (geo.backbone.x !== 100 || geo.backbone.w !== 200 || geo.boxes.length !== 4) {
        console.log('    ' + geo.boxes.length + ' boxes');
        return false;
    }
    var a = geo.boxes[0], b = geo.boxes[1], c = geo.boxes[2], d = geo.boxes[3];
    return a.name === 'A' && a.x === 100 && a.w === 200
        && b.name === 'B' && b.x === 100 && b.w === 4
        && near(c.x + c.w, d.x, 1e-9)
        && near(d.x + d.w, geo.backbone.x + geo.backbone.w, 1e-9);
}

// A malformed domain is skipped and counted, never fatal; an architecture
// without a usable length is no architecture at all.
function testMalformedSkipped() {
    var da = {length: 50, domains: [
        {name: 'ok', from: 1, to: 10, confidence: 0.01},
        {name: 'backwards', from: 20, to: 10, confidence: 0.01},
        {name: 'empty', from: 5, to: 5, confidence: 0.01},
        {name: 'no from', from: null, to: 9, confidence: 0.01},
        {name: 'no E-value', from: 1, to: 9, confidence: null},
        {name: 'fractional', from: 1.5, to: 9, confidence: 0.01}
    ]};
    var dd = forester.domainArchitectureDomains(da);
    if (dd.domains.length !== 1 || dd.domains[0].name !== 'ok' || dd.ignored !== 5) {
        console.log('    kept ' + dd.domains.length + ', ignored ' + dd.ignored);
        return false;
    }
    var node = {sequences: [{domain_architecture: {domains: [{from: 1, to: 2, confidence: 0.1}]}}]};
    if (forester.domainArchitectureOf(node) !== null) { return false; }
    node.sequences[0].domain_architecture.length = 0;
    if (forester.domainArchitectureOf(node) !== null) { return false; }
    node.sequences[0].domain_architecture.length = 30;
    if (forester.domainArchitectureOf(node) === null) { return false; }
    // a tip without sequences, and a tip whose sequence has no architecture
    if (forester.domainArchitectureOf({}) !== null || forester.domainArchitectureOf({sequences: [{name: 'x'}]}) !== null) {
        return false;
    }
    var stats = forester.domainArchitectureStats({children: [{name: 'a', sequences: [{domain_architecture: da}]}, {name: 'b'}]});
    return stats.tips === 1 && stats.maxLength === 50 && stats.domains === 1 && stats.ignored === 5;
}

// The summary over a small tree: first-appearance order, unnamed boxes
// counted but never a row, a domain over the threshold not counted, the
// sorted names for the palette.
function testSummaryOrder() {
    var phy = forester.parseNewHampshire('((a,b),c);', true, false);
    // in traversal order -- the parser stores children last-first, so the
    // first tip walked is c -- as the legend walks them
    var tips = [];
    forester.preOrderTraversalAll(phy, function (n) { if (!n.children) { tips.push(n); } });
    tips[0].sequences = [{domain_architecture: {length: 20, domains: [
        {name: 'Y', from: 6, to: 9, confidence: 1e-4}, {name: 'X', from: 1, to: 5, confidence: 1e-4}   // file order Y, X; from order X, Y
    ]}}];
    tips[1].sequences = [{domain_architecture: {length: 20, domains: [
        {name: 'Y', from: 1, to: 5, confidence: 1e-4}, {name: '', from: 6, to: 9, confidence: 1e-4},
        {name: 'Z', from: 10, to: 15, confidence: 0.5}
    ]}}];
    var s = forester.domainSummary(phy, -3);
    var legend = s.legend.map(function (r) { return r.name + ':' + r.count; }).join(',');
    if (legend !== 'X:1,Y:2' || s.boxes !== 4 || s.unnamed !== 1 || s.names.join() !== 'X,Y') {
        console.log('    ' + legend + ' boxes=' + s.boxes + ' unnamed=' + s.unnamed + ' names=' + s.names.join());
        return false;
    }
    var loose = forester.domainSummary(phy, 0);
    return loose.names.join() === 'X,Y,Z' && loose.boxes === 5 && loose.legend[2].name === 'Z';
}

// Colour arithmetic and the readout: cycles beyond ten, lighten / darken,
// the ink rule, the inclusive threshold, the superscript label.
function testColourMathAndReadout() {
    var q = forester.domainQualitativeColor;
    if (q(0).toLowerCase() !== '#4e79a7' || q(9).toLowerCase() !== '#bab0ac') { return false; }
    if (q(10).toLowerCase() !== '#7194b9') { console.log('    q(10) ' + q(10)); return false; }   // cycle 1: 0.2 toward white
    if (q(20).toLowerCase() !== '#2f4964') { console.log('    q(20) ' + q(20)); return false; }   // cycle 2: 0.4 toward black
    if (q(30).toLowerCase() !== '#afc3d7') { console.log('    q(30) ' + q(30)); return false; }   // cycle 3: capped at 0.55, white
    if (forester.domainLighten('#4E79A7', 0.12).toLowerCase() !== '#6389b2') { return false; }
    if (forester.domainDarken('#4E79A7', 0.10).toLowerCase() !== '#466d96') { return false; }
    if (forester.domainDarken('#4E79A7', 0.24).toLowerCase() !== '#3b5c7f') { return false; }
    if (forester.domainLabelInk('#EDC948') !== '#141a1d' || forester.domainLabelInk('#4E79A7') !== '#ffffff') { return false; }
    if (forester.DOMAIN_UNNAMED_COLOR !== '#808080') { return false; }
    // inclusive: E = 1e-3 is drawn at exponent -3, E = 1.1e-3 is not
    var da = {length: 10, domains: [{name: 'a', from: 1, to: 5, confidence: 0.001}, {name: 'b', from: 6, to: 10, confidence: 0.0011}]};
    if (forester.domainBoxes(da, 0, 1, -3).boxes.length !== 1 || forester.domainBoxes(da, 0, 1, -2).boxes.length !== 2) { return false; }
    var lbl = forester.domainEvalueLabel;
    return lbl(-3) === '10⁻³' && lbl(0) === '10⁰' && lbl(3) === '10³' && lbl(-20) === '10⁻²⁰' && lbl(-10) === '10⁻¹⁰';
}

console.log("\nprotein domain architectures\n");

runTest("apaf.xml facts             : ", testApafFacts);
runTest("threshold table            : ", testThresholdTable);
runTest("palette at default         : ", testPaletteAtDefault);
runTest("legend rows                : ", testLegendRows);
runTest("22_MOUSE geometry          : ", testGeometry22Mouse);
runTest("residue coverage           : ", testResidueCoverage);
runTest("malformed domains skipped  : ", testMalformedSkipped);
runTest("summary order              : ", testSummaryOrder);
runTest("colour math and readout    : ", testColourMathAndReadout);

if (_testFailures > 0) {
    console.log("\n" + _testFailures + " test(s) FAILED");
    process.exit(1);
} else {
    console.log("\nAll tests passed");
}
