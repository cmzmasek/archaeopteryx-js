// docs/lib/canvg.global.js is GENERATED from docs/lib/canvg.js by
// test/make_canvg_global.js. This pins the file on disk to a fresh generation,
// so the classic-script build can never drift from the module build it wraps
// -- and it runs the build as a classic script in a bare context to see that
// it defines window.Canvg with fromString, which is what the viewer looks for.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {execFileSync} = require('child_process');

let ok = true;
function fail(msg) {
    console.log('    ' + msg);
    ok = false;
}

try {
    execFileSync(process.execPath, [path.join(__dirname, 'make_canvg_global.js'), '--check'], {stdio: 'pipe'});
} catch (e) {
    fail('generation check: ' + String(e.stdout || e.stderr || e.message).trim());
}

const file = path.join(__dirname, '..', 'docs', 'lib', 'canvg.global.js');
const text = fs.readFileSync(file, 'utf8');
if (/^\s*(export|import)\b/m.test(text)) {
    fail('the classic build still carries a module statement');
}
const ctx = {console: console, setTimeout: setTimeout, clearTimeout: clearTimeout};
ctx.window = ctx;
ctx.self = ctx;
ctx.globalThis = ctx;
try {
    vm.runInNewContext(text, ctx, {filename: 'canvg.global.js'});
} catch (e) {
    fail('does not run as a classic script: ' + e.message);
}
if (typeof ctx.window.Canvg !== 'function' || typeof ctx.window.Canvg.fromString !== 'function') {
    fail('window.Canvg.fromString is not defined after loading');
}

console.log('canvg classic build    : ' + (ok ? 'pass' : 'FAIL'));
if (!ok) {
    console.log('1 test(s) FAILED');
    process.exit(1);
}
console.log('All tests passed');
