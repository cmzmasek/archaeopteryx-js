// Writes the MAD contract's input trees as Newick, one per line: the desktop
// test suite's shapes (random binary with a degree-2 and a degree-3 root,
// polytomies, caterpillars, stars, clock trees) from a seeded generator, plus
// hand-made cases for exact ties, zero-length and missing branch lengths.
'use strict';

function rng(seed) {
    let s = seed >>> 0;
    return function () {   // mulberry32
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function leaf(i) {
    return {name: 'T' + i};
}

function nwk(node) {
    let s = node.children ? '(' + node.children.map(nwk).join(',') + ')' : node.name;
    return s + (node.branch_length !== undefined ? ':' + node.branch_length : '');
}

function randomTree(n, seed, rootDegree) {
    let r = rng(seed * 1000 + rootDegree);
    let active = [];
    for (let i = 0; i < n; ++i) active.push(leaf(i));
    while (active.length > rootDegree) {
        let x = active.splice(Math.floor(r() * active.length), 1)[0];
        let y = active.splice(Math.floor(r() * active.length), 1)[0];
        x.branch_length = 0.05 + r();
        y.branch_length = 0.05 + r();
        active.push({children: [x, y]});
    }
    active.forEach(function (nd) { nd.branch_length = 0.05 + r(); });
    return {children: active};
}

function randomMultifurcating(n, seed) {
    let r = rng(seed * 1000 + 7);
    let active = [];
    for (let i = 0; i < n; ++i) active.push(leaf(i));
    while (active.length > 1) {
        let k = Math.min(2 + Math.floor(r() * 3), active.length);
        let parent = {children: []};
        for (let i = 0; i < k; ++i) {
            let x = active.splice(Math.floor(r() * active.length), 1)[0];
            x.branch_length = 0.05 + r();
            parent.children.push(x);
        }
        active.push(parent);
    }
    return active[0];
}

function caterpillar(n, seed) {
    let r = rng(seed * 1000 + 11);
    let t0 = leaf(0); t0.branch_length = 0.05 + r();
    let t1 = leaf(1); t1.branch_length = 0.05 + r();
    let current = {children: [t0, t1]};
    for (let i = 2; i < n; ++i) {
        current.branch_length = 0.05 + r();
        let ti = leaf(i); ti.branch_length = 0.05 + r();
        current = {children: [current, ti]};
    }
    return current;
}

function star(n, seed) {
    let r = rng(seed * 1000 + 13);
    let root = {children: []};
    for (let i = 0; i < n; ++i) {
        let t = leaf(i);
        t.branch_length = 0.05 + r();
        root.children.push(t);
    }
    return root;
}

function clock(n, seed) {
    let r = rng(seed * 1000 + 17);
    let active = [];
    for (let i = 0; i < n; ++i) {
        let t = leaf(i);
        t.height = 0;
        active.push(t);
    }
    while (active.length > 2) {
        let x = active.splice(Math.floor(r() * active.length), 1)[0];
        let y = active.splice(Math.floor(r() * active.length), 1)[0];
        let p = {children: [x, y], height: Math.max(x.height, y.height) + 0.1 + r()};
        x.branch_length = p.height - x.height;
        y.branch_length = p.height - y.height;
        active.push(p);
    }
    let root = {children: active, height: Math.max(active[0].height, active[1].height) + 0.1 + r()};
    active.forEach(function (nd) { nd.branch_length = root.height - nd.height; });
    return root;
}

let out = [
    // the desktop's hand-verified cases
    '(A:1,B:1,C:4)',
    '((A:1,B:1):1,(C:1,D:1):1)',
    '((A:1,B:1):1,(C:1,D:6):1)',
    '((A:1,B:2)x:1,(C:3,D:4)y:1)',
    // exact ties: which of several equally good branches wins
    '(A:1,B:1,C:1,D:1)',
    '((A:1,B:1):2,(C:1,D:1):2,(E:1,F:1):2)',
    '(((A:1,B:1):1,(C:1,D:1):1):1,((E:1,F:1):1,(G:1,H:1):1):1)',
    // zero-length and missing branch lengths
    '((A:0,B:1):0,(C:2,D:1):1,E:3)',
    '((A:1,B):1,(C:2,D:1):0.5,E:3)',
    '((A:0,B:0):0,(C:0,D:1):0)',
    // a root position exactly at a node (the clamp to 0)
    '((A:1,B:1):0,C:2,D:2)'
];
[1, 2, 3, 5, 7, 11, 13, 23].forEach(function (seed) {
    [4, 5, 6, 8, 11, 14, 18].forEach(function (n) {
        out.push(nwk(randomTree(n, seed, 2)));
        out.push(nwk(randomTree(n, seed, 3)));
        out.push(nwk(randomMultifurcating(n, seed)));
        out.push(nwk(caterpillar(n, seed)));
    });
    out.push(nwk(star(6, seed)));
});
[3, 9, 17, 31, 5, 8, 12].forEach(function (seed) {
    out.push(nwk(clock(40, seed)));
});
[101, 202].forEach(function (seed) {
    out.push(nwk(randomTree(150, seed, 2)));
    out.push(nwk(randomMultifurcating(150, seed)));
});
process.stdout.write(out.join('\n') + '\n');
