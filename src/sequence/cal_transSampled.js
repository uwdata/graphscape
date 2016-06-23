'use strict';
var fs = require('fs');
// If you linked to yh/neighbors branch, then you can activate this line instead of using compas.js
var cp = require('./../../bower_components/viscompass')
// var cp = require('./../../lib/compass.js');
var cpTrans = cp.trans;

// Younghoon's Polestar bookmars
// var specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs_transform.json','utf8'));
// var specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs_transform.json','utf8'));
// var specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs_movies.json','utf8'));

//  visualizations corresponding to Jessica's paper
var specs = JSON.parse(fs.readFileSync('./../../data/sample03_filtering_specs.json','utf8'));


var ruleSet = JSON.parse(fs.readFileSync('./../../ruleSet.json','utf8'));
var transitionSets = [];
//
// var startingSpec = { "mark":"point", "encoding": {} };
// specs = [ startingSpec ].concat(specs);


for (var i = 0; i < specs.length; i++) {
  transitionSets.push([]);
  for (var j = 0; j < specs.length; j++) {
    transitionSets[i].push(cpTrans.transitionSet(specs[i], specs[j], ruleSet, { omitIncludeRawDomin: true }));
    console.log(i,j);
  }
}


fs.writeFileSync('specs.json',JSON.stringify(specs));
fs.writeFileSync('transitionSets.json',JSON.stringify(transitionSets));
