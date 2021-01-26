const {copy} = require("../util");
const { enumerate } = require( "./enumerate");
const { evaluate } = require( "./evaluate");
const getTransition = require('../transition/trans.js').transition
async function path(sSpec, eSpec, transM=0) {
  validateInput(sSpec, eSpec);

  const transition = await getTransition(copy(sSpec),  copy(eSpec))
  const editOps = [
    ...transition.mark,
    ...transition.transform,
    ...transition.encoding
  ];
  let result = {}
  if (transM === 0 ) {
    for (let m = 1; m <= editOps.length; m++) {
      result[m] = await enumAndEval(sSpec, eSpec, editOps, m)
    }
    return result;
  }

  return await enumAndEval(sSpec, eSpec, editOps, transM)
}
exports.path = path;

async function enumAndEval(sSpec, eSpec, editOps, transM) {
  let result = await enumerate(sSpec, eSpec, editOps, transM)
  return result.map((seq) => {
    return {
      ...seq,
      eval: evaluate(seq.editOpPartition)
    }
  }).sort((a,b) => { return b.eval.score - a.eval.score})
}

function validateInput(sSpec, eSpec) {
  //check if specs are single-view vega-lite chart
  if (!isValidVLSpec(sSpec) || !isValidVLSpec(eSpec)) {
    return { error: "Gemini++ cannot recommend keyframes for the given Vega-Lite charts."}
  }
}
exports.validateInput = validateInput;

function isValidVLSpec(spec) {
  if (spec.layer || spec.hconcat || spec.vconcat || spec.concat || spec.spec) {
    return false;
  }
  if (spec.$schema && (spec.$schema.indexOf("https://vega.github.io/schema/vega-lite") >= 0)){
    return true
  }
  return false

}
exports.isValidVLSpec = isValidVLSpec;