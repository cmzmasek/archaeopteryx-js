// Generates docs/control-panel/: the control panel as reStructuredText, two
// documents, with the panel's icons as files beside them.
//
//   control-panel.rst   for whoever writes the documentation: one row per
//                       WORDING, with the demo trees that show it, and the
//                       icon files listed at the end
//   archaeopteryx.rst   the user-facing page (the replacement for BV-BRC's
//                       quick reference of the 2.x viewer): one row per
//                       CONTROL, its wordings as paragraphs of one cell, its
//                       faces side by side; no demo tree is mentioned
//
// The panel's cheat sheet ("Control panel: what each control does", the card
// button in the panel header) lists every control the panel is SHOWING, with
// the icon it draws and the sentence that explains it; a control the tree on
// view gives nothing to do is not drawn and so not listed. The reference is
// the union of that sheet over the demo trees of docs/demo.html, which
// together show every control there is (dated tips, genomes, alignments,
// domains, a heat map, geologic ages, a circular layout, several trees in one
// file). Each row keeps the sheet's own words -- the control's tooltip, no
// live value -- and adds what the sheet leaves out because the panel shows
// it: the section, the group heading, which demo trees show the control, and
// the icon as an image.
//
// The icons are written as they are drawn (test/browser/control_reference.html
// reads each <svg> off the panel; the kind is the svg's data-glyph attribute):
// one SVG per kind, the panel's light-theme ink in place of currentColor, the
// box padded so no stroke is clipped, and a PNG beside it for a LaTeX build.
// The rst refers to the SVGs, which GitHub's preview, docutils and Sphinx all
// draw; a LaTeX build takes the PNGs instead (the file's own comment says how).
//
//   node test/make_control_reference.js            writes docs/control-panel/
//   node test/make_control_reference.js --keep     also writes the raw reading
//                                                   (reading.json) beside it
//   --only apaf,circular                            these demo trees alone
//                                                   (for a look; the files it
//                                                   writes are then partial)
//   --settle 3000                                   ms to wait after a launch
//
// Needs Chrome (test/browser/cdp_run.js finds it; CHROME=<path> overrides)
// and rsvg-convert for the PNGs (brew install librsvg); without the latter the
// SVGs and the rst are still written and the PNGs are said to be missing.
// `npm run docs:sync` first: the page reads docs/lib/.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');
const {spawn, spawnSync} = require('child_process');

const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'docs', 'demo.html');
const OUT_DIR = path.join(ROOT, 'docs', 'control-panel');
const GLYPH_DIR = path.join(OUT_DIR, 'glyphs');
const RST = path.join(OUT_DIR, 'control-panel.rst');
const RST_PLAIN = path.join(OUT_DIR, 'archaeopteryx.rst');
const PLAIN_TITLE = 'Archaeopteryx.js Phylogenetic Tree Viewer';
const HARNESS = 'test/browser/control_reference.html';
const CDP = path.join(__dirname, 'browser', 'cdp_run.js');

// The sections the panel draws without a legend, and the header, named here.
const UNTITLED = {
    '#header': 'Panel header',
    '#picker': 'Tree picker',
    '#modebar': 'Layout and display type',
    '#other': 'Other'
};
// The panel is read at this window size: tall enough that no section is
// folded to keep the panel on one screen.
const WINDOW = {w: 1400, h: 3200};
// An icon file: this many px tall, with this much of the 100-unit box added
// on every side (a stroke of up to 11 units runs to the box's edge, and a
// file, unlike the panel, has no overflow:visible).
const GLYPH_PX = 32;
const GLYPH_PAD = 8;
const PNG_PX = 128;
// How tall an icon stands in a line of the reference.
const INLINE_HEIGHT = '1.3em';
// Controls whose face a click changes, read in both states. The ladderize
// button and the theme switch show what the NEXT click does; the fit-width
// slot is the label-direction flip in the circular layout.
const EXTRAS_FIRST = ['#ladderize_b', '.aptx-theme-btn'];
const EXTRAS_CIRCULAR = ['#fitwidth'];

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.xml': 'text/xml',
    '.json': 'application/json', '.nex': 'text/plain', '.nexus': 'text/plain', '.css': 'text/css'};

function serve() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
            const file = path.join(ROOT, rel);
            if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
                res.writeHead(404);
                res.end('not found');
                return;
            }
            res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
            fs.createReadStream(file).pipe(res);
        });
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

// The demo page's tree table, which is kept in sync with index.html and the
// README: the one list of what there is to show.
function demoTrees(only) {
    const html = fs.readFileSync(DEMO, 'utf8');
    const m = html.match(/var TREES = (\{[\s\S]*?\n {4}\});/);
    if (!m) {
        throw new Error('docs/demo.html: the TREES table was not found');
    }
    const table = vm.runInNewContext('(' + m[1] + ')');
    const trees = [];
    const skipped = [];
    let first = true;
    for (const key of Object.keys(table)) {
        const t = table[key];
        const config = t.config || {};
        // a panel folded to its header shows no control
        if (config.collapseControlPanel) {
            skipped.push(key);
            continue;
        }
        if (only && only.indexOf(key) < 0) {
            continue;
        }
        const entry = {key: key, file: t.file, config: config};
        if (first) {
            entry.extras = EXTRAS_FIRST;
            first = false;
        }
        if (config.layout === 'circular') {
            entry.extras = (entry.extras || []).concat(EXTRAS_CIRCULAR);
        }
        trees.push(entry);
    }
    return {trees: trees, skipped: skipped};
}

// The page's console, as it comes, goes to stderr (the page says which tree
// and which step it is at); the result, printed once at the end, is kept.
async function readPanels(trees, settle) {
    const server = await serve();
    const port = server.address().port;
    const url = 'http://127.0.0.1:' + port + '/' + HARNESS + '?trees=' + encodeURIComponent(JSON.stringify(trees))
        + (settle ? '&settle=' + settle : '');
    const kept = [];
    const status = await new Promise((resolve) => {
        const child = spawn(process.execPath, [CDP, url, '1800', String(WINDOW.w), String(WINDOW.h)]);
        let buf = '';
        child.stdout.on('data', (d) => {
            buf += d;
            const lines = buf.split('\n');
            buf = lines.pop();
            for (const line of lines) {
                if (/^\[(console|exception)\]/.test(line)) {
                    process.stderr.write('  ' + line + '\n');
                } else {
                    kept.push(line);
                }
            }
        });
        child.stderr.on('data', (d) => process.stderr.write(d));
        child.on('close', (code) => {
            if (buf !== '') {
                kept.push(buf);
            }
            resolve(code);
        });
    });
    server.close();
    if (status !== 0) {
        throw new Error('cdp_run exited ' + status);
    }
    let wrapped;
    try {
        wrapped = JSON.parse(kept.join('\n'));
    } catch {
        throw new Error('the page returned no result');
    }
    return JSON.parse(wrapped.json);
}

// ---------------------------------------------------------------- the union

// Keeps `order` as the panel orders things: a newcomer goes after the item
// that preceded it where it was seen, or at the end.
function placeAfter(order, item, prev) {
    if (order.indexOf(item) >= 0) {
        return;
    }
    const at = prev === null ? -1 : order.indexOf(prev);
    if (at < 0) {
        order.push(item);
    } else {
        order.splice(at + 1, 0, item);
    }
}

function unite(reading, trees) {
    const sections = [];           // names, in the panel's order
    const rows = new Map();        // key -> row
    const rowOrder = [];           // keys, in the panel's order
    for (const t of reading.trees) {
        let prevSection = null;
        let prevRow = null;
        for (const r of t.rows) {
            const section = UNTITLED[r.section] || r.section;
            placeAfter(sections, section, prevSection);
            prevSection = section;
            const key = [section, r.group, r.name, r.words].join('\u0000');
            if (!rows.has(key)) {
                rows.set(key, {section: section, group: r.group, name: r.name, words: r.words,
                    glyphs: [], shownFor: new Set(), states: new Set(), ids: new Set()});
            }
            const row = rows.get(key);
            if (r.glyph && row.glyphs.indexOf(r.glyph) < 0) {
                row.glyphs.push(r.glyph);
            }
            row.shownFor.add(t.key);
            row.states.add(r.state || '');
            if (r.id) {
                row.ids.add(r.id);
            }
            placeAfter(rowOrder, key, prevRow);
            prevRow = key;
        }
    }
    const all = trees.length;
    const list = rowOrder.map((k) => rows.get(k));
    for (const row of list) {
        // "all demos" when every tree showed it; "all demos but" the few that
        // did not when most did; else which did. A row read only after a
        // click says so.
        const n = row.shownFor.size;
        if (n === all) {
            row.where = 'all demos';
        } else if (n > all / 2) {
            row.where = 'all demos but ' + trees.map((t) => t.key).filter((k) => !row.shownFor.has(k)).join(', ');
        } else {
            row.where = Array.from(row.shownFor).join(', ');
        }
        if (!row.states.has('')) {
            row.where += ' (after a click on the control)';
        }
    }
    return {sections: sections, rows: list};
}

// One row per control, for the user-facing page: a control whose tooltip or
// face changes with the tree or the layout (Scale Axis on a time tree, the
// fit-width slot in the circular layout, a greyed re-root button) keeps every
// wording, and every face, on its one row.
function mergeByControl(rows) {
    const out = [];
    const byKey = new Map();
    // the row keeps its place by its first variant; the variants come in
    // order of how many trees show them, so the default layout's name and
    // wording lead ("Y+ / +", not "+ / Y+")
    const seen = (r) => (r.shownFor ? r.shownFor.size : 0);
    const ordered = rows.map((r, i) => ({r: r, i: i}))
        .sort((a, b) => (seen(b.r) - seen(a.r)) || (a.i - b.i))
        .map((x) => x.r);
    const firstAt = new Map();
    rows.forEach((r, i) => {
        if (!firstAt.has(keyOf(r))) {
            firstAt.set(keyOf(r), i);
        }
    });
    for (const r of ordered) {
        const key = keyOf(r);
        let m = byKey.get(key);
        if (!m) {
            m = {section: r.section, group: r.group, names: [], glyphs: [], words: [], at: firstAt.get(key)};
            byKey.set(key, m);
            out.push(m);
        }
        if (r.name && m.names.indexOf(r.name) < 0) {
            m.names.push(r.name);
        }
        for (const g of r.glyphs) {
            if (m.glyphs.indexOf(g) < 0) {
                m.glyphs.push(g);
            }
        }
        if (m.words.indexOf(r.words) < 0) {
            m.words.push(r.words);
        }
    }
    return out.sort((a, b) => a.at - b.at);
}

function keyOf(r) {
    const id = Array.from(r.ids)[0] || '';
    return [r.section, r.group, id || (r.name + '\u0000' + r.words)].join('\u0000');
}

// ---------------------------------------------------------------- the files

// The <svg> as the panel draws it, made a file: inline styles back to
// attributes (the inverse of the viewer's paintInline), the ink fixed, the
// box padded, the viewer's own attributes dropped.
function glyphFile(markup, ink) {
    let s = markup.replace(/\sstyle="([^"]*)"/g, (all, css) => css.split(';').filter((d) => d.trim() !== '')
        .map((d) => {
            const i = d.indexOf(':');
            return ' ' + d.slice(0, i).trim() + '="' + d.slice(i + 1).trim() + '"';
        }).join(''));
    s = s.replace(/currentColor/g, ink);
    s = s.replace(/\s(class|data-glyph|aria-hidden|focusable)="[^"]*"/g, '');
    let done = false;
    s = s.replace(/viewBox="0 0 ([\d.]+) 100"/, (all, w) => {
        done = true;
        const W = parseFloat(w);
        const h = 100 + 2 * GLYPH_PAD;
        const ww = W + 2 * GLYPH_PAD;
        const px = Math.round(ww * GLYPH_PX / h * 100) / 100;
        return 'xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + GLYPH_PX
            + '" viewBox="' + (-GLYPH_PAD) + ' ' + (-GLYPH_PAD) + ' ' + ww + ' ' + h + '"';
    });
    if (!done) {
        throw new Error('a glyph without the expected viewBox: ' + markup.slice(0, 120));
    }
    return s + '\n';
}

function writeGlyphs(glyphs, ink) {
    fs.mkdirSync(GLYPH_DIR, {recursive: true});
    const kinds = Object.keys(glyphs).sort();
    const rsvg = spawnSync('rsvg-convert', ['--version'], {encoding: 'utf8'}).status === 0;
    let pngs = 0;
    for (const kind of kinds) {
        const svg = path.join(GLYPH_DIR, kind + '.svg');
        fs.writeFileSync(svg, glyphFile(glyphs[kind], ink));
        if (rsvg) {
            const png = path.join(GLYPH_DIR, kind + '.png');
            const r = spawnSync('rsvg-convert', ['-h', String(PNG_PX), '-o', png, svg], {encoding: 'utf8'});
            if (r.status !== 0) {
                throw new Error('rsvg-convert failed on ' + kind + ': ' + r.stderr);
            }
            ++pngs;
        }
    }
    return {kinds: kinds, pngs: pngs, rsvg: rsvg};
}

// ------------------------------------------------------------------ the rst

// Inline markup disarmed: a star, a backquote, a bar or an underscore in a
// tooltip is a character, not emphasis, a literal, a substitution or a link;
// and a cell that is a lone "+" or "-" (the widen / narrow buttons) or that
// opens like "1." is text, not a list item.
function rstText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/([*`|_])/g, '\\$1')
        .replace(/^([-+\u2022\u2023\u2043])(?=\s|$)/, '\\$1')
        .replace(/^(\(?(?:\d+|[a-zA-Z]|#))([.)])(?=\s|$)/, '$1\\$2');
}

function heading(text, ch) {
    const line = ch.repeat(Math.max(text.length, 3));
    return text + '\n' + line + '\n\n';
}

// A cell is a string, or an array of paragraphs.
function listTable(widths, header, rows) {
    let out = '.. list-table::\n   :header-rows: 1\n   :widths: ' + widths.join(' ') + '\n\n';
    const cell = (c) => Array.isArray(c) ? c.join('\n\n       ') : c;
    const line = (cells) => cells.map((c, i) => '   ' + (i === 0 ? '* - ' : '  - ') + cell(c) + '\n').join('');
    out += line(header);
    for (const r of rows) {
        out += line(r);
    }
    return out + '\n';
}

function controlCell(row) {
    const parts = row.glyphs.map((k) => '|' + k + '|');
    const names = row.names || (row.name ? [row.name] : []);
    if (names.length > 0) {
        parts.push(names.map(rstText).join(' / '));
    }
    return parts.join(' ') || '\u00a0';
}

function generatedComment(reading) {
    const today = new Date().toISOString().slice(0, 10);
    return '.. Generated by test/make_control_reference.js from Archaeopteryx.js '
        + reading.version + ' on ' + today + '.\n'
        + '   Do not edit: regenerate with  node test/make_control_reference.js\n'
        + '   The icons are in glyphs/, one SVG and one PNG per kind. The image\n'
        + '   directives name the SVGs, which GitHub, docutils and Sphinx HTML all draw;\n'
        + '   a LaTeX/PDF build wants the PNGs: write "glyphs/<kind>.*" instead (Sphinx\n'
        + '   then picks the SVG for HTML and the PNG for LaTeX) or load\n'
        + '   sphinx.ext.imgconverter.\n\n';
}

function substitutions(kinds) {
    let out = '';
    for (const kind of kinds) {
        // (no-scaled-link: Sphinx would otherwise wrap a scaled image in a
        // link to the file, underlined like one in most themes)
        out += '.. |' + kind + '| image:: glyphs/' + kind + '.svg\n'
            + '   :height: ' + INLINE_HEIGHT + '\n'
            + '   :alt: ' + kind.replace(/_/g, ' ') + '\n'
            + '   :class: no-scaled-link\n';
    }
    return out + '\n';
}

function groupsOf(rows) {
    const groups = [];
    for (const r of rows) {
        if (groups.indexOf(r.group) < 0) {
            groups.push(r.group);
        }
    }
    return groups;
}

function makeRst(union, reading, trees, skipped, glyphInfo) {
    let out = generatedComment(reading);
    out += heading('Control panel', '=').replace(/^/, '='.repeat(13) + '\n');
    out += 'Every control of the Archaeopteryx.js control panel, section by section in\n'
        + 'the panel\'s order, with the icon it draws and what it does. The words are\n'
        + 'the control\'s own tooltip, as the panel\'s cheat sheet lists them (the card\n'
        + 'button in the panel header, "Control panel: what each control does"); no\n'
        + 'row shows a live value. The panel draws a control only when the tree on view\n'
        + 'gives it something to do, so this is the union over the ' + trees.length
        + ' demo trees of\n``demo.html``, and the last column says which of them show the control.\n'
        + 'A control with two icons shows the one for what the next click will do.\n\n';
    // the substitutions, all of them, first
    out += substitutions(glyphInfo.kinds);
    for (const section of union.sections) {
        out += heading(section, '-');
        const inSection = union.rows.filter((r) => r.section === section);
        for (const group of groupsOf(inSection)) {
            if (group) {
                out += '.. rubric:: ' + rstText(group) + '\n\n';
            }
            const rows = inSection.filter((r) => r.group === group)
                .map((r) => [controlCell(r), rstText(r.words), rstText(r.where)]);
            out += listTable([24, 56, 20], ['Control', 'What it does', 'Shown for'], rows);
        }
    }
    // every icon, its file, where it is used
    out += heading('Icon files', '-');
    out += 'Each icon as the panel draws it, in ``glyphs/`` as ``<name>.svg`` and\n``<name>.png``.\n\n';
    const used = {};
    for (const r of union.rows) {
        for (const k of r.glyphs) {
            used[k] = used[k] || [];
            if (used[k].indexOf(r.section) < 0) {
                used[k].push(r.section);
            }
        }
    }
    out += listTable([12, 28, 60], ['Icon', 'File', 'Section'],
        glyphInfo.kinds.map((k) => ['|' + k + '|', '``' + k + '``', rstText((used[k] || []).join(', ') || '(not on the sheet)')]));
    if (skipped.length > 0) {
        out += '.. ' + skipped.join(', ') + ': launched with the panel folded, so not read.\n';
    }
    return out;
}

// The user-facing page: the title of the page it replaces, an overview, then
// the controls section by section. Nothing about demo trees.
function makePlainRst(union, reading) {
    const rows = mergeByControl(union.rows);
    const used = [];
    for (const r of rows) {
        for (const k of r.glyphs) {
            if (used.indexOf(k) < 0) {
                used.push(k);
            }
        }
    }
    used.sort();
    let out = generatedComment(reading);
    out += '='.repeat(PLAIN_TITLE.length) + '\n' + heading(PLAIN_TITLE, '=');
    out += substitutions(used);
    out += heading('Overview', '=');
    out += 'Archaeopteryx.js draws a phylogenetic tree and lets you change what it\n'
        + 'shows and how it is laid out, colour and shape its nodes by the data the\n'
        + 'tree carries, search it, and download it as an image or as a tree file.\n'
        + 'The control panel on the left holds every control; the sections below\n'
        + 'describe them in the panel\'s order, each with the icon it draws and what\n'
        + 'it does. The same descriptions are in the viewer itself: the card button\n'
        + 'in the panel header opens them for the tree on view.\n\n'
        + 'A control appears only when the tree on view gives it something to do:\n'
        + 'a tree without confidence values has no Confidence checkbox, a tree whose\n'
        + 'tips are not dated has no Time | Div switch, and a tree without an\n'
        + 'alignment has no Alignment checkbox. A control that reads differently in\n'
        + 'another layout or on another kind of tree is listed once, with each of\n'
        + 'its wordings; a button whose icon changes shows every icon it can wear.\n\n';
    out += heading('Controls', '=');
    for (const section of union.sections) {
        out += heading(section, '-');
        const inSection = rows.filter((r) => r.section === section);
        for (const group of groupsOf(inSection)) {
            if (group) {
                out += '.. rubric:: ' + rstText(group) + '\n\n';
            }
            const table = inSection.filter((r) => r.group === group)
                .map((r) => [controlCell(r), r.words.map(rstText)]);
            out += listTable([28, 72], ['Control', 'What it does'], table);
        }
    }
    return out;
}

// --------------------------------------------------------------------- main

async function main() {
    const argv = process.argv.slice(2);
    const keep = argv.indexOf('--keep') >= 0;
    const onlyAt = argv.indexOf('--only');
    const only = onlyAt >= 0 ? argv[onlyAt + 1].split(',') : null;
    const settleAt = argv.indexOf('--settle');
    const settle = settleAt >= 0 ? parseInt(argv[settleAt + 1], 10) : 0;
    const {trees, skipped} = demoTrees(only);
    process.stderr.write('reading the panel of ' + trees.length + ' demo trees'
        + (skipped.length ? ' (' + skipped.join(', ') + ' left out: the panel is folded)' : '') + ' ...\n');
    const reading = await readPanels(trees, settle);
    let bad = 0;
    for (const t of reading.trees) {
        for (const p of t.problems) {
            process.stderr.write('  PROBLEM ' + t.key + ': ' + p + '\n');
            ++bad;
        }
        process.stderr.write('  ' + t.key + ': ' + t.rows.length + ' rows\n');
    }
    if (bad > 0) {
        process.stderr.write('nothing written: ' + bad + ' problem(s) above\n');
        process.exit(1);
    }
    if (!reading.ink || !reading.version) {
        process.stderr.write('nothing written: the page reported no ink colour or no version\n');
        process.exit(1);
    }
    const union = unite(reading, trees);
    fs.mkdirSync(OUT_DIR, {recursive: true});
    const glyphInfo = writeGlyphs(reading.glyphs, reading.ink);
    fs.writeFileSync(RST, makeRst(union, reading, trees, skipped, glyphInfo));
    fs.writeFileSync(RST_PLAIN, makePlainRst(union, reading));
    if (keep) {
        fs.writeFileSync(path.join(OUT_DIR, 'reading.json'), JSON.stringify(reading, null, 2));
    }
    process.stderr.write('wrote ' + path.relative(ROOT, RST) + ': ' + union.rows.length + ' rows in '
        + union.sections.length + ' sections; ' + path.relative(ROOT, RST_PLAIN) + ': '
        + mergeByControl(union.rows).length + ' controls; ' + glyphInfo.kinds.length + ' icons as SVG'
        + (glyphInfo.rsvg ? ' and PNG' : ' (no rsvg-convert: no PNGs)') + ' in '
        + path.relative(ROOT, GLYPH_DIR) + '/\n');
}

if (require.main === module) {
    main().catch((e) => {
        process.stderr.write(String((e && e.stack) || e) + '\n');
        process.exit(1);
    });
}

// for test/control_reference_test.js: the parts that need no browser
module.exports = {demoTrees, glyphFile, rstText, unite, mergeByControl, listTable, UNTITLED, GLYPH_PAD, GLYPH_PX};
