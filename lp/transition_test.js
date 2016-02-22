var trans = require('../../compass/src/trans/trans');


var origin = {
    "data": {"url": "data/cars.json"},
    "mark": "bar",
    "encoding": {
      "column": {"field": "Cylinders","type": "ordinal"},
      "x": {
        "field": "Origin", "type": "nominal",
        "axis": {"labels": false, "title": "", "tickSize": 0}
      },
      "y": {"scale": 'hey', "aggregate": "mean", "field": "Acceleration", "type": "quantitative"},
    }
  };

// var destination = {
//   "data": {"url": "data/cars.json"},
//   "mark": "point",
//   "encoding": {
//     "x": {"bin": true, "field": "Displacement", "type": "quantitative"},
//     "y": {"scale": true, "field": "Miles_per_Gallon", "type": "quantitative"},
//     "size": {"aggregate": "count", "field": "*", "type": "quantitative"}
//   }
// };

var destination = {
    "data": {"url": "data/cars.json"},
    "mark": "bar",
    "encoding": {
      "column": {"field": "Cylinders","type": "ordinal"},
      "x": {"scale": 'hey', "aggregate": "mean", "field": "Acceleration", "type": "quantitative"},
      "y": {
        "field": "Origin", "type": "nominal",
        "axis": {"labels": false, "title": "", "tickSize": 0}
      }
    }
  };


// console.log(trans);
var transitons = trans.transitionSet(origin, destination);
console.log(transitons.encoding);

// transitons.encoding.map(function(trnEncoding){
//   console.log(trnEncoding)
// });


// transitons.transform.map(function(trnTransform){
//   console.log(trnTransform)
// });
