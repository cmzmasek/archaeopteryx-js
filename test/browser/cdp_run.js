// Drive headless Chrome over the DevTools protocol (no puppeteer): open a URL,
// wait for window.__benchDone, print window.__benchResult and console output.
// usage: node cdp_run.js <url> [timeoutSec] [width] [height]
const {spawn} = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const url = process.argv[2];
const timeoutSec = parseInt(process.argv[3] || '300', 10);
const W = parseInt(process.argv[4] || '1600', 10);
const H = parseInt(process.argv[5] || '1000', 10);
const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'aptx-cdp-'));
// Chrome, wherever this machine keeps it. Hardcoding the macOS path made the
// runner useless on any other machine, which is most of the reason these
// harnesses never ran anywhere but here. CHROME=<path> overrides.
function findChrome() {
    const named = process.env.CHROME;
    if (named) {
        return named;
    }
    const candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium'
    ];
    for (const c of candidates) {
        try {
            if (fs.existsSync(c)) {
                return c;
            }
        } catch { /* keep looking */ }
    }
    console.error('cdp_run: no Chrome found. Set CHROME=<path to a Chrome or Chromium binary>.');
    process.exit(3);
}

const chrome = spawn(findChrome(), [
    '--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    '--window-size=' + W + ',' + H, '--no-first-run', '--no-default-browser-check',
    '--enable-precise-memory-info',
    // CI runners have no usable sandbox; harmless locally
    '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    'about:blank'
], {stdio: 'ignore'});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    let targets;
    for (let i = 0; i < 50; ++i) {
        try {
            targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
            if (targets.find((t) => t.type === 'page')) break;
        } catch { /* not up yet */ }
        await sleep(200);
    }
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
            console.log('[console]', msg.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' '));
        } else if (msg.method === 'Runtime.exceptionThrown') {
            console.log('[exception]', JSON.stringify(msg.params.exceptionDetails).slice(0, 800));
        }
    });
    const send = (method, params) => new Promise((r) => {
        const mid = ++id;
        pending.set(mid, r);
        ws.send(JSON.stringify({id: mid, method, params: params || {}}));
    });
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 2, mobile: false});
    await send('Emulation.setFocusEmulationEnabled', {enabled: true});
    await send('Page.navigate', {url});
    const t0 = Date.now();
    while ((Date.now() - t0) / 1000 < timeoutSec) {
        const r = await send('Runtime.evaluate', {expression: 'window.__benchDone === true', returnByValue: true});
        if (r.result && r.result.result && r.result.result.value === true) break;
        await sleep(500);
    }
    const res = await send('Runtime.evaluate', {expression: 'JSON.stringify(window.__benchResult || null, null, 2)', returnByValue: true});
    console.log(res.result.result.value);
    if (process.env.SHOT) {
        const shot = await send('Page.captureScreenshot', {format: 'png'});
        fs.writeFileSync(process.env.SHOT, Buffer.from(shot.result.data, 'base64'));
        console.log('screenshot ->', process.env.SHOT);
    }
    ws.close();
}

main().catch((e) => console.error(e)).finally(async () => {
    const exited = new Promise((r) => chrome.once('exit', r));
    chrome.kill();
    await exited;
    try {
        fs.rmSync(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 200});
    } catch { /* a leftover temp profile is harmless */ }
    process.exit(0);
});
