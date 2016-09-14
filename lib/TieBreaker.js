//Longest Repeated Pattern


function TieBreaker(result, transitionSetsFromEmptyVis) {
	var TBScore = 0;
	var reasons = {};
  var weights = [1, 10];
  //rule#1 FILTER_MODIFY, same field, same op, ascending numeric values > descending
  var continued = { };
  var filterState = {};
  var filterScore = [];
  var filterSequenceCost = 0;
  for (var i = 0; i < result.specs.length; i++) {
    let spec = result.specs[i];
    if (!!spec.transform && !!spec.transform.filter) {
      let filter;
      if (Array.isArray(spec.transform.filter)) {
        for (var j = 0; j < spec.transform.filter.length; j++) {

          filter = spec.transform.filter[j];
          if (!!filter.field && !!filter.equal ) {
            if (!!filterState[filter.field]) {
              filterState[filter.field].push(filter.equal);
            } else {
              filterState[filter.field] = [filter.equal] ;
              filterScore.push({ "field": filter.field, "score": 0});
            }
          }

        }
      }
    }
  }
  
  for (var i = 0; i < filterScore.length; i++) {
    for (var j = 1; j < filterState[filterScore[i].field].length; j++) {
      if ( filterState[filterScore[i].field][j-1] < filterState[filterScore[i].field][j] ) {
        filterScore[i].score += 1;  
      } else if (filterState[filterScore[i].field][j-1] > filterState[filterScore[i].field][j] ){
        filterScore[i].score -= 1;  
      }
    }

    filterSequenceCost += Math.abs(filterScore[i].score + 0.1) / ( filterState[filterScore[i].field].length - 1 + 0.1 );
  }

  filterSequenceCost = filterScore.length > 0 ? 1 - filterSequenceCost / filterScore.length : 0;
  
  console.log(filterSequenceCost);
  
  // Object.keys(sortingScore).forEach(function(key){
  //   TBScore += Math.abs(sortingScore[key]);
  // })
  // reasons["Filter values are sorted."] = TBScore;

  // //rule#2 Simpler charts should be placed earlier.
  // var costsFromEmpty = transitionSetsFromEmptyVis.map(function(tr){ return tr.cost;});
  // function sortNumber(a,b) {
  //     return a - b;
  // }
  // var sortedCostsFromEmpty = costsFromEmpty.slice(0).sort(sortNumber);
  // function closenessRankFromEmpty(specIndex){
  //   var result = sortedCostsFromEmpty.indexOf(costsFromEmpty[specIndex]);
  //   sortedCostsFromEmpty[result] = -1;
  //   return result+1;
  // }
  // var N = result.sequence.length;
  // var rule2TBScore = 0;
  // result.sequence.forEach(function(specIndex, index){
  //   var ri = closenessRankFromEmpty(specIndex);
  //   rule2TBScore += ri * (index+1);
  // });
  // rule2TBScore = rule2TBScore / ( (N * (N + 1) * (2*N + 1)) / 6 );
  // TBScore += rule2TBScore * weights[1];
  // reasons["Simpler charts should be placed front."] = rule2TBScore;

  return { 'tiebreakCost' : filterSequenceCost, 'reasons': filterScore };
}


var result = {"specs":[{
    "data": {
      "url": "data/cars.json",
      "formatType": "json"
    },
    "mark": "point",
    "encoding": {
      "x": {
        "field": "Miles_per_Gallon",
        "axis": {"title": "Miles per Gallon"},
        "type": "quantitative"
      },
      "y": {
        "field": "Origin",
        "type": "nominal"
      }
    }
  },
{
    "data": {
      "url": "data/cars.json",
      "formatType": "json"
    },
    "mark": "point",
    "encoding": {
      "x": {
        "field": "Miles_per_Gallon",
        "axis": {"title": "Avg. Miles per Gallon"},
        "type": "quantitative",
        "aggregate": "mean"
      },
      "y": {
        "field": "Origin",
        "type": "nominal"
      }
    }
  },
{
    "data": {
      "url": "data/cars.json",
      "formatType": "json"
    },
    "mark": "point",
    "encoding": {
      "x": {
        "field": "Miles_per_Gallon",
        "axis": {"title": "Miles per Gallon"},
        "type": "quantitative"
      },
      "y": {
        "field": "Cylinders",
        "type": "nominal"
      }
    }
  },
{
    "data": {
      "url": "data/cars.json",
      "formatType": "json"
    },
    "mark": "point",
    "encoding": {
      "x": {
        "field": "Miles_per_Gallon",
        "axis": {"title": "Avg. Miles per Gallon"},
        "type": "quantitative",
        "aggregate": "mean"
      },
      "y": {
        "field": "Cylinders",
        "type": "nominal"
      }
    }
  },
{
    "data": {
      "url": "data/cars.json",
      "formatType": "json"
    },
    "mark": "point",
    "encoding": {
      "x": {
        "field": "Miles_per_Gallon",
        "axis": {"title": "Miles per Gallon"},
        "type": "quantitative"
      },
      "y": {
        "field": "Cylinders",
        "type": "nominal"
      },
      "color": {
        "field": "Origin",
        "type": "nominal"
      }
    }
  },
{
    "data": {
      "url": "data/cars.json",
      "formatType": "json"
    },
    "mark": "point",
    "encoding": {
      "x": {
        "field": "Miles_per_Gallon",
        "axis": {"title": "Avg. Miles per Gallon"},
        "type": "quantitative",
        "aggregate": "mean"
      },
      "y": {
        "field": "Cylinders",
        "type": "nominal"
      },
      "color": {
        "field": "Origin",
        "type": "nominal"
      }
    }
  }]};
TieBreaker(result);

module.exports = {
  TieBreaker: TieBreaker
};
