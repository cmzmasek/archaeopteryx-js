// Run the browser harnesses in headless Chrome and fail if any of them does.
//
// These check what npm test cannot reach: the viewer's wiring -- which marks
// are drawn, where they sit, whether a control lights. Every defect found in
// the auto-hide work was wiring, not arithmetic, and the arithmetic is the
// only part node can test today.
//
//   node test/browser/run.js                 every case
//   node test/browser/run.js --quick         one case per harness
//   node test/browser/run.js clock_plot ...  the named harnesses, every case
//   node test/browser/run.js 'doctor?half=1' 'doctor?'   single cases ('name?' is the plain one)
//   node test/browser/run.js --jobs 1        one Chrome at a time (the default is 4; 1 under CI)
//   node test/browser/run.js --fails         for a failing case, print its failing checks only
//   CHROME=<path> node test/browser/run.js
//
// Cases run several at a time, each in its own Chrome, and are REPORTED in
// the order they are listed, so two runs read alike. One at a time the 113
// cases took 22 minutes, which made the full run something to avoid
// (Christian, 2026-10-09: "this testing is clearly starting to take too much
// time"). A machine busy with four Chromes is slower per case, and these
// harnesses wait on real timers: a case that fails while others are running
// is run once more ALONE before it counts, and the report says when a pass
// was that second run -- a failure under load is a slow machine, a failure
// alone is a defect.
const {spawn} = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const ARGS = process.argv.slice(2);
const QUICK = ARGS.includes('--quick');
const FAILS_ONLY = ARGS.includes('--fails');
const JOBS = (function () {
    const i = ARGS.indexOf('--jobs');
    const n = i >= 0 ? parseInt(ARGS[i + 1], 10) : (process.env.CI ? 1 : 4);
    if (!(n >= 1 && n <= 16)) {
        console.log('--jobs takes a number from 1 to 16');
        process.exit(2);
    }
    return n;
})();
// what to run: harness names, or single cases written as the page's own
// address, 'doctor?half=1' ('doctor?' is the case with no query)
const ONLY = ARGS.filter((a, i) => !a.startsWith('--') && ARGS[i - 1] !== '--jobs');

// harness -> the query strings to run it with. The first of each is the one
// --quick keeps, so it must be the case that exercises the most.
const CASES = {
    'autohide': [''],
    'autohide_radial': [''],
    'autohide_events': [''],
    'autohide_tiebreak': [''],
    'crowding': [''],
    'zero_labels': [''],
    'tiplabel_overlap': ['?tree=../../docs/data/Caliciviridae_100.xml',
        '?tree=../../docs/data/flu_h5.xml', '?tree=../../docs/data/woese-tree-of-life.xml',
        '?tree=../../docs/data/apaf.xml', '?tree=../../docs/data/confidences.xml'],
    'tiplabel_divergences': ['?tree=../../docs/data/confidences.xml', '',
        '?tree=../../docs/data/flu_h5.xml'],
    'clade_names_reserved': ['', '?tree=../../docs/data/confidences.xml'],
    'label_ink_covered': ['', '?tree=../../docs/data/flu_h5.xml&find=A'],
    'label_reservation': ['?tips=36', '?tips=60'],
    'orphan_marks': ['', '?big=96'],
    'panel_descriptions': ['', '?compact=1'],
    'autohide_indicator': ['', '?tree=../../docs/data/woese-tree-of-life.xml'],
    'display_buttons': ['', '?tree=../../docs/data/woese-tree-of-life.xml'],
    'ring_rotation': [''],
    'ring_connectors': ['?tree=../../docs/data/flu_h5.xml', ''],
    'indicator_branchdata': ['', '?tree=../../docs/data/apaf.xml'],
    'mark_ink_covered': ['', '?tree=../../docs/data/apaf.xml'],
    'suppdots': [''],
    'time_circular': ['', '?fossil=1'],
    'scale_axis': ['', '?old=1', '?bar=1', '?bar=plain', '?bar=off'],
    'figure_heatmap': ['', '?clade=1', '?given=1'],
    'heatmap_borders': ['', '?many=1', '?radial=1'],
    'label_properties': ['', '?figure=1', '?config=1', '?nodeLabels=1'],
    'branch_scale_subtree': ['', '?clock=1', '?refused=1', '?delete=1', '?delete=gain', '?opensdiv=1', '?view=1'],
    'genes': ['', '?config=1', '?radial=1', '?domains=1'],
    'initial_visualization': ['', '?sparse=1', '?fine=1', '?last=1', '?missing=1', '?auto=1'],
    'color_picker': ['', '?top=1', '?demo=1'],
    'canvg_global': ['', '?none=1'],
    'style_precedence': ['', '?plain=1'],
    'doctor': ['', '?absent=1', '?nodeLabels=1', '?forced=1', '?half=1', '?order=1', '?old=1', '?forester=1',
        '?phyloxml=1', '?newer=1', '?d3=1', '?esm=1', '?trees=1', '?notes=1', '?failed=1', '?legacy=1'],
    'clock_plot': ['', '?rates=1', '?refused=1', '?ages=1', '?delete=1', '?host=1', '?clades=1', '?same=1', '?rtt=1', '?names=1'],
    'host_css': ['?host=bvbrc', '?host=bvbrc&theme=dark', '?host=bootstrap3', '?host=bootstrap5', '?host=tailwind', '?host=wild',
        '?host=wild&tree=time', '?host=wild&tree=alignment'],
    'exports': ['', '?keeps=1', '?keeps=genes', '?layout=circular', '?layout=unrooted', '?seqs=1', '?subtree=1', '?subtree=div', '?legends=1', '?big=1200']
};

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.xml': 'text/xml',
    '.json': 'application/json', '.nex': 'text/plain', '.css': 'text/css'};

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

// the harness's own report array, as cdp_run prints it
function reportLines(out) {
    const lines = [];
    for (const raw of out.split('\n')) {
        const m = raw.match(/^\s*"(.*)",?$/);
        if (m) {
            lines.push(m[1].replace(/\\"/g, '"').trim());
        }
    }
    return lines;
}

// A port nothing is listening on, asked of the system at the moment it is
// needed -- and never handed out twice in one run. The system is free to
// name the same port again the moment the probe lets go of it, before the
// Chrome it was meant for has bound it: two quick cases in a row then shared
// one debugging port, both drove the same tab, and the one navigated away
// from sat until its five-minute limit (seen on the first parallel run of
// three cases, 2026-10-09).
const handedOut = new Set();
function freePort() {
    return new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once('error', reject);
        probe.listen(0, '127.0.0.1', () => {
            const p = probe.address().port;
            probe.close(() => {
                if (handedOut.has(p)) {
                    freePort().then(resolve, reject);
                    return;
                }
                handedOut.add(p);
                resolve(p);
            });
        });
    });
}

async function runOne(port, harness, query) {
    const cdpPort = await freePort();
    return new Promise((resolve) => {
        const url = 'http://127.0.0.1:' + port + '/test/browser/' + harness + '.html' + query;
        const child = spawn(process.execPath,
            [path.join(__dirname, 'cdp_run.js'), url, '300', '1100', '850'],
            {stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, {CDP_PORT: String(cdpPort)})});
        let out = '';
        child.stdout.on('data', (d) => { out += d; });
        child.stderr.on('data', (d) => { out += d; });
        child.on('exit', (code) => {
            const m = out.match(/"failures":\s*(\d+)/);
            if (code !== 0 || !m) {
                resolve({ok: false, failures: null, out: out});
                return;
            }
            const n = Number(m[1]);
            resolve({ok: n === 0, failures: n, out: out});
        });
    });
}

// The cases to run, in listing order. A name runs every case of a harness
// (the first only, with --quick); 'name?query' runs that one case.
function selectCases() {
    const wholes = ONLY.filter((a) => !a.includes('?'));
    const singles = ONLY.filter((a) => a.includes('?')).map((a) => {
        const at = a.indexOf('?');
        return {harness: a.slice(0, at), query: a.length > at + 1 ? a.slice(at) : ''};
    });
    const unknown = wholes.filter((h) => !CASES[h])
        .concat(singles.filter((c) => !CASES[c.harness] || !CASES[c.harness].includes(c.query))
            .map((c) => c.harness + (c.query || '?')));
    if (unknown.length) {
        console.log('no such harness or case: ' + unknown.join(', '));
        process.exit(2);
    }
    const list = [];
    for (const harness of Object.keys(CASES)) {
        const all = ONLY.length === 0 || wholes.includes(harness);
        const queries = QUICK && all ? CASES[harness].slice(0, 1) : CASES[harness];
        for (const q of queries) {
            if (all || singles.some((c) => c.harness === harness && c.query === q)) {
                list.push({harness: harness, query: q, label: harness + (q || '')});
            }
        }
    }
    return list;
}

function report(c) {
    const r = c.result;
    if (r.ok) {
        console.log('pass  ' + c.label + (c.alone ? '   (alone: it failed while other cases were running)' : ''));
        // A passing harness's MEASUREMENTS are the diagnosis when some
        // other harness fails, and they were invisible: only failures
        // printed anything. mark_ink_covered passed on a CI runner
        // where three other cases failed, and the numbers it had just
        // measured -- the whole reason it was written -- were nowhere
        // in the log. Measurement lines are the report entries that
        // are neither a pass nor a FAIL.
        reportLines(r.out).filter((l) => !/^(pass|FAIL)\s/.test(l))
            .forEach((l) => console.log('        ' + l));
        if (c.alone) {
            // what it failed on under load, so a case that needs the rerun
            // every time can be seen for what it is
            reportLines(c.loaded.out).filter((l) => /^FAIL\s/.test(l)).slice(0, 6)
                .forEach((l) => console.log('        under load: ' + l));
        }
        return;
    }
    console.log('FAIL  ' + c.label
        + (r.failures === null ? ' (the harness did not finish)'
            : ' (' + r.failures + ' failing checks)'));
    // the harness's own report, so the failure names itself
    const lines = reportLines(r.out);
    (FAILS_ONLY ? lines.filter((l) => /^FAIL\s/.test(l)) : lines.slice(0, 14))
        .forEach((l) => console.log('        ' + l));
}

async function main() {
    const server = await serve();
    const port = server.address().port;
    const cases = selectCases();
    const started = Date.now();
    // JOBS workers take the next case each; a finished case is printed as
    // soon as every case listed before it has been
    let next = 0, printed = 0;
    const flush = () => {
        while (printed < cases.length && cases[printed].result && !cases[printed].retry) {
            report(cases[printed++]);
        }
    };
    const worker = async () => {
        while (next < cases.length) {
            const c = cases[next++];
            const r = await runOne(port, c.harness, c.query);
            if (!r.ok && JOBS > 1) {
                c.loaded = r;
                c.retry = true;     // decided alone, below
            }
            c.result = r;
            flush();
        }
    };
    await Promise.all(Array.from({length: Math.min(JOBS, cases.length)}, worker));
    // what failed in company is run again with the machine to itself
    for (const c of cases.filter((x) => x.retry)) {
        c.result = await runOne(port, c.harness, c.query);
        c.alone = c.result.ok;
        c.retry = false;
        flush();
    }
    flush();
    server.close();
    const bad = cases.filter((c) => !c.result.ok).length;
    const alone = cases.filter((c) => c.alone).length;
    console.log('\n' + cases.length + ' browser cases, ' + bad + ' failing'
        + (alone ? ', ' + alone + ' passed only when run alone' : '')
        + '   (' + Math.round((Date.now() - started) / 1000) + ' s, ' + JOBS + ' at a time)');
    process.exit(bad > 0 ? 1 : 0);
}

main();
