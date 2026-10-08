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
//   CHROME=<path> node test/browser/run.js
const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const QUICK = process.argv.includes('--quick');
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));

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
    'scale_axis': ['', '?old=1'],
    'figure_heatmap': ['', '?clade=1', '?given=1'],
    'heatmap_borders': ['', '?many=1', '?radial=1'],
    'label_properties': ['', '?figure=1', '?config=1', '?nodeLabels=1'],
    'branch_scale_subtree': ['', '?clock=1', '?refused=1', '?delete=1', '?delete=gain', '?opensdiv=1', '?view=1'],
    'genes': ['', '?config=1', '?radial=1', '?domains=1'],
    'initial_visualization': ['', '?sparse=1', '?fine=1', '?last=1', '?missing=1', '?auto=1'],
    'clock_plot': ['', '?rates=1', '?refused=1', '?ages=1', '?delete=1', '?host=1', '?clades=1', '?same=1', '?rtt=1', '?names=1'],
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

function runOne(port, harness, query) {
    return new Promise((resolve) => {
        const url = 'http://127.0.0.1:' + port + '/test/browser/' + harness + '.html' + query;
        const child = spawn(process.execPath,
            [path.join(__dirname, 'cdp_run.js'), url, '300', '1100', '850'],
            {stdio: ['ignore', 'pipe', 'pipe']});
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

async function main() {
    const server = await serve();
    const port = server.address().port;
    let ran = 0, bad = 0;
    const unknown = ONLY.filter((h) => !CASES[h]);
    if (unknown.length) {
        console.log('no such harness: ' + unknown.join(', '));
        process.exit(2);
    }
    for (const harness of Object.keys(CASES)) {
        if (ONLY.length && !ONLY.includes(harness)) {
            continue;
        }
        const queries = QUICK ? CASES[harness].slice(0, 1) : CASES[harness];
        for (const q of queries) {
            const label = harness + (q || '');
            const r = await runOne(port, harness, q);
            ++ran;
            if (r.ok) {
                console.log('pass  ' + label);
                // A passing harness's MEASUREMENTS are the diagnosis when some
                // other harness fails, and they were invisible: only failures
                // printed anything. mark_ink_covered passed on a CI runner
                // where three other cases failed, and the numbers it had just
                // measured -- the whole reason it was written -- were nowhere
                // in the log. Measurement lines are the report entries that
                // are neither a pass nor a FAIL.
                reportLines(r.out).filter((l) => !/^(pass|FAIL)\s/.test(l))
                    .forEach((l) => console.log('        ' + l));
            } else {
                ++bad;
                console.log('FAIL  ' + label
                    + (r.failures === null ? ' (the harness did not finish)'
                        : ' (' + r.failures + ' failing checks)'));
                // the harness's own report, so the failure names itself
                reportLines(r.out).slice(0, 14).forEach((l) => console.log('        ' + l));
            }
        }
    }
    server.close();
    console.log('\n' + ran + ' browser cases, ' + bad + ' failing');
    process.exit(bad > 0 ? 1 : 0);
}

main();
