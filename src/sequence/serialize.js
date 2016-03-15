'use strict';
var fs = require('fs');
// If you linked to yh/neighbors branch, then you can activate this line instead of using compas.js
// var cp = require('./../../bower_components/viscompass')
var cp = require('./lib/compass.js');
var BEA = require('./lib/BEA.js');
var d3 = require('./js/d3.min.js');
var cpTrans = cp.trans;
var specs, ruleSet;

if (process.argv.length === 4) {
  specs = JSON.parse(fs.readFileSync(process.argv[2]));
  ruleSet = JSON.parse(fs.readFileSync(process.argv[3]));
}
else {
  // Younghoon's Polestar bookmars
  // specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs.json','utf8'));
  // Younghoon's Polestar bookmars
  specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs_randomly_picked.json','utf8'));
  // Visualizations corresponding to Jessica's paper
  // specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs_prev_paper.json','utf8'));
  ruleSet = JSON.parse(fs.readFileSync('./../../ruleSet.json','utf8'));

}

function serialize(specs, ruleSet, options){

  if (options.fixFirst) {
    var startingSpec = { "mark":"point", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  var transitionSets = getTransitionSets(specs, ruleSet);
  transitionSets = extendTransitionSets(transitionSets);

  var transitionCostMatrix = new BEA.Matrix("rank");
  transitionCostMatrix.import(JSON.parse(JSON.stringify(transitionSets)));
  var sortedTransitionSetsByRank = BEA.BEA(transitionCostMatrix, options).rows;



  var serializedSpecs = sortedTransitionSetsByRank[0].map(function(transitionSet){
    console.log(transitionSet.destination);
    return specs[transitionSet.destination];
  });

  return serializedSpecs;
}

function getTransitionSets(specs, ruleSet){
  var transitionSets = [];
  for (var i = 0; i < specs.length; i++) {
    transitionSets.push([]);
    for (var j = 0; j < specs.length; j++) {
      transitionSets[i].push(cpTrans.transitionSet(specs[i], specs[j], ruleSet, { omitIncludeRawDomin: true }));
      process.stdout.write('.');
    }
  }
  return transitionSets;
}

function extendTransitionSets(transitionSets){
  var flattendCosts = transitionSets.reduce(function(prev,curr){
    for (var i = 0; i < curr.length; i++) {
      prev.push(curr[i].cost);
    };
    return prev;
  }, []);
  var uniqueCosts = d3.set(flattendCosts)
                      .values()
                      .map(function(val){ return Number(val); })
                      .sort(function(a,b){ return a-b;});

  var rank = d3.scale.ordinal()
    .domain(uniqueCosts)
    .rangePoints([0,uniqueCosts.length]);

  for (var i = 0; i < transitionSets.length; i++) {
    for (var j = 0; j < transitionSets[i].length; j++) {
      transitionSets[i][j]["start"] = i;
      transitionSets[i][j]["destination"] = j;
      transitionSets[i][j]["rank"] = Math.floor(rank(transitionSets[i][j].cost));
    }
  }
  return transitionSets
}

var serializedSpecs = serialize(specs, ruleSet, {fixFirst: true});
fs.writeFileSync('serialized_specs.json',JSON.stringify(serializedSpecs));
console.log(serializedSpecs);
