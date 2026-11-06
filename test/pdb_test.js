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

// Tests for the PDB entries model in forester.js, the port of the desktop's
// NodeDataLinks rules (its 0.11.202, 2026-11-06): which values are PDB
// identifiers, which sources and which metadata field names count, what a
// field's value links, and a node's entries in order, once each. The cases
// mirror the desktop's NodeDataLinksTest, and its two demo trees
// (test/data/node-data-links.xml and node-data-links-none.xml, byte-identical
// to its tag 0.11.202) are the acceptance test the two programs share: every
// identifier they name opens the same page in both, and nothing else does.

"use strict";

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var forester = require('../forester').forester;
var px = require('./lib/phyloxml').phyloXml;

if (!forester) {
    throw new Error("no forester.js");
}

var RCSB = 'https://www.rcsb.org/structure/';
var count = 0;
var failures = 0;

function test(label, fn) {
    count++;
    try {
        fn();
        console.log('pdb: ' + label + ' pass');
    } catch (e) {
        failures++;
        console.log('pdb: ' + label + ' FAIL\n    ' + (e && e.message));
    }
}

function pairs(entries) {
    return entries.map(function (e) { return e.text + ' ' + e.url; });
}
function spans(list) {
    return list.map(function (s) { return s.start + '-' + s.end + ' ' + s.url; });
}
function acc(value, source, comment) {
    var a = {value: value, source: source};
    if (comment) {
        a.comment = comment;
    }
    return a;
}
function withAccession(value, source) {
    return {sequences: [{accession: acc(value, source)}]};
}
function tipsByName(file) {
    var trees = px.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'), {});
    var tips = {};
    forester.getAllExternalNodes(trees[0]).forEach(function (n) { tips[n.name] = n; });
    return tips;
}

test('the four names are public', function () {
    ['pdbUrl', 'isPdbRef', 'propertySpans', 'pdbEntries'].forEach(function (name) {
        assert.strictEqual(typeof forester[name], 'function', 'forester.' + name);
    });
});

test('an identifier opens its RCSB PDB page, upper-cased, without its chain', function () {
    assert.strictEqual(forester.pdbUrl('4KRR'), RCSB + '4KRR');
    assert.strictEqual(forester.pdbUrl('1iyf'), RCSB + '1IYF', 'either case');
    assert.strictEqual(forester.pdbUrl('4KRR_A'), RCSB + '4KRR', 'a chain after _');
    assert.strictEqual(forester.pdbUrl('4krr.B'), RCSB + '4KRR', 'a chain after .');
    assert.strictEqual(forester.pdbUrl('4KRR:1'), RCSB + '4KRR', 'an entity after :');
    assert.strictEqual(forester.pdbUrl(' 9N7D '), RCSB + '9N7D', 'trimmed');
});

test('what is no identifier', function () {
    [['4KRR5', 'five characters'], ['4KR', 'three'], ['0ABC', 'a leading zero'], ['ABCD', 'a leading letter'],
        ['1999', 'all digits is a year'], ['AF-P38398-F1', 'an AlphaFold model'], ['pdb|4KRR|A', 'a composite'],
        ['1ABC_HUMAN', 'a chain of five'], ['4KRR A', 'a chain after a space'], ['+58more', 'the overflow token'],
        ['none', 'none'], ['', 'empty'], [null, 'null'], [undefined, 'undefined'], [4711, 'a number']
    ].forEach(function (c) {
        assert.strictEqual(forester.pdbUrl(c[0]), null, c[1]);
    });
});

test('an accession whose source names PDB is an entry; any other source, or no source, is not', function () {
    ['pdb', 'PDB', 'rcsb', 'RCSB PDB', 'rcsb_pdb', 'rcsb-pdb', 'wwPDB', ' pdb '].forEach(function (src) {
        assert.deepStrictEqual(pairs(forester.pdbEntries(withAccession('4KRR', src))), ['4KRR ' + RCSB + '4KRR'], 'source ' + src);
    });
    assert.deepStrictEqual(pairs(forester.pdbEntries(withAccession('1iyf', 'pdb'))), ['1iyf ' + RCSB + '1IYF'], 'the text as written');
    assert.deepStrictEqual(pairs(forester.pdbEntries(withAccession('4KRR:A', 'pdb'))), ['4KRR:A ' + RCSB + '4KRR'], 'a chain after : ends the token');
    assert.deepStrictEqual(pairs(forester.pdbEntries(withAccession('4KRR_A', 'pdb'))), ['4KRR_A ' + RCSB + '4KRR'], 'a chain under the source');
    assert.deepStrictEqual(pairs(forester.pdbEntries(withAccession('4KRR (X-ray)', 'pdb'))), ['4KRR (X-ray) ' + RCSB + '4KRR'], 'a comment after a space is not part of it');
    assert.deepStrictEqual(pairs(forester.pdbEntries(withAccession('4KRR.', 'pdb'))), ['4KRR. ' + RCSB + '4KRR'], 'a trailing dot dropped');
    [['1999', 'pdb', 'all digits under the source too'], ['P38398', 'pdb', 'under pdb, a UniProt accession is no entry'],
        ['4KRR5', 'pdb', 'five characters under the source'], ['4KRR', '', 'no source: not guessed at'],
        ['4KRR', undefined, 'an absent source'], ['4KRR', 'pdbe', 'a source we do not know'],
        ['4KRR', 'uniprot', 'another source'],
        ['4KRR-A', 'pdb', 'a "-" after the token is no separator: the value is refused, as the desktop refuses it'],
        ['4KRR(X-ray)', 'pdb', 'a "(" right after the token: refused (a space before it is a separator)'],
        ['4KRR5 (X-ray)', 'pdb', 'the token runs to the separator and is five characters']
    ].forEach(function (c) {
        assert.deepStrictEqual(forester.pdbEntries(withAccession(c[0], c[1])), [], c[2]);
    });
});

test('a metadata field named for PDB identifiers: which names count', function () {
    ['repseq:pdb_ids', 'data:PDB-IDs', 'pdb_id', 'x:pdb', 'pdb:ids', 'pdb:entry', 'data:pdb_ids ', 'a:pdb codes',
        'b:PdbId', 'c:pdb.accessions', 'd:pdb_structures', 'meta:PDBCode', 'meta:PDBID', 'meta:pdbentry',
        'meta:PDB Accession', 'meta:PDB-Structures', 'PDB', 'pdb:pdb_id', 'pdb_'].forEach(function (ref) {
        assert.strictEqual(forester.isPdbRef(ref), true, 'a field of PDB identifiers: ' + ref);
    });
    ['data:pdb_year', 'data:structure', 'repseq:has_structure', 'repseq:struct_domains', 'pdb:resolution', 'pdb:year',
        'data:pdbs', '', null, undefined, 7, 'pdb_x', 'meta:PDBCodex', 'pdbs:id'].forEach(function (ref) {
        assert.strictEqual(forester.isPdbRef(ref), false, 'not one: ' + ref);
    });
});

test('what a metadata value links: a web address whole, a PDB field its identifiers, anything else nothing', function () {
    assert.deepStrictEqual(spans(forester.propertySpans('data:pdb_ids', 'https://www.rcsb.org/structure/4KRR')),
        ['0-35 https://www.rcsb.org/structure/4KRR'], 'a web address in a PDB field');
    assert.deepStrictEqual(spans(forester.propertySpans('data:page', 'https://example.org')),
        ['0-19 https://example.org'], 'a web address in any field');
    assert.deepStrictEqual(spans(forester.propertySpans('repseq:pdb_ids', '9KRA,9KRB')),
        ['0-4 ' + RCSB + '9KRA', '5-9 ' + RCSB + '9KRB'], 'identifiers in a PDB field');
    assert.deepStrictEqual(spans(forester.propertySpans('data:structure', '2AJF')), [], 'an identifier under another name');
    assert.deepStrictEqual(spans(forester.propertySpans('data:pdb_ids', null)), [], 'a null value');
    assert.deepStrictEqual(spans(forester.propertySpans('data:pdb_ids', 4711)), [], 'a value that is no string');
    assert.deepStrictEqual(spans(forester.propertySpans('data:pdb_ids', '9KRA,9KRB,5XGR')),
        ['0-4 ' + RCSB + '9KRA', '5-9 ' + RCSB + '9KRB', '10-14 ' + RCSB + '5XGR'], 'a comma-separated list');
    assert.deepStrictEqual(spans(forester.propertySpans('data:pdb_ids', '4KQZ, 4l3n; 5X59 | 1999 +58more none 4KRR_A')),
        ['0-4 ' + RCSB + '4KQZ', '6-10 ' + RCSB + '4L3N', '12-16 ' + RCSB + '5X59', '37-43 ' + RCSB + '4KRR'],
        'every separator, a chain, a year, the overflow token and none among them');
    assert.deepStrictEqual(spans(forester.propertySpans('data:pdb_ids', 'none')), [], 'nothing listed');
    assert.deepStrictEqual(spans(forester.propertySpans('data:pdb_ids', '')), [], 'empty');
    assert.deepStrictEqual(spans(forester.propertySpans('data:page', 'https://')), [], 'an address without a host');
    assert.deepStrictEqual(spans(forester.propertySpans('data:page', 'www.rcsb.org/structure/4KRR')), [], 'no scheme: no address');
});

test('a node\'s entries: once each, the accession, the cross-references, then the fields', function () {
    var node = {
        sequences: [
            {accession: acc('4KRR', 'pdb'), cross_references: [acc('IPR002552', 'interpro'), acc('1JM7', 'pdb'),
                acc('1JM7', 'PDB', 'X-ray'), acc('1999', 'pdb')]},
            null,
            {cross_references: [acc('4KRR_A', 'pdb')]}
        ],
        properties: [
            {ref: 'repseq:pdb_ids', value: '5X59,4KRR,+2more'},
            {ref: 'data:structure', value: '2AJF'},
            {ref: 'data:pdb_year', value: '2013'},
            {ref: 'data:pdb_codes', value: 2013}
        ]
    };
    assert.deepStrictEqual(pairs(forester.pdbEntries(node)),
        ['4KRR ' + RCSB + '4KRR', '1JM7 ' + RCSB + '1JM7', '5X59 ' + RCSB + '5X59']);
    assert.deepStrictEqual(pairs(forester.pdbEntries({properties: [{ref: 'data:pdb_ids', value: '9N7D'}]})),
        ['9N7D ' + RCSB + '9N7D'], 'a field alone');
    assert.deepStrictEqual(pairs(forester.pdbEntries({properties: [{ref: 'data:pdb_ids', value: ' https://www.rcsb.org/structure/4KRR '}]})),
        ['https://www.rcsb.org/structure/4KRR https://www.rcsb.org/structure/4KRR'],
        'a PDB field holding an address: that address, trimmed, as its text');
    assert.deepStrictEqual(forester.pdbEntries({properties: [{ref: 'data:page', value: 'https://example.org'}]}), [],
        'an address in a field of another name is not a PDB entry');
    assert.deepStrictEqual(forester.pdbEntries(null), [], 'no node');
    assert.deepStrictEqual(forester.pdbEntries({}), [], 'a bare node');
    assert.deepStrictEqual(forester.pdbEntries({name: 'x', sequences: [{}], properties: []}), [], 'a sequence without anything');
});

test('the desktop\'s demo tree node-data-links.xml: BRCA1 three, the MERS tip four, the rest none', function () {
    var tips = tipsByName('node-data-links.xml');
    assert.strictEqual(Object.keys(tips).length, 6, 'six tips');
    assert.deepStrictEqual(pairs(forester.pdbEntries(tips.BRCA1_HUMAN)),
        ['1T15 ' + RCSB + '1T15', '1JM7 ' + RCSB + '1JM7', '1JNX ' + RCSB + '1JNX'],
        'BRCA1: the cross-references, in file order, the UniProt accession no entry');
    assert.deepStrictEqual(pairs(forester.pdbEntries(tips['MERS-CoV_EMC/2012|AFS88936.1'])),
        ['4KQZ ' + RCSB + '4KQZ', '4L3N ' + RCSB + '4L3N', '5X4R ' + RCSB + '5X4R', '5X59 ' + RCSB + '5X59'],
        'the MERS tip: data:pdb_ids');
    Object.keys(tips).forEach(function (name) {
        if (name !== 'BRCA1_HUMAN' && name !== 'MERS-CoV_EMC/2012|AFS88936.1') {
            assert.deepStrictEqual(forester.pdbEntries(tips[name]), [], name + ' names nothing');
        }
    });
});

test('the desktop\'s node-data-links-none.xml: no tip names an entry (data:pdb_ids = none)', function () {
    var tips = tipsByName('node-data-links-none.xml');
    assert.strictEqual(Object.keys(tips).length, 4, 'four tips');
    assert.strictEqual(tips.XYZ12345678.properties.filter(function (p) { return p.ref === 'data:pdb_ids'; })[0].value, 'none');
    Object.keys(tips).forEach(function (name) {
        assert.deepStrictEqual(forester.pdbEntries(tips[name]), [], name);
    });
});

test('the PDB links test tree (test/data/pdb_links.xml), the control reference\'s launch', function () {
    var tips = tipsByName('pdb_links.xml');
    assert.deepStrictEqual(pairs(forester.pdbEntries(tips.pdb_acc)), ['4KRR ' + RCSB + '4KRR'],
        'the accession and its chain spelling are one entry, the accession\'s text');
    assert.deepStrictEqual(pairs(forester.pdbEntries(tips.one_xref)), ['1JM7 ' + RCSB + '1JM7'], 'one cross-reference among others');
    assert.deepStrictEqual(pairs(forester.pdbEntries(tips.many)),
        ['4KQZ ' + RCSB + '4KQZ', '4l3n ' + RCSB + '4L3N', '5X59 ' + RCSB + '5X59', '4KRR_A ' + RCSB + '4KRR'],
        'the field: the identifiers as written, the rest of the tokens left out');
    assert.deepStrictEqual(forester.pdbEntries(tips.none), [], 'none');
});

if (failures > 0) {
    console.log(failures + ' of ' + count + ' PDB tests FAILED');
    process.exit(1);
} else {
    console.log('All ' + count + ' PDB tests passed');
}
