// Writes the representative-tips contract's input trees as Newick, one per
// line: the desktop unit tests' trees, hand-made cases for ties, missing and
// zero branch lengths, near-zero branches and polytomies, then random binary,
// multifurcating, caterpillar, star and clock trees from a seeded generator --
// some with branch lengths rounded to three decimals, so clade diameters and
// medoid totals tie, some stripped of their lengths. No negative lengths: the
// desktop reads one as missing, the viewer keeps it, which is a matter for
// the readers, not for this contract.
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

function exact(r) {
    return 0.05 + r();
}

function rounded(r) {
    return Math.round((0.01 + r()) * 1000) / 1000;
}

function randomTree(n, r, rootDegree, lengthOf) {
    let active = [];
    for (let i = 0; i < n; ++i) active.push(leaf(i));
    while (active.length > rootDegree) {
        let x = active.splice(Math.floor(r() * active.length), 1)[0];
        let y = active.splice(Math.floor(r() * active.length), 1)[0];
        x.branch_length = lengthOf(r);
        y.branch_length = lengthOf(r);
        active.push({children: [x, y]});
    }
    active.forEach(function (nd) { nd.branch_length = lengthOf(r); });
    return {children: active};
}

function randomMultifurcating(n, r, lengthOf) {
    let active = [];
    for (let i = 0; i < n; ++i) active.push(leaf(i));
    while (active.length > 1) {
        let k = Math.min(2 + Math.floor(r() * 3), active.length);
        let parent = {children: []};
        for (let i = 0; i < k; ++i) {
            let x = active.splice(Math.floor(r() * active.length), 1)[0];
            x.branch_length = lengthOf(r);
            parent.children.push(x);
        }
        active.push(parent);
    }
    return active[0];
}

function caterpillar(n, r, lengthOf) {
    let t0 = leaf(0); t0.branch_length = lengthOf(r);
    let t1 = leaf(1); t1.branch_length = lengthOf(r);
    let current = {children: [t0, t1]};
    for (let i = 2; i < n; ++i) {
        current.branch_length = lengthOf(r);
        let ti = leaf(i); ti.branch_length = lengthOf(r);
        current = {children: [current, ti]};
    }
    return current;
}

function star(n, r, lengthOf) {
    let root = {children: []};
    for (let i = 0; i < n; ++i) {
        let t = leaf(i);
        t.branch_length = lengthOf(r);
        root.children.push(t);
    }
    return root;
}

function clock(n, r) {
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

// no branch lengths at all: the topological fallback
function strip(node) {
    delete node.branch_length;
    (node.children || []).forEach(strip);
    return node;
}

// some branch lengths missing and some zero
function holes(node, r) {
    let visit = function (nd) {
        let x = r();
        if (x < 0.15) {
            delete nd.branch_length;
        } else if (x < 0.3) {
            nd.branch_length = 0;
        }
        (nd.children || []).forEach(visit);
    };
    (node.children || []).forEach(visit);
    return node;
}

let out = [
    // the desktop's RepresentativeTipSelectorTest trees
    '((A:0.01,B:0.01):0.4,(C:0.01,D:0.01):0.4)',
    '(A:0.05,(B:0.1,(C:0.05,D:0.1):0.2):0.2)',
    '(A:0.01,(B:0.01,(C:0.01,D:0.01):0.5):0.5)',
    '((A,B),(C,D))',
    '(A:0.1,B:0.1)',
    // exact ties: equal medoid totals, equal terminal branches, equal diameters
    '(A:1,B:1,C:1)',
    '((A:1,B:1):2,(C:1,D:1):2)',
    '((A:1,B:1):1,(C:1,D:1):1,(E:1,F:1):1)',
    '(((A:1,B:1):1,(C:1,D:1):1):1,((E:1,F:1):1,(G:1,H:1):1):1)',
    // zero and missing branch lengths
    '((A:0,B:0):0,(C:0,D:0):0)',
    '((A:0,B:1):0,(C:2,D:1):1,E:3)',
    '((A:1,B):1,(C:2,D:1):0.5,E:3)',
    // named internal nodes, which a merge during extraction drops
    '((A:1,B:2)x:1,(C:3,D:4)y:1)',
    // near-zero branches, as FastTree writes a zero
    '((A:5e-9,B:5e-9):0.1,(C:0.2,D:5e-9):0.1)',
    // a polytomy under a polytomy
    '((A:0.3,B:0.1,C:0.2,D:0.1):0.5,(E:0.2,F:0.2,G:0.4):0.5,H:1)'
];
[1, 2, 3, 5].forEach(function (seed) {
    [4, 5, 6, 8, 12, 17].forEach(function (n) {
        out.push(nwk(randomTree(n, rng(seed * 1000 + n * 10 + 2), 2, exact)));
        out.push(nwk(randomTree(n, rng(seed * 1000 + n * 10 + 3), 3, rounded)));
        out.push(nwk(randomMultifurcating(n, rng(seed * 1000 + n * 10 + 7), rounded)));
        out.push(nwk(caterpillar(n, rng(seed * 1000 + n * 10 + 11), exact)));
    });
    out.push(nwk(star(6, rng(seed * 1000 + 13), rounded)));
});
[3, 9].forEach(function (seed) {
    out.push(nwk(clock(30, rng(seed * 1000 + 17))));
});
[1, 2].forEach(function (seed) {
    [6, 12].forEach(function (n) {
        out.push(nwk(strip(randomTree(n, rng(seed * 1000 + n * 10 + 19), 2, exact))));
    });
});
[1, 2, 3].forEach(function (seed) {
    [8, 17].forEach(function (n) {
        let r = rng(seed * 1000 + n * 10 + 23);
        out.push(nwk(holes(randomMultifurcating(n, r, rounded), r)));
    });
});
out.push(nwk(randomTree(60, rng(101), 2, exact)));
out.push(nwk(randomMultifurcating(60, rng(202), rounded)));
process.stdout.write(out.join('\n') + '\n');
