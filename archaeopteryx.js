/**
 *  Copyright (C) 2016 Christian M. Zmasek
 *  Copyright (C) 2016 J. Craig Venter Institute
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
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA
 *
 */

// v 0_60

if (!d3) {
    throw "no d3.js";
}

if (!forester) {
    throw "no forester.js";
}

if (!phyloXmlParser) {
    throw "no phyloxml_parser.js";
}
(function archaeopteryx() {

    "use strict";

    var TRANSITION_DURATION_DEFAULT = 750;
    var PHYLOGRAM_DEFAULT = false;
    var ROOTOFFSET_DEFAULT = 30;
    var DISPLAY_WIDTH_DEFAULT = 800;
    var VIEWERHEIGHT_DEFAULT = 600;
    var MENU_FONT_SIZE_DEFAULT = '9px';
    var RECENTER_AFTER_COLLAPSE_DEFAULT = false;
    var BRANCH_LENGTH_DIGITS_DEFAULT = 4;
    var CONFIDENCE_VALUE_DIGITS_DEFAULT = 2;
    var ZOOM_INTERVAL = 200;
    var BUTTON_ZOOM_IN_FACTOR = 1.1;
    var BUTTON_ZOOM_OUT_FACTOR = 1 / BUTTON_ZOOM_IN_FACTOR;
    var BUTTON_ZOOM_IN_FACTOR_SLOW = 1.05;
    var BUTTON_ZOOM_OUT_FACTOR_SLOW = 1 / BUTTON_ZOOM_IN_FACTOR_SLOW;

    var NODE_SIZE_MAX = 9;
    var NODE_SIZE_MIN = 1;
    var BRANCH_WIDTH_MAX = 9;
    var BRANCH_WIDTH_MIN = 0.5;
    var FONT_SIZE_MAX = 26;
    var FONT_SIZE_MIN = 2;
    var SLIDER_STEP = 0.5;

    var CONTROLS_0 = 'controls0';
    var CONTROLS_1 = 'controls1';

    var PHYLOGRAM_BUTTON = 'phy_b';
    var CLADOGRAM_BUTTON = 'cla_b';

    var PHYLOGRAM_CLADOGRAM_CONTROLGROUP = 'phy_cla_g';
    var DISPLAY_DATA_CONTROLGROUP = 'display_data_g';


    var ALIGN_PHYLOGRAM_CB = 'al_cb';
    var NODE_NAME_CB = 'nn_cb';
    var TAXONOMY_CB = 'tax_cb';
    var SEQUENCE_CB = 'seq_cb';
    var CONFIDENCE_VALUES_CB = 'conf_cb';
    var BRANCH_LENGTH_VALUES_CB = 'bl_cb';
    var INTERNAL_LABEL_CB = 'intl_cb';
    var EXTERNAL_LABEL_CB = 'extl_cb';
    var INTERNAL_NODES_CB = 'intn_cb';
    var EXTERNAL_NODES_CB = 'extn_cb';
    var NODE_VIS_CB = 'nodevis_cb';

    var ZOOM_IN_Y = 'zoomout_y';
    var ZOOM_OUT_Y = 'zoomin_y';
    var ZOOM_IN_X = 'zoomin_x';
    var ZOOM_OUT_X = 'zoomout_x';
    var ZOOM_TO_FIT = 'zoomtofit';

    var INTERNAL_FONT_SIZE_SLIDER = 'intfs_sl';
    var EXTERNAL_FONT_SIZE_SLIDER = 'entfs_sl';
    var BRANCH_DATA_FONT_SIZE_SLIDER = 'bdfs_sl';
    var BRANCH_WIDTH_SLIDER = 'bw_sl';
    var NODE_SIZE_SLIDER = 'ns_sl';


    var ORDER_BUTTON = 'ord_b';
    var RETURN_TO_SUPERTREE_BUTTON = 'ret_b';
    var UNCOLLAPSE_ALL_BUTTON = 'unc_b';

    var SEARCH_FIELD_0 = 'sf0';
    var SEARCH_FIELD_1 = 'sf1';

    var DECR_DEPTH_COLLAPSE_LEVEL = 'decr_dcl';
    var INCR_DEPTH_COLLAPSE_LEVEL = 'incr_dcl';
    var DECR_BL_COLLAPSE_LEVEL = 'decr_blcl';
    var INCR_BL_COLLAPSE_LEVEL = 'incr_blcl';
    var DEPTH_COLLAPSE_LABEL = 'depth_col_label';
    var BL_COLLAPSE_LABEL = 'bl_col_label';

    var NODE_SHAPE_SELECT_MENU = 'nshapes_menu';
    var NODE_FILL_COLOR_SELECT_MENU = 'nfcolors_menu';
    var NODE_BORDER_COLOR_SELECT_MENU = 'nbcolors_menu';
    var NODE_SIZE_SELECT_MENU = 'nsizes_menu';
    var LABEL_COLOR_SELECT_MENU = 'lcs_menu';

    var VISUAL_CONTROLS = 'visual_controls';

    var SEARCH_OPTIONS = 'search_options';
    var SEARCH_OPTIONS_GROUP = 'search_opts_g';
    var SEARCH_OPTIONS_CASE_SENSITIVE_CB = 'so_cs_cb';
    var SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB = 'so_cto_cb';
    var SEARCH_OPTIONS_REGEX_CB = 'so_regex_cb';
    var SEARCH_OPTIONS_NEGATE_RES_CB = 'so_neg_cb';

    var NONE = 'none';
    var DEFAULT = 'default';
    var SAME_AS_FILL = 'sameasfill';

    var VK_O = 79;
    var VK_R = 82;
    var VK_U = 85;
    var VK_P = 80;
    var VK_A = 65;
    var VK_S = 83;
    var VK_L = 76;
    var VK_C = 67;
    var VK_DELETE = 46;
    var VK_BACKSPACE = 8;
    var VK_HOME = 36;
    var VK_UP = 38;
    var VK_DOWN = 40;
    var VK_LEFT = 37;
    var VK_RIGHT = 39;
    var VK_PLUS = 187;
    var VK_MINUS = 189;
    var VK_PLUS_N = 107;
    var VK_MINUS_N = 109;
    var VK_PAGE_UP = 33;
    var VK_PAGE_DOWN = 34;


    // "Instance variables"
    var _root = null;
    var _svgGroup = null;
    var _baseSvg = null;
    var _treeFn = null;
    var _superTreeRoots = [];
    var _treeData = null;
    var _options = null;
    var _settings = null;
    var _maxLabelLength = 0;
    var _i = 0;
    var _zoomListener = null;
    var _yScale = null;
    var _foundNodes0 = new Set();
    var _foundNodes1 = new Set();
    var _searchBox0Empty = true;
    var _searchBox1Empty = true;
    var _displayWidth = 0;
    var _displayHeight = 0;
    var _intervalId = 0;
    var _currentLabelColorVisualization = null;
    var _currentNodeShapeVisualization = null;
    var _currentNodeFillColorVisualization = null;
    var _currentNodeBorderColorVisualization = null;
    var _currentNodeSizeVisualization = null;
    var _dynahide_counter = 0;
    var _dynahide_factor = 0;
    var _basicTreeProperties = null;
    var _depth_collapse_level = -1;
    var _rank_collapse_level = -1;
    var _branch_length_collapse_level = -1;
    var _branch_length_collapse_data = {};
    var _external_nodes = 0;
    var _w = null;
    var _visualizations = null;


    function branchLengthScaling(nodes, width) {

        if (_root.parent) {
            _root.parent.distToRoot = 0;
        }
        forester.preOrderTraversalAll(_root, function (n) {
            n.distToRoot = (n.parent ? n.parent.distToRoot : 0) + bl(n);
        });
        var distsToRoot = nodes.map(function (n) {
            return n.distToRoot;
        });

        var yScale = d3.scale.linear()
            .domain([0, d3.max(distsToRoot)])
            .range([0, width]);
        forester.preOrderTraversalAll(_root, function (n) {
            n.y = yScale(n.distToRoot)
        });
        return yScale;

        function bl(node) {
            if (!node.branch_length || node.branch_length < 0) {
                return 0;
            }
            return node.branch_length;
        }
    }

    function zoom() {
        _svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function centerNode(source, x) {
        var scale = _zoomListener.scale();
        if (!x) {
            x = -source.y0;
            x = x * scale + _displayWidth / 2;
        }
        var y = 0;
        d3.select('g').transition()
            .duration(750)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        _zoomListener.scale(scale);
        _zoomListener.translate([x, y]);
    }


    function calcMaxTreeLengthForDisplay() {
        return _settings.rootOffset + _options.nodeLabelGap + ( _maxLabelLength * _options.externalNodeFontSize * 0.8 );
    }

    function createVisualization(label,
                                 description,
                                 field,
                                 cladePropertyRef,
                                 isRegex,
                                 mapping,
                                 mappingFn) {
        if (arguments.length != 7) {
            throw( "expected 7 arguments, got " + arguments.length);
        }

        if (!label) {
            throw( "need to have label");
        }
        var visualization = {};
        visualization.label = label;
        if (description) {
            visualization.description = description;
        }
        if (field) {
            if (cladePropertyRef) {
                throw( "need to have either field or clade property ref");
            }
            visualization.field = field;
        }
        else if (cladePropertyRef) {
            visualization.cladePropertyRef = cladePropertyRef;
        }
        else {
            throw( "need to have either field or clade property ref");
        }
        visualization.isRegex = isRegex;
        if (mapping) {
            visualization.mapping = mapping;
        }
        else if (mappingFn) {
            visualization.mappingFn = mappingFn;
        }
        return visualization;
    }

    function initializeNodeVisualizations(np) {

        var xx = {};
        xx['vipr:country'] = 'Country';
        xx['vipr:host'] = 'Host';
        xx['vipr:year'] = 'Year';

        var years = forester.setToArray(np['vipr:year']);
        var countries = forester.setToArray(np['vipr:country']);
        var hosts = forester.setToArray(np['vipr:host']);
        var yearCol = d3.scale.linear()
            .range(["#FF0000", "#0000FF"])
            .domain(d3.extent(years));

        var yearSize = d3.scale.linear()
            .range([10, 50])
            .domain(d3.extent(years));

        var shapesHost = d3.scale.ordinal()
            .range(['square', 'diamond', 'triangle-up', 'triangle-down', 'cross', 'circle'])
            .domain(hosts);

        var shapesCountry = d3.scale.ordinal()
            .range(['square', 'diamond', 'triangle-up', 'triangle-down', 'cross', 'circle'])
            .domain(countries);

        addNodeShapeVisualization('Country',
            'Country',
            null,
            'vipr:country',
            false,
            null,
            shapesCountry);

        addNodeShapeVisualization('Host',
            'Host',
            null,
            'vipr:host',
            false,
            null,
            shapesHost);

        /*var ds = np['vipr:country'];
         var colors = ["#000000", "#0000FF"];
         var heatmapColor = d3.scale.linear()
         .domain(d3.range(0, 1, 1.0 / (colors.length - 1)))
         .range(colors);
         var c = d3.scale.linear().domain(d3.extent(ds)).range([0,1]);
         var q = d3.extent(ds);
         console.log("q="+q);
         console.log("c=" + c('Algeria'));
         console.log(heatmapColor(0.1));
         console.log(heatmapColor(c('Algeria')));*/

        var color = d3.scale.category20()
            .domain(countries);

        addLabelColorVisualization('Country',
            'Country',
            null,
            'vipr:country',
            false,
            null,
            color);

        addNodeFillColorVisualization('Country',
            'Country',
            null,
            'vipr:country',
            false,
            null,
            color);

        addNodeBorderColorVisualization('Country',
            'Country',
            null,
            'vipr:country',
            false,
            null,
            color);

        color = d3.scale.category20()
            .domain(hosts);

        addLabelColorVisualization('Host',
            'Host',
            null,
            'vipr:host',
            false,
            null,
            color);

        addNodeFillColorVisualization('Host',
            'Host',
            null,
            'vipr:host',
            false,
            null,
            color);

        addNodeBorderColorVisualization('Host',
            'Host',
            null,
            'vipr:host',
            false,
            null,
            color);

        addLabelColorVisualization('Year',
            'Year',
            null,
            'vipr:year',
            false,
            null,
            yearCol);

        addNodeFillColorVisualization('Year',
            'Year',
            null,
            'vipr:year',
            false,
            null,
            yearCol);

        addNodeBorderColorVisualization('Year',
            'Year',
            null,
            'vipr:year',
            false,
            null,
            yearCol);

        addNodeSizeVisualization('Year',
            'Year',
            null,
            'vipr:year',
            false,
            null,
            yearSize);

        var ncp = {};
        ncp['UNKNOWN'] = 'red';
        ncp['Hu'] = 'green';
        ncp['ANG'] = 'blue';
        ncp['ALG'] = 'yellow';
        ncp['DZA'] = 'orange';
        ncp['pat'] = 'pink';

        addLabelColorVisualization('Name Pattern',
            'Name Pattern',
            'name',
            null,
            true,
            ncp,
            null);

        addNodeBorderColorVisualization('Name Pattern',
            'Name Pattern',
            'name',
            null,
            true,
            ncp,
            null);

        addNodeFillColorVisualization('Name Pattern',
            'Name Pattern',
            'name',
            null,
            true,
            ncp,
            null);

        var nsp = {};
        nsp['UNKNOWN'] = 'cross';
        nsp['Hu'] = 'triangle-up';
        nsp['ANG'] = 'triangle-down';
        nsp['ALG'] = 'diamond';
        nsp['DZA'] = 'square';
        nsp['pat'] = 'circle';

        addNodeShapeVisualization('Name Pattern',
            'Name Pattern',
            'name',
            null,
            true,
            nsp,
            null);

        var ns = {};
        ns['UNKNOWN'] = 10;
        ns['Hu'] = 20;
        ns['ANG'] = 30;
        ns['ALG'] = 40;
        ns['DZA'] = 50;
        ns['pat'] = 60;

        addNodeSizeVisualization('Name Pattern',
            'Name Pattern',
            'name',
            null,
            true,
            ns,
            null);
    }

    function addNodeSizeVisualization(label,
                                      description,
                                      field,
                                      cladePropertyRef,
                                      isRegex,
                                      mapping,
                                      mappingFn) {
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeSize) {
            _visualizations.nodeSize = {};
        }
        if (_visualizations.nodeSize[label]) {
            throw('node size visualization for "' + label + '" already exists')
        }
        var vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn);
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
                                           mappingFn) {
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeFillColor) {
            _visualizations.nodeFillColor = {};
        }
        if (_visualizations.nodeFillColor[label]) {
            throw('node fill color visualization for "' + label + '" already exists')
        }
        var vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn);
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
                                             mappingFn) {
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeBorderColor) {
            _visualizations.nodeBorderColor = {};
        }
        if (_visualizations.nodeBorderColor[label]) {
            throw('node border color visualization for "' + label + '" already exists')
        }
        var vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn);
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
                                       mappingFn) {
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.nodeShape) {
            _visualizations.nodeShape = {};
        }
        if (_visualizations.nodeShape[label]) {
            throw('node shape visualization for "' + label + '" already exists')
        }
        var vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn);
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
                                        mappingFn) {
        if (!_visualizations) {
            _visualizations = {};
        }
        if (!_visualizations.labelColor) {
            _visualizations.labelColor = {};
        }
        if (_visualizations.labelColor[label]) {
            throw('label color visualization for "' + label + '" already exists')
        }
        var vis = createVisualization(label,
            description,
            field,
            cladePropertyRef,
            isRegex,
            mapping,
            mappingFn);
        if (vis) {
            _visualizations.labelColor[vis.label] = vis;
        }
    }

    function resetVis() {
        forester.preOrderTraversal(_root, function (n) {
            n.hasVis = undefined;
        });
    }


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

        _treeFn = _treeFn.size([_displayHeight, _w]);

        _treeFn = _treeFn.separation(function separation(a, b) {
            return a.parent == b.parent ? 1 : 1;
        });

        _external_nodes = forester.calcSumOfAllExternalDescendants(_root);
        var uncollsed_nodes = forester.calcSumOfExternalDescendants(_root);

        var nodes = _treeFn.nodes(_root).reverse();
        var links = _treeFn.links(nodes);
        var gap = _options.nodeLabelGap;

        if (_options.phylogram === true) {
            var extNodes = forester.getAllExternalNodes(_root);
            //TODO could store these, probably...
            _yScale = branchLengthScaling(extNodes, _w);
        }
        else {
            d3.scale.linear()
                .domain([0, _w])
                .range([0, _w]);
        }

        if (_options.dynahide) {
            _dynahide_counter = 0;
            _dynahide_factor = Math.round(_options.externalNodeFontSize / ( ( 0.8 * _displayHeight) / uncollsed_nodes ));
            forester.preOrderTraversal(_root, function (n) {
                if (!n.children && _dynahide_factor >= 2 && (++_dynahide_counter % _dynahide_factor !== 0)) {
                    n.hide = true;
                }
                else {
                    n.hide = false;
                }
            });
        }

        updateDepthCollapseDepthDisplay();
        updateBranchLengthCollapseBranchLengthDisplay();
        updateButtonEnabledState();

        var node = _svgGroup.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++_i);
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function () {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .style("cursor", "default")
            .on('click', _treeFn.clickEvent);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0);

        nodeEnter.append("circle")
            .style("cursor", "pointer")
            .style("opacity", "0")
            .attr('class', 'nodeCircleOptions')
            .attr("r", function (d) {
                if (d.parent) {
                    return 5;
                }
                return 0;
            });

        nodeEnter.append("text")
            .attr("class", "extlabel")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .style("fill-opacity", 0.5);

        nodeEnter.append("text")
            .attr("class", "bllabel");

        nodeEnter.append("text")
            .attr("class", "conflabel")
            .attr("text-anchor", "middle");

        nodeEnter.append("text")
            .attr("class", "collapsedText")
            .attr("dy", function (d) {
                return 0.3 * _options.externalNodeFontSize + "px";
            });

        node.select("text.extlabel")
            .style("font-size", function (d) {
                return d.children || d._children ? _options.internalNodeFontSize + "px" : _options.externalNodeFontSize + "px";
            })
            .style("fill", makeLabelColor)
            .attr("dy", function (d) {
                return d.children || d._children ? 0.3 * _options.internalNodeFontSize + "px" : 0.3 * _options.externalNodeFontSize + "px";
            })
            .attr("x", function (d) {
                if (!(d.children || d._children)) {
                    if (_options.phylogram && _options.alignPhylogram) {
                        return (-_yScale(d.distToRoot) + _w + gap);
                    }
                    else {
                        return gap;
                    }
                }
                else {
                    return -gap;
                }
            });

        node.select("text.bllabel")
            .style("font-size", _options.branchDataFontSize + "px")
            .attr("dy", "-.25em")
            .attr("x", function (d) {
                if (d.parent) {
                    return (d.parent.y - d.y + 1);
                }
                else { //TODO could remove?
                    return 0;
                }
            });

        node.select("text.conflabel")
            .style("font-size", _options.branchDataFontSize + "px")
            .attr("dy", _options.branchDataFontSize)
            .attr("x", function (d) {
                if (d.parent) {
                    return (0.5 * (d.parent.y - d.y) );
                }
                else { //TODO could remove?
                    return 0;
                }
            });


        node.select("circle.nodeCircle")
            .attr("r", function (d) {
                if (_options.showNodeVisualizations &&
                    (makeNodeStrokeColor(d) === _options.backgroundColorDefault &&
                    makeNodeFillColor(d) === _options.backgroundColorDefault)
                ) {
                    return 0;
                }
                return makeNodeSize(d);
            })
            .style("stroke", function (d) {
                return makeNodeStrokeColor(d)
            })
            .style("stroke-width", _options.branchWidthDefault)
            .style("fill", function (d) {
                return _options.showNodeVisualizations ? makeNodeFillColor(d) : _options.backgroundColorDefault;
            });

        nodeEnter.append("path")
            .attr("d", "M0,0");

        var start = _options.phylogram ? (-1) : (-10);
        var ylength = _displayHeight / ( 3 * uncollsed_nodes );

        var nodeUpdate = node.transition()
            .duration(transitionDuration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        nodeUpdate.select("text.extlabel")
            .text(function (d) {
                if (!_options.dynahide || !d.hide) {
                    return makeNodeLabel(d);
                }
            });

        nodeUpdate.select("text.bllabel")
            .text(_options.showBranchLengthValues ? makeBranchLengthLabel : null);

        nodeUpdate.select("text.conflabel")
            .text(_options.showConfidenceValues ? makeConfidenceValuesLabel : null);

        nodeUpdate.select("path")
            .style("stroke", _options.showNodeVisualizations ? makeVisNodeBorderColor : null)
            .style("stroke-width", _options.branchWidthDefault)
            .style("fill", _options.showNodeVisualizations ? makeVisNodeFillColor : null)
            .style("opacity", _options.nodeVisualizationsOpacity)
            .attr("d", _options.showNodeVisualizations ? makeNodeVisShape : null);


        node.each(function (d) {
            if (d._children) {
                var yl = ylength;
                var descs = forester.getAllExternalNodes(d);
                if (descs.length < 5) {
                    yl = 0.5 * yl;
                }
                var avg = forester.calcAverageTreeHeight(d, descs);

                var xlength = _options.phylogram ? _yScale(avg) : 0;
                d.avg = xlength;
                var l = d.width ? (d.width / 2) : _options.branchWidthDefault / 2;
                d3.select(this).select("path").transition().duration(transitionDuration)
                    .attr("d", function (d) {
                        return "M" + start + "," + (-l) + "L" + xlength + "," + (-yl) + "L" + xlength + "," + (yl) + "L" + start + "," + l + "L" + start + "," + (-l);
                    })
                    .style("fill", makeCollapsedColor(d));

                d3.select(this).select(".collapsedText").attr("font-size", function (d) {
                    return _options.externalNodeFontSize + "px";
                });
                d3.select(this).select(".collapsedText").transition().duration(transitionDuration)
                    .style("fill-opacity", 1)
                    .text(makeCollapsedLabel(d, descs))
                    .style("fill", function (d) {
                        return makeLabelColor(d);
                    })

                    .attr("dy", function (d) {
                        return 0.3 * _options.externalNodeFontSize + "px";
                    })
                    .attr("x", function (d) {
                        if (_options.phylogram && _options.alignPhylogram) {
                            var w = d;
                            while (w.children && w.children.length > 0) {
                                w = w.children[0]; //TODO we can store these...
                            }
                            return (-_yScale(w.distToRoot) + _w + gap);
                        }
                        else {
                            return xlength + gap;
                        }
                    });

            }
            if (d.children) {
                d3.select(this).select("path").transition().duration(transitionDuration)
                    .attr("d", function (d) {
                        return "M" + 0 + "," + 0 + "L" + 0 + "," + 0 + "L" + 0 + "," + 0 + "L" + 0 + "," + 0;
                    });
                d3.select(this).select(".collapsedText").transition().duration(transitionDuration)
                    .attr("x", 0)
                    .style("fill-opacity", 1e-6)
                    .each("end", function () {
                        d3.select(this).text("")
                    });
            }
        });

        var nodeExit = node.exit().transition()
            .duration(transitionDuration)
            .attr("transform", function () {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        var link = _svgGroup.selectAll("path.link")
            .attr("d", elbow)
            .attr("stroke-width", makeBranchWidth)
            .data(links, function (d) {
                return d.target.id;
            });

        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke-width", makeBranchWidth)
            .attr("stroke", makeBranchColor)
            .attr("d", function () {
                var o = {
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
            .attr("d", elbow);

        link.exit()
            .attr("d", function () {
                var o = {
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
            && ( _options.showNodeName || _options.showTaxonomy || _options.showSequence )) {
            var linkExtension = _svgGroup.append("g")
                .selectAll("path")
                .data(links.filter(function (d) {
                    return (!d.target.children
                        && !( _options.dynahide && d.target.hide)
                    );
                }));

            linkExtension.enter().insert("path", "g")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke-width", 1)
                .attr("stroke", _options.branchColorDefault)
                .style("stroke-opacity", 0.25)
                .attr("d", function (d) {
                    return connection(d.target);
                });
        }

        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    var makeNodeSize = function (node) {
        return ( ( _options.nodeSizeDefault > 0 && node.parent && !( _options.showNodeVisualizations && node.hasVis) )
        && ( ( node.children && _options.showInternalNodes )
            || ( ( !node._children && !node.children ) && _options.showExternalNodes )
        ) || ( _options.phylogram && node.parent && !node.parent.parent && (!node.branch_length || node.branch_length <= 0)) ) ? makeVisNodeSize(node, 0.05) : 0;
    };

    var makeBranchWidth = function (link) {
        if (link.target.width) {
            return link.target.width;
        }
        return _options.branchWidthDefault;
    };

    var makeBranchColor = function (link) {
        if (link.target.color) {
            var c = link.target.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _options.branchColorDefault;
    };

    var makeNodeFillColor = function (phynode) {
        var foundColor = getFoundColor(phynode);//TODO maybe only if search is "on"
        if (foundColor != null) {
            return foundColor;
        }
        return makeVisNodeFillColor(phynode);
    };

    var makeNodeStrokeColor = function (phynode) {
        var foundColor = getFoundColor(phynode);//TODO maybe only if search is "on"
        if (foundColor != null) {
            return foundColor;
        }
        else if (_options.showNodeVisualizations) {
            return makeVisNodeBorderColor(phynode);
        }
        else if (phynode.color) {
            var c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _options.branchColorDefault;
    };

    var makeCollapsedColor = function (phynode) {
        if (phynode.color) {
            var c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _options.branchColorDefault;
    };

    var makeLabelColor = function (phynode) {

        var foundColor = getFoundColor(phynode);
        if (foundColor != null) {
            return foundColor;
        }

        if (_currentLabelColorVisualization) {
            var color = makeVisLabelColor(phynode);
            if (color) {
                return color;
            }
        }
        if (phynode.color) {
            var c = phynode.color;
            return "rgb(" + c.red + "," + c.green + "," + c.blue + ")";
        }
        return _options.labelColorDefault;
    };

    var makeNodeVisShape = function (node) {
        if (_currentNodeShapeVisualization && _visualizations && !node._children && _visualizations.nodeShape
            && _visualizations.nodeShape[_currentNodeShapeVisualization]) {
            var vis = _visualizations.nodeShape[_currentNodeShapeVisualization];
            if (vis.field) {
                var fieldValue = node[vis.field];
                if (fieldValue) {
                    if (vis.isRegex) {
                        for (var key in vis.mapping) {
                            if (vis.mapping.hasOwnProperty(key)) {
                                var re = new RegExp(key);
                                if (re && fieldValue.search(re) > -1) {
                                    return produceVis(vis, key);
                                }
                            }
                        }
                    }
                    else {
                        return produceVis(vis, fieldValue);
                    }
                }
            }
            else if (vis.cladePropertyRef && node.properties && node.properties.length > 0) {
                var ref_name = vis.cladePropertyRef;
                var propertiesLength = node.properties.length;
                for (var i = 0; i < propertiesLength; ++i) {
                    var p = node.properties[i];
                    if (p.value && p.ref === ref_name) {
                        return produceVis(vis, p.value);
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
            }
            else if (vis.mapping[key]) {
                return makeShape(node, vis.mapping[key]);
            }
            return null;
        }

        function makeShape(node, shape) {
            node.hasVis = true;
            return d3.svg.symbol().type(shape).size(makeVisNodeSize(node))();
        }

    };


    var makeVisNodeFillColor = function (node) {
        if (_currentNodeFillColorVisualization && _visualizations && !node._children && _visualizations.nodeFillColor
            && _visualizations.nodeFillColor[_currentNodeFillColorVisualization]) {
            var vis = _visualizations.nodeFillColor[_currentNodeFillColorVisualization];
            var color = makeVisColor(node, vis);
            if (color) {
                return color;
            }
        }
        return _options.backgroundColorDefault;
    };


    var makeVisColor = function (node, vis) {
        if (vis.field) {
            var fieldValue = node[vis.field];
            if (fieldValue) {
                if (vis.isRegex) {
                    for (var key in vis.mapping) {
                        if (vis.mapping.hasOwnProperty(key)) {
                            var re = new RegExp(key);
                            if (re && fieldValue.search(re) > -1) {
                                return produceVis(vis, key);
                            }
                        }
                    }
                }
                else {
                    return produceVis(vis, fieldValue);
                }
            }
        }
        else if (vis.cladePropertyRef && node.properties && node.properties.length > 0) {
            var ref_name = vis.cladePropertyRef;
            var propertiesLength = node.properties.length;
            for (var i = 0; i < propertiesLength; ++i) {
                var p = node.properties[i];
                if (p.value && p.ref === ref_name) {
                    return produceVis(vis, p.value);
                }
            }
        }
        return null;

        function produceVis(vis, key) {
            return vis.mappingFn ? vis.mappingFn(key) : vis.mapping[key];
        }

    };

    var makeVisNodeBorderColor = function (node) {
        if (!_currentNodeBorderColorVisualization) {
            return _options.branchColorDefault;
        }
        if (_currentNodeBorderColorVisualization === SAME_AS_FILL) {
            return makeVisNodeFillColor(node);
        }
        if (_currentNodeBorderColorVisualization === NONE) {
            return _options.backgroundColorDefault;
        }
        if (_visualizations && !node._children && _visualizations.nodeBorderColor
            && _visualizations.nodeBorderColor[_currentNodeBorderColorVisualization]) {
            var vis = _visualizations.nodeBorderColor[_currentNodeBorderColorVisualization];
            var color = makeVisColor(node, vis);
            if (color) {
                return color;
            }
        }
        return _options.branchColorDefault;
    };

    var makeVisLabelColor = function (node) {
        if (_currentLabelColorVisualization && _visualizations && !node._children && _visualizations.labelColor
            && _visualizations.labelColor[_currentLabelColorVisualization]) {
            var vis = _visualizations.labelColor[_currentLabelColorVisualization];
            var color = makeVisColor(node, vis);
            if (color) {
                return color;
            }
        }
        return _options.labelColorDefault;
    };

    var makeVisNodeSize = function (node, correctionFactor) {
        if (_options.showNodeVisualizations && _currentNodeSizeVisualization) {
            if (_visualizations && !node._children && _visualizations.nodeSize
                && _visualizations.nodeSize[_currentNodeSizeVisualization]) {
                var vis = _visualizations.nodeSize[_currentNodeSizeVisualization];
                if (vis.field) {
                    var size;
                    var fieldValue = node[vis.field];
                    if (fieldValue) {
                        if (vis.isRegex) {
                            for (var key in vis.mapping) {
                                if (vis.mapping.hasOwnProperty(key)) {
                                    var re = new RegExp(key);
                                    if (re && fieldValue.search(re) > -1) {
                                        size = produceVis(vis, key, correctionFactor);
                                        if (size) {
                                            return size;
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            size = produceVis(vis, fieldValue, correctionFactor);
                            if (size) {
                                return size;
                            }
                        }
                    }
                }
                else if (vis.cladePropertyRef && node.properties && node.properties.length > 0) {
                    var ref_name = vis.cladePropertyRef;
                    var propertiesLength = node.properties.length;
                    for (var i = 0; i < propertiesLength; ++i) {
                        var p = node.properties[i];
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
        }
        else {
            return 2 * _options.nodeSizeDefault * _options.nodeSizeDefault;
        }


        function produceVis(vis, key, correctionFactor) {
            var size;
            if (vis.mappingFn) {
                size = vis.mappingFn(key)
            }
            else {
                size = vis.mapping[key];
            }
            if (size) {
                if (correctionFactor) {
                    return correctionFactor * size * _options.nodeSizeDefault;
                }
                else {
                    return size * _options.nodeSizeDefault;
                }
            }
            return null;
        }
    };


    function getFoundColor(phynode) {
        if (!_options.searchNegateResult) {
            if (_foundNodes0 && _foundNodes1 && _foundNodes0.has(phynode) && _foundNodes1.has(phynode)) {
                return _options.found0and1ColorDefault;
            }
            else if (_foundNodes0 && _foundNodes0.has(phynode)) {
                return _options.found0ColorDefault;
            }
            else if (_foundNodes1 && _foundNodes1.has(phynode)) {
                return _options.found1ColorDefault;
            }
        }
        else if (forester.isHasNodeData(phynode)) {
            if ((_foundNodes0 && !_searchBox0Empty) && (_foundNodes1 && !_searchBox1Empty) && !_foundNodes0.has(phynode) && !_foundNodes1.has(phynode)) {
                return _options.found0and1ColorDefault;
            }
            else if ((_foundNodes0 && !_searchBox0Empty) && !_foundNodes0.has(phynode)) {
                return _options.found0ColorDefault;
            }
            else if ((_foundNodes1 && !_searchBox1Empty) && !_foundNodes1.has(phynode)) {
                return _options.found1ColorDefault;
            }
        }
        return null;
    }


    var makeNodeLabel = function (phynode) {

        if (!_options.showExternalLabels && !( phynode.children || phynode._children)) {
            return null;
        }
        if (!_options.showInternalLabels && ( phynode.children || phynode._children)) {
            return null;
        }
        var l = "";
        if (_options.showNodeName) {
            l = append(l, phynode.name);
        }
        if (_options.showTaxonomy && phynode.taxonomies && phynode.taxonomies.length > 0) {
            var t = phynode.taxonomies[0];
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
                    var syn = t.synonyms;
                    for (var i = 0; i < syn.length; ++i) {
                        l = appendB(l, syn[i]);
                    }
                }
            }
        }
        if (_options.showSequence && phynode.sequences && phynode.sequences.length > 0) {
            var s = phynode.sequences[0];
            if (_options.showSequenceSymbol) {
                l = append(l, s.symbol);
            }
            if (_options.showSequenceName) {
                l = append(l, s.name);
            }
            if (_options.showSequenceGeneSymbol) {
                l = appendP(l, s.gene_name);
            }
        }
        if (_options.showDistributions && phynode.distributions && phynode.distributions.length > 0) {
            var d = phynode.distributions;
            for (var i = 0; i < d.length; ++i) {
                l = appendB(l, d[i].desc);
            }
        }
        return l;

        function append(str1, str2) {
            if (str2 && str2.length > 0) {
                if (str1.length > 0) {
                    str1 += ( " " + str2 );
                }
                else {
                    str1 = str2;
                }
            }
            return str1;
        }

        function appendP(str1, str2) {
            if (str2 && str2.length > 0) {
                if (str1.length > 0) {
                    str1 += ( " (" + str2 + ")");
                }
                else {
                    str1 = "(" + str2 + ")";
                }
            }
            return str1;
        }

        function appendB(str1, str2) {
            if (str2 && str2.length > 0) {
                if (str1.length > 0) {
                    str1 += ( " [" + str2 + "]");
                }
                else {
                    str1 = "[" + str2 + "]";
                }
            }
            return str1;
        }
    };

    var makeCollapsedLabel = function (node, descs) {
        if (node.hide) {
            return;
        }

        var first;
        var last;
        if (descs.length > 1) {
            first = descs[0];
            last = descs[descs.length - 1];
        }
        var text = null;
        if (first && last) {
            var first_label = makeNodeLabel(first);
            var last_label = makeNodeLabel(last);
            if (first_label && last_label) {
                text = first_label.substring(0, _options.collapasedLabelLength)
                    + " ... " + last_label.substring(0, _options.collapasedLabelLength)
                    + " (" + descs.length + ")";
            }
        }
        return text;
    };

    var makeBranchLengthLabel = function (phynode) {
        if (phynode.branch_length) {
            if (_options.phylogram
                && _options.minBranchLengthValueToShow
                && phynode.branch_length < _options.minBranchLengthValueToShow) {
                return;
            }
            return +phynode.branch_length.toFixed(BRANCH_LENGTH_DIGITS_DEFAULT);
        }
    };

    var makeConfidenceValuesLabel = function (phynode) {
        if (phynode.confidences && phynode.confidences.length > 0) {
            var c = phynode.confidences;
            var cl = c.length;
            if (_options.minConfidenceValueToShow) {
                var show = false;
                for (var i = 0; i < cl; ++i) {
                    if (c[i].value >= _options.minConfidenceValueToShow) {
                        show = true;
                        break;
                    }
                }
                if (!show) {
                    return;
                }
            }
            if (cl == 1) {
                if (c[0].value) {
                    return +c[0].value.toFixed(CONFIDENCE_VALUE_DIGITS_DEFAULT);
                }
            }
            else {
                var s = "";
                for (var ii = 0; ii < cl; ++ii) {
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

    var elbow = function (d) {
        return "M" + d.source.y + "," + d.source.x
            + "V" + d.target.x + "H" + d.target.y;
    };

    var connection = function (n) {
        if (_options.phylogram) {
            var x1 = n.y + 5; //gap //TODO
            if (n._children) {
                x1 += n.avg;
            }
            var y = n.x;
            var x = (n.y - _yScale(n.distToRoot) + _w );
            if ((x - x1) > 5) {
                return "M" + x1 + "," + y
                    + "L" + x + "," + y;
            }
        }
    };


    function initializeOptions(options) {
        _options = options ? options : {};

        if (_basicTreeProperties.branchLengths) {
            if (_options.phylogram === undefined) {
                _options.phylogram = PHYLOGRAM_DEFAULT;
            }
        }
        else {
            _options.phylogram = false;
        }
        if (_options.dynahide === undefined) {
            _options.dynahide = false;
        }
        if (_options.showBranchLengthValues === undefined) {
            _options.showBranchLengthValues = false;
        }
        if (_options.showConfidenceValues === undefined) {
            _options.showConfidenceValues = false;
        }
        if (_options.showNodeName === undefined) {
            _options.showNodeName = false;
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
            _options.showExternalLabels = false;
        }
        if (!_options.branchWidthDefault) {
            _options.branchWidthDefault = 2;
        }
        if (!_options.branchColorDefault) {
            _options.branchColorDefault = "#aaaaaa";
        }
        if (!_options.labelColorDefault) {
            _options.labelColorDefault = "#202020";
        }
        if (!_options.backgroundColorDefault) {
            _options.backgroundColorDefault = "#f0f0f0";
        }
        if (!_options.found0ColorDefault) {
            _options.found0ColorDefault = "#00ff00";
        }
        if (!_options.found1ColorDefault) {
            _options.found1ColorDefault = "#ff0000";
        }
        if (!_options.found0and1ColorDefault) {
            _options.found0and1ColorDefault = "#00ffff";
        }
        if (!_options.nodeSizeDefault) {
            _options.nodeSizeDefault = 3;
        }
        if (!_options.externalNodeFontSize) {
            _options.externalNodeFontSize = 10;
        }
        if (!_options.internalNodeFontSize) {
            _options.internalNodeFontSize = 9;
        }
        if (!_options.branchDataFontSize) {
            _options.branchDataFontSize = 7;
        }
        if (!_options.collapasedLabelLength) {
            _options.collapasedLabelLength = 7;
        }
        if (!_options.nodeLabelGap) {
            _options.nodeLabelGap = 10;
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
        if (_options.alignPhylogram === undefined) {
            _options.alignPhylogram = false;
        }

        if (_options.nodeVisualizationsOpacity === undefined) {
            _options.nodeVisualizationsOpacity = 1;
        }

    }

    function initializeSettings(settings) {
        _settings = settings ? settings : {};
        if (!_settings.rootOffset) {
            _settings.rootOffset = ROOTOFFSET_DEFAULT;
        }
        if (!_settings.displayWidth) {
            _settings.displayWidth = DISPLAY_WIDTH_DEFAULT;
        }
        if (!_settings.displayHeight) {
            _settings.displayHeight = VIEWERHEIGHT_DEFAULT;
        }
        if (!_settings.reCenterAfterCollapse) {
            _settings.reCenterAfterCollapse = RECENTER_AFTER_COLLAPSE_DEFAULT;
        }
        if (!_settings.menuFontSize) {
            _settings.menuFontSize = MENU_FONT_SIZE_DEFAULT;
        }
        if (_settings.showNodeVisualizations === undefined) {
            _settings.showNodeVisualizations = false;
        }
        intitialzeDisplaySize();
    }

    function intitialzeDisplaySize() {
        _displayHeight = _settings.displayHeight;
        _displayWidth = _settings.displayWidth;
    }

    archaeopteryx.launch = function (id, phylo, options, settings) {

        _treeData = phylo;

        _zoomListener = d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoom);
        _basicTreeProperties = forester.collectBasicTreeProperties(_treeData);

        initializeOptions(options);
        initializeSettings(settings);

        if (settings.enableNodeVisualizations) {
            var np = forester.collectProperties(_treeData, 'node');
            initializeNodeVisualizations(np);
        }


        createGui(_basicTreeProperties);

        _baseSvg = d3.select(id).append("svg")
            .attr("width", _displayWidth)
            .attr("height", _displayHeight)
            .attr("class", "overlay")
            .call(_zoomListener);

        _svgGroup = _baseSvg.append("g");

        _treeFn = d3.layout.cluster()
            .size([_displayHeight, _displayWidth]);


        _treeFn.clickEvent = getClickEventListenerNode(phylo);

        calcMaxExtLabel();

        _root = phylo;

        _root.x0 = _displayHeight / 2;
        _root.y0 = 0;

        initializeGui();

        update(null, 0);
        centerNode(_root, _settings.rootOffset);
    };

    archaeopteryx.parsePhyloXML = function (data) {
        return phyloXmlParser.parse(data, {trim: true, normalize: true})[0]
    };

    archaeopteryx.parseNewHampshire = function (data) {
        return forester.parseNewHampshire(data);
    };


    function calcMaxExtLabel() {
        _maxLabelLength = _options.nodeLabelGap;
        forester.preOrderTraversal(_treeData, function (d) {
            if (d._children) {
                _maxLabelLength = Math.max((2 * _options.collapasedLabelLength) + 8, _maxLabelLength);
            }
            else if (!d.children) {
                var l = makeNodeLabel(d);
                if (l) {
                    _maxLabelLength = Math.max(l.length, _maxLabelLength);
                }
            }
        });
    }


    function removeTooltips() {
        _svgGroup.selectAll(".tooltipElem").remove();
    }


    function getClickEventListenerNode(tree) {

        function nodeClick(d) {

            function displayNodeData(n) {

                var title = n.name ? "Node Data: " + n.name : "Node Data";
                var text = "";
                if (n.name) {
                    text += "Name: " + n.name + "<br>";
                }
                if (n.branch_length) {
                    text += "Distance to Parent: " + n.branch_length + "<br>";
                }
                if (n.confidences) {
                    for (var i = 0; i < n.confidences.length; ++i) {
                        var c = n.confidences[i];
                        if (c.type) {
                            text += "Confidence [" + c.type + "]: " + c.value + "<br>";
                        }
                        else {
                            text += "Confidence: " + c.value + "<br>";
                        }
                        if (c.stddev) {
                            text += "- stdev: " + c.stddev + "<br>";
                        }
                    }
                }
                if (n.taxonomies) {
                    for (var i = 0; i < n.taxonomies.length; ++i) {
                        text += "Taxonomy<br>";
                        var t = n.taxonomies[i];
                        if (t.id) {
                            if (t.id.provider) {
                                text += "- Id [" + t.id.provider + "]: " + t.id.value + "<br>";
                            }
                            else {
                                text += "- Id: " + t.id.value + "<br>";
                            }
                        }
                        if (t.code) {
                            text += "- Code: " + t.code + "<br>";
                        }
                        if (t.scientific_name) {
                            text += "- Scientific name: " + t.scientific_name + "<br>";
                        }
                        if (t.common_name) {
                            text += "- Common name: " + t.common_name + "<br>";
                        }
                        if (t.synonym) {
                            text += "- Synonym: " + t.synonym + "<br>";
                        }
                        if (t.rank) {
                            text += "- Rank: " + t.rank + "<br>";
                        }
                    }
                }
                if (n.sequences) {
                    for (var i = 0; i < n.sequences.length; ++i) {
                        text += "Sequence<br>";
                        var s = n.sequences[i];
                        if (s.accession) {
                            if (s.accession.source) {
                                text += "- Accession [" + s.accession.source + "]: " + s.accession.value + "<br>";
                            }
                            else {
                                text += "- Accession: " + s.accession.value + "<br>";
                            }
                            if (s.accession.comment) {
                                text += "-- comment: " + s.accession.commen + "<br>";
                            }
                        }
                        if (s.symbol) {
                            text += "- Symbol: " + s.symbol + "<br>";
                        }
                        if (s.name) {
                            text += "- Name: " + s.name + "<br>";
                        }
                        if (s.gene_name) {
                            text += "- Gene name: " + s.gene_name + "<br>";
                        }
                        if (s.location) {
                            text += "- Location: " + s.location + "<br>";
                        }
                        if (s.type) {
                            text += "- Type: " + s.type + "<br>";
                        }
                    }
                }
                if (n.distributions) {
                    var distributions = n.distributions;
                    for (var i = 0; i < distributions.length; ++i) {
                        text += "Distribution: ";
                        if (distributions[i].desc) {
                            text += distributions[i].desc + "<br>";
                        }
                    }
                }
                if (n.date) {
                    text += "Date: ";
                    var date = n.date;
                    if (date.desc) {
                        text += date.desc + "<br>";
                    }
                }
                if (n.properties && n.properties.length > 0) {
                    var propertiesLength = n.properties.length;
                    for (var i = 0; i < propertiesLength; ++i) {
                        var property = n.properties[i];
                        if (property.ref && property.value) {
                            if (property.unit) {
                                text += property.ref + ": " + property.value + property.unit + "<br>";
                            }
                            else {
                                text += property.ref + ": " + property.value + "<br>";
                            }
                        }
                    }
                }
                if (n.children || n._children) {
                    text += "Number of External Nodes: " + forester.calcSumOfAllExternalDescendants(n) + "<br>";
                }
                text += "Depth: " + forester.calcDepth(n) + "<br>";


                $("<div id='node_data'>" + text + "</div>").dialog();
                var dialog = $("#node_data");
                dialog.dialog("option", "modal", true);
                dialog.dialog("option", "title", title);
                update();
            }

            function goToSubTree(node) {
                if (node.parent && ( node.children || node._children )) {
                    if (_superTreeRoots.length > 0 && node === _root.children[0]) {
                        _root = _superTreeRoots.pop();
                        resetDepthCollapseDepthValue();
                        resetRankCollapseRankValue();
                        resetBranchLengthCollapseValue();
                        zoomFit();
                    }
                    else if (node.parent.parent) {
                        _superTreeRoots.push(_root);
                        var fakeNode = {};
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
                        resetDepthCollapseDepthValue();
                        resetRankCollapseRankValue();
                        resetBranchLengthCollapseValue();
                        zoomFit();
                    }
                }
            }

            function swapChildren(d) {
                var c = d.children;
                var l = c.length;
                if (l > 1) {
                    var first = c[0];
                    for (var i = 0; i < l - 1; ++i) {
                        c[i] = c[i + 1];
                    }
                    c[l - 1] = first;
                }
            }

            function toggleCollapse(d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                }
                else {
                    d.children = d._children;
                    d._children = null;
                }
            }


            var rectWidth = 120;
            var rectHeight = 150;

            removeTooltips();

            d3.select(this).append("rect")
                .attr("class", "tooltipElem")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", rectWidth)
                .attr("height", rectHeight)
                .attr("rx", 10)
                .attr("ry", 10)
                .style("fill-opacity", 0.9)
                .style("fill", "#606060");

            var rightPad = 10;
            var topPad = 20;
            var textSum = 0;
            var textInc = 20;

            d3.select(this).append("text")
                .attr("class", "tooltipElem tooltipElemText")
                .attr("y", topPad + textSum)
                .attr("x", +rightPad)
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.parent) {
                        textSum += textInc;
                        return "Display Node Data";
                    }
                })
                .on("click", function (d) {
                    displayNodeData(d);
                });

            d3.select(this).append("text")
                .attr("class", "tooltipElem tooltipElemText")
                .attr("y", topPad + textSum)
                .attr("x", +rightPad)
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.parent && d.parent.parent) {
                        if (d._children) {
                            textSum += textInc;
                            return "Uncollapse";
                        }
                        else if (d.children) {
                            textSum += textInc;
                            return "Collapse";
                        }
                    }
                })
                .on("click", function (d) {
                    toggleCollapse(d);
                    update(d);
                });

            d3.select(this).append("text")
                .attr("class", "tooltipElem tooltipElemText")
                .attr("y", topPad + textSum)
                .attr("x", +rightPad)
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(function (d) {
                    var cc = 0;
                    forester.preOrderTraversalAll(d, function (e) {
                        if (e._children) {
                            ++cc;
                        }
                    });
                    if (cc > 1 || ( cc == 1 && !d._children )) {
                        textSum += textInc;
                        return "Uncollapse All";
                    }
                })
                .on("click", function (d) {
                    forester.unCollapseAll(d);
                    resetDepthCollapseDepthValue();
                    resetRankCollapseRankValue();
                    resetBranchLengthCollapseValue();
                    update();
                });

            d3.select(this).append("text")
                .attr("class", "tooltipElem tooltipElemText")
                .attr("y", topPad + textSum)
                .attr("x", +rightPad)
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.parent && ( d.children || d._children )) {
                        if (_superTreeRoots.length > 0 && d === _root.children[0]) {
                            textSum += textInc;
                            return "Return to Super-tree";
                        }
                        else if (d.parent.parent) {
                            textSum += textInc;
                            return "Go to Sub-tree";
                        }
                    }

                })
                .on("click", function (d) {
                    goToSubTree(d);
                });

            d3.select(this).append("text")
                .attr("class", "tooltipElem tooltipElemText")
                .attr("y", topPad + textSum)
                .attr("x", +rightPad)
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.parent) {
                        if (d.children) {
                            textSum += textInc;
                            return "Swap Descendants";
                        }
                    }
                })
                .on("click", function (d) {
                    swapChildren(d);
                    update();
                });

            d3.select(this).append("text")
                .attr("class", "tooltipElem tooltipElemText")
                .attr("y", topPad + textSum)
                .attr("x", +rightPad)
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.parent) {
                        if (d.children) {
                            textSum += textInc;
                            return "Order Subtree";
                        }
                    }
                })
                .on("click", function (d) {
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

            d3.select(this).append("text")
                .attr("class", "tooltipElem tooltipElemText")
                .attr("y", topPad + textSum)
                .attr("x", +rightPad)
                .style("fill", "white")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.parent && d.parent.parent && _superTreeRoots.length < 1) {
                        textSum += textInc;
                        return "Reroot";
                    }
                })
                .on("click", function (d) {
                    forester.reRoot(tree, d, -1);
                    resetDepthCollapseDepthValue();
                    resetRankCollapseRankValue();
                    resetBranchLengthCollapseValue();
                    zoomFit();
                });

            d3.selection.prototype.moveToFront = function () {
                return this.each(function () {
                    this.parentNode.appendChild(this);
                });
            };
            d3.select(this).moveToFront();
            d3.select(this).selectAll(".tooltipElemText").each(function (d) {
                d3.select(this).on("mouseover", function (d) {
                    d3.select(this).transition().duration(50).style("fill", "black");
                });
                d3.select(this).on("mouseout", function (d) {
                    d3.select(this).transition().duration(50).style("fill", "white");
                });
            });

        }

        return nodeClick;
    }


    $('html').click(function (d) {
        if ((d.target.getAttribute("class") !== "nodeCircleOptions")) {
            removeTooltips();
        }
    });


    function zoomInX(zoomInFactor) {
        if (zoomInFactor) {
            _displayWidth = _displayWidth * zoomInFactor;
        }
        else {
            _displayWidth = _displayWidth * BUTTON_ZOOM_IN_FACTOR;
        }
        update(null, 0);
    }

    function zoomInY(zoomInFactor) {
        if (zoomInFactor) {
            _displayHeight = _displayHeight * zoomInFactor;
        }
        else {
            _displayHeight = _displayHeight * BUTTON_ZOOM_IN_FACTOR;
        }
        update(null, 0);
    }

    function zoomOutX(zoomOutFactor) {
        var newDisplayWidth;
        if (zoomOutFactor) {
            newDisplayWidth = _displayWidth * zoomOutFactor;
        }
        else {
            newDisplayWidth = _displayWidth * BUTTON_ZOOM_OUT_FACTOR;
        }
        if ((newDisplayWidth - calcMaxTreeLengthForDisplay() ) >= 1) {
            _displayWidth = newDisplayWidth;
            update(null, 0);
        }
    }

    function zoomOutY(zoomOutFactor) {
        if (zoomOutFactor) {
            _displayHeight = _displayHeight * zoomOutFactor;
        }
        else {
            _displayHeight = _displayHeight * BUTTON_ZOOM_OUT_FACTOR;
        }
        var min = 0.25 * _settings.displayHeight;
        if (_displayHeight < min) {
            _displayHeight = min;
        }
        update(null, 0);
    }

    function zoomFit() {
        if (_root) {
            calcMaxExtLabel();
            intitialzeDisplaySize();
            initializeSettings(_settings);
            _zoomListener.scale(1);
            update(_root, 0);
            centerNode(_root, _settings.rootOffset);
        }
    }

    function returnToSupertreeButtonPressed() {
        if (_root && _superTreeRoots.length > 0) {
            _root = _superTreeRoots.pop();
            resetDepthCollapseDepthValue();
            resetRankCollapseRankValue();
            resetBranchLengthCollapseValue();
            zoomFit();
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
            forester.unCollapseAll(_root);
            resetDepthCollapseDepthValue();
            resetRankCollapseRankValue();
            resetBranchLengthCollapseValue();
            zoomFit();
        }
    }

    function search0() {
        _foundNodes0.clear();
        _searchBox0Empty = true;
        var query = $('#' + SEARCH_FIELD_0).val();
        if (query && query.length > 0) {
            var my_query = query.trim();
            if (my_query.length > 0) {
                _searchBox0Empty = false;
                _foundNodes0 = search(my_query);
            }
        }
        update(0, null, true);
    }

    function search1() {
        _foundNodes1.clear();
        _searchBox1Empty = true;
        var query = $('#' + SEARCH_FIELD_1).val();
        if (query && query.length > 0) {
            var my_query = query.trim();
            if (my_query.length > 0) {
                _searchBox1Empty = false;
                _foundNodes1 = search(my_query);
            }
        }
        update(0, null, true);
    }

    function search(query) {
        return forester.searchData(query,
            _treeData,
            _options.searchIsCaseSensitive,
            _options.searchIsPartial,
            _options.searchUsesRegex);
    }


    function toPhylogram() {
        _options.phylogram = true;
        update(null, 0);
    }

    function toCladegram() {
        _options.phylogram = false;
        update(null, 0);
    }

    function alignPhylogrambCbClicked() {
        _options.alignPhylogram = getCheckboxValue(ALIGN_PHYLOGRAM_CB);
        update();
    }


    function nodeNameCbClicked() {
        _options.showNodeName = getCheckboxValue(NODE_NAME_CB);
        if (_options.showNodeName) {
            _options.showExternalLabels = true;
            setCheckboxValue(EXTERNAL_LABEL_CB, true);
        }
        update();
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

    function changeBranchWidth(e, slider) {
        _options.branchWidthDefault = getSliderValue(slider);
        update(null, 0, true);
    }

    function changeNodeSize(e, slider) {
        _options.nodeSizeDefault = getSliderValue(slider);
        if (!_options.showInternalNodes && !_options.showExternalNodes && !_options.showNodeVisualizations) {
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


    function setRadioButtonValue(id, value) {
        var radio = $('#' + id);
        if (radio) {
            radio[0].checked = value;
            radio.button("refresh");
        }
    }

    function setCheckboxValue(id, value) {
        var cb = $('#' + id);
        if (cb && cb[0]) {
            cb[0].checked = value;
            cb.button("refresh");
        }
    }

    function getCheckboxValue(id) {
        return $('#' + id).is(':checked');
    }

    function getSliderValue(slider) {
        return slider.value;
    }

    function setSliderValue(id, value) {
        var sli = $('#' + id);
        if (sli) {
            sli.slider('value', value);
        }
    }

    function increaseFontSizes() {
        var step = SLIDER_STEP * 2;
        var max = FONT_SIZE_MAX - step;
        var up = false;
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
            update(0, null, true);
        }
    }

    function decreaseFontSizes() {
        var step = SLIDER_STEP * 2;
        var min = FONT_SIZE_MIN + step;
        var up = false;
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
            update(0, null, true);
        }
    }


    function createGui() {

        $("body").css({
            'font-size': _settings.menuFontSize,
            'font-family': 'Arial, Verdana, "Sans-serif"'
        });

        var c0 = $('#' + CONTROLS_0);

        if (c0) {
            c0.css({
                //  'width': '120px',
                // 'height': '580px',
                'padding': '0.25em',
                'opacity': '0.85',
                'background-color': '#e0e0e0'
            });

            c0.draggable({containment: "parent"});
            c0.append(makePhylogramControl());
            c0.append(makeMoreControls());
            c0.append(makeDisplayControl());
            c0.append(makeZoomControl());
            $('.' + PHYLOGRAM_CLADOGRAM_CONTROLGROUP).controlgroup({
                "direction": "horizontal",
                "width": "120px"
            });


            $('.' + DISPLAY_DATA_CONTROLGROUP).controlgroup({
                "direction": "vertical",
                "width": "120px"
            });

            c0.append(makeControlButons());

            c0.append(makeSliders());

            c0.append(makeSearchBoxes());

            c0.append(makeAutoCollapse());
        }

        var c1 = $('#' + CONTROLS_1);
        if (c1) {

            c1.css({
                'width': '200px',
                'height': '270px',
                'padding': '0.5em',
                'opacity': '0.85',
                'background-color': '#e0e0e0'
            });


            $('.' + SEARCH_OPTIONS_GROUP).controlgroup({
                "direction": "vertical"
            });


            c1.draggable({containment: "parent"});

            if (_settings.enableNodeVisualizations) {
                c1.append(makeVisualControls());
            }

            c1.append(makeSearchControls());

            $('#' + VISUAL_CONTROLS).accordion({
                collapsible: true,
                heightStyle: "content"
            });

            $('#' + SEARCH_OPTIONS).accordion({
                collapsible: true
            });


        }

        $('input:button')
            .button()
            .css({
                'width': '26px',
                'text-align': 'center',
                'outline': 'none',
                'margin': '0px'
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

        $(':radio').checkboxradio({
            icon: false
        });

        $(':checkbox').checkboxradio({
            icon: false
        });

        $('#' + SEARCH_FIELD_0).keyup(search0);

        $('#' + SEARCH_FIELD_1).keyup(search1);

        $('#' + PHYLOGRAM_BUTTON).click(toPhylogram);

        $('#' + CLADOGRAM_BUTTON).click(toCladegram);

        $('#' + ALIGN_PHYLOGRAM_CB).click(alignPhylogrambCbClicked);

        $('#' + NODE_NAME_CB).click(nodeNameCbClicked);

        $('#' + TAXONOMY_CB).click(taxonomyCbClicked);

        $('#' + SEQUENCE_CB).click(sequenceCbClicked);

        $('#' + CONFIDENCE_VALUES_CB).click(confidenceValuesCbClicked);

        $('#' + BRANCH_LENGTH_VALUES_CB).click(branchLengthsCbClicked);

        $('#' + INTERNAL_LABEL_CB).click(internalLabelsCbClicked);

        $('#' + EXTERNAL_LABEL_CB).click(externalLabelsCbClicked);

        $('#' + INTERNAL_NODES_CB).click(internalNodesCbClicked);

        $('#' + EXTERNAL_NODES_CB).click(externalNodesCbClicked);

        $('#' + NODE_VIS_CB).click(nodeVisCbClicked);

        $('#' + LABEL_COLOR_SELECT_MENU).on("change", function () {
            var v = this.value;
            if (v && v != DEFAULT) {
                _currentLabelColorVisualization = v;
            }
            else {
                _currentLabelColorVisualization = null;
            }
            update(null, 0);
        });

        $('#' + NODE_SHAPE_SELECT_MENU).on("change", function () {
            var v = this.value;
            if (v && v != DEFAULT) {
                _currentNodeShapeVisualization = v;
            }
            else {
                _currentNodeShapeVisualization = null;

            }
            resetVis();
            update(null, 0);
            update(null, 0);
        });

        $('#' + NODE_FILL_COLOR_SELECT_MENU).on("change", function () {
            var v = this.value;
            if (v && v != DEFAULT) {
                _currentNodeFillColorVisualization = v;
            }
            else {
                _currentNodeFillColorVisualization = null;
            }
            update(null, 0);
        });

        $('#' + NODE_BORDER_COLOR_SELECT_MENU).on("change", function () {
            var v = this.value;
            if (v && v != DEFAULT) {
                _currentNodeBorderColorVisualization = v;
            }
            else {
                _currentNodeBorderColorVisualization = null;
            }
            update(null, 0);
        });


        $('#' + NODE_SIZE_SELECT_MENU).on("change", function () {
            var v = this.value;
            if (v && v != DEFAULT) {
                _currentNodeSizeVisualization = v;
            }
            else {
                _currentNodeSizeVisualization = null;
            }
            update(null, 0);
        });


        $('#' + NODE_SIZE_SLIDER).slider({
            min: NODE_SIZE_MIN,
            max: NODE_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.nodeSizeDefault,
            animate: "fast",
            slide: changeNodeSize,
            change: changeNodeSize
        });

        $('#' + BRANCH_WIDTH_SLIDER).slider({
            min: BRANCH_WIDTH_MIN,
            max: BRANCH_WIDTH_MAX,
            step: SLIDER_STEP,
            value: _options.branchWidthDefault,
            animate: "fast",
            slide: changeBranchWidth,
            change: changeBranchWidth
        });

        $('#' + EXTERNAL_FONT_SIZE_SLIDER).slider({
            min: FONT_SIZE_MIN,
            max: FONT_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.externalNodeFontSize,
            animate: "fast",
            slide: changeExternalFontSize,
            change: changeExternalFontSize
        });

        $('#' + INTERNAL_FONT_SIZE_SLIDER).slider({
            min: FONT_SIZE_MIN,
            max: FONT_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.internalNodeFontSize,
            animate: "fast",
            slide: changeInternalFontSize,
            change: changeInternalFontSize
        });

        $('#' + BRANCH_DATA_FONT_SIZE_SLIDER).slider({
            min: FONT_SIZE_MIN,
            max: FONT_SIZE_MAX,
            step: SLIDER_STEP,
            value: _options.branchDataFontSize,
            animate: "fast",
            slide: changeBranchDataFontSize,
            change: changeBranchDataFontSize
        });

        $('#' + SEARCH_FIELD_0 + ', #' + SEARCH_FIELD_1)
            .button()
            .off('keydown')
            .off('mouseenter')
            .off('mousedown')
            .css({
                'font': 'inherit',
                'color': 'inherit',
                'text-align': 'left',
                'outline': 'none',
                'cursor': 'text',
                'width': '44px'
            });

        $('#' + DEPTH_COLLAPSE_LABEL + ', #' + BL_COLLAPSE_LABEL)
            .button()
            .off('keydown')
            .off('mouseenter')
            .off('mousedown')
            .attr("disabled", "disabled")
            .css({
                'font': 'inherit',
                'color': 'inherit',
                'text-align': 'center',
                'outline': 'none',
                'cursor': 'text',
                'width': '18px'
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

        $('#' + ZOOM_TO_FIT).mousedown(zoomFit);

        $('#' + RETURN_TO_SUPERTREE_BUTTON).mousedown(returnToSupertreeButtonPressed);

        $('#' + ORDER_BUTTON).mousedown(orderButtonPressed);

        $('#' + UNCOLLAPSE_ALL_BUTTON).mousedown(uncollapseAllButtonPressed);

        $('#' + SEARCH_OPTIONS_CASE_SENSITIVE_CB).click(searchOptionsCaseSenstiveCbClicked);
        $('#' + SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB).click(searchOptionsCompleteTermsOnlyCbClicked);
        $('#' + SEARCH_OPTIONS_REGEX_CB).click(searchOptionsRegexCbClicked);
        $('#' + SEARCH_OPTIONS_NEGATE_RES_CB).click(searchOptionsNegateResultCbClicked);


        $(document).keyup(function (e) {
            if (e.altKey) {
                if (e.keyCode === VK_O) {
                    orderButtonPressed();
                }
                else if (e.keyCode === VK_R) {
                    returnToSupertreeButtonPressed();
                }
                else if (e.keyCode === VK_U) {
                    uncollapseAllButtonPressed();
                }
                else if (e.keyCode === VK_C || e.keyCode === VK_DELETE
                    || e.keyCode === VK_BACKSPACE || e.keyCode === VK_HOME) {
                    zoomFit();
                }
                else if (e.keyCode === VK_P) {
                    cycleDisplay();
                }
                else if (e.keyCode === VK_L) {
                    toggleAlignPhylogram();
                }
            }
            else if (e.keyCode === VK_HOME) {
                zoomFit();
            }
        });

        $(document).keydown(function (e) {
            if (e.altKey) {
                if (e.keyCode === VK_UP) {
                    zoomInY(BUTTON_ZOOM_IN_FACTOR_SLOW);
                }
                else if (e.keyCode === VK_DOWN) {
                    zoomOutY(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                }
                else if (e.keyCode === VK_LEFT) {
                    zoomOutX(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                }
                else if (e.keyCode === VK_RIGHT) {
                    zoomInX(BUTTON_ZOOM_IN_FACTOR_SLOW);
                }

                else if (e.keyCode === VK_PLUS || e.keyCode === VK_PLUS_N) {
                    if (e.shiftKey) {
                        increaseFontSizes();
                    }
                    else {
                        zoomInY(BUTTON_ZOOM_IN_FACTOR_SLOW);
                        zoomInX(BUTTON_ZOOM_IN_FACTOR_SLOW);
                    }
                }
                else if (e.keyCode === VK_MINUS || e.keyCode === VK_MINUS_N) {
                    if (e.shiftKey) {
                        decreaseFontSizes();
                    }
                    else {
                        zoomOutY(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                        zoomOutX(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                    }
                }
                else if (e.keyCode === VK_A) {
                    decrDepthCollapseLevel();
                }
                else if (e.keyCode === VK_S) {
                    incrDepthCollapseLevel();
                }
            }
            if (e.keyCode === VK_PAGE_UP) {
                increaseFontSizes();
            }
            else if (e.keyCode === VK_PAGE_DOWN) {
                decreaseFontSizes();
            }
        });


        $(document).on('mousewheel DOMMouseScroll', function (e) {
            if (e.shiftKey) {
                if (e.originalEvent) {
                    var oe = e.originalEvent;
                    if (oe.detail > 0 || oe.wheelDelta < 0) {
                        if (e.ctrlKey) {
                            decreaseFontSizes();
                        }
                        else if (e.altKey) {
                            zoomOutX(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                        }
                        else {
                            zoomOutY(BUTTON_ZOOM_OUT_FACTOR_SLOW);
                        }
                    }
                    else {
                        if (e.ctrlKey) {
                            increaseFontSizes();
                        }
                        else if (e.altKey) {
                            zoomInX(BUTTON_ZOOM_IN_FACTOR_SLOW);
                        }
                        else {
                            zoomInY(BUTTON_ZOOM_IN_FACTOR_SLOW);
                        }
                    }
                }
                // To prevent page fom scrolling:
                return false;
            }
        });


        function makePhylogramControl() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<div class="' + PHYLOGRAM_CLADOGRAM_CONTROLGROUP + '">');
            h = h.concat('<label for="' + PHYLOGRAM_BUTTON + '">PH</label>');
            h = h.concat('<input type="radio" name="radio-1" id="' + PHYLOGRAM_BUTTON + '">');
            h = h.concat('<label for="' + CLADOGRAM_BUTTON + '">CL</label>');
            h = h.concat('<input type="radio" name="radio-1" id="' + CLADOGRAM_BUTTON + '">');
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeMoreControls() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<div class="' + DISPLAY_DATA_CONTROLGROUP + '">');
            h = h.concat('<label for="' + ALIGN_PHYLOGRAM_CB + '">Line Up PH</label>');
            h = h.concat('<input type="checkbox" name="' + ALIGN_PHYLOGRAM_CB + '" id="' + ALIGN_PHYLOGRAM_CB + '">');
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeDisplayControl() {
            var h = "";
            h = h.concat('<fieldset><legend>Display Data:</legend>');
            h = h.concat('<div class="' + DISPLAY_DATA_CONTROLGROUP + '">');

            if (_basicTreeProperties.nodeNames) {
                h = h.concat(cb('Node Name', NODE_NAME_CB));
            }
            if (_basicTreeProperties.taxonomies) {
                h = h.concat(cb('Taxonomy', TAXONOMY_CB));
            }
            if (_basicTreeProperties.sequences) {
                h = h.concat(cb('Sequence', SEQUENCE_CB));
            }
            if (_basicTreeProperties.confidences) {
                h = h.concat(cb('Confidence', CONFIDENCE_VALUES_CB));
            }
            if (_basicTreeProperties.branchLengths) {
                h = h.concat(cb('Branch Length', BRANCH_LENGTH_VALUES_CB));
            }
            h = h.concat(cb('External Labels', EXTERNAL_LABEL_CB));
            if (_basicTreeProperties.internalNodeData) {
                h = h.concat(cb('Internal Labels', INTERNAL_LABEL_CB));
            }
            h = h.concat(cb('External Nodes', EXTERNAL_NODES_CB));
            h = h.concat(cb('Internal Nodes', INTERNAL_NODES_CB));
            h = h.concat(cb('Node Vis', NODE_VIS_CB));

            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;

            function cb(label, id) {
                return '<label for="' + id + '">' + label + '</label><input type="checkbox" name="' + id + '" id="' + id + '">';
            }
        }

        function makeZoomControl() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Zoom:</legend>');
            h = h.concat('<input type="button" value="Y+" name="' + ZOOM_IN_Y + '" id="' + ZOOM_IN_Y + '" title="zoom in vertically (Alt+Up or Shift+mousewheel)">');
            h = h.concat('<br>');
            h = h.concat('<input type="button" value="X-" name="' + ZOOM_OUT_X + '" id="' + ZOOM_OUT_X + '" title="zoom out horizontally (Alt+Left or Shift+Alt+mousewheel)">');
            h = h.concat('<input type="button" value="F" name="' + ZOOM_TO_FIT + '" id="' + ZOOM_TO_FIT + '" title="fit and center to display (Alt+C or Home)">');
            h = h.concat('<input type="button" value="X+" name="' + ZOOM_IN_X + '" id="' + ZOOM_IN_X + '" title="zoom in horizontally (Alt+Right or Shift+Alt+mousewheel)">');
            h = h.concat('<br>');
            h = h.concat('<input type="button" value="Y-" name="' + ZOOM_OUT_Y + '" id="' + ZOOM_OUT_Y + '" title="zoom out vertically (Alt+Down or Shift+mousewheel)">');
            h = h.concat('</fieldset>');
            return h;
        }


        function makeControlButons() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<div>');
            h = h.concat('<input type="button" value="O" name="' + ORDER_BUTTON + '" title="order all (Alt+O)" id="' + ORDER_BUTTON + '">');
            h = h.concat('<input type="button" value="R" name="' + RETURN_TO_SUPERTREE_BUTTON + '" title="return to the super-tree (if in sub-tree) (Alt+R)" id="' + RETURN_TO_SUPERTREE_BUTTON + '">');
            h = h.concat('<input type="button" value="U" name="' + UNCOLLAPSE_ALL_BUTTON + '" title="uncollapse all (Alt+U)" id="' + UNCOLLAPSE_ALL_BUTTON + '">');
            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            return h;
        }


        function makeSliders() {
            var h = "";
            h = h.concat('External label size:');
            h = h.concat('<div id="' + EXTERNAL_FONT_SIZE_SLIDER + '"></div>');
            h = h.concat('');
            if (_basicTreeProperties.internalNodeData) {
                h = h.concat('Internal label size:');
                h = h.concat('<div id="' + INTERNAL_FONT_SIZE_SLIDER + '"></div>');
                h = h.concat('');
            }
            if (_basicTreeProperties.branchLengths || _basicTreeProperties.confidences) {
                h = h.concat('Branch label size:');
                h = h.concat('<div id="' + BRANCH_DATA_FONT_SIZE_SLIDER + '"></div>');
                h = h.concat('');
            }
            h = h.concat('Node size:');
            h = h.concat('<div id="' + NODE_SIZE_SLIDER + '"></div>');
            h = h.concat('');
            h = h.concat('Branch width:');
            h = h.concat('<div id="' + BRANCH_WIDTH_SLIDER + '"></div>');
            h = h.concat('<br>');
            return h;
        }

        function makeSearchBoxes() {
            var h = "";
            h = h.concat('Search (A)<br> <input type="text" name="' + SEARCH_FIELD_0 + '" id="' + SEARCH_FIELD_0 + '"><br>');
            h = h.concat('Search (B)<br> <input type="text" name="' + SEARCH_FIELD_1 + '" id="' + SEARCH_FIELD_1 + '"><br>');
            return h;
        }

        function makeAutoCollapse() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Collapse Node Depth</legend>');
            h = h.concat('<input type="button" value="-" name="' + DECR_DEPTH_COLLAPSE_LEVEL + '" id="' + DECR_DEPTH_COLLAPSE_LEVEL + '">');
            h = h.concat('<input type="text"  name="' + DEPTH_COLLAPSE_LABEL + '" id="' + DEPTH_COLLAPSE_LABEL + '">');
            h = h.concat('<input type="button" value="+" name="' + INCR_DEPTH_COLLAPSE_LEVEL + '" id="' + INCR_DEPTH_COLLAPSE_LEVEL + '">');
            h = h.concat('</fieldset>');
            if (_basicTreeProperties.branchLengths) {
                h = h.concat('<fieldset>');
                h = h.concat('<legend>Collapse  Length</legend>');
                h = h.concat('<input type="button" value="-" name="' + DECR_BL_COLLAPSE_LEVEL + '" id="' + DECR_BL_COLLAPSE_LEVEL + '">');
                h = h.concat('<input type="text"  name="' + BL_COLLAPSE_LABEL + '" id="' + BL_COLLAPSE_LABEL + '">');
                h = h.concat('<input type="button" value="+" name="' + INCR_BL_COLLAPSE_LEVEL + '" id="' + INCR_BL_COLLAPSE_LEVEL + '">');
                h = h.concat('</fieldset>');
            }
            return h;
        }

        function makeVisualControls() {
            var h = "";
            h = h.concat('<div id="' + VISUAL_CONTROLS + '">');
            h = h.concat('<h3>Visualizations</h3>');
            h = h.concat('<form action="#">');
            h = h.concat('<label for="' + LABEL_COLOR_SELECT_MENU + '">Label Color</label>');
            h = h.concat('<br>');
            h = h.concat('<select name="' + LABEL_COLOR_SELECT_MENU + '" id="' + LABEL_COLOR_SELECT_MENU + '">');
            h = h.concat('</select>');

            h = h.concat('<br>');
            h = h.concat('<br>');
            h = h.concat('<label for="' + NODE_SHAPE_SELECT_MENU + '">Node Shape</label>');
            h = h.concat('<br>');
            h = h.concat('<select name="' + NODE_SHAPE_SELECT_MENU + '" id="' + NODE_SHAPE_SELECT_MENU + '">');
            h = h.concat('</select>');

            h = h.concat('<br>');
            h = h.concat('<br>');
            h = h.concat('<label for="' + NODE_FILL_COLOR_SELECT_MENU + '">Node Fill Color</label>');
            h = h.concat('<br>');
            h = h.concat('<select name="' + NODE_FILL_COLOR_SELECT_MENU + '" id="' + NODE_FILL_COLOR_SELECT_MENU + '">');
            h = h.concat('</select>');

            h = h.concat('<br>');
            h = h.concat('<br>');
            h = h.concat('<label for="' + NODE_BORDER_COLOR_SELECT_MENU + '">Node Border Color</label>');
            h = h.concat('<br>');
            h = h.concat('<select name="' + NODE_BORDER_COLOR_SELECT_MENU + '" id="' + NODE_BORDER_COLOR_SELECT_MENU + '">');
            h = h.concat('</select>');

            h = h.concat('<br>');
            h = h.concat('<br>');
            h = h.concat('<label for="' + NODE_SIZE_SELECT_MENU + '">Node Size</label>');
            h = h.concat('<br>');
            h = h.concat('<select name="' + NODE_SIZE_SELECT_MENU + '" id="' + NODE_SIZE_SELECT_MENU + '">');
            h = h.concat('</select>');


            h = h.concat('</form>');
            h = h.concat('</div>');


            return h;
        }


        function makeSearchControls() {
            var h = "";
            h = h.concat('<div id="' + SEARCH_OPTIONS + '">');
            h = h.concat('<h3>Search Options</h3>');

            h = h.concat('<fieldset>');
            h = h.concat('<div class="' + SEARCH_OPTIONS_GROUP + '">');

            h = h.concat(cb('Match Case', SEARCH_OPTIONS_CASE_SENSITIVE_CB));
            h = h.concat(cb('Words', SEARCH_OPTIONS_COMPLETE_TERMS_ONLY_CB));
            h = h.concat(cb('Regex', SEARCH_OPTIONS_REGEX_CB));
            h = h.concat(cb('Inverse', SEARCH_OPTIONS_NEGATE_RES_CB));

            h = h.concat('</div>');
            h = h.concat('</fieldset>');
            h = h.concat('</div>');
            return h;

            function cb(label, id) {
                return '<label for="' + id + '">' + label + '</label><input type="checkbox" name="' + id + '" id="' + id + '">';
            }
        }

    } // function createGui()

    function initializeGui() {

        setRadioButtonValue(PHYLOGRAM_BUTTON, _options.phylogram);
        setRadioButtonValue(CLADOGRAM_BUTTON, !_options.phylogram);

        setCheckboxValue(ALIGN_PHYLOGRAM_CB, _options.phylogram ? _options.alignPhylogram : false);
        setCheckboxValue(NODE_NAME_CB, _options.showNodeName);
        setCheckboxValue(TAXONOMY_CB, _options.showTaxonomy);
        setCheckboxValue(SEQUENCE_CB, _options.showSequence);
        setCheckboxValue(CONFIDENCE_VALUES_CB, _options.showConfidenceValues);
        setCheckboxValue(BRANCH_LENGTH_VALUES_CB, _options.showBranchLengthValues);
        setCheckboxValue(INTERNAL_LABEL_CB, _options.showInternalLabels);
        setCheckboxValue(EXTERNAL_LABEL_CB, _options.showExternalLabels);
        setCheckboxValue(INTERNAL_NODES_CB, _options.showInternalNodes);
        setCheckboxValue(EXTERNAL_NODES_CB, _options.showExternalNodes);
        setCheckboxValue(NODE_VIS_CB, _options.showNodeVisualizations);
        initializeVisualizationMenu();
        initializeSearchOptions();
    }


    function initializeVisualizationMenu() {
        if (true) {
            $('select#' + NODE_FILL_COLOR_SELECT_MENU).append($("<option>")
                .val(DEFAULT)
                .html("default")
            );
            $('select#' + NODE_BORDER_COLOR_SELECT_MENU).append($("<option>")
                .val(DEFAULT)
                .html("default")
            );
            $('select#' + NODE_BORDER_COLOR_SELECT_MENU).append($("<option>")
                .val(NONE)
                .html("none")
            );
            $('select#' + NODE_BORDER_COLOR_SELECT_MENU).append($("<option>")
                .val(SAME_AS_FILL)
                .html("same as fill")
            );

            $("select#" + NODE_SHAPE_SELECT_MENU).append($("<option>")
                .val(DEFAULT)
                .html("default")
            );
            $("select#" + NODE_SIZE_SELECT_MENU).append($("<option>")
                .val(DEFAULT)
                .html("default")
            );
            $('select#' + LABEL_COLOR_SELECT_MENU).append($("<option>")
                .val(DEFAULT)
                .html("default")
            );


            if (_visualizations) {
                if (_visualizations.labelColor) {
                    for (var key in _visualizations.labelColor) {
                        if (_visualizations.labelColor.hasOwnProperty(key)) {
                            $('select#' + LABEL_COLOR_SELECT_MENU).append($("<option>")
                                .val(key)
                                .html(key)
                            );
                        }
                    }
                }
                if (_visualizations.nodeShape) {
                    for (var key in _visualizations.nodeShape) {
                        if (_visualizations.nodeShape.hasOwnProperty(key)) {
                            $('select#' + NODE_SHAPE_SELECT_MENU).append($("<option>")
                                .val(key)
                                .html(key)
                            );
                        }
                    }
                }
                if (_visualizations.nodeFillColor) {
                    for (var key in _visualizations.nodeFillColor) {
                        if (_visualizations.nodeFillColor.hasOwnProperty(key)) {
                            $('select#' + NODE_FILL_COLOR_SELECT_MENU).append($("<option>")
                                .val(key)
                                .html(key)
                            );
                        }
                    }
                }
                if (_visualizations.nodeBorderColor) {
                    for (var key in _visualizations.nodeBorderColor) {
                        if (_visualizations.nodeBorderColor.hasOwnProperty(key)) {
                            $('select#' + NODE_BORDER_COLOR_SELECT_MENU).append($("<option>")
                                .val(key)
                                .html(key)
                            );
                        }
                    }
                }
                if (_visualizations.nodeSize) {
                    for (var key in _visualizations.nodeSize) {
                        if (_visualizations.nodeSize.hasOwnProperty(key)) {
                            $('select#' + NODE_SIZE_SELECT_MENU).append($("<option>")
                                .val(key)
                                .html(key)
                            );
                        }
                    }
                }
            }
        }
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
    }


    function orderSubtree(n, order) {
        var changed = false;
        ord(n);
        if (!changed) {
            order = !order;
            ord(n);
        }
        function ord(n) {
            if (!n.children) {
                return;
            }
            var c = n.children;
            var l = c.length;
            if (l == 2) {
                var e0 = forester.calcSumOfAllExternalDescendants(c[0]);
                var e1 = forester.calcSumOfAllExternalDescendants(c[1]);
                if (e0 !== e1 && e0 < e1 === order) {
                    changed = true;
                    var c0 = c[0];
                    c[0] = c[1];
                    c[1] = c0;
                }
            }
            for (var i = 0; i < l; ++i) {
                ord(c[i]);
            }
        }
    }

    function cycleDisplay() {
        _options.phylogram = !_options.phylogram;
        setRadioButtonValue(PHYLOGRAM_BUTTON, _options.phylogram);
        setRadioButtonValue(CLADOGRAM_BUTTON, !_options.phylogram);
        update(null, 0);
    }

    function toggleAlignPhylogram() {
        _options.alignPhylogram = !_options.alignPhylogram;
        setCheckboxValue(ALIGN_PHYLOGRAM_CB, _options.alignPhylogram);
        update(null, 0);
    }


    function decrDepthCollapseLevel() {
        _rank_collapse_level = -1;
        _branch_length_collapse_level = -1;
        if (_root && _treeData && ( _external_nodes > 2 )) {
            if (_depth_collapse_level <= 1) {
                _depth_collapse_level = forester.calcMaxDepth(_root);
                forester.unCollapseAll(_root);
            }
            else {
                --_depth_collapse_level;
                forester.collapseToDepth(_treeData, _root, _depth_collapse_level);
            }
        }
        update(null, 0);
    }

    function incrDepthCollapseLevel() {
        _rank_collapse_level = -1;
        _branch_length_collapse_level = -1;
        if (( _root && _treeData  ) && ( _external_nodes > 2 )) {
            var max = forester.calcMaxDepth(_root);
            if (_depth_collapse_level >= max) {
                _depth_collapse_level = 1;
            }
            else {
                forester.unCollapseAll(_root);
                ++_depth_collapse_level;
            }
            forester.collapseToDepth(_treeData, _root, _depth_collapse_level);
        }
        update(null, 0);
    }

    function decrBlCollapseLevel() {
        _rank_collapse_level = -1;
        _depth_collapse_level = -1;
        if (_root && _treeData && ( _external_nodes > 2 )) {
            if (_branch_length_collapse_level <= _branch_length_collapse_data.min) {
                _branch_length_collapse_level = _branch_length_collapse_data.max;
            }
            _branch_length_collapse_level -= _branch_length_collapse_data.step;
            forester.collapseToBranchLength(_treeData, _root, _branch_length_collapse_level);
        }
        update(null, 0);
    }

    function incrBlCollapseLevel() {
        _rank_collapse_level = -1;
        _depth_collapse_level = -1;
        if (( _root && _treeData  ) && ( _external_nodes > 2 )) {
            if (_branch_length_collapse_level >= _branch_length_collapse_data.max
                || _branch_length_collapse_level < 0) {
                _branch_length_collapse_level = _branch_length_collapse_data.min;
            }
            _branch_length_collapse_level += _branch_length_collapse_data.step;
            if (_branch_length_collapse_level >= _branch_length_collapse_data.max) {
                forester.unCollapseAll(_root);
            }
            else {
                forester.collapseToBranchLength(_treeData, _root, _branch_length_collapse_level);
            }
        }
        update(null, 0);
    }

    function updateDepthCollapseDepthDisplay() {
        var v = obtainDepthCollapseDepthValue();
        $('#' + DEPTH_COLLAPSE_LABEL)
            .val(" " + v);
    }

    function updateBranchLengthCollapseBranchLengthDisplay() {
        var v = obtainBranchLengthCollapseBranchLengthValue();
        $('#' + BL_COLLAPSE_LABEL)
            .val(v);
    }


    function updateButtonEnabledState() {
        var b = null;
        if (_superTreeRoots && _superTreeRoots.length > 0) {
            b = $('#' + RETURN_TO_SUPERTREE_BUTTON);
            if (b) {
                b.prop('disabled', false);
                b.css("background", "");
            }
        }
        else {
            b = $('#' + RETURN_TO_SUPERTREE_BUTTON);
            if (b) {
                b.prop('disabled', true);
                b.css("background", "#e0e0e0");
            }
        }

        if (forester.isHasCollapsedNodes(_root)) {
            b = $('#' + UNCOLLAPSE_ALL_BUTTON);
            if (b) {
                b.prop('disabled', false);
                b.css("background", "");
            }
        }
        else {
            b = $('#' + UNCOLLAPSE_ALL_BUTTON);
            if (b) {
                b.prop('disabled', true);
                b.css("background", "#e0e0e0");
            }
        }
    }

    function obtainDepthCollapseDepthValue() {
        if (!(_treeData && _root)) {
            return "";
        }
        if (_external_nodes < 3) {
            return "off";
        }
        else if (_depth_collapse_level < 0) {
            _depth_collapse_level = forester.calcMaxDepth(_root);
            return "off";
        }
        else if (_depth_collapse_level == forester.calcMaxDepth(_root)) {
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
        }
        else if (_branch_length_collapse_level <= _branch_length_collapse_data.min) {
            return "off";
        }
        else if (_branch_length_collapse_level >= _branch_length_collapse_data.max) {
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
            var stats = forester.calcBranchLengthSimpleStatistics(_root);
            _branch_length_collapse_data.min = stats.min;
            _branch_length_collapse_data.max = stats.max;
            _branch_length_collapse_data.max = 0.25 * ( (3 * _branch_length_collapse_data.max) + _branch_length_collapse_data.min );
            var x = stats.n < 200 ? ( stats.n / 4) : 50;
            _branch_length_collapse_data.step = (_branch_length_collapse_data.max - _branch_length_collapse_data.min) / x;

        }
    }


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


