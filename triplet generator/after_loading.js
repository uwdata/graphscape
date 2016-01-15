var specs;
var specPairs;
var specTriplets;
var compairedDistances;
var tiedSpecs = [];
var visLabel = function countUp(){
  var count = 0;
  return function(){ count+=1; return count; };
}

function drawVegaLites(i, drawingSpecs){
  if (i >= drawingSpecs.length) {
    return i;
  };
  var vgSpec = vl.compile(drawingSpecs[i].vegalite(visData)).spec;
  var resultDiv = $('<div id="vis'+i+'" class="col-md-6 col-lg-3"></div>');
  $('#results').append(resultDiv);

  vg.parse.spec(vgSpec, function(chart) {
    var view = chart({el: '#vis'+i, renderer: 'svg'});
    view.update();
    i += 1;
    drawVegaLites(i, drawingSpecs);
  });
}

$(document).on('ready page:load', function () {
  specs = generatingState();


  // specPairs = enumerateSpecPairs(specs);
  // compairedDistances = runComparating(specPairs);

  specTriplets = enumerateTriplets(specs);
  compairedDistances = runTripletComparating(specTriplets);
  // drawVegaLites(0,specs);

  // var downloadComparedData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(compairedDistances));
  // $('<a href="data:' + downloadComparedData + '" download="data.json">download JSON</a>').appendTo('#download');



  // var tiedCount = 0;
  // var length = compairedDistances.length;
  // var totalCount = (Math.pow(length,2)-length)/2;

  // for (var i = 0; i < compairedDistances.length; i++) {
  //   var distances = compairedDistances[i];
  //   for (var j = 0; j < distances.length; j++) {
  //     var d = distances[j];

  //     if( d === 0 ){
  //       tiedCount += 1;
  //       tiedSpecs.push([specPairs[i][0],specPairs[i][1], specPairs[j+i+1][0],specPairs[j+i+1][1]]);

  //     }
  //   };
  // };

  var tiedCount = 0;
  var determinedCount = [0,0,0,0,0];
  var totalCount = compairedDistances.length;
  for (var i = 0; i < compairedDistances.length; i++) {
    var d = compairedDistances[i];

    if( d.result === 0 ){
      tiedCount += 1;
      tiedSpecs.push(specTriplets[i]);
    }
    else
      determinedCount[d.reason - 1] += 1 ;
  };

  console.log("The number of the triplets having the same distance : " + tiedCount );
  console.log("The number of the triplets : " + totalCount );
  console.log("Each number of the triplets determined by rules respectively : " + determinedCount.toString() );
  console.log(tiedCount / totalCount);


  // runTests();



});
