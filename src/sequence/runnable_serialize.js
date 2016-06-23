'use strict';
var fs = require('fs');
// If you linked to yh/neighbors branch, then you can activate this line instead of using compas.js
var cp = require('./../../bower_components/viscompass')
// var cp = require('./lib/compass.js');
var BEA = require('./lib/BEA.js');
var TSP = require('./lib/TSP.js');
var d3 = require('./js/d3.min.js');
var cpTrans = cp.trans;
var specs, ruleSet;
var transitionSetsFileName, fixFirst;

if (process.argv.length === 4) {
  specs = JSON.parse(fs.readFileSync(process.argv[2]));
  ruleSet = JSON.parse(fs.readFileSync(process.argv[3]));
}
else if (process.argv.length === 5){
  specs = JSON.parse(fs.readFileSync(process.argv[2]));
  ruleSet = JSON.parse(fs.readFileSync(process.argv[3]));
  transitionSetsFileName = process.argv[4];
}
else if (process.argv.length === 6){
  specs = JSON.parse(fs.readFileSync(process.argv[2]));
  ruleSet = JSON.parse(fs.readFileSync(process.argv[3]));
  transitionSetsFileName = process.argv[4];
  fixFirst = process.argv[5] ==='true' ? true : false;
}
else {
  // Younghoon's Polestar bookmars
  // specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs.json','utf8'));
  // Younghoon's Polestar bookmars
  specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs_randomly_picked.json','utf8'));
  // Visualizations corresponding to Jessica's paper
  // specs = JSON.parse(fs.readFileSync('./../../data/sampled_specs_prev_paper.json','utf8'));
  ruleSet = JSON.parse(fs.readFileSync('./../../ruleSet.json','utf8'));

  transitionSetsFileName = "transitionSets";
}

function serialize(specs, ruleSet, options){

  //Brute force version

  if (!options.fixFirst) {
    var startingSpec = { "mark":"point", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  fs.writeFileSync('result/specs.json',JSON.stringify(specs));  
  var transitionSets = getTransitionSets(specs, ruleSet);
  console.log(transitionSets[0][1]);
  console.log(transitionSets[0][2]);
  fs.writeFileSync('result/'+transitionSetsFileName, JSON.stringify(transitionSets));
  transitionSets = extendTransitionSets(transitionSets);
  fs.writeFileSync('result/specs.json',JSON.stringify(specs));
  
  var TSPResult = TSP.TSP(transitionSets, "rank", options.fixFirst===true ? 0 : undefined);
  fs.writeFileSync('result/TSPResult.json',JSON.stringify(TSPResult));

  var serializedSpecs = TSPResult.map(function(optSequence){
    // console.log(optSequence);
    return optSequence.sequence.map(function(index){
      return specs[index];
    });
  });

  // if (options.fixFirst) {
  //   var startingSpec = { "mark":"point", "encoding": {} };
  //   specs = [ startingSpec ].concat(specs);
  // }
  // fs.writeFileSync('result/specs.json',JSON.stringify(specs));

  // var transitionSets = getTransitionSets(specs, ruleSet);
  // transitionSets = extendTransitionSets(transitionSets);
  // fs.writeFileSync(transitionSetsFileNameresult/, JSON.stringify(transitionSets));
  
  // var transitionCostMatrix = new BEA.Matrix("rank");
  // transitionCostMatrix.import(JSON.parse(JSON.stringify(transitionSets)));
  // var sortedTransitionSetsByRank = BEA.BEA(transitionCostMatrix, options).rows;

  // var serializedSpecs = sortedTransitionSetsByRank[0].map(function(transitionSet){
  //   console.log(transitionSet.destination);
  //   return specs[transitionSet.destination];
  // });

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

var serializedSpecs = serialize(specs, ruleSet, {"fixFirst": fixFirst});

fs.writeFileSync('result/serialized_specs.json',JSON.stringify(serializedSpecs));
// console.log(serializedSpecs);
