'use strict';
var fs = require('fs');
// If you linked to yh/neighbors branch, then you can activate this line instead of using compas.js
var cp = require('./../../bower_components/viscompass')
// var cp = require('./lib/compass.js');
var BEA = require('./lib/BEA.js');
var TSP = require('./lib/TSP.js');
var d3 = require('./js/d3.min.js');
var cpTrans = cp.trans;
var specs, ruleSet, specMap;
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
  
  // specs = JSON.parse(fs.readFileSync('./../../data/charts for evaluation/visSet_Transpose vs Filter.json','utf8'));
  specs = JSON.parse(fs.readFileSync('./../../data/charts for evaluation/visSet_Cars.json','utf8'));
  specMap = [28,25,26,23,24,27];
  ruleSet = JSON.parse(fs.readFileSync('./../../ruleSet.json','utf8'));

  transitionSetsFileName = "transitionSets";
  fixFirst = false;
}

function serialize(specs, ruleSet, options){

  //Brute force version

  if (!options.fixFirst) {
    var startingSpec = { "mark":"point", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  fs.writeFileSync('result/specs.json',JSON.stringify(specs));  
  var transitionSets = getTransitionSets(specs, ruleSet);

  
  fs.writeFileSync('result/'+transitionSetsFileName, JSON.stringify(transitionSets));
  transitionSets = extendTransitionSets(transitionSets);
  fs.writeFileSync('result/specs.json',JSON.stringify(specs));
  
  var TSPResults = TSP.TSP(transitionSets, "cost", options.fixFirst===true ? 0 : undefined);
  var TSPResult = TSPResults.out;
  TSPResults.all = TSPResults.all.filter(function(seqWithDist){
    return seqWithDist.sequence[0] === 0;
  }).sort(function(a,b){
    if (a.distance > b.distance) {
      return 1;
    }
    if (a.distance < b.distance) {
      return -1;
    }
    return 0;
  }).map(function(seqWithDist){
    return { 
              sequence : seqWithDist.sequence.splice(1,seqWithDist.sequence.length-1).map(function(val){ return specMap[val-1];}),
              distance : seqWithDist.distance 
           };
  }));

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
