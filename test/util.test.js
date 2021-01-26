"use strict";
const expect = require('chai').expect;
const {partition, permutate} = require("../src/util");

describe("partition", () => {
  it("Should enumerate all possible partitions properly", () => {
    let parts = partition([0,1,2,3], 1);
    expect(parts).to.deep.eq([[[0,1,2,3]]]);

    let partsBy2 = [
      [[0],[1,2,3]],
      [[1],[0,2,3]],
      [[2],[0,1,3]],
      [[3],[0,1,2]],
      [[0,1],[2,3]],
      [[0,3],[1,2]],
      [[0,2],[1,3]],
    ]
    expect(partition([0,1,2,3], 2).length).to.deep.eq(partsBy2.length);
  })
})
describe("permute", () => {
  it.only("Should enumerate all possible permutations properly", () => {
    let permutations = permutate([0,1]);


    expect(permutations.length).to.deep.eq(2);

    permutations = permutate([0]);
    expect(permutations).to.deep.eq([[0]]);
  })
})