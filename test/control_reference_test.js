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
    assert.deepStrictEqual(u.rows.map((r) => [r.section, r.name || r.glyphs.join('+'), r.where]), [
        ['Panel header', 'moon+sun', 'all demos'],
        ['Layout and display type', 'rectangular', 'all demos but a'],
        ['Heat Map', 'Order columns', 'b'],
        ['View & Tools', 'ladderize_asc+ladderize_desc', 'all demos']
    ]);
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

console.log('All tests passed (' + n + ')');
