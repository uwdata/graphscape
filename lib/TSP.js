var fs = require('fs');

'use strict'
function TSP(matrix, value, fixFirst){
  var head,sequences;
  function enumSequences(arr){
    var out = [];
    if (arr.length === 1) {
      out.push(arr);
      return out;
    }
    else {
      for (var i = 0; i < arr.length; i++) {
        var arrTemp = JSON.parse(JSON.stringify(arr));
        var head = arrTemp.splice(i,1);
        enumSequences(arrTemp).map(function(seq){
          out.push(head.concat(seq));
        });
      }
      return out;
    }
  }

  var sequence = matrix[0].map(function(elem, i){
    return i;
  });

  if (!isNaN(fixFirst)) {
    head = sequence.splice(fixFirst,1);
    sequences = enumSequences(sequence).map(function(elem){
      return head.concat(elem);
    });
    
  }
  else{
    sequences = enumSequences(sequence);
  }

  var minDistance = Infinity;
  var argMin = 0;
  var distance = 0;
  var out = [];
  var all = [];
  for (var i = 0; i < sequences.length; i++) {
    if (i*100/sequences.length %10 === 0) {
      // process.std.out(i*100/sequences.length);
    }


    for (var j = 0; j < sequences[i].length-1; j++) {
      distance += matrix[sequences[i][j]][sequences[i][j+1]][value];
    }
    all.push({sequence: sequences[i], distance: distance});

    if (distance <= minDistance ) {

      if (distance === minDistance) {
        out.push({sequence: sequences[i], distance: minDistance});
      }
      else{
        out = [];
        out.push({sequence: sequences[i], distance: distance});
      }
      argMin = i;
      minDistance = distance;
      // console.log(i,minDistance);
    }
    distance = 0;
  }

  return {out: out, all: all};
}


// var matrix = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
// var fixFirst = Number(process.argv[3]);

// console.log(TSP(matrix,"rank",fixFirst));

module.exports = {
  TSP: TSP
};
