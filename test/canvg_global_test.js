// docs/lib/canvg.global.js is GENERATED from docs/lib/canvg.js by
// test/make_canvg_global.js. This pins the file on disk to a fresh generation
// -- compared in process, and on a difference it says WHERE -- so the
// classic-script build can never drift from the module build it wraps. It
// then runs the file as a classic script in a bare context to see that it
// defines window.Canvg with fromString, which is what the viewer looks for.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const generator = require('./make_canvg_global');

let ok = true;
function fail(msg) {
    console.log('    ' + msg);
    ok = false;
}

let fresh = null;
try {
    fresh = generator.build();
} catch (e) {
    fail('the generator refuses its input: ' + e.message);
}
const onDisk = fs.existsSync(generator.OUT) ? fs.readFileSync(generator.OUT, 'utf8') : null;
if (fresh !== null && onDisk !== fresh) {
    let at = 0;
    while (onDisk !== null && at < fresh.length && at < onDisk.length && fresh[at] === onDisk[at]) {
        at++;
    }
    fail(path.relative(process.cwd(), generator.OUT) + ' differs from a fresh generation'
        + (onDisk === null ? ' (missing)' : ' at byte ' + at + ': disk ' + JSON.stringify(onDisk.slice(at, at + 40))
            + ' vs fresh ' + JSON.stringify(fresh.slice(at, at + 40)))
        + '; run node test/make_canvg_global.js');
}

if (onDisk !== null) {
    if (/^\s*(export|import)\b/m.test(onDisk)) {
        fail('the classic build still carries a module statement');
    }
    if (!/^\(function \(\) \{\n'use strict';\n/m.test(onDisk)) {
        fail('the wrapper does not open with "use strict" (module code is strict; the wrapper must keep it so)');
    }
    const ctx = {console: console, setTimeout: setTimeout, clearTimeout: clearTimeout};
    ctx.window = ctx;
    ctx.self = ctx;
    ctx.globalThis = ctx;
    try {
        vm.runInNewContext(onDisk, ctx, {filename: 'canvg.global.js'});
    } catch (e) {
        fail('does not run as a classic script: ' + e.message);
    }
    if (typeof ctx.window.Canvg !== 'function' || typeof ctx.window.Canvg.fromString !== 'function') {
        fail('window.Canvg.fromString is not defined after loading');
    }
}

console.log('canvg classic build    : ' + (ok ? 'pass' : 'FAIL'));
if (!ok) {
    console.log('1 test(s) FAILED');
    process.exit(1);
}
console.log('All tests passed');
