// Generates the DATA half of the joint visualization contract: small phyloXML
// trees, one per rule, plus vis-trees.tsv with what the classifier must say
// about each property on each tree -- offered or not, which tier, every flag.
//
// The name fixture (vis-contract.tsv) can only see the NAME rules. Every
// divergence found on 2026-09-11/12 -- sparse, all-distinct numeric,
// applies_to="clade", the wide-repeat demotion -- was in DATA-driven candidacy,
// invisible to it. These trees make those rules diffable.
//
// Real phyloXML on purpose: both programs run them through their own parser,
// so the whole pipeline is under test rather than one function. Expectations
// are derived by RUNNING forester.js. Regenerate deliberately when a rule
// changes (node test/fixtures/gen-vis-trees.js), never to make the test pass.
//
// Tiers: 0 clean categorical, 1 every numeric, 2 wide, 3 deprioritized,
// 4 sparse, 5 near-unique. The FIRST CANDIDATE THAT IS NOT WIDE opens the
// tree, so 0, 1, 3 and 4 can open one (each only when nothing above it
// exists) and 2 and 5 never do.
//
// Candidacy is decided on the tree; a view (subtree) never re-decides it. The
// trees here are static on purpose -- the view rule is pinned by the summary
// tests in visualization_test.js, not by a fixture.

'use strict';

const fs = require('fs');
const path = require('path');
const forester = require('../../forester').forester;
const px = require('../lib/phyloxml').phyloXml;

const OUT = path.join(__dirname, 'vis-trees');

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// tips: array of {name, props:[{ref, value, applies_to}]}
function phyloxml(tips) {
    let x = '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<phyloxml xmlns="http://www.phyloxml.org">\n  <phylogeny rooted="true">\n    <clade>\n';
    tips.forEach(function (t) {
        x += '      <clade>\n        <name>' + esc(t.name) + '</name>\n';
        t.props.forEach(function (p) {
            x += '        <property ref="' + esc(p.ref) + '" datatype="xsd:string" applies_to="'
                + (p.applies_to || 'node') + '">' + esc(p.value) + '</property>\n';
        });
        x += '      </clade>\n';
    });
    return x + '    </clade>\n  </phylogeny>\n</phyloxml>\n';
}

// fields: {ref: fn(i) -> value | null (absent) | [v1, v2] (carried twice)}
function tree(n, fields, appliesTo) {
    const tips = [];
    for (let i = 0; i < n; ++i) {
        const props = [];
        Object.keys(fields).forEach(function (ref) {
            const v = fields[ref](i);
            if (v === null || v === undefined) { return; }
            (Array.isArray(v) ? v : [v]).forEach(function (one) {
                props.push({ref: ref, value: one, applies_to: (appliesTo && appliesTo[ref]) || 'node'});
            });
        });
        tips.push({name: 't' + i, props: props});
    }
    return tips;
}

const AB = i => (i % 2) ? 'A' : 'B';
const seq = (k, pre) => i => (pre || 'v') + (i % k);

// one tree per rule; the comment is the rule it pins
const TREES = {
    // --- section 2: the data rules --------------------------------------
    multi_valued:            {n: 30, f: {'x:F': i => i === 0 ? ['A', 'B'] : AB(i)}},          // (a) refused
    single_value:            {n: 30, f: {'x:F': () => 'A'}},                                  // (b) refused
    sparse_at_bar_20_of_30:  {n: 30, f: {'x:F': i => i < 20 ? AB(i) : null}},                  // (c) NOT sparse
    sparse_under_19_of_30:   {n: 30, f: {'x:F': i => i < 19 ? AB(i) : null}},                  // (c) sparse, tier 4
    all_distinct_categorical:{n: 30, f: {'x:F': seq(30, 's')}},                               // (d) refused
    all_distinct_numeric:    {n: 30, f: {'x:F': i => String(i * 7 + 3)}},                     // numbers: kept, range
    numeric_discrete_10:     {n: 30, f: {'x:F': i => String(i % 10)}},                        // (g) discrete colours
    numeric_range_11:        {n: 33, f: {'x:F': i => String(i % 11)}},                        // (g) gradient
    category_limit_20:       {n: 22, f: {'x:F': i => 'v' + (i < 20 ? i : 0)}},                 // 20: clean, tier 0
    wide_21_of_35:           {n: 35, f: {'x:F': seq(21)}},                                    // (e) 3/5 exactly: wide, tier 2
    near_unique_21_of_34:    {n: 34, f: {'x:F': seq(21)}},                                    // (e) 0.617: wide + nearUnique, tier 5
    shape_7:                 {n: 14, f: {'x:F': seq(7)}},                                     // (h) shape
    shape_8:                 {n: 16, f: {'x:F': seq(8)}},                                     // (h) no shape
    // --- section 4: the tiers, all on one tree --------------------------
    tier_order: {n: 40, f: {
        'x:Clean':    i => (i % 4 === 0) ? 'P' : 'Q',                 // tier 0, deliberately LOW score (25/75)
        'x:Numeric':  i => String(i % 8),                             // tier 1, high score
        'x:Wide':     i => 'w' + (i % 22),                            // tier 2 (22/40 = 0.55 <= 3/5)
        'x:In-Group': i => (i % 2) ? 'in' : 'out',                    // tier 3, perfect score
        'x:Sparse':   i => i < 24 ? AB(i) : null,                     // tier 4 (24/40 = 0.6 < 2/3)
        'x:Barely':   i => 'b' + (i % 30)                             // tier 5 (30/40 = 0.75 > 3/5)
    }},
    // --- applies_to ------------------------------------------------------
    applies_to: {n: 30, f: {
        'x:OnNode':   AB, 'x:OnClade': AB, 'x:OnBranch': AB
    }, a: {'x:OnNode': 'node', 'x:OnClade': 'clade', 'x:OnBranch': 'parent_branch'}},
    // --- what opens the tree ---------------------------------------------
    opens_uncoloured_wide_only: {n: 35, f: {'x:F': seq(21)}},          // sole candidate is wide: nothing opens
    opens_by_sparse_when_alone: {n: 30, f: {'x:F': i => i < 18 ? AB(i) : null}},  // sparse alone DOES open
    opens_past_wide: {n: 36, f: {                                      // a wide field precedes the In-Group in
        'x:Wide': seq(21), 'x:In-Group': i => (i % 2) ? 'in' : 'out'   // the menu but does not stop it opening
    }},
    // --- numeric grammar and folding ------------------------------------
    numeric_grammar: {n: 20, f: {
        'x:Fold':  i => ['1', '1.0', '2', '+2', '3'][i % 5],           // 1/1.0 and 2/+2 fold: 3 distinct, numeric
        'x:Hex':   i => (i % 4) ? String(i % 4) : '0x1A',             // "0x1A" is not a number here: categorical
        'x:Inf':   i => (i % 4) ? String(i % 4) : 'Infinity',         // nor is Infinity
        'x:Forms': i => ['+5', '.5', '5.', '1e3', '7'][i % 5]         // every decimal spelling is; +5 and 5. fold
    }},
    // --- a value that folds to nothing is no value (decided 2026-09-12) ---
    fold_to_empty: {n: 30, f: {
        'x:Clean':  AB,                                                // opens the tree
        'x:Blanks': i => (i % 5 < 2) ? ['_', '___'][i % 2] : AB(i),    // 12 of 30 are only underscores: covered 18/30 -> sparse
        'x:Host':   i => (i % 5 < 2) ? '; cell culture' : AB(i),       // host cuts at ";": nothing before it -> no value -> sparse
        'x:Void':   () => '_'                                          // every value folds to nothing: not a candidate
    }},
    // --- names, as a cross-check that the two halves agree ---------------
    name_rules: {n: 30, f: {
        'x:Host': AB, 'x:genome_id': AB, 'x:Abbr_Authors': AB, 'x:Out-Group': AB, 'x:Plasmid': AB
    }}
};

function tierOf(c) {
    if (c.nearUnique) { return 5; }
    if (c.sparse) { return 4; }
    if (c.deprioritized) { return 3; }
    if (c.numeric) { return 1; }
    return c.wide ? 2 : 0;
}

if (!fs.existsSync(OUT)) { fs.mkdirSync(OUT); }
const rows = [];
Object.keys(TREES).forEach(function (name) {
    const spec = TREES[name];
    const xml = phyloxml(tree(spec.n, spec.f, spec.a));
    fs.writeFileSync(path.join(OUT, name + '.xml'), xml);
    const phy = px.parse(xml, {trim: true, normalize: true})[0];
    const cands = forester.visualizationCandidates(phy);
    const byRef = Object.create(null);
    cands.forEach(function (c, i) { byRef[c.ref || c.id] = {c: c, rank: i}; });
    const first = forester.openingVisualization(cands);
    const opens = first ? (first.ref || first.id) : '-';
    Object.keys(spec.f).forEach(function (ref) {
        const hit = byRef[ref];
        if (!hit) {
            rows.push([name, ref, 'refused', '-', '-', '-', '-', '-', '-', '-', '-', '-', opens, '-'].join('\t'));
            return;
        }
        const c = hit.c;
        rows.push([name, ref, 'offered', tierOf(c), hit.rank, c.numeric ? 1 : 0, c.wide ? 1 : 0,
                   c.nearUnique ? 1 : 0, c.sparse ? 1 : 0, c.deprioritized ? 1 : 0,
                   c.colorMode, c.shape ? 1 : 0, opens, c.values.length].join('\t'));
    });
    // a candidate the spec did not declare would be a bug in this generator
    cands.forEach(function (c) {
        if (!(c.ref in spec.f)) { throw new Error(name + ': unexpected candidate ' + (c.ref || c.id)); }
    });
});

const header = [
    '# archaeopteryx-js visualization contract, DATA half -- generated by',
    '# test/fixtures/gen-vis-trees.js from forester.js by RUNNING it. Do not edit;',
    '# regenerate deliberately when a rule changes, never to make a test pass.',
    '# tree <TAB> ref <TAB> verdict <TAB> tier <TAB> rank <TAB> numeric <TAB> wide <TAB> nearUnique',
    '#   <TAB> sparse <TAB> deprioritized <TAB> colorMode <TAB> shape <TAB> opens <TAB> distinct',
    '# tier: 0 clean categorical, 1 numeric, 2 wide, 3 deprioritized, 4 sparse, 5 near-unique',
    '# opens: the ref the viewer colours the tree with on load -- the first candidate that',
    '#   is not wide ("-" = uncoloured)',
    '# distinct: distinct values AFTER grouping (case folds for categories; spellings of one',
    '#   number fold for numerics: "1" and "1.0" are one value)'
];
fs.writeFileSync(path.join(__dirname, 'vis-trees.tsv'), header.join('\n') + '\n' + rows.join('\n') + '\n');
console.log(Object.keys(TREES).length + ' trees, ' + rows.length + ' expectation rows written');
