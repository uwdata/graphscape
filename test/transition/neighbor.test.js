"use strict";
var expect = require('chai').expect;
var editOpSet = require('../editOpSetForTest');
var trans = require('../../src/transition/trans');
var util = require('../../src/util');

var Type = require('vega-lite/src/type').Type;
var AggregateOp = require('vega-lite/src/aggregate').AggregateOp;
var neighbor = require('../../src/transition/neighbor');

describe('transition.neighbor', function () {
  it('should return all neighbors linked by encdoeTransition.', function () {
    var testVL = {
      "data": { "url": "data/cars.json" },
      "mark": "tick",
      "encoding": {
        "x": { "field": "Horsepower", "type": "quantitative" }
      }
    };
    var additionalFields = [{ "field": "Origin", "type": Type.ORDINAL }];
    var additionalChannels = ["y"];

    var result = neighbor.neighbors(testVL, additionalFields, additionalChannels, editOpSet.DEFAULT_EDIT_OPS.encodingEditOps);
    expect(result.length).to.eq(4);
  });
  it('should return neighbors with _COUNT edit operations correctly', function () {
    var testVL = {
      "data": { "url": "data/cars.json" },
      "mark": "tick",
      "encoding": {
        "x": { "field": "*", "type": "quantitative", "aggregate": "count" }
      }
    };
    var additionalFields = [{ "field": "*", "type": Type.QUANTITATIVE, "aggregate": AggregateOp.COUNT }];
    var additionalChannels = ["y"];
    var result = neighbor.neighbors(testVL, additionalFields, additionalChannels, editOpSet.DEFAULT_EDIT_OPS.encodingEditOps);
    expect(result[0].editOp.name).to.eq("REMOVE_X_COUNT");
    expect(result[2].editOp.name).to.eq("ADD_Y_COUNT");
  });
  it('should return only a neighbor with SWAP_X_Y edit operations', function () {
    var testVL = {
      "encoding": {
        "column": { "field": "Cylinders", "type": "ordinal" },
        "x": {
          "field": "Origin", "type": "nominal",
          "axis": { "labels": false, "title": "", "tickSize": 0 }
        },
        "y": { "scale": 'hey', "aggregate": "mean", "field": "Acceleration", "type": "quantitative" },
      }
    };
    var additionalFields = [];
    var additionalChannels = [];
    var result = neighbor.neighbors(testVL, additionalFields, additionalChannels, editOpSet.DEFAULT_EDIT_OPS.encodingEditOps);
    expect(result[2].editOp.name).to.eq("SWAP_X_Y");
    expect(result.length).to.eq(4);
  });
  it('should return neighbors regardless redundant additionalFields', function () {
    var testVL = {
      "encoding": {
        "x": {
          "type": "quantitative",
          "field": "Acceleration",
          "bin": true
        },
        "y": {
          "type": "quantitative",
          "field": "*",
          "scale": { "type": "log" },
          "aggregate": "count"
        }
      }
    };
    var additionalFields = [
      { "field": "Acceleration", "type": Type.QUANTITATIVE },
      { "field": "Horsepower", "type": Type.QUANTITATIVE }];
    var additionalChannels = [];
    var result = neighbor.neighbors(testVL, additionalFields, additionalChannels, editOpSet.DEFAULT_EDIT_OPS.encodingEditOps);
    expect(result.length).to.eq(6);
  });
});
//# sourceMappingURL=neighbor.test.js.map