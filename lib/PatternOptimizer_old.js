'use strict'
//PatternOptimizer
function score(coverage, trLengthArray, appear, patternArray){
  var R = patternArray.reduce(function(prev, curr){
    prev += trLengthArray[curr]
    return prev;
  },0);
  R = patternArray.length / R;

  return Math.round(1000000*(1-1/appear.length)*R*coverage)/1000000;
}

function PatternOptimizer(inputArray, trLengthArray) {
  var Optimized = [], maxScore = 0;
  for (var l = 1; l <= inputArray.length; l++) {
    
    for (var i = 0; i < inputArray.length-l+1; i++) {
      var appear = [i];
      for (var j = 0; j < inputArray.length-l+1; j++) {
        if ( i !== j && isSameSub(inputArray, i, i + (l-1), j, j + (l-1))) {        
          appear.push(j);
        }
      }
      var overlap = false;
      var rythmic = true;
      var period = 0;
      for (var k = 0; k < appear.length-1; k++) {
        if(appear[k+1] - appear[k] < l){
          overlap = true;
          break;
        }
        if(period !== 0 && period !== appear[k+1] - appear[k]){
          rythmic = false;
          break;
        }
        period = appear[k+1] - appear[k];
      }
      var RPcoverage = coverage(inputArray, l, appear);
      if (appear.length && !overlap && rythmic && RPcoverage > 0.34){

        var newPattern = dup(inputArray).splice(i,l);
        var RPcoverage = coverage(inputArray, newPattern.length, appear);

        if( !Optimized.find(function(rp){ return s(rp.pattern) === s(newPattern); }) ){
          newPattern = { 'pattern': newPattern, 'appear': appear, 'coverage': RPcoverage  };
          newPattern.patternScore = score(newPattern.coverage, trLengthArray, newPattern.appear, newPattern.pattern );
          
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

function isSameSub(array, i1, f1, i2, f2) {
  for (var i = 0; i < (f1-i1+1); i++) {
    if (array[i1+i] !== array[i2+i]) {
      return false;
    }
  }
  return true;
}
function s(a) {
  return JSON.stringify(a);
}
function dup(a) {
  return JSON.parse(s(a));
}

console.log(PatternOptimizer("1212012".split(''),[1,1,1,1]));
// console.log(coverage("sdsdxxxasdsdsdaasdsdsdsdsdsdsdsd".split(''), 2, [ 0, 2, 8, 10, 12, 16, 18, 20, 22, 24, 26, 28, 30 ]))
module.exports = {
  PatternOptimizer: PatternOptimizer
};
