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

// Writes test/data/genome_regions.xml (and its copy, the demo
// docs/data/genome-regions-synthetic.xml): twelve synthetic genomes whose
// tips carry a region of eleven core genes A..K as phyloXML <sequence>
// elements -- one per gene with a <location> on a contig and its family in
// an <annotation ref="fam:...">, plus a <sequence type="dna"> record per
// contig -- arranged so that every rule of the gene track has a row that
// exercises it. Deterministic: no randomness, so the file is the same on
// every run and test/gene_test.js can pin numbers computed by hand.
//
//   S01  the canonical order, all on +, BV-BRC accessions
//   S02  canonical, RefSeq accessions (the NCBI link)
//   S03  canonical with B on the minus strand (a mixed row that is not flipped)
//   S04  no sequences at all (a tip without a region)
//   S05  C, D, E inverted (reversed order, minus strand)
//   S06  the whole region on the minus strand, mirrored: flipped, it is S01
//   S07  D deleted; no contig record (no caps)
//   S08  two genes inserted after D: X (a family of its own) and Y (no family)
//   S09  D..K on a contig that ENDS with the region (caps at both ends)
//   S10  A..F on one contig, G..K on another (one contig drawn)
//   S11  a second copy of E overlapping F (a second lane)
//   S12  a second copy of A at the end (two anchors = unanchored under A),
//        and a sequence whose location is not in the grammar (ignored)
//
// Gene k (0-based) of the canonical order sits at 1001 + 1100 k .. + 999, so
// A is 1001-2000 and K 12001-13000; F, the middle gene, is the only family
// single-copy in every region and so the default anchor. No real organism is
// represented.
//
//   node test/make_genome_regions_fixture.js

"use strict";

const fs = require('fs');
const path = require('path');

const GENES = [
    ['A', 'synA', 'Replication initiation protein', 'plf:P001'],
    ['B', 'synB', 'DNA polymerase III subunit beta', 'plf:P001'],
    ['C', 'synC', 'Recombination protein', 'plf:P002'],
    ['D', 'synD', 'Type II topoisomerase subunit', 'plf:P003'],
    ['E', 'synE', 'ABC transporter ATP-binding protein', 'plf:P004'],
    ['F', 'synF', 'Molecular chaperone', 'plf:P005'],
    ['G', 'synG', 'LysR family transcriptional regulator', 'plf:P006'],
    ['H', 'synH', 'Hypothetical protein', 'plf:P007'],
    ['I', 'synI', 'Peptidoglycan synthetase', 'plf:P008'],
    ['J', 'synJ', 'tRNA ligase', 'plf:P009'],
    ['K', 'synK', 'Outer membrane porin', 'plf:P010']
];

function fam(letter) {
    return 'fam:F' + String(GENES.findIndex(function (g) {
        return g[0] === letter;
    }) + 1).padStart(3, '0');
}

function canonical(letter) {
    let k = GENES.findIndex(function (g) {
        return g[0] === letter;
    });
    let start = 1001 + (1100 * k);
    return {start: start, end: start + 999};
}

// a gene of the core set at its canonical place, or placed by hand
function core(letter, strand, start, end) {
    let g = GENES.find(function (x) {
        return x[0] === letter;
    });
    let pos = (start === undefined) ? canonical(letter) : {start: start, end: end};
    return {symbol: g[1], product: g[2], refs: [fam(letter), g[3]], start: pos.start, end: pos.end,
        strand: strand || '+', contig: null};
}

function allCanonical() {
    return GENES.map(function (g) {
        return core(g[0]);
    });
}

function shifted(genes, by) {
    return genes.map(function (g) {
        return Object.assign({}, g, {start: g.start + by, end: g.end + by});
    });
}

function onContig(genes, contig) {
    return genes.map(function (g) {
        return Object.assign({}, g, {contig: contig});
    });
}

function letters(from, to) {
    return GENES.slice(GENES.findIndex(function (g) {
        return g[0] === from;
    }), GENES.findIndex(function (g) {
        return g[0] === to;
    }) + 1).map(function (g) {
        return core(g[0]);
    });
}

const STRAINS = {};

STRAINS.S01 = {genes: allCanonical()};
STRAINS.S02 = {genes: allCanonical(), refseq: true};
STRAINS.S03 = {genes: allCanonical().map(function (g) {
    return g.symbol === 'synB' ? Object.assign({}, g, {strand: '-'}) : g;
})};
STRAINS.S04 = {none: true};
STRAINS.S05 = {genes: letters('A', 'B')
    .concat([core('E', '-', 3201, 4200), core('D', '-', 4301, 5300), core('C', '-', 5401, 6400)])
    .concat(letters('F', 'K'))};
STRAINS.S06 = {genes: allCanonical().map(function (g) {
    return Object.assign({}, g, {start: 14001 - g.end, end: 14001 - g.start, strand: '-'});
})};
STRAINS.S07 = {genes: letters('A', 'C').concat(shifted(letters('E', 'K'), -1100)), noRecord: true};
STRAINS.S08 = {genes: letters('A', 'D').concat([
    {symbol: 'intX', product: 'Prophage integrase', refs: ['fam:F099'], start: 5401, end: 6000, strand: '+'},
    {symbol: '', product: 'Hypothetical protein', refs: [], start: 6101, end: 6400, strand: '-', noAccession: true}
]).concat(shifted(letters('E', 'K'), 1100))};
STRAINS.S09 = {genes: shifted(letters('D', 'K'), -4300), recordEnd: 8700};
STRAINS.S10 = {genes: onContig(letters('A', 'F'), 'ctg10a').concat(onContig(shifted(letters('G', 'K'), -6600), 'ctg10b')),
    contigs: [['ctg10a', 50000], ['ctg10b', 20000]]};
STRAINS.S11 = {genes: allCanonical().concat([core('E', '-', 6601, 7200)])};
STRAINS.S12 = {genes: allCanonical().concat([core('A', '+', 13101, 14100)]), malformed: true};

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ind(n) {
    return ' '.repeat(2 * n);
}

function sequenceXml(strain, nn, g, k, depth) {
    let out = [];
    let p = ind(depth);
    out.push(p + '<sequence type="protein">');
    if (g.noAccession) {
        // Y: no accession either, so nothing to link to
    } else if (STRAINS[strain].refseq) {
        out.push(p + '  <accession source="RefSeq">WP_' + String(100000000 + (nn * 1000) + k).padStart(9, '0') + '.1</accession>');
    } else {
        out.push(p + '  <accession source="BV-BRC">fig|1000.' + nn + '.peg.' + k + '</accession>');
    }
    if (g.symbol) {
        out.push(p + '  <symbol>' + esc(g.symbol) + '</symbol>');
    }
    out.push(p + '  <name>' + esc(g.product) + '</name>');
    let contig = g.contig || ('ctg' + String(nn).padStart(2, '0'));
    out.push(p + '  <location>' + contig + ':' + g.start + '-' + g.end + '(' + g.strand + ')</location>');
    g.refs.forEach(function (r) {
        out.push(p + '  <annotation ref="' + r + '"></annotation>');
    });
    out.push(p + '</sequence>');
    return out;
}

function recordXml(nn, contig, end, depth) {
    let p = ind(depth);
    return [p + '<sequence type="dna">',
        p + '  <accession source="RefSeq">NZ_SYN' + String(nn).padStart(2, '0') + contig.replace(/^ctg\d+/, '').toUpperCase() + '000001.1</accession>',
        p + '  <name>Synthobacter sp. S' + String(nn).padStart(2, '0') + (contig.endsWith('b') ? ' plasmid' : ' chromosome') + '</name>',
        p + '  <location>' + contig + ':1-' + end + '</location>',
        p + '</sequence>'];
}

function tipXml(strain, length, depth) {
    let nn = Number(strain.substring(1));
    let p = ind(depth);
    let out = [p + '<clade>', p + '  <name>Synthobacter sp. ' + strain + '</name>', p + '  <branch_length>' + length + '</branch_length>'];
    let s = STRAINS[strain];
    if (!s.none) {
        // the contig record(s) FIRST: both programs read a tip's first sequence
        // as "the" sequence
        if (!s.noRecord) {
            if (s.contigs) {
                s.contigs.forEach(function (c) {
                    out = out.concat(recordXml(nn, c[0], c[1], depth + 1));
                });
            } else {
                out = out.concat(recordXml(nn, 'ctg' + String(nn).padStart(2, '0'), s.recordEnd || 50000, depth + 1));
            }
        }
        s.genes.forEach(function (g, k) {
            out = out.concat(sequenceXml(strain, nn, g, k + 1, depth + 1));
        });
        if (s.malformed) {
            out.push(p + '  <sequence type="dna">');
            out.push(p + '    <name>a plasmid whose location is prose, not the grammar</name>');
            out.push(p + '    <location>plasmid pX</location>');
            out.push(p + '  </sequence>');
        }
    }
    out.push(p + '</clade>');
    return out;
}

// (((S01,S02),(S03,S04)),((S05,S06),((S07,S08),((S09,S10),(S11,S12)))))
function node(children, length, depth) {
    let p = ind(depth);
    let out = [p + '<clade>', p + '  <branch_length>' + length + '</branch_length>'];
    children.forEach(function (c) {
        out = out.concat(c(depth + 1));
    });
    out.push(p + '</clade>');
    return out;
}

function tip(strain, length) {
    return function (depth) {
        return tipXml(strain, length, depth);
    };
}

function inner(children, length) {
    return function (depth) {
        return node(children, length, depth);
    };
}

const TREE = inner([
    inner([inner([tip('S01', 0.10), tip('S02', 0.11)], 0.05), inner([tip('S03', 0.08), tip('S04', 0.13)], 0.07)], 0.10),
    inner([inner([tip('S05', 0.10), tip('S06', 0.09)], 0.06),
        inner([inner([tip('S07', 0.09), tip('S08', 0.12)], 0.04),
            inner([inner([tip('S09', 0.10), tip('S10', 0.11)], 0.03), inner([tip('S11', 0.10), tip('S12', 0.10)], 0.03)], 0.02)], 0.05)], 0.10)
], 0);

let lines = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<phyloxml xmlns="http://www.phyloxml.org" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.phyloxml.org http://www.phyloxml.org/1.20/phyloxml.xsd">',
    '<phylogeny rooted="true">',
    '  <name>Genome regions (synthetic)</name>',
    '  <description>Twelve synthetic genomes, each tip carrying a region of eleven core genes as located sequences with their families; one row per rule of the gene track. No real organism is represented. Generated by test/make_genome_regions_fixture.js.</description>'];
lines = lines.concat(TREE(1));
lines.push('</phylogeny>');
lines.push('</phyloxml>');
let xml = lines.join('\n') + '\n';

const targets = [path.join(__dirname, 'data', 'genome_regions.xml'),
    path.join(__dirname, '..', 'docs', 'data', 'genome-regions-synthetic.xml')];
targets.forEach(function (t) {
    fs.writeFileSync(t, xml, 'utf8');
    console.log('wrote ' + path.relative(process.cwd(), t) + ' (' + xml.length + ' bytes)');
});
