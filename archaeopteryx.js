/**
 *  Copyright (C) 2022 Christian M. Zmasek
 *  Copyright (C) 2022 Yun Zhang
 *  Copyright (C) 2022 J. Craig Venter Institute
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

// v 2.0.0a4
// 2022-03-15
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
// * d3.js (version 3): https://www.npmjs.com/package/d3/v/3.5.17
// * jQuery (1.12.4): https://www.npmjs.com/package/jquery/v/1.12.4
// * jQuery UI (1.12.1): https://www.npmjs.com/package/jquery-ui/v/1.12.1
// * sax.js (1.2.4): https://www.npmjs.com/package/sax/v/1.2.4
//
//   For file (Newick/New Hampshire, phyloXML) and graphics (PNG, SVG)
//   download/export, the following five libraries are required as well:
// * canvg: https://www.npmjs.com/package/canvg
// * rgbcolor: https://www.npmjs.com/package/rgbcolor
// * Blob.js: https://github.com/eligrey/Blob.js
// * canvas-toBlob.js (needed in some versions of Internet Explorer and Opera): https://github.com/eligrey/canvas-toBlob.js
// * FileSaver.js: https://github.com/eligrey/FileSaver.js
//
//   Additionally, Archaeopteryx.js also requires the following CSS:
// * jquery-ui.css: https://code.jquery.com/ui/1.12.0/themes/base/jquery-ui.css
//
//
// Developer documentation:
// https://docs.google.com/document/d/1COVe0iYbKtcBQxGTP4_zuimpk2FH9iusOVOgd5xCJ3A
//
// User documentation:
// https://docs.google.com/document/d/16PjoaNeNTWPUNVGcdYukP6Y1G35PFhq39OiIMmD03U8

if (!d3) {
    throw "no d3.js";
}

if (!forester) {
    throw "no forester.js";
}

if (!phyloXml) {
    throw "no phyloxml.js";
}

(function archaeopteryx() {

    "use strict";

    const VERSION = '2.0.0a4';
    const WEBSITE = 'https://sites.google.com/view/archaeopteryxjs';
    const NAME = 'Archaeopteryx.js';

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

    // ---------------------------
    // Default values for options
    // ---------------------------
    const BACKGROUND_COLOR_DEFAULT = '#f0f0f0';
    const BACKGROUND_COLOR_FOR_PRINT_EXPORT_DEFAULT = '#ffffff';
    const BRANCH_COLOR_DEFAULT = '#909090';
    const BRANCH_DATA_FONT_SIZE_DEFAULT = 6;
    const BRANCH_WIDTH_DEFAULT = 1;
    const COLLAPSED_LABEL_LENGTH_DEFAULT = 7;
    const DECIMALS_FOR_LINEAR_RANGE_MEAN_VALUE_DEFAULT = 0;
    const EXTERNAL_NODE_FONT_SIZE_DEFAULT = 9;
    const FONT_DEFAULTS = ['Arial', 'Helvetica', 'Times'];
    const FOUND0_COLOR_DEFAULT = '#66cc00';
    const FOUND0AND1_COLOR_DEFAULT = '#0000ee';
    const FOUND1_COLOR_DEFAULT = '#ff00ff';
    const SELECTED_COLOR_DEFAULT = '#ff0000';
    const INTERNAL_NODE_FONT_SIZE_DEFAULT = 6;
    const LABEL_COLOR_DEFAULT = '#202020';
    const NAME_FOR_NH_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + NH_SUFFIX;
    const NAME_FOR_PHYLOXML_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + XML_SUFFIX;
    const NAME_FOR_PNG_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + PNG_SUFFIX;
    const NAME_FOR_SVG_DOWNLOAD_DEFAULT = 'archaeopteryx_js' + SVG_SUFFIX;
    const NODE_LABEL_GAP_DEFAULT = 10;
    const NODE_SIZE_DEFAULT_DEFAULT = 3;
    const NODE_VISUALIZATIONS_OPACITY_DEFAULT = 1;
    const VISUALIZATIONS_LEGEND_ORIENTATION_DEFAULT = VERTICAL;
    const VISUALIZATIONS_LEGEND_XPOS_DEFAULT = 160;
    const VISUALIZATIONS_LEGEND_YPOS_DEFAULT = 30;

    // ---------------------------
    // Default values for settings
    // ---------------------------
    const COLLAPSE_LABEL_WIDTH_DEFAULT = '20px';
    const CONTROLS_0_LEFT_DEFAULT = 20;
    const CONTROLS_0_TOP_DEFAULT = 20;
    const CONTROLS_1_TOP_DEFAULT = 20;
    const CONTROLS_1_WIDTH_DEFAULT = 160;
    const CONTROLS_BACKGROUND_COLOR_DEFAULT = '#c0c0c0';
    const CONTROLS_FONT_COLOR_DEFAULT = '#505050';
    const CONTROLS_FONT_DEFAULTS = ['Arial', 'Helvetica', 'Times'];
    const CONTROLS_FONT_SIZE_DEFAULT = 8;
    const DISPLY_HEIGHT_DEFAULT = 600;
    const DISPLAY_WIDTH_DEFAULT = 800;
    const MOLSEQ_FONT_DEFAULTS = ['Courier', 'Courier New', 'Arial', 'Helvetica', 'Times'];

    const ROOTOFFSET_DEFAULT = 180;
    const SEARCH_FIELD_WIDTH_DEFAULT = '38px';
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
    const FONT_SIZE_MAX = 26;
    const FONT_SIZE_MIN = 2;
    const KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL = 'collapsed_spec_label';
    const LABEL_SIZE_CALC_ADDITION = 40;
    const LABEL_SIZE_CALC_FACTOR = 0.5;
    const LEGEND_LABEL_COLOR = 'legendLabelColor';
    const LEGEND_NODE_BORDER_COLOR = 'legendNodeBorderColor';
    const LEGEND_NODE_FILL_COLOR = 'legendNodeFillColor';
    const LEGEND_NODE_SHAPE = 'legendNodeShape';
    const LEGEND_NODE_SIZE = 'legendNodeSize';
    const LINEAR_SCALE = 'linear';
    const MAX_LENGTH_FOR_COLLAPSE_BY_FEATURE_LABEL = 10;
    const MOVE_INTERVAL = 150;
    const NH_EXPORT_FORMAT = 'Newick';
    const HEIGHT_OFFSET = 40;
    const NODE_SIZE_MAX = 9;
    const NODE_SIZE_MIN = 1;
    const NODE_TOOLTIP_BACKGROUND_COLOR = '#606060';
    const NODE_TOOLTIP_TEXT_ACTIVE_COLOR = COLOR_FOR_ACTIVE_ELEMENTS;
    const NODE_TOOLTIP_TEXT_COLOR = WHITE;
    const OFF_FEATURE = 'off';
    const ORDINAL_SCALE = 'ordinal';
    const PDF_EXPORT_FORMAT = 'PDF';
    const PHYLOXML_EXPORT_FORMAT = 'phyloXML';
    const PNG_EXPORT_FORMAT = 'PNG';
    const MSA_RESIDUE = 'MSA Residue';
    const RESET_SEARCH_A_BTN_TOOLTIP = 'reset (remove) search result A';
    const RESET_SEARCH_B_BTN_TOOLTIP = 'reset (remove) search result B';
    const SHORTEN_NAME_MAX_LENGTH = 18;
    const SLIDER_STEP = 0.5;
    const SPECIATION_COLOR = '#00ff00';
    const SPECIES_FEATURE = 'Species';
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
    const BL_COLLAPSE_LABEL = 'bl_col_label';
    const BRANCH_COLORS_CB = 'brnch_col_cb';
    const BRANCH_DATA_FONT_SIZE_SLIDER = 'bdfs_sl';
    const BRANCH_EVENTS_CB = 'brevts_cb';
    const BRANCH_LENGTH_VALUES_CB = 'bl_cb';
    const BRANCH_VIS_CB = 'branchvis_cb';
    const BRANCH_WIDTH_SLIDER = 'bw_sl';
    const CLADOGRAM_BUTTON = 'cla_b';
    const COLLAPSE_BY_FEATURE_SELECT = 'coll_by_feat_sel';
    const COLOR_PICKER = 'col_pick';
    const COLOR_PICKER_LABEL = 'colorPickerLabel';
    const CONFIDENCE_VALUES_CB = 'conf_cb';
    const CONTROLS_0 = 'controls0';
    const CONTROLS_1 = 'controls1';
    const DECR_BL_COLLAPSE_LEVEL = 'decr_blcl';
    const DECR_DEPTH_COLLAPSE_LEVEL = 'decr_dcl';
    const DEPTH_COLLAPSE_LABEL = 'depth_col_label';
    const DISPLAY_DATA_CONTROLGROUP = 'display_data_g';
    const DOWNLOAD_BUTTON = 'dl_b';
    const SUBMIT_SELECTED_NODES_BUTTON = 'submit_sel_nodes_b';
    const DYNAHIDE_CB = 'dynahide_cb';
    const EXPORT_FORMAT_SELECT = 'exp_f_sel';
    const EXTERNAL_FONT_SIZE_SLIDER = 'entfs_sl';
    const EXTERNAL_LABEL_CB = 'extl_cb';
    const EXTERNAL_NODES_CB = 'extn_cb';
    const INCR_BL_COLLAPSE_LEVEL = 'incr_blcl';
    const INCR_DEPTH_COLLAPSE_LEVEL = 'incr_dcl';
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
    const NODE_BORDER_COLOR_SELECT_MENU = 'nbcolors_menu';
    const NODE_DATA = 'node_data_dialog';
    const NODE_EVENTS_CB = 'nevts_cb';
    const NODE_FILL_COLOR_SELECT_MENU = 'nfcolors_menu';
    const NODE_NAME_CB = 'nn_cb';
    const HOSTS_CB = 'hosts_cb';
    const CUSTOM_DATA_1_CB = 'custom_data_1_cb';
    const CUSTOM_DATA_2_CB = 'custom_data_2_cb';
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
    const UNCOLLAPSE_ALL_BUTTON = 'unc_b';
    const ZOOM_IN_X = 'zoomin_x';
    const ZOOM_IN_Y = 'zoomout_y';
    const ZOOM_OUT_X = 'zoomout_x';
    const ZOOM_OUT_Y = 'zoomin_y';
    const ZOOM_TO_FIT = 'zoomtofit';

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
    const VK_A = 65;
    const VK_C = 67;
    const VK_L = 76;
    const VK_M = 77;
    const VK_O = 79;
    const VK_P = 80;
    const VK_R = 82;
    const VK_S = 83;
    const VK_U = 85;
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


    const col_category50 = [
        // 1 Red
        '#FF1744',
        // 2 Purple
        '#D500F9',
        // 3 Deep Purple
        '#651FFF',
        // 4 Indigo
        '#3D5AFE',
        // 5 Blue
        '#2979FF',
        // 6 Cyan
        '#00E5FF',
        // 7 Teal
        '#1DE9B6',
        // 8 Green
        '#00E676',
        // 9 Light Green
        '#76FF03',
        // 10 Lime
        '#C6FF00',
        // 11 Yellow
        '#FFEA00',
        // 12 Amber
        '#FFC400',
        // 13 Orange
        '#FF9100',
        // 13 Deep Orange
        '#FF3D00',
        // 15 Brown
        '#6D4C41',
        // 16 Grey
        '#757575',
        //
        // 17 Red
        '#B71C1C',
        // 18 Pink
        '#880E4F',
        // 19 Purple
        '#4A148C',
        // 20 Deep Purple
        '#311B92',
        // 21 Indigo
        '#1A237E',
        // 22 Blue
        '#0D47A1',
        // 23 Cyan
        '#006064',
        // 24 Teal
        '#004D40',
        // 25 Green
        '#1B5E20',
        // 26 Light Green
        '#33691E',
        // 27 Lime
        '#827717',
        // 28 Yellow
        '#F57F17',
        // 29 Amber
        '#FF6F00',
        // 30 Orange
        '#E65100',
        // 31 Deep Orange
        '#BF360C',
        // 32 Brown
        '#4E342E',
        // 33 Grey
        '#424242',
        //
        // 34 Red
        '#EF9A9A',
        // 35 Pink
        '#F48FB1',
        // 36 Purple
        '#CE93D8',
        // 37 Deep Purple
        '#B39DDB',
        // 38 Indigo
        '#9FA8DA',
        // 39 Blue
        '#90CAF9',
        // 40 Cyan
        '#80DEEA',
        // 41 Teal
        '#80CBC4',
        // 42 Green
        '#A5D6A7',
        // 43 Light Green
        '#C5E1A5',
        // 44 Lime
        '#E6EE9C',
        // 45 Amber
        '#FFE082',
        // 46 Orange
        '#FFCC80',
        // 47 Deep Orange
        '#FFAB91',
        // 48 Brown
        '#BCAAA4',
        // 49 Grey
        '#E0E0E0',
        // 50 Grey
        '#505050'
    ];


    const col_category50b = [
        "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059", "#7A4900", "#0000A6", "#63FFAC", "#B79762",
        "#004D43", "#8FB0FF", "#997D87", "#5A0007", "#809693", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
        "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#D16100", "#000035", "#7B4F4B", "#A1C299",
        "#300018", "#0AA6D8", "#013349", "#00846F", "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2",
        "#C2FF99", "#001E09", "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66"
    ];

    const col_category50c = [
        // Red
        '#FF5252', '#FF1744', '#D50000',
        // Pink
        '#FF4081', '#F50057', '#C51162',
        // Purple
        '#E040FB', '#D500F9', '#AA00FF',
        // Deep Purple
        '#7C4DFF', '#651FFF', '#6200EA',
        // Indigo
        '#536DFE', '#3D5AFE', '#304FFE',
        // Blue
        '#448AFF', '#2979FF', '#2962FF',
        // Cyan
        '#18FFFF', '#00E5FF', '#00B8D4',
        // Teal
        '#64FFDA', '#1DE9B6', '#00BFA5',
        // Green
        '#69F0AE', '#00E676', '#00C853',
        // Light Green
        '#B2FF59', '#76FF03', '#64DD17',
        // Lime
        '#EEFF41', '#C6FF00', '#AEEA00',
        // Yellow
        '#FFFF00', '#FFEA00', '#FFD600',
        // Amber
        '#FFD740', '#FFC400', '#FFAB00',
        // Orange
        '#FFAB40', '#FF9100', '#FF6D00',
        // Deep Orange
        '#FF6E40', '#FF3D00', '#DD2C00',
        // Brown
        '#5D4037', '#4E342E', '#3E2723',
        // Grey
        '#9E9E9E', '#616161'];

    const category50 = function () {
        return d3.scale.ordinal().domain([]).range(col_category50);
    };

    const category50b = function () {
        return d3.scale.ordinal().domain([]).range(col_category50b);
    };

    const category50c = function () {
        return d3.scale.ordinal().domain([]).range(col_category50c);
    };


    // ---------------------------
    // "Instance variables"
    // ---------------------------
    let _baseSvg = null;
    let _basicTreeProperties = null;
    let _branch_length_collapse_data = {};
    let _branch_length_collapse_level = -1;
    let _colorPickerData = null;
    let _colorsForColorPicker = null;
    let _currentLabelColorVisualization = null;
    let _currentNodeBorderColorVisualization = null;
    let _currentNodeFillColorVisualization = null;
    let _currentNodeShapeVisualization = null;
    let _currentNodeSizeVisualization = null;
    let _depth_collapse_level = -1;
    let _displayHeight = 0;
    let _displayWidth = 0;
    let _dynahide_counter = 0;
    let _dynahide_factor = 0;
    let _external_nodes = 0;
    let _foundNodes0 = new Set();
    let _foundNodes1 = new Set();
    let _selectedNodes = new Set();
    let _foundSum = 0;
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
    let _rank_collapse_level = -1;
    let _root = null;
    let _root_const = null;
    let _in_subtree = false;
    let _scale = null;
    let _searchBox0Empty = true;
    let _searchBox1Empty = true;
    let _settings = null;
    let _showColorPicker = false;
    let _showLegends = true;
    let _svgGroup = null;
    let _totalSearchedWithData = 0;
    let _translate = null;
    let _treeData = null;
    let _treeFn = null;
    let _usedColorCategories = new Set();
    let _visualizations = null;
    let _w = null;
    let _yScale = null;
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

        let yScale = d3.scale.linear()
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

    function zoom() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.shiftKey) {
            if (_scale === null) {
                _scale = _zoomListener.scale();
                _translate = _zoomListener.translate();
            }
        } else {
            if (_scale !== null && _translate !== null) {
                _zoomListener.scale(_scale);
                _zoomListener.translate(_translate);
                _svgGroup.attr('transform', 'translate(' + _translate + ')scale(' + _scale + ')');
                _scale = null;
                _translate = null;
            } else {
                _svgGroup.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            }
        }
    }

    function centerNode(source, x, y) {
        let scale = _zoomListener.scale();
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
        d3.select('g')
            .attr('transform', 'translate(' + x + ',' + y + ')scale(' + scale + ')');
        _zoomListener.scale(scale);
        _zoomListener.translate([x, y]);
    }

    function calcMaxTreeLengthForDisplay() {
        return _settings.rootOffset + _options.nodeLabelGap + LABEL_SIZE_CALC_ADDITION + (_maxLabelLength * _options.externalNodeFontSize * LABEL_SIZE_CALC_FACTOR);
    }

    function isCanDoMsaResidueVisualizations() {
        return ((_settings.enableNodeVisualizations === true)
            && (_settings.enableMsaResidueVisualizations === true) && (_basicTreeProperties.alignedMolSeqs === true)
            && (_basicTreeProperties.maxMolSeqLength && (_basicTreeProperties.maxMolSeqLength > 1)));
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
            .style('opacity', 1);
    }

    function mousemove(d) {
        let txt = '';
        if (d.name) {
            txt = d.name;
        }
        if (d.properties) {
            const l = d.properties.length;
            let mut = '';
            let first = true;
            for (let p = 0; p < l; ++p) {
                if (d.properties[p].ref === 'vipr:PANGO_Lineage'
                    && d.properties[p].datatype === 'xsd:string'
                    && d.properties[p].applies_to === 'node') {
                    txt = txt + ' [' + d.properties[p].value + ']';
                }
                if (d.properties[p].ref === 'vipr:Mutation'
                    && d.properties[p].datatype === 'xsd:string'
                    && d.properties[p].applies_to === 'node') {
                    if (first) {
                        mut = d.properties[p].value;
                        first = false;
                    } else {
                        mut = mut + ' ' + d.properties[p].value
                    }
                }
            }
            if (mut.length > 0) {
                txt = txt + ' {' + mut + '}'
            }
        }

        _node_mouseover_div
            .text(txt)
            .style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY) + 'px');
    }

    function mouseout() {
        _node_mouseover_div.transition()
            .duration(300)
            .style('opacity', 1e-6);
    }

    // ----------------------------

    function createVisualization(label,
                                 description,
                                 field,
                                 cladePropertyRef,
                                 isRegex,
                                 mapping,
                                 mappingFn, // mappingFn is a scale
                                 scaleType,
                                 altMappingFn) {
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
                        console.log(WARNING + ': Ordinal scale mapping for ' + label + ' (' + s + '): domain > range: ' +
                            mappingFn.domain().length + ' > ' + mappingFn.range().length);
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
                        if (nodeVisualization.shapes &&
                            Array.isArray(nodeVisualization.shapes) &&
                            (nodeVisualization.shapes.length > 0)) {

                            let shapeScale = null;
                            if (nodeVisualization.label === MSA_RESIDUE) {
                                shapeScale = d3.scale.ordinal()
                                    .range(nodeVisualization.shapes)
                                    .domain(_basicTreeProperties.molSeqResiduesPerPosition[0]);
                                scaleType = ORDINAL_SCALE;
                            } else if (nodeVisualization.cladeRef && nodeProperties[nodeVisualization.cladeRef] &&
                                forester.setToArray(nodeProperties[nodeVisualization.cladeRef]).length > 0) {
                                shapeScale = d3.scale.ordinal()
                                    .range(nodeVisualization.shapes)
                                    .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                scaleType = ORDINAL_SCALE;
                            } else if (nodeVisualization.field && nodeProperties[nodeVisualization.field] &&
                                forester.setToArray(nodeProperties[nodeVisualization.field]).length > 0) {
                                shapeScale = d3.scale.ordinal()
                                    .range(nodeVisualization.shapes)
                                    .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.field]));
                                scaleType = ORDINAL_SCALE;
                            }

                            if (shapeScale) {
                                addNodeShapeVisualization(nodeVisualization.label,
                                    nodeVisualization.description,
                                    nodeVisualization.field ? nodeVisualization.field : null,
                                    nodeVisualization.cladeRef ? nodeVisualization.cladeRef : null,
                                    nodeVisualization.regex,
                                    null,
                                    shapeScale,
                                    scaleType
                                );
                            }
                        }

                        if (nodeVisualization.colors) {
                            // TODO: Not dealing with nodeVisualization.field, yet.
                            if ((nodeVisualization.cladeRef && nodeProperties[nodeVisualization.cladeRef] && forester.setToArray(nodeProperties[nodeVisualization.cladeRef]).length > 0)
                                || (nodeVisualization.label === MSA_RESIDUE)) {
                                let colorScale = null;
                                let altColorScale = null;

                                if (Array.isArray(nodeVisualization.colors)) {
                                    scaleType = LINEAR_SCALE;
                                    if (nodeVisualization.colors.length === 3) {
                                        colorScale = d3.scale.linear()
                                            .range(nodeVisualization.colors)
                                            .domain(forester.calcMinMeanMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else if (nodeVisualization.colors.length === 2) {
                                        colorScale = d3.scale.linear()
                                            .range(nodeVisualization.colors)
                                            .domain(forester.calcMinMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else {
                                        throw 'Number of colors has to be either 2 or 3';
                                    }
                                }

                                if (Array.isArray(nodeVisualization.colorsAlt)) {
                                    if (nodeVisualization.colorsAlt.length === 3) {
                                        altColorScale = d3.scale.linear()
                                            .range(nodeVisualization.colorsAlt)
                                            .domain(forester.calcMinMeanMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else if (nodeVisualization.colorsAlt.length === 2) {
                                        altColorScale = d3.scale.linear()
                                            .range(nodeVisualization.colorsAlt)
                                            .domain(forester.calcMinMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                    } else {
                                        throw 'Number of colors has to be either 2 or 3';
                                    }
                                }

                                if (forester.isString(nodeVisualization.colors) && nodeVisualization.colors.length > 0) {
                                    scaleType = ORDINAL_SCALE;
                                    if (nodeVisualization.label === MSA_RESIDUE) {
                                        colorScale = d3.scale.category20()
                                            .domain(_basicTreeProperties.molSeqResiduesPerPosition[0]);
                                        _usedColorCategories.add('category20');
                                    } else {
                                        if (nodeVisualization.colors === 'category20') {
                                            colorScale = d3.scale.category20()
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category20');
                                        } else if (nodeVisualization.colors === 'category20b') {
                                            colorScale = d3.scale.category20b()
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category20b');
                                        } else if (nodeVisualization.colors === 'category20c') {
                                            colorScale = d3.scale.category20c()
                                                .domain(forester.setToSortedArray(nodeProperties[nodeVisualization.cladeRef]));
                                            _usedColorCategories.add('category20c');
                                        } else if (nodeVisualization.colors === 'category10') {
                                            colorScale = d3.scale.category10()
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
                                            throw 'do not know how to process ' + nodeVisualization.colors;
                                        }
                                    }
                                }

                                if (colorScale) {
                                    addLabelColorVisualization(nodeVisualization.label,
                                        nodeVisualization.description,
                                        null,
                                        nodeVisualization.cladeRef,
                                        nodeVisualization.regex,
                                        null,
                                        colorScale,
                                        scaleType,
                                        altColorScale);

                                    addNodeFillColorVisualization(nodeVisualization.label,
                                        nodeVisualization.description,
                                        null,
                                        nodeVisualization.cladeRef,
                                        nodeVisualization.regex,
                                        null,
                                        colorScale,
                                        scaleType,
                                        altColorScale);

                                    addNodeBorderColorVisualization(nodeVisualization.label,
                                        nodeVisualization.description,
                                        null,
                                        nodeVisualization.cladeRef,
                                        nodeVisualization.regex,
                                        null,
                                        colorScale,
                                        scaleType,
                                        altColorScale);
                                }
                            }
                        }

                        if (nodeVisualization.sizes && Array.isArray(nodeVisualization.sizes) && (nodeVisualization.sizes.length > 0)) {
                            if (nodeVisualization.cladeRef && nodeProperties[nodeVisualization.cladeRef] && forester.setToArray(nodeProperties[nodeVisualization.cladeRef]).length > 0) {
                                let sizeScale = null;
                                let scaleType = LINEAR_SCALE;
                                if (nodeVisualization.sizes.length === 3) {
                                    sizeScale = d3.scale.linear()
                                        .range(nodeVisualization.sizes)
                                        .domain(forester.calcMinMeanMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                } else if (nodeVisualization.sizes.length === 2) {
                                    sizeScale = d3.scale.linear()
                                        .range(nodeVisualization.sizes)
                                        .domain(forester.calcMinMaxInSet(nodeProperties[nodeVisualization.cladeRef]));
                                } else {
                                    throw 'Number of sizes has to be either 2 or 3';
                                }
                                if (sizeScale) {
                                    addNodeSizeVisualization(nodeVisualization.label,
                                        nodeVisualization.description,
                                        null,
                                        nodeVisualization.cladeRef,
                                        nodeVisualization.regex,
                                        null,
                                        sizeScale,
                                        scaleType);
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    function addNodeSizeVisualization(label,
                                      description,
                                      field,
                                      cladePropertyRef,
                                      isRegex,
                                      mapping,
                                      mappingFn,
                                      scaleType) {
        if (arguments.length !== 8) {
            throw('expected 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeSize) {
            _visualizations.nodeSize = {};
        }
        //  if (_visualizations.nodeSize[label]) { // removed because causes error on BVBRC
        //      throw('node size visualization for "' + label + '" already exists');
        //  }
        let vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn,
            scaleType);
        if (vis) {
            _visualizations.nodeSize[vis.label] = vis;
        }
    }

    function addNodeFillColorVisualization(label,
                                           description,
                                           field,
                                           cladePropertyRef,
                                           isRegex,
                                           mapping,
                                           mappingFn,
                                           scaleType,
                                           altMappingFn) {
        if (arguments.length < 8) {
            throw('expected at least 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeFillColor) {
            _visualizations.nodeFillColor = {};
        }
        //   if (_visualizations.nodeFillColor[label]) { // removed because causes error on BVBRC
        //      throw('node fill color visualization for "' + label + '" already exists');
        //   }
        let vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn,
            scaleType,
            altMappingFn);
        if (vis) {
            _visualizations.nodeFillColor[vis.label] = vis;
        }
    }


    function addNodeBorderColorVisualization(label,
                                             description,
                                             field,
                                             cladePropertyRef,
                                             isRegex,
                                             mapping,
                                             mappingFn,
                                             scaleType,
                                             altMappingFn) {
        if (arguments.length < 8) {
            throw('expected at least 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeBorderColor) {
            _visualizations.nodeBorderColor = {};
        }
        //if (_visualizations.nodeBorderColor[label]) { // removed because causes error on BVBRC
        //     throw('node border color visualization for "' + label + '" already exists');
        // }
        let vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn,
            scaleType,
            altMappingFn);
        if (vis) {
            _visualizations.nodeBorderColor[vis.label] = vis;
        }
    }

    function addNodeShapeVisualization(label,
                                       description,
                                       field,
                                       cladePropertyRef,
                                       isRegex,
                                       mapping,
                                       mappingFn,
                                       scaleType) {
        if (arguments.length !== 8) {
            throw('expected 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeShape) {
            _visualizations.nodeShape = {};
        }
        // if (_visualizations.nodeShape[label]) { // removed because causes error on BVBRC
        //     throw('node shape visualization for "' + label + '" already exists');
        //  }
        let vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn,
            scaleType);
        if (vis) {
            _visualizations.nodeShape[vis.label] = vis;
        }
    }

    function addLabelColorVisualization(label,
                                        description,
                                        field,
                                        cladePropertyRef,
                                        isRegex,
                                        mapping,
                                        mappingFn,
                                        scaleType,
                                        altMappingFn) {
        if (arguments.length < 8) {
            throw('expected at least 8 arguments, got ' + arguments.length);
        }
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.labelColor) {
            _visualizations.labelColor = {};
        }
        // if (_visualizations.labelColor[label]) { // removed because causes error on BVBRC
        //     throw('label color visualization for "' + label + '" already exists');
        // }
        let vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn,
            scaleType,
            altMappingFn);
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
            throw 'legend label is missing';
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
            .on('click', function (clickedName, clickedIndex) {
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
                    } else if (((linearRangeLength === 2 && i === 1) ||
                        (linearRangeLength === 3 && i === 2))) {
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
            throw 'legend label is missing';
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
            .attr('d', d3.svg.symbol()
                .size(function () {
                    return 20;
                })
                .type(function (d, i) {
                    return shapeScale(values[i]);
                }))
            .style('fill', 'none')
            .style('stroke', _options.branchColorDefault);


        legend.exit().remove();

        return counter;
    }


    function makeSizeLegend(id, xPos, yPos, sizeScale, scaleType, label, description) {
        if (!label) {
            throw 'legend label is missing';
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
                    } else if (((linearRangeLength === 2 && i === 1) ||
                        (linearRangeLength === 3 && i === 2))) {
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
            .attr('d', d3.svg.symbol()
                .size(function (d, i) {
                    let scale = _zoomListener.scale();
                    return scale * _options.nodeSizeDefault * sizeScale(values[i]);
                })
                .type(function () {
                    return 'circle';
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
            counter = makeColorLegend(LEGEND_LABEL_COLOR,
                xPos, yPos,
                _legendColorScales[LEGEND_LABEL_COLOR],
                scaleType,
                label, desc);
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

            counter = makeColorLegend(LEGEND_NODE_FILL_COLOR,
                xPos, yPos,
                _legendColorScales[LEGEND_NODE_FILL_COLOR],
                scaleType,
                label, desc);
            xPos += xPosIncr;
            yPos += ((counter * yPosIncr) + yPosIncrConst);
        } else {
            removeColorLegend(LEGEND_NODE_FILL_COLOR);
        }

        if (_showLegends && _options.showNodeVisualizations && _legendColorScales[LEGEND_NODE_BORDER_COLOR] && _visualizations.nodeBorderColor[_currentNodeBorderColorVisualization]) {
            removeColorLegend(LEGEND_NODE_BORDER_COLOR);
            label = 'Node Border';
            desc = _currentNodeBorderColorVisualization;
            scaleType = _visualizations.nodeBorderColor[_currentNodeBorderColorVisualization].scaleType;

            counter = makeColorLegend(LEGEND_NODE_BORDER_COLOR,
                xPos, yPos,
                _legendColorScales[LEGEND_NODE_BORDER_COLOR],
                scaleType,
                label, desc);
            xPos += xPosIncr;
            yPos += ((counter * yPosIncr) + yPosIncrConst);
        } else {
            removeColorLegend(LEGEND_NODE_BORDER_COLOR);
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
            colorScale = d3.scale.category20()
                .domain(twenty);
        } else if (name === 'category20b') {
            l = 20;
            colorScale = d3.scale.category20b()
                .domain(twenty);
        } else if (name === 'category20c') {
            l = 20;
            colorScale = d3.scale.category20c()
                .domain(twenty);
        } else if (name === 'category10') {
            l = 10;
            colorScale = d3.scale.category10()
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
            throw 'do not know ' + name;
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
        const DEFAULT_COLORS_FOR_COLORPICKER = [
            // Red
            '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C', '#FF8A80', '#FF5252', '#FF1744', '#D50000',
            // Pink
            '#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F', '#FF80AB', '#FF4081', '#F50057', '#C51162',
            // Purple
            '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C', '#EA80FC', '#E040FB', '#D500F9', '#AA00FF',
            // Deep Purple
            '#EDE7F6', '#D1C4E9', '#B39DDB', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92', '#B388FF', '#7C4DFF', '#651FFF', '#6200EA',
            // Indigo
            '#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E', '#8C9EFF', '#536DFE', '#3D5AFE', '#304FFE',
            // Blue
            '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1', '#82B1FF', '#448AFF', '#2979FF', '#2962FF',
            // Light Blue
            '#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B', '#80D8FF', '#40C4FF', '#00B0FF', '#0091EA',
            // Cyan
            '#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064', '#84FFFF', '#18FFFF', '#00E5FF', '#00B8D4',
            // Teal
            '#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40', '#A7FFEB', '#64FFDA', '#1DE9B6', '#00BFA5',
            // Green
            '#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20', '#B9F6CA', '#69F0AE', '#00E676', '#00C853',
            // Light Green
            '#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#558B2F', '#33691E', '#CCFF90', '#B2FF59', '#76FF03', '#64DD17',
            // Lime
            '#F9FBE7', '#F0F4C3', '#E6EE9C', '#DCE775', '#D4E157', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717', '#F4FF81', '#EEFF41', '#C6FF00', '#AEEA00',
            // Yellow
            '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17', '#FFFF8D', '#FFFF00', '#FFEA00', '#FFD600',
            // Amber
            '#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00', '#FFE57F', '#FFD740', '#FFC400', '#FFAB00',
            // Orange
            '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100', '#FFD180', '#FFAB40', '#FF9100', '#FF6D00',
            // Deep Orange
            '#FBE9E7', '#FFCCBC', '#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#D84315', '#BF360C', '#FF9E80', '#FF6E40', '#FF3D00', '#DD2C00',
            // Brown
            '#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723',
            // Grey
            '#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121',
            // Blue Grey
            '#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238',
            // Basic
            '#FFFFFF', '#999999', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF', _options.backgroundColorDefault
        ];
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

        let colorPickerColors = d3.scale.linear()
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
            .on('click', function (d) {
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
            .style('stroke',
                function (d, i) {
                    if (i === clickedOrigColorIndex) {
                        return COLOR_PICKER_CLICKED_ORIG_COLOR_BORDER_COLOR;
                    } else if (i === 263) {
                        return COLOR_PICKER_BACKGROUND_BORDER_COLOR;
                    }
                    return WHITE;
                }
            );

        colorPickerUpdate.select('text.' + COLOR_PICKER_LABEL)
            .attr('x', xCorrectionForLabel)
            .attr('y', yFactorForDesc * rectSize)
            .text(function (d, i) {
                if (i === 0) {
                    return 'Choose ' + _colorPickerData.legendLabel.toLowerCase() +
                        ' for ' + _colorPickerData.legendDescription.toLowerCase() + ' "' +
                        _colorPickerData.clickedName + '":';
                }
            });

        colorPicker.exit().remove();

        function colorToHex(color) {
            // From http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
            // Convert any CSS color to a hex representation
            let rgba, hex;
            rgba = colorToRGBA(color);
            hex = [0, 1, 2].map(
                function (idx) {
                    return byteToHex(rgba[idx]);
                }
            ).join('');
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

        _external_nodes = forester.calcSumOfAllExternalDescendants(_root);
        let uncollsed_nodes = forester.calcSumOfExternalDescendants(_root);
        let nodes = _treeFn.nodes(_root).reverse();
        let links = _treeFn.links(nodes);
        let gap = _options.nodeLabelGap;

        if (_options.phylogram === true) {
            _yScale = branchLengthScaling(forester.getAllExternalNodes(_root), _w);
        }

        if (_options.dynahide) {
            _dynahide_counter = 0;
            _dynahide_factor = Math.round(_options.externalNodeFontSize / ((0.8 * _displayHeight) / uncollsed_nodes));
            forester.preOrderTraversal(_root, function (n) {
                if (!n.children && _dynahide_factor >= 2 && (++_dynahide_counter % _dynahide_factor !== 0)) {
                    n.hide = true;
                } else {
                    n.hide = false;
                }
            });
        }

        updateDepthCollapseDepthDisplay();
        updateBranchLengthCollapseBranchLengthDisplay();
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
            .on("mousemove", function (d) {
                mousemove(d);
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
                return d.children || d._children ? "end" : "start";
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

        nodeEnter.append('text')
            .attr('class', 'collapsedText')
            .attr('dy', function () {
                return 0.3 * _options.externalNodeFontSize + 'px';
            })
            .style('font-family', _options.defaultFont);

        node.select("text.extlabel")
            .style('font-size', function (d) {
                return d.children || d._children ? _options.internalNodeFontSize + 'px' : _options.externalNodeFontSize + 'px';
            })
            .style('fill', makeLabelColor)
            .attr('dy', function (d) {
                return d.children || d._children ? 0.3 * _options.internalNodeFontSize + 'px' : 0.3 * _options.externalNodeFontSize + 'px';
            })
            .attr('x', function (d) {
                if (!(d.children || d._children)) {
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
            .attr('dy', '-.25em')
            .attr('x', function (d) {
                if (d.parent) {
                    return (d.parent.y - d.y + 1);
                } else {
                    return 0;
                }
            });

        node.select('text.conflabel')
            .style('font-size', _options.branchDataFontSize + 'px')
            .attr('dy', _options.branchDataFontSize)
            .attr('x', function (d) {
                if (d.parent) {
                    return (0.5 * (d.parent.y - d.y));
                } else {
                    return 0;
                }
            });

        node.select('text.brancheventlabel')
            .style('font-size', _options.branchDataFontSize + 'px')
            .attr('dy', '-.25em')
            .attr('x', function (d) {
                if (d.parent) {
                    return (0.5 * (d.parent.y - d.y));
                }
            });

        node.select('circle.nodeCircle')
            .attr('r', function (d) {
                if (((_options.showNodeVisualizations && !_options.showNodeEvents) &&
                    (makeNodeFillColor(d) === _options.backgroundColorDefault))) {
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


        let start = _options.phylogram ? (-1) : (-10);
        let ylength = _displayHeight / (3 * uncollsed_nodes);

        let nodeUpdate = node.transition()
            .duration(transitionDuration)
            .attr('transform', function (d) {
                return 'translate(' + d.y + ',' + d.x + ')';
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
            if (d._children) {
                let yl = ylength;
                let descs = forester.getAllExternalNodes(d);
                if (descs.length < 5) {
                    yl = 0.5 * yl;
                }
                let avg = forester.calcAverageTreeHeight(d, descs);

                let xlength = _options.phylogram ? _yScale(avg) : 0;
                d.avg = xlength;
                let l = d.width ? (d.width / 2) : _options.branchWidthDefault / 2;
                let collapsedColor = makeCollapsedColor(d);
                d3.select(this).select('path').transition().duration(transitionDuration)
                    .attr('d', function () {
                        return 'M' + start + ',' + (-l) + 'L' + xlength + ',' + (-yl) + 'L' + xlength + ',' + (yl) + 'L' + start + ',' + l + 'L' + start + ',' + (-l);
                    })
                    .style('stroke', collapsedColor)
                    .style('fill', collapsedColor);

                d3.select(this).select('.collapsedText').attr('font-size', function () {
                    return _options.externalNodeFontSize + 'px';
                });

                d3.select(this).select('.collapsedText').transition().duration(transitionDuration)
                    .style('fill-opacity', 1)
                    .text(makeCollapsedLabel(d, descs))
                    .style('fill', function (d) {
                        return makeLabelColorForCollapsed(d, collapsedColor);
                    })
                    .attr('dy', function () {
                        return 0.3 * _options.externalNodeFontSize + 'px';
                    })
                    .attr('x', function (d) {
                        if (_options.phylogram && _options.alignPhylogram) {
                            let w = d;
                            while (w.children && w.children.length > 0) {
                                w = w.children[0];
                            }
                            return (-_yScale(w.distToRoot) + _w + gap);
                        } else {
                            return xlength + gap;
                        }
                    });

            }
            if (d.children) {
                if (!_options.showNodeVisualizations && makeNodeVisShape(d) === null) {
                    d3.select(this).select('path').transition().duration(transitionDuration)
                        .attr('d', function () {
                            return 'M0,0';
                        });
                }
                d3.select(this).select('.collapsedText').transition().duration(transitionDuration)
                    .attr('x', 0)
                    .style('fill-opacity', 1e-6)
                    .each('end', function () {
                        d3.select(this).text('');
                    });
            }
        });

        let nodeExit = node.exit().transition()
            .duration(transitionDuration)
            .attr('transform', function () {
                return "translate(" + source.y + "," + source.x + ")";
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

        link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke-width', makeBranchWidth)
            .attr('stroke', makeBranchColor)
            .attr('d', function () {
                let o = {
                    x: source.x0,
                    y: source.y0
                };
                return elbow({
                    source: o,
                    target: o
                });
            });

        link.transition()
            .duration(transitionDuration)
            .attr('stroke', makeBranchColor)
            .attr('d', elbow);

        link.exit()
            .attr('d', function () {
                let o = {
                    x: source.x,
                    y: source.y
                };
                return elbow({
                    source: o,
                    target: o
                });
            })
            .remove();


        if (_options.phylogram && _options.alignPhylogram && _options.showExternalLabels
            && (_options.showNodeName || _options.showTaxonomy || _options.showSequence
                || _options.showLineage || _options.showMutations || _options.showHosts)) {
            let linkExtension = _svgGroup.append("g")
                .selectAll('path')
                .data(links.filter(function (d) {
                    return (!d.target.children
                        && !(_options.dynahide && d.target.hide)
                    );
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

        for (let i = 0, len = nodes.length; i !== len; ++i) {
            let d = nodes[i];
            d.x0 = d.x;
            d.y0 = d.y;
        }
    }

    let makeNodeSize = function (node) {

        if ((_options.showNodeEvents && node.events && node.children
                && (node.events.duplications
                    || node.events.speciations))
            || isNodeFound(node)
            || isNodeSelected(node)) {
            return _options.nodeSizeDefault;
        }

        return (
            (_options.nodeSizeDefault > 0 && node.parent && !(_options.showNodeVisualizations && node.hasVis))
            && ((node.children && _options.showInternalNodes)
                || ((!node._children && !node.children) && _options.showExternalNodes)
            )
            || (_options.phylogram && node.parent && !node.parent.parent && (!node.branch_length || node.branch_length <= 0))

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
            if (
                (_currentLabelColorVisualization === MSA_RESIDUE
                    || _currentNodeBorderColorVisualization === MSA_RESIDUE
                    || _currentNodeFillColorVisualization === MSA_RESIDUE
                ) && isCanDoMsaResidueVisualizations()) {

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
                    if (n.properties[p].ref === _visualizations4_applies_to_ref
                        && n.properties[p].datatype === _visualizations4_property_datatype
                        && n.properties[p].applies_to === _visualizations4_property_applies_to) {
                        if (_currentNodeFillColorVisualization === n.properties[p].value
                            || _currentLabelColorVisualization === n.properties[p].value
                            || _currentNodeBorderColorVisualization === n.properties[p].value
                        ) {
                            return _visualizations4_color;
                        }
                    } else if (n.properties[p].ref === _visualizations3_applies_to_ref
                        && n.properties[p].datatype === _visualizations3_property_datatype
                        && n.properties[p].applies_to === _visualizations3_property_applies_to) {
                        if (_currentNodeFillColorVisualization === n.properties[p].value
                            || _currentLabelColorVisualization === n.properties[p].value
                            || _currentNodeBorderColorVisualization === n.properties[p].value
                        ) {
                            return _visualizations3_color;
                        }
                    } else if (n.properties[p].ref === _visualizations2_applies_to_ref
                        && n.properties[p].datatype === _visualizations2_property_datatype
                        && n.properties[p].applies_to === _visualizations2_property_applies_to) {
                        if (_currentNodeFillColorVisualization === n.properties[p].value
                            || _currentLabelColorVisualization === n.properties[p].value
                            || _currentNodeBorderColorVisualization === n.properties[p].value
                        ) {
                            return _visualizations2_color;
                        }
                    } else if (n.properties[p].ref === 'vipr:PANGO_Lineage'
                        && n.properties[p].datatype === 'xsd:string'
                        && n.properties[p].applies_to === 'node') {
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
                    } else if (n.properties[p].ref === 'vipr:PANGO_Lineage_L0'
                        && n.properties[p].datatype === 'xsd:string'
                        && n.properties[p].applies_to === 'node') {
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
                    } else if (n.properties[p].ref === 'vipr:PANGO_Lineage_L1'
                        && n.properties[p].datatype === 'xsd:string'
                        && n.properties[p].applies_to === 'node') {
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
        if (_options.showNodeEvents && phynode.events && phynode.children
            && (phynode.events.speciations || phynode.events.duplications)) {
            let evColor = makeNodeEventsDependentColor(phynode.events);
            if (evColor !== null) {
                return evColor;
            } else {
                return _options.backgroundColorDefault;
            }
        }
        return makeVisNodeFillColor(phynode);
    };

    let makeNodeStrokeColor = function (phynode) {
        let foundColor = getFoundColor(phynode);
        if (foundColor) {
            return foundColor;
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

    let makeCollapsedColor = function (node) {
        let c = calcCollapsedColorInSubtree(node);
        if (c) {
            return c;
        }
        c = makeLabelColorForCollapsed(node);
        if (c) {
            return c;
        }
        if (_options.showBranchColors && node.color) {
            return "rgb(" + node.color.red + "," + node.color.green + "," + node.color.blue + ")";
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

    let makeLabelColorForCollapsed = function (phynode, color) {
        if (color && color !== _options.branchColorDefault) {
            return color
        }
        if (_currentLabelColorVisualization) {
            let ncolor = makeVisLabelColorForSubtree(phynode);
            if (ncolor) {
                return ncolor;
            }
        }
        if (_options.showBranchColors && phynode.color) {
            let c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _options.labelColorDefault;
    };

    let makeNodeVisShape = function (node) {
        if (_currentNodeShapeVisualization && _visualizations && !node._children && _visualizations.nodeShape
            && _visualizations.nodeShape[_currentNodeShapeVisualization] && !isNodeFound(node) && !isNodeSelected(node)
            && !(_options.showNodeEvents && (node.events && (node.events.duplications
                || node.events.speciations)))) {
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
            return d3.svg.symbol().type(shape).size(makeVisNodeSize(node))();
        }
    };

    let makeVisNodeFillColor = function (node) {

        if (_options.showNodeVisualizations && !node._children && _currentNodeFillColorVisualization
            && _visualizations && _visualizations.nodeFillColor) {

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
                    if (node.properties[p].ref === _visualizations4_applies_to_ref
                        && node.properties[p].datatype === _visualizations4_property_datatype
                        && node.properties[p].applies_to === _visualizations4_property_applies_to) {
                        if (_currentNodeFillColorVisualization === node.properties[p].value) {
                            return _visualizations4_color;
                        }
                    } else if (node.properties[p].ref === _visualizations3_applies_to_ref
                        && node.properties[p].datatype === _visualizations3_property_datatype
                        && node.properties[p].applies_to === _visualizations3_property_applies_to) {
                        if (_currentNodeFillColorVisualization === node.properties[p].value) {
                            return _visualizations3_color;
                        }
                    } else if (node.properties[p].ref === _visualizations2_applies_to_ref
                        && node.properties[p].datatype === _visualizations2_property_datatype
                        && node.properties[p].applies_to === _visualizations2_property_applies_to) {
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
        if (!node._children && _currentLabelColorVisualization) {
            if (_visualizations && _visualizations.labelColor
                && _visualizations.labelColor[_currentLabelColorVisualization]) {
                let vis = _visualizations.labelColor[_currentLabelColorVisualization];
                let color = makeVisColor(node, vis);

                if (color) {
                    return color;
                }
            } else if (node.properties != null) {
                const l = node.properties.length;
                for (let p = 0; p < l; ++p) {
                    if (node.properties[p].ref === _visualizations4_applies_to_ref
                        && node.properties[p].datatype === _visualizations4_property_datatype
                        && node.properties[p].applies_to === _visualizations4_property_applies_to) {
                        if (_currentLabelColorVisualization === node.properties[p].value) {
                            return _visualizations4_color;
                        }
                    } else if (node.properties[p].ref === _visualizations3_applies_to_ref
                        && node.properties[p].datatype === _visualizations3_property_datatype
                        && node.properties[p].applies_to === _visualizations3_property_applies_to) {
                        if (_currentLabelColorVisualization === node.properties[p].value) {
                            return _visualizations3_color;
                        }
                    } else if (node.properties[p].ref === _visualizations2_applies_to_ref
                        && node.properties[p].datatype === _visualizations2_property_datatype
                        && node.properties[p].applies_to === _visualizations2_property_applies_to) {
                        if (_currentLabelColorVisualization === node.properties[p].value) {
                            return _visualizations2_color;
                        }
                    }
                }
            }
        }
        return _options.labelColorDefault;
    };

    let makeVisLabelColorForSubtree = function (node) {
        let color = null;
        let success = true;
        if (_currentLabelColorVisualization && _visualizations && _visualizations.labelColor
            && _visualizations.labelColor[_currentLabelColorVisualization]) {
            let vis = _visualizations.labelColor[_currentLabelColorVisualization];
            forester.preOrderTraversalAll(node, function (n) {
                if (forester.isHasNodeData(n)) {
                    let c = makeVisColor(n, vis);
                    if (!c) {
                        success = false;
                    } else if (color == null) {
                        color = c;
                    } else if (color !== c) {
                        success = false;
                    }
                }
            });
        }
        if (success === false) {
            return null;
        }
        return color;
    };


    let makeVisNodeSize = function (node, correctionFactor) {
        if (_options.showNodeVisualizations && _currentNodeSizeVisualization) {
            if (_visualizations && !node._children && _visualizations.nodeSize
                && _visualizations.nodeSize[_currentNodeSizeVisualization]) {
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

    function calcCollapsedColorInSubtree(node) {
        let found0 = 0;
        let found1 = 0;
        let found0and1 = 0;
        let total = 0;
        if (_foundNodes0 && _foundNodes1) {
            forester.preOrderTraversalAll(node, function (n) {
                if (forester.isHasNodeData(n)) {
                    ++total;
                    if (_foundNodes0.has(n) && _foundNodes1.has(n)) {
                        ++found0and1;
                    } else if (_foundNodes0.has(n)) {
                        ++found0;
                    } else if (_foundNodes1.has(n)) {
                        ++found1;
                    }
                }
            });
        }
        _foundSum = found0and1 + found0 + found1;
        _totalSearchedWithData = total;

        if (total > 0 && _foundSum > 0) {
            if ((found0and1 > 0) || ((found0 > 0) && (found1 > 0))) {
                if (found0and1 === total) {
                    return _options.found0and1ColorDefault;
                }
                return d3.scale.linear()
                    .domain([0, total])
                    .range([_options.branchColorDefault, _options.found0and1ColorDefault])(_foundSum);
            } else if (found0 > 0) {
                if (found0 === total) {
                    return _options.found0ColorDefault;
                }
                return d3.scale.linear()
                    .domain([0, total])
                    .range([_options.branchColorDefault, _options.found0ColorDefault])(found0);
            } else if (found1 > 0) {
                if (found1 === total) {
                    return _options.found1ColorDefault;
                }
                return d3.scale.linear()
                    .domain([0, total])
                    .range([_options.branchColorDefault, _options.found1ColorDefault])(found1);
            }
        }
        return null;
    }


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
        if (!_options.showExternalLabels && !(phynode.children || phynode._children)) {
            return null;
        }
        if (!_options.showInternalLabels && (phynode.children || phynode._children)) {
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
        // if (_options.showHosts) {
        //     if (phynode.properties) {
        //         const props_length = phynode.properties.length;
        //         if (props_length > 0) {
        //             let hosts_text = '';
        //             for (let pl = 0; pl < props_length; ++pl) {
        //                 if (phynode.properties[pl].ref === 'vipr:Hosts'
        //                     && phynode.properties[pl].datatype === 'xsd:string'
        //                     && phynode.properties[pl].applies_to === 'node') {
        //                     if (hosts_text.length > 0) {
        //                         hosts_text += ', '
        //                     }
        //                     hosts_text += phynode.properties[pl].value;
        //                 }
        //             }
        //             l = append(l, hosts_text)
        //         }
        //     }
        //
        // }
        // if (_options.showLineage) {
        //     if (phynode.properties) {
        //         const props_length = phynode.properties.length;
        //         if (props_length > 0) {
        //             let lin_text = '';
        //             for (let pl = 0; pl < props_length; ++pl) {
        //                 if (phynode.properties[pl].ref === 'vipr:PANGO_Lineage'
        //                     && phynode.properties[pl].datatype === 'xsd:string'
        //                     && phynode.properties[pl].applies_to === 'node') {
        //                     if (lin_text.length > 0) {
        //                         lin_text += ', '
        //                     }
        //                     lin_text += phynode.properties[pl].value;
        //                 }
        //             }
        //             l = append(l, lin_text)
        //         }
        //     }
        //
        // }
        // if (_options.showMutations) {
        //     if (phynode.properties && phynode.properties != null) {
        //         const props_length = phynode.properties.length;
        //         if (props_length > 0) {
        //             let mut_text = '';
        //             for (let pm = 0; pm < props_length; ++pm) {
        //                 if (phynode.properties[pm].ref === 'vipr:Mutation'
        //                     && phynode.properties[pm].datatype === 'xsd:string'
        //                     && phynode.properties[pm].applies_to === 'node') {
        //                     if (mut_text.length > 0) {
        //                         mut_text += ', '
        //                     }
        //                     mut_text += phynode.properties[pm].value;
        //                 }
        //             }
        //             l = append(l, mut_text)
        //         }
        //     }
        // }
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


        //~~~~~
        if (_nodeLabels && phynode.properties && phynode.properties != null) {
            const props_length = phynode.properties.length;
            if (props_length > 0) {
                for (const [key, value] of Object.entries(_nodeLabels)) {
                    if (value.selected === true && value.propertyRef) {
                        let prop_text = '';
                        for (let pm = 0; pm < props_length; ++pm) {
                            if (phynode.properties[pm].ref === value.propertyRef
                                && phynode.properties[pm].datatype === 'xsd:string'
                                && phynode.properties[pm].applies_to === 'node') {
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
        ///////////////////////////////////////

        if (_options.showDistributions && phynode.distributions && phynode.distributions.length > 0) {
            let d = phynode.distributions;
            for (let ii = 0; i < d.length; ++ii) {
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


    let makeCollapsedLabel = function (node, descs) {
        if (node.hide) {
            return;
        }

        let first;
        let last;
        if (descs.length > 1) {
            first = descs[0];
            last = descs[descs.length - 1];
        }
        let text = null;
        if (first && last) {
            let first_label = makeNodeLabel(first);
            let last_label = makeNodeLabel(last);

            if (first_label && last_label) {
                text = first_label.substring(0, _options.collapsedLabelLength)
                    + " ... " + last_label.substring(0, _options.collapsedLabelLength)
                    + " [" + descs.length + "]";
                if (_foundSum > 0 && _totalSearchedWithData) {
                    text += (' [' + _foundSum + '/' + _totalSearchedWithData + ']');
                }
            }

            if (node[KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL]) {
                if (text) {
                    text = node[KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL] + ': ' + text;
                } else {
                    text = node[KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL];
                }
            }
        }
        return text;
    };

    let makeBranchLengthLabel = function (phynode) {
        if (phynode.branch_length) {
            if (_options.phylogram
                && _options.minBranchLengthValueToShow
                && phynode.branch_length < _options.minBranchLengthValueToShow) {
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
                if (phynode.properties[p].ref === BRANCH_EVENT_REF
                    && phynode.properties[p].datatype === BRANCH_EVENT_DATATYPE
                    && phynode.properties[p].applies_to === BRANCH_EVENT_APPLIES_TO) {
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

    let elbow = function (d) {
        return 'M' + d.source.y + ',' + d.source.x
            + 'V' + d.target.x + 'H' + d.target.y;
    };

    let connection = function (n) {
        if (_options.phylogram) {
            let x1 = n.y + 5;
            if (n._children) {
                x1 += n.avg;
            }
            let y = n.x;
            let x = (n.y - _yScale(n.distToRoot) + _w);
            if ((x - x1) > 5) {
                return 'M' + x1 + ',' + y
                    + 'L' + x + ',' + y;
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
        if (_options.showLineage === undefined) {
            _options.showLineage = false;
        }
        if (_options.showMutations === undefined) {
            _options.showMutations = false;
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
        if (!_options.collapsedLabelLength) {
            _options.collapsedLabelLength = COLLAPSED_LABEL_LENGTH_DEFAULT;
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
        if (_options.showHosts === undefined) {
            _options.showHosts = false;
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

        if (!_options.initialCollapseFeature) {
            _options.initialCollapseFeature = null;
        }

        if (!_options.initialCollapseDepth) {
            _options.initialCollapseDepth = -1;
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
        if (_settings.enableCollapseByBranchLenghts === undefined) {
            _settings.enableCollapseByBranchLenghts = false;
        }
        if (_settings.enableCollapseByTaxonomyRank === undefined) {
            _settings.enableCollapseByTaxonomyRank = false;
        }
        if (_settings.enableCollapseByFeature === undefined) {
            _settings.enableCollapseByFeature = false;
        }
        if (_settings.nhExportWriteConfidences === undefined) {
            _settings.nhExportWriteConfidences = false;
        }
        if (_settings.searchFieldWidth === undefined) {
            _settings.searchFieldWidth = SEARCH_FIELD_WIDTH_DEFAULT;
        }
        if (_settings.textFieldHeight === undefined) {
            _settings.textFieldHeight = TEXT_INPUT_FIELD_DEFAULT_HEIGHT;
        }
        if (_settings.collapseLabelWidth === undefined) {
            _settings.collapseLabelWidth = COLLAPSE_LABEL_WIDTH_DEFAULT;
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
        if (_settings.showLineageButton === undefined) {
            _settings.showLineageButton = false;
        }
        if (_settings.showMutationsButton === undefined) {
            _settings.showMutationsButton = false;
        }
        if (_settings.showDynahideButton === undefined) {
            if (_basicTreeProperties.externalNodesCount > 20) {
                _settings.showDynahideButton = true;
            } else {
                _settings.showDynahideButton = false;
            }
        }
        if (_settings.showShortenNodeNamesButton === undefined) {
            if (_basicTreeProperties.longestNodeName > SHORTEN_NAME_MAX_LENGTH) {
                _settings.showShortenNodeNamesButton = true;
            } else {
                _settings.showShortenNodeNamesButton = false;
            }
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
        if (_settings.enableMsaResidueVisualizations === true
            && _basicTreeProperties.alignedMolSeqs === true
            && _basicTreeProperties.maxMolSeqLength > 1) {
            _settings.enableMsaResidueVisualizations = true;
        } else {
            _settings.enableMsaResidueVisualizations === false;
        }
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
            _settings.showSearchPropertiesButton = false;
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
            _settings.controls1Left = _displayWidth - _settings.controls1Width;
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

    function mouseDown() {
        if (d3.event.which === 1 && (d3.event.altKey || d3.event.shiftKey)) {
            if ((_showLegends && (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) && (_legendColorScales[LEGEND_LABEL_COLOR] ||
                (_options.showNodeVisualizations && (_legendColorScales[LEGEND_NODE_FILL_COLOR] ||
                    _legendColorScales[LEGEND_NODE_BORDER_COLOR] ||
                    _legendShapeScales[LEGEND_NODE_SHAPE] ||
                    _legendSizeScales[LEGEND_NODE_SIZE]))))) {
                moveLegendWithMouse(d3.event);
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


    function groupYears(phy, sourceRef, targetRef, yearsToIgnore, yearsPerGroup) {

        let minYear = 10000000;
        let maxYear = -10000000;
        forester.preOrderTraversalAll(phy, function (n) {
            if (n.properties && n.properties.length > 0) {
                let propertiesLength = n.properties.length;
                for (let i = 0; i < propertiesLength; ++i) {
                    let property = n.properties[i];
                    if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === 'node') {
                        if (property.ref === sourceRef) {
                            let year = property.value;
                            if (yearsToIgnore.indexOf(year) < 0) {
                                if (year > maxYear) {
                                    maxYear = year;
                                }
                                if (year < minYear) {
                                    minYear = year;
                                }
                            }
                        }
                    }
                }
            }
        });

        let MAX_COLORS = 20;

        let d;
        if ((maxYear - minYear) < (yearsPerGroup * MAX_COLORS)) {
            d = yearsPerGroup;
        } else {
            d = parseInt((maxYear - minYear) / MAX_COLORS);
        }

        console.log(MESSAGE + ' year group range:' + d);

        forester.preOrderTraversalAll(phy, function (n) {

            if (n.properties && n.properties.length > 0) {
                let propertiesLength = n.properties.length;
                for (let i = 0; i < propertiesLength; ++i) {
                    let property = n.properties[i];
                    if (property.ref && property.value && property.datatype && property.applies_to && property.applies_to === 'node') {
                        if (property.ref === sourceRef) {
                            const year = property.value;
                            if (yearsToIgnore.indexOf(year) < 0) {
                                let x = parseInt((year - minYear) / d);
                                minYear = parseInt(minYear);
                                let newProp = {};
                                newProp.ref = targetRef;
                                let lb = minYear + (x * d);
                                let hb = minYear + ((x + 1) * d) - 1;
                                newProp.value = lb + "-" + hb;
                                if ((year < lb) || (year > hb)) {
                                    alert(ERROR + year + ' not in ' + newProp.value);
                                }
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


    archaeopteryx.launch = function (id,
                                     phylo,
                                     options,
                                     settings,
                                     nodeVisualizations,
                                     nodeLabels,
                                     specialVisualizations) {


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
        _zoomListener = d3.behavior.zoom().scaleExtent([0.1, 10]).on('zoom', zoom);
        _basicTreeProperties = forester.collectBasicTreeProperties(_treeData);

        if (settings.groupSpecies) {
            if (settings.groupSpecies.source && settings.groupSpecies.target) {
                console.log(MESSAGE + ' Grouping species from \"' + settings.groupSpecies.source
                    + '\" to \"' + settings.groupSpecies.target);
                forester.shortenProperties(_treeData, 'node', true, settings.groupSpecies.source, settings.groupSpecies.target);
            }
        }

        if (settings.groupYears) {
            if (settings.groupYears.source && settings.groupYears.target && settings.groupYears.ignore && settings.groupYears.groupsize) {
                console.log(MESSAGE + ' Grouping years from \"' + settings.groupYears.source
                    + '\" to \"' + settings.groupYears.target + '\", ignoring ' + settings.groupYears.ignore +
                    ', range ' + settings.groupYears.groupsize);
                groupYears(_treeData, settings.groupYears.source,
                    settings.groupYears.target,
                    settings.groupYears.ignore,
                    settings.groupYears.groupsize);
            }
        }

        if (settings.filterValues) {
            settings.filterValues.forEach(function (e) {
                if (e
                    && e.source
                    && e.target
                    && e.pass
                    && e.pass.length > 0) {
                    console.log(MESSAGE + ' Filtering values from \"' + e.source
                        + '\" to \"' + e.target +
                        ', allowed values ' + e.pass);
                    filterValues(_treeData,
                        e.source,
                        e.target,
                        e.pass);
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

        if (settings.readSimpleCharacteristics) {
            forester.moveSimpleCharacteristicsToProperties(_treeData);
        }


        initializeOptions(options);
        initializeSettings(settings);

        if (settings.specialProcessing && settings.specialProcessing.includes('ird_split_avian_host')) {
            let avianFound = forester.splitProperty(_treeData, 'Avian', 'ird:Host', 'ird:HostGroup');
            if (!avianFound) {
                delete _nodeVisualizations.HostGroup;
                console.log(MESSAGE + 'Deactivated Host Group visualization for Avian issue in IRD')
            } else {
                console.log(MESSAGE + 'Activated Host Group visualization for Avian issue in IRD')
            }
        }

        if (settings.enableNodeVisualizations) {
            if (settings.enableMsaResidueVisualizations && (_basicTreeProperties.alignedMolSeqs === true)
                && (_basicTreeProperties.maxMolSeqLength && _basicTreeProperties.maxMolSeqLength > 1)) {
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

                    if ((!_nodeVisualizations.hasOwnProperty(propertyName))
                        &&
                        (!_settings.propertiesToIgnoreForNodeVisualization || (_settings.propertiesToIgnoreForNodeVisualization.indexOf(propertyName) < 0))) {

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
                    if ((_settings.zoomToFitUponWindowResize === true)
                        && (_zoomed_x_or_y === false)
                        && (Math.abs(_zoomListener.scale() - 1.0) < 0.001)) {
                        zoomToFit();
                    }
                    if (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) {
                        let c1 = $('#' + _settings.controls1);
                        if (c1) {
                            c1.css({
                                'left': width - _settings.controls1Width
                            });
                        }
                    }
                });
        }

        _treeFn = d3.layout.cluster()
            .size([_displayHeight, _displayWidth]);

        _treeFn.clickEvent = getClickEventListenerNode(phylo);

        _root = phylo;
        _root_const = _root;

        calcMaxExtLabel();

        _root.x0 = _displayHeight / 2;
        _root.y0 = 0;

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

        if (_options.initialCollapseFeature) {
            let feature = _options.initialCollapseFeature;
            let refs = forester.collectPropertyRefs(_root, 'node', false);
            let found = false;
            if (refs) {
                refs.forEach(function (v) {
                    if (v === feature) {
                        found = true;
                    }
                });
            }
            if (found) {
                console.log(MESSAGE + 'Setting initial value for collapse by feature to: ' + feature);
                collapseSpecificSubtrees(_root, feature, KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL);
                let s = $('#' + COLLAPSE_BY_FEATURE_SELECT);
                if (s) {
                    s.val(feature);
                }
            } else {
                console.log(WARNING + ' initial value for collapse by feature [' + feature + '] not present');
            }
        } else if (_options.initialCollapseDepth > 0) {
            _depth_collapse_level = _options.initialCollapseDepth;
            let max_depth = forester.calcMaxDepth(_root);
            if (_depth_collapse_level >= max_depth) {
                console.log(WARNING + ' initial value for collapse depth [' + _depth_collapse_level + '] is larger than or equal to maximum depth [' + max_depth + ']');
                _depth_collapse_level = max_depth - 1;
            }
            console.log(MESSAGE + 'Setting initial value for collapse depth to: ' + _depth_collapse_level);
            forester.collapseToDepth(_root, _depth_collapse_level);
            updateDepthCollapseDepthDisplay();
        }

        update(null, 0);

        zoomToFit();


        ////////////////////////////////////////////////////////////////
        // let filter = {'vipr:Country': [ 'Chile', 'Peru']};
        // forester.filterByNodeProperty(true, _treeData, filter);

        //   let filter = {'vipr:Country': [ 'USA', 'China']};
        //  forester.filterByNodeProperty(false, _treeData, filter);

        // let filter = {'vipr:Host': [ 'Human']};
        //  forester.filterByNodeProperty(false, _treeData, filter);


        updateNodeVisualizationsAndLegends(_root);
        resetDepthCollapseDepthValue();
        resetRankCollapseRankValue();
        resetBranchLengthCollapseValue();
        search0();
        search1();

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
            if (d._children) {
                _maxLabelLength = Math.max((2 * _options.collapsedLabelLength) + 8, _maxLabelLength);
            } else if (!d.children) {
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
                let title = n.name ? 'Node Data: ' + n.name : 'Node Data';
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
                if (n.children || n._children) {
                    text += 'Number of External Nodes: ' + forester.calcSumOfAllExternalDescendants(n) + '<br>';
                }

                $('#' + NODE_DATA).dialog("destroy");

                $("<div id='" + NODE_DATA + "'>" + text + "</div>").dialog();
                let dialog = $('#' + NODE_DATA);

                let fs = (_settings.controlsFontSize + 4).toString() + 'px';

                $('.ui-dialog').css({
                    'text-align': 'left',
                    'color': _settings.controlsFontColor,
                    'font-size': fs,
                    'font-family': _settings.controlsFont,
                    'font-style': 'normal',
                    'font-weight': 'normal',
                    'text-decoration': 'none',
                    'width': 400,
                    'height': 400,
                    'overflow': 'auto'
                });

                $('.ui-dialog-titlebar').css({
                    'text-align': 'left',
                    'color': _settings.controlsFontColor,
                    'font-size': fs,
                    'font-family': _settings.controlsFont,
                    'font-style': 'normal',
                    'font-weight': 'bold',
                    'text-decoration': 'none'
                });

                dialog.dialog('option', 'modal', true);
                dialog.dialog('option', 'title', title);

                update();
            }

            function listExternalNodeData(node) {

                let addSep = function (t) {
                    if (t.length > 0) {
                        t += ', ';
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
                    if (_options.showLineage) {
                        let lin_text = '';
                        if (n.properties) {
                            const l = n.properties.length;
                            for (let pl = 0; pl < l; ++pl) {
                                if (n.properties[pl].ref === 'vipr:PANGO_Lineage'
                                    && n.properties[pl].datatype === 'xsd:string'
                                    && n.properties[pl].applies_to === 'node') {
                                    lin_text = addSep(lin_text);
                                    lin_text += n.properties[pl].value;
                                }
                            }
                        }
                        text = text + '\t' + lin_text;
                    }
                    if (_options.showMutations) {
                        let mut_text = '';
                        if (n.properties) {
                            const l = n.properties.length;
                            for (let pm = 0; pm < l; ++pm) {
                                if (n.properties[pm].ref === 'vipr:Mutation'
                                    && n.properties[pm].datatype === 'xsd:string'
                                    && n.properties[pm].applies_to === 'node') {
                                    mut_text = addSep(mut_text);
                                    mut_text += n.properties[pm].value;
                                }
                            }
                        }
                        text = text + '\t' + mut_text;
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
                        text = text + '\t' + tax_text;
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
                        text = text + '\t' + seq_text;
                    }
                    if (text.length > 0) {
                        text_all += text + '<br>';
                    }
                }

                $('#' + NODE_DATA).dialog("destroy");

                $("<div id='" + NODE_DATA + "'>" + text_all + "</div>").dialog();
                let dialog = $('#' + NODE_DATA);

                let fs = (_settings.controlsFontSize + 2).toString() + 'px';

                $('.ui-dialog').css({
                    'text-align': 'left',
                    'color': _settings.controlsFontColor,
                    'font-size': fs,
                    'font-family': MOLSEQ_FONT_DEFAULTS,
                    'font-style': 'normal',
                    'font-weight': 'normal',
                    'text-decoration': 'none',
                    'width': 740,
                    'height': 400,
                    'overflow': 'auto'
                });

                $('.ui-dialog-titlebar').css({
                    'text-align': 'left',
                    'color': _settings.controlsFontColor,
                    'font-size': fs,
                    'font-family': _settings.controlsFont,
                    'font-style': 'normal',
                    'font-weight': 'bold',
                    'text-decoration': 'none'
                });

                dialog.dialog('option', 'modal', true);
                dialog.dialog('option', 'title', title);

                update();
            }

            function downloadExternalNodeDataAll(node) {

                let addSep = function (t) {
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
                    //
                    let lin_text = '';
                    if (n.properties) {
                        const l = n.properties.length;
                        for (let pl = 0; pl < l; ++pl) {
                            if (n.properties[pl].ref === 'vipr:PANGO_Lineage'
                                && n.properties[pl].datatype === 'xsd:string'
                                && n.properties[pl].applies_to === 'node') {
                                lin_text = addSep(lin_text);
                                lin_text += n.properties[pl].value;
                            }
                        }
                    }
                    text = text + '\t' + lin_text;

                    let mut_text = '';
                    if (n.properties) {
                        const l = n.properties.length;
                        for (let pm = 0; pm < l; ++pm) {
                            if (n.properties[pm].ref === 'vipr:Mutation'
                                && n.properties[pm].datatype === 'xsd:string'
                                && n.properties[pm].applies_to === 'node') {
                                mut_text = addSep(mut_text);
                                mut_text += n.properties[pm].value;
                            }
                        }
                    }
                    text = text + '\t' + mut_text;

                    let year_month_text = '';
                    if (n.properties) {
                        const l = n.properties.length;
                        for (let pl = 0; pl < l; ++pl) {
                            if (n.properties[pl].ref === 'vipr:Year_Month'
                                && n.properties[pl].datatype === 'xsd:string'
                                && n.properties[pl].applies_to === 'node') {
                                year_month_text = addSep(year_month_text);
                                year_month_text += n.properties[pl].value;
                            }
                        }
                    }
                    text = text + '\t' + year_month_text;

                    let year_text = '';
                    if (n.properties) {
                        const l = n.properties.length;
                        for (let pl = 0; pl < l; ++pl) {
                            if (n.properties[pl].ref === 'vipr:Year'
                                && n.properties[pl].datatype === 'xsd:string'
                                && n.properties[pl].applies_to === 'node') {
                                year_text = addSep(year_text);
                                year_text += n.properties[pl].value;
                            }
                        }
                    }
                    text = text + '\t' + year_text;

                    let country_text = '';
                    if (n.properties) {
                        const l = n.properties.length;
                        for (let pl = 0; pl < l; ++pl) {
                            if (n.properties[pl].ref === 'vipr:Country'
                                && n.properties[pl].datatype === 'xsd:string'
                                && n.properties[pl].applies_to === 'node') {
                                country_text = addSep(country_text);
                                country_text += n.properties[pl].value;
                            }
                        }
                    }
                    text = text + '\t' + country_text;

                    let region_text = '';
                    if (n.properties) {
                        const l = n.properties.length;
                        for (let pl = 0; pl < l; ++pl) {
                            if (n.properties[pl].ref === 'vipr:Region'
                                && n.properties[pl].datatype === 'xsd:string'
                                && n.properties[pl].applies_to === 'node') {
                                region_text = addSep(region_text);
                                region_text += n.properties[pl].value;
                            }
                        }
                    }
                    text = text + '\t' + region_text;

                    let host_text = '';
                    if (n.properties) {
                        const l = n.properties.length;
                        for (let pl = 0; pl < l; ++pl) {
                            if (n.properties[pl].ref === 'vipr:Host'
                                && n.properties[pl].datatype === 'xsd:string'
                                && n.properties[pl].applies_to === 'node') {
                                host_text = addSep(host_text);
                                host_text += n.properties[pl].value;
                            }
                        }
                    }
                    text = text + '\t' + host_text;

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
                        text = text + '\t' + tax_text;
                    }
                    if (n.sequences) {
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
                        text = text + '\t' + seq_text;
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
                    if (_options.showLineage) {
                        let lin_text = '';
                        if (n.properties) {
                            const l = n.properties.length;
                            for (let pl = 0; pl < l; ++pl) {
                                if (n.properties[pl].ref === 'vipr:PANGO_Lineage'
                                    && n.properties[pl].datatype === 'xsd:string'
                                    && n.properties[pl].applies_to === 'node') {
                                    lin_text = addSep(lin_text);
                                    lin_text += n.properties[pl].value;
                                }
                            }
                        }
                        text = text + '\t' + lin_text;
                    }
                    if (_options.showMutations) {
                        let mut_text = '';
                        if (n.properties) {
                            const l = n.properties.length;
                            for (let pm = 0; pm < l; ++pm) {
                                if (n.properties[pm].ref === 'vipr:Mutation'
                                    && n.properties[pm].datatype === 'xsd:string'
                                    && n.properties[pm].applies_to === 'node') {
                                    mut_text = addSep(mut_text);
                                    mut_text += n.properties[pm].value;
                                }
                            }
                        }
                        text = text + '\t' + mut_text;
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
                        text = text + '\t' + tax_text;
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
                        text = text + '\t' + seq_text;
                    }
                    if (text.length > 0) {
                        text_all += text + '\n';
                    }
                }

                saveAs(new Blob([text_all], {type: "application/txt"}), filename);

                update();
            }


            function accessDatabase(node) {
                let url = null;
                if (node.sequences) {
                    for (let i = 0; i < node.sequences.length; ++i) {
                        let s = node.sequences[i];
                        if (s.accession && s.accession.value && s.accession.source) {
                            let value = s.accession.value;
                            let source = s.accession.source.toUpperCase();

                            if (source === ACC_GENBANK || source === ACC_NCBI) {
                                if (RE_GENBANK_PROT.test(value)) {
                                    url = 'https://www.ncbi.nlm.nih.gov/protein/' + value;
                                } else if (RE_GENBANK_NUC.test(value)) {
                                    //url = 'https://www.ncbi.nlm.nih.gov/nuccore/' + value; //TODO
                                    url = 'https://www.viprbrc.org/brc/viprStrainDetails.spg?ncbiAccession=' + value;
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
                if (node.name) {
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
                    alert("Don't know how to interpret sequence accession \'" + value + "\'");
                }


            }

            function listMolecularSequences(node) {

                let text_all = '';

                let ext_nodes = forester.getAllExternalNodes(node).reverse();
                let title = 'Sequences in Fasta-format for ' + ext_nodes.length + ' Nodes';

                for (let j = 0, l = ext_nodes.length; j < l; ++j) {
                    let n = ext_nodes[j];
                    if (n.sequences) {
                        for (let i = 0; i < n.sequences.length; ++i) {
                            let s = n.sequences[i];
                            if (s.mol_seq && s.mol_seq.value && s.mol_seq.value.length > 0) {
                                let seq = s.mol_seq.value;
                                let seqname = j;
                                if (s.name && s.name.length > 0) {
                                    seqname = s.name
                                } else if (n.name && n.name.length > 0) {
                                    seqname = n.name
                                }

                                let split_seq_ary = seq.match(/.{1,80}/g);
                                let split_seq = '';
                                for (let ii = 0; ii < split_seq_ary.length; ++ii) {
                                    split_seq += split_seq_ary[ii] + '<br>';
                                }

                                let fasta = '>' + seqname + '<br>' + split_seq;
                                text_all += fasta;
                            }
                        }
                    }
                }

                $('#' + NODE_DATA).dialog("destroy");

                $("<div id='" + NODE_DATA + "'>" + text_all + "</div>").dialog();
                let dialog = $('#' + NODE_DATA);

                let fs = (_settings.controlsFontSize + 2).toString() + 'px';

                $('.ui-dialog').css({
                    'text-align': 'left',
                    'color': _settings.controlsFontColor,
                    'font-size': fs,
                    'font-family': MOLSEQ_FONT_DEFAULTS,
                    'font-style': 'normal',
                    'font-weight': 'normal',
                    'text-decoration': 'none',
                    'width': 700,
                    'height': 400,
                    'overflow': 'auto'
                });

                $('.ui-dialog-titlebar').css({
                    'text-align': 'left',
                    'color': _settings.controlsFontColor,
                    'font-size': fs,
                    'font-family': _settings.controlsFont,
                    'font-style': 'normal',
                    'font-weight': 'bold',
                    'text-decoration': 'none'
                });

                dialog.dialog('option', 'modal', true);
                dialog.dialog('option', 'title', title);

                update();
            }

            function goToSubTree(node) {
                if (node.parent) {
                    if (!(node.children || node._children)) {
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
                        if (node._children) {
                            // To make sure, new root is uncollapsed.
                            node.children = node._children;
                            node._children = null;
                        }
                        _basicTreeProperties = forester.collectBasicTreeProperties(_root);
                        updateNodeVisualizationsAndLegends(_root);
                        resetDepthCollapseDepthValue();
                        resetRankCollapseRankValue();
                        resetBranchLengthCollapseValue();
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

            function toggleCollapse(node) {
                if (node.children) {
                    node._children = node.children;
                    node.children = null;
                } else {
                    unCollapseAll(node);
                }
            }

            function selectDeselectNode(node) { //~~~~
                if (_selectedNodes.has(node)) {
                    _selectedNodes.delete(node);
                } else {
                    _selectedNodes.add(node);
                }
                update(null, 0, true);
                const event = new Event('selected_nodes_changed_event');
                document.dispatchEvent(event);
            }

            function selectDeselectNodeExtNodes(node) { //~~~~
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
            let rectHeight = 230;

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
                .on('click', function (d) {
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
                        if (d._children) {
                            textSum += textInc;
                            return 'Uncollapse';
                        } else if (d.children) {
                            textSum += textInc;
                            return 'Collapse';
                        }
                    }
                })
                .on('click', function (d) {
                    toggleCollapse(d);
                    resetDepthCollapseDepthValue();
                    resetRankCollapseRankValue();
                    resetBranchLengthCollapseValue();
                    resetCollapseByFeature();
                    update(d);
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
                    let cc = 0;
                    forester.preOrderTraversalAll(d, function (e) {
                        if (e._children) {
                            ++cc;
                        }
                    });
                    if (cc > 1 || (cc === 1 && !d._children)) {
                        textSum += textInc;
                        return 'Uncollapse All';
                    }
                })
                .on('click', function (d) {
                    unCollapseAll(d);
                    resetDepthCollapseDepthValue();
                    resetRankCollapseRankValue();
                    resetBranchLengthCollapseValue();
                    resetCollapseByFeature();
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
                    if (d.parent && d.parent.parent) {
                        textSum += textInc;
                        return 'Go to Subtree';
                    }
                })
                .on('click', function (d) {
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
                .on('click', function (d) {
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
                .on('click', function (d) {
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
                    if (!_in_subtree && d.parent && d.parent.parent
                        && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
                        textSum += textInc;
                        return 'Reroot';
                    }
                })
                .on('click', function (d) {
                    unCollapseAll(_root);
                    forester.reRoot(tree, d, -1);
                    resetDepthCollapseDepthValue();
                    resetRankCollapseRankValue();
                    resetBranchLengthCollapseValue();
                    resetCollapseByFeature();
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
                    .on('click', function (d) {
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
                    .on('click', function (d) {
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
                .on('click', function (d) {
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
                .on('click', function (d) {
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
                .on('click', function (d) {
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
                .on('click', function (d) {
                    listMolecularSequences(d);
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
                            if (d.sequences) {
                                for (let i = 0; i < d.sequences.length; ++i) {
                                    let s = d.sequences[i];
                                    if (s.accession && s.accession.value && s.accession.source) {
                                        let source = s.accession.source.toUpperCase();
                                        if (source === ACC_GENBANK || source === ACC_NCBI || source === ACC_REFSEQ || source === ACC_UNIPROT
                                            || source === ACC_UNIPROTKB
                                            || source === ACC_SWISSPROT
                                            || source === ACC_TREMBL
                                            || source === 'UNKNOWN' || source === '?') {
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
                        }
                    )
                    .on('click', function (d) {
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
                            if (d.children || d._children) {
                                if ((d.children) && (d.children.length > 1)) {
                                    return 'Delete Subtree';
                                } else if ((d._children) && (d._children.length > 1)) {
                                    return 'Delete Collapsed Subtree';
                                }
                            } else {
                                return 'Delete External Node';
                            }
                        }
                    })
                    .on('click', function (d) {
                        unCollapseAll(_root);
                        forester.deleteSubtree(tree, d);
                        _treeData = tree;
                        _basicTreeProperties = forester.collectBasicTreeProperties(_treeData);
                        updateNodeVisualizationsAndLegends(_treeData);
                        resetDepthCollapseDepthValue();
                        resetRankCollapseRankValue();
                        resetBranchLengthCollapseValue();
                        resetCollapseByFeature();
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


    $('html').click(function (d) {
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

        if ((_showLegends && (_settings.enableNodeVisualizations || _settings.enableBranchVisualizations) && (_legendColorScales[LEGEND_LABEL_COLOR] ||
            (_options.showNodeVisualizations && (_legendColorScales[LEGEND_NODE_FILL_COLOR] ||
                _legendColorScales[LEGEND_NODE_BORDER_COLOR] ||
                _legendShapeScales[LEGEND_NODE_SHAPE] ||
                _legendSizeScales[LEGEND_NODE_SIZE]))))) {
            if (_legendColorScales[LEGEND_LABEL_COLOR]) {
                removeLegend(LEGEND_LABEL_COLOR);
                addLegend(LEGEND_LABEL_COLOR, _visualizations.labelColor[_currentLabelColorVisualization]);
            }
            if (_legendColorScales[LEGEND_NODE_FILL_COLOR]) {
                removeLegend(LEGEND_NODE_FILL_COLOR);
                addLegend(LEGEND_NODE_FILL_COLOR, _visualizations.nodeFillColor[_currentNodeFillColorVisualization]);
            }

            if (_legendColorScales[LEGEND_NODE_BORDER_COLOR]) {
                removeLegend(LEGEND_NODE_BORDER_COLOR);
                addLegend(LEGEND_NODE_BORDER_COLOR, _visualizations.nodeBorderColor[_currentNodeBorderColorVisualization]);
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
            //initializeSettings(_settings); //TODO why is/was this called here?
            removeColorPicker();
            _zoomListener.scale(1);
            update(_root, 0);
            centerNode(_root, _settings.rootOffset, TOP_AND_BOTTOM_BORDER_HEIGHT);
        }
    }

    function returnToSupertreeButtonPressed() {
        if (_in_subtree) {
            _root = _root_const;
            _in_subtree = false;
            _basicTreeProperties = forester.collectBasicTreeProperties(_root);
            updateNodeVisualizationsAndLegends(_root);
            resetDepthCollapseDepthValue();
            resetRankCollapseRankValue();
            resetBranchLengthCollapseValue();
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
                resetDepthCollapseDepthValue();
                resetRankCollapseRankValue();
                resetBranchLengthCollapseValue();
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

    function uncollapseAllButtonPressed() {
        if (_root && forester.isHasCollapsedNodes(_root)) {
            unCollapseAll(_root);
            resetDepthCollapseDepthValue();
            resetRankCollapseRankValue();
            resetBranchLengthCollapseValue();
            resetCollapseByFeature();
            zoomToFit();
        }
    }

    function midpointRootButtonPressed() {
        if (!_in_subtree && _root
            && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
            unCollapseAll(_root);
            forester.midpointRoot(_root);
            resetDepthCollapseDepthValue();
            resetRankCollapseRankValue();
            resetBranchLengthCollapseValue();
            resetCollapseByFeature();
            zoomToFit();
        }
    }

    function escPressed() {
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
            let c0 = $('#' + _settings.controls0);
            if (c0) {
                c0.css({
                    'left': _settings.controls0Left,
                    'top': _settings.controls0Top + _offsetTop
                });
            }
            let c1 = $('#' + _settings.controls1);
            if (c1) {
                if (_settings.enableDynamicSizing) {
                    c1.css({
                        'left': width - _settings.controls1Width,
                        'top': _settings.controls1Top + _offsetTop
                    });
                } else {
                    c1.css({
                        'left': _settings.controls1Left,
                        'top': _settings.controls1Top + _offsetTop
                    });
                }
            }

        }
        if (_options.searchAinitialValue) {
            $('#' + SEARCH_FIELD_0).val(_options.searchAinitialValue);
            search0();
        }
        if (_options.searchBinitialValue) {
            $('#' + SEARCH_FIELD_1).val(_options.searchBinitialValue);
            search1();
        }
    }

    function search0() {
        _foundNodes0.clear();
        _searchBox0Empty = true;
        let query = $('#' + SEARCH_FIELD_0).val();
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
        let query = $('#' + SEARCH_FIELD_1).val();
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
        $('#' + SEARCH_FIELD_0).val('');
        update(null, 0, true);
        update(null, 0, true);
    }

    function resetSearch1() {
        _foundNodes1.clear();
        _searchBox1Empty = true;
        $('#' + SEARCH_FIELD_1).val('');
        update(null, 0, true);
        update(null, 0, true);
    }


    function search(query) {
        return forester.searchData(query,
            _root,
            _options.searchIsCaseSensitive,
            _options.searchIsPartial,
            _options.searchUsesRegex,
            _options.searchProperties);
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

    function nodeNameCbClicked() {
        _options.showNodeName = getCheckboxValue(NODE_NAME_CB);
        if (_options.showNodeName) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        update();
    }

    function hostsCbClicked() {
        _options.showHosts = getCheckboxValue(HOSTS_CB);
        if (_options.showHosts) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        update();
    }

    function customData1CbClicked() {
        _options.showLineage = getCheckboxValue(CUSTOM_DATA_1_CB);
        if (_options.showLineage) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        update();
    }

    function customData2CbClicked() {
        _options.showMutations = getCheckboxValue(CUSTOM_DATA_2_CB);
        if (_options.showMutations) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        update();
    }

    function customCbClicked(cb_id) { //~~~
        if (_nodeLabels) {
            const cb_value = getCheckboxValue(cb_id);
            for (const [key, value] of Object.entries(_nodeLabels)) {
                if (value.label && value.showButton === true && value.propertyRef && value.description) {
                    if (value.cb_id === cb_id) {
                        value.selected = cb_value;
                    }
                }
            }
            update();
        }
    }

    function taxonomyCbClicked() {
        _options.showTaxonomy = getCheckboxValue(TAXONOMY_CB);
        if (_options.showTaxonomy) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        update();
    }

    function sequenceCbClicked() {
        _options.showSequence = getCheckboxValue(SEQUENCE_CB);
        if (_options.showSequence) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        update();
    }

    function confidenceValuesCbClicked() {
        _options.showConfidenceValues = getCheckboxValue(CONFIDENCE_VALUES_CB);
        update();
    }

    function branchLengthsCbClicked() {
        _options.showBranchLengthValues = getCheckboxValue(BRANCH_LENGTH_VALUES_CB);
        update();
    }

    function nodeEventsCbClicked() {
        _options.showNodeEvents = getCheckboxValue(NODE_EVENTS_CB);
        update();
    }

    function branchEventsCbClicked() {
        _options.showBranchEvents = getCheckboxValue(BRANCH_EVENTS_CB);
        update();
    }

    function internalLabelsCbClicked() {
        _options.showInternalLabels = getCheckboxValue(INTERNAL_LABEL_CB);
        update();
    }

    function externalLabelsCbClicked() {
        _options.showExternalLabels = getCheckboxValue(EXTERNAL_LABEL_CB);
        update();
    }

    function internalNodesCbClicked() {
        _options.showInternalNodes = getCheckboxValue(INTERNAL_NODES_CB);
        update();
    }

    function externalNodesCbClicked() {
        _options.showExternalNodes = getCheckboxValue(EXTERNAL_NODES_CB);
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
        update(null, 0);
        update(null, 0);
    }

    function shortenCbClicked() {
        _options.shortenNodeNames = getCheckboxValue(SHORTEN_NODE_NAME_CB);
        resetVis();
        update(null, 0);
    }

    function downloadButtonPressed() {
        const s = $('#' + EXPORT_FORMAT_SELECT);
        if (s) {
            let format = s.val();
            downloadTree(format);
        }
    }

    function submitSelectedPressed() {
        console.log('submitSelectedPressed called')
        const event = new Event('submit_selected_nodes_event');
        document.dispatchEvent(event);
    }

    function changeBaseBackgoundColor(color) {
        let bg = $('.' + BASE_BACKGROUND);
        if (bg) {
            bg.css({
                'fill': color
            });
        }
    }

    function changeBranchWidth(e, slider) {
        _options.branchWidthDefault = getSliderValue(slider);
        update(null, 0, true);
    }

    function changeNodeSize(e, slider) {
        _options.nodeSizeDefault = getSliderValue(slider);
        if (!_options.showInternalNodes && !_options.showExternalNodes && !_options.showNodeVisualizations
            && !_options.showNodeEvents) {
            _options.showInternalNodes = true;
            _options.showExternalNodes = true;
            setCheckboxValue(INTERNAL_NODES_CB, true);
            setCheckboxValue(EXTERNAL_NODES_CB, true);
        }
        update(null, 0, true);
    }


    function changeInternalFontSize(e, slider) {
        _options.internalNodeFontSize = getSliderValue(slider);
        update(null, 0, true);
    }

    function changeExternalFontSize(e, slider) {
        _options.externalNodeFontSize = getSliderValue(slider);
        update(null, 0, true);
    }

    function changeBranchDataFontSize(e, slider) {
        _options.branchDataFontSize = getSliderValue(slider);
        update(null, 0, true);
    }

    function updateMsaResidueVisCurrResPosFromSlider(e, slider) {
        removeColorPicker();
        _msa_residue_vis_curr_res_pos = getSliderValue(slider) - 1;
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
        let radio = $('#' + id);
        if (radio) {
            radio[0].checked = value;
            radio.button('refresh');
        }
    }

    function setCheckboxValue(id, value) {
        let cb = $('#' + id);
        if (cb && cb[0]) {
            cb[0].checked = value;
            cb.button('refresh');
        }
    }

    function setSelectMenuValue(id, valueToSelect) {
        const element = document.getElementById(id);
        if (element != null) {
            element.value = valueToSelect;
        }
    }

    function getCheckboxValue(id) {
        return $('#' + id).is(':checked');
    }

    function getSliderValue(slider) {
        return slider.value;
    }

    function setSliderValue(id, value) {
        let sli = $('#' + id);
        if (sli) {
            sli.slider('value', value);
        }
    }

    function updateMsaResidueVisCurrResPosSliderValue() {
        let sli = $('#' + MSA_RESIDUE_VIS_CURR_RES_POS_SLIDER_1);
        if (sli) {
            sli.slider('value', _msa_residue_vis_curr_res_pos + 1);
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


        let container = $(_id);

        container.css({
            'font-style': 'normal',
            'font-weight': 'normal',
            'text-decoration': 'none',
            'text-align': 'left',
            'borderColor': 'LightGray'
        });


        _node_mouseover_div = d3.select("body").append("div")
            .attr("class", "node_mouseover_tooltip")
            .style("opacity", 1e-6);


        let c0 = $('#' + _settings.controls0);

        if (c0) {
            c0.css({
                'position': 'absolute',
                'left': _settings.controls0Left,
                'top': _settings.controls0Top + _offsetTop,
                'text-align': 'left',
                'padding': '0px',
                'margin': '0 0 0 0',
                'opacity': 0.80,
                'background-color': _settings.controlsBackgroundColor,
                'color': _settings.controlsFontColor,
                'font-size': _settings.controlsFontSize,
                'font-family': _settings.controlsFont,
                'font-style': 'normal',
                'font-weight': 'normal',
                'text-decoration': 'none'
            });

            c0.draggable({containment: 'parent'});

            c0.append(makeProgramDesc());

            c0.append(makePhylogramControl());

            c0.append(makeDisplayControl());

            c0.append(makeZoomControl());

            let pn = $('.' + PROG_NAME);
            if (pn) {
                pn.css({
                    'text-align': 'center',
                    'padding-top': '3px',
                    'padding-bottom': '5px',
                    'font-size': _settings.controlsFontSize,
                    'font-family': _settings.controlsFont,
                    'font-style': 'italic',
                    'font-weight': 'bold',
                    'text-decoration': 'none'
                });
            }
            let pnl = $('.' + PROGNAMELINK);
            if (pnl) {
                pnl.css({
                    'color': COLOR_FOR_ACTIVE_ELEMENTS,
                    'font-size': _settings.controlsFontSize,
                    'font-family': _settings.controlsFont,
                    'font-style': 'italic',
                    'font-weight': 'bold',
                    'text-decoration': 'none',
                    'border': 'none'
                });
                $('.' + PROGNAMELINK + ':hover').css({
                    'color': COLOR_FOR_ACTIVE_ELEMENTS,
                    'font-size': _settings.controlsFontSize,
                    'font-family': _settings.controlsFont,
                    'font-style': 'italic',
                    'font-weight': 'bold',
                    'text-decoration': 'none',
                    'border': 'none'
                });
                $('.' + PROGNAMELINK + ':link').css({
                    'color': COLOR_FOR_ACTIVE_ELEMENTS,
                    'font-size': _settings.controlsFontSize,
                    'font-family': _settings.controlsFont,
                    'font-style': 'italic',
                    'font-weight': 'bold',
                    'text-decoration': 'none',
                    'border': 'none'
                });
                $('.' + PROGNAMELINK + ':visited').css({
                    'color': COLOR_FOR_ACTIVE_ELEMENTS,
                    'font-size': _settings.controlsFontSize,
                    'font-family': _settings.controlsFont,
                    'font-style': 'italic',
                    'font-weight': 'bold',
                    'text-decoration': 'none',
                    'border': 'none'
                });
            }

            $('.' + PHYLOGRAM_CLADOGRAM_CONTROLGROUP).controlgroup({
                'direction': 'horizontal'
            });

            $('.' + DISPLAY_DATA_CONTROLGROUP).controlgroup({
                'direction': 'vertical'
            });

            c0.append(makeControlButtons());

            c0.append(makeSliders());

            c0.append(makeSearchBoxes());

            $('.' + SEARCH_OPTIONS_GROUP).controlgroup({
                'direction': 'horizontal'
            });

            c0.append(makeAutoCollapse());

            if (_settings.allowManualNodeSelection) {
                //c0.append(makeSubmitSection()); //~~~
            }

            if (_settings.enableDownloads) {
                c0.append(makeDownloadSection());
            }
        }

        let c1 = $('#' + _settings.controls1);
        if (c1) {
            c1.css({
                'position': 'absolute',
                'left': _settings.controls1Left,
                'top': _settings.controls1Top + _offsetTop,
                'text-align': 'left',
                'padding': '0px',
                'margin': '0 0 0 0',
                'opacity': 0.80,
                'background-color': _settings.controlsBackgroundColor,
                'color': _settings.controlsFontColor,
                'font-size': _settings.controlsFontSize,
                'font-family': _settings.controlsFont,
                'font-style': 'normal',
                'font-weight': 'normal',
                'text-decoration': 'none'
            });

            c1.draggable({containment: 'parent'});

            if (_settings.enableNodeVisualizations && _nodeVisualizations) {
                c1.append(makeVisualControls());
                if (isCanDoMsaResidueVisualizations()) {
                    c1.append(makeMsaResidueVisCurrResPositionControl());
                }


                if (isAddVisualization2() && _specialVisualizations != null) {
                    if ('Mutations' in _specialVisualizations) {
                        const mutations = _specialVisualizations['Mutations'];
                        if (mutations != null) {
                            c1.append(makeVisualization2(mutations.label));
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
                            c1.append(makeVisualization3(conv_mutations.label));
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
                            c1.append(makeVisualization4(lineages.label));
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

                c1.append(makeLegendControl());
            }
        }

        $('input:button')
            .button()
            .css({
                'width': '26px',
                'text-align': 'center',
                'outline': 'none',
                'margin': '0px',
                'font-style': 'normal',
                'font-weight': 'normal',
                'text-decoration': 'none'
            });

        $('#' + ZOOM_IN_Y + ', #' + ZOOM_OUT_Y)
            .css({
                'width': '78px'
            });

        $('#' + ZOOM_IN_Y + ', #' + ZOOM_OUT_Y + ', #' + ZOOM_TO_FIT + ', #' + ZOOM_IN_X + ', #' + ZOOM_OUT_X)
            .css({
                'height': '16px'
            });


        $('#' + DECR_DEPTH_COLLAPSE_LEVEL + ', #' + INCR_DEPTH_COLLAPSE_LEVEL + ', #' + DECR_BL_COLLAPSE_LEVEL + ', #' + INCR_BL_COLLAPSE_LEVEL)
            .css({
                'width': '16px'
            });

        $('#' + LEGENDS_MOVE_UP_BTN + ', #' + LEGENDS_MOVE_DOWN_BTN)
            .css({
                'width': '72px'
            });

        $('#' + LEGENDS_RESET_BTN + ', #' + LEGENDS_MOVE_LEFT_BTN + ', #' + LEGENDS_MOVE_RIGHT_BTN)
            .css({
                'width': '24px'
            });

        $('#' + LEGENDS_SHOW_BTN + ', #' + LEGENDS_HORIZ_VERT_BTN)
            .css({
                'width': '36px'
            });

        $('#' + LEGENDS_MOVE_UP_BTN + ', #' + LEGENDS_MOVE_DOWN_BTN + ', #' +
            LEGENDS_RESET_BTN + ', #' + LEGENDS_MOVE_LEFT_BTN + ', #' + LEGENDS_MOVE_RIGHT_BTN +
            ', #' + LEGENDS_SHOW_BTN + ', #' + LEGENDS_HORIZ_VERT_BTN
        )
            .css({
                'height': '16px'
            });


        const downloadButton = $('#' + DOWNLOAD_BUTTON);

        if (downloadButton) {
            downloadButton.css({
                'width': '60px',
                'margin-bottom': '3px'
            });
        }

        const submitSelectedButton = $('#' + SUBMIT_SELECTED_NODES_BUTTON);

        if (submitSelectedButton) {
            submitSelectedButton.css({
                'width': '80px',
                'margin-bottom': '3px'
            });
        }

        $(':radio').checkboxradio({
            icon: false
        });

        $(':checkbox').checkboxradio({
            icon: false
        });

        $('#' + SEARCH_FIELD_0).keyup(search0);

        $('#' + SEARCH_FIELD_1).keyup(search1);

        $('#' + PHYLOGRAM_BUTTON).click(toPhylogram);

        $('#' + PHYLOGRAM_ALIGNED_BUTTON).click(toAlignedPhylogram);

        $('#' + CLADOGRAM_BUTTON).click(toCladegram);

        $('#' + NODE_NAME_CB).click(nodeNameCbClicked);

        $('#' + HOSTS_CB).click(hostsCbClicked);

        $('#' + CUSTOM_DATA_1_CB).click(customData1CbClicked);

        $('#' + CUSTOM_DATA_2_CB).click(customData2CbClicked);

        $('#' + TAXONOMY_CB).click(taxonomyCbClicked);

        $('#' + SEQUENCE_CB).click(sequenceCbClicked);

        $('#' + CONFIDENCE_VALUES_CB).click(confidenceValuesCbClicked);

        $('#' + BRANCH_LENGTH_VALUES_CB).click(branchLengthsCbClicked);

        $('#' + NODE_EVENTS_CB).click(nodeEventsCbClicked);

        $('#' + BRANCH_EVENTS_CB).click(branchEventsCbClicked);

        $('#' + INTERNAL_LABEL_CB).click(internalLabelsCbClicked);

        $('#' + EXTERNAL_LABEL_CB).click(externalLabelsCbClicked);

        $('#' + INTERNAL_NODES_CB).click(internalNodesCbClicked);

        $('#' + EXTERNAL_NODES_CB).click(externalNodesCbClicked);

        $('#' + NODE_VIS_CB).click(nodeVisCbClicked);

        $('#' + BRANCH_VIS_CB).click(branchVisCbClicked);

        $('#' + BRANCH_COLORS_CB).click(branchColorsCbClicked);

        $('#' + DYNAHIDE_CB).click(dynaHideCbClicked);

        $('#' + SHORTEN_NODE_NAME_CB).click(shortenCbClicked);

        if (_nodeLabels) { // ~~~~
            for (const [key, value] of Object.entries(_nodeLabels)) {
                if (value.label && value.showButton === true && value.propertyRef && value.description) {
                    const cb_id = makeIdForCustomCheckboxButton(key);
                    $('#' + cb_id).click(function () {
                        customCbClicked(cb_id);
                    });
                    if (value.selected === true) {
                        setCheckboxValue(cb_id, true);
                    }
                }
            }
        }

        $('#' + LABEL_COLOR_SELECT_MENU).on('change', function () {
            const v = this.value;
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

        $('#' + LABEL_COLOR_SELECT_MENU_2).on('change', function () {
            const v = this.value;
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


        $('#' + LABEL_COLOR_SELECT_MENU_3).on('change', function () {
            const v = this.value;
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

        $('#' + LABEL_COLOR_SELECT_MENU_4).on('change', function () {
            const v = this.value;
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

        $('#' + NODE_FILL_COLOR_SELECT_MENU).on('change', function () {
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
                if (!_options.showExternalNodes && !_options.showInternalNodes
                    && (_currentNodeShapeVisualization == null)) {
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


        $('#' + NODE_FILL_COLOR_SELECT_MENU_2).on('change', function () {
            const v = this.value;
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

        $('#' + NODE_FILL_COLOR_SELECT_MENU_3).on('change', function () {
            const v = this.value;
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

        $('#' + NODE_FILL_COLOR_SELECT_MENU_4).on('change', function () {
            const v = this.value;
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


        $('#' + NODE_SHAPE_SELECT_MENU).on('change', function () {
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

        $('#' + NODE_SIZE_SELECT_MENU).on('change', function () {
            let v = this.value;
            if (v && v !== DEFAULT) {
                _currentNodeSizeVisualization = v;
                addLegendForSizes(LEGEND_NODE_SIZE, _visualizations.nodeSize[_currentNodeSizeVisualization]);
                if (!_options.showExternalNodes && !_options.showInternalNodes
                    && (_currentNodeShapeVisualization == null)) {
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

        $('#' + NODE_SIZE_SLIDER).slider({
            min: NODE_SIZE_MIN,
            max: NODE_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.nodeSizeDefault,
            animate: 'fast',
            slide: changeNodeSize,
            change: changeNodeSize
        });

        $('#' + BRANCH_WIDTH_SLIDER).slider({
            min: BRANCH_WIDTH_MIN,
            max: BRANCH_WIDTH_MAX,
            step: SLIDER_STEP,
            value: _options.branchWidthDefault,
            animate: 'fast',
            slide: changeBranchWidth,
            change: changeBranchWidth
        });

        $('#' + EXTERNAL_FONT_SIZE_SLIDER).slider({
            min: FONT_SIZE_MIN,
            max: FONT_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.externalNodeFontSize,
            animate: 'fast',
            slide: changeExternalFontSize,
            change: changeExternalFontSize
        });

        $('#' + INTERNAL_FONT_SIZE_SLIDER).slider({
            min: FONT_SIZE_MIN,
            max: FONT_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.internalNodeFontSize,
            animate: 'fast',
            slide: changeInternalFontSize,
            change: changeInternalFontSize
        });

        $('#' + BRANCH_DATA_FONT_SIZE_SLIDER).slider({
            min: FONT_SIZE_MIN,
            max: FONT_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.branchDataFontSize,
            animate: 'fast',
            slide: changeBranchDataFontSize,
            change: changeBranchDataFontSize
        });

        $('#' + SEARCH_FIELD_0 + ', #' + SEARCH_FIELD_1)
            .off('keydown')
            .off('mouseenter')
            .off('mousedown')
            .css({
                'font': 'inherit',
                'color': 'inherit',
                'text-align': 'left',
                'outline': 'none',
                'cursor': 'text',
                'width': _settings.searchFieldWidth,
                'height': _settings.textFieldHeight
            });

        $('#' + DEPTH_COLLAPSE_LABEL + ', #' + BL_COLLAPSE_LABEL)
            .button()
            .off('keydown')
            .off('mouseenter')
            .off('mousedown')
            .attr('disabled', 'disabled')
            .css({
                'font': 'inherit',
                'color': 'inherit',
                'text-align': 'center',
                'outline': 'none',
                'cursor': 'text',
                'width': _settings.collapseLabelWidth
            });

        $('#' + ZOOM_IN_Y).mousedown(function () {
            zoomInY();
            _intervalId = setInterval(zoomInY, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + ZOOM_OUT_Y).mousedown(function () {
            zoomOutY();
            _intervalId = setInterval(zoomOutY, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + ZOOM_IN_X).mousedown(function () {
            zoomInX();
            _intervalId = setInterval(zoomInX, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + ZOOM_OUT_X).mousedown(function () {
            zoomOutX();
            _intervalId = setInterval(zoomOutX, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + DECR_DEPTH_COLLAPSE_LEVEL).mousedown(function () {
            decrDepthCollapseLevel();
            _intervalId = setInterval(decrDepthCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });
        $('#' + INCR_DEPTH_COLLAPSE_LEVEL).mousedown(function () {
            incrDepthCollapseLevel();
            _intervalId = setInterval(incrDepthCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });
        $('#' + DECR_BL_COLLAPSE_LEVEL).mousedown(function () {
            decrBlCollapseLevel();
            _intervalId = setInterval(decrBlCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });
        $('#' + INCR_BL_COLLAPSE_LEVEL).mousedown(function () {
            incrBlCollapseLevel();
            _intervalId = setInterval(incrBlCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + ZOOM_TO_FIT).mousedown(zoomToFit);

        $('#' + RETURN_TO_SUPERTREE_BUTTON).mousedown(returnToSupertreeButtonPressed);

        $('#' + RETURN_TO_SUPERTREE_BUTTON_BY_ONE).mousedown(returnToSupertreeButtonByOnePressed);

        $('#' + ORDER_BUTTON).mousedown(orderButtonPressed);

        $('#' + UNCOLLAPSE_ALL_BUTTON).mousedown(uncollapseAllButtonPressed);

        $('#' + MIDPOINT_ROOT_BUTTON).mousedown(midpointRootButtonPressed);

        // Search Controls
        // ---------------

        $('#' + SEARCH_OPTIONS_CASE_SENSITIVE_CB).click(searchOptionsCaseSenstiveCbClicked);
        $('#' + SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB).click(searchOptionsCompleteTermsOnlyCbClicked);
        $('#' + SEARCH_OPTIONS_REGEX_CB).click(searchOptionsRegexCbClicked);
        $('#' + SEARCH_OPTIONS_NEGATE_RES_CB).click(searchOptionsNegateResultCbClicked);
        $('#' + SEARCH_OPTIONS_PROPERTIES_CB).click(searchOptionsPropertiesCbClicked);

        $('#' + RESET_SEARCH_A_BTN).mousedown(resetSearch0);
        $('#' + RESET_SEARCH_B_BTN).mousedown(resetSearch1);

        // Visualization Legends
        // ---------------------

        $('#' + LEGENDS_MOVE_UP_BTN).mousedown(function () {
            legendMoveUp(2);
            _intervalId = setInterval(legendMoveUp, MOVE_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + LEGENDS_MOVE_DOWN_BTN).mousedown(function () {
            legendMoveDown(2);
            _intervalId = setInterval(legendMoveDown, MOVE_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + LEGENDS_MOVE_LEFT_BTN).mousedown(function () {
            legendMoveLeft(2);
            _intervalId = setInterval(legendMoveLeft, MOVE_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + LEGENDS_MOVE_RIGHT_BTN).mousedown(function () {
            legendMoveRight(2);
            _intervalId = setInterval(legendMoveRight, MOVE_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + LEGENDS_HORIZ_VERT_BTN).click(legendHorizVertClicked);
        $('#' + LEGENDS_SHOW_BTN).click(legendShowClicked);
        $('#' + LEGENDS_RESET_BTN).click(legendResetClicked);

        // ----------------

        if (downloadButton) {
            downloadButton.mousedown(downloadButtonPressed);
        }

        if (submitSelectedButton) {
            submitSelectedButton.mousedown(submitSelectedPressed);
        }

        // Collapse
        // ---------------

        $('#' + COLLAPSE_BY_FEATURE_SELECT)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + EXPORT_FORMAT_SELECT)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + COLLAPSE_BY_FEATURE_SELECT).on('change', function () {
            let s = $('#' + COLLAPSE_BY_FEATURE_SELECT);
            if (s) {
                let f = s.val();
                if (f) {
                    collapseByFeature(f);
                }
            }
        });


        // ---------------

        // Visualizations
        // ---------------

        $('#' + LABEL_COLOR_SELECT_MENU)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + NODE_FILL_COLOR_SELECT_MENU)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + NODE_SHAPE_SELECT_MENU)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + NODE_SIZE_SELECT_MENU)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });


        $('#' + LABEL_COLOR_SELECT_MENU_2)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + NODE_FILL_COLOR_SELECT_MENU_2)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + LABEL_COLOR_SELECT_MENU_3)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + NODE_FILL_COLOR_SELECT_MENU_3)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + LABEL_COLOR_SELECT_MENU_4)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });

        $('#' + NODE_FILL_COLOR_SELECT_MENU_4)
            .select()
            .css({
                'font': 'inherit',
                'color': 'inherit'
            });


        // MSA residue visualization: Position control
        // -------------------------------------------
        $('#' + MSA_RESIDUE_VIS_DECR_CURR_RES_POS_BTN + ', #' + MSA_RESIDUE_VIS_INCR_CURR_RES_POS_BTN)
            .css({
                'width': '18px'
            });

        $('#' + MSA_RESIDUE_VIS_CURR_RES_POS_LABEL)
            .off('keydown')
            .off('mouseenter')
            .off('mousedown')
            .css({
                'font': 'inherit',
                'color': 'inherit',
                'text-align': 'center',
                'outline': 'none',
                'cursor': 'text',
                'width': '28px',
                'height': _settings.textFieldHeight
            });

        $('#' + MSA_RESIDUE_VIS_CURR_RES_POS_LABEL).keyup(function (e) {
            let keycode = e.keyCode;
            if ((((keycode >= VK_0) && (keycode <= VK_9)) || ((keycode >= VK_0_NUMPAD)) && (keycode <= VK_9_NUMPAD)) || (keycode === VK_BACKSPACE) || (keycode === VK_DELETE)) {
                let i = 0;
                if ((((keycode >= VK_0) && (keycode <= VK_9))
                        || ((keycode >= VK_0_NUMPAD) && (keycode <= VK_9_NUMPAD)))
                    && _basicTreeProperties.maxMolSeqLength
                    && (_msa_residue_vis_curr_res_pos >= (_basicTreeProperties.maxMolSeqLength - 1))) {
                    if (((keycode >= VK_0) && (keycode <= VK_9))) {
                        i = keycode - 48;
                    } else {
                        i = keycode - 96;
                    }
                } else {
                    let x = $('#' + MSA_RESIDUE_VIS_CURR_RES_POS_LABEL).val().trim();
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

        $('#' + MSA_RESIDUE_VIS_DECR_CURR_RES_POS_BTN).mousedown(function () {
            decrMsaResidueVisCurrResPos();
            _intervalId = setInterval(decrMsaResidueVisCurrResPos, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $('#' + MSA_RESIDUE_VIS_INCR_CURR_RES_POS_BTN).mousedown(function () {
            incrMsaResidueVisCurrResPos();
            _intervalId = setInterval(incrMsaResidueVisCurrResPos, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });


        // -------------------------------------------

        $(document).keyup(function (e) {
            if (e.altKey) {
                if (e.keyCode === VK_O) {
                    orderButtonPressed();
                } else if (e.keyCode === VK_R) {
                    returnToSupertreeButtonByOnePressed();
                } else if (e.keyCode === VK_U) {
                    uncollapseAllButtonPressed();
                } else if (e.keyCode === VK_M) {
                    midpointRootButtonPressed();
                } else if (e.keyCode === VK_C || e.keyCode === VK_DELETE
                    || e.keyCode === VK_BACKSPACE || e.keyCode === VK_HOME) {
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
            } else if (e.keyCode === VK_HOME) {
                zoomToFit();
            } else if (e.keyCode === VK_ESC) {
                escPressed();
            }
        });

        $(document).keydown(function (e) {
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
                } else if (e.keyCode === VK_A) {
                    decrDepthCollapseLevel();
                } else if (e.keyCode === VK_S) {
                    incrDepthCollapseLevel();
                }
            }
            if (e.keyCode === VK_PAGE_UP) {
                increaseFontSizes();
            } else if (e.keyCode === VK_PAGE_DOWN) {
                decreaseFontSizes();
            }
        });


        $(document).on('mousewheel DOMMouseScroll', function (e) {
            if (e.shiftKey) {
                if (e.originalEvent) {
                    let oe = e.originalEvent;
                    if (oe.detail > 0 || oe.wheelDelta < 0) {
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
                }
                // To prevent page fom scrolling:
                return false;
            }
        });

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

        function makePhylogramControl() {
            let radioGroup = 'phylogram_control_radio';
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<div class="' + PHYLOGRAM_CLADOGRAM_CONTROLGROUP + '">');
            h = h.concat(makeRadioButton('P', PHYLOGRAM_BUTTON, radioGroup, 'phylogram display (uses branch length values)  (use Alt+P to cycle between display types)'));
            h = h.concat(makeRadioButton('A', PHYLOGRAM_ALIGNED_BUTTON, radioGroup, 'phylogram display (uses branch length values) with aligned labels  (use Alt+P to cycle between display types)'));
            h = h.concat(makeRadioButton('C', CLADOGRAM_BUTTON, radioGroup, ' cladogram display (ignores branch length values)  (use Alt+P to cycle between display types)'));
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeIdForCustomCheckboxButton(key) {
            return key + '__cb';
        }

        function makeDisplayControl() {
            let h = "";

            h = h.concat('<fieldset><legend>Display Data</legend>');
            h = h.concat('<div class="' + DISPLAY_DATA_CONTROLGROUP + '">');
            if (_settings.showNodeNameButton && _basicTreeProperties.nodeNames) {
                h = h.concat(makeCheckboxButton('Node Name', NODE_NAME_CB, 'to show/hide node names (node names usually are the untyped labels found in New Hampshire/Newick formatted trees)'));
            }
            if (_settings.showTaxonomyButton && _basicTreeProperties.taxonomies) {
                h = h.concat(makeCheckboxButton('Taxonomy', TAXONOMY_CB, 'to show/hide node taxonomic information'));
            }
            if (_settings.showSequenceButton && _basicTreeProperties.sequences) {
                h = h.concat(makeCheckboxButton('Sequence', SEQUENCE_CB, 'to show/hide node sequence information'));
            }

            if (_nodeLabels) { //~~~
                for (const [key, value] of Object.entries(_nodeLabels)) {
                    if (value.label && value.propertyRef && value.description) {
                        const cb_id = makeIdForCustomCheckboxButton(key);
                        if (value.showButton === true) {
                            h = h.concat(makeCheckboxButton(value.label, cb_id, value.description));
                        }
                        value.cb_id = cb_id;
                    }
                }
            }


            // ~~~~~~~
            // if (true) { //FIXME ~~
            //     h = h.concat(makeCheckboxButton('Hosts', HOSTS_CB, 'to show/hide host information'));
            // }
            // if (_settings.showLineageButton) {
            //     h = h.concat(makeCheckboxButton('Lineage', CUSTOM_DATA_1_CB, 'to show/hide lineage information'));
            // }
            // if (_settings.showMutationsButton) {
            //    h = h.concat(makeCheckboxButton('Mutations', CUSTOM_DATA_2_CB, 'to show/hide mutation information'));
            // }
            if (_basicTreeProperties.confidences) {
                h = h.concat(makeCheckboxButton('Confidence', CONFIDENCE_VALUES_CB, 'to show/hide confidence values'));
            }
            if (_basicTreeProperties.branchLengths) {
                h = h.concat(makeCheckboxButton('Branch Length', BRANCH_LENGTH_VALUES_CB, 'to show/hide branch length values'));
            }
            if (_basicTreeProperties.nodeEvents) {
                h = h.concat(makeCheckboxButton('Node Events', NODE_EVENTS_CB, 'to show speciations and duplications as colored nodes (e.g. speciations green, duplications red)'));
            }
            if (_basicTreeProperties.branchEvents) {
                h = h.concat(makeCheckboxButton('Branch Events', BRANCH_EVENTS_CB, 'to show/hide branch events (e.g. mutations)'));
            }
            h = h.concat(makeCheckboxButton('External Labels', EXTERNAL_LABEL_CB, 'to show/hide external node labels'));
            if (_basicTreeProperties.internalNodeData) {
                h = h.concat(makeCheckboxButton('Internal Labels', INTERNAL_LABEL_CB, 'to show/hide internal node labels'));
            }
            h = h.concat(makeCheckboxButton('External Nodes', EXTERNAL_NODES_CB, 'to show external nodes as shapes (usually circles)'));
            h = h.concat(makeCheckboxButton('Internal Nodes', INTERNAL_NODES_CB, 'to show internal nodes as shapes (usually circles)'));

            if (_settings.showBranchColorsButton) {
                h = h.concat(makeCheckboxButton('Branch Colors', BRANCH_COLORS_CB, 'to use/ignore branch colors (if present in tree file)'));
            }
            if (_settings.enableNodeVisualizations) {
                h = h.concat(makeCheckboxButton('Node Vis', NODE_VIS_CB, 'to show/hide node visualizations (colors, shapes, sizes), set with the Visualizations sub-menu'));
            }
            if (_settings.enableBranchVisualizations) {
                h = h.concat(makeCheckboxButton('Branch Vis', BRANCH_VIS_CB, 'to show/hide branch visualizations, set with the Visualizations sub-menu'));
            }
            if (_settings.showDynahideButton) {
                h = h.concat(makeCheckboxButton('Dyna Hide', DYNAHIDE_CB, 'to hide external labels depending on expected visibility'));
            }
            if (_settings.showShortenNodeNamesButton) {
                h = h.concat(makeCheckboxButton('Short Names', SHORTEN_NODE_NAME_CB, 'to shorten long node names'));
            }
            h = h.concat('</div>');
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
            h = h.concat(makeButton('F', ZOOM_TO_FIT, 'fit and center tree display (Alt+C, Home, or Esc to re-position controls as well)'));
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
            h = h.concat(makeButton('U', UNCOLLAPSE_ALL_BUTTON, 'uncollapse all (Alt+U)'));
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
            h = h.concat(makeSlider('External label size:', EXTERNAL_FONT_SIZE_SLIDER));
            if (_basicTreeProperties.internalNodeData) {
                h = h.concat(makeSlider('Internal label size:', INTERNAL_FONT_SIZE_SLIDER));
            }
            if (_basicTreeProperties.branchLengths || _basicTreeProperties.confidences
                || _basicTreeProperties.branchEvents) {
                h = h.concat(makeSlider('Branch label size:', BRANCH_DATA_FONT_SIZE_SLIDER));
            }
            h = h.concat(makeSlider('Node size:', NODE_SIZE_SLIDER));
            h = h.concat(makeSlider('Branch width:', BRANCH_WIDTH_SLIDER));
            h = h.concat('</fieldset>');
            return h;
        }

        function makeAutoCollapse() {
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Collapse Depth</legend>');
            h = h.concat(makeButton('-', DECR_DEPTH_COLLAPSE_LEVEL, 'to decrease the depth threshold (wraps around) (Alt+A)'));
            h = h.concat(makeTextInput(DEPTH_COLLAPSE_LABEL, 'the current depth threshold'));
            h = h.concat(makeButton('+', INCR_DEPTH_COLLAPSE_LEVEL, 'to increase the depth threshold (wraps around) (Alt+S)'));
            h = h.concat('</fieldset>');
            if (_settings.enableCollapseByBranchLenghts && _basicTreeProperties.branchLengths) {
                h = h.concat('<fieldset>');
                h = h.concat('<legend>Collapse Length</legend>');
                h = h.concat(makeButton('-', DECR_BL_COLLAPSE_LEVEL, 'to decrease the maximal subtree branch length threshold (wraps around)'));
                h = h.concat(makeTextInput(BL_COLLAPSE_LABEL, 'the current maximal subtree branch length threshold'));
                h = h.concat(makeButton('+', INCR_BL_COLLAPSE_LEVEL, 'to increase the maximal subtree branch length threshold (wraps around)'));
                h = h.concat('</fieldset>');
            }


            if (_settings.enableCollapseByFeature) {
                h = h.concat('<fieldset>');
                h = h.concat('<legend>Collapse Feature</legend>');
                h = h.concat('<select name="' + COLLAPSE_BY_FEATURE_SELECT + '" id="' + COLLAPSE_BY_FEATURE_SELECT + '">');
                h = h.concat('<option value="' + OFF_FEATURE + '">' + OFF_FEATURE + '</option>');
                if (_basicTreeProperties.taxonomies) {
                    h = h.concat('<option value="' + SPECIES_FEATURE + '">' + SPECIES_FEATURE + '</option>');
                }
                let refs = forester.collectPropertyRefs(_treeData, 'node', false);
                if (refs) {
                    refs.forEach(function (v) {
                        let label = v;
                        label = label.replace(/^.+:/, '');
                        if (!_settings.propertiesToIgnoreForNodeVisualization || (_settings.propertiesToIgnoreForNodeVisualization.indexOf(label) < 0)) {
                            if (label.length > (MAX_LENGTH_FOR_COLLAPSE_BY_FEATURE_LABEL + 2)) {
                                label = label.substring(0, MAX_LENGTH_FOR_COLLAPSE_BY_FEATURE_LABEL) + "..";
                            }
                            h = h.concat('<option value="' + v + '">' + label + '</option>');
                        }
                    });
                }
                h = h.concat('</select>');
                h = h.concat('</fieldset>');
            }
            return h;
        }

        // --------------------------------------------------------------
        // Functions to make search-related elements
        // --------------------------------------------------------------
        function makeSearchBoxes() {

            let tooltip = "enter text to search for (use ',' for logical OR and '+' for logical AND," +
                " use expressions in form of XX:term for typed search -- e.g. NN:node name, TC:taxonomy code," +
                " TS:taxonomy scientific name, SN:sequence name, GN:gene name, SS:sequence symbol, MS:molecular sequence, ...)";
            let h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Search</legend>');
            h = h.concat(makeTextInput(SEARCH_FIELD_0, tooltip));
            h = h.concat(makeButton('R', RESET_SEARCH_A_BTN, RESET_SEARCH_A_BTN_TOOLTIP));
            h = h.concat('<br>');
            h = h.concat(makeTextInput(SEARCH_FIELD_1, tooltip));
            h = h.concat(makeButton('R', RESET_SEARCH_B_BTN, RESET_SEARCH_B_BTN_TOOLTIP));
            h = h.concat('<br>');
            h = h.concat(makeSearchControlsCompact());
            h = h.concat('</fieldset>');
            return h;
        }

        function makeSearchControls() {
            let h = "";
            h = h.concat('<div class="' + SEARCH_OPTIONS_GROUP + '">');
            h = h.concat(makeCheckboxButton('Cas', SEARCH_OPTIONS_CASE_SENSITIVE_CB, 'to search in a case-sensitive manner'));
            h = h.concat(makeCheckboxButton('Wrd', SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB, ' to match complete terms (separated by spaces) only (does not apply to regular expression search)'));
            h = h.concat('</div>');
            h = h.concat('<br>');
            h = h.concat('<div class="' + SEARCH_OPTIONS_GROUP + '">');
            h = h.concat(makeCheckboxButton('Reg', SEARCH_OPTIONS_REGEX_CB, 'to search with regular expressions'));
            if (_settings.showSearchPropertiesButton === true) {
                h = h.concat(makeCheckboxButton('Prp', SEARCH_OPTIONS_PROPERTIES_CB, 'to search (hidden) properties'));
            }
            h = h.concat(makeCheckboxButton('Neg', SEARCH_OPTIONS_NEGATE_RES_CB, 'to invert (negate) the search results'));
            h = h.concat('</div>');
            return h;
        }

        function makeSearchControlsCompact() {
            let h = "";
            h = h.concat('<div class="' + SEARCH_OPTIONS_GROUP + '">');
            h = h.concat(makeCheckboxButton('C', SEARCH_OPTIONS_CASE_SENSITIVE_CB, 'to search in a case-sensitive manner'));
            h = h.concat(makeCheckboxButton('W', SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB, ' to match complete terms (separated by spaces or underscores) only (does not apply to regular expression search)'));
            h = h.concat(makeCheckboxButton('R', SEARCH_OPTIONS_REGEX_CB, 'to search with regular expressions'));
            if (_settings.showSearchPropertiesButton === true) {
                h = h.concat(makeCheckboxButton('P', SEARCH_OPTIONS_PROPERTIES_CB, 'to search (hidden) properties'));
            }
            h = h.concat(makeCheckboxButton('N', SEARCH_OPTIONS_NEGATE_RES_CB, 'to invert (negate) the search results'));
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

        function makeCheckboxButton(label, id, tooltip) {
            return '<label for="' + id + '" title="' + tooltip + '">' + label + '</label><input type="checkbox" name="' + id + '" id="' + id + '">';
        }

        function makeRadioButton(label, id, radioGroup, tooltip) {
            return '<label for="' + id + '" title="' + tooltip + '">' + label + '</label><input type="radio" name="' + radioGroup + '" id="' + id + '">';
        }

        function makeSelectMenu(label, sep, id, tooltip) {
            return '<label for="' + id + '" title="' + tooltip + '">' + label + '</label>' + sep + '<select name="' + id + '" id="' + id + '"></select>';
        }

        function makeSlider(label, id) {
            if (label) {
                return label + '<div id="' + id + '"></div>';
            }
            return '<div id="' + id + '"></div>';
        }

        function makeTextInput(id, tooltip) {
            return '<input title="' + tooltip + '" type="text" name="' + id + '" id="' + id + '">';
        }

        function makeTextInputWithLabel(label, sep, id, tooltip) {
            return label + sep + '<input title="' + tooltip + '" type="text" name="' + id + '" id="' + id + '">';
        }

    } // function createGui()

    function initializeGui() {

        setDisplayTypeButtons();

        setCheckboxValue(NODE_NAME_CB, _options.showNodeName);
        setCheckboxValue(TAXONOMY_CB, _options.showTaxonomy);
        setCheckboxValue(SEQUENCE_CB, _options.showSequence)
        setCheckboxValue(HOSTS_CB, _options.showHosts);
        setCheckboxValue(CUSTOM_DATA_1_CB, _options.showLineage);
        setCheckboxValue(CUSTOM_DATA_2_CB, _options.showMutations);
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

        $('select#' + NODE_FILL_COLOR_SELECT_MENU).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );

        $('select#' + NODE_SHAPE_SELECT_MENU).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );
        $('select#' + NODE_SIZE_SELECT_MENU).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );
        $('select#' + LABEL_COLOR_SELECT_MENU).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );

        $('select#' + NODE_FILL_COLOR_SELECT_MENU_2).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );
        $('select#' + LABEL_COLOR_SELECT_MENU_2).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );

        $('select#' + NODE_FILL_COLOR_SELECT_MENU_3).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );

        $('select#' + LABEL_COLOR_SELECT_MENU_3).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );

        $('select#' + NODE_FILL_COLOR_SELECT_MENU_4).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );

        $('select#' + LABEL_COLOR_SELECT_MENU_4).append($('<option>')
            .val(DEFAULT)
            .html('default')
        );

        //

        if (_visualizations) {
            if (_visualizations.labelColor) {
                for (let key in _visualizations.labelColor) {
                    if (_visualizations.labelColor.hasOwnProperty(key)) {
                        $('select#' + LABEL_COLOR_SELECT_MENU).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                    }
                }
            }
            if (_visualizations.nodeShape) {
                for (let key in _visualizations.nodeShape) {
                    if (_visualizations.nodeShape.hasOwnProperty(key)) {
                        $('select#' + NODE_SHAPE_SELECT_MENU).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                    }
                }
            }
            if (_visualizations.nodeFillColor) {
                for (let key in _visualizations.nodeFillColor) {
                    if (_visualizations.nodeFillColor.hasOwnProperty(key)) {
                        $('select#' + NODE_FILL_COLOR_SELECT_MENU).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                    }
                }
            }
            if (_visualizations.nodeBorderColor) {
                for (let key in _visualizations.nodeBorderColor) {
                    if (_visualizations.nodeBorderColor.hasOwnProperty(key)) {
                        $('select#' + NODE_BORDER_COLOR_SELECT_MENU).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                    }
                }
            }
            if (_visualizations.nodeSize) {
                for (let key in _visualizations.nodeSize) {
                    if (_visualizations.nodeSize.hasOwnProperty(key)) {
                        $('select#' + NODE_SIZE_SELECT_MENU).append($('<option>')
                            .val(key)
                            .html(key)
                        );
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
                        $('select#' + LABEL_COLOR_SELECT_MENU_2).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                        $('select#' + NODE_FILL_COLOR_SELECT_MENU_2).append($('<option>')
                            .val(key)
                            .html(key)
                        );
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
                        $('select#' + LABEL_COLOR_SELECT_MENU_3).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                        $('select#' + NODE_FILL_COLOR_SELECT_MENU_3).append($('<option>')
                            .val(key)
                            .html(key)
                        );
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
                        $('select#' + LABEL_COLOR_SELECT_MENU_4).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                        $('select#' + NODE_FILL_COLOR_SELECT_MENU_4).append($('<option>')
                            .val(key)
                            .html(key)
                        );
                    }
                }
            }
        }


        $('#' + MSA_RESIDUE_VIS_CURR_RES_POS_SLIDER_1).slider({
            min: 1,
            max: _basicTreeProperties.maxMolSeqLength,
            step: 1,
            value: 1,
            animate: 'fast',
            slide: updateMsaResidueVisCurrResPosFromSlider,
            change: updateMsaResidueVisCurrResPosFromSlider
        });

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
            $('#' + SEARCH_FIELD_0).val(_options.searchAinitialValue);
        }
        if (_options.searchBinitialValue) {
            $('#' + SEARCH_FIELD_1).val(_options.searchBinitialValue);
        }
    }


    function initializeInitialVisualization() {
        if (_options.initialNodeFillColorVisualization
            && _options.initialNodeFillColorVisualization !== DEFAULT
            && _visualizations.nodeFillColor[_options.initialNodeFillColorVisualization] != null) {
            _currentNodeFillColorVisualization = _options.initialNodeFillColorVisualization;
            setSelectMenuValue(NODE_FILL_COLOR_SELECT_MENU, _currentNodeFillColorVisualization);
            addLegend(LEGEND_NODE_FILL_COLOR, _visualizations.nodeFillColor[_currentNodeFillColorVisualization]);
            _options.showExternalNodes = true;
            setCheckboxValue(EXTERNAL_NODES_CB, true);
        }
        if (_options.initialLabelColorVisualization
            && _options.initialLabelColorVisualization !== DEFAULT
            && _visualizations.labelColor[_options.initialLabelColorVisualization] != null) {
            _currentLabelColorVisualization = _options.initialLabelColorVisualization;
            setSelectMenuValue(LABEL_COLOR_SELECT_MENU, _currentLabelColorVisualization);
            addLegend(LEGEND_LABEL_COLOR, _visualizations.labelColor[_currentLabelColorVisualization]);
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
        if (!_basicTreeProperties.branchLengths) {
            disableCheckbox('#' + PHYLOGRAM_BUTTON);
            disableCheckbox('#' + PHYLOGRAM_ALIGNED_BUTTON);
        }
    }

    function unCollapseAll(node) {
        forester.preOrderTraversal(node, function (n) {
            if (n._children) {
                n.children = n._children;
                n._children = null;
            }
            if (n[KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL]) {
                n[KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL] = undefined;
            }
        });
    }

    function decrDepthCollapseLevel() {
        _rank_collapse_level = -1;
        _branch_length_collapse_level = -1;
        resetCollapseByFeature();
        if (_root && _treeData && (_external_nodes > 2)) {
            if (_depth_collapse_level <= 1) {
                _depth_collapse_level = forester.calcMaxDepth(_root);
                unCollapseAll(_root);
            } else {
                --_depth_collapse_level;
                forester.collapseToDepth(_root, _depth_collapse_level);
            }
        }
        update(null, 0);
    }

    function incrDepthCollapseLevel() {
        _rank_collapse_level = -1;
        _branch_length_collapse_level = -1;
        resetCollapseByFeature();
        if ((_root && _treeData) && (_external_nodes > 2)) {
            let max = forester.calcMaxDepth(_root);
            if (_depth_collapse_level >= max) {
                _depth_collapse_level = 1;
            } else {
                unCollapseAll(_root);
                ++_depth_collapse_level;
            }
            forester.collapseToDepth(_root, _depth_collapse_level);
        }
        update(null, 0);
    }

    function decrBlCollapseLevel() {
        _rank_collapse_level = -1;
        _depth_collapse_level = -1;
        resetCollapseByFeature();
        if (_root && _treeData && (_external_nodes > 2)) {
            if (_branch_length_collapse_level <= _branch_length_collapse_data.min) {
                _branch_length_collapse_level = _branch_length_collapse_data.max;
            }
            _branch_length_collapse_level -= _branch_length_collapse_data.step;
            forester.collapseToBranchLength(_root, _branch_length_collapse_level);
        }
        update(null, 0);
    }

    function incrBlCollapseLevel() {
        _rank_collapse_level = -1;
        _depth_collapse_level = -1;
        resetCollapseByFeature();
        if ((_root && _treeData) && (_external_nodes > 2)) {
            if (_branch_length_collapse_level >= _branch_length_collapse_data.max
                || _branch_length_collapse_level < 0) {
                _branch_length_collapse_level = _branch_length_collapse_data.min;
            }
            _branch_length_collapse_level += _branch_length_collapse_data.step;
            if (_branch_length_collapse_level >= _branch_length_collapse_data.max) {
                unCollapseAll(_root);
            } else {
                forester.collapseToBranchLength(_root, _branch_length_collapse_level);
            }
        }
        update(null, 0);
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

        if ((_currentLabelColorVisualization == null || _currentLabelColorVisualization === DEFAULT)
            && (_currentNodeFillColorVisualization !== MSA_RESIDUE)
            && (_currentNodeBorderColorVisualization !== MSA_RESIDUE)
            && (_currentNodeShapeVisualization !== MSA_RESIDUE)
            && isCanDoMsaResidueVisualizations()) {

            _currentLabelColorVisualization = MSA_RESIDUE;
            $('#' + LABEL_COLOR_SELECT_MENU).val(MSA_RESIDUE);
            addLegend(LEGEND_LABEL_COLOR, _visualizations.labelColor[_currentLabelColorVisualization]);
            if (_settings.enableBranchVisualizations) {
                _options.showBranchVisualizations = true;
                setCheckboxValue(BRANCH_VIS_CB, _options.showBranchVisualizations);
            }
        } else if ((_currentLabelColorVisualization !== MSA_RESIDUE)
            && (_currentNodeFillColorVisualization == null || _currentNodeFillColorVisualization === DEFAULT)
            && (_currentNodeBorderColorVisualization !== MSA_RESIDUE)
            && (_currentNodeShapeVisualization !== MSA_RESIDUE)
            && isCanDoMsaResidueVisualizations()) {
            _currentNodeFillColorVisualization = MSA_RESIDUE;
            $('#' + NODE_FILL_COLOR_SELECT_MENU).val(MSA_RESIDUE);
            addLegend(LEGEND_NODE_FILL_COLOR, _visualizations.nodeFillColor[_currentNodeFillColorVisualization]);
            if (_settings.enableBranchVisualizations) {
                _options.showBranchVisualizations = true;
                setCheckboxValue(BRANCH_VIS_CB, _options.showBranchVisualizations);
            }
        } else if ((_currentLabelColorVisualization !== MSA_RESIDUE)
            && (_currentNodeFillColorVisualization !== MSA_RESIDUE)
            && (_currentNodeBorderColorVisualization == null || _currentNodeBorderColorVisualization === DEFAULT)
            && (_currentNodeShapeVisualization !== MSA_RESIDUE)
            && isCanDoMsaResidueVisualizations()) {
            _currentNodeBorderColorVisualization = MSA_RESIDUE;
            $('#' + NODE_BORDER_COLOR_SELECT_MENU).val(MSA_RESIDUE);
            addLegend(LEGEND_NODE_BORDER_COLOR, _visualizations.nodeBorderColor[_currentNodeBorderColorVisualization]);
            if (_settings.enableBranchVisualizations) {
                _options.showBranchVisualizations = true;
                setCheckboxValue(BRANCH_VIS_CB, _options.showBranchVisualizations);
            }
        } else if ((_currentLabelColorVisualization !== MSA_RESIDUE)
            && (_currentNodeFillColorVisualization !== MSA_RESIDUE)
            && (_currentNodeBorderColorVisualization !== MSA_RESIDUE)
            && (_currentNodeShapeVisualization == null || _currentNodeShapeVisualization === DEFAULT)
            && isCanDoMsaResidueVisualizations()) {
            _currentNodeShapeVisualization = MSA_RESIDUE;
            $('#' + NODE_SHAPE_SELECT_MENU).val(MSA_RESIDUE);
            addLegend(LEGEND_NODE_SHAPE, _visualizations.nodeShape[_currentNodeShapeVisualization]);
        }
    }


    function updateDepthCollapseDepthDisplay() {
        let v = obtainDepthCollapseDepthValue();
        $('#' + DEPTH_COLLAPSE_LABEL)
            .val(" " + v);
    }

    function updateBranchLengthCollapseBranchLengthDisplay() {
        let v = obtainBranchLengthCollapseBranchLengthValue();
        $('#' + BL_COLLAPSE_LABEL)
            .val(v);
    }

    function collapseByFeature(feature) {
        _rank_collapse_level = -1;
        _depth_collapse_level = -1;
        _branch_length_collapse_level = -1;
        if (feature === SPECIES_FEATURE) {
            collapseSpecificSubtrees(_root, null, KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL);
        } else if (feature === OFF_FEATURE) {
            unCollapseAll(_root)
        } else {
            collapseSpecificSubtrees(_root, feature, KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL);
        }
        update(null, 0);
    }


    function removeForCollapsedFeatureSpecialLabel(phy, keyForCollapsedFeatureSpecialLabel) {
        forester.preOrderTraversalAll(phy, function (n) {
            if (n[keyForCollapsedFeatureSpecialLabel]) {
                n[keyForCollapsedFeatureSpecialLabel] = undefined;
            }
        });
    }

    function collapseSpecificSubtrees(phy, nodePropertyRef, keyForCollapsedFeatureSpecialLabel) {
        unCollapseAll(phy);

        if (nodePropertyRef && nodePropertyRef.length > 0) {
            forester.preOrderTraversalAll(phy, function (n) {
                if (n.children && !n._children && (n.children.length > 1)) {
                    let pv = forester.getOneDistinctNodePropertyValue(n, nodePropertyRef);
                    if (pv != null) {
                        forester.collapse(n);
                        if (keyForCollapsedFeatureSpecialLabel) {
                            n[keyForCollapsedFeatureSpecialLabel] = '[' + nodePropertyRef + '] ' + pv;
                        }
                    }
                }
            });
        } else {
            forester.preOrderTraversalAll(phy, function (n) {
                if (n.children && !n._children && (n.children.length > 1)) {
                    let tv = forester.getOneDistinctTaxonomy(n);
                    if (tv != null) {
                        forester.collapse(n);
                        if (keyForCollapsedFeatureSpecialLabel) {
                            n[keyForCollapsedFeatureSpecialLabel] = tv;
                        }
                    }
                }
            });
        }

    }

    function resetCollapseByFeature() {
        let s = $('#' + COLLAPSE_BY_FEATURE_SELECT);
        if (s) {
            let f = s.val();
            if (f !== OFF_FEATURE) {
                s.val(OFF_FEATURE);
                removeForCollapsedFeatureSpecialLabel(_root, KEY_FOR_COLLAPSED_FEATURES_SPECIAL_LABEL);
            }
        }
    }

    function updateMsaResidueVisCurrResPosLabel() {
        $('#' + MSA_RESIDUE_VIS_CURR_RES_POS_LABEL).val(_msa_residue_vis_curr_res_pos + 1);
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
        if (_in_subtree) { //~~
            enableButton($('#' + RETURN_TO_SUPERTREE_BUTTON_BY_ONE));
            enableButton($('#' + RETURN_TO_SUPERTREE_BUTTON));
        } else {
            disableButton($('#' + RETURN_TO_SUPERTREE_BUTTON_BY_ONE));
            disableButton($('#' + RETURN_TO_SUPERTREE_BUTTON));
        }

        if (forester.isHasCollapsedNodes(_root)) {
            enableButton($('#' + UNCOLLAPSE_ALL_BUTTON));
        } else {
            disableButton($('#' + UNCOLLAPSE_ALL_BUTTON));
        }
        if (!_in_subtree && ((_treeData.rerootable === undefined) || (_treeData.rerootable === true))) {
            enableButton($('#' + MIDPOINT_ROOT_BUTTON));
        } else {
            disableButton($('#' + MIDPOINT_ROOT_BUTTON));
        }
        let b;
        if (_foundNodes0 && !_searchBox0Empty) {
            b = $('#' + RESET_SEARCH_A_BTN);
            if (b) {
                b.prop('disabled', false);
                if (_foundNodes0.size < 1) {
                    b.css('background', '');
                    b.css('color', '');
                } else {
                    b.css('background', _options.found0ColorDefault);
                    b.css('color', WHITE);
                }
                let nd0 = _foundNodes0.size === 1 ? 'node' : 'nodes';
                b.prop('title', 'found ' + _foundNodes0.size + ' ' + nd0 + ' [click to ' + RESET_SEARCH_A_BTN_TOOLTIP + ']');
            }
        } else {
            b = $('#' + RESET_SEARCH_A_BTN);
            if (b) {
                b.prop('disabled', true);
                b.css('background', _settings.controlsBackgroundColor);
                b.css('color', '');
                b.prop('title', RESET_SEARCH_A_BTN_TOOLTIP);
            }
        }

        if (_foundNodes1 && !_searchBox1Empty) {
            b = $('#' + RESET_SEARCH_B_BTN);
            if (b) {
                b.prop('disabled', false);
                if (_foundNodes1.size < 1) {
                    b.css('background', '');
                    b.css('color', '');
                } else {
                    b.css('background', _options.found1ColorDefault);
                    b.css('color', WHITE);
                }
                let nd1 = _foundNodes1.size === 1 ? 'node' : 'nodes';
                b.prop('title', 'found ' + _foundNodes1.size + ' ' + nd1 + ' [click to ' + RESET_SEARCH_B_BTN_TOOLTIP + ']');
            }
        } else {
            b = $('#' + RESET_SEARCH_B_BTN);
            if (b) {
                b.prop('disabled', true);
                b.css('background', _settings.controlsBackgroundColor);
                b.css('color', '');
                b.prop('title', RESET_SEARCH_B_BTN_TOOLTIP);
            }
        }
    }

    function updateLegendButtonEnabledState() {
        let b = $('#' + LEGENDS_SHOW_BTN);
        if (b) {
            if (_showLegends) {
                b.css('background', COLOR_FOR_ACTIVE_ELEMENTS);
                b.css('color', WHITE);
            } else {
                b.css('background', '');
                b.css('color', '');
            }
        }
        if (_showLegends && (_legendColorScales[LEGEND_LABEL_COLOR] ||
            (_options.showNodeVisualizations && (_legendColorScales[LEGEND_NODE_FILL_COLOR] ||
                _legendColorScales[LEGEND_NODE_BORDER_COLOR] ||
                _legendShapeScales[LEGEND_NODE_SHAPE] ||
                _legendSizeScales[LEGEND_NODE_SIZE])))) {
            enableButton($('#' + LEGENDS_HORIZ_VERT_BTN));
            enableButton($('#' + LEGENDS_MOVE_UP_BTN));
            enableButton($('#' + LEGENDS_MOVE_DOWN_BTN));
            enableButton($('#' + LEGENDS_MOVE_LEFT_BTN));
            enableButton($('#' + LEGENDS_MOVE_RIGHT_BTN));
            enableButton($('#' + LEGENDS_RESET_BTN));
        } else {
            disableButton($('#' + LEGENDS_HORIZ_VERT_BTN));
            disableButton($('#' + LEGENDS_MOVE_UP_BTN));
            disableButton($('#' + LEGENDS_MOVE_DOWN_BTN));
            disableButton($('#' + LEGENDS_MOVE_LEFT_BTN));
            disableButton($('#' + LEGENDS_MOVE_RIGHT_BTN));
            disableButton($('#' + LEGENDS_RESET_BTN));
        }
    }

    function disableCheckbox(cb) {
        if (cb) {
            let b = $(cb);
            if (b) {
                b.checkboxradio({
                    disabled: true
                });
            }
        }
    }

    function disableButton(b) {
        if (b) {
            b.prop('disabled', true);
            b.css('background', _settings.controlsBackgroundColor);
        }
    }

    function enableButton(b) {
        if (b) {
            b.prop('disabled', false);
            b.css('background', '');
        }
    }

    function obtainDepthCollapseDepthValue() {
        if (!(_treeData && _root)) {
            return "";
        }
        if (_external_nodes < 3) {
            return "off";
        } else if (_depth_collapse_level < 0) {
            _depth_collapse_level = forester.calcMaxDepth(_root);
            return "off";
        } else if (_depth_collapse_level === forester.calcMaxDepth(_root)) {
            return "off";
        }
        return _depth_collapse_level;
    }

    function obtainBranchLengthCollapseBranchLengthValue() {
        if (!(_treeData && _root)) {
            return "";
        }
        if (!_branch_length_collapse_data.min) {
            resetBranchLengthCollapseValue();
        }

        if (_external_nodes < 3) {
            return "off";
        } else if (_branch_length_collapse_level <= _branch_length_collapse_data.min) {
            return "off";
        } else if (_branch_length_collapse_level >= _branch_length_collapse_data.max) {
            return "off";
        }
        return _branch_length_collapse_level;
    }


    function resetDepthCollapseDepthValue() {
        _depth_collapse_level = -1;
    }

    function resetRankCollapseRankValue() {
        _rank_collapse_level = -1;
    }

    function resetBranchLengthCollapseValue() {
        _branch_length_collapse_level = -1;
        _branch_length_collapse_data.min = Number.MAX_VALUE;
        _branch_length_collapse_data.max = 0;

        if (_root) {
            forester.removeMaxBranchLength(_root);
            let stats = forester.calcBranchLengthSimpleStatistics(_root);
            _branch_length_collapse_data.min = stats.min;
            _branch_length_collapse_data.max = stats.max;
            _branch_length_collapse_data.max = 0.25 * ((3 * _branch_length_collapse_data.max) + _branch_length_collapse_data.min);
            let x = stats.n < 200 ? (stats.n / 4) : 50;
            _branch_length_collapse_data.step = (_branch_length_collapse_data.max - _branch_length_collapse_data.min) / x;

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
        }
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

    function downloadAsPdf() {
    }

    function downloadAsPng() {
        let svg = getTreeAsSvg();
        let canvas = document.createElement('canvas');
        canvg(canvas, svg);
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
    archaeopteryx.parseTree = function (location,
                                        data,
                                        newHamphshireConfidenceValuesInBrackets,
                                        newHamphshireConfidenceValuesAsInternalNames) {
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
            tree = archaeopteryx.parseNewHampshire(data,
                newHamphshireConfidenceValuesInBrackets,
                newHamphshireConfidenceValuesAsInternalNames);
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
    archaeopteryx.launchArchaeopteryx = function (label,
                                                  location,
                                                  data,
                                                  options,
                                                  settings,
                                                  newHamphshireConfidenceValuesInBrackets,
                                                  newHamphshireConfidenceValuesAsInternalNames,
                                                  nodeVisualizations) {
        let tree = null;
        try {
            tree = archaeopteryx.parseTree(location,
                data,
                newHamphshireConfidenceValuesInBrackets,
                newHamphshireConfidenceValuesAsInternalNames);
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
    if (typeof module !== 'undefined' && module.exports && !global.xmldocAssumeBrowser)
        module.exports.archaeopteryx = archaeopteryx;
    else if (typeof window !== "undefined")
        window.archaeopteryx = archaeopteryx;
    else
        this.archaeopteryx = archaeopteryx;
})
();