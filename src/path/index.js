const {copy} = require("../util");
const { enumerate } = require( "./enumerate");
const { evaluate } = require( "./evaluate");
const getTransition = require('../transition/trans.js').transition
async function path(sSpec, eSpec, N=0) {
  validateInput(sSpec, eSpec);

  const transition = await getTransition(copy(sSpec),  copy(eSpec))
  const editOps = [
    ...transition.mark,
    ...transition.transform,
    ...transition.encoding
  ];
  let result = {}
  if (N === 0 ) {
    for (let n = 1; n < editOps.length; n++) {
      result[n] = await enumAndEval(sSpec, eSpec, editOps, n)
    }
    return result;
  }

  return await enumAndEval(sSpec, eSpec, editOps, N)
}
exports.path = path;

async function enumAndEval(sSpec, eSpec, editOps, n) {
  let result = await enumerate(sSpec, eSpec, editOps, n)
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