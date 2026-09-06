// draggable-toolbar.js -- shared by demo.html and open.html.
//
// Makes the page's floating toolbar card draggable, so it can be pulled out
// of the way of anything the tree draws in the same corner (the overview
// box, the visualizations legend). Same manners as the in-tree overview:
// drag anywhere on the card's background, the position is remembered in
// localStorage, and a double-click snaps it back to its home corner.

(function () {
    'use strict';

    const MARGIN = 4; // keep at least this many px of card inside the window

    window.makeToolbarDraggable = function (toolbar, storageKey) {
        let custom = null; // {x, y} while moved; null means "home corner"
        let drag = null;   // {dx, dy, moved} during a pointer drag

        try {
            custom = JSON.parse(localStorage.getItem(storageKey));
        } catch {
            custom = null; // storage unavailable (private mode, blocked cookies)
        }

        function save() {
            try {
                if (custom) {
                    localStorage.setItem(storageKey, JSON.stringify(custom));
                } else {
                    localStorage.removeItem(storageKey);
                }
            } catch { /* not persisted, still draggable */ }
        }

        function clamp(x, y) {
            const r = toolbar.getBoundingClientRect();
            const maxX = window.innerWidth - r.width - MARGIN;
            const maxY = window.innerHeight - r.height - MARGIN;
            return {
                x: Math.round(Math.min(Math.max(x, MARGIN), Math.max(maxX, MARGIN))),
                y: Math.round(Math.min(Math.max(y, MARGIN), Math.max(maxY, MARGIN))),
            };
        }

        function place(x, y) {
            custom = clamp(x, y);
            toolbar.style.left = custom.x + 'px';
            toolbar.style.top = custom.y + 'px';
            toolbar.style.right = 'auto';
        }

        function goHome() {
            custom = null;
            toolbar.style.left = '';
            toolbar.style.top = '';
            toolbar.style.right = '';
            save();
        }

        function restore() {
            if (custom) {
                place(custom.x, custom.y);
                save(); // write back the clamped position
            }
        }

        // The card's own controls (links, the tree picker) must keep working;
        // only the background and plain text act as the drag handle.
        function onControl(target) {
            return !!target.closest('a, select, input, button, label, textarea');
        }

        // The logo <img> would otherwise start a native image drag. (Do NOT
        // preventDefault on pointerdown instead: that suppresses the
        // compatibility mouse events, killing the dblclick below.)
        toolbar.addEventListener('dragstart', function (e) {
            e.preventDefault();
        });

        toolbar.addEventListener('pointerdown', function (e) {
            if (e.button !== 0 || onControl(e.target)) {
                return;
            }
            const r = toolbar.getBoundingClientRect();
            drag = {dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false};
            toolbar.setPointerCapture(e.pointerId);
            toolbar.classList.add('dragging');
        });

        toolbar.addEventListener('pointermove', function (e) {
            if (!drag) {
                return;
            }
            // a couple of px of jitter is a click, not a move
            if (!drag.moved
                && Math.abs(e.clientX - drag.dx - toolbar.getBoundingClientRect().left) < 3
                && Math.abs(e.clientY - drag.dy - toolbar.getBoundingClientRect().top) < 3) {
                return;
            }
            drag.moved = true;
            place(e.clientX - drag.dx, e.clientY - drag.dy);
        });

        function endDrag() {
            if (!drag) {
                return;
            }
            if (drag.moved) {
                save();
            }
            drag = null;
            toolbar.classList.remove('dragging');
        }

        toolbar.addEventListener('pointerup', endDrag);
        toolbar.addEventListener('pointercancel', endDrag);

        toolbar.addEventListener('dblclick', function (e) {
            if (!onControl(e.target)) {
                goHome();
            }
        });

        // A dragged card must never be stranded outside a shrunken window.
        window.addEventListener('resize', function () {
            if (custom && !toolbar.hidden) {
                place(custom.x, custom.y);
                save();
            }
        });

        toolbar.title = 'Drag to move · double-click to snap back';

        // Restore the remembered position -- but a hidden toolbar (open.html
        // before the first tree) has no size to clamp against yet, so wait
        // until it is shown.
        if (toolbar.hidden) {
            const mo = new MutationObserver(function () {
                if (!toolbar.hidden) {
                    mo.disconnect();
                    restore();
                }
            });
            mo.observe(toolbar, {attributes: true, attributeFilter: ['hidden']});
        } else {
            restore();
        }
    };
}());
