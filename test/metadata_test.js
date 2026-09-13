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

// Tests for the metadata table join in forester.js: parsing a TSV / CSV
// beside the tree, naming its columns as property refs, joining its rows
// onto the tips, and what the rest of the library then makes of the
// properties -- Color-by candidates, search fields, display names.

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

function tree() {
    return forester.parseNewHampshire('((Human:0.1,Chimp:0.1):0.2,(Mouse:0.3,Rat:0.3):0.1,Dog:0.4);', true, false);
}

function tip(phy, name) {
    return forester.getAllExternalNodes(phy).filter(function (n) { return n.name === name; })[0];
}

function propOf(node, ref) {
    return (node.properties || []).filter(function (p) { return p.ref === ref; })[0] || null;
}

// TSV, CSV and semicolon-separated text, quoted cells, comments, blank
// lines and Windows line ends all come back as the same header and rows
function testParseDelimited() {
    var tsv = forester.parseDelimitedTable('name\tHost\tYear\nHuman\tHomo sapiens\t2001\nDog\tCanis\t2003\n');
    if (tsv.delimiter !== '\t' || tsv.columns.join('|') !== 'name|Host|Year' || tsv.rows.length !== 2
        || tsv.rows[1].join('|') !== 'Dog|Canis|2003') {
        console.log('    tsv: ' + JSON.stringify(tsv));
        return false;
    }
    var csv = forester.parseDelimitedTable('# a comment\r\nname,Host,"Collection, site"\r\n\r\nHuman,"Homo ""sapiens""","Boston, MA"\r\n');
    if (csv.delimiter !== ',' || csv.columns.join('|') !== 'name|Host|Collection, site'
        || csv.rows.length !== 1 || csv.rows[0].join('|') !== 'Human|Homo "sapiens"|Boston, MA') {
        console.log('    csv: ' + JSON.stringify(csv));
        return false;
    }
    var semi = forester.parseDelimitedTable('name;Score\n Dog ; 1.5 \n');
    if (semi.delimiter !== ';' || semi.rows[0].join('|') !== 'Dog|1.5') {
        console.log('    semicolon: ' + JSON.stringify(semi));
        return false;
    }
    // a comma inside quotes does not make the file comma-separated when tabs win the header
    var mixed = forester.parseDelimitedTable('name\tNote\nDog\t"a, b"\n');
    if (mixed.delimiter !== '\t' || mixed.rows[0][1] !== 'a, b') {
        return false;
    }
    var threw = 0;
    try { forester.parseDelimitedTable(''); } catch (e) { threw++; }
    try { forester.parseDelimitedTable('# only comments\n\n'); } catch (e) { threw++; }
    try { forester.parseDelimitedTable('justonecolumn\nDog\n'); } catch (e) { threw++; }
    return threw === 3;
}

// A column's ref: a ready-made ns:local header is kept, anything else goes
// under meta: with its whitespace as underscores -- and the display name
// brings the spaces back
function testColumnRefs() {
    var r = forester.metadataColumnRef;
    if (r('Host', 1) !== 'meta:Host' || r('Collection Date', 2) !== 'meta:Collection_Date'
        || r('  two   words ', 3) !== 'meta:two_words' || r('', 4) !== 'meta:column_5') {
        return false;
    }
    if (r('BVBRC:host_group', 1) !== 'BVBRC:host_group' || r('x:a b', 1) !== 'meta:x:a_b') {
        return false;
    }
    return forester.propertyDisplayName('meta:Collection_Date') === 'Collection Date'
        && forester.propertyDisplayName('meta:host') === 'Host';
}

// The join: exact then case-insensitive name matching, one property per
// filled cell, the report of what matched and what did not
function testJoin() {
    var phy = tree();
    var report = forester.joinMetadataTable(phy,
        'id\tHost\tScore\tCount\tNote\n'
        + 'Human\tHomo sapiens\t1.5\t3\thello\n'
        + 'chimp\tPan\t2\t\t\n'          // lower-case key: matched case-insensitively; two empty cells
        + 'Mouse\tMus\t-0.5\t7\t\n'
        + 'Unicorn\tnone\t1\t1\tx\n');   // no such tip
    // Human 4 + Chimp 2 + Mouse 3 filled cells = 9 properties
    if (report.tips !== 5 || report.matchedTips !== 3 || report.properties !== 9
        || report.unmatchedRows.join() !== 'Unicorn' || report.unmatchedTips.sort().join() !== 'Dog,Rat') {
        console.log('    report: ' + JSON.stringify(report));
        return false;
    }
    var cols = report.columns.map(function (c) { return c.ref + ':' + c.datatype + ':' + c.filled; }).join(' ');
    if (cols !== 'meta:Host:xsd:string:3 meta:Score:xsd:double:3 meta:Count:xsd:integer:2 meta:Note:xsd:string:1') {
        console.log('    columns: ' + cols);
        return false;
    }
    var chimp = tip(phy, 'Chimp');
    var host = propOf(chimp, 'meta:Host');
    if (!host || host.value !== 'Pan' || host.applies_to !== 'node' || host.datatype !== 'xsd:string') {
        return false;
    }
    if (propOf(chimp, 'meta:Count') !== null || propOf(chimp, 'meta:Note') !== null) {
        return false;   // empty cells add nothing
    }
    if (!propOf(tip(phy, 'Human'), 'meta:Score') || propOf(tip(phy, 'Human'), 'meta:Score').datatype !== 'xsd:double') {
        return false;
    }
    return tip(phy, 'Dog').properties === undefined;
}

// A second join over the same ref replaces the value: the table wins
function testTableWins() {
    var phy = tree();
    forester.joinMetadataTable(phy, 'id\tHost\nHuman\tfirst\n');
    forester.joinMetadataTable(phy, 'id\tHost\nHuman\tsecond\n');
    var human = tip(phy, 'Human');
    return human.properties.length === 1 && human.properties[0].value === 'second';
}

// What the rest of the library makes of the joined columns: Host becomes a
// Color-by candidate, Score a numeric one, both are search fields with the
// right typing, and the numeric text does not become a category
function testDownstream() {
    var phy = tree();
    forester.joinMetadataTable(phy,
        'id,Host,Score\nHuman,Primate,1\nChimp,Primate,2\nMouse,Rodent,3\nRat,Rodent,4\nDog,Carnivore,5\n');
    var cands = forester.visualizationCandidates(phy);
    var host = cands.filter(function (c) { return c.ref === 'meta:Host'; })[0];
    var score = cands.filter(function (c) { return c.ref === 'meta:Score'; })[0];
    if (!host || host.values.join() !== 'Carnivore,Primate,Rodent' || host.coverage !== 5 || host.numeric) {
        console.log('    host: ' + JSON.stringify(host && {values: host.values, coverage: host.coverage}));
        return false;
    }
    if (!score || !score.numeric || score.values.length !== 5) {
        console.log('    score: ' + JSON.stringify(score && {values: score.values, numeric: score.numeric}));
        return false;
    }
    var fields = forester.availableSearchFields(phy);
    var hostField = fields.filter(function (f) { return f.label === 'meta:Host'; })[0];
    var scoreField = fields.filter(function (f) { return f.label === 'meta:Score'; })[0];
    if (!hostField || hostField.numeric || !scoreField || !scoreField.numeric) {
        return false;
    }
    var hits = forester.searchWithSpec(phy, {field: hostField, mode: 'contains', value: 'Rodent', caseSensitive: false, inverse: false});
    return hits.size === 2;
}

console.log("\nmetadata tables\n");

runTest("parse TSV / CSV / semicolon : ", testParseDelimited);
runTest("column refs                 : ", testColumnRefs);
runTest("join and report             : ", testJoin);
runTest("the table wins              : ", testTableWins);
runTest("downstream: color-by, search: ", testDownstream);

if (_testFailures > 0) {
    console.log("\n" + _testFailures + " test(s) FAILED");
    process.exit(1);
} else {
    console.log("\nAll tests passed");
}
