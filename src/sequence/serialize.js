'use strict';

// If you linked to yh/neighbors branch, then you can activate this line instead of using compas.js

// var cp = require('./lib/compass.js');
var BEA = require('./lib/BEA.js');
var TSP = require('./lib/TSP.js');
var d3 = require('./js/d3.min.js');
var PO = require('./lib/PatternOptimizer.js');
var tb = require('./lib/TieBreaker.js');

function serialize(specs, ruleSet, options, callback){

  
  function distanceWithPattern(dist, patternScore, filterCost){
    return (dist + filterCost / 1000) * ( 1 - patternScore);
  }

  var transitionSetsFromEmptyVis = getTransitionSetsFromSpec({ "mark":"null", "encoding": {} }, specs, ruleSet);
  console.log(transitionSetsFromEmptyVis);
  
  //Brute force version
  if (!options.fixFirst) {
    var startingSpec = { "mark":"null", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  var transitionSets = getTransitionSets(specs, ruleSet);
  transitionSets = extendTransitionSets(transitionSets);
  console.log(transitionSets);
  var TSPResult = TSP.TSP(transitionSets, "cost", options.fixFirst===true ? 0 : undefined);
  var TSPResultAll = TSPResult.all.filter(function(seqWithDist){
    // return true;
    return seqWithDist.sequence[0] === 0;
  }).map(function(tspR){
    // var sequence = tspR.sequence.splice(1,tspR.sequence.length-1)
    var sequence = tspR.sequence;
    var transitionSet = [];
    for (var i = 0; i < sequence.length-1; i++) {
      transitionSet.push(transitionSets[sequence[i]][sequence[i+1]]);
    };
    var pattern = transitionSet.map(function(r){ return r.id; });
    var POResult = PO.PatternOptimizer(pattern, transitionSets.uniq);

    var result = { 
              "sequence" : sequence,
              "transitionSet" : transitionSet,
              "distance" : tspR.distance,
              "POResult" : POResult,
              "patternScore" : !!POResult[0] ? POResult[0].patternScore : 0,
              "specs" : sequence.map(function(index){
                          return specs[index];
                        })
           };
    var tbResult = tb.TieBreaker(result, transitionSetsFromEmptyVis);
    result.tiebreakCost = tbResult.tiebreakCost;
    result.tiebreakReasons = tbResult.reasons;
    result.distanceWithPattern = distanceWithPattern(result.distance, result.patternScore, tbResult.tiebreakCost);
    return result;
  }).sort(function(a,b){
    if (a.distanceWithPattern > b.distanceWithPattern) {
      return 1;
    }
    if (a.distanceWithPattern < b.distanceWithPattern) {
      return -1;
    } else {
      return a.sequence.join(',') > b.sequence.join(',') ? 1 : -1;       
    } 
    return 0;
  });
  
  var serializedSpecs = [];
  var minDistanceWithPattern = TSPResultAll[0].distanceWithPattern;
  for (var i = 0; i < TSPResultAll.length; i++) {
    if(TSPResultAll[i].distanceWithPattern === minDistanceWithPattern ){
      TSPResultAll[i].isOptimum = true;
      // serializedSpecs.push(TSPResultAll[i]);
    }
    else { 
      break; 
    }
  }
  var returnValue = TSPResultAll;

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
function getTransitionSetsFromSpec( spec, specs, ruleSet){
  var transitionSets = [];
  for (var i = 0; i < specs.length; i++) {
    transitionSets.push(cp.trans.transitionSet(specs[i], spec, ruleSet, { omitIncludeRawDomin: true }));
  }
  return transitionSets;
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
  var uniqTransitionSets = [];
  var flatCosts = transitionSets.reduce(function(prev,curr){
    for (var i = 0; i < curr.length; i++) {
      prev.push(curr[i].cost);
      var transitionSetSH = transitionShorthand(curr[i]);
      var index = uniqTransitionSets.map(function(tr){ return tr.shorthand; }).indexOf(transitionSetSH);
      // var index = uniqTransitionSets.indexOf(transitionSetSH.join('|'));
      if ( index === -1) {
        curr[i]["id"] = uniqTransitionSets.push({tr: curr[i], shorthand: transitionSetSH}) - 1;  
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
  transitionSets.uniq = uniqTransitionSets;
  return transitionSets
}
function transitionShorthand(transition){
  return transition.marktype
                    .concat(transition.transform)
                    .concat(transition.encoding)
                    .map(function(tr){ 
                      if (tr.detail) {
                        if (tr.name === "MODIFY_FILTER") {
                          return tr.name + '(' + JSON.stringify(tr.detail.field) + ')';
                        }
                        return tr.name + '(' + JSON.stringify(tr.detail) + ')';
                      }
                      return tr.name;
                    })
                    .sort()
                    .join('|');
                    
}

module.exports = {
  serialize: serialize
};
