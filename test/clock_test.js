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

// Tests for the pure half of the clock plot in forester.js: which trees have
// one (forester.clockPlotKind), its points and its line (forester.
// clockPlotData, forester.clockRegression), and the month ticks of a short
// calendar span (forester.calendarTickMonths).
//
// Every expected number was computed BY HAND from the five tips below, not
// read off the code:
//
//   tip   date   divergence
//   A     2000   0.001
//   B     2001   0.003
//   C     2002   0.002
//   D     2003   0.006
//   E     2004   0.005
//
//   means 2002 and 0.0034; Sxx = 10, Sxy = 0.011, Syy = 17.2e-6
//   slope 0.0011, intercept 0.0034 - 0.0011 x 2002 = -2.1988
//   R2 = 0.011^2 / (10 x 17.2e-6) = 121 / 172
//   the line reaches the root's divergence (0) at 2.1988 / 0.0011 = 1998.9090...
//
// and for the clade of C, D and E (its root Y: 2000.5, 0.001):
//
//   means 2003 and 0.013 / 3; Sxx = 2, Sxy = 0.003, Syy = 26e-6 / 3
//   slope 0.0015, intercept 0.013 / 3 - 0.0015 x 2003
//   R2 = 0.003^2 / (2 x 26e-6 / 3) = 27 / 52
//   the line reaches Y's divergence (0.001) at 2000 + 7 / 9

"use strict";

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

function fail(what, got) {
    console.log('    ' + what + (got === undefined ? '' : ': ' + JSON.stringify(got)));
    return false;
}

function close(a, b, rel) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        return false;
    }
    return Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * (rel || 1e-9);
}

function tip(name, date, div) {
    return {name: name, node_attrs: {num_date: {value: date}, div: div}};
}

// a date of null is a node the build does not date
function inner(name, date, div, children) {
    var attrs = {div: div};
    if (date !== null) {
        attrs.num_date = {value: date};
    }
    return {name: name, node_attrs: attrs, children: children};
}

// An Auspice build as the viewer loads it. `tips` overrides a tip's
// [date, div] (null takes the tip out); `ancestors` an internal node's.
function build(tips, ancestors) {
    var t = Object.assign({A: [2000, 0.001], B: [2001, 0.003], C: [2002, 0.002], D: [2003, 0.006], E: [2004, 0.005]}, tips || {});
    var a = Object.assign({ROOT: [1999, 0], X: [1999.5, 0.0005], Y: [2000.5, 0.001]}, ancestors || {});
    var kids = function (names) {
        return names.filter(function (n) { return t[n] !== null; }).map(function (n) { return tip(n, t[n][0], t[n][1]); });
    };
    var doc = {version: 'v2', meta: {title: 'clock'}, tree: inner('ROOT', a.ROOT[0], a.ROOT[1], [
        inner('X', a.X[0], a.X[1], kids(['A', 'B'])),
        inner('Y', a.Y[0], a.Y[1], kids(['C', 'D', 'E']))])};
    var phy = forester.parseAuspiceJson(JSON.stringify(doc));
    forester.captureDivergence(phy);
    forester.convertLoadedHeightsToDates([phy]);
    return phy;
}

function named(phy, name) {
    return forester.findByNodeName(forester.getTreeRoot(phy), name)[0];
}

// A BEAST clock-model tree stating HEIGHTS (ages: 0 at the youngest tip, 4 at
// the root) and one rate, 0.01, on every branch. Its tip names carry no
// dates, so the heights stay ages. A tip's divergence is 0.01 x (4 - its
// height): A 0.04, B 0.03, C 0.035, D 0.02 -- on the line div = 0.04 - 0.01 x
// age exactly.
function agesTree() {
    var t = forester.parseNexus('#NEXUS\nBegin trees;\ntree T = [&R] ((A[&rate=0.01,height=0]:2,B[&rate=0.01,height=1]:1)'
        + '[&rate=0.01,height=2]:2,(C[&rate=0.01,height=0.5]:2.5,D[&rate=0.01,height=2]:1)[&rate=0.01,height=3]:1)'
        + '[&height=4];\nEnd;\n')[0];
    forester.captureDivergence(t);
    forester.convertLoadedHeightsToDates([t]);
    return t;
}

// Kind 2 of the rule, TempEst's case: a tree whose branch lengths are its
// divergence and whose TIPS alone are dated (a num_date on each, as Auspice
// writes one; nothing on the ancestors). A tip's divergence is the sum of
// the lengths from the root:
//
//   tip   date   path from the root
//   A     2000   0.005 + 0.01 = 0.015
//   B     2001   0.005 + 0.03 = 0.035
//   C     2002   0.01 + 0.02 = 0.03
//   D     2003   0.01 + 0.06 = 0.07
//   E     2004   0.01 + 0.04 = 0.05
//
//   means 2002 and 0.04; Sxx = 10, Sxy = 0.105, Syy = 0.00175
//   slope 0.0105, intercept 0.04 - 0.0105 x 2002 = -20.981
//   R2 = 0.105^2 / (10 x 0.00175) = 0.63
//   the line reaches the root (0) at 20.981 / 0.0105 = 1998.190476...
//
// and for the clade Y = (C, D, E), itself 0.01 from the root:
//
//   means 2003 and 0.05; Sxx = 2, Sxy = 0.02, Syy = 0.0008
//   slope 0.01, intercept 0.05 - 0.01 x 2003 = -19.98; R2 = 0.0004 / 0.0016 = 0.25
//   the line reaches Y's divergence (0.01) at (19.98 + 0.01) / 0.01 = 1999
var ROOT_TO_TIP_NEXUS = '#NEXUS\nBegin trees;\ntree T = [&R] ((A[&num_date=2000]:0.01,B[&num_date=2001]:0.03)X:0.005,'
    + '(C[&num_date=2002]:0.02,D[&num_date=2003]:0.06,E[&num_date=2004]:0.04)Y:0.01);\nEnd;\n';

function rootToTipTree(nexus) {
    var t = forester.parseNexus(nexus || ROOT_TO_TIP_NEXUS)[0];
    forester.captureDivergence(t);
    forester.convertLoadedHeightsToDates([t]);
    return t;
}

function testRule() {
    var whole = build();
    if (!forester.hasTimeAndDivergence(whole) || forester.clockPlotKind(whole) !== 'divergence') {
        return fail('the build of five tips on five dates has a plot', forester.clockPlotKind(whole));
    }
    // every tip on one date: Time | Div is offered, the plot is not
    var same = build({A: [2003, 0.001], B: [2003, 0.003], C: [2003, 0.002], D: [2003, 0.006], E: [2003, 0.005]});
    if (!forester.hasTimeAndDivergence(same)) {
        return fail('control: the one-date build is still a tree with Time and Div');
    }
    if (forester.clockPlotKind(same) !== null || forester.clockPlotData(same) !== null) {
        return fail('every tip on one date: no plot', forester.clockPlotKind(same));
    }
    // ...and one tip off that date is enough
    var one = build({A: [2002, 0.001], B: [2003, 0.003], C: [2003, 0.002], D: [2003, 0.006], E: [2003, 0.005]});
    if (forester.clockPlotKind(one) !== 'divergence') {
        return fail('one tip on another date: a plot', forester.clockPlotKind(one));
    }
    // two tips, on two dates: Time | Div is offered, the plot is not
    var two = build({B: null, D: null, E: null});
    if (forester.getAllExternalNodes(forester.getTreeRoot(two)).length !== 2 || !forester.hasTimeAndDivergence(two)) {
        return fail('control: two tips, and still a tree with Time and Div');
    }
    if (forester.clockPlotKind(two) !== null) {
        return fail('two tips: no plot', forester.clockPlotKind(two));
    }
    var three = build({D: null, E: null});
    if (forester.getAllExternalNodes(forester.getTreeRoot(three)).length !== 3 || forester.clockPlotKind(three) !== 'divergence') {
        return fail('three tips: a plot', forester.clockPlotKind(three));
    }
    // a tree with no Time | Div has none, whatever else it has: the same
    // five tips on their five dates, under one ancestor the build left undated
    var gap = build(null, {X: [null, 0.0005]});
    if (forester.hasTimeAndDivergence(gap)) {
        return fail('control: one ancestor undated, and no Time | Div');
    }
    if (forester.clockPlotKind(gap) !== null || forester.clockPlotData(gap) !== null) {
        return fail('no Time | Div: no plot, whatever the tips state', forester.clockPlotKind(gap));
    }
    // a plain Newick tree: the years in its tip names date nothing
    var plain = forester.parseNewHampshire('((A_2000:1,B_2001:2):1,(C_2002:1,D_2003:3):2);');
    forester.captureDivergence(plain);
    if (forester.clockPlotKind(plain) !== null || forester.clockPlotData(plain) !== null) {
        return fail('a plain Newick tree: no plot');
    }
    if (forester.clockPlotKind(null) !== null) {
        return fail('no tree: no plot');
    }
    return true;
}

function testWholeTree() {
    var phy = build();
    var d = forester.clockPlotData(phy);
    if (!d || d.kind !== 'divergence' || d.forward !== true || d.unit !== 'year' || d.fromRates !== false) {
        return fail('what the plot is', d && [d.kind, d.forward, d.unit, d.fromRates]);
    }
    if (d.points.length !== 8) {
        return fail('a point per node: five tips and three ancestors', d.points.length);
    }
    var tips = d.points.filter(function (p) { return p.tip; });
    var got = tips.map(function (p) { return p.node.name + ' ' + p.date + ' ' + p.div; }).sort().join(', ');
    if (got !== 'A 2000 0.001, B 2001 0.003, C 2002 0.002, D 2003 0.006, E 2004 0.005') {
        return fail('the tips, each at its date and divergence', got);
    }
    var x = d.points.filter(function (p) { return p.node.name === 'X'; })[0];
    if (!x || x.tip !== false || x.date !== 1999.5 || x.div !== 0.0005) {
        return fail('an ancestor is a point too, and no tip', x && [x.tip, x.date, x.div]);
    }
    var f = d.fit;
    if (!f || f.n !== 5) {
        return fail('the line counts the five tips and nothing else', f && f.n);
    }
    if (!close(f.slope, 0.0011) || !close(f.intercept, -2.1988) || !close(f.r2, 121 / 172)) {
        return fail('slope 0.0011, intercept -2.1988, R2 121/172', [f.slope, f.intercept, f.r2]);
    }
    if (!close(f.rate, 0.0011) || !close(f.rootDate, 2.1988 / 0.0011)) {
        return fail('rate 0.0011; the root by the line at 1998.909', [f.rate, f.rootDate]);
    }
    if (d.root.node !== forester.getTreeRoot(phy) || d.root.date !== 1999 || d.root.div !== 0) {
        return fail('the root as the tree states it', [d.root.date, d.root.div]);
    }
    // each tip's distance off the line: -0.0002, 0.0007, -0.0014, 0.0015, -0.0006
    var want = {A: -0.0002, B: 0.0007, C: -0.0014, D: 0.0015, E: -0.0006};
    for (var i = 0; i < tips.length; ++i) {
        if (Math.abs(tips[i].residual - want[tips[i].node.name]) > 1e-12) {
            return fail('off the line, ' + tips[i].node.name, tips[i].residual);
        }
    }
    if (x.residual !== undefined) {
        return fail('an ancestor has no residual: it is not in the fit', x.residual);
    }
    return true;
}

// The ancestors' dates were inferred with a clock: moved anywhere, they must
// leave the line where it was.
function testAncestorsTakeNoPart() {
    var a = forester.clockPlotData(build()).fit;
    var b = forester.clockPlotData(build(null, {X: [1999.9, 0.0009], Y: [1999.2, 0.0001]})).fit;
    if (a.slope !== b.slope || a.intercept !== b.intercept || a.r2 !== b.r2 || a.n !== b.n) {
        return fail('the fit moved with the ancestors', [a, b]);
    }
    // ...while a tip moved does move it
    var c = forester.clockPlotData(build({E: [2004, 0.009]})).fit;
    if (c.slope === a.slope) {
        return fail('control: a tip moved, and the line did not');
    }
    return true;
}

function testClade() {
    var phy = build();
    var y = named(phy, 'Y');
    var d = forester.clockPlotData(phy, y);
    if (d.points.length !== 4 || d.root.node !== y || d.root.date !== 2000.5 || d.root.div !== 0.001) {
        return fail('the clade of Y: four points under its own root', [d.points.length, d.root.date, d.root.div]);
    }
    var f = d.fit;
    if (!f || f.n !== 3 || !close(f.slope, 0.0015) || !close(f.intercept, (0.013 / 3) - (0.0015 * 2003)) || !close(f.r2, 27 / 52)) {
        return fail('the clade\'s own line: slope 0.0015, R2 27/52', f && [f.n, f.slope, f.intercept, f.r2]);
    }
    // where the line reaches the CLADE's root divergence, not zero
    if (!close(f.rootDate, 2000 + (7 / 9))) {
        return fail('the clade\'s root by the line at 2000.777', f.rootDate);
    }
    // the viewer's holder of a clade -- a parentless wrapper -- is the clade
    var held = forester.clockPlotData(phy, {children: [y]});
    if (held.root.node !== y || held.points.length !== 4 || held.fit.slope !== f.slope) {
        return fail('a wrapper around the clade plots the clade', [held.points.length]);
    }
    // the tree itself is the whole tree
    if (forester.clockPlotData(phy, phy).points.length !== 8) {
        return fail('the tree as the view is the whole tree');
    }
    // a clade of two tips: its points, and no line -- the RULE was the tree's
    var x = forester.clockPlotData(phy, named(phy, 'X'));
    if (!x || x.points.length !== 3 || x.fit !== null) {
        return fail('a clade of two tips: three points and no line', x && [x.points.length, x.fit]);
    }
    return true;
}

function testAges() {
    var t = agesTree();
    if (!forester.hasTimeAndDivergence(t)) {
        return fail('control: the heights tree has Time and Div');
    }
    var d = forester.clockPlotData(t);
    if (!d || d.forward !== false || d.fromRates !== true || d.unit !== null) {
        return fail('ages, their divergence from the rates, no unit', d && [d.forward, d.fromRates, d.unit]);
    }
    var tips = d.points.filter(function (p) { return p.tip; })
        .map(function (p) { return p.node.name + ' ' + p.date + ' ' + Number(p.div.toPrecision(12)); }).sort().join(', ');
    if (tips !== 'A 0 0.04, B 1 0.03, C 0.5 0.035, D 2 0.02') {
        return fail('each tip at its age and at 0.01 x the time above it', tips);
    }
    var f = d.fit;
    // divergence FALLS as the age rises: the slope is negative and the rate is not
    if (!close(f.slope, -0.01) || !close(f.rate, 0.01) || !close(f.r2, 1)) {
        return fail('slope -0.01, rate +0.01, R2 1', [f.slope, f.rate, f.r2]);
    }
    if (!close(f.rootDate, 4) || d.root.date !== 4) {
        return fail('the root by the line at age 4, where the tree has it', [f.rootDate, d.root.date]);
    }
    return true;
}

// Divergence falling with time: a rate below zero is reported as it is, and
// there is no date at which such a line "started".
function testNoSignal() {
    var d = forester.clockPlotData(build({A: [2000, 0.006], B: [2001, 0.005], C: [2002, 0.004], D: [2003, 0.004], E: [2004, 0.003]}));
    if (!d.fit || !(d.fit.rate < 0) || d.fit.rootDate !== null) {
        return fail('a falling line: a negative rate and no root date', d.fit && [d.fit.rate, d.fit.rootDate]);
    }
    return true;
}

function testRegression() {
    if (forester.clockRegression([1, 2], [1, 2]) !== null) {
        return fail('two points make no line');
    }
    if (forester.clockRegression([5, 5, 5], [1, 2, 3]) !== null) {
        return fail('one date makes no line');
    }
    if (forester.clockRegression([1, 2, 3], [1, 2]) !== null) {
        return fail('as many dates as divergences');
    }
    var flat = forester.clockRegression([1, 2, 3], [7, 7, 7]);
    if (!flat || flat.slope !== 0 || flat.intercept !== 7 || flat.r2 !== null) {
        return fail('one divergence: a flat line and no R2', flat);
    }
    // 1, 3, 2 against 1, 2, 3: slope 1/2, intercept 1, R2 1/4
    var r = forester.clockRegression([1, 2, 3], [1, 3, 2]);
    if (!close(r.slope, 0.5) || !close(r.intercept, 1) || !close(r.r2, 0.25) || r.n !== 3 || r.meanX !== 2 || r.meanY !== 2) {
        return fail('slope 1/2, intercept 1, R2 1/4', r);
    }
    // dates a day apart in 2020: the sums of raw squares would keep three digits
    var xs = [2020.001, 2020.002, 2020.003, 2020.004];
    var ys = [0.0000010, 0.0000021, 0.0000029, 0.0000040];
    // about the means: dx -1.5e-3..1.5e-3, Sxx 5e-6, Sxy 4.9e-9 -> slope 9.8e-4
    var near = forester.clockRegression(xs, ys);
    if (!close(near.slope, 9.8e-4, 1e-7)) {
        return fail('slope 9.8e-4 from dates a day apart', near.slope);
    }
    return true;
}

function testMonthTicks() {
    var label = function (ticks) {
        return ticks.map(function (t) { return t.year + '-' + t.month; }).join(' ');
    };
    // 29 months: every sixth month is five ticks, every third would be ten
    var long = forester.calendarTickMonths(2019.95, 2022.4);
    if (label(long) !== '2020-1 2020-7 2021-1 2021-7 2022-1') {
        return fail('every sixth month over 29 months', label(long));
    }
    // 1 July is day 183 of a leap year and day 182 of any other
    if (long[0].value !== 2020 || !close(long[1].value, 2020 + (182 / 366)) || !close(long[3].value, 2021 + (181 / 365))) {
        return fail('a tick is where its month begins', long.map(function (t) { return t.value; }));
    }
    var short = forester.calendarTickMonths(2020, 2020.2);
    if (label(short) !== '2020-1 2020-2 2020-3' || !close(short[1].value, 2020 + (31 / 366)) || !close(short[2].value, 2020 + (60 / 366))) {
        return fail('every month over ten weeks', label(short));
    }
    // nine months begin in 2020.0 - 2020.7: every second is five ticks
    var two = forester.calendarTickMonths(2020, 2020.7);
    if (label(two) !== '2020-1 2020-3 2020-5 2020-7 2020-9') {
        return fail('every second month over eight months', label(two));
    }
    var year = forester.calendarTickMonths(2020.4, 2021.6);
    if (label(year) !== '2020-7 2020-10 2021-1 2021-4 2021-7') {
        return fail('every third month over 14 months', label(year));
    }
    if (forester.calendarTickMonths(2020, 2020).length !== 0 || forester.calendarTickMonths(2021, 2020).length !== 0
        || forester.calendarTickMonths(1900, 2000).length !== 0 || forester.calendarTickMonths(NaN, 2000).length !== 0) {
        return fail('no span, a backwards one, a century, no number: no ticks');
    }
    return true;
}

// Which trees are kind 2: dated tips, undated ancestors, a length on every
// branch, no clock rates -- and the line's own rule on top.
function testRootToTipRule() {
    var t = rootToTipTree();
    if (forester.hasTimeAndDivergence(t)) {
        return fail('control: the ancestors are undated, so no Time | Div');
    }
    if (forester.clockPlotKind(t) !== 'root-to-tip') {
        return fail('dated tips over divergence lengths: a root-to-tip plot', forester.clockPlotKind(t));
    }
    // one ancestor dated: neither kind (not a time tree, and not tips-only)
    var dated = rootToTipTree();
    named(dated, 'X').date = {value: 1999, unit: 'year'};
    if (forester.clockPlotKind(dated) !== null || forester.clockPlotData(dated) !== null) {
        return fail('one ancestor dated: no plot', forester.clockPlotKind(dated));
    }
    // one tip undated: refused, not dropped from the plot
    var undated = rootToTipTree();
    delete named(undated, 'C').date;
    if (forester.clockPlotKind(undated) !== null || forester.clockPlotData(undated) !== null) {
        return fail('one tip undated: no plot', forester.clockPlotKind(undated));
    }
    // one branch without a length
    var gap = rootToTipTree(ROOT_TO_TIP_NEXUS.replace('C[&num_date=2002]:0.02', 'C[&num_date=2002]'));
    if (named(gap, 'C').branch_length !== undefined) {
        return fail('fixture: C has no length', named(gap, 'C').branch_length);
    }
    if (forester.clockPlotKind(gap) !== null) {
        return fail('a branch without a length: no plot', forester.clockPlotKind(gap));
    }
    // the line's own rule: three tips, not all on one date
    var two = rootToTipTree('#NEXUS\nBegin trees;\ntree T = [&R] (A[&num_date=2000]:0.01,B[&num_date=2001]:0.03);\nEnd;\n');
    if (forester.clockPlotKind(two) !== null) {
        return fail('two tips: no plot');
    }
    var same = rootToTipTree(ROOT_TO_TIP_NEXUS.replace(/num_date=200\d/g, 'num_date=2000'));
    if (forester.clockPlotKind(same) !== null) {
        return fail('every tip on one date: no plot');
    }
    // a clock-model tree is kind 1 and never this one: its lengths are time
    if (forester.clockPlotKind(agesTree()) !== 'divergence') {
        return fail('a clock-model tree keeps its Time | Div plot', forester.clockPlotKind(agesTree()));
    }
    // ...and one with a rate on every branch but no heights -- dated tips,
    // undated ancestors -- is neither kind: not a time tree, and its lengths
    // are still time, not divergence
    var rated = rootToTipTree('#NEXUS\nBegin trees;\ntree T = [&R] ((A[&rate=0.01,num_date=2000]:2,B[&rate=0.01,num_date=2001]:1)[&rate=0.01]:2,'
        + '(C[&rate=0.01,num_date=2002]:2.5,D[&rate=0.01,num_date=2003]:1)[&rate=0.01]:1);\nEnd;\n');
    if (forester.getTreeRoot(rated)._divergenceFromRates !== true || forester.hasTimeAndDivergence(rated)) {
        return fail('fixture: a rate on every branch, and no Time | Div', [forester.getTreeRoot(rated)._divergenceFromRates, forester.hasTimeAndDivergence(rated)]);
    }
    if (forester.clockPlotKind(rated) !== null) {
        return fail('a clock rate on every branch: the lengths are time, so no root-to-tip plot', forester.clockPlotKind(rated));
    }
    return true;
}

function testRootToTipData() {
    var t = rootToTipTree();
    var d = forester.clockPlotData(t);
    if (!d || d.kind !== 'root-to-tip' || d.forward !== true || d.unit !== 'year' || d.fromRates !== false || d.divUnit !== null) {
        return fail('what the plot is: root-to-tip, calendar dates, no divergence unit stated', d && [d.kind, d.forward, d.unit, d.fromRates, d.divUnit]);
    }
    if (d.points.length !== 5 || !d.points.every(function (p) { return p.tip; })) {
        return fail('the tips only: no ancestor is dated', d.points.length);
    }
    var byName = {};
    d.points.forEach(function (p) { byName[p.node.name] = p; });
    var want = [['A', 2000, 0.015], ['B', 2001, 0.035], ['C', 2002, 0.03], ['D', 2003, 0.07], ['E', 2004, 0.05]];
    for (var i = 0; i < want.length; ++i) {
        var p = byName[want[i][0]];
        if (!p || p.date !== want[i][1] || !close(p.div, want[i][2])) {
            return fail('tip ' + want[i][0] + ' at ' + want[i][1] + ', ' + want[i][2] + ' from the root', p && [p.date, p.div]);
        }
    }
    if (d.root.node !== forester.getTreeRoot(t) || d.root.date !== null || d.root.div !== 0) {
        return fail('the root: no date of its own, divergence 0', [d.root.date, d.root.div]);
    }
    var f = d.fit;
    if (!f || f.n !== 5 || !close(f.slope, 0.0105) || !close(f.intercept, -20.981) || !close(f.r2, 0.63)) {
        return fail('slope 0.0105, intercept -20.981, R2 0.63', f && [f.n, f.slope, f.intercept, f.r2]);
    }
    if (!close(f.rate, 0.0105) || !close(f.rootDate, 20.981 / 0.0105)) {
        return fail('rate 0.0105; the root by the line at 1998.190', [f.rate, f.rootDate]);
    }
    // E: the line at 2004 is -20.981 + 21.042 = 0.061, and E is 0.05
    if (!close(byName.E.residual, -0.011)) {
        return fail('E lies 0.011 under the line', byName.E.residual);
    }
    // the view of Y: its own line, and its divergence is its path from the TREE's root
    var c = forester.clockPlotData(t, named(t, 'Y'));
    if (!c || c.points.length !== 3 || c.root.node !== named(t, 'Y') || c.root.div !== 0.01 || c.root.date !== null) {
        return fail('the view of Y: three tips, Y 0.01 from the root and undated', c && [c.points.length, c.root.div, c.root.date]);
    }
    var cf = c.fit;
    if (!cf || cf.n !== 3 || !close(cf.slope, 0.01) || !close(cf.intercept, -19.98) || !close(cf.r2, 0.25)) {
        return fail('the clade\'s line: slope 0.01, intercept -19.98, R2 0.25', cf && [cf.n, cf.slope, cf.intercept, cf.r2]);
    }
    if (!close(cf.rootDate, 1999)) {
        return fail('the clade\'s root by the line at 1999', cf.rootDate);
    }
    return true;
}

// Tips dated by AGE (a geologic unit, no dated pair to read the direction
// off): time still runs toward the youngest tip, so the slope is negative
// and the rate is reported positive.
function testRootToTipAges() {
    var t = rootToTipTree();
    // A..E at 4, 3, 2, 1, 0 million years: 2000..2004 reflected, so the same
    // sums with Sxy's sign flipped; intercept 0.04 + 0.0105 x 2 = 0.061
    var ages = {A: 4, B: 3, C: 2, D: 1, E: 0};
    forester.getAllExternalNodes(forester.getTreeRoot(t)).forEach(function (n) {
        n.date = {value: ages[n.name], unit: 'mya'};
    });
    var d = forester.clockPlotData(t);
    if (!d || d.kind !== 'root-to-tip' || d.forward !== false || d.unit !== 'mya') {
        return fail('ages: the dates run the other way', d && [d.kind, d.forward, d.unit]);
    }
    var f = d.fit;
    if (!close(f.slope, -0.0105) || !close(f.rate, 0.0105) || !close(f.r2, 0.63) || !close(f.intercept, 0.061)) {
        return fail('slope -0.0105, rate +0.0105, R2 0.63, intercept 0.061', [f.slope, f.rate, f.r2, f.intercept]);
    }
    if (!close(f.rootDate, 0.061 / 0.0105)) {
        return fail('the root by the line at 5.81 Ma', f.rootDate);
    }
    return true;
}

console.log('clock plot');
runTest('which trees have one        : ', testRule);
runTest('root-to-tip: which trees    : ', testRootToTipRule);
runTest('root-to-tip, by hand        : ', testRootToTipData);
runTest('root-to-tip ages            : ', testRootToTipAges);
runTest('the whole tree, by hand     : ', testWholeTree);
runTest('ancestors take no part      : ', testAncestorsTakeNoPart);
runTest('the view of a clade         : ', testClade);
runTest('ages run the other way      : ', testAges);
runTest('a falling line              : ', testNoSignal);
runTest('least squares               : ', testRegression);
runTest('month ticks                 : ', testMonthTicks);

if (_testFailures > 0) {
    console.log('\n' + _testFailures + ' test(s) FAILED');
    process.exit(1);
} else {
    console.log('\nAll tests passed');
}
