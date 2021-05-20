"use strict";
const expect = require('chai').expect;
const EXAMPLES = require("../exampleLoader").examples; //TODO!
const { path, validateInput } = require("../../src/path/index");

describe("path", () => {
  it("should recommend all possible sequences for given start and end VL specs", async () => {

    const {start, end} = EXAMPLES.filter_aggregate;
    let sequences = await path(start, end);

    expect(sequences["2"].length).to.eq(2);
    expect(sequences["3"]).to.eq(undefined);
  })

  it("should return an error if the given charts are invalid VL charts.", async () => {
    const {start, end} = EXAMPLES.filter_aggregate;
    let result = validateInput({
      hconcat: [
        {mark: "point", encode: {x: {field: "X"}}}
      ]
    }, end);
    expect(!!result.error).to.eq(true);

  })

  it("should return specs with not merged scale when there are sort edit operations. ", async () => {

    const {start, end} = EXAMPLES.filter_sort;
    let sequences = await path(start, end);
    let scale = sequences['2'][0].sequence[1].encoding.x.scale;
    expect(sequences['2'].length).to.eq(2);
    expect(scale).to.eq(undefined);
  })
})