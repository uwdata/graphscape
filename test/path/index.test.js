"use strict";
const expect = require('chai').expect;
const EXAMPLES = require("../exampleLoader").examples; //TODO!
const { recommendKeyframes, cannotRecommendKeyframes } = require("../../src/path/index");

describe("recommendKeyframes", () => {
  it("should recommend all possible sequences for given start and end VL specs", async () => {

    const {start, end} = EXAMPLES.filter_aggregate;
    let sequences = await recommendKeyframes(start, end);
    expect(sequences["1"].length).to.eq(2);
    expect(sequences["2"]).to.eq(undefined);
  })

  it("should return an error if the given charts are invalid VL charts.", async () => {
    const {start, end} = EXAMPLES.filter_aggregate;
    let result = cannotRecommendKeyframes({
      hconcat: [
        {mark: "point", encode: {x: {field: "X"}}}
      ]
    }, end);
    expect(!!result.error).to.eq(true);

  })

})