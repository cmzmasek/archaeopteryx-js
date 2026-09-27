// Run the browser harnesses in headless Chrome and fail if any of them does.
//
// These check what npm test cannot reach: the viewer's wiring -- which marks
// are drawn, where they sit, whether a control lights. Every defect found in
// the auto-hide work was wiring, not arithmetic, and the arithmetic is the
// only part node can test today.
//
//   node test/browser/run.js            every case
//   node test/browser/run.js --quick    one case per harness
//   CHROME=<path> node test/browser/run.js
const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const QUICK = process.argv.includes('--quick');

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
    'mark_ink_covered': ['', '?tree=../../docs/data/apaf.xml']
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
    for (const harness of Object.keys(CASES)) {
        const queries = QUICK ? CASES[harness].slice(0, 1) : CASES[harness];
        for (const q of queries) {
            const label = harness + (q || '');
            const r = await runOne(port, harness, q);
            ++ran;
            if (r.ok) {
                console.log('pass  ' + label);
            } else {
                ++bad;
                console.log('FAIL  ' + label
                    + (r.failures === null ? ' (the harness did not finish)'
                        : ' (' + r.failures + ' failing checks)'));
                // the harness's own report, so the failure names itself
                r.out.split('\n').filter((l) => /FAIL|MUTATION INVALID|Error/.test(l))
                    .slice(0, 12).forEach((l) => console.log('        ' + l.trim()));
            }
        }
    }
    server.close();
    console.log('\n' + ran + ' browser cases, ' + bad + ' failing');
    process.exit(bad > 0 ? 1 : 0);
}

main();
