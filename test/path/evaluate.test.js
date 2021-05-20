"use strict";
const expect = require('chai').expect;
const EXAMPLES = require("../exampleLoader").examples; //TODO!
const { findRules, evaluate } = require("../../src/path/evaluate");
const { enumerate } = require("../../src/path/enumerate");
const {copy} = require("../../src/util");
const getTransition = require('../../src/transition/trans.js').transition

describe("findRules", () => {
  it("Should find satisfying A-Then-B rules.", async () => {

    let found = findRules([
      [{name: "AGGREGATE", type: "transform"}],
      [{name: "FILTER", type: "transform"}]
    ], [
      { editOps: ["FILTER", "AGGREGATE"] }
    ])
    expect(found.length).to.eq(0);


    let rule2 = [{ editOps: ["FILTER", "AGGREGATE"] }];
    let found2 = findRules([
      [{name: "FILTER", type: "transform"}],
      [{name: "AGGREGATE", type: "transform"}]
    ], rule2)
    expect(found2.map(r => r.editOps)).to.deep.eq(rule2.map(r => r.editOps))

    let rule3 = [{ editOps: ["ENCODING", "TRANSFORM"] }];
    let found3 = findRules([
      [{name: "ADD_X", type: "encoding"}],
      [{name: "AGGREGATE", type: "transform"}]
    ], rule3)
    expect(found3.map(r => r.editOps)).to.deep.eq(rule3.map(r => r.editOps))

    let rule4 = [
      { editOps: ["ENCODING", "TRANSFORM"] },
      { editOps: ["FILTER", "AGGREGATE"], condition: (filter, aggregate) => {
        return aggregate.detail && aggregate.detail.how === "added";
      } }
    ];

    let found4 = findRules([
      [{name: "FILTER", type: "transform"}],
      [{name: "AGGREGATE", type: "transform", detail: {"how": "added"}}]
    ], rule4)
    expect(found4.map(r => r.editOps)).to.deep.eq(rule4.slice(1,2).map(r => r.editOps))

  })
  it("Should find satisfying A-With-B rules.", async () => {

    let found = findRules([
      [{name: "FILTER", type: "transform"}],
      [{name: "AGGREGATE", type: "transform"}]
    ], [
      { editOps: ["FILTER", "AGGREGATE"], type: "A-With-B" }
    ])
    expect(found.length).to.eq(0);

    found = findRules(
      [[
        {name: "FILTER", type: "transform"},
        {name: "AGGREGATE", type: "transform"}
      ]],
      [{ editOps: ["FILTER", "AGGREGATE"], type: "A-With-B" }]
    )
    expect(found.length).to.eq(1);

    found = findRules(
      [[
        {name: "FILTER", type: "transform"},
        {name: "MODIFY_X", type: "encoding"}
      ]],
      [{ editOps: ["FILTER", "ENCODING.MODIFY"], type: "A-With-B" }]
    )
    expect(found.length).to.eq(1);
  })
})

describe("evaluate", () => {
  const sSpec = {
    "mark": "bar",
    "encoding": {"x": {"field": "A", "type": "quantitative", "aggregate": "mean"}}
  }
  const eSpec = {
    "mark": "point",
    "transform": [{"filter": {"field": "A", "gt": 10}}],
    "encoding": {"x": {"field": "A", "type": "quantitative"}}
  }


  it("should promote the one filtering after dis-aggregating", async () => {
    const transition = await getTransition(copy(sSpec),  copy(eSpec))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(sSpec, eSpec, editOps, 3)
    sequences = sequences.map((seq) => {
      return {
        ...seq,
        eval: evaluate(seq.editOpPartition)
      }
    }).sort((a,b) => { return b.eval.score - a.eval.score})

    expect((sequences[0].eval.satisfiedRules.length)).to.eq(1);
    expect((sequences[0].eval.satisfiedRules[0].name)).to.eq("disaggregate-then-filter")

    expect((sequences[2].eval.satisfiedRules[1].name)).to.eq("no-disaggregate-then-mark")
  })


  it("should promote the one adding encoding before aggregating", async () => {
    const sSpec = {
      "mark": "point",
      "encoding": {"x": {"field": "A", "type": "quantitative"}}
    }
    const eSpec = {
      "mark": "point",
      "encoding": {
        "x": {"field": "A", "type": "quantitative", "aggregate": "mean"},
        "y": {"field": "B", "type": "quantitative"}
      }
    }
    const transition = await getTransition(sSpec, eSpec)

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(sSpec, eSpec, editOps, 2)

    sequences = sequences.map((seq) => {
      return {
        ...seq,
        eval: evaluate(seq.editOpPartition)
      }
    }).sort((a,b) => { return b.eval.score - a.eval.score})

    expect((sequences[0].eval.satisfiedRules.length)).to.eq(1);
    expect((sequences[0].eval.satisfiedRules[0].name)).to.eq("encoding(add)-then-aggregate")
  })

  it("should promote the one filtering before binning", async () => {
    const sSpec = {
      "mark": "point",
      "encoding": {"x": {"field": "A", "type": "quantitative"}}
    }
    const eSpec = {
      "mark": "point",
      "transform": [{"filter": {"field": "A", "gt": 10}}],
      "encoding": {
        "x": {"field": "A", "type": "quantitative", "bin": true}
      }
    }
    const transition = await getTransition(sSpec, eSpec)

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let sequences = await enumerate(sSpec, eSpec, editOps, 2)

    sequences = sequences.map((seq) => {
      return {
        ...seq,
        eval: evaluate(seq.editOpPartition)
      }
    }).sort((a,b) => { return b.eval.score - a.eval.score})

    expect((sequences[0].eval.satisfiedRules.length)).to.eq(1);
    expect((sequences[0].eval.satisfiedRules[0].name)).to.eq("filter-then-bin")
  })

  it("Should promote the one modifying and scaling together.", async () => {
    const sSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": {"url": "data/r2d3.json"},
      "transform": [{"calculate": "datum.in_sf ? 'SF' : 'NY'", "as": "Location"}],
      "mark": {"type": "tick", "width": 100},
      "encoding": {
        "color": {
          "field": "Location",
          "type": "nominal",
          "scale": {"domain": ["SF", "NY"]}
        },
        "y": {
          "field": "elevation",
          "type": "quantitative",
          "axis": {"title": "Elevation (ft)"}
        },
        "x": {
          "field": "Location",
          "type": "nominal",
          "scale": {"domain": ["SF", "NY"]}
        }
      },
      "width": 200
    }
    const eSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": {"url": "data/r2d3.json"},
      "transform": [{"calculate": "datum.in_sf ? 'SF' : 'NY'", "as": "Location"}],
      "mark": "point",
      "encoding": {
        "color": {
          "field": "Location",
          "type": "nominal",
          "scale": {"domain": ["SF", "NY"]}
        },
        "y": {
          "field": "elevation",
          "type": "quantitative",
          "axis": {"title": "Elevation (ft)"}
        },
        "x": {
          "field": "price_per_sqft",
          "type": "quantitative",
          "axis": {"title": "Price / Sqft"}
        }
      }
    }
    const transition = await getTransition(copy(sSpec),  copy(eSpec))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let {sequences, excludedPaths} = await enumerate(sSpec, eSpec, editOps, 2, true)

    sequences = sequences.map((seq) => {
      return {
        ...seq,
        eval: evaluate(seq.editOpPartition)
      }
    }).sort((a,b) => { return b.eval.score - a.eval.score})


    expect(sequences[0].eval.score).to.eq(1)
    expect(sequences[0].eval.satisfiedRules.length).to.eq(1)
    expect(sequences[0].eval.satisfiedRules[0].name).to.eq('modifying-with-scale')

  });

  it("Should demote the one applying 2+ filters.", async () => {
    const {sequence} = EXAMPLES.filter_and_filter;
    const sSpec = sequence[0], eSpec = sequence[1]
    const transition = await getTransition(copy(sSpec),  copy(eSpec))

    const editOps = [
      ...transition.mark,
      ...transition.transform,
      ...transition.encoding
    ];

    let {sequences, excludedPaths} = await enumerate(copy(sSpec), copy(eSpec), copy(editOps), 1, true)

    sequences = sequences.map((seq) => {
      return {
        ...seq,
        eval: evaluate(seq.editOpPartition)
      }
    }).sort((a,b) => { return b.eval.score - a.eval.score})



    let seqs2 = (await enumerate(sSpec, eSpec, editOps, 2, true)).sequences
      .map((seq) => {
      return { ...seq, eval: evaluate(seq.editOpPartition) }
    }).sort((a,b) => { return b.eval.score - a.eval.score})

    expect(seqs2[0].eval.score).to.eq(0);
  })
})