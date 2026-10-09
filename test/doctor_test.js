// archaeopteryx.doctor(): the report on the state of the program, as far as
// Node can reach it -- the libraries' rows, the phyloxml round-trip probe, what
// a launch's warnings and a failed launch leave behind, and that it never
// throws. What the page shows (the dot, the About row, the dialog, Copy
// report, the optional export libraries) is test/browser/doctor.html.
//
// Each case loads the viewer AFRESH with the globals it needs: the UMD header
// takes forester and phyloXml from the global object when they are there,
// which is exactly how a page hands them over.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APX = path.join(ROOT, 'archaeopteryx.js');
const FORESTER = path.join(ROOT, 'forester.js');
const PHYLOXML = path.join(ROOT, 'node_modules', 'phyloxml', 'phyloxml.js');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

let failed = 0;
function test(name, fn) {
    let ok = false;
    let quiet = {warn: console.warn, error: console.error, log: console.log};
    let said = [];
    try {
        ok = fn(said) === true;
    } catch (e) {
        said.push('threw: ' + (e && e.stack ? e.stack : e));
    }
    console.warn = quiet.warn; console.error = quiet.error; console.log = quiet.log;
    console.log((name + ' '.repeat(60)).substring(0, 60) + ': ' + (ok ? 'pass' : 'FAIL'));
    if (!ok) {
        failed++;
        said.forEach(function (l) { console.log('    ' + l); });
    }
}

// A fresh viewer. `globals` are put on the global object for the load (and
// taken off again); the three files are dropped from the require cache so the
// factory really runs again.
function fresh(globals) {
    [APX, FORESTER, PHYLOXML].forEach(function (f) { delete require.cache[require.resolve(f)]; });
    let names = Object.keys(globals || {});
    names.forEach(function (k) { globalThis[k] = globals[k]; });
    let apx;
    try {
        apx = require(APX).archaeopteryx;
        // the report reads the globals again when it is asked
        return {apx: apx, report: function () { return apx.doctor(); },
            done: function () { names.forEach(function (k) { delete globalThis[k]; }); }};
    } catch (e) {
        names.forEach(function (k) { delete globalThis[k]; });
        throw e;
    }
}
function lib(rep, name) {
    return rep.libraries.find(function (l) { return l.name === name; });
}
function realPhyloXml() {
    delete require.cache[require.resolve(PHYLOXML)];
    return require(PHYLOXML).phyloXml;
}
function realForester() {
    delete require.cache[require.resolve(FORESTER)];
    return require(FORESTER).forester || require(FORESTER);
}
const TREE = '((a:1,b:2):1,c:3);';

test('a plain load: nothing to report, the shape of the report', function (said) {
    let v = fresh();
    let rep = v.report();
    v.done();
    let keys = Object.keys(rep).sort().join();
    if (keys !== 'environment,functions,launch,libraries,notes,ok,problems,program,summary,text,version') {
        said.push('keys: ' + keys);
        return false;
    }
    if (rep.program !== 'Archaeopteryx.js' || rep.version !== VERSION) {
        said.push(rep.program + ' ' + rep.version + ', package.json says ' + VERSION);
        return false;
    }
    if (rep.ok !== true || rep.problems.length !== 0 || rep.summary !== 'nothing to report') {
        said.push('ok ' + rep.ok + ', ' + rep.summary + ': ' + rep.problems.join(' || '));
        return false;
    }
    let names = rep.libraries.map(function (l) { return l.name; }).join();
    if (names !== 'forester.js,d3,phyloxml,sax,canvg,jspdf,svg2pdf.js') {
        said.push('libraries: ' + names);
        return false;
    }
    if (rep.launch !== null || !/\n {2}no tree is on view\n/.test(rep.text)) {
        said.push('launch: ' + JSON.stringify(rep.launch));
        return false;
    }
    // every row is fully formed, whatever it found
    let bad = rep.libraries.filter(function (l) {
        return typeof l.loaded !== 'boolean' || ['ok', 'absent', 'note', 'problem'].indexOf(l.status) < 0
            || typeof l.detail !== 'string' || ['required', 'optional'].indexOf(l.role) < 0;
    });
    if (bad.length > 0) {
        said.push('malformed rows: ' + JSON.stringify(bad));
        return false;
    }
    // in Node the optional libraries are absent, and d3 -- whatever require()
    // made of it, an ES-module namespace on a current Node -- is no fault
    let absent = ['canvg', 'jspdf', 'svg2pdf.js'].filter(function (n) { return lib(rep, n).status !== 'absent'; });
    if (absent.length > 0 || ['ok', 'absent'].indexOf(lib(rep, 'd3').status) < 0) {
        said.push('expected absent: ' + absent.join() + '; d3 is ' + lib(rep, 'd3').status);
        return false;
    }
    return rep.functions.map(function (f) { return f.name; }).join() === 'Read and save phyloXML,PNG export,Copy PNG,PDF export'
        && rep.functions[0].available === true && rep.functions[3].available === false;
});

test('forester.js states the release, and it is the viewer\'s', function (said) {
    let f = realForester();
    if (f.VERSION !== VERSION) {
        said.push('forester.VERSION is ' + f.VERSION + ', package.json says ' + VERSION);
        return false;
    }
    let v = fresh();
    let row = lib(v.report(), 'forester.js');
    v.done();
    if (row.status !== 'ok' || row.version !== VERSION || row.loaded !== true) {
        said.push(JSON.stringify(row));
        return false;
    }
    return true;
});

test('a forester.js from another release is a problem', function (said) {
    let old = realForester();
    old.VERSION = '3.0.0';
    let v = fresh({forester: old});
    let rep = v.report();
    v.done();
    let row = lib(rep, 'forester.js');
    let want = 'forester.js: forester.js is 3.0.0, archaeopteryx.js is ' + VERSION + ': the two must come from the same release';
    if (rep.ok !== false || row.status !== 'problem' || row.version !== '3.0.0' || rep.problems.join('||') !== want
        || rep.summary !== '1 thing to check' || rep.text.indexOf('  ! ' + want) < 0) {
        said.push(JSON.stringify(row), rep.problems.join(' || '), rep.summary);
        return false;
    }
    return true;
});

test('a forester.js with no version at all is an older file', function (said) {
    let old = realForester();
    delete old.VERSION;
    let v = fresh({forester: old});
    let rep = v.report();
    v.done();
    let row = lib(rep, 'forester.js');
    if (row.status !== 'problem' || row.version !== null || !/states no version, so it is an older file/.test(row.detail)) {
        said.push(JSON.stringify(row));
        return false;
    }
    return rep.ok === false;
});

// d3. The viewer takes the d3 it is handed at load (here: the global at that
// moment), exactly as launch() does, and a `document` on the global object is
// what makes a page of this process: only there is a wrong d3 a problem.
function fakeD3(version, extra) {
    let d = {zoom: function () {}, cluster: function () {}};
    if (version) { d.version = version; }
    Object.keys(extra || {}).forEach(function (k) { d[k] = extra[k]; });
    return d;
}
function d3Row(globals, after) {
    let v = fresh(globals);
    if (after) { after(); }
    let rep = v.report();
    v.done();
    delete globalThis.d3;
    return {row: lib(rep, 'd3'), rep: rep};
}

test('d3 7.9.0 is ok; 7.4 is a note; 5.16 is a problem on a page', function (said) {
    let a = d3Row({d3: fakeD3('7.9.0'), document: {}});
    let b = d3Row({d3: fakeD3('7.4.0'), document: {}});
    let c = d3Row({d3: fakeD3('5.16.0'), document: {}});
    if (a.row.status !== 'ok' || a.row.version !== '7.9.0' || b.row.status !== 'note' || b.rep.ok !== true
        || c.row.status !== 'problem' || c.rep.ok !== false || c.row.detail !== 'Archaeopteryx.js needs d3 version 7') {
        said.push(JSON.stringify([a.row, b.row, c.row]));
        return false;
    }
    return true;
});

// Review, 2026-10-09: d3's ES-module build exports no `version` (a bundler's
// `import * as d3`, jsdelivr +esm, require('d3') on Node 22), and a working
// d3 7.9.0 was reported "needs d3 version 7" with the dot lit for good.
test('a d3 that states no version is judged by what d3 7 has', function (said) {
    let esm = d3Row({d3: fakeD3(null, {InternMap: function () {}}), document: {}});
    if (esm.row.status !== 'ok' || esm.row.version !== null || esm.rep.ok !== true || !/states no version/.test(esm.row.detail)) {
        said.push('an ES-module d3 7: ' + JSON.stringify(esm.row));
        return false;
    }
    let old = d3Row({d3: fakeD3(null), document: {}});
    if (old.row.status !== 'problem' || old.rep.ok !== false || !/lacks what d3 7 has/.test(old.row.detail)) {
        said.push('a versionless d3 without InternMap: ' + JSON.stringify(old.row));
        return false;
    }
    return true;
});

// Review: the row looked at the GLOBAL d3 first, the opposite of launch(), and
// reported on a d3 the viewer was not using.
test('the d3 row is about the d3 the viewer was handed, not a later global', function (said) {
    let good = d3Row({d3: fakeD3('7.9.0'), document: {}}, function () { globalThis.d3 = fakeD3('5.16.0'); });
    if (good.row.status !== 'ok' || good.row.version !== '7.9.0') {
        said.push('handed 7.9.0, global 5.16.0 later: ' + JSON.stringify(good.row));
        return false;
    }
    let bad = d3Row({d3: fakeD3('5.16.0'), document: {}}, function () { globalThis.d3 = fakeD3('7.9.0'); });
    if (bad.row.status !== 'problem' || bad.row.version !== '5.16.0') {
        said.push('handed 5.16.0, global 7.9.0 later: ' + JSON.stringify(bad.row));
        return false;
    }
    // ... but a handed d3 that cannot draw gives way to a usable global, as in launch()
    let rescued = d3Row({d3: {version: '7.9.0'}, document: {}}, function () { globalThis.d3 = fakeD3('7.8.5'); });
    if (rescued.row.version !== '7.8.5' || rescued.row.status !== 'note') {
        said.push('handed an unusable d3, a usable global later: ' + JSON.stringify(rescued.row));
        return false;
    }
    return true;
});

test('the vendored phyloxml passes the round-trip probe', function (said) {
    let v = fresh();
    let row = lib(v.report(), 'phyloxml');
    v.done();
    if (row.status !== 'ok' || row.detail !== 'writes phyloXML as 1.1.7 does') {
        said.push(JSON.stringify(row));
        return false;
    }
    // the probe names the release package.json asks for: when phyloxml moves,
    // the probe's expected output and this number move with it
    let range = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).dependencies.phyloxml;
    if (range.replace(/^[^0-9]*/, '') !== '1.1.7') {
        said.push('package.json asks for phyloxml ' + range + ': update PHYLOXML_EXPECTED and the probe in archaeopteryx.js');
        return false;
    }
    return true;
});

// One mutation per thing the probe has to see, each what an older release
// really did, and what it must NOT flag. Losing data, and writing a style as
// releases before 1.1.7 did, are problems. A file merely laid out differently
// is a note: package.json admits 1.1.8 and later, and a newer phyloxml must
// not light the dot on every page that has it (review, 2026-10-09 -- the
// first probe demanded the bytes). In every case the phyloXML function stays
// ON: the library still reads and saves, and the Download menu still offers it.
[['the style colour\'s case (1.1.6)', 'problem', /^an older copy: it writes a style colour as it came, not in lower case, so a saved tree differs/,
    function (x) { return x.replace('#ce1616', '#CE1616'); }],
['the style property\'s place (1.1.6)', 'problem', /^an older copy: it writes a node's style before its other properties, so/,
    function (x) {
        let a = '      <property ref="x:y" datatype="xsd:string" applies_to="node">v</property>\n';
        let b = '      <property ref="style:font_color" datatype="xsd:token" applies_to="node">#ce1616</property>\n';
        return x.replace(a + b, b + a);
    }],
['both style faults (1.1.5)', 'problem', /it writes a style colour as it came, not in lower case, and a node's style before its other properties,/,
    function (x) {
        let a = '      <property ref="x:y" datatype="xsd:string" applies_to="node">v</property>\n';
        let b = '      <property ref="style:font_color" datatype="xsd:token" applies_to="node">#ce1616</property>\n';
        return x.replace(a + b, b.replace('#ce1616', '#CE1616') + a);
    }],
['the domain architecture dropped (1.1.4)', 'problem', /^an older copy: saving a tree as phyloXML drops protein domains \(phyloxml 1\.1\.7 keeps them\)$/,
    function (x) { return x.replace(/ {6}<sequence>[\s\S]*<\/sequence>\n/, ''); }],
['the phylogeny\'s property dropped (1.1.2)', 'problem', /drops a tree's own properties/,
    function (x) { return x.replace(/ {2}<property ref="p:q"[^\n]*\n/, ''); }],
['a node property dropped', 'problem', /drops node properties/,
    function (x) { return x.replace(/ {6}<property ref="x:y"[^\n]*\n/, ''); }],
['the style dropped', 'problem', /drops node styles/,
    function (x) { return x.replace(/ {6}<property ref="style:font_color"[^\n]*\n/, ''); }],
['another indentation: only a note', 'note', /^writes a small tree differently from phyloxml 1\.1\.7, losing nothing: a newer release, or an altered copy$/,
    function (x) { return x.replace(/\n {2}<clade>/, '\n    <clade>'); }],
['a newline after </phyloxml>: only a note', 'note', /^writes a small tree differently/,
    function (x) { return x + '\n'; }],
['a new attribute on <phyloxml>: only a note', 'note', /^writes a small tree differently/,
    function (x) { return x.replace('<phyloxml xmlns=', '<phyloxml version="2" xmlns='); }]
].forEach(function (m) {
    test('probe: ' + m[0], function (said) {
        let px = realPhyloXml();
        let write = px.toPhyloXML;
        let changed = false;
        px.toPhyloXML = function () {
            let x = write.apply(this, arguments);
            let y = m[3](x);
            changed = changed || y !== x;
            return y;
        };
        let v = fresh({phyloXml: px});
        let rep = v.report();
        v.done();
        let row = lib(rep, 'phyloxml');
        if (!changed) {
            said.push('the mutation changed nothing: the test is not testing');
            return false;
        }
        if (row.status !== m[1] || !m[2].test(row.detail)) {
            said.push(JSON.stringify(row));
            return false;
        }
        if (rep.ok !== (m[1] === 'note')) {
            said.push('ok is ' + rep.ok + ' for a ' + m[1]);
            return false;
        }
        if (m[1] === 'note' && rep.notes.join('||') !== 'phyloxml: ' + row.detail) {
            said.push('notes: ' + rep.notes.join(' || '));
            return false;
        }
        // an older copy still reads and saves: the function is on, and says why to mind
        if (rep.functions[0].available !== true || rep.functions[0].detail !== row.detail) {
            said.push('function row: ' + JSON.stringify(rep.functions[0]));
            return false;
        }
        return true;
    });
});

// Review: outside a page, ANY failure of the probe read "sax.js is not loaded"
// and the real message was thrown away.
test('a phyloxml that cannot read says why, and sax is not blamed', function (said) {
    let px = realPhyloXml();
    px.parse = function () { throw new Error('boom'); };
    let v = fresh({phyloXml: px});
    let rep = v.report();
    v.done();
    let row = lib(rep, 'phyloxml');
    if (row.status !== 'problem' || row.detail !== 'reading a small tree failed: boom') {
        said.push(JSON.stringify(row));
        return false;
    }
    if (lib(rep, 'sax').status !== 'ok') {
        said.push('sax: ' + JSON.stringify(lib(rep, 'sax')));
        return false;
    }
    // this one does switch the function off
    return rep.ok === false && rep.functions[0].available === false
        && rep.functions[0].detail === 'phyloxml: reading a small tree failed: boom';
});

test('a phyloxml that cannot write says why', function (said) {
    let px = realPhyloXml();
    px.toPhyloXML = function () { throw new Error('a writer bug'); };
    let v = fresh({phyloXml: px});
    let rep = v.report();
    v.done();
    let row = lib(rep, 'phyloxml');
    if (row.status !== 'problem' || row.detail !== 'writing a small tree failed: a writer bug' || lib(rep, 'sax').status !== 'ok') {
        said.push(JSON.stringify(row), JSON.stringify(lib(rep, 'sax')));
        return false;
    }
    return rep.functions[0].available === false;
});

test('on a page, a read that fails with no sax global is the missing sax', function (said) {
    let px = realPhyloXml();
    px.parse = function () { throw new Error('sax is not defined'); };
    let v = fresh({phyloXml: px, document: {}});
    let rep = v.report();
    v.done();
    if (lib(rep, 'phyloxml').detail !== 'cannot read phyloXML: sax.js is not loaded' || lib(rep, 'sax').status !== 'problem') {
        said.push(JSON.stringify(lib(rep, 'phyloxml')), JSON.stringify(lib(rep, 'sax')));
        return false;
    }
    // ... a WRITE that fails there is not the missing sax: the tree was read
    let pw = realPhyloXml();
    pw.toPhyloXML = function () { throw new Error('a writer bug'); };
    v = fresh({phyloXml: pw, document: {}});
    rep = v.report();
    v.done();
    if (lib(rep, 'phyloxml').detail !== 'writing a small tree failed: a writer bug' || lib(rep, 'sax').status !== 'ok') {
        said.push('a write failure on a page: ' + JSON.stringify(lib(rep, 'phyloxml')), JSON.stringify(lib(rep, 'sax')));
        return false;
    }
    // ... and with the global there, the same failure is reported as itself
    v = fresh({phyloXml: px, document: {}, sax: {}});
    rep = v.report();
    v.done();
    if (lib(rep, 'phyloxml').detail !== 'reading a small tree failed: sax is not defined' || lib(rep, 'sax').status !== 'ok') {
        said.push('with a sax global: ' + JSON.stringify(lib(rep, 'phyloxml')));
        return false;
    }
    return true;
});

// Sabotage found this one unguarded (2026-10-09): accepting any window.Canvg
// passed every check. canvg 3 has a Canvg class too, with from() and no
// fromString on some builds; the viewer calls fromString.
test('a window.Canvg without fromString is a problem', function (said) {
    let v = fresh({Canvg: function () {}});
    let rep = v.report();
    v.done();
    let row = lib(rep, 'canvg');
    if (row.status !== 'problem' || row.loaded !== true || !/has no fromString: not canvg 4/.test(row.detail) || rep.ok !== false) {
        said.push(JSON.stringify(row));
        return false;
    }
    let good = function () {};
    good.fromString = function () {};
    v = fresh({Canvg: good});
    row = lib(v.report(), 'canvg');
    v.done();
    if (row.status !== 'ok') {
        said.push('with fromString: ' + JSON.stringify(row));
        return false;
    }
    return true;
});

test('a retired config key is kept, and so is why the launch failed', function (said) {
    let v = fresh();
    console.warn = function () {};
    let threw = null;
    try {
        v.apx.launch('#nowhere', v.apx.parseNewHampshire(TREE), {nodeLabels: []});
    } catch (e) {
        threw = e;
    }
    let rep = v.report();
    v.done();
    if (!threw) {
        said.push('launch() did not throw in Node');
        return false;
    }
    if (!rep.problems.some(function (p) { return /^"nodeLabels" is retired and has no effect/.test(p); })) {
        said.push('no retired-key entry: ' + rep.problems.join(' || '));
        return false;
    }
    if (!rep.problems.some(function (p) { return /^launch failed: /.test(p) && !/ArchaeopteryxJS/.test(p); })) {
        said.push('no launch-failed entry: ' + rep.problems.join(' || '));
        return false;
    }
    // Review: a FIRST launch that is rejected has put no tree on view, and the
    // report must not describe one (launch() writes its working state before
    // the checks that reject it).
    if (rep.launch !== null || !/no tree is on view/.test(rep.text)) {
        said.push('launch section after a rejected first launch: ' + JSON.stringify(rep.launch));
        return false;
    }
    return rep.ok === false && rep.summary === rep.problems.length + ' things to check';
});

// Review: launchArchaeopteryx() throws its own failures before it reaches
// launch(), and they were never recorded.
test('launchArchaeopteryx: a file that does not parse is recorded, once', function (said) {
    let v = fresh();
    let msg = null;
    try {
        v.apx.launchArchaeopteryx('#nowhere', 't.nwk', '((a,b', {});
    } catch (e) {
        msg = e.message;
    }
    let rep = v.report();
    if (!/^ArchaeopteryxJS: ERROR: could not parse tree: /.test(msg || '')) {
        v.done();
        said.push('thrown: ' + msg);
        return false;
    }
    if (rep.problems.length !== 1 || !/^launch failed: could not parse tree: /.test(rep.problems[0])) {
        v.done();
        said.push(rep.problems.join(' || '));
        return false;
    }
    // a fifth argument is its own failure too
    try {
        v.apx.launchArchaeopteryx('#nowhere', 't.nwk', TREE, {}, {});
    } catch {
        // expected
    }
    rep = v.report();
    if (!rep.problems.some(function (p) { return /^launch failed: launchArchaeopteryx\(\) takes exactly/.test(p); })) {
        v.done();
        said.push('fifth argument: ' + rep.problems.join(' || '));
        return false;
    }
    // and a failure of the launch itself, reached through it, is one line, not two
    try {
        v.apx.launchArchaeopteryx('#nowhere', 't.nwk', TREE, {noSuchKey: 1});
    } catch {
        // expected
    }
    rep = v.report();
    v.done();
    let lines = rep.problems.filter(function (p) { return /unknown config key/.test(p); });
    if (lines.length !== 1 || / times\)$/.test(lines[0])) {
        said.push('through launchArchaeopteryx: ' + rep.problems.join(' || '));
        return false;
    }
    return true;
});

test('the thrown error still reaches the caller unchanged', function (said) {
    let v = fresh();
    let msg = null;
    try {
        v.apx.launch('#nowhere', v.apx.parseNewHampshire(TREE), {noSuchKey: 1});
    } catch (e) {
        msg = e.message;
    }
    let rep = v.report();
    v.done();
    if (msg !== 'ArchaeopteryxJS: ERROR: unknown config key(s) passed to launch: "noSuchKey"') {
        said.push('thrown: ' + msg);
        return false;
    }
    if (rep.problems.join('||') !== 'launch failed: unknown config key(s) passed to launch: "noSuchKey"') {
        said.push(rep.problems.join(' || '));
        return false;
    }
    return true;
});

test('too many arguments is still refused (launch keeps its arguments)', function (said) {
    let v = fresh();
    let msg = null;
    try {
        v.apx.launch('#nowhere', v.apx.parseNewHampshire(TREE), {}, {});
    } catch (e) {
        msg = e.message;
    }
    v.done();
    if (!/launch\(\) takes exactly \(container, tree, config\)/.test(msg || '')) {
        said.push('thrown: ' + msg);
        return false;
    }
    return true;
});

test('every launch starts the list afresh; a repeat is one entry', function (said) {
    let v = fresh();
    console.warn = function () {};
    let go = function (config) {
        try {
            v.apx.launch('#nowhere', v.apx.parseNewHampshire(TREE), config);
        } catch {
            // Node has nothing to launch into
        }
    };
    go({nodeLabels: []});
    let first = v.report().problems.filter(function (p) { return /nodeLabels/.test(p); }).length;
    go({});
    let second = v.report().problems.filter(function (p) { return /nodeLabels/.test(p); }).length;
    v.done();
    if (first !== 1 || second !== 0) {
        said.push('nodeLabels entries: ' + first + ' after the first launch, ' + second + ' after the second');
        return false;
    }
    return true;
});

test('the warning is still printed, word for word', function (said) {
    let v = fresh();
    let printed = [];
    console.warn = function (l) { printed.push(l); };
    try {
        v.apx.launch('#nowhere', v.apx.parseNewHampshire(TREE), {nodeLabels: []});
    } catch {
        // Node has nothing to launch into
    }
    v.done();
    if (printed.length !== 1 || !/^ArchaeopteryxJS: WARNING: "nodeLabels" is retired and has no effect: /.test(printed[0])) {
        said.push('printed: ' + JSON.stringify(printed));
        return false;
    }
    return true;
});

test('doctor() never throws, whatever the page holds', function (said) {
    let hostile = {
        get version() { throw new Error('d3 getter'); }
    };
    let trap = new Proxy({}, {get: function () { throw new Error('trap'); }});
    let v = fresh({d3: hostile, Canvg: trap, jspdf: trap, svg2pdf: trap, canvg: trap, jsPDF: trap});
    let rep = v.report();
    v.done();
    if (!rep || typeof rep.text !== 'string' || rep.libraries.length !== 7) {
        said.push(JSON.stringify(rep));
        return false;
    }
    // a check that could not run says so in its own row, and counts as a problem
    let failedRows = rep.libraries.filter(function (l) { return /^this check failed: /.test(l.detail); });
    if (failedRows.length === 0 || rep.ok !== false) {
        said.push('no row reports its own failure: ' + rep.libraries.map(function (l) { return l.name + '=' + l.status; }).join());
        return false;
    }
    return true;
});

if (failed > 0) {
    console.log(failed + ' test(s) FAILED');
    process.exit(1);
}
console.log('All tests passed');
