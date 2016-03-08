'use strict';
var fs = require('fs');
var cpTrans = require('./bower_components/viscompass/src/trans/trans');

var specs = JSON.parse(fs.readFileSync('js/sampled-specs.json','utf8'));
var ruleSet = JSON.parse(fs.readFileSync('ruleSet.json','utf8'));
var transitionSets = [];


for (var i = 0; i < specs.length; i++) {
  transitionSets.push([]);
  for (var j = i; j < specs.length; j++) {
    transitionSets[i].push(cpTrans.transitionSet(specs[i], specs[j], ruleSet, { omitIncludeRawDomin: true }));
  }
}


var getSampledSpecsFile = "var specs = ";
fs.writeFileSync('./js/get-sampled-specs.js',getSampledSpecsFile + JSON.stringify(specs) + ";");


var transitionSetsFile = "var transitionSets = ";
fs.writeFileSync('./js/get-sampled-transitionSets.js',transitionSetsFile + JSON.stringify(transitionSets) + ";");
