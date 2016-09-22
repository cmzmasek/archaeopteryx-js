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

"use strict";

var fs = require('fs');
var pp = require('./lib/phyloxml_parser').phyloXmlParser;
var forester = require('../forester').forester;

if (!forester) {
    throw "no forester.js";
}

var t0 = require('path').join(__dirname, "./data/t0.xml");
var t1 = require('path').join(__dirname, "./data/t1.xml");

console.log("getTreeRoot                : " + ( testGetTreeRoot() === true ? "pass" : "FAIL" ));
console.log("preOrderTraversal          : " + ( testPreOrderTraversal() === true ? "pass" : "FAIL" ));
console.log("preOrderTraversalAll       : " + ( testPreOrderTraversalAll() === true ? "pass" : "FAIL" ));
console.log("reRoot                     : " + ( testReRoot() === true ? "pass" : "FAIL" ));
console.log("parseNewHampshire          : " + ( testParseNewHampshire() === true ? "pass" : "FAIL" ));


function readPhyloXmlFromFile(fileName) {
    var text = fs.readFileSync(fileName, 'utf8');
    return pp.parse(text, {trim: true, normalize: true});
}


function testGetTreeRoot() {
    var phy0 = readPhyloXmlFromFile(t0)[0];
    var phy = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy0);
    forester.addParents(phy);

    var root0 = forester.getTreeRoot(phy0);

    if (root0.children) {
        return false;
    }
    if (root0.name !== 'node0') {
        return false;
    }

    var root1 = forester.getTreeRoot(phy);
    if (root1.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root1.children.length !== 2) {
        return false;
    }

    var root2 = forester.getTreeRoot(root1);
    if (root2.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root2.children.length !== 2) {
        return false;
    }

    var root3 = forester.getTreeRoot(root2.children[0]);
    if (root3.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root3.children.length !== 2) {
        return false;
    }

    var root4 = forester.getTreeRoot(forester.findByNodeName(phy, "22_MOUSE")[0]);
    if (root4.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root4.children.length !== 2) {
        return false;
    }

    var root5 = forester.getTreeRoot(forester.findByNodeName(phy, "3_BRAFL")[0]);
    if (root5.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    if (root5.children.length !== 2) {
        return false;
    }

    return true;
}


function testPreOrderTraversal() {
    var phy0 = readPhyloXmlFromFile(t0)[0];
    var phy = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy);
    forester.addParents(phy0);
    var c = 0;
    forester.preOrderTraversal(phy, function () {
        ++c;
    });
    if (c !== 56) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(forester.getTreeRoot(phy), function () {
        ++c;
    });
    if (c !== 55) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(forester.findByNodeName(phy, "3_BRAFL")[0], function () {
        ++c;
    });
    if (c !== 1) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(forester.findByNodeName(phy, "my name!")[0], function () {
        ++c;
    });
    if (c !== 3) {
        return false;
    }

    c = 0;
    forester.preOrderTraversal(phy0, function () {
        ++c;
    });

    if (c !== 2) {
        return false;
    }

    return true;
}

function testPreOrderTraversalAll() {
    var phy = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy);
    var c = 0;
    forester.preOrderTraversalAll(phy, function () {
        ++c;
    });
    if (c !== 56) {
        return false;
    }

    c = 0;
    forester.preOrderTraversalAll(forester.getTreeRoot(phy), function () {
        ++c;
    });
    if (c !== 55) {
        return false;
    }

    c = 0;
    forester.preOrderTraversalAll(forester.findByNodeName(phy, "3_BRAFL")[0], function () {
        ++c;
    });
    if (c !== 1) {
        return false;
    }

    c = 0;
    forester.preOrderTraversalAll(forester.findByNodeName(phy, "my name!")[0], function () {
        ++c;
    });
    if (c !== 3) {
        return false;
    }

    return true;
}

function testReRoot() {
    var phy1 = readPhyloXmlFromFile(t1)[0];
    forester.addParents(phy1);

    var root1 = forester.getTreeRoot(phy1);
    var newRoot = forester.findByTaxonomyCode(phy1, "TRICA")[0];
    //console.log(newRoot);
    forester.reRoot(phy1, root1, newRoot, -1);

    var root5 = forester.getTreeRoot(phy1);
    //console.log(root5);
    if (root5.taxonomies[0].scientific_name !== 'Metazoa') {
        return false;
    }
    //console.log(phy1);

    forester.preOrderTraversalAll(phy1, function (n) {
        //console.log(n.name);
    });


    return true;
}


function testParseNewHampshire() {
    var nh0 = "";
    var nh1 = "();";
    var nh2 = "(a);";
    var nh3 = "(a:0.000001);";
    var nh4 = "(,);";
    var nh5 = "((a));";
    var nh6 = "(a,b);";
    var nh7 = "((a:0.001,b:0.000001),c:0.1);";
    var nh8 = "((a:0.001,b:0.000001,c:1)abc:0.1,d:0.1);";
    var nh9 = "(((a,b,c),(d,e)),f)r;";
    var nh10 = "((()));";
    var nh11 = "(((,),),);";
    var nh12 = "(((((((((22_MOUSE:0.05998,Apaf-1_HUMAN:0.01825)Euarchontoglires:0.09825,11_CHICK:0.15226):0.02309,16_XENLA:0.4409):0.06584,15_TETNG:0.37438)Euteleostomi:0.28901,((1_BRAFL:0.26131,18_NEMVE:0.38014):0.10709,23_STRPU:0.48179):0.01594):0.22058,(26_STRPU:0.36374,25_STRPU:0.33137)'Strongylocentrotus purpuratus':0.34475):0.26168,(CED4_CAEEL:0.13241,31_CAEBR:0.04777)Caenorhabditis:1.31498):0.07466,(((28_DROPS:0.1732,Dark_DROME:0.18863)Sophophora:0.76898,29_AEDAE:0.86398)Diptera:0.24915,30_TRICA:0.97698)Endopterygota:0.13172):0.18105,((((((34_BRAFL:0.093,35_BRAFL:0.08226):0.93134,8_BRAFL:0.58563)'Branchiostoma floridae':0.21648,(20_NEMVE:0.71946,21_NEMVE:0.9571)'Nematostella vectensis':0.28437):0.09305,9_BRAFL:1.09612):0.54836,((3_BRAFL:0.48766,2_BRAFL:0.65293)'Branchiostoma floridae':0.22189,19_NEMVE:0.57144):0.34914):0.15891,((37_BRAFL:0.21133,36_BRAFL:0.16225):0.92214,33_BRAFL:0.8363)'Branchiostoma floridae':0.43438):0.18105)Metazoa;";

    var phy0 = forester.parseNewHampshire(nh0);
    var phy1 = forester.parseNewHampshire(nh1);
    var phy2 = forester.parseNewHampshire(nh2);
    var phy3 = forester.parseNewHampshire(nh3);
    var phy4 = forester.parseNewHampshire(nh4);
    var phy5 = forester.parseNewHampshire(nh5);
    var phy6 = forester.parseNewHampshire(nh6);
    var phy7 = forester.parseNewHampshire(nh7);
    var phy8 = forester.parseNewHampshire(nh8);
    var phy9 = forester.parseNewHampshire(nh9);
    var phy10 = forester.parseNewHampshire(nh10);
    var phy11 = forester.parseNewHampshire(nh11);
    var phy12 = forester.parseNewHampshire(nh12);

    if (forester.toNewHamphshire(phy0) !== nh0) {
        return false;
    }
    if (forester.toNewHamphshire(phy1) !== nh1) {
        return false;
    }
    if (forester.toNewHamphshire(phy2) !== nh2) {
        return false;
    }
    if (forester.toNewHamphshire(phy3) !== nh3) {
        return false;
    }
    if (forester.toNewHamphshire(phy4) !== nh4) {
        return false;
    }
    if (forester.toNewHamphshire(phy5) !== nh5) {
        return false;
    }
    if (forester.toNewHamphshire(phy6) !== nh6) {
        return false;
    }
    if (forester.toNewHamphshire(phy7) !== nh7) {
        return false;
    }
    if (forester.toNewHamphshire(phy8) !== nh8) {
        return false;
    }
    if (forester.toNewHamphshire(phy9) !== nh9) {
        return false;
    }
    if (forester.toNewHamphshire(phy10) !== nh10) {
        return false;
    }
    if (forester.toNewHamphshire(phy11) !== nh11) {
        return false;
    }
    if (forester.toNewHamphshire(phy12) !== nh12) {
        return false;
    }
    return true;
}


