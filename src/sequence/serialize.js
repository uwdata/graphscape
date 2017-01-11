'use strict';

var cp = require('./../transition/trans.js');
var rule = require('./../rule/ruleSet.js');
var TSP = require('../../lib/TSP.js');
var d3 = require('../../lib/d3.min.js');
var PO = require('./PatternOptimizer.js');
var tb = require('./TieBreaker.js');

function serialize(specs, options, ruleSet, callback){
  if (!ruleSet) {
    ruleSet = rule.DEFAULT_TRANSITIONS;
  }
  
  function distanceWithPattern(dist, globalWeightingTerm, filterCost){
    return (dist + filterCost / 1000) * globalWeightingTerm;
  }

  var transitionSetsFromEmptyVis = getTransitionSetsFromSpec({ "mark":"null", "encoding": {} }, specs, ruleSet);
    
    if (!options.fixFirst) {
    var startingSpec = { "mark":"null", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  var transitionSets = getTransitionSets(specs, ruleSet);
  transitionSets = extendTransitionSets(transitionSets);
  
  var TSPResult = TSP.TSP(transitionSets, "cost", options.fixFirst===true ? 0 : undefined);
  var TSPResultAll = TSPResult.all.filter(function(seqWithDist){
    return seqWithDist.sequence[0] === 0;
  }).map(function(tspR){
    
    var sequence = tspR.sequence;
    var transitionSet = [];
    for (var i = 0; i < sequence.length-1; i++) {
      transitionSet.push(transitionSets[sequence[i]][sequence[i+1]]);
    };
    var pattern = transitionSet.map(function(r){ return r.id; });
    var POResult = PO.PatternOptimizer(pattern, transitionSets.uniq);

    var result = { 
              "sequence" : sequence,
              "transitions" : transitionSet,
              "sumOfTransitionCosts" : tspR.distance,
              "patterns" : POResult,
              "globalWeightingTerm" : !!POResult[0] ? 1 - POResult[0].patternScore : 1,
              "charts" : sequence.map(function(index){
                          return specs[index];
                        })
           };
    var tbResult = tb.TieBreaker(result, transitionSetsFromEmptyVis);
    result.filterSequenceCost = tbResult.tiebreakCost;
    result.filterSequenceCostReasons = tbResult.reasons;
    result.sequenceCost = distanceWithPattern(result.sumOfTransitionCosts, result.globalWeightingTerm, tbResult.tiebreakCost);
    return result;
  }).sort(function(a,b){
    if (a.sequenceCost > b.sequenceCost) {
      return 1;
    }
    if (a.sequenceCost < b.sequenceCost) {
      return -1;
    } else {
      return a.sequence.join(',') > b.sequence.join(',') ? 1 : -1;       
    } 
    return 0;
  });
  
  var serializedSpecs = [];
  var minSequenceCost = TSPResultAll[0].sequenceCost;
  for (var i = 0; i < TSPResultAll.length; i++) {
    if(TSPResultAll[i].sequenceCost === minSequenceCost ){
      TSPResultAll[i].isOptimum = true;
    }
    else { 
      break; 
    }
  }
  var returnValue = TSPResultAll;

  
  if(callback){
    callback(returnValue);
  }
  return returnValue;
}
function getTransitionSetsFromSpec( spec, specs, ruleSet){
  var transitionSets = [];
  for (var i = 0; i < specs.length; i++) {
    transitionSets.push(cp.transitionSet(specs[i], spec, ruleSet, { omitIncludeRawDomin: true }));
  }
  return transitionSets;
}

function getTransitionSets(specs, ruleSet){
  var transitionSets = [];
  for (var i = 0; i < specs.length; i++) {
    transitionSets.push([]);
    for (var j = 0; j < specs.length; j++) {
      transitionSets[i].push(cp.transitionSet(specs[i], specs[j], ruleSet, { omitIncludeRawDomin: true }));
      
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
exports.serialize = serialize;
