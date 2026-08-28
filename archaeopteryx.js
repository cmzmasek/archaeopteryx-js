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
// https://docs.google.com/document/d/16PjoaNeNTWPUNVGcdYukP6Y1G35PFhq39OiIMmD03U8

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
    const WEBSITE = 'https://docs.google.com/document/d/16PjoaNeNTWPUNVGcdYukP6Y1G35PFhq39OiIMmD03U8';
    const NAME = 'Archaeopteryx.js';

    // The 20-colour categorical palettes below were removed from d3 in v5. These
    // are the exact colour arrays from d3 v3's d3.scale.category20/20b/20c, kept
    // so d3.scaleOrdinal(...) reproduces the original colours after the upgrade.
    const SCHEME_CATEGORY20 = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'];
    const SCHEME_CATEGORY20B = ['#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31', '#bd9e39', '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173', '#a55194', '#ce6dbd', '#de9ed6'];
    const SCHEME_CATEGORY20C = ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddd', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'];

    // -----------------------------
    // Named colors and orientations
    // -----------------------------
    const LIGHT_BLUE = '#2590FD';
    const WHITE = '#ffffff';
    const HORIZONTAL = 'horizontal';
    const VERTICAL = 'vertical';

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
    const BRANCH_DATA_FONT_SIZE_DEFAULT = 6;
    const BRANCH_WIDTH_DEFAULT = 1;
    const DECIMALS_FOR_LINEAR_RANGE_MEAN_VALUE_DEFAULT = 0;
    const EXTERNAL_NODE_FONT_SIZE_DEFAULT = 9;
    const FONT_DEFAULTS = ['Arial', 'Helvetica', 'Times'];
    // Okabe-Ito color-blind-safe palette for search / selection highlights.
    const FOUND0_COLOR_DEFAULT = '#0072B2';      // Search A  — blue
    const FOUND1_COLOR_DEFAULT = '#D55E00';      // Search B  — vermillion
    const FOUND0AND1_COLOR_DEFAULT = '#F0E442';  // A and B   — yellow
    const SELECTED_COLOR_DEFAULT = '#009E73';    // Selected  — bluish green
    const INTERNAL_NODE_FONT_SIZE_DEFAULT = 6;
    const LABEL_COLOR_DEFAULT = '#202020';
    const NAME_FOR_NH_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + NH_SUFFIX;
    const NAME_FOR_PHYLOXML_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + XML_SUFFIX;
    const NAME_FOR_PNG_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + PNG_SUFFIX;
    const NAME_FOR_SVG_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + SVG_SUFFIX;
    const NAME_FOR_FASTA_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + FASTA_SUFFIX;
    const NODE_LABEL_GAP_DEFAULT = 10;
    const NODE_SIZE_DEFAULT_DEFAULT = 3;
    const NODE_VISUALIZATIONS_OPACITY_DEFAULT = 1;
    const VISUALIZATIONS_LEGEND_ORIENTATION_DEFAULT = VERTICAL;
    const VISUALIZATIONS_LEGEND_XPOS_DEFAULT = 220;
    const VISUALIZATIONS_LEGEND_YPOS_DEFAULT = 30;

    // ---------------------------
    // Default values for settings
    // ---------------------------
    const CONTROLS_0_LEFT_DEFAULT = 20;
    const CONTROLS_0_TOP_DEFAULT = 10;
    const CONTROLS_1_TOP_DEFAULT = 10;
    const CONTROLS_1_WIDTH_DEFAULT = 120;
    const CONTROLS_BACKGROUND_COLOR_DEFAULT = '#c0c0c0';
    const CONTROLS_FONT_COLOR_DEFAULT = '#505050';
    const CONTROLS_FONT_DEFAULTS = ['Arial', 'Helvetica', 'Times'];
    const CONTROLS_FONT_SIZE_DEFAULT = 8;
    const DISPLY_HEIGHT_DEFAULT = 600;
    const DISPLAY_WIDTH_DEFAULT = 800;
    const MOLSEQ_FONT_DEFAULTS = ['Courier', 'Courier New', 'Arial', 'Helvetica', 'Times'];
    const ROOTOFFSET_DEFAULT = 220;
    const TEXT_INPUT_FIELD_DEFAULT_HEIGHT = '10px';

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
    const COLOR_FOR_ACTIVE_ELEMENTS = LIGHT_BLUE;
    const COLOR_PICKER_BACKGROUND_BORDER_COLOR = '#808080';
    const COLOR_PICKER_CLICKED_ORIG_COLOR_BORDER_COLOR = '#000000';
    const CONFIDENCE_VALUE_DIGITS_DEFAULT = 2;
    const DEFAULT = 'default';
    const DUPLICATION_AND_SPECIATION_COLOR_COLOR = '#ffff00';
    const DUPLICATION_COLOR = '#ff0000';
    const FASTA_EXPORT_FORMAT = 'Fasta';
    const FONT_SIZE_MAX = 26;
    const FONT_SIZE_MIN = 2;
    const LABEL_SIZE_CALC_ADDITION = 80;
    const LABEL_SIZE_CALC_FACTOR = 0.5;
    const LEGEND_LABEL_COLOR = 'legendLabelColor';
    const LEGEND_NODE_FILL_COLOR = 'legendNodeFillColor';
    const LEGEND_NODE_SHAPE = 'legendNodeShape';
    const LEGEND_NODE_SIZE = 'legendNodeSize';
    const LINEAR_SCALE = 'linear';
    const MOVE_INTERVAL = 150;
    const NH_EXPORT_FORMAT = 'Newick';
    const HEIGHT_OFFSET = 40;
    const NODE_SIZE_MAX = 9;
    const NODE_SIZE_MIN = 1;
    const NODE_TOOLTIP_BACKGROUND_COLOR = '#606060';
    const NODE_TOOLTIP_TEXT_ACTIVE_COLOR = COLOR_FOR_ACTIVE_ELEMENTS;
    const NODE_TOOLTIP_TEXT_COLOR = WHITE;
    const ORDINAL_SCALE = 'ordinal';
    const PDF_EXPORT_FORMAT = 'PDF';
    const PHYLOXML_EXPORT_FORMAT = 'phyloXML';
    const PNG_EXPORT_FORMAT = 'PNG';
    const MSA_RESIDUE = 'MSA Residue';
    const RESET_SEARCH_A_BTN_TOOLTIP = 'reset (remove) search result A';
    const RESET_SEARCH_B_BTN_TOOLTIP = 'reset (remove) search result B';
    const SHORTEN_NAME_MAX_LENGTH = 18;
    const PANEL_STYLE_ID = 'aptx-panel-styles';
    const PANEL_WIDTH = 214; // fixed control-panel width; shared by the .aptx-panel CSS and the right-panel (c1) positioning so the two can't drift
    const SLIDER_CLASS = 'aptx-slider';
    const SLIDER_STEP = 0.5;
    const SPECIATION_COLOR = '#00ff00';
    const SVG_EXPORT_FORMAT = 'SVG';
    const TOP_AND_BOTTOM_BORDER_HEIGHT = 10;
    const TRANSITION_DURATION_DEFAULT = 750;
    const WARNING = 'ArchaeopteryxJS: WARNING';
    const MESSAGE = 'ArchaeopteryxJS: ';
    const ERROR = 'ArchaeopteryxJS: ERROR: ';
    const WIDTH_OFFSET = 14; // Needed in Firefox Quantum (2018-02-22)
    const ZOOM_INTERVAL = 200;

    // ---------------------------
    // Names for GUI elements
    // ---------------------------
    const BASE_BACKGROUND = 'basebackground';
    const BRANCH_COLORS_CB = 'brnch_col_cb';
    const BRANCH_DATA_FONT_SIZE_SLIDER = 'bdfs_sl';
    const BRANCH_EVENTS_CB = 'brevts_cb';
    const BRANCH_LENGTH_VALUES_CB = 'bl_cb';
    const BRANCH_VIS_CB = 'branchvis_cb';
    const BRANCH_WIDTH_SLIDER = 'bw_sl';
    const CIRCULAR_CB = 'circular_cb';
    const CLADOGRAM_BUTTON = 'cla_b';
    const COLOR_PICKER = 'col_pick';
    const COLOR_PICKER_LABEL = 'colorPickerLabel';
    const CONFIDENCE_VALUES_CB = 'conf_cb';
    const CONTROLS_0 = 'controls0';
    const CONTROLS_1 = 'controls1';
    const DISPLAY_DATA_CONTROLGROUP = 'display_data_g';
    const DOWNLOAD_BUTTON = 'dl_b';
    const SUBMIT_SELECTED_NODES_BUTTON = 'submit_sel_nodes_b';
    const DYNAHIDE_CB = 'dynahide_cb';
    const EXPORT_FORMAT_SELECT = 'exp_f_sel';
    const EXTERNAL_FONT_SIZE_SLIDER = 'entfs_sl';
    const EXTERNAL_LABEL_CB = 'extl_cb';
    const EXTERNAL_NODES_CB = 'extn_cb';
    const INTERNAL_FONT_SIZE_SLIDER = 'intfs_sl';
    const INTERNAL_LABEL_CB = 'intl_cb';
    const INTERNAL_NODES_CB = 'intn_cb';
    const LABEL_COLOR_SELECT_MENU = 'lcs_menu';
    const LEGEND = 'legend';
    const LEGEND_DESCRIPTION = 'legendDescription';
    const LEGEND_LABEL = 'legendLabel';
    const LEGENDS_HORIZ_VERT_BTN = 'legends_horizvert';
    const LEGENDS_MOVE_DOWN_BTN = 'legends_mdown';
    const LEGENDS_MOVE_LEFT_BTN = 'legends_mleft';
    const LEGENDS_MOVE_RIGHT_BTN = 'legends_mright';
    const LEGENDS_MOVE_UP_BTN = 'legends_mup';
    const LEGENDS_RESET_BTN = 'legends_rest';
    const LEGENDS_SHOW_BTN = 'legends_show';
    const MIDPOINT_ROOT_BUTTON = 'midpointr_b';
    const MSA_RESIDUE_VIS_CURR_RES_POS_LABEL = 'seq_pos_label_curr_pos';
    const MSA_RESIDUE_VIS_CURR_RES_POS_SLIDER_1 = 'seq_pos_slider_1';
    const MSA_RESIDUE_VIS_DECR_CURR_RES_POS_BTN = 'seq_pos_decr_pos';
    const MSA_RESIDUE_VIS_INCR_CURR_RES_POS_BTN = 'seq_pos_incr_pos';
    const NODE_DATA = 'node_data_dialog';
    const NODE_EVENTS_CB = 'nevts_cb';
    const NODE_FILL_COLOR_SELECT_MENU = 'nfcolors_menu';
    const NODE_NAME_CB = 'nn_cb';
    const NODE_SHAPE_SELECT_MENU = 'nshapes_menu';
    const NODE_SIZE_SELECT_MENU = 'nsizes_menu';
    const NODE_SIZE_SLIDER = 'ns_sl';
    const NODE_VIS_CB = 'nodevis_cb';
    const ORDER_BUTTON = 'ord_b';
    const PHYLOGRAM_ALIGNED_BUTTON = 'phya_b';
    const PHYLOGRAM_BUTTON = 'phy_b';
    const PHYLOGRAM_CLADOGRAM_CONTROLGROUP = 'phy_cla_g';
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
    const SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB = 'so_cto_cb';
    const SEARCH_OPTIONS_PROPERTIES_CB = 'so_prp_cb';
    const SEARCH_OPTIONS_GROUP = 'search_opts_g';
    const SEARCH_OPTIONS_NEGATE_RES_CB = 'so_neg_cb';
    const SEARCH_OPTIONS_REGEX_CB = 'so_regex_cb';
    const SEQUENCE_CB = 'seq_cb';
    const SHORTEN_NODE_NAME_CB = 'shortennodename_cb';
    const TAXONOMY_CB = 'tax_cb';
    const ZOOM_IN_X = 'zoomin_x';
    const ZOOM_IN_Y = 'zoomout_y';
    const ZOOM_OUT_X = 'zoomout_x';
    const ZOOM_OUT_Y = 'zoomin_y';
    const ZOOM_TO_FIT = 'zoomtofit';
    const ZOOM_TO_EXPAND_Y = 'zoomtoexpandy';

    const LABEL_COLOR_SELECT_MENU_2 = 'lcs_2_menu';
    const NODE_FILL_COLOR_SELECT_MENU_2 = 'nfcolors_2_menu';

    const LABEL_COLOR_SELECT_MENU_3 = 'lcs_3_menu';
    const NODE_FILL_COLOR_SELECT_MENU_3 = 'nfcolors_3_menu';

    const LABEL_COLOR_SELECT_MENU_4 = 'lcs_4_menu';
    const NODE_FILL_COLOR_SELECT_MENU_4 = 'nfcolors_4_menu';


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
    const VK_0 = 48;
    const VK_9 = 57;
    const VK_0_NUMPAD = 96;
    const VK_9_NUMPAD = 105;
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
    const VK_OPEN_BRACKET = 219;
    const VK_CLOSE_BRACKET = 221;


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


    const col_category50 = [// 1 Red
        '#FF1744', // 2 Purple
        '#D500F9', // 3 Deep Purple
        '#651FFF', // 4 Indigo
        '#3D5AFE', // 5 Blue
        '#2979FF', // 6 Cyan
        '#00E5FF', // 7 Teal
        '#1DE9B6', // 8 Green
        '#00E676', // 9 Light Green
        '#76FF03', // 10 Lime
        '#C6FF00', // 11 Yellow
        '#FFEA00', // 12 Amber
        '#FFC400', // 13 Orange
        '#FF9100', // 13 Deep Orange
        '#FF3D00', // 15 Brown
        '#6D4C41', // 16 Grey
        '#757575', //
        // 17 Red
        '#B71C1C', // 18 Pink
        '#880E4F', // 19 Purple
        '#4A148C', // 20 Deep Purple
        '#311B92', // 21 Indigo
        '#1A237E', // 22 Blue
        '#0D47A1', // 23 Cyan
        '#006064', // 24 Teal
        '#004D40', // 25 Green
        '#1B5E20', // 26 Light Green
        '#33691E', // 27 Lime
        '#827717', // 28 Yellow
        '#F57F17', // 29 Amber
        '#FF6F00', // 30 Orange
        '#E65100', // 31 Deep Orange
        '#BF360C', // 32 Brown
        '#4E342E', // 33 Grey
        '#424242', //
        // 34 Red
        '#EF9A9A', // 35 Pink
        '#F48FB1', // 36 Purple
        '#CE93D8', // 37 Deep Purple
        '#B39DDB', // 38 Indigo
        '#9FA8DA', // 39 Blue
        '#90CAF9', // 40 Cyan
        '#80DEEA', // 41 Teal
        '#80CBC4', // 42 Green
        '#A5D6A7', // 43 Light Green
        '#C5E1A5', // 44 Lime
        '#E6EE9C', // 45 Amber
        '#FFE082', // 46 Orange
        '#FFCC80', // 47 Deep Orange
        '#FFAB91', // 48 Brown
        '#BCAAA4', // 49 Grey
        '#E0E0E0', // 50 Grey
        '#505050'];


    const col_category50b = ["#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87", "#5A0007", "#809693", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80", "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#D16100", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F", "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09", "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66"];

    const col_category50c = [// Red
        '#FF5252', '#FF1744', '#D50000', // Pink
        '#FF4081', '#F50057', '#C51162', // Purple
        '#E040FB', '#D500F9', '#AA00FF', // Deep Purple
        '#7C4DFF', '#651FFF', '#6200EA', // Indigo
        '#536DFE', '#3D5AFE', '#304FFE', // Blue
        '#448AFF', '#2979FF', '#2962FF', // Cyan
        '#18FFFF', '#00E5FF', '#00B8D4', // Teal
        '#64FFDA', '#1DE9B6', '#00BFA5', // Green
        '#69F0AE', '#00E676', '#00C853', // Light Green
        '#B2FF59', '#76FF03', '#64DD17', // Lime
        '#EEFF41', '#C6FF00', '#AEEA00', // Yellow
        '#FFFF00', '#FFEA00', '#FFD600', // Amber
        '#FFD740', '#FFC400', '#FFAB00', // Orange
        '#FFAB40', '#FF9100', '#FF6D00', // Deep Orange
        '#FF6E40', '#FF3D00', '#DD2C00', // Brown
        '#5D4037', '#4E342E', '#3E2723', // Grey
        '#9E9E9E', '#616161'];

    const category50 = function () {
        return d3.scaleOrdinal().domain([]).range(col_category50);
    };

    const category50b = function () {
        return d3.scaleOrdinal().domain([]).range(col_category50b);
    };

    const category50c = function () {
        return d3.scaleOrdinal().domain([]).range(col_category50c);
    };


    // ---------------------------
    // "Instance variables"
    // ---------------------------
    let _baseSvg = null;
    let _basicTreeProperties = null;
    let _colorPickerData = null;
    let _colorsForColorPicker = null;
    let _currentLabelColorVisualization = null;
    let _currentNodeFillColorVisualization = null;
    let _currentNodeShapeVisualization = null;
    let _currentNodeSizeVisualization = null;
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
    let _legendColorScales = {};
    let _legendShapeScales = {};
    let _legendSizeScales = {};
    let _maxLabelLength = 0;
    let _msa_residue_vis_curr_res_pos = 0;
    let _nodeVisualizations = null;
    let _nodeLabels = null;
    let _specialVisualizations = null;
    let _offsetTop = 0;
    let _options = null;
    let _options_orig = null;
    let _root = null;
    let _root_const = null;
    let _in_subtree = false;
    let _searchBox0Empty = true;
    let _searchBox1Empty = true;
    let _settings = null;
    let _showColorPicker = false;
    let _showLegends = true;
    let _svgGroup = null;
    let _treeData = null;
    let _treeFn = null;
    let _usedColorCategories = new Set();
    let _visualizations = null;
    let _w = null;
    let _yScale = null;
    let _radial = null;   // circular-layout params (set per render when _options.circular)
    let _panelTheme = null;   // null = follow OS; 'light' / 'dark' = header switch choice
    let _zoomListener = null;
    let _zoomed_x_or_y = false;
    let _node_mouseover_div;
    let _visualizations2_color = null;
    let _visualizations3_color = null;
    let _visualizations4_color = null;
    let _visualizations2_applies_to_ref = null;
    let _visualizations3_applies_to_ref = null;
    let _visualizations4_applies_to_ref = null;
    let _visualizations2_property_datatype = null;
    let _visualizations3_property_datatype = null;
    let _visualizations4_property_datatype = null;
    let _visualizations2_property_applies_to = null;
    let _visualizations3_property_applies_to = null;
    let _visualizations4_property_applies_to = null;

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
    function zoom(event) {
        _svgGroup.attr('transform', event.transform);
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
        return _settings.rootOffset + _options.nodeLabelGap + LABEL_SIZE_CALC_ADDITION + (_maxLabelLength * _options.externalNodeFontSize * LABEL_SIZE_CALC_FACTOR);
    }

    function isCanDoMsaResidueVisualizations() {
        return ((_settings.enableNodeVisualizations === true) && (_settings.enableMsaResidueVisualizations === true) && (_basicTreeProperties.alignedMolSeqs === true) && (_basicTreeProperties.maxMolSeqLength && (_basicTreeProperties.maxMolSeqLength > 1)));
    }

    function isAddVisualization2() {
        return _settings.enableSpecialVisualizations2;
    }

    function isAddVisualization3() {
        return _settings.enableSpecialVisualizations3;
    }

    function isAddVisualization4() {
        return _settings.enableSpecialVisualizations4;
    }

    // ----------------------------
    // Functions for node tooltips
    // ----------------------------

    function mouseover() {
        _node_mouseover_div.transition()
            .duration(300)
            .style('opacity', 0.95)
            .style('text-align', 'left')
            .style('position', 'absolute')
            .style('font', '12px sans-serif')
            .style('pointer-events', 'none')
            .style('background', '#dddddd')
            .style('border', 'solid 1px #aaa')
            .style('border-radius', '4px')
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

        _node_mouseover_div
            .html(mo_text)
            .style('left', (event.pageX) + 'px')
            .style('top', (event.pageY) + 'px');
    }

    function mouseout() {
        _node_mouseover_div
            .html('')
        _node_mouseover_div.transition()
            .duration(300)
            .style('opacity', 1e-6);
    }

    // ----------------------------

    function createVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, // mappingFn is a scale
                                 scaleType, altMappingFn) {
        if (arguments.length < 8) {
            throw('expected at least 8 arguments, got ' + arguments.length);
        }

        if (!label || label.length < 1) {
            throw('need to have label');
        }
        let visualization = {};
        visualization.label = label;
        if (description) {
            visualization.description = description;
        }
        if (field) {
            if (cladePropertyRef) {
                throw('need to have either field or clade property ref (but not both)');
            }
            visualization.field = field;
        } else if (cladePropertyRef) {
            visualization.cladePropertyRef = cladePropertyRef;
        } else {
            throw('need to have either field or clade property ref');
        }
        visualization.isRegex = isRegex;
        if (mapping) {
            if (mappingFn) {
                throw('need to have either mapping or mappingFn');
            }
            visualization.mapping = mapping;
        } else if (mappingFn) {

            visualization.mappingFn = mappingFn;
            if (scaleType === ORDINAL_SCALE) {
                if (mappingFn.domain() && mappingFn.range() && mappingFn.domain().length > mappingFn.range().length) {
                    if (altMappingFn && altMappingFn.domain() && altMappingFn.range()) {
                        visualization.mappingFn = altMappingFn;
                        scaleType = LINEAR_SCALE;
                    } else {
                        let s = cladePropertyRef ? cladePropertyRef : field;
                        console.log(WARNING + ': Ordinal scale mapping for ' + label + ' (' + s + '): domain > range: ' + mappingFn.domain().length + ' > ' + mappingFn.range().length);
                    }
                }
            }
        } else {
            throw('need to have either mapping or mappingFn');
        }
        visualization.scaleType = scaleType;
        return visualization;
    }

    function initializeNodeVisualizations(nodeProperties) {
        if (_nodeVisualizations) {
            for (let key in _nodeVisualizations) {
                if (_nodeVisualizations.hasOwnProperty(key)) {

                    let nodeVisualization = _nodeVisualizations[key];

                    if (nodeVisualization.label) {

                        let scaleType = '';
                        if (nodeVisualization.shapes && Array.isArray(nodeVisualization.shapes) && (nodeVisualization.shapes.length > 0)) {

                            let shapeScale = null;
                            if (nodeVisualization.label === MSA_RESIDUE) {
                                shapeScale = d3.scaleOrdinal()
                                    .range(nodeVisualization.shapes)
                                    .domain(_basicTreeProperties.molSeqResiduesPerPosition[0]);
                                scaleType = ORDINAL_SCALE;
                            } else if (nodeVisualization.cladeRef && nodeProperties[nodeVisualization.cladeRef] && forester.setToArray(nodeProperties[nodeVisualization.cladeRef]).length > 0) {
                                shapeScale = d3.scaleOrdinal()
                                    .range(nodeVisualization.shapes)
                                    .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                scaleType = ORDINAL_SCALE;
                            } else if (nodeVisualization.field && nodeProperties[nodeVisualization.field] && forester.setToArray(nodeProperties[nodeVisualization.field]).length > 0) {
                                shapeScale = d3.scaleOrdinal()
                                    .range(nodeVisualization.shapes)
                                    .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.field]));
                                scaleType = ORDINAL_SCALE;
                            }

                            if (shapeScale) {
                                addNodeShapeVisualization(nodeVisualization.label, nodeVisualization.description, nodeVisualization.field ? nodeVisualization.field : null, nodeVisualization.cladeRef ? nodeVisualization.cladeRef : null, nodeVisualization.regex, null, shapeScale, scaleType);
                            }
                        }

                        if (nodeVisualization.colors) {
                            // TODO: Not dealing with nodeVisualization.field, yet.
                            if ((nodeVisualization.cladeRef && nodeProperties[nodeVisualization.cladeRef] && forester.setToArray(nodeProperties[nodeVisualization.cladeRef]).length > 0) || (nodeVisualization.label === MSA_RESIDUE)) {
                                let colorScale = null;
                                let altColorScale = null;

                                if (Array.isArray(nodeVisualization.colors)) {
                                    scaleType = LINEAR_SCALE;
                                    if (nodeVisualization.colors.length === 3) {
                                        colorScale = d3.scaleLinear()
                                            .range(nodeVisualization.colors)
                                            .domain(forester.calcMinMeanMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else if (nodeVisualization.colors.length === 2) {
                                        colorScale = d3.scaleLinear()
                                            .range(nodeVisualization.colors)
                                            .domain(forester.calcMinMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else {
                                        throw new Error('Number of colors has to be either 2 or 3');
                                    }
                                }

                                if (Array.isArray(nodeVisualization.colorsAlt)) {
                                    if (nodeVisualization.colorsAlt.length === 3) {
                                        altColorScale = d3.scaleLinear()
                                            .range(nodeVisualization.colorsAlt)
                                            .domain(forester.calcMinMeanMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else if (nodeVisualization.colorsAlt.length === 2) {
                                        altColorScale = d3.scaleLinear()
                                            .range(nodeVisualization.colorsAlt)
                                            .domain(forester.calcMinMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else {
                                        throw new Error('Number of colors has to be either 2 or 3');
                                    }
                                }

                                if (forester.isString(nodeVisualization.colors) && nodeVisualization.colors.length > 0) {
                                    scaleType = ORDINAL_SCALE;
                                    if (nodeVisualization.label === MSA_RESIDUE) {
                                        colorScale = d3.scaleOrdinal(SCHEME_CATEGORY20)
                                            .domain(_basicTreeProperties.molSeqResiduesPerPosition[0]);
                                        _usedColorCategories.add('category20');
                                    } else {
                                        if (nodeVisualization.colors === 'category20') {
                                            colorScale = d3.scaleOrdinal(SCHEME_CATEGORY20)
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category20');
                                        } else if (nodeVisualization.colors === 'category20b') {
                                            colorScale = d3.scaleOrdinal(SCHEME_CATEGORY20B)
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category20b');
                                        } else if (nodeVisualization.colors === 'category20c') {
                                            colorScale = d3.scaleOrdinal(SCHEME_CATEGORY20C)
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category20c');
                                        } else if (nodeVisualization.colors === 'category10') {
                                            colorScale = d3.scaleOrdinal(d3.schemeCategory10)
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category10');
                                        } else if (nodeVisualization.colors === 'category50') {
                                            colorScale = category50()
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category50');
                                        } else if (nodeVisualization.colors === 'category50b') {
                                            colorScale = category50b()
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category50b');
                                        } else if (nodeVisualization.colors === 'category50c') {
                                            colorScale = category50c()
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category50c');
                                        } else {
                                            throw new Error('do not know how to process ' + nodeVisualization.colors);
                                        }
                                    }
                                }

                                if (colorScale) {
                                    addLabelColorVisualization(nodeVisualization.label, nodeVisualization.description, null, nodeVisualization.cladeRef, nodeVisualization.regex, null, colorScale, scaleType, altColorScale);

                                    addNodeFillColorVisualization(nodeVisualization.label, nodeVisualization.description, null, nodeVisualization.cladeRef, nodeVisualization.regex, null, colorScale, scaleType, altColorScale);
                                }
                            }
                        }

                        if (nodeVisualization.sizes && Array.isArray(nodeVisualization.sizes) && (nodeVisualization.sizes.length > 0)) {
                            if (nodeVisualization.cladeRef && nodeProperties[nodeVisualization.cladeRef] && forester.setToArray(nodeProperties[nodeVisualization.cladeRef]).length > 0) {
                                let sizeScale = null;
                                let scaleType = LINEAR_SCALE;
                                if (nodeVisualization.sizes.length === 3) {
                                    sizeScale = d3.scaleLinear()
                                        .range(nodeVisualization.sizes)
                                        .domain(forester.calcMinMeanMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                } else if (nodeVisualization.sizes.length === 2) {
                                    sizeScale = d3.scaleLinear()
                                        .range(nodeVisualization.sizes)
                                        .domain(forester.calcMinMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                } else {
                                    throw new Error('Number of sizes has to be either 2 or 3');
                                }
                                if (sizeScale) {
                                    addNodeSizeVisualization(nodeVisualization.label, nodeVisualization.description, null, nodeVisualization.cladeRef, nodeVisualization.regex, null, sizeScale, scaleType);
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    function addNodeSizeVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType) {
        if (arguments.length !== 8) {
            throw('expected 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeSize) {
            _visualizations.nodeSize = {};
        }
        if (_visualizations.nodeSize[label]) {
            console.log(MESSAGE + 'node size visualization for "' + label + '" already exists');
        }
        let vis = createVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType);
        if (vis) {
            _visualizations.nodeSize[vis.label] = vis;
        }
    }

    function addNodeFillColorVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType, altMappingFn) {
        if (arguments.length < 8) {
            throw('expected at least 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeFillColor) {
            _visualizations.nodeFillColor = {};
        }
        if (_visualizations.nodeFillColor[label]) {
            console.log(MESSAGE + 'node fill color visualization for "' + label + '" already exists');
        }
        let vis = createVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType, altMappingFn);
        if (vis) {
            _visualizations.nodeFillColor[vis.label] = vis;
        }
    }

    function addNodeShapeVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType) {
        if (arguments.length !== 8) {
            throw('expected 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeShape) {
            _visualizations.nodeShape = {};
        }
        if (_visualizations.nodeShape[label]) {
            console.log(MESSAGE + 'node shape visualization for "' + label + '" already exists');
        }
        let vis = createVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType);
        if (vis) {
            _visualizations.nodeShape[vis.label] = vis;
        }
    }

    function addLabelColorVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType, altMappingFn) {
        if (arguments.length < 8) {
            throw('expected at least 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.labelColor) {
            _visualizations.labelColor = {};
        }
        if (_visualizations.labelColor[label]) {
            console.log(MESSAGE + 'label color visualization for "' + label + '" already exists');
        }
        let vis = createVisualization(label, description, field, cladePropertyRef, isRegex, mapping, mappingFn, scaleType, altMappingFn);
        if (vis) {
            _visualizations.labelColor[vis.label] = vis;
        }
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

    function removeSizeLegend(id) {
        _baseSvg.selectAll('g.' + id).remove();
    }

    function makeColorLegend(id, xPos, yPos, colorScale, scaleType, label, description) {

        if (!label) {
            throw new Error('legend label is missing');
        }

        let linearRangeLabel = ' (gradient)';
        let outOfRangeSymbol = ' *';
        let isLinearRange = scaleType === LINEAR_SCALE;
        let linearRangeLength = 0;
        if (isLinearRange) {
            label += linearRangeLabel;
            linearRangeLength = colorScale.domain().length;
        } else {
            if (colorScale.domain().length > colorScale.range().length) {
                label += outOfRangeSymbol;
            }
        }

        let counter = 0;

        let legendRectSize = 10;
        let legendSpacing = 4;

        let xCorrectionForLabel = -1;
        let yFactorForLabel = -1.5;
        let yFactorForDesc = -0.5;

        let legend = _baseSvg.selectAll('g.' + id)
            .data(colorScale.domain());

        let legendEnter = legend.enter().append('g')
            .attr('class', id);

        let fs = _settings.controlsFontSize.toString() + 'px';

        legendEnter.append('rect')
            .style('cursor', 'pointer')
            .attr('width', null)
            .attr('height', null)
            .on('click', function (event, clickedName) {
                // d3 v6+ no longer passes the index; derive it from the domain.
                let clickedIndex = colorScale.domain().indexOf(clickedName);
                legendColorRectClicked(colorScale, label, description, clickedName, clickedIndex);
            });

        legendEnter.append('text')
            .attr('class', LEGEND)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'normal')
            .style('text-decoration', 'none');

        legendEnter.append('text')
            .attr('class', LEGEND_LABEL)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-decoration', 'none');

        legendEnter.append('text')
            .attr('class', LEGEND_DESCRIPTION)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-decoration', 'none');


        legend = legendEnter.merge(legend);

        let legendUpdate = legend.transition()
            .duration(0)
            .attr('transform', function (d, i) {
                ++counter;
                let height = legendRectSize;
                let x = xPos;
                let y = yPos + i * height;
                return 'translate(' + x + ',' + y + ')';
            });

        legendUpdate.select('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', colorScale)
            .style('stroke', colorScale);

        legendUpdate.select('text.' + LEGEND)
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d, i) {
                if (isLinearRange) {
                    if (i === 0) {
                        return d + ' (min)';
                    } else if (((linearRangeLength === 2 && i === 1) || (linearRangeLength === 3 && i === 2))) {
                        return d + ' (max)';
                    } else if (linearRangeLength === 3 && i === 1) {
                        return preciseRound(d, _options.decimalsForLinearRangeMeanValue) + ' (mean)';
                    }
                }
                return d;
            });

        legendUpdate.select('text.' + LEGEND_LABEL)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForLabel * legendRectSize)
            .text(function (d, i) {
                if (i === 0) {
                    return label;
                }
            });

        legendUpdate.select('text.' + LEGEND_DESCRIPTION)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForDesc * legendRectSize)
            .text(function (d, i) {
                if (i === 0 && description) {
                    if (description === MSA_RESIDUE) {
                        return description + ' ' + (_msa_residue_vis_curr_res_pos + 1);

                    }
                    return description;
                }
            });


        legend.exit().remove();

        return counter;
    }

    function makeShapeLegend(id, xPos, yPos, shapeScale, label, description) {

        if (!label) {
            throw new Error('legend label is missing');
        }

        let outOfRangeSymbol = ' *';

        if (shapeScale.domain().length > shapeScale.range().length) {
            label += outOfRangeSymbol;
        }

        let counter = 0;

        let legendRectSize = 10;
        let legendSpacing = 4;

        let xCorrectionForLabel = -1;
        let yFactorForLabel = -1.5;
        let yFactorForDesc = -0.5;

        let legend = _baseSvg.selectAll('g.' + id)
            .data(shapeScale.domain());

        let legendEnter = legend.enter().append('g')
            .attr('class', id);

        let fs = _settings.controlsFontSize.toString() + 'px';

        legendEnter.append('path');

        legendEnter.append('text')
            .attr('class', LEGEND)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'normal')
            .style('text-decoration', 'none');

        legendEnter.append('text')
            .attr('class', LEGEND_LABEL)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-decoration', 'none');

        legendEnter.append('text')
            .attr('class', LEGEND_DESCRIPTION)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-decoration', 'none');

        let legendUpdate = legend
            .attr('transform', function (d, i) {
                ++counter;
                let height = legendRectSize;
                let x = xPos;
                let y = yPos + i * height;
                return 'translate(' + x + ',' + y + ')';
            });

        let values = [];

        legendUpdate.select('text.' + LEGEND)
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d) {
                values.push(d);
                return d;
            });

        legendUpdate.select('text.' + LEGEND_LABEL)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForLabel * legendRectSize)
            .text(function (d, i) {
                if (i === 0) {
                    return label;
                }
            });

        legendUpdate.select('text.' + LEGEND_DESCRIPTION)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForDesc * legendRectSize)
            .text(function (d, i) {
                if (i === 0 && description) {
                    if (description === MSA_RESIDUE) {
                        return description + ' ' + (_msa_residue_vis_curr_res_pos + 1);
                    }
                    return description;
                }
            });

        legendUpdate.select('path')
            .attr('transform', function () {
                return 'translate(' + 1 + ',' + 3 + ')'
            })
            .attr('d', d3.symbol()
                .size(function () {
                    return 20;
                })
                .type(function (d, i) {
                    return d3SymbolType(shapeScale(values[i]));
                }))
            .style('fill', 'none')
            .style('stroke', _options.branchColorDefault);


        legend.exit().remove();

        return counter;
    }


    function makeSizeLegend(id, xPos, yPos, sizeScale, scaleType, label, description) {
        if (!label) {
            throw new Error('legend label is missing');
        }
        let linearRangeLabel = ' (range)';
        let isLinearRange = scaleType === LINEAR_SCALE;
        let linearRangeLength = 0;
        if (isLinearRange) {
            label += linearRangeLabel;
            linearRangeLength = sizeScale.domain().length;
        }

        let counter = 0;

        let legendRectSize = 10;
        let legendSpacing = 4;

        let xCorrectionForLabel = -1;
        let yFactorForLabel = -1.5;
        let yFactorForDesc = -0.5;

        let legend = _baseSvg.selectAll('g.' + id)
            .data(sizeScale.domain());

        let legendEnter = legend.enter().append('g')
            .attr('class', id);

        let fs = _settings.controlsFontSize.toString() + 'px';

        legendEnter.append('path');

        legendEnter.append('text')
            .attr('class', LEGEND)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'normal')
            .style('text-decoration', 'none');

        legendEnter.append('text')
            .attr('class', LEGEND_LABEL)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-decoration', 'none');

        legendEnter.append('text')
            .attr('class', LEGEND_DESCRIPTION)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-decoration', 'none');

        let legendUpdate = legend
            .attr('transform', function (d, i) {
                ++counter;
                let height = legendRectSize;
                let x = xPos;
                let y = yPos + i * height;
                return 'translate(' + x + ',' + y + ')';
            });

        let values = [];

        legendUpdate.select('text.' + LEGEND)
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d, i) {
                values.push(d);
                if (isLinearRange) {
                    if (i === 0) {
                        return d + ' (min)';
                    } else if (((linearRangeLength === 2 && i === 1) || (linearRangeLength === 3 && i === 2))) {
                        return d + ' (max)';
                    } else if (linearRangeLength === 3 && i === 1) {
                        return preciseRound(d, _options.decimalsForLinearRangeMeanValue) + ' (mean)';
                    }
                }
                return d;
            });

        legendUpdate.select('text.' + LEGEND_LABEL)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForLabel * legendRectSize)
            .text(function (d, i) {
                if (i === 0) {
                    return label;
                }
            });

        legendUpdate.select('text.' + LEGEND_DESCRIPTION)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForDesc * legendRectSize)
            .text(function (d, i) {
                if (i === 0 && description) {
                    return description;
                }
            });

        legendUpdate.select('path')
            .attr('transform', function () {
                return 'translate(' + 1 + ',' + 3 + ')'
            })
            .attr('d', d3.symbol()
                .size(function (d, i) {
                    let scale = currentZoomScale();
                    return scale * _options.nodeSizeDefault * sizeScale(values[i]);
                })
                .type(function () {
                    return d3SymbolType('circle');
                }))
            .style('fill', 'none')
            .style('stroke', _options.branchColorDefault);

        legend.exit().remove();

        return counter;
    }

    function preciseRound(num, decimals) {
        let t = Math.pow(10, decimals);
        return (Math.round((num * t) + (decimals > 0 ? 1 : 0) * (Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
    }

    function addLegends() {
        let xPos = _options.visualizationsLegendXpos;
        let yPos = _options.visualizationsLegendYpos;
        let xPosIncr = 0;
        let yPosIncr = 0;
        let yPosIncrConst = 0;
        if (_options.visualizationsLegendOrientation === HORIZONTAL) {
            xPosIncr = 130;
        } else if (_options.visualizationsLegendOrientation === VERTICAL) {
            yPosIncr = 10;
            yPosIncrConst = 40;
        } else {
            throw ('unknown direction for legends ' + _options.visualizationsLegendOrientation);
        }
        let label = '';
        let desc = '';
        let counter = 0;
        let scaleType = '';

        if (_showLegends && _legendColorScales[LEGEND_LABEL_COLOR] && _visualizations.labelColor[_currentLabelColorVisualization]) {
            removeColorLegend(LEGEND_LABEL_COLOR);
            label = 'Label Color';
            desc = _currentLabelColorVisualization;

            scaleType = _visualizations.labelColor[_currentLabelColorVisualization].scaleType;
            counter = makeColorLegend(LEGEND_LABEL_COLOR, xPos, yPos, _legendColorScales[LEGEND_LABEL_COLOR], scaleType, label, desc);
            xPos += xPosIncr;
            yPos += ((counter * yPosIncr) + yPosIncrConst);
        } else {
            removeColorLegend(LEGEND_LABEL_COLOR);
        }

        if (_showLegends && _options.showNodeVisualizations && _legendColorScales[LEGEND_NODE_FILL_COLOR] && _visualizations.nodeFillColor[_currentNodeFillColorVisualization]) {
            removeColorLegend(LEGEND_NODE_FILL_COLOR);
            label = 'Node Fill';
            desc = _currentNodeFillColorVisualization;
            scaleType = _visualizations.nodeFillColor[_currentNodeFillColorVisualization].scaleType;

            counter = makeColorLegend(LEGEND_NODE_FILL_COLOR, xPos, yPos, _legendColorScales[LEGEND_NODE_FILL_COLOR], scaleType, label, desc);
            xPos += xPosIncr;
            yPos += ((counter * yPosIncr) + yPosIncrConst);
        } else {
            removeColorLegend(LEGEND_NODE_FILL_COLOR);
        }

        if (_showLegends && _options.showNodeVisualizations && _legendShapeScales[LEGEND_NODE_SHAPE]) {
            label = 'Node Shape';
            desc = _currentNodeShapeVisualization;
            counter = makeShapeLegend(LEGEND_NODE_SHAPE, xPos, yPos, _legendShapeScales[LEGEND_NODE_SHAPE], label, desc);
            xPos += xPosIncr;
            yPos += ((counter * yPosIncr) + yPosIncrConst);
        } else {
            removeShapeLegend(LEGEND_NODE_SHAPE);
        }

        if (_showLegends && _options.showNodeVisualizations && _legendSizeScales[LEGEND_NODE_SIZE] && _visualizations.nodeSize[_currentNodeSizeVisualization]) {
            label = 'Node Size';
            desc = _currentNodeSizeVisualization;
            scaleType = _visualizations.nodeSize[_currentNodeSizeVisualization].scaleType;
            makeSizeLegend(LEGEND_NODE_SIZE, xPos, yPos, _legendSizeScales[LEGEND_NODE_SIZE], scaleType, label, desc);
        } else {
            removeSizeLegend(LEGEND_NODE_SIZE);
        }

    }


    // --------------------------------------------------------------
    // Functions for color picker
    // --------------------------------------------------------------
    function obtainPredefinedColors(name) {
        let twenty = [Array(20).keys()];
        let fifty = [Array(50).keys()];
        let colorScale = null;
        let l = 0;
        if (name === 'category20') {
            l = 20;
            colorScale = d3.scaleOrdinal(SCHEME_CATEGORY20)
                .domain(twenty);
        } else if (name === 'category20b') {
            l = 20;
            colorScale = d3.scaleOrdinal(SCHEME_CATEGORY20B)
                .domain(twenty);
        } else if (name === 'category20c') {
            l = 20;
            colorScale = d3.scaleOrdinal(SCHEME_CATEGORY20C)
                .domain(twenty);
        } else if (name === 'category10') {
            l = 10;
            colorScale = d3.scaleOrdinal(d3.schemeCategory10)
                .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        } else if (name === 'category50') {
            l = 50;
            colorScale = category50()
                .domain(fifty);
        } else if (name === 'category50b') {
            l = 50;
            colorScale = category50b()
                .domain(fifty);
        } else if (name === 'category50c') {
            l = 50;
            colorScale = category50c()
                .domain(fifty);
        } else {
            throw new Error('do not know ' + name);
        }
        let colors = [];
        for (let i = 0; i < l; ++i) {
            colors.push(colorScale(i));
        }
        return colors;
    }

    function addColorPicker(targetScale, legendLabel, legendDescription, clickedName, clickedIndex) {
        _colorPickerData = {};
        _colorPickerData.targetScale = targetScale;
        _colorPickerData.legendLabel = legendLabel;
        _colorPickerData.legendDescription = legendDescription;
        _colorPickerData.clickedName = clickedName;
        _colorPickerData.clickedIndex = clickedIndex;
        _colorPickerData.clickedOrigColor = targetScale(clickedName);
        _showColorPicker = true;
    }

    function removeColorPicker() {
        _showColorPicker = false;
        _colorPickerData = null;
        _baseSvg.selectAll('g.' + COLOR_PICKER).remove();
    }

    function prepareColorsForColorPicker() {
        const DEFAULT_COLORS_FOR_COLORPICKER = [// Red
            '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C', '#FF8A80', '#FF5252', '#FF1744', '#D50000', // Pink
            '#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F', '#FF80AB', '#FF4081', '#F50057', '#C51162', // Purple
            '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C', '#EA80FC', '#E040FB', '#D500F9', '#AA00FF', // Deep Purple
            '#EDE7F6', '#D1C4E9', '#B39DDB', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92', '#B388FF', '#7C4DFF', '#651FFF', '#6200EA', // Indigo
            '#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E', '#8C9EFF', '#536DFE', '#3D5AFE', '#304FFE', // Blue
            '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1', '#82B1FF', '#448AFF', '#2979FF', '#2962FF', // Light Blue
            '#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B', '#80D8FF', '#40C4FF', '#00B0FF', '#0091EA', // Cyan
            '#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064', '#84FFFF', '#18FFFF', '#00E5FF', '#00B8D4', // Teal
            '#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40', '#A7FFEB', '#64FFDA', '#1DE9B6', '#00BFA5', // Green
            '#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20', '#B9F6CA', '#69F0AE', '#00E676', '#00C853', // Light Green
            '#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#558B2F', '#33691E', '#CCFF90', '#B2FF59', '#76FF03', '#64DD17', // Lime
            '#F9FBE7', '#F0F4C3', '#E6EE9C', '#DCE775', '#D4E157', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717', '#F4FF81', '#EEFF41', '#C6FF00', '#AEEA00', // Yellow
            '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17', '#FFFF8D', '#FFFF00', '#FFEA00', '#FFD600', // Amber
            '#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00', '#FFE57F', '#FFD740', '#FFC400', '#FFAB00', // Orange
            '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100', '#FFD180', '#FFAB40', '#FF9100', '#FF6D00', // Deep Orange
            '#FBE9E7', '#FFCCBC', '#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#D84315', '#BF360C', '#FF9E80', '#FF6E40', '#FF3D00', '#DD2C00', // Brown
            '#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723', // Grey
            '#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121', // Blue Grey
            '#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238', // Basic
            '#FFFFFF', '#999999', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF', _options.backgroundColorDefault];
        _colorsForColorPicker = [];

        const dcpl = DEFAULT_COLORS_FOR_COLORPICKER.length;
        for (let dci = 0; dci < dcpl; ++dci) {
            _colorsForColorPicker.push(DEFAULT_COLORS_FOR_COLORPICKER[dci]);
        }

        _usedColorCategories.forEach(function (e) {
            let cs = obtainPredefinedColors(e);
            let csl = cs.length;
            for (let csi = 0; csi < csl; ++csi) {
                _colorsForColorPicker.push(cs[csi]);
            }
        });
    }

    function makeColorPicker(id) {

        let xPos = 0;
        let yPos = 0;

        if (_options.visualizationsLegendOrientation === VERTICAL) {
            xPos = _options.visualizationsLegendXpos + 140;
            yPos = _options.visualizationsLegendYpos - 10;
        } else {
            xPos = _options.visualizationsLegendXpos;
            yPos = _options.visualizationsLegendYpos + 180;
        }

        if (xPos < 20) {
            xPos = 20;
        }
        if (yPos < 20) {
            yPos = 20;
        }

        if (!_colorsForColorPicker) {
            prepareColorsForColorPicker();
        }

        let fs = _settings.controlsFontSize.toString() + 'px';

        let clickedOrigColorIndex = -1;

        let lbls = [];
        for (let ii = 0; ii < _colorsForColorPicker.length; ++ii) {
            lbls[ii] = ii;
            if (clickedOrigColorIndex < 0 && (colorToHex(_colorsForColorPicker[ii]) === colorToHex(_colorPickerData.clickedOrigColor))) {
                clickedOrigColorIndex = ii;
            }
        }

        let colorPickerColors = d3.scaleLinear()
            .domain(lbls)
            .range(_colorsForColorPicker);

        let colorPickerSize = 14;
        let rectSize = 10;

        let xCorrectionForLabel = -1;
        let yFactorForDesc = -0.5;

        let colorPicker = _baseSvg.selectAll('g.' + id)
            .data(colorPickerColors.domain());

        let colorPickerEnter = colorPicker.enter().append('g')
            .attr('class', id);

        colorPickerEnter.append('rect')
            .style('cursor', 'pointer')
            .attr('width', null)
            .attr('height', null)
            .on('click', function (event, d) {
                colorPickerClicked(colorPickerColors(d));
            });

        colorPickerEnter.append('text')
            .attr('class', COLOR_PICKER_LABEL)
            .style('color', _settings.controlsFontColor)
            .style('font-size', fs)
            .style('font-family', _settings.controlsFont)
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-decoration', 'none');

        let colorPickerUpdate = colorPicker
            .attr('transform', function (d, i) {
                if (i >= 234) {
                    i += 4;
                    if (i >= 248) {
                        i += 4;
                    }
                    if (i >= 262) {
                        i += 4;
                    }
                    if (i >= 276) {
                        i += 4;
                    }
                    if (i >= 290) {
                        i += 4;
                    }
                    if (i >= 304) {
                        i += 4;
                    }
                    if (i >= 318) {
                        i += 4;
                    }
                    if (i >= 332) {
                        i += 4;
                    }
                    if (i >= 346) {
                        i += 4;
                    }
                }
                let x = xPos + Math.floor((i / colorPickerSize)) * rectSize;
                let y = yPos + ((i % colorPickerSize) * rectSize);
                return 'translate(' + x + ',' + y + ')';
            });

        colorPickerUpdate.select('rect')
            .attr('width', rectSize)
            .attr('height', rectSize)
            .style('fill', colorPickerColors)
            .style('stroke', function (d, i) {
                if (i === clickedOrigColorIndex) {
                    return COLOR_PICKER_CLICKED_ORIG_COLOR_BORDER_COLOR;
                } else if (i === 263) {
                    return COLOR_PICKER_BACKGROUND_BORDER_COLOR;
                }
                return WHITE;
            });

        colorPickerUpdate.select('text.' + COLOR_PICKER_LABEL)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForDesc * rectSize)
            .text(function (d, i) {
                if (i === 0) {
                    return 'Choose ' + _colorPickerData.legendLabel.toLowerCase() + ' for ' + _colorPickerData.legendDescription.toLowerCase() + ' "' + _colorPickerData.clickedName + '":';
                }
            });

        colorPicker.exit().remove();

        function colorToHex(color) {
            // From http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
            // Convert any CSS color to a hex representation
            let rgba, hex;
            rgba = colorToRGBA(color);
            hex = [0, 1, 2].map(function (idx) {
                return byteToHex(rgba[idx]);
            }).join('');
            return '#' + hex;

            function colorToRGBA(color) {
                let cvs, ctx;
                cvs = document.createElement('canvas');
                cvs.height = 1;
                cvs.width = 1;
                ctx = cvs.getContext('2d');
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 1, 1);
                return ctx.getImageData(0, 0, 1, 1).data;
            }

            function byteToHex(num) {
                return ('0' + num.toString(16)).slice(-2);
            }
        }

    } // makeColorPicker


    function colorPickerClicked(colorPicked) {

        let vis = _visualizations.labelColor[_colorPickerData.legendDescription];
        let mf = vis.mappingFn;

        let scaleType = vis.scaleType;
        if (scaleType === ORDINAL_SCALE) {
            let ord = _colorPickerData.targetScale;
            let domain = ord.domain();
            let range = ord.range();
            let newColorRange = range.slice();
            for (let di = 0, len = range.length; di < len; ++di) {
                let curName = domain[di];
                if (curName !== undefined) {
                    if (curName === _colorPickerData.clickedName) {
                        newColorRange[di] = colorPicked;
                    } else {
                        newColorRange[di] = ord(curName);
                    }
                }
            }
            mf.range(newColorRange);
        } else if (scaleType === LINEAR_SCALE) {
            let lin = _colorPickerData.targetScale;
            let domain = lin.domain();
            let newColorRange = [];
            for (let dii = 0, domainLength = domain.length; dii < domainLength; ++dii) {
                let curName = domain[dii];
                if (curName === _colorPickerData.clickedName) {
                    newColorRange[dii] = colorPicked;
                } else {
                    newColorRange[dii] = lin(curName);
                }
            }
            mf.range(newColorRange);
        }

        update();
    }

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

        if (_settings.enableNodeVisualizations) {
            addLegends();
            if (_showColorPicker) {
                makeColorPicker(COLOR_PICKER);
            }
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
        let gap = _options.nodeLabelGap;

        if (_options.phylogram === true) {
            _yScale = branchLengthScaling(forester.getAllExternalNodes(_root), _w);
        }

        if (_options.circular) {
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

        if (_options.dynahide) {
            _dynahide_counter = 0;
            _dynahide_factor = Math.round(_options.externalNodeFontSize / ((0.8 * _displayHeight) / uncollsed_nodes));
            forester.preOrderTraversal(_root, function (n) {
                n.hide = !n.children && _dynahide_factor >= 2 && (++_dynahide_counter % _dynahide_factor !== 0);
            });
        }

        updateButtonEnabledState();
        if (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) {
            updateLegendButtonEnabledState();
            if (_settings.enableMsaResidueVisualizations) {
                updateMsaResidueVisCurrResPosLabel();
            }
        }

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
            .on('click', _treeFn.clickEvent);


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
            .style('font-family', _options.defaultFont)
            .style('fill-opacity', 0.5);

        nodeEnter.append('text')
            .attr('class', 'bllabel')
            .style('font-family', _options.defaultFont)
            .style('fill-opacity', 0.5);

        nodeEnter.append('text')
            .attr('class', 'conflabel')
            .attr('text-anchor', 'middle')
            .style('font-family', _options.defaultFont);

        nodeEnter.append('text')
            .attr('class', 'brancheventlabel')
            .attr('text-anchor', 'middle')
            .style('font-family', _options.defaultFont);

        // d3 v4+ no longer folds entered nodes into the update selection, so
        // merge them before the shared styling/positioning below.
        node = nodeEnter.merge(node);

        node.select("text.extlabel")
            .style('font-size', function (d) {
                return d.children ? _options.internalNodeFontSize + 'px' : _options.externalNodeFontSize + 'px';
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
                if (_options.circular) {
                    return labelFlip(d) ? 'end' : 'start';
                }
                return d.children ? 'end' : 'start';
            })
            .attr('transform', function (d) {
                if (!_options.circular) {
                    return null;
                }
                // external labels are pulled out to the common outer ring;
                // internal labels sit at their node.
                let off = d.children ? 0 : (_radial.maxRad - radialRadius(d.y));
                return 'rotate(' + labelAngleDeg(d) + ') translate(' + off + ',0)' + (labelFlip(d) ? ' rotate(180)' : '');
            })
            .attr('dy', function (d) {
                if (_options.circular) {
                    return '0.32em';
                }
                return d.children ? 0.3 * _options.internalNodeFontSize + 'px' : 0.3 * _options.externalNodeFontSize + 'px';
            })
            .attr('x', function (d) {
                if (_options.circular) {
                    return labelFlip(d) ? -gap : gap;
                }
                if (!(d.children)) {
                    if (_options.phylogram && _options.alignPhylogram) {
                        return (-_yScale(d.distToRoot) + _w + gap);
                    } else {
                        return gap;
                    }
                } else {
                    return -gap;
                }
            });

        node.select('text.bllabel')
            .style('font-size', _options.branchDataFontSize + 'px')
            .attr('text-anchor', function () {
                return _options.circular ? 'middle' : null;
            })
            .attr('transform', function (d) {
                return _options.circular ? branchLabelTransform(d) : null;
            })
            .attr('dy', '-.25em')
            .attr('x', function (d) {
                if (_options.circular) {
                    return 0;
                }
                if (d.parent) {
                    return (d.parent.y - d.y + 1);
                } else {
                    return 0;
                }
            });

        node.select('text.conflabel')
            .style('font-size', _options.branchDataFontSize + 'px')
            .attr('transform', function (d) {
                return _options.circular ? branchLabelTransform(d) : null;
            })
            .attr('dy', _options.branchDataFontSize)
            .attr('x', function (d) {
                if (_options.circular) {
                    return 0;
                }
                if (d.parent) {
                    return (0.5 * (d.parent.y - d.y));
                } else {
                    return 0;
                }
            });

        node.select('text.brancheventlabel')
            .style('font-size', _options.branchDataFontSize + 'px')
            .attr('transform', function (d) {
                return _options.circular ? branchLabelTransform(d) : null;
            })
            .attr('dy', '-.25em')
            .attr('x', function (d) {
                if (_options.circular) {
                    return 0;
                }
                if (d.parent) {
                    return (0.5 * (d.parent.y - d.y));
                }
            });

        node.select('circle.nodeCircle')
            .attr('r', function (d) {
                if (((_options.showNodeVisualizations && !_options.showNodeEvents) && (makeNodeFillColor(d) === _options.backgroundColorDefault))) {
                    return 0;
                }
                return makeNodeSize(d);
            })
            .style('stroke', function (d) {
                return makeNodeStrokeColor(d);
            })
            .style('stroke-width', _options.branchWidthDefault)
            .style('fill', function (d) {
                return (_options.showNodeVisualizations || _options.showNodeEvents || isNodeFound(d) || isNodeSelected(d)) ? makeNodeFillColor(d) : _options.backgroundColorDefault;
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
                if (!_options.dynahide || !d.hide) {
                    return makeNodeLabel(d);
                }
            });

        nodeUpdate.select('text.bllabel')
            .text(_options.showBranchLengthValues ? makeBranchLengthLabel : null);

        nodeUpdate.select('text.conflabel')
            .text(_options.showConfidenceValues ? makeConfidenceValuesLabel : null);

        nodeUpdate.select('text.brancheventlabel')
            .text(_options.showBranchEvents ? makeBranchEventsLabel : null);

        nodeUpdate.select('path')
            .style('stroke', _options.showNodeVisualizations ? makeVisNodeBorderColor : null)
            .style('stroke-width', _options.branchWidthDefault)
            .style('fill', _options.showNodeVisualizations ? makeVisNodeFillColor : null)
            .style('opacity', _options.nodeVisualizationsOpacity)
            .attr('d', _options.showNodeVisualizations ? makeNodeVisShape : null);

        node.each(function (d) {
            if (d.children) {
                if (!_options.showNodeVisualizations && makeNodeVisShape(d) === null) {
                    d3.select(this).select('path').transition().duration(transitionDuration)
                        .attr('d', function () {
                            return 'M0,0';
                        });
                }
            }
        });

        let nodeExit = node.exit().transition()
            .duration(transitionDuration)
            .attr('transform', function () {
                return nodeTransform(source);
            })
            .remove();

        nodeExit.select('circle')
            .attr('r', 0);

        nodeExit.select('text')
            .style('fill-opacity', 0);

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

        link = linkEnter.merge(link);

        link.transition()
            .duration(transitionDuration)
            .attr('stroke', makeBranchColor)
            .attr('d', elbow);

        link.exit()
            .attr('d', function () {
                let o = {
                    x: source.x, y: source.y
                };
                return elbow({
                    source: o, target: o
                });
            })
            .remove();


        if (_options.phylogram && _options.alignPhylogram && _options.showExternalLabels && (_options.showNodeName || _options.showTaxonomy || _options.showSequence)) {
            let linkExtension = _svgGroup.append("g")
                .selectAll('path')
                .data(links.filter(function (d) {
                    return (!d.target.children && !(_options.dynahide && d.target.hide));
                }));

            linkExtension.enter().insert('path', 'g')
                .attr('class', "link")
                .attr('fill', "none")
                .attr('stroke-width', 1)
                .attr('stroke', _options.branchColorDefault)
                .style('stroke-opacity', 0.25)
                .attr('d', function (d) {
                    return connection(d.target);
                });
        }

        // circular: a thin dashed connector from each external node out to the
        // common label ring (so labels line up like iTOL's aligned display).
        _svgGroup.selectAll('g.aptx-radial-conn').remove();
        if (_options.circular && _options.showExternalLabels) {
            let conn = _svgGroup.insert('g', 'g').attr('class', 'aptx-radial-conn');
            conn.selectAll('line')
                .data(nodes.filter(function (d) {
                    return !d.children && !(_options.dynahide && d.hide);
                }))
                .enter().append('line')
                .attr('stroke', _options.branchColorDefault)
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
    }

    let makeNodeSize = function (node) {

        if ((_options.showNodeEvents && node.events && node.children && (node.events.duplications || node.events.speciations)) || isNodeFound(node) || isNodeSelected(node)) {
            return _options.nodeSizeDefault;
        }

        return ((_options.nodeSizeDefault > 0 && node.parent && !(_options.showNodeVisualizations && node.hasVis)) && ((node.children && _options.showInternalNodes) || ((!node.children) && _options.showExternalNodes)) || (_options.phylogram && node.parent && !node.parent.parent && (!node.branch_length || node.branch_length <= 0))

        ) ? makeVisNodeSize(node, 0.05) : 0;
    };

    let makeBranchWidth = function (link) {
        if (link.target.width) {
            return link.target.width;
        }
        return _options.branchWidthDefault;
    };

    let makeBranchColor = function (link) {

        const n = link.target;
        if (_options.showBranchVisualizations && n != null) {
            if ((_currentLabelColorVisualization === MSA_RESIDUE || _currentNodeFillColorVisualization === MSA_RESIDUE) && isCanDoMsaResidueVisualizations()) {

                let exts = forester.getAllExternalNodes(n);
                let residue = null;
                for (let i = 0, l = exts.length; i < l; ++i) {
                    let ext = exts[i];
                    if (ext.sequences && ext.sequences.length > 0) {
                        let s = ext.sequences[0];
                        if (s.mol_seq && s.mol_seq.value && (s.mol_seq.value.length > _msa_residue_vis_curr_res_pos)) {
                            let res = s.mol_seq.value.charAt(_msa_residue_vis_curr_res_pos).toUpperCase();

                            if (residue != null) {
                                if (residue !== res) {
                                    residue = null;
                                    break;
                                }
                            } else {
                                residue = res;
                            }
                        }
                    }
                }
                if (residue != null && residue !== '-' && residue !== '.' && residue !== '?') {
                    let vis = _visualizations.nodeFillColor[MSA_RESIDUE];
                    return vis.mappingFn ? vis.mappingFn(residue) : vis.mapping[residue];
                }
            } else if ((isAddVisualization2() || isAddVisualization3() || isAddVisualization4()) && (_specialVisualizations != null) && (n.properties != null)) {
                const l = n.properties.length;
                for (let p = 0; p < l; ++p) {
                    if (n.properties[p].ref === _visualizations4_applies_to_ref && n.properties[p].datatype === _visualizations4_property_datatype && n.properties[p].applies_to === _visualizations4_property_applies_to) {
                        if (_currentNodeFillColorVisualization === n.properties[p].value || _currentLabelColorVisualization === n.properties[p].value) {
                            return _visualizations4_color;
                        }
                    } else if (n.properties[p].ref === _visualizations3_applies_to_ref && n.properties[p].datatype === _visualizations3_property_datatype && n.properties[p].applies_to === _visualizations3_property_applies_to) {
                        if (_currentNodeFillColorVisualization === n.properties[p].value || _currentLabelColorVisualization === n.properties[p].value) {
                            return _visualizations3_color;
                        }
                    } else if (n.properties[p].ref === _visualizations2_applies_to_ref && n.properties[p].datatype === _visualizations2_property_datatype && n.properties[p].applies_to === _visualizations2_property_applies_to) {
                        if (_currentNodeFillColorVisualization === n.properties[p].value || _currentLabelColorVisualization === n.properties[p].value) {
                            return _visualizations2_color;
                        }
                    } else if (n.properties[p].ref === 'vipr:PANGO_Lineage' && n.properties[p].datatype === 'xsd:string' && n.properties[p].applies_to === 'node') {
                        let vis = null;
                        if (_visualizations.nodeFillColor[_currentNodeFillColorVisualization]) {
                            vis = _visualizations.nodeFillColor[_currentNodeFillColorVisualization];
                        } else if (_visualizations.nodeFillColor[_currentLabelColorVisualization]) {
                            vis = _visualizations.nodeFillColor[_currentLabelColorVisualization];
                        }
                        if (vis != null) {
                            const color = makeVisColor(n, vis);
                            if (color) {
                                return color;
                            }
                        }
                    } else if (n.properties[p].ref === 'vipr:PANGO_Lineage_L0' && n.properties[p].datatype === 'xsd:string' && n.properties[p].applies_to === 'node') {
                        let vis = null;
                        if (_visualizations.nodeFillColor[_currentNodeFillColorVisualization]) {
                            vis = _visualizations.nodeFillColor[_currentNodeFillColorVisualization];
                        } else if (_visualizations.nodeFillColor[_currentLabelColorVisualization]) {
                            vis = _visualizations.nodeFillColor[_currentLabelColorVisualization];
                        }
                        if (vis != null) {
                            const color = makeVisColor(n, vis);
                            if (color) {
                                return color;
                            }
                        }
                    } else if (n.properties[p].ref === 'vipr:PANGO_Lineage_L1' && n.properties[p].datatype === 'xsd:string' && n.properties[p].applies_to === 'node') {
                        let vis = null;
                        if (_visualizations.nodeFillColor[_currentNodeFillColorVisualization]) {
                            vis = _visualizations.nodeFillColor[_currentNodeFillColorVisualization];
                        } else if (_visualizations.nodeFillColor[_currentLabelColorVisualization]) {
                            vis = _visualizations.nodeFillColor[_currentLabelColorVisualization];
                        }
                        if (vis != null) {
                            const color = makeVisColor(n, vis);
                            if (color) {
                                return color;
                            }
                        }
                    }
                }
            }
        }
        if (!_options.showBranchVisualizations && _options.showBranchColors && link.target.color) {
            let c = link.target.color;
            return 'rgb(' + c.red + ',' + c.green + ',' + c.blue + ')';
        }
        return _options.branchColorDefault;
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
        if (_options.showNodeEvents && phynode.events && phynode.children && (phynode.events.speciations || phynode.events.duplications)) {
            let evColor = makeNodeEventsDependentColor(phynode.events);
            if (evColor !== null) {
                return evColor;
            } else {
                return _options.backgroundColorDefault;
            }
        }
        return makeVisNodeFillColor(phynode);
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
        if (_options.showNodeEvents && phynode.events && phynode.children) {
            let evColor = makeNodeEventsDependentColor(phynode.events);
            if (evColor !== null) {
                return evColor;
            }
        } else if (_options.showNodeVisualizations) {
            return makeVisNodeBorderColor(phynode);
        } else if (_options.showBranchColors && phynode.color) {
            let c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _options.branchColorDefault;
    };

    let makeLabelColor = function (phynode) {
        let foundColor = getFoundColor(phynode);
        if (foundColor) {
            return foundColor;
        }
        if (_currentLabelColorVisualization) {
            let color = makeVisLabelColor(phynode);
            if (color) {
                return color;
            }
        }
        if (_options.showBranchColors && phynode.color) {
            let c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _options.labelColorDefault;
    };

    let makeNodeVisShape = function (node) {
        if (_currentNodeShapeVisualization && _visualizations && _visualizations.nodeShape && _visualizations.nodeShape[_currentNodeShapeVisualization] && !isNodeFound(node) && !isNodeSelected(node) && !(_options.showNodeEvents && (node.events && (node.events.duplications || node.events.speciations)))) {
            let vis = _visualizations.nodeShape[_currentNodeShapeVisualization];
            if (_currentNodeShapeVisualization === MSA_RESIDUE) {

                if (isCanDoMsaResidueVisualizations()) {
                    if (node.sequences && node.sequences.length > 0) {

                        let s = node.sequences[0];
                        if (s.mol_seq && s.mol_seq.value && (s.mol_seq.value.length > _msa_residue_vis_curr_res_pos)) {
                            let res = s.mol_seq.value.charAt(_msa_residue_vis_curr_res_pos).toUpperCase();
                            if (vis.mappingFn) {
                                vis.mappingFn.domain(_basicTreeProperties.molSeqResiduesPerPosition[_msa_residue_vis_curr_res_pos]);
                            }
                            if (vis.mapping) {
                                vis.mapping.domain(_basicTreeProperties.molSeqResiduesPerPosition[_msa_residue_vis_curr_res_pos]);
                            }
                            return produceVis(vis, res);
                        }
                    }
                }
                return null;
            } else {
                if (vis.field) {
                    let fieldValue = node[vis.field];
                    if (fieldValue) {
                        if (vis.isRegex) {
                            for (let key in vis.mapping) {
                                if (vis.mapping.hasOwnProperty(key)) {
                                    let re = new RegExp(key);
                                    if (re && fieldValue.search(re) > -1) {
                                        return produceVis(vis, key);
                                    }
                                }
                            }
                        } else {
                            return produceVis(vis, fieldValue);
                        }
                    }
                } else if (vis.cladePropertyRef && node.properties && node.properties.length > 0) {

                    let ref_name = vis.cladePropertyRef;
                    let propertiesLength = node.properties.length;
                    for (let i = 0; i < propertiesLength; ++i) {
                        let p = node.properties[i];
                        if (p.value && p.ref === ref_name) {
                            if (_settings.valuesToIgnoreForNodeVisualization) {
                                if (p.ref in _settings.valuesToIgnoreForNodeVisualization) {
                                    let ignoreValues = _settings.valuesToIgnoreForNodeVisualization[p.ref];
                                    let arrayLength = ignoreValues.length;
                                    for (let i = 0; i < arrayLength; i++) {
                                        if (p.value === ignoreValues[i]) {
                                            return null;
                                        }
                                    }
                                }
                            }
                            return produceVis(vis, p.value);
                        }
                    }
                }
            }
        }

        return null;

        function produceVis(vis, key) {
            if (vis.mappingFn) {
                if (vis.mappingFn(key)) {
                    return makeShape(node, vis.mappingFn(key));
                }
            } else if (vis.mapping[key]) {
                return makeShape(node, vis.mapping[key]);
            }
            return null;
        }

        function makeShape(node, shape) {
            node.hasVis = true;
            return d3.symbol().type(d3SymbolType(shape)).size(makeVisNodeSize(node))();
        }
    };

    let makeVisNodeFillColor = function (node) {

        if (_options.showNodeVisualizations && _currentNodeFillColorVisualization && _visualizations && _visualizations.nodeFillColor) {

            if (_currentNodeFillColorVisualization === MSA_RESIDUE) {
                return makeMsaResidueVisualizationColor(node, _visualizations.nodeFillColor[MSA_RESIDUE]);
            } else if (_visualizations.nodeFillColor[_currentNodeFillColorVisualization]) {
                let vis = _visualizations.nodeFillColor[_currentNodeFillColorVisualization];
                let color = makeVisColor(node, vis);
                if (color) {
                    return color;
                }
            } else if (node.properties != null) {
                const l = node.properties.length;
                for (let p = 0; p < l; ++p) {
                    if (node.properties[p].ref === _visualizations4_applies_to_ref && node.properties[p].datatype === _visualizations4_property_datatype && node.properties[p].applies_to === _visualizations4_property_applies_to) {
                        if (_currentNodeFillColorVisualization === node.properties[p].value) {
                            return _visualizations4_color;
                        }
                    } else if (node.properties[p].ref === _visualizations3_applies_to_ref && node.properties[p].datatype === _visualizations3_property_datatype && node.properties[p].applies_to === _visualizations3_property_applies_to) {
                        if (_currentNodeFillColorVisualization === node.properties[p].value) {
                            return _visualizations3_color;
                        }
                    } else if (node.properties[p].ref === _visualizations2_applies_to_ref && node.properties[p].datatype === _visualizations2_property_datatype && node.properties[p].applies_to === _visualizations2_property_applies_to) {
                        if (_currentNodeFillColorVisualization === node.properties[p].value) {
                            return _visualizations2_color;
                        }
                    }
                }
            }
        }
        return _options.backgroundColorDefault;
    };

    let makeMsaResidueVisualizationColor = function (node, vis) {
        if (isCanDoMsaResidueVisualizations()) {
            if (node.sequences && node.sequences.length > 0) {
                let s = node.sequences[0];
                if (s.mol_seq && s.mol_seq.value && s.mol_seq.value.length > _msa_residue_vis_curr_res_pos) {
                    let res = s.mol_seq.value.charAt(_msa_residue_vis_curr_res_pos).toUpperCase();
                    if (vis.mappingFn) {
                        vis.mappingFn.domain(_basicTreeProperties.molSeqResiduesPerPosition[_msa_residue_vis_curr_res_pos]);
                        return vis.mappingFn(res);
                    } else if (vis.mapping) {
                        vis.mapping.domain(_basicTreeProperties.molSeqResiduesPerPosition[_msa_residue_vis_curr_res_pos]);
                        return vis.mapping[res];
                    }
                }
            }
        }
        return null;
    };


    let makeVisColor = function (node, vis) {
        if (vis.field) {
            let fieldValue = node[vis.field];
            if (fieldValue) {
                if (vis.isRegex) {
                    for (let key in vis.mapping) {
                        if (vis.mapping.hasOwnProperty(key)) {
                            let re = new RegExp(key);
                            if (re && fieldValue.search(re) > -1) {
                                return produceVis(vis, key);
                            }
                        }
                    }
                } else {
                    return produceVis(vis, fieldValue);
                }
            }
        } else if (vis.cladePropertyRef && node.properties && node.properties.length > 0) {
            let ref_name = vis.cladePropertyRef;
            let propertiesLength = node.properties.length;
            for (let i = 0; i < propertiesLength; ++i) {
                let p = node.properties[i];
                if (p.value && p.ref === ref_name) {
                    if (_settings.valuesToIgnoreForNodeVisualization) {
                        let ignore = _settings.valuesToIgnoreForNodeVisualization;
                        // for (let key in nodeProperties) {
                        if (p.ref in ignore) {
                            let toIgnores = ignore[p.ref];
                            let arrayLength = toIgnores.length;
                            for (let i = 0; i < arrayLength; i++) {
                                if (p.value === toIgnores[i]) {
                                    return null;
                                }
                            }
                        }
                    }
                    return produceVis(vis, p.value);
                }
            }
        }

        return null;

        function produceVis(vis, key) {
            return vis.mappingFn ? vis.mappingFn(key) : vis.mapping[key];
        }
    };

    function addLegend(type, vis) {
        if (vis) {
            _legendColorScales[type] = vis.mappingFn ? vis.mappingFn : null;
        }
    }

    function addLegendForShapes(type, vis) {
        if (vis) {
            _legendShapeScales[type] = vis.mappingFn ? vis.mappingFn : null;
        }
    }

    function addLegendForSizes(type, vis) {
        if (vis) {
            _legendSizeScales[type] = vis.mappingFn ? vis.mappingFn : null;
        }
    }

    function removeLegend(type) {
        _legendColorScales[type] = null;
    }

    function removeLegendForShapes(type) {
        _legendShapeScales[type] = null;
    }

    function removeLegendForSizes(type) {
        _legendSizeScales[type] = null;
    }

    let makeVisNodeBorderColor = function (node) {
        const c = makeVisNodeFillColor(node);
        if (c === _options.backgroundColorDefault) {
            return _options.branchColorDefault
        }
        return c;
    };

    let makeVisLabelColor = function (node) {
        if (_currentLabelColorVisualization === MSA_RESIDUE) {
            return makeMsaResidueVisualizationColor(node, _visualizations.labelColor[MSA_RESIDUE]);
        }
        if (_currentLabelColorVisualization) {
            if (_visualizations && _visualizations.labelColor && _visualizations.labelColor[_currentLabelColorVisualization]) {
                let vis = _visualizations.labelColor[_currentLabelColorVisualization];
                let color = makeVisColor(node, vis);

                if (color) {
                    return color;
                }
            } else if (node.properties != null) {
                const l = node.properties.length;
                for (let p = 0; p < l; ++p) {
                    if (node.properties[p].ref === _visualizations4_applies_to_ref && node.properties[p].datatype === _visualizations4_property_datatype && node.properties[p].applies_to === _visualizations4_property_applies_to) {
                        if (_currentLabelColorVisualization === node.properties[p].value) {
                            return _visualizations4_color;
                        }
                    } else if (node.properties[p].ref === _visualizations3_applies_to_ref && node.properties[p].datatype === _visualizations3_property_datatype && node.properties[p].applies_to === _visualizations3_property_applies_to) {
                        if (_currentLabelColorVisualization === node.properties[p].value) {
                            return _visualizations3_color;
                        }
                    } else if (node.properties[p].ref === _visualizations2_applies_to_ref && node.properties[p].datatype === _visualizations2_property_datatype && node.properties[p].applies_to === _visualizations2_property_applies_to) {
                        if (_currentLabelColorVisualization === node.properties[p].value) {
                            return _visualizations2_color;
                        }
                    }
                }
            }
        }
        return _options.labelColorDefault;
    };

    let makeVisNodeSize = function (node, correctionFactor) {
        if (_options.showNodeVisualizations && _currentNodeSizeVisualization) {
            if (_visualizations && _visualizations.nodeSize && _visualizations.nodeSize[_currentNodeSizeVisualization]) {
                let vis = _visualizations.nodeSize[_currentNodeSizeVisualization];
                let size;
                if (vis.field) {
                    let fieldValue = node[vis.field];
                    if (fieldValue) {
                        if (vis.isRegex) {
                            for (let key in vis.mapping) {
                                if (vis.mapping.hasOwnProperty(key)) {
                                    let re = new RegExp(key);
                                    if (re && fieldValue.search(re) > -1) {
                                        size = produceVis(vis, key, correctionFactor);
                                        if (size) {
                                            return size;
                                        }
                                    }
                                }
                            }
                        } else {
                            size = produceVis(vis, fieldValue, correctionFactor);
                            if (size) {
                                return size;
                            }
                        }
                    }
                } else if (vis.cladePropertyRef && node.properties && node.properties.length > 0) {
                    let ref_name = vis.cladePropertyRef;
                    let propertiesLength = node.properties.length;
                    for (let i = 0; i < propertiesLength; ++i) {
                        let p = node.properties[i];
                        if (p.ref === ref_name && p.value) {
                            size = produceVis(vis, p.value, correctionFactor);
                            if (size) {
                                return size;
                            }
                        }
                    }
                }
            }
        }
        if (correctionFactor) {
            return _options.nodeSizeDefault;
        } else {
            return 2 * _options.nodeSizeDefault * _options.nodeSizeDefault;
        }


        function produceVis(vis, key, correctionFactor) {
            let size;
            if (vis.mappingFn) {
                size = vis.mappingFn(key);
            } else {
                size = vis.mapping[key];
            }
            if (size) {
                if (correctionFactor) {
                    return correctionFactor * size * _options.nodeSizeDefault;
                } else {
                    return size * _options.nodeSizeDefault;
                }
            }
            return null;
        }
    };

    function getFoundColor(phynode) {
        if (_selectedNodes.has(phynode)) {
            return _options.selectedColorDefault;
        } else {
            if (!_options.searchNegateResult) {
                if (_foundNodes0 && _foundNodes1 && _foundNodes0.has(phynode) && _foundNodes1.has(phynode)) {
                    return _options.found0and1ColorDefault;
                } else if (_foundNodes0 && _foundNodes0.has(phynode)) {
                    return _options.found0ColorDefault;
                } else if (_foundNodes1 && _foundNodes1.has(phynode)) {
                    return _options.found1ColorDefault;
                }
            } else if (forester.isHasNodeData(phynode)) {
                if ((_foundNodes0 && !_searchBox0Empty) && (_foundNodes1 && !_searchBox1Empty) && !_foundNodes0.has(phynode) && !_foundNodes1.has(phynode)) {
                    return _options.found0and1ColorDefault;
                } else if ((_foundNodes0 && !_searchBox0Empty) && !_foundNodes0.has(phynode)) {
                    return _options.found0ColorDefault;
                } else if ((_foundNodes1 && !_searchBox1Empty) && !_foundNodes1.has(phynode)) {
                    return _options.found1ColorDefault;
                }
            }
        }
        return null;
    }

    function isNodeFound(phynode) {
        if (!_options.searchNegateResult) {
            if ((_foundNodes0 && _foundNodes0.has(phynode)) || (_foundNodes1 && _foundNodes1.has(phynode))) {
                return true;
            }
        } else if (forester.isHasNodeData(phynode)) {
            if (((_foundNodes0 && !_searchBox0Empty) && !_foundNodes0.has(phynode)) || ((_foundNodes1 && !_searchBox1Empty) && !_foundNodes1.has(phynode))) {
                return true
            }
        }
        return false;
    }

    function isNodeSelected(phynode) {
        return _selectedNodes.has(phynode);
    }

    let makeNodeLabel = function (phynode) {
        if (!_options.showExternalLabels && !(phynode.children)) {
            return null;
        }
        if (!_options.showInternalLabels && (phynode.children)) {
            return null;
        }
        if (!phynode.parent) {
            // Do not show root data
            return null;
        }

        let l = "";
        if (_options.showNodeName && phynode.name) {
            if (_options.shortenNodeNames && phynode.name.length > SHORTEN_NAME_MAX_LENGTH) {
                l = append(l, shortenName(phynode.name, 8));
            } else {
                l = append(l, phynode.name);
            }
        }

        if (_options.showTaxonomy && phynode.taxonomies && phynode.taxonomies.length > 0) {
            let t = phynode.taxonomies[0];
            if (_options.showTaxonomyCode) {
                l = append(l, t.code);
            }
            if (_options.showTaxonomyScientificName) {
                l = append(l, t.scientific_name);
            }
            if (_options.showTaxonomyCommonName) {
                l = appendP(l, t.common_name);
            }
            if (_options.showTaxonomyRank) {
                l = appendP(l, t.rank);
            }
            if (_options.showTaxonomySynonyms) {
                if (t.synonyms && t.synonyms.length > 0) {
                    let syn = t.synonyms;
                    for (let i = 0; i < syn.length; ++i) {
                        l = appendB(l, syn[i]);
                    }
                }
            }
        }
        if (_options.showSequence && phynode.sequences && phynode.sequences.length > 0) {
            let s = phynode.sequences[0];
            if (_options.showSequenceSymbol) {
                l = append(l, s.symbol);
            }
            if (_options.showSequenceName) {
                l = append(l, s.name);
            }
            if (_options.showSequenceGeneSymbol) {
                l = appendP(l, s.gene_name);
            }
            if (_options.showSequenceAccession && s.accession && s.accession.value) {
                l = appendP(l, s.accession.value);
            }
        }


        if (_nodeLabels && phynode.properties) {
            const props_length = phynode.properties.length;
            if (props_length > 0) {
                for (const [key, value] of Object.entries(_nodeLabels)) {
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


        if (_options.showDistributions && phynode.distributions && phynode.distributions.length > 0) {
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


    let makeNodeLabelForSearch = function (phynode) {
        if (!_options.showExternalLabels && !(phynode.children)) {
            return null;
        }
        if (!_options.showInternalLabels && (phynode.children)) {
            return null;
        }

        let l = "";
        if (_options.showNodeName && phynode.name) {
            l = append(l, phynode.name);
        }

        if (_options.showTaxonomy && phynode.taxonomies && phynode.taxonomies.length > 0) {
            let t = phynode.taxonomies[0];
            if (_options.showTaxonomyCode) {
                l = append(l, t.code);
            }
            if (_options.showTaxonomyScientificName) {
                l = append(l, t.scientific_name);
            }
            if (_options.showTaxonomyCommonName) {
                l = append(l, t.common_name);
            }
            if (_options.showTaxonomyRank) {
                l = append(l, t.rank);
            }
            if (_options.showTaxonomySynonyms) {
                if (t.synonyms && t.synonyms.length > 0) {
                    let syn = t.synonyms;
                    for (let i = 0; i < syn.length; ++i) {
                        l = append(l, syn[i]);
                    }
                }
            }
        }
        if (_options.showSequence && phynode.sequences && phynode.sequences.length > 0) {
            let s = phynode.sequences[0];
            if (_options.showSequenceSymbol) {
                l = append(l, s.symbol);
            }
            if (_options.showSequenceName) {
                l = append(l, s.name);
            }
            if (_options.showSequenceGeneSymbol) {
                l = append(l, s.gene_name);
            }
            if (_options.showSequenceAccession && s.accession && s.accession.value) {
                l = append(l, s.accession.value);
            }
        }

        if (_nodeLabels && phynode.properties) {
            const props_length = phynode.properties.length;
            if (props_length > 0) {
                for (const [key, value] of Object.entries(_nodeLabels)) {
                    if (value.selected === true && value.propertyRef) {
                        let prop_text = '';
                        for (let pm = 0; pm < props_length; ++pm) {
                            if (phynode.properties[pm].ref === value.propertyRef && phynode.properties[pm].datatype === 'xsd:string' && phynode.properties[pm].applies_to === 'node') {
                                if (prop_text.length > 0) {
                                    prop_text += ' | '
                                }
                                prop_text += phynode.properties[pm].value;
                            }
                        }
                        l = append(l, prop_text);
                    }
                }
            }
        }

        if (_options.showDistributions && phynode.distributions && phynode.distributions.length > 0) {
            let d = phynode.distributions;
            for (let ii = 0; ii < d.length; ++ii) {
                l = append(l, d[ii].desc);
            }
        }
        console.log(l)
        return l;

        function append(str1, str2) {
            if (str2 && str2.length > 0) {
                if (str1.length > 0) {
                    str1 += (' | ' + str2);
                } else {
                    str1 = str2;
                }
            }
            return str1;
        }
    };


    let makeBranchLengthLabel = function (phynode) {
        if (phynode.branch_length) {
            if (_options.phylogram && _options.minBranchLengthValueToShow && phynode.branch_length < _options.minBranchLengthValueToShow) {
                return;
            }
            return +phynode.branch_length.toFixed(BRANCH_LENGTH_DIGITS_DEFAULT);
        }
    };

    let makeConfidenceValuesLabel = function (phynode) {
        if (phynode.confidences && phynode.confidences.length > 0) {
            let c = phynode.confidences;
            let cl = c.length;
            if (_options.minConfidenceValueToShow) {
                let show = false;
                for (let i = 0; i < cl; ++i) {
                    if (c[i].value >= _options.minConfidenceValueToShow) {
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
    // When _options.circular is on, the cluster's cross-axis position (node.x) is
    // reinterpreted as an angle and its depth position (node.y) as a radius, so the
    // same layout renders as a circular tree. _radial is set per render in update().
    function radialAngle(x) {
        return _radial ? (x / _radial.clusterH) * _radial.angleSpan : 0;
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
        if (_options.circular) {
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
        return radialAngle(d.x) >= Math.PI;
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
        if (_options.circular) {
            let sa = radialAngle(d.source.x), ta = radialAngle(d.target.x);
            let sr = radialRadius(d.source.y), tr = radialRadius(d.target.y);
            let sp = polarXY(sa, sr), mp = polarXY(ta, sr), tp = polarXY(ta, tr);
            let large = Math.abs(ta - sa) > Math.PI ? 1 : 0, sweep = ta > sa ? 1 : 0;
            return 'M' + sp[0] + ',' + sp[1] + 'A' + sr + ',' + sr + ' 0 ' + large + ' ' + sweep + ' ' + mp[0] + ',' + mp[1] + 'L' + tp[0] + ',' + tp[1];
        }
        return 'M' + d.source.y + ',' + d.source.x + 'V' + d.target.x + 'H' + d.target.y;
    };

    let connection = function (n) {
        if (_options.phylogram) {
            let x1 = n.y + 5;
            let y = n.x;
            let x = (n.y - _yScale(n.distToRoot) + _w);
            if ((x - x1) > 5) {
                return 'M' + x1 + ',' + y + 'L' + x + ',' + y;
            }
        }
    };


    function initializeOptions(options) {
        _options = options ? options : {};

        if (_basicTreeProperties.branchLengths) {
            if (_options.phylogram === undefined) {
                _options.phylogram = true;
            }
            if (_options.alignPhylogram === undefined) {
                _options.alignPhylogram = false;
            }
        } else {
            _options.phylogram = false;
            _options.alignPhylogram = false;
        }
        if (_options.phylogram === false) {
            _options.alignPhylogram = false;
        }
        if (_options.circular === undefined) {
            _options.circular = false;
        }
        if (_options.dynahide === undefined) {
            _options.dynahide = true;
        }
        if (_options.searchAinitialValue && (typeof _options.searchAinitialValue === 'string' || _options.searchAinitialValue instanceof String) && _options.searchAinitialValue.trim().length > 0) {
            _options.searchAinitialValue = _options.searchAinitialValue.trim();
            console.log(MESSAGE + 'Setting initial search value for A to: ' + _options.searchAinitialValue);
        } else {
            _options.searchAinitialValue = null;
        }
        if (_options.searchBinitialValue && (typeof _options.searchBinitialValue === 'string' || _options.searchBinitialValue instanceof String) && _options.searchBinitialValue.trim().length > 0) {
            _options.searchBinitialValue = _options.searchBinitialValue.trim();
            console.log(MESSAGE + 'Setting initial search value for B to: ' + _options.searchBinitialValue);
        } else {
            _options.searchBinitialValue = null;
        }
        if (_options.showBranchLengthValues === undefined) {
            _options.showBranchLengthValues = false;
        }
        if (_options.showConfidenceValues === undefined) {
            _options.showConfidenceValues = false;
        }
        if (_options.showNodeName === undefined) {
            _options.showNodeName = true;
        }
        if (_options.showTaxonomy === undefined) {
            _options.showTaxonomy = false;
        }
        if (_options.showTaxonomyCode === undefined) {
            _options.showTaxonomyCode = false;
        }
        if (_options.showTaxonomyScientificName === undefined) {
            _options.showTaxonomyScientificName = false;
        }
        if (_options.showTaxonomyCommonName === undefined) {
            _options.showTaxonomyCommonName = false;
        }
        if (_options.showTaxonomyRank === undefined) {
            _options.showTaxonomyRank = false;
        }
        if (_options.showTaxonomySynonyms === undefined) {
            _options.showTaxonomySynonyms = false;
        }
        if (_options.showSequence === undefined) {
            _options.showSequence = false;
        }
        if (_options.showSequenceSymbol === undefined) {
            _options.showSequenceSymbol = false;
        }
        if (_options.showSequenceName === undefined) {
            _options.showSequenceName = false;
        }
        if (_options.showSequenceGeneSymbol === undefined) {
            _options.showSequenceGeneSymbol = false;
        }
        if (_options.showSequenceAccession === undefined) {
            _options.showSequenceAccession = false;
        }
        if (_options.showDistributions === undefined) {
            _options.showDistributions = false;
        }
        if (_options.showInternalNodes === undefined) {
            _options.showInternalNodes = false;
        }
        if (_options.showExternalNodes === undefined) {
            _options.showExternalNodes = false;
        }
        if (_options.showInternalLabels === undefined) {
            _options.showInternalLabels = false;
        }
        if (_options.showExternalLabels === undefined) {
            _options.showExternalLabels = true;
        }
        if (!_options.branchWidthDefault) {
            _options.branchWidthDefault = BRANCH_WIDTH_DEFAULT;
        }
        if (!_options.branchColorDefault) {
            _options.branchColorDefault = BRANCH_COLOR_DEFAULT;
        }
        if (!_options.labelColorDefault) {
            _options.labelColorDefault = LABEL_COLOR_DEFAULT;
        }
        if (!_options.backgroundColorDefault) {
            _options.backgroundColorDefault = BACKGROUND_COLOR_DEFAULT;
        }
        if (!_options.backgroundColorForPrintExportDefault) {
            _options.backgroundColorForPrintExportDefault = BACKGROUND_COLOR_FOR_PRINT_EXPORT_DEFAULT;
        }
        if (!_options.found0ColorDefault) {
            _options.found0ColorDefault = FOUND0_COLOR_DEFAULT;
        }
        if (!_options.found1ColorDefault) {
            _options.found1ColorDefault = FOUND1_COLOR_DEFAULT;
        }
        if (!_options.selectedColorDefault) {
            _options.selectedColorDefault = SELECTED_COLOR_DEFAULT;
        }
        if (!_options.found0and1ColorDefault) {
            _options.found0and1ColorDefault = FOUND0AND1_COLOR_DEFAULT;
        }
        if (!_options.defaultFont) {
            _options.defaultFont = FONT_DEFAULTS;
        }
        if (!_options.nodeSizeDefault) {
            _options.nodeSizeDefault = NODE_SIZE_DEFAULT_DEFAULT;
        }
        if (!_options.externalNodeFontSize) {
            _options.externalNodeFontSize = EXTERNAL_NODE_FONT_SIZE_DEFAULT;
        }
        if (!_options.internalNodeFontSize) {
            _options.internalNodeFontSize = INTERNAL_NODE_FONT_SIZE_DEFAULT;
        }
        if (!_options.branchDataFontSize) {
            _options.branchDataFontSize = BRANCH_DATA_FONT_SIZE_DEFAULT;
        }
        if (!_options.nodeLabelGap) {
            _options.nodeLabelGap = NODE_LABEL_GAP_DEFAULT;
        }
        if (!_options.minBranchLengthValueToShow) {
            _options.minBranchLengthValueToShow = null;
        }
        if (_options.minConfidenceValueToShow === undefined) {
            _options.minConfidenceValueToShow = null;
        }
        if (_options.searchIsCaseSensitive === undefined) {
            _options.searchIsCaseSensitive = false;
        }
        if (_options.searchIsPartial === undefined) {
            _options.searchIsPartial = true;
        }
        _options.searchNegateResult = false;
        if (_options.searchUsesRegex === undefined) {
            _options.searchUsesRegex = false;
        }
        if (_options.searchProperties === undefined) {
            _options.searchProperties = false;
        }
        if (_options.alignPhylogram === undefined) {
            _options.alignPhylogram = false;
        }
        if (_options.showNodeEvents === undefined) {
            _options.showNodeEvents = false;
        }
        if (_options.showBranchEvents === undefined) {
            _options.showBranchEvents = false;
        }
        if (_options.showNodeVisualizations === undefined) {
            _options.showNodeVisualizations = false;
        }
        if (_options.showBranchVisualizations === undefined) {
            _options.showBranchVisualizations = false;
        }
        if (_options.nodeVisualizationsOpacity === undefined) {
            _options.nodeVisualizationsOpacity = NODE_VISUALIZATIONS_OPACITY_DEFAULT;
        }
        if (_options.showBranchColors === undefined) {
            _options.showBranchColors = true;
        }
        if (_options.decimalsForLinearRangeMeanValue === undefined) {
            _options.decimalsForLinearRangeMeanValue = DECIMALS_FOR_LINEAR_RANGE_MEAN_VALUE_DEFAULT;
        }
        if (_options.treeName) {
            _options.treeName = _options.treeName.trim().replace(/\W+/g, '_');
        } else if (_treeData.name) {
            _options.treeName = _treeData.name.trim().replace(/\W+/g, '_');
        } else {
            _options.treeName = null;
        }
        if (!_options.nameForNhDownload) {
            if (_options.treeName) {
                _options.nameForNhDownload = _options.treeName + NH_SUFFIX;
            } else {
                _options.nameForNhDownload = NAME_FOR_NH_DOWNLOAD_DEFAULT;
            }
        }
        if (!_options.nameForPhyloXmlDownload) {
            if (_options.treeName) {
                _options.nameForPhyloXmlDownload = _options.treeName + XML_SUFFIX;
            } else {
                _options.nameForPhyloXmlDownload = NAME_FOR_PHYLOXML_DOWNLOAD_DEFAULT;
            }
        }
        if (!_options.nameForPngDownload) {
            if (_options.treeName) {
                _options.nameForPngDownload = _options.treeName + PNG_SUFFIX;
            } else {
                _options.nameForPngDownload = NAME_FOR_PNG_DOWNLOAD_DEFAULT;
            }
        }
        if (!_options.nameForSvgDownload) {
            if (_options.treeName) {
                _options.nameForSvgDownload = _options.treeName + SVG_SUFFIX;
            } else {
                _options.nameForSvgDownload = NAME_FOR_SVG_DOWNLOAD_DEFAULT;
            }
        }
        if (_options.treeName) {
            _options.nameForFastaDownload = _options.treeName + FASTA_SUFFIX;
        } else {
            _options.nameForFastaDownload = NAME_FOR_FASTA_DOWNLOAD_DEFAULT;
        }
        if (!_options.visualizationsLegendXpos) {
            _options.visualizationsLegendXpos = VISUALIZATIONS_LEGEND_XPOS_DEFAULT;
        }
        if (!_options.visualizationsLegendYpos) {
            _options.visualizationsLegendYpos = VISUALIZATIONS_LEGEND_YPOS_DEFAULT;
        }
        _options.visualizationsLegendXposOrig = _options.visualizationsLegendXpos;
        _options.visualizationsLegendYposOrig = _options.visualizationsLegendYpos;
        if (!_options.visualizationsLegendOrientation) {
            _options.visualizationsLegendOrientation = VISUALIZATIONS_LEGEND_ORIENTATION_DEFAULT;
        }

        _options.externalNodeFontSize = parseInt(_options.externalNodeFontSize);
        _options.internalNodeFontSize = parseInt(_options.internalNodeFontSize);
        _options.branchDataFontSize = parseInt(_options.branchDataFontSize);
    }

    function initializeSettings(settings) {
        _settings = settings ? settings : {};

        if (!_settings.controls1Width) {
            _settings.controls1Width = CONTROLS_1_WIDTH_DEFAULT;
        }
        if (!_settings.rootOffset) {
            _settings.rootOffset = ROOTOFFSET_DEFAULT;
        }

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
        if (!_settings.controlsFontSize) {
            _settings.controlsFontSize = CONTROLS_FONT_SIZE_DEFAULT;
        }
        if (!_settings.controlsFontColor) {
            _settings.controlsFontColor = CONTROLS_FONT_COLOR_DEFAULT;
        }
        if (!_settings.controlsFont) {
            _settings.controlsFont = CONTROLS_FONT_DEFAULTS;
        }
        if (!_settings.controlsBackgroundColor) {
            _settings.controlsBackgroundColor = CONTROLS_BACKGROUND_COLOR_DEFAULT;
        }
        if (!_settings.controls0) {
            _settings.controls0 = CONTROLS_0;
        }
        if (!_settings.controls0Left) {
            _settings.controls0Left = CONTROLS_0_LEFT_DEFAULT;
        }
        if (!_settings.controls0Top) {
            _settings.controls0Top = CONTROLS_0_TOP_DEFAULT;
        }
        if (!_settings.controls1Top) {
            _settings.controls1Top = CONTROLS_1_TOP_DEFAULT;
        }
        if (!_settings.controls1) {
            _settings.controls1 = CONTROLS_1;
        }
        if (_settings.enableDownloads === undefined) {
            _settings.enableDownloads = false;
        }
        if (_settings.enableBranchVisualizations === undefined) {
            _settings.enableBranchVisualizations = false;
        }
        if (_settings.enableNodeVisualizations === undefined) {
            _settings.enableNodeVisualizations = false;
        }
        if (_settings.nhExportWriteConfidences === undefined) {
            _settings.nhExportWriteConfidences = false;
        }
        if (_settings.textFieldHeight === undefined) {
            _settings.textFieldHeight = TEXT_INPUT_FIELD_DEFAULT_HEIGHT;
        }
        if (_settings.showBranchColorsButton === undefined) {
            _settings.showBranchColorsButton = false;
        }
        if (_settings.showNodeNameButton === undefined) {
            _settings.showNodeNameButton = true;
        }
        if (_settings.showTaxonomyButton === undefined) {
            _settings.showTaxonomyButton = true;
        }
        if (_settings.showSequenceButton === undefined) {
            _settings.showSequenceButton = true;
        }
        if (_settings.showDynahideButton === undefined) {
            _settings.showDynahideButton = _basicTreeProperties.externalNodesCount > 20;
        }
        if (_settings.showShortenNodeNamesButton === undefined) {
            _settings.showShortenNodeNamesButton = _basicTreeProperties.longestNodeName > SHORTEN_NAME_MAX_LENGTH;
        }
        if (_settings.showExternalLabelsButton === undefined) {
            _settings.showExternalLabelsButton = true;
        }
        if (_settings.showInternalLabelsButton === undefined) {
            _settings.showInternalLabelsButton = true;
        }
        if (_settings.showExternalNodesButton === undefined) {
            _settings.showExternalNodesButton = true;
        }
        if (_settings.showInternalNodesButton === undefined) {
            _settings.showInternalNodesButton = true;
        }
        if (_settings.showShortenNodeNamesButton === undefined) {
            _settings.showShortenNodeNamesButton = _basicTreeProperties.longestNodeName > SHORTEN_NAME_MAX_LENGTH;
        }
        if (_settings.showShortenNodeNamesButton === undefined) {
            _settings.showShortenNodeNamesButton = _basicTreeProperties.longestNodeName > SHORTEN_NAME_MAX_LENGTH;
        }
        if (_settings.nhExportReplaceIllegalChars === undefined) {
            _settings.nhExportReplaceIllegalChars = true;
        }
        if (_settings.enableSubtreeDeletion === undefined) {
            _settings.enableSubtreeDeletion = true;
        }
        if (_settings.enableAccessToDatabases === undefined) {
            _settings.enableAccessToDatabases = true;
        }
        _settings.enableMsaResidueVisualizations = _settings.enableMsaResidueVisualizations === true && _basicTreeProperties.alignedMolSeqs === true && _basicTreeProperties.maxMolSeqLength > 1;
        if (_settings.zoomToFitUponWindowResize === undefined) {
            _settings.zoomToFitUponWindowResize = true;
        }
        if (_settings.dynamicallyAddNodeVisualizations === undefined) {
            _settings.dynamicallyAddNodeVisualizations = false;
        }
        if (_settings.propertiesToIgnoreForNodeVisualization === undefined) {
            _settings.propertiesToIgnoreForNodeVisualization = null;
        }
        if (_settings.valuesToIgnoreForNodeVisualization === undefined) {
            _settings.valuesToIgnoreForNodeVisualization = null;
        }
        if (_settings.groupSpecies === undefined) {
            _settings.groupSpecies = null;
        }
        if (_settings.groupYears === undefined) {
            _settings.groupYears = null;
        }
        if (_settings.enableSpecialVisualizations2 === undefined) {
            _settings.enableSpecialVisualizations2 = false;
        }
        if (_settings.enableSpecialVisualizations3 === undefined) {
            _settings.enableSpecialVisualizations3 = false;
        }
        if (_settings.enableSpecialVisualizations4 === undefined) {
            _settings.enableSpecialVisualizations4 = false;
        }
        if (_settings.showSearchPropertiesButton === undefined) {
            _settings.showSearchPropertiesButton = true;
        }
        if (_settings.allowManualNodeSelection === undefined) {
            _settings.allowManualNodeSelection = false;
        }
        if (_settings.orderTree === undefined) {
            _settings.orderTree = false;
        }

        _settings.controlsFontSize = parseInt(_settings.controlsFontSize);

        intitializeDisplaySize();

        if (!_settings.controls1Left) {
            // this needs to be after intitializeDisplaySize()
            _settings.controls1Left = _displayWidth - PANEL_WIDTH;
        }
    }


    function intitializeDisplaySize() {
        if (_settings.enableDynamicSizing) {
            if (_baseSvg) {
                _displayHeight = _baseSvg.attr('height');
                _displayWidth = _baseSvg.attr('width');
            } else {
                let element = d3.select(_id).node();
                let width = element.getBoundingClientRect().width - WIDTH_OFFSET;
                let top = element.getBoundingClientRect().top;
                _displayHeight = window.innerHeight - (top + HEIGHT_OFFSET);
                _displayWidth = width;
            }
        } else {
            _displayHeight = _settings.displayHeight;
            _displayWidth = _settings.displayWidth;
        }
    }

    function mouseDown(event) {
        if (event.which === 1 && (event.altKey || event.shiftKey)) {
            if ((_showLegends && (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) && (_legendColorScales[LEGEND_LABEL_COLOR] || (_options.showNodeVisualizations && (_legendColorScales[LEGEND_NODE_FILL_COLOR] || _legendShapeScales[LEGEND_NODE_SHAPE] || _legendSizeScales[LEGEND_NODE_SIZE]))))) {
                moveLegendWithMouse(event);
            }
        }
    }

    function deleteValuesFromNodeProperties(valuesToIgnoreForNodeVisualization, nodeProperties) {
        for (let key in nodeProperties) {
            if (key in valuesToIgnoreForNodeVisualization) {
                let ignoreValues = valuesToIgnoreForNodeVisualization[key];
                let arrayLength = ignoreValues.length;
                for (let i = 0; i < arrayLength; i++) {
                    let ignoreValue = ignoreValues[i];
                    let deleted = nodeProperties[key].delete(ignoreValue);
                    if (deleted === true) {
                        console.log(MESSAGE + 'Ignoring \"' + key + '=' + ignoreValue + '\" for visualizations');
                    }
                }
            }
        }
    }


    function filterValues(phy, source, target, pass) {

        forester.preOrderTraversalAll(phy, function (n) {
            if (n.properties && n.properties.length > 0) {
                const propertiesLength = n.properties.length;
                for (let i = 0; i < propertiesLength; ++i) {
                    const property = n.properties[i];
                    if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === 'node') {
                        if (property.ref === source) {
                            const value = property.value;
                            const l = pass.length;
                            let present = false;
                            for (let j = 0; j < l; j++) {
                                if (value === pass[j]) {
                                    present = true;
                                    break;
                                }
                            }
                            if (present) {
                                const newProp = {};
                                newProp.ref = target;
                                newProp.value = value;
                                newProp.datatype = property.datatype;
                                newProp.applies_to = property.applies_to;
                                n.properties.push(newProp);
                            }
                        }
                    }
                }
            }
        });
    }

    function initialize() {
        initializeGui();

        _svgGroup = _baseSvg.append('g');

        if (_settings.orderTree) {
            orderSubtree(_root, true);
        }
        if (_options.searchAinitialValue) {
            search0();
        }
        if (_options.searchBinitialValue) {
            search1();
        }

        if (_options.initialNodeFillColorVisualization || _options.initialLabelColorVisualization) {
            initializeInitialVisualization();
        }

        update(null, 0);

        zoomToFit();

        updateNodeVisualizationsAndLegends(_root);
        search0();
        search1();
    }

    archaeopteryx.launch = function (id, phylo, options, settings, nodeVisualizations, nodeLabels, specialVisualizations) {


        if (phylo === undefined || phylo === null) {
            console.log(ERROR + 'input tree is undefined or null');
            alert(ERROR + 'input tree is undefined or null');
            return;
        }
        if ((!phylo.children) || (phylo.children.length < 1)) {
            console.log(ERROR + 'input tree is empty or illegally formatted');
            alert(ERROR + 'input tree is empty or illegally formatted');
            return;
        }

        _treeData = phylo;
        _id = id;
        _zoomListener = d3.zoom()
            .scaleExtent([0.1, 10])
            .filter(function (event) {
                // Reserve the shift key for moving the legend, not zoom/pan.
                return !event.shiftKey;
            })
            .on('zoom', zoom);
        _basicTreeProperties = forester.collectBasicTreeProperties(_treeData);
        _options_orig = structuredClone(_options);

        if (settings.filterValues) {
            settings.filterValues.forEach(function (e) {
                if (e && e.source && e.target && e.pass && e.pass.length > 0) {
                    console.log(MESSAGE + ' Filtering values from \"' + e.source + '\" to \"' + e.target + ', allowed values ' + e.pass);
                    filterValues(_treeData, e.source, e.target, e.pass);
                }
            });
        }

        if (nodeVisualizations) {
            _nodeVisualizations = nodeVisualizations;
        }
        if (nodeLabels) {
            _nodeLabels = nodeLabels;
        }


        if (specialVisualizations) {
            _specialVisualizations = specialVisualizations;
        }


        initializeOptions(options);
        initializeSettings(settings);


        if (settings.enableNodeVisualizations) {
            if (settings.enableMsaResidueVisualizations && (_basicTreeProperties.alignedMolSeqs === true) && (_basicTreeProperties.maxMolSeqLength && _basicTreeProperties.maxMolSeqLength > 1)) {
                if (_nodeVisualizations == null) {
                    _nodeVisualizations = {};
                }
                _nodeVisualizations[MSA_RESIDUE] = {
                    label: MSA_RESIDUE,
                    description: '',
                    field: null,
                    cladeRef: 'na',
                    regex: false,
                    shapes: ['square', 'diamond', 'triangle-up', 'triangle-down', 'circle', 'cross'],
                    colors: 'na',
                    sizes: null
                };
            }

            if (_settings.dynamicallyAddNodeVisualizations === true) {
                let refsSet = forester.collectPropertyRefs(_treeData, 'node', false);
                let re = new RegExp('.*:(.+)'); // For extracting the substring after the ':'

                refsSet.forEach(function (value) {
                    let arr = re.exec(value);
                    let propertyName = arr[1]; // The substring after the ':'

                    if ((!_nodeVisualizations.hasOwnProperty(propertyName)) && (!_settings.propertiesToIgnoreForNodeVisualization || (_settings.propertiesToIgnoreForNodeVisualization.indexOf(propertyName) < 0))) {

                        _nodeVisualizations[propertyName] = {
                            label: propertyName,
                            description: 'the ' + propertyName,
                            field: null,
                            cladeRef: value,
                            regex: false,
                            shapes: ['square', 'diamond', 'triangle-up', 'triangle-down', 'cross', 'circle'],
                            colors: 'category50',
                            sizes: null
                        };
                        console.log(MESSAGE + 'Dynamically added property: ' + value + ' as ' + propertyName);
                    }
                });
            }

            let nodeProperties = forester.collectProperties(_treeData, 'node', false);
            if (settings.valuesToIgnoreForNodeVisualization) {
                deleteValuesFromNodeProperties(settings.valuesToIgnoreForNodeVisualization, nodeProperties);
            }
            initializeNodeVisualizations(nodeProperties);
        }

        createGui();

        if (settings.enableNodeVisualizations || settings.enableBranchVisualizations) {
            d3.select(window)
                .on("mousedown", mouseDown);
        }

        _baseSvg = d3.select(id).append('svg')
            .attr('width', _displayWidth)
            .attr('height', _displayHeight)
            .style('border', function () {
                if (_settings.border) {
                    return _settings.border;
                } else {
                    return '';
                }
            })
            .call(_zoomListener);

        if (_settings.enableDynamicSizing) {
            d3.select(window)
                .on('resize', function () {
                    let element = d3.select(_id).node();
                    let width = element.getBoundingClientRect().width - WIDTH_OFFSET;
                    let top = element.getBoundingClientRect().top;
                    let height = window.innerHeight - (top + HEIGHT_OFFSET);

                    _baseSvg.style('overflow', 'scroll !important;');

                    _baseSvg.attr('width', width);
                    _baseSvg.attr('height', height);
                    if ((_settings.zoomToFitUponWindowResize === true) && (_zoomed_x_or_y === false) && (Math.abs(currentZoomScale() - 1.0) < 0.001)) {
                        zoomToFit();
                    }
                    if (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) {
                        let c1 = byId(_settings.controls1);
                        if (c1) {
                            setStyles(c1, {
                                'left': width - PANEL_WIDTH
                            });
                        }
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
        _maxLabelLength = _options.nodeLabelGap;
        forester.preOrderTraversal(_root, function (d) {
            if (!d.children) {
                let l = makeNodeLabel(d);
                if (l) {
                    _maxLabelLength = Math.max(l.length, _maxLabelLength);
                }
            }
        });
    }


    function removeTooltips() {
        if (_svgGroup != null) {
            _svgGroup.selectAll('.tooltipElem').remove();
        }
    }


    function getClickEventListenerNode(tree) {

        function nodeClick() {

            if (_showColorPicker === true) {
                removeColorPicker();
                update();
            }

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

                showNodeDataDialog(title, text, (_settings.controlsFontSize + 4).toString() + 'px', _settings.controlsFont, 260, 300);

                update();
            }

            function listExternalNodeData(node) {

                let addSep = function (t) {
                    if (t.length > 0) {
                        t += ', ';
                    }
                    return t;
                };
                let addSepSame = function (t) {
                    if (t.length > 0) {
                        t += ' ';
                    }
                    return t;
                };
                let text_all = '';

                let ext_nodes = forester.getAllExternalNodes(node).reverse();

                let title = 'External Node Data for ' + ext_nodes.length + ' Nodes';

                for (let j = 0, l = ext_nodes.length; j < l; ++j) {
                    let text = '';
                    let n = ext_nodes[j];
                    if (_options.showNodeName && n.name) {
                        text += n.name
                    }

                    if (_nodeLabels && n.properties) {
                        const sorted_properties = n.properties.concat().sort();
                        const props_length = sorted_properties.length;
                        if (props_length > 0) {
                            let properties_text = '';
                            for (const [key, value] of Object.entries(_nodeLabels)) {
                                if (value.selected === true && value.propertyRef) {
                                    let prev_propertyRef = null;
                                    for (let pm = 0; pm < props_length; ++pm) {
                                        if (sorted_properties[pm].ref === value.propertyRef && sorted_properties[pm].applies_to === 'node') {
                                            if (value.propertyRef === prev_propertyRef) {
                                                properties_text = addSepSame(properties_text);
                                            } else {
                                                prev_propertyRef = value.propertyRef;
                                                properties_text = addSep(properties_text);
                                            }
                                            properties_text += sorted_properties[pm].value;
                                        }
                                    }
                                }
                            }
                            if (properties_text.length > 0) {
                                text = addSep(text);
                                text += properties_text;
                            }
                        }
                    }

                    if (_options.showTaxonomy && n.taxonomies) {
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
                            if (_options.showTaxonomyCode && t.code) {
                                tax_text = addSep(tax_text);
                                tax_text += t.code;
                            }
                            if (_options.showTaxonomyScientificName && t.scientific_name) {
                                tax_text = addSep(tax_text);
                                tax_text += t.scientific_name;
                            }
                            if (_options.showTaxonomyCommonName && t.common_name) {
                                tax_text = addSep(tax_text);
                                tax_text += t.common_name;
                            }
                            if (_options.showTaxonomyRank && t.rank) {
                                tax_text = addSep(tax_text);
                                tax_text += t.rank;
                            }
                        }
                        text = addSep(text);
                        text += tax_text;
                    }
                    if (_options.showSequence && n.sequences) {
                        let seq_text = '';
                        for (let i = 0; i < n.sequences.length; ++i) {
                            let s = n.sequences[i];
                            if (_options.showSequenceAccession && s.accession) {
                                if (s.accession.source) {
                                    seq_text = addSep(seq_text);
                                    seq_text += '[' + s.accession.source + ']:' + s.accession.value;
                                } else {
                                    seq_text = addSep(seq_text);
                                    seq_text += s.accession.value;
                                }
                            }
                            if (_options.showSequenceSymbol && s.symbol) {
                                seq_text = addSep(seq_text);
                                seq_text += s.symbol;
                            }
                            if (_options.showSequenceName && s.name) {
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
                        text_all += text + '<br>';
                    }
                }

                showNodeDataDialog(title, text_all, (_settings.controlsFontSize + 1).toString() + 'px', MOLSEQ_FONT_DEFAULTS, 400, 260);

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

            function downloadExternalNodeData(node) {

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
                    if (_options.showNodeName && n.name) {
                        text += n.name
                    }

                    if (_nodeLabels && n.properties && (n.properties.length > 0)) {
                        let properties_text = '';
                        const sorted_properties = n.properties.concat().sort();
                        const props_length = sorted_properties.length;
                        if (props_length > 0) {
                            for (const [key, value] of Object.entries(_nodeLabels)) {
                                if (value.selected === true && value.propertyRef) {
                                    let prev_property_ref = null;
                                    for (let pm = 0; pm < props_length; ++pm) {
                                        if (sorted_properties[pm].ref === value.propertyRef && sorted_properties[pm].applies_to === 'node') {
                                            if (sorted_properties[pm].ref === prev_property_ref) {
                                                properties_text = addSepSame(properties_text);
                                            } else {
                                                prev_property_ref = sorted_properties[pm].ref;
                                                properties_text = addSep(properties_text);
                                            }
                                            properties_text += sorted_properties[pm].value;
                                        }
                                    }
                                }
                            }
                        }
                        if (properties_text.length > 0) {
                            text = addSep(text);
                            text += properties_text;
                        }
                    }

                    if (_options.showTaxonomy && n.taxonomies) {
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
                            if (_options.showTaxonomyCode && t.code) {
                                tax_text = addSep(tax_text);
                                tax_text += t.code;
                            }
                            if (_options.showTaxonomyScientificName && t.scientific_name) {
                                tax_text = addSep(tax_text);
                                tax_text += t.scientific_name;
                            }
                            if (_options.showTaxonomyCommonName && t.common_name) {
                                tax_text = addSep(tax_text);
                                tax_text += t.common_name;
                            }
                            if (_options.showTaxonomyRank && t.rank) {
                                tax_text = addSep(tax_text);
                                tax_text += t.rank;
                            }
                        }
                        text = addSep(text);
                        text += tax_text;
                    }
                    if (_options.showSequence && n.sequences) {
                        let seq_text = '';
                        for (let i = 0; i < n.sequences.length; ++i) {
                            let s = n.sequences[i];
                            if (_options.showSequenceAccession && s.accession) {
                                if (s.accession.source) {
                                    seq_text = addSep(seq_text);
                                    seq_text += '[' + s.accession.source + ']:' + s.accession.value;
                                } else {
                                    seq_text = addSep(seq_text);
                                    seq_text += s.accession.value;
                                }
                            }
                            if (_options.showSequenceSymbol && s.symbol) {
                                seq_text = addSep(seq_text);
                                seq_text += s.symbol;
                            }
                            if (_options.showSequenceName && s.name) {
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
                } else if (node.sequences) {
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
                } else if (node.name) {
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
                    alert("Don't know how to interpret sequence accession \'" + accessionValue + "\'");
                }


            }


            function listMolecularSequences(node) {

                let text_all = forester.getMolecularSequencesAsFasta(node, '<br>');

                let ext_nodes = forester.getAllExternalNodes(node);
                let title = 'Sequences in for ' + ext_nodes.length + ' Nodes';


                showNodeDataDialog(title, text_all, (_settings.controlsFontSize - 1).toString() + 'px', MOLSEQ_FONT_DEFAULTS, 400, 260);

                update();
            }

            function goToSubTree(node) {
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
                        updateNodeVisualizationsAndLegends(_root);
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

            let rectWidth = 130;
            let rectHeight = 260;

            removeTooltips();

            d3.select(this).append('rect')
                .attr('class', 'tooltipElem')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', rectWidth)
                .attr('height', rectHeight)
                .attr('rx', 10)
                .attr('ry', 10)
                .style('fill-opacity', 0.9)
                .style('fill', NODE_TOOLTIP_BACKGROUND_COLOR);

            let rightPad = 10;
            let topPad = 20;
            let textSum = 0;
            let textInc = 20;

            let fs = _settings.controlsFontSize.toString() + 'px';

            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', 'Helvetica')
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent) {
                        textSum += textInc;
                        return 'Display Node Data';
                    }
                })
                .on('click', function (event, d) {
                    displayNodeData(d);
                });

            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', _settings.controlsFont)
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent && d.parent.parent) {
                        textSum += textInc;
                        return 'Go to Subtree';
                    }
                })
                .on('click', function (event, d) {
                    goToSubTree(d);
                });

            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', _settings.controlsFont)
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent) {
                        if (d.children) {
                            textSum += textInc;
                            return 'Swap Descendants';
                        }
                    }
                })
                .on('click', function (event, d) {
                    swapChildren(d);
                    update();
                });

            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', _settings.controlsFont)
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent) {
                        if (d.children) {
                            textSum += textInc;
                            return 'Order Subtree';
                        }
                    }
                })
                .on('click', function (event, d) {
                    if (!_treeFn.visData) {
                        _treeFn.visData = {};
                    }
                    if (_treeFn.visData.order === undefined) {
                        _treeFn.visData.order = true;
                    }
                    orderSubtree(d, _treeFn.visData.order);
                    _treeFn.visData.order = !_treeFn.visData.order;
                    update(null, 0);
                });


            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', _settings.controlsFont)
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (!_in_subtree && d.parent && d.parent.parent && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
                        textSum += textInc;
                        return 'Reroot';
                    }
                })
                .on('click', function (event, d) {
                    forester.reRoot(tree, d, -1);
                    zoomToFit();
                });

            if (_settings.allowManualNodeSelection) {
                d3.select(this).append('text')
                    .attr('class', 'tooltipElem tooltipElemText')
                    .attr('y', topPad + textSum)
                    .attr('x', +rightPad)
                    .style('text-align', 'left')
                    .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                    .style('font-size', fs)
                    .style('font-family', 'Helvetica')
                    .style('font-style', 'normal')
                    .style('font-weight', 'bold')
                    .style('text-decoration', 'none')
                    .text(function (d) {
                        textSum += textInc;
                        return 'Select/Deselect Node';

                    })
                    .on('click', function (event, d) {
                        selectDeselectNode(d);
                    });
                d3.select(this).append('text')
                    .attr('class', 'tooltipElem tooltipElemText')
                    .attr('y', topPad + textSum)
                    .attr('x', +rightPad)
                    .style('text-align', 'left')
                    .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                    .style('font-size', fs)
                    .style('font-family', 'Helvetica')
                    .style('font-style', 'normal')
                    .style('font-weight', 'bold')
                    .style('text-decoration', 'none')
                    .text(function (d) {
                        textSum += textInc;
                        return 'Select/Deselect All Ext Nodes';

                    })
                    .on('click', function (event, d) {
                        selectDeselectNodeExtNodes(d);
                    });

            }

            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', 'Helvetica')
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent) {
                        textSum += textInc;
                        return 'List External Node Data';
                    }
                })
                .on('click', function (event, d) {
                    listExternalNodeData(d);
                });


            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', 'Helvetica')
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent) {
                        textSum += textInc;
                        return 'Download Ext Node Data';
                    }
                })
                .on('click', function (event, d) {
                    downloadExternalNodeData(d);
                });

            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', 'Helvetica')
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent) {
                        textSum += textInc;
                        return 'Download All Ext Node Data';
                    }
                })
                .on('click', function (event, d) {
                    downloadExternalNodeDataAll(d);
                });


            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', 'Helvetica')
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent && _basicTreeProperties.sequences && (_basicTreeProperties.maxMolSeqLength && (_basicTreeProperties.maxMolSeqLength > 0))) {
                        textSum += textInc;
                        return 'List Sequences in Fasta';
                    }
                })
                .on('click', function (event, d) {
                    listMolecularSequences(d);
                });

            d3.select(this).append('text')
                .attr('class', 'tooltipElem tooltipElemText')
                .attr('y', topPad + textSum)
                .attr('x', +rightPad)
                .style('text-align', 'left')
                .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                .style('font-size', fs)
                .style('font-family', 'Helvetica')
                .style('font-style', 'normal')
                .style('font-weight', 'bold')
                .style('text-decoration', 'none')
                .text(function (d) {
                    if (d.parent && _basicTreeProperties.sequences && (_basicTreeProperties.maxMolSeqLength && (_basicTreeProperties.maxMolSeqLength > 0))) {
                        textSum += textInc;
                        return 'Download Sequences in Fasta';
                    }
                })
                .on('click', function (event, d) {
                    downloadExternalNodeMolecularSequenceAsFasta(d);
                });

            if (_settings.enableAccessToDatabases === true) {
                d3.select(this).append('text')
                    .attr('class', 'tooltipElem tooltipElemText')
                    .attr('y', topPad + textSum)
                    .attr('x', +rightPad)
                    .style('text-align', 'left')
                    .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                    .style('font-size', fs)
                    .style('font-family', 'Helvetica')
                    .style('font-style', 'normal')
                    .style('font-weight', 'bold')
                    .style('text-decoration', 'none')
                    .text(function (d) {
                        let show = false;
                        let value = null;

                        if (d.properties && d.properties.length > 0) {
                            let propertiesLength = d.properties.length;
                            for (let i = 0; i < propertiesLength; ++i) {
                                let p = d.properties[i];
                                if (p.value && p.ref.toLowerCase().indexOf("accession") >= 0) {
                                    if (RE_SWISSPROT_TREMBL_PFAM.test(p.value) || RE_GENBANK_PROT.test(p.value) || RE_GENBANK_NUC.test(p.value) || RE_REFSEQ.test(p.value) || RE_UNIPROTKB.test(p.value) || RE_SWISSPROT_TREMBL.test(p.value)) {
                                        show = true;
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
                                    if (source === ACC_GENBANK || source === ACC_NCBI || source === ACC_REFSEQ || source === ACC_UNIPROT || source === ACC_UNIPROTKB || source === ACC_SWISSPROT || source === ACC_TREMBL || source === 'UNKNOWN' || source === '?') {
                                        show = true;
                                        value = s.accession.value;
                                        break;
                                    }
                                }
                            }
                        }
                        if (d.name) {
                            if (RE_SWISSPROT_TREMBL.test(d.name)) {
                                show = true;
                                value = d.name;
                            } else if (RE_SWISSPROT_TREMBL_PFAM.test(d.name)) {
                                show = true;
                                value = RE_SWISSPROT_TREMBL_PFAM.exec(d.name)[1];
                            }
                        }
                        if (show) {
                            textSum += textInc;
                            return 'Access DB [' + value + ']';
                        }
                    })
                    .on('click', function (event, d) {
                        accessDatabase(d);
                    });
            }

            if (_settings.enableSubtreeDeletion === true) {
                d3.select(this).append('text')
                    .attr('class', 'tooltipElem tooltipElemText')
                    .attr('y', topPad + textSum)
                    .attr('x', +rightPad)
                    .style('text-align', 'left')
                    .style('align', 'left')
                    .style('fill', NODE_TOOLTIP_TEXT_COLOR)
                    .style('font-size', fs)
                    .style('font-family', _settings.controlsFont)
                    .style('font-style', 'normal')
                    .style('font-weight', 'bold')
                    .style('text-decoration', 'none')
                    .text(function (d) {
                        if (!_in_subtree && d.parent && d.parent.parent && d.parent.parent.parent) {
                            textSum += textInc;
                            if (d.children) {
                                if (d.children.length > 1) {
                                    return 'Delete Subtree';
                                }
                            } else {
                                return 'Delete External Node';
                            }
                        }
                    })
                    .on('click', function (event, d) {
                        forester.deleteSubtree(tree, d);
                        _treeData = tree;
                        _basicTreeProperties = forester.collectBasicTreeProperties(_treeData);
                        updateNodeVisualizationsAndLegends(_treeData);
                        search0();
                        search1();
                        zoomToFit();
                    });
            }

            d3.selection.prototype.moveToFront = function () {
                return this.each(function () {
                    this.parentNode.appendChild(this);
                });
            };
            d3.select(this).moveToFront();
            d3.select(this).selectAll('.tooltipElemText').each(function () {
                d3.select(this).on('mouseover', function () {
                    d3.select(this).transition().duration(50).style('fill', NODE_TOOLTIP_TEXT_ACTIVE_COLOR);
                });
                d3.select(this).on('mouseout', function () {
                    d3.select(this).transition().duration(50).style('fill', NODE_TOOLTIP_TEXT_COLOR);
                });
            });
        }

        return nodeClick;
    }


    document.documentElement.addEventListener('click', function (d) {
        let attrClass = d.target.getAttribute('class');
        if ((attrClass !== 'nodeCircleOptions')) {
            removeTooltips();
        }
        if (attrClass === BASE_BACKGROUND) {
            if (_showColorPicker === true) {
                removeColorPicker();
            }
        }
    });


    function updateNodeVisualizationsAndLegends(tree) {
        _visualizations = null;
        let nodeProperties = forester.collectProperties(tree, 'node', false);

        if (_settings.valuesToIgnoreForNodeVisualization) {
            deleteValuesFromNodeProperties(_settings.valuesToIgnoreForNodeVisualization, nodeProperties);
        }
        initializeNodeVisualizations(nodeProperties);

        if ((_showLegends && (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) && (_legendColorScales[LEGEND_LABEL_COLOR] || (_options.showNodeVisualizations && (_legendColorScales[LEGEND_NODE_FILL_COLOR] || _legendShapeScales[LEGEND_NODE_SHAPE] || _legendSizeScales[LEGEND_NODE_SIZE]))))) {
            if (_legendColorScales[LEGEND_LABEL_COLOR]) {
                removeLegend(LEGEND_LABEL_COLOR);
                addLegend(LEGEND_LABEL_COLOR, _visualizations.labelColor[_currentLabelColorVisualization]);
            }
            if (_legendColorScales[LEGEND_NODE_FILL_COLOR]) {
                removeLegend(LEGEND_NODE_FILL_COLOR);
                addLegend(LEGEND_NODE_FILL_COLOR, _visualizations.nodeFillColor[_currentNodeFillColorVisualization]);
            }
            if (_legendShapeScales[LEGEND_NODE_SHAPE]) {
                removeShapeLegend(LEGEND_NODE_SHAPE);
                addLegendForShapes(LEGEND_NODE_SHAPE, _visualizations.nodeShape[_currentNodeShapeVisualization]);
            }
            if (_legendSizeScales[LEGEND_NODE_SIZE]) {
                removeSizeLegend(LEGEND_NODE_SIZE);
                addLegendForSizes(LEGEND_NODE_SIZE, _visualizations.nodeSize[_currentNodeSizeVisualization]);
            }
        }
    }


    function zoomInX(zoomInFactor) {
        _zoomed_x_or_y = true;
        if (zoomInFactor) {
            _displayWidth = _displayWidth * zoomInFactor;
        } else {
            _displayWidth = _displayWidth * BUTTON_ZOOM_IN_FACTOR;
        }
        update(null, 0);
    }

    function zoomInY(zoomInFactor) {
        _zoomed_x_or_y = true;
        if (zoomInFactor) {
            _displayHeight = _displayHeight * zoomInFactor;
        } else {
            _displayHeight = _displayHeight * BUTTON_ZOOM_IN_FACTOR;
        }
        update(null, 0);
    }

    function zoomOutX(zoomOutFactor) {
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
    }

    function zoomOutY(zoomOutFactor) {
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
    }

    function zoomToFit() {
        _zoomed_x_or_y = false;
        if (_root) {
            calcMaxExtLabel();
            intitializeDisplaySize();
            initializeSettings(_settings);
            removeColorPicker();
            setZoomScale(1);
            update(_root, 0);
            if (_options.circular) {
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
        let labelSpace = (_maxLabelLength * _options.externalNodeFontSize * LABEL_SIZE_CALC_FACTOR) + LABEL_SIZE_CALC_ADDITION;
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
            _displayHeight = _options.externalNodeFontSize * (uncollsed_nodes * 1.3);
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
            updateNodeVisualizationsAndLegends(_root);
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
                initializeInitialVisualization(_root);
                updateNodeVisualizationsAndLegends(_root);
                search0();
                search1();
                zoomToFit();
            } else {
                _in_subtree = false;
            }
        }
    }


    function orderButtonPressed() {
        if (_root) {
            if (!_treeFn.visData) {
                _treeFn.visData = {};
            }
            if (_treeFn.visData.order === undefined) {
                _treeFn.visData.order = true;
            }
            orderSubtree(_root, _treeFn.visData.order);
            _treeFn.visData.order = !_treeFn.visData.order;
            update(null, 0);
        }
    }

    function midpointRootButtonPressed() {
        if (!_in_subtree && _root && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
            forester.midpointRoot(_root);
            zoomToFit();
        }
    }

    function escPressed() {
        if (_in_subtree) {
            _root = _root_const;
            _in_subtree = false;
        }

        _basicTreeProperties = forester.collectBasicTreeProperties(_root);

        initializeSettings(_settings);

        setSelectMenuValue(LABEL_COLOR_SELECT_MENU, DEFAULT);
        setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU, DEFAULT);
        setSelectMenuValue(NODE_SHAPE_SELECT_MENU, DEFAULT);
        setSelectMenuValue(NODE_SIZE_SELECT_MENU, DEFAULT);

        _currentNodeFillColorVisualization = null;
        _currentLabelColorVisualization = null;
        _currentNodeShapeVisualization = null;
        _currentNodeSizeVisualization = null;

        removeLegend(LEGEND_LABEL_COLOR);
        removeLegend(LEGEND_NODE_FILL_COLOR);
        removeLegendForShapes(LEGEND_NODE_SHAPE);
        removeLegendForSizes(LEGEND_NODE_SIZE);

        removeColorPicker();

        let width = 0;
        if (_settings.enableDynamicSizing) {
            let container = document.getElementById(_id.replace('#', ''));
            if (container) {
                _displayHeight = container.clientHeight;
                _displayWidth = container.clientWidth;
                width = _displayWidth;
            }
        }
        if (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) {
            legendReset();
        }
        zoomToFit();
        if (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) {
            let c0 = byId(_settings.controls0);
            if (c0) {
                setStyles(c0, {
                    'left': _settings.controls0Left, 'top': _settings.controls0Top + _offsetTop
                });
            }
            let c1 = byId(_settings.controls1);
            if (c1) {
                if (_settings.enableDynamicSizing) {
                    setStyles(c1, {
                        'left': width - PANEL_WIDTH, 'top': _settings.controls1Top + _offsetTop
                    });
                } else {
                    setStyles(c1, {
                        'left': _settings.controls1Left, 'top': _settings.controls1Top + _offsetTop
                    });
                }
            }

        }
        if (_options.searchAinitialValue) {
            setValue(SEARCH_FIELD_0, _options.searchAinitialValue);
        } else {
            setValue(SEARCH_FIELD_0, '');
        }
        if (_options.searchBinitialValue) {
            setValue(SEARCH_FIELD_1, _options.searchBinitialValue);

        } else {
            setValue(SEARCH_FIELD_1, '');
        }

        initializeInitialVisualization();
        update(null, 0);
        updateNodeVisualizationsAndLegends(_root);
        search0();
        search1();

    }

    function search0() {
        _foundNodes0.clear();
        _searchBox0Empty = true;
        let query = getValue(SEARCH_FIELD_0);
        if (query && query.length > 0) {
            let my_query = query.trim();
            if (my_query.length > 0) {
                _searchBox0Empty = false;
                _foundNodes0 = search(my_query);
            }
        }
        update(null, 0, true);
    }

    function search1() {
        _foundNodes1.clear();
        _searchBox1Empty = true;
        let query = getValue(SEARCH_FIELD_1);
        if (query && query.length > 0) {
            let my_query = query.trim();
            if (my_query.length > 0) {
                _searchBox1Empty = false;
                _foundNodes1 = search(my_query);
            }
        }
        update(null, 0, true);
    }

    function resetSearch0() {
        _foundNodes0.clear();
        _searchBox0Empty = true;
        setValue(SEARCH_FIELD_0, '');
        update(null, 0, true);
        update(null, 0, true);
    }

    function resetSearch1() {
        _foundNodes1.clear();
        _searchBox1Empty = true;
        setValue(SEARCH_FIELD_1, '');
        update(null, 0, true);
        update(null, 0, true);
    }


    function search(query) {
        return searchData(query, _root, _options.searchIsCaseSensitive, _options.searchIsPartial, _options.searchUsesRegex, _options.searchProperties);
    }

    function searchData(query, phy, caseSensitive, partial, regex, searchProperties) {
        let nodes = new Set();
        if (!phy || !query || query.length < 1) {
            return nodes;
        }
        let my_query = query.trim();
        if (my_query.length < 1) {
            return nodes;
        }
        my_query = my_query.replace(/\s\s+/g, ' ');

        if (!regex) {
            my_query = my_query.replace(/\+\++/g, '+');
        }

        let queries = [];

        if (!regex && (my_query.indexOf(",") >= 0)) {
            queries = my_query.split(",");
        } else {
            queries.push(my_query);
        }
        let queriesLength = queries.length;
        let q;
        for (let i = 0; i < queriesLength; ++i) {
            q = queries[i];
            if (q) {
                q = q.trim();
                if (q.length > 0) {
                    forester.preOrderTraversalAll(phy, matcher);
                }
            }
        }

        return nodes;

        function matcher(node) {
            let mqueries = [];
            if (!regex && (q.indexOf("+") >= 0)) {
                mqueries = q.split("+");
            } else {
                mqueries.push(q);
            }
            let mqueriesLength = mqueries.length;
            let match = true;
            for (let i = 0; i < mqueriesLength; ++i) {
                let mq = mqueries[i];
                if (mq) {
                    mq = mq.trim();
                    if (mq.length > 0) {
                        let ndf = null;
                        if ((mq.length > 3) && (mq.indexOf(":") === 2)) {
                            ndf = makeNDF(mq);
                            if (ndf) {
                                mq = mq.substring(3);
                            }
                        }
                        let lmatch = false;
                        if (ndf === null) {
                            if (matchme(makeNodeLabelForSearch(node), mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((searchProperties === true) && node.properties && node.properties.length > 0) {
                                let propertiesLength = node.properties.length;
                                for (let i = 0; i < propertiesLength; ++i) {
                                    let p = node.properties[i];
                                    if (p.value && matchme(p.value, mq, caseSensitive, partial, regex)) {
                                        lmatch = true;
                                        break;
                                    }
                                }
                            }
                        } else {
                            if ((ndf === "NN") && node.name && matchme(node.name, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "TC") && node.taxonomies && node.taxonomies.length > 0 && matchme(node.taxonomies[0].code, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "TS") && node.taxonomies && node.taxonomies.length > 0 && matchme(node.taxonomies[0].scientific_name, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "TN") && node.taxonomies && node.taxonomies.length > 0 && matchme(node.taxonomies[0].common_name, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "SY") && node.taxonomies && node.taxonomies.length > 0 && matchme(node.taxonomies[0].synonym, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "TI") && node.taxonomies && node.taxonomies.length > 0 && node.taxonomies[0].id && matchme(node.taxonomies[0].id.value, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "SN") && node.sequences && node.sequences.length > 0 && matchme(node.sequences[0].name, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "GN") && node.sequences && node.sequences.length > 0 && matchme(node.sequences[0].gene_name, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "SS") && node.sequences && node.sequences.length > 0 && matchme(node.sequences[0].symbol, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            } else if ((ndf === "SA") && node.sequences && node.sequences.length > 0 && node.sequences[0].accession && matchme(node.sequences[0].accession.value, mq, caseSensitive, partial, regex)) {
                                lmatch = true;
                            }
                        }
                        if (!lmatch) {
                            match = false;
                            break;
                        }

                    } // if (mq.length > 0)
                    else {
                        match = false;
                    }
                } // if (mq)
                else {
                    match = false;
                }
            } //  for (let i = 0; i < mqueriesLength; ++i)
            if (match) {
                nodes.add(node);
            }
        }

        function matchme(s, query, caseSensitive, partial, regex) {
            if (!s || !query) {
                return false;
            }
            let my_s = s.trim();
            let my_query = query.trim();
            if (!caseSensitive && !regex) {
                my_s = my_s.toLowerCase();
                my_query = my_query.toLowerCase();
            }
            if (regex) {
                let re = null;
                try {
                    if (caseSensitive) {
                        re = new RegExp(my_query);
                    } else {
                        re = new RegExp(my_query, 'i');
                    }
                } catch (err) {
                    return false;
                }
                if (re) {
                    return (my_s.search(re) > -1);
                } else {
                    return false;
                }
            } else if (partial) {
                return (my_s.indexOf(my_query) > -1);
            } else {
                let np = new RegExp("(^|\\s)" + escapeRegExp(my_query) + "($|\\s)");
                if (np) {
                    return (my_s.search(np) > -1);
                } else {
                    return false;
                }
            }
        }

        function escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
        }

        function makeNDF(query) {
            let str = query.substring(0, 2);
            if (str === "NN" || str === "TC" || str === "TN" || str === "TS" || str === "TI" || str === "SY" || str === "SN" || str === "GN" || str === "SS" || str === "SA" || str === "AN" || str === "XR" || str === "MS") {
                return str;
            } else {
                return null;
            }
        }
    }


    function toPhylogram() {
        _options.phylogram = true;
        _options.alignPhylogram = false;
        setDisplayTypeButtons();
        update(null, 0);
    }

    function toAlignedPhylogram() {
        _options.phylogram = true;
        _options.alignPhylogram = true;
        setDisplayTypeButtons();
        update(null, 0);
    }

    function toCladegram() {
        _options.phylogram = false;
        _options.alignPhylogram = false;
        setDisplayTypeButtons();
        update(null, 0);
    }

    function circularCbClicked() {
        _options.circular = getCheckboxValue(CIRCULAR_CB);
        zoomToFit();
    }

    // Toggles alignment of the labels in phylogram mode (bound to the 'L'
    // keyboard shortcut). Alignment only applies to phylograms, so this is a
    // no-op in cladogram mode.
    function toggleAlignPhylogram() {
        if (_options.phylogram) {
            _options.alignPhylogram = !_options.alignPhylogram;
            setDisplayTypeButtons();
            update(null, 0);
        }
    }

    function nodeNameCbClicked() {
        _options.showNodeName = getCheckboxValue(NODE_NAME_CB);
        if (_options.showNodeName) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        search0();
        search1();
        update();
    }


    function customCbClicked(cb_id) {
        if (_nodeLabels) {
            const cb_value = getCheckboxValue(cb_id);
            for (const [key, value] of Object.entries(_nodeLabels)) {
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
        _options.showTaxonomy = getCheckboxValue(TAXONOMY_CB);
        if (_options.showTaxonomy) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        search0();
        search1();
        update();
    }

    function sequenceCbClicked() {
        _options.showSequence = getCheckboxValue(SEQUENCE_CB);
        if (_options.showSequence) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        search0();
        search1();
        update();
    }

    function confidenceValuesCbClicked() {
        _options.showConfidenceValues = getCheckboxValue(CONFIDENCE_VALUES_CB);
        search0();
        search1();
        update();
    }

    function branchLengthsCbClicked() {
        _options.showBranchLengthValues = getCheckboxValue(BRANCH_LENGTH_VALUES_CB);
        update();
    }

    function nodeEventsCbClicked() {
        _options.showNodeEvents = getCheckboxValue(NODE_EVENTS_CB);
        search0();
        search1();
        update();
    }

    function branchEventsCbClicked() {
        _options.showBranchEvents = getCheckboxValue(BRANCH_EVENTS_CB);
        search0();
        search1();
        update();
    }

    function internalLabelsCbClicked() {
        _options.showInternalLabels = getCheckboxValue(INTERNAL_LABEL_CB);
        search0();
        search1();
        update();
    }

    function externalLabelsCbClicked() {
        _options.showExternalLabels = getCheckboxValue(EXTERNAL_LABEL_CB);
        search0();
        search1();
        update();
    }

    function internalNodesCbClicked() {
        _options.showInternalNodes = getCheckboxValue(INTERNAL_NODES_CB);
        search0();
        search1();
        update();
    }

    function externalNodesCbClicked() {
        _options.showExternalNodes = getCheckboxValue(EXTERNAL_NODES_CB);
        search0();
        search1();
        update();
    }

    function nodeVisCbClicked() {
        _options.showNodeVisualizations = getCheckboxValue(NODE_VIS_CB);
        resetVis();
        update(null, 0);
        update(null, 0);
    }

    function branchVisCbClicked() {
        _options.showBranchVisualizations = getCheckboxValue(BRANCH_VIS_CB);
        resetVis();
        update(null, 0);
        update(null, 0);
    }

    function branchColorsCbClicked() {
        _options.showBranchColors = getCheckboxValue(BRANCH_COLORS_CB);
        update(null, 0);
    }

    function dynaHideCbClicked() {
        _options.dynahide = getCheckboxValue(DYNAHIDE_CB);
        resetVis();
        search0();
        search1();
        update(null, 0);
        update(null, 0);
    }

    function shortenCbClicked() {
        _options.shortenNodeNames = getCheckboxValue(SHORTEN_NODE_NAME_CB);
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

    function changeBranchWidth(e, slider) {
        _options.branchWidthDefault = getSliderValue(e);
        update(null, 0, true);
    }

    function changeNodeSize(e, slider) {
        _options.nodeSizeDefault = getSliderValue(e);
        if (!_options.showInternalNodes && !_options.showExternalNodes && !_options.showNodeVisualizations && !_options.showNodeEvents) {
            _options.showInternalNodes = true;
            _options.showExternalNodes = true;
            setCheckboxValue(INTERNAL_NODES_CB, true);
            setCheckboxValue(EXTERNAL_NODES_CB, true);
        }
        update(null, 0, true);
    }


    function changeInternalFontSize(e, slider) {
        _options.internalNodeFontSize = getSliderValue(e);
        update(null, 0, true);
    }

    function changeExternalFontSize(e, slider) {
        _options.externalNodeFontSize = getSliderValue(e);
        update(null, 0, true);
    }

    function changeBranchDataFontSize(e, slider) {
        _options.branchDataFontSize = getSliderValue(e);
        update(null, 0, true);
    }

    function updateMsaResidueVisCurrResPosFromSlider(e, slider) {
        removeColorPicker();
        _msa_residue_vis_curr_res_pos = getSliderValue(e) - 1;
        showMsaResidueVisualizationAsLabelColorIfNotAlreadyShown();
        update(null, 0, true);
    }

    function searchOptionsCaseSenstiveCbClicked() {
        _options.searchIsCaseSensitive = getCheckboxValue(SEARCH_OPTIONS_CASE_SENSITIVE_CB);
        search0();
        search1();
    }

    function searchOptionsCompleteTermsOnlyCbClicked() {
        _options.searchIsPartial = !getCheckboxValue(SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB);
        if (_options.searchIsPartial === false) {
            _options.searchUsesRegex = false;
            setCheckboxValue(SEARCH_OPTIONS_REGEX_CB, _options.searchUsesRegex);
        }
        search0();
        search1();
    }

    function searchOptionsPropertiesCbClicked() {
        _options.searchProperties = getCheckboxValue(SEARCH_OPTIONS_PROPERTIES_CB);
        search0();
        search1();
    }

    function searchOptionsRegexCbClicked() {
        _options.searchUsesRegex = getCheckboxValue(SEARCH_OPTIONS_REGEX_CB);
        if (_options.searchUsesRegex === true) {
            _options.searchIsPartial = true;
            setCheckboxValue(SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB, !_options.searchIsPartial);
        }
        search0();
        search1();
    }

    function searchOptionsNegateResultCbClicked() {
        _options.searchNegateResult = getCheckboxValue(SEARCH_OPTIONS_NEGATE_RES_CB);
        search0();
        search1();
    }


    function legendMoveUp(x) {
        if (!x) {
            x = 10;
        }
        if (_options.visualizationsLegendYpos > 0) {
            _options.visualizationsLegendYpos -= x;
            removeColorPicker();
            update(null, 0);
        }
    }

    function legendMoveDown(x) {
        if (!x) {
            x = 10;
        }
        if (_options.visualizationsLegendYpos < _displayHeight) {
            _options.visualizationsLegendYpos += x;
            removeColorPicker();
            update(null, 0);
        }
    }

    function legendMoveRight(x) {
        if (!x) {
            x = 10;
        }
        if (_options.visualizationsLegendXpos < (_displayWidth - 20)) {
            _options.visualizationsLegendXpos += x;
            removeColorPicker();
            update(null, 0);
        }
    }

    function legendMoveLeft(x) {
        if (!x) {
            x = 10;
        }
        if (_options.visualizationsLegendXpos > 0) {
            _options.visualizationsLegendXpos -= x;
            removeColorPicker();
            update(null, 0);
        }
    }

    function moveLegendWithMouse(ev) {
        let x = ev.layerX;
        let y = ev.layerY - _offsetTop;
        if (x > 0 && x < _displayWidth) {
            _options.visualizationsLegendXpos = x;
        }
        if (y > 0 && y < _displayHeight) {
            _options.visualizationsLegendYpos = y;
        }
        removeColorPicker();
        update(null, 0);
    }

    function legendHorizVertClicked() {
        if (_options.visualizationsLegendOrientation === VERTICAL) {
            _options.visualizationsLegendOrientation = HORIZONTAL;
        } else {
            _options.visualizationsLegendOrientation = VERTICAL;
        }
        removeColorPicker();
        update(null, 0);
    }

    function legendShowClicked() {
        _showLegends = !_showLegends;
        if (!_showLegends) {
            removeColorPicker();
        }
        update(null, 0, true);
    }

    function legendResetClicked() {
        removeColorPicker();
        legendReset();
        update(null, 0, true);
    }

    function legendReset() {
        _options.visualizationsLegendXpos = _options.visualizationsLegendXposOrig;
        _options.visualizationsLegendYpos = _options.visualizationsLegendYposOrig;
    }

    function legendColorRectClicked(targetScale, legendLabel, legendDescription, clickedName, clickedIndex) {
        addColorPicker(targetScale, legendLabel, legendDescription, clickedName, clickedIndex);
        update();
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
            opt.innerHTML = html;
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
    function panelThemeIcon() {
        return panelDarkActive() ? '☀︎' : '☽';
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
        let icon = panelThemeIcon();
        for (let i = 0; i < btns.length; ++i) {
            btns[i].textContent = icon;
        }
    }

    function togglePanelTheme() {
        _panelTheme = panelDarkActive() ? 'light' : 'dark';
        try {
            localStorage.setItem('aptx-panel-theme', _panelTheme);
        } catch (e) {
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
        } catch (e) {
            // ignore
        }
    }

    function injectPanelStyles() {
        loadPanelTheme();
        if (document.getElementById(PANEL_STYLE_ID)) {
            return;
        }
        // Dark palette tokens, shared by the system-preference default and the
        // explicit "dark" choice from the header light/dark switch.
        let dark = '  --p-bg:rgba(24,35,46,0.94); --p-ink:#e7eef5; --p-muted:#94a4b3; --p-faint:#6f8090;'
            + '  --p-line:#27343f; --p-line-strong:#35434f; --p-surface2:#202d38;'
            + '  --p-accent:#57a6ff; --p-accent-ink:#9cc7ff; --p-accent-weak:rgba(87,166,255,0.18);'
            + '  --p-shadow-sm:0 1px 2px rgba(0,0,0,0.4);';
        let css = ''
            + '.aptx-panel {'
            + '  --p-bg: rgba(255,255,255,0.94); --p-ink:#1e2a35; --p-muted:#6b7a89; --p-faint:#93a3b2;'
            + '  --p-line:#e3e9f0; --p-line-strong:#cad6e1; --p-surface2:#f3f6fa;'
            + '  --p-accent:#2f83f2; --p-accent-ink:#1c5fbf; --p-accent-weak:rgba(47,131,242,0.12);'
            + '  --p-shadow-sm:0 1px 2px rgba(23,34,46,0.12);'
            + '  box-sizing:border-box; width:' + PANEL_WIDTH + 'px;'
            + '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
            + '  font-size:11px; line-height:1.42; color:var(--p-ink); background:var(--p-bg);'
            + '  -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);'
            + '  border:1px solid var(--p-line-strong); border-radius:12px;'
            + '  box-shadow:0 12px 30px -12px rgba(23,34,46,0.32),0 2px 6px -2px rgba(23,34,46,0.14);'
            + '  overflow:hidden; }'
            + '.aptx-panel * { box-sizing:border-box; }'
            + '@media (prefers-color-scheme:dark){ .aptx-panel:not(.aptx-light):not(.aptx-dark) {' + dark + '} }'
            + '.aptx-panel.aptx-dark {' + dark + '}'
            + '.aptx-panel .' + PROG_NAME + ' { display:flex; align-items:center; gap:8px; padding:9px 12px; border-bottom:1px solid var(--p-line); font-weight:600; letter-spacing:-0.01em; }'
            + '.aptx-panel .' + PROGNAMELINK + ',.aptx-panel .' + PROGNAMELINK + ':link,.aptx-panel .' + PROGNAMELINK + ':visited { color:var(--p-accent-ink); text-decoration:none; font-size:12px; border:0; }'
            + '.aptx-panel .' + PROGNAMELINK + ':hover { text-decoration:underline; }'
            + '.aptx-panel .' + TREE_DESC + ' { text-align:center; font-weight:600; font-size:11.5px; color:var(--p-ink); padding:2px 0; }'
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
            + '.aptx-panel .aptx-subhead { margin:9px 0 4px; font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:var(--p-faint); }'
            + '.aptx-panel .aptx-fieldset-body > .aptx-subhead:first-child { margin-top:0; }'
            + '.aptx-panel .' + SEARCH_OPTIONS_GROUP + ' { display:flex; flex-wrap:wrap; align-items:center; gap:6px 14px; }'
            + '.aptx-panel .' + SEARCH_OPTIONS_GROUP + ' { margin-top:9px; }'
            + '.aptx-panel .aptx-field-label { display:block; margin:8px 0 3px; font-size:10px; color:var(--p-muted); }'
            + '.aptx-panel .aptx-search-row { display:flex; align-items:center; gap:6px; margin-bottom:2px; }'
            + '.aptx-panel .aptx-search-row input[type=text] { flex:1 1 auto; min-width:0; height:26px; }'
            + '.aptx-panel .aptx-search-row input[type=button] { flex:none; height:26px; }'
            // segmented display-mode control (P/A/C) + the Circular toggle pill
            + '.aptx-panel .aptx-modebar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }'
            + '.aptx-panel .aptx-segmented { display:inline-flex; border:1px solid var(--p-line-strong); border-radius:7px; overflow:hidden; }'
            + '.aptx-panel .aptx-seg { display:flex; align-items:center; justify-content:center; min-width:24px; padding:3px 8px; font-size:11px; font-weight:600; color:var(--p-muted); background:var(--p-surface2); cursor:pointer; border-right:1px solid var(--p-line-strong); transition:background .12s,color .12s; }'
            + '.aptx-panel .aptx-seg:last-child { border-right:0; }'
            + '.aptx-panel .aptx-seg > input { position:absolute; width:0; height:0; opacity:0; margin:0; pointer-events:none; }'
            + '.aptx-panel .aptx-seg:hover { color:var(--p-accent-ink); background:var(--p-accent-weak); }'
            + '.aptx-panel .aptx-seg:has(> input:checked) { background:var(--p-accent); color:#fff; }'
            + '.aptx-panel .aptx-seg:has(> input:disabled) { opacity:0.4; cursor:default; }'
            + '.aptx-panel .aptx-toggle { display:inline-flex; align-items:center; gap:6px; padding:3px 9px; border:1px solid var(--p-line-strong); border-radius:7px; background:var(--p-surface2); font-size:11px; font-weight:600; color:var(--p-muted); cursor:pointer; transition:background .12s,color .12s,border-color .12s; }'
            + '.aptx-panel .aptx-toggle > input { position:absolute; width:0; height:0; opacity:0; margin:0; pointer-events:none; }'
            + '.aptx-panel .aptx-toggle:hover { color:var(--p-accent-ink); border-color:var(--p-accent); }'
            + '.aptx-panel .aptx-toggle:has(> input:checked) { background:var(--p-accent); color:#fff; border-color:var(--p-accent); }'
            + '.aptx-panel .aptx-actions { margin-left:auto; display:flex; align-items:center; gap:5px; }'
            + '.aptx-panel .aptx-theme-btn { flex:none; width:20px; height:20px; display:grid; place-items:center; padding:0; border:1px solid var(--p-line-strong); border-radius:6px; background:var(--p-surface2); color:var(--p-muted); cursor:pointer; font-size:12px; line-height:1; }'
            + '.aptx-panel .aptx-theme-btn:hover { background:var(--p-accent-weak); color:var(--p-accent-ink); border-color:var(--p-accent); }'
            + '.aptx-panel input[type=range] { -webkit-appearance:none; appearance:none; display:block; width:100%; height:15px; margin:2px 0 9px; padding:0; background:transparent; cursor:pointer; }'
            + '.aptx-panel input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:999px; background:var(--p-line-strong); }'
            + '.aptx-panel input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:13px; height:13px; margin-top:-4.5px; border-radius:50%; background:var(--p-accent); border:2px solid var(--p-bg); box-shadow:var(--p-shadow-sm); }'
            + '.aptx-panel input[type=range]::-moz-range-track { height:4px; border-radius:999px; background:var(--p-line-strong); }'
            + '.aptx-panel input[type=range]::-moz-range-thumb { width:13px; height:13px; border-radius:50%; background:var(--p-accent); border:2px solid var(--p-bg); box-shadow:var(--p-shadow-sm); }'
            + '.aptx-panel input[type=button] { font-family:inherit; font-size:11px; height:24px; color:var(--p-ink); background:var(--p-surface2); border:1px solid var(--p-line-strong); border-radius:6px; margin:2px 3px 2px 0; cursor:pointer; transition:background .12s,border-color .12s,color .12s; }'
            + '.aptx-panel input[type=button]:hover { background:var(--p-accent-weak); border-color:var(--p-accent); color:var(--p-accent-ink); }'
            + '.aptx-panel input[type=button]:disabled { opacity:0.4; cursor:default; }'
            + '.aptx-panel input[type=text],.aptx-panel select { font-family:inherit; font-size:11px; color:var(--p-ink); background:var(--p-surface2); border:1px solid var(--p-line-strong); border-radius:6px; max-width:100%; padding:3px 6px; }'
            + '.aptx-panel input[type=text]:focus,.aptx-panel select:focus { outline:none; border-color:var(--p-accent); box-shadow:0 0 0 3px var(--p-accent-weak); }'
            // --- collapsible sections, internal scroll, whole-panel hide ---
            + '.aptx-panel { display:flex; flex-direction:column; max-height:calc(100vh - 40px); }'
            + '.aptx-panel > .aptx-body { overflow-y:auto; overflow-x:hidden; min-height:0; }'
            + '.aptx-panel > .aptx-body::-webkit-scrollbar { width:9px; }'
            + '.aptx-panel > .aptx-body::-webkit-scrollbar-thumb { background:var(--p-line-strong); border-radius:9px; border:2px solid var(--p-bg); }'
            + '.aptx-panel legend.aptx-legend-toggle { display:flex; align-items:center; width:100%; cursor:pointer; }'
            + '.aptx-panel legend.aptx-legend-toggle::after { content:"\\25BE"; margin-left:auto; font-size:8px; color:var(--p-faint); transition:transform .15s; }'
            + '.aptx-panel legend.aptx-legend-toggle:hover { color:var(--p-accent-ink); }'
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

            if (header.querySelector('.' + PROGNAMELINK)) {
                let themeBtn = document.createElement('button');
                themeBtn.type = 'button';
                themeBtn.className = 'aptx-theme-btn';
                themeBtn.title = 'Switch between light and dark';
                themeBtn.textContent = panelThemeIcon();
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
    function showNodeDataDialog(title, htmlContent, fontSize, fontFamily, width, height) {
        let existing = document.getElementById(NODE_DATA);
        if (existing) {
            existing.remove();
        }
        let dialog = document.createElement('dialog');
        dialog.id = NODE_DATA;
        dialog.style.cssText = 'padding:0; border-style:groove; border-color:#AAAAAA;'
            + ' background-color:#F0F8FF; opacity:0.95; z-index:10;'
            + ' color:' + _settings.controlsFontColor + ';'
            + ' font-family:' + fontFamily + '; font-size:' + fontSize + ';'
            + ' width:' + width + 'px;';

        let titlebar = document.createElement('div');
        titlebar.textContent = title;
        titlebar.style.cssText = 'text-align:center; font-weight:bold; color:#FFFFFF;'
            + ' background-color:#AAAAAA; padding:2px 4px;'
            + ' font-family:' + _settings.controlsFont + ';';

        let closeButton = document.createElement('span');
        closeButton.textContent = '✕';
        closeButton.style.cssText = 'float:right; cursor:pointer; padding-left:8px;';
        closeButton.addEventListener('click', function () {
            dialog.close();
        });
        titlebar.appendChild(closeButton);

        let body = document.createElement('div');
        body.innerHTML = htmlContent;
        body.style.cssText = 'text-align:left; overflow:auto; padding:4px; height:' + height + 'px;';

        dialog.appendChild(titlebar);
        dialog.appendChild(body);
        document.body.appendChild(dialog);
        dialog.addEventListener('close', function () {
            dialog.remove();
        });
        dialog.showModal();
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
            if (t !== el && t.closest('input, select, button, textarea, label, a, option, legend')) {
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

    function updateMsaResidueVisCurrResPosSliderValue() {
        let el = document.getElementById(MSA_RESIDUE_VIS_CURR_RES_POS_SLIDER_1);
        if (el) {
            el.value = _msa_residue_vis_curr_res_pos + 1;
        }
    }


    function increaseFontSizes() {
        let step = SLIDER_STEP * 2;
        let max = FONT_SIZE_MAX - step;
        let up = false;
        if (_options.externalNodeFontSize <= max) {
            _options.externalNodeFontSize += step;
            up = true;
        }
        if (_options.internalNodeFontSize <= max) {
            _options.internalNodeFontSize += step;
            up = true;
        }
        if (_options.branchDataFontSize <= max) {
            _options.branchDataFontSize += step;
            up = true;
        }
        if (up) {
            setSliderValue(EXTERNAL_FONT_SIZE_SLIDER, _options.externalNodeFontSize);
            setSliderValue(INTERNAL_FONT_SIZE_SLIDER, _options.internalNodeFontSize);
            setSliderValue(BRANCH_DATA_FONT_SIZE_SLIDER, _options.branchDataFontSize);
            update(null, 0, true);
        }
    }

    function decreaseFontSizes() {
        let step = SLIDER_STEP * 2;
        let min = FONT_SIZE_MIN + step;
        let up = false;
        if (_options.externalNodeFontSize >= min) {
            _options.externalNodeFontSize -= step;
            up = true;
        }
        if (_options.internalNodeFontSize >= min) {
            _options.internalNodeFontSize -= step;
            up = true;
        }
        if (_options.branchDataFontSize >= min) {
            _options.branchDataFontSize -= step;
            up = true;
        }
        if (up) {
            setSliderValue(EXTERNAL_FONT_SIZE_SLIDER, _options.externalNodeFontSize);
            setSliderValue(INTERNAL_FONT_SIZE_SLIDER, _options.internalNodeFontSize);
            setSliderValue(BRANCH_DATA_FONT_SIZE_SLIDER, _options.branchDataFontSize);
            update(null, 0, true);
        }
    }


    function createGui() {

        let d3selectId = d3.select(_id);
        if (d3selectId && d3selectId[0]) {
            let phyloDiv = d3selectId[0][0];
            if (phyloDiv) {
                _offsetTop = phyloDiv.offsetTop;
                phyloDiv.style.textAlign = 'left';
            }
        }


        setStylesAll(_id, {
            'font-style': 'normal',
            'font-weight': 'normal',
            'text-decoration': 'none',
            'text-align': 'left',
            'border-color': 'LightGray'
        });


        _node_mouseover_div = d3.select("body").append("div")
            .attr("class", "node_mouseover_tooltip")
            .style("opacity", 1e-6);


        let c0 = byId(_settings.controls0);

        if (c0) {
            injectPanelStyles();
            c0.classList.add('aptx-panel');
            setStyles(c0, {
                'position': 'absolute',
                'left': _settings.controls0Left,
                'top': _settings.controls0Top + _offsetTop,
                'padding': '0px',
                'margin': '0'
            });

            makeDraggableWithinParent(c0);

            c0.insertAdjacentHTML('beforeend',makeProgramDesc());

            if ((_treeData.name && _treeData.name.length > 0) || (_treeData.description && _treeData.description.length > 0)) {
                c0.insertAdjacentHTML('beforeend',makeTreeDesc());
            }

            c0.insertAdjacentHTML('beforeend',makePhylogramControl());

            c0.insertAdjacentHTML('beforeend',makeDisplayControl());

            c0.insertAdjacentHTML('beforeend',makeZoomControl());

            c0.insertAdjacentHTML('beforeend',makeControlButtons());

            c0.insertAdjacentHTML('beforeend',makeSliders());

            c0.insertAdjacentHTML('beforeend',makeSearchBoxes());

            if (_settings.allowManualNodeSelection) {
                //c0.append(makeSubmitSection()); //~~~
            }

            if (_settings.enableDownloads) {
                c0.insertAdjacentHTML('beforeend',makeDownloadSection());
            }

            enhancePanel(c0);
        }

        let c1 = byId(_settings.controls1);
        if (c1) {
            injectPanelStyles();
            c1.classList.add('aptx-panel');
            setStyles(c1, {
                'position': 'absolute',
                'left': _settings.controls1Left,
                'top': _settings.controls1Top + _offsetTop,
                'padding': '0px',
                'margin': '0'
            });

            makeDraggableWithinParent(c1);

            if (_settings.enableNodeVisualizations && _nodeVisualizations) {
                c1.insertAdjacentHTML('beforeend',makeVisualControls());
                if (isCanDoMsaResidueVisualizations()) {
                    c1.insertAdjacentHTML('beforeend',makeMsaResidueVisCurrResPositionControl());
                }


                if (isAddVisualization2() && _specialVisualizations != null) {
                    if ('Mutations' in _specialVisualizations) {
                        const mutations = _specialVisualizations['Mutations'];
                        if (mutations != null) {
                            c1.insertAdjacentHTML('beforeend',makeVisualization2(mutations.label));
                            _visualizations2_color = mutations.color;
                            _visualizations2_applies_to_ref = mutations.applies_to_ref;
                            _visualizations2_property_datatype = mutations.property_datatype;
                            _visualizations2_property_applies_to = mutations.property_applies_to;
                            console.log(MESSAGE + 'Setting special visualization property ref to: ' + _visualizations2_applies_to_ref);
                            console.log(MESSAGE + 'Setting special visualization property applies to to: ' + _visualizations2_property_applies_to);
                            console.log(MESSAGE + 'Setting special visualization property datatype to: ' + _visualizations2_property_datatype);
                            console.log(MESSAGE + 'Setting special visualization color to: ' + _visualizations2_color);
                        }
                    }
                }
                if (isAddVisualization3() && _specialVisualizations != null) {
                    if ('Convergent_Mutations' in _specialVisualizations) {
                        const conv_mutations = _specialVisualizations['Convergent_Mutations'];
                        if (conv_mutations != null) {
                            c1.insertAdjacentHTML('beforeend',makeVisualization3(conv_mutations.label));
                            _visualizations3_color = conv_mutations.color;
                            _visualizations3_applies_to_ref = conv_mutations.applies_to_ref;
                            _visualizations3_property_datatype = conv_mutations.property_datatype;
                            _visualizations3_property_applies_to = conv_mutations.property_applies_to;
                            console.log(MESSAGE + 'Setting special visualization property ref to: ' + _visualizations3_applies_to_ref);
                            console.log(MESSAGE + 'Setting special visualization property applies to to: ' + _visualizations3_property_applies_to);
                            console.log(MESSAGE + 'Setting special visualization property datatype to: ' + _visualizations3_property_datatype);
                            console.log(MESSAGE + 'Setting special visualization color to: ' + _visualizations3_color);
                        }
                    }
                }

                if (isAddVisualization4() && _specialVisualizations != null) {
                    if ('vipr:PANGO_Lineage' in _specialVisualizations) {
                        const lineages = _specialVisualizations['vipr:PANGO_Lineage'];
                        if (lineages != null) {
                            c1.insertAdjacentHTML('beforeend',makeVisualization4(lineages.label));
                            _visualizations4_color = lineages.color;
                            _visualizations4_applies_to_ref = lineages.applies_to_ref;
                            _visualizations4_property_datatype = lineages.property_datatype;
                            _visualizations4_property_applies_to = lineages.property_applies_to;
                            console.log(MESSAGE + 'Setting special visualization property ref to: ' + _visualizations4_applies_to_ref);
                            console.log(MESSAGE + 'Setting special visualization property applies to to: ' + _visualizations4_property_applies_to);
                            console.log(MESSAGE + 'Setting special visualization property datatype to: ' + _visualizations4_property_datatype);
                            console.log(MESSAGE + 'Setting special visualization color to: ' + _visualizations4_color);
                        }
                    }
                }

                c1.insertAdjacentHTML('beforeend',makeLegendControl());
            }

            enhancePanel(c1, 'Legend');
        }

        setStylesAll('input[type=button]', {
            'width': '26px',
            'text-align': 'center',
            'outline': 'none',
            'margin': '0px',
            'font-style': 'normal',
            'font-weight': 'normal',
            'text-decoration': 'none'
        });


        setStylesAll('#' + ZOOM_IN_Y + ', #' + ZOOM_OUT_Y, {
            'width': '104px'
        });

        setStylesAll('#' + ZOOM_IN_Y + ', #' + ZOOM_OUT_Y + ', #' + ZOOM_TO_FIT + ', #' + ZOOM_IN_X + ', #' + ZOOM_OUT_X + ', #' + ZOOM_TO_EXPAND_Y, {
            'height': '16px'
        });

        setStylesAll('#' + LEGENDS_MOVE_UP_BTN + ', #' + LEGENDS_MOVE_DOWN_BTN, {
            'width': '72px'
        });

        setStylesAll('#' + LEGENDS_RESET_BTN + ', #' + LEGENDS_MOVE_LEFT_BTN + ', #' + LEGENDS_MOVE_RIGHT_BTN, {
            'width': '24px'
        });

        setStylesAll('#' + LEGENDS_SHOW_BTN + ', #' + LEGENDS_HORIZ_VERT_BTN, {
            'width': '36px'
        });

        setStylesAll('#' + LEGENDS_MOVE_UP_BTN + ', #' + LEGENDS_MOVE_DOWN_BTN + ', #' + LEGENDS_RESET_BTN + ', #' + LEGENDS_MOVE_LEFT_BTN + ', #' + LEGENDS_MOVE_RIGHT_BTN + ', #' + LEGENDS_SHOW_BTN + ', #' + LEGENDS_HORIZ_VERT_BTN, {
            'height': '16px'
        });

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

        on(INTERNAL_NODES_CB, 'click', internalNodesCbClicked);

        on(EXTERNAL_NODES_CB, 'click', externalNodesCbClicked);

        on(NODE_VIS_CB, 'click', nodeVisCbClicked);

        on(BRANCH_VIS_CB, 'click', branchVisCbClicked);

        on(BRANCH_COLORS_CB, 'click', branchColorsCbClicked);

        on(DYNAHIDE_CB, 'click', dynaHideCbClicked);

        on(CIRCULAR_CB, 'click', circularCbClicked);

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
            if (isAddVisualization2()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_2, DEFAULT);
            }
            if (isAddVisualization3()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_3, DEFAULT);
            }
            if (isAddVisualization4()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_4, DEFAULT);
            }

            if (v && v !== DEFAULT) {
                _currentLabelColorVisualization = v;
                if (_visualizations.labelColor[_currentLabelColorVisualization] != null) {
                    addLegend(LEGEND_LABEL_COLOR, _visualizations.labelColor[_currentLabelColorVisualization]);
                }
            } else {
                _currentLabelColorVisualization = null;
                removeLegend(LEGEND_LABEL_COLOR);
            }
            removeColorPicker();
            update(null, 0);
        });

        on(LABEL_COLOR_SELECT_MENU_2, 'change', function () {
            let v = this.value;
            setSelectMenuValue(LABEL_COLOR_SELECT_MENU, DEFAULT);
            if (isAddVisualization3()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_3, DEFAULT);
            }
            if (isAddVisualization4()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_4, DEFAULT);
            }
            if (v && v !== DEFAULT) {
                _currentLabelColorVisualization = v;
                _options.showExternalLabels = true;
                setCheckboxValue(EXTERNAL_LABEL_CB, true);
            } else {
                _currentLabelColorVisualization = null;
            }
            removeColorPicker();
            update(null, 0);
        });


        on(LABEL_COLOR_SELECT_MENU_3, 'change', function () {
            let v = this.value;
            setSelectMenuValue(LABEL_COLOR_SELECT_MENU, DEFAULT);
            if (isAddVisualization2()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_2, DEFAULT);
            }
            if (isAddVisualization4()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_4, DEFAULT);
            }
            if (v && v !== DEFAULT) {
                _currentLabelColorVisualization = v;
                _options.showExternalLabels = true;
                setCheckboxValue(EXTERNAL_LABEL_CB, true);
            } else {
                _currentLabelColorVisualization = null;
            }
            removeColorPicker();
            update(null, 0);
        });

        on(LABEL_COLOR_SELECT_MENU_4, 'change', function () {
            let v = this.value;
            setSelectMenuValue(LABEL_COLOR_SELECT_MENU, DEFAULT);
            if (isAddVisualization2()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_2, DEFAULT);
            }
            if (isAddVisualization3()) {
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU_3, DEFAULT);
            }
            if (v && v !== DEFAULT) {
                _currentLabelColorVisualization = v;
                _options.showExternalLabels = true;
                setCheckboxValue(EXTERNAL_LABEL_CB, true);
            } else {
                _currentLabelColorVisualization = null;
            }
            removeColorPicker();
            update(null, 0);
        });

        on(NODE_FILL_COLOR_SELECT_MENU, 'change', function () {
            let v = this.value;
            if (isAddVisualization2()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_2, DEFAULT);
            }
            if (isAddVisualization3()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_3, DEFAULT);
            }
            if (isAddVisualization4()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_4, DEFAULT);
            }
            if (v && v !== DEFAULT) {
                if (!_options.showExternalNodes && !_options.showInternalNodes && (_currentNodeShapeVisualization == null)) {
                    _options.showExternalNodes = true;
                    setCheckboxValue(EXTERNAL_NODES_CB, true);
                }
                _options.showNodeVisualizations = true;
                setCheckboxValue(NODE_VIS_CB, true);
                _currentNodeFillColorVisualization = v;
                addLegend(LEGEND_NODE_FILL_COLOR, _visualizations.nodeFillColor[_currentNodeFillColorVisualization]);
            } else {
                _currentNodeFillColorVisualization = null;
                removeLegend(LEGEND_NODE_FILL_COLOR);
            }
            removeColorPicker();
            update(null, 0);
        });


        on(NODE_FILL_COLOR_SELECT_MENU_2, 'change', function () {
            let v = this.value;
            setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU, DEFAULT);
            if (isAddVisualization3()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_3, DEFAULT);
            }
            if (isAddVisualization4()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_4, DEFAULT);
            }
            if (v && v !== DEFAULT) {
                _options.showExternalNodes = true;
                setCheckboxValue(EXTERNAL_NODES_CB, true);
                _options.showInternalNodes = true;
                setCheckboxValue(INTERNAL_NODES_CB, true);

                _options.showNodeVisualizations = true;
                setCheckboxValue(NODE_VIS_CB, true);
                _currentNodeFillColorVisualization = v;

            } else {
                _currentNodeFillColorVisualization = null;
                removeLegend(LEGEND_NODE_FILL_COLOR);
            }
            removeColorPicker();
            update(null, 0);
        });

        on(NODE_FILL_COLOR_SELECT_MENU_3, 'change', function () {
            let v = this.value;
            setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU, DEFAULT);
            if (isAddVisualization2()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_2, DEFAULT);
            }
            if (isAddVisualization4()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_4, DEFAULT);
            }
            if (v && v !== DEFAULT) {
                _options.showExternalNodes = true;
                setCheckboxValue(EXTERNAL_NODES_CB, true);
                _options.showInternalNodes = true;
                setCheckboxValue(INTERNAL_NODES_CB, true);

                _options.showNodeVisualizations = true;
                setCheckboxValue(NODE_VIS_CB, true);
                _currentNodeFillColorVisualization = v;

            } else {
                _currentNodeFillColorVisualization = null;
                removeLegend(LEGEND_NODE_FILL_COLOR);
            }
            removeColorPicker();
            update(null, 0);
        });

        on(NODE_FILL_COLOR_SELECT_MENU_4, 'change', function () {
            let v = this.value;
            setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU, DEFAULT);
            if (isAddVisualization2()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_2, DEFAULT);
            }
            if (isAddVisualization3()) {
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU_3, DEFAULT);
            }
            if (v && v !== DEFAULT) {
                _options.showExternalNodes = true;
                setCheckboxValue(EXTERNAL_NODES_CB, true);
                _options.showInternalNodes = true;
                setCheckboxValue(INTERNAL_NODES_CB, true);

                _options.showNodeVisualizations = true;
                setCheckboxValue(NODE_VIS_CB, true);
                _currentNodeFillColorVisualization = v;

            } else {
                _currentNodeFillColorVisualization = null;
                removeLegend(LEGEND_NODE_FILL_COLOR);
            }
            removeColorPicker();
            update(null, 0);
        });


        on(NODE_SHAPE_SELECT_MENU, 'change', function () {
            let v = this.value;
            if (v && v !== DEFAULT) {
                _currentNodeShapeVisualization = v;
                addLegendForShapes(LEGEND_NODE_SHAPE, _visualizations.nodeShape[_currentNodeShapeVisualization]);
                _options.showNodeVisualizations = true;
                setCheckboxValue(NODE_VIS_CB, true);
            } else {
                _currentNodeShapeVisualization = null;
                removeLegendForShapes(LEGEND_NODE_SHAPE);
            }
            removeColorPicker();
            resetVis();
            update(null, 0);
            update(null, 0);
        });

        on(NODE_SIZE_SELECT_MENU, 'change', function () {
            let v = this.value;
            if (v && v !== DEFAULT) {
                _currentNodeSizeVisualization = v;
                addLegendForSizes(LEGEND_NODE_SIZE, _visualizations.nodeSize[_currentNodeSizeVisualization]);
                if (!_options.showExternalNodes && !_options.showInternalNodes && (_currentNodeShapeVisualization == null)) {
                    _options.showExternalNodes = true;
                    setCheckboxValue(EXTERNAL_NODES_CB, true);
                }
                _options.showNodeVisualizations = true;
                setCheckboxValue(NODE_VIS_CB, true);
            } else {
                _currentNodeSizeVisualization = null;
                removeLegendForSizes(LEGEND_NODE_SIZE);
            }
            removeColorPicker();
            update(null, 0);
        });

        initSlider(NODE_SIZE_SLIDER, NODE_SIZE_MIN, NODE_SIZE_MAX, SLIDER_STEP, _options.nodeSizeDefault, changeNodeSize);

        initSlider(BRANCH_WIDTH_SLIDER, BRANCH_WIDTH_MIN, BRANCH_WIDTH_MAX, SLIDER_STEP, _options.branchWidthDefault, changeBranchWidth);

        initSlider(EXTERNAL_FONT_SIZE_SLIDER, FONT_SIZE_MIN, FONT_SIZE_MAX, SLIDER_STEP, _options.externalNodeFontSize, changeExternalFontSize);

        initSlider(INTERNAL_FONT_SIZE_SLIDER, FONT_SIZE_MIN, FONT_SIZE_MAX, SLIDER_STEP, _options.internalNodeFontSize, changeInternalFontSize);

        initSlider(BRANCH_DATA_FONT_SIZE_SLIDER, FONT_SIZE_MIN, FONT_SIZE_MAX, SLIDER_STEP, _options.branchDataFontSize, changeBranchDataFontSize);

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

        on(ZOOM_TO_FIT, 'mousedown', zoomToFit);

        on(ZOOM_TO_EXPAND_Y, 'mousedown', zoomToExpandY);

        on(RETURN_TO_SUPERTREE_BUTTON, 'mousedown', returnToSupertreeButtonPressed);

        on(RETURN_TO_SUPERTREE_BUTTON_BY_ONE, 'mousedown', returnToSupertreeButtonByOnePressed);

        on(ORDER_BUTTON, 'mousedown', orderButtonPressed);

        on(MIDPOINT_ROOT_BUTTON, 'mousedown', midpointRootButtonPressed);

        // Search Controls
        // ---------------

        on(SEARCH_OPTIONS_CASE_SENSITIVE_CB, 'click', searchOptionsCaseSenstiveCbClicked);
        on(SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB, 'click', searchOptionsCompleteTermsOnlyCbClicked);
        on(SEARCH_OPTIONS_REGEX_CB, 'click', searchOptionsRegexCbClicked);
        on(SEARCH_OPTIONS_NEGATE_RES_CB, 'click', searchOptionsNegateResultCbClicked);
        on(SEARCH_OPTIONS_PROPERTIES_CB, 'click', searchOptionsPropertiesCbClicked);

        on(RESET_SEARCH_A_BTN, 'mousedown', resetSearch0);
        on(RESET_SEARCH_B_BTN, 'mousedown', resetSearch1);

        // Visualization Legends
        // ---------------------

        onHold(LEGENDS_MOVE_UP_BTN, function () {
            legendMoveUp(2);
            _intervalId = setInterval(legendMoveUp, MOVE_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        onHold(LEGENDS_MOVE_DOWN_BTN, function () {
            legendMoveDown(2);
            _intervalId = setInterval(legendMoveDown, MOVE_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        onHold(LEGENDS_MOVE_LEFT_BTN, function () {
            legendMoveLeft(2);
            _intervalId = setInterval(legendMoveLeft, MOVE_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        onHold(LEGENDS_MOVE_RIGHT_BTN, function () {
            legendMoveRight(2);
            _intervalId = setInterval(legendMoveRight, MOVE_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        on(LEGENDS_HORIZ_VERT_BTN, 'click', legendHorizVertClicked);
        on(LEGENDS_SHOW_BTN, 'click', legendShowClicked);
        on(LEGENDS_RESET_BTN, 'click', legendResetClicked);

        // ----------------

        if (downloadButton) {
            downloadButton.addEventListener('mousedown', downloadButtonPressed);
        }

        if (submitSelectedButton) {
            submitSelectedButton.addEventListener('mousedown', submitSelectedPressed);
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

        setStyles(byId(NODE_FILL_COLOR_SELECT_MENU), {
            'font': 'inherit', 'color': 'inherit'
        });

        setStyles(byId(NODE_SHAPE_SELECT_MENU), {
            'font': 'inherit', 'color': 'inherit'
        });

        setStyles(byId(NODE_SIZE_SELECT_MENU), {
            'font': 'inherit', 'color': 'inherit'
        });


        setStyles(byId(LABEL_COLOR_SELECT_MENU_2), {
            'font': 'inherit', 'color': 'inherit'
        });

        setStyles(byId(NODE_FILL_COLOR_SELECT_MENU_2), {
            'font': 'inherit', 'color': 'inherit'
        });

        setStyles(byId(LABEL_COLOR_SELECT_MENU_3), {
            'font': 'inherit', 'color': 'inherit'
        });

        setStyles(byId(NODE_FILL_COLOR_SELECT_MENU_3), {
            'font': 'inherit', 'color': 'inherit'
        });

        setStyles(byId(LABEL_COLOR_SELECT_MENU_4), {
            'font': 'inherit', 'color': 'inherit'
        });

        setStyles(byId(NODE_FILL_COLOR_SELECT_MENU_4), {
            'font': 'inherit', 'color': 'inherit'
        });


        // MSA residue visualization: Position control
        // -------------------------------------------
        setStylesAll('#' + MSA_RESIDUE_VIS_DECR_CURR_RES_POS_BTN + ', #' + MSA_RESIDUE_VIS_INCR_CURR_RES_POS_BTN, {
            'width': '18px'
        });

        setStyles(byId(MSA_RESIDUE_VIS_CURR_RES_POS_LABEL), {
            'font': 'inherit',
            'color': 'inherit',
            'text-align': 'center',
            'outline': 'none',
            'cursor': 'text',
            'width': '28px',
            'height': _settings.textFieldHeight
        });

        on(MSA_RESIDUE_VIS_CURR_RES_POS_LABEL, 'keyup', function (e) {
            let keycode = e.keyCode;
            if ((((keycode >= VK_0) && (keycode <= VK_9)) || ((keycode >= VK_0_NUMPAD)) && (keycode <= VK_9_NUMPAD)) || (keycode === VK_BACKSPACE) || (keycode === VK_DELETE)) {
                let i = 0;
                if ((((keycode >= VK_0) && (keycode <= VK_9)) || ((keycode >= VK_0_NUMPAD) && (keycode <= VK_9_NUMPAD))) && _basicTreeProperties.maxMolSeqLength && (_msa_residue_vis_curr_res_pos >= (_basicTreeProperties.maxMolSeqLength - 1))) {
                    if (((keycode >= VK_0) && (keycode <= VK_9))) {
                        i = keycode - 48;
                    } else {
                        i = keycode - 96;
                    }
                } else {
                    let x = getValue(MSA_RESIDUE_VIS_CURR_RES_POS_LABEL).trim();
                    if (x === '') {
                        return;
                    }
                    i = parseInt(x);
                    if ((i == null) || isNaN(i) || (i < 0)) {
                        i = 0;
                    }
                }
                showMsaResidueVisualizationAsLabelColorIfNotAlreadyShown();
                setMsaResidueVisCurrResPos(i - 1);
                updateMsaResidueVisCurrResPosLabel();
                updateMsaResidueVisCurrResPosSliderValue();
                update(null, 0, true);
            } else {
                update(null, 0, true);
            }
        });

        onHold(MSA_RESIDUE_VIS_DECR_CURR_RES_POS_BTN, function () {
            decrMsaResidueVisCurrResPos();
            _intervalId = setInterval(decrMsaResidueVisCurrResPos, ZOOM_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });

        onHold(MSA_RESIDUE_VIS_INCR_CURR_RES_POS_BTN, function () {
            incrMsaResidueVisCurrResPos();
            _intervalId = setInterval(incrMsaResidueVisCurrResPos, ZOOM_INTERVAL);
        }, function () {
            clearTimeout(_intervalId);
        });


        // -------------------------------------------

        document.addEventListener('keyup', function (e) {
            if (e.altKey) {
                if (e.keyCode === VK_O) {
                    orderButtonPressed();
                } else if (e.keyCode === VK_R) {
                    returnToSupertreeButtonByOnePressed();
                } else if (e.keyCode === VK_M) {
                    midpointRootButtonPressed();
                } else if (e.keyCode === VK_C || e.keyCode === VK_DELETE || e.keyCode === VK_BACKSPACE) {
                    zoomToFit();
                } else if (e.keyCode === VK_P) {
                    cycleDisplay();
                } else if (e.keyCode === VK_L) {
                    toggleAlignPhylogram();
                } else if (e.keyCode === VK_OPEN_BRACKET) {
                    if (isCanDoMsaResidueVisualizations()) {
                        decrMsaResidueVisCurrResPos();
                    }
                } else if (e.keyCode === VK_CLOSE_BRACKET) {
                    if (isCanDoMsaResidueVisualizations()) {
                        incrMsaResidueVisCurrResPos();
                    }
                }
            } else if (e.keyCode === VK_ESC || e.keyCode === VK_HOME) {
                escPressed();
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
                if (e.deltaY > 0) {
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
            }
        }, {passive: false});

        // --------------------------------------------------------------
        // Functions to make GUI elements
        // --------------------------------------------------------------

        function makeProgramDesc() {
            let h = "";
            h = h.concat('<div class=' + PROG_NAME + '>');
            h = h.concat('<a class="' + PROGNAMELINK + '" href="' + WEBSITE + '" target="_blank">' + NAME + ' ' + VERSION + '</a>');
            h = h.concat('</div>');
            return h;
        }

        function makeTreeDesc() {
            let h = "";
            h = h.concat('<fieldset>');
            // Create the tooltip text
            let tooltipText = "";
            if (_treeData.name) {
                tooltipText += "Name: " + _treeData.name;
            }
            if (_treeData.description) {
                if (tooltipText) tooltipText += "\n\n";
                tooltipText += "Description: " + _treeData.description;
            }

            h = h.concat('<div class="' + TREE_DESC + '" title="' + tooltipText + '">');
            let f = false;
            if (_treeData.name) {
                if (_treeData.name.length > 20) {
                    h = h.concat(_treeData.name.split(/[^A-Za-z0-9_]/)[0].substring(0, 20));
                } else {
                    h = h.concat(_treeData.name);
                }
                f = true;
            }

            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        function makePhylogramControl() {
            let radioGroup = 'phylogram_control_radio';
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<div class="aptx-modebar">');
            h = h.concat('<div class="' + PHYLOGRAM_CLADOGRAM_CONTROLGROUP + ' aptx-segmented">');
            h = h.concat(makeSegment('P', PHYLOGRAM_BUTTON, radioGroup, 'phylogram display (uses branch length values)  (use Alt+P to cycle between display types)'));
            h = h.concat(makeSegment('A', PHYLOGRAM_ALIGNED_BUTTON, radioGroup, 'phylogram display (uses branch length values) with aligned labels  (use Alt+P to cycle between display types)'));
            h = h.concat(makeSegment('C', CLADOGRAM_BUTTON, radioGroup, ' cladogram display (ignores branch length values)  (use Alt+P to cycle between display types)'));
            h = h.concat('</div>');
            h = h.concat('<label class="aptx-toggle" title="display the tree as a circular (radial) tree"><input type="checkbox" name="' + CIRCULAR_CB + '" id="' + CIRCULAR_CB + '"><span>Circular</span></label>');
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        // One segment of the P/A/C segmented display-type control.
        function makeSegment(label, id, radioGroup, tooltip) {
            return '<label class="aptx-seg" title="' + tooltip + '"><input type="radio" name="' + radioGroup + '" id="' + id + '"><span>' + label + '</span></label>';
        }

        function makeIdForCustomCheckboxButton(key) {
            return key + '__cb';
        }

        function makeDisplayControl() {
            let labels = [];
            let nodes = [];
            let opts = [];

            // --- Labels: what text/data is drawn on the tree ---
            if (_settings.showNodeNameButton && _basicTreeProperties.nodeNames) {
                labels.push(makeCheckboxItem('Node Name', NODE_NAME_CB, 'to show/hide node names (node names usually are the untyped labels found in New Hampshire/Newick formatted trees)'));
            }
            if (_settings.showTaxonomyButton && _basicTreeProperties.taxonomies) {
                labels.push(makeCheckboxItem('Taxonomy', TAXONOMY_CB, 'to show/hide node taxonomic information'));
            }
            if (_settings.showSequenceButton && _basicTreeProperties.sequences) {
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
            if (_settings.showExternalLabelsButton) {
                labels.push(makeCheckboxItem('Ext. Labels', EXTERNAL_LABEL_CB, 'to show/hide external node labels'));
            }
            if (_basicTreeProperties.internalNodeData && _settings.showInternalLabelsButton) {
                labels.push(makeCheckboxItem('Int. Labels', INTERNAL_LABEL_CB, 'to show/hide internal node labels'));
            }

            // --- Nodes & branches: shapes, events, colors, visualizations ---
            if (_basicTreeProperties.nodeEvents) {
                nodes.push(makeCheckboxItem('Node Events', NODE_EVENTS_CB, 'to show speciations and duplications as colored nodes (e.g. speciations green, duplications red)'));
            }
            if (_basicTreeProperties.branchEvents) {
                nodes.push(makeCheckboxItem('Branch Events', BRANCH_EVENTS_CB, 'to show/hide branch events (e.g. mutations)'));
            }
            if (_settings.showExternalNodesButton) {
                nodes.push(makeCheckboxItem('Ext. Nodes', EXTERNAL_NODES_CB, 'to show external nodes as shapes (usually circles)'));
            }
            if (_settings.showInternalNodesButton) {
                nodes.push(makeCheckboxItem('Int. Nodes', INTERNAL_NODES_CB, 'to show internal nodes as shapes (usually circles)'));
            }
            if (_settings.showBranchColorsButton) {
                nodes.push(makeCheckboxItem('Branch Colors', BRANCH_COLORS_CB, 'to use/ignore branch colors (if present in tree file)'));
            }
            if (_settings.enableNodeVisualizations) {
                nodes.push(makeCheckboxItem('Node Vis', NODE_VIS_CB, 'to show/hide node visualizations (colors, shapes, sizes), set with the Visualizations sub-menu'));
            }
            if (_settings.enableBranchVisualizations) {
                nodes.push(makeCheckboxItem('Branch Vis', BRANCH_VIS_CB, 'to show/hide branch visualizations, set with the Visualizations sub-menu'));
            }

            // --- Options ---
            if (_settings.showDynahideButton) {
                opts.push(makeCheckboxItem('Dyna Hide', DYNAHIDE_CB, 'to hide external labels depending on expected visibility'));
            }
            if (_settings.showShortenNodeNamesButton) {
                opts.push(makeCheckboxItem('Short Names', SHORTEN_NODE_NAME_CB, 'to shorten long node names'));
            }

            let h = '<fieldset><legend>Display Data</legend>';
            h = h.concat(makeCheckboxGroup('Labels', labels));
            h = h.concat(makeCheckboxGroup('Nodes', nodes));
            h = h.concat(makeCheckboxGroup('Options', opts));
            h = h.concat('</fieldset>');
            return h;
        }

        function makeZoomControl() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Zoom</legend>');
            h = h.concat(makeButton('Y+', ZOOM_IN_Y, 'zoom in vertically (Alt+Up or Shift+mousewheel)'));
            h = h.concat('<br>');
            h = h.concat(makeButton('X-', ZOOM_OUT_X, 'zoom out horizontally (Alt+Left or Shift+Alt+mousewheel)'));
            h = h.concat(makeButton('F', ZOOM_TO_FIT, 'fit and center tree display (Alt+C), use Home or Esc for almost complete reset'));
            h = h.concat(makeButton('E', ZOOM_TO_EXPAND_Y, 'fit and center tree, expand vertically'));
            h = h.concat(makeButton('X+', ZOOM_IN_X, 'zoom in horizontally (Alt+Right or Shift+Alt+mousewheel)'));
            h = h.concat('<br>');
            h = h.concat(makeButton('Y-', ZOOM_OUT_Y, 'zoom out vertically (Alt+Down or Shift+mousewheel)'));
            h = h.concat('</fieldset>');
            return h;
        }

        function makeControlButtons() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Tools</legend>');
            h = h.concat('<div>');
            h = h.concat(makeButton('O', ORDER_BUTTON, 'order all (Alt+O)'));
            h = h.concat(makeButton('R1', RETURN_TO_SUPERTREE_BUTTON_BY_ONE, 'return to supertree by one branch (if in subtree) (Alt+R)'));
            h = h.concat(makeButton('R', RETURN_TO_SUPERTREE_BUTTON, 'return to supertree (if in subtree)'));
            h = h.concat(makeButton('M', MIDPOINT_ROOT_BUTTON, 'midpoint re-root (Alt+M)'));
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
            h = h.concat(makeSlider('External label size:', EXTERNAL_FONT_SIZE_SLIDER));
            if (_basicTreeProperties.internalNodeData) {
                h = h.concat(makeSlider('Internal label size:', INTERNAL_FONT_SIZE_SLIDER));
            }
            if (_basicTreeProperties.branchLengths || _basicTreeProperties.confidences || _basicTreeProperties.branchEvents) {
                h = h.concat(makeSlider('Branch label size:', BRANCH_DATA_FONT_SIZE_SLIDER));
            }
            h = h.concat(makeSlider('Node size:', NODE_SIZE_SLIDER));
            h = h.concat(makeSlider('Branch width:', BRANCH_WIDTH_SLIDER));
            h = h.concat('</fieldset>');
            return h;
        }

        // --------------------------------------------------------------
        // Functions to make search-related elements
        // --------------------------------------------------------------
        function makeSearchBoxes() {

            let tooltip = "enter text to search for (use ',' for logical OR and '+' for logical AND," + " use expressions in form of XX:term for typed search -- e.g. NN:node name, TC:taxonomy code," + " TS:taxonomy scientific name, SN:sequence name, GN:gene name, SS:sequence symbol, MS:molecular sequence, ...)";
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Search</legend>');
            h = h.concat('<label class="aptx-field-label" for="' + SEARCH_FIELD_0 + '">Search A</label>');
            h = h.concat('<div class="aptx-search-row">');
            h = h.concat(makeTextInput(SEARCH_FIELD_0, tooltip));
            h = h.concat(makeButton('R', RESET_SEARCH_A_BTN, RESET_SEARCH_A_BTN_TOOLTIP));
            h = h.concat('</div>');
            h = h.concat('<label class="aptx-field-label" for="' + SEARCH_FIELD_1 + '">Search B</label>');
            h = h.concat('<div class="aptx-search-row">');
            h = h.concat(makeTextInput(SEARCH_FIELD_1, tooltip));
            h = h.concat(makeButton('R', RESET_SEARCH_B_BTN, RESET_SEARCH_B_BTN_TOOLTIP));
            h = h.concat('</div>');
            h = h.concat(makeSearchControlsCompact());
            h = h.concat('</fieldset>');
            return h;
        }

        function makeSearchControlsCompact() {
            let h = "";
            h = h.concat('<div class="' + SEARCH_OPTIONS_GROUP + '">');
            h = h.concat(makeCheckboxItem('C', SEARCH_OPTIONS_CASE_SENSITIVE_CB, 'to search in a case-sensitive manner'));
            h = h.concat(makeCheckboxItem('W', SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB, ' to match complete terms (separated by spaces or underscores) only (does not apply to regular expression search)'));
            h = h.concat(makeCheckboxItem('R', SEARCH_OPTIONS_REGEX_CB, 'to search with regular expressions'));
            if (_settings.showSearchPropertiesButton === true) {
                h = h.concat(makeCheckboxItem('P', SEARCH_OPTIONS_PROPERTIES_CB, 'to search (hidden) properties'));
            }
            h = h.concat(makeCheckboxItem('N', SEARCH_OPTIONS_NEGATE_RES_CB, 'to invert (negate) the search results'));
            h = h.concat('</div>');
            return h;
        }


        // --------------------------------------------------------------
        // Functions to make visualization controls
        // --------------------------------------------------------------
        function makeVisualControls() {
            let h = "";
            h = h.concat('<form action="#">');
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Visualizations</legend>');
            h = h.concat(makeSelectMenu('Label Color:', '<br>', LABEL_COLOR_SELECT_MENU, 'colorize the node label according to a property'));
            h = h.concat('<br>');
            h = h.concat(makeSelectMenu('Node Fill Color:', '<br>', NODE_FILL_COLOR_SELECT_MENU, 'colorize the node fill according to a property'));
            h = h.concat('<br>');
            h = h.concat(makeSelectMenu('Node Shape:', '<br>', NODE_SHAPE_SELECT_MENU, 'change the node shape according to a property'));
            h = h.concat('<br>');
            h = h.concat(makeSelectMenu('Node Size:', '<br>', NODE_SIZE_SELECT_MENU, 'change the node size according to a property'));
            h = h.concat('</fieldset>');
            h = h.concat('</form>');
            return h;
        }

        function makeVisualization2(title) {
            let h = "";
            h = h.concat('<form action="#">');
            h = h.concat('<fieldset>');
            h = h.concat('<legend>' + title + '</legend>');
            h = h.concat(makeSelectMenu('Label Color:', '<br>', LABEL_COLOR_SELECT_MENU_2, 'colorize the node label according to a property'));
            h = h.concat('<br>');
            h = h.concat(makeSelectMenu('Node Fill Color:', '<br>', NODE_FILL_COLOR_SELECT_MENU_2, 'colorize the node fill according to a property'));
            h = h.concat('</fieldset>');
            h = h.concat('</form>');
            return h;
        }

        function makeVisualization3(title) {
            let h = "";
            h = h.concat('<form action="#">');
            h = h.concat('<fieldset>');
            h = h.concat('<legend>' + title + '</legend>');
            h = h.concat(makeSelectMenu('Label Color:', '<br>', LABEL_COLOR_SELECT_MENU_3, 'colorize the node label according to a property'));
            h = h.concat('<br>');
            h = h.concat(makeSelectMenu('Node Fill Color:', '<br>', NODE_FILL_COLOR_SELECT_MENU_3, 'colorize the node fill according to a property'));
            h = h.concat('</fieldset>');
            h = h.concat('</form>');
            return h;
        }

        function makeVisualization4(title) {
            let h = "";
            h = h.concat('<form action="#">');
            h = h.concat('<fieldset>');
            h = h.concat('<legend>' + title + '</legend>');
            h = h.concat(makeSelectMenu('Label Color:', '<br>', LABEL_COLOR_SELECT_MENU_4, 'colorize the node label according to a property'));
            h = h.concat('<br>');
            h = h.concat(makeSelectMenu('Node Fill Color:', '<br>', NODE_FILL_COLOR_SELECT_MENU_4, 'colorize the node fill according to a property'));
            h = h.concat('</fieldset>');
            h = h.concat('</form>');
            return h;
        }

        function makeMsaResidueVisCurrResPositionControl() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>MSA Residue Pos.</legend>');
            h = h.concat(makeSlider(null, MSA_RESIDUE_VIS_CURR_RES_POS_SLIDER_1));
            h = h.concat(makeButton('-', MSA_RESIDUE_VIS_DECR_CURR_RES_POS_BTN, 'to decrease current MSA residue position by 1 (wraps around) (Alt+[)'));
            h = h.concat(makeTextInput(MSA_RESIDUE_VIS_CURR_RES_POS_LABEL, 'the current MSA residue position'));
            h = h.concat(makeButton('+', MSA_RESIDUE_VIS_INCR_CURR_RES_POS_BTN, 'to increase current MSA residue position by 1 (wraps around) (Alt+])'));
            h = h.concat('</fieldset>');
            return h;
        }

        function makeLegendControl() {
            let mouseTip = ' (alternatively, place legend with mouse using shift+left-mouse-button click, or alt+left-mouse-button click)';
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Vis Legend</legend>');
            h = h.concat(makeButton('Show', LEGENDS_SHOW_BTN, 'to show/hide legend(s)'));
            h = h.concat(makeButton('Dir', LEGENDS_HORIZ_VERT_BTN, 'to toggle between vertical and horizontal alignment of (multiple) legends'));
            h = h.concat('<br>');
            h = h.concat(makeButton('^', LEGENDS_MOVE_UP_BTN, 'move legend(s) up' + mouseTip));
            h = h.concat('<br>');
            h = h.concat(makeButton('<', LEGENDS_MOVE_LEFT_BTN, 'move legend(s) left' + mouseTip));
            h = h.concat(makeButton('R', LEGENDS_RESET_BTN, 'return legend(s) to original position' + mouseTip));
            h = h.concat(makeButton('>', LEGENDS_MOVE_RIGHT_BTN, 'move legend(s) right' + mouseTip));
            h = h.concat('<br>');
            h = h.concat(makeButton('v', LEGENDS_MOVE_DOWN_BTN, 'move legend(s) down' + mouseTip));
            h = h.concat('</fieldset>');
            return h;
        }


        // --------------------------------------------------------------
        // Functions to make individual GUI components
        // --------------------------------------------------------------
        function makeButton(label, id, tooltip) {
            return '<input type="button" value="' + label + '" name="' + id + '" id="' + id + '" title="' + tooltip + '">';
        }

        // A checkbox + label item, used by the Display Data grid and the inline search-option row.
        function makeCheckboxItem(label, id, tooltip) {
            return '<label class="aptx-check" title="' + tooltip + '"><input type="checkbox" name="' + id + '" id="' + id + '"><span>' + label + '</span></label>';
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

        function makeTextInput(id, tooltip) {
            return '<input title="' + tooltip + '" type="text" name="' + id + '" id="' + id + '">';
        }

    } // function createGui()

    function initializeGui() {

        setDisplayTypeButtons();

        setCheckboxValue(NODE_NAME_CB, _options.showNodeName);
        setCheckboxValue(TAXONOMY_CB, _options.showTaxonomy);
        setCheckboxValue(SEQUENCE_CB, _options.showSequence)
        setCheckboxValue(CONFIDENCE_VALUES_CB, _options.showConfidenceValues);
        setCheckboxValue(BRANCH_LENGTH_VALUES_CB, _options.showBranchLengthValues);
        setCheckboxValue(NODE_EVENTS_CB, _options.showNodeEvents);
        setCheckboxValue(BRANCH_EVENTS_CB, _options.showBranchEvents);
        setCheckboxValue(INTERNAL_LABEL_CB, _options.showInternalLabels);
        setCheckboxValue(EXTERNAL_LABEL_CB, _options.showExternalLabels);
        setCheckboxValue(INTERNAL_NODES_CB, _options.showInternalNodes);
        setCheckboxValue(EXTERNAL_NODES_CB, _options.showExternalNodes);
        setCheckboxValue(BRANCH_COLORS_CB, _options.showBranchColors);
        setCheckboxValue(NODE_VIS_CB, _options.showNodeVisualizations);
        setCheckboxValue(BRANCH_VIS_CB, _options.showBranchVisualizations);
        setCheckboxValue(DYNAHIDE_CB, _options.dynahide);
        setCheckboxValue(SHORTEN_NODE_NAME_CB, _options.shortenNodeNames);
        initializeVisualizationMenu();
        initializeSearchOptions();
        makeBackground();
    }

    function makeBackground() {
        _baseSvg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('opacity', 1)
            .attr('class', BASE_BACKGROUND)
            .attr('fill', _options.backgroundColorDefault);
    }


    function initializeVisualizationMenu() {

        _currentLabelColorVisualization = DEFAULT;
        _currentNodeSizeVisualization = DEFAULT;
        _currentNodeFillColorVisualization = DEFAULT;
        _currentNodeSizeVisualization = DEFAULT;

        addOption(NODE_FILL_COLOR_SELECT_MENU, DEFAULT, 'default');

        addOption(NODE_SHAPE_SELECT_MENU, DEFAULT, 'default');
        addOption(NODE_SIZE_SELECT_MENU, DEFAULT, 'default');
        addOption(LABEL_COLOR_SELECT_MENU, DEFAULT, 'default');

        addOption(NODE_FILL_COLOR_SELECT_MENU_2, DEFAULT, 'default');
        addOption(LABEL_COLOR_SELECT_MENU_2, DEFAULT, 'default');

        addOption(NODE_FILL_COLOR_SELECT_MENU_3, DEFAULT, 'default');

        addOption(LABEL_COLOR_SELECT_MENU_3, DEFAULT, 'default');

        addOption(NODE_FILL_COLOR_SELECT_MENU_4, DEFAULT, 'default');

        addOption(LABEL_COLOR_SELECT_MENU_4, DEFAULT, 'default');

        if (_visualizations) {
            if (_visualizations.labelColor) {
                for (let key in _visualizations.labelColor) {
                    if (_visualizations.labelColor.hasOwnProperty(key)) {
                        let key_html = key;
                        if (key_html.length > 15) {
                            key_html = key_html.substring(0, 15);
                        }
                        addOption(LABEL_COLOR_SELECT_MENU, key, key_html);
                    }
                }
            }
            if (_visualizations.nodeShape) {
                for (let key in _visualizations.nodeShape) {
                    if (_visualizations.nodeShape.hasOwnProperty(key)) {
                        let key_html = key;
                        if (key_html.length > 15) {
                            key_html = key_html.substring(0, 15);
                        }
                        addOption(NODE_SHAPE_SELECT_MENU, key, key_html);
                    }
                }
            }
            if (_visualizations.nodeFillColor) {
                for (let key in _visualizations.nodeFillColor) {
                    if (_visualizations.nodeFillColor.hasOwnProperty(key)) {
                        let key_html = key;
                        if (key_html.length > 15) {
                            key_html = key_html.substring(0, 15);
                        }
                        addOption(NODE_FILL_COLOR_SELECT_MENU, key, key_html);
                    }
                }
            }
            if (_visualizations.nodeSize) {
                for (let key in _visualizations.nodeSize) {
                    if (_visualizations.nodeSize.hasOwnProperty(key)) {
                        let key_html = key;
                        if (key_html.length > 15) {
                            key_html = key_html.substring(0, 15);
                        }
                        addOption(NODE_SIZE_SELECT_MENU, key, key_html);
                    }
                }
            }
        }

        if (_specialVisualizations != null) {
            if ('Mutations' in _specialVisualizations) {
                const mutations = _specialVisualizations['Mutations'];
                if (mutations != null && mutations.property_values != null) {
                    const properties = mutations.property_values;
                    const arrayLength = properties.length;
                    for (let i = 0; i < arrayLength; i++) {
                        const key = properties[i];
                        addOption(LABEL_COLOR_SELECT_MENU_2, key, key);
                        addOption(NODE_FILL_COLOR_SELECT_MENU_2, key, key);
                    }
                }
            }

            if ('Convergent_Mutations' in _specialVisualizations) {
                const conv_mutations = _specialVisualizations['Convergent_Mutations'];

                if (conv_mutations != null && conv_mutations.property_values != null) {
                    const properties = conv_mutations.property_values;
                    const arrayLength = properties.length;
                    for (let i = 0; i < arrayLength; i++) {
                        const key = properties[i];
                        addOption(LABEL_COLOR_SELECT_MENU_3, key, key);
                        addOption(NODE_FILL_COLOR_SELECT_MENU_3, key, key);
                    }
                }
            }

            if ('vipr:PANGO_Lineage' in _specialVisualizations) {
                const lineages = _specialVisualizations['vipr:PANGO_Lineage'];

                if (lineages != null && lineages.property_values != null) {
                    const properties = lineages.property_values;
                    const arrayLength = properties.length;
                    for (let i = 0; i < arrayLength; i++) {
                        const key = properties[i];
                        addOption(LABEL_COLOR_SELECT_MENU_4, key, key);
                        addOption(NODE_FILL_COLOR_SELECT_MENU_4, key, key);
                    }
                }
            }
        }


        initSlider(MSA_RESIDUE_VIS_CURR_RES_POS_SLIDER_1, 1, _basicTreeProperties.maxMolSeqLength, 1, 1, updateMsaResidueVisCurrResPosFromSlider);

    }

    function initializeSearchOptions() {
        if (_options.searchUsesRegex === true) {
            _options.searchIsPartial = true;
        }
        if (_options.searchIsPartial === false) {
            _options.searchUsesRegex = false;
        }
        _options.searchNegateResult = false;
        setCheckboxValue(SEARCH_OPTIONS_CASE_SENSITIVE_CB, _options.searchIsCaseSensitive);
        setCheckboxValue(SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB, !_options.searchIsPartial);
        setCheckboxValue(SEARCH_OPTIONS_REGEX_CB, _options.searchUsesRegex);
        setCheckboxValue(SEARCH_OPTIONS_NEGATE_RES_CB, _options.searchNegateResult);
        setCheckboxValue(SEARCH_OPTIONS_PROPERTIES_CB, _options.searchProperties);

        if (_options.searchAinitialValue) {
            setValue(SEARCH_FIELD_0, _options.searchAinitialValue);
        }
        if (_options.searchBinitialValue) {
            setValue(SEARCH_FIELD_1, _options.searchBinitialValue);
        }
    }


    function initializeInitialVisualization() {
        if (_options && _visualizations) {
            if (_options.initialNodeFillColorVisualization && _options.initialNodeFillColorVisualization !== DEFAULT && _visualizations.nodeFillColor[_options.initialNodeFillColorVisualization] != null) {
                _currentNodeFillColorVisualization = _options.initialNodeFillColorVisualization;
                setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU, _currentNodeFillColorVisualization);
                addLegend(LEGEND_NODE_FILL_COLOR, _visualizations.nodeFillColor[_currentNodeFillColorVisualization]);
                _options.showExternalNodes = true;
                setCheckboxValue(EXTERNAL_NODES_CB, true);
            }
            if (_options.initialLabelColorVisualization && _options.initialLabelColorVisualization !== DEFAULT && _visualizations.labelColor[_options.initialLabelColorVisualization] != null) {
                _currentLabelColorVisualization = _options.initialLabelColorVisualization;
                setSelectMenuValue(LABEL_COLOR_SELECT_MENU, _currentLabelColorVisualization);
                addLegend(LEGEND_LABEL_COLOR, _visualizations.labelColor[_currentLabelColorVisualization]);
            }
        }
    }


    function orderSubtree(n, order) {
        let changed = false;
        ord(n);
        if (!changed) {
            order = !order;
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
                if (e0 !== e1 && e0 < e1 === order) {
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
        if (_options.phylogram && !_options.alignPhylogram) {
            _options.alignPhylogram = true;

        } else if (_options.phylogram && _options.alignPhylogram) {
            _options.phylogram = false;
            _options.alignPhylogram = false;
        } else if (!_options.phylogram && !_options.alignPhylogram) {
            _options.phylogram = true;
        }
        setDisplayTypeButtons();
        update(null, 0);
    }

    function setDisplayTypeButtons() {
        setRadioButtonValue(PHYLOGRAM_BUTTON, _options.phylogram && !_options.alignPhylogram);
        setRadioButtonValue(CLADOGRAM_BUTTON, !_options.phylogram && !_options.alignPhylogram);
        setRadioButtonValue(PHYLOGRAM_ALIGNED_BUTTON, _options.alignPhylogram && _options.phylogram);
        setCheckboxValue(CIRCULAR_CB, _options.circular);
        if (!_basicTreeProperties.branchLengths) {
            disableCheckbox('#' + PHYLOGRAM_BUTTON);
            disableCheckbox('#' + PHYLOGRAM_ALIGNED_BUTTON);
        }
    }

    function decrMsaResidueVisCurrResPos() {
        if (_msa_residue_vis_curr_res_pos <= 0) {
            _msa_residue_vis_curr_res_pos = _basicTreeProperties.maxMolSeqLength - 1;
        } else {
            _msa_residue_vis_curr_res_pos -= 1;
        }
        updateMsaResidueVisCurrResPosSliderValue();
        showMsaResidueVisualizationAsLabelColorIfNotAlreadyShown();
        update(null, 0, true);
    }

    function incrMsaResidueVisCurrResPos() {
        if (_msa_residue_vis_curr_res_pos >= (_basicTreeProperties.maxMolSeqLength - 1)) {
            _msa_residue_vis_curr_res_pos = 0;
        } else {
            _msa_residue_vis_curr_res_pos += 1;
        }
        updateMsaResidueVisCurrResPosSliderValue();
        showMsaResidueVisualizationAsLabelColorIfNotAlreadyShown();
        update(null, 0, true);
    }

    function showMsaResidueVisualizationAsLabelColorIfNotAlreadyShown() {

        if ((_currentLabelColorVisualization == null || _currentLabelColorVisualization === DEFAULT) && (_currentNodeFillColorVisualization !== MSA_RESIDUE) && (_currentNodeShapeVisualization !== MSA_RESIDUE) && isCanDoMsaResidueVisualizations()) {

            _currentLabelColorVisualization = MSA_RESIDUE;
            setValue(LABEL_COLOR_SELECT_MENU, MSA_RESIDUE);
            addLegend(LEGEND_LABEL_COLOR, _visualizations.labelColor[_currentLabelColorVisualization]);
            if (_settings.enableBranchVisualizations) {
                _options.showBranchVisualizations = true;
                setCheckboxValue(BRANCH_VIS_CB, _options.showBranchVisualizations);
            }
        } else if ((_currentLabelColorVisualization !== MSA_RESIDUE) && (_currentNodeFillColorVisualization == null || _currentNodeFillColorVisualization === DEFAULT) && (_currentNodeShapeVisualization !== MSA_RESIDUE) && isCanDoMsaResidueVisualizations()) {
            _currentNodeFillColorVisualization = MSA_RESIDUE;
            setValue(NODE_FILL_COLOR_SELECT_MENU, MSA_RESIDUE);
            addLegend(LEGEND_NODE_FILL_COLOR, _visualizations.nodeFillColor[_currentNodeFillColorVisualization]);
            if (_settings.enableBranchVisualizations) {
                _options.showBranchVisualizations = true;
                setCheckboxValue(BRANCH_VIS_CB, _options.showBranchVisualizations);
            }
        } else if ((_currentLabelColorVisualization !== MSA_RESIDUE) && (_currentNodeFillColorVisualization !== MSA_RESIDUE) && (_currentNodeShapeVisualization == null || _currentNodeShapeVisualization === DEFAULT) && isCanDoMsaResidueVisualizations()) {
            _currentNodeShapeVisualization = MSA_RESIDUE;
            setValue(NODE_SHAPE_SELECT_MENU, MSA_RESIDUE);
            addLegend(LEGEND_NODE_SHAPE, _visualizations.nodeShape[_currentNodeShapeVisualization]);
        }
    }


    function updateMsaResidueVisCurrResPosLabel() {
        setValue(MSA_RESIDUE_VIS_CURR_RES_POS_LABEL, _msa_residue_vis_curr_res_pos + 1);
    }

    function setMsaResidueVisCurrResPos(position) {
        if (position <= 0) {
            _msa_residue_vis_curr_res_pos = 0;
        } else if (_basicTreeProperties.maxMolSeqLength && (position >= (_basicTreeProperties.maxMolSeqLength - 1))) {
            _msa_residue_vis_curr_res_pos = _basicTreeProperties.maxMolSeqLength - 1;
        } else {
            _msa_residue_vis_curr_res_pos = position;
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
                    b.style.background = _options.found0ColorDefault;
                    b.style.color = WHITE;
                }
                let nd0 = _foundNodes0.size === 1 ? 'node' : 'nodes';
                b.title = 'found ' + _foundNodes0.size + ' ' + nd0 + ' [click to ' + RESET_SEARCH_A_BTN_TOOLTIP + ']';
            }
        } else {
            b = byId(RESET_SEARCH_A_BTN);
            if (b) {
                b.disabled = true;
                b.style.background = _settings.controlsBackgroundColor;
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
                    b.style.background = _options.found1ColorDefault;
                    b.style.color = WHITE;
                }
                let nd1 = _foundNodes1.size === 1 ? 'node' : 'nodes';
                b.title = 'found ' + _foundNodes1.size + ' ' + nd1 + ' [click to ' + RESET_SEARCH_B_BTN_TOOLTIP + ']';
            }
        } else {
            b = byId(RESET_SEARCH_B_BTN);
            if (b) {
                b.disabled = true;
                b.style.background = _settings.controlsBackgroundColor;
                b.style.color = '';
                b.title = RESET_SEARCH_B_BTN_TOOLTIP;
            }
        }
    }

    function updateLegendButtonEnabledState() {
        let b = byId(LEGENDS_SHOW_BTN);
        if (b) {
            if (_showLegends) {
                b.style.background = COLOR_FOR_ACTIVE_ELEMENTS;
                b.style.color = WHITE;
            } else {
                b.style.background = '';
                b.style.color = '';
            }
        }
        if (_showLegends && (_legendColorScales[LEGEND_LABEL_COLOR] || (_options.showNodeVisualizations && (_legendColorScales[LEGEND_NODE_FILL_COLOR] || _legendShapeScales[LEGEND_NODE_SHAPE] || _legendSizeScales[LEGEND_NODE_SIZE])))) {
            enableButton(byId(LEGENDS_HORIZ_VERT_BTN));
            enableButton(byId(LEGENDS_MOVE_UP_BTN));
            enableButton(byId(LEGENDS_MOVE_DOWN_BTN));
            enableButton(byId(LEGENDS_MOVE_LEFT_BTN));
            enableButton(byId(LEGENDS_MOVE_RIGHT_BTN));
            enableButton(byId(LEGENDS_RESET_BTN));
        } else {
            disableButton(byId(LEGENDS_HORIZ_VERT_BTN));
            disableButton(byId(LEGENDS_MOVE_UP_BTN));
            disableButton(byId(LEGENDS_MOVE_DOWN_BTN));
            disableButton(byId(LEGENDS_MOVE_LEFT_BTN));
            disableButton(byId(LEGENDS_MOVE_RIGHT_BTN));
            disableButton(byId(LEGENDS_RESET_BTN));
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
            b.style.background = _settings.controlsBackgroundColor;
        }
    }

    function enableButton(b) {
        if (b) {
            b.disabled = false;
            b.style.background = '';
        }
    }

    function getTreeAsSvg() {
        let container = _id.replace('#', '');
        let wrapper = document.getElementById(container);
        let svg = wrapper.querySelector('svg');
        let svgTree = null;
        if (typeof window.XMLSerializer !== 'undefined') {
            svgTree = (new XMLSerializer()).serializeToString(svg);
        } else if (typeof svg.xml !== 'undefined') {
            svgTree = svg.xml;
        }
        return svgTree;
    }

    function downloadTree(format) {
        if (format === PNG_EXPORT_FORMAT) {
            changeBaseBackgoundColor(_options.backgroundColorForPrintExportDefault);
            downloadAsPng();
            changeBaseBackgoundColor(_options.backgroundColorDefault);
        } else if (format === SVG_EXPORT_FORMAT) {
            changeBaseBackgoundColor(_options.backgroundColorForPrintExportDefault);
            downloadAsSVG();
            changeBaseBackgoundColor(_options.backgroundColorDefault);
        } else if (format === NH_EXPORT_FORMAT) {
            downloadAsNH();
        } else if (format === PHYLOXML_EXPORT_FORMAT) {
            downloadAsPhyloXml();
        } else if (format === PDF_EXPORT_FORMAT) {
            changeBaseBackgoundColor(_options.backgroundColorForPrintExportDefault);
            downloadAsPdf();
            changeBaseBackgoundColor(_options.backgroundColorDefault);
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
        saveAs(new Blob([x], {type: "application/xml"}), _options.nameForPhyloXmlDownload);
    }

    function downloadAsNH() {
        let nh = forester.toNewHampshire(_root, 9, _settings.nhExportReplaceIllegalChars, _settings.nhExportWriteConfidences);
        saveAs(new Blob([nh], {type: "application/txt"}), _options.nameForNhDownload);
    }

    function downloadAsSVG() {
        let svg = getTreeAsSvg();
        saveAs(new Blob([decodeURIComponent(encodeURIComponent(svg))], {type: "application/svg+xml"}), _options.nameForSvgDownload);
    }

    function downloadAsFastaAll() {
        let fasta_text = forester.getMolecularSequencesAsFasta(_root, '\n');
        saveAs(new Blob([fasta_text], {type: "application/txt"}), _options.nameForFastaDownload);
    }

    function downloadAsPdf() {
    }

    function downloadAsPng() {
        let svg = getTreeAsSvg();
        // Render onto an up-scaled canvas so the exported PNG is high-resolution
        // rather than 1:1 with the on-screen SVG. Scale is configurable via
        // _options.pngExportScale (default 4x).
        let svgEl = document.getElementById(_id.replace('#', '')).querySelector('svg');
        let scale = _options.pngExportScale > 0 ? _options.pngExportScale : 4;
        let w = (svgEl && svgEl.width.baseVal.value) || _displayWidth;
        let h = (svgEl && svgEl.height.baseVal.value) || _displayHeight;
        let canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvg(canvas, svg, {ignoreDimensions: true, scaleWidth: canvas.width, scaleHeight: canvas.height});
        canvas.toBlob(function (blob) {
            saveAs(blob, _options.nameForPngDownload);
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

    /**
     *
     *
     * @param label
     * @param location
     * @param data
     * @param options
     * @param settings
     * @param newHamphshireConfidenceValuesInBrackets
     * @param newHamphshireConfidenceValuesAsInternalNames
     * @param nodeVisualizations
     */
    archaeopteryx.launchArchaeopteryx = function (label, location, data, options, settings, newHamphshireConfidenceValuesInBrackets, newHamphshireConfidenceValuesAsInternalNames, nodeVisualizations) {
        let tree = null;
        try {
            tree = archaeopteryx.parseTree(location, data, newHamphshireConfidenceValuesInBrackets, newHamphshireConfidenceValuesAsInternalNames);
        } catch (e) {
            alert(ERROR + 'error while parsing tree: ' + e);
        }
        if (tree) {
            try {
                archaeopteryx.launch(label, tree, options, settings, nodeVisualizations);
            } catch (e) {
                alert(ERROR + 'error while launching archaeopteryx: ' + e);
            }
        }
    };


// --------------------------------------------------------------
// For exporting
// --------------------------------------------------------------
    if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser) module.exports.archaeopteryx = archaeopteryx; else if (typeof window !== "undefined") window.archaeopteryx = archaeopteryx; else this.archaeopteryx = archaeopteryx;
})();