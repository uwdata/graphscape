'use strict'
//PatternOptimizer
function score(coverage, uniqTransitionSets, appear, patternArray){
  var R = patternArray.reduce(function(prev, curr){
    prev += uniqTransitionSets[curr].tr.cost
    return prev;
  },0);
  R = patternArray.length * 4 / R;
  R = R > 1 ? 1 : R;

  return Math.round(1000000*(1-1/appear.length)*R*coverage)/1000000;
}

function scoreSimple(coverage, patternLength, inputLength, similarity){
  var w_c = 1, w_l = 0;

  return (coverage * w_c + patternLength / inputLength * w_l) / (w_c + w_l) * similarity;
}

function PatternOptimizer(inputArray, uniqTransitionSets) {
  var Optimized = [], maxScore = 0;
  // var inputDistance = distance(inputArray, uniqTransitionSets);

  for (var l = 1; l <= inputArray.length; l++) {
    
    for (var i = 0; i < inputArray.length-l+1; i++) {
      var appear = [i];
      var similarity = 0;
      var similarityCurr = 0;
      for (var j = 0; j < inputArray.length-l+1; j++) {
        similarityCurr = isSameSub(inputArray, i, i + (l-1), j, j + (l-1), uniqTransitionSets);
        if ( i !== j && similarityCurr ) {        
        // if ( i !== j && similarity = isSameSub(inputArray, i, i + (l-1), j, j + (l-1))) {        
          appear.push(j);
          similarity += similarityCurr;
        }
      }
      similarity = appear.length > 1 ? similarity / (appear.length-1) : similarity;
      var overlap = false;
      
      var rythmic = true;
      var complex = false;
      var period = 0;
      var newPattern = dup(inputArray).splice(i,l);

      for (var k = 0; k < appear.length-1; k++) {
        if(appear[k+1] - appear[k] < l){
          overlap = true;
          break;
        }

        // if(period !== 0 && period !== appear[k+1] - appear[k]){
        //   rythmic = false;
        //   break;
        // }
        // period = appear[k+1] - appear[k];
      }

      //cyclic?
      for (var k = 0; k < newPattern.length; k++) {
        if(uniqTransitionSets[newPattern[k]].tr.cost >= 4.41*2 ){
          complex = true;
          break;
        }
      };
      
      // if (appear.length > 1 && !overlap && rythmic ){
      if (appear.length > 1 && !overlap && !complex){
        complex = false;
        
        var RPcoverage = coverage(inputArray, l, appear);

        if( !Optimized.find(function(rp){ return s(rp.pattern) === s(newPattern); }) ){
          newPattern = { 'pattern': newPattern, 'appear': appear, 'coverage': RPcoverage, 'similarity': similarity  };
          newPattern.patternScore = scoreSimple(newPattern.coverage, l, inputArray.length, similarity );
          
          if (newPattern.patternScore > maxScore) {
            maxScore = newPattern.patternScore;
            Optimized = [ newPattern ];  
          } else if ( newPattern.patternScore === maxScore ) {
            Optimized.push(newPattern);    
          }
         
        } 
      }
    }
  }
  

  return Optimized;
}
function distance(trArray, uniqTransitionSets){
  return trArray.reduce(function(prev,curr){ 
          prev += uniqTransitionSets[curr].tr.cost 
          return prev; },0);
}
function coverage(array, Patternlength, appear){
  var s, coverage = 0;
  for (var i = 0; i < appear.length-1; i++) {
    s=i;
    while ( appear[i] + Patternlength > appear[i+1] ) {
      i++;
    }
    coverage += appear[i] + Patternlength - appear[s];

  };
  if (i===appear.length-1) { 
    coverage += Patternlength;
  };

  return coverage / array.length;
}

function isSameSub(array, i1, f1, i2, f2, uniqTransitionSets) {
  var similarity = 0;
  for (var i = 0; i < (f1-i1+1); i++) {
    similarity += isSameTr(uniqTransitionSets[array[i1+i]], uniqTransitionSets[array[i2+i]] )
  }
  return similarity / (f1-i1+1);

  // for (var i = 0; i < (f1-i1+1); i++) {
  //   if (array[i1+i] !== array[i2+i]) {
  //     return false;
  //   }
  // }
  // return true;
}

function isSameTr(tr1, tr2){
  if (tr1.shorthandDetail === tr2.shorthandDetail ) { 
    return 1.0;
  } else if (tr1.shorthand === tr2.shorthand) { 
    return 0.5;
  } else {
    return 0;
  }
}
function s(a) {
  return JSON.stringify(a);
}
function dup(a) {
  return JSON.parse(s(a));
}

// console.log(PatternOptimizer("231111".split(''),[1,1,1,1]));
// console.log(coverage("sdsdxxxasdsdsdaasdsdsdsdsdsdsdsd".split(''), 2, [ 0, 2, 8, 10, 12, 16, 18, 20, 22, 24, 26, 28, 30 ]))
module.exports = {
  PatternOptimizer: PatternOptimizer
};
