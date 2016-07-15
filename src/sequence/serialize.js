'use strict';

// If you linked to yh/neighbors branch, then you can activate this line instead of using compas.js

// var cp = require('./lib/compass.js');
var BEA = require('./lib/BEA.js');
var TSP = require('./lib/TSP.js');
var d3 = require('./js/d3.min.js');

function serialize(specs, ruleSet, options, callback){

  
  //Brute force version
  if (!options.fixFirst) {
    var startingSpec = { "mark":"point", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  var transitionSets = getTransitionSets(specs, ruleSet);
  console.log(transitionSets);
  transitionSets = extendTransitionSets(transitionSets);
  var TSPResult = TSP.TSP(transitionSets, "cost", options.fixFirst===true ? 0 : undefined).out;
  

  var serializedSpecs = TSPResult.filter(function(item){
    return item.sequence[0] === 0;
  }).map(function(optSequence){
    // console.log(optSequence);
    optSequence.sequence.splice(0,1);
    return { 
            "distance": optSequence.distance,
            "sequence": optSequence.sequence,
            "specs" : optSequence.sequence.map(function(index){
                        return specs[index];
                      })
           };
  });

  // if (options.fixFirst) {
  //   var startingSpec = { "mark":"point", "encoding": {} };
  //   specs = [ startingSpec ].concat(specs);
  // }
  // fs.writeFileSync('result/specs.json',JSON.stringify(specs));

  
  // transitionSets = extendTransitionSets(transitionSets);
  // fs.writeFileSync(transitionSetsFileNameresult/, JSON.stringify(transitionSets));
  
  // var transitionCostMatrix = new BEA.Matrix("rank");
  // transitionCostMatrix.import(JSON.parse(JSON.stringify(transitionSets)));
  // var sortedTransitionSetsByRank = BEA.BEA(transitionCostMatrix, options).rows;

  // var serializedSpecs = sortedTransitionSetsByRank[0].map(function(transitionSet){
  //   console.log(transitionSet.destination);
  //   return specs[transitionSet.destination];
  // });
  callback(serializedSpecs);
  return serializedSpecs;
}

function getTransitionSets(specs, ruleSet){
  var transitionSets = [];
  for (var i = 0; i < specs.length; i++) {
    transitionSets.push([]);
    for (var j = 0; j < specs.length; j++) {
      transitionSets[i].push(cp.trans.transitionSet(specs[i], specs[j], ruleSet, { omitIncludeRawDomin: true }));
      
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


module.exports = {
  serialize: serialize
};
