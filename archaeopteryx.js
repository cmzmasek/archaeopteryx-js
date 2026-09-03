/**
 *  Copyright (C) 2026 Christian M. Zmasek
 *  Copyright (C) 2026 Yun Zhang
 *  Copyright (C) 2026 J. Craig Venter Institute
 *  All rights reserved
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2.1 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA
 *
 */

// v 2.3.2
// 2026-04-22
//
// Archaeopteryx.js is a software tool for the visualization and
// analysis of highly annotated phylogenetic trees.
//
// Availability:
//   https://github.com/cmzmasek/archaeopteryx-js
//   https://www.npmjs.com/package/archaeopteryx
//
// Dependencies:
// * forester.js: https://www.npmjs.com/package/archaeopteryx
// * phyloxml.js: https://www.npmjs.com/package/phyloxml
// * d3.js (version 7): https://www.npmjs.com/package/d3
// * sax.js (1.2.4): https://www.npmjs.com/package/sax/v/1.2.4
//
//   For graphics (PNG) export, the following two libraries are required as well:
// * canvg: https://www.npmjs.com/package/canvg
// * rgbcolor: https://www.npmjs.com/package/rgbcolor
//
//   File (Newick/New Hampshire, phyloXML, FASTA) and SVG download, as well as
//   saving the PNG, use native browser APIs (Blob, canvas.toBlob, and an
//   <a download> link), so Blob.js, canvas-toBlob.js and FileSaver.js are no
//   longer required.
//
//   The user interface (control panel, sliders, dialogs) is built with native
//   DOM elements, so jQuery UI (and its CSS) is no longer required.
//
//
// Developer documentation:
// https://docs.google.com/document/d/1COVe0iYbKtcBQxGTP4_zuimpk2FH9iusOVOgd5xCJ3A
//
// User documentation:
// https://cmzmasek.github.io/archaeopteryx-js/

if (!d3) {
    throw new Error("no d3.js");
}

if (!forester) {
    throw new Error("no forester.js");
}

if (!phyloXml) {
    throw new Error("no phyloxml.js");
}

(function archaeopteryx() {

    "use strict";

    const VERSION = '2.3.2';
    const WEBSITE = 'https://cmzmasek.github.io/archaeopteryx-js/';
    const DESKTOP_WEBSITE = 'https://cmzmasek.github.io/archaeopteryx/';
    const SOURCE_WEBSITE = 'https://github.com/cmzmasek/archaeopteryx-js';
    const LICENSE_WEBSITE = 'https://github.com/cmzmasek/archaeopteryx-js/blob/master/LICENSE';
    const LICENSE_NAME = 'LGPL-2.1-or-later';
    const NAME = 'Archaeopteryx.js';

    // Categorical visualization palette: Observable10 (2023; clearer colour-
    // vision separation than the old category10) followed by a darkened
    // counterpart of each for fields of 11-20 values. ONE palette for every
    // cardinality -- the old category10/20/50 switch recoloured the whole
    // tree whenever a field crossed a threshold.
    const VIS_COLOR_PALETTE = [
        '#4269d0', '#efb118', '#ff725c', '#6cc5b0', '#3ca951',
        '#ff8ab7', '#a463f2', '#97bbf5', '#9c6b4e', '#9498a0',
        '#304c97', '#ad8011', '#b95343', '#4e8f80', '#2c7b3b',
        '#b96485', '#7748b0', '#6e88b2', '#714e39', '#6b6e74'];
    // 3-stop viridis for numeric ranges (colour-vision-safe); domain is the
    // field's min / mean / max over the whole tree.
    const VIS_COLOR_RAMP = ['#440154', '#21908C', '#FDE725'];
    // The 7 distinct fill symbols d3 v7 actually has -- the old auto list
    // offered triangle-up AND triangle-down, which v7 renders identically.
    const VIS_SHAPES = ['circle', 'square', 'diamond', 'triangle', 'cross', 'star', 'wye'];

    // Past the palette's 20 entries, wide categorical fields continue the
    // desktop's qualitativeColor scheme: each further cycle re-uses the
    // palette blended increasingly toward white (odd cycles) then black
    // (even), capped at 0.55 -- deterministic for any number of values.
    function extendedPaletteColor(i) {
        const len = VIS_COLOR_PALETTE.length;
        let c = VIS_COLOR_PALETTE[i % len];
        let cycle = Math.floor(i / len);
        if (cycle === 0) {
            return c;
        }
        let f = Math.min(0.55, 0.2 * cycle);
        return d3.interpolateRgb(c, (cycle % 2) === 1 ? '#ffffff' : '#000000')(f);
    }

    // -----------------------------
    // Named colors and orientations
    // -----------------------------
    const WHITE = '#ffffff';

    // ------------------------------
    // File suffixes
    // ------------------------------
    const NH_SUFFIX = '.tre';
    const PNG_SUFFIX = '.png';
    const SVG_SUFFIX = '.svg';
    const XML_SUFFIX = '.xml';
    const FASTA_SUFFIX = '.fasta';


    // ---------------------------
    // Default values for options
    // ---------------------------
    const BACKGROUND_COLOR_DEFAULT = '#f0f0f0';
    const BACKGROUND_COLOR_FOR_PRINT_EXPORT_DEFAULT = '#ffffff';
    const BRANCH_COLOR_DEFAULT = '#909090';
    const BRANCH_WIDTH_DEFAULT = 1;
        const FONT_SIZE_DEFAULT = 11; // one size for every label, as on the desktop
    // Whatever sans-serif the reader's own system renders best: system-ui first,
    // then the named faces for platforms that do not honour it, then the generic.
    const FONT_DEFAULTS = ['system-ui', '-apple-system', 'Segoe UI', 'Roboto',
        'Helvetica Neue', 'Arial', 'sans-serif'];
    // Okabe-Ito color-blind-safe palette for search / selection highlights.
    const FOUND0_COLOR_DEFAULT = '#0072B2';      // Search A  — blue
    const FOUND1_COLOR_DEFAULT = '#D55E00';      // Search B  — vermillion
    const FOUND0AND1_COLOR_DEFAULT = '#F0E442';  // A and B   — yellow
    const SELECTED_COLOR_DEFAULT = '#009E73';    // Selected  — bluish green
    const LABEL_COLOR_DEFAULT = '#202020';
    // The tree's own dark palette, so the light/dark switch takes the drawing
    // with it and not just the panel.
    const BACKGROUND_COLOR_DARK = '#182029';
    const BRANCH_COLOR_DARK = '#8fa1b3';
    const LABEL_COLOR_DARK = '#e7eef5';
    const NAME_FOR_NH_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + NH_SUFFIX;
    const NAME_FOR_PHYLOXML_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + XML_SUFFIX;
    const NAME_FOR_PNG_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + PNG_SUFFIX;
    const NAME_FOR_SVG_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + SVG_SUFFIX;
    const NAME_FOR_FASTA_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + FASTA_SUFFIX;
    const NODE_LABEL_GAP_DEFAULT = 10;
    const NODE_SIZE_DEFAULT_DEFAULT = 3;
    const VISUALIZATIONS_LEGEND_YPOS_DEFAULT = 30;

    // ---------------------------
    // Default values for settings
    // ---------------------------
    const CONTROLS_0_LEFT_DEFAULT = 20;
    const CONTROLS_0_TOP_DEFAULT = 10;
    // The legend drawn over the tree. It used to take its type from three
    // settings named for the control panel, which had stopped styling the
    // panel long ago; its colour follows the tree's label colour, so it
    // turns light with the rest of the drawing in dark mode.
    const DISPLY_HEIGHT_DEFAULT = 600;
    const DISPLAY_WIDTH_DEFAULT = 800;
    // Gap between the control panel's right edge and the root, and the offset
    // used when there is no left control panel to clear at all.
    const ROOT_CLEARANCE = 20;

    // ------------------------------
    // Various constants and settings
    // ------------------------------
    const ACC_GENBANK = "GENBANK";
    const ACC_NCBI = "NCBI";
    const ACC_REFSEQ = "REFSEQ";
    const ACC_UNIPROT = "UNIPROT";
    const ACC_UNIPROTKB = "UNIPROTKB";
    const ACC_SWISSPROT = "SWISSPROT";
    const ACC_TREMBL = "TREMBL";
    const BRANCH_EVENT_APPLIES_TO = 'parent_branch';
    const BRANCH_EVENT_DATATYPE = 'xsd:string';
    const BRANCH_EVENT_REF = 'aptx:branch_event';
    const BRANCH_LENGTH_DIGITS_DEFAULT = 6;
    const BRANCH_WIDTH_MAX = 9;
    const BRANCH_WIDTH_MIN = 0.5;
    const BUTTON_ZOOM_IN_FACTOR = 1.1;
    const BUTTON_ZOOM_IN_FACTOR_SLOW = 1.05;
    const BUTTON_ZOOM_OUT_FACTOR = 1 / BUTTON_ZOOM_IN_FACTOR;
    const BUTTON_ZOOM_OUT_FACTOR_SLOW = 1 / BUTTON_ZOOM_IN_FACTOR_SLOW;
    const CONFIDENCE_VALUE_DIGITS_DEFAULT = 2;
    const DEFAULT = 'default';
    // The desktop's own event colours (TreeColorSet): Okabe-Ito vermillion,
    // bluish-green and amber, which stay apart for colour-vision-deficient
    // viewers where the old pure red / green / yellow did not.
    const DUPLICATION_AND_SPECIATION_COLOR_COLOR = '#E69F00';
    const DUPLICATION_COLOR = '#D55E00';
    const FASTA_EXPORT_FORMAT = 'Fasta';
    const FONT_SIZE_MAX = 26;
    const FONT_SIZE_MIN = 2;
    const LABEL_SIZE_CALC_ADDITION = 80;
    const LABEL_SIZE_CALC_FACTOR = 0.5;
    const LEGEND_LABEL_COLOR = 'legendLabelColor';
    const LEGEND_NODE_SHAPE = 'legendNodeShape';
    const NH_EXPORT_FORMAT = 'Newick';
    const NODE_SIZE_MAX = 9;
    const NODE_SIZE_MIN = 1;
    const PDF_EXPORT_FORMAT = 'PDF';
    const PHYLOXML_EXPORT_FORMAT = 'phyloXML';
    const PNG_EXPORT_FORMAT = 'PNG';
    const RESET_SEARCH_A_BTN_TOOLTIP = 'reset (remove) search result A';
    const RESET_SEARCH_B_BTN_TOOLTIP = 'reset (remove) search result B';
    // Auto-hide Labels is only offered once a tree is dense enough for labels
    // to actually collide.
    // A tree small enough to draw boldly. Thin hairlines suit a crowded tree;
    // on a dozen branches they just look faint.
    const SMALL_TREE_MAX_EXT_NODES = 50;
    const BRANCH_WIDTH_SMALL_TREE = 2;
    // Branch lengths are drawn to scale only when most branches have one.
    const PHYLOGRAM_MIN_BRANCH_FRACTION = 0.5;
    const SHORTEN_NAME_MAX_LENGTH = 18;
    const PANEL_STYLE_ID = 'aptx-panel-styles';
    // How wide a legend row is treated as, for grabbing it with the mouse.
    const PANEL_WIDTH = 214; // fixed control-panel width; shared by the .aptx-panel CSS and leftPanelClearance() so the two can't drift
    const SLIDER_CLASS = 'aptx-slider';
    const SLIDER_STEP = 0.5;
    const SPECIATION_COLOR = '#009E73';
    const SVG_EXPORT_FORMAT = 'SVG';
    const TOP_AND_BOTTOM_BORDER_HEIGHT = 10;
    const TRANSITION_DURATION_DEFAULT = 750;
    const WARNING = 'ArchaeopteryxJS: WARNING';
    const MESSAGE = 'ArchaeopteryxJS: ';
    const ERROR = 'ArchaeopteryxJS: ERROR: ';
    const ZOOM_INTERVAL = 200;

    // ---------------------------
    // Names for GUI elements
    // ---------------------------
    const BASE_BACKGROUND = 'basebackground';
    const VISUAL_STYLES_CB = 'vstyles_cb';
    const BRANCH_EVENTS_CB = 'brevts_cb';
    const BRANCH_LENGTH_VALUES_CB = 'bl_cb';
    const BRANCH_WIDTH_SLIDER = 'bw_sl';
    // The layout row: rectangular (root at left) vs circular. An exclusive pair,
    // as in the desktop -- which offers three more layouts (root at top / bottom,
    // unrooted) that this viewer does not draw.
    const LAYOUT_RECT_BUTTON = 'layout_rect_b';
    const LAYOUT_CIRC_BUTTON = 'layout_circ_b';
    const CLADOGRAM_BUTTON = 'cla_b';
    const CONFIDENCE_VALUES_CB = 'conf_cb';
    const DOWNLOAD_BUTTON = 'dl_b';
    const SUBMIT_SELECTED_NODES_BUTTON = 'submit_sel_nodes_b';
    const DYNAHIDE_CB = 'dynahide_cb';
    const EXPORT_FORMAT_SELECT = 'exp_f_sel';
    const FONT_SIZE_SLIDER = 'fs_sl';
    const EXTERNAL_LABEL_CB = 'extl_cb';
    const INTERNAL_LABEL_CB = 'intl_cb';
    const LABEL_COLOR_SELECT_MENU = 'lcs_menu';
    const MIDPOINT_ROOT_BUTTON = 'midpointr_b';
    // The desktop Archaeopteryx logo (forester/archaeopteryx_icon_assets/
    // archaeopteryx-anime.svg), inlined so the library stays a single file.
    // Gradient ids are prefixed: they were generic enough to collide with an
    // embedding page's own defs.
    const ARCHAEOPTERYX_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Archaeopteryx"> <defs> <linearGradient id="aptxlogo-wg" x1="0" y1="1" x2="1" y2="0"> <stop offset="0" stop-color="#4f46e5"/><stop offset="0.55" stop-color="#38bdf8"/><stop offset="1" stop-color="#a7f3d0"/> </linearGradient> <linearGradient id="aptxlogo-wg2" x1="0" y1="1" x2="1" y2="0"> <stop offset="0" stop-color="#3730a3"/><stop offset="1" stop-color="#4f79e0"/> </linearGradient> <linearGradient id="aptxlogo-tg" x1="0" y1="1" x2="1" y2="0"> <stop offset="0" stop-color="#f43f5e"/><stop offset="0.5" stop-color="#fb923c"/><stop offset="1" stop-color="#fde047"/> </linearGradient> <linearGradient id="aptxlogo-bg" x1="0" y1="0" x2="0" y2="1"> <stop offset="0" stop-color="#fff7e0"/><stop offset="1" stop-color="#fcd34d"/> </linearGradient> </defs> <g transform="translate(28.9,18.0) scale(0.9091)"> <g stroke="#25304f" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"> <path d="M 78.0,152.0 C 49.3,150.6 12.5,173.3 -4.4,194.3 C 25.1,192.0 66.1,175.5 78.0,152.0 Z" fill="url(#aptxlogo-tg)"/> <path d="M 78.0,152.0 C 48.1,143.8 3.5,158.8 -19.7,176.6 C 12.1,181.2 59.5,173.7 78.0,152.0 Z" fill="url(#aptxlogo-tg)"/> <path d="M 78.0,152.0 C 51.8,138.2 6.9,142.5 -18.7,154.0 C 10.0,164.8 56.0,167.9 78.0,152.0 Z" fill="url(#aptxlogo-tg)"/> <path d="M 78.0,152.0 C 58.9,135.3 20.6,130.3 -2.8,135.1 C 18.9,149.7 56.6,161.2 78.0,152.0 Z" fill="url(#aptxlogo-tg)"/> <path d="M 118.0,126.0 C 110.4,106.2 84.4,93.0 65.5,92.1 C 75.9,110.5 99.0,129.6 118.0,126.0 Z" fill="url(#aptxlogo-wg2)"/> <path d="M 118.0,126.0 C 115.6,103.3 92.6,79.7 73.5,71.3 C 79.1,93.8 97.5,122.0 118.0,126.0 Z" fill="url(#aptxlogo-wg2)"/> <path d="M 118.0,126.0 C 123.0,106.1 110.4,79.8 96.5,67.4 C 94.4,87.9 101.6,117.0 118.0,126.0 Z" fill="url(#aptxlogo-wg2)"/> <path d="M 106,172 L 101,202 M 132,172 L 129,202" fill="none" stroke-width="9"/> <path d="M 101,202 L 88,209 M 101,202 L 112,210 M 101,202 L 99,213 M 129,202 L 116,209 M 129,202 L 140,210 M 129,202 L 128,213" fill="none" stroke-width="6"/> <path d="M 96,176 C 74,168 66,146 76,128 C 86,110 110,102 132,106 C 152,110 164,126 162,146 C 160,166 142,180 120,180 C 112,180 103,179 96,176 Z" fill="url(#aptxlogo-bg)"/> <path d="M 100,174 C 86,166 82,150 90,138 C 96,146 108,152 122,152 C 136,152 148,148 156,140 C 160,156 150,172 128,177 C 118,179 108,178 100,174 Z" fill="#fff6dd" stroke="none"/> <path d="M 96,176 C 74,168 66,146 76,128 C 86,110 110,102 132,106 C 152,110 164,126 162,146 C 160,166 142,180 120,180 C 112,180 103,179 96,176 Z" fill="none"/> <path d="M 150.0,60.0 C 159.5,51.2 158.7,35.2 152.9,25.9 C 145.3,35.7 141.5,51.8 150.0,60.0 Z" fill="url(#aptxlogo-wg)"/> <path d="M 164.0,56.0 C 174.4,51.0 177.8,37.3 175.2,28.0 C 166.2,34.2 158.9,46.9 164.0,56.0 Z" fill="url(#aptxlogo-wg)"/> <path d="M 136.0,66.0 C 141.8,56.5 137.0,44.2 129.6,38.5 C 125.7,48.3 126.7,61.9 136.0,66.0 Z" fill="url(#aptxlogo-wg)"/> <path d="M 158,58 C 186,54 208,72 208,96 C 208,120 188,136 164,134 C 140,132 126,114 128,92 C 130,72 142,60 158,58 Z" fill="url(#aptxlogo-bg)"/> <path d="M 203,82 C 216,84 230,92 238,100 C 230,108 216,113 202,112 C 206,104 206,90 203,82 Z" fill="#fb923c"/> <path d="M 204,101 C 214,102 224,103 234,101" fill="none" stroke-width="4"/> <path d="M 128.0,116.0 C 113.1,91.9 75.3,80.3 50.0,83.2 C 68.3,104.8 103.7,124.6 128.0,116.0 Z" fill="url(#aptxlogo-wg)"/> <path d="M 128.0,116.0 C 118.0,85.8 79.7,60.2 51.1,54.1 C 65.4,83.1 98.9,116.3 128.0,116.0 Z" fill="url(#aptxlogo-wg)"/> <path d="M 128.0,116.0 C 127.0,83.7 97.3,47.3 71.5,32.7 C 76.9,65.0 99.8,107.4 128.0,116.0 Z" fill="url(#aptxlogo-wg)"/> <path d="M 128.0,116.0 C 136.1,88.7 121.1,50.1 103.3,30.9 C 99.0,59.5 106.6,101.2 128.0,116.0 Z" fill="url(#aptxlogo-wg)"/> </g> <g> <ellipse cx="172" cy="94" rx="15" ry="17" fill="#25304f"/> <ellipse cx="172" cy="97" rx="10" ry="11" fill="#38bdf8"/> <circle cx="167" cy="88" r="6" fill="#ffffff"/> <circle cx="178" cy="103" r="3" fill="#ffffff" opacity="0.9"/> <ellipse cx="146" cy="112" rx="9" ry="5" fill="#fb7185" opacity="0.75"/> <path d="M 52,53 C 53.62,59.75 54.25,60.38 61,62 C 54.25,63.62 53.62,64.25 52,71 C 50.38,64.25 49.75,63.62 43,62 C 49.75,60.38 50.38,59.75 52,53 Z" fill="#fde68a"/> <path d="M 222,161 C 223.26,166.25 223.75,166.74 229,168 C 223.75,169.26 223.26,169.75 222,175 C 220.74,169.75 220.25,169.26 215,168 C 220.25,166.74 220.74,166.25 222,161 Z" fill="#fde68a"/> <path d="M 86,208 C 87.08,212.5 87.5,212.92 92,214 C 87.5,215.08 87.08,215.5 86,220 C 84.92,215.5 84.5,215.08 80,214 C 84.5,212.92 84.92,212.5 86,208 Z" fill="#fde68a"/> </g> </g> </svg>';
    const NODE_DATA = 'node_data_dialog';
    const NODE_EVENTS_CB = 'nevts_cb';
    const NODE_NAME_CB = 'nn_cb';
    const NODE_SHAPE_SELECT_MENU = 'nshapes_menu';
    const NODE_SIZE_SLIDER = 'ns_sl';
    const VIS_CB = 'vis_cb';
    const LADDERIZE_BUTTON = 'ladderize_b';
    const PHYLOGRAM_ALIGNED_BUTTON = 'phya_b';
    const PHYLOGRAM_BUTTON = 'phy_b';
    const PHYLOGRAM_CLADOGRAM_CONTROLGROUP = 'phy_cla_g';
    const ABOUT_DIALOG = 'aptx_about';
    const PROG_NAME = 'progname';
    const PROGNAMELINK = 'prognamelink';
    const TREE_DESC = 'tree_desc';
    const RESET_SEARCH_A_BTN = 'reset_s_a';
    const RESET_SEARCH_B_BTN = 'reset_s_b';
    const RETURN_TO_SUPERTREE_BUTTON = 'ret_b';
    const RETURN_TO_SUPERTREE_BUTTON_BY_ONE = 'ret1_b';
    const SEARCH_FIELD_0 = 'sf0';
    const SEARCH_FIELD_1 = 'sf1';
    const SEARCH_OPTIONS_CASE_SENSITIVE_CB = 'so_cs_cb';
    const SEARCH_OPTIONS_GROUP = 'search_opts_g';
    const SEARCH_OPTIONS_NEGATE_RES_CB = 'so_neg_cb';
    const SEARCH_FIELD_SELECT_0 = 'sfs0';
    const SEARCH_FIELD_SELECT_1 = 'sfs1';
    const SEARCH_MODE_SELECT_0 = 'sms0';
    const SEARCH_MODE_SELECT_1 = 'sms1';
    const SEARCH_VALUE2_0 = 'sv2_0';
    const SEARCH_VALUE2_1 = 'sv2_1';
    const SEARCH_DATALIST_0 = 'sdl0';
    const SEARCH_DATALIST_1 = 'sdl1';
    const SEARCH_AUTOCOMPLETE_CAP = 2000;
    const SEARCH_COMBINE_SELECT = 'scmb';
    const SEARCH_COMBINE_ROW = 'scmb_row';
    const SEQUENCE_CB = 'seq_cb';
    const SHORTEN_NODE_NAME_CB = 'shortennodename_cb';
    const TAXONOMY_CB = 'tax_cb';
    const ZOOM_IN_X = 'zoomin_x';
    const ZOOM_IN_Y = 'zoomout_y';
    const ZOOM_OUT_X = 'zoomout_x';
    const ZOOM_OUT_Y = 'zoomin_y';
    const ZOOM_TO_FIT = 'zoomtofit';
    const ZOOM_TO_EXPAND_Y = 'zoomtoexpandy';
    const FIT_WIDTH_BUTTON = 'fitwidth';




    // ---------------------------
    // Key codes
    // ---------------------------
    const VK_ESC = 27;
    const VK_C = 67;
    const VK_L = 76;
    const VK_M = 77;
    const VK_O = 79;
    const VK_P = 80;
    const VK_R = 82;
    const VK_W = 87;
    const VK_DELETE = 46;
    const VK_BACKSPACE = 8;
    const VK_HOME = 36;
    const VK_UP = 38;
    const VK_DOWN = 40;
    const VK_LEFT = 37;
    const VK_RIGHT = 39;
    const VK_PLUS = 187;
    const VK_MINUS = 189;
    const VK_PLUS_N = 107;
    const VK_MINUS_N = 109;
    const VK_PAGE_UP = 33;
    const VK_PAGE_DOWN = 34;


    // ---------------------------
    // Regular Expressions
    // ---------------------------

    const RE_SWISSPROT_TREMBL = new RegExp('^(?=.*[A-Z].*_.*[A-Z].*)[A-Z0-9]{2,10}_[A-Z0-9]{3,5}$');
    const RE_SWISSPROT_TREMBL_PFAM = new RegExp('^((?=.*[A-Z].*_.*[A-Z].*)[A-Z0-9]{2,10}_[A-Z0-9]{3,5})/[0-9]+-[0-9]+$');
    const RE_GENBANK_PROT = new RegExp('^[A-Z]{3}[0-9\\\\.]+$');
    const RE_GENBANK_NUC = new RegExp('^[A-Z]{1,2}[0-9\\\\.]+$');
    const RE_REFSEQ = new RegExp('^[A-Z]{2}_[0-9\\\\.]+$');
    const RE_UNIPROTKB = new RegExp('^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$');

    // ---------------------------
    // Colors
    // ---------------------------


    // ---------------------------
    // "Instance variables"
    // ---------------------------
    let _baseSvg = null;
    let _basicTreeProperties = null;
    let _displayHeight = 0;
    let _displayWidth = 0;
    let _dynahide_counter = 0;
    let _dynahide_factor = 0;
    let _foundNodes0 = new Set();
    let _foundNodes1 = new Set();
    let _selectedNodes = new Set();
    let _i = 0;
    let _id = null;
    let _intervalId = 0;
    let _maxLabelLength = 0;
    let _nodeLabels = null;
    let _state = null;      // live display state: what the control panel writes to
    let _root = null;
    let _root_const = null;
    let _in_subtree = false;
    let _searchBox0Empty = true;
    let _searchBox1Empty = true;
    let _settings = null;   // fixed for the life of the launch; never written after init
    let _svgGroup = null;
    let _treeData = null;
    let _treeFn = null;
    let _vis = null;        // the automatic visualizations: candidates, scales, choices
    let _w = null;
    let _yScale = null;
    let _radial = null;
    let _radialRotation = 0;          // radians added to the circular layout's angles (X+/X- rotate buttons)
    let _radialLabelsHorizontal = false;   // circular layout: external labels upright at the ring instead of riding their spokes
    let _panelTheme = null;   // null = follow OS; 'light' / 'dark' = header switch choice
    let _searchFields = [];   // available search-field descriptors, rebuilt per tree
    let _zoomListener = null;
    let _zoomed_x_or_y = false;
    let _node_mouseover_div;

    function branchLengthScaling(nodes, width) {

        if (_root.parent) {
            _root.parent.distToRoot = 0;
        }
        forester.preOrderTraversalAll(_root, function (n) {
            n.distToRoot = (n.parent ? n.parent.distToRoot : 0) + bl(n);
        });
        let distsToRoot = nodes.map(function (n) {
            return n.distToRoot;
        });

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(distsToRoot)])
            .range([0, width]);
        forester.preOrderTraversalAll(_root, function (n) {
            n.y = yScale(n.distToRoot);
        });
        return yScale;

        function bl(node) {
            if (!node.branch_length || node.branch_length < 0) {
                return 0;
            } else if (!node.parent || !node.parent.parent) {
                return _basicTreeProperties.averageBranchLength * 0.5;
            }
            return node.branch_length;
        }
    }

    // Current zoom scale (k) from the zoom behavior's stored transform.
    function currentZoomScale() {
        return _baseSvg ? d3.zoomTransform(_baseSvg.node()).k : 1;
    }

    // Sets the zoom scale while preserving the current translation (and applies
    // it, firing the 'zoom' handler). Replaces the v3 _zoomListener.scale(k) setter.
    function setZoomScale(scale) {
        if (_baseSvg) {
            _baseSvg.call(_zoomListener.transform, function () {
                let t = d3.zoomTransform(this);
                return d3.zoomIdentity.translate(t.x, t.y).scale(scale);
            });
        }
    }

    // Applies the current zoom/pan transform to the tree group. Shift gestures
    // are filtered out where _zoomListener is created, so they stay free for
    // moving the legend.
    // ===================== Overview =====================
    // A miniature of the whole tree, shown in a corner once part of the tree has
    // been zoomed out of view, with a rectangle marking the part you are looking
    // at. It appears and disappears on its own -- there is nothing to switch on.
    // Clicking or dragging inside it moves the main view there.

    const OVERVIEW_WIDTH = 118;
    const OVERVIEW_HEIGHT = 92;
    const OVERVIEW_MARGIN = 12;
    const OVERVIEW_PAD = 5;

    let _overviewGroup = null;   // the whole overview, appended above the tree
    let _overviewContent = null; // the scaled miniature inside it
    let _overviewViewport = null;// the "you are here" rectangle
    let _overviewMap = null;     // {scale, tx, ty} mapping tree coords -> overview coords
    let _overviewCorner = 0;     // 0 bottom-right, 1 bottom-left, 2 top-left, 3 top-right
    let _overviewPos = null;     // {x,y} once dragged; null means "use the corner"
    const OVERVIEW_GRIP_HEIGHT = 9;

    function loadOverviewCorner() {
        try {
            let stored = parseInt(localStorage.getItem('aptx-overview-corner'), 10);
            _overviewCorner = (stored >= 0 && stored <= 3) ? stored : 0;
            let free = localStorage.getItem('aptx-overview-pos');
            _overviewPos = free ? JSON.parse(free) : null;
        } catch {
            _overviewCorner = 0; // storage unavailable (private mode, blocked cookies)
            _overviewPos = null;
        }
    }

    function saveOverviewPos() {
        try {
            if (_overviewPos) {
                localStorage.setItem('aptx-overview-pos', JSON.stringify(_overviewPos));
            } else {
                localStorage.removeItem('aptx-overview-pos');
            }
        } catch {
            // storage unavailable; the position still applies for this session
        }
    }

    // Keep a dragged overview inside the display, which also fixes it up after
    // the window is made smaller.
    function clampOverviewPos(pos, size) {
        return {
            x: Math.max(0, Math.min(size.w - OVERVIEW_WIDTH, pos.x)),
            y: Math.max(0, Math.min(size.h - OVERVIEW_HEIGHT, pos.y))
        };
    }

    function overviewCornerPos(corner, size) {
        let right = size.w - OVERVIEW_WIDTH - OVERVIEW_MARGIN;
        let bottom = size.h - OVERVIEW_HEIGHT - OVERVIEW_MARGIN;
        if (corner === 1) {
            return {x: OVERVIEW_MARGIN, y: bottom};
        }
        if (corner === 2) {
            return {x: OVERVIEW_MARGIN, y: OVERVIEW_MARGIN};
        }
        if (corner === 3) {
            return {x: right, y: OVERVIEW_MARGIN};
        }
        return {x: right, y: bottom};
    }

    // Move the overview to the next corner, the way the desktop's "O" does: a
    // plain cycle, bottom-right -> bottom-left -> top-left -> top-right. (An
    // earlier version skipped corners hidden behind a control panel, which
    // sounds helpful but ping-pongs between the two free corners and can never
    // reach the others; a predictable cycle is easier to use. The panels can be
    // hidden if a corner under one is wanted.)
    function moveOverviewToNextCorner() {
        _overviewPos = null; // O goes back to corner snapping, wherever it was dragged
        saveOverviewPos();
        _overviewCorner = (_overviewCorner + 1) % 4;
        try {
            localStorage.setItem('aptx-overview-corner', String(_overviewCorner));
        } catch {
            // storage unavailable; the move still applies for this session
        }
        positionOverview();
    }

    function positionOverview() {
        let size = svgSize();
        if (!_overviewGroup || !size) {
            return;
        }
        let pos;
        if (_overviewPos) {
            pos = clampOverviewPos(_overviewPos, size);
            _overviewPos = pos;
        } else {
            pos = overviewCornerPos(_overviewCorner, size);
        }
        _overviewGroup.attr('transform', 'translate(' + pos.x + ',' + pos.y + ')');
    }

    // True while the user is typing, so an unmodified shortcut key does not fire
    // from inside the search boxes.
    function isTypingTarget(el) {
        if (!el || !el.tagName) {
            return false;
        }
        let tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
    }

    function makeOverview() {
        loadOverviewCorner();
        _overviewGroup = _baseSvg.append('g')
            .attr('class', 'aptx-overview')
            .style('display', 'none')
            .style('pointer-events', 'none');
        // The background doubles as the click target: the group itself takes no
        // pointer events, so the miniature and the viewport rectangle drawn over
        // this rect never intercept anything, and clicks land here.
        let bg = _overviewGroup.append('rect').attr('class', 'aptx-overview-bg')
            .attr('width', OVERVIEW_WIDTH).attr('height', OVERVIEW_HEIGHT)
            .attr('rx', 4).attr('ry', 4)
            // opaque: a branch of the real tree showing through the panel would
            // read as part of the miniature
            .style('fill', _state.backgroundColorDefault)
            .style('stroke-width', 1)
            .style('pointer-events', 'all')
            .style('cursor', 'pointer');
        bg.append('title').text('Click or drag to move the view. Drag the grip at the top to move this overview; press O to send it to the next corner.');
        bindOverviewNavigation(bg);
        _overviewContent = _overviewGroup.append('g').attr('class', 'aptx-overview-tree');
        // a light wash plus a firm outline: enough to read at a glance without
        // obscuring the miniature underneath it
        _overviewViewport = _overviewGroup.append('rect').attr('class', 'aptx-overview-viewport')
            .style('stroke-width', 1.2);

        // A grip along the top edge, drawn last so it sits over the miniature.
        // Dragging inside the overview already means "move the view there", so
        // moving the overview itself needs its own handle rather than a
        // modifier key nobody would find.
        let grip = _overviewGroup.append('g').attr('class', 'aptx-overview-grip')
            .style('pointer-events', 'all')
            .style('cursor', 'move');
        grip.append('rect')
            .attr('x', 1).attr('y', 1)
            .attr('width', OVERVIEW_WIDTH - 2).attr('height', OVERVIEW_GRIP_HEIGHT)
            .attr('rx', 3).attr('ry', 3)
            .attr('class', 'aptx-overview-grip-bar').style('fill-opacity', 0.22);
        for (let i = -2; i <= 2; ++i) {
            grip.append('circle')
                .attr('cx', (OVERVIEW_WIDTH / 2) + (i * 5))
                .attr('cy', 1 + (OVERVIEW_GRIP_HEIGHT / 2))
                .attr('r', 1).attr('class', 'aptx-overview-grip-dot').style('fill-opacity', 0.75);
        }
        grip.append('title').text('Drag to move the overview');
        bindOverviewMove(grip);
        applyOverviewTheme();
    }

    // The overview sits on the tree, so its outline, its "you are here"
    // rectangle and its grip all have to be readable against whichever
    // background the tree currently has. On dark they were near-invisible:
    // a #333333 viewport outline over a #182029 miniature.
    function applyOverviewTheme() {
        if (!_overviewGroup) {
            return;
        }
        let dark = panelDarkActive();
        _overviewGroup.select('rect.aptx-overview-bg')
            .style('fill', _state.backgroundColorDefault)
            .style('stroke', dark ? '#5d6b7a' : '#9a9a9a');
        _overviewGroup.select('rect.aptx-overview-viewport')
            .style('fill', dark ? '#cfe0f2' : '#7f7f7f')
            .style('fill-opacity', dark ? 0.16 : 0.10)
            .style('stroke', dark ? '#dbe7f3' : '#333333');
        _overviewGroup.select('rect.aptx-overview-grip-bar')
            .style('fill', dark ? '#7f8d9c' : '#9a9a9a');
        _overviewGroup.selectAll('circle.aptx-overview-grip-dot')
            .style('fill', dark ? '#e7eef5' : '#5b5b5b');
    }

    // Drag the grip to place the overview anywhere in the display. Like the
    // navigation handlers, every step stops propagation so the tree's own
    // zoom/pan behaviour on the same svg does not also act on the drag.
    function bindOverviewMove(handle) {
        let moving = false;
        let grabDx = 0;
        let grabDy = 0;
        handle.on('pointerdown', function (event) {
            let size = svgSize();
            if (!size) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            moving = true;
            let p = d3.pointer(event, _baseSvg.node());
            let at = _overviewPos ? _overviewPos : overviewCornerPos(_overviewCorner, size);
            grabDx = p[0] - at.x; // keep the grab point under the pointer
            grabDy = p[1] - at.y;
            try {
                this.setPointerCapture(event.pointerId);
            } catch {
                // no pointer capture available; the move handler still works
            }
        });
        handle.on('pointermove', function (event) {
            if (!moving) {
                return;
            }
            event.stopPropagation();
            let size = svgSize();
            if (!size) {
                return;
            }
            let p = d3.pointer(event, _baseSvg.node());
            _overviewPos = clampOverviewPos({x: p[0] - grabDx, y: p[1] - grabDy}, size);
            positionOverview();
        });
        handle.on('pointerup pointercancel pointerleave', function (event) {
            if (!moving) {
                return;
            }
            event.stopPropagation();
            moving = false;
            try {
                this.releasePointerCapture(event.pointerId);
            } catch {
                // capture was never taken
            }
            saveOverviewPos();
        });
    }

    // Centre the main view on the tree position under an overview point, keeping
    // the current zoom level.
    function centerOverviewPoint(ox, oy) {
        let size = svgSize();
        if (!size || !_overviewMap) {
            return;
        }
        let lx = (ox - _overviewMap.tx) / _overviewMap.scale;
        let ly = (oy - _overviewMap.ty) / _overviewMap.scale;
        let k = d3.zoomTransform(_baseSvg.node()).k;
        _baseSvg.call(_zoomListener.transform,
            d3.zoomIdentity.translate((size.w / 2) - (lx * k), (size.h / 2) - (ly * k)).scale(k));
    }

    // Click or drag inside the overview to move the main view. Every handler
    // stops propagation: the tree's own zoom/pan behaviour is bound to the same
    // svg, and without this a drag here would pan the tree as well.
    function bindOverviewNavigation(surface) {
        let dragging = false;
        let goTo = function (event) {
            let p = d3.pointer(event, _overviewGroup.node());
            centerOverviewPoint(p[0], p[1]);
        };
        surface.on('pointerdown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            dragging = true;
            try {
                this.setPointerCapture(event.pointerId);
            } catch {
                // no pointer capture available; the move handler still works
            }
            goTo(event);
        });
        surface.on('pointermove', function (event) {
            if (!dragging) {
                return;
            }
            event.stopPropagation();
            goTo(event);
        });
        surface.on('pointerup pointercancel pointerleave', function (event) {
            if (!dragging) {
                return;
            }
            dragging = false;
            try {
                this.releasePointerCapture(event.pointerId);
            } catch {
                // nothing captured
            }
            event.stopPropagation();
        });
        // A real press fires mousedown/touchstart as well as pointerdown, and
        // d3.zoom pans on THOSE -- so without swallowing them here, a drag in the
        // overview would also drag the tree. dblclick and wheel are d3.zoom's
        // other bindings.
        surface.on('mousedown touchstart dblclick wheel', function (event) {
            event.stopPropagation();
            event.preventDefault();
        });
    }

    function svgSize() {
        let n = _baseSvg ? _baseSvg.node() : null;
        if (!n) {
            return null;
        }
        let w = n.clientWidth || parseFloat(_baseSvg.attr('width'));
        let h = n.clientHeight || parseFloat(_baseSvg.attr('height'));
        return (w > 0 && h > 0) ? {w: w, h: h} : null;
    }

    // Rebuild the miniature. Called when the tree itself changes: the branch
    // paths are copied straight from what was just rendered, so the overview
    // matches the real display in either layout without redoing any geometry.
    function rebuildOverview() {
        if (!_overviewGroup) {
            return;
        }
        let size = svgSize();
        let box = null;
        try {
            box = _svgGroup.node().getBBox(); // in un-zoomed tree coordinates
        } catch {
            box = null;
        }
        if (!size || !box || box.width <= 0 || box.height <= 0) {
            _overviewGroup.style('display', 'none');
            _overviewMap = null;
            return;
        }
        let innerW = OVERVIEW_WIDTH - (2 * OVERVIEW_PAD);
        let innerH = OVERVIEW_HEIGHT - (2 * OVERVIEW_PAD);
        let scale = Math.min(innerW / box.width, innerH / box.height);
        _overviewMap = {
            scale: scale,
            tx: OVERVIEW_PAD + ((innerW - (box.width * scale)) / 2) - (box.x * scale),
            ty: OVERVIEW_PAD + ((innerH - (box.height * scale)) / 2) - (box.y * scale),
            box: box
        };
        positionOverview();
        _overviewContent.attr('transform', 'translate(' + _overviewMap.tx + ',' + _overviewMap.ty + ') scale(' + scale + ')');

        let paths = [];
        _svgGroup.selectAll('path.link').each(function () {
            let d = this.getAttribute('d');
            if (d) {
                paths.push(d);
            }
        });
        let sel = _overviewContent.selectAll('path').data(paths);
        sel.exit().remove();
        sel.enter().append('path')
            .merge(sel)
            .attr('d', function (d) {
                return d;
            })
            .style('fill', 'none')
            .style('stroke', _state.branchColorDefault)
            .style('stroke-width', 1)
            .style('vector-effect', 'non-scaling-stroke'); // stays a hairline however far it is scaled down

        // Search hits (and selected nodes) are marked in the miniature too, as
        // on the desktop: dots in the search colours, so hits outside the
        // current viewport can be spotted and steered to. Search results
        // re-run update(), which ends here, so the dots track every search.
        // Visible nodes only (children, not _children): a hit inside a
        // collapsed clade has no drawn position.
        let hits = [];
        if (_root) {
            forester.preOrderTraversal(_root, function (n) {
                let c = getFoundColor(n);
                if (c) {
                    hits.push({node: n, color: c});
                }
            });
        }
        let dots = _overviewContent.selectAll('circle').data(hits);
        dots.exit().remove();
        dots.enter().append('circle')
            .merge(dots)
            .attr('cx', function (h) {
                return _state.circularDisplay ? radialXY(h.node.x, h.node.y)[0] : h.node.y;
            })
            .attr('cy', function (h) {
                return _state.circularDisplay ? radialXY(h.node.x, h.node.y)[1] : h.node.x;
            })
            .attr('r', 2.2 / scale) // constant on screen, whatever the miniature's scale
            .style('fill', function (h) {
                return h.color;
            })
            .style('stroke', 'none');
        updateOverviewViewport();
    }

    // Move the "you are here" rectangle, and show or hide the whole overview
    // depending on whether any of the tree is currently off-screen.
    function updateOverviewViewport() {
        if (!_overviewGroup || !_overviewMap) {
            return;
        }
        let size = svgSize();
        if (!size) {
            return;
        }
        let t = d3.zoomTransform(_baseSvg.node());
        // the part of the tree currently visible, in un-zoomed tree coordinates
        let visX = -t.x / t.k;
        let visY = -t.y / t.k;
        let visW = size.w / t.k;
        let visH = size.h / t.k;
        let box = _overviewMap.box;
        let fits = (visX <= box.x) && (visY <= box.y)
            && ((visX + visW) >= (box.x + box.width))
            && ((visY + visH) >= (box.y + box.height));
        if (fits) {
            _overviewGroup.style('display', 'none');
            return;
        }
        _overviewGroup.style('display', null);
        // clamp to the overview's frame so the rectangle cannot spill outside it
        let x0 = Math.max(OVERVIEW_PAD, _overviewMap.tx + (visX * _overviewMap.scale));
        let y0 = Math.max(OVERVIEW_PAD, _overviewMap.ty + (visY * _overviewMap.scale));
        let x1 = Math.min(OVERVIEW_WIDTH - OVERVIEW_PAD, _overviewMap.tx + ((visX + visW) * _overviewMap.scale));
        let y1 = Math.min(OVERVIEW_HEIGHT - OVERVIEW_PAD, _overviewMap.ty + ((visY + visH) * _overviewMap.scale));
        _overviewViewport
            .attr('x', x0).attr('y', y0)
            .attr('width', Math.max(0, x1 - x0))
            .attr('height', Math.max(0, y1 - y0));
    }

    function zoom(event) {
        _svgGroup.attr('transform', event.transform);
        updateOverviewViewport();
    }

    function centerNode(source, x, y) {
        let scale = currentZoomScale();
        if (!x) {
            x = -source.y0;
            if (_settings.enableDynamicSizing) {
                x = x * scale + (_baseSvg.attr('width')) / 2;
            } else {
                x = x * scale + _displayWidth / 2;
            }
        }
        if (!y) {
            y = 0;
        }
        _baseSvg.call(_zoomListener.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }

    function calcMaxTreeLengthForDisplay() {
        return _settings.rootOffset + _state.nodeLabelGap + LABEL_SIZE_CALC_ADDITION + (_maxLabelLength * _state.externalNodeFontSize * LABEL_SIZE_CALC_FACTOR);
    }

    // ----------------------------
    // Functions for node tooltips
    // ----------------------------

    function mouseover() {
        // Start empty so the previous node's text cannot flash while this one
        // fades in; mousemove fills it in immediately after. Clearing here
        // rather than on the way out is what keeps the tooltip from collapsing
        // to a pill as it fades (see mouseout).
        _node_mouseover_div.html('');
        _node_mouseover_div.transition()
            .duration(300)
            .style('opacity', 0.95); // only the fade -- the rest is set at creation
    }

    function mousemove(event, d) {

        let mo_text = '';
        if (d.name) {
            mo_text += 'Name: ' + d.name + '<br>';
        }
        if (d.branch_length) {
            mo_text += 'Distance to Parent: ' + d.branch_length + '<br>';
        }
        mo_text += 'Depth: ' + forester.calcDepth(d) + '<br>';
        let i = 0;
        if (d.confidences) {
            for (i = 0; i < d.confidences.length; ++i) {
                let c = d.confidences[i];
                if (c.type) {
                    mo_text += 'Confidence [' + c.type + ']: ' + c.value + '<br>';
                } else {
                    mo_text += 'Confidence: ' + c.value + '<br>';
                }
                if (c.stddev) {
                    mo_text += '- stdev: ' + c.stddev + '<br>';
                }
            }
        }
        if (d.taxonomies) {
            for (i = 0; i < d.taxonomies.length; ++i) {
                mo_text += 'Taxonomy<br>';
                let t = d.taxonomies[i];
                if (t.id) {
                    if (t.id.provider) {
                        mo_text += '- Id [' + t.id.provider + ']: ' + t.id.value + '<br>';
                    } else {
                        mo_text += '- Id: ' + t.id.value + '<br>';
                    }
                }
                if (t.code) {
                    mo_text += '- Code: ' + t.code + '<br>';
                }
                if (t.scientific_name) {
                    mo_text += '- Scientific name: ' + t.scientific_name + '<br>';
                }
                if (t.common_name) {
                    mo_text += '- Common name: ' + t.common_name + '<br>';
                }
                if (t.rank) {
                    mo_text += '- Rank: ' + t.rank + '<br>';
                }
            }
        }
        if (d.sequences) {
            for (i = 0; i < d.sequences.length; ++i) {
                mo_text += 'Sequence<br>';
                let s = d.sequences[i];
                if (s.accession) {
                    if (s.accession.source) {
                        mo_text += '- Accession [' + s.accession.source + ']: ' + s.accession.value + '<br>';
                    } else {
                        mo_text += '- Accession: ' + s.accession.value + '<br>';
                    }
                    if (s.accession.comment) {
                        mo_text += '-- comment: ' + s.accession.comment + '<br>';
                    }
                }
                if (s.symbol) {
                    mo_text += '- Symbol: ' + s.symbol + '<br>';
                }
                if (s.name) {
                    mo_text += '- Name: ' + s.name + '<br>';
                }
                if (s.gene_name) {
                    mo_text += '- Gene name: ' + s.gene_name + '<br>';
                }
                if (s.location) {
                    mo_text += '- Location: ' + s.location + '<br>';
                }
                if (s.type) {
                    mo_text += '- Type: ' + s.type + '<br>';
                }
            }
        }
        if (d.distributions) {
            let distributions = d.distributions;
            for (i = 0; i < distributions.length; ++i) {
                mo_text += 'Distribution: ';
                if (distributions[i].desc) {
                    mo_text += distributions[i].desc + '<br>';
                }
            }
        }
        if (d.date) {
            mo_text += 'Date: ';
            let date = d.date;
            if (date.desc) {
                mo_text += date.desc + '<br>';
            }
        }
        if (d.events) {
            mo_text += 'Events<br>';
            let ev = d.events;
            if (ev.type && ev.type.length > 0) {
                mo_text += '- Type: ' + ev.type + '<br>';
            }
            if (ev.duplications && ev.duplications > 0) {
                mo_text += '- Duplications: ' + ev.duplications + '<br>';
            }
            if (ev.speciations && ev.speciations > 0) {
                mo_text += '- Speciations: ' + ev.speciations + '<br>';
            }
            if (ev.losses && ev.losses > 0) {
                mo_text += '- Losses: ' + ev.losses + '<br>';
            }
        }
        if (d.properties && d.properties.length > 0) {
            let propertiesLength = d.properties.length;
            for (i = 0; i < propertiesLength; ++i) {
                let property = d.properties[i];
                if (property.ref && property.value) {
                    let prop_ref = property.ref
                    if (prop_ref.indexOf(':') > 0) {
                        prop_ref = prop_ref.substring(prop_ref.indexOf(':') + 1)
                    }
                    if (property.unit) {
                        mo_text += prop_ref + ': ' + property.value + property.unit + '<br>';
                    } else {
                        mo_text += prop_ref + ': ' + property.value + '<br>';
                    }
                }
            }
        }
        if (d.children) {
            mo_text += 'Sum of Subtree Tips: ' + forester.calcSumOfAllExternalDescendants(d) + '<br>';
        }

        // Same label/value layout as the node-data dialog, so the two read alike.
        let tip = _node_mouseover_div.node();
        tip.classList.remove('aptx-light', 'aptx-dark');
        if (_panelTheme) {
            tip.classList.add('aptx-' + _panelTheme);
        }
        _node_mouseover_div
            .html(markUpDataLabels(escapeHtmlKeepBreaks(mo_text)))
            .style('left', (event.pageX + 14) + 'px')
            .style('top', (event.pageY + 14) + 'px');
    }

    // ----------------------------
    // The node action menu
    // ----------------------------
    // An HTML overlay rather than shapes drawn into the tree: it keeps one fixed
    // size at any zoom level (the old svg menu lived inside the zoomed group and
    // grew and shrank with it), and it can use the control panel's palette,
    // hover states and shadow.

    let _nodeMenu = null;
    let _nodeMenuDismiss = null; // the listeners that close it, so they can be detached

    function removeNodeMenu() {
        if (_nodeMenuDismiss) {
            document.removeEventListener('click', _nodeMenuDismiss.onClick, true);
            document.removeEventListener('keydown', _nodeMenuDismiss.onKey);
            _nodeMenuDismiss = null;
        }
        if (_nodeMenu) {
            _nodeMenu.remove();
            _nodeMenu = null;
        }
    }

    // items: [{label, action, danger}]; anchored at the click position.
    function showNodeMenu(items, event, titleText) {
        removeNodeMenu();
        if (!items || items.length < 1) {
            return;
        }
        let menu = document.createElement('div');
        menu.className = 'aptx-node-menu';
        if (_panelTheme) {
            menu.classList.add('aptx-' + _panelTheme); // follow the panel's light/dark choice
        }
        if (titleText) {
            let title = document.createElement('div');
            title.className = 'aptx-node-menu-title';
            title.textContent = titleText;
            menu.appendChild(title);
        }
        items.forEach(function (item) {
            if (item.separator) {
                menu.appendChild(document.createElement('hr'));
                return;
            }
            let b = document.createElement('button');
            b.type = 'button';
            b.textContent = item.label;
            if (item.danger) {
                b.className = 'aptx-menu-danger';
            }
            b.addEventListener('click', function (e) {
                e.stopPropagation();
                removeNodeMenu();
                item.action();
            });
            menu.appendChild(b);
        });
        document.body.appendChild(menu);

        // Place it at the pointer, nudged back inside the window if it would
        // otherwise hang off the right or bottom edge.
        let x = (event && event.pageX !== undefined) ? event.pageX : 0;
        let y = (event && event.pageY !== undefined) ? event.pageY : 0;
        let r = menu.getBoundingClientRect();
        let maxX = window.scrollX + document.documentElement.clientWidth - r.width - 8;
        let maxY = window.scrollY + document.documentElement.clientHeight - r.height - 8;
        menu.style.left = Math.max(window.scrollX + 8, Math.min(x, maxX)) + 'px';
        menu.style.top = Math.max(window.scrollY + 8, Math.min(y, maxY)) + 'px';
        _nodeMenu = menu;

        // Dismiss on a click anywhere else, or on Escape.
        //
        // On CLICK, not mousedown: d3's zoom behaviour is bound to the same svg
        // and calls stopImmediatePropagation on mousedown, so a mousedown on the
        // tree never reaches the document and the menu could only be closed by
        // choosing an action.
        //
        // In the CAPTURE phase, and registered immediately: capture at the
        // document has already passed for the click that opened this menu, so
        // that click cannot close it again, and no deferral is needed. A click
        // inside the menu is ignored here and handled by the buttons.
        let onClick = function (e) {
            if (_nodeMenu && _nodeMenu.contains(e.target)) {
                return;
            }
            removeNodeMenu();
        };
        let onKey = function (e) {
            if (e.key === 'Escape') {
                removeNodeMenu();
            }
        };
        _nodeMenuDismiss = {onClick: onClick, onKey: onKey};
        document.addEventListener('click', onClick, true);
        document.addEventListener('keydown', onKey);
    }

    function mouseout() {
        // Fade only. Emptying the tooltip here collapsed it to nothing but its
        // padding and border -- a small rounded pill -- and THAT is what sat
        // there fading out afterwards. The content is cleared on the next
        // mouseover instead, where the tooltip is invisible anyway.
        _node_mouseover_div.transition()
            .duration(300)
            .style('opacity', 1e-6);
    }

    // ----------------------------

    // Everything the automatic visualizations are, in one structure with one
    // reset point (this replaces a sprawl of seven module-level structures,
    // whose scattered resets once let one tree's visualizations leak into
    // the next launch).
    //
    // The candidates come from forester.visualizationCandidates: the tree is
    // the only input. Each candidate carries its scales, built once per
    // launch from the COMPLETE tree -- so a value keeps its colour inside a
    // subtree view even when the subtree does not contain it.
    // The tree as displayed right now: the subtree the user switched into,
    // otherwise the (possibly edited) full tree.
    function displayedRoot() {
        return _in_subtree ? _root : _treeData;
    }

    function initializeVisualizations() {
        _vis = {candidates: [], byId: {}, colorId: null, shapeId: null, autoColorId: null,
            labelRef: null, labelPrefix: null,
            legendSortById: {}, colorModeById: {}, legendExpandedById: {},
            colorMemory: {}, colorNext: {}, shapeMemory: {}, shapeNext: {},
            hasStyles: false};
        // The readable-name inference stands on its own: it applies even when
        // the Color / Shape menus are disabled.
        _vis.labelRef = forester.nodeLabelProperty(_treeData);
        _vis.labelPrefix = forester.commonNamePrefix(_treeData, _vis.labelRef);
        // The desktop's style: namespace, honoured as the rendering
        // instructions it is. Cached on the nodes once per launch; the
        // Visual Styles checkbox gates their USE, not their existence.
        forester.preOrderTraversalAll(_treeData, function (n) {
            n._style = forester.nodeVisualStyle(n);
            if (n._style) {
                _vis.hasStyles = true;
            }
        });
        // The Short Names pre-set judged the ORIGINAL names, which is wrong
        // once a name property replaces them on display: flu tips are
        // 13-character ids but 50-character genome names. Re-judge from what
        // is actually shown. (The wrapper is skipped -- its "name" is the
        // tree's own name, which is not a node label.)
        if (_vis.labelRef) {
            let longest = 0;
            forester.preOrderTraversalAll(_treeData, function (n) {
                if (!n.parent) {
                    return;
                }
                let name = displayNodeName(n);
                if (name && name.length > longest) {
                    longest = name.length;
                }
            });
            _state.shortenNodeNames = longest > SHORTEN_NAME_MAX_LENGTH;
        }
        if (!_settings.enableVisualizations) {
            return;
        }
        computeVisualizationCandidates(_treeData);
        // Auto-apply the best candidate: the classifier returns them best
        // first, so a tree opens already coloured by its most informative
        // field instead of grey with a menu to discover. A wide field
        // (21+ values, legend capped) is offered but never imposed.
        if (_vis.candidates.length > 0 && !_vis.candidates[0].wide) {
            _vis.autoColorId = _vis.candidates[0].id;
            _vis.colorId = _vis.autoColorId;
            _state.showVisualizations = true;
        }
    }

    // Candidates, bands, counts and legends describe the DISPLAYED tree; a
    // value's colour and shape are launch-lifetime identities. The memory maps
    // remember every (field, value) -> colour/shape ever assigned, so a value
    // keeps its look across subtree views and survives deletions unshifted;
    // values first met in a smaller view extend the memory with the next free
    // palette slots. (On the launch view this assigns the sorted domain
    // 0,1,2,... -- exactly the old fixed-palette behaviour.)
    function computeVisualizationCandidates(viewRoot) {
        _vis.candidates = [];
        _vis.byId = {};
        forester.visualizationCandidates(viewRoot).forEach(function (c) {
            if (c.numeric) {
                // ramps are POSITION in the view's range, not identity: a
                // subtree spanning six years gets a full-width gradient
                let nums = c.values.map(Number);
                let mean = nums.reduce(function (a, b) {
                    return a + b;
                }, 0) / nums.length;
                c.rangeScale = d3.scaleLinear()
                    .range(VIS_COLOR_RAMP)
                    .domain([nums[0], mean, nums[nums.length - 1]]);
            }
            function memoryKey(v) {
                return c.kind === 'property' ? v.toLowerCase() : v;
            }
            // a switchable candidate needs both scales standing by
            if (c.colorMode === 'category' || c.switchable) {
                let mem = _vis.colorMemory[c.id] || (_vis.colorMemory[c.id] = {});
                let next = _vis.colorNext[c.id] || 0;
                c.values.forEach(function (v) {
                    let k = memoryKey(v);
                    if (!(k in mem)) {
                        mem[k] = extendedPaletteColor(next++);
                    }
                });
                _vis.colorNext[c.id] = next;
                c.categoryScale = d3.scaleOrdinal()
                    .domain(c.values)
                    .range(c.values.map(function (v) {
                        return mem[memoryKey(v)];
                    }));
            }
            if (c.shape) {
                let mem = _vis.shapeMemory[c.id] || (_vis.shapeMemory[c.id] = {});
                let next = _vis.shapeNext[c.id] || 0;
                c.values.forEach(function (v) {
                    let k = memoryKey(v);
                    if (!(k in mem)) {
                        mem[k] = VIS_SHAPES[next++ % VIS_SHAPES.length];
                    }
                });
                _vis.shapeNext[c.id] = next;
                c.shapeScale = d3.scaleOrdinal()
                    .domain(c.values)
                    .range(c.values.map(function (v) {
                        return mem[memoryKey(v)];
                    }));
            }
            _vis.candidates.push(c);
            _vis.byId[c.id] = c;
        });
    }

    function currentColorVis() {
        return ((_vis && _vis.colorId) ? _vis.byId[_vis.colorId] : null) || null;
    }

    function currentShapeVis() {
        return ((_vis && _vis.shapeId) ? _vis.byId[_vis.shapeId] : null) || null;
    }

    // A candidate's colour mode, honouring the legend's [colors] / [gradient]
    // switch, and the scale that mode wants.
    function colorModeOf(vis) {
        return _vis.colorModeById[vis.id] || vis.colorMode;
    }

    // Legend row order: numbers list in numeric order by default, words by
    // count -- unless this legend's sort chip has been clicked.
    function legendSortOf(vis) {
        return _vis.legendSortById[vis.id] || (vis.numeric ? 'alpha' : 'count');
    }

    // A node's style: instructions, when the Visual Styles switch is on.
    function nodeStyle(node) {
        return (_state.useVisualStyles && node._style) ? node._style : null;
    }

    function stylesActive() {
        return !!(_state.useVisualStyles && _vis && _vis.hasStyles);
    }

        function hasColorVisualizations() {
        return !!(_vis && _vis.candidates.length > 0);
    }

    function hasShapeVisualizations() {
        return !!(_vis && _vis.candidates.some(function (c) {
            return c.shape;
        }));
    }


        function resetVis() {
        forester.preOrderTraversal(_root, function (n) {
            n.hasVis = undefined;
        });
    }


    function removeColorLegend(id) {
        _baseSvg.selectAll('g.' + id).remove();
    }

    function removeShapeLegend(id) {
        _baseSvg.selectAll('g.' + id).remove();
    }

    // ---- legends ----------------------------------------------------------
    //
    // Drawn as cards over the tree, modelled on the desktop's legend box:
    // a titled, bordered panel; value rows with counts; a [by count] / [A-Z]
    // sort toggle in the title row (count-first is the desktop's default);
    // and for numeric ranges a horizontal gradient bar with the min and max
    // beneath it. Unlike the desktop there is no "+N more" cap machinery:
    // the classifier already refuses fields above 20 values, so a legend
    // can never overflow.
    //
    // The cards live in the tree's own svg, so they ride along into the PNG
    // and SVG exports, and their colours are the four theme colours the
    // export rewrite already knows how to turn light.

    let _legendMeasureCtx = null;

    function legendTextWidth(text, font) {
        if (!_legendMeasureCtx) {
            _legendMeasureCtx = document.createElement('canvas').getContext('2d');
        }
        _legendMeasureCtx.font = font;
        return _legendMeasureCtx.measureText(text).width;
    }

    // The card's row order and cap, the desktop's way: rank by count first
    // so a cap keeps the most significant values, cut, then re-sort the
    // SHOWN subset when the chip says by-value / A-Z. Returns the rows and
    // how many were cut.
    function orderedLegendValues(vis, cap) {
        let byCount = vis.values.slice().sort(function (a, b) {
            let d = (vis.counts[b] || 0) - (vis.counts[a] || 0);
            if (d !== 0) {
                return d;
            }
            let la = a.toLowerCase();
            let lb = b.toLowerCase();
            return la < lb ? -1 : (la > lb ? 1 : 0);
        });
        let shown = (cap && byCount.length > cap) ? byCount.slice(0, cap) : byCount;
        if (legendSortOf(vis) !== 'count') {
            if (vis.numeric) {
                shown.sort(function (a, b) {
                    return Number(a) - Number(b);
                });
            } else {
                shown.sort(function (a, b) {
                    let la = a.toLowerCase();
                    let lb = b.toLowerCase();
                    return la < lb ? -1 : (la > lb ? 1 : 0);
                });
            }
        }
        return {values: shown, hidden: byCount.length - shown.length};
    }

    function legendNumberLabel(v) {
        let n = Number(v);
        return Number.isInteger(n) ? String(n) : preciseRound(n, 2);
    }

    // Draws one legend card and returns its height.
    function drawLegendCard(id, x, y, vis, kind) {
        // The legend reads at the same size as the tree's labels, but never
        // below 11 -- it is a key, and a key one cannot read is furniture.
        const FS = Math.max(11, _state.externalNodeFontSize || 11);
        const PAD = 9;
        const ROW = FS + 6;
        const SWATCH = 9;
        const GAP = 6;
        const ELLIPSIS_AT = 28;
        const rowFont = FS + 'px ' + FONT_DEFAULTS;
        const titleFont = '600 ' + (FS + 1) + 'px ' + FONT_DEFAULTS;
        const ink = _state.labelColorDefault;
        const frame = _state.branchColorDefault;
        const isRange = kind === 'color' && colorModeOf(vis) === 'range';

        const LEGEND_MAX_ROWS = 20;
        let rows = [];
        let hidden = 0;
        if (!isRange) {
            let expanded = !!_vis.legendExpandedById[vis.id];
            let ordered = orderedLegendValues(vis, expanded ? null : LEGEND_MAX_ROWS);
            hidden = ordered.hidden;
            ordered.values.forEach(function (v) {
                let text = v.length > ELLIPSIS_AT ? v.substring(0, ELLIPSIS_AT - 1) + '\u2026' : v;
                rows.push({value: v, text: text, count: vis.counts[v] || 0, noValue: false});
            });
        }
        let missing = vis.total - vis.coverage;
        if (missing > 0) {
            rows.push({value: null, text: 'no value', count: missing, noValue: true});
        }

        // Title-row chips, drawn right-to-left like the desktop's. The sort
        // chip names the CURRENT order; the mode chip (only on switchable
        // numeric fields) names the current rendering; clicking either
        // switches to the other one.
        let chips = [];
        if (!isRange && vis.values.length > 1) {
            chips.push({
                text: legendSortOf(vis) === 'count' ? '[by count]' : (vis.numeric ? '[by value]' : '[A-Z]'),
                tip: 'switch between sorting by count and by ' + (vis.numeric ? 'value' : 'name'),
                act: function () {
                    _vis.legendSortById[vis.id] = legendSortOf(vis) === 'count' ? 'alpha' : 'count';
                    addLegends();
                }
            });
        }
        if (kind === 'color' && vis.switchable) {
            chips.push({
                text: isRange ? '[gradient]' : '[colors]',
                tip: 'switch between individual colors and a gradient',
                act: function () {
                    _vis.colorModeById[vis.id] = isRange ? 'category' : 'range';
                    update(null, 0);
                }
            });
        }
        if (!isRange && (hidden > 0 || (_vis.legendExpandedById[vis.id] && vis.values.length > LEGEND_MAX_ROWS))) {
            chips.push({
                text: hidden > 0 ? '[+' + hidden + ' more]' : '[fewer]',
                tip: hidden > 0 ? 'show all ' + vis.values.length + ' values' : 'show only the 20 most frequent',
                act: function () {
                    _vis.legendExpandedById[vis.id] = hidden > 0;
                    addLegends();
                }
            });
        }

        // width: title row (title + chips), then the widest content row
        const BAR_W = 150;
        let width = legendTextWidth(vis.label, titleFont);
        chips.forEach(function (chip) {
            width += GAP + 4 + legendTextWidth(chip.text, rowFont);
        });
        rows.forEach(function (r) {
            let w = SWATCH + GAP + legendTextWidth(r.text, rowFont)
                + GAP + 4 + legendTextWidth(String(r.count), rowFont);
            if (w > width) {
                width = w;
            }
        });
        if (isRange) {
            width = Math.max(width, BAR_W);
        }
        width += 2 * PAD;

        let height = PAD + ROW + (rows.length * ROW) + PAD - 2;
        if (isRange) {
            height += 10 + 4 + ROW;
        }

        let g = _baseSvg.append('g').attr('class', id);
        makeLegendDraggable(g);

        g.append('rect')
            .attr('x', x).attr('y', y)
            .attr('width', width).attr('height', height)
            .attr('rx', 5)
            .style('fill', _state.backgroundColorDefault)
            .style('fill-opacity', 0.92)
            .style('stroke', frame)
            .style('stroke-opacity', 0.5);

        let baseline = y + PAD + FS;
        g.append('text')
            .attr('x', x + PAD).attr('y', baseline)
            .style('font', titleFont)
            .style('fill', ink)
            .text(vis.label);

        let chipRight = x + width - PAD;
        chips.forEach(function (chip) {
            let t = g.append('text')
                .attr('x', chipRight).attr('y', baseline)
                .attr('text-anchor', 'end')
                .style('font', rowFont)
                .style('fill', ink)
                .style('fill-opacity', 0.75)
                .style('cursor', 'pointer')
                .text(chip.text)
                .on('mousedown', function (event) {
                    event.stopPropagation();   // a chip click is not a drag
                })
                .on('click', function (event) {
                    event.stopPropagation();
                    chip.act();
                });
            t.append('title').text(chip.tip);
            chipRight -= legendTextWidth(chip.text, rowFont) + GAP + 4;
        });

        if (isRange) {
            // the desktop's gradient legend: a bordered colour bar, min at
            // the left end, max at the right. The middle stop sits at the
            // mean's true position in the range, exactly as the scale does.
            let nums = vis.values.map(Number);
            let min = nums[0];
            let max = nums[nums.length - 1];
            let mean = nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
            let frac = max > min ? (mean - min) / (max - min) : 0.5;
            let gradId = 'aptx_legend_ramp_' + id;
            let grad = g.append('defs').append('linearGradient').attr('id', gradId);
            grad.append('stop').attr('offset', '0%').attr('stop-color', VIS_COLOR_RAMP[0]);
            grad.append('stop').attr('offset', (100 * Math.max(0.01, Math.min(0.99, frac))) + '%')
                .attr('stop-color', VIS_COLOR_RAMP[1]);
            grad.append('stop').attr('offset', '100%').attr('stop-color', VIS_COLOR_RAMP[2]);
            let barY = baseline + 6;
            let barW = width - 2 * PAD;
            g.append('rect')
                .attr('x', x + PAD).attr('y', barY)
                .attr('width', barW).attr('height', 10)
                .style('fill', 'url(#' + gradId + ')')
                .style('stroke', frame)
                .style('stroke-opacity', 0.6);
            let lblY = barY + 10 + FS + 2;
            g.append('text')
                .attr('x', x + PAD).attr('y', lblY)
                .style('font', rowFont).style('fill', ink)
                .text(legendNumberLabel(min));
            g.append('text')
                .attr('x', x + PAD + barW).attr('y', lblY)
                .attr('text-anchor', 'end')
                .style('font', rowFont).style('fill', ink)
                .text(legendNumberLabel(max));
            baseline = lblY;
        }

        rows.forEach(function (r) {
            baseline += ROW;
            let swY = baseline - SWATCH + 1;
            if (r.noValue) {
                g.append('rect')
                    .attr('x', x + PAD).attr('y', swY)
                    .attr('width', SWATCH).attr('height', SWATCH)
                    .attr('rx', 2)
                    .style('fill', 'none')
                    .style('stroke', frame)
                    .style('stroke-dasharray', '2,2');
            } else if (kind === 'shape') {
                g.append('path')
                    .attr('transform', 'translate(' + (x + PAD + SWATCH / 2) + ',' + (swY + SWATCH / 2) + ')')
                    .attr('d', d3.symbol().type(d3SymbolType(vis.shapeScale(r.value))).size(30)())
                    .style('fill', 'none')
                    .style('stroke', frame);
            } else {
                g.append('rect')
                    .attr('x', x + PAD).attr('y', swY)
                    .attr('width', SWATCH).attr('height', SWATCH)
                    .attr('rx', 2)
                    .style('fill', vis.categoryScale(r.value));
            }
            g.append('text')
                .attr('x', x + PAD + SWATCH + GAP).attr('y', baseline)
                .style('font', rowFont)
                .style('fill', ink)
                .style('fill-opacity', r.noValue ? 0.6 : 1)
                .text(r.text);
            g.append('text')
                .attr('x', x + width - PAD).attr('y', baseline)
                .attr('text-anchor', 'end')
                .style('font', rowFont)
                .style('fill', ink)
                .style('fill-opacity', 0.55)
                .text(r.count);
        });

        return height;
    }

        function preciseRound(num, decimals) {
        let t = Math.pow(10, decimals);
        return (Math.round((num * t) + (decimals > 0 ? 1 : 0) * (Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
    }

    // Legends are placed by dragging them. Every legend group is laid out from
    // the visualizationsLegendXpos / visualizationsLegendYpos pair, so a drag
    // moves that one origin and all of them follow. Only addLegends() is redrawn
    // on each move -- update() would redraw the whole tree on every mousemove.
    function makeLegendDraggable(selection) {
        selection
            .style('cursor', 'move')
            .call(d3.drag()
                .on('start', function (event) {
                    if (event.sourceEvent) {
                        // otherwise the same mousedown starts a pan of the tree
                        event.sourceEvent.stopPropagation();
                    }
                })
                .on('drag', function (event) {
                    _state.visualizationsLegendXpos =
                        Math.max(0, Math.min(_displayWidth - 20, _state.visualizationsLegendXpos + event.dx));
                    _state.visualizationsLegendYpos =
                        Math.max(0, Math.min(_displayHeight, _state.visualizationsLegendYpos + event.dy));
                    addLegends();
                }));
    }

    function addLegends() {
        removeColorLegend(LEGEND_LABEL_COLOR);
        removeShapeLegend(LEGEND_NODE_SHAPE);
        // Both legends follow the Visualizations switch: with it off nothing
        // is painted, so nothing should claim to be.
        if (!_vis || !_state.showVisualizations) {
            return;
        }
        let x = _state.visualizationsLegendXpos;
        let y = _state.visualizationsLegendYpos;
        let colorVis = currentColorVis();
        let shapeVis = currentShapeVis();
        if (colorVis) {
            y += drawLegendCard(LEGEND_LABEL_COLOR, x, y, colorVis, 'color') + 10;
        }
        if (shapeVis) {
            drawLegendCard(LEGEND_NODE_SHAPE, x, y, shapeVis, 'shape');
        }
    }


        // --------------------------------------------------------------
    // Functions for color picker
    // --------------------------------------------------------------





    // --------------------------------------------------------------

    function update(source, transitionDuration, doNotRecalculateWidth) {

        if (!source) {
            source = _root;
        }
        if (transitionDuration === undefined) {
            transitionDuration = TRANSITION_DURATION_DEFAULT;
        }

        if ((!doNotRecalculateWidth || doNotRecalculateWidth === false) || !_w) {
            _w = _displayWidth - calcMaxTreeLengthForDisplay();
            if (_w < 1) {
                _w = 1;
            }
        }

        if (_settings.enableVisualizations) {
            addLegends();
        }

        _treeFn = _treeFn.size([_displayHeight - (2 * TOP_AND_BOTTOM_BORDER_HEIGHT), _w]);

        _treeFn = _treeFn.separation(function separation(a, b) {
            return a.parent === b.parent ? 1 : 1;
        });

        let uncollsed_nodes = forester.calcSumOfExternalDescendants(_root);
        // d3 v7: d3.cluster() lays out a d3.hierarchy rather than mutating our
        // own nodes in place (as d3 v3's d3.layout.cluster().nodes() did). Run
        // the layout on a hierarchy, then copy the computed x/y/depth back onto
        // the forester nodes so the rest of the renderer is unchanged.
        let hierarchy = d3.hierarchy(_root, function (d) {
            return d.children;
        });
        _treeFn(hierarchy);
        hierarchy.each(function (hn) {
            hn.data.x = hn.x;
            hn.data.y = hn.y;
            hn.data.depth = hn.depth;
        });
        let nodes = hierarchy.descendants().map(function (hn) {
            return hn.data;
        }).reverse();
        let links = hierarchy.links().map(function (link) {
            return {source: link.source.data, target: link.target.data};
        });
        let gap = _state.nodeLabelGap;

        if (_state.phylogram === true) {
            _yScale = branchLengthScaling(forester.getAllExternalNodes(_root), _w);
        }

        if (_state.circularDisplay) {
            let maxY = 0;
            for (let i = 0; i < nodes.length; ++i) {
                if (nodes[i].y > maxY) {
                    maxY = nodes[i].y;
                }
            }
            _radial = {
                clusterH: _displayHeight - (2 * TOP_AND_BOTTOM_BORDER_HEIGHT),
                angleSpan: 2 * Math.PI * (1 - 1 / Math.max(2, uncollsed_nodes)),
                maxY: maxY,
                maxRad: Math.min(_displayWidth, _displayHeight) * 0.42
            };
        } else {
            _radial = null;
        }

        if (_state.dynahide) {
            _dynahide_counter = 0;
            _dynahide_factor = Math.round(_state.externalNodeFontSize / ((0.8 * _displayHeight) / uncollsed_nodes));
            forester.preOrderTraversal(_root, function (n) {
                n.hide = !n.children && _dynahide_factor >= 2 && (++_dynahide_counter % _dynahide_factor !== 0);
            });
        }

        updateButtonEnabledState();

        let node = _svgGroup.selectAll('g.node')
            .data(nodes, function (d) {
                return d.id || (d.id = ++_i);
            });

        let nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('transform', function () {
                return 'translate(' + source.y0 + ',' + source.x0 + ')';
            })
            .style('cursor', 'default')
            .on('click', _treeFn.clickEvent)
            // Right-click opens the same menu. The left-click target is an
            // invisible 5px circle on the node itself, which is hard to hit; this
            // handler sits on the whole node group, so the node's LABEL works as
            // the target too -- a much easier thing to aim at.
            .on('contextmenu', function (event, d) {
                event.preventDefault(); // ours instead of the browser's menu
                _treeFn.clickEvent.call(this, event, d);
            });


        nodeEnter.append('path')
            .attr('d', 'M0,0');

        nodeEnter.append('circle')
            .attr('class', 'nodeCircle')
            .attr('r', 0);

        nodeEnter.append('circle')
            .on("mouseover", mouseover)
            .on("mousemove", function (event, d) {
                mousemove(event, d);
            })
            .on("mouseout", mouseout)
            .style('cursor', 'pointer')
            .style('opacity', '0')
            .attr('class', 'nodeCircleOptions')
            .attr('r', function (d) {
                if (d.parent) {
                    return 5;
                }
                return 0;
            });

        nodeEnter.append('text')
            .attr('class', 'extlabel')
            .attr('text-anchor', function (d) {
                return d.children ? "end" : "start";
            })
            .style('font-family', _state.defaultFont)
            .style('fill-opacity', 0.5);

        nodeEnter.append('text')
            .attr('class', 'bllabel')
            .style('font-family', _state.defaultFont)
            .style('fill-opacity', 0.5);

        nodeEnter.append('text')
            .attr('class', 'conflabel')
            .attr('text-anchor', 'middle')
            .style('font-family', _state.defaultFont);

        nodeEnter.append('text')
            .attr('class', 'brancheventlabel')
            .attr('text-anchor', 'middle')
            .style('font-family', _state.defaultFont);

        // Grab the exit selection BEFORE merging. In d3 v3 the exit selection
        // survived on the merged result, but in v4+ merge() returns a NEW
        // selection with no exit, so calling .exit() after this line silently
        // matches nothing and departed nodes are never removed. That only shows
        // when the node set SHRINKS -- entering a subtree, or deleting one --
        // where the old tree stayed on screen underneath the new one.
        let nodeExitSelection = node.exit();

        // d3 v4+ no longer folds entered nodes into the update selection, so
        // merge them before the shared styling/positioning below.
        node = nodeEnter.merge(node);

        node.select("text.extlabel")
            .style('font-size', function (d) {
                let style = nodeStyle(d);
                if (style && style.fontSize) {
                    return style.fontSize + 'px';
                }
                return d.children ? _state.internalNodeFontSize + 'px' : _state.externalNodeFontSize + 'px';
            })
            .style('font-style', function (d) {
                let style = nodeStyle(d);
                return (style && (style.fontStyle === 'italic' || style.fontStyle === 'bold_italic')) ? 'italic' : null;
            })
            .style('font-weight', function (d) {
                let style = nodeStyle(d);
                return (style && (style.fontStyle === 'bold' || style.fontStyle === 'bold_italic')) ? 'bold' : null;
            })
            .style('fill', makeLabelColor)
            .style('stroke', function (d) {
                return makeFoundOutlineColor(d) || 'none';
            })
            .style('stroke-width', function (d) {
                return makeFoundOutlineColor(d) ? '0.9px' : null;
            })
            .style('paint-order', 'stroke')
            .attr('text-anchor', function (d) {
                if (_state.circularDisplay) {
                    return labelFlip(d) ? 'end' : 'start';
                }
                return d.children ? 'end' : 'start';
            })
            .attr('transform', function (d) {
                if (!_state.circularDisplay) {
                    return null;
                }
                if (_radialLabelsHorizontal) {
                    if (d.children) {
                        return null;
                    }
                    // upright labels: move straight (in screen space) from the
                    // node to its point on the outer ring, no rotation at all.
                    let p = radialXY(d.x, d.y);
                    let q = polarXY(radialAngle(d.x), _radial.maxRad);
                    return 'translate(' + (q[0] - p[0]) + ',' + (q[1] - p[1]) + ')';
                }
                // external labels are pulled out to the common outer ring;
                // internal labels sit at their node.
                let off = d.children ? 0 : (_radial.maxRad - radialRadius(d.y));
                return 'rotate(' + labelAngleDeg(d) + ') translate(' + off + ',0)' + (labelFlip(d) ? ' rotate(180)' : '');
            })
            .attr('dy', function (d) {
                if (_state.circularDisplay) {
                    return '0.32em';
                }
                return d.children ? 0.3 * _state.internalNodeFontSize + 'px' : 0.3 * _state.externalNodeFontSize + 'px';
            })
            .attr('x', function (d) {
                if (_state.circularDisplay) {
                    return labelFlip(d) ? -gap : gap;
                }
                if (!(d.children)) {
                    if (_state.phylogram && _state.alignPhylogram) {
                        return (-_yScale(d.distToRoot) + _w + gap);
                    } else {
                        return gap;
                    }
                } else {
                    return -gap;
                }
            });

        node.select('text.bllabel')
            .style('font-size', _state.branchDataFontSize + 'px')
            .style('fill', _state.branchColorDefault)
            .attr('text-anchor', function () {
                return _state.circularDisplay ? 'middle' : null;
            })
            .attr('transform', function (d) {
                return _state.circularDisplay ? branchLabelTransform(d) : null;
            })
            .attr('dy', '-.25em')
            .attr('x', function (d) {
                if (_state.circularDisplay) {
                    return 0;
                }
                if (d.parent) {
                    return (d.parent.y - d.y + 1);
                } else {
                    return 0;
                }
            });

        // confidence and branch-length values wear the BRANCH colour, not the
        // label colour: they annotate the branch they sit on, and the quieter
        // tone keeps them from competing with the node labels.
        node.select('text.conflabel')
            .style('font-size', _state.branchDataFontSize + 'px')
            .style('fill', _state.branchColorDefault)
            .attr('transform', function (d) {
                return _state.circularDisplay ? branchLabelTransform(d) : null;
            })
            .attr('dy', _state.branchDataFontSize)
            .attr('x', function (d) {
                if (_state.circularDisplay) {
                    return 0;
                }
                if (d.parent) {
                    return (0.5 * (d.parent.y - d.y));
                } else {
                    return 0;
                }
            });

        node.select('text.brancheventlabel')
            .style('font-size', _state.branchDataFontSize + 'px')
            .style('fill', _state.labelColorDefault)
            .attr('transform', function (d) {
                return _state.circularDisplay ? branchLabelTransform(d) : null;
            })
            .attr('dy', '-.25em')
            .attr('x', function (d) {
                if (_state.circularDisplay) {
                    return 0;
                }
                if (d.parent) {
                    return (0.5 * (d.parent.y - d.y));
                }
            });

        node.select('circle.nodeCircle')
            .attr('r', function (d) {
                if (((_state.showVisualizations && !_state.showNodeEvents) && (makeNodeFillColor(d) === _state.backgroundColorDefault))) {
                    return 0;
                }
                return makeNodeSize(d);
            })
            .style('stroke', function (d) {
                return makeNodeStrokeColor(d);
            })
            .style('stroke-width', _state.branchWidthDefault)
            .style('fill', function (d) {
                return (_state.showVisualizations || _state.showNodeEvents || isNodeFound(d) || isNodeSelected(d)) ? makeNodeFillColor(d) : _state.backgroundColorDefault;
            });


        let nodeUpdate = node.transition()
            .duration(transitionDuration)
            .attr('transform', function (d) {
                return nodeTransform(d);
            });

        nodeUpdate.select('text')
            .style('fill-opacity', 1);

        nodeUpdate.select('text.extlabel')
            .text(function (d) {
                if (!_state.dynahide || !d.hide) {
                    return makeNodeLabel(d);
                }
            });

        nodeUpdate.select('text.bllabel')
            .text(_state.showBranchLengthValues ? makeBranchLengthLabel : null);

        nodeUpdate.select('text.conflabel')
            .text(_state.showConfidenceValues ? makeConfidenceValuesLabel : null);

        nodeUpdate.select('text.brancheventlabel')
            .text(_state.showBranchEvents ? makeBranchEventsLabel : null);

        let drawShapes = _state.showVisualizations || stylesActive();
        nodeUpdate.select('path')
            .style('stroke', drawShapes ? makeNodeStrokeColor : null)
            .style('stroke-width', _state.branchWidthDefault)
            .style('fill', drawShapes ? makeNodeFillColor : null)
            .attr('d', drawShapes ? makeNodeVisShape : null);

        node.each(function (d) {
            if (d.children) {
                if (!drawShapes && makeNodeVisShape(d) === null) {
                    d3.select(this).select('path').transition().duration(transitionDuration)
                        .attr('d', function () {
                            return 'M0,0';
                        });
                }
            }
        });

        // Departing nodes are removed OUTRIGHT rather than on the end of a
        // transition. Going to a subtree (or deleting one) fires several updates
        // in a row -- two searches plus the zoom-to-fit -- and a transition
        // cancelled before it starts fires neither 'end' nor 'interrupt', so a
        // transition's .remove() never ran and the departed nodes stayed in the
        // DOM: invisible, but still counted by getBBox (skewing zoom-to-fit and
        // the overview) and still clickable. Links have always been removed this
        // way; nodes now match.
        nodeExitSelection.remove();

        let link = _svgGroup.selectAll('path.link')
            .attr('d', elbow)
            .attr('stroke-width', makeBranchWidth)
            .data(links, function (d) {
                return d.target.id;
            });

        let linkEnter = link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke-width', makeBranchWidth)
            .attr('stroke', makeBranchColor)
            .attr('d', function () {
                let o = {
                    x: source.x0, y: source.y0
                };
                return elbow({
                    source: o, target: o
                });
            });

        let linkExitSelection = link.exit(); // before the merge -- see nodeExitSelection

        link = linkEnter.merge(link);

        link.transition()
            .duration(transitionDuration)
            .attr('stroke', makeBranchColor)
            .attr('d', elbow);

        linkExitSelection
            .attr('d', function () {
                let o = {
                    x: source.x, y: source.y
                };
                return elbow({
                    source: o, target: o
                });
            })
            .remove();


        // Aligned phylogram: a faint extension from each tip out to the column
        // the labels line up in.
        //
        // Cleared first and rebuilt into ONE group. It used to append a fresh
        // <g> on every update and never remove any of them, so the extensions
        // piled up and outlived the setting that drew them.
        //
        // Not in circular mode: there the radial connectors below do this job,
        // while these are built from rectangular geometry and would be drawn as
        // straight lines right across the circular tree.
        //
        // The class is deliberately NOT "link": these paths live under
        // _svgGroup, so that name put them in the way of selectAll('path.link')
        // -- the main link data-join, and the overview's miniature.
        _svgGroup.selectAll('g.aptx-align-ext').remove();
        if (!_state.circularDisplay && _state.phylogram && _state.alignPhylogram && _state.showExternalLabels
            && (_state.showNodeName || _state.showTaxonomy || _state.showSequence)) {
            let ext = _svgGroup.insert('g', 'g').attr('class', 'aptx-align-ext');
            ext.selectAll('path')
                .data(links.filter(function (d) {
                    return (!d.target.children && !(_state.dynahide && d.target.hide));
                }))
                .enter().append('path')
                .attr('fill', 'none')
                .attr('stroke-width', 1)
                .attr('stroke', _state.branchColorDefault)
                .style('stroke-opacity', 0.25)
                .attr('d', function (d) {
                    return connection(d.target);
                });
        }

        // circular: a thin dashed connector from each external node out to the
        // common label ring (so labels line up like iTOL's aligned display).
        _svgGroup.selectAll('g.aptx-radial-conn').remove();
        if (_state.circularDisplay && _state.showExternalLabels) {
            let conn = _svgGroup.insert('g', 'g').attr('class', 'aptx-radial-conn');
            conn.selectAll('line')
                .data(nodes.filter(function (d) {
                    return !d.children && !(_state.dynahide && d.hide);
                }))
                .enter().append('line')
                .attr('stroke', _state.branchColorDefault)
                .attr('stroke-width', 0.5)
                .style('stroke-opacity', 0.3)
                .style('stroke-dasharray', '1.5,2.5')
                .attr('x1', function (d) { return radialXY(d.x, d.y)[0]; })
                .attr('y1', function (d) { return radialXY(d.x, d.y)[1]; })
                .attr('x2', function (d) { return polarXY(radialAngle(d.x), _radial.maxRad)[0]; })
                .attr('y2', function (d) { return polarXY(radialAngle(d.x), _radial.maxRad)[1]; });
        }

        for (let i = 0, len = nodes.length; i !== len; ++i) {
            let d = nodes[i];
            d.x0 = d.x;
            d.y0 = d.y;
        }

        rebuildOverview();
    }

    // A node is drawn as a shape only when there is a reason to show one: it
    // carries a duplication/speciation event, it is a search hit or selected, or
    // a node visualization is colouring it. (A node whose shape comes from a
    // shape visualization is drawn by that path instead -- hence the hasVis
    // guard.) There is deliberately no "show all nodes" switch: circles on every
    // node carry no information and only add clutter.
    // d3.symbol() takes an AREA, while nodeSizeDefault is a radius; this is the
    // conversion the size visualization used to apply on its way out.
    function nodeSymbolArea() {
        return 2 * _state.nodeSizeDefault * _state.nodeSizeDefault;
    }

    let makeNodeSize = function (node) {

        if ((_state.showNodeEvents && node.events && node.children && (node.events.duplications || node.events.speciations)) || isNodeFound(node) || isNodeSelected(node)) {
            return _state.nodeSizeDefault;
        }

        // A colour visualization must actually be SELECTED, not just the Node Vis
        // switch turned on: otherwise every node would sprout a circle whenever
        // that switch is on with no visualization chosen.
        let visualized = _state.nodeSizeDefault > 0 && node.parent
            && _state.showVisualizations && !node.hasVis
            && currentColorVis() !== null;

        // a style:node_color also earns the node its dot (font_color alone
        // does not -- that paints the label, exactly as on the desktop)
        let styleOf = nodeStyle(node);
        let styled = _state.nodeSizeDefault > 0 && node.parent && !node.hasVis
            && styleOf !== null && !!styleOf.nodeColor;

        // a zero-length branch off the root would otherwise be invisible
        let zeroLengthRootChild = _state.phylogram && node.parent && !node.parent.parent
            && (!node.branch_length || node.branch_length <= 0);

        return (visualized || styled || zeroLengthRootChild) ? _state.nodeSizeDefault : 0;
    };

    let makeBranchWidth = function (link) {
        if (link.target.width) {
            return link.target.width;
        }
        return _state.branchWidthDefault;
    };

    let makeBranchColor = function (link) {

        if (_state.useVisualStyles && link.target.color) {
            let c = link.target.color;
            return 'rgb(' + c.red + ',' + c.green + ',' + c.blue + ')';
        }
        return _state.branchColorDefault;
    };

    function makeNodeEventsDependentColor(ev) {
        if (ev.duplications > 0 && (!ev.speciations || ev.speciations <= 0)) {
            return DUPLICATION_COLOR;
        } else if (ev.speciations > 0 && (!ev.duplications || ev.duplications <= 0)) {
            return SPECIATION_COLOR;
        } else if (ev.speciations > 0 && ev.duplications > 0) {
            return DUPLICATION_AND_SPECIATION_COLOR_COLOR;
        }
        return null;
    }

    let makeNodeFillColor = function (phynode) {
        let foundColor = getFoundColor(phynode);
        if (foundColor) {
            return foundColor;
        }
        if (_state.showNodeEvents && phynode.events && phynode.children && (phynode.events.speciations || phynode.events.duplications)) {
            let evColor = makeNodeEventsDependentColor(phynode.events);
            if (evColor !== null) {
                return evColor;
            } else {
                return _state.backgroundColorDefault;
            }
        }
        let visColor = makeVisNodeFillColor(phynode);
        if (visColor !== _state.backgroundColorDefault) {
            return visColor;
        }
        let style = nodeStyle(phynode);
        if (style && (style.nodeColor || style.fontColor)) {
            return style.nodeColor || style.fontColor;
        }
        return visColor;
    };

    // A darker shade of a node's found/selected highlight color, used as a thin
    // rim on found node dots and labels so the fill (especially the pale yellow
    // both-A-and-B color) stands out on any background. Returns null when the
    // node is neither a search hit nor selected.
    function makeFoundOutlineColor(phynode) {
        let foundColor = getFoundColor(phynode);
        if (!foundColor) {
            return null;
        }
        let c = d3.color(foundColor);
        return c ? c.darker(1.6).formatHex() : foundColor;
    }

    let makeNodeStrokeColor = function (phynode) {
        let outline = makeFoundOutlineColor(phynode);
        if (outline) {
            return outline;
        }
        if (_state.showNodeEvents && phynode.events && phynode.children) {
            let evColor = makeNodeEventsDependentColor(phynode.events);
            if (evColor !== null) {
                return evColor;
            }
        }
        if (_state.showVisualizations) {
            let v = makeVisNodeFillColor(phynode);
            if (v !== _state.backgroundColorDefault) {
                return v;
            }
        }
        let style = nodeStyle(phynode);
        if (style && (style.nodeColor || style.fontColor)) {
            return style.nodeColor || style.fontColor;
        }
        if (_state.useVisualStyles && phynode.color) {
            let c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _state.branchColorDefault;
    };

    let makeLabelColor = function (phynode) {
        let foundColor = getFoundColor(phynode);
        if (foundColor) {
            return foundColor;
        }
        if (_state.showVisualizations && currentColorVis()) {
            let color = makeVisLabelColor(phynode);
            if (color) {
                return color;
            }
        }
        // an active Color visualization outranks style:font_color, as on the
        // desktop; clear the Color menu to see the tree as its file styled it
        let style = nodeStyle(phynode);
        if (style && style.fontColor) {
            return style.fontColor;
        }
        if (_state.useVisualStyles && phynode.color) {
            let c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _state.labelColorDefault;
    };

    let makeNodeVisShape = function (node) {
        if (isNodeFound(node) || isNodeSelected(node)
            || (_state.showNodeEvents && node.events && (node.events.duplications || node.events.speciations))) {
            return null;
        }
        let vis = _state.showVisualizations ? currentShapeVis() : null;
        if (vis) {
            let value = forester.visualizationNodeValue(node, vis);
            if (value !== null) {
                node.hasVis = true;
                return d3.symbol().type(d3SymbolType(vis.shapeScale(value))).size(nodeSymbolArea())();
            }
        }
        let style = nodeStyle(node);
        if (style && style.shape) {
            node.hasVis = true;
            return d3.symbol().type(d3SymbolType(style.shape)).size(nodeSymbolArea())();
        }
        return null;
    };

        // ONE colour visualization drives both the label and the node fill -- these
    // were two identical code paths over two identical maps. Returns null when
    // nothing applies, so each caller supplies its own fallback.
    function visualizationColorFor(node) {
        let vis = currentColorVis();
        if (!vis) {
            return null;
        }
        let value = forester.visualizationNodeValue(node, vis);
        if (value === null) {
            return null;
        }
        return colorModeOf(vis) === 'range' ? vis.rangeScale(Number(value)) : vis.categoryScale(value);
    }

    let makeVisNodeFillColor = function (node) {
        if (!_state.showVisualizations) {
            return _state.backgroundColorDefault;
        }
        return visualizationColorFor(node) || _state.backgroundColorDefault;
    };

    let makeVisLabelColor = function (node) {
        return visualizationColorFor(node) || _state.labelColorDefault;
    };

    function getFoundColor(phynode) {
        if (_selectedNodes.has(phynode)) {
            return _state.selectedColorDefault;
        }
        // _foundNodes0/1 already reflect the Inverse toggle (complement is applied
        // inside searchWithSpec), so colouring is a plain membership test.
        if (_foundNodes0 && _foundNodes1 && _foundNodes0.has(phynode) && _foundNodes1.has(phynode)) {
            return _state.found0and1ColorDefault;
        } else if (_foundNodes0 && _foundNodes0.has(phynode)) {
            return _state.found0ColorDefault;
        } else if (_foundNodes1 && _foundNodes1.has(phynode)) {
            return _state.found1ColorDefault;
        }
        return null;
    }

    function isNodeFound(phynode) {
        return (_foundNodes0 && _foundNodes0.has(phynode)) || (_foundNodes1 && _foundNodes1.has(phynode));
    }

    function isNodeSelected(phynode) {
        return _selectedNodes.has(phynode);
    }

    // The name displayed for a node. Usually the node's own name -- but when
    // a tree names its tips with database identifiers (PATRIC.10334...,
    // 11320.305060) while carrying the readable name in a property,
    // forester.nodeLabelProperty spots that at launch and the property is
    // shown instead. Exports and the node-data dialog keep the real name.
    function displayNodeName(phynode) {
        if (_vis && _vis.labelRef && !phynode.children && phynode.properties) {
            for (let i = 0; i < phynode.properties.length; ++i) {
                let p = phynode.properties[i];
                if (p.ref === _vis.labelRef && p.applies_to === 'node' && p.value) {
                    return String(p.value);
                }
            }
        }
        return phynode.name;
    }

    let makeNodeLabel = function (phynode) {
        if (!_state.showExternalLabels && !(phynode.children)) {
            return null;
        }
        if (!_state.showInternalLabels && (phynode.children)) {
            return null;
        }
        if (!phynode.parent) {
            // Do not show root data
            return null;
        }

        let l = "";
        let displayName = displayNodeName(phynode);
        if (_state.showNodeName && displayName) {
            if (_state.shortenNodeNames) {
                let name = displayName;
                // Shortening drops the prefix every tip shares FIRST -- keeping
                // the first characters of "Influenza A virus (A/mallard/...)"
                // keeps exactly the characters that carry no information. The
                // prefix comparison is case-insensitive, like its computation.
                if (_vis && _vis.labelPrefix && !phynode.children
                    && name.length > _vis.labelPrefix.length
                    && name.substring(0, _vis.labelPrefix.length).toLowerCase() === _vis.labelPrefix.toLowerCase()) {
                    name = name.substring(_vis.labelPrefix.length);
                    while (name.length > 0 && ' /|_.-:'.indexOf(name.charAt(0)) >= 0) {
                        name = name.substring(1);
                    }
                }
                l = append(l, name.length > SHORTEN_NAME_MAX_LENGTH ? shortenName(name, 8) : name);
            } else {
                l = append(l, displayName);
            }
        }

        if (_state.showTaxonomy && phynode.taxonomies && phynode.taxonomies.length > 0) {
            let t = phynode.taxonomies[0];
            if (_state.showTaxonomyCode) {
                l = append(l, t.code);
            }
            if (_state.showTaxonomyScientificName) {
                l = append(l, t.scientific_name);
            }
            if (_state.showTaxonomyCommonName) {
                l = appendP(l, t.common_name);
            }
            if (_state.showTaxonomyRank) {
                l = appendP(l, t.rank);
            }
            if (_state.showTaxonomySynonyms) {
                if (t.synonyms && t.synonyms.length > 0) {
                    let syn = t.synonyms;
                    for (let i = 0; i < syn.length; ++i) {
                        l = appendB(l, syn[i]);
                    }
                }
            }
        }
        if (_state.showSequence && phynode.sequences && phynode.sequences.length > 0) {
            let s = phynode.sequences[0];
            if (_state.showSequenceSymbol) {
                l = append(l, s.symbol);
            }
            if (_state.showSequenceName) {
                l = append(l, s.name);
            }
            if (_state.showSequenceGeneSymbol) {
                l = appendP(l, s.gene_name);
            }
            if (_state.showSequenceAccession && s.accession && s.accession.value) {
                l = appendP(l, s.accession.value);
            }
        }


        if (_nodeLabels && phynode.properties) {
            const props_length = phynode.properties.length;
            if (props_length > 0) {
                for (const value of Object.values(_nodeLabels)) {
                    if (value.selected === true && value.propertyRef) {
                        let prop_text = '';
                        for (let pm = 0; pm < props_length; ++pm) {
                            if (phynode.properties[pm].ref === value.propertyRef && phynode.properties[pm].datatype === 'xsd:string' && phynode.properties[pm].applies_to === 'node') {
                                if (prop_text.length > 0) {
                                    prop_text += ', '
                                }
                                prop_text += phynode.properties[pm].value;
                            }
                        }
                        l = append(l, prop_text);
                    }
                }
            }
        }


        if (_state.showDistributions && phynode.distributions && phynode.distributions.length > 0) {
            let d = phynode.distributions;
            for (let ii = 0; ii < d.length; ++ii) {
                l = appendB(l, d[ii].desc);
            }
        }
        return l;

        function append(str1, str2) {
            if (str2 && str2.length > 0) {
                if (str1.length > 0) {
                    str1 += (" | " + str2);
                } else {
                    str1 = str2;
                }
            }
            return str1;
        }

        function appendP(str1, str2) {
            if (str2 && str2.length > 0) {
                if (str1.length > 0) {
                    str1 += (" (" + str2 + ")");
                } else {
                    str1 = "(" + str2 + ")";
                }
            }
            return str1;
        }

        function appendB(str1, str2) {
            if (str2 && str2.length > 0) {
                if (str1.length > 0) {
                    str1 += (" [" + str2 + "]");
                } else {
                    str1 = "[" + str2 + "]";
                }
            }
            return str1;
        }

        function shortenName(name, n) {
            let nlength = name.length;
            return name.substring(0, n) + '..' + name.substring(nlength - n, nlength);
        }
    };


    let makeBranchLengthLabel = function (phynode) {
        if (phynode.branch_length) {
            if (_state.phylogram && _state.minBranchLengthValueToShow && phynode.branch_length < _state.minBranchLengthValueToShow) {
                return;
            }
            return +phynode.branch_length.toFixed(BRANCH_LENGTH_DIGITS_DEFAULT);
        }
    };

    let makeConfidenceValuesLabel = function (phynode) {
        if (phynode.confidences && phynode.confidences.length > 0) {
            let c = phynode.confidences;
            let cl = c.length;
            if (_state.minConfidenceValueToShow) {
                let show = false;
                for (let i = 0; i < cl; ++i) {
                    if (c[i].value >= _state.minConfidenceValueToShow) {
                        show = true;
                        break;
                    }
                }
                if (!show) {
                    return;
                }
            }
            if (cl === 1) {
                if (c[0].value) {
                    return +c[0].value.toFixed(CONFIDENCE_VALUE_DIGITS_DEFAULT);
                }
            } else {
                let s = "";
                for (let ii = 0; ii < cl; ++ii) {
                    if (c[ii].value) {
                        if (ii > 0) {
                            s += "/";
                        }
                        s += +c[ii].value.toFixed(CONFIDENCE_VALUE_DIGITS_DEFAULT);
                    }
                }
                return s;
            }
        }
    };

    let makeBranchEventsLabel = function (phynode) {
        if (phynode.properties && phynode.properties.length > 0) {
            let l = phynode.properties.length;
            let str = null;
            for (let p = 0; p < l; ++p) {
                if (phynode.properties[p].ref === BRANCH_EVENT_REF && phynode.properties[p].datatype === BRANCH_EVENT_DATATYPE && phynode.properties[p].applies_to === BRANCH_EVENT_APPLIES_TO) {
                    if (str === null) {
                        str = phynode.properties[p].value;
                    } else {
                        str += (', ' + phynode.properties[p].value);
                    }
                }
            }
            if (str !== null) {
                return str;
            }
        }
    };

    // ---- radial (circular) layout helpers ----
    // When _state.circularDisplay is on, the cluster's cross-axis position (node.x) is
    // reinterpreted as an angle and its depth position (node.y) as a radius, so the
    // same layout renders as a circular tree. _radial is set per render in update().
    function radialAngle(x) {
        // the rotation offset is left UN-normalized: arcs are drawn from
        // angle differences, which wrapping individual angles would break
        return _radial ? ((x / _radial.clusterH) * _radial.angleSpan + _radialRotation) : 0;
    }
    function radialRadius(y) {
        return (_radial && _radial.maxY > 0) ? (y / _radial.maxY) * _radial.maxRad : 0;
    }
    function polarXY(angle, r) {
        let a = angle - Math.PI / 2;
        return [r * Math.cos(a), r * Math.sin(a)];
    }
    function radialXY(x, y) {
        return polarXY(radialAngle(x), radialRadius(y));
    }
    function nodeTransform(d) {
        if (_state.circularDisplay) {
            let p = radialXY(d.x, d.y);
            return 'translate(' + p[0] + ',' + p[1] + ')';
        }
        return 'translate(' + d.y + ',' + d.x + ')';
    }

    // Degrees to rotate a label so it reads along the radius at node d's angle.
    function labelAngleDeg(d) {
        return radialAngle(d.x) * 180 / Math.PI - 90;
    }
    // Nodes on the left half of the circle need their text flipped 180° so it
    // isn't upside-down.
    function labelFlip(d) {
        let a = radialAngle(d.x) % (2 * Math.PI);
        if (a < 0) {
            a += 2 * Math.PI;
        }
        return a >= Math.PI;
    }
    // Transform for a branch-data label (confidence / branch length / events):
    // rotate to the node's angle and sit at the midpoint of the branch (radially).
    function branchLabelTransform(d) {
        if (!d.parent) {
            return 'rotate(' + labelAngleDeg(d) + ')';
        }
        let mid = (radialRadius(d.parent.y) - radialRadius(d.y)) / 2;
        return 'rotate(' + labelAngleDeg(d) + ') translate(' + mid + ',0)' + (labelFlip(d) ? ' rotate(180)' : '');
    }

    let elbow = function (d) {
        if (_state.circularDisplay) {
            let sa = radialAngle(d.source.x), ta = radialAngle(d.target.x);
            let sr = radialRadius(d.source.y), tr = radialRadius(d.target.y);
            let sp = polarXY(sa, sr), mp = polarXY(ta, sr), tp = polarXY(ta, tr);
            let large = Math.abs(ta - sa) > Math.PI ? 1 : 0, sweep = ta > sa ? 1 : 0;
            return 'M' + sp[0] + ',' + sp[1] + 'A' + sr + ',' + sr + ' 0 ' + large + ' ' + sweep + ' ' + mp[0] + ',' + mp[1] + 'L' + tp[0] + ',' + tp[1];
        }
        return 'M' + d.source.y + ',' + d.source.x + 'V' + d.target.x + 'H' + d.target.y;
    };

    let connection = function (n) {
        if (_state.phylogram) {
            let x1 = n.y + 5;
            let y = n.x;
            let x = (n.y - _yScale(n.distToRoot) + _w);
            if ((x - x1) > 5) {
                return 'M' + x1 + ',' + y + 'L' + x + ',' + y;
            }
        }
    };


    // Config keys this version no longer has, with what to do instead. Passing
    // one is an ERROR rather than a silent no-op: a caller who sets it is
    // expecting behaviour that will not happen, and quietly ignoring it hides
    // that until somebody notices the display is wrong.
    //
    // One list, because there is one config object. Checking each of the two old
    // bags only against its own list meant the right name in the wrong bag was
    // silently ignored -- the very failure this list exists to prevent.
    const REMOVED_CONFIG = {
        circular: 'renamed to "circularDisplay"',
        showExternalNodes: 'node shapes now appear wherever a node visualization applies',
        showInternalNodes: 'node shapes now appear wherever a node visualization applies',
        searchIsPartial: 'each search box picks its own match mode (contains / starts with / ends with / whole word / regex)',
        searchUsesRegex: 'choose the "regex" match mode in the search box instead',
        searchProperties: 'choose the property in the search box\'s field menu instead',
        externalNodeFontSize: 'all labels share one size now -- use "fontSize"',
        internalNodeFontSize: 'all labels share one size now -- use "fontSize"',
        branchDataFontSize: 'all labels share one size now -- use "fontSize"',
        // download filenames follow the tree's name
        nameForNhDownload: 'download names follow "treeName"',
        nameForPhyloXmlDownload: 'download names follow "treeName"',
        nameForPngDownload: 'download names follow "treeName"',
        nameForSvgDownload: 'download names follow "treeName"',
        nameForFastaDownload: 'download names follow "treeName"',
        // which taxonomy / sequence field to label with is read off the tree
        showTaxonomyCode: 'taxonomy labelling follows what the tree contains',
        showTaxonomyScientificName: 'taxonomy labelling follows what the tree contains',
        showTaxonomyCommonName: 'taxonomy labelling follows what the tree contains',
        showTaxonomyRank: 'taxonomy labelling follows what the tree contains',
        showTaxonomySynonyms: 'taxonomy labelling follows what the tree contains',
        showSequenceName: 'sequence labelling follows what the tree contains',
        showSequenceGeneSymbol: 'sequence labelling follows what the tree contains',
        showSequenceSymbol: 'sequence labelling follows what the tree contains',
        showSequenceAccession: 'sequence labelling follows what the tree contains',
        // fixed colour-vision-safe highlighting colours
        found0ColorDefault: 'the search / selection colours are fixed so they stay distinguishable',
        found1ColorDefault: 'the search / selection colours are fixed so they stay distinguishable',
        found0and1ColorDefault: 'the search / selection colours are fixed so they stay distinguishable',
        selectedColorDefault: 'the search / selection colours are fixed so they stay distinguishable',
        // the collapse-by-depth / rank / feature feature is gone
        collapsedLabelLength: 'the collapse feature was removed',
        initialCollapseDepth: 'the collapse feature was removed',
        initialCollapseFeature: 'the collapse feature was removed',
        // never were inputs: runtime state that happens to live in the same bag
        searchNegateResult: 'this is the state of the Inverse checkbox, not an input',
        visualizationsLegendXposOrig: 'internal bookkeeping; set visualizationsLegendXpos',
        visualizationsLegendYposOrig: 'internal bookkeeping; set visualizationsLegendYpos',
        // Decided from the tree, or simply fixed, as of the 2026 modernization.
        phylogram: 'the tree is drawn to scale when most of its branches have a length',
        alignPhylogram: 'aligning the tips is a control, not a launch option',
        treeName: 'the name comes from the tree file',
        fontSize: 'one default size for every label; the font-size slider changes it',
        defaultFont: 'labels use the sans-serif the reader\'s own system renders best',
        labelColorDefault: 'the default label colour is fixed',
        branchColorDefault: 'the default branch colour is fixed',
        branchWidthDefault: 'branch width follows the size of the tree',
        backgroundColorDefault: 'the background is fixed',
        backgroundColorForPrintExportDefault: 'the export background is fixed',
        nodeSizeDefault: 'node size is fixed; the Node size slider changes it',
        nodeLabelGap: 'the label gap is fixed',
        showNodeName: 'shown when the tree has node names',
        showTaxonomy: 'shown when the tree has taxonomies',
        showSequence: 'shown when the tree has sequences',
        showConfidenceValues: 'shown when the tree has confidences',
        showNodeEvents: 'shown when the tree has node events',
        showBranchEvents: 'shown when the tree has branch events',
        showBranchLengthValues: 'off by default; use the Branch Length checkbox',
        showInternalLabels: 'off by default; use the Int. Labels checkbox',
        showExternalLabels: 'on by default; use the Ext. Labels checkbox',
        showDistributions: 'off by default',
        showBranchColors: 'merged into the Visual Styles checkbox, like the desktop\'s "Visual Styles/Branch Colors"',
        shortenNodeNames: 'on by default when the tree has long node names; use the Short Names checkbox',
        dynahide: 'on by default; use the Auto-hide Labels checkbox',
        minConfidenceValueToShow: 'no longer configurable',
        minBranchLengthValueToShow: 'no longer configurable',
        showVisualizations: 'off by default; use the Visualizations checkbox',
        showNodeVisualizations: 'node and branch visualizations are one switch now; use the Visualizations checkbox',
        showBranchVisualizations: 'node and branch visualizations are one switch now; use the Visualizations checkbox',
        nodeVisualizationsOpacity: 'no longer configurable',
        initialNodeFillColorVisualization: 'choose the visualization in the Visualizations panel',
        initialLabelColorVisualization: 'choose the visualization in the Visualizations panel',
        visualizationsLegendOrientation: 'the legend orientation is fixed; the legend has its own control',
        decimalsForLinearRangeMeanValue: 'no longer configurable',
        searchIsCaseSensitive: 'off by default; use the Match case checkbox',

        // ---- keys that used to be passed in the separate settings bag ----
        showExternalNodesButton: 'the Ext. Nodes switch no longer exists',
        showInternalNodesButton: 'the Int. Nodes switch no longer exists',
        showSearchPropertiesButton: 'properties are searched by choosing them in a search box\'s field menu',
        searchFieldWidth: 'the search boxes size themselves to the control panel',
        // each control now appears when the tree actually has the data for it
        showNodeNameButton: 'shown automatically when the tree has node names',
        showTaxonomyButton: 'shown automatically when the tree has taxonomies',
        showSequenceButton: 'shown automatically when the tree has sequences',
        showBranchColorsButton: 'the Visual Styles checkbox appears when the tree has branch colours or style properties',
        showDynahideButton: 'shown automatically once the tree has enough tips to need it',
        showShortenNodeNamesButton: 'shown automatically when the tree has long node names',
        showExternalLabelsButton: 'always shown',
        showInternalLabelsButton: 'shown automatically when the tree has internal node data',
        // the collapse-by-depth / rank / feature feature is gone
        collapseLabelWidth: 'the collapse feature was removed',
        enableCollapseByBranchLenghts: 'the collapse feature was removed',
        enableCollapseByFeature: 'the collapse feature was removed',
        enableCollapseByTaxonomyRank: 'the collapse feature was removed',
        // set but never read -- controls1Width lost its job to PANEL_WIDTH when
        // the panels were rebuilt; groupSpecies and groupYears never had one
        controls1Width: 'the control panel sizes itself',
        // there is only one panel now
        controls1: 'the visualization menus moved into the main control panel',
        controls1Left: 'the visualization menus moved into the main control panel',
        controls1Top: 'the visualization menus moved into the main control panel',
        groupSpecies: 'this setting was never read; it did nothing',
        groupYears: 'this setting was never read; it did nothing',
        // the special visualizations went with the "specialVisualizations" argument
        enableSpecialVisualizations2: 'the special visualizations were removed',
        enableSpecialVisualizations3: 'the special visualizations were removed',
        enableSpecialVisualizations4: 'the special visualizations were removed',
        // these three had stopped styling the controls; they styled the legend
        controlsFont: 'the legend uses the same sans-serif as the rest of the interface',
        controlsFontSize: 'the legend has one size',
        controlsFontColor: 'this never had any effect; the legend follows the tree\'s label colour',
        textFieldHeight: 'the text fields size themselves to their content',
        enableMsaResidueVisualizations: 'colouring by aligned residue was removed',
        border: 'style the tree\'s svg with CSS instead',
        allowManualNodeSelection: 'renamed to "enableManualNodeSelection"',
        enableNodeVisualizations: 'merged into "enableVisualizations"',
        enableBranchVisualizations: 'merged into "enableVisualizations"',
        controls0: 'the control panel is created inside the tree\'s own container now',
        controls0Left: 'the control panel is placed against the tree; drag it to move it',
        controls0Top: 'the control panel is placed against the tree; drag it to move it',
        nhExportReplaceIllegalChars: 'always on; Newick cannot carry those characters',
        propertiesToIgnoreForNodeVisualization: 'every property the tree carries is offered; choose what to show in the panel',
        valuesToIgnoreForNodeVisualization: 'every value is shown; choose what to show in the panel',
        orderTree: 'renamed to "ladderizeTree", to match the wording used everywhere else',
        controlsBackgroundColor: 'the control panel follows the light / dark palette',
        filterValues: 'reshape the tree\'s properties yourself before calling launch',
        dynamicallyAddNodeVisualizations: 'visualizations are always derived automatically from the tree now',
        useVisualStyles: 'on by default; use the Visual Styles checkbox'
    };

    // ---- the public config surface ----------------------------------------
    //
    // launch() takes ONE config object. Internally its keys still land in two
    // places -- STATE_KEYS seed _state, the live display state the control panel
    // then writes to; SETTING_KEYS go to _settings, which nothing writes after
    // initialization. That is a real distinction, but it is ours: a caller had
    // no way to derive which half a name belonged to short of consulting a
    // table, and putting it in the wrong one used to fail silently. These lists
    // do the routing, and they double as the allow-list, so a misspelled key
    // throws instead of doing nothing.
    const STATE_KEYS = [
        'circularDisplay',
        'searchAinitialValue',
        'searchBinitialValue',
        'visualizationsLegendXpos',
        'visualizationsLegendYpos'
    ];

    const SETTING_KEYS = [
        'displayHeight',
        'displayWidth',
        'enableAccessToDatabases',
        'enableDownloads',
        'enableDynamicSizing',
        'enableManualNodeSelection',
        'enableSubtreeDeletion',
        'enableVisualizations',
        'ladderizeTree',
        'nhExportWriteConfidences',
        'pngExportScale',
        'rootOffset',
        'zoomToFitUponWindowResize'
    ];

    // Merges the caller's config (and the deprecated second bag, if given) and
    // splits it into the two internal stores. Both a removed key and an unknown
    // one throw: a config entry that quietly does nothing is the bug that costs
    // an afternoon to find. The returned objects are ours, not the caller's --
    // the display state is written to constantly, and writing through to an
    // object the caller still holds is not our business.
    function readConfig(config, legacySettings) {
        if (legacySettings) {
            console.warn(WARNING + ': launch() now takes ONE config object; passing a'
                + ' separate settings object is deprecated -- merge it into the third argument');
        }

        let given = {};
        [config, legacySettings].forEach(function (bag) {
            if (bag) {
                Object.keys(bag).forEach(function (k) {
                    given[k] = bag[k];
                });
            }
        });

        let removed = Object.keys(given).filter(function (k) {
            return REMOVED_CONFIG[k] !== undefined;
        });
        if (removed.length > 0) {
            throw new Error(ERROR + 'removed config key(s) passed to launch: '
                + removed.map(function (k) {
                    return '"' + k + '" -- ' + REMOVED_CONFIG[k];
                }).join('; '));
        }

        let unknown = Object.keys(given).filter(function (k) {
            return STATE_KEYS.indexOf(k) < 0 && SETTING_KEYS.indexOf(k) < 0;
        });
        if (unknown.length > 0) {
            throw new Error(ERROR + 'unknown config key(s) passed to launch: "'
                + unknown.join('", "') + '"');
        }

        let split = {state: {}, settings: {}};
        STATE_KEYS.forEach(function (k) {
            if (given[k] !== undefined) {
                split.state[k] = given[k];
            }
        });
        SETTING_KEYS.forEach(function (k) {
            if (given[k] !== undefined) {
                split.settings[k] = given[k];
            }
        });
        return split;
    }

    // Where content has to start to clear the control panel. Both the root and
    // the visualizations legend need this, and neither may hard-code it: the
    // panel's own geometry is the only honest source, or the two drift apart --
    // which is exactly how the root ended up drawn behind the panel once.
    function leftPanelClearance() {
        return CONTROLS_0_LEFT_DEFAULT + PANEL_WIDTH + ROOT_CLEARANCE;
    }

    function initializeState(state) {
        _state = state;

        // Intelligent pre-sets: any display option the caller does NOT set
        // explicitly is derived from what the loaded tree actually contains
        // (an explicit caller option always wins). Field presence comes from
        // the same per-tree discovery that drives the search Field menu.
        let presentFields = new Set();
        if (_treeData) {
            forester.availableSearchFields(_treeData).forEach(function (f) {
                presentFields.add(f.key);
            });
        }

        // Branch lengths are worth drawing to scale only when MOST branches
        // carry one. A tree where a handful of branches have a length and the
        // rest do not is not a phylogram with gaps -- it is a cladogram.
        let branchCount = _basicTreeProperties.nodeCount - 1;
        _state.phylogram = branchCount > 0
            && (_basicTreeProperties.branchesWithPositiveLength / branchCount) > PHYLOGRAM_MIN_BRANCH_FRACTION;
        _state.alignPhylogram = false;
        if (_state.circularDisplay === undefined) {
            _state.circularDisplay = false;
        }
        _state.dynahide = true;

        if (_state.searchAinitialValue && (typeof _state.searchAinitialValue === 'string' || _state.searchAinitialValue instanceof String) && _state.searchAinitialValue.trim().length > 0) {
            _state.searchAinitialValue = _state.searchAinitialValue.trim();
            console.log(MESSAGE + 'Setting initial search value for A to: ' + _state.searchAinitialValue);
        } else {
            _state.searchAinitialValue = null;
        }
        if (_state.searchBinitialValue && (typeof _state.searchBinitialValue === 'string' || _state.searchBinitialValue instanceof String) && _state.searchBinitialValue.trim().length > 0) {
            _state.searchBinitialValue = _state.searchBinitialValue.trim();
            console.log(MESSAGE + 'Setting initial search value for B to: ' + _state.searchBinitialValue);
        } else {
            _state.searchBinitialValue = null;
        }
        _state.searchIsCaseSensitive = false;
        _state.searchNegateResult = false;

        // What to label with is read off the tree: show what it actually
        // has -- refined below by forester.suggestLabelFields once the
        // taxonomy / sequence subfield choices are made.
        _state.showNodeName = _basicTreeProperties.nodeNames === true;
        _state.showTaxonomy = _basicTreeProperties.taxonomies === true;
        _state.showSequence = _basicTreeProperties.sequences === true;
        // The Confidence checkbox APPEARS whenever the tree has support values
        // (that is driven by _basicTreeProperties.confidences where the panel
        // is built) but starts unchecked: confidence values clutter the tree.
        _state.showConfidenceValues = false;
        _state.showNodeEvents = _basicTreeProperties.nodeEvents === true;
        _state.showBranchEvents = _basicTreeProperties.branchEvents === true;
        _state.showBranchLengthValues = false;
        _state.showDistributions = false;
        _state.showInternalLabels = false;
        _state.showExternalLabels = true;
        _state.useVisualStyles = true;
        // Long names are shortened from the start; the checkbox is always there
        // to turn that off.
        _state.shortenNodeNames = _basicTreeProperties.longestNodeName > SHORTEN_NAME_MAX_LENGTH;

        // Which taxonomy fields to label with is decided from the tree, not
        // configured: show the scientific name and code when present, and fall
        // back to the common name only when there is no scientific name.
        _state.showTaxonomyCode = presentFields.has('TC');
        _state.showTaxonomyScientificName = presentFields.has('TS');
        _state.showTaxonomyCommonName = presentFields.has('TN') && !presentFields.has('TS');
        _state.showTaxonomyRank = false;
        _state.showTaxonomySynonyms = false;
        // Likewise ONE good sequence identifier rather than all of them, in
        // order of preference: sequence name, gene name, symbol, accession.
        _state.showSequenceName = presentFields.has('SN');
        _state.showSequenceGeneSymbol = presentFields.has('GN') && !presentFields.has('SN');
        _state.showSequenceSymbol = presentFields.has('SS') && !presentFields.has('SN') && !presentFields.has('GN');
        _state.showSequenceAccession = presentFields.has('SA') && !presentFields.has('SN')
            && !presentFields.has('GN') && !presentFields.has('SS');

        // Which of the three groups start CHECKED is then decided from the
        // label text itself (forester.suggestLabelFields): a field whose text
        // is already contained in another field's adds nothing, and when the
        // combined label is still too long only the most identifying field
        // stays. The extractors hand forester exactly the fragments the
        // renderer would print with the subfield choices made above (the raw
        // node name: shortening and label-property substitution are display
        // niceties applied later). The checkboxes always allow overriding.
        if (_treeData) {
            let joinFrag = function (a, b) {
                return (b && String(b).length > 0) ? (a ? a + ' | ' + b : String(b)) : a;
            };
            let suggested = forester.suggestLabelFields(forester.getTreeRoot(_treeData), {
                name: function (n) {
                    return n.name || null;
                },
                taxonomy: function (n) {
                    if (!n.taxonomies || n.taxonomies.length < 1) {
                        return null;
                    }
                    let t = n.taxonomies[0];
                    let l = '';
                    if (_state.showTaxonomyCode) {
                        l = joinFrag(l, t.code);
                    }
                    if (_state.showTaxonomyScientificName) {
                        l = joinFrag(l, t.scientific_name);
                    }
                    if (_state.showTaxonomyCommonName) {
                        l = joinFrag(l, t.common_name);
                    }
                    return l || null;
                },
                sequence: function (n) {
                    if (!n.sequences || n.sequences.length < 1) {
                        return null;
                    }
                    let s = n.sequences[0];
                    let l = '';
                    if (_state.showSequenceSymbol) {
                        l = joinFrag(l, s.symbol);
                    }
                    if (_state.showSequenceName) {
                        l = joinFrag(l, s.name);
                    }
                    if (_state.showSequenceGeneSymbol) {
                        l = joinFrag(l, s.gene_name);
                    }
                    if (_state.showSequenceAccession && s.accession) {
                        l = joinFrag(l, s.accession.value);
                    }
                    return l || null;
                }
            });
            _state.showNodeName = suggested.showNodeName;
            _state.showTaxonomy = suggested.showTaxonomy;
            _state.showSequence = suggested.showSequence;
            let chosen = [];
            if (suggested.showNodeName) {
                chosen.push('node name');
            }
            if (suggested.showTaxonomy) {
                chosen.push('taxonomy');
            }
            if (suggested.showSequence) {
                chosen.push('sequence');
            }
            console.log(MESSAGE + 'initial label fields: ' + (chosen.join(' + ') || 'none')
                + ' (median combined label would be ' + Math.round(suggested.stats.medianCombinedLength)
                + ' characters)');
        }

        // A small tree is drawn with a heavier stroke; hairlines are for trees
        // dense enough to need them.
        _state.branchWidthDefault = _basicTreeProperties.externalNodesCount <= SMALL_TREE_MAX_EXT_NODES
            ? BRANCH_WIDTH_SMALL_TREE : BRANCH_WIDTH_DEFAULT;
        // Set from the saved (or OS) light/dark choice before the first render,
        // so a dark session draws dark from the start rather than flashing light.
        loadPanelTheme();
        applyTreeTheme();
        // Fixed, not configurable: these are the colour-vision-safe Okabe-Ito
        // colours the search and selection highlighting depends on, and they have
        // to stay distinguishable from each other and from the tree.
        _state.found0ColorDefault = FOUND0_COLOR_DEFAULT;
        _state.found1ColorDefault = FOUND1_COLOR_DEFAULT;
        _state.selectedColorDefault = SELECTED_COLOR_DEFAULT;
        _state.found0and1ColorDefault = FOUND0AND1_COLOR_DEFAULT;
        _state.defaultFont = FONT_DEFAULTS;
        _state.nodeSizeDefault = NODE_SIZE_DEFAULT_DEFAULT;
        // Every label shares one font size (as the desktop does). The three
        // _state fields the renderer reads are always kept equal.
        _state.fontSize = FONT_SIZE_DEFAULT;
        _state.nodeLabelGap = NODE_LABEL_GAP_DEFAULT;
        _state.minBranchLengthValueToShow = null;
        _state.minConfidenceValueToShow = null;

        _state.showVisualizations = false;

        // The tree names itself; a caller-supplied name only ever disagreed with
        // the file. It is the stem of every download filename.
        _state.treeName = _treeData.name ? _treeData.name.trim().replace(/\W+/g, '_') : null;
        _state.nameForNhDownload = _state.treeName
            ? (_state.treeName + NH_SUFFIX) : NAME_FOR_NH_DOWNLOAD_DEFAULT;
        _state.nameForPhyloXmlDownload = _state.treeName
            ? (_state.treeName + XML_SUFFIX) : NAME_FOR_PHYLOXML_DOWNLOAD_DEFAULT;
        _state.nameForPngDownload = _state.treeName
            ? (_state.treeName + PNG_SUFFIX) : NAME_FOR_PNG_DOWNLOAD_DEFAULT;
        _state.nameForSvgDownload = _state.treeName
            ? (_state.treeName + SVG_SUFFIX) : NAME_FOR_SVG_DOWNLOAD_DEFAULT;
        _state.nameForFastaDownload = _state.treeName
            ? (_state.treeName + FASTA_SUFFIX) : NAME_FOR_FASTA_DOWNLOAD_DEFAULT;

        if (!_state.visualizationsLegendXpos) {
            // The legend was hard-coded to 220 and so came up underneath the
            // control panel, exactly as the root did. It starts where the tree
            // starts instead.
            _state.visualizationsLegendXpos = leftPanelClearance();
        }
        if (!_state.visualizationsLegendYpos) {
            _state.visualizationsLegendYpos = VISUALIZATIONS_LEGEND_YPOS_DEFAULT;
        }
        _state.visualizationsLegendXposOrig = _state.visualizationsLegendXpos;
        _state.visualizationsLegendYposOrig = _state.visualizationsLegendYpos;

        setFontSizes(parseInt(_state.fontSize));
    }

    function initializeSettings(settings) {
        _settings = settings;

        if (_settings.enableDynamicSizing === undefined) {
            _settings.enableDynamicSizing = true;
        }
        if (_settings.displayWidth && _settings.enableDynamicSizing === true) {
            console.log(WARNING + ': dynamic sizing is turned on, will ignore displayWidth setting');
            _settings.displayWidth = 0;
        }
        if (_settings.displayHeight && _settings.enableDynamicSizing === true) {
            console.log(WARNING + ': dynamic sizing is turned on, will ignore displayHeight setting');
            _settings.displayHeight = 0;
        }
        if ((!_settings.displayWidth) && (!_settings.enableDynamicSizing)) {
            _settings.displayWidth = DISPLAY_WIDTH_DEFAULT;
        }
        if ((!_settings.displayHeight) && (!_settings.enableDynamicSizing)) {
            _settings.displayHeight = DISPLY_HEIGHT_DEFAULT;
        }
        if (!_settings.rootOffset) {
            _settings.rootOffset = leftPanelClearance();
        }
        if (_settings.enableDownloads === undefined) {
            _settings.enableDownloads = true;
        }
        if (_settings.enableVisualizations === undefined) {
            _settings.enableVisualizations = true;
        }
        if (_settings.nhExportWriteConfidences === undefined) {
            _settings.nhExportWriteConfidences = true;
        }
        if (_settings.enableSubtreeDeletion === undefined) {
            _settings.enableSubtreeDeletion = true;
        }
        if (_settings.enableAccessToDatabases === undefined) {
            _settings.enableAccessToDatabases = true;
        }
        if (_settings.zoomToFitUponWindowResize === undefined) {
            _settings.zoomToFitUponWindowResize = true;
        }
        if (_settings.enableManualNodeSelection === undefined) {
            _settings.enableManualNodeSelection = false;
        }
        if (_settings.ladderizeTree === undefined) {
            _settings.ladderizeTree = true;
        }


        intitializeDisplaySize();
    }


    // Dynamic sizing means "fill the container the tree was given". It used to
    // mean that for the width and something else for the height: the height came
    // from window.innerHeight minus the container's top minus 40, i.e. the
    // distance from the container down to the bottom of the WINDOW. On a page
    // where the container is not "everything from here down" -- an ordinary host
    // page with a header, say -- the tree overflowed or underfilled it. The reset
    // path already measured the container, so the two disagreed with each other.
    function displaySizeFromContainer() {
        let element = d3.select(_id).node();
        if (!element) {
            return null;
        }
        return {w: element.clientWidth, h: element.clientHeight};
    }

    function intitializeDisplaySize() {
        if (_settings.enableDynamicSizing) {
            let size = displaySizeFromContainer();
            if (size) {
                _displayWidth = size.w;
                _displayHeight = size.h;
            }
        } else {
            _displayHeight = _settings.displayHeight;
            _displayWidth = _settings.displayWidth;
        }
    }


    function initialize() {
        initializeGui();
        populateSearchMenus();

        _svgGroup = _baseSvg.append('g');
        makeOverview(); // appended after the tree group, so it paints on top of it

        if (_settings.ladderizeTree) {
            ladderizeSubtree(_root, true);   // one pass: a definite arrangement
        }
        if (_state.searchAinitialValue) {
            search0();
        }
        if (_state.searchBinitialValue) {
            search1();
        }

        update(null, 0);

        zoomToFit();

        search0();
        search1();
    }

    // The third argument is the whole config. The fourth is the old settings
    // bag, still accepted and merged so existing call sites keep working; new
    // code puts everything in the third.
    archaeopteryx.launch = function (id, phylo, config, legacySettings, nodeVisualizations, nodeLabels, specialVisualizations) {


        // Bad input is the caller's bug, so it is thrown at the caller. It used
        // to pop a browser alert and return, which blocks the whole tab and
        // leaves an empty div behind with nothing to catch.
        if (phylo === undefined || phylo === null) {
            throw new Error(ERROR + 'input tree is undefined or null');
        }
        if ((!phylo.children) || (phylo.children.length < 1)) {
            throw new Error(ERROR + 'input tree is empty or illegally formatted');
        }

        _treeData = phylo;
        _id = id;
        _zoomListener = d3.zoom()
            .scaleExtent([0.1, 10])
            .filter(function (event) {
                // Reserve the shift key for moving the legend, not zoom/pan.
                // The wheel is handled ourselves (it expands/contracts the tree's
                // layout rather than scaling the picture), so keep d3's own
                // wheel-zoom out of it; dragging to pan still comes through here.
                return !event.shiftKey && event.type !== 'wheel';
            })
            .on('zoom', zoom);
        _basicTreeProperties = forester.collectBasicTreeProperties(_treeData);

        let cfg = readConfig(config, legacySettings);

        // Every launch starts from a clean slate: _vis is rebuilt below and
        // _nodeLabels reassigned, never inherited from a previous launch in
        // the same page.
        if (nodeVisualizations) {
            throw new Error(ERROR + 'the "nodeVisualizations" argument was removed:'
                + ' visualizations are determined automatically from the tree itself');
        }
        _nodeLabels = nodeLabels ? nodeLabels : null;
        _radialRotation = 0;
        _radialLabelsHorizontal = false;
        if (specialVisualizations) {
            throw new Error(ERROR + 'the "specialVisualizations" argument was removed'
                + ' along with the enableSpecialVisualizations2/3/4 settings');
        }
        _vis = null;


        initializeState(cfg.state);
        initializeSettings(cfg.settings);


        initializeVisualizations();

        createGui();

        _baseSvg = d3.select(id).append('svg')
            .attr('width', _displayWidth)
            .attr('height', _displayHeight)
            .call(_zoomListener);

        if (_settings.enableDynamicSizing) {
            d3.select(window)
                .on('resize', function () {
                    let size = displaySizeFromContainer();
                    if (!size) {
                        return;
                    }
                    _displayWidth = size.w;
                    _displayHeight = size.h;

                    _baseSvg.attr('width', size.w);
                    _baseSvg.attr('height', size.h);
                    rebuildOverview();
                    if ((_settings.zoomToFitUponWindowResize === true) && (_zoomed_x_or_y === false) && (Math.abs(currentZoomScale() - 1.0) < 0.001)) {
                        zoomToFit();
                    }
                });
        }

        _treeFn = d3.cluster()
            .size([_displayHeight, _displayWidth]);

        _treeFn.clickEvent = getClickEventListenerNode(phylo);

        _root = phylo;
        _root_const = _root;

        calcMaxExtLabel();

        _root.x0 = _displayHeight / 2;
        _root.y0 = 0;
        initialize();

        //////////////////////////////////////////////////////////////////////

    };

    archaeopteryx.parsePhyloXML = function (data) {
        let phy = phyloXml.parse(data, {trim: true, normalize: true})[0];
        forester.addParents(phy);
        return phy;
    };

    archaeopteryx.parseNewHampshire = function (data, confidenceValuesInBrackets, confidenceValuesAsInternalNames) {
        return forester.parseNewHampshire(data, confidenceValuesInBrackets, confidenceValuesAsInternalNames);
    };

    function calcMaxExtLabel() {
        _maxLabelLength = _state.nodeLabelGap;
        forester.preOrderTraversal(_root, function (d) {
            if (!d.children) {
                let l = makeNodeLabel(d);
                if (l) {
                    _maxLabelLength = Math.max(l.length, _maxLabelLength);
                }
            }
        });
    }


    // The accession the "Access DB" menu entry would look up, or null when this
    // node carries nothing a database link can be built from.
    function databaseAccessionFor(d) {
        let value = null;
        if (d.properties && d.properties.length > 0) {
            for (let i = 0; i < d.properties.length; ++i) {
                let p = d.properties[i];
                if (p.value && p.ref && p.ref.toLowerCase().indexOf('accession') >= 0) {
                    if (RE_SWISSPROT_TREMBL_PFAM.test(p.value) || RE_GENBANK_PROT.test(p.value)
                        || RE_GENBANK_NUC.test(p.value) || RE_REFSEQ.test(p.value)
                        || RE_UNIPROTKB.test(p.value) || RE_SWISSPROT_TREMBL.test(p.value)) {
                        value = p.value;
                        break;
                    }
                }
            }
        }
        if (d.sequences) {
            for (let i = 0; i < d.sequences.length; ++i) {
                let s = d.sequences[i];
                if (s.accession && s.accession.value && s.accession.source) {
                    let source = s.accession.source.toUpperCase();
                    if (source === ACC_GENBANK || source === ACC_NCBI || source === ACC_REFSEQ
                        || source === ACC_UNIPROT || source === ACC_UNIPROTKB || source === ACC_SWISSPROT
                        || source === ACC_TREMBL || source === 'UNKNOWN' || source === '?') {
                        value = s.accession.value;
                        break;
                    }
                }
            }
        }
        if (d.name) {
            if (RE_SWISSPROT_TREMBL.test(d.name)) {
                value = d.name;
            } else if (RE_SWISSPROT_TREMBL_PFAM.test(d.name)) {
                value = RE_SWISSPROT_TREMBL_PFAM.exec(d.name)[1];
            }
        }
        return value;
    }

    // A short heading naming the node the menu belongs to, so it is obvious
    // which node the actions will apply to.
    function makeNodeMenuTitle(d) {
        let name = d.name;
        if (!name && d.taxonomies && d.taxonomies.length > 0) {
            name = d.taxonomies[0].scientific_name || d.taxonomies[0].common_name || d.taxonomies[0].code;
        }
        if (!name && d.sequences && d.sequences.length > 0) {
            name = d.sequences[0].name || d.sequences[0].gene_name;
        }
        if (!name) {
            return d.children ? 'Internal node' : 'Node';
        }
        name = String(name).trim();
        return (name.length > 34) ? (name.substring(0, 33) + '…') : name;
    }

    function getClickEventListenerNode(tree) {

        function nodeClick(event, d) {


            function displayNodeData(n) {
                let title = 'Node Data';
                let text = '';
                if (n.name) {
                    text += 'Name: ' + n.name + '<br>';
                }
                if (n.branch_length) {
                    text += 'Distance to Parent: ' + n.branch_length + '<br>';
                }
                text += 'Depth: ' + forester.calcDepth(n) + '<br>';
                let i = 0;
                if (n.confidences) {
                    for (i = 0; i < n.confidences.length; ++i) {
                        let c = n.confidences[i];
                        if (c.type) {
                            text += 'Confidence [' + c.type + ']: ' + c.value + '<br>';
                        } else {
                            text += 'Confidence: ' + c.value + '<br>';
                        }
                        if (c.stddev) {
                            text += '- stdev: ' + c.stddev + '<br>';
                        }
                    }
                }
                if (n.taxonomies) {
                    for (i = 0; i < n.taxonomies.length; ++i) {
                        text += 'Taxonomy<br>';
                        let t = n.taxonomies[i];
                        if (t.id) {
                            if (t.id.provider) {
                                text += '- Id [' + t.id.provider + ']: ' + t.id.value + '<br>';
                            } else {
                                text += '- Id: ' + t.id.value + '<br>';
                            }
                        }
                        if (t.code) {
                            text += '- Code: ' + t.code + '<br>';
                        }
                        if (t.scientific_name) {
                            text += '- Scientific name: ' + t.scientific_name + '<br>';
                        }
                        if (t.common_name) {
                            text += '- Common name: ' + t.common_name + '<br>';
                        }
                        if (t.rank) {
                            text += '- Rank: ' + t.rank + '<br>';
                        }
                    }
                }
                if (n.sequences) {
                    for (i = 0; i < n.sequences.length; ++i) {
                        text += 'Sequence<br>';
                        let s = n.sequences[i];
                        if (s.accession) {
                            if (s.accession.source) {
                                text += '- Accession [' + s.accession.source + ']: ' + s.accession.value + '<br>';
                            } else {
                                text += '- Accession: ' + s.accession.value + '<br>';
                            }
                            if (s.accession.comment) {
                                text += '-- comment: ' + s.accession.comment + '<br>';
                            }
                        }
                        if (s.symbol) {
                            text += '- Symbol: ' + s.symbol + '<br>';
                        }
                        if (s.name) {
                            text += '- Name: ' + s.name + '<br>';
                        }
                        if (s.gene_name) {
                            text += '- Gene name: ' + s.gene_name + '<br>';
                        }
                        if (s.location) {
                            text += '- Location: ' + s.location + '<br>';
                        }
                        if (s.type) {
                            text += '- Type: ' + s.type + '<br>';
                        }
                    }
                }
                if (n.distributions) {
                    let distributions = n.distributions;
                    for (i = 0; i < distributions.length; ++i) {
                        text += 'Distribution: ';
                        if (distributions[i].desc) {
                            text += distributions[i].desc + '<br>';
                        }
                    }
                }
                if (n.date) {
                    text += 'Date: ';
                    let date = n.date;
                    if (date.desc) {
                        text += date.desc + '<br>';
                    }
                }
                if (n.events) {
                    text += 'Events<br>';
                    let ev = n.events;
                    if (ev.type && ev.type.length > 0) {
                        text += '- Type: ' + ev.type + '<br>';
                    }
                    if (ev.duplications && ev.duplications > 0) {
                        text += '- Duplications: ' + ev.duplications + '<br>';
                    }
                    if (ev.speciations && ev.speciations > 0) {
                        text += '- Speciations: ' + ev.speciations + '<br>';
                    }
                    if (ev.losses && ev.losses > 0) {
                        text += '- Losses: ' + ev.losses + '<br>';
                    }
                }
                if (n.properties && n.properties.length > 0) {
                    let propertiesLength = n.properties.length;
                    for (i = 0; i < propertiesLength; ++i) {
                        let property = n.properties[i];
                        if (property.ref && property.value) {
                            if (property.unit) {
                                text += property.ref + ': ' + property.value + property.unit + '<br>';
                            } else {
                                text += property.ref + ': ' + property.value + '<br>';
                            }
                        }
                    }
                }
                if (n.children) {
                    text += 'Sum of Subtree Tips: ' + forester.calcSumOfAllExternalDescendants(n) + '<br>';
                }

                showNodeDataDialog(title, text, false, 260, 300);

                update();
            }

            function downloadExternalNodeDataAll(node) {

                let addSep = function (t) {
                    if (t.length > 0) {
                        t += '\t';
                    }
                    return t;
                };

                let addSepSame = function (t) {
                    if (t.length > 0) {
                        t += ', ';
                    }
                    return t;
                };
                let text_all = '';

                const ext_nodes = forester.getAllExternalNodes(node).reverse();

                let filename;
                if (ext_nodes.length === 1 && ext_nodes[0].name) {
                    filename = 'External_Node_Data_for_Node_' + ext_nodes[0].name.replace(/\W/g, '_') + '.txt';
                } else {
                    filename = 'External_Node_Data_for_' + ext_nodes.length + '_Nodes.txt';
                }

                for (let j = 0, l = ext_nodes.length; j < l; ++j) {
                    let text = '';
                    let n = ext_nodes[j];
                    if (n.name) {
                        text += n.name
                    }

                    if (n.properties && (n.properties.length > 0)) {
                        const sorted_properties = n.properties.concat().sort();
                        const l = sorted_properties.length;
                        let properties_text = '';
                        let prev_property_ref = null;
                        for (let pl = 0; pl < l; ++pl) {
                            if (sorted_properties[pl].applies_to === 'node') {
                                if (sorted_properties[pl].ref === prev_property_ref) {
                                    properties_text = addSepSame(properties_text);
                                } else {
                                    prev_property_ref = sorted_properties[pl].ref;
                                    properties_text = addSep(properties_text);
                                }
                                properties_text += sorted_properties[pl].value;
                            }
                        }
                        if (properties_text.length > 0) {
                            text = addSep(text);
                            text += properties_text;
                        }
                    }

                    if (n.taxonomies) {
                        let tax_text = '';
                        for (let i = 0; i < n.taxonomies.length; ++i) {
                            let t = n.taxonomies[i];
                            if (t.id) {
                                if (t.id.provider) {
                                    tax_text = addSep(tax_text);
                                    tax_text += '[' + t.id.provider + ']:' + t.id.value;
                                } else {
                                    tax_text = addSep(tax_text);
                                    tax_text += t.id.value;
                                }
                            }
                            if (t.code) {
                                tax_text = addSep(tax_text);
                                tax_text += t.code;
                            }
                            if (t.scientific_name) {
                                tax_text = addSep(tax_text);
                                tax_text += t.scientific_name;
                            }
                            if (t.common_name) {
                                tax_text = addSep(tax_text);
                                tax_text += t.common_name;
                            }
                            if (t.rank) {
                                tax_text = addSep(tax_text);
                                tax_text += t.rank;
                            }
                        }
                        text = addSep(text);
                        text += tax_text;
                    }
                    if (n.sequences) {
                        let seq_text = '';
                        for (let i = 0; i < n.sequences.length; ++i) {
                            let s = n.sequences[i];
                            if (s.accession) {
                                if (s.accession.source) {
                                    seq_text = addSep(seq_text);
                                    seq_text += '[' + s.accession.source + ']:' + s.accession.value;
                                } else {
                                    seq_text = addSep(seq_text);
                                    seq_text += s.accession.value;
                                }
                            }
                            if (s.symbol) {
                                seq_text = addSep(seq_text);
                                seq_text += s.symbol;
                            }
                            if (s.name) {
                                seq_text = addSep(seq_text);
                                seq_text += s.name;
                            }
                            if (s.gene_name) {
                                seq_text = addSep(seq_text);
                                seq_text += s.gene_name;
                            }
                            if (s.location) {
                                seq_text = addSep(seq_text);
                                seq_text += s.location;
                            }
                        }
                        text = addSep(text);
                        text += seq_text;
                    }
                    if (text.length > 0) {
                        text_all += text + '\n';
                    }
                }

                saveAs(new Blob([text_all], {type: "application/txt"}), filename);

                update();
            }

            function downloadExternalNodeMolecularSequenceAsFasta(node) {
                const text_all = forester.getMolecularSequencesAsFasta(node, '\n');
                const ext_nodes = forester.getAllExternalNodes(node);
                let filename;
                if (ext_nodes.length === 1 && ext_nodes[0].name) {
                    filename = 'Sequence_for_Node_' + ext_nodes[0].name.replace(/\W/g, '_') + FASTA_SUFFIX;
                } else {
                    filename = 'Sequences_for_' + ext_nodes.length + '_Nodes' + FASTA_SUFFIX;
                }
                saveAs(new Blob([text_all], {type: "application/txt"}), filename);
                update();
            }

            function accessDatabase(node) {
                let url = null;
                let accessionValue = null;
                if (node.properties && node.properties.length > 0) {
                    let propertiesLength = node.properties.length;
                    for (let i = 0; i < propertiesLength; ++i) {
                        let p = node.properties[i];
                        if (p.value && p.ref.toLowerCase().indexOf("accession") >= 0) {
                            let value = accessionValue = p.value;
                            if (RE_GENBANK_PROT.test(value)) {
                                url = 'https://www.ncbi.nlm.nih.gov/protein/' + value;
                            } else if (RE_GENBANK_NUC.test(value)) {
                                url = 'https://www.ncbi.nlm.nih.gov/nuccore/' + value;
                            } else if (RE_REFSEQ.test(value)) {
                                url = 'https://www.ncbi.nlm.nih.gov/nuccore/' + value;
                            } else if (RE_UNIPROTKB.test(value)) {
                                url = 'https://www.uniprot.org/uniprot/' + value;
                            } else if (RE_SWISSPROT_TREMBL.test(value)) {
                                url = 'https://www.uniprot.org/uniprot/' + value;
                            } else if (RE_SWISSPROT_TREMBL_PFAM.test(value)) {
                                url = 'https://www.uniprot.org/uniprot/' + RE_SWISSPROT_TREMBL_PFAM.exec(value)[1];
                            }
                            if (url) {
                                break;
                            }
                        }
                    }
                }
                if (!url && node.sequences) {
                    for (let i = 0; i < node.sequences.length; ++i) {
                        let s = node.sequences[i];
                        if (s.accession && s.accession.value && s.accession.source) {
                            let value = accessionValue = s.accession.value;
                            let source = s.accession.source.toUpperCase();

                            if (source === ACC_GENBANK || source === ACC_NCBI) {
                                if (RE_GENBANK_PROT.test(value)) {
                                    url = 'https://www.ncbi.nlm.nih.gov/protein/' + value;
                                } else if (RE_GENBANK_NUC.test(value)) {
                                    url = 'https://www.ncbi.nlm.nih.gov/nuccore/' + value;
                                }
                            } else if (source === ACC_REFSEQ) {
                                url = 'https://www.ncbi.nlm.nih.gov/nuccore/' + value;
                            } else if (source === ACC_UNIPROT || source === ACC_UNIPROTKB) {
                                url = 'https://www.uniprot.org/uniprot/' + value;
                            } else if (source === ACC_SWISSPROT || source === ACC_TREMBL) {
                                url = 'https://www.uniprot.org/uniprot/' + value;
                            } else if (source === 'UNKNOWN' || source === '?') {
                                if (RE_GENBANK_PROT.test(value)) {
                                    url = 'https://www.ncbi.nlm.nih.gov/protein/' + value;
                                } else if (RE_GENBANK_NUC.test(value)) {
                                    url = 'https://www.ncbi.nlm.nih.gov/nuccore/' + value;
                                } else if (RE_REFSEQ.test(value)) {
                                    url = 'https://www.ncbi.nlm.nih.gov/nuccore/' + value;
                                } else if (RE_UNIPROTKB.test(value)) {
                                    url = 'https://www.uniprot.org/uniprot/' + value;
                                } else if (RE_SWISSPROT_TREMBL.test(value)) {
                                    url = 'https://www.uniprot.org/uniprot/' + value;
                                } else if (RE_SWISSPROT_TREMBL_PFAM.test(value)) {
                                    url = 'https://www.uniprot.org/uniprot/' + RE_SWISSPROT_TREMBL_PFAM.exec(value)[1];
                                }
                            }
                        }
                    }
                }
                if (!url && node.name) {
                    if (RE_SWISSPROT_TREMBL.test(node.name)) {
                        url = 'https://www.uniprot.org/uniprot/' + node.name;
                    } else if (RE_SWISSPROT_TREMBL_PFAM.test(node.name)) {
                        url = 'https://www.uniprot.org/uniprot/' + RE_SWISSPROT_TREMBL_PFAM.exec(node.name)[1];
                    }
                }

                if (url) {
                    let win = window.open(url, '_blank');
                    win.focus();
                } else {
                    // Not a programming error -- the user clicked and there is
                    // simply nowhere to go -- so this one gets told in the same
                    // dialog the node data uses, not thrown and not alerted.
                    // Finding no accession at all and finding one we cannot
                    // build a URL from are different answers, so say which.
                    showNodeDataDialog('Cannot Open Database Entry',
                        accessionValue
                            ? ('Accession: ' + accessionValue
                                + '<br>Problem: not an identifier Archaeopteryx.js knows how to link to')
                            : 'Problem: this node carries no sequence accession',
                        false, 380, 200);
                }


            }


            function listMolecularSequences(node) {

                let text_all = forester.getMolecularSequencesAsFasta(node, '<br>');

                let ext_nodes = forester.getAllExternalNodes(node);
                let title = 'Sequences in for ' + ext_nodes.length + ' Nodes';


                showNodeDataDialog(title, text_all, true, 400, 260);

                update();
            }

            function switchToSubtree(node) {
                if (node.parent) {
                    if (!(node.children)) {
                        if (node.parent.parent) {
                            node = node.parent;
                        } else {
                            return;
                        }
                    }

                    if (node.parent.parent) {
                        _in_subtree = true;

                        let fakeNode = {};
                        fakeNode.children = [node];
                        fakeNode.x = 0;
                        fakeNode.x0 = 0;
                        fakeNode.y = 0;
                        fakeNode.y0 = 0;
                        _root = fakeNode;
                        _basicTreeProperties = forester.collectBasicTreeProperties(_root);
                        refreshVisualizations();
                        search0();
                        search1();
                        zoomToFit();
                    }
                }
            }

            function swapChildren(d) {
                let c = d.children;
                let l = c.length;
                if (l > 1) {
                    let first = c[0];
                    for (let i = 0; i < l - 1; ++i) {
                        c[i] = c[i + 1];
                    }
                    c[l - 1] = first;
                }
            }

            function selectDeselectNode(node) {
                if (_selectedNodes.has(node)) {
                    _selectedNodes.delete(node);
                } else {
                    _selectedNodes.add(node);
                }
                update(null, 0, true);
                const event = new Event('selected_nodes_changed_event');
                document.dispatchEvent(event);
            }

            function selectDeselectNodeExtNodes(node) {
                const ext_nodes = forester.getAllExternalNodes(node);
                for (let j = 0, l = ext_nodes.length; j < l; ++j) {
                    const en = ext_nodes[j];
                    if (_selectedNodes.has(en)) {
                        _selectedNodes.delete(en);
                    } else {
                        _selectedNodes.add(en);
                    }
                }
                update(null, 0, true);
                const event = new Event('selected_nodes_changed_event');
                document.dispatchEvent(event);
            }

            // Build the menu declaratively, then render it as an HTML overlay
            // (see showNodeMenu). Same actions and the same order as before.
            let items = [];
            if (d.parent) {
                items.push({label: 'Display Node Data', action: function () { displayNodeData(d); }});
            }
            if (d.parent && d.parent.parent) {
                // "Switch to ..." matches the desktop's wording for this action.
                items.push({separator: true});
                items.push({label: 'Switch to Subtree', action: function () { switchToSubtree(d); }});
            }
            if (d.parent && d.children) {
                // redrawn with no transition: animating a swap sends the two
                // clades sliding across each other, which is just noise
                items.push({label: 'Swap Descendants', action: function () { swapChildren(d); update(null, 0); }});
                items.push({label: 'Ladderize Subtree', action: function () {
                    if (!_treeFn.visData) {
                        _treeFn.visData = {};
                    }
                    if (_treeFn.visData.ladderize === undefined) {
                        _treeFn.visData.ladderize = true;
                    }
                    ladderizeSubtree(d, _treeFn.visData.ladderize, true);
                    _treeFn.visData.ladderize = !_treeFn.visData.ladderize;
                    update(null, 0);
                }});
            }
            if (!_in_subtree && d.parent && d.parent.parent
                && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
                items.push({label: 'Reroot', action: function () { forester.reRoot(tree, d, -1); zoomToFit(); }});
            }
            if (_settings.enableManualNodeSelection) {
                items.push({label: 'Select/Deselect Node', action: function () { selectDeselectNode(d); }});
                items.push({label: 'Select/Deselect All Ext Nodes', action: function () { selectDeselectNodeExtNodes(d); }});
            }
            if (d.parent) {
                items.push({separator: true});
                items.push({label: 'Download Ext. Node Data', action: function () { downloadExternalNodeDataAll(d); }});
            }
            if (d.parent && _basicTreeProperties.sequences
                && _basicTreeProperties.maxMolSeqLength && (_basicTreeProperties.maxMolSeqLength > 0)) {
                items.push({label: 'List Sequences in Fasta', action: function () { listMolecularSequences(d); }});
                items.push({label: 'Download Sequences in Fasta', action: function () { downloadExternalNodeMolecularSequenceAsFasta(d); }});
            }
            if (_settings.enableAccessToDatabases === true) {
                let acc = databaseAccessionFor(d);
                if (acc) {
                    items.push({separator: true});
                    items.push({label: 'Access DB [' + acc + ']', action: function () { accessDatabase(d); }});
                }
            }
            if ((_settings.enableSubtreeDeletion === true) && !_in_subtree
                && d.parent && d.parent.parent && d.parent.parent.parent) {
                let deleteLabel = null;
                if (d.children) {
                    if (d.children.length > 1) {
                        deleteLabel = 'Delete Subtree';
                    }
                } else {
                    deleteLabel = 'Delete External Node';
                }
                if (deleteLabel) {
                    items.push({separator: true});
                    items.push({label: deleteLabel, danger: true, action: function () {
                        forester.deleteSubtree(tree, d);
                        _treeData = tree;
                        _basicTreeProperties = forester.collectBasicTreeProperties(_treeData);
                        refreshVisualizations();
                        search0();
                        search1();
                        zoomToFit();
                    }});
                }
            }

            showNodeMenu(items, event, makeNodeMenuTitle(d));
        }

        return nodeClick;
    }


    // After a permanent tree edit (subtree deletion), the candidates are
    // re-derived from what is left; the user's choices survive when their
    // fields do. Plain subtree NAVIGATION does not come through here -- a
    // subtree keeps its parent tree's visualizations, so colours stay
    // stable diving in and out.
    // The view changed -- into or out of a subtree, or the tree was edited.
    // Candidates, menus and legends are recomputed for what is displayed; the
    // user's choices survive when their fields do (otherwise the menu goes
    // back to default and the tree to plain ink -- honest, not a silent
    // switch); colour/shape identities persist via the memory maps; and no
    // checkbox moves, because a view change is not a user choice.
    function refreshVisualizations() {
        if (!_vis) {
            return;
        }
        let colorId = _vis.colorId;
        let shapeId = _vis.shapeId;
        computeVisualizationCandidates(displayedRoot());
        _vis.colorId = (colorId && _vis.byId[colorId]) ? colorId : null;
        _vis.shapeId = (shapeId && _vis.byId[shapeId] && _vis.byId[shapeId].shape) ? shapeId : null;
        populateVisualizationMenus();
        removeColorLegend(LEGEND_LABEL_COLOR);
        removeShapeLegend(LEGEND_NODE_SHAPE);
    }


        // Zooming rescales the LAYOUT, and the rectangular layout grows from its
    // top-left origin -- so without compensating, the tree creeps away toward a
    // corner as you zoom and you lose what you were looking at. Keep whatever
    // sits under the middle of the viewport there.
    //
    // The anchor point is MEASURED from the content's extent before and after,
    // not derived from the zoom factor: the layout is affine, not proportional
    // (it subtracts borders and the longest label), so a factor-based guess
    // drifts. The circular layout already centres itself, so it is left alone.
    // The layout's own spans, which nodes are laid out across: a node renders at
    // translate(d.y, d.x) with d.x in [0, vertical] and d.y in [0, horizontal],
    // so these are exactly what a zoom rescales.
    function layoutSpans() {
        // Clamped exactly like update() clamps _w: with very long labels the
        // raw difference goes to (or below) zero while the layout itself never
        // shrinks past 1, and an anchor ratio taken from the unclamped value
        // would be wildly wrong (it once flung the whole tree off-screen after
        // three X+ presses on a long-labelled tree).
        return {
            horizontal: Math.max(1, _displayWidth - calcMaxTreeLengthForDisplay()),
            vertical: Math.max(1, _displayHeight - (2 * TOP_AND_BOTTOM_BORDER_HEIGHT))
        };
    }

    function keepViewportCentred(applyZoom) {
        let size = svgSize();
        if (_state.circularDisplay || !_baseSvg || !size) {
            applyZoom();
            return;
        }
        let t = d3.zoomTransform(_baseSvg.node());
        let before = layoutSpans();
        // the layout point currently under the middle of the viewport
        let cx = ((size.w / 2) - t.x) / t.k;
        let cy = ((size.h / 2) - t.y) / t.k;

        applyZoom();

        let after = layoutSpans();
        // Taken from the layout spans, NOT from a measured bounding box: nodes
        // and labels are moved by a transition, so straight after update() the
        // rendered geometry is still a mix of old and new and measuring it puts
        // the anchor in the wrong place (which showed up as the tree wandering
        // up the screen while zooming out). The spans are exact and immediate.
        //
        // Horizontally the layout has two zones. Points inside the branch span
        // SCALE with it, but a viewport centre can also sit over the label
        // zone beyond it (with long labels, most of the picture) -- label text
        // keeps its length and only TRANSLATES with its anchor node, so that
        // part of the distance is carried over unscaled. Splitting the anchor
        // this way is exact for labels anchored at the far edge and a close
        // approximation for the rest; scaling the whole distance made the
        // display race off horizontally on long-labelled trees.
        let bx = Math.min(cx, before.horizontal);
        let nx = bx * (after.horizontal / before.horizontal) + (cx - bx);
        let ny = cy * (after.vertical / before.vertical);
        _baseSvg.call(_zoomListener.transform, d3.zoomIdentity
            .translate((size.w / 2) - (nx * t.k), (size.h / 2) - (ny * t.k))
            .scale(t.k));
    }

    // The desktop's radial rotation: each press turns the circular layout by
    // pi/32, wrapping. While the circular layout is on, the X+/X- buttons do
    // this instead of zooming -- both axes of a circle are its one diameter,
    // so horizontal zoom would be redundant there.
    function rotateRadial(clockwise) {
        _radialRotation = (_radialRotation + (clockwise ? 1 : -1) * Math.PI / 32) % (2 * Math.PI);
        update(null, 0, true);
    }

    // The desktop's fit-width button: fit the tree to the window width,
    // keeping the current vertical zoom. In the circular layout, where it
    // would duplicate the fit button (a circle has just its one diameter), it
    // becomes the node-label-direction flip instead: external labels either
    // ride their radial spokes or stand upright (horizontal) at the ring.
    function fitWidthButtonPressed() {
        if (_state.circularDisplay) {
            _radialLabelsHorizontal = !_radialLabelsHorizontal;
            syncZoomRowButtons();
            update(null, 0, true);
            return;
        }
        if (!_root) {
            return;
        }
        keepViewportCentred(function () {
            calcMaxExtLabel();
            let keepHeight = _displayHeight;
            intitializeDisplaySize();
            _displayHeight = keepHeight;
            update(null, 0);
        });
    }

    function zoomInX(zoomInFactor) {
        if (_state.circularDisplay) {
            rotateRadial(true);
            return;
        }
        keepViewportCentred(function () {
            _zoomed_x_or_y = true;
            if (zoomInFactor) {
                _displayWidth = _displayWidth * zoomInFactor;
            } else {
                _displayWidth = _displayWidth * BUTTON_ZOOM_IN_FACTOR;
            }
            update(null, 0);
        });
    }

    function zoomInY(zoomInFactor) {
        keepViewportCentred(function () {
            _zoomed_x_or_y = true;
            if (zoomInFactor) {
                _displayHeight = _displayHeight * zoomInFactor;
            } else {
                _displayHeight = _displayHeight * BUTTON_ZOOM_IN_FACTOR;
            }
            update(null, 0);
        });
    }

    function zoomOutX(zoomOutFactor) {
        if (_state.circularDisplay) {
            rotateRadial(false);
            return;
        }
        keepViewportCentred(function () {
            _zoomed_x_or_y = true;
            let newDisplayWidth;
            if (zoomOutFactor) {
                newDisplayWidth = _displayWidth * zoomOutFactor;
            } else {
                newDisplayWidth = _displayWidth * BUTTON_ZOOM_OUT_FACTOR;
            }
            if ((newDisplayWidth - calcMaxTreeLengthForDisplay()) >= 1) {
                _displayWidth = newDisplayWidth;
                update(null, 0);
            }
        });
    }

    function zoomOutY(zoomOutFactor) {
        keepViewportCentred(function () {
            _zoomed_x_or_y = true;
            if (zoomOutFactor) {
                _displayHeight = _displayHeight * zoomOutFactor;
            } else {
                _displayHeight = _displayHeight * BUTTON_ZOOM_OUT_FACTOR;
            }
            let min = 40;
            if (_displayHeight < min) {
                _displayHeight = min;
            }
            update(null, 0);
        });
    }

    function zoomToFit() {
        _zoomed_x_or_y = false;
        if (_root) {
            calcMaxExtLabel();
            intitializeDisplaySize();
            initializeSettings(_settings);
            setZoomScale(1);
            update(_root, 0);
            if (_state.circularDisplay) {
                fitCircular();
            } else {
                centerNode(_root, _settings.rootOffset, TOP_AND_BOTTOM_BORDER_HEIGHT);
            }
        }
    }

    // Fit the circular tree into the viewport, centred. The root is at the
    // group origin (0,0), so we place that at the viewport centre and scale so
    // the outer label ring fits. Computed from the known radial extent rather
    // than getBBox(), which would read stale positions during the transition.
    function fitCircular() {
        if (!_radial || !_radial.maxRad) {
            return;
        }
        let labelSpace = (_maxLabelLength * _state.externalNodeFontSize * LABEL_SIZE_CALC_FACTOR) + LABEL_SIZE_CALC_ADDITION;
        let outer = _radial.maxRad + labelSpace;
        let W = +_baseSvg.attr('width'), H = +_baseSvg.attr('height');
        let scale = 0.9 * (Math.min(W, H) / (2 * outer));
        if (!isFinite(scale) || scale <= 0) {
            scale = 1;
        }
        _baseSvg.call(_zoomListener.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(scale));
    }

    function zoomToExpandY() {
        if (_root) {
            calcMaxExtLabel();
            intitializeDisplaySize();
            setZoomScale(1);
            update(_root, 0);
            _zoomed_x_or_y = true;
            const uncollsed_nodes = forester.calcSumOfExternalDescendants(_root);
            _displayHeight = _state.externalNodeFontSize * (uncollsed_nodes * 1.3);
            const min = 40;
            if (_displayHeight < min) {
                _displayHeight = min;
            }
            update(null, 0);
        }
    }

    function returnToSupertreeButtonPressed() {
        if (_in_subtree) {
            _root = _root_const;
            _in_subtree = false;
            _basicTreeProperties = forester.collectBasicTreeProperties(_root);
            refreshVisualizations();
            search0();
            search1();
            zoomToFit();
        }
    }


    function returnToSupertreeButtonByOnePressed() {
        if (_in_subtree && _root.parent !== _root_const) {
            const prev_root = _root.children[0];
            _root = _root_const;
            let found = null;
            forester.preOrderTraversalAll(_root, function (n) {
                if (n.children) {
                    const l = n.children.length;
                    for (let i = 0; i < l; ++i) {
                        if (n.children[i] === prev_root) {
                            found = n;
                            return;
                        }
                    }
                }
            });
            if (found) {
                if (!found.parent || found.parent === _root_const || found === _root_const) {
                    _in_subtree = false;
                    _root = _root_const;
                } else {
                    const fakeNode = {};
                    fakeNode.children = [found];
                    fakeNode.x = 0;
                    fakeNode.x0 = 0;
                    fakeNode.y = 0;
                    fakeNode.y0 = 0;
                    _root = fakeNode;
                }

                _basicTreeProperties = forester.collectBasicTreeProperties(_root);
                refreshVisualizations();
                search0();
                search1();
                zoomToFit();
            } else {
                _in_subtree = false;
            }
        }
    }


    function ladderizeButtonPressed() {
        if (_root) {
            if (!_treeFn.visData) {
                _treeFn.visData = {};
            }
            if (_treeFn.visData.ladderize === undefined) {
                _treeFn.visData.ladderize = true;
            }
            ladderizeSubtree(_root, _treeFn.visData.ladderize, true);
            _treeFn.visData.ladderize = !_treeFn.visData.ladderize;
            // The glyph shows the direction the NEXT press will ladderize in.
            let orderBtn = byId(LADDERIZE_BUTTON);
            if (orderBtn) {
                orderBtn.innerHTML = makeGlyph(_treeFn.visData.ladderize ? 'ladderize_asc' : 'ladderize_desc');
            }
            update(null, 0);
        }
    }

    // Midpoint re-rooting rearranges the whole tree and its button is easy to
    // hit by accident, so it asks first -- through the same little popup the
    // node menu uses (click anywhere else or press Esc to cancel).
    function midpointRootButtonPressed(event) {
        if (!_in_subtree && _root && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
            let ev = event;
            if (!ev || ev.pageX === undefined) {
                // keyboard invocation (Alt+M): anchor the popup at the button
                let b = byId(MIDPOINT_ROOT_BUTTON);
                if (b) {
                    let r = b.getBoundingClientRect();
                    ev = {pageX: window.scrollX + r.right + 4, pageY: window.scrollY + r.top};
                }
            }
            showNodeMenu([
                {
                    label: 'Midpoint re-root', action: function () {
                        forester.midpointRoot(_root);
                        zoomToFit();
                    }
                },
                {
                    label: 'Cancel', action: function () {
                    }
                }
            ], ev, 'midpoint re-root the tree?');
        }
    }

    function escPressed() {
        if (_in_subtree) {
            _root = _root_const;
            _in_subtree = false;
        }

        _basicTreeProperties = forester.collectBasicTreeProperties(_root);

        initializeSettings(_settings);

        _radialRotation = 0;
        _radialLabelsHorizontal = false;
        syncZoomRowButtons();
        refreshVisualizations();
        // Esc resets to the launch state -- the auto-applied colour, when its
        // field still exists in what remains of the tree.
        if (_vis) {
            _vis.colorId = (_vis.autoColorId && _vis.byId[_vis.autoColorId]) ? _vis.autoColorId : null;
            _vis.shapeId = null;
            _vis.legendSortById = {};
            _vis.colorModeById = {};
            _vis.legendExpandedById = {};
        }
        setSelectMenuValue(LABEL_COLOR_SELECT_MENU, (_vis && _vis.colorId) || DEFAULT);
        setSelectMenuValue(NODE_SHAPE_SELECT_MENU, DEFAULT);
        removeColorLegend(LEGEND_LABEL_COLOR);
        removeShapeLegend(LEGEND_NODE_SHAPE);


        if (_settings.enableDynamicSizing) {
            let size = displaySizeFromContainer();
            if (size) {
                _displayWidth = size.w;
                _displayHeight = size.h;
                // the canvas has to follow, or the layout is computed for one
                // size and drawn on another
                _baseSvg.attr('width', size.w);
                _baseSvg.attr('height', size.h);
            }
        }
        // Where the user dragged the legend to is their choice; a resize is no
        // reason to undo it.
        zoomToFit();
        if (_settings.enableVisualizations) {
            let c0 = document.querySelector(_id + ' > .aptx-panel');
            if (c0) {
                setStyles(c0, {
                    'left': CONTROLS_0_LEFT_DEFAULT, 'top': CONTROLS_0_TOP_DEFAULT
                });
            }
        }
        if (_state.searchAinitialValue) {
            setValue(SEARCH_FIELD_0, _state.searchAinitialValue);
        } else {
            setValue(SEARCH_FIELD_0, '');
        }
        if (_state.searchBinitialValue) {
            setValue(SEARCH_FIELD_1, _state.searchBinitialValue);

        } else {
            setValue(SEARCH_FIELD_1, '');
        }

        update(null, 0);
        search0();
        search1();

    }

    // Both search boxes route through one coordinator so the Combine A & B control
    // can intersect / union them. search0 / search1 are kept as the names the rest
    // of the code calls (display toggles, keyup, etc.).
    function search0() { runSearches(); }

    function search1() { runSearches(); }

    function runSearches() {
        let specA = currentSearchSpec(0);
        let specB = currentSearchSpec(1);
        let aActive = !!(specA.value && specA.value.trim().length > 0);
        let bActive = !!(specB.value && specB.value.trim().length > 0);
        let combine = getValue(SEARCH_COMBINE_SELECT);
        updateCombineVisibility(aActive, bActive);
        updateSearchFieldValidity(0);
        updateSearchFieldValidity(1);

        _foundNodes0 = new Set();
        _foundNodes1 = new Set();
        _searchBox0Empty = !aActive;
        _searchBox1Empty = !bActive;

        if (combine && combine !== 'independent' && aActive && bActive) {
            // Combined result lives in found-set 0 only, so colour / count reflect it.
            let setA = forester.searchWithSpec(_root, specA);
            let setB = forester.searchWithSpec(_root, specB);
            let combined = new Set();
            if (combine === 'and') {
                setA.forEach(function (n) { if (setB.has(n)) combined.add(n); });
            } else {
                setA.forEach(function (n) { combined.add(n); });
                setB.forEach(function (n) { combined.add(n); });
            }
            _foundNodes0 = combined;
            _searchBox0Empty = false;
            _searchBox1Empty = true;
        } else {
            if (aActive) _foundNodes0 = forester.searchWithSpec(_root, specA);
            if (bActive) _foundNodes1 = forester.searchWithSpec(_root, specB);
        }
        update(null, 0, true);
    }

    // The Combine control only makes sense when both boxes hold a query.
    function updateCombineVisibility(aActive, bActive) {
        let row = byId(SEARCH_COMBINE_ROW);
        if (row) row.style.display = (aActive && bActive) ? '' : 'none';
    }

    // Flag a value box red when its (non-empty) query can never match: an
    // uncompilable regex in regex mode, or a non-number on a numeric field.
    function updateSearchFieldValidity(idx) {
        let spec = currentSearchSpec(idx);
        let input = byId(idx === 0 ? SEARCH_FIELD_0 : SEARCH_FIELD_1);
        let input2 = byId(idx === 0 ? SEARCH_VALUE2_0 : SEARCH_VALUE2_1);
        let v = (spec.value === null || spec.value === undefined) ? '' : String(spec.value).trim();
        let badPrimary = false, badSecondary = false;
        if (v.length >= 1) {
            if (spec.field.numeric) badPrimary = forester.parseFiniteDouble(v) === null;
            else if (spec.mode === 'regex') badPrimary = forester.makeSearchStringTest(v, 'regex', spec.caseSensitive) === null;
        }
        if (spec.field.numeric && spec.mode === 'range') {
            let v2 = (spec.value2 === null || spec.value2 === undefined) ? '' : String(spec.value2).trim();
            badSecondary = v2.length >= 1 && forester.parseFiniteDouble(v2) === null;
        }
        if (input) {
            if (input.dataset.baseTitle === undefined) input.dataset.baseTitle = input.title;
            input.classList.toggle('aptx-search-invalid', badPrimary);
            input.title = badPrimary
                ? (spec.field.numeric ? 'not a valid number' : 'invalid regular expression')
                : input.dataset.baseTitle;
        }
        if (input2) input2.classList.toggle('aptx-search-invalid', badSecondary);
    }

    function resetSearch0() {
        setValue(SEARCH_FIELD_0, '');
        setValue(SEARCH_VALUE2_0, '');
        runSearches();
    }

    function resetSearch1() {
        setValue(SEARCH_FIELD_1, '');
        setValue(SEARCH_VALUE2_1, '');
        runSearches();
    }

    // ===================== Search (UI glue) =====================
    // The search engine itself (field discovery, spec matching, value
    // extraction) lives in forester.js (forester.availableSearchFields,
    // forester.searchWithSpec, ...) where it runs in Node and is covered by
    // test/search_test.js. This section is only the control-panel glue.

    // Read a search box's current field / mode / value(s) into a spec.
    function currentSearchSpec(idx) {
        let key = getValue(idx === 0 ? SEARCH_FIELD_SELECT_0 : SEARCH_FIELD_SELECT_1);
        let field = null;
        for (let i = 0; i < _searchFields.length; ++i) {
            if (_searchFields[i].key === key) { field = _searchFields[i]; break; }
        }
        if (!field) field = _searchFields[0] || { key: 'ANY', label: 'Any Text', numeric: false };
        let mode = getValue(idx === 0 ? SEARCH_MODE_SELECT_0 : SEARCH_MODE_SELECT_1);
        if (!mode) mode = field.numeric ? 'eq' : 'contains';
        return {
            field: field,
            mode: mode,
            value: getValue(idx === 0 ? SEARCH_FIELD_0 : SEARCH_FIELD_1),
            value2: getValue(idx === 0 ? SEARCH_VALUE2_0 : SEARCH_VALUE2_1),
            caseSensitive: _state.searchIsCaseSensitive === true,
            inverse: _state.searchNegateResult === true
        };
    }

    const SEARCH_STRING_MODES = [
        ['contains', 'contains'], ['starts_with', 'starts with'], ['ends_with', 'ends with'],
        ['whole_word', 'whole word'], ['regex', 'regex']
    ];
    const SEARCH_NUMERIC_MODES = [
        ['eq', 'equals (=)'], ['ne', 'not equal (≠)'], ['lt', 'less than (<)'],
        ['le', 'at most (≤)'], ['gt', 'greater than (>)'], ['ge', 'at least (≥)'], ['range', 'range']
    ];

    // Fill both search-field dropdowns from the loaded tree's available fields,
    // then set up each box's mode menu. Called when a tree is (re)loaded.
    function populateSearchMenus() {
        _searchFields = forester.availableSearchFields(_root);
        [SEARCH_FIELD_SELECT_0, SEARCH_FIELD_SELECT_1].forEach(function (selId) {
            let sel = byId(selId);
            if (!sel) return;
            let prev = sel.value;
            sel.innerHTML = '';
            for (let i = 0; i < _searchFields.length; ++i) {
                let opt = document.createElement('option');
                opt.value = _searchFields[i].key;
                opt.textContent = _searchFields[i].label;
                sel.appendChild(opt);
            }
            if (prev && _searchFields.some(f => f.key === prev)) sel.value = prev;
            else sel.value = 'ANY';
        });
        populateSearchModeMenu(0);
        populateSearchModeMenu(1);
        updateSearchAutocomplete(0);
        updateSearchAutocomplete(1);
    }

    // Fill one box's mode dropdown with the string or numeric modes appropriate to
    // its selected field, keeping a compatible previous choice, and show/hide the
    // range's second value input.
    function populateSearchModeMenu(idx) {
        let field = currentSearchSpec(idx).field;
        let sel = byId(idx === 0 ? SEARCH_MODE_SELECT_0 : SEARCH_MODE_SELECT_1);
        if (!sel) return;
        let prev = sel.value;
        let modes = field.numeric ? SEARCH_NUMERIC_MODES : SEARCH_STRING_MODES;
        sel.innerHTML = '';
        for (let i = 0; i < modes.length; ++i) {
            let opt = document.createElement('option');
            opt.value = modes[i][0];
            opt.textContent = modes[i][1];
            sel.appendChild(opt);
        }
        sel.value = modes.some(m => m[0] === prev) ? prev : modes[0][0];
        updateSearchValue2Visibility(idx);
    }

    function updateSearchValue2Visibility(idx) {
        let el = byId(idx === 0 ? SEARCH_VALUE2_0 : SEARCH_VALUE2_1);
        if (!el) return;
        let mode = getValue(idx === 0 ? SEARCH_MODE_SELECT_0 : SEARCH_MODE_SELECT_1);
        el.style.display = (mode === 'range') ? '' : 'none';
    }

    function onSearchFieldChanged(idx) {
        populateSearchModeMenu(idx); // string<->numeric mode set may change
        updateSearchAutocomplete(idx);
        if (idx === 0) { search0(); } else { search1(); }
    }

    function onSearchModeChanged(idx) {
        updateSearchValue2Visibility(idx);
        updateSearchAutocomplete(idx); // regex mode turns suggestions off
        if (idx === 0) { search0(); } else { search1(); }
    }

    // Populate (or detach) the value box's <datalist> so the browser offers
    // type-ahead value suggestions for specific text fields only.
    function updateSearchAutocomplete(idx) {
        let dlId = idx === 0 ? SEARCH_DATALIST_0 : SEARCH_DATALIST_1;
        let dl = byId(dlId);
        let input = byId(idx === 0 ? SEARCH_FIELD_0 : SEARCH_FIELD_1);
        if (!dl || !input) return;
        let spec = currentSearchSpec(idx);
        let enable = !spec.field.numeric && spec.field.key !== 'ANY' && spec.field.key !== 'MS' && spec.mode !== 'regex';
        dl.innerHTML = '';
        if (!enable) { input.removeAttribute('list'); return; }
        let vals = forester.distinctSearchValues(_root, spec.field, SEARCH_AUTOCOMPLETE_CAP);
        for (let i = 0; i < vals.length; ++i) {
            let opt = document.createElement('option');
            opt.value = vals[i];
            dl.appendChild(opt);
        }
        input.setAttribute('list', dlId);
    }


    function toPhylogram() {
        _state.phylogram = true;
        _state.alignPhylogram = false;
        setDisplayTypeButtons();
        update(null, 0);
    }

    function toAlignedPhylogram() {
        _state.phylogram = true;
        _state.alignPhylogram = true;
        setDisplayTypeButtons();
        update(null, 0);
    }

    function toCladegram() {
        _state.phylogram = false;
        _state.alignPhylogram = false;
        setDisplayTypeButtons();
        update(null, 0);
    }

    function layoutButtonClicked() {
        _state.circularDisplay = getCheckboxValue(LAYOUT_CIRC_BUTTON);
        syncZoomRowButtons();
        zoomToFit();
    }

    // While the circular layout is on, X-/X+ wear the desktop's rotate faces
    // and rotate the display; in the rectangular layout they are the plain
    // horizontal zoom pair. Same buttons, same bindings -- only the face and
    // the meaning change with the layout.
    function syncZoomRowButtons() {
        let minus = byId(ZOOM_OUT_X);
        let plus = byId(ZOOM_IN_X);
        let expandV = byId(ZOOM_TO_EXPAND_Y);
        let fitW = byId(FIT_WIDTH_BUTTON);
        if (!minus || !plus || !expandV || !fitW) {
            return;
        }
        if (_state.circularDisplay) {
            minus.innerHTML = makeGlyph('rotate_ccw');
            minus.title = 'rotate counter-clockwise (Alt+Left or Shift+Alt+mousewheel)';
            plus.innerHTML = makeGlyph('rotate_cw');
            plus.title = 'rotate clockwise (Alt+Right or Shift+Alt+mousewheel)';
            // as on the desktop: no vertical expansion in circular, and the
            // fit-width slot -- redundant with fit there, a circle has just
            // its one diameter -- becomes the label-direction flip. Its face
            // shows the direction a click switches TO, its tooltip the
            // current one.
            expandV.disabled = true;
            fitW.disabled = false;
            fitW.innerHTML = makeGlyph(_radialLabelsHorizontal ? 'labels_radial' : 'labels_horizontal');
            fitW.title = 'node labels: ' + (_radialLabelsHorizontal ? 'horizontal' : 'radial')
                + ' -- click to flip (Alt+W)';
        } else {
            minus.textContent = 'X-';
            minus.title = 'zoom out horizontally (Alt+Left or Shift+Alt+mousewheel)';
            plus.textContent = 'X+';
            plus.title = 'zoom in horizontally (Alt+Right or Shift+Alt+mousewheel)';
            expandV.disabled = false;
            fitW.disabled = false;
            fitW.innerHTML = makeGlyph('fit_width');
            fitW.title = 'fit the tree to the window width, keeping the current vertical zoom (Alt+W)';
        }
    }

    // Toggles alignment of the labels in phylogram mode (bound to the 'L'
    // keyboard shortcut). Alignment only applies to phylograms, so this is a
    // no-op in cladogram mode.
    function toggleAlignPhylogram() {
        if (_state.phylogram) {
            _state.alignPhylogram = !_state.alignPhylogram;
            setDisplayTypeButtons();
            update(null, 0);
        }
    }

    function nodeNameCbClicked() {
        _state.showNodeName = getCheckboxValue(NODE_NAME_CB);
        if (_state.showNodeName) {
            _state.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        search0();
        search1();
        update();
    }


    function customCbClicked(cb_id) {
        if (_nodeLabels) {
            const cb_value = getCheckboxValue(cb_id);
            for (const value of Object.values(_nodeLabels)) {
                if (value.label && value.showButton === true && value.propertyRef && value.description) {
                    if (value.cb_id === cb_id) {
                        value.selected = cb_value;
                    }
                }
            }
            search0();
            search1();
            update();
        }
    }

    function taxonomyCbClicked() {
        _state.showTaxonomy = getCheckboxValue(TAXONOMY_CB);
        if (_state.showTaxonomy) {
            _state.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        search0();
        search1();
        update();
    }

    function sequenceCbClicked() {
        _state.showSequence = getCheckboxValue(SEQUENCE_CB);
        if (_state.showSequence) {
            _state.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        search0();
        search1();
        update();
    }

    function confidenceValuesCbClicked() {
        _state.showConfidenceValues = getCheckboxValue(CONFIDENCE_VALUES_CB);
        search0();
        search1();
        update();
    }

    function branchLengthsCbClicked() {
        _state.showBranchLengthValues = getCheckboxValue(BRANCH_LENGTH_VALUES_CB);
        update();
    }

    function nodeEventsCbClicked() {
        _state.showNodeEvents = getCheckboxValue(NODE_EVENTS_CB);
        search0();
        search1();
        update();
    }

    function branchEventsCbClicked() {
        _state.showBranchEvents = getCheckboxValue(BRANCH_EVENTS_CB);
        search0();
        search1();
        update();
    }

    function internalLabelsCbClicked() {
        _state.showInternalLabels = getCheckboxValue(INTERNAL_LABEL_CB);
        search0();
        search1();
        update();
    }

    function externalLabelsCbClicked() {
        _state.showExternalLabels = getCheckboxValue(EXTERNAL_LABEL_CB);
        search0();
        search1();
        update();
    }

    function visCbClicked() {
        _state.showVisualizations = getCheckboxValue(VIS_CB);
        resetVis();
        update(null, 0);
        update(null, 0);
    }

    function visualStylesCbClicked() {
        _state.useVisualStyles = getCheckboxValue(VISUAL_STYLES_CB);
        resetVis();
        update(null, 0);
    }

    function dynaHideCbClicked() {
        _state.dynahide = getCheckboxValue(DYNAHIDE_CB);
        resetVis();
        search0();
        search1();
        update(null, 0);
        update(null, 0);
    }

    function shortenCbClicked() {
        _state.shortenNodeNames = getCheckboxValue(SHORTEN_NODE_NAME_CB);
        resetVis();
        search0();
        search1();
        update(null, 0);
    }

    function downloadButtonPressed() {
        const s = byId(EXPORT_FORMAT_SELECT);
        if (s) {
            let format = s.value;
            downloadTree(format);
        }
    }

    function submitSelectedPressed() {
        const event = new Event('submit_selected_nodes_event');
        document.dispatchEvent(event);
    }

    function changeBaseBackgoundColor(color) {
        setStylesAll('.' + BASE_BACKGROUND, {
            'fill': color
        });
    }

    function changeBranchWidth(e) {
        _state.branchWidthDefault = getSliderValue(e);
        update(null, 0, true);
    }

    function changeNodeSize(e) {
        _state.nodeSizeDefault = getSliderValue(e);
        update(null, 0, true);
    }


    // One slider, one font size for every label -- external, internal and branch
    // data alike, as the desktop does it.
    function changeFontSize(e) {
        setFontSizes(getSliderValue(e));
        update(null, 0, true);
    }

    function clampFontSize(v) {
        return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, v));
    }

    function setFontSizes(size) {
        size = clampFontSize(size);
        _state.externalNodeFontSize = size;
        _state.internalNodeFontSize = size;
        _state.branchDataFontSize = size;
    }

    function searchOptionsCaseSenstiveCbClicked() {
        _state.searchIsCaseSensitive = getCheckboxValue(SEARCH_OPTIONS_CASE_SENSITIVE_CB);
        search0();
        search1();
    }

    function searchOptionsNegateResultCbClicked() {
        _state.searchNegateResult = getCheckboxValue(SEARCH_OPTIONS_NEGATE_RES_CB);
        search0();
        search1();
    }








    function setRadioButtonValue(id, value) {
        let radio = byId(id);
        if (radio) {
            radio.checked = value;
        }
    }

    function setCheckboxValue(id, value) {
        let cb = byId(id);
        if (cb) {
            cb.checked = value;
        }
    }

    function setSelectMenuValue(id, valueToSelect) {
        const element = document.getElementById(id);
        if (element != null) {
            element.value = valueToSelect;
        }
    }

    function getCheckboxValue(id) {
        let el = byId(id);
        return el ? el.checked : false;
    }

    // Short vanilla alias for document.getElementById, used throughout the UI
    // code in place of the former jQuery `$('#' + id)` selector.
    function byId(id) {
        return document.getElementById(id);
    }

    // Escape text (e.g. from the loaded tree file) for safe use in HTML
    // content and attribute values.
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Like escapeHtml, but keeps the literal <br> line breaks that the node
    // mouseover tooltip and the node-data dialogs use as their only intended
    // markup (everything else, including tree-file text, is escaped).
    function escapeHtmlKeepBreaks(s) {
        return escapeHtml(s).replace(/&lt;br&gt;/g, '<br>');
    }

    // Null-safe value setter/getter. jQuery's $('#'+id).val(v) silently no-ops
    // on a missing element, and .val() returns undefined; these mirror that so
    // controls that only exist conditionally never throw.
    function setValue(id, value) {
        let el = byId(id);
        if (el) {
            el.value = value;
        }
    }

    function getValue(id) {
        let el = byId(id);
        return el ? el.value : '';
    }

    // Appends an <option> (value + HTML label) to a <select> by id. Replaces the
    // former jQuery $('select#id').append($('<option>').val(v).html(t)) chains.
    function addOption(selectId, value, html) {
        let sel = byId(selectId);
        if (sel) {
            let opt = document.createElement('option');
            opt.value = value;
            opt.textContent = html; // option labels are plain text (some tree-derived)
            sel.appendChild(opt);
        }
    }

    // Applies a style object (jQuery .css() style, hyphenated keys) to an
    // element. Numeric values get 'px' appended, matching jQuery's behavior.
    function setStyles(el, styles) {
        if (el) {
            for (let key in styles) {
                let v = styles[key];
                // Accept both hyphenated ('border-color') and camelCase
                // ('borderColor') keys, as jQuery .css() did.
                let prop = key.replace(/[A-Z]/g, function (m) {
                    return '-' + m.toLowerCase();
                });
                el.style.setProperty(prop, typeof v === 'number' ? v + 'px' : v);
            }
        }
    }

    // Applies a style object to every element matching a CSS selector (replaces
    // jQuery $(selector).css({...}) on multi-element / class selectors).
    function setStylesAll(selector, styles) {
        let els = document.querySelectorAll(selector);
        for (let i = 0; i < els.length; ++i) {
            setStyles(els[i], styles);
        }
    }

    // Injects the control-panel stylesheet once. Everything is scoped to the
    // .aptx-panel class (added to the controls containers), styled through CSS
    // custom properties so the light and dark themes share one rule set. This is
    // the modern "refined" skin that replaced the old jQuery-UI look.
    // --- panel light/dark switch ---
    // Is the panel currently dark? Explicit choice wins, else follow the OS.
    function panelDarkActive() {
        if (_panelTheme === 'dark') {
            return true;
        }
        if (_panelTheme === 'light') {
            return false;
        }
        return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    // Icon for the theme the switch would move TO (sun to go light, moon to go dark).
    // The theme switch shows the theme it will switch TO: the sun while dark,
    // the moon while light.
    function panelThemeIcon() {
        return makeGlyph(panelDarkActive() ? 'sun' : 'moon');
    }

    // The tree's colours follow the same light/dark choice as the panel. They
    // live in _state because that is where every renderer reads them from, so
    // switching is a matter of reassigning the three and redrawing.
    function applyTreeTheme() {
        let dark = panelDarkActive();
        _state.backgroundColorDefault = dark ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR_DEFAULT;
        _state.branchColorDefault = dark ? BRANCH_COLOR_DARK : BRANCH_COLOR_DEFAULT;
        _state.labelColorDefault = dark ? LABEL_COLOR_DARK : LABEL_COLOR_DEFAULT;
        // Always white, in both themes: getTreeAsSvg() rewrites the dark label
        // and branch colours to their light counterparts on the way out, so an
        // export can no longer end up as white text on a white ground.
        _state.backgroundColorForPrintExportDefault = BACKGROUND_COLOR_FOR_PRINT_EXPORT_DEFAULT;
        if (!_baseSvg) {
            return; // called before the tree exists; launch applies it later
        }
        changeBaseBackgoundColor(_state.backgroundColorDefault);
        applyOverviewTheme();
        update(null, 0);
    }

    // Apply the current theme choice to every panel and refresh the switch icons.
    function applyPanelTheme() {
        let panels = document.querySelectorAll('.aptx-panel');
        for (let i = 0; i < panels.length; ++i) {
            panels[i].classList.remove('aptx-light', 'aptx-dark');
            if (_panelTheme === 'light' || _panelTheme === 'dark') {
                panels[i].classList.add('aptx-' + _panelTheme);
            }
        }
        let btns = document.querySelectorAll('.aptx-theme-btn');
        for (let i = 0; i < btns.length; ++i) {
            btns[i].innerHTML = panelThemeIcon(); // a drawn glyph, not a text character
        }
        applyTreeTheme();
    }

    function togglePanelTheme() {
        _panelTheme = panelDarkActive() ? 'light' : 'dark';
        try {
            localStorage.setItem('aptx-panel-theme', _panelTheme);
        } catch {
            // localStorage may be unavailable (private mode); the choice just
            // won't persist across reloads.
        }
        applyPanelTheme();
    }

    function loadPanelTheme() {
        try {
            let saved = localStorage.getItem('aptx-panel-theme');
            if (saved === 'light' || saved === 'dark') {
                _panelTheme = saved;
            }
        } catch {
            // ignore
        }
    }

    // ===================== Control-panel glyphs =====================
    // Vector glyphs ported from the desktop Archaeopteryx control panel (its
    // DisplayTypeIcon / ControlButtonIcon / LayoutIcon / ThemeToggleIcon /
    // LadderizeIcon classes), so the two programs' panels read as siblings.
    // The Java geometry is written as fractions of the icon's size, so it
    // transfers verbatim -- same constants, same shapes -- drawn here as inline
    // SVG on a 0..100 viewBox. Glyphs paint in currentColor, so the panel's
    // light/dark tokens apply; a disabled button fades the whole <svg> via
    // opacity, never per-stroke alpha (translucent strokes compound where a
    // shaft crosses its own arrowhead, leaving dark spots).

    let _glyphUid = 0;

    function glyphNum(v) {
        return Math.round(v * 100) / 100;
    }

    function glyphLine(x1, y1, x2, y2) {
        return '<line x1="' + glyphNum(x1) + '" y1="' + glyphNum(y1) + '" x2="' + glyphNum(x2) + '" y2="' + glyphNum(y2) + '"/>';
    }

    function glyphPoly(points) {
        let p = [];
        for (let i = 0; i < points.length; i += 2) {
            p.push(glyphNum(points[i]) + ',' + glyphNum(points[i + 1]));
        }
        return '<polygon points="' + p.join(' ') + '" stroke="none" fill="currentColor"/>';
    }

    function glyphDot(cx, cy, r) {
        return '<circle cx="' + glyphNum(cx) + '" cy="' + glyphNum(cy) + '" r="' + glyphNum(r) + '" stroke="none" fill="currentColor"/>';
    }

    // An arc of the circle (cx,cy,r) from `start` through `sweep` degrees, in
    // the screen convention (y down, so a positive sweep runs clockwise).
    function glyphArc(cx, cy, r, start, sweep) {
        let a0 = start * Math.PI / 180;
        let a1 = (start + sweep) * Math.PI / 180;
        return '<path d="M ' + glyphNum(cx + r * Math.cos(a0)) + ' ' + glyphNum(cy + r * Math.sin(a0))
            + ' A ' + glyphNum(r) + ' ' + glyphNum(r) + ' 0 ' + (Math.abs(sweep) > 180 ? 1 : 0) + ' ' + (sweep > 0 ? 1 : 0)
            + ' ' + glyphNum(cx + r * Math.cos(a1)) + ' ' + glyphNum(cy + r * Math.sin(a1)) + '"/>';
    }

    // A short arrow from (x1,y1) whose head TIP lands exactly on (x2,y2).
    function glyphArrow(x1, y1, x2, y2, head) {
        let a = Math.atan2(y2 - y1, x2 - x1);
        return glyphLine(x1, y1, x2 - Math.cos(a) * head * 0.85, y2 - Math.sin(a) * head * 0.85)
            + glyphPoly([x2, y2,
                x2 - Math.cos(a - 0.62) * head, y2 - Math.sin(a - 0.62) * head,
                x2 - Math.cos(a + 0.62) * head, y2 - Math.sin(a + 0.62) * head]);
    }

    // The display-type glyphs (the former P / A / C): a mini root-left tree PLUS
    // the tip labels it produces, drawn as short ticks past the tips. The three
    // differ in two independent cues -- branches ragged (lengths to scale) or
    // flush, and labels at their own tips or lined up in one column -- so
    // adjacent pairs differ in exactly one cue.
    const GLYPH_DT_ROOT_X = 0.02, GLYPH_DT_SPINE_X = 0.13, GLYPH_DT_SUB_X = 0.30;
    const GLYPH_DT_TIP_Y = [0.13, 0.45, 0.85];
    const GLYPH_DT_UPPER_Y = 0.29, GLYPH_DT_ROOT_Y = 0.57;
    const GLYPH_DT_RAGGED = [0.62, 0.42, 0.26], GLYPH_DT_FLUSH = 0.62;
    const GLYPH_DT_LABEL_GAP = 0.11, GLYPH_DT_LABEL_LEN = 0.22;
    const GLYPH_DT_ASPECT = 1.6; // wider than tall: a tree plus a label column is a wide thing

    function glyphDisplayType(kind) {
        let w = 100 * GLYPH_DT_ASPECT;
        let X = function (f) { return f * w; };
        let Y = function (f) { return f * 100; };
        let flush = (kind === 'cladogram');
        let ends = [flush ? GLYPH_DT_FLUSH : GLYPH_DT_RAGGED[0],
            flush ? GLYPH_DT_FLUSH : GLYPH_DT_RAGGED[1],
            flush ? GLYPH_DT_FLUSH : GLYPH_DT_RAGGED[2]];
        let s = glyphLine(X(GLYPH_DT_ROOT_X), Y(GLYPH_DT_ROOT_Y), X(GLYPH_DT_SPINE_X), Y(GLYPH_DT_ROOT_Y))
            + glyphLine(X(GLYPH_DT_SPINE_X), Y(GLYPH_DT_UPPER_Y), X(GLYPH_DT_SPINE_X), Y(GLYPH_DT_TIP_Y[2]))
            + glyphLine(X(GLYPH_DT_SPINE_X), Y(GLYPH_DT_UPPER_Y), X(GLYPH_DT_SUB_X), Y(GLYPH_DT_UPPER_Y))
            + glyphLine(X(GLYPH_DT_SUB_X), Y(GLYPH_DT_TIP_Y[0]), X(GLYPH_DT_SUB_X), Y(GLYPH_DT_TIP_Y[1]))
            + glyphLine(X(GLYPH_DT_SUB_X), Y(GLYPH_DT_TIP_Y[0]), X(ends[0]), Y(GLYPH_DT_TIP_Y[0]))
            + glyphLine(X(GLYPH_DT_SUB_X), Y(GLYPH_DT_TIP_Y[1]), X(ends[1]), Y(GLYPH_DT_TIP_Y[1]))
            + glyphLine(X(GLYPH_DT_SPINE_X), Y(GLYPH_DT_TIP_Y[2]), X(ends[2]), Y(GLYPH_DT_TIP_Y[2]));
        let aligned = (kind !== 'phylogram');
        for (let i = 0; i < 3; ++i) {
            let lx = aligned ? (GLYPH_DT_FLUSH + GLYPH_DT_LABEL_GAP) : (ends[i] + GLYPH_DT_LABEL_GAP);
            s += glyphLine(X(lx), Y(GLYPH_DT_TIP_Y[i]), X(lx + GLYPH_DT_LABEL_LEN), Y(GLYPH_DT_TIP_Y[i]));
        }
        return s;
    }

    // The rectangular layout, root at left: a mini tree silhouette. Its sibling
    // in the desktop's layout row (which also offers root-at-top / -bottom and
    // an unrooted layout, neither of which this viewer draws).
    const GLYPH_RECT_SEGMENTS = [
        [6, 50, 24, 50],   // root stub
        [24, 24, 24, 76],  // spine
        [24, 24, 52, 24],  // upper branch
        [24, 76, 94, 76],  // lower branch -> tip 3
        [52, 10, 52, 38],  // sub-spine
        [52, 10, 94, 10],  // tip 1
        [52, 38, 94, 38]   // tip 2
    ];

    function glyphRectangular() {
        let s = '';
        for (let i = 0; i < GLYPH_RECT_SEGMENTS.length; ++i) {
            let g = GLYPH_RECT_SEGMENTS[i];
            s += glyphLine(g[0], g[1], g[2], g[3]);
        }
        return s;
    }

    // The circular layout: a two-level circular dendrogram (centre hub, rim arc
    // broken by the root wedge, four radial tips) -- deliberately arc-bearing so
    // it cannot be confused with the sun on the theme toggle.
    function glyphCircular() {
        let s = glyphDot(50, 50, 7.5) + glyphArc(50, 50, 43, 32, 296);
        [75, 150, 225, 300].forEach(function (deg) {
            let a = deg * Math.PI / 180;
            s += glyphLine(50 + Math.cos(a) * 13, 50 + Math.sin(a) * 13, 50 + Math.cos(a) * 43, 50 + Math.sin(a) * 43);
        });
        return s;
    }

    // "Fit everything": a rounded window frame with a two-headed diagonal arrow
    // pushing outward against it.
    // The desktop's rotate pair: an open pivot dot at the centre, a
    // 300-degree orbit arc, and a filled head capping the arc with its tip
    // pointing the way of travel, into the 60-degree gap.
    function glyphRotate(cw) {
        let start = cw ? 170 : 10;
        let sweep = cw ? 300 : -300;
        let term = (start + sweep) * Math.PI / 180;
        let r = 37;
        let len = 26;
        let half = 13;
        let px = 50 + r * Math.cos(term);
        let py = 50 + r * Math.sin(term);
        let t = term + (cw ? Math.PI / 2 : -Math.PI / 2);
        let nx = -Math.sin(t);
        let ny = Math.cos(t);
        return glyphDot(50, 50, 12) + glyphArc(50, 50, r, start, sweep)
            + glyphPoly([px + Math.cos(t) * len, py + Math.sin(t) * len,
                px + nx * half, py + ny * half,
                px - nx * half, py - ny * half]);
    }

    function glyphFitAll() {
        return '<rect x="4" y="4" width="92" height="92" rx="18" ry="18"/>'
            + glyphArrow(55, 55, 84, 84, 20)
            + glyphArrow(45, 45, 16, 16, 20);
    }

    // The desktop's fit-width: the same window-frame as fit, landscape, with
    // two horizontal arrows pushing against its sides.
    function glyphFitWidth() {
        return '<rect x="2" y="17" width="96" height="66" rx="14" ry="14"/>'
            + glyphArrow(45, 50, 12, 50, 20)
            + glyphArrow(55, 50, 88, 50, 20);
    }

    // "Expand to fit labels": the label rows as three short parallel lines with
    // an arrow beyond each outer row pushing the stack apart -- the
    // increase-line-spacing idiom, which is exactly what the button does.
    function glyphExpandVertical() {
        let s = '';
        [-16, 0, 16].forEach(function (off) {
            s += glyphLine(22, 50 + off, 78, 50 + off);
        });
        return s + glyphArrow(50, 28, 50, 1.5, 19) + glyphArrow(50, 72, 50, 98.5, 19);
    }

    // Label direction in the circular layout, drawn as on the desktop: a node
    // (the dot) with its radial spoke, and a thick bar for the label -- either
    // riding the spoke (radial) or lying flat (horizontal). Like the desktop
    // icon it shows the direction a click switches TO.
    function glyphLabelDirection(radial) {
        let ang = -Math.PI / 4;
        let cx = 22, cy = 78, dotR = 10, spoke = 52;
        let sx = cx + Math.cos(ang) * spoke;
        let sy = cy + Math.sin(ang) * spoke;
        let s = glyphDot(cx, cy, dotR)
            + glyphLine(cx + Math.cos(ang) * dotR * 1.6, cy + Math.sin(ang) * dotR * 1.6, sx, sy);
        let bar = 34;
        let b0x, b0y, b1x, b1y;
        if (radial) {
            b0x = cx + Math.cos(ang) * (spoke + 6);
            b0y = cy + Math.sin(ang) * (spoke + 6);
            b1x = cx + Math.cos(ang) * (spoke + 6 + bar);
            b1y = cy + Math.sin(ang) * (spoke + 6 + bar);
        } else {
            b0x = sx + 4;
            b0y = sy;
            b1x = sx + 4 + bar;
            b1y = sy;
        }
        return s + '<line x1="' + glyphNum(b0x) + '" y1="' + glyphNum(b0y) + '" x2="' + glyphNum(b1x)
            + '" y2="' + glyphNum(b1y) + '" stroke-width="17"/>';
    }

    // Back toward the root: an arrow pointing LEFT (in a root-left tree that is
    // literally the direction of the parent clade). With the bar it stops
    // against it reads "all the way back", without it "one step back".
    function glyphBackArrow(toBar) {
        let tip = toBar ? 30 : 14;
        let s = glyphLine(tip + 16, 50, 88, 50)
            + glyphPoly([tip, 50, tip + 26, 28, tip + 26, 72]);
        return toBar ? (s + glyphLine(14, 18, 14, 82)) : s;
    }

    // "Ladderize all": a root spine with branches whose lengths cascade,
    // depicting the ladderized silhouette the next press will produce.
    function glyphLadderize(ascending) {
        let s = glyphLine(14, 6, 14, 94);
        let rows = [8, 36, 64, 92];
        for (let i = 0; i < rows.length; ++i) {
            let frac = ascending ? (i / 3) : (1 - (i / 3));
            s += glyphLine(14, rows[i], 14 + 16 + (frac * 62), rows[i]);
        }
        return s;
    }

    // The theme toggle, showing the theme it will switch TO.
    function glyphSun() {
        let s = glyphDot(50, 50, 20);
        for (let i = 0; i < 8; ++i) {
            let a = i * Math.PI / 4;
            s += glyphLine(50 + Math.cos(a) * 29, 50 + Math.sin(a) * 29, 50 + Math.cos(a) * 43, 50 + Math.sin(a) * 43);
        }
        return s;
    }

    function glyphMoon() {
        let id = 'aptx_moon_' + (++_glyphUid);
        let a = -35 * Math.PI / 180;
        return '<defs><mask id="' + id + '">'
            + '<rect x="0" y="0" width="100" height="100" fill="white"/>'
            + '<circle cx="' + glyphNum(50 + Math.cos(a) * 33) + '" cy="' + glyphNum(50 + Math.sin(a) * 33) + '" r="40" fill="black"/>'
            + '</mask></defs>'
            + '<circle cx="50" cy="50" r="44" stroke="none" fill="currentColor" mask="url(#' + id + ')"/>';
    }

    // Midpoint re-root: the longest tip-to-tip path with its MIDPOINT marked --
    // exactly where this button puts the root. The desktop has no counterpart
    // for this one, so it is drawn to match the ported family's proportions.
    function glyphMidpoint() {
        return glyphLine(12, 50, 88, 50)
            + glyphLine(12, 30, 12, 70)
            + glyphLine(88, 30, 88, 70)
            + glyphDot(50, 50, 11);
    }

    // Build one glyph as an inline <svg>. Stroke weight, caps and joins follow
    // the desktop class each glyph came from.
    function makeGlyph(kind) {
        let w = 100, sw = 7.5, cap = 'butt', join = 'round', body;
        switch (kind) {
            case 'phylogram':
            case 'aligned_phylogram':
            case 'cladogram':
                w = 100 * GLYPH_DT_ASPECT; sw = 6; join = 'miter'; body = glyphDisplayType(kind); break;
            case 'rectangular': cap = 'round'; body = glyphRectangular(); break;
            case 'circular': cap = 'round'; body = glyphCircular(); break;
            case 'fit_all': sw = 6.5; body = glyphFitAll(); break;
            case 'fit_width': sw = 6.5; body = glyphFitWidth(); break;
            case 'rotate_cw': body = glyphRotate(true); break;
            case 'rotate_ccw': body = glyphRotate(false); break;
            case 'expand_vertical': body = glyphExpandVertical(); break;
            case 'labels_radial': body = glyphLabelDirection(true); break;
            case 'labels_horizontal': body = glyphLabelDirection(false); break;
            case 'whole_tree': sw = 11; join = 'miter'; body = glyphBackArrow(true); break;
            case 'up_one_level': sw = 11; join = 'miter'; body = glyphBackArrow(false); break;
            case 'ladderize_asc': sw = 8; cap = 'round'; body = glyphLadderize(true); break;
            case 'ladderize_desc': sw = 8; cap = 'round'; body = glyphLadderize(false); break;
            case 'midpoint': sw = 8; cap = 'round'; body = glyphMidpoint(); break;
            case 'sun': body = glyphSun(); break;
            case 'moon': body = glyphMoon(); break;
            default: throw new Error('unknown control-panel glyph: ' + kind);
        }
        return '<svg class="aptx-glyph" viewBox="0 0 ' + w + ' 100" aria-hidden="true" focusable="false"'
            + ' fill="none" stroke="currentColor" stroke-width="' + sw + '"'
            + ' stroke-linecap="' + cap + '" stroke-linejoin="' + join + '">' + body + '</svg>';
    }

    function injectPanelStyles() {
        loadPanelTheme();
        if (document.getElementById(PANEL_STYLE_ID)) {
            return;
        }
        // Dark palette tokens, shared by the system-preference default and the
        // explicit "dark" choice from the header light/dark switch.
        let dark = '  --p-bg:rgba(24,35,46,0.86); --p-ink:#e7eef5; --p-muted:#94a4b3; --p-faint:#6f8090;'
            + '  --p-line:#27343f; --p-line-strong:#35434f; --p-surface2:#202d38;'
            + '  --p-accent:#57a6ff; --p-accent-ink:#9cc7ff; --p-accent-weak:rgba(87,166,255,0.18);'
            + '  --p-shadow-sm:0 1px 2px rgba(0,0,0,0.4);';
        let css = ''
            + '.aptx-panel {'
            + '  --p-bg: rgba(255,255,255,0.86); --p-ink:#1e2a35; --p-muted:#6b7a89; --p-faint:#93a3b2;'
            + '  --p-line:#e3e9f0; --p-line-strong:#cad6e1; --p-surface2:#f3f6fa;'
            + '  --p-accent:#2f83f2; --p-accent-ink:#1c5fbf; --p-accent-weak:rgba(47,131,242,0.12);'
            + '  --p-shadow-sm:0 1px 2px rgba(23,34,46,0.12);'
            + '  box-sizing:border-box; width:' + PANEL_WIDTH + 'px;'
            + '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
            + '  font-size:11px; line-height:1.42; color:var(--p-ink); background:var(--p-bg);'
            // A SMALL backdrop blur: enough to push the tree behind the panel
            // into the background, not enough to erase it. The radius has to
            // stay well under the size of what should still read through --
            // one-pixel branches and 11px labels. Compared side by side over a
            // dense tree: 1px leaves the labels behind sharp enough to compete
            // with the panel's own, 3px flattens them away entirely (8px, which
            // this used to be, made the panel look solid at any alpha), and 2px
            // keeps the branches and the shape of the labels while clearly
            // putting them behind glass.
            + '  -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px);'
            + '  border:1px solid var(--p-line-strong); border-radius:12px;'
            + '  box-shadow:0 12px 30px -12px rgba(23,34,46,0.32),0 2px 6px -2px rgba(23,34,46,0.14);'
            + '  overflow:hidden; }'
            + '.aptx-panel * { box-sizing:border-box; }'
            + '@media (prefers-color-scheme:dark){ .aptx-panel:not(.aptx-light):not(.aptx-dark) {' + dark + '} }'
            + '.aptx-panel.aptx-dark {' + dark + '}'
            // The node menu is a separate overlay (it cannot live inside the
            // panel), so it carries its own copy of the palette and follows the
            // same light / dark rules.
            + '.aptx-node-menu {'
            + '  --p-bg: rgba(255,255,255,0.97); --p-ink:#1e2a35; --p-muted:#6b7a89; --p-faint:#93a3b2;'
            + '  --p-line:#e3e9f0; --p-line-strong:#cad6e1; --p-surface2:#f3f6fa;'
            + '  --p-accent:#2f83f2; --p-accent-ink:#1c5fbf; --p-accent-weak:rgba(47,131,242,0.12);'
            + '}'
            + '@media (prefers-color-scheme:dark){ .aptx-node-menu:not(.aptx-light):not(.aptx-dark) {' + dark + '} }'
            + '.aptx-node-menu.aptx-dark {' + dark + '}'
            // The menu itself: fixed 11px type, so it does NOT scale with the
            // tree's zoom the way the old svg-drawn menu did.
            + '.aptx-node-menu { position:absolute; z-index:1000; min-width:196px; max-width:280px; padding:4px;'
            + '  box-sizing:border-box; border:1px solid var(--p-line-strong); border-radius:10px;'
            + '  background:var(--p-bg); color:var(--p-ink);'
            + '  -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);'
            + '  box-shadow:0 12px 30px -12px rgba(23,34,46,0.42),0 2px 6px -2px rgba(23,34,46,0.2);'
            + '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
            + '  font-size:11px; line-height:1.45; }'
            + '.aptx-node-menu-title { padding:5px 9px 6px; font-size:9px; font-weight:700; letter-spacing:0.07em;'
            + '  text-transform:uppercase; color:var(--p-faint); border-bottom:1px solid var(--p-line);'
            + '  margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
            + '.aptx-node-menu button { display:block; width:100%; text-align:left; margin:0; padding:5px 9px;'
            + '  border:0; border-radius:6px; background:transparent; color:var(--p-ink); font:inherit;'
            + '  cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;'
            + '  transition:background .1s,color .1s; }'
            + '.aptx-node-menu button:hover, .aptx-node-menu button:focus-visible {'
            + '  background:var(--p-accent); color:#fff; outline:none; }'
            + '.aptx-node-menu button.aptx-menu-danger:hover, .aptx-node-menu button.aptx-menu-danger:focus-visible {'
            + '  background:#e5484d; color:#fff; }'
            + '.aptx-node-menu hr { border:0; border-top:1px solid var(--p-line); margin:3px 4px; }'
            // The node-data dialog, on the same palette as the panel and the menu.
            + '.aptx-dialog {'
            + '  --p-bg: rgba(255,255,255,0.98); --p-ink:#1e2a35; --p-muted:#6b7a89; --p-faint:#93a3b2;'
            + '  --p-line:#e3e9f0; --p-line-strong:#cad6e1; --p-surface2:#f3f6fa;'
            + '  --p-accent:#2f83f2; --p-accent-ink:#1c5fbf; --p-accent-weak:rgba(47,131,242,0.12);'
            + '}'
            + '@media (prefers-color-scheme:dark){ .aptx-dialog:not(.aptx-light):not(.aptx-dark) {' + dark + '} }'
            + '.aptx-dialog.aptx-dark {' + dark + '}'
            + '.aptx-dialog { padding:0; border:1px solid var(--p-line-strong); border-radius:12px;'
            + '  background:var(--p-bg); color:var(--p-ink); max-width:92vw;'
            + '  box-shadow:0 24px 48px -16px rgba(23,34,46,0.45),0 4px 12px -4px rgba(23,34,46,0.22);'
            + '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
            + '  font-size:11.5px; line-height:1.5; }'
            + '.aptx-dialog::backdrop { background:rgba(15,23,32,0.34); }'
            + '.aptx-dialog-title { display:flex; align-items:center; gap:8px; padding:9px 10px 9px 13px;'
            + '  border-bottom:1px solid var(--p-line); font-weight:600; }'
            + '.aptx-dialog-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
            + '.aptx-dialog-close { margin-left:auto; flex:none; width:22px; height:22px; display:grid;'
            + '  place-items:center; padding:0; border:1px solid transparent; border-radius:6px;'
            + '  background:transparent; color:var(--p-muted); font:inherit; line-height:1; cursor:pointer; }'
            + '.aptx-dialog-close:hover { background:var(--p-accent-weak); color:var(--p-accent-ink);'
            + '  border-color:var(--p-accent); }'
            + '.aptx-dialog-body { padding:10px 13px 12px; overflow:auto; }'
            + '.aptx-dialog-head { margin:10px 0 3px; font-size:9px; font-weight:700; letter-spacing:0.07em;'
            + '  text-transform:uppercase; color:var(--p-faint); }'
            + '.aptx-dialog-body > .aptx-dialog-head:first-child { margin-top:0; }'
            + '.aptx-dialog-line { display:flex; gap:8px; padding:2px 0; }'
            + '.aptx-dialog-line + .aptx-dialog-line { border-top:1px solid var(--p-line); }'
            + '.aptx-dialog-key { flex:0 0 42%; color:var(--p-muted); }'
            + '.aptx-dialog-val { flex:1 1 auto; min-width:0; overflow-wrap:anywhere; }'
            + '.aptx-dialog-mono { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Courier New",monospace;'
            + '  font-size:11px; white-space:pre-wrap; overflow-wrap:anywhere; }'
            // The hover tooltip, on the same palette.
            + '.aptx-tip {'
            + '  --p-bg: rgba(255,255,255,0.97); --p-ink:#1e2a35; --p-muted:#6b7a89; --p-faint:#93a3b2;'
            + '  --p-line:#e3e9f0; --p-line-strong:#cad6e1;'
            + '}'
            + '@media (prefers-color-scheme:dark){ .aptx-tip:not(.aptx-light):not(.aptx-dark) {' + dark + '} }'
            + '.aptx-tip.aptx-dark {' + dark + '}'
            // width:max-content so rows size to their content instead of wrapping
            // in a box narrower than the text (capped, for very long values)
            + '.aptx-tip { position:absolute; pointer-events:none; z-index:900;'
            + '  width:max-content; max-width:320px;'
            + '  padding:7px 10px; border:1px solid var(--p-line-strong); border-radius:8px;'
            + '  background:var(--p-bg); color:var(--p-ink);'
            + '  -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);'
            + '  box-shadow:0 8px 20px -8px rgba(23,34,46,0.4),0 2px 5px -2px rgba(23,34,46,0.2);'
            + '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
            + '  font-size:11px; line-height:1.45; text-align:left; }'
            + '.aptx-tip .aptx-dialog-head { margin:7px 0 2px; }'
            + '.aptx-tip .aptx-dialog-head:first-child { margin-top:0; }'
            + '.aptx-tip .aptx-dialog-line { padding:1px 0; }'
            + '.aptx-tip .aptx-dialog-line + .aptx-dialog-line { border-top:0; }'
            + '.aptx-tip .aptx-dialog-key { flex:0 0 auto; min-width:96px; }'
            + '.aptx-panel .' + PROG_NAME + ' { display:flex; align-items:center; gap:8px; padding:9px 12px; border-bottom:1px solid var(--p-line); font-weight:600; letter-spacing:-0.01em; }'
            + '.aptx-panel .' + PROGNAMELINK + ',.aptx-panel .' + PROGNAMELINK + ':link,.aptx-panel .' + PROGNAMELINK + ':visited { color:var(--p-accent-ink); text-decoration:none; font-size:12px; border:0; }'
            + '.aptx-panel .' + PROGNAMELINK + ' { background:none; padding:0; margin:0; cursor:pointer;'
            + '  font-family:inherit; font-weight:inherit; letter-spacing:inherit; }'
            + '.aptx-panel .' + PROGNAMELINK + ':hover { text-decoration:underline; }'
            + '.aptx-dialog-body.aptx-about { padding-top:13px; }'
            // the label column is narrower here than for node data: these values
            // are URLs, and they should not have to wrap mid-word
            + '.aptx-about .aptx-dialog-key { flex-basis:31%; }'
            + '.aptx-about-head { display:flex; align-items:center; gap:12px; margin-bottom:10px; }'
            + '.aptx-about-logo { flex:none; width:56px; height:56px; }'
            + '.aptx-about-logo svg { width:100%; height:100%; display:block; }'
            + '.aptx-about-name { font-size:15px; font-weight:650; letter-spacing:-0.01em; }'
            + '.aptx-about-version { color:var(--p-muted); }'
            + '.aptx-about-blurb { margin:0 0 11px; color:var(--p-muted); }'
            + '.aptx-about .aptx-dialog-val a,.aptx-about .aptx-dialog-val a:link,'
            + '.aptx-about .aptx-dialog-val a:visited { color:var(--p-accent-ink); text-decoration:none; }'
            + '.aptx-about .aptx-dialog-val a:hover { text-decoration:underline; }'
            // Tree name + description: clamped to a few lines with the full text
            // in a tooltip (click toggles the clamp). overflow-wrap:anywhere
            // guarantees even an unbroken string can never widen the panel.
            + '.aptx-panel .' + TREE_DESC + ' { min-width:0; }'
            + '.aptx-panel .' + TREE_DESC + '.aptx-clampable { cursor:pointer; }'
            + '.aptx-panel .' + TREE_DESC + '.aptx-clampable:focus-visible { outline:2px solid var(--p-accent); outline-offset:2px; border-radius:3px; }'
            + '.aptx-panel .' + TREE_DESC + ' .aptx-tree-name { font-weight:600; font-size:11.5px; line-height:1.35; color:var(--p-ink); overflow-wrap:anywhere; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; }'
            + '.aptx-panel .' + TREE_DESC + ' .aptx-tree-descr { margin-top:3px; font-size:10px; line-height:1.45; color:var(--p-muted); overflow-wrap:anywhere; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; }'
            + '.aptx-panel .' + TREE_DESC + '.aptx-expanded .aptx-tree-name, .aptx-panel .' + TREE_DESC + '.aptx-expanded .aptx-tree-descr { display:block; -webkit-line-clamp:unset; overflow:visible; }'
            + '.aptx-panel .aptx-panel-title { font-size:12px; }'
            + '.aptx-panel fieldset { border:0; border-top:1px solid var(--p-line); margin:0; padding:9px 12px; min-width:0; }'
            + '.aptx-panel legend { float:none; width:auto; padding:0; margin:0 0 7px; font-size:9px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:var(--p-faint); }'
            + '.aptx-panel label { cursor:pointer; }'
            + '.aptx-panel input[type=checkbox],.aptx-panel input[type=radio] { accent-color:var(--p-accent); width:13px; height:13px; vertical-align:-2px; margin:0 4px 0 0; }'
            // checkbox/radio + label as one item (used by the Display Data grid and the inline P/A/C and search-option rows)
            + '.aptx-panel .aptx-check { display:flex; align-items:center; gap:6px; cursor:pointer; min-width:0; }'
            + '.aptx-panel .aptx-check > input { margin:0; flex:none; }'
            + '.aptx-panel .aptx-check > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
            + '.aptx-panel .aptx-checkgrid { display:grid; grid-template-columns:1fr 1fr; gap:5px 10px; }'
            + '.aptx-panel .aptx-checkgrid .aptx-check { font-size:9px; }'
            + '.aptx-panel .aptx-checkgrid .aptx-check-wide { grid-column:1 / -1; }'
            + '.aptx-panel .aptx-subhead { margin:9px 0 4px; font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:var(--p-faint); }'
            + '.aptx-panel .aptx-fieldset-body > .aptx-subhead:first-child { margin-top:0; }'
            + '.aptx-panel .' + SEARCH_OPTIONS_GROUP + ' { display:flex; flex-wrap:wrap; align-items:center; gap:6px 14px; }'
            + '.aptx-panel .' + SEARCH_OPTIONS_GROUP + ' { margin-top:9px; }'
            + '.aptx-panel .aptx-field-label { display:block; margin:8px 0 3px; font-size:10px; color:var(--p-muted); }'
            + '.aptx-panel .aptx-search-row { display:flex; align-items:center; gap:6px; margin-bottom:2px; }'
            + '.aptx-panel .aptx-search-row input[type=text] { flex:1 1 auto; min-width:0; height:26px; }'
            + '.aptx-panel .aptx-search-row input[type=button] { flex:none; height:26px; width:26px; padding:0; margin:0; }'
            + '.aptx-panel .aptx-search-menus { display:flex; flex-direction:column; gap:4px; margin:2px 0 3px; }'
            + '.aptx-panel .aptx-search-menus select { width:100%; min-width:0; height:26px; font:inherit; }'
            // red cue for an unmatchable query (bad regex / non-number); box-shadow, since the value boxes carry an inline outline:none
            + '.aptx-panel .aptx-search-invalid { box-shadow:0 0 0 2px #e5484d; border-color:#e5484d; }'
            + '.aptx-panel .aptx-combine { display:flex; align-items:center; gap:8px; margin:6px 0 2px; }'
            + '.aptx-panel .aptx-combine .aptx-field-label { margin:0; flex:none; }'
            + '.aptx-panel .aptx-combine select { flex:1 1 auto; min-width:0; height:26px; font:inherit; }'
            // the two segmented controls: display type (phylogram / aligned /
            // cladogram) and layout (rectangular / circular)
            + '.aptx-panel .aptx-modebar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }'
            + '.aptx-panel .aptx-segmented { display:inline-flex; border:1px solid var(--p-line-strong); border-radius:7px; overflow:hidden; }'
            + '.aptx-panel .aptx-seg { display:flex; align-items:center; justify-content:center; min-width:24px; padding:3px 8px; font-size:11px; font-weight:600; color:var(--p-muted); background:var(--p-surface2); cursor:pointer; border-right:1px solid var(--p-line-strong); transition:background .12s,color .12s; }'
            + '.aptx-panel .aptx-seg:last-child { border-right:0; }'
            + '.aptx-panel .aptx-seg > input { position:absolute; width:0; height:0; opacity:0; margin:0; pointer-events:none; }'
            + '.aptx-panel .aptx-seg:hover { color:var(--p-accent-ink); background:var(--p-accent-weak); }'
            + '.aptx-panel .aptx-seg:has(> input:checked) { background:var(--p-accent); color:#fff; }'
            + '.aptx-panel .aptx-seg:has(> input:disabled) { opacity:0.4; cursor:default; }'
            + '.aptx-panel .aptx-actions { margin-left:auto; display:flex; align-items:center; gap:5px; }'
            + '.aptx-panel .aptx-theme-btn { flex:none; width:20px; height:20px; display:grid; place-items:center; padding:0; border:1px solid var(--p-line-strong); border-radius:6px; background:var(--p-surface2); color:var(--p-muted); cursor:pointer; font-size:12px; line-height:1; }'
            + '.aptx-panel .aptx-theme-btn:hover { background:var(--p-accent-weak); color:var(--p-accent-ink); border-color:var(--p-accent); }'
            + '.aptx-panel input[type=range] { -webkit-appearance:none; appearance:none; display:block; width:100%; height:15px; margin:2px 0 9px; padding:0; background:transparent; cursor:pointer; }'
            + '.aptx-panel input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:999px; background:var(--p-line-strong); }'
            + '.aptx-panel input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:13px; height:13px; margin-top:-4.5px; border-radius:50%; background:var(--p-accent); border:2px solid var(--p-bg); box-shadow:var(--p-shadow-sm); }'
            + '.aptx-panel input[type=range]::-moz-range-track { height:4px; border-radius:999px; background:var(--p-line-strong); }'
            + '.aptx-panel input[type=range]::-moz-range-thumb { width:13px; height:13px; border-radius:50%; background:var(--p-accent); border:2px solid var(--p-bg); box-shadow:var(--p-shadow-sm); }'
            + '.aptx-panel input[type=button], .aptx-panel .aptx-gbtn { font-family:inherit; font-size:11px; height:24px; color:var(--p-ink); background:var(--p-surface2); border:1px solid var(--p-line-strong); border-radius:6px; margin:2px 3px 2px 0; cursor:pointer; transition:background .12s,border-color .12s,color .12s; }'
            + '.aptx-panel input[type=button]:hover, .aptx-panel .aptx-gbtn:hover { background:var(--p-accent-weak); border-color:var(--p-accent); color:var(--p-accent-ink); }'
            + '.aptx-panel input[type=button]:disabled, .aptx-panel .aptx-gbtn:disabled { opacity:0.4; cursor:default; }'
            // Glyph buttons: same chrome as the lettered ones, sized around the
            // drawn glyph. The glyph inherits the button's colour (currentColor)
            // and a disabled button fades the whole svg with the button chrome.
            + '.aptx-panel .aptx-gbtn { display:inline-flex; align-items:center; justify-content:center; min-width:32px; padding:0 7px; vertical-align:middle; }'
            + '.aptx-panel .aptx-zoomgrid { display:flex; flex-direction:column; align-items:stretch; }'
            + '.aptx-panel .aptx-zoomgrid > input[type=button] { width:100%; margin-right:0; }'
            + '.aptx-panel .aptx-zoomrow { display:flex; }'
            + '.aptx-panel .aptx-zoomrow .aptx-gbtn { flex:1 1 0; padding:0; }'
            + '.aptx-panel .aptx-zoomrow .aptx-gbtn:last-child { margin-right:0; }'
            + '.aptx-panel .aptx-glyph { height:14px; width:auto; display:block; overflow:visible; }'
            + '.aptx-panel .aptx-seg .aptx-glyph { height:13px; }'
            + '.aptx-panel input[type=text],.aptx-panel select { font-family:inherit; font-size:11px; color:var(--p-ink); background:var(--p-surface2); border:1px solid var(--p-line-strong); border-radius:6px; max-width:100%; padding:3px 6px; }'
            + '.aptx-panel input[type=text]:focus,.aptx-panel select:focus { outline:none; border-color:var(--p-accent); box-shadow:0 0 0 3px var(--p-accent-weak); }'
            // --- collapsible sections, internal scroll, whole-panel hide ---
            // the panel is a child of the tree's container now, so it can be held
            // to that container's height rather than the whole viewport's
            + '.aptx-panel { display:flex; flex-direction:column; max-height:calc(100% - 20px); }'
            + '.aptx-panel > .aptx-body { overflow-y:auto; overflow-x:hidden; min-height:0; }'
            + '.aptx-panel > .aptx-body::-webkit-scrollbar { width:9px; }'
            + '.aptx-panel > .aptx-body::-webkit-scrollbar-thumb { background:var(--p-line-strong); border-radius:9px; border:2px solid var(--p-bg); }'
            + '.aptx-panel legend.aptx-legend-toggle { display:flex; align-items:center; width:100%; cursor:pointer; }'
            + '.aptx-panel legend.aptx-legend-toggle::after { content:"\\25BE"; margin-left:auto; font-size:12px;'
            + '  line-height:1; color:var(--p-muted); transition:transform .15s,color .15s; }'
            + '.aptx-panel legend.aptx-legend-toggle:hover::after { color:var(--p-accent-ink); }'
            + '.aptx-panel legend.aptx-legend-toggle:hover { color:var(--p-accent-ink); }'
            + '.aptx-panel #' + EXPORT_FORMAT_SELECT + ' { margin-left:6px; }'
            + '.aptx-panel fieldset.aptx-collapsed > legend.aptx-legend-toggle::after { transform:rotate(-90deg); }'
            + '.aptx-panel fieldset.aptx-collapsed > legend { margin-bottom:0; }'
            + '.aptx-panel fieldset.aptx-collapsed > .aptx-fieldset-body { display:none; }'
            + '.aptx-panel .aptx-hide-btn { flex:none; width:20px; height:20px; display:grid; place-items:center; padding:0; border:1px solid var(--p-line-strong); border-radius:6px; background:var(--p-surface2); color:var(--p-muted); cursor:pointer; font-size:15px; line-height:1; }'
            + '.aptx-panel .aptx-hide-btn:hover { background:var(--p-accent-weak); color:var(--p-accent-ink); border-color:var(--p-accent); }'
            + '.aptx-panel.aptx-hidden > .aptx-body { display:none; }'
            + '.aptx-panel.aptx-hidden > .' + PROG_NAME + ' { border-bottom:0; }';
        let style = document.createElement('style');
        style.id = PANEL_STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Post-processes a control panel once: moves its sections into a scrolling
    // body under the fixed header, adds a hide/show toggle to the header, and
    // makes each titled section (a fieldset with a legend) collapse on click.
    // Together these keep the panel from running off the screen and let it be
    // folded away entirely.
    function enhancePanel(panel, title) {
        if (!panel || panel.dataset.aptxEnhanced) {
            return;
        }
        panel.dataset.aptxEnhanced = '1';

        let header = panel.querySelector('.' + PROG_NAME);

        // Panels without their own header (the legend/visualization panel) get
        // one built from the given title, so they gain the same header bar and
        // hide button as the main control panel.
        if (!header && title) {
            header = document.createElement('div');
            header.className = PROG_NAME;
            let titleEl = document.createElement('span');
            titleEl.className = 'aptx-panel-title';
            titleEl.textContent = title;
            header.appendChild(titleEl);
            panel.insertBefore(header, panel.firstChild);
        }

        // Move everything after the header into a scrolling body.
        let body = document.createElement('div');
        body.className = 'aptx-body';
        let node = header ? header.nextSibling : panel.firstChild;
        while (node) {
            let next = node.nextSibling;
            body.appendChild(node);
            node = next;
        }
        panel.appendChild(body);

        // Header actions: the light/dark switch (main panel only) and the
        // whole-panel hide/show toggle, grouped at the right of the header.
        if (header) {
            let actions = document.createElement('div');
            actions.className = 'aptx-actions';

            let progName = header.querySelector('.' + PROGNAMELINK);
            if (progName) {
                // Clicking the title used to navigate away to the project site;
                // it opens the About box, which links there among other places.
                progName.addEventListener('click', function (e) {
                    e.stopPropagation();
                    showAboutDialog();
                });

                let themeBtn = document.createElement('button');
                themeBtn.type = 'button';
                themeBtn.className = 'aptx-theme-btn';
                themeBtn.title = 'Switch between light and dark';
                themeBtn.innerHTML = panelThemeIcon();
                themeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    togglePanelTheme();
                });
                actions.appendChild(themeBtn);
            }

            let toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'aptx-hide-btn';
            toggle.title = 'Hide / show the controls';
            toggle.textContent = '–';
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                let hidden = panel.classList.toggle('aptx-hidden');
                toggle.textContent = hidden ? '+' : '–';
            });
            actions.appendChild(toggle);

            header.appendChild(actions);
        }

        // Collapsible sections: wrap each titled fieldset's content in a body
        // element (so collapsing hides everything under the legend, including
        // bare text labels like the slider captions) and toggle it via the legend.
        let fieldsets = body.querySelectorAll('fieldset');
        for (let i = 0; i < fieldsets.length; ++i) {
            let fieldset = fieldsets[i];
            let legend = fieldset.querySelector('legend');
            if (!legend) {
                continue;
            }
            let fsBody = document.createElement('div');
            fsBody.className = 'aptx-fieldset-body';
            let n = legend.nextSibling;
            while (n) {
                let next = n.nextSibling;
                fsBody.appendChild(n);
                n = next;
            }
            fieldset.appendChild(fsBody);
            legend.classList.add('aptx-legend-toggle');
            legend.addEventListener('click', function () {
                fieldset.classList.toggle('aptx-collapsed');
            });
        }

        // Apply the current light/dark choice to this (and every) panel.
        applyPanelTheme();
    }

    // Safely binds an event handler to an element by id (replaces jQuery
    // $('#' + id).click/.on/.bind/.mousedown/.keyup(...)). A missing element is
    // a no-op, matching jQuery's behavior on an empty selection.
    function on(id, evt, handler) {
        let el = byId(id);
        if (el) {
            el.addEventListener(evt, handler);
        }
    }

    // Press-and-hold binding for a button by id (replaces jQuery
    // $('#' + id).mousedown(down).bind('mouseup mouseleave', up)): the down
    // handler fires on press, the up handler on release or when the pointer
    // leaves the button.
    function onHold(id, downHandler, upHandler) {
        let el = byId(id);
        if (el) {
            el.addEventListener('mousedown', downHandler);
            el.addEventListener('mouseup', upHandler);
            el.addEventListener('mouseleave', upHandler);
            // Keyboard activation: Enter or Space raises a click with detail 0
            // (a real mouse click carries a click count). One step per press,
            // no repeat -- and the mouse path never reaches this.
            el.addEventListener('click', function (event) {
                if (event.detail === 0) {
                    downHandler();
                    upHandler();
                }
            });
        }
    }

    // Maps a d3 v3 symbol-type name (string) to a d3 v7 symbol-type constant.
    // v7 dropped the separate up/down triangles, so both map to symbolTriangle.
    function d3SymbolType(shapeName) {
        switch (shapeName) {
            case 'square':
                return d3.symbolSquare;
            case 'diamond':
                return d3.symbolDiamond;
            case 'triangle-up':
            case 'triangle-down':
            case 'triangle':
                return d3.symbolTriangle;
            case 'cross':
                return d3.symbolCross;
            case 'star':
                return d3.symbolStar;
            case 'wye':
                return d3.symbolWye;
            case 'circle':
            default:
                return d3.symbolCircle;
        }
    }

    function getSliderValue(e) {
        return parseFloat(e.target.value);
    }

    function setSliderValue(id, value) {
        let el = document.getElementById(id);
        if (el) {
            el.value = value;
        }
    }

    // Initializes a native range input (replaces the former jQuery UI slider).
    // The 'input' event fires continuously while dragging, covering what jQuery
    // UI split into its 'slide' and 'change' callbacks.
    function initSlider(id, min, max, step, value, onInput) {
        let el = document.getElementById(id);
        if (el) {
            el.min = min;
            el.max = max;
            el.step = step;
            el.value = value;
            el.addEventListener('input', onInput);
        }
    }

    // Shows a modal popup with the given HTML content (replaces the former
    // jQuery UI dialog used for the node/sequence data popups). Only one such
    // dialog exists at a time; opening a new one removes the previous. Uses the
    // native <dialog> element, so Escape and the close button both dismiss it.
    // With mono set the body is shown as a preformatted monospaced block, which
    // is what a FASTA sequence needs; otherwise it is laid out as label/value.
    // Content arrives as "Label: value" lines separated by <br>. Setting the
    // label part apart makes a wall of such lines scannable. Lines without a
    // label (a heading like "Taxonomy", or a FASTA sequence) are left alone.
    function markUpDataLabels(escaped) {
        return escaped.split('<br>').map(function (line) {
            if (!line.trim()) {
                return '';
            }
            let m = /^(\s*-*\s*[^:<]{1,40}?):\s(.*)$/.exec(line);
            if (!m) {
                // no label: a section heading such as "Taxonomy" or "Sequence"
                return '<div class="aptx-dialog-head">' + line.trim() + '</div>';
            }
            // the source marks sub-entries with leading dashes; the layout shows
            // that relationship now, so the dashes only add noise
            let key = m[1].replace(/^[\s-]+/, '');
            return '<div class="aptx-dialog-line"><span class="aptx-dialog-key">' + key
                + '</span><span class="aptx-dialog-val">' + m[2] + '</span></div>';
        }).join('');
    }

    // The shell every modal shares: title bar with a close button, a body, the
    // panel's light/dark choice, and removal on close. Returns the body for the
    // caller to fill. Only one dialog of a given id exists at a time.
    function makeDialogShell(id, title, width) {
        let existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
        let dialog = document.createElement('dialog');
        dialog.id = id;
        dialog.className = 'aptx-dialog';
        if (_panelTheme) {
            dialog.classList.add('aptx-' + _panelTheme); // follow the panel's light/dark choice
        }
        dialog.style.width = width + 'px';

        let titlebar = document.createElement('div');
        titlebar.className = 'aptx-dialog-title';
        let name = document.createElement('span');
        name.className = 'aptx-dialog-name';
        name.textContent = title;
        titlebar.appendChild(name);

        let closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'aptx-dialog-close';
        closeButton.title = 'Close';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', function () {
            dialog.close();
        });
        titlebar.appendChild(closeButton);

        let body = document.createElement('div');
        body.className = 'aptx-dialog-body';

        dialog.appendChild(titlebar);
        dialog.appendChild(body);
        document.body.appendChild(dialog);
        dialog.addEventListener('close', function () {
            dialog.remove();
        });
        return {dialog: dialog, body: body};
    }

    function showNodeDataDialog(title, htmlContent, mono, width, height) {
        let shell = makeDialogShell(NODE_DATA, title, width);
        if (mono) {
            shell.body.classList.add('aptx-dialog-mono');
        }
        // htmlContent is built from tree-file text with <br> separators; escape
        // everything else so a crafted name / property value cannot inject markup.
        let escaped = escapeHtmlKeepBreaks(htmlContent);
        shell.body.innerHTML = mono ? escaped : markUpDataLabels(escaped);
        shell.body.style.maxHeight = height + 'px';
        shell.dialog.showModal();
    }

    // The About box behind the panel's title. Everything here is fixed text and
    // fixed URLs -- no tree data reaches it -- so the links are built as real
    // elements rather than markup.
    function showAboutDialog() {
        let shell = makeDialogShell(ABOUT_DIALOG, 'About', 380);
        shell.body.classList.add('aptx-about');

        let head = document.createElement('div');
        head.className = 'aptx-about-head';
        let logo = document.createElement('div');
        logo.className = 'aptx-about-logo';
        logo.innerHTML = ARCHAEOPTERYX_LOGO_SVG;
        head.appendChild(logo);

        let titles = document.createElement('div');
        let n = document.createElement('div');
        n.className = 'aptx-about-name';
        n.textContent = NAME;
        let v = document.createElement('div');
        v.className = 'aptx-about-version';
        v.textContent = 'Version ' + VERSION;
        titles.appendChild(n);
        titles.appendChild(v);
        head.appendChild(titles);
        shell.body.appendChild(head);

        let blurb = document.createElement('p');
        blurb.className = 'aptx-about-blurb';
        blurb.textContent = 'Visualization and analysis of highly annotated phylogenetic trees.';
        shell.body.appendChild(blurb);

        [['Website', WEBSITE, 'cmzmasek.github.io/archaeopteryx-js'],
            ['Desktop version', DESKTOP_WEBSITE, 'cmzmasek.github.io/archaeopteryx'],
            ['Source code', SOURCE_WEBSITE, 'github.com/cmzmasek/archaeopteryx-js'],
            ['License', LICENSE_WEBSITE, LICENSE_NAME]].forEach(function (row) {
            let line = document.createElement('div');
            line.className = 'aptx-dialog-line';
            let key = document.createElement('span');
            key.className = 'aptx-dialog-key';
            key.textContent = row[0];
            let val = document.createElement('span');
            val.className = 'aptx-dialog-val';
            let a = document.createElement('a');
            a.href = row[1];
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = row[2];
            val.appendChild(a);
            line.appendChild(key);
            line.appendChild(val);
            shell.body.appendChild(line);
        });

        shell.dialog.showModal();
    }

    // Makes an element draggable within its offset parent using pointer events
    // (replaces jQuery UI .draggable({containment: 'parent'})). The element is
    // expected to be positioned (the control panels are position:absolute);
    // dragging updates its left/top. Drags that begin on an interactive control
    // are ignored, matching jQuery UI's default cancel behavior.
    function makeDraggableWithinParent(el) {
        if (!el) {
            return;
        }
        let startX = 0, startY = 0, startLeft = 0, startTop = 0, dragging = false;

        function onMove(e) {
            if (!dragging) {
                return;
            }
            let newLeft = startLeft + (e.clientX - startX);
            let newTop = startTop + (e.clientY - startY);
            let parent = el.offsetParent;
            if (parent) {
                newLeft = Math.max(0, Math.min(newLeft, parent.clientWidth - el.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, parent.clientHeight - el.offsetHeight));
            }
            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
        }

        function onUp() {
            dragging = false;
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        }

        el.addEventListener('pointerdown', function (e) {
            let t = e.target;
            // Don't start a drag on an interactive control, or on the clampable
            // tree name/description block (so a click there toggles it instead of
            // moving the panel and then firing the toggle on release).
            if (t !== el && t.closest('input, select, button, textarea, label, a, option, legend, .' + TREE_DESC + '.aptx-clampable')) {
                return;
            }
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = el.offsetLeft;
            startTop = el.offsetTop;
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        });
    }


    function increaseFontSizes() {
        stepFontSizes(SLIDER_STEP * 2);
    }

    function decreaseFontSizes() {
        stepFontSizes(-SLIDER_STEP * 2);
    }

    // The keyboard font-size shortcuts, in terms of the single base size.
    function stepFontSizes(step) {
        let base = clampFontSize(_state.externalNodeFontSize + step);
        if (base === _state.externalNodeFontSize) {
            return; // already at the end of the range
        }
        setFontSizes(base);
        setSliderValue(FONT_SIZE_SLIDER, _state.externalNodeFontSize);
        update(null, 0, true);
    }


    // The control panel is created inside the tree's own container and placed
    // against it. It used to be built into a div the embedder had to supply and
    // position themselves, offset by _offsetTop to line it up -- and _offsetTop
    // was read through the d3 v3 selection API, so on d3 v7 it stayed 0 and the
    // panel landed at the top of the PAGE however far down the tree began.
    function makeControlPanelElement() {
        let container = d3.select(_id).node();
        if (!container) {
            return null;
        }
        // absolute placement below needs the container to be a containing block
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        container.style.textAlign = 'left';
        let panel = document.createElement('div');
        container.appendChild(panel);
        return panel;
    }

    function createGui() {


        setStylesAll(_id, {
            'font-style': 'normal',
            'font-weight': 'normal',
            'text-decoration': 'none',
            'text-align': 'left',
            'border-color': 'LightGray'
        });


        // The tooltip's appearance is fixed, so it is set ONCE here rather than
        // animated on every hover. In particular position:absolute has to be in
        // place before the first hover: while it is still static, the left/top
        // set on mousemove do nothing and the tooltip sits in the page flow, so
        // applying it through a transition made the first tooltip fly in from
        // the corner (and only the first, since the style stuck afterwards).
        // Appearance comes from the stylesheet (same palette as the panel, the
        // node menu and the dialog); only opacity is animated on hover.
        // The tooltip, the node menu and the node-data dialog all draw on these
        // styles, and they exist whether or not the embedder asked for control
        // panels -- so inject before the tooltip rather than inside the two
        // "did we get a panel div?" branches below, which is where this used to
        // live. Injecting twice is a no-op.
        injectPanelStyles();

        _node_mouseover_div = d3.select("body").append("div")
            .attr("class", "node_mouseover_tooltip aptx-tip")
            .style("opacity", 1e-6);


        let c0 = makeControlPanelElement();

        if (c0) {
            c0.classList.add('aptx-panel');
            setStyles(c0, {
                'position': 'absolute',
                'left': CONTROLS_0_LEFT_DEFAULT,
                'top': CONTROLS_0_TOP_DEFAULT,
                'padding': '0px',
                'margin': '0'
            });

            makeDraggableWithinParent(c0);

            c0.insertAdjacentHTML('beforeend',makeProgramDesc());

            let treeDescFieldset = makeTreeDesc();
            if (treeDescFieldset) {
                c0.appendChild(treeDescFieldset);
            }

            c0.insertAdjacentHTML('beforeend',makePhylogramControl());

            insertVisualizationControls(c0);

            c0.insertAdjacentHTML('beforeend',makeDisplayControl());

            c0.insertAdjacentHTML('beforeend',makeZoomControl());

            c0.insertAdjacentHTML('beforeend',makeControlButtons());

            c0.insertAdjacentHTML('beforeend',makeSliders());

            c0.insertAdjacentHTML('beforeend',makeSearchBoxes());

            if (_settings.enableManualNodeSelection) {
                //c0.append(makeSubmitSection()); //~~~
            }

            if (_settings.enableDownloads) {
                c0.insertAdjacentHTML('beforeend',makeDownloadSection());
            }

            enhancePanel(c0);

            // After enhancePanel has wrapped the sections and the panel has its
            // final width, wire the tree name/description block's expand control.
            if (treeDescFieldset) {
                enableTreeDescExpand(c0.querySelector('.' + TREE_DESC));
            }
        }


        // (The text buttons used to get their look forced here as inline styles
        // -- a fixed 26px width for all, 104px for Y+/Y-, font resets. That is
        // the stylesheet's job now: the search row sizes its R button, and the
        // zoom grid stretches Y+/Y- to the exact width of the button row.)

        const downloadButton = byId(DOWNLOAD_BUTTON);

        if (downloadButton) {
            setStyles(downloadButton, {
                'width': '60px', 'margin-bottom': '3px'
            });
        }

        const submitSelectedButton = byId(SUBMIT_SELECTED_NODES_BUTTON);

        if (submitSelectedButton) {
            setStyles(submitSelectedButton, {
                'width': '80px', 'margin-bottom': '3px'
            });
        }


        on(SEARCH_FIELD_0, 'keyup', search0);

        on(SEARCH_FIELD_1, 'keyup', search1);

        on(SEARCH_VALUE2_0, 'keyup', search0);

        on(SEARCH_VALUE2_1, 'keyup', search1);

        on(SEARCH_FIELD_SELECT_0, 'change', function () { onSearchFieldChanged(0); });

        on(SEARCH_FIELD_SELECT_1, 'change', function () { onSearchFieldChanged(1); });

        on(SEARCH_MODE_SELECT_0, 'change', function () { onSearchModeChanged(0); });

        on(SEARCH_MODE_SELECT_1, 'change', function () { onSearchModeChanged(1); });

        on(SEARCH_COMBINE_SELECT, 'change', runSearches);

        on(PHYLOGRAM_BUTTON, 'click', toPhylogram);

        on(PHYLOGRAM_ALIGNED_BUTTON, 'click', toAlignedPhylogram);

        on(CLADOGRAM_BUTTON, 'click', toCladegram);

        on(NODE_NAME_CB, 'click', nodeNameCbClicked);

        on(TAXONOMY_CB, 'click', taxonomyCbClicked);

        on(SEQUENCE_CB, 'click', sequenceCbClicked);

        on(CONFIDENCE_VALUES_CB, 'click', confidenceValuesCbClicked);

        on(BRANCH_LENGTH_VALUES_CB, 'click', branchLengthsCbClicked);

        on(NODE_EVENTS_CB, 'click', nodeEventsCbClicked);

        on(BRANCH_EVENTS_CB, 'click', branchEventsCbClicked);

        on(INTERNAL_LABEL_CB, 'click', internalLabelsCbClicked);

        on(EXTERNAL_LABEL_CB, 'click', externalLabelsCbClicked);

        on(VIS_CB, 'click', visCbClicked);


        on(VISUAL_STYLES_CB, 'click', visualStylesCbClicked);

        on(DYNAHIDE_CB, 'click', dynaHideCbClicked);

        on(LAYOUT_RECT_BUTTON, 'click', layoutButtonClicked);

        on(LAYOUT_CIRC_BUTTON, 'click', layoutButtonClicked);

        on(SHORTEN_NODE_NAME_CB, 'click', shortenCbClicked);

        if (_nodeLabels) {
            for (const [key, value] of Object.entries(_nodeLabels)) {
                if (value.label && value.showButton === true && value.propertyRef && value.description) {
                    const cb_id = makeIdForCustomCheckboxButton(key);
                    on(cb_id, 'click', function () {
                        customCbClicked(cb_id);
                    });
                    if (value.selected === true) {
                        setCheckboxValue(cb_id, true);
                    }
                }
            }
        }

        on(LABEL_COLOR_SELECT_MENU, 'change', function () {
            let v = this.value;
            if (v && v !== DEFAULT && _vis && _vis.byId[v]) {
                _vis.colorId = v;
                // One colour paints the label AND the node, so choosing one
                // switches visualizations on -- otherwise half of what the
                // control promises would not show.
                _state.showVisualizations = true;
                setCheckboxValue(VIS_CB, true);
            } else if (_vis) {
                _vis.colorId = null;
            }
            removeColorLegend(LEGEND_LABEL_COLOR);
            update(null, 0);
        });

        on(NODE_SHAPE_SELECT_MENU, 'change', function () {
            let v = this.value;
            if (v && v !== DEFAULT && _vis && _vis.byId[v] && _vis.byId[v].shape) {
                _vis.shapeId = v;
                _state.showVisualizations = true;
                setCheckboxValue(VIS_CB, true);
            } else if (_vis) {
                _vis.shapeId = null;
            }
            removeShapeLegend(LEGEND_NODE_SHAPE);
            resetVis();
            update(null, 0);
            update(null, 0);
        });

                initSlider(NODE_SIZE_SLIDER, NODE_SIZE_MIN, NODE_SIZE_MAX, SLIDER_STEP, _state.nodeSizeDefault, changeNodeSize);

        initSlider(BRANCH_WIDTH_SLIDER, BRANCH_WIDTH_MIN, BRANCH_WIDTH_MAX, SLIDER_STEP, _state.branchWidthDefault, changeBranchWidth);

        initSlider(FONT_SIZE_SLIDER, FONT_SIZE_MIN, FONT_SIZE_MAX, SLIDER_STEP, _state.externalNodeFontSize, changeFontSize);

        setStylesAll('#' + SEARCH_FIELD_0 + ', #' + SEARCH_FIELD_1, {
            'font': 'inherit',
            'color': 'inherit',
            'text-align': 'left',
            'outline': 'none',
            'cursor': 'text'
        });

        onHold(ZOOM_IN_Y, function () {
            zoomInY();
            _intervalId = setInterval(zoomInY, ZOOM_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        onHold(ZOOM_OUT_Y, function () {
            zoomOutY();
            _intervalId = setInterval(zoomOutY, ZOOM_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        onHold(ZOOM_IN_X, function () {
            zoomInX();
            _intervalId = setInterval(zoomInX, ZOOM_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        onHold(ZOOM_OUT_X, function () {
            zoomOutX();
            _intervalId = setInterval(zoomOutX, ZOOM_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        on(ZOOM_TO_FIT, 'click', zoomToFit);

        on(ZOOM_TO_EXPAND_Y, 'click', zoomToExpandY);
        on(FIT_WIDTH_BUTTON, 'click', fitWidthButtonPressed);

        on(RETURN_TO_SUPERTREE_BUTTON, 'click', returnToSupertreeButtonPressed);

        on(RETURN_TO_SUPERTREE_BUTTON_BY_ONE, 'click', returnToSupertreeButtonByOnePressed);

        on(LADDERIZE_BUTTON, 'click', ladderizeButtonPressed);

        on(MIDPOINT_ROOT_BUTTON, 'click', midpointRootButtonPressed);

        // Search Controls
        // ---------------

        on(SEARCH_OPTIONS_CASE_SENSITIVE_CB, 'click', searchOptionsCaseSenstiveCbClicked);
        on(SEARCH_OPTIONS_NEGATE_RES_CB, 'click', searchOptionsNegateResultCbClicked);

        on(RESET_SEARCH_A_BTN, 'click', resetSearch0);
        on(RESET_SEARCH_B_BTN, 'click', resetSearch1);

        // Visualization Legends
        // ---------------------





        // ----------------

        if (downloadButton) {
            downloadButton.addEventListener('click', downloadButtonPressed);
        }

        if (submitSelectedButton) {
            submitSelectedButton.addEventListener('click', submitSelectedPressed);
        }

        setStyles(byId(EXPORT_FORMAT_SELECT), {
            'font': 'inherit', 'color': 'inherit'
        });

        // ---------------

        // Visualizations
        // ---------------

        setStyles(byId(LABEL_COLOR_SELECT_MENU), {
            'font': 'inherit', 'color': 'inherit'
        });


        setStyles(byId(NODE_SHAPE_SELECT_MENU), {
            'font': 'inherit', 'color': 'inherit'
        });







        document.addEventListener('keyup', function (e) {
            if (e.altKey) {
                if (e.keyCode === VK_O) {
                    ladderizeButtonPressed();
                } else if (e.keyCode === VK_R) {
                    if (e.shiftKey) {
                        returnToSupertreeButtonPressed();
                    } else {
                        returnToSupertreeButtonByOnePressed();
                    }
                } else if (e.keyCode === VK_M) {
                    midpointRootButtonPressed();
                } else if (e.keyCode === VK_C || e.keyCode === VK_DELETE || e.keyCode === VK_BACKSPACE) {
                    zoomToFit();
                } else if (e.keyCode === VK_P) {
                    cycleDisplay();
                } else if (e.keyCode === VK_L) {
                    toggleAlignPhylogram();
                } else if (e.keyCode === VK_W) {
                    fitWidthButtonPressed();
                }
            } else if (e.keyCode === VK_ESC || e.keyCode === VK_HOME) {
                escPressed();
            } else if ((e.keyCode === VK_O) && !e.ctrlKey && !e.metaKey && !e.shiftKey
                && !isTypingTarget(e.target)) {
                moveOverviewToNextCorner(); // as on the desktop
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.altKey) {
                if (e.keyCode === VK_UP) {
                    zoomInY(BUTTON_ZOOM_IN_FACTOR_SLOW);
                } else if (e.keyCode === VK_DOWN) {
                    zoomOutY(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                } else if (e.keyCode === VK_LEFT) {
                    zoomOutX(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                } else if (e.keyCode === VK_RIGHT) {
                    zoomInX(BUTTON_ZOOM_IN_FACTOR_SLOW);
                } else if (e.keyCode === VK_PLUS || e.keyCode === VK_PLUS_N) {
                    if (e.shiftKey) {
                        increaseFontSizes();
                    } else {
                        zoomInY(BUTTON_ZOOM_IN_FACTOR_SLOW);
                        zoomInX(BUTTON_ZOOM_IN_FACTOR_SLOW);
                    }
                } else if (e.keyCode === VK_MINUS || e.keyCode === VK_MINUS_N) {
                    if (e.shiftKey) {
                        decreaseFontSizes();
                    } else {
                        zoomOutY(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                        zoomOutX(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                    }
                }
            }
            if (e.keyCode === VK_PAGE_UP) {
                increaseFontSizes();
            } else if (e.keyCode === VK_PAGE_DOWN) {
                decreaseFontSizes();
            }
        });


        document.addEventListener('wheel', function (e) {
            if (e.shiftKey) {
                // Browsers turn a shifted wheel into HORIZONTAL scrolling: the
                // movement arrives in deltaX and deltaY is 0. Testing deltaY
                // alone therefore sent every shifted wheel down the "zoom in"
                // branch, whichever way the wheel actually turned. Take whichever
                // axis carries the scroll.
                let delta = (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) ? e.deltaY : e.deltaX;
                if (delta === 0) {
                    return;
                }
                if (delta > 0) {
                    if (e.ctrlKey) {
                        decreaseFontSizes();
                    } else if (e.altKey) {
                        zoomOutX(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                    } else {
                        zoomOutY(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                    }
                } else {
                    if (e.ctrlKey) {
                        increaseFontSizes();
                    } else if (e.altKey) {
                        zoomInX(BUTTON_ZOOM_IN_FACTOR_SLOW);
                    } else {
                        zoomInY(BUTTON_ZOOM_IN_FACTOR_SLOW);
                    }
                }
                // To prevent the page from scrolling:
                e.preventDefault();
                return;
            }
            // A plain wheel over the tree zooms BOTH axes, exactly as pressing
            // Y+ and X+ together does (and Y-/X- the other way): the tree's
            // layout grows or shrinks while the labels stay the size they were.
            // Only over the tree -- elsewhere the wheel must still scroll the
            // control panel or the page.
            if (!_baseSvg || !_baseSvg.node().contains(e.target)) {
                return;
            }
            if (e.deltaY > 0) {
                zoomOutY(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                zoomOutX(BUTTON_ZOOM_OUT_FACTOR_SLOW);
            } else if (e.deltaY < 0) {
                zoomInY(BUTTON_ZOOM_IN_FACTOR_SLOW);
                zoomInX(BUTTON_ZOOM_IN_FACTOR_SLOW);
            }
            e.preventDefault();
        }, {passive: false});

        // --------------------------------------------------------------
        // Functions to make GUI elements
        // --------------------------------------------------------------

        function makeProgramDesc() {
            let h = "";
            h = h.concat('<div class=' + PROG_NAME + '>');
            h = h.concat('<button type="button" class="' + PROGNAMELINK + '" title="About ' + NAME + '">' + NAME + ' ' + VERSION + '</button>');
            h = h.concat('</div>');
            return h;
        }

        // The tree's name and description (when present). Both can be very
        // long: they are clamped to a few lines (never widening the panel --
        // overflow-wrap breaks even unbroken strings), with the full text in a
        // tooltip; clicking the block toggles the clamp.
        // The tree's name and description (when present) as a DOM block, or null
        // when there is nothing to show. Built with textContent -- no HTML string,
        // so tree-file text needs no escaping here. Both can be very long, so CSS
        // clamps each to a few lines; the caller (enableTreeDescExpand) adds the
        // click/keyboard expand affordance only when the text actually overflows.
        function makeTreeDesc() {
            let name = _treeData.name ? String(_treeData.name).trim() : '';
            let desc = _treeData.description ? String(_treeData.description).trim() : '';
            if (!name && !desc) {
                return null;
            }
            let fieldset = document.createElement('fieldset');
            let block = document.createElement('div');
            block.className = TREE_DESC;
            let tooltip = '';
            if (name) {
                let nameEl = document.createElement('div');
                nameEl.className = 'aptx-tree-name';
                nameEl.textContent = name;
                block.appendChild(nameEl);
                tooltip = 'Name: ' + name;
            }
            if (desc) {
                let descEl = document.createElement('div');
                descEl.className = 'aptx-tree-descr';
                descEl.textContent = desc;
                block.appendChild(descEl);
                tooltip += (tooltip ? '\n\n' : '') + 'Description: ' + desc;
            }
            block.title = tooltip;
            fieldset.appendChild(block);
            return fieldset;
        }

        // Make the tree name/description block a keyboard-accessible
        // expand/collapse control, but only while its text is actually clamped
        // (otherwise the pointer cursor + click would be a misleading no-op).
        // Clamp state is re-evaluated whenever the block's size changes -- the
        // panel only reaches its final width after construction, and it can
        // change again on window resize -- but never while expanded, since
        // unclamped text would read as "fits".
        function enableTreeDescExpand(block) {
            if (!block) {
                return;
            }
            let toggle = function () {
                if (!block.classList.contains('aptx-clampable')) {
                    return; // nothing is clamped -> not an interactive control
                }
                let expanded = block.classList.toggle('aptx-expanded');
                block.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            };
            block.addEventListener('click', toggle);
            block.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    toggle();
                }
            });
            let evaluate = function () {
                if (block.classList.contains('aptx-expanded')) {
                    return;
                }
                let clamped = false;
                let parts = block.querySelectorAll('.aptx-tree-name, .aptx-tree-descr');
                for (let i = 0; i < parts.length; ++i) {
                    if (parts[i].scrollHeight > parts[i].clientHeight + 1) {
                        clamped = true;
                        break;
                    }
                }
                if (clamped) {
                    block.classList.add('aptx-clampable');
                    block.setAttribute('role', 'button');
                    block.setAttribute('tabindex', '0');
                    if (!block.hasAttribute('aria-expanded')) {
                        block.setAttribute('aria-expanded', 'false');
                    }
                } else {
                    block.classList.remove('aptx-clampable');
                    block.removeAttribute('role');
                    block.removeAttribute('tabindex');
                    block.removeAttribute('aria-expanded');
                }
            };
            // Evaluate now (reading scrollHeight forces the pending layout, so
            // this is correct as soon as the block has its final width) and again
            // on every later size change (window resize).
            evaluate();
            if (typeof ResizeObserver !== 'undefined') {
                new ResizeObserver(evaluate).observe(block);
            }
        }

        function makePhylogramControl() {
            let radioGroup = 'phylogram_control_radio';
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<div class="aptx-modebar">');
            h = h.concat('<div class="' + PHYLOGRAM_CLADOGRAM_CONTROLGROUP + ' aptx-segmented">');
            h = h.concat(makeSegment(makeGlyph('phylogram'), PHYLOGRAM_BUTTON, radioGroup, 'phylogram display (uses branch length values)  (use Alt+P to cycle between display types)'));
            h = h.concat(makeSegment(makeGlyph('aligned_phylogram'), PHYLOGRAM_ALIGNED_BUTTON, radioGroup, 'phylogram display (uses branch length values) with aligned labels  (use Alt+P to cycle between display types)'));
            h = h.concat(makeSegment(makeGlyph('cladogram'), CLADOGRAM_BUTTON, radioGroup, ' cladogram display (ignores branch length values)  (use Alt+P to cycle between display types)'));
            h = h.concat('</div>');
            let layoutGroup = 'layout_control_radio';
            h = h.concat('<div class="aptx-segmented">');
            h = h.concat(makeSegment(makeGlyph('rectangular'), LAYOUT_RECT_BUTTON, layoutGroup, 'rectangular, root at left'));
            h = h.concat(makeSegment(makeGlyph('circular'), LAYOUT_CIRC_BUTTON, layoutGroup, 'circular'));
            h = h.concat('</div>');
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        // One segment of the segmented display-type control. `content` is either
        // plain text or a glyph from makeGlyph.
        function makeSegment(content, id, radioGroup, tooltip) {
            return '<label class="aptx-seg" title="' + tooltip + '"><input type="radio" name="' + radioGroup + '" id="' + id + '">' + content + '</label>';
        }

        function makeIdForCustomCheckboxButton(key) {
            return key + '__cb';
        }

        function makeDisplayControl() {
            let labels = [];
            let nodes = [];
            let opts = [];

            // --- Labels: what text/data is drawn on the tree ---
            if (_basicTreeProperties.nodeNames) {
                labels.push(makeCheckboxItem('Node Name', NODE_NAME_CB, 'to show/hide node names (node names usually are the untyped labels found in New Hampshire/Newick formatted trees)'));
            }
            if (_basicTreeProperties.taxonomies) {
                labels.push(makeCheckboxItem('Taxonomy', TAXONOMY_CB, 'to show/hide node taxonomic information'));
            }
            if (_basicTreeProperties.sequences) {
                labels.push(makeCheckboxItem('Sequence', SEQUENCE_CB, 'to show/hide node sequence information'));
            }
            if (_nodeLabels) {
                for (const [key, value] of Object.entries(_nodeLabels)) {
                    if (value.label && value.propertyRef && value.description) {
                        const cb_id = makeIdForCustomCheckboxButton(key);
                        if (value.showButton === true) {
                            labels.push(makeCheckboxItem(value.label, cb_id, value.description));
                        }
                        value.cb_id = cb_id;
                    }
                }
            }
            if (_basicTreeProperties.confidences) {
                labels.push(makeCheckboxItem('Confidence', CONFIDENCE_VALUES_CB, 'to show/hide confidence values'));
            }
            if (_basicTreeProperties.branchLengths) {
                labels.push(makeCheckboxItem('Branch Length', BRANCH_LENGTH_VALUES_CB, 'to show/hide branch length values'));
            }
            {
                labels.push(makeCheckboxItem('Ext. Labels', EXTERNAL_LABEL_CB, 'to show/hide external node labels'));
            }
            if (_basicTreeProperties.internalNodeData) {
                labels.push(makeCheckboxItem('Int. Labels', INTERNAL_LABEL_CB, 'to show/hide internal node labels'));
            }

            // --- Nodes & branches: shapes, events, colors, visualizations ---
            if (_basicTreeProperties.nodeEvents) {
                nodes.push(makeCheckboxItem('Node Events', NODE_EVENTS_CB, 'to show speciations and duplications as colored nodes (e.g. speciations green, duplications red)'));
            }
            if (_basicTreeProperties.branchEvents) {
                nodes.push(makeCheckboxItem('Branch Events', BRANCH_EVENTS_CB, 'to show/hide branch events (e.g. mutations)'));
            }
            if (_basicTreeProperties.branchColors || (_vis && _vis.hasStyles)) { // only when the tree carries either
                nodes.push(makeCheckboxItem('Visual Styles', VISUAL_STYLES_CB, 'to use visual styles (node and font colors, shapes) and branch colors, if present in the tree file'));
            }
            if (hasColorVisualizations()) {
                nodes.push(makeCheckboxItem('Visualizations', VIS_CB, 'to show or hide the Color and Shape visualizations chosen above'));
            }

            // --- Options ---
            // Both are always offered. They do nothing on a tree that needs
            // neither, but a control that comes and goes between trees is worse
            // than one that is simply there.
            // "Auto-hide Labels" matches the desktop, which renamed the historical
            // "Dyna Hide" because that named the mechanism rather than what the user
            // sees. The _state.dynahide field keeps its name internally.
            opts.push(makeCheckboxItem('Auto-hide Labels', DYNAHIDE_CB, 'automatically hide external labels when the tree is too dense for them to be readable', true));
            opts.push(makeCheckboxItem('Short Names', SHORTEN_NODE_NAME_CB, 'to shorten long node names'));

            let h = '<fieldset><legend>Display Data</legend>';
            h = h.concat(makeCheckboxGroup('Labels', labels));
            h = h.concat(makeCheckboxGroup('Nodes', nodes));
            h = h.concat(makeCheckboxGroup('Options', opts));
            h = h.concat('</fieldset>');
            return h;
        }

        function makeZoomControl() {
            // The middle row keeps the desktop's left-to-right order: X-,
            // expand vertically, fit, fit width, X+ (with the X, expand and
            // fit-width buttons repurposed in the circular layout, see
            // syncZoomRowButtons). The Y buttons span the whole row.
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Zoom</legend>');
            h = h.concat('<div class="aptx-zoomgrid">');
            h = h.concat(makeButton('Y+', ZOOM_IN_Y, 'zoom in vertically (Alt+Up or Shift+mousewheel)'));
            h = h.concat('<div class="aptx-zoomrow">');
            h = h.concat(makeGlyphButton('rotate_ccw', ZOOM_OUT_X, ''));
            h = h.concat(makeGlyphButton('expand_vertical', ZOOM_TO_EXPAND_Y, 'fit and center tree, expand vertically'));
            h = h.concat(makeGlyphButton('fit_all', ZOOM_TO_FIT, 'fit and center tree display (Alt+C), use Home or Esc for almost complete reset'));
            h = h.concat(makeGlyphButton('fit_width', FIT_WIDTH_BUTTON, ''));
            h = h.concat(makeGlyphButton('rotate_cw', ZOOM_IN_X, ''));
            h = h.concat('</div>');
            h = h.concat(makeButton('Y-', ZOOM_OUT_Y, 'zoom out vertically (Alt+Down or Shift+mousewheel)'));
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeControlButtons() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Tools</legend>');
            h = h.concat('<div>');
            h = h.concat(makeGlyphButton('ladderize_asc', LADDERIZE_BUTTON, 'ladderize all (Alt+O)'));
            h = h.concat(makeGlyphButton('whole_tree', RETURN_TO_SUPERTREE_BUTTON, 'return all the way to the complete tree (if in a sub-tree) (Alt+Shift+R)'));
            h = h.concat(makeGlyphButton('up_one_level', RETURN_TO_SUPERTREE_BUTTON_BY_ONE, 'move up by one level towards the complete tree (if in a sub-tree) (Alt+R)'));
            h = h.concat(makeGlyphButton('midpoint', MIDPOINT_ROOT_BUTTON, 'midpoint re-root (Alt+M)'));
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeDownloadSection() {
            let h = "";
            h = h.concat('<form action="#">');
            h = h.concat('<fieldset>');
            h = h.concat('<input type="button" value="Download" name="' + DOWNLOAD_BUTTON + '" title="download/export tree in a selected format" id="' + DOWNLOAD_BUTTON + '">');
            //h = h.concat('<br>');
            h = h.concat('<select name="' + EXPORT_FORMAT_SELECT + '" id="' + EXPORT_FORMAT_SELECT + '">');
            h = h.concat('<option value="' + PNG_EXPORT_FORMAT + '">' + PNG_EXPORT_FORMAT + '</option>');
            h = h.concat('<option value="' + SVG_EXPORT_FORMAT + '">' + SVG_EXPORT_FORMAT + '</option>');
            h = h.concat('<option value="' + PHYLOXML_EXPORT_FORMAT + '">' + PHYLOXML_EXPORT_FORMAT + '</option>');
            h = h.concat('<option value="' + NH_EXPORT_FORMAT + '">' + NH_EXPORT_FORMAT + '</option>');
            h = h.concat('<option value="' + FASTA_EXPORT_FORMAT + '">' + FASTA_EXPORT_FORMAT + '</option>');
            // h = h.concat('<option value="' + PDF_EXPORT_FORMAT + '">' + PDF_EXPORT_FORMAT + '</option>');
            h = h.concat('</select>');
            h = h.concat('</fieldset>');
            h = h.concat('</form>');
            return h;
        }

        function makeSubmitSection() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<div class="submit_nodes">');
            h = h.concat('<input type="button" value="Submit Selected" name="' + SUBMIT_SELECTED_NODES_BUTTON + '" title="to submit the selected nodes" id="' + SUBMIT_SELECTED_NODES_BUTTON + '">');
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeSliders() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Sizes</legend>');
            h = h.concat(makeSlider('Font size:', FONT_SIZE_SLIDER));
            h = h.concat(makeSlider('Node size:', NODE_SIZE_SLIDER));
            h = h.concat(makeSlider('Branch width:', BRANCH_WIDTH_SLIDER));
            h = h.concat('</fieldset>');
            return h;
        }

        // --------------------------------------------------------------
        // Functions to make search-related elements
        // --------------------------------------------------------------
        function makeSearchBoxes() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Search</legend>');
            h = h.concat(makeSearchBox('Search A', 0));
            h = h.concat(makeSearchBox('Search B', 1));
            h = h.concat('<div class="aptx-combine" id="' + SEARCH_COMBINE_ROW + '" style="display:none">');
            h = h.concat('<label class="aptx-field-label" for="' + SEARCH_COMBINE_SELECT + '">Combine A &amp; B</label>');
            h = h.concat('<select id="' + SEARCH_COMBINE_SELECT + '" name="' + SEARCH_COMBINE_SELECT + '" title="how to combine the two searches">');
            h = h.concat('<option value="independent">independent</option>');
            h = h.concat('<option value="and">A AND B</option>');
            h = h.concat('<option value="or">A OR B</option>');
            h = h.concat('</select>');
            h = h.concat('</div>');
            h = h.concat(makeSearchControlsCompact());
            h = h.concat('</fieldset>');
            return h;
        }

        function makeSearchBox(label, idx) {
            let valTip = "enter text to search for -- ',' means OR, '+' means AND; pick the field and match mode from the menus above";
            let fsel = idx === 0 ? SEARCH_FIELD_SELECT_0 : SEARCH_FIELD_SELECT_1;
            let msel = idx === 0 ? SEARCH_MODE_SELECT_0 : SEARCH_MODE_SELECT_1;
            let val = idx === 0 ? SEARCH_FIELD_0 : SEARCH_FIELD_1;
            let val2 = idx === 0 ? SEARCH_VALUE2_0 : SEARCH_VALUE2_1;
            let reset = idx === 0 ? RESET_SEARCH_A_BTN : RESET_SEARCH_B_BTN;
            let resetTip = idx === 0 ? RESET_SEARCH_A_BTN_TOOLTIP : RESET_SEARCH_B_BTN_TOOLTIP;
            let dl = idx === 0 ? SEARCH_DATALIST_0 : SEARCH_DATALIST_1;
            let h = "";
            h = h.concat('<label class="aptx-field-label" for="' + val + '">' + label + '</label>');
            h = h.concat('<div class="aptx-search-menus">');
            h = h.concat('<select class="aptx-search-field" name="' + fsel + '" id="' + fsel + '" title="the field to search in"></select>');
            h = h.concat('<select class="aptx-search-mode" name="' + msel + '" id="' + msel + '" title="how to match"></select>');
            h = h.concat('</div>');
            h = h.concat('<div class="aptx-search-row">');
            h = h.concat('<input class="aptx-search-value" autocomplete="off" title="' + valTip + '" type="text" name="' + val + '" id="' + val + '">');
            h = h.concat('<input class="aptx-search-value2" style="display:none" title="upper bound of the range" type="text" name="' + val2 + '" id="' + val2 + '">');
            h = h.concat(makeButton('R', reset, resetTip));
            h = h.concat('</div>');
            h = h.concat('<datalist id="' + dl + '"></datalist>');
            return h;
        }

        function makeSearchControlsCompact() {
            let h = "";
            h = h.concat('<div class="' + SEARCH_OPTIONS_GROUP + '">');
            h = h.concat(makeCheckboxItem('Match case', SEARCH_OPTIONS_CASE_SENSITIVE_CB, 'search in a case-sensitive manner'));
            h = h.concat(makeCheckboxItem('Inverse', SEARCH_OPTIONS_NEGATE_RES_CB, 'select the nodes that do NOT match'));
            h = h.concat('</div>');
            return h;
        }


        // The visualization menus used to live in a second, free-floating panel
        // on the right. They belong with every other control, and above Display
        // Data, which is where the desktop puts them.
        function insertVisualizationControls(panel) {
            if (_settings.enableVisualizations) {
                panel.insertAdjacentHTML('beforeend', makeVisualControls());
            }
        }

        // --------------------------------------------------------------
        // Functions to make visualization controls
        // --------------------------------------------------------------
        // A menu whose only entry would be "default" offers nothing to choose, so
        // it is not shown; if neither has anything, the whole section goes.
        function makeVisualControls() {
            if (!hasColorVisualizations() && !hasShapeVisualizations()) {
                return '';
            }
            let h = "";
            h = h.concat('<form action="#">');
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Visualizations</legend>');
            if (hasColorVisualizations()) {
                h = h.concat(makeSelectMenu('Color:', '<br>', LABEL_COLOR_SELECT_MENU, 'colorize the node label and the node itself according to a property'));
                h = h.concat('<br>');
                h = h.concat('<br>');
            }
            if (hasShapeVisualizations()) {
                h = h.concat(makeSelectMenu('Shape:', '<br>', NODE_SHAPE_SELECT_MENU, 'change the node shape according to a property'));
                h = h.concat('<br>');
            }
            h = h.concat('</fieldset>');
            h = h.concat('</form>');
            return h;
        }


        // --------------------------------------------------------------
        // Functions to make individual GUI components
        // --------------------------------------------------------------
        function makeButton(label, id, tooltip) {
            return '<input type="button" value="' + label + '" name="' + id + '" id="' + id + '" title="' + tooltip + '">';
        }

        // A button carrying one of the drawn glyphs instead of a letter. A real
        // <button> (not <input type=button>, which cannot contain an <svg>).
        function makeGlyphButton(glyph, id, tooltip) {
            return '<button type="button" class="aptx-gbtn" name="' + id + '" id="' + id + '" title="' + tooltip + '">'
                + makeGlyph(glyph) + '</button>';
        }

        // A checkbox + label item, used by the Display Data grid and the inline search-option row.
        // `wide` makes the item span both columns of the checkbox grid, for a
        // label too long to fit one column without being ellipsized.
        function makeCheckboxItem(label, id, tooltip, wide) {
            return '<label class="aptx-check' + (wide ? ' aptx-check-wide' : '') + '" title="' + tooltip + '"><input type="checkbox" name="' + id + '" id="' + id + '"><span>' + label + '</span></label>';
        }

        // A titled 2-column group of checkbox items; empty groups render nothing.
        function makeCheckboxGroup(name, items) {
            if (items.length === 0) {
                return '';
            }
            return '<div class="aptx-subhead">' + name + '</div><div class="aptx-checkgrid">' + items.join('') + '</div>';
        }

        function makeSelectMenu(label, sep, id, tooltip) {
            return '<label for="' + id + '" title="' + tooltip + '">' + label + '</label>' + sep + '<select name="' + id + '" id="' + id + '"></select>';
        }

        function makeSlider(label, id) {
            let input = '<input type="range" class="' + SLIDER_CLASS + '" name="' + id + '" id="' + id + '">';
            if (label) {
                return label + input;
            }
            return input;
        }

    } // function createGui()

    function initializeGui() {

        setDisplayTypeButtons();
        syncZoomRowButtons();

        setCheckboxValue(NODE_NAME_CB, _state.showNodeName);
        setCheckboxValue(TAXONOMY_CB, _state.showTaxonomy);
        setCheckboxValue(SEQUENCE_CB, _state.showSequence)
        setCheckboxValue(CONFIDENCE_VALUES_CB, _state.showConfidenceValues);
        setCheckboxValue(BRANCH_LENGTH_VALUES_CB, _state.showBranchLengthValues);
        setCheckboxValue(NODE_EVENTS_CB, _state.showNodeEvents);
        setCheckboxValue(BRANCH_EVENTS_CB, _state.showBranchEvents);
        setCheckboxValue(INTERNAL_LABEL_CB, _state.showInternalLabels);
        setCheckboxValue(EXTERNAL_LABEL_CB, _state.showExternalLabels);
        setCheckboxValue(VISUAL_STYLES_CB, _state.useVisualStyles);
        setCheckboxValue(VIS_CB, _state.showVisualizations);
        setCheckboxValue(DYNAHIDE_CB, _state.dynahide);
        setCheckboxValue(SHORTEN_NODE_NAME_CB, _state.shortenNodeNames);
        populateVisualizationMenus();
        initializeSearchOptions();
        makeBackground();
    }

    function makeBackground() {
        _baseSvg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('opacity', 1)
            .attr('class', BASE_BACKGROUND)
            .attr('fill', _state.backgroundColorDefault);
    }


    // Fills the Color and Shape menus from the current candidates and points
    // them at the current choices. Called at launch and again after a
    // permanent tree edit changes what there is to offer.
    function populateVisualizationMenus() {
        if (!_vis) {
            return;
        }
        let colorMenu = byId(LABEL_COLOR_SELECT_MENU);
        if (colorMenu) {
            colorMenu.innerHTML = '';
            addOption(LABEL_COLOR_SELECT_MENU, DEFAULT, 'default');
            _vis.candidates.forEach(function (c) {
                addOption(LABEL_COLOR_SELECT_MENU, c.id, c.label);
            });
            setSelectMenuValue(LABEL_COLOR_SELECT_MENU, _vis.colorId || DEFAULT);
        }
        let shapeMenu = byId(NODE_SHAPE_SELECT_MENU);
        if (shapeMenu) {
            shapeMenu.innerHTML = '';
            addOption(NODE_SHAPE_SELECT_MENU, DEFAULT, 'default');
            _vis.candidates.forEach(function (c) {
                if (c.shape) {
                    addOption(NODE_SHAPE_SELECT_MENU, c.id, c.label);
                }
            });
            setSelectMenuValue(NODE_SHAPE_SELECT_MENU, _vis.shapeId || DEFAULT);
        }
    }

        function initializeSearchOptions() {
        _state.searchNegateResult = false;
        setCheckboxValue(SEARCH_OPTIONS_CASE_SENSITIVE_CB, _state.searchIsCaseSensitive);
        setCheckboxValue(SEARCH_OPTIONS_NEGATE_RES_CB, _state.searchNegateResult);

        if (_state.searchAinitialValue) {
            setValue(SEARCH_FIELD_0, _state.searchAinitialValue);
        }
        if (_state.searchBinitialValue) {
            setValue(SEARCH_FIELD_1, _state.searchBinitialValue);
        }
    }


    // Ladderize: at every two-child node put the larger clade first when
    // largestFirst, the smaller when not.
    //
    // alternateIfUnchanged is what makes repeated presses of the button
    // alternate: a pass that changes nothing means the subtree was already
    // ladderized that way, so it flips and runs again. That is right for a
    // button and wrong for anything that wants a definite result -- with it on,
    // ladderizing a tree that is already ladderized REVERSES it, so the outcome
    // depends on the order the tree happened to arrive in.
    function ladderizeSubtree(n, largestFirst, alternateIfUnchanged) {
        let changed = false;
        ord(n);
        if (alternateIfUnchanged && !changed) {
            largestFirst = !largestFirst;
            ord(n);
        }

        function ord(n) {
            if (!n.children) {
                return;
            }
            let c = n.children;
            let l = c.length;
            if (l === 2) {
                let e0 = forester.calcSumOfAllExternalDescendants(c[0]);
                let e1 = forester.calcSumOfAllExternalDescendants(c[1]);
                if (e0 !== e1 && e0 < e1 === largestFirst) {
                    changed = true;
                    let c0 = c[0];
                    c[0] = c[1];
                    c[1] = c0;
                }
            }
            for (let i = 0; i < l; ++i) {
                ord(c[i]);
            }
        }
    }

    function cycleDisplay() {
        if (_state.phylogram && !_state.alignPhylogram) {
            _state.alignPhylogram = true;

        } else if (_state.phylogram && _state.alignPhylogram) {
            _state.phylogram = false;
            _state.alignPhylogram = false;
        } else if (!_state.phylogram && !_state.alignPhylogram) {
            _state.phylogram = true;
        }
        setDisplayTypeButtons();
        update(null, 0);
    }

    function setDisplayTypeButtons() {
        setRadioButtonValue(PHYLOGRAM_BUTTON, _state.phylogram && !_state.alignPhylogram);
        setRadioButtonValue(CLADOGRAM_BUTTON, !_state.phylogram && !_state.alignPhylogram);
        setRadioButtonValue(PHYLOGRAM_ALIGNED_BUTTON, _state.alignPhylogram && _state.phylogram);
        setCheckboxValue(LAYOUT_CIRC_BUTTON, _state.circularDisplay);
        setCheckboxValue(LAYOUT_RECT_BUTTON, !_state.circularDisplay);
        if (!_basicTreeProperties.branchLengths) {
            disableCheckbox('#' + PHYLOGRAM_BUTTON);
            disableCheckbox('#' + PHYLOGRAM_ALIGNED_BUTTON);
        }
    }


    function updateButtonEnabledState() {
        if (_in_subtree) {
            enableButton(byId(RETURN_TO_SUPERTREE_BUTTON_BY_ONE));
            enableButton(byId(RETURN_TO_SUPERTREE_BUTTON));
        } else {
            disableButton(byId(RETURN_TO_SUPERTREE_BUTTON_BY_ONE));
            disableButton(byId(RETURN_TO_SUPERTREE_BUTTON));
        }

        if (!_in_subtree && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
            enableButton(byId(MIDPOINT_ROOT_BUTTON));
        } else {
            disableButton(byId(MIDPOINT_ROOT_BUTTON));
        }
        let b;
        if (_foundNodes0 && !_searchBox0Empty) {
            b = byId(RESET_SEARCH_A_BTN);
            if (b) {
                b.disabled = false;
                if (_foundNodes0.size < 1) {
                    b.style.background = '';
                    b.style.color = '';
                } else {
                    b.style.background = _state.found0ColorDefault;
                    b.style.color = WHITE;
                }
                let nd0 = _foundNodes0.size === 1 ? 'node' : 'nodes';
                b.title = 'found ' + _foundNodes0.size + ' ' + nd0 + ' [click to ' + RESET_SEARCH_A_BTN_TOOLTIP + ']';
            }
        } else {
            b = byId(RESET_SEARCH_A_BTN);
            if (b) {
                b.disabled = true;
                b.style.background = '';
                b.style.color = '';
                b.title = RESET_SEARCH_A_BTN_TOOLTIP;
            }
        }

        if (_foundNodes1 && !_searchBox1Empty) {
            b = byId(RESET_SEARCH_B_BTN);
            if (b) {
                b.disabled = false;
                if (_foundNodes1.size < 1) {
                    b.style.background = '';
                    b.style.color = '';
                } else {
                    b.style.background = _state.found1ColorDefault;
                    b.style.color = WHITE;
                }
                let nd1 = _foundNodes1.size === 1 ? 'node' : 'nodes';
                b.title = 'found ' + _foundNodes1.size + ' ' + nd1 + ' [click to ' + RESET_SEARCH_B_BTN_TOOLTIP + ']';
            }
        } else {
            b = byId(RESET_SEARCH_B_BTN);
            if (b) {
                b.disabled = true;
                b.style.background = '';
                b.style.color = '';
                b.title = RESET_SEARCH_B_BTN_TOOLTIP;
            }
        }
    }


    function disableCheckbox(cb) {
        if (cb) {
            let el = document.querySelector(cb);
            if (el) {
                el.disabled = true;
            }
        }
    }

    function disableButton(b) {
        if (b) {
            b.disabled = true;
            b.style.background = '';
        }
    }

    function enableButton(b) {
        if (b) {
            b.disabled = false;
            b.style.background = '';
        }
    }

    // The tree's own <svg>. Deliberately NOT container.querySelector('svg'):
    // the control panel is inside the tree container and every one of its glyph
    // icons is an <svg> too, so that picked whichever came first in the DOM --
    // a 14x14 icon -- and exported that instead of the tree.
    function treeSvgElement() {
        return _baseSvg ? _baseSvg.node() : null;
    }

    // An export is always light, whatever the screen is set to: a dark PNG or
    // SVG is wrong on paper, in a slide and in a paper figure, and it is the
    // file that outlives the session. Only the four theme colours are swapped,
    // and only by exact value, so search hits, selections and every colour
    // visualization come through the export untouched.
    //
    // Done on the serialized COPY rather than by repainting the live tree: the
    // display never flickers, and there is no waiting on a redraw to finish
    // before serializing.
    const EXPORT_COLOR_SWAPS = [
        [BACKGROUND_COLOR_DARK, BACKGROUND_COLOR_FOR_PRINT_EXPORT_DEFAULT],
        // the light ground is faintly grey on screen; on white paper the node
        // dots filled with it would show up as smudges, so it goes white too
        [BACKGROUND_COLOR_DEFAULT, BACKGROUND_COLOR_FOR_PRINT_EXPORT_DEFAULT],
        [LABEL_COLOR_DARK, LABEL_COLOR_DEFAULT],
        [BRANCH_COLOR_DARK, BRANCH_COLOR_DEFAULT]
    ];

    // d3 writes colours through the CSSOM, which normalizes them to rgb(), but
    // anything set as a plain attribute keeps the hex it was given -- so both
    // spellings have to be matched.
    function colorSpellings(hex) {
        let c = d3.color(hex);
        return c ? [hex, hex.toUpperCase(), c.formatRgb()] : [hex];
    }

    function toLightExport(svgText) {
        EXPORT_COLOR_SWAPS.forEach(function (pair) {
            let to = pair[1];
            colorSpellings(pair[0]).forEach(function (from) {
                svgText = svgText.split(from).join(to);
            });
        });
        return svgText;
    }

    function getTreeAsSvg() {
        let svg = treeSvgElement();
        if (!svg) {
            return null;
        }
        let svgTree = null;
        if (typeof window.XMLSerializer !== 'undefined') {
            // Serialize a COPY with the overview taken out of it: the overview is
            // an on-screen navigation aid, not part of the tree, and working on a
            // copy leaves the live display untouched.
            let copy = svg.cloneNode(true);
            let overview = copy.querySelector('.aptx-overview');
            if (overview) {
                overview.remove();
            }
            svgTree = toLightExport((new XMLSerializer()).serializeToString(copy));
        } else if (typeof svg.xml !== 'undefined') {
            svgTree = svg.xml;
        }
        return svgTree;
    }

    function downloadTree(format) {
        if (format === PNG_EXPORT_FORMAT) {
            changeBaseBackgoundColor(_state.backgroundColorForPrintExportDefault);
            downloadAsPng();
            changeBaseBackgoundColor(_state.backgroundColorDefault);
        } else if (format === SVG_EXPORT_FORMAT) {
            changeBaseBackgoundColor(_state.backgroundColorForPrintExportDefault);
            downloadAsSVG();
            changeBaseBackgoundColor(_state.backgroundColorDefault);
        } else if (format === NH_EXPORT_FORMAT) {
            downloadAsNH();
        } else if (format === PHYLOXML_EXPORT_FORMAT) {
            downloadAsPhyloXml();
        } else if (format === PDF_EXPORT_FORMAT) {
            changeBaseBackgoundColor(_state.backgroundColorForPrintExportDefault);
            downloadAsPdf();
            changeBaseBackgoundColor(_state.backgroundColorDefault);
        } else if (format === FASTA_EXPORT_FORMAT) {
            downloadAsFastaAll();
        }
    }

    /**
     * Saves a Blob to a file using native browser APIs (an <a download> link
     * pointing at an object URL). This replaces the former FileSaver.js
     * dependency; it is intentionally named `saveAs` so every existing call
     * site keeps working unchanged. If a global saveAs (e.g. a page still
     * loading FileSaver.js) is present it is left untouched — this local
     * definition simply shadows it within the library.
     *
     * @param blob - the Blob to save
     * @param filename - the suggested file name for the download
     */
    function saveAs(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Revoke on a later tick so the download has time to start.
        setTimeout(function () {
            window.URL.revokeObjectURL(url);
        }, 1000);
    }

    function downloadAsPhyloXml() {
        let x = phyloXml.toPhyloXML(_root, 9);
        saveAs(new Blob([x], {type: "application/xml"}), _state.nameForPhyloXmlDownload);
    }

    function downloadAsNH() {
        // Newick cannot carry those characters unescaped, so replacing them is
        // not a preference: writing them out produces a file that will not parse
        // back in.
        let nh = forester.toNewHampshire(_root, 9, true, _settings.nhExportWriteConfidences);
        saveAs(new Blob([nh], {type: "application/txt"}), _state.nameForNhDownload);
    }

    function downloadAsSVG() {
        let svg = getTreeAsSvg();
        saveAs(new Blob([decodeURIComponent(encodeURIComponent(svg))], {type: "application/svg+xml"}), _state.nameForSvgDownload);
    }

    function downloadAsFastaAll() {
        let fasta_text = forester.getMolecularSequencesAsFasta(_root, '\n');
        saveAs(new Blob([fasta_text], {type: "application/txt"}), _state.nameForFastaDownload);
    }

    function downloadAsPdf() {
    }

    function downloadAsPng() {
        let svg = getTreeAsSvg();
        // Render onto an up-scaled canvas so the exported PNG is high-resolution
        // rather than 1:1 with the on-screen SVG. Scale is configurable via
        // _settings.pngExportScale (default 4x).
        let svgEl = treeSvgElement();
        let scale = _settings.pngExportScale > 0 ? _settings.pngExportScale : 4;
        let w = (svgEl && svgEl.width.baseVal.value) || _displayWidth;
        let h = (svgEl && svgEl.height.baseVal.value) || _displayHeight;
        let canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvg(canvas, svg, {ignoreDimensions: true, scaleWidth: canvas.width, scaleHeight: canvas.height});
        canvas.toBlob(function (blob) {
            saveAs(blob, _state.nameForPngDownload);
        });
    }


// --------------------------------------------------------------
// Returning selected/found nodes to another application
// --------------------------------------------------------------


    archaeopteryx.getSelectedNodes = function () {
        return Array.from(_selectedNodes);
    };


// --------------------------------------------------------------
// Convenience methods for loading tree on HTML page
// --------------------------------------------------------------

    /**
     * Convenience method for loading tree on HTML page
     *
     * @param location
     * @param data
     * @param newHamphshireConfidenceValuesInBrackets
     * @param newHamphshireConfidenceValuesAsInternalNames
     * @returns {*}
     */
    archaeopteryx.parseTree = function (location, data, newHamphshireConfidenceValuesInBrackets, newHamphshireConfidenceValuesAsInternalNames) {
        if (newHamphshireConfidenceValuesInBrackets === undefined) {
            newHamphshireConfidenceValuesInBrackets = true;
        }
        if (newHamphshireConfidenceValuesAsInternalNames === undefined) {
            newHamphshireConfidenceValuesAsInternalNames = false;
        }
        let tree;
        if (location.substr(-3, 3).toLowerCase() === 'xml') {
            tree = archaeopteryx.parsePhyloXML(data);
        } else {
            tree = archaeopteryx.parseNewHampshire(data, newHamphshireConfidenceValuesInBrackets, newHamphshireConfidenceValuesAsInternalNames);
        }
        return tree;
    };

    // Parse-and-launch in one step. The trailing nodeVisualizations parameter
    // is kept in the signature only so launch() can reject it by name.
    archaeopteryx.launchArchaeopteryx = function (label, location, data, config, legacySettings, newHamphshireConfidenceValuesInBrackets, newHamphshireConfidenceValuesAsInternalNames, nodeVisualizations) {
        let tree;
        try {
            tree = archaeopteryx.parseTree(location, data, newHamphshireConfidenceValuesInBrackets, newHamphshireConfidenceValuesAsInternalNames);
        } catch (e) {
            // Worth catching only to say that it was the parse, not the launch,
            // that failed -- a malformed tree file rather than a bug in here.
            // The original is kept as the cause so the stack is not lost.
            throw new Error(ERROR + 'could not parse tree: ' + e.message, {cause: e});
        }
        // launch() already reports its own failures well enough; wrapping them
        // added nothing but a prefix, and swallowing them left the caller with
        // a blank page and no way to find out why.
        archaeopteryx.launch(label, tree, config, legacySettings, nodeVisualizations);
    };


// --------------------------------------------------------------
// For exporting
// --------------------------------------------------------------
    if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser) module.exports.archaeopteryx = archaeopteryx; else if (typeof window !== "undefined") window.archaeopteryx = archaeopteryx; else this.archaeopteryx = archaeopteryx;
})();