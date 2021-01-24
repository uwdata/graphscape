"use strict";
const expect = require('chai').expect;
const EXAMPLES = require("../exampleLoader").examples; //TODO!
const { enumerate, scaleModifier } = require("../../src/path/enumerate");
const {copy} = require("../../src/util");
const getTransition = require('../../src/transition/trans.js').transition


describe("enumerate", () => {
  it("Should enumerate the keyframe sets of N keyframes for the given start and end specs.", async () => {
    const sSpec = {
      "mark": "bar",
      "encoding": {"x": {"field": "A", "type": "quantitative", "aggregate": "mean"}}
    }
    const eSpec = {
      "mark": "point",
      "transform": [{"filter": {"field": "A", "gt": 10}}],
      "encoding": {"x": {"field": "A", "type": "quantitative"}}
    }
    const transition = await getTransition(copy(sSpec),  copy(eSpec))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(sSpec, eSpec, editOps, 1)

    expect(sequences.length).to.eq(6)
  });


  it("Should enumerate the keyframe with merged scales.", async () => {
    const {start, end} = EXAMPLES.filter_aggregate;
    const transition = await getTransition(copy(start),  copy(end))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(start, end, editOps, 1)
    expect(sequences.length).to.eq(2)
    expect(sequences[0].sequence[1].encoding.x.scale.domain).to.deep.eq([0,100])
    expect(sequences[1].sequence[1].encoding.x.scale.domain).to.deep.eq([0,100])
  });

  it("Should enumerate valid sequences.", async () => {
    const {start, end} = EXAMPLES.addY_aggregate_scale;
    const transition = await getTransition(copy(start),  copy(end))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(start, end, editOps, 1)
    expect(sequences.length).to.eq(2) // applying only "SCALE" edit op should be ignored.

  });

  it("Should only enumerate valid sequences having valid Vega-Lite specs.", async () => {
    const start = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": {"url": "data/penguins.json"},
      "mark": "point",
      "encoding": {
        "x": {
          "field": "Flipper Length (mm)",
          "type": "quantitative"
        },
        "y": {
          "field": "Body Mass (g)",
          "type": "quantitative"
        },
        "color": {"field": "Species", "type": "nominal"}
      }
    };
    const end = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": {"url": "data/penguins.json"},
      "mark": "point",
      "encoding": {
        "x": {
          "field": "Flipper Length (mm)",
          "type": "quantitative",
          "bin": true
        },
        "y": {
          "field": "Body Mass (g)",
          "type": "quantitative",
          "bin": true
        },
        "size": {"field": "*", "type": "quantitative", "aggregate": "count"}
      }
    }
    const transition = await getTransition(copy(start),  copy(end))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];


    let sequences = await enumerate(start, end, editOps, 1)
    expect(sequences.length).to.eq(1) // applying only "SCALE" edit op should be ignored.

  });

});


describe("scaleModifier", () => {
  it("Should return the scale domains that covering the start and end visualizations.", async () => {
    const sSpec = {
      "mark": "bar",
      "data": {"values": [{"A": 10}, {"A": 20}]},
      "encoding": {
        "x": {"field": "A", "type": "quantitative", "scale": {"zero": false}}
      }
    }
    const eSpec = {
      "mark": "bar",
      "data": {"values": [{"A": 10}, {"A": 20}]},
      "encoding": {
        "x": {"field": "A", "type": "quantitative"}
      }
    }

    let newScaleDomains = await scaleModifier(sSpec, eSpec)
    expect(newScaleDomains.x).to.deep.eq([0, 20])
  });
});

