// The control reference generator (test/make_control_reference.js), the
// parts that need no browser: the demo table it reads, the icon file it
// writes, the rst text it escapes, the union it takes. Run with
// `node test/control_reference_test.js` (part of `npm test`).

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const gen = require('./make_control_reference.js');

let n = 0;
function test(name, fn) {
    fn();
    ++n;
}

test('the demo table is read: every demo tree, its file on disk, the folded panel left out', () => {
    const {trees, skipped} = gen.demoTrees(null);
    assert.ok(trees.length >= 20, 'demo trees: ' + trees.length);
    for (const t of trees) {
        assert.ok(fs.existsSync(path.join(__dirname, '..', 'docs', t.file)), t.key + ': ' + t.file);
        assert.ok(!(t.config && t.config.collapseControlPanel), t.key + ' launches with the panel folded');
    }
    assert.deepStrictEqual(skipped, ['collapsed']);
    // the first tree reads the two-faced buttons, the circular demo the label flip
    assert.ok(trees[0].extras && trees[0].extras.indexOf('#ladderize_b') >= 0, 'the first tree clicks ladderize');
    const circ = trees.find((t) => t.config.layout === 'circular');
    assert.ok(circ && circ.extras.indexOf('#fitwidth') >= 0, 'the circular demo clicks the label flip');
});

test('--only keeps the named trees, in the table\'s order', () => {
    const {trees} = gen.demoTrees(['circular', 'apaf']);
    assert.deepStrictEqual(trees.map((t) => t.key), ['apaf', 'circular']);
});

test('an icon file: styles back to attributes, the ink fixed, the box padded, the viewer\'s own attributes gone', () => {
    const markup = '<svg class="aptx-glyph" data-glyph="fit_all" viewBox="0 0 100 100" aria-hidden="true"'
        + ' focusable="false" style="fill:none;stroke:currentColor;stroke-width:6.5;stroke-linecap:butt;stroke-linejoin:round">'
        + '<line x1="55" y1="55" x2="71.98" y2="71.98"></line>'
        + '<polygon points="84,84 64.27,80.71 80.71,64.27" style="stroke:none;fill:currentColor"></polygon></svg>';
    const file = gen.glyphFile(markup, '#1e2a35');
    assert.ok(file.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"'), file.slice(0, 80));
    assert.ok(file.indexOf('viewBox="-8 -8 116 116"') > 0, 'padded box');
    assert.ok(file.indexOf(' fill="none" stroke="#1e2a35" stroke-width="6.5" stroke-linecap="butt" stroke-linejoin="round"') > 0, 'root paint as attributes');
    assert.ok(file.indexOf('<polygon points="84,84 64.27,80.71 80.71,64.27" stroke="none" fill="#1e2a35">') > 0, 'child paint as attributes');
    for (const gone of ['style=', 'currentColor', 'class=', 'data-glyph', 'aria-hidden', 'focusable']) {
        assert.ok(file.indexOf(gone) < 0, gone + ' is gone');
    }
    assert.ok(file.endsWith('</svg>\n'));
    // a wider box keeps its aspect
    const wide = gen.glyphFile(markup.replace('0 0 100 100', '0 0 160 100'), '#000');
    assert.ok(wide.indexOf('width="48.55" height="32" viewBox="-8 -8 176 116"') > 0, wide.slice(0, 120));
    assert.throws(() => gen.glyphFile('<svg viewBox="0 0 10 10"></svg>', '#000'), /viewBox/);
});

test('rst text: inline markup disarmed', () => {
    assert.strictEqual(gen.rstText("enter text -- ',' means OR, '+' means AND"), "enter text -- ',' means OR, '+' means AND");
    assert.strictEqual(gen.rstText('a *b* `c` d_e |f| g\\h'), 'a \\*b\\* \\`c\\` d\\_e \\|f\\| g\\\\h');
    // a lone "+" is a list marker to rst, "X+" and "Y-" are not
    assert.strictEqual(gen.rstText('+'), '\\+');
    assert.strictEqual(gen.rstText('- narrow'), '\\- narrow');
    assert.strictEqual(gen.rstText('X+'), 'X+');
    assert.strictEqual(gen.rstText('Y-'), 'Y-');
    assert.strictEqual(gen.rstText('1. first'), '1\\. first');
    assert.strictEqual(gen.rstText('R'), 'R');
});

test('the union: the panel\'s order kept, a two-faced button one row, "shown for" by tree', () => {
    const trees = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
    const reading = {trees: [
        {key: 'a', rows: [
            {section: '#header', group: '', name: '', glyph: 'moon', words: 'theme', state: ''},
            {section: 'View & Tools', group: '', name: '', glyph: 'ladderize_asc', words: 'ladderize all', state: ''},
            {section: '#header', group: '', name: '', glyph: 'sun', words: 'theme', state: 'after a click on .aptx-theme-btn'},
            {section: 'View & Tools', group: '', name: '', glyph: 'ladderize_desc', words: 'ladderize all', state: 'after a click on #ladderize_b'}
        ]},
        {key: 'b', rows: [
            {section: '#header', group: '', name: '', glyph: 'moon', words: 'theme', state: ''},
            {section: '#modebar', group: '', name: '', glyph: 'rectangular', words: 'rectangular layout', state: ''},
            {section: 'Heat Map', group: '', name: 'Order columns', glyph: null, words: 'how', state: ''},
            {section: 'View & Tools', group: '', name: '', glyph: 'ladderize_asc', words: 'ladderize all', state: ''}
        ]},
        {key: 'c', rows: [
            {section: '#header', group: '', name: '', glyph: 'moon', words: 'theme', state: ''},
            {section: '#modebar', group: '', name: '', glyph: 'rectangular', words: 'rectangular layout', state: ''},
            {section: 'View & Tools', group: '', name: '', glyph: 'ladderize_asc', words: 'ladderize all', state: ''}
        ]}
    ]};
    const u = gen.unite(reading, trees);
    assert.deepStrictEqual(u.sections, ['Panel header', 'Layout and display type', 'Heat Map', 'View & Tools']);
    // a launch that reports the panel's own section order (hidden sections
    // too) leads: the sections no sheet showed together go where the panel
    // has them
    // ... and a section of the panel's that no sheet put a row in is left out
    reading.trees[0].sectionOrder = ['#header', '#modebar', '#other', 'Display Data', 'Heat Map', 'View & Tools'];
    reading.trees[1].sectionOrder = ['#header', '#modebar', 'Display Data', 'Domain Architectures', 'Heat Map', 'View & Tools'];
    assert.deepStrictEqual(gen.unite(reading, trees).sections,
        ['Panel header', 'Layout and display type', 'Heat Map', 'View & Tools']);
    // (rows come in the panel's order, as a sheet lists them)
    reading.trees[1].rows.splice(2, 0,
        {section: 'Display Data', group: '', name: 'Confidence', glyph: null, words: 'c', state: ''},
        {section: 'Domain Architectures', group: '', name: 'Track width', glyph: null, words: 'w', state: ''});
    assert.deepStrictEqual(gen.unite(reading, trees).sections,
        ['Panel header', 'Layout and display type', 'Display Data', 'Domain Architectures', 'Heat Map', 'View & Tools']);
    assert.deepStrictEqual(u.rows.map((r) => [r.section, r.name || r.glyphs.join('+'), r.where]), [
        ['Panel header', 'moon+sun', 'all demos'],
        ['Layout and display type', 'rectangular', 'all demos but a'],
        ['Heat Map', 'Order columns', 'b'],
        ['View & Tools', 'ladderize_asc+ladderize_desc', 'all demos']
    ]);
});

test('one order out of many runs: each run\'s order kept, a choice goes to the item seen first', () => {
    assert.deepStrictEqual(gen.mergeOrders([['a', 'b', 'd'], ['a', 'c', 'd'], ['x', 'a']]), ['x', 'a', 'b', 'c', 'd']);
    // a run read later still goes where every run allows
    assert.deepStrictEqual(gen.mergeOrders([['a', 'd'], ['a', 'b', 'c', 'd']]), ['a', 'b', 'c', 'd']);
    // the same item twice in a run (a control read twice) is no contradiction
    assert.deepStrictEqual(gen.mergeOrders([['a', 'a', 'b']]), ['a', 'b']);
    // runs that contradict each other: the item seen first goes next
    assert.deepStrictEqual(gen.mergeOrders([['a', 'b'], ['b', 'a']]), ['a', 'b']);
    // a grouping keeps a control's wordings together where the runs allow
    assert.deepStrictEqual(gen.mergeOrders([['a', 'r1', 'b'], ['a', 'r2', 'b'], ['a', 'q', 'b']],
        (k) => k.replace(/\d$/, '')), ['a', 'r1', 'r2', 'q', 'b']);
    assert.deepStrictEqual(gen.mergeOrders([]), []);
});

test('the user-facing page: one row per control, every wording and every face on it', () => {
    const ids = (a) => new Set(a);
    const rows = [
        {section: 'Display Data', group: 'Options', name: 'Scale Axis', words: 'a distance axis', glyphs: [], ids: ids(['axis_cb'])},
        {section: 'Display Data', group: 'Options', name: 'Scale Axis', words: 'a time axis', glyphs: [], ids: ids(['axis_cb'])},
        // the circular variant comes first in the panel's union, but fewer trees show it
        {section: 'View & Tools', group: '', name: '+', words: 'zoom in', glyphs: [], ids: ids(['zoomin_y']), shownFor: ids(['circular'])},
        {section: 'View & Tools', group: '', name: 'Y+', words: 'zoom in vertically', glyphs: [], ids: ids(['zoomin_y']), shownFor: ids(['a', 'b', 'c'])},
        {section: 'View & Tools', group: '', name: '', words: 'fit the width', glyphs: ['fit_width'], ids: ids(['fitwidth'])},
        {section: 'View & Tools', group: '', name: '', words: 'flip the labels', glyphs: ['labels_radial', 'labels_horizontal'], ids: ids(['fitwidth'])},
        {section: 'Panel header', group: '', name: '', words: 'theme', glyphs: ['moon', 'sun'], ids: ids([])}
    ];
    const m = gen.mergeByControl(rows);
    assert.deepStrictEqual(m.map((r) => [r.names.join('/'), r.glyphs.join('+'), r.words.join('/')]), [
        ['Scale Axis', '', 'a distance axis/a time axis'],
        ['Y+/+', '', 'zoom in vertically/zoom in'],
        ['', 'fit_width+labels_radial+labels_horizontal', 'fit the width/flip the labels'],
        ['', 'moon+sun', 'theme']
    ]);
    // a cell of two paragraphs is indented to the cell's column
    const table = gen.listTable([1, 1], ['A', 'B'], [['x', ['one', 'two']]]);
    assert.ok(table.indexOf('   * - x\n     - one\n\n       two\n') > 0, table);
});

test('the selection launch: the first demo again, the setting on, the menu alone', () => {
    const {trees} = gen.demoTrees(null);
    const sel = gen.selectionLaunch(trees[0]);
    assert.strictEqual(sel.key, 'with enableManualNodeSelection');
    assert.strictEqual(sel.file, trees[0].file);
    assert.strictEqual(sel.config.enableManualNodeSelection, true);
    assert.strictEqual(sel.menuOnly, true);
    assert.ok(!trees[0].config.enableManualNodeSelection, 'the demo\'s own config is left alone');
});

test('a shortcut\'s keys for both platforms, from the chips of either', () => {
    assert.deepStrictEqual(gen.keyColumns(['⌘', '⇧', 'E']), {mac: '⌘⇧E', win: 'Ctrl+Shift+E'});
    assert.deepStrictEqual(gen.keyColumns(['Ctrl', 'Shift', 'E']), {mac: '⌘⇧E', win: 'Ctrl+Shift+E'});
    assert.deepStrictEqual(gen.keyColumns(['⌘', '0']), {mac: '⌘0', win: 'Ctrl+0'});
    assert.deepStrictEqual(gen.keyColumns(['Ctrl', '+']), {mac: '⌘+', win: 'Ctrl++'});
    assert.deepStrictEqual(gen.keyColumns(['⌘', '⇧', '<']), {mac: '⌘⇧<', win: 'Ctrl+Shift+<'});
    // a plain key is the same everywhere
    assert.deepStrictEqual(gen.keyColumns(['Esc']), {mac: 'Esc', win: 'Esc'});
    assert.deepStrictEqual(gen.keyColumns(['PageUp']), {mac: 'PageUp', win: 'PageUp'});
});

test('the node menu: labels keyed without their value, words from the table or the greyed reason, a new entry is a problem', () => {
    assert.strictEqual(gen.menuLabel('Access DB [P12345]'), 'Access DB [accession]');
    assert.strictEqual(gen.menuLabel('Access DB [YBL23344.1]'), 'Access DB [accession]');
    assert.strictEqual(gen.menuLabel('Delete Subtree'), 'Delete Subtree');
    // every entry the viewer builds has words
    for (const label of ['Display Node Data', 'Switch to Subtree', 'Collapse/Uncollapse', 'Uncollapse Subtree',
        'Swap Descendants', 'Ladderize Subtree', 'Reroot', 'Select/Deselect Node', 'Select/Deselect Tips',
        'Download Ext. Node Data', 'List Sequences in Fasta', 'Download Sequences in Fasta', 'Access DB [accession]',
        'Delete Subtree', 'Delete External Node']) {
        assert.ok(gen.MENU_WORDS[label], label + ' has words');
    }
    const launch = {key: 'beast', menu: {menus: [
        {at: 'a tip', entries: [
            {label: 'Display Node Data', disabled: false, title: '', danger: false},
            {label: 'Collapse/Uncollapse', disabled: true, title: '', danger: false},
            {label: 'Reroot', disabled: true, title: 'Time trees can\'t be re-rooted.', danger: false},
            {label: 'Access DB [P12345]', disabled: false, title: '', danger: false},
            {label: 'Frobnicate', disabled: false, title: '', danger: false}
        ]}
    ]}};
    const r = gen.menuRows(launch);
    assert.deepStrictEqual(r.rows.map((x) => [x.section, x.name, x.words]), [
        ['Node menu', 'Display Node Data', gen.MENU_WORDS['Display Node Data']],
        ['Node menu', 'Collapse/Uncollapse', gen.MENU_WORDS['Collapse/Uncollapse']],
        ['Node menu', 'Reroot', 'Time trees can\'t be re-rooted.'],
        ['Node menu', 'Access DB [accession]', gen.MENU_WORDS['Access DB [accession]']]
    ]);
    assert.deepStrictEqual(r.problems, ['a node menu entry without words: "Frobnicate"']);
    assert.deepStrictEqual(gen.menuRows({key: 'x'}), {rows: [], problems: []});
});

test('the menu union: the demos that read it, the selection launch named on its own, the greyed reason its own row', () => {
    const entry = (label, title) => ({label: label, disabled: !!title, title: title || '', danger: false});
    const trees = [{key: 'apaf', config: {}}, {key: 'beast', config: {}}, {key: 'circular', config: {layout: 'circular'}}];
    const reading = {trees: [
        {key: 'apaf', rows: [], menu: {menus: [{entries: [entry('Display Node Data'), entry('Reroot'), entry('Delete Subtree')]}]}},
        {key: 'beast', rows: [], menu: {menus: [{entries: [entry('Display Node Data'), entry('Reroot', 'no: a time tree')]}]}},
        {key: 'circular', rows: []},
        {key: 'with enableManualNodeSelection', rows: [], menu: {menus: [{entries: [
            entry('Display Node Data'), entry('Reroot'), entry('Select/Deselect Node')]}]}}
    ]};
    const u = gen.menuUnion(reading, trees);
    assert.deepStrictEqual(u.problems, []);
    // every launch's order is kept, the two wordings of Reroot stand
    // together, and between rows no launch orders the one seen first leads
    assert.deepStrictEqual(u.rows.map((r) => [r.name, r.where]), [
        ['Display Node Data', 'all demos; with enableManualNodeSelection'],
        ['Reroot', 'apaf; with enableManualNodeSelection'],
        ['Reroot', 'beast'],
        ['Delete Subtree', 'apaf'],
        ['Select/Deselect Node', 'with enableManualNodeSelection']
    ]);
    // a time tree read first: its greyed Reroot still follows the plain one,
    // which more launches show
    const swapped = {trees: [reading.trees[1], reading.trees[0], reading.trees[2], reading.trees[3]]};
    assert.deepStrictEqual(gen.menuUnion(swapped, trees).rows.map((r) => [r.name, r.where]), [
        ['Display Node Data', 'all demos; with enableManualNodeSelection'],
        ['Reroot', 'apaf; with enableManualNodeSelection'],
        ['Reroot', 'beast'],
        ['Delete Subtree', 'apaf'],
        ['Select/Deselect Node', 'with enableManualNodeSelection']
    ]);
    // the user page: one row per entry, the words most launches gave first,
    // the greyed reason a second paragraph
    const m = gen.mergeByControl(u.rows);
    assert.deepStrictEqual(m.map((r) => [r.names.join('/'), r.words.length]), [
        ['Display Node Data', 1], ['Reroot', 2], ['Delete Subtree', 1], ['Select/Deselect Node', 1]
    ]);
    assert.deepStrictEqual(m[1].words, [gen.MENU_WORDS.Reroot, 'no: a time tree']);
});

test('the Download menu: one row per format under the menu\'s heading, the words the menu\'s own', () => {
    const launch = {key: 'apaf', rows: [
        {section: 'Search', group: '', name: 'Search', glyph: null, words: 'find', state: ''},
        {section: 'Download', group: '', name: 'Download…', glyph: null, words: 'download the tree', state: ''},
        {section: 'Download', group: '', name: 'Download…', glyph: null, words: 'download the tree', state: 'after a click on #ladderize_b'}],
        downloads: {entries: [
            {heading: 'Graphics, as shown', label: 'SVG', detail: 'vector: edit it', warn: false, disabled: false},
            {heading: 'Graphics, as shown', label: 'PNG', detail: 'image, at 2× the screen\'s resolution', warn: false, disabled: false},
            {heading: 'Tree: the subtree on view', label: 'Nexus', detail: 'the tree only: why. phyloXML keeps them.', warn: true, disabled: false},
            {heading: 'Tip data', label: 'TSV', detail: '', warn: false, disabled: false}
        ]}};
    const d = gen.downloadRows(launch);
    assert.deepStrictEqual(d.rows.map((r) => [r.section, r.group, r.id, r.name, r.words]), [
        ['Download', 'Download… menu: Graphics', 'download:SVG', 'SVG', 'vector: edit it'],
        ['Download', 'Download… menu: Graphics', 'download:PNG', 'PNG', 'image, at 2× the screen\'s resolution'],
        ['Download', 'Download… menu: Tree', 'download:Nexus', 'Nexus', 'the tree only: why. phyloXML keeps them.']
    ]);
    assert.deepStrictEqual(d.problems, ['a download format without words: "TSV"']);
    assert.deepStrictEqual(gen.downloadRows({key: 'x', rows: []}), {rows: [], problems: []});
    // the rows join the panel's first pass right after the Download section's
    // own controls, before the passes after a click
    const w = gen.withDownloads({version: 'v', trees: [launch]});
    assert.deepStrictEqual(w.problems, ['apaf: a download format without words: "TSV"']);
    assert.strictEqual(w.reading.version, 'v');
    assert.deepStrictEqual(w.reading.trees[0].rows.map((r) => r.name + (r.state ? '*' : '')),
        ['Search', 'Download…', 'SVG', 'PNG', 'Nexus', 'Download…*']);
    assert.strictEqual(launch.rows.length, 3, 'the reading is not changed in place');
    const u = gen.unite(w.reading, [{key: 'apaf'}]);
    assert.deepStrictEqual(u.rows.map((r) => [r.group, r.name]), [
        ['', 'Search'], ['', 'Download…'], ['Download… menu: Graphics', 'SVG'], ['Download… menu: Graphics', 'PNG'], ['Download… menu: Tree', 'Nexus']
    ]);
    // a second launch with a row the first has not, ahead of the section:
    // the formats still follow the section's controls
    const other = {key: 'bcl2', rows: [
        {section: 'Search', group: '', name: 'Search', glyph: null, words: 'find', state: ''},
        {section: 'Search', group: '', name: 'Negate', glyph: null, words: 'not', state: ''},
        {section: 'Download', group: '', name: 'Download…', glyph: null, words: 'download the tree', state: ''}],
        downloads: launch.downloads};
    const u2 = gen.unite(gen.withDownloads({trees: [launch, other]}).reading, [{key: 'apaf'}, {key: 'bcl2'}]);
    assert.deepStrictEqual(u2.rows.map((r) => r.name), ['Search', 'Negate', 'Download…', 'SVG', 'PNG', 'Nexus']);
});

console.log('All tests passed (' + n + ')');
