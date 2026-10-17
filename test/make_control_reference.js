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
// Two more sections follow the panel's: the keyboard shortcuts, read once from
// the viewer's own list (the About box's Keyboard row) with the other
// platform's keys derived from the chips; and the node menu, whose entries
// are read off the menu as it opens on a few nodes of every demo tree in the
// rectangular layout (a tip, a tip with an accession, an internal node, a
// child of the root), plus one launch of the first demo with
// enableManualNodeSelection, which adds two entries. The menu's entries carry
// no tooltip (a greyed one its reason), so the words of that section are
// MENU_WORDS below, written for the reference; a label without words stops
// the run, so a new entry is noticed.
//
//   node test/make_control_reference.js            writes docs/control-panel/
//   node test/make_control_reference.js --keep     also writes the raw reading
//                                                   (reading.json) beside it
//   --only apaf,circular                            these demo trees alone
//                                                   (for a look; the files it
//                                                   writes are then partial)
//   --settle 3000                                   ms to wait after a launch
//   --from docs/control-panel/reading.json          the rst from a reading kept
//                                                   by --keep, no browser
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
// The launch that is not a demo: the first demo tree with the setting that
// adds the two selection entries to the node menu.
const SELECTION_KEY = 'with enableManualNodeSelection';
const KEYS_SECTION = 'Keyboard shortcuts';
const MENU_SECTION = 'Node menu';
// The node menu's entries and what they do, in the sheet's voice (the viewer
// gives the entries no tooltip). An entry whose label carries a value is
// keyed by menuLabel().
const MENU_WORDS = {
    'Display Node Data': 'show what the file says about this node: name, branch length, date, taxonomy, '
        + 'sequence, properties and the rest, in a window to copy from',
    'Switch to Subtree': 'show only the clade under this node, as a tree of its own (for a tip, its parent\'s '
        + 'clade); the whole-tree button of View & Tools, or Esc, returns to the whole tree',
    'Collapse/Uncollapse': 'fold the clade under this node into a wedge, or open it again; greyed for a tip and '
        + 'in the unrooted layout',
    'Uncollapse Subtree': 'open every collapsed clade under this node; greyed when nothing below it is collapsed',
    'Swap Descendants': 'exchange the order of this node\'s child clades',
    'Ladderize Subtree': 'order the clades under this node by size, largest first or smallest first in turn',
    'Reroot': 're-root the tree on the branch above this node; when the new root would change the clade of an '
        + 'internal node that carries data, a warning says how many before anything changes',
    'Select/Deselect Node': 'add this node to the selection, or take it out; offered when the host page enables '
        + 'manual node selection',
    'Select/Deselect All Ext Nodes': 'add every tip under this node to the selection, taking out those already '
        + 'in it; offered when the host page enables manual node selection',
    'Download Ext. Node Data': 'download the tips under this node as a tab-separated table: name, taxonomy, '
        + 'sequence, branch length and one column per property',
    'List Sequences in Fasta': 'show the molecular sequences of the tips under this node in FASTA format, in a '
        + 'window to copy from; offered when the tree carries sequences',
    'Download Sequences in Fasta': 'download the molecular sequences of the tips under this node as a FASTA '
        + 'file; offered when the tree carries sequences',
    'Access DB [accession]': 'open the database record of this node\'s accession (NCBI protein or nucleotide, '
        + 'RefSeq, UniProt) in a new browser tab; offered when the node has one, among its properties or '
        + 'sequences or as a UniProt-style name such as CASP9_HUMAN',
    'Delete Subtree': 'remove this node and its whole clade from the tree on view; the visualizations and the '
        + 'search are recomputed on what is left; not offered in a subtree view',
    'Delete External Node': 'remove this tip from the tree on view; the visualizations and the search are '
        + 'recomputed on what is left; not offered in a subtree view'
};

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

// The one launch that is no demo: the given tree again, with the setting that
// adds the selection entries to the node menu; the page reads the menu alone.
function selectionLaunch(tree) {
    return {key: SELECTION_KEY, file: tree.file,
        config: Object.assign({}, tree.config, {enableManualNodeSelection: true}), menuOnly: true};
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

// One order out of many: each run (a pass over the panel, one node's menu)
// lists its items in the panel's order; the merged order keeps every run's
// order, and where the runs leave a choice takes another wording of the
// control just placed (groupOf names the control), else the item seen first.
// (A newcomer placed after its predecessor alone put a control's second
// wording ahead of the controls between the two.) Runs that contradict each
// other cannot all be kept; then the item seen first goes next.
function mergeOrders(runs, groupOf) {
    const first = [];                 // items, in order of first sighting
    const before = new Map();         // item -> the items that must precede it
    const add = (item) => {
        if (!before.has(item)) {
            before.set(item, new Set());
            first.push(item);
        }
    };
    for (const run of runs) {
        let prev = null;
        for (const item of run) {
            add(item);
            if (prev !== null && prev !== item) {
                before.get(item).add(prev);
            }
            prev = item;
        }
    }
    const out = [];
    const done = new Set();
    while (out.length < first.length) {
        const ready = first.filter((it) => !done.has(it) && Array.from(before.get(it)).every((b) => done.has(b)));
        let pick = ready[0];
        if (groupOf && out.length > 0) {
            const last = groupOf(out[out.length - 1]);
            pick = ready.find((it) => groupOf(it) === last) || pick;
        }
        if (pick === undefined) {
            pick = first.find((it) => !done.has(it));   // a contradiction: the earliest seen
        }
        out.push(pick);
        done.add(pick);
    }
    return out;
}

function unite(reading, trees) {
    const rows = new Map();        // key -> row
    const sectionOf = (r) => UNTITLED[r.section] || r.section;
    const keyOfRow = (r) => [sectionOf(r), r.group, r.name, r.words].join('\u0000');
    // A launch's rows come in runs, each a pass over the whole panel (the
    // baseline, then one per clicked extra) or over one node's menu; a run
    // is in the panel's order, and the union keeps every run's order.
    const runOf = (r) => (r.segment !== undefined ? r.segment : (r.state || ''));
    const sectionRuns = [];
    const rowRuns = [];
    for (const t of reading.trees) {
        // the panel's own order of its sections, the hidden ones included,
        // leads: no one sheet shows every section
        if (t.sectionOrder) {
            sectionRuns.push(t.sectionOrder.map((s) => UNTITLED[s] || s));
        }
        let run = null;
        let runKey = null;
        for (const r of t.rows) {
            if (run === null || runOf(r) !== runKey) {
                run = [];
                runKey = runOf(r);
                rowRuns.push(run);
                sectionRuns.push([]);
            }
            const section = sectionOf(r);
            const key = keyOfRow(r);
            run.push(key);
            sectionRuns[sectionRuns.length - 1].push(section);
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
        }
    }
    const names = trees.map((t) => t.key);
    const list = mergeOrders(rowRuns, (k) => keyOf(rows.get(k))).map((k) => rows.get(k));
    // a control's wordings stand together; the one most launches show leads
    // (the plain Reroot before a time tree's greyed reason, whichever demo
    // came first)
    for (let i = 0; i < list.length;) {
        let j = i + 1;
        while (j < list.length && keyOf(list[j]) === keyOf(list[i])) {
            ++j;
        }
        const run = list.slice(i, j).sort((a, b) => b.shownFor.size - a.shownFor.size);
        list.splice(i, j - i, ...run);
        i = j;
    }
    // a section the panel has but no sheet put a row in (a legend-less
    // fieldset of the panel's own) is no section of the reference
    const sections = mergeOrders(sectionRuns).filter((sec) => list.some((r) => r.section === sec));
    for (const row of list) {
        // "all demos" when every tree showed it; "all demos but" the few that
        // did not when most did; else which did. A launch that is not among
        // the demos (the selection launch) is named on its own. A row read
        // only after a click says so.
        const seen = names.filter((k) => row.shownFor.has(k));
        const other = Array.from(row.shownFor).filter((k) => names.indexOf(k) < 0);
        let where;
        if (seen.length === names.length) {
            where = 'all demos';
        } else if (seen.length > names.length / 2) {
            where = 'all demos but ' + names.filter((k) => !row.shownFor.has(k)).join(', ');
        } else {
            where = seen.join(', ');
        }
        if (other.length > 0) {
            where = (where ? where + '; ' : '') + other.join(', ');
        }
        if (!row.states.has('')) {
            where += ' (after a click on the control)';
        }
        row.where = where;
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

// ------------------------------------------------- the menu and the keys

// An entry's label without the value it carries: "Access DB [P12345]" is the
// one entry whatever the accession.
function menuLabel(label) {
    return label.replace(/^Access DB \[.*\]$/, 'Access DB [accession]');
}

// The menu entries one launch read, as rows for unite(): one per entry, its
// words from MENU_WORDS, or, for a greyed entry that says why, that reason.
// An entry without words is a problem, never a blank row.
function menuRows(launch) {
    const rows = [];
    const problems = [];
    const menus = (launch.menu && launch.menu.menus) || [];
    for (const m of menus) {
        for (const e of (m.entries || [])) {
            const label = menuLabel(e.label);
            let words;
            if (e.disabled && e.title) {
                words = e.title;
            } else if (Object.prototype.hasOwnProperty.call(MENU_WORDS, label)) {
                words = MENU_WORDS[label];
            } else {
                if (problems.indexOf(label) < 0) {
                    problems.push(label);
                }
                continue;
            }
            rows.push({section: MENU_SECTION, group: '', id: label, name: label, glyph: null, words: words, state: '',
                segment: m.at || ''});
        }
    }
    return {rows: rows, problems: problems.map((l) => 'a node menu entry without words: "' + l + '"')};
}

// The union of the menus over the launches, the demo trees being those the
// menu was read on (the rectangular layout: the page finds a node by its
// place, which it knows there).
function menuUnion(reading, trees) {
    const problems = [];
    const launches = reading.trees.filter((t) => t.menu).map((t) => {
        const r = menuRows(t);
        problems.push(...r.problems.map((p) => t.key + ': ' + p));
        return {key: t.key, rows: r.rows};
    });
    const u = unite({trees: launches}, trees.filter((t) => menuRead(t)));
    return {rows: u.rows, problems: problems};
}

function menuRead(tree) {
    return ((tree.config && tree.config.layout) || 'rectangular') === 'rectangular';
}

// A shortcut's key chips as the viewer drew them on the machine that read
// them (⌘ ⇧ E on a Mac, Ctrl Shift E elsewhere), as both platforms' keys. A
// chip that is no modifier is a plain key, the same everywhere.
function keyColumns(keys) {
    const first = keys[0] || '';
    if (first !== '\u2318' && first !== 'Ctrl') {
        return {mac: keys.join(' '), win: keys.join(' ')};
    }
    const shift = keys.indexOf('\u21e7') >= 0 || keys.indexOf('Shift') >= 0;
    const rest = keys.filter((k) => ['\u2318', '\u21e7', 'Ctrl', 'Shift'].indexOf(k) < 0);
    return {
        mac: '\u2318' + (shift ? '\u21e7' : '') + rest.join(''),
        win: ['Ctrl'].concat(shift ? ['Shift'] : []).concat(rest).join('+')
    };
}

function shortcutRows(shortcuts) {
    return shortcuts.rows.map((r) => {
        const c = keyColumns(r.keys);
        return [rstText(c.mac), rstText(c.win), rstText(r.words)];
    });
}

const KEYS_INTRO = 'The same actions on every platform; only the modifier differs: \u2318 on macOS,\n'
    + 'Ctrl on Windows and Linux. In the viewer, \u2318/ (Ctrl+/) shows this list, drawn for\n'
    + 'the platform you are on, and the About box (a click on the program name) links\n'
    + 'to it.\n\n';
const MENU_INTRO = 'A click on a node, on its point or its label, opens a menu named after the\n'
    + 'node. What it offers depends on the node: a tip cannot be collapsed, a child\n'
    + 'of the root cannot be switched to or re-rooted on, the root has no menu, and\n'
    + 'an entry the tree does not allow is greyed, with a tooltip that says why.\n\n';

function keysSection(reading, ch) {
    let out = heading(KEYS_SECTION, ch);
    out += KEYS_INTRO;
    out += listTable([18, 24, 58], ['macOS', 'Windows / Linux', 'What it does'], shortcutRows(reading.shortcuts));
    for (const note of reading.shortcuts.notes) {
        out += rstText(note) + '\n\n';
    }
    return out;
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
    const now = new Date();
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-'
        + String(now.getDate()).padStart(2, '0');
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

function makeRst(union, menu, reading, trees, skipped, glyphInfo) {
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
    out += keysSection(reading, '-');
    out += heading(MENU_SECTION, '-');
    out += MENU_INTRO;
    out += 'The labels and the greyed entries\' reasons are read from the menu, opened on a tip, a\n'
        + 'tip with an accession, an internal node and a child of the root of each demo tree\n'
        + 'shown in the rectangular layout, and once more on the first demo launched with\n'
        + '``enableManualNodeSelection``, which adds two entries. The words of this table are\n'
        + 'NOT the viewer\'s: its entries carry no tooltip, so they were written for this\n'
        + 'reference and are to be checked like any draft.\n\n';
    out += listTable([24, 56, 20], ['Entry', 'What it does', 'Shown for'],
        menu.rows.map((r) => [rstText(r.name), rstText(r.words), rstText(r.where)]));
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
function makePlainRst(union, menu, reading) {
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
    out += keysSection(reading, '=');
    out += heading(MENU_SECTION, '=');
    out += MENU_INTRO;
    out += listTable([28, 72], ['Entry', 'What it does'],
        mergeByControl(menu.rows).map((r) => [rstText(r.names.join(' / ')), r.words.map(rstText)]));
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
    const fromAt = argv.indexOf('--from');
    const {trees, skipped} = demoTrees(only);
    let reading;
    if (fromAt >= 0) {
        reading = JSON.parse(fs.readFileSync(argv[fromAt + 1], 'utf8'));
        process.stderr.write('from ' + argv[fromAt + 1] + ': ' + reading.trees.length + ' launches read on '
            + reading.version + '\n');
    } else {
        process.stderr.write('reading the panel of ' + trees.length + ' demo trees'
            + (skipped.length ? ' (' + skipped.join(', ') + ' left out: the panel is folded)' : '') + ' ...\n');
        const launches = trees.length > 0 ? trees.concat([selectionLaunch(trees[0])]) : trees;
        reading = await readPanels(launches, settle);
    }
    let bad = 0;
    for (const t of reading.trees) {
        for (const p of t.problems) {
            process.stderr.write('  PROBLEM ' + t.key + ': ' + p + '\n');
            ++bad;
        }
        const menus = t.menu ? t.menu.menus.length + ' menus' + (t.menu.skipped ? ' (' + t.menu.skipped + ')' : '')
            : 'no menu';
        process.stderr.write('  ' + t.key + ': ' + t.rows.length + ' rows, ' + menus + '\n');
    }
    if (!reading.shortcuts || reading.shortcuts.rows.length === 0) {
        process.stderr.write('  PROBLEM: the shortcut list was not read\n');
        ++bad;
    }
    const menu = menuUnion(reading, trees);
    for (const p of menu.problems) {
        process.stderr.write('  PROBLEM ' + p + '\n');
        ++bad;
    }
    if (menu.rows.length === 0) {
        process.stderr.write('  PROBLEM: no node menu was read\n');
        ++bad;
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
    fs.writeFileSync(RST, makeRst(union, menu, reading, trees, skipped, glyphInfo));
    fs.writeFileSync(RST_PLAIN, makePlainRst(union, menu, reading));
    if (keep) {
        fs.writeFileSync(path.join(OUT_DIR, 'reading.json'), JSON.stringify(reading, null, 2));
    }
    process.stderr.write('wrote ' + path.relative(ROOT, RST) + ': ' + union.rows.length + ' rows in '
        + union.sections.length + ' sections; ' + path.relative(ROOT, RST_PLAIN) + ': '
        + mergeByControl(union.rows).length + ' controls; ' + reading.shortcuts.rows.length + ' shortcuts; '
        + mergeByControl(menu.rows).length + ' node menu entries (' + menu.rows.length + ' rows); '
        + glyphInfo.kinds.length + ' icons as SVG'
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
module.exports = {demoTrees, selectionLaunch, glyphFile, rstText, unite, mergeOrders, mergeByControl, listTable, menuLabel, menuRows,
    menuUnion, keyColumns, MENU_WORDS, UNTITLED, GLYPH_PAD, GLYPH_PX};
