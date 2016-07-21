'use strict';

// If you linked to yh/neighbors branch, then you can activate this line instead of using compas.js

// var cp = require('./lib/compass.js');
var BEA = require('./lib/BEA.js');
var TSP = require('./lib/TSP.js');
var d3 = require('./js/d3.min.js');
var LRP = require('./lib/LRP.js');

function serialize(specs, ruleSet, options, callback){

  
  function point(dist, patternScore){
    return 1 / ( dist * (1 - patternScore + 0.0001) );
  }

  //Brute force version
  if (!options.fixFirst) {
    var startingSpec = { "mark":"point", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  var transitionSets = getTransitionSets(specs, ruleSet);
  transitionSets = extendTransitionSets(transitionSets);
  var TSPResult = TSP.TSP(transitionSets, "cost", options.fixFirst===true ? 0 : undefined);
  var TSPResultAll = TSPResult.all.filter(function(seqWithDist){
    return seqWithDist.sequence[0] === 0;
  }).map(function(tspR){
    // var sequence = tspR.sequence.splice(1,tspR.sequence.length-1)
    var sequence = tspR.sequence;
    var transitionSet = [];
    for (var i = 0; i < sequence.length-1; i++) {
      transitionSet.push(transitionSets[sequence[i]][sequence[i+1]]);
    };
    var pattern = transitionSet.map(function(r){ return r.id; });
    var LRPResult = LRP.LRP(pattern,'coverage');
    var result = { 
              "sequence" : sequence,
              "transitionSet" : transitionSet,
              "distance" : tspR.distance,
              "patternScore" : !!LRPResult[0] ? LRPResult[0].coverage : 0,
              "specs" : sequence.map(function(index){
                          return specs[index];
                        })
           };
    result.globalScore = point(result.distance, result.patternScore);
    return result;
  }).sort(function(a,b){
    if (a.globalScore < b.globalScore) {
      return 1;
    }
    if (a.globalScore > b.globalScore) {
      return -1;
    }
    return 0;
  });
  
  var serializedSpecs = [];
  var maxGlobalScore = TSPResultAll[0].globalScore;
  for (var i = 0; i < TSPResultAll.length; i++) {
    if(TSPResultAll[i].globalScore === maxGlobalScore){
      serializedSpecs.push(TSPResultAll[i]);
    }
    else { 
      break; 
    }
  }
 var returnValue = { all : TSPResultAll, best : serializedSpecs};

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
  callback(returnValue);
  return returnValue;
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
  var flatTransitionSets = [];
  var flatCosts = transitionSets.reduce(function(prev,curr){
    for (var i = 0; i < curr.length; i++) {
      prev.push(curr[i].cost);
      var transitionSetString = JSON.stringify(curr[i]);
      var index = flatTransitionSets.indexOf(transitionSetString);
      if ( index === -1) {
        curr[i]["id"] = flatTransitionSets.push(transitionSetString) - 1;  
      } else {
        curr[i]["id"] = index;
      }
      
    };
    return prev;
  }, []);
  
  var uniqueCosts = d3.set(flatCosts)
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
