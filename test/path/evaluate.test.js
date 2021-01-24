"use strict";
const expect = require('chai').expect;
const { findRules, evaluate } = require("../../src/path/evaluate");
const { enumerate } = require("../../src/path/enumerate");
const {copy} = require("../../src/util");
const getTransition = require('../../src/transition/trans.js').transition

describe("findRules", () => {
  it("Should find the rules statisfied by the given edit operation partition.", async () => {

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

    let sequences = await enumerate(sSpec, eSpec, editOps, 2)
    sequences = sequences.map((seq) => {
      return {
        ...seq,
        eval: evaluate(seq.editOpPartition)
      }
    }).sort((a,b) => { return b.eval.score - a.eval.score})

    expect((sequences[0].eval.satisfiedRules.length)).to.eq(2);
    expect((sequences[0].eval.satisfiedRules[0].name)).to.eq("disaggregate-then-filter")
    expect((sequences[0].eval.satisfiedRules[1].name)).to.eq("mark-then-disaggregate")
  })
})