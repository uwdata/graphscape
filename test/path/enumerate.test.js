"use strict";
const expect = require('chai').expect;
const EXAMPLES = require("../exampleLoader").examples; //TODO!
const { enumerate, getMergedScale } = require("../../src/path/enumerate");
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

    let sequences = await enumerate(sSpec, eSpec, editOps, 2)

    expect(sequences.length).to.eq(6)
  });

  it("Should enumerate 1 transition for give specs.", async () => {
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

    expect(sequences.length).to.eq(1)
  });


  it("Should enumerate the keyframe with merged scales.", async () => {
    const {start, end} = EXAMPLES.filter_aggregate;
    const transition = await getTransition(copy(start),  copy(end))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(start, end, editOps, 2)
    expect(sequences.length).to.eq(2)
    expect(sequences[0].sequence[1].encoding.x.scale.domain).to.deep.eq([0,100])
    expect(sequences[1].sequence[1].encoding.x.scale.domain).to.deep.eq([0,100])
  });

  it("Should enumerate the keyframe with merged scales for temporal data.", async () => {
    const {sequence} = EXAMPLES.filter_and_filter;
    const transition = await getTransition(copy(sequence[0]),  copy(sequence[1]))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(sequence[0], sequence[1], editOps, 2)

    expect(sequences[0].sequence[1].encoding.x.scale.domain).to.deep.eq([ 1583107200000, 1613260800000 ])
    // expect(sequences[1].sequence[1].encoding.x.scale.domain).to.deep.eq([0,100])
  });

  it("Should enumerate valid sequences.", async () => {
    const {start, end} = EXAMPLES.addY_aggregate_scale;
    const transition = await getTransition(copy(start),  copy(end))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(start, end, editOps, 2)
    expect(sequences.length).to.eq(6) // applying only "SCALE" edit op should be ignored.

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


    let sequences = await enumerate(start, end, editOps, 2)
    expect(sequences.length).to.eq(1) // applying only "SCALE" edit op should be ignored.

  });

  it("Should enumerate proper paths having 3 edit ops for 2 stages.", async () => {
    const sSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": {"url": "test/data/sample_kc_house_data.json"},
      "mark": "point",
      "transform": [
        {"calculate": "datum.price/datum.sqft_living", "as": "price_per_sqft"}
      ],
      "encoding": {
        "x": {"field": "price", "type": "quantitative"},
        "y": {
          "field": "sqft_living",
          "type": "quantitative",
          "scale": {"zero": false},
          "axis": {"labelFlush": true}
        },
        "color": {"field": "bedrooms", "type": "nominal"}
      }
    }
    const eSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": {"url": "test/data/sample_kc_house_data.json"},
      "mark": "bar",
      "transform": [
        {"calculate": "datum.price/datum.sqft_living", "as": "price_per_sqft"}
      ],
      "encoding": {
        "x": {"field": "bedrooms", "type": "nominal"},
        "y": {
          "field": "sqft_living",
          "type": "quantitative",
          "scale": {"zero": false},
          "aggregate": "mean"
        },
        "color": {"field": "bedrooms", "type": "nominal"}
      }
    }
    const transition = await getTransition(copy(sSpec),  copy(eSpec))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let {sequences, excludedPaths} = await enumerate(sSpec, eSpec, editOps, 2, true)

    expect(sequences.length).to.eq(4)

    expect(!!excludedPaths[0].editOpPartition[0].find(eo => eo.name === "AGGREGATE")).to.eq(true)
    expect(!!excludedPaths[0].editOpPartition[0].find(eo => eo.name === "MODIFY_X")).to.eq(false)

    expect(!!excludedPaths[1].editOpPartition[0].find(eo => eo.name === "AGGREGATE")).to.eq(true)
    expect(!!excludedPaths[1].editOpPartition[0].find(eo => eo.name === "MODIFY_X")).to.eq(false)

  });


});


describe("getMergedScale", () => {
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

    let newScaleDomains = await getMergedScale([sSpec, eSpec])
    expect(newScaleDomains.x).to.deep.eq([0, 20])
  });

  it("Should return the scale domains that covering the start and end visualizations.", async () => {
    const sSpec = {
      "mark": "bar",
      "data": {"values": [{"A": 10}, {"A": 20}]},
      "encoding": {
        "x": {
          "field": "A",
          "type": "nominal",
          "scale": {"domain": ["NY"]}
        }
      }
    }
    const eSpec = {
      "mark": "bar",
      "data": {"values": [{"A": 10}, {"A": 20}]},
      "encoding": {
        "x": {
          "field": "A",
          "type": "nominal"
        }
      }
    }

    let newScaleDomains = await getMergedScale([sSpec, eSpec])

    expect(newScaleDomains.x).to.deep.eq([ "NY", 10, 20])
  });


});

