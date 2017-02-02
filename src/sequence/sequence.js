'use strict';

var trans = require('./../transition/trans.js');
var editOp = require('./../editOp/editOpSet.js');
var TSP = require('../../lib/TSP.js');
var d3 = require('d3');
var PO = require('./PatternOptimizer.js');
var tb = require('./TieBreaker.js');

function sequence(specs, options, editOpSet, callback){
  if (!editOpSet) {
    editOpSet = editOp.DEFAULT_EDIT_OPS;
  }

  function distanceWithPattern(dist, globalWeightingTerm, filterCost){
    return (dist + filterCost / 1000) * globalWeightingTerm;
  }

  var transitionSetsFromEmptyVis = getTransitionSetsFromSpec({ "mark":"null", "encoding": {} }, specs, editOpSet);

    if (!options.fixFirst) {
    var startingSpec = { "mark":"null", "encoding": {} };
    specs = [ startingSpec ].concat(specs);
  }

  var transitions = getTransitionSets(specs, editOpSet);
  transitions = extendTransitionSets(transitions);

  var TSPResult = TSP.TSP(transitions, "cost", options.fixFirst===true ? 0 : undefined);
  var TSPResultAll = TSPResult.all.filter(function(seqWithDist){
    return seqWithDist.sequence[0] === 0;
  }).map(function(tspR){

    var sequence = tspR.sequence;
    var transitionSet = [];
    for (var i = 0; i < sequence.length-1; i++) {
      transitionSet.push(transitions[sequence[i]][sequence[i+1]]);
    };
    var pattern = transitionSet.map(function(r){ return r.id; });
    var POResult = PO.PatternOptimizer(pattern, transitions.uniq);

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

  var sequencedSpecs = [];
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
function getTransitionSetsFromSpec( spec, specs, editOpSet){
  var transitions = [];
  for (var i = 0; i < specs.length; i++) {
    transitions.push(trans.transition(specs[i], spec, editOpSet, { omitIncludeRawDomin: true }));
  }
  return transitions;
}

function getTransitionSets(specs, editOpSet){
  var transitions = [];
  for (var i = 0; i < specs.length; i++) {
    transitions.push([]);
    for (var j = 0; j < specs.length; j++) {
      transitions[i].push(trans.transition(specs[i], specs[j], editOpSet, { omitIncludeRawDomin: true }));

    }
  }
  return transitions;
}

function extendTransitionSets(transitions){
  var uniqTransitionSets = [];
  var flatCosts = transitions.reduce(function(prev,curr){
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
    .range([0,uniqueCosts.length]);

  for (var i = 0; i < transitions.length; i++) {
    for (var j = 0; j < transitions[i].length; j++) {
      transitions[i][j]["start"] = i;
      transitions[i][j]["destination"] = j;
      transitions[i][j]["rank"] = Math.floor(rank(transitions[i][j].cost));
    }
  }
  transitions.uniq = uniqTransitionSets;
  return transitions
}
function transitionShorthand(transition){
  return transition.mark
                    .concat(transition.transform)
                    .concat(transition.encoding)
                    .map(function(tr){
                      if (tr.detail) {
                        if (tr.name === "MODIFY_FILTER") {
                          return tr.name + '(' + JSON.stringify(tr.detail.where) + ')';
                        }
                        return tr.name + '(' + JSON.stringify(tr.detail) + ')';
                      }
                      return tr.name;
                    })
                    .sort()
                    .join('|');

}
exports.sequence = sequence;
