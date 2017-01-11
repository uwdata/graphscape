"use strict";
var expect = require('chai').expect;
var ruleSet = require('../ruleSetForTest');
var sr = require('../../src/sequence/serialize');
var util = require('../../src/util');

describe('sequence.serialize', function () {
  it('Case 6', function () {
    var charts = [
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
      }
    ];

    var result = sr.serialize(charts, {"fixFirst":false}, ruleSet.DEFAULT_TRANSITIONS);
    
    expect(result.length).to.eq(720);
    expect(result[0].sumOfTransitionCosts).to.eq(21.59);
    expect(result[0].globalWeightingTerm).to.eq( 0.5);
    expect(result[0].sequenceCost).to.eq(10.795);
    
    
  });
})
