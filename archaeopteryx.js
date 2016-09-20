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

// v 0_51

if (!d3) {
    throw "no d3.js";
}

if (!forester) {
    throw "no forester.js";
}
(function archaeopteryx() {

    "use strict";

    var TRANSITION_DURATION_DEFAULT = 750;
    var PHYLOGRAM_DEFAULT = false;
    var ROOTOFFSET_DEFAULT = 30;
    var DISPLAY_WIDTH_DEFAULT = 800;
    var VIEWERHEIGHT_DEFAULT = 600;
    var RECENTER_AFTER_COLLAPSE_DEFAULT = false;
    var BRANCH_LENGTH_DIGITS_DEFAULT = 4;
    var CONFIDENCE_VALUE_DIGITS_DEFAULT = 2;
    var ZOOM_INTERVAL = 200;
    var BUTTON_ZOOM_IN_FACTOR = 1.2;
    var BUTTON_ZOOM_OUT_FACTOR = 1 / BUTTON_ZOOM_IN_FACTOR;

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
    var _displayWidth = 0;
    var _displayHeight = 0;
    var _intervalId = 0;
    var _dataForVisualization = {};
    var _currentLabelColorVisualization = null;
    var _dynahide_counter = 0;
    var _dynahide_factor = 0;
    var _treeProperties = null;
    var _depth_collapse_level = -1;
    var _rank_collapse_level = -1;
    var _branch_length_collapse_level = -1;
    var _branch_length_collapse_data = {};
    var _external_nodes = 0;
    var _w = null;


    function branchLengthScaling(nodes, width) {

        if (_root.parent) {
            _root.parent.distToRoot = 0;
        }
        forester.preOrderTraversalAll(_root, function (n) {
            n.distToRoot = (n.parent ? n.parent.distToRoot : 0) + (n.branch_length || 0);
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
        return _settings.rootOffset + _options.nodeLabelGap + ( _maxLabelLength * _options.externalNodeFontSize * 0.5 );
        /*function getTextWidth(text, font) {
         var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
         var context = canvas.getContext("2d");
         context.font = font;
         var metrics = context.measureText(text);
         return Math.floor( metrics.width ) + 1;
         }*/
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
            _dynahide_factor = Math.round(_options.externalNodeFontSize / ( 0.8 * _displayHeight / forester.calcSumOfExternalDescendants(_root)));
        }

        updateDepthCollapseDepthDisplay();
        updateBranchLengthCollapseBranchLengthDisplay();

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
            .attr("x", function (d) {
                return d.children || d._children ? -gap : gap;
            })
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
                return ( ( _options.internalNodeSize > 0 && d.parent )
                && ( ( d.children && _options.showInternalNodes  )
                    || ( ( !d._children && !d.children ) && _options.showExternalNodes  )
                ) || ( _options.phylogram && d.parent && !d.parent.parent && (!d.branch_length || d.branch_length <= 0)) ) ? _options.internalNodeSize : 0;
            })
            .style("stroke", makeNodeColor)
            .style("stroke-width", _options.branchWidthDefault)
            .style("fill", function (d) {
                return d._children ? makeNodeColor(d) : _options.backgroundColorDefault;
            });

        nodeEnter.append("path")
            .attr("d", function (d) {
                return "M" + 0 + "," + 0 + "L" + 0 + "," + 0 + "L" + 0 + "," + 0 + "L" + 0 + "," + 0;
            });


        node.each(function (d) {
            if (d._children) {
                var descs = forester.getAllExternalNodes(d);
                var avg = forester.calcAverageTreeHeight(d, descs);
                var xlength = _options.phylogram ? _yScale(avg) : 0;
                var start = _options.phylogram ? (-1) : (-10);
                var ylength = 4;

                var l = d.width ? (d.width / 2) : _options.branchWidthDefault / 2;
                d3.select(this).select("path").transition().duration(transitionDuration)
                    .attr("d", function (d) {
                        return "M" + start + "," + (-l) + "L" + xlength + "," + (-ylength) + "L" + xlength + "," + (ylength) + "L" + start + "," + l + "L" + start + "," + (-l);
                    })
                    .style("fill", makeCollapsedColor(d));
                d3.select(this).select(".collapsedText").attr("font-size", function (d) {
                    return _options.externalNodeFontSize + "px";
                });
                d3.select(this).select(".collapsedText").transition().duration(transitionDuration)
                    .style("fill-opacity", 1)
                    .text(makeCollapsedLabel(descs))
                    .style("fill", function (d) {
                        return makeLabelColor(d);
                    })
                    .attr("x", function (d) {
                        return xlength + gap;
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

        var nodeUpdate = node.transition()
            .duration(transitionDuration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        nodeUpdate.select("text.extlabel")
            .text(function (d) {
                if (( _options.dynahide && !(d.children || d._children) && _dynahide_factor >= 2 )
                    && (++_dynahide_counter % _dynahide_factor !== 0)) {
                    return null;
                }
                else {
                    return makeNodeLabel(d);
                }
            });

        nodeUpdate.select("text.bllabel")
            .text(_options.showBranchLengthValues ? makeBranchLengthLabel : null);

        nodeUpdate.select("text.conflabel")
            .text(_options.showConfidenceValues ? makeConfidenceValuesLabel : null);


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
            .transition()
            .duration(transitionDuration)
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

        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

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

    var makeNodeColor = function (phynode) {
        if (_foundNodes0 && _foundNodes1 && _foundNodes0.has(phynode) && _foundNodes1.has(phynode)) {
            return _options.found0and1ColorDefault;
        }
        else if (_foundNodes0 && _foundNodes0.has(phynode)) {
            return _options.found0ColorDefault;
        }
        else if (_foundNodes1 && _foundNodes1.has(phynode)) {
            return _options.found1ColorDefault;
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
        if (_foundNodes0 && _foundNodes1 && _foundNodes0.has(phynode) && _foundNodes1.has(phynode)) {
            return _options.found0and1ColorDefault;
        }
        else if (_foundNodes0 && _foundNodes0.has(phynode)) {
            return _options.found0ColorDefault;
        }
        else if (_foundNodes1 && _foundNodes1.has(phynode)) {
            return _options.found1ColorDefault;
        }

        if (_currentLabelColorVisualization) {
            var color = labelColorVisualization(phynode);
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


    function labelColorVisualization(node) {
        var distColors = {};
        distColors.CA = "rgb(0,0,255)";
        distColors.AZ = "rgb(0,255,255)";
        distColors.NY = "rgb(255,0,255)";
        distColors.MN = "rgb(100,0,255)";
        distColors.FL = "rgb(100,0,100)";
        distColors.IL = "rgb(100,100,100)";
        distColors.IL = "rgb(100,0,125)";

        var drugColors = {};
        drugColors.Amantadine = "rgb(0,0,255)";
        drugColors.Docosanol = "rgb(0,255,0)";
        drugColors.Emtricitabin = "rgb(255,0,0)";

        var hostColors = {};
        hostColors["Gallus gallus"] = "rgb(129,20,0)";
        hostColors["Anas platyrhynchos"] = "rgb(93,40,255)";
        hostColors["Sus scrofa"] = "rgb(10,129,23)";

        if (_currentLabelColorVisualization === "distribution") {
            if (node.distributions && node.distributions.length > 0) {
                return distColors[node.distributions[0].desc];
            }
        }
        else if (_currentLabelColorVisualization === "vipr:host"
            || _currentLabelColorVisualization === "vipr:drug") {
            if (node.properties && node.properties.length > 0) {
                var propertiesLength = node.properties.length;
                for (var i = 0; i < propertiesLength; ++i) {
                    var p = node.properties[i];
                    if (p.ref && p.value) {
                        var ref = p.ref;
                        if (_currentLabelColorVisualization === "vipr:host" && ref === "vipr:host") {
                            return hostColors[p.value];
                        }
                        else if (_currentLabelColorVisualization === "vipr:drug" && ref === "vipr:drug") {
                            return drugColors[p.value];
                        }
                    }
                }
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
                    var s = t.synonyms;
                    for (var i = 0; i < s.length; ++i) {
                        l = appendB(l, s[i]);
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


    var makeCollapsedLabel = function (descs) {
        if (!_options.showExternalLabels) {
            return null;
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
            else {
                text = "(" + descs.length + ")";
            }
        }
        return text;
    };

    var makeBranchLengthLabel = function (phynode) {
        if (phynode.branch_length && phynode.branch_length > 0) {
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


    function initializeOptions(options) {
        _options = options ? options : {};

        if (_treeProperties.branchLengths) {
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
        if (!_options.internalNodeSize) {
            _options.internalNodeSize = 3;
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
        if (_options.searchUsesRegex === undefined) {
            _options.searchUsesRegex = false;
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
        intitialzeDisplaySize();
    }

    function intitialzeDisplaySize() {
        _displayHeight = _settings.displayHeight;
        _displayWidth = _settings.displayWidth;
    }

    archaeopteryx.launch = function (id, phylo, options, settings) {

        _treeData = phylo;


        _zoomListener = d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoom);
        _treeProperties = forester.collectTreeProperties(_treeData);
        initializeOptions(options);
        initializeSettings(settings);
        createGui(_treeProperties);

        _baseSvg = d3.select(id).append("svg")
            .attr("width", _displayWidth)
            .attr("height", _displayHeight)
            .attr("class", "overlay")
            .call(_zoomListener);

        _svgGroup = _baseSvg.append("g");

        _treeFn = d3.layout.cluster()
            .size([_displayHeight, _displayWidth]);


        _treeFn.clickEvent = getClickEventListenerNode(phylo); //TODO

        calcMaxExtLabel();

        _root = phylo;


        _root.x0 = _displayHeight / 2;
        _root.y0 = 0;

        collectDataForVisualization();

        initializeGui();

        update(null, 0);
        centerNode(_root, _settings.rootOffset);
    };

    function collectDataForVisualization() {
        forester.preOrderTraversal(_treeData, function (node) {
            if (node.properties && node.properties.length > 0) {
                var propertiesLength = node.properties.length;
                for (var i = 0; i < propertiesLength; ++i) {
                    var p = node.properties[i];
                    if (p.ref && p.value) {
                        var ref = p.ref;
                        if (!_dataForVisualization[ref]) {
                            _dataForVisualization[ref] = new Set();
                        }
                        _dataForVisualization[ref].add(p.value);
                    }
                }
            }
            if (node.distributions && node.distributions.length > 0) {
                var distributionsLength = node.distributions.length;
                for (var i = 0; i < distributionsLength; ++i) {
                    var d = node.distributions[i];
                    var desc = d.desc;
                    if (desc) {
                        if (!_dataForVisualization.distribution) {
                            _dataForVisualization.distribution = new Set();
                        }
                        _dataForVisualization.distribution.add(desc);
                    }
                }
            }
        });
    }

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
                if (node.parent && node.children) {
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
                    if (d.parent && d.children) {
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
                    update();
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
                    forester.reRoot(tree, _root, d, -1);
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


    function zoomInX() {
        _displayWidth = _displayWidth * BUTTON_ZOOM_IN_FACTOR;
        update(null, 0);
    }

    function zoomInY() {
        _displayHeight = _displayHeight * BUTTON_ZOOM_IN_FACTOR;
        update(null, 0);
    }

    function zoomOutX() {
        var newDisplayWidth = _displayWidth * BUTTON_ZOOM_OUT_FACTOR;
        if ((newDisplayWidth - calcMaxTreeLengthForDisplay() ) >= 1) {
            _displayWidth = newDisplayWidth;
            update(null, 0);
        }
    }

    function zoomOutY() {
        _displayHeight = _displayHeight * BUTTON_ZOOM_OUT_FACTOR;
        var min = 0.25 * _settings.displayHeight;
        if (_displayHeight < min) {
            _displayHeight = min;
        }
        update(null, 0);
    }

    function zoomFit() {
        calcMaxExtLabel();
        intitialzeDisplaySize();
        initializeSettings(_settings);
        _zoomListener.scale(1);
        update(_root, 0);
        centerNode(_root, _settings.rootOffset);
    }


    function search0() {
        _foundNodes0.clear();
        var query = $("#search0").val();
        if (query && query.length > 0) {
            _foundNodes0 = search(query);
        }
        update(0, null, true);
    }

    function search1() {
        _foundNodes1.clear();
        var query = $("#search1").val();
        if (query && query.length > 0) {
            _foundNodes1 = search(query);
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
        update();
    }

    function toCladegram() {
        _options.phylogram = false;
        update();
    }

    function nodeNameCbClicked() {
        _options.showNodeName = getCheckboxValue('node_name_cb');
        update();
    }

    function taxonomyCbClicked() {
        _options.showTaxonomy = getCheckboxValue('taxonomy_cb');
        update();
    }

    function sequenceCbClicked() {
        _options.showSequence = getCheckboxValue('sequence_cb');
        update();
    }

    function confidenceValuesCbClicked() {
        _options.showConfidenceValues = getCheckboxValue('confidence_values_cb');
        update();
    }

    function branchLengthsCbClicked() {
        _options.showBranchLengthValues = getCheckboxValue('branch_length_values_cb');
        update();
    }

    function internalLabelsCbClicked() {
        _options.showInternalLabels = getCheckboxValue('internal_label_cb');
        update();
    }

    function externalLabelsCbClicked() {
        _options.showExternalLabels = getCheckboxValue('external_label_cb');
        update();
    }

    function internalNodesCbClicked() {
        _options.showInternalNodes = getCheckboxValue('internal_nodes_cb');
        update();
    }

    function externalNodesCbClicked() {
        _options.showExternalNodes = getCheckboxValue('external_nodes_cb');
        update();
    }

    function changeBranchWidth(e, ui) {
        _options.branchWidthDefault = getSliderValue('branch_width_slider', ui);
        update(0, null, true);
    }

    function changeNodeSize(e, ui) {
        _options.internalNodeSize = getSliderValue('node_size_slider', ui);
        update(0, null, true);
    }


    function changeInternalFontSize(e, ui) {
        _options.internalNodeFontSize = getSliderValue('internal_font_size_slider', ui);
        update(0, null, true);
    }

    function changeExternalFontSize(e, ui) {
        _options.externalNodeFontSize = getSliderValue('external_font_size_slider', ui);
        update(0, null, true);
    }

    function changeBranchDataFontSize(e, ui) {
        _options.branchDataFontSize = getSliderValue('branch_data_font_size_slider', ui);
        update(0, null, true);
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

    function getSliderValue(id, ui) {
        return ui.value;
    }


    function createGui() {

        $("body").css({
            'font-size': '9px',
            'font-family': 'Arial, Verdana, "Sans-serif"'
        });

        var c1 = $('#controls1');

        c1.css({
            'width': '120px',
            'height': '580px',
            'padding': '0.5em',
            'opacity': '0.85',
            'background-color': '#e0e0e0'
        });

        c1.draggable({containment: "parent"});

        c1.append(makePhylogramControl());

        c1.append(makeDisplayControl());

        c1.append(makeZoomControl());

        c1.append(makeSliders());

        c1.append(makeSearchBoxes());

        c1.append(makeAutoCollapse());

        var c2 = $('#controls2');

        c2.css({
            'width': '120px',
            'height': '270px',
            'padding': '0.5em',
            'opacity': '0.85',
            'background-color': '#e0e0e0'
        });

        c2.draggable({containment: "parent"});

        c2.append(makeVisualControls());

        $("#accordion").accordion({
            collapsible: true
        });


        $("input:button")
            .button()
            .css({
                'width': '28px',
                'text-align': 'center',
                'outline': 'none',
                'margin': '1px'
            });


        $("#zoom_in_y, #zoom_out_y")
            .css({
                'width': '94px'
            });

        $("#decr_depth_collapse_level, #incr_depth_collapse_level," +
            "#decr_rank_collapse_level, #incr_rank_collapse_level")
            .css({
                'width': '16px'
            });

        $(":radio").checkboxradio({
            icon: false
        });

        $(":checkbox").checkboxradio({
            icon: false
        });

        $("#search0").keyup(search0);

        $("#search1").keyup(search1);

        $("#radio-phylogram").click(toPhylogram);

        $("#radio-cladogram").click(toCladegram);

        $("#node_name_cb").click(nodeNameCbClicked);

        $("#taxonomy_cb").click(taxonomyCbClicked);

        $("#sequence_cb").click(sequenceCbClicked);

        $("#confidence_values_cb").click(confidenceValuesCbClicked);

        $("#branch_length_values_cb").click(branchLengthsCbClicked);

        $("#internal_label_cb").click(internalLabelsCbClicked);

        $("#external_label_cb").click(externalLabelsCbClicked);

        $("#internal_nodes_cb").click(internalNodesCbClicked);

        $("#external_nodes_cb").click(externalNodesCbClicked);

        $("#label_color_select_menu").on("change", function () {
            var v = this.value;
            if (v && v != "none") {
                _currentLabelColorVisualization = v;
                var x = _dataForVisualization[v];
            }
            else {
                _currentLabelColorVisualization = null;
            }
            update(null, 0);
        });

        $("#node_size_slider").slider({
            min: 0,
            max: 8,
            value: _options.internalNodeSize,
            animate: "fast",
            slide: changeNodeSize,
            change: changeNodeSize
        });

        $("#branch_width_slider").slider({
            min: 1,
            max: 9,
            value: _options.branchWidthDefault,
            animate: "fast",
            slide: changeBranchWidth,
            change: changeBranchWidth
        });

        $("#external_font_size_slider").slider({
            min: 2,
            max: 24,
            value: _options.externalNodeFontSize,
            animate: "fast",
            slide: changeExternalFontSize,
            change: changeExternalFontSize
        });

        $("#internal_font_size_slider").slider({
            min: 2,
            max: 24,
            value: _options.internalNodeFontSize,
            animate: "fast",
            slide: changeInternalFontSize,
            change: changeInternalFontSize
        });

        $("#branch_data_font_size_slider").slider({
            min: 2,
            max: 24,
            value: _options.branchDataFontSize,
            animate: "fast",
            slide: changeBranchDataFontSize,
            change: changeBranchDataFontSize
        });

        $("#search0, #search1")
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

        $("#depth_collapse_label, #bl_collapse_label")
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

        $("#zoom_in_y").mousedown(function () {
            zoomInY();
            _intervalId = setInterval(zoomInY, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $("#zoom_out_y").mousedown(function () {
            zoomOutY();
            _intervalId = setInterval(zoomOutY, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $("#zoom_in_x").mousedown(function () {
            zoomInX();
            _intervalId = setInterval(zoomInX, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $("#zoom_out_x").mousedown(function () {
            zoomOutX();
            _intervalId = setInterval(zoomOutX, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $("#decr_depth_collapse_level").mousedown(function () {
            decrDepthCollapseLevel();
            _intervalId = setInterval(decrDepthCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });
        $("#incr_depth_collapse_level").mousedown(function () {
            incrDepthCollapseLevel();
            _intervalId = setInterval(incrDepthCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });
        $("#decr_rank_collapse_level").mousedown(function () {
            decrBlCollapseLevel();
            _intervalId = setInterval(decrBlCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });
        $("#incr_rank_collapse_level").mousedown(function () {
            incrBlCollapseLevel();
            _intervalId = setInterval(incrBlCollapseLevel, ZOOM_INTERVAL);
        }).bind('mouseup mouseleave', function () {
            clearTimeout(_intervalId);
        });

        $("#zoom_to_fit").mousedown(zoomFit);

        function makePhylogramControl() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<label for="radio-phylogram">PH</label>');
            h = h.concat('<input type="radio" name="radio-1" id="radio-phylogram">');
            h = h.concat('<label for="radio-cladogram">CL</label>');
            h = h.concat('<input type="radio" name="radio-1" id="radio-cladogram">');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeDisplayControl() {
            var h = "";
            h = h.concat('<fieldset><legend>Display Data:</legend>');

            if (_treeProperties.nodeNames) {
                h = h.concat('<label for="node_name_cb">Node Name</label>');
                h = h.concat('<input type="checkbox" name="node_name_cb" id="node_name_cb">');
            }
            if (_treeProperties.taxonomies) {
                h = h.concat('<label for="taxonomy_cb">Taxonomy</label>');
                h = h.concat('<input type="checkbox" name="taxonomy_cb" id="taxonomy_cb">');
            }
            if (_treeProperties.sequences) {
                h = h.concat('<label for="sequence_cb">Sequence</label>');
                h = h.concat('<input type="checkbox" name="sequence_cb" id="sequence_cb">');
            }
            if (_treeProperties.confidences) {
                h = h.concat('<label for="confidence_values_cb">Confidence</label>');
                h = h.concat('<input type="checkbox" name="confidence_values_cb" id="confidence_values_cb">');
            }
            if (_treeProperties.branchLengths) {
                h = h.concat('<label for="branch_length_values_cb">Branch Length</label>');
                h = h.concat('<input type="checkbox" name="branch_length_values_cb" id="branch_length_values_cb">');
            }

            h = h.concat('<label for="external_label_cb">External Labels</label>');
            h = h.concat('<input type="checkbox" name="external_label_cb" id="external_label_cb">');
            if (_treeProperties.internalNodeData) {
                h = h.concat('<label for="internal_label_cb">Internal Labels</label>');
                h = h.concat('<input type="checkbox" name="internal_label_cb" id="internal_label_cb">');
            }
            h = h.concat('<label for="external_nodes_cb">External Nodes</label>');
            h = h.concat('<input type="checkbox" name="external_label_cb" id="external_nodes_cb">');
            h = h.concat('<label for="internal_nodes_cb">Internal Nodes</label>');
            h = h.concat('<input type="checkbox" name="internal_label_cb" id="internal_nodes_cb">');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeZoomControl() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Zoom:</legend>');
            h = h.concat('<input type="button" value="Y+" name="zoom_in_y" id="zoom_in_y">');
            h = h.concat('<br>');
            h = h.concat('<input type="button" value="X-" name="zoom_out_x" id="zoom_out_x">');
            h = h.concat('<input type="button" value="F" name="zoom_to_fit" id="zoom_to_fit">');
            h = h.concat('<input type="button" value="X+" name="zoom_in_x" id="zoom_in_x">');
            h = h.concat('<br>');
            h = h.concat('<input type="button" value="Y-" name="zoom_out_y" id="zoom_out_y">');
            h = h.concat('</fieldset>');
            return h;
        }

        function makeSliders() {
            var h = "";
            h = h.concat('<p>External label size:');
            h = h.concat('<div id="external_font_size_slider"></div>');
            h = h.concat('</p>');
            if (_treeProperties.internalNodeData) {
                h = h.concat('<p>Internal label size:');
                h = h.concat('<div id="internal_font_size_slider"></div>');
                h = h.concat('</p>');
            }
            if (_treeProperties.branchLengths || _treeProperties.confidences) {
                h = h.concat('<p>Branch label size:');
                h = h.concat('<div id="branch_data_font_size_slider"></div>');
                h = h.concat('</p>');
            }
            h = h.concat('<p>Node size:');
            h = h.concat('<div id="node_size_slider"></div>');
            h = h.concat('</p>');
            h = h.concat('<p>Branch width:');
            h = h.concat('<div id="branch_width_slider"></div>');
            h = h.concat('</p>');
            return h;
        }

        function makeSearchBoxes() {
            var h = "";
            h = h.concat('Search (A)<br> <input type="text" name="search0" id="search0"><br>');
            h = h.concat('Search (B)<br> <input type="text" name="search1" id="search1"><br>');
            return h;
        }


        function makeAutoCollapse() {
            var h = "";
            h = h.concat('<fieldset>');
            h = h.concat('<legend>Collapse by Node Depth</legend>');
            h = h.concat('<input type="button" value="-" name="decr_depth_collapse_level" id="decr_depth_collapse_level">');
            h = h.concat('<input type="text"  name="depth_collapse_label" id="depth_collapse_label">');

            h = h.concat('<input type="button" value="+" name="incr_depth_collapse_level" id="incr_depth_collapse_level">');
            h = h.concat('</fieldset>');
            if (_treeProperties.branchLengths) {
                h = h.concat('<fieldset>');
                h = h.concat('<legend>Collapse by Length</legend>');
                h = h.concat('<input type="button" value="-" name="decr_rank_collapse_level" id="decr_rank_collapse_level">');
                h = h.concat('<input type="text"  name="bl_collapse_label" id="bl_collapse_label">');
                h = h.concat('<input type="button" value="+" name="incr_rank_collapse_level" id="incr_rank_collapse_level">');
                h = h.concat('</fieldset>');
            }
            return h;
        }


        function makeVisualControls() {
            var h = "";
            h = h.concat('<div id="accordion">');
            h = h.concat('<h3>Special</h3>');
            h = h.concat('<form action="#">');
            h = h.concat('<label for="label_color_select_menu">Label Color</label>');
            h = h.concat('<br>');
            h = h.concat('<select name="label_color_select_menu" id="label_color_select_menu">');
            h = h.concat(' </select>');
            h = h.concat('</form>');
            h = h.concat('</div>');
            return h;
        }
    }

    function initializeGui() {

        setRadioButtonValue('radio-phylogram', _options.phylogram);
        setRadioButtonValue('radio-cladogram', !_options.phylogram);
        setCheckboxValue('node_name_cb', _options.showNodeName);
        setCheckboxValue('taxonomy_cb', _options.showTaxonomy);
        setCheckboxValue('sequence_cb', _options.showSequence);
        setCheckboxValue('confidence_values_cb', _options.showConfidenceValues);
        setCheckboxValue('branch_length_values_cb', _options.showBranchLengthValues);
        setCheckboxValue('internal_label_cb', _options.showInternalLabels);
        setCheckboxValue('external_label_cb', _options.showExternalLabels);
        setCheckboxValue('internal_nodes_cb', _options.showInternalNodes);
        setCheckboxValue('external_nodes_cb', _options.showExternalNodes);
        initializeVisualizationMenu();
    }


    function initializeVisualizationMenu() {
        if (_dataForVisualization && Object.keys(_dataForVisualization).length) {
            $("select#label_color_select_menu").append($("<option>")
                .val("none")
                .html("none")
            );

            if (_dataForVisualization["distribution"]) {
                $("select#label_color_select_menu").append($("<option>")
                    .val("distribution")
                    .html("distribution")
                );
            }
            if (_dataForVisualization["vipr:host"]) {
                $("select#label_color_select_menu").append($("<option>")
                    .val("vipr:host")
                    .html("host")
                );
            }
            if (_dataForVisualization["vipr:drug"]) {
                $("select#label_color_select_menu").append($("<option>")
                    .val("vipr:drug")
                    .html("antiviral drug")
                );
            }

        }
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
        $("#depth_collapse_label")
            .val(" " + v);
    }

    function updateBranchLengthCollapseBranchLengthDisplay() {
        var v = obtainBranchLengthCollapseBranchLengthValue();
        $("#bl_collapse_label")
            .val(v);
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

    /*function obtainRankCollapseDepthValue() {
     if ( !_treeData || _root) {
     return "";
     }
     var p = _treeData;
     if ( forester.calcSumOfExternalDescendants(_root) < 3 ) {
     return "off";
     }
     else {
     final String ranks[] = PhylogenyMethods.obtainPresentRanksSorted( p );
     if ( ranks.length < 1 ) {
     return "off";
     }
     else if ( tp.getRankCollapseRankValue() < 0 ) {
     tp.setRankCollapseRankValue( ranks.length - 1 );
     return "off";
     }
     else if ( tp.getRankCollapseRankValue() == ( ranks.length - 1 ) ) {
     return "off";
     }
     }
     return String.valueOf( tp.getRankCollapseRankValue() );
     }*/

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
})();


