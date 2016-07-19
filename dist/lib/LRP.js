'use strict'
//Longest Repeated Pattern


function LRP(inputArray, value) {
  var longestRepeatedPattern = [], maxLength=0, maxCoverage=0;
  for (var l = 1; l <= inputArray.length; l++) {
    
    for (var i = 0; i < inputArray.length-l+1; i++) {
      var appear = [i];
      for (var j = i + 1; j < inputArray.length-l+1; j++) {
        if (isSameSub(inputArray, i, i + (l-1), j, j + (l-1))) {        
          appear.push(j);
          
        }
      }
      if (appear.length > 1){
        var newRP = dup(inputArray).splice(i,l);
        var RPcoverage = coverage(inputArray, newRP.length, appear);

        if( !longestRepeatedPattern.find(function(rp){ return s(rp.pattern) === s(newRP); }) ){
          newRP = { 'pattern': newRP, 'appear': appear, 'coverage': RPcoverage  };
          if ( value === 'coverage' ) {
            if (RPcoverage > maxCoverage) {
              maxCoverage = RPcoverage;
              maxLength = l;
              longestRepeatedPattern = [ newRP ];  
            } else if ( RPcoverage === maxCoverage ) {
              if (l > maxLength) {
                maxLength = l;
                longestRepeatedPattern = [ newRP ];  
              } else if (l ===maxLength){
                longestRepeatedPattern.push(newRP);    
              }
            };
          } else if (value === 'length'){
            if (l > maxLength) {
              maxLength = l;
              maxCoverage = RPcoverage;
              longestRepeatedPattern = [ newRP ];
            } else if(l === maxLength) {
              if (RPcoverage > maxCoverage) {
                maxCoverage = RPcoverage;
                longestRepeatedPattern = [ newRP ];  
              } else if ( RPcoverage === maxCoverage ) {
                longestRepeatedPattern.push(newRP);
              };
            }
          }
        }
      }
    };
  };

  return longestRepeatedPattern;
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

// console.log(LRP("sdsd xxxx".split(''),'coverage'));
// console.log(coverage("sdsdxxxasdsdsdaasdsdsdsdsdsdsdsd".split(''), 2, [ 0, 2, 8, 10, 12, 16, 18, 20, 22, 24, 26, 28, 30 ]))
module.exports = {
  LRP: LRP
};
