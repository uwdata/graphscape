const { filter } = require("d3-array")
const { unique } = require("../util")

exports.HEURISTIC_RULES = [
  {
    name: "filter-then-aggregate",
    type: "A-Then-B",
    editOps: ["FILTER", "AGGREGATE"],
    condition: (filter, aggregate) => {
      return aggregate.detail && aggregate.detail.find(dt => dt.how === "added")
    },
    score: 1
  },
  {
    name: "disaggregate-then-filter",
    type: "A-Then-B",
    editOps: ["AGGREGATE", "FILTER"],
    condition: (aggregate, filter) => {
      return aggregate.detail && aggregate.detail.find(dt => dt.how === "removed")
    },
    score: 1
  },
  {
    name: "filter-then-bin",
    type: "A-Then-B",
    editOps: ["FILTER", "BIN"],
    condition: (filter, bin) => {
      return bin.detail && bin.detail.find(dt => dt.how === "added")
    },
    score: 1
  },
  {
    name: "unbin-then-filter",
    type: "A-Then-B",
    editOps: ["BIN", "FILTER"],
    condition: (bin, filter) => {
      return bin.detail && bin.detail.find(dt => dt.how === "removed")
    },
    score: 1
  },
  {
    name: "no-aggregate-then-bin",
    type: "A-Then-B",
    editOps: ["AGGREGATE", "BIN"],
    condition: (aggregate, bin) => {
      return aggregate.detail && aggregate.detail.find(dt => dt.how === "added")
    },
    score: -1
  },
  {
    name: "no-unbin-then-disaggregate",
    type: "A-Then-B",
    editOps: ["BIN", "AGGREGATE"],
    condition: (bin, aggregate) => {
      return aggregate.detail && aggregate.detail.find(dt => dt.how === "removed")
    },
    score: -1
  },

  {
    name: "encoding(MODIFY)-then-aggregate",
    type: "A-Then-B",
    editOps: ["ENCODING", "AGGREGATE"],
    condition: (encoding, aggregate) => {
      return encoding.name.indexOf("MODIFY") >= 0
        && aggregate.detail
        && aggregate.detail.find(dt => dt.how === "added")
    },
    score: 1
  },
  {
    name: "disaggregate-then-encoding(MODIFY)",
    type: "A-Then-B",
    editOps: ["AGGREGATE", "ENCODING"],
    condition: (aggregate, encoding) => {
      return encoding.name.indexOf("MODIFY") >= 0
        && aggregate.detail
        && aggregate.detail.find(dt => dt.how === "removed")
    },
    score: 1
  },

  {
    name: "encoding(add)-then-aggregate",
    type: "A-Then-B",
    editOps: ["ENCODING", "AGGREGATE"],
    condition: (encoding, aggregate) => {
      return encoding.name.indexOf("ADD") >= 0
        && aggregate.detail
        && aggregate.detail.find(dt => dt.how === "added")
    },
    score: 1
  },
  {
    name: "disaggregate-then-encoding(remove)",
    type: "A-Then-B",
    editOps: ["AGGREGATE", "ENCODING"],
    condition: (aggregate, encoding) => {
      return encoding.name.indexOf("REMOVE") >= 0
        && aggregate.detail
        && aggregate.detail.find(dt => dt.how === "removed")
    },
    score: 1
  },
  {
    name: "no-mark-then-aggregate",
    type: "A-Then-B",
    editOps: ["MARK", "AGGREGATE" ],
    condition: (mark, aggregate) => {

      return aggregate.detail && aggregate.detail.find(dt => dt.how === "added")
    },
    score: -1
  },
  {
    name: "no-disaggregate-then-mark",
    type: "A-Then-B",
    editOps: ["AGGREGATE", "MARK"],
    condition: (aggregate, mark ) => {

      return aggregate.detail && aggregate.detail.find(dt => dt.how === "removed")
    },
    score: -1
  },
  {
    name: "modifying-with-scale",
    type: "A-With-B",
    editOps: ["ENCODING.MODIFY", "SCALE"],
    score: 1
  },
  {
    name: "no-filtering-with-filtering",
    type: "A-With-B",
    editOps: ["FILTER"],
    condition: (editOps) => {

      return unique(editOps.FILTER, f => f.position).length < editOps.FILTER.length
    },
    score: -1
  },
  {
    name: "bin-with-aggregate",
    type: "A-With-B",
    editOps: ["AGGREGATE", "BIN"],
    score: 1
  },
  // {
  //   editOps: [TRANSFORM, ENCODING.REMOVE],
  //   condition: (transform, remove) => {
  //     return transform.detail.field === remove.detail.before.field
  //   },
  //   score: 1
  // },
  // {
  //   editOps: [TRANSFORM, ENCODING.MODIFY],
  //   condition: (transform, modify) => {
  //     return transform.detail.field === modify.detail.after.field
  //   },
  //   score: 1
  // },
  // {
  //   editOps: [TRANSFORM, ENCODING.ADD],
  //   condition: (transform, add) => {
  //     return transform.detail.field === add.detail.after.field
  //   },
  //   score: 1
  // },
  // {
  //   editOps: [ENCODING.MODIFY, TRANSFORM],
  //   condition: (transform, modify) => {
  //     return transform.detail.field === modify.detail.before.field
  //   },
  //   score: 1
  // }
]