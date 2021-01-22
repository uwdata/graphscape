"use strict";
const expect = require('chai').expect;
const editOpSet = require('../editOpSetForTest');
const trans = require('../../src/transition/trans');
const apply = require('../../src/transition/apply');
const util = require('../../src/util');
var startVL = {
  "data": { "url": "/data/cars.json" },
  "mark": "area",
  "transform": [{ "filter": "datum.Year > 1970 " }],
  "encoding": {
    "x": { "type": "temporal", "field": "Year", "timeUnit": "year" },
    "y": { "type": "quantitative",
      "field": "*",
      "aggregate": "count"
    },
    "color": { "type": "nominal", "field": "Origin" }
  }
};
var destinationVL = {
  "data": { "url": "/data/cars.json" },
  "mark": "point",
  "encoding": {
    "x": { "type": "quantitative", "field": "Horsepower", "scale": { "type": "log" } },
    "y": {
      "type": "quantitative",
      "field": "Acceleration",
      "scale": { "type": "log" }
    },
    "color": { "type": "ordinal", "field": "Origin" }
  }
};
describe('transition.apply', function () {
  describe('applyMarkEditOp', function () {
    it('should apply a mark edit operation correctly.', function () {
      const markEditOp = trans.markEditOps(startVL, destinationVL, editOpSet.DEFAULT_EDIT_OPS["markEditOps"])[0];
      const iSpec = apply.applyMarkEditOp(startVL, destinationVL, markEditOp)

      expect(iSpec.mark).to.eq(destinationVL.mark);

    });
  });

  describe('applyTransformEditOp', function () {
    it('should apply SCALE and AGGREGATE edit operations correctly.', function () {
      const scaleEditOp = trans.transformBasic(startVL, destinationVL, "y", "SCALE", editOpSet.DEFAULT_EDIT_OPS["transformEditOps"]);
      const aggEditOp = trans.transformBasic(startVL, destinationVL, "y", "AGGREGATE", editOpSet.DEFAULT_EDIT_OPS["transformEditOps"]);


      let iSpec = apply.applyTransformEditOp(startVL, destinationVL, scaleEditOp)
      expect(iSpec.encoding.y.scale).to.eq(destinationVL.encoding.y.scale);

      iSpec = apply.applyTransformEditOp(iSpec, destinationVL, aggEditOp)
      expect(iSpec.encoding.y.aggregate).to.eq(destinationVL.encoding.y.aggregate);

    });

    it('should apply ADD_FILTER/REMOVE_FILTER/MODIFY_FILTER edit operations correctly.', function () {
      const filterEditOps = {
        "MODIFY_FILTER": editOpSet.DEFAULT_EDIT_OPS["transformEditOps"]["MODIFY_FILTER"],
        "ADD_FILTER": editOpSet.DEFAULT_EDIT_OPS["transformEditOps"]["ADD_FILTER"],
        "REMOVE_FILTER": editOpSet.DEFAULT_EDIT_OPS["transformEditOps"]["REMOVE_FILTER"]
      };
      let _startVL = {
          "transform": [
            {"filter": {"not": {"field": "x", "oneOf": [1,2]}}},
            {
              "filter": {
                  "and": [
                  {"field": "y", "oneOf": [1,2]},
                  {"field": "y", "oneOf": [3,2]}
                ]
              }
            }
        ]

      }
      let _endVL = {
        "transform": [
          {"filter": {"field": "z", "oneOf": [1,2]}},
          {"filter": {"not": {"field": "x", "oneOf": [1,22]}}}
        ]
      }
      const editOps = trans.filterEditOps(_startVL, _endVL, filterEditOps);

      expect(editOps.length).to.eq(3);
      let addFilterOp = editOps.find(eo => eo.name === "ADD_FILTER")
      let iSpec = apply.applyTransformEditOp(_startVL, _endVL, addFilterOp)
      expect(iSpec.transform.length).to.eq(3);
      let removeFilterOp = editOps.find(eo => eo.name === "REMOVE_FILTER")
      iSpec = apply.applyTransformEditOp(iSpec, _endVL, removeFilterOp)
      expect(iSpec.transform.find(trsfm=> trsfm.filter.and)).to.eq(undefined);

      let modifyFilterOp = editOps.find(eo => eo.name === "MODIFY_FILTER")
      iSpec = apply.applyTransformEditOp(iSpec, _endVL, modifyFilterOp)

      expect(iSpec.transform.find(trsfm=> trsfm.filter.not).filter.not.oneOf[1]).to.eq(22);


    });
  });


  describe('applyEncodingEditOp', function () {
    it('should apply a REMOVE_Channel edit operation correctly.', function () {
      let startVL = {"encoding": {"x": {"field": "A", "type": "nominal"}}};
      const removeEditOp = trans.encodingEditOps(
        util.duplicate(startVL),
        {"encoding": {}},
        editOpSet.DEFAULT_EDIT_OPS["encodingEditOps"])[0];

      let iSpec = apply.applyEncodingEditOp(startVL, destinationVL, removeEditOp)

      expect(JSON.stringify(iSpec.encoding)).to.eq("{}")
      expect(() => {
        apply.applyEncodingEditOp(iSpec, destinationVL, removeEditOp);
      }).to.throw();
    });

    it('should apply a ADD edit operation correctly.', function () {
      let startVL = {"encoding": {}};
      let endVL = {"encoding": {"x": {"field": "A", "type": "nominal"}}}
      const addEditoOp = trans.encodingEditOps(
        util.duplicate(startVL),
        util.duplicate(endVL),
        editOpSet.DEFAULT_EDIT_OPS["encodingEditOps"])[0];

      let iSpec = apply.applyEncodingEditOp(startVL, endVL, addEditoOp)

      expect(iSpec.encoding.x.field).to.eq("A")
      expect(() => {
        apply.applyEncodingEditOp(iSpec, endVL, addEditoOp);
      }).to.throw();
    });

    it('should apply a MOVE edit operation correctly.', function () {
      let startVL = {"encoding": {"y": {"field": "A", "type": "nominal"}}};
      let endVL = {"encoding": {"x": {"field": "A", "type": "nominal"}}}
      const moveEditoOp = trans.encodingEditOps(
        util.duplicate(startVL),
        util.duplicate(endVL),
        editOpSet.DEFAULT_EDIT_OPS["encodingEditOps"])[0];

      let iSpec = apply.applyEncodingEditOp(startVL, endVL, moveEditoOp)

      expect(iSpec.encoding.x.field).to.eq("A")
      expect(iSpec.encoding.y).to.eq(undefined)
      expect(() => {
        apply.applyEncodingEditOp(iSpec, endVL, moveEditoOp);
      }).to.throw();
    });

    it('should apply a MODIFY edit operation correctly.', function () {
      let startVL = {"encoding": {"y": {"field": "A", "type": "nominal"}}};
      let endVL = {"encoding": {"y": {"field": "B", "type": "nominal", "aggregate": "mean"}}}
      const modifyEditOp = trans.encodingEditOps(
        util.duplicate(startVL),
        util.duplicate(endVL),
        editOpSet.DEFAULT_EDIT_OPS["encodingEditOps"])[0];

      let iSpec = apply.applyEncodingEditOp(startVL, endVL, modifyEditOp)

      expect(iSpec.encoding.y.field).to.eq("B")
      expect(iSpec.encoding.y.aggregate).to.eq(undefined)
    });

    it('should apply a SWAP edit operation correctly.', function () {
      let startVL = {
        "encoding": {
          "x": {"field": "A", "type": "nominal"},
          "y": {"field": "B", "type": "nominal", "aggregate": "mean"}
        }
      };
      let endVL = {
        "encoding": {
          "y": {"field": "A", "type": "nominal"},
          "x": {"field": "B", "type": "nominal", "aggregate": "mean"}
        }
      }
      const swapEditOp = trans.encodingEditOps(
        util.duplicate(startVL),
        util.duplicate(endVL),
        editOpSet.DEFAULT_EDIT_OPS["encodingEditOps"])[0];

      let iSpec = apply.applyEncodingEditOp(startVL, endVL, swapEditOp)

      expect(iSpec.encoding.x.field).to.eq("B")
      expect(iSpec.encoding.y.aggregate).to.eq(undefined)
    });

  });
  describe('apply', function () {
    it('should apply a REMOVE_Channel edit operation correctly.', async function () {
      let startVL = {"encoding": {"x": {"field": "A", "type": "nominal"}}};
      let endVL = {"encoding": {"y": {"field": "A", "type": "quantitative", "aggregate": "mean" }}};
      const editOps = await trans.transition(
        util.duplicate(startVL),
        util.duplicate(endVL),
        editOpSet.DEFAULT_EDIT_OPS
        );

      expect(() => {
        apply.apply(startVL, endVL, editOps.transform);
      }).to.throw();
      let iSpec = apply.apply(startVL, endVL, editOps.encoding.concat(editOps.transform))
      expect(iSpec).to.deep.equal(endVL)

    });

    it.only('should return an error if the resulted spec is invalid.', async function () {
      let startVL = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "data": {"url": "data/penguins.json"},
        "mark": "point",
        "encoding": {
          "x": { "field": "A", "type": "quantitative"},
          "color": {"field": "Species", "type": "nominal"}
        }
      };
      let endVL = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "data": {"url": "data/penguins.json"},
        "mark": "point",
        "encoding": {
          "x": { "field": "A", "type": "quantitative", "bin": true },
          "size": {"field": "*", "type": "nominal", "aggregate": "count"}
        }
      };
      const editOps = await trans.transition(
        util.duplicate(startVL),
        util.duplicate(endVL),
        editOpSet.DEFAULT_EDIT_OPS
        );

      const eos = [...editOps.encoding, editOps.transform.find(eo => eo.name === 'AGGREGATE')];
      expect(() => {
        apply.apply(util.duplicate(startVL), endVL, eos);
      }).to.throw(`The resulted spec is not valid Vega-Lite Spec.`);

      const eos2 = [...editOps.encoding];

      expect(() => {
        apply.apply(util.duplicate(startVL), endVL, eos2);
      }).to.throw(`_COUNT encoding edit operations cannot be applied without AGGREGATE.`);

    });
  });

});